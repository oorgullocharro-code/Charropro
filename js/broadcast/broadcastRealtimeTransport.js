export const BROADCAST_REALTIME_TRANSPORT_VERSION = "1.0.0";
export const BROADCAST_SINGLE_TENANT_SCOPE_ID = "charropro-e8a68";
export const BROADCAST_TEMPORARY_ACCESS_VERSION = "1.0.0";
export const BROADCAST_TEMPORARY_ACCESS_OUTPUT_TYPES = Object.freeze(["program_main", "announcer_monitor"]);

export const BROADCAST_REALTIME_STATES = Object.freeze([
  "uninitialized", "configured", "connecting", "connected", "stale", "offline",
  "disconnected", "destroyed", "error"
]);

export const BROADCAST_REALTIME_ERROR_CODES = Object.freeze({
  INVALID: "broadcast-realtime-invalid",
  CONFIG_INVALID: "broadcast-realtime-config-invalid",
  CONTEXT_MISSING: "broadcast-realtime-context-missing",
  CONTEXT_CONFLICT: "broadcast-realtime-context-conflict",
  ADAPTER_INVALID: "broadcast-realtime-adapter-invalid",
  NOT_CONFIGURED: "broadcast-realtime-not-configured",
  NOT_CONNECTED: "broadcast-realtime-not-connected",
  CHANNEL_INVALID: "broadcast-realtime-channel-invalid",
  VISIBILITY_INVALID: "broadcast-realtime-visibility-invalid",
  REVISION_CONFLICT: "broadcast-realtime-revision-conflict",
  REVISION_REGRESSION: "broadcast-realtime-revision-regression",
  IDEMPOTENCY_CONFLICT: "broadcast-realtime-idempotency-conflict",
  PAYLOAD_UNSAFE: "broadcast-realtime-payload-unsafe",
  PERMISSION_DENIED: "broadcast-realtime-permission-denied",
  TEMPORARY_ACCESS_INVALID: "broadcast-realtime-temporary-access-invalid",
  TEMPORARY_ACCESS_EXPIRED: "broadcast-realtime-temporary-access-expired",
  TEMPORARY_ACCESS_REVOKED: "broadcast-realtime-temporary-access-revoked",
  SECURE_RANDOM_UNAVAILABLE: "broadcast-realtime-secure-random-unavailable",
  DESTROYED: "broadcast-realtime-destroyed"
});

const INSTANCES = new WeakMap();
const CHANNELS = new Set(["program", "announcer"]);
const CHANNEL_VISIBILITIES = Object.freeze({
  program: new Set(["public", "production"]),
  announcer: new Set(["operational", "restricted"])
});
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const PRIVATE_KEYS = /^(?:actor|auth|authorization|cookie|credential|firebase|headers?|judge|operator|password|privatekey|secret|signedurl|token|accesstoken|refreshtoken|apikey)(?:id|name|value|data|ref|url|key|headers?)?$/i;
const PAYLOAD_IDENTITY_KEYS = new Set(["tenantid", "organizationid", "clientid"]);
const UNSAFE_PROTOCOL = /^\s*(?:javascript|file|vbscript|data\s*:\s*(?:text\/html|application\/javascript))\s*:/i;
const UNSAFE_MARKUP = /<\s*\/?\s*(?:script|iframe|object|embed)\b|\bon(?:error|load|click)\s*=/i;
const MAX_DEPTH = 18;
const MAX_ARRAY_ITEMS = 600;
const MAX_OBJECT_KEYS = 800;
const MAX_TEXT_LENGTH = 20000;
const DEFAULT_STALE_AFTER_MS = 15000;
const DEFAULT_ACCESS_TTL_MS = 2 * 60 * 60 * 1000;
const MIN_ACCESS_TTL_MS = 60 * 1000;
const MAX_ACCESS_TTL_MS = 24 * 60 * 60 * 1000;

export class BroadcastRealtimeTransportError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastRealtimeTransportError";
    this.code = code;
    this.details = safeClone(details, { rejectUnsafe: false }).value || {};
  }
}

