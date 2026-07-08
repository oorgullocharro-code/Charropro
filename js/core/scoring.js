import { getTournamentSuertes } from "../data/suertes.js?v=20260708-tournament-types-001-pialadero1";
import { calculatePuntaBreakdown, sumTeamPenalties } from "../data/calaRules.js?v=20260708-recovery-001b-panel-status1";
import { getTeam, scoreKey, state } from "./state.js?v=20260708-tournament-types-001-pialadero1";

export function calculateAttemptTotal(attempt) {
  if (!attempt) return 0;
  if (attempt.desc) return 0;
  return (
    (Number(attempt.base) || 0) +
    (Number(attempt.adic) || 0) +
    (Number(attempt.puntaPts) || 0) -
    (Number(attempt.infr) || 0)
  );
}

export function getAttemptTeamPenaltyTotal(attempt = {}) {
  return sumTeamPenalties(attempt);
}

export function calculateAttemptFinalTotal(attempt) {
  return calculateAttemptTotal(attempt) - getAttemptTeamPenaltyTotal(attempt);
}

export function calculateCollectionTotal(collection, suerte) {
  if (!collection || !suerte) return 0;
  if (suerte.type === "coleadero") {
    return collection.flat().reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
  }
  return collection.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
}

export function getTeamCharreadaResta(charreadaId, teamId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  return Number(charreada?.restas?.[teamId] || 0);
}

export function getTeamCharreadaTotal(charreadaId, teamId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  const suertesTotal = getCharreadaSuertes(charreada).reduce((total, suerte) => {
    const collection = state.scores[scoreKey(charreadaId, teamId, suerte.id)];
    return total + calculateCollectionTotal(collection, suerte);
  }, 0);
  return suertesTotal - getTeamCharreadaTeamPenaltyTotal(charreadaId, teamId) + getTeamCharreadaResta(charreadaId, teamId);
}

export function getTeamSuerteTotal(charreadaId, teamId, suerteId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  const suerte = getCharreadaSuertes(charreada).find((item) => item.id === suerteId);
  const collection = state.scores[scoreKey(charreadaId, teamId, suerteId)];
  return calculateCollectionTotal(collection, suerte);
}

export function getTeamTournamentTotal(tournamentId, teamId) {
  return state.charreadas
    .filter((charreada) => charreada.tournamentId === tournamentId && charreada.teamIds.includes(teamId))
    .reduce((total, charreada) => total + getTeamCharreadaTotal(charreada.id, teamId), 0);
}

export function getTeamInfrTotal(charreadaId, teamId) {
  let total = getTeamCharreadaTeamPenaltyTotal(charreadaId, teamId);

  getCharreadaSuertes(state.charreadas.find((item) => item.id === charreadaId)).forEach((suerte) => {
    const collection = state.scores[scoreKey(charreadaId, teamId, suerte.id)];
    if (!collection) return;
    const attempts = suerte.type === "coleadero" ? collection.flat() : collection;
    total += attempts.reduce((sum, attempt) =>
      sum + (Number(attempt.infr) || 0), 0);
  });

  const resta = getTeamCharreadaResta(charreadaId, teamId);
  if (resta < 0) total += Math.abs(resta);
  return total;
}

export function getTeamCharreadaTeamPenaltyTotal(charreadaId, teamId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  return getCharreadaSuertes(charreada).reduce((total, suerte) => {
    const collection = state.scores[scoreKey(charreadaId, teamId, suerte.id)];
    if (!collection) return total;
    const attempts = suerte.type === "coleadero" ? collection.flat() : collection;
    return total + attempts.reduce((sum, attempt) => sum + getAttemptTeamPenaltyTotal(attempt), 0);
  }, 0);
}

