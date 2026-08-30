import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, applyBrakeReviewCommand } from "../js/core/brakeReviewPhase.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { actor, catalog, context, freshReview } from "./helpers/brake-review-fixture.mjs";

const commandId = "brake-review:single-logical-attempt";
const first = applyBrakeReviewCommand(freshReview(), {
  action: BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL,
  commandId,
  expectedRevision: 0,
  elapsedMs: 60_001,
  actor
}, { actor, catalog, context });
const retry = applyBrakeReviewCommand(first.review, {
  action: BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL,
  commandId,
  expectedRevision: 0,
  elapsedMs: 60_001,
  actor
}, { actor, catalog, context });

assert.equal(first.ok, true);
assert.equal(first.idempotent, false);
assert.equal(retry.ok, true);
assert.equal(retry.idempotent, true);
assert.equal(retry.review.revision, 1);
assert.deepEqual(retry.review.commandIds, [commandId]);
assert.equal(retry.review.audit.length, 1);

console.log("brake-review-single-command-idempotency.test.mjs: ok");
