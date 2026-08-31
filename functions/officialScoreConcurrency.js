"use strict";

const { createHash } = require("node:crypto");

const OFFICIAL_SCORE_LEDGER_VERSION = "1.0.0";
const OFFICIAL_SCORE_RECORD_VERSION = 1;
const OFFICIAL_SCORE_SOURCE = "charropro-calificador";
const ALLOWED_ROLES = new Set(["supervisor", "operador", "juez"]);
const BLOCKED_TOURNAMENT_STATUSES = new Set(["finalizado", "congelado"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const PATH_ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:@/-]{12,180}$/;

function prepareOfficialScoreRequest(input = {}, actor = {}, options = {}) {
  const tournamentId = normalizePathId(input.tournamentId);
  const scoreId = normalizePathId(input.scoreId);
  const idempotencyKey = normalizeText(input.idempotencyKey, 180);
  const expectedRevision = nonNegativeInteger(input.expectedRevision, -1);
  const scorePayload = sanitizeValue(input.scorePayload, { maxDepth: 14, maxArray: 300, maxKeys: 500 });
  const published = normalizePublishedInput(input.publishedScore);
  const device = normalizeDevice(input.device);
  const nowMs = positiveTimestamp(options.nowMs || Date.now());
  const timestamp = new Date(nowMs).toISOString();
  const cleanActor = normalizeActor(actor);
  const errors = [];

  if (!tournamentId) errors.push("official-score-tournament-invalid");
  if (!scoreId) errors.push("official-score-id-invalid");
  if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) errors.push("official-score-idempotency-invalid");
  if (expectedRevision < 0) errors.push("official-score-expected-revision-invalid");
  if (!cleanActor.uid) errors.push("official-score-auth-required");
  if (!ALLOWED_ROLES.has(cleanActor.role)) errors.push("official-score-role-denied");
  if (!published) errors.push("official-score-payload-invalid");
  if (scorePayload === undefined) errors.push("official-score-draft-invalid");

  const attemptKey = published?.attemptKey || "";
  const expectedAttemptKey = published ? buildAttemptKey(published) : "";
  if (!attemptKey || attemptKey !== expectedAttemptKey) errors.push("official-score-attempt-key-mismatch");
  if (published?.tournament?.id !== tournamentId) errors.push("official-score-tournament-mismatch");
  if (published && scoreId !== buildScoreId(published)) errors.push("official-score-node-mismatch");

  if (errors.length) {
    return { valid: false, errors: [...new Set(errors)] };
  }

  const fingerprint = sha256(stableStringify({
    published: publishedFingerprintPayload(published),
    scorePayload
  }));
  const attemptId = `attempt_${sha256(attemptKey).slice(0, 32)}`;
  const requestId = `request_${sha256(idempotencyKey).slice(0, 32)}`;
  const recordId = `official_${sha256(`${attemptKey}|${idempotencyKey}`).slice(0, 32)}`;

  return {
    valid: true,
    request: {
      ledgerVersion: OFFICIAL_SCORE_LEDGER_VERSION,
      recordVersion: OFFICIAL_SCORE_RECORD_VERSION,
      tournamentId,
      scoreId,
      attemptKey,
      attemptId,
      requestId,
      recordId,
      idempotencyKey,
      expectedRevision,
      fingerprint,
      scorePayload,
      published,
      actor: cleanActor,
      device,
      source: OFFICIAL_SCORE_SOURCE,
      livePayload: sanitizeValue(input.livePayload, { maxDepth: 14, maxArray: 300, maxKeys: 500 }) || null,
      timestamp,
      timestampMs: nowMs
    },
    errors: []
  };
}

