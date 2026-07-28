import { getCompetitionType } from "../data/competitionTypes.js?v=20260727-public-foundation-001-projection-v2";
import { buildPublicLiveFeedModel } from "./liveFeedModel.js?v=20260727-public-portal-ux-001-live-feed-v1";

export const PUBLIC_SHEET_COLUMNS = Object.freeze([
  { id: "CC", suerteId: "cala", label: "Cala", group: "Suertes" },
  { id: "P", suerteId: "piales", label: "Piales", group: "Suertes" },
  { id: "C", suerteId: "colas", label: "Colas", group: "Suertes" },
  { id: "JT", suerteId: "toro", label: "Jineteo de toro", group: "Suertes" },
  { id: "LC", suerteId: "terna", label: "Lazo de cabeza", group: "Terna" },
  { id: "PR", suerteId: "terna", label: "Pial de ruedo", group: "Terna" },
  { id: "JY", suerteId: "yegua", label: "Jineteo de yegua", group: "Suertes" },
  { id: "MP", suerteId: "manganas_pie", label: "Manganas a pie", group: "Manganas" },
  { id: "MC", suerteId: "manganas_caballo", label: "Manganas a caballo", group: "Manganas" },
  { id: "PM", suerteId: "paso", label: "Paso de la muerte", group: "Suertes" }
]);

const COMPLETED_PROGRAM_STATES = new Set(["completed", "terminada", "terminado", "finalizada", "finalizado"]);

export function buildPublicPortalModel(snapshot, options = {}) {
  if (!snapshot || typeof snapshot !== "object") {
    return buildEmptyPortalModel(options);
  }
  if (Number(snapshot.schemaVersion) === 2) {
    return buildV2PortalModel(snapshot, options);
  }
  return buildLegacyPortalModel(snapshot, options);
}

export function resolvePortalCompetitionId(competitions = [], requestedId = "", activeId = "") {
  const requested = String(requestedId || "");
  const active = String(activeId || "");
  if (requested && competitions.some((item) => item.competitionId === requested)) return requested;
  if (active && competitions.some((item) => item.competitionId === active)) return active;
  return competitions[0]?.competitionId || "";
}

export function selectPortalResults(results = [], filters = {}) {
  return asArray(results).filter((row) => {
    if (filters.competitionId && row.competitionId !== filters.competitionId) return false;
    if (filters.categoryId && row.categoryId !== filters.categoryId) return false;
    if (filters.phaseId && row.phaseId !== filters.phaseId) return false;
    if (filters.charreadaId && row.charreadaId !== filters.charreadaId) return false;
    return row.resultStatus !== "superseded" && row.resultStatus !== "draft";
  });
}

export function buildPortalSheet(results = [], competition = null) {
  const suerteIds = new Set(asArray(competition?.suerteIds));
  const eligibleColumns = PUBLIC_SHEET_COLUMNS.filter((column) => suerteIds.has(column.suerteId));
  const columns = eligibleColumns.filter((column) => results.some((row) => hasScoreValue(row.scores?.[column.id])));
  const showPenalty = results.some((row) => hasScoreValue(row.teamPenaltyTotal));
  return {
    participantLabel: competition?.competitionScope === "individual" ? "Participante" : "Equipo",
    columns,
    showPenalty,
    rows: results.map((row) => ({
      resultId: row.resultId,
      name: row.displayName,
      association: row.association,
      categoryName: row.categoryName,
      scores: Object.fromEntries(columns.map((column) => [column.id, scoreOrNull(row.scores?.[column.id])])),
      teamPenaltyTotal: scoreOrNull(row.teamPenaltyTotal),
      officialTotal: scoreOrNull(row.officialTotal),
      officialPosition: officialPosition(row.officialPosition),
      positionStatus: row.positionStatus || "unavailable"
    }))
  };
}

export function getPortalViewDependencies(view) {
  const dependencies = {
    inicio: ["metadata", "overview", "live", "program", "competitions", "results"],
    "en-vivo": ["overview", "live", "liveFeed"],
    programa: ["overview", "program", "competitions"],
    competencias: ["overview", "program", "competitions", "results"],
    resultados: ["overview", "competitions", "results"],
    sabana: ["overview", "competitions", "results"]
  };
  return dependencies[view] || dependencies.inicio;
}

