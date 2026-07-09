import { COMPETITION_TYPES, getCompetitionType } from "../data/competitionTypes.js?v=20260709-public-competitions-001";
import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260709-public-competitions-001";
import {
  getLiveChannelFromUrl,
  subscribePublicTournamentSnapshot
} from "../core/firebaseSync.js?v=20260709-public-competitions-001";

const UNAVAILABLE_MESSAGE = "Información pública no disponible todavía";
const OFFICIAL_SCORESHEET_COLUMNS = ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "TOTAL"];
const LEGACY_COMPETITION_ID = "equipos_completo";
const SUERTE_COLUMNS_BY_ID = Object.freeze({
  cala: ["CC"],
  piales: ["P"],
  colas: ["C"],
  toro: ["JT"],
  terna: ["LC", "PR"],
  yegua: ["JY"],
  manganas_pie: ["MP"],
  manganas_caballo: ["MC"],
  paso: ["PM"]
});

const state = {
  tournamentId: "",
  publicSnapshot: null,
  publicStatus: null,
  activeTab: "resumen",
  selectedCompetitionId: ""
};

initPublicTournamentPage();

function initPublicTournamentPage() {
  state.tournamentId = getTournamentIdFromUrl();
  state.selectedCompetitionId = getCompetitionFromUrl();
  console.info("[public-c001] loading tournament");
  console.info("[public-c001] tournamentId", state.tournamentId || "(sin tournamentId)");

  if (!state.tournamentId) {
    renderPublicTournamentPage(normalizePublicTournamentData());
    return;
  }

  subscribePublicTournamentSnapshot(state.tournamentId, (snapshot, status) => {
    state.publicSnapshot = snapshot;
    state.publicStatus = status;
    console.info("[public-ui-001] snapshot keys", snapshot ? Object.keys(snapshot) : []);
    console.info("[public-ui-001] scoresheet columns", snapshot?.scoresheetColumns || []);
    console.info("[public-ui-001] scoresheet sample", objectToArray(snapshot?.scoresheet)[0] || null);
    console.info("[public-ui-001] live sample", {
      activeCharreada: snapshot?.activeCharreada || null,
      lastScore: objectToArray(snapshot?.lastScores)[0] || null,
      currentScoreboard: objectToArray(snapshot?.currentScoreboard).slice(0, 3)
    });
    renderPublicTournamentPage(normalizePublicTournamentData({
      tournamentId: state.tournamentId,
      publicSnapshot: state.publicSnapshot,
      publicStatus: state.publicStatus
    }));
  });
}

function getTournamentIdFromUrl() {
  return getLiveChannelFromUrl("");
}

function getCompetitionFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("competition") || "";
  } catch (error) {
    return "";
  }
}

