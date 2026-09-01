import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  buildOfficialTimerProjection,
  createOfficialTimerContext,
  resolveOfficialTimerSelection
} from "../js/core/timerRules.js?v=20260831-official-ranking-authority-public-parity-001-v1";

const now = Date.parse("2026-08-25T18:00:00.000Z");
const context = (suerteId, extra = {}) => ({
  tournament: { id: "tournament_a" },
  charreada: { id: "charreada_a", competitionId: "equipos_completo" },
  turn: {
    competition: { id: "equipos_completo" },
    team: { id: "team_a" },
    suerte: { id: suerteId },
    attemptIndex: extra.attemptIndex || 0,
    coleadorIndex: extra.coleadorIndex || 0
  }
});

const toroDefinition = buildOfficialTimerDefinitionsFromContext(context("toro"))[0];
const yeguaDefinition = buildOfficialTimerDefinitionsFromContext(context("yegua"))[0];
let toroTimer = createOfficialTimerContext(toroDefinition, { now });
toroTimer = applyOfficialTimerCommand(toroTimer, {
  type: "FINISH",
  commandId: "finish-toro",
  actor: { id: "judge_a", uid: "judge_a", role: "juez" }
}, { definition: toroDefinition, now: now + 1000, expectedRevision: 0, requireCommandId: true }).timer;

const nextSuerte = resolveOfficialTimerSelection({
  selectedTimerId: toroTimer.timerId,
  definitions: [yeguaDefinition],
  registry: { [toroTimer.timerId]: toroTimer }
});
assert.equal(nextSuerte.timerId, yeguaDefinition.timerId);
assert.equal(nextSuerte.contextChanged, true);
assert.equal(nextSuerte.blockedByActiveTimer, false, "FINISHED history does not lock the next suerte");

let runningToro = createOfficialTimerContext(toroDefinition, { now });
runningToro = applyOfficialTimerCommand(runningToro, {
  type: "START",
  commandId: "start-toro",
  actor: { id: "judge_a", uid: "judge_a", role: "juez" }
}, { definition: toroDefinition, now: now + 1000, expectedRevision: 0, requireCommandId: true }).timer;
const activeContextChange = resolveOfficialTimerSelection({
  selectedTimerId: runningToro.timerId,
  definitions: [yeguaDefinition],
  registry: { [runningToro.timerId]: runningToro }
});
assert.equal(activeContextChange.timerId, yeguaDefinition.timerId);
assert.equal(activeContextChange.blockedByActiveTimer, false, "an authoritative context change always wins over historical RUNNING state");

const currentSelection = resolveOfficialTimerSelection({
  selectedTimerId: yeguaDefinition.timerId,
  definitions: [yeguaDefinition],
  registry: {}
});
assert.equal(currentSelection.timerId, yeguaDefinition.timerId);
assert.equal(currentSelection.contextChanged, false);

const noTimerSuerte = resolveOfficialTimerSelection({
  selectedTimerId: toroTimer.timerId,
  definitions: [],
  registry: { [toroTimer.timerId]: toroTimer }
});
assert.equal(noTimerSuerte.timerId, "", "a finished timer is not presented as the current timer for a no-timer suerte");

const pialAttemptOne = buildOfficialTimerDefinitionsFromContext(context("piales", { attemptIndex: 0 }))[0];
const pialAttemptTwo = buildOfficialTimerDefinitionsFromContext(context("piales", { attemptIndex: 1 }))[0];
assert.notEqual(pialAttemptOne.timerId, pialAttemptTwo.timerId, "each timed Piales opportunity can obtain a fresh authority identity");

const colasFirst = buildOfficialTimerDefinitionsFromContext(context("colas", { attemptIndex: 0, coleadorIndex: 0 }))[0];
const colasSecond = buildOfficialTimerDefinitionsFromContext(context("colas", { attemptIndex: 0, coleadorIndex: 1 }))[0];
assert.notEqual(colasFirst.timerId, colasSecond.timerId, "Coleadero participant context cannot reuse a finished timer");

const certifiedManganas = buildOfficialTimerDefinitionsFromContext({
  ...context("manganas_pie"),
  tournament: {
    id: "tournament_a",
    ruleProfileId: "FMCH_2026_LIBRE",
    ruleProfileVersion: "0.6.0",
    effectiveRulesFingerprint: "rptp_0f90f7a3944a82d7"
  },
  turn: {
    ...context("manganas_pie").turn,
    suerte: {
      id: "manganas_pie",
      ruleMetadata: {
        timerContract: { timerId: "timer_manganas_pie", limitMs: 420000, mode: "independent_countdown" }
      },
      ruleResolution: {
        profile: { profileId: "FMCH_2026_LIBRE", profileVersion: "0.6.0" }
      }
    }
  }
})[0];
assert.equal(certifiedManganas.temporalRuleStatus, "CERTIFIED");
assert.equal(certifiedManganas.temporalRuleSource, "certified_temporal_policy");
assert.equal(certifiedManganas.durationMs, 420000);
assert.equal(certifiedManganas.ruleProfileFingerprint, "rptp_0f90f7a3944a82d7");
assert.equal(colasFirst.temporalRuleStatus, "TEMPORAL_RULE_MISSING", "legacy compatibility is never presented as a certified FMCH timer rule");

const projection = buildOfficialTimerProjection(runningToro, { now: now + 2000 });
assert.equal(projection.timerId, runningToro.timerId);
assert.equal(projection.contextRef.suerteId, "toro");
assert.equal(projection.status, "running");
assert.equal(projection.sourceRevision, runningToro.revision);

const remoteSource = readFileSync(new URL("../js/views/cronometro-control.js", import.meta.url), "utf8");
const scorerSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const firebaseSource = readFileSync(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
assert.match(remoteSource, /resolveOfficialCurrentTimerContext/);
assert.doesNotMatch(remoteSource, /Finaliza el tiempo activo antes de cambiar de suerte/);
assert.match(scorerSource, /subscribeFirebaseOfficialTimers\(tournamentId, applyRemoteOfficialTimers\)/);
assert.match(scorerSource, /state\.view === "scoring"\) render\(\{ preserveScoringScroll: true \}\)/);
assert.match(firebaseSource, /"current\/timer": projection/);
assert.match(firebaseSource, /"current\/currentTimerContext"/);
assert.match(firebaseSource, /official_timer_update/);

console.log("official-timer-lifecycle-reuse.test.mjs: ok");
