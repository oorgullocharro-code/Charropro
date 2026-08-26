import assert from "node:assert/strict";
import fs from "node:fs";
import {
  SCORER_DUPLICATE_TAP_WINDOW_MS,
  buildScorerInteractionKey,
  createAfterPaintTaskQueue,
  createScorerDuplicateActionGuard,
  createScorerInteractionTrace,
  isScorerInteractionAction
} from "../js/core/scorerInteractionLatency.js?v=20260826-pre-cala-brake-review-official-phase-002-v1";
import { getCharreadaScoringSuertes } from "../js/core/state.js?v=20260826-pre-cala-brake-review-official-phase-002-v1";

let clock = 1000;
const guard = createScorerDuplicateActionGuard({ now: () => clock });
const toggle = { type: "adic", id: "cala_adic_ld", index: "0" };

assert.equal(isScorerInteractionAction("toggle-rule"), true);
assert.equal(isScorerInteractionAction("save-settings"), false);
assert.match(buildScorerInteractionKey("toggle-rule", toggle), /^toggle-rule\|/);
assert.equal(guard.accept("toggle-rule", toggle).accepted, true, "first logical toggle is accepted");
clock += SCORER_DUPLICATE_TAP_WINDOW_MS - 1;
assert.equal(guard.accept("toggle-rule", toggle).accepted, false, "same rapid toggle is deduplicated");
assert.equal(guard.accept("toggle-rule", { ...toggle, id: "cala_adic_li" }).accepted, true, "a different control remains responsive");
clock += SCORER_DUPLICATE_TAP_WINDOW_MS;
assert.equal(guard.accept("toggle-rule", toggle).accepted, true, "the same control remains intentionally reversible after the protection window");
assert.equal(guard.accept("adjust-rule-quantity", toggle).accepted, true, "repeatable numeric controls are never debounce-blocked");
assert.equal(guard.accept("adjust-rule-quantity", toggle).accepted, true, "consecutive quantity adjustments remain valid");

const frames = [];
const tasks = [];
const calls = [];
const queue = createAfterPaintTaskQueue({
  scheduleFrame: (callback) => frames.push(callback),
  scheduleTask: (callback) => tasks.push(callback)
});
assert.equal(queue.schedule("draft", () => calls.push("stale")), true);
assert.equal(queue.schedule("draft", () => calls.push("latest")), false, "one queued key owns one frame");
assert.equal(queue.pendingCount(), 1);
assert.deepEqual(calls, [], "persistence does not block local feedback");
frames.shift()();
assert.deepEqual(calls, [], "persistence remains deferred until the post-frame task");
tasks.shift()();
assert.deepEqual(calls, ["latest"], "rapid draft changes coalesce to the latest complete state");
assert.equal(queue.pendingCount(), 0);

const cachedTournament = {
  id: "latency-tournament",
  type: "completo",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.0",
  ruleProfileAssignment: {
    authorityVersion: "1.0.0",
    tournamentId: "latency-tournament",
    profileId: "FMCH_2026_LIBRE",
    version: "0.6.0",
    status: "active",
    contentFingerprint: "rptp_0f90f7a3944a82d7",
    revision: 1
  },
  ruleOverridesUpdatedAt: "2026-08-24T00:00:00.000Z"
};
const cachedCharreada = {
  id: "latency-charreada",
  competitionType: "equipos_completo",
  competitionScope: "team",
  competitionId: "equipos_completo",
  suerteIds: ["cala", "piales", "colas"]
};
const cachedOverrides = {};
const firstResolution = getCharreadaScoringSuertes(cachedCharreada, cachedTournament, cachedOverrides);
const secondResolution = getCharreadaScoringSuertes(cachedCharreada, cachedTournament, cachedOverrides);
assert.equal(secondResolution, firstResolution, "warm scoring navigation reuses one immutable rules resolution");
cachedTournament.ruleOverridesUpdatedAt = "2026-08-24T00:01:00.000Z";
const invalidatedResolution = getCharreadaScoringSuertes(cachedCharreada, cachedTournament, cachedOverrides);
assert.notEqual(invalidatedResolution, firstResolution, "a rules revision invalidates the scorer cache");

let traceClock = 0;
const trace = createScorerInteractionTrace({ now: () => traceClock, traceId: "test", kind: "interaction" });
trace.mark("T0");
traceClock = 7;
trace.mark("T1");
traceClock = 12;
trace.mark("T2");
traceClock = 20;
trace.mark("T3");
traceClock = 32;
trace.mark("T4");
traceClock = 35;
trace.mark("T5");
traceClock = 42;
trace.mark("T6");
const snapshot = trace.finish();
assert.equal(snapshot.durations.touchToVisibleMs, 32);
assert.equal(snapshot.durations.persistenceMs, 7);

const app = fs.readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
assert.equal((app.match(/document\.addEventListener\("pointerdown"/g) || []).length, 1, "one delegated pointer listener owns scorer feedback");
assert.match(app, /document\.addEventListener\("pointerdown"[\s\S]*?\{ passive: true \}\);/);
assert.match(app, /function persistScoreChange\(\)[\s\S]*?render\(\{ preserveScoringScroll: true \}\);[\s\S]*?scorerAfterPaintQueue\.schedule\("scoring-draft"/);
assert.match(app, /function saveScoringNavigationDraft\(\)[\s\S]*?scorerAfterPaintQueue\.schedule\("scoring-navigation"/);
assert.match(app, /function stopTimer\(reset = false\)[\s\S]*?if \(timerChanged\) persistTimerState\(\);/);
assert.doesNotMatch(app.match(/function persistScoreChange\(\)[\s\S]*?\n\}/)?.[0] || "", /publishFirebaseOfficialScoreAtomic|publishedScores|projectionOutbox/);
assert.match(css, /\.scoring-shell-classic \.cp-scoring-action-button[\s\S]*?touch-action: manipulation;/);
assert.match(css, /\.cp-touch-received/);

console.log("PASS scorer-interaction-latency");
