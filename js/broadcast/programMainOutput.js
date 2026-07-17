import {
  applyBrowserOutputProjection,
  clearBrowserOutput,
  configureBrowserOutput,
  createBrowserOutput,
  destroyBrowserOutput,
  getBrowserOutput,
  mountBrowserOutput,
  setBrowserOutputDisplayMode,
  setBrowserOutputViewport,
  validateBrowserOutputProjection
} from "./browserOutput.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import {
  clearBroadcastComponentRenderer,
  createComponentRenderer,
  destroyComponentRenderer,
  getComponentRenderWarnings,
  renderBroadcastComponent
} from "./componentRenderer.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import {
  buildComponentInstance,
  createBroadcastComponent
} from "./componentLibrary.js?v=20260713-component-library-001-components-v1";

export const PROGRAM_MAIN_OUTPUT_VERSION = "1.0.0";

export const PROGRAM_MAIN_OUTPUT_STATES = Object.freeze([
  "uninitialized", "created", "configured", "mounting", "mounted", "applying", "ready",
  "empty", "stale", "disabled", "unavailable", "error", "cleared", "destroyed"
]);

export const PROGRAM_MAIN_OUTPUT_DISPLAY_MODES = Object.freeze([
  "fit", "fill", "native", "responsive", "fullscreen"
]);

export const PROGRAM_MAIN_OUTPUT_RENDER_STATES = Object.freeze([
  "idle", "loading", "rendering", "ready", "empty", "stale", "disabled", "unavailable",
  "error", "cleared", "destroyed"
]);

export const PROGRAM_MAIN_OUTPUT_ERROR_CODES = Object.freeze({
  DESTROYED: "program-main-output-destroyed",
  INVALID_INSTANCE: "program-main-output-invalid",
  CONFIG_INVALID: "program-main-output-config-invalid",
  NOT_CONFIGURED: "program-main-output-not-configured",
  NOT_MOUNTED: "program-main-output-not-mounted",
  TARGET_INVALID: "program-main-output-target-invalid",
  ROOT_CONFLICT: "program-main-output-root-conflict",
  PROJECTION_INVALID: "program-main-output-projection-invalid",
  PROJECTION_TYPE: "program-main-output-projection-type-incompatible",
  PROJECTION_UNSAFE: "program-main-output-projection-unsafe",
  REVISION_REGRESSION: "program-main-output-revision-regression",
  REVISION_CONFLICT: "program-main-output-revision-conflict",
  RENDER_FAILED: "program-main-output-render-failed",
  SNAPSHOT_INVALID: "program-main-output-snapshot-invalid"
});

const SNAPSHOT_VERSION = "1.0.0";
const INSTANCES = new WeakMap();
const STATES = new Set(PROGRAM_MAIN_OUTPUT_STATES);
const DISPLAY_MODES = new Set(PROGRAM_MAIN_OUTPUT_DISPLAY_MODES);
const RENDER_STATES = new Set(PROGRAM_MAIN_OUTPUT_RENDER_STATES);
const VISIBILITIES = new Set(["public", "production"]);
const ORIENTATIONS = new Set(["landscape", "portrait", "ultra_wide", "auto"]);
const ROUTE_STATUSES = new Set(["routed", "controlled-empty", "stale", "disabled", "error", "unavailable", "cleared"]);
const PROGRAM_STATES = new Set(["program", "active", "ready", "controlled-empty", "stale", "disabled", "unavailable", "error"]);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const UNSAFE_URI = /^(?:\s*(?:javascript|file|vbscript)\s*:|\s*data\s*:\s*text\/html)/i;
const UNSAFE_MARKUP = /<\s*\/?\s*(?:script|iframe|object|embed|style|link|img)\b|\bon(?:error|load|click)\s*=/i;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FORBIDDEN_KEYS = new Set([
  "callback", "callbacks", "connection", "connections", "dom", "element", "firebase", "firebaseref",
  "handler", "handlers", "hook", "hooks", "listener", "listeners", "node", "plugin", "plugins",
  "renderer", "runtime", "socket", "sockets", "signedurl", "target"
]);
const SECRET_KEYS = new Set([
  "accesskey", "accesstoken", "apikey", "auth", "authorization", "cookie", "cookies", "credential",
  "credentials", "password", "privatekey", "refreshtoken", "secret", "secrets", "token"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "actor", "clientid", "createdby", "operator", "operatorid", "organizationid", "sessionid", "tenantid", "updatedby"
]);
const PUBLIC_OPERATIONAL_KEYS = new Set(["internalnotes", "notes", "operationalnotes", "privatecontext"]);
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 20000;
const MAX_COMPONENTS = 300;
const MAX_LAYERS = 300;
const MAX_RESOLUTION_EDGE = 8192;
const MAX_RESOLUTION_PIXELS = 33554432;

const DEFAULT_CONFIG = Object.freeze({
  programMainOutputId: "program-main-output",
  browserOutputId: "browser-output-program-main",
  routeId: "route-program-main",
  outputId: "program-main",
  routeType: "program_main",
  sourceType: "program_snapshot",
  name: "Program Main Output",
  displayMode: "fit",
  visibility: "public",
  resolution: Object.freeze({ width: 1920, height: 1080 }),
  orientation: "landscape",
  safeArea: Object.freeze({ top: 0, right: 0, bottom: 0, left: 0, unit: "percent" }),
  transparentBackground: true,
  viewport: null,
  metadata: Object.freeze({})
});

export class BroadcastProgramMainOutputError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastProgramMainOutputError";
    this.code = code;
    this.details = safeClone(details, { visibility: "production", rejectUnsafe: false }).value || {};
  }
}

export function createProgramMainOutput(definition = {}, options = {}) {
  const safe = safeClone(definition, { visibility: "production", rejectUnsafe: true });
  if (safe.errors.length) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.CONFIG_INVALID, { errors: safe.errors });
  const now = normalizeNow(options.now);
  const programMainOutputId = normalizeId(safe.value?.programMainOutputId) || DEFAULT_CONFIG.programMainOutputId;
  const browserOutputId = normalizeId(safe.value?.browserOutputId) || DEFAULT_CONFIG.browserOutputId;
  const browserOutput = createBrowserOutput({
    browserOutputId,
    name: normalizeText(safe.value?.name) || DEFAULT_CONFIG.name,
    metadata: safe.value?.metadata || {}
  }, { now });
  const instance = {
    programMainOutputVersion: PROGRAM_MAIN_OUTPUT_VERSION,
    programMainOutputId,
    browserOutputId,
    routeId: DEFAULT_CONFIG.routeId,
    outputId: DEFAULT_CONFIG.outputId,
    routeType: DEFAULT_CONFIG.routeType,
    sourceType: DEFAULT_CONFIG.sourceType,
    name: normalizeText(safe.value?.name) || DEFAULT_CONFIG.name,
    status: "created",
    renderStatus: "idle",
    displayMode: DEFAULT_CONFIG.displayMode,
    visibility: DEFAULT_CONFIG.visibility,
    resolution: { ...DEFAULT_CONFIG.resolution },
    orientation: DEFAULT_CONFIG.orientation,
    safeArea: { ...DEFAULT_CONFIG.safeArea },
    transparentBackground: DEFAULT_CONFIG.transparentBackground,
    viewport: null,
    mounted: false,
    rootId: `program-main-output-root-${programMainOutputId}`,
    programId: null,
    templateId: null,
    themeId: null,
    appliedThemeId: null,
    compositionId: null,
    rootComponentId: null,
    sourceRevision: null,
    routeRevision: null,
    projectionRevision: 0,
    createdAt: now,
    updatedAt: now,
    mountedAt: null,
    lastProjectionAt: null,
    clearedAt: null,
    destroyedAt: null,
    warnings: [],
    errors: [],
    metadata: normalizeMetadata(safe.value?.metadata, "production")
  };
  INSTANCES.set(instance, {
    browserOutput,
    config: null,
    container: null,
    root: null,
    stage: null,
    renderer: null,
    rendererHost: null,
    currentEnvelope: null,
    currentProjection: null,
    lastValidEnvelope: null,
    lastValidProjection: null,
    lastFingerprint: null,
    destroyed: false,
    debug: options.debug === true
  });
  return instance;
}

