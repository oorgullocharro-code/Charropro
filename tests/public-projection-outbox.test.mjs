import assert from "node:assert/strict";
import {
  PUBLIC_PROJECTION_MAX_ATTEMPTS,
  PUBLIC_PROJECTION_STATUSES,
  buildPublicProjectionFailureState,
  buildPublicProjectionIdentity,
  buildPublicProjectionIntent,
  buildPublicProjectionOutboxSnapshot,
  buildPublicProjectionState,
  claimPublicProjectionState,
  comparePublicProjectionJobs,
  getPublicProjectionRetryDelay,
  isPublicProjectionJobEligible,
  normalizePublicProjectionJob,
  normalizePublicProjectionState,
  sanitizeProjectionErrorCode,
  sanitizeProjectionErrorMessage,
  validatePublicProjectionIntent
} from "../js/core/publicProjectionOutbox.js?v=20260827-official-timer-orchestration-state-machine-failsafe-001-v1";

const T0 = Date.parse("2026-07-29T12:00:00.000Z");
const base = {
  tournamentId: "tournament-outbox",
  charreadaId: "charreada-1",
  competitionId: "equipos_completo",
  sourceId: "published-1",
  scoreId: "score-1",
  attemptKey: "tournament-outbox__charreada-1__team-1__cala__0__0",
  sourceRevision: 1,
  publishedAt: "2026-07-29T12:00:00.000Z",
  total: 0,
  actor: {
    uid: "judge-1",
    name: "Juez Uno",
    role: "juez",
    clientId: "client-1",
    email: "private@example.test",
    token: "secret"
  }
};

const identityA = buildPublicProjectionIdentity(base);
const identityB = buildPublicProjectionIdentity({ ...base });
assert.equal(identityA.valid, true);
assert.deepEqual(identityA, identityB, "identity is deterministic");
assert.notEqual(
  buildPublicProjectionIdentity({ ...base, sourceRevision: 2 }).projectionId,
  identityA.projectionId,
  "a new official revision creates a new projection"
);
assert.notEqual(
  buildPublicProjectionIdentity({ ...base, sourceId: "published-2" }).projectionId,
  identityA.projectionId,
  "a distinct official source remains distinguishable"
);

const original = structuredClone(base);
const intent = buildPublicProjectionIntent(base, { nowMs: T0 });
assert.ok(intent);
assert.deepEqual(base, original, "intent builder does not mutate its source");
assert.equal(validatePublicProjectionIntent(intent).valid, true);
assert.equal(intent.sourceRevision, 1);
assert.equal(intent.createdAtMs, T0);
assert.equal(intent.targetPath, "charropro/publicTournaments/tournament-outbox");
assert.equal(intent.createdBy.uid, "judge-1");
assert.equal("email" in intent.createdBy, false);
assert.equal(JSON.stringify(intent).includes("secret"), false);
assert.equal(
  validatePublicProjectionIntent({ ...intent, projectionId: "projection_tampered_1" }).valid,
  false,
  "stored identity must match canonical source fields"
);
assert.equal(
  normalizePublicProjectionJob({ intent: { ...intent, sourceRevision: "1" } }),
  null,
  "durable intent does not coerce an invalid revision"
);
const incompleteIntent = { ...intent };
delete incompleteIntent.sourceFingerprint;
assert.equal(
  normalizePublicProjectionJob({ intent: incompleteIntent }),
  null,
  "durable intent rejects missing required fields"
);

const duplicateIntent = buildPublicProjectionIntent(structuredClone(base), { nowMs: T0 + 5000 });
assert.deepEqual(duplicateIntent, intent, "same official publication preserves the immutable intent");
assert.equal(buildPublicProjectionIntent({ ...base, attemptKey: "" }), null);

const pendingJob = normalizePublicProjectionJob({ intent });
assert.equal(pendingJob.state.status, PUBLIC_PROJECTION_STATUSES.PENDING);
assert.equal(pendingJob.state.attempts, 0);
assert.equal(normalizePublicProjectionState({}).deadLetterReason, "");
assert.equal(sanitizeProjectionErrorCode(""), "");
assert.equal(isPublicProjectionJobEligible(pendingJob, { nowMs: T0 }), true);

