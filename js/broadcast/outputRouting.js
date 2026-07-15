import {
  PROGRAM_ENGINE_VERSION,
  validateProgram
} from "./programEngine.js?v=20260715-program-engine-001-official-program-v1";

export const OUTPUT_ROUTING_VERSION = "1.0.0";

export const OUTPUT_ROUTE_TYPES = Object.freeze([
  "program_main",
  "announcer_monitor",
  "timer_display"
]);

export const OUTPUT_ROUTE_STATES = Object.freeze([
  "uninitialized",
  "ready",
  "configured",
  "resolving",
  "routed",
  "stale",
  "disabled",
  "cleared",
  "destroyed",
  "error"
]);

export const OUTPUT_ROUTE_VISIBILITIES = Object.freeze([
  "public",
  "production",
  "operational",
  "restricted"
]);

export const OUTPUT_ROUTE_ERROR_CODES = Object.freeze([
  "output-routing-destroyed",
  "output-routing-engine-invalid",
  "output-route-invalid",
  "output-route-not-found",
  "output-route-already-exists",
  "output-route-disabled",
  "output-route-revision-conflict",
  "output-route-type-incompatible",
  "output-route-source-incompatible",
  "output-route-output-incompatible",
  "output-route-visibility-incompatible",
  "output-route-tenant-conflict",
  "output-route-scope-conflict",
  "output-route-unsafe",
  "output-route-idempotency-conflict",
  "output-route-program-snapshot-invalid",
  "output-route-announcer-source-invalid",
  "output-route-timer-source-invalid"
]);

const ENGINES = new WeakMap();
const ROUTE_STATES = new Set(OUTPUT_ROUTE_STATES);
const ROUTE_TYPES = new Set(OUTPUT_ROUTE_TYPES);
const VISIBILITIES = new Set(OUTPUT_ROUTE_VISIBILITIES);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const SOURCE_TYPES = new Set(["program_snapshot", "announcer_projection", "timer_projection"]);
const TIMER_STATES = new Set(["ready", "running", "paused", "stopped", "finished", "unavailable", "stale", "offline"]);
const ORIENTATIONS = new Set(["landscape", "portrait", "panoramic"]);
const SCOPES = new Set(["global", "tenant", "organization", "client", "tournament", "competition", "session"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FORBIDDEN_KEYS = new Set([
  "cache", "caches", "connection", "connections", "dom", "element", "firebase", "firebaseref",
  "handler", "handlers", "hook", "hooks", "listener", "listeners", "node", "plugin", "plugins",
  "renderer", "runtime", "signedurl", "target"
]);
const SECRET_KEYS = new Set([
  "accesstoken", "apikey", "authorization", "cookie", "credential", "credentials", "password",
  "privatekey", "refreshtoken", "secret", "secrets", "token", "tokens"
]);
const ACTOR_KEYS = new Set([
  "actor", "createdby", "judge", "judgeid", "judgename", "operator", "operatorid", "operatorname",
  "updatedby", "userid"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "clientid", "organizationid", "sessionid", "tenantid"
]);
const PRIVATE_PARTICIPANT_KEYS = new Set([
  "address", "birthdate", "contact", "email", "emergencycontact", "medical", "phone", "taxid"
]);
const UNSAFE_URI = /^\s*(?:javascript|file|data\s*:\s*text\/html|vbscript)\s*:/i;
const UNSAFE_MARKUP = /<\s*\/?\s*(?:script|iframe|object|embed|style|link|img)\b|\bon(?:error|load|click)\s*=/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 20000;
const DEFAULT_STALE_AFTER_MS = 15000;
const NOT_AVAILABLE = "NO DISPONIBLE";

const ROUTE_DEFINITIONS = Object.freeze({
  program_main: Object.freeze({
    routeId: "route-program-main",
    outputId: "program-main",
    sourceType: "program_snapshot",
    name: "Program Main",
    visibility: "public",
    resolution: Object.freeze({ width: 1920, height: 1080, transparentBackground: true })
  }),
  announcer_monitor: Object.freeze({
    routeId: "route-announcer-monitor",
    outputId: "announcer-monitor",
    sourceType: "announcer_projection",
    name: "Announcer Monitor",
    visibility: "operational",
    resolution: Object.freeze({ width: 1920, height: 1080, transparentBackground: false })
  }),
  timer_display: Object.freeze({
    routeId: "route-timer-display",
    outputId: "timer-display",
    sourceType: "timer_projection",
    name: "Timer Display",
    visibility: "public",
    resolution: Object.freeze({ width: 1920, height: 1080, transparentBackground: false })
  })
});

const ROUTE_UPDATE_FIELDS = new Set([
  "name", "description", "visibility", "sourceId", "resolution", "orientation", "safeArea",
  "refreshMode", "permissions", "organizationId", "clientId", "tournamentId", "competitionId",
  "sessionId", "staleAfterMs", "expiresAt", "metadata"
]);

export class BroadcastOutputRoutingError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastOutputRoutingError";
    this.code = code;
    this.details = sanitizeValue(details, { rejectUnsafe: false }).value || {};
  }
}

export function createOutputRoutingEngine(options = {}) {
  const now = normalizeNow(options.now);
  const engine = {
    outputRoutingVersion: OUTPUT_ROUTING_VERSION,
    engineId: normalizeId(options.engineId) || `output_routing_${compactTimestamp(now)}`,
    state: "ready",
    revision: 0,
    createdAt: now,
    updatedAt: now
  };
  ENGINES.set(engine, {
    state: "ready",
    routes: new Map(),
    idempotency: new Map()
  });
  return engine;
}

export function destroyOutputRoutingEngine(engine, options = {}) {
  const runtime = requireEngine(engine, { allowDestroyed: true });
  if (!runtime) return engine;
  runtime.routes.clear();
  runtime.idempotency.clear();
  runtime.state = "destroyed";
  engine.state = "destroyed";
  engine.updatedAt = normalizeNow(options.now);
  ENGINES.delete(engine);
  return engine;
}

export function createOutputRoute(engine, input = {}, options = {}) {
  const runtime = requireEngine(engine);
  const intent = { operation: "create", input: intentClone(input), actor: actorIdentity(options.actor) };
  return withIdempotency(runtime, options.idempotencyKey, intent, () => {
    const route = normalizeRoute(input, options);
    if (runtime.routes.has(route.routeId)) throw routingError("output-route-already-exists", { routeId: route.routeId });
    assertValidRoute(route);
    runtime.routes.set(route.routeId, freezeDeep(cloneOutputRoutingResult(route)));
    updateEngineState(engine, runtime, "configured", options.now);
    return cloneOutputRoutingResult(route);
  });
}

