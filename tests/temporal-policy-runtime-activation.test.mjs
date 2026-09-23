import assert from "node:assert/strict";
import {
  FMCH_OFFICIAL_TEMPORAL_POLICY,
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext,
  resolveFmchOfficialTemporalRuntimePolicy
} from "../js/core/timerRules.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";

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

const calaGranularProfile = resolveFmchOfficialTemporalRuntimePolicy({
  ...certified,
  profileVersion: "0.6.2",
  profileFingerprint: "rptp_faaf4360de95f84c"
});
assert.equal(calaGranularProfile.ok, true);
assert.equal(calaGranularProfile.status, "ACTIVE");
assert.equal(calaGranularProfile.policyFingerprint, active.policyFingerprint);

for (const [name, context, code] of [
  ["profile", { ...certified, profileId: "PRODUCT_BASE" }, "official-temporal-runtime-profile-unsupported"],
  ["version", { ...certified, profileVersion: "0.7.0" }, "official-temporal-runtime-version-unsupported"],
  ["0.6.1 fingerprint", { ...certified, profileVersion: "0.6.1" }, "official-temporal-runtime-profile-fingerprint-mismatch"],
  ["0.6.2 fingerprint", { ...certified, profileVersion: "0.6.2", profileFingerprint: "wrong" }, "official-temporal-runtime-profile-fingerprint-mismatch"],
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

const calaDefinitions = buildOfficialTimerDefinitionsFromContext({
  tournament: {
    id: "t062",
    ruleProfileId: "FMCH_2026_LIBRE",
    ruleProfileVersion: "0.6.2",
    ruleProfileContentFingerprint: "rptp_faaf4360de95f84c"
  },
  charreada: { id: "c062", competitionId: "equipos_completo" },
  turn: { team: { id: "e062" }, suerte: { id: "cala", name: "Cala de Caballo" } }
});
assert.ok(calaDefinitions.length > 0);
assert.ok(calaDefinitions.every((definition) => (
  definition.temporalPolicyStatus === "ACTIVE" && definition.durationMs > 0
)));

const definition = calaDefinitions[0];
const T0 = Date.parse("2026-09-22T12:00:00.000Z");
let timer = createOfficialTimerContext(definition, { now: T0 });
for (const [type, expectedStatus] of [
  ["START", "RUNNING"],
  ["PAUSE", "PAUSED"],
  ["RESUME", "RUNNING"],
  ["FINISH", "FINISHED"],
  ["RESET", "READY"]
]) {
  const outcome = applyOfficialTimerCommand(timer, { type, commandId: `cala062_${type.toLowerCase()}` }, {
    definition,
    now: T0 + (timer.revision + 1) * 1000,
    expectedRevision: timer.revision,
    requireCommandId: true
  });
  assert.equal(outcome.ok, true, type);
  timer = outcome.timer;
  assert.equal(timer.status, expectedStatus, type);
}
assert.equal(timer.officialElapsedMs, 0);

console.log("temporal-policy-runtime-activation.test.mjs: ok");
