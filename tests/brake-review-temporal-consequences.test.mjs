import assert from "node:assert/strict";
import { resolveBrakeReviewTemporalRuleIds } from "../js/core/brakeReviewPhase.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";

assert.deepEqual(resolveBrakeReviewTemporalRuleIds(59_999), []);
assert.deepEqual(resolveBrakeReviewTemporalRuleIds(60_000), []);
assert.deepEqual(resolveBrakeReviewTemporalRuleIds(60_001), ["cala_inf_revision_freno_mas_un_minuto"]);
assert.deepEqual(resolveBrakeReviewTemporalRuleIds(119_999), ["cala_inf_revision_freno_mas_un_minuto"]);
assert.deepEqual(resolveBrakeReviewTemporalRuleIds(120_000), ["cala_inf_revision_freno_mas_un_minuto"]);
assert.deepEqual(resolveBrakeReviewTemporalRuleIds(120_001), [
  "cala_inf_revision_freno_mas_un_minuto",
  "cala_inf_revision_freno_mas_dos_minutos"
]);
assert.equal(resolveBrakeReviewTemporalRuleIds(179_999).includes("cala_desc_revision_freno_mas_tres_minutos"), false);
assert.equal(resolveBrakeReviewTemporalRuleIds(180_000).includes("cala_desc_revision_freno_mas_tres_minutos"), true);
assert.equal(resolveBrakeReviewTemporalRuleIds(180_001).includes("cala_desc_revision_freno_mas_tres_minutos"), true);
console.log("brake-review-temporal-consequences.test.mjs: ok");
