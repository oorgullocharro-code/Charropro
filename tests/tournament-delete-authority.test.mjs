import assert from "node:assert/strict";
import deletionAuthority from "../functions/tournamentDeletionAuthority.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

const {
  TournamentDeletionError,
  assertDeletionActor,
  buildDeletionSuccess,
  buildTournamentDeletionPlan,
  buildTournamentDeletionPreflight,
  prepareTournamentDeletionRequest
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
