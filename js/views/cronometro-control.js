import { escapeHTML, html, showToast } from "../core/dom.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { getScopedLocalStorageKey } from "../core/state.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  applyFirebaseOfficialTimerAuthority,
  getLiveChannelFromUrl,
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession,
  subscribeFirebaseLive,
  subscribeFirebaseOfficialTimers
} from "../core/firebaseSync.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext,
  formatTimerMs,
  getOfficialTimerContextView,
  getOfficialTimerControlView,
  normalizeOfficialTimerContext
} from "../core/timerRules.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  TORO_TO_TERNA_HANDOFF,
  buildOfficialCurrentTimerContext,
  buildToroToTernaReadyDefinition,
  partitionOfficialTimerHistory,
  resolveOfficialCurrentTimerContext
} from "../core/officialTimerOrchestration.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  deriveOfficialTimerLiveDisplay,
  officialTimerTicker
} from "../core/officialTimerLiveDisplay.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { ROLES, getRoleLabel, hasTournamentAccess, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

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
let currentTimerContext = null;
let selectedTimerId = "";
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
const liveTickerSubscription = officialTimerTicker.subscribe(updateDisplay);

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
    reconcileCurrentTimerContext();
    if (!payload?.timer && !derivedDefinitions.length) lastStatus = "Esperando contexto deportivo";
    else if (!pendingAction) lastStatus = "Conectado en vivo";
    render();
  }, liveChannel);
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "timer-primary") sendPrimaryTimerCommand();
  if (action === "timer-secondary") sendSecondaryTimerCommand();
  if (action === "claim-timer-control") claimSelectedTimerControl();
  if (action === "set-pause-reason") updatePauseReason(target.dataset.reason);
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
    reconcileCurrentTimerContext();
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
    !primaryCommand ||
    definition?.temporalPolicyStatus === "TEMPORAL_POLICY_UNAVAILABLE" ||
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

          ${definition ? renderOperatorContext(definition) : ""}

          ${timer ? html`
            <div class="timer-control-clock ${view.running ? "running" : view.paused ? "paused" : "ready"}" id="timer-control-clock">
              <span id="timer-control-state">${escapeHTML(getTimerStateLabel(view.status))}</span>
              <strong id="timer-control-display">${escapeHTML(deriveOfficialTimerLiveDisplay(timer).formatted)}</strong>
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

            ${getSecondaryCommand(view.status) && control.isOwner ? html`
              <button
                class="button timer-control-secondary-command"
                data-action="timer-secondary"
                data-command="${escapeHTML(getSecondaryCommand(view.status))}"
                type="button"
                ${pendingAction ? "disabled" : ""}
              >${escapeHTML(getSecondaryLabel(view.status))}</button>
            ` : ""}

            ${control.hasController && !control.isOwner ? html`
              <section class="timer-control-observer" aria-live="polite">
                <strong>Modo observador</strong>
                <p>${escapeHTML(control.controllerLabel)} conserva el control de este tiempo.</p>
                ${control.leaseExpired
                  ? html`<button class="button" data-action="claim-timer-control" type="button">Tomar control remoto</button>`
                  : ""}
              </section>
            ` : ""}

            ${definition.temporalPolicyStatus === "TEMPORAL_POLICY_UNAVAILABLE" ? html`
              <section class="timer-control-observer" aria-live="assertive">
                <strong>Politica temporal no disponible</strong>
                <p>${escapeHTML(definition.temporalPolicyCode || "La identidad temporal no coincide con el perfil certificado.")}</p>
              </section>
            ` : ""}

            ${view.paused && control.isOwner ? renderPauseReasonControls(timer.pauseReason) : ""}

            <div class="timer-control-secondary-actions">
              <span>${escapeHTML(getConnectionAge())}</span>
            </div>
          ` : html`
            <section class="timer-control-empty">
              <strong>Sin cronometro deportivo en este turno</strong>
              <p>El control se habilitara al recibir un contexto temporal vigente.</p>
            </section>
          `}

          ${timers.length > 1 ? renderTimerHistory(timers) : ""}
        </section>
      </section>
    </main>
  `;
  updateDisplay();
}

function renderOperatorContext(definition) {
  const context = buildOperatorContext(definition);
  return html`
    <section class="timer-operator-context" aria-label="Contexto del cronometro oficial">
      <div class="timer-operator-primary">
        <span>${escapeHTML(context.charreada)}</span>
        <strong>${escapeHTML(context.suerte)}</strong>
        <em>${escapeHTML(context.phase)}</em>
      </div>
      <dl>
        <div><dt>Equipo</dt><dd>${escapeHTML(context.team)}</dd></div>
        <div><dt>Competidor</dt><dd>${escapeHTML(context.participant)}</dd></div>
        ${context.horse ? html`<div><dt>Caballo</dt><dd>${escapeHTML(context.horse)}</dd></div>` : ""}
        <div><dt>Oportunidad</dt><dd>${escapeHTML(context.opportunity)}</dd></div>
        <div><dt>Regla temporal</dt><dd>${escapeHTML(context.rule)}</dd></div>
        <div><dt>Tiempo reglamentario</dt><dd>${escapeHTML(context.duration)}</dd></div>
      </dl>
    </section>
  `;
}

function renderTimerHistory(timers) {
  const history = partitionOfficialTimerHistory(currentTimerContext, officialRegistry).historical;
  if (!history.length) return "";
  return html`
    <details class="timer-control-history">
      <summary>Historial de cronometros (${history.length})</summary>
      <section class="timer-control-secondary-list" aria-label="Historial de cronometros">
      ${history.map((timer) => {
        const view = deriveOfficialTimerLiveDisplay(timer);
        return html`
          <article>
            <span>${escapeHTML(timer.label || timer.suerteLabel || "Cronometro")}</span>
            <strong>${escapeHTML(view.formatted)}</strong>
            <em>${escapeHTML(getTimerStateLabel(view.status))}</em>
          </article>
        `;
      }).join("")}
      </section>
    </details>
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
  const result = await executeAuthorityRequest(definition, timer, {
    type,
    source: "field_remote"
  }, getPendingLabel(type));
  if (result?.ok && type === "FINISH") await prepareTernaAfterToroFinish(result.timer || timer);
}

