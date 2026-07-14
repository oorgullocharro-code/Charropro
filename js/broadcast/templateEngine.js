import {
  COMPONENT_LIBRARY_VERSION,
  cloneComponentInstance,
  resolveComponentBindings,
  validateComponentInstance
} from "./componentLibrary.js?v=20260713-component-library-001-components-v1";

export const TEMPLATE_ENGINE_VERSION = "1.0.0";

export const TemplateTypes = Object.freeze([
  "lower_third", "scoreboard", "ranking", "timer", "full_screen", "sponsor", "qr",
  "interview", "roster", "standings", "ticker", "bug", "custom"
]);

export const TemplateStates = Object.freeze([
  "draft", "valid", "active", "published", "deprecated", "disabled", "archived", "error"
]);

export const TemplateVisibility = Object.freeze([
  "public", "production", "operational", "restricted"
]);

const LAYOUT_MODES = Object.freeze(["absolute", "stack", "row", "column", "grid", "overlay", "safe_area"]);
const ALIGNMENTS = Object.freeze(["start", "center", "end", "stretch"]);
const JUSTIFICATIONS = Object.freeze(["start", "center", "end", "space-between", "space-around", "space-evenly"]);
const ANCHORS = Object.freeze(["center", "top-left", "top-right", "bottom-left", "bottom-right"]);
const BINDING_SOURCES = Object.freeze(["production_variables", "broadcast_contract", "asset_manager"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const IMMUTABLE_FIELDS = new Set([
  "engineVersion", "templateId", "templateVersion", "revision", "tenantId", "organizationId",
  "tournamentId", "competitionId", "createdAt", "createdBy", "sourceTemplateId"
]);
const UPDATE_FIELDS = new Set([
  "templateType", "name", "description", "visibility", "status", "state", "components", "layout",
  "bindings", "defaults", "outputs", "metadata", "warnings", "errors"
]);
const PUBLISHED_MUTABLE_FIELDS = new Set(["status", "state"]);
const CUSTOM_EXECUTABLE_KEYS = new Set([
  "plugin", "plugins", "hook", "hooks", "script", "scripts", "handler", "handlers",
  "renderer", "html", "javascript"
]);
const ALWAYS_PRIVATE_KEYS = new Set([
  "apikey", "password", "token", "secret", "credentials", "signedurl"
]);
const ALWAYS_PRIVATE_KEY_PATTERN = /(authorization|cookie|credential|password|privatekey|secret|signedurl|token|apikey)/;
const EXECUTABLE_SNAPSHOT_KEYS = new Set([
  "plugin", "plugins", "hook", "hooks", "script", "scripts", "handler", "handlers", "renderer"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "createdby", "updatedby", "tenantid", "organizationid", "clientid", "sessionid", "actor",
  "actorid", "actorname", "operatorid", "operatorname", "deviceid", "userid", "judgeid", "judgename",
  "preparedby", "takenby", "selectedby", "queuedby", "pausedby", "diagnostics", "permissions", "storageref"
]);
const PRODUCTION_PRIVATE_KEYS = new Set([
  "createdby", "updatedby", "tenantid", "clientid", "sessionid", "actor", "actorid", "actorname",
  "operatorid", "operatorname", "deviceid", "userid", "judgeid", "judgename", "preparedby", "takenby",
  "selectedby", "queuedby", "pausedby"
]);
const MAX_DEPTH = 14;
const MAX_ARRAY_ITEMS = 250;
const MAX_OBJECT_KEYS = 500;
const MAX_COMPONENTS = 100;
const MAX_BINDINGS = 100;
const MAX_OUTPUTS = 50;
const MAX_TEXT_LENGTH = 10000;
const UNSAFE_TEXT = /<\s*(?:script|iframe|object|embed)\b|\bon(?:error|load|click)\s*=|^\s*(?:javascript|file|data|vbscript):/i;

export class BroadcastTemplateError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastTemplateError";
    this.code = code;
    this.details = cloneSafe(details, [], "error.details") || {};
  }
}

export function createBroadcastTemplate(input = {}, options = {}) {
  if (!isRecord(input)) throw templateError("template-not-object");
  assertFiniteTemplateLayout(input.layout);
  const now = normalizeNow(options.now);
  const warnings = [];
  const raw = cloneSafe(input, warnings, "template") || {};
  const templateType = TemplateTypes.includes(raw.templateType) ? raw.templateType : raw.templateType || "custom";
  const template = normalizeBroadcastTemplate({
    ...raw,
    templateId: normalizeId(raw.templateId) || buildId("tpl", templateType, now, options.random),
    templateVersion: raw.templateVersion ?? "1.0.0",
    revision: raw.revision ?? 0,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    createdBy: hasOwn(raw, "createdBy") ? raw.createdBy : options.actor,
    updatedBy: hasOwn(raw, "updatedBy") ? raw.updatedBy : options.actor,
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...warnings])
  }, { ...options, now });
  assertValidTemplate(template, options);
  return cloneBroadcastTemplate(template);
}

export function cloneBroadcastTemplate(template) {
  if (!isRecord(template)) return {};
  return {
    ...cloneSafe(template, [], "template.clone"),
    components: (Array.isArray(template.components) ? template.components : []).map(cloneComponentInstance)
  };
}