function buildV2PortalModel(snapshot, options) {
  const program = asArray(snapshot.program?.items).map(normalizeProgramItem);
  const rawResults = asArray(snapshot.results?.items).map(normalizeResultItem);
  const competitions = enrichCompetitions(
    asArray(snapshot.competitions?.items).map(normalizeCompetitionItem),
    program,
    rawResults
  );
  const selectedCompetitionId = resolvePortalCompetitionId(
    competitions,
    options.competitionId,
    snapshot.overview?.activeCompetitionId
  );
  const selectedCompetition = competitions.find((item) => item.competitionId === selectedCompetitionId) || null;
  const filters = {
    competitionId: selectedCompetitionId,
    categoryId: String(options.categoryId || ""),
    phaseId: String(options.phaseId || ""),
    charreadaId: String(options.charreadaId || "")
  };
  const results = selectPortalResults(rawResults, filters);
  const selectedProgram = filters.charreadaId
    ? program.filter((item) => item.charreadaId === filters.charreadaId)
    : program;
  const live = normalizeV2Live(snapshot.live, snapshot.overview, competitions, program);
  const liveFeed = buildPublicLiveFeedModel(snapshot.liveFeed, {
    live,
    program,
    results: rawResults
  }, {
    filter: options.feed,
    connection: options.connection,
    nowMs: options.nowMs
  });
  const sheet = buildPortalSheet(results, selectedCompetition);
  const resultFilters = buildResultFilters(rawResults, selectedCompetitionId);
  return {
    schemaVersion: 2,
    projectionRevision: integer(snapshot.projectionRevision, 0),
    legacy: false,
    availability: resolveAvailability(snapshot),
    event: {
      tournamentId: text(snapshot.metadata?.tournamentId),
      name: text(snapshot.metadata?.name || snapshot.overview?.name) || "CharroPro",
      venue: text(snapshot.overview?.venue),
      startDate: text(snapshot.overview?.startDate),
      endDate: text(snapshot.overview?.endDate),
      status: text(snapshot.status || snapshot.overview?.status) || "ready",
      visibility: text(snapshot.metadata?.visibility) || "public",
      sourceUpdatedAt: text(snapshot.sourceUpdatedAt || snapshot.overview?.updatedAt || snapshot.generatedAt),
      generatedAt: text(snapshot.generatedAt)
    },
    overview: {
      activeCompetitionId: text(snapshot.overview?.activeCompetitionId),
      activeCompetitionName: text(snapshot.overview?.activeCompetitionName),
      activeCharreadaId: text(snapshot.overview?.activeCharreadaId),
      activeCharreadaName: text(snapshot.overview?.activeCharreadaName),
      turn: normalizeTurnSummary(snapshot.overview?.turn)
    },
    live,
    liveFeed,
    program: selectedProgram,
    competitions,
    selectedCompetition,
    selectedCompetitionId,
    results,
    allResults: rawResults,
    resultFilters,
    activeFilters: filters,
    sheet,
    home: buildHomeSummary(snapshot, competitions, program, rawResults, live),
    sectionRevisions: readSectionRevisions(snapshot)
  };
}

