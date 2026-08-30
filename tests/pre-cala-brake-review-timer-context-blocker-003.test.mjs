import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext,
  resolveOfficialTimerSelection
} from "../js/core/timerRules.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import { updateOfficialTimerDomDisplays } from "../js/core/officialTimerLiveDisplay.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import { buildOfficialCurrentTimerContext } from "../js/core/officialTimerOrchestration.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";

const T0 = Date.parse("2026-08-27T12:00:00.000Z");
const tournament = {
  id: "tournament_fmch_061",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileContentFingerprint: "rptp_10e596046446e850",
  effectiveRulesFingerprint: "rptp_10e596046446e850"
};
const base = {
  tournament,
  charreada: { id: "charreada_a", competitionId: "equipos_completo" },
  turn: {
    competition: { id: "equipos_completo", competitionId: "equipos_completo" },
    team: { id: "team_a", name: "Equipo A" }
  }
};
const actor = { id: "judge_a", uid: "judge_a", role: "juez" };
const remote = {
  controllerId: "remote_a",
  controllerUid: actor.uid,
  controllerRole: "juez",
  controllerSessionId: "remote_tab",
  controllerType: "field_remote"
};
const scorer = {
  controllerId: "scorer_a",
  controllerUid: actor.uid,
  controllerRole: "juez",
  controllerSessionId: "scorer_tab",
  controllerType: "scorer_backup"
};

function definitions(suerteId, attemptIndex = 0, coleadorIndex = 0) {
  return buildOfficialTimerDefinitionsFromContext({
    ...base,
    turn: {
      ...base.turn,
      suerte: { id: suerteId, name: suerteId === "cala" ? "Cala de Caballo" : "Coleadero" },
      attemptIndex,
      coleadorIndex
    }
  });
}

const colaOne = definitions("colas", 0, 0)[0];
const colaTwo = definitions("colas", 1, 0)[0];
assert.equal(colaOne.durationMs, 20000, "certified FMCH Coleadero starts at 20 seconds");
assert.equal(colaTwo.durationMs, 20000);
assert.equal(colaOne.temporalRuleSource, "certified_temporal_policy");
assert.notEqual(colaOne.timerId, colaTwo.timerId, "each Coleadero opportunity has an independent timer identity");

let historical = createOfficialTimerContext(colaOne, { now: T0 });
historical = applyOfficialTimerCommand(historical, {
  type: "START", commandId: "cola-1-start", controller: remote, actor
}, {
  definition: colaOne, now: T0 + 1000, expectedRevision: 0,
  requireCommandId: true, enforceOwnership: true, autoClaim: true
}).timer;
historical = applyOfficialTimerCommand(historical, {
  type: "PAUSE", commandId: "cola-1-pause", controller: remote, actor
}, {
  definition: colaOne, now: T0 + 13000, expectedRevision: 1,
  requireCommandId: true, enforceOwnership: true, autoClaim: true
}).timer;
assert.equal(historical.status, "PAUSED");
assert.equal(historical.officialElapsedMs, 12000);

const nextSelection = resolveOfficialTimerSelection({
  selectedTimerId: historical.timerId,
  definitions: [colaTwo],
  registry: { [historical.timerId]: historical }
});
assert.equal(nextSelection.timerId, colaTwo.timerId, "a paused historical opportunity cannot shadow the next opportunity");
assert.equal(nextSelection.blockedByActiveTimer, false);

const readyTwo = createOfficialTimerContext(colaTwo, { now: T0 + 14000 });
assert.equal(readyTwo.status, "READY");
assert.equal(readyTwo.durationMs, 20000);
assert.equal(readyTwo.officialElapsedMs, 0);
assert.equal(readyTwo.runningSince, null);
assert.equal(readyTwo.pausedAt, null);
assert.equal(readyTwo.finishedAt == null, true);
assert.equal(historical.status, "PAUSED", "the first opportunity remains preserved as history");

const phoneContext = {
  tournament: { ...tournament },
  charreada: { ...base.charreada },
  turn: { ...base.turn, suerte: { id: "colas", name: "Coleadero" }, attemptIndex: 1, coleadorIndex: 0 }
};
assert.equal(buildOfficialTimerDefinitionsFromContext(phoneContext)[0].durationMs, 20000);
assert.equal(buildOfficialTimerDefinitionsFromContext(phoneContext)[0].timerId, colaTwo.timerId);

