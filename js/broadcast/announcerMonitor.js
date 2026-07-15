import {
  applyBrowserOutputProjection,
  clearBrowserOutput,
  configureBrowserOutput,
  createBrowserOutput,
  destroyBrowserOutput,
  mountBrowserOutput,
  setBrowserOutputViewport,
  validateBrowserOutputProjection
} from "./browserOutput.js?v=20260715-browser-output-001-common-web-output-infrastructure-v1";

export const ANNOUNCER_MONITOR_VERSION = "1.0.0";

export const ANNOUNCER_MONITOR_STATES = Object.freeze([
  "uninitialized", "ready", "mounted", "rendered", "updated", "partial", "stale",
  "disabled", "unavailable", "error", "cleared", "destroyed"
]);

export const ANNOUNCER_MONITOR_DISPLAY_MODES = Object.freeze([
  "balanced", "video_focus", "data_focus", "compact", "large_text"
]);

export const ANNOUNCER_MONITOR_ERROR_CODES = Object.freeze({
  INVALID: "announcer-monitor-invalid",
  INVALID_CONFIG: "announcer-monitor-invalid-config",
  INVALID_PROJECTION: "announcer-monitor-invalid-projection",
  INCOMPATIBLE_ROUTE: "announcer-monitor-incompatible-route",
  INVALID_VISIBILITY: "announcer-monitor-invalid-visibility",
  REVISION_REGRESSION: "announcer-monitor-revision-regression",
  REVISION_CONFLICT: "announcer-monitor-revision-conflict",
  CONTEXT_CONFLICT: "announcer-monitor-context-conflict",
  NOT_CONFIGURED: "announcer-monitor-not-configured",
  NOT_MOUNTED: "announcer-monitor-not-mounted",
  TARGET_INVALID: "announcer-monitor-target-invalid",
  ROOT_CONFLICT: "announcer-monitor-root-conflict",
  DESTROYED: "announcer-monitor-destroyed",
  RENDER_FAILED: "announcer-monitor-render-failed",
  UNSAFE_PAYLOAD: "announcer-monitor-unsafe-payload",
  SIZE_LIMIT: "announcer-monitor-size-limit",
  UNAVAILABLE: "announcer-monitor-unavailable",
  SNAPSHOT_INVALID: "announcer-monitor-snapshot-invalid"
});

const SNAPSHOT_VERSION = "1.0.0";
const INSTANCES = new WeakMap();
const STATES = new Set(ANNOUNCER_MONITOR_STATES);
const DISPLAY_MODES = new Set(ANNOUNCER_MONITOR_DISPLAY_MODES);
const VISIBILITIES = new Set(["operational", "restricted"]);
const ORIENTATIONS = new Set(["landscape", "portrait", "ultra_wide", "auto"]);
const ROUTE_STATUSES = new Set(["routed", "stale", "disabled", "cleared", "error"]);
const TIMER_STATES = new Set([
  "ready", "running", "paused", "stopped", "finished", "completed", "unavailable", "stale", "offline"
]);
const ALERT_LEVELS = new Set(["info", "warning", "critical"]);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const UNSAFE_PROTOCOL = /^\s*(?:javascript|vbscript|file|data\s*:\s*(?:text\/html|application\/javascript)|blob)\s*:/i;
const UNSAFE_LINK = /(?:https?:\/\/|www\.)\S+/gi;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FORBIDDEN_KEYS = new Set([
  "audio", "autoplay", "buffer", "buffers", "callback", "callbacks", "camera", "connection",
  "connections", "device", "dom", "element", "firebase", "firebaseref", "frame", "frames",
  "handler", "handlers", "hook", "hooks", "iframe", "listener", "listeners", "microphone",
  "ndi", "ndisource", "node", "plugin", "plugins", "renderer", "runtime", "socket", "sockets",
  "stream", "streams", "target", "video", "videourl"
]);
const SECRET_KEYS = new Set([
  "accesskey", "accesstoken", "apikey", "auth", "authorization", "cookie", "cookies", "credential",
  "credentials", "headers", "ip", "ipaddress", "password", "port", "privatekey", "refreshtoken",
  "secret", "secrets", "signedurl", "token", "tokens"
]);
const PRIVATE_CONTEXT_KEYS = new Set([
  "actor", "createdby", "judge", "judgeid", "operator", "operatorid", "privatecontext", "updatedby", "userid"
]);
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 12000;
const MAX_TOTAL_SIZE = 600000;
const MAX_STANDINGS = 100;
const MAX_NOTES = 60;
const MAX_ALERTS = 60;
const MAX_RESOLUTION_EDGE = 8192;
const MAX_RESOLUTION_PIXELS = 36000000;

const DEFAULT_CONFIG = Object.freeze({
  announcerMonitorId: "announcer-monitor-main",
  browserOutputId: "browser-output-announcer-monitor",
  routeId: "route-announcer-monitor",
  outputId: "announcer-monitor",
  routeType: "announcer_monitor",
  sourceType: "announcer_projection",
  name: "Announcer Monitor",
  displayMode: "balanced",
  visibility: "operational",
  resolution: Object.freeze({ width: 1920, height: 1080 }),
  orientation: "landscape",
  transparentBackground: false,
  viewport: null,
  videoRegion: Object.freeze({
    enabled: true,
    status: "placeholder",
    sourceType: null,
    connected: false,
    muted: true,
    aspectRatio: "16:9"
  }),
  metadata: Object.freeze({})
});

export class BroadcastAnnouncerMonitorError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastAnnouncerMonitorError";
    this.code = code;
    this.details = safeClone(details, { rejectUnsafe: false, visibility: "restricted" }).value || {};
  }
}

export function createAnnouncerMonitor(definition = {}, options = {}) {
  const safe = safeClone(definition, { rejectUnsafe: true, visibility: "restricted" });
  if (safe.errors.length) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID_CONFIG, { errors: safe.errors });
  const announcerMonitorId = normalizeId(safe.value?.announcerMonitorId) || DEFAULT_CONFIG.announcerMonitorId;
  const browserOutputId = normalizeId(safe.value?.browserOutputId) || DEFAULT_CONFIG.browserOutputId;
  const now = normalizeNow(options.now);
  const browserOutput = createBrowserOutput({
    browserOutputId,
    name: normalizeText(safe.value?.name) || DEFAULT_CONFIG.name,
    metadata: safe.value?.metadata || {}
  }, { now });
  const instance = {
    announcerMonitorVersion: ANNOUNCER_MONITOR_VERSION,
    announcerMonitorId,
    browserOutputId,
    routeId: DEFAULT_CONFIG.routeId,
    outputId: DEFAULT_CONFIG.outputId,
    routeType: DEFAULT_CONFIG.routeType,
    sourceType: DEFAULT_CONFIG.sourceType,
    name: normalizeText(safe.value?.name) || DEFAULT_CONFIG.name,
    status: "uninitialized",
    displayMode: DEFAULT_CONFIG.displayMode,
    visibility: DEFAULT_CONFIG.visibility,
    resolution: { ...DEFAULT_CONFIG.resolution },
    orientation: DEFAULT_CONFIG.orientation,
    viewport: null,
    mounted: false,
    rootId: `announcer-monitor-root-${announcerMonitorId}`,
    sourceRevision: null,
    routeRevision: null,
    projectionRevision: 0,
    tournamentId: null,
    competitionId: null,
    sessionId: null,
    videoRegionId: `announcer-video-region-${announcerMonitorId}`,
    videoRegionPresent: true,
    videoRegionStatus: "placeholder",
    videoDisplayMode: DEFAULT_CONFIG.displayMode,
    videoConnected: false,
    videoSourceType: null,
    videoMuted: true,
    createdAt: now,
    updatedAt: now,
    mountedAt: null,
    lastProjectionAt: null,
    clearedAt: null,
    destroyedAt: null,
    warnings: [],
    errors: [],
    metadata: normalizeMetadata(safe.value?.metadata)
  };
  INSTANCES.set(instance, {
    browserOutput,
    config: null,
    container: null,
    root: null,
    regions: null,
    listeners: [],
    currentEnvelope: null,
    currentProjection: null,
    lastValidEnvelope: null,
    lastValidProjection: null,
    lastFingerprint: null,
    context: emptyContext(),
    textScale: 1,
    destroyed: false,
    debug: options.debug === true
  });
  return instance;
}

export function configureAnnouncerMonitor(instance, config = {}, options = {}) {
  const runtime = requireInstance(instance);
  const merged = {
    ...DEFAULT_CONFIG,
    ...(runtime.config || {}),
    ...(isRecord(config) ? config : {}),
    videoRegion: {
      ...DEFAULT_CONFIG.videoRegion,
      ...(runtime.config?.videoRegion || {}),
      ...(isRecord(config?.videoRegion) ? config.videoRegion : {})
    },
    announcerMonitorId: instance.announcerMonitorId,
    browserOutputId: instance.browserOutputId
  };
  const validation = validateAnnouncerMonitorConfig(merged);
  if (!validation.valid) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID_CONFIG, { errors: validation.errors });
  const normalized = normalizeConfig(merged);
  configureBrowserOutput(runtime.browserOutput, browserConfig(normalized), { now: options.now });
  runtime.config = freezeDeep(cloneAnnouncerSnapshot(normalized));
  runtime.context = freezeDeep(readContext(normalized));
  syncInstance(instance, {
    ...normalized,
    status: runtime.root ? "mounted" : "ready",
    mounted: Boolean(runtime.root),
    updatedAt: normalizeNow(options.now),
    warnings: validation.warnings,
    errors: [],
    videoRegionPresent: true,
    videoRegionStatus: "placeholder",
    videoDisplayMode: normalized.displayMode,
    videoConnected: false,
    videoSourceType: null,
    videoMuted: true
  });
  if (runtime.root) renderCurrentState(instance, runtime);
  return getAnnouncerMonitor(instance);
}

