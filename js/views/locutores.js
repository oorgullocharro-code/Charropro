import { getTournamentSuertes } from "../data/suertes.js?v=20260622-prepare-gate1";
import { escapeHTML, html, moneylessNumber, showToast } from "../core/dom.js?v=20260622-prepare-gate1";
import { buildLivePayload, getCharroName } from "../core/sync.js?v=20260622-prepare-gate1";
import {
  buildCharreadaLeaderboard,
  calculateAttemptTotal,
  getTeamCharreadaTotal,
  getTeamSuerteTotal
} from "../core/scoring.js?v=20260622-prepare-gate1";
import { getActiveCharreada, loadState, state, subscribeToLiveUpdates } from "../core/state.js?v=20260622-prepare-gate1";
import {
  getLiveChannelFromUrl,
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession,
  subscribeFirebaseLive
} from "../core/firebaseSync.js?v=20260622-prepare-gate1";
import { ROLES, getRoleLabel, hasTournamentAccess, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260622-prepare-gate1";

const root = document.getElementById("locutores-root");
const liveChannel = getLiveChannelFromUrl();
let remotePayload = null;
let firebaseUnsubscribe = null;
let accessSession = {
  ready: false,
  user: null,
  role: ROLES.SIN_ACCESO,
  active: false
};

loadState();
ensureFirebaseLive();
render();
subscribeFirebaseAuthSession((session) => {
  accessSession = {
    ...session,
    ready: true
  };
  render();
});
subscribeToLiveUpdates(() => {
  ensureFirebaseLive();
  render();
});
window.setInterval(() => {
  ensureFirebaseLive();
  render();
}, 1000);

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  event.preventDefault();

  if (target.dataset.action === "locutor-login") signInLocutorAccess();
  if (target.dataset.action === "locutor-logout") signOutLocutorAccess();
});

function render() {
  if (!liveChannel) {
    root.innerHTML = html`
      <main class="locutor-page">
        <div class="empty">
          <h1>CharroPro Locutores</h1>
          <p>Abre esta pantalla con tournamentId para escuchar un torneo.</p>
        </div>
      </main>
    `;
    return;
  }
  if (!canUseLocutorPage()) {
    root.innerHTML = renderLocutorLogin();
    return;
  }

  const payload = remotePayload || buildLivePayload({ includeOfficial: false });
  const charreada = payload.charreada || getActiveCharreada();
  const turn = payload.turn;

  if (!charreada || !turn) {
    root.innerHTML = html`
      <main class="locutor-page">
        <div class="empty">
          <h1>CharroPro Locutores</h1>
          <p>No hay una charreada activa todavia.</p>
        </div>
      </main>
    `;
    return;
  }

  const charro = turn.charro || getCharroName({
    team: turn.team,
    suerte: turn.suerte,
    coleadorIndex: turn.coleadorIndex
  });
  const attemptTotal = calculateAttemptTotal(turn.attempt);
  const teamTotal = getLocutorTeamTotal(payload, charreada, turn);
  const suerteTotal = remotePayload ? attemptTotal : getTeamSuerteTotal(charreada.id, turn.team.id, turn.suerte.id);
  const leaderboard = Array.isArray(payload.leaderboard) ? payload.leaderboard : buildCharreadaLeaderboard(charreada.id);
  const suertes = getTournamentSuertes(payload.tournament);

  root.innerHTML = html`
    <main class="locutor-page">
      <header class="topbar" style="position: static; margin-bottom: 16px;">
        <div>
          <h1>${escapeHTML(charreada.name)}</h1>
          <p>${escapeHTML(payload.tournament?.name || "")}</p>
        </div>
        <div class="topbar-actions">
          <span class="pill green">En vivo</span>
          <span class="access-badge green">${escapeHTML(getRoleLabel(accessSession.role))}</span>
          <button class="button small" data-action="locutor-logout" type="button">Salir</button>
        </div>
      </header>

      <section class="locutor-grid">
        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Turno actual</h2>
              <p class="card-subtitle">Informacion limpia para narracion.</p>
            </div>
          </div>
          <div class="card-body grid">
            <div>
              <p class="card-subtitle">Equipo</p>
              <h1 style="margin: 0; font-size: 42px;">${escapeHTML(turn.team.name)}</h1>
            </div>
            <div>
              <p class="card-subtitle">Charro</p>
              <h2 style="margin: 0; font-size: 28px;">${escapeHTML(charro)}</h2>
            </div>
            <div class="grid cols-3">
              <div class="stat"><span>Suerte</span><strong>${escapeHTML(turn.suerte.name)}</strong></div>
              <div class="stat"><span>Oportunidad</span><strong>${Number(turn.attemptIndex || 0) + 1}</strong></div>
              <div class="stat"><span>Coleador</span><strong>${turn.suerte.type === "coleadero" ? Number(turn.coleadorIndex || 0) + 1 : "-"}</strong></div>
            </div>
            <div class="grid cols-3">
              <div class="stat"><span>Pasada</span><strong>${moneylessNumber(attemptTotal)}</strong></div>
              <div class="stat"><span>Suerte</span><strong>${moneylessNumber(suerteTotal)}</strong></div>
              <div class="stat"><span>Total equipo</span><strong>${moneylessNumber(teamTotal)}</strong></div>
            </div>
            ${
              turn.attempt?.desc
                ? html`<div class="danger-state"><strong>Descalificacion</strong><p>${escapeHTML(turn.attempt.desc)}</p></div>`
                : ""
            }
          </div>
        </article>

        <aside class="grid">
          <article class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Clasificacion</h2>
                <p class="card-subtitle">Charreada activa.</p>
              </div>
            </div>
            <div class="card-body">${renderLeaderboard(leaderboard)}</div>
          </article>

          <article class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Avance por suerte</h2>
                <p class="card-subtitle">Equipo en turno.</p>
              </div>
            </div>
            <div class="card-body grid">
              ${suertes.map(
                (suerte) => {
                  const total = remotePayload
                    ? (suerte.id === turn.suerte?.id ? moneylessNumber(attemptTotal) : "-")
                    : moneylessNumber(getTeamSuerteTotal(charreada.id, turn.team.id, suerte.id));
                  return html`
                  <div class="pill ${suerte.id === turn.suerte.id ? "blue" : ""}">
                    ${escapeHTML(suerte.name)}: ${total}
                  </div>
                `;
                }
              ).join("")}
            </div>
          </article>
        </aside>
      </section>
    </main>
  `;
}

