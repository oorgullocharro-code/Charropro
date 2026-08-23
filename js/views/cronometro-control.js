import { escapeHTML, html, showToast } from "../core/dom.js?v=20260822-fmch-official-team-sheet-judge-review-001-v1";
import { getScopedLocalStorageKey } from "../core/state.js?v=20260822-fmch-official-team-sheet-judge-review-001-v1";
import {
  applyFirebaseOfficialTimerAuthority,
  getLiveChannelFromUrl,
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession,
  subscribeFirebaseLive,
  subscribeFirebaseOfficialTimers
} from "../core/firebaseSync.js?v=20260822-fmch-official-team-sheet-judge-review-001-v1";
import {
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext,
  getOfficialTimerContextView,
  getOfficialTimerControlView,
  normalizeOfficialTimerContext
} from "../core/timerRules.js?v=20260822-fmch-official-team-sheet-judge-review-001-v1";
import { ROLES, getRoleLabel, hasTournamentAccess, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260708-recovery-001b-panel-status1";

const root = document.getElementById("timer-control-root");
const liveChannel = getLiveChannelFromUrl();
const requestedCharreadaId = getRequestedCharreadaId();
const controllerId = getTimerClientId();
const controllerSessionId = getTimerControllerSessionId();
const pauseReasons = [
  "Limpieza de ruedo",
  "Recoger sombreros o equipo",
  "Indicacion de jueces",
  "Ganado",
  "Reposicion",
  "Otro motivo autorizado"
];

let remotePayload = null;
let officialRegistry = {};
let derivedDefinitions = [];
let selectedTimerId = readSelectedTimerId();
let officialTimersUnsubscribe = null;
let pendingAction = null;
let lastStatus = liveChannel ? "Esperando enlace vivo" : "Falta tournamentId en la URL";
let lastObservedAtMs = 0;
let accessSession = {
  ready: false,
  user: null,
  role: ROLES.SIN_ACCESO,
  active: false
};

render();
subscribeFirebaseAuthSession((session) => {
  accessSession = { ...session, ready: true };
  subscribeOfficialTimerAuthority();
  render();
});

if (liveChannel) {
  subscribeFirebaseLive((payload) => {
    remotePayload = payload;
    derivedDefinitions = buildOfficialTimerDefinitionsFromContext(payload || {});
    reconcileSelectedTimer();
    if (!payload?.timer && !derivedDefinitions.length) lastStatus = "Esperando contexto deportivo";
    else if (!pendingAction) lastStatus = "Conectado en vivo";
    render();
  }, liveChannel);
}

window.setInterval(updateDisplay, 100);

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "timer-primary") sendPrimaryTimerCommand();
  if (action === "finish-timer") finishSelectedTimer();
  if (action === "claim-timer-control") claimSelectedTimerControl();
  if (action === "set-pause-reason") updatePauseReason(target.dataset.reason);
  if (action === "select-official-timer") selectOfficialTimer(target.dataset.timerId);
  if (action === "timer-login-open") showTimerLogin();
  if (action === "timer-login-close") closeTimerLogin();
  if (action === "timer-login") signInTimerAccess();
  if (action === "timer-logout") signOutTimerAccess();
});

function subscribeOfficialTimerAuthority() {
  officialTimersUnsubscribe?.();
  officialTimersUnsubscribe = null;
  if (!liveChannel || !isActiveAccessSession(accessSession)) return;
  officialTimersUnsubscribe = subscribeFirebaseOfficialTimers(liveChannel, (snapshot) => {
    if (snapshot.error) {
      lastStatus = "Sin acceso a la autoridad temporal";
      refreshScreen();
      return;
    }
    officialRegistry = snapshot.registry || {};
    lastObservedAtMs = snapshot.observedAtMs || Date.now();
    reconcileSelectedTimer();
    if (!pendingAction) lastStatus = "Sincronizado con Timer Authority";
    render();
  });
}

