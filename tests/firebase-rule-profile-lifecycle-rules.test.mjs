import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8")).rules.charropro;
const functionSource = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
const serviceSource = await readFile(new URL("../functions/ruleProfileLifecycleService.js", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../functions/package.json", import.meta.url), "utf8"));
const defaults = JSON.parse(await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));

assert.ok(rules.ruleProfileLifecycle, "the dedicated lifecycle namespace exists");
assert.equal(rules.ruleProfileLifecycle[".read"], false, "clients cannot read internal lifecycle state directly");
assert.equal(rules.ruleProfileLifecycle[".write"], false, "clients cannot write lifecycle state directly");
assert.equal(rules[".write"], false, "the CharroPro root remains fail-closed");
assert.equal(rules.configurationManagement[".write"], false, "configuration authority remains isolated");
assert.equal(rules.backupFoundation[".write"], false, "backup authority remains isolated");
assert.equal(rules.restoreFoundation[".write"], false, "restore authority remains isolated");

assert.equal(defaults.values.firebase.paths.ruleProfileLifecycle, "charropro/ruleProfileLifecycle");
assert.match(functionSource, /exports\.transitionCharroProRuleProfileLifecycle = onCall/);
assert.match(functionSource, /requireRuleProfileLifecycleActor/);
assert.match(functionSource, /createFirebaseRuleProfileLifecycleAdapter/);
assert.match(functionSource, /ruleProfileCertificationRegistry/);
assert.match(serviceSource, /target\.transaction/);
assert.match(serviceSource, /rule-profile-transaction-aborted/);
assert.match(packageJson.scripts.deploy, /functions:transitionCharroProRuleProfileLifecycle/);

// The client policy is intentionally absolute; Admin SDK authority bypasses Rules server-side.
const canDirectClientWrite = () => rules.ruleProfileLifecycle[".write"] === true;
for (const actor of [
  null,
  { authenticated: true, role: "juez" },
  { authenticated: true, role: "supervisor" },
  { authenticated: true, role: "supervisor", platformAdmin: true }
]) {
  assert.equal(canDirectClientWrite(actor), false);
}

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runLifecycleAuthorityAgainstEmulator();
}

console.log("firebase-rule-profile-lifecycle-rules.test.mjs: ok");

async function runLifecycleAuthorityAgainstEmulator() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const authHost = String(process.env.FIREBASE_AUTH_EMULATOR_HOST || "").trim();
  const databaseHost = String(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "").trim();
  const functionsHost = String(process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || "").trim();
  assert.equal(projectId, "demo-charropro-local");
  for (const host of [authHost, databaseHost, functionsHost]) assert.match(host, /^127\.0\.0\.1:\d+$/);
  assert.equal(JSON.stringify(process.env).includes("charropro-e8a68"), false);

  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = databaseHost;
  const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const { getDatabase } = requireFromFunctions("firebase-admin/database");
  const suffix = `${Date.now()}-${process.pid}`;
  const uid = `lifecycle-admin-${suffix}`;
  const email = `${uid}@example.test`;
  const password = "LocalLifecycleOnly-2026!";
  const app = initializeApp({
    projectId,
    databaseURL: `http://${databaseHost}?ns=${projectId}`
  }, `lifecycle-authority-${suffix}`);
  const auth = getAuth(app);
  const database = getDatabase(app);

  try {
    await auth.createUser({ uid, email, password, emailVerified: true });
    await database.ref(`charropro/users/${uid}`).set({
      active: true,
      role: "supervisor",
      platformAdmin: true,
      tournamentAccess: "all"
    });
    const token = await signInToAuthEmulator(authHost, email, password);
    const request = {
      profileId: "FMCH_2026_LIBRE",
      version: "0.6.0",
      requestedTransition: "MARK_READY",
      expectedRevision: 0,
      idempotencyKey: `emulator-ready-${suffix}`,
      effectiveFrom: "2026-09-01T00:00:00.000Z",
      tenantId: "",
      organizationId: ""
    };
    const first = await callLifecycleFunction(functionsHost, projectId, token, request);
    assert.equal(first.ok, true, JSON.stringify(first.body));
    assert.equal(first.body.result.status, "ready");
    assert.equal(first.body.result.revision, 1);
    const retry = await callLifecycleFunction(functionsHost, projectId, token, request);
    assert.equal(retry.ok, true, JSON.stringify(retry.body));
    assert.equal(retry.body.result.idempotent, true);
    assert.equal(retry.body.result.revision, 1);

    const lifecycleSnapshot = await database.ref("charropro/ruleProfileLifecycle").get();
    const lifecycle = lifecycleSnapshot.val();
    const profile = Object.values(lifecycle.profiles)[0];
    const container = Object.values(profile.versions)[0];
    assert.equal(container.state.status, "ready");
    assert.equal(container.state.revision, 1);
    assert.equal(Object.keys(container.audit).length, 1);
    assert.equal(Object.keys(container.requests).length, 1);

    const directWrite = await fetch(`http://${databaseHost}/charropro/ruleProfileLifecycle/client-write.json?ns=${projectId}&auth=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "active" })
    });
    assert.equal(directWrite.ok, false, "an authenticated platform admin still cannot write lifecycle state directly");
    assert.ok([401, 403].includes(directWrite.status));
  } finally {
    await database.ref("charropro/ruleProfileLifecycle").remove();
    await database.ref(`charropro/users/${uid}`).remove();
    try { await auth.deleteUser(uid); } catch (error) { if (error?.code !== "auth/user-not-found") throw error; }
    await deleteApp(app);
  }
}

async function signInToAuthEmulator(authHost, email, password) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-lifecycle-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body.idToken;
}

async function callLifecycleFunction(functionsHost, projectId, token, data) {
  const response = await fetch(`http://${functionsHost}/${projectId}/us-central1/transitionCharroProRuleProfileLifecycle`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ data })
  });
  return { ok: response.ok, status: response.status, body: await response.json() };
}