export function updateOutputRoute(engine, routeId, patch = {}, options = {}) {
  const runtime = requireEngine(engine);
  const id = requiredId(routeId);
  const intent = { operation: "update", routeId: id, patch: intentClone(patch), expectedRevision: options.expectedRevision };
  return withIdempotency(runtime, options.idempotencyKey, intent, () => {
    const current = requireRoute(runtime, id);
    assertExpectedRevision(current, options.expectedRevision);
    if (!isRecord(patch)) throw routingError("output-route-invalid", { routeId: id });
    const keys = Object.keys(patch);
    const forbidden = keys.filter((key) => !ROUTE_UPDATE_FIELDS.has(key));
    if (forbidden.length) throw routingError("output-route-invalid", { routeId: id, fields: forbidden });
    const safePatch = sanitizeValue(patch, { rejectUnsafe: true });
    if (safePatch.errors.length) throw routingError("output-route-unsafe", { errors: safePatch.errors });
    const now = normalizeNow(options.now);
    const candidate = normalizeRoute({
      ...current,
      ...safePatch.value,
      routeId: current.routeId,
      routeType: current.routeType,
      outputId: current.outputId,
      sourceType: current.sourceType,
      tenantId: current.tenantId,
      createdAt: current.createdAt,
      createdBy: current.createdBy,
      revision: current.revision + 1,
      updatedAt: now,
      updatedBy: actorIdentity(options.actor) || current.updatedBy,
      projection: current.projection,
      sourceRevision: current.sourceRevision,
      lastResolvedAt: current.lastResolvedAt
    }, { ...options, now, preserveLifecycle: true });
    assertValidRoute(candidate);
    runtime.routes.set(id, freezeDeep(cloneOutputRoutingResult(candidate)));
    updateEngineState(engine, runtime, deriveEngineState(runtime), now);
    return cloneOutputRoutingResult(candidate);
  });
}

export function removeOutputRoute(engine, routeId, options = {}) {
  const runtime = requireEngine(engine);
  const id = requiredId(routeId);
  const intent = { operation: "remove", routeId: id, expectedRevision: options.expectedRevision };
  return withIdempotency(runtime, options.idempotencyKey, intent, () => {
    const current = requireRoute(runtime, id);
    assertExpectedRevision(current, options.expectedRevision);
    runtime.routes.delete(id);
    updateEngineState(engine, runtime, deriveEngineState(runtime), options.now);
    return cloneOutputRoutingResult(current);
  });
}

export function enableOutputRoute(engine, routeId, options = {}) {
  return setRouteEnabled(engine, routeId, true, options);
}

export function disableOutputRoute(engine, routeId, options = {}) {
  return setRouteEnabled(engine, routeId, false, options);
}

export function clearOutputRoute(engine, routeId, options = {}) {
  const runtime = requireEngine(engine);
  const id = requiredId(routeId);
  const intent = { operation: "clear", routeId: id, expectedRevision: options.expectedRevision };
  return withIdempotency(runtime, options.idempotencyKey, intent, () => {
    const current = requireRoute(runtime, id);
    assertExpectedRevision(current, options.expectedRevision);
    const now = normalizeNow(options.now);
    const candidate = {
      ...cloneOutputRoutingResult(current),
      status: current.enabled ? "cleared" : "disabled",
      projection: null,
      sourceRevision: null,
      lastResolvedAt: null,
      revision: current.revision + 1,
      updatedAt: now,
      updatedBy: actorIdentity(options.actor) || current.updatedBy,
      warnings: [],
      errors: []
    };
    assertValidRoute(candidate);
    runtime.routes.set(id, freezeDeep(candidate));
    updateEngineState(engine, runtime, deriveEngineState(runtime), now);
    return cloneOutputRoutingResult(candidate);
  });
}

export function resolveOutputRoute(engine, routeId, sources = {}, context = {}, options = {}) {
  const runtime = requireEngine(engine);
  const id = requiredId(routeId);
  const safeSourcesInput = sanitizeValue(sources, { rejectUnsafe: false, sanitizeText: true });
  const safeContextInput = sanitizeValue(context, { rejectUnsafe: false, sanitizeText: true });
  const sourceIntent = summarizeSourceIntent(safeSourcesInput.value || {});
  const intent = {
    operation: "resolve",
    routeId: id,
    source: sourceIntent,
    sourcePayload: safeSourcesInput.value || {},
    context: safeContextInput.value || {}
  };
  return withIdempotency(runtime, options.idempotencyKey, intent, () => {
    const current = requireRoute(runtime, id);
    if (!current.enabled || current.status === "disabled") throw routingError("output-route-disabled", { routeId: id });
    assertValidRoute(current);
    const source = selectRouteSource(current, safeSourcesInput.value || {});
    const routeContext = safeContextInput.value || {};
    const scope = resolveSourceScope(source, routeContext);
    assertScopeCompatibility(current, scope);
    const sourceVisibility = resolveSourceVisibility(current, source, options);
    const requestedVisibility = normalizeVisibility(options.visibility || current.visibility);
    const visibility = mostRestrictiveVisibility(current.visibility, sourceVisibility, requestedVisibility);
    assertRouteVisibility(current.routeType, visibility);
    const now = normalizeNow(options.now);
    const projectionResult = buildProjection(current, source, routeContext, { ...options, visibility, now });
    const sourceRevision = projectionResult.sourceRevision;
    const staleWarnings = detectStale(current, source, routeContext, sourceRevision, { ...options, now });
    const stale = staleWarnings.length > 0 || projectionResult.status === "stale";
    const routeRevision = current.revision + 1;
    const result = sanitizeRoutingResult({
      routeId: current.routeId,
      routeType: current.routeType,
      outputId: current.outputId,
      sourceType: current.sourceType,
      sourceRevision,
      routeRevision,
      status: projectionResult.status === "controlled-empty"
        ? "controlled-empty"
        : stale ? "stale" : "routed",
      visibility,
      resolution: current.resolution,
      projection: projectionResult.projection,
      warnings: uniqueStrings([...(projectionResult.warnings || []), ...staleWarnings]),
      errors: uniqueStrings(projectionResult.errors || []),
      resolvedAt: now
    }, visibility);
    const candidate = {
      ...cloneOutputRoutingResult(current),
      status: stale ? "stale" : "routed",
      sourceRevision,
      lastResolvedAt: now,
      projection: cloneOutputRoutingResult(result.projection),
      revision: routeRevision,
      updatedAt: now,
      warnings: cloneOutputRoutingResult(result.warnings),
      errors: cloneOutputRoutingResult(result.errors)
    };
    assertValidRoute(candidate);
    runtime.routes.set(id, freezeDeep(candidate));
    updateEngineState(engine, runtime, stale ? "stale" : "routed", now);
    return cloneOutputRoutingResult(result);
  });
}

