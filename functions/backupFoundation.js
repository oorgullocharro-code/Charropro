"use strict";

const { createHash } = require("node:crypto");

const BACKUP_FOUNDATION_VERSION = "1.0.0";
const BACKUP_SCHEMA_VERSION = "charropro-backup/1";
const BACKUP_ARCHIVE_VERSION = 1;
const BACKUP_SCOPES = Object.freeze({
  TOURNAMENT: "tournament",
  ORGANIZATION: "organization",
  SYSTEM: "system"
});
const BACKUP_MODES = Object.freeze({
  MANUAL: "manual",
  AUTOMATIC: "automatic"
});
const BACKUP_TYPES = Object.freeze({
  FULL: "full"
});
const BACKUP_STATUSES = Object.freeze({
  REQUESTED: "REQUESTED",
  CAPTURING: "CAPTURING",
  UPLOADING: "UPLOADING",
  VALIDATING: "VALIDATING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED"
});
const BACKUP_AUDIT_OPERATIONS = Object.freeze({
  REQUESTED: "BACKUP_REQUESTED",
  STARTED: "BACKUP_STARTED",
  COMPLETED: "BACKUP_COMPLETED",
  FAILED: "BACKUP_FAILED",
  CANCELLED: "BACKUP_CANCELLED",
  VALIDATED: "BACKUP_VALIDATED",
  EXPIRED: "BACKUP_EXPIRED"
});
const TERMINAL_JOB_STATUSES = new Set([
  BACKUP_STATUSES.COMPLETED,
  BACKUP_STATUSES.FAILED,
  BACKUP_STATUSES.CANCELLED,
  BACKUP_STATUSES.EXPIRED
]);
const MANUAL_BACKUP_ROLES = new Set(["supervisor", "operador"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:@/-]{12,180}$/;
const DEFAULT_LEASE_MS = 15 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_RETENTION_COUNT = 30;
const DEFAULT_MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;

class BackupFoundationError extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = "BackupFoundationError";
    this.code = code;
    this.details = details;
  }
}

function prepareBackupRequest(input = {}, actor = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const timestamp = new Date(nowMs).toISOString();
  const cleanActor = normalizeBackupActor(actor);
  const mode = normalizeEnum(input.mode, Object.values(BACKUP_MODES), BACKUP_MODES.MANUAL);
  const scopeType = normalizeEnum(input.scopeType, Object.values(BACKUP_SCOPES), "");
  const backupType = normalizeEnum(input.backupType, Object.values(BACKUP_TYPES), "");
  const tournamentId = normalizeId(input.tournamentId);
  const actorOrganizationId = normalizeId(cleanActor.organizationId);
  const requestedOrganizationId = normalizeId(input.organizationId);
  const organizationId = requestedOrganizationId || actorOrganizationId;
  const tenantId = normalizeId(cleanActor.tenantId);
  const idempotencyKey = normalizeText(input.idempotencyKey, 180);
  const errors = [];

  if (!scopeType) errors.push("backup-scope-invalid");
  if (!backupType) errors.push(input.backupType === "incremental" ? "backup-incremental-not-supported" : "backup-type-invalid");
  if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) errors.push("backup-idempotency-invalid");
  if (!cleanActor.uid) errors.push("backup-auth-required");
  if (mode === BACKUP_MODES.MANUAL && !MANUAL_BACKUP_ROLES.has(cleanActor.role)) errors.push("backup-role-denied");
  if (mode === BACKUP_MODES.AUTOMATIC && cleanActor.role !== "system") errors.push("backup-automatic-authority-required");
  if (scopeType === BACKUP_SCOPES.TOURNAMENT && !tournamentId) errors.push("backup-tournament-required");
  if (scopeType === BACKUP_SCOPES.ORGANIZATION && !organizationId) errors.push("backup-organization-required");
  if (scopeType === BACKUP_SCOPES.ORGANIZATION && mode === BACKUP_MODES.MANUAL && cleanActor.role !== "supervisor") {
    errors.push("backup-organization-role-denied");
  }
  if (scopeType === BACKUP_SCOPES.SYSTEM && cleanActor.platformAdmin !== true && cleanActor.role !== "system") {
    errors.push("backup-system-authority-required");
  }
  if (requestedOrganizationId && actorOrganizationId && requestedOrganizationId !== actorOrganizationId && cleanActor.platformAdmin !== true) {
    errors.push("backup-organization-mismatch");
  }

  if (errors.length) return { valid: false, errors: uniqueStrings(errors) };

  const scopeId = scopeType === BACKUP_SCOPES.TOURNAMENT
    ? tournamentId
    : scopeType === BACKUP_SCOPES.ORGANIZATION
      ? organizationId
      : "system";
  const scopeKey = `scope_${sha256(`${tenantId || "legacy"}|${organizationId || "unassigned"}|${scopeType}|${scopeId}`).slice(0, 40)}`;
  const requestId = `request_${sha256(idempotencyKey).slice(0, 40)}`;
  const backupId = `backup_${sha256(`${scopeKey}|${idempotencyKey}`).slice(0, 40)}`;
  const retentionDays = boundedInteger(input.retentionDays, 1, 3650, DEFAULT_RETENTION_DAYS);
  const retentionCount = boundedInteger(input.retentionCount, 1, 1000, DEFAULT_RETENTION_COUNT);
  const request = {
    backupFoundationVersion: BACKUP_FOUNDATION_VERSION,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    archiveVersion: BACKUP_ARCHIVE_VERSION,
    backupId,
    requestId,
    requestFingerprint: "",
    idempotencyKey,
    backupType,
    mode,
    scopeType,
    scopeId,
    scopeKey,
    tenantId,
    organizationId,
    tournamentId,
    actor: cleanActor,
    source: mode === BACKUP_MODES.AUTOMATIC ? "backup-scheduler" : "backup-api",
    reason: normalizeText(input.reason, 240),
    requestedAt: timestamp,
    requestedAtMs: nowMs,
    leaseExpiresAt: new Date(nowMs + DEFAULT_LEASE_MS).toISOString(),
    leaseExpiresAtMs: nowMs + DEFAULT_LEASE_MS,
    retention: {
      days: retentionDays,
      count: retentionCount,
      expiresAt: new Date(nowMs + retentionDays * 24 * 60 * 60 * 1000).toISOString(),
      expiresAtMs: nowMs + retentionDays * 24 * 60 * 60 * 1000
    }
  };
  request.requestFingerprint = sha256(stableStringify({
    idempotencyKey: request.idempotencyKey,
    backupType: request.backupType,
    mode: request.mode,
    scopeType: request.scopeType,
    scopeId: request.scopeId,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    tournamentId: request.tournamentId,
    actorUid: request.actor.uid
  }));
  return { valid: true, request, errors: [] };
}