export function mountAnnouncerMonitor(instance, container, options = {}) {
  const runtime = requireInstance(instance);
  if (!runtime.config) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.NOT_CONFIGURED);
  if (!validMountTarget(container)) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.TARGET_INVALID);
  if (runtime.root) {
    if (runtime.container !== container) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.ROOT_CONFLICT);
    return getAnnouncerMonitor(instance);
  }
  const now = normalizeNow(options.now);
  try {
    mountBrowserOutput(runtime.browserOutput, container, { now });
    const root = findBrowserRoot(container, instance.browserOutputId);
    if (!root) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.TARGET_INVALID, { reason: "browser-root-missing" });
    [...(root.children || [])]
      .find((child) => hasClass(child, "browser-output-frame"))
      ?.remove?.();
    root.setAttribute("id", instance.rootId);
    root.className = `${String(root.className || "")} announcer-monitor-root`.trim();
    safeAttribute(root, "data-announcer-monitor-id", instance.announcerMonitorId);
    safeAttribute(root, "data-output-id", instance.outputId);
    safeAttribute(root, "data-route-id", instance.routeId);
    safeAttribute(root, "data-monitor-state", "mounted");
    safeAttribute(root, "data-display-mode", instance.displayMode);
    safeAttribute(root, "data-visibility", instance.visibility);
    safeAttribute(root, "data-video-region-status", "placeholder");
    const regions = createMonitorStructure(root.ownerDocument, root, instance, runtime);
    runtime.container = container;
    runtime.root = root;
    runtime.regions = regions;
    syncInstance(instance, {
      status: "mounted",
      mounted: true,
      mountedAt: now,
      updatedAt: now,
      errors: []
    });
    renderCurrentState(instance, runtime);
    return getAnnouncerMonitor(instance);
  } catch (error) {
    removeListeners(runtime);
    runtime.root?.remove?.();
    runtime.container = null;
    runtime.root = null;
    runtime.regions = null;
    syncInstance(instance, {
      status: "error",
      mounted: false,
      updatedAt: now,
      errors: [error?.code || ANNOUNCER_MONITOR_ERROR_CODES.TARGET_INVALID]
    });
    throw normalizeMonitorError(error, ANNOUNCER_MONITOR_ERROR_CODES.TARGET_INVALID);
  }
}

export function updateAnnouncerMonitor(instance, envelope, options = {}) {
  const runtime = requireInstance(instance);
  requireMounted(runtime);
  const validation = validateAnnouncerProjection(envelope, {
    config: runtime.config,
    context: options.context || runtime.context
  });
  if (!validation.valid) {
    throw monitorError(validation.code || ANNOUNCER_MONITOR_ERROR_CODES.INVALID_PROJECTION, { errors: validation.errors });
  }
  const normalized = normalizeEnvelope(envelope, validation.visibility);
  assertRevisionOrder(instance, runtime, normalized);
  const fingerprint = stableFingerprint(normalized);
  if (instance.routeRevision === normalized.routeRevision && instance.sourceRevision === normalized.sourceRevision) {
    if (runtime.lastFingerprint === fingerprint) return getAnnouncerMonitor(instance);
    throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.REVISION_CONFLICT, {
      routeRevision: normalized.routeRevision,
      sourceRevision: normalized.sourceRevision
    });
  }
  const now = normalizeNow(options.now || normalized.resolvedAt);
  const nextState = resolveMonitorState(normalized);
  let nextProjection = normalized.projection;
  if (nextState === "stale" && runtime.lastValidProjection) {
    nextProjection = sanitizeProjectionForVisibility(runtime.lastValidProjection, validation.visibility);
  }
  const renderModel = buildRenderModel(nextProjection, nextState, validation.visibility);
  const nextContext = mergeContext(runtime.context, readProjectionContext(normalized));
  validateContextTransition(runtime.context, nextContext);

  try {
    applyBrowserOutputProjection(runtime.browserOutput, browserCompatibleEnvelope(normalized), {
      now,
      visibility: validation.visibility,
      context: options.context
    });
    runtime.currentEnvelope = freezeDeep(cloneAnnouncerSnapshot(normalized));
    runtime.currentProjection = nextProjection ? freezeDeep(cloneAnnouncerSnapshot(nextProjection)) : null;
    runtime.lastFingerprint = fingerprint;
    runtime.context = freezeDeep(nextContext);
    if (new Set(["ready", "partial"]).has(nextState)) {
      runtime.lastValidEnvelope = freezeDeep(cloneAnnouncerSnapshot(normalized));
      runtime.lastValidProjection = freezeDeep(cloneAnnouncerSnapshot(nextProjection));
    } else if (nextState !== "stale") {
      runtime.lastValidEnvelope = null;
      runtime.lastValidProjection = null;
    }
    syncInstance(instance, {
      status: nextState,
      visibility: validation.visibility,
      resolution: cloneAnnouncerSnapshot(normalized.resolution),
      sourceRevision: normalized.sourceRevision,
      routeRevision: normalized.routeRevision,
      projectionRevision: instance.projectionRevision + 1,
      tournamentId: nextContext.tournamentId,
      competitionId: nextContext.competitionId,
      sessionId: nextContext.sessionId,
      lastProjectionAt: now,
      updatedAt: now,
      warnings: uniqueStrings([
        ...(normalized.warnings || []),
        ...(nextState === "stale" ? ["announcer-monitor-stale"] : []),
        ...(nextState === "partial" ? ["announcer-monitor-partial"] : [])
      ]),
      errors: uniqueStrings(normalized.errors || [])
    });
    renderCurrentState(instance, runtime, renderModel);
    return getAnnouncerMonitor(instance);
  } catch (error) {
    syncInstance(instance, {
      status: runtime.lastValidProjection ? "stale" : "error",
      updatedAt: now,
      warnings: runtime.lastValidProjection
        ? uniqueStrings([...(instance.warnings || []), "announcer-monitor-last-view-preserved"])
        : instance.warnings,
      errors: uniqueStrings([...(instance.errors || []), error?.code || ANNOUNCER_MONITOR_ERROR_CODES.RENDER_FAILED])
    });
    renderCurrentState(instance, runtime);
    throw normalizeMonitorError(error, ANNOUNCER_MONITOR_ERROR_CODES.RENDER_FAILED);
  }
}

export function renderAnnouncerProjection(instance, envelope, options = {}) {
  return updateAnnouncerMonitor(instance, envelope, options);
}

export function clearAnnouncerMonitor(instance, options = {}) {
  const runtime = requireInstance(instance);
  requireMounted(runtime);
  const now = normalizeNow(options.now);
  clearBrowserOutput(runtime.browserOutput, { now });
  runtime.currentEnvelope = null;
  runtime.currentProjection = null;
  runtime.lastValidEnvelope = null;
  runtime.lastValidProjection = null;
  runtime.lastFingerprint = null;
  syncInstance(instance, {
    status: "cleared",
    sourceRevision: null,
    routeRevision: null,
    projectionRevision: instance.projectionRevision + 1,
    tournamentId: runtime.context.tournamentId,
    competitionId: runtime.context.competitionId,
    sessionId: runtime.context.sessionId,
    clearedAt: now,
    updatedAt: now,
    warnings: [],
    errors: [],
    videoRegionPresent: true,
    videoRegionStatus: "placeholder",
    videoConnected: false,
    videoSourceType: null,
    videoMuted: true
  });
  renderCurrentState(instance, runtime, buildRenderModel(null, "cleared", instance.visibility));
  return getAnnouncerMonitor(instance);
}

export function destroyAnnouncerMonitor(instance, options = {}) {
  const runtime = requireInstance(instance);
  const now = normalizeNow(options.now);
  removeListeners(runtime);
  destroyBrowserOutput(runtime.browserOutput, { now });
  runtime.container = null;
  runtime.root = null;
  runtime.regions = null;
  runtime.config = null;
  runtime.currentEnvelope = null;
  runtime.currentProjection = null;
  runtime.lastValidEnvelope = null;
  runtime.lastValidProjection = null;
  runtime.lastFingerprint = null;
  runtime.context = emptyContext();
  runtime.destroyed = true;
  syncInstance(instance, {
    status: "destroyed",
    mounted: false,
    sourceRevision: null,
    routeRevision: null,
    tournamentId: null,
    competitionId: null,
    sessionId: null,
    videoRegionPresent: false,
    videoRegionStatus: "destroyed",
    videoConnected: false,
    videoSourceType: null,
    videoMuted: true,
    destroyedAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  });
  return cloneDescriptor(instance);
}

export function setAnnouncerDisplayMode(instance, displayMode, options = {}) {
  const runtime = requireInstance(instance);
  if (!DISPLAY_MODES.has(displayMode)) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID_CONFIG, { field: "displayMode" });
  const now = normalizeNow(options.now);
  if (runtime.config) runtime.config = freezeDeep({ ...cloneAnnouncerSnapshot(runtime.config), displayMode });
  syncInstance(instance, {
    displayMode,
    videoDisplayMode: displayMode,
    updatedAt: now
  });
  applyRootAttributes(instance, runtime);
  return getAnnouncerMonitor(instance);
}

export function setAnnouncerViewport(instance, viewport, options = {}) {
  const runtime = requireInstance(instance);
  const errors = validateViewport(viewport);
  if (errors.length) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID_CONFIG, { errors });
  const normalized = { width: Number(viewport.width), height: Number(viewport.height) };
  setBrowserOutputViewport(runtime.browserOutput, normalized, { now: options.now });
  if (runtime.config) runtime.config = freezeDeep({ ...cloneAnnouncerSnapshot(runtime.config), viewport: normalized });
  syncInstance(instance, { viewport: normalized, updatedAt: normalizeNow(options.now) });
  applyRootAttributes(instance, runtime);
  return getAnnouncerMonitor(instance);
}