export function routeProgramToOutput(engine, routeId, programSnapshot, options = {}) {
  return resolveOutputRoute(engine, routeId, { programSnapshot }, options.context || {}, options);
}

export function routeAnnouncerMonitor(engine, routeId, announcerSources, options = {}) {
  return resolveOutputRoute(engine, routeId, { announcerSources }, options.context || {}, options);
}

export function routeTimerDisplay(engine, routeId, officialTimerState, options = {}) {
  return resolveOutputRoute(engine, routeId, { officialTimerState }, options.context || {}, options);
}

export function getOutputRoute(engine, routeId, options = {}) {
  const runtime = requireEngine(engine);
  const route = runtime.routes.get(normalizeId(routeId));
  if (!route) return null;
  return routeWithConsultedStale(route, options);
}

export function listOutputRoutes(engine, filter = {}, options = {}) {
  const runtime = requireEngine(engine);
  const safeFilter = isRecord(filter) ? filter : {};
  return [...runtime.routes.values()]
    .filter((route) => matchesRouteFilter(route, safeFilter))
    .sort((left, right) => left.routeId.localeCompare(right.routeId))
    .map((route) => routeWithConsultedStale(route, options));
}

export function getOutputRoutingStatus(engine, options = {}) {
  const runtime = requireEngine(engine);
  const routes = listOutputRoutes(engine, {}, options);
  const state = routes.some((route) => route.status === "stale")
    ? "stale"
    : deriveEngineState(runtime);
  return {
    engineId: engine.engineId,
    state,
    revision: engine.revision,
    routes: routes.length,
    enabled: routes.filter((route) => route.enabled).length,
    routed: routes.filter((route) => route.status === "routed").length,
    stale: routes.filter((route) => route.status === "stale").length,
    updatedAt: engine.updatedAt
  };
}

export function getOutputRoutingWarnings(engine, options = {}) {
  const routes = listOutputRoutes(engine, {}, options);
  const warnings = routes.flatMap((route) => route.warnings || []);
  if (!routes.length) warnings.push("output-routing-no-routes");
  if (routes.some((route) => !route.enabled)) warnings.push("output-routing-route-disabled");
  return uniqueStrings(warnings);
}

export function getOutputRoutingErrors(engine) {
  return uniqueStrings(listOutputRoutes(engine).flatMap((route) => route.errors || []));
}

export function buildOutputRoutingSnapshot(engine, options = {}) {
  const runtime = requireEngine(engine);
  const visibility = normalizeVisibility(options.visibility || "production");
  const routes = listOutputRoutes(engine, {}, options).map((route) => sanitizeRouteDefinition(route, visibility));
  const summaries = routes.map((route) => ({
    routeId: route.routeId,
    routeType: route.routeType,
    outputId: route.outputId,
    status: route.status,
    enabled: route.enabled,
    visibility: route.visibility,
    resolution: cloneOutputRoutingResult(route.resolution),
    sourceRevision: route.sourceRevision,
    routeRevision: route.revision,
    stale: route.status === "stale",
    lastResolvedAt: route.lastResolvedAt,
    warnings: cloneOutputRoutingResult(route.warnings),
    errors: cloneOutputRoutingResult(route.errors)
  }));
  const snapshot = sanitizeRoutingResult({
    snapshotVersion: OUTPUT_ROUTING_VERSION,
    outputRoutingVersion: OUTPUT_ROUTING_VERSION,
    engineId: engine.engineId,
    status: getOutputRoutingStatus(engine, options).state,
    routes,
    routeSummaries: summaries,
    sourceRevisions: Object.fromEntries(summaries.map((route) => [route.routeId, route.sourceRevision])),
    routeRevisions: Object.fromEntries(summaries.map((route) => [route.routeId, route.routeRevision])),
    enabled: Object.fromEntries(summaries.map((route) => [route.routeId, route.enabled])),
    warnings: getOutputRoutingWarnings(engine, options),
    errors: getOutputRoutingErrors(engine),
    generatedAt: normalizeNow(options.now)
  }, visibility);
  const validation = validateOutputRoutingSnapshot(snapshot);
  if (!validation.valid) throw routingError("output-routing-snapshot-invalid", { errors: validation.errors });
  return cloneOutputRoutingResult(snapshot);
}

export function validateOutputRoute(route) {
  const errors = [];
  const warnings = [];
  if (!isRecord(route)) return validation(["output-route-invalid"], warnings);
  if (route.outputRoutingVersion !== OUTPUT_ROUTING_VERSION) errors.push("output-route-version-invalid");
  if (!normalizeId(route.routeId)) errors.push("output-route-id-invalid");
  if (!ROUTE_TYPES.has(route.routeType)) errors.push("output-route-type-invalid");
  if (!normalizeId(route.outputId)) errors.push("output-route-output-invalid");
  if (!ROUTE_STATES.has(route.status)) errors.push("output-route-status-invalid");
  if (typeof route.enabled !== "boolean") errors.push("output-route-enabled-invalid");
  if (!VISIBILITIES.has(route.visibility)) errors.push("output-route-visibility-invalid");
  if (!SOURCE_TYPES.has(route.sourceType)) errors.push("output-route-source-invalid");
  if (!SCOPES.has(route.scope)) errors.push("output-route-scope-invalid");
  if (!Number.isInteger(route.revision) || route.revision < 0) errors.push("output-route-revision-invalid");
  if (!isIso(route.createdAt) || !isIso(route.updatedAt)) errors.push("output-route-timestamp-invalid");
  if (route.lastResolvedAt !== null && !isIso(route.lastResolvedAt)) errors.push("output-route-resolved-at-invalid");
  if (route.expiresAt !== null && !isIso(route.expiresAt)) errors.push("output-route-expiry-invalid");
  validateResolution(route.resolution, errors);
  validateSafeArea(route.safeArea, errors);
  if (!ORIENTATIONS.has(route.orientation)) errors.push("output-route-orientation-invalid");
  if (route.refreshMode !== "manual") errors.push("output-route-refresh-mode-invalid");
  if (!isRecord(route.permissions) || route.permissions.readOnly !== true) errors.push("output-route-permissions-invalid");
  if (route.projection !== null) {
    const projectionClone = sanitizeValue(route.projection, { rejectUnsafe: false });
    errors.push(...projectionClone.errors.filter((error) => error.includes("dangerous") || error.includes("runtime")));
  }
  const definition = ROUTE_DEFINITIONS[route.routeType];
  if (definition) {
    if (route.outputId !== definition.outputId) errors.push("output-route-output-incompatible");
    if (route.sourceType !== definition.sourceType) errors.push("output-route-source-incompatible");
    try {
      assertRouteVisibility(route.routeType, route.visibility);
    } catch (error) {
      errors.push(error.code || "output-route-visibility-incompatible");
    }
  }
  if (route.status === "stale") warnings.push("output-route-stale");
  if (!route.enabled) warnings.push("output-route-disabled");
  return validation(uniqueStrings(errors), uniqueStrings(warnings));
}