function authorizeBackupRequest(request = {}, context = {}) {
  if (!request.backupId || !request.actor?.uid) return denied("backup-request-invalid");
  if (request.mode === BACKUP_MODES.AUTOMATIC) {
    return request.actor.role === "system" ? allowed() : denied("backup-automatic-authority-required");
  }
  if (!MANUAL_BACKUP_ROLES.has(request.actor.role)) return denied("backup-role-denied");
  if (request.scopeType === BACKUP_SCOPES.SYSTEM) {
    return request.actor.platformAdmin === true ? allowed() : denied("backup-system-authority-required");
  }
  if (request.scopeType === BACKUP_SCOPES.ORGANIZATION) {
    if (request.actor.role !== "supervisor") return denied("backup-organization-role-denied");
    if (request.actor.organizationId && request.actor.organizationId !== request.organizationId && request.actor.platformAdmin !== true) {
      return denied("backup-organization-mismatch");
    }
    return allowed();
  }
  const tournament = plainObject(context.tournament);
  const info = plainObject(tournament.info);
  if (!info.id || info.id !== request.tournamentId) return denied("backup-tournament-not-found");
  if (context.hasTournamentAccess !== true && request.actor.role !== "supervisor") {
    return denied("backup-tournament-access-denied");
  }
  const tenantId = normalizeId(info.tenantId || tournament.meta?.tenantId);
  const organizationId = normalizeId(info.organizationId || tournament.meta?.organizationId);
  if (tenantId && tenantId !== request.actor.tenantId) return denied("backup-tenant-mismatch");
  if (organizationId && organizationId !== request.actor.organizationId && request.actor.platformAdmin !== true) {
    return denied("backup-organization-mismatch");
  }
  return allowed();
}

