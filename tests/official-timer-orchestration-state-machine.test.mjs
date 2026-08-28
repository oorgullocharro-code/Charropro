import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext
} from "../js/core/timerRules.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";
import {
  TORO_TO_TERNA_HANDOFF,
  buildOfficialCurrentTimerContext,
  buildOfficialTimerProjectionFromCurrentContext,
  buildToroToTernaReadyDefinition,
  partitionOfficialTimerHistory,
  resolveOfficialCurrentTimerContext,
  resolvePreviousPialesOpportunity
} from "../js/core/officialTimerOrchestration.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";

const T0 = Date.parse("2026-08-27T15:00:00.000Z");
const tournament = {
  id: "timer_orchestration_test",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileContentFingerprint: "rptp_10e596046446e850",
  effectiveRulesFingerprint: "rptp_10e596046446e850"
};
const base = {
  tournament,
  charreada: { id: "charreada_1", name: "Charreada de prueba", competitionId: "equipos_completo" },
  turn: {
    competition: { id: "equipos_completo", competitionId: "equipos_completo" },
    team: { id: "team_a", name: "Equipo A" }
  }
};
const actor = { id: "judge_a", uid: "judge_a", role: "juez" };
const controller = {
  controllerId: "field_remote_a",
  controllerUid: actor.uid,
  controllerRole: actor.role,
  controllerSessionId: "phone_a",
  controllerType: "field_remote"
};

function source(suerteId, attemptIndex = 0, coleadorIndex = 0, extra = {}) {
  return {
    ...base,
    ...extra,
    turn: {
      ...base.turn,
      suerte: { id: suerteId, name: suerteId, fullName: suerteId },
      attemptIndex,
      coleadorIndex,
      ...(extra.turn || {})
    }
  };
}

function command(timer, definition, type, revision, now) {
  return applyOfficialTimerCommand(timer, {
    type,
    commandId: `${definition.timerId}:${type}:${revision}`,
    controller,
    actor
  }, {
    definition,
    now,
    expectedRevision: revision,
    requireCommandId: true,
    enforceOwnership: true,
    autoClaim: true
  });
}

const colaOne = buildOfficialTimerDefinitionsFromContext(source("colas", 0, 0))[0];
const colaTwo = buildOfficialTimerDefinitionsFromContext(source("colas", 1, 0))[0];
assert.equal(colaOne.durationMs, 20000);
assert.equal(colaTwo.durationMs, 20000);
assert.notEqual(colaOne.timerId, colaTwo.timerId);
const coleaderoTimerIds = new Set();
for (let coleadorIndex = 0; coleadorIndex < 3; coleadorIndex += 1) {
  for (let opportunityIndex = 0; opportunityIndex < 3; opportunityIndex += 1) {
    const definition = buildOfficialTimerDefinitionsFromContext(source("colas", opportunityIndex, coleadorIndex))[0];
    assert.equal(definition.durationMs, 20000);
    coleaderoTimerIds.add(definition.timerId);
  }
}
assert.equal(coleaderoTimerIds.size, 9, "Coleadero 3x3 has nine deterministic independent timer identities");
const identityDefinition = buildOfficialTimerDefinitionsFromContext(source("piales", 1, 0, {
  turn: {
    participant: { id: "participant_a", name: "Pialador A", horseId: "horse_a", horseName: "Caballo A" },
    attempt: { id: "attempt_a_2" },
    previousOpportunityResolution: "NO_EXTENSION"
  }
}))[0];
const identityContext = buildOfficialCurrentTimerContext(
  createOfficialTimerContext(identityDefinition, { now: T0 }),
  identityDefinition,
  { now: T0 }
);
assert.equal(identityContext.participantId, "participant_a");
assert.equal(identityContext.horseId, "horse_a");
assert.equal(identityContext.attemptId, "attempt_a_2");
assert.equal(identityContext.opportunityIndex, 1);

