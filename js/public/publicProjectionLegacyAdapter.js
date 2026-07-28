import { PUBLIC_SCORE_COLUMNS } from "./publicProjection.js?v=20260727-public-foundation-001-projection-v2";

const ALL_COLUMNS = ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "TOTAL"];

export function adaptPublicProjectionToLegacy(snapshot) {
  if (Number(snapshot?.schemaVersion) !== 2) return snapshot || null;
  const competitions = (snapshot.competitions?.items || []).map((competition) => ({
    id: competition.competitionId,
    type: competition.competitionType,
    competitionId: competition.competitionId,
    competitionType: competition.competitionType,
    competitionScope: competition.competitionScope || "team",
    label: competition.name || competition.competitionType,
    scope: competition.competitionScope || "team",
    suerteIds: competition.suerteIds || [],
    charreadaIds: competition.charreadaIds || [],
    legacy: Boolean(competition.legacy)
  }));
  const schedule = (snapshot.program?.items || []).map((item) => ({
    id: item.charreadaId || item.scheduleId,
    charreadaId: item.charreadaId,
    nombre: item.name,
    fecha: item.scheduledDate,
    hora: item.scheduledTime,
    order: item.order,
    status: item.status,
    phase: item.phaseName || "",
    competitionId: item.competitionId,
    competitionType: item.competitionType,
    categoryId: item.categoryId,
    phaseId: item.phaseId,
    equipos: (item.participants || []).filter((entry) => entry.teamId),
    individualParticipants: (item.participants || []).filter((entry) => entry.participantId),
    totalParticipants: (item.participants || []).length,
    legacy: Boolean(item.legacy)
  }));
  const rows = (snapshot.results?.items || []).map((item) => ({
    position: item.officialPosition,
    positionStatus: item.positionStatus,
    teamId: item.teamId,
    teamName: item.teamName,
    participantId: item.participantId,
    participantName: item.participantName,
    association: item.association,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    competitionId: item.competitionId,
    competitionType: item.competitionType,
    competitionScope: item.participantScope,
    phaseId: item.phaseId,
    phase: item.phaseName,
    charreadaId: item.charreadaId,
    ...Object.fromEntries(ALL_COLUMNS.map((column) => [column, column === "TOTAL"
      ? item.officialTotal ?? item.subtotal
      : item.scores?.[column] ?? null])),
    total: item.officialTotal ?? item.subtotal,
    updatedAt: item.publishedAt
  }));
  const standings = (snapshot.live?.standings || []).map((row) => ({
    position: row.officialPosition,
    positionStatus: row.positionStatus,
    teamId: row.teamId,
    teamName: row.teamName,
    participantId: row.participantId,
    participantName: row.participantName,
    total: row.total,
    active: Boolean(row.active),
    competitionId: snapshot.live.competitionId,
    charreadaId: snapshot.live.charreadaId
  }));
  const turn = snapshot.live?.turn || {};
  const activeSchedule = schedule.find((item) => item.charreadaId === snapshot.live?.charreadaId) || null;
  const activeCharreada = snapshot.live?.charreadaId ? {
    ...(activeSchedule || {}),
    id: snapshot.live.charreadaId,
    charreadaId: snapshot.live.charreadaId,
    currentTeam: {
      teamId: turn.team?.id || "",
      teamName: turn.team?.name || ""
    },
    currentParticipant: {
      participantId: turn.participant?.id || "",
      participantName: turn.participant?.name || ""
    },
    currentSuerte: {
      id: turn.suerteId || "",
      name: turn.suerteName || ""
    },
    timer: snapshot.live.timer || null
  } : null;
  const scoreSheetColumns = Object.fromEntries(competitions.map((competition) => [
    competition.id,
    columnsForCompetition(competition)
  ]));

  return {
    info: {
      id: snapshot.metadata?.tournamentId,
      nombre: snapshot.metadata?.name,
      slug: snapshot.metadata?.slug,
      sede: snapshot.overview?.venue,
      fechaInicio: snapshot.overview?.startDate,
      fechaFin: snapshot.overview?.endDate,
      estado: snapshot.status
    },
    activeCharreada,
    currentScoreboard: standings,
    generalRanking: rows,
    scoresheet: rows,
    scoresheetColumns: scoreSheetColumns,
    leaders: {},
    schedule,
    lastScores: snapshot.live?.currentResult ? [{
      team: snapshot.live.currentResult.teamName,
      participantName: snapshot.live.currentResult.participantName,
      suerte: snapshot.live.currentResult.suerteId,
      score: snapshot.live.currentResult.score,
      timestamp: snapshot.live.currentResult.publishedAt,
      charreadaId: snapshot.live.charreadaId,
      competitionId: snapshot.live.competitionId
    }] : [],
    teams: rows,
    competitions,
    stats: {
      publicEntries: rows.length,
      competitions: competitions.length,
      charreadas: schedule.length,
      publishedScores: rows.length,
      updatedAt: snapshot.sourceUpdatedAt
    },
    rankingStatus: snapshot.rankings?.status || "unavailable",
    generatedAt: snapshot.generatedAt,
    generatedAtMs: snapshot.generatedAtMs,
    projectionRevision: snapshot.projectionRevision,
    schemaVersion: snapshot.schemaVersion
  };
}

export function adaptPublicProjectionToLegacyLive(snapshot, tournamentId = "") {
  if (Number(snapshot?.schemaVersion) !== 2) return null;
  const turn = snapshot.live?.turn || {};
  return {
    liveChannel: tournamentId || snapshot.metadata?.tournamentId || "",
    tournament: {
      id: snapshot.metadata?.tournamentId || tournamentId || "",
      name: snapshot.metadata?.name || ""
    },
    charreada: {
      id: snapshot.live?.charreadaId || "",
      name: snapshot.overview?.activeCharreadaName || ""
    },
    competitionId: snapshot.live?.competitionId || "",
    turn: {
      team: {
        id: turn.team?.id || "",
        name: turn.team?.name || "",
        association: turn.team?.association || "",
        category: turn.team?.category || ""
      },
      participant: {
        id: turn.participant?.id || "",
        name: turn.participant?.name || ""
      },
      horse: {
        id: turn.horse?.id || "",
        name: turn.horse?.name || ""
      },
      suerteId: turn.suerteId || "",
      suerte: {
        id: turn.suerteId || "",
        name: turn.suerteName || ""
      }
    },
    timer: snapshot.live?.timer || null,
    teamStandings: snapshot.live?.standings || [],
    published: snapshot.live?.currentResult || null,
    timestamp: snapshot.live?.updatedAt || snapshot.generatedAt || "",
    projectionRevision: snapshot.projectionRevision,
    schemaVersion: snapshot.schemaVersion,
    publicProjection: true
  };
}

function columnsForCompetition(competition) {
  const columns = (competition.suerteIds || []).flatMap((suerteId) => PUBLIC_SCORE_COLUMNS[suerteId] || []);
  return [...new Set([...columns, "TOTAL"])];
}
