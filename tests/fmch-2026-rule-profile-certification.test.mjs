import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_LIBRE_PROFILE,
  resolveEffectiveRules,
  validateRuleProfile
} from "../js/data/ruleProfiles.js?v=20260824-scorer-interaction-latency-001-v1";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js?v=20260824-scorer-interaction-latency-001-v1";
import { buildEffectiveRulesFingerprint } from "../js/core/scoringAttempt.js?v=20260824-scorer-interaction-latency-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260824-scorer-interaction-latency-001-v1";

const recordUrl = new URL(
  "../CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001/CERTIFICATION_RECORD.json",
  import.meta.url
);
const record = JSON.parse(readFileSync(recordUrl, "utf8"));

function evaluateCertification(candidate) {
  const unresolvedP0 = candidate.p0Gaps.filter((gap) => gap.status !== "RESOLVED");
  const unresolvedBlockers = candidate.blockers.filter(
    (blocker) => blocker.certificationRequired && blocker.status !== "RESOLVED"
  );
  return {
    pass: unresolvedP0.length === 0
      && unresolvedBlockers.length === 0
      && candidate.sourceValidation.certificationEvidenceStatus === "PRESENT",
    unresolvedP0: unresolvedP0.length,
    unresolvedBlockers: unresolvedBlockers.length
  };
}

assert.equal(FMCH_2026_LIBRE_PROFILE.profileId, "FMCH_2026_LIBRE");
assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
assert.equal(FMCH_2026_LIBRE_PROFILE.rules.length, 731);
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds.length, 10);
assert.equal(validateRuleProfile(FMCH_2026_LIBRE_PROFILE).valid, true);

const fingerprint = buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE);
assert.equal(fingerprint, "rptp_0f90f7a3944a82d7");
assert.equal(fingerprint, buildRuleProfileContentFingerprint(structuredClone(FMCH_2026_LIBRE_PROFILE)));
assert.equal(record.profile.contentFingerprint, fingerprint);
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReadyEligibility, true);
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.sportingCertification, "PASS");

const calaRules = new Map(
  FMCH_2026_LIBRE_PROFILE.rules
    .filter((rule) => rule.suerteId === "cala")
    .map((rule) => [rule.ruleId, rule])
);
assert.equal(calaRules.get("cala_medio_derecho")?.value, 1);
assert.equal(calaRules.get("cala_medio_izquierdo")?.value, 1);
assert.equal(calaRules.get("cala_cambio_rectangulo_costado")?.value, 1);
assert.equal(calaRules.has("cala_md"), false);
assert.equal(calaRules.has("cala_mi"), false);
assert.equal(calaRules.has("cala_pc"), false);
const cala = FMCH_2026_LIBRE_PROFILE.suerteMetadata.cala;
assert.equal(cala.fieldIdMappingStatus, "CERTIFIED_ALIASES_WITH_NON_SPORTING_CONTROL");
assert.deepEqual(cala.blockedFieldIds, []);
assert.equal(cala.fieldIdMappings["FMCH.TEAM_SHEET.CALA.MD"].ruleId, "cala_medio_derecho");
assert.equal(cala.fieldIdMappings["FMCH.TEAM_SHEET.CALA.MI"].ruleId, "cala_medio_izquierdo");
assert.equal(cala.fieldIdMappings["FMCH.TEAM_SHEET.CALA.PC"].ruleId, "cala_cambio_rectangulo_costado");
assert.equal(cala.nonSportingControls[0].fieldId, "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL");
assert.equal(cala.nonSportingControls[0].scoringEffect, "NONE");

const colas = FMCH_2026_LIBRE_PROFILE.suerteMetadata.colas;
assert.equal(colas.activeParticipantCount, 3);
assert.equal(colas.opportunitiesPerParticipant, 3);
assert.equal(colas.fourthRowStatus, "NON_SPORTING_ADMINISTRATIVE_ROW");
assert.deepEqual(colas.blockedFieldIds, []);
assert.equal(colas.nonSportingControls.length, 2);
assert.equal(colas.nonSportingControls.every((item) => item.scoringEffect === "NONE"), true);

const contraMascaraRules = FMCH_2026_LIBRE_PROFILE.rules.filter(
  (rule) => rule.ruleId === "manganas_caballo_base_contra_mascara"
);
assert.equal(contraMascaraRules.length, 1);
assert.equal(contraMascaraRules[0].value, 14);
assert.equal(contraMascaraRules[0].metadata.sourceItem, "USI-003");
assert.equal(contraMascaraRules[0].metadata.sourceStatus, "CONFIRMED");
assert.equal(contraMascaraRules[0].metadata.sourceResolution, "SINGLE_CANONICAL_SPORTING_IDENTITY");
assert.equal(contraMascaraRules[0].metadata.duplicatePrintedIdentityCollapsed, true);
assert.equal(contraMascaraRules[0].metadata.simultaneousDuplicateSelectionAllowed, false);

const certified = evaluateCertification(record);
assert.deepEqual(certified, { pass: true, unresolvedP0: 0, unresolvedBlockers: 0 });
assert.equal(record.certification.verdict, "PASS");
assert.equal(record.certification.remainingP0, 0);
assert.equal(record.certification.sportingValuesModified, false);

const blockedFixture = structuredClone(record);
blockedFixture.p0Gaps[0].status = "PENDING_CONFIRMATION";
blockedFixture.blockers[0].status = "UNRESOLVED";
assert.deepEqual(evaluateCertification(blockedFixture), {
  pass: false,
  unresolvedP0: 1,
  unresolvedBlockers: 1
});

const expectedEffectiveRulesFingerprints = {
  cala: "rules_512b29ab88ea10c9",
  piales: "rules_a61de6f81437d07a",
  colas: "rules_19ebf6083632ab6a",
  toro: "rules_a7a4e3df21a2e4ef",
  lazo: "rules_1ceab6e752f01bd5",
  pial_ruedo: "rules_df879e638dac2cd9",
  yegua: "rules_b36c8d91d564d747",
  manganas_pie: "rules_51832332563e0834",
  manganas_caballo: "rules_def9215e873fa762",
  paso: "rules_f40956bf2dae1b2b"
};
for (const suerte of SUERTES.filter((item) => expectedEffectiveRulesFingerprints[item.id])) {
  const resolved = resolveEffectiveRules({ suerte, profile: FMCH_2026_LIBRE_PROFILE });
  assert.equal(resolved.valid, true);
  assert.equal(buildEffectiveRulesFingerprint(resolved.suerte), expectedEffectiveRulesFingerprints[suerte.id]);
}