const processing = claimPublicProjectionState(pendingJob.state, {
  nowMs: T0,
  leaseOwner: "worker-1",
  leaseMs: 30000,
  actor: base.actor
});
assert.equal(processing.status, PUBLIC_PROJECTION_STATUSES.PROCESSING);
assert.equal(processing.attempts, 1);
assert.equal(processing.leaseOwner, "worker-1");
assert.equal(processing.leaseExpiresAtMs, T0 + 30000);
assert.equal(processing.claimedBy.uid, "judge-1");
assert.equal(processing.updatedBy.uid, "judge-1");
assert.equal(processing.deadLetterReason, "");
assert.equal(
  claimPublicProjectionState(processing, { nowMs: T0 + 1000, leaseOwner: "worker-2" }),
  null,
  "an active lease prevents a duplicate worker"
);
assert.equal(
  claimPublicProjectionState(processing, { nowMs: T0 + 31000, leaseOwner: "worker-2" }).attempts,
  2,
  "an expired lease can be recovered"
);
const exhaustedLease = {
  ...processing,
  attempts: PUBLIC_PROJECTION_MAX_ATTEMPTS,
  leaseExpiresAtMs: T0 + 1000
};
assert.equal(
  isPublicProjectionJobEligible({ intent, state: exhaustedLease }, { nowMs: T0 + 2000 }),
  true,
  "an expired final lease remains eligible for terminal classification"
);
assert.equal(
  claimPublicProjectionState(exhaustedLease, { nowMs: T0 + 2000 }).status,
  PUBLIC_PROJECTION_STATUSES.DEAD_LETTER,
  "an expired final lease is moved to dead-letter"
);

const projected = buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.PROJECTED, processing, {
  targetRevision: 4,
  targetFingerprint: "abcd"
}, { nowMs: T0 + 10 });
assert.equal(projected.deadLetterReason, "");
assert.equal(
  buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.VERIFIED, projected, {
    verifiedAt: new Date(T0 + 20).toISOString()
  }, { nowMs: T0 + 20 }),
  null,
  "a client transition cannot produce the authoritative VERIFIED state"
);
const clientConfirmed = buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED, projected, {
  clientConfirmedAt: new Date(T0 + 20).toISOString()
}, { nowMs: T0 + 20 });
assert.equal(clientConfirmed.status, PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED);
assert.equal(clientConfirmed.targetRevision, 4);
assert.equal(clientConfirmed.verifiedAt, "");
assert.equal(clientConfirmed.leaseOwner, "");
assert.equal(clientConfirmed.deadLetterReason, "");
assert.equal(
  buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.PROCESSING, clientConfirmed, {}, { nowMs: T0 + 30 }),
  null,
  "client-confirmed jobs cannot return to processing"
);
assert.equal(
  buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.SUPERSEDED, clientConfirmed, {
    supersededBy: "projection-new"
  }, { nowMs: T0 + 30 }).status,
  PUBLIC_PROJECTION_STATUSES.SUPERSEDED
);
const serverVerified = buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.VERIFIED, projected, {
  verifiedAt: new Date(T0 + 20).toISOString()
}, { nowMs: T0 + 20, authority: "trusted-server" });
assert.equal(serverVerified.status, PUBLIC_PROJECTION_STATUSES.VERIFIED);
assert.equal(serverVerified.deadLetterReason, "");
assert.equal(
  buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.VERIFIED, serverVerified, {}, {
    nowMs: T0 + 30
  }),
  null,
  "rewriting an existing VERIFIED state still requires trusted-server authority"
);

