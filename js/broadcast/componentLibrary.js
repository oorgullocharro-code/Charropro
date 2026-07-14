export const COMPONENT_LIBRARY_VERSION = "1.0.0";

export const COMPONENT_TYPES = Object.freeze([
  "container", "text", "image", "logo", "icon", "rectangle", "line", "circle", "badge",
  "timer", "score", "ranking", "table", "list", "qr", "sponsor", "progress", "ticker", "custom"
]);

export const COMPONENT_STATES = Object.freeze(["draft", "active", "disabled", "deprecated", "error"]);
export const COMPONENT_VISIBILITY = Object.freeze(["public", "production", "operational", "restricted"]);

const BINDING_SOURCES = Object.freeze(["production_variables", "broadcast_contract", "asset_manager"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const UPDATE_FIELDS = new Set([
  "name", "description", "visibility", "status", "bindings", "style", "layout", "animation", "properties", "metadata"
]);
const IMMUTABLE_FIELDS = new Set([
  "componentId", "componentType", "componentVersion", "componentRevision", "createdAt", "createdBy", "libraryVersion"
]);
const STYLE_FIELDS = Object.freeze([
  "fontFamily", "fontSize", "fontWeight", "italic", "underline", "letterSpacing", "lineHeight", "color",
  "backgroundColor", "borderColor", "borderWidth", "borderRadius", "opacity", "shadow", "textAlign",
  "verticalAlign", "padding", "margin"
]);
const LAYOUT_FIELDS = Object.freeze([
  "x", "y", "width", "height", "rotation", "anchor", "scale", "zIndex", "safeArea", "responsive"
]);
const ANIMATION_FIELDS = Object.freeze(["type", "duration", "delay", "easing", "repeat", "direction", "trigger"]);
const MAX_DEPTH = 12;
const MAX_ARRAY_ITEMS = 200;
const MAX_OBJECT_KEYS = 500;
const MAX_BINDINGS = 50;
const MAX_TEXT_LENGTH = 10000;

export class BroadcastComponentError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastComponentError";
    this.code = code;
    this.details = cloneSafe(details, [], "error.details") || {};
  }
}

export function createBroadcastComponent(input = {}, options = {}) {
  if (!isRecord(input)) throw componentError("component-not-object");
  const now = normalizeNow(options.now);
  const actor = normalizeActor(options.actor || input.createdBy);
  const component = normalizeBroadcastComponent({
    ...input,
    componentId: normalizeId(input.componentId) || buildId("cmp", input.componentType || "custom", now, options.random),
    componentRevision: input.componentRevision ?? 0,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    createdBy: input.createdBy ?? actor,
    updatedBy: input.updatedBy ?? actor
  }, { ...options, now });
  assertValidComponent(component, options);
  return component;
}

export function cloneBroadcastComponent(component) {
  return cloneSafe(component, [], "component.clone") || {};
}

export function normalizeBroadcastComponent(input = {}, options = {}) {
  const warnings = [];
  const raw = cloneSafe(isRecord(input) ? input : {}, warnings, "component") || {};
  const now = normalizeNow(options.now);
  const createdAt = input.createdAt === undefined || input.createdAt === null ? now : normalizeIso(raw.createdAt);
  const updatedAt = input.updatedAt === undefined || input.updatedAt === null ? createdAt : normalizeIso(raw.updatedAt);
  const componentType = raw.componentType || "custom";
  const properties = normalizeProperties(componentType, raw.properties, warnings);
  return {
    libraryVersion: COMPONENT_LIBRARY_VERSION,
    componentId: normalizeId(raw.componentId),
    name: nullableText(raw.name) ?? readableType(componentType),
    description: nullableText(raw.description),
    componentType,
    componentVersion: raw.componentVersion === undefined ? "1.0.0" : String(raw.componentVersion),
    componentRevision: raw.componentRevision ?? 0,
    createdAt,
    updatedAt,
    createdBy: normalizeActor(raw.createdBy),
    updatedBy: normalizeActor(raw.updatedBy),
    visibility: raw.visibility || "production",
    status: raw.status || "draft",
    bindings: normalizeBindings(raw.bindings, warnings),
    style: normalizeStyle(raw.style, warnings),
    layout: normalizeLayout(raw.layout, warnings),
    animation: normalizeAnimation(raw.animation, warnings),
    properties,
    metadata: cloneSafe(isRecord(raw.metadata) ? raw.metadata : {}, warnings, "component.metadata") || {},
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...warnings]),
    errors: uniqueStrings(raw.errors)
  };
}