export function getAnnouncerMonitor(instance) {
  requireInstance(instance);
  return cloneDescriptor(instance);
}

export function getAnnouncerStatus(instance) {
  requireInstance(instance);
  return {
    announcerMonitorId: instance.announcerMonitorId,
    status: instance.status,
    mounted: instance.mounted,
    displayMode: instance.displayMode,
    visibility: instance.visibility,
    projectionRevision: instance.projectionRevision,
    routeRevision: instance.routeRevision,
    sourceRevision: instance.sourceRevision,
    updatedAt: instance.updatedAt
  };
}

export function getAnnouncerWarnings(instance) {
  requireInstance(instance);
  return uniqueStrings(instance.warnings || []);
}

export function getAnnouncerErrors(instance) {
  requireInstance(instance);
  return uniqueStrings(instance.errors || []);
}

export function getAnnouncerSnapshot(instance, options = {}) {
  const runtime = requireInstance(instance);
  const visibility = options.visibility || instance.visibility;
  if (!VISIBILITIES.has(visibility)) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID_VISIBILITY);
  if (visibility === "restricted" && instance.visibility !== "restricted") {
    throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID_VISIBILITY, { reason: "visibility-elevation" });
  }
  const projection = sanitizeProjectionForVisibility(runtime.currentProjection, visibility);
  const snapshot = {
    snapshotVersion: SNAPSHOT_VERSION,
    announcerMonitorVersion: ANNOUNCER_MONITOR_VERSION,
    announcerMonitorId: instance.announcerMonitorId,
    browserOutputId: instance.browserOutputId,
    routeId: instance.routeId,
    outputId: instance.outputId,
    routeType: instance.routeType,
    sourceType: instance.sourceType,
    status: instance.status,
    displayMode: instance.displayMode,
    visibility,
    resolution: cloneAnnouncerSnapshot(instance.resolution),
    orientation: instance.orientation,
    mounted: instance.mounted,
    sourceRevision: instance.sourceRevision,
    routeRevision: instance.routeRevision,
    projectionRevision: instance.projectionRevision,
    lastProjectionAt: instance.lastProjectionAt,
    currentSummary: summarizeCurrent(projection?.current),
    nextSummary: summarizeNext(projection?.next),
    timerSummary: summarizeTimer(projection?.timer),
    contextSummary: summarizeContext(projection?.context),
    standingsCount: projection?.standings?.length || 0,
    notesCount: projection?.notes?.length || 0,
    alertsCount: projection?.alerts?.length || 0,
    sponsorPresent: Boolean(projection?.sponsorMention),
    videoRegionPresent: instance.videoRegionPresent,
    videoRegionStatus: instance.videoRegionStatus,
    videoDisplayMode: instance.videoDisplayMode,
    videoConnected: false,
    videoSourceType: null,
    videoMuted: true,
    warnings: uniqueStrings(instance.warnings || []),
    errors: uniqueStrings(instance.errors || []),
    generatedAt: normalizeNow(options.now)
  };
  const safe = safeClone(snapshot, { rejectUnsafe: false, visibility }).value;
  const validation = validateAnnouncerSnapshot(safe);
  if (!validation.valid) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.SNAPSHOT_INVALID, { errors: validation.errors });
  return cloneAnnouncerSnapshot(safe);
}

export function validateAnnouncerMonitorConfig(config) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(config, { rejectUnsafe: true, visibility: "restricted" });
  errors.push(...safe.errors);
  const value = safe.value;
  if (!isRecord(value)) return validationResult(false, [ANNOUNCER_MONITOR_ERROR_CODES.INVALID_CONFIG], warnings);
  if (!normalizeId(value.announcerMonitorId)) errors.push("announcer-monitor-id-invalid");
  if (!normalizeId(value.browserOutputId)) errors.push("announcer-monitor-browser-id-invalid");
  if (value.routeId !== "route-announcer-monitor") errors.push("announcer-monitor-route-id-invalid");
  if (value.outputId !== "announcer-monitor") errors.push("announcer-monitor-output-id-invalid");
  if (value.routeType !== "announcer_monitor") errors.push("announcer-monitor-route-type-invalid");
  if (value.sourceType !== "announcer_projection") errors.push("announcer-monitor-source-type-invalid");
  if (!DISPLAY_MODES.has(value.displayMode)) errors.push("announcer-monitor-display-mode-invalid");
  if (!VISIBILITIES.has(value.visibility)) errors.push("announcer-monitor-visibility-invalid");
  if (!ORIENTATIONS.has(value.orientation)) errors.push("announcer-monitor-orientation-invalid");
  errors.push(...validateResolution(value.resolution));
  if (value.viewport !== undefined && value.viewport !== null) errors.push(...validateViewport(value.viewport));
  if (value.transparentBackground !== undefined && typeof value.transparentBackground !== "boolean") {
    errors.push("announcer-monitor-transparency-invalid");
  }
  errors.push(...validateVideoRegion(value.videoRegion));
  return validationResult(errors.length === 0, uniqueStrings(errors), warnings);
}

export function validateAnnouncerProjection(envelope, options = {}) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(envelope, { rejectUnsafe: true, visibility: envelope?.visibility || "restricted" });
  errors.push(...safe.errors);
  const value = safe.value;
  let code = null;
  if (!isRecord(value)) return projectionValidation(false, [ANNOUNCER_MONITOR_ERROR_CODES.INVALID_PROJECTION], warnings, ANNOUNCER_MONITOR_ERROR_CODES.INVALID_PROJECTION);
  if (value.routeId !== "route-announcer-monitor") errors.push("announcer-monitor-route-id-invalid");
  if (value.routeType !== "announcer_monitor") errors.push("announcer-monitor-route-type-invalid");
  if (value.outputId !== "announcer-monitor") errors.push("announcer-monitor-output-id-invalid");
  if (value.sourceType !== "announcer_projection") errors.push("announcer-monitor-source-type-invalid");
  if (!nonNegativeInteger(value.sourceRevision)) errors.push("announcer-monitor-source-revision-invalid");
  if (!nonNegativeInteger(value.routeRevision)) errors.push("announcer-monitor-route-revision-invalid");
  if (!ROUTE_STATUSES.has(value.status)) errors.push("announcer-monitor-route-status-invalid");
  if (!VISIBILITIES.has(value.visibility)) {
    errors.push("announcer-monitor-visibility-invalid");
    code = ANNOUNCER_MONITOR_ERROR_CODES.INVALID_VISIBILITY;
  }
  errors.push(...validateResolution(value.resolution));
  if (!validStringArray(value.warnings)) errors.push("announcer-monitor-warnings-invalid");
  if (!validStringArray(value.errors)) errors.push("announcer-monitor-errors-invalid");
  if (!isIso(value.resolvedAt)) errors.push("announcer-monitor-resolved-at-invalid");
  const projectionRequired = new Set(["routed", "stale"]).has(value.status);
  if (projectionRequired || value.projection !== null) errors.push(...validateProjectionPayload(value.projection));
  if (isRecord(options.config)) {
    if (options.config.routeId !== value.routeId || options.config.outputId !== value.outputId
      || options.config.routeType !== value.routeType || options.config.sourceType !== value.sourceType) {
      errors.push("announcer-monitor-route-incompatible");
      code = ANNOUNCER_MONITOR_ERROR_CODES.INCOMPATIBLE_ROUTE;
    }
  }
  const expectedContext = mergeContext(readContext(options.config), readContext(options.context));
  const incomingContext = readProjectionContext(value);
  const contextErrors = validateContextCompatibility(expectedContext, incomingContext);
  if (contextErrors.length) {
    errors.push(...contextErrors);
    code = ANNOUNCER_MONITOR_ERROR_CODES.CONTEXT_CONFLICT;
  }
  const browserValidation = validateBrowserOutputProjection(browserCompatibleEnvelope(value), {
    config: isRecord(options.config) ? browserConfig(options.config) : undefined,
    visibility: value.visibility,
    context: options.context
  });
  if (!browserValidation.valid) {
    errors.push(...browserValidation.errors.map((item) => `announcer-monitor-browser-${item}`));
    code ||= browserValidation.code === "browser-output-context-conflict"
      ? ANNOUNCER_MONITOR_ERROR_CODES.CONTEXT_CONFLICT
      : ANNOUNCER_MONITOR_ERROR_CODES.INVALID_PROJECTION;
  }
  if (stableFingerprint(value).length > MAX_TOTAL_SIZE) {
    errors.push("announcer-monitor-payload-too-large");
    code = ANNOUNCER_MONITOR_ERROR_CODES.SIZE_LIMIT;
  }
  return projectionValidation(errors.length === 0, uniqueStrings(errors), warnings, code, value.visibility);
}

export function validateAnnouncerSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  const safe = safeClone(snapshot, { rejectUnsafe: true, visibility: snapshot?.visibility || "restricted" });
  errors.push(...safe.errors);
  const value = safe.value;
  if (!isRecord(value)) return validationResult(false, [ANNOUNCER_MONITOR_ERROR_CODES.SNAPSHOT_INVALID], warnings);
  if (value.snapshotVersion !== SNAPSHOT_VERSION) errors.push("announcer-monitor-snapshot-version-invalid");
  if (value.announcerMonitorVersion !== ANNOUNCER_MONITOR_VERSION) errors.push("announcer-monitor-version-invalid");
  if (!normalizeId(value.announcerMonitorId)) errors.push("announcer-monitor-snapshot-id-invalid");
  if (value.routeType !== "announcer_monitor" || value.outputId !== "announcer-monitor" || value.sourceType !== "announcer_projection") {
    errors.push("announcer-monitor-snapshot-type-invalid");
  }
  if (!STATES.has(value.status)) errors.push("announcer-monitor-snapshot-state-invalid");
  if (!DISPLAY_MODES.has(value.displayMode)) errors.push("announcer-monitor-snapshot-display-mode-invalid");
  if (!VISIBILITIES.has(value.visibility)) errors.push("announcer-monitor-snapshot-visibility-invalid");
  errors.push(...validateResolution(value.resolution));
  if (!ORIENTATIONS.has(value.orientation)) errors.push("announcer-monitor-snapshot-orientation-invalid");
  if (!nonNegativeInteger(value.projectionRevision)) errors.push("announcer-monitor-snapshot-revision-invalid");
  if (!isIso(value.generatedAt)) errors.push("announcer-monitor-snapshot-generated-at-invalid");
  if (value.videoRegionPresent !== true && value.status !== "destroyed") errors.push("announcer-monitor-video-region-invalid");
  if (value.videoConnected !== false || value.videoSourceType !== null || value.videoMuted !== true) {
    errors.push("announcer-monitor-video-state-invalid");
  }
  return validationResult(errors.length === 0, uniqueStrings(errors), warnings);
}

