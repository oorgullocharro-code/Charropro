import {
  getOutputRoute,
  routeAnnouncerMonitor,
  routeProgramToOutput
} from "./outputRouting.js?v=20260715-browser-output-001-common-web-output-infrastructure-v1";
import { getProgramSnapshot } from "./programEngine.js?v=20260715-program-engine-001-official-program-v1";
import {
  applyProgramMainProjection,
  buildProgramMainOutputSnapshot,
  clearProgramMainOutput,
  getProgramMainOutputStatus,
  validateProgramMainProjection
} from "./programMainOutput.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import {
  clearAnnouncerMonitor,
  getAnnouncerSnapshot,
  getAnnouncerStatus,
  updateAnnouncerMonitor,
  validateAnnouncerProjection
} from "./announcerMonitor.js?v=20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1";

export const OUTPUT_SYNCHRONIZATION_VERSION = "1.0.0";

export const OUTPUT_SYNCHRONIZATION_STATES = Object.freeze([
  "uninitialized", "ready", "configured", "synchronizing", "synchronized", "partial",
  "stale", "stopped", "cleared", "destroyed", "error"
]);

export const OUTPUT_SYNCHRONIZATION_TARGETS = Object.freeze([
  "program_main",
  "announcer_monitor"
]);

export const OUTPUT_SYNCHRONIZATION_ERROR_CODES = Object.freeze({
  INVALID: "output-synchronization-invalid",
  INVALID_CONFIG: "output-synchronization-config-invalid",
  INVALID_SOURCES: "output-synchronization-sources-invalid",
  NOT_CONFIGURED: "output-synchronization-not-configured",
  NOT_STARTED: "output-synchronization-not-started",
  TARGET_INVALID: "output-synchronization-target-invalid",
  TARGET_UNAVAILABLE: "output-synchronization-target-unavailable",
  ROUTE_INVALID: "output-synchronization-route-invalid",
  PROJECTION_INVALID: "output-synchronization-projection-invalid",
  REVISION_CONFLICT: "output-synchronization-revision-conflict",
  IDEMPOTENCY_CONFLICT: "output-synchronization-idempotency-conflict",
  CONTEXT_CONFLICT: "output-synchronization-context-conflict",
  UNSAFE_PAYLOAD: "output-synchronization-unsafe-payload",
  SNAPSHOT_INVALID: "output-synchronization-snapshot-invalid",
  DESTROYED: "output-synchronization-destroyed"
});

const SNAPSHOT_VERSION = "1.0.0";
const SYNCHRONIZERS = new WeakMap();
const TARGET_SET = new Set(OUTPUT_SYNCHRONIZATION_TARGETS);
const ACTIVE_STATES = new Set(["ready", "synchronized", "partial", "stale", "cleared"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const PRIVATE_KEYS = /^(?:actor|auth|cookie|credential|headers?|password|privatekey|secret|signedurl|token)$/i;
const UNSAFE_PROTOCOL = /^\s*(?:javascript|file|data\s*:\s*text\/html|vbscript)\s*:/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_DEPTH = 18;
const MAX_ARRAY_ITEMS = 600;
const MAX_OBJECT_KEYS = 800;
const MAX_TEXT_LENGTH = 20000;
const DEFAULT_STALE_AFTER_MS = 15000;

const TARGET_DEFINITIONS = Object.freeze({
  program_main: Object.freeze({
    routeId: "route-program-main",
    routeType: "program_main",
    outputId: "program-main",
    sourceType: "program_snapshot"
  }),
  announcer_monitor: Object.freeze({
    routeId: "route-announcer-monitor",
    routeType: "announcer_monitor",
    outputId: "announcer-monitor",
    sourceType: "announcer_projection"
  })
});

export class BroadcastOutputSynchronizationError extends Error {
  constructor(code, details = {}) {
    const diagnostics = Array.isArray(details?.errors)
      ? details.errors.filter((entry) => typeof entry === "string").slice(0, 12)
      : [];
    super(diagnostics.length ? `${code}: ${diagnostics.join(", ")}` : code);
    this.name = "BroadcastOutputSynchronizationError";
    this.code = code;
    this.details = safeClone(details, { rejectUnsafe: false }).value || {};
  }
}

export function createOutputSynchronization(definition = {}, options = {}) {
  const safe = safeClone(definition, { rejectUnsafe: true });
  if (safe.errors.length) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID, { errors: safe.errors });
  const now = normalizeNow(options.now);
  const synchronizationId = normalizeId(safe.value?.synchronizationId)
    || `output_sync_${compactTimestamp(now)}`;
  const synchronization = {
    outputSynchronizationVersion: OUTPUT_SYNCHRONIZATION_VERSION,
    synchronizationId,
    status: "uninitialized",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    lastSynchronizedAt: null,
    warnings: [],
    errors: []
  };
  SYNCHRONIZERS.set(synchronization, {
    config: null,
    targets: createTargetState(),
    idempotency: new Map(),
    destroyed: false
  });
  return synchronization;
}

export function configureOutputSynchronization(synchronization, config = {}, options = {}) {
  const runtime = requireSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  const normalized = normalizeConfig(config);
  runtime.config = freezeDeep(cloneOutputSynchronizationResult(normalized));
  const now = normalizeNow(options.now);
  updateSynchronization(synchronization, {
    status: "configured",
    revision: synchronization.revision + 1,
    updatedAt: now,
    warnings: [],
    errors: []
  });
  return getOutputSynchronization(synchronization, { now });
}

export function startOutputSynchronization(synchronization, options = {}) {
  const runtime = requireSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  if (!runtime.config) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.NOT_CONFIGURED);
  const now = normalizeNow(options.now);
  updateSynchronization(synchronization, {
    status: "ready",
    revision: synchronization.revision + 1,
    updatedAt: now,
    warnings: [],
    errors: []
  });
  return getOutputSynchronization(synchronization, { now });
}

