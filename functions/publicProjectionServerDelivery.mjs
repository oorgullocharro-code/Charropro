import {
  buildPublicProjection,
  getPublicProjectionSignature,
  reconcilePublicProjection
} from "./reconciliationShared/public/publicProjection.js";
import {
  PUBLIC_PROJECTION_LEASE_MS,
  PUBLIC_PROJECTION_MAX_ATTEMPTS,
  PUBLIC_PROJECTION_STATUSES,
  buildPublicProjectionFailureState,
  buildPublicProjectionState,
  claimPublicProjectionState,
  normalizePublicProjectionIntent,
  normalizePublicProjectionState
} from "./reconciliationShared/core/publicProjectionOutbox.js";

const ROOT = "charropro";
const SERVER_ACTOR = Object.freeze({
  uid: "system:public-projection-worker",
  name: "CharroPro Public Projection Worker",
  role: "system",
  clientId: "function:public-projection"
});

// This runtime deliberately owns transport only. The V3 builder remains the
// shared canonical authority used by the browser and Functions alike.
export function createPublicProjectionServerDelivery(adapter, options = {}) {
  if (!adapter || typeof adapter.read !== "function" || typeof adapter.transaction !== "function") {
    throw new TypeError("public-projection-server-adapter-required");
  }
  const now = typeof options.now === "function" ? options.now : () => Date.now();
  const actor = { ...SERVER_ACTOR, ...(options.actor || {}) };
  const leaseOwner = String(options.leaseOwner || actor.clientId || "function:public-projection").slice(0, 180);

  return Object.freeze({
    deliver: (tournamentId, rawIntent, deliveryOptions = {}) => deliverProjection(
      adapter,
      String(tournamentId || ""),
      rawIntent,
      { now, actor, leaseOwner, ...deliveryOptions }
    )
  });
}

export async function deliverProjection(adapter, tournamentId, rawIntent, options = {}) {
  const intent = normalizePublicProjectionIntent(rawIntent || {});
  if (!intent || intent.tournamentId !== tournamentId) {
    return { ok: false, reason: "invalid-projection-intent", projectionId: "" };
  }
  const nowMs = Number(options.now?.() ?? Date.now());
  const actor = { ...SERVER_ACTOR, ...(options.actor || {}) };
  const leaseOwner = String(options.leaseOwner || actor.clientId || "function:public-projection").slice(0, 180);
  const statePath = outboxStatePath(tournamentId, intent.projectionId);
  let state = normalizePublicProjectionState(await adapter.read(statePath), intent);

  if ([PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED, PUBLIC_PROJECTION_STATUSES.VERIFIED].includes(state.status)) {
    return success(intent, state, "projection-already-confirmed");
  }

  // DEAD_LETTER is never blindly rearmed. It can only be converged when the
  // destination already equals the currently canonical V3 result.
  if (state.status === PUBLIC_PROJECTION_STATUSES.DEAD_LETTER) {
    const convergence = await isDestinationConverged(adapter, tournamentId, nowMs);
    if (!convergence.ok || !convergence.converged) {
      return { ok: false, projectionId: intent.projectionId, status: state.status, reason: "projection-dead-letter-not-converged" };
    }
    state = await transitionState(adapter, tournamentId, intent, PUBLIC_PROJECTION_STATUSES.PENDING, {
      nextRetryAt: "",
      nextRetryAtMs: 0,
      lastErrorCode: "",
      lastErrorMessage: "",
      deadLetterReason: "",
      retriedBy: actor
    }, { nowMs, actor, force: true });
    if (!state) return { ok: false, projectionId: intent.projectionId, reason: "projection-rearm-not-persisted" };
  }

  const claimed = await claimState(adapter, tournamentId, intent, { nowMs, actor, leaseOwner });
  if (!claimed) {
    return { ok: false, projectionId: intent.projectionId, status: state.status, reason: "projection-claim-not-acquired" };
  }
  if (claimed.status === PUBLIC_PROJECTION_STATUSES.DEAD_LETTER) {
    return { ok: false, projectionId: intent.projectionId, status: claimed.status, reason: claimed.deadLetterReason || "attempts-exhausted" };
  }

  try {
    const source = await adapter.read(tournamentPath(tournamentId));
    const sourceCheck = inspectProjectionSource(intent, source?.publishedScores);
    if (!sourceCheck.ok && sourceCheck.supersededBy) {
      const superseded = await transitionState(adapter, tournamentId, intent, PUBLIC_PROJECTION_STATUSES.SUPERSEDED, {
        supersededBy: sourceCheck.supersededBy
      }, { nowMs, actor });
      return { ok: Boolean(superseded), projectionId: intent.projectionId, status: superseded?.status || "SUPERSEDED", reason: "projection-superseded" };
    }
    if (!sourceCheck.ok) return fail(adapter, tournamentId, intent, claimed, sourceCheck, { nowMs, actor });

    const publication = await publishCanonicalProjection(adapter, tournamentId, { nowMs });
    if (!publication.ok) return fail(adapter, tournamentId, intent, claimed, publication, { nowMs, actor });

    const projected = await transitionState(adapter, tournamentId, intent, PUBLIC_PROJECTION_STATUSES.PROJECTED, {
      projectedAt: new Date(nowMs).toISOString(),
      targetRevision: publication.targetRevision,
      targetFingerprint: publication.targetFingerprint
    }, { nowMs, actor });
    if (!projected) {
      return fail(adapter, tournamentId, intent, claimed, {
        reason: "transaction-aborted",
        message: "La proyección se escribió, pero PROJECTED no quedó persistido."
      }, { nowMs, actor });
    }
    const confirmed = await transitionState(adapter, tournamentId, intent, PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED, {
      clientConfirmedAt: new Date(nowMs).toISOString(),
      targetRevision: publication.targetRevision,
      targetFingerprint: publication.targetFingerprint
    }, { nowMs, actor });
    if (!confirmed) {
      return fail(adapter, tournamentId, intent, projected, {
        reason: "transaction-aborted",
        message: "La proyección se escribió, pero CLIENT_CONFIRMED no quedó persistido."
      }, { nowMs, actor });
    }
    return { ...success(intent, confirmed, "projection-client-confirmed"), publicSnapshot: publication };
  } catch (error) {
    return fail(adapter, tournamentId, intent, claimed, error, { nowMs, actor });
  }
}