function normalizePublicTournamentData(raw = {}) {
  const snapshot = raw.publicSnapshot || null;
  if (!hasObjectData(snapshot)) {
    console.info("[public-c001] public data unavailable");
    return {
      source: "publicTournaments",
      tournamentId: raw.tournamentId || "",
      unavailable: true,
      message: UNAVAILABLE_MESSAGE,
      summary: {},
      activeCharreada: null,
      currentScoreboard: [],
      ranking: [],
      scoreSheet: [],
      scoreSheetColumns: OFFICIAL_SCORESHEET_COLUMNS,
      teams: [],
      competitions: [],
      selectedCompetition: null,
      schedule: [],
      leaders: [],
      awards: [],
      lastScores: [],
      readWarning: raw.publicStatus?.reason || ""
    };
  }

  const info = snapshot.info || {};
  const competitions = buildPublicCompetitionOptions(snapshot);
  const selectedCompetition = resolveSelectedCompetition(competitions);
  const competitionView = buildPublicCompetitionView(snapshot, selectedCompetition);
  const activeCharreada = competitionView.activeCharreada;
  const currentScoreboard = competitionView.currentScoreboard;
  const ranking = competitionView.ranking;
  const scoreSheet = competitionView.scoreSheet;
  const scoreSheetColumns = competitionView.scoreSheetColumns;
  const teams = competitionView.teams;
  const schedule = competitionView.schedule;
  const leaders = competitionView.leaders;
  const awards = competitionView.awards;
  const lastScores = competitionView.lastScores;
  const lastScore = lastScores[0] || null;
  const currentTeam = activeCharreada?.currentTeam || currentScoreboard.find((row) => row.active) || null;
  const currentSuerte = activeCharreada?.currentSuerte || null;
  const entityLabel = selectedCompetition?.scope === "individual" ? "Participantes" : "Equipos";

  const summary = {
    tournamentId: info.id || raw.tournamentId || "",
    tournamentName: info.nombre || info.name || "CharroPro",
    venue: info.sede || "",
    date: [info.fechaInicio, info.fechaFin].filter(Boolean).join(" - "),
    status: info.estado || (activeCharreada ? "EN VIVO" : ""),
    activeCharreadaName: activeCharreada?.nombre || "",
    currentTeamName: currentTeam?.teamName || currentTeam?.name || "",
    currentSuerte: currentSuerte?.nombre || currentSuerte?.name || currentSuerte?.key || "",
    entityLabel,
    totalTeams: teams.length,
    lastUpdated: snapshot.generatedAt ? formatDate(snapshot.generatedAt) : ""
  };

  console.info("[public-c001] data normalized", {
    source: "publicTournaments",
    teams: teams.length,
    currentScoreboard: currentScoreboard.length,
    ranking: ranking.length,
    scoreSheet: scoreSheet.length,
    competition: selectedCompetition?.id || "",
    lastScore: lastScore?.score ?? null
  });

  return {
    source: "publicTournaments",
    tournamentId: raw.tournamentId || summary.tournamentId || "",
    unavailable: false,
    message: "",
    summary,
    activeCharreada,
    currentScoreboard,
    ranking,
    scoreSheet,
    scoreSheetColumns,
    teams,
    competitions,
    selectedCompetition,
    schedule,
    leaders,
    awards,
    lastScores,
    lastScore,
    readWarning: raw.publicStatus?.reason || ""
  };
}

function normalizeScoreboardRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    charreadaId: row.charreadaId || row.charreada?.id || "",
    teamId: row.teamId || "",
    teamName: row.teamName || row.participantName || row.name || "Equipo",
    total: numberOrZero(row.total),
    lastSuerte: row.lastSuerte || "",
    updatedAt: row.updatedAt || "",
    active: Boolean(row.active),
    ...readCompetitionFields(row)
  };
}

function normalizeRankingRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || row.participantId || row.entryId || row.id || "",
    teamName: row.teamName || row.participantName || row.name || row.charro || "Equipo",
    total: numberOrZero(row.total),
    charreadasTerminadas: Number(row.charreadasTerminadas || 0),
    updatedAt: row.updatedAt || "",
    ...readCompetitionFields(row)
  };
}

function normalizeScoreSheetRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || row.participantId || row.entryId || row.id || "",
    teamName: row.teamName || row.participantName || row.name || row.charro || "Equipo",
    CC: nullableScore(row.CC),
    P: nullableScore(row.P),
    C: nullableScore(row.C),
    JT: nullableScore(row.JT),
    LC: nullableScore(row.LC),
    PR: nullableScore(row.PR),
    JY: nullableScore(row.JY),
    MP: nullableScore(row.MP),
    MC: nullableScore(row.MC),
    PM: nullableScore(row.PM),
    TOTAL: nullableScore(row.TOTAL),
    ...readCompetitionFields(row)
  };
}

function normalizeTeamRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || row.participantId || row.entryId || row.id || "",
    teamName: row.teamName || row.participantName || row.name || `Equipo ${index + 1}`,
    categoryName: row.category || row.categoryName || "",
    abbreviation: row.abbreviation || "",
    logo: row.logo || "",
    total: numberOrZero(row.total),
    ...readCompetitionFields(row)
  };
}

