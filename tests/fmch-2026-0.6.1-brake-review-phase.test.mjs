import assert from "node:assert/strict";
import {
  FMCH_2026_LIBRE_PROFILE_0_6_1,
  getRuleProfileRulesByPhase,
  resolveEffectiveRules
} from "../js/data/ruleProfiles.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";
import { getSuerteById } from "../js/data/suertes.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";

const phaseRules = getRuleProfileRulesByPhase(FMCH_2026_LIBRE_PROFILE_0_6_1, "freno_review");
const phaseRuleIds = new Set(phaseRules.map((rule) => rule.ruleId));
assert.equal(phaseRules.length, 17);
assert.equal(phaseRules.every((rule) => rule.enabled !== false), true);
assert.equal(phaseRuleIds.has("cala_desc_freno_arreo_prohibido_cambio"), false);
assert.equal(phaseRuleIds.has("cala_desc_presentador_diferente"), false);

phaseRules[0].metadata.phaseId = "tampered";
assert.equal(getRuleProfileRulesByPhase(FMCH_2026_LIBRE_PROFILE_0_6_1, "freno_review")[0].metadata.phaseId, "freno_review");

const normalCala = resolveEffectiveRules({
  suerte: getSuerteById("cala"),
  profile: FMCH_2026_LIBRE_PROFILE_0_6_1,
  context: { phaseId: "cala_execution" }
});
const normalIds = new Set(Object.values(normalCala.suerte.catalog).flat().map((rule) => rule.ruleId));
assert.equal(normalCala.valid, true);
assert.equal(normalIds.has("cala_base_completa"), true);
assert.equal(normalIds.has("cala_lado_derecho_velocidad"), true);
assert.equal(normalIds.has("cala_desc_revision_freno_mas_tres_minutos"), false);
assert.equal(normalIds.has("cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha"), false);
assert.equal(normalIds.has("cala_inf_revision_freno_mas_un_minuto"), false);
assert.equal(normalIds.has("cala_desc_patada_doble"), true, "cross-phase rule remains valid in Cala execution");

console.log("fmch-2026-0.6.1-brake-review-phase.test.mjs: ok");
