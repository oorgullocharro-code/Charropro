const {
  RuleProfileLifecycleError,
  applyRuleProfileLifecycleTransaction,
  buildRuleProfileProfileKey,
  getRuleProfileCertificate,
  validateRuleProfileCertificationRegistry
} = require("./ruleProfileLifecycleEngine");
const { safeClone } = require("./configurationEngine");

const RULE_PROFILE_LIFECYCLE_SERVICE_VERSION = "1.0.0";

function createRuleProfileLifecycleRuntime(adapter, options = {}) {
  validateAdapter(adapter);
  const registryValidation = validateRuleProfileCertificationRegistry(options.registry || {});
  if (!registryValidation.valid) {
    throw new RuleProfileLifecycleError("rule-profile-certification-registry-invalid", {
      errors: registryValidation.errors
    });
  }
  const registry = safeClone(registryValidation.registry);
  return Object.freeze({
    async transition(request = {}, actor = {}) {
      const certificate = getRuleProfileCertificate(registry, request.profileId, request.version);
      const now = getRuntimeNow(options);
      const outcome = await adapter.transactProfile(request.profileId, (current) => (
        applyRuleProfileLifecycleTransaction(current, request, actor, certificate, { now })
      ));
      if (!outcome?.ok) {
        throw new RuleProfileLifecycleError(outcome?.reason || "rule-profile-transaction-aborted", outcome || {});
      }
      return safeClone({
        lifecycleServiceVersion: RULE_PROFILE_LIFECYCLE_SERVICE_VERSION,
        ...outcome
      });
    }
  });
}

function createFirebaseRuleProfileLifecycleAdapter(admin, options = {}) {
  if (!admin?.database) throw new RuleProfileLifecycleError("rule-profile-firebase-admin-required");
  const rootPath = normalizeRootPath(options.rootPath);
  return Object.freeze({
    async transactProfile(profileId, updater) {
      const profileKey = buildRuleProfileProfileKey(profileId);
      const target = admin.database().ref(`${rootPath}/profiles/${profileKey}`);
      let outcome = null;
      const transaction = await target.transaction((current) => {
        const applied = updater(current || null);
        outcome = safeClone(applied.outcome);
        if (!applied.outcome?.ok) return;
        return safeClone(applied.state);
      }, undefined, false);
      if (!transaction.committed && outcome?.ok) {
        return { ok: false, reason: "rule-profile-transaction-aborted" };
      }
      return outcome || { ok: false, reason: "rule-profile-transaction-aborted" };
    }
  });
}

function createMemoryRuleProfileLifecycleAdapter(seed = {}) {
  let profiles = safeClone(seed.profiles || {});
  const locks = new Map();
  return Object.freeze({
    async transactProfile(profileId, updater) {
      const profileKey = buildRuleProfileProfileKey(profileId);
      const previous = locks.get(profileKey) || Promise.resolve();
      let release;
      const currentLock = new Promise((resolve) => { release = resolve; });
      locks.set(profileKey, previous.then(() => currentLock));
      await previous;
      try {
        const applied = updater(safeClone(profiles[profileKey] || null));
        if (applied.outcome?.ok) profiles[profileKey] = safeClone(applied.state);
        return safeClone(applied.outcome);
      } finally {
        release();
      }
    },
    snapshot() {
      return safeClone({ profiles });
    }
  });
}

function getRuntimeNow(options) {
  const value = typeof options.now === "function" ? options.now() : new Date().toISOString();
  const timestamp = Date.parse(String(value || ""));
  if (!Number.isFinite(timestamp)) throw new RuleProfileLifecycleError("rule-profile-authority-clock-invalid");
  return new Date(timestamp).toISOString();
}

function normalizeRootPath(value) {
  const normalized = String(value || "").replace(/^\/+|\/+$/g, "");
  if (!/^[A-Za-z0-9_/-]+$/.test(normalized)) {
    throw new RuleProfileLifecycleError("rule-profile-root-path-invalid");
  }
  return normalized;
}

function validateAdapter(adapter) {
  if (typeof adapter?.transactProfile !== "function") {
    throw new RuleProfileLifecycleError("rule-profile-adapter-invalid");
  }
}

module.exports = {
  RULE_PROFILE_LIFECYCLE_SERVICE_VERSION,
  createFirebaseRuleProfileLifecycleAdapter,
  createMemoryRuleProfileLifecycleAdapter,
  createRuleProfileLifecycleRuntime
};