export function validateBroadcastComponent(input, options = {}) {
  if (!isRecord(input)) return validationResult(false, ["component-not-object"], []);
  const component = normalizeBroadcastComponent(input, options);
  const errors = [];
  const warnings = [...component.warnings];
  if (component.libraryVersion !== COMPONENT_LIBRARY_VERSION) errors.push("component-library-version-invalid");
  if (!isSafeId(component.componentId)) errors.push("component-id-invalid");
  if (!component.name) errors.push("component-name-required");
  if (!COMPONENT_TYPES.includes(component.componentType)) errors.push("component-type-invalid");
  if (!isSemanticVersion(component.componentVersion)) errors.push("component-version-invalid");
  if (!Number.isInteger(component.componentRevision) || component.componentRevision < 0) errors.push("component-revision-invalid");
  if (!isIso(component.createdAt) || !isIso(component.updatedAt)) errors.push("component-timestamp-invalid");
  if (!COMPONENT_VISIBILITY.includes(component.visibility)) errors.push("component-visibility-invalid");
  if (!COMPONENT_STATES.includes(component.status)) errors.push("component-status-invalid");
  component.bindings.forEach((binding, index) => validateBinding(binding, `binding-${index}`, errors));
  validateStyle(component.style, errors);
  validateLayout(component.layout, errors);
  validateAnimation(component.animation, errors);
  validateProperties(component, errors);
  if (component.warnings.some((warning) => /(unsafe-protocol|executable-markup|string-truncated|asset-ref-fields-forbidden)/.test(warning))) {
    errors.push("component-unsafe-content");
  }
  if (component.status === "disabled") warnings.push("component-disabled");
  if (component.status === "deprecated") warnings.push("component-deprecated");
  if (component.status === "error") warnings.push("component-error-state");
  return validationResult(errors.length === 0, uniqueStrings(errors), uniqueStrings(warnings));
}

export function registerBroadcastComponent(registry = {}, componentInput, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRevision);
  const component = createBroadcastComponent(componentInput, options);
  if (base.components[component.componentId]) throw componentError("component-id-duplicate", { componentId: component.componentId });
  const next = cloneRegistry(base);
  next.components[component.componentId] = component;
  touchRegistry(next, options);
  return next;
}

export function updateBroadcastComponent(registry, componentId, patch = {}, options = {}) {
  if (!isRecord(patch)) throw componentError("component-patch-not-object");
  const base = normalizeRegistry(registry, options);
  const current = requireComponent(base, componentId);
  assertComponentRevision(current, options.expectedRevision);
  Object.keys(patch).forEach((key) => {
    if (IMMUTABLE_FIELDS.has(key)) throw componentError(`component-patch-field-forbidden:${key}`);
    if (!UPDATE_FIELDS.has(key) || DANGEROUS_KEYS.has(key)) throw componentError(`component-patch-field-not-allowed:${key}`);
  });
  const now = normalizeNow(options.now);
  const candidate = normalizeBroadcastComponent({
    ...current,
    ...cloneSafe(patch, [], "component.patch"),
    componentId: current.componentId,
    componentType: current.componentType,
    componentVersion: current.componentVersion,
    componentRevision: current.componentRevision + 1,
    createdAt: current.createdAt,
    createdBy: current.createdBy,
    updatedAt: now,
    updatedBy: options.actor || current.updatedBy
  }, { ...options, now });
  assertValidComponent(candidate, options);
  const next = cloneRegistry(base);
  next.components[current.componentId] = candidate;
  touchRegistry(next, options);
  return next;
}

export function removeBroadcastComponent(registry, componentId, options = {}) {
  const base = normalizeRegistry(registry, options);
  const current = requireComponent(base, componentId);
  assertComponentRevision(current, options.expectedRevision);
  if (!["draft", "disabled", "deprecated"].includes(current.status) && options.force !== true) {
    throw componentError("component-remove-active-forbidden");
  }
  const next = cloneRegistry(base);
  delete next.components[current.componentId];
  touchRegistry(next, options);
  return next;
}

export function listBroadcastComponents(registry, filter = {}) {
  return Object.values(normalizeRegistry(registry).components)
    .filter((component) => !filter.componentType || component.componentType === filter.componentType)
    .filter((component) => !filter.status || component.status === filter.status)
    .filter((component) => !filter.visibility || component.visibility === filter.visibility)
    .sort((left, right) => left.name.localeCompare(right.name) || left.componentId.localeCompare(right.componentId))
    .map(cloneBroadcastComponent);
}

export function findBroadcastComponent(registry, componentId) {
  const component = normalizeRegistry(registry).components[normalizeId(componentId)];
  return component ? cloneBroadcastComponent(component) : null;
}

