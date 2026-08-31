"use strict";

const {
  BACKUP_AUDIT_OPERATIONS,
  BACKUP_MODES,
  BACKUP_SCOPES,
  BACKUP_STATUSES,
  BackupFoundationError,
  applyBackupClaim,
  applyBackupJobTransition,
  authorizeBackupRequest,
  buildBackupArchive,
  buildBackupAuditEvent,
  buildBackupCatalogRecord,
  cloneBackupValue,
  planBackupRetention,
  prepareBackupRequest,
  pruneBackupControl,
  requestBackupCancellation,
  selectBackupSource,
  sha256,
  stableStringify,
  validateBackupArchive,
  verifyBackupSerialization
} = require("./backupFoundation");

const BACKUP_ROOT = "charropro/backupFoundation";
const CHARROPRO_ROOT = "charropro";
const MAX_WORKER_ATTEMPTS = 5;

function createBackupRuntime(adapter, options = {}) {
  if (!adapter || typeof adapter.read !== "function" || typeof adapter.transaction !== "function") {
    throw new BackupFoundationError("backup-adapter-invalid");
  }

  async function requestBackup(input = {}, actor = {}, context = {}) {
    const controlledInput = {
      ...input,
      retentionDays: Number(options.retentionDays || 90),
      retentionCount: Number(options.retentionCount || 30)
    };
    const prepared = prepareBackupRequest(controlledInput, actor, { nowMs: adapter.now() });
    if (!prepared.valid) throw new BackupFoundationError(prepared.errors[0], prepared.errors[0], { errors: prepared.errors });
    const request = prepared.request;
    const authorizationContext = await resolveAuthorizationContext(request, context);
    const authorization = authorizeBackupRequest(request, authorizationContext);
    if (!authorization.allowed) throw new BackupFoundationError(authorization.reason);
    const controlPath = getControlPath(request.scopeKey);
    let claimOutcome = null;
    const transaction = await adapter.transaction(controlPath, (current) => {
      const claimed = applyBackupClaim(current || {}, request, { nowMs: request.requestedAtMs });
      claimOutcome = claimed.outcome;
      return claimed.control;
    });
    if (!transaction.committed || !claimOutcome) throw new BackupFoundationError("backup-claim-aborted");
    if (!claimOutcome.ok) throw new BackupFoundationError(claimOutcome.reason, claimOutcome.reason, claimOutcome);
    if (claimOutcome.expiredJob?.backupId) {
      const expiredRequest = jobToRequest(claimOutcome.expiredJob);
      await writeAudit(expiredRequest, BACKUP_AUDIT_OPERATIONS.FAILED, {
        result: "FAILED",
        status: BACKUP_STATUSES.FAILED,
        revision: claimOutcome.expiredJob.revision,
        durationMs: claimOutcome.expiredJob.durationMs,
        reason: "backup-lease-expired"
      }, `failed:${claimOutcome.expiredJob.revision}`);
    }
    await writeAudit(request, BACKUP_AUDIT_OPERATIONS.REQUESTED, {
      result: "ACCEPTED",
      status: BACKUP_STATUSES.REQUESTED,
      revision: 1
    }, "requested:1");
    return {
      ok: true,
      accepted: true,
      idempotent: claimOutcome.idempotent,
      reason: claimOutcome.reason,
      backupId: claimOutcome.backupId,
      scopeKey: request.scopeKey,
      status: claimOutcome.job?.status || BACKUP_STATUSES.REQUESTED,
      revision: Number(claimOutcome.job?.revision || 1),
      requestedAt: claimOutcome.job?.requestedAt || request.requestedAt
    };
  }

  async function cancelBackup(input = {}, actor = {}) {
    const scopeKey = normalizeScopeKey(input.scopeKey);
    const backupId = normalizeBackupId(input.backupId);
    if (!scopeKey || !backupId) throw new BackupFoundationError("backup-cancellation-request-invalid");
    let cancellationOutcome = null;
    const transaction = await adapter.transaction(getControlPath(scopeKey), (current) => {
      const cancelled = requestBackupCancellation(current || {}, backupId, actor, { nowMs: adapter.now() });
      cancellationOutcome = cancelled.outcome;
      return cancelled.control;
    });
    if (!transaction.committed || !cancellationOutcome) throw new BackupFoundationError("backup-cancellation-aborted");
    if (!cancellationOutcome.ok) throw new BackupFoundationError(cancellationOutcome.reason, cancellationOutcome.reason, cancellationOutcome);
    const request = jobToRequest(cancellationOutcome.job);
    if (cancellationOutcome.job.cancellationRequested === true && ![
      BACKUP_STATUSES.COMPLETED,
      BACKUP_STATUSES.CANCELLED,
      BACKUP_STATUSES.FAILED,
      BACKUP_STATUSES.EXPIRED
    ].includes(cancellationOutcome.job.status)) {
      await writeAudit(request, BACKUP_AUDIT_OPERATIONS.CANCELLED, {
        result: "REQUESTED",
        status: cancellationOutcome.job.status,
        revision: cancellationOutcome.job.revision,
        reason: "backup-cancellation-requested"
      }, `cancellation-requested:${cancellationOutcome.job.cancellationRequestedAtMs}`);
    }
    return {
      ok: true,
      idempotent: cancellationOutcome.idempotent,
      backupId,
      scopeKey,
      status: cancellationOutcome.job.status,
      cancellationRequested: true
    };
  }

  async function executeBackup(scopeKeyValue, backupIdValue) {
    const scopeKey = normalizeScopeKey(scopeKeyValue);
    const backupId = normalizeBackupId(backupIdValue);
    if (!scopeKey || !backupId) throw new BackupFoundationError("backup-worker-request-invalid");
    let job = await getJob(scopeKey, backupId);
    if (!job) throw new BackupFoundationError("backup-job-not-found");
    if (job.status === BACKUP_STATUSES.COMPLETED) {
      await repairTerminalAudit(job, BACKUP_AUDIT_OPERATIONS.COMPLETED, "SUCCESS", "backup-completed");
      return { ok: true, idempotent: true, status: job.status, backupId, scopeKey };
    }
    if (job.status === BACKUP_STATUSES.CANCELLED) {
      await repairTerminalAudit(job, BACKUP_AUDIT_OPERATIONS.CANCELLED, "CANCELLED", "backup-cancelled");
      return { ok: true, idempotent: true, status: job.status, backupId, scopeKey };
    }
    if (job.status === BACKUP_STATUSES.EXPIRED) {
      return { ok: true, idempotent: true, status: job.status, backupId, scopeKey };
    }
    if (job.status === BACKUP_STATUSES.FAILED) {
      await repairTerminalAudit(job, BACKUP_AUDIT_OPERATIONS.FAILED, "FAILED", job.lastError || "backup-failed");
      return { ok: false, terminal: true, status: job.status, backupId, scopeKey, reason: job.lastError || "backup-failed" };
    }

    const request = jobToRequest(job);
    try {
      await writeAudit(request, BACKUP_AUDIT_OPERATIONS.REQUESTED, {
        result: "ACCEPTED",
        status: BACKUP_STATUSES.REQUESTED,
        revision: 1
      }, "requested:1");
      job = await transitionJob(scopeKey, backupId, BACKUP_STATUSES.CAPTURING, {
        attempts: Number(job.attempts || 0) + 1,
        result: "RUNNING",
        reason: "backup-capture-started",
        lastError: ""
      });
      await writeAudit(request, BACKUP_AUDIT_OPERATIONS.STARTED, {
        result: "RUNNING",
        status: job.status,
        revision: job.revision
      }, `started:${job.revision}`);

      if (job.cancellationRequested === true) return finishCancellation(scopeKey, backupId, job);
      const source = await readConsistentSource(request);
      const archiveResult = buildBackupArchive(source, request, {
        appVersion: options.appVersion || "unknown",
        maxArchiveBytes: options.maxArchiveBytes,
        capturedAtMs: adapter.now()
      });
      const archiveValidation = validateBackupArchive(archiveResult.archive, { expectedBackupId: backupId });
      if (!archiveValidation.valid) {
        throw new BackupFoundationError("backup-archive-invalid", "El respaldo no paso validacion previa.", {
          errors: archiveValidation.errors
        });
      }

      job = await getJob(scopeKey, backupId);
      if (job.cancellationRequested === true) return finishCancellation(scopeKey, backupId, job);
      const objectPath = buildStorageObjectPath(request);
      const saved = await adapter.saveArchive(objectPath, archiveResult.serialized, {
        backupId,
        backupSchemaVersion: request.backupSchemaVersion,
        archiveChecksum: archiveResult.archiveChecksum,
        payloadFingerprint: archiveResult.payloadFingerprint,
        scopeType: request.scopeType,
        scopeId: request.scopeId
      });

      job = await getJob(scopeKey, backupId);
      if (job.cancellationRequested === true) {
        await adapter.deleteArchive(objectPath);
        return finishCancellation(scopeKey, backupId, job);
      }
      job = await transitionJob(scopeKey, backupId, BACKUP_STATUSES.UPLOADING, {
        result: "RUNNING",
        reason: saved.existing ? "backup-archive-already-stored" : "backup-archive-stored",
        storageRef: saved.storageRef,
        storageGeneration: saved.generation,
        archiveChecksum: saved.archiveChecksum || archiveResult.archiveChecksum,
        archiveSizeBytes: Number(saved.size || archiveResult.archiveSizeBytes),
        payloadFingerprint: archiveResult.payloadFingerprint,
        counts: archiveResult.counts
      });
      job = await transitionJob(scopeKey, backupId, BACKUP_STATUSES.VALIDATING, {
        result: "RUNNING",
        reason: "backup-validation-started"
      });
      const storedSerialized = await adapter.readArchive(objectPath);
      const expectedChecksum = saved.archiveChecksum || archiveResult.archiveChecksum;
      const verified = verifyBackupSerialization(storedSerialized, expectedChecksum);
      if (!verified.valid) {
        throw new BackupFoundationError("backup-storage-validation-failed", "El archivo almacenado no coincide.", {
          errors: verified.errors
        });
      }
      const storedArchive = verified.archive;
      const storedResult = {
        archive: storedArchive,
        manifest: storedArchive.manifest,
        serialized: storedSerialized,
        archiveChecksum: verified.archiveChecksum,
        archiveSizeBytes: verified.archiveSizeBytes,
        payloadFingerprint: storedArchive.manifest.integrity.payloadFingerprint,
        counts: storedArchive.manifest.counts
      };
      const completedAtMs = adapter.now();
      const catalog = buildBackupCatalogRecord(request, storedResult, {
        storageRef: saved.storageRef,
        generation: saved.generation,
        completedAt: new Date(completedAtMs).toISOString(),
        completedAtMs,
        validatedAt: new Date(completedAtMs).toISOString(),
        validatedAtMs: completedAtMs,
        durationMs: Math.max(0, completedAtMs - Number(job.startedAtMs || request.requestedAtMs))
      });
      const validationAudit = buildBackupAuditEvent(request, BACKUP_AUDIT_OPERATIONS.VALIDATED, {
        result: "VALID",
        status: BACKUP_STATUSES.VALIDATING,
        revision: job.revision,
        archiveChecksum: storedResult.archiveChecksum,
        archiveSizeBytes: storedResult.archiveSizeBytes
      }, { nowMs: completedAtMs, eventKey: `validated:${job.revision}` });
      await adapter.updateRoot({
        [`backupFoundation/catalog/${scopeKey}/${backupId}`]: catalog,
        [`backupFoundation/audit/${scopeKey}/${validationAudit.eventId}`]: validationAudit
      });
      job = await transitionJob(scopeKey, backupId, BACKUP_STATUSES.COMPLETED, {
        result: "SUCCESS",
        reason: "backup-completed",
        storageRef: saved.storageRef,
        storageGeneration: saved.generation,
        archiveChecksum: storedResult.archiveChecksum,
        archiveSizeBytes: storedResult.archiveSizeBytes,
        payloadFingerprint: storedResult.payloadFingerprint,
        counts: storedResult.counts,
        validation: catalog.validation
      });
      await writeAudit(request, BACKUP_AUDIT_OPERATIONS.COMPLETED, {
        result: "SUCCESS",
        status: job.status,
        revision: job.revision,
        durationMs: job.durationMs,
        archiveChecksum: storedResult.archiveChecksum,
        archiveSizeBytes: storedResult.archiveSizeBytes
      }, `completed:${job.revision}`);
      await enforceRetention(scopeKey, request.retention);
      return {
        ok: true,
        status: job.status,
        backupId,
        scopeKey,
        archiveChecksum: storedResult.archiveChecksum,
        archiveSizeBytes: storedResult.archiveSizeBytes,
        storageRef: saved.storageRef,
        validation: catalog.validation
      };
    } catch (error) {
      const currentJob = await getJob(scopeKey, backupId);
      if ([BACKUP_STATUSES.COMPLETED, BACKUP_STATUSES.CANCELLED, BACKUP_STATUSES.FAILED].includes(currentJob?.status)) {
        throw error;
      }
      if (currentJob?.cancellationRequested === true && [BACKUP_STATUSES.REQUESTED, BACKUP_STATUSES.CAPTURING].includes(currentJob.status)) {
        return finishCancellation(scopeKey, backupId, currentJob);
      }
      const attempts = Number(currentJob?.attempts || job?.attempts || 1);
      const retryable = isRetryableBackupError(error) && attempts < MAX_WORKER_ATTEMPTS;
      if (retryable) {
        const diagnostic = normalizeBackupDiagnostic(error, backupId);
        await transitionJob(scopeKey, backupId, currentJob.status || BACKUP_STATUSES.CAPTURING, {
          result: "RETRY",
          reason: "backup-retry-scheduled",
          lastError: normalizeErrorCode(error),
          ...diagnostic
        });
        await writeAudit(request, BACKUP_AUDIT_OPERATIONS.FAILED, {
          result: "RETRY",
          status: currentJob.status,
          revision: currentJob.revision,
          reason: normalizeErrorCode(error),
          error
        }, `retry:${attempts}`);
        throw error;
      }
      const diagnostic = normalizeBackupDiagnostic(error, backupId);
      const failedJob = await transitionJob(scopeKey, backupId, BACKUP_STATUSES.FAILED, {
        result: "FAILED",
        reason: normalizeErrorCode(error),
        lastError: normalizeErrorCode(error),
        ...diagnostic
      }, { allowFailureFromAnyState: true });
      await writeAudit(request, BACKUP_AUDIT_OPERATIONS.FAILED, {
        result: "FAILED",
        status: failedJob.status,
        revision: failedJob.revision,
        durationMs: failedJob.durationMs,
        reason: normalizeErrorCode(error),
        error
      }, `failed:${failedJob.revision}`);
      return {
        ok: false,
        terminal: true,
        status: failedJob.status,
        backupId,
        scopeKey,
        reason: normalizeErrorCode(error),
        ...diagnostic
      };
    }
  }

  async function enqueueAutomaticBackups(optionsValue = {}) {
    const source = await adapter.read(`${CHARROPRO_ROOT}/tournamentIndex`);
    const tournamentIds = Object.keys(source || {}).sort().slice(0, Number(optionsValue.maxTournaments || 5000));
    const dateKey = new Date(adapter.now()).toISOString().slice(0, 10);
    const results = [];
    const concurrency = Math.max(1, Math.min(50, Number(optionsValue.concurrency || 20)));
    for (let index = 0; index < tournamentIds.length; index += concurrency) {
      const batch = tournamentIds.slice(index, index + concurrency);
      const batchResults = await Promise.all(batch.map(async (tournamentId) => {
        const tournament = await adapter.read(`${CHARROPRO_ROOT}/tournaments/${tournamentId}`);
        if (!tournament?.info?.id) return { ok: false, skipped: true, tournamentId, reason: "backup-tournament-not-found" };
        const actor = {
          uid: "system:backup-scheduler",
          name: "CharroPro Backup Scheduler",
          role: "system",
          tenantId: tournament.info.tenantId || tournament.meta?.tenantId || "",
          organizationId: tournament.info.organizationId || tournament.meta?.organizationId || "",
          platformAdmin: true
        };
        try {
          return await requestBackup({
            mode: BACKUP_MODES.AUTOMATIC,
            backupType: "full",
            scopeType: BACKUP_SCOPES.TOURNAMENT,
            tournamentId,
            organizationId: actor.organizationId,
            idempotencyKey: `automatic:${dateKey}:${tournamentId}`,
            reason: "scheduled-daily-backup"
          }, actor, { tournament, hasTournamentAccess: true });
        } catch (error) {
          return { ok: false, tournamentId, reason: normalizeErrorCode(error) };
        }
      }));
      results.push(...batchResults);
    }
    return {
      ok: results.every((result) => result.ok),
      requested: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).length,
      results
    };
  }

  async function enforceRetention(scopeKeyValue, policy = {}) {
    const scopeKey = normalizeScopeKey(scopeKeyValue);
    if (!scopeKey) throw new BackupFoundationError("backup-scope-key-invalid");
    const catalogMap = await adapter.read(`${BACKUP_ROOT}/catalog/${scopeKey}`) || {};
    const plan = planBackupRetention(catalogMap, policy, { nowMs: adapter.now() });
    for (const backupId of plan.expire) {
      const catalog = catalogMap[backupId];
      if (!catalog?.storageRef) continue;
      const objectPath = getObjectPathFromStorageRef(catalog.storageRef);
      await adapter.deleteArchive(objectPath);
      const nowMs = adapter.now();
      await adapter.write(`${BACKUP_ROOT}/catalog/${scopeKey}/${backupId}`, {
        ...catalog,
        status: BACKUP_STATUSES.EXPIRED,
        payloadDeletedAt: new Date(nowMs).toISOString(),
        payloadDeletedAtMs: nowMs
      });
      const request = catalogToRequest(catalog);
      await writeAudit(request, BACKUP_AUDIT_OPERATIONS.EXPIRED, {
        result: "SUCCESS",
        status: BACKUP_STATUSES.EXPIRED,
        reason: "backup-retention-expired"
      }, `expired:${backupId}`);
    }
    await adapter.transaction(getControlPath(scopeKey), (current) => pruneBackupControl(current || {}, plan.expire, {
      nowMs: adapter.now(),
      days: plan.keepDays
    }));
    return plan;
  }

  async function resolveAuthorizationContext(request, context) {
    if (request.scopeType !== BACKUP_SCOPES.TOURNAMENT) return context;
    const tournament = context.tournament || await adapter.read(`${CHARROPRO_ROOT}/tournaments/${request.tournamentId}`);
    return { ...context, tournament };
  }

  async function readConsistentSource(request) {
    if (request.scopeType !== BACKUP_SCOPES.TOURNAMENT) {
      const root = await adapter.read(CHARROPRO_ROOT) || {};
      return root;
    }
    let previousFingerprint = "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const first = await readTournamentSourceOnce(request.tournamentId);
      const firstFingerprint = fingerprintBackupSource(first, request);
      const second = await readTournamentSourceOnce(request.tournamentId);
      const secondFingerprint = fingerprintBackupSource(second, request);
      if (firstFingerprint === secondFingerprint) {
        const selected = selectBackupSource(second, request);
        if (!selected.tournament?.info?.id) throw new BackupFoundationError("backup-tournament-not-found");
        return second;
      }
      previousFingerprint = `${firstFingerprint}:${secondFingerprint}`;
    }
    throw new BackupFoundationError("backup-source-unstable", "La fuente cambio durante la captura.", { fingerprint: previousFingerprint });
  }

  async function readTournamentSourceOnce(tournamentId) {
    const paths = {
      tournament: `tournaments/${tournamentId}`,
      tournamentIndex: `tournamentIndex/${tournamentId}`,
      projectionOutbox: `projectionOutbox/${tournamentId}`,
      publicTournament: `publicTournaments/${tournamentId}`,
      historyStatistics: `history/statistics/${tournamentId}`,
      publishedScoreAudit: `audit/publishedScores/${tournamentId}`,
      judgeAssignments: `judges/assignments/${tournamentId}`,
      settings: "settings"
    };
    const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await adapter.read(`${CHARROPRO_ROOT}/${path}`)]));
    const values = Object.fromEntries(entries);
    values.judgeEvents = await readJudgeEventsForTournament(tournamentId);
    return {
      tournaments: { [tournamentId]: values.tournament },
      tournamentIndex: { [tournamentId]: values.tournamentIndex },
      projectionOutbox: { [tournamentId]: values.projectionOutbox },
      publicTournaments: { [tournamentId]: values.publicTournament },
      history: { statistics: { [tournamentId]: values.historyStatistics } },
      audit: { publishedScores: { [tournamentId]: values.publishedScoreAudit } },
      judges: { assignments: { [tournamentId]: values.judgeAssignments }, events: values.judgeEvents || {} },
      settings: values.settings
    };
  }

  async function readJudgeEventsForTournament(tournamentId) {
    const path = `${CHARROPRO_ROOT}/judges/events`;
    if (typeof adapter.readByChild === "function") {
      try {
        return await adapter.readByChild(path, "tournamentId", tournamentId);
      } catch (error) {
        // The backup remains available when a legacy RTDB path lacks an index.
        const allEvents = await adapter.read(path) || {};
        return Object.fromEntries(Object.entries(allEvents)
          .filter(([, event]) => String(event?.tournamentId || "") === tournamentId));
      }
    }
    const allEvents = await adapter.read(path) || {};
    return Object.fromEntries(Object.entries(allEvents)
      .filter(([, event]) => String(event?.tournamentId || "") === tournamentId));
  }

  async function getJob(scopeKey, backupId) {
    return adapter.read(`${getControlPath(scopeKey)}/jobs/${backupId}`);
  }

  async function transitionJob(scopeKey, backupId, status, patch = {}) {
    let outcome = null;
    const transaction = await adapter.transaction(getControlPath(scopeKey), (current) => {
      const control = current || {};
      const currentJob = control.jobs?.[backupId] || {};
      const transitioned = applyBackupJobTransition(control, backupId, {
        status,
        expectedRevision: currentJob.revision,
        patch
      }, { nowMs: adapter.now() });
      outcome = transitioned.outcome;
      return transitioned.control;
    });
    if (!transaction.committed || !outcome) throw new BackupFoundationError("backup-transition-aborted");
    if (!outcome.ok) throw new BackupFoundationError(outcome.reason, outcome.reason, outcome);
    return outcome.job;
  }

  async function finishCancellation(scopeKey, backupId, job) {
    const cancelled = await transitionJob(scopeKey, backupId, BACKUP_STATUSES.CANCELLED, {
      result: "CANCELLED",
      reason: "backup-cancelled"
    });
    const request = jobToRequest(cancelled);
    await writeAudit(request, BACKUP_AUDIT_OPERATIONS.CANCELLED, {
      result: "CANCELLED",
      status: cancelled.status,
      revision: cancelled.revision,
      durationMs: cancelled.durationMs,
      reason: "backup-cancelled"
    }, `cancelled:${cancelled.revision}`);
    return { ok: false, cancelled: true, terminal: true, status: cancelled.status, backupId, scopeKey, reason: "backup-cancelled" };
  }

  async function writeAudit(request, operation, detail, eventKey) {
    const event = buildBackupAuditEvent(request, operation, detail, { nowMs: adapter.now(), eventKey });
    const transaction = await adapter.transaction(`${BACKUP_ROOT}/audit/${request.scopeKey}/${event.eventId}`, (current) => current || event);
    return transaction.value || event;
  }

  async function repairTerminalAudit(job, operation, result, reason) {
    const request = jobToRequest(job);
    return writeAudit(request, operation, {
      result,
      status: job.status,
      revision: job.revision,
      durationMs: job.durationMs,
      reason,
      archiveChecksum: job.archiveChecksum,
      archiveSizeBytes: job.archiveSizeBytes
    }, `${operation === BACKUP_AUDIT_OPERATIONS.COMPLETED ? "completed" : operation === BACKUP_AUDIT_OPERATIONS.CANCELLED ? "cancelled" : "failed"}:${job.revision}`);
  }

  return {
    requestBackup,
    cancelBackup,
    executeBackup,
    enqueueAutomaticBackups,
    enforceRetention
  };
}

