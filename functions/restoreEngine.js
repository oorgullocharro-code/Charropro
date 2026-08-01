"use strict";

const {
  BACKUP_FOUNDATION_VERSION,
  BACKUP_SCHEMA_VERSION,
  BACKUP_SCOPES,
  BACKUP_STATUSES,
  cloneBackupValue,
  selectBackupSource,
  sha256,
  stableStringify,
  verifyBackupSerialization
} = require("./backupFoundation");

const RESTORE_ENGINE_VERSION = "1.0.0";
const RESTORE_SCHEMA_VERSION = "charropro-restore/1";
const RESTORE_SCOPES = Object.freeze({
  TOURNAMENT: "tournament",
  ORGANIZATION: "organization",
  SYSTEM: "system",
  CHARREADA: "charreada"
});
const RESTORE_STATUSES = Object.freeze({
  VALIDATED: "VALIDATED",
  REQUESTED: "REQUESTED",
  PREPARING: "PREPARING",
  APPLYING: "APPLYING",
  VERIFYING: "VERIFYING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED"
});
const RESTORE_AUDIT_OPERATIONS = Object.freeze({
  VALIDATED: "RESTORE_VALIDATED",
  REQUESTED: "RESTORE_REQUESTED",
  STARTED: "RESTORE_STARTED",
  APPLIED: "RESTORE_APPLIED",
  VERIFIED: "RESTORE_VERIFIED",
  COMPLETED: "RESTORE_COMPLETED",
  FAILED: "RESTORE_FAILED",
  CANCELLED: "RESTORE_CANCELLED"
});

const ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const SCOPE_KEY_PATTERN = /^scope_[a-f0-9]{40}$/;
const BACKUP_ID_PATTERN = /^backup_[a-f0-9]{40}$/;
const VALIDATION_ID_PATTERN = /^validation_[a-f0-9]{40}$/;
const RESTORE_ID_PATTERN = /^restore_[a-f0-9]{40}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:@/-]{12,180}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const DEFAULT_VALIDATION_TTL_MS = 15 * 60 * 1000;
const DEFAULT_LEASE_MS = 15 * 60 * 1000;
const TERMINAL_STATUSES = new Set([
  RESTORE_STATUSES.COMPLETED,
  RESTORE_STATUSES.FAILED,
  RESTORE_STATUSES.CANCELLED
]);
const OUTBOX_TERMINAL_STATUSES = new Set([
  "VERIFIED",
  "CLIENT_CONFIRMED",
  "SUPERSEDED",
  "CANCELLED",
  "DEAD_LETTER"
]);

class RestoreEngineError extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = "RestoreEngineError";
    this.code = code;
    this.details = details;
  }
}

function validateRestoreArchive(serialized = "", catalog = {}) {
  const expectedChecksum = normalizeHash(catalog.archiveChecksum);
  const result = verifyBackupSerialization(serialized, expectedChecksum);
  const errors = [...result.errors];
  const warnings = [];
  const archive = result.archive;
  const manifest = plainObject(archive?.manifest);

  if (catalog.status !== BACKUP_STATUSES.COMPLETED) errors.push("restore-backup-not-completed");
  if (!catalog.storageRef) errors.push("restore-backup-storage-ref-missing");
  if (catalog.payloadDeletedAtMs) errors.push("restore-backup-payload-expired");
  if (archive) {
    if (manifest.backupFoundationVersion !== BACKUP_FOUNDATION_VERSION) errors.push("restore-backup-foundation-version-incompatible");
    if (manifest.backupSchemaVersion !== BACKUP_SCHEMA_VERSION) errors.push("restore-backup-schema-incompatible");
    if (manifest.archiveVersion !== 1) errors.push("restore-backup-archive-version-incompatible");
    if (manifest.backupId !== catalog.backupId) errors.push("restore-backup-id-mismatch");
    if (catalog.scopeType && manifest.scopeType !== catalog.scopeType) errors.push("restore-backup-scope-mismatch");
    if (catalog.scopeId && manifest.scopeId !== catalog.scopeId) errors.push("restore-backup-scope-id-mismatch");
    if (catalog.tenantId && manifest.tenantId && manifest.tenantId !== catalog.tenantId) errors.push("restore-backup-tenant-mismatch");
    if (catalog.organizationId && manifest.organizationId && manifest.organizationId !== catalog.organizationId) {
      errors.push("restore-backup-organization-mismatch");
    }
    if (catalog.payloadFingerprint && manifest.integrity?.payloadFingerprint !== catalog.payloadFingerprint) {
      errors.push("restore-backup-payload-catalog-mismatch");
    }
    if (manifest.restoreCompatibility?.supported === false) {
      warnings.push("restore-backup-created-before-restore-engine");
    }
  }

  return {
    valid: uniqueStrings(errors).length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    archive,
    archiveChecksum: result.archiveChecksum,
    archiveSizeBytes: result.archiveSizeBytes,
    payloadFingerprint: manifest.integrity?.payloadFingerprint || ""
  };
}

function prepareRestoreValidation(input = {}, actor = {}, context = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const cleanActor = normalizeRestoreActor(actor);
  const request = normalizeRestoreTarget(input, cleanActor);
  const source = context.sourceValidation;
  const safety = context.safetyValidation || null;
  const currentRoot = cloneRestoreValue(context.currentRoot || {});
  const confirmationToken = normalizeSecret(options.confirmationToken);
  const errors = [];
  const warnings = [];

  if (!cleanActor.uid) errors.push("restore-auth-required");
  if (cleanActor.role !== "supervisor") errors.push("restore-role-denied");
  if (!request.scopeType) errors.push("restore-scope-invalid");
  if (!request.sourceScopeKey || !request.backupId) errors.push("restore-source-invalid");
  if (!request.idempotencyKey) errors.push("restore-idempotency-invalid");
  if (!source?.valid || !source.archive) errors.push(source?.errors?.[0] || "restore-source-invalid");
  if (!confirmationToken) errors.push("restore-confirmation-token-invalid");
  if (request.scopeType === RESTORE_SCOPES.SYSTEM && cleanActor.platformAdmin !== true) errors.push("restore-system-authority-required");
  if (request.scopeType === RESTORE_SCOPES.ORGANIZATION && !request.organizationId) errors.push("restore-organization-required");
  if ([RESTORE_SCOPES.TOURNAMENT, RESTORE_SCOPES.CHARREADA].includes(request.scopeType) && !request.tournamentId) {
    errors.push("restore-tournament-required");
  }
  if (request.scopeType === RESTORE_SCOPES.CHARREADA && !request.charreadaId) errors.push("restore-charreada-required");

  if (errors.length) return { valid: false, errors: uniqueStrings(errors), warnings };

  const sourceIdentity = validateRestoreIdentity(source.archive, request, cleanActor);
  errors.push(...sourceIdentity.errors);
  warnings.push(...source.warnings, ...sourceIdentity.warnings);

  let plan = null;
  try {
    plan = buildRestorePlan(source.archive, currentRoot, request, {
      sourceArchiveChecksum: source.archiveChecksum,
      validatedAtMs: nowMs
    });
    errors.push(...plan.errors);
    warnings.push(...plan.warnings);
    const targetIdentity = validateRestoreTargetIdentity(plan.sourceTarget, request);
    errors.push(...targetIdentity.errors);
    warnings.push(...targetIdentity.warnings);
  } catch (error) {
    errors.push(normalizeErrorCode(error));
  }

  if (!plan || errors.length) return { valid: false, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings) };

  if (plan.targetExists) {
    if (!request.safetyScopeKey || !request.safetyBackupId) {
      errors.push("restore-safety-backup-required");
    } else if (!safety?.valid || !safety.archive) {
      errors.push(safety?.errors?.[0] || "restore-safety-backup-invalid");
    } else {
      const safetyIdentity = validateRestoreIdentity(safety.archive, request, cleanActor);
      errors.push(...safetyIdentity.errors.map((error) => `safety-${error}`));
      warnings.push(...safety.warnings, ...safetyIdentity.warnings);
      try {
        const safetyTarget = selectArchiveRestoreTarget(safety.archive, request);
        const safetyTargetIdentity = validateRestoreTargetIdentity(safetyTarget, request);
        errors.push(...safetyTargetIdentity.errors.map((error) => `safety-${error}`));
        warnings.push(...safetyTargetIdentity.warnings);
        const safetyFingerprint = fingerprintRestoreValue(safetyTarget);
        if (safetyFingerprint !== plan.expectedTargetFingerprint) errors.push("restore-safety-backup-not-current");
        plan.safetyArchiveChecksum = safety.archiveChecksum;
        plan.safetyPayloadFingerprint = safety.payloadFingerprint;
        plan.safetyTargetFingerprint = safetyFingerprint;
      } catch (error) {
        errors.push(normalizeErrorCode(error));
      }
    }
  } else if (request.safetyBackupId || request.safetyScopeKey) {
    warnings.push("restore-safety-backup-not-required-for-create");
  }

  const scoreValidation = validateOfficialScoreIntegrity(plan.sourceTarget);
  errors.push(...scoreValidation.errors);
  warnings.push(...scoreValidation.warnings);
  if (errors.length) return { valid: false, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings) };

  const expiresAtMs = nowMs + positiveInteger(options.validationTtlMs, DEFAULT_VALIDATION_TTL_MS);
  const validationId = `validation_${sha256(`${request.scopeKey}|${request.backupId}|${request.idempotencyKey}|${nowMs}`).slice(0, 40)}`;
  const confirmationPhrase = buildConfirmationPhrase(request, request.backupId);
  const record = {
    restoreEngineVersion: RESTORE_ENGINE_VERSION,
    restoreSchemaVersion: RESTORE_SCHEMA_VERSION,
    validationId,
    status: RESTORE_STATUSES.VALIDATED,
    used: false,
    request,
    actor: cleanActor,
    sourceArchiveChecksum: source.archiveChecksum,
    sourcePayloadFingerprint: source.payloadFingerprint,
    safetyArchiveChecksum: plan.safetyArchiveChecksum || "",
    safetyPayloadFingerprint: plan.safetyPayloadFingerprint || "",
    expectedTargetFingerprint: plan.expectedTargetFingerprint,
    expectedRestoredFingerprint: plan.expectedRestoredFingerprint,
    planFingerprint: plan.planFingerprint,
    confirmationTokenHash: sha256(confirmationToken),
    confirmationPhraseHash: sha256(confirmationPhrase),
    counts: cloneRestoreValue(plan.counts),
    warnings: uniqueStrings(warnings),
    validatedAt: new Date(nowMs).toISOString(),
    validatedAtMs: nowMs,
    expiresAt: new Date(expiresAtMs).toISOString(),
    expiresAtMs
  };
  return {
    valid: true,
    record,
    plan,
    confirmationToken,
    confirmationPhrase,
    errors: [],
    warnings: record.warnings
  };
}

