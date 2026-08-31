const crypto = require("node:crypto");

const CONFIGURATION_ENGINE_VERSION = "1.0.0";
const CONFIGURATION_SCHEMA_VERSION = "charropro-configuration/1";
const CONFIGURATION_SCOPES = Object.freeze(["system", "organization", "tournament", "user", "session"]);
const CONFIGURATION_HIERARCHY = Object.freeze([...CONFIGURATION_SCOPES]);
const CONFIGURATION_STATUSES = Object.freeze(["draft", "published", "deprecated", "archived"]);
const RELEASE_STATUSES = Object.freeze(["precommercial", "commercial_approved"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const DEFAULT_LIMITS = Object.freeze({
  maxDepth: 12,
  maxArrayLength: 500,
  maxObjectKeys: 500,
  maxNodes: 5000,
  maxStringLength: 20000
});

class ConfigurationEngineError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "ConfigurationEngineError";
    this.code = code;
    this.details = safeClone(details);
  }
}

function safeClone(value, options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const seen = new WeakSet();
  const state = { nodes: 0 };

  function visit(current, depth) {
    state.nodes += 1;
    if (state.nodes > limits.maxNodes) throw new ConfigurationEngineError("configuration-size-limit");
    if (depth > limits.maxDepth) throw new ConfigurationEngineError("configuration-depth-limit");
    if (current === null || typeof current === "boolean") return current;
    if (typeof current === "string") {
      if (current.length > limits.maxStringLength) throw new ConfigurationEngineError("configuration-string-limit");
      return current;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) throw new ConfigurationEngineError("configuration-number-invalid");
      return current;
    }
    if (["undefined", "function", "symbol", "bigint"].includes(typeof current)) {
      throw new ConfigurationEngineError("configuration-value-not-serializable");
    }
    if (seen.has(current)) throw new ConfigurationEngineError("configuration-cycle-detected");
    seen.add(current);
    try {
      if (Array.isArray(current)) {
        if (current.length > limits.maxArrayLength) throw new ConfigurationEngineError("configuration-array-limit");
        return current.map((item) => visit(item, depth + 1));
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new ConfigurationEngineError("configuration-object-invalid");
      }
      const keys = Reflect.ownKeys(current);
      if (keys.some((key) => typeof key === "symbol")) {
        throw new ConfigurationEngineError("configuration-symbol-key");
      }
      if (keys.length > limits.maxObjectKeys) throw new ConfigurationEngineError("configuration-object-key-limit");
      const output = {};
      for (const key of keys) {
        if (DANGEROUS_KEYS.has(key)) throw new ConfigurationEngineError("configuration-dangerous-key");
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (!descriptor || descriptor.get || descriptor.set) {
          throw new ConfigurationEngineError("configuration-accessor-rejected");
        }
        output[key] = visit(descriptor.value, depth + 1);
      }
      return output;
    } finally {
      seen.delete(current);
    }
  }

  return visit(value, 0);
}

function canonicalStringify(value) {
  const normalized = safeClone(value);
  return JSON.stringify(sortCanonical(normalized));
}

