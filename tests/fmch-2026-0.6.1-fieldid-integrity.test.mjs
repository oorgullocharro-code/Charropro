import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_LIBRE_PROFILE_0_6_0,
  FMCH_2026_LIBRE_PROFILE_0_6_1,
  getRuleProfileRulesByPhase
} from "../js/data/ruleProfiles.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";

const dictionary = JSON.parse(readFileSync("CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPECIFICATION-001/FIELD_DICTIONARY.json", "utf8"));
const fieldIds = new Set(dictionary.fields.map((field) => field.fieldId));
const before = FMCH_2026_LIBRE_PROFILE_0_6_0.suerteMetadata.cala;
const after = FMCH_2026_LIBRE_PROFILE_0_6_1.suerteMetadata.cala;

assert.equal(fieldIds.size, 239);
assert.deepEqual(after.fieldIdMappings, before.fieldIdMappings);
assert.deepEqual(after.nonSportingControls, before.nonSportingControls);
assert.equal(fieldIds.has("FMCH.TEAM_SHEET.CALA.T"), true);
assert.equal(fieldIds.has("FMCH.TEAM_SHEET.CALA.TOTAL"), true);
assert.equal(fieldIds.has("FMCH.TEAM_SHEET.CALA.BAD_POINTS_TOTAL"), true);
assert.equal(fieldIds.has("FMCH.TEAM_SHEET.CALA.PARTIAL_POINTS"), true);

for (const rule of getRuleProfileRulesByPhase(FMCH_2026_LIBRE_PROFILE_0_6_1, "freno_review")) {
  const format = rule.metadata.officialFormat;
  if (rule.category === "desc") assert.equal(format.total, "FMCH.TEAM_SHEET.CALA.TOTAL");
  else assert.equal(format.family, "FMCH.TEAM_SHEET.CALA.BAD_POINT_01..08");
}

console.log("fmch-2026-0.6.1-fieldid-integrity.test.mjs: ok");
