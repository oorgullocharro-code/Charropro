import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, BRAKE_REVIEW_RESULTS } from "../js/core/brakeReviewPhase.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import { command, freshReview } from "./helpers/brake-review-fixture.mjs";

const manualIds = [
  "cala_inf_resistirse_enfrenar",
  "cala_inf_resistirse_estribo",
  "cala_inf_patada_una_extremidad",
  "cala_desc_negativa_enfrenar_estribar",
  "cala_desc_patada_doble",
  "cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha",
  "cala_desc_revision_freno_arreo_prohibido_riendas_disparejas",
  "cala_desc_salirse_rectangulo"
];
for (const ruleId of manualIds) {
  const result = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, { ruleId, commandId: `manual:${ruleId}` });
  assert.equal(result.ok, true, ruleId);
  assert.equal(result.review.appliedRuleIds.includes(ruleId), true, ruleId);
}
let review = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, { ruleId: "cala_inf_resistirse_enfrenar" }).review;
const audit = review.audit.at(-1);
assert.equal(audit.tournamentId, "tournament-fixture");
assert.equal(audit.charreadaId, "charreada-fixture");
assert.equal(audit.teamId, "team-fixture");
assert.equal(audit.competitorId, "competitor-fixture");
assert.equal(audit.horseId, "horse-fixture");
assert.equal(audit.phaseId, "freno_review");
assert.equal(audit.ruleProfileVersion, "0.6.1");
assert.equal(audit.temporalPolicyFingerprint, "fmchtp_7d1e001181026f6d");
assert.equal(audit.ruleId, "cala_inf_resistirse_enfrenar");
assert.equal(audit.points, 1);
assert.equal(audit.actorUid, "judge-fixture");
assert.equal(audit.actorRole, "juez");
review = command(review, BRAKE_REVIEW_ACTIONS.AUTHORIZE).review;
assert.equal(review.result, BRAKE_REVIEW_RESULTS.AUTHORIZED_WITH_INFRACTIONS);
console.log("brake-review-manual-infractions.test.mjs: ok");
