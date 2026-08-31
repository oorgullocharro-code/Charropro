import assert from "node:assert/strict";
import {
  FMCH_2026_LIBRE_PROFILE,
  FMCH_2026_LIBRE_PROFILE_0_6_1,
  getRuleProfileRulesByPhase,
  validateRuleProfile
} from "../js/data/ruleProfiles.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  FMCH_2026_BRAKE_REVIEW_PHASE_ID,
  FMCH_2026_BRAKE_REVIEW_RECONCILIATION
} from "../js/data/fmch2026BrakeReviewRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

const ruleMap = new Map(FMCH_2026_LIBRE_PROFILE_0_6_1.rules.map((rule) => [rule.ruleId, rule]));
const phaseRules = getRuleProfileRulesByPhase(FMCH_2026_LIBRE_PROFILE_0_6_1, FMCH_2026_BRAKE_REVIEW_PHASE_ID);
const previouslyWrongPhase = [
  "cala_inf_revision_freno_mas_un_minuto",
  "cala_inf_revision_freno_mas_dos_minutos",
  "cala_inf_resistirse_enfrenar",
  "cala_inf_resistirse_estribo",
  "cala_desc_negativa_enfrenar_estribar",
  "cala_desc_salirse_rectangulo",
  "cala_desc_caballo_otro_equipo_fase",
  "cala_desc_salida_incorrecta_revision",
  "cala_desc_retirarse_ruedo_revision",
  "cala_inf_patada_una_extremidad",
  "cala_desc_patada_doble"
];

assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(FMCH_2026_LIBRE_PROFILE.rules.length, 731);
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_1.version, "0.6.1");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_1.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_1.rules.length, 734);
assert.equal(validateRuleProfile(FMCH_2026_LIBRE_PROFILE_0_6_1).valid, true);
assert.equal(FMCH_2026_BRAKE_REVIEW_RECONCILIATION.length, 19);
assert.equal(phaseRules.length, 17);

for (const ruleId of previouslyWrongPhase) {
  assert.equal(ruleMap.get(ruleId)?.metadata?.phaseId, FMCH_2026_BRAKE_REVIEW_PHASE_ID, `${ruleId} has phase ownership`);
}

assert.equal(ruleMap.get("cala_desc_freno_arreo_prohibido_cambio")?.enabled, false);
assert.deepEqual(ruleMap.get("cala_desc_freno_arreo_prohibido_cambio")?.metadata?.replacedBy, [
  "cala_desc_revision_freno_arreo_prohibido_riendas_disparejas",
  "cala_desc_cambio_freno_caballo"
]);
assert.equal(ruleMap.get("cala_desc_presentador_diferente")?.enabled, false);
assert.equal(ruleMap.get("cala_desc_presentador_diferente")?.metadata?.aliasOf, "cala_desc_competidor_distinto");
assert.equal(ruleMap.get("cala_desc_competidor_distinto")?.enabled, true);
assert.equal(ruleMap.get("cala_desc_cambio_freno_caballo")?.enabled, true);
assert.deepEqual(ruleMap.get("cala_desc_persona_rectangulos")?.metadata?.phaseIds, ["freno_review", "cala_execution"]);

console.log("fmch-2026-0.6.1-brake-review-rules.test.mjs: ok");
