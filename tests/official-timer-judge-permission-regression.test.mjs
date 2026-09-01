import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyOfficialTimerCommand,
  createOfficialTimerContext
} from "../js/core/timerRules.js?v=20260831-official-ranking-authority-public-parity-001-v1";
import {
  BRAKE_REVIEW_ACTIONS,
  applyBrakeReviewCommand,
  getBrakeReviewStateFromTimer
} from "../js/core/brakeReviewPhase.js?v=20260831-official-ranking-authority-public-parity-001-v1";

const rawRules = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const timerRule = JSON.stringify(JSON.parse(rawRules).rules.charropro.tournaments.$tournamentId.officialTimers.$timerKey);
assert.doesNotMatch(timerRule, /officialElapsedMs'\)\.val\(\) <= newData\.child\('durationMs/);
assert.match(timerRule, /officialElapsedMs'\)\.val\(\) >= 0/);
assert.match(timerRule, /newData\.child\('revision'\)\.val\(\) === data\.child\('revision'\)\.val\(\) \+ 1/);
assert.match(timerRule, /newData\.child\('controllerUid'\)\.val\(\) === auth\.uid/);
assert.match(timerRule, /userTournamentAccess/);

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runRulesMatrix();
}

console.log("official-timer-judge-permission-regression.test.mjs: ok");

