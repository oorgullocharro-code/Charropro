export const PRODUCTION_VARIABLES_VERSION = "1.0.0";

export const VARIABLE_TYPES = Object.freeze([
  "text", "number", "boolean", "color", "date", "datetime", "duration", "enum",
  "asset_ref", "contract_ref", "structured"
]);

export const VARIABLE_SCOPES = Object.freeze([
  "global", "tenant", "organization", "client", "tournament", "competition", "charreada",
  "output", "user", "session"
]);

export const VARIABLE_VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
export const VARIABLE_STATUSES = Object.freeze(["draft", "active", "disabled", "expired", "deprecated", "error"]);
export const VARIABLE_SOURCES = Object.freeze(["default", "operator", "system", "imported", "automation_future", "contract_reference"]);

export const PRODUCTION_VARIABLE_DEFINITIONS = Object.freeze([
  definition("production.message", "Mensaje", "text", "tournament", "public", { defaultValue: "", validation: { maxLength: 500 } }),
  definition("production.blockTitle", "Título de bloque", "text", "tournament", "public", { defaultValue: "", validation: { maxLength: 160 } }),
  definition("production.interviewName", "Nombre del entrevistado", "text", "tournament", "production", { defaultValue: "", validation: { maxLength: 160 } }),
  definition("production.interviewRole", "Cargo del entrevistado", "text", "tournament", "production", { defaultValue: "", validation: { maxLength: 160 } }),
  definition("production.activeCamera", "Cámara activa", "enum", "output", "production", { defaultValue: "camara_1", options: ["camara_1", "camara_2", "camara_3", "program"] }),
  definition("production.commercialCue", "Cue comercial", "text", "tournament", "production", { defaultValue: "", validation: { maxLength: 240 } }),
  definition("production.bumperDuration", "Duración de cortinilla", "duration", "tournament", "production", { defaultValue: 5000, validation: { min: 0, max: 120000 } }),
  definition("production.emergencyText", "Texto de emergencia", "text", "tournament", "operational", { defaultValue: "", validation: { maxLength: 500 }, writableBy: ["supervisor", "operador"] }),
  definition("production.nextBroadcast", "Próxima transmisión", "datetime", "tournament", "public", { defaultValue: null }),
  definition("production.qrAsset", "QR seleccionado", "asset_ref", "tournament", "public", { defaultValue: null }),
  definition("production.selectedSponsor", "Patrocinador seleccionado", "asset_ref", "tournament", "public", { defaultValue: null }),
  definition("production.lowerThirdTitle", "Lower third título", "text", "tournament", "public", { defaultValue: "", validation: { maxLength: 160 } }),
  definition("production.lowerThirdSubtitle", "Lower third subtítulo", "text", "tournament", "public", { defaultValue: "", validation: { maxLength: 240 } }),
  definition("production.customColor", "Color especial", "color", "tournament", "public", { defaultValue: "#D6AD43" })
]);

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SECRET_KEY_PATTERN = /(password|passwd|secret|token|apikey|authorization|credential|privatekey|signedurl)/i;
const CONTRACT_PATHS = new Set([
  "tournament.name", "competition.name", "participant.name", "team.name", "horse.name",
  "score.total", "timer.value"
]);
const STRUCTURED_SCHEMAS = new Set(["production.key_value_v1", "production.note_v1"]);
const IMMUTABLE_FIELDS = new Set([
  "variableId", "variablesVersion", "key", "createdAt", "createdBy", "tenantId", "version", "revision"
]);
const UPDATE_ALLOWLIST = new Set([
  "label", "description", "value", "defaultValue", "status", "visibility", "source", "options",
  "validation", "writableBy", "readableBy", "ttl", "expiresAt", "schemaId"
]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const SCOPE_RANK = Object.freeze({
  global: 0, tenant: 10, organization: 20, client: 30, tournament: 40,
  competition: 50, charreada: 60, output: 70, user: 80, session: 90
});
const SCOPE_FIELDS = Object.freeze({
  tenant: "tenantId", organization: "organizationId", client: "clientId", tournament: "tournamentId",
  competition: "competitionId", charreada: "charreadaId", output: "outputId", user: "userId", session: "sessionId"
});
const IDENTITY_FIELDS = Object.freeze(Object.values(SCOPE_FIELDS));
const MAX_DEPTH = 10;
const MAX_ARRAY_LENGTH = 200;
const MAX_OBJECT_KEYS = 1000;
const MAX_TEXT_LENGTH = 5000;
const MAX_OPTIONS = 100;

export class BroadcastVariableError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastVariableError";
    this.code = code;
    this.details = cloneSerializable(details, [], "error.details") || {};
  }
}

export function createProductionVariable(input = {}, options = {}) {
  if (!isRecord(input)) throw variableError("variable-not-object");
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const actor = normalizeActor(options.actor || input.createdBy);
  const variableId = normalizeId(input.variableId) || buildVariableId(input.key, now, options.random);
  const variable = normalizeProductionVariable({
    ...input,
    variableId,
    revision: input.revision ?? 0,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    createdBy: input.createdBy || actor,
    updatedBy: input.updatedBy || actor
  }, { ...options, now });
  assertValidVariable(variable, options);
  return variable;
}

