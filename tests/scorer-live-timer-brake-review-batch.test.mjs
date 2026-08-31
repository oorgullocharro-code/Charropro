import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BRAKE_REVIEW_ACTIONS,
  BRAKE_REVIEW_BATCH_STATUSES,
  BRAKE_REVIEW_STAGES,
  applyBrakeReviewCommand,
  buildBrakeReviewBatchState,
  createBrakeReviewState
} from "../js/core/brakeReviewPhase.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";
import {
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext
} from "../js/core/timerRules.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";
import {
  buildOfficialCurrentTimerContext,
  reconcileOfficialTimerConsumerState
} from "../js/core/officialTimerOrchestration.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";
import {
  createOfficialTimerTicker,
  deriveOfficialTimerLiveDisplay,
  updateOfficialTimerDomDisplays
} from "../js/core/officialTimerLiveDisplay.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";

const T0 = Date.parse("2026-08-27T18:00:00.000Z");
const actor = { id: "judge_a", uid: "judge_a", role: "juez" };
const controller = {
  controllerId: "phone_a",
  controllerUid: actor.uid,
  controllerRole: actor.role,
  controllerSessionId: "phone_session_a",
  controllerType: "field_remote"
};
const tournament = {
  id: "batch_timer_test",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileContentFingerprint: "rptp_10e596046446e850",
  effectiveRulesFingerprint: "rptp_10e596046446e850"
};

function timerDefinitions(suerteId, teamId = "team_a", attemptIndex = 0, coleadorIndex = 0) {
  return buildOfficialTimerDefinitionsFromContext({
    tournament,
    charreada: { id: "charreada_a", competitionId: "equipos_completo" },
    turn: {
      competition: { id: "equipos_completo" },
      team: { id: teamId, name: teamId },
      suerte: { id: suerteId, name: suerteId },
      attemptIndex,
      coleadorIndex
    }
  });
}

function timerDefinition(suerteId, teamId = "team_a", definitionIndex = 0, attemptIndex = 0, coleadorIndex = 0) {
  return timerDefinitions(suerteId, teamId, attemptIndex, coleadorIndex)[definitionIndex];
}

function timerCommand(timer, definition, type, now) {
  return applyOfficialTimerCommand(timer, {
    type,
    commandId: `${timer.timerId}:${type}:${timer.revision}`,
    actor,
    controller
  }, {
    definition,
    now,
    expectedRevision: timer.revision,
    requireCommandId: true,
    enforceOwnership: true,
    autoClaim: true
  }).timer;
}

const yeguaDefinition = timerDefinition("yegua");
let yeguaTimer = createOfficialTimerContext(yeguaDefinition, { now: T0 });
let consumer = reconcileOfficialTimerConsumerState({
  incomingCurrentTimerContext: buildOfficialCurrentTimerContext(yeguaTimer, yeguaDefinition, { now: T0 }),
  now: T0
});
assert.equal(consumer.currentTimerContext.status, "READY");

for (const [operation, now, status] of [
  ["START", T0 + 1000, "RUNNING"],
  ["PAUSE", T0 + 5000, "PAUSED"],
  ["RESUME", T0 + 6000, "RUNNING"],
  ["FINISH", T0 + 10000, "FINISHED"]
]) {
  yeguaTimer = timerCommand(yeguaTimer, yeguaDefinition, operation, now);
  const next = reconcileOfficialTimerConsumerState({
    registry: consumer.registry,
    currentTimerContext: consumer.currentTimerContext,
    incomingRegistry: { [yeguaTimer.timerId]: yeguaTimer },
    incomingCurrentTimerContext: buildOfficialCurrentTimerContext(yeguaTimer, yeguaDefinition, { now }),
    now
  });
  assert.equal(next.currentTimerContext.status, status, `Scorer observes remote ${operation}`);
  assert.equal(next.changed, true);
  consumer = next;
}

