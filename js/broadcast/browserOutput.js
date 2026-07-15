export const BROWSER_OUTPUT_VERSION = "1.0.0";

export const BROWSER_OUTPUT_STATES = Object.freeze([
  "uninitialized",
  "created",
  "configured",
  "mounting",
  "mounted",
  "updating",
  "ready",
  "empty",
  "stale",
  "unavailable",
  "disabled",
  "error",
  "cleared",
  "destroyed"
]);

export const BROWSER_OUTPUT_TYPES = Object.freeze([
  "generic",
  "program_main",
  "announcer_monitor",
  "timer_display"
]);

export const BROWSER_OUTPUT_ERROR_CODES = Object.freeze([
  "browser-output-invalid",
  "browser-output-destroyed",
  "browser-output-config-invalid",
  "browser-output-not-configured",
  "browser-output-target-invalid",
  "browser-output-root-conflict",
  "browser-output-not-mounted",
  "browser-output-projection-invalid",
  "browser-output-type-incompatible",
  "browser-output-visibility-incompatible",
  "browser-output-context-conflict",
  "browser-output-revision-regression",
  "browser-output-revision-conflict",
  "browser-output-fullscreen-not-allowed",
  "browser-output-request-unsafe",
  "browser-output-snapshot-invalid"
]);

export const BROWSER_OUTPUT_ORIENTATIONS = Object.freeze([
  "landscape",
  "portrait",
  "ultra_wide",
  "auto"
]);

export const BROWSER_OUTPUT_DISPLAY_MODES = Object.freeze([
  "fit",
  "fill",
  "native",
  "responsive",
  "fullscreen"
]);

const INSTANCES = new WeakMap();
const STATES = new Set(BROWSER_OUTPUT_STATES);
const TYPES = new Set(BROWSER_OUTPUT_TYPES);
const ORIENTATIONS = new Set(BROWSER_OUTPUT_ORIENTATIONS);
const DISPLAY_MODES = new Set(BROWSER_OUTPUT_DISPLAY_MODES);
const VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const ROUTE_STATUSES = new Set(["routed", "controlled-empty", "stale", "disabled", "cleared", "error"]);
const ROUTE_TYPES = new Set(["program_main", "announcer_monitor", "timer_display"]);
const SOURCE_TYPES = new Set(["program_snapshot", "announcer_projection", "timer_projection"]);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const RUNTIME_KEYS = new Set([
  "callback", "callbacks", "cache", "caches", "connection", "connections", "dom", "element",
  "firebase", "firebaseref", "handler", "handlers", "hook", "hooks", "listener", "listeners",
  "node", "plugin", "plugins", "renderer", "root", "runtime", "socket", "sockets", "target"
]);
const SECRET_KEYS = new Set([
  "accesskey", "accesstoken", "apikey", "auth", "authorization", "cookie", "cookies",
  "credential", "credentials", "headers", "password", "privatekey", "refreshtoken", "secret",
  "secrets", "signedurl", "token", "tokens"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "actor", "clientid", "createdby", "organizationid", "operatorid", "sessionid", "tenantid",
  "updatedby", "userid"
]);
const UNSAFE_CODE_KEYS = new Set([
  "css", "csstext", "html", "innerhtml", "outerhtml", "script", "scripts", "styletext"
]);
const UNSAFE_URI = /^\s*(?:javascript|file|data\s*:\s*text\/html|vbscript)\s*:/i;
const UNSAFE_MARKUP = /<\s*\/?\s*(?:script|iframe|object|embed|style|link|img)\b|\bon(?:error|load|click)\s*=/i;
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 20000;
const MAX_RESOLUTION_EDGE = 8192;
const MAX_RESOLUTION_PIXELS = 36_000_000;
const SNAPSHOT_VERSION = "1.0.0";

const TYPE_COMPATIBILITY = Object.freeze({
  program_main: Object.freeze({ outputId: "program-main", sourceType: "program_snapshot" }),
  announcer_monitor: Object.freeze({ outputId: "announcer-monitor", sourceType: "announcer_projection" }),
  timer_display: Object.freeze({ outputId: "timer-display", sourceType: "timer_projection" })
});

const TYPE_VISIBILITIES = Object.freeze({
  program_main: new Set(["public", "production"]),
  announcer_monitor: new Set(["operational", "restricted"]),
  timer_display: new Set(["public", "production", "operational"]),
  generic: new Set(VISIBILITIES)
});

const STATE_MESSAGES = Object.freeze({
  mounting: "Cargando salida…",
  mounted: "Cargando salida…",
  empty: "Sin contenido al aire",
  stale: "Datos pendientes de actualización",
  unavailable: "Salida no disponible",
  disabled: "Salida deshabilitada",
  cleared: "Sin contenido al aire",
  error: "No fue posible presentar la salida"
});

export class BroadcastBrowserOutputError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastBrowserOutputError";
    this.code = code;
    this.details = safeClone(details, { visibility: "restricted", rejectUnsafe: false }).value || {};
  }
}

export function createBrowserOutput(definition = {}, options = {}) {
  const safeDefinition = safeClone(definition, { visibility: "restricted", rejectUnsafe: true });
  if (safeDefinition.errors.length) throw browserOutputError("browser-output-invalid", { errors: safeDefinition.errors });
  const browserOutputId = normalizeId(safeDefinition.value?.browserOutputId || safeDefinition.value?.id);
  if (!browserOutputId) throw browserOutputError("browser-output-invalid", { field: "browserOutputId" });
  const now = normalizeNow(options.now);
  const instance = {
    browserOutputVersion: BROWSER_OUTPUT_VERSION,
    browserOutputId,
    outputType: "generic",
    routeId: null,
    outputId: null,
    name: normalizeText(safeDefinition.value?.name) || "Browser Output",
    status: "created",
    displayMode: "fit",
    visibility: "production",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: false,
    fullscreenAllowed: false,
    scaleMode: "contain",
    viewport: null,
    projectionRevision: 0,
    routeRevision: null,
    sourceRevision: null,
    mounted: false,
    rootId: `browser-output-root-${browserOutputId}`,
    createdAt: now,
    updatedAt: now,
    mountedAt: null,
    lastProjectionAt: null,
    clearedAt: null,
    destroyedAt: null,
    warnings: [],
    errors: [],
    metadata: normalizeMetadata(safeDefinition.value?.metadata)
  };
  INSTANCES.set(instance, {
    config: null,
    container: null,
    root: null,
    nodes: null,
    currentEnvelope: null,
    currentProjection: null,
    currentSummary: null,
    lastValidProjection: null,
    lastValidSummary: null,
    lastFingerprint: null,
    context: emptyContext(),
    destroyed: false
  });
  return instance;
}

export function configureBrowserOutput(instance, config = {}, options = {}) {
  const runtime = requireInstance(instance);
  const safeConfig = safeClone(config, { visibility: "restricted", rejectUnsafe: true, sanitizeText: true });
  if (safeConfig.errors.length) throw browserOutputError("browser-output-config-invalid", { errors: safeConfig.errors });
  const input = {
    ...(safeConfig.value || {}),
    browserOutputId: safeConfig.value?.browserOutputId || instance.browserOutputId
  };
  const validation = validateBrowserOutputConfig(input);
  if (!validation.valid) throw browserOutputError("browser-output-config-invalid", { errors: validation.errors });
  const normalized = normalizeConfig({ ...input, browserOutputId: instance.browserOutputId });
  const now = normalizeNow(options.now);
  runtime.config = freezeDeep(normalized);
  runtime.context = freezeDeep(readContext(normalized));
  syncInstance(instance, {
    ...normalized,
    status: runtime.root ? "mounted" : "configured",
    mounted: Boolean(runtime.root),
    updatedAt: now,
    warnings: validation.warnings,
    errors: []
  });
  if (runtime.root) renderBrowserOutput(instance, runtime);
  return getBrowserOutput(instance);
}