function prepareRestoreRequest(input = {}, actor = {}, validation = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const cleanActor = normalizeRestoreActor(actor);
  const validationId = normalizeValidationId(input.validationId);
  const confirmationToken = normalizeSecret(input.confirmationToken);
  const confirmationPhrase = normalizeText(input.confirmationPhrase, 500);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  const errors = [];
  const alreadyUsed = validation.used === true && Boolean(validation.restoreId);

  if (!validationId || validation.validationId !== validationId) errors.push("restore-validation-invalid");
  if (validation.status !== RESTORE_STATUSES.VALIDATED) errors.push("restore-validation-status-invalid");
  if (!alreadyUsed && Number(validation.expiresAtMs || 0) < nowMs) errors.push("restore-validation-expired");
  if (!cleanActor.uid || cleanActor.uid !== validation.actor?.uid) errors.push("restore-validation-actor-mismatch");
  if (cleanActor.role !== "supervisor") errors.push("restore-role-denied");
  if (validation.actor?.tenantId && cleanActor.tenantId !== validation.actor.tenantId) errors.push("restore-validation-tenant-mismatch");
  if (validation.actor?.organizationId && cleanActor.organizationId !== validation.actor.organizationId) {
    errors.push("restore-validation-organization-mismatch");
  }
  if (validation.request?.scopeType === RESTORE_SCOPES.SYSTEM && cleanActor.platformAdmin !== true) {
    errors.push("restore-system-authority-required");
  }
  if (!confirmationToken || sha256(confirmationToken) !== validation.confirmationTokenHash) errors.push("restore-confirmation-token-mismatch");
  if (!confirmationPhrase || sha256(confirmationPhrase) !== validation.confirmationPhraseHash) errors.push("restore-confirmation-phrase-mismatch");
  if (!idempotencyKey || idempotencyKey !== validation.request?.idempotencyKey) errors.push("restore-idempotency-mismatch");
  if (errors.length) return { valid: false, errors: uniqueStrings(errors) };
  if (alreadyUsed) return { valid: true, idempotent: true, request: validation.requestedRestore };

  const restoreId = `restore_${sha256(`${validation.request.scopeKey}|${validationId}|${idempotencyKey}`).slice(0, 40)}`;
  const request = {
    restoreEngineVersion: RESTORE_ENGINE_VERSION,
    restoreSchemaVersion: RESTORE_SCHEMA_VERSION,
    restoreId,
    validationId,
    requestId: `request_${sha256(idempotencyKey).slice(0, 40)}`,
    requestFingerprint: sha256(stableStringify({
      validationId,
      idempotencyKey,
      planFingerprint: validation.planFingerprint,
      actorUid: cleanActor.uid
    })),
    idempotencyKey,
    scopeType: validation.request.scopeType,
    scopeId: validation.request.scopeId,
    scopeKey: validation.request.scopeKey,
    tenantId: validation.request.tenantId,
    organizationId: validation.request.organizationId,
    tournamentId: validation.request.tournamentId,
    charreadaId: validation.request.charreadaId,
    sourceScopeKey: validation.request.sourceScopeKey,
    backupId: validation.request.backupId,
    safetyScopeKey: validation.request.safetyScopeKey,
    safetyBackupId: validation.request.safetyBackupId,
    sourceArchiveChecksum: validation.sourceArchiveChecksum,
    sourcePayloadFingerprint: validation.sourcePayloadFingerprint,
    safetyArchiveChecksum: validation.safetyArchiveChecksum,
    safetyPayloadFingerprint: validation.safetyPayloadFingerprint,
    expectedTargetFingerprint: validation.expectedTargetFingerprint,
    expectedRestoredFingerprint: validation.expectedRestoredFingerprint,
    planFingerprint: validation.planFingerprint,
    actor: cleanActor,
    source: "restore-api",
    reason: validation.request.reason,
    requestedAt: new Date(nowMs).toISOString(),
    requestedAtMs: nowMs,
    leaseExpiresAt: new Date(nowMs + DEFAULT_LEASE_MS).toISOString(),
    leaseExpiresAtMs: nowMs + DEFAULT_LEASE_MS,
    counts: cloneRestoreValue(validation.counts)
  };
  return { valid: true, idempotent: false, request, errors: [] };
}

function applyRestoreClaim(currentControl = {}, request = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || request.requestedAtMs || Date.now());
  const control = cloneRestoreValue(currentControl || {});
  control.controlVersion = RESTORE_ENGINE_VERSION;
  control.idempotency = plainObject(control.idempotency);
  control.jobs = plainObject(control.jobs);
  control.lock = plainObject(control.lock);
  const existing = plainObject(control.idempotency[request.requestId]);

  if (existing.restoreId) {
    if (existing.requestFingerprint !== request.requestFingerprint) {
      return { control, outcome: { ok: false, conflict: true, reason: "restore-idempotency-conflict" } };
    }
    return {
      control,
      outcome: {
        ok: true,
        idempotent: true,
        reason: "restore-request-already-claimed",
        restoreId: existing.restoreId,
        job: cloneRestoreValue(control.jobs[existing.restoreId] || null)
      }
    };
  }

  if (control.lock.restoreId && Number(control.lock.leaseExpiresAtMs || 0) > nowMs) {
    return { control, outcome: { ok: false, conflict: true, reason: "restore-scope-busy" } };
  }

  const job = {
    ...cloneRestoreValue(request),
    jobVersion: RESTORE_ENGINE_VERSION,
    status: RESTORE_STATUSES.REQUESTED,
    revision: 1,
    attempts: 0,
    cancellationRequested: false,
    result: "PENDING",
    lastError: "",
    updatedAt: request.requestedAt,
    updatedAtMs: request.requestedAtMs
  };
  control.idempotency[request.requestId] = {
    restoreId: request.restoreId,
    idempotencyKey: request.idempotencyKey,
    requestFingerprint: request.requestFingerprint,
    createdAt: request.requestedAt,
    createdAtMs: request.requestedAtMs
  };
  control.jobs[request.restoreId] = job;
  control.lock = {
    restoreId: request.restoreId,
    requestId: request.requestId,
    leaseExpiresAt: request.leaseExpiresAt,
    leaseExpiresAtMs: request.leaseExpiresAtMs,
    acquiredAt: request.requestedAt,
    acquiredAtMs: request.requestedAtMs
  };
  return { control, outcome: { ok: true, idempotent: false, reason: "restore-request-claimed", restoreId: request.restoreId, job } };
}