export function configureProgramMainOutput(instance, config = {}, options = {}) {
  const runtime = requireInstance(instance);
  const merged = {
    ...DEFAULT_CONFIG,
    ...(runtime.config || {}),
    ...(isRecord(config) ? config : {}),
    programMainOutputId: instance.programMainOutputId,
    browserOutputId: instance.browserOutputId
  };
  const validation = validateProgramMainOutputConfig(merged);
  if (!validation.valid) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.CONFIG_INVALID, { errors: validation.errors });
  const normalized = normalizeConfig(merged);
  configureBrowserOutput(runtime.browserOutput, browserConfig(normalized), { now: options.now });
  runtime.config = freezeDeep(cloneProgramMainOutputResult(normalized));
  syncInstance(instance, {
    ...normalized,
    status: runtime.root ? "mounted" : "configured",
    renderStatus: runtime.root ? instance.renderStatus : "idle",
    mounted: Boolean(runtime.root),
    updatedAt: normalizeNow(options.now),
    warnings: validation.warnings,
    errors: []
  });
  if (runtime.root) applyRootPresentation(instance, runtime);
  return getProgramMainOutput(instance);
}

export function mountProgramMainOutput(instance, container, options = {}) {
  const runtime = requireInstance(instance);
  if (!runtime.config) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.NOT_CONFIGURED);
  if (!validMountTarget(container)) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.TARGET_INVALID);
  if (runtime.root) {
    if (runtime.container !== container) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.ROOT_CONFLICT);
    return getProgramMainOutput(instance);
  }
  const now = normalizeNow(options.now);
  syncInstance(instance, { status: "mounting", renderStatus: "loading", updatedAt: now });
  try {
    mountBrowserOutput(runtime.browserOutput, container, { now });
    const root = findBrowserRoot(container, instance.browserOutputId);
    if (!root) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.TARGET_INVALID, { reason: "browser-root-missing" });
    root.setAttribute("id", instance.rootId);
    root.className = `${String(root.className || "")} program-main-output-root`.trim();
    [...(root.children || [])]
      .find((child) => String(child.className || "").split(/\s+/).includes("browser-output-frame"))
      ?.remove?.();
    safeAttribute(root, "data-program-main-output-id", instance.programMainOutputId);
    safeAttribute(root, "data-output-state", "mounted");
    safeAttribute(root, "data-route-id", instance.routeId);
    safeAttribute(root, "data-output-id", instance.outputId);
    safeAttribute(root, "data-program-id", "");
    safeAttribute(root, "data-layer-count", "0");
    const stage = root.ownerDocument.createElement("div");
    stage.className = "program-main-output-stage";
    safeAttribute(stage, "aria-hidden", "true");
    root.appendChild(stage);
    runtime.container = container;
    runtime.root = root;
    runtime.stage = stage;
    syncInstance(instance, {
      status: "mounted",
      renderStatus: "idle",
      mounted: true,
      mountedAt: now,
      updatedAt: now,
      errors: []
    });
    applyRootPresentation(instance, runtime);
    return getProgramMainOutput(instance);
  } catch (error) {
    runtime.root?.remove?.();
    runtime.container = null;
    runtime.root = null;
    runtime.stage = null;
    syncInstance(instance, {
      status: "error",
      renderStatus: "error",
      mounted: false,
      updatedAt: now,
      errors: [error?.code || PROGRAM_MAIN_OUTPUT_ERROR_CODES.TARGET_INVALID]
    });
    throw normalizeOutputError(error, PROGRAM_MAIN_OUTPUT_ERROR_CODES.TARGET_INVALID);
  }
}

export function applyProgramMainProjection(instance, envelope, options = {}) {
  const runtime = requireInstance(instance);
  requireMounted(runtime);
  const validation = validateProgramMainProjection(envelope, {
    config: runtime.config,
    visibility: options.visibility,
    context: options.context
  });
  if (!validation.valid) {
    throw outputError(validation.code || PROGRAM_MAIN_OUTPUT_ERROR_CODES.PROJECTION_INVALID, { errors: validation.errors });
  }
  const normalized = normalizeEnvelope(envelope, validation.visibility);
  assertRevisionOrder(instance, runtime, normalized);
  const fingerprint = stableFingerprint(normalized);
  if (instance.routeRevision === normalized.routeRevision && instance.sourceRevision === normalized.sourceRevision) {
    if (runtime.lastFingerprint === fingerprint) return getProgramMainOutput(instance);
    throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.REVISION_CONFLICT, {
      routeRevision: normalized.routeRevision,
      sourceRevision: normalized.sourceRevision
    });
  }

  const now = normalizeNow(options.now || normalized.resolvedAt);
  const nextState = projectionState(normalized);
  const nextProjection = nextState === "stale"
    ? runtime.lastValidProjection ? cloneProgramMainOutputResult(runtime.lastValidProjection) : null
    : normalized.projection;
  let preparedRender = null;
  if (nextState === "ready") preparedRender = prepareRender(runtime, instance, nextProjection, now);

  syncInstance(instance, { status: "applying", renderStatus: "rendering", updatedAt: now });
  try {
    applyBrowserOutputProjection(runtime.browserOutput, browserCompatibleEnvelope(normalized), {
      now,
      visibility: validation.visibility,
      context: options.context
    });
    if (nextState === "ready") commitPreparedRender(runtime, preparedRender);
    else if (nextState !== "stale") clearRenderedComposition(runtime, now);

    runtime.currentEnvelope = freezeDeep(cloneProgramMainOutputResult(normalized));
    runtime.currentProjection = nextProjection ? freezeDeep(cloneProgramMainOutputResult(nextProjection)) : null;
    runtime.lastFingerprint = fingerprint;
    if (nextState === "ready") {
      runtime.lastValidEnvelope = freezeDeep(cloneProgramMainOutputResult(normalized));
      runtime.lastValidProjection = freezeDeep(cloneProgramMainOutputResult(nextProjection));
    } else if (nextState !== "stale") {
      runtime.lastValidEnvelope = null;
      runtime.lastValidProjection = null;
    }
    const identity = nextProjection && nextState !== "empty" ? projectionIdentity(nextProjection) : emptyIdentity();
    const effectiveSafeArea = nextProjection?.composition?.safeArea
      ? normalizeCompositionSafeArea(nextProjection.composition.safeArea)
      : instance.safeArea;
    syncInstance(instance, {
      ...identity,
      status: nextState,
      renderStatus: nextState,
      visibility: validation.visibility,
      resolution: cloneProgramMainOutputResult(normalized.resolution),
      safeArea: cloneProgramMainOutputResult(effectiveSafeArea),
      projectionRevision: instance.projectionRevision + 1,
      routeRevision: normalized.routeRevision,
      sourceRevision: normalized.sourceRevision,
      lastProjectionAt: now,
      updatedAt: now,
      warnings: uniqueStrings([
        ...(normalized.warnings || []),
        ...(nextState === "stale" ? ["program-main-output-stale"] : []),
        ...(preparedRender?.warnings || [])
      ]),
      errors: uniqueStrings([...(normalized.errors || []), ...(preparedRender?.errors || [])])
    });
    applyRootPresentation(instance, runtime);
    return getProgramMainOutput(instance);
  } catch (error) {
    discardPreparedRender(preparedRender);
    syncInstance(instance, {
      status: runtime.lastValidProjection ? "stale" : "error",
      renderStatus: runtime.lastValidProjection ? "stale" : "error",
      updatedAt: now,
      warnings: runtime.lastValidProjection ? uniqueStrings([...(instance.warnings || []), "program-main-output-apply-preserved"]) : instance.warnings,
      errors: uniqueStrings([...(instance.errors || []), error?.code || PROGRAM_MAIN_OUTPUT_ERROR_CODES.RENDER_FAILED])
    });
    applyRootPresentation(instance, runtime);
    throw normalizeOutputError(error, PROGRAM_MAIN_OUTPUT_ERROR_CODES.RENDER_FAILED);
  }
}

export function updateProgramMainOutput(instance, projection, options = {}) {
  return applyProgramMainProjection(instance, projection, options);
}

export function renderProgramMainProjection(instance, projection, options = {}) {
  return applyProgramMainProjection(instance, projection, options);
}

export function clearProgramMainOutput(instance, options = {}) {
  const runtime = requireInstance(instance);
  requireMounted(runtime);
  const now = normalizeNow(options.now);
  clearBrowserOutput(runtime.browserOutput, { now });
  clearRenderedComposition(runtime, now);
  runtime.currentEnvelope = null;
  runtime.currentProjection = null;
  runtime.lastValidEnvelope = null;
  runtime.lastValidProjection = null;
  runtime.lastFingerprint = null;
  syncInstance(instance, {
    ...emptyIdentity(),
    status: "cleared",
    renderStatus: "cleared",
    projectionRevision: instance.projectionRevision + 1,
    routeRevision: null,
    sourceRevision: null,
    clearedAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  });
  applyRootPresentation(instance, runtime);
  return getProgramMainOutput(instance);
}