export function mountBrowserOutput(instance, container, options = {}) {
  const runtime = requireInstance(instance);
  if (!runtime.config) throw browserOutputError("browser-output-not-configured");
  const targetValidation = validateMountTarget(container);
  if (!targetValidation.valid) throw browserOutputError("browser-output-target-invalid", { errors: targetValidation.errors });
  if (runtime.root) {
    if (runtime.container !== container) throw browserOutputError("browser-output-root-conflict");
    return getBrowserOutput(instance);
  }
  const now = normalizeNow(options.now);
  syncInstance(instance, { status: "mounting", updatedAt: now });
  try {
    const documentRef = container.ownerDocument;
    const root = documentRef.createElement("div");
    root.className = "browser-output-root";
    root.setAttribute("id", instance.rootId);
    root.setAttribute("data-browser-output-id", instance.browserOutputId);
    root.setAttribute("data-output-type", instance.outputType);
    root.setAttribute("data-output-state", "mounting");
    root.setAttribute("data-route-id", instance.routeId);
    root.setAttribute("data-output-id", instance.outputId);

    const frame = documentRef.createElement("div");
    frame.className = "browser-output-frame";
    const safeArea = documentRef.createElement("div");
    safeArea.className = "browser-output-safe-area";
    safeArea.setAttribute("aria-hidden", "true");
    const status = documentRef.createElement("div");
    status.className = "browser-output-state";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const content = documentRef.createElement("div");
    content.className = "browser-output-content";
    const diagnostics = documentRef.createElement("div");
    diagnostics.className = "browser-output-diagnostics";
    frame.append(safeArea, status, content, diagnostics);
    root.appendChild(frame);
    container.appendChild(root);

    runtime.container = container;
    runtime.root = root;
    runtime.nodes = { frame, safeArea, status, content, diagnostics };
    syncInstance(instance, {
      status: "mounted",
      mounted: true,
      mountedAt: now,
      updatedAt: now,
      errors: []
    });
    renderBrowserOutput(instance, runtime);
    return getBrowserOutput(instance);
  } catch (error) {
    runtime.root?.remove?.();
    runtime.container = null;
    runtime.root = null;
    runtime.nodes = null;
    syncInstance(instance, {
      status: "error",
      mounted: false,
      updatedAt: now,
      errors: [normalizeErrorCode(error, "browser-output-target-invalid")]
    });
    throw normalizeBrowserOutputError(error, "browser-output-target-invalid");
  }
}

export function applyBrowserOutputProjection(instance, projection, options = {}) {
  const runtime = requireInstance(instance);
  if (!runtime.config) throw browserOutputError("browser-output-not-configured");
  if (!runtime.root || !runtime.nodes) throw browserOutputError("browser-output-not-mounted");
  const validation = validateBrowserOutputProjection(projection, {
    config: runtime.config,
    visibility: options.visibility,
    context: options.context
  });
  if (!validation.valid) throw browserOutputError(validation.code || "browser-output-projection-invalid", { errors: validation.errors });
  const normalized = normalizeProjectionEnvelope(projection, { visibility: validation.visibility });
  assertProjectionRevisionOrder(instance, runtime, normalized);
  const fingerprint = stableFingerprint(normalized);
  if (instance.routeRevision === normalized.routeRevision && instance.sourceRevision === normalized.sourceRevision) {
    if (runtime.lastFingerprint === fingerprint) return getBrowserOutput(instance);
    throw browserOutputError("browser-output-revision-conflict", {
      routeRevision: normalized.routeRevision,
      sourceRevision: normalized.sourceRevision
    });
  }

  const now = normalizeNow(options.now || normalized.resolvedAt);
  const nextStatus = resolveProjectionState(normalized);
  const stale = nextStatus === "stale";
  const nextProjection = stale && runtime.lastValidProjection
    ? cloneBrowserOutputResult(runtime.lastValidProjection)
    : cloneBrowserOutputResult(normalized.projection);
  const nextSummary = stale && runtime.lastValidSummary
    ? cloneBrowserOutputResult(runtime.lastValidSummary)
    : summarizeProjection(normalized, validation.visibility);
  const nextWarnings = uniqueStrings([
    ...(normalized.warnings || []),
    ...(stale ? ["browser-output-projection-stale"] : [])
  ]);

  syncInstance(instance, { status: "updating", updatedAt: now });
  runtime.currentEnvelope = freezeDeep(cloneBrowserOutputResult(normalized));
  runtime.currentProjection = freezeDeep(nextProjection);
  runtime.currentSummary = freezeDeep(nextSummary);
  runtime.lastFingerprint = fingerprint;
  runtime.context = freezeDeep(mergeContext(runtime.context, readProjectionContext(normalized)));
  if (nextStatus === "ready") {
    runtime.lastValidProjection = freezeDeep(cloneBrowserOutputResult(normalized.projection));
    runtime.lastValidSummary = freezeDeep(cloneBrowserOutputResult(nextSummary));
  }
  syncInstance(instance, {
    status: nextStatus,
    visibility: validation.visibility,
    projectionRevision: instance.projectionRevision + 1,
    routeRevision: normalized.routeRevision,
    sourceRevision: normalized.sourceRevision,
    lastProjectionAt: now,
    updatedAt: now,
    warnings: nextWarnings,
    errors: normalized.errors
  });
  renderBrowserOutput(instance, runtime);
  return getBrowserOutput(instance);
}

export function updateBrowserOutput(instance, projection, options = {}) {
  return applyBrowserOutputProjection(instance, projection, options);
}

export function clearBrowserOutput(instance, options = {}) {
  const runtime = requireInstance(instance);
  if (!runtime.root || !runtime.nodes) throw browserOutputError("browser-output-not-mounted");
  const now = normalizeNow(options.now);
  runtime.currentEnvelope = null;
  runtime.currentProjection = null;
  runtime.currentSummary = null;
  runtime.lastValidProjection = null;
  runtime.lastValidSummary = null;
  runtime.lastFingerprint = null;
  syncInstance(instance, {
    status: "cleared",
    projectionRevision: instance.projectionRevision + 1,
    routeRevision: null,
    sourceRevision: null,
    clearedAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  });
  renderBrowserOutput(instance, runtime);
  return getBrowserOutput(instance);
}

export function destroyBrowserOutput(instance, options = {}) {
  const runtime = requireInstance(instance);
  const now = normalizeNow(options.now);
  runtime.root?.remove?.();
  runtime.container = null;
  runtime.root = null;
  runtime.nodes = null;
  runtime.config = null;
  runtime.currentEnvelope = null;
  runtime.currentProjection = null;
  runtime.currentSummary = null;
  runtime.lastValidProjection = null;
  runtime.lastValidSummary = null;
  runtime.lastFingerprint = null;
  runtime.context = emptyContext();
  runtime.destroyed = true;
  syncInstance(instance, {
    status: "destroyed",
    mounted: false,
    updatedAt: now,
    destroyedAt: now,
    warnings: [],
    errors: []
  });
  return cloneDescriptor(instance);
}

export function getBrowserOutput(instance) {
  requireInstance(instance);
  return cloneDescriptor(instance);
}

export function getBrowserOutputStatus(instance) {
  requireInstance(instance);
  return {
    browserOutputId: instance.browserOutputId,
    status: instance.status,
    mounted: instance.mounted,
    outputType: instance.outputType,
    routeId: instance.routeId,
    outputId: instance.outputId,
    projectionRevision: instance.projectionRevision,
    routeRevision: instance.routeRevision,
    sourceRevision: instance.sourceRevision,
    updatedAt: instance.updatedAt
  };
}

export function getBrowserOutputWarnings(instance) {
  requireInstance(instance);
  return uniqueStrings(instance.warnings || []);
}

export function getBrowserOutputErrors(instance) {
  requireInstance(instance);
  return uniqueStrings(instance.errors || []);
}

