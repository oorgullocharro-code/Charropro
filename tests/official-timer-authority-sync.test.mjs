import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OFFICIAL_TIMER_CONTROLLER_TYPES,
  applyOfficialTimerCommand,
  applyOfficialTimerControlOperation,
  buildOfficialTimerDefinitionsFromContext,
  buildOfficialTimerProjection,
  createOfficialTimerContext,
  getOfficialTimerContextView,
  getOfficialTimerControlView,
  normalizeOfficialTimerContext
} from "../js/core/timerRules.js?v=20260824-production-supervisor-scorer-context-001-v1";
import {
  createOutputRoute,
  createOutputRoutingEngine,
  routeTimerDisplay
} from "../js/broadcast/outputRouting.js?v=20260824-production-supervisor-scorer-context-001-v1";

const T0 = Date.parse("2026-08-11T12:00:00.000Z");
const definition = {
  timerId: "terna:tournament_a:equipos_completo:charreada_a:team_a:timer",
  contextType: "terna",
  label: "Terna",
  durationMs: 420000,
  tournamentId: "tournament_a",
  competitionId: "equipos_completo",
  charreadaId: "charreada_a",
  teamId: "team_a",
  suerteId: "terna"
};
const actorA = { id: "judge_a", uid: "judge_a", name: "Juez A", role: "juez" };
const actorB = { id: "judge_b", uid: "judge_b", name: "Juez B", role: "juez" };
const scorerActor = { id: "judge_scorer", uid: "judge_scorer", name: "Juez scorer", role: "juez" };
const remoteA = {
  controllerId: "remote_a",
  controllerUid: actorA.uid,
  controllerRole: "juez",
  controllerSessionId: "remote_a_tab",
  controllerType: "field_remote"
};
const remoteB = {
  controllerId: "remote_b",
  controllerUid: actorB.uid,
  controllerRole: "juez",
  controllerSessionId: "remote_b_tab",
  controllerType: "field_remote"
};
const scorer = {
  controllerId: "scorer_a",
  controllerUid: scorerActor.uid,
  controllerRole: "juez",
  controllerSessionId: "scorer_tab",
  controllerType: "scorer_backup"
};

function command(timer, type, controller, actor, commandId, now, expectedRevision = timer.revision) {
  return applyOfficialTimerCommand(timer, {
    type,
    controller,
    actor,
    commandId,
    issuedAt: new Date(now - 20).toISOString(),
    source: controller.controllerType
  }, {
    definition,
    now,
    expectedRevision,
    enforceOwnership: true,
    autoClaim: true,
    requireCommandId: true
  });
}

function control(timer, operation, controller, actor, commandId, now, extra = {}) {
  return applyOfficialTimerControlOperation(timer, {
    operation,
    controller,
    actor,
    commandId,
    expectedRevision: timer.revision,
    source: controller.controllerType,
    issuedAt: new Date(now - 20).toISOString(),
    ...extra
  }, {
    definition,
    now,
    requireCommandId: true
  });
}

let timer = createOfficialTimerContext(definition, { now: T0 });
assert.equal(timer.status, "READY");
assert.equal(timer.revision, 0);

const started = command(timer, "START", remoteA, actorA, "start_a", T0 + 1000);
assert.equal(started.ok, true, "remote primary starts the official timer");
timer = started.timer;
assert.equal(timer.timerId, definition.timerId);
assert.equal(timer.status, "RUNNING");
assert.equal(timer.controllerId, remoteA.controllerId);
assert.equal(timer.controllerUid, actorA.uid);
assert.equal(timer.revision, 1);
assert.equal(timer.authorityAudit[0].commandId, "start_a");

const replay = command(timer, "START", remoteA, actorA, "start_a", T0 + 1100, 0);
assert.equal(replay.ok, true);
assert.equal(replay.idempotent, true, "a retried command is idempotent before revision validation");
assert.equal(replay.timer.revision, 1);