const retry = buildPublicProjectionFailureState(processing, {
  reason: "permission-denied",
  message: "permission denied https://example.test?token=secret"
}, {
  nowMs: T0,
  jitter: false
});
assert.equal(retry.status, PUBLIC_PROJECTION_STATUSES.RETRY_WAIT);
assert.equal(retry.lastErrorCode, "permission-denied");
assert.equal(retry.nextRetryAtMs, T0 + 1000);
assert.equal(retry.lastErrorMessage.includes("https://"), false);
assert.equal(retry.lastErrorMessage.includes("secret"), false);
assert.equal(isPublicProjectionJobEligible({ intent, state: retry }, { nowMs: T0 + 500 }), false);
assert.equal(isPublicProjectionJobEligible({ intent, state: retry }, { nowMs: T0 + 1000 }), true);
assert.equal(getPublicProjectionRetryDelay(1, { jitter: false }), 1000);
assert.equal(getPublicProjectionRetryDelay(99, { jitter: false }), 300000);

const exhausted = buildPublicProjectionFailureState({
  ...processing,
  attempts: PUBLIC_PROJECTION_MAX_ATTEMPTS
}, {
  reason: "network-error",
  message: "offline"
}, {
  nowMs: T0,
  jitter: false
});
assert.equal(exhausted.status, PUBLIC_PROJECTION_STATUSES.DEAD_LETTER);
assert.equal(exhausted.deadLetterReason, "network-error");

const unknownFailure = buildPublicProjectionFailureState({
  ...processing,
  attempts: PUBLIC_PROJECTION_MAX_ATTEMPTS
}, {
  reason: "unclassified-failure",
  message: "unclassified failure"
}, {
  nowMs: T0,
  jitter: false
});
assert.equal(unknownFailure.status, PUBLIC_PROJECTION_STATUSES.DEAD_LETTER);
assert.equal(unknownFailure.deadLetterReason, "unknown");

const invalidSource = buildPublicProjectionFailureState(processing, {
  reason: "missing-projection-source",
  message: "missing"
}, {
  nowMs: T0
});
assert.equal(invalidSource.status, PUBLIC_PROJECTION_STATUSES.DEAD_LETTER);

const revisionTwoIntent = buildPublicProjectionIntent({
  ...base,
  sourceId: "published-2",
  sourceRevision: 2,
  publishedAt: "2026-07-29T12:01:00.000Z"
});
const olderJob = normalizePublicProjectionJob({ intent, state: retry });
const newerJob = normalizePublicProjectionJob({ intent: revisionTwoIntent });
assert.ok(comparePublicProjectionJobs(newerJob, olderJob) > 0);

const snapshot = buildPublicProjectionOutboxSnapshot({
  [olderJob.projectionId]: olderJob,
  [newerJob.projectionId]: newerJob,
  clientConfirmed: {
    intent: buildPublicProjectionIntent({
      ...base,
      sourceId: "published-other",
      attemptKey: `${base.attemptKey}:other`
    }),
    state: clientConfirmed
  },
  dead: {
    intent: buildPublicProjectionIntent({
      ...base,
      sourceId: "published-dead",
      attemptKey: `${base.attemptKey}:dead`
    }),
    state: exhausted
  }
}, {
  tournamentId: base.tournamentId,
  nowMs: T0 + 60000
});
assert.equal(snapshot.total, 4);
assert.equal(snapshot.pending, 1);
assert.equal(snapshot.retry, 1);
assert.equal(snapshot.deadLetter, 1);
assert.equal(snapshot.clientConfirmed, 1);
assert.equal(snapshot.verified, 0);
assert.ok(snapshot.oldestPendingAgeMs >= 0);

const unsafeMessage = sanitizeProjectionErrorMessage(
  "<script>alert(1)</script> javascript:alert(1) password=hunter2 token=abc"
);
assert.equal(unsafeMessage.includes("<script>"), false);
assert.equal(unsafeMessage.includes("javascript:"), false);
assert.equal(unsafeMessage.includes("hunter2"), false);
assert.equal(unsafeMessage.includes("token=abc"), false);

console.log("public-projection-outbox.test.mjs: ok");
