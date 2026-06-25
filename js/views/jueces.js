import { escapeHTML, html, showToast } from "../core/dom.js?v=20260622-prepare-gate1";
import { loadState, state } from "../core/state.js?v=20260622-prepare-gate1";
import {
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession,
  subscribeFirebaseTournamentIndex,
  subscribeFirebaseTournamentState
} from "../core/firebaseSync.js?v=20260622-prepare-gate1";
import { ROLES, getRoleLabel, hasTournamentAccess, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260622-prepare-gate1";
import { getTournamentIdFromUrl } from "../core/tournamentContext.js?v=20260622-prepare-gate1";

const root = document.getElementById("jueces-root");
let accessSession = {
  ready: false,
  user: null,
  role: ROLES.SIN_ACCESO,
  active: false
};
let tournamentIndexUnsubscribe = null;
const tournamentStateUnsubscribers = new Map();
const remoteTournamentIndex = new Map();
const remoteTournamentStates = new Map();

loadState();
render();

subscribeFirebaseAuthSession((session) => {
  accessSession = {
    ...session,
    ready: true
  };
  wireJudgeTournamentSubscriptions();
  redirectWhenReady();
  render();
});

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  if (target.dataset.action === "judge-login") signInJudge();
  if (target.dataset.action === "judge-logout") signOutJudge();
  if (target.dataset.action === "open-judge-tournament") {
    window.location.href = buildJudgeHref(target.dataset.id, target.dataset.charreada);
  }
  if (target.dataset.action === "open-judge-timer") {
    window.location.href = buildJudgeTimerHref(target.dataset.id, target.dataset.charreada);
  }
});

function redirectWhenReady() {
  // El juez debe ver primero su previa de torneos/charreadas asignadas.
}

function render() {
  root.innerHTML = html`
    <main class="judge-page">
      <header class="judge-header">
        <div>
          <p>CharroPro</p>
          <h1>Jueces</h1>
        </div>
        <a class="button" href="./index.html">Volver</a>
      </header>
      ${renderAccessState()}
      ${renderGatewayBody()}
    </main>
  `;
}

function renderAccessState() {
  if (!accessSession.ready) return html`<div class="judge-access-state">Conectando acceso...</div>`;
  if (!isActiveAccessSession(accessSession)) return "";
  return html`
    <article class="judge-status-card judge-access-card">
      <div>
        <span>Acceso Firebase</span>
        <strong>${escapeHTML(accessSession.name || accessSession.email || "Usuario")}</strong>
        <p>${escapeHTML(getRoleLabel(accessSession.role))}</p>
      </div>
      <button class="button small" data-action="judge-logout" type="button">Salir</button>
    </article>
  `;
}

function renderGatewayBody() {
  if (!accessSession.ready) return "";
  if (!isActiveAccessSession(accessSession)) return renderLogin();
  if (!canUseJudgeGateway()) return renderNoJudgeRole();

  const requestedId = getTournamentIdFromUrl();
  if (requestedId && !hasTournamentAccess(accessSession, requestedId)) {
    return renderMessage("Torneo no asignado", "Tu usuario no tiene acceso a este torneo.");
  }

  const tournaments = requestedId
    ? getAssignedOperationalTournaments().filter((tournament) => tournament.id === requestedId)
    : getAssignedOperationalTournaments();

  if (requestedId && !tournaments.length) {
    return renderMessage("Torneo no asignado", "Tu usuario no tiene acceso a este torneo o el torneo ya no esta operativo.");
  }

  if (tournaments.length === 1) {
    return renderSingleTournamentAccess(tournaments[0]);
  }

  if (tournaments.length > 1) {
    return html`
      <section class="judge-shell narrow">
        <article class="card judge-register-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Selecciona un torneo</h2>
              <p class="card-subtitle">Elige si vas a calificar o controlar el cronometro externo.</p>
            </div>
          </div>
          <div class="card-body judge-tournament-list">
            ${tournaments.map(renderJudgeTournamentActions).join("")}
          </div>
        </article>
      </section>
    `;
  }

  return renderMessage("Torneo no asignado", "Pide a un supervisor que te agregue a un torneo activo o programado.");
}

