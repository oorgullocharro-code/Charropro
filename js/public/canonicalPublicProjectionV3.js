import {
  adaptCanonicalTournamentResultsToPublicV3,
  buildCanonicalTournamentResults
} from "../core/canonicalTournamentResults.js?v=20260911-coleadero-xlsx-microsoft-excel-compatibility-fix-001-v1";
import {
  createCanonicalPublicTournamentData,
  validateCanonicalPublicTournamentData
} from "./canonicalPublicTournamentData.js?v=20260911-coleadero-xlsx-microsoft-excel-compatibility-fix-001-v1";
import { resolveCanonicalTournamentLifecycle } from "../core/canonicalTournamentLifecycle.js?v=20260911-coleadero-xlsx-microsoft-excel-compatibility-fix-001-v1";

export const CANONICAL_PUBLIC_PROJECTION_VERSION = "3.0.0";

// The projection is deliberately a transport boundary: all sporting resolution
// happens in Canonical Tournament Results before this module receives it.
export function buildCanonicalPublicProjectionV3(source = {}, options = {}) {
  const tournament = object(source.tournament || source);
  const tournamentId = id(options.tournamentId || tournament.info?.id || tournament.id || tournament.tournamentId);
  const generatedAt = iso(options.generatedAt) || new Date(finiteTimestamp(options.nowMs) || Date.now()).toISOString();
  const canonicalResults = source.canonicalTournamentResults || buildCanonicalTournamentResults({
    tournament: tournament.info || tournament,
    teams: tournament.teams,
    participants: tournament.participants,
    horses: tournament.horses,
    charreadas: tournament.charreadas,
    publishedScores: tournament.publishedScores,
    officialScoreLedger: tournament.officialScoreLedger,
    sourceRevision: options.sourceRevision || source.sourceRevision || maxSourceRevision(tournament),
    generatedAt
  }, { tournamentId, generatedAt, sourceRevision: options.sourceRevision });
  const lifecycle = resolveCanonicalTournamentLifecycle({ tournament, liveCurrent: source.liveCurrent });
  const input = adaptCanonicalTournamentResultsToPublicV3(canonicalResults, {
    projectionRevision: 1,
    generatedAt,
    lifecycle: { status: lifecycle.status },
    tournament: publicTournament(tournament, tournamentId),
    branding: publicBranding(tournament),
    modules: publicModules(tournament),
    sponsors: publicSponsors(tournament),
    program: { items: publicProgram(tournament.charreadas, tournament.teams, tournament.participants, tournament.horses) },
    live: publicLive(source.liveCurrent, lifecycle.status, tournament.charreadas),
    timeline: { items: publicTimeline(timelineSource(source, tournament)) },
    statistics: canonicalResults.statistics
  });
  const projection = createCanonicalPublicTournamentData(input);
  const validation = validateCanonicalPublicTournamentData(projection);
  if (!validation.valid) throw new Error(`canonical-public-projection-invalid:${validation.errors.join(",")}`);
  return projection;
}

export function reconcileCanonicalPublicProjectionV3(previous, candidate, options = {}) {
  const validation = validateCanonicalPublicTournamentData(candidate);
  if (!validation.valid) return { ok: false, changed: false, reason: "invalid-canonical-public-projection", errors: validation.errors, projection: null };
  const previousValidation = validateCanonicalPublicTournamentData(previous);
  const previousIsV3 = Number(previous?.schemaVersion) === 3
    && previous?.projectionVersion === CANONICAL_PUBLIC_PROJECTION_VERSION
    && previousValidation.valid;
  if (previousIsV3 && previous.tournamentId !== candidate.tournamentId) {
    return { ok: false, changed: false, reason: "tournament-identity-mismatch", projection: structuredClone(previous) };
  }
  if (previousIsV3 && previous.contentHash === candidate.contentHash) {
    return { ok: true, changed: false, reason: "unchanged", projection: structuredClone(previous), changedSections: [] };
  }
  const now = iso(options.generatedAt) || new Date(finiteTimestamp(options.nowMs) || Date.now()).toISOString();
  const projection = createCanonicalPublicTournamentData({
    ...candidate,
    projectionRevision: previousIsV3 ? integer(previous.projectionRevision) + 1 : 1,
    generatedAt: now
  });
  return { ok: true, changed: true, reason: "updated", projection, changedSections: ["snapshot"] };
}

export function getCanonicalPublicProjectionSignature(value = {}) {
  const validation = validateCanonicalPublicTournamentData(value);
  return validation.valid ? value.contentHash : "";
}