async function runRulesMatrix() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `timer-rules-${suffix}`;
  const judge = await createUser(authHost, `judge-${suffix}`);
  const inactive = await createUser(authHost, `inactive-${suffix}`);
  const wrongTournament = await createUser(authHost, `wrong-tournament-${suffix}`);
  const intruder = await createUser(authHost, `intruder-${suffix}`);
  const cleanupPaths = [
    `charropro/tournaments/${tournamentId}`,
    `charropro/users/${judge.uid}`,
    `charropro/users/${inactive.uid}`,
    `charropro/users/${wrongTournament.uid}`,
    `charropro/users/${intruder.uid}`,
    `charropro/userTournamentAccess/${judge.uid}`,
    `charropro/userTournamentAccess/${wrongTournament.uid}`,
    `charropro/userTournamentAccess/${intruder.uid}`
  ];

  try {
    await ownerPut(databaseHost, namespace, `charropro/users/${judge.uid}`, userAccess("juez", true, tournamentId));
    await ownerPut(databaseHost, namespace, `charropro/userTournamentAccess/${judge.uid}`, { [tournamentId]: true });
    await ownerPut(databaseHost, namespace, `charropro/users/${inactive.uid}`, userAccess("juez", false, tournamentId));
    await ownerPut(databaseHost, namespace, `charropro/users/${wrongTournament.uid}`, userAccess("juez", true, "other-tournament"));
    await ownerPut(databaseHost, namespace, `charropro/userTournamentAccess/${wrongTournament.uid}`, { "other-tournament": true });
    await ownerPut(databaseHost, namespace, `charropro/users/${intruder.uid}`, userAccess("juez", true, tournamentId));
    await ownerPut(databaseHost, namespace, `charropro/userTournamentAccess/${intruder.uid}`, { [tournamentId]: true });

    const T0 = Date.parse("2026-08-29T12:00:00.000Z");
    const before = definition(tournamentId, `before-zero-${suffix}`, 20_000);
    const beforePath = timerPath(tournamentId, before.timerId);
    const judgeActor = actor(judge.uid);
    const judgeController = controller(judge.uid, `judge-controller-${suffix}`);
    let beforeTimer = createOfficialTimerContext(before, { now: T0 });
    beforeTimer = transition(beforeTimer, before, "START", judgeActor, judgeController, T0 + 1_000, "before-start");
    assert.equal(await putTimer(databaseHost, namespace, beforePath, judge.token, beforeTimer, judge.uid), 200, "START before zero");
    beforeTimer = transition(beforeTimer, before, "PAUSE", judgeActor, judgeController, T0 + 6_000, "before-pause");
    assert.equal(await putTimer(databaseHost, namespace, beforePath, judge.token, beforeTimer, judge.uid), 200, "PAUSE before zero");
    beforeTimer = transition(beforeTimer, before, "RESUME", judgeActor, judgeController, T0 + 7_000, "before-resume");
    assert.equal(await putTimer(databaseHost, namespace, beforePath, judge.token, beforeTimer, judge.uid), 200, "RESUME before zero");
    beforeTimer = transition(beforeTimer, before, "FINISH", judgeActor, judgeController, T0 + 10_000, "before-finish");
    assert.equal(await putTimer(databaseHost, namespace, beforePath, judge.token, beforeTimer, judge.uid), 200, "FINISH before zero");

    const overtime = definition(tournamentId, `overtime-${suffix}`, 20_000);
    const overtimePath = timerPath(tournamentId, overtime.timerId);
    let overtimeTimer = createOfficialTimerContext(overtime, { now: T0 });
    overtimeTimer = transition(overtimeTimer, overtime, "START", judgeActor, judgeController, T0 + 1_000, "overtime-start");
    assert.equal(await putTimer(databaseHost, namespace, overtimePath, judge.token, overtimeTimer, judge.uid), 200);
    overtimeTimer = transition(overtimeTimer, overtime, "PAUSE", judgeActor, judgeController, T0 + 22_000, "overtime-pause");
    assert.equal(overtimeTimer.officialElapsedMs, 21_000);
    assert.equal(await putTimer(databaseHost, namespace, overtimePath, judge.token, overtimeTimer, judge.uid), 200, "PAUSE in overtime");
    const staleOvertime = clone(overtimeTimer);
    overtimeTimer = transition(overtimeTimer, overtime, "RESUME", judgeActor, judgeController, T0 + 23_000, "overtime-resume");
    assert.equal(await putTimer(databaseHost, namespace, overtimePath, judge.token, overtimeTimer, judge.uid), 200, "RESUME in overtime");
    overtimeTimer = transition(overtimeTimer, overtime, "FINISH", judgeActor, judgeController, T0 + 26_000, "overtime-finish");
    assert.ok(overtimeTimer.officialElapsedMs > overtimeTimer.durationMs);
    assert.equal(await putTimer(databaseHost, namespace, overtimePath, judge.token, overtimeTimer, judge.uid), 200, "FINISH in overtime");

    const unauthorizedPayload = payload(transition(
      createOfficialTimerContext(definition(tournamentId, `inactive-${suffix}`, 20_000), { now: T0 }),
      definition(tournamentId, `inactive-${suffix}`, 20_000), "START", actor(inactive.uid), controller(inactive.uid, "inactive"), T0 + 1_000, "inactive-start"
    ), inactive.uid);
    assertDenied(await clientPut(databaseHost, namespace, timerPath(tournamentId, unauthorizedPayload.timerId), inactive.token, unauthorizedPayload), "inactive user");

    const wrongPayloadDefinition = definition(tournamentId, `wrong-${suffix}`, 20_000);
    const wrongPayload = payload(transition(createOfficialTimerContext(wrongPayloadDefinition, { now: T0 }), wrongPayloadDefinition, "START", actor(wrongTournament.uid), controller(wrongTournament.uid, "wrong"), T0 + 1_000, "wrong-start"), wrongTournament.uid);
    assertDenied(await clientPut(databaseHost, namespace, timerPath(tournamentId, wrongPayload.timerId), wrongTournament.token, wrongPayload), "wrong tournament");

    assertDenied(await clientPut(databaseHost, namespace, overtimePath, judge.token, payload(staleOvertime, judge.uid)), "stale revision");

    const forgedController = payload({
      ...overtimeTimer,
      revision: overtimeTimer.revision + 1,
      controllerId: "intruder-controller",
      controllerUid: intruder.uid,
      actor: actor(intruder.uid),
      updatedAt: new Date(T0 + 27_000).toISOString()
    }, intruder.uid);
    assertDenied(await clientPut(databaseHost, namespace, overtimePath, intruder.token, forgedController), "invalid controller");

    const alteredDuration = payload({
      ...overtimeTimer,
      revision: overtimeTimer.revision + 1,
      durationMs: overtimeTimer.durationMs + 1,
      updatedAt: new Date(T0 + 27_000).toISOString()
    }, judge.uid);
    assertDenied(await clientPut(databaseHost, namespace, overtimePath, judge.token, alteredDuration), "duration mutation");

    const invalidPayload = payload({
      ...overtimeTimer,
      revision: overtimeTimer.revision + 1,
      updatedAt: new Date(T0 + 27_000).toISOString()
    }, judge.uid);
    delete invalidPayload.actor;
    assertDenied(await clientPut(databaseHost, namespace, overtimePath, judge.token, invalidPayload), "invalid payload");

    const brake = definition(tournamentId, `brake-review-${suffix}`, 180_000, "freno_review");
    const brakePath = timerPath(tournamentId, brake.timerId);
    let brakeTimer = createOfficialTimerContext(brake, { now: T0 });
    brakeTimer = transition(brakeTimer, brake, "START", judgeActor, judgeController, T0 + 1_000, "brake-start");
    assert.equal(await putTimer(databaseHost, namespace, brakePath, judge.token, brakeTimer, judge.uid), 200);
    brakeTimer = transition(brakeTimer, brake, "FINISH", judgeActor, judgeController, T0 + 181_001, "brake-finish");
    const currentReview = getBrakeReviewStateFromTimer(brakeTimer, { ...brake, timerRevision: brakeTimer.revision });
    const synced = applyBrakeReviewCommand(currentReview, {
      action: BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL,
      commandId: `brake-sync-${suffix}`,
      expectedRevision: currentReview.revision,
      elapsedMs: brakeTimer.officialElapsedMs,
      timerRevision: brakeTimer.revision,
      actor: judgeActor
    }, { actor: judgeActor, context: brake, now: T0 + 181_001 });
    assert.equal(synced.ok, true);
    brakeTimer = { ...brakeTimer, brakeReview: synced.review };
    assert.ok(brakeTimer.officialElapsedMs > brakeTimer.durationMs);
    assert.equal(await putTimer(databaseHost, namespace, brakePath, judge.token, brakeTimer, judge.uid), 200, "Brake Review SYNC_TEMPORAL in overtime");
  } finally {
    for (const path of cleanupPaths) await ownerDelete(databaseHost, namespace, path);
    for (const user of [judge, inactive, wrongTournament, intruder]) await deleteUser(authHost, user.token);
  }
}