function applyBackupClaim(currentControl = {}, request = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || request.requestedAtMs || Date.now());
  const control = cloneBackupValue(currentControl, { maxNodes: 100000 });
  control.controlVersion = BACKUP_FOUNDATION_VERSION;
  control.idempotency = plainObject(control.idempotency);
  control.jobs = plainObject(control.jobs);
  control.lock = plainObject(control.lock);
  const existingRequest = plainObject(control.idempotency[request.requestId]);

  if (existingRequest.idempotencyKey) {
    if (existingRequest.requestFingerprint !== request.requestFingerprint) {
      return {
        control,
        outcome: { ok: false, conflict: true, idempotent: false, reason: "backup-idempotency-conflict" }
      };
    }
    return {
      control,
      outcome: {
        ok: true,
        conflict: false,
        idempotent: true,
        reason: "backup-request-already-claimed",
        backupId: existingRequest.backupId,
        job: cloneBackupValue(control.jobs[existingRequest.backupId] || null)
      }
    };
  }

  const activeLock = control.lock.backupId && Number(control.lock.leaseExpiresAtMs || 0) > nowMs;
  if (activeLock) {
    return {
      control,
      outcome: {
        ok: false,
        conflict: true,
        idempotent: false,
        reason: "backup-scope-busy",
        activeBackupId: control.lock.backupId
      }
    };
  }

  let expiredJob = null;
  if (control.lock.backupId && control.jobs[control.lock.backupId] && !TERMINAL_JOB_STATUSES.has(control.jobs[control.lock.backupId].status)) {
    const staleJob = control.jobs[control.lock.backupId];
    expiredJob = {
      ...staleJob,
      status: BACKUP_STATUSES.FAILED,
      revision: nonNegativeInteger(staleJob.revision, 0) + 1,
      result: "FAILED",
      reason: "backup-lease-expired",
      lastError: "backup-lease-expired",
      updatedAt: new Date(nowMs).toISOString(),
      updatedAtMs: nowMs,
      completedAt: new Date(nowMs).toISOString(),
      completedAtMs: nowMs,
      durationMs: Math.max(0, nowMs - Number(staleJob.startedAtMs || staleJob.requestedAtMs || nowMs))
    };
    control.jobs[control.lock.backupId] = expiredJob;
  }

  const job = {
    jobVersion: BACKUP_FOUNDATION_VERSION,
    backupId: request.backupId,
    requestId: request.requestId,
    requestFingerprint: request.requestFingerprint,
    idempotencyKey: request.idempotencyKey,
    backupType: request.backupType,
    mode: request.mode,
    scopeType: request.scopeType,
    scopeId: request.scopeId,
    scopeKey: request.scopeKey,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    tournamentId: request.tournamentId,
    actor: request.actor,
    source: request.source,
    reason: request.reason,
    retention: request.retention,
    status: BACKUP_STATUSES.REQUESTED,
    revision: 1,
    result: "PENDING",
    cancellationRequested: false,
    cancellationRequestedAt: "",
    cancellationRequestedAtMs: 0,
    cancellationRequestedBy: null,
    requestedAt: request.requestedAt,
    requestedAtMs: request.requestedAtMs,
    updatedAt: request.requestedAt,
    updatedAtMs: request.requestedAtMs,
    startedAt: "",
    startedAtMs: 0,
    completedAt: "",
    completedAtMs: 0,
    durationMs: 0,
    storageRef: "",
    archiveChecksum: "",
    archiveSizeBytes: 0,
    lastError: ""
  };
  control.jobs[request.backupId] = job;
  control.idempotency[request.requestId] = {
    idempotencyKey: request.idempotencyKey,
    requestFingerprint: request.requestFingerprint,
    backupId: request.backupId,
    createdAt: request.requestedAt,
    createdAtMs: request.requestedAtMs,
    actorUid: request.actor.uid
  };
  control.lock = {
    backupId: request.backupId,
    acquiredAt: request.requestedAt,
    acquiredAtMs: request.requestedAtMs,
    leaseExpiresAt: request.leaseExpiresAt,
    leaseExpiresAtMs: request.leaseExpiresAtMs
  };
  return {
    control,
    outcome: {
      ok: true,
      conflict: false,
      idempotent: false,
      reason: "backup-request-claimed",
      backupId: request.backupId,
      expiredJob: cloneBackupValue(expiredJob),
      job: cloneBackupValue(job)
    }
  };
}

function requestBackupCancellation(currentControl = {}, backupId = "", actor = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const timestamp = new Date(nowMs).toISOString();
  const control = cloneBackupValue(currentControl, { maxNodes: 100000 });
  control.jobs = plainObject(control.jobs);
  const job = plainObject(control.jobs[backupId]);
  const cleanActor = normalizeBackupActor(actor);
  if (!job.backupId) return { control, outcome: { ok: false, reason: "backup-job-not-found" } };
  if (TERMINAL_JOB_STATUSES.has(job.status)) {
    return { control, outcome: { ok: true, idempotent: true, reason: "backup-job-already-terminal", job } };
  }
  if (job.status === BACKUP_STATUSES.UPLOADING || job.status === BACKUP_STATUSES.VALIDATING) {
    return { control, outcome: { ok: false, reason: "backup-cancellation-too-late", job } };
  }
  const tenantMatches = !job.tenantId || cleanActor.tenantId === job.tenantId;
  const organizationMatches = !job.organizationId || cleanActor.organizationId === job.organizationId;
  const sameScope = cleanActor.platformAdmin === true || (tenantMatches && organizationMatches);
  const authorized = cleanActor.uid && sameScope && (
    cleanActor.uid === job.actor?.uid
    || cleanActor.role === "supervisor"
    || cleanActor.platformAdmin === true
  );
  if (!authorized) return { control, outcome: { ok: false, reason: "backup-cancellation-denied", job } };
  if (job.cancellationRequested === true) {
    return { control, outcome: { ok: true, idempotent: true, reason: "backup-cancellation-already-requested", job } };
  }
  const nextJob = {
    ...job,
    cancellationRequested: true,
    cancellationRequestedAt: timestamp,
    cancellationRequestedAtMs: nowMs,
    cancellationRequestedBy: cleanActor,
    revision: nonNegativeInteger(job.revision, 0) + 1,
    updatedAt: timestamp,
    updatedAtMs: nowMs
  };
  control.jobs[backupId] = nextJob;
  return { control, outcome: { ok: true, idempotent: false, reason: "backup-cancellation-requested", job: nextJob } };
}

