import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import deletionAuthority from "../functions/tournamentDeletionAuthority.js?v=20260920-general-scoreboard-active-charreada-multi-team-fix-001-v1";

const {
  TournamentDeletionError,
  assertDeletionActor,
  buildTournamentDeletionBackupContext,
  buildDeletionSuccess,
  buildTournamentDeletionPlan,
  buildTournamentDeletionPreflight,
  markTournamentDeletionBackupRequested,
  prepareTournamentDeletionRequest,
  releaseTournamentDeletionAuthorityLock,
  reserveTournamentDeletionAuthorityLock
} = deletionAuthority;

const tournamentId = "tournament-delete-test";
const precommercial = { status: "precommercial", policyVersion: "1.0.0", sourceVersion: 1 };
const commercial = { status: "commercial_approved", policyVersion: "1.0.0", sourceVersion: 2 };
const request = prepareTournamentDeletionRequest({
  tournamentId,
  expectedRevision: 7,
  idempotencyKey: "delete:tournament-delete-test:request-0001"
});
assert.equal(request.valid, true);
assert.match(request.request.requestId, /^delete_[a-f0-9]{40}$/);

const largeTournament = source().tournament;
largeTournament.officialScoreFanout = Object.fromEntries(Array.from({ length: 85 }, (_, index) => [
  `fanout_${index}`,
  { payload: "x".repeat(70_000) }
]));
assert.ok(Buffer.byteLength(JSON.stringify(largeTournament)) > 5_800_000, "large fixture matches the production failure class");
const lockAtMs = 1_700_000_000_000;
const boundedLock = reserveTournamentDeletionAuthorityLock(null, request.request, actor(), { nowMs: lockAtMs });
assert.equal(boundedLock.outcome.ok, true);
assert.equal(boundedLock.outcome.recovered, false);
assert.equal(boundedLock.lock.expectedRevision, 7);
assert.equal(boundedLock.lock.state, "RESERVED");
assert.equal("officialScoreFanout" in boundedLock.lock, false, "the lock contract cannot rematerialize tournament payloads");
const sameRequest = reserveTournamentDeletionAuthorityLock(boundedLock.lock, request.request, actor(), { nowMs: lockAtMs + 1 });
assert.equal(sameRequest.outcome.ok, true);
assert.equal(sameRequest.outcome.idempotent, true);
const concurrentRequest = prepareTournamentDeletionRequest({
  tournamentId,
  expectedRevision: 7,
  idempotencyKey: "delete:tournament-delete-test:request-0002"
}).request;
const concurrentLock = reserveTournamentDeletionAuthorityLock(boundedLock.lock, concurrentRequest, actor(), { nowMs: lockAtMs + 1 });
assert.deepEqual(concurrentLock.outcome, { ok: false, code: "tournament-delete-in-progress" });
const legacyResidual = {
  requestId: "delete_legacy_residual",
  idempotencyKey: "delete:tournament-delete-test:legacy-residual",
  requestedAt: new Date(lockAtMs - 120_001).toISOString(),
  requestedBy: { uid: "supervisor-a", role: "supervisor" }
};
const recoveredLock = reserveTournamentDeletionAuthorityLock(legacyResidual, concurrentRequest, actor(), { nowMs: lockAtMs });
assert.equal(recoveredLock.outcome.ok, true);
assert.equal(recoveredLock.outcome.recovered, true);
assert.equal(recoveredLock.lock.requestId, concurrentRequest.requestId);
assert.equal(releaseTournamentDeletionAuthorityLock(recoveredLock.lock, "delete_other").released, false);
assert.equal(releaseTournamentDeletionAuthorityLock(recoveredLock.lock, concurrentRequest.requestId).next, null);
const backupMarkedLock = markTournamentDeletionBackupRequested(recoveredLock.lock, concurrentRequest.requestId, {
  backupId: "backup_bounded_lock",
  scopeKey: "scope_bounded_lock"
}, { nowMs: lockAtMs + 2 });
assert.equal(backupMarkedLock.outcome.ok, true);
assert.equal(backupMarkedLock.next.state, "BACKUP_REQUESTED");
assert.equal(backupMarkedLock.next.expectedRevision, 7);
assert.deepEqual(buildTournamentDeletionBackupContext(largeTournament), {
  info: { id: tournamentId, tenantId: "tenant-a", organizationId: "org-a" },
  meta: { tenantId: "", organizationId: "" }
});