export function buildBroadcastAutomaticSessionId(value = {}) {
  const tournamentId = normalizeId(value.tournamentId);
  const competitionId = normalizeOptionalId(value.competitionId) || "general";
  const activeCharreadaId = normalizeOptionalId(value.activeCharreadaId || value.charreadaId) || "current";
  if (!tournamentId) throw transportError(BROADCAST_REALTIME_ERROR_CODES.CONTEXT_MISSING);
  const raw = `${tournamentId}_${competitionId}_${activeCharreadaId}`;
  const slug = raw.replace(/[^A-Za-z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 128);
  return `broadcast_${slug}_${stableHash(raw)}`;
}

export function createBroadcastTemporaryAccessDescriptor(context = {}, outputType, options = {}) {
  const normalizedOutputType = normalizeTemporaryAccessOutputType(outputType);
  const tournamentId = normalizeId(context.tournamentId);
  const competitionId = normalizeOptionalId(context.competitionId);
  const activeCharreadaId = normalizeOptionalId(context.activeCharreadaId || context.charreadaId);
  const sessionId = normalizeId(context.sessionId) || buildBroadcastAutomaticSessionId({ tournamentId, competitionId, activeCharreadaId });
  if (!tournamentId || !sessionId) throw transportError(BROADCAST_REALTIME_ERROR_CODES.CONTEXT_MISSING);
  const accessId = normalizeId(options.accessId) || generateSecureAccessId();
  const createdAt = normalizeNow(options.now);
  const createdAtMs = Date.parse(createdAt);
  const requestedTtl = Number(options.ttlMs ?? DEFAULT_ACCESS_TTL_MS);
  const ttlMs = Number.isFinite(requestedTtl)
    ? Math.min(MAX_ACCESS_TTL_MS, Math.max(MIN_ACCESS_TTL_MS, Math.trunc(requestedTtl)))
    : DEFAULT_ACCESS_TTL_MS;
  const descriptor = {
    accessVersion: BROADCAST_TEMPORARY_ACCESS_VERSION,
    accessId,
    nonce: accessId,
    sessionId,
    outputType: normalizedOutputType,
    channel: normalizedOutputType === "program_main" ? "program" : "announcer",
    readOnly: true,
    status: "active",
    revision: 1,
    createdAt,
    expiresAt: createdAtMs + ttlMs,
    expiresAtIso: new Date(createdAtMs + ttlMs).toISOString(),
    revokedAt: null,
    context: {
      tournamentId,
      competitionId,
      activeCharreadaId,
      sessionId
    }
  };
  const validation = validateBroadcastTemporaryAccessDescriptor(descriptor, { now: createdAt, allowExpired: true });
  if (!validation.valid) throw transportError(BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_INVALID, { errors: validation.errors });
  return freezeDeep(cloneValue(descriptor));
}

export function validateBroadcastTemporaryAccessDescriptor(descriptor, options = {}) {
  const safe = safeClone(descriptor, { rejectUnsafe: true });
  const errors = [...safe.errors];
  const value = safe.value;
  if (!isRecord(value)) return { valid: false, errors: [BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_INVALID], warnings: [] };
  if (value.accessVersion !== BROADCAST_TEMPORARY_ACCESS_VERSION) errors.push("temporary-access-version-invalid");
  if (!normalizeId(value.accessId) || value.nonce !== value.accessId) errors.push("temporary-access-id-invalid");
  if (!normalizeId(value.sessionId) || value.context?.sessionId !== value.sessionId) errors.push("temporary-access-session-invalid");
  if (!normalizeId(value.context?.tournamentId)) errors.push("temporary-access-tournament-invalid");
  if (!BROADCAST_TEMPORARY_ACCESS_OUTPUT_TYPES.includes(value.outputType)) errors.push("temporary-access-output-invalid");
  if (value.channel !== (value.outputType === "program_main" ? "program" : "announcer")) errors.push("temporary-access-channel-invalid");
  if (value.readOnly !== true) errors.push("temporary-access-read-only-required");
  if (!new Set(["active", "revoked"]).has(value.status)) errors.push("temporary-access-status-invalid");
  if (!Number.isInteger(value.revision) || value.revision < 1) errors.push("temporary-access-revision-invalid");
  if (!isIso(value.createdAt) || !Number.isFinite(Number(value.expiresAt))) errors.push("temporary-access-expiration-invalid");
  if (Number(value.expiresAt) <= Date.parse(value.createdAt || "")) errors.push("temporary-access-expiration-order-invalid");
  const nowMs = Date.parse(normalizeNow(options.now));
  if (options.allowExpired !== true && Number(value.expiresAt) <= nowMs) errors.push(BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_EXPIRED);
  if (value.status === "revoked") errors.push(BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_REVOKED);
  return { valid: errors.length === 0, errors: uniqueStrings(errors), warnings: [] };
}

export function isBroadcastTemporaryAccessActive(descriptor, options = {}) {
  return validateBroadcastTemporaryAccessDescriptor(descriptor, options).valid;
}

export function revokeBroadcastTemporaryAccessDescriptor(descriptor, options = {}) {
  const validation = validateBroadcastTemporaryAccessDescriptor(descriptor, { ...options, allowExpired: true });
  const nonStatusErrors = validation.errors.filter((error) => error !== BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_REVOKED);
  if (nonStatusErrors.length) throw transportError(BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_INVALID, { errors: nonStatusErrors });
  const now = normalizeNow(options.now);
  return freezeDeep(cloneValue({
    ...descriptor,
    status: "revoked",
    revision: Number(descriptor.revision || 0) + 1,
    revokedAt: now
  }));
}

export function createBroadcastRealtimeTransport(definition = {}, options = {}) {
  const safe = safeClone(definition, { rejectUnsafe: true });
  if (safe.errors.length) throw transportError(BROADCAST_REALTIME_ERROR_CODES.INVALID, { errors: safe.errors });
  const now = normalizeNow(options.now);
  const transport = {
    broadcastRealtimeTransportVersion: BROADCAST_REALTIME_TRANSPORT_VERSION,
    transportId: normalizeId(safe.value?.transportId) || `broadcast_realtime_${compactTimestamp(now)}`,
    status: "uninitialized",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    connectedAt: null,
    disconnectedAt: null,
    lastReceivedAt: null,
    lastPublishedAt: null,
    reconnectCount: 0,
    warnings: [],
    errors: []
  };
  INSTANCES.set(transport, {
    config: null,
    adapterDisconnect: null,
    subscriptions: new Map(),
    channelState: createChannelState(),
    idempotency: new Map(),
    destroyed: false,
    online: false
  });
  return transport;
}

export function configureBroadcastRealtimeTransport(transport, config = {}, options = {}) {
  const runtime = requireTransport(transport);
  assertExpectedRevision(transport, options.expectedRevision);
  const normalized = normalizeConfig(config);
  runtime.config = Object.freeze({
    context: freezeDeep(cloneValue(normalized.context)),
    sessionPath: normalized.sessionPath,
    adapter: normalized.adapter,
    staleAfterMs: normalized.staleAfterMs,
    onStatus: normalized.onStatus
  });
  updateTransport(transport, {
    status: "configured",
    revision: transport.revision + 1,
    updatedAt: normalizeNow(options.now),
    warnings: [],
    errors: []
  });
  return getBroadcastRealtimeStatus(transport, options);
}

export async function connectBroadcastRealtimeTransport(transport, options = {}) {
  const runtime = requireTransport(transport);
  assertExpectedRevision(transport, options.expectedRevision);
  if (!runtime.config) throw transportError(BROADCAST_REALTIME_ERROR_CODES.NOT_CONFIGURED);
  if (runtime.online && transport.status === "connected") return getBroadcastRealtimeStatus(transport, options);
  const now = normalizeNow(options.now);
  updateTransport(transport, { status: "connecting", updatedAt: now, warnings: [], errors: [] });
  try {
    const disconnect = await runtime.config.adapter.connect({
      sessionPath: runtime.config.sessionPath,
      context: cloneValue(runtime.config.context),
      onStatus: (status) => applyAdapterStatus(transport, runtime, status),
      onError: (error) => applyAdapterError(transport, runtime, error)
    });
    runtime.adapterDisconnect = typeof disconnect === "function" ? disconnect : null;
    if (typeof runtime.config.adapter.read === "function") {
      const revisions = await Promise.all(["program", "announcer"].map(async (channel) => {
        try {
          return await runtime.config.adapter.read(`${runtime.config.sessionPath}/revisions/${channel}`);
        } catch {
          return null;
        }
      }));
      ["program", "announcer"].forEach((channel, index) => {
        const revision = Number(revisions[index]?.revision || 0);
        if (Number.isInteger(revision) && revision >= 0) runtime.channelState[channel].publishedRevision = revision;
      });
    }
    runtime.online = true;
    updateTransport(transport, {
      status: "connected",
      revision: transport.revision + 1,
      updatedAt: now,
      connectedAt: now,
      warnings: [],
      errors: []
    });
    return getBroadcastRealtimeStatus(transport, options);
  } catch (error) {
    runtime.online = false;
    const normalized = normalizeAdapterError(error);
    updateTransport(transport, {
      status: "error",
      revision: transport.revision + 1,
      updatedAt: now,
      errors: [normalized.code]
    });
    throw normalized;
  }
}

export function disconnectBroadcastRealtimeTransport(transport, options = {}) {
  const runtime = requireTransport(transport);
  assertExpectedRevision(transport, options.expectedRevision);
  runtime.adapterDisconnect?.();
  runtime.adapterDisconnect = null;
  for (const subscription of runtime.subscriptions.values()) subscription.unsubscribe?.();
  runtime.subscriptions.clear();
  runtime.online = false;
  const now = normalizeNow(options.now);
  updateTransport(transport, {
    status: "disconnected",
    revision: transport.revision + 1,
    updatedAt: now,
    disconnectedAt: now
  });
  return getBroadcastRealtimeStatus(transport, options);
}

export async function publishBroadcastProjection(transport, channel, projection, options = {}) {
  const runtime = requireConnectedTransport(transport);
  const normalizedChannel = normalizeChannel(channel);
  const visibility = normalizeVisibility(normalizedChannel, options.visibility || projection?.visibility);
  const safe = safeClone(projection, { rejectUnsafe: true, visibility });
  const payloadHasIdentity = hasPayloadIdentity(safe.value);
  if (safe.errors.length || payloadHasIdentity) {
    throw transportError(BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE, {
      errors: uniqueStrings([...safe.errors, ...(payloadHasIdentity ? ["payload-identity-forbidden"] : [])])
    });
  }
  const state = runtime.channelState[normalizedChannel];
  const expectedRevision = options.expectedRevision;
  if (expectedRevision !== undefined && Number(expectedRevision) !== state.publishedRevision) {
    throw transportError(BROADCAST_REALTIME_ERROR_CODES.REVISION_CONFLICT, {
      expectedRevision: Number(expectedRevision),
      actualRevision: state.publishedRevision
    });
  }
  const intent = stableStringify({ channel: normalizedChannel, visibility, projection: safe.value, clear: options.clear === true });
  const idempotencyKey = normalizeOptionalId(options.idempotencyKey);
  if (idempotencyKey && runtime.idempotency.has(idempotencyKey)) {
    const previous = runtime.idempotency.get(idempotencyKey);
    if (previous.intent !== intent) throw transportError(BROADCAST_REALTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT);
    return cloneValue(previous.result);
  }
  const now = normalizeNow(options.now);
  const revision = state.publishedRevision + 1;
  const envelope = {
    transportVersion: BROADCAST_REALTIME_TRANSPORT_VERSION,
    messageId: normalizeId(options.messageId) || `broadcast_${normalizedChannel}_${compactTimestamp(now)}_${revision}`,
    sessionId: runtime.config.context.sessionId,
    channel: normalizedChannel,
    outputId: normalizedChannel === "program" ? "program-main" : "announcer-monitor",
    revision,
    previousRevision: state.publishedRevision,
    status: options.clear === true ? "cleared" : normalizeMessageStatus(options.status),
    visibility,
    context: cloneValue(runtime.config.context),
    projection: options.clear === true ? null : safe.value,
    publishedAt: now,
    idempotencyKey
  };
  const path = `${runtime.config.sessionPath}/${normalizedChannel}/current`;
  try {
    const result = await runtime.config.adapter.publish({
      sessionPath: runtime.config.sessionPath,
      path,
      channel: normalizedChannel,
      context: cloneValue(runtime.config.context),
      envelope: cloneValue(envelope),
      expectedRevision: state.publishedRevision,
      idempotencyKey
    });
    state.publishedRevision = Number(result?.revision ?? revision);
    state.lastPublishedAt = now;
    transport.lastPublishedAt = now;
    transport.updatedAt = now;
    const response = { ok: true, channel: normalizedChannel, revision: state.publishedRevision, path, envelope: cloneValue(envelope) };
    if (idempotencyKey) runtime.idempotency.set(idempotencyKey, { intent, result: cloneValue(response) });
    return response;
  } catch (error) {
    throw normalizeAdapterError(error);
  }
}

export function subscribeBroadcastProjection(transport, channel, callback, options = {}) {
  const runtime = requireConnectedTransport(transport);
  const normalizedChannel = normalizeChannel(channel);
  if (typeof callback !== "function") throw transportError(BROADCAST_REALTIME_ERROR_CODES.INVALID);
  const subscriptionId = normalizeId(options.subscriptionId) || `${normalizedChannel}_${runtime.subscriptions.size + 1}`;
  if (runtime.subscriptions.has(subscriptionId)) unsubscribeBroadcastProjection(transport, subscriptionId);
  const path = `${runtime.config.sessionPath}/${normalizedChannel}/current`;
  const unsubscribe = runtime.config.adapter.subscribe({
    path,
    context: cloneValue(runtime.config.context),
    onValue: (value) => receiveEnvelope(transport, runtime, normalizedChannel, value, callback, options),
    onError: (error) => applyAdapterError(transport, runtime, error)
  });
  runtime.subscriptions.set(subscriptionId, { channel: normalizedChannel, path, unsubscribe });
  return subscriptionId;
}

export function unsubscribeBroadcastProjection(transport, subscriptionId) {
  const runtime = requireTransport(transport);
  const cleanId = normalizeId(subscriptionId);
  const subscription = cleanId ? runtime.subscriptions.get(cleanId) : null;
  if (!subscription) return false;
  subscription.unsubscribe?.();
  runtime.subscriptions.delete(cleanId);
  return true;
}

export async function publishOutputState(transport, outputId, state = {}, options = {}) {
  const runtime = requireConnectedTransport(transport);
  const cleanOutputId = normalizeId(outputId);
  if (!cleanOutputId) throw transportError(BROADCAST_REALTIME_ERROR_CODES.INVALID);
  const safe = safeClone(state, { rejectUnsafe: true });
  if (safe.errors.length) throw transportError(BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE, { errors: safe.errors });
  const now = normalizeNow(options.now);
  return runtime.config.adapter.publishOutputState({
    sessionPath: runtime.config.sessionPath,
    path: `${runtime.config.sessionPath}/outputs/${cleanOutputId}`,
    context: cloneValue(runtime.config.context),
    outputId: cleanOutputId,
    state: { status: normalizeMessageStatus(state.status), revision: nonNegativeInteger(state.revision) ? state.revision : 0, updatedAt: now },
    expectedRevision: options.expectedRevision
  });
}

export function getBroadcastRealtimeStatus(transport, options = {}) {
  const runtime = requireTransport(transport);
  evaluateStale(transport, runtime, options);
  return cloneValue({
    transportId: transport.transportId,
    status: transport.status,
    online: runtime.online,
    connecting: transport.status === "connecting",
    connected: transport.status === "connected",
    stale: transport.status === "stale",
    offline: transport.status === "offline" || transport.status === "disconnected",
    revision: transport.revision,
    sessionId: runtime.config?.context?.sessionId || null,
    lastRevision: Math.max(...Object.values(runtime.channelState).map((item) => item.receivedRevision), 0),
    lastReceivedAt: transport.lastReceivedAt,
    lastPublishedAt: transport.lastPublishedAt,
    reconnectCount: transport.reconnectCount,
    warnings: transport.warnings,
    errors: transport.errors
  });
}

export function getBroadcastRealtimeWarnings(transport, options = {}) {
  return getBroadcastRealtimeStatus(transport, options).warnings;
}

export function getBroadcastRealtimeErrors(transport, options = {}) {
  return getBroadcastRealtimeStatus(transport, options).errors;
}

export function buildBroadcastRealtimeSnapshot(transport, options = {}) {
  const runtime = requireTransport(transport);
  const status = getBroadcastRealtimeStatus(transport, options);
  return cloneValue({
    snapshotVersion: "1.0.0",
    broadcastRealtimeTransportVersion: BROADCAST_REALTIME_TRANSPORT_VERSION,
    transportId: transport.transportId,
    status: status.status,
    online: status.online,
    context: runtime.config ? cloneValue(runtime.config.context) : null,
    channels: Object.fromEntries(Object.entries(runtime.channelState).map(([key, value]) => [key, {
      publishedRevision: value.publishedRevision,
      receivedRevision: value.receivedRevision,
      lastPublishedAt: value.lastPublishedAt,
      lastReceivedAt: value.lastReceivedAt,
      stale: value.stale
    }])),
    lastRevision: status.lastRevision,
    lastReceivedAt: status.lastReceivedAt,
    lastPublishedAt: status.lastPublishedAt,
    reconnectCount: status.reconnectCount,
    warnings: status.warnings,
    errors: status.errors,
    generatedAt: normalizeNow(options.now)
  });
}

export function destroyBroadcastRealtimeTransport(transport, options = {}) {
  const runtime = requireTransport(transport);
  runtime.adapterDisconnect?.();
  for (const subscription of runtime.subscriptions.values()) subscription.unsubscribe?.();
  runtime.subscriptions.clear();
  runtime.idempotency.clear();
  runtime.online = false;
  runtime.destroyed = true;
  updateTransport(transport, {
    status: "destroyed",
    revision: transport.revision + 1,
    updatedAt: normalizeNow(options.now)
  });
  return cloneValue({ transportId: transport.transportId, status: "destroyed" });
}

function receiveEnvelope(transport, runtime, channel, value, callback, options) {
  if (!value) return;
  const safe = safeClone(value, { rejectUnsafe: true, visibility: value.visibility });
  if (safe.errors.length) {
    applyAdapterError(transport, runtime, transportError(BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE, { errors: safe.errors }));
    return;
  }
  const envelope = safe.value;
  if (hasPayloadIdentity(envelope.projection)) {
    applyAdapterError(transport, runtime, transportError(BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE, {
      errors: ["payload-identity-forbidden"]
    }));
    return;
  }
  if (!sameContext(runtime.config.context, envelope.context) || envelope.sessionId !== runtime.config.context.sessionId) {
    applyAdapterError(transport, runtime, transportError(BROADCAST_REALTIME_ERROR_CODES.CONTEXT_CONFLICT));
    return;
  }
  if (envelope.channel !== channel || !CHANNEL_VISIBILITIES[channel].has(envelope.visibility)) {
    applyAdapterError(transport, runtime, transportError(BROADCAST_REALTIME_ERROR_CODES.VISIBILITY_INVALID));
    return;
  }
  const revision = Number(envelope.revision);
  const state = runtime.channelState[channel];
  if (!Number.isInteger(revision) || revision < 0) return;
  if (revision <= state.receivedRevision) {
    if (revision < state.receivedRevision) {
      transport.warnings = uniqueStrings([...transport.warnings, `${channel}-revision-regression-ignored`]);
    } else {
      state.lastReceivedAt = normalizeNow(options.now || envelope.publishedAt);
      state.stale = false;
      transport.lastReceivedAt = state.lastReceivedAt;
    }
    return;
  }
  state.receivedRevision = revision;
  state.lastReceivedAt = normalizeNow(options.now || envelope.publishedAt);
  state.stale = false;
  transport.lastReceivedAt = state.lastReceivedAt;
  transport.updatedAt = state.lastReceivedAt;
  if (runtime.online) transport.status = "connected";
  callback(cloneValue(envelope));
}

function applyAdapterStatus(transport, runtime, status = {}) {
  if (runtime.destroyed) return;
  const now = normalizeNow(status.at);
  if (status.connected === true) {
    const reconnect = transport.connectedAt !== null;
    runtime.online = true;
    updateTransport(transport, {
      status: "connected",
      updatedAt: now,
      connectedAt: transport.connectedAt || now,
      reconnectCount: transport.reconnectCount + (reconnect ? 1 : 0),
      warnings: []
    });
    runtime.config?.onStatus?.(getBroadcastRealtimeStatus(transport, { now }));
    return;
  }
  runtime.online = false;
  Object.values(runtime.channelState).forEach((channel) => { channel.stale = channel.receivedRevision > 0; });
  updateTransport(transport, {
    status: status.offline === true ? "offline" : "stale",
    updatedAt: now,
    disconnectedAt: now,
    warnings: uniqueStrings([...transport.warnings, status.offline === true ? "transport-offline" : "transport-stale"])
  });
  runtime.config?.onStatus?.(getBroadcastRealtimeStatus(transport, { now }));
}

function applyAdapterError(transport, runtime, error) {
  if (runtime.destroyed) return;
  const normalized = normalizeAdapterError(error);
  transport.status = runtime.online ? "stale" : "error";
  transport.errors = uniqueStrings([...transport.errors, normalized.code]);
  transport.updatedAt = normalizeNow();
}

function evaluateStale(transport, runtime, options = {}) {
  if (!runtime.online || !runtime.config || transport.status === "destroyed") return;
  const nowMs = Date.parse(normalizeNow(options.now));
  const staleAfterMs = runtime.config.staleAfterMs;
  let stale = false;
  for (const channel of Object.values(runtime.channelState)) {
    channel.stale = Boolean(channel.lastReceivedAt && nowMs - Date.parse(channel.lastReceivedAt) > staleAfterMs);
    stale ||= channel.stale;
  }
  if (stale) {
    transport.status = "stale";
    transport.warnings = uniqueStrings([...transport.warnings, "transport-data-stale"]);
  }
}

function normalizeConfig(config) {
  if (!isRecord(config)) throw transportError(BROADCAST_REALTIME_ERROR_CODES.CONFIG_INVALID);
  const context = normalizeContext(config.context || config);
  const adapter = config.adapter;
  if (!adapter || !["connect", "subscribe", "publish", "publishOutputState"].every((key) => typeof adapter[key] === "function")) {
    throw transportError(BROADCAST_REALTIME_ERROR_CODES.ADAPTER_INVALID);
  }
  return {
    context,
    sessionPath: `charropro/broadcastStudio/sessions/${context.sessionId}`,
    adapter,
    staleAfterMs: positiveInteger(config.staleAfterMs) || DEFAULT_STALE_AFTER_MS,
    onStatus: typeof config.onStatus === "function" ? config.onStatus : null
  };
}

function normalizeContext(value) {
  const context = {
    tenantId: normalizeId(value?.tenantId),
    organizationId: normalizeOptionalId(value?.organizationId),
    clientId: normalizeOptionalId(value?.clientId),
    tournamentId: normalizeId(value?.tournamentId),
    competitionId: normalizeOptionalId(value?.competitionId),
    activeCharreadaId: normalizeOptionalId(value?.activeCharreadaId || value?.charreadaId),
    sessionId: normalizeId(value?.sessionId)
  };
  if (!context.tenantId || !context.tournamentId || !context.sessionId) {
    throw transportError(BROADCAST_REALTIME_ERROR_CODES.CONTEXT_MISSING, { context });
  }
  return context;
}

function sameContext(expected, actual) {
  if (!isRecord(actual)) return false;
  return ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "activeCharreadaId", "sessionId"]
    .every((key) => (expected[key] ?? null) === (actual[key] ?? null));
}