function normalizeLastScoreRow(row = {}) {
  return {
    team: row.team || null,
    charro: row.charro || "Charro no registrado",
    suerte: row.suerte || null,
    score: nullableScore(row.score),
    timestamp: row.timestamp || "",
    charreadaId: row.charreadaId || row.charreada?.id || "",
    ...readCompetitionFields(row)
  };
}

function normalizeScoreSheetColumns(columns = []) {
  const values = Array.isArray(columns) ? columns.filter(Boolean).map(String) : [];
  const official = values.length ? values : OFFICIAL_SCORESHEET_COLUMNS;
  return official.filter((column) => OFFICIAL_SCORESHEET_COLUMNS.includes(column));
}

function normalizeScheduleRow(row = {}, index = 0) {
  const equipos = objectToArray(row.equipos || row.teams || row.participants || row.participantes);
  return {
    charreadaId: row.charreadaId || row.id || row.key || `charreada_${index + 1}`,
    nombre: row.nombre || row.name || row.title || `Charreada ${index + 1}`,
    fecha: row.fecha || row.date || "",
    hora: row.hora || row.startTime || row.time || "",
    phase: row.phase || row.fase || row.phaseName || "",
    status: row.status || row.estado || "",
    equipos,
    totalParticipants: numberOrZero(row.totalParticipants || row.totalTeams || equipos.length),
    ...readCompetitionFields(row)
  };
}

function buildPublicCompetitionOptions(snapshot = {}) {
  const records = new Map();
  objectToArray(snapshot.competitions).forEach((item) => addPublicCompetitionRecord(records, item));
  objectToArray(snapshot.schedule).forEach((item) => addPublicCompetitionRecord(records, item));
  addPublicCompetitionRecord(records, snapshot.activeCharreada || {});

  if (!records.size) {
    const type = snapshot.info?.type || snapshot.info?.tipo || LEGACY_COMPETITION_ID;
    addPublicCompetitionRecord(records, {
      competitionType: type,
      competitionId: type
    }, true);
  }

  const order = new Map(COMPETITION_TYPES.map((competition, index) => [competition.type, index]));
  return [...records.values()]
    .sort((left, right) =>
      (order.get(left.type) ?? 99) - (order.get(right.type) ?? 99) ||
      String(left.label || "").localeCompare(String(right.label || ""), "es")
    );
}

function addPublicCompetitionRecord(records, source = {}, forceLegacy = false) {
  if (!source || typeof source !== "object") return;
  const fields = readCompetitionFields(source);
  if (!forceLegacy && !fields.hasCompetitionMetadata) return;
  const config = getCompetitionType(fields.competitionType || fields.competitionId || LEGACY_COMPETITION_ID);
  const id = fields.competitionId || config.type;
  const existing = records.get(id) || {
    id,
    type: fields.competitionType || config.type,
    scope: fields.competitionScope || config.scope,
    label: source.competitionLabel || source.label || config.label,
    suerteIds: normalizeSuerteIds(source.suerteIds, config.suerteIds),
    isLegacyFallback: forceLegacy
  };
  existing.suerteIds = normalizeSuerteIds(existing.suerteIds, config.suerteIds);
  records.set(id, existing);
}

function resolveSelectedCompetition(competitions = []) {
  if (!competitions.length) return null;
  const selected = String(state.selectedCompetitionId || "").trim();
  const match = competitions.find((competition) => (
    competition.id === selected || competition.type === selected
  ));
  const fallback = competitions.find((competition) => competition.id === LEGACY_COMPETITION_ID) || competitions[0];
  const resolved = match || fallback;
  state.selectedCompetitionId = resolved?.id || "";
  return resolved;
}