const acceptedBaseline = normalizeOfficialTimerContext({
  ...timer,
  authorityAcceptedAt: "2026-08-11T12:00:01.000Z"
}, definition);
const acceptedReplay = command(acceptedBaseline, "START", remoteA, actorA, "start_a", T0 + 301000, 0);
assert.equal(acceptedReplay.idempotent, true);
assert.equal(acceptedReplay.timer.authorityAcceptedAt, acceptedBaseline.authorityAcceptedAt, "retry preserves the canonical acceptance timestamp");
assert.equal(acceptedReplay.timer.updatedAt, acceptedBaseline.updatedAt, "retry does not impersonate a fresh accepted transition");

const collision = command(timer, "PAUSE", remoteB, actorB, "pause_b", T0 + 30000);
assert.equal(collision.ok, false);
assert.equal(collision.reason, "official-timer-controller-conflict");
assert.equal(collision.timer.status, "RUNNING");

const forgedController = { ...remoteA, controllerUid: actorB.uid };
const forged = command(timer, "PAUSE", forgedController, actorB, "forged_pause", T0 + 31000);
assert.equal(forged.ok, false, "controllerId alone cannot impersonate the authenticated controller");

const paused = command(timer, "PAUSE", remoteA, actorA, "pause_a", T0 + 61000);
assert.equal(paused.ok, true);
timer = paused.timer;
assert.equal(timer.status, "PAUSED");
assert.equal(timer.officialElapsedMs, 60000);
const pausedLater = getOfficialTimerContextView(timer, { now: T0 + 181000 });
assert.equal(pausedLater.officialElapsedMs, 60000, "official time freezes while paused");
assert.equal(pausedLater.wallElapsedMs, 180000, "wall time remains auditable while paused");

const pauseReason = control(timer, "UPDATE_PAUSE_REASON", remoteA, actorA, "pause_reason_a", T0 + 181100, {
  reason: "Limpieza de ruedo"
});
assert.equal(pauseReason.ok, true);
timer = pauseReason.timer;
assert.equal(timer.pauseReason, "Limpieza de ruedo");
assert.equal(timer.pauses.at(-1).reason, "Limpieza de ruedo");
const pausedProjection = buildOfficialTimerProjection(timer, { now: T0 + 181100 });

const resumed = command(timer, "RESUME", remoteA, actorA, "resume_a", T0 + 182000);
assert.equal(resumed.ok, true);
timer = resumed.timer;
assert.equal(timer.status, "RUNNING");
assert.equal(getOfficialTimerContextView(timer, { now: T0 + 192000 }).officialElapsedMs, 70000);

let pausedFinishTimer = createOfficialTimerContext(definition, { now: T0 });
pausedFinishTimer = command(pausedFinishTimer, "START", remoteA, actorA, "paused_finish_start", T0 + 1000).timer;
pausedFinishTimer = command(pausedFinishTimer, "PAUSE", remoteA, actorA, "paused_finish_pause", T0 + 2000).timer;
const finishedFromPaused = command(pausedFinishTimer, "FINISH", remoteA, actorA, "paused_finish", T0 + 3000);
assert.equal(finishedFromPaused.ok, true, "PAUSED transitions directly to FINISHED");
assert.equal(finishedFromPaused.timer.status, "FINISHED");

const stale = command(timer, "PAUSE", remoteA, actorA, "stale_pause", T0 + 193000, timer.revision - 1);
assert.equal(stale.ok, false);
assert.equal(stale.reason, "official-timer-revision-conflict");

const takeover = control(timer, "TAKEOVER_CONTROL", scorer, scorerActor, "takeover_scorer", T0 + 194000, {
  reason: "Control remoto fuera de linea"
});
assert.equal(takeover.ok, true);
const beforeTakeoverElapsed = getOfficialTimerContextView(timer, { now: T0 + 194000 }).officialElapsedMs;
timer = takeover.timer;
assert.equal(timer.timerId, definition.timerId);
assert.equal(timer.controllerId, scorer.controllerId);
assert.equal(timer.previousController.controllerId, remoteA.controllerId);
assert.equal(getOfficialTimerContextView(timer, { now: T0 + 194000 }).officialElapsedMs, beforeTakeoverElapsed);
assert.equal(getOfficialTimerControlView(timer, scorer, { now: T0 + 194000 }).isOwner, true);
assert.equal(getOfficialTimerControlView(timer, remoteA, { now: T0 + 194000 }).isOwner, false);

