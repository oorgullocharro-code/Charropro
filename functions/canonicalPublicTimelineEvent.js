"use strict";

const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,220}$/;
const CONTEXT_ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,180}$/;
const PUBLIC_EVENT_FIELDS = Object.freeze([
  "eventId", "sequence", "occurredAt", "publishedAt", "type", "status",
  "competitionId", "competitionName", "phaseId", "phaseName",
  "charreadaId", "charreadaName", "teamId", "teamName",
  "participantId", "participantName", "suerteId", "suerteName",
  "label", "score", "previousScore"
]);

// This producer only converts an accepted official record to public narrative.
// It intentionally never reads a ledger, selects a record, or recalculates sport.
function buildCanonicalPublicTimelineEvent(record = {}, tournament = {}) {
  const source = plainRecord(record);
  const tournamentSource = plainRecord(tournament);
  const recordId = pathId(source.id);
  const score = finiteNumber(source.total);
  const occurredAt = acceptedTimestamp(source);
  if (!recordId || score === null || !occurredAt) return null;

  const correction = source.correction === true;
  const previousScore = correction ? finiteNumber(source.previousTotal) : null;
  const recordedCharreada = plainRecord(source.charreada);
  const recordedTeam = plainRecord(source.team);
  const charreada = canonicalRecord(tournamentSource.charreadas, recordedCharreada.id || source.charreadaId);
  const team = canonicalRecord(tournamentSource.teams, recordedTeam.id || source.teamId);
  const competition = plainRecord(source.competition);
  const participant = plainRecord(source.participant);
  const suerte = plainRecord(source.suerte);
  const phase = plainRecord(source.phase);
  const charro = plainRecord(source.charro);

  const event = {
    eventId: `timeline_${recordId}`,
    sequence: acceptedTimestampMs(source, occurredAt),
    occurredAt,
    publishedAt: occurredAt,
    type: correction ? "CORRECTION" : "SCORE",
    status: correction ? "CORRECTED" : "OFFICIAL",
    competitionId: contextId(competition.id || source.competitionId || charreada.competitionId || recordedCharreada.competitionId),
    competitionName: publicName(competition.name, competition.nombre, source.competitionName, charreada.competitionName, recordedCharreada.competitionName),
    phaseId: contextId(phase.id || source.phaseId || charreada.phaseId || recordedCharreada.phaseId),
    phaseName: publicName(phase.name, phase.nombre, source.phaseName, charreada.phaseName, recordedCharreada.phaseName),
    charreadaId: contextId(charreada.id || recordedCharreada.id || source.charreadaId),
    charreadaName: publicName(charreada.name, charreada.nombre, recordedCharreada.name, recordedCharreada.nombre, source.charreadaName),
    teamId: contextId(team.id || recordedTeam.id || source.teamId),
    teamName: publicName(team.name, team.nombre, team.teamName, recordedTeam.name, recordedTeam.nombre, recordedTeam.teamName, source.teamName),
    participantId: contextId(participant.id || source.participantId),
    participantName: publicName(
      participant.name,
      participant.nombre,
      source.participantName,
      charro.name,
      charro.nombre,
      typeof source.charro === "string" ? source.charro : ""
    ),
    suerteId: contextId(suerte.id || source.suerteId),
    suerteName: publicName(suerte.name, suerte.nombre, suerte.label, source.suerteName),
    score
  };
  if (previousScore !== null) event.previousScore = previousScore;
  event.label = publicLabel(event);
  return normalizeCanonicalPublicTimelineEvent(event);
}

function normalizeCanonicalPublicTimelineEvent(value = {}) {
  const source = plainRecord(value);
  const event = {};
  for (const field of PUBLIC_EVENT_FIELDS) {
    if (!(field in source)) continue;
    if (["sequence"].includes(field)) {
      const sequence = safeInteger(source[field]);
      if (sequence !== null) event[field] = sequence;
    } else if (["score", "previousScore"].includes(field)) {
      const score = finiteNumber(source[field]);
      if (score !== null) event[field] = score;
    } else if (["eventId"].includes(field)) {
      const eventId = pathId(source[field]);
      if (eventId) event[field] = eventId;
    } else if (field.endsWith("Id")) {
      const id = contextId(source[field]);
      if (id) event[field] = id;
    } else {
      const text = publicText(source[field]);
      if (text) event[field] = text;
    }
  }
  if (!event.eventId || !event.sequence || !event.occurredAt || !event.type || !("score" in event)) return null;
  if (event.type === "CORRECTION" && !("previousScore" in event)) return null;
  return event;
}

function publicTimelinePath(tournamentId, event = {}) {
  const cleanTournamentId = pathId(tournamentId);
  const normalized = normalizeCanonicalPublicTimelineEvent(event);
  return cleanTournamentId && normalized ? `tournaments/${cleanTournamentId}/publicTimeline/${normalized.eventId}` : "";
}

function acceptedTimestamp(source) {
  const direct = publicText(source.publishedAt || source.timestamp || source.createdAt || source.updatedAt);
  if (direct && Number.isFinite(Date.parse(direct))) return direct;
  const timestampMs = acceptedTimestampMs(source, "");
  return timestampMs ? new Date(timestampMs).toISOString() : "";
}

function acceptedTimestampMs(source, occurredAt) {
  for (const candidate of [source.timestampMs, source.createdAtMs, source.updatedAtMs, Date.parse(occurredAt)]) {
    const parsed = safeInteger(candidate);
    if (parsed && parsed > 0) return parsed;
  }
  return 0;
}

function publicLabel(event) {
  const context = [event.suerteName, event.teamName, event.participantName].filter(Boolean);
  return context.join(" · ") || "Calificación oficial";
}

function publicName(...values) {
  for (const value of values) {
    const text = publicText(value);
    if (text && !looksTechnical(text)) return text;
  }
  return "";
}

function looksTechnical(value) {
  return /^(?:torneo|tournament|charreada|equipo|team|participant|charro|official|attempt|ledger|uid)[_:-]/i.test(value)
    || value.includes("__");
}

function plainRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function canonicalRecord(collection, entityId) {
  const cleanId = contextId(entityId);
  const values = Array.isArray(collection) ? collection : Object.values(plainRecord(collection));
  return plainRecord(values.find((item) => contextId(item?.id || item?.charreadaId || item?.teamId) === cleanId));
}

function pathId(value) {
  const clean = publicText(value);
  return EVENT_ID_PATTERN.test(clean) ? clean : "";
}

function contextId(value) {
  const clean = publicText(value);
  return CONTEXT_ID_PATTERN.test(clean) ? clean : "";
}

function publicText(value) {
  return value === null || value === undefined ? "" : String(value).trim().slice(0, 240);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

module.exports = {
  PUBLIC_EVENT_FIELDS,
  buildCanonicalPublicTimelineEvent,
  normalizeCanonicalPublicTimelineEvent,
  publicTimelinePath
};
