import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));

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
assert.match(
  projectionJobRules.state[".write"],
  /\(!data\.exists\(\) && newData\.child\('retriedBy\/uid'\)\.val\(\) === ''\)/,
  "a blank retry actor is limited to initial state creation"
);
assert.match(
  projectionJobRules.state[".write"],
  /\(!data\.exists\(\) && newData\.child\('cancelledBy\/uid'\)\.val\(\) === ''\)/,
  "a blank cancellation actor is limited to initial state creation"
);
assert.doesNotMatch(
  projectionJobRules.state[".write"],
  /\|\| newData\.child\('retriedBy\/uid'\)\.val\(\) === '' \|\|/,
  "existing retry actors cannot be erased through the former global blank allowance"
);
assert.doesNotMatch(
  projectionJobRules.state[".write"],
  /\|\| newData\.child\('cancelledBy\/uid'\)\.val\(\) === '' \|\|/,
  "existing cancellation actors cannot be erased through the former global blank allowance"
);
assert.match(
  projectionJobRules.state[".write"],
  /newData\.child\('retriedBy\/uid'\)\.val\(\) === data\.child\('retriedBy\/uid'\)\.val\(\)/,
  "an unassigned retry actor remains stable across unrelated transitions"
);
assert.match(
  projectionJobRules.state[".write"],
  /newData\.child\('cancelledBy\/uid'\)\.val\(\) === data\.child\('cancelledBy\/uid'\)\.val\(\)/,
  "an unassigned cancellation actor remains stable across unrelated transitions"
);
assert.match(
  projectionJobRules.state[".write"],
  /newData\.child\('claimedBy\/uid'\)\.val\(\) === data\.child\('claimedBy\/uid'\)\.val\(\)/
);
assert.match(
  projectionJobRules.state[".write"],
  /newData\.child\('lastAttemptBy\/uid'\)\.val\(\) === data\.child\('lastAttemptBy\/uid'\)\.val\(\)/
);
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
  next[key]?.uid === current?.[key]?.uid ||
  (!current && next[key]?.uid === "") ||
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
    next.status !== "PROJECTED" ||
    current.status === "PROCESSING" &&
    current.claimedBy?.uid === profile.uid &&
    current.leaseExpiresAtMs >= next.updatedAtMs &&
    Boolean(next.projectedAt)
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
  canWriteProjectionJob(userA, processingJob, {
    ...projectedJob,
    updatedAtMs: processingJob.leaseExpiresAtMs + 1
  }, outboxIntent),
  false,
  "PROCESSING to PROJECTED is rejected after the claim lease expires"
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

assert.equal(actorChangedSafely(userA, null, { retriedBy: { uid: "" } }, "retriedBy"), true);
assert.equal(actorChangedSafely(userA, null, { cancelledBy: { uid: "" } }, "cancelledBy"), true);
assert.equal(
  actorChangedSafely(userA, { retriedBy: { uid: "user-a" } }, { retriedBy: { uid: "" } }, "retriedBy"),
  false,
  "an existing retry actor cannot be erased"
);
assert.equal(
  actorChangedSafely(userA, { cancelledBy: { uid: "user-a" } }, { cancelledBy: { uid: "" } }, "cancelledBy"),
  false,
  "an existing cancellation actor cannot be erased"
);

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runProjectionActorRulesAgainstEmulator();
}

console.log("firebase-public-rules.test.mjs: ok");

