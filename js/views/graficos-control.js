import { escapeHTML, html, showToast } from "../core/dom.js?v=20260622-prepare-gate1";
import {
  DEFAULT_GRAPHICS_CONFIG,
  applyGraphicsConfig,
  normalizeGraphicsConfig,
  readLocalGraphicsConfig,
  writeLocalGraphicsConfig
} from "../core/graphicsConfig.js?v=20260622-prepare-gate1";
import { loadState, saveState, state } from "../core/state.js?v=20260622-prepare-gate1";
import {
  getLiveChannelFromUrl,
  publishFirebaseGraphicsConfig,
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession
} from "../core/firebaseSync.js?v=20260622-prepare-gate1";
import { ROLES, getRoleLabel, hasTournamentAccess, isActiveAccessSession, roleCan } from "../core/roles.js?v=20260622-prepare-gate1";

const root = document.getElementById("graphics-control-root");
let liveChannel = "";
let accessSession = {
  ready: false,
  user: null,
  role: ROLES.SIN_ACCESO,
  active: false
};

loadState();
liveChannel = getLiveChannelFromUrl(state.activeTournamentId || "");
render();
wireEvents();

subscribeFirebaseAuthSession((session) => {
  accessSession = {
    ...session,
    ready: true
  };
  render();
});

function render() {
  const config = normalizeGraphicsConfig(state.settings?.graphicsConfig || readLocalGraphicsConfig());
  applyGraphicsConfig(config);

  root.innerHTML = html`
    <main class="graphics-control">
      <header class="graphics-control-header">
        <div>
          <p>CharroPro</p>
          <h1>Control de graficos</h1>
        </div>
        <div class="topbar-actions">
          ${renderAccessControls()}
          <a class="button" href="./index.html">Volver</a>
        </div>
      </header>

      <section class="graphics-control-grid">
        <form id="graphics-form" class="card graphics-form">
          <div class="card-header">
            <div>
              <h2 class="card-title">Diseno base</h2>
              <p class="card-subtitle">Estos valores alimentan marcador, cronometro, turno, ranking, coleadero y categoria.</p>
            </div>
          </div>
          <div class="card-body graphics-fields">
            <div class="firebase-status">
              <strong>Firebase en vivo</strong>
              <span>${liveChannel ? `Los graficos toman datos y diseno directo de charropro/live/${liveChannel}.` : "Falta tournamentId en la URL."}</span>
            </div>
            <label>Logo
              <input name="logoImage" value="${escapeHTML(config.logoImage)}">
            </label>
            <label>Barra marcador
              <input name="barImage" value="${escapeHTML(config.barImage)}">
            </label>
            <label>Color acento
              <input type="color" name="accentColor" value="${escapeHTML(config.accentColor)}">
            </label>
            <label>Texto principal
              <input type="color" name="textColor" value="${escapeHTML(config.textColor)}">
            </label>
            <label>Puntos
              <input type="color" name="scoreColor" value="${escapeHTML(config.scoreColor)}">
            </label>
            <label>Brillo
              <input type="color" name="glowColor" value="${rgbaToHex(config.glowColor, "#ffdd74")}">
            </label>
            <label>Escala marcador
              <input type="range" name="scoreboardScale" min="0.2" max="2" step="0.05" value="${config.scoreboardScale}">
              <span>${config.scoreboardScale.toFixed(2)}x</span>
            </label>
            <label>Escala cronometro
              <input type="range" name="timerScale" min="0.2" max="2" step="0.05" value="${config.timerScale}">
              <span>${config.timerScale.toFixed(2)}x</span>
            </label>
            <label>Escala turno
              <input type="range" name="turnScale" min="0.2" max="2" step="0.05" value="${config.turnScale}">
              <span>${config.turnScale.toFixed(2)}x</span>
            </label>
            <label>Equipos visibles
              <input type="number" name="maxTeams" min="1" max="8" value="${config.maxTeams}">
            </label>
            <label class="checkbox-row">
              <input type="checkbox" name="showLogo" ${config.showLogo ? "checked" : ""}>
              Mostrar logo
            </label>
          </div>
          <div class="card-body topbar-actions">
            <button class="button primary" data-action="save-graphics" type="button">Guardar diseno</button>
            <button class="button green" data-action="send-graphics" type="button">Enviar a pantallas</button>
            <button class="button" data-action="reset-graphics" type="button">Restaurar</button>
          </div>
        </form>

        <aside class="graphics-preview card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Vista rapida</h2>
              <p class="card-subtitle">Marcador separado para OBS.</p>
            </div>
          </div>
          <div class="card-body">
            ${renderPreview(config)}
          </div>
        </aside>
      </section>

      <section class="card graphics-links">
        <div class="card-header">
          <div>
            <h2 class="card-title">Fuentes separadas</h2>
            <p class="card-subtitle">Copia estas URLs como fuentes de navegador.</p>
          </div>
        </div>
        <div class="card-body grid">
          ${renderLinks()}
        </div>
      </section>
    </main>
  `;
}