export function destroyProgramMainOutput(instance, options = {}) {
  const runtime = requireInstance(instance);
  const now = normalizeNow(options.now);
  clearRenderedComposition(runtime, now);
  destroyBrowserOutput(runtime.browserOutput, { now });
  runtime.container = null;
  runtime.root = null;
  runtime.stage = null;
  runtime.config = null;
  runtime.currentEnvelope = null;
  runtime.currentProjection = null;
  runtime.lastValidEnvelope = null;
  runtime.lastValidProjection = null;
  runtime.lastFingerprint = null;
  runtime.destroyed = true;
  syncInstance(instance, {
    ...emptyIdentity(),
    status: "destroyed",
    renderStatus: "destroyed",
    mounted: false,
    updatedAt: now,
    destroyedAt: now,
    warnings: [],
    errors: []
  });
  return cloneProgramMainOutputResult(instance);
}

export function getProgramMainOutput(instance) {
  requireInstance(instance);
  return cloneProgramMainOutputResult(instance);
}

export function getProgramMainOutputStatus(instance) {
  requireInstance(instance);
  return cloneProgramMainOutputResult({
    programMainOutputId: instance.programMainOutputId,
    status: instance.status,
    renderStatus: instance.renderStatus,
    mounted: instance.mounted,
    programId: instance.programId,
    routeRevision: instance.routeRevision,
    sourceRevision: instance.sourceRevision,
    projectionRevision: instance.projectionRevision,
    updatedAt: instance.updatedAt
  });
}

export function getProgramMainOutputWarnings(instance) {
  requireInstance(instance);
  return uniqueStrings(instance.warnings || []);
}

export function getProgramMainOutputErrors(instance) {
  requireInstance(instance);
  return uniqueStrings(instance.errors || []);
}

export function validateProgramMainOutputConfig(config) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(config, { visibility: "production", rejectUnsafe: true });
  errors.push(...safe.errors);
  warnings.push(...safe.warnings);
  const value = safe.value;
  if (!isRecord(value)) return validationResult(false, [PROGRAM_MAIN_OUTPUT_ERROR_CODES.CONFIG_INVALID], warnings);
  if (!normalizeId(value.programMainOutputId)) errors.push("program-main-output-id-invalid");
  if (!normalizeId(value.browserOutputId)) errors.push("program-main-output-browser-id-invalid");
  if (value.routeId !== DEFAULT_CONFIG.routeId) errors.push("program-main-output-route-id-incompatible");
  if (value.outputId !== DEFAULT_CONFIG.outputId) errors.push("program-main-output-output-id-incompatible");
  if (value.routeType !== DEFAULT_CONFIG.routeType) errors.push("program-main-output-route-type-incompatible");
  if (value.sourceType !== DEFAULT_CONFIG.sourceType) errors.push("program-main-output-source-type-incompatible");
  if (!DISPLAY_MODES.has(value.displayMode || DEFAULT_CONFIG.displayMode)) errors.push("program-main-output-display-mode-invalid");
  if (!VISIBILITIES.has(value.visibility || DEFAULT_CONFIG.visibility)) errors.push("program-main-output-visibility-invalid");
  if (!ORIENTATIONS.has(value.orientation || DEFAULT_CONFIG.orientation)) errors.push("program-main-output-orientation-invalid");
  errors.push(...resolutionErrors(value.resolution));
  errors.push(...safeAreaErrors(value.safeArea, value.resolution));
  if (value.transparentBackground !== undefined && typeof value.transparentBackground !== "boolean") errors.push("program-main-output-transparency-invalid");
  if (value.viewport !== undefined && value.viewport !== null) errors.push(...viewportErrors(value.viewport));
  return validationResult(errors.length === 0, uniqueStrings(errors), uniqueStrings(warnings));
}

export function validateProgramMainProjection(envelope, options = {}) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(envelope, { visibility: "production", rejectUnsafe: true });
  errors.push(...safe.errors);
  warnings.push(...safe.warnings);
  const value = safe.value;
  if (!isRecord(value)) return projectionValidation(false, [PROGRAM_MAIN_OUTPUT_ERROR_CODES.PROJECTION_INVALID], warnings);
  if (value.routeId !== DEFAULT_CONFIG.routeId) errors.push("program-main-output-projection-route-id-incompatible");
  if (value.routeType !== DEFAULT_CONFIG.routeType) errors.push("program-main-output-projection-route-type-incompatible");
  if (value.outputId !== DEFAULT_CONFIG.outputId) errors.push("program-main-output-projection-output-id-incompatible");
  if (value.sourceType !== DEFAULT_CONFIG.sourceType) errors.push("program-main-output-projection-source-type-incompatible");
  if (!nonNegativeInteger(value.sourceRevision)) errors.push("program-main-output-source-revision-invalid");
  if (!nonNegativeInteger(value.routeRevision)) errors.push("program-main-output-route-revision-invalid");
  if (!ROUTE_STATUSES.has(value.status)) errors.push("program-main-output-route-status-invalid");
  if (!VISIBILITIES.has(value.visibility)) errors.push("program-main-output-projection-visibility-invalid");
  errors.push(...resolutionErrors(value.resolution));
  if (!(value.projection === null || isRecord(value.projection))) errors.push("program-main-output-projection-payload-invalid");
  if (!validStringArray(value.warnings) || !validStringArray(value.errors)) errors.push("program-main-output-projection-diagnostics-invalid");
  if (!isIso(value.resolvedAt)) errors.push("program-main-output-resolved-at-invalid");

  if (isRecord(value.projection)) validateProgramProjectionPayload(value.projection, value.status, errors);
  else if (!["controlled-empty", "cleared", "disabled", "unavailable"].includes(value.status)) errors.push("program-main-output-projection-payload-required");

  const config = options.config;
  const requestedVisibility = options.visibility || config?.visibility || value.visibility;
  let effectiveVisibility = value.visibility;
  if (!VISIBILITIES.has(requestedVisibility) || !VISIBILITIES.has(value.visibility)
    || visibilityRank(value.visibility) > visibilityRank(requestedVisibility)
    || (config?.visibility && visibilityRank(value.visibility) > visibilityRank(config.visibility))) {
    errors.push("program-main-output-visibility-incompatible");
  } else {
    effectiveVisibility = moreRestrictiveVisibility(value.visibility, requestedVisibility, config?.visibility);
  }
  if (config) {
    for (const field of ["routeId", "outputId", "routeType", "sourceType"]) {
      if (config[field] !== value[field]) errors.push(`program-main-output-${field}-conflict`);
    }
    errors.push(...contextConflictErrors(config, value, options.context));
  }
  const browserValidation = validateBrowserOutputProjection(browserCompatibleEnvelope(value), {
    config: config ? browserConfig(config) : undefined,
    visibility: effectiveVisibility,
    context: options.context
  });
  if (!browserValidation.valid) errors.push(...browserValidation.errors);
  const unsafe = errors.some((error) => /unsafe|secret|getter|setter|cycle|function|symbol|bigint|protocol/.test(error));
  const incompatible = errors.some((error) => /incompatible|conflict|route-type|output-id|source-type/.test(error));
  return projectionValidation(
    errors.length === 0,
    uniqueStrings(errors),
    uniqueStrings(warnings),
    unsafe ? PROGRAM_MAIN_OUTPUT_ERROR_CODES.PROJECTION_UNSAFE
      : incompatible ? PROGRAM_MAIN_OUTPUT_ERROR_CODES.PROJECTION_TYPE
        : PROGRAM_MAIN_OUTPUT_ERROR_CODES.PROJECTION_INVALID,
    effectiveVisibility
  );
}

