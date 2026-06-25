import { getTournamentSuertes } from "../data/suertes.js?v=20260622-prepare-gate1";
import {
  buildCharreadaLeaderboard,
  buildIndividualAwards,
  buildTournamentTeamStandings,
  calculateAttemptTotal,
  hasAttemptActivity
} from "./scoring.js?v=20260622-prepare-gate1";
import { scoreKey, state } from "./state.js?v=20260622-prepare-gate1";

export function buildCharroProStatsCenter(tournamentId = state.activeTournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId) || null;
  if (!tournament) return null;

  const teams = state.teams.filter((team) => team.tournamentId === tournament.id);
  const charreadas = state.charreadas.filter((charreada) => charreada.tournamentId === tournament.id);
  const suertes = getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
  const standings = buildTournamentTeamStandings(tournament.id);
  const awards = buildIndividualAwards(tournament.id);
  const effectiveness = buildTeamEffectiveness(tournament, teams, charreadas, suertes);

  return {
    tournament,
    summary: {
      teamsCount: teams.length,
      charreadasCount: charreadas.length,
      suertesCount: suertes.length,
      publishedAttemptsCount: getActivePublishedScores(tournament.id).length
    },
    topTeams: standings.slice(0, 10).map((row, index) => ({ ...row, rank: index + 1 })),
    topBySuerte: awards.map((group) => ({
      suerte: group.suerte,
      results: group.results.slice(0, 10).map((result, index) => ({ ...result, rank: index + 1 }))
    })),
    tournamentRecords: buildTournamentRecords(tournament, charreadas, standings, awards, effectiveness),
    effectiveness,
    individualAwards: awards.map((group) => ({
      suerte: group.suerte,
      results: group.results
        .slice(0, getAwardPlaces(tournament))
        .map((result, index) => ({ ...result, rank: index + 1 }))
    })),
    championsHistory: buildChampionsHistory()
  };
}

function buildTournamentRecords(tournament, charreadas, standings, awards, effectiveness) {
  const bestByTotal = standings
    .slice()
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0] || null;
  const bestAverage = standings[0] || null;
  const cleanestTeam = standings
    .filter((row) => Number(row.charreadasCount || 0) > 0)
    .slice()
    .sort((a, b) => Number(a.infr || 0) - Number(b.infr || 0) || Number(b.average || 0) - Number(a.average || 0))[0] || null;
  const bestIndividual = awards
    .flatMap((group) => group.results.map((result) => ({ ...result, suerte: group.suerte })))
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0] || null;
  const bestCala = awards.find((group) => group.suerte.id === "cala")?.results?.[0] || null;
  const bestCharreada = charreadas
    .flatMap((charreada) =>
      buildCharreadaLeaderboard(charreada.id).map((row) => ({
        ...row,
        charreada
      }))
    )
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0] || null;
  const bestEffectiveness = effectiveness
    .filter((row) => Number(row.possible || 0) > 0)
    .slice()
    .sort((a, b) =>
      Number(b.percent || 0) - Number(a.percent || 0) ||
      Number(b.successes || 0) - Number(a.successes || 0) ||
      Number(b.points || 0) - Number(a.points || 0)
    )[0] || null;

  return [
    {
      id: "best_total",
      label: "Mejor total de equipo",
      value: bestByTotal ? numberLabel(bestByTotal.total) : "-",
      detail: bestByTotal?.team?.name || "Sin registro"
    },
    {
      id: "best_average",
      label: "Mejor promedio",
      value: bestAverage ? averageLabel(bestAverage.average) : "-",
      detail: bestAverage?.team?.name || "Sin registro"
    },
    {
      id: "best_charreada",
      label: "Mejor charreada",
      value: bestCharreada ? numberLabel(bestCharreada.total) : "-",
      detail: bestCharreada ? `${bestCharreada.team?.name || "Equipo"} / ${bestCharreada.charreada?.name || "Charreada"}` : "Sin registro"
    },
    {
      id: "best_individual",
      label: "Mejor suerte individual",
      value: bestIndividual ? numberLabel(bestIndividual.total) : "-",
      detail: bestIndividual ? `${bestIndividual.charro} / ${bestIndividual.suerte?.name || "Suerte"}` : "Sin registro"
    },
    {
      id: "best_cala",
      label: "Mejor cala",
      value: bestCala ? numberLabel(bestCala.total) : "-",
      detail: bestCala ? `${bestCala.charro} / ${bestCala.team?.name || "Equipo"}` : "Sin registro"
    },
    {
      id: "best_effectiveness",
      label: "Mayor efectividad",
      value: bestEffectiveness ? `${Math.round(bestEffectiveness.percent)}%` : "-",
      detail: bestEffectiveness ? `${bestEffectiveness.team?.name || "Equipo"} / ${bestEffectiveness.successes} de ${bestEffectiveness.possible}` : "Sin registro"
    },
    {
      id: "cleanest_team",
      label: "Menos infracciones",
      value: cleanestTeam ? numberLabel(cleanestTeam.infr) : "-",
      detail: cleanestTeam?.team?.name || "Sin registro"
    }
  ];
}