function fingerprintBackupSource(source, request) {
  return sha256(stableStringify(cloneBackupValue(selectBackupSource(source, request))));
}

function createFirebaseBackupAdapter(admin, options = {}) {
  const database = admin.database();
  const bucketName = String(options.bucketName || "").trim();
  const getBucket = () => admin.storage().bucket(bucketName || undefined);
  return {
    now: () => Date.now(),
    async read(path) {
      const snapshot = await database.ref(path).get();
      return snapshot.val();
    },
    async write(path, value) {
      await database.ref(path).set(value);
    },
    async readByChild(path, child, value) {
      const snapshot = await database.ref(path).orderByChild(child).equalTo(value).get();
      return snapshot.val();
    },
    async updateRoot(updates) {
      await database.ref(CHARROPRO_ROOT).update(JSON.parse(JSON.stringify(updates)));
    },
    async transaction(path, updater) {
      let outcomeValue = null;
      const result = await database.ref(path).transaction((current) => {
        // Firebase Admin rejects null-prototype objects returned by the safe backup clone.
        outcomeValue = JSON.parse(JSON.stringify(updater(current)));
        return outcomeValue;
      }, undefined, false);
      return { committed: result.committed, value: result.snapshot.val() };
    },
    async saveArchive(objectPath, serialized, metadata = {}) {
      const bucket = getBucket();
      const file = bucket.file(objectPath);
      let existing = false;
      try {
        await file.save(Buffer.from(serialized, "utf8"), {
          resumable: false,
          validation: false,
          contentType: "application/json",
          metadata: {
            cacheControl: "no-store",
            contentDisposition: "attachment",
            metadata: Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value ?? "")]))
          },
          preconditionOpts: { ifGenerationMatch: 0 }
        });
      } catch (error) {
        if (Number(error?.code) !== 412) {
          throw createBackupStorageError("OBJECT_WRITE", error, bucket, objectPath);
        }
        existing = true;
      }
      let storedMetadata;
      try {
        [storedMetadata] = await file.getMetadata();
      } catch (error) {
        throw createBackupStorageError("OBJECT_METADATA", error, bucket, objectPath);
      }
      return {
        existing,
        storageRef: `gs://${bucket.name}/${objectPath}`,
        objectPath,
        generation: String(storedMetadata.generation || ""),
        size: Number(storedMetadata.size || 0),
        archiveChecksum: String(storedMetadata.metadata?.archiveChecksum || "")
      };
    },
    async readArchive(objectPath) {
      const bucket = getBucket();
      try {
        const [buffer] = await bucket.file(objectPath).download();
        return buffer.toString("utf8");
      } catch (error) {
        throw createBackupStorageError("OBJECT_READ", error, bucket, objectPath);
      }
    },
    async deleteArchive(objectPath) {
      if (!objectPath) return;
      try {
        await getBucket().file(objectPath).delete();
      } catch (error) {
        if (Number(error?.code) !== 404) throw error;
      }
    }
  };
}