export function validateProgramMainOutputSnapshot(snapshot) {
  const errors = [];
  const safe = safeClone(snapshot, { visibility: "production", rejectUnsafe: true });
  errors.push(...safe.errors);
  const value = safe.value;
  if (!isRecord(value)) return validationResult(false, [PROGRAM_MAIN_OUTPUT_ERROR_CODES.SNAPSHOT_INVALID], []);
  if (value.snapshotVersion !== SNAPSHOT_VERSION) errors.push("program-main-output-snapshot-version-invalid");
  if (value.programMainOutputVersion !== PROGRAM_MAIN_OUTPUT_VERSION) errors.push("program-main-output-version-invalid");
  if (!normalizeId(value.programMainOutputId) || !normalizeId(value.browserOutputId)) errors.push("program-main-output-snapshot-id-invalid");
  if (!STATES.has(value.status) || !RENDER_STATES.has(value.renderStatus)) errors.push("program-main-output-snapshot-state-invalid");
  if (!DISPLAY_MODES.has(value.displayMode) || !VISIBILITIES.has(value.visibility)) errors.push("program-main-output-snapshot-presentation-invalid");
  errors.push(...resolutionErrors(value.resolution));
  errors.push(...safeAreaErrors(value.safeArea, value.resolution));
  if (!nonNegativeInteger(value.projectionRevision) || !nonNegativeInteger(value.layerCount) || !nonNegativeInteger(value.componentCount)) {
    errors.push("program-main-output-snapshot-count-invalid");
  }
  if (!isIso(value.generatedAt)) errors.push("program-main-output-snapshot-timestamp-invalid");
  if (!validStringArray(value.warnings) || !validStringArray(value.errors)) errors.push("program-main-output-snapshot-diagnostics-invalid");
  return validationResult(errors.length === 0, uniqueStrings(errors), []);
}

export function setProgramMainOutputViewport(instance, viewport, options = {}) {
  const runtime = requireInstance(instance);
  const errors = viewportErrors(viewport);
  if (errors.length) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.CONFIG_INVALID, { errors });
  setBrowserOutputViewport(runtime.browserOutput, viewport, { now: options.now });
  syncInstance(instance, {
    viewport: { width: Number(viewport.width), height: Number(viewport.height) },
    updatedAt: normalizeNow(options.now)
  });
  applyRootPresentation(instance, runtime);
  return getProgramMainOutput(instance);
}

export function setProgramMainOutputDisplayMode(instance, displayMode, options = {}) {
  const runtime = requireInstance(instance);
  if (!DISPLAY_MODES.has(displayMode)) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.CONFIG_INVALID, { field: "displayMode" });
  setBrowserOutputDisplayMode(runtime.browserOutput, displayMode, { now: options.now });
  syncInstance(instance, { displayMode, updatedAt: normalizeNow(options.now) });
  applyRootPresentation(instance, runtime);
  return getProgramMainOutput(instance);
}

export function buildProgramMainOutputSnapshot(instance, options = {}) {
  const runtime = requireInstance(instance);
  const visibility = moreRestrictiveVisibility(instance.visibility, options.visibility || instance.visibility);
  const projection = runtime.currentProjection;
  const composition = projection?.composition;
  const snapshot = {
    snapshotVersion: SNAPSHOT_VERSION,
    programMainOutputVersion: PROGRAM_MAIN_OUTPUT_VERSION,
    programMainOutputId: instance.programMainOutputId,
    browserOutputId: instance.browserOutputId,
    routeId: instance.routeId,
    outputId: instance.outputId,
    status: instance.status,
    renderStatus: instance.renderStatus,
    displayMode: instance.displayMode,
    visibility,
    resolution: cloneProgramMainOutputResult(instance.resolution),
    orientation: instance.orientation,
    safeArea: cloneProgramMainOutputResult(instance.safeArea),
    transparentBackground: instance.transparentBackground,
    mounted: instance.mounted,
    programId: instance.programId,
    templateId: instance.templateId,
    themeId: instance.themeId,
    appliedThemeId: instance.appliedThemeId,
    compositionId: instance.compositionId,
    rootComponentId: instance.rootComponentId,
    layerCount: Array.isArray(projection?.layers) ? projection.layers.length : 0,
    componentCount: Array.isArray(projection?.components) ? projection.components.length : 0,
    projectionRevision: instance.projectionRevision,
    routeRevision: instance.routeRevision,
    sourceRevision: instance.sourceRevision,
    warnings: uniqueStrings(instance.warnings || []),
    errors: uniqueStrings(instance.errors || []),
    generatedAt: normalizeNow(options.now),
    compositionSummary: composition ? {
      compositionId: normalizeId(composition.compositionId),
      rootComponentId: normalizeId(composition.rootComponentId),
      geometry: cloneProgramMainOutputResult(composition.geometry),
      transparentBackground: composition.transparentBackground === true,
      layerIds: Array.isArray(projection.layers) ? projection.layers.map((layer) => layer.layerId) : [],
      componentIds: Array.isArray(projection.components) ? projection.components.map((component) => component.componentId) : []
    } : null
  };
  const sanitized = safeClone(snapshot, { visibility, rejectUnsafe: false }).value;
  const validation = validateProgramMainOutputSnapshot(sanitized);
  if (!validation.valid) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.SNAPSHOT_INVALID, { errors: validation.errors });
  return cloneProgramMainOutputResult(sanitized);
}

export function cloneProgramMainOutputResult(value) {
  return safeClone(value, { visibility: "production", rejectUnsafe: false }).value;
}

function normalizeConfig(value) {
  return {
    programMainOutputId: normalizeId(value.programMainOutputId),
    browserOutputId: normalizeId(value.browserOutputId),
    routeId: DEFAULT_CONFIG.routeId,
    outputId: DEFAULT_CONFIG.outputId,
    routeType: DEFAULT_CONFIG.routeType,
    sourceType: DEFAULT_CONFIG.sourceType,
    name: normalizeText(value.name) || DEFAULT_CONFIG.name,
    displayMode: value.displayMode || DEFAULT_CONFIG.displayMode,
    visibility: value.visibility || DEFAULT_CONFIG.visibility,
    resolution: { width: Number(value.resolution.width), height: Number(value.resolution.height) },
    orientation: value.orientation || DEFAULT_CONFIG.orientation,
    safeArea: normalizeSafeArea(value.safeArea),
    transparentBackground: value.transparentBackground !== false,
    viewport: value.viewport ? { width: Number(value.viewport.width), height: Number(value.viewport.height) } : null,
    tenantId: normalizeNullableId(value.tenantId),
    organizationId: normalizeNullableId(value.organizationId),
    clientId: normalizeNullableId(value.clientId),
    tournamentId: normalizeNullableId(value.tournamentId),
    competitionId: normalizeNullableId(value.competitionId),
    sessionId: normalizeNullableId(value.sessionId),
    metadata: normalizeMetadata(value.metadata, value.visibility)
  };
}

function browserConfig(config) {
  return {
    browserOutputId: config.browserOutputId,
    outputType: "program_main",
    routeId: config.routeId,
    outputId: config.outputId,
    name: config.name,
    displayMode: config.displayMode,
    visibility: config.visibility,
    resolution: config.resolution,
    orientation: config.orientation,
    safeArea: config.safeArea,
    transparentBackground: config.transparentBackground,
    fullscreenAllowed: true,
    viewport: config.viewport,
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    clientId: config.clientId,
    tournamentId: config.tournamentId,
    competitionId: config.competitionId,
    sessionId: config.sessionId,
    metadata: config.metadata
  };
}

function normalizeEnvelope(envelope, visibility) {
  const safe = safeClone(envelope, { visibility, rejectUnsafe: true });
  if (safe.errors.length) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.PROJECTION_UNSAFE, { errors: safe.errors });
  const value = safe.value;
  const projection = value.projection ? normalizeProjection(value.projection, visibility) : null;
  return {
    routeId: DEFAULT_CONFIG.routeId,
    routeType: DEFAULT_CONFIG.routeType,
    outputId: DEFAULT_CONFIG.outputId,
    sourceType: DEFAULT_CONFIG.sourceType,
    sourceRevision: Number(value.sourceRevision),
    routeRevision: Number(value.routeRevision),
    status: value.status,
    visibility,
    resolution: { width: Number(value.resolution.width), height: Number(value.resolution.height) },
    projection,
    warnings: uniqueStrings(value.warnings || []),
    errors: uniqueStrings(value.errors || []),
    resolvedAt: new Date(value.resolvedAt).toISOString(),
    tenantId: visibility === "public" ? null : normalizeNullableId(value.tenantId),
    organizationId: visibility === "public" ? null : normalizeNullableId(value.organizationId),
    clientId: visibility === "public" ? null : normalizeNullableId(value.clientId),
    tournamentId: normalizeNullableId(value.tournamentId),
    competitionId: normalizeNullableId(value.competitionId),
    sessionId: visibility === "public" ? null : normalizeNullableId(value.sessionId)
  };
}

function browserCompatibleEnvelope(envelope) {
  if (envelope?.status !== "unavailable") return envelope;
  return {
    ...envelope,
    status: "routed",
    projection: envelope.projection ? { ...envelope.projection, state: "unavailable" } : { state: "unavailable" }
  };
}