function render() {
  const timers = getAvailableTimers();
  const timer = getSelectedTimer();
  const definition = getSelectedDefinition();
  const view = timer ? getOfficialTimerContextView(timer) : null;
  const control = timer ? getOfficialTimerControlView(timer, getRemoteController()) : null;
  const primaryCommand = view ? getPrimaryCommand(view.status) : "START";
  const primaryLabel = pendingAction
    ? pendingAction.label
    : getPrimaryLabel(view?.status);
  const primaryDisabled = Boolean(
    pendingAction ||
    !timer ||
    view?.finished ||
    control?.hasController && !control.isOwner
  );

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

        <section class="timer-control-panel ${view?.status?.toLowerCase() || "unavailable"}">
          <div class="timer-control-live">
            <span id="timer-control-status">${escapeHTML(lastStatus)}</span>
            <strong id="timer-control-context">${escapeHTML(definition?.label || getLiveContextText())}</strong>
          </div>

          ${timers.length > 1 ? renderTimerSelector(timers) : ""}

          ${timer ? html`
            <div class="timer-control-clock ${view.running ? "running" : view.paused ? "paused" : "ready"}" id="timer-control-clock">
              <span id="timer-control-state">${escapeHTML(getTimerStateLabel(view.status))}</span>
              <strong id="timer-control-display">${escapeHTML(view.formattedRemaining)}</strong>
              <em id="timer-control-owner">Control: ${escapeHTML(control.controllerLabel)}</em>
            </div>

            <div class="timer-control-primary-zone">
              <button
                class="timer-control-primary-button state-${escapeHTML(view.status.toLowerCase())}"
                data-action="timer-primary"
                data-command="${escapeHTML(primaryCommand)}"
                type="button"
                id="timer-control-toggle"
                ${primaryDisabled ? "disabled" : ""}
              >
                <span aria-hidden="true" class="timer-control-state-mark"></span>
                <strong>${escapeHTML(primaryLabel)}</strong>
                <small>${escapeHTML(view.status)}</small>
              </button>
            </div>

            ${control.hasController && !control.isOwner ? html`
              <section class="timer-control-observer" aria-live="polite">
                <strong>Modo observador</strong>
                <p>${escapeHTML(control.controllerLabel)} conserva el control de este tiempo.</p>
                ${control.leaseExpired
                  ? html`<button class="button" data-action="claim-timer-control" type="button">Tomar control remoto</button>`
                  : ""}
              </section>
            ` : ""}

            ${view.paused && control.isOwner ? renderPauseReasonControls(timer.pauseReason) : ""}

            <div class="timer-control-secondary-actions">
              ${view.status !== "FINISHED" && control.isOwner
                ? html`<button class="button" data-action="finish-timer" type="button" ${pendingAction ? "disabled" : ""}>Finalizar</button>`
                : ""}
              <span>${escapeHTML(getConnectionAge())}</span>
            </div>
          ` : html`
            <section class="timer-control-empty">
              <strong>Sin cronometro deportivo en este turno</strong>
              <p>Cala no agrega un timer. El control se habilitara al recibir un contexto temporal vigente.</p>
            </section>
          `}

          ${timers.length > 1 ? renderSecondaryTimers(timers) : ""}
        </section>
      </section>
    </main>
  `;
  updateDisplay();
}

function renderTimerSelector(timers) {
  return html`
    <nav class="timer-context-selector" aria-label="Seleccionar cronometro">
      ${timers.map(({ timer, definition }) => html`
        <button
          type="button"
          data-action="select-official-timer"
          data-timer-id="${escapeHTML(definition.timerId)}"
          class="${definition.timerId === selectedTimerId ? "active" : ""}"
        >${escapeHTML(definition.label || timer?.label || definition.contextType)}</button>
      `).join("")}
    </nav>
  `;
}

function renderSecondaryTimers(timers) {
  return html`
    <section class="timer-control-secondary-list" aria-label="Otros cronometros disponibles">
      ${timers.filter(({ definition }) => definition.timerId !== selectedTimerId).map(({ timer, definition }) => {
        const view = getOfficialTimerContextView(timer || createTimerFromDefinition(definition));
        return html`
          <button type="button" data-action="select-official-timer" data-timer-id="${escapeHTML(definition.timerId)}">
            <span>${escapeHTML(definition.label || timer?.label || "Cronometro")}</span>
            <strong>${escapeHTML(view.formattedRemaining)}</strong>
            <em>${escapeHTML(view.status)}</em>
          </button>
        `;
      }).join("")}
    </section>
  `;
}

function renderPauseReasonControls(activeReason) {
  return html`
    <section class="timer-pause-reasons">
      <span>Motivo de pausa</span>
      <div>
        ${pauseReasons.map((reason) => html`
          <button
            class="${activeReason === reason ? "active" : ""}"
            data-action="set-pause-reason"
            data-reason="${escapeHTML(reason)}"
            type="button"
          >${escapeHTML(reason)}</button>
        `).join("")}
      </div>
    </section>
  `;
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

async function sendPrimaryTimerCommand() {
  if (!requireTimerAccess() || pendingAction) return;
  const timer = getSelectedTimer();
  const definition = getSelectedDefinition();
  if (!timer || !definition) return;
  const control = getOfficialTimerControlView(timer, getRemoteController());
  if (control.hasController && !control.isOwner) {
    showToast(`${control.controllerLabel} conserva el control.`);
    return;
  }
  const type = getPrimaryCommand(timer.status);
  if (!type) return;
  await executeAuthorityRequest(definition, timer, {
    type,
    reason: type === "PAUSE" ? "Pausa autorizada" : "",
    source: "field_remote"
  }, getPendingLabel(type));
}

async function claimSelectedTimerControl() {
  if (!requireTimerAccess() || pendingAction) return;
  const timer = getSelectedTimer();
  const definition = getSelectedDefinition();
  if (!timer || !definition) return;
  const control = getOfficialTimerControlView(timer, getRemoteController());
  if (control.hasController && !control.leaseExpired) {
    showToast("El controlador actual sigue activo. El respaldo debe devolver el control.");
    return;
  }
  await executeAuthorityRequest(definition, timer, {
    operation: control.hasController ? "TAKEOVER_CONTROL" : "CLAIM_CONTROL",
    reason: control.hasController ? "Recuperacion explicita del control remoto" : "Control primario de campo",
    source: "field_remote"
  }, "TOMANDO CONTROL...");
}

async function updatePauseReason(reason) {
  if (!requireTimerAccess() || pendingAction || !reason) return;
  const timer = getSelectedTimer();
  const definition = getSelectedDefinition();
  if (!timer || !definition) return;
  await executeAuthorityRequest(definition, timer, {
    operation: "UPDATE_PAUSE_REASON",
    reason,
    source: "field_remote"
  }, "GUARDANDO MOTIVO...");
}

async function finishSelectedTimer() {
  if (!requireTimerAccess() || pendingAction) return;
  const timer = getSelectedTimer();
  const definition = getSelectedDefinition();
  if (!timer || !definition || timer.status === "FINISHED") return;
  if (!window.confirm("Finalizar este cronometro oficial? Esta accion no reinicia el tiempo.")) return;
  await executeAuthorityRequest(definition, timer, {
    type: "FINISH",
    source: "field_remote"
  }, "FINALIZANDO...");
}

async function executeAuthorityRequest(definition, timer, request, label) {
  const commandId = createCommandId();
  const issuedAtMs = Date.now();
  pendingAction = { commandId, label, issuedAtMs };
  lastStatus = label;
  render();
  const result = await applyFirebaseOfficialTimerAuthority(definition, {
    ...request,
    timerId: definition.timerId,
    commandId,
    expectedRevision: Number(timer.revision || 0),
    controller: getRemoteController(),
    actor: getRemoteActor(),
    issuedAt: new Date(issuedAtMs).toISOString()
  }, {
    actor: getRemoteActor()
  });
  if (result.ok) {
    officialRegistry[result.timer.timerId] = result.timer;
    const latencyMs = Math.max(0, Number(result.authorityAcceptedAtMs || Date.now()) - issuedAtMs);
    lastStatus = result.idempotent
      ? "Comando ya confirmado"
      : `Confirmado por Timer Authority · ${latencyMs} ms`;
    vibrateOnAck();
  } else {
    if (result.timer?.timerId) officialRegistry[result.timer.timerId] = result.timer;
    lastStatus = formatAuthorityError(result.reason);
    showToast(lastStatus);
  }
  pendingAction = null;
  render();
}

function getAvailableTimers() {
  const definitions = new Map();
  Object.values(officialRegistry).forEach((timer) => {
    if (requestedCharreadaId && timer.charreadaId && timer.charreadaId !== requestedCharreadaId) return;
    definitions.set(timer.timerId, { ...timer, timerId: timer.timerId });
  });
  derivedDefinitions.forEach((definition) => definitions.set(definition.timerId, {
    ...(definitions.get(definition.timerId) || {}),
    ...definition
  }));
  return [...definitions.values()]
    .map((definition) => ({
      definition,
      timer: officialRegistry[definition.timerId] || null
    }))
    .sort((left, right) => {
      const leftCurrent = derivedDefinitions.some((item) => item.timerId === left.definition.timerId) ? 0 : 1;
      const rightCurrent = derivedDefinitions.some((item) => item.timerId === right.definition.timerId) ? 0 : 1;
      return leftCurrent - rightCurrent || String(left.definition.label || "").localeCompare(String(right.definition.label || ""));
    });
}

function reconcileSelectedTimer() {
  const timers = getAvailableTimers();
  if (!timers.length) {
    selectedTimerId = "";
    return;
  }
  if (!timers.some(({ definition }) => definition.timerId === selectedTimerId)) {
    selectedTimerId = timers[0].definition.timerId;
    writeSelectedTimerId(selectedTimerId);
  }
}

function selectOfficialTimer(timerId) {
  if (!getAvailableTimers().some(({ definition }) => definition.timerId === timerId)) return;
  selectedTimerId = timerId;
  writeSelectedTimerId(timerId);
  render();
}

function getSelectedDefinition() {
  return getAvailableTimers().find(({ definition }) => definition.timerId === selectedTimerId)?.definition || null;
}

function getSelectedTimer() {
  const definition = getSelectedDefinition();
  if (!definition) return null;
  const registered = officialRegistry[definition.timerId];
  return registered
    ? normalizeOfficialTimerContext(registered, definition)
    : createTimerFromDefinition(definition);
}

function createTimerFromDefinition(definition) {
  return normalizeOfficialTimerContext(createOfficialTimerContext(definition), definition);
}

function updateDisplay() {
  const timer = getSelectedTimer();
  if (!timer) return;
  const view = getOfficialTimerContextView(timer);
  const display = document.getElementById("timer-control-display");
  const stateLabel = document.getElementById("timer-control-state");
  const clock = document.getElementById("timer-control-clock");
  if (display) display.textContent = view.formattedRemaining;
  if (stateLabel) stateLabel.textContent = getTimerStateLabel(view.status);
  if (clock) {
    clock.classList.toggle("running", view.running);
    clock.classList.toggle("paused", view.paused);
    clock.classList.toggle("expired", view.expired);
  }
}

function refreshScreen() {
  const status = document.getElementById("timer-control-status");
  const context = document.getElementById("timer-control-context");
  if (status) status.textContent = lastStatus;
  if (context) context.textContent = getSelectedDefinition()?.label || getLiveContextText();
  updateDisplay();
}

function getRemoteController() {
  return {
    controllerId,
    controllerUid: accessSession.uid || accessSession.user?.uid || "",
    controllerRole: accessSession.role || "juez",
    controllerSessionId,
    controllerType: "field_remote"
  };
}

function getRemoteActor() {
  return {
    id: accessSession.uid || accessSession.user?.uid || "",
    uid: accessSession.uid || accessSession.user?.uid || "",
    name: accessSession.name || accessSession.email || "Juez de campo",
    role: accessSession.role || "juez"
  };
}

function getPrimaryCommand(status) {
  if (status === "READY") return "START";
  if (status === "RUNNING") return "PAUSE";
  if (status === "PAUSED") return "RESUME";
  return "";
}

function getPrimaryLabel(status) {
  if (status === "RUNNING") return "PAUSA";
  if (status === "PAUSED") return "CONTINUAR";
  if (status === "FINISHED") return "FINALIZADO";
  return "START";
}

function getPendingLabel(type) {
  if (type === "PAUSE") return "PAUSANDO...";
  if (type === "RESUME") return "CONTINUANDO...";
  if (type === "FINISH") return "FINALIZANDO...";
  return "INICIANDO...";
}

function getTimerStateLabel(status) {
  if (status === "RUNNING") return "TIEMPO EN CURSO";
  if (status === "PAUSED") return "TIEMPO PAUSADO";
  if (status === "FINISHED") return "TIEMPO FINALIZADO";
  return "LISTO PARA INICIAR";
}

function getLiveContextText() {
  const charreadaName = remotePayload?.charreada?.name || requestedCharreadaId || "Sin charreada activa";
  const team = remotePayload?.turn?.team?.name || remotePayload?.turn?.participant?.name || "";
  const suerte = remotePayload?.turn?.suerte?.fullName || remotePayload?.turn?.suerte?.name || "";
  return [charreadaName, team, suerte].filter(Boolean).join(" / ");
}

function getConnectionAge() {
  if (!lastObservedAtMs) return "esperando lectura";
  const seconds = Math.max(0, Math.round((Date.now() - lastObservedAtMs) / 1000));
  return seconds < 2 ? "sincronizado" : `lectura hace ${seconds} s`;
}

function createCommandId() {
  return `timer-command:${controllerId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function vibrateOnAck() {
  try {
    navigator.vibrate?.(35);
  } catch {
    // Vibracion es una mejora progresiva; el ACK visual es suficiente.
  }
}

function readSelectedTimerId() {
  try {
    return sessionStorage.getItem(getScopedLocalStorageKey("official_timer_selected", liveChannel)) || "";
  } catch {
    return "";
  }
}

function writeSelectedTimerId(timerId) {
  try {
    sessionStorage.setItem(getScopedLocalStorageKey("official_timer_selected", liveChannel), timerId);
  } catch {
    // La seleccion en memoria sigue disponible.
  }
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
    return `timer_${Date.now().toString(36)}`;
  }
}

function getTimerControllerSessionId() {
  try {
    const key = getScopedLocalStorageKey("timer_controller_session_id", liveChannel);
    const saved = sessionStorage.getItem(key);
    if (saved) return saved;
    const id = `timer-session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return `timer-session_${Date.now().toString(36)}`;
  }
}

function getRequestedCharreadaId() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("charreada") || params.get("charreadaId") || "").trim();
}

function showTimerLogin() {
  if (document.getElementById("timer-access-modal")) return;
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
  accessSession = { ...result.session, ready: true };
  closeTimerLogin();
  showToast(`Acceso: ${getRoleLabel(accessSession.role)}.`);
  subscribeOfficialTimerAuthority();
  render();
}

async function signOutTimerAccess() {
  const result = await signOutFirebaseUser();
  showToast(result.ok ? "Sesion cerrada." : "No se pudo cerrar sesion.");
}

function formatAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("auth/user-not-found")) return "Ese usuario no existe en Firebase.";
  if (reason.includes("auth/operation-not-allowed")) return "Activa Email/Password en Firebase Authentication.";
  if (reason.includes("permission_denied")) return "Firebase no permitio el acceso. Revisa el rol.";
  return "No se pudo iniciar sesion.";
}

function formatAuthorityError(reason = "") {
  if (reason === "official-timer-revision-conflict") return "El estado cambio en otro dispositivo. Se conservo la revision oficial.";
  if (reason === "official-timer-controller-conflict") return "Otro controlador conserva la autoridad del cronometro.";
  if (reason === "permission-denied") return "Firebase rechazo el comando por permisos.";
  if (reason === "not-authenticated") return "La sesion ya no esta autenticada.";
  return "Timer Authority no acepto el comando.";
}