function renderLogin() {
  return html`
    <section class="judge-shell narrow">
      <article class="card judge-register-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Acceso de juez</h2>
            <p class="card-subtitle">Entra con el correo autorizado en Firebase.</p>
          </div>
        </div>
        <form id="judge-access-form" class="card-body grid">
          <div>
            <label>Correo</label>
            <input name="email" type="email" required autocomplete="username" placeholder="juez@correo.com">
          </div>
          <div>
            <label>Contrasena</label>
            <input name="password" type="password" required autocomplete="current-password" placeholder="Contrasena">
          </div>
          <button class="button primary" data-action="judge-login" type="button">Entrar</button>
        </form>
      </article>
    </section>
  `;
}

function renderSingleTournamentAccess(tournament) {
  return html`
    <section class="judge-shell narrow">
      <article class="card judge-register-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${escapeHTML(tournament.name || tournament.id)}</h2>
            <p class="card-subtitle">Accesos disponibles para tu torneo asignado.</p>
          </div>
        </div>
        <div class="card-body judge-tournament-list">
          ${renderJudgeTournamentActions(tournament)}
        </div>
      </article>
    </section>
  `;
}

function renderJudgeTournamentActions(tournament) {
  const charreadas = getJudgeTournamentCharreadas(tournament.id);
  return html`
    <article class="judge-tournament-access-card">
      <div class="judge-tournament-card-head">
        <div>
          <span>Torneo asignado</span>
          <strong>${escapeHTML(tournament.name || tournament.id)}</strong>
          <p>${escapeHTML(formatTournamentStatus(tournament.status))} / ${charreadas.length} charreada${charreadas.length === 1 ? "" : "s"}</p>
        </div>
        <button class="button" data-action="open-judge-timer" data-id="${escapeHTML(tournament.id)}" type="button" ${roleCan(accessSession.role, "timer") ? "" : "disabled"}>
          Cronometro del torneo
        </button>
      </div>
      ${charreadas.length ? renderJudgeCharreadaGroups(tournament, charreadas) : renderJudgeNoCharreadas(tournament)}
    </article>
  `;
}