const cleanSource = source();
const preflight = buildTournamentDeletionPreflight(cleanSource, tournamentId, precommercial);
assert.equal(preflight.name, "Torneo de prueba");
assert.equal(preflight.revision, 7);
assert.deepEqual(preflight.blockingReasons, []);
assert.equal(preflight.hasLive, true);
assert.equal(preflight.hasPublicProjection, true);
assert.equal(preflight.outboxCount, 1);
assert.equal(preflight.userAccessCount, 2);
assert.equal(preflight.judgeRefsCount, 2);
assert.equal(preflight.broadcastRefsCount, 1);
assert.equal(preflight.dataClassification, "TEST");
assert.equal(preflight.hardDeleteAllowed, true);

const plan = buildTournamentDeletionPlan(cleanSource, preflight, request.request, actor(), 1_700_000_000_000, {
  backupId: "backup_delete_test",
  archiveChecksum: "checksum"
});
for (const path of [
  `tournaments/${tournamentId}`,
  `tournamentIndex/${tournamentId}`,
  `live/${tournamentId}`,
  `publicTournaments/${tournamentId}`,
  `projectionOutbox/${tournamentId}`,
  `history/statistics/${tournamentId}`,
  `audit/publishedScores/${tournamentId}`,
  `judges/assignments/${tournamentId}`,
  "judges/events/event_a",
  "judges/sessions/judge-session-a",
  `userTournamentAccess/user-a/${tournamentId}`,
  `users/user-a/tournamentIds`,
  "broadcastStudio/sessions/session-a"
]) assert.ok(path in plan, `cleanup includes ${path}`);
assert.equal(plan[`tournaments/${tournamentId}`], null);
assert.deepEqual(plan["users/user-a/tournamentIds"], ["tournament-other"]);
assert.equal(plan[`audit/tournamentDeletions/${request.request.requestId}`].backupId, "backup_delete_test");
assert.equal(plan[`audit/tournamentDeletions/${request.request.requestId}`].releaseStatus, "precommercial");
assert.equal(plan[`audit/tournamentDeletions/${request.request.requestId}`].dataClassification, "TEST");
assert.equal(plan[`audit/tournamentDeletions/${request.request.requestId}`].affectedPaths.includes(`tournaments/${tournamentId}`), true);

const officialSource = source();
officialSource.tournament.publishedScores = { official_a: { id: "official_a" } };
const officialPreflight = buildTournamentDeletionPreflight(officialSource, tournamentId, precommercial);
assert.equal(officialPreflight.hasOfficialScores, true);
assert.deepEqual(officialPreflight.blockingReasons, []);
const commercialOfficial = source();
commercialOfficial.tournament.info.dataClassification = "OFFICIAL";
commercialOfficial.tournament.publishedScores = { official_a: { id: "official_a" } };
assert.deepEqual(buildTournamentDeletionPreflight(commercialOfficial, tournamentId, commercial).blockingReasons, ["tournament-has-official-history"]);
const auditSource = source();
auditSource.audit.publishedScores = { audit_a: { id: "audit_a" } };
assert.deepEqual(buildTournamentDeletionPreflight(auditSource, tournamentId, precommercial).blockingReasons, []);
const ledgerSource = source();
ledgerSource.tournament.officialScoreLedger = { attempt_a: { revision: 1 } };
assert.deepEqual(buildTournamentDeletionPreflight(ledgerSource, tournamentId, precommercial).blockingReasons, []);
assert.deepEqual(buildTournamentDeletionPreflight(ledgerSource, tournamentId, commercial).blockingReasons, [], "legacy precommercial tournaments remain TEST without migration");
const invalidRevisionSource = source();
invalidRevisionSource.tournament.meta.version = "Infinity";
const invalidRevisionPreflight = buildTournamentDeletionPreflight(invalidRevisionSource, tournamentId, precommercial);
assert.equal(invalidRevisionPreflight.revision, null);
assert.deepEqual(invalidRevisionPreflight.blockingReasons, ["tournament-delete-revision-invalid"]);