export function normalizeProductionVariable(input = {}, options = {}) {
  const warnings = [];
  const raw = cloneSerializable(isRecord(input) ? input : {}, warnings, "variable") || {};
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const createdAt = normalizeIsoDate(raw.createdAt) || now;
  const expiresAt = normalizeIsoDate(raw.expiresAt);
  const status = VARIABLE_STATUSES.includes(raw.status) ? raw.status : "active";
  const expired = expiresAt && Date.parse(expiresAt) <= Date.parse(now);
  const dataType = VARIABLE_TYPES.includes(raw.dataType) ? raw.dataType : String(raw.dataType || "text");
  return {
    variablesVersion: PRODUCTION_VARIABLES_VERSION,
    variableId: normalizeId(raw.variableId),
    key: normalizeVariableKey(raw.key),
    label: nullableString(raw.label),
    description: nullableString(raw.description),
    dataType,
    value: normalizeVariableValue(raw.value, dataType),
    defaultValue: normalizeVariableValue(raw.defaultValue, dataType),
    status: expired && status === "active" ? "expired" : status,
    scope: VARIABLE_SCOPES.includes(raw.scope) ? raw.scope : "tournament",
    visibility: VARIABLE_VISIBILITIES.includes(raw.visibility) ? raw.visibility : "production",
    source: VARIABLE_SOURCES.includes(raw.source) ? raw.source : dataType === "contract_ref" ? "contract_reference" : "operator",
    tenantId: nullableId(raw.tenantId),
    organizationId: nullableId(raw.organizationId),
    clientId: nullableId(raw.clientId),
    tournamentId: nullableId(raw.tournamentId),
    competitionId: nullableId(raw.competitionId),
    charreadaId: nullableId(raw.charreadaId),
    outputId: nullableId(raw.outputId),
    userId: nullableId(raw.userId),
    sessionId: nullableId(raw.sessionId),
    schemaId: nullableId(raw.schemaId),
    options: normalizeOptions(raw.options),
    validation: normalizeValidation(raw.validation),
    writableBy: normalizeRoles(raw.writableBy),
    readableBy: normalizeRoles(raw.readableBy),
    ttl: nonNegativeIntegerOrNull(raw.ttl),
    expiresAt,
    revision: nonNegativeInteger(raw.revision, 0),
    version: isSemanticVersion(raw.version) ? raw.version : "1.0.0",
    createdAt,
    updatedAt: normalizeIsoDate(raw.updatedAt) || createdAt,
    createdBy: normalizeActor(raw.createdBy),
    updatedBy: normalizeActor(raw.updatedBy),
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...warnings]),
    errors: uniqueStrings(raw.errors)
  };
}

export function validateProductionVariable(variableInput, options = {}) {
  if (!isRecord(variableInput)) return validationResult(false, ["variable-not-object"], []);
  const variable = normalizeProductionVariable(variableInput, options);
  const errors = [];
  const warnings = [...variable.warnings];
  if (variable.variablesVersion !== PRODUCTION_VARIABLES_VERSION) errors.push("variables-version-incompatible");
  if (!isSafeId(variable.variableId)) errors.push("variable-id-invalid");
  if (!isSafeVariableKey(variable.key)) errors.push("variable-key-invalid");
  if (!variable.label) errors.push("variable-label-required");
  if (SECRET_KEY_PATTERN.test(`${variable.key} ${variable.label || ""}`)) errors.push("variable-secret-key-forbidden");
  if (!VARIABLE_TYPES.includes(variable.dataType)) errors.push("variable-type-invalid");
  if (!VARIABLE_SCOPES.includes(variable.scope)) errors.push("variable-scope-invalid");
  if (!VARIABLE_VISIBILITIES.includes(variable.visibility)) errors.push("variable-visibility-invalid");
  if (!VARIABLE_STATUSES.includes(variable.status)) errors.push("variable-status-invalid");
  if (!VARIABLE_SOURCES.includes(variable.source)) errors.push("variable-source-invalid");
  if (!isSemanticVersion(variable.version)) errors.push("variable-version-invalid");
  if (!Number.isInteger(variable.revision) || variable.revision < 0) errors.push("variable-revision-invalid");
  if (variable.warnings.some((warning) => warning.includes("non-finite-number"))) errors.push("variable-non-finite-number");
  if (variable.dataType === "structured" && variable.warnings.some((warning) =>
    warning.startsWith("variable.value") && /(depth-exceeded|array-truncated|object-truncated)/.test(warning)
  )) errors.push("variable-structured-limit-exceeded");
  if (!isIsoDate(variable.createdAt) || !isIsoDate(variable.updatedAt)) errors.push("variable-timestamp-invalid");
  if (variable.expiresAt && !isIsoDate(variable.expiresAt)) errors.push("variable-expiration-invalid");
  validateScope(variable, errors);
  validateVariableValue(variable.value, variable, "value", errors);
  validateVariableValue(variable.defaultValue, variable, "default", errors);
  if (variable.dataType === "structured" && !STRUCTURED_SCHEMAS.has(variable.schemaId)) errors.push("variable-structured-schema-unregistered");
  if (variable.dataType === "contract_ref" && variable.source !== "contract_reference") errors.push("variable-contract-source-invalid");
  if (containsDangerousKey(variable)) errors.push("variable-dangerous-key-present");
  if (variable.status === "expired") warnings.push("variable-expired");
  if (variable.status === "disabled") warnings.push("variable-disabled");
  if (variable.status === "deprecated") warnings.push("variable-deprecated");
  return validationResult(errors.length === 0, uniqueStrings(errors), uniqueStrings(warnings));
}

