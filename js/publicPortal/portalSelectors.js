import { getCompetitionType } from "../data/competitionTypes.js?v=20260824-cache-buster-single-authority-001-v1";
import { buildPublicLiveFeedModel } from "./liveFeedModel.js?v=20260824-cache-buster-single-authority-001-v1";

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
const SCORE_ALIASES = Object.freeze({
  CC: ["CC", "cc", "cala", "calaCaballo", "cala_de_caballo"],
  P: ["P", "p", "piales", "pial"],
  C: ["C", "c", "colas", "coleadero"],
  JT: ["JT", "jt", "toro", "jineteoToro", "jineteo_toro"],
  LC: ["LC", "lc", "lazoCabeza", "lazoCabecero", "lazo_cabeza", "lazo_cabecero"],
  PR: ["PR", "pr", "pialRuedo", "pialDeRuedo", "pial_ruedo", "pial_de_ruedo"],
  JY: ["JY", "jy", "yegua", "jineteoYegua", "jineteo_yegua"],
  MP: ["MP", "mp", "manganasPie", "manganas_pie"],
  MC: ["MC", "mc", "manganasCaballo", "manganas_caballo"],
  PM: ["PM", "pm", "paso", "pasoMuerte", "pasoDeLaMuerte", "paso_muerte", "paso_de_la_muerte"]
});

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
  const columns = PUBLIC_SHEET_COLUMNS.filter((column) => suerteIds.has(column.suerteId));
  return {
    participantLabel: competition?.competitionScope === "individual" ? "Participante" : "Equipo",
    columns,
    showPenalty: true,
    rows: results.map((row) => ({
      resultId: row.resultId,
      name: row.displayName,
      categoryName: row.categoryName,
      scores: Object.fromEntries(columns.map((column) => [column.id, scoreOrNull(row.scores?.[column.id])])),
      teamPenaltyTotal: scoreOrNull(row.teamPenaltyTotal),
      officialTotal: scoreOrNull(row.officialTotal),
      accumulatedTotal: scoreOrNull(row.accumulatedTotal ?? row.subtotal),
      displayTotal: scoreOrNull(row.officialTotal ?? row.accumulatedTotal ?? row.subtotal),
      totalStatus: normalizeTotalStatus(row.totalStatus, row.officialTotal),
      officialPosition: officialPosition(row.officialPosition),
      provisionalPosition: officialPosition(row.provisionalPosition),
      displayPosition: officialPosition(row.officialPosition ?? row.provisionalPosition),
      positionStatus: row.positionStatus || "unavailable"
    }))
  };
}

export function selectPortalProgram(program = [], filters = {}) {
  return asArray(program).filter((item) => {
    if (filters.day && programDateKey(item.scheduledDate) !== filters.day) return false;
    if (filters.phaseId && item.phaseId !== filters.phaseId) return false;
    return true;
  });
}

