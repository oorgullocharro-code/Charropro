import { escapeHTML, html, showToast } from "../core/dom.js?v=20260708-recovery-001b-panel-status1";
import { LIVE_TIMER_KEY, getScopedLocalStorageKey, loadState, saveState, state } from "../core/state.js?v=20260708-recovery-001b-panel-status1";
import {
  getLiveChannelFromUrl,
  publishFirebaseTimer,
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession,
  subscribeFirebaseLive
} from "../core/firebaseSync.js?v=20260708-recovery-001b-panel-status1";
import { getTimerScopeKey, getTimerView } from "../core/timerRules.js?v=20260708-recovery-001b-panel-status1";
import { ROLES, getRoleLabel, hasTournamentAccess, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260708-recovery-001b-panel-status1";

const root = document.getElementById("timer-control-root");
const liveChannel = getLiveChannelFromUrl();
const requestedCharreadaId = getRequestedCharreadaId();

let remotePayload = null;
let timer = {};
let lastPublishAt = 0;
let lastStatus = liveChannel ? "Esperando enlace vivo" : "Falta tournamentId en la URL";
let accessSession = {
  ready: false,
  user: null,
  role: ROLES.SIN_ACCESO,
  active: false
};

loadState();
timer = chooseFreshTimer(state.liveTimer, readStoredLiveTimer());
render();
subscribeFirebaseAuthSession((session) => {
  accessSession = {
    ...session,
    ready: true
  };
  render();
});
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
      persistTimerLocal({ silent: true });
    }
    lastStatus = "Conectado en vivo";
    refreshScreen();
  }, liveChannel);
} else {
  lastStatus = "Falta tournamentId en la URL";
}

window.setInterval(() => {
  updateDisplay();
}, 100);

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "toggle-timer") toggleTimer();
  if (action === "reset-timer") resetTimer();
  if (action === "timer-login-open") showTimerLogin();
  if (action === "timer-login-close") closeTimerLogin();
  if (action === "timer-login") signInTimerAccess();
  if (action === "timer-logout") signOutTimerAccess();
});

function render() {
  root.innerHTML = html`
    <main class="timer-control-page">
      <section class="timer-control-shell">
        <header class="timer-control-head">
          <div>
            <p>CharroPro</p>
            <h1>Control de cronometro</h1>
          </div>
          <div class="topbar-actions">
            ${renderAccessControls()}
            <a class="button" href="./index.html">Volver</a>
          </div>
        </header>

        <section class="timer-control-panel">
          <div class="timer-control-live">
            <span id="timer-control-status">${escapeHTML(lastStatus)}</span>
            <strong id="timer-control-context">${escapeHTML(getLiveContextText())}</strong>
          </div>

          <div class="timer-control-clock ${timer.running ? "running" : "paused"}" id="timer-control-clock">
            <span id="timer-control-state">${escapeHTML(getTimerView(timer, getTimerSource()).stateLabel)}</span>
            <strong id="timer-control-display">${escapeHTML(getTimerView(timer, getTimerSource()).formatted)}</strong>
          </div>

          <div class="timer-control-main-actions">
            <button class="button primary" data-action="toggle-timer" type="button" id="timer-control-toggle">
              ${timer.running ? "Pausar" : "Iniciar"}
            </button>
            <button class="button red" data-action="reset-timer" type="button">Reiniciar</button>
          </div>
        </section>
      </section>
    </main>
  `;
  updateDisplay();
}

function refreshScreen() {
  const status = document.getElementById("timer-control-status");
  const context = document.getElementById("timer-control-context");
  if (status) status.textContent = lastStatus;
  if (context) context.textContent = getLiveContextText();
  updateDisplay();
}

function renderAccessControls() {
  if (!accessSession.ready) return html`<span class="access-badge muted">Conectando acceso</span>`;
  if (!isActiveAccessSession(accessSession)) {
    return html`<button class="button small" data-action="timer-login-open" type="button">Entrar</button>`;
  }

  return html`
    <span class="access-badge green">${escapeHTML(getRoleLabel(accessSession.role))}</span>
    <button class="button small" data-action="timer-logout" type="button">Salir</button>
  `;
}

function canControlTimer() {
  return isActiveAccessSession(accessSession) && roleCan(accessSession.role, "timer") && canAccessLiveTournament();
}