function buildLegacyPortalModel(snapshot, options) {
  const program = asArray(snapshot.schedule).map((item, index) => normalizeProgramItem({
    scheduleId: item.id || item.charreadaId,
    charreadaId: item.charreadaId || item.id,
    competitionId: item.competitionId || item.competitionType || "equipos_completo",
    competitionType: item.competitionType || "equipos_completo",
    categoryId: item.categoryId,
    phaseId: item.phaseId,
    phaseName: item.phase || item.phaseName,
    name: item.nombre || item.name,
    scheduledDate: item.fecha || item.date,
    scheduledTime: item.hora || item.time,
    order: item.order ?? index + 1,
    status: item.status,
    participants: item.equipos || item.individualParticipants || [],
    legacy: true
  }));
  const rawResults = asArray(snapshot.scoresheet || snapshot.generalRanking).map((item, index) => normalizeResultItem({
    ...item,
    resultId: item.resultId || item.id || `legacy_result_${index + 1}`,
    participantScope: item.competitionScope || (item.participantId ? "individual" : "team"),
    competitionId: item.competitionId || item.competitionType || "equipos_completo",
    competitionType: item.competitionType || "equipos_completo",
    scores: item.scores || Object.fromEntries(PUBLIC_SHEET_COLUMNS.map((column) => [column.id, item[column.id]])),
    officialTotal: item.officialTotal ?? item.TOTAL ?? item.total,
    officialPosition: item.officialPosition ?? item.position,
    resultStatus: "published",
    displayOrder: index + 1
  }));
  const rawCompetitions = asArray(snapshot.competitions);
  const competitionSeeds = rawCompetitions.length ? rawCompetitions : [{
    competitionId: snapshot.info?.type || "equipos_completo",
    competitionType: snapshot.info?.type || "equipos_completo",
    name: "Competencia por equipos",
    legacy: true
  }];
  const competitions = enrichCompetitions(
    competitionSeeds.map(normalizeCompetitionItem),
    program,
    rawResults
  );
  const activeCompetitionId = text(snapshot.activeCharreada?.competitionId);
  const selectedCompetitionId = resolvePortalCompetitionId(competitions, options.competitionId, activeCompetitionId);
  const selectedCompetition = competitions.find((item) => item.competitionId === selectedCompetitionId) || null;
  const filters = {
    competitionId: selectedCompetitionId,
    categoryId: String(options.categoryId || ""),
    phaseId: String(options.phaseId || ""),
    charreadaId: String(options.charreadaId || "")
  };
  const results = selectPortalResults(rawResults, filters);
  const live = normalizeLegacyLive(snapshot, competitions);
  return {
    schemaVersion: 1,
    projectionRevision: integer(snapshot.projectionRevision, 0),
    legacy: true,
    availability: "ready",
    event: {
      tournamentId: text(snapshot.info?.id || options.tournamentId),
      name: text(snapshot.info?.nombre || snapshot.info?.name) || "CharroPro",
      venue: text(snapshot.info?.sede),
      startDate: text(snapshot.info?.fechaInicio),
      endDate: text(snapshot.info?.fechaFin),
      status: text(snapshot.info?.estado) || "ready",
      visibility: "public",
      sourceUpdatedAt: text(snapshot.generatedAt),
      generatedAt: text(snapshot.generatedAt)
    },
    overview: {
      activeCompetitionId,
      activeCompetitionName: text(snapshot.activeCharreada?.competitionName),
      activeCharreadaId: text(snapshot.activeCharreada?.charreadaId || snapshot.activeCharreada?.id),
      activeCharreadaName: text(snapshot.activeCharreada?.nombre || snapshot.activeCharreada?.name),
      turn: live.turn
    },
    live,
    liveFeed: buildPublicLiveFeedModel({}, { live, program, results: rawResults }, {
      filter: options.feed,
      connection: options.connection,
      nowMs: options.nowMs
    }),
    program,
    competitions,
    selectedCompetition,
    selectedCompetitionId,
    results,
    allResults: rawResults,
    resultFilters: buildResultFilters(rawResults, selectedCompetitionId),
    activeFilters: filters,
    sheet: buildPortalSheet(results, selectedCompetition),
    home: {
      competitionsCount: competitions.length,
      resultsCount: rawResults.length,
      nextProgramItem: program.find((item) => !COMPLETED_PROGRAM_STATES.has(item.status)) || null
    },
    sectionRevisions: { legacy: 1 }
  };
}

