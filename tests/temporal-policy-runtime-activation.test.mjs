import assert from "node:assert/strict";
import {
  FMCH_OFFICIAL_TEMPORAL_POLICY,
  buildOfficialTimerDefinitionsFromContext,
  resolveFmchOfficialTemporalRuntimePolicy
} from "../js/core/timerRules.js?v=20260831-precommercial-tournament-delete-production-backup-validation-recovery-002-v1";

const certified = {
  profileId: "FMCH_2026_LIBRE",
  profileVersion: "0.6.0",
  profileFingerprint: "rptp_0f90f7a3944a82d7"
};

const active = resolveFmchOfficialTemporalRuntimePolicy(certified);
assert.equal(active.ok, true);
assert.equal(active.status, "ACTIVE");
assert.equal(active.policyId, "FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES");
assert.equal(active.policyVersion, "1.0.0");
assert.equal(active.policyFingerprint, "fmchtp_7d1e001181026f6d");
assert.equal(FMCH_OFFICIAL_TEMPORAL_POLICY.contentFingerprint, active.policyFingerprint);

const brakeReviewProfile = resolveFmchOfficialTemporalRuntimePolicy({
  ...certified,
  profileVersion: "0.6.1",
  profileFingerprint: "rptp_10e596046446e850"
});
assert.equal(brakeReviewProfile.ok, true);
assert.equal(brakeReviewProfile.status, "ACTIVE");
assert.equal(brakeReviewProfile.policyFingerprint, active.policyFingerprint);

for (const [name, context, code] of [
  ["profile", { ...certified, profileId: "PRODUCT_BASE" }, "official-temporal-runtime-profile-unsupported"],
  ["version", { ...certified, profileVersion: "0.7.0" }, "official-temporal-runtime-version-unsupported"],
  ["0.6.1 fingerprint", { ...certified, profileVersion: "0.6.1" }, "official-temporal-runtime-profile-fingerprint-mismatch"],
  ["fingerprint", { ...certified, profileFingerprint: "wrong" }, "official-temporal-runtime-profile-fingerprint-mismatch"]
]) {
  const result = resolveFmchOfficialTemporalRuntimePolicy(context);
  assert.equal(result.ok, false, name);
  assert.equal(result.status, "TEMPORAL_POLICY_UNAVAILABLE", name);
  assert.equal(result.code, code, name);
}

const unavailable = buildOfficialTimerDefinitionsFromContext({
  tournament: { id: "t1", ruleProfileId: "FMCH_2026_LIBRE", ruleProfileVersion: "0.6.0", effectiveRulesFingerprint: "wrong" },
  charreada: { id: "c1", competitionId: "equipos_completo" },
  turn: { team: { id: "e1" }, suerte: { id: "colas" } }
})[0];
assert.equal(unavailable.temporalPolicyStatus, "TEMPORAL_POLICY_UNAVAILABLE");
assert.equal(unavailable.mode, "unavailable");

console.log("temporal-policy-runtime-activation.test.mjs: ok");
