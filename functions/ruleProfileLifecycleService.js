const {
  RuleProfileLifecycleError,
  applyRuleProfileLifecycleTransaction,
  buildRuleProfileProfileKey,
  getRuleProfileCertificate,
  readRuleProfileLifecycleState,
  validateRuleProfileCertificationRegistry
} = require("./ruleProfileLifecycleEngine");
const { safeClone } = require("./configurationEngine");
const { createFirebaseRestCas } = require("./firebaseRestCas");

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
    async read(request = {}, actor = {}) {
      const certificate = getRuleProfileCertificate(registry, request.profileId, request.version);
      const current = await adapter.readProfile(request.profileId);
      return safeClone({
        lifecycleServiceVersion: RULE_PROFILE_LIFECYCLE_SERVICE_VERSION,
        ...readRuleProfileLifecycleState(current, request, actor, certificate, { now: getRuntimeNow(options) })
      });
    },
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
  const restCas = createFirebaseRestCas(admin, options.restCas || {});
  return Object.freeze({
    async readProfile(profileId) {
      const profileKey = buildRuleProfileProfileKey(profileId);
      const snapshot = await admin.database().ref(`${rootPath}/profiles/${profileKey}`).get();
      return snapshot.exists() ? safeClone(snapshot.val()) : null;
    },
    async transactProfile(profileId, updater) {
      const profileKey = buildRuleProfileProfileKey(profileId);
      return restCas.compareAndSwap(`${rootPath}/profiles/${profileKey}`, (current) => {
        const applied = updater(current || null);
        return {
          outcome: safeClone(applied.outcome),
          state: safeClone(applied.state)
        };
      });
    }
  });
}

function createMemoryRuleProfileLifecycleAdapter(seed = {}) {
  let profiles = safeClone(seed.profiles || {});
  const locks = new Map();
  return Object.freeze({
    async readProfile(profileId) {
      const profileKey = buildRuleProfileProfileKey(profileId);
      return safeClone(profiles[profileKey] || null);
    },
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
  if (typeof adapter?.readProfile !== "function" || typeof adapter?.transactProfile !== "function") {
    throw new RuleProfileLifecycleError("rule-profile-adapter-invalid");
  }
}

module.exports = {
  RULE_PROFILE_LIFECYCLE_SERVICE_VERSION,
  createFirebaseRuleProfileLifecycleAdapter,
  createMemoryRuleProfileLifecycleAdapter,
  createRuleProfileLifecycleRuntime
};