async function runProjectionActorRulesAgainstEmulator() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const authHost = String(process.env.FIREBASE_AUTH_EMULATOR_HOST || "").trim();
  const databaseHost = String(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "").trim();
  assert.equal(projectId, "demo-charropro-local", "Rules tests only run against the isolated local project");
  assert.match(authHost, /^127\.0\.0\.1:\d+$/, "Rules tests require the loopback Auth Emulator");
  assert.match(databaseHost, /^127\.0\.0\.1:\d+$/, "Rules tests require the loopback RTDB Emulator");
  assert.equal(JSON.stringify(process.env).includes("charropro-e8a68"), false, "Rules tests cannot target Production");

  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = databaseHost;
  const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const { getDatabase } = requireFromFunctions("firebase-admin/database");
  const app = initializeApp({
    projectId,
    databaseURL: `http://${databaseHost}?ns=${projectId}`
  }, `public-rules-hardening-${Date.now()}`);
  const auth = getAuth(app);
  const database = getDatabase(app);
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `rules-hardening-${suffix}`;
  const users = [
    { uid: `rules-supervisor-${suffix}`, email: `rules-supervisor-${suffix}@example.test`, role: "supervisor" },
    { uid: `rules-judge-${suffix}`, email: `rules-judge-${suffix}@example.test`, role: "juez" },
    { uid: `rules-operator-${suffix}`, email: `rules-operator-${suffix}@example.test`, role: "operador" }
  ];
  const password = "LocalRulesOnly-2026!";
  const testRoot = `charropro/projectionOutbox/${tournamentId}`;

  try {
    for (const user of users) {
      await auth.createUser({ uid: user.uid, email: user.email, password, emailVerified: true });
      await database.ref(`charropro/users/${user.uid}`).set({
        active: true,
        role: user.role,
        tournamentAccess: "all"
      });
      user.token = await signInToAuthEmulator(authHost, user.email, password);
    }

    const supervisor = users[0];
    const judge = users[1];
    const operator = users[2];

    await seedProjectionJob(database, tournamentId, "initial-empty");
    const initialProcessing = buildEmulatorProjectionState("PROCESSING", supervisor.uid, {
      attempts: 1,
      claimedByUid: supervisor.uid,
      lastAttemptByUid: supervisor.uid,
      retriedByUid: "",
      cancelledByUid: ""
    });
    await expectRulesWriteAllowed(databaseHost, projectId, tournamentId, "initial-empty", supervisor.token, initialProcessing);

    await seedProjectionJob(database, tournamentId, "retry-actor-history", buildEmulatorProjectionState("RETRY_WAIT", supervisor.uid, {
      attempts: 1,
      claimedByUid: supervisor.uid,
      lastAttemptByUid: supervisor.uid,
      retriedByUid: supervisor.uid
    }));
    await expectRulesWriteDenied(databaseHost, projectId, tournamentId, "retry-actor-history", supervisor.token,
      buildEmulatorProjectionState("PROCESSING", supervisor.uid, {
        attempts: 2,
        claimedByUid: supervisor.uid,
        lastAttemptByUid: supervisor.uid,
        retriedByUid: ""
      }));

    await seedProjectionJob(database, tournamentId, "cancel-actor-history", buildEmulatorProjectionState("RETRY_WAIT", supervisor.uid, {
      attempts: 1,
      claimedByUid: supervisor.uid,
      lastAttemptByUid: supervisor.uid,
      cancelledByUid: supervisor.uid
    }));
    await expectRulesWriteDenied(databaseHost, projectId, tournamentId, "cancel-actor-history", supervisor.token,
      buildEmulatorProjectionState("PROCESSING", supervisor.uid, {
        attempts: 2,
        claimedByUid: supervisor.uid,
        lastAttemptByUid: supervisor.uid,
        cancelledByUid: ""
      }));

    await seedProjectionJob(database, tournamentId, "legitimate-retry", buildEmulatorProjectionState("RETRY_WAIT", supervisor.uid, {
      attempts: 1,
      claimedByUid: supervisor.uid,
      lastAttemptByUid: supervisor.uid
    }));
    await expectRulesWriteAllowed(databaseHost, projectId, tournamentId, "legitimate-retry", supervisor.token,
      buildEmulatorProjectionState("PENDING", supervisor.uid, {
        attempts: 1,
        claimedByUid: supervisor.uid,
        lastAttemptByUid: supervisor.uid,
        retriedByUid: supervisor.uid
      }));

    await seedProjectionJob(database, tournamentId, "supervisor-cancel", buildEmulatorProjectionState("PENDING", supervisor.uid));
    await expectRulesWriteAllowed(databaseHost, projectId, tournamentId, "supervisor-cancel", supervisor.token,
      buildEmulatorProjectionState("CANCELLED", supervisor.uid, {
        cancelledByUid: supervisor.uid,
        cancelledReason: "operator-request",
        cancelledAt: "2026-08-20T12:00:01.000Z"
      }));

    for (const user of [judge, operator]) {
      const projectionId = `${user.role}-cancel-denied`;
      await seedProjectionJob(database, tournamentId, projectionId, buildEmulatorProjectionState("PENDING", supervisor.uid));
      await expectRulesWriteDenied(databaseHost, projectId, tournamentId, projectionId, user.token,
        buildEmulatorProjectionState("CANCELLED", user.uid, {
          cancelledByUid: user.uid,
          cancelledReason: "unauthorized-cancel",
          cancelledAt: "2026-08-20T12:00:01.000Z"
        }));
    }

    await seedProjectionJob(database, tournamentId, "verified-denied", initialProcessing);
    await expectRulesWriteDenied(databaseHost, projectId, tournamentId, "verified-denied", supervisor.token,
      buildEmulatorProjectionState("VERIFIED", supervisor.uid, {
        attempts: 1,
        claimedByUid: supervisor.uid,
        lastAttemptByUid: supervisor.uid,
        verifiedAt: "2026-08-20T12:00:01.000Z",
        targetRevision: 1,
        targetFingerprint: "verified-fingerprint"
      }));

    await seedProjectionJob(database, tournamentId, "other-uid-denied", buildEmulatorProjectionState("PENDING", supervisor.uid));
    await expectRulesWriteDenied(databaseHost, projectId, tournamentId, "other-uid-denied", judge.token,
      buildEmulatorProjectionState("PROCESSING", judge.uid, {
        attempts: 1,
        claimedByUid: supervisor.uid,
        lastAttemptByUid: judge.uid
      }));
  } finally {
    await database.ref(testRoot).remove();
    await Promise.all(users.map(async (user) => {
      await database.ref(`charropro/users/${user.uid}`).remove();
      try {
        await auth.deleteUser(user.uid);
      } catch (error) {
        if (error?.code !== "auth/user-not-found") throw error;
      }
    }));
    await deleteApp(app);
  }
}