export function cloneAnnouncerSnapshot(value) {
  return safeClone(value, { rejectUnsafe: false, visibility: "restricted" }).value;
}

function normalizeConfig(config) {
  return {
    announcerMonitorId: normalizeId(config.announcerMonitorId),
    browserOutputId: normalizeId(config.browserOutputId),
    routeId: "route-announcer-monitor",
    outputId: "announcer-monitor",
    routeType: "announcer_monitor",
    sourceType: "announcer_projection",
    name: normalizeText(config.name) || DEFAULT_CONFIG.name,
    displayMode: DISPLAY_MODES.has(config.displayMode) ? config.displayMode : "balanced",
    visibility: VISIBILITIES.has(config.visibility) ? config.visibility : "operational",
    resolution: normalizeResolution(config.resolution),
    orientation: ORIENTATIONS.has(config.orientation) ? config.orientation : "landscape",
    transparentBackground: config.transparentBackground === true,
    viewport: config.viewport ? { width: Number(config.viewport.width), height: Number(config.viewport.height) } : null,
    videoRegion: {
      enabled: true,
      status: "placeholder",
      sourceType: null,
      connected: false,
      muted: true,
      aspectRatio: "16:9"
    },
    tenantId: normalizeNullableId(config.tenantId),
    organizationId: normalizeNullableId(config.organizationId),
    clientId: normalizeNullableId(config.clientId),
    tournamentId: normalizeNullableId(config.tournamentId),
    competitionId: normalizeNullableId(config.competitionId),
    sessionId: normalizeNullableId(config.sessionId),
    metadata: normalizeMetadata(config.metadata)
  };
}

function browserConfig(config) {
  return {
    browserOutputId: config.browserOutputId,
    outputType: "announcer_monitor",
    routeId: config.routeId,
    outputId: config.outputId,
    displayMode: "responsive",
    visibility: "restricted",
    resolution: config.resolution,
    orientation: config.orientation,
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: config.transparentBackground,
    fullscreenAllowed: true,
    viewport: config.viewport,
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    clientId: config.clientId,
    tournamentId: config.tournamentId,
    competitionId: config.competitionId,
    sessionId: config.sessionId,
    metadata: { surface: "announcer-monitor" }
  };
}

function normalizeEnvelope(envelope, visibility) {
  const safe = safeClone(envelope, { rejectUnsafe: false, visibility });
  const value = safe.value;
  return {
    routeId: "route-announcer-monitor",
    routeType: "announcer_monitor",
    outputId: "announcer-monitor",
    sourceType: "announcer_projection",
    sourceRevision: Number(value.sourceRevision),
    routeRevision: Number(value.routeRevision),
    status: value.status,
    visibility,
    resolution: normalizeResolution(value.resolution),
    projection: value.projection ? normalizeProjection(value.projection, visibility) : null,
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

function normalizeProjection(projection, visibility) {
  const current = normalizeCurrent(projection.current);
  const context = normalizeContext(projection.context, projection.current);
  const notes = normalizeNotes(projection.notes, projection.privateNotes, visibility);
  const alerts = normalizeAlerts(projection.alerts, visibility);
  return {
    kind: "announcer-monitor",
    status: normalizeText(projection.status),
    current,
    next: normalizeNext(projection.next),
    standings: normalizeStandings(projection.standings),
    timer: normalizeTimer(projection.timer),
    notes,
    sponsorMention: normalizeSponsor(projection.sponsorMention),
    alerts,
    context,
    generatedAt: normalizeIso(projection.generatedAt),
    empty: projection.empty === true
  };
}

function normalizeCurrent(value) {
  const source = isRecord(value) ? value : {};
  const team = isRecord(source.team) ? source.team : {};
  const participant = isRecord(source.participant) ? source.participant : {};
  const horse = isRecord(source.horse) ? source.horse : {};
  const suerte = isRecord(source.suerte) ? source.suerte : {};
  const score = isRecord(source.score) ? source.score : {};
  return {
    teamId: nullableText(source.teamId ?? team.id),
    teamName: nullableText(source.teamName ?? team.name),
    teamShortName: nullableText(source.teamShortName ?? team.shortName),
    participantId: nullableText(source.participantId ?? participant.id),
    participantName: nullableText(source.participantName ?? participant.name ?? participant.alias),
    horseId: nullableText(source.horseId ?? horse.id),
    horseName: nullableText(source.horseName ?? horse.name),
    suerteId: nullableText(source.suerteId ?? suerte.id),
    suerteName: nullableText(source.suerteName ?? suerte.name),
    attempt: preserveValue(source.attempt ?? suerte.attempt),
    score: preserveValue(source.scoreValue ?? source.total ?? (isRecord(source.score) ? score.total : source.score)),
    position: preserveValue(source.position ?? team.position ?? participant.position),
    leader: preserveValue(source.leader),
    status: nullableText(source.status ?? suerte.status ?? score.status),
    turnRevision: preserveValue(source.turnRevision)
  };
}

function normalizeNext(value) {
  const source = isRecord(value) ? value : {};
  const team = isRecord(source.team) ? source.team : {};
  const participant = isRecord(source.participant) ? source.participant : {};
  const horse = isRecord(source.horse) ? source.horse : {};
  const suerte = isRecord(source.suerte) ? source.suerte : {};
  return {
    teamId: nullableText(source.teamId ?? team.id),
    teamName: nullableText(source.teamName ?? team.name),
    teamShortName: nullableText(source.teamShortName ?? team.shortName),
    participantId: nullableText(source.participantId ?? participant.id),
    participantName: nullableText(source.participantName ?? participant.name ?? participant.alias),
    horseId: nullableText(source.horseId ?? horse.id),
    horseName: nullableText(source.horseName ?? horse.name),
    suerteId: nullableText(source.suerteId ?? suerte.id),
    suerteName: nullableText(source.suerteName ?? suerte.name),
    estimatedOrder: preserveValue(source.estimatedOrder ?? source.order),
    status: nullableText(source.status)
  };
}

function normalizeContext(value, currentValue) {
  const source = isRecord(value) ? value : {};
  const current = isRecord(currentValue) ? currentValue : {};
  const tournament = isRecord(current.tournament) ? current.tournament : {};
  const competition = isRecord(current.competition) ? current.competition : {};
  const charreada = isRecord(current.charreada) ? current.charreada : {};
  const suerte = isRecord(current.suerte) ? current.suerte : {};
  return {
    tournamentId: nullableText(source.tournamentId ?? tournament.id),
    tournamentName: nullableText(source.tournamentName ?? tournament.name),
    competitionId: nullableText(source.competitionId ?? competition.id),
    competitionName: nullableText(source.competitionName ?? competition.name),
    competitionScope: nullableText(source.competitionScope ?? competition.scope),
    sessionId: nullableText(source.sessionId),
    sessionName: nullableText(source.sessionName),
    charreadaId: nullableText(source.charreadaId ?? charreada.id),
    charreadaName: nullableText(source.charreadaName ?? charreada.name),
    venueName: nullableText(source.venueName ?? tournament.venue),
    currentSuerteName: nullableText(source.currentSuerteName ?? suerte.name),
    categoryName: nullableText(source.categoryName ?? competition.category),
    eventDate: nullableText(source.eventDate ?? charreada.date),
    progress: preserveValue(source.progress),
    status: nullableText(source.status ?? charreada.status ?? tournament.status)
  };
}

function normalizeTimer(value) {
  const source = isRecord(value) ? value : {};
  const status = TIMER_STATES.has(source.status) ? source.status : (source.status ? "unavailable" : "unavailable");
  return {
    timerId: nullableText(source.timerId ?? source.id),
    status,
    formattedTime: preserveValue(source.formattedTime ?? source.display),
    elapsedMs: finiteNonNegativeOrNull(source.elapsedMs),
    remainingMs: finiteNonNegativeOrNull(source.remainingMs),
    sourceRevision: nonNegativeInteger(source.sourceRevision ?? source.revision) ? Number(source.sourceRevision ?? source.revision) : null,
    alertState: nullableText(source.alertState),
    startedAt: normalizeNullableIso(source.startedAt),
    pausedAt: normalizeNullableIso(source.pausedAt),
    stoppedAt: normalizeNullableIso(source.stoppedAt),
    generatedAt: normalizeNullableIso(source.generatedAt)
  };
}

function normalizeStandings(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_STANDINGS).map((entry, index) => {
    if (!isRecord(entry)) return { position: index + 1, teamName: nullableText(entry), score: null };
    return {
      position: preserveValue(entry.position),
      teamId: nullableText(entry.teamId ?? entry.participantId ?? entry.id),
      teamName: nullableText(entry.teamName ?? entry.participantName ?? entry.name),
      teamShortName: nullableText(entry.teamShortName ?? entry.shortName),
      score: preserveValue(entry.score ?? entry.total),
      status: nullableText(entry.status),
      difference: preserveValue(entry.difference)
    };
  });
}

function normalizeNotes(value, privateNotes, visibility) {
  const source = Array.isArray(value) ? value : [];
  const normalized = source.slice(0, MAX_NOTES).map((entry, index) => normalizeNote(entry, index, "operational")).filter(Boolean);
  if (visibility === "restricted" && Array.isArray(privateNotes)) {
    normalized.push(...privateNotes.slice(0, Math.max(0, MAX_NOTES - normalized.length))
      .map((entry, index) => normalizeNote(entry, source.length + index, "restricted"))
      .filter(Boolean));
  }
  return normalized.filter((note) => visibility === "restricted" || note.visibility !== "restricted");
}

function normalizeNote(entry, index, fallbackVisibility) {
  if (typeof entry === "string") {
    return { messageId: `note-${index + 1}`, text: sanitizeVisibleText(entry), priority: "normal", category: "information", createdAt: null, expiresAt: null, readOnly: true, visibility: fallbackVisibility };
  }
  if (!isRecord(entry)) return null;
  const visibility = entry.visibility === "restricted" ? "restricted" : fallbackVisibility;
  return {
    messageId: normalizeId(entry.messageId ?? entry.id) || `note-${index + 1}`,
    text: sanitizeVisibleText(entry.text ?? entry.message ?? ""),
    priority: nullableText(entry.priority) || "normal",
    category: nullableText(entry.category) || "information",
    createdAt: normalizeNullableIso(entry.createdAt),
    expiresAt: normalizeNullableIso(entry.expiresAt),
    readOnly: true,
    visibility
  };
}

function normalizeSponsor(value) {
  if (!isRecord(value)) return null;
  const logoRef = normalizeAssetRef(value.logoRef);
  return {
    sponsorId: nullableText(value.sponsorId ?? value.id),
    sponsorName: nullableText(value.sponsorName ?? value.name),
    mentionText: nullableText(value.mentionText ?? value.text),
    campaignName: nullableText(value.campaignName),
    priority: nullableText(value.priority),
    expiresAt: normalizeNullableIso(value.expiresAt),
    logoRef
  };
}

function normalizeAlerts(value, visibility) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ALERTS).map((entry, index) => {
    if (typeof entry === "string") {
      return { alertId: `alert-${index + 1}`, level: "info", title: "Información", message: sanitizeVisibleText(entry), generatedAt: null, expiresAt: null, category: "information", visibility: "operational" };
    }
    if (!isRecord(entry)) return null;
    return {
      alertId: normalizeId(entry.alertId ?? entry.id) || `alert-${index + 1}`,
      level: ALERT_LEVELS.has(entry.level) ? entry.level : "info",
      title: nullableText(entry.title) || "Información",
      message: sanitizeVisibleText(entry.message ?? entry.text ?? ""),
      generatedAt: normalizeNullableIso(entry.generatedAt),
      expiresAt: normalizeNullableIso(entry.expiresAt),
      category: nullableText(entry.category) || "information",
      visibility: entry.visibility === "restricted" ? "restricted" : "operational"
    };
  }).filter((entry) => entry && (visibility === "restricted" || entry.visibility !== "restricted"));
}

