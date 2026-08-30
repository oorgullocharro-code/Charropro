import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext
} from "../js/core/timerRules.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { buildOfficialCurrentTimerContext } from "../js/core/officialTimerOrchestration.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { updateOfficialTimerDomDisplays } from "../js/core/officialTimerLiveDisplay.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import {
  createScorerOfficialTimerConsumer,
  subscribeScorerOfficialTimerCurrent
} from "../js/core/scorerOfficialTimerConsumer.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

const T0 = Date.parse("2026-08-27T20:00:00.000Z");
const actor = { id: "judge_live", uid: "judge_live", role: "juez" };
const controller = {
  controllerId: "phone_live",
  controllerUid: actor.uid,
  controllerRole: actor.role,
  controllerSessionId: "phone_live_session",
  controllerType: "field_remote"
};
const tournament = {
  id: "global_timer_reactivity",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileContentFingerprint: "rptp_10e596046446e850",
  effectiveRulesFingerprint: "rptp_10e596046446e850"
};

function definitions(suerteId, teamId, attemptIndex = 0) {
  return buildOfficialTimerDefinitionsFromContext({
    tournament,
    charreada: { id: "charreada_live", competitionId: "equipos_completo" },
    turn: {
      competition: { id: "equipos_completo" },
      team: { id: teamId, name: teamId },
      suerte: { id: suerteId, name: suerteId },
      attemptIndex,
      coleadorIndex: 0
    }
  });
}