export function buildComponentInstance(componentInput, overrides = {}, options = {}) {
  const component = normalizeBroadcastComponent(componentInput, options);
  assertValidComponent(component, options);
  if (!isRecord(overrides)) throw componentError("component-instance-overrides-invalid");
  const now = normalizeNow(options.now);
  const safeOverrides = cloneSafe(overrides, [], "instance.overrides") || {};
  const instance = {
    instanceVersion: COMPONENT_LIBRARY_VERSION,
    instanceId: normalizeId(safeOverrides.instanceId) || buildId("cmi", component.componentType, now, options.random),
    componentId: component.componentId,
    componentType: component.componentType,
    componentVersion: component.componentVersion,
    componentRevision: component.componentRevision,
    instanceRevision: nonNegativeInteger(safeOverrides.instanceRevision, 0),
    visibility: safeOverrides.visibility || component.visibility,
    status: safeOverrides.status || component.status,
    bindings: safeOverrides.bindings ? normalizeBindings(safeOverrides.bindings, []) : cloneSafe(component.bindings),
    style: normalizeStyle({ ...component.style, ...(isRecord(safeOverrides.style) ? safeOverrides.style : {}) }, []),
    layout: normalizeLayout({ ...component.layout, ...(isRecord(safeOverrides.layout) ? safeOverrides.layout : {}) }, []),
    animation: normalizeAnimation({ ...component.animation, ...(isRecord(safeOverrides.animation) ? safeOverrides.animation : {}) }, []),
    properties: normalizeProperties(component.componentType, {
      ...component.properties,
      ...(isRecord(safeOverrides.properties) ? safeOverrides.properties : {})
    }, []),
    metadata: cloneSafe({ ...component.metadata, ...(isRecord(safeOverrides.metadata) ? safeOverrides.metadata : {}) }, [], "instance.metadata") || {},
    createdAt: now,
    createdBy: normalizeActor(options.actor),
    warnings: [],
    errors: []
  };
  const validation = validateComponentInstance(instance, options);
  if (!validation.valid) throw componentError("component-instance-invalid", { errors: validation.errors });
  return cloneComponentInstance(instance);
}

export function validateComponentInstance(input, options = {}) {
  if (!isRecord(input)) return validationResult(false, ["component-instance-not-object"], []);
  const errors = [];
  const warnings = uniqueStrings(input.warnings);
  if (input.instanceVersion !== COMPONENT_LIBRARY_VERSION) errors.push("component-instance-version-invalid");
  if (!isSafeId(input.instanceId)) errors.push("component-instance-id-invalid");
  if (!isSafeId(input.componentId)) errors.push("component-instance-component-id-invalid");
  if (!COMPONENT_TYPES.includes(input.componentType)) errors.push("component-instance-type-invalid");
  if (!isSemanticVersion(input.componentVersion)) errors.push("component-instance-component-version-invalid");
  if (!Number.isInteger(input.componentRevision) || input.componentRevision < 0) errors.push("component-instance-component-revision-invalid");
  if (!Number.isInteger(input.instanceRevision) || input.instanceRevision < 0) errors.push("component-instance-revision-invalid");
  if (!COMPONENT_VISIBILITY.includes(input.visibility)) errors.push("component-instance-visibility-invalid");
  if (!COMPONENT_STATES.includes(input.status)) errors.push("component-instance-status-invalid");
  if (!isIso(input.createdAt)) errors.push("component-instance-created-at-invalid");
  (Array.isArray(input.bindings) ? input.bindings : []).forEach((binding, index) => validateBinding(binding, `instance-binding-${index}`, errors));
  validateStyle(input.style, errors);
  validateLayout(input.layout, errors);
  validateAnimation(input.animation, errors);
  validateProperties(input, errors);
  return validationResult(errors.length === 0, uniqueStrings(errors), warnings);
}

export function cloneComponentInstance(instance) {
  return cloneSafe(instance, [], "instance.clone") || {};
}

export function resolveComponentBindings(componentOrInstance, sources = {}, options = {}) {
  const bindings = Array.isArray(componentOrInstance?.bindings) ? componentOrInstance.bindings : [];
  const visibility = normalizeVisibility(options.visibility || componentOrInstance?.visibility);
  const values = {};
  const warnings = [];
  const errors = [];
  bindings.forEach((binding) => {
    const bindingErrors = [];
    validateBinding(binding, binding.bindingId || binding.target || "binding", bindingErrors);
    if (bindingErrors.length) {
      errors.push(...bindingErrors);
      return;
    }
    if (VISIBILITY_RANK[binding.visibility] > VISIBILITY_RANK[visibility]) {
      warnings.push(`binding-visibility-blocked:${binding.bindingId}`);
      return;
    }
    const resolution = resolveBinding(binding, sources);
    if (resolution.resolved) values[binding.target] = cloneSafe(resolution.value, [], `binding.${binding.target}`);
    else if (hasOwn(binding, "fallback")) {
      values[binding.target] = cloneSafe(binding.fallback, [], `binding.${binding.target}.fallback`);
      warnings.push(`binding-fallback-used:${binding.bindingId}`);
    } else if (binding.required) errors.push(`binding-required-unresolved:${binding.bindingId}`);
    else warnings.push(`binding-unresolved:${binding.bindingId}`);
  });
  return { values, warnings: uniqueStrings(warnings), errors: uniqueStrings(errors) };
}

export function buildComponentSnapshot(componentOrInstance, sources = {}, options = {}) {
  const now = normalizeNow(options.now);
  const visibility = normalizeVisibility(options.visibility || componentOrInstance?.visibility);
  const isInstance = Boolean(componentOrInstance?.instanceId);
  const validation = isInstance
    ? validateComponentInstance(componentOrInstance, options)
    : validateBroadcastComponent(componentOrInstance, options);
  const resolved = validation.valid
    ? resolveComponentBindings(componentOrInstance, sources, { ...options, visibility })
    : { values: {}, warnings: [], errors: [] };
  const snapshot = {
    version: COMPONENT_LIBRARY_VERSION,
    generatedAt: now,
    visibility,
    component: isInstance ? cloneComponentInstance(componentOrInstance) : cloneBroadcastComponent(componentOrInstance),
    resolvedBindings: cloneSafe(resolved.values, [], "snapshot.bindings") || {},
    warnings: uniqueStrings([...validation.warnings, ...resolved.warnings]),
    errors: uniqueStrings([...validation.errors, ...resolved.errors])
  };
  return sanitizeComponentSnapshot(snapshot, visibility);
}