function applyOfficialScoreTransaction(currentTournament = {}, request = {}) {
  const tournament = cloneStoredTournament(currentTournament);
  const contextError = validateTournamentContext(tournament, request);
  if (contextError) {
    const rejected = appendAuditEvent(tournament, request, {
      operation: "PUBLISH_OFFICIAL_SCORE",
      result: "REJECTED",
      reason: contextError,
      revision: currentLedgerRevision(tournament, request.attemptId)
    });
    return { tournament: rejected, outcome: conflictOutcome(request, contextError, currentLedgerRevision(tournament, request.attemptId)) };
  }

  tournament.officialScoreLedger = plainRecord(tournament.officialScoreLedger);
  const previousLedger = plainRecord(tournament.officialScoreLedger[request.attemptId]);
  const ledger = normalizeLedger(previousLedger, request, tournament.publishedScores);
  tournament.officialScoreLedger[request.attemptId] = ledger;
  tournament.publishedScores = applyCanonicalLedgerStatus(tournament.publishedScores, ledger);
  const existingRequest = plainRecord(ledger.requests[request.requestId]);

  if (existingRequest.idempotencyKey) {
    if (existingRequest.fingerprint !== request.fingerprint) {
      const reason = "official-score-idempotency-conflict";
      const rejected = appendAuditEvent(tournament, request, {
        operation: "RETRY_OFFICIAL_SCORE",
        result: "REJECTED",
        reason,
        revision: ledger.revision
      });
      return { tournament: rejected, outcome: conflictOutcome(request, reason, ledger.revision) };
    }
    const record = plainRecord(ledger.records[existingRequest.recordId]);
    if (ledger.activeRecordId !== existingRequest.recordId) {
      const reason = "official-score-request-superseded";
      return {
        tournament,
        outcome: conflictOutcome(request, reason, ledger.revision, ledger.activeRecordId)
      };
    }
    return {
      tournament,
      outcome: {
        ok: true,
        idempotent: true,
        conflict: false,
        reason: "official-score-already-committed",
        attemptId: request.attemptId,
        recordId: existingRequest.recordId,
        revision: existingRequest.revision,
        record
      }
    };
  }

  if (request.expectedRevision !== ledger.revision) {
    const reason = "official-score-revision-conflict";
    const rejected = appendAuditEvent(tournament, request, {
      operation: "PUBLISH_OFFICIAL_SCORE",
      result: "CONFLICT",
      reason,
      revision: ledger.revision
    });
    return { tournament: rejected, outcome: conflictOutcome(request, reason, ledger.revision, ledger.activeRecordId) };
  }

  const nextRevision = ledger.revision + 1;
  const previousRecord = plainRecord(ledger.records[ledger.activeRecordId]);
  if (previousRecord.id) {
    ledger.records[ledger.activeRecordId] = {
      ...previousRecord,
      status: "historical",
      superseded: true,
      supersededBy: request.recordId,
      supersededAt: request.timestamp
    };
  }

  const record = buildOfficialRecord(request, nextRevision, previousRecord);
  ledger.records[request.recordId] = record;
  ledger.requests[request.requestId] = {
    idempotencyKey: request.idempotencyKey,
    fingerprint: request.fingerprint,
    recordId: request.recordId,
    revision: nextRevision,
    createdAt: request.timestamp,
    createdAtMs: request.timestampMs,
    authUid: request.actor.uid
  };
  ledger.activeRecordId = request.recordId;
  ledger.revision = nextRevision;
  ledger.updatedAt = request.timestamp;
  ledger.updatedAtMs = request.timestampMs;
  ledger.updatedBy = request.actor;
  tournament.officialScoreLedger[request.attemptId] = ledger;

  tournament.scores = plainRecord(tournament.scores);
  tournament.scores[request.scoreId] = request.scorePayload;
  tournament.publishedScores = normalizePublishedMap(tournament.publishedScores);
  for (const [key, value] of Object.entries(tournament.publishedScores)) {
    if (!value || value.attemptKey !== request.attemptKey || value.superseded) continue;
    tournament.publishedScores[key] = {
      ...value,
      superseded: true,
      supersededBy: request.recordId,
      supersededAt: request.timestamp,
      officialStatus: "historical"
    };
  }
  tournament.publishedScores[request.recordId] = record;

  tournament.officialScoreFanout = plainRecord(tournament.officialScoreFanout);
  tournament.officialScoreFanout[request.recordId] = buildFanoutJob(request, record);
  tournament.meta = plainRecord(tournament.meta);
  tournament.meta.updatedAt = request.timestamp;
  tournament.meta.updatedAtMs = request.timestampMs;
  tournament.meta.updatedBy = request.actor;
  tournament.meta.updatedByName = request.actor.name;
  tournament.meta.lastPublishedScore = record;

  const audited = appendAuditEvent(tournament, request, {
    operation: previousRecord.id ? "CORRECT_OFFICIAL_SCORE" : "PUBLISH_OFFICIAL_SCORE",
    result: "COMMITTED",
    reason: previousRecord.id ? "official-score-correction-committed" : "official-score-committed",
    revision: nextRevision,
    recordId: request.recordId,
    previousRecordId: previousRecord.id || ""
  });

  return {
    tournament: audited,
    outcome: {
      ok: true,
      idempotent: false,
      conflict: false,
      reason: previousRecord.id ? "official-score-correction-committed" : "official-score-committed",
      attemptId: request.attemptId,
      recordId: request.recordId,
      revision: nextRevision,
      record
    }
  };
}

