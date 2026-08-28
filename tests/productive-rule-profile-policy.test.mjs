import assert from "node:assert/strict";
import { applyProductiveRuleProfilePolicy, resolveProductiveRuleProfileDefault } from "../js/core/productiveRuleProfilePolicy.js?v=20260828-fmch-terna-participant-identity-roster-persistence-001-v1";
import { resolveRuleProfileSelection } from "../js/data/ruleProfiles.js?v=20260828-fmch-terna-participant-identity-roster-persistence-001-v1";

const policy = resolveProductiveRuleProfileDefault("Libre");
assert.deepEqual(policy, {
  policyVersion: "1.0.0",
  policyId: "fmch-2026-libre-productive-default-v2",
  profileId: "FMCH_2026_LIBRE",
  version: "0.6.1",
  enabled: true
});
assert.equal(resolveProductiveRuleProfileDefault("Juvenil"), null);

const base = Object.freeze({ id: "tournament-libre", name: "Libre", category: "Libre" });
const pending = applyProductiveRuleProfilePolicy(base);
assert.deepEqual(base, { id: "tournament-libre", name: "Libre", category: "Libre" });
assert.equal(pending.ruleProfilePolicyRequired, true);
assert.equal(resolveRuleProfileSelection(pending).blocked, true, "required defaults block PRODUCT_BASE while assignment is pending");

const assigned = {
  ...pending,
  ruleProfileId: policy.profileId,
  ruleProfileVersion: policy.version,
  ruleProfileAssignment: {
    authorityVersion: "1.0.0",
    tournamentId: pending.id,
    profileId: policy.profileId,
    version: policy.version,
    status: "active",
    contentFingerprint: "rptp_10e596046446e850",
    revision: 1
  }
};
const resolved = resolveRuleProfileSelection(assigned);
assert.equal(resolved.valid, true);
assert.equal(resolved.blocked, false);
assert.equal(resolved.profile.status, "active");
assert.equal(resolved.profile.profileId, policy.profileId);
assert.equal(resolved.profile.version, policy.version);

const preserved060 = resolveRuleProfileSelection({
  id: "existing-tournament-060",
  category: "Libre",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.0",
  ruleProfileAssignment: {
    authorityVersion: "1.0.0",
    tournamentId: "existing-tournament-060",
    profileId: "FMCH_2026_LIBRE",
    version: "0.6.0",
    status: "active",
    contentFingerprint: "rptp_0f90f7a3944a82d7",
    revision: 1
  }
});
assert.equal(preserved060.valid, true);
assert.equal(preserved060.profile.version, "0.6.0", "existing explicit 0.6.0 assignments remain pinned");

const tampered = structuredClone(assigned);
tampered.ruleProfileAssignment.contentFingerprint = "rptp_1111111111111111";
assert.equal(resolveRuleProfileSelection(tampered).blocked, true);

const explicit = applyProductiveRuleProfilePolicy({
  ...base,
  ruleProfileFallback: "product_base"
});
assert.equal(explicit.ruleProfilePolicyRequired, undefined);
assert.equal(resolveRuleProfileSelection(explicit).fallbackUsed, false);

console.log("productive-rule-profile-policy.test.mjs: ok");