function transitionRestoreJob(currentControl = {}, restoreIdValue = "", transition = {}, options = {}) {
  const restoreId = normalizeRestoreId(restoreIdValue);
  const control = cloneRestoreValue(currentControl || {});
  control.jobs = plainObject(control.jobs);
  control.lock = plainObject(control.lock);
  const current = plainObject(control.jobs[restoreId]);
  if (!current.restoreId) return { control, outcome: { ok: false, reason: "restore-job-not-found" } };
  if (Number(transition.expectedRevision) !== Number(current.revision)) {
    return { control, outcome: { ok: false, conflict: true, reason: "restore-revision-conflict", revision: current.revision } };
  }
  const nextStatus = normalizeText(transition.status, 40).toUpperCase();
  if (!isValidRestoreTransition(current.status, nextStatus, current.cancellationRequested, transition.allowFailureFromAnyState)) {
    return { control, outcome: { ok: false, reason: "restore-transition-invalid" } };
  }
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const next = {
    ...current,
    ...sanitizeTransitionPatch(transition.patch),
    status: nextStatus,
    revision: Number(current.revision || 0) + 1,
    updatedAt: new Date(nowMs).toISOString(),
    updatedAtMs: nowMs
  };
  if (nextStatus === RESTORE_STATUSES.PREPARING && !next.startedAtMs) {
    next.startedAt = new Date(nowMs).toISOString();
    next.startedAtMs = nowMs;
  }
  if (TERMINAL_STATUSES.has(nextStatus)) {
    next.completedAt = new Date(nowMs).toISOString();
    next.completedAtMs = nowMs;
    next.durationMs = Math.max(0, nowMs - Number(next.startedAtMs || next.requestedAtMs || nowMs));
    if (control.lock.restoreId === restoreId) control.lock = {};
  }
  control.jobs[restoreId] = next;
  return { control, outcome: { ok: true, reason: "restore-job-transitioned", job: next } };
}

function requestRestoreCancellation(currentControl = {}, restoreIdValue = "", actor = {}, options = {}) {
  const restoreId = normalizeRestoreId(restoreIdValue);
  const cleanActor = normalizeRestoreActor(actor);
  const control = cloneRestoreValue(currentControl || {});
  control.jobs = plainObject(control.jobs);
  const job = plainObject(control.jobs[restoreId]);
  if (!job.restoreId) return { control, outcome: { ok: false, reason: "restore-job-not-found" } };
  if (cleanActor.uid !== job.actor?.uid && cleanActor.platformAdmin !== true) {
    return { control, outcome: { ok: false, reason: "restore-cancellation-denied" } };
  }
  if (TERMINAL_STATUSES.has(job.status)) {
    return { control, outcome: { ok: true, idempotent: true, reason: "restore-job-terminal", job } };
  }
  if ([RESTORE_STATUSES.APPLYING, RESTORE_STATUSES.VERIFYING].includes(job.status)) {
    return { control, outcome: { ok: false, reason: "restore-cancellation-too-late" } };
  }
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const next = {
    ...job,
    cancellationRequested: true,
    cancellationRequestedAt: new Date(nowMs).toISOString(),
    cancellationRequestedAtMs: nowMs,
    cancellationRequestedBy: cleanActor,
    updatedAt: new Date(nowMs).toISOString(),
    updatedAtMs: nowMs,
    revision: Number(job.revision || 0) + 1
  };
  control.jobs[restoreId] = next;
  return { control, outcome: { ok: true, idempotent: job.cancellationRequested === true, reason: "restore-cancellation-requested", job: next } };
}

function buildRestorePlan(archive = {}, currentRoot = {}, request = {}, options = {}) {
  const errors = [];
  const warnings = [];
  const sourceTarget = selectArchiveRestoreTarget(archive, request);
  const currentTarget = selectCurrentRestoreTarget(currentRoot, request);
  const targetExists = restoreTargetExists(currentTarget, request.scopeType);
  const expectedTargetFingerprint = fingerprintRestoreValue(currentTarget);
  const plan = {
    restoreEngineVersion: RESTORE_ENGINE_VERSION,
    restoreSchemaVersion: RESTORE_SCHEMA_VERSION,
    scopeType: request.scopeType,
    scopeId: request.scopeId,
    scopeKey: request.scopeKey,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    tournamentId: request.tournamentId,
    charreadaId: request.charreadaId,
    backupId: request.backupId,
    sourceScopeType: archive.manifest?.scopeType || "",
    sourceArchiveChecksum: options.sourceArchiveChecksum || "",
    sourcePayloadFingerprint: archive.manifest?.integrity?.payloadFingerprint || "",
    targetExists,
    expectedTargetFingerprint,
    sourceTarget,
    counts: buildRestoreCounts(sourceTarget, request.scopeType),
    warnings,
    errors
  };

  if (!restoreTargetExists(sourceTarget, request.scopeType)) errors.push("restore-source-target-not-found");
  if (!targetExists) warnings.push("restore-target-will-be-created");
  if (request.scopeType === RESTORE_SCOPES.CHARREADA) {
    warnings.push("restore-charreada-requires-public-reprojection");
    warnings.push("restore-charreada-does-not-rebuild-historical-statistics");
  }

  if (!errors.length) {
    const previewRequest = {
      restoreId: "restore_preview",
      backupId: request.backupId,
      actor: { uid: "restore-preview", role: "system" },
      requestedAt: "",
      requestedAtMs: 0
    };
    const candidate = applyRestorePlanToRoot(currentRoot, plan, previewRequest, { preview: true });
    plan.expectedRestoredFingerprint = fingerprintRestoreValue(selectCurrentRestoreTarget(candidate.root, request));
    plan.planFingerprint = sha256(stableStringify({
      scopeType: plan.scopeType,
      scopeId: plan.scopeId,
      backupId: plan.backupId,
      sourceArchiveChecksum: plan.sourceArchiveChecksum,
      sourcePayloadFingerprint: plan.sourcePayloadFingerprint,
      expectedTargetFingerprint: plan.expectedTargetFingerprint,
      expectedRestoredFingerprint: plan.expectedRestoredFingerprint,
      counts: plan.counts
    }));
  } else {
    plan.expectedRestoredFingerprint = "";
    plan.planFingerprint = "";
  }
  return plan;
}