function buildOfficialScoreFanoutUpdates(tournamentId, job = {}) {
  const record = plainRecord(job.record);
  const intent = plainRecord(job.projectionIntent);
  if (!PATH_ID_PATTERN.test(tournamentId) || !record.id || !intent.projectionId) return null;
  const updates = {
    [`audit/publishedScores/${tournamentId}/${record.id}`]: record,
    [`projectionOutbox/${tournamentId}/${intent.projectionId}/intent`]: intent
  };
  if (job.livePayload) updates[`live/${tournamentId}/current`] = job.livePayload;
  return updates;
}

function markOfficialScoreFanoutDelivered(tournament = {}, recordId = "", nowMs = Date.now()) {
  const next = cloneStoredTournament(tournament);
  const jobs = plainRecord(next.officialScoreFanout);
  const job = plainRecord(jobs[recordId]);
  if (!job.recordId) return next;
  const timestampMs = positiveTimestamp(nowMs);
  jobs[recordId] = {
    ...job,
    status: "DELIVERED",
    deliveredAt: new Date(timestampMs).toISOString(),
    deliveredAtMs: timestampMs,
    attempts: nonNegativeInteger(job.attempts, 0) + 1,
    lastError: ""
  };
  next.officialScoreFanout = jobs;
  return next;
}

function markOfficialScoreFanoutFailed(tournament = {}, recordId = "", reason = "fanout-failed", nowMs = Date.now()) {
  const next = cloneStoredTournament(tournament);
  const jobs = plainRecord(next.officialScoreFanout);
  const job = plainRecord(jobs[recordId]);
  if (!job.recordId) return next;
  const timestampMs = positiveTimestamp(nowMs);
  jobs[recordId] = {
    ...job,
    status: "PENDING",
    attempts: nonNegativeInteger(job.attempts, 0) + 1,
    lastAttemptAt: new Date(timestampMs).toISOString(),
    lastAttemptAtMs: timestampMs,
    lastError: normalizeText(reason, 120)
  };
  next.officialScoreFanout = jobs;
  return next;
}

function buildOfficialRecord(request, revision, previousRecord) {
  const published = request.published;
  return {
    ...published,
    id: request.recordId,
    attemptKey: request.attemptKey,
    ledgerVersion: OFFICIAL_SCORE_LEDGER_VERSION,
    version: OFFICIAL_SCORE_RECORD_VERSION,
    revision,
    createdAt: request.timestamp,
    updatedAt: request.timestamp,
    publishedAt: request.timestamp,
    timestamp: request.timestamp,
    timestampMs: request.timestampMs,
    actor: request.actor,
    authUid: request.actor.uid,
    publishedBy: {
      id: request.actor.uid,
      name: request.actor.name,
      role: request.actor.role,
      contact: request.actor.email
    },
    device: request.device,
    idempotencyKey: request.idempotencyKey,
    source: request.source,
    sourceFingerprint: request.fingerprint,
    status: "active",
    officialStatus: "active",
    correction: Boolean(previousRecord.id),
    correctedRecordId: previousRecord.id || "",
    previousTotal: previousRecord.id ? finiteNumber(previousRecord.total, 0) : null,
    superseded: false,
    supersededBy: "",
    supersededAt: ""
  };
}