export function buildLeaderboard(tournamentId) {
  return state.teams
    .filter((team) => team.tournamentId === tournamentId)
    .map((team) => {
      const infr = state.charreadas
        .filter((charreada) => charreada.tournamentId === tournamentId && charreada.teamIds.includes(team.id))
        .reduce((sum, charreada) => sum + getTeamInfrTotal(charreada.id, team.id), 0);
      return {
        team,
        total: getTeamTournamentTotal(tournamentId, team.id),
        infr,
        negativePoints: infr
      };
    })
    .sort(compareLeaderboardRows);
}

export function buildTournamentTeamStandings(tournamentId) {
  const charreadas = state.charreadas.filter((charreada) => charreada.tournamentId === tournamentId);
  const columns = buildTournamentStandingColumns(tournamentId);

  return state.teams
    .filter((team) => team.tournamentId === tournamentId)
    .map((team) => {
      const results = columns.map((column, index) => {
        const phaseCharreadas = charreadas.filter((charreada) => column.charreadaIds.includes(charreada.id));
        const participatedCharreadas = phaseCharreadas.filter((charreada) => charreada.teamIds.includes(team.id));
        const participated = participatedCharreadas.length > 0;
        const total = participated
          ? participatedCharreadas.reduce((sum, charreada) => sum + getTeamCharreadaTotal(charreada.id, team.id), 0)
          : null;
        const infr = participated
          ? participatedCharreadas.reduce((sum, charreada) => sum + getTeamInfrTotal(charreada.id, team.id), 0)
          : 0;

        return {
          charreada: compactStandingColumn(column, index),
          participated,
          total,
          infr
        };
      });
      const played = results.filter((result) => result.participated);
      const total = played.reduce((sum, result) => sum + Number(result.total || 0), 0);
      const infr = played.reduce((sum, result) => sum + Number(result.infr || 0), 0);
      const average = played.length ? total / played.length : 0;
      const bestResult = played.length
        ? Math.max(...played.map((result) => Number(result.total || 0)))
        : 0;

      return {
        team,
        results,
        total,
        average,
        charreadasCount: played.length,
        infr,
        negativePoints: infr,
        bestResult,
        tieBreakCriteria: {
          average,
          total,
          negativePoints: infr,
          bestResult,
          name: team.name || ""
        }
      };
    })
    .sort(compareTournamentStandingRows);
}

function compareTournamentStandingRows(a, b) {
  return b.average - a.average ||
    b.total - a.total ||
    Number(a.negativePoints ?? a.infr ?? 0) - Number(b.negativePoints ?? b.infr ?? 0) ||
    Number(b.bestResult || 0) - Number(a.bestResult || 0) ||
    String(a.team?.name || "").localeCompare(String(b.team?.name || ""), "es");
}

function compareLeaderboardRows(a, b) {
  return b.total - a.total ||
    Number(a.negativePoints ?? a.infr ?? 0) - Number(b.negativePoints ?? b.infr ?? 0) ||
    String(a.team?.name || "").localeCompare(String(b.team?.name || ""), "es");
}

export function buildTournamentStandingColumns(tournamentId) {
  const columns = new Map();
  const charreadas = state.charreadas.filter((charreada) => charreada.tournamentId === tournamentId);

  charreadas.forEach((charreada, index) => {
    const name = getStandingColumnName(charreada, index);
    const key = normalizeStandingColumnKey(name, index);
    const existing = columns.get(key);

    if (existing) {
      existing.charreadaIds.push(charreada.id);
      existing.sourceCharreadas.push(compactCharreada(charreada, index));
      return;
    }

    columns.set(key, {
      id: key,
      name,
      date: charreada.date || "",
      startTime: charreada.startTime || "",
      status: charreada.status || "",
      charreadaIds: [charreada.id],
      sourceCharreadas: [compactCharreada(charreada, index)]
    });
  });

  return [...columns.values()];
}

export function buildCharreadaLeaderboard(charreadaId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!charreada) return [];

  return charreada.teamIds
    .map((teamId) => ({
      team: getTeam(teamId),
      total: getTeamCharreadaTotal(charreada.id, teamId),
      infr: getTeamInfrTotal(charreada.id, teamId)
    }))
    .filter((item) => item.team)
    .sort((a, b) => b.total - a.total || a.infr - b.infr || a.team.name.localeCompare(b.team.name));
}