function buildPublicCompetitionView(snapshot = {}, selectedCompetition = null) {
  const schedule = readPublicCompetitionCollection(snapshot.schedule, selectedCompetition)
    .map(normalizeScheduleRow);
  const activeCharreada = normalizeActiveCharreadaForCompetition(snapshot.activeCharreada || null, selectedCompetition, schedule);
  const currentScoreboard = readPublicCompetitionCollection(snapshot.currentScoreboard, selectedCompetition, schedule)
    .map(normalizeScoreboardRow);
  const ranking = readPublicCompetitionCollection(snapshot.generalRanking, selectedCompetition, schedule)
    .map(normalizeRankingRow);
  const scoreSheet = readPublicCompetitionCollection(snapshot.scoresheet, selectedCompetition, schedule)
    .map(normalizeScoreSheetRow);
  const teams = readPublicCompetitionCollection(snapshot.teams, selectedCompetition, schedule)
    .map(normalizeTeamRow);
  const lastScores = readPublicCompetitionCollection(snapshot.lastScores, selectedCompetition, schedule)
    .map(normalizeLastScoreRow);
  const scoreSheetColumns = normalizeCompetitionScoreSheetColumns(snapshot.scoresheetColumns, selectedCompetition);
  const leaders = normalizeLeadersForCompetition(snapshot.leaders, selectedCompetition, scoreSheetColumns);
  const awards = ranking.slice(0, 3).map((row, index) => ({
    position: index + 1,
    name: row.teamName,
    total: row.total
  }));

  return {
    activeCharreada,
    currentScoreboard,
    ranking,
    scoreSheet,
    scoreSheetColumns,
    teams,
    schedule,
    leaders,
    awards,
    lastScores
  };
}

function normalizeActiveCharreadaForCompetition(activeCharreada, selectedCompetition, schedule = []) {
  if (!activeCharreada) return null;
  const scheduleMatch = schedule.find((item) => item.charreadaId === (activeCharreada.id || activeCharreada.charreadaId));
  const merged = { ...activeCharreada, ...(scheduleMatch || {}) };
  if (matchesPublicCompetition(merged, selectedCompetition, schedule)) return merged;
  return null;
}

function readPublicCompetitionCollection(value, selectedCompetition, schedule = []) {
  const nested = readNestedCompetitionCollection(value, selectedCompetition);
  const rows = nested ? objectToArray(nested) : objectToArray(value);
  const hasMetadata = rows.some((row) => readCompetitionFields(row).hasCompetitionMetadata || getScheduleCompetition(row, schedule));
  if (!hasMetadata) {
    return isLegacyCompetitionView(selectedCompetition) ? rows : [];
  }
  return rows.filter((row) => matchesPublicCompetition(row, selectedCompetition, schedule));
}

function readNestedCompetitionCollection(value, selectedCompetition) {
  if (!selectedCompetition || Array.isArray(value) || !value || typeof value !== "object") return null;
  return value[selectedCompetition.id] || value[selectedCompetition.type] || null;
}

function matchesPublicCompetition(row = {}, selectedCompetition = null, schedule = []) {
  if (!selectedCompetition) return true;
  const fields = readCompetitionFields(row);
  const scheduleCompetition = getScheduleCompetition(row, schedule);
  const rowCompetitionId = fields.competitionId || scheduleCompetition?.competitionId || "";
  const rowCompetitionType = fields.competitionType || scheduleCompetition?.competitionType || "";
  if (!rowCompetitionId && !rowCompetitionType) return isLegacyCompetitionView(selectedCompetition);
  return rowCompetitionId === selectedCompetition.id ||
    rowCompetitionId === selectedCompetition.type ||
    rowCompetitionType === selectedCompetition.type ||
    rowCompetitionType === selectedCompetition.id;
}

function getScheduleCompetition(row = {}, schedule = []) {
  const charreadaId = row.charreadaId || row.charreada?.id || row.id || "";
  if (!charreadaId) return null;
  const match = schedule.find((item) => item.charreadaId === charreadaId) || null;
  return match ? readCompetitionFields(match) : null;
}

