"use strict";

const crypto = require("node:crypto");

const DELETION_AUTHORITY_VERSION = "1.0.0";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:@/-]{12,180}$/;
const DELETION_AUDIT_ROOT = "audit/tournamentDeletions";

class TournamentDeletionError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "TournamentDeletionError";
    this.code = code;
    this.details = details;
  }
}

function prepareTournamentDeletionRequest(input = {}) {
  const tournamentId = normalizeId(input.tournamentId);
  const expectedRevision = Number(input.expectedRevision);
  const idempotencyKey = String(input.idempotencyKey || "").trim();
  const errors = [];
  if (!tournamentId) errors.push("tournament-delete-tournament-invalid");
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) errors.push("tournament-delete-expected-revision-invalid");
  if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) errors.push("tournament-delete-idempotency-invalid");
  if (errors.length) return { valid: false, errors };
  return {
    valid: true,
    request: {
      tournamentId,
      expectedRevision,
      idempotencyKey,
      requestId: `delete_${sha256(idempotencyKey).slice(0, 40)}`
    }
  };
}

function buildTournamentDeletionPreflight(source = {}, tournamentIdInput = "") {
  const tournamentId = normalizeId(tournamentIdInput);
  const tournament = plainRecord(source.tournament);
  const audit = plainRecord(source.audit);
  const officialScores = plainRecord(tournament.publishedScores);
  const ledger = plainRecord(tournament.officialScoreLedger);
  const auditRecords = plainRecord(audit.publishedScores);
  const historicalRecords = plainRecord(source.historyStatistics);
  const judgeAssignments = plainRecord(source.judgeAssignments);
  const judgeEvents = plainRecord(source.judgeEvents);
  const broadcastSessions = plainRecord(source.broadcastSessions);
  const userTournamentAccess = plainRecord(source.userTournamentAccess);
  const users = plainRecord(source.users);
  const live = source.live;
  const publicTournament = source.publicTournament;
  const projectionOutbox = plainRecord(source.projectionOutbox);
  const hasOfficialScores = Object.keys(officialScores).length > 0;
  const hasLedger = Object.keys(ledger).length > 0;
  const hasAudit = Object.keys(auditRecords).length > 0;
  const hasHistory = Object.keys(historicalRecords).length > 0;
  const revision = tournamentRevision(tournament);
  const userAccessIds = new Set([
    ...Object.entries(userTournamentAccess)
      .filter(([, entries]) => plainRecord(entries)[tournamentId] === true)
      .map(([uid]) => uid),
    ...Object.entries(users)
      .filter(([, profile]) => tournamentIdsForProfile(profile).includes(tournamentId))
      .map(([uid]) => uid)
  ]);
  const judgeRefsCount = Object.keys(judgeAssignments).length
    + Object.values(judgeEvents).filter((event) => String(event?.tournamentId || "") === tournamentId).length;
  const judgeEventIds = Object.entries(judgeEvents)
    .filter(([, event]) => String(event?.tournamentId || "") === tournamentId)
    .map(([eventId]) => eventId)
    .sort();
  const broadcastSessionIds = Object.entries(broadcastSessions)
    .filter(([, session]) => String(session?.context?.tournamentId || "") === tournamentId)
    .map(([sessionId]) => sessionId);
  const blockingReasons = [];
  if (!tournamentId || !tournament.info?.id) blockingReasons.push("tournament-not-found");
  if (tournament.info?.id && revision === null) blockingReasons.push("tournament-delete-revision-invalid");
  if (hasOfficialScores || hasLedger || hasAudit || hasHistory) blockingReasons.push("tournament-has-official-history");
  return {
    tournamentId,
    name: String(tournament.info?.name || tournament.name || ""),
    revision,
    hasOfficialScores,
    hasLedger,
    hasAudit,
    hasHistory,
    hasLive: Boolean(live),
    hasPublicProjection: Boolean(publicTournament),
    outboxCount: Object.keys(projectionOutbox).length,
    userAccessCount: userAccessIds.size,
    userAccessIds: [...userAccessIds].sort(),
    judgeRefsCount,
    judgeEventIds,
    broadcastRefsCount: broadcastSessionIds.length,
    broadcastSessionIds: broadcastSessionIds.sort(),
    blockingReasons
  };
}