export function validateComponentSnapshot(snapshot) {
  if (!isRecord(snapshot)) return validationResult(false, ["component-snapshot-not-object"], []);
  const errors = [];
  if (snapshot.version !== COMPONENT_LIBRARY_VERSION) errors.push("component-snapshot-version-invalid");
  if (!isIso(snapshot.generatedAt)) errors.push("component-snapshot-generated-at-invalid");
  if (!COMPONENT_VISIBILITY.includes(snapshot.visibility)) errors.push("component-snapshot-visibility-invalid");
  if (snapshot.component !== null && !isRecord(snapshot.component)) errors.push("component-snapshot-component-invalid");
  if (!isRecord(snapshot.resolvedBindings)) errors.push("component-snapshot-bindings-invalid");
  if (!Array.isArray(snapshot.warnings) || !Array.isArray(snapshot.errors)) errors.push("component-snapshot-diagnostics-invalid");
  return validationResult(errors.length === 0, uniqueStrings(errors), []);
}

export function sanitizeComponentSnapshot(snapshotInput, visibility = "production") {
  const selectedVisibility = normalizeVisibility(visibility);
  const snapshot = cloneSafe(snapshotInput, [], "snapshot") || {};
  const component = snapshot.component;
  if (component && VISIBILITY_RANK[component.visibility] > VISIBILITY_RANK[selectedVisibility]) {
    return {
      version: COMPONENT_LIBRARY_VERSION,
      generatedAt: normalizeIso(snapshot.generatedAt) || new Date().toISOString(),
      visibility: selectedVisibility,
      component: null,
      resolvedBindings: {},
      warnings: uniqueStrings([...(snapshot.warnings || []), "component-visibility-blocked"]),
      errors: uniqueStrings(snapshot.errors)
    };
  }
  const sanitized = sanitizeForVisibility(snapshot, selectedVisibility);
  sanitized.visibility = selectedVisibility;
  return cloneSafe(sanitized, [], "snapshot.sanitized") || {};
}

export function getComponentWarnings(componentInput, context = {}) {
  const component = normalizeBroadcastComponent(componentInput, context);
  const warnings = [...component.warnings];
  if (component.status !== "active") warnings.push(`component-status-${component.status}`);
  if (!component.bindings.length && ["text", "image", "logo", "timer", "score", "ranking", "table", "list", "qr", "sponsor", "progress", "ticker"].includes(component.componentType)) {
    warnings.push("component-without-bindings");
  }
  if (component.componentType === "image" && !component.properties.assetRef) warnings.push("component-image-asset-required");
  return uniqueStrings(warnings);
}

function normalizeBindings(value, warnings) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_BINDINGS) warnings.push("component.bindings:array-truncated");
  return value.slice(0, MAX_BINDINGS).map((binding, index) => normalizeBinding(binding, index, warnings));
}

function normalizeBinding(input, index, warnings) {
  const raw = cloneSafe(isRecord(input) ? input : {}, warnings, `component.bindings.${index}`) || {};
  const allowed = new Set(["bindingId", "target", "source", "key", "path", "assetRef", "fallback", "required", "visibility"]);
  const extra = Object.keys(raw).filter((key) => !allowed.has(key));
  if (extra.length) warnings.push(`component.bindings.${index}:fields-forbidden:${extra.join(",")}`);
  return {
    bindingId: normalizeId(raw.bindingId) || `binding_${index + 1}`,
    target: normalizePath(raw.target),
    source: raw.source || null,
    key: nullableText(raw.key),
    path: nullableText(raw.path),
    assetRef: normalizeAssetRef(raw.assetRef, warnings, `component.bindings.${index}.assetRef`),
    fallback: hasOwn(raw, "fallback") ? cloneSafe(raw.fallback, warnings, `component.bindings.${index}.fallback`) : undefined,
    required: raw.required === true,
    visibility: normalizeVisibility(raw.visibility)
  };
}

function validateBinding(binding, label, errors) {
  if (!isRecord(binding)) {
    errors.push(`${label}-invalid`);
    return;
  }
  if (!isSafeId(binding.bindingId)) errors.push(`${label}-id-invalid`);
  if (!isSafePath(binding.target)) errors.push(`${label}-target-invalid`);
  if (!BINDING_SOURCES.includes(binding.source)) errors.push(`${label}-source-invalid`);
  if (!COMPONENT_VISIBILITY.includes(binding.visibility)) errors.push(`${label}-visibility-invalid`);
  if (binding.source === "production_variables" && !isSafeVariableKey(binding.key)) errors.push(`${label}-variable-key-invalid`);
  if (binding.source === "broadcast_contract" && !isSafePath(binding.path)) errors.push(`${label}-contract-path-invalid`);
  if (binding.source === "asset_manager" && !validateAssetRef(binding.assetRef)) errors.push(`${label}-asset-ref-invalid`);
  if (binding.source !== "asset_manager" && binding.assetRef) errors.push(`${label}-asset-ref-source-invalid`);
}

