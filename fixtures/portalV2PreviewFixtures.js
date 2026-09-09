import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260909-portal-v2-results-standings-sheet-001-v1";

const TOURNAMENT_ID = "portal-v2-local-preview";

export function getPortalV2PreviewSnapshot(name = "") {
  const lifecycle = {
    "pre-event": "PRE_EVENT",
    live: "LIVE",
    paused: "PAUSED",
    finalized: "FINALIZED",
    archived: "ARCHIVED"
  }[String(name || "").toLowerCase()];
  if (!lifecycle) return null;
  const hasResults = lifecycle !== "PRE_EVENT";
  const data = baseSnapshot(lifecycle, hasResults);
  return createCanonicalPublicTournamentData(data);
}

function baseSnapshot(lifecycle, hasResults) {
  const results = hasResults ? resolvedResults() : [];
  return {
    tournamentId: TOURNAMENT_ID,
    sourceRevision: 31,
    projectionRevision: 31,
    generatedAt: "2026-09-09T20:00:00.000Z",
    lifecycle: { status: lifecycle },
    tournament: {
      id: TOURNAMENT_ID,
      name: "Charreada Portal V2 Local",
      shortName: "Portal V2",
      edition: "Previsualización",
      startDate: "2026-09-09",
      venue: "Lienzo de prueba",
      city: "Tequila",
      state: "Jalisco",
      organization: "CharroPro Local"
    },
    branding: { primaryColor: "#17324d", secondaryColor: "#f0e6d2", accentColor: "#b5252a", backgroundColor: "#f6f7f5", textColor: "#17212b" },
    modules: [
      { type: "live", enabled: true, order: 10 },
      { type: "results", enabled: true, order: 20 },
      { type: "standings", enabled: true, order: 30 },
      { type: "sheet", enabled: true, order: 40 }
    ],
    live: lifecycle === "LIVE" ? { status: "LIVE", currentCharreada: "Charreada local", currentTeam: "Rancho Los Laureles", currentSuerte: "Pial de ruedo", currentScore: 21, updatedAt: "2026-09-09T20:00:00.000Z" } : { status: lifecycle, updatedAt: "2026-09-09T20:00:00.000Z" },
    results: { teams: results },
    standings: { items: hasResults ? standings() : [] },
    sheet: { competitions: hasResults ? [sheet()] : [] }
  };
}

function resolvedResults() {
  return [
    result("result-laureles", "team-laureles", "Rancho Los Laureles", 1, { cala: 31, piales: 38, colas: 68, toro: 20, lazo: 15, pial_ruedo: 21 }, 193, "PARTIAL"),
    result("result-miguel", "team-miguel", "Hacienda San Miguel", 2, { cala: 28, piales: 24, colas: 52, toro: 18, lazo: 12, pial_ruedo: 17 }, 151, "PARTIAL"),
    result("result-jalisco", "team-jalisco", "Charros de Jalisco", 3, { cala: 0 }, 0, "OFFICIAL")
  ];
}

function result(resultId, teamId, teamName, position, columns, total, status) {
  return {
    resultId,
    teamId,
    teamName,
    charreadaId: "charreada-local",
    competitionId: "equipos-local",
    phase: "Ronda única",
    columns,
    penalties: 0,
    subtotal: total,
    total,
    status,
    position
  };
}

function standings() {
  return resolvedResults().map((item) => ({
    rankingId: `standing-${item.teamId}`,
    resultId: item.resultId,
    position: item.position,
    teamId: item.teamId,
    teamName: item.teamName,
    total: item.total,
    classification: "provisional",
    status: item.status,
    phase: item.phase,
    tieBreakLabel: ""
  }));
}

function sheet() {
  return {
    competitionId: "equipos-local",
    name: "Equipos",
    rows: resolvedResults().map((item) => ({
      resultId: item.resultId,
      teamId: item.teamId,
      teamName: item.teamName,
      columns: item.columns,
      total: item.total
    }))
  };
}