let timerOne = createOfficialTimerContext(colaOne, { now: T0 });
let result = command(timerOne, colaOne, "START", 0, T0 + 1000);
assert.equal(result.ok, true);
assert.equal(result.timer.status, "RUNNING");
timerOne = result.timer;
result = command(timerOne, colaOne, "PAUSE", 1, T0 + 9000);
assert.equal(result.ok, true);
assert.equal(result.timer.status, "PAUSED");
timerOne = result.timer;
result = command(timerOne, colaOne, "RESUME", 2, T0 + 10000);
assert.equal(result.timer.status, "RUNNING");
timerOne = result.timer;
result = command(timerOne, colaOne, "FINISH", 3, T0 + 12000);
assert.equal(result.timer.status, "FINISHED");
timerOne = result.timer;

const pausedFinishStart = createOfficialTimerContext(colaOne, { now: T0 });
const pausedFinishRunning = command(pausedFinishStart, colaOne, "START", 0, T0 + 1000).timer;
const pausedFinishPaused = command(pausedFinishRunning, colaOne, "PAUSE", 1, T0 + 2000).timer;
assert.equal(command(pausedFinishPaused, colaOne, "FINISH", 2, T0 + 3000).timer.status, "FINISHED");

const nextContext = resolveOfficialCurrentTimerContext({
  source: source("colas", 1, 0),
  registry: { [timerOne.timerId]: timerOne },
  currentTimerContext: buildOfficialCurrentTimerContext(timerOne, colaOne, { now: T0 + 12000 }),
  now: T0 + 13000
});
assert.equal(nextContext.timerId, colaTwo.timerId, "historical RUNNING/PAUSED/FINISHED state never wins a new opportunity");
assert.equal(nextContext.status, "READY");
assert.equal(nextContext.elapsedMs, 0);
assert.equal(nextContext.remainingMs, 20000);
assert.equal(nextContext.runningSince, null);
assert.equal(nextContext.pausedAt, null);
assert.equal(nextContext.finishedAt, null);

const history = partitionOfficialTimerHistory(nextContext, { [timerOne.timerId]: timerOne });
assert.equal(history.current, null);
assert.equal(history.historical.length, 1);
assert.equal(history.historical[0].timerId, colaOne.timerId);

const pialesAttemptsA = [
  { remateId: "remate_1", desc: false },
  { remateId: "remate_2", desc: false }
];
const pialesAttemptsB = [{ notAchieved: true }];
assert.equal(resolvePreviousPialesOpportunity({ attempts: pialesAttemptsA, currentOpportunityIndex: 1 }), "COUNTED_PIAL");
assert.equal(resolvePreviousPialesOpportunity({ attempts: pialesAttemptsB, currentOpportunityIndex: 1 }), "NO_EXTENSION");
assert.equal(resolvePreviousPialesOpportunity({ attempts: pialesAttemptsA, currentOpportunityIndex: 0 }), "NO_EXTENSION");
const pialTwo = buildOfficialTimerDefinitionsFromContext(source("piales", 1, 0, {
  turn: { previousOpportunityResolution: "COUNTED_PIAL" }
}))[0];
assert.equal(pialTwo.durationMs, 180000, "Piales uses the same team's previous opportunity result");
const interleavedTimerHistory = [
  buildOfficialTimerDefinitionsFromContext(source("piales", 0, 0, { turn: { team: { id: "team_a" } } }))[0],
  buildOfficialTimerDefinitionsFromContext(source("piales", 0, 0, { turn: { team: { id: "team_b" } } }))[0],
  buildOfficialTimerDefinitionsFromContext(source("piales", 0, 0, { turn: { team: { id: "team_c" } } }))[0]
];
assert.equal(new Set(interleavedTimerHistory.map((definition) => definition.timerId)).size, 3);
assert.equal(
  resolvePreviousPialesOpportunity({ attempts: pialesAttemptsA, currentOpportunityIndex: 1 }),
  "COUNTED_PIAL",
  "intervening timers from other teams do not participate in Piales resolution"
);