function readCompetitionFields(row = {}) {
  const config = getCompetitionType(row.competitionType || row.type || row.competitionId || LEGACY_COMPETITION_ID);
  const rawType = row.competitionType || row.competition_type || row.type || "";
  const rawId = row.competitionId || row.competition_id || row.competitionKey || "";
  const rawScope = row.competitionScope || row.competition_scope || row.scope || "";
  const hasCompetitionMetadata = Boolean(rawType || rawId || rawScope || row.suerteIds);
  return {
    competitionId: rawId || (rawType ? config.type : ""),
    competitionType: rawType || (rawId ? config.type : ""),
    competitionScope: rawScope || (rawType || rawId ? config.scope : ""),
    hasCompetitionMetadata
  };
}

function normalizeCompetitionScoreSheetColumns(columns = [], selectedCompetition = null) {
  const nested = readNestedCompetitionCollection(columns, selectedCompetition);
  const sourceColumns = nested || columns;
  if (selectedCompetition?.suerteIds?.length) {
    const mapped = selectedCompetition.suerteIds.flatMap((suerteId) => SUERTE_COLUMNS_BY_ID[suerteId] || []);
    const official = [...new Set([...mapped, "TOTAL"])].filter((column) => OFFICIAL_SCORESHEET_COLUMNS.includes(column));
    if (official.length > 1) return official;
  }
  return normalizeScoreSheetColumns(sourceColumns);
}

function normalizeLeadersForCompetition(leaders = {}, selectedCompetition = null, columns = OFFICIAL_SCORESHEET_COLUMNS) {
  const nested = readNestedCompetitionCollection(leaders, selectedCompetition);
  const source = nested || leaders || {};
  const allowed = new Set((columns || []).filter((column) => column !== "TOTAL"));
  const values = Object.entries(source)
    .filter(([key, value]) => value && allowed.has(key))
    .map(([key, value]) => ({
      suerte: value.suerte || key,
      label: value.label || getPublicColumnLabel(key),
      charro: value.charro || "Charro no registrado",
      teamName: value.team?.name || value.teamName || value.team || "",
      score: nullableScore(value.score),
      updatedAt: value.updatedAt || ""
    }));
  const hasMetadata = values.some((row) => readCompetitionFields(row).hasCompetitionMetadata);
  if (nested || isLegacyCompetitionView(selectedCompetition) || hasMetadata) return values;
  return [];
}

function isLegacyCompetitionView(selectedCompetition = null) {
  return Boolean(selectedCompetition?.isLegacyFallback || selectedCompetition?.id === LEGACY_COMPETITION_ID);
}

function normalizeSuerteIds(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map((item) => String(item || "").trim()).filter(Boolean);
}

function getPublicColumnLabel(column = "") {
  const labels = {
    CC: "Cala",
    P: "Piales",
    C: "Colas",
    JT: "Toro",
    LC: "Lazo cabecero",
    PR: "Pial de ruedo",
    JY: "Yegua",
    MP: "Manganas pie",
    MC: "Manganas caballo",
    PM: "Paso"
  };
  return labels[column] || column;
}

function renderPublicTournamentPage(data) {
  const root = document.getElementById("public-tournament-root");
  if (!root) return;

  if (data.unavailable) {
    root.innerHTML = renderUnavailable(data);
    console.info("[public-ui-001] render completed", { unavailable: true });
    return;
  }

  root.innerHTML = html`
    ${renderHero(data)}
    ${renderCompetitionSelector(data)}
    ${renderTabs()}
    <section class="public-tab-panel ${state.activeTab === "resumen" ? "active" : ""}" data-panel="resumen">
      ${renderSummaryCards(data)}
      <div class="public-grid two">
        ${renderLiveScoreboard(data)}
        ${renderCurrentTurn(data)}
      </div>
      ${renderRanking(data)}
      <div class="public-grid two">
        ${renderAwards(data)}
        ${renderLeaders(data)}
      </div>
    </section>
    <section class="public-tab-panel ${state.activeTab === "sabana" ? "active" : ""}" data-panel="sabana">
      ${renderScoreSheet(data)}
    </section>
    <section class="public-tab-panel ${state.activeTab === "programa" ? "active" : ""}" data-panel="programa">
      ${renderProgram(data)}
    </section>
    <section class="public-tab-panel ${state.activeTab === "equipos" ? "active" : ""}" data-panel="equipos">
      ${renderTeams(data)}
    </section>
    <section class="public-tab-panel ${state.activeTab === "en-vivo" ? "active" : ""}" data-panel="en-vivo">
      ${renderCurrentTurn(data)}
      ${renderLiveScoreboard(data)}
    </section>
  `;
  setupTabs();
  setupCompetitionSelector();
  console.info("[public-ui-001] render completed", {
    source: data.source,
    scoreboardRows: data.currentScoreboard.length,
    rankingRows: data.ranking.length,
    scoresheetRows: data.scoreSheet.length
  });
}

