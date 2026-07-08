import { getTournamentSuertes } from "../data/suertes.js?v=20260708-recovery-001b-panel-status1";
import {
  buildCharreadaLeaderboard,
  buildIndividualAwards,
  buildTournamentStandingColumns,
  buildTournamentTeamStandings,
  calculateAttemptTotal,
  getTeamCharreadaTotal,
  getTeamInfrTotal,
  getTeamSuerteTotal,
  hasAttemptActivity
} from "./scoring.js?v=20260708-recovery-001b-panel-status1";
import { getTeam, scoreKey, state, uid } from "./state.js?v=20260708-recovery-001b-panel-status1";

export function buildStatisticalHistorySnapshot(tournamentId = state.activeTournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId) || null;
  if (!tournament) return null;

  const charreadas = state.charreadas.filter((charreada) => charreada.tournamentId === tournament.id);
  const standings = buildTournamentTeamStandings(tournament.id);
  const columns = buildTournamentStandingColumns(tournament.id);
  const awards = buildIndividualAwards(tournament.id);
  const suertes = getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
  const performances = buildSuertePerformances(tournament, charreadas, suertes);

  return {
    id: uid("historial"),
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tournament: compactTournament(tournament),
    summary: buildSummary(tournament, charreadas, standings, performances),
    columns: columns.map(compactStandingColumn),
    standings: standings.map((row, index) => compactStandingRow(row, index)),
    charreadas: charreadas.map((charreada) => compactCharreadaHistory(charreada, suertes)),
    awards: awards.map(compactAwardGroup),
    performances
  };
}

function buildSummary(tournament, charreadas, standings, performances) {
  const leader = standings[0] || null;
  return {
    tournamentType: tournament.type || "completo",
    season: getTournamentSeason(tournament),
    teamsCount: state.teams.filter((team) => team.tournamentId === tournament.id).length,
    charreadasCount: charreadas.length,
    performancesCount: performances.length,
    leader: leader
      ? {
          rank: 1,
          team: compactTeam(leader.team),
          total: Number(leader.total || 0),
          average: Number(leader.average || 0),
          infr: Number(leader.infr || 0)
        }
      : null
  };
}

function compactTournament(tournament) {
  return {
    id: tournament.id || "",
    name: tournament.name || "",
    season: getTournamentSeason(tournament),
    type: tournament.type || "completo",
    date: tournament.date || "",
    venue: tournament.venue || "",
    status: tournament.status || ""
  };
}

function getTournamentSeason(tournament = {}) {
  const value = String(tournament.season || tournament.date || "").trim();
  const match = value.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? match[1] : new Date().getFullYear().toString();
}

function compactTeam(team) {
  if (!team) return null;
  return {
    id: team.id || "",
    name: team.name || "",
    participantName: team.participantName || "",
    horseName: team.horseName || "",
    category: team.category || "Libre",
    association: team.association || "",
    captain: team.captain || ""
  };
}

function compactCharreada(charreada) {
  return {
    id: charreada.id || "",
    name: charreada.name || "",
    date: charreada.date || "",
    startTime: charreada.startTime || "",
    status: charreada.status || ""
  };
}

function compactSuerte(suerte) {
  return {
    id: suerte.id || "",
    name: suerte.name || "",
    fullName: suerte.fullName || suerte.name || "",
    type: suerte.type || "",
    attempts: Number(suerte.attempts || 1)
  };
}

function compactStandingColumn(column) {
  return {
    id: column.id || "",
    name: column.name || "",
    date: column.date || "",
    startTime: column.startTime || "",
    status: column.status || "",
    charreadaIds: column.charreadaIds || [],
    sourceCharreadas: column.sourceCharreadas || []
  };
}

function compactStandingRow(row, index) {
  return {
    rank: index + 1,
    team: compactTeam(row.team),
    results: (row.results || []).map((result) => ({
      column: result.charreada || null,
      participated: Boolean(result.participated),
      total: result.total === null || result.total === undefined ? null : Number(result.total || 0),
      infr: Number(result.infr || 0)
    })),
    total: Number(row.total || 0),
    average: Number(row.average || 0),
    charreadasCount: Number(row.charreadasCount || 0),
    infr: Number(row.infr || 0)
  };
}