function applyBackupJobTransition(currentControl = {}, backupId = "", transition = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const timestamp = new Date(nowMs).toISOString();
  const control = cloneBackupValue(currentControl, { maxNodes: 100000 });
  control.jobs = plainObject(control.jobs);
  const job = plainObject(control.jobs[backupId]);
  if (!job.backupId) return { control, outcome: { ok: false, reason: "backup-job-not-found" } };
  if (!TERMINAL_JOB_STATUSES.has(job.status) && control.lock?.backupId !== backupId) {
    return { control, outcome: { ok: false, conflict: true, reason: "backup-job-lock-lost", job } };
  }
  const expectedRevision = nonNegativeInteger(transition.expectedRevision, -1);
  if (expectedRevision >= 0 && expectedRevision !== nonNegativeInteger(job.revision, 0)) {
    return { control, outcome: { ok: false, conflict: true, reason: "backup-job-revision-conflict", job } };
  }
  const requestedStatus = String(transition.status || "").trim().toUpperCase();
  const nextStatus = Object.values(BACKUP_STATUSES).includes(requestedStatus) ? requestedStatus : "";
  if (!isValidJobTransition(job.status, nextStatus, job.cancellationRequested === true)) {
    return { control, outcome: { ok: false, reason: "backup-job-transition-invalid", job } };
  }
  const next = {
    ...job,
    ...sanitizeTransitionPatch(transition.patch),
    status: nextStatus,
    revision: nonNegativeInteger(job.revision, 0) + 1,
    updatedAt: timestamp,
    updatedAtMs: nowMs
  };
  if (nextStatus === BACKUP_STATUSES.CAPTURING && !next.startedAtMs) {
    next.startedAt = timestamp;
    next.startedAtMs = nowMs;
  }
  if (TERMINAL_JOB_STATUSES.has(nextStatus)) {
    next.completedAt = timestamp;
    next.completedAtMs = nowMs;
    next.durationMs = Math.max(0, nowMs - Number(next.startedAtMs || next.requestedAtMs || nowMs));
    next.result = nextStatus === BACKUP_STATUSES.COMPLETED ? "SUCCESS" : nextStatus;
    if (control.lock?.backupId === backupId) control.lock = {};
  } else if (control.lock?.backupId === backupId) {
    const leaseMs = positiveInteger(options.leaseMs, DEFAULT_LEASE_MS);
    control.lock = {
      ...control.lock,
      renewedAt: timestamp,
      renewedAtMs: nowMs,
      leaseExpiresAt: new Date(nowMs + leaseMs).toISOString(),
      leaseExpiresAtMs: nowMs + leaseMs
    };
  }
  control.jobs[backupId] = next;
  return { control, outcome: { ok: true, conflict: false, reason: "backup-job-transitioned", job: next } };
}

function buildBackupArchive(source = {}, request = {}, options = {}) {
  const capturedAtMs = positiveTimestamp(options.capturedAtMs || Date.now());
  const selected = selectBackupSource(source, request);
  const data = cloneBackupValue(selected, {
    maxDepth: options.maxDepth || 64,
    maxNodes: options.maxNodes || 2000000,
    maxArray: options.maxArray || 500000,
    maxStringLength: options.maxStringLength || 4 * 1024 * 1024
  });
  const counts = buildBackupCounts(data, request.scopeType);
  const payloadFingerprint = sha256(stableStringify(data));
  const payloadSizeBytes = Buffer.byteLength(stableStringify(data), "utf8");
  const manifest = {
    backupFoundationVersion: BACKUP_FOUNDATION_VERSION,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    archiveVersion: BACKUP_ARCHIVE_VERSION,
    backupId: request.backupId,
    backupType: request.backupType,
    mode: request.mode,
    scopeType: request.scopeType,
    scopeId: request.scopeId,
    tenantId: request.tenantId || null,
    organizationId: request.organizationId || null,
    tournamentId: request.tournamentId || null,
    createdAt: request.requestedAt,
    createdAtMs: request.requestedAtMs,
    capturedAt: new Date(capturedAtMs).toISOString(),
    capturedAtMs,
    appVersion: normalizeText(options.appVersion || "unknown", 120),
    source: request.source,
    requestedBy: sanitizeBackupActor(request.actor),
    status: BACKUP_STATUSES.COMPLETED,
    counts,
    payloadSizeBytes,
    integrity: {
      algorithm: "sha256",
      payloadFingerprint
    },
    retention: cloneBackupValue(request.retention),
    restoreCompatibility: {
      supported: false,
      reason: "restore-not-implemented",
      minimumReader: BACKUP_SCHEMA_VERSION
    }
  };
  const archive = { manifest, data };
  const serialized = stableStringify(archive);
  const archiveSizeBytes = Buffer.byteLength(serialized, "utf8");
  const maxArchiveBytes = positiveInteger(options.maxArchiveBytes, DEFAULT_MAX_ARCHIVE_BYTES);
  if (archiveSizeBytes > maxArchiveBytes) {
    throw new BackupFoundationError("backup-archive-too-large", "El respaldo excede el limite configurado.", {
      archiveSizeBytes,
      maxArchiveBytes
    });
  }
  const archiveChecksum = sha256(serialized);
  return {
    archive,
    serialized,
    manifest,
    archiveChecksum,
    archiveSizeBytes,
    payloadFingerprint,
    counts
  };
}