export function updateBroadcastTemplate(registry, templateId, patch = {}, options = {}) {
  if (!isRecord(patch)) throw templateError("template-patch-not-object");
  assertFiniteTemplateLayout(patch.layout);
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTemplate(base, templateId);
  assertTemplateRevision(current, options.expectedRevision);
  const patchKeys = Object.keys(patch);
  if (current.status === "published") {
    const nextStatus = patch.status ?? patch.state;
    if (patchKeys.some((key) => !PUBLISHED_MUTABLE_FIELDS.has(key)) || nextStatus !== "deprecated") {
      throw templateError("template-published-immutable", { templateId: current.templateId });
    }
  }
  patchKeys.forEach((key) => {
    if (IMMUTABLE_FIELDS.has(key)) throw templateError(`template-patch-field-forbidden:${key}`);
    if (!UPDATE_FIELDS.has(key) || DANGEROUS_KEYS.has(key)) throw templateError(`template-patch-field-not-allowed:${key}`);
  });
  const now = normalizeNow(options.now);
  const warnings = [];
  const safePatch = cloneSafe(patch, warnings, "template.patch") || {};
  if (hasOwn(safePatch, "state") && !hasOwn(safePatch, "status")) safePatch.status = safePatch.state;
  const candidate = normalizeBroadcastTemplate({
    ...current,
    ...safePatch,
    engineVersion: current.engineVersion,
    templateId: current.templateId,
    templateVersion: current.templateVersion,
    tenantId: current.tenantId,
    organizationId: current.organizationId,
    tournamentId: current.tournamentId,
    competitionId: current.competitionId,
    createdBy: current.createdBy,
    updatedBy: normalizeActor(options.actor) || current.updatedBy,
    sourceTemplateId: current.sourceTemplateId,
    revision: current.revision + 1,
    createdAt: current.createdAt,
    updatedAt: now,
    warnings: uniqueStrings([...(safePatch.warnings || []), ...warnings])
  }, { ...options, now });
  assertValidTemplate(candidate, options);
  const next = cloneRegistry(base);
  next.templates[current.templateId] = candidate;
  touchRegistry(next, now);
  return next;
}

export function validateBroadcastTemplate(input, options = {}) {
  if (!isRecord(input)) return validationResult(false, ["template-not-object"], []);
  const template = normalizeBroadcastTemplate(input, options);
  const errors = collectTemplateLayoutErrors(input.layout);
  const warnings = [...template.warnings];
  if (template.engineVersion !== TEMPLATE_ENGINE_VERSION) errors.push("template-engine-version-invalid");
  if (!isSafeId(template.templateId)) errors.push("template-id-invalid");
  if (!isSemanticVersion(template.templateVersion)) errors.push("template-version-invalid");
  if (!TemplateTypes.includes(template.templateType)) errors.push("template-type-invalid");
  if (!template.name) errors.push("template-name-required");
  if (!TemplateVisibility.includes(template.visibility)) errors.push("template-visibility-invalid");
  if (!TemplateStates.includes(template.status) || template.state !== template.status) errors.push("template-status-invalid");
  ["tenantId", "organizationId", "tournamentId", "competitionId", "sourceTemplateId"].forEach((field) => {
    if (template[field] !== null && !isSafeId(template[field])) errors.push(`template-${field}-invalid`);
  });
  if (template.createdBy !== null && !isValidActor(template.createdBy)) errors.push("template-created-by-invalid");
  if (template.updatedBy !== null && !isValidActor(template.updatedBy)) errors.push("template-updated-by-invalid");
  if (!Number.isInteger(template.revision) || template.revision < 0) errors.push("template-revision-invalid");
  if (!isIso(template.createdAt) || !isIso(template.updatedAt)) errors.push("template-timestamp-invalid");
  if (!Array.isArray(template.components)) errors.push("template-components-invalid");
  if (template.components.length === 0) errors.push(template.templateType === "custom" ? "custom-template-empty" : "template-components-required");
  if (template.components.length > MAX_COMPONENTS) errors.push("template-components-limit-exceeded");
  const instanceIds = new Set();
  template.components.forEach((component, index) => {
    const validation = validateComponentInstance(component, options);
    if (!validation.valid) errors.push(...validation.errors.map((value) => `template-component-${index}:${value}`));
    if (instanceIds.has(component.instanceId)) errors.push(`template-component-${index}:instance-id-duplicate`);
    instanceIds.add(component.instanceId);
    if (VISIBILITY_RANK[component.visibility] > VISIBILITY_RANK[template.visibility]) {
      errors.push(`template-component-${index}:visibility-incompatible`);
    }
    if (component.componentType === "custom") warnings.push(`template-component-${index}:custom-not-renderable`);
    if (!isTenantCompatible(template.tenantId, componentTenantId(component), options.authorizedTenantIds)) {
      errors.push(`template-component-${index}:tenant-mismatch`);
    }
    scanUnsafe(component, `template.components.${index}`, warnings);
  });
  const componentTenantIds = [...new Set(template.components.map(componentTenantId).filter(Boolean))];
  if (!template.tenantId && componentTenantIds.length > 1) errors.push("template-component-tenants-mixed");
  validateTemplateLayout(template.layout, errors);
  template.bindings.forEach((binding, index) => validateTemplateBinding(binding, index, errors));
  validateOutputs(template.outputs, errors);
  scanUnsafe(template.defaults, "template.defaults", warnings);
  scanUnsafe(template.metadata, "template.metadata", warnings);
  if (template.templateType === "custom") {
    if (containsCustomExecutableMetadata(template.metadata)) errors.push("custom-template-executable-metadata-forbidden");
    warnings.push("template-custom-structure-only");
  }
  if (!["valid", "active", "published"].includes(template.status)) warnings.push(`template-status-${template.status}`);
  if (warnings.some(isBlockingSecurityWarning)) errors.push("template-unsafe-content");
  return validationResult(errors.length === 0, uniqueStrings(errors), uniqueStrings(warnings));
}

export function registerBroadcastTemplate(registry = {}, templateInput, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRevision);
  const template = createBroadcastTemplate(templateInput, options);
  if (base.templates[template.templateId]) throw templateError("template-id-duplicate", { templateId: template.templateId });
  const next = cloneRegistry(base);
  next.templates[template.templateId] = template;
  touchRegistry(next, normalizeNow(options.now));
  return next;
}

export function removeBroadcastTemplate(registry, templateId, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTemplate(base, templateId);
  assertTemplateRevision(current, options.expectedRevision);
  if (!["draft", "disabled", "deprecated", "archived"].includes(current.status) && options.force !== true) {
    throw templateError("template-remove-active-forbidden");
  }
  const next = cloneRegistry(base);
  delete next.templates[current.templateId];
  touchRegistry(next, normalizeNow(options.now));
  return next;
}

