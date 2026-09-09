import { buildCanonicalTournamentResults } from "../core/canonicalTournamentResults.js";
import { createCanonicalPublicTournamentData, validateCanonicalPublicTournamentData } from "./canonicalPublicTournamentData.js";
import { resolveCanonicalTournamentLifecycle } from "../core/canonicalTournamentLifecycle.js";

export function buildCanonicalPublicProjectionV3(source = {}, options = {}) {
  const tournament = object(source.tournament || source);
  const tournamentId = id(options.tournamentId || tournament.info?.id || tournament.id);
  const generatedAt = new Date(Number(options.nowMs) || Date.now()).toISOString();
  const results = buildCanonicalTournamentResults({ tournament: tournament.info || tournament, teams: tournament.teams, charreadas: tournament.charreadas, publishedScores: tournament.publishedScores, officialScoreLedger: tournament.officialScoreLedger, sourceRevision: options.sourceRevision || maxRevision(tournament), generatedAt }, { tournamentId, generatedAt });
  const rows = results.results.items.map((row) => ({ resultId: row.resultId, teamId: row.teamId, teamName: row.teamName, participantScope: row.participantScope, participantId: row.participantId, participantName: row.participantName, charreadaId: row.charreadaId, ...(row.charreadaName !== undefined ? { charreadaName: row.charreadaName } : {}), competitionId: row.competitionId, ...(row.competitionName !== undefined ? { competitionName: row.competitionName } : {}), phase: row.phaseId || "", ...(row.phaseName !== undefined ? { phaseName: row.phaseName } : {}), columns: Object.fromEntries(Object.entries(row.suertes).map(([key, sport]) => [key, sport.total])), penalties: row.penalties, subtotal: row.subtotal, total: row.total, status: row.status }));
  const standings = results.standings.items.map((item) => ({
    rankingId: item.rankingId,
    resultId: item.resultIds.length === 1 ? item.resultIds[0] : "",
    resultIds: item.resultIds,
    position: item.position,
    scopeType: item.scopeType,
    competitionId: item.competitionId,
    ...(item.competitionName !== undefined ? { competitionName: item.competitionName } : {}),
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
    ...(item.phaseName !== undefined ? { phaseName: item.phaseName } : {}),
    tieBreakLabel: ""
  })).filter((item) => item.resultIds.length > 0);
  const sheet = results.sheet.competitions.map((competition) => ({
    competitionId: competition.competitionId,
    name: competition.name,
    ...(competition.charreadaId !== undefined ? { charreadaId: competition.charreadaId } : {}),
    ...(competition.charreadaName !== undefined ? { charreadaName: competition.charreadaName } : {}),
    ...(competition.phaseId !== undefined ? { phase: competition.phaseId } : {}),
    ...(competition.phaseName !== undefined ? { phaseName: competition.phaseName } : {}),
    rows: competition.rows
  }));
  const lifecycleState = resolveCanonicalTournamentLifecycle({ tournament, liveCurrent: source.liveCurrent });
  return createCanonicalPublicTournamentData({ schemaVersion: 3, projectionVersion: "3.0.0", tournamentId, sourceRevision: results.sourceRevision, projectionRevision: 1, generatedAt, lifecycle: { status: lifecycleState.status }, tournament: tournamentInfo(tournament, tournamentId), branding: {}, modules: [], sponsors: [], program: { items: program(tournament.charreadas, tournament.teams) }, live: publicLive(source.liveCurrent, lifecycleState.status), results: { teams: rows }, standings: { items: standings }, sheet: { competitions: sheet }, timeline: { items: [] }, statistics: results.statistics });
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
function program(value, teams) {
  const teamNames = new Map(collection(teams).map((team) => [id(team.id || team.teamId), text(team.name || team.teamName)]));
  return collection(value).map((item, index) => {
    const teamIds = collection(item.teamIds).map(id).filter(Boolean);
    const explicitTeamNames = collection(item.teamNames).map(text).filter(Boolean);
    const publicTeamNames = explicitTeamNames.length ? explicitTeamNames : teamIds.map((teamId) => teamNames.get(teamId)).filter(Boolean);
    const participantNames = collection(item.participantNames).map(text).filter(Boolean);
    return {
      id: id(item.id || item.charreadaId),
      charreadaId: id(item.id || item.charreadaId),
      competitionId: id(item.competitionId),
      competitionName: text(item.competitionName || item.competition),
      phase: id(item.phaseId),
      phaseName: text(item.phaseName || item.phase),
      name: text(item.name || item.nombre),
      scheduledDate: text(item.date || item.fecha),
      scheduledTime: text(item.startTime || item.hora),
      status: text(item.status || item.estado),
      order: Number.isSafeInteger(item.order) ? item.order : index + 1,
      ...(teamIds.length ? { teamIds } : {}),
      ...(publicTeamNames.length ? { teamNames: publicTeamNames } : {}),
      ...(participantNames.length ? { participantNames } : {})
    };
  }).filter((item) => item.id);
}
function publicLive(value, lifecycleStatus = "PRE_EVENT") { const live = object(value); const turn = object(live.turn); const output = { status: lifecycleStatus, currentCharreada: id(live.charreadaId || live.activeCharreadaId || live.charreada?.id || turn.charreadaId), currentTeam: text(turn.team?.name || live.teamName), currentParticipant: text(turn.participant?.name || live.participantName), currentSuerte: text(turn.suerteName || turn.suerteId || live.suerteId), currentScore: Number.isFinite(Number(live.currentScore)) ? Number(live.currentScore) : undefined, updatedAt: text(live.updatedAt || live.timestamp) }; const publicValue = Object.fromEntries(Object.entries(output).filter(([, entry]) => entry !== "" && entry !== undefined)); return Object.keys(publicValue).length ? publicValue : { status: "PRE_EVENT" }; }
function maxRevision(tournament) { return collection(tournament.publishedScores).reduce((max, item) => Math.max(max, Number(item.revision || 0)), 1); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function collection(value) { return Array.isArray(value) ? value.filter(Boolean) : value && typeof value === "object" ? Object.values(value).filter(Boolean) : []; }
function id(value) { return /^[A-Za-z0-9._:@/-]{1,180}$/.test(String(value || "")) ? String(value) : ""; }
function text(value) { return value === undefined || value === null ? "" : String(value); }
