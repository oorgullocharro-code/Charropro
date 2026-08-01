import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const raw = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const rules = JSON.parse(raw).rules.charropro;
const publicRules = rules.publicTournaments?.$tournamentId;
const liveRules = rules.live?.$tournamentId;
const projectionOutboxRules = rules.projectionOutbox?.$tournamentId;
const projectionJobRules = projectionOutboxRules?.$projectionId;

assert.equal(rules[".read"], false, "private root remains closed");
assert.notEqual(rules.tournaments?.$tournamentId?.[".read"], true, "private tournament data is not public");
assert.equal(
  rules.tournaments?.$tournamentId?.publishedScores?.[".read"],
  undefined,
  "private published scores do not gain a public read rule"
);
assert.ok(publicRules);
assert.equal(publicRules[".read"], true, "public projection remains readable");
assert.match(publicRules[".write"], /auth != null/);
assert.match(publicRules[".write"], /supervisor/);
assert.match(publicRules[".write"], /operador/);
assert.match(publicRules[".write"], /juez/);
assert.match(publicRules[".write"], /schemaVersion/);
assert.match(publicRules[".write"], /projectionRevision/);
assert.match(publicRules[".write"], /> data\.child\('projectionRevision'\)/);
assert.match(publicRules[".write"], /liveFeed\/revision/);
assert.match(publicRules[".write"], />= data\.child\('liveFeed\/revision'\)/);
assert.match(publicRules[".write"], /tournamentAccess/);
assert.match(publicRules[".validate"], /metadata/);
assert.match(publicRules[".validate"], /overview/);
assert.match(publicRules[".validate"], /program/);
assert.match(publicRules[".validate"], /live/);
assert.match(publicRules[".validate"], /liveFeed/);
assert.match(publicRules[".validate"], /competitions/);
assert.match(publicRules[".validate"], /results/);
assert.match(publicRules[".validate"], /rankings/);
assert.match(publicRules[".validate"], /statistics/);
assert.match(publicRules[".validate"], /search/);
assert.equal(publicRules.$other[".validate"], false, "unknown top-level fields are rejected");
assert.equal(publicRules.metadata.$other[".validate"].includes("ownerEmail"), false);
assert.equal(publicRules.live.$other[".validate"].includes("notes"), false);
assert.equal(publicRules.live.$other[".validate"].includes("pendingNote"), false);
assert.equal(publicRules.live.$other[".validate"].includes("broadcastState"), false);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("notes"), false);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("publicNotes"), true);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("venueName"), true);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("liveAvailable"), true);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("internalNotes"), false);
assert.equal(publicRules.program.items.$itemId.participants.$participantId.$other[".validate"].includes("phone"), false);
assert.equal(publicRules.program.items.$itemId.participants.$participantId.$other[".validate"].includes("email"), false);
assert.equal(publicRules.competitions.items.$itemId.$other[".validate"].includes("ownerEmail"), false);
assert.equal(publicRules.results.items.$itemId.$other[".validate"].includes("judge"), false);
assert.equal(publicRules.results.scopes.$scopeId.$other[".validate"].includes("private"), false);
assert.equal(publicRules.live.turn.$other[".validate"].includes("pendingNote"), false);
assert.equal(publicRules.live.currentResult.$other[".validate"].includes("notes"), false);
assert.equal(publicRules.live.standings.$itemId.$other[".validate"].includes("operatorId"), false);
assert.match(publicRules.liveFeed.items.$eventId[".validate"], /score_published/);
assert.match(publicRules.liveFeed.items.$eventId[".validate"], /sequence/);
assert.match(publicRules.liveFeed.items.$eventId[".validate"], /revision/);
assert.equal(publicRules.liveFeed.items.$eventId.$other[".validate"].includes("judge"), false);
assert.equal(publicRules.liveFeed.items.$eventId.$other[".validate"].includes("html"), false);

assert.equal(liveRules[".read"], true, "operational live read remains unchanged from deployed rules");