const remoteAfterTakeover = command(timer, "PAUSE", remoteA, actorA, "remote_after_takeover", T0 + 195000);
assert.equal(remoteAfterTakeover.ok, false, "a reconnected remote cannot retake automatically");

const handoff = control(timer, "HANDOFF_CONTROL", scorer, scorerActor, "handoff_remote", T0 + 196000, {
  reason: "Devolucion explicita",
  targetController: timer.previousController
});
assert.equal(handoff.ok, true);
timer = handoff.timer;
assert.equal(timer.controllerId, remoteA.controllerId);
assert.equal(timer.controllerUid, actorA.uid);

const finished = command(timer, "FINISH", remoteA, actorA, "finish_a", T0 + 200000);
assert.equal(finished.ok, true);
timer = finished.timer;
assert.equal(timer.status, "FINISHED");
assert.equal(timer.timerId, definition.timerId);

const reload = normalizeOfficialTimerContext(structuredClone(timer), definition);
assert.deepEqual(reload, timer, "reload and reconnect preserve the same durable timer");
const mutatedReload = structuredClone(reload);
mutatedReload.pauses[0].reason = "changed outside";
assert.equal(timer.pauses[0].reason, "Limpieza de ruedo", "consumer snapshots do not mutate authority state");

let doubleTapTimer = createOfficialTimerContext(definition, { now: T0 });
doubleTapTimer = command(doubleTapTimer, "START", remoteA, actorA, "double_start", T0 + 1000).timer;
const firstTap = command(doubleTapTimer, "PAUSE", remoteA, actorA, "same_pause", T0 + 2000);
const secondTap = command(firstTap.timer, "PAUSE", remoteA, actorA, "same_pause", T0 + 2001, doubleTapTimer.revision);
const thirdTap = command(secondTap.timer, "PAUSE", remoteA, actorA, "same_pause", T0 + 2002, doubleTapTimer.revision);
assert.equal(firstTap.timer.status, "PAUSED");
assert.equal(secondTap.idempotent, true);
assert.equal(thirdTap.idempotent, true);
assert.equal(thirdTap.timer.revision, firstTap.timer.revision, "three pause taps produce one transition");

const baseContext = {
  tournament: { id: "tournament_a" },
  charreada: { id: "charreada_a", competitionId: "equipos_completo" },
  turn: {
    competition: { id: "equipos_completo" },
    team: { id: "team_a" }
  }
};
const definitions = (suerteId) => buildOfficialTimerDefinitionsFromContext({
  ...baseContext,
  turn: { ...baseContext.turn, suerte: { id: suerteId } }
});
assert.equal(definitions("cala").length, 0);
assert.equal(definitions("toro")[0].durationMs, 300000);
assert.equal(definitions("yegua")[0].durationMs, 300000);
assert.equal(definitions("lazo")[0].durationMs, 420000);
assert.equal(definitions("manganas_pie")[0].durationMs, 420000);
assert.equal(definitions("manganas_caballo")[0].durationMs, 420000);
assert.deepEqual(definitions("paso").map((item) => item.durationMs), [180000, 60000]);
assert.equal(definitions("colas")[0].durationMs, 15000);
assert.equal(definitions("piales")[0].durationMs, 0);

const toroDefinition = definitions("toro")[0];
const ternaDefinition = definitions("lazo")[0];
let toro = createOfficialTimerContext(toroDefinition, { now: T0 });
let terna = createOfficialTimerContext(ternaDefinition, { now: T0 });
toro = applyOfficialTimerCommand(toro, { type: "START", commandId: "toro_start", controller: remoteA, actor: actorA }, {
  definition: toroDefinition, now: T0 + 1000, expectedRevision: 0, requireCommandId: true, enforceOwnership: true, autoClaim: true
}).timer;
terna = applyOfficialTimerCommand(terna, { type: "START", commandId: "terna_start", controller: remoteA, actor: actorA }, {
  definition: ternaDefinition, now: T0 + 1000, expectedRevision: 0, requireCommandId: true, enforceOwnership: true, autoClaim: true
}).timer;
terna = applyOfficialTimerCommand(terna, { type: "PAUSE", commandId: "terna_pause", controller: remoteA, actor: actorA }, {
  definition: ternaDefinition, now: T0 + 11000, expectedRevision: 1, requireCommandId: true, enforceOwnership: true, autoClaim: true
}).timer;
assert.equal(getOfficialTimerContextView(terna, { now: T0 + 21000 }).officialElapsedMs, 10000);
assert.equal(getOfficialTimerContextView(toro, { now: T0 + 21000 }).officialElapsedMs, 20000, "pausing Terna does not pause Apretalamiento");