export function validateBrowserOutputConfig(config) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(config, { visibility: "restricted", rejectUnsafe: true });
  errors.push(...safe.errors);
  const value = safe.value;
  if (!isRecord(value)) return validationResult(false, ["browser-output-config-invalid"], warnings);
  if (!normalizeId(value.browserOutputId)) errors.push("browser-output-id-invalid");
  const outputType = normalizeType(value.outputType || "generic");
  if (!outputType) errors.push("browser-output-type-invalid");
  const routeId = normalizeId(value.routeId);
  const outputId = normalizeId(value.outputId);
  if (!routeId) errors.push("browser-output-route-id-invalid");
  if (!outputId) errors.push("browser-output-output-id-invalid");
  if (outputType && outputType !== "generic") {
    const expected = TYPE_COMPATIBILITY[outputType];
    if (outputId && outputId !== expected.outputId) errors.push("browser-output-output-id-incompatible");
  } else if (outputId && !Object.values(TYPE_COMPATIBILITY).some((entry) => entry.outputId === outputId)) {
    errors.push("browser-output-output-id-invalid");
  }
  const visibility = normalizeVisibility(value.visibility);
  if (!visibility) errors.push("browser-output-visibility-invalid");
  if (outputType && visibility && !TYPE_VISIBILITIES[outputType].has(visibility)) errors.push("browser-output-visibility-incompatible");
  if (!DISPLAY_MODES.has(value.displayMode || "fit")) errors.push("browser-output-display-mode-invalid");
  if (!ORIENTATIONS.has(value.orientation || "landscape")) errors.push("browser-output-orientation-invalid");
  errors.push(...validateResolution(value.resolution));
  errors.push(...validateSafeArea(value.safeArea, value.resolution));
  if (value.transparentBackground !== undefined && typeof value.transparentBackground !== "boolean") errors.push("browser-output-transparency-invalid");
  if (value.fullscreenAllowed !== undefined && typeof value.fullscreenAllowed !== "boolean") errors.push("browser-output-fullscreen-invalid");
  if (value.viewport !== undefined && value.viewport !== null) errors.push(...validateViewport(value.viewport));
  return validationResult(errors.length === 0, errors, warnings);
}

export function validateBrowserOutputProjection(projection, options = {}) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(projection, { visibility: "restricted", rejectUnsafe: true, sanitizeText: true });
  errors.push(...safe.errors);
  const value = safe.value;
  if (!isRecord(value)) return projectionValidation(false, ["browser-output-projection-invalid"], warnings);
  const routeId = normalizeId(value.routeId);
  const routeType = normalizeRouteType(value.routeType);
  const outputId = normalizeId(value.outputId);
  const sourceType = normalizeSourceType(value.sourceType);
  if (!routeId) errors.push("browser-output-projection-route-id-invalid");
  if (!routeType) errors.push("browser-output-projection-route-type-invalid");
  if (!outputId) errors.push("browser-output-projection-output-id-invalid");
  if (!sourceType) errors.push("browser-output-projection-source-type-invalid");
  if (routeType) {
    const expected = TYPE_COMPATIBILITY[routeType];
    if (outputId && outputId !== expected.outputId) errors.push("browser-output-projection-output-id-incompatible");
    if (sourceType && sourceType !== expected.sourceType) errors.push("browser-output-projection-source-type-incompatible");
  }
  if (!nonNegativeInteger(value.sourceRevision)) errors.push("browser-output-source-revision-invalid");
  if (!nonNegativeInteger(value.routeRevision)) errors.push("browser-output-route-revision-invalid");
  if (!ROUTE_STATUSES.has(value.status)) errors.push("browser-output-route-status-invalid");
  const visibility = normalizeVisibility(value.visibility);
  if (!visibility) errors.push("browser-output-projection-visibility-invalid");
  errors.push(...validateResolution(value.resolution));
  if (!(value.projection === null || isRecord(value.projection))) errors.push("browser-output-projection-payload-invalid");
  if (!validStringArray(value.warnings)) errors.push("browser-output-projection-warnings-invalid");
  if (!validStringArray(value.errors)) errors.push("browser-output-projection-errors-invalid");
  if (!isIso(value.resolvedAt)) errors.push("browser-output-resolved-at-invalid");

  const config = options.config;
  let effectiveVisibility = visibility || "restricted";
  let code = null;
  if (isRecord(config) && routeType) {
    if (config.routeId !== routeId || config.outputId !== outputId || (config.outputType !== "generic" && config.outputType !== routeType)) {
      errors.push("browser-output-type-incompatible");
      code = "browser-output-type-incompatible";
    }
    const configVisibility = normalizeVisibility(config.visibility);
    const requestedVisibility = normalizeVisibility(options.visibility || config.visibility);
    if (!configVisibility || !requestedVisibility || VISIBILITY_RANK[visibility] > VISIBILITY_RANK[configVisibility]
      || VISIBILITY_RANK[visibility] > VISIBILITY_RANK[requestedVisibility]) {
      errors.push("browser-output-visibility-incompatible");
      code = "browser-output-visibility-incompatible";
    } else {
      effectiveVisibility = mostRestrictiveVisibility(configVisibility, visibility, requestedVisibility);
    }
    if (!TYPE_VISIBILITIES[routeType].has(effectiveVisibility)) {
      errors.push("browser-output-visibility-incompatible");
      code = "browser-output-visibility-incompatible";
    }
    const contextErrors = validateContextCompatibility(readContext(config), readProjectionContext(value));
    if (contextErrors.length) {
      errors.push(...contextErrors);
      code = "browser-output-context-conflict";
    }
  }
  return projectionValidation(errors.length === 0, errors, warnings, code, effectiveVisibility);
}

export function validateBrowserOutputSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(snapshot, { visibility: "restricted", rejectUnsafe: true });
  errors.push(...safe.errors);
  const value = safe.value;
  if (!isRecord(value)) return validationResult(false, ["browser-output-snapshot-invalid"], warnings);
  if (value.snapshotVersion !== SNAPSHOT_VERSION) errors.push("browser-output-snapshot-version-invalid");
  if (value.browserOutputVersion !== BROWSER_OUTPUT_VERSION) errors.push("browser-output-version-invalid");
  if (!normalizeId(value.browserOutputId)) errors.push("browser-output-snapshot-id-invalid");
  if (!TYPES.has(value.outputType)) errors.push("browser-output-snapshot-type-invalid");
  if (!STATES.has(value.status)) errors.push("browser-output-snapshot-status-invalid");
  if (!DISPLAY_MODES.has(value.displayMode)) errors.push("browser-output-snapshot-display-mode-invalid");
  if (!normalizeVisibility(value.visibility)) errors.push("browser-output-snapshot-visibility-invalid");
  errors.push(...validateResolution(value.resolution));
  errors.push(...validateSafeArea(value.safeArea, value.resolution));
  if (!nonNegativeInteger(value.projectionRevision)) errors.push("browser-output-snapshot-revision-invalid");
  if (!isIso(value.generatedAt)) errors.push("browser-output-snapshot-generated-at-invalid");
  return validationResult(errors.length === 0, errors, warnings);
}

export function resolveBrowserOutputRequest(input, options = {}) {
  const values = normalizeRequestInput(input);
  const allowed = new Set([
    "browserOutputId", "id", "outputType", "type", "routeId", "outputId", "displayMode",
    "visibility", "width", "height", "orientation"
  ]);
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key)) continue;
    if (containsUnsafeText(value)) throw browserOutputError("browser-output-request-unsafe", { key });
  }
  const outputType = normalizeType(values.outputType || values.type || options.outputType || "generic");
  if (!outputType) throw browserOutputError("browser-output-request-unsafe", { field: "outputType" });
  const routeType = outputType === "generic" ? normalizeRouteType(options.routeType || "program_main") : outputType;
  const compatibility = TYPE_COMPATIBILITY[routeType];
  const config = {
    browserOutputId: normalizeId(values.browserOutputId || values.id || options.browserOutputId) || "browser-output-lab",
    outputType,
    routeId: normalizeId(values.routeId || options.routeId) || `route-${compatibility.outputId}`,
    outputId: normalizeId(values.outputId || options.outputId) || compatibility.outputId,
    displayMode: DISPLAY_MODES.has(values.displayMode) ? values.displayMode : "fit",
    visibility: normalizeVisibility(values.visibility || options.visibility) || (routeType === "announcer_monitor" ? "operational" : "production"),
    resolution: {
      width: positiveInteger(values.width, options.width || 1920),
      height: positiveInteger(values.height, options.height || 1080)
    },
    orientation: ORIENTATIONS.has(values.orientation) ? values.orientation : "landscape",
    safeArea: normalizeSafeArea(options.safeArea),
    transparentBackground: options.transparentBackground === true,
    fullscreenAllowed: options.fullscreenAllowed !== false,
    metadata: { laboratory: true, requestSource: "browser-output.html" }
  };
  const validation = validateBrowserOutputConfig(config);
  if (!validation.valid) throw browserOutputError("browser-output-config-invalid", { errors: validation.errors });
  return cloneBrowserOutputResult(config);
}