export function stopOutputSynchronization(synchronization, options = {}) {
  const runtime = requireSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  const now = normalizeNow(options.now);
  return withIdempotency(runtime, options.idempotencyKey, {
    operation: "stop",
    revision: synchronization.revision
  }, () => {
    updateSynchronization(synchronization, {
      status: "stopped",
      revision: synchronization.revision + 1,
      updatedAt: now
    });
    return getOutputSynchronization(synchronization, { now });
  });
}

export function synchronizeProgramMain(synchronization, sources = {}, options = {}) {
  const runtime = requireActiveSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  const prepared = prepareProgramSources(sources, options);
  assertConfiguredContext(runtime.config, prepared.context);
  return withIdempotency(runtime, options.idempotencyKey, {
    operation: "synchronize-program-main",
    sourceRevision: prepared.programSnapshot?.program?.revision ?? prepared.programSnapshot?.revision ?? null,
    targetId: prepared.programMainOutput?.programMainOutputId || null,
    context: prepared.context
  }, () => synchronizeSingleTarget(synchronization, runtime, "program_main", prepared, options));
}

export function synchronizeAnnouncerMonitor(synchronization, sources = {}, options = {}) {
  const runtime = requireActiveSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  const prepared = prepareAnnouncerSources(sources);
  assertConfiguredContext(runtime.config, prepared.context);
  return withIdempotency(runtime, options.idempotencyKey, {
    operation: "synchronize-announcer-monitor",
    sourceRevision: resolveAnnouncerSourceRevision(prepared.announcerSources),
    targetId: prepared.announcerMonitor?.announcerMonitorId || null,
    context: prepared.context,
    source: prepared.announcerSources
  }, () => synchronizeSingleTarget(synchronization, runtime, "announcer_monitor", prepared, options));
}

export function synchronizeAllOutputs(synchronization, sources = {}, options = {}) {
  const runtime = requireActiveSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  if (!isRecord(sources)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES);
  const program = prepareProgramSources(sources.programMain || sources, options);
  const announcer = prepareAnnouncerSources(sources.announcerMonitor || sources);
  assertConfiguredContext(runtime.config, program.context);
  assertConfiguredContext(runtime.config, announcer.context);
  return withIdempotency(runtime, options.idempotencyKey, {
    operation: "synchronize-all",
    programRevision: program.programSnapshot?.program?.revision ?? program.programSnapshot?.revision ?? null,
    announcerRevision: resolveAnnouncerSourceRevision(announcer.announcerSources),
    programTargetId: program.programMainOutput?.programMainOutputId || null,
    announcerTargetId: announcer.announcerMonitor?.announcerMonitorId || null
  }, () => {
    const now = normalizeNow(options.now);
    updateSynchronization(synchronization, { status: "synchronizing", updatedAt: now });
    const outcomes = [];
    for (const [target, prepared] of [["program_main", program], ["announcer_monitor", announcer]]) {
      try {
        outcomes.push({ target, result: performSynchronization(target, prepared, options) });
      } catch (error) {
        outcomes.push({ target, error: normalizeSynchronizationError(error) });
      }
    }
    outcomes.forEach((outcome) => {
      runtime.targets[outcome.target] = outcome.error
        ? failedTargetState(runtime.targets[outcome.target], outcome.error, now)
        : synchronizedTargetState(runtime.targets[outcome.target], outcome.result, now);
    });
    const failures = outcomes.filter((outcome) => outcome.error);
    const successes = outcomes.filter((outcome) => outcome.result);
    const status = failures.length && successes.length ? "partial" : failures.length ? "error" : "synchronized";
    updateSynchronization(synchronization, {
      status,
      revision: synchronization.revision + 1,
      updatedAt: now,
      lastSynchronizedAt: successes.length ? now : synchronization.lastSynchronizedAt,
      warnings: failures.length ? uniqueStrings(failures.map((item) => `${item.target}-synchronization-failed`)) : [],
      errors: uniqueStrings(failures.map((item) => item.error.code))
    });
    return getOutputSynchronization(synchronization, { now });
  });
}

