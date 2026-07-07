import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260707-core-infra-001-versioning1";
import { applyGraphicsConfig, normalizeGraphicsConfig, readLocalGraphicsConfig } from "../core/graphicsConfig.js?v=20260707-core-infra-001-versioning1";
import { calculateAttemptTotal } from "../core/scoring.js?v=20260707-core-infra-001-versioning1";
import { buildLivePayload, getCharroName } from "../core/sync.js?v=20260707-core-infra-001-versioning1";
import { LIVE_TIMER_KEY, STORAGE_KEY, loadState, state, subscribeToLiveUpdates } from "../core/state.js?v=20260707-core-infra-001-versioning1";
import { getLiveChannelFromUrl, isFirebaseLiveConfigured, subscribeFirebaseLiveCurrent } from "../core/firebaseSync.js?v=20260707-core-infra-001-versioning1";
import { getTimerView } from "../core/timerRules.js?v=20260707-core-infra-001-versioning1";

const root = document.getElementById("graphic-root");
const view = new URLSearchParams(window.location.search).get("view") || root.dataset.view || "scoreboard";
const liveChannel = getLiveChannelFromUrl();
const graphicLayout = getGraphicLayout();
const hasInitialLocalState = hasStoredLocalState();
let remoteSyncUrl = "";
let remotePayload = null;
let remoteFetchPending = false;
let remotePollingStarted = false;
let remoteGraphicsConfig = null;
let firebaseGraphicsConfig = null;
let firebaseUnsubscribe = null;
const RANKING_TEAM_LIMIT = 10;

loadState();
configureGraphicCanvas();
ensureFirebaseLive();
ensureRemotePolling();
render();
window.addEventListener("resize", configureGraphicCanvas);
subscribeToLiveUpdates(() => {
  ensureFirebaseLive();
  ensureRemotePolling();
  render();
});
window.setInterval(() => {
  ensureFirebaseLive();
  ensureRemotePolling();
  render();
}, 100);

function render() {
  if (!liveChannel) {
    root.innerHTML = renderMissingTournamentGraphic();
    return;
  }
  if (!remotePayload && isFirebaseLiveConfigured()) {
    root.innerHTML = renderWaitingOfficialGraphic();
    return;
  }
  if (!remotePayload) loadState();
  const payload = getRenderPayload();
  const config = getRenderConfig(payload);
  applyGraphicsConfig(config);

  if (view === "timer") {
    root.innerHTML = renderTimerGraphic(payload.timer);
    return;
  }

	  if (view === "turn") {
	    root.innerHTML = renderTurnGraphic(payload.turn);
	    return;
	  }

	  if (["individual-turn", "caladero-turno", "coleadero-turno"].includes(view)) {
	    root.innerHTML = renderIndividualTurnGraphic(payload, config);
	    return;
	  }

	  if (["cala-detail", "cala-detalle", "caladero-detalle"].includes(view)) {
	    root.innerHTML = renderCalaDetailGraphic(payload, config);
	    return;
	  }

  if (view === "category" || view === "categoria") {
    root.innerHTML = renderCategoryGraphic(payload, config);
    return;
  }

  if (view === "coleadero") {
    root.innerHTML = renderColeaderoGraphic(payload, config);
    return;
  }

  if (view === "ranking") {
    root.innerHTML = renderRankingGraphic(payload, config);
    return;
  }

  root.innerHTML = renderScoreboardGraphic(payload, config);
}

