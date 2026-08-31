import assert from "node:assert/strict";
import { deriveOfficialTimerLiveDisplay } from "../js/core/officialTimerLiveDisplay.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";

const T0 = Date.parse("2026-08-25T12:00:00.000Z");
for (const seconds of [10, 30, 60, 300]) {
  const display = deriveOfficialTimerLiveDisplay({
    timerId: "drift",
    status: "RUNNING",
    mode: "countup",
    officialElapsedMs: 2500,
    runningSince: T0
  }, T0 + seconds * 1000);
  assert.equal(display.elapsedMs, 2500 + seconds * 1000, `${seconds}s interpolation`);
}

const locallyAhead = deriveOfficialTimerLiveDisplay({ status: "RUNNING", officialElapsedMs: 0, runningSince: T0 }, T0 + 42300);
assert.equal(locallyAhead.elapsedMs, 42300);
const reconciledPause = deriveOfficialTimerLiveDisplay({ status: "PAUSED", officialElapsedMs: 42100, runningSince: null }, T0 + 42300);
assert.equal(reconciledPause.elapsedMs, 42100, "official pause replaces local extrapolation");
const resumed = deriveOfficialTimerLiveDisplay({ status: "RUNNING", officialElapsedMs: 42100, runningSince: T0 + 50000 }, T0 + 53000);
assert.equal(resumed.elapsedMs, 45100, "resume starts from accumulated official time");
const finished = deriveOfficialTimerLiveDisplay({ status: "FINISHED", officialElapsedMs: 45700 }, T0 + 999999);
assert.equal(finished.elapsedMs, 45700, "finish never interpolates");

console.log("official-timer-live-drift.test.mjs: ok");