function buildStorageObjectPath(request) {
  const date = String(request.requestedAt || "").slice(0, 10).replace(/-/g, "/") || "undated";
  return [
    "charropro-backups",
    "v1",
    request.tenantId || "legacy",
    request.organizationId || "unassigned",
    request.scopeType,
    request.scopeId,
    date,
    `${request.backupId}.json`
  ].join("/");
}

function jobToRequest(job = {}) {
  return {
    backupFoundationVersion: job.jobVersion,
    backupSchemaVersion: "charropro-backup/1",
    archiveVersion: 1,
    backupId: job.backupId,
    requestId: job.requestId,
    requestFingerprint: job.requestFingerprint,
    idempotencyKey: job.idempotencyKey,
    backupType: job.backupType,
    mode: job.mode,
    scopeType: job.scopeType,
    scopeId: job.scopeId,
    scopeKey: job.scopeKey,
    tenantId: job.tenantId || "",
    organizationId: job.organizationId || "",
    tournamentId: job.tournamentId || "",
    actor: job.actor,
    source: job.source,
    reason: job.reason,
    requestedAt: job.requestedAt,
    requestedAtMs: job.requestedAtMs,
    retention: job.retention
  };
}

function catalogToRequest(catalog = {}) {
  return {
    backupId: catalog.backupId,
    requestId: `retention_${catalog.backupId}`,
    scopeType: catalog.scopeType,
    scopeId: catalog.scopeId,
    scopeKey: catalog.scopeKey,
    tenantId: catalog.tenantId || "",
    organizationId: catalog.organizationId || "",
    tournamentId: catalog.tournamentId || "",
    actor: { uid: "system:backup-retention", name: "CharroPro Backup Retention", role: "system" },
    source: "backup-retention"
  };
}