export function buildProgramFilters(program = [], requested = {}) {
  const days = [];
  const phases = [];
  const seenDays = new Set();
  const seenPhases = new Set();
  for (const item of asArray(program)) {
    const day = programDateKey(item.scheduledDate);
    if (day && !seenDays.has(day)) {
      seenDays.add(day);
      days.push({ value: day, label: day });
    }
    if (item.phaseId && !seenPhases.has(item.phaseId)) {
      seenPhases.add(item.phaseId);
      phases.push({ value: item.phaseId, label: item.phaseName || "Fase" });
    }
  }
  return {
    days,
    phases,
    day: seenDays.has(requested.day) ? requested.day : "",
    phaseId: seenPhases.has(requested.phaseId) ? requested.phaseId : ""
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
  const normalizedProgram = normalizeProgramItems(snapshot.program?.items);
  const rawResults = asArray(snapshot.results?.items).map(normalizeResultItem);
  const activeCharreadaId = text(snapshot.overview?.activeCharreadaId);
  const programAll = enrichProgramAvailability(normalizedProgram, rawResults, activeCharreadaId);
  const competitions = enrichCompetitions(
    asArray(snapshot.competitions?.items).map(normalizeCompetitionItem),
    programAll,
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
  const programFilters = buildProgramFilters(programAll, {
    day: text(options.programDay),
    phaseId: text(options.programPhaseId)
  });
  const program = selectPortalProgram(programAll, programFilters);
  const programDetail = program.find((item) => (
    item.charreadaId &&
    item.charreadaId === text(options.charreadaId)
  )) || null;
  const live = normalizeV2Live(snapshot.live, snapshot.overview, competitions, programAll);
  const liveFeed = buildPublicLiveFeedModel(snapshot.liveFeed, {
    live,
    program: programAll,
    results: rawResults
  }, {
    filter: options.feed,
    connection: options.connection,
    nowMs: options.nowMs
  });
  const sheet = buildPortalSheet(results, selectedCompetition);
  const rankedResults = rankPortalResults(results);
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
    program,
    programAll,
    programFilters: {
      days: programFilters.days,
      phases: programFilters.phases
    },
    activeProgramFilters: {
      day: programFilters.day,
      phaseId: programFilters.phaseId
    },
    programFeatured: selectFeaturedProgramItem(program, activeCharreadaId),
    programDetail,
    competitions,
    selectedCompetition,
    selectedCompetitionId,
    results,
    rankedResults,
    allResults: rawResults,
    resultFilters,
    activeFilters: filters,
    sheet,
    home: buildHomeSummary(snapshot, competitions, programAll, rawResults, live),
    sectionRevisions: readSectionRevisions(snapshot)
  };
}

function buildLegacyPortalModel(snapshot, options) {
  const normalizedProgram = normalizeProgramItems(asArray(snapshot.schedule).map((item, index) => ({
    scheduleId: item.id || item.charreadaId,
    charreadaId: item.charreadaId || item.id,
    competitionId: item.competitionId || item.competitionType || "equipos_completo",
    competitionType: item.competitionType || "equipos_completo",
    competitionScope: item.competitionScope,
    competitionName: item.competitionName,
    categoryId: item.categoryId,
    categoryName: item.categoryName || item.category,
    phaseId: item.phaseId,
    phaseName: item.phase || item.phaseName,
    name: item.nombre || item.name,
    shortTitle: item.shortTitle,
    scheduledDate: item.fecha || item.date,
    scheduledTime: item.hora || item.time,
    endTime: item.endTime,
    sequence: item.sequence,
    order: item.order ?? index + 1,
    status: item.status,
    venueId: item.venueId,
    venueName: item.venueName || item.venue || item.sede,
    publicNotes: item.publicNotes,
    liveAvailable: item.liveAvailable,
    resultsAvailable: item.resultsAvailable,
    revision: item.revision,
    updatedAt: item.updatedAt,
    participants: item.participants || (
      item.competitionScope === "individual"
        ? item.individualParticipants
        : item.equipos
    ) || item.individualParticipants || item.equipos || [],
    legacy: true
  })));
  const rawResults = asArray(snapshot.scoresheet || snapshot.generalRanking).map((item, index) => normalizeResultItem({
    ...item,
    resultId: item.resultId || item.id || `legacy_result_${index + 1}`,
    participantScope: item.competitionScope || (item.participantId ? "individual" : "team"),
    competitionId: item.competitionId || item.competitionType || "equipos_completo",
    competitionType: item.competitionType || "equipos_completo",
    scores: normalizeScores({ ...item, ...(item.scores || {}) }),
    teamPenaltyTotal: item.teamPenaltyTotal ?? item.PEN ?? item.penaltyTotal ?? item.penalties,
    officialTotal: item.officialTotal ?? item.TOTAL ?? item.total,
    officialPosition: item.officialPosition ?? item.position,
    resultStatus: "published",
    displayOrder: index + 1
  }));
  const activeCharreadaId = text(snapshot.activeCharreada?.charreadaId || snapshot.activeCharreada?.id);
  const programAll = enrichProgramAvailability(normalizedProgram, rawResults, activeCharreadaId);
  const rawCompetitions = asArray(snapshot.competitions);
  const competitionSeeds = rawCompetitions.length ? rawCompetitions : [{
    competitionId: snapshot.info?.type || "equipos_completo",
    competitionType: snapshot.info?.type || "equipos_completo",
    name: "Competencia por equipos",
    legacy: true
  }];
  const competitions = enrichCompetitions(
    competitionSeeds.map(normalizeCompetitionItem),
    programAll,
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
  const programFilters = buildProgramFilters(programAll, {
    day: text(options.programDay),
    phaseId: text(options.programPhaseId)
  });
  const program = selectPortalProgram(programAll, programFilters);
  const programDetail = program.find((item) => (
    item.charreadaId &&
    item.charreadaId === text(options.charreadaId)
  )) || null;
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
    liveFeed: buildPublicLiveFeedModel({}, { live, program: programAll, results: rawResults }, {
      filter: options.feed,
      connection: options.connection,
      nowMs: options.nowMs
    }),
    program,
    programAll,
    programFilters: {
      days: programFilters.days,
      phases: programFilters.phases
    },
    activeProgramFilters: {
      day: programFilters.day,
      phaseId: programFilters.phaseId
    },
    programFeatured: selectFeaturedProgramItem(program, activeCharreadaId),
    programDetail,
    competitions,
    selectedCompetition,
    selectedCompetitionId,
    results,
    rankedResults: rankPortalResults(results),
    allResults: rawResults,
    resultFilters: buildResultFilters(rawResults, selectedCompetitionId),
    activeFilters: filters,
    sheet: buildPortalSheet(results, selectedCompetition),
    home: {
      competitionsCount: competitions.length,
      resultsCount: rawResults.length,
      nextProgramItem: programAll.find((item) => !COMPLETED_PROGRAM_STATES.has(item.status)) || null,
      programCount: programAll.length
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
    programAll: [],
    programFilters: { days: [], phases: [] },
    activeProgramFilters: { day: "", phaseId: "" },
    programFeatured: null,
    programDetail: null,
    competitions: [],
    selectedCompetition: null,
    selectedCompetitionId: "",
    results: [],
    rankedResults: [],
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

function normalizeProgramItems(value) {
  return asArray(value)
    .map((item, index) => normalizeProgramItem(item, index))
    .sort((left, right) => (
      left.scheduledDate.localeCompare(right.scheduledDate) ||
      left.scheduledTime.localeCompare(right.scheduledTime) ||
      left.order - right.order ||
      left.sourceIndex - right.sourceIndex
    ));
}

function normalizeProgramItem(item = {}, sourceIndex = 0) {
  return {
    scheduleId: text(item.scheduleId || item.charreadaId),
    charreadaId: text(item.charreadaId),
    competitionId: text(item.competitionId),
    competitionType: text(item.competitionType),
    competitionScope: text(item.competitionScope || item.participantType),
    competitionName: text(item.competitionName),
    categoryId: text(item.categoryId),
    categoryName: text(item.categoryName),
    phaseId: text(item.phaseId),
    phaseName: text(item.phaseName),
    name: text(item.name) || "Jornada",
    shortTitle: text(item.shortTitle),
    scheduledDate: text(item.scheduledDate),
    scheduledTime: text(item.scheduledTime),
    endTime: text(item.endTime),
    sequence: integer(item.sequence ?? item.order, sourceIndex + 1),
    order: integer(item.order, 0),
    status: normalizeProgramStatus(item.status),
    venueId: text(item.venueId),
    venueName: text(item.venueName),
    participantType: text(item.participantType || item.competitionScope),
    participants: normalizeProgramParticipants(item.participants),
    publicNotes: text(item.publicNotes),
    liveAvailable: Boolean(item.liveAvailable),
    resultsAvailable: Boolean(item.resultsAvailable),
    revision: integer(item.revision, 0),
    updatedAt: text(item.updatedAt),
    sourceIndex,
    legacy: Boolean(item.legacy)
  };
}

function normalizeProgramParticipants(value) {
  const seen = new Set();
  return asArray(value)
    .map((item, index) => normalizeProgramParticipant(item, index))
    .filter((item) => {
      if (!item.id) return Boolean(item.name);
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((left, right) => left.order - right.order || left.sourceIndex - right.sourceIndex)
    .map(({ sourceIndex, ...item }) => item);
}

function normalizeProgramParticipant(item = {}, sourceIndex = 0) {
  const type = text(item.type) || (item.participantId ? "individual" : "team");
  return {
    id: text(item.teamId || item.participantId || item.id),
    name: text(item.teamName || item.participantName || item.name),
    type: ["team", "individual", "exhibition"].includes(type) ? type : "team",
    order: integer(item.order, sourceIndex + 1),
    shortName: text(item.shortName || item.abbreviation),
    logoUrl: safePublicUrl(item.logoUrl || item.logo),
    region: text(item.region),
    status: text(item.status) || "ready",
    sourceIndex
  };
}

function normalizeResultItem(item = {}, index = 0) {
  const participantScope = item.participantScope === "individual" ? "individual" : "team";
  const officialTotal = scoreOrNull(item.officialTotal);
  const accumulatedTotal = scoreOrNull(item.accumulatedTotal ?? item.subtotal);
  const provisionalPosition = officialPosition(item.provisionalPosition);
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
    accumulatedTotal,
    teamPenaltyTotal: scoreOrNull(item.teamPenaltyTotal),
    officialTotal,
    displayTotal: scoreOrNull(officialTotal ?? accumulatedTotal),
    totalStatus: normalizeTotalStatus(item.totalStatus, officialTotal),
    officialPosition: officialPosition(item.officialPosition),
    provisionalPosition,
    displayPosition: officialPosition(item.officialPosition ?? provisionalPosition),
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
    const alias = SCORE_ALIASES[column.id].find((key) => Object.prototype.hasOwnProperty.call(value, key));
    if (alias) output[column.id] = scoreOrNull(value[alias]);
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
      provisionalPosition: officialPosition(row.provisionalPosition),
      displayPosition: officialPosition(row.officialPosition ?? row.provisionalPosition),
      positionStatus: text(row.positionStatus),
      totalStatus: normalizeTotalStatus(row.totalStatus, row.positionStatus === "official" ? row.total : null),
      active: Boolean(row.active)
    })),
    updatedAt: text(live?.updatedAt || overview?.updatedAt)
  };
}

function normalizeLegacyLive(snapshot, competitions) {
  const active = snapshot.activeCharreada || {};
  const competitionId = text(active.competitionId || competitions[0]?.competitionId);
  const currentSuerte = resolveLegacyCurrentSuerte(active.currentSuerte);
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
      suerteId: currentSuerte.id,
      suerteName: currentSuerte.name
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

function resolveLegacyCurrentSuerte(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { id: "", name: "" };
  }
  const sourceId = text(
    value.id ||
    value.key ||
    value.suerteId ||
    value.discipline ||
    value.activeSuerte
  );
  const normalizedId = sourceId.toLowerCase();
  const column = PUBLIC_SHEET_COLUMNS.find((item) => (
    item.id.toLowerCase() === normalizedId ||
    item.suerteId.toLowerCase() === normalizedId
  )) || null;
  const explicitName = text(value.name || value.nombre || value.label);
  return {
    id: column?.suerteId || sourceId,
    name: explicitName || column?.label || sourceId
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

function rankPortalResults(results = []) {
  return [...asArray(results)].sort((left, right) => (
    (left.displayPosition ?? Number.MAX_SAFE_INTEGER) - (right.displayPosition ?? Number.MAX_SAFE_INTEGER) ||
    (right.displayTotal ?? Number.NEGATIVE_INFINITY) - (left.displayTotal ?? Number.NEGATIVE_INFINITY) ||
    left.displayOrder - right.displayOrder ||
    left.resultId.localeCompare(right.resultId)
  ));
}

function normalizeTotalStatus(value, officialTotal) {
  if (value === "final" || value === "partial") return value;
  return scoreOrNull(officialTotal) === null ? "partial" : "final";
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

function enrichProgramAvailability(program, results, activeCharreadaId) {
  return program.map((item) => ({
    ...item,
    liveAvailable: item.liveAvailable || Boolean(item.charreadaId && item.charreadaId === activeCharreadaId),
    resultsAvailable: item.resultsAvailable || results.some((row) => row.charreadaId === item.charreadaId)
  }));
}

function selectFeaturedProgramItem(program, activeCharreadaId) {
  return program.find((item) => item.charreadaId && item.charreadaId === activeCharreadaId) ||
    program.find((item) => item.status === "live") ||
    program.find((item) => !COMPLETED_PROGRAM_STATES.has(item.status)) ||
    program[0] ||
    null;
}

function normalizeProgramStatus(value) {
  const normalized = text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  if (["programada", "programado", "scheduled", "ready"].includes(normalized)) return "scheduled";
  if (["proxima", "upcoming", "preparando"].includes(normalized)) return "upcoming";
  if (["en_vivo", "live", "active", "en_curso"].includes(normalized)) return "live";
  if (["terminada", "terminado", "finalizada", "finalizado", "completed", "finished"].includes(normalized)) {
    return "completed";
  }
  if (["pospuesta", "pospuesto", "postponed", "pausada", "pausado", "suspendida", "suspendido"].includes(normalized)) {
    return "postponed";
  }
  if (["cancelada", "cancelado", "cancelled", "canceled"].includes(normalized)) return "cancelled";
  return "unavailable";
}

function programDateKey(value) {
  const match = text(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || "";
}

function safePublicUrl(value) {
  const clean = text(value);
  if (!clean || /^(?:javascript|data|file|vbscript):/i.test(clean)) return "";
  if (/^(?:https?:\/\/|\/|\.\/)/i.test(clean)) return clean;
  if (!clean.includes(":") && !clean.split("/").includes("..")) return clean;
  return "";
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
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .slice(0, 4000);
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") {
    const output = [];
    for (const key of Object.keys(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set || !descriptor.value) continue;
      output.push(descriptor.value);
    }
    return output;
  }
  return [];
}

function unique(values) {
  return [...new Set(values)];
}
