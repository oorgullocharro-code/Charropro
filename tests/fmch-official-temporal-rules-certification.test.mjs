import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_OFFICIAL_TEMPORAL_POLICY,
  FMCH_OFFICIAL_TEMPORAL_POLICY_FINGERPRINT,
  FMCH_OFFICIAL_TEMPORAL_POLICY_VERSION,
  getFmchOfficialTemporalPolicy,
  resolveFmchOfficialTemporalContracts,
  validateFmchOfficialTemporalPolicy
} from "../js/core/timerRules.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import { FMCH_2026_LIBRE_PROFILE } from "../js/data/ruleProfiles.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

const PROFILE_CONTEXT = Object.freeze({
  profileId: "FMCH_2026_LIBRE",
  profileVersion: "0.6.0"
});
const EXPECTED_SUERTES = [
  "cala",
  "piales",
  "colas",
  "toro",
  "terna_cabecero",
  "terna_pial",
  "yegua",
  "manganas_pie",
  "manganas_caballo",
  "paso"
];

assert.equal(FMCH_OFFICIAL_TEMPORAL_POLICY_VERSION, "1.0.0");
assert.equal(FMCH_OFFICIAL_TEMPORAL_POLICY_FINGERPRINT, "fmchtp_7d1e001181026f6d");
assert.equal(FMCH_OFFICIAL_TEMPORAL_POLICY.status, "CERTIFIED_NOT_ACTIVATED");
assert.equal(FMCH_OFFICIAL_TEMPORAL_POLICY.source.sha256, "1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b");
assert.deepEqual(Object.keys(FMCH_OFFICIAL_TEMPORAL_POLICY.suertes), EXPECTED_SUERTES);
assert.deepEqual(validateFmchOfficialTemporalPolicy(), { valid: true, errors: [] });

const statusBySuerte = Object.fromEntries(EXPECTED_SUERTES.map((suerteId) => [
  suerteId,
  FMCH_OFFICIAL_TEMPORAL_POLICY.suertes[suerteId].certificationStatus
]));
assert.deepEqual(statusBySuerte, Object.fromEntries(EXPECTED_SUERTES.map((suerteId) => [suerteId, "CERTIFIED"])));

function resolve(suerteId, phaseId = "", extra = {}) {
  const result = resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId, phaseId, ...extra });
  assert.equal(result.ok, true, `${suerteId}/${phaseId || "all"} resolves`);
  return phaseId ? result.contracts[0] : result.contracts;
}

const calaReview = resolve("cala", "freno_review");
assert.equal(calaReview.limitMs, 180000);
assert.equal(calaReview.startCondition, "CALADOR_BOTH_FEET_ON_ARENA");
assert.equal(calaReview.finishCondition, "CALADOR_MOUNTED");
assert.deepEqual(calaReview.warningThresholdsMs, [60000, 120000]);
assert.equal(calaReview.pausePolicy.allowed, false);
assert.equal(calaReview.expirationPolicy, "DISQUALIFY_CALA_REVIEW_AFTER_THREE_MINUTES");

const calaStart = resolve("cala", "partidero_start");
assert.equal(calaStart.limitMs, 120000);
assert.equal(calaStart.startCondition, "HORSE_ARRIVES_AT_PARTIDERO");
assert.deepEqual(calaStart.warningThresholdsMs, [60000]);

const pialesNormal = resolve("piales", "opportunity_readiness", { previousOpportunityResolution: "NO_EXTENSION" });
const pialesCounted = resolve("piales", "opportunity_readiness", { previousOpportunityResolution: "COUNTED_PIAL" });
const pialesRope = resolve("piales", "opportunity_readiness", { previousOpportunityResolution: "ROPE_BREAK_WITH_PIAL" });
const pialesHondilla = resolve("piales", "opportunity_readiness", { previousOpportunityResolution: "HONDILLA_BREAK_WITH_PIAL" });
const pialesKnot = resolve("piales", "opportunity_readiness", { previousOpportunityResolution: "KNOT_RELEASE_WITH_PIAL" });
assert.equal(pialesNormal.limitMs, 120000);
for (const extended of [pialesCounted, pialesRope, pialesHondilla, pialesKnot]) assert.equal(extended.limitMs, 180000);
assert.equal(pialesNormal.startCondition, "JUDGE_INDICATES_TIME");
assert.equal(pialesNormal.finishCondition, "PIALADOR_REQUESTS_MARE");
assert.equal(pialesNormal.hardStop, false);

const colas = resolve("colas", "partidero_release");
assert.equal(colas.limitMs, 20000);
assert.equal(colas.pausePolicy.allowed, true);
assert.deepEqual(colas.pausePolicy.conditions, ["BULL_CAUGHT_IN_TUBES"]);
assert.ok(colas.identityDimensions.includes("coleadorIndex"));
assert.ok(colas.identityDimensions.includes("opportunityIndex"));

const toro = resolve("toro", "apretalamiento");
assert.equal(toro.limitMs, 300000);
assert.deepEqual(toro.warningThresholdsMs, [180000, 240000]);
assert.equal(toro.finishCondition, "DOOR_OPEN_AT_NINETY_DEGREES_OR_BULL_HEAD_EXITS");
assert.equal(toro.transitionPolicy, "START_TERNA_AT_FIRST_OF_BULL_EXIT_OR_APRETALAMIENTO_EXPIRY_UNDER_JUDGE_AUTHORITY");