function renderJudgeCharreadaGroups(tournament, charreadas) {
  const groups = [
    ["en_vivo", "En vivo"],
    ["programada", "Programadas"],
    ["finalizada", "Finalizadas"]
  ];
  return groups
    .map(([status, title]) => {
      const items = charreadas.filter((charreada) => normalizeCharreadaStatus(charreada.status) === status);
      if (!items.length) return "";
      return html`
        <section class="judge-charreada-preview-group">
          <h3>${title}</h3>
          <div class="judge-charreada-preview-list">
            ${items.map((charreada) => renderJudgeCharreadaPreview(tournament, charreada)).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderJudgeCharreadaPreview(tournament, charreada) {
  const teamsCount = Array.isArray(charreada.teamIds) ? charreada.teamIds.length : 0;
  return html`
    <article class="judge-charreada-preview ${normalizeCharreadaStatus(charreada.status) === "en_vivo" ? "active" : ""}">
      <div>
        <span>${escapeHTML(formatCharreadaStatus(charreada.status))}</span>
        <strong>${escapeHTML(charreada.name || "Charreada")}</strong>
        <p>${escapeHTML(formatCharreadaDateTime(charreada))} / ${teamsCount} equipo${teamsCount === 1 ? "" : "s"}</p>
      </div>
      <div class="judge-tournament-actions">
        <button class="button primary" data-action="open-judge-tournament" data-id="${escapeHTML(tournament.id)}" data-charreada="${escapeHTML(charreada.id)}" type="button" ${roleCan(accessSession.role, "score") ? "" : "disabled"}>
          Calificar
        </button>
        <button class="button" data-action="open-judge-timer" data-id="${escapeHTML(tournament.id)}" data-charreada="${escapeHTML(charreada.id)}" type="button" ${roleCan(accessSession.role, "timer") ? "" : "disabled"}>
          Cronometro
        </button>
      </div>
    </article>
  `;
}

function renderJudgeNoCharreadas(tournament) {
  return html`
    <div class="judge-empty">
      <strong>Sin charreadas sincronizadas</strong>
      <p>Cuando el supervisor programe charreadas, apareceran aqui. Mientras tanto puedes abrir el cronometro del torneo.</p>
      <button class="button" data-action="open-judge-timer" data-id="${escapeHTML(tournament.id)}" type="button" ${roleCan(accessSession.role, "timer") ? "" : "disabled"}>
        Cronometro del torneo
      </button>
    </div>
  `;
}

function renderNoJudgeRole() {
  return renderMessage("Acceso no disponible", `Tu rol ${getRoleLabel(accessSession.role)} no tiene panel de juez.`);
}

function renderMessage(title, message) {
  return html`
    <section class="judge-shell narrow">
      <article class="card judge-register-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${escapeHTML(title)}</h2>
            <p class="card-subtitle">${escapeHTML(message)}</p>
          </div>
        </div>
      </article>
    </section>
  `;
}

function canUseJudgeGateway() {
  return isActiveAccessSession(accessSession) &&
    (roleCan(accessSession.role, "score") || roleCan(accessSession.role, "timer"));
}

function getAssignedOperationalTournaments() {
  const records = new Map();
  (state.tournaments || [])
    .filter((tournament) => hasTournamentAccess(accessSession, tournament.id))
    .forEach((tournament) => records.set(tournament.id, tournament));

  remoteTournamentIndex.forEach((tournament, tournamentId) => {
    if (!hasTournamentAccess(accessSession, tournamentId)) return;
    records.set(tournamentId, { ...(records.get(tournamentId) || {}), ...tournament, id: tournamentId });
  });

  remoteTournamentStates.forEach((remoteState, tournamentId) => {
    const tournament = remoteState?.tournament || null;
    if (!tournament || !hasTournamentAccess(accessSession, tournamentId)) return;
    records.set(tournamentId, { ...(records.get(tournamentId) || {}), ...tournament, id: tournamentId });
  });

  const ids = Array.isArray(accessSession.tournamentIds)
    ? accessSession.tournamentIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  ids.forEach((id) => {
    if (!records.has(id)) records.set(id, { id, name: id, status: "programada" });
  });

  return [...records.values()]
    .filter((tournament) => hasTournamentAccess(accessSession, tournament.id))
    .filter(isOperationalTournament)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.name || a.id).localeCompare(String(b.name || b.id), "es"));
}

function isOperationalTournament(tournament = {}) {
  return !["finalizado", "congelado"].includes(String(tournament.status || "preparacion"));
}

async function signInJudge() {
  const form = document.getElementById("judge-access-form");
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
  wireJudgeTournamentSubscriptions();
  redirectWhenReady();
  render();
}

async function signOutJudge() {
  const result = await signOutFirebaseUser();
  clearJudgeTournamentSubscriptions();
  remoteTournamentIndex.clear();
  remoteTournamentStates.clear();
  showToast(result.ok ? "Sesion cerrada." : "No se pudo cerrar sesion.");
}

function buildJudgeHref(tournamentId, charreadaId = "") {
  const params = new URLSearchParams({
    id: tournamentId,
    tournamentId,
    view: "scoring",
    mode: "judge"
  });
  if (charreadaId) params.set("charreada", charreadaId);
  return `./torneo.html?${params.toString()}`;
}

function buildJudgeTimerHref(tournamentId, charreadaId = "") {
  const params = new URLSearchParams({
    id: tournamentId,
    tournamentId,
    mode: "judge"
  });
  if (charreadaId) params.set("charreada", charreadaId);
  return `./cronometro.html?${params.toString()}`;
}

function wireJudgeTournamentSubscriptions() {
  clearJudgeTournamentSubscriptions();
  remoteTournamentIndex.clear();
  remoteTournamentStates.clear();
  if (!canUseJudgeGateway()) return;

  tournamentIndexUnsubscribe = subscribeFirebaseTournamentIndex((records = []) => {
    remoteTournamentIndex.clear();
    records.forEach((record) => {
      const tournamentId = record?.id || "";
      if (tournamentId) remoteTournamentIndex.set(tournamentId, record);
    });
    syncJudgeTournamentStateSubscriptions(getAssignedTournamentIds());
    render();
  }, accessSession);

  syncJudgeTournamentStateSubscriptions(getAssignedTournamentIds());
}

function clearJudgeTournamentSubscriptions() {
  tournamentIndexUnsubscribe?.();
  tournamentIndexUnsubscribe = null;
  tournamentStateUnsubscribers.forEach((unsubscribe) => unsubscribe?.());
  tournamentStateUnsubscribers.clear();
}

function syncJudgeTournamentStateSubscriptions(tournamentIds = []) {
  const ids = new Set(tournamentIds.filter(Boolean));
  tournamentStateUnsubscribers.forEach((unsubscribe, tournamentId) => {
    if (ids.has(tournamentId)) return;
    unsubscribe?.();
    tournamentStateUnsubscribers.delete(tournamentId);
    remoteTournamentStates.delete(tournamentId);
  });

  ids.forEach((tournamentId) => {
    if (tournamentStateUnsubscribers.has(tournamentId)) return;
    const unsubscribe = subscribeFirebaseTournamentState(tournamentId, (payload) => {
      remoteTournamentStates.set(tournamentId, payload?.state || {});
      render();
    });
    tournamentStateUnsubscribers.set(tournamentId, unsubscribe);
  });
}

function getAssignedTournamentIds() {
  const ids = new Set();
  (state.tournaments || []).forEach((tournament) => {
    if (tournament?.id && hasTournamentAccess(accessSession, tournament.id)) ids.add(tournament.id);
  });
  remoteTournamentIndex.forEach((record, tournamentId) => {
    if (hasTournamentAccess(accessSession, tournamentId)) ids.add(tournamentId);
  });
  if (Array.isArray(accessSession.tournamentIds)) {
    accessSession.tournamentIds.forEach((id) => {
      const tournamentId = String(id || "").trim();
      if (tournamentId) ids.add(tournamentId);
    });
  }
  return [...ids];
}

function getJudgeTournamentCharreadas(tournamentId) {
  const remoteState = remoteTournamentStates.get(tournamentId);
  const remoteCharreadas = Array.isArray(remoteState?.charreadas) ? remoteState.charreadas : [];
  const localCharreadas = (state.charreadas || []).filter((charreada) => charreada.tournamentId === tournamentId);
  const byId = new Map();
  localCharreadas.concat(remoteCharreadas).forEach((charreada) => {
    if (charreada?.id) byId.set(charreada.id, { ...byId.get(charreada.id), ...charreada });
  });
  return [...byId.values()]
    .filter((charreada) => !["congelada"].includes(String(charreada.status || "")))
    .sort(compareCharreadasForJudge);
}

function compareCharreadasForJudge(a, b) {
  const statusOrder = { en_vivo: 0, programada: 1, finalizada: 2 };
  const firstStatus = statusOrder[normalizeCharreadaStatus(a.status)] ?? 3;
  const secondStatus = statusOrder[normalizeCharreadaStatus(b.status)] ?? 3;
  if (firstStatus !== secondStatus) return firstStatus - secondStatus;
  return String(a.date || "").localeCompare(String(b.date || "")) ||
    String(a.startTime || "").localeCompare(String(b.startTime || "")) ||
    String(a.name || "").localeCompare(String(b.name || ""), "es");
}

function normalizeCharreadaStatus(status) {
  const value = String(status || "programada");
  if (value === "en_vivo" || value === "finalizada") return value;
  return "programada";
}

function formatCharreadaStatus(status) {
  if (status === "en_vivo") return "En vivo";
  if (status === "finalizada") return "Finalizada";
  return "Programada";
}

function formatCharreadaDateTime(charreada = {}) {
  const parts = [formatDateLabel(charreada.date), formatTimeLabel(charreada.startTime)].filter(Boolean);
  return parts.join(" / ") || "Sin fecha";
}

function formatDateLabel(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function formatTimeLabel(value) {
  if (!value) return "";
  const [hourRaw, minuteRaw] = String(value).split(":").map(Number);
  if (!Number.isFinite(hourRaw) || !Number.isFinite(minuteRaw)) return String(value);
  const suffix = hourRaw >= 12 ? "p.m." : "a.m.";
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minuteRaw).padStart(2, "0")} ${suffix}`;
}

function formatTournamentStatus(status) {
  if (status === "en_vivo") return "En vivo";
  if (status === "finalizado") return "Finalizado";
  if (status === "congelado") return "Congelado";
  return "Preparacion";
}

function formatAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("permission_denied")) return "Tu usuario no tiene permisos en Firebase.";
  return "No se pudo iniciar sesion.";
}