function normalizeAssetRef(value) {
  if (typeof value === "string" && normalizeId(value)) return { assetId: normalizeId(value), version: null, variant: null };
  if (!isRecord(value)) return null;
  const assetId = normalizeId(value.assetId);
  if (!assetId) return null;
  return {
    assetId,
    version: nullableText(value.version),
    variant: nullableText(value.variant)
  };
}

function validateProjectionPayload(value) {
  const errors = [];
  if (!isRecord(value)) return ["announcer-monitor-projection-missing"];
  if (value.kind !== undefined && value.kind !== "announcer-monitor") errors.push("announcer-monitor-projection-kind-invalid");
  if (!isRecord(value.current)) errors.push("announcer-monitor-current-invalid");
  if (!isRecord(value.next)) errors.push("announcer-monitor-next-invalid");
  if (!Array.isArray(value.standings)) errors.push("announcer-monitor-standings-invalid");
  if (!isRecord(value.timer)) errors.push("announcer-monitor-timer-invalid");
  if (!Array.isArray(value.notes)) errors.push("announcer-monitor-notes-invalid");
  if (!(value.sponsorMention === null || isRecord(value.sponsorMention))) errors.push("announcer-monitor-sponsor-invalid");
  if (!Array.isArray(value.alerts)) errors.push("announcer-monitor-alerts-invalid");
  if (!isRecord(value.context)) errors.push("announcer-monitor-context-invalid");
  if (!isIso(value.generatedAt)) errors.push("announcer-monitor-generated-at-invalid");
  if (Array.isArray(value.standings) && value.standings.length > MAX_STANDINGS) errors.push("announcer-monitor-standings-limit");
  if (Array.isArray(value.notes) && value.notes.length > MAX_NOTES) errors.push("announcer-monitor-notes-limit");
  if (Array.isArray(value.alerts) && value.alerts.length > MAX_ALERTS) errors.push("announcer-monitor-alerts-limit");
  return errors;
}

function validateVideoRegion(value) {
  const errors = [];
  if (!isRecord(value)) return ["announcer-monitor-video-region-invalid"];
  if (value.enabled !== true) errors.push("announcer-monitor-video-region-required");
  if (value.status !== "placeholder") errors.push("announcer-monitor-video-status-invalid");
  if (value.sourceType !== null) errors.push("announcer-monitor-video-source-invalid");
  if (value.connected !== false) errors.push("announcer-monitor-video-connected-invalid");
  if (value.muted !== true) errors.push("announcer-monitor-video-muted-invalid");
  if (value.aspectRatio !== "16:9") errors.push("announcer-monitor-video-aspect-invalid");
  return errors;
}

function resolveMonitorState(envelope) {
  if (envelope.status === "disabled") return "disabled";
  if (envelope.status === "stale") return "stale";
  if (envelope.status === "cleared") return "cleared";
  if (envelope.status === "error" || envelope.errors.length) return "error";
  if (!envelope.projection || envelope.projection.status === "unavailable" || envelope.projection.empty === true) return "unavailable";
  if (!hasUsefulProjection(envelope.projection)) return "unavailable";
  return hasPrimaryFields(envelope.projection) ? "ready" : "partial";
}

function hasUsefulProjection(projection) {
  return Boolean(
    projection.current?.teamName || projection.current?.participantName || projection.current?.suerteName
    || projection.next?.teamName || projection.next?.participantName
    || projection.timer?.formattedTime !== null
    || projection.standings?.length || projection.notes?.length || projection.alerts?.length
    || projection.context?.tournamentName || projection.sponsorMention
  );
}

function hasPrimaryFields(projection) {
  const hasCurrent = Boolean(projection.current?.teamName || projection.current?.participantName);
  const hasTimer = projection.timer?.formattedTime !== null && projection.timer?.formattedTime !== undefined;
  const hasContext = Boolean(projection.context?.tournamentName || projection.context?.competitionName);
  return hasCurrent && hasTimer && hasContext;
}

function sanitizeProjectionForVisibility(projection, visibility) {
  if (!projection) return null;
  const clone = cloneAnnouncerSnapshot(projection);
  clone.notes = (clone.notes || []).filter((note) => visibility === "restricted" || note.visibility !== "restricted");
  clone.alerts = (clone.alerts || []).filter((alert) => visibility === "restricted" || alert.visibility !== "restricted");
  return clone;
}

function browserCompatibleEnvelope(envelope) {
  return {
    routeId: envelope.routeId,
    routeType: envelope.routeType,
    outputId: envelope.outputId,
    sourceType: envelope.sourceType,
    sourceRevision: envelope.sourceRevision,
    routeRevision: envelope.routeRevision,
    status: envelope.status,
    visibility: envelope.visibility,
    resolution: envelope.resolution,
    projection: envelope.projection,
    warnings: envelope.warnings || [],
    errors: envelope.errors || [],
    resolvedAt: envelope.resolvedAt,
    tenantId: envelope.tenantId,
    organizationId: envelope.organizationId,
    clientId: envelope.clientId,
    tournamentId: envelope.tournamentId,
    competitionId: envelope.competitionId,
    sessionId: envelope.sessionId
  };
}

function createMonitorStructure(documentRef, root, instance, runtime) {
  const toolbar = documentRef.createElement("header");
  toolbar.className = "announcer-monitor-toolbar";
  const title = documentRef.createElement("div");
  title.className = "announcer-monitor-title";
  const eyebrow = documentRef.createElement("span");
  eyebrow.textContent = "CABINA DE LOCUCIÓN";
  const heading = documentRef.createElement("h1");
  heading.textContent = "Announcer Monitor";
  title.append(eyebrow, heading);
  const controls = createLocalControls(documentRef, instance, runtime);
  toolbar.append(title, controls);

  const context = createRegion(documentRef, "announcer-context-region", "CONTEXTO");
  const video = createRegion(documentRef, "announcer-video-region", "VIDEO LOCAL");
  video.section.setAttribute("id", instance.videoRegionId);
  video.section.setAttribute("data-video-connected", "false");
  video.section.setAttribute("data-video-muted", "true");
  video.section.setAttribute("data-video-source-type", "none");
  video.section.setAttribute("aria-label", "Región reservada para video local");
  const current = createRegion(documentRef, "announcer-current-region", "ACTUAL");
  const timer = createRegion(documentRef, "announcer-timer-region", "CRONÓMETRO OFICIAL");
  const next = createRegion(documentRef, "announcer-next-region", "SIGUIENTE");
  const standings = createRegion(documentRef, "announcer-standings-region", "CLASIFICACIÓN");
  const notes = createRegion(documentRef, "announcer-notes-region", "MENSAJES DE PRODUCCIÓN");
  const sponsor = createRegion(documentRef, "announcer-sponsor-region", "PATROCINADOR");
  const alerts = createRegion(documentRef, "announcer-alerts-region", "ALERTAS");
  alerts.content.setAttribute("aria-live", "polite");
  const status = createRegion(documentRef, "announcer-status-region", "ESTADO");
  status.section.setAttribute("aria-live", "polite");

  const dataGrid = documentRef.createElement("div");
  dataGrid.className = "announcer-data-grid";
  dataGrid.append(current.section, timer.section, next.section, standings.section);
  const dashboard = documentRef.createElement("div");
  dashboard.className = "announcer-dashboard";
  dashboard.append(video.section, dataGrid);
  const bottom = documentRef.createElement("div");
  bottom.className = "announcer-bottom-grid";
  bottom.append(alerts.section, notes.section, sponsor.section);
  root.append(toolbar, context.section, dashboard, bottom, status.section);
  return { toolbar, context, video, current, timer, next, standings, notes, sponsor, alerts, status };
}