export function validateOutputRoutingSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  if (!isRecord(snapshot)) return snapshotValidation(["output-routing-snapshot-invalid"], warnings);
  if (snapshot.snapshotVersion !== OUTPUT_ROUTING_VERSION || snapshot.outputRoutingVersion !== OUTPUT_ROUTING_VERSION) {
    errors.push("output-routing-snapshot-version-invalid");
  }
  if (!normalizeId(snapshot.engineId)) errors.push("output-routing-snapshot-engine-invalid");
  if (!ROUTE_STATES.has(snapshot.status)) errors.push("output-routing-snapshot-status-invalid");
  if (!Array.isArray(snapshot.routes) || !Array.isArray(snapshot.routeSummaries)) errors.push("output-routing-snapshot-routes-invalid");
  if (!isIso(snapshot.generatedAt)) errors.push("output-routing-snapshot-time-invalid");
  const safety = sanitizeValue(snapshot, { rejectUnsafe: false });
  errors.push(...safety.errors.filter((error) => /dangerous|runtime|non-serializable/.test(error)));
  return snapshotValidation(uniqueStrings(errors), uniqueStrings(warnings));
}

export function cloneOutputRoutingResult(value) {
  return sanitizeValue(value, { rejectUnsafe: false }).value;
}

function setRouteEnabled(engine, routeId, enabled, options) {
  const runtime = requireEngine(engine);
  const id = requiredId(routeId);
  const operation = enabled ? "enable" : "disable";
  const intent = { operation, routeId: id, expectedRevision: options.expectedRevision };
  return withIdempotency(runtime, options.idempotencyKey, intent, () => {
    const current = requireRoute(runtime, id);
    assertExpectedRevision(current, options.expectedRevision);
    if (current.enabled === enabled) return cloneOutputRoutingResult(current);
    const now = normalizeNow(options.now);
    const candidate = {
      ...cloneOutputRoutingResult(current),
      enabled,
      status: enabled ? (current.projection ? "routed" : "configured") : "disabled",
      revision: current.revision + 1,
      updatedAt: now,
      updatedBy: actorIdentity(options.actor) || current.updatedBy
    };
    assertValidRoute(candidate);
    runtime.routes.set(id, freezeDeep(candidate));
    updateEngineState(engine, runtime, deriveEngineState(runtime), now);
    return cloneOutputRoutingResult(candidate);
  });
}

function normalizeRoute(input, options = {}) {
  if (!isRecord(input)) throw routingError("output-route-invalid");
  const cloned = sanitizeValue(input, { rejectUnsafe: true });
  if (cloned.errors.length) throw routingError("output-route-unsafe", { errors: cloned.errors });
  const raw = cloned.value || {};
  const routeType = normalizeId(raw.routeType || options.routeType);
  const definition = ROUTE_DEFINITIONS[routeType];
  if (!definition) throw routingError("output-route-type-incompatible", { routeType });
  const now = normalizeNow(options.now || raw.updatedAt || raw.createdAt);
  const createdAt = isIso(raw.createdAt) ? raw.createdAt : now;
  const resolution = normalizeResolution(raw.resolution || definition.resolution);
  const enabled = hasOwn(raw, "enabled") ? raw.enabled === true : true;
  const status = options.preserveLifecycle && ROUTE_STATES.has(raw.status)
    ? raw.status
    : enabled ? "configured" : "disabled";
  const identity = {
    tenantId: nullableId(raw.tenantId),
    organizationId: nullableId(raw.organizationId),
    clientId: nullableId(raw.clientId),
    tournamentId: nullableId(raw.tournamentId),
    competitionId: nullableId(raw.competitionId),
    sessionId: nullableId(raw.sessionId)
  };
  return {
    outputRoutingVersion: OUTPUT_ROUTING_VERSION,
    routeId: normalizeId(raw.routeId) || definition.routeId,
    routeType,
    outputId: normalizeId(raw.outputId) || definition.outputId,
    name: normalizeText(raw.name, definition.name),
    description: nullableText(raw.description),
    status,
    enabled,
    visibility: normalizeVisibility(raw.visibility || definition.visibility),
    sourceType: normalizeId(raw.sourceType) || definition.sourceType,
    sourceId: nullableId(raw.sourceId),
    resolution,
    orientation: normalizeOrientation(raw.orientation, resolution),
    safeArea: normalizeSafeArea(raw.safeArea),
    refreshMode: raw.refreshMode === "manual" ? "manual" : "manual",
    permissions: normalizePermissions(raw.permissions),
    scope: normalizeScope(raw.scope, identity),
    ...identity,
    revision: nonNegativeInteger(raw.revision, 0),
    sourceRevision: nullableRevision(raw.sourceRevision),
    lastResolvedAt: normalizeNullableIso(raw.lastResolvedAt),
    staleAfterMs: positiveInteger(raw.staleAfterMs, DEFAULT_STALE_AFTER_MS),
    expiresAt: normalizeNullableIso(raw.expiresAt),
    projection: raw.projection === null || raw.projection === undefined
      ? null
      : sanitizeRoutingResult(raw.projection, raw.visibility || definition.visibility),
    createdAt,
    updatedAt: isIso(raw.updatedAt) ? raw.updatedAt : createdAt,
    createdBy: actorIdentity(raw.createdBy || options.actor),
    updatedBy: actorIdentity(raw.updatedBy || options.actor),
    warnings: uniqueStrings(raw.warnings || []),
    errors: uniqueStrings(raw.errors || []),
    metadata: sanitizeMetadata(raw.metadata)
  };
}