export function setBrowserOutputDisplayMode(instance, displayMode, options = {}) {
  const runtime = requireInstance(instance);
  if (!DISPLAY_MODES.has(displayMode)) throw browserOutputError("browser-output-config-invalid", { field: "displayMode" });
  if (displayMode === "fullscreen" && !instance.fullscreenAllowed) {
    throw browserOutputError("browser-output-fullscreen-not-allowed");
  }
  const now = normalizeNow(options.now);
  if (runtime.config) runtime.config = freezeDeep({ ...cloneBrowserOutputResult(runtime.config), displayMode });
  syncInstance(instance, { displayMode, scaleMode: scaleModeFor(displayMode), updatedAt: now });
  if (runtime.root) renderBrowserOutput(instance, runtime);
  return getBrowserOutput(instance);
}

export function setBrowserOutputViewport(instance, viewport, options = {}) {
  const runtime = requireInstance(instance);
  const errors = validateViewport(viewport);
  if (errors.length) throw browserOutputError("browser-output-config-invalid", { errors });
  const normalized = { width: Number(viewport.width), height: Number(viewport.height) };
  const now = normalizeNow(options.now);
  if (runtime.config) runtime.config = freezeDeep({ ...cloneBrowserOutputResult(runtime.config), viewport: normalized });
  syncInstance(instance, { viewport: normalized, updatedAt: now });
  if (runtime.root) renderBrowserOutput(instance, runtime);
  return getBrowserOutput(instance);
}

export function buildBrowserOutputSnapshot(instance, options = {}) {
  const runtime = requireInstance(instance);
  const visibility = normalizeVisibility(options.visibility || instance.visibility) || "restricted";
  const context = sanitizeContext(runtime.context, visibility);
  const snapshot = {
    snapshotVersion: SNAPSHOT_VERSION,
    browserOutputVersion: BROWSER_OUTPUT_VERSION,
    browserOutputId: instance.browserOutputId,
    outputType: instance.outputType,
    routeId: instance.routeId,
    outputId: instance.outputId,
    status: instance.status,
    displayMode: instance.displayMode,
    visibility: mostRestrictiveVisibility(instance.visibility, visibility),
    resolution: cloneBrowserOutputResult(instance.resolution),
    orientation: instance.orientation,
    safeArea: cloneBrowserOutputResult(instance.safeArea),
    transparentBackground: instance.transparentBackground,
    mounted: instance.mounted,
    projectionRevision: instance.projectionRevision,
    routeRevision: instance.routeRevision,
    sourceRevision: instance.sourceRevision,
    warnings: uniqueStrings(instance.warnings || []),
    errors: uniqueStrings(instance.errors || []),
    generatedAt: normalizeNow(options.now),
    projectionSummary: sanitizeSummary(runtime.currentSummary, visibility),
    ...context
  };
  const safe = safeClone(snapshot, { visibility, rejectUnsafe: false, sanitizeText: true }).value;
  const validation = validateBrowserOutputSnapshot(safe);
  if (!validation.valid) throw browserOutputError("browser-output-snapshot-invalid", { errors: validation.errors });
  return cloneBrowserOutputResult(safe);
}

export function cloneBrowserOutputResult(value) {
  return safeClone(value, { visibility: "restricted", rejectUnsafe: false, sanitizeText: true }).value;
}

function normalizeConfig(config) {
  const outputType = normalizeType(config.outputType || "generic");
  return {
    browserOutputId: normalizeId(config.browserOutputId),
    outputType,
    routeId: normalizeId(config.routeId),
    outputId: normalizeId(config.outputId),
    name: normalizeText(config.name) || readableType(outputType),
    displayMode: DISPLAY_MODES.has(config.displayMode) ? config.displayMode : "fit",
    visibility: normalizeVisibility(config.visibility) || "production",
    resolution: normalizeResolution(config.resolution),
    orientation: ORIENTATIONS.has(config.orientation) ? config.orientation : "landscape",
    safeArea: normalizeSafeArea(config.safeArea),
    transparentBackground: config.transparentBackground === true,
    fullscreenAllowed: config.fullscreenAllowed === true,
    scaleMode: scaleModeFor(config.displayMode),
    viewport: config.viewport ? { width: Number(config.viewport.width), height: Number(config.viewport.height) } : null,
    tenantId: normalizeNullableId(config.tenantId),
    organizationId: normalizeNullableId(config.organizationId),
    clientId: normalizeNullableId(config.clientId),
    tournamentId: normalizeNullableId(config.tournamentId),
    competitionId: normalizeNullableId(config.competitionId),
    sessionId: normalizeNullableId(config.sessionId),
    metadata: normalizeMetadata(config.metadata)
  };
}

function normalizeProjectionEnvelope(projection, options = {}) {
  const safe = safeClone(projection, {
    visibility: options.visibility || "restricted",
    rejectUnsafe: true,
    sanitizeText: true
  });
  if (safe.errors.length) throw browserOutputError("browser-output-projection-invalid", { errors: safe.errors });
  const value = safe.value;
  return {
    routeId: normalizeId(value.routeId),
    routeType: normalizeRouteType(value.routeType),
    outputId: normalizeId(value.outputId),
    sourceType: normalizeSourceType(value.sourceType),
    sourceRevision: Number(value.sourceRevision),
    routeRevision: Number(value.routeRevision),
    status: value.status,
    visibility: normalizeVisibility(value.visibility),
    resolution: normalizeResolution(value.resolution),
    projection: cloneBrowserOutputResult(value.projection),
    warnings: uniqueStrings(value.warnings || []),
    errors: uniqueStrings(value.errors || []),
    resolvedAt: new Date(value.resolvedAt).toISOString(),
    tenantId: normalizeNullableId(value.tenantId),
    organizationId: normalizeNullableId(value.organizationId),
    clientId: normalizeNullableId(value.clientId),
    tournamentId: normalizeNullableId(value.tournamentId),
    competitionId: normalizeNullableId(value.competitionId),
    sessionId: normalizeNullableId(value.sessionId)
  };
}

function assertProjectionRevisionOrder(instance, runtime, projection) {
  if (instance.routeRevision !== null && projection.routeRevision < instance.routeRevision) {
    throw browserOutputError("browser-output-revision-regression", { field: "routeRevision" });
  }
  if (instance.sourceRevision !== null && projection.sourceRevision < instance.sourceRevision) {
    throw browserOutputError("browser-output-revision-regression", { field: "sourceRevision" });
  }
  if (runtime.currentEnvelope && projection.routeRevision === instance.routeRevision
    && projection.sourceRevision !== instance.sourceRevision) {
    throw browserOutputError("browser-output-revision-conflict", { field: "sourceRevision" });
  }
}

function resolveProjectionState(envelope) {
  if (envelope.status === "disabled") return "disabled";
  if (envelope.status === "stale") return "stale";
  if (envelope.status === "controlled-empty" || envelope.status === "cleared" || envelope.projection === null) return "empty";
  if (envelope.status === "error" || envelope.errors.length) return "error";
  const projectionStatus = normalizeText(envelope.projection?.status || envelope.projection?.availability);
  if (projectionStatus === "unavailable") return "unavailable";
  if (new Set(["stale", "offline"]).has(projectionStatus)) return "stale";
  if (envelope.projection?.empty === true || envelope.projection?.contentState === "empty") return "empty";
  return "ready";
}