export function registerProductionVariable(registry = {}, variableInput, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertExpectedRevision(base, options.expectedRevision, "registry");
  ensureActorRole(options.actor, ["supervisor"], "variable-register-not-authorized");
  const variable = createProductionVariable(variableInput, options);
  if (base.variables[variable.variableId]) throw variableError("variable-id-duplicate", { variableId: variable.variableId });
  if (Object.values(base.variables).some((item) => namespaceKey(item) === namespaceKey(variable))) {
    throw variableError("variable-key-scope-duplicate", { key: variable.key, scope: variable.scope });
  }
  if (base.tenantId && variable.tenantId && base.tenantId !== variable.tenantId) throw variableError("variable-tenant-conflict");
  const next = cloneRegistry(base);
  next.variables[variable.variableId] = variable;
  touchRegistry(next, options);
  return next;
}

export function updateProductionVariable(registry, variableId, patch = {}, options = {}) {
  if (!isRecord(patch)) throw variableError("variable-patch-not-object");
  const base = normalizeRegistry(registry, options);
  const current = requireVariable(base, variableId);
  assertExpectedRevision(current, options.expectedRevision, "variable");
  Object.keys(patch).forEach((key) => {
    if (IMMUTABLE_FIELDS.has(key)) throw variableError(`variable-patch-field-forbidden:${key}`);
    if (!UPDATE_ALLOWLIST.has(key) || DANGEROUS_KEYS.has(key)) throw variableError(`variable-patch-field-not-allowed:${key}`);
  });
  const operationalStatusOnly = options.allowOperationalStatus === true
    && Object.keys(patch).every((key) => key === "status")
    && ["active", "disabled"].includes(patch.status);
  if (operationalStatusOnly) ensureWritable(current, options.actor);
  else ensureActorRole(options.actor, ["supervisor"], "variable-definition-update-not-authorized");
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const candidate = normalizeProductionVariable({
    ...current,
    ...cloneSerializable(patch, [], "variable.patch"),
    variableId: current.variableId,
    variablesVersion: current.variablesVersion,
    key: current.key,
    tenantId: current.tenantId,
    version: current.version,
    revision: current.revision + 1,
    createdAt: current.createdAt,
    createdBy: current.createdBy,
    updatedAt: now,
    updatedBy: options.actor || current.updatedBy
  }, { ...options, now });
  assertValidVariable(candidate, options);
  const next = cloneRegistry(base);
  next.variables[current.variableId] = candidate;
  touchRegistry(next, options);
  return next;
}

export function removeProductionVariable(registry, variableId, options = {}) {
  const base = normalizeRegistry(registry, options);
  const current = requireVariable(base, variableId);
  assertExpectedRevision(current, options.expectedRevision, "variable");
  ensureActorRole(options.actor, ["supervisor"], "variable-remove-not-authorized");
  if (!["draft", "disabled"].includes(current.status) && options.force !== true) throw variableError("variable-remove-active-forbidden");
  const next = cloneRegistry(base);
  delete next.variables[current.variableId];
  touchRegistry(next, options);
  return next;
}

export function getProductionVariable(registry, keyOrId) {
  const base = normalizeRegistry(registry);
  const lookup = String(keyOrId || "");
  const variable = base.variables[lookup] || Object.values(base.variables).find((item) => item.key === lookup);
  return variable ? cloneProductionVariable(variable) : null;
}

export function listProductionVariables(registry, filter = {}) {
  const base = normalizeRegistry(registry);
  return Object.values(base.variables)
    .filter((item) => !filter.key || item.key === filter.key)
    .filter((item) => !filter.scope || item.scope === filter.scope)
    .filter((item) => !filter.status || item.status === filter.status)
    .filter((item) => !filter.visibility || item.visibility === filter.visibility)
    .filter((item) => !filter.dataType || item.dataType === filter.dataType)
    .sort((left, right) => left.key.localeCompare(right.key) || SCOPE_RANK[right.scope] - SCOPE_RANK[left.scope] || left.variableId.localeCompare(right.variableId))
    .map(cloneProductionVariable);
}