function publicTournament(tournament, tournamentId) {
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

function publicBranding(tournament) {
  const info = object(tournament.info || tournament);
  const branding = object(info.publicBranding || tournament.publicBranding);
  return pick(branding, ["theme", "primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor", "logoUrl", "coverImageUrl", "heroImageUrl", "organizerLogoUrl"]);
}

function publicModules(tournament) {
  return collection(tournament.publicModules || tournament.info?.publicModules)
    .map((item) => ({ type: text(item.type).toLowerCase(), enabled: item.enabled === true, order: integer(item.order) }))
    .filter((item) => item.type);
}

function publicSponsors(tournament) {
  return collection(tournament.publicSponsors || tournament.info?.publicSponsors)
    .map((item) => pick(item, ["id", "name", "logoUrl", "url", "tier", "placement", "order"]))
    .filter((item) => item.id && item.name);
}

function publicProgram(charreadas, teams, participants, horses) {
  const teamEntries = new Map(collection(teams).map((team) => [
    id(team.id || team.teamId),
    {
      teamName: text(team.name || team.teamName)
    }
  ]));
  const horseEntries = new Map(collection(horses).map((horse) => [
    id(horse.id || horse.horseId),
    text(horse.displayName || horse.name)
  ]));
  const participantEntries = new Map(collection(participants).map((participant) => [
    id(participant.id || participant.participantId),
    {
      participantName: text(participant.participantName || participant.name),
      horseId: id(participant.horseId)
    }
  ]));
  return collection(charreadas).map((item, index) => {
    const participantScope = canonicalParticipantScope(item.participantScope, item.competitionScope, item.scope);
    const teamIds = collection(item.teamIds).map(id).filter(Boolean);
    const resolvedTeamNames = collection(item.teamNames).map(text).filter(Boolean);
    const publicTeamNames = resolvedTeamNames.length ? resolvedTeamNames : teamIds.map((teamId) => teamEntries.get(teamId)?.teamName).filter(Boolean);
    const participantIds = collection(item.participantIds).map(id).filter(Boolean);
    const explicitParticipantNames = collection(item.participantNames).map(text).filter(Boolean);
    const participantNames = explicitParticipantNames.length
      ? explicitParticipantNames
      : participantIds.map((participantId) => participantEntries.get(participantId)?.participantName).filter(Boolean);
    const horseIds = participantIds.map((participantId) => participantEntries.get(participantId)?.horseId).filter(Boolean);
    const horseNames = horseIds.map((horseId) => horseEntries.get(horseId)).filter(Boolean);
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
      order: integer(item.order ?? index + 1),
      ...(participantScope ? { participantScope } : {}),
      ...(teamIds.length ? { teamIds } : {}),
      ...(publicTeamNames.length ? { teamNames: publicTeamNames } : {}),
      ...(participantIds.length ? { participantIds } : {}),
      ...(participantNames.length ? { participantNames } : {}),
      ...(horseIds.length ? { horseIds } : {}),
      ...(horseNames.length ? { horseNames } : {})
    };
  }).filter((item) => item.id || item.charreadaId);
}

function publicLive(value, lifecycleStatus = "PRE_EVENT", charreadas = []) {
  const live = object(value);
  const turn = object(live.turn);
  const currentCharreada = id(live.charreadaId || live.activeCharreadaId || live.charreada?.id || turn.charreadaId);
  const charreada = collection(charreadas).find((item) => id(item.id || item.charreadaId) === currentCharreada) || {};
  const participantScope = canonicalParticipantScope(
    live.participantScope,
    live.competitionScope,
    turn.participantScope,
    turn.competitionScope,
    turn.competition?.participantScope,
    turn.competition?.competitionScope,
    turn.competition?.scope,
    charreada.participantScope,
    charreada.competitionScope,
    charreada.scope
  );
  const individual = participantScope === "individual";
  const publicValue = pick({
    status: lifecycleStatus,
    currentCharreada,
    participantScope,
    currentTeam: individual ? "" : text(turn.team?.name || live.teamName),
    currentParticipant: text(turn.participant?.name || live.participantName || turn.team?.participantName),
    currentHorseId: individual ? id(turn.horse?.id || live.horseId || turn.participant?.horseId || live.participant?.horseId || turn.team?.horseId) : "",
    currentHorseName: individual ? text(turn.horse?.name || live.horseName || turn.participant?.horseName || live.participant?.horseName || turn.team?.horseName) : "",
    currentSuerte: text(turn.suerteName || turn.suerteId || live.suerteId),
    currentScore: finite(live.currentScore),
    updatedAt: text(live.updatedAt || live.timestamp)
  }, ["status", "currentCharreada", "participantScope", "currentTeam", "currentParticipant", "currentHorseId", "currentHorseName", "currentSuerte", "currentScore", "updatedAt"]);
  return Object.keys(publicValue).length ? publicValue : { status: "PRE_EVENT" };
}

// Narrative events are accepted only from an already-sanitized public source.
function publicTimeline(value) {
  return collection(value).map((item, index) => pick({ ...item, sequence: integer(item.sequence ?? index + 1) }, ["eventId", "sequence", "occurredAt", "publishedAt", "type", "status", "competitionId", "competitionName", "phaseId", "phaseName", "charreadaId", "charreadaName", "teamId", "teamName", "participantId", "participantName", "suerteId", "suerteName", "label", "score", "previousScore"])).filter((item) => item.eventId);
}

function timelineSource(source, tournament) {
  return Object.prototype.hasOwnProperty.call(source, "publicTimeline")
    ? source.publicTimeline
    : tournament.publicTimeline;
}

function maxSourceRevision(tournament) { return collection(tournament.publishedScores).reduce((max, item) => Math.max(max, integer(item.revision)), 1); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function collection(value) { return Array.isArray(value) ? value.filter(Boolean) : value && typeof value === "object" ? Object.values(value).filter(Boolean) : []; }
function pick(value, keys) { return Object.fromEntries(keys.filter((key) => value[key] !== "" && value[key] !== undefined && value[key] !== null).map((key) => [key, value[key]])); }
function canonicalParticipantScope(...values) { return values.map((value) => text(value).toLowerCase()).find((value) => value === "team" || value === "individual") || ""; }
function id(value) { const clean = text(value); return /^[A-Za-z0-9._:@/-]{1,180}$/.test(clean) ? clean : ""; }
function text(value) { return value === null || value === undefined ? "" : String(value).trim().slice(0, 1000); }
function integer(value) { const number = Number(value); return Number.isSafeInteger(number) ? number : 0; }
function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : undefined; }
function finiteTimestamp(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : 0; }
function iso(value) { const clean = text(value); return Number.isFinite(Date.parse(clean)) ? clean : ""; }