function resolveBinding(binding, sources) {
  if (binding.source === "production_variables") {
    const root = sources.productionVariables?.values || sources.productionVariables || sources.variables?.values || sources.variables || {};
    return hasOwn(root, binding.key) ? { resolved: true, value: root[binding.key] } : { resolved: false };
  }
  if (binding.source === "broadcast_contract") {
    const root = sources.broadcastContract || sources.contract;
    const value = getSafePath(root, binding.path);
    return value.found ? { resolved: true, value: value.value } : { resolved: false };
  }
  if (binding.source === "asset_manager") {
    if (!validateAssetRef(binding.assetRef)) return { resolved: false };
    const registry = sources.assetManager || sources.assets;
    if (registry && !assetReferenceExists(registry, binding.assetRef)) return { resolved: false };
    return { resolved: true, value: cloneSafe(binding.assetRef) };
  }
  return { resolved: false };
}

function normalizeStyle(value, warnings) {
  const raw = cloneSafe(isRecord(value) ? value : {}, warnings, "component.style") || {};
  const result = Object.fromEntries(STYLE_FIELDS.map((field) => [field, null]));
  result.fontFamily = nullableText(raw.fontFamily);
  result.fontSize = numberOrNull(raw.fontSize);
  result.fontWeight = raw.fontWeight === undefined || raw.fontWeight === null ? null : raw.fontWeight;
  result.italic = raw.italic === true;
  result.underline = raw.underline === true;
  result.letterSpacing = numberOrNull(raw.letterSpacing);
  result.lineHeight = numberOrNull(raw.lineHeight);
  result.color = nullableText(raw.color);
  result.backgroundColor = nullableText(raw.backgroundColor);
  result.borderColor = nullableText(raw.borderColor);
  result.borderWidth = numberOrNull(raw.borderWidth);
  result.borderRadius = numberOrNull(raw.borderRadius);
  result.opacity = raw.opacity === undefined || raw.opacity === null ? 1 : raw.opacity;
  result.shadow = normalizeShadow(raw.shadow, warnings);
  result.textAlign = nullableText(raw.textAlign);
  result.verticalAlign = nullableText(raw.verticalAlign);
  result.padding = normalizeBox(raw.padding);
  result.margin = normalizeBox(raw.margin);
  return result;
}

function normalizeLayout(value, warnings) {
  const raw = cloneSafe(isRecord(value) ? value : {}, warnings, "component.layout") || {};
  return {
    x: raw.x ?? 0,
    y: raw.y ?? 0,
    width: raw.width ?? 1,
    height: raw.height ?? 1,
    rotation: raw.rotation ?? 0,
    anchor: nullableText(raw.anchor) || "center",
    scale: raw.scale ?? 1,
    zIndex: raw.zIndex ?? 0,
    safeArea: normalizeBox(raw.safeArea),
    responsive: cloneSafe(isRecord(raw.responsive) ? raw.responsive : {}, warnings, "component.layout.responsive") || {}
  };
}

function normalizeAnimation(value, warnings) {
  const raw = cloneSafe(isRecord(value) ? value : {}, warnings, "component.animation") || {};
  return {
    type: nullableText(raw.type) || "none",
    duration: raw.duration ?? 0,
    delay: raw.delay ?? 0,
    easing: nullableText(raw.easing) || "linear",
    repeat: raw.repeat ?? 0,
    direction: nullableText(raw.direction) || "normal",
    trigger: nullableText(raw.trigger) || "manual"
  };
}

function normalizeProperties(type, value, warnings) {
  const raw = cloneSafe(isRecord(value) ? value : {}, warnings, "component.properties") || {};
  if (type === "text") return {
    text: nullableText(raw.text) ?? "",
    multiline: raw.multiline === true,
    ellipsis: raw.ellipsis === true,
    maxLines: raw.maxLines ?? null,
    textTransform: ["none", "uppercase", "lowercase", "capitalize"].includes(raw.textTransform) ? raw.textTransform : "none"
  };
  if (["image", "logo", "icon", "qr", "sponsor"].includes(type)) return {
    assetRef: normalizeAssetRef(raw.assetRef, warnings, "component.properties.assetRef")
  };
  if (type === "timer") return { value: hasOwn(raw, "value") ? raw.value : null, display: nullableText(raw.display), format: nullableText(raw.format) };
  if (type === "score") return { label: nullableText(raw.label), value: hasOwn(raw, "value") ? raw.value : null };
  if (type === "table") return {
    columns: cloneSafe(Array.isArray(raw.columns) ? raw.columns : [], warnings, "component.properties.columns") || [],
    rows: cloneSafe(Array.isArray(raw.rows) ? raw.rows : [], warnings, "component.properties.rows") || [],
    alignments: cloneSafe(Array.isArray(raw.alignments) ? raw.alignments : [], warnings, "component.properties.alignments") || []
  };
  if (type === "list") return {
    items: cloneSafe(Array.isArray(raw.items) ? raw.items : [], warnings, "component.properties.items") || [],
    spacing: raw.spacing ?? 0,
    bullet: raw.bullet === true
  };
  if (type === "ranking") return { entries: cloneSafe(Array.isArray(raw.entries) ? raw.entries : [], warnings, "component.properties.entries") || [] };
  if (type === "progress") return { value: raw.value ?? 0, direction: raw.direction || "horizontal" };
  if (type === "ticker") return {
    items: cloneSafe(Array.isArray(raw.items) ? raw.items : [], warnings, "component.properties.items") || [],
    separator: nullableText(raw.separator) ?? ""
  };
  return cloneSafe(raw, warnings, "component.properties.generic") || {};
}

