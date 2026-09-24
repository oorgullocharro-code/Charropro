import {
  PUBLIC_PROJECTION_STATUSES,
  isPublicProjectionJobEligible,
  isPublicProjectionTerminalStatus,
  normalizePublicProjectionIntent,
  normalizePublicProjectionJob,
  normalizePublicProjectionState
} from "./reconciliationShared/core/publicProjectionOutbox.js";

export const PROJECTION_PENDING_INDEX_PATH = "charropro/projectionPendingIndex";
export const PROJECTION_PENDING_WORK_BATCH_LIMIT = 100;

const PATH_ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;

export function buildProjectionPendingIndexEntry(tournamentId, rawIntent, rawState = {}, nowMs = Date.now()) {
  const intent = normalizePublicProjectionIntent(rawIntent || {});
  if (!intent || intent.tournamentId !== String(tournamentId || "")) return null;

  const state = normalizePublicProjectionState(rawState || {}, intent);
  if (!shouldRetainProjectionPendingIndex(state)) return null;

  const createdAtMs = positiveTimestamp(intent.createdAtMs, positiveTimestamp(nowMs, Date.now()));
  return {
    projectionId: intent.projectionId,
    tournamentId: intent.tournamentId,
    createdAtMs,
    nextEligibleAtMs: nextEligibleAtMs(state, createdAtMs)
  };
}

export function normalizeProjectionPendingIndexEntry(projectionId, value = {}) {
  const id = normalizePathId(projectionId);
  const entry = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const entryProjectionId = normalizePathId(entry.projectionId);
  const tournamentId = normalizePathId(entry.tournamentId);
  const createdAtMs = positiveTimestamp(entry.createdAtMs, 0);
  const nextEligibleAtMs = positiveTimestamp(entry.nextEligibleAtMs, createdAtMs);
  if (!id || id !== entryProjectionId || !tournamentId || !createdAtMs || !nextEligibleAtMs) return null;
  return { projectionId: id, tournamentId, createdAtMs, nextEligibleAtMs };
}

export function shouldRetainProjectionPendingIndex(rawState = {}) {
  const status = String(rawState?.status || PUBLIC_PROJECTION_STATUSES.PENDING);
  return status === PUBLIC_PROJECTION_STATUSES.DEAD_LETTER || !isPublicProjectionTerminalStatus(status);
}

export function shouldDeliverProjectionPendingWork(rawJob = {}, nowMs = Date.now()) {
  const job = normalizePublicProjectionJob(rawJob || {});
  if (!job) return false;
  if (job.state.status === PUBLIC_PROJECTION_STATUSES.DEAD_LETTER) return true;
  return isPublicProjectionJobEligible(job, { nowMs });
}

// This is intentionally a maintenance-only helper. Normal Function 13 runs
// never enumerate the durable outbox; an authorized recovery can rebuild the
// disposable discovery index from its canonical jobs when necessary.
export function collectProjectionPendingIndexEntries(outbox = {}, nowMs = Date.now()) {
  const entries = {};
  for (const [tournamentId, jobs] of Object.entries(outbox || {})) {
    for (const rawJob of Object.values(jobs || {})) {
      const job = normalizePublicProjectionJob(rawJob || {});
      if (!job || job.intent.tournamentId !== tournamentId) continue;
      const entry = buildProjectionPendingIndexEntry(tournamentId, job.intent, job.state, nowMs);
      if (entry) entries[entry.projectionId] = entry;
    }
  }
  return entries;
}

export async function reconcileProjectionPendingWork(adapter, options = {}) {
  if (!adapter || typeof adapter.listDueEntries !== "function" || typeof adapter.readJob !== "function"
    || typeof adapter.writeEntry !== "function" || typeof adapter.removeEntry !== "function" || typeof adapter.deliver !== "function") {
    throw new TypeError("projection-pending-work-adapter-required");
  }
  const nowMs = positiveTimestamp(options.nowMs, Date.now());
  const batchLimit = boundedBatchLimit(options.batchLimit);
  const dueEntries = await adapter.listDueEntries({ nowMs, batchLimit });
  const results = [];
  let stale = 0;

  for (const [projectionId, rawEntry] of Object.entries(dueEntries || {})) {
    const entry = normalizeProjectionPendingIndexEntry(projectionId, rawEntry);
    if (!entry) {
      await adapter.removeEntry(projectionId);
      stale += 1;
      continue;
    }

    const rawJob = await adapter.readJob(entry.tournamentId, entry.projectionId);
    const job = normalizePublicProjectionJob(rawJob || {});
    if (!job || job.intent.tournamentId !== entry.tournamentId || job.intent.projectionId !== entry.projectionId) {
      await adapter.removeEntry(entry.projectionId);
      stale += 1;
      continue;
    }

    const desired = buildProjectionPendingIndexEntry(entry.tournamentId, job.intent, job.state, nowMs);
    if (!desired) {
      await adapter.removeEntry(entry.projectionId);
      stale += 1;
      continue;
    }
    if (!sameEntry(entry, desired)) await adapter.writeEntry(desired);

    if (!shouldDeliverProjectionPendingWork(job, nowMs)) continue;
    const result = await adapter.deliver(entry.tournamentId, job.intent);
    results.push(result);

    const current = await adapter.readJob(entry.tournamentId, entry.projectionId);
    const currentJob = normalizePublicProjectionJob(current || {});
    const currentEntry = currentJob && currentJob.intent.tournamentId === entry.tournamentId
      ? buildProjectionPendingIndexEntry(entry.tournamentId, currentJob.intent, currentJob.state, nowMs)
      : null;
    if (currentEntry) await adapter.writeEntry(currentEntry);
    else await adapter.removeEntry(entry.projectionId);
  }

  return {
    scanned: Object.keys(dueEntries || {}).length,
    candidates: results.length,
    stale,
    confirmed: results.filter((result) => result?.ok).length,
    pending: results.filter((result) => !result?.ok).length,
    results
  };
}

function nextEligibleAtMs(state, createdAtMs) {
  if (state.status === PUBLIC_PROJECTION_STATUSES.RETRY_WAIT) {
    return Math.max(createdAtMs, positiveTimestamp(state.nextRetryAtMs, createdAtMs));
  }
  if (state.status === PUBLIC_PROJECTION_STATUSES.PROCESSING) {
    return Math.max(createdAtMs, positiveTimestamp(state.leaseExpiresAtMs, createdAtMs));
  }
  // DEAD_LETTER stays discoverable only for the existing convergence-only
  // policy in server delivery; it is never blindly retried from this index.
  return Math.max(createdAtMs, positiveTimestamp(state.updatedAtMs, createdAtMs));
}

function sameEntry(left, right) {
  return left.projectionId === right.projectionId
    && left.tournamentId === right.tournamentId
    && left.createdAtMs === right.createdAtMs
    && left.nextEligibleAtMs === right.nextEligibleAtMs;
}

function boundedBatchLimit(value) {
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0
    ? Math.min(numeric, PROJECTION_PENDING_WORK_BATCH_LIMIT)
    : PROJECTION_PENDING_WORK_BATCH_LIMIT;
}

function normalizePathId(value) {
  const clean = String(value || "").trim();
  return PATH_ID_PATTERN.test(clean) ? clean : "";
}

function positiveTimestamp(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.trunc(numeric) : fallback;
}