function buildEmptyPortalModel(options) {
  return {
    schemaVersion: null,
    projectionRevision: 0,
    legacy: false,
    availability: options.availability || "loading",
    event: {
      tournamentId: text(options.tournamentId),
      name: "Portal Público CharroPro",
      venue: "",
      startDate: "",
      endDate: "",
      status: "unavailable",
      visibility: "public",
      sourceUpdatedAt: "",
      generatedAt: ""
    },
    overview: {
      activeCompetitionId: "",
      activeCompetitionName: "",
      activeCharreadaId: "",
      activeCharreadaName: "",
      turn: normalizeTurnSummary()
    },
    live: normalizeV2Live(),
    liveFeed: buildPublicLiveFeedModel({}, {}, {
      filter: options.feed,
      connection: options.connection,
      nowMs: options.nowMs
    }),
    program: [],
    competitions: [],
    selectedCompetition: null,
    selectedCompetitionId: "",
    results: [],
    allResults: [],
    resultFilters: { categories: [], phases: [], charreadas: [] },
    activeFilters: { competitionId: "", categoryId: "", phaseId: "", charreadaId: "" },
    sheet: buildPortalSheet(),
    home: { competitionsCount: 0, resultsCount: 0, nextProgramItem: null },
    sectionRevisions: {}
  };
}

function normalizeCompetitionItem(item = {}) {
  const config = getCompetitionType(item.competitionType || item.type || item.competitionId);
  return {
    competitionId: text(item.competitionId || item.id || config.type),
    competitionType: text(item.competitionType || item.type || config.type),
    competitionScope: text(item.competitionScope || item.scope || config.scope),
    name: text(item.name || item.label || config.label),
    categoryId: text(item.categoryId),
    categoryName: text(item.categoryName),
    phaseId: text(item.phaseId),
    phaseName: text(item.phaseName),
    order: integer(item.order, 0),
    status: text(item.status) || "ready",
    suerteIds: unique(asArray(item.suerteIds).map(text).filter(Boolean).length
      ? asArray(item.suerteIds).map(text).filter(Boolean)
      : config.suerteIds),
    charreadaIds: unique(asArray(item.charreadaIds).map(text).filter(Boolean)),
    legacy: Boolean(item.legacy)
  };
}

function enrichCompetitions(competitions, program, results) {
  const enriched = competitions.map((competition) => {
    const programRows = program.filter((item) => item.competitionId === competition.competitionId);
    const resultRows = results.filter((item) => item.competitionId === competition.competitionId);
    const categoryName = competition.categoryName ||
      resultRows.find((item) => item.categoryName)?.categoryName ||
      programRows.find((item) => item.categoryName)?.categoryName ||
      competition.categoryId;
    const phaseName = competition.phaseName ||
      resultRows.find((item) => item.phaseName)?.phaseName ||
      programRows.find((item) => item.phaseName)?.phaseName ||
      competition.phaseId;
    return {
      ...competition,
      categoryName,
      phaseName,
      charreadasCount: unique([
        ...competition.charreadaIds,
        ...programRows.map((item) => item.charreadaId)
      ].filter(Boolean)).length,
      resultsCount: resultRows.length
    };
  });
  const duplicateNames = countValues(enriched.map((item) => item.name));
  return enriched
    .map((competition) => ({
      ...competition,
      displayName: duplicateNames.get(competition.name) > 1
        ? [competition.name, competition.categoryName, competition.phaseName].filter(Boolean).join(" · ")
        : competition.name
    }))
    .sort((left, right) => left.order - right.order || left.competitionId.localeCompare(right.competitionId, "es"));
}

function normalizeProgramItem(item = {}) {
  return {
    scheduleId: text(item.scheduleId || item.charreadaId),
    charreadaId: text(item.charreadaId),
    competitionId: text(item.competitionId),
    competitionType: text(item.competitionType),
    categoryId: text(item.categoryId),
    categoryName: text(item.categoryName),
    phaseId: text(item.phaseId),
    phaseName: text(item.phaseName),
    name: text(item.name) || "Jornada",
    scheduledDate: text(item.scheduledDate),
    scheduledTime: text(item.scheduledTime),
    order: integer(item.order, 0),
    status: text(item.status) || "unavailable",
    participants: asArray(item.participants).map(normalizeProgramParticipant),
    association: text(item.association),
    legacy: Boolean(item.legacy)
  };
}

function normalizeProgramParticipant(item = {}) {
  return {
    id: text(item.teamId || item.participantId || item.id),
    name: text(item.teamName || item.participantName || item.name),
    association: text(item.association),
    categoryName: text(item.categoryName || item.category),
    horseName: text(item.horseName || item.horse)
  };
}