function buildTeamEffectiveness(tournament, teams, charreadas, suertes) {
  const published = getActivePublishedScores(tournament.id);

  return teams
    .map((team) => {
      const bySuerte = suertes.map((suerte) => {
        const records = published.filter((record) => {
          return (record.team?.id || record.teamId) === team.id &&
            (record.suerte?.id || record.suerteId) === suerte.id;
        });
        const fallback = records.length ? [] : getFallbackAttempts(team.id, charreadas, suerte);
        const attempts = records.length ? records : fallback;
        const successes = attempts.filter(isSuccessfulAttemptRecord).length;
        const possible = attempts.length;
        const points = attempts.reduce((sum, record) => sum + getAttemptRecordTotal(record), 0);

        return {
          suerte,
          possible,
          successes,
          percent: possible ? successes / possible * 100 : 0,
          points
        };
      });
      const possible = bySuerte.reduce((sum, item) => sum + item.possible, 0);
      const successes = bySuerte.reduce((sum, item) => sum + item.successes, 0);
      const points = bySuerte.reduce((sum, item) => sum + item.points, 0);

      return {
        team,
        possible,
        successes,
        percent: possible ? successes / possible * 100 : 0,
        points,
        bySuerte: bySuerte
          .filter((item) => item.possible > 0)
          .sort((a, b) => Number(b.percent || 0) - Number(a.percent || 0) || Number(b.points || 0) - Number(a.points || 0))
      };
    })
    .sort((a, b) =>
      Number(b.percent || 0) - Number(a.percent || 0) ||
      Number(b.successes || 0) - Number(a.successes || 0) ||
      Number(b.points || 0) - Number(a.points || 0) ||
      String(a.team?.name || "").localeCompare(String(b.team?.name || ""))
    );
}

function getFallbackAttempts(teamId, charreadas, suerte) {
  const attempts = [];
  charreadas
    .filter((charreada) => charreada.teamIds?.includes(teamId))
    .forEach((charreada) => {
      const collection = state.scores[scoreKey(charreada.id, teamId, suerte.id)];
      if (!collection) return;
      const flattened = suerte.type === "coleadero" ? collection.flat() : collection;
      flattened.filter(hasAttemptActivity).forEach((attempt) => attempts.push({ attempt }));
    });
  return attempts;
}

function getActivePublishedScores(tournamentId) {
  return (state.publishedScores || []).filter((record) => {
    const recordTournamentId = record.tournament?.id || record.tournamentId || "";
    return recordTournamentId === tournamentId && !record.superseded;
  });
}

function isSuccessfulAttemptRecord(record) {
  const attempt = record.attempt || record;
  return !attempt.desc && getAttemptRecordTotal(record) > 0;
}

function getAttemptRecordTotal(record) {
  if (record.total !== undefined && record.total !== null) return Number(record.total || 0);
  return calculateAttemptTotal(record.attempt || record);
}

function buildChampionsHistory() {
  const latestByTournament = new Map();
  (state.statHistorySnapshots || []).forEach((snapshot) => {
    const tournamentId = snapshot.tournament?.id || "";
    if (!tournamentId) return;
    const current = latestByTournament.get(tournamentId);
    if (!current || Date.parse(snapshot.generatedAt || "") > Date.parse(current.generatedAt || "")) {
      latestByTournament.set(tournamentId, snapshot);
    }
  });

  return [...latestByTournament.values()]
    .map((snapshot) => ({
      snapshotId: snapshot.id || "",
      generatedAt: snapshot.generatedAt || "",
      tournament: snapshot.tournament || {},
      champion: snapshot.summary?.leader || null
    }))
    .filter((item) => item.champion?.team)
    .sort((a, b) => {
      const seasonDiff = Number(getTournamentSeason(b.tournament)) - Number(getTournamentSeason(a.tournament));
      if (seasonDiff) return seasonDiff;
      return Date.parse(b.generatedAt || "") - Date.parse(a.generatedAt || "");
    });
}

function getAwardPlaces(tournament) {
  const places = Math.round(Number(tournament?.individualAwardPlaces || 5));
  if (!Number.isFinite(places)) return 5;
  return Math.max(1, Math.min(20, places));
}

function getTournamentSeason(tournament = {}) {
  const value = String(tournament.season || tournament.date || "").trim();
  const match = value.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? match[1] : new Date().getFullYear().toString();
}

function numberLabel(value) {
  return Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function averageLabel(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}