export function duplicateBroadcastTemplate(registry, templateId, overrides = {}, options = {}) {
  if (!isRecord(overrides)) throw templateError("template-duplicate-overrides-invalid");
  const actor = normalizeActor(options.actor);
  if (!actor) throw templateError("template-duplicate-actor-required");
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const source = requireTemplate(base, templateId);
  assertTemplateRevision(source, options.expectedRevision);
  const now = normalizeNow(options.now);
  const duplicateId = normalizeId(overrides.templateId) || buildId("tpl", source.templateType, now, options.random);
  if (base.templates[duplicateId]) throw templateError("template-id-duplicate", { templateId: duplicateId });
  const safeOverrides = cloneSafe(overrides, [], "template.duplicate") || {};
  const duplicateMetadata = sanitizeSnapshotValue({
    ...source.metadata,
    ...(isRecord(safeOverrides.metadata) ? safeOverrides.metadata : {}),
    duplicatedFromTemplateId: source.templateId
  }, "public");
  const duplicate = createBroadcastTemplate({
    ...source,
    ...safeOverrides,
    templateId: duplicateId,
    name: overrides.name || `${source.name} copia`,
    tenantId: source.tenantId,
    organizationId: source.organizationId,
    tournamentId: source.tournamentId,
    competitionId: source.competitionId,
    sourceTemplateId: source.templateId,
    revision: 0,
    status: "draft",
    state: "draft",
    components: sanitizeSnapshotValue(source.components, "restricted"),
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    updatedBy: null,
    warnings: [],
    errors: [],
    metadata: duplicateMetadata
  }, { ...options, now });
  const next = cloneRegistry(base);
  next.templates[duplicate.templateId] = duplicate;
  touchRegistry(next, now);
  return next;
}

export function instantiateBroadcastTemplate(templateInput, sources = {}, options = {}) {
  const prepared = instantiateTemplateInternal(templateInput, sources, options);
  const snapshot = snapshotFromResult(prepared, options);
  return cloneTemplateResult({ ...prepared, snapshot });
}

export function buildTemplateSnapshot(templateOrResult, sources = {}, options = {}) {
  const prepared = isRecord(templateOrResult?.templateInstance)
    ? cloneTemplateResult(templateOrResult)
    : instantiateTemplateInternal(templateOrResult, sources, options);
  return snapshotFromResult(prepared, options);
}

export function validateTemplateSnapshot(snapshot) {
  if (!isRecord(snapshot)) return validationResult(false, ["template-snapshot-not-object"], []);
  const errors = [];
  if (snapshot.snapshotVersion !== TEMPLATE_ENGINE_VERSION) errors.push("template-snapshot-version-invalid");
  if (!isIso(snapshot.generatedAt)) errors.push("template-snapshot-timestamp-invalid");
  if (!TemplateVisibility.includes(snapshot.visibility)) errors.push("template-snapshot-visibility-invalid");
  if (!isRecord(snapshot.template)) errors.push("template-snapshot-template-invalid");
  if (!isRecord(snapshot.templateInstance)) errors.push("template-snapshot-instance-invalid");
  if (!Array.isArray(snapshot.components)) errors.push("template-snapshot-components-invalid");
  if (!isRecord(snapshot.resolvedBindings) || !isRecord(snapshot.componentBindings)) errors.push("template-snapshot-bindings-invalid");
  if (!Array.isArray(snapshot.warnings) || !Array.isArray(snapshot.errors)) errors.push("template-snapshot-diagnostics-invalid");
  if (containsRuntimeReference(snapshot)) errors.push("template-snapshot-runtime-reference-forbidden");
  scanUnsafe(snapshot, "template.snapshot", errors);
  return validationResult(errors.length === 0, uniqueStrings(errors), []);
}

export function resolveTemplateBindings(templateInput, sources = {}, options = {}) {
  const template = normalizeBroadcastTemplate(templateInput, options);
  const validation = validateBroadcastTemplate(template, options);
  if (!validation.valid) return { resolvedBindings: {}, componentBindings: {}, warnings: validation.warnings, errors: validation.errors };
  const tenantErrors = getBindingTenantErrors(template, sources, options);
  if (tenantErrors.length) return { resolvedBindings: {}, componentBindings: {}, warnings: validation.warnings, errors: tenantErrors };
  const visibility = normalizeVisibility(options.visibility || template.visibility);
  const templateResolution = resolveComponentBindings({ bindings: template.bindings, visibility: template.visibility }, sources, { ...options, visibility });
  const componentBindings = {};
  const warnings = [...validation.warnings, ...templateResolution.warnings];
  const errors = [...templateResolution.errors];
  template.components.forEach((component) => {
    const resolution = resolveComponentBindings(component, sources, { ...options, visibility });
    componentBindings[component.instanceId] = {
      values: cloneSafe(resolution.values, [], `bindings.${component.instanceId}`) || {},
      warnings: uniqueStrings(resolution.warnings),
      errors: uniqueStrings(resolution.errors)
    };
    warnings.push(...resolution.warnings);
    errors.push(...resolution.errors);
  });
  return {
    resolvedBindings: cloneSafe(templateResolution.values, [], "bindings.template") || {},
    componentBindings,
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors)
  };
}

export function listRegisteredTemplates(registry, filter = {}) {
  const base = normalizeRegistry(registry);
  return Object.values(base.templates)
    .filter((template) => !filter.templateType || template.templateType === filter.templateType)
    .filter((template) => !(filter.status || filter.state) || template.status === (filter.status || filter.state))
    .filter((template) => !filter.tenantId || template.tenantId === filter.tenantId)
    .filter((template) => !filter.visibility || template.visibility === filter.visibility)
    .filter((template) => !filter.output || template.outputs.includes(filter.output))
    .sort((left, right) => left.name.localeCompare(right.name) || left.templateId.localeCompare(right.templateId))
    .map(cloneBroadcastTemplate);
}