export function clearSynchronizedOutput(synchronization, target, sources = {}, options = {}) {
  const runtime = requireActiveSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  const targetId = normalizeTarget(target);
  const targetInstance = targetId === "program_main" ? sources.programMainOutput : sources.announcerMonitor;
  assertTargetInstance(targetId, targetInstance);
  return withIdempotency(runtime, options.idempotencyKey, {
    operation: "clear",
    target: targetId,
    targetId: targetId === "program_main" ? targetInstance.programMainOutputId : targetInstance.announcerMonitorId
  }, () => {
    const now = normalizeNow(options.now);
    if (targetId === "program_main") clearProgramMainOutput(targetInstance, { now });
    else clearAnnouncerMonitor(targetInstance, { now });
    runtime.targets[targetId] = {
      ...emptyTarget(targetId),
      status: "cleared",
      outputRevision: targetId === "program_main"
        ? buildProgramMainOutputSnapshot(targetInstance, { now }).projectionRevision
        : getAnnouncerSnapshot(targetInstance, { now }).projectionRevision,
      lastSynchronizedAt: now
    };
    updateSynchronization(synchronization, {
      status: deriveSynchronizationStatus(runtime.targets),
      revision: synchronization.revision + 1,
      updatedAt: now,
      warnings: [],
      errors: []
    });
    return getOutputSynchronization(synchronization, { now });
  });
}

export function markSynchronizedOutputStale(synchronization, target, options = {}) {
  const runtime = requireActiveSynchronization(synchronization);
  assertExpectedRevision(synchronization, options.expectedRevision);
  const targetId = normalizeTarget(target);
  const now = normalizeNow(options.now);
  runtime.targets[targetId] = {
    ...runtime.targets[targetId],
    status: "stale",
    stale: true,
    warnings: uniqueStrings([...(runtime.targets[targetId].warnings || []), options.reason || "output-synchronization-stale"])
  };
  updateSynchronization(synchronization, {
    status: "stale",
    revision: synchronization.revision + 1,
    updatedAt: now,
    warnings: uniqueStrings([...(synchronization.warnings || []), `${targetId}-stale`])
  });
  return getOutputSynchronization(synchronization, { now });
}

export function getOutputSynchronization(synchronization, options = {}) {
  const runtime = requireSynchronization(synchronization);
  const now = normalizeNow(options.now);
  const targets = consultedTargets(runtime.targets, runtime.config, now);
  const stale = Object.values(targets).some((target) => target.stale);
  return cloneOutputSynchronizationResult({
    outputSynchronizationVersion: OUTPUT_SYNCHRONIZATION_VERSION,
    synchronizationId: synchronization.synchronizationId,
    status: stale && synchronization.status === "synchronized" ? "stale" : synchronization.status,
    revision: synchronization.revision,
    targets,
    stale,
    createdAt: synchronization.createdAt,
    updatedAt: synchronization.updatedAt,
    lastSynchronizedAt: synchronization.lastSynchronizedAt,
    warnings: synchronization.warnings,
    errors: synchronization.errors
  });
}

export function getOutputSynchronizationStatus(synchronization, options = {}) {
  const current = getOutputSynchronization(synchronization, options);
  return {
    synchronizationId: current.synchronizationId,
    status: current.status,
    revision: current.revision,
    stale: current.stale,
    targets: Object.fromEntries(Object.entries(current.targets).map(([key, value]) => [key, value.status])),
    lastSynchronizedAt: current.lastSynchronizedAt
  };
}

export function getOutputSynchronizationWarnings(synchronization, options = {}) {
  const current = getOutputSynchronization(synchronization, options);
  return uniqueStrings([
    ...(current.warnings || []),
    ...Object.values(current.targets).flatMap((target) => target.warnings || [])
  ]);
}