function renderUnavailable(data) {
  return html`
    <section class="public-hero">
      <div>
        <p class="eyebrow">CharroPro publico</p>
        <h1>${escapeHTML(data.tournamentId || "Portal publico")}</h1>
        <p>${escapeHTML(UNAVAILABLE_MESSAGE)}</p>
      </div>
      <span class="public-badge muted">Sin datos publicos</span>
    </section>
  `;
}

function renderHero(data) {
  const summary = data.summary || {};
  return html`
    <section class="public-hero">
      <div>
        <p class="eyebrow">Orgullo Charro / CharroPro</p>
        <h1>${escapeHTML(summary.tournamentName)}</h1>
        <p>${escapeHTML([summary.venue, summary.date].filter(Boolean).join(" · ") || "Resultados publicos del torneo")}</p>
      </div>
      <div class="public-hero-status">
        <span class="public-badge">${escapeHTML(summary.status || "EN VIVO")}</span>
        <small>Datos publicos oficiales</small>
        <small>${escapeHTML(summary.lastUpdated ? `Actualizado: ${summary.lastUpdated}` : "")}</small>
      </div>
    </section>
  `;
}

function renderTabs() {
  const tabs = [
    ["resumen", "Resumen"],
    ["sabana", "Sabana"],
    ["programa", "Programa"],
    ["equipos", "Equipos"],
    ["en-vivo", "En vivo"]
  ];
  return html`
    <nav class="public-tabs" aria-label="Secciones del torneo">
      ${tabs.map(([id, label]) => html`
        <button class="${state.activeTab === id ? "active" : ""}" data-public-tab="${escapeHTML(id)}">${escapeHTML(label)}</button>
      `).join("")}
    </nav>
  `;
}

function renderCompetitionSelector(data) {
  const competitions = data.competitions || [];
  const selected = data.selectedCompetition || null;
  if (!competitions.length) return "";
  return html`
    <section class="public-competition-selector" aria-label="Selector de competencia">
      <label>
        <span>Competencia</span>
        <select data-public-competition>
          ${competitions.map((competition) => html`
            <option value="${escapeHTML(competition.id)}" ${competition.id === selected?.id ? "selected" : ""}>
              ${escapeHTML(competition.label)}
            </option>
          `).join("")}
        </select>
      </label>
      <p>${escapeHTML(selected?.scope === "individual" ? "Ranking individual" : "Ranking por equipos")}</p>
    </section>
  `;
}

function renderSummaryCards(data) {
  const summary = data.summary || {};
  const leader = data.ranking?.[0] || {};
  const cards = [
    [summary.entityLabel || "Equipos", summary.totalTeams || data.teams.length || data.ranking.length || "-"],
    ["Lider", leader.teamName || "-"],
    ["Suerte actual", summary.currentSuerte || "-"],
    ["Equipo en turno", summary.currentTeamName || "-"]
  ];
  return html`
    <section class="public-summary-grid">
      ${cards.map(([label, value]) => html`
        <article class="public-card">
          <span>${escapeHTML(label)}</span>
          <strong>${escapeHTML(value)}</strong>
        </article>
      `).join("")}
    </section>
  `;
}

