import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, getBrakeReviewStateFromTimer } from "../js/core/brakeReviewPhase.js?v=20260831-official-field-timer-responsive-display-recovery-001-v1";
import { command, context, freshReview } from "./helpers/brake-review-fixture.mjs";

let review = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, {
  ruleId: "cala_inf_resistirse_enfrenar"
}).review;
review = command(review, BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL, { elapsedMs: 60_001 }).review;
const serialized = JSON.stringify({ timerId: context.timerId, revision: 7, brakeReview: review });
const hydrated = getBrakeReviewStateFromTimer(JSON.parse(serialized), context);
assert.deepEqual(hydrated.appliedRuleIds, review.appliedRuleIds);
assert.equal(hydrated.revision, review.revision);
assert.equal(hydrated.timerId, context.timerId);
assert.equal(hydrated.audit.length, 2);
console.log("brake-review-hard-refresh.test.mjs: ok");