export function getOutputSynchronizationErrors(synchronization, options = {}) {
  const current = getOutputSynchronization(synchronization, options);
  return uniqueStrings([
    ...(current.errors || []),
    ...Object.values(current.targets).flatMap((target) => target.errors || [])
  ]);
}

export function buildOutputSynchronizationSnapshot(synchronization, options = {}) {
  const current = getOutputSynchronization(synchronization, options);
  const snapshot = {
    snapshotVersion: SNAPSHOT_VERSION,
    outputSynchronizationVersion: OUTPUT_SYNCHRONIZATION_VERSION,
    synchronizationId: current.synchronizationId,
    status: current.status,
    revision: current.revision,
    targets: Object.fromEntries(Object.entries(current.targets).map(([key, target]) => [key, {
      target: key,
      status: target.status,
      sourceRevision: target.sourceRevision,
      routeRevision: target.routeRevision,
      outputRevision: target.outputRevision,
      stale: target.stale,
      lastSynchronizedAt: target.lastSynchronizedAt,
      warnings: target.warnings,
      errors: target.errors
    }])),
    programMain: targetSummary(current.targets.program_main),
    announcer: targetSummary(current.targets.announcer_monitor),
    stale: current.stale,
    lastSynchronizedAt: current.lastSynchronizedAt,
    warnings: current.warnings,
    errors: current.errors,
    generatedAt: normalizeNow(options.now)
  };
  const validation = validateOutputSynchronizationSnapshot(snapshot);
  if (!validation.valid) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.SNAPSHOT_INVALID, { errors: validation.errors });
  return cloneOutputSynchronizationResult(snapshot);
}

export function validateOutputSynchronizationSnapshot(snapshot) {
  const safe = safeClone(snapshot, { rejectUnsafe: true });
  const errors = [...safe.errors];
  const value = safe.value;
  if (!isRecord(value)) errors.push("output-synchronization-snapshot-invalid");
  if (value?.snapshotVersion !== SNAPSHOT_VERSION) errors.push("output-synchronization-snapshot-version-invalid");
  if (value?.outputSynchronizationVersion !== OUTPUT_SYNCHRONIZATION_VERSION) errors.push("output-synchronization-version-invalid");
  if (!normalizeId(value?.synchronizationId)) errors.push("output-synchronization-snapshot-id-invalid");
  if (!OUTPUT_SYNCHRONIZATION_STATES.includes(value?.status)) errors.push("output-synchronization-snapshot-state-invalid");
  if (!nonNegativeInteger(value?.revision)) errors.push("output-synchronization-snapshot-revision-invalid");
  if (!isRecord(value?.targets) || !OUTPUT_SYNCHRONIZATION_TARGETS.every((target) => isRecord(value.targets[target]))) {
    errors.push("output-synchronization-snapshot-targets-invalid");
  }
  if (!isIso(value?.generatedAt)) errors.push("output-synchronization-snapshot-timestamp-invalid");
  if (!validStringArray(value?.warnings) || !validStringArray(value?.errors)) errors.push("output-synchronization-snapshot-diagnostics-invalid");
  return { valid: uniqueStrings(errors).length === 0, errors: uniqueStrings(errors), warnings: [], outputSynchronizationVersion: OUTPUT_SYNCHRONIZATION_VERSION };
}

export function cloneOutputSynchronizationResult(value) {
  const safe = safeClone(value, { rejectUnsafe: false });
  if (safe.errors.length) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.UNSAFE_PAYLOAD, { errors: safe.errors });
  return safe.value;
}

export function destroyOutputSynchronization(synchronization, options = {}) {
  const runtime = requireSynchronization(synchronization, { allowDestroyed: true });
  if (runtime.destroyed) return synchronization;
  assertExpectedRevision(synchronization, options.expectedRevision);
  runtime.config = null;
  runtime.targets = createTargetState();
  runtime.idempotency.clear();
  runtime.destroyed = true;
  updateSynchronization(synchronization, {
    status: "destroyed",
    revision: synchronization.revision + 1,
    updatedAt: normalizeNow(options.now),
    warnings: [],
    errors: []
  });
  return synchronization;
}