const toroDefinition = buildOfficialTimerDefinitionsFromContext(source("toro"))[0];
let toroTimer = createOfficialTimerContext(toroDefinition, { now: T0 });
toroTimer = command(toroTimer, toroDefinition, "START", 0, T0 + 1000).timer;
toroTimer = command(toroTimer, toroDefinition, "FINISH", 1, T0 + 15000).timer;
const ternaDefinition = buildToroToTernaReadyDefinition(source("toro"), toroTimer);
assert.ok(ternaDefinition);
assert.equal(ternaDefinition.timerRuleId, "fmch_2026_terna_shared_window");
assert.equal(ternaDefinition.transition, TORO_TO_TERNA_HANDOFF);
const ternaTimer = createOfficialTimerContext(ternaDefinition, { now: T0 + 15000 });
assert.equal(ternaTimer.status, "READY", "Toro FINISH prepares Terna but never starts it");
assert.equal(ternaTimer.runningSince, null);

const handoffContext = buildOfficialCurrentTimerContext(ternaTimer, ternaDefinition, {
  now: T0 + 15000,
  transition: TORO_TO_TERNA_HANDOFF,
  handoffFromTimerId: toroTimer.timerId
});
const overlappingToroScoring = resolveOfficialCurrentTimerContext({
  source: { ...source("toro"), currentTimerContext: handoffContext },
  registry: { [toroTimer.timerId]: toroTimer, [ternaTimer.timerId]: ternaTimer },
  now: T0 + 16000
});
assert.equal(overlappingToroScoring.timerId, ternaTimer.timerId, "Terna may be current while Toro scoring remains open");
assert.equal(overlappingToroScoring.status, "READY");

const ternaRunning = command(ternaTimer, ternaDefinition, "START", 0, T0 + 17000).timer;
const overlappingRunning = resolveOfficialCurrentTimerContext({
  source: { ...source("toro"), currentTimerContext: buildOfficialCurrentTimerContext(ternaRunning, ternaDefinition, {
    now: T0 + 17000,
    transition: TORO_TO_TERNA_HANDOFF,
    handoffFromTimerId: toroTimer.timerId
  }) },
  registry: { [toroTimer.timerId]: toroTimer, [ternaRunning.timerId]: ternaRunning },
  now: T0 + 18000
});
assert.equal(overlappingRunning.status, "RUNNING", "Toro scoring and a running Terna timer can overlap");
assert.equal(partitionOfficialTimerHistory(overlappingRunning, {
  [toroTimer.timerId]: toroTimer,
  [ternaRunning.timerId]: ternaRunning
}).historical[0].timerId, toroTimer.timerId, "Apretalamiento remains historical evidence");

const projection = buildOfficialTimerProjectionFromCurrentContext(overlappingRunning, { now: T0 + 19000 });
assert.equal(projection.timerId, ternaRunning.timerId);
assert.equal(projection.officialStatus, "RUNNING");
assert.equal(projection.remainingMs, 418000);

const flow = [
  ["cala", 0, 0],
  ["piales", 0, 0], ["piales", 1, 0],
  ["colas", 0, 0], ["colas", 1, 0], ["colas", 2, 0],
  ["toro", 0, 0], ["lazo", 0, 0], ["yegua", 0, 0],
  ["manganas_pie", 0, 0], ["manganas_caballo", 0, 0], ["paso", 0, 0]
];
let previousContext = null;
let flowNow = T0 + 100000;
const fullFlowTimerIds = [];
for (const [suerteId, attemptIndex, coleadorIndex] of flow) {
  const flowSource = source(suerteId, attemptIndex, coleadorIndex, {
    turn: { previousOpportunityResolution: suerteId === "piales" && attemptIndex > 0 ? "NO_EXTENSION" : undefined }
  });
  const definitions = buildOfficialTimerDefinitionsFromContext(flowSource);
  assert.ok(definitions.length > 0 && definitions.every((definition) => definition.durationMs > 0), `${suerteId} resolves certified timer definitions`);
  const registry = {};
  for (const definition of definitions) {
    const current = resolveOfficialCurrentTimerContext({
      source: flowSource,
      registry,
      currentTimerContext: previousContext,
      now: flowNow
    });
    assert.equal(current.timerId, definition.timerId, `current context advances without refresh to ${definition.timerRuleId}`);
    assert.equal(current.status, "READY");
    fullFlowTimerIds.push(current.timerId);
    let completed = createOfficialTimerContext(definition, { now: flowNow });
    completed = command(completed, definition, "START", 0, flowNow + 1000).timer;
    completed = command(completed, definition, "FINISH", 1, flowNow + 2000).timer;
    registry[definition.timerId] = completed;
    previousContext = buildOfficialCurrentTimerContext(completed, definition, { now: flowNow + 2000 });
    flowNow += 3000;
  }
}
assert.equal(new Set(fullFlowTimerIds).size, fullFlowTimerIds.length, "the full charreada never reuses a prior timer identity");

