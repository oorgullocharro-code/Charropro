import assert from "node:assert/strict";
import {
  BRAKE_REVIEW_ACTIONS,
  BRAKE_REVIEW_RESULTS,
  BRAKE_REVIEW_STAGES,
  isBrakeReviewProfile
} from "../js/core/brakeReviewPhase.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import { command, freshReview } from "./helpers/brake-review-fixture.mjs";

let review = freshReview();
assert.equal(isBrakeReviewProfile({
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileContentFingerprint: "rptp_10e596046446e850"
}), true);
assert.equal(isBrakeReviewProfile({
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.0",
  ruleProfileContentFingerprint: "rptp_0f90f7a3944a82d7"
}), false);
assert.equal(isBrakeReviewProfile({
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileContentFingerprint: "tampered"
}), false);
assert.equal(review.stage, BRAKE_REVIEW_STAGES.REVIEW);
let result = command(review, BRAKE_REVIEW_ACTIONS.AUTHORIZE);
assert.equal(result.ok, true);
review = result.review;
assert.equal(review.stage, BRAKE_REVIEW_STAGES.PROTOCOL);
assert.equal(review.result, BRAKE_REVIEW_RESULTS.AUTHORIZED);
result = command(review, BRAKE_REVIEW_ACTIONS.CALL_JUDGES);
assert.equal(result.review.stage, BRAKE_REVIEW_STAGES.JUDGES_CALL);
result = command(result.review, BRAKE_REVIEW_ACTIONS.MARK_CALA_READY);
assert.equal(result.review.stage, BRAKE_REVIEW_STAGES.CALA_READY);
assert.equal(result.review.audit.length, 3);
console.log("brake-review-phase-flow.test.mjs: ok");