function normalizeChannel(value) {
  const channel = String(value || "").trim().toLowerCase();
  if (!CHANNELS.has(channel)) throw transportError(BROADCAST_REALTIME_ERROR_CODES.CHANNEL_INVALID);
  return channel;
}

function normalizeVisibility(channel, value) {
  const visibility = String(value || "").trim().toLowerCase();
  if (!CHANNEL_VISIBILITIES[channel].has(visibility)) throw transportError(BROADCAST_REALTIME_ERROR_CODES.VISIBILITY_INVALID);
  return visibility;
}

function normalizeMessageStatus(value) {
  const status = String(value || "ready").trim().toLowerCase();
  return new Set(["ready", "active", "routed", "stale", "offline", "cleared", "disabled", "unavailable", "error"]).has(status) ? status : "ready";
}

function createChannelState() {
  return {
    program: { publishedRevision: 0, receivedRevision: 0, lastPublishedAt: null, lastReceivedAt: null, stale: false },
    announcer: { publishedRevision: 0, receivedRevision: 0, lastPublishedAt: null, lastReceivedAt: null, stale: false }
  };
}

function requireTransport(transport) {
  const runtime = INSTANCES.get(transport);
  if (!runtime || runtime.destroyed) throw transportError(BROADCAST_REALTIME_ERROR_CODES.DESTROYED);
  return runtime;
}