export function getRegisteredTemplate(registry, templateId) {
  const template = normalizeRegistry(registry).templates[normalizeId(templateId)];
  return template ? cloneBroadcastTemplate(template) : null;
}

export function clearTemplateRegistry(registry = {}, options = {}) {
  const base = normalizeRegistry(registry, options);
  const now = normalizeNow(options.now);
  return {
    engineVersion: TEMPLATE_ENGINE_VERSION,
    revision: options.resetRevision === true ? 0 : base.revision + 1,
    templates: {},
    createdAt: options.resetRevision === true ? now : base.createdAt,
    updatedAt: now
  };
}

export function cloneTemplateResult(result) {
  if (!isRecord(result)) return {};
  return cloneSafe(result, [], "template.result") || {};
}

function normalizeBroadcastTemplate(input = {}, options = {}) {
  const warnings = [];
  const raw = cloneSafe(isRecord(input) ? input : {}, warnings, "template.normalize") || {};
  const now = normalizeNow(options.now);
  const createdAt = normalizeIso(raw.createdAt) || now;
  const updatedAt = normalizeIso(raw.updatedAt) || createdAt;
  const status = normalizeTemplateStatus(raw.status ?? raw.state);
  return {
    engineVersion: TEMPLATE_ENGINE_VERSION,
    templateId: normalizeId(raw.templateId),
    templateVersion: raw.templateVersion === undefined ? "1.0.0" : String(raw.templateVersion),
    templateType: raw.templateType || "custom",
    name: nullableText(raw.name),
    description: nullableText(raw.description),
    visibility: normalizeVisibility(raw.visibility),
    status,
    state: status,
    tenantId: nullableId(hasOwn(raw, "tenantId") ? raw.tenantId : options.tenantId),
    organizationId: nullableId(hasOwn(raw, "organizationId") ? raw.organizationId : options.organizationId),
    tournamentId: nullableId(hasOwn(raw, "tournamentId") ? raw.tournamentId : options.tournamentId),
    competitionId: nullableId(hasOwn(raw, "competitionId") ? raw.competitionId : options.competitionId),
    sourceTemplateId: nullableId(raw.sourceTemplateId),
    createdBy: normalizeActor(raw.createdBy),
    updatedBy: normalizeActor(raw.updatedBy),
    revision: raw.revision ?? 0,
    components: normalizeComponents(raw.components, warnings),
    layout: normalizeTemplateLayout(raw.layout, warnings),
    bindings: normalizeTemplateBindings(raw.bindings, warnings),
    defaults: cloneSafe(isRecord(raw.defaults) ? raw.defaults : {}, warnings, "template.defaults") || {},
    outputs: normalizeOutputs(raw.outputs, warnings),
    metadata: cloneSafe(isRecord(raw.metadata) ? raw.metadata : {}, warnings, "template.metadata") || {},
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...warnings]),
    errors: uniqueStrings(raw.errors),
    createdAt,
    updatedAt
  };
}

function normalizeComponents(value, warnings) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_COMPONENTS) warnings.push("template.components:array-truncated");
  return value.slice(0, MAX_COMPONENTS).map((component, index) => {
    scanUnsafe(component, `template.components.${index}`, warnings);
    return cloneComponentInstance(component);
  });
}

function normalizeTemplateBindings(value, warnings) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_BINDINGS) warnings.push("template.bindings:array-truncated");
  return value.slice(0, MAX_BINDINGS).map((binding, index) => {
    const raw = cloneSafe(isRecord(binding) ? binding : {}, warnings, `template.bindings.${index}`) || {};
    return {
      bindingId: normalizeId(raw.bindingId) || `template_binding_${index + 1}`,
      target: normalizePath(raw.target),
      source: raw.source || null,
      key: nullableText(raw.key),
      path: nullableText(raw.path),
      assetRef: normalizeAssetRef(raw.assetRef),
      fallback: hasOwn(raw, "fallback") ? cloneSafe(raw.fallback, warnings, `template.bindings.${index}.fallback`) : undefined,
      required: raw.required === true,
      visibility: normalizeVisibility(raw.visibility)
    };
  });
}

function normalizeTemplateLayout(value, warnings) {
  const raw = cloneSafe(isRecord(value) ? value : {}, warnings, "template.layout") || {};
  return {
    mode: LAYOUT_MODES.includes(raw.mode) ? raw.mode : "absolute",
    safeArea: normalizeBox(raw.safeArea),
    anchor: ANCHORS.includes(raw.anchor) ? raw.anchor : "center",
    zIndex: raw.zIndex ?? 0,
    gap: raw.gap ?? 0,
    padding: normalizeBox(raw.padding),
    margin: normalizeBox(raw.margin),
    align: ALIGNMENTS.includes(raw.align) ? raw.align : "stretch",
    justify: JUSTIFICATIONS.includes(raw.justify) ? raw.justify : "start",
    clip: raw.clip === true,
    columns: raw.columns ?? null,
    rows: raw.rows ?? null,
    x: raw.x ?? null,
    y: raw.y ?? null,
    width: raw.width ?? null,
    height: raw.height ?? null
  };
}

function normalizeOutputs(value, warnings) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_OUTPUTS) warnings.push("template.outputs:array-truncated");
  return uniqueStrings(value.slice(0, MAX_OUTPUTS).map(normalizeId).filter(Boolean));
}