function isRetryableBackupError(error) {
  const code = normalizeErrorCode(error).toLowerCase();
  if ([
    "backup-archive-invalid",
    "backup-value-not-serializable",
    "backup-dangerous-key",
    "backup-archive-too-large",
    "backup-storage-bucket-not-found",
    "backup-storage-object-not-found"
  ].includes(code)) return false;
  return ["timeout", "network", "unavailable", "disconnected", "aborted", "storage", "source-unstable", "econn"].some((token) => code.includes(token));
}

function normalizeErrorCode(error) {
  return String(error?.code || error?.message || "backup-error").replace(/^functions\//, "").slice(0, 160);
}

function createBackupStorageError(stage, error, bucket, objectPath) {
  const storageCode = String(error?.code || "storage-error").slice(0, 80);
  const bucketName = String(bucket?.name || "").slice(0, 180);
  const safeObjectPath = normalizeStorageObjectPath(objectPath);
  const code = storageCode === "404" && stage === "OBJECT_WRITE"
    ? "backup-storage-bucket-not-found"
    : storageCode === "404"
      ? "backup-storage-object-not-found"
      : `backup-storage-${String(stage || "operation").toLowerCase().replace(/_/g, "-")}-failed`;
  return new BackupFoundationError(code, code, {
    backupStage: stage,
    storageCode,
    bucket: bucketName,
    objectPath: safeObjectPath
  });
}

function normalizeBackupDiagnostic(error, backupId = "") {
  const details = error instanceof BackupFoundationError && error.details && typeof error.details === "object"
    ? error.details
    : {};
  return {
    failureStage: String(details.backupStage || "BACKUP_RUNTIME").slice(0, 80),
    failureCode: String(details.storageCode || normalizeErrorCode(error)).slice(0, 160),
    failureBucket: String(details.bucket || "").slice(0, 180),
    failureObjectPath: normalizeStorageObjectPath(details.objectPath),
    diagnosticId: String(backupId || "").slice(0, 80)
  };
}

function normalizeStorageObjectPath(value) {
  const clean = String(value || "").replace(/^\/+/, "").slice(0, 500);
  return /^[A-Za-z0-9._/-]*$/.test(clean) ? clean : "";
}

function getControlPath(scopeKey) {
  return `${BACKUP_ROOT}/control/${scopeKey}`;
}

function getObjectPathFromStorageRef(storageRef) {
  return String(storageRef || "").replace(/^gs:\/\/[^/]+\//, "");
}

function normalizeScopeKey(value) {
  const clean = String(value || "");
  return /^scope_[a-f0-9]{40}$/.test(clean) ? clean : "";
}

function normalizeBackupId(value) {
  const clean = String(value || "");
  return /^backup_[a-f0-9]{40}$/.test(clean) ? clean : "";
}

module.exports = {
  BACKUP_ROOT,
  createBackupRuntime,
  createFirebaseBackupAdapter,
  buildStorageObjectPath,
  getObjectPathFromStorageRef
};