function requireConnectedTransport(transport) {
  const runtime = requireTransport(transport);
  if (!runtime.config) throw transportError(BROADCAST_REALTIME_ERROR_CODES.NOT_CONFIGURED);
  if (!runtime.online) throw transportError(BROADCAST_REALTIME_ERROR_CODES.NOT_CONNECTED);
  return runtime;
}

function assertExpectedRevision(transport, expectedRevision) {
  if (expectedRevision === undefined) return;
  if (Number(expectedRevision) !== transport.revision) {
    throw transportError(BROADCAST_REALTIME_ERROR_CODES.REVISION_CONFLICT, {
      expectedRevision: Number(expectedRevision), actualRevision: transport.revision
    });
  }
}

function updateTransport(transport, patch) {
  Object.assign(transport, patch);
}

function normalizeAdapterError(error) {
  if (error instanceof BroadcastRealtimeTransportError) return error;
  const rawCode = String(error?.code || "");
  if (/permission/i.test(rawCode) || /permission/i.test(error?.message || "")) return transportError(BROADCAST_REALTIME_ERROR_CODES.PERMISSION_DENIED);
  if (/revision/i.test(rawCode)) return transportError(BROADCAST_REALTIME_ERROR_CODES.REVISION_CONFLICT);
  return transportError(rawCode || BROADCAST_REALTIME_ERROR_CODES.INVALID);
}