function buildProjection(route, source, context, options) {
  if (route.routeType === "program_main") return buildProgramProjection(source, options);
  if (route.routeType === "announcer_monitor") return buildAnnouncerProjection(source, options);
  if (route.routeType === "timer_display") return buildTimerProjection(source, options);
  throw routingError("output-route-type-incompatible", { routeType: route.routeType });
}

function buildProgramProjection(snapshot, options) {
  if (!isRecord(snapshot) || snapshot.snapshotVersion !== PROGRAM_ENGINE_VERSION || !isIso(snapshot.generatedAt)) {
    throw routingError("output-route-program-snapshot-invalid");
  }
  if (snapshot.program === null) {
    return {
      sourceRevision: nonNegativeInteger(snapshot.revision, 0),
      status: "controlled-empty",
      projection: {
        kind: "program-main",
        state: "controlled-empty",
        program: null,
        generatedAt: options.now
      },
      warnings: ["output-route-program-empty"],
      errors: []
    };
  }
  const programValidation = validateProgram(snapshot.program);
  if (!programValidation.valid) {
    throw routingError("output-route-program-snapshot-invalid", { errors: programValidation.errors });
  }
  const program = sanitizeRoutingResult(snapshot.program, options.visibility);
  return {
    sourceRevision: nonNegativeInteger(snapshot.program.revision, nonNegativeInteger(snapshot.revision, 0)),
    status: snapshot.state === "stale" ? "stale" : "routed",
    projection: {
      kind: "program-main",
      state: "program",
      programId: program.programId,
      revision: program.revision,
      visibility: options.visibility,
      previewId: program.previewId,
      themeRenderId: program.themeRenderId,
      templateRenderId: program.templateRenderId,
      templateId: program.templateId,
      themeId: program.themeId,
      templateInstanceId: program.templateInstanceId,
      transitionMode: program.transitionMode,
      output: program.output,
      components: program.components || null,
      composition: program.composition || null,
      warnings: uniqueStrings(program.warnings || []),
      errors: uniqueStrings(program.errors || []),
      generatedAt: options.now
    },
    warnings: uniqueStrings([...(snapshot.warnings || []), ...(program.warnings || [])]),
    errors: uniqueStrings([...(snapshot.errors || []), ...(program.errors || [])])
  };
}

function buildAnnouncerProjection(sources, options) {
  if (!isRecord(sources)) throw routingError("output-route-announcer-source-invalid");
  const contract = isRecord(sources.contract) ? sources.contract : sources;
  const current = {
    tournament: compactEntity(readFirst(contract, ["tournament"]), ["id", "name", "status", "venue"]),
    competition: compactEntity(readFirst(contract, ["competition"]), ["id", "type", "name", "scope", "category", "phase", "round", "status"]),
    charreada: compactEntity(readFirst(contract, ["charreada"]), ["id", "name", "status", "date", "startTime", "phase", "category"]),
    suerte: compactEntity(readFirst(contract, ["suerte"]), ["id", "name", "status", "attempt", "maxAttempts"]),
    team: compactEntity(readFirst(contract, ["team", "current.team"]), ["id", "name", "shortName", "category", "association", "total", "position"]),
    participant: compactEntity(readFirst(contract, ["participant", "current.participant"]), ["id", "name", "alias", "category", "association", "number", "order", "total", "position"]),
    horse: compactEntity(readFirst(contract, ["horse", "current.horse"]), ["id", "name", "category"]),
    score: compactEntity(readFirst(contract, ["score", "current.score"]), ["id", "total", "time", "status", "published", "timestamp"]),
    position: valueOrUnavailable(readFirst(contract, ["ranking.currentPosition", "team.position", "participant.position"]))
  };
  const next = sanitizeRoutingResult(readFirst(sources, ["next", "queue.next", "contract.next"]) || {
    team: NOT_AVAILABLE,
    participant: NOT_AVAILABLE
  }, options.visibility);
  const standings = sanitizeRoutingResult(readFirst(sources, ["standings", "ranking.entries", "contract.ranking.entries"]) || [], options.visibility);
  const timer = sanitizeRoutingResult(readFirst(sources, ["timer", "contract.timer"]) || { status: "unavailable", display: NOT_AVAILABLE }, options.visibility);
  const privateNotes = readFirst(sources, ["privateNotes", "notes.private"]);
  const notes = sanitizeRoutingResult(readFirst(sources, ["notes", "messages", "production.messages"]) || [], options.visibility);
  const sponsorMention = sanitizeRoutingResult(readFirst(sources, ["sponsorMention", "sponsor.active", "contract.sponsor.active"]) || null, options.visibility);
  const alerts = sanitizeRoutingResult(readFirst(sources, ["alerts", "warnings", "production.alerts"]) || [], options.visibility);
  const projection = {
    kind: "announcer-monitor",
    current,
    next,
    standings,
    timer,
    notes,
    sponsorMention,
    alerts,
    context: compactEntity(readFirst(sources, ["context"]) || {}, ["tournamentId", "competitionId", "charreadaId", "suerteId"]),
    generatedAt: options.now
  };
  if (options.visibility === "restricted" && privateNotes !== undefined) {
    projection.privateNotes = sanitizeRoutingResult(privateNotes, "restricted");
  }
  return {
    sourceRevision: resolveRevision(sources, contract),
    status: sources.stale === true ? "stale" : "routed",
    projection,
    warnings: uniqueStrings([
      ...(Array.isArray(sources.warnings) ? sources.warnings : []),
      ...(!standings.length ? ["output-route-announcer-ranking-unavailable"] : [])
    ]),
    errors: []
  };
}