function validateBackupArchive(archive = {}, options = {}) {
  const errors = [];
  const warnings = [];
  const manifest = plainObject(archive.manifest);
  if (manifest.backupFoundationVersion !== BACKUP_FOUNDATION_VERSION) errors.push("backup-foundation-version-invalid");
  if (manifest.backupSchemaVersion !== BACKUP_SCHEMA_VERSION) errors.push("backup-schema-version-invalid");
  if (manifest.archiveVersion !== BACKUP_ARCHIVE_VERSION) errors.push("backup-archive-version-invalid");
  if (!ID_PATTERN.test(String(manifest.backupId || ""))) errors.push("backup-id-invalid");
  if (!Object.values(BACKUP_SCOPES).includes(manifest.scopeType)) errors.push("backup-scope-invalid");
  if (!Object.values(BACKUP_MODES).includes(manifest.mode)) errors.push("backup-mode-invalid");
  if (manifest.backupType !== BACKUP_TYPES.FULL) errors.push("backup-type-invalid");
  if (manifest.integrity?.algorithm !== "sha256") errors.push("backup-integrity-algorithm-invalid");
  if (!/^[a-f0-9]{64}$/.test(String(manifest.integrity?.payloadFingerprint || ""))) errors.push("backup-payload-fingerprint-invalid");
  if (!archive.data || typeof archive.data !== "object") errors.push("backup-data-missing");
  if (archive.data?.backupFoundation !== undefined || archive.data?.backups !== undefined) errors.push("backup-recursive-data-forbidden");
  if (archive.data?.live !== undefined || archive.data?.broadcastStudio !== undefined) errors.push("backup-temporary-data-forbidden");
  let calculatedFingerprint = "";
  try {
    calculatedFingerprint = sha256(stableStringify(archive.data));
    if (calculatedFingerprint !== manifest.integrity?.payloadFingerprint) errors.push("backup-payload-fingerprint-mismatch");
  } catch (error) {
    errors.push(error.code || "backup-data-invalid");
  }
  if (!manifest.counts || typeof manifest.counts !== "object") warnings.push("backup-counts-missing");
  if (manifest.restoreCompatibility?.supported !== false) warnings.push("backup-restore-contract-unexpected");
  if (options.expectedBackupId && manifest.backupId !== options.expectedBackupId) errors.push("backup-id-mismatch");
  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    calculatedFingerprint,
    backupFoundationVersion: BACKUP_FOUNDATION_VERSION,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION
  };
}

function verifyBackupSerialization(serialized = "", expectedChecksum = "") {
  const result = {
    valid: false,
    errors: [],
    archiveChecksum: sha256(String(serialized)),
    archiveSizeBytes: Buffer.byteLength(String(serialized), "utf8"),
    archive: null
  };
  if (!/^[a-f0-9]{64}$/.test(String(expectedChecksum || ""))) result.errors.push("backup-archive-checksum-invalid");
  if (result.archiveChecksum !== expectedChecksum) result.errors.push("backup-archive-checksum-mismatch");
  try {
    result.archive = JSON.parse(String(serialized));
  } catch {
    result.errors.push("backup-archive-json-invalid");
  }
  if (result.archive) {
    const archiveValidation = validateBackupArchive(result.archive);
    result.errors.push(...archiveValidation.errors);
  }
  result.errors = uniqueStrings(result.errors);
  result.valid = result.errors.length === 0;
  return result;
}

function buildBackupCatalogRecord(request = {}, result = {}, storage = {}) {
  return {
    catalogVersion: BACKUP_FOUNDATION_VERSION,
    backupId: request.backupId,
    backupType: request.backupType,
    mode: request.mode,
    scopeType: request.scopeType,
    scopeId: request.scopeId,
    scopeKey: request.scopeKey,
    tenantId: request.tenantId || null,
    organizationId: request.organizationId || null,
    tournamentId: request.tournamentId || null,
    status: BACKUP_STATUSES.COMPLETED,
    createdAt: request.requestedAt,
    createdAtMs: request.requestedAtMs,
    completedAt: normalizeText(storage.completedAt, 80),
    completedAtMs: positiveTimestamp(storage.completedAtMs || Date.now()),
    durationMs: Math.max(0, Number(storage.durationMs || 0)),
    requestedBy: sanitizeBackupActor(request.actor),
    source: request.source,
    storageRef: normalizeText(storage.storageRef, 500),
    storageGeneration: normalizeText(storage.generation, 120),
    contentType: "application/json",
    archiveChecksum: result.archiveChecksum,
    checksumAlgorithm: "sha256",
    archiveSizeBytes: result.archiveSizeBytes,
    payloadFingerprint: result.payloadFingerprint,
    counts: cloneBackupValue(result.counts),
    validation: {
      status: "VALID",
      validatedAt: normalizeText(storage.validatedAt || storage.completedAt, 80),
      validatedAtMs: positiveTimestamp(storage.validatedAtMs || storage.completedAtMs || Date.now()),
      archiveChecksum: result.archiveChecksum,
      payloadFingerprint: result.payloadFingerprint
    },
    retention: cloneBackupValue(request.retention),
    pinned: false,
    payloadDeletedAt: "",
    payloadDeletedAtMs: 0
  };
}

function buildBackupAuditEvent(request = {}, operation = "", detail = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const timestamp = new Date(nowMs).toISOString();
  const result = normalizeText(detail.result || "PENDING", 40);
  const reason = normalizeText(detail.reason, 160);
  const eventKey = normalizeText(options.eventKey || String(nowMs), 180);
  const eventId = `audit_${sha256(`${request.backupId}|${operation}|${result}|${reason}|${eventKey}`).slice(0, 40)}`;
  return {
    auditVersion: BACKUP_FOUNDATION_VERSION,
    eventId,
    backupId: request.backupId,
    requestId: request.requestId,
    operation,
    result,
    reason,
    status: normalizeText(detail.status, 40),
    scopeType: request.scopeType,
    scopeId: request.scopeId,
    tenantId: request.tenantId || null,
    organizationId: request.organizationId || null,
    tournamentId: request.tournamentId || null,
    user: request.actor?.name || request.actor?.uid || "",
    authUid: request.actor?.uid || "",
    actor: sanitizeBackupActor(request.actor),
    source: request.source,
    revision: nonNegativeInteger(detail.revision, 0),
    durationMs: Math.max(0, Number(detail.durationMs || 0)),
    archiveChecksum: normalizeText(detail.archiveChecksum, 80),
    archiveSizeBytes: Math.max(0, Number(detail.archiveSizeBytes || 0)),
    error: sanitizeBackupError(detail.error),
    date: timestamp,
    timestamp,
    timestampMs: nowMs
  };
}