const phoneContext = buildOfficialCurrentTimerContext(ternaRunning, ternaDefinition, {
  now: T0 + 17000,
  sourceRevision: 41,
  contextRevision: 9,
  transition: TORO_TO_TERNA_HANDOFF,
  handoffFromTimerId: toroTimer.timerId
});
const authoritativeRegistry = {
  [toroTimer.timerId]: toroTimer,
  [ternaRunning.timerId]: ternaRunning
};
const deviceOne = resolveOfficialCurrentTimerContext({
  source: { ...source("toro"), currentTimerContext: phoneContext },
  registry: authoritativeRegistry,
  now: T0 + 20000
});
const deviceTwo = resolveOfficialCurrentTimerContext({
  source: { ...source("toro"), currentTimerContext: phoneContext },
  registry: authoritativeRegistry,
  now: T0 + 20000
});
assert.deepEqual(deviceTwo, deviceOne, "two devices reconcile to the same authoritative current timer");
const hardRefresh = resolveOfficialCurrentTimerContext({
  source: { ...source("toro"), currentTimerContext: phoneContext },
  registry: authoritativeRegistry,
  currentTimerContext: null,
  now: T0 + 21000
});
assert.equal(hardRefresh.timerId, ternaRunning.timerId, "hard refresh rebuilds current from authority rather than device memory");
assert.equal(hardRefresh.status, "RUNNING");

const phoneSource = readFileSync(new URL("../js/views/cronometro-control.js", import.meta.url), "utf8");
const scorerSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const syncSource = readFileSync(new URL("../js/core/sync.js", import.meta.url), "utf8");
const firebaseSource = readFileSync(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const displaySource = readFileSync(new URL("../js/views/cronometro-pantalla.js", import.meta.url), "utf8");
const graphicsSource = readFileSync(new URL("../js/views/grafico.js", import.meta.url), "utf8");
const broadcastSource = readFileSync(new URL("../js/views/obs.js", import.meta.url), "utf8");
assert.match(phoneSource, /status === "RUNNING"\) return "FINISH"/);
assert.match(phoneSource, /status === "RUNNING"\) return "PAUSE"/);
assert.match(phoneSource, /status === "PAUSED"\) return "RESUME"/);
assert.match(phoneSource, /<details class="timer-control-history"/);
assert.doesNotMatch(phoneSource, /official_timer_selected/, "device storage is not a timer-selection authority");
assert.match(scorerSource, /"apply-jineteo-timing": "score"/);
assert.match(scorerSource, /prepareTernaCurrentTimerAfterToroFinish/);
assert.match(scorerSource, /\[overlappingTimerRuntime, \.\.\.fmchSportTimers\]/, "Scorer header shows current Terna plus historical Toro evidence");
assert.match(syncSource, /currentTimerContext/);
assert.match(syncSource, /resolveLivePialesPreviousOpportunity/);
assert.match(firebaseSource, /current\/currentTimerContext/);
for (const consumerSource of [displaySource, graphicsSource, broadcastSource]) {
  assert.match(consumerSource, /buildOfficialTimerProjectionFromCurrentContext/);
}

const liveDisplaySource = readFileSync(new URL("../js/core/officialTimerLiveDisplay.js", import.meta.url), "utf8");
assert.doesNotMatch(liveDisplaySource, /publishFirebase|runTransaction|setFirebase/i, "visual interpolation performs zero Firebase writes per tick");

console.log("official-timer-orchestration-state-machine.test.mjs: ok");
