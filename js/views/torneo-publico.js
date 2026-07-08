import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260708-recovery-001b-panel-status1";
import {
  getLiveChannelFromUrl,
  subscribePublicTournamentSnapshot
} from "../core/firebaseSync.js?v=20260708-recovery-001b-panel-status1";

const UNAVAILABLE_MESSAGE = "Información pública no disponible todavía";
const OFFICIAL_SCORESHEET_COLUMNS = ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "TOTAL"];

const state = {
  tournamentId: "",
  publicSnapshot: null,
  publicStatus: null,
  activeTab: "resumen"
};

initPublicTournamentPage();

function initPublicTournamentPage() {
  state.tournamentId = getTournamentIdFromUrl();
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
      lastScores: [],
      readWarning: raw.publicStatus?.reason || ""
    };
  }

  const info = snapshot.info || {};
  const activeCharreada = snapshot.activeCharreada || null;
  const currentScoreboard = objectToArray(snapshot.currentScoreboard).map(normalizeScoreboardRow);
  const ranking = objectToArray(snapshot.generalRanking).map(normalizeRankingRow);
  const scoreSheet = objectToArray(snapshot.scoresheet).map(normalizeScoreSheetRow);
  const scoreSheetColumns = normalizeScoreSheetColumns(snapshot.scoresheetColumns);
  const teams = objectToArray(snapshot.teams).map(normalizeTeamRow);
  const lastScores = objectToArray(snapshot.lastScores).map(normalizeLastScoreRow);
  const lastScore = lastScores[0] || null;
  const currentTeam = activeCharreada?.currentTeam || currentScoreboard.find((row) => row.active) || null;
  const currentSuerte = activeCharreada?.currentSuerte || null;

  const summary = {
    tournamentId: info.id || raw.tournamentId || "",
    tournamentName: info.nombre || info.name || "CharroPro",
    venue: info.sede || "",
    date: [info.fechaInicio, info.fechaFin].filter(Boolean).join(" - "),
    status: info.estado || (activeCharreada ? "EN VIVO" : ""),
    activeCharreadaName: activeCharreada?.nombre || "",
    currentTeamName: currentTeam?.teamName || currentTeam?.name || "",
    currentSuerte: currentSuerte?.nombre || currentSuerte?.name || currentSuerte?.key || "",
    totalTeams: teams.length,
    lastUpdated: snapshot.generatedAt ? formatDate(snapshot.generatedAt) : ""
  };

  console.info("[public-c001] data normalized", {
    source: "publicTournaments",
    teams: teams.length,
    currentScoreboard: currentScoreboard.length,
    ranking: ranking.length,
    scoreSheet: scoreSheet.length,
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
    lastScores,
    lastScore,
    readWarning: raw.publicStatus?.reason || ""
  };
}

function normalizeScoreboardRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || "",
    teamName: row.teamName || row.name || "Equipo",
    total: numberOrZero(row.total),
    lastSuerte: row.lastSuerte || "",
    updatedAt: row.updatedAt || "",
    active: Boolean(row.active)
  };
}

function normalizeRankingRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || "",
    teamName: row.teamName || row.name || "Equipo",
    total: numberOrZero(row.total),
    charreadasTerminadas: Number(row.charreadasTerminadas || 0),
    updatedAt: row.updatedAt || ""
  };
}

function normalizeScoreSheetRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || "",
    teamName: row.teamName || row.name || "Equipo",
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
    TOTAL: nullableScore(row.TOTAL)
  };
}

function normalizeTeamRow(row = {}, index = 0) {
  return {
    position: Number(row.position || index + 1),
    teamId: row.teamId || row.id || "",
    teamName: row.teamName || row.name || `Equipo ${index + 1}`,
    categoryName: row.category || row.categoryName || "",
    abbreviation: row.abbreviation || "",
    logo: row.logo || "",
    total: numberOrZero(row.total)
  };
}

function normalizeLastScoreRow(row = {}) {
  return {
    team: row.team || null,
    charro: row.charro || "Charro no registrado",
    suerte: row.suerte || null,
    score: nullableScore(row.score),
    timestamp: row.timestamp || ""
  };
}

function normalizeScoreSheetColumns(columns = []) {
  const values = Array.isArray(columns) ? columns.filter(Boolean).map(String) : [];
  const official = values.length ? values : OFFICIAL_SCORESHEET_COLUMNS;
  return official.filter((column) => OFFICIAL_SCORESHEET_COLUMNS.includes(column));
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
    ${renderTabs()}
    <section class="public-tab-panel ${state.activeTab === "resumen" ? "active" : ""}" data-panel="resumen">
      ${renderSummaryCards(data)}
      <div class="public-grid two">
        ${renderLiveScoreboard(data)}
        ${renderCurrentTurn(data)}
      </div>
      ${renderRanking(data)}
    </section>
    <section class="public-tab-panel ${state.activeTab === "sabana" ? "active" : ""}" data-panel="sabana">
      ${renderScoreSheet(data)}
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

function renderSummaryCards(data) {
  const summary = data.summary || {};
  const leader = data.ranking?.[0] || {};
  const cards = [
    ["Equipos", summary.totalTeams || data.teams.length || data.ranking.length || "-"],
    ["Equipo lider", leader.teamName || "-"],
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
        <span>Snapshot publico</span>
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
        <h2>Top 10 general</h2>
        <span>Ranking publico</span>
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
        <h2>Sabana del torneo</h2>
        <span>Snapshot publico</span>
      </div>
      <div class="public-table-scroll">${renderSimpleTable(headers, rows)}</div>
    </section>
  `;
}

function renderTeams(data) {
  const rows = data.teams.map((team, index) => [
    index + 1,
    team.teamName,
    team.categoryName || "-",
    moneylessNumber(team.total)
  ]);
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Equipos participantes</h2>
        <span>${moneylessNumber(data.teams.length)} equipos</span>
      </div>
      ${renderSimpleTable(["#", "Equipo", "Categoria", "Total"], rows)}
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