function validateTemplateLayout(layout, errors) {
  if (!isRecord(layout) || !LAYOUT_MODES.includes(layout.mode)) errors.push("template-layout-mode-invalid");
  if (!ANCHORS.includes(layout.anchor)) errors.push("template-layout-anchor-invalid");
  if (!ALIGNMENTS.includes(layout.align)) errors.push("template-layout-align-invalid");
  if (!JUSTIFICATIONS.includes(layout.justify)) errors.push("template-layout-justify-invalid");
  if (!Number.isInteger(layout.zIndex) || layout.zIndex < -1000 || layout.zIndex > 1000) errors.push("template-layout-z-index-invalid");
  if (!Number.isFinite(layout.gap) || layout.gap < 0) errors.push("template-layout-gap-invalid");
  ["safeArea", "padding", "margin"].forEach((field) => {
    if (!isRecord(layout[field]) || Object.values(layout[field]).some((item) => !Number.isFinite(item) || item < 0)) errors.push(`template-layout-${field}-invalid`);
  });
  ["x", "y", "width", "height"].forEach((field) => {
    if (layout[field] !== null && !Number.isFinite(layout[field])) errors.push("template-layout-non-finite");
  });
  ["columns", "rows"].forEach((field) => {
    if (layout[field] !== null && (!Number.isInteger(layout[field]) || layout[field] <= 0)) errors.push(`template-layout-${field}-invalid`);
  });
  if (layout.mode === "grid" && layout.columns === null && layout.rows === null) errors.push("template-layout-grid-dimensions-required");
}

function validateTemplateBinding(binding, index, errors) {
  const prefix = `template-binding-${index}`;
  if (!isRecord(binding)) {
    errors.push(`${prefix}-invalid`);
    return;
  }
  if (!isSafeId(binding.bindingId)) errors.push(`${prefix}-id-invalid`);
  if (!isSafePath(binding.target)) errors.push(`${prefix}-target-invalid`);
  if (!BINDING_SOURCES.includes(binding.source)) errors.push(`${prefix}-source-invalid`);
  if (!TemplateVisibility.includes(binding.visibility)) errors.push(`${prefix}-visibility-invalid`);
  if (binding.source === "production_variables" && !isSafeVariableKey(binding.key)) errors.push(`${prefix}-variable-key-invalid`);
  if (binding.source === "broadcast_contract" && !isSafePath(binding.path)) errors.push(`${prefix}-contract-path-invalid`);
  if (binding.source === "asset_manager" && !isValidAssetRef(binding.assetRef)) errors.push(`${prefix}-asset-ref-invalid`);
  if (binding.source !== "asset_manager" && binding.assetRef) errors.push(`${prefix}-asset-ref-source-invalid`);
}

function validateOutputs(outputs, errors) {
  if (!Array.isArray(outputs)) {
    errors.push("template-outputs-invalid");
    return;
  }
  if (outputs.some((output) => !isSafeId(output))) errors.push("template-output-id-invalid");
  if (new Set(outputs).size !== outputs.length) errors.push("template-output-duplicate");
}

function instantiateTemplateInternal(templateInput, sources, options) {
  const template = normalizeBroadcastTemplate(templateInput, options);
  assertValidTemplate(template, options);
  assertTemplateTenantContext(template, sources, options);
  const validation = validateBroadcastTemplate(template, options);
  if (["disabled", "archived", "error"].includes(template.status) && options.allowInactive !== true) {
    throw templateError("template-state-not-instantiable", { status: template.status });
  }
  const now = normalizeNow(options.now);
  const visibility = normalizeVisibility(options.visibility || template.visibility);
  const resolution = resolveTemplateBindings(template, sources, { ...options, visibility });
  if (resolution.errors.some((error) => error.includes("tenant"))) {
    throw templateError("template-binding-tenant-mismatch", { errors: resolution.errors });
  }
  const components = template.components.map(cloneComponentInstance);
  const warnings = uniqueStrings([
    ...validation.warnings,
    ...resolution.warnings,
    ...(template.templateType === "custom" ? ["template-custom-structure-only"] : [])
  ]);
  const errors = uniqueStrings(resolution.errors);
  const templateInstance = {
    templateInstanceVersion: TEMPLATE_ENGINE_VERSION,
    templateInstanceId: normalizeId(options.templateInstanceId) || buildId("tpi", template.templateType, now, options.random),
    templateId: template.templateId,
    templateVersion: template.templateVersion,
    templateRevision: template.revision,
    templateType: template.templateType,
    name: template.name,
    status: template.status,
    visibility,
    state: "instantiated",
    tenantId: template.tenantId,
    organizationId: template.organizationId,
    tournamentId: template.tournamentId,
    competitionId: template.competitionId,
    createdBy: template.createdBy,
    updatedBy: template.updatedBy,
    layout: cloneSafe(template.layout, [], "template.instance.layout") || {},
    defaults: cloneSafe(template.defaults, [], "template.instance.defaults") || {},
    outputs: [...template.outputs],
    componentInstanceIds: components.map((component) => component.instanceId),
    createdAt: now
  };
  return {
    templateInstance,
    components,
    resolvedBindings: resolution.resolvedBindings,
    componentBindings: resolution.componentBindings,
    warnings,
    errors,
    snapshot: null
  };
}

function snapshotFromResult(result, options) {
  const visibility = normalizeVisibility(options.visibility || result.templateInstance.visibility);
  const rank = VISIBILITY_RANK[visibility];
  const components = (result.components || [])
    .filter((component) => VISIBILITY_RANK[component.visibility] <= rank)
    .map((component) => ({
      instance: cloneComponentInstance(component),
      resolvedBindings: cloneSafe(result.componentBindings?.[component.instanceId]?.values || {}, [], "snapshot.component.bindings") || {},
      warnings: uniqueStrings(result.componentBindings?.[component.instanceId]?.warnings),
      errors: uniqueStrings(result.componentBindings?.[component.instanceId]?.errors)
    }));
  const snapshot = {
    snapshotVersion: TEMPLATE_ENGINE_VERSION,
    generatedAt: normalizeNow(options.now),
    visibility,
    template: {
      templateId: result.templateInstance.templateId,
      templateVersion: result.templateInstance.templateVersion,
      templateRevision: result.templateInstance.templateRevision,
      templateType: result.templateInstance.templateType,
      name: result.templateInstance.name,
      status: result.templateInstance.status,
      tenantId: result.templateInstance.tenantId,
      organizationId: result.templateInstance.organizationId,
      tournamentId: result.templateInstance.tournamentId,
      competitionId: result.templateInstance.competitionId,
      createdBy: result.templateInstance.createdBy,
      updatedBy: result.templateInstance.updatedBy,
      layout: cloneSafe(result.templateInstance.layout, [], "snapshot.layout") || {},
      outputs: [...(result.templateInstance.outputs || [])]
    },
    templateInstance: cloneSafe(result.templateInstance, [], "snapshot.instance") || {},
    components,
    resolvedBindings: cloneSafe(result.resolvedBindings, [], "snapshot.bindings") || {},
    componentBindings: Object.fromEntries(components.map((component) => [
      component.instance.instanceId,
      cloneSafe(result.componentBindings?.[component.instance.instanceId] || {}, [], "snapshot.componentBindings") || {}
    ])),
    warnings: uniqueStrings([
      ...(result.warnings || []),
      ...((result.components || []).length !== components.length ? ["template-snapshot-component-visibility-filtered"] : [])
    ]),
    errors: uniqueStrings(result.errors)
  };
  return sanitizeSnapshotValue(snapshot, visibility);
}

