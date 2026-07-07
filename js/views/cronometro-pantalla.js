import { escapeHTML, html } from "../core/dom.js?v=20260707-core-infra-001-versioning1";
import { LIVE_TIMER_KEY, loadState, state } from "../core/state.js?v=20260707-core-infra-001-versioning1";
import { getLiveChannelFromUrl, subscribeFirebaseLive } from "../core/firebaseSync.js?v=20260707-core-infra-001-versioning1";
import { getTimerView } from "../core/timerRules.js?v=20260707-core-infra-001-versioning1";

const root = document.getElementById("timer-display-root");
const liveChannel = getLiveChannelFromUrl();

let remotePayload = null;
let timer = {};

loadState();
timer = chooseFreshTimer(state.liveTimer, readStoredLiveTimer());
render();

if (liveChannel) {
  subscribeFirebaseLive((payload) => {
    remotePayload = payload;
    const incoming = normalizeTimer({
      ...(payload?.timer || {}),
      firebaseUpdatedAt: payload?.firebaseUpdatedAt || 0,
      updatedAt: payload?.timer?.updatedAt || payload?.timestamp || null
    });
    if (hasTimerValue(incoming) && shouldAdoptTimer(incoming)) {
      timer = incoming;
      writeStoredLiveTimer(timer);
    }
    updateScreen();
  }, liveChannel);
}

window.setInterval(updateScreen, 100);

document.addEventListener("click", requestFullscreen);
document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") requestFullscreen();
});

function render() {
  if (!liveChannel) {
    root.innerHTML = html`
      <main class="timer-display-page">
        <section class="timer-display-panel paused">
          <span>CharroPro</span>
          <strong>Sin torneo</strong>
          <p>Agrega ?tournamentId=ID_DEL_TORNEO</p>
        </section>
      </main>
    `;
    return;
  }
  root.innerHTML = html`
    <main class="timer-display-page">
      <section class="timer-display-panel ${timer.running ? "running" : "paused"}" id="timer-display-panel">
        <span id="timer-display-state">${escapeHTML(getTimerView(timer, getTimerSource()).stateLabel)}</span>
        <strong id="timer-display-clock">${escapeHTML(getTimerView(timer, getTimerSource()).formatted)}</strong>
        <p id="timer-display-context">${escapeHTML(getLiveContextText())}</p>
      </section>
    </main>
  `;
  updateScreen();
}

function updateScreen() {
  const panel = document.getElementById("timer-display-panel");
  const stateLabel = document.getElementById("timer-display-state");
  const display = document.getElementById("timer-display-clock");
  const context = document.getElementById("timer-display-context");

  if (panel) {
    const view = getTimerView(timer, getTimerSource());
    panel.classList.toggle("running", Boolean(timer.running));
    panel.classList.toggle("paused", !timer.running);
    panel.classList.toggle("expired", Boolean(view.expired));
  }
  if (stateLabel) stateLabel.textContent = getTimerView(timer, getTimerSource()).stateLabel;
  if (display) display.textContent = getTimerView(timer, getTimerSource()).formatted;
  if (context) context.textContent = getLiveContextText();
}

function getLiveContextText() {
  const charreada = remotePayload?.charreada?.name || state.charreadas.find((item) => item.id === state.activeCharreadaId)?.name || "";
  const team = remotePayload?.turn?.team?.name || "";
  const suerte = remotePayload?.turn?.suerte?.fullName || "";
  return [charreada, team, suerte].filter(Boolean).join(" / ");
}

function requestFullscreen() {
  if (document.fullscreenElement) return;
  document.documentElement.requestFullscreen?.().catch(() => {});
}

function getTimerSource() {
  return {
    charreada: remotePayload?.charreada || null,
    turn: remotePayload?.turn || null
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

function writeStoredLiveTimer(value) {
  try {
    localStorage.setItem(LIVE_TIMER_KEY, JSON.stringify(value));
  } catch {
    // El cronometro visible sigue usando el estado recibido en memoria.
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

function shouldAdoptTimer(incoming) {
  const current = normalizeTimer(timer);
  const incomingRevision = Number(incoming.revision || 0);
  const currentRevision = Number(current.revision || 0);
  if (incomingRevision && currentRevision && incomingRevision !== currentRevision) {
    return incomingRevision > currentRevision;
  }
  const incomingFreshness = getTimerFreshness(incoming);
  const currentFreshness = getTimerFreshness(current);
  if (incomingFreshness < currentFreshness) return false;
  if (incomingFreshness > currentFreshness) return true;

  return (
    Boolean(incoming.running) !== Boolean(current.running) ||
    Number(incoming.startedAt || 0) !== Number(current.startedAt || 0) ||
    Number(incoming.elapsedMs || 0) !== Number(current.elapsedMs || 0)
  );
}

function normalizeTimer(value = {}) {
  if (!value || typeof value !== "object") return {};
  const startedAt = value.startedAt ?? value.startTime ?? value.start ?? value.started ?? null;
  const elapsedMs = value.elapsedMs ?? value.elapsed ?? value.elapsedMillis ?? value.ms ?? 0;
  return {
    ...value,
    running: Boolean(value.running ?? value.isRunning ?? value.active),
    startedAt: startedAt === "" ? null : startedAt,
    elapsedMs: Number(elapsedMs || 0),
    revision: Number(value.revision || 0),
    updatedAtMs: Number(value.updatedAtMs || value.firebaseUpdatedAt || 0),
    clientId: value.clientId || "",
    firebaseUpdatedAt: Number(value.firebaseUpdatedAt || 0),
    updatedAt: value.updatedAt || value.timestamp || null
  };
}

function hasTimerValue(value = {}) {
  return Boolean(value.running || value.startedAt || Number(value.elapsedMs || 0) || value.updatedAt);
}

function getTimerFreshness(value = {}) {
  return Number(value.updatedAtMs || value.firebaseUpdatedAt || 0) || Date.parse(value.updatedAt || "") || Number(value.startedAt || 0) || 0;
}