function buildFanoutJob(request, record) {
  const projectionIntent = buildProjectionIntent(request, record);
  const livePayload = request.livePayload
    ? {
      ...request.livePayload,
      published: record,
      timestamp: request.timestamp
    }
    : null;
  return {
    fanoutVersion: "1.0.0",
    recordId: record.id,
    attemptId: request.attemptId,
    attemptKey: request.attemptKey,
    revision: record.revision,
    status: "PENDING",
    attempts: 0,
    createdAt: request.timestamp,
    createdAtMs: request.timestampMs,
    record,
    projectionIntent,
    livePayload
  };
}

function buildProjectionIntent(request, record) {
  const canonicalKey = stableStringify({
    projectionType: "public_tournament_v2",
    tournamentId: request.tournamentId,
    attemptKey: request.attemptKey,
    sourceId: record.id,
    sourceRevision: record.revision
  });
  const digest = stableDigest(canonicalKey);
  const sourceFingerprint = stableDigest({
    sourceId: record.id,
    scoreId: request.scoreId,
    attemptKey: request.attemptKey,
    sourceRevision: record.revision,
    publishedAt: record.publishedAt,
    total: finiteNumber(record.total, null)
  });
  return {
    outboxVersion: "1.0.0",
    payloadVersion: 1,
    projectionId: `projection_${digest}_${record.revision}`,
    idempotencyKey: `projection:${digest}:${record.revision}`,
    projectionType: "public_tournament_v2",
    tournamentId: request.tournamentId,
    charreadaId: record.charreada?.id || "",
    competitionId: record.competition?.id || record.charreada?.competitionId || "",
    sourceType: "published_score",
    sourceId: record.id,
    scoreId: request.scoreId,
    attemptKey: request.attemptKey,
    sourceRevision: record.revision,
    sourceFingerprint,
    targetPath: `charropro/publicTournaments/${request.tournamentId}`,
    createdAt: request.timestamp,
    createdAtMs: request.timestampMs,
    createdBy: request.actor
  };
}

function appendAuditEvent(tournament, request, detail) {
  tournament.officialScoreAudit = plainRecord(tournament.officialScoreAudit);
  const eventId = `audit_${sha256(`${request.idempotencyKey}|${detail.result}|${detail.reason}`).slice(0, 32)}`;
  tournament.officialScoreAudit[eventId] = {
    auditVersion: "1.0.0",
    eventId,
    attemptId: request.attemptId,
    attemptKey: request.attemptKey,
    recordId: detail.recordId || "",
    previousRecordId: detail.previousRecordId || "",
    idempotencyKey: request.idempotencyKey,
    operation: detail.operation,
    result: detail.result,
    reason: detail.reason,
    revision: nonNegativeInteger(detail.revision, 0),
    user: request.actor.name,
    authUid: request.actor.uid,
    actor: request.actor,
    device: request.device,
    source: request.source,
    date: request.timestamp,
    timestamp: request.timestamp,
    timestampMs: request.timestampMs
  };
  return tournament;
}

function validateTournamentContext(tournament, request) {
  const info = plainRecord(tournament.info);
  if (!info.id || info.id !== request.tournamentId) return "official-score-tournament-not-found";
  if (tournament.deletionAuthority?.requestId) return "official-score-tournament-deletion-pending";
  if (BLOCKED_TOURNAMENT_STATUSES.has(String(info.status || ""))) return "official-score-tournament-closed";
  const tournamentTenantId = normalizeText(info.tenantId || tournament.meta?.tenantId, 128);
  const tournamentOrganizationId = normalizeText(info.organizationId || tournament.meta?.organizationId, 128);
  if (tournamentTenantId && tournamentTenantId !== request.actor.tenantId) return "official-score-tenant-mismatch";
  if (tournamentOrganizationId && tournamentOrganizationId !== request.actor.organizationId) {
    return "official-score-organization-mismatch";
  }
  const activeCharreadaId = String(tournament.meta?.activeCharreadaId || info.activeCharreadaId || "");
  if (!activeCharreadaId || activeCharreadaId !== request.published.charreada.id) {
    return "official-score-active-charreada-mismatch";
  }
  const charreada = findRecordById(tournament.charreadas, request.published.charreada.id);
  if (!charreada) return "official-score-charreada-not-found";
  const competitionId = String(request.published.competition?.id || request.published.charreada.competitionId || "");
  const storedCompetitionId = String(charreada.competitionId || charreada.competitionType || competitionId);
  if (competitionId && storedCompetitionId && competitionId !== storedCompetitionId) {
    return "official-score-competition-mismatch";
  }
  return "";
}