function normalizeProjection(projection, visibility) {
  const cloned = safeClone(projection, { visibility, rejectUnsafe: true }).value;
  if (!cloned) return null;
  const composition = cloned.composition ? cloneProgramMainOutputResult(cloned.composition) : null;
  const themeId = normalizeId(cloned.themeId || composition?.themeId);
  const appliedThemeId = normalizeId(cloned.appliedThemeId || composition?.appliedThemeId || composition?.metadata?.appliedThemeId || themeId);
  return {
    ...cloned,
    programId: normalizeId(cloned.programId),
    templateId: normalizeId(cloned.templateId || composition?.templateId),
    themeId,
    appliedThemeId,
    composition,
    components: Array.isArray(cloned.components) ? cloneProgramMainOutputResult(cloned.components) : [],
    layers: Array.isArray(cloned.layers) ? cloneProgramMainOutputResult(cloned.layers) : [],
    visibility
  };
}

function validateProgramProjectionPayload(projection, routeStatus, errors) {
  if (!PROGRAM_STATES.has(projection.state || projection.status || "program")) errors.push("program-main-output-program-state-invalid");
  if (routeStatus === "controlled-empty" || projection.state === "controlled-empty") {
    if (projection.composition !== null || !Array.isArray(projection.components) || projection.components.length
      || !Array.isArray(projection.layers) || projection.layers.length) errors.push("program-main-output-empty-projection-invalid");
    return;
  }
  if (["disabled", "unavailable", "error"].includes(routeStatus) || ["disabled", "unavailable", "error"].includes(projection.state)) return;
  if (!normalizeId(projection.programId)) errors.push("program-main-output-program-id-invalid");
  if (!normalizeId(projection.templateId)) errors.push("program-main-output-template-id-invalid");
  if (!normalizeId(projection.themeId)) errors.push("program-main-output-theme-id-invalid");
  if (projection.appliedThemeId !== undefined && projection.appliedThemeId !== null && !normalizeId(projection.appliedThemeId)) {
    errors.push("program-main-output-applied-theme-id-invalid");
  }
  if (!isRecord(projection.composition)) {
    errors.push("program-main-output-composition-invalid");
    return;
  }
  const composition = projection.composition;
  if (!normalizeId(composition.compositionId) || !normalizeId(composition.rootComponentId)) errors.push("program-main-output-composition-identity-invalid");
  if (!isRecord(composition.geometry)) errors.push("program-main-output-geometry-invalid");
  else errors.push(...resolutionErrors(composition.geometry));
  if (composition.safeArea !== undefined) errors.push(...safeAreaErrors(normalizeCompositionSafeArea(composition.safeArea), composition.geometry));
  if (!Array.isArray(projection.components) || projection.components.length > MAX_COMPONENTS) errors.push("program-main-output-components-invalid");
  if (!Array.isArray(projection.layers) || projection.layers.length > MAX_LAYERS) errors.push("program-main-output-layers-invalid");
  if (!Array.isArray(composition.components) || !Array.isArray(composition.layers)) errors.push("program-main-output-composition-content-invalid");
  (projection.components || []).forEach((component, index) => validateDeclarativeComponent(component, index, errors));
  (projection.layers || []).forEach((layer, index) => validateDeclarativeLayer(layer, index, errors));
}

function validateDeclarativeComponent(component, index, errors) {
  if (!isRecord(component)) {
    errors.push(`program-main-output-component-${index}-invalid`);
    return;
  }
  if (!normalizeId(component.componentId) || !normalizeId(component.componentType)) errors.push(`program-main-output-component-${index}-identity-invalid`);
  if (!isRecord(component.geometry)) errors.push(`program-main-output-component-${index}-geometry-invalid`);
  else {
    for (const field of ["x", "y", "width", "height", "rotation", "scale", "zIndex"]) {
      if (!Number.isFinite(Number(component.geometry[field]))) errors.push(`program-main-output-component-${index}-${field}-invalid`);
    }
    if (Number(component.geometry.width) < 0 || Number(component.geometry.height) < 0 || Number(component.geometry.scale) <= 0) {
      errors.push(`program-main-output-component-${index}-geometry-range-invalid`);
    }
  }
  if (!Number.isFinite(Number(component.opacity)) || Number(component.opacity) < 0 || Number(component.opacity) > 1) {
    errors.push(`program-main-output-component-${index}-opacity-invalid`);
  }
}

function validateDeclarativeLayer(layer, index, errors) {
  if (!isRecord(layer) || !normalizeId(layer.layerId) || !Array.isArray(layer.componentIds)) {
    errors.push(`program-main-output-layer-${index}-invalid`);
    return;
  }
  if (!Number.isFinite(Number(layer.order)) || !Number.isFinite(Number(layer.zIndex))) errors.push(`program-main-output-layer-${index}-order-invalid`);
}

function prepareRender(runtime, instance, projection, now) {
  const documentRef = runtime.stage?.ownerDocument;
  if (!documentRef?.createElement) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.TARGET_INVALID);
  const host = documentRef.createElement("div");
  host.className = "program-main-output-render-host is-preparing";
  safeAttribute(host, "aria-hidden", "true");
  runtime.stage.appendChild(host);
  const composition = projection.composition;
  const resolution = composition.geometry;
  let renderer = null;
  try {
    renderer = createComponentRenderer(host, {
      rendererId: `program-main-renderer-${instance.programMainOutputId}-${instance.projectionRevision + 1}`,
      outputId: instance.outputId,
      width: resolution.width,
      height: resolution.height,
      orientation: composition.geometry.orientation || instance.orientation,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      visibility: instance.visibility,
      allowDisconnected: true,
      now
    });
    const ordered = orderComponents(projection.components, projection.layers);
    ordered.forEach((component) => {
      const componentInstance = componentToRendererInstance(component, composition, projection.visibility, now);
      renderBroadcastComponent(renderer, componentInstance, {
        renderId: `program-main-${component.componentId}`,
        resolvedContent: cloneProgramMainOutputResult(component.content || {}),
        resolvedBindings: cloneProgramMainOutputResult(component.data || {}),
        resolvedAssets: {},
        visibility: projection.visibility,
        now
      });
    });
    return {
      host,
      renderer,
      warnings: getComponentRenderWarnings(renderer),
      errors: uniqueStrings(renderer.errors || [])
    };
  } catch (error) {
    if (renderer) destroyComponentRenderer(renderer, { now });
    host.remove?.();
    throw normalizeOutputError(error, PROGRAM_MAIN_OUTPUT_ERROR_CODES.RENDER_FAILED);
  }
}

function componentToRendererInstance(component, composition, visibility, now) {
  const width = Number(composition.geometry.width) || 1920;
  const height = Number(composition.geometry.height) || 1080;
  const raw = component.geometry || {};
  const definition = createBroadcastComponent({
    componentId: normalizeId(component.sourceComponentId) || normalizeId(component.componentId),
    name: normalizeText(component.metadata?.name) || normalizeText(component.componentType) || "Program component",
    componentType: component.componentType,
    componentVersion: "1.0.0",
    componentRevision: 0,
    visibility: visibility || "public",
    status: component.visibility === false || component.visibility === "hidden"
      || component.effectiveLayerVisibility === false || component.effectiveLayerVisibility === "hidden"
      ? "disabled" : "active",
    style: { ...(component.style || {}), opacity: Number(component.opacity) },
    layout: {
      x: Number(raw.x) / width,
      y: Number(raw.y) / height,
      width: Number(raw.width) / width,
      height: Number(raw.height) / height,
      rotation: Number(raw.rotation) || 0,
      anchor: normalizeId(raw.anchor) || "center",
      scale: Number(raw.scale) || 1,
      zIndex: Number(raw.zIndex) || 0,
      safeArea: {},
      responsive: cloneProgramMainOutputResult(raw.responsive || {})
    },
    properties: cloneProgramMainOutputResult(component.properties || {}),
    metadata: cloneProgramMainOutputResult({
      ...(component.metadata || {}),
      layerId: component.layerId,
      programMainComponentId: component.componentId
    })
  }, { now });
  return buildComponentInstance(definition, {
    instanceId: component.componentId,
    visibility: visibility || "public",
    status: definition.status,
    style: definition.style,
    layout: definition.layout,
    properties: definition.properties,
    metadata: definition.metadata
  }, { now });
}