function command(timer, definition, type, now) {
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

const matrix = [
  ["Brake Review", () => definitions("cala", "team_brake")[0]],
  ["Cala", () => definitions("cala", "team_cala")[1]],
  ["Piales", () => definitions("piales", "team_piales")[0]],
  ["Coleadero", () => definitions("colas", "team_colas")[0]],
  ["Toro", () => definitions("toro", "team_toro")[0]],
  ["Terna", () => definitions("lazo", "team_terna")[0]],
  ["Yegua", () => definitions("yegua", "team_yegua")[0]],
  ["Manganas Pie", () => definitions("manganas_pie", "team_manganas_pie")[0]],
  ["Manganas Caballo", () => definitions("manganas_caballo", "team_manganas_caballo")[1]],
  ["Paso", () => definitions("paso", "team_paso")[0]]
];

let callback = null;
let subscribeCount = 0;
let unsubscribeCount = 0;
let stateUpdates = 0;
let invalidations = 0;
let displayRefreshes = 0;
const state = { registry: {}, currentTimerContext: null };
const consumer = createScorerOfficialTimerConsumer({
  readState: () => state,
  commitState: (next) => {
    state.registry = next.registry;
    state.currentTimerContext = next.currentTimerContext;
    stateUpdates += 1;
  },
  invalidate: () => { invalidations += 1; },
  refreshDisplay: () => { displayRefreshes += 1; }
});
const unsubscribe = subscribeScorerOfficialTimerCurrent({
  liveChannel: tournament.id,
  subscribe: (channel, listener) => {
    subscribeCount += 1;
    assert.equal(channel, tournament.id);
    callback = listener;
    return () => { unsubscribeCount += 1; };
  },
  onCurrent: (payload) => consumer.consume({
    incomingCurrentTimerContext: payload.currentTimerContext,
    now: payload.now
  })
});

let eventCount = 0;
let now = T0;
for (const [label, resolveDefinition] of matrix) {
  const definition = resolveDefinition();
  let timer = createOfficialTimerContext(definition, { now });
  const expected = [
    [null, 0, "READY"],
    ["START", 100, "RUNNING"],
    ["PAUSE", 200, "PAUSED"],
    ["RESUME", 300, "RUNNING"],
    ["FINISH", 400, "FINISHED"]
  ];
  for (const [operation, offset, status] of expected) {
    if (operation) timer = command(timer, definition, operation, now + offset);
    callback({
      currentTimerContext: buildOfficialCurrentTimerContext(timer, definition, { now: now + offset }),
      now: now + offset
    });
    eventCount += 1;
    assert.equal(state.currentTimerContext.status, status, `${label} reacts to remote ${operation || "READY"}`);
    assert.equal(state.currentTimerContext.timerId, definition.timerId, `${label} replaces the prior timer immediately`);
  }
  now += 1000;
}

assert.equal(subscribeCount, 1, "the Scorer installs one authoritative live/current listener");
assert.equal(stateUpdates, eventCount, "one Firebase currentTimer event produces one state update");
assert.equal(invalidations, eventCount, "one accepted event invalidates the timer consumer once");
assert.equal(consumer.diagnostics().timerReplacements, matrix.length, "each context binds exactly once");
assert.equal(displayRefreshes, 0);
callback({ currentTimerContext: state.currentTimerContext, now });
assert.equal(invalidations, eventCount, "a duplicate revision is idempotent");
assert.equal(displayRefreshes, 1, "a duplicate only refreshes the mounted display");
unsubscribe();
unsubscribe();
assert.equal(unsubscribeCount, 1, "unsubscribe is idempotent and cannot leak listeners");

const colaDefinition = definitions("colas", "team_dom")[0];
let colaTimer = createOfficialTimerContext(colaDefinition, { now: T0 });
colaTimer = command(colaTimer, colaDefinition, "START", T0);
const display = { dataset: { officialTimerId: colaTimer.timerId }, textContent: "" };
const root = { querySelectorAll: () => [display] };
const registry = { [colaTimer.timerId]: colaTimer };
const values = [T0, T0 + 1000, T0 + 2000].map((tickNow) => {
  updateOfficialTimerDomDisplays(root, registry, tickNow);
  return display.textContent;
});
assert.deepEqual(values, ["00:20.0", "00:19.0", "00:18.0"]);
colaTimer = command(colaTimer, colaDefinition, "PAUSE", T0 + 2000);
registry[colaTimer.timerId] = colaTimer;
updateOfficialTimerDomDisplays(root, registry, T0 + 5000);
const pausedValue = display.textContent;
updateOfficialTimerDomDisplays(root, registry, T0 + 9000);
assert.equal(display.textContent, pausedValue, "PAUSE freezes the Scorer DOM");
colaTimer = command(colaTimer, colaDefinition, "RESUME", T0 + 10000);
registry[colaTimer.timerId] = colaTimer;
updateOfficialTimerDomDisplays(root, registry, T0 + 11000);
const resumedValue = display.textContent;
updateOfficialTimerDomDisplays(root, registry, T0 + 12000);
assert.notEqual(display.textContent, resumedValue, "RESUME restarts DOM interpolation");
colaTimer = command(colaTimer, colaDefinition, "FINISH", T0 + 13000);
registry[colaTimer.timerId] = colaTimer;
updateOfficialTimerDomDisplays(root, registry, T0 + 14000);
const finishedValue = display.textContent;
updateOfficialTimerDomDisplays(root, registry, T0 + 18000);
assert.equal(display.textContent, finishedValue, "FINISH freezes at the canonical value");

const scorerSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const phoneSource = readFileSync(new URL("../js/views/cronometro-control.js", import.meta.url), "utf8");
const tickSource = scorerSource.match(/function updateTernaTimerDisplays[\s\S]*?\n}/)?.[0] || "";
assert.match(scorerSource, /subscribeScorerOfficialTimerCurrent\(\{[\s\S]*subscribe:\s*subscribeFirebaseLiveCurrent/);
assert.doesNotMatch(scorerSource.match(/function subscribeExternalTimerControl[\s\S]*?\n}/)?.[0] || "", /subscribeFirebaseLive\(/);
assert.doesNotMatch(tickSource, /\brender\(/, "the live ticker never renders the full Scorer");
assert.doesNotMatch(tickSource, /publishFirebase|runTransaction|setFirebase|updateFirebase/i, "ticks perform zero Firebase writes");
assert.doesNotMatch(phoneSource, /window\.confirm\([^)]*Finalizar/i, "phone FINISH has no confirmation modal");
assert.match(phoneSource, /if \(!requireTimerAccess\(\) \|\| pendingAction\) return;/);
assert.match(phoneSource, /expectedRevision:\s*Number\(timer\.revision \|\| 0\)/);
assert.match(phoneSource, /commandId/);
assert.match(phoneSource, /FINALIZANDO\.\.\./);

console.log("scorer-global-official-timer-reactivity.test.mjs: ok");