function normalizeRegistry(registry = {}, options = {}) {
  const now = normalizeNow(options.now);
  const source = isRecord(registry) ? registry : {};
  const templates = {};
  const sourceTemplates = isRecord(source.templates) ? source.templates : {};
  Object.entries(sourceTemplates).forEach(([id, template]) => {
    const normalized = normalizeBroadcastTemplate(template, options);
    if (normalized.templateId && normalized.templateId === id) templates[id] = normalized;
  });
  return {
    engineVersion: TEMPLATE_ENGINE_VERSION,
    revision: nonNegativeInteger(source.revision, 0),
    templates,
    createdAt: normalizeIso(source.createdAt) || now,
    updatedAt: normalizeIso(source.updatedAt) || normalizeIso(source.createdAt) || now
  };
}

function cloneRegistry(registry) {
  return {
    ...registry,
    templates: Object.fromEntries(Object.entries(registry.templates).map(([id, template]) => [id, cloneBroadcastTemplate(template)]))
  };
}

function touchRegistry(registry, now) {
  registry.revision += 1;
  registry.updatedAt = now;
}

function requireTemplate(registry, templateId) {
  const template = registry.templates[normalizeId(templateId)];
  if (!template) throw templateError("template-not-found", { templateId });
  return template;
}

function assertRegistryRevision(registry, expectedRevision) {
  if (expectedRevision === undefined || expectedRevision === null) return;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== registry.revision) throw templateError("template-registry-revision-conflict");
}

function assertTemplateRevision(template, expectedRevision) {
  if (!Number.isInteger(expectedRevision)) throw templateError("template-expected-revision-required");
  if (expectedRevision !== template.revision) throw templateError("template-revision-conflict");
}

function assertValidTemplate(template, options) {
  const validation = validateBroadcastTemplate(template, options);
  if (validation.valid) return;
  if (validation.errors.includes("custom-template-empty")) throw templateError("custom-template-empty", { errors: validation.errors });
  if (validation.errors.includes("custom-template-executable-metadata-forbidden")) {
    throw templateError("custom-template-executable-metadata-forbidden", { errors: validation.errors });
  }
  if (validation.errors.includes("template-layout-non-finite")) throw templateError("template-layout-non-finite", { errors: validation.errors });
  throw templateError("template-invalid", { errors: validation.errors, warnings: validation.warnings });
}

function assertFiniteTemplateLayout(layout) {
  if (collectTemplateLayoutErrors(layout).includes("template-layout-non-finite")) {
    throw templateError("template-layout-non-finite");
  }
}

function collectTemplateLayoutErrors(layout) {
  if (!isRecord(layout)) return [];
  const errors = [];
  const numericFields = ["zIndex", "gap", "rows", "columns", "x", "y", "width", "height"];
  numericFields.forEach((field) => {
    if (hasOwn(layout, field) && typeof layout[field] === "number" && !Number.isFinite(layout[field])) {
      errors.push("template-layout-non-finite");
    }
  });
  ["safeArea", "padding", "margin"].forEach((field) => {
    const value = layout[field];
    if (typeof value === "number" && !Number.isFinite(value)) errors.push("template-layout-non-finite");
    if (isRecord(value)) {
      ["top", "right", "bottom", "left"].forEach((side) => {
        if (hasOwn(value, side) && typeof value[side] === "number" && !Number.isFinite(value[side])) {
          errors.push("template-layout-non-finite");
        }
      });
    }
  });
  return uniqueStrings(errors);
}

function componentTenantId(component) {
  return nullableId(component?.tenantId ?? component?.metadata?.tenantId);
}

function isTenantCompatible(templateTenantId, candidateTenantId, authorizedTenantIds = []) {
  const templateTenant = nullableId(templateTenantId);
  const candidateTenant = nullableId(candidateTenantId);
  if (!candidateTenant) return true;
  if (candidateTenant === templateTenant) return true;
  if (templateTenant) return false;
  return new Set((Array.isArray(authorizedTenantIds) ? authorizedTenantIds : []).map(nullableId).filter(Boolean)).has(candidateTenant);
}

function assertTemplateTenantContext(template, sources, options) {
  const contextTenantIds = [
    hasOwn(options, "tenantId") ? options.tenantId : null,
    sources?.tenantId,
    sources?.context?.tenantId,
    sources?.productionVariables?.tenantId,
    sources?.productionVariables?.context?.tenantId,
    sources?.broadcastContract?.tenantId,
    sources?.broadcastContract?.context?.tenantId,
    sources?.assetManager?.tenantId
  ].map(nullableId).filter(Boolean);
  if (template.tenantId && contextTenantIds.some((tenantId) => !isTenantCompatible(template.tenantId, tenantId, options.authorizedTenantIds))) {
    throw templateError("template-tenant-context-mismatch", { templateId: template.templateId });
  }
}