function orderComponents(components, layers) {
  const layerMap = new Map((layers || []).map((layer) => [layer.layerId, layer]));
  return components.map((component) => ({
    ...component,
    effectiveLayerVisibility: layerMap.get(component.layerId)?.visibility ?? true
  })).sort((left, right) => {
    const leftLayer = layerMap.get(left.layerId) || {};
    const rightLayer = layerMap.get(right.layerId) || {};
    return Number(leftLayer.order ?? left.order ?? 0) - Number(rightLayer.order ?? right.order ?? 0)
      || Number(leftLayer.zIndex ?? left.geometry?.zIndex ?? 0) - Number(rightLayer.zIndex ?? right.geometry?.zIndex ?? 0)
      || Number(left.order ?? 0) - Number(right.order ?? 0)
      || String(left.componentId).localeCompare(String(right.componentId));
  });
}

function commitPreparedRender(runtime, prepared) {
  if (!prepared) return;
  const previousRenderer = runtime.renderer;
  const previousHost = runtime.rendererHost;
  prepared.host.className = "program-main-output-render-host";
  runtime.renderer = prepared.renderer;
  runtime.rendererHost = prepared.host;
  if (previousRenderer) destroyComponentRenderer(previousRenderer);
  previousHost?.remove?.();
}

function discardPreparedRender(prepared) {
  if (!prepared) return;
  try { destroyComponentRenderer(prepared.renderer); } catch { /* already discarded */ }
  prepared.host?.remove?.();
}

function clearRenderedComposition(runtime, now) {
  if (runtime.renderer) {
    try { clearBroadcastComponentRenderer(runtime.renderer, { now }); } catch { /* renderer already terminal */ }
    try { destroyComponentRenderer(runtime.renderer, { now }); } catch { /* renderer already terminal */ }
  }
  runtime.rendererHost?.remove?.();
  runtime.renderer = null;
  runtime.rendererHost = null;
  runtime.stage?.replaceChildren?.();
}

function projectionState(envelope) {
  if (envelope.status === "disabled") return "disabled";
  if (envelope.status === "stale") return "stale";
  if (envelope.status === "unavailable" || envelope.projection?.state === "unavailable") return "unavailable";
  if (envelope.status === "error" || envelope.errors.length || envelope.projection?.state === "error") return "error";
  if (envelope.status === "controlled-empty" || envelope.status === "cleared" || !envelope.projection
    || envelope.projection.state === "controlled-empty" || envelope.projection.composition === null) return "empty";
  return "ready";
}

function projectionIdentity(projection) {
  const composition = projection?.composition || {};
  return {
    programId: normalizeId(projection?.programId),
    templateId: normalizeId(projection?.templateId || composition.templateId),
    themeId: normalizeId(projection?.themeId || composition.themeId),
    appliedThemeId: normalizeId(projection?.appliedThemeId || composition.appliedThemeId || composition.metadata?.appliedThemeId || projection?.themeId || composition.themeId),
    compositionId: normalizeId(composition.compositionId),
    rootComponentId: normalizeId(composition.rootComponentId)
  };
}

function emptyIdentity() {
  return {
    programId: null,
    templateId: null,
    themeId: null,
    appliedThemeId: null,
    compositionId: null,
    rootComponentId: null
  };
}

function applyRootPresentation(instance, runtime) {
  const root = runtime.root;
  const stage = runtime.stage;
  if (!root || !stage) return;
  safeAttribute(root, "data-program-main-output-id", instance.programMainOutputId);
  safeAttribute(root, "data-output-state", instance.status);
  safeAttribute(root, "data-render-state", instance.renderStatus);
  safeAttribute(root, "data-route-id", instance.routeId);
  safeAttribute(root, "data-output-id", instance.outputId);
  safeAttribute(root, "data-program-id", instance.programId || "");
  safeAttribute(root, "data-layer-count", String(Array.isArray(runtime.currentProjection?.layers) ? runtime.currentProjection.layers.length : 0));
  safeAttribute(root, "data-display-mode", instance.displayMode);
  safeAttribute(root, "data-orientation", instance.orientation);
  safeAttribute(root, "data-transparent-background", instance.transparentBackground ? "true" : "false");
  safeAttribute(root, "data-debug", runtime.debug ? "true" : "false");
  root.style.backgroundColor = instance.transparentBackground ? "transparent" : "#090b0e";
  stage.style.backgroundColor = "transparent";
  stage.style.aspectRatio = `${instance.resolution.width} / ${instance.resolution.height}`;
  stage.style.maxWidth = instance.displayMode === "native" ? `${instance.resolution.width}px` : "100%";
  stage.style.maxHeight = instance.displayMode === "native" ? `${instance.resolution.height}px` : "100%";
  if (instance.viewport) {
    stage.style.width = `${instance.viewport.width}px`;
    stage.style.height = `${instance.viewport.height}px`;
  } else {
    stage.style.width = "100%";
    stage.style.height = "100%";
  }
  for (const side of ["top", "right", "bottom", "left"]) {
    const unit = instance.safeArea.unit === "pixel" ? "px" : "%";
    stage.style.setProperty?.(`--program-main-safe-${side}`, `${instance.safeArea[side]}${unit}`);
  }
  updateRendererScale(instance, runtime);
}

function updateRendererScale(instance, runtime) {
  const canvas = runtime.rendererHost?.querySelector?.(".cp-component-renderer-canvas");
  if (!canvas) return;
  const logical = runtime.currentProjection?.composition?.geometry || instance.resolution;
  const viewportWidth = Number(instance.viewport?.width || runtime.stage?.clientWidth || instance.resolution.width);
  const viewportHeight = Number(instance.viewport?.height || runtime.stage?.clientHeight || instance.resolution.height);
  const widthScale = viewportWidth / Number(logical.width || instance.resolution.width);
  const heightScale = viewportHeight / Number(logical.height || instance.resolution.height);
  let scale = instance.displayMode === "fill" ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale);
  if (instance.displayMode === "native") scale = Math.min(1, scale);
  canvas.style.transform = `scale(${Math.max(0.0001, scale)})`;
}

function assertRevisionOrder(instance, runtime, envelope) {
  if (instance.routeRevision !== null && envelope.routeRevision < instance.routeRevision) {
    throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.REVISION_REGRESSION, { field: "routeRevision" });
  }
  if (instance.sourceRevision !== null && envelope.sourceRevision < instance.sourceRevision) {
    throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.REVISION_REGRESSION, { field: "sourceRevision" });
  }
  if (runtime.currentEnvelope && envelope.routeRevision === instance.routeRevision
    && envelope.sourceRevision !== instance.sourceRevision) {
    throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.REVISION_CONFLICT, { field: "sourceRevision" });
  }
}

function contextConflictErrors(config, envelope, extraContext) {
  const errors = [];
  for (const field of ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"]) {
    const expected = config?.[field] || extraContext?.[field];
    const actual = envelope?.[field] || envelope?.projection?.[field] || envelope?.projection?.composition?.[field];
    if (expected && actual && expected !== actual) errors.push(`program-main-output-${field}-conflict`);
  }
  return errors;
}

function normalizeSafeArea(value) {
  const raw = isRecord(value) ? value : DEFAULT_CONFIG.safeArea;
  return {
    top: Number(raw.top ?? 0),
    right: Number(raw.right ?? 0),
    bottom: Number(raw.bottom ?? 0),
    left: Number(raw.left ?? 0),
    unit: raw.unit === "pixel" ? "pixel" : "percent"
  };
}

function normalizeCompositionSafeArea(value) {
  const raw = isRecord(value) ? value : {};
  return normalizeSafeArea({ ...raw, unit: raw.unit || "pixel" });
}

function resolutionErrors(value) {
  if (!isRecord(value)) return ["program-main-output-resolution-invalid"];
  const width = Number(value.width);
  const height = Number(value.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0
    || !Number.isInteger(width) || !Number.isInteger(height)
    || width > MAX_RESOLUTION_EDGE || height > MAX_RESOLUTION_EDGE
    || width * height > MAX_RESOLUTION_PIXELS) return ["program-main-output-resolution-invalid"];
  return [];
}

function safeAreaErrors(value, resolution) {
  if (!isRecord(value)) return ["program-main-output-safe-area-invalid"];
  if (!["percent", "pixel"].includes(value.unit || "percent")) return ["program-main-output-safe-area-invalid"];
  const numbers = ["top", "right", "bottom", "left"].map((side) => Number(value[side] ?? 0));
  if (numbers.some((number) => !Number.isFinite(number) || number < 0)) return ["program-main-output-safe-area-invalid"];
  const [top, right, bottom, left] = numbers;
  if ((value.unit || "percent") === "percent" && (top + bottom >= 100 || left + right >= 100)) return ["program-main-output-safe-area-invalid"];
  if (value.unit === "pixel" && isRecord(resolution)
    && (top + bottom >= Number(resolution.height) || left + right >= Number(resolution.width))) return ["program-main-output-safe-area-invalid"];
  return [];
}