function summarizeProjection(envelope, visibility) {
  const projection = isRecord(envelope.projection) ? envelope.projection : {};
  const common = {
    kind: normalizeText(projection.kind) || envelope.routeType,
    routeType: envelope.routeType,
    status: normalizeText(projection.status) || envelope.status
  };
  if (envelope.routeType === "program_main") {
    return sanitizeSummary({
      ...common,
      programId: projection.programId ?? null,
      templateId: projection.templateId ?? null,
      themeId: projection.themeId ?? null,
      outputId: projection.output?.outputId ?? envelope.outputId,
      componentCount: Array.isArray(projection.components) ? projection.components.length : 0,
      generatedAt: projection.generatedAt ?? envelope.resolvedAt
    }, visibility);
  }
  if (envelope.routeType === "announcer_monitor") {
    return sanitizeSummary({
      ...common,
      current: compactProjectionCurrent(projection.current),
      next: compactProjectionNext(projection.next),
      timer: compactEntity(projection.timer, ["status", "display", "formattedTime"]),
      sponsor: compactEntity(projection.sponsorMention, ["id", "name"]),
      standingsCount: Array.isArray(projection.standings) ? projection.standings.length : 0,
      notesCount: Array.isArray(projection.notes) ? projection.notes.length : 0,
      generatedAt: projection.generatedAt ?? envelope.resolvedAt
    }, visibility);
  }
  if (envelope.routeType === "timer_display") {
    return sanitizeSummary({
      ...common,
      timerId: projection.timerId ?? null,
      formattedTime: projection.formattedTime ?? null,
      elapsedMs: finiteOrNull(projection.elapsedMs),
      remainingMs: finiteOrNull(projection.remainingMs),
      sourceRevision: projection.sourceRevision ?? envelope.sourceRevision,
      contextRef: compactEntity(projection.contextRef, [
        "tournamentId", "competitionId", "charreadaId", "teamId", "participantId", "suerteId"
      ]),
      generatedAt: projection.generatedAt ?? envelope.resolvedAt
    }, visibility);
  }
  return sanitizeSummary({
    ...common,
    keys: Object.keys(projection).filter((key) => !DANGEROUS_KEYS.has(key)).slice(0, 20),
    generatedAt: projection.generatedAt ?? envelope.resolvedAt
  }, visibility);
}

function renderBrowserOutput(instance, runtime) {
  if (!runtime.root || !runtime.nodes) return;
  const { root, nodes } = runtime;
  root.setAttribute("data-output-type", instance.outputType);
  root.setAttribute("data-output-state", instance.status);
  root.setAttribute("data-route-id", instance.routeId);
  root.setAttribute("data-output-id", instance.outputId);
  root.setAttribute("data-display-mode", instance.displayMode);
  root.setAttribute("data-orientation", instance.orientation);
  root.setAttribute("data-transparent-background", instance.transparentBackground ? "true" : "false");
  applyRootPresentation(instance, nodes);
  nodes.status.replaceChildren();
  nodes.content.replaceChildren();
  nodes.diagnostics.replaceChildren();

  const documentRef = root.ownerDocument;
  const stateMessage = STATE_MESSAGES[instance.status];
  if (stateMessage) {
    const notice = documentRef.createElement("p");
    notice.className = `browser-output-state-message browser-output-state-${instance.status}`;
    notice.textContent = stateMessage;
    nodes.status.appendChild(notice);
  }
  if (new Set(["ready", "stale"]).has(instance.status) && runtime.currentSummary) {
    nodes.content.appendChild(buildTechnicalProjection(documentRef, instance, runtime.currentSummary));
  }
  if (instance.status === "error") {
    const code = documentRef.createElement("code");
    code.textContent = instance.errors[0] || "browser-output-error";
    nodes.status.appendChild(code);
  }
  nodes.diagnostics.appendChild(buildDiagnostics(documentRef, "Warnings", instance.warnings));
  nodes.diagnostics.appendChild(buildDiagnostics(documentRef, "Errors", instance.errors));
}

function applyRootPresentation(instance, nodes) {
  const { frame, safeArea } = nodes;
  const ratio = instance.resolution.width / instance.resolution.height;
  frame.style.aspectRatio = `${instance.resolution.width} / ${instance.resolution.height}`;
  frame.style.maxWidth = instance.displayMode === "native" ? `${instance.resolution.width}px` : "100%";
  frame.style.width = instance.viewport ? `${instance.viewport.width}px` : "100%";
  frame.style.maxHeight = instance.viewport ? `${instance.viewport.height}px` : "100%";
  frame.style.backgroundColor = instance.transparentBackground ? "transparent" : "#090b0e";
  frame.style.objectFit = instance.scaleMode;
  frame.style.setProperty?.("--browser-output-aspect-ratio", String(ratio));
  for (const side of ["top", "right", "bottom", "left"]) {
    safeArea.style[side] = `${instance.safeArea[side]}${instance.safeArea.unit === "pixel" ? "px" : "%"}`;
  }
}

function buildTechnicalProjection(documentRef, instance, summary) {
  const article = documentRef.createElement("article");
  article.className = "browser-output-technical-projection";
  const eyebrow = documentRef.createElement("span");
  eyebrow.className = "browser-output-technical-label";
  eyebrow.textContent = "PROYECCIÓN TÉCNICA SEGURA";
  const heading = documentRef.createElement("h2");
  heading.textContent = instance.name;
  const metrics = documentRef.createElement("dl");
  metrics.className = "browser-output-metrics";
  [
    ["Route", instance.routeId],
    ["Output", instance.outputId],
    ["Route revision", instance.routeRevision],
    ["Source revision", instance.sourceRevision],
    ["Resolución", `${instance.resolution.width} × ${instance.resolution.height}`],
    ["Visibilidad", instance.visibility]
  ].forEach(([label, value]) => appendDefinition(documentRef, metrics, label, value));
  const pre = documentRef.createElement("pre");
  pre.className = "browser-output-projection-summary";
  pre.textContent = JSON.stringify(summary, null, 2);
  article.append(eyebrow, heading, metrics, pre);
  return article;
}

function buildDiagnostics(documentRef, label, entries) {
  const group = documentRef.createElement("div");
  const heading = documentRef.createElement("strong");
  heading.textContent = label;
  group.appendChild(heading);
  const values = uniqueStrings(entries || []);
  const text = documentRef.createElement("span");
  text.textContent = values.length ? values.join(" · ") : "Sin registros";
  group.appendChild(text);
  return group;
}

function appendDefinition(documentRef, root, label, value) {
  const term = documentRef.createElement("dt");
  term.textContent = label;
  const definition = documentRef.createElement("dd");
  definition.textContent = value === null || value === undefined ? "—" : String(value);
  root.append(term, definition);
}

function validateMountTarget(target) {
  const errors = [];
  if (!target || target.nodeType !== 1 || !target.ownerDocument || typeof target.ownerDocument.createElement !== "function") {
    errors.push("browser-output-target-invalid");
  }
  const tagName = String(target?.tagName || "").toLowerCase();
  if (new Set(["script", "style", "iframe", "object", "embed", "svg"]).has(tagName)) errors.push("browser-output-target-tag-invalid");
  return validationResult(errors.length === 0, errors, []);
}

function validateResolution(resolution) {
  if (!isRecord(resolution)) return ["browser-output-resolution-invalid"];
  const width = Number(resolution.width);
  const height = Number(resolution.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0
    || !Number.isInteger(width) || !Number.isInteger(height)
    || width > MAX_RESOLUTION_EDGE || height > MAX_RESOLUTION_EDGE
    || width * height > MAX_RESOLUTION_PIXELS) return ["browser-output-resolution-invalid"];
  return [];
}

function validateViewport(viewport) {
  if (!isRecord(viewport)) return ["browser-output-viewport-invalid"];
  const width = Number(viewport.width);
  const height = Number(viewport.height);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? []
    : ["browser-output-viewport-invalid"];
}