const manganasDefinition = timerDefinition("manganas_pie");
const manganasTimer = createOfficialTimerContext(manganasDefinition, { now: T0 + 11000 });
const replacement = reconcileOfficialTimerConsumerState({
  registry: consumer.registry,
  currentTimerContext: consumer.currentTimerContext,
  incomingCurrentTimerContext: buildOfficialCurrentTimerContext(manganasTimer, manganasDefinition, { now: T0 + 11000 }),
  now: T0 + 11000
});
assert.equal(replacement.timerIdChanged, true);
assert.equal(replacement.currentTimerContext.timerId, manganasTimer.timerId);
assert.equal(replacement.currentTimerContext.status, "READY");

const staleRegistry = {
  [yeguaTimer.timerId]: {
    ...yeguaTimer,
    status: "READY",
    revision: 1
  }
};
const freshRunningContext = buildOfficialCurrentTimerContext({
  ...yeguaTimer,
  status: "RUNNING",
  revision: 2,
  runningSince: T0 + 12000
}, yeguaDefinition, { now: T0 + 12000 });
const freshCurrentWins = reconcileOfficialTimerConsumerState({
  registry: staleRegistry,
  currentTimerContext: buildOfficialCurrentTimerContext(staleRegistry[yeguaTimer.timerId], yeguaDefinition, { now: T0 + 11000 }),
  incomingCurrentTimerContext: freshRunningContext,
  now: T0 + 12000
});
assert.equal(freshCurrentWins.currentTimerContext.status, "RUNNING");
assert.equal(freshCurrentWins.currentTimerContext.timerRevision, 2);

const reactiveMatrix = [
  ["Brake Review", timerDefinition("cala", "team_matrix", 0)],
  ["Cala", timerDefinition("cala", "team_matrix", 1)],
  ["Piales", timerDefinition("piales", "team_matrix")],
  ["Coleadero", timerDefinition("colas", "team_matrix")],
  ["Toro", timerDefinition("toro", "team_matrix")],
  ["Terna", timerDefinition("lazo", "team_matrix")],
  ["Yegua", timerDefinition("yegua", "team_matrix")],
  ["Manganas Pie", timerDefinition("manganas_pie", "team_matrix")],
  ["Manganas Caballo", timerDefinition("manganas_caballo", "team_matrix", 1)],
  ["Paso", timerDefinition("paso", "team_matrix")]
];
let noRefreshConsumer = { registry: {}, currentTimerContext: null };
let matrixNow = T0 + 20000;
let refreshCount = 0;
for (const [label, definition] of reactiveMatrix) {
  let timer = createOfficialTimerContext(definition, { now: matrixNow });
  noRefreshConsumer = reconcileOfficialTimerConsumerState({
    registry: noRefreshConsumer.registry,
    currentTimerContext: noRefreshConsumer.currentTimerContext,
    incomingCurrentTimerContext: buildOfficialCurrentTimerContext(timer, definition, { now: matrixNow }),
    now: matrixNow
  });
  assert.equal(noRefreshConsumer.currentTimerContext.timerId, definition.timerId, `${label} replaces the prior current timer`);
  assert.equal(noRefreshConsumer.currentTimerContext.status, "READY");
  for (const [operation, offset, expectedStatus] of [
    ["START", 100, "RUNNING"],
    ["PAUSE", 200, "PAUSED"],
    ["RESUME", 300, "RUNNING"],
    ["FINISH", 400, "FINISHED"]
  ]) {
    timer = timerCommand(timer, definition, operation, matrixNow + offset);
    noRefreshConsumer = reconcileOfficialTimerConsumerState({
      registry: noRefreshConsumer.registry,
      currentTimerContext: noRefreshConsumer.currentTimerContext,
      incomingCurrentTimerContext: buildOfficialCurrentTimerContext(timer, definition, { now: matrixNow + offset }),
      now: matrixNow + offset
    });
    assert.equal(noRefreshConsumer.currentTimerContext.status, expectedStatus, `${label} reacts to remote ${operation}`);
  }
  matrixNow += 1000;
}
assert.equal(refreshCount, 0);
assert.equal(new Set(reactiveMatrix.map(([, definition]) => definition.timerId)).size, reactiveMatrix.length);

