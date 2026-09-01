import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8")).rules.charropro;
const functionSource = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
const serviceSource = await readFile(new URL("../functions/ruleProfileLifecycleService.js", import.meta.url), "utf8");
const casSource = await readFile(new URL("../functions/firebaseRestCas.js", import.meta.url), "utf8");
const firebaseSyncSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../functions/package.json", import.meta.url), "utf8"));
const functionsAllowlist = JSON.parse(await readFile(new URL("../tools/release/productionFunctionsAllowlist.json", import.meta.url), "utf8"));
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
assert.match(functionSource, /exports\.getCharroProRuleProfileLifecycle = onCall/);
assert.match(functionSource, /exports\.assignCharroProTournamentRuleProfile = onCall/);
assert.match(functionSource, /requireRuleProfileLifecycleActor/);
assert.match(functionSource, /createFirebaseRuleProfileLifecycleAdapter/);
assert.match(functionSource, /ruleProfileCertificationRegistry/);
assert.match(serviceSource, /createFirebaseRestCas/);
assert.match(serviceSource, /restCas\.compareAndSwap/);
assert.match(casSource, /x-firebase-etag/);
assert.match(casSource, /"if-match"/);
assert.match(casSource, /writeResponse\.status === 412/);
assert.match(serviceSource, /async readProfile\(profileId\)/);
assert.match(casSource, /firebase-rest-cas-retry-exhausted/);
assert.match(packageJson.scripts.deploy, /productionFunctionsDeploy\.mjs deploy/);
assert.deepEqual(functionsAllowlist.authorizedFunctions.filter((name) => name.includes("RuleProfile")), [
  "assignCharroProTournamentRuleProfile",
  "getCharroProRuleProfileLifecycle",
  "transitionCharroProRuleProfileLifecycle"
]);
for (const protectedField of [
  "ruleProfileId",
  "ruleProfileVersion",
  "ruleProfileStatus",
  "ruleProfileContentFingerprint",
  "ruleProfileAssignmentRevision",
  "ruleProfileAssignment"
]) {
  assert.equal(rules.tournaments.$tournamentId.info[protectedField][".write"], false);
}
assert.match(rules.tournaments.$tournamentId.info.$other[".write"], /supervisor/);
assert.match(rules.tournaments.$tournamentId.info.$other[".write"], /operador/);
assert.match(rules.tournaments.$tournamentId.info.$other[".write"], /\$other !== 'ruleProfileId'/);
assert.match(rules.tournaments.$tournamentId.info.$other[".write"], /\$other !== 'ruleProfileAssignment'/);
assert.match(firebaseSyncSource, /omitRuleProfileAssignmentFields\(payloadInfo\)/);
assert.match(firebaseSyncSource, /statePayload\[`info\/\$\{key\}`\]/);
assert.match(firebaseSyncSource, /pickRuleProfileAssignmentFields\(remoteRecord\.info/);

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
  const rulesDatabaseNamespace = `${projectId}-default-rtdb`;
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
  const tournamentId = `tournament-assignment-${suffix}`;
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
    const unauthenticatedRead = await callLifecycleFunction(
      functionsHost,
      projectId,
      "",
      { profileId: "FMCH_2026_LIBRE", version: "0.6.0", tenantId: "", organizationId: "" },
      "getCharroProRuleProfileLifecycle"
    );
    assert.equal(unauthenticatedRead.ok, false);
    assert.equal(unauthenticatedRead.body.error.status, "UNAUTHENTICATED");

    const missingVersionRead = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      { profileId: "FMCH_2026_LIBRE", version: "", tenantId: "", organizationId: "" },
      "getCharroProRuleProfileLifecycle"
    );
    assert.equal(missingVersionRead.ok, false);
    assert.equal(missingVersionRead.body.error.status, "FAILED_PRECONDITION");

    const emptyBeforeRead = await database.ref("charropro/ruleProfileLifecycle").get();
    const initialRead = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      {
        profileId: "FMCH_2026_LIBRE",
        version: "0.6.0",
        tenantId: "",
        organizationId: ""
      },
      "getCharroProRuleProfileLifecycle"
    );
    assert.equal(initialRead.ok, true, JSON.stringify(initialRead.body));
    assert.equal(initialRead.body.result.status, "draft");
    assert.equal(initialRead.body.result.revision, 0);
    assert.equal(initialRead.body.result.fingerprint, "rptp_0f90f7a3944a82d7");
    assert.equal(initialRead.body.result.certification.verdict, "PASS");
    assert.equal(initialRead.body.result.certification.remainingP0, 0);
    assert.equal(initialRead.body.result.certification.activationReadyEligibility, true);
    assert.equal((await database.ref("charropro/ruleProfileLifecycle").get()).exists(), emptyBeforeRead.exists());

    await database.ref(`charropro/users/${uid}`).update({ platformAdmin: false });
    const nonAdminRead = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      { profileId: "FMCH_2026_LIBRE", version: "0.6.0", tenantId: "", organizationId: "" },
      "getCharroProRuleProfileLifecycle"
    );
    assert.equal(nonAdminRead.ok, false);
    assert.equal(nonAdminRead.body.error.status, "PERMISSION_DENIED");
    await database.ref(`charropro/users/${uid}`).update({ active: false, platformAdmin: true });
    const inactiveRead = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      { profileId: "FMCH_2026_LIBRE", version: "0.6.0", tenantId: "", organizationId: "" },
      "getCharroProRuleProfileLifecycle"
    );
    assert.equal(inactiveRead.ok, false);
    assert.equal(inactiveRead.body.error.status, "PERMISSION_DENIED");
    await database.ref(`charropro/users/${uid}`).update({ platformAdmin: true });
    await database.ref(`charropro/users/${uid}`).update({ active: true });
    const request = {
      profileId: "FMCH_2026_LIBRE",
      version: "0.6.0",
      requestedTransition: "MARK_READY",
      expectedRevision: 0,
      idempotencyKey: `emulator-ready-${suffix}`,
      effectiveFrom: "2026-08-01T00:00:00.000Z",
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

    const activeRequest = {
      profileId: "FMCH_2026_LIBRE",
      version: "0.6.0",
      requestedTransition: "ACTIVATE",
      expectedRevision: 1,
      idempotencyKey: `emulator-active-${suffix}`,
      tenantId: "",
      organizationId: ""
    };
    const active = await callLifecycleFunction(functionsHost, projectId, token, activeRequest);
    assert.equal(active.ok, true, JSON.stringify(active.body));
    assert.equal(active.body.result.status, "active");
    assert.equal(active.body.result.revision, 2);

    await database.ref(`charropro/tournaments/${tournamentId}`).set({
      info: { id: tournamentId, name: "Assignment fixture", category: "Libre" },
      teams: {},
      charreadas: {}
    });
    const assignmentRequest = {
      tournamentId,
      profileId: "FMCH_2026_LIBRE",
      version: "0.6.0",
      expectedRevision: 0,
      idempotencyKey: `emulator-assignment-${suffix}`,
      source: "productive-default",
      policyId: "fmch-2026-libre-productive-default-v1",
      reason: "Emulator authority test",
      tenantId: "",
      organizationId: ""
    };
    const assignment = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      assignmentRequest,
      "assignCharroProTournamentRuleProfile"
    );
    assert.equal(assignment.ok, true, JSON.stringify(assignment.body));
    assert.equal(assignment.body.result.assignment.status, "active");
    assert.equal(assignment.body.result.assignment.revision, 1);
    const assignmentRetry = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      assignmentRequest,
      "assignCharroProTournamentRuleProfile"
    );
    assert.equal(assignmentRetry.ok, true, JSON.stringify(assignmentRetry.body));
    assert.equal(assignmentRetry.body.result.idempotent, true);
    assert.equal(assignmentRetry.body.result.revision, 1);

    await writeDatabaseAsOwner(databaseHost, rulesDatabaseNamespace, `charropro/users/${uid}`, {
      active: true,
      role: "supervisor",
      platformAdmin: true,
      tournamentAccess: "all"
    });
    await writeDatabaseAsOwner(databaseHost, rulesDatabaseNamespace, `charropro/tournaments/${tournamentId}`, {
      info: {
        id: tournamentId,
        name: "Assignment fixture",
        category: "Libre",
        ruleProfileId: "FMCH_2026_LIBRE",
        ruleProfileVersion: "0.6.0",
        ruleProfileStatus: "active",
        ruleProfileContentFingerprint: "rptp_0f90f7a3944a82d7",
        ruleProfileAssignmentRevision: 1,
        ruleProfileAssignment: { revision: 1 }
      }
    });

    const protectedWrite = await fetch(`http://${databaseHost}/charropro/tournaments/${tournamentId}/info/ruleProfileId.json?ns=${rulesDatabaseNamespace}&auth=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify("PRODUCT_BASE")
    });
    assert.equal(protectedWrite.ok, false, "even platform admins cannot bypass assignment authority through RTDB");
    assert.ok([401, 403].includes(protectedWrite.status));

    const ordinaryInfoWrite = await fetch(`http://${databaseHost}/charropro/tournaments/${tournamentId}/info/name.json?ns=${rulesDatabaseNamespace}&auth=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify("Updated assignment fixture")
    });
    assert.equal(ordinaryInfoWrite.ok, true, "authorized operational info fields remain writable");

    const flattenedOperationalWrite = await fetch(`http://${databaseHost}/charropro/tournaments/${tournamentId}.json?ns=${rulesDatabaseNamespace}&auth=${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        "info/name": "Flattened assignment fixture",
        "info/status": "preparacion"
      })
    });
    assert.equal(flattenedOperationalWrite.ok, true, "flattened operational sync remains authorized");

    const parentInfoWrite = await fetch(`http://${databaseHost}/charropro/tournaments/${tournamentId}/info.json?ns=${rulesDatabaseNamespace}&auth=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: tournamentId,
        name: "Unsafe parent replacement",
        ruleProfileId: "FMCH_2026_LIBRE",
        ruleProfileVersion: "0.6.0"
      })
    });
    assert.equal(parentInfoWrite.ok, false, "parent writes cannot bypass protected assignment fields");
    assert.ok([401, 403].includes(parentInfoWrite.status));

    await database.ref(`charropro/users/${uid}`).update({ platformAdmin: false });
    const nonAdminAssignment = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      { ...assignmentRequest, tournamentId: `${tournamentId}-other`, idempotencyKey: `emulator-assignment-denied-${suffix}` },
      "assignCharroProTournamentRuleProfile"
    );
    assert.equal(nonAdminAssignment.ok, false);
    assert.equal(nonAdminAssignment.body.error.status, "PERMISSION_DENIED");
    await database.ref(`charropro/users/${uid}`).update({ platformAdmin: true });

    const persistedBeforeRead = structuredClone((await database.ref("charropro/ruleProfileLifecycle").get()).val());
    const persistedRead = await callLifecycleFunction(
      functionsHost,
      projectId,
      token,
      { profileId: "FMCH_2026_LIBRE", version: "0.6.0", tenantId: "", organizationId: "" },
      "getCharroProRuleProfileLifecycle"
    );
    assert.equal(persistedRead.ok, true, JSON.stringify(persistedRead.body));
    assert.equal(persistedRead.body.result.status, "active");
    assert.equal(persistedRead.body.result.revision, 2);
    assert.deepEqual((await database.ref("charropro/ruleProfileLifecycle").get()).val(), persistedBeforeRead);

    const directWrite = await fetch(`http://${databaseHost}/charropro/ruleProfileLifecycle/client-write.json?ns=${rulesDatabaseNamespace}&auth=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "active" })
    });
    assert.equal(directWrite.ok, false, "an authenticated platform admin still cannot write lifecycle state directly");
    assert.ok([401, 403].includes(directWrite.status));

    const directRead = await fetch(`http://${databaseHost}/charropro/ruleProfileLifecycle.json?ns=${rulesDatabaseNamespace}&auth=${encodeURIComponent(token)}`);
    assert.equal(directRead.ok, false, "an authenticated platform admin cannot read lifecycle state directly");
    assert.ok([401, 403].includes(directRead.status));
  } finally {
    await database.ref("charropro/ruleProfileLifecycle").remove();
    const tournaments = await database.ref("charropro/tournaments").get();
    for (const tournamentId of Object.keys(tournaments.val() || {})) {
      if (tournamentId.startsWith("tournament-assignment-")) {
        await database.ref(`charropro/tournaments/${tournamentId}`).remove();
      }
    }
    await database.ref(`charropro/users/${uid}`).remove();
    await deleteDatabaseAsOwner(databaseHost, rulesDatabaseNamespace, `charropro/tournaments/${tournamentId}`);
    await deleteDatabaseAsOwner(databaseHost, rulesDatabaseNamespace, `charropro/users/${uid}`);
    try { await auth.deleteUser(uid); } catch (error) { if (error?.code !== "auth/user-not-found") throw error; }
    await deleteApp(app);
  }
}

async function writeDatabaseAsOwner(databaseHost, namespace, path, value) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT",
    headers: {
      authorization: "Bearer owner",
      "content-type": "application/json"
    },
    body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function deleteDatabaseAsOwner(databaseHost, namespace, path) {
  if (!path || path.endsWith("/")) return;
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "DELETE",
    headers: { authorization: "Bearer owner" }
  });
  assert.equal(response.ok, true, await response.text());
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

async function callLifecycleFunction(functionsHost, projectId, token, data, functionName = "transitionCharroProRuleProfileLifecycle") {
  const response = await fetch(`http://${functionsHost}/${projectId}/us-central1/${functionName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ data })
  });
  return { ok: response.ok, status: response.status, body: await response.json() };
}