function validateSafeArea(safeArea, resolution) {
  if (safeArea === undefined || safeArea === null) return [];
  if (!isRecord(safeArea)) return ["browser-output-safe-area-invalid"];
  const unit = safeArea.unit || "percent";
  if (!new Set(["percent", "pixel"]).has(unit)) return ["browser-output-safe-area-invalid"];
  const values = ["top", "right", "bottom", "left"].map((side) => Number(safeArea[side] ?? 0));
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return ["browser-output-safe-area-invalid"];
  const [top, right, bottom, left] = values;
  if (unit === "percent" && (top + bottom >= 100 || left + right >= 100)) return ["browser-output-safe-area-invalid"];
  if (unit === "pixel" && isRecord(resolution)) {
    if (top + bottom >= Number(resolution.height) || left + right >= Number(resolution.width)) {
      return ["browser-output-safe-area-invalid"];
    }
  }
  return [];
}

function validateContextCompatibility(config, projection) {
  const errors = [];
  for (const field of ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"]) {
    if (config[field] && projection[field] && config[field] !== projection[field]) {
      errors.push(`browser-output-${field}-conflict`);
    }
  }
  return errors;
}

function normalizeRequestInput(input) {
  if (typeof input === "string") {
    const query = input.includes("?") ? input.slice(input.indexOf("?") + 1) : input.replace(/^\?/, "");
    const params = new URLSearchParams(query);
    return Object.fromEntries(params.entries());
  }
  if (typeof URLSearchParams !== "undefined" && input instanceof URLSearchParams) return Object.fromEntries(input.entries());
  if (isRecord(input)) return { ...input };
  return {};
}

function safeClone(value, options = {}, state = { depth: 0, ancestors: new WeakSet(), path: "root", errors: [], warnings: [] }) {
  if (value === null || value === undefined) return { value: value ?? null, errors: state.errors, warnings: state.warnings };
  if (["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      state.errors.push(`${state.path}:non-finite-number`);
      return { value: null, errors: state.errors, warnings: state.warnings };
    }
    if (typeof value === "string") {
      const limited = value.slice(0, MAX_TEXT_LENGTH);
      if (value.length > MAX_TEXT_LENGTH) state.warnings.push(`${state.path}:text-truncated`);
      if (containsUnsafeText(limited)) {
        if (options.rejectUnsafe && !options.sanitizeText) state.errors.push(`${state.path}:unsafe-text`);
        return { value: sanitizeText(limited), errors: state.errors, warnings: [...state.warnings, `${state.path}:unsafe-text-sanitized`] };
      }
      return { value: limited, errors: state.errors, warnings: state.warnings };
    }
    return { value, errors: state.errors, warnings: state.warnings };
  }
  if (["function", "symbol", "bigint"].includes(typeof value)) {
    state.errors.push(`${state.path}:unsupported-value`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  if (state.depth >= MAX_DEPTH) {
    state.errors.push(`${state.path}:max-depth`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  if (state.ancestors.has(value)) {
    state.errors.push(`${state.path}:cycle`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  if (isDomLike(value)) {
    state.errors.push(`${state.path}:dom-value`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  state.ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) state.errors.push(`${state.path}:max-array-items`);
    const result = [];
    for (let index = 0; index < Math.min(value.length, MAX_ARRAY_ITEMS); index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || descriptor.get || descriptor.set) {
        state.errors.push(`${state.path}[${index}]:accessor`);
        continue;
      }
      const child = safeClone(descriptor.value, options, {
        ...state,
        depth: state.depth + 1,
        path: `${state.path}[${index}]`
      });
      result.push(child.value);
    }
    state.ancestors.delete(value);
    return { value: result, errors: state.errors, warnings: state.warnings };
  }
  const output = {};
  const keys = Reflect.ownKeys(value);
  if (keys.length > MAX_OBJECT_KEYS) state.errors.push(`${state.path}:max-object-keys`);
  for (const key of keys.slice(0, MAX_OBJECT_KEYS)) {
    if (typeof key === "symbol") {
      state.errors.push(`${state.path}:symbol-key`);
      continue;
    }
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (DANGEROUS_KEYS.has(key) || RUNTIME_KEYS.has(normalizedKey) || SECRET_KEYS.has(normalizedKey) || UNSAFE_CODE_KEYS.has(normalizedKey)) {
      if (options.rejectUnsafe) state.errors.push(`${state.path}.${key}:forbidden-key`);
      continue;
    }
    if (options.visibility === "public" && PUBLIC_PRIVATE_KEYS.has(normalizedKey)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) {
      state.errors.push(`${state.path}.${key}:accessor`);
      continue;
    }
    const child = safeClone(descriptor.value, options, {
      ...state,
      depth: state.depth + 1,
      path: `${state.path}.${key}`
    });
    output[key] = child.value;
  }
  state.ancestors.delete(value);
  return { value: output, errors: state.errors, warnings: state.warnings };
}

function sanitizeText(value) {
  if (UNSAFE_URI.test(value)) return "[contenido bloqueado]";
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function containsUnsafeText(value) {
  return typeof value === "string" && (UNSAFE_URI.test(value) || UNSAFE_MARKUP.test(value));
}

function sanitizeSummary(summary, visibility) {
  if (!summary) return null;
  return safeClone(summary, { visibility, rejectUnsafe: false, sanitizeText: true }).value;
}

function sanitizeContext(context, visibility) {
  const safe = safeClone(context, { visibility, rejectUnsafe: false }).value || {};
  return Object.fromEntries(Object.entries(safe).filter(([, value]) => value !== null && value !== undefined));
}

function readContext(value) {
  return {
    tenantId: normalizeNullableId(value?.tenantId),
    organizationId: normalizeNullableId(value?.organizationId),
    clientId: normalizeNullableId(value?.clientId),
    tournamentId: normalizeNullableId(value?.tournamentId),
    competitionId: normalizeNullableId(value?.competitionId),
    sessionId: normalizeNullableId(value?.sessionId)
  };
}

function readProjectionContext(envelope) {
  const projection = envelope?.projection || {};
  const direct = readContext(envelope);
  const context = readContext(projection.context || projection.contextRef || {});
  return mergeContext(direct, context);
}

function mergeContext(base, next) {
  const result = {};
  for (const field of ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"]) {
    result[field] = next?.[field] || base?.[field] || null;
  }
  return result;
}

function emptyContext() {
  return { tenantId: null, organizationId: null, clientId: null, tournamentId: null, competitionId: null, sessionId: null };
}

function compactProjectionCurrent(value) {
  if (!isRecord(value)) return null;
  return {
    team: compactEntity(value.team, ["id", "name", "total", "position"]),
    participant: compactEntity(value.participant, ["id", "name", "total", "position"]),
    horse: compactEntity(value.horse, ["id", "name"]),
    suerte: compactEntity(value.suerte, ["id", "name", "status"]),
    score: compactEntity(value.score, ["id", "total", "status"]),
    position: value.position ?? null
  };
}

function compactProjectionNext(value) {
  if (!isRecord(value)) return null;
  return {
    team: compactEntity(value.team, ["id", "name"]),
    participant: compactEntity(value.participant, ["id", "name"]),
    horse: compactEntity(value.horse, ["id", "name"]),
    suerte: compactEntity(value.suerte, ["id", "name"])
  };
}

function compactEntity(value, fields) {
  if (!isRecord(value)) return value === null || value === undefined ? null : normalizeText(value);
  const result = {};
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(value, field)) result[field] = cloneBrowserOutputResult(value[field]);
  });
  return result;
}

function normalizeMetadata(value) {
  if (!isRecord(value)) return {};
  return safeClone(value, { visibility: "restricted", rejectUnsafe: true, sanitizeText: true }).value || {};
}

function normalizeSafeArea(value) {
  const safe = isRecord(value) ? value : {};
  return {
    top: finiteNonNegative(safe.top, 0),
    right: finiteNonNegative(safe.right, 0),
    bottom: finiteNonNegative(safe.bottom, 0),
    left: finiteNonNegative(safe.left, 0),
    unit: new Set(["percent", "pixel"]).has(safe.unit) ? safe.unit : "percent"
  };
}

function normalizeResolution(value) {
  return { width: Number(value?.width), height: Number(value?.height) };
}

function scaleModeFor(displayMode) {
  return displayMode === "fill" ? "cover" : "contain";
}

function mostRestrictiveVisibility(...values) {
  return values.map(normalizeVisibility).filter(Boolean).sort((left, right) => VISIBILITY_RANK[right] - VISIBILITY_RANK[left])[0] || "restricted";
}

function normalizeVisibility(value) {
  return VISIBILITIES.includes(value) ? value : null;
}

function normalizeType(value) {
  return TYPES.has(value) ? value : null;
}

function normalizeRouteType(value) {
  return ROUTE_TYPES.has(value) ? value : null;
}

function normalizeSourceType(value) {
  return SOURCE_TYPES.has(value) ? value : null;
}

function normalizeId(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(text) ? text : null;
}

function normalizeNullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  return String(value).slice(0, MAX_TEXT_LENGTH);
}

function normalizeNow(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) throw browserOutputError("browser-output-invalid", { field: "timestamp" });
  return date.toISOString();
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function finiteNonNegative(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function isIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function validStringArray(value) {
  return Array.isArray(value) && value.length <= 100 && value.every((entry) => typeof entry === "string" && entry.length <= 500);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDomLike(value) {
  if (!isRecord(value)) return false;
  const nodeType = Object.getOwnPropertyDescriptor(value, "nodeType")?.value;
  const appendChild = Object.getOwnPropertyDescriptor(value, "appendChild")?.value;
  return nodeType === 1 || nodeType === 9 || typeof appendChild === "function";
}

function stableFingerprint(value) {
  return JSON.stringify(sortForFingerprint(value));
}

function sortForFingerprint(value) {
  if (Array.isArray(value)) return value.map(sortForFingerprint);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortForFingerprint(value[key])]));
}

function syncInstance(instance, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    instance[key] = cloneBrowserOutputResult(value);
  });
}

