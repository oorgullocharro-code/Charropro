"use strict";

const { randomBytes } = require("node:crypto");
const {
  RESTORE_AUDIT_OPERATIONS,
  RESTORE_STATUSES,
  RestoreEngineError,
  applyRestoreClaim,
  applyRestorePlanToRoot,
  buildRestoreAuditEvent,
  buildRestorePlan,
  cloneRestoreValue,
  fingerprintRestoreValue,
  prepareRestoreRequest,
  prepareRestoreValidation,
  requestRestoreCancellation,
  selectArchiveRestoreTarget,
  selectCurrentRestoreTarget,
  transitionRestoreJob,
  validateRestoreArchive,
  validateRestoredRoot
} = require("./restoreEngine");

const RESTORE_ROOT = "charropro/restoreFoundation";
const BACKUP_ROOT = "charropro/backupFoundation";
const CHARROPRO_ROOT = "charropro";

function createRestoreRuntime(adapter, options = {}) {
  if (!adapter || typeof adapter.read !== "function" || typeof adapter.readArchive !== "function"
    || typeof adapter.transaction !== "function" || typeof adapter.now !== "function") {
    throw new RestoreEngineError("restore-adapter-invalid");
  }

  async function validateRestore(input = {}, actor = {}) {
    const sourceCatalog = await readCatalog(input.sourceScopeKey, input.backupId);
    if (!sourceCatalog) throw new RestoreEngineError("restore-backup-not-found");
    const sourceValidation = await readAndValidateArchive(sourceCatalog);
    const currentRoot = await adapter.read(CHARROPRO_ROOT) || {};
    let safetyValidation = null;
    if (input.safetyScopeKey || input.safetyBackupId) {
      const safetyCatalog = await readCatalog(input.safetyScopeKey, input.safetyBackupId);
      if (!safetyCatalog) throw new RestoreEngineError("restore-safety-backup-not-found");
      safetyValidation = await readAndValidateArchive(safetyCatalog);
    }
    const prepared = prepareRestoreValidation(input, actor, {
      sourceValidation,
      safetyValidation,
      currentRoot
    }, {
      nowMs: adapter.now(),
      confirmationToken: randomBytes(32).toString("base64url"),
      validationTtlMs: options.validationTtlMs
    });
    if (!prepared.valid) throw new RestoreEngineError(prepared.errors[0], prepared.errors[0], {
      errors: prepared.errors,
      warnings: prepared.warnings
    });

    const validationPath = `${RESTORE_ROOT}/validations/${prepared.record.validationId}`;
    const stored = await adapter.transaction(validationPath, (current) => current || prepared.record);
    if (!stored.committed) throw new RestoreEngineError("restore-validation-write-aborted");
    const validationRecord = stored.value || prepared.record;
    await writeAudit(validationRecordToRequest(validationRecord), RESTORE_AUDIT_OPERATIONS.VALIDATED, {
      result: "VALID",
      status: RESTORE_STATUSES.VALIDATED,
      reason: "restore-preflight-completed",
      fingerprint: validationRecord.expectedRestoredFingerprint,
      objectsRestored: validationRecord.counts
    }, "validated");

    return {
      ok: true,
      valid: true,
      validationId: validationRecord.validationId,
      confirmationToken: prepared.confirmationToken,
      confirmationPhrase: prepared.confirmationPhrase,
      expiresAt: validationRecord.expiresAt,
      scopeType: validationRecord.request.scopeType,
      scopeId: validationRecord.request.scopeId,
      backupId: validationRecord.request.backupId,
      safetyBackupId: validationRecord.request.safetyBackupId || "",
      targetExists: prepared.plan.targetExists,
      expectedTargetFingerprint: validationRecord.expectedTargetFingerprint,
      expectedRestoredFingerprint: validationRecord.expectedRestoredFingerprint,
      counts: validationRecord.counts,
      warnings: validationRecord.warnings
    };
  }

  async function requestRestore(input = {}, actor = {}) {
    const validationId = normalizeValidationId(input.validationId);
    if (!validationId) throw new RestoreEngineError("restore-validation-invalid");
    let outcome = null;
    let request = null;
    const transaction = await adapter.transaction(CHARROPRO_ROOT, (currentRootValue) => {
      const currentRoot = currentRootValue || {};
      const validation = currentRoot.restoreFoundation?.validations?.[validationId];
      const prepared = prepareRestoreRequest(input, actor, validation || {}, { nowMs: adapter.now() });
      if (!prepared.valid) {
        outcome = { ok: false, reason: prepared.errors[0], errors: prepared.errors };
        return undefined;
      }
      request = prepared.request;
      if (prepared.idempotent && validation.requestedRestore) {
        outcome = {
          ok: true,
          idempotent: true,
          reason: "restore-request-already-confirmed",
          restoreId: validation.restoreId,
          job: validation.requestedRestore
        };
        return currentRoot;
      }
      const control = currentRoot.restoreFoundation?.control?.[request.scopeKey] || {};
      const claimed = applyRestoreClaim(control, request, { nowMs: request.requestedAtMs });
      outcome = claimed.outcome;
      if (!outcome.ok) return undefined;
      const root = { ...currentRoot };
      root.restoreFoundation = { ...(currentRoot.restoreFoundation || {}) };
      root.restoreFoundation.control = { ...(root.restoreFoundation.control || {}), [request.scopeKey]: claimed.control };
      root.restoreFoundation.validations = { ...(root.restoreFoundation.validations || {}) };
      root.restoreFoundation.validations[validationId] = {
        ...validation,
        used: true,
        usedAt: request.requestedAt,
        usedAtMs: request.requestedAtMs,
        restoreId: request.restoreId,
        requestedRestore: request
      };
      return root;
    });
    if (!transaction.committed || !outcome) throw new RestoreEngineError(outcome?.reason || "restore-request-aborted", outcome?.reason, outcome || {});
    if (!outcome.ok) throw new RestoreEngineError(outcome.reason, outcome.reason, outcome);
    const acceptedRequest = request || outcome.job;
    await writeAudit(acceptedRequest, RESTORE_AUDIT_OPERATIONS.REQUESTED, {
      result: "ACCEPTED",
      status: RESTORE_STATUSES.REQUESTED,
      reason: outcome.reason,
      revision: outcome.job?.revision || 1
    }, "requested");
    return {
      ok: true,
      accepted: true,
      idempotent: outcome.idempotent === true,
      restoreId: outcome.restoreId,
      scopeKey: acceptedRequest.scopeKey,
      status: outcome.job?.status || RESTORE_STATUSES.REQUESTED,
      revision: outcome.job?.revision || 1
    };
  }

  async function cancelRestore(input = {}, actor = {}) {
    const scopeKey = normalizeScopeKey(input.scopeKey);
    const restoreId = normalizeRestoreId(input.restoreId);
    if (!scopeKey || !restoreId) throw new RestoreEngineError("restore-cancellation-request-invalid");
    let outcome = null;
    const transaction = await adapter.transaction(getControlPath(scopeKey), (current) => {
      const cancelled = requestRestoreCancellation(current || {}, restoreId, actor, { nowMs: adapter.now() });
      outcome = cancelled.outcome;
      return cancelled.control;
    });
    if (!transaction.committed || !outcome) throw new RestoreEngineError("restore-cancellation-aborted");
    if (!outcome.ok) throw new RestoreEngineError(outcome.reason, outcome.reason, outcome);
    await writeAudit(jobToRequest(outcome.job), RESTORE_AUDIT_OPERATIONS.CANCELLED, {
      result: "REQUESTED",
      status: outcome.job.status,
      reason: outcome.reason,
      revision: outcome.job.revision
    }, "cancellation-requested");
    return {
      ok: true,
      idempotent: outcome.idempotent === true,
      restoreId,
      scopeKey,
      status: outcome.job.status,
      cancellationRequested: true
    };
  }

  async function executeRestore(scopeKeyValue, restoreIdValue) {
    const scopeKey = normalizeScopeKey(scopeKeyValue);
    const restoreId = normalizeRestoreId(restoreIdValue);
    if (!scopeKey || !restoreId) throw new RestoreEngineError("restore-worker-request-invalid");
    let job = await getJob(scopeKey, restoreId);
    if (!job) throw new RestoreEngineError("restore-job-not-found");
    if (job.status === RESTORE_STATUSES.COMPLETED) {
      await repairTerminalAudit(job, RESTORE_AUDIT_OPERATIONS.COMPLETED, "SUCCESS", "restore-completed");
      await writeRestoreCatalog(job, {
        summary: job.objectsRestored || {},
        postValidation: job.postValidation || { actualFingerprint: job.restoredFingerprint }
      });
      return { ok: true, idempotent: true, status: job.status, restoreId, scopeKey };
    }
    if (job.status === RESTORE_STATUSES.CANCELLED) {
      await repairTerminalAudit(job, RESTORE_AUDIT_OPERATIONS.CANCELLED, "CANCELLED", "restore-cancelled");
      return { ok: false, idempotent: true, cancelled: true, status: job.status, restoreId, scopeKey };
    }
    if (job.status === RESTORE_STATUSES.FAILED) {
      return { ok: false, terminal: true, status: job.status, restoreId, scopeKey, reason: job.lastError || "restore-failed" };
    }

    const workerClaim = await claimWorker(scopeKey, restoreId);
    if (!workerClaim.claimed) {
      return {
        ok: true,
        pending: true,
        idempotent: true,
        status: workerClaim.job.status,
        restoreId,
        scopeKey,
        reason: "restore-worker-already-running"
      };
    }
    job = workerClaim.job;
    const request = jobToRequest(job);
    try {
      await writeAudit(request, RESTORE_AUDIT_OPERATIONS.STARTED, {
        result: "RUNNING",
        status: job.status,
        reason: "restore-worker-started",
        revision: job.revision
      }, `started:${job.revision}`);
      if (job.cancellationRequested === true) return finishCancellation(scopeKey, restoreId, job);

      const sourceCatalog = await readCatalog(job.sourceScopeKey, job.backupId);
      if (!sourceCatalog) throw new RestoreEngineError("restore-backup-not-found");
      const sourceValidation = await readAndValidateArchive(sourceCatalog);
      if (!sourceValidation.valid) throw new RestoreEngineError(sourceValidation.errors[0], sourceValidation.errors[0], sourceValidation);
      if (sourceValidation.archiveChecksum !== job.sourceArchiveChecksum) throw new RestoreEngineError("restore-source-changed-after-validation");
      if (sourceValidation.payloadFingerprint !== job.sourcePayloadFingerprint) throw new RestoreEngineError("restore-source-payload-changed-after-validation");

      let safetyValidation = null;
      if (job.safetyBackupId) {
        const safetyCatalog = await readCatalog(job.safetyScopeKey, job.safetyBackupId);
        if (!safetyCatalog) throw new RestoreEngineError("restore-safety-backup-not-found");
        safetyValidation = await readAndValidateArchive(safetyCatalog);
        if (!safetyValidation.valid) throw new RestoreEngineError(safetyValidation.errors[0], safetyValidation.errors[0], safetyValidation);
        if (safetyValidation.archiveChecksum !== job.safetyArchiveChecksum) throw new RestoreEngineError("restore-safety-backup-changed-after-validation");
      }

      const currentRoot = await adapter.read(CHARROPRO_ROOT) || {};
      const currentTargetFingerprint = fingerprintRestoreValue(selectCurrentRestoreTarget(currentRoot, job));
      const recoveringAppliedPromotion = [RESTORE_STATUSES.APPLYING, RESTORE_STATUSES.VERIFYING].includes(job.status)
        && currentTargetFingerprint === job.expectedRestoredFingerprint;
      const plan = buildRestorePlan(sourceValidation.archive, currentRoot, job, {
        sourceArchiveChecksum: sourceValidation.archiveChecksum,
        validatedAtMs: adapter.now()
      });
      if (recoveringAppliedPromotion) {
        plan.expectedTargetFingerprint = job.expectedTargetFingerprint;
        plan.expectedRestoredFingerprint = job.expectedRestoredFingerprint;
        plan.planFingerprint = job.planFingerprint;
      } else {
        assertPlanMatchesJob(plan, job);
      }
      if (plan.targetExists) {
        if (!safetyValidation?.archive) throw new RestoreEngineError("restore-safety-backup-required");
        const safetyFingerprint = fingerprintRestoreValue(selectArchiveRestoreTarget(safetyValidation.archive, job));
        if (safetyFingerprint !== job.expectedTargetFingerprint) throw new RestoreEngineError("restore-safety-backup-not-current");
      }

      job = await getJob(scopeKey, restoreId);
      if (job.cancellationRequested === true) return finishCancellation(scopeKey, restoreId, job);
      if (job.status === RESTORE_STATUSES.PREPARING) {
        job = await transitionJob(scopeKey, restoreId, RESTORE_STATUSES.APPLYING, {
          result: "RUNNING",
          reason: "restore-atomic-promotion-started"
        });
      }
      const appliedAtMs = adapter.now();
      const appliedRequest = { ...request, appliedAt: new Date(appliedAtMs).toISOString(), appliedAtMs };
      let applyOutcome = null;
      if (recoveringAppliedPromotion) {
        const postValidation = validateRestoredRoot(currentRoot, plan);
        if (!postValidation.valid) throw new RestoreEngineError(postValidation.errors[0], postValidation.errors[0], postValidation);
        applyOutcome = {
          ok: true,
          recovered: true,
          summary: Object.keys(job.objectsRestored || {}).length ? job.objectsRestored : summaryFromCounts(plan.counts),
          postValidation
        };
      } else {
        const promotion = await adapter.transaction(CHARROPRO_ROOT, (currentRootValue) => {
          const latestRoot = currentRootValue || {};
          const actualFingerprint = fingerprintRestoreValue(selectCurrentRestoreTarget(latestRoot, plan));
          if (actualFingerprint !== job.expectedTargetFingerprint) {
            applyOutcome = { ok: false, reason: "restore-target-changed-after-validation", actualFingerprint };
            return undefined;
          }
          const applied = applyRestorePlanToRoot(latestRoot, plan, appliedRequest);
          const postValidation = validateRestoredRoot(applied.root, plan);
          if (!postValidation.valid) {
            applyOutcome = { ok: false, reason: postValidation.errors[0], postValidation };
            return undefined;
          }
          applyOutcome = { ok: true, summary: applied.summary, postValidation };
          return applied.root;
        });
        if (!promotion.committed || !applyOutcome?.ok) {
          throw new RestoreEngineError(applyOutcome?.reason || "restore-atomic-promotion-aborted", applyOutcome?.reason, applyOutcome || {});
        }
      }

      await writeAudit(appliedRequest, RESTORE_AUDIT_OPERATIONS.APPLIED, {
        result: "SUCCESS",
        status: RESTORE_STATUSES.APPLYING,
        reason: applyOutcome.recovered ? "restore-atomic-promotion-recovered" : "restore-atomic-promotion-applied",
        fingerprint: applyOutcome.postValidation.actualFingerprint,
        objectsRestored: applyOutcome.summary
      }, "applied");

      if (job.status !== RESTORE_STATUSES.VERIFYING) {
        job = await transitionJob(scopeKey, restoreId, RESTORE_STATUSES.VERIFYING, {
          result: "RUNNING",
          reason: applyOutcome.recovered ? "restore-post-validation-resumed" : "restore-post-validation-started",
          actualTargetFingerprint: job.expectedTargetFingerprint,
          restoredFingerprint: applyOutcome.postValidation.actualFingerprint,
          objectsRestored: applyOutcome.summary,
          appliedAt: appliedRequest.appliedAt,
          appliedAtMs
        });
      }
      await writeAudit(appliedRequest, RESTORE_AUDIT_OPERATIONS.VERIFIED, {
        result: "VALID",
        status: job.status,
        reason: "restore-post-validation-passed",
        revision: job.revision,
        fingerprint: applyOutcome.postValidation.actualFingerprint,
        objectsRestored: applyOutcome.summary
      }, `verified:${job.revision}`);

      const completedJob = await transitionJob(scopeKey, restoreId, RESTORE_STATUSES.COMPLETED, {
        result: "SUCCESS",
        reason: "restore-completed",
        restoredFingerprint: applyOutcome.postValidation.actualFingerprint,
        objectsRestored: applyOutcome.summary,
        postValidation: applyOutcome.postValidation
      });
      await writeAudit(appliedRequest, RESTORE_AUDIT_OPERATIONS.COMPLETED, {
        result: "SUCCESS",
        status: completedJob.status,
        reason: "restore-completed",
        revision: completedJob.revision,
        durationMs: completedJob.durationMs,
        fingerprint: applyOutcome.postValidation.actualFingerprint,
        objectsRestored: applyOutcome.summary
      }, `completed:${completedJob.revision}`);
      await writeRestoreCatalog(completedJob, applyOutcome);
      return {
        ok: true,
        status: completedJob.status,
        restoreId,
        scopeKey,
        restoredFingerprint: applyOutcome.postValidation.actualFingerprint,
        objectsRestored: applyOutcome.summary,
        postValidation: applyOutcome.postValidation
      };
    } catch (error) {
      const currentJob = await getJob(scopeKey, restoreId);
      if (currentJob?.status === RESTORE_STATUSES.CANCELLED) return { ok: false, cancelled: true, terminal: true, status: currentJob.status, restoreId, scopeKey };
      if (currentJob?.cancellationRequested === true && [RESTORE_STATUSES.REQUESTED, RESTORE_STATUSES.PREPARING].includes(currentJob.status)) {
        return finishCancellation(scopeKey, restoreId, currentJob);
      }
      if ([RESTORE_STATUSES.APPLYING, RESTORE_STATUSES.VERIFYING].includes(currentJob?.status)) {
        try {
          const latestRoot = await adapter.read(CHARROPRO_ROOT) || {};
          const latestFingerprint = fingerprintRestoreValue(selectCurrentRestoreTarget(latestRoot, currentJob));
          if (latestFingerprint === currentJob.expectedRestoredFingerprint) throw error;
        } catch (recoveryError) {
          if (recoveryError === error) throw error;
        }
      }
      const failed = await transitionJob(scopeKey, restoreId, RESTORE_STATUSES.FAILED, {
        result: "FAILED",
        reason: normalizeErrorCode(error),
        lastError: normalizeErrorCode(error)
      }, { allowFailureFromAnyState: true });
      await writeAudit(request, RESTORE_AUDIT_OPERATIONS.FAILED, {
        result: "FAILED",
        status: failed.status,
        reason: normalizeErrorCode(error),
        revision: failed.revision,
        durationMs: failed.durationMs,
        error
      }, `failed:${failed.revision}`);
      return { ok: false, terminal: true, status: failed.status, restoreId, scopeKey, reason: normalizeErrorCode(error) };
    }
  }

  async function readCatalog(scopeKeyValue, backupIdValue) {
    const scopeKey = normalizeScopeKey(scopeKeyValue);
    const backupId = normalizeBackupId(backupIdValue);
    if (!scopeKey || !backupId) return null;
    return adapter.read(`${BACKUP_ROOT}/catalog/${scopeKey}/${backupId}`);
  }

  async function readAndValidateArchive(catalog) {
    const serialized = await adapter.readArchive(catalog.storageRef);
    return validateRestoreArchive(serialized, catalog);
  }

  async function getJob(scopeKey, restoreId) {
    return adapter.read(`${getControlPath(scopeKey)}/jobs/${restoreId}`);
  }

  async function claimWorker(scopeKey, restoreId) {
    const leaseId = `worker_${randomBytes(16).toString("hex")}`;
    let outcome = null;
    const transaction = await adapter.transaction(getControlPath(scopeKey), (currentValue) => {
      const control = cloneRestoreValue(currentValue || {});
      control.jobs = control.jobs || {};
      const current = control.jobs[restoreId];
      if (!current) {
        outcome = { ok: false, reason: "restore-job-not-found" };
        return undefined;
      }
      const nowMs = adapter.now();
      const activeLease = Number(current.workerLeaseExpiresAtMs || 0) > nowMs;
      if (current.status !== RESTORE_STATUSES.REQUESTED && activeLease) {
        outcome = { ok: true, claimed: false, job: current };
        return control;
      }
      if (![RESTORE_STATUSES.REQUESTED, RESTORE_STATUSES.PREPARING, RESTORE_STATUSES.APPLYING, RESTORE_STATUSES.VERIFYING].includes(current.status)) {
        outcome = { ok: true, claimed: false, job: current };
        return control;
      }
      const next = {
        ...current,
        status: current.status === RESTORE_STATUSES.REQUESTED ? RESTORE_STATUSES.PREPARING : current.status,
        revision: Number(current.revision || 0) + 1,
        attempts: Number(current.attempts || 0) + 1,
        result: "RUNNING",
        reason: current.status === RESTORE_STATUSES.REQUESTED ? "restore-preparation-started" : "restore-worker-resumed",
        lastError: "",
        workerLeaseId: leaseId,
        workerLeaseExpiresAt: new Date(nowMs + 15 * 60 * 1000).toISOString(),
        workerLeaseExpiresAtMs: nowMs + 15 * 60 * 1000,
        startedAt: current.startedAt || new Date(nowMs).toISOString(),
        startedAtMs: current.startedAtMs || nowMs,
        updatedAt: new Date(nowMs).toISOString(),
        updatedAtMs: nowMs
      };
      control.jobs[restoreId] = next;
      control.lock = {
        restoreId,
        requestId: current.requestId,
        leaseId,
        leaseExpiresAt: next.workerLeaseExpiresAt,
        leaseExpiresAtMs: next.workerLeaseExpiresAtMs
      };
      outcome = { ok: true, claimed: true, job: next };
      return control;
    });
    if (!transaction.committed || !outcome?.ok) throw new RestoreEngineError(outcome?.reason || "restore-worker-claim-aborted");
    return outcome;
  }

  async function transitionJob(scopeKey, restoreId, status, patch = {}, optionsValue = {}) {
    let outcome = null;
    const transaction = await adapter.transaction(getControlPath(scopeKey), (current) => {
      const control = current || {};
      const currentJob = control.jobs?.[restoreId] || {};
      const transitioned = transitionRestoreJob(control, restoreId, {
        status,
        expectedRevision: currentJob.revision,
        patch,
        allowFailureFromAnyState: optionsValue.allowFailureFromAnyState === true
      }, { nowMs: adapter.now() });
      outcome = transitioned.outcome;
      return transitioned.control;
    });
    if (!transaction.committed || !outcome) throw new RestoreEngineError("restore-transition-aborted");
    if (!outcome.ok) throw new RestoreEngineError(outcome.reason, outcome.reason, outcome);
    return outcome.job;
  }

  async function finishCancellation(scopeKey, restoreId, job) {
    const cancelled = await transitionJob(scopeKey, restoreId, RESTORE_STATUSES.CANCELLED, {
      result: "CANCELLED",
      reason: "restore-cancelled"
    });
    const request = jobToRequest(cancelled);
    await writeAudit(request, RESTORE_AUDIT_OPERATIONS.CANCELLED, {
      result: "CANCELLED",
      status: cancelled.status,
      reason: "restore-cancelled",
      revision: cancelled.revision,
      durationMs: cancelled.durationMs
    }, `cancelled:${cancelled.revision}`);
    return { ok: false, cancelled: true, terminal: true, status: cancelled.status, restoreId, scopeKey, reason: "restore-cancelled" };
  }

  async function writeAudit(request, operation, detail, eventKey) {
    const event = buildRestoreAuditEvent(request, operation, detail, { nowMs: adapter.now(), eventKey });
    const transaction = await adapter.transaction(`${RESTORE_ROOT}/audit/${request.scopeKey}/${event.eventId}`, (current) => current || event);
    return transaction.value || event;
  }

  async function repairTerminalAudit(job, operation, result, reason) {
    return writeAudit(jobToRequest(job), operation, {
      result,
      status: job.status,
      reason,
      revision: job.revision,
      durationMs: job.durationMs,
      fingerprint: job.restoredFingerprint,
      objectsRestored: job.objectsRestored
    }, `${operation}:${job.revision}`);
  }

  async function writeRestoreCatalog(job, outcome) {
    const catalog = {
      catalogVersion: "1.0.0",
      restoreId: job.restoreId,
      validationId: job.validationId,
      status: RESTORE_STATUSES.COMPLETED,
      scopeType: job.scopeType,
      scopeId: job.scopeId,
      scopeKey: job.scopeKey,
      tenantId: job.tenantId || null,
      organizationId: job.organizationId || null,
      tournamentId: job.tournamentId || null,
      charreadaId: job.charreadaId || null,
      backupId: job.backupId,
      safetyBackupId: job.safetyBackupId || null,
      sourceArchiveChecksum: job.sourceArchiveChecksum,
      expectedTargetFingerprint: job.expectedTargetFingerprint,
      restoredFingerprint: outcome.postValidation.actualFingerprint,
      objectsRestored: outcome.summary,
      requestedAt: job.requestedAt,
      completedAt: job.completedAt,
      completedAtMs: job.completedAtMs,
      durationMs: job.durationMs,
      actor: job.actor
    };
    await adapter.transaction(`${RESTORE_ROOT}/catalog/${job.scopeKey}/${job.restoreId}`, (current) => current || catalog);
  }

  return { validateRestore, requestRestore, cancelRestore, executeRestore };
}