function selectBackupSource(source = {}, request = {}) {
  const root = plainObject(source);
  if (request.scopeType === BACKUP_SCOPES.TOURNAMENT) return selectTournamentSource(root, request.tournamentId);
  if (request.scopeType === BACKUP_SCOPES.ORGANIZATION) {
    const ids = Object.entries(plainObject(root.tournaments))
      .filter(([, tournament]) => normalizeId(tournament?.info?.organizationId || tournament?.meta?.organizationId) === request.organizationId)
      .filter(([, tournament]) => !request.tenantId || !normalizeId(tournament?.info?.tenantId || tournament?.meta?.tenantId) || normalizeId(tournament?.info?.tenantId || tournament?.meta?.tenantId) === request.tenantId)
      .map(([id]) => id);
    return selectTournamentCollectionSource(root, ids, { includeUsers: false, includeSettings: true });
  }
  return selectTournamentCollectionSource(root, Object.keys(plainObject(root.tournaments)), {
    includeUsers: true,
    includeSettings: true
  });
}

function selectTournamentSource(root, tournamentId) {
  const tournament = plainObject(root.tournaments)[tournamentId] || null;
  return {
    tournament,
    tournamentIndex: plainObject(root.tournamentIndex)[tournamentId] || null,
    projectionOutbox: plainObject(root.projectionOutbox)[tournamentId] || null,
    publicTournament: plainObject(root.publicTournaments)[tournamentId] || null,
    historyStatistics: plainObject(root.history?.statistics)[tournamentId] || null,
    publishedScoreAudit: plainObject(root.audit?.publishedScores)[tournamentId] || null,
    judgeAssignments: plainObject(root.judges?.assignments)[tournamentId] || null,
    judgeEvents: filterRecordsByTournament(root.judges?.events, new Set([tournamentId])),
    criticalSettings: selectCriticalSettings(root.settings)
  };
}

function selectTournamentCollectionSource(root, tournamentIds = [], options = {}) {
  const ids = new Set(tournamentIds.map(normalizeId).filter(Boolean));
  return {
    tournaments: pickRecords(root.tournaments, ids),
    tournamentIndex: pickRecords(root.tournamentIndex, ids),
    projectionOutbox: pickRecords(root.projectionOutbox, ids),
    publicTournaments: pickRecords(root.publicTournaments, ids),
    historyStatistics: pickRecords(root.history?.statistics, ids),
    publishedScoreAudit: pickRecords(root.audit?.publishedScores, ids),
    judgeAssignments: pickRecords(root.judges?.assignments, ids),
    judgeEvents: filterRecordsByTournament(root.judges?.events, ids),
    criticalSettings: options.includeSettings ? selectCriticalSettings(root.settings) : null,
    users: options.includeUsers ? plainObject(root.users) : null,
    userTournamentAccess: options.includeUsers ? plainObject(root.userTournamentAccess) : null
  };
}

function planBackupRetention(catalogEntries = [], policy = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const keepCount = boundedInteger(policy.count, 1, 1000, DEFAULT_RETENTION_COUNT);
  const keepDays = boundedInteger(policy.days, 1, 3650, DEFAULT_RETENTION_DAYS);
  const cutoffMs = nowMs - keepDays * 24 * 60 * 60 * 1000;
  const completed = (Array.isArray(catalogEntries) ? catalogEntries : Object.values(plainObject(catalogEntries)))
    .filter((entry) => entry && entry.status === BACKUP_STATUSES.COMPLETED && !entry.payloadDeletedAtMs)
    .sort((left, right) => Number(right.createdAtMs || 0) - Number(left.createdAtMs || 0) || String(left.backupId).localeCompare(String(right.backupId)));
  const keep = [];
  const expire = [];
  completed.forEach((entry, index) => {
    if (entry.pinned === true || (index < keepCount && Number(entry.createdAtMs || 0) >= cutoffMs)) keep.push(entry.backupId);
    else expire.push(entry.backupId);
  });
  return { keep, expire, keepCount, keepDays, cutoffMs };
}