function synchronizeSingleTarget(synchronization, runtime, target, prepared, options) {
  const now = normalizeNow(options.now);
  updateSynchronization(synchronization, { status: "synchronizing", updatedAt: now });
  try {
    const result = performSynchronization(target, prepared, options);
    runtime.targets[target] = synchronizedTargetState(runtime.targets[target], result, now);
    updateSynchronization(synchronization, {
      status: deriveSynchronizationStatus(runtime.targets),
      revision: synchronization.revision + 1,
      updatedAt: now,
      lastSynchronizedAt: now,
      warnings: [],
      errors: []
    });
    return getOutputSynchronization(synchronization, { now });
  } catch (error) {
    const normalized = normalizeSynchronizationError(error);
    updateSynchronization(synchronization, {
      status: runtime.targets[target].lastSynchronizedAt ? "stale" : "error",
      updatedAt: now,
      warnings: runtime.targets[target].lastSynchronizedAt ? uniqueStrings([...(synchronization.warnings || []), `${target}-last-result-preserved`]) : synchronization.warnings,
      errors: uniqueStrings([...(synchronization.errors || []), normalized.code])
    });
    throw normalized;
  }
}

function performSynchronization(target, prepared, options) {
  if (target === "program_main") {
    const route = requireCompatibleRoute(prepared.routingEngine, target);
    const envelope = routeProgramToOutput(prepared.routingEngine, route.routeId, prepared.programSnapshot, {
      context: prepared.context,
      visibility: "public",
      now: options.now
    });
    if (envelope.status === "controlled-empty") {
      clearProgramMainOutput(prepared.programMainOutput, { now: options.now });
      const outputSnapshot = buildProgramMainOutputSnapshot(prepared.programMainOutput, { now: options.now });
      return {
        envelope,
        sourceRevision: envelope.sourceRevision,
        routeRevision: envelope.routeRevision,
        outputRevision: outputSnapshot.projectionRevision,
        status: "cleared",
        warnings: uniqueStrings([...(envelope.warnings || []), ...(outputSnapshot.warnings || [])]),
        errors: uniqueStrings([...(envelope.errors || []), ...(outputSnapshot.errors || [])])
      };
    }
    const validation = validateProgramMainProjection(envelope, { config: prepared.programMainOutput });
    if (!validation.valid) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.PROJECTION_INVALID, { errors: validation.errors });
    applyProgramMainProjection(prepared.programMainOutput, envelope, { now: options.now });
    const outputSnapshot = buildProgramMainOutputSnapshot(prepared.programMainOutput, { now: options.now });
    return {
      envelope,
      sourceRevision: envelope.sourceRevision,
      routeRevision: envelope.routeRevision,
      outputRevision: outputSnapshot.projectionRevision,
      status: envelope.status === "stale" ? "stale" : envelope.status === "controlled-empty" ? "cleared" : "synchronized",
      warnings: uniqueStrings([...(envelope.warnings || []), ...(outputSnapshot.warnings || [])]),
      errors: uniqueStrings([...(envelope.errors || []), ...(outputSnapshot.errors || [])])
    };
  }
  const route = requireCompatibleRoute(prepared.routingEngine, target);
  const envelope = routeAnnouncerMonitor(prepared.routingEngine, route.routeId, prepared.announcerSources, {
    context: prepared.context,
    visibility: prepared.visibility,
    now: options.now
  });
  const validation = validateAnnouncerProjection(envelope, { config: prepared.announcerMonitor });
  if (!validation.valid) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.PROJECTION_INVALID, { errors: validation.errors });
  updateAnnouncerMonitor(prepared.announcerMonitor, envelope, { context: prepared.context, now: options.now });
  const outputSnapshot = getAnnouncerSnapshot(prepared.announcerMonitor, { visibility: prepared.visibility, now: options.now });
  return {
    envelope,
    sourceRevision: envelope.sourceRevision,
    routeRevision: envelope.routeRevision,
    outputRevision: outputSnapshot.projectionRevision,
    status: envelope.status === "stale" ? "stale" : ["disabled", "unavailable"].includes(envelope.status) ? envelope.status : "synchronized",
    warnings: uniqueStrings([...(envelope.warnings || []), ...(outputSnapshot.warnings || [])]),
    errors: uniqueStrings([...(envelope.errors || []), ...(outputSnapshot.errors || [])])
  };
}

function prepareProgramSources(sources, options) {
  assertSafeSources(sources, ["routingEngine", "programEngine", "programSnapshot", "programMainOutput", "context"]);
  const programSnapshot = sources.programSnapshot || (sources.programEngine
    ? getProgramSnapshot(sources.programEngine, { visibility: "public", now: options.now })
    : null);
  if (!isRecord(programSnapshot)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: "programSnapshot" });
  assertTargetInstance("program_main", sources.programMainOutput);
  if (!isRecord(sources.routingEngine)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: "routingEngine" });
  return {
    routingEngine: sources.routingEngine,
    programSnapshot,
    programMainOutput: sources.programMainOutput,
    context: normalizeContext(sources.context)
  };
}