const ternaCabecero = resolve("terna_cabecero", "shared_execution");
const ternaPial = resolve("terna_pial", "shared_execution");
const ternaCabeceroAlias = resolve("lazo", "shared_execution");
const ternaPialAlias = resolve("pial_ruedo", "shared_execution");
assert.equal(ternaCabecero.ruleId, ternaPial.ruleId);
assert.equal(ternaCabecero.limitMs, 420000);
assert.equal(ternaPial.limitMs, 420000);
assert.equal(ternaCabecero.componentPhaseId, "cabecero");
assert.equal(ternaPial.componentPhaseId, "pial");
assert.equal(ternaCabeceroAlias.componentPhaseId, "cabecero");
assert.equal(ternaPialAlias.componentPhaseId, "pial");
assert.equal(ternaCabecero.mode, "SHARED_WINDOW");
assert.equal(ternaCabecero.startCondition, "FIRST_OF_BULL_EXIT_OR_APRETALAMIENTO_EXPIRY_UNDER_JUDGE_AUTHORITY");
assert.ok(ternaCabecero.identityDimensions.includes("sharedDomain:terna"));
assert.ok(!ternaCabecero.identityDimensions.includes("opportunityIndex"));
assert.ok(ternaCabecero.pausePolicy.conditions.includes("BULL_JUMPS_OUT_OF_ARENA"));

const yeguaContracts = resolve("yegua");
assert.deepEqual(yeguaContracts.map((contract) => contract.phaseId), ["apretalamiento", "dismount"]);
assert.deepEqual(yeguaContracts.map((contract) => contract.limitMs), [300000, 60000]);
assert.equal(yeguaContracts[1].hardStop, false);

const manganasPie = resolve("manganas_pie", "execution");
assert.equal(manganasPie.limitMs, 420000);
assert.ok(manganasPie.pausePolicy.conditions.includes("MARE_JUMPS_OUT_OF_ARENA"));
assert.equal(manganasPie.finishCondition, "THREE_OPPORTUNITIES_RESOLVED_OR_SEVEN_MINUTES_ELAPSE");

const manganasCaballo = resolve("manganas_caballo");
assert.deepEqual(manganasCaballo.map((contract) => contract.phaseId), ["changeover", "execution"]);
assert.deepEqual(manganasCaballo.map((contract) => contract.limitMs), [120000, 420000]);
assert.equal(manganasCaballo[0].finishCondition, "TWO_MINUTES_ELAPSE_OR_EVERYTHING_IS_READY");

const paso = resolve("paso");
assert.deepEqual(paso.map((contract) => contract.phaseId), ["mare_exit", "dismount"]);
assert.deepEqual(paso.map((contract) => contract.limitMs), [180000, 60000]);
assert.equal(paso[0].finishCondition, "MARE_COMPLETELY_EXITS_BOX");
assert.equal(paso[1].hardStop, false);

// Consecutive opportunities and hard refreshes are deterministic and detached.
const firstCola = resolve("colas", "partidero_release");
firstCola.limitMs = 1;
firstCola.identityDimensions.push("mutated");
const nextCola = resolve("colas", "partidero_release");
assert.equal(nextCola.limitMs, 20000);
assert.ok(!nextCola.identityDimensions.includes("mutated"));
assert.deepEqual(
  resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId: "paso" }),
  resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId: "paso" })
);

const detachedPolicy = getFmchOfficialTemporalPolicy();
detachedPolicy.suertes.cala.contracts[0].limitMs = 1;
assert.equal(FMCH_OFFICIAL_TEMPORAL_POLICY.suertes.cala.contracts[0].limitMs, 180000);
assert.equal(Object.isFrozen(FMCH_OFFICIAL_TEMPORAL_POLICY), true);
assert.equal(Object.isFrozen(FMCH_OFFICIAL_TEMPORAL_POLICY.suertes.cala.contracts[0]), true);

// Explicit context is mandatory; no cross-profile or incomplete sporting fallback is allowed.
assert.deepEqual(
  resolveFmchOfficialTemporalContracts({ profileId: "PRODUCT_BASE", profileVersion: "1.0.0", suerteId: "colas" }),
  { ok: false, code: "official-temporal-profile-unsupported", contracts: [] }
);
assert.equal(resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId: "unknown" }).code, "official-temporal-suerte-unsupported");
assert.equal(resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId: "cala", phaseId: "unknown" }).code, "official-temporal-phase-unsupported");
assert.equal(resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId: "piales" }).code, "official-temporal-previous-opportunity-resolution-required");
assert.equal(resolveFmchOfficialTemporalContracts({ ...PROFILE_CONTEXT, suerteId: "piales", previousOpportunityResolution: "GUESSED" }).code, "official-temporal-previous-opportunity-resolution-required");

const tampered = getFmchOfficialTemporalPolicy();
tampered.suertes.colas.contracts[0].limitMs = 15000;
assert.equal(validateFmchOfficialTemporalPolicy(tampered).valid, false);
assert.ok(validateFmchOfficialTemporalPolicy(tampered).errors.includes("official-temporal-policy-fingerprint-invalid"));

// The active certified sporting profile remains byte-semantically unchanged.
assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE), "rptp_0f90f7a3944a82d7");
assert.notEqual(FMCH_OFFICIAL_TEMPORAL_POLICY_FINGERPRINT, "rptp_0f90f7a3944a82d7");

const timerSource = readFileSync(new URL("../js/core/timerRules.js", import.meta.url), "utf8");
assert.ok(!timerSource.includes("limitMs: 15000"), "legacy timing value is named, not an anonymous literal");
assert.ok(timerSource.includes("LEGACY_COLEADERO_LIMIT_MS"), "legacy behavior remains explicit until authorized integration");

console.log("FMCH official temporal rules certification: 10/10 suertes and fail-closed policy passed.");