function buildTimerProjection(timer, options) {
  if (!isRecord(timer)) throw routingError("output-route-timer-source-invalid");
  const status = TIMER_STATES.has(timer.status) ? timer.status : null;
  if (!status) throw routingError("output-route-timer-source-invalid", { field: "status" });
  const timerId = normalizeId(timer.timerId || timer.id);
  if (!timerId) throw routingError("output-route-timer-source-invalid", { field: "timerId" });
  const sourceRevision = nonNegativeInteger(timer.sourceRevision ?? timer.revision, null);
  if (sourceRevision === null) throw routingError("output-route-timer-source-invalid", { field: "sourceRevision" });
  const generatedAt = normalizeNullableIso(timer.generatedAt);
  if (!generatedAt) throw routingError("output-route-timer-source-invalid", { field: "generatedAt" });
  const projection = {
    kind: "timer-display",
    timerId,
    status,
    formattedTime: nullableText(timer.formattedTime ?? timer.display) ?? NOT_AVAILABLE,
    elapsedMs: finiteNonNegativeOrNull(timer.elapsedMs ?? timer.elapsed),
    remainingMs: finiteNonNegativeOrNull(timer.remainingMs ?? timer.remaining),
    startedAt: normalizeNullableIso(timer.startedAt),
    pausedAt: normalizeNullableIso(timer.pausedAt),
    stoppedAt: normalizeNullableIso(timer.stoppedAt),
    sourceRevision,
    contextRef: sanitizeTimerContext(timer.contextRef),
    generatedAt,
    alertState: nullableText(timer.alertState),
    suerte: compactEntity(timer.suerte, ["id", "name"]),
    team: compactEntity(timer.team, ["id", "name"]),
    participant: compactEntity(timer.participant, ["id", "name"]),
    attempt: timer.attempt ?? null
  };
  return {
    sourceRevision,
    status: new Set(["stale", "offline"]).has(status) ? "stale" : "routed",
    projection: sanitizeRoutingResult(projection, options.visibility),
    warnings: new Set(["stale", "offline", "unavailable"]).has(status) ? [`output-route-timer-${status}`] : [],
    errors: []
  };
}

function selectRouteSource(route, sources) {
  if (route.routeType === "program_main") return sources?.programSnapshot ?? sources;
  if (route.routeType === "announcer_monitor") return sources?.announcerSources ?? sources;
  if (route.routeType === "timer_display") return sources?.officialTimerState ?? sources;
  throw routingError("output-route-type-incompatible");
}

function resolveSourceScope(source, context) {
  const contract = isRecord(source?.contract) ? source.contract : source;
  const contextRef = isRecord(source?.contextRef) ? source.contextRef : {};
  return {
    visibility: normalizeVisibility(source?.visibility || contract?.visibility || context?.visibility || "production"),
    tenantId: nullableId(context?.tenantId || source?.tenantId || contract?.tenantId || contract?.organization?.tenantId),
    organizationId: nullableId(context?.organizationId || source?.organizationId || contract?.organizationId || contract?.organization?.id),
    clientId: nullableId(context?.clientId || source?.clientId || contract?.clientId || contract?.organization?.clientId),
    tournamentId: nullableId(context?.tournamentId || source?.tournamentId || contextRef.tournamentId || contract?.tournament?.id),
    competitionId: nullableId(context?.competitionId || source?.competitionId || contextRef.competitionId || contract?.competition?.id),
    sessionId: nullableId(context?.sessionId || source?.sessionId)
  };
}

function assertScopeCompatibility(route, scope) {
  const fields = ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"];
  for (const field of fields) {
    if (route[field] && scope[field] && route[field] !== scope[field]) {
      const code = field === "tenantId" ? "output-route-tenant-conflict" : "output-route-scope-conflict";
      throw routingError(code, { field, route: route[field], source: scope[field] });
    }
  }
  if (route.scope === "global" && scope.visibility !== "public") {
    throw routingError("output-route-scope-conflict", { reason: "global-private-source" });
  }
}

function resolveSourceVisibility(route, source, options) {
  const sourceVisibility = normalizeVisibility(
    options.sourceVisibility
      || source?.visibility
      || source?.program?.visibility
      || source?.contract?.visibility
      || route.visibility
  );
  return sourceVisibility;
}

function assertRouteVisibility(routeType, visibility) {
  const allowed = routeType === "program_main"
    ? new Set(["public", "production"])
    : routeType === "announcer_monitor"
      ? new Set(["operational", "restricted"])
      : new Set(["public", "production", "operational"]);
  if (!allowed.has(visibility)) throw routingError("output-route-visibility-incompatible", { routeType, visibility });
}

function detectStale(route, source, context, sourceRevision, options) {
  const warnings = [];
  const nowMs = Date.parse(options.now);
  const generatedAt = source?.generatedAt || source?.source?.generatedAt || source?.program?.updatedAt;
  if (route.expiresAt && nowMs >= Date.parse(route.expiresAt)) warnings.push("output-route-expired");
  if (generatedAt && isIso(generatedAt) && nowMs - Date.parse(generatedAt) > route.staleAfterMs) {
    warnings.push("output-route-source-stale");
  }
  if (Number.isInteger(options.currentSourceRevision) && sourceRevision < options.currentSourceRevision) {
    warnings.push("output-route-source-revision-behind");
  }
  if (route.sourceRevision !== null && route.sourceRevision === sourceRevision && route.lastResolvedAt
    && nowMs - Date.parse(route.lastResolvedAt) > route.staleAfterMs) {
    warnings.push("output-route-source-not-advanced");
  }
  for (const field of ["tournamentId", "competitionId"]) {
    if (route[field] && context?.[field] && route[field] !== context[field]) warnings.push(`output-route-${field}-changed`);
  }
  return uniqueStrings(warnings);
}

function routeWithConsultedStale(route, options) {
  const result = cloneOutputRoutingResult(route);
  if (!result.enabled || result.status === "disabled" || result.status === "cleared" || !result.projection) {
    return result;
  }
  const now = normalizeNow(options.now);
  const nowMs = Date.parse(now);
  if (result.expiresAt && nowMs >= Date.parse(result.expiresAt)) {
    result.status = "stale";
    result.warnings = uniqueStrings([...(result.warnings || []), "output-route-expired"]);
  }
  if (result.lastResolvedAt && result.staleAfterMs && nowMs - Date.parse(result.lastResolvedAt) > result.staleAfterMs) {
    result.status = "stale";
    result.warnings = uniqueStrings([...(result.warnings || []), "output-route-last-result-stale"]);
  }
  if (Number.isInteger(options.currentSourceRevision) && result.sourceRevision !== null
    && result.sourceRevision < options.currentSourceRevision) {
    result.status = "stale";
    result.warnings = uniqueStrings([...(result.warnings || []), "output-route-source-revision-behind"]);
  }
  return result;
}

