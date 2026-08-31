import { FMCH_2026_LIBRE_PROFILE } from "../data/ruleProfiles.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";

export const LOCAL_RULE_PROFILE_DEFAULTS_VERSION = "1.0.0";
export const LOCAL_RULE_PROFILE_ENVIRONMENT = "local-emulator";

export function buildLocalFmch2026RuleProfileAssignment() {
  const ruleProfile = cloneProfileValue(FMCH_2026_LIBRE_PROFILE);
  ruleProfile.status = "active";
  ruleProfile.metadata = {
    ...(ruleProfile.metadata || {}),
    fixtureOnly: true,
    activationReady: false,
    environment: LOCAL_RULE_PROFILE_ENVIRONMENT
  };
  return {
    ruleProfileId: ruleProfile.profileId,
    ruleProfileVersion: ruleProfile.version,
    ruleProfile
  };
}

export function applyLocalFmch2026RuleProfileDefault(tournament = {}, runtime = {}) {
  if (!isLocalRuntime(runtime) || hasExplicitRuleProfileSelection(tournament)) return tournament;
  return {
    ...tournament,
    ...buildLocalFmch2026RuleProfileAssignment()
  };
}

export function hasExplicitRuleProfileSelection(tournament = {}) {
  return Boolean(
    String(tournament?.ruleProfileId || "").trim()
    || String(tournament?.ruleProfileVersion || "").trim()
    || (tournament?.ruleProfile && typeof tournament.ruleProfile === "object")
    || tournament?.ruleProfileFallback === "product_base"
  );
}

function isLocalRuntime(runtime = {}) {
  return runtime?.local === true || runtime?.environment === "local";
}

function cloneProfileValue(value) {
  if (Array.isArray(value)) return value.map(cloneProfileValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneProfileValue(item)]));
}