function createFirebaseRestoreAdapter(admin) {
  const database = admin.database();
  const bucket = () => admin.storage().bucket();
  return {
    now: () => Date.now(),
    async read(path) {
      const snapshot = await database.ref(path).get();
      return snapshot.val();
    },
    async transaction(path, updater) {
      const result = await database.ref(path).transaction((current) => updater(current), undefined, false);
      return { committed: result.committed, value: result.snapshot.val() };
    },
    async readArchive(storageRef) {
      const objectPath = String(storageRef || "").replace(/^gs:\/\/[^/]+\//, "");
      if (!objectPath) throw new RestoreEngineError("restore-backup-storage-ref-invalid");
      const [buffer] = await bucket().file(objectPath).download();
      return buffer.toString("utf8");
    }
  };
}

function assertPlanMatchesJob(plan, job) {
  if (plan.errors.length) throw new RestoreEngineError(plan.errors[0], plan.errors[0], { errors: plan.errors });
  if (plan.expectedTargetFingerprint !== job.expectedTargetFingerprint) throw new RestoreEngineError("restore-target-changed-after-validation");
  if (plan.expectedRestoredFingerprint !== job.expectedRestoredFingerprint) throw new RestoreEngineError("restore-result-changed-after-validation");
  if (plan.planFingerprint !== job.planFingerprint) throw new RestoreEngineError("restore-plan-changed-after-validation");
}

function summaryFromCounts(counts = {}) {
  return {
    tournaments: Number(counts.tournaments || 0),
    charreadas: Number(counts.charreadas || 0),
    scores: Number(counts.scores || 0),
    publicSnapshots: 0,
    auditRecords: Number(counts.auditRecords || 0)
  };
}

function validationRecordToRequest(validation = {}) {
  return {
    validationId: validation.validationId,
    ...validation.request,
    actor: validation.actor,
    sourceArchiveChecksum: validation.sourceArchiveChecksum,
    expectedTargetFingerprint: validation.expectedTargetFingerprint,
    expectedRestoredFingerprint: validation.expectedRestoredFingerprint,
    source: "restore-preflight"
  };
}

function jobToRequest(job = {}) {
  return {
    restoreId: job.restoreId,
    validationId: job.validationId,
    idempotencyKey: job.idempotencyKey,
    scopeType: job.scopeType,
    scopeId: job.scopeId,
    scopeKey: job.scopeKey,
    tenantId: job.tenantId || "",
    organizationId: job.organizationId || "",
    tournamentId: job.tournamentId || "",
    charreadaId: job.charreadaId || "",
    sourceScopeKey: job.sourceScopeKey,
    backupId: job.backupId,
    safetyScopeKey: job.safetyScopeKey,
    safetyBackupId: job.safetyBackupId,
    sourceArchiveChecksum: job.sourceArchiveChecksum,
    sourcePayloadFingerprint: job.sourcePayloadFingerprint,
    safetyArchiveChecksum: job.safetyArchiveChecksum,
    safetyPayloadFingerprint: job.safetyPayloadFingerprint,
    expectedTargetFingerprint: job.expectedTargetFingerprint,
    expectedRestoredFingerprint: job.expectedRestoredFingerprint,
    planFingerprint: job.planFingerprint,
    actor: job.actor,
    source: job.source,
    reason: job.reason,
    requestedAt: job.requestedAt,
    requestedAtMs: job.requestedAtMs
  };
}

function getControlPath(scopeKey) {
  return `${RESTORE_ROOT}/control/${scopeKey}`;
}

function normalizeScopeKey(value) {
  const clean = String(value || "");
  return /^scope_[a-f0-9]{40}$/.test(clean) ? clean : "";
}

function normalizeBackupId(value) {
  const clean = String(value || "");
  return /^backup_[a-f0-9]{40}$/.test(clean) ? clean : "";
}

function normalizeValidationId(value) {
  const clean = String(value || "");
  return /^validation_[a-f0-9]{40}$/.test(clean) ? clean : "";
}

function normalizeRestoreId(value) {
  const clean = String(value || "");
  return /^restore_[a-f0-9]{40}$/.test(clean) ? clean : "";
}

function normalizeErrorCode(error) {
  return String(error?.code || error?.message || "restore-error").replace(/^functions\//, "").slice(0, 180);
}

module.exports = {
  RESTORE_ROOT,
  createRestoreRuntime,
  createFirebaseRestoreAdapter
};
