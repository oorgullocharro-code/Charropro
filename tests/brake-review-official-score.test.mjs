import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, applyBrakeReviewToCalaAttempt } from "../js/core/brakeReviewPhase.js?v=20260828-fmch-terna-participant-identity-roster-persistence-001-v1";
import { emptyAttempt } from "../js/core/state.js?v=20260828-fmch-terna-participant-identity-roster-persistence-001-v1";
import { catalog, command, freshReview } from "./helpers/brake-review-fixture.mjs";

let review = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, {
  ruleId: "cala_inf_resistirse_enfrenar"
}).review;
review = command(review, BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL, { elapsedMs: 120_001 }).review;
const attempt = applyBrakeReviewToCalaAttempt(emptyAttempt(), review, catalog);
assert.deepEqual(new Set(attempt.applied), new Set([
  "cala_inf_resistirse_enfrenar",
  "cala_inf_revision_freno_mas_un_minuto",
  "cala_inf_revision_freno_mas_dos_minutos"
]));
assert.equal(attempt.infr, 3);
assert.equal(attempt.brakeReview.ruleProfileVersion, "0.6.1");
assert.equal(attempt.brakeReview.temporalPolicyFingerprint, "fmchtp_7d1e001181026f6d");

review = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, {
  ruleId: "cala_desc_patada_doble"
}).review;
const dqAttempt = applyBrakeReviewToCalaAttempt(emptyAttempt(), review, catalog);
assert.equal(dqAttempt.descRuleId, "cala_desc_patada_doble");
assert.equal(dqAttempt.attempted, true);
console.log("brake-review-official-score.test.mjs: ok");
