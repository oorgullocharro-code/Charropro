export const PUBLIC_PROJECTION_OUTBOX_VERSION = "1.0.0";
export const PUBLIC_PROJECTION_PAYLOAD_VERSION = 1;
export const PUBLIC_PROJECTION_TYPE = "public_tournament_v2";
export const PUBLIC_PROJECTION_MAX_ATTEMPTS = 5;
export const PUBLIC_PROJECTION_LEASE_MS = 30000;

export const PUBLIC_PROJECTION_STATUSES = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PROJECTED: "PROJECTED",
  CLIENT_CONFIRMED: "CLIENT_CONFIRMED",
  VERIFIED: "VERIFIED",
  RETRY_WAIT: "RETRY_WAIT",
  FAILED: "FAILED",
  DEAD_LETTER: "DEAD_LETTER",
  SUPERSEDED: "SUPERSEDED",
  CANCELLED: "CANCELLED"
});

const STATUS_VALUES = new Set(Object.values(PUBLIC_PROJECTION_STATUSES));
const TERMINAL_STATUSES = new Set([
  PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
  PUBLIC_PROJECTION_STATUSES.VERIFIED,
  PUBLIC_PROJECTION_STATUSES.DEAD_LETTER,
  PUBLIC_PROJECTION_STATUSES.SUPERSEDED,
  PUBLIC_PROJECTION_STATUSES.CANCELLED
]);
const RETRYABLE_ERROR_CODES = new Set([
  "network-error",
  "network-request-failed",
  "timeout",
  "disconnected",
  "unavailable",
  "firebase-unavailable",
  "permission-denied",
  "public-projection-not-verified",
  "public-projection-readback-failed",
  "source-revision-inconsistent",
  "source-revision-regression",
  "transaction-aborted",
  "unknown"
]);
const NON_RETRYABLE_ERROR_CODES = new Set([
  "invalid-public-projection",
  "invalid-projection-intent",
  "missing-projection-source",
  "missing-tournament-data",
  "missing-published-score",
  "projection-source-mismatch",
  "projection-tenant-conflict"
]);
const TRANSITIONS = Object.freeze({
  PENDING: new Set(["PROCESSING", "CANCELLED", "SUPERSEDED"]),
  PROCESSING: new Set(["PROJECTED", "FAILED", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED"]),
  PROJECTED: new Set(["CLIENT_CONFIRMED", "FAILED", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED"]),
  CLIENT_CONFIRMED: new Set(["CLIENT_CONFIRMED", "SUPERSEDED"]),
  VERIFIED: new Set(["VERIFIED", "SUPERSEDED"]),
  RETRY_WAIT: new Set(["PENDING", "PROCESSING", "DEAD_LETTER", "SUPERSEDED", "CANCELLED"]),
  FAILED: new Set(["PENDING", "PROCESSING", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED", "CANCELLED"]),
  DEAD_LETTER: new Set(["PENDING", "DEAD_LETTER", "SUPERSEDED"]),
  SUPERSEDED: new Set(["SUPERSEDED"]),
  CANCELLED: new Set(["CANCELLED"])
});
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const REQUIRED_INTENT_FIELDS = Object.freeze([
  "outboxVersion",
  "payloadVersion",
  "projectionId",
  "idempotencyKey",
  "projectionType",
  "tournamentId",
  "charreadaId",
  "competitionId",
  "sourceType",
  "sourceId",
  "scoreId",
  "attemptKey",
  "sourceRevision",
  "sourceFingerprint",
  "targetPath",
  "createdAt",
  "createdAtMs",
  "createdBy"
]);
const ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,300}$/;
const PATH_ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const MAX_ERROR_LENGTH = 240;
const RETRY_DELAYS_MS = Object.freeze([1000, 5000, 15000, 60000, 300000]);

export function buildPublicProjectionIdentity(input = {}) {
  const tournamentId = normalizeId(input.tournamentId);
  const attemptKey = normalizeText(input.attemptKey, 300);
  const sourceId = normalizeId(input.sourceId || input.publishedScoreId);
  const sourceRevision = positiveInteger(input.sourceRevision || input.revision, 1);
  const projectionType = normalizeId(input.projectionType || PUBLIC_PROJECTION_TYPE);
  if (!tournamentId || !attemptKey || !sourceId || !projectionType) {
    return {
      valid: false,
      projectionId: "",
      idempotencyKey: "",
      canonicalKey: "",
      reason: "projection-identity-incomplete"
    };
  }
  const canonicalKey = stableStringify({
    projectionType,
    tournamentId,
    attemptKey,
    sourceId,
    sourceRevision
  });
  const digest = stableDigest(canonicalKey);
  return {
    valid: true,
    projectionId: `projection_${digest}_${sourceRevision}`,
    idempotencyKey: `projection:${digest}:${sourceRevision}`,
    canonicalKey,
    reason: ""
  };
}

export function buildPublicProjectionIntent(input = {}, options = {}) {
  const identity = buildPublicProjectionIdentity(input);
  if (!identity.valid) return null;
  const createdAtMs = timestampMs(
    input.createdAtMs ||
    input.createdAt ||
    input.publishedAt ||
    options.nowMs ||
    Date.now()
  );
  const createdAt = isoTimestamp(input.createdAt || input.publishedAt, createdAtMs);
  const sourceFingerprint = stableDigest({
    sourceId: input.sourceId || input.publishedScoreId,
    scoreId: input.scoreId,
    attemptKey: input.attemptKey,
    sourceRevision: input.sourceRevision || input.revision,
    publishedAt: input.publishedAt || createdAt,
    total: finiteNumber(input.total, null)
  });
  return normalizePublicProjectionIntent({
    outboxVersion: PUBLIC_PROJECTION_OUTBOX_VERSION,
    payloadVersion: PUBLIC_PROJECTION_PAYLOAD_VERSION,
    projectionId: identity.projectionId,
    idempotencyKey: identity.idempotencyKey,
    projectionType: input.projectionType || PUBLIC_PROJECTION_TYPE,
    tournamentId: input.tournamentId,
    charreadaId: input.charreadaId,
    competitionId: input.competitionId,
    sourceType: input.sourceType || "published_score",
    sourceId: input.sourceId || input.publishedScoreId,
    scoreId: input.scoreId,
    attemptKey: input.attemptKey,
    sourceRevision: input.sourceRevision || input.revision || 1,
    sourceFingerprint,
    targetPath: input.targetPath || `charropro/publicTournaments/${normalizeId(input.tournamentId)}`,
    createdAt,
    createdAtMs,
    createdBy: sanitizeProjectionActor(input.createdBy || input.actor)
  });
}

export function normalizePublicProjectionIntent(input = {}) {
  if (!isPlainRecord(input)) return null;
  if (
    !REQUIRED_INTENT_FIELDS.every((key) => Object.prototype.hasOwnProperty.call(input, key)) ||
    !isPlainRecord(input.createdBy)
  ) {
    return null;
  }
  if (
    input.payloadVersion !== undefined &&
    input.payloadVersion !== PUBLIC_PROJECTION_PAYLOAD_VERSION
  ) {
    return null;
  }
  if (
    input.sourceRevision !== undefined &&
    (!Number.isSafeInteger(input.sourceRevision) || input.sourceRevision < 1)
  ) {
    return null;
  }
  const intent = {
    outboxVersion: normalizeText(input.outboxVersion || PUBLIC_PROJECTION_OUTBOX_VERSION, 20),
    payloadVersion: positiveInteger(input.payloadVersion, PUBLIC_PROJECTION_PAYLOAD_VERSION),
    projectionId: normalizePathId(input.projectionId),
    idempotencyKey: normalizeText(input.idempotencyKey, 180),
    projectionType: normalizeId(input.projectionType || PUBLIC_PROJECTION_TYPE),
    tournamentId: normalizeId(input.tournamentId),
    charreadaId: normalizeId(input.charreadaId),
    competitionId: normalizeId(input.competitionId),
    sourceType: normalizeId(input.sourceType || "published_score"),
    sourceId: normalizeId(input.sourceId),
    scoreId: normalizeId(input.scoreId),
    attemptKey: normalizeText(input.attemptKey, 300),
    sourceRevision: positiveInteger(input.sourceRevision, 1),
    sourceFingerprint: normalizeText(input.sourceFingerprint, 80),
    targetPath: normalizeTargetPath(input.targetPath),
    createdAt: isoTimestamp(input.createdAt, timestampMs(input.createdAtMs)),
    createdAtMs: timestampMs(input.createdAtMs || input.createdAt),
    createdBy: sanitizeProjectionActor(input.createdBy)
  };
  const validation = validatePublicProjectionIntent(intent);
  return validation.valid ? intent : null;
}

export function validatePublicProjectionIntent(input = {}) {
  const errors = [];
  if (!isPlainRecord(input)) {
    return { valid: false, errors: ["projection-intent-object-required"] };
  }
  if (input.outboxVersion !== PUBLIC_PROJECTION_OUTBOX_VERSION) errors.push("projection-outbox-version-invalid");
  if (input.payloadVersion !== PUBLIC_PROJECTION_PAYLOAD_VERSION) errors.push("projection-payload-version-invalid");
  if (!PATH_ID_PATTERN.test(String(input.projectionId || ""))) errors.push("projection-id-invalid");
  if (!normalizeText(input.idempotencyKey, 180)) errors.push("projection-idempotency-key-required");
  if (input.projectionType !== PUBLIC_PROJECTION_TYPE) errors.push("projection-type-invalid");
  for (const key of ["tournamentId", "sourceType", "sourceId", "scoreId"]) {
    if (!normalizeId(input[key])) errors.push(`projection-${key}-invalid`);
  }
  if (!normalizeText(input.attemptKey, 300)) errors.push("projection-attempt-key-required");
  if (!Number.isSafeInteger(input.sourceRevision) || input.sourceRevision < 1) {
    errors.push("projection-source-revision-invalid");
  }
  if (input.targetPath !== `charropro/publicTournaments/${normalizeId(input.tournamentId)}`) {
    errors.push("projection-target-path-invalid");
  }
  if (!normalizeText(input.sourceFingerprint, 80)) errors.push("projection-source-fingerprint-required");
  if (!timestampMs(input.createdAt) || !timestampMs(input.createdAtMs)) errors.push("projection-created-at-invalid");
  if (!isPlainRecord(input.createdBy)) errors.push("projection-created-by-invalid");
  if (containsDangerousKey(input)) errors.push("projection-intent-dangerous-key");
  const identity = buildPublicProjectionIdentity(input);
  if (
    !identity.valid ||
    identity.projectionId !== input.projectionId ||
    identity.idempotencyKey !== input.idempotencyKey
  ) {
    errors.push("projection-identity-mismatch");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function normalizePublicProjectionState(input = {}, intent = null) {
  const status = STATUS_VALUES.has(input?.status)
    ? input.status
    : PUBLIC_PROJECTION_STATUSES.PENDING;
  return {
    status,
    attempts: nonNegativeInteger(input?.attempts, 0),
    updatedAt: isoTimestamp(input?.updatedAt, timestampMs(input?.updatedAtMs)),
    updatedAtMs: timestampMs(input?.updatedAtMs || input?.updatedAt),
    nextRetryAt: isoTimestamp(input?.nextRetryAt, timestampMs(input?.nextRetryAtMs), ""),
    nextRetryAtMs: timestampMs(input?.nextRetryAtMs || input?.nextRetryAt),
    lastAttemptAt: isoTimestamp(input?.lastAttemptAt, timestampMs(input?.lastAttemptAtMs), ""),
    lastAttemptAtMs: timestampMs(input?.lastAttemptAtMs || input?.lastAttemptAt),
    lastErrorCode: sanitizeProjectionErrorCode(input?.lastErrorCode),
    lastErrorMessage: sanitizeProjectionErrorMessage(input?.lastErrorMessage),
    projectedAt: isoTimestamp(input?.projectedAt, 0, ""),
    clientConfirmedAt: isoTimestamp(input?.clientConfirmedAt, 0, ""),
    verifiedAt: isoTimestamp(input?.verifiedAt, 0, ""),
    targetRevision: nonNegativeInteger(input?.targetRevision, 0),
    targetFingerprint: normalizeText(input?.targetFingerprint, 80),
    leaseOwner: normalizeText(input?.leaseOwner, 180),
    leaseExpiresAtMs: timestampMs(input?.leaseExpiresAtMs),
    supersededBy: normalizePathId(input?.supersededBy),
    deadLetterReason: sanitizeProjectionErrorCode(input?.deadLetterReason),
    cancelledReason: sanitizeProjectionErrorMessage(input?.cancelledReason),
    cancelledAt: isoTimestamp(input?.cancelledAt, 0, ""),
    updatedBy: sanitizeProjectionActor(input?.updatedBy),
    lastAttemptBy: sanitizeProjectionActor(input?.lastAttemptBy),
    claimedBy: sanitizeProjectionActor(input?.claimedBy),
    retriedBy: sanitizeProjectionActor(input?.retriedBy),
    cancelledBy: sanitizeProjectionActor(input?.cancelledBy),
    sourceRevision: positiveInteger(input?.sourceRevision || intent?.sourceRevision, 1)
  };
}

export function buildPublicProjectionState(status, previous = {}, patch = {}, options = {}) {
  const current = normalizePublicProjectionState(previous);
  const nextStatus = STATUS_VALUES.has(status) ? status : current.status;
  if (!canTransitionPublicProjection(current.status, nextStatus, options)) return null;
  const nowMs = timestampMs(options.nowMs) || Date.now();
  const next = normalizePublicProjectionState({
    ...current,
    ...sanitizeStatePatch(patch),
    status: nextStatus,
    updatedAt: new Date(nowMs).toISOString(),
    updatedAtMs: nowMs
  });
  if (nextStatus !== PUBLIC_PROJECTION_STATUSES.PROCESSING) {
    next.leaseOwner = "";
    next.leaseExpiresAtMs = 0;
  }
  if ([
    PUBLIC_PROJECTION_STATUSES.PENDING,
    PUBLIC_PROJECTION_STATUSES.PROCESSING,
    PUBLIC_PROJECTION_STATUSES.PROJECTED,
    PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
    PUBLIC_PROJECTION_STATUSES.VERIFIED
  ].includes(nextStatus)) {
    next.deadLetterReason = "";
  }
  if (nextStatus === PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED) {
    next.clientConfirmedAt = next.clientConfirmedAt || new Date(nowMs).toISOString();
    next.nextRetryAt = "";
    next.nextRetryAtMs = 0;
    next.lastErrorCode = "";
    next.lastErrorMessage = "";
  }
  if (nextStatus === PUBLIC_PROJECTION_STATUSES.VERIFIED) {
    next.verifiedAt = next.verifiedAt || new Date(nowMs).toISOString();
    next.nextRetryAt = "";
    next.nextRetryAtMs = 0;
    next.lastErrorCode = "";
    next.lastErrorMessage = "";
  }
  return next;
}

export function canTransitionPublicProjection(fromStatus, toStatus, options = {}) {
  const from = STATUS_VALUES.has(fromStatus) ? fromStatus : PUBLIC_PROJECTION_STATUSES.PENDING;
  if (!STATUS_VALUES.has(toStatus)) return false;
  if (toStatus === PUBLIC_PROJECTION_STATUSES.VERIFIED) {
    return options.authority === "trusted-server" &&
      ![PUBLIC_PROJECTION_STATUSES.CANCELLED, PUBLIC_PROJECTION_STATUSES.SUPERSEDED].includes(from);
  }
  if (from === toStatus) return true;
  if (options.force === true && [PUBLIC_PROJECTION_STATUSES.PENDING, PUBLIC_PROJECTION_STATUSES.SUPERSEDED].includes(toStatus)) {
    return from !== PUBLIC_PROJECTION_STATUSES.CANCELLED;
  }
  return TRANSITIONS[from]?.has(toStatus) || false;
}

export function claimPublicProjectionState(previous = {}, options = {}) {
  const current = normalizePublicProjectionState(previous);
  const nowMs = timestampMs(options.nowMs) || Date.now();
  const manual = options.manual === true;
  if (TERMINAL_STATUSES.has(current.status)) return null;
  if (
    current.status === PUBLIC_PROJECTION_STATUSES.PROCESSING &&
    current.leaseExpiresAtMs > nowMs
  ) {
    return null;
  }
  if (
    current.status === PUBLIC_PROJECTION_STATUSES.RETRY_WAIT &&
    current.nextRetryAtMs > nowMs &&
    !manual
  ) {
    return null;
  }
  if (current.attempts >= positiveInteger(options.maxAttempts, PUBLIC_PROJECTION_MAX_ATTEMPTS) && !manual) {
    return buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.DEAD_LETTER, current, {
      deadLetterReason: current.lastErrorCode || "attempts-exhausted"
    }, { nowMs });
  }
  return buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.PROCESSING, current, {
    attempts: current.attempts + 1,
    lastAttemptAt: new Date(nowMs).toISOString(),
    lastAttemptAtMs: nowMs,
    leaseOwner: normalizeText(options.leaseOwner, 180),
    leaseExpiresAtMs: nowMs + positiveInteger(options.leaseMs, PUBLIC_PROJECTION_LEASE_MS),
    updatedBy: sanitizeProjectionActor(options.actor),
    lastAttemptBy: sanitizeProjectionActor(options.actor),
    claimedBy: sanitizeProjectionActor(options.actor),
    nextRetryAt: "",
    nextRetryAtMs: 0
  }, { nowMs });
}

export function buildPublicProjectionFailureState(previous = {}, error = {}, options = {}) {
  const current = normalizePublicProjectionState(previous);
  const classification = classifyPublicProjectionError(error);
  const nowMs = timestampMs(options.nowMs) || Date.now();
  const maxAttempts = positiveInteger(options.maxAttempts, PUBLIC_PROJECTION_MAX_ATTEMPTS);
  const exhausted = current.attempts >= maxAttempts;
  const status = !classification.retryable || exhausted
    ? PUBLIC_PROJECTION_STATUSES.DEAD_LETTER
    : PUBLIC_PROJECTION_STATUSES.RETRY_WAIT;
  const delayMs = status === PUBLIC_PROJECTION_STATUSES.RETRY_WAIT
    ? getPublicProjectionRetryDelay(current.attempts, {
      jitter: options.jitter !== false,
      seed: options.seed || current.attempts
    })
    : 0;
  return buildPublicProjectionState(status, current, {
    lastErrorCode: classification.code,
    lastErrorMessage: classification.message,
    nextRetryAt: delayMs ? new Date(nowMs + delayMs).toISOString() : "",
    nextRetryAtMs: delayMs ? nowMs + delayMs : 0,
    deadLetterReason: status === PUBLIC_PROJECTION_STATUSES.DEAD_LETTER
      ? classification.code
      : "",
    updatedBy: sanitizeProjectionActor(options.actor)
  }, { nowMs });
}

export function classifyPublicProjectionError(error = {}) {
  const rawCode = normalizeErrorCode(
    error.code ||
    error.reason ||
    error.errorCode ||
    error.name ||
    "unknown"
  );
  const code = NON_RETRYABLE_ERROR_CODES.has(rawCode) || RETRYABLE_ERROR_CODES.has(rawCode)
    ? rawCode
    : inferErrorCode(`${rawCode} ${error.message || error.errorMessage || ""}`);
  return {
    code,
    retryable: !NON_RETRYABLE_ERROR_CODES.has(code),
    message: sanitizeProjectionErrorMessage(
      error.errorMessage ||
      error.message ||
      publicProjectionErrorLabel(code)
    )
  };
}

export function getPublicProjectionRetryDelay(attempts, options = {}) {
  const index = Math.max(0, Math.min(RETRY_DELAYS_MS.length - 1, nonNegativeInteger(attempts, 1) - 1));
  const base = RETRY_DELAYS_MS[index];
  if (options.jitter === false) return base;
  const ratio = (parseInt(stableDigest(options.seed || attempts).slice(0, 4), 16) % 21) / 100;
  return Math.round(base * (0.9 + ratio));
}

export function normalizePublicProjectionJob(input = {}) {
  const intent = normalizePublicProjectionIntent(input.intent || input);
  if (!intent) return null;
  return {
    projectionId: intent.projectionId,
    intent,
    state: normalizePublicProjectionState(input.state || {}, intent)
  };
}

export function comparePublicProjectionJobs(leftInput, rightInput) {
  const left = normalizePublicProjectionJob(leftInput);
  const right = normalizePublicProjectionJob(rightInput);
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;
  return (
    left.intent.sourceRevision - right.intent.sourceRevision ||
    left.intent.createdAtMs - right.intent.createdAtMs ||
    left.intent.sourceId.localeCompare(right.intent.sourceId)
  );
}

export function isPublicProjectionJobEligible(input = {}, options = {}) {
  const job = normalizePublicProjectionJob(input);
  if (!job || TERMINAL_STATUSES.has(job.state.status)) return false;
  const nowMs = timestampMs(options.nowMs) || Date.now();
  if (
    job.state.status === PUBLIC_PROJECTION_STATUSES.PROCESSING &&
    job.state.leaseExpiresAtMs > nowMs
  ) {
    return false;
  }
  if (
    job.state.status === PUBLIC_PROJECTION_STATUSES.RETRY_WAIT &&
    job.state.nextRetryAtMs > nowMs &&
    options.manual !== true
  ) {
    return false;
  }
  return true;
}

export function buildPublicProjectionOutboxSnapshot(value = {}, options = {}) {
  const jobs = collection(value)
    .map(normalizePublicProjectionJob)
    .filter(Boolean)
    .sort((left, right) => right.intent.createdAtMs - left.intent.createdAtMs);
  const counts = Object.fromEntries(Object.values(PUBLIC_PROJECTION_STATUSES).map((status) => [status, 0]));
  for (const job of jobs) counts[job.state.status] += 1;
  const nowMs = timestampMs(options.nowMs) || Date.now();
  return {
    outboxVersion: PUBLIC_PROJECTION_OUTBOX_VERSION,
    tournamentId: normalizeId(options.tournamentId || jobs[0]?.intent.tournamentId),
    total: jobs.length,
    pending: counts.PENDING + counts.PROCESSING + counts.PROJECTED,
    retry: counts.RETRY_WAIT + counts.FAILED,
    deadLetter: counts.DEAD_LETTER,
    clientConfirmed: counts.CLIENT_CONFIRMED,
    verified: counts.VERIFIED,
    counts,
    oldestPendingAgeMs: jobs
      .filter((job) => !TERMINAL_STATUSES.has(job.state.status))
      .reduce((oldest, job) => Math.max(oldest, nowMs - job.intent.createdAtMs), 0),
    jobs
  };
}

export function sanitizeProjectionActor(input = {}) {
  if (!isPlainRecord(input)) return { uid: "", name: "", role: "", clientId: "" };
  return {
    uid: normalizeText(input.uid || input.id, 180),
    name: normalizeText(input.name, 180),
    role: normalizeText(input.role, 60).toLowerCase(),
    clientId: normalizeText(input.clientId, 180)
  };
}

export function sanitizeProjectionErrorCode(value) {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  return normalizeErrorCode(value).slice(0, 100);
}

export function sanitizeProjectionErrorMessage(value) {
  return normalizeText(value, MAX_ERROR_LENGTH)
    .replace(/\b(?:api[-_ ]?key|token|password|secret|credential|authorization|cookie|private[-_ ]?key)\b[^ ]*/gi, "[redacted]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(?:file|javascript|vbscript|data):\S*/gi, "[blocked]")
    .slice(0, MAX_ERROR_LENGTH);
}

export function isPublicProjectionTerminalStatus(status) {
  return TERMINAL_STATUSES.has(status);
}

function sanitizeStatePatch(input = {}) {
  if (!isPlainRecord(input)) return {};
  const output = {};
  const allowed = new Set([
    "attempts",
    "nextRetryAt",
    "nextRetryAtMs",
    "lastAttemptAt",
    "lastAttemptAtMs",
    "lastErrorCode",
    "lastErrorMessage",
    "projectedAt",
    "clientConfirmedAt",
    "verifiedAt",
    "targetRevision",
    "targetFingerprint",
    "leaseOwner",
    "leaseExpiresAtMs",
    "supersededBy",
    "deadLetterReason",
    "cancelledReason",
    "cancelledAt",
    "updatedBy",
    "lastAttemptBy",
    "claimedBy",
    "retriedBy",
    "cancelledBy",
    "sourceRevision"
  ]);
  for (const key of Object.keys(input)) {
    if (allowed.has(key) && !DANGEROUS_KEYS.has(key)) output[key] = input[key];
  }
  return output;
}

function normalizeTargetPath(value) {
  const clean = normalizeText(value, 300).replace(/^\/+|\/+$/g, "");
  return /^charropro\/publicTournaments\/[A-Za-z0-9._:@/-]{1,180}$/.test(clean) ? clean : "";
}

function inferErrorCode(value) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("permission")) return "permission-denied";
  if (raw.includes("timeout") || raw.includes("deadline")) return "timeout";
  if (raw.includes("disconnect") || raw.includes("offline")) return "disconnected";
  if (raw.includes("network")) return "network-error";
  if (raw.includes("unavailable")) return "unavailable";
  if (raw.includes("missing") && raw.includes("source")) return "missing-projection-source";
  if (raw.includes("invalid") && raw.includes("projection")) return "invalid-public-projection";
  if (raw.includes("regression")) return "source-revision-regression";
  if (raw.includes("inconsistent")) return "source-revision-inconsistent";
  return "unknown";
}

function publicProjectionErrorLabel(code) {
  const labels = {
    "permission-denied": "Firebase rechazó temporalmente la proyección pública.",
    timeout: "La verificación de la proyección excedió el tiempo disponible.",
    disconnected: "No hay conexión para completar la proyección pública.",
    unavailable: "Firebase no está disponible para la proyección pública.",
    "missing-projection-source": "No existe la fuente oficial requerida.",
    "invalid-public-projection": "La proyección pública no cumple el contrato.",
    "public-projection-not-verified": "La proyección pública no pudo verificarse."
  };
  return labels[code] || "No se pudo completar la proyección pública.";
}

function normalizeErrorCode(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/^firebase[:/_-]*/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function normalizeId(value) {
  const clean = normalizeText(value, 300);
  return ID_PATTERN.test(clean) ? clean : "";
}

function normalizePathId(value) {
  const clean = normalizeText(value, 180);
  return PATH_ID_PATTERN.test(clean) ? clean : "";
}

function normalizeText(value, maxLength = 300) {
  if (value === null || value === undefined) return "";
  if (!["string", "number", "boolean"].includes(typeof value)) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function finiteNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

function timestampMs(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.trunc(value);
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isoTimestamp(value, fallbackMs = 0, emptyValue = "") {
  const ms = timestampMs(value) || timestampMs(fallbackMs);
  return ms ? new Date(ms).toISOString() : emptyValue;
}

function stableDigest(value) {
  const text = typeof value === "string" ? value : stableStringify(value);
  let left = 2166136261;
  let right = 2246822507;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    left ^= code;
    left = Math.imul(left, 16777619);
    right ^= code + index;
    right = Math.imul(right, 3266489909);
  }
  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value, seen = new WeakSet(), depth = 0) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol" || value === undefined) return "null";
  if (depth > 10 || typeof value !== "object" || seen.has(value)) return "null";
  seen.add(value);
  if (Array.isArray(value)) {
    const output = `[${value.slice(0, 500).map((item) => stableStringify(item, seen, depth + 1)).join(",")}]`;
    seen.delete(value);
    return output;
  }
  const entries = [];
  for (const key of Object.keys(value).sort().slice(0, 300)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) continue;
    entries.push(`${JSON.stringify(key)}:${stableStringify(descriptor.value, seen, depth + 1)}`);
  }
  seen.delete(value);
  return `{${entries.join(",")}}`;
}

function collection(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (isPlainRecord(value)) return Object.values(value).filter(Boolean);
  return [];
}

function containsDangerousKey(value, seen = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  if (depth > 12) return true;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) return true;
    if (containsDangerousKey(descriptor.value, seen, depth + 1)) return true;
  }
  return false;
}

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