const pausedFinishDefinition = timerDefinition("paso", "team_paused_finish", 1);
let pausedFinishTimer = createOfficialTimerContext(pausedFinishDefinition, { now: matrixNow });
pausedFinishTimer = timerCommand(pausedFinishTimer, pausedFinishDefinition, "START", matrixNow + 100);
pausedFinishTimer = timerCommand(pausedFinishTimer, pausedFinishDefinition, "PAUSE", matrixNow + 200);
pausedFinishTimer = timerCommand(pausedFinishTimer, pausedFinishDefinition, "FINISH", matrixNow + 300);
assert.equal(pausedFinishTimer.status, "FINISHED", "PAUSED to FINISH remains observable without RESUME");

let runningYegua = createOfficialTimerContext(yeguaDefinition, { now: T0 });
runningYegua = timerCommand(runningYegua, yeguaDefinition, "START", T0 + 1000);
const displayNode = { dataset: { officialTimerId: runningYegua.timerId }, textContent: "" };
const root = { querySelectorAll: () => [displayNode] };
let scheduled = null;
let firebaseWrites = 0;
let globalRenders = 0;
const ticker = createOfficialTimerTicker({
  cadenceMs: 100,
  now: () => T0 + 1000,
  setTimeout(callback) { scheduled = callback; return 1; },
  clearTimeout() { scheduled = null; }
});
const subscription = ticker.subscribe((now) => {
  updateOfficialTimerDomDisplays(root, { [runningYegua.timerId]: runningYegua }, now);
}, { active: true });
for (let tick = 0; tick < 100; tick += 1) {
  const callback = scheduled;
  scheduled = null;
  callback();
}
assert.equal(ticker.diagnostics().ticks, 100);
assert.equal(firebaseWrites, 0);
assert.equal(globalRenders, 0);
subscription.unsubscribe();
ticker.destroy();

const catalog = {
  infr: [{ id: "brake_bad", ruleId: "brake_bad", category: "infr", pts: 1, metadata: { phaseId: "freno_review" } }],
  desc: [{ id: "brake_dq", ruleId: "brake_dq", category: "desc", metadata: { phaseId: "freno_review" } }]
};

function review(teamId) {
  const definition = timerDefinition("cala", teamId, 0);
  return createBrakeReviewState({
    tournamentId: tournament.id,
    charreadaId: "charreada_a",
    teamId,
    timerId: definition.timerId
  }, { now: T0 });
}

function reviewCommand(current, action, commandId, ruleId = "") {
  const result = applyBrakeReviewCommand(current, {
    action,
    commandId,
    expectedRevision: current.revision,
    actor,
    ruleId,
    elapsedMs: 15000,
    timerRevision: current.timerRevision + 1
  }, { actor, catalog, now: T0 + current.revision + 1000 });
  assert.equal(result.ok, true, result.reason);
  return result.review;
}

let reviewA = review("team_a");
let reviewB = review("team_b");
let reviewC = review("team_c");
const presentations = () => [reviewA, reviewB, reviewC].map((item, index) => ({
  teamId: item.teamId,
  teamIndex: index,
  timerId: item.timerId,
  review: item
}));

let batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.status, BRAKE_REVIEW_BATCH_STATUSES.NOT_STARTED);
assert.equal(batch.currentBrakeReviewTeamId, "team_a");
assert.equal(batch.calaReady, false);

reviewA = reviewCommand(reviewA, BRAKE_REVIEW_ACTIONS.AUTHORIZE, "authorize-a");
batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.currentBrakeReviewTeamId, "team_b");
assert.deepEqual(batch.completedBrakeReviews, ["team_a"]);
assert.equal(batch.calaReady, false, "Cala remains blocked after the first Brake Review");
assert.equal(buildBrakeReviewBatchState(structuredClone(presentations())).currentBrakeReviewTeamId, "team_b", "refresh and a second device reconstruct team B");

reviewB = reviewCommand(reviewB, BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, "bad-b", "brake_bad");
reviewB = reviewCommand(reviewB, BRAKE_REVIEW_ACTIONS.AUTHORIZE, "authorize-b");
batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.currentBrakeReviewTeamId, "team_c");
assert.equal(reviewB.result, "AUTHORIZED_WITH_INFRACTIONS");

