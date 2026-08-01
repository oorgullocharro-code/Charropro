const {
  CONFIGURATION_ENGINE_VERSION,
  ConfigurationEngineError,
  applyConfigurationMutation,
  authorizeConfigurationOperation,
  buildConfigurationAuditEvent,
  buildConfigurationScopeKey,
  buildResolutionScopeKeys,
  normalizeConfigurationScope,
  resolveConfigurationHierarchy,
  safeClone,
  validateRuntimeConfigurationBaseline
} = require("./configurationEngine");

const CONFIGURATION_SERVICE_VERSION = "1.0.0";
const DEFAULT_CONFIGURATION_ROOT = null;

function createConfigurationRuntime(adapter, options = {}) {
  validateAdapter(adapter);
  const baselineValidation = validateRuntimeConfigurationBaseline(options.baseline);
  if (!baselineValidation.valid) {
    throw new ConfigurationEngineError("configuration-baseline-invalid", { errors: baselineValidation.errors });
  }
  const baseline = baselineValidation.configuration;
  if (baseline.scope.type !== "system" || baseline.status !== "published") {
    throw new ConfigurationEngineError("configuration-baseline-invalid");
  }

  return Object.freeze({
    async readConfiguration(request = {}, actor = {}) {
      const operationNow = getRuntimeNow(options);
      const context = normalizeReadContext(request, actor);
      const targetScope = inferAuthorizationScope(context);
      const authorization = authorizeConfigurationOperation("read", actor, { scope: targetScope }, {
        critical: request.critical === true
      });
      if (!authorization.allowed) throw new ConfigurationEngineError(authorization.reason);
      const configurationId = String(request.configurationId || baseline.configurationId);
      const dynamicRecords = await adapter.listConfigurationVersions(configurationId, context);
      const hasBaselineVersion = dynamicRecords.some((record) => (
        record.configurationId === baseline.configurationId
        && record.scopeKey === baseline.scopeKey
        && Number(record.version) === baseline.version
        && record.checksum === baseline.checksum
      ));
      const records = configurationId === baseline.configurationId && !hasBaselineVersion
        ? [baseline, ...dynamicRecords]
        : dynamicRecords;
      const resolved = resolveConfigurationHierarchy(records, context, {
        configurationId,
        required: request.required === true,
        now: operationNow
      });
      if (request.critical === true && resolved.status === "resolved") {
        const effectiveSource = resolved.sources.at(-1);
        const source = records.find((record) => (
          record.configurationId === configurationId
          && record.scopeKey === effectiveSource?.scopeKey
          && Number(record.version) === effectiveSource?.version
        )) || baseline;
        const event = buildConfigurationAuditEvent("configuration-critical-read", source, actor, {
          result: "SUCCESS",
          reason: "configuration-critical-read-authorized",
          idempotencyKey: request.idempotencyKey || ""
        }, { now: operationNow });
        await adapter.appendConfigurationAudit(event);
      }
      return safeClone({
        configurationServiceVersion: CONFIGURATION_SERVICE_VERSION,
        ...resolved
      });
    },

    async publishConfiguration(request = {}, actor = {}) {
      const operationNow = getRuntimeNow(options);
      const scope = normalizeConfigurationScope(request.scope || {});
      const authorization = authorizeConfigurationOperation("write", actor, { scope });
      if (!authorization.allowed) {
        const event = buildConfigurationAuditEvent("configuration-publish-rejected", baseline, actor, {
          result: "REJECTED",
          reason: authorization.reason,
          idempotencyKey: request.idempotencyKey || ""
        }, { now: operationNow });
        await adapter.appendConfigurationAudit(event);
        throw new ConfigurationEngineError(authorization.reason);
      }
      const configurationId = String(request.configurationId || baseline.configurationId);
      const scopeKey = buildConfigurationScopeKey(scope);
      const outcome = await adapter.transactConfiguration(scopeKey, configurationId, (current) => {
        const initialState = !current
          && scope.type === "system"
          && configurationId === baseline.configurationId
          ? {
              headVersion: baseline.version,
              versions: { [String(baseline.version)]: baseline },
              requests: {},
              audit: {}
            }
          : current;
        return applyConfigurationMutation(initialState, {
          ...safeClone(request),
          configurationId,
          scope
        }, actor, { now: operationNow });
      });
      if (!outcome?.ok) {
        const recordForAudit = outcome?.record
          || (await adapter.getConfigurationHead(scopeKey, configurationId))
          || baseline;
        const event = buildConfigurationAuditEvent("configuration-publish-rejected", recordForAudit, actor, {
          result: "REJECTED",
          reason: outcome?.reason || "configuration-transaction-aborted",
          idempotencyKey: request.idempotencyKey || ""
        }, { now: operationNow });
        await adapter.appendConfigurationAudit(event);
        throw new ConfigurationEngineError(outcome?.reason || "configuration-transaction-aborted", outcome || {});
      }
      return safeClone({
        configurationServiceVersion: CONFIGURATION_SERVICE_VERSION,
        ...outcome
      });
    },

    getBaselineConfiguration() {
      return safeClone(baseline);
    }
  });
}