function renderLiveScoreboard(data) {
  const rows = data.currentScoreboard || [];
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Marcador actual</h2>
        <span>${escapeHTML(data.selectedCompetition?.label || "Snapshot publico")}</span>
      </div>
      ${rows.length ? html`
        <div class="public-scoreboard-list">
          ${rows.map((team) => html`
            <div class="public-scoreboard-row ${team.active ? "active" : ""}">
              <span>${moneylessNumber(team.position)}</span>
              <strong>${escapeHTML(team.teamName)}</strong>
              <b>${moneylessNumber(team.total)}</b>
            </div>
          `).join("")}
        </div>
      ` : html`<p class="public-muted">${escapeHTML(UNAVAILABLE_MESSAGE)}</p>`}
    </section>
  `;
}

function renderRanking(data) {
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>${escapeHTML(data.selectedCompetition?.scope === "individual" ? "Ranking individual" : "Top 10 general")}</h2>
        <span>${escapeHTML(data.selectedCompetition?.label || "Ranking publico")}</span>
      </div>
      ${renderSimpleTable(
        ["Pos.", "Equipo", "Total"],
        data.ranking.slice(0, 10).map((row) => [row.position, row.teamName, moneylessNumber(row.total)])
      )}
    </section>
  `;
}

function renderCurrentTurn(data) {
  const summary = data.summary || {};
  const activeCharreada = data.activeCharreada || {};
  const currentTeam = activeCharreada.currentTeam || {};
  const currentSuerte = activeCharreada.currentSuerte || {};
  const lastScore = data.lastScores?.[0] || null;
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>En vivo</h2>
        <span>${escapeHTML(summary.activeCharreadaName || "Charreada actual")}</span>
      </div>
      <div class="public-live-grid">
        <div><span>Equipo</span><strong>${escapeHTML(currentTeam.teamName || currentTeam.name || summary.currentTeamName || "-")}</strong></div>
        <div><span>Suerte</span><strong>${escapeHTML(currentSuerte.nombre || currentSuerte.name || summary.currentSuerte || "-")}</strong></div>
        <div><span>Tiempo</span><strong>${escapeHTML(activeCharreada.timer?.formatted || activeCharreada.timer?.stateLabel || "-")}</strong></div>
        <div><span>Ultima calificacion</span><strong>${escapeHTML(formatScore(lastScore?.score))}</strong></div>
      </div>
    </section>
  `;
}

function renderScoreSheet(data) {
  const columns = data.scoreSheetColumns || OFFICIAL_SCORESHEET_COLUMNS;
  const headers = ["Pos.", "Equipo", ...columns];
  const rows = data.scoreSheet.map((row) => [
    row.position,
    row.teamName,
    ...columns.map((column) => formatScore(row[column]))
  ]);
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Sabana</h2>
        <span>${escapeHTML(data.selectedCompetition?.label || "Snapshot publico")}</span>
      </div>
      <div class="public-table-scroll">${renderSimpleTable(headers, rows)}</div>
    </section>
  `;
}

function renderTeams(data) {
  const label = data.selectedCompetition?.scope === "individual" ? "Participantes" : "Equipos participantes";
  const rows = data.teams.map((team, index) => [
    index + 1,
    team.teamName,
    team.categoryName || "-",
    moneylessNumber(team.total)
  ]);
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>${escapeHTML(label)}</h2>
        <span>${moneylessNumber(data.teams.length)} registros</span>
      </div>
      ${renderSimpleTable(["#", "Equipo", "Categoria", "Total"], rows)}
    </section>
  `;
}

function renderProgram(data) {
  const rows = data.schedule || [];
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Programa</h2>
        <span>${escapeHTML(data.selectedCompetition?.label || "Competencia")}</span>
      </div>
      ${rows.length ? html`
        <div class="public-program-list">
          ${rows.map((row) => html`
            <article class="public-program-row">
              <div>
                <span>${escapeHTML(row.fecha || "Fecha por confirmar")}</span>
                <strong>${escapeHTML(row.nombre)}</strong>
                <small>${escapeHTML([row.phase, row.status].filter(Boolean).join(" · ") || "Programada")}</small>
              </div>
              <div>
                <b>${escapeHTML(row.hora || "Hora por confirmar")}</b>
                <small>${moneylessNumber(row.totalParticipants || row.equipos.length)} participantes</small>
              </div>
            </article>
          `).join("")}
        </div>
      ` : html`<p class="public-muted">${escapeHTML(UNAVAILABLE_MESSAGE)}</p>`}
    </section>
  `;
}