function fingerprintConfiguration(value) {
  return crypto.createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function normalizeConfigurationScope(input = {}) {
  const type = normalizeToken(input.type || input.scopeType || "system", 32);
  if (!CONFIGURATION_SCOPES.includes(type)) throw new ConfigurationEngineError("configuration-scope-invalid");
  const scope = {
    type,
    id: "",
    tenantId: normalizeIdentifier(input.tenantId, false),
    organizationId: normalizeIdentifier(input.organizationId, false),
    tournamentId: normalizeIdentifier(input.tournamentId, false),
    userId: normalizeIdentifier(input.userId, false),
    sessionId: normalizeIdentifier(input.sessionId, false)
  };
  const keyByType = {
    system: "system",
    organization: scope.organizationId,
    tournament: scope.tournamentId,
    user: scope.userId,
    session: scope.sessionId
  };
  if (type !== "system" && input.id && keyByType[type] && String(input.id) !== keyByType[type]) {
    throw new ConfigurationEngineError("configuration-scope-identity-conflict");
  }
  scope.id = type === "system" ? "system" : normalizeIdentifier(input.id || keyByType[type], true);
  if (type !== "system" && !scope.organizationId) {
    throw new ConfigurationEngineError("configuration-organization-required");
  }
  if (type === "organization") scope.organizationId = scope.id;
  if (type === "tournament" && !scope.tournamentId) scope.tournamentId = scope.id;
  if (type === "user" && !scope.userId) scope.userId = scope.id;
  if (type === "session" && !scope.sessionId) scope.sessionId = scope.id;
  return Object.freeze(scope);
}

function buildConfigurationScopeKey(scopeInput = {}) {
  const scope = normalizeConfigurationScope(scopeInput);
  const tenant = scope.tenantId || "shared";
  return `${scope.type}__${tenant}__${scope.id}`;
}

function normalizeConfigurationRecord(input = {}, options = {}) {
  if (input.configurationEngineVersion && input.configurationEngineVersion !== CONFIGURATION_ENGINE_VERSION) {
    throw new ConfigurationEngineError("configuration-engine-version-unsupported");
  }
  if (input.schemaVersion && input.schemaVersion !== CONFIGURATION_SCHEMA_VERSION) {
    throw new ConfigurationEngineError("configuration-schema-version-unsupported");
  }
  const configurationId = normalizeIdentifier(input.configurationId, true);
  const scope = normalizeConfigurationScope(input.scope || input);
  const scopeKey = buildConfigurationScopeKey(scope);
  if (input.scopeKey && input.scopeKey !== scopeKey) {
    throw new ConfigurationEngineError("configuration-scope-key-mismatch");
  }
  const version = normalizePositiveInteger(input.version, "configuration-version-invalid");
  const status = normalizeToken(input.status || "draft", 32);
  if (!CONFIGURATION_STATUSES.includes(status)) throw new ConfigurationEngineError("configuration-status-invalid");
  const createdAt = normalizeIsoDate(input.createdAt, "configuration-created-at-invalid");
  const updatedAt = normalizeIsoDate(input.updatedAt, "configuration-updated-at-invalid");
  if (Date.parse(updatedAt) < Date.parse(createdAt)) throw new ConfigurationEngineError("configuration-date-order-invalid");
  const values = safeClone(input.values || {});
  if (!isPlainObject(values)) throw new ConfigurationEngineError("configuration-values-invalid");
  assertNoSecretKeys(values);
  const record = {
    configurationEngineVersion: CONFIGURATION_ENGINE_VERSION,
    schemaVersion: CONFIGURATION_SCHEMA_VERSION,
    configurationId,
    scope,
    scopeKey,
    version,
    parentVersion: input.parentVersion == null ? null : normalizePositiveInteger(input.parentVersion, "configuration-parent-version-invalid"),
    status,
    createdAt,
    updatedAt,
    author: normalizeActor(input.author),
    values,
    migration: normalizeMigration(input.migration),
    previousChecksum: normalizeChecksum(input.previousChecksum, false)
  };
  const checksum = fingerprintConfiguration(record);
  const suppliedChecksum = normalizeChecksum(input.checksum || input.fingerprint, false);
  if (options.verifyChecksum !== false && suppliedChecksum && suppliedChecksum !== checksum) {
    throw new ConfigurationEngineError("configuration-checksum-mismatch", { expected: checksum });
  }
  return Object.freeze({
    ...record,
    checksum,
    fingerprint: checksum
  });
}

function validateConfigurationRecord(input = {}) {
  try {
    const configuration = normalizeConfigurationRecord(input);
    return { valid: true, errors: [], warnings: [], configuration };
  } catch (error) {
    return {
      valid: false,
      errors: [String(error?.code || error?.message || "configuration-invalid")],
      warnings: [],
      configuration: null
    };
  }
}

function validateRuntimeConfigurationBaseline(input = {}) {
  const base = validateConfigurationRecord(input);
  if (!base.valid) return base;
  const configuration = base.configuration;
  const errors = [];
  const requiredStrings = [
    "system.appVersion",
    "system.environment",
    "system.releaseStatus",
    "firebase.sdkVersion",
    "firebase.functionsRegion",
    "firebase.client.apiKey",
    "firebase.client.authDomain",
    "firebase.client.databaseURL",
    "firebase.client.projectId",
    "firebase.client.storageBucket",
    "firebase.client.messagingSenderId",
    "firebase.client.appId",
    "firebase.functions.workerMemory",
    "firebase.functions.scheduleMemory",
    "firebase.functions.backupSchedule",
    "firebase.functions.backupTimeZone",
    "firebase.functions.backupCompatibilityAppVersion"
  ];
  for (const path of requiredStrings) {
    if (typeof getConfigurationValue(configuration, path, null) !== "string"
      || !getConfigurationValue(configuration, path, "").trim()) {
      errors.push(`configuration-baseline-required:${path}`);
    }
  }
  const paths = getConfigurationValue(configuration, "firebase.paths", {});
  for (const [name, path] of Object.entries(paths)) {
    if (!name || typeof path !== "string" || !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path)) {
      errors.push(`configuration-baseline-path-invalid:${name}`);
    }
  }
  for (const path of [
    "firebase.paths.root",
    "firebase.paths.users",
    "firebase.paths.userTournamentAccess",
    "firebase.paths.tournaments",
    "firebase.paths.configurationManagement",
    "firebase.paths.ruleProfileLifecycle",
    "firebase.paths.backupFoundation",
    "firebase.paths.restoreFoundation"
  ]) {
    if (!getConfigurationValue(configuration, path, "")) errors.push(`configuration-baseline-required:${path}`);
  }
  if (!RELEASE_STATUSES.includes(getConfigurationValue(configuration, "system.releaseStatus", ""))) {
    errors.push("configuration-baseline-release-status-invalid");
  }
  for (const path of [
    "application.timeouts.callableSeconds",
    "application.timeouts.cancelSeconds",
    "application.timeouts.workerSeconds"
  ]) {
    const value = getConfigurationValue(configuration, path, null);
    if (!Number.isSafeInteger(value) || value < 1 || value > 3600) errors.push(`configuration-baseline-timeout-invalid:${path}`);
  }
  if (typeof getConfigurationValue(configuration, "application.retry.firebaseWorkers", null) !== "boolean") {
    errors.push("configuration-baseline-retry-invalid");
  }
  if (!/^\d+(?:MiB|GiB)$/.test(getConfigurationValue(configuration, "firebase.functions.workerMemory", ""))) {
    errors.push("configuration-baseline-worker-memory-invalid");
  }
  if (!/^\d+(?:MiB|GiB)$/.test(getConfigurationValue(configuration, "firebase.functions.scheduleMemory", ""))) {
    errors.push("configuration-baseline-schedule-memory-invalid");
  }
  try {
    const databaseUrl = new URL(getConfigurationValue(configuration, "firebase.client.databaseURL", ""));
    if (databaseUrl.protocol !== "https:") errors.push("configuration-baseline-database-url-invalid");
  } catch {
    errors.push("configuration-baseline-database-url-invalid");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    configuration: errors.length ? null : configuration
  };
}

