import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "./configurationBootstrap.js?v=20260801-configuration-management-001-v1";

export const PRODUCTIVE_RULE_PROFILE_POLICY_VERSION = "1.0.0";

const configuration = await loadConfigurationBootstrap();
const defaults = getBootstrapConfigurationValue(
  configuration,
  "federation.officialConfiguration.productiveRuleProfileDefaults",
  {}
);

export function resolveProductiveRuleProfileDefault(category) {
  const key = String(category || "").trim();
  const policy = defaults?.[key];
  if (!policy || policy.enabled !== true) return null;
  if (policy.policyVersion !== PRODUCTIVE_RULE_PROFILE_POLICY_VERSION
    || !policy.policyId || !policy.profileId || !/^\d+\.\d+\.\d+$/.test(policy.version || "")) {
    throw new Error("productive-rule-profile-policy-invalid");
  }
  return clone(policy);
}

export function applyProductiveRuleProfilePolicy(tournament = {}) {
  if (hasExplicitSelection(tournament)) return tournament;
  const policy = resolveProductiveRuleProfileDefault(tournament.category);
  if (!policy) return tournament;
  return {
    ...tournament,
    ruleProfilePolicyRequired: true,
    ruleProfilePolicy: policy
  };
}

export function hasExplicitSelection(tournament = {}) {
  return Boolean(
    String(tournament.ruleProfileId || "").trim()
    || String(tournament.ruleProfileVersion || "").trim()
    || tournament.ruleProfile
    || tournament.ruleProfileFallback === "product_base"
  );
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}