function getBindingTenantErrors(template, sources, options) {
  const errors = [];
  const bindings = [
    ...(template.bindings || []),
    ...(template.components || []).flatMap((component) => component.bindings || [])
  ];
  const rootTenants = [
    sources?.productionVariables?.tenantId,
    sources?.productionVariables?.context?.tenantId,
    sources?.broadcastContract?.tenantId,
    sources?.broadcastContract?.context?.tenantId,
    sources?.assetManager?.tenantId
  ].map(nullableId).filter(Boolean);
  const uniqueRootTenants = [...new Set(rootTenants)];
  const effectiveTenantId = template.tenantId
    || nullableId(options.tenantId)
    || (uniqueRootTenants.length === 1 ? uniqueRootTenants[0] : null);
  if (uniqueRootTenants.length > 1) errors.push("template-binding-tenants-mixed");
  if (rootTenants.some((tenantId) => !isTenantCompatible(effectiveTenantId, tenantId, options.authorizedTenantIds))) {
    errors.push("template-binding-tenant-mismatch");
  }
  bindings.forEach((binding) => {
    const fallbackTenantId = nullableId(binding?.fallback?.tenantId);
    if (fallbackTenantId && !isTenantCompatible(effectiveTenantId, fallbackTenantId, options.authorizedTenantIds)) {
      errors.push(`template-binding-tenant-mismatch:${binding.bindingId}`);
    }
    if (binding?.source !== "asset_manager" || !binding.assetRef?.assetId) return;
    const asset = findSourceAsset(sources?.assetManager || sources?.assets, binding.assetRef.assetId);
    const assetTenantId = nullableId(asset?.tenantId);
    if (assetTenantId && !isTenantCompatible(effectiveTenantId, assetTenantId, options.authorizedTenantIds)) {
      errors.push(`template-binding-tenant-mismatch:${binding.bindingId}`);
    }
  });
  return uniqueStrings(errors);
}

function findSourceAsset(registry, assetId) {
  if (!registry) return null;
  if (Array.isArray(registry)) return registry.find((asset) => asset?.assetId === assetId) || null;
  if (isRecord(registry.assets)) {
    if (registry.assets[assetId]) return registry.assets[assetId];
    return Object.values(registry.assets).find((asset) => asset?.assetId === assetId) || null;
  }
  return registry[assetId] || null;
}

function containsCustomExecutableMetadata(value, depth = 0, ancestors = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (depth > MAX_DEPTH || ancestors.has(value)) return true;
  ancestors.add(value);
  const found = Object.entries(Object.getOwnPropertyDescriptors(value)).some(([key, descriptor]) => {
    const normalizedKey = normalizeSensitiveKey(key);
    if (isCustomExecutableKey(normalizedKey) || !Object.hasOwn(descriptor, "value")) return true;
    return containsCustomExecutableMetadata(descriptor.value, depth + 1, ancestors);
  });
  ancestors.delete(value);
  return found;
}

function sanitizeSnapshotValue(value, visibility, depth = 0, ancestors = new WeakSet()) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return UNSAFE_TEXT.test(value) ? undefined : value.slice(0, MAX_TEXT_LENGTH);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value) || isDomLike(value)) return undefined;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = value.slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeSnapshotValue(item, visibility, depth + 1, ancestors))
      .filter((item) => item !== undefined);
    ancestors.delete(value);
    return result;
  }
  const result = {};
  Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key) || !Object.hasOwn(descriptor, "value") || shouldRemoveSnapshotKey(key, visibility)) return;
    const child = sanitizeSnapshotValue(descriptor.value, visibility, depth + 1, ancestors);
    if (child !== undefined) result[key] = child;
  });
  ancestors.delete(value);
  return result;
}

function shouldRemoveSnapshotKey(key, visibility) {
  const normalized = normalizeSensitiveKey(key);
  if (ALWAYS_PRIVATE_KEYS.has(normalized) || ALWAYS_PRIVATE_KEY_PATTERN.test(normalized) || EXECUTABLE_SNAPSHOT_KEYS.has(normalized)) return true;
  if (visibility === "public" && PUBLIC_PRIVATE_KEYS.has(normalized)) return true;
  return visibility === "production" && PRODUCTION_PRIVATE_KEYS.has(normalized);
}

function normalizeSensitiveKey(value) {
  return String(value || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function isCustomExecutableKey(normalizedKey) {
  return CUSTOM_EXECUTABLE_KEYS.has(normalizedKey)
    || /^on[a-z]+$/.test(normalizedKey)
    || ["code", "eval", "srcdoc"].includes(normalizedKey);
}

function normalizeAssetRef(value) {
  if (!isRecord(value)) return null;
  if (Object.keys(value).some((key) => !["assetId", "version", "variantId"].includes(key) || DANGEROUS_KEYS.has(key))) return null;
  return {
    assetId: normalizeId(value.assetId),
    version: value.version === null || value.version === undefined ? null : String(value.version),
    variantId: value.variantId === null || value.variantId === undefined ? null : normalizeId(value.variantId)
  };
}

function isValidAssetRef(value) {
  return isRecord(value)
    && isSafeId(value.assetId)
    && (value.version === null || isSemanticVersion(value.version))
    && (value.variantId === null || isSafeId(value.variantId))
    && Object.keys(value).every((key) => ["assetId", "version", "variantId"].includes(key));
}

function normalizeBox(value) {
  if (Number.isFinite(value)) {
    const number = Math.max(0, value);
    return { top: number, right: number, bottom: number, left: number };
  }
  const source = isRecord(value) ? value : {};
  return {
    top: Math.max(0, finiteNumber(source.top, 0)),
    right: Math.max(0, finiteNumber(source.right, 0)),
    bottom: Math.max(0, finiteNumber(source.bottom, 0)),
    left: Math.max(0, finiteNumber(source.left, 0))
  };
}

function scanUnsafe(value, path, warnings, depth = 0, ancestors = new WeakSet()) {
  if (typeof value === "string") {
    if (UNSAFE_TEXT.test(value)) warnings.push(`${path}:unsafe-content-blocked`);
    return;
  }
  if (["function", "symbol", "bigint"].includes(typeof value)) {
    warnings.push(`${path}:${typeof value}-blocked`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (depth > MAX_DEPTH) {
    warnings.push(`${path}:depth-exceeded`);
    return;
  }
  if (ancestors.has(value)) {
    warnings.push(`${path}:cycle-blocked`);
    return;
  }
  if (isDomLike(value)) {
    warnings.push(`${path}:dom-reference-blocked`);
    return;
  }
  ancestors.add(value);
  Object.entries(Object.getOwnPropertyDescriptors(value)).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key)) warnings.push(`${path}.${key}:dangerous-key-blocked`);
    else if (Object.hasOwn(descriptor, "value")) scanUnsafe(descriptor.value, `${path}.${key}`, warnings, depth + 1, ancestors);
  });
  ancestors.delete(value);
}