function validateStyle(style, errors) {
  if (!isRecord(style) || STYLE_FIELDS.some((field) => !hasOwn(style, field))) {
    errors.push("component-style-invalid");
    return;
  }
  for (const field of ["fontSize", "letterSpacing", "lineHeight", "borderWidth", "borderRadius"]) {
    if (style[field] !== null && (!Number.isFinite(style[field]) || style[field] < 0)) errors.push(`component-style-${field}-invalid`);
  }
  if (!Number.isFinite(style.opacity) || style.opacity < 0 || style.opacity > 1) errors.push("component-style-opacity-invalid");
  for (const field of ["color", "backgroundColor", "borderColor"]) {
    if (style[field] !== null && !isColor(style[field])) errors.push(`component-style-${field}-invalid`);
  }
  if (style.fontWeight !== null && !(Number.isInteger(style.fontWeight) && style.fontWeight >= 100 && style.fontWeight <= 900)
    && !["normal", "bold"].includes(style.fontWeight)) errors.push("component-style-fontWeight-invalid");
  validateBox(style.padding, "component-style-padding", errors);
  validateBox(style.margin, "component-style-margin", errors);
}

function validateLayout(layout, errors) {
  if (!isRecord(layout) || LAYOUT_FIELDS.some((field) => !hasOwn(layout, field))) {
    errors.push("component-layout-invalid");
    return;
  }
  for (const field of ["x", "y", "width", "height", "rotation", "scale", "zIndex"]) {
    if (!Number.isFinite(layout[field])) errors.push(`component-layout-${field}-invalid`);
  }
  if (Number.isFinite(layout.width) && layout.width < 0) errors.push("component-layout-width-invalid");
  if (Number.isFinite(layout.height) && layout.height < 0) errors.push("component-layout-height-invalid");
  if (Number.isFinite(layout.scale) && layout.scale <= 0) errors.push("component-layout-scale-invalid");
  if (!isSafeId(layout.anchor)) errors.push("component-layout-anchor-invalid");
  validateBox(layout.safeArea, "component-layout-safe-area", errors);
  if (!isRecord(layout.responsive)) errors.push("component-layout-responsive-invalid");
}

function validateAnimation(animation, errors) {
  if (!isRecord(animation) || ANIMATION_FIELDS.some((field) => !hasOwn(animation, field))) {
    errors.push("component-animation-invalid");
    return;
  }
  if (!isSafeId(animation.type) || !isSafeId(animation.easing) || !isSafeId(animation.direction) || !isSafeId(animation.trigger)) {
    errors.push("component-animation-value-invalid");
  }
  for (const field of ["duration", "delay", "repeat"]) {
    if (!Number.isInteger(animation[field]) || animation[field] < 0) errors.push(`component-animation-${field}-invalid`);
  }
}

function validateProperties(component, errors) {
  const properties = component.properties;
  if (!isRecord(properties)) {
    errors.push("component-properties-invalid");
    return;
  }
  if (component.componentType === "text") {
    if (typeof properties.text !== "string") errors.push("component-text-value-invalid");
    if (properties.maxLines !== null && (!Number.isInteger(properties.maxLines) || properties.maxLines < 1)) errors.push("component-text-max-lines-invalid");
  }
  if (["image", "logo", "icon", "qr", "sponsor"].includes(component.componentType)
    && properties.assetRef !== null && !validateAssetRef(properties.assetRef)) errors.push("component-asset-ref-invalid");
  if (component.componentType === "progress") {
    if (!Number.isFinite(properties.value) || properties.value < 0 || properties.value > 100) errors.push("component-progress-value-invalid");
    if (!["horizontal", "vertical"].includes(properties.direction)) errors.push("component-progress-direction-invalid");
  }
  if (component.componentType === "table") {
    if (!Array.isArray(properties.columns) || !Array.isArray(properties.rows) || !Array.isArray(properties.alignments)) errors.push("component-table-invalid");
  }
  if (["list", "ranking", "ticker"].includes(component.componentType)) {
    const field = component.componentType === "ranking" ? "entries" : "items";
    if (!Array.isArray(properties[field])) errors.push(`component-${component.componentType}-items-invalid`);
  }
}