function createConfigurationVersion(definition = {}, actor = {}, options = {}) {
  const previous = options.previous
    ? normalizeConfigurationRecord(options.previous)
    : null;
  const scope = normalizeConfigurationScope(definition.scope || previous?.scope || {});
  const configurationId = normalizeIdentifier(definition.configurationId || previous?.configurationId, true);
  if (previous && (previous.configurationId !== configurationId || previous.scopeKey !== buildConfigurationScopeKey(scope))) {
    throw new ConfigurationEngineError("configuration-identity-conflict");
  }
  const now = normalizeIsoDate(options.now || new Date().toISOString(), "configuration-updated-at-invalid");
  const values = definition.mode === "merge" && previous
    ? mergeConfigurationValues(previous.values, definition.values || {})
    : safeClone(definition.values || {});
  const previousReleaseStatus = getConfigurationValue(previous, "system.releaseStatus", "");
  const nextReleaseStatus = getConfigurationValue({ values }, "system.releaseStatus", "");
  if (scope.type === "system") {
    if (!RELEASE_STATUSES.includes(nextReleaseStatus)) {
      throw new ConfigurationEngineError("configuration-release-status-invalid");
    }
    if (previousReleaseStatus === "commercial_approved" && nextReleaseStatus !== previousReleaseStatus) {
      throw new ConfigurationEngineError("configuration-release-status-regression-denied");
    }
  } else if (Object.hasOwn(values?.system || {}, "releaseStatus")) {
    throw new ConfigurationEngineError("configuration-release-status-scope-denied");
  }
  return normalizeConfigurationRecord({
    configurationId,
    scope,
    version: previous ? previous.version + 1 : 1,
    parentVersion: previous ? previous.version : null,
    status: definition.status || "published",
    createdAt: previous ? previous.createdAt : now,
    updatedAt: now,
    author: actor,
    values,
    migration: definition.migration,
    previousChecksum: previous?.checksum || null
  }, { verifyChecksum: false });
}