function createFirebaseConfigurationAdapter(admin, options = {}) {
  if (!admin?.database) throw new ConfigurationEngineError("configuration-firebase-admin-required");
  const rootPath = normalizeRootPath(options.rootPath || DEFAULT_CONFIGURATION_ROOT);

  return Object.freeze({
    async listConfigurationVersions(configurationId, context = {}) {
      const scopeKeys = buildResolutionScopeKeys(context);
      const snapshots = await Promise.all(scopeKeys.map((scopeKey) => (
        admin.database().ref(`${rootPath}/records/${scopeKey}/${configurationId}/versions`).get()
      )));
      return snapshots.flatMap((snapshot) => Object.values(snapshot.val() || {}));
    },

    async getConfigurationHead(scopeKey, configurationId) {
      const snapshot = await admin.database().ref(`${rootPath}/records/${scopeKey}/${configurationId}`).get();
      const value = snapshot.val() || {};
      return value.headVersion > 0 ? value.versions?.[String(value.headVersion)] || null : null;
    },

    async transactConfiguration(scopeKey, configurationId, updater) {
      const target = admin.database().ref(`${rootPath}/records/${scopeKey}/${configurationId}`);
      let outcome = null;
      const transaction = await target.transaction((current) => {
        const applied = updater(current || null);
        outcome = safeClone(applied.outcome);
        if (!applied.outcome?.ok) return;
        return safeClone(applied.state);
      }, undefined, false);
      if (!transaction.committed && outcome?.ok) {
        return { ok: false, reason: "configuration-transaction-aborted" };
      }
      return outcome || { ok: false, reason: "configuration-transaction-aborted" };
    },

    async appendConfigurationAudit(event) {
      const path = `${rootPath}/audit/${event.organizationId || "system"}/${event.auditId}`;
      await admin.database().ref(path).set(safeClone(event));
      return safeClone(event);
    }
  });
}

function createMemoryConfigurationAdapter(seed = {}) {
  let records = safeClone(seed.records || {});
  let audit = safeClone(seed.audit || {});
  const locks = new Map();

  async function withLock(key, action) {
    const previous = locks.get(key) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    const chain = previous.then(() => current);
    locks.set(key, chain);
    await previous;
    try {
      return await action();
    } finally {
      release();
      if (locks.get(key) === chain) locks.delete(key);
    }
  }

  return Object.freeze({
    async listConfigurationVersions(configurationId, context = {}) {
      const scopeKeys = new Set(buildResolutionScopeKeys(context));
      const output = [];
      for (const scopeKey of scopeKeys) {
        const versions = records[scopeKey]?.[configurationId]?.versions || {};
        output.push(...Object.values(versions).map(safeClone));
      }
      return output;
    },
    async getConfigurationHead(scopeKey, configurationId) {
      const value = records[scopeKey]?.[configurationId] || {};
      return value.headVersion > 0 ? safeClone(value.versions?.[String(value.headVersion)] || null) : null;
    },
    async transactConfiguration(scopeKey, configurationId, updater) {
      const key = `${scopeKey}/${configurationId}`;
      return withLock(key, async () => {
        const current = records[scopeKey]?.[configurationId] || null;
        const applied = updater(safeClone(current));
        if (applied.outcome?.ok) {
          records[scopeKey] ||= {};
          records[scopeKey][configurationId] = safeClone(applied.state);
        }
        return safeClone(applied.outcome);
      });
    },
    async appendConfigurationAudit(event) {
      audit[event.auditId] = safeClone(event);
      return safeClone(event);
    },
    snapshot() {
      return safeClone({ records, audit });
    }
  });
}

function normalizeReadContext(request = {}, actor = {}) {
  return {
    tenantId: String(request.tenantId || actor.tenantId || ""),
    organizationId: String(request.organizationId || actor.organizationId || ""),
    tournamentId: String(request.tournamentId || ""),
    userId: String(request.userId || actor.uid || ""),
    sessionId: String(request.sessionId || "")
  };
}

function inferAuthorizationScope(context) {
  if (context.sessionId) return { type: "session", id: context.sessionId, ...context };
  if (context.userId && context.organizationId) return { type: "user", id: context.userId, ...context };
  if (context.tournamentId) return { type: "tournament", id: context.tournamentId, ...context };
  if (context.organizationId) return { type: "organization", id: context.organizationId, ...context };
  return { type: "system" };
}

function normalizeRootPath(value) {
  const normalized = String(value || "").replace(/^\/+|\/+$/g, "");
  if (!/^[A-Za-z0-9_/-]+$/.test(normalized)) throw new ConfigurationEngineError("configuration-root-path-invalid");
  return normalized;
}

function getRuntimeNow(options = {}) {
  const value = typeof options.now === "function" ? options.now() : new Date().toISOString();
  const timestamp = Date.parse(String(value || ""));
  if (!Number.isFinite(timestamp)) throw new ConfigurationEngineError("configuration-runtime-clock-invalid");
  return new Date(timestamp).toISOString();
}

function validateAdapter(adapter) {
  for (const name of [
    "listConfigurationVersions",
    "getConfigurationHead",
    "transactConfiguration",
    "appendConfigurationAudit"
  ]) {
    if (typeof adapter?.[name] !== "function") throw new ConfigurationEngineError("configuration-adapter-invalid", { name });
  }
}

module.exports = {
  CONFIGURATION_SERVICE_VERSION,
  DEFAULT_CONFIGURATION_ROOT,
  createConfigurationRuntime,
  createFirebaseConfigurationAdapter,
  createMemoryConfigurationAdapter
};
