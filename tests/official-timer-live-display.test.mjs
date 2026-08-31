import assert from "node:assert/strict";
import {
  compareOfficialTimerSnapshots,
  deriveOfficialTimerLiveDisplay,
  formatOfficialTimerMs
} from "../js/core/officialTimerLiveDisplay.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

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

const overtime = deriveOfficialTimerLiveDisplay({
  timerId: "timer-overtime",
  status: "RUNNING",
  mode: "countdown",
  durationMs: 1000,
  officialElapsedMs: 0,
  runningSince: T0
}, T0 + 1100);
assert.equal(overtime.remainingMs, -100);
assert.equal(overtime.overtimeMs, 100);
assert.equal(overtime.formatted, "-00:00.1");
assert.equal(overtime.alertState, "overtime");
assert.equal(overtime.overtime, true);
assert.equal(formatOfficialTimerMs(0), "00:00.0");
assert.equal(formatOfficialTimerMs(-0), "00:00.0");
assert.equal(formatOfficialTimerMs(-17400), "-00:17.4");
assert.equal(formatOfficialTimerMs(-63200), "-01:03.2");
assert.equal(formatOfficialTimerMs(Number.NaN), "00:00.0");
assert.equal(formatOfficialTimerMs(Number.POSITIVE_INFINITY), "00:00.0");

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