function pruneBackupControl(currentControl = {}, backupIds = [], options = {}) {
  const control = cloneBackupValue(currentControl, { maxNodes: 100000 });
  control.jobs = plainObject(control.jobs);
  control.idempotency = plainObject(control.idempotency);
  const removeIds = new Set((backupIds || []).map(String).filter(Boolean));
  const cutoffMs = positiveTimestamp(options.nowMs || Date.now())
    - boundedInteger(options.days, 1, 3650, DEFAULT_RETENTION_DAYS) * 24 * 60 * 60 * 1000;
  for (const [backupId, job] of Object.entries(control.jobs)) {
    const terminal = TERMINAL_JOB_STATUSES.has(job?.status);
    const terminalAtMs = Number(job?.completedAtMs || job?.updatedAtMs || job?.requestedAtMs || 0);
    const disposableTerminal = [BACKUP_STATUSES.FAILED, BACKUP_STATUSES.CANCELLED, BACKUP_STATUSES.EXPIRED].includes(job?.status);
    if (terminal && (removeIds.has(backupId) || (disposableTerminal && terminalAtMs < cutoffMs))) delete control.jobs[backupId];
  }
  const retainedBackupIds = new Set(Object.keys(control.jobs));
  for (const [requestId, entry] of Object.entries(control.idempotency)) {
    if (!retainedBackupIds.has(String(entry?.backupId || ""))) delete control.idempotency[requestId];
  }
  if (control.lock?.backupId && !retainedBackupIds.has(control.lock.backupId)) control.lock = {};
  return control;
}

function buildBackupCounts(data = {}, scopeType = "") {
  if (scopeType === BACKUP_SCOPES.TOURNAMENT) {
    const tournament = plainObject(data.tournament);
    return {
      tournaments: tournament.info?.id ? 1 : 0,
      charreadas: countRecords(tournament.charreadas),
      teams: countRecords(tournament.teams),
      participants: countIndividualParticipants(tournament.charreadas),
      scores: countRecords(tournament.scores),
      publishedScores: countRecords(tournament.publishedScores),
      officialScoreLedgers: countRecords(tournament.officialScoreLedger),
      officialScoreAuditEvents: countRecords(tournament.officialScoreAudit),
      projectionJobs: countRecords(data.projectionOutbox),
      historicalSnapshots: countRecords(data.historyStatistics)
    };
  }
  const tournaments = plainObject(data.tournaments);
  return Object.values(tournaments).reduce((counts, tournament) => {
    counts.tournaments += tournament?.info?.id ? 1 : 0;
    counts.charreadas += countRecords(tournament?.charreadas);
    counts.teams += countRecords(tournament?.teams);
    counts.participants += countIndividualParticipants(tournament?.charreadas);
    counts.scores += countRecords(tournament?.scores);
    counts.publishedScores += countRecords(tournament?.publishedScores);
    counts.officialScoreLedgers += countRecords(tournament?.officialScoreLedger);
    counts.officialScoreAuditEvents += countRecords(tournament?.officialScoreAudit);
    return counts;
  }, {
    tournaments: 0,
    charreadas: 0,
    teams: 0,
    participants: 0,
    scores: 0,
    publishedScores: 0,
    officialScoreLedgers: 0,
    officialScoreAuditEvents: 0,
    projectionJobs: Object.values(plainObject(data.projectionOutbox)).reduce((sum, value) => sum + countRecords(value), 0),
    historicalSnapshots: Object.values(plainObject(data.historyStatistics)).reduce((sum, value) => sum + countRecords(value), 0)
  });
}

function isValidJobTransition(current, next, cancellationRequested) {
  if (current === next) return !TERMINAL_JOB_STATUSES.has(current);
  const allowed = {
    [BACKUP_STATUSES.REQUESTED]: [BACKUP_STATUSES.CAPTURING, BACKUP_STATUSES.CANCELLED, BACKUP_STATUSES.FAILED],
    [BACKUP_STATUSES.CAPTURING]: [BACKUP_STATUSES.UPLOADING, BACKUP_STATUSES.CANCELLED, BACKUP_STATUSES.FAILED],
    [BACKUP_STATUSES.UPLOADING]: [BACKUP_STATUSES.CAPTURING, BACKUP_STATUSES.VALIDATING, BACKUP_STATUSES.FAILED],
    [BACKUP_STATUSES.VALIDATING]: [BACKUP_STATUSES.CAPTURING, BACKUP_STATUSES.COMPLETED, BACKUP_STATUSES.FAILED]
  };
  if (next === BACKUP_STATUSES.CANCELLED && cancellationRequested !== true) return false;
  return Boolean(allowed[current]?.includes(next));
}

function sanitizeTransitionPatch(patch = {}) {
  const allowed = new Set([
    "attempts",
    "result",
    "reason",
    "lastError",
    "storageRef",
    "storageGeneration",
    "archiveChecksum",
    "archiveSizeBytes",
    "payloadFingerprint",
    "counts",
    "validation",
    "failureStage",
    "failureCode",
    "failureBucket",
    "failureObjectPath",
    "diagnosticId"
  ]);
  return Object.fromEntries(Object.entries(plainObject(patch)).filter(([key]) => allowed.has(key)).map(([key, value]) => [key, cloneBackupValue(value)]));
}