function normalizeResultItem(item = {}, index = 0) {
  const participantScope = item.participantScope === "individual" ? "individual" : "team";
  const officialTotal = scoreOrNull(item.officialTotal);
  return {
    resultId: text(item.resultId || item.id || `result_${index + 1}`),
    teamId: participantScope === "team" ? text(item.teamId) : "",
    teamName: participantScope === "team" ? text(item.teamName) : "",
    participantId: participantScope === "individual" ? text(item.participantId) : "",
    participantName: participantScope === "individual" ? text(item.participantName) : "",
    horseId: participantScope === "individual" ? text(item.horseId) : "",
    horseName: participantScope === "individual" ? text(item.horseName) : "",
    displayName: participantScope === "individual"
      ? text(item.participantName) || "Participante no registrado"
      : text(item.teamName) || "Equipo no registrado",
    association: text(item.association),
    categoryId: text(item.categoryId),
    categoryName: text(item.categoryName),
    competitionId: text(item.competitionId),
    competitionType: text(item.competitionType),
    phaseId: text(item.phaseId),
    phaseName: text(item.phaseName),
    charreadaId: text(item.charreadaId),
    participantScope,
    scores: normalizeScores(item.scores),
    subtotal: scoreOrNull(item.subtotal),
    teamPenaltyTotal: scoreOrNull(item.teamPenaltyTotal),
    officialTotal,
    officialPosition: officialPosition(item.officialPosition),
    positionStatus: text(item.positionStatus) || "unavailable",
    resultStatus: text(item.resultStatus) || "published",
    publishedAt: text(item.publishedAt),
    sourceRevision: integer(item.sourceRevision, 0),
    displayOrder: integer(item.displayOrder, index + 1)
  };
}

function normalizeScores(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const column of PUBLIC_SHEET_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(value, column.id)) output[column.id] = scoreOrNull(value[column.id]);
  }
  return output;
}

function normalizeV2Live(live = {}, overview = {}, competitions = [], program = []) {
  const competitionId = text(live?.competitionId || overview?.activeCompetitionId);
  const charreadaId = text(live?.charreadaId || overview?.activeCharreadaId);
  const competition = competitions.find((item) => item.competitionId === competitionId);
  const charreada = program.find((item) => item.charreadaId === charreadaId);
  const turn = normalizeLiveTurn(live?.turn || overview?.turn);
  return {
    status: text(live?.status) || (charreadaId ? "prepared" : "unavailable"),
    competitionId,
    competitionName: text(overview?.activeCompetitionName || competition?.name),
    categoryName: text(charreada?.categoryName),
    phaseName: text(charreada?.phaseName),
    charreadaId,
    charreadaName: text(overview?.activeCharreadaName || charreada?.name),
    turn,
    timer: {
      status: text(live?.timer?.status) || "unavailable",
      timeMs: scoreOrNull(live?.timer?.timeMs),
      timeText: text(live?.timer?.timeText),
      running: Boolean(live?.timer?.running)
    },
    currentResult: live?.currentResult ? {
      resultId: text(live.currentResult.resultId),
      teamName: text(live.currentResult.teamName),
      participantName: text(live.currentResult.participantName),
      suerteId: text(live.currentResult.suerteId),
      score: scoreOrNull(live.currentResult.score),
      publishedAt: text(live.currentResult.publishedAt)
    } : null,
    standings: asArray(live?.standings).map((row) => ({
      resultId: text(row.resultId),
      name: text(row.participantName || row.teamName),
      total: scoreOrNull(row.total),
      officialPosition: officialPosition(row.officialPosition),
      positionStatus: text(row.positionStatus),
      active: Boolean(row.active)
    })),
    updatedAt: text(live?.updatedAt || overview?.updatedAt)
  };
}