function resolveConfigurationHierarchy(records = [], context = {}, options = {}) {
  if (!Array.isArray(records)) throw new ConfigurationEngineError("configuration-records-invalid");
  const configurationId = normalizeIdentifier(options.configurationId || records[0]?.configurationId, true);
  const normalized = records.map((record) => normalizeConfigurationRecord(record));
  const seen = new Set();
  for (const record of normalized) {
    const identity = `${record.configurationId}:${record.scopeKey}:${record.version}`;
    if (seen.has(identity)) throw new ConfigurationEngineError("configuration-duplicate-version", { identity });
    seen.add(identity);
  }
  validateConfigurationHistory(normalized);
  const candidates = normalized.filter((record) => (
    record.configurationId === configurationId
    && record.status === "published"
    && scopeMatchesContext(record.scope, context)
  ));
  const selected = [];
  for (const scopeType of CONFIGURATION_HIERARCHY) {
    const atLevel = candidates
      .filter((record) => record.scope.type === scopeType)
      .sort(compareConfigurationRecords);
    if (atLevel[0]) selected.push(atLevel[0]);
  }
  if (!selected.length) {
    if (options.required === true) throw new ConfigurationEngineError("configuration-not-found");
    return Object.freeze({
      configurationId,
      status: "not-found",
      values: Object.freeze({}),
      sources: Object.freeze([]),
      checksum: fingerprintConfiguration({ configurationId, values: {} })
    });
  }
  let values = {};
  for (const record of selected) values = mergeConfigurationValues(values, record.values);
  const sources = selected.map((record) => ({
    scope: record.scope.type,
    scopeKey: record.scopeKey,
    version: record.version,
    checksum: record.checksum
  }));
  const result = {
    configurationEngineVersion: CONFIGURATION_ENGINE_VERSION,
    schemaVersion: CONFIGURATION_SCHEMA_VERSION,
    configurationId,
    status: "resolved",
    context: sanitizeResolutionContext(context),
    values,
    sources,
    resolvedAt: normalizeIsoDate(options.now || new Date().toISOString(), "configuration-resolved-at-invalid")
  };
  const checksum = fingerprintConfiguration({
    configurationEngineVersion: result.configurationEngineVersion,
    schemaVersion: result.schemaVersion,
    configurationId: result.configurationId,
    status: result.status,
    context: result.context,
    values: result.values,
    sources: result.sources
  });
  return Object.freeze({ ...safeClone(result), checksum });
}