function createLocalControls(documentRef, instance, runtime) {
  const controls = documentRef.createElement("nav");
  controls.className = "announcer-local-controls";
  controls.setAttribute("aria-label", "Controles locales de presentación");
  const modeLabel = documentRef.createElement("label");
  modeLabel.className = "announcer-control-field";
  const modeText = documentRef.createElement("span");
  modeText.textContent = "Vista";
  const select = documentRef.createElement("select");
  select.setAttribute("aria-label", "Modo visual");
  for (const mode of ANNOUNCER_MONITOR_DISPLAY_MODES) {
    const option = documentRef.createElement("option");
    option.setAttribute("value", mode);
    option.textContent = displayModeLabel(mode);
    if (mode === instance.displayMode) option.setAttribute("selected", "selected");
    select.appendChild(option);
  }
  registerListener(runtime, select, "change", () => setAnnouncerDisplayMode(instance, select.value));
  modeLabel.append(modeText, select);
  controls.appendChild(modeLabel);
  controls.appendChild(controlButton(documentRef, runtime, "A−", "Disminuir texto", () => setTextScale(instance, runtime, runtime.textScale - 0.1)));
  controls.appendChild(controlButton(documentRef, runtime, "A", "Restablecer texto", () => setTextScale(instance, runtime, 1)));
  controls.appendChild(controlButton(documentRef, runtime, "A+", "Aumentar texto", () => setTextScale(instance, runtime, runtime.textScale + 0.1)));
  controls.appendChild(controlButton(documentRef, runtime, "Pantalla completa", "Abrir pantalla completa", async () => {
    if (typeof runtime.root?.requestFullscreen === "function") {
      try { await runtime.root.requestFullscreen(); } catch { /* La salida continúa en modo normal. */ }
    }
  }));
  return controls;
}

function controlButton(documentRef, runtime, text, label, handler) {
  const button = documentRef.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("aria-label", label);
  button.textContent = text;
  registerListener(runtime, button, "click", handler);
  return button;
}

function createRegion(documentRef, className, title) {
  const section = documentRef.createElement("section");
  section.className = `announcer-region ${className}`;
  const heading = documentRef.createElement("h2");
  heading.textContent = title;
  const content = documentRef.createElement("div");
  content.className = "announcer-region-content";
  section.append(heading, content);
  return { section, heading, content };
}

function renderCurrentState(instance, runtime, suppliedModel = null) {
  if (!runtime.root || !runtime.regions) return;
  const model = suppliedModel || buildRenderModel(runtime.currentProjection, instance.status, instance.visibility);
  const { regions } = runtime;
  applyRootAttributes(instance, runtime);
  renderContext(regions.context.content, model.context);
  renderVideo(regions.video.content);
  renderCurrent(regions.current, model.current, model.context);
  renderTimer(regions.timer.content, model.timer);
  renderNext(regions.next.content, model.next);
  renderStandings(regions.standings.content, model.standings);
  renderNotes(regions.notes.content, model.notes);
  renderSponsor(regions.sponsor.content, model.sponsorMention);
  renderAlerts(regions.alerts.content, model.alerts);
  renderStatus(regions.status.content, instance.status, instance.errors);
}

function buildRenderModel(projection, status, visibility) {
  const safeProjection = sanitizeProjectionForVisibility(projection, visibility);
  const showData = new Set(["ready", "partial", "stale"]).has(status);
  return {
    current: showData ? safeProjection?.current || null : null,
    next: showData ? safeProjection?.next || null : null,
    timer: showData ? safeProjection?.timer || null : null,
    standings: showData ? safeProjection?.standings || [] : [],
    notes: showData ? safeProjection?.notes || [] : [],
    sponsorMention: showData ? safeProjection?.sponsorMention || null : null,
    alerts: showData ? safeProjection?.alerts || [] : [],
    context: showData ? safeProjection?.context || null : null
  };
}

function renderContext(container, context) {
  container.replaceChildren();
  const values = [
    ["Torneo", context?.tournamentName],
    ["Competencia", context?.competitionName],
    ["Charreada", context?.charreadaName],
    ["Suerte", context?.currentSuerteName],
    ["Sede", context?.venueName]
  ].filter(([, value]) => value !== null && value !== undefined);
  if (!values.length) return appendUnavailable(container);
  const list = container.ownerDocument.createElement("dl");
  list.className = "announcer-context-list";
  values.forEach(([label, value]) => appendDefinition(list, label, value));
  container.appendChild(list);
}

function renderVideo(container) {
  container.replaceChildren();
  const placeholder = container.ownerDocument.createElement("div");
  placeholder.className = "announcer-video-placeholder";
  const label = container.ownerDocument.createElement("strong");
  label.textContent = "VIDEO LOCAL";
  const message = container.ownerDocument.createElement("span");
  message.textContent = "Fuente NDI pendiente de conexión";
  const muted = container.ownerDocument.createElement("small");
  muted.textContent = "Audio desactivado";
  placeholder.append(label, message, muted);
  container.appendChild(placeholder);
}

function renderCurrent(region, current, context) {
  region.content.replaceChildren();
  region.heading.textContent = context?.competitionScope === "individual" || (!current?.teamName && current?.participantName)
    ? "PARTICIPANTE ACTUAL"
    : "ACTUAL";
  if (!current) return appendUnavailable(region.content);
  const list = region.content.ownerDocument.createElement("dl");
  list.className = "announcer-definition-list";
  appendDefinition(list, "Equipo", displayValue(current.teamName));
  appendDefinition(list, "Participante", displayValue(current.participantName));
  appendDefinition(list, "Caballo", displayValue(current.horseName));
  appendDefinition(list, "Suerte", displayValue(current.suerteName));
  appendDefinition(list, "Intento", displayValue(current.attempt));
  appendDefinition(list, "Puntuación", displayValue(current.score));
  appendDefinition(list, "Posición", displayValue(current.position));
  appendDefinition(list, "Líder", displayBoolean(current.leader));
  region.content.appendChild(list);
}

function renderTimer(container, timer) {
  container.replaceChildren();
  const wrapper = container.ownerDocument.createElement("div");
  wrapper.className = `announcer-timer announcer-timer-${timer?.status || "unavailable"}`;
  const time = container.ownerDocument.createElement("strong");
  time.className = "announcer-timer-value";
  time.textContent = displayValue(timer?.formattedTime);
  const state = container.ownerDocument.createElement("span");
  state.className = "announcer-timer-state";
  state.textContent = timerStatusLabel(timer?.status);
  wrapper.append(time, state);
  container.appendChild(wrapper);
}

function renderNext(container, next) {
  container.replaceChildren();
  if (!next || !hasNextData(next)) return appendUnavailable(container);
  const list = container.ownerDocument.createElement("dl");
  list.className = "announcer-definition-list";
  appendDefinition(list, "Equipo", displayValue(next.teamName));
  appendDefinition(list, "Participante", displayValue(next.participantName));
  appendDefinition(list, "Caballo", displayValue(next.horseName));
  appendDefinition(list, "Suerte", displayValue(next.suerteName));
  appendDefinition(list, "Orden estimado", displayValue(next.estimatedOrder));
  container.appendChild(list);
}

