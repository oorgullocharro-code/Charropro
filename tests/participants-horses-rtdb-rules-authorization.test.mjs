import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rawRules = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const tournamentRules = JSON.parse(rawRules).rules.charropro.tournaments.$tournamentId;

assert.ok(tournamentRules.participants, "participants must have an explicit private branch");
assert.ok(tournamentRules.horses, "horses must have an explicit private branch");
assert.match(tournamentRules.participants[".write"], /role'\)\.val\(\) === 'supervisor'/);
assert.match(tournamentRules.participants[".write"], /role'\)\.val\(\) === 'operador'/);
assert.match(tournamentRules.horses[".write"], /role'\)\.val\(\) === 'supervisor'/);
assert.match(tournamentRules.horses[".write"], /role'\)\.val\(\) === 'operador'/);
assert.match(tournamentRules.participants.$participantKey[".validate"], /tournamentId'\)\.val\(\) === \$tournamentId/);
assert.match(tournamentRules.horses.$horseKey[".validate"], /tournamentId'\)\.val\(\) === \$tournamentId/);
assert.equal(tournamentRules[".write"].includes("participants"), false, "tournament root authorization remains unchanged");
assert.equal(tournamentRules.officialScoreLedger[".write"], false, "Official Score ledger remains server-owned");
assert.equal(tournamentRules.officialScoreAudit[".write"], false, "Official Score audit remains server-owned");

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runRulesMatrix();
}

console.log("participants-horses-rtdb-rules-authorization.test.mjs: ok");

async function runRulesMatrix() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `participant-horse-rules-${suffix}`;
  const supervisor = await createUser(authHost, `supervisor-${suffix}`);
  const judge = await createUser(authHost, `judge-${suffix}`);

  try {
    await ownerPut(databaseHost, namespace, `charropro/users/${supervisor.uid}`, userProfile("supervisor"));
    await ownerPut(databaseHost, namespace, `charropro/users/${judge.uid}`, userProfile("juez"));

    const baseUpdate = tournamentUpdate(tournamentId);
    assert.equal((await clientPatch(databaseHost, namespace, `charropro/tournaments/${tournamentId}`, supervisor.token, baseUpdate)).status, 200, "empty participant and horse registries allow canonical tournament creation");

    const horseWithoutRegistry = horse("horse-normal", tournamentId, "El Guero");
    assert.equal((await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/horses/0`, supervisor.token, horseWithoutRegistry)).status, 200, "horse without a registry is allowed");

    const horseWithAqha = horse("horse-aqha", tournamentId, "La Mora", { registryType: "AQHA", registryNumber: "1234567" });
    assert.equal((await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/horses/1`, supervisor.token, horseWithAqha)).status, 200, "horse with optional AQHA registry is allowed");

    const participantWithHorse = participant("participant-juan", tournamentId, "Juan Perez", horseWithoutRegistry.id);
    assert.equal((await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/participants/0`, supervisor.token, participantWithHorse)).status, 200, "participant with horseId is allowed");

    const invalidParticipant = { ...participant("participant-invalid", tournamentId, "Invalido", horseWithoutRegistry.id), active: "true" };
    assertDenied(await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/participants/1`, supervisor.token, invalidParticipant), "invalid participant");

    const invalidHorse = { ...horse("horse-invalid", tournamentId, "Invalido"), unexpected: true };
    assertDenied(await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/horses/2`, supervisor.token, invalidHorse), "invalid horse");

    assertDenied(await anonymousPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/participants/1`, participant("participant-anon", tournamentId, "Anonimo", horseWithoutRegistry.id)), "anonymous participant write");
    assertDenied(await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/horses/2`, judge.token, horse("horse-judge", tournamentId, "No autorizado")), "judge horse write");

    for (const [branch, value] of Object.entries({
      teams: [],
      charreadas: [],
      settings: { scoringButtonLayouts: {} },
      history: [],
      meta: { version: 1 }
    })) {
      assert.equal((await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/${branch}`, supervisor.token, value)).status, 200, `${branch} private branch regression`);
    }
  } finally {
    await ownerDelete(databaseHost, namespace, `charropro/tournaments/${tournamentId}`);
    await ownerDelete(databaseHost, namespace, `charropro/users/${supervisor.uid}`);
    await ownerDelete(databaseHost, namespace, `charropro/users/${judge.uid}`);
    await deleteUser(authHost, supervisor.token);
    await deleteUser(authHost, judge.token);
  }
}

function tournamentUpdate(tournamentId) {
  return {
    teams: [],
    participants: [],
    horses: [],
    charreadas: [],
    history: [],
    settings: {},
    "meta/schemaVersion": 1,
    "meta/version": 0,
    "info/id": tournamentId,
    "info/name": "Coleadero de reglas",
    "info/type": "coleadero",
    "info/category": "Libre",
    "info/status": "preparacion"
  };
}

function participant(id, tournamentId, participantName, horseId) {
  return { id, tournamentId, participantName, horseId, charroId: "", category: "Libre", association: "", active: true };
}

function horse(id, tournamentId, displayName, registry = {}) {
  return {
    id,
    tournamentId,
    displayName,
    ...(registry.registryType ? { registryType: registry.registryType } : {}),
    ...(registry.registryNumber ? { registryNumber: registry.registryNumber } : {}),
    registryVerified: false
  };
}

function userProfile(role) {
  return { active: true, role, tournamentAccess: "all", tournamentIds: [] };
}

async function createUser(authHost, label) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-participant-horse-rules`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${label}@example.test`, password: "LocalRules-pass-123", returnSecureToken: true })
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  const value = JSON.parse(body);
  return { uid: value.localId, token: value.idToken };
}

async function deleteUser(authHost, token) {
  await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:delete?key=local-participant-horse-rules`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
}

async function clientPut(host, namespace, path, token, value) {
  return clientWrite(host, namespace, path, token, "PUT", value);
}

async function clientPatch(host, namespace, path, token, value) {
  return clientWrite(host, namespace, path, token, "PATCH", value);
}

async function anonymousPut(host, namespace, path, value) {
  return clientWrite(host, namespace, path, "", "PUT", value);
}

async function clientWrite(host, namespace, path, token, method, value) {
  const auth = token ? `&auth=${encodeURIComponent(token)}` : "";
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}${auth}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  return { status: response.status, body: await response.text() };
}

async function ownerPut(host, namespace, path, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT",
    headers: { authorization: "Bearer owner", "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerDelete(host, namespace, path) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "DELETE",
    headers: { authorization: "Bearer owner" }
  });
  assert.equal(response.ok, true, await response.text());
}

function assertDenied(result, label) {
  assert.ok([401, 403].includes(result.status), `${label} must be denied; got ${result.status}: ${result.body}`);
}
