export const PORTAL_V2_RESULT_COLUMN_LABELS = Object.freeze({
  CC: "Cala",
  P: "Piales",
  C: "Colas",
  JT: "Jineteo de toro",
  LC: "Lazo cabecero",
  PR: "Pial de ruedo",
  JY: "Jineteo de yegua",
  MP: "Manganas a pie",
  MC: "Manganas a caballo",
  PM: "Paso de la muerte",
  cala: "Cala",
  piales: "Piales",
  colas: "Colas",
  toro: "Jineteo de toro",
  lazo: "Lazo cabecero",
  pial_ruedo: "Pial de ruedo",
  yegua: "Jineteo de yegua",
  manganas_pie: "Manganas a pie",
  manganas_caballo: "Manganas a caballo",
  paso: "Paso de la muerte"
});

export function createPortalV2ResultsModel(snapshot, lifecycleStatus) {
  const competitionNames = new Map((snapshot.sheet?.competitions || []).map((competition) => [competition.competitionId, text(competition.name)]));
  const results = Object.freeze((snapshot.results?.teams || []).map((result) => displayResult(result, competitionNames)));
  const standings = Object.freeze((snapshot.standings?.items || [])
    .map((standing) => displayStanding(standing, competitionNames))
    .sort((left, right) => left.position - right.position));
  const sheet = Object.freeze((snapshot.sheet?.competitions || []).map((competition) => displaySheetCompetition(competition)));
  const consistency = validateDirectParity(results, standings, sheet);
  const status = consistency.valid ? "ready" : "inconsistent-snapshot";
  return Object.freeze({
    status,
    consistency,
    results,
    resultGroups: groupResults(results),
    standings,
    standingGroups: groupStandings(standings),
    sheet,
    champion: ["FINALIZED", "ARCHIVED"].includes(lifecycleStatus)
      ? standings.find((item) => item.position === 1) || null
      : null,
    resultState: results.length ? "ready" : "no-results-yet",
    standingsState: standings.length ? "ready" : "no-standings-yet",
    sheetState: sheet.some((competition) => competition.rows.length) ? "ready" : "no-sheet-yet"
  });
}

function displayResult(result, competitionNames) {
  return Object.freeze({
    resultId: text(result.resultId),
    competitionId: text(result.competitionId),
    competitionName: competitionNames.get(result.competitionId) || "",
    charreadaId: text(result.charreadaId),
    teamName: text(result.teamName) || text(result.participantName) || "Participante",
    phase: text(result.phase),
    status: resultStatus(result.status),
    position: finite(result.position) ? result.position : null,
    subtotal: directNumber(result.subtotal),
    penalties: directNumber(result.penalties),
    total: directNumber(result.total),
    columns: displayColumns(result.columns)
  });
}

function displayStanding(standing, competitionNames) {
  const references = Array.isArray(standing.resultIds) && standing.resultIds.length
    ? standing.resultIds.map(text).filter(Boolean)
    : [text(standing.resultId)].filter(Boolean);
  return Object.freeze({
    rankingId: text(standing.rankingId),
    resultIds: Object.freeze(references),
    competitionId: text(standing.competitionId),
    competitionName: competitionNames.get(standing.competitionId) || "",
    charreadaId: text(standing.charreadaId),
    teamName: text(standing.teamName) || text(standing.participantName) || "Participante",
    phase: text(standing.phase),
    position: directNumber(standing.position),
    total: directNumber(standing.total),
    classification: text(standing.classification),
    status: resultStatus(standing.status),
    tieBreakLabel: text(standing.tieBreakLabel)
  });
}

function displaySheetCompetition(competition) {
  const rows = Object.freeze((competition.rows || []).map((row) => Object.freeze({
    resultId: text(row.resultId),
    teamName: text(row.teamName) || text(row.participantName) || "Participante",
    total: directNumber(row.total),
    columns: displayColumns(row.columns)
  })));
  const columns = [];
  const seen = new Set();
  for (const row of rows) {
    for (const column of row.columns) {
      if (seen.has(column.key)) continue;
      seen.add(column.key);
      columns.push(Object.freeze({ key: column.key, label: column.label }));
    }
  }
  return Object.freeze({
    competitionId: text(competition.competitionId),
    name: text(competition.name) || "Sábana de competencia",
    columns: Object.freeze(columns),
    rows
  });
}

function displayColumns(columns) {
  return Object.freeze(Object.entries(columns || {}).map(([key, value]) => Object.freeze({
    key: text(key),
    label: PORTAL_V2_RESULT_COLUMN_LABELS[key] || humanizeColumn(key),
    value: directNumber(value)
  })));
}

function groupResults(results) {
  return Object.freeze(groupBy(results, (result) => `${result.competitionId}\u0000${result.charreadaId}\u0000${result.phase}`, (items) => Object.freeze({
    title: items[0].competitionName || items[0].phase || "Resultados publicados",
    phase: items[0].phase,
    items: Object.freeze(items)
  })));
}

function groupStandings(standings) {
  return Object.freeze(groupBy(standings, (standing) => `${standing.competitionId}\u0000${standing.charreadaId}\u0000${standing.phase}`, (items) => Object.freeze({
    title: items[0].competitionName || items[0].phase || "Posiciones oficiales",
    phase: items[0].phase,
    podium: Object.freeze(items.filter((item) => item.position <= 3)),
    items: Object.freeze(items)
  })));
}

function groupBy(items, keyOf, toGroup) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].map(toGroup);
}

function validateDirectParity(results, standings, sheet) {
  const resultsById = new Map(results.map((result) => [result.resultId, result]));
  for (const competition of sheet) {
    for (const row of competition.rows) {
      const result = resultsById.get(row.resultId);
      if (!result || result.total !== row.total || !sameColumns(result.columns, row.columns)) {
        return Object.freeze({ valid: false, reason: "results-sheet-diverge" });
      }
    }
  }
  for (const standing of standings) {
    if (!standing.resultIds.length || standing.resultIds.some((resultId) => !resultsById.has(resultId))) {
      return Object.freeze({ valid: false, reason: "standing-result-reference-missing" });
    }
    if (standing.resultIds.length === 1 && resultsById.get(standing.resultIds[0]).total !== standing.total) {
      return Object.freeze({ valid: false, reason: "results-standings-diverge" });
    }
  }
  return Object.freeze({ valid: true, reason: "verified" });
}

function sameColumns(left, right) {
  if (left.length !== right.length) return false;
  const rightByKey = new Map(right.map((column) => [column.key, column.value]));
  return left.every((column) => rightByKey.get(column.key) === column.value);
}

function resultStatus(value) {
  const status = text(value).toUpperCase();
  return Object.freeze({
    value: status,
    label: {
      UNSCORED: "No calificado",
      PARTIAL: "En progreso",
      OFFICIAL: "Oficial",
      FINAL: "Final"
    }[status] || (status ? "Publicado" : "Sin estado")
  });
}

function humanizeColumn(key) {
  return text(key).replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function directNumber(value) {
  return finite(value) ? Number(value) : null;
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function text(value) {
  return String(value || "").trim();
}