function cloneBackupValue(value, limits = {}, state = null, depth = 0) {
  const context = state || {
    seen: new WeakSet(),
    nodes: 0,
    maxNodes: positiveInteger(limits.maxNodes, 2000000)
  };
  const maxDepth = positiveInteger(limits.maxDepth, 64);
  const maxArray = positiveInteger(limits.maxArray, 500000);
  const maxStringLength = positiveInteger(limits.maxStringLength, 4 * 1024 * 1024);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.length > maxStringLength) throw new BackupFoundationError("backup-string-too-large");
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new BackupFoundationError("backup-number-invalid");
    return value;
  }
  if (value === undefined) return null;
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new BackupFoundationError("backup-value-not-serializable");
  }
  if (typeof value !== "object") throw new BackupFoundationError("backup-value-invalid");
  if (depth >= maxDepth) throw new BackupFoundationError("backup-depth-exceeded");
  if (context.seen.has(value)) throw new BackupFoundationError("backup-cycle-detected");
  context.nodes += 1;
  if (context.nodes > context.maxNodes) throw new BackupFoundationError("backup-node-limit-exceeded");
  context.seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > maxArray) throw new BackupFoundationError("backup-array-limit-exceeded");
    const result = value.map((entry) => cloneBackupValue(entry, limits, context, depth + 1));
    context.seen.delete(value);
    return result;
  }
  const result = Object.create(null);
  for (const key of Object.keys(value).sort()) {
    if (DANGEROUS_KEYS.has(key)) throw new BackupFoundationError("backup-dangerous-key");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) throw new BackupFoundationError("backup-accessor-forbidden");
    result[key] = cloneBackupValue(descriptor.value, limits, context, depth + 1);
  }
  context.seen.delete(value);
  return result;
}

function stableStringify(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new BackupFoundationError("backup-number-invalid");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!value || typeof value !== "object") throw new BackupFoundationError("backup-value-not-serializable");
  return `{${Object.keys(value).sort().map((key) => {
    if (DANGEROUS_KEYS.has(key)) throw new BackupFoundationError("backup-dangerous-key");
    return `${JSON.stringify(key)}:${stableStringify(value[key])}`;
  }).join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function normalizeBackupActor(actor = {}) {
  return {
    uid: normalizeText(actor.uid, 128),
    name: normalizeText(actor.name || actor.email, 160),
    role: normalizeText(actor.role, 40).toLowerCase(),
    tenantId: normalizeId(actor.tenantId),
    organizationId: normalizeId(actor.organizationId),
    platformAdmin: actor.platformAdmin === true
  };
}

function sanitizeBackupActor(actor = {}) {
  const clean = normalizeBackupActor(actor);
  return {
    uid: clean.uid,
    name: clean.name,
    role: clean.role,
    tenantId: clean.tenantId || null,
    organizationId: clean.organizationId || null,
    platformAdmin: clean.platformAdmin
  };
}

function sanitizeBackupError(error) {
  if (!error) return null;
  const code = normalizeText(error.code || error.name || "backup-error", 100);
  const message = normalizeText(error.message || error.reason || "", 240)
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(token|password|secret|credential|privateKey)\s*[:=]\s*\S+/gi, "$1=[redacted]");
  return { code, message };
}

function selectCriticalSettings(settings = {}) {
  const source = plainObject(settings);
  return {
    globalRuleOverrides: source.globalRuleOverrides || null,
    scoringButtonLayouts: source.scoringButtonLayouts || null
  };
}

function filterRecordsByTournament(value, tournamentIds) {
  return Object.fromEntries(Object.entries(plainObject(value)).filter(([, record]) => tournamentIds.has(normalizeId(record?.tournamentId || record?.tournament?.id))));
}

function pickRecords(value, ids) {
  return Object.fromEntries(Object.entries(plainObject(value)).filter(([id]) => ids.has(normalizeId(id))));
}

function countIndividualParticipants(charreadas) {
  return Object.values(plainObjectOrArray(charreadas)).reduce((total, charreada) => total + countRecords(charreada?.individualParticipants), 0);
}

function countRecords(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== null && entry !== undefined).length;
  return Object.values(plainObject(value)).filter((entry) => entry !== null && entry !== undefined).length;
}

function plainObjectOrArray(value) {
  return Array.isArray(value) ? Object.fromEntries(value.map((entry, index) => [String(index), entry])) : plainObject(value);
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeId(value) {
  const clean = String(value || "").trim();
  return ID_PATTERN.test(clean) ? clean : "";
}

function normalizeText(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeEnum(value, allowed, fallback) {
  const clean = String(value || "").trim().toLowerCase();
  return allowed.includes(clean) ? clean : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function boundedInteger(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum && number <= maximum ? number : fallback;
}

function positiveTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : Date.now();
}

function uniqueStrings(values) {
  return [...new Set((values || []).map(String).filter(Boolean))];
}

function allowed() {
  return { allowed: true, reason: "backup-authorized" };
}

function denied(reason) {
  return { allowed: false, reason };
}

module.exports = {
  BACKUP_FOUNDATION_VERSION,
  BACKUP_SCHEMA_VERSION,
  BACKUP_ARCHIVE_VERSION,
  BACKUP_SCOPES,
  BACKUP_MODES,
  BACKUP_TYPES,
  BACKUP_STATUSES,
  BACKUP_AUDIT_OPERATIONS,
  BackupFoundationError,
  prepareBackupRequest,
  authorizeBackupRequest,
  applyBackupClaim,
  requestBackupCancellation,
  applyBackupJobTransition,
  buildBackupArchive,
  validateBackupArchive,
  verifyBackupSerialization,
  buildBackupCatalogRecord,
  buildBackupAuditEvent,
  selectBackupSource,
  planBackupRetention,
  pruneBackupControl,
  cloneBackupValue,
  stableStringify,
  sha256
};