function authorizeConfigurationOperation(operation, actorInput = {}, target = {}, options = {}) {
  const actor = normalizeActor(actorInput);
  const scope = normalizeConfigurationScope(target.scope || target);
  if (actor.active === false) return { allowed: false, reason: "configuration-user-inactive" };
  if (!actor.uid) return { allowed: false, reason: "configuration-auth-required" };
  const role = actor.role;
  const isPlatformAdmin = actor.platformAdmin === true;
  const sameTenant = !scope.tenantId || scope.tenantId === actor.tenantId;
  const sameOrganization = scope.type === "system"
    || (scope.organizationId && actor.organizationId === scope.organizationId);
  if (!sameTenant) return { allowed: false, reason: "configuration-tenant-denied" };
  if (scope.type === "system" && !isPlatformAdmin && operation !== "read") {
    return { allowed: false, reason: "configuration-platform-admin-required" };
  }
  if (scope.type !== "system" && !sameOrganization) {
    return { allowed: false, reason: "configuration-organization-denied" };
  }
  if (operation === "read") {
    const readable = new Set(["supervisor", "operador", "organizador", "graficos", "juez", "locutor", "lectura"]);
    if (!readable.has(role) && !isPlatformAdmin) return { allowed: false, reason: "configuration-read-role-denied" };
    if (options.critical === true && role !== "supervisor" && !isPlatformAdmin) {
      return { allowed: false, reason: "configuration-critical-read-denied" };
    }
    if (scope.type === "user" && scope.userId !== actor.uid && role !== "supervisor" && !isPlatformAdmin) {
      return { allowed: false, reason: "configuration-user-scope-denied" };
    }
    return { allowed: true, reason: "configuration-read-authorized" };
  }
  if (role !== "supervisor" && !isPlatformAdmin) {
    return { allowed: false, reason: "configuration-write-role-denied" };
  }
  return { allowed: true, reason: "configuration-write-authorized" };
}

function applyConfigurationMutation(currentInput, request = {}, actorInput = {}, options = {}) {
  const state = normalizeConfigurationState(currentInput);
  const scope = normalizeConfigurationScope(request.scope || {});
  const authorization = authorizeConfigurationOperation("write", actorInput, { scope });
  const idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey);
  const expectedVersion = normalizeNonNegativeInteger(request.expectedVersion, "configuration-expected-version-invalid");
  const requestFingerprint = fingerprintConfiguration({
    configurationId: request.configurationId,
    scope,
    expectedVersion,
    status: request.status || "published",
    mode: request.mode || "replace",
    values: request.values || {}
  });
  if (!authorization.allowed) return mutationRejected(state, authorization.reason);
  const existingRequest = state.requests[idempotencyKey];
  if (existingRequest) {
    if (existingRequest.requestFingerprint !== requestFingerprint) {
      return mutationRejected(state, "configuration-idempotency-conflict");
    }
    return {
      state,
      outcome: {
        ok: true,
        idempotent: true,
        reason: "configuration-already-applied",
        version: existingRequest.version,
        record: safeClone(state.versions[String(existingRequest.version)])
      }
    };
  }
  if (state.headVersion !== expectedVersion) {
    return mutationRejected(state, "configuration-revision-conflict", { currentVersion: state.headVersion });
  }
  const previous = state.headVersion > 0 ? state.versions[String(state.headVersion)] : null;
  const record = createConfigurationVersion(request, actorInput, {
    previous,
    now: options.now || request.now
  });
  const audit = buildConfigurationAuditEvent("configuration-published", record, actorInput, {
    result: "SUCCESS",
    reason: previous ? "configuration-version-created" : "configuration-created",
    idempotencyKey
  }, { now: record.updatedAt });
  const next = safeClone(state);
  next.headVersion = record.version;
  next.versions[String(record.version)] = safeClone(record);
  next.requests[idempotencyKey] = {
    requestFingerprint,
    version: record.version,
    checksum: record.checksum,
    createdAt: record.updatedAt
  };
  next.audit[audit.auditId] = audit;
  return {
    state: next,
    outcome: {
      ok: true,
      idempotent: false,
      reason: audit.reason,
      version: record.version,
      record: safeClone(record),
      audit: safeClone(audit)
    }
  };
}

function buildConfigurationAuditEvent(operation, recordInput, actorInput, details = {}, options = {}) {
  const record = normalizeConfigurationRecord(recordInput);
  const actor = normalizeActor(actorInput);
  const timestamp = normalizeIsoDate(options.now || new Date().toISOString(), "configuration-audit-time-invalid");
  const idempotencyKey = normalizeToken(details.idempotencyKey || "", 180);
  const operationId = idempotencyKey || normalizeToken(options.operationId || crypto.randomUUID(), 180);
  const payload = {
    operationId,
    operation: normalizeToken(operation, 80),
    configurationId: record.configurationId,
    scopeKey: record.scopeKey,
    version: record.version,
    checksum: record.checksum,
    actor,
    organizationId: record.scope.organizationId || actor.organizationId || "",
    result: normalizeToken(details.result || "SUCCESS", 32).toUpperCase(),
    reason: normalizeToken(details.reason || "configuration-operation-complete", 120),
    timestamp,
    idempotencyKey
  };
  return Object.freeze({
    auditId: `cfg_audit_${fingerprintConfiguration(payload).slice(0, 32)}`,
    ...payload
  });
}