function applyRestorePlanToRoot(currentRoot = {}, plan = {}, request = {}, options = {}) {
  if (!plan || !plan.scopeType || !plan.sourceTarget) throw new RestoreEngineError("restore-plan-invalid");
  const root = cloneRestoreValue(currentRoot || {});
  const metadata = options.preview === true ? null : buildRestoreMetadata(request, plan);
  const summary = { tournaments: 0, charreadas: 0, scores: 0, publicSnapshots: 0, auditRecords: 0 };

  if (plan.scopeType === RESTORE_SCOPES.TOURNAMENT) {
    applyTournamentSnapshot(root, plan.tournamentId, plan.sourceTarget, metadata, summary);
  } else if (plan.scopeType === RESTORE_SCOPES.CHARREADA) {
    applyCharreadaSnapshot(root, plan.tournamentId, plan.charreadaId, plan.sourceTarget, metadata, summary);
  } else if ([RESTORE_SCOPES.ORGANIZATION, RESTORE_SCOPES.SYSTEM].includes(plan.scopeType)) {
    clearTournamentCollectionScope(root, plan);
    applyTournamentCollectionSnapshot(root, plan.sourceTarget, metadata, summary, {
      restoreSystemData: plan.scopeType === RESTORE_SCOPES.SYSTEM,
      restoreCriticalSettings: plan.scopeType === RESTORE_SCOPES.SYSTEM
    });
  } else {
    throw new RestoreEngineError("restore-scope-invalid");
  }

  if (metadata) appendRestoreAuditToRoot(root, buildRestoreAuditEvent(request, RESTORE_AUDIT_OPERATIONS.APPLIED, {
    result: "SUCCESS",
    status: RESTORE_STATUSES.APPLYING,
    objectsRestored: summary,
    fingerprint: plan.expectedRestoredFingerprint,
    reason: "restore-atomic-promotion-applied"
  }, { nowMs: request.appliedAtMs || request.requestedAtMs || Date.now(), eventKey: "applied" }));

  return { root, summary };
}

function validateRestoredRoot(root = {}, plan = {}) {
  const errors = [];
  const warnings = [];
  let actualFingerprint = "";
  try {
    const target = selectCurrentRestoreTarget(root, plan);
    actualFingerprint = fingerprintRestoreValue(target);
    if (actualFingerprint !== plan.expectedRestoredFingerprint) errors.push("restore-post-fingerprint-mismatch");
    const scoreValidation = validateOfficialScoreIntegrity(target);
    errors.push(...scoreValidation.errors);
    warnings.push(...scoreValidation.warnings);
    const counts = buildRestoreCounts(target, plan.scopeType);
    if (stableStringify(counts) !== stableStringify(plan.counts)) warnings.push("restore-post-counts-differ-after-safety-normalization");
  } catch (error) {
    errors.push(normalizeErrorCode(error));
  }
  return {
    valid: uniqueStrings(errors).length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    actualFingerprint,
    expectedFingerprint: plan.expectedRestoredFingerprint
  };
}

function buildRestoreAuditEvent(request = {}, operation = "", detail = {}, options = {}) {
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const timestamp = new Date(nowMs).toISOString();
  const eventKey = normalizeText(options.eventKey || String(nowMs), 180);
  const eventId = `audit_${sha256(`${request.restoreId || request.validationId}|${operation}|${eventKey}`).slice(0, 40)}`;
  return {
    auditVersion: RESTORE_ENGINE_VERSION,
    eventId,
    restoreId: request.restoreId || "",
    validationId: request.validationId || "",
    operation,
    result: normalizeText(detail.result || "PENDING", 40),
    reason: normalizeText(detail.reason, 180),
    status: normalizeText(detail.status, 40),
    scopeType: request.scopeType || "",
    scopeId: request.scopeId || "",
    scopeKey: request.scopeKey || "",
    tenantId: request.tenantId || null,
    organizationId: request.organizationId || null,
    tournamentId: request.tournamentId || null,
    charreadaId: request.charreadaId || null,
    backupId: request.backupId || "",
    safetyBackupId: request.safetyBackupId || "",
    sourceArchiveChecksum: request.sourceArchiveChecksum || "",
    expectedTargetFingerprint: request.expectedTargetFingerprint || "",
    restoredFingerprint: normalizeHash(detail.fingerprint),
    revision: nonNegativeInteger(detail.revision, 0),
    durationMs: Math.max(0, Number(detail.durationMs || 0)),
    objectsRestored: cloneRestoreValue(detail.objectsRestored || {}),
    user: request.actor?.name || request.actor?.uid || "",
    authUid: request.actor?.uid || "",
    actor: sanitizeRestoreActor(request.actor),
    source: request.source || "restore-engine",
    error: sanitizeRestoreError(detail.error),
    date: timestamp,
    timestamp,
    timestampMs: nowMs
  };
}

function selectCurrentRestoreTarget(root = {}, request = {}) {
  const source = plainObject(root);
  if (request.scopeType === RESTORE_SCOPES.CHARREADA) {
    const tournamentSnapshot = selectBackupSource(source, {
      scopeType: BACKUP_SCOPES.TOURNAMENT,
      tournamentId: request.tournamentId
    });
    return selectCharreadaSubset(tournamentSnapshot, request.charreadaId);
  }
  if (request.scopeType === RESTORE_SCOPES.TOURNAMENT) {
    return selectBackupSource(source, {
      scopeType: BACKUP_SCOPES.TOURNAMENT,
      tournamentId: request.tournamentId
    });
  }
  if (request.scopeType === RESTORE_SCOPES.ORGANIZATION) {
    return selectBackupSource(source, {
      scopeType: BACKUP_SCOPES.ORGANIZATION,
      tenantId: request.tenantId,
      organizationId: request.organizationId
    });
  }
  if (request.scopeType === RESTORE_SCOPES.SYSTEM) {
    return selectBackupSource(source, { scopeType: BACKUP_SCOPES.SYSTEM });
  }
  throw new RestoreEngineError("restore-scope-invalid");
}

function selectArchiveRestoreTarget(archive = {}, request = {}) {
  const manifest = plainObject(archive.manifest);
  const data = plainObject(archive.data);
  if (request.scopeType === RESTORE_SCOPES.SYSTEM) {
    if (manifest.scopeType !== BACKUP_SCOPES.SYSTEM) throw new RestoreEngineError("restore-system-backup-required");
    return cloneRestoreValue(data);
  }
  if (request.scopeType === RESTORE_SCOPES.ORGANIZATION) {
    if (![BACKUP_SCOPES.ORGANIZATION, BACKUP_SCOPES.SYSTEM].includes(manifest.scopeType)) {
      throw new RestoreEngineError("restore-organization-backup-incompatible");
    }
    if (manifest.scopeType === BACKUP_SCOPES.ORGANIZATION) return cloneRestoreValue(data);
    return filterCollectionSnapshotByOrganization(data, request.organizationId, request.tenantId);
  }
  const tournamentSnapshot = extractTournamentSnapshot(data, manifest, request.tournamentId);
  if (request.scopeType === RESTORE_SCOPES.TOURNAMENT) return tournamentSnapshot;
  if (request.scopeType === RESTORE_SCOPES.CHARREADA) return selectCharreadaSubset(tournamentSnapshot, request.charreadaId);
  throw new RestoreEngineError("restore-scope-invalid");
}

function extractTournamentSnapshot(data, manifest, tournamentId) {
  if (!tournamentId) throw new RestoreEngineError("restore-tournament-required");
  if (manifest.scopeType === BACKUP_SCOPES.TOURNAMENT) {
    if (manifest.tournamentId !== tournamentId) throw new RestoreEngineError("restore-tournament-backup-mismatch");
    return cloneRestoreValue(data);
  }
  const tournament = plainObject(data.tournaments)[tournamentId];
  if (!tournament) throw new RestoreEngineError("restore-source-tournament-not-found");
  return {
    tournament: cloneRestoreValue(tournament),
    tournamentIndex: cloneNullable(plainObject(data.tournamentIndex)[tournamentId]),
    projectionOutbox: cloneNullable(plainObject(data.projectionOutbox)[tournamentId]),
    publicTournament: cloneNullable(plainObject(data.publicTournaments)[tournamentId]),
    historyStatistics: cloneNullable(plainObject(data.historyStatistics)[tournamentId]),
    publishedScoreAudit: cloneNullable(plainObject(data.publishedScoreAudit)[tournamentId]),
    judgeAssignments: cloneNullable(plainObject(data.judgeAssignments)[tournamentId]),
    judgeEvents: filterRecordsByTournament(data.judgeEvents, tournamentId),
    criticalSettings: cloneNullable(data.criticalSettings)
  };
}

