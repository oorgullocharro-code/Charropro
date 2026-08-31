import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SCORER_SAVE_LATENCY_VERSION,
  SCORER_SAVE_STAGES,
  createScorerSaveLatencyTrace,
  summarizeScorerSaveLatency
} from "../js/core/scorerSaveLatency.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

assert.equal(SCORER_SAVE_LATENCY_VERSION, "1.0.0");
assert.deepEqual(SCORER_SAVE_STAGES, ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"]);

let clock = 0;
const trace = createScorerSaveLatencyTrace({ traceId: "save-test-001", now: () => clock });
for (const [stage, at] of [["T0", 0], ["T1", 20], ["T2", 30], ["T3", 40], ["T4", 50], ["T5", 250], ["T6", 1900], ["T7", 1910], ["T8", 1911], ["T9", 1912], ["T10", 1913], ["T11", 1940], ["T12", 1880]]) {
  clock = at;
  trace.mark(stage, { stage });
}
const baseline = trace.finish("completed", { path: "official" });
assert.equal(baseline.durations.t0ToT1Ms, 20);
assert.equal(baseline.durations.t1ToT3Ms, 20);
assert.equal(baseline.durations.t3ToT5Ms, 210);
assert.equal(baseline.durations.t5ToT7Ms, 1660);
assert.equal(baseline.durations.t7ToT9Ms, 2);
assert.equal(baseline.durations.t9ToT11Ms, 28);
assert.equal(baseline.durations.t11ToT12Ms, 0);
assert.equal(baseline.durations.saveCriticalPathMs, 250);
assert.equal(baseline.durations.visualNextTurnMs, 1940);
assert.equal(baseline.durations.fullSyncMs, 1940);
assert.equal(baseline.durations.projectionBlockedVisual, true);

clock = 9999;
trace.mark("T5", { duplicate: true });
assert.equal(trace.snapshot().marks.T5.atMs, 250, "duplicate milestones are idempotent");
assert.throws(() => trace.mark("T99"), /scorer-save-latency-stage-invalid/);

const optimizedSamples = [
  { saveCriticalPathMs: 210, visualNextTurnMs: 260, fullSyncMs: 1900 },
  { saveCriticalPathMs: 220, visualNextTurnMs: 275, fullSyncMs: 2050 },
  { saveCriticalPathMs: 230, visualNextTurnMs: 290, fullSyncMs: 2200 },
  { saveCriticalPathMs: 240, visualNextTurnMs: 310, fullSyncMs: 2400 },
  { saveCriticalPathMs: 250, visualNextTurnMs: 330, fullSyncMs: 2600 }
];
const baselineSamples = [
  { saveCriticalPathMs: 210, visualNextTurnMs: 1850, fullSyncMs: 1850 },
  { saveCriticalPathMs: 220, visualNextTurnMs: 1940, fullSyncMs: 1940 },
  { saveCriticalPathMs: 230, visualNextTurnMs: 2050, fullSyncMs: 2050 },
  { saveCriticalPathMs: 240, visualNextTurnMs: 2180, fullSyncMs: 2180 },
  { saveCriticalPathMs: 250, visualNextTurnMs: 2250, fullSyncMs: 2250 }
];
const baselineSummary = summarizeScorerSaveLatency(baselineSamples);
assert.deepEqual(baselineSummary.saveCriticalPath, { count: 5, p50Ms: 230, p95Ms: 250, maxMs: 250 });
assert.deepEqual(baselineSummary.visualNextTurn, { count: 5, p50Ms: 2050, p95Ms: 2250, maxMs: 2250 });
assert.deepEqual(baselineSummary.fullSync, { count: 5, p50Ms: 2050, p95Ms: 2250, maxMs: 2250 });

const summary = summarizeScorerSaveLatency(optimizedSamples);
assert.equal(summary.sampleCount, 5);
assert.deepEqual(summary.saveCriticalPath, { count: 5, p50Ms: 230, p95Ms: 250, maxMs: 250 });
assert.deepEqual(summary.visualNextTurn, { count: 5, p50Ms: 290, p95Ms: 330, maxMs: 330 });
assert.deepEqual(summary.fullSync, { count: 5, p50Ms: 2200, p95Ms: 2600, maxMs: 2600 });

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const firebaseSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const authoritySource = await readFile(new URL("../functions/officialScoreConcurrency.js", import.meta.url), "utf8");
assert.match(appSource, /if \(officialPublishInProgress\) \{/);
assert.match(appSource, /deferPublicProjection: true/);
assert.match(appSource, /label: "Sincronizando…"/);
assert.match(appSource, /label: "Guardado ✓"/);
assert.match(appSource, /label: "Pendiente de sincronizar"/);
assert.match(firebaseSource, /if \(options\.deferPublicProjection === true\) \{/);
assert.match(firebaseSource, /backgroundPending: true/);
assert.match(firebaseSource, /void reconcileProjection\(\)/);
assert.match(firebaseSource, /notifyOfficialScoreBackgroundSettlement/);
assert.doesNotMatch(appSource, /readFirebaseActiveCharreadaSnapshot/);
assert.match(
  authoritySource,
  /activeCharreadaId[\s\S]*?request\.published\.charreada\.id[\s\S]*?official-score-active-charreada-mismatch/
);
assert.match(appSource, /setOfficialPublishButtonBusy\(true\)/);
assert.match(appSource, /markScorerSaveLatency\(latencyTrace, "T11"[\s\S]*?setTimeout\(\(\) => syncCurrentLiveState/);
const settlementSource = appSource.slice(
  appSource.indexOf("function settleOfficialScoreBackgroundPublication"),
  appSource.indexOf("function resetScoreSaveStatusForDraft")
);
assert.doesNotMatch(settlementSource, /advanceScoringPointer|advanceAfterCompletedTernaSession/);

console.log("scorer save latency tests: OK");
