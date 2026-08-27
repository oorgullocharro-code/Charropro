import assert from "node:assert/strict";
import { FMCH_2026_LIBRE_PROFILE_0_6_1 } from "../js/data/ruleProfiles.js?v=20260826-fmch-2026-061-production-activation-v1";

const dqRules = new Map(FMCH_2026_LIBRE_PROFILE_0_6_1.rules
  .filter((rule) => rule.suerteId === "cala" && rule.category === "desc")
  .map((rule) => [rule.ruleId, rule]));
const overThree = dqRules.get("cala_desc_revision_freno_mas_tres_minutos");
const wrongMount = dqRules.get("cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha");

assert.ok(overThree);
assert.equal(overThree.metadata.phaseId, "freno_review");
assert.equal(overThree.metadata.temporalRuleId, "fmch_2026_cala_freno_review");
assert.equal(overThree.metadata.consequence, "DISQUALIFICATION");
assert.equal(overThree.metadata.officialFormat.total, "FMCH.TEAM_SHEET.CALA.TOTAL");
assert.notEqual(overThree.ruleId, "cala_desc_dos_minutos", "review DQ is not the partidero DQ");
assert.notEqual(overThree.ruleId, "cala_desc_salida_incorrecta_revision");
assert.notEqual(overThree.ruleId, "cala_desc_negativa_enfrenar_estribar");

assert.ok(wrongMount);
assert.equal(wrongMount.metadata.phaseId, "freno_review");
assert.equal(wrongMount.metadata.consequence, "DISQUALIFICATION");
assert.equal(wrongMount.metadata.sourceDisqualification, "IX");
assert.notEqual(wrongMount.ruleId, "cala_desc_negativa_enfrenar_estribar");
assert.equal(Object.hasOwn(overThree, "value"), false);
assert.equal(Object.hasOwn(wrongMount, "value"), false);

console.log("fmch-2026-0.6.1-brake-review-dq.test.mjs: ok");
