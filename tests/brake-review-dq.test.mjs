import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, BRAKE_REVIEW_RESULTS, BRAKE_REVIEW_STAGES } from "../js/core/brakeReviewPhase.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { command, freshReview } from "./helpers/brake-review-fixture.mjs";

let result = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, {
  ruleId: "cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha"
});
assert.equal(result.review.stage, BRAKE_REVIEW_STAGES.DISQUALIFIED);
assert.equal(result.review.result, BRAKE_REVIEW_RESULTS.DISQUALIFIED);
assert.equal(command(result.review, BRAKE_REVIEW_ACTIONS.AUTHORIZE).ok, false);

result = command(freshReview(), BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL, { elapsedMs: 180_000 });
assert.equal(result.review.dqRuleId, "cala_desc_revision_freno_mas_tres_minutos");
assert.equal(result.review.temporalRuleIds.length, 3);
console.log("brake-review-dq.test.mjs: ok");