function renderMissingTournamentGraphic() {
  return html`
    <main class="graphic-stage">
      <section class="graphic-widget graphic-scoreboard">
        <div class="graphic-team-stack">
          <div class="graphic-team-row active">
            <div class="graphic-team-name">GRAFICO SIN TORNEO CONFIGURADO</div>
            <div class="graphic-team-score">--</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderWaitingOfficialGraphic() {
  return html`
    <main class="graphic-stage">
      <section class="graphic-widget graphic-scoreboard">
        <div class="graphic-team-stack">
          <div class="graphic-team-row active">
            <div class="graphic-team-name">Esperando publicación oficial...</div>
            <div class="graphic-team-score">--</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function getGraphicLayout() {
  const params = new URLSearchParams(window.location.search);
  const format = String(params.get("formato") || params.get("orientacion") || params.get("orientation") || "").toLowerCase();
  const size = String(params.get("size") || params.get("resolucion") || params.get("resolution") || "").toLowerCase();
  const sizeMatch = size.match(/^(\d{3,5})x(\d{3,5})$/);

  if (sizeMatch) {
    const width = Number(sizeMatch[1]);
    const height = Number(sizeMatch[2]);
    if (width > 0 && height > 0) return { width, height };
  }

  if (["vertical", "portrait", "9:16", "1080x1920"].includes(format)) {
    return { width: 1080, height: 1920 };
  }

  return { width: 1920, height: 1080 };
}

function configureGraphicCanvas() {
  const width = Number(graphicLayout.width || 1920);
  const height = Number(graphicLayout.height || 1080);
  const scale = Math.min(window.innerWidth / width, window.innerHeight / height) || 1;
  const orientation = height > width ? "vertical" : "horizontal";

  document.documentElement.style.setProperty("--graphic-design-width", `${width}px`);
  document.documentElement.style.setProperty("--graphic-design-height", `${height}px`);
  document.documentElement.style.setProperty("--graphic-stage-scale", String(scale));
  document.documentElement.dataset.graphicOrientation = orientation;
  root.dataset.orientation = orientation;
  root.dataset.size = `${width}x${height}`;
}

function getRenderPayload() {
  const localTimer = readStoredLiveTimer();
  if (!remotePayload && isFirebaseLiveConfigured()) {
    return {
      turn: null,
      leaderboard: [],
      teamStandings: null,
      coleadero: null,
      timer: buildLiveTimer(localTimer),
      graphicsConfig: readLocalGraphicsConfig()
    };
  }

  if (remotePayload) {
    return {
      ...remotePayload,
      timer: buildLiveTimer(hasTimerValue(remotePayload.timer) ? remotePayload.timer : localTimer, remotePayload)
    };
  }

  if (hasRemoteSync()) {
    if (!remotePayload) {
      if (hasInitialLocalState) {
        const payload = buildLivePayload();
        return {
          ...payload,
          timer: buildLiveTimer(chooseFreshTimer(payload.timer, localTimer), payload)
        };
      }

      return {
        turn: null,
        leaderboard: [],
        timer: buildLiveTimer(localTimer),
        graphicsConfig: readLocalGraphicsConfig()
      };
    }

    return {
      ...remotePayload,
      timer: buildLiveTimer(hasTimerValue(remotePayload.timer) ? remotePayload.timer : localTimer, remotePayload)
    };
  }

  const payload = buildLivePayload();
  return {
    ...payload,
    timer: buildLiveTimer(chooseFreshTimer(payload.timer, localTimer), payload)
  };
}

function getRenderConfig(payload) {
  return normalizeGraphicsConfig(
    firebaseGraphicsConfig ||
    remoteGraphicsConfig ||
    payload.graphicsConfig ||
    state.settings?.graphicsConfig ||
    readLocalGraphicsConfig()
  );
}

function renderScoreboardGraphic(payload, config) {
  const teams = buildScoreboardTeamRows(payload, payload.turn).slice(0, config.maxTeams);
  return html`
    <main class="graphic-stage">
      <section class="graphic-scoreboard graphic-widget">
        ${config.showLogo ? html`<div class="graphic-logo" aria-hidden="true"></div>` : ""}
        <div class="graphic-team-stack">
          ${teams.map(renderTeamRow).join("")}
        </div>
      </section>
    </main>
  `;
}

function buildScoreboardTeamRows(payload, turn) {
  return sortRowsByProgramOrder(buildTeamRows(payload, turn), payload);
}

function renderTimerGraphic(timer) {
  const safeTimer = timer || {};
  return html`
    <main class="graphic-stage">
      <aside class="graphic-timer graphic-widget ${safeTimer.running ? "running" : "paused"} ${safeTimer.expired ? "expired" : ""}">
        <span>${escapeHTML(safeTimer.stateLabel || (safeTimer.running ? "Cronometro" : "Cronometro pausado"))}</span>
        <strong>${escapeHTML(safeTimer.formatted || "00:00.0")}</strong>
      </aside>
    </main>
  `;
}

function renderTurnGraphic(turn) {
  const info = buildTurnInfo(turn);

  return html`
    <main class="graphic-stage">
      <section class="graphic-turn graphic-widget">
        <div class="graphic-turn-text">
          <span>${escapeHTML(info.kicker)}</span>
          <strong>${escapeHTML(info.charro)}</strong>
          <em>${escapeHTML(info.team)}</em>
          ${
            info.meta.length
              ? html`<div class="graphic-turn-meta">${info.meta.map((item) => html`<span>${escapeHTML(item)}</span>`).join("")}</div>`
              : ""
          }
        </div>
        <div class="graphic-pass-card">
          <span>Pasada</span>
          <strong>${moneylessNumber(calculateAttemptTotal(turn?.attempt))}</strong>
        </div>
      </section>
    </main>
  `;
}

function buildTurnInfo(turn) {
  if (!turn) {
    return {
      kicker: "En vivo",
      charro: "Sin charreada activa",
      team: "Esperando datos",
      meta: []
    };
  }

  const charroName = getTurnCharroName(turn) || "Sin registrar";
  const suerteName = turn.suerte?.fullName || turn.suerte?.name || "Suerte";
  const teamName = turn.team?.name || "Equipo en turno";
  const meta = [suerteName];

  if (isColeaderoTurn(turn)) meta.push(`Coleador ${Number(turn.coleadorIndex || 0) + 1}`);
  meta.push(getTurnAttemptLabel(turn));
  if (turn.attempt?.desc) meta.push("Descalificacion");

  return {
    kicker: "Charro en turno",
    charro: charroName,
    team: teamName,
    meta
  };
}

function getTurnCharroName(turn) {
  if (!turn) return "";
  if (turn.charro) return turn.charro;
  if (!turn.team || !turn.suerte) return "";
  return getCharroName({
    team: turn.team,
    suerte: turn.suerte,
    coleadorIndex: turn.coleadorIndex
  });
}

function getTurnAttemptLabel(turn) {
  const attemptNumber = Number(turn?.attemptIndex || 0) + 1;
  const maxAttempts = Math.max(1, Number(turn?.suerte?.attempts || 1));
  const suerteId = turn?.suerte?.id || "";

  if (suerteId === "colas") return `${formatPasadaOrdinal(attemptNumber)} pasada`;
  if (["piales", "manganas_pie", "manganas_caballo"].includes(suerteId)) return `${formatTiroOrdinal(attemptNumber)} tiro`;
  if (maxAttempts > 1) return `Oportunidad ${attemptNumber} de ${maxAttempts}`;
  return "Turno unico";
}

function isColeaderoTurn(turn) {
  return turn?.suerte?.id === "colas" || turn?.suerte?.type === "coleadero";
}

function formatTiroOrdinal(value) {
  if (value === 1) return "1er";
  if (value === 2) return "2do";
  if (value === 3) return "3er";
  return `${value}o`;
}

function formatPasadaOrdinal(value) {
  return `${value}a`;
}

function renderRankingGraphic(payload, config) {
  const standings = getTeamStandings(payload);
  const teams = standings.rows.slice(0, RANKING_TEAM_LIMIT);
  const title = standings.title || "Tabla general por equipos";
  const nameLabel = title.toLowerCase().includes("participantes") ? "Participante" : "Equipo";
  return html`
    <main class="graphic-stage">
      <section class="graphic-ranking graphic-ranking-table graphic-widget">
        <div class="graphic-ranking-title">${escapeHTML(title)}</div>
        <div class="graphic-ranking-grid">
          <div class="graphic-ranking-grid-row header">
            <span>#</span>
            <span>${escapeHTML(nameLabel)}</span>
            <span>Prom.</span>
            <span>Total</span>
          </div>
          ${teams.map((team, index) => html`
            <div class="graphic-ranking-grid-row ${team.active ? "active" : ""}">
              <span>${index + 1}</span>
              <strong>${escapeHTML(team.team?.name || team.name || "Equipo")}</strong>
              <em>${formatAverage(team.average)}</em>
              <em>${moneylessNumber(team.total)}</em>
            </div>
          `).join("")}
        </div>
      </section>
    </main>
  `;
}

function renderIndividualTurnGraphic(payload, config) {
  const windowRows = buildIndividualTurnWindow(payload);
  const tournamentType = payload.tournament?.type || "";
  const title = view === "coleadero-turno" || tournamentType === "coleadero" ? "Coleadero" : "Caladero";
  const charreadaName = payload.charreada?.name || "Charreada";
  const suerteName = payload.turn?.suerte?.fullName || title;

  return html`
    <main class="graphic-stage">
      <section class="graphic-individual-turn graphic-widget">
        ${config.showLogo ? html`<div class="graphic-individual-logo" aria-hidden="true"></div>` : ""}
        <header class="graphic-individual-header">
          <span>${escapeHTML(title)}</span>
          <strong>${escapeHTML(charreadaName)}</strong>
          <em>${escapeHTML(suerteName)}</em>
        </header>
        <div class="graphic-individual-cards">
          ${renderIndividualTurnCard("Anterior", windowRows.previous, "previous")}
          ${renderIndividualTurnCard("En turno", windowRows.current, "current")}
          ${renderIndividualTurnCard("Siguiente", windowRows.next, "next")}
        </div>
      </section>
    </main>
  `;
}

function renderIndividualTurnCard(label, row, tone) {
  const participant = formatGraphicParticipant(row?.team);
  const total = row ? moneylessNumber(row.total) : "-";
  return html`
    <article class="graphic-individual-card ${tone}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(participant.main)}</strong>
      ${participant.sub ? html`<em>${escapeHTML(participant.sub)}</em>` : ""}
      <b>${escapeHTML(total)}</b>
    </article>
  `;
}

function renderCalaDetailGraphic(payload, config) {
  const score = payload.published || null;
  const isCala = score?.suerte?.id === "cala";

  if (!isCala) {
    return html`
      <main class="graphic-stage">
        <section class="graphic-cala-detail graphic-widget waiting">
          ${config.showLogo ? html`<div class="graphic-cala-logo" aria-hidden="true"></div>` : ""}
          <span>Cala publicada</span>
          <strong>Esperando resultado</strong>
          <em>Se mostrara al tocar Publicar y siguiente</em>
        </section>
      </main>
    `;
  }

  const breakdown = score.breakdown || {};
  const participant = formatGraphicParticipant(score.team);
  const adicGroups = normalizeCalaGroups(breakdown.adicGroups);
  const extraAdicItems = normalizeCalaExtraAdicItems(breakdown);
  const infrItems = normalizeCalaInfrItems(breakdown);
  const charreadaName = score.charreada?.name || "";

  return html`
    <main class="graphic-stage">
      <section class="graphic-cala-detail graphic-widget">
        ${config.showLogo ? html`<div class="graphic-cala-logo" aria-hidden="true"></div>` : ""}
        <header class="graphic-cala-head">
          <div>
            <span>Cala publicada</span>
            <strong>${escapeHTML(participant.main)}</strong>
            <em>${escapeHTML([participant.sub, charreadaName].filter(Boolean).join(" / "))}</em>
          </div>
          <div class="graphic-cala-final">
            <span>Puntuacion</span>
            <strong>${moneylessNumber(score.total)}</strong>
          </div>
        </header>
        <div class="graphic-cala-sheet">
          <div class="graphic-cala-base">
            <span>Base</span>
            <strong>${moneylessNumber(breakdown.base)}</strong>
          </div>
          <div class="graphic-cala-punta">
            <span>Punta</span>
            <strong>${moneylessNumber(breakdown.puntaPts)}</strong>
            <em>${moneylessNumber(breakdown.puntaMetros)} mts / ${moneylessNumber(breakdown.puntaPiquetes)} marcas</em>
          </div>
          <div class="graphic-cala-adic">
            <span>Adicionales</span>
            <div class="graphic-cala-adic-grid">
              ${adicGroups.map((group) => html`
                <article>
                  <b>${escapeHTML(group.code)}</b>
                  <strong>${moneylessNumber(group.total)}</strong>
                  <em>${escapeHTML(group.label)}</em>
                </article>
              `).join("")}
            </div>
            ${
              extraAdicItems.length
                ? html`
                    <div class="graphic-cala-extra-adic">
                      ${extraAdicItems.map((item) => html`
                        <article>
                          <b>${escapeHTML(item.abbr)}</b>
                          <strong>+${moneylessNumber(item.pts)}</strong>
                          <em>${escapeHTML(item.label)}</em>
                        </article>
                      `).join("")}
                    </div>
                  `
                : ""
            }
          </div>
          <div class="graphic-cala-malos">
            <span>Malos</span>
            <div class="graphic-cala-malos-grid">
              ${infrItems.map((item) => html`
                <article>
                  <b>${escapeHTML(item.abbr)}</b>
                  <strong>${item.pts ? `-${moneylessNumber(item.pts)}` : ""}</strong>
                </article>
              `).join("")}
            </div>
          </div>
          <div class="graphic-cala-totals">
            <article>
              <span>Total buenos</span>
              <strong>${moneylessNumber(Number(breakdown.base || 0) + Number(breakdown.adic || 0) + Number(breakdown.puntaPts || 0))}</strong>
            </article>
            <article>
              <span>Total malos</span>
              <strong>${Number(breakdown.infr || 0) + Number(breakdown.teamPenaltyTotal || 0) ? `-${moneylessNumber(Number(breakdown.infr || 0) + Number(breakdown.teamPenaltyTotal || 0))}` : "0"}</strong>
            </article>
            <article class="final">
              <span>Total</span>
              <strong>${moneylessNumber(score.total)}</strong>
            </article>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderColeaderoGraphic(payload, config) {
  const data = getColeaderoData(payload);
  const rows = data.rows.slice(0, 3);
  const teamName = data.team?.name || payload.turn?.team?.name || "Equipo en turno";
  const charreadaName = data.charreada?.name || payload.charreada?.name || "";

  return html`
    <main class="graphic-stage">
      <section class="graphic-coleadero graphic-widget">
        ${config.showLogo ? html`<div class="graphic-coleadero-logo" aria-hidden="true"></div>` : ""}
        <header class="graphic-coleadero-header">
          <div>
            <span>Resultados al momento</span>
            <strong>${escapeHTML(teamName)}</strong>
            <em>${escapeHTML(charreadaName ? `${charreadaName} / Coleadero` : "Coleadero")}</em>
          </div>
        </header>
        <div class="graphic-coleadero-columns" aria-hidden="true">
          <span></span>
          <span>1a</span>
          <span>2a</span>
          <span>3a</span>
          <span>Total</span>
        </div>
        <div class="graphic-coleadero-grid">
          ${rows.map(renderColeaderoRow).join("")}
        </div>
      </section>
    </main>
  `;
}

function renderCategoryGraphic(payload, config) {
  const turn = payload.turn || {};
  const team = turn.team || getTopTeam(payload);
  const category = getTeamCategory(team);
  const charreadaName = payload.charreada?.name || "";

  return html`
    <main class="graphic-stage">
      <section class="graphic-category graphic-widget">
        <div class="graphic-category-copy">
          <span>Categoria</span>
          <strong>${escapeHTML(category)}</strong>
          ${charreadaName ? html`<small>${escapeHTML(charreadaName)}</small>` : ""}
        </div>
      </section>
    </main>
  `;
}

function getTopTeam(payload) {
  const first = Array.isArray(payload.leaderboard) ? payload.leaderboard.find((item) => item?.team)?.team : null;
  return first || null;
}

function getTeamCategory(team) {
  const value = String(team?.category || "").trim();
  return value || "Libre";
}

function renderColeaderoRow(row) {
  const attempts = Array.from({ length: 3 }, (_, index) => row.attempts?.[index] || { index, total: 0, hasActivity: false });
  return html`
    <div class="graphic-coleadero-row ${row.active ? "active" : ""}">
      <div class="graphic-coleadero-name">
        <span>${Number(row.index || 0) + 1}</span>
        <strong>${escapeHTML(row.name || `Coleador ${Number(row.index || 0) + 1}`)}</strong>
      </div>
      ${attempts.map(renderColeaderoAttempt).join("")}
      <div class="graphic-coleadero-total">${moneylessNumber(row.total)}</div>
    </div>
  `;
}

function renderColeaderoAttempt(attempt) {
  const hasValue = Boolean(attempt?.hasActivity || attempt?.desc || Number(attempt?.total || 0));
  const value = attempt?.desc ? "DESC" : (hasValue ? moneylessNumber(attempt.total) : "-");
  return html`
    <div class="graphic-coleadero-attempt ${attempt?.active ? "active" : ""} ${Number(attempt?.total || 0) < 0 ? "negative" : ""}">
      ${escapeHTML(value)}
    </div>
  `;
}

function getColeaderoData(payload) {
  if (payload.coleadero?.rows?.length) return payload.coleadero;

  const isColeaderoTurn = payload.turn?.suerte?.id === "colas";
  const activeColeadorIndex = isColeaderoTurn ? Number(payload.turn?.coleadorIndex || 0) : -1;
  const activeAttemptIndex = isColeaderoTurn ? Number(payload.turn?.attemptIndex || 0) : -1;
  const activeTotal = isColeaderoTurn ? calculateAttemptTotal(payload.turn?.attempt) : 0;
  const activeCharro = isColeaderoTurn
    ? payload.turn?.charro || getCharroName({
        team: payload.turn?.team,
        suerte: payload.turn?.suerte,
        coleadorIndex: activeColeadorIndex
      })
    : "";

  return {
    charreada: payload.charreada || null,
    team: payload.turn?.team || null,
    suerte: { id: "colas", name: "Colas", fullName: "Coleadero" },
    activeColeadorIndex,
    activeAttemptIndex,
    rows: Array.from({ length: 3 }, (_, coleadorIndex) => {
      const attempts = Array.from({ length: 3 }, (_, attemptIndex) => {
        const active = coleadorIndex === activeColeadorIndex && attemptIndex === activeAttemptIndex;
        return {
          index: attemptIndex,
          total: active ? activeTotal : 0,
          hasActivity: active && Boolean(payload.turn?.attempt),
          active
        };
      });
      return {
        index: coleadorIndex,
        name: coleadorIndex === activeColeadorIndex && activeCharro ? activeCharro : `Coleador ${coleadorIndex + 1}`,
        attempts,
        total: attempts.reduce((sum, attempt) => sum + (attempt.hasActivity ? Number(attempt.total || 0) : 0), 0),
        active: coleadorIndex === activeColeadorIndex
      };
    })
  };
}

function getTeamStandings(payload) {
  const activeTeamId = payload.turn?.team?.id || "";
  const charreadas = Array.isArray(payload.teamStandings?.charreadas) ? payload.teamStandings.charreadas : [];
  const rows = Array.isArray(payload.teamStandings?.rows) ? payload.teamStandings.rows : [];
  const title = payload.teamStandings?.title || "Tabla general por equipos";

  if (charreadas.length && rows.length) {
    return {
      title,
      charreadas,
      rows: rows.map((row) => ({
        ...row,
        active: Boolean(activeTeamId && row.team?.id === activeTeamId)
      }))
    };
  }

  const fallbackCharreada = {
    id: payload.charreada?.id || "actual",
    name: payload.charreada?.name || "Actual"
  };
  return {
    title,
    charreadas: [fallbackCharreada],
    rows: buildTeamRows(payload, payload.turn).map((team) => ({
      team: {
        id: team.id || "",
        name: team.name
      },
      active: team.active,
      results: [{
        charreada: fallbackCharreada,
        participated: true,
        total: team.points,
        infr: 0
      }],
      total: team.points,
      average: team.points,
      charreadasCount: 1,
      infr: 0
    }))
  };
}

function buildIndividualTurnWindow(payload) {
  const rows = buildProgramParticipantRows(payload);
  if (!rows.length) {
    return {
      previous: null,
      current: null,
      next: null
    };
  }

  const activeTeamId = payload.turn?.team?.id || "";
  const activeIndex = Math.max(0, rows.findIndex((row) => row.team?.id === activeTeamId));
  return {
    previous: rows[activeIndex - 1] || null,
    current: rows[activeIndex] || rows[0] || null,
    next: rows[activeIndex + 1] || null
  };
}

function buildProgramParticipantRows(payload) {
  const leaderboard = Array.isArray(payload.leaderboard) ? payload.leaderboard : [];
  const byId = new Map();

  leaderboard.forEach((item) => {
    if (!item?.team?.id) return;
    byId.set(String(item.team.id), {
      team: item.team,
      total: Number(item.total || 0)
    });
  });

  if (payload.turn?.team?.id && !byId.has(String(payload.turn.team.id))) {
    byId.set(String(payload.turn.team.id), {
      team: payload.turn.team,
      total: 0
    });
  }

  const teamIds = Array.isArray(payload.charreada?.teamIds) ? payload.charreada.teamIds.map(String) : [];
  if (teamIds.length) {
    return teamIds
      .map((teamId, index) => {
        const row = byId.get(teamId);
        if (row) return { ...row, index };
        return {
          team: { id: teamId, name: `Participante ${index + 1}` },
          total: 0,
          index
        };
      })
      .filter((row) => row.team);
  }

  return Array.from(byId.values());
}

function formatGraphicParticipant(team = {}) {
  const participantName = String(team?.participantName || "").trim();
  const horseName = String(team?.horseName || "").trim();
  const main = participantName || team?.name || "Sin registrar";
  const sub = horseName ? `Caballo: ${horseName}` : (team?.category ? `Categoria: ${team.category}` : "");
  return { main, sub };
}

function normalizeCalaGroups(groups = []) {
  const fallback = [
    { code: "LD", label: "Lado derecho" },
    { code: "LI", label: "Lado izquierdo" },
    { code: "ML", label: "Medios lados" },
    { code: "CR", label: "Cambio de rectangulo" }
  ];
  const byCode = new Map((groups || []).map((group) => [group.code, group]));
  return fallback.map((item) => ({
    ...item,
    total: Number(byCode.get(item.code)?.total || 0),
    items: byCode.get(item.code)?.items || []
  }));
}

function normalizeCalaExtraAdicItems(breakdown = {}) {
  const items = (breakdown.extraAdicItems || breakdown.customAdic || []).map((item) => ({
    label: item.label || "Adicional",
    abbr: item.abbr || abbreviateGraphicLabel(item.label),
    pts: Number(item.pts || 0)
  }));

  const officialTotal = (breakdown.adicGroups || []).reduce((sum, group) => sum + Number(group.total || 0), 0);
  const expectedExtraTotal = Math.max(0, Number(breakdown.adic || 0) - officialTotal);
  const listedExtraTotal = items.reduce((sum, item) => sum + Number(item.pts || 0), 0);
  const missingExtra = expectedExtraTotal - listedExtraTotal;

  if (missingExtra > 0) {
    items.push({
      label: "Convocatoria",
      abbr: "CONV",
      pts: missingExtra
    });
  }

  return items.filter((item) => item.pts || item.label);
}

function normalizeCalaInfrItems(breakdown = {}) {
  const items = (breakdown.infrItems || []).map((item) => ({
    abbr: item.abbr || abbreviateGraphicLabel(item.label),
    pts: Number(item.pts || 0)
  })).concat((breakdown.teamPenalties || []).map((item) => ({
    abbr: item.abbr || "EQ",
    pts: Number(item.total || item.pts || 0)
  })));

  if (!items.length && Number(breakdown.infr || 0) > 0) {
    items.push({ abbr: "M", pts: Number(breakdown.infr || 0) });
  }

  while (items.length < 10) items.push({ abbr: "", pts: 0 });
  return items.slice(0, 10);
}

function abbreviateGraphicLabel(label) {
  const clean = String(label || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[-+]\d+/g, "")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return "M";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
}

function buildTeamRows(payload, turn) {
  const activeTeamId = turn?.team?.id || "";
  const leaderboard = Array.isArray(payload.leaderboard) ? payload.leaderboard : [];
  const rows = leaderboard
    .filter((item) => item?.team)
    .map((item) => ({
      id: item.team.id || "",
      name: item.team.name || "Equipo",
      points: Number(item.total || 0),
      active: Boolean(activeTeamId && item.team.id === activeTeamId)
    }));

  if (turn?.team && !rows.some((row) => row.id === activeTeamId)) {
    rows.unshift({
      id: activeTeamId,
      name: turn.team.name || "Equipo en turno",
      points: 0,
      active: true
    });
  }

  if (!rows.length) {
    return [
      { name: "Esperando equipo 1", points: 0, active: false },
      { name: "Esperando equipo 2", points: 0, active: false },
      { name: "Esperando equipo 3", points: 0, active: false }
    ];
  }

  return rows;
}

function sortRowsByProgramOrder(rows, payload) {
  const teamIds = Array.isArray(payload?.charreada?.teamIds) ? payload.charreada.teamIds : [];
  if (!teamIds.length) return rows;

  const order = new Map(teamIds.map((teamId, index) => [String(teamId), index]));
  return rows.slice().sort((a, b) => {
    const aIndex = order.has(String(a.id || "")) ? order.get(String(a.id || "")) : Number.MAX_SAFE_INTEGER;
    const bIndex = order.has(String(b.id || "")) ? order.get(String(b.id || "")) : Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

function renderTeamRow(team) {
  return html`
    <div class="graphic-team-row ${team.active ? "active" : ""}">
      <div class="graphic-team-name">${escapeHTML(team.name)}</div>
      <div class="graphic-team-score">${moneylessNumber(team.points)}</div>
    </div>
  `;
}

function formatAverage(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0.0";
  return number.toFixed(1);
}

function getRemoteSyncUrl() {
  const params = new URLSearchParams(window.location.search);
  const explicitSync = params.get("sync") || "";
  const liveParam = params.get("live") || "";
  const explicitLive = /^https?:\/\//i.test(liveParam) ? liveParam : "";
  if (explicitSync || explicitLive) return explicitSync || explicitLive;
  if (isFirebaseLiveConfigured()) return "";
  return state.settings?.googleSheetsUrl || "";
}

function hasRemoteSync() {
  return Boolean(remoteSyncUrl || getRemoteSyncUrl());
}

function ensureRemotePolling() {
  if (!remoteSyncUrl) remoteSyncUrl = getRemoteSyncUrl();
  if (!remoteSyncUrl || remotePollingStarted) return;

  remotePollingStarted = true;
  fetchRemotePayload();
  window.setInterval(fetchRemotePayload, 800);
}

function ensureFirebaseLive() {
  if (firebaseUnsubscribe) return;

  firebaseUnsubscribe = subscribeFirebaseLiveCurrent(liveChannel, (response) => {
    const payload = response?.payload || response;
    if (!payload) {
      remotePayload = null;
      render();
      return;
    }
    const nextPayload = normalizeRemotePayload(payload);
    const graphicsConfig = response?.graphicsConfig || payload?.graphicsConfig || nextPayload?.graphicsConfig;
    if (graphicsConfig) firebaseGraphicsConfig = normalizeGraphicsConfig(graphicsConfig);
    if (hasUsefulLivePayload(nextPayload)) {
      remotePayload = nextPayload;
      render();
    } else {
      remotePayload = null;
      render();
    }
  }, liveChannel);
}

function fetchRemotePayload() {
  if (!remoteSyncUrl || remoteFetchPending) return;
  remoteFetchPending = true;

  requestJsonp(remoteSyncUrl)
    .then((response) => {
      if (response?.ok === false) return;
      const payload = response?.payload || response;
      const nextPayload = normalizeRemotePayload(payload);
      remoteGraphicsConfig = normalizeGraphicsConfig(response?.graphicsConfig || payload?.graphicsConfig || nextPayload?.graphicsConfig);
      if (hasUsefulLivePayload(nextPayload)) remotePayload = nextPayload;
    })
    .catch(() => {
      // Mantiene el ultimo estado recibido para evitar parpadeos en OBS.
    })
    .finally(() => {
      remoteFetchPending = false;
    });
}

function normalizeRemotePayload(payload) {
  if (!Array.isArray(payload)) return payload || {};

  const leaderboard = payload.map((item, index) => {
    const name = item.nombre || item.name || item.equipo || item.team || `Equipo ${index + 1}`;
    return {
      team: {
        id: item.id || `remote-team-${index}`,
        name
      },
      total: Number(item.puntos ?? item.total ?? item.score ?? 0),
      infr: Number(item.malos ?? item.infr ?? 0),
      active: Boolean(item.enTurno || item.active || item.activo)
    };
  });

  const active = leaderboard.find((item) => item.active) || leaderboard[0] || null;
  return {
    turn: active
      ? {
          team: active.team,
          suerte: { fullName: "En vivo" },
          attemptIndex: 0,
          coleadorIndex: 0,
          attempt: { base: Number(active.total || 0), adic: 0, puntaPts: 0, infr: 0 },
          charro: "Turno actual"
        }
      : null,
    timer: {},
    leaderboard
  };
}

function hasUsefulLivePayload(payload) {
  if (Array.isArray(payload)) return payload.length > 0;
  if (!payload || typeof payload !== "object") return false;
  if (payload.action === "update_graphics_theme") return false;
  if (payload.turn?.team) return true;
  if (payload.published?.team) return true;
  if (Array.isArray(payload.leaderboard) && payload.leaderboard.some((item) => item?.team)) return true;
  if (Array.isArray(payload.coleadero?.rows) && payload.coleadero.rows.length) return true;
  if (Array.isArray(payload.teamStandings?.rows) && payload.teamStandings.rows.length) return true;
  if (Array.isArray(payload.detalles) && payload.detalles.length) return true;
  return hasTimerValue(payload.timer);
}

function requestJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `charroproGraphic_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo agotado"));
    }, 5000);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("No se pudo leer estado remoto"));
    };

    script.src = `${url}${separator}live=1&callback=${callbackName}&_=${Date.now()}`;
    document.head.appendChild(script);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
  });
}