assert.ok(projectionOutboxRules, "durable projection outbox rules exist");
assert.notEqual(projectionOutboxRules[".read"], true, "projection recovery data is not public");
assert.match(projectionOutboxRules[".read"], /auth != null/);
assert.match(projectionOutboxRules[".read"], /active/);
assert.match(projectionOutboxRules[".read"], /tournamentAccess/);
assert.match(projectionJobRules.intent[".write"], /supervisor/);
assert.match(projectionJobRules.intent[".write"], /operador/);
assert.match(projectionJobRules.intent[".write"], /juez/);
assert.match(projectionJobRules.intent[".write"], /newData\.val\(\) === data\.val\(\)/);
assert.match(projectionJobRules.intent[".write"], /projectionId/);
assert.match(projectionJobRules.intent[".write"], /tournamentId/);
assert.match(projectionJobRules.intent[".write"], /createdBy\/uid/);
assert.match(projectionJobRules.intent[".write"], /auth\.uid/);
assert.match(projectionJobRules.intent[".validate"], /public_tournament_v2/);
assert.match(projectionJobRules.intent[".validate"], /published_score/);
assert.match(projectionJobRules.intent[".validate"], /sourceRevision/);
assert.match(projectionJobRules.intent[".validate"], /targetPath/);
assert.match(projectionJobRules.intent[".validate"], /sourceFingerprint/);
assert.equal(
  projectionJobRules.intent.$other[".validate"].includes("token"),
  false,
  "outbox intent does not permit secret fields"
);
assert.match(projectionJobRules.state[".write"], /intent\/projectionId/);
assert.match(projectionJobRules.state[".write"], /intent\/sourceRevision/);
assert.match(projectionJobRules.state[".write"], /attempts/);
assert.match(projectionJobRules.state[".write"], /PROCESSING/);
assert.match(projectionJobRules.state[".write"], /CLIENT_CONFIRMED/);
assert.match(projectionJobRules.state[".write"], /VERIFIED/);
assert.match(projectionJobRules.state[".write"], /!== 'VERIFIED'/);
assert.match(projectionJobRules.state[".write"], /updatedBy\/uid/);
assert.match(projectionJobRules.state[".write"], /retriedBy\/uid/);
assert.match(projectionJobRules.state[".write"], /cancelledBy\/uid/);
assert.match(projectionJobRules.state[".write"], /DEAD_LETTER/);
assert.match(projectionJobRules.state[".write"], /SUPERSEDED/);
assert.match(projectionJobRules.state[".write"], /CANCELLED/);
assert.match(projectionJobRules.state[".validate"], /targetFingerprint/);
assert.match(projectionJobRules.state[".validate"], /lastErrorMessage/);
assert.equal(projectionJobRules.$other[".validate"], false);

// Static policy mirror. Automated tests do not use the production RTDB.
const canReadProjection = () => true;
const canWriteProjection = (profile, currentRevision, next) => Boolean(
  profile?.authenticated &&
  profile?.active &&
  ["supervisor", "operador", "juez"].includes(profile.role) &&
  profile.tournaments.includes(next.metadata.tournamentId) &&
  next.schemaVersion === 2 &&
  Number.isSafeInteger(next.projectionRevision) &&
  next.projectionRevision > currentRevision &&
  Number.isSafeInteger(next.liveFeed.revision) &&
  next.liveFeed.revision >= profile.currentLiveFeedRevision
);
const validProjection = {
  schemaVersion: 2,
  projectionRevision: 2,
  metadata: { tournamentId: "tournament-a" },
  liveFeed: { revision: 2 }
};
const supervisor = {
  authenticated: true,
  active: true,
  role: "supervisor",
  tournaments: ["tournament-a"],
  currentLiveFeedRevision: 1
};
assert.equal(canReadProjection(null), true);
assert.equal(canWriteProjection(null, 1, validProjection), false, "public browser cannot write");
assert.equal(canWriteProjection(supervisor, 1, validProjection), true);
assert.equal(canWriteProjection({ ...supervisor, role: "locutor" }, 1, validProjection), false);
assert.equal(canWriteProjection(supervisor, 2, validProjection), false, "equal revision is rejected");
assert.equal(canWriteProjection(supervisor, 3, validProjection), false, "regressive revision is rejected");
assert.equal(canWriteProjection(supervisor, 1, { ...validProjection, schemaVersion: 3 }), false);
assert.equal(
  canWriteProjection(supervisor, 1, { ...validProjection, liveFeed: { revision: 0 } }),
  false,
  "regressive live feed revision is rejected"
);