function cloneDescriptor(instance) {
  return cloneBrowserOutputResult(instance);
}

function requireInstance(instance) {
  const runtime = INSTANCES.get(instance);
  if (!runtime || !isRecord(instance)) throw browserOutputError("browser-output-invalid");
  if (runtime.destroyed || instance.status === "destroyed") throw browserOutputError("browser-output-destroyed");
  return runtime;
}

function validationResult(valid, errors, warnings) {
  return {
    valid,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    browserOutputVersion: BROWSER_OUTPUT_VERSION
  };
}

function projectionValidation(valid, errors, warnings, code = null, visibility = "restricted") {
  return { ...validationResult(valid, errors, warnings), code, visibility };
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value.length).map((value) => value.slice(0, 500)))];
}

function readableType(type) {
  return ({
    generic: "Browser Output Lab",
    program_main: "Program Main",
    announcer_monitor: "Announcer Monitor",
    timer_display: "Timer Display"
  })[type] || "Browser Output";
}

function normalizeErrorCode(error, fallback) {
  return normalizeText(error?.code || error?.message) || fallback;
}

function browserOutputError(code, details = {}) {
  return new BroadcastBrowserOutputError(code, details);
}

function normalizeBrowserOutputError(error, fallback) {
  return error instanceof BroadcastBrowserOutputError ? error : browserOutputError(fallback);
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((entry) => freezeDeep(entry, seen));
  return Object.freeze(value);
}

export function initializeBrowserOutputLab(documentRef = globalThis.document) {
  if (!documentRef?.body?.hasAttribute?.("data-browser-output-lab")) return null;
  if (documentRef.body.getAttribute("data-browser-output-initialized") === "true") return null;
  documentRef.body.setAttribute("data-browser-output-initialized", "true");

  const refs = {
    fixture: documentRef.getElementById("browser-output-fixture"),
    displayMode: documentRef.getElementById("browser-output-display-mode"),
    resolution: documentRef.getElementById("browser-output-resolution"),
    orientation: documentRef.getElementById("browser-output-orientation"),
    transparent: documentRef.getElementById("browser-output-transparent"),
    stage: documentRef.getElementById("browser-output-stage"),
    inspector: documentRef.getElementById("browser-output-inspector-value"),
    warnings: documentRef.getElementById("browser-output-warnings"),
    errors: documentRef.getElementById("browser-output-errors"),
    status: documentRef.getElementById("browser-output-instance-status"),
    stateValue: documentRef.getElementById("browser-output-state-value"),
    rootValue: documentRef.getElementById("browser-output-root-value"),
    projectionRevision: documentRef.getElementById("browser-output-projection-revision"),
    actions: [...documentRef.querySelectorAll("[data-browser-output-action]")]
  };
  if (!refs.stage || !refs.fixture) return null;

  const request = resolveBrowserOutputRequest(documentRef.defaultView?.location?.search || "", {
    browserOutputId: "browser-output-lab",
    fullscreenAllowed: true
  });
  const lab = {
    instance: createBrowserOutput({ browserOutputId: request.browserOutputId, name: "Browser Output Lab" }),
    request,
    revision: 1,
    lastError: null
  };

  const renderLab = (snapshot = null) => {
    const descriptor = cloneBrowserOutputResult(lab.instance);
    const destroyed = descriptor.status === "destroyed";
    const rootCount = refs.stage.children.length;
    setText(refs.status, readableState(descriptor.status));
    setText(refs.stateValue, readableState(descriptor.status));
    setText(refs.rootValue, String(rootCount));
    setText(refs.projectionRevision, String(descriptor.projectionRevision || 0));
    setText(refs.warnings, descriptor.warnings?.length ? descriptor.warnings.join(" · ") : "Sin registros");
    setText(refs.errors, lab.lastError || (descriptor.errors?.length ? descriptor.errors.join(" · ") : "Sin registros"));
    const inspectorValue = snapshot || (!destroyed && descriptor.status !== "created"
      ? buildBrowserOutputSnapshot(lab.instance, { visibility: descriptor.visibility })
      : descriptor);
    setText(refs.inspector, JSON.stringify(inspectorValue, null, 2));
    refs.actions.forEach((button) => {
      const action = button.getAttribute("data-browser-output-action");
      button.disabled = actionDisabled(action, descriptor.status);
    });
  };

  const run = async (action, button) => {
    lab.lastError = null;
    try {
      if (action === "configure") {
        if (lab.instance.status === "destroyed") throw browserOutputError("browser-output-destroyed");
        const nextConfig = buildLabConfig(refs, lab.request);
        const routeChanged = lab.instance.status !== "created"
          && (lab.instance.routeId !== nextConfig.routeId || lab.instance.outputId !== nextConfig.outputId);
        const shouldRemount = routeChanged && lab.instance.mounted;
        if (routeChanged) {
          destroyBrowserOutput(lab.instance);
          lab.instance = createBrowserOutput({ browserOutputId: lab.request.browserOutputId, name: "Browser Output Lab" });
          lab.revision = 1;
        } else if (lab.instance.status !== "created") {
          lab.revision = Math.max(lab.revision, lab.instance.routeRevision || 0, lab.instance.sourceRevision || 0) + 1;
        }
        configureBrowserOutput(lab.instance, nextConfig, {});
        if (shouldRemount) mountBrowserOutput(lab.instance, refs.stage);
      } else if (action === "mount") {
        mountBrowserOutput(lab.instance, refs.stage);
      } else if (action === "apply") {
        applyBrowserOutputProjection(lab.instance, buildLabProjection(refs.fixture.value, refs, lab.revision));
      } else if (action === "update") {
        lab.revision += 1;
        updateBrowserOutput(lab.instance, buildLabProjection(refs.fixture.value, refs, lab.revision));
      } else if (action === "clear") {
        clearBrowserOutput(lab.instance);
      } else if (action === "fullscreen") {
        setBrowserOutputDisplayMode(lab.instance, "fullscreen");
        refs.displayMode.value = "fullscreen";
        const controlledRoot = refs.stage.querySelector("[data-browser-output-id]");
        if (typeof controlledRoot?.requestFullscreen === "function") {
          await controlledRoot.requestFullscreen();
        } else {
          lab.lastError = "browser-output-fullscreen-api-unavailable";
        }
      } else if (action === "snapshot") {
        const snapshot = buildBrowserOutputSnapshot(lab.instance, { visibility: lab.instance.visibility });
        setText(refs.inspector, JSON.stringify(snapshot, null, 2));
        if (globalThis.navigator?.clipboard?.writeText) {
          await globalThis.navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
          temporaryButtonText(button, "Copiado", "Copiar Snapshot");
        } else {
          temporaryButtonText(button, "Snapshot en inspector", "Copiar Snapshot");
        }
        renderLab(snapshot);
        return;
      } else if (action === "destroy") {
        destroyBrowserOutput(lab.instance);
      }
      renderLab();
    } catch (error) {
      lab.lastError = normalizeErrorCode(error, "browser-output-error");
      renderLab();
    }
  };

  refs.actions.forEach((button) => {
    button.addEventListener("click", () => run(button.getAttribute("data-browser-output-action"), button));
  });
  refs.displayMode?.addEventListener("change", () => {
    if (!new Set(["configured", "mounted", "ready", "empty", "stale", "unavailable", "disabled", "cleared"]).has(lab.instance.status)) return;
    try {
      setBrowserOutputDisplayMode(lab.instance, refs.displayMode.value);
      renderLab();
    } catch (error) {
      lab.lastError = normalizeErrorCode(error, "browser-output-error");
      renderLab();
    }
  });
  renderLab();
  return { lab, render: renderLab };
}