function normalizeLedger(previous = {}, request = {}, legacyPublishedScores = {}) {
  const previousRecords = plainRecord(previous.records);
  const hasLedger = Boolean(previous.ledgerVersion || previous.attemptId || Object.keys(previousRecords).length);
  const legacyRecords = hasLedger
    ? []
    : Object.values(normalizePublishedMap(legacyPublishedScores))
      .filter((record) => record?.attemptKey === request.attemptKey)
      .sort(compareLegacyOfficialRecords);
  const records = hasLedger
    ? previousRecords
    : Object.fromEntries(legacyRecords.map((record) => [record.id, normalizeLegacyOfficialRecord(record)]));
  const activeLegacy = legacyRecords[0] || null;
  const sortedRecords = Object.values(records).sort(compareLegacyOfficialRecords);
  const declaredActiveRecordId = normalizePathId(previous.activeRecordId);
  const activeRecordId = records[declaredActiveRecordId]
    ? declaredActiveRecordId
    : normalizePathId(activeLegacy?.id || sortedRecords[0]?.id);
  const revision = sortedRecords.reduce(
    (maximum, record) => Math.max(maximum, nonNegativeInteger(record.revision, 0)),
    nonNegativeInteger(previous.revision, 0)
  );
  for (const [recordId, record] of Object.entries(records)) {
    const active = recordId === activeRecordId;
    records[recordId] = {
      ...record,
      status: active ? "active" : "historical",
      officialStatus: active ? "active" : "historical",
      superseded: !active,
      supersededBy: active ? "" : record.supersededBy || activeRecordId,
      supersededAt: active ? "" : record.supersededAt || previous.updatedAt || request.timestamp
    };
  }
  return {
    ledgerVersion: OFFICIAL_SCORE_LEDGER_VERSION,
    attemptId: request.attemptId,
    attemptKey: request.attemptKey,
    tournamentId: request.tournamentId,
    charreadaId: request.published.charreada.id,
    competitionId: request.published.competition?.id || request.published.charreada.competitionId || "",
    teamId: request.published.team.id,
    participantId: request.published.competition?.scope === "individual" ? request.published.team.id : "",
    suerteId: request.published.suerte.id,
    attemptIndex: request.published.attemptIndex,
    coleadorIndex: request.published.coleadorIndex,
    activeRecordId,
    revision,
    createdAt: previous.createdAt || activeLegacy?.createdAt || activeLegacy?.publishedAt || request.timestamp,
    createdAtMs: positiveTimestamp(previous.createdAtMs || Date.parse(activeLegacy?.createdAt || activeLegacy?.publishedAt || "") || request.timestampMs),
    updatedAt: previous.updatedAt || request.timestamp,
    updatedAtMs: positiveTimestamp(previous.updatedAtMs || request.timestampMs),
    createdBy: previous.createdBy || activeLegacy?.actor || request.actor,
    updatedBy: previous.updatedBy || request.actor,
    records,
    requests: plainRecord(previous.requests)
  };
}

function applyCanonicalLedgerStatus(publishedScores = {}, ledger = {}) {
  const records = normalizePublishedMap(publishedScores);
  for (const [recordId, record] of Object.entries(records)) {
    if (record?.attemptKey !== ledger.attemptKey) continue;
    const active = recordId === ledger.activeRecordId;
    records[recordId] = {
      ...record,
      status: active ? "active" : "historical",
      officialStatus: active ? "active" : "historical",
      superseded: !active,
      supersededBy: active ? "" : ledger.activeRecordId,
      supersededAt: active ? "" : ledger.updatedAt
    };
  }
  return records;
}