export function resolveProductionVariable(registry, keyOrId, context = {}, options = {}) {
  const safeContext = sanitizeContext(context, options);
  const base = normalizeRegistry(registry, { ...options, now: safeContext.now });
  const requested = String(keyOrId || "");
  const direct = base.variables[requested];
  const key = direct?.key || normalizeVariableKey(requested);
  const visibility = normalizeVisibility(options.visibility || safeContext.visibility);
  const role = normalizeRole(options.actor?.role || safeContext.actor?.role);
  const allCandidates = Object.values(base.variables).filter((item) => item.key === key && matchesContext(item, safeContext));
  const candidates = allCandidates
    .filter((item) => VISIBILITY_RANK[item.visibility] <= VISIBILITY_RANK[visibility])
    .filter((item) => !item.readableBy.length || (role && item.readableBy.includes(role)))
    .sort(compareResolutionCandidates);
  const active = candidates.filter((item) => item.status === "active" && !isExpired(item, safeContext.now));
  const selected = active.find((item) => item.value !== null && item.value !== undefined);
  if (selected) return resolvedEntry(selected, resolveTypedValue(selected, safeContext, options), false, null);
  const defaultOwner = candidates.find((item) => item.defaultValue !== null && item.defaultValue !== undefined);
  if (defaultOwner) return resolvedEntry(defaultOwner, resolveTypedValue({ ...defaultOwner, value: defaultOwner.defaultValue }, safeContext, options), true,
    active.length ? "default-value" : "inactive-or-expired-fallback");
  const consumerFallback = options.fallback;
  return {
    resolved: consumerFallback !== undefined,
    key,
    variableId: direct?.variableId || candidates[0]?.variableId || null,
    value: consumerFallback === undefined ? null : cloneSerializable(consumerFallback, [], "resolve.fallback"),
    dataType: direct?.dataType || candidates[0]?.dataType || null,
    sourceScope: null,
    source: null,
    revision: direct?.revision ?? candidates[0]?.revision ?? null,
    visibility,
    fallbackUsed: consumerFallback !== undefined,
    fallbackReason: consumerFallback === undefined ? "variable-not-resolved" : "consumer-fallback",
    warnings: uniqueStrings(allCandidates.length ? ["variable-no-effective-value"] : ["variable-not-found"]),
    errors: []
  };
}

export function resolveProductionVariables(registry, context = {}, options = {}) {
  const keys = uniqueStrings(listProductionVariables(registry).map((item) => item.key));
  const entries = keys.map((key) => resolveProductionVariable(registry, key, context, options));
  return {
    resolved: entries.every((entry) => entry.resolved || entry.errors.length === 0),
    values: Object.fromEntries(entries.filter((entry) => entry.resolved).map((entry) => [entry.key, cloneSerializable(entry.value, [], `values.${entry.key}`)])),
    entries,
    warnings: uniqueStrings(entries.flatMap((entry) => entry.warnings)),
    errors: uniqueStrings(entries.flatMap((entry) => entry.errors))
  };
}

export function setProductionVariableValue(registry, variableId, value, options = {}) {
  const base = normalizeRegistry(registry, options);
  const current = requireVariable(base, variableId);
  assertExpectedRevision(current, options.expectedRevision, "variable");
  ensureWritable(current, options.actor);
  if (current.dataType === "contract_ref") throw variableError("variable-contract-ref-read-only");
  const errors = [];
  validateVariableValue(value, current, "value", errors);
  if (errors.length) throw variableError("variable-value-invalid", { errors });
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const expiresAt = current.ttl === null ? current.expiresAt : new Date(Date.parse(now) + current.ttl).toISOString();
  return replaceVariable(base, current, {
    value,
    status: current.status === "expired" ? "active" : current.status,
    source: options.source || "operator",
    expiresAt
  }, { ...options, now });
}

export function resetProductionVariableValue(registry, variableId, options = {}) {
  const base = normalizeRegistry(registry, options);
  const current = requireVariable(base, variableId);
  assertExpectedRevision(current, options.expectedRevision, "variable");
  ensureWritable(current, options.actor);
  if (current.dataType === "contract_ref") throw variableError("variable-contract-ref-read-only");
  return replaceVariable(base, current, {
    value: options.strategy === "default" ? current.defaultValue : null,
    source: options.strategy === "default" ? "default" : current.source,
    expiresAt: null,
    status: current.status === "expired" ? "active" : current.status
  }, options);
}

export function expireProductionVariable(registry, variableId, options = {}) {
  const base = normalizeRegistry(registry, options);
  const current = requireVariable(base, variableId);
  assertExpectedRevision(current, options.expectedRevision, "variable");
  ensureActorRole(options.actor, ["supervisor", "system"], "variable-expire-not-authorized");
  return replaceVariable(base, current, { status: "expired", expiresAt: options.expiresAt || options.now || new Date().toISOString() }, options);
}

export function getProductionVariableWarnings(variableInput, context = {}) {
  const variable = normalizeProductionVariable(variableInput, { now: context.now });
  const warnings = [...variable.warnings];
  if (variable.status === "expired" || isExpired(variable, context.now)) warnings.push("variable-expired");
  if (variable.status === "disabled") warnings.push("variable-disabled");
  if (variable.status === "deprecated") warnings.push("variable-deprecated");
  if (variable.visibility === "restricted") warnings.push("variable-restricted");
  if (variable.dataType === "contract_ref" && !CONTRACT_PATHS.has(variable.value || variable.defaultValue)) warnings.push("variable-contract-path-not-allowed");
  return uniqueStrings(warnings);
}

export function cloneProductionVariable(variable) {
  return cloneSerializable(variable, [], "variable.clone") || {};
}

