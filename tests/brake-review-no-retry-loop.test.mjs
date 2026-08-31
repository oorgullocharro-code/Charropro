import assert from "node:assert/strict";
import { createBrakeReviewAutomaticCommandGuard } from "../js/core/brakeReviewPhase.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

const guard = createBrakeReviewAutomaticCommandGuard();
const key = "timer-a:review-0:minute-1";
assert.equal(guard.begin(key, "command-a"), true);
assert.equal(guard.begin(key, "command-b"), false, "pending work is single-flight");
assert.equal(guard.commandId(key), "command-a");
guard.complete(key, false);
assert.deepEqual(guard.diagnostics(), { pending: 0, terminalFailures: 1 });
for (let tick = 0; tick < 100; tick += 1) {
  assert.equal(guard.begin(key, `retry-${tick}`), false, "a failed logical state never retries on the ticker");
}
assert.equal(guard.begin("timer-a:review-1:minute-1", "command-next-revision"), true, "a new authoritative review revision may synchronize");

console.log("brake-review-no-retry-loop.test.mjs: ok");