function applyTournamentSnapshot(root, tournamentId, snapshot, metadata, summary) {
  const currentTournament = plainObject(root.tournaments)[tournamentId] || {};
  const restoredTournament = cloneRestoreValue(snapshot.tournament || {});
  restoredTournament.officialScoreAudit = mergeRecords(
    currentTournament.officialScoreAudit,
    restoredTournament.officialScoreAudit
  );
  restoredTournament.officialScoreFanout = {};
  if (metadata) {
    restoredTournament.meta = plainObject(restoredTournament.meta);
    restoredTournament.meta.restore = cloneRestoreValue(metadata);
  }
  root.tournaments = plainObject(root.tournaments);
  root.tournaments[tournamentId] = restoredTournament;
  setNestedRecord(root, ["tournamentIndex"], tournamentId, snapshot.tournamentIndex);
  setNestedRecord(root, ["projectionOutbox"], tournamentId, terminalizeProjectionOutbox(snapshot.projectionOutbox, metadata));
  setNestedRecord(root, ["publicTournaments"], tournamentId, snapshot.publicTournament);
  setNestedRecord(root, ["history", "statistics"], tournamentId, snapshot.historyStatistics);
  mergeNestedRecord(root, ["audit", "publishedScores"], tournamentId, snapshot.publishedScoreAudit);
  setNestedRecord(root, ["judges", "assignments"], tournamentId, snapshot.judgeAssignments);
  mergeJudgeEvents(root, snapshot.judgeEvents, tournamentId);
  removeNestedRecord(root, ["live"], tournamentId);
  summary.tournaments += 1;
  summary.charreadas += countRecords(restoredTournament.charreadas);
  summary.scores += countRecords(restoredTournament.scores);
  summary.publicSnapshots += snapshot.publicTournament ? 1 : 0;
  summary.auditRecords += countRecords(snapshot.publishedScoreAudit) + countRecords(snapshot.judgeEvents);
}

function applyTournamentCollectionSnapshot(root, snapshot, metadata, summary, options = {}) {
  const tournaments = plainObject(snapshot.tournaments);
  for (const tournamentId of Object.keys(tournaments).sort()) {
    applyTournamentSnapshot(root, tournamentId, {
      tournament: tournaments[tournamentId],
      tournamentIndex: plainObject(snapshot.tournamentIndex)[tournamentId] || null,
      projectionOutbox: plainObject(snapshot.projectionOutbox)[tournamentId] || null,
      publicTournament: plainObject(snapshot.publicTournaments)[tournamentId] || null,
      historyStatistics: plainObject(snapshot.historyStatistics)[tournamentId] || null,
      publishedScoreAudit: plainObject(snapshot.publishedScoreAudit)[tournamentId] || null,
      judgeAssignments: plainObject(snapshot.judgeAssignments)[tournamentId] || null,
      judgeEvents: filterRecordsByTournament(snapshot.judgeEvents, tournamentId)
    }, metadata, summary);
  }
  if (options.restoreCriticalSettings && snapshot.criticalSettings) mergeCriticalSettings(root, snapshot.criticalSettings);
  if (options.restoreSystemData) {
    if (snapshot.users !== null && snapshot.users !== undefined) root.users = cloneRestoreValue(snapshot.users);
    if (snapshot.userTournamentAccess !== null && snapshot.userTournamentAccess !== undefined) {
      root.userTournamentAccess = cloneRestoreValue(snapshot.userTournamentAccess);
    }
  }
}

function applyCharreadaSnapshot(root, tournamentId, charreadaId, snapshot, metadata, summary) {
  root.tournaments = plainObject(root.tournaments);
  const currentTournament = cloneRestoreValue(root.tournaments[tournamentId] || {});
  if (!currentTournament.info?.id) throw new RestoreEngineError("restore-target-tournament-not-found");
  currentTournament.charreadas = replaceRecordByStableId(currentTournament.charreadas, charreadaId, snapshot.charreada);
  currentTournament.scores = replaceRelatedRecords(currentTournament.scores, snapshot.scores, charreadaId);
  currentTournament.publishedScores = replaceRelatedRecords(currentTournament.publishedScores, snapshot.publishedScores, charreadaId);
  currentTournament.officialScoreLedger = replaceRelatedRecords(currentTournament.officialScoreLedger, snapshot.officialScoreLedger, charreadaId);
  currentTournament.officialScoreAudit = mergeRecords(
    currentTournament.officialScoreAudit,
    snapshot.officialScoreAudit
  );
  currentTournament.officialScoreFanout = removeRelatedRecords(currentTournament.officialScoreFanout, charreadaId);
  if (metadata) {
    currentTournament.meta = plainObject(currentTournament.meta);
    currentTournament.meta.restore = cloneRestoreValue(metadata);
  }
  root.tournaments[tournamentId] = currentTournament;
  const currentOutbox = plainObject(plainObject(root.projectionOutbox)[tournamentId]);
  const withoutRelatedOutbox = removeRelatedRecords(currentOutbox, charreadaId);
  const restoredOutbox = terminalizeProjectionOutbox(snapshot.projectionOutbox, metadata);
  setNestedRecord(root, ["projectionOutbox"], tournamentId, mergeRecords(withoutRelatedOutbox, restoredOutbox));
  removeNestedRecord(root, ["publicTournaments"], tournamentId);
  mergeNestedRecord(root, ["audit", "publishedScores"], tournamentId, snapshot.publishedScoreAudit);
  setNestedRecord(root, ["judges", "assignments"], tournamentId,
    replaceRecordByStableId(plainObject(root.judges?.assignments)[tournamentId], charreadaId, snapshot.judgeAssignments));
  mergeJudgeEvents(root, snapshot.judgeEvents, tournamentId);
  removeNestedRecord(root, ["live"], tournamentId);
  summary.tournaments += 1;
  summary.charreadas += 1;
  summary.scores += countRecords(snapshot.scores);
  summary.auditRecords += countRecords(snapshot.publishedScoreAudit) + countRecords(snapshot.officialScoreAudit) + countRecords(snapshot.judgeEvents);
}

function selectCharreadaSubset(tournamentSnapshot = {}, charreadaId = "") {
  const tournament = plainObject(tournamentSnapshot.tournament);
  const charreada = findRecordByStableId(tournament.charreadas, charreadaId);
  const scores = filterRelatedRecords(tournament.scores, charreadaId);
  const publishedScores = filterRelatedRecords(tournament.publishedScores, charreadaId);
  const officialScoreLedger = filterRelatedRecords(tournament.officialScoreLedger, charreadaId);
  const recordIds = new Set(Object.keys(publishedScores));
  const officialScoreAudit = Object.fromEntries(Object.entries(plainObject(tournament.officialScoreAudit))
    .filter(([, value]) => isRelatedToCharreada(value, charreadaId) || recordIds.has(String(value?.recordId || ""))));
  const publishedScoreAudit = Object.fromEntries(Object.entries(plainObject(tournamentSnapshot.publishedScoreAudit))
    .filter(([key, value]) => recordIds.has(key) || isRelatedToCharreada(value, charreadaId)));
  const assignment = findRecordByStableId(tournamentSnapshot.judgeAssignments, charreadaId);
  return {
    tournamentContext: {
      info: cloneNullable(tournament.info),
      meta: cloneNullable(tournament.meta)
    },
    charreada: cloneNullable(charreada),
    scores: cloneRestoreValue(scores),
    publishedScores: cloneRestoreValue(publishedScores),
    officialScoreLedger: cloneRestoreValue(officialScoreLedger),
    officialScoreAudit: cloneRestoreValue(officialScoreAudit),
    projectionOutbox: cloneRestoreValue(filterRelatedRecords(tournamentSnapshot.projectionOutbox, charreadaId)),
    publishedScoreAudit: cloneRestoreValue(publishedScoreAudit),
    judgeAssignments: cloneNullable(assignment),
    judgeEvents: cloneRestoreValue(Object.fromEntries(Object.entries(plainObject(tournamentSnapshot.judgeEvents))
      .filter(([, value]) => isRelatedToCharreada(value, charreadaId))))
  };
}