function prepareAnnouncerSources(sources) {
  assertSafeSources(sources, ["routingEngine", "announcerSources", "announcerMonitor", "context", "visibility"]);
  if (!isRecord(sources.announcerSources)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: "announcerSources" });
  assertTargetInstance("announcer_monitor", sources.announcerMonitor);
  if (!isRecord(sources.routingEngine)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: "routingEngine" });
  const visibility = ["operational", "restricted"].includes(sources.visibility) ? sources.visibility : "operational";
  return {
    routingEngine: sources.routingEngine,
    announcerSources: cloneOutputSynchronizationResult(sources.announcerSources),
    announcerMonitor: sources.announcerMonitor,
    context: normalizeContext(sources.context),
    visibility
  };
}

function requireCompatibleRoute(engine, target) {
  const definition = TARGET_DEFINITIONS[target];
  const route = getOutputRoute(engine, definition.routeId);
  if (!route || route.routeType !== definition.routeType || route.outputId !== definition.outputId || route.sourceType !== definition.sourceType) {
    throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.ROUTE_INVALID, { target });
  }
  return route;
}

function normalizeConfig(config) {
  const safe = safeClone(config, { rejectUnsafe: true });
  if (safe.errors.length || !isRecord(safe.value)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_CONFIG, { errors: safe.errors });
  const requestedTargets = Array.isArray(safe.value.targets) ? safe.value.targets.map(normalizeTarget) : [...OUTPUT_SYNCHRONIZATION_TARGETS];
  const targets = [...new Set(requestedTargets)];
  if (!targets.length) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_CONFIG, { field: "targets" });
  const staleAfterMs = safe.value.staleAfterMs === undefined ? DEFAULT_STALE_AFTER_MS : Number(safe.value.staleAfterMs);
  if (!Number.isFinite(staleAfterMs) || staleAfterMs < 0 || staleAfterMs > 86400000) {
    throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_CONFIG, { field: "staleAfterMs" });
  }
  return {
    targets,
    staleAfterMs,
    context: normalizeContext(safe.value.context),
    mode: "explicit-local",
    transport: null
  };
}

function assertConfiguredContext(config, context) {
  if (!config) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.NOT_CONFIGURED);
  const expected = config.context || {};
  for (const field of ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"]) {
    if (expected[field] && context[field] && expected[field] !== context[field]) {
      throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.CONTEXT_CONFLICT, { field });
    }
  }
}

function assertSafeSources(sources, allowedKeys) {
  if (!isRecord(sources)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES);
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(sources)) {
    if (DANGEROUS_KEYS.has(key) || !allowed.has(key)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: key });
  }
  for (const key of Object.keys(sources)) {
    const descriptor = Object.getOwnPropertyDescriptor(sources, key);
    if (descriptor?.get || descriptor?.set) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.UNSAFE_PAYLOAD, { field: key });
    const value = descriptor?.value;
    if (["routingEngine", "programEngine", "programMainOutput", "announcerMonitor"].includes(key)) {
      if (!isRecord(value)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: key });
      continue;
    }
    const safe = safeClone(value, { rejectUnsafe: true });
    if (safe.errors.length) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.UNSAFE_PAYLOAD, { field: key, errors: safe.errors });
  }
}

function assertTargetInstance(target, instance) {
  const valid = target === "program_main"
    ? isRecord(instance) && normalizeId(instance.programMainOutputId) && instance.mounted === true
    : isRecord(instance) && normalizeId(instance.announcerMonitorId) && instance.mounted === true;
  if (!valid) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.TARGET_UNAVAILABLE, { target });
}

function normalizeTarget(target) {
  const value = String(target || "").trim().toLowerCase().replaceAll("-", "_");
  if (!TARGET_SET.has(value)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.TARGET_INVALID, { target });
  return value;
}

function normalizeContext(value) {
  const safe = safeClone(value || {}, { rejectUnsafe: true });
  if (safe.errors.length || !isRecord(safe.value)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: "context" });
  const result = {};
  for (const field of ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "charreadaId", "sessionId"]) {
    result[field] = normalizeNullableId(safe.value[field]);
  }
  return result;
}