function definition(tournamentId, timerId, durationMs, contextType = "coleadero") {
  return {
    timerId,
    contextType,
    label: contextType === "freno_review" ? "Revision de freno" : "Coleadero",
    durationMs,
    tournamentId,
    competitionId: "equipos_completo",
    charreadaId: "charreada-a",
    teamId: "team-a",
    participantId: "participant-a",
    suerteId: contextType === "freno_review" ? "cala" : "colas"
  };
}

function transition(timer, timerDefinition, type, timerActor, timerController, now, commandId) {
  const result = applyOfficialTimerCommand(timer, {
    type,
    commandId,
    controller: timerController,
    actor: timerActor
  }, {
    definition: timerDefinition,
    now,
    expectedRevision: timer.revision,
    requireCommandId: true,
    enforceOwnership: true,
    autoClaim: true
  });
  assert.equal(result.ok, true, `${type} must be accepted by Timer Authority`);
  return result.timer;
}

function actor(uid) {
  return { id: uid, uid, name: "Juez local", role: "juez" };
}

function controller(uid, controllerId) {
  return { controllerId, controllerUid: uid, controllerRole: "juez", controllerSessionId: `${controllerId}-session`, controllerType: "field_remote" };
}

function payload(timer, uid) {
  return clone({ ...timer, timerKey: firebaseTimerKey(timer.timerId), actor: actor(uid) });
}

async function putTimer(host, namespace, path, token, timer, uid) {
  return (await clientPut(host, namespace, path, token, payload(timer, uid))).status;
}

function timerPath(tournamentId, timerId) {
  return `charropro/tournaments/${tournamentId}/officialTimers/${firebaseTimerKey(timerId)}`;
}

function userAccess(role, active, tournamentId) {
  return { active, role, tournamentAccess: "selected", tournamentIds: [tournamentId] };
}

async function createUser(authHost, label) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-rules-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${label}@example.test`, password: `LocalRules-${label}`, returnSecureToken: true })
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  const value = JSON.parse(body);
  return { uid: value.localId, token: value.idToken };
}

async function deleteUser(authHost, token) {
  await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:delete?key=local-rules-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
}

async function clientPut(host, namespace, path, token, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}&auth=${encodeURIComponent(token)}`, {
    method: "PUT",
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

function firebaseTimerKey(timerId) {
  return String(timerId).replace(/[.#$[\]\/]/g, "_").replace(/[^A-Za-z0-9_:@-]/g, "_").slice(0, 240);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