export function buildProductionVariablesSnapshot(registry, context = {}, options = {}) {
  const now = normalizeIsoDate(options.now || context.now) || new Date().toISOString();
  const visibility = normalizeVisibility(options.visibility || context.visibility);
  const safeContext = sanitizeContext({ ...context, now, visibility }, options);
  const resolved = resolveProductionVariables(registry, safeContext, { ...options, now, visibility });
  const entries = resolved.entries.filter((entry) => entry.resolved);
  const snapshot = {
    snapshotVersion: PRODUCTION_VARIABLES_VERSION,
    generatedAt: now,
    context: snapshotContext(safeContext, visibility),
    values: Object.fromEntries(entries.map((entry) => [entry.key, cloneSerializable(entry.value, [], `snapshot.${entry.key}`)])),
    sourceScopes: Object.fromEntries(entries.map((entry) => [entry.key, entry.sourceScope])),
    revisions: Object.fromEntries(entries.map((entry) => [entry.key, entry.revision])),
    warnings: uniqueStrings(resolved.warnings),
    errors: uniqueStrings(resolved.errors)
  };
  return cloneSerializable(snapshot, [], "snapshot") || {};
}

export function validateProductionVariablesSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  if (!isRecord(snapshot)) return validationResult(false, ["variables-snapshot-not-object"], warnings);
  if (snapshot.snapshotVersion !== PRODUCTION_VARIABLES_VERSION) errors.push("variables-snapshot-version-invalid");
  if (!isIsoDate(snapshot.generatedAt)) errors.push("variables-snapshot-generated-at-invalid");
  for (const key of ["context", "values", "sourceScopes", "revisions"]) if (!isRecord(snapshot[key])) errors.push(`variables-snapshot-${key}-invalid`);
  if (containsDangerousKey(snapshot)) errors.push("variables-snapshot-dangerous-key-present");
  if (containsSensitiveKey(snapshot)) errors.push("variables-snapshot-secret-present");
  return validationResult(errors.length === 0, uniqueStrings(errors), warnings);
}

function definition(key, label, dataType, scope, visibility, overrides = {}) {
  return Object.freeze({
    variableId: `var_${key.replaceAll(".", "_")}`,
    key,
    label,
    description: null,
    dataType,
    value: null,
    defaultValue: overrides.defaultValue ?? null,
    status: "active",
    scope,
    visibility,
    source: "operator",
    options: Object.freeze([...(overrides.options || [])]),
    validation: Object.freeze({ ...(overrides.validation || {}) }),
    writableBy: Object.freeze([...(overrides.writableBy || ["supervisor", "operador", "graficos"])]),
    readableBy: Object.freeze([]),
    ttl: null,
    schemaId: null,
    version: "1.0.0"
  });
}

function resolvedEntry(variable, value, fallbackUsed, fallbackReason) {
  const errors = [];
  if (variable.dataType !== "contract_ref") validateVariableValue(value, variable, "resolved", errors);
  return {
    resolved: errors.length === 0,
    key: variable.key,
    variableId: variable.variableId,
    value: cloneSerializable(value, [], `resolved.${variable.key}`),
    dataType: variable.dataType,
    sourceScope: variable.scope,
    source: variable.dataType === "contract_ref" ? "contract_reference" : variable.source,
    revision: variable.revision,
    visibility: variable.visibility,
    fallbackUsed,
    fallbackReason,
    warnings: uniqueStrings(getProductionVariableWarnings(variable)),
    errors: uniqueStrings(errors)
  };
}

function resolveTypedValue(variable, context, options) {
  if (variable.dataType !== "contract_ref") return variable.value;
  const path = variable.value;
  if (!CONTRACT_PATHS.has(path)) throw variableError("variable-contract-path-not-allowed", { path });
  return getSafePath(options.contract || context.contract, path);
}

function replaceVariable(base, current, patch, options = {}) {
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const candidate = normalizeProductionVariable({
    ...current,
    ...cloneSerializable(patch, [], "variable.replace"),
    variableId: current.variableId,
    variablesVersion: current.variablesVersion,
    key: current.key,
    tenantId: current.tenantId,
    version: current.version,
    revision: current.revision + 1,
    createdAt: current.createdAt,
    createdBy: current.createdBy,
    updatedAt: now,
    updatedBy: options.actor || current.updatedBy
  }, { ...options, now });
  assertValidVariable(candidate, options);
  const next = cloneRegistry(base);
  next.variables[current.variableId] = candidate;
  touchRegistry(next, options);
  return next;
}