function transportError(code, details = {}) {
  return new BroadcastRealtimeTransportError(code, details);
}

function safeClone(input, options = {}) {
  const errors = [];
  const seen = new WeakMap();
  let nodes = 0;
  function visit(value, depth, key = "") {
    if (depth > MAX_DEPTH || nodes++ > MAX_OBJECT_KEYS * 4) { errors.push("payload-limit-exceeded"); return undefined; }
    if (value === null || value === undefined || typeof value === "string" || typeof value === "boolean") {
      if (typeof value === "string") {
        if (UNSAFE_PROTOCOL.test(value)) errors.push("unsafe-protocol");
        if (UNSAFE_MARKUP.test(value)) errors.push("unsafe-markup");
        return value.slice(0, MAX_TEXT_LENGTH);
      }
      return value;
    }
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (["function", "symbol", "bigint"].includes(typeof value)) { errors.push("unsupported-value"); return undefined; }
    if (seen.has(value)) { errors.push("cyclic-value"); return undefined; }
    seen.set(value, true);
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_ITEMS) errors.push("array-limit-exceeded");
      return value.slice(0, MAX_ARRAY_ITEMS).map((item) => visit(item, depth + 1)).filter((item) => item !== undefined);
    }
    let descriptors;
    try { descriptors = Object.getOwnPropertyDescriptors(value); }
    catch { errors.push("object-descriptor-unavailable"); return undefined; }
    const entries = Object.entries(descriptors);
    const output = Object.create(null);
    if (entries.length > MAX_OBJECT_KEYS) errors.push("object-limit-exceeded");
    for (const [name, descriptor] of entries.slice(0, MAX_OBJECT_KEYS)) {
      if (DANGEROUS_KEYS.has(name) || PRIVATE_KEYS.test(name)) { if (options.rejectUnsafe) errors.push(`forbidden-key:${name}`); continue; }
      if (typeof descriptor.get === "function" || typeof descriptor.set === "function") {
        errors.push(`accessor-key:${name}`);
        continue;
      }
      const cloned = visit(descriptor.value, depth + 1, name);
      if (cloned !== undefined) output[name] = cloned;
    }
    return output;
  }
  return { value: visit(input, 0), errors: uniqueStrings(errors) };
}