assert.throws(() => assertDeletionActor({ ...actor(), role: "juez" }, cleanSource.tournament), (error) => error instanceof TournamentDeletionError && error.code === "tournament-delete-role-denied");
assert.throws(() => assertDeletionActor({ ...actor(), tenantId: "tenant-other" }, cleanSource.tournament), (error) => error.code === "tournament-delete-tenant-mismatch");
assert.throws(() => assertDeletionActor({ ...actor(), tenantId: "" }, cleanSource.tournament), (error) => error.code === "tournament-delete-tenant-mismatch");
assert.throws(() => assertDeletionActor({ ...actor(), organizationId: "" }, cleanSource.tournament), (error) => error.code === "tournament-delete-organization-mismatch");
assert.doesNotThrow(() => assertDeletionActor({ ...actor(), platformAdmin: true, tenantId: "tenant-other" }, cleanSource.tournament));

const replay = buildDeletionSuccess(plan[`audit/tournamentDeletions/${request.request.requestId}`], true);
assert.equal(replay.ok, true);
assert.equal(replay.idempotentReplay, true);
assert.equal(replay.backupId, "backup_delete_test");

assert.equal(prepareTournamentDeletionRequest({ tournamentId, expectedRevision: -1, idempotencyKey: "short" }).valid, false);
const functionSource = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
const reserveSource = functionSource.slice(functionSource.indexOf("async function reserveTournamentDeletion"), functionSource.indexOf("async function waitForTournamentDeletionBackup"));
assert.match(reserveSource, /\$\{TOURNAMENTS_PATH\}\/\$\{tournamentId\}\/deletionAuthority/);
assert.doesNotMatch(reserveSource, /ref\(`\$\{TOURNAMENTS_PATH\}\/\$\{tournamentId\}`\)\.transaction/);
assert.doesNotMatch(reserveSource, /snapshot\.val\(\)/);
console.log("tournament deletion authority tests passed");

function actor() {
  return { uid: "supervisor-a", name: "Supervisor A", role: "supervisor", active: true, tenantId: "tenant-a", organizationId: "org-a" };
}

function source() {
  return {
    tournament: { info: { id: tournamentId, name: "Torneo de prueba", tenantId: "tenant-a", organizationId: "org-a" }, meta: { version: 7 } },
    audit: { publishedScores: {} },
    historyStatistics: {},
    live: { current: { tournamentId } },
    publicTournament: { metadata: { tournamentId } },
    projectionOutbox: { projection_a: {} },
    judgeAssignments: { charreada_a: { judge_a: true } },
    judgeEvents: { event_a: { tournamentId }, event_b: { tournamentId: "tournament-other" } },
    judgeSessions: { "judge-session-a": { tournamentId }, "judge-session-b": { tournamentId: "tournament-other" } },
    userTournamentAccess: { "user-a": { [tournamentId]: true }, "user-b": { [tournamentId]: true } },
    users: {
      "user-a": { tournamentIds: [tournamentId, "tournament-other"] },
      "user-b": { tournamentIds: [tournamentId] }
    },
    broadcastSessions: { "session-a": { context: { tournamentId } }, "session-b": { context: { tournamentId: "tournament-other" } } }
  };
}