function validateRestoreIdentity(archive = {}, request = {}, actor = {}) {
  const errors = [];
  const warnings = [];
  const manifest = plainObject(archive.manifest);
  const sourceTenantId = normalizeId(manifest.tenantId);
  const sourceOrganizationId = normalizeId(manifest.organizationId);
  if (sourceTenantId && request.tenantId && sourceTenantId !== request.tenantId) errors.push("restore-tenant-mismatch");
  if (sourceOrganizationId && request.organizationId && sourceOrganizationId !== request.organizationId) {
    errors.push("restore-organization-mismatch");
  }
  if (request.tenantId && actor.tenantId && request.tenantId !== actor.tenantId && actor.platformAdmin !== true) {
    errors.push("restore-actor-tenant-mismatch");
  }
  if (request.organizationId && actor.organizationId && request.organizationId !== actor.organizationId && actor.platformAdmin !== true) {
    errors.push("restore-actor-organization-mismatch");
  }
  if (!sourceTenantId) warnings.push("restore-source-tenant-legacy");
  if (!sourceOrganizationId && request.scopeType !== RESTORE_SCOPES.SYSTEM) warnings.push("restore-source-organization-legacy");
  return { valid: errors.length === 0, errors, warnings };
}

function validateRestoreTargetIdentity(target = {}, request = {}) {
  const errors = [];
  const warnings = [];
  if (request.scopeType === RESTORE_SCOPES.SYSTEM) return { valid: true, errors, warnings };
  for (const [tournamentId, tournament] of listTargetTournaments(target)) {
    const info = plainObject(tournament.info);
    const meta = plainObject(tournament.meta);
    const declaredTournamentId = normalizeId(info.id || tournamentId);
    const tenantId = normalizeId(info.tenantId || meta.tenantId);
    const organizationId = normalizeId(info.organizationId || meta.organizationId);
    if ([RESTORE_SCOPES.TOURNAMENT, RESTORE_SCOPES.CHARREADA].includes(request.scopeType)
      && declaredTournamentId !== request.tournamentId) errors.push("restore-target-tournament-mismatch");
    if (request.tenantId && tenantId && tenantId !== request.tenantId) errors.push("restore-target-tenant-mismatch");
    if (request.organizationId && organizationId && organizationId !== request.organizationId) {
      errors.push("restore-target-organization-mismatch");
    }
    if (!tenantId) warnings.push(`restore-target-tenant-legacy:${declaredTournamentId || tournamentId}`);
    if (!organizationId) warnings.push(`restore-target-organization-legacy:${declaredTournamentId || tournamentId}`);
  }
  return { valid: errors.length === 0, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings) };
}