function renderPreview(config) {
  return html`
    <div class="graphic-stage preview-stage">
      <section class="graphic-scoreboard graphic-widget">
        ${config.showLogo ? html`<div class="graphic-logo" aria-hidden="true"></div>` : ""}
        <div class="graphic-team-stack">
          <div class="graphic-team-row active">
            <div class="graphic-team-name">Rancho ejemplo</div>
            <div class="graphic-team-score">48</div>
          </div>
          <div class="graphic-team-row">
            <div class="graphic-team-name">Tres potrillos</div>
            <div class="graphic-team-score">12</div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderLinks() {
  return [
    ["Marcador", "grafico-marcador.html"],
    ["Cronometro", "grafico-cronometro.html"],
    ["Turno", "grafico-turno.html"],
    ["Ranking", "grafico-ranking.html"],
    ["Coleadero", "grafico-coleadero.html"],
    ["Categoria", "grafico-categoria.html"],
    ["OBS completo", "obs.html"]
  ].map(([label, fileName]) => {
    const url = buildGraphicUrl(fileName);
    return html`
      <label class="obs-url-field">
        ${escapeHTML(label)}
        <div class="copy-row">
          <input id="link-${fileName}" readonly value="${escapeHTML(url)}" onclick="this.select()">
          <button class="button small" data-action="copy-link" data-target="link-${fileName}" type="button">Copiar</button>
        </div>
      </label>
    `;
  }).join("");
}

function renderAccessControls() {
  if (!accessSession.ready) return html`<span class="access-badge muted">Conectando acceso</span>`;
  if (!isActiveAccessSession(accessSession)) {
    return html`<button class="button small" data-action="graphics-login-open" type="button">Entrar</button>`;
  }

  return html`
    <span class="access-badge green">${escapeHTML(getRoleLabel(accessSession.role))}</span>
    <button class="button small" data-action="graphics-logout" type="button">Salir</button>
  `;
}

function canManageGraphics() {
  return isActiveAccessSession(accessSession) &&
    (roleCan(accessSession.role, "graphics") || roleCan(accessSession.role, "settings")) &&
    Boolean(liveChannel) &&
    hasTournamentAccess(accessSession, liveChannel);
}

function showGraphicsLogin() {
  root.insertAdjacentHTML("beforeend", html`
    <div class="modal-root" id="graphics-access-modal">
      <div class="modal">
        <div class="modal-head">
          <h2>Acceso a graficos</h2>
          <button class="button small" data-action="graphics-login-close" type="button">Cerrar</button>
        </div>
        <div class="modal-body">
          <form id="graphics-access-form" class="form-grid">
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
          <button class="button primary" data-action="graphics-login" type="button">Entrar</button>
        </div>
      </div>
    </div>
  `);
}

function closeGraphicsLogin() {
  document.getElementById("graphics-access-modal")?.remove();
}

async function signInGraphicsAccess() {
  const form = document.getElementById("graphics-access-form");
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
  closeGraphicsLogin();
  showToast(`Acceso: ${getRoleLabel(accessSession.role)}.`);
  render();
}

async function signOutGraphicsAccess() {
  const result = await signOutFirebaseUser();
  showToast(result.ok ? "Sesion cerrada." : "No se pudo cerrar sesion.");
}

function requireGraphicsAccess() {
  if (canManageGraphics()) return true;
  if (!isActiveAccessSession(accessSession)) showGraphicsLogin();
  else if (!hasTournamentAccess(accessSession, liveChannel === "current" ? state.activeTournamentId : liveChannel)) {
    showToast("Tu usuario no esta asignado a este torneo.");
  } else {
    showToast("Necesitas rol operador o supervisor.");
  }
  return false;
}

function wireEvents() {
  document.addEventListener("input", (event) => {
    if (!event.target.closest("#graphics-form")) return;
    updatePreview();
  });

  document.addEventListener("change", (event) => {
    if (!event.target.closest("#graphics-form")) return;
    updatePreview();
  });

  document.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    event.preventDefault();

    if (target.dataset.action === "save-graphics") {
      if (!requireGraphicsAccess()) return;
      saveGraphicsConfig();
      showToast("Diseno guardado.");
      render();
    }

    if (target.dataset.action === "send-graphics") {
      if (!requireGraphicsAccess()) return;
      saveGraphicsConfig();
      await sendGraphicsConfig();
      render();
    }

    if (target.dataset.action === "reset-graphics") {
      if (!requireGraphicsAccess()) return;
      state.settings.graphicsConfig = DEFAULT_GRAPHICS_CONFIG;
      writeLocalGraphicsConfig(DEFAULT_GRAPHICS_CONFIG);
      saveState();
      showToast("Diseno restaurado.");
      render();
    }

    if (target.dataset.action === "copy-link") {
      copyInputValue(target.dataset.target);
    }

    if (target.dataset.action === "graphics-login-open") showGraphicsLogin();
    if (target.dataset.action === "graphics-login-close") closeGraphicsLogin();
    if (target.dataset.action === "graphics-login") await signInGraphicsAccess();
    if (target.dataset.action === "graphics-logout") await signOutGraphicsAccess();
  });
}

function updatePreview() {
  const config = saveGraphicsConfig({ silent: true });
  const preview = document.querySelector(".graphics-preview .card-body");
  if (preview) preview.innerHTML = renderPreview(config);
}

function saveGraphicsConfig(options = {}) {
  const form = document.getElementById("graphics-form");
  if (!form) return normalizeGraphicsConfig();

  const data = new FormData(form);
  const config = normalizeGraphicsConfig({
    logoImage: data.get("logoImage"),
    barImage: data.get("barImage"),
    accentColor: data.get("accentColor"),
    textColor: data.get("textColor"),
    scoreColor: data.get("scoreColor"),
    glowColor: data.get("glowColor"),
    scoreboardScale: data.get("scoreboardScale"),
    timerScale: data.get("timerScale"),
    turnScale: data.get("turnScale"),
    maxTeams: data.get("maxTeams"),
    showLogo: data.has("showLogo")
  });

  state.settings.graphicsConfig = config;
  writeLocalGraphicsConfig(config);
  saveState({ silent: Boolean(options.silent) });
  applyGraphicsConfig(config);
  return config;
}

async function sendGraphicsConfig() {
  if (!liveChannel) {
    showToast("Abre graficos con tournamentId.");
    return;
  }
  const firebaseResult = await publishFirebaseGraphicsConfig(state.settings.graphicsConfig, liveChannel);
  showToast(firebaseResult.ok ? "Diseno enviado a Firebase." : "No se pudo enviar el diseno.");
}

function buildGraphicUrl(fileName) {
  const params = new URLSearchParams({ v: "20260622-prepare-gate1" });
  if (liveChannel) params.set("tournamentId", liveChannel);
  return new URL(`./${fileName}?${params.toString()}`, window.location.href).href;
}

function copyInputValue(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.select();
  navigator.clipboard?.writeText(input.value).then(
    () => showToast("URL copiada."),
    () => showToast("Selecciona y copia la URL.")
  );
}

function rgbaToHex(value, fallback) {
  const hexMatch = String(value || "").match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) return value;
  const rgbaMatch = String(value || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgbaMatch) return fallback;
  return `#${[1, 2, 3].map((index) => Number(rgbaMatch[index]).toString(16).padStart(2, "0")).join("")}`;
}

function formatAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("auth/user-not-found")) return "Ese usuario no existe en Firebase.";
  if (reason.includes("auth/operation-not-allowed")) return "Activa Email/Password en Firebase Authentication.";
  if (reason.includes("permission_denied")) return "Firebase no permitio el acceso. Revisa el rol.";
  return "No se pudo iniciar sesion.";
}
