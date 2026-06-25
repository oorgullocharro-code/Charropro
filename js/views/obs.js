import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260622-prepare-gate1";
import { applyGraphicsConfig, normalizeGraphicsConfig, readLocalGraphicsConfig } from "../core/graphicsConfig.js?v=20260622-prepare-gate1";
import { buildLivePayload, getCharroName } from "../core/sync.js?v=20260622-prepare-gate1";
import { calculateAttemptTotal } from "../core/scoring.js?v=20260622-prepare-gate1";
import { LIVE_TIMER_KEY, STORAGE_KEY, loadState, state, subscribeToLiveUpdates } from "../core/state.js?v=20260622-prepare-gate1";
import { getLiveChannelFromUrl, isFirebaseLiveConfigured, subscribeFirebaseLive } from "../core/firebaseSync.js?v=20260622-prepare-gate1";
import { getTimerView } from "../core/timerRules.js?v=20260622-prepare-gate1";

const root = document.getElementById("obs-root");
const liveChannel = getLiveChannelFromUrl();
const hasInitialLocalState = hasStoredLocalState();
let remoteSyncUrl = "";
let remotePayload = null;
let remoteFetchPending = false;
let remotePollingStarted = false;
let remoteGraphicsConfig = null;
let firebaseGraphicsConfig = null;
let firebaseUnsubscribe = null;

loadState();
ensureFirebaseLive();
ensureRemotePolling();
render();
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
    root.innerHTML = renderMissingTournamentObs();
    return;
  }
  if (!remotePayload) loadState();
  const payload = getRenderPayload();
  applyGraphicsConfig(firebaseGraphicsConfig || remoteGraphicsConfig || payload.graphicsConfig || state.settings?.graphicsConfig || readLocalGraphicsConfig());
  const turn = payload.turn;
  const timer = payload.timer;
  const teams = buildObsTeamRows(payload, turn);

  root.innerHTML = html`
    <main class="obs-frame">
      ${renderObsTimer(timer)}
      <section class="obs-scoreboard">
        <div class="obs-logo" aria-hidden="true"></div>
        <div class="obs-board-content">
          <div class="obs-team-stack">
            ${teams.map(renderObsTeamRow).join("")}
          </div>
          ${renderObsNow(turn)}
        </div>
      </section>  
    </main>
  `;
}