const brakeDefinition = definitions("cala").find((item) => item.phaseId === "freno_review");
assert.ok(brakeDefinition, "Brake Review resolves as an official temporal phase");
assert.equal(brakeDefinition.durationMs, 180000);
let brakeTimer = createOfficialTimerContext(brakeDefinition, { now: T0 });
const scorerStart = applyOfficialTimerCommand(brakeTimer, {
  type: "START", commandId: "brake-start", controller: scorer, actor
}, {
  definition: brakeDefinition, now: T0 + 1000, expectedRevision: 0,
  requireCommandId: true, enforceOwnership: true, autoClaim: true
});
assert.equal(scorerStart.ok, true, "the explicit Brake Review scorer control can atomically claim and start its timer");
assert.equal(scorerStart.timer.status, "RUNNING");
assert.equal(scorerStart.timer.controllerType, "scorer_backup");

const forbiddenScorerClaim = applyOfficialTimerCommand(readyTwo, {
  type: "START", commandId: "cola-scorer-start", controller: scorer, actor
}, {
  definition: colaTwo, now: T0 + 15000, expectedRevision: 0,
  requireCommandId: true, enforceOwnership: true, autoClaim: true
});
assert.equal(forbiddenScorerClaim.ok, false);
assert.equal(forbiddenScorerClaim.reason, "official-timer-control-not-claimed", "scorer auto-claim remains restricted outside Brake Review");

const displayNode = {
  dataset: { officialTimerId: scorerStart.timer.timerId },
  textContent: ""
};
const root = { querySelectorAll: () => [displayNode] };
const registry = { [scorerStart.timer.timerId]: scorerStart.timer };
const values = [T0 + 1000, T0 + 2000, T0 + 3000].map((now) => {
  const result = updateOfficialTimerDomDisplays(root, registry, now);
  assert.equal(result.updatedCount, 1);
  assert.equal(result.hasRunningTimer, true);
  return displayNode.textContent;
});
assert.equal(new Set(values).size, 3, "the mounted scorer timer DOM changes without a scorer rerender");

const firebaseSource = readFileSync(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
for (const field of [
  "ruleProfileId", "ruleProfileVersion", "ruleProfileContentFingerprint",
  "effectiveRulesFingerprint", "temporalPolicyId", "temporalPolicyVersion", "temporalFingerprint"
]) {
  assert.match(firebaseSource, new RegExp(`${field}: tournament\\.${field}`), `${field} is transported in live/current`);
}
const displaySource = readFileSync(new URL("../js/core/officialTimerLiveDisplay.js", import.meta.url), "utf8");
assert.doesNotMatch(displaySource, /firebase|runTransaction|publishFirebase|setFirebase/i, "DOM interpolation performs zero Firebase writes per tick");

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await validateTimerAuthorityRulesInEmulator();
}

console.log("pre-cala-brake-review-timer-context-blocker-003.test.mjs: ok");

