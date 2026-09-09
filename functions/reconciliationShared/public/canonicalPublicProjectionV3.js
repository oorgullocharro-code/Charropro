import { buildCanonicalTournamentResults } from "../core/canonicalTournamentResults.js";
import { createCanonicalPublicTournamentData, validateCanonicalPublicTournamentData } from "./canonicalPublicTournamentData.js";

export function buildCanonicalPublicProjectionV3(source = {}, options = {}) {
  const tournament = object(source.tournament || source);
  const tournamentId = id(options.tournamentId || tournament.info?.id || tournament.id);
  const generatedAt = new Date(Number(options.nowMs) || Date.now()).toISOString();
  const results = buildCanonicalTournamentResults({ tournament: tournament.info || tournament, teams: tournament.teams, charreadas: tournament.charreadas, publishedScores: tournament.publishedScores, officialScoreLedger: tournament.officialScoreLedger, sourceRevision: options.sourceRevision || maxRevision(tournament), generatedAt }, { tournamentId, generatedAt });
  const rows = results.results.items.map((row) => ({ resultId: row.resultId, teamId: row.teamId, teamName: row.teamName, participantScope: row.participantScope, participantId: row.participantId, participantName: row.participantName, charreadaId: row.charreadaId, competitionId: row.competitionId, phase: row.phaseId || "", columns: Object.fromEntries(Object.entries(row.suertes).map(([key, sport]) => [key, sport.total])), penalties: row.penalties, subtotal: row.subtotal, total: row.total, status: row.status }));
  const standings = results.standings.items.map((item) => ({
    rankingId: item.rankingId,
    resultId: item.resultIds.length === 1 ? item.resultIds[0] : "",
    resultIds: item.resultIds,
    position: item.position,
    scopeType: item.scopeType,
    competitionId: item.competitionId,
    charreadaId: item.charreadaId || "",
    participantScope: item.participantScope,
    teamId: item.teamId,
    teamName: item.teamName,
    ...(item.participantId ? { participantId: item.participantId } : {}),
    participantName: item.participantName,
    total: item.total,
    classification: item.totalStatus,
    status: item.positionStatus,
    phase: item.phaseId || "",
    tieBreakLabel: ""
  })).filter((item) => item.resultIds.length > 0);
  return createCanonicalPublicTournamentData({ schemaVersion: 3, projectionVersion: "3.0.0", tournamentId, sourceRevision: results.sourceRevision, projectionRevision: 1, generatedAt, lifecycle: { status: lifecycle(tournament, source.liveCurrent) }, tournament: tournamentInfo(tournament, tournamentId), branding: {}, modules: [], sponsors: [], program: { items: program(tournament.charreadas) }, live: publicLive(source.liveCurrent), results: { teams: rows }, standings: { items: standings }, sheet: { competitions: results.sheet.competitions }, timeline: { items: [] }, statistics: results.statistics });
}

export function reconcileCanonicalPublicProjectionV3(previous, candidate, options = {}) {
  const validation = validateCanonicalPublicTournamentData(candidate);
  if (!validation.valid) return { ok: false, changed: false, reason: "invalid-canonical-public-projection", errors: validation.errors, projection: null };
  const previousValidation = validateCanonicalPublicTournamentData(previous);
  const previousIsV3 = previous?.schemaVersion === 3
    && previous?.projectionVersion === "3.0.0"
    && previousValidation.valid;
  if (previousIsV3 && previous.contentHash === candidate.contentHash) return { ok: true, changed: false, reason: "unchanged", projection: structuredClone(previous), changedSections: [] };
  const projection = createCanonicalPublicTournamentData({ ...candidate, projectionRevision: previousIsV3 ? Number(previous.projectionRevision || 0) + 1 : 1, generatedAt: new Date(Number(options.nowMs) || Date.now()).toISOString() });
  return { ok: true, changed: true, reason: "updated", projection, changedSections: ["snapshot"] };
}

export function getCanonicalPublicProjectionSignature(value) { return validateCanonicalPublicTournamentData(value).valid ? value.contentHash : ""; }
function tournamentInfo(tournament, tournamentId) {
  const info = object(tournament.info || tournament);
  return {
    id: tournamentId,
    slug: text(info.slug),
    name: text(info.nombre || info.name),
    shortName: text(info.shortName || info.nombreCorto),
    edition: text(info.edition),
    season: text(info.season),
    status: text(info.status || info.estado),
    startDate: text(info.fechaInicio || info.startDate),
    endDate: text(info.fechaFin || info.endDate),
    venue: text(info.sede || info.venue),
    city: text(info.city || info.ciudad),
    state: text(info.state || info.estadoEntidad),
    organization: text(info.organization || info.organizacion),
    competitionType: text(info.type || info.competitionType)
  };
}
function program(value) {
  return collection(value).map((item, index) => {
    const teamIds = collection(item.teamIds).map(id).filter(Boolean);
    return {
      id: id(item.id || item.charreadaId),
      charreadaId: id(item.id || item.charreadaId),
      competitionId: id(item.competitionId),
      name: text(item.name || item.nombre),
      scheduledDate: text(item.date || item.fecha),
      scheduledTime: text(item.startTime || item.hora),
      status: text(item.status || item.estado),
      order: Number.isSafeInteger(item.order) ? item.order : index + 1,
      ...(teamIds.length ? { teamIds } : {})
    };
  }).filter((item) => item.id);
}
function lifecycle(tournament, live) { const status = text(live?.status || tournament.info?.status || tournament.status).toUpperCase(); return ["LIVE", "RUNNING"].includes(status) ? "LIVE" : ["PAUSED"].includes(status) ? "PAUSED" : ["FINAL", "FINALIZED", "COMPLETED"].includes(status) ? "FINALIZED" : ["ARCHIVED"].includes(status) ? "ARCHIVED" : "PRE_EVENT"; }
function publicLive(value) { const live = object(value); const turn = object(live.turn); const output = { status: text(live.status || turn.status), currentCharreada: id(live.charreadaId || live.activeCharreadaId || live.charreada?.id || turn.charreadaId), currentTeam: text(turn.team?.name || live.teamName), currentParticipant: text(turn.participant?.name || live.participantName), currentSuerte: text(turn.suerteName || turn.suerteId || live.suerteId), currentScore: Number.isFinite(Number(live.currentScore)) ? Number(live.currentScore) : undefined, updatedAt: text(live.updatedAt || live.timestamp) }; const publicValue = Object.fromEntries(Object.entries(output).filter(([, entry]) => entry !== "" && entry !== undefined)); return Object.keys(publicValue).length ? publicValue : { status: "PRE_EVENT" }; }
function maxRevision(tournament) { return collection(tournament.publishedScores).reduce((max, item) => Math.max(max, Number(item.revision || 0)), 1); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function collection(value) { return Array.isArray(value) ? value.filter(Boolean) : value && typeof value === "object" ? Object.values(value).filter(Boolean) : []; }
function id(value) { return /^[A-Za-z0-9._:@/-]{1,180}$/.test(String(value || "")) ? String(value) : ""; }
function text(value) { return value === undefined || value === null ? "" : String(value); }