function renderMissingTournamentObs() {
  return html`
    <main class="obs-frame">
      <section class="obs-scoreboard">
        <div class="obs-board-content">
          <div class="obs-now">
            <div class="obs-now-text">
              <span>CharroPro</span>
              <strong>OBS sin torneo configurado</strong>
              <em>Agrega ?tournamentId=ID_DEL_TORNEO a la URL.</em>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function getRenderPayload() {
  const localTimer = readStoredLiveTimer();
  if (!remotePayload && isFirebaseLiveConfigured()) {
    return {
      turn: null,
      leaderboard: [],
      timer: buildLiveTimer(localTimer),
      graphicsConfig: readLocalGraphicsConfig()
    };
  }

  if (hasRemoteSync()) {
    if (!remotePayload) {
      if (hasInitialLocalState) {
        const payload = buildLivePayload();
        return {
          ...payload,
          timer: buildLiveTimer(chooseFreshTimer(payload.timer, localTimer))
        };
      }

      return {
        turn: null,
        leaderboard: [],
        timer: buildLiveTimer(localTimer)
      };
    }

    return {
      ...remotePayload,
      timer: buildLiveTimer(hasTimerValue(remotePayload.timer) ? remotePayload.timer : localTimer, remotePayload)
    };
  }

  if (!remotePayload) {
    const payload = buildLivePayload();
    return {
      ...payload,
      timer: buildLiveTimer(chooseFreshTimer(payload.timer, localTimer), payload)
    };
  }

  return {
    ...remotePayload,
    timer: buildLiveTimer(hasTimerValue(remotePayload.timer) ? remotePayload.timer : localTimer, remotePayload)
  };
}

function renderObsTimer(timer) {
  const hasCountdownRule = timer?.mode === "countdown" && Number(timer?.limitMs || 0) > 0;
  if (!timer?.running && !Number(timer?.elapsedMs || 0) && !hasCountdownRule) return "";

  return html`
    <aside class="obs-timer ${timer.running ? "running" : "paused"} ${timer.expired ? "expired" : ""}">
      <span>${escapeHTML(timer.stateLabel || (timer.running ? "Cronometro" : "Cronometro pausado"))}</span>
      <strong>${escapeHTML(timer.formatted || "00:00.0")}</strong>
    </aside>
  `;
}

function buildObsTeamRows(payload, turn) {
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

  return sortRowsByProgramOrder(rows, payload).slice(0, 6);
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

function renderObsTeamRow(team) {
  return html`
    <div class="obs-team-row ${team.active ? "active" : ""}">
      <div class="obs-team-name">${escapeHTML(team.name)}</div>
      <div class="obs-team-score">${moneylessNumber(team.points)}</div>
    </div>
  `;
}

function renderObsNow(turn) {
  if (!turn) {
    return html`
      <div class="obs-now">
        <div class="obs-now-text">
          <span>En vivo</span>
          <strong>Sin charreada activa</strong>
          <em>Esperando datos</em>
        </div>
        <div class="obs-pass-card"><span>Pasada</span><strong>0</strong></div>
      </div>
    `;
  }

  const info = buildObsTurnInfo(turn);

  return html`
    <div class="obs-now">
      <div class="obs-now-text">
        <span>Charro en turno</span>
        <strong>${escapeHTML(info.charro)}</strong>
        <em>${escapeHTML(info.team)}</em>
        <div class="obs-turn-meta">${info.meta.map((item) => html`<span>${escapeHTML(item)}</span>`).join("")}</div>
      </div>
      <div class="obs-pass-card">
        <span>Pasada</span>
        <strong>${moneylessNumber(calculateAttemptTotal(turn.attempt))}</strong>
      </div>
    </div>
  `;
}

function buildObsTurnInfo(turn) {
  const charroName = getObsTurnCharroName(turn) || "Sin registrar";
  const suerteName = turn.suerte?.fullName || turn.suerte?.name || "Suerte";
  const teamName = turn.team?.name || "Equipo en turno";
  const meta = [suerteName];

  if (isColeaderoTurn(turn)) meta.push(`Coleador ${Number(turn.coleadorIndex || 0) + 1}`);
  meta.push(getTurnAttemptLabel(turn));
  if (turn.attempt?.desc) meta.push("Descalificacion");

  return {
    charro: charroName,
    team: teamName,
    meta
  };
}

function getObsTurnCharroName(turn) {
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

  firebaseUnsubscribe = subscribeFirebaseLive((response) => {
    const payload = response?.payload || response;
    const nextPayload = normalizeRemotePayload(payload);
    const graphicsConfig = response?.graphicsConfig || payload?.graphicsConfig || nextPayload?.graphicsConfig;
    if (graphicsConfig) firebaseGraphicsConfig = normalizeGraphicsConfig(graphicsConfig);
    if (hasUsefulLivePayload(nextPayload)) {
      remotePayload = nextPayload;
      render();
    }
  }, liveChannel);
}

function fetchRemotePayload() {
  if (!remoteSyncUrl || remoteFetchPending) return;
  remoteFetchPending = true;

  requestJsonp(remoteSyncUrl)
    .then((payload) => {
      if (payload?.ok === false) return;
      const nextPayload = normalizeRemotePayload(payload?.payload || payload);
      remoteGraphicsConfig = normalizeGraphicsConfig(payload?.graphicsConfig || payload?.payload?.graphicsConfig || nextPayload?.graphicsConfig);
      if (hasUsefulLivePayload(nextPayload)) remotePayload = nextPayload;
    })
    .catch(() => {
      // OBS mantiene el ultimo estado recibido para evitar parpadeos.
    })
    .finally(() => {
      remoteFetchPending = false;
    });
}

function hasStoredLocalState() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function normalizeRemotePayload(payload) {
  if (!Array.isArray(payload)) return payload;

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
  if (Array.isArray(payload.leaderboard) && payload.leaderboard.some((item) => item?.team)) return true;
  if (Array.isArray(payload.detalles) && payload.detalles.length) return true;
  return hasTimerValue(payload.timer);
}

function requestJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `charroproLive_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