const outboxTransitions = {
  PENDING: new Set(["PROCESSING", "CANCELLED", "SUPERSEDED"]),
  PROCESSING: new Set(["PROJECTED", "FAILED", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED"]),
  PROJECTED: new Set(["CLIENT_CONFIRMED", "FAILED", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED"]),
  CLIENT_CONFIRMED: new Set(["CLIENT_CONFIRMED", "SUPERSEDED"]),
  VERIFIED: new Set(["SUPERSEDED"]),
  RETRY_WAIT: new Set(["PENDING", "PROCESSING", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED", "CANCELLED"]),
  FAILED: new Set(["PENDING", "PROCESSING", "RETRY_WAIT", "DEAD_LETTER", "SUPERSEDED", "CANCELLED"]),
  DEAD_LETTER: new Set(["PENDING", "DEAD_LETTER", "SUPERSEDED"]),
  SUPERSEDED: new Set(["SUPERSEDED"]),
  CANCELLED: new Set(["CANCELLED"])
};
const authorizedOutboxProfile = (profile, tournamentId) => Boolean(
  profile?.authenticated &&
  profile?.active &&
  ["supervisor", "operador", "juez"].includes(profile.role) &&
  profile.tournaments.includes(tournamentId)
);
const actorChangedSafely = (profile, current, next, key) => (
  JSON.stringify(next[key] || {}) === JSON.stringify(current?.[key] || {}) ||
  next[key]?.uid === profile.uid
);
const canCreateProjectionIntent = (profile, next, current = null) => Boolean(
  authorizedOutboxProfile(profile, next.tournamentId) &&
  next.createdBy?.uid === profile.uid &&
  next.createdBy?.role === profile.role &&
  (!current || JSON.stringify(next) === JSON.stringify(current))
);
const canWriteProjectionJob = (profile, current, next, intent) => Boolean(
  authorizedOutboxProfile(profile, intent.tournamentId) &&
  next.status !== "VERIFIED" &&
  next.verifiedAt === (current.status === "VERIFIED" ? current.verifiedAt : "") &&
  intent.projectionId === next.projectionId &&
  intent.sourceRevision === next.sourceRevision &&
  next.updatedBy?.uid === profile.uid &&
  next.attempts >= current.attempts &&
  next.attempts <= current.attempts + 1 &&
  outboxTransitions[current.status]?.has(next.status) &&
  actorChangedSafely(profile, current, next, "claimedBy") &&
  actorChangedSafely(profile, current, next, "lastAttemptBy") &&
  actorChangedSafely(profile, current, next, "retriedBy") &&
  actorChangedSafely(profile, current, next, "cancelledBy") &&
  (
    next.status !== "PROCESSING" ||
    next.claimedBy?.uid === profile.uid &&
    next.lastAttemptBy?.uid === profile.uid &&
    next.leaseExpiresAtMs > next.updatedAtMs
  ) &&
  (
    next.status !== "CLIENT_CONFIRMED" ||
    current.status === "PROJECTED" &&
    Boolean(next.clientConfirmedAt) &&
    next.targetRevision >= 1 &&
    Boolean(next.targetFingerprint) &&
    !next.verifiedAt
  ) &&
  (
    next.status !== "PENDING" ||
    next.retriedBy?.uid === profile.uid
  ) &&
  (
    next.status !== "CANCELLED" ||
    profile.role === "supervisor" &&
    next.cancelledBy?.uid === profile.uid &&
    Boolean(next.cancelledReason) &&
    Boolean(next.cancelledAt)
  )
);
const outboxIntent = {
  projectionId: "projection-a",
  tournamentId: "tournament-a",
  sourceRevision: 1,
  createdAt: "2026-07-29T00:00:00.000Z",
  createdBy: {
    uid: "user-a",
    role: "supervisor"
  }
};
const userA = { ...supervisor, uid: "user-a" };
assert.equal(canCreateProjectionIntent(userA, outboxIntent), true, "authenticated author is accepted");
assert.equal(
  canCreateProjectionIntent({ ...userA, role: "locutor" }, outboxIntent),
  false,
  "an authenticated user without the outbox grant cannot create an intent"
);
assert.equal(
  canCreateProjectionIntent(userA, {
    ...outboxIntent,
    createdBy: { ...outboxIntent.createdBy, uid: "user-b" }
  }),
  false,
  "forged createdBy uid is rejected"
);
assert.equal(
  canCreateProjectionIntent(userA, {
    ...outboxIntent,
    createdBy: { ...outboxIntent.createdBy, uid: "user-b" }
  }, outboxIntent),
  false,
  "createdBy uid is immutable"
);
assert.equal(
  canCreateProjectionIntent(userA, { ...outboxIntent, createdAt: "2026-07-30T00:00:00.000Z" }, outboxIntent),
  false,
  "createdAt is immutable"
);
for (const [field, value] of [
  ["projectionId", "projection-b"],
  ["idempotencyKey", "other-key"],
  ["sourceRevision", 2],
  ["scoreId", "score-b"]
]) {
  assert.equal(
    canCreateProjectionIntent(userA, { ...outboxIntent, [field]: value }, outboxIntent),
    false,
    `${field} is immutable on the durable intent`
  );
}
const pendingJob = {
  projectionId: "projection-a",
  sourceRevision: 1,
  status: "PENDING",
  attempts: 0,
  updatedAtMs: 1,
  updatedBy: { uid: "user-a" },
  claimedBy: { uid: "" },
  lastAttemptBy: { uid: "" },
  retriedBy: { uid: "user-a" },
  cancelledBy: { uid: "" },
  leaseExpiresAtMs: 0,
  targetRevision: 0,
  targetFingerprint: "",
  clientConfirmedAt: "",
  verifiedAt: ""
};
const processingJob = {
  ...pendingJob,
  status: "PROCESSING",
  attempts: 1,
  updatedAtMs: 10,
  claimedBy: { uid: "user-a" },
  lastAttemptBy: { uid: "user-a" },
  leaseExpiresAtMs: 100
};
assert.equal(
  canWriteProjectionJob(userA, pendingJob, processingJob, outboxIntent),
  true
);
assert.equal(
  canWriteProjectionJob({ ...userA, role: "locutor" }, pendingJob, processingJob, outboxIntent),
  false,
  "unauthorized role cannot process outbox state"
);
for (const status of ["PROCESSING", "PENDING", "CANCELLED", "VERIFIED"]) {
  assert.equal(
    canWriteProjectionJob(
      { ...userA, role: "locutor" },
      pendingJob,
      {
        ...processingJob,
        status,
        retriedBy: { uid: "user-a" },
        cancelledBy: { uid: "user-a" },
        cancelledReason: "cancel",
        cancelledAt: "2026-07-29T00:00:22.000Z"
      },
      outboxIntent
    ),
    false,
    `unauthorized user cannot write ${status}`
  );
}
assert.equal(
  canWriteProjectionJob(userA, pendingJob, { ...pendingJob, status: "DEAD_LETTER" }, outboxIntent),
  false,
  "invalid state transition is rejected"
);
assert.equal(
  canWriteProjectionJob(userA, pendingJob, { ...pendingJob, status: "VERIFIED" }, outboxIntent),
  false,
  "PENDING to VERIFIED is always rejected"
);
assert.equal(
  canWriteProjectionJob(
    userA,
    pendingJob,
    {
      ...pendingJob,
      status: "VERIFIED",
      targetRevision: 2,
      targetFingerprint: "fingerprint",
      verifiedAt: "2026-07-29T00:00:00.000Z",
      updatedBy: { uid: "user-a" }
    },
    outboxIntent
  ),
  false,
  "client-provided verification evidence never authorizes VERIFIED"
);
assert.equal(
  canWriteProjectionJob(
    { ...userA, role: "supervisor" },
    processingJob,
    {
      ...processingJob,
      status: "VERIFIED",
      targetRevision: 2,
      targetFingerprint: "fingerprint",
      verifiedAt: "2026-07-29T00:00:00.000Z"
    },
    outboxIntent
  ),
  false,
  "a client administrator cannot force VERIFIED"
);
const projectedJob = {
  ...processingJob,
  status: "PROJECTED",
  updatedAtMs: 20,
  projectedAt: "2026-07-29T00:00:20.000Z",
  targetRevision: 2,
  targetFingerprint: "fingerprint"
};
assert.equal(
  canWriteProjectionJob(userA, processingJob, projectedJob, outboxIntent),
  true,
  "PROCESSING to PROJECTED is allowed for the current actor"
);
assert.equal(
  canWriteProjectionJob(userA, projectedJob, {
    ...projectedJob,
    status: "CLIENT_CONFIRMED",
    clientConfirmedAt: "2026-07-29T00:00:21.000Z"
  }, outboxIntent),
  true,
  "client readback has a distinct non-authoritative terminal state"
);
assert.equal(
  canWriteProjectionJob(userA, pendingJob, {
    ...processingJob,
    retriedBy: { uid: "user-b" }
  }, outboxIntent),
  false,
  "forged retry actor is rejected"
);
assert.equal(
  canWriteProjectionJob(userA, pendingJob, {
    ...pendingJob,
    status: "CANCELLED",
    cancelledBy: { uid: "user-b" },
    cancelledReason: "cancel",
    cancelledAt: "2026-07-29T00:00:22.000Z"
  }, outboxIntent),
  false,
  "forged cancellation actor is rejected"
);
for (const field of ["projectionId", "sourceRevision"]) {
  assert.equal(
    canWriteProjectionJob(userA, pendingJob, {
      ...processingJob,
      [field]: field === "sourceRevision" ? 2 : "projection-b"
    }, outboxIntent),
    false,
    `${field} is immutable`
  );
}
for (const status of ["PENDING", "PROCESSING", "RETRY_WAIT", "DEAD_LETTER"]) {
  assert.equal(
    canWriteProjectionJob(userA, { ...pendingJob, status }, {
      ...pendingJob,
      status: "VERIFIED",
      targetRevision: 2,
      targetFingerprint: "fingerprint",
      verifiedAt: "2026-07-29T00:00:00.000Z"
    }, outboxIntent),
    false,
    `${status} cannot transition to VERIFIED`
  );
}
assert.equal(
  canWriteProjectionJob(userA, pendingJob, {
    ...processingJob,
    verifiedAt: "2026-07-29T00:00:00.000Z"
  }, outboxIntent),
  false,
  "verification fields are rejected before confirmation"
);

console.log("firebase-public-rules.test.mjs: ok");