function normalizeLegacyLive(snapshot, competitions) {
  const active = snapshot.activeCharreada || {};
  const competitionId = text(active.competitionId || competitions[0]?.competitionId);
  return {
    status: active.id || active.charreadaId ? "live" : "unavailable",
    competitionId,
    competitionName: text(active.competitionName),
    categoryName: text(active.categoryName),
    phaseName: text(active.phase || active.phaseName),
    charreadaId: text(active.charreadaId || active.id),
    charreadaName: text(active.nombre || active.name),
    turn: {
      status: active.currentTeam || active.currentParticipant ? "available" : "unavailable",
      team: normalizeEntity(active.currentTeam),
      participant: normalizeEntity(active.currentParticipant),
      horse: normalizeEntity(active.currentHorse),
      suerteId: text(active.currentSuerte?.id),
      suerteName: text(active.currentSuerte?.name || active.currentSuerte?.nombre)
    },
    timer: {
      status: active.timer ? "available" : "unavailable",
      timeMs: scoreOrNull(active.timer?.timeMs),
      timeText: text(active.timer?.formatted || active.timer?.timeText),
      running: Boolean(active.timer?.running)
    },
    currentResult: null,
    standings: asArray(snapshot.currentScoreboard).map((row) => ({
      resultId: text(row.resultId),
      name: text(row.participantName || row.teamName || row.name),
      total: scoreOrNull(row.total),
      officialPosition: officialPosition(row.position),
      positionStatus: text(row.positionStatus),
      active: Boolean(row.active)
    })),
    updatedAt: text(snapshot.generatedAt)
  };
}

function normalizeLiveTurn(turn = {}) {
  return {
    status: text(turn.status) || "unavailable",
    team: normalizeEntity(turn.team),
    participant: normalizeEntity(turn.participant),
    horse: normalizeEntity(turn.horse),
    suerteId: text(turn.suerteId),
    suerteName: text(turn.suerteName)
  };
}

function normalizeTurnSummary(turn = {}) {
  return {
    status: text(turn.status) || "unavailable",
    team: { id: text(turn.teamId), name: text(turn.teamName) },
    participant: { id: text(turn.participantId), name: text(turn.participantName) },
    horse: { id: "", name: "" },
    suerteId: text(turn.suerteId),
    suerteName: text(turn.suerteName)
  };
}

function normalizeEntity(value = {}) {
  return {
    id: text(value?.id || value?.teamId || value?.participantId || value?.horseId),
    name: text(value?.name || value?.teamName || value?.participantName || value?.horseName),
    association: text(value?.association),
    category: text(value?.category)
  };
}

function buildResultFilters(results, competitionId) {
  const scoped = results.filter((row) => !competitionId || row.competitionId === competitionId);
  return {
    categories: uniqueOptions(scoped, "categoryId", "categoryName", "Categoría"),
    phases: uniqueOptions(scoped, "phaseId", "phaseName", "Fase"),
    charreadas: uniqueOptions(scoped, "charreadaId", "charreadaId", "Charreada")
  };
}

function uniqueOptions(rows, valueKey, labelKey, fallback) {
  const values = new Map();
  for (const row of rows) {
    const value = text(row[valueKey]);
    if (!value || values.has(value)) continue;
    values.set(value, {
      value,
      label: text(row[labelKey]) || `${fallback} ${values.size + 1}`
    });
  }
  return [...values.values()];
}

function buildHomeSummary(snapshot, competitions, program, results, live) {
  const activeIndex = program.findIndex((item) => item.charreadaId === live.charreadaId);
  const nextProgramItem = activeIndex >= 0
    ? program.slice(activeIndex + 1).find((item) => !COMPLETED_PROGRAM_STATES.has(item.status)) || null
    : program.find((item) => !COMPLETED_PROGRAM_STATES.has(item.status)) || null;
  return {
    competitionsCount: competitions.length,
    resultsCount: results.length,
    nextProgramItem,
    programCount: program.length,
    publicStatus: text(snapshot.status)
  };
}

function readSectionRevisions(snapshot) {
  const output = {};
  for (const key of ["metadata", "overview", "program", "live", "liveFeed", "competitions", "results"]) {
    output[key] = integer(snapshot[key]?.revision, 0);
  }
  return output;
}

function resolveAvailability(snapshot) {
  if (snapshot.metadata?.visibility === "private") return "not-public";
  if (snapshot.status === "unavailable") return "unavailable";
  return "ready";
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return counts;
}

function hasScoreValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function scoreOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function officialPosition(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function integer(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, 4000);
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).filter(Boolean);
  return [];
}

function unique(values) {
  return [...new Set(values)];
}
