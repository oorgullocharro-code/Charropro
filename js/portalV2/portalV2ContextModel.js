import { createPortalV2ResultsModel } from "./portalV2ResultsModel.js?v=20260912-portal-v2-home-visual-composition-002-v1";

// Presentation-only context. Every option and every filtered row comes from
// the resolved V3 snapshot; this module never decides a sporting phase.
export function createPortalV2ContextModel(snapshot, lifecycleStatus, route = {}) {
  const publicData = createPortalV2ResultsModel(snapshot, lifecycleStatus);
  const program = displayProgram(snapshot.program?.items);
  const competitions = collectCompetitions(publicData, program);
  const phases = collectPhases(publicData, program);
  const selectedCompetitionId = select(route.competitionId, competitions);
  const selectedPhaseId = select(route.phaseId, phases);
  const hasInvalidSelection = Boolean(
    (text(route.competitionId) && !selectedCompetitionId)
    || (text(route.phaseId) && !selectedPhaseId)
  );
  const matches = (item) => (!selectedCompetitionId || item.competitionId === selectedCompetitionId)
    && (!selectedPhaseId || item.phaseId === selectedPhaseId);
  const results = Object.freeze(publicData.results.filter(matches));
  const standingScope = selectedPhaseId ? "phase" : "competition";
  const standings = Object.freeze(publicData.standings
    .filter(matches)
    .filter((item) => item.scopeType === standingScope));
  const sheet = Object.freeze(publicData.sheet.filter(matches));
  const filtered = createPresentationResultsModel(results, standings, sheet, lifecycleStatus, publicData.consistency);

  return Object.freeze({
    ...filtered,
    program: Object.freeze(program.filter(matches)),
    programState: program.length ? "ready" : "no-program-yet",
    competitions,
    phases,
    selectedCompetitionId,
    selectedPhaseId,
    selectedCompetition: competitions.find((item) => item.id === selectedCompetitionId) || null,
    selectedPhase: phases.find((item) => item.id === selectedPhaseId) || null,
    hasInvalidSelection,
    phaseContextAvailable: phases.length > 0,
    currentPhase: null
  });
}

function createPresentationResultsModel(results, standings, sheet, lifecycleStatus, consistency) {
  const resultGroups = groupResults(results);
  const standingGroups = groupStandings(standings);
  return Object.freeze({
    status: consistency.valid ? "ready" : "inconsistent-snapshot",
    consistency,
    results,
    resultGroups,
    standings,
    standingGroups,
    sheet,
    champion: ["FINALIZED", "ARCHIVED"].includes(lifecycleStatus)
      ? standings.find((item) => item.position === 1) || null
      : null,
    resultState: results.length ? "ready" : "no-results-yet",
    standingsState: standings.length ? "ready" : "no-standings-yet",
    sheetState: sheet.some((competition) => competition.rows.length) ? "ready" : "no-sheet-yet"
  });
}

function displayProgram(items) {
  return Object.freeze(collection(items).map((item) => Object.freeze({
    id: text(item.id),
    charreadaId: text(item.charreadaId),
    competitionId: text(item.competitionId),
    competitionName: text(item.competitionName),
    phaseId: text(item.phase),
    phaseName: text(item.phaseName),
    name: text(item.name) || "Charreada publicada",
    scheduledDate: text(item.scheduledDate),
    scheduledTime: text(item.scheduledTime),
    status: text(item.status),
    order: finiteInteger(item.order),
    participantScope: text(item.participantScope) === "individual" ? "individual" : "team",
    teamNames: Object.freeze(collection(item.teamNames).map(text).filter(Boolean)),
    participantNames: Object.freeze(collection(item.participantNames).map(text).filter(Boolean)),
    horseNames: Object.freeze(collection(item.horseNames).map(text).filter(Boolean))
  })).filter((item) => item.id || item.charreadaId).sort((left, right) => left.order - right.order || left.scheduledDate.localeCompare(right.scheduledDate) || left.scheduledTime.localeCompare(right.scheduledTime) || left.name.localeCompare(right.name)));
}

function collectCompetitions(publicData, program) {
  const values = new Map();
  for (const item of [...publicData.results, ...publicData.standings, ...publicData.sheet, ...program]) {
    const id = text(item.competitionId);
    const name = text(item.competitionName || item.name);
    if (id && name && !values.has(id)) values.set(id, Object.freeze({ id, name }));
  }
  return Object.freeze([...values.values()].sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id)));
}

function collectPhases(publicData, program) {
  const values = new Map();
  for (const item of [...publicData.results, ...publicData.standings, ...publicData.sheet, ...program]) {
    const id = text(item.phaseId);
    const name = text(item.phaseName);
    if (id && name && !values.has(id)) values.set(id, Object.freeze({ id, name }));
  }
  return Object.freeze([...values.values()].sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id)));
}

function groupResults(results) {
  return groupBy(results, (item) => `${item.competitionId}\u0000${item.phaseId}\u0000${item.charreadaId}`, (items) => Object.freeze({
    title: items[0].charreadaName || items[0].competitionName || "Resultados publicados",
    detail: [items[0].phaseName, items[0].competitionName].filter(Boolean).join(" · "),
    items: Object.freeze(items)
  }));
}

function groupStandings(standings) {
  return groupBy(standings, (item) => `${item.competitionId}\u0000${item.phaseId}\u0000${item.charreadaId}`, (items) => Object.freeze({
    title: items[0].charreadaName || items[0].competitionName || "Posiciones oficiales",
    detail: [items[0].phaseName, items[0].competitionName].filter(Boolean).join(" · "),
    podium: Object.freeze(items.filter((item) => item.position <= 3)),
    items: Object.freeze(items)
  }));
}

function groupBy(items, keyOf, toGroup) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return Object.freeze([...groups.values()].map(toGroup));
}

function select(value, choices) {
  const id = text(value);
  return choices.some((choice) => choice.id === id) ? id : "";
}

function collection(value) { return Array.isArray(value) ? value : []; }
function finiteInteger(value) { const number = Number(value); return Number.isSafeInteger(number) ? number : 0; }
function text(value) { return String(value || "").trim(); }