function buildTournamentDeletionPlan(source = {}, preflight = {}, request = {}, actor = {}, nowMs = Date.now(), backup = {}) {
  const tournamentId = request.tournamentId;
  const users = plainRecord(source.users);
  const userTournamentAccess = plainRecord(source.userTournamentAccess);
  const broadcastSessions = plainRecord(source.broadcastSessions);
  const updates = {
    [`tournaments/${tournamentId}`]: null,
    [`tournamentIndex/${tournamentId}`]: null,
    [`live/${tournamentId}`]: null,
    [`publicTournaments/${tournamentId}`]: null,
    [`projectionOutbox/${tournamentId}`]: null,
    [`history/statistics/${tournamentId}`]: null,
    [`judges/assignments/${tournamentId}`]: null
  };
  for (const uid of preflight.userAccessIds || []) {
    updates[`userTournamentAccess/${uid}/${tournamentId}`] = null;
    const profile = plainRecord(users[uid]);
    const retained = tournamentIdsForProfile(profile).filter((id) => id !== tournamentId);
    updates[`users/${uid}/tournamentIds`] = retained;
  }
  for (const eventId of preflight.judgeEventIds || []) {
    updates[`judges/events/${eventId}`] = null;
  }
  for (const sessionId of preflight.broadcastSessionIds || []) {
    updates[`broadcastStudio/sessions/${sessionId}`] = null;
  }
  const deletedAt = new Date(nowMs).toISOString();
  updates[`${DELETION_AUDIT_ROOT}/${request.requestId}`] = {
    authorityVersion: DELETION_AUTHORITY_VERSION,
    requestId: request.requestId,
    idempotencyKey: request.idempotencyKey,
    tournamentId,
    name: preflight.name,
    expectedRevision: request.expectedRevision,
    deleted: true,
    deletedAt,
    deletedAtMs: nowMs,
    actor: {
      uid: actor.uid,
      name: actor.name || "",
      role: actor.role || "",
      tenantId: actor.tenantId || "",
      organizationId: actor.organizationId || "",
      platformAdmin: actor.platformAdmin === true
    },
    backupId: String(backup.backupId || ""),
    backupChecksum: String(backup.archiveChecksum || ""),
    affectedPaths: Object.keys(updates).filter((path) => path !== `${DELETION_AUDIT_ROOT}/${request.requestId}`).sort()
  };
  return updates;
}

function buildDeletionSuccess(record = {}, idempotentReplay = false) {
  return {
    ok: true,
    tournamentId: String(record.tournamentId || ""),
    deleted: record.deleted === true,
    backupId: String(record.backupId || ""),
    affectedPaths: Array.isArray(record.affectedPaths) ? [...record.affectedPaths] : [],
    idempotentReplay,
    deletedAt: record.deletedAt || ""
  };
}

function assertDeletionActor(actor = {}, tournament = {}) {
  if (!actor.uid) throw new TournamentDeletionError("tournament-delete-auth-required");
  if (actor.active !== true) throw new TournamentDeletionError("tournament-delete-user-inactive");
  if (actor.role !== "supervisor" && actor.platformAdmin !== true) throw new TournamentDeletionError("tournament-delete-role-denied");
  const tournamentTenantId = String(tournament?.info?.tenantId || tournament?.meta?.tenantId || "");
  const tournamentOrganizationId = String(tournament?.info?.organizationId || tournament?.meta?.organizationId || "");
  if (tournamentTenantId && actor.platformAdmin !== true && tournamentTenantId !== actor.tenantId) {
    throw new TournamentDeletionError("tournament-delete-tenant-mismatch");
  }
  if (tournamentOrganizationId && actor.platformAdmin !== true && tournamentOrganizationId !== actor.organizationId) {
    throw new TournamentDeletionError("tournament-delete-organization-mismatch");
  }
}

function tournamentRevision(tournament = {}) {
  const revision = Number(tournament?.meta?.version ?? tournament?.version ?? 0);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : null;
}

function tournamentIdsForProfile(profile = {}) {
  const ids = Array.isArray(profile?.tournamentIds)
    ? profile.tournamentIds
    : Object.values(plainRecord(profile?.tournamentIds));
  return [...new Set(ids.map(normalizeId).filter(Boolean))];
}

function normalizeId(value) {
  const id = String(value || "").trim();
  return ID_PATTERN.test(id) ? id : "";
}

function plainRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

module.exports = {
  DELETION_AUTHORITY_VERSION,
  DELETION_AUDIT_ROOT,
  TournamentDeletionError,
  assertDeletionActor,
  buildDeletionSuccess,
  buildTournamentDeletionPlan,
  buildTournamentDeletionPreflight,
  prepareTournamentDeletionRequest,
  tournamentIdsForProfile,
  tournamentRevision
};