export function buildIndividualAwards(tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId) || null;
  return getTournamentSuertes(tournament, state.settings.globalRuleOverrides).map((suerte) => {
    const results = [];
    const charreadas = state.charreadas.filter((charreada) => charreada.tournamentId === tournamentId);

    charreadas.forEach((charreada) => {
      charreada.teamIds.forEach((teamId) => {
        const team = getTeam(teamId);
        const collection = state.scores[scoreKey(charreada.id, teamId, suerte.id)];
        if (!team || !collection) return;

        if (suerte.type === "coleadero") {
          const coleadores = team.participantName ? collection.slice(0, 1) : collection;
          coleadores.forEach((coleadorAttempts, index) => {
            const total = coleadorAttempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
            const active = coleadorAttempts.some((attempt) => hasAttemptActivity(attempt));
            if (active) {
              results.push({
                suerte,
                team,
                charreada,
                charro: team.participantName || team.roster.colas?.[index] || `Coleador ${index + 1}`,
                total
              });
            }
          });
          return;
        }

        const total = collection.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
        const active = collection.some((attempt) => hasAttemptActivity(attempt));
        if (active) {
          results.push({
            suerte,
            team,
            charreada,
            charro: team.participantName || getRosterNameForSuerte(team, suerte) || "Sin registrar",
            total
          });
        }
      });
    });

    results.sort((a, b) => b.total - a.total || a.charro.localeCompare(b.charro));
    return { suerte, results };
  });
}

export function hasAttemptActivity(attempt) {
  if (!attempt) return false;
  return Boolean(
    attempt.base ||
    attempt.adic ||
    attempt.infr ||
    attempt.puntaPts ||
    attempt.desc ||
    attempt.tiempo ||
    attempt.applied?.length ||
    attempt.customAdic?.length ||
    attempt.customInfr?.length ||
    attempt.teamPenalties?.length ||
    attempt.attempted ||
    attempt.notAchieved
  );
}

export function applyPuntaCalculation(attempt) {
  const punta = calculatePuntaBreakdown(attempt);
  attempt.puntaMetros = punta.metros;
  attempt.puntaPiquetes = punta.tiempos;
  attempt.puntaPts = punta.total;
}

function compactCharreada(charreada, index) {
  return {
    id: charreada.id,
    name: charreada.name || `Charreada ${index + 1}`,
    date: charreada.date || "",
    startTime: charreada.startTime || "",
    status: charreada.status || ""
  };
}

function getRosterNameForSuerte(team = {}, suerte = {}, coleadorIndex = 0) {
  const roster = team.roster || {};
  if (suerte?.type === "coleadero") return roster.colas?.[coleadorIndex] || `Coleador ${coleadorIndex + 1}`;
  if (suerte?.id === "lazo") return roster.terna?.[0] || roster.lazo || "";
  if (suerte?.id === "pial_ruedo") return roster.terna?.[1] || roster.pial_ruedo || "";
  return roster[suerte?.id] || "";
}

function compactStandingColumn(column, index) {
  return {
    id: column.id || `fase_${index + 1}`,
    name: column.name || `Fase ${index + 1}`,
    date: column.date || "",
    startTime: column.startTime || "",
    status: column.status || "",
    charreadaIds: column.charreadaIds || []
  };
}

function getStandingColumnName(charreada, index) {
  return String(charreada?.name || `Charreada ${index + 1}`).trim() || `Charreada ${index + 1}`;
}

function normalizeStandingColumnKey(value, index) {
  const key = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/\s+/g, " ");
  return key || `charreada ${index + 1}`;
}

function getCharreadaSuertes(charreada) {
  const tournament = state.tournaments.find((item) => item.id === charreada?.tournamentId) || null;
  return getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
}
