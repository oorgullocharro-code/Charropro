const SCOREBOARD_STATUSES = Object.freeze({
  OFFICIAL: "OFFICIAL",
  NOT_STARTED: "NOT_STARTED",
  UNAVAILABLE: "UNAVAILABLE"
});

// Presentation-only selector. Totals arrive from the resolved official ranking;
// this joins them to the active charreada roster without recalculating scores.
export function selectActiveCharreadaScoreboard({ charreada, teams, leaderboard, turn } = {}) {
  const rosterIds = uniqueIds(charreada?.teamIds);
  const officialByTeamId = officialRowsByTeamId(leaderboard);
  const activeTeamId = string(turn?.team?.id);
  const activeCharro = string(turn?.charro);

  if (!rosterIds.length) {
    return {
      source: "legacy",
      rows: selectLegacyScoreboardRows({ officialByTeamId, activeTeamId, activeCharro, turn })
    };
  }

  const teamById = new Map(collection(teams).map((team) => [string(team?.id), team]).filter(([id]) => id));
  return {
    source: "active-charreada",
    rows: rosterIds.map((teamId, index) => {
      const official = officialByTeamId.get(teamId) || null;
      const team = teamById.get(teamId) || {};
      const active = teamId === activeTeamId;
      return {
        id: teamId,
        name: string(official?.team?.name) || string(team?.name) || `Equipo ${index + 1}`,
        total: official ? number(official.total) : 0,
        status: official ? SCOREBOARD_STATUSES.OFFICIAL : SCOREBOARD_STATUSES.NOT_STARTED,
        hasOfficialScore: Boolean(official),
        active,
        currentCharro: active ? activeCharro : ""
      };
    })
  };
}

// Public Projection V3 owns standings. This adapter preserves its official totals
// while selecting the scopes required by the live-output consumers.
export function selectPublicProjectionStandingRows(projection = {}, { activeCharreada, competitionId, categoryId } = {}) {
  const activeCharreadaId = string(activeCharreada?.id);
  const resolvedCompetitionId = string(competitionId) || string(activeCharreada?.competitionId);
  const resolvedCategoryId = string(categoryId) || string(activeCharreada?.categoryId);
  const items = collection(projection?.standings?.items);
  const inActiveCompetition = (item) => !resolvedCompetitionId || item?.competitionId === resolvedCompetitionId;
  const inActiveCategory = (item) => !resolvedCategoryId || !item?.categoryId || item.categoryId === resolvedCategoryId;
  const byPosition = (left, right) => Number(left?.position || 0) - Number(right?.position || 0);

  return {
    competitionRows: items
      .filter((item) => item?.scopeType === "competition")
      .filter(inActiveCompetition)
      .filter(inActiveCategory)
      .sort(byPosition),
    charreadaRows: items
      .filter((item) => item?.scopeType === "charreada" && item.charreadaId === activeCharreadaId)
      .sort(byPosition)
  };
}

function selectLegacyScoreboardRows({ officialByTeamId, activeTeamId, activeCharro, turn }) {
  const rows = [...officialByTeamId.values()].map((official) => {
    const id = string(official?.team?.id);
    const active = Boolean(id && id === activeTeamId);
    return {
      id,
      name: string(official?.team?.name) || "Equipo",
      total: number(official?.total),
      status: SCOREBOARD_STATUSES.OFFICIAL,
      hasOfficialScore: true,
      active,
      currentCharro: active ? activeCharro : ""
    };
  });

  if (activeTeamId && !officialByTeamId.has(activeTeamId)) {
    rows.unshift({
      id: activeTeamId,
      name: string(turn?.team?.name) || "Equipo en turno",
      total: 0,
      status: SCOREBOARD_STATUSES.NOT_STARTED,
      hasOfficialScore: false,
      active: true,
      currentCharro: activeCharro
    });
  }

  if (rows.length) return rows;
  return [1, 2, 3].map((index) => ({
    id: "",
    name: `Esperando equipo ${index}`,
    total: 0,
    status: SCOREBOARD_STATUSES.UNAVAILABLE,
    hasOfficialScore: false,
    active: false,
    currentCharro: ""
  }));
}

function officialRowsByTeamId(leaderboard) {
  const byId = new Map();
  for (const item of collection(leaderboard)) {
    const teamId = string(item?.team?.id);
    if (teamId) byId.set(teamId, item);
  }
  return byId;
}

function uniqueIds(values) {
  const seen = new Set();
  return collection(values).map(string).filter((value) => value && !seen.has(value) && seen.add(value));
}

function collection(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function string(value) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