function validateOfficialScoreIntegrity(target = {}) {
  const errors = [];
  const warnings = [];
  for (const [tournamentId, tournament] of listTargetTournaments(target)) {
    const ledgers = plainObject(tournament.officialScoreLedger);
    const publishedScores = plainObject(tournament.publishedScores);
    for (const [attemptId, ledger] of Object.entries(ledgers)) {
      const records = plainObject(ledger?.records);
      if (!Object.keys(records).length) {
        warnings.push(`restore-official-ledger-legacy:${tournamentId}:${attemptId}`);
        continue;
      }
      const activeRecordId = String(ledger.activeRecordId || "");
      const activeRecords = Object.entries(records).filter(([recordId, record]) =>
        recordId === activeRecordId && record?.superseded !== true && ["active", undefined].includes(record?.officialStatus));
      if (!activeRecordId || !records[activeRecordId]) errors.push(`restore-official-ledger-active-missing:${tournamentId}:${attemptId}`);
      if (activeRecords.length !== 1) errors.push(`restore-official-ledger-active-invalid:${tournamentId}:${attemptId}`);
      const ledgerAttemptKey = String(ledger.attemptKey || records[activeRecordId]?.attemptKey || "");
      const publicActive = Object.entries(publishedScores).filter(([, record]) =>
        String(record?.attemptKey || "") === ledgerAttemptKey && record?.superseded !== true && record?.officialStatus !== "historical");
      if (ledgerAttemptKey && (publicActive.length !== 1 || publicActive[0]?.[0] !== activeRecordId)) {
        errors.push(`restore-published-score-ledger-mismatch:${tournamentId}:${attemptId}`);
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

function normalizeRestoreTarget(input, actor) {
  const scopeType = normalizeEnum(input.scopeType, Object.values(RESTORE_SCOPES));
  const tournamentId = normalizeId(input.tournamentId);
  const charreadaId = normalizeId(input.charreadaId);
  const organizationId = normalizeId(input.organizationId || actor.organizationId);
  const tenantId = normalizeId(input.tenantId || actor.tenantId);
  const scopeId = scopeType === RESTORE_SCOPES.SYSTEM
    ? "system"
    : scopeType === RESTORE_SCOPES.ORGANIZATION
      ? organizationId
      : scopeType === RESTORE_SCOPES.CHARREADA
        ? `${tournamentId}:${charreadaId}`
        : tournamentId;
  const scopeKey = scopeType && scopeId
    ? `scope_${sha256(scopeType === RESTORE_SCOPES.SYSTEM
      ? "restore-system-global|system"
      : `${tenantId || "legacy"}|${organizationId || "unassigned"}|${scopeType}|${scopeId}`).slice(0, 40)}`
    : "";
  return {
    scopeType,
    scopeId,
    scopeKey,
    tenantId,
    organizationId,
    tournamentId,
    charreadaId,
    sourceScopeKey: normalizeScopeKey(input.sourceScopeKey),
    backupId: normalizeBackupId(input.backupId),
    safetyScopeKey: normalizeScopeKey(input.safetyScopeKey),
    safetyBackupId: normalizeBackupId(input.safetyBackupId),
    idempotencyKey: normalizeIdempotencyKey(input.idempotencyKey),
    reason: normalizeText(input.reason, 240)
  };
}

function buildConfirmationPhrase(request, backupId) {
  return `RESTORE ${request.scopeType}:${request.scopeId} FROM ${backupId}`;
}

function buildRestoreMetadata(request, plan) {
  return {
    restoreEngineVersion: RESTORE_ENGINE_VERSION,
    restoreId: request.restoreId,
    backupId: request.backupId,
    safetyBackupId: request.safetyBackupId || null,
    scopeType: plan.scopeType,
    sourceArchiveChecksum: request.sourceArchiveChecksum,
    restoredAt: request.appliedAt || request.requestedAt,
    restoredAtMs: request.appliedAtMs || request.requestedAtMs,
    restoredBy: sanitizeRestoreActor(request.actor)
  };
}

function filterCollectionSnapshotByOrganization(snapshot = {}, organizationId, tenantId) {
  const tournaments = plainObject(snapshot.tournaments);
  const ids = Object.entries(tournaments)
    .filter(([, tournament]) => normalizeId(tournament?.info?.organizationId || tournament?.meta?.organizationId) === organizationId)
    .filter(([, tournament]) => !tenantId || !normalizeId(tournament?.info?.tenantId || tournament?.meta?.tenantId)
      || normalizeId(tournament?.info?.tenantId || tournament?.meta?.tenantId) === tenantId)
    .map(([id]) => id);
  const idSet = new Set(ids);
  return {
    tournaments: pickRecords(snapshot.tournaments, idSet),
    tournamentIndex: pickRecords(snapshot.tournamentIndex, idSet),
    projectionOutbox: pickRecords(snapshot.projectionOutbox, idSet),
    publicTournaments: pickRecords(snapshot.publicTournaments, idSet),
    historyStatistics: pickRecords(snapshot.historyStatistics, idSet),
    publishedScoreAudit: pickRecords(snapshot.publishedScoreAudit, idSet),
    judgeAssignments: pickRecords(snapshot.judgeAssignments, idSet),
    judgeEvents: Object.fromEntries(Object.entries(plainObject(snapshot.judgeEvents))
      .filter(([, record]) => idSet.has(normalizeId(record?.tournamentId || record?.tournament?.id)))),
    criticalSettings: cloneNullable(snapshot.criticalSettings),
    users: null,
    userTournamentAccess: null
  };
}

function terminalizeProjectionOutbox(value, metadata) {
  const output = cloneRestoreValue(value || {});
  for (const [projectionId, jobValue] of Object.entries(plainObject(output))) {
    const job = plainObject(jobValue);
    const state = plainObject(job.state);
    if (OUTBOX_TERMINAL_STATUSES.has(String(state.status || ""))) continue;
    output[projectionId] = {
      ...job,
      state: {
        ...state,
        status: "SUPERSEDED",
        result: "RESTORED_AS_HISTORICAL",
        reason: "restore-prevented-pending-projection-replay",
        supersededBy: "restore-engine",
        updatedAt: state.updatedAt || "",
        updatedAtMs: state.updatedAtMs || 0,
        leaseOwner: "",
        leaseExpiresAt: "",
        leaseExpiresAtMs: 0
      }
    };
  }
  return output;
}

function replaceRelatedRecords(current, restored, charreadaId) {
  return mergeRecords(removeRelatedRecords(current, charreadaId), restored);
}

function removeRelatedRecords(value, charreadaId) {
  return Object.fromEntries(Object.entries(plainObject(value)).filter(([, record]) => !isRelatedToCharreada(record, charreadaId)));
}

function filterRelatedRecords(value, charreadaId) {
  return Object.fromEntries(Object.entries(plainObject(value)).filter(([, record]) => isRelatedToCharreada(record, charreadaId)));
}

function isRelatedToCharreada(record, charreadaId) {
  const candidates = [
    record?.charreadaId,
    record?.charreada?.id,
    record?.published?.charreada?.id,
    record?.score?.charreada?.id,
    record?.intent?.charreadaId,
    record?.intent?.context?.charreadaId,
    record?.projection?.charreadaId,
    record?.context?.charreadaId,
    record?.record?.charreada?.id,
    record?.projectionIntent?.charreadaId,
    record?.projectionIntent?.intent?.charreadaId
  ].map(normalizeId).filter(Boolean);
  return candidates.includes(charreadaId);
}

function replaceRecordByStableId(value, id, replacement) {
  if (Array.isArray(value)) {
    const output = cloneRestoreValue(value);
    const index = output.findIndex((entry, currentIndex) => normalizeId(entry?.id || currentIndex) === id);
    if (replacement === null || replacement === undefined) {
      if (index >= 0) output.splice(index, 1);
    } else if (index >= 0) output[index] = cloneRestoreValue(replacement);
    else output.push(cloneRestoreValue(replacement));
    return output;
  }
  const output = cloneRestoreValue(value || {});
  const key = Object.keys(output).find((candidate) => candidate === id || normalizeId(output[candidate]?.id) === id) || id;
  if (replacement === null || replacement === undefined) delete output[key];
  else output[key] = cloneRestoreValue(replacement);
  return output;
}

function findRecordByStableId(value, id) {
  if (Array.isArray(value)) return value.find((entry, index) => normalizeId(entry?.id || index) === id) || null;
  const source = plainObject(value);
  return source[id] || Object.values(source).find((entry) => normalizeId(entry?.id) === id) || null;
}

function mergeRecords(current, restored) {
  return { ...cloneRestoreValue(current || {}), ...cloneRestoreValue(restored || {}) };
}

function setNestedRecord(root, path, key, value) {
  let node = root;
  for (const segment of path) {
    node[segment] = plainObject(node[segment]);
    node = node[segment];
  }
  if (value === null || value === undefined) delete node[key];
  else node[key] = cloneRestoreValue(value);
}

function mergeNestedRecord(root, path, key, value) {
  let node = root;
  for (const segment of path) {
    node[segment] = plainObject(node[segment]);
    node = node[segment];
  }
  node[key] = mergeRecords(node[key], value);
}

function removeNestedRecord(root, path, key) {
  let node = root;
  for (const segment of path) {
    if (!node || typeof node[segment] !== "object" || Array.isArray(node[segment])) return;
    node = node[segment];
  }
  delete node[key];
}

function mergeJudgeEvents(root, restored, tournamentId) {
  root.judges = plainObject(root.judges);
  root.judges.events = plainObject(root.judges.events);
  const current = root.judges.events;
  for (const [eventId, event] of Object.entries(plainObject(restored))) {
    if (normalizeId(event?.tournamentId || event?.tournament?.id) === tournamentId) current[eventId] = cloneRestoreValue(event);
  }
}

function mergeCriticalSettings(root, settings) {
  root.settings = plainObject(root.settings);
  for (const key of ["globalRuleOverrides", "scoringButtonLayouts"]) {
    if (settings[key] !== undefined && settings[key] !== null) root.settings[key] = cloneRestoreValue(settings[key]);
  }
}

function clearTournamentCollectionScope(root, plan) {
  if (plan.scopeType === RESTORE_SCOPES.SYSTEM) {
    const sourceIds = new Set(Object.keys(plainObject(plan.sourceTarget?.tournaments)));
    root.tournaments = Object.fromEntries(Object.entries(plainObject(root.tournaments))
      .filter(([tournamentId]) => sourceIds.has(tournamentId)));
    root.tournamentIndex = {};
    root.projectionOutbox = {};
    root.publicTournaments = {};
    root.history = plainObject(root.history);
    root.history.statistics = {};
    root.judges = plainObject(root.judges);
    root.judges.assignments = {};
    root.live = {};
    return;
  }
  const restoredIds = new Set(Object.keys(plainObject(plan.sourceTarget?.tournaments)));
  const ids = Object.entries(plainObject(root.tournaments))
      .filter(([, tournament]) => normalizeId(tournament?.info?.organizationId || tournament?.meta?.organizationId) === plan.organizationId)
      .filter(([, tournament]) => !plan.tenantId || !normalizeId(tournament?.info?.tenantId || tournament?.meta?.tenantId)
        || normalizeId(tournament?.info?.tenantId || tournament?.meta?.tenantId) === plan.tenantId)
      .map(([tournamentId]) => tournamentId);
  for (const tournamentId of ids) {
    if (restoredIds.has(tournamentId)) continue;
    removeNestedRecord(root, ["tournaments"], tournamentId);
    removeNestedRecord(root, ["tournamentIndex"], tournamentId);
    removeNestedRecord(root, ["projectionOutbox"], tournamentId);
    removeNestedRecord(root, ["publicTournaments"], tournamentId);
    removeNestedRecord(root, ["history", "statistics"], tournamentId);
    removeNestedRecord(root, ["judges", "assignments"], tournamentId);
    removeNestedRecord(root, ["live"], tournamentId);
  }
}

function appendRestoreAuditToRoot(root, event) {
  root.restoreFoundation = plainObject(root.restoreFoundation);
  root.restoreFoundation.audit = plainObject(root.restoreFoundation.audit);
  root.restoreFoundation.audit[event.scopeKey] = plainObject(root.restoreFoundation.audit[event.scopeKey]);
  if (!root.restoreFoundation.audit[event.scopeKey][event.eventId]) {
    root.restoreFoundation.audit[event.scopeKey][event.eventId] = cloneRestoreValue(event);
  }
}

function buildRestoreCounts(target, scopeType) {
  if (scopeType === RESTORE_SCOPES.CHARREADA) {
    return {
      tournaments: target.tournamentContext?.info?.id ? 1 : 0,
      charreadas: target.charreada ? 1 : 0,
      scores: countRecords(target.scores),
      publishedScores: countRecords(target.publishedScores),
      officialScoreLedgers: countRecords(target.officialScoreLedger),
      projectionJobs: countRecords(target.projectionOutbox),
      auditRecords: countRecords(target.officialScoreAudit) + countRecords(target.publishedScoreAudit) + countRecords(target.judgeEvents)
    };
  }
  if (scopeType === RESTORE_SCOPES.TOURNAMENT) {
    return {
      tournaments: target.tournament?.info?.id ? 1 : 0,
      charreadas: countRecords(target.tournament?.charreadas),
      scores: countRecords(target.tournament?.scores),
      publishedScores: countRecords(target.tournament?.publishedScores),
      officialScoreLedgers: countRecords(target.tournament?.officialScoreLedger),
      projectionJobs: countRecords(target.projectionOutbox),
      auditRecords: countRecords(target.tournament?.officialScoreAudit) + countRecords(target.publishedScoreAudit) + countRecords(target.judgeEvents)
    };
  }
  const tournaments = plainObject(target.tournaments);
  return {
    tournaments: countRecords(tournaments),
    charreadas: Object.values(tournaments).reduce((sum, tournament) => sum + countRecords(tournament?.charreadas), 0),
    scores: Object.values(tournaments).reduce((sum, tournament) => sum + countRecords(tournament?.scores), 0),
    publishedScores: Object.values(tournaments).reduce((sum, tournament) => sum + countRecords(tournament?.publishedScores), 0),
    officialScoreLedgers: Object.values(tournaments).reduce((sum, tournament) => sum + countRecords(tournament?.officialScoreLedger), 0),
    projectionJobs: Object.values(plainObject(target.projectionOutbox)).reduce((sum, value) => sum + countRecords(value), 0),
    auditRecords: Object.values(plainObject(target.publishedScoreAudit)).reduce((sum, value) => sum + countRecords(value), 0)
      + countRecords(target.judgeEvents)
  };
}

function listTargetTournaments(target) {
  if (target.tournament) return [[target.tournament.info?.id || "tournament", target.tournament]];
  if (target.tournamentContext) {
    return [[target.tournamentContext.info?.id || "tournament", {
      officialScoreLedger: target.officialScoreLedger,
      publishedScores: target.publishedScores
    }]];
  }
  return Object.entries(plainObject(target.tournaments));
}

function restoreTargetExists(target, scopeType) {
  if (scopeType === RESTORE_SCOPES.CHARREADA) return Boolean(target?.charreada);
  if (scopeType === RESTORE_SCOPES.TOURNAMENT) return Boolean(target?.tournament?.info?.id);
  if ([RESTORE_SCOPES.ORGANIZATION, RESTORE_SCOPES.SYSTEM].includes(scopeType)) return countRecords(target?.tournaments) > 0;
  return false;
}

function fingerprintRestoreValue(value) {
  const cloned = cloneRestoreValue(value);
  stripRestoreMetadata(cloned);
  return sha256(stableStringify(cloned));
}

function stripRestoreMetadata(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (!Array.isArray(value) && value.meta && typeof value.meta === "object" && !Array.isArray(value.meta)) {
    delete value.meta.restore;
  }
  for (const child of Object.values(value)) stripRestoreMetadata(child, seen);
}

function cloneRestoreValue(value) {
  return cloneBackupValue(value, {
    maxDepth: 64,
    maxNodes: 2000000,
    maxArray: 500000,
    maxStringLength: 4 * 1024 * 1024
  });
}

function cloneNullable(value) {
  return value === undefined || value === null ? null : cloneRestoreValue(value);
}

function filterRecordsByTournament(value, tournamentId) {
  return Object.fromEntries(Object.entries(plainObject(value))
    .filter(([, record]) => normalizeId(record?.tournamentId || record?.tournament?.id) === tournamentId));
}

function pickRecords(value, ids) {
  return Object.fromEntries(Object.entries(plainObject(value)).filter(([id]) => ids.has(normalizeId(id))));
}

function isValidRestoreTransition(current, next, cancellationRequested, allowFailureFromAnyState) {
  if (allowFailureFromAnyState && next === RESTORE_STATUSES.FAILED && !TERMINAL_STATUSES.has(current)) return true;
  const allowed = {
    [RESTORE_STATUSES.REQUESTED]: [RESTORE_STATUSES.PREPARING, RESTORE_STATUSES.CANCELLED, RESTORE_STATUSES.FAILED],
    [RESTORE_STATUSES.PREPARING]: [RESTORE_STATUSES.APPLYING, RESTORE_STATUSES.CANCELLED, RESTORE_STATUSES.FAILED],
    [RESTORE_STATUSES.APPLYING]: [RESTORE_STATUSES.VERIFYING, RESTORE_STATUSES.FAILED],
    [RESTORE_STATUSES.VERIFYING]: [RESTORE_STATUSES.COMPLETED, RESTORE_STATUSES.FAILED]
  };
  if (next === RESTORE_STATUSES.CANCELLED && cancellationRequested !== true) return false;
  return Boolean(allowed[current]?.includes(next));
}

function sanitizeTransitionPatch(patch = {}) {
  const allowed = new Set([
    "attempts",
    "result",
    "reason",
    "lastError",
    "actualTargetFingerprint",
    "restoredFingerprint",
    "objectsRestored",
    "postValidation",
    "appliedAt",
    "appliedAtMs"
  ]);
  return Object.fromEntries(Object.entries(plainObject(patch)).filter(([key]) => allowed.has(key))
    .map(([key, value]) => [key, cloneRestoreValue(value)]));
}

function normalizeRestoreActor(actor = {}) {
  return {
    uid: normalizeText(actor.uid, 128),
    name: normalizeText(actor.name || actor.email, 160),
    role: normalizeText(actor.role, 40).toLowerCase(),
    tenantId: normalizeId(actor.tenantId),
    organizationId: normalizeId(actor.organizationId),
    platformAdmin: actor.platformAdmin === true,
    device: {
      id: normalizeText(actor.device?.id, 180),
      name: normalizeText(actor.device?.name, 180)
    }
  };
}

function sanitizeRestoreActor(actor = {}) {
  const clean = normalizeRestoreActor(actor);
  return {
    uid: clean.uid,
    name: clean.name,
    role: clean.role,
    tenantId: clean.tenantId || null,
    organizationId: clean.organizationId || null,
    platformAdmin: clean.platformAdmin,
    device: clean.device
  };
}

function sanitizeRestoreError(error) {
  if (!error) return null;
  return {
    code: normalizeText(error.code || error.name || "restore-error", 100),
    message: normalizeText(error.message || error.reason || "", 240)
      .replace(/https?:\/\/\S+/gi, "[url]")
      .replace(/(token|password|secret|credential|privateKey)\s*[:=]\s*\S+/gi, "$1=[redacted]")
  };
}

function normalizeErrorCode(error) {
  return String(error?.code || error?.message || "restore-error").replace(/^functions\//, "").slice(0, 180);
}

function normalizeScopeKey(value) {
  const clean = String(value || "");
  return SCOPE_KEY_PATTERN.test(clean) ? clean : "";
}

function normalizeBackupId(value) {
  const clean = String(value || "");
  return BACKUP_ID_PATTERN.test(clean) ? clean : "";
}

function normalizeValidationId(value) {
  const clean = String(value || "");
  return VALIDATION_ID_PATTERN.test(clean) ? clean : "";
}

function normalizeRestoreId(value) {
  const clean = String(value || "");
  return RESTORE_ID_PATTERN.test(clean) ? clean : "";
}

function normalizeIdempotencyKey(value) {
  const clean = String(value || "").trim().slice(0, 180);
  return IDEMPOTENCY_PATTERN.test(clean) ? clean : "";
}

function normalizeSecret(value) {
  const clean = String(value || "").trim();
  return /^[A-Za-z0-9_-]{32,256}$/.test(clean) ? clean : "";
}

function normalizeHash(value) {
  const clean = String(value || "").toLowerCase();
  return HASH_PATTERN.test(clean) ? clean : "";
}

function normalizeId(value) {
  const clean = String(value || "").trim();
  return ID_PATTERN.test(clean) ? clean : "";
}

function normalizeText(value, maxLength = 240) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeEnum(value, allowed) {
  const clean = String(value || "").trim().toLowerCase();
  return allowed.includes(clean) ? clean : "";
}

function positiveTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : Date.now();
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

function countRecords(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== null && entry !== undefined).length;
  return Object.values(plainObject(value)).filter((entry) => entry !== null && entry !== undefined).length;
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function uniqueStrings(values) {
  return [...new Set((values || []).map(String).filter(Boolean))];
}

module.exports = {
  RESTORE_ENGINE_VERSION,
  RESTORE_SCHEMA_VERSION,
  RESTORE_SCOPES,
  RESTORE_STATUSES,
  RESTORE_AUDIT_OPERATIONS,
  RestoreEngineError,
  validateRestoreArchive,
  prepareRestoreValidation,
  prepareRestoreRequest,
  applyRestoreClaim,
  transitionRestoreJob,
  requestRestoreCancellation,
  buildRestorePlan,
  applyRestorePlanToRoot,
  validateRestoredRoot,
  validateOfficialScoreIntegrity,
  validateRestoreTargetIdentity,
  buildRestoreAuditEvent,
  selectCurrentRestoreTarget,
  selectArchiveRestoreTarget,
  fingerprintRestoreValue,
  buildConfirmationPhrase,
  cloneRestoreValue
};