reviewC = reviewCommand(reviewC, BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, "dq-c", "brake_dq");
assert.equal(reviewC.stage, BRAKE_REVIEW_STAGES.DISQUALIFIED);
batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.allCompleted, false, "DQ requires explicit confirmation before advancing");
reviewC = reviewCommand(reviewC, BRAKE_REVIEW_ACTIONS.CONFIRM_DISQUALIFICATION, "confirm-dq-c", "brake_dq");
batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.status, BRAKE_REVIEW_BATCH_STATUSES.COMPLETED);
assert.equal(batch.protocolStage, BRAKE_REVIEW_STAGES.PROTOCOL);
assert.equal(batch.calaReady, false);
assert.deepEqual(buildBrakeReviewBatchState(structuredClone(presentations())), batch, "refresh and a second device derive the same batch context");

reviewC = reviewCommand(reviewC, BRAKE_REVIEW_ACTIONS.CALL_JUDGES, "judges-c");
batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.protocolStage, BRAKE_REVIEW_STAGES.JUDGES_CALL);
reviewC = reviewCommand(reviewC, BRAKE_REVIEW_ACTIONS.MARK_CALA_READY, "ready-c");
batch = buildBrakeReviewBatchState(presentations());
assert.equal(batch.calaReady, true);
assert.deepEqual(batch.completedBrakeReviews, ["team_a", "team_b", "team_c"]);
assert.equal(new Set(batch.queue.map((item) => item.timerId)).size, 3, "each team preserves an independent Brake Review timer");

const brakeDefinitionA = timerDefinition("cala", "team_a", 0);
const brakeDefinitionB = timerDefinition("cala", "team_b", 0);
let completedBrakeTimerA = createOfficialTimerContext(brakeDefinitionA, { now: T0 });
completedBrakeTimerA = timerCommand(completedBrakeTimerA, brakeDefinitionA, "START", T0 + 1000);
completedBrakeTimerA = timerCommand(completedBrakeTimerA, brakeDefinitionA, "FINISH", T0 + 16000);
const readyBrakeTimerB = createOfficialTimerContext(brakeDefinitionB, { now: T0 + 17000 });
assert.notEqual(completedBrakeTimerA.timerId, readyBrakeTimerB.timerId);
assert.equal(readyBrakeTimerB.status, "READY");
assert.equal(readyBrakeTimerB.durationMs, brakeDefinitionB.durationMs);
assert.equal(readyBrakeTimerB.officialElapsedMs, 0);
assert.equal(readyBrakeTimerB.runningSince, null);
assert.equal(readyBrakeTimerB.pausedAt, null);
assert.equal(readyBrakeTimerB.finishedAt == null, true);
assert.equal(completedBrakeTimerA.status, "FINISHED", "completed Brake Review remains historical evidence");

const phone = deriveOfficialTimerLiveDisplay(runningYegua, T0 + 3000);
const scorer = deriveOfficialTimerLiveDisplay(runningYegua, T0 + 3000);
const graphics = deriveOfficialTimerLiveDisplay(runningYegua, T0 + 3000);
assert.deepEqual(scorer, phone);
assert.deepEqual(graphics, phone);

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /applyScorerOfficialTimerEvent\(\{[\s\S]*incomingCurrentTimerContext: payload\.currentTimerContext/);
assert.match(appSource, /alignScoringPointerToBrakeReviewBatch/);
assert.match(appSource, /!runtime\.batch\?\.calaReady/);
const scorerTimerEventSource = appSource.match(/function applyScorerOfficialTimerEvent\([\s\S]*?\n}\n/)?.[0] || "";
assert.doesNotMatch(scorerTimerEventSource, /location\.reload|window\.location/);
const displaySource = readFileSync(new URL("../js/core/officialTimerLiveDisplay.js", import.meta.url), "utf8");
assert.doesNotMatch(displaySource, /firebase|publish|runTransaction|\brender\s*\(/i);

console.log("scorer-live-timer-brake-review-batch.test.mjs: ok");