function buildLabConfig(refs, request) {
  const fixture = labFixtureDefinition(refs.fixture.value);
  const [width, height] = refs.resolution.value.split("x").map(Number);
  const outputType = request.outputType === "generic" ? "generic" : request.outputType;
  return {
    browserOutputId: request.browserOutputId,
    outputType,
    routeId: fixture.routeId,
    outputId: fixture.outputId,
    name: fixture.name,
    displayMode: refs.displayMode.value,
    visibility: fixture.visibility,
    resolution: { width, height },
    orientation: refs.orientation.value,
    safeArea: { top: 5, right: 5, bottom: 5, left: 5, unit: "percent" },
    transparentBackground: refs.transparent.checked,
    fullscreenAllowed: true,
    tournamentId: "tournament_browser_output_lab",
    competitionId: "competition_browser_output_lab",
    metadata: { laboratory: true, physicalOutput: false }
  };
}

function buildLabProjection(fixtureId, refs, revision) {
  const definition = labFixtureDefinition(fixtureId);
  const [width, height] = refs.resolution.value.split("x").map(Number);
  const now = new Date().toISOString();
  return {
    routeId: definition.routeId,
    routeType: definition.routeType,
    outputId: definition.outputId,
    sourceType: definition.sourceType,
    sourceRevision: revision,
    routeRevision: revision,
    status: definition.routeStatus,
    visibility: definition.visibility,
    resolution: { width, height },
    projection: definition.projection(now, revision),
    warnings: definition.routeStatus === "stale" ? ["output-route-source-stale"] : [],
    errors: [],
    resolvedAt: now,
    tournamentId: "tournament_browser_output_lab",
    competitionId: "competition_browser_output_lab"
  };
}

function labFixtureDefinition(fixtureId) {
  const timer = (status, formattedTime = "00:34.2") => (now, revision) => ({
    kind: "timer-display",
    timerId: "timer_browser_output_lab",
    status,
    formattedTime: new Set(["unavailable", "offline"]).has(status) ? null : formattedTime,
    elapsedMs: status === "ready" ? 0 : 34200,
    remainingMs: status === "finished" ? 0 : 25800,
    sourceRevision: revision,
    contextRef: {
      tournamentId: "tournament_browser_output_lab",
      competitionId: "competition_browser_output_lab",
      suerteId: "piales"
    },
    suerte: { id: "piales", name: "Piales en el Lienzo" },
    generatedAt: now
  });
  const definitions = {
    "program-empty": {
      name: "Program Main vacío",
      routeType: "program_main",
      routeId: "route-program-main",
      outputId: "program-main",
      sourceType: "program_snapshot",
      visibility: "public",
      routeStatus: "controlled-empty",
      projection: (now) => ({ kind: "program-main", contentState: "empty", generatedAt: now })
    },
    "program-active": {
      name: "Program Main activo",
      routeType: "program_main",
      routeId: "route-program-main",
      outputId: "program-main",
      sourceType: "program_snapshot",
      visibility: "public",
      routeStatus: "routed",
      projection: (now) => ({
        kind: "program-main",
        programId: "program_browser_output_lab",
        templateId: "template_scoreboard_lab",
        themeId: "theme_charropro_lab",
        components: [{ componentId: "scoreboard_lab", visible: true, value: 0 }],
        generatedAt: now
      })
    },
    "announcer-operational": {
      name: "Announcer Monitor operacional",
      routeType: "announcer_monitor",
      routeId: "route-announcer-monitor",
      outputId: "announcer-monitor",
      sourceType: "announcer_projection",
      visibility: "operational",
      routeStatus: "routed",
      projection: (now) => ({
        kind: "announcer-monitor",
        current: {
          participant: { id: "participant_1", name: "Alejandro Montaño", position: 1 },
          horse: { id: "horse_1", name: "Lucero" },
          suerte: { id: "piales", name: "Piales en el Lienzo", status: "active" },
          score: { id: "score_1", total: 32, status: "published" }
        },
        next: { participant: { id: "participant_2", name: "Pedro López" } },
        standings: [{ id: "participant_1", name: "Alejandro Montaño", total: 32 }],
        timer: { status: "running", display: "00:34.2" },
        sponsorMention: { id: "sponsor_1", name: "Patrocinador de prueba" },
        notes: ["Mensaje autorizado para locución"],
        generatedAt: now
      })
    },
    "timer-ready": timerFixture("Timer Display ready", "ready", timer("ready", "00:00.0")),
    "timer-running": timerFixture("Timer Display running", "running", timer("running")),
    "timer-paused": timerFixture("Timer Display paused", "paused", timer("paused")),
    "timer-stopped": timerFixture("Timer Display stopped", "stopped", timer("stopped")),
    "timer-finished": timerFixture("Timer Display finished", "finished", timer("finished", "01:00.0")),
    "timer-stale": { ...timerFixture("Timer Display stale", "stale", timer("stale")), routeStatus: "stale" },
    "output-unavailable": timerFixture("Output unavailable", "unavailable", timer("unavailable")),
    "output-disabled": {
      ...timerFixture("Output disabled", "disabled", () => null),
      routeStatus: "disabled"
    }
  };
  return definitions[fixtureId] || definitions["program-active"];
}

function timerFixture(name, status, projection) {
  return {
    name,
    status,
    routeType: "timer_display",
    routeId: "route-timer-display",
    outputId: "timer-display",
    sourceType: "timer_projection",
    visibility: "public",
    routeStatus: status === "stale" ? "stale" : "routed",
    projection
  };
}

function actionDisabled(action, status) {
  if (status === "destroyed") return true;
  if (action === "configure") return false;
  if (status === "created") return action !== "configure";
  if (action === "mount") return !new Set(["configured", "cleared"]).has(status);
  if (action === "apply") return !new Set(["mounted", "cleared", "ready", "empty", "stale", "unavailable", "disabled"]).has(status);
  if (action === "update") return !new Set(["ready", "empty", "stale", "unavailable", "disabled"]).has(status);
  if (action === "clear") return !new Set(["mounted", "ready", "empty", "stale", "unavailable", "disabled"]).has(status);
  if (action === "fullscreen" || action === "snapshot") return !new Set(["mounted", "ready", "empty", "stale", "unavailable", "disabled", "cleared"]).has(status);
  if (action === "destroy") return status === "created";
  return false;
}

function setText(node, value) {
  if (node) node.textContent = String(value ?? "");
}

function temporaryButtonText(button, active, fallback) {
  if (!button) return;
  button.textContent = active;
  globalThis.setTimeout?.(() => { button.textContent = fallback; }, 1200);
}

function readableState(state) {
  return String(state || "uninitialized").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

if (typeof document !== "undefined" && document.body?.hasAttribute?.("data-browser-output-lab")) {
  initializeBrowserOutputLab(document);
}