function renderAwards(data) {
  const rows = data.awards || [];
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Premiacion</h2>
        <span>${escapeHTML(data.selectedCompetition?.label || "Top")}</span>
      </div>
      ${rows.length ? html`
        <div class="public-list">
          ${rows.map((row) => html`
            <div class="public-list-row">
              <span>${moneylessNumber(row.position)}</span>
              <strong>${escapeHTML(row.name)}</strong>
              <b>${moneylessNumber(row.total)}</b>
            </div>
          `).join("")}
        </div>
      ` : html`<p class="public-muted">${escapeHTML(UNAVAILABLE_MESSAGE)}</p>`}
    </section>
  `;
}

function renderLeaders(data) {
  const rows = data.leaders || [];
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Top por suerte</h2>
        <span>${escapeHTML(data.selectedCompetition?.label || "Lideres")}</span>
      </div>
      ${rows.length ? html`
        <div class="public-list">
          ${rows.map((row) => html`
            <div class="public-list-row">
              <span>${escapeHTML(row.suerte)}</span>
              <strong>${escapeHTML(row.charro)}</strong>
              <b>${formatScore(row.score)}</b>
            </div>
          `).join("")}
        </div>
      ` : html`<p class="public-muted">${escapeHTML(UNAVAILABLE_MESSAGE)}</p>`}
    </section>
  `;
}

function renderSimpleTable(headers, rows) {
  if (!rows.length) return html`<p class="public-muted">${escapeHTML(UNAVAILABLE_MESSAGE)}</p>`;
  return html`
    <table class="public-table">
      <thead>
        <tr>${headers.map((header) => html`<th>${escapeHTML(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => html`
          <tr>${row.map((cell) => html`<td>${escapeHTML(cell)}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function setupTabs() {
  document.querySelectorAll("[data-public-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.publicTab || "resumen";
      renderPublicTournamentPage(normalizePublicTournamentData({
        tournamentId: state.tournamentId,
        publicSnapshot: state.publicSnapshot,
        publicStatus: state.publicStatus
      }));
    });
  });
}

function setupCompetitionSelector() {
  const select = document.querySelector("[data-public-competition]");
  if (!select) return;
  select.addEventListener("change", () => {
    state.selectedCompetitionId = select.value || LEGACY_COMPETITION_ID;
    updateCompetitionUrl(state.selectedCompetitionId);
    console.info("[public-competitions-001] selector changed", state.selectedCompetitionId);
    renderPublicTournamentPage(normalizePublicTournamentData({
      tournamentId: state.tournamentId,
      publicSnapshot: state.publicSnapshot,
      publicStatus: state.publicStatus
    }));
  });
}

function updateCompetitionUrl(competitionId = "") {
  try {
    const url = new URL(window.location.href);
    if (competitionId) url.searchParams.set("competition", competitionId);
    else url.searchParams.delete("competition");
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    console.warn("[public-competitions-001] url update skipped", error);
  }
}

function objectToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).filter(Boolean);
  return [];
}

function hasObjectData(value) {
  return Boolean(value && typeof value === "object" && Object.keys(value).length);
}

function nullableScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatScore(value) {
  if (value === null || value === undefined) return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return moneylessNumber(number);
}

function formatDate(value) {
  if (!value) return "";
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}