function viewportErrors(value) {
  if (!isRecord(value)) return ["program-main-output-viewport-invalid"];
  const width = Number(value.width);
  const height = Number(value.height);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? []
    : ["program-main-output-viewport-invalid"];
}

function normalizeMetadata(value, visibility) {
  return safeClone(isRecord(value) ? value : {}, { visibility: visibility || "production", rejectUnsafe: false }).value || {};
}

function requireInstance(instance) {
  const runtime = INSTANCES.get(instance);
  if (!runtime) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.INVALID_INSTANCE);
  if (runtime.destroyed || instance.status === "destroyed") throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.DESTROYED);
  return runtime;
}

function requireMounted(runtime) {
  if (!runtime.config) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.NOT_CONFIGURED);
  if (!runtime.root || !runtime.stage) throw outputError(PROGRAM_MAIN_OUTPUT_ERROR_CODES.NOT_MOUNTED);
}

function validMountTarget(target) {
  if (!target || target.nodeType !== 1 || !target.ownerDocument || typeof target.ownerDocument.createElement !== "function") return false;
  return !new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG"]).has(String(target.tagName || "").toUpperCase());
}

function findBrowserRoot(container, browserOutputId) {
  return [...(container.children || [])].find((child) => child.getAttribute?.("data-browser-output-id") === browserOutputId) || null;
}

function syncInstance(instance, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    if (key in instance) instance[key] = cloneProgramMainOutputResult(value);
  }
}

function safeAttribute(node, name, value) {
  if (node?.setAttribute) node.setAttribute(name, String(value ?? ""));
}

function safeClone(value, options = {}, state = null) {
  const visibility = VISIBILITIES.has(options.visibility) ? options.visibility : "production";
  const context = state || { depth: 0, ancestors: new WeakSet(), path: "root", errors: [], warnings: [] };
  if (value === null || value === undefined) return { value: value ?? null, errors: context.errors, warnings: context.warnings };
  if (["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) context.errors.push(`${context.path}:non-finite`);
    if (typeof value === "string") {
      if (value.length > MAX_TEXT_LENGTH) context.errors.push(`${context.path}:string-limit`);
      if (UNSAFE_URI.test(value)) context.errors.push(`${context.path}:unsafe-protocol`);
      if (UNSAFE_MARKUP.test(value)) context.warnings.push(`${context.path}:markup-sanitized`);
    }
    const primitive = typeof value === "string"
      ? value.slice(0, MAX_TEXT_LENGTH).replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      : value;
    return { value: primitive, errors: context.errors, warnings: context.warnings };
  }
  if (["function", "symbol", "bigint"].includes(typeof value)) {
    context.errors.push(`${context.path}:${typeof value}-forbidden`);
    return { value: null, errors: context.errors, warnings: context.warnings };
  }
  if (context.depth >= MAX_DEPTH) {
    context.errors.push(`${context.path}:depth-limit`);
    return { value: null, errors: context.errors, warnings: context.warnings };
  }
  if (context.ancestors.has(value)) {
    context.errors.push(`${context.path}:cycle-forbidden`);
    return { value: null, errors: context.errors, warnings: context.warnings };
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) {
    context.errors.push(`${context.path}:prototype-forbidden`);
    return { value: null, errors: context.errors, warnings: context.warnings };
  }
  context.ancestors.add(value);
  let result;
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) context.errors.push(`${context.path}:array-limit`);
    result = value.slice(0, MAX_ARRAY_ITEMS).map((item, index) => safeClone(item, options, {
      ...context,
      depth: context.depth + 1,
      path: `${context.path}[${index}]`
    }).value);
  } else {
    result = {};
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const entries = Object.entries(descriptors);
    if (entries.length > MAX_OBJECT_KEYS) context.errors.push(`${context.path}:object-limit`);
    for (const [key, descriptor] of entries.slice(0, MAX_OBJECT_KEYS)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (DANGEROUS_KEYS.has(key) || FORBIDDEN_KEYS.has(normalizedKey) || SECRET_KEYS.has(normalizedKey)) {
        if (options.rejectUnsafe !== false) context.errors.push(`${context.path}.${key}:key-forbidden`);
        continue;
      }
      if (visibility === "public" && (PUBLIC_PRIVATE_KEYS.has(normalizedKey) || PUBLIC_OPERATIONAL_KEYS.has(normalizedKey))) continue;
      if (descriptor.get || descriptor.set) {
        context.errors.push(`${context.path}.${key}:accessor-forbidden`);
        continue;
      }
      result[key] = safeClone(descriptor.value, options, {
        ...context,
        depth: context.depth + 1,
        path: `${context.path}.${key}`
      }).value;
    }
  }
  context.ancestors.delete(value);
  return { value: result, errors: uniqueStrings(context.errors), warnings: uniqueStrings(context.warnings) };
}

function stableFingerprint(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => freezeDeep(child, seen));
  return Object.freeze(value);
}

function normalizeNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeId(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(text) ? text : null;
}

function normalizeNullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, 240) : "";
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}

function visibilityRank(value) {
  return value === "public" ? 0 : value === "production" ? 1 : 99;
}

function moreRestrictiveVisibility(...values) {
  return values.filter((value) => VISIBILITIES.has(value)).sort((left, right) => visibilityRank(right) - visibilityRank(left))[0] || "production";
}

function validationResult(valid, errors, warnings) {
  return { valid, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), programMainOutputVersion: PROGRAM_MAIN_OUTPUT_VERSION };
}

function projectionValidation(valid, errors, warnings, code = null, visibility = "production") {
  return { ...validationResult(valid, errors, warnings), code: valid ? null : code, visibility };
}

function outputError(code, details = {}) {
  return new BroadcastProgramMainOutputError(code, details);
}

function normalizeOutputError(error, fallback) {
  return error instanceof BroadcastProgramMainOutputError ? error : outputError(error?.code || fallback);
}

function buildDebugComponent(id, type, layerId, order, geometry, properties, content, style = {}) {
  return {
    componentId: id,
    sourceComponentId: `source-${id}`,
    componentType: type,
    parentId: null,
    layerId,
    order,
    visibility: "public",
    geometry: { rotation: 0, anchor: "top-left", scale: 1, zIndex: order + 1, safeArea: {}, responsive: {}, ...geometry },
    opacity: style.opacity ?? 1,
    style: {
      color: "#ffffff",
      backgroundColor: "#101318e8",
      borderColor: "#d6ad43",
      borderWidth: 2,
      borderRadius: 4,
      fontFamily: "Arial",
      fontSize: 42,
      fontWeight: 700,
      opacity: style.opacity ?? 1,
      padding: { top: 12, right: 18, bottom: 12, left: 18 },
      ...style
    },
    properties,
    content,
    data: {},
    assetRefs: [],
    metadata: { fixture: true }
  };
}