function compareLegacyOfficialRecords(left = {}, right = {}) {
  const revisionDifference = nonNegativeInteger(right.revision, 0) - nonNegativeInteger(left.revision, 0);
  if (revisionDifference) return revisionDifference;
  return String(left.id || "").localeCompare(String(right.id || ""));
}

function normalizeLegacyOfficialRecord(record = {}) {
  const normalized = sanitizeValue(record, { maxDepth: 14, maxArray: 300, maxKeys: 500 }) || {};
  return {
    ...normalized,
    id: normalizePathId(normalized.id),
    ledgerVersion: normalized.ledgerVersion || OFFICIAL_SCORE_LEDGER_VERSION,
    version: Number(normalized.version || OFFICIAL_SCORE_RECORD_VERSION),
    status: "historical",
    officialStatus: "historical"
  };
}

function normalizePublishedInput(value) {
  const source = sanitizeValue(value, { maxDepth: 14, maxArray: 300, maxKeys: 500 });
  if (!source || !source.tournament || !source.charreada || !source.team || !source.suerte) return null;
  const tournamentId = normalizePathId(source.tournament.id);
  const charreadaId = normalizePathId(source.charreada.id);
  const teamId = normalizePathId(source.team.id);
  const suerteId = normalizePathId(source.suerte.id);
  if (!tournamentId || !charreadaId || !teamId || !suerteId || !Number.isFinite(Number(source.total))) return null;
  return {
    ...source,
    attemptKey: normalizeText(source.attemptKey, 300),
    tournament: { ...plainRecord(source.tournament), id: tournamentId },
    charreada: { ...plainRecord(source.charreada), id: charreadaId },
    team: { ...plainRecord(source.team), id: teamId },
    suerte: { ...plainRecord(source.suerte), id: suerteId },
    competition: source.competition ? plainRecord(source.competition) : null,
    attemptIndex: nonNegativeInteger(source.attemptIndex, 0),
    coleadorIndex: nonNegativeInteger(source.coleadorIndex, 0),
    total: Number(source.total)
  };
}

function publishedFingerprintPayload(published) {
  return {
    tournament: published.tournament,
    charreada: published.charreada,
    team: published.team,
    competition: published.competition,
    suerte: published.suerte,
    attemptIndex: published.attemptIndex,
    coleadorIndex: published.coleadorIndex,
    charro: published.charro || "",
    attempt: published.attempt || null,
    total: published.total,
    breakdown: published.breakdown || null
  };
}

function buildAttemptKey(published) {
  return [
    published.tournament.id,
    published.charreada.id,
    published.team.id,
    published.suerte.id,
    nonNegativeInteger(published.attemptIndex, 0),
    nonNegativeInteger(published.coleadorIndex, 0)
  ].join("__");
}

function buildScoreId(published) {
  return `${published.charreada.id}__${published.team.id}__${published.suerte.id}`;
}

function normalizePublishedMap(value) {
  const output = {};
  if (Array.isArray(value)) {
    value.filter(Boolean).forEach((record, index) => {
      const key = normalizePathId(record?.id) || `legacy_${index}`;
      output[key] = {
        ...sanitizeValue(record, { maxDepth: 14, maxArray: 300, maxKeys: 500 }),
        id: key
      };
    });
    return output;
  }
  for (const [key, record] of Object.entries(plainRecord(value))) {
    const cleanKey = normalizePathId(record?.id || key);
    if (cleanKey) output[cleanKey] = {
      ...sanitizeValue(record, { maxDepth: 14, maxArray: 300, maxKeys: 500 }),
      id: cleanKey
    };
  }
  return output;
}

function conflictOutcome(request, reason, revision, activeRecordId = "") {
  return {
    ok: false,
    idempotent: false,
    conflict: reason.includes("conflict") || reason.includes("mismatch") || reason.includes("superseded"),
    reason,
    attemptId: request.attemptId,
    recordId: "",
    activeRecordId,
    revision: nonNegativeInteger(revision, 0),
    expectedRevision: request.expectedRevision
  };
}