function cloneValue(value) {
  return safeClone(value, { rejectUnsafe: false }).value;
}

function stableStringify(value) {
  return JSON.stringify(sortKeys(cloneValue(value)));
}

function hasPayloadIdentity(value) {
  if (Array.isArray(value)) return value.some(hasPayloadIdentity);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) =>
    PAYLOAD_IDENTITY_KEYS.has(String(key).toLowerCase()) || hasPayloadIdentity(child)
  );
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

function normalizeTemporaryAccessOutputType(value) {
  const outputType = String(value || "").trim().toLowerCase();
  if (!BROADCAST_TEMPORARY_ACCESS_OUTPUT_TYPES.includes(outputType)) {
    throw transportError(BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_INVALID, { outputType });
  }
  return outputType;
}

function generateSecureAccessId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `bca_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
  }
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(bytes);
    return `bca_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  throw transportError(BROADCAST_REALTIME_ERROR_CODES.SECURE_RANDOM_UNAVAILABLE);
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function normalizeNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function compactTimestamp(value) {
  return String(value).replace(/\D/g, "").slice(0, 17);
}

function normalizeId(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(text) ? text : null;
}

function normalizeOptionalId(value) {
  if (value === null || value === undefined || value === "") return null;
  return normalizeId(value);
}

function nonNegativeInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0;
}

function positiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}