const timerProjection = pausedProjection;
assert.equal(timerProjection.timerId, definition.timerId);
assert.equal(timerProjection.sourceRevision, pauseReason.timer.revision);
assert.equal(timerProjection.pauseReason, "Limpieza de ruedo");
const routing = createOutputRoutingEngine({ now: "2026-08-11T12:00:00.000Z" });
createOutputRoute(routing, {
  routeId: "route-timer-display",
  routeType: "timer_display",
  outputId: "timer-display",
  sourceType: "timer_projection",
  visibility: "public",
  tenantId: "tenant_a",
  tournamentId: "tournament_a",
  competitionId: "equipos_completo"
}, { now: "2026-08-11T12:00:00.000Z" });
const routed = routeTimerDisplay(routing, "route-timer-display", timerProjection, {
  now: "2026-08-11T12:03:20.000Z",
  visibility: "public",
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "equipos_completo" }
});
assert.equal(routed.projection.timerId, definition.timerId);
assert.equal(routed.projection.sourceRevision, pauseReason.timer.revision);
assert.equal(routed.projection.pauseReason, "Limpieza de ruedo");

const remoteSource = readFileSync(new URL("../js/views/cronometro-control.js", import.meta.url), "utf8");
const scorerSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const displaySource = readFileSync(new URL("../js/views/cronometro-pantalla.js", import.meta.url), "utf8");
const syncSource = readFileSync(new URL("../js/core/sync.js", import.meta.url), "utf8");
const announcerSource = readFileSync(new URL("../js/broadcast/announcerMonitor.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const rulesSource = readFileSync(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const officialTimerRulesSource = JSON.stringify(JSON.parse(rulesSource).rules.charropro.tournaments.$tournamentId.officialTimers.$timerKey);
const firebaseSyncSource = readFileSync(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
assert.match(remoteSource, /pendingAction/);
assert.match(remoteSource, /applyFirebaseOfficialTimerAuthority/);
assert.doesNotMatch(remoteSource, /Rev\. \$\{/);
assert.match(scorerSource, /subscribeFirebaseOfficialTimers/);
assert.match(scorerSource, /Tomar control de respaldo/);
assert.match(displaySource, /getOfficialTimerContextView/);
assert.match(syncSource, /selectOfficialTimerForContext/);
assert.match(announcerSource, /pauseReason/);
assert.match(cssSource, /\.timer-control-primary-button[\s\S]*border-radius:\s*50%/);
assert.match(cssSource, /width:\s*clamp\(190px,\s*60vw,\s*340px\)/);
assert.match(rulesSource, /controllerUid/);
assert.match(rulesSource, /data\.child\('status'\)\.val\(\) === 'PAUSED'[\s\S]*newData\.child\('status'\)\.val\(\) === 'RUNNING'/);
assert.match(rulesSource, /data\.child\('status'\)\.val\(\) === 'PAUSED'[\s\S]*newData\.child\('status'\)\.val\(\) === 'FINISHED'/);
assert.doesNotMatch(officialTimerRulesSource, /newData\.val\(\) === data\.val\(\)/, "idempotent retries are resolved before Rules rather than rewritten");
assert.match(firebaseSyncSource, /transition\.idempotent[\s\S]*conflictTimer = current;[\s\S]*return;/);
assert.match(firebaseSyncSource, /projectionResult:\s*\{ ok: true, skipped: true \}/);
assert.equal(OFFICIAL_TIMER_CONTROLLER_TYPES.includes("smartwatch"), true);
assert.equal(OFFICIAL_TIMER_CONTROLLER_TYPES.includes("hardware_remote"), true);
assert.doesNotMatch(scorerSource, /class\s+ScorerTimerEngine/);
assert.doesNotMatch(remoteSource, /class\s+(?:Remote|Field)TimerEngine/);

console.log("official-timer-authority-sync.test.mjs: ok");