async function validateTimerAuthorityRulesInEmulator() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  assert.equal(projectId, "demo-charropro-local");

  const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
  const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const suffix = `${Date.now()}-${process.pid}`;
  const app = initializeApp({ projectId }, `timer-blocker-003-${suffix}`);
  const auth = getAuth(app);
  const uid = `timer-judge-${suffix}`;
  const email = `${uid}@example.test`;
  const password = `LocalTimerOnly-${suffix}`;
  const tournamentId = `timer-tournament-${suffix}`;

  try {
    await auth.createUser({ uid, email, password, emailVerified: true });
    await ownerWrite(databaseHost, namespace, `charropro/users/${uid}`, {
      active: true, role: "juez", tournamentAccess: "selected", tournamentIds: [tournamentId]
    });
    await ownerWrite(databaseHost, namespace, `charropro/userTournamentAccess/${uid}`, { [tournamentId]: true });
    const token = await signIn(authHost, email, password);
    const emulatorActor = { id: uid, uid, role: "juez" };
    const emulatorRemote = { ...remote, controllerId: `remote-${suffix}`, controllerUid: uid };
    const emulatorDefinition = { ...colaOne, tournamentId, timerId: `${colaOne.timerId}:${suffix}` };
    const timerKey = firebaseTimerKey(emulatorDefinition.timerId);
    const started = applyOfficialTimerCommand(createOfficialTimerContext(emulatorDefinition, { now: T0 }), {
      type: "START", commandId: `start-${suffix}`, controller: emulatorRemote, actor: emulatorActor
    }, {
      definition: emulatorDefinition, now: T0 + 1000, expectedRevision: 0,
      requireCommandId: true, enforceOwnership: true, autoClaim: true
    });
    const startValue = cleanJson({ ...started.timer, timerKey, actor: { id: uid, name: "Juez local", role: "juez" } });
    assert.equal(await clientWrite(databaseHost, namespace, `charropro/tournaments/${tournamentId}/officialTimers/${timerKey}`, token, startValue), 200);

    const paused = applyOfficialTimerCommand(started.timer, {
      type: "PAUSE", commandId: `pause-${suffix}`, controller: emulatorRemote, actor: emulatorActor
    }, {
      definition: emulatorDefinition, now: T0 + 13000, expectedRevision: 1,
      requireCommandId: true, enforceOwnership: true, autoClaim: true
    });
    const pauseValue = cleanJson({ ...paused.timer, timerKey, actor: { id: uid, name: "Juez local", role: "juez" } });
    assert.equal(await clientWrite(databaseHost, namespace, `charropro/tournaments/${tournamentId}/officialTimers/${timerKey}`, token, pauseValue), 200);
    assert.ok([401, 403].includes(await clientWrite(
      databaseHost,
      namespace,
      `charropro/tournaments/${tournamentId}/officialTimers/${timerKey}`,
      token,
      startValue
    )), "a stale timer revision is rejected by the real Emulator Rules");

    const nextDefinition = { ...colaTwo, tournamentId, timerId: `${colaTwo.timerId}:${suffix}` };
    const nextKey = firebaseTimerKey(nextDefinition.timerId);
    const nextStarted = applyOfficialTimerCommand(createOfficialTimerContext(nextDefinition, { now: T0 + 14000 }), {
      type: "START", commandId: `next-${suffix}`, controller: emulatorRemote, actor: emulatorActor
    }, {
      definition: nextDefinition, now: T0 + 15000, expectedRevision: 0,
      requireCommandId: true, enforceOwnership: true, autoClaim: true
    });
    const nextValue = cleanJson({ ...nextStarted.timer, timerKey: nextKey, actor: { id: uid, name: "Juez local", role: "juez" } });
    assert.equal(await clientWrite(databaseHost, namespace, `charropro/tournaments/${tournamentId}/officialTimers/${nextKey}`, token, nextValue), 200);
    const currentTimerContext = cleanJson(buildOfficialCurrentTimerContext(nextStarted.timer, nextDefinition, {
      now: T0 + 15000,
      sourceRevision: 2,
      contextRevision: 2
    }));
    assert.equal(await clientWrite(
      databaseHost,
      namespace,
      `charropro/live/${tournamentId}/current/currentTimerContext`,
      token,
      currentTimerContext
    ), 200, "the existing live/current Rules accept the authority-derived context without a Rules change");
    const deviceOne = await clientRead(databaseHost, namespace, `charropro/live/${tournamentId}/current/currentTimerContext`, token);
    const deviceTwo = await clientRead(databaseHost, namespace, `charropro/live/${tournamentId}/current/currentTimerContext`, token);
    assert.deepEqual(deviceTwo, deviceOne, "two independent Emulator clients reconstruct the same current timer context");
    assert.equal(deviceOne.timerId, nextDefinition.timerId);
    assert.equal(deviceOne.status, "RUNNING");
    const historicalRead = await ownerRead(databaseHost, namespace, `charropro/tournaments/${tournamentId}/officialTimers/${timerKey}`);
    assert.equal(historicalRead.status, "PAUSED");
    assert.equal(historicalRead.officialElapsedMs, 12000);
    const nextRead = await ownerRead(databaseHost, namespace, `charropro/tournaments/${tournamentId}/officialTimers/${nextKey}`);
    assert.equal(nextRead.durationMs, 20000);
    assert.equal(nextRead.timerId, nextDefinition.timerId);
  } finally {
    await ownerDelete(databaseHost, namespace, `charropro/tournaments/${tournamentId}`);
    await ownerDelete(databaseHost, namespace, `charropro/live/${tournamentId}`);
    await ownerDelete(databaseHost, namespace, `charropro/users/${uid}`);
    await ownerDelete(databaseHost, namespace, `charropro/userTournamentAccess/${uid}`);
    try { await auth.deleteUser(uid); } catch (error) { if (error?.code !== "auth/user-not-found") throw error; }
    await deleteApp(app);
  }
}

async function signIn(authHost, email, password) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-timer-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  return JSON.parse(body).idToken;
}

async function clientWrite(host, namespace, path, token, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}&auth=${encodeURIComponent(token)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  await response.text();
  return response.status;
}

async function clientRead(host, namespace, path, token) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}&auth=${encodeURIComponent(token)}`);
  const body = await response.text();
  assert.equal(response.ok, true, body);
  return JSON.parse(body);
}

async function ownerWrite(host, namespace, path, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT",
    headers: { authorization: "Bearer owner", "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerRead(host, namespace, path) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    headers: { authorization: "Bearer owner" }
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  return JSON.parse(body);
}

async function ownerDelete(host, namespace, path) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "DELETE",
    headers: { authorization: "Bearer owner" }
  });
  assert.equal(response.ok, true, await response.text());
}

function firebaseTimerKey(timerId) {
  return String(timerId).replace(/[.#$[\]/]/g, "_").replace(/[^A-Za-z0-9_:@-]/g, "_").slice(0, 240);
}

function cleanJson(value) {
  return JSON.parse(JSON.stringify(value));
}