function buildResolutionScopeKeys(context = {}) {
  const keys = [buildConfigurationScopeKey({ type: "system" })];
  if (!context.organizationId) return keys;
  keys.push(buildConfigurationScopeKey({
    type: "organization",
    id: context.organizationId,
    organizationId: context.organizationId,
    tenantId: context.tenantId
  }));
  for (const [type, key] of [["tournament", "tournamentId"], ["user", "userId"], ["session", "sessionId"]]) {
    if (!context[key]) continue;
    keys.push(buildConfigurationScopeKey({
      type,
      id: context[key],
      organizationId: context.organizationId,
      tenantId: context.tenantId,
      [key]: context[key],
      tournamentId: context.tournamentId
    }));
  }
  return keys;
}

function getConfigurationValue(configuration, path, fallback = null) {
  const segments = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
  let cursor = configuration?.values ?? configuration;
  for (const segment of segments) {
    if (DANGEROUS_KEYS.has(segment) || cursor === null || typeof cursor !== "object" || !Object.hasOwn(cursor, segment)) {
      return fallback;
    }
    cursor = cursor[segment];
  }
  return cursor;
}

function normalizeConfigurationState(input) {
  const source = input && typeof input === "object" ? safeClone(input) : {};
  const state = {
    headVersion: Number.isSafeInteger(source.headVersion) && source.headVersion >= 0 ? source.headVersion : 0,
    versions: source.versions && typeof source.versions === "object" ? source.versions : {},
    requests: source.requests && typeof source.requests === "object" ? source.requests : {},
    audit: source.audit && typeof source.audit === "object" ? source.audit : {}
  };
  for (const [key, record] of Object.entries(state.versions)) {
    state.versions[key] = safeClone(normalizeConfigurationRecord(record));
  }
  return state;
}

function mergeConfigurationValues(base, override) {
  const left = safeClone(base || {});
  const right = safeClone(override || {});
  return mergeObjects(left, right);
}

function mergeObjects(left, right) {
  const output = safeClone(left);
  for (const [key, value] of Object.entries(right)) {
    if (isPlainObject(value) && isPlainObject(output[key])) output[key] = mergeObjects(output[key], value);
    else output[key] = safeClone(value);
  }
  return output;
}

function scopeMatchesContext(scope, context = {}) {
  if (scope.tenantId && scope.tenantId !== context.tenantId) return false;
  if (scope.type === "system") return true;
  if (!context.organizationId || scope.organizationId !== context.organizationId) return false;
  if (scope.type === "organization") return true;
  if (scope.type === "tournament") return scope.tournamentId === context.tournamentId;
  if (scope.type === "user") return scope.userId === context.userId;
  return scope.sessionId === context.sessionId;
}

function compareConfigurationRecords(left, right) {
  if (right.version !== left.version) return right.version - left.version;
  return right.updatedAt.localeCompare(left.updatedAt) || left.checksum.localeCompare(right.checksum);
}