function synchronizedTargetState(previous, result, now) {
  return {
    ...previous,
    status: result.status,
    sourceRevision: result.sourceRevision,
    routeRevision: result.routeRevision,
    outputRevision: result.outputRevision,
    projectionRevision: previous.projectionRevision + 1,
    stale: result.status === "stale",
    lastSynchronizedAt: now,
    warnings: cloneOutputSynchronizationResult(result.warnings || []),
    errors: cloneOutputSynchronizationResult(result.errors || [])
  };
}

function failedTargetState(previous, error, now) {
  return {
    ...previous,
    status: previous.lastSynchronizedAt ? "stale" : "error",
    stale: Boolean(previous.lastSynchronizedAt),
    warnings: previous.lastSynchronizedAt ? uniqueStrings([...(previous.warnings || []), "output-synchronization-last-result-preserved"]) : previous.warnings,
    errors: uniqueStrings([...(previous.errors || []), error.code]),
    lastAttemptAt: now
  };
}

function emptyTarget(target) {
  return {
    target,
    status: "ready",
    sourceRevision: null,
    routeRevision: null,
    outputRevision: null,
    projectionRevision: 0,
    stale: false,
    lastSynchronizedAt: null,
    warnings: [],
    errors: []
  };
}

function createTargetState() {
  return Object.fromEntries(OUTPUT_SYNCHRONIZATION_TARGETS.map((target) => [target, emptyTarget(target)]));
}

function consultedTargets(targets, config, now) {
  const staleAfterMs = config?.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  return Object.fromEntries(Object.entries(targets).map(([key, target]) => {
    const elapsed = target.lastSynchronizedAt ? Date.parse(now) - Date.parse(target.lastSynchronizedAt) : 0;
    const staleByTime = Boolean(target.lastSynchronizedAt) && staleAfterMs > 0 && elapsed > staleAfterMs;
    return [key, {
      ...cloneOutputSynchronizationResult(target),
      status: staleByTime && target.status === "synchronized" ? "stale" : target.status,
      stale: target.stale || staleByTime,
      warnings: staleByTime ? uniqueStrings([...(target.warnings || []), "output-synchronization-expired"] ) : cloneOutputSynchronizationResult(target.warnings || [])
    }];
  }));
}

function deriveSynchronizationStatus(targets) {
  const values = Object.values(targets);
  if (values.some((target) => target.status === "error") && values.some((target) => target.status === "synchronized")) return "partial";
  if (values.some((target) => target.status === "stale")) return "stale";
  if (values.every((target) => target.status === "cleared")) return "cleared";
  if (values.every((target) => ["synchronized", "cleared"].includes(target.status))) return "synchronized";
  if (values.some((target) => ["synchronized", "cleared"].includes(target.status))) return "partial";
  return "ready";
}

function targetSummary(target) {
  return {
    status: target.status,
    sourceRevision: target.sourceRevision,
    routeRevision: target.routeRevision,
    outputRevision: target.outputRevision,
    stale: target.stale,
    lastSynchronizedAt: target.lastSynchronizedAt
  };
}

function resolveAnnouncerSourceRevision(sources) {
  const value = sources?.sourceRevision ?? sources?.revision ?? sources?.contract?.revision;
  return nonNegativeInteger(value) ? Number(value) : 0;
}

function withIdempotency(runtime, key, intent, callback) {
  const id = normalizeNullableId(key);
  if (!id) return callback();
  const fingerprint = stableFingerprint(intent);
  const existing = runtime.idempotency.get(id);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.IDEMPOTENCY_CONFLICT, { idempotencyKey: id });
    return cloneOutputSynchronizationResult(existing.result);
  }
  const result = callback();
  runtime.idempotency.set(id, { fingerprint, result: freezeDeep(cloneOutputSynchronizationResult(result)) });
  return cloneOutputSynchronizationResult(result);
}

function assertExpectedRevision(synchronization, expectedRevision) {
  if (expectedRevision === undefined || expectedRevision === null) return;
  if (!nonNegativeInteger(expectedRevision) || Number(expectedRevision) !== synchronization.revision) {
    throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.REVISION_CONFLICT, {
      expectedRevision,
      actualRevision: synchronization.revision
    });
  }
}

function requireActiveSynchronization(synchronization) {
  const runtime = requireSynchronization(synchronization);
  if (!runtime.config) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.NOT_CONFIGURED);
  if (!ACTIVE_STATES.has(synchronization.status)) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.NOT_STARTED, { status: synchronization.status });
  return runtime;
}

function requireSynchronization(synchronization, options = {}) {
  const runtime = isRecord(synchronization) ? SYNCHRONIZERS.get(synchronization) : null;
  if (!runtime) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID);
  if ((runtime.destroyed || synchronization.status === "destroyed") && !options.allowDestroyed) {
    throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.DESTROYED);
  }
  return runtime;
}