function sanitizeRouteDefinition(route, visibility) {
  const definition = cloneOutputRoutingResult(route);
  delete definition.projection;
  if (visibility === "public") {
    PUBLIC_PRIVATE_KEYS.forEach((key) => { delete definition[key]; });
    delete definition.createdBy;
    delete definition.updatedBy;
  }
  return sanitizeRoutingResult(definition, visibility);
}

function sanitizeRoutingResult(value, visibility = "production") {
  const normalizedVisibility = normalizeVisibility(visibility);
  return sanitizeValue(value, {
    rejectUnsafe: false,
    sanitizeText: true,
    keyFilter: (key) => {
      const normalized = key.toLowerCase();
      if (FORBIDDEN_KEYS.has(normalized) || SECRET_KEYS.has(normalized)) return false;
      if (normalizedVisibility === "public" && (ACTOR_KEYS.has(normalized) || PUBLIC_PRIVATE_KEYS.has(normalized))) return false;
      if (PRIVATE_PARTICIPANT_KEYS.has(normalized)) return false;
      return true;
    }
  }).value;
}

function sanitizeValue(value, options = {}, state = { depth: 0, ancestors: new WeakSet(), path: "root", errors: [] }) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      state.errors.push(`output-routing-non-finite:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    if (typeof value === "string") {
      if (value.length > MAX_TEXT_LENGTH) {
        state.errors.push(`output-routing-text-limit:${state.path}`);
        return { value: undefined, errors: state.errors };
      }
      const unsafeUri = UNSAFE_URI.test(value);
      const unsafeMarkup = UNSAFE_MARKUP.test(value);
      if (unsafeUri || unsafeMarkup) {
        if (options.rejectUnsafe) {
          state.errors.push(`output-routing-unsafe-text:${state.path}`);
          return { value: undefined, errors: state.errors };
        }
        if (options.sanitizeText) {
          return { value: unsafeUri ? "[blocked]" : escapeText(value), errors: state.errors };
        }
      }
    }
    return { value, errors: state.errors };
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    state.errors.push(`output-routing-non-serializable:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (state.depth >= MAX_DEPTH) {
    state.errors.push(`output-routing-depth-limit:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (value instanceof WeakMap || value instanceof WeakSet || value?.nodeType || value?.ownerDocument) {
    state.errors.push(`output-routing-runtime-reference:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (state.ancestors.has(value)) {
    state.errors.push(`output-routing-cycle:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  state.ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) state.errors.push(`output-routing-array-limit:${state.path}`);
    const result = [];
    value.slice(0, MAX_ARRAY_ITEMS).forEach((entry, index) => {
      const child = sanitizeValue(entry, options, {
        ...state,
        depth: state.depth + 1,
        path: `${state.path}.${index}`
      });
      if (child.value !== undefined) result.push(child.value);
    });
    state.ancestors.delete(value);
    return { value: result, errors: state.errors };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors);
  if (keys.length > MAX_OBJECT_KEYS) state.errors.push(`output-routing-object-limit:${state.path}`);
  const result = {};
  keys.slice(0, MAX_OBJECT_KEYS).forEach((key) => {
    const descriptor = descriptors[key];
    const normalized = key.toLowerCase();
    if (DANGEROUS_KEYS.has(key)) {
      state.errors.push(`output-routing-dangerous-key:${state.path}.${key}`);
      return;
    }
    if (descriptor.get || descriptor.set) {
      state.errors.push(`output-routing-accessor:${state.path}.${key}`);
      return;
    }
    if (FORBIDDEN_KEYS.has(normalized) || SECRET_KEYS.has(normalized)) {
      state.errors.push(`output-routing-forbidden-key:${state.path}.${key}`);
      return;
    }
    if (options.keyFilter && options.keyFilter(key, state.path) === false) return;
    const child = sanitizeValue(descriptor.value, options, {
      ...state,
      depth: state.depth + 1,
      path: `${state.path}.${key}`
    });
    if (child.value !== undefined) result[key] = child.value;
  });
  state.ancestors.delete(value);
  return { value: result, errors: state.errors };
}

function withIdempotency(runtime, key, intent, operation) {
  const idempotencyKey = nullableId(key);
  if (!idempotencyKey) return operation();
  const fingerprint = stableSerialize(intent);
  const stored = runtime.idempotency.get(idempotencyKey);
  if (stored) {
    if (stored.fingerprint !== fingerprint) {
      throw routingError("output-route-idempotency-conflict", { idempotencyKey });
    }
    return cloneOutputRoutingResult(stored.result);
  }
  const result = operation();
  runtime.idempotency.set(idempotencyKey, freezeDeep({ fingerprint, result: cloneOutputRoutingResult(result) }));
  return cloneOutputRoutingResult(result);
}

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
}

function summarizeSourceIntent(sources) {
  const source = sources?.programSnapshot || sources?.announcerSources || sources?.officialTimerState || sources;
  return {
    sourceRevision: resolveRevision(source, source?.contract),
    generatedAt: source?.generatedAt || source?.source?.generatedAt || null,
    programId: source?.program?.programId || null,
    timerId: source?.timerId || source?.id || null,
    status: source?.status || source?.state || null
  };
}

function intentClone(value) {
  return sanitizeValue(value, { rejectUnsafe: false }).value;
}

function actorIdentity(value) {
  if (!isRecord(value)) return null;
  const id = nullableId(value.id || value.userId);
  const name = nullableText(value.name);
  const role = nullableId(value.role);
  if (!id && !name && !role) return null;
  return { id, name, role };
}

function sanitizeMetadata(value) {
  if (!isRecord(value)) return {};
  const cloned = sanitizeValue(value, { rejectUnsafe: false, sanitizeText: true });
  return cloned.value || {};
}

function normalizePermissions(value) {
  const source = isRecord(value) ? value : {};
  return {
    readOnly: true,
    canResolve: source.canResolve !== false,
    canConfigure: source.canConfigure === true,
    canControlProgram: false,
    canControlPreview: false,
    canControlTimer: false
  };
}

function normalizeScope(value, identity) {
  if (SCOPES.has(value)) return value;
  if (identity.sessionId) return "session";
  if (identity.competitionId) return "competition";
  if (identity.tournamentId) return "tournament";
  if (identity.clientId) return "client";
  if (identity.organizationId) return "organization";
  if (identity.tenantId) return "tenant";
  return "global";
}

function normalizeResolution(value) {
  const source = isRecord(value) ? value : {};
  const width = positiveInteger(source.width, 1920);
  const height = positiveInteger(source.height, 1080);
  return {
    width,
    height,
    transparentBackground: source.transparentBackground === true
  };
}

function normalizeOrientation(value, resolution) {
  if (ORIENTATIONS.has(value)) return value;
  if (resolution.width > resolution.height * 2) return "panoramic";
  if (resolution.height > resolution.width) return "portrait";
  return "landscape";
}

function normalizeSafeArea(value) {
  const source = isRecord(value) ? value : {};
  return {
    top: finiteNonNegative(source.top, 0),
    right: finiteNonNegative(source.right, 0),
    bottom: finiteNonNegative(source.bottom, 0),
    left: finiteNonNegative(source.left, 0)
  };
}

function validateResolution(value, errors) {
  if (!isRecord(value) || !Number.isInteger(value.width) || value.width <= 0
    || !Number.isInteger(value.height) || value.height <= 0
    || typeof value.transparentBackground !== "boolean") {
    errors.push("output-route-resolution-invalid");
  }
}

function validateSafeArea(value, errors) {
  if (!isRecord(value) || ["top", "right", "bottom", "left"].some((key) => !Number.isFinite(value[key]) || value[key] < 0)) {
    errors.push("output-route-safe-area-invalid");
  }
}

function sanitizeTimerContext(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries([
    "tournamentId", "competitionId", "charreadaId", "teamId", "participantId", "suerteId"
  ].map((key) => [key, nullableId(source[key])]).filter(([, entry]) => entry !== null));
}

function compactEntity(value, fields) {
  if (value === null || value === undefined) return NOT_AVAILABLE;
  if (!isRecord(value)) return sanitizeRoutingResult(value, "operational");
  const result = {};
  fields.forEach((field) => {
    if (hasOwn(value, field)) result[field] = value[field];
  });
  return Object.keys(result).length ? sanitizeRoutingResult(result, "operational") : NOT_AVAILABLE;
}

function readFirst(source, paths) {
  for (const path of paths) {
    let current = source;
    let exists = true;
    for (const segment of path.split(".")) {
      if (!isRecord(current) || !hasOwn(current, segment)) {
        exists = false;
        break;
      }
      current = current[segment];
    }
    if (exists && current !== undefined && current !== null) return current;
  }
  return undefined;
}

function valueOrUnavailable(value) {
  return value === undefined || value === null ? NOT_AVAILABLE : value;
}

function resolveRevision(source, fallback) {
  return nonNegativeInteger(
    source?.sourceRevision
      ?? source?.revision
      ?? source?.contract?.revision
      ?? source?.program?.revision
      ?? source?.timer?.revision
      ?? fallback?.revision,
    0
  );
}

function matchesRouteFilter(route, filter) {
  return ["routeId", "routeType", "outputId", "status", "visibility", "sourceType", "scope", "tenantId", "tournamentId", "competitionId"]
    .every((field) => !hasOwn(filter, field) || route[field] === filter[field])
    && (!hasOwn(filter, "enabled") || route.enabled === filter.enabled);
}

function updateEngineState(engine, runtime, state, now) {
  if (!ROUTE_STATES.has(state)) throw routingError("output-route-state-invalid", { state });
  runtime.state = state;
  engine.state = state;
  engine.revision += 1;
  engine.updatedAt = normalizeNow(now);
}

function deriveEngineState(runtime) {
  const routes = [...runtime.routes.values()];
  if (!routes.length) return "ready";
  if (routes.some((route) => route.status === "stale")) return "stale";
  if (routes.some((route) => route.status === "routed")) return "routed";
  if (routes.every((route) => route.status === "disabled")) return "disabled";
  if (routes.every((route) => route.status === "cleared")) return "cleared";
  return "configured";
}

function requireEngine(engine, options = {}) {
  const runtime = ENGINES.get(engine);
  if (!runtime) {
    if (options.allowDestroyed && engine?.state === "destroyed") return null;
    if (engine?.state === "destroyed") throw routingError("output-routing-destroyed");
    throw routingError("output-routing-engine-invalid");
  }
  return runtime;
}

function requireRoute(runtime, routeId) {
  const route = runtime.routes.get(routeId);
  if (!route) throw routingError("output-route-not-found", { routeId });
  return route;
}

function assertExpectedRevision(route, expectedRevision) {
  if (expectedRevision === undefined || expectedRevision === null) return;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== route.revision) {
    throw routingError("output-route-revision-conflict", {
      routeId: route.routeId,
      expectedRevision,
      actualRevision: route.revision
    });
  }
}

function assertValidRoute(route) {
  const result = validateOutputRoute(route);
  if (!result.valid) throw routingError("output-route-invalid", { errors: result.errors });
}

function validation(errors, warnings) {
  return { valid: errors.length === 0, errors, warnings, outputRoutingVersion: OUTPUT_ROUTING_VERSION };
}

function snapshotValidation(errors, warnings) {
  return { valid: errors.length === 0, errors, warnings, snapshotVersion: OUTPUT_ROUTING_VERSION };
}

function routingError(code, details) {
  return new BroadcastOutputRoutingError(code, details);
}

function requiredId(value) {
  const id = normalizeId(value);
  if (!id) throw routingError("output-route-invalid", { routeId: value });
  return id;
}

function normalizeId(value) {
  return typeof value === "string" && SAFE_ID.test(value.trim()) ? value.trim() : null;
}

function nullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function normalizeText(value, fallback) {
  const text = nullableText(value);
  return text === null ? fallback : text;
}

function nullableText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  return value.length <= MAX_TEXT_LENGTH ? value : value.slice(0, MAX_TEXT_LENGTH);
}

function normalizeVisibility(value) {
  return VISIBILITIES.has(value) ? value : "production";
}

function mostRestrictiveVisibility(...values) {
  return values.map(normalizeVisibility).sort((left, right) => VISIBILITY_RANK[right] - VISIBILITY_RANK[left])[0];
}

function normalizeNow(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeNullableIso(value) {
  return isIso(value) ? new Date(value).toISOString() : null;
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function compactTimestamp(value) {
  return normalizeNow(value).replace(/[-:.TZ]/g, "");
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function nullableRevision(value) {
  return value === null || value === undefined ? null : nonNegativeInteger(value, null);
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function finiteNonNegative(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function finiteNonNegativeOrNull(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value))];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => freezeDeep(child, seen));
  return Object.freeze(value);
}