function normalizeRegistry(registry = {}, options = {}) {
  const raw = cloneSafe(isRecord(registry) ? registry : {}, [], "registry") || {};
  const source = isRecord(raw.components) ? raw.components : {};
  const components = Object.fromEntries(Object.entries(source).map(([id, component]) => {
    const normalized = normalizeBroadcastComponent({ ...component, componentId: component?.componentId || id }, options);
    return [normalized.componentId, normalized];
  }).filter(([id]) => id));
  const now = normalizeNow(options.now);
  return {
    libraryVersion: COMPONENT_LIBRARY_VERSION,
    revision: nonNegativeInteger(raw.revision, 0),
    components,
    createdAt: normalizeIso(raw.createdAt) || now,
    updatedAt: normalizeIso(raw.updatedAt) || normalizeIso(raw.createdAt) || now
  };
}

function cloneRegistry(registry) {
  return cloneSafe(registry, [], "registry.clone") || {};
}

function touchRegistry(registry, options) {
  registry.revision += 1;
  registry.updatedAt = normalizeNow(options.now);
}

function requireComponent(registry, componentId) {
  const component = registry.components[normalizeId(componentId)];
  if (!component) throw componentError("component-not-found", { componentId });
  return component;
}

function assertRegistryRevision(registry, expectedRevision) {
  if (expectedRevision === undefined) return;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== registry.revision) throw componentError("component-registry-revision-conflict");
}

function assertComponentRevision(component, expectedRevision) {
  if (!Number.isInteger(expectedRevision)) throw componentError("component-expected-revision-required");
  if (expectedRevision !== component.componentRevision) throw componentError("component-revision-conflict");
}

function assertValidComponent(component, options) {
  const validation = validateBroadcastComponent(component, options);
  if (!validation.valid) throw componentError("component-invalid", { errors: validation.errors });
}

function normalizeAssetRef(value, warnings = [], path = "assetRef") {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;
  const allowed = new Set(["assetId", "version", "variantId"]);
  if (Object.keys(value).some((key) => !allowed.has(key) || DANGEROUS_KEYS.has(key))) {
    warnings.push(`${path}:asset-ref-fields-forbidden`);
    return null;
  }
  return {
    assetId: normalizeId(value.assetId),
    version: value.version === null || value.version === undefined ? null : String(value.version),
    variantId: nullableId(value.variantId)
  };
}

function validateAssetRef(value) {
  return isRecord(value)
    && isSafeId(value.assetId)
    && !hasUnsafeProtocol(value.assetId)
    && (value.version === null || isSemanticVersion(value.version))
    && (value.variantId === null || isSafeId(value.variantId))
    && Object.keys(value).every((key) => ["assetId", "version", "variantId"].includes(key));
}

function assetReferenceExists(registry, ref) {
  const source = Array.isArray(registry) ? registry : isRecord(registry.assets) ? Object.values(registry.assets) : isRecord(registry) ? Object.values(registry) : [];
  return source.some((asset) => asset?.assetId === ref.assetId && (!ref.version || asset.version === ref.version));
}

function normalizeShadow(value, warnings) {
  if (value === null || value === undefined || value === false) return null;
  if (!isRecord(value)) return null;
  const raw = cloneSafe(value, warnings, "component.style.shadow") || {};
  return {
    x: numberOrNull(raw.x) ?? 0,
    y: numberOrNull(raw.y) ?? 0,
    blur: numberOrNull(raw.blur) ?? 0,
    spread: numberOrNull(raw.spread) ?? 0,
    color: nullableText(raw.color)
  };
}

function normalizeBox(value) {
  if (value === null || value === undefined) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (Number.isFinite(value)) return { top: value, right: value, bottom: value, left: value };
  const raw = isRecord(value) ? value : {};
  return {
    top: raw.top ?? 0,
    right: raw.right ?? 0,
    bottom: raw.bottom ?? 0,
    left: raw.left ?? 0
  };
}

function validateBox(value, label, errors) {
  if (!isRecord(value) || ["top", "right", "bottom", "left"].some((key) => !Number.isFinite(value[key]) || value[key] < 0)) errors.push(`${label}-invalid`);
}

function sanitizeForVisibility(value, visibility, path = [], ancestors = new WeakSet()) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (!value || typeof value !== "object" || ancestors.has(value)) return undefined;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item, index) => sanitizeForVisibility(item, visibility, [...path, String(index)], ancestors)).filter((item) => item !== undefined);
    ancestors.delete(value);
    return result;
  }
  const rank = VISIBILITY_RANK[visibility];
  const result = {};
  Object.entries(value).forEach(([key, item]) => {
    const normalized = key.toLowerCase();
    if (DANGEROUS_KEYS.has(key)) return;
    if (/(password|secret|token|authorization|credential|signedurl)/i.test(normalized)) return;
    if (rank < VISIBILITY_RANK.operational && ["createdby", "updatedby"].includes(normalized)) return;
    if (rank === VISIBILITY_RANK.public && (normalized === "metadata" || normalized.startsWith("internal"))) return;
    const child = sanitizeForVisibility(item, visibility, [...path, key], ancestors);
    if (child !== undefined) result[key] = child;
  });
  ancestors.delete(value);
  return result;
}