async function seedProjectionJob(database, tournamentId, projectionId, state = null) {
  const path = `charropro/projectionOutbox/${tournamentId}/${projectionId}`;
  await database.ref(path).set({
    intent: { projectionId, sourceRevision: 1 },
    ...(state ? { state } : {})
  });
}

function buildEmulatorProjectionState(status, actorUid, options = {}) {
  const updatedAtMs = Number(options.updatedAtMs || Date.parse("2026-08-20T12:00:00.000Z"));
  const actor = (uid) => ({ uid: String(uid ?? "") });
  return {
    status,
    attempts: Number(options.attempts || 0),
    updatedAt: new Date(updatedAtMs).toISOString(),
    updatedAtMs,
    nextRetryAt: "",
    nextRetryAtMs: 0,
    lastAttemptAt: "",
    lastAttemptAtMs: 0,
    lastErrorCode: "",
    lastErrorMessage: "",
    projectedAt: "",
    clientConfirmedAt: "",
    verifiedAt: String(options.verifiedAt || ""),
    targetRevision: Number(options.targetRevision || 0),
    targetFingerprint: String(options.targetFingerprint || ""),
    leaseOwner: status === "PROCESSING" ? `lease-${actorUid}` : "",
    leaseExpiresAtMs: status === "PROCESSING" ? updatedAtMs + 30000 : 0,
    supersededBy: "",
    deadLetterReason: "",
    cancelledReason: String(options.cancelledReason || ""),
    cancelledAt: String(options.cancelledAt || ""),
    updatedBy: actor(actorUid),
    lastAttemptBy: actor(options.lastAttemptByUid ?? ""),
    claimedBy: actor(options.claimedByUid ?? ""),
    retriedBy: actor(options.retriedByUid ?? ""),
    cancelledBy: actor(options.cancelledByUid ?? ""),
    sourceRevision: 1
  };
}

async function signInToAuthEmulator(authHost, email, password) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-rules-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = await response.json();
  assert.equal(response.ok, true, `Auth Emulator sign-in failed: ${JSON.stringify(body)}`);
  assert.ok(body.idToken, "Auth Emulator returns an ID token");
  return body.idToken;
}

async function writeProjectionState(databaseHost, projectId, tournamentId, projectionId, token, state) {
  const path = ["charropro", "projectionOutbox", tournamentId, projectionId, "state"]
    .map(encodeURIComponent)
    .join("/");
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(projectId)}&auth=${encodeURIComponent(token)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(state)
  });
  return { ok: response.ok, status: response.status, body: await response.text() };
}

async function expectRulesWriteAllowed(databaseHost, projectId, tournamentId, projectionId, token, state) {
  const result = await writeProjectionState(databaseHost, projectId, tournamentId, projectionId, token, state);
  assert.equal(result.ok, true, `Rules unexpectedly denied ${projectionId}: ${result.status} ${result.body}`);
}

async function expectRulesWriteDenied(databaseHost, projectId, tournamentId, projectionId, token, state) {
  const result = await writeProjectionState(databaseHost, projectId, tournamentId, projectionId, token, state);
  assert.equal(result.ok, false, `Rules unexpectedly allowed ${projectionId}`);
  assert.ok([401, 403].includes(result.status), `Rules denial uses an authorization status: ${result.status} ${result.body}`);
}