function cloneSafe(value, warnings = [], path = "value", depth = 0, ancestors = new WeakSet()) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (UNSAFE_TEXT.test(value)) warnings.push(`${path}:unsafe-content-blocked`);
    if (value.length > MAX_TEXT_LENGTH) warnings.push(`${path}:string-truncated`);
    return value.slice(0, MAX_TEXT_LENGTH);
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    if (typeof value !== "undefined") warnings.push(`${path}:${typeof value}-blocked`);
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  if (depth > MAX_DEPTH) {
    warnings.push(`${path}:depth-exceeded`);
    return undefined;
  }
  if (ancestors.has(value)) {
    warnings.push(`${path}:cycle-blocked`);
    return undefined;
  }
  if (isDomLike(value)) {
    warnings.push(`${path}:dom-reference-blocked`);
    return undefined;
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) warnings.push(`${path}:array-truncated`);
    const result = value.slice(0, MAX_ARRAY_ITEMS)
      .map((item, index) => cloneSafe(item, warnings, `${path}.${index}`, depth + 1, ancestors))
      .filter((item) => item !== undefined);
    ancestors.delete(value);
    return result;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const entries = Object.entries(descriptors);
  if (entries.length > MAX_OBJECT_KEYS) warnings.push(`${path}:object-truncated`);
  const result = {};
  entries.slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key)) {
      warnings.push(`${path}.${key}:dangerous-key-blocked`);
      return;
    }
    if (!Object.hasOwn(descriptor, "value")) {
      warnings.push(`${path}.${key}:accessor-blocked`);
      return;
    }
    const child = cloneSafe(descriptor.value, warnings, `${path}.${key}`, depth + 1, ancestors);
    if (child !== undefined) result[key] = child;
  });
  ancestors.delete(value);
  return result;
}

function containsRuntimeReference(value, depth = 0, ancestors = new WeakSet()) {
  if (["function", "symbol", "bigint"].includes(typeof value)) return true;
  if (!value || typeof value !== "object") return false;
  if (depth > MAX_DEPTH || ancestors.has(value) || isDomLike(value)) return true;
  ancestors.add(value);
  const invalid = Object.entries(Object.getOwnPropertyDescriptors(value)).some(([key, descriptor]) =>
    DANGEROUS_KEYS.has(key) || !Object.hasOwn(descriptor, "value") || containsRuntimeReference(descriptor.value, depth + 1, ancestors)
  );
  ancestors.delete(value);
  return invalid;
}

function isBlockingSecurityWarning(value) {
  return /(unsafe-content|function-blocked|symbol-blocked|bigint-blocked|dangerous-key|cycle-blocked|dom-reference|depth-exceeded|array-truncated|object-truncated|string-truncated|accessor-blocked)/.test(value);
}

function isDomLike(value) {
  return Boolean(value && typeof value === "object" && (value.nodeType || value.ownerDocument || value.window === value));
}

function normalizeVisibility(value) {
  return TemplateVisibility.includes(value) ? value : "production";
}

function normalizeTemplateStatus(value) {
  return value === null || value === undefined || value === "" ? "draft" : String(value);
}

function normalizeActor(value) {
  if (!isRecord(value)) return null;
  const actor = {
    id: nullableId(value.id ?? value.userId),
    name: nullableText(value.name),
    role: nullableId(value.role)
  };
  return actor.id || actor.role ? actor : null;
}

function isValidActor(value) {
  return isRecord(value)
    && (value.id === null || isSafeId(value.id))
    && (value.role === null || isSafeId(value.role))
    && (value.name === null || typeof value.name === "string")
    && Boolean(value.id || value.role);
}

function normalizePath(value) {
  const path = String(value || "").trim();
  return isSafePath(path) ? path : null;
}

function isSafePath(value) {
  return typeof value === "string"
    && value.length > 0
    && value.length <= 240
    && value.split(".").every((part) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(part) && !DANGEROUS_KEYS.has(part));
}

function isSafeVariableKey(value) {
  return typeof value === "string"
    && /^production\.[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)*$/.test(value)
    && isSafePath(value)
    && value.length <= 160;
}

function normalizeId(value) {
  const id = String(value || "").trim();
  return isSafeId(id) ? id : null;
}

function nullableId(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) && !UNSAFE_TEXT.test(value);
}

function buildId(prefix, type, now, random) {
  const entropy = typeof random === "function" ? random() : Math.random();
  return `${prefix}_${normalizeId(type) || "custom"}_${Date.parse(now)}_${String(Math.floor(Math.abs(entropy) * 1e8)).padStart(8, "0")}`;
}

function isSemanticVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
}

function normalizeNow(value) {
  return normalizeIso(value) || new Date().toISOString();
}

function normalizeIso(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function isIso(value) {
  return normalizeIso(value) === value;
}

function nullableText(value) {
  if (value === null || value === undefined) return null;
  return String(value).slice(0, MAX_TEXT_LENGTH);
}

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function boundedInteger(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function nonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function positiveIntegerOrNull(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value.length))];
}

function validationResult(valid, errors, warnings) {
  return { valid, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), templateEngineVersion: TEMPLATE_ENGINE_VERSION };
}

function templateError(code, details = {}) {
  return new BroadcastTemplateError(code, details);
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwn(value, key) {
  return Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
}

export { COMPONENT_LIBRARY_VERSION };