function canAccessLiveTournament() {
  const tournamentId = remotePayload?.tournament?.id || liveChannel || "";
  return Boolean(tournamentId) && hasTournamentAccess(accessSession, tournamentId);
}

function requireTimerAccess() {
  if (!liveChannel) {
    showToast("Abre el cronometro con tournamentId.");
    return false;
  }
  if (canControlTimer()) return true;
  if (!isActiveAccessSession(accessSession)) showTimerLogin();
  else if (!canAccessLiveTournament()) showToast("Tu usuario no esta asignado a este torneo.");
  else showToast("Necesitas rol juez, operador o supervisor.");
  return false;
}

function showTimerLogin() {
  root.insertAdjacentHTML("beforeend", html`
    <div class="modal-root" id="timer-access-modal">
      <div class="modal">
        <div class="modal-head">
          <h2>Acceso a cronometro</h2>
          <button class="button small" data-action="timer-login-close" type="button">Cerrar</button>
        </div>
        <div class="modal-body">
          <form id="timer-access-form" class="form-grid">
            <div class="wide">
              <label>Correo</label>
              <input name="email" type="email" required autocomplete="username">
            </div>
            <div class="wide">
              <label>Contrasena</label>
              <input name="password" type="password" required autocomplete="current-password">
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button class="button primary" data-action="timer-login" type="button">Entrar</button>
        </div>
      </div>
    </div>
  `);
}

function closeTimerLogin() {
  document.getElementById("timer-access-modal")?.remove();
}

async function signInTimerAccess() {
  const form = document.getElementById("timer-access-form");
  if (!form?.reportValidity()) return;
  const data = new FormData(form);
  const result = await signInFirebaseUser(String(data.get("email") || "").trim(), String(data.get("password") || ""));
  if (!result.ok) {
    showToast(formatAuthError(result.reason));
    return;
  }

  accessSession = {
    ...result.session,
    ready: true
  };
  closeTimerLogin();
  showToast(`Acceso: ${getRoleLabel(accessSession.role)}.`);
  render();
}

async function signOutTimerAccess() {
  const result = await signOutFirebaseUser();
  showToast(result.ok ? "Sesion cerrada." : "No se pudo cerrar sesion.");
}

function toggleTimer() {
  if (!requireTimerAccess()) return;
  if (timer.running) {
    timer = {
      ...timer,
      running: false,
      startedAt: null,
      elapsedMs: getElapsedMs(timer),
      updatedAt: new Date().toISOString()
    };
  } else {
    timer = {
      ...timer,
      running: true,
      startedAt: Date.now(),
      elapsedMs: getElapsedMs(timer),
      updatedAt: new Date().toISOString()
    };
  }
  publishTimerState();
}

function resetTimer() {
  if (!requireTimerAccess()) return;
  timer = {
    running: false,
    startedAt: null,
    elapsedMs: 0,
    formatted: "00:00.0",
    updatedAt: new Date().toISOString()
  };
  publishTimerState();
}

async function publishTimerState(options = {}) {
  const notify = options.notify !== false;
  const view = getTimerView(timer, getTimerSource());
  const nextRevision = Number(timer.revision || state.liveTimer?.revision || 0) + 1;
  const updatedAtMs = Date.now();
  const snapshot = {
    ...timer,
    revision: nextRevision,
    tournamentId: liveChannel,
    charreadaId: getTimerCharreadaSource()?.id || requestedCharreadaId || "",
    teamId: remotePayload?.turn?.team?.id || "",
    suerteId: remotePayload?.turn?.suerte?.id || "",
    attemptId: [
      remotePayload?.turn?.team?.id || "",
      remotePayload?.turn?.suerte?.id || "",
      remotePayload?.turn?.attemptIndex ?? "",
      remotePayload?.turn?.coleadorIndex ?? ""
    ].filter((item) => item !== "").join("_"),
    running: Boolean(timer.running),
    startedAt: timer.running ? timer.startedAt || Date.now() : null,
    elapsedMs: Number(timer.elapsedMs || 0),
    elapsedLiveMs: view.elapsedMs,
    displayMs: view.displayMs,
    remainingMs: view.remainingMs,
    formatted: view.formatted,
    mode: view.rule.mode,
    limitMs: view.rule.limitMs,
    limitLabel: view.rule.label,
    stateLabel: view.stateLabel,
    expired: view.expired,
    scopeKey: getTimerScopeKey(getTimerSource()),
    updatedAtMs,
    clientId: getTimerClientId(),
    updatedAt: new Date().toISOString()
  };
  timer = snapshot;
  persistTimerLocal();
  updateDisplay();
  lastPublishAt = Date.now();

  const result = await publishFirebaseTimer(snapshot, liveChannel);
  if (result.ok) {
    lastStatus = "Enviado en vivo";
    if (notify) showToast("Cronometro actualizado.");
  } else {
    lastStatus = "Sin conexion Firebase";
    if (notify) showToast("No se pudo enviar el cronometro.");
  }
  refreshScreen();
}

