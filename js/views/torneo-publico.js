import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260706-release22d-active-charreada-source2";
import {
  getLiveChannelFromUrl,
  subscribeFirebaseLiveCurrent,
  subscribePublicTournamentSnapshot
} from "../core/firebaseSync.js?v=20260706-release22d-active-charreada-source2";

const UNAVAILABLE_MESSAGE = "Información pública no disponible todavía";
const SCORE_SHEET_COLUMNS = [
  ["cala", "Cala"],
  ["piales", "Piales"],
  ["colas", "Colas"],
  ["jineteoToro", "Jineteo de Toro"],
  ["terna", "Terna"],
  ["jineteoYegua", "Jineteo de Yegua"],
  ["manganasPie", "Manganas a Pie"],
  ["manganasCaballo", "Manganas a Caballo"],
  ["paso", "Paso de la Muerte"]
];

const state = {
  tournamentId: "",
  publicSnapshot: null,
  liveCurrent: null,
  publicStatus: null,
  liveStatus: null,
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

  const renderFromState = () => {
    renderPublicTournamentPage(normalizePublicTournamentData({
      tournamentId: state.tournamentId,
      publicSnapshot: state.publicSnapshot,
      liveCurrent: state.liveCurrent,
      publicStatus: state.publicStatus,
      liveStatus: state.liveStatus
    }));
  };

  subscribePublicTournamentSnapshot(state.tournamentId, (snapshot, status) => {
    state.publicSnapshot = snapshot;
    state.publicStatus = status;
    console.info("[public-c001] public snapshot loaded", {
      exists: Boolean(snapshot),
      status
    });
    renderFromState();
  });

  subscribeFirebaseLiveCurrent(state.tournamentId, (current, status) => {
    state.liveCurrent = current;
    state.liveStatus = status;
    console.info("[public-c001] live/current loaded", {
      exists: Boolean(current),
      status
    });
    renderFromState();
  });
}

function getTournamentIdFromUrl() {
  return getLiveChannelFromUrl("");
}

function normalizePublicTournamentData(raw = {}) {
  const publicSnapshot = raw.publicSnapshot || null;
  const liveCurrent = raw.liveCurrent || null;
  const hasPublic = hasObjectData(publicSnapshot);
  const hasLive = hasObjectData(liveCurrent);
  const source = hasPublic ? "publicTournaments" : hasLive ? "live/current" : "none";

  if (!hasPublic && !hasLive) {
    console.info("[public-c001] public data unavailable");
    return {
      source,
      tournamentId: raw.tournamentId || "",
      unavailable: true,
      message: UNAVAILABLE_MESSAGE,
      summary: {},
      live: {},
      teams: [],
      scoreboardTeams: [],
      ranking: [],
      scoreSheet: []
    };
  }

  const publicLive = publicSnapshot?.live || {};
  const live = hasObjectData(publicLive) ? publicLive : liveCurrent || {};
  const summary = normalizeSummary(publicSnapshot?.summary || {}, live, raw.tournamentId);
  const teams = normalizeTeams(publicSnapshot, live);
  const scoreboardTeams = normalizeScoreboard(publicSnapshot, live);
  const ranking = buildRanking(publicSnapshot, live, teams);
  const scoreSheet = buildTournamentScoreSheet({ publicSnapshot, live, teams, ranking });

  console.info("[public-c001] data normalized", {
    source,
    teams: teams.length,
    scoreboardTeams: scoreboardTeams.length,
    ranking: ranking.length,
    scoreSheet: scoreSheet.length
  });

  return {
    source,
    tournamentId: raw.tournamentId || summary.tournamentId || "",
    unavailable: false,
    message: "",
    summary,
    live,
    teams,
    scoreboardTeams,
    ranking,
    scoreSheet,
    readWarning: raw.publicStatus?.reason || raw.liveStatus?.reason || ""
  };
}

