import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260910-portal-v2-individual-competition-presentation-001-v1";

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
      { type: "timeline", enabled: true, order: 15 },
      { type: "program", enabled: true, order: 18 },
      { type: "results", enabled: true, order: 20 },
      { type: "standings", enabled: true, order: 30 },
      { type: "sheet", enabled: true, order: 40 }
    ],
    live: lifecycle === "LIVE" ? { status: "LIVE", currentCharreada: "charreada-local", currentTeam: "Rancho Los Laureles", currentParticipant: "Juan Pérez", currentSuerte: "Pial de ruedo", currentScore: 21, updatedAt: "2026-09-09T20:00:00.000Z" } : { status: lifecycle, updatedAt: "2026-09-09T20:00:00.000Z" },
    program: { items: [{
      id: "charreada-local",
      charreadaId: "charreada-local",
      competitionId: "equipos-local",
      competitionName: "Equipos",
      phase: "fase-unica",
      phaseName: "Ronda única",
      name: "Charreada Portal V2",
      scheduledDate: "2026-09-09",
      scheduledTime: "11:00",
      status: lifecycle === "LIVE" ? "En curso" : "Programada",
      order: 1,
      teamNames: ["Rancho Los Laureles", "Hacienda San Miguel", "Charros de Jalisco"]
    }] },
    results: { teams: results },
    standings: { items: hasResults ? standings() : [] },
    sheet: { competitions: hasResults ? [sheet()] : [] },
    timeline: { items: hasResults ? timeline() : [] }
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
    competitionName: "Equipos",
    phase: "fase-unica",
    phaseName: "Ronda única",
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
    charreadaId: item.charreadaId,
    classification: "provisional",
    status: item.status,
    phase: item.phase,
    phaseName: item.phaseName,
    competitionName: item.competitionName,
    tieBreakLabel: ""
  }));
}

function timeline() {
  return [
    event("timeline-start", 1, "START", "La charreada inició", {}),
    event("timeline-team-laureles", 2, "TEAM_CHANGE", "Rancho Los Laureles entra al ruedo", {}),
    event("timeline-cala", 3, "SCORE", "Cala de caballo publicada", { score: 31 }),
    event("timeline-piales", 4, "SCORE", "Piales publicados", { score: 38 }),
    event("timeline-pr-initial", 5, "SCORE", "Pial de ruedo publicado", { score: 15 }),
    event("timeline-pr-correction", 6, "CORRECTION", "Pial de ruedo corregido oficialmente", { previousScore: 15, score: 21, status: "CORREGIDO" }),
    event("timeline-results", 7, "STATUS", "Resultados provisionales actualizados", { status: "PARCIAL" }),
    event("timeline-current", 8, "INFORMATION", "Pial de ruedo en curso", { score: 21 })
  ];
}

function event(eventId, sequence, type, label, values) {
  return {
    eventId,
    sequence,
    occurredAt: `2026-09-09T20:${String(sequence).padStart(2, "0")}:00.000Z`,
    type,
    charreadaId: "charreada-local",
    label,
    ...values
  };
}

function sheet() {
  return {
    competitionId: "equipos-local",
    name: "Equipos",
    charreadaId: "charreada-local",
    charreadaName: "Charreada Portal V2",
    phase: "fase-unica",
    phaseName: "Ronda única",
    rows: resolvedResults().map((item) => ({
      resultId: item.resultId,
      teamId: item.teamId,
      teamName: item.teamName,
      columns: item.columns,
      total: item.total
    }))
  };
}