function validateConfigurationHistory(records) {
  const groups = new Map();
  for (const record of records) {
    const key = `${record.configurationId}:${record.scopeKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  for (const versions of groups.values()) {
    versions.sort((left, right) => left.version - right.version);
    for (let index = 0; index < versions.length; index += 1) {
      const current = versions[index];
      const previous = versions[index - 1] || null;
      if (!previous) {
        if (current.version !== 1 || current.parentVersion !== null || current.previousChecksum !== null) {
          throw new ConfigurationEngineError("configuration-history-root-invalid");
        }
        continue;
      }
      if (current.version !== previous.version + 1
        || current.parentVersion !== previous.version
        || current.previousChecksum !== previous.checksum
        || current.createdAt !== previous.createdAt
        || Date.parse(current.updatedAt) < Date.parse(previous.updatedAt)) {
        throw new ConfigurationEngineError("configuration-history-chain-invalid");
      }
    }
  }
}

function mutationRejected(state, reason, details = {}) {
  return {
    state,
    outcome: { ok: false, idempotent: false, reason, ...safeClone(details) }
  };
}

function sortCanonical(value) {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (!isPlainObject(value)) return value;
  const output = {};
  for (const key of Object.keys(value).sort()) output[key] = sortCanonical(value[key]);
  return output;
}

function sanitizeResolutionContext(context = {}) {
  return {
    tenantId: normalizeIdentifier(context.tenantId, false),
    organizationId: normalizeIdentifier(context.organizationId, false),
    tournamentId: normalizeIdentifier(context.tournamentId, false),
    userId: normalizeIdentifier(context.userId, false),
    sessionId: normalizeIdentifier(context.sessionId, false)
  };
}

function normalizeActor(input = {}) {
  return {
    uid: normalizeToken(input.uid || input.authUid || "", 180),
    name: normalizeToken(input.name || "", 180),
    role: normalizeToken(input.role || "", 64).toLowerCase(),
    tenantId: normalizeIdentifier(input.tenantId, false),
    organizationId: normalizeIdentifier(input.organizationId, false),
    platformAdmin: input.platformAdmin === true,
    active: input.active !== false
  };
}

function normalizeMigration(input) {
  if (input == null) return null;
  const value = safeClone(input);
  return {
    fromSchemaVersion: normalizeToken(value.fromSchemaVersion || "", 80),
    notes: normalizeToken(value.notes || "", 500)
  };
}

function normalizeIdentifier(value, required) {
  const normalized = String(value ?? "").trim();
  if (!normalized && !required) return "";
  if (!/^[A-Za-z0-9][A-Za-z0-9_:-]{0,127}$/.test(normalized)) {
    throw new ConfigurationEngineError("configuration-identifier-invalid");
  }
  return normalized;
}

function normalizeIdempotencyKey(value) {
  const normalized = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_:-]{15,179}$/.test(normalized)) {
    throw new ConfigurationEngineError("configuration-idempotency-key-invalid");
  }
  return normalized;
}

function normalizeToken(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizePositiveInteger(value, code) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new ConfigurationEngineError(code);
  return number;
}

function normalizeNonNegativeInteger(value, code) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new ConfigurationEngineError(code);
  return number;
}

function normalizeIsoDate(value, code) {
  const normalized = String(value || "");
  const time = Date.parse(normalized);
  if (!normalized || !Number.isFinite(time)) throw new ConfigurationEngineError(code);
  return new Date(time).toISOString();
}

function normalizeChecksum(value, required) {
  const normalized = String(value || "").toLowerCase();
  if (!normalized && !required) return null;
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new ConfigurationEngineError("configuration-checksum-invalid");
  return normalized;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertNoSecretKeys(value, path = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretKeys(item, [...path, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  const forbidden = new Set([
    "password",
    "secret",
    "privatekey",
    "credential",
    "credentials",
    "authtoken",
    "accesstoken",
    "refreshtoken",
    "signedurl"
  ]);
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (forbidden.has(normalized)) {
      throw new ConfigurationEngineError("configuration-secret-key-rejected", { path: [...path, key].join(".") });
    }
    assertNoSecretKeys(child, [...path, key]);
  }
}

module.exports = {
  CONFIGURATION_ENGINE_VERSION,
  CONFIGURATION_SCHEMA_VERSION,
  CONFIGURATION_SCOPES,
  CONFIGURATION_HIERARCHY,
  CONFIGURATION_STATUSES,
  ConfigurationEngineError,
  safeClone,
  canonicalStringify,
  fingerprintConfiguration,
  normalizeConfigurationScope,
  buildConfigurationScopeKey,
  normalizeConfigurationRecord,
  validateConfigurationRecord,
  validateRuntimeConfigurationBaseline,
  createConfigurationVersion,
  resolveConfigurationHierarchy,
  authorizeConfigurationOperation,
  applyConfigurationMutation,
  buildConfigurationAuditEvent,
  buildResolutionScopeKeys,
  getConfigurationValue,
  mergeConfigurationValues
};
