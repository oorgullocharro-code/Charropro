import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_LIBRE_PROFILE,
  validateRuleProfile
} from "../js/data/ruleProfiles.js";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js";

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
assert.equal(fingerprint, "rptp_a9988543eb21259f");
assert.equal(fingerprint, buildRuleProfileContentFingerprint(structuredClone(FMCH_2026_LIBRE_PROFILE)));
assert.equal(record.profile.contentFingerprint, fingerprint);

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
assert.equal(FMCH_2026_LIBRE_PROFILE.suerteMetadata.cala.fieldIdMappingStatus, "FIELDID_MAPPING_BLOCKED");
assert.deepEqual(FMCH_2026_LIBRE_PROFILE.suerteMetadata.cala.blockedFieldIds, [
  "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL",
  "FMCH.TEAM_SHEET.CALA.PC"
]);

const colas = FMCH_2026_LIBRE_PROFILE.suerteMetadata.colas;
assert.equal(colas.activeParticipantCount, 3);
assert.equal(colas.opportunitiesPerParticipant, 3);
assert.equal(colas.fourthRowStatus, "SOURCE_CONFIRMATION_REQUIRED");
assert.deepEqual(colas.blockedFieldIds, [
  "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
  "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04"
]);

const contraMascaraRules = FMCH_2026_LIBRE_PROFILE.rules.filter(
  (rule) => rule.ruleId === "manganas_caballo_base_contra_mascara"
);
assert.equal(contraMascaraRules.length, 1);
assert.equal(contraMascaraRules[0].value, 14);
assert.equal(contraMascaraRules[0].metadata.sourceItem, "USI-003");
assert.equal(contraMascaraRules[0].metadata.sourceStatus, "SOURCE_CONFIRMATION_REQUIRED");
assert.equal(contraMascaraRules[0].metadata.duplicatePrintedIdentityCollapsed, true);

const blocked = evaluateCertification(record);
assert.deepEqual(blocked, { pass: false, unresolvedP0: 5, unresolvedBlockers: 3 });
assert.equal(record.certification.verdict, "BLOCKED");
assert.equal(record.certification.remainingP0, 5);
assert.equal(record.certification.sportingValuesModified, false);

const hypotheticallyResolved = structuredClone(record);
hypotheticallyResolved.p0Gaps.forEach((gap) => { gap.status = "RESOLVED"; });
hypotheticallyResolved.blockers.forEach((blocker) => { blocker.status = "RESOLVED"; });
hypotheticallyResolved.sourceValidation.certificationEvidenceStatus = "PRESENT";
assert.deepEqual(evaluateCertification(hypotheticallyResolved), {
  pass: true,
  unresolvedP0: 0,
  unresolvedBlockers: 0
});
