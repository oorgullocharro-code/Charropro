import assert from "node:assert/strict";
import {
  compareOfficialTimerSnapshots,
  deriveOfficialTimerLiveDisplay
} from "../js/core/officialTimerLiveDisplay.js?v=20260826-pre-cala-brake-review-official-phase-002-v1";

const T0 = Date.parse("2026-08-25T12:00:00.000Z");
const base = { timerId: "timer-1", durationMs: 60000, officialElapsedMs: 10000, sourceRevision: 1 };

assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "READY" }, T0).formatted, "00:50.0");
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "RUNNING", runningSince: T0, mode: "countup" }, T0 + 12300).formatted, "00:22.3");
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "RUNNING", runningSince: T0, mode: "countdown" }, T0 + 12300).formatted, "00:37.7");
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "PAUSED" }, T0 + 50000).elapsedMs, 10000);
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "RUNNING", runningSince: T0 + 20000 }, T0 + 25000).elapsedMs, 15000, "resume uses the new official anchor");
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "FINISHED", officialElapsedMs: 42000 }, T0 + 50000).elapsedMs, 42000);
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "STALE" }, T0).stateLabel, "DESACTUALIZADO");
assert.equal(deriveOfficialTimerLiveDisplay({ ...base, status: "OFFLINE" }, T0).stateLabel, "SIN CONEXION");

assert.deepEqual(compareOfficialTimerSnapshots(
  { timerId: "piales", sourceRevision: 11 },
  { timerId: "piales", sourceRevision: 10 }
), { adopt: false, reason: "official-timer-revision-regression" });
assert.deepEqual(compareOfficialTimerSnapshots(
  { timerId: "piales", sourceRevision: 11 },
  { timerId: "piales", sourceRevision: 11 }
), { adopt: false, reason: "official-timer-revision-duplicate" });
assert.equal(compareOfficialTimerSnapshots({}, {
  timerId: "piales", charreadaId: "c1", suerteId: "piales", sourceRevision: 12
}, { expectedIdentity: { timerId: "piales", charreadaId: "c1", suerteId: "piales" } }).adopt, true);

console.log("official-timer-live-display.test.mjs: ok");