function persistTimerLocal(options = {}) {
  state.liveTimer = {
    ...timer,
    running: Boolean(timer.running),
    startedAt: timer.running ? timer.startedAt || null : null,
    elapsedMs: Number(timer.elapsedMs || 0),
    revision: Number(timer.revision || 0),
    updatedAtMs: Number(timer.updatedAtMs || 0),
    clientId: timer.clientId || "",
    updatedAt: timer.updatedAt || new Date().toISOString()
  };
  writeStoredLiveTimer(state.liveTimer);
  saveState({ silent: options.silent === true });
}

function updateDisplay() {
  const view = getTimerView(timer, getTimerSource());
  const display = document.getElementById("timer-control-display");
  const stateLabel = document.getElementById("timer-control-state");
  const toggle = document.getElementById("timer-control-toggle");
  const clock = document.getElementById("timer-control-clock");
  if (display) display.textContent = view.formatted;
  if (stateLabel) stateLabel.textContent = view.stateLabel;
  if (toggle) toggle.textContent = timer.running ? "Pausar" : "Iniciar";
  if (clock) {
    clock.classList.toggle("running", Boolean(timer.running));
    clock.classList.toggle("paused", !timer.running);
    clock.classList.toggle("expired", Boolean(view.expired));
  }
}

function getLiveContextText() {
  const charreada = getTimerCharreadaSource();
  const charreadaName = charreada?.name || requestedCharreadaId || "Sin charreada activa";
  const team = remotePayload?.turn?.team?.name || "";
  const suerte = remotePayload?.turn?.suerte?.fullName || "";
  return [charreadaName, team, suerte].filter(Boolean).join(" / ");
}

function getTimerSource() {
  return {
    charreada: getTimerCharreadaSource(),
    turn: remotePayload?.turn || null
  };
}

function getTimerCharreadaSource() {
  return remotePayload?.charreada ||
    state.charreadas.find((item) => item.id === requestedCharreadaId) ||
    state.charreadas.find((item) => item.id === state.activeCharreadaId) ||
    (requestedCharreadaId ? { id: requestedCharreadaId, name: requestedCharreadaId, tournamentId: liveChannel } : null);
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
    // El estado principal tambien conserva el cronometro.
  }
}

function chooseFreshTimer(primary, secondary) {
  const first = normalizeTimer(primary);
  const second = normalizeTimer(secondary);
  if (!hasTimerValue(first)) return hasTimerValue(second) ? second : first;
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

function getTimerClientId() {
  try {
    const key = getScopedLocalStorageKey("timer_client_id", liveChannel);
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const id = `timer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return "timer_client";
  }
}

function getRequestedCharreadaId() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("charreada") || params.get("charreadaId") || "").trim();
}

function formatAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("auth/user-not-found")) return "Ese usuario no existe en Firebase.";
  if (reason.includes("auth/operation-not-allowed")) return "Activa Email/Password en Firebase Authentication.";
  if (reason.includes("permission_denied")) return "Firebase no permitio el acceso. Revisa el rol.";
  return "No se pudo iniciar sesion.";
}

function hasTimerValue(value = {}) {
  return Boolean(value.running || value.startedAt || Number(value.elapsedMs || 0) || value.updatedAt);
}

function getTimerFreshness(value = {}) {
  return Number(value.updatedAtMs || value.firebaseUpdatedAt || 0) || Date.parse(value.updatedAt || "") || Number(value.startedAt || 0) || 0;
}

function getElapsedMs(value = {}) {
  const base = Number(value.elapsedMs || 0);
  if (!value.running || !value.startedAt) return base;
  return base + Math.max(0, Date.now() - Number(value.startedAt));
}
