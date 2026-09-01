import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, applyBrakeReviewCommand } from "../js/core/brakeReviewPhase.js?v=20260831-official-ranking-authority-public-parity-001-v1";
import { actor, catalog, command, context, freshReview } from "./helpers/brake-review-fixture.mjs";

const first = command(freshReview(), BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL, {
  elapsedMs: 120_001,
  commandId: "threshold-command"
});
const replay = applyBrakeReviewCommand(first.review, {
  action: BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL,
  commandId: "threshold-command",
  expectedRevision: 0,
  elapsedMs: 120_001,
  actor
}, { actor, catalog, context });
assert.equal(replay.ok, true);
assert.equal(replay.idempotent, true);
assert.equal(replay.review.revision, first.review.revision);
assert.equal(replay.review.audit.length, 1);
assert.equal(replay.review.temporalRuleIds.length, 2);
console.log("brake-review-idempotency.test.mjs: ok");