function compactCharreadaHistory(charreada, suertes) {
  const leaderboard = buildCharreadaLeaderboard(charreada.id);
  return {
    ...compactCharreada(charreada),
    leaderboard: leaderboard.map((item, index) => ({
      rank: index + 1,
      team: compactTeam(item.team),
      total: Number(item.total || 0),
      infr: Number(item.infr || 0),
      suertes: suertes.map((suerte) => ({
        suerte: compactSuerte(suerte),
        total: item.team ? getTeamSuerteTotal(charreada.id, item.team.id, suerte.id) : 0
      }))
    }))
  };
}

function compactAwardGroup(group) {
  return {
    suerte: compactSuerte(group.suerte),
    results: (group.results || []).map((result, index) => ({
      rank: index + 1,
      charro: result.charro || "Sin registrar",
      team: compactTeam(result.team),
      charreada: compactCharreada(result.charreada || {}),
      total: Number(result.total || 0)
    }))
  };
}

function buildSuertePerformances(tournament, charreadas, suertes) {
  const records = [];

  charreadas.forEach((charreada) => {
    (charreada.teamIds || []).forEach((teamId) => {
      const team = getTeam(teamId);
      if (!team) return;

      suertes.forEach((suerte) => {
        const collection = state.scores[scoreKey(charreada.id, team.id, suerte.id)];
        if (!collection) return;

        if (suerte.type === "coleadero") {
          const coleadores = team.participantName ? collection.slice(0, 1) : collection;
          coleadores.forEach((attempts, index) => {
            addPerformance(records, tournament, charreada, team, suerte, attempts, {
              charro: team.participantName || team.roster?.colas?.[index] || `Coleador ${index + 1}`,
              coleadorIndex: index
            });
          });
          return;
        }

        addPerformance(records, tournament, charreada, team, suerte, collection, {
          charro: team.participantName || getRosterNameForSuerte(team, suerte) || "Sin registrar",
          coleadorIndex: null
        });
      });
    });
  });

  return records;
}

function addPerformance(records, tournament, charreada, team, suerte, attempts = [], meta = {}) {
  const activeAttempts = (attempts || []).filter(hasAttemptActivity);
  if (!activeAttempts.length) return;

  records.push({
    id: [
      tournament.id,
      charreada.id,
      team.id,
      suerte.id,
      meta.coleadorIndex ?? "general"
    ].join("__"),
    tournament: compactTournament(tournament),
    charreada: compactCharreada(charreada),
    team: compactTeam(team),
    suerte: compactSuerte(suerte),
    charro: meta.charro || "Sin registrar",
    coleadorIndex: meta.coleadorIndex,
    attemptsCount: activeAttempts.length,
    total: activeAttempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0),
    base: activeAttempts.reduce((sum, attempt) => sum + Number(attempt.base || 0), 0),
    adic: activeAttempts.reduce((sum, attempt) => sum + Number(attempt.adic || 0) + Number(attempt.puntaPts || 0), 0),
    infr: activeAttempts.reduce((sum, attempt) => sum + Number(attempt.infr || 0), 0),
    descCount: activeAttempts.filter((attempt) => attempt.desc).length,
    teamCharreadaTotal: getTeamCharreadaTotal(charreada.id, team.id),
    teamCharreadaInfr: getTeamInfrTotal(charreada.id, team.id)
  });
}

function getRosterNameForSuerte(team = {}, suerte = {}, coleadorIndex = 0) {
  const roster = team.roster || {};
  if (suerte?.type === "coleadero") return roster.colas?.[coleadorIndex] || `Coleador ${coleadorIndex + 1}`;
  if (suerte?.id === "lazo") return roster.terna?.[0] || roster.lazo || "";
  if (suerte?.id === "pial_ruedo") return roster.terna?.[1] || roster.pial_ruedo || "";
  return roster[suerte?.id] || "";
}
