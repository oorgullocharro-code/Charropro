import assert from "node:assert/strict";
import {
  FMCH_2026_LIBRE_PROFILE,
  FMCH_2026_LIBRE_PROFILE_0_6_0,
  FMCH_2026_LIBRE_PROFILE_0_6_1,
  getRuleProfile,
  resolveEffectiveRules
} from "../js/data/ruleProfiles.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

assert.equal(FMCH_2026_LIBRE_PROFILE, FMCH_2026_LIBRE_PROFILE_0_6_0);
assert.equal(getRuleProfile("FMCH_2026_LIBRE", "0.6.0"), FMCH_2026_LIBRE_PROFILE_0_6_0);
assert.equal(getRuleProfile("FMCH_2026_LIBRE", "0.6.1"), FMCH_2026_LIBRE_PROFILE_0_6_1);
assert.equal(buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE_0_6_0), "rptp_0f90f7a3944a82d7");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_0.rules.some((rule) => rule.ruleId === "cala_desc_revision_freno_mas_tres_minutos"), false);

const inheritedRules = new Map(FMCH_2026_LIBRE_PROFILE_0_6_1.rules.map((rule) => [
  `${rule.suerteId}:${rule.category}:${rule.ruleId}`,
  rule
]));
for (const rule of FMCH_2026_LIBRE_PROFILE_0_6_0.rules) {
  const inherited = inheritedRules.get(`${rule.suerteId}:${rule.category}:${rule.ruleId}`);
  assert.ok(inherited, `${rule.ruleId} remains present`);
  assert.equal(inherited.value, rule.value, `${rule.ruleId} numeric value is unchanged`);
  assert.equal(inherited.pts, rule.pts, `${rule.ruleId} numeric points are unchanged`);
}

for (const suerte of SUERTES.filter((item) => item.id !== "cala")) {
  const before = resolveEffectiveRules({ suerte, profile: FMCH_2026_LIBRE_PROFILE_0_6_0 });
  const after = resolveEffectiveRules({ suerte, profile: FMCH_2026_LIBRE_PROFILE_0_6_1 });
  assert.equal(after.valid, true, `${suerte.id} remains valid`);
  const sportingShape = (resolution) => Object.fromEntries(Object.entries(resolution.suerte.catalog).map(([category, rules]) => [
    category,
    rules.map((rule) => ({
      ruleId: rule.ruleId,
      label: rule.label,
      value: rule.value,
      enabled: rule.enabled,
      metadata: rule.metadata
    }))
  ]));
  assert.deepEqual(sportingShape(after), sportingShape(before), `${suerte.id} sporting content is unchanged`);
}

console.log("fmch-2026-0.6.1-backward-compatibility.test.mjs: ok");