function canUseLocutorPage() {
  return isActiveAccessSession(accessSession) && roleCan(accessSession.role, "speaker") && canAccessLiveTournament();
}

function canAccessLiveTournament() {
  const tournamentId = remotePayload?.tournament?.id || liveChannel || "";
  return Boolean(tournamentId) && hasTournamentAccess(accessSession, tournamentId);
}

function renderLocutorLogin() {
  if (isActiveAccessSession(accessSession) && !canAccessLiveTournament()) {
    return html`
      <main class="locutor-page">
        <section class="judge-shell narrow">
          <article class="card judge-register-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Torneo no asignado</h2>
                <p class="card-subtitle">Tu usuario tiene rol ${escapeHTML(getRoleLabel(accessSession.role))}, pero no esta asignado a este torneo.</p>
              </div>
            </div>
            <div class="card-body grid">
              <p class="card-subtitle">Pide a un supervisor que te agregue en Usuarios.</p>
              <button class="button" data-action="locutor-logout" type="button">Cambiar usuario</button>
            </div>
          </article>
        </section>
      </main>
    `;
  }

  return html`
    <main class="locutor-page">
      <section class="judge-shell narrow">
        <article class="card judge-register-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Acceso locutores</h2>
              <p class="card-subtitle">${accessSession.ready ? "Entra con un usuario autorizado." : "Conectando con Firebase Auth..."}</p>
            </div>
          </div>
          <form id="locutor-access-form" class="card-body grid">
            <div>
              <label>Correo</label>
              <input name="email" type="email" required autocomplete="username">
            </div>
            <div>
              <label>Contrasena</label>
              <input name="password" type="password" required autocomplete="current-password">
            </div>
            <button class="button primary" data-action="locutor-login" type="button" ${accessSession.ready ? "" : "disabled"}>Entrar</button>
          </form>
        </article>
      </section>
    </main>
  `;
}

async function signInLocutorAccess() {
  const form = document.getElementById("locutor-access-form");
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
  showToast(`Acceso: ${getRoleLabel(accessSession.role)}.`);
  render();
}

async function signOutLocutorAccess() {
  const result = await signOutFirebaseUser();
  showToast(result.ok ? "Sesion cerrada." : "No se pudo cerrar sesion.");
}

function ensureFirebaseLive() {
  if (firebaseUnsubscribe) return;

  firebaseUnsubscribe = subscribeFirebaseLive((response) => {
    const payload = response?.payload || response;
    if (!hasUsefulLivePayload(payload)) return;
    remotePayload = payload;
    render();
  }, liveChannel);
}

function hasUsefulLivePayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.turn?.team) return true;
  if (Array.isArray(payload.leaderboard) && payload.leaderboard.some((item) => item?.team)) return true;
  return Boolean(payload.timer && (payload.timer.running || payload.timer.startedAt || Number(payload.timer.elapsedMs || 0)));
}

function getLocutorTeamTotal(payload, charreada, turn) {
  const remoteRow = (payload.leaderboard || []).find((item) => item?.team?.id === turn.team?.id);
  if (remoteRow) return Number(remoteRow.total || 0);
  return getTeamCharreadaTotal(charreada.id, turn.team.id);
}

function renderLeaderboard(rows) {
  return html`
    <div class="table-wrap">
      <table style="min-width: 420px;">
        <thead><tr><th>#</th><th>Equipo</th><th class="num">Pts</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row, index) => html`
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHTML(row.team.name)}</td>
                  <td class="num"><strong>${moneylessNumber(row.total)}</strong></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function formatAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("auth/user-not-found")) return "Ese usuario no existe en Firebase.";
  if (reason.includes("auth/operation-not-allowed")) return "Activa Email/Password en Firebase Authentication.";
  if (reason.includes("permission_denied")) return "Firebase no permitio el acceso. Revisa el rol.";
  return "No se pudo iniciar sesion.";
}