async function publishCanonicalProjection(adapter, tournamentId, { nowMs }) {
  // A concurrent official publication can arrive between the source read and
  // the public transaction. Re-read and reconcile until the stored target is
  // identical to a fresh canonical source, never allowing a stale worker to
  // be the final writer.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [tournament, liveCurrent, publicTimeline] = await Promise.all([
      adapter.read(tournamentPath(tournamentId)),
      adapter.read(livePath(tournamentId)),
      adapter.read(timelinePath(tournamentId))
    ]);
    if (!tournament) return { ok: false, reason: "missing-projection-source" };
    const candidate = buildPublicProjection({ tournament, liveCurrent: liveCurrent || {}, publicTimeline: publicTimeline || {} }, {
      tournamentId,
      nowMs
    });
    const targetPath = publicPath(tournamentId);
    const transaction = await adapter.transaction(targetPath, (current) => {
      const reconciliation = reconcilePublicProjection(current || null, candidate, { nowMs });
      return reconciliation.ok && reconciliation.changed ? reconciliation.projection : undefined;
    });
    const stored = transaction.value ?? await adapter.read(targetPath);
    if (!stored) return { ok: false, reason: "public-projection-not-verified" };

    const latest = await buildLatestCandidate(adapter, tournamentId, nowMs);
    if (!latest.ok) return latest;
    if (getPublicProjectionSignature(stored) === getPublicProjectionSignature(latest.candidate)) {
      return {
        ok: true,
        projected: transaction.committed === true,
        clientConfirmed: true,
        targetRevision: Number(stored.projectionRevision || 0),
        targetFingerprint: getPublicProjectionSignature(stored),
        reason: transaction.committed ? "updated" : "unchanged"
      };
    }
  }
  return { ok: false, reason: "source-revision-inconsistent" };
}

async function isDestinationConverged(adapter, tournamentId, nowMs) {
  const [latest, current] = await Promise.all([
    buildLatestCandidate(adapter, tournamentId, nowMs),
    adapter.read(publicPath(tournamentId))
  ]);
  if (!latest.ok) return latest;
  return { ok: true, converged: getPublicProjectionSignature(latest.candidate) === getPublicProjectionSignature(current) };
}

async function buildLatestCandidate(adapter, tournamentId, nowMs) {
  const [tournament, liveCurrent, publicTimeline] = await Promise.all([
    adapter.read(tournamentPath(tournamentId)),
    adapter.read(livePath(tournamentId)),
    adapter.read(timelinePath(tournamentId))
  ]);
  if (!tournament) return { ok: false, reason: "missing-projection-source" };
  return {
    ok: true,
    candidate: buildPublicProjection({ tournament, liveCurrent: liveCurrent || {}, publicTimeline: publicTimeline || {} }, { tournamentId, nowMs })
  };
}