function hasStoredLocalState() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function buildLiveTimer(timer = {}, payload = {}) {
  const normalized = normalizeTimer(timer);
  const view = getTimerView(normalized, {
    charreada: payload?.charreada || null,
    turn: payload?.turn || null
  });
  return {
    ...normalized,
    elapsedLiveMs: view.elapsedMs,
    displayMs: view.displayMs,
    remainingMs: view.remainingMs,
    formatted: view.formatted,
    mode: view.rule.mode,
    limitMs: view.rule.limitMs,
    limitLabel: view.rule.label,
    stateLabel: view.stateLabel,
    expired: view.expired
  };
}

function readStoredLiveTimer() {
  try {
    const raw = localStorage.getItem(LIVE_TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function chooseFreshTimer(primary, secondary) {
  const first = normalizeTimer(primary);
  const second = normalizeTimer(secondary);
  if (!hasTimerValue(first)) return hasTimerValue(second) ? second : {};
  if (!hasTimerValue(second)) return first;

  const firstRevision = Number(first.revision || 0);
  const secondRevision = Number(second.revision || 0);
  if (firstRevision && secondRevision && firstRevision !== secondRevision) {
    return secondRevision > firstRevision ? second : first;
  }
  const firstTime = getTimerFreshness(first);
  const secondTime = getTimerFreshness(second);
  if (secondTime !== firstTime) return secondTime > firstTime ? second : first;
  if (second.running && !first.running) return second;
  return first;
}

function normalizeTimer(timer = {}) {
  if (!timer || typeof timer !== "object") return {};
  const startedAt = timer.startedAt ?? timer.startTime ?? timer.start ?? timer.started ?? null;
  const elapsedMs = timer.elapsedMs ?? timer.elapsed ?? timer.elapsedMillis ?? timer.ms ?? 0;

  return {
    ...timer,
    running: Boolean(timer.running ?? timer.isRunning ?? timer.active),
    startedAt: startedAt === "" ? null : startedAt,
    elapsedMs: Number(elapsedMs || 0),
    revision: Number(timer.revision || 0),
    updatedAtMs: Number(timer.updatedAtMs || timer.firebaseUpdatedAt || 0),
    clientId: timer.clientId || "",
    updatedAt: timer.updatedAt || timer.timestamp || null
  };
}

function hasTimerValue(timer = {}) {
  return Boolean(timer.running || timer.startedAt || Number(timer.elapsedMs || 0) || timer.updatedAt);
}

function getTimerFreshness(timer = {}) {
  return Number(timer.updatedAtMs || timer.firebaseUpdatedAt || 0) || Date.parse(timer.updatedAt || "") || Number(timer.startedAt || 0) || 0;
}