function renderStandings(container, standings) {
  container.replaceChildren();
  if (!standings?.length) return appendUnavailable(container);
  const list = container.ownerDocument.createElement("ol");
  list.className = "announcer-standings-list";
  standings.forEach((entry) => {
    const item = container.ownerDocument.createElement("li");
    const position = container.ownerDocument.createElement("span");
    position.textContent = displayValue(entry.position);
    const name = container.ownerDocument.createElement("strong");
    name.textContent = displayValue(entry.teamName);
    const score = container.ownerDocument.createElement("span");
    score.textContent = displayValue(entry.score);
    item.append(position, name, score);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderNotes(container, notes) {
  container.replaceChildren();
  if (!notes?.length) return appendUnavailable(container);
  const list = container.ownerDocument.createElement("ul");
  list.className = "announcer-message-list";
  notes.forEach((note) => {
    const item = container.ownerDocument.createElement("li");
    item.textContent = note.text || "No disponible";
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderSponsor(container, sponsor) {
  container.replaceChildren();
  if (!sponsor) return appendUnavailable(container, "Sin mención pendiente");
  const name = container.ownerDocument.createElement("strong");
  name.textContent = displayValue(sponsor.sponsorName);
  const mention = container.ownerDocument.createElement("p");
  mention.textContent = displayValue(sponsor.mentionText);
  container.append(name, mention);
}

function renderAlerts(container, alerts) {
  container.replaceChildren();
  if (!alerts?.length) return appendUnavailable(container, "Sin alertas activas");
  const list = container.ownerDocument.createElement("ul");
  list.className = "announcer-alert-list";
  alerts.forEach((alert) => {
    const item = container.ownerDocument.createElement("li");
    item.className = `announcer-alert announcer-alert-${alert.level}`;
    const title = container.ownerDocument.createElement("strong");
    title.textContent = alert.title;
    const message = container.ownerDocument.createElement("span");
    message.textContent = alert.message;
    item.append(title, message);
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderStatus(container, status, errors) {
  container.replaceChildren();
  const message = container.ownerDocument.createElement("p");
  message.textContent = stateMessage(status);
  container.appendChild(message);
  if (status === "error" && errors?.length) {
    const code = container.ownerDocument.createElement("code");
    code.textContent = normalizeText(errors[0]) || ANNOUNCER_MONITOR_ERROR_CODES.RENDER_FAILED;
    container.appendChild(code);
  }
}

function appendDefinition(list, label, value) {
  const documentRef = list.ownerDocument;
  const wrapper = documentRef.createElement("div");
  const term = documentRef.createElement("dt");
  term.textContent = label;
  const detail = documentRef.createElement("dd");
  detail.textContent = displayValue(value);
  wrapper.append(term, detail);
  list.appendChild(wrapper);
}

function appendUnavailable(container, text = "No disponible") {
  const message = container.ownerDocument.createElement("p");
  message.className = "announcer-unavailable";
  message.textContent = text;
  container.appendChild(message);
}

function applyRootAttributes(instance, runtime) {
  if (!runtime.root) return;
  safeAttribute(runtime.root, "data-monitor-state", instance.status);
  safeAttribute(runtime.root, "data-display-mode", instance.displayMode);
  safeAttribute(runtime.root, "data-visibility", instance.visibility);
  safeAttribute(runtime.root, "data-video-region-status", instance.videoRegionStatus);
  safeAttribute(runtime.root, "data-video-connected", "false");
  safeAttribute(runtime.root, "data-video-muted", "true");
  safeAttribute(runtime.root, "data-debug", runtime.debug ? "true" : "false");
  if (runtime.root.style?.setProperty) runtime.root.style.setProperty("--announcer-text-scale", String(runtime.textScale));
}

function setTextScale(instance, runtime, next) {
  runtime.textScale = Math.min(1.5, Math.max(0.8, Math.round(next * 10) / 10));
  if (runtime.root?.style?.setProperty) runtime.root.style.setProperty("--announcer-text-scale", String(runtime.textScale));
  syncInstance(instance, { updatedAt: normalizeNow() });
}

function registerListener(runtime, target, type, handler) {
  if (typeof target?.addEventListener !== "function") return;
  target.addEventListener(type, handler);
  runtime.listeners.push({ target, type, handler });
}

function removeListeners(runtime) {
  runtime.listeners.forEach(({ target, type, handler }) => target?.removeEventListener?.(type, handler));
  runtime.listeners = [];
}

function summarizeCurrent(value) {
  if (!value) return null;
  return {
    teamId: value.teamId ?? null,
    teamName: value.teamName ?? null,
    participantId: value.participantId ?? null,
    participantName: value.participantName ?? null,
    horseName: value.horseName ?? null,
    suerteName: value.suerteName ?? null,
    score: value.score ?? null,
    position: value.position ?? null,
    status: value.status ?? null,
    turnRevision: value.turnRevision ?? null
  };
}

function summarizeNext(value) {
  if (!value) return null;
  return {
    teamId: value.teamId ?? null,
    teamName: value.teamName ?? null,
    participantId: value.participantId ?? null,
    participantName: value.participantName ?? null,
    horseName: value.horseName ?? null,
    suerteName: value.suerteName ?? null,
    estimatedOrder: value.estimatedOrder ?? null
  };
}

function summarizeTimer(value) {
  if (!value) return null;
  return {
    timerId: value.timerId ?? null,
    status: value.status ?? "unavailable",
    formattedTime: value.formattedTime ?? null,
    elapsedMs: value.elapsedMs ?? null,
    remainingMs: value.remainingMs ?? null,
    sourceRevision: value.sourceRevision ?? null,
    alertState: value.alertState ?? null
  };
}

function summarizeContext(value) {
  if (!value) return null;
  return {
    tournamentName: value.tournamentName ?? null,
    competitionName: value.competitionName ?? null,
    sessionName: value.sessionName ?? null,
    charreadaName: value.charreadaName ?? null,
    venueName: value.venueName ?? null,
    currentSuerteName: value.currentSuerteName ?? null,
    categoryName: value.categoryName ?? null,
    eventDate: value.eventDate ?? null,
    progress: value.progress ?? null,
    status: value.status ?? null
  };
}

function assertRevisionOrder(instance, runtime, envelope) {
  if (instance.routeRevision !== null && envelope.routeRevision < instance.routeRevision) {
    throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.REVISION_REGRESSION, { field: "routeRevision" });
  }
  if (instance.sourceRevision !== null && envelope.sourceRevision < instance.sourceRevision) {
    throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.REVISION_REGRESSION, { field: "sourceRevision" });
  }
  if (runtime.currentEnvelope && envelope.routeRevision === instance.routeRevision && envelope.sourceRevision !== instance.sourceRevision) {
    throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.REVISION_CONFLICT, { field: "sourceRevision" });
  }
}

function validateContextTransition(previous, next) {
  const errors = validateContextCompatibility(previous, next);
  if (errors.length) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.CONTEXT_CONFLICT, { errors });
}

function validateContextCompatibility(expected, actual) {
  const errors = [];
  for (const field of ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"]) {
    if (expected?.[field] && actual?.[field] && expected[field] !== actual[field]) errors.push(`announcer-monitor-${field}-conflict`);
  }
  return errors;
}

function readProjectionContext(envelope) {
  return mergeContext(readContext(envelope), readContext(envelope?.projection?.context || {}));
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

function normalizeMetadata(value) {
  if (!isRecord(value)) return {};
  return safeClone(value, { rejectUnsafe: true, visibility: "restricted" }).value || {};
}

function safeClone(value, options = {}, state = { depth: 0, ancestors: new WeakSet(), path: "root", errors: [], warnings: [] }) {
  if (state.depth > MAX_DEPTH) {
    state.errors.push(`${state.path}:depth-limit`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  if (value === null || value === undefined || typeof value === "boolean") {
    return { value, errors: state.errors, warnings: state.warnings };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) state.errors.push(`${state.path}:number-invalid`);
    return { value: Number.isFinite(value) ? value : null, errors: state.errors, warnings: state.warnings };
  }
  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH) state.errors.push(`${state.path}:text-limit`);
    const text = value.slice(0, MAX_TEXT_LENGTH);
    return { value: sanitizeVisibleText(text), errors: state.errors, warnings: state.warnings };
  }
  if (new Set(["function", "symbol", "bigint"]).has(typeof value)) {
    state.errors.push(`${state.path}:type-unsafe`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  if (state.ancestors.has(value)) {
    state.errors.push(`${state.path}:cycle`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) state.errors.push(`${state.path}:array-limit`);
    state.ancestors.add(value);
    const output = value.slice(0, MAX_ARRAY_ITEMS).map((item, index) => safeClone(item, options, {
      ...state,
      depth: state.depth + 1,
      path: `${state.path}[${index}]`
    }).value);
    state.ancestors.delete(value);
    return { value: output, errors: state.errors, warnings: state.warnings };
  }
  const prototype = Object.getPrototypeOf(value);
  if (!(prototype === Object.prototype || prototype === null)) {
    state.errors.push(`${state.path}:prototype-unsafe`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  let descriptors;
  try { descriptors = Object.getOwnPropertyDescriptors(value); } catch {
    state.errors.push(`${state.path}:descriptor-unsafe`);
    return { value: null, errors: state.errors, warnings: state.warnings };
  }
  const entries = Object.entries(descriptors);
  if (entries.length > MAX_OBJECT_KEYS) state.errors.push(`${state.path}:object-limit`);
  state.ancestors.add(value);
  const output = Object.create(null);
  for (const [key, descriptor] of entries.slice(0, MAX_OBJECT_KEYS)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (DANGEROUS_KEYS.has(key) || FORBIDDEN_KEYS.has(normalizedKey) || SECRET_KEYS.has(normalizedKey)
      || (options.visibility === "operational" && PRIVATE_CONTEXT_KEYS.has(normalizedKey))) {
      if (options.rejectUnsafe) state.errors.push(`${state.path}.${key}:key-unsafe`);
      continue;
    }
    if (typeof descriptor.get === "function" || typeof descriptor.set === "function") {
      state.errors.push(`${state.path}.${key}:accessor-unsafe`);
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

function sanitizeVisibleText(value) {
  const text = String(value ?? "").replace(CONTROL_CHARACTERS, "").slice(0, MAX_TEXT_LENGTH);
  if (UNSAFE_PROTOCOL.test(text)) return "[contenido bloqueado]";
  return text
    .replace(UNSAFE_LINK, "[enlace bloqueado]")
    .replaceAll("<", "‹")
    .replaceAll(">", "›");
}

function stableFingerprint(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => freezeDeep(child, seen));
  return Object.freeze(value);
}

function requireInstance(instance) {
  const runtime = INSTANCES.get(instance);
  if (!runtime) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.INVALID);
  if (runtime.destroyed) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.DESTROYED);
  return runtime;
}

function requireMounted(runtime) {
  if (!runtime.root || !runtime.regions) throw monitorError(ANNOUNCER_MONITOR_ERROR_CODES.NOT_MOUNTED);
}

function monitorError(code, details = {}) {
  return new BroadcastAnnouncerMonitorError(code, details);
}

function normalizeMonitorError(error, fallback) {
  if (error instanceof BroadcastAnnouncerMonitorError) return error;
  return monitorError(error?.code || fallback);
}

function syncInstance(instance, values) {
  Object.assign(instance, values);
}

function cloneDescriptor(instance) {
  return cloneAnnouncerSnapshot(instance);
}

function validMountTarget(value) {
  return Boolean(value && value.nodeType === 1 && value.ownerDocument && typeof value.ownerDocument.createElement === "function");
}

function findBrowserRoot(container, browserOutputId) {
  return container.querySelector?.(`[data-browser-output-id="${browserOutputId}"]`) || null;
}

function safeAttribute(element, name, value) {
  element.setAttribute(name, sanitizeVisibleText(String(value ?? "")).slice(0, 180));
}

function hasClass(element, className) {
  return String(element?.className || "").split(/\s+/).includes(className);
}

function normalizeId(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(text) ? text : null;
}

function normalizeNullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function normalizeText(value) {
  return typeof value === "string" ? sanitizeVisibleText(value.trim()) : "";
}

function nullableText(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? sanitizeVisibleText(value) : sanitizeVisibleText(String(value));
}

function preserveValue(value) {
  return value === undefined ? null : value;
}

function normalizeNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeIso(value) {
  return isIso(value) ? new Date(value).toISOString() : null;
}

function normalizeNullableIso(value) {
  return value === null || value === undefined || value === "" ? null : normalizeIso(value);
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function nonNegativeInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function finiteNonNegativeOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeResolution(value) {
  return { width: Number(value?.width), height: Number(value?.height) };
}

function validateResolution(value) {
  const width = Number(value?.width);
  const height = Number(value?.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0
    || width > MAX_RESOLUTION_EDGE || height > MAX_RESOLUTION_EDGE || width * height > MAX_RESOLUTION_PIXELS) {
    return ["announcer-monitor-resolution-invalid"];
  }
  return [];
}

function validateViewport(value) {
  return validateResolution(value).map(() => "announcer-monitor-viewport-invalid");
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function uniqueStrings(value) {
  return [...new Set((value || []).filter((item) => typeof item === "string" && item).map(sanitizeVisibleText))];
}

function validationResult(valid, errors, warnings) {
  return { valid, errors, warnings, announcerMonitorVersion: ANNOUNCER_MONITOR_VERSION };
}

function projectionValidation(valid, errors, warnings, code = null, visibility = null) {
  return { valid, errors, warnings, code, visibility, announcerMonitorVersion: ANNOUNCER_MONITOR_VERSION };
}

function displayValue(value) {
  return value === null || value === undefined ? "No disponible" : String(value);
}

function displayBoolean(value) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "No disponible";
}

function hasNextData(next) {
  return Boolean(next.teamName || next.participantName || next.horseName || next.suerteName || next.estimatedOrder !== null);
}

function timerStatusLabel(status) {
  const labels = {
    ready: "LISTO",
    running: "EN MARCHA",
    paused: "PAUSADO",
    stopped: "DETENIDO",
    finished: "FINALIZADO",
    completed: "COMPLETADO",
    stale: "DATOS PENDIENTES",
    offline: "SIN CONEXIÓN",
    unavailable: "NO DISPONIBLE"
  };
  return labels[status] || "NO DISPONIBLE";
}

function stateMessage(status) {
  const messages = {
    uninitialized: "Monitor sin configurar",
    ready: "Monitor listo",
    mounted: "Información no disponible",
    rendered: "Monitor actualizado",
    updated: "Monitor actualizado",
    partial: "Información parcial",
    stale: "Datos pendientes de actualización",
    disabled: "Monitor deshabilitado",
    unavailable: "Información no disponible",
    error: "No fue posible presentar el monitor",
    cleared: "Monitor limpio",
    destroyed: "Monitor cerrado"
  };
  return messages[status] || "Información no disponible";
}

function displayModeLabel(mode) {
  return {
    balanced: "Equilibrado",
    video_focus: "Prioridad video",
    data_focus: "Prioridad datos",
    compact: "Compacto",
    large_text: "Texto grande"
  }[mode] || mode;
}

async function initializeAnnouncerMonitorPage() {
  if (typeof document === "undefined") return null;
  const page = document.querySelector("[data-announcer-monitor-page]");
  const host = document.querySelector("#announcer-monitor-host");
  if (!page || !host) return null;
  const params = new URLSearchParams(globalThis.location?.search || "");
  const debug = params.get("debug") === "1";
  const instance = createAnnouncerMonitor({}, { debug });
  configureAnnouncerMonitor(instance, DEFAULT_CONFIG);
  mountAnnouncerMonitor(instance, host);
  if (debug) {
    const lab = createDebugLaboratory(document, instance);
    page.appendChild(lab);
    const fixture = params.get("fixture");
    if (fixture && DEBUG_FIXTURE_IDS.has(fixture)) {
      updateAnnouncerMonitor(instance, buildDebugEnvelope(fixture, 1));
    }
  }
  return instance;
}

const DEBUG_FIXTURE_IDS = new Set(["teams-3", "teams-4", "individual", "partial", "stale", "disabled", "unavailable", "restricted"]);

function createDebugLaboratory(documentRef, instance) {
  const panel = documentRef.createElement("aside");
  panel.className = "announcer-debug-panel";
  panel.setAttribute("aria-label", "Laboratorio local");
  const title = documentRef.createElement("strong");
  title.textContent = "LABORATORIO LOCAL — DATOS DE PRUEBA";
  const select = documentRef.createElement("select");
  select.setAttribute("aria-label", "Fixture de prueba");
  for (const id of DEBUG_FIXTURE_IDS) {
    const option = documentRef.createElement("option");
    option.setAttribute("value", id);
    option.textContent = id;
    select.appendChild(option);
  }
  let revision = 1;
  const apply = documentRef.createElement("button");
  apply.type = "button";
  apply.textContent = "Aplicar fixture";
  apply.addEventListener("click", () => {
    revision += 1;
    updateAnnouncerMonitor(instance, buildDebugEnvelope(select.value || "teams-3", revision));
  });
  const snapshot = documentRef.createElement("button");
  snapshot.type = "button";
  snapshot.textContent = "Snapshot";
  const output = documentRef.createElement("pre");
  snapshot.addEventListener("click", () => {
    output.textContent = JSON.stringify(getAnnouncerSnapshot(instance), null, 2);
  });
  const clear = documentRef.createElement("button");
  clear.type = "button";
  clear.textContent = "Limpiar";
  clear.addEventListener("click", () => clearAnnouncerMonitor(instance));
  const destroy = documentRef.createElement("button");
  destroy.type = "button";
  destroy.textContent = "Destruir";
  destroy.addEventListener("click", () => destroyAnnouncerMonitor(instance));
  panel.append(title, select, apply, snapshot, clear, destroy, output);
  return panel;
}

function buildDebugEnvelope(fixtureId, revision) {
  const individual = fixtureId === "individual";
  const partial = fixtureId === "partial";
  const restricted = fixtureId === "restricted";
  const count = fixtureId === "teams-4" ? 4 : 3;
  const standings = Array.from({ length: count }, (_, index) => ({
    position: index + 1,
    teamId: `team-${index + 1}`,
    teamName: ["Rancho El Laurel", "Charros de Jalisco", "Rancheros de Tijuana", "Rancho del Centro"][index],
    score: [303, 302, 301, 298][index]
  }));
  const status = fixtureId === "stale" ? "stale" : fixtureId === "disabled" ? "disabled" : "routed";
  const projectionStatus = fixtureId === "unavailable" ? "unavailable" : "ready";
  return {
    routeId: "route-announcer-monitor",
    routeType: "announcer_monitor",
    outputId: "announcer-monitor",
    sourceType: "announcer_projection",
    sourceRevision: revision,
    routeRevision: revision,
    status,
    visibility: restricted ? "restricted" : "operational",
    resolution: { width: 1920, height: 1080 },
    projection: {
      kind: "announcer-monitor",
      status: projectionStatus,
      current: partial ? { participantName: "Juan Pérez" } : {
        teamId: individual ? null : "team-tijuana",
        teamName: individual ? null : "Rancheros de Tijuana",
        participantId: "participant-current",
        participantName: individual ? "Juan Pérez" : "Carlos Rodríguez",
        horseName: "Lucero",
        suerteName: "Colas",
        attempt: 2,
        score: 36,
        position: 1,
        leader: true,
        turnRevision: revision
      },
      next: { teamName: individual ? null : "Rancho del Centro", participantName: individual ? "Pedro López" : "Miguel Torres", horseName: "Relámpago", suerteName: "Colas", estimatedOrder: 2 },
      standings: individual ? standings.slice(0, 3).map((entry, index) => ({ ...entry, teamName: ["Juan Pérez", "Pedro López", "Luis García"][index] })) : standings,
      timer: partial
        ? { timerId: "timer-official", status: "unavailable", formattedTime: null, elapsedMs: null, sourceRevision: revision }
        : { timerId: "timer-official", status: "running", formattedTime: "00:42.18", elapsedMs: 42180, sourceRevision: revision },
      notes: [{ messageId: "note-1", text: "Recordar mencionar al patrocinador", category: "sponsor", visibility: "operational" }],
      privateNotes: restricted ? [{ messageId: "note-private", text: "Nota restringida", visibility: "restricted" }] : undefined,
      sponsorMention: { sponsorId: "sponsor-1", sponsorName: "Patrocinador Principal", mentionText: "Esta transmisión es presentada por Patrocinador Principal" },
      alerts: [{ alertId: "alert-1", level: "warning", title: "Cambio de turno", message: "Confirmar participante siguiente", visibility: "operational" }],
      context: { tournamentId: "tournament-a", tournamentName: "Campeonato CharroPro", competitionId: "competition-a", competitionName: individual ? "Charro Completo" : "Competencia por equipos", competitionScope: individual ? "individual" : "team", charreadaName: "Final", venueName: "Lienzo Central", currentSuerteName: "Colas" },
      generatedAt: "2026-07-15T20:00:00.000Z"
    },
    warnings: [],
    errors: [],
    resolvedAt: "2026-07-15T20:00:00.000Z",
    tournamentId: "tournament-a",
    competitionId: "competition-a"
  };
}

if (typeof document !== "undefined") {
  initializeAnnouncerMonitorPage().catch(() => {
    const host = document.querySelector?.("#announcer-monitor-host");
    if (host) host.setAttribute("data-bootstrap-error", "announcer-monitor-render-failed");
  });
}