function buildDebugProjection(name = "active-3", revision = 1) {
  const teams = name.includes("4")
    ? [["Rancho El Laurel", 203, false], ["Charros de Jalisco", 202, false], ["Rancheros de Tijuana", 201, true], ["Rancho del Centro", 198, false]]
    : [["Rancho El Laurel", 203, false], ["Charros de Jalisco", 202, false], ["Rancheros de Tijuana", 201, true]];
  if (name === "empty") {
    return {
      routeId: DEFAULT_CONFIG.routeId,
      routeType: DEFAULT_CONFIG.routeType,
      outputId: DEFAULT_CONFIG.outputId,
      sourceType: DEFAULT_CONFIG.sourceType,
      sourceRevision: revision,
      routeRevision: revision,
      status: "controlled-empty",
      visibility: "public",
      resolution: { width: 1920, height: 1080 },
      projection: { kind: "program-main", state: "controlled-empty", composition: null, components: [], layers: [] },
      warnings: [],
      errors: [],
      resolvedAt: new Date().toISOString()
    };
  }
  const components = teams.map(([team, total, active], index) => buildDebugComponent(
    `score-${index + 1}`,
    "score",
    "scoreboard",
    index,
    { x: 160, y: 160 + (index * 130), width: 1160, height: 104 },
    { label: team, value: total },
    { label: team, value: total, active },
    { backgroundColor: active ? "#174ea6" : "#101318e8" }
  ));
  components.push(buildDebugComponent(
    "broadcast-bug", "badge", "bug", components.length, { x: 1540, y: 70, width: 260, height: 84 },
    { value: "EN VIVO" }, { value: "EN VIVO", variant: "live" }, { backgroundColor: "#7a1538" }
  ));
  const layers = [
    { layerId: "scoreboard", order: 0, zIndex: 10, visibility: "public", componentIds: components.filter((item) => item.layerId === "scoreboard").map((item) => item.componentId) },
    { layerId: "bug", order: 1, zIndex: 50, visibility: "public", componentIds: ["broadcast-bug"] }
  ];
  const composition = {
    compositionVersion: "1.0.0",
    compositionId: `fixture-${name}`,
    templateId: "template-scoreboard",
    themeId: "theme-default",
    appliedThemeId: "theme-default",
    rootComponentId: components[0].componentId,
    components,
    layers,
    order: components.map((item) => item.componentId),
    geometry: { width: 1920, height: 1080, orientation: "landscape" },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: true,
    background: { type: "transparent" },
    data: {
      turn: { team: { id: "team-tijuana", name: "Rancheros de Tijuana" } },
      lastScoredTeam: { id: "team-jalisco", name: "Charros de Jalisco" }
    },
    metadata: { fixture: true }
  };
  return {
    routeId: DEFAULT_CONFIG.routeId,
    routeType: DEFAULT_CONFIG.routeType,
    outputId: DEFAULT_CONFIG.outputId,
    sourceType: DEFAULT_CONFIG.sourceType,
    sourceRevision: revision,
    routeRevision: revision,
    status: "routed",
    visibility: "public",
    resolution: { width: 1920, height: 1080 },
    projection: {
      kind: "program-main",
      state: "program",
      projectionVersion: "1.0.0",
      programId: `program-${name}`,
      templateId: "template-scoreboard",
      themeId: "theme-default",
      appliedThemeId: "theme-default",
      composition,
      components,
      layers,
      sourceRevision: revision,
      programRevision: revision,
      visibility: "public",
      generatedAt: new Date().toISOString()
    },
    warnings: [],
    errors: [],
    resolvedAt: new Date().toISOString()
  };
}

export function initializeProgramMainOutputPage(documentRef = globalThis.document, options = {}) {
  const body = documentRef?.body;
  const container = documentRef?.getElementById?.("program-main-output-host");
  if (!body?.hasAttribute?.("data-program-main-output-page") || !container) return null;
  const params = new URLSearchParams(options.search ?? globalThis.location?.search ?? "");
  const debug = params.get("debug") === "1";
  const instance = createProgramMainOutput({}, { debug });
  configureProgramMainOutput(instance, DEFAULT_CONFIG);
  mountProgramMainOutput(instance, container);
  if (debug) {
    const fixture = params.get("fixture");
    if (new Set(["empty", "active-3", "active-4"]).has(fixture)) applyProgramMainProjection(instance, buildDebugProjection(fixture));
  } else if (params.get("sessionId")) {
    connectProgramMainRealtime(instance, { params, documentRef }).catch((error) => {
      body.setAttribute("data-realtime-status", "error");
      body.setAttribute("data-realtime-error", String(error?.code || error?.message || "broadcast-realtime-error").slice(0, 160));
    });
  }
  return instance;
}

export async function connectProgramMainRealtime(instance, options = {}) {
  const params = options.params instanceof URLSearchParams
    ? options.params
    : new URLSearchParams(options.search ?? globalThis.location?.search ?? "");
  const requestContext = options.context || broadcastRealtimeContextFromParams(params);
  assertNoProgramMainExternalIdentity(requestContext);
  const transportApi = options.transportApi || await import("./broadcastRealtimeTransport.js?v=20260716-broadcast-context-resolution-001-real-context-v1");
  const accessId = params.get("access") || options.accessId || null;
  const firebaseApi = options.firebaseApi || (!options.adapter ? await import("../core/firebaseSync.js?v=20260716-broadcast-context-resolution-001-real-context-v1") : null);
  if (options.authorizedContext && !options.adapter) throw outputError("program-main-output-authorized-context-injection-forbidden");
  if (options.temporaryAccess && !options.adapter) throw outputError("program-main-output-temporary-access-injection-forbidden");
  const temporaryAccess = accessId
    ? options.temporaryAccess || await firebaseApi?.resolveFirebaseBroadcastTemporaryAccess({
      sessionId: requestContext.sessionId,
      accessId
    }, "program_main")
    : null;
  const context = temporaryAccess?.context || options.authorizedContext || await firebaseApi?.resolveFirebaseBroadcastAuthorizedContext(requestContext, "read");
  if (!context) throw outputError("program-main-output-authorized-context-required");
  configureProgramMainOutput(instance, {
    visibility: "production",
    ...context
  });
  const adapter = options.adapter || (temporaryAccess
    ? firebaseApi.createFirebaseBroadcastTemporaryAccessAdapter(temporaryAccess, {
      adapterId: `program-main-access-${context.sessionId}`
    })
    : firebaseApi.createFirebaseBroadcastAdapter({
      adapterId: `program-main-${context.sessionId}`,
      accessMode: "read"
    }));
  const documentRef = options.documentRef || globalThis.document;
  const transport = transportApi.createBroadcastRealtimeTransport({ transportId: `program-main-${context.sessionId}` });
  let lastEnvelope = null;
  transportApi.configureBroadcastRealtimeTransport(transport, {
    adapter,
    context,
    staleAfterMs: options.staleAfterMs || 15000,
    onStatus: (status) => {
      documentRef?.body?.setAttribute?.("data-realtime-status", status.status);
      if ((status.stale || status.offline) && lastEnvelope) documentRef?.body?.setAttribute?.("data-last-valid-projection", "preserved");
    }
  }, { expectedRevision: 0 });
  await transportApi.connectBroadcastRealtimeTransport(transport, { expectedRevision: 1 });
  const subscriptionId = transportApi.subscribeBroadcastProjection(transport, "program", (message) => {
    if (message.status === "cleared" || !message.projection) {
      clearProgramMainOutput(instance);
      lastEnvelope = null;
      return;
    }
    lastEnvelope = rehydrateProgramMainRealtimeEnvelope(message.projection);
    applyProgramMainProjection(instance, lastEnvelope, {
      visibility: message.visibility,
      context
    });
  }, { subscriptionId: `program-main-${context.sessionId}` });
  documentRef?.body?.setAttribute?.("data-realtime-status", "connected");
  return Object.freeze({
    transport,
    subscriptionId,
    getSnapshot: () => transportApi.buildBroadcastRealtimeSnapshot(transport),
    disconnect: () => transportApi.disconnectBroadcastRealtimeTransport(transport, { expectedRevision: transport.revision }),
    destroy: () => transportApi.destroyBroadcastRealtimeTransport(transport)
  });
}

function rehydrateProgramMainRealtimeEnvelope(value) {
  const envelope = cloneProgramMainOutputResult(value || {});
  envelope.warnings = Array.isArray(envelope.warnings) ? envelope.warnings : [];
  envelope.errors = Array.isArray(envelope.errors) ? envelope.errors : [];
  if (!isRecord(envelope.projection)) return envelope;
  const projection = envelope.projection;
  projection.components = Array.isArray(projection.components) ? projection.components : [];
  projection.layers = Array.isArray(projection.layers) ? projection.layers : [];
  if (envelope.status === "controlled-empty" || projection.state === "controlled-empty") {
    projection.composition = null;
  } else if (isRecord(projection.composition)) {
    projection.composition.components = Array.isArray(projection.composition.components)
      ? projection.composition.components
      : cloneProgramMainOutputResult(projection.components);
    projection.composition.layers = Array.isArray(projection.composition.layers)
      ? projection.composition.layers
      : cloneProgramMainOutputResult(projection.layers);
  }
  projection.layers = projection.layers.map((layer) => isRecord(layer)
    ? { ...layer, componentIds: Array.isArray(layer.componentIds) ? layer.componentIds : [] }
    : layer);
  return envelope;
}

function broadcastRealtimeContextFromParams(params) {
  for (const key of ["tenantId", "organizationId", "clientId"]) {
    if (params.has(key)) throw outputError("program-main-output-url-identity-forbidden", { key });
  }
  return {
    tournamentId: params.get("tournamentId"),
    competitionId: params.get("competitionId") || null,
    sessionId: params.get("sessionId")
  };
}

function assertNoProgramMainExternalIdentity(value) {
  for (const key of ["tenantId", "organizationId", "clientId"]) {
    if (value?.[key] !== undefined && value?.[key] !== null && value?.[key] !== "") {
      throw outputError("program-main-output-context-identity-forbidden", { key });
    }
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initializeProgramMainOutputPage(document), { once: true });
  else initializeProgramMainOutputPage(document);
}