function getSafePath(value, path) {
  if (!value || typeof value !== "object" || !isSafePath(path)) return { found: false, value: null };
  let current = value;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object" || !hasOwn(current, key)) return { found: false, value: null };
    current = current[key];
  }
  return { found: true, value: current };
}

function cloneSafe(value, warnings = [], path = "value", depth = 0, ancestors = new WeakSet()) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (hasUnsafeProtocol(value)) {
      warnings.push(`${path}:unsafe-protocol`);
      return undefined;
    }
    if (hasExecutableMarkup(value)) {
      warnings.push(`${path}:executable-markup`);
      return undefined;
    }
    if (value.length > MAX_TEXT_LENGTH) {
      warnings.push(`${path}:string-truncated`);
      return value.slice(0, MAX_TEXT_LENGTH);
    }
    return value;
  }
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    warnings.push(`${path}:non-finite-number`);
    return undefined;
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    warnings.push(`${path}:${typeof value}-removed`);
    return undefined;
  }
  if (typeof value !== "object") return undefined;
  if (depth > MAX_DEPTH) {
    warnings.push(`${path}:depth-exceeded`);
    return undefined;
  }
  if (ancestors.has(value)) {
    warnings.push(`${path}:cycle-removed`);
    return undefined;
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) warnings.push(`${path}:array-truncated`);
    const result = [];
    for (let index = 0; index < Math.min(value.length, MAX_ARRAY_ITEMS); index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !hasOwn(descriptor, "value")) continue;
      const child = cloneSafe(descriptor.value, warnings, `${path}.${index}`, depth + 1, ancestors);
      if (child !== undefined) result.push(child);
    }
    ancestors.delete(value);
    return result;
  }
  const descriptors = Object.entries(Object.getOwnPropertyDescriptors(value));
  if (descriptors.length > MAX_OBJECT_KEYS) warnings.push(`${path}:object-truncated`);
  const result = {};
  descriptors.slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key)) {
      warnings.push(`${path}.${key}:dangerous-key-removed`);
      return;
    }
    if (!hasOwn(descriptor, "value")) {
      warnings.push(`${path}.${key}:accessor-removed`);
      return;
    }
    const child = cloneSafe(descriptor.value, warnings, `${path}.${key}`, depth + 1, ancestors);
    if (child !== undefined) result[key] = child;
  });
  ancestors.delete(value);
  return result;
}

function hasUnsafeProtocol(value) {
  return /^(?:javascript|data|file):/i.test(String(value || "").trim());
}

function hasExecutableMarkup(value) {
  const text = String(value || "");
  return /<\s*\/?\s*(script|iframe|object|embed)\b/i.test(text) || /<[^>]+\son[a-z]+\s*=/i.test(text);
}

function isSafePath(value) {
  return typeof value === "string"
    && /^[A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z][A-Za-z0-9_-]*)*$/.test(value)
    && value.split(".").every((part) => !DANGEROUS_KEYS.has(part));
}

function normalizePath(value) {
  const path = String(value || "").trim();
  return isSafePath(path) ? path : null;
}

function isSafeVariableKey(value) {
  return typeof value === "string" && /^production\.[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)*$/.test(value) && isSafePath(value);
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) && !DANGEROUS_KEYS.has(value) && !hasUnsafeProtocol(value);
}

function normalizeId(value) {
  const id = String(value ?? "").trim();
  return isSafeId(id) ? id : null;
}

function nullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function nullableText(value) {
  return value === null || value === undefined ? null : String(value);
}

function isColor(value) {
  return typeof value === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

function numberOrNull(value) {
  return value === null || value === undefined || value === "" ? null : Number.isFinite(value) ? value : null;
}

function nonNegativeInteger(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function normalizeActor(value) {
  if (!isRecord(value)) return null;
  const actor = { id: nullableId(value.id ?? value.userId), name: nullableText(value.name), role: nullableId(value.role) };
  return actor.id || actor.role ? actor : null;
}

function normalizeVisibility(value) {
  return COMPONENT_VISIBILITY.includes(value) ? value : "production";
}

function normalizeIso(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function normalizeNow(value) {
  if (typeof value === "function") return normalizeNow(value());
  return normalizeIso(value) || new Date().toISOString();
}

function isIso(value) {
  return typeof value === "string" && normalizeIso(value) === value;
}

function isSemanticVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
}

function buildId(prefix, type, now, random) {
  const entropy = typeof random === "function" ? random() : Math.random();
  const normalizedType = String(type || "component").replace(/[^A-Za-z0-9]+/g, "_");
  return `${prefix}_${normalizedType}_${Date.parse(now)}_${String(Math.floor(Math.abs(entropy) * 1e8)).padStart(8, "0")}`;
}

function readableType(type) {
  return String(type || "custom").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function validationResult(valid, errors, warnings) {
  return { valid, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), version: COMPONENT_LIBRARY_VERSION };
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function componentError(code, details = {}) {
  return new BroadcastComponentError(code, details);
}
