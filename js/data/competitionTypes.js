export const COMPETITION_TYPES = Object.freeze([
  {
    type: "equipos_completo",
    label: "Competencia por equipos",
    scope: "team",
    suerteIds: [
      "cala",
      "piales",
      "colas",
      "toro",
      "terna",
      "yegua",
      "manganas_pie",
      "manganas_caballo",
      "paso"
    ],
    rankingMode: "team_total",
    awardGroup: "equipos",
    affectsTeamRanking: true,
    affectsGeneralStatistics: true,
    statsScope: "team"
  },
  {
    type: "charro_completo",
    label: "Charro Completo",
    scope: "individual",
    suerteIds: [
      "cala",
      "piales",
      "colas",
      "toro",
      "manganas_pie",
      "manganas_caballo",
      "paso"
    ],
    rankingMode: "individual_total",
    awardGroup: "charro_completo",
    affectsTeamRanking: false,
    affectsGeneralStatistics: false,
    statsScope: "individual"
  },
  {
    type: "caladero",
    label: "Caladero",
    scope: "individual",
    suerteIds: ["cala"],
    rankingMode: "single_suerte",
    awardGroup: "caladero",
    affectsTeamRanking: false,
    affectsGeneralStatistics: false,
    statsScope: "special"
  },
  {
    type: "coleadero",
    label: "Coleadero",
    scope: "individual",
    suerteIds: ["colas"],
    rankingMode: "single_suerte",
    awardGroup: "coleadero",
    affectsTeamRanking: false,
    affectsGeneralStatistics: false,
    statsScope: "special"
  },
  {
    type: "pialadero",
    label: "Pialadero",
    scope: "individual",
    suerteIds: ["piales"],
    rankingMode: "single_suerte",
    awardGroup: "pialadero",
    affectsTeamRanking: false,
    affectsGeneralStatistics: false,
    statsScope: "special"
  },
  {
    type: "exhibicion",
    label: "Exhibición",
    scope: "exhibition",
    suerteIds: [],
    rankingMode: "none",
    awardGroup: "none",
    affectsTeamRanking: false,
    affectsGeneralStatistics: false,
    statsScope: "exhibition"
  }
]);

const COMPETITION_TYPE_BY_ID = Object.freeze(
  Object.fromEntries(COMPETITION_TYPES.map((competition) => [competition.type, competition]))
);

const LEGACY_TOURNAMENT_TYPE_MAP = Object.freeze({
  completo: "equipos_completo",
  charreada: "equipos_completo",
  caladero: "caladero",
  coleadero: "coleadero",
  pialadero: "pialadero"
});

export function getCompetitionType(type) {
  const normalizedType = normalizeCompetitionType(type);
  return COMPETITION_TYPE_BY_ID[normalizedType] || COMPETITION_TYPE_BY_ID.equipos_completo;
}

export function getCompetitionSuerteIds(type) {
  return [...getCompetitionType(type).suerteIds];
}

export function isTeamCompetition(type) {
  return getCompetitionType(type).scope === "team";
}

export function isIndividualCompetition(type) {
  return getCompetitionType(type).scope === "individual";
}

export function affectsTeamRanking(type) {
  return Boolean(getCompetitionType(type).affectsTeamRanking);
}

export function affectsGeneralStatistics(type) {
  return Boolean(getCompetitionType(type).affectsGeneralStatistics);
}

export function getCompetitionTypeFromTournamentType(tournamentType) {
  const legacyType = String(tournamentType || "").trim();
  return LEGACY_TOURNAMENT_TYPE_MAP[legacyType] || "equipos_completo";
}

export function validateCompetitionType(type) {
  const normalizedType = String(type || "").trim();
  if (!normalizedType) {
    return {
      valid: false,
      type: normalizedType,
      reason: "missing-type"
    };
  }

  if (!COMPETITION_TYPE_BY_ID[normalizedType]) {
    return {
      valid: false,
      type: normalizedType,
      reason: "unknown-type"
    };
  }

  return {
    valid: true,
    type: normalizedType,
    reason: ""
  };
}

function normalizeCompetitionType(type) {
  const validation = validateCompetitionType(type);
  return validation.valid ? validation.type : "equipos_completo";
}