function normalizeSummary(summary = {}, live = {}, tournamentId = "") {
  const tournament = live.tournament || {};
  const charreada = live.charreada || {};
  const turn = live.turn || {};
  const updatedAt = summary.lastUpdated || summary.updatedAt || live.timestamp || live.firebaseUpdatedAt || "";

  return {
    tournamentId: summary.tournamentId || tournament.id || tournamentId || "",
    tournamentName: summary.tournamentName || summary.name || tournament.name || "CharroPro",
    venue: summary.venue || tournament.venue || "",
    date: summary.date || tournament.date || "",
    status: summary.status || (live ? "EN VIVO" : ""),
    activeCharreadaName: summary.activeCharreadaName || charreada.name || "",
    currentTeamName: summary.currentTeamName || turn.team?.name || turn.teamName || "",
    currentSuerte: summary.currentSuerte || turn.suerte?.name || turn.suerteName || live.published?.suerte?.name || "",
    totalTeams: Number(summary.totalTeams || 0),
    lastUpdated: updatedAt ? formatDate(updatedAt) : ""
  };
}

function normalizeTeams(publicSnapshot = {}, live = {}) {
  const publicTeams = objectToArray(publicSnapshot?.teams);
  const standingsRows = objectToArray(publicSnapshot?.teamStandings?.rows || publicSnapshot?.standings?.rows || live.teamStandings?.rows);
  const scoreboardTeams = objectToArray(publicSnapshot?.scoreboardTeams || publicSnapshot?.live?.scoreboardTeams || live.scoreboardTeams);
  const rankingRows = objectToArray(publicSnapshot?.ranking?.rows || live.leaderboard);
  const records = new Map();

  publicTeams.forEach((team) => addTeamRecord(records, team));
  standingsRows.forEach((row) => addTeamRecord(records, row.team || row));
  scoreboardTeams.forEach((team) => addTeamRecord(records, team));
  rankingRows.forEach((row) => addTeamRecord(records, row.team || row));

  return [...records.values()].map((team, index) => ({
    position: Number(team.position || index + 1),
    teamId: team.teamId || team.id || "",
    teamName: team.teamName || team.name || `Equipo ${index + 1}`,
    categoryName: team.categoryName || team.category || "",
    total: numberOrZero(team.total ?? team.score ?? team.points),
    active: Boolean(team.active)
  }));
}

function normalizeScoreboard(publicSnapshot = {}, live = {}) {
  const rows = objectToArray(publicSnapshot?.live?.scoreboardTeams || publicSnapshot?.scoreboardTeams || live.scoreboardTeams);
  return rows.map((team, index) => ({
    position: Number(team.position || index + 1),
    teamId: team.teamId || team.id || "",
    teamName: team.teamName || team.name || `Equipo ${index + 1}`,
    total: numberOrZero(team.total ?? team.score ?? team.points),
    active: Boolean(team.active)
  }));
}

function buildRanking(publicSnapshot = {}, live = {}, teams = []) {
  const rows = objectToArray(
    publicSnapshot?.stats?.generalTop10 ||
      publicSnapshot?.ranking?.rows ||
      publicSnapshot?.teamStandings?.rows ||
      live.leaderboard ||
      live.teamStandings?.rows ||
      teams
  );

  return rows
    .map((row) => {
      const team = row.team || row;
      return {
        teamId: team.teamId || team.id || row.teamId || "",
        teamName: team.teamName || team.name || row.teamName || "Equipo",
        total: numberOrZero(row.total ?? row.score ?? team.total ?? team.score),
        position: Number(row.rank || row.position || 0)
      };
    })
    .filter((row) => row.teamName)
    .sort((a, b) => b.total - a.total)
    .map((row, index) => ({ ...row, position: row.position || index + 1 }));
}

function buildTournamentScoreSheet(data = {}) {
  const scoreSheets = data.publicSnapshot?.scoreSheets;
  const rows = objectToArray(scoreSheets?.rows || scoreSheets);
  const rankingByTeam = new Map((data.ranking || []).map((row) => [row.teamId || row.teamName, row]));

  if (rows.length) {
    return rows.map((row, index) => normalizeScoreSheetRow(row, index, rankingByTeam));
  }

  return (data.teams || []).map((team, index) => normalizeScoreSheetRow({
    teamId: team.teamId,
    teamName: team.teamName,
    total: team.total
  }, index, rankingByTeam));
}