async function claimState(adapter, tournamentId, intent, { nowMs, actor, leaseOwner }) {
  const path = outboxStatePath(tournamentId, intent.projectionId);
  const durable = normalizePublicProjectionState(await adapter.read(path), intent);
  const transaction = await adapter.transaction(path, (current) => {
    const local = normalizePublicProjectionState(current || {}, intent);
    const seed = durable.updatedAtMs > local.updatedAtMs ? durable : local;
    return claimPublicProjectionState(seed, {
      nowMs,
      maxAttempts: PUBLIC_PROJECTION_MAX_ATTEMPTS,
      leaseMs: PUBLIC_PROJECTION_LEASE_MS,
      leaseOwner,
      actor
    }) || undefined;
  });
  return transaction.committed ? normalizePublicProjectionState(transaction.value, intent) : null;
}

async function transitionState(adapter, tournamentId, intent, status, patch, { nowMs, actor, force = false }) {
  const path = outboxStatePath(tournamentId, intent.projectionId);
  const durable = normalizePublicProjectionState(await adapter.read(path), intent);
  const transaction = await adapter.transaction(path, (current) => {
    const local = normalizePublicProjectionState(current || {}, intent);
    const seed = durable.updatedAtMs > local.updatedAtMs ? durable : local;
    return buildPublicProjectionState(status, seed, { ...patch, updatedBy: actor, sourceRevision: intent.sourceRevision }, {
      nowMs,
      force
    }) || undefined;
  });
  const state = normalizePublicProjectionState(transaction.value ?? await adapter.read(path), intent);
  return state.status === status || (status === PUBLIC_PROJECTION_STATUSES.PROJECTED && state.status === PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED)
    ? state
    : null;
}

async function fail(adapter, tournamentId, intent, previous, error, { nowMs, actor }) {
  const durable = normalizePublicProjectionState(
    await adapter.read(outboxStatePath(tournamentId, intent.projectionId)),
    intent
  );
  if ([PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED, PUBLIC_PROJECTION_STATUSES.VERIFIED].includes(durable.status)) {
    return success(intent, durable, "projection-confirmed-by-concurrent-worker");
  }
  const failure = buildPublicProjectionFailureState(previous, error, {
    nowMs,
    maxAttempts: PUBLIC_PROJECTION_MAX_ATTEMPTS,
    jitter: false,
    seed: intent.projectionId,
    actor
  });
  const state = await transitionState(adapter, tournamentId, intent, failure.status, failure, { nowMs, actor });
  return {
    ok: false,
    projectionId: intent.projectionId,
    status: state?.status || failure.status,
    reason: state?.lastErrorCode || failure.lastErrorCode
  };
}

function inspectProjectionSource(intent, value) {
  const records = Object.entries(value || {})
    .map(([id, record]) => ({ ...(record || {}), id: record?.id || id }))
    .filter((record) => String(record.attemptKey || "") === intent.attemptKey)
    .sort((left, right) => Number(left.revision || 1) - Number(right.revision || 1));
  const source = records.find((record) => String(record.id || "") === intent.sourceId);
  if (!source) return { ok: false, reason: "missing-published-score" };
  const latest = records.at(-1) || source;
  if (source.superseded === true || String(source.supersededBy || "") || latest.id !== source.id) {
    return { ok: false, reason: "projection-superseded", supersededBy: String(latest.id || source.supersededBy || "") };
  }
  if (Number(source.revision || 1) !== intent.sourceRevision) return { ok: false, reason: "projection-source-mismatch" };
  return { ok: true, source };
}

function success(intent, state, reason) {
  return {
    ok: true,
    projectionId: intent.projectionId,
    status: state.status,
    attempts: state.attempts,
    reason
  };
}

function tournamentPath(tournamentId) { return `${ROOT}/tournaments/${tournamentId}`; }
function livePath(tournamentId) { return `${ROOT}/live/${tournamentId}/current`; }
function timelinePath(tournamentId) { return `${ROOT}/tournaments/${tournamentId}/publicTimeline`; }
function publicPath(tournamentId) { return `${ROOT}/publicTournaments/${tournamentId}`; }
function outboxStatePath(tournamentId, projectionId) { return `${ROOT}/projectionOutbox/${tournamentId}/${projectionId}/state`; }