function currentLedgerRevision(tournament, attemptId) {
  return nonNegativeInteger(tournament?.officialScoreLedger?.[attemptId]?.revision, 0);
}

function normalizeActor(actor = {}) {
  return {
    uid: normalizeText(actor.uid, 128),
    name: normalizeText(actor.name || actor.email, 160),
    email: normalizeText(actor.email, 180),
    role: normalizeText(actor.role, 40).toLowerCase(),
    clientId: normalizeText(actor.clientId, 128),
    tenantId: normalizeText(actor.tenantId, 128),
    organizationId: normalizeText(actor.organizationId, 128)
  };
}

function normalizeDevice(device = {}) {
  const clean = plainRecord(sanitizeValue(device, { maxDepth: 3, maxArray: 10, maxKeys: 20 }));
  return {
    deviceId: normalizeText(clean.deviceId || clean.id, 128),
    platform: normalizeText(clean.platform, 80),
    userAgent: normalizeText(clean.userAgent, 240)
  };
}

function findRecordById(value, id) {
  const records = Array.isArray(value) ? value : Object.values(plainRecord(value));
  return records.find((record) => record && String(record.id || "") === id) || null;
}

function sanitizeValue(value, limits = {}, seen = new WeakSet(), depth = 0) {
  const maxDepth = limits.maxDepth || 12;
  const maxArray = limits.maxArray || 300;
  const maxKeys = limits.maxKeys || 500;
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 4000);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol" || value === undefined) return undefined;
  if (depth >= maxDepth || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    const output = value.slice(0, maxArray).map((item) => sanitizeValue(item, limits, seen, depth + 1)).filter((item) => item !== undefined);
    seen.delete(value);
    return output;
  }
  const output = Object.create(null);
  for (const key of Object.keys(value).sort().slice(0, maxKeys)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) continue;
    const next = sanitizeValue(descriptor.value, limits, seen, depth + 1);
    if (next !== undefined) output[key] = next;
  }
  seen.delete(value);
  return output;
}

function cloneStoredTournament(value) {
  return sanitizeValue(value, { maxDepth: 32, maxArray: 20000, maxKeys: 100000 }) || {};
}

// RTDB transactions require normal JavaScript objects at the SDK boundary.
// Internal sanitization intentionally uses null-prototype records, so convert
// only after the transaction result is complete without changing its content.
function toFirebaseDatabaseValue(value, seen = new WeakSet(), depth = 0) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "object" || depth >= 32 || seen.has(value)) return null;

  seen.add(value);
  if (Array.isArray(value)) {
    const output = value.map((item) => toFirebaseDatabaseValue(item, seen, depth + 1));
    seen.delete(value);
    return output;
  }

  const output = {};
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) continue;
    output[key] = toFirebaseDatabaseValue(descriptor.value, seen, depth + 1);
  }
  seen.delete(value);
  return output;
}

function stableStringify(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!value || typeof value !== "object") return "null";
  return `{${Object.keys(value).sort().filter((key) => !DANGEROUS_KEYS.has(key)).map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function stableDigest(value) {
  const text = typeof value === "string" ? value : stableStringify(value);
  let left = 2166136261;
  let right = 2246822507;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    left ^= code;
    left = Math.imul(left, 16777619);
    right ^= code + index;
    right = Math.imul(right, 3266489909);
  }
  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0).toString(16).padStart(8, "0")}`;
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function plainRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function normalizePathId(value) {
  const clean = String(value || "").trim();
  return PATH_ID_PATTERN.test(clean) ? clean : "";
}

function normalizeText(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

function positiveTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : Date.now();
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

module.exports = {
  OFFICIAL_SCORE_LEDGER_VERSION,
  OFFICIAL_SCORE_RECORD_VERSION,
  OFFICIAL_SCORE_SOURCE,
  ALLOWED_ROLES,
  prepareOfficialScoreRequest,
  applyOfficialScoreTransaction,
  buildOfficialScoreFanoutUpdates,
  markOfficialScoreFanoutDelivered,
  markOfficialScoreFanoutFailed,
  toFirebaseDatabaseValue,
  stableStringify
};