async function sendSecondaryTimerCommand() {
  if (!requireTimerAccess() || pendingAction) return;
  const timer = getSelectedTimer();
  const definition = getSelectedDefinition();
  if (!timer || !definition) return;
  const control = getOfficialTimerControlView(timer, getRemoteController());
  if (control.hasController && !control.isOwner) {
    showToast(`${control.controllerLabel} conserva el control.`);
    return;
  }
  const type = getSecondaryCommand(timer.status);
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
    promoteCurrentContext: true,
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
  reconcileCurrentTimerContext();
  render();
  return result;
}

async function prepareTernaAfterToroFinish(finishedTimer) {
  const definition = buildToroToTernaReadyDefinition(remotePayload || {}, finishedTimer);
  if (!definition) return;
  const existing = officialRegistry[definition.timerId] || createTimerFromDefinition(definition);
  const result = await executeAuthorityRequest(definition, existing, {
    operation: "CLAIM_CONTROL",
    promoteCurrentContext: true,
    currentContextTransition: TORO_TO_TERNA_HANDOFF,
    handoffFromTimerId: finishedTimer.timerId,
    reason: "Apretalamiento finalizado; Terna preparada en READY",
    source: "official-timer-orchestration"
  }, "PREPARANDO TERNA...");
  if (result?.ok) {
    currentTimerContext = buildOfficialCurrentTimerContext(result.timer, definition, {
      now: result.authorityAcceptedAtMs,
      transition: TORO_TO_TERNA_HANDOFF,
      handoffFromTimerId: finishedTimer.timerId
    });
    selectedTimerId = currentTimerContext.timerId;
    lastStatus = "Terna preparada · LISTO para inicio manual";
    render();
  }
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

function reconcileCurrentTimerContext() {
  const previousTimerId = currentTimerContext?.timerId || "";
  currentTimerContext = resolveOfficialCurrentTimerContext({
    source: remotePayload || {},
    definitions: derivedDefinitions,
    registry: officialRegistry,
    currentTimerContext: remotePayload?.currentTimerContext || currentTimerContext
  });
  selectedTimerId = currentTimerContext?.timerId || "";
  if (selectedTimerId && selectedTimerId !== previousTimerId) {
    lastStatus = "Nueva suerte preparada · lista para iniciar";
  }
}

function getSelectedDefinition() {
  return derivedDefinitions.find((definition) => definition.timerId === selectedTimerId)
    || (currentTimerContext?.timerId === selectedTimerId ? currentTimerContext : null)
    || null;
}

function getSelectedTimer() {
  const definition = getSelectedDefinition();
  if (!definition) return null;
  const registered = officialRegistry[definition.timerId] || (currentTimerContext?.timerId === definition.timerId ? currentTimerContext : null);
  return registered
      ? normalizeOfficialTimerContext({
        ...registered,
        wallStartedAt: registered.wallStartedAt || registered.startedAt || null,
        wallFinishedAt: registered.wallFinishedAt || registered.finishedAt || null,
        officialElapsedMs: registered.officialElapsedMs ?? registered.elapsedMs ?? 0,
        revision: registered.revision ?? registered.timerRevision ?? 0,
        label: definition.label || registered.label,
        suerteLabel: definition.suerteLabel || registered.suerteLabel,
        phaseId: definition.phaseId || registered.phaseId,
        phaseLabel: definition.phaseLabel || registered.phaseLabel,
        teamName: definition.teamName || registered.teamName,
        participantName: definition.participantName || registered.participantName,
        horseName: definition.horseName || registered.horseName,
        attemptIndex: definition.attemptIndex ?? registered.attemptIndex,
        opportunityIndex: definition.opportunityIndex ?? registered.opportunityIndex,
        coleadorIndex: definition.coleadorIndex ?? registered.coleadorIndex,
        timerRuleId: definition.timerRuleId || definition.timerDefinitionId || registered.timerRuleId,
        temporalFingerprint: definition.temporalFingerprint || definition.temporalPolicyFingerprint || registered.temporalFingerprint,
        temporalPolicyStatus: definition.temporalPolicyStatus || registered.temporalPolicyStatus,
        temporalPolicyCode: definition.temporalPolicyCode || registered.temporalPolicyCode
      }, definition)
    : createTimerFromDefinition(definition);
}

function createTimerFromDefinition(definition) {
  return normalizeOfficialTimerContext(createOfficialTimerContext(definition), definition);
}

function updateDisplay(now = Date.now()) {
  const timer = getSelectedTimer();
  if (!timer) {
    liveTickerSubscription.setActive(false);
    return;
  }
  const view = deriveOfficialTimerLiveDisplay(timer, now);
  const display = document.getElementById("timer-control-display");
  const stateLabel = document.getElementById("timer-control-state");
  const clock = document.getElementById("timer-control-clock");
  if (display) display.textContent = view.formatted;
  if (stateLabel) stateLabel.textContent = getTimerStateLabel(view.status);
  if (clock) {
    clock.classList.toggle("running", view.running);
    clock.classList.toggle("paused", view.paused);
    clock.classList.toggle("expired", view.expired);
  }
  liveTickerSubscription.setActive(view.running);
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
  if (status === "RUNNING") return "FINISH";
  return "";
}

function getPrimaryLabel(status) {
  if (status === "RUNNING") return "FINALIZAR";
  if (status === "PAUSED") return "PAUSADO";
  if (status === "FINISHED") return "FINALIZADO";
  return "INICIAR";
}

function getSecondaryCommand(status) {
  if (status === "RUNNING") return "PAUSE";
  if (status === "PAUSED") return "RESUME";
  return "";
}

function getSecondaryLabel(status) {
  if (status === "RUNNING") return "PAUSAR";
  if (status === "PAUSED") return "REANUDAR";
  return "";
}

function getPendingLabel(type) {
  if (type === "PAUSE") return "PAUSANDO...";
  if (type === "RESUME") return "CONTINUANDO...";
  if (type === "FINISH") return "FINALIZANDO...";
  return "INICIANDO...";
}

function getTimerStateLabel(status) {
  if (status === "RUNNING") return "CORRIENDO";
  if (status === "PAUSED") return "PAUSADO";
  if (status === "FINISHED") return "FINALIZADO";
  return "LISTO";
}

function getLiveContextText() {
  const charreadaName = remotePayload?.charreada?.name || requestedCharreadaId || "Sin charreada activa";
  const team = remotePayload?.turn?.team?.name || remotePayload?.turn?.participant?.name || "";
  const suerte = remotePayload?.turn?.suerte?.fullName || remotePayload?.turn?.suerte?.name || "";
  return [charreadaName, team, suerte].filter(Boolean).join(" / ");
}

function buildOperatorContext(definition = {}) {
  const charreada = remotePayload?.charreada?.name || requestedCharreadaId || "Sin charreada activa";
  const suerte = definition.suerteLabel
    || remotePayload?.turn?.suerte?.fullName
    || remotePayload?.turn?.suerte?.name
    || definition.suerteId
    || "Sin suerte";
  const phase = definition.phaseLabel || definition.label || "Tiempo oficial";
  const team = definition.teamName || remotePayload?.turn?.team?.name || "Sin equipo";
  const participant = definition.participantName
    || remotePayload?.turn?.participant?.name
    || remotePayload?.turn?.team?.participantName
    || "Sin competidor";
  const horse = definition.horseName
    || remotePayload?.turn?.participant?.horseName
    || remotePayload?.turn?.team?.horseName
    || "";
  const opportunityNumber = Number(definition.opportunityIndex || 0) + 1;
  const opportunity = definition.suerteId === "terna"
    ? "Ventana compartida"
    : `Oportunidad ${opportunityNumber}`;
  const rule = definition.temporalPolicyStatus === "ACTIVE"
    ? `${definition.timerRuleId} · ${definition.temporalPolicyVersion}`
    : definition.temporalRuleSource === "legacy_compatibility"
      ? "Compatibilidad legacy explicita"
      : "No disponible";
  return {
    charreada,
    suerte,
    phase,
    team,
    participant,
    horse,
    opportunity,
    rule,
    duration: definition.durationMs ? formatTimerMs(definition.durationMs) : "Sin duracion certificada"
  };
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
