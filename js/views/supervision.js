import { escapeHTML, html, moneylessNumber, showToast } from "../core/dom.js?v=20260622-prepare-gate1";
import { loadState, state } from "../core/state.js?v=20260622-prepare-gate1";
import {
  signInAuditUser,
  signOutAuditUser,
  subscribeAuditAuth,
  subscribeFirebaseAuditScores
} from "../core/firebaseSync.js?v=20260622-prepare-gate1";
import { getRoleLabel, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260622-prepare-gate1";

const root = document.getElementById("supervision-root");

let authReady = false;
let auditUser = null;
let auditSession = null;
let selectedTournamentId = "";
let remoteRecords = [];
let recordsUnsubscribe = null;
let lastStatus = "Esperando acceso";

loadState();
selectedTournamentId = state.activeTournamentId || "";

subscribeAuditAuth((user, session) => {
  authReady = true;
  auditUser = user;
  auditSession = session || null;
  if (auditUser && isActiveAccessSession(auditSession) && roleCan(auditSession.role, "audit")) {
    lastStatus = "Sesion activa";
    subscribeAuditRecords();
  } else {
    lastStatus = auditUser ? "Usuario sin rol activo" : "Inicia sesion para ver auditoria";
    remoteRecords = [];
    if (recordsUnsubscribe) recordsUnsubscribe();
    recordsUnsubscribe = null;
  }
  render();
});

root.addEventListener("submit", (event) => {
  const form = event.target.closest("#audit-login-form");
  if (!form) return;
  event.preventDefault();
  signInFromForm(form);
});

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  if (target.dataset.action === "audit-logout") logout();
});

root.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.action !== "audit-select-tournament") return;

  selectedTournamentId = target.value || "";
  subscribeAuditRecords();
  render();
});

function render() {
  root.innerHTML = html`
    <main class="judge-page supervision-page">
      <header class="judge-header">
        <div>
          <p>CharroPro</p>
          <h1>Supervision</h1>
        </div>
        <a class="button" href="./index.html">Volver</a>
      </header>
      ${canUseAudit() ? renderAuditDashboard() : renderLogin()}
    </main>
  `;
}

function canUseAudit() {
  return Boolean(auditUser && isActiveAccessSession(auditSession) && roleCan(auditSession.role, "audit"));
}

function renderLogin() {
  return html`
    <section class="judge-shell narrow">
      <article class="card judge-register-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Acceso privado</h2>
            <p class="card-subtitle">${authReady ? "Usa un correo con rol supervisor, operador u organizador." : "Conectando con Firebase Auth..."}</p>
          </div>
        </div>
        <form id="audit-login-form" class="card-body grid">
          <div>
            <label>Correo</label>
            <input name="email" type="email" required autocomplete="username" placeholder="supervisor@correo.com">
          </div>
          <div>
            <label>Contrasena</label>
            <input name="password" type="password" required autocomplete="current-password" placeholder="Contrasena">
          </div>
          <button class="button primary" type="submit" ${authReady ? "" : "disabled"}>Entrar a supervision</button>
          <p class="card-subtitle">Esta pagina es para revisar publicaciones, correcciones y reemplazos. No se usa como fuente para OBS.</p>
        </form>
      </article>
    </section>
  `;
}

function renderAuditDashboard() {
  const records = getVisibleAuditRecords();
  const stats = getAuditStats(records);
  const tournaments = state.tournaments || [];

  return html`
    <section class="judge-shell">
      <article class="judge-status-card supervision-status-card">
        <div>
          <span>Supervisor</span>
          <strong>${escapeHTML(auditSession?.name || auditUser.email || "Sesion activa")}</strong>
          <p>${escapeHTML(lastStatus)} / ${escapeHTML(getRoleLabel(auditSession?.role))}</p>
        </div>
        <button class="button small" data-action="audit-logout" type="button">Salir</button>
      </article>

      <section class="stat-row supervision-stats">
        <div class="stat"><span>Publicaciones</span><strong>${stats.total}</strong></div>
        <div class="stat"><span>Activas</span><strong>${stats.active}</strong></div>
        <div class="stat"><span>Correcciones</span><strong>${stats.corrections}</strong></div>
        <div class="stat"><span>Reemplazadas</span><strong>${stats.superseded}</strong></div>
      </section>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Auditoria de publicaciones</h2>
            <p class="card-subtitle">Registro privado de pasadas publicadas y correcciones del torneo.</p>
          </div>
          <div class="audit-filter">
            <label>Torneo</label>
            <select data-action="audit-select-tournament">
              <option value="" ${selectedTournamentId ? "" : "selected"}>Todos los torneos</option>
              ${tournaments.map((tournament) => html`
                <option value="${escapeHTML(tournament.id)}" ${tournament.id === selectedTournamentId ? "selected" : ""}>
                  ${escapeHTML(tournament.name)}
                </option>
              `).join("")}
            </select>
          </div>
        </div>
        <div class="card-body">
          ${records.length ? renderAuditTable(records) : html`<div class="empty">Aun no hay publicaciones registradas para revisar.</div>`}
        </div>
      </article>
    </section>
  `;
}

