import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8")).rules.charropro;
const rootRead = rules.tournamentIndex[".read"];
const childRead = rules.tournamentIndex.$tournamentId[".read"];

assert.match(rootRead, /tournamentAccess/);
assert.match(rootRead, /!== 'selected'/);
assert.match(childRead, /userTournamentAccess/);
assert.match(childRead, /\$tournamentId/);
assert.match(rules.userTournamentAccess.$uid[".read"], /auth\.uid === \$uid/);
assert.match(rules.tournaments.$tournamentId[".read"], /userTournamentAccess/);

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runRulesChecks();
}

console.log("user-access-bootstrap-rules-emulator.test.mjs: ok");

async function runRulesChecks() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  assert.equal(projectId, "demo-charropro-local");
  assert.equal(JSON.stringify({ projectId, authHost, databaseHost }).includes("charropro-e8a68"), false);

  const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
  const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const suffix = `${Date.now()}-${process.pid}`;
  const app = initializeApp({ projectId }, `access-bootstrap-${suffix}`);
  const auth = getAuth(app);
  const localCredential = ["LocalAccessOnly", suffix].join("-");
  const tournamentA = `access-a-${suffix}`;
  const tournamentB = `access-b-${suffix}`;
  const users = {
    selected: {
      uid: `judge-selected-${suffix}`,
      email: `judge-selected-${suffix}@example.test`,
      profile: { active: true, role: "juez", tournamentAccess: "selected", tournamentIds: [tournamentA] },
      grants: { [tournamentA]: true }
    },
    empty: {
      uid: `judge-empty-${suffix}`,
      email: `judge-empty-${suffix}@example.test`,
      profile: { active: true, role: "juez", tournamentAccess: "selected", tournamentIds: [] },
      grants: {}
    },
    inactive: {
      uid: `judge-inactive-${suffix}`,
      email: `judge-inactive-${suffix}@example.test`,
      profile: { active: false, role: "juez", tournamentAccess: "selected", tournamentIds: [tournamentA] },
      grants: { [tournamentA]: true }
    },
    supervisor: {
      uid: `supervisor-${suffix}`,
      email: `supervisor-${suffix}@example.test`,
      profile: { active: true, role: "supervisor", tournamentAccess: "all", tournamentIds: [] },
      grants: {}
    }
  };

  try {
    for (const user of Object.values(users)) {
      await auth.createUser({ uid: user.uid, email: user.email, password: localCredential, emailVerified: true });
      await ownerWrite(databaseHost, namespace, `charropro/users/${user.uid}`, user.profile);
      await ownerWrite(databaseHost, namespace, `charropro/userTournamentAccess/${user.uid}`, user.grants);
      user.token = await signIn(authHost, user.email, localCredential);
    }
    for (const tournamentId of [tournamentA, tournamentB]) {
      await ownerWrite(databaseHost, namespace, `charropro/tournamentIndex/${tournamentId}`, {
        id: tournamentId,
        name: tournamentId,
        status: "en_vivo"
      });
      await ownerWrite(databaseHost, namespace, `charropro/tournaments/${tournamentId}`, {
        info: { id: tournamentId, name: tournamentId },
        teams: {},
        charreadas: {}
      });
    }

    await expectRead(databaseHost, namespace, `charropro/users/${users.selected.uid}`, users.selected.token, true);
    await expectRead(databaseHost, namespace, `charropro/userTournamentAccess/${users.selected.uid}`, users.selected.token, true);
    await expectRead(databaseHost, namespace, "charropro/tournamentIndex", users.selected.token, false);
    await expectRead(databaseHost, namespace, `charropro/tournamentIndex/${tournamentA}`, users.selected.token, true);
    await expectRead(databaseHost, namespace, `charropro/tournamentIndex/${tournamentB}`, users.selected.token, false);
    await expectRead(databaseHost, namespace, `charropro/tournaments/${tournamentA}`, users.selected.token, true);
    await expectRead(databaseHost, namespace, `charropro/tournaments/${tournamentB}`, users.selected.token, false);

    await expectRead(databaseHost, namespace, "charropro/tournamentIndex", users.empty.token, false);
    await expectRead(databaseHost, namespace, `charropro/tournamentIndex/${tournamentA}`, users.empty.token, false);
    await expectRead(databaseHost, namespace, `charropro/tournamentIndex/${tournamentA}`, users.inactive.token, false);
    await expectRead(databaseHost, namespace, "charropro/tournamentIndex", users.supervisor.token, true);
    await expectRead(databaseHost, namespace, "charropro/users", users.supervisor.token, true);
  } finally {
    for (const user of Object.values(users)) {
      await ownerDelete(databaseHost, namespace, `charropro/users/${user.uid}`);
      await ownerDelete(databaseHost, namespace, `charropro/userTournamentAccess/${user.uid}`);
      try { await auth.deleteUser(user.uid); } catch (error) { if (error?.code !== "auth/user-not-found") throw error; }
    }
    for (const tournamentId of [tournamentA, tournamentB]) {
      await ownerDelete(databaseHost, namespace, `charropro/tournamentIndex/${tournamentId}`);
      await ownerDelete(databaseHost, namespace, `charropro/tournaments/${tournamentId}`);
    }
    await deleteApp(app);
  }
}

async function signIn(authHost, email, password) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-access-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  return JSON.parse(body).idToken;
}

async function expectRead(databaseHost, namespace, path, token, allowed) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}&auth=${encodeURIComponent(token)}`);
  assert.equal(response.ok, allowed, `${path}: expected ${allowed ? "ALLOW" : "DENY"}, got ${response.status}`);
  if (!allowed) assert.ok([401, 403].includes(response.status));
}

async function ownerWrite(databaseHost, namespace, path, value) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT",
    headers: { authorization: "Bearer owner", "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerDelete(databaseHost, namespace, path) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "DELETE",
    headers: { authorization: "Bearer owner" }
  });
  assert.equal(response.ok, true, await response.text());
}