function validateVariableValue(value, variable, field, errors) {
  if (value === null || value === undefined) return;
  const validation = variable.validation || {};
  if (variable.dataType === "text") {
    if (typeof value !== "string") errors.push(`${field}-text-invalid`);
    else {
      const maxLength = Math.min(validation.maxLength ?? MAX_TEXT_LENGTH, MAX_TEXT_LENGTH);
      if (value.length > maxLength) errors.push(`${field}-text-too-long`);
      if (validation.allowEmpty === false && value === "") errors.push(`${field}-text-empty`);
      if (containsExecutableText(value)) errors.push(`${field}-text-unsafe`);
    }
  }
  if (variable.dataType === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${field}-number-invalid`);
    else validateNumericRange(value, validation, field, errors, false);
  }
  if (variable.dataType === "boolean" && typeof value !== "boolean") errors.push(`${field}-boolean-invalid`);
  if (variable.dataType === "color" && (typeof value !== "string" || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value))) errors.push(`${field}-color-invalid`);
  if (variable.dataType === "date" && !isStrictDate(value)) errors.push(`${field}-date-invalid`);
  if (variable.dataType === "datetime" && !isStrictDateTime(value)) errors.push(`${field}-datetime-invalid`);
  if (variable.dataType === "duration") {
    if (!Number.isInteger(value) || value < 0) errors.push(`${field}-duration-invalid`);
    else validateNumericRange(value, validation, field, errors, true);
  }
  if (variable.dataType === "enum" && (!variable.options.length || !variable.options.includes(value))) errors.push(`${field}-enum-invalid`);
  if (variable.dataType === "asset_ref") validateAssetRef(value, field, errors);
  if (variable.dataType === "contract_ref" && (typeof value !== "string" || !CONTRACT_PATHS.has(value) || hasDangerousPath(value))) errors.push(`${field}-contract-ref-invalid`);
  if (variable.dataType === "structured") {
    if (!isRecord(value)) errors.push(`${field}-structured-invalid`);
    else {
      if (!STRUCTURED_SCHEMAS.has(variable.schemaId)) errors.push(`${field}-structured-schema-unregistered`);
      if (measureDepth(value) > 6 || measureSize(value) > 200) errors.push(`${field}-structured-limit-exceeded`);
      if (containsDangerousKey(value) || containsSensitiveKey(value)) errors.push(`${field}-structured-unsafe`);
    }
  }
}

function validateAssetRef(value, field, errors) {
  if (!isRecord(value) || !isSafeId(value.assetId) || hasUnsafeAssetScheme(value.assetId)) {
    errors.push(`${field}-asset-ref-invalid`);
    return;
  }
  const allowed = new Set(["assetId", "version", "variantId"]);
  if (Object.keys(value).some((key) => !allowed.has(key) || DANGEROUS_KEYS.has(key))) errors.push(`${field}-asset-ref-field-forbidden`);
  if (value.version !== undefined && value.version !== null && !isSemanticVersion(value.version)) errors.push(`${field}-asset-version-invalid`);
  if (value.variantId !== undefined && value.variantId !== null && !isSafeId(value.variantId)) errors.push(`${field}-asset-variant-invalid`);
}

function validateNumericRange(value, validation, field, errors, integer) {
  if (validation.min !== null && validation.min !== undefined && value < validation.min) errors.push(`${field}-below-minimum`);
  if (validation.max !== null && validation.max !== undefined && value > validation.max) errors.push(`${field}-above-maximum`);
  if (!integer && Number.isInteger(validation.decimals) && validation.decimals >= 0) {
    const fraction = String(value).split(".")[1] || "";
    if (fraction.length > validation.decimals) errors.push(`${field}-decimals-exceeded`);
  }
}

function validateScope(variable, errors) {
  const field = SCOPE_FIELDS[variable.scope];
  if (field && !variable[field]) errors.push(`variable-scope-${field}-required`);
  if (variable.scope === "global" && IDENTITY_FIELDS.some((key) => variable[key])) errors.push("variable-global-scope-identities-forbidden");
}

function matchesContext(variable, context) {
  const scopeField = SCOPE_FIELDS[variable.scope];
  if (scopeField && (!context[scopeField] || variable[scopeField] !== context[scopeField])) return false;
  return IDENTITY_FIELDS.every((field) => !variable[field] || Boolean(context[field] && variable[field] === context[field]));
}

function compareResolutionCandidates(left, right) {
  return SCOPE_RANK[right.scope] - SCOPE_RANK[left.scope]
    || right.revision - left.revision
    || compareSemanticVersions(right.version, left.version)
    || left.variableId.localeCompare(right.variableId);
}

function normalizeRegistry(registry = {}, options = {}) {
  const raw = cloneSerializable(isRecord(registry) ? registry : {}, [], "registry") || {};
  const sourceVariables = isRecord(raw.variables) ? raw.variables : Array.isArray(registry) ? Object.fromEntries(registry.map((item) => [item.variableId, item])) : {};
  const variables = Object.fromEntries(Object.entries(sourceVariables).map(([id, item]) => {
    const variable = normalizeProductionVariable({ ...item, variableId: item?.variableId || id }, options);
    return [variable.variableId, variable];
  }).filter(([id]) => id));
  const createdAt = normalizeIsoDate(raw.createdAt || options.now) || new Date().toISOString();
  return {
    variablesVersion: PRODUCTION_VARIABLES_VERSION,
    revision: nonNegativeInteger(raw.revision, 0),
    tenantId: nullableId(raw.tenantId),
    variables,
    createdAt,
    updatedAt: normalizeIsoDate(raw.updatedAt) || createdAt
  };
}

function cloneRegistry(registry) {
  return cloneSerializable(registry, [], "registry.clone") || normalizeRegistry();
}

function touchRegistry(registry, options) {
  registry.revision += 1;
  registry.updatedAt = normalizeIsoDate(options.now) || new Date().toISOString();
}

function requireVariable(registry, variableId) {
  const id = normalizeId(variableId);
  const variable = id ? registry.variables[id] : null;
  if (!variable) throw variableError("variable-not-found", { variableId });
  return variable;
}

function assertExpectedRevision(target, expectedRevision, label) {
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw variableError(`${label}-expected-revision-required`);
  if (target.revision !== expectedRevision) throw variableError(`${label}-expected-revision-conflict`, { expected: expectedRevision, actual: target.revision });
}

function ensureWritable(variable, actorInput) {
  const actor = normalizeActor(actorInput);
  if (!actor?.role) throw variableError("variable-actor-required");
  if (actor.role === "supervisor") return;
  if (!variable.writableBy.includes(actor.role)) throw variableError("variable-write-not-authorized", { role: actor.role });
}

function ensureActorRole(actorInput, roles, code) {
  const actor = normalizeActor(actorInput);
  if (!actor?.role || !roles.includes(actor.role)) throw variableError(code, { role: actor?.role || null });
}

function sanitizeContext(context = {}, options = {}) {
  const raw = cloneSerializable(isRecord(context) ? context : {}, [], "context") || {};
  return {
    tenantId: nullableId(raw.tenantId), organizationId: nullableId(raw.organizationId), clientId: nullableId(raw.clientId),
    tournamentId: nullableId(raw.tournamentId), competitionId: nullableId(raw.competitionId), charreadaId: nullableId(raw.charreadaId),
    outputId: nullableId(raw.outputId), userId: nullableId(raw.userId), sessionId: nullableId(raw.sessionId),
    visibility: normalizeVisibility(options.visibility || raw.visibility), actor: normalizeActor(options.actor || raw.actor),
    contract: cloneSerializable(options.contract || raw.contract, [], "context.contract") || null,
    now: normalizeIsoDate(options.now || raw.now) || new Date().toISOString()
  };
}

function snapshotContext(context, visibility) {
  const publicView = visibility === "public";
  return {
    visibility,
    organizationId: publicView ? null : context.organizationId,
    clientId: publicView ? null : context.clientId,
    tournamentId: context.tournamentId,
    competitionId: context.competitionId,
    charreadaId: context.charreadaId,
    outputId: context.outputId,
    tenantId: publicView ? null : context.tenantId,
    userId: publicView ? null : context.userId,
    sessionId: publicView ? null : context.sessionId
  };
}

function getSafePath(value, path) {
  if (!isRecord(value) || !CONTRACT_PATHS.has(path) || hasDangerousPath(path)) return null;
  return path.split(".").reduce((current, key) => isRecord(current) && !DANGEROUS_KEYS.has(key) ? current[key] : undefined, value) ?? null;
}

function namespaceKey(variable) {
  return [variable.key, variable.scope, ...IDENTITY_FIELDS.map((field) => variable[field] || "")].join("|");
}

function normalizeVariableValue(value, dataType) {
  if (value === undefined || value === null) return null;
  if (dataType === "asset_ref" && isRecord(value)) return {
    assetId: nullableId(value.assetId),
    version: nullableString(value.version),
    variantId: nullableId(value.variantId),
    ...Object.fromEntries(Object.entries(value).filter(([key]) => !["assetId", "version", "variantId"].includes(key)))
  };
  return cloneSerializable(value, [], "variable.value");
}

function normalizeValidation(value) {
  const raw = isRecord(value) ? value : {};
  return {
    min: finiteNumberOrNull(raw.min),
    max: finiteNumberOrNull(raw.max),
    decimals: nonNegativeIntegerOrNull(raw.decimals),
    maxLength: positiveIntegerOrNull(raw.maxLength),
    allowEmpty: raw.allowEmpty !== false
  };
}

function normalizeOptions(value) {
  return uniqueStrings(Array.isArray(value) ? value : []).slice(0, MAX_OPTIONS);
}

function normalizeRoles(value) {
  return uniqueStrings(Array.isArray(value) ? value.map(normalizeRole) : []).filter(Boolean);
}

function normalizeActor(value) {
  if (!isRecord(value)) return null;
  const role = normalizeRole(value.role);
  const actor = {
    id: nullableId(value.id ?? value.userId),
    name: nullableString(value.name),
    role,
    source: nullableString(value.source)
  };
  return actor.id || actor.role ? actor : null;
}

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase().replaceAll("á", "a").replaceAll("ó", "o");
  const aliases = { admin: "supervisor", administrator: "supervisor", operator: "operador", graphics: "graficos", readonly: "lectura", read: "lectura" };
  return aliases[role] || role || null;
}

function isExpired(variable, now) {
  return variable.status === "expired" || Boolean(variable.expiresAt && Date.parse(variable.expiresAt) <= Date.parse(normalizeIsoDate(now) || new Date().toISOString()));
}

function assertValidVariable(variable, options) {
  const validation = validateProductionVariable(variable, options);
  if (!validation.valid) throw variableError("variable-invalid", { errors: validation.errors });
}

function variableError(code, details = {}) {
  return new BroadcastVariableError(code, details);
}

function validationResult(valid, errors, warnings) {
  return { valid, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), variablesVersion: PRODUCTION_VARIABLES_VERSION };
}

function cloneSerializable(value, warnings = [], path = "value", depth = 0, ancestors = new WeakSet()) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    warnings.push(`${path}:non-finite-number`);
    return undefined;
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
  if (typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) {
    warnings.push(`${path}:${depth > MAX_DEPTH ? "depth-exceeded" : "cycle-removed"}`);
    return undefined;
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = [];
    if (value.length > MAX_ARRAY_LENGTH) warnings.push(`${path}:array-truncated`);
    value.slice(0, MAX_ARRAY_LENGTH).forEach((item, index) => {
      const cloned = cloneSerializable(item, warnings, `${path}.${index}`, depth + 1, ancestors);
      if (cloned !== undefined) result.push(cloned);
    });
    ancestors.delete(value);
    return result;
  }
  const result = {};
  const entries = Object.entries(value);
  if (entries.length > MAX_OBJECT_KEYS) warnings.push(`${path}:object-truncated`);
  entries.slice(0, MAX_OBJECT_KEYS).forEach(([key, item]) => {
    if (DANGEROUS_KEYS.has(key)) return;
    const cloned = cloneSerializable(item, warnings, `${path}.${key}`, depth + 1, ancestors);
    if (cloned !== undefined) result[key] = cloned;
  });
  ancestors.delete(value);
  return result;
}

function containsDangerousKey(value, ancestors = new WeakSet()) {
  if (!value || typeof value !== "object" || ancestors.has(value)) return false;
  ancestors.add(value);
  return Object.entries(value).some(([key, item]) => DANGEROUS_KEYS.has(key) || containsDangerousKey(item, ancestors));
}

function containsSensitiveKey(value, ancestors = new WeakSet()) {
  if (!value || typeof value !== "object" || ancestors.has(value)) return false;
  ancestors.add(value);
  return Object.entries(value).some(([key, item]) => SECRET_KEY_PATTERN.test(key) || containsSensitiveKey(item, ancestors));
}

function containsExecutableText(value) {
  const text = String(value).trim();
  return /<\s*\/?\s*(script|iframe|object|embed|style|link|meta)\b/i.test(text)
    || /<[^>]+\son[a-z]+\s*=/i.test(text)
    || /javascript\s*:/i.test(text)
    || /data\s*:\s*text\/html/i.test(text);
}

function hasUnsafeAssetScheme(value) {
  return /^(?:https?|javascript|data|file):/i.test(String(value || "").trim());
}

function hasDangerousPath(path) {
  return String(path || "").split(".").some((part) => DANGEROUS_KEYS.has(part));
}

function isStrictDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isStrictDateTime(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) && !DANGEROUS_KEYS.has(value);
}

function isSafeVariableKey(value) {
  return typeof value === "string" && /^[a-z][a-z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/.test(value) && !hasDangerousPath(value);
}

function normalizeVariableKey(value) {
  return String(value || "").trim();
}

function buildVariableId(key, now, random) {
  const base = normalizeVariableKey(key).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "variable";
  const entropy = typeof random === "function" ? random() : Math.random();
  return `var_${base}_${Date.parse(now)}_${String(Math.floor(Math.abs(entropy) * 1e8)).padStart(8, "0")}`;
}

function normalizeVisibility(value) {
  return VARIABLE_VISIBILITIES.includes(value) ? value : "production";
}

function normalizeId(value) {
  const normalized = String(value ?? "").trim();
  return isSafeId(normalized) ? normalized : null;
}

function nullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function nullableString(value) {
  return value === null || value === undefined ? null : String(value);
}

function normalizeIsoDate(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function isIsoDate(value) {
  return typeof value === "string" && normalizeIsoDate(value) === value;
}

function isSemanticVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
}

function compareSemanticVersions(left, right) {
  const parse = (value) => String(value || "0.0.0").split("-")[0].split(".").map(Number);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0);
  return String(left).localeCompare(String(right));
}

function nonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function nonNegativeIntegerOrNull(value) {
  return value === null || value === undefined || value === "" ? null : Number.isInteger(value) && value >= 0 ? value : null;
}

function positiveIntegerOrNull(value) {
  return value === null || value === undefined || value === "" ? null : Number.isInteger(value) && value > 0 ? value : null;
}

function finiteNumberOrNull(value) {
  return value === null || value === undefined || value === "" ? null : typeof value === "number" && Number.isFinite(value) ? value : null;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function measureDepth(value, depth = 0, ancestors = new WeakSet()) {
  if (!value || typeof value !== "object" || ancestors.has(value)) return depth;
  ancestors.add(value);
  return Object.values(value).reduce((max, item) => Math.max(max, measureDepth(item, depth + 1, ancestors)), depth);
}

function measureSize(value, ancestors = new WeakSet()) {
  if (!value || typeof value !== "object" || ancestors.has(value)) return 1;
  ancestors.add(value);
  return 1 + Object.values(value).reduce((total, item) => total + measureSize(item, ancestors), 0);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