function normalizeScoreSheetRow(row = {}, index = 0, rankingByTeam = new Map()) {
  const suertes = row.suertes || row.scores || {};
  const teamId = row.teamId || row.team?.id || row.id || "";
  const ranking = rankingByTeam.get(teamId) || rankingByTeam.get(row.teamName || row.team?.name || "");
  return {
    position: Number(row.position || ranking?.position || index + 1),
    teamId,
    teamName: row.teamName || row.team?.name || row.name || ranking?.teamName || `Equipo ${index + 1}`,
    cala: scoreValue(suertes.cala ?? row.cala),
    piales: scoreValue(suertes.piales ?? row.piales),
    colas: scoreValue(suertes.colas ?? row.colas),
    jineteoToro: scoreValue(suertes.jineteoToro ?? suertes.toro ?? row.jineteoToro),
    terna: scoreValue(suertes.terna ?? suertes.lazo ?? row.terna),
    jineteoYegua: scoreValue(suertes.jineteoYegua ?? suertes.yegua ?? row.jineteoYegua),
    manganasPie: scoreValue(suertes.manganasPie ?? suertes.mangPie ?? row.manganasPie),
    manganasCaballo: scoreValue(suertes.manganasCaballo ?? suertes.mangCaballo ?? row.manganasCaballo),
    paso: scoreValue(suertes.paso ?? row.paso),
    total: scoreValue(row.total ?? ranking?.total)
  };
}

function renderPublicTournamentPage(data) {
  const root = document.getElementById("public-tournament-root");
  if (!root) return;

  if (data.unavailable) {
    root.innerHTML = renderUnavailable(data);
    console.info("[public-c001] render complete", { unavailable: true });
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
  console.info("[public-c001] render complete", { source: data.source });
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
        <small>${escapeHTML(data.source === "publicTournaments" ? "Datos publicos" : "Respaldo live/current")}</small>
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
  const rows = data.scoreboardTeams.length ? data.scoreboardTeams : data.teams.slice(0, 6);
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Marcador actual</h2>
        <span>Orden de turno</span>
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
  const turn = data.live?.turn || {};
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>En vivo</h2>
        <span>${escapeHTML(summary.activeCharreadaName || "Charreada actual")}</span>
      </div>
      <div class="public-live-grid">
        <div><span>Equipo</span><strong>${escapeHTML(summary.currentTeamName || turn.team?.name || "-")}</strong></div>
        <div><span>Suerte</span><strong>${escapeHTML(summary.currentSuerte || "-")}</strong></div>
        <div><span>Tiempo</span><strong>${escapeHTML(data.live?.timer?.display || data.live?.timer?.label || "-")}</strong></div>
        <div><span>Ultima calificacion</span><strong>${escapeHTML(data.live?.published?.total ?? data.live?.publishedScore?.total ?? "-")}</strong></div>
      </div>
    </section>
  `;
}

function renderScoreSheet(data) {
  const headers = ["Pos.", "Equipo", ...SCORE_SHEET_COLUMNS.map(([, label]) => label), "Total"];
  const rows = data.scoreSheet.map((row) => [
    row.position,
    row.teamName,
    ...SCORE_SHEET_COLUMNS.map(([key]) => moneylessNumber(row[key])),
    moneylessNumber(row.total)
  ]);
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Sabana del torneo</h2>
        <span>Lectura publica</span>
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
    team.active ? "En turno" : "",
    moneylessNumber(team.total)
  ]);
  return html`
    <section class="public-panel">
      <div class="public-panel-head">
        <h2>Equipos participantes</h2>
        <span>${moneylessNumber(data.teams.length)} equipos</span>
      </div>
      ${renderSimpleTable(["#", "Equipo", "Categoria", "Estado", "Total"], rows)}
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
        liveCurrent: state.liveCurrent,
        publicStatus: state.publicStatus,
        liveStatus: state.liveStatus
      }));
    });
  });
}

function objectToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).filter(Boolean);
  return [];
}

function addTeamRecord(records, team = {}) {
  const id = team.teamId || team.id || team.name || team.teamName || "";
  if (!id) return;
  records.set(id, {
    ...(records.get(id) || {}),
    ...team,
    teamId: team.teamId || team.id || id,
    teamName: team.teamName || team.name || id
  });
}

function hasObjectData(value) {
  return Boolean(value && typeof value === "object" && Object.keys(value).length);
}

function scoreValue(value) {
  if (value && typeof value === "object") return numberOrZero(value.total ?? value.score ?? value.points);
  return numberOrZero(value);
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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