async function signInFromForm(form) {
  const data = new FormData(form);
  const result = await signInAuditUser(String(data.get("email") || "").trim(), String(data.get("password") || ""));
  if (!result.ok) {
    showToast(formatAuthError(result.reason));
    return;
  }

  form.reset();
  showToast("Acceso autorizado.");
}

async function logout() {
  const result = await signOutAuditUser();
  showToast(result.ok ? "Sesion cerrada." : "No se pudo cerrar la sesion.");
}

function subscribeAuditRecords() {
  if (!auditUser) return;
  if (recordsUnsubscribe) recordsUnsubscribe();

  lastStatus = "Leyendo auditoria";
  recordsUnsubscribe = subscribeFirebaseAuditScores(selectedTournamentId, (records) => {
    remoteRecords = records;
    lastStatus = records.length ? "Auditoria conectada" : "Auditoria sin registros remotos";
    render();
  });
}

function getVisibleAuditRecords() {
  const localRecords = getLocalAuditRecords();
  const byId = new Map();

  localRecords.forEach((record) => byId.set(record.id, { ...record, source: "Local" }));
  remoteRecords.forEach((record) => byId.set(record.id, { ...record, source: "Firebase" }));

  return [...byId.values()]
    .filter((record) => !selectedTournamentId || record.tournament?.id === selectedTournamentId)
    .sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""));
}

function getLocalAuditRecords() {
  return (state.publishedScores || []).filter((record) => !selectedTournamentId || record.tournament?.id === selectedTournamentId);
}

function getAuditStats(records) {
  return {
    total: records.length,
    active: records.filter((record) => !record.superseded).length,
    corrections: records.filter((record) => record.correction).length,
    superseded: records.filter((record) => record.superseded).length
  };
}

function renderAuditTable(records) {
  return html`
    <div class="table-wrap">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Torneo</th>
            <th>Charreada</th>
            <th>Equipo / participante</th>
            <th>Charro</th>
            <th>Suerte</th>
            <th class="num">Oport.</th>
            <th class="num">Total</th>
            <th>Publicado por</th>
            <th>Estado</th>
            <th>Fuente</th>
          </tr>
        </thead>
        <tbody>
          ${records.map((record) => html`
            <tr class="${record.superseded ? "muted-row" : ""}">
              <td>${escapeHTML(formatPublishedAt(record.publishedAt))}</td>
              <td>${escapeHTML(record.tournament?.name || "")}</td>
              <td>${escapeHTML(record.charreada?.name || "")}</td>
              <td><strong>${escapeHTML(getEntryDisplayName(record.team || {}))}</strong></td>
              <td>${escapeHTML(record.charro || "Sin registrar")}</td>
              <td>${escapeHTML(record.suerte?.fullName || record.suerte?.name || "")}</td>
              <td class="num">${Number(record.attemptIndex || 0) + 1}</td>
              <td class="num"><strong>${moneylessNumber(record.total)}</strong></td>
              <td>${escapeHTML(formatPublishedBy(record.publishedBy))}</td>
              <td>${renderPublishedStatus(record)}</td>
              <td><span class="pill">${escapeHTML(record.source || "Local")}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getEntryDisplayName(team = {}) {
  const participantName = String(team.participantName || "").trim();
  const horseName = String(team.horseName || "").trim();
  if (participantName || horseName) return [participantName, horseName].filter(Boolean).join(" / ");
  return team?.name || "";
}

function formatPublishedBy(publishedBy = {}) {
  return [publishedBy.name, publishedBy.role].filter(Boolean).join(" / ") || "App maestra";
}

function renderPublishedStatus(record) {
  if (record.superseded) return html`<span class="pill amber">Reemplazada</span>`;
  if (record.correction) return html`<span class="pill blue">Correccion ${Number(record.revision || 1)}</span>`;
  return html`<span class="pill green">Publicada</span>`;
}

function formatPublishedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("auth/user-not-found")) return "Ese usuario no existe en Firebase.";
  if (reason.includes("auth/operation-not-allowed")) return "Activa Email/Password en Firebase Authentication.";
  if (reason.includes("permission_denied")) return "Firebase no permitio leer auditoria. Revisa las reglas.";
  return "No se pudo iniciar sesion.";
}