function updateSynchronization(synchronization, patch) {
  Object.assign(synchronization, patch);
}

function normalizeSynchronizationError(error) {
  if (error instanceof BroadcastOutputSynchronizationError) return error;
  return synchronizationError(error?.code || OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID, {
    source: error?.name || "Error"
  });
}

function synchronizationError(code, details = {}) {
  return new BroadcastOutputSynchronizationError(code, details);
}

function safeClone(value, options = {}) {
  const errors = [];
  const seen = new WeakSet();
  let itemCount = 0;
  const visit = (current, depth) => {
    if (current === null || ["string", "number", "boolean"].includes(typeof current)) {
      if (typeof current === "number" && !Number.isFinite(current)) {
        errors.push("output-synchronization-number-invalid");
        return undefined;
      }
      if (typeof current === "string") {
        if (current.length > MAX_TEXT_LENGTH) errors.push("output-synchronization-string-limit");
        if (UNSAFE_PROTOCOL.test(current)) errors.push("output-synchronization-url-unsafe");
        return current.slice(0, MAX_TEXT_LENGTH);
      }
      return current;
    }
    if (["undefined", "function", "symbol", "bigint"].includes(typeof current)) {
      errors.push("output-synchronization-value-unsafe");
      return undefined;
    }
    if (depth > MAX_DEPTH) {
      errors.push("output-synchronization-depth-limit");
      return undefined;
    }
    if (current?.nodeType || current === globalThis.window || current === globalThis.document) {
      errors.push("output-synchronization-dom-rejected");
      return undefined;
    }
    if (seen.has(current)) {
      errors.push("output-synchronization-cycle-rejected");
      return undefined;
    }
    const prototype = Object.getPrototypeOf(current);
    if (!(prototype === Object.prototype || prototype === Array.prototype || prototype === null)) {
      errors.push("output-synchronization-prototype-rejected");
      return undefined;
    }
    seen.add(current);
    if (Array.isArray(current)) {
      if (current.length > MAX_ARRAY_ITEMS) errors.push("output-synchronization-array-limit");
      const result = current.slice(0, MAX_ARRAY_ITEMS).map((entry) => visit(entry, depth + 1)).filter((entry) => entry !== undefined);
      seen.delete(current);
      return result;
    }
    const result = {};
    const keys = Object.keys(current);
    if (keys.length > MAX_OBJECT_KEYS) errors.push("output-synchronization-object-limit");
    for (const key of keys.slice(0, MAX_OBJECT_KEYS)) {
      itemCount += 1;
      if (itemCount > 10000) {
        errors.push("output-synchronization-size-limit");
        break;
      }
      if (DANGEROUS_KEYS.has(key) || PRIVATE_KEYS.test(key)) {
        if (options.rejectUnsafe !== false) errors.push("output-synchronization-key-rejected");
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (descriptor?.get || descriptor?.set) {
        errors.push("output-synchronization-accessor-rejected");
        continue;
      }
      const cloned = visit(descriptor?.value, depth + 1);
      if (cloned !== undefined) result[key] = cloned;
    }
    seen.delete(current);
    return result;
  };
  const cloned = visit(value, 0);
  return { value: cloned, errors: uniqueStrings(errors) };
}

function stableFingerprint(value) {
  const safe = safeClone(value, { rejectUnsafe: false }).value;
  const stable = (current) => {
    if (Array.isArray(current)) return `[${current.map(stable).join(",")}]`;
    if (isRecord(current)) return `{${Object.keys(current).sort().map((key) => `${JSON.stringify(key)}:${stable(current[key])}`).join(",")}}`;
    return JSON.stringify(current);
  };
  return stable(safe);
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((entry) => freezeDeep(entry, seen));
  return Object.freeze(value);
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value).map((value) => value.slice(0, 240)))];
}

function validStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function nonNegativeInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function normalizeId(value) {
  const id = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(id) ? id : null;
}

function normalizeNullableId(value) {
  if (value === null || value === undefined || value === "") return null;
  const id = normalizeId(value);
  if (!id) throw synchronizationError(OUTPUT_SYNCHRONIZATION_ERROR_CODES.INVALID_SOURCES, { field: "id" });
  return id;
}

function normalizeNow(value) {
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return new Date().toISOString();
}

function isIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function compactTimestamp(value) {
  return value.replace(/[-:.TZ]/g, "").slice(0, 14);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
