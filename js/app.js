import { SUERTES, TOURNAMENT_TYPES, getTournamentSuertes, getTournamentTypeConfig } from "./data/suertes.js?v=20260708-tournament-types-001-pialadero1";
import { COMPETITION_TYPES, getCompetitionType } from "./data/competitionTypes.js?v=20260712-production-competitions-001-broadcast-context1";
import { CHARROPRO_APP_VERSION } from "./core/version.js?v=20260712-production-competitions-001-broadcast-context1";
import {
  SCORING_BUTTON_GROUPS,
  normalizeScoringButtonGroup,
  normalizeScoringButtonLayouts
} from "./data/defaultScoringButtonLayouts.js?v=20260708-recovery-001b-panel-status1";
import {
  CALA_ADIC_SECTIONS,
  CALA_RULEBOOK_VERSION,
  CALA_TEAM_PENALTY_RULES,
  calculatePuntaBreakdown,
  normalizeTeamPenalty,
  sumTeamPenalties
} from "./data/calaRules.js?v=20260708-recovery-001b-panel-status1";
import { closeModal, escapeHTML, html, moneylessNumber, showModal, showToast } from "./core/dom.js?v=20260712-production-competitions-001-broadcast-context1";
import { EVENT_TYPES, buildEvent, registerEvent } from "./core/events.js?v=20260708-event-001b-engine-architecture1";
import { exportBackupJson, exportCurrentTournamentCsv } from "./core/exporters.js?v=20260709-competitions-003-scoring-by-competition1";
import { advanceScoringPointer, previousScoringPointer, resetScoringPointer } from "./core/flow.js?v=20260709-competitions-003-scoring-by-competition1";
import { downloadOfficialFormatXlsx } from "./core/officialFormat.js?v=20260709-competitions-003-scoring-by-competition1";
import { formatTimerMs, getTimerScopeKey, getTimerView } from "./core/timerRules.js?v=20260708-recovery-001b-panel-status1";
import { buildStatisticalHistorySnapshot } from "./core/history.js?v=20260709-competitions-003-scoring-by-competition1";
import { buildCharroProStatsCenter } from "./core/statistics.js?v=20260709-competitions-003-scoring-by-competition1";
import {
  applyPuntaCalculation,
  buildCharreadaLeaderboard,
  buildLeaderboard,
  calculateAttemptTotal,
  getTeamCharreadaResta,
  getTeamCharreadaTotal,
  getTeamInfrTotal,
  getTeamSuerteTotal,
  hasAttemptActivity
} from "./core/scoring.js?v=20260709-competitions-003-scoring-by-competition1";
import {
  claimGoogleSyncControl,
  buildLivePayload,
  getActiveLiveChannel,
  scheduleFirebaseSync,
  scheduleGoogleSync,
  sendToFirebaseLive,
  sendToFirebaseTurn,
  sendToGoogleSheets
} from "./core/sync.js?v=20260712-production-competitions-001-broadcast-context1";
import {
  createFirebaseTournamentBackup,
  deleteFirebaseTournament,
  isFirebaseLiveConfigured,
  publishFirebaseGlobalRuleOverrides,
  publishFirebaseOfficialScoreAtomic,
  publishFirebasePublishedScore,
  publishFirebaseScore,
  publishFirebaseScoringButtonLayouts,
  publishFirebaseStatHistory,
  publishFirebaseTournamentState,
  readFirebaseActiveCharreadaSnapshot,
  readFirebasePreparationSnapshot,
  readFirebaseTournamentSafetySnapshot,
  saveFirebaseAuthUserProfile,
  saveFirebaseUserProfile,
  publishFirebaseTimer,
  signInFirebaseUser,
  signOutFirebaseUser,
  subscribeFirebaseAuthSession,
  subscribeFirebaseGlobalRuleOverrides,
  subscribeFirebaseLive,
  subscribeFirebaseScores,
  subscribeFirebaseScoringButtonLayouts,
  subscribeFirebaseStatHistory,
  subscribeFirebaseTournamentIndex,
  subscribeFirebaseTournamentState,
  subscribeFirebaseUsers
} from "./core/firebaseSync.js?v=20260712-production-competitions-001-broadcast-context1";
import { ROLES, ROLE_OPTIONS, getRoleLabel, hasTournamentAccess, isActiveAccessSession, normalizeTournamentAccess, roleCan } from "./core/roles.js?v=20260708-recovery-001b-panel-status1";
import {
  buildTournamentUrl,
  clearTournamentContext,
  getTournamentContext,
  getTournamentIdFromUrl,
  setTournamentContext
} from "./core/tournamentContext.js?v=20260708-recovery-001b-panel-status1";
import { clearTournamentSandboxStorage } from "./core/localCache.js?v=20260708-recovery-001b-panel-status1";
import {
  createRoster,
  emptyAttempt,
  ensureScoresForCharreada,
  recordPublishedScore,
  getActiveCharreada,
  getActiveTournament,
  getCharreadaCompetitionContext,
  getCharreadaScoringEntries,
  getCharreadaScoringSuertes,
  getCurrentContext,
  getLatestStatHistorySnapshot,
  getTeam,
  getTournamentCharreadas,
  getTournamentTeams,
  getScopedLocalStorageKey,
  loadState,
  removePublishedScoresFor,
  recordStatHistorySnapshot,
  resetAllData,
  saveState,
  scoreKey,
  setActiveTournament,
  setGlobalRuleOverrides,
  setView,
  LIVE_TIMER_KEY,
  STORAGE_KEY,
  state,
  uid
} from "./core/state.js?v=20260709-competitions-003-scoring-by-competition1";

const app = document.getElementById("app");
const OBS_PAGE_VERSION = CHARROPRO_APP_VERSION;
const PUBLIC_LINKS_PAGE_VERSION = "20260709-public-links-001";
const APP_MODE = window.CHARROPRO_APP_MODE === "tournament" ? "tournament" : "portal";
const IS_TOURNAMENT_APP = APP_MODE === "tournament";
const scoringScrollSelectors = [".score-workspace", ".scoring-main", ".turn-panel", ".suertes-strip", ".scoring-shell", ".cp-scoring-shell"];
const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";
const TURN_PANEL_STORAGE_KEY = "turn_panel_collapsed";
const TEAMS_TAB_STORAGE_KEY = "teams_tab";
const SCORING_ACCORDION_STORAGE_KEY = "scoring_accordion_state";
const OFFICIAL_PROGRAM_COLLAPSE_STORAGE_KEY = "official_program_collapsed_days";
const RECOVERY_LAST_BACKUP_STORAGE_KEY = "recovery_last_backup_v1";
const RECOVERY_BACKUP_HISTORY_STORAGE_KEY = "recovery_backup_history_v1";
const FIREBASE_CLIENT_ID_KEY = "firebase_client_id";
const APP_CACHE_VERSION_STORAGE_KEY = "cache_version";
const PREPARE_STORAGE_KEY = "prepare_status_v1";
const TEAM_CATEGORIES = [
  "Libre",
  "Infantil",
  "Juvenil",
  "Charro Mayor",
  "Femenil",
  "Charros Completos"
];

function scopedStorageKey(suffix) {
  return getScopedLocalStorageKey(suffix);
}
const INDIVIDUAL_TOURNAMENT_TYPES = ["caladero", "coleadero", "pialadero"];
const RULE_GROUPS = [
  { id: "base", title: "Base", color: "blue", hasPoints: true },
  { id: "adic", title: "Adicionales", color: "green", hasPoints: true },
  { id: "infr", title: "Infracciones", color: "red", hasPoints: true },
  { id: "desc", title: "Descalificacion o cero", color: "amber", hasPoints: false }
];
const GENERAL_TEAM_PENALTY_RULES = [
  { id: "equipo_infraccion_1", pts: 1, label: "Infraccion al equipo -1" },
  { id: "equipo_infraccion_2", pts: 2, label: "Infraccion al equipo -2" },
  { id: "equipo_infraccion_5", pts: 5, label: "Infraccion al equipo -5" }
];
const CHARREADA_STATUS_OPTIONS = [
  ["programada", "Programada"],
  ["en_vivo", "En vivo"],
  ["finalizada", "Finalizada"],
  ["congelada", "Congelada"]
];
const OPERATIONAL_STATUS_OPTIONS = [
  ["", "Sin estado operativo"],
  ["programada", "Programada"],
  ["preparando", "Preparando"],
  ["en_vivo", "En vivo"],
  ["pausada", "Pausada"],
  ["terminada", "Terminada"],
  ["suspendida", "Suspendida"],
  ["cancelada", "Cancelada"]
];
const CHARREADA_PHASE_OPTIONS = [
  ["", "Sin fase"],
  ["Preparación", "Preparación"],
  ["Fase 1", "Fase 1"],
  ["Fase 2", "Fase 2"],
  ["Fase 3", "Fase 3"],
  ["Repechaje", "Repechaje"],
  ["Semifinal", "Semifinal"],
  ["Final", "Final"],
  ["Caladero", "Caladero"],
  ["Coleadero", "Coleadero"],
  ["Exhibición", "Exhibición"],
  ["__other", "Otro"]
];
const TIME_EVIDENCE_LABEL_OPTIONS = [
  ["Tiempo oficial", "Tiempo oficial"],
  ["Jineteo", "Jineteo"],
  ["Terna", "Terna"],
  ["Devolución de sombreros", "Devolución de sombreros"],
  ["__other", "Otro"]
];
const TOURNAMENT_STATUS_OPTIONS = [
  ["preparacion", "Preparacion"],
  ["en_vivo", "En vivo"],
  ["finalizado", "Finalizado"],
  ["congelado", "Congelado"]
];
const ROLE_MENU_VIEWS = {
  [ROLES.JUEZ]: ["dashboard", "officialProgram", "results"],
  [ROLES.LOCUTOR]: ["dashboard", "officialProgram", "results"],
  [ROLES.GRAFICOS]: ["dashboard", "officialProgram", "results", "graphicsAccess"],
  [ROLES.ORGANIZADOR]: ["dashboard", "officialProgram", "program", "results", "stats", "recovery", "settings"],
  [ROLES.LECTURA]: ["dashboard", "officialProgram", "program", "results", "stats", "recovery", "settings"]
};
const READ_ACTIONS = new Set([
  "close-modal",
  "toggle-sidebar",
  "toggle-turn-panel",
  "toggle-scoring-accordion",
  "show-scoring-action-history",
  "show-access-login",
  "sign-in-access",
  "sign-out-access",
  "open-tournament",
  "open-tournament-program",
  "open-program-charreada",
  "toggle-official-program-day",
  "select-teams-tab",
  "toggle-program-day",
  "select-results-phase",
  "select-results-competition",
  "select-rule-suerte",
  "copy-live-url",
  "copy-public-url",
  "export-csv",
  "export-official-xlsx",
  "export-json",
  "create-full-backup",
  "clear-recovery-history",
  "clear-local-cache",
  "prepare-clear-cache",
  "prepare-sync",
  "charreada-filter-teams"
]);
const ACTION_CAPABILITIES = {
  "new-tournament": "manage",
  "save-tournament": "manage",
  "set-tournament-status": "manage",
  "confirm-freeze-tournament": "supervise",
  "freeze-tournament": "supervise",
  "confirm-delete-tournament": "supervise",
  "delete-tournament-permanent": "supervise",
  "new-team": "manage",
  "save-team": "manage",
  "delete-team": "manage",
  "save-quick-teams": "manage",
  "new-charreada": "manage",
  "edit-charreada": "manage",
  "save-charreada": "manage",
  "delete-charreada": "manage",
  "confirm-delete-charreada": "manage",
  "charreada-select-all": "manage",
  "charreada-clear-teams": "manage",
  "charreada-compact-order": "manage",
  "set-active-charreada": "operate",
  "start-scoring": "score",
  "exit-scoring": "read",
  "select-suerte": "score",
  "select-team": "score",
  "select-attempt": "score",
  "select-coleador": "score",
  "punta-step": "score",
  "punta-set": "score",
  "punta-input": "score",
  "attempt-field": "score",
  "desc-select": "score",
  "desc-other": "score",
  "toggle-rule": "score",
  "toggle-team-penalty": "score",
  "toggle-attempt-zero": "score",
  "capture-time-evidence": "score",
  "save-time-evidence": "score",
  "remove-time-evidence": "score",
  "continue-best-coleador-modal": "score",
  "toggle-desc": "score",
  "add-custom": "score",
  "remove-custom": "score",
  "reset-attempt": "score",
  "previous-score": "score",
  "next-score": "score",
  "take-live-control": "supervise",
  "timer-toggle": "timer",
  "timer-reset": "timer",
  "show-scoring-button-settings": "settings",
  "save-scoring-button-layout": "settings",
  "reset-scoring-button-layout": "settings",
  "save-rule-editor": "rules",
  "add-rule-editor": "rules",
  "delete-rule-editor": "rules",
  "reset-rule-editor": "rules",
  "save-settings": "settings",
  "create-full-backup": "settings",
  "new-user-profile": "users",
  "edit-user-profile": "users",
  "save-user-profile": "users",
  "deactivate-user-profile": "users",
  "save-stat-history": "supervise",
  "test-sync": "operate",
  "publish-live-state": "operate",
  "reset-data": "manage",
  "confirm-reset": "manage"
};

const PREPARATION_REQUIRED_ACTIONS = new Set([
  "new-tournament",
  "save-tournament",
  "open-tournament",
  "open-tournament-program",
  "save-team",
  "save-quick-teams",
  "save-charreada",
  "select-suerte",
  "select-team",
  "select-attempt",
  "select-coleador",
  "punta-step",
  "punta-set",
  "punta-input",
  "attempt-field",
  "desc-select",
  "desc-other",
  "toggle-rule",
  "toggle-team-penalty",
  "toggle-attempt-zero",
  "capture-time-evidence",
  "save-time-evidence",
  "remove-time-evidence",
  "continue-best-coleador-modal",
  "toggle-desc",
  "add-custom",
  "remove-custom",
  "reset-attempt",
  "previous-score",
  "next-score",
  "timer-toggle",
  "timer-reset",
  "confirm-freeze-tournament",
  "freeze-tournament",
  "set-tournament-status",
  "confirm-delete-tournament",
  "delete-tournament-permanent",
  "start-scoring"
]);

const routeMeta = {
  tournaments: ["Torneos", "Crea uno nuevo o abre un torneo existente."],
  dashboard: ["Panel", "Estado general del torneo activo."],
  teams: ["Equipos", "Alta de equipos y alineaciones."],
  officialProgram: ["Programa", "Consulta oficial del orden del torneo."],
  program: ["Programacion", "Crear y administrar charreadas y equipos participantes."],
  results: ["Resultados del torneo", "Tabla, sabana y exportacion del torneo activo."],
  stats: ["Estadisticas del torneo", "Analisis del torneo activo."],
  recovery: ["Recovery Center", "Respaldo manual del torneo activo."],
  globalStats: ["Estadisticas globales", "Analisis general de temporadas, torneos e historiales."],
  history: ["Historial", "Archivo por temporadas de torneos guardados."],
  users: ["Usuarios", "Alta de permisos y roles del sistema."],
  graphicsAccess: ["Graficos", "Links y pantallas para OBS."],
  rules: ["Botoneras", "Reglamento y botones por torneo."],
  rulesAdmin: ["Botoneras generales", "Reglamento base oculto del sistema."],
  settings: ["Conexion", "Google Sheets, OBS y respaldos."]
};
const TOURNAMENT_VIEWS = new Set(["dashboard", "teams", "officialProgram", "program", "results", "stats", "recovery", "graphicsAccess", "rules", "settings"]);

function isIndividualTournament(tournament = getActiveTournament()) {
  return INDIVIDUAL_TOURNAMENT_TYPES.includes(tournament?.type);
}

function getTournamentSeason(tournament = {}) {
  const value = String(tournament.season || tournament.date || "").trim();
  const match = value.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? match[1] : new Date().getFullYear().toString();
}

function getSeasonFromInput(value) {
  const clean = String(value || "").trim();
  const match = clean.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? match[1] : new Date().getFullYear().toString();
}

function isTournamentFrozen(tournament = getActiveTournament()) {
  return tournament?.status === "congelado";
}

function isOperationalTournament(tournament = {}) {
  return !["finalizado", "congelado"].includes(tournament?.status);
}

function isCharreadaFrozen(charreada = getActiveCharreada()) {
  return isTournamentFrozen(getActiveTournament()) || charreada?.status === "congelada";
}

function isActiveTournamentLocked() {
  return isTournamentFrozen(getActiveTournament());
}

function isCurrentCharreadaLocked() {
  return isCharreadaFrozen(getActiveCharreada());
}

function guardUnlockedTournament(message = "Este torneo esta congelado. Solo se puede consultar.") {
  if (!isActiveTournamentLocked()) return true;
  showToast(message);
  return false;
}

function guardUnlockedCharreada(charreada = getActiveCharreada(), message = "Esta charreada esta congelada. Solo se puede consultar.") {
  if (!isCharreadaFrozen(charreada)) return true;
  showToast(message);
  return false;
}

function getEntityLabels(tournament = getActiveTournament()) {
  if (isIndividualTournament(tournament)) {
    return {
      singular: "participante",
      plural: "participantes",
      title: "Participantes",
      nav: "Participantes",
      add: "Agregar participante",
      quickTitle: "Alta rapida de participantes",
      quickHelp: "Escribe un participante por renglon con su caballo. Formato: Participante / Caballo.",
      quickLabel: "Participantes y caballos",
      quickPlaceholder: "Juan Perez / El Lucero\nJuan Perez / El Caporal\nMaria Lopez / La Paloma",
      quickButton: "Agregar participantes",
      listButton: "Ver participantes",
      registeredTitle: "Participantes registrados",
      readyText: "participantes listos para programar",
      empty: "Agrega participantes para armar el programa.",
      noItems: "Aun no hay participantes.",
      firstBeforeProgram: "Primero registra participantes",
      nameHeader: "Participante",
      formTitleNew: "Nuevo participante",
      formTitleEdit: "Editar participante",
      formSave: "Guardar participante",
      nameLabel: "Participante",
      namePlaceholder: "Nombre del participante",
      horseLabel: "Caballo",
      horsePlaceholder: "Nombre del caballo",
      orderLabel: "Participantes y orden de salida",
      orderHelp: "Marca los participantes y pon 1, 2, 3... segun el orden real de participacion.",
      scoreTurnHelp: "Participante en turno y oportunidad actual.",
      scoreEntityLabel: "Participante",
      pointsSuffix: "pts participante",
      deleteDataText: "Esto elimina torneos, participantes, charreadas y calificaciones guardadas en este navegador."
    };
  }

  return {
    singular: "equipo",
    plural: "equipos",
    title: "Equipos",
    nav: "Equipos",
    add: "Agregar equipo",
    quickTitle: "Alta rapida de equipos",
    quickHelp: "Escribe un equipo por renglon. La alineacion se puede completar despues desde Editar.",
    quickLabel: "Nombres de equipos",
    quickPlaceholder: "Rancho El Capricho\nTres Potrillos\nRancho Los Amigos",
    quickButton: "Agregar equipos",
    listButton: "Ver equipos",
    registeredTitle: "Equipos registrados",
    readyText: "equipos listos para programar",
    empty: "Agrega equipos para armar el programa.",
    noItems: "Aun no hay equipos.",
    firstBeforeProgram: "Primero registra equipos",
    nameHeader: "Equipo",
    formTitleNew: "Nuevo equipo",
    formTitleEdit: "Editar equipo",
    formSave: "Guardar equipo",
    nameLabel: "Nombre del equipo",
    namePlaceholder: "Ej. Rancho El Capricho",
    horseLabel: "",
    horsePlaceholder: "",
    orderLabel: "Equipos participantes y orden de salida",
    orderHelp: "Marca los equipos y pon 1, 2, 3... segun el orden real de participacion.",
    scoreTurnHelp: "Equipo en turno y oportunidad actual.",
    scoreEntityLabel: "Equipo",
    pointsSuffix: "pts equipo",
    deleteDataText: "Esto elimina torneos, equipos, charreadas y calificaciones guardadas en este navegador."
  };
}

function getScoringEntityLabels(context = {}) {
  const labels = getEntityLabels(context.tournament);
  if (!context.competitionContext?.isIndividualCompetition) return labels;
  return {
    ...labels,
    singular: "participante",
    plural: "participantes",
    nameHeader: "Participante",
    scoreTurnHelp: "Participante en turno y oportunidad actual.",
    scoreEntityLabel: "Participante",
    pointsSuffix: "pts participante"
  };
}

function getEntryDisplayName(team = {}) {
  const participantName = String(team.participantName || "").trim();
  const horseName = String(team.horseName || "").trim();
  if (participantName || horseName) return [participantName, horseName].filter(Boolean).join(" / ");
  return team?.name || "";
}

function getParticipantHorseParts(team = {}) {
  const participantName = String(team.participantName || "").trim();
  const horseName = String(team.horseName || "").trim();
  if (participantName || horseName) return { participantName, horseName };

  const [participant = "", horse = ""] = String(team.name || "").split("/").map((part) => part.trim());
  return { participantName: participant, horseName: horse };
}

function buildIndividualEntryName(participantName, horseName) {
  return [participantName, horseName].map((value) => String(value || "").trim()).filter(Boolean).join(" / ");
}

function parseParticipantLine(line) {
  const parts = String(line || "").split(/\s*[\/|,]\s*/).map((part) => part.trim()).filter(Boolean);
  return {
    participantName: parts[0] || "",
    horseName: parts.slice(1).join(" ") || ""
  };
}

function makeIndividualRoster(participantName) {
  const roster = createBlankRoster();
  Object.keys(roster).forEach((key) => {
    if (Array.isArray(roster[key])) return;
    roster[key] = participantName;
  });
  roster.colas = [participantName, "", ""];
  roster.terna = [participantName, participantName, participantName];
  return roster;
}

function getIndividualEntryKey(participantName, horseName) {
  return `${normalizeNameForCompare(participantName)}__${normalizeNameForCompare(horseName)}`;
}

let timerRunning = false;
let timerStartedAt = 0;
let timerElapsedMs = 0;
let timerInterval = null;
let lastTimerSyncAt = 0;
let lastExternalTimerAt = 0;
let firebaseTimerUnsubscribe = null;
let firebaseTimerChannel = "";
let globalRulesUnsubscribe = null;
let globalScoringLayoutsUnsubscribe = null;
let firebaseAppStateUnsubscribe = null;
let firebaseAppStateSubscriptionKey = "";
let firebaseTournamentStateUnsubscribe = null;
let firebaseTournamentStateId = "";
let firebaseScoresUnsubscribe = null;
let firebaseScoresTournamentId = "";
let firebaseAccessUnsubscribe = null;
let firebaseAppStateTimer = null;
let firebaseUsersUnsubscribe = null;
let firebaseStatHistoryUnsubscribe = null;
let applyingRemoteAppState = false;
let suppressNextSharedAppStatePublish = false;
let isScoringDirty = false;
let activeScoringDraft = null;
let officialPublishInProgress = false;
let pendingTimeEvidenceCapture = null;
let pendingBestColeadorModal = null;
let lastScoreSaveStatus = {
  state: "connected",
  label: "Conectado",
  detail: "",
  savedAtMs: 0,
  scoreId: ""
};
let lastRemoteAppStateAt = 0;
let lastRemoteTournamentStateAt = 0;
let lastTournamentStatePublishAt = 0;
let firebaseAccess = {
  ready: false,
  user: null,
  uid: "",
  email: "",
  name: "",
  role: ROLES.SIN_ACCESO,
  active: false
};
let firebaseUsers = [];
let lastFirebaseError = "";
let lastSyncError = "";
let prepareState = readPrepareState();
let firebaseDiagnostics = readFirebaseDiagnostics();
const firebaseClientId = readFirebaseClientId();
let launchRequestedScoring = false;
let launchRequestedAdmin = false;
let sidebarCollapsed = readSidebarPreference();
let turnPanelCollapsed = readTurnPanelPreference();
let teamsTab = readTeamsTabPreference();
let scoringAccordionState = readScoringAccordionPreference();
let supervisorScoringReviewMode = false;
let supervisorLiveControlEnabled = false;
let lastPermissionsMenuLogKey = "";

loadState();
clearStaleLocalTournamentCache();
applyLaunchParams();
applyDefaultEntryView();
hydrateTimerFromState();
render();
wireGlobalEvents();
wireFirebaseAppStatePublisher();
subscribeFirebaseAccess();
subscribeExternalTimerControl();
subscribeGlobalRuleOverridesUpdates();
subscribeGlobalScoringButtonLayoutUpdates();

function render({ preserveScoringScroll = false } = {}) {
  if (!isActiveAccessSession(firebaseAccess)) {
    renderAccessGate();
    return;
  }

  if (IS_TOURNAMENT_APP && !getTournamentContext().tournamentId) {
    renderTournamentShellError("Falta ID de torneo", "Abre esta pagina usando torneo.html?tournamentId=ID_DEL_TORNEO.");
    return;
  }

  if (IS_TOURNAMENT_APP && !canAccessTournamentId(getTournamentContext().tournamentId)) {
    renderTournamentShellError("Acceso denegado", "Tu usuario no esta asignado a este torneo.");
    return;
  }

  subscribeExternalTimerControl();

  if (state.view === "scoring") {
    renderScoring({ preserveScroll: preserveScoringScroll });
    queuePreparationGate();
    return;
  }

  let [title, subtitle] = routeMeta[state.view] || routeMeta.dashboard;
  if (state.view === "teams") {
    const labels = getEntityLabels();
    title = labels.title;
    subtitle = isIndividualTournament() ? "Alta de participantes y caballos." : subtitle;
  }
  const tournamentScoped = isTournamentScopedView(state.view);
  app.innerHTML = html`
    <div class="app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}">
      ${renderSidebar()}
      <main class="main">
        <header class="topbar">
          <div class="topbar-title-block">
            <h1>${escapeHTML(title)}</h1>
            <p>${escapeHTML(subtitle)}</p>
            ${tournamentScoped ? renderTopbarTournamentContext() : ""}
          </div>
          <div class="topbar-actions">
            ${renderAccessWidget()}
            ${tournamentScoped
              ? html`${IS_TOURNAMENT_APP ? "" : renderTournamentPicker()}${firebaseAccess.role === ROLES.JUEZ ? "" : html`<a class="button" href="./index.html">Vista general</a>`}`
              : state.view === "tournaments" ? "" : html`<button class="button" data-view="tournaments">Torneos</button>`}
          </div>
        </header>
        ${renderCurrentView()}
      </main>
	    </div>
	  `;
  queuePreparationGate();
}

function renderTournamentShellError(title, message) {
  app.innerHTML = html`
    <main class="access-page">
      <section class="access-panel">
        <div class="access-brand">
          <span>CharroPro</span>
          <h1>${escapeHTML(title)}</h1>
          <p>${escapeHTML(message)}</p>
        </div>
        <article class="card access-card">
          <div class="card-body topbar-actions">
            <a class="button primary" href="./index.html">Volver al portal</a>
            ${firebaseAccess.user ? html`<button class="button" data-action="sign-out-access">Salir</button>` : ""}
          </div>
        </article>
      </section>
    </main>
  `;
}

function renderAccessGate() {
  app.innerHTML = html`
    <main class="access-page">
      <section class="access-panel">
        <div class="access-brand">
          <span>CharroPro</span>
          <h1>Acceso privado</h1>
          <p>Inicia sesion para ver solo las areas permitidas para tu rol.</p>
        </div>
        ${
          !firebaseAccess.ready
            ? renderAccessLoading()
            : firebaseAccess.user
              ? renderInactiveAccess()
              : renderInlineAccessForm()
        }
      </section>
    </main>
  `;
}

function renderAccessLoading() {
  return html`
    <article class="card access-card">
      <div class="card-body">
        <span class="access-badge muted">Conectando con Firebase</span>
        <p class="card-subtitle">Estamos verificando tu sesion en este dispositivo.</p>
      </div>
    </article>
  `;
}

function renderInactiveAccess() {
  return html`
    <article class="card access-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Sin rol activo</h2>
          <p class="card-subtitle">${escapeHTML(firebaseAccess.email || "Este usuario")} no tiene permiso activo para entrar.</p>
        </div>
      </div>
      <div class="card-body grid">
        <p class="card-subtitle">Pide a un supervisor que active el usuario o cambie el rol en CharroPro > Usuarios.</p>
        <div class="topbar-actions">
          <button class="button" data-action="sign-out-access">Salir</button>
          <button class="button primary" data-action="show-access-login">Cambiar usuario</button>
        </div>
      </div>
    </article>
  `;
}

function renderInlineAccessForm() {
  return html`
    <article class="card access-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Entrar a CharroPro</h2>
          <p class="card-subtitle">Usa el correo autorizado por el supervisor.</p>
        </div>
      </div>
      <form id="access-login-form" class="card-body grid">
        <div>
          <label>Correo</label>
          <input name="email" type="email" required autocomplete="username" placeholder="correo@ejemplo.com">
        </div>
        <div>
          <label>Contrasena</label>
          <input name="password" type="password" required autocomplete="current-password" placeholder="Contrasena">
        </div>
        <button class="button primary" data-action="sign-in-access" type="submit">Entrar</button>
      </form>
    </article>
  `;
}

function isTournamentScopedView(view = state.view) {
  return TOURNAMENT_VIEWS.has(view);
}

function getSidebarTournamentContext() {
  if (IS_TOURNAMENT_APP) {
    const tournamentId = getTournamentContext().tournamentId;
    return state.tournaments.find((tournament) => tournament.id === tournamentId) || null;
  }
  const active = getActiveTournament();
  if (active && isOperationalTournament(active) && canAccessTournamentId(active.id)) return active;
  return getVisibleTournaments()[0] || null;
}

function renderTopbarTournamentContext() {
  const tournament = getSidebarTournamentContext();
  if (!tournament) return "";
  return html`
    <div class="topbar-context">
      <span>${escapeHTML(tournament.name)}</span>
      <em>${escapeHTML(getTournamentSeason(tournament))} / ${escapeHTML(formatTournamentStatus(tournament.status))}</em>
    </div>
  `;
}

function applyLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const tournamentId = getTournamentIdFromUrl();
  const charreadaId = params.get("charreada") || params.get("charreadaId");
  const view = params.get("view");
  const admin = params.get("admin");
  if (IS_TOURNAMENT_APP) {
    if (!tournamentId) {
      clearTournamentContext();
      return;
    }

    setTournamentContext(tournamentId, "url");
    state.activeTournamentId = tournamentId;
    if (view === "scoring") {
      state.view = "scoring";
      launchRequestedScoring = true;
    } else if (view && isTournamentScopedView(view)) state.view = view;
    else if (!isTournamentScopedView(state.view) && state.view !== "scoring") state.view = "dashboard";
    if (charreadaId) {
      state.activeCharreadaId = charreadaId;
      if (view === "scoring") {
        state.view = "scoring";
        launchRequestedScoring = true;
      }
    } else {
      const activeCharreada = state.charreadas.find((item) => item.id === state.activeCharreadaId);
      if (activeCharreada && activeCharreada.tournamentId !== tournamentId) state.activeCharreadaId = null;
    }
    saveState({ silent: true });
    return;
  }

  clearTournamentContext();
  if (admin === "botoneras" || admin === "reglamento") {
    state.view = "rulesAdmin";
    launchRequestedAdmin = true;
    saveState({ silent: true });
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || ""}`);
    return;
  }
  if (tournamentId) {
    const tournament = state.tournaments.find((item) => item.id === tournamentId);
    if (tournament) {
      state.activeTournamentId = tournament.id;
      if (view && routeMeta[view]) state.view = isTournamentScopedView(view) ? "tournaments" : view;
      saveState({ silent: true });
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || ""}`);
      return;
    }
  }
  if (view && routeMeta[view] && !charreadaId) {
    state.view = view;
    saveState({ silent: true });
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || ""}`);
    return;
  }
  if (!charreadaId) return;

  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!charreada) return;

  state.activeTournamentId = charreada.tournamentId;
  state.activeCharreadaId = charreada.id;
  if (view === "scoring") {
    state.view = "scoring";
    launchRequestedScoring = true;
  }
  saveState({ silent: true });

  const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
  window.history.replaceState({}, "", cleanUrl);
}

function applyDefaultEntryView() {
  if (launchRequestedScoring || launchRequestedAdmin) return;
  if (IS_TOURNAMENT_APP) {
    if (!getTournamentContext().tournamentId) return;
    if (!isTournamentScopedView(state.view)) state.view = "dashboard";
    saveState({ silent: true });
    return;
  }
  state.view = "tournaments";
  saveState({ silent: true });
}

function renderSidebar() {
  const labels = getEntityLabels();
  const generalItems = IS_TOURNAMENT_APP ? [] : getVisibleGeneralNavItems();
  const tournamentItems = IS_TOURNAMENT_APP ? getVisibleTournamentNavItems(labels) : [];
  const tournament = getSidebarTournamentContext();
  const footerLinks = getSidebarFooterLinks();

  return html`
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-copy">
          <h1 class="brand-title">${sidebarCollapsed ? "CP" : "CharroPro"}</h1>
          <p class="brand-subtitle">Base organizada para torneos de charreria</p>
        </div>
        <button
          class="sidebar-toggle"
          data-action="toggle-sidebar"
          aria-label="${sidebarCollapsed ? "Expandir menu" : "Contraer menu"}"
          title="${sidebarCollapsed ? "Expandir menu" : "Contraer menu"}"
          type="button"
        >
          ${sidebarCollapsed ? ">" : "<"}
        </button>
      </div>
      <nav class="side-nav">
        ${renderSidebarNavSection("General", generalItems)}
        ${IS_TOURNAMENT_APP && tournament ? renderSidebarTournamentContext(tournament) : ""}
        ${renderSidebarNavSection(IS_TOURNAMENT_APP ? "Torneo" : "Torneo activo", IS_TOURNAMENT_APP ? tournamentItems : [])}
      </nav>
      <div class="side-footer">
        ${footerLinks.map((link) => html`
          <a class="button small" href="${escapeHTML(link.href)}" target="${link.target || "_blank"}" rel="noreferrer">
            <span class="footer-icon" aria-hidden="true">${renderUiIcon(link.icon)}</span>
            <span class="footer-label">${escapeHTML(link.label)}</span>
          </a>
        `).join("")}
      </div>
    </aside>
  `;
}

function renderSidebarNavSection(title, items) {
  if (!items.length) return "";
  return html`
    <section class="nav-section">
      <span class="nav-section-title">${escapeHTML(title)}</span>
      <div class="nav-section-items">
        ${items.map(([view, label, icon]) => html`
          <button class="nav-button ${state.view === view ? "active" : ""}" data-view="${view}">
            <span class="nav-icon" aria-hidden="true">${renderUiIcon(icon)}</span>
            <span class="nav-label">${escapeHTML(label)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSidebarTournamentContext(tournament) {
  return html`
    <article class="sidebar-tournament-context">
      <span>Torneo</span>
      <strong>${escapeHTML(tournament.name)}</strong>
      <em>${escapeHTML(getTournamentSeason(tournament))} / ${escapeHTML(formatTournamentStatus(tournament.status))}</em>
    </article>
  `;
}

function getSidebarFooterLinks() {
  const links = [];
  const active = isActiveAccessSession(firebaseAccess);
  const role = firebaseAccess.role;

  if (!active) {
    return [];
  }

  if (IS_TOURNAMENT_APP && role === ROLES.JUEZ) return [];

  if (roleCan(role, "graphics") || roleCan(role, "operate") || role === ROLES.SUPERVISOR) {
    links.push({ label: "Abrir OBS", href: getObsHref(), icon: "monitor" });
  }

  if (roleCan(role, "speaker")) {
    links.push({ label: "Locutores", href: getPageHref("locutores.html"), icon: "mic" });
  }

  if (roleCan(role, "score") || roleCan(role, "timer")) {
    links.push({ label: "Jueces", href: getPageHref("jueces.html"), icon: "judge" });
  }

  if (roleCan(role, "audit")) {
    links.push({ label: "Supervision", href: getPageHref("supervision.html"), icon: "history" });
  }

  return links;
}

function getVisibleGeneralNavItems() {
  const items = [
    ["tournaments", "Torneos", "folder"],
    ["globalStats", "Est. global", "chart"],
    ["history", "Historial", "history"],
    ["users", "Usuarios", "users"],
    ["rulesAdmin", "Botoneras gral.", "sliders"]
  ];

  return items.filter(([view]) => canShowNavView(view));
}

function getVisibleTournamentNavItems(labels) {
  const items = [
    ["dashboard", "Panel", "home"],
    ["officialProgram", "Programa", "calendar"],
    ["teams", labels.nav, "users"],
    ["program", "Programacion", "calendar"],
    ["results", "Resultados", "trophy"],
    ["stats", "Est. torneo", "chart"],
    ["recovery", "Recovery Center", "shield"],
    ["graphicsAccess", "Graficos", "monitor"],
    ["rules", "Botoneras", "sliders"],
    ["settings", "Conexion", "link"]
  ];

  const visible = items.filter(([view]) => canShowNavView(view));
  logPermissionsMenu(firebaseAccess.role, visible.map(([view]) => view));
  return visible;
}

function canShowNavView(view) {
  if (!isActiveAccessSession(firebaseAccess)) return false;
  const role = firebaseAccess.role;
  if (IS_TOURNAMENT_APP) {
    if (role === ROLES.SUPERVISOR || role === ROLES.OPERADOR) return true;
    if (ROLE_MENU_VIEWS[role]) return ROLE_MENU_VIEWS[role].includes(view);
    return false;
  }
  if (role === ROLES.SUPERVISOR) return true;
  if (role === ROLES.OPERADOR) return view !== "users";
  if (role === ROLES.ORGANIZADOR) {
    return ["tournaments", "globalStats", "history", "dashboard", "officialProgram", "program", "results", "stats", "recovery", "settings"].includes(view);
  }
  if (role === ROLES.LECTURA) {
    return ["tournaments", "globalStats", "history", "dashboard", "officialProgram", "program", "results", "stats", "recovery", "settings"].includes(view);
  }
  if (role === ROLES.GRAFICOS) return ["tournaments", "globalStats", "officialProgram", "graphicsAccess"].includes(view);
  return false;
}

function logPermissionsMenu(role, views = []) {
  const key = `${IS_TOURNAMENT_APP ? "torneo" : "portal"}:${role || ""}:${views.join("|")}`;
  if (key === lastPermissionsMenuLogKey) return;
  lastPermissionsMenuLogKey = key;
  console.info(`[permissions] menú aplicado para rol: ${role || "sin_acceso"}`, { views });
}

function renderUiIcon(name) {
  const icons = {
    home: html`
      <path d="M3 11.5 12 4l9 7.5"></path>
      <path d="M5 10.5V20h5v-6h4v6h5v-9.5"></path>
    `,
    folder: html`
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>
      <path d="M3 10h18"></path>
    `,
    users: html`
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path>
      <circle cx="9.5" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    `,
    calendar: html`
      <path d="M8 2v4"></path>
      <path d="M16 2v4"></path>
      <rect x="3" y="4" width="18" height="18" rx="2"></rect>
      <path d="M3 10h18"></path>
      <path d="M8 14h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 18h.01"></path>
      <path d="M12 18h.01"></path>
    `,
	    trophy: html`
	      <path d="M8 21h8"></path>
	      <path d="M12 17v4"></path>
	      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"></path>
	      <path d="M5 5H3v3a4 4 0 0 0 4 4"></path>
	      <path d="M19 5h2v3a4 4 0 0 1-4 4"></path>
	    `,
	    history: html`
	      <path d="M3 12a9 9 0 1 0 3-6.7"></path>
	      <path d="M3 4v6h6"></path>
	      <path d="M12 7v5l3 2"></path>
	    `,
	    chart: html`
	      <path d="M4 19V5"></path>
	      <path d="M4 19h17"></path>
	      <rect x="7" y="11" width="3" height="5" rx="1"></rect>
	      <rect x="12" y="7" width="3" height="9" rx="1"></rect>
	      <rect x="17" y="3" width="3" height="13" rx="1"></rect>
	    `,
	    sliders: html`
	      <path d="M4 21v-7"></path>
	      <path d="M4 10V3"></path>
	      <path d="M12 21v-9"></path>
	      <path d="M12 8V3"></path>
	      <path d="M20 21v-5"></path>
	      <path d="M20 12V3"></path>
	      <path d="M2 14h4"></path>
	      <path d="M10 8h4"></path>
	      <path d="M18 16h4"></path>
	    `,
    shield: html`
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
      <path d="m9 12 2 2 4-5"></path>
    `,
    link: html`
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 4.93"></path>
      <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13 19.07"></path>
    `,
    monitor: html`
      <rect x="3" y="4" width="18" height="13" rx="2"></rect>
      <path d="M8 21h8"></path>
      <path d="M12 17v4"></path>
    `,
    mic: html`
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
      <path d="M12 18v4"></path>
      <path d="M8 22h8"></path>
    `,
    judge: html`
      <path d="M9 21v-2a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v2"></path>
      <circle cx="14.5" cy="7" r="4"></circle>
      <path d="M4 5h4"></path>
      <path d="M6 5v10"></path>
      <path d="M3 15h6"></path>
      <path d="M4 19h4"></path>
    `
  };

  return html`
    <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      ${icons[name] || icons.home}
    </svg>
  `;
}

function getObsHref() {
  const params = buildLiveUrlParams();
  return `./obs.html?${params.toString()}`;
}

function getAbsoluteObsHref() {
  return new URL(getObsHref(), window.location.href).href;
}

function getGraphicHref(fileName) {
  const params = buildLiveUrlParams();
  return `./${fileName}?${params.toString()}`;
}

function getAbsoluteGraphicHref(fileName) {
  return new URL(getGraphicHref(fileName), window.location.href).href;
}

function getPageHref(fileName, options = {}) {
  if (!options.sync) {
    const params = shouldIncludeLiveChannel(fileName, options)
      ? buildLiveUrlParams()
      : new URLSearchParams({ v: OBS_PAGE_VERSION });
    if (fileName === "jueces.html") addActiveCharreadaParam(params);
    logSupportNavigation(fileName, params);
    return `./${fileName}?${params.toString()}`;
  }
  return getGraphicHref(fileName);
}

function getProgramQuickHref(fileName, charreadaId = "") {
  const params = shouldIncludeLiveChannel(fileName)
    ? buildLiveUrlParams()
    : new URLSearchParams({ v: OBS_PAGE_VERSION });
  if (charreadaId) params.set("charreadaId", charreadaId);
  return `./${fileName}?${params.toString()}`;
}

function getAbsolutePageHref(fileName, options = {}) {
  return new URL(getPageHref(fileName, options), window.location.href).href;
}

function getPublicTournamentHref(competitionType = "") {
  const params = new URLSearchParams();
  const tournamentId = getTournamentContext().tournamentId || state.activeTournamentId || "";
  if (tournamentId) params.set("tournamentId", tournamentId);
  if (competitionType) params.set("competition", competitionType);
  params.set("v", PUBLIC_LINKS_PAGE_VERSION);
  return `./torneo-publico.html?${params.toString()}`;
}

function getAbsolutePublicTournamentHref(competitionType = "") {
  return new URL(getPublicTournamentHref(competitionType), window.location.href).href;
}

function buildLiveUrlParams() {
  const params = new URLSearchParams({ v: OBS_PAGE_VERSION });
  const tournamentId = getTournamentContext().tournamentId || state.activeTournamentId || "";
  if (tournamentId) params.set("tournamentId", tournamentId);
  return params;
}

function addActiveCharreadaParam(params) {
  const tournamentId = params.get("tournamentId") || "";
  if (!tournamentId) return;
  const tournament = state.tournaments.find((item) => item.id === tournamentId) || { id: tournamentId };
  const resolution = resolveActiveScoringCharreada(getTournamentCharreadas(tournamentId), tournament);
  if (resolution.id) params.set("charreadaId", resolution.id);
}

function logSupportNavigation(fileName, params) {
  const tournamentId = params.get("tournamentId") || "";
  if (fileName === "locutores.html") {
    console.info("[navigation] abriendo locutores con tournamentId:", tournamentId);
  }
  if (fileName === "jueces.html") {
    console.info("[navigation] abriendo jueces con tournamentId:", tournamentId);
  }
}

function shouldIncludeLiveChannel(fileName, options = {}) {
  if (options.live === true) return true;
  if (options.live === false) return false;
  if (/^grafico-.*\.html$/.test(fileName)) return true;
  return [
    "cronometro.html",
    "cronometro-pantalla.html",
    "formato-federacion.html",
    "graficos.html",
    "jueces.html",
    "locutores.html",
    "obs.html",
    "supervision.html"
  ].includes(fileName);
}

function readSidebarPreference() {
  try {
    const saved = localStorage.getItem(scopedStorageKey(SIDEBAR_STORAGE_KEY));
    if (saved !== null) return saved === "1";
  } catch {
    return false;
  }

  return window.matchMedia?.("(max-width: 980px)").matches || false;
}

function saveSidebarPreference() {
  try {
    localStorage.setItem(scopedStorageKey(SIDEBAR_STORAGE_KEY), sidebarCollapsed ? "1" : "0");
  } catch {
    // La preferencia visual no debe bloquear el uso de la app.
  }
}

function readTurnPanelPreference() {
  try {
    return localStorage.getItem(scopedStorageKey(TURN_PANEL_STORAGE_KEY)) === "1";
  } catch {
    return false;
  }
}

function saveTurnPanelPreference() {
  try {
    localStorage.setItem(scopedStorageKey(TURN_PANEL_STORAGE_KEY), turnPanelCollapsed ? "1" : "0");
  } catch {
    // La preferencia visual no debe bloquear el uso de la app.
  }
}

function readTeamsTabPreference() {
  try {
    return localStorage.getItem(scopedStorageKey(TEAMS_TAB_STORAGE_KEY)) || "quick";
  } catch {
    return "quick";
  }
}

function saveTeamsTabPreference() {
  try {
    localStorage.setItem(scopedStorageKey(TEAMS_TAB_STORAGE_KEY), teamsTab);
  } catch {
    // La preferencia visual no debe bloquear el uso de la app.
  }
}

function readScoringAccordionPreference() {
  const defaults = Object.fromEntries(SCORING_BUTTON_GROUPS.map((group) => [group.id, Boolean(group.defaultOpen)]));
  defaults.summary = false;

  try {
    const saved = sessionStorage.getItem(scopedStorageKey(SCORING_ACCORDION_STORAGE_KEY));
    const parsed = saved ? JSON.parse(saved) : {};
    const migrated = {
      ...parsed,
      quickActions: parsed.quickActions ?? parsed.mostUsed ?? defaults.quickActions
    };
    const nextState = { ...defaults, ...migrated };
    nextState.quickActions = true;
    return nextState;
  } catch {
    return defaults;
  }
}

function saveScoringAccordionPreference() {
  try {
    sessionStorage.setItem(scopedStorageKey(SCORING_ACCORDION_STORAGE_KEY), JSON.stringify(scoringAccordionState));
  } catch {
    // La preferencia visual no debe bloquear la captura.
  }
}

function isScoringAccordionOpen(groupId) {
  if (groupId === "quickActions") return true;
  if (Object.prototype.hasOwnProperty.call(scoringAccordionState, groupId)) {
    return Boolean(scoringAccordionState[groupId]);
  }
  const group = SCORING_BUTTON_GROUPS.find((item) => item.id === groupId);
  return Boolean(group?.defaultOpen);
}

function readFirebaseClientId() {
  try {
    const saved = localStorage.getItem(scopedStorageKey(FIREBASE_CLIENT_ID_KEY));
    if (saved) return saved;
    const created = uid("cliente");
    localStorage.setItem(scopedStorageKey(FIREBASE_CLIENT_ID_KEY), created);
    return created;
  } catch {
    return uid("cliente");
  }
}

function clearStaleLocalTournamentCache() {
  try {
    const versionKey = scopedStorageKey(APP_CACHE_VERSION_STORAGE_KEY);
    const savedVersion = localStorage.getItem(versionKey);
    if (savedVersion === OBS_PAGE_VERSION) return;
    localStorage.setItem(versionKey, OBS_PAGE_VERSION);
    saveState({ silent: true });
  } catch {
    // Si el navegador no permite limpiar cache, Firebase seguira siendo la fuente al sincronizar.
  }
}

function subscribeFirebaseAccess() {
  if (firebaseAccessUnsubscribe) return;
  firebaseAccessUnsubscribe = subscribeFirebaseAuthSession((session) => {
    firebaseAccess = {
      ...session,
      ready: true
    };
    if (isPreparationComplete()) {
      startFirebaseAppStateSubscription();
      startFirebaseUsersSubscription();
      startFirebaseStatHistorySubscription();
      subscribeGlobalScoringButtonLayoutUpdates();
    }
    render({ preserveScoringScroll: state.view === "scoring" });
  });
}

function startFirebaseUsersSubscription() {
  if (!roleCan(firebaseAccess.role, "users") || !isActiveAccessSession(firebaseAccess)) {
    if (firebaseUsersUnsubscribe) firebaseUsersUnsubscribe();
    firebaseUsersUnsubscribe = null;
    firebaseUsers = [];
    return;
  }

  if (firebaseUsersUnsubscribe) return;
  firebaseUsersUnsubscribe = subscribeFirebaseUsers((users) => {
    firebaseUsers = users;
    if (state.view === "users") render();
  });
}

function startFirebaseStatHistorySubscription() {
  if (!isActiveAccessSession(firebaseAccess)) {
    if (firebaseStatHistoryUnsubscribe) firebaseStatHistoryUnsubscribe();
    firebaseStatHistoryUnsubscribe = null;
    return;
  }

  if (firebaseStatHistoryUnsubscribe) return;
  firebaseStatHistoryUnsubscribe = subscribeFirebaseStatHistory((records = []) => {
    state.statHistorySnapshots = records;
    saveState({ silent: true });
    if (["history", "globalStats"].includes(state.view)) render();
  });
}

function renderAccessWidget() {
  if (!firebaseAccess.ready) {
    return html`<span class="access-badge muted">Conectando acceso</span>`;
  }

  if (!firebaseAccess.user) {
    return html`
      <button class="button small" data-action="show-access-login">Entrar</button>
      <span class="access-badge muted">Sin sesion</span>
    `;
  }

  if (!isActiveAccessSession(firebaseAccess)) {
    return html`
      <button class="button small" data-action="show-access-login">Cambiar</button>
      <span class="access-badge red">Sin rol activo</span>
    `;
  }

  return html`
    <span class="access-badge green">
      ${escapeHTML(getRoleLabel(firebaseAccess.role))}
    </span>
    <button class="button small" data-action="sign-out-access">Salir</button>
  `;
}

function getAccessStatusText() {
  if (!firebaseAccess.ready) return "Conectando acceso";
  if (!firebaseAccess.user) return "Sin sesion";
  if (!isActiveAccessSession(firebaseAccess)) return `Sin rol activo: ${firebaseAccess.email || "usuario"}`;
  return `Rol: ${getRoleLabel(firebaseAccess.role)}`;
}

function showAccessLoginModal() {
  showModal({
    title: "Acceso CharroPro",
    body: html`
      <form id="access-login-form" class="form-grid">
        <div class="wide">
          <label>Correo</label>
          <input name="email" type="email" required autocomplete="username" placeholder="correo@ejemplo.com">
        </div>
        <div class="wide">
          <label>Contrasena</label>
          <input name="password" type="password" required autocomplete="current-password" placeholder="Contrasena">
        </div>
        <div class="wide access-help">
          <strong>Roles disponibles</strong>
          <p>Supervisor administra usuarios. Operador maneja evento. Juez califica. Locutor consulta narracion. Graficos prepara OBS. Organizador consulta sin modificar.</p>
        </div>
      </form>
    `,
    actions: html`<button class="button primary" data-action="sign-in-access">Entrar</button>`
  });
}

async function signInAccess() {
  const form = document.getElementById("access-login-form");
  if (!form?.reportValidity()) return;
  const data = new FormData(form);
  const result = await signInFirebaseUser(String(data.get("email") || "").trim(), String(data.get("password") || ""));
  if (!result.ok) {
    showToast(formatFirebaseAuthError(result.reason));
    return;
  }

  firebaseAccess = {
    ...result.session,
    ready: true
  };
  closeModal();
  showToast(`Acceso: ${getRoleLabel(firebaseAccess.role)}.`);
  if (isPreparationComplete()) {
    startFirebaseAppStateSubscription();
    startFirebaseUsersSubscription();
    startFirebaseStatHistorySubscription();
    subscribeGlobalScoringButtonLayoutUpdates();
    if (routeUserAfterLogin(firebaseAccess)) return;
  }
  render({ preserveScoringScroll: state.view === "scoring" });
}

async function signOutAccess() {
  const result = await signOutFirebaseUser();
  if (!result.ok) {
    showToast("No se pudo cerrar la sesion.");
    return;
  }

  firebaseAccess = {
    ready: true,
    user: null,
    uid: "",
    email: "",
    name: "",
    role: ROLES.SIN_ACCESO,
    active: false
  };
  if (firebaseAppStateUnsubscribe) firebaseAppStateUnsubscribe();
  if (firebaseTournamentStateUnsubscribe) firebaseTournamentStateUnsubscribe();
  if (firebaseUsersUnsubscribe) firebaseUsersUnsubscribe();
  if (firebaseStatHistoryUnsubscribe) firebaseStatHistoryUnsubscribe();
  if (globalScoringLayoutsUnsubscribe) globalScoringLayoutsUnsubscribe();
  firebaseAppStateUnsubscribe = null;
  firebaseTournamentStateUnsubscribe = null;
  firebaseTournamentStateId = "";
  firebaseUsersUnsubscribe = null;
  firebaseStatHistoryUnsubscribe = null;
  globalScoringLayoutsUnsubscribe = null;
  firebaseUsers = [];
  showToast("Sesion cerrada.");
  render({ preserveScoringScroll: state.view === "scoring" });
}

function formatFirebaseAuthError(reason = "") {
  if (reason.includes("auth/invalid-credential") || reason.includes("auth/wrong-password")) return "Correo o contrasena incorrectos.";
  if (reason.includes("auth/user-not-found")) return "Ese usuario no existe en Firebase.";
  if (reason.includes("auth/operation-not-allowed")) return "Activa Email/Password en Firebase Authentication.";
  if (reason.includes("permission_denied")) return "Tu usuario no tiene permisos en Firebase.";
  return "No se pudo iniciar sesion.";
}

function getAccessActor() {
  return {
    uid: firebaseAccess.uid,
    email: firebaseAccess.email,
    name: firebaseAccess.name,
    role: firebaseAccess.role,
    clientId: firebaseClientId
  };
}

function isJudgeAccess() {
  return isActiveAccessSession(firebaseAccess) && firebaseAccess.role === ROLES.JUEZ;
}

function logJudgeScore(message, detail) {
  if (!isJudgeAccess()) return;
  if (detail === undefined) console.info(`[score][juez] ${message}`);
  else console.info(`[score][juez] ${message}`, detail);
}

function setScoreSaveStatus(next = {}) {
  lastScoreSaveStatus = {
    ...lastScoreSaveStatus,
    ...next
  };
}

function resetScoreSaveStatusForDraft() {
  setScoreSaveStatus({
    state: "connected",
    label: "Conectado",
    detail: "",
    savedAtMs: 0,
    scoreId: ""
  });
}

function formatScoreSaveTime(value = Date.now()) {
  try {
    return new Date(value).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return "";
  }
}

function isPermissionFailure(result = {}) {
  const raw = `${result.reason || ""} ${result.detail?.error?.code || ""} ${result.detail?.error?.message || ""}`.toLowerCase();
  return raw.includes("permission");
}

function setLastFirebaseError(reason = "", detail = "") {
  lastFirebaseError = reason ? `${reason}${detail ? ` / ${detail}` : ""}` : "";
}

function formatDeleteTournamentError(result = {}) {
  const reason = String(result.reason || "").trim();
  const messages = {
    "not-authenticated": "Inicia sesion antes de eliminar un torneo.",
    "missing-profile": "Tu cuenta no tiene perfil en charropro/users. Revisa Usuarios en Firebase.",
    "inactive-user": "Tu usuario esta inactivo. Activalo antes de borrar torneos.",
    "not-supervisor": "Solo un usuario con rol Supervisor puede eliminar torneos definitivamente.",
    "missing-supervisor": "Solo un usuario con rol Supervisor puede eliminar torneos definitivamente.",
    "permission-denied": "Firebase rechazo el borrado. Despliega las reglas nuevas y confirma que eres Supervisor.",
    "missing-tournament": "No se encontro el ID del torneo a eliminar.",
    "missing-firebase": "Firebase no esta configurado para esta version."
  };

  return messages[reason] || `No se pudo borrar el torneo. Motivo: ${reason || "error desconocido"}.`;
}

function clearLocalCacheAndReload() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LIVE_TIMER_KEY);
    localStorage.removeItem(scopedStorageKey(APP_CACHE_VERSION_STORAGE_KEY));
  } catch (error) {
    setLastFirebaseError("local-cache-error", error.message || "");
  }
  window.location.reload();
}

function readPrepareState() {
  try {
    return JSON.parse(sessionStorage.getItem(scopedStorageKey(PREPARE_STORAGE_KEY)) || "{}") || {};
  } catch {
    return {};
  }
}

function savePrepareState() {
  try {
    sessionStorage.setItem(scopedStorageKey(PREPARE_STORAGE_KEY), JSON.stringify(prepareState || {}));
  } catch {
    // Si sessionStorage falla, la puerta sigue viva en memoria.
  }
}

function readFirebaseDiagnostics() {
  try {
    return JSON.parse(localStorage.getItem(scopedStorageKey(`${PREPARE_STORAGE_KEY}_diagnostics`)) || "{}") || {};
  } catch {
    return {};
  }
}

function saveFirebaseDiagnostics() {
  try {
    localStorage.setItem(scopedStorageKey(`${PREPARE_STORAGE_KEY}_diagnostics`), JSON.stringify(firebaseDiagnostics || {}));
  } catch {
    // El diagnostico no debe bloquear la operacion.
  }
}

function shouldRequirePreparation() {
  return isActiveAccessSession(firebaseAccess);
}

function isPreparationComplete() {
  return Boolean(
    shouldRequirePreparation() &&
      prepareState.uid === firebaseAccess.uid &&
      prepareState.version === OBS_PAGE_VERSION &&
      prepareState.step1 &&
      prepareState.step2
  );
}

function queuePreparationGate() {
  if (!shouldRequirePreparation() || isPreparationComplete()) return;
  window.setTimeout(() => showPreparationModal(), 0);
}

function showPreparationModal() {
  if (!shouldRequirePreparation() || isPreparationComplete()) return;
  const step1Done = prepareState.uid === firebaseAccess.uid && prepareState.version === OBS_PAGE_VERSION && prepareState.step1;
  const step2Done = step1Done && prepareState.step2;

  showModal({
    title: "Preparar CharroPro",
    body: html`
      <div class="grid prepare-gate">
        <p class="card-subtitle">Antes de trabajar, prepara este dispositivo para usar la informacion mas reciente.</p>
        <article class="prepare-step ${step1Done ? "complete" : ""}">
          <strong>Paso 1</strong>
          <p>Limpiar datos temporales guardados en este dispositivo. No cierra sesion ni borra nada remoto.</p>
          <button class="button ${step1Done ? "green" : "primary"}" data-action="prepare-clear-cache">
            ${step1Done ? "Cache local limpiada" : "1. Limpiar cache local"}
          </button>
        </article>
        <article class="prepare-step ${step2Done ? "complete" : ""}">
          <strong>Paso 2</strong>
          <p>Leer usuarios, torneos y asignaciones autorizadas desde CharroPro.</p>
          <button class="button ${step2Done ? "green" : "primary"}" data-action="prepare-sync" ${step1Done ? "" : "disabled"}>
            ${step2Done ? "CharroPro sincronizado" : "2. Sincronizar con CharroPro"}
          </button>
        </article>
        ${lastSyncError ? html`<p class="pill red">Ultimo error: ${escapeHTML(lastSyncError)}</p>` : ""}
      </div>
    `,
    actions: html`
      <span class="card-subtitle">${step2Done ? "CharroPro sincronizado correctamente." : "Completa los dos pasos para continuar."}</span>
    `
  });

  const closeButton = document.querySelector('#modal-root [data-action="close-modal"]');
  if (closeButton) {
    closeButton.disabled = true;
    closeButton.textContent = "Obligatorio";
  }
}

function prepareClearLocalCache() {
  try {
    console.info("[prepare-22C] cleaning local state");
    const tournamentId = getPreparationTargetTournamentId();
    stopPreparationSubscriptions();
    clearTournamentSandboxStorage(tournamentId);
    loadState(tournamentId);
    prepareState = {
      uid: firebaseAccess.uid,
      version: OBS_PAGE_VERSION,
      step1: true,
      step2: false,
      clearedAt: new Date().toISOString()
    };
    lastSyncError = "";
    savePrepareState();
    showToast("Cache local limpiada.");
  } catch (error) {
    lastSyncError = error.message || "No se pudo limpiar cache local.";
    setLastFirebaseError("prepare-cache-error", lastSyncError);
  }
  showPreparationModal();
}

async function prepareSyncWithCharroPro() {
  const step1Ready = prepareState.uid === firebaseAccess.uid && prepareState.version === OBS_PAGE_VERSION && prepareState.step1;
  if (!step1Ready) {
    showToast("Primero limpia la cache local.");
    return;
  }

  const tournamentId = getPreparationTargetTournamentId();
  console.info("[prepare-22C] restoring tournament", { tournamentId });
  const result = await readFirebasePreparationSnapshot(firebaseAccess);
  if (!result.ok) {
    lastSyncError = formatPreparationError(result.reason);
    setLastFirebaseError(result.reason || "prepare-sync-error", result.detail?.error?.message || "");
    showToast(lastSyncError);
    showPreparationModal();
    return;
  }

  console.info("[prepare-22C] firebase synchronized", {
    tournaments: Object.keys(result.tournaments || {}).length
  });
  applyPreparationSnapshot(result);
  const syncedAt = result.syncedAt || new Date().toISOString();
  prepareState = {
    ...prepareState,
    uid: firebaseAccess.uid,
    version: OBS_PAGE_VERSION,
    step1: true,
    step2: true,
    syncedAt
  };
  state.settings.lastPreparationSyncAt = syncedAt;
  lastSyncError = "";
  try {
    localStorage.setItem(scopedStorageKey(APP_CACHE_VERSION_STORAGE_KEY), OBS_PAGE_VERSION);
  } catch {
    // Si el navegador no deja escribir la marca, el estado principal sigue guardandose.
  }
  savePrepareState();
  saveState({ silent: true });
  startFirebaseAppStateSubscription();
  startFirebaseUsersSubscription();
  startFirebaseStatHistorySubscription();
  subscribeExternalTimerControl();
  subscribeGlobalRuleOverridesUpdates();
  subscribeGlobalScoringButtonLayoutUpdates();
  closeModal();
  console.info("[prepare-22C] ready", { tournamentId: state.activeTournamentId || "" });
  showToast("CharroPro sincronizado correctamente.");
  if (routeUserAfterLogin(firebaseAccess)) return;
  render({ preserveScoringScroll: state.view === "scoring" });
}

function getPreparationTargetTournamentId() {
  const contextId = getTournamentContext().tournamentId || "";
  if (contextId) return contextId;
  const access = normalizeTournamentAccess(firebaseAccess);
  if (access.tournamentAccess === "selected" && access.tournamentIds?.length === 1) return access.tournamentIds[0];
  return "";
}

function stopPreparationSubscriptions() {
  if (firebaseAppStateUnsubscribe) firebaseAppStateUnsubscribe();
  if (firebaseTournamentStateUnsubscribe) firebaseTournamentStateUnsubscribe();
  stopFirebaseScoresSubscription();
  firebaseAppStateUnsubscribe = null;
  firebaseAppStateSubscriptionKey = "";
  firebaseTournamentStateUnsubscribe = null;
  firebaseTournamentStateId = "";
  firebaseDiagnostics = {};
  lastRemoteAppStateAt = 0;
  lastRemoteTournamentStateAt = 0;
}

function routeUserAfterLogin(profile = firebaseAccess) {
  if (!isActiveAccessSession(profile)) return false;
  const tournamentId = resolvePostLoginTournamentId(profile);

  if (!tournamentId) {
    state.activeTournamentId = null;
    state.activeCharreadaId = null;
    state.view = "tournaments";
    saveState({ silent: true });
    console.info("[route] usuario sin torneo asignado", {
      uid: profile.uid || "",
      role: profile.role || ""
    });
    render();
    return true;
  }

  const href = buildTournamentUrl("torneo.html", tournamentId, { view: "dashboard" });
  console.info("[route] usuario enviado a panel del torneo", {
    uid: profile.uid || "",
    role: profile.role || "",
    tournamentId,
    href
  });

  if (IS_TOURNAMENT_APP) {
    setTournamentContext(tournamentId, "post-login");
    state.activeTournamentId = tournamentId;
    state.view = "dashboard";
    saveState({ silent: true });
    render();
    return true;
  }

  window.location.href = href;
  return true;
}

function resolvePostLoginTournamentId(profile = firebaseAccess) {
  const currentTournamentId = getTournamentContext().tournamentId || state.activeTournamentId || "";
  if (currentTournamentId && canAccessOperationalTournament(profile, currentTournamentId)) return currentTournamentId;

  const selectedIds = normalizeTournamentAccess(profile).tournamentIds || [];
  const selectedTournament = selectedIds
    .map((id) => state.tournaments.find((tournament) => tournament.id === id))
    .find((tournament) => tournament && canAccessOperationalTournament(profile, tournament.id));
  if (selectedTournament?.id) return selectedTournament.id;

  const visibleTournament = state.tournaments.find((tournament) => canAccessOperationalTournament(profile, tournament.id));
  return visibleTournament?.id || "";
}

function canAccessOperationalTournament(profile = firebaseAccess, tournamentId = "") {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  return Boolean(tournament && isOperationalTournament(tournament) && hasTournamentAccess(profile, tournamentId));
}

function formatPreparationError(reason = "") {
  const messages = {
    "not-authenticated": "Inicia sesion antes de sincronizar.",
    "missing-profile": "Tu usuario no tiene perfil activo en CharroPro.",
    "inactive-user": "Tu usuario esta inactivo.",
    "permission-denied": "Tu usuario no tiene permiso para leer esta informacion.",
    "missing-firebase": "CharroPro no esta configurado para sincronizar."
  };
  return messages[reason] || `No se pudo sincronizar CharroPro: ${reason || "error desconocido"}.`;
}

function applyPreparationSnapshot(snapshot = {}) {
  const targetTournamentId = getPreparationTargetTournamentId();
  const tournaments = (snapshot.tournamentIndex || [])
    .filter((tournament) => !targetTournamentId || tournament.id === targetTournamentId);
  const remoteIds = new Set(tournaments.map((tournament) => tournament.id).filter(Boolean));
  state.tournaments = tournaments.map((tournament) => {
    const local = state.tournaments.find((item) => item.id === tournament.id) || {};
    return { ...local, ...tournament };
  });

  Object.values(snapshot.tournaments || {}).forEach((payload) => {
    const remoteState = payload?.state;
    const tournamentId = remoteState?.tournament?.id || remoteState?.activeTournamentId || "";
    if (targetTournamentId && tournamentId !== targetTournamentId) return;
    if (!remoteState || !tournamentId) return;
    const remoteActiveCharreadaId = getRemoteStateActiveCharreadaId(remoteState);
    rememberRemoteActiveCharreada(tournamentId, remoteActiveCharreadaId);
    upsertStateItem(state.tournaments, {
      ...remoteState.tournament,
      activeCharreadaId: remoteActiveCharreadaId || remoteState.tournament?.activeCharreadaId || ""
    });
    replaceTournamentItems("teams", tournamentId, remoteState.teams || []);
    replaceTournamentItems("charreadas", tournamentId, remoteState.charreadas || []);
    replaceTournamentScores(tournamentId, remoteState.scores || {});
    replaceTournamentPublishedScores(tournamentId, remoteState.publishedScores || []);
    replaceTournamentHistory(tournamentId, remoteState.history || remoteState.statHistorySnapshots || []);
    mergeTournamentSettings(remoteState.settings || {}, tournamentId);
    if (remoteState.liveTimer && (!targetTournamentId || targetTournamentId === tournamentId)) state.liveTimer = remoteState.liveTimer;
    if (remoteState.lastPublishedScore && (!targetTournamentId || targetTournamentId === tournamentId)) state.lastPublishedScore = remoteState.lastPublishedScore;
  });

  clearPortalTournamentDetailCache(remoteIds);
  const nextActiveTournamentId = targetTournamentId && remoteIds.has(targetTournamentId)
    ? targetTournamentId
    : state.activeTournamentId && remoteIds.has(state.activeTournamentId)
      ? state.activeTournamentId
      : state.tournaments[0]?.id || null;
  const activeChanged = state.activeTournamentId !== nextActiveTournamentId;
  state.activeTournamentId = nextActiveTournamentId;
  const preparedActive = resolveCanonicalActiveCharreada(
    nextActiveTournamentId,
    firebaseDiagnostics.activeCharreadaIds?.[nextActiveTournamentId] || "",
    state.activeCharreadaId
  );
  console.info("[active-charreada] source:", {
    tournamentId: nextActiveTournamentId || "",
    activeCharreadaId: preparedActive.id || "",
    source: preparedActive.source || "none"
  });
  if (state.activeCharreadaId !== preparedActive.id) {
    console.info("[active-charreada] changed:", {
      tournamentId: nextActiveTournamentId || "",
      previousId: state.activeCharreadaId || "",
      activeCharreadaId: preparedActive.id || ""
    });
  }
  state.activeCharreadaId = preparedActive.id;
  if (state.activeCharreadaId) setCanonicalActiveCharreada(state.activeCharreadaId, { source: "prepare-snapshot" });
  if (activeChanged) resetScoringPointer();
  firebaseDiagnostics = buildPreparationDiagnostics(snapshot, targetTournamentId);
  saveFirebaseDiagnostics();
}

function resolvePreparedActiveCharreadaId(tournamentId = "") {
  if (!tournamentId) return null;
  const remoteActiveCharreadaId = firebaseDiagnostics.activeCharreadaIds?.[tournamentId] || "";
  const charreadas = getTournamentCharreadas(tournamentId);
  if (remoteActiveCharreadaId && charreadas.some((charreada) => charreada.id === remoteActiveCharreadaId)) return remoteActiveCharreadaId;
  if (state.activeCharreadaId && charreadas.some((charreada) => charreada.id === state.activeCharreadaId)) return state.activeCharreadaId;
  return charreadas[0]?.id || null;
}

function buildPreparationDiagnostics(snapshot = {}, targetTournamentId = "") {
  const remoteCounts = {};
  const remoteVersions = {};
  const activeCharreadaIds = {};
  Object.entries(snapshot.tournaments || {}).forEach(([tournamentId, payload]) => {
    if (targetTournamentId && tournamentId !== targetTournamentId) return;
    const remoteState = payload?.state || {};
    remoteVersions[tournamentId] = Number(payload.version || 0);
    const activeCharreadaId = getRemoteStateActiveCharreadaId(remoteState);
    if (activeCharreadaId) activeCharreadaIds[tournamentId] = activeCharreadaId;
    remoteCounts[tournamentId] = {
      teams: Array.isArray(remoteState.teams) ? remoteState.teams.length : 0,
      charreadas: Array.isArray(remoteState.charreadas) ? remoteState.charreadas.length : 0,
      scores: countRecordItems(remoteState.scores),
      publishedScores: Array.isArray(remoteState.publishedScores) ? remoteState.publishedScores.length : 0
    };
  });

  return {
    uid: snapshot.profile?.uid || firebaseAccess.uid || "",
    email: snapshot.profile?.email || firebaseAccess.email || "",
    role: snapshot.profile?.role || firebaseAccess.role || "",
    syncedAt: snapshot.syncedAt || new Date().toISOString(),
    remoteCounts,
    remoteVersions,
    activeCharreadaIds,
    localVersions: { ...remoteVersions },
    lastError: ""
  };
}

function getRemoteStateActiveCharreadaId(remoteState = {}) {
  return String(
    remoteState.activeCharreadaId ||
      remoteState.meta?.activeCharreadaId ||
      remoteState.info?.activeCharreadaId ||
      remoteState.tournamentState?.activeCharreadaId ||
      remoteState.tournament?.activeCharreadaId ||
      ""
  ).trim();
}

function rememberRemoteActiveCharreada(tournamentId, charreadaId) {
  if (!tournamentId) return;
  firebaseDiagnostics.activeCharreadaIds = firebaseDiagnostics.activeCharreadaIds || {};
  if (charreadaId) firebaseDiagnostics.activeCharreadaIds[tournamentId] = charreadaId;
  else delete firebaseDiagnostics.activeCharreadaIds[tournamentId];
}

function resolveCanonicalActiveCharreada(tournamentId = state.activeTournamentId, preferredId = "", fallbackId = "") {
  const charreadas = getTournamentCharreadas(tournamentId);
  const byId = new Map(charreadas.map((charreada) => [charreada.id, charreada]));
  const candidates = [
    { id: preferredId, source: "remote" },
    { id: firebaseDiagnostics.activeCharreadaIds?.[tournamentId], source: "diagnostics" },
    { id: getTournamentActiveCharreadaId(state.tournaments.find((item) => item.id === tournamentId) || {}), source: "tournament" },
    { id: fallbackId, source: "state" },
    { id: state.activeCharreadaId, source: "state" }
  ];

  for (const candidate of candidates) {
    const id = String(candidate.id || "").trim();
    if (id && byId.has(id)) return { id, charreada: byId.get(id), source: candidate.source };
  }

  const liveCharreadas = charreadas.filter((charreada) => String(charreada.status || "") === "en_vivo");
  if (liveCharreadas.length === 1) return { id: liveCharreadas[0].id, charreada: liveCharreadas[0], source: "status-fallback" };
  return { id: charreadas[0]?.id || null, charreada: charreadas[0] || null, source: charreadas[0] ? "first-charreada" : "none" };
}

function setCanonicalActiveCharreada(charreadaId, options = {}) {
  const targetCharreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!targetCharreada) return { id: "", previousId: state.activeCharreadaId || "", changed: false };
  const tournamentId = targetCharreada.tournamentId || state.activeTournamentId || "";
  const previousId = state.activeCharreadaId || "";
  const source = options.source || "local";

  console.info("[active-charreada] source:", { tournamentId, charreadaId, source });
  state.activeCharreadaId = targetCharreada.id;
  state.charreadas.forEach((charreada) => {
    if (charreada.tournamentId !== tournamentId) return;
    if (charreada.id === targetCharreada.id) {
      if (charreada.status !== "congelada") charreada.status = "en_vivo";
      return;
    }
    if (String(charreada.status || "") === "en_vivo") charreada.status = "programada";
  });
  upsertStateItem(state.tournaments, {
    ...(state.tournaments.find((item) => item.id === tournamentId) || { id: tournamentId }),
    activeCharreadaId: targetCharreada.id
  });
  rememberRemoteActiveCharreada(tournamentId, targetCharreada.id);

  const changed = previousId !== targetCharreada.id;
  if (changed) console.info("[active-charreada] changed:", { tournamentId, previousId, activeCharreadaId: targetCharreada.id });
  return { id: targetCharreada.id, previousId, changed };
}

function getCanonicalCharreadaStatus(charreada = {}, activeCharreadaId = "") {
  if (!charreada?.id) return "programada";
  if (String(charreada.id) === String(activeCharreadaId || state.activeCharreadaId || "")) return "en_vivo";
  const status = String(charreada.status || "programada");
  return status === "en_vivo" ? "programada" : status;
}

function logActiveCharreadaUiUpdated(tournamentId = state.activeTournamentId, activeCharreadaId = state.activeCharreadaId) {
  console.info("[active-charreada] ui updated:", {
    tournamentId: tournamentId || "",
    activeCharreadaId: activeCharreadaId || ""
  });
}

function countRecordItems(value) {
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).filter((item) => item !== null && item !== undefined).length;
}

function getLocalTournamentDiagnostics(tournamentId) {
  const charreadas = getTournamentCharreadas(tournamentId);
  const teams = getTournamentTeams(tournamentId);
  const charreadaIds = new Set(charreadas.map((charreada) => charreada.id));
  const teamIds = new Set(teams.map((team) => team.id));
  return {
    teams: teams.length,
    charreadas: charreadas.length,
    scores: Object.keys(state.scores || {}).filter((key) => scoreKeyBelongsToTournament(key, charreadaIds, teamIds)).length,
    publishedScores: (state.publishedScores || []).filter((score) => (score.tournament?.id || score.tournamentId || "") === tournamentId).length
  };
}

function getLocalTournamentVersion(tournamentId) {
  return Number(firebaseDiagnostics.localVersions?.[tournamentId] || 0);
}

function setLocalTournamentVersion(tournamentId, version) {
  if (!tournamentId || !version) return;
  firebaseDiagnostics.localVersions = firebaseDiagnostics.localVersions || {};
  firebaseDiagnostics.remoteVersions = firebaseDiagnostics.remoteVersions || {};
  firebaseDiagnostics.localVersions[tournamentId] = Number(version || 0);
  firebaseDiagnostics.remoteVersions[tournamentId] = Math.max(Number(firebaseDiagnostics.remoteVersions[tournamentId] || 0), Number(version || 0));
  saveFirebaseDiagnostics();
}

async function guardTournamentRemoteSafety(tournamentId) {
  if (!tournamentId) return { ok: false, reason: "missing-tournament" };
  if (!isPreparationComplete()) return { ok: false, reason: "not-prepared" };

  const remote = await readFirebaseTournamentSafetySnapshot(tournamentId);
  if (!remote.ok) {
    lastSyncError = formatPreparationError(remote.reason);
    setLastFirebaseError(remote.reason || "safety-read-error", remote.detail?.error?.message || "");
    return { ok: false, reason: remote.reason };
  }

  const localCounts = getLocalTournamentDiagnostics(tournamentId);
  const remoteCounts = remote.counts || {};
  firebaseDiagnostics.remoteCounts = firebaseDiagnostics.remoteCounts || {};
  firebaseDiagnostics.remoteVersions = firebaseDiagnostics.remoteVersions || {};
  firebaseDiagnostics.remoteCounts[tournamentId] = remoteCounts;
  firebaseDiagnostics.remoteVersions[tournamentId] = Number(remote.version || 0);
  saveFirebaseDiagnostics();

  const incomplete =
    (localCounts.teams === 0 && Number(remoteCounts.teams || 0) > 0) ||
    (localCounts.charreadas === 0 && Number(remoteCounts.charreadas || 0) > 0) ||
    (localCounts.scores === 0 && Number(remoteCounts.scores || 0) > 0) ||
    (localCounts.publishedScores === 0 && Number(remoteCounts.publishedScores || 0) > 0);

  if (incomplete) return { ok: false, reason: "incomplete-local-data", localCounts, remoteCounts };

  const localVersion = getLocalTournamentVersion(tournamentId);
  if (Number(remote.version || 0) > localVersion) {
    return { ok: false, reason: "stale-version", localVersion, remoteVersion: Number(remote.version || 0) };
  }

  return { ok: true, localCounts, remoteCounts, remoteVersion: Number(remote.version || 0) };
}

function formatSafetyGuardMessage(reason = "") {
  if (reason === "not-prepared") return "Primero prepara CharroPro para trabajar con la informacion mas reciente.";
  if (reason === "incomplete-local-data") return "Este dispositivo no tiene datos completos. Sincroniza con CharroPro antes de guardar.";
  if (reason === "stale-version") return "Hay una version mas reciente en CharroPro. Sincroniza antes de continuar.";
  return "No se pudo validar la informacion remota. Sincroniza con CharroPro antes de continuar.";
}

function canUseAction(action, options = {}) {
  if (action && PREPARATION_REQUIRED_ACTIONS.has(action) && shouldRequirePreparation() && !isPreparationComplete()) {
    showPreparationModal();
    showToast("Primero prepara CharroPro para trabajar con la informacion mas reciente.");
    return false;
  }

  if (!action || READ_ACTIONS.has(action)) return true;
  const capability = ACTION_CAPABILITIES[action] || options.capability || "manage";

  if (isActiveAccessSession(firebaseAccess) && roleCan(firebaseAccess.role, capability)) return true;

  if (!firebaseAccess.ready || !firebaseAccess.user) {
    showAccessLoginModal();
    showToast("Inicia sesion para modificar el evento.");
    return false;
  }

  showToast(`Tu rol ${getRoleLabel(firebaseAccess.role)} no puede hacer esta accion.`);
  return false;
}

function canPublishSharedState() {
  return isActiveAccessSession(firebaseAccess) && roleCan(firebaseAccess.role, "sync");
}

function isSupervisorAccess() {
  return isActiveAccessSession(firebaseAccess) && firebaseAccess.role === ROLES.SUPERVISOR;
}

function enterSupervisorScoringReviewMode() {
  if (!isSupervisorAccess()) return;
  if (!supervisorScoringReviewMode || supervisorLiveControlEnabled) {
    supervisorScoringReviewMode = true;
    supervisorLiveControlEnabled = false;
    console.info("[supervisor] modo revisión activo; no se publica en vivo");
  }
}

function exitSupervisorScoringReviewMode() {
  supervisorScoringReviewMode = false;
  supervisorLiveControlEnabled = false;
}

function isSupervisorScoringReviewMode() {
  return isSupervisorAccess() && supervisorScoringReviewMode && !supervisorLiveControlEnabled;
}

function guardSupervisorLivePublish() {
  if (!isSupervisorScoringReviewMode()) return true;
  console.info("[supervisor] modo revisión activo; no se publica en vivo");
  return false;
}

function takeSupervisorLiveControl() {
  if (!isSupervisorAccess()) return;
  if (!supervisorScoringReviewMode) enterSupervisorScoringReviewMode();
  const confirmed = window.confirm("Tomar control en vivo actualizara marcador y graficos OBS con el turno que estas viendo. Continuar?");
  if (!confirmed) return;
  supervisorLiveControlEnabled = true;
  showToast("Control en vivo activado para este supervisor.");
  syncCurrentLiveState({ repeat: true });
  render({ preserveScoringScroll: state.view === "scoring" });
}

function wireFirebaseAppStatePublisher() {
  window.addEventListener("charropro:state", () => {
    if (suppressNextSharedAppStatePublish) {
      suppressNextSharedAppStatePublish = false;
      return;
    }
    queueSharedAppStatePublish();
  });
}

function queueSharedAppStatePublish(delay = 450) {
  if (applyingRemoteAppState || !canPublishSharedState()) return;
  window.clearTimeout(firebaseAppStateTimer);
  firebaseAppStateTimer = window.setTimeout(publishSharedAppState, delay);
}

async function publishSharedAppState() {
  if (!canPublishSharedState()) return { ok: false, reason: "missing-role" };
  const tournamentId = getTournamentContext().tournamentId || state.activeTournamentId || "";
  const actor = getAccessActor();
  if (tournamentId) {
    const guard = await guardTournamentRemoteSafety(tournamentId);
    if (!guard.ok) {
      const message = formatSafetyGuardMessage(guard.reason);
      lastSyncError = message;
      setLastFirebaseError(guard.reason || "safety-block", message);
      showToast(message);
      return { ok: false, reason: guard.reason };
    }
  }
  const result = tournamentId
    ? await publishFirebaseTournamentState(tournamentId, state, actor)
    : { ok: false, reason: "missing-tournament" };
  if (tournamentId) lastTournamentStatePublishAt = Date.now();
  if (result.ok && tournamentId) setLocalTournamentVersion(tournamentId, result.version);
  if (!result.ok && result.reason?.includes("permission_denied")) {
    showToast("Firebase rechazo el guardado. Revisa el rol de este usuario.");
  }
  return result;
}

function startFirebaseAppStateSubscription() {
  if (!isActiveAccessSession(firebaseAccess)) {
    if (firebaseAppStateUnsubscribe) firebaseAppStateUnsubscribe();
    if (firebaseTournamentStateUnsubscribe) firebaseTournamentStateUnsubscribe();
    stopFirebaseScoresSubscription();
    firebaseAppStateUnsubscribe = null;
    firebaseAppStateSubscriptionKey = "";
    firebaseTournamentStateUnsubscribe = null;
    firebaseTournamentStateId = "";
    return;
  }

  if (IS_TOURNAMENT_APP) {
    const tournamentId = getTournamentContext().tournamentId;
    if (firebaseAppStateUnsubscribe) {
      firebaseAppStateUnsubscribe();
      firebaseAppStateUnsubscribe = null;
      firebaseAppStateSubscriptionKey = "";
    }
    if (!tournamentId) return;
    if (firebaseTournamentStateId === tournamentId && firebaseTournamentStateUnsubscribe) {
      startFirebaseScoresSubscription(tournamentId);
      return;
    }
    if (firebaseTournamentStateUnsubscribe) firebaseTournamentStateUnsubscribe();
    firebaseTournamentStateId = tournamentId;
    firebaseTournamentStateUnsubscribe = subscribeFirebaseTournamentState(tournamentId, (payload) => applyRemoteTournamentState(payload));
    startFirebaseScoresSubscription(tournamentId);
    return;
  }

  if (firebaseTournamentStateUnsubscribe) {
    firebaseTournamentStateUnsubscribe();
    firebaseTournamentStateUnsubscribe = null;
    firebaseTournamentStateId = "";
  }
  stopFirebaseScoresSubscription();
  const subscriptionKey = [
    firebaseAccess.uid || "",
    firebaseAccess.role || "",
    firebaseAccess.tournamentAccess || "",
    (firebaseAccess.tournamentIds || []).join("|")
  ].join("::");
  if (firebaseAppStateUnsubscribe && firebaseAppStateSubscriptionKey === subscriptionKey) return;
  if (firebaseAppStateUnsubscribe) firebaseAppStateUnsubscribe();
  firebaseAppStateSubscriptionKey = subscriptionKey;
  firebaseAppStateUnsubscribe = subscribeFirebaseTournamentIndex(
    (tournaments) => applyRemoteTournamentIndex(tournaments),
    firebaseAccess
  );
}

function startFirebaseScoresSubscription(tournamentId) {
  if (!tournamentId || firebaseScoresTournamentId === tournamentId && firebaseScoresUnsubscribe) return;
  stopFirebaseScoresSubscription();
  firebaseScoresTournamentId = tournamentId;
  firebaseDiagnostics.scoresListener = {
    listening: true,
    tournamentId,
    path: `charropro/tournaments/${tournamentId}/scores`,
    count: 0,
    lastScoreId: "",
    lastError: ""
  };
  saveFirebaseDiagnostics();
  firebaseScoresUnsubscribe = subscribeFirebaseScores(tournamentId, applyRemoteScores);
}

function stopFirebaseScoresSubscription() {
  if (firebaseScoresUnsubscribe) firebaseScoresUnsubscribe();
  if (firebaseScoresTournamentId) {
    firebaseDiagnostics.scoresListener = {
      ...(firebaseDiagnostics.scoresListener || {}),
      listening: false,
      tournamentId: firebaseScoresTournamentId
    };
    saveFirebaseDiagnostics();
  }
  firebaseScoresUnsubscribe = null;
  firebaseScoresTournamentId = "";
}

function applyRemoteScores(payload = {}) {
  const tournamentId = payload.tournamentId || getTournamentContext().tournamentId || state.activeTournamentId || "";
  if (!tournamentId) return;

  updateScoresListenerDiagnostics(payload);
  if (payload.error) {
    setLastFirebaseError(payload.reason || "scores-listener-error", payload.error?.message || "");
    if (["settings"].includes(state.view)) render();
    return;
  }

  const scores = payload.scores && typeof payload.scores === "object" ? payload.scores : {};
  const scoreCount = Object.keys(scores).length;
  if (!scoreCount && payload.exists !== false) return;

  applyingRemoteAppState = true;
  replaceTournamentScores(tournamentId, scores, { source: "scores-listener", remoteExists: payload.exists });
  saveState({ silent: true });
  applyingRemoteAppState = false;
  if (isSupervisorAccess() && scoreCount) {
    console.info("[event-test] supervisor recibio score", {
      tournamentId,
      count: scoreCount,
      lastScoreId: payload.lastScoreId || ""
    });
  }

  if (shouldRenderForRemoteScores(tournamentId)) {
    render({ preserveScoringScroll: state.view === "scoring" });
  }
}

function updateScoresListenerDiagnostics(payload = {}) {
  const tournamentId = payload.tournamentId || getTournamentContext().tournamentId || state.activeTournamentId || "";
  const count = Number(payload.count ?? Object.keys(payload.scores || {}).length);
  firebaseDiagnostics.remoteCounts = firebaseDiagnostics.remoteCounts || {};
  if (tournamentId) firebaseDiagnostics.remoteCounts[tournamentId] = {
    ...(firebaseDiagnostics.remoteCounts[tournamentId] || {}),
    scores: count
  };
  firebaseDiagnostics.scoresListener = {
    listening: !payload.error,
    tournamentId,
    path: payload.path || "",
    count,
    lastScoreId: payload.lastScoreId || "",
    lastError: payload.error ? payload.reason || payload.error?.message || "scores-listener-error" : "",
    receivedAtMs: payload.receivedAtMs || Date.now()
  };
  saveFirebaseDiagnostics();
}

function shouldRenderForRemoteScores(tournamentId) {
  const currentTournamentId = getTournamentContext().tournamentId || state.activeTournamentId || "";
  if (currentTournamentId !== tournamentId) return false;
  return ["dashboard", "results", "stats", "scoring", "settings"].includes(state.view);
}

function applyRemoteTournamentIndex(tournaments = []) {
  if (!Array.isArray(tournaments)) return;
  const newest = tournaments.reduce((max, tournament) => Math.max(max, Number(tournament.updatedAtMs || 0)), 0);
  if (newest && newest <= lastRemoteAppStateAt) return;
  applyingRemoteAppState = true;
  lastRemoteAppStateAt = newest || Date.now();
  const remoteIds = new Set(tournaments.map((tournament) => tournament.id).filter(Boolean));
  state.tournaments = tournaments
    .filter((tournament) => tournament?.id)
    .map((tournament) => {
      const local = state.tournaments.find((item) => item.id === tournament.id) || {};
      return { ...local, ...tournament };
    });
  if (state.activeTournamentId && !remoteIds.has(state.activeTournamentId)) {
    state.activeTournamentId = state.tournaments[0]?.id || null;
    state.activeCharreadaId = null;
  }
  if (!IS_TOURNAMENT_APP) clearPortalTournamentDetailCache(remoteIds);
  saveState({ silent: true });
  applyingRemoteAppState = false;
  if (["tournaments", "history", "globalStats"].includes(state.view)) render();
}

function applyRemoteTournamentState(payload = {}) {
  if (payload?.deleted) {
    removeLocalTournamentData(payload.tournamentId || getTournamentContext().tournamentId || state.activeTournamentId);
    saveState({ silent: true });
    render({ preserveScoringScroll: state.view === "scoring" });
    return;
  }

  const remoteState = payload.state;
  const tournamentId = remoteState?.tournament?.id || remoteState?.activeTournamentId || getTournamentContext().tournamentId;
  const updatedAtMs = Number(payload.updatedAtMs || Date.parse(payload.updatedAt || "") || 0);
  const updatedByClient = payload.updatedBy?.clientId || payload.clientId || "";
  if (!remoteState || !tournamentId || updatedByClient === firebaseClientId) return;
  if (updatedAtMs && updatedAtMs <= lastRemoteTournamentStateAt) return;
  if (updatedAtMs && updatedAtMs <= lastTournamentStatePublishAt) return;

  const localView = state.view;
  const localUi = {
    view: localView,
    activeTournamentId: tournamentId,
    activeCharreadaId: state.activeCharreadaId,
    scoringSuerteIdx: state.scoringSuerteIdx,
    scoringTeamIdx: state.scoringTeamIdx,
    scoringAttemptIdx: state.scoringAttemptIdx,
    scoringColeadorIdx: state.scoringColeadorIdx
  };

  applyingRemoteAppState = true;
  lastRemoteTournamentStateAt = updatedAtMs || Date.now();
  const remoteActiveCharreadaId = getRemoteStateActiveCharreadaId(remoteState);
  rememberRemoteActiveCharreada(tournamentId, remoteActiveCharreadaId);
  upsertStateItem(state.tournaments, {
    ...remoteState.tournament,
    activeCharreadaId: remoteActiveCharreadaId || remoteState.tournament?.activeCharreadaId || ""
  });
  replaceTournamentItems("teams", tournamentId, remoteState.teams || []);
  replaceTournamentItems("charreadas", tournamentId, remoteState.charreadas || []);
  replaceTournamentScores(tournamentId, remoteState.scores || {});
  replaceTournamentPublishedScores(tournamentId, remoteState.publishedScores || []);
  replaceTournamentHistory(tournamentId, remoteState.history || remoteState.statHistorySnapshots || []);
  mergeTournamentSettings(remoteState.settings || {}, tournamentId);
  if (remoteState.liveTimer) state.liveTimer = remoteState.liveTimer;
  if (remoteState.lastPublishedScore) state.lastPublishedScore = remoteState.lastPublishedScore;
  const resolvedActiveCharreada = resolveCanonicalActiveCharreada(tournamentId, remoteActiveCharreadaId, localUi.activeCharreadaId);
  localUi.activeCharreadaId = resolvedActiveCharreada.id;
  console.info("[active-charreada] source:", {
    tournamentId,
    activeCharreadaId: resolvedActiveCharreada.id || "",
    source: resolvedActiveCharreada.source || "none"
  });
  if (state.activeCharreadaId !== resolvedActiveCharreada.id) {
    console.info("[active-charreada] changed:", {
      tournamentId,
      previousId: state.activeCharreadaId || "",
      activeCharreadaId: resolvedActiveCharreada.id || ""
    });
  }
  Object.assign(state, localUi);
  if (state.activeCharreadaId) setCanonicalActiveCharreada(state.activeCharreadaId, { source: "remote-state" });
  applyPendingScoringLaunch();
  if (payload.version) setLocalTournamentVersion(tournamentId, payload.version);
  saveState({ silent: true });
  applyingRemoteAppState = false;

  render({ preserveScoringScroll: localView === "scoring" });
  logActiveCharreadaUiUpdated(tournamentId, state.activeCharreadaId);
}

function applyPendingScoringLaunch() {
  if (!IS_TOURNAMENT_APP || !launchRequestedScoring) return;
  const params = new URLSearchParams(window.location.search);
  const charreadaId = params.get("charreada");
  const tournamentId = getTournamentContext().tournamentId || state.activeTournamentId || "";
  const officialResolution = resolveCanonicalActiveCharreada(tournamentId, firebaseDiagnostics.activeCharreadaIds?.[tournamentId] || "", state.activeCharreadaId);
  const targetCharreadaId = firebaseAccess.role === ROLES.JUEZ
    ? officialResolution.id
    : charreadaId || officialResolution.id;
  if (!targetCharreadaId) return;
  if (firebaseAccess.role === ROLES.JUEZ && charreadaId && charreadaId !== targetCharreadaId) {
    console.info("[active-charreada] changed:", {
      tournamentId,
      previousId: charreadaId,
      activeCharreadaId: targetCharreadaId
    });
    showToast("La charreada solicitada no esta activa. Se abrio la charreada activa oficial.");
  }
  const charreada = state.charreadas.find((item) => item.id === targetCharreadaId);
  if (!charreada) return;
  state.activeTournamentId = charreada.tournamentId || getTournamentContext().tournamentId || state.activeTournamentId;
  setCanonicalActiveCharreada(charreada.id, { source: "scoring-launch" });
  state.view = "scoring";
  launchRequestedScoring = false;
}

function upsertStateItem(collection, item) {
  if (!item?.id || !Array.isArray(collection)) return;
  const index = collection.findIndex((entry) => entry.id === item.id);
  if (index >= 0) collection[index] = { ...collection[index], ...item };
  else collection.push(item);
}

function replaceTournamentItems(key, tournamentId, nextItems) {
  if (!Array.isArray(state[key])) state[key] = [];
  state[key] = state[key]
    .filter((item) => item.tournamentId !== tournamentId)
    .concat(nextItems || []);
}

function getProtectedScoringDraft(tournamentId) {
  if (!isScoringDirty || state.view !== "scoring" || !activeScoringDraft?.id) return null;
  if (activeScoringDraft.tournamentId !== tournamentId) return null;
  return activeScoringDraft;
}

function cloneScorePayload(payload) {
  return JSON.parse(JSON.stringify(payload || []));
}

function cloneJson(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function replaceTournamentScores(tournamentId, nextScores, options = {}) {
  const charreadaIds = new Set(getTournamentCharreadas(tournamentId).map((charreada) => charreada.id));
  const teamIds = new Set(getTournamentTeams(tournamentId).map((team) => team.id));
  const protectedDraft = getProtectedScoringDraft(tournamentId);
  Object.keys(state.scores || {}).forEach((key) => {
    if (protectedDraft?.id === key) return;
    if (scoreKeyBelongsToTournament(key, charreadaIds, teamIds)) delete state.scores[key];
  });
  state.scores = {
    ...(state.scores || {}),
    ...(nextScores || {})
  };

  if (protectedDraft) {
    state.scores[protectedDraft.id] = cloneScorePayload(protectedDraft.payload);
    console.info("[scoring] draft protegido; no se aplica remoto sobre formulario activo", {
      source: options.source || "remote",
      scoreId: protectedDraft.id
    });
  }
}

function replaceTournamentPublishedScores(tournamentId, nextPublishedScores) {
  if (!Array.isArray(state.publishedScores)) state.publishedScores = [];
  state.publishedScores = state.publishedScores
    .filter((score) => (score.tournament?.id || score.tournamentId || "") !== tournamentId)
    .concat(nextPublishedScores || []);
}

function replaceTournamentHistory(tournamentId, nextHistory) {
  if (!Array.isArray(state.statHistorySnapshots)) state.statHistorySnapshots = [];
  state.statHistorySnapshots = state.statHistorySnapshots
    .filter((snapshot) => (snapshot.tournament?.id || snapshot.tournamentId || "") !== tournamentId)
    .concat(nextHistory || []);
}

function mergeTournamentSettings(settings = {}, tournamentId = "") {
  state.settings = state.settings || {};
  if (settings.graphicsConfig) state.settings.graphicsConfig = settings.graphicsConfig;
  if (settings.globalRuleOverrides) state.settings.globalRuleOverrides = settings.globalRuleOverrides;
  if (settings.globalRuleOverridesUpdatedAt) state.settings.globalRuleOverridesUpdatedAt = settings.globalRuleOverridesUpdatedAt;
  if (settings.scoringButtonLayouts) {
    const layouts = normalizeScoringButtonLayouts(settings.scoringButtonLayouts);
    state.settings.scoringButtonLayouts = layouts;
    const tournament = state.tournaments.find((item) => item.id === tournamentId);
    if (tournament) tournament.scoringButtonLayouts = layouts;
  }
}

function scoreKeyBelongsToTournament(key, charreadaIds, teamIds) {
  const [charreadaId, teamId] = String(key || "").split("__");
  return charreadaIds.has(charreadaId) && teamIds.has(teamId);
}

function clearPortalTournamentDetailCache(remoteIds = new Set()) {
  state.teams = (state.teams || []).filter((team) => remoteIds.has(team.tournamentId));
  state.charreadas = (state.charreadas || []).filter((charreada) => remoteIds.has(charreada.tournamentId));
  state.publishedScores = (state.publishedScores || []).filter((score) => remoteIds.has(score.tournament?.id || score.tournamentId || ""));

  const charreadaIds = new Set(state.charreadas.map((charreada) => charreada.id));
  const teamIds = new Set(state.teams.map((team) => team.id));
  Object.keys(state.scores || {}).forEach((key) => {
    const [charreadaId, teamId] = String(key || "").split("__");
    if (!charreadaIds.has(charreadaId) || !teamIds.has(teamId)) delete state.scores[key];
  });
}

function removeLocalTournamentData(tournamentId) {
  if (!tournamentId) return;
  const charreadaIds = new Set(state.charreadas.filter((charreada) => charreada.tournamentId === tournamentId).map((charreada) => charreada.id));
  const teamIds = new Set(state.teams.filter((team) => team.tournamentId === tournamentId).map((team) => team.id));
  state.tournaments = state.tournaments.filter((tournament) => tournament.id !== tournamentId);
  state.teams = state.teams.filter((team) => team.tournamentId !== tournamentId);
  state.charreadas = state.charreadas.filter((charreada) => charreada.tournamentId !== tournamentId);
  Object.keys(state.scores || {}).forEach((key) => {
    if (scoreKeyBelongsToTournament(key, charreadaIds, teamIds)) delete state.scores[key];
  });
  state.publishedScores = (state.publishedScores || []).filter((score) => (score.tournament?.id || score.tournamentId || "") !== tournamentId);
  state.statHistorySnapshots = (state.statHistorySnapshots || []).filter((snapshot) => (snapshot.tournament?.id || snapshot.tournamentId || "") !== tournamentId);
  if (state.lastPublishedScore && (state.lastPublishedScore.tournament?.id || state.lastPublishedScore.tournamentId || "") === tournamentId) {
    state.lastPublishedScore = null;
  }
  if (state.activeTournamentId === tournamentId) {
    state.activeTournamentId = state.tournaments[0]?.id || null;
    state.activeCharreadaId = null;
    resetScoringPointer();
  }
}

function renderTournamentPicker() {
  const tournaments = getVisibleTournaments();
  if (!tournaments.length) return "";

  return html`
    <select data-action="select-tournament" aria-label="Torneo activo">
      ${tournaments
        .map(
          (tournament) => html`
            <option value="${tournament.id}" ${tournament.id === state.activeTournamentId ? "selected" : ""}>
              ${escapeHTML(tournament.name)}
            </option>
          `
        )
        .join("")}
    </select>
  `;
}

function renderCurrentView() {
  if (!canAccessCurrentView()) return renderRoleAccessHome();
  if (IS_TOURNAMENT_APP) return renderTournamentAppView();
  if (state.view === "tournaments") return renderTournamentEntry();
  if (state.view === "rulesAdmin") return renderRules("global");
  if (state.view === "users") return renderUsersAdmin();
  if (state.view === "history") return renderHistory();
  if (state.view === "globalStats") return renderGlobalStatsCenter();
  const visibleTournaments = getVisibleTournaments();
  if (!state.tournaments.length) return renderNoTournament();
  if (!visibleTournaments.length) return renderNoAssignedTournaments();
  const activeTournament = getActiveTournament();
  if (!activeTournament || !canAccessTournamentId(state.activeTournamentId) || !isOperationalTournament(activeTournament)) {
    setActiveTournament(visibleTournaments[0].id);
  }
  if (state.view === "graphicsAccess") return renderGraphicsAccess();

  if (state.view === "teams") return renderTeams();
  if (state.view === "officialProgram") return renderOfficialProgram();
  if (state.view === "program") return renderProgram();
  if (state.view === "results") return renderResults();
  if (state.view === "stats") return renderTournamentStatsCenter();
  if (state.view === "recovery") return renderRecoveryCenter();
  if (state.view === "rules") return renderRules();
  if (state.view === "settings") return renderSettings();
  return renderDashboard();
}

function renderTournamentAppView() {
  const tournamentId = getTournamentContext().tournamentId;
  if (!tournamentId) return renderTournamentShellInlineError("Falta ID de torneo", "Abre esta pagina desde el portal general.");
  if (!canAccessTournamentId(tournamentId)) return renderTournamentShellInlineError("Acceso denegado", "Tu usuario no esta asignado a este torneo.");

  const activeTournament = state.tournaments.find((tournament) => tournament.id === tournamentId);
  if (!activeTournament) {
    return renderTournamentShellInlineError("Torneo no encontrado", "El torneo aun no esta disponible en este dispositivo o no existe en Firebase.");
  }

  if (state.activeTournamentId !== tournamentId) state.activeTournamentId = tournamentId;
  if (!isTournamentScopedView(state.view) && state.view !== "scoring") state.view = "dashboard";

  if (state.view === "graphicsAccess") return renderGraphicsAccess();
  if (state.view === "teams") return renderTeams();
  if (state.view === "officialProgram") return renderOfficialProgram();
  if (state.view === "program") return renderProgram();
  if (state.view === "results") return renderResults();
  if (state.view === "stats") return renderTournamentStatsCenter();
  if (state.view === "recovery") return renderRecoveryCenter();
  if (state.view === "rules") return renderRules();
  if (state.view === "settings") return renderSettings();
  return renderDashboard();
}

function renderTournamentShellInlineError(title, message) {
  return html`
    <section class="content">
      <div class="empty">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(message)}</p>
        <a class="button primary" href="./index.html">Volver al portal</a>
      </div>
    </section>
  `;
}

function getVisibleTournaments() {
  return getAccessibleTournaments().filter(isOperationalTournament);
}

function getAccessibleTournaments() {
  if (!isActiveAccessSession(firebaseAccess)) return state.tournaments;
  return state.tournaments.filter((tournament) => hasTournamentAccess(firebaseAccess, tournament.id));
}

function canAccessTournamentId(tournamentId) {
  if (!isActiveAccessSession(firebaseAccess)) return true;
  return hasTournamentAccess(firebaseAccess, tournamentId);
}

function canAccessCurrentView() {
  if (!isActiveAccessSession(firebaseAccess)) return true;
  const role = firebaseAccess.role;
  if (IS_TOURNAMENT_APP) {
    if (role === ROLES.SUPERVISOR || role === ROLES.OPERADOR) return true;
    if (role === ROLES.JUEZ) return [...ROLE_MENU_VIEWS[ROLES.JUEZ], "scoring"].includes(state.view);
    if (ROLE_MENU_VIEWS[role]) return ROLE_MENU_VIEWS[role].includes(state.view);
    return false;
  }
  if (role === ROLES.SUPERVISOR) return true;
  if (role === ROLES.OPERADOR) return state.view !== "users";
  if (role === ROLES.ORGANIZADOR) {
    return !["users", "graphicsAccess", "rules", "rulesAdmin"].includes(state.view);
  }
  if (role === ROLES.LECTURA) {
    return ["tournaments", "globalStats", "dashboard", "officialProgram", "program", "results", "stats", "history", "settings"].includes(state.view);
  }
  if (role === ROLES.LOCUTOR) return ["tournaments", "dashboard", "officialProgram", "results"].includes(state.view);
  if (role === ROLES.JUEZ) return ["tournaments"].includes(state.view);
  if (role === ROLES.GRAFICOS) return ["tournaments", "globalStats", "officialProgram", "graphicsAccess"].includes(state.view);
  return false;
}

function renderRoleAccessHome() {
  if (firebaseAccess.role === ROLES.JUEZ) {
    return renderJudgeTournamentAccessHome();
  }
  if (firebaseAccess.role === ROLES.LOCUTOR) {
    return renderRoleShortcut("Locutores", "Tu acceso esta preparado para consultar informacion de narracion.", getAbsolutePageHref("locutores.html"));
  }
  if (firebaseAccess.role === ROLES.GRAFICOS) {
    state.view = "graphicsAccess";
    saveState({ silent: true });
    return renderGraphicsAccess();
  }
  return renderRoleShortcut("Acceso limitado", "Tu rol puede consultar informacion, pero esta seccion no esta disponible.", getAbsolutePageHref("index.html"));
}

function renderJudgeTournamentAccessHome() {
  const tournaments = getVisibleTournaments();
  if (tournaments.length === 1) {
    window.setTimeout(() => {
      window.location.href = buildJudgeTournamentHref(tournaments[0].id);
    }, 0);
    return html`
      <section class="content">
        <div class="empty role-home">
          <h2>Abriendo panel de juez</h2>
          <p>${escapeHTML(tournaments[0].name || "Torneo asignado")}</p>
        </div>
      </section>
    `;
  }

  if (tournaments.length > 1) {
    return html`
      <section class="content tournament-entry">
        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Selecciona un torneo</h2>
              <p class="card-subtitle">Tu usuario tiene varios torneos activos asignados.</p>
            </div>
          </div>
          <div class="card-body quick-team-list">
            ${tournaments.map((tournament) => html`
              <a class="button primary" href="${escapeHTML(buildJudgeTournamentHref(tournament.id))}">
                ${escapeHTML(tournament.name || tournament.id)}
              </a>
            `).join("")}
          </div>
        </article>
      </section>
    `;
  }

  return renderRoleShortcut("Torneo no asignado", "Pide a un supervisor que te asigne a un torneo activo o programado.", getAbsolutePageHref("index.html"));
}

function buildJudgeTournamentHref(tournamentId) {
  return buildTournamentUrl("torneo.html", tournamentId, { view: "dashboard" });
}

function renderRoleShortcut(title, message, href) {
  return html`
    <section class="content">
      <div class="empty role-home">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(message)}</p>
        <a class="button primary" href="${escapeHTML(href)}">Abrir pagina</a>
      </div>
    </section>
  `;
}

function renderTournamentEntry() {
  const tournaments = getVisibleTournaments().sort((a, b) => {
    if (a.id === state.activeTournamentId) return -1;
    if (b.id === state.activeTournamentId) return 1;
    const seasonDiff = Number(getTournamentSeason(b)) - Number(getTournamentSeason(a));
    if (seasonDiff) return seasonDiff;
    return String(b.date || "").localeCompare(String(a.date || ""));
  });
  const seasonGroups = groupTournamentsBySeason(tournaments);
  const emptyState = getTournamentEntryEmptyState();

  return html`
    <section class="content tournament-entry">
      <article class="tournament-entry-hero">
        <div>
          <span>CharroPro</span>
          <h2>Vista general de torneos</h2>
          <p>Abre un torneo para entrar a sus equipos, programa, resultados, graficos y configuracion propia.</p>
        </div>
        ${roleCan(firebaseAccess.role, "manage") ? html`<button class="button primary" data-action="new-tournament">Crear torneo nuevo</button>` : ""}
      </article>
      ${
        tournaments.length
          ? html`
              ${seasonGroups.map(renderTournamentSeasonGroup).join("")}
            `
          : html`
              <div class="empty tournament-empty">
                <h2>${escapeHTML(emptyState.title)}</h2>
                <p>${escapeHTML(emptyState.message)}</p>
                ${emptyState.action === "create" && roleCan(firebaseAccess.role, "manage") ? html`<button class="button primary" data-action="new-tournament">Crear primer torneo</button>` : ""}
                ${emptyState.action === "history" ? html`<button class="button" data-view="history">Ver historial</button>` : ""}
              </div>
            `
      }
    </section>
  `;
}

function getTournamentEntryEmptyState() {
  if (!state.tournaments.length) {
    return {
      title: "No hay torneos guardados",
      message: "Crea el primero para empezar a organizar equipos, charreadas y resultados.",
      action: "create"
    };
  }

  const accessible = getAccessibleTournaments();
  const operational = accessible.filter(isOperationalTournament);
  if (!operational.length && accessible.length) {
    return {
      title: "No hay torneos activos o programados",
      message: "Los torneos finalizados o congelados se consultan desde Historial.",
      action: "history"
    };
  }

  return {
    title: "No tienes torneo asignado todavia",
    message: "Pide a un supervisor que te asigne un torneo en preparacion o en vivo.",
    action: ""
  };
}

function groupTournamentsBySeason(tournaments) {
  const groups = new Map();
  tournaments.forEach((tournament) => {
    const season = getTournamentSeason(tournament);
    if (!groups.has(season)) groups.set(season, []);
    groups.get(season).push(tournament);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([season, items]) => ({ season, tournaments: items }));
}

function renderTournamentSeasonGroup(group) {
  return html`
    <section class="season-section">
      <div class="season-section-head">
        <div>
          <span>En operacion</span>
          <h2>Temporada ${escapeHTML(group.season)}</h2>
        </div>
        <strong>${group.tournaments.length} torneo${group.tournaments.length === 1 ? "" : "s"}</strong>
      </div>
      <div class="tournament-grid">
        ${group.tournaments.map(renderTournamentCard).join("")}
      </div>
    </section>
  `;
}

function renderTournamentCard(tournament) {
  const teams = getTournamentTeams(tournament.id);
  const charreadas = getTournamentCharreadas(tournament.id);
  const leaderboard = buildLeaderboard(tournament.id);
  const indexedTeamCount = Number(tournament.teamCount);
  const indexedCharreadaCount = Number(tournament.charreadaCount);
  const leaderName = !IS_TOURNAMENT_APP
    ? tournament.leaderName || "Sin puntos"
    : leaderboard[0]?.team ? getEntryDisplayName(leaderboard[0].team) : tournament.leaderName || "Sin puntos";
  const teamCount = Number.isFinite(indexedTeamCount) ? indexedTeamCount : teams.length;
  const charreadaCount = Number.isFinite(indexedCharreadaCount) ? indexedCharreadaCount : charreadas.length;
  const isActive = tournament.id === state.activeTournamentId;
  const typeConfig = getTournamentTypeConfig(tournament.type);
  const labels = getEntityLabels(tournament);
  const statusClass = getTournamentStatusClass(tournament.status);

  return html`
    <article class="tournament-card ${isActive ? "active" : ""} ${isTournamentFrozen(tournament) ? "locked" : ""}">
      <div class="tournament-card-head">
        <div>
          <span class="program-card-kicker">${escapeHTML(formatDateLabel(tournament.date) || "Sin fecha")} / Temp. ${escapeHTML(getTournamentSeason(tournament))}</span>
          <h3>${escapeHTML(tournament.name)}</h3>
        </div>
        <div class="program-card-badges">
          ${isActive ? html`<span class="pill blue">Actual</span>` : ""}
          <span class="pill ${statusClass}">${escapeHTML(formatTournamentStatus(tournament.status))}</span>
          <span class="pill green">${escapeHTML(typeConfig.shortName)}</span>
        </div>
      </div>
      <p>${escapeHTML(tournament.venue || "Sin lienzo registrado")}</p>
      <div class="tournament-card-stats">
        <span><b>${teamCount}</b> ${escapeHTML(labels.plural)}</span>
        <span><b>${charreadaCount}</b> charreadas</span>
        <span><b>${escapeHTML(leaderName)}</b> lider</span>
      </div>
      <div class="tournament-card-actions">
        <button class="button primary" data-action="open-tournament" data-id="${tournament.id}">
          ${isActive ? "Entrar al torneo" : "Abrir torneo"}
        </button>
        <button class="button" data-action="open-tournament-program" data-id="${tournament.id}">Ver programa</button>
        ${roleCan(firebaseAccess.role, "supervise") && tournament.status !== "finalizado" && tournament.status !== "congelado" ? html`
          <button class="button" data-action="set-tournament-status" data-id="${tournament.id}" data-status="finalizado">Finalizar</button>
        ` : ""}
        ${roleCan(firebaseAccess.role, "supervise") && tournament.status !== "congelado" ? html`
          <button class="button red" data-action="confirm-freeze-tournament" data-id="${tournament.id}">Congelar</button>
        ` : ""}
        ${canDeleteTournamentPermanently() && !IS_TOURNAMENT_APP ? html`
          <button class="button red" data-action="confirm-delete-tournament" data-id="${tournament.id}">Eliminar definitivo</button>
        ` : ""}
      </div>
    </article>
  `;
}

function renderNoTournament() {
  return html`
    <section class="content">
      <div class="empty">
        <h2>No hay torneos registrados</h2>
        <p>Crea el primer torneo para empezar con equipos, programa y calificaciones.</p>
        <button class="button primary" data-action="new-tournament">Crear torneo</button>
      </div>
    </section>
  `;
}

function renderNoAssignedTournaments() {
  return html`
    <section class="content">
      <div class="empty">
        <h2>No tienes torneo asignado todavia</h2>
        <p>Los torneos finalizados o congelados quedan para consulta en Historial. Para operar, asigna un torneo en preparacion o en vivo.</p>
        ${roleCan(firebaseAccess.role, "users") ? html`<button class="button primary" data-view="users">Ir a Usuarios</button>` : ""}
      </div>
    </section>
  `;
}

function isCharreadaAssignedToCurrentUser(charreada = {}) {
  const charreadaId = String(charreada.id || "");
  const uidValue = String(firebaseAccess.uid || "");
  const assignedIds = [
    ...(Array.isArray(firebaseAccess.charreadaIds) ? firebaseAccess.charreadaIds : []),
    ...(Array.isArray(firebaseAccess.assignedCharreadaIds) ? firebaseAccess.assignedCharreadaIds : [])
  ].map((id) => String(id || ""));

  if (assignedIds.includes(charreadaId)) return true;
  if (Array.isArray(charreada.judgeIds) && charreada.judgeIds.map(String).includes(uidValue)) return true;
  if (charreada.judges && typeof charreada.judges === "object" && uidValue && charreada.judges[uidValue]) return true;
  return false;
}

function getTournamentActiveCharreadaId(tournament = {}) {
  const tournamentId = tournament?.id || state.activeTournamentId || getTournamentContext().tournamentId || "";
  return String(
    firebaseDiagnostics.activeCharreadaIds?.[tournamentId] ||
      tournament?.activeCharreadaId ||
      tournament?.currentCharreadaId ||
      tournament?.activeCharreada ||
      ""
  ).trim();
}

function resolveActiveScoringCharreada(charreadas = [], tournament = getActiveTournament()) {
  const tournamentId = tournament?.id || state.activeTournamentId || getTournamentContext().tournamentId || "";
  const scopedCharreadas = (charreadas || []).filter((charreada) => !tournamentId || charreada.tournamentId === tournamentId);
  const byId = new Map(scopedCharreadas.map((charreada) => [charreada.id, charreada]));
  const tournamentActiveId = getTournamentActiveCharreadaId(tournament);

  if (tournamentActiveId && byId.has(tournamentActiveId)) {
    return { charreada: byId.get(tournamentActiveId), id: tournamentActiveId, source: "tournament" };
  }

  const stateActiveId = String(state.activeCharreadaId || "").trim();
  if (stateActiveId && byId.has(stateActiveId)) {
    return { charreada: byId.get(stateActiveId), id: stateActiveId, source: "state" };
  }

  const liveCharreadas = scopedCharreadas.filter((charreada) => String(charreada.status || "") === "en_vivo");
  if (liveCharreadas.length === 1) {
    return { charreada: liveCharreadas[0], id: liveCharreadas[0].id, source: "status" };
  }
  if (liveCharreadas.length > 1) {
    console.warn("[judge-context] varias charreadas en vivo; no se elige automaticamente la primera", {
      tournamentId,
      charreadaIds: liveCharreadas.map((charreada) => charreada.id)
    });
    return { charreada: null, id: "", source: "multiple-status" };
  }

  return { charreada: null, id: "", source: "none" };
}

function logJudgeContextResolution(tournamentId, resolution = {}) {
  if (firebaseAccess.role !== ROLES.JUEZ) return;
  console.info("[judge-context] tournamentId:", tournamentId || "");
  console.info("[judge-context] activeCharreadaId resuelta:", resolution.id || "");
  console.info("[judge-context] fuente activeCharreadaId:", resolution.source || "none");
}

function isActiveScoringCharreada(charreada = {}) {
  if (!charreada?.id) return false;
  const tournament = state.tournaments.find((item) => item.id === charreada.tournamentId) || getActiveTournament() || {};
  return resolveActiveScoringCharreada(getTournamentCharreadas(charreada.tournamentId), tournament).id === charreada.id;
}

function getActiveScoringCharreada(charreadas = [], tournament = getActiveTournament()) {
  return resolveActiveScoringCharreada(charreadas, tournament).charreada;
}

function canScoreCharreada(charreada = {}) {
  if (!roleCan(firebaseAccess.role, "score")) return false;
  if (firebaseAccess.role !== ROLES.JUEZ) return true;
  if (!firebaseAccess.active || !canAccessTournamentId(charreada.tournamentId || state.activeTournamentId)) return false;
  return isActiveScoringCharreada(charreada);
}

function getJudgeScoringDisabledReason({ canScore, canAccessTournament, scoringCharreada, scoringCharreadaLocked, canEnterScoring }) {
  if (firebaseAccess.role !== ROLES.JUEZ) return "";
  if (!firebaseAccess.active) return "inactive-user";
  if (!canScore) return "missing-score-permission";
  if (!canAccessTournament) return "no-tournament-access";
  if (!scoringCharreada) return "no-active-charreada";
  if (scoringCharreadaLocked) return "charreada-locked";
  if (!canScoreCharreada(scoringCharreada)) return "charreada-not-accessible";
  return canEnterScoring ? "" : "unknown";
}

function logJudgeButtonDiagnostics(diagnostics = {}) {
  if (firebaseAccess.role !== ROLES.JUEZ) return;
  console.info("[judge-button] role:", diagnostics.role);
  console.info("[judge-button] active:", diagnostics.active);
  console.info("[judge-button] tournamentAccess:", diagnostics.tournamentAccess);
  console.info("[judge-button] tournamentId:", diagnostics.tournamentId);
  console.info("[judge-button] activeCharreadaId:", diagnostics.activeCharreadaId);
  console.info("[judge-button] assignedCharreadaId:", diagnostics.assignedCharreadaId);
  console.info("[judge-button] canAccessTournament:", diagnostics.canAccessTournament);
  console.info("[judge-button] canEnterScoring:", diagnostics.canEnterScoring);
  console.info("[judge-button] disabledReason:", diagnostics.disabledReason);
}

function renderDashboard() {
  const tournament = getActiveTournament();
  const teams = getTournamentTeams();
  const charreadas = getTournamentCharreadas();
  const leaderboard = buildLeaderboard(tournament.id);
  const activeCharreadaResolution = resolveActiveScoringCharreada(charreadas, tournament);
  const activeCharreada = activeCharreadaResolution.charreada;
  const typeConfig = getTournamentTypeConfig(tournament.type);
  const labels = getEntityLabels(tournament);
  const locked = isTournamentFrozen(tournament);
  const canManage = roleCan(firebaseAccess.role, "manage");
  const canOperate = roleCan(firebaseAccess.role, "operate");
  const canScore = roleCan(firebaseAccess.role, "score");
  const canAccessTournament = canAccessTournamentId(tournament.id);
  const assignedCharreada = firebaseAccess.role === ROLES.JUEZ
    ? charreadas.find((charreada) => isCharreadaAssignedToCurrentUser(charreada)) || null
    : null;
  const scoringCharreada = activeCharreada;
  const scoringCharreadaLocked = isCharreadaFrozen(scoringCharreada);
  const canScoreActiveCharreada = Boolean(canScore && canAccessTournament && scoringCharreada && !scoringCharreadaLocked && canScoreCharreada(scoringCharreada));
  const judgeDisabledReason = getJudgeScoringDisabledReason({
    canScore,
    canAccessTournament,
    scoringCharreada,
    scoringCharreadaLocked,
    canEnterScoring: canScoreActiveCharreada
  });

  logJudgeContextResolution(tournament.id, activeCharreadaResolution);
  logJudgeButtonDiagnostics({
    role: firebaseAccess.role || "",
    active: firebaseAccess.active !== false,
    tournamentAccess: normalizeTournamentAccess(firebaseAccess).tournamentAccess,
    tournamentId: tournament.id || "",
    activeCharreadaId: activeCharreadaResolution.id || "",
    assignedCharreadaId: assignedCharreada?.id || "",
    canAccessTournament,
    canEnterScoring: canScoreActiveCharreada,
    disabledReason: judgeDisabledReason
  });

  return html`
    <section class="content">
      <div class="stat-row">
        <div class="stat"><span>Torneo</span><strong>${escapeHTML(tournament.name)}</strong></div>
        <div class="stat"><span>Temporada</span><strong>${escapeHTML(getTournamentSeason(tournament))}</strong></div>
        <div class="stat"><span>Formato</span><strong>${escapeHTML(typeConfig.shortName)}</strong></div>
        <div class="stat"><span>${escapeHTML(labels.title)}</span><strong>${teams.length}</strong></div>
        <div class="stat"><span>Charreadas</span><strong>${charreadas.length}</strong></div>
        <div class="stat"><span>Lider</span><strong>${escapeHTML(leaderboard[0]?.team ? getEntryDisplayName(leaderboard[0].team) : "-")}</strong></div>
      </div>

      <div class="grid cols-2">
        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${canManage || canOperate ? "Acciones rapidas" : "Calificacion"}</h2>
              <p class="card-subtitle">${canManage || canOperate ? "Crear, programar y abrir el calificador." : "Entra manualmente a la charreada activa cuando este asignada."}</p>
            </div>
          </div>
          <div class="card-body grid">
            ${locked ? html`<div class="locked-notice">Torneo congelado. Disponible solo para consulta.</div>` : ""}
            ${canManage ? html`<button class="button primary" data-action="new-team" ${locked ? "disabled" : ""}>${escapeHTML(labels.add)}</button>` : ""}
            ${canManage ? html`<button class="button" data-action="new-charreada" ${locked ? "disabled" : ""}>Crear charreada</button>` : ""}
            ${canScore ? html`
              <button class="button green" data-action="start-scoring" data-id="${escapeHTML(scoringCharreada?.id || "")}" ${canScoreActiveCharreada ? "" : "disabled"}>
                ${scoringCharreadaLocked ? "Calificacion bloqueada" : scoringCharreada ? "Calificar charreada activa" : "No hay charreada activa todavia."}
              </button>
            ` : ""}
            ${firebaseAccess.role === ROLES.JUEZ ? html`
              <a class="button" href="${escapeHTML(getPageHref("jueces.html"))}">Mis charreadas</a>
            ` : ""}
            ${canOperate ? html`
              <div class="segmented">
                ${charreadas
                  .map(
                    (charreada) => html`
                      <button data-action="set-active-charreada" data-id="${charreada.id}" class="${charreada.id === activeCharreadaResolution.id ? "active" : ""}">
                        ${escapeHTML(charreada.name)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            ` : ""}
            ${canScore && !canScoreActiveCharreada ? html`<div class="empty">${scoringCharreada ? "No puedes calificar esta charreada." : "No hay charreada activa todavia."}</div>` : ""}
          </div>
        </article>

        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Tabla general</h2>
              <p class="card-subtitle">Ordenada por puntos, infracciones y nombre.</p>
            </div>
          </div>
          <div class="card-body">
            ${leaderboard.length ? renderLeaderboardMini(leaderboard, labels) : html`<div class="empty">${escapeHTML(labels.noItems)}</div>`}
          </div>
        </article>
      </div>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Programa activo</h2>
            <p class="card-subtitle">Charreadas del torneo seleccionado.</p>
          </div>
          <button class="button small" data-view="officialProgram">Ver programa</button>
        </div>
        <div class="card-body">
          ${charreadas.length ? renderCharreadasSummaryList(charreadas) : html`<div class="empty">Crea una charreada para iniciar el programa.</div>`}
        </div>
      </article>
    </section>
  `;
}

function renderLeaderboardMini(leaderboard, labels = getEntityLabels()) {
  return html`
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>${escapeHTML(labels.nameHeader)}</th><th class="num">Puntos</th><th class="num">Infr.</th></tr></thead>
        <tbody>
          ${leaderboard
            .slice(0, 10)
            .map(
              (item, index) => html`
	                <tr>
	                  <td>${index + 1}</td>
	                  <td>${escapeHTML(getEntryDisplayName(item.team))}</td>
                  <td class="num"><strong>${moneylessNumber(item.total)}</strong></td>
                  <td class="num">${moneylessNumber(item.infr)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTeams() {
  const teams = getTournamentTeams();
  const labels = getEntityLabels();
  const locked = isActiveTournamentLocked();

  return html`
    <section class="content">
      <div class="topbar-actions">
        <button class="button primary" data-action="new-team" ${locked ? "disabled" : ""}>${escapeHTML(labels.add)}</button>
      </div>
      ${locked ? html`<div class="locked-notice">Torneo congelado. Equipos y participantes estan solo para consulta.</div>` : ""}
      <div class="segmented teams-tabs">
        <button data-action="select-teams-tab" data-tab="quick" class="${teamsTab === "quick" ? "active" : ""}">Alta rapida</button>
        <button data-action="select-teams-tab" data-tab="list" class="${teamsTab === "list" ? "active" : ""}">${escapeHTML(isIndividualTournament() ? "Participantes" : "Alineaciones")}</button>
      </div>
      ${teamsTab === "quick" ? renderQuickTeamsPanel(teams, labels) : renderTeamsListPanel(teams, labels)}
    </section>
  `;
}

function renderQuickTeamsPanel(teams, labels = getEntityLabels()) {
  const locked = isActiveTournamentLocked();
  return html`
    <article class="card quick-teams-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHTML(labels.quickTitle)}</h2>
          <p class="card-subtitle">${escapeHTML(labels.quickHelp)}</p>
        </div>
      </div>
      <div class="card-body grid">
        <form id="quick-team-form" class="grid">
          <div>
            <label>${escapeHTML(labels.quickLabel)}</label>
            <textarea name="teamNames" rows="8" placeholder="${escapeHTML(labels.quickPlaceholder)}"></textarea>
          </div>
          <div class="form-grid">
            <div>
              <label>Categoria por defecto</label>
              <input name="category" list="team-category-options" value="Libre" placeholder="Libre">
              <datalist id="team-category-options">
                ${TEAM_CATEGORIES.map((category) => html`<option value="${escapeHTML(category)}"></option>`).join("")}
              </datalist>
            </div>
            <div>
              <label>Asociacion opcional</label>
              <input name="association" placeholder="Se puede dejar vacio">
            </div>
          </div>
          <div class="topbar-actions">
            <button class="button primary" data-action="save-quick-teams" type="button" ${locked ? "disabled" : ""}>${escapeHTML(labels.quickButton)}</button>
            <button class="button" data-action="select-teams-tab" data-tab="list" type="button">${escapeHTML(labels.listButton)}</button>
          </div>
        </form>
      </div>
    </article>
    ${
      teams.length
        ? html`
	            <article class="card">
	              <div class="card-header">
	                <div>
	                  <h2 class="card-title">${escapeHTML(labels.registeredTitle)}</h2>
	                  <p class="card-subtitle">${teams.length} ${escapeHTML(labels.readyText)}.</p>
	                </div>
	              </div>
	              <div class="card-body">
	                <div class="quick-team-list">
	                  ${teams.map((team, index) => html`<span class="pill">${index + 1}. ${escapeHTML(getEntryDisplayName(team))}</span>`).join("")}
	                </div>
	              </div>
	            </article>
	          `
        : html`<div class="empty">Agrega nombres para poder crear el programa mas rapido.</div>`
    }
  `;
}

function renderTeamsListPanel(teams, labels = getEntityLabels()) {
  return teams.length
    ? html`
        <div class="grid cols-2">
          ${teams.map(renderTeamCard).join("")}
        </div>
      `
    : html`<div class="empty">${escapeHTML(labels.empty)}</div>`;
}

function renderTeamCard(team) {
  if (isIndividualTournament()) return renderParticipantCard(team);
  const locked = isActiveTournamentLocked();

  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHTML(team.name)}</h2>
          <p class="card-subtitle">${escapeHTML(team.association || "Sin asociacion")} / Capitan: ${escapeHTML(team.captain || "Sin registrar")}</p>
        </div>
        <button class="button small" data-action="edit-team" data-id="${team.id}" ${locked ? "disabled" : ""}>Editar</button>
      </div>
      <div class="card-body grid">
        <span class="pill blue">Categoria: ${escapeHTML(getTeamCategory(team))}</span>
        <span class="pill blue">Cala: ${escapeHTML(team.roster.cala || "Sin registrar")}</span>
        <span class="pill green">Piales: ${escapeHTML(team.roster.piales || "Sin registrar")}</span>
        <span class="pill amber">Colas: ${escapeHTML((team.roster.colas || []).filter(Boolean).join(" / ") || "Sin registrar")}</span>
        <span class="pill">Paso: ${escapeHTML(team.roster.paso || "Sin registrar")}</span>
      </div>
    </article>
  `;
}

function renderParticipantCard(team) {
  const { participantName, horseName } = getParticipantHorseParts(team);
  const locked = isActiveTournamentLocked();
  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHTML(participantName || team.name || "Participante")}</h2>
          <p class="card-subtitle">Caballo: ${escapeHTML(horseName || "Sin registrar")}</p>
        </div>
        <button class="button small" data-action="edit-team" data-id="${team.id}" ${locked ? "disabled" : ""}>Editar</button>
      </div>
      <div class="card-body grid">
        <span class="pill blue">Categoria: ${escapeHTML(getTeamCategory(team))}</span>
        <span class="pill green">Participacion: ${escapeHTML(getEntryDisplayName(team))}</span>
        <span class="pill">Asociacion: ${escapeHTML(team.association || "Sin asociacion")}</span>
      </div>
    </article>
  `;
}

function renderProgram() {
  const tournament = getActiveTournament();
  const teams = getTournamentTeams();
  const charreadas = getTournamentCharreadas();
  const activeCharreadaResolution = resolveActiveScoringCharreada(charreadas, tournament);
  const activeCharreada = activeCharreadaResolution.charreada || getActiveCharreada();
  const labels = getEntityLabels(tournament);
  const locked = isTournamentFrozen(tournament);
  const canManage = roleCan(firebaseAccess.role, "manage");
  logActiveCharreadaUiUpdated(tournament?.id || state.activeTournamentId || "", activeCharreadaResolution.id || state.activeCharreadaId || "");

  return html`
    <section class="content program-page">
      <article class="program-hero">
        <div>
          <span>Programa de Competencias</span>
          <h2>${escapeHTML(activeCharreada?.name || "Sin charreada activa")}</h2>
          <p>${charreadas.length ? `${charreadas.length} charreada${charreadas.length === 1 ? "" : "s"} programada${charreadas.length === 1 ? "" : "s"} / ${teams.length} ${labels.plural}` : "Arma el orden de participacion para empezar a calificar."}</p>
        </div>
        ${canManage ? html`<button class="button primary" data-action="new-charreada" ${teams.length && !locked ? "" : "disabled"}>Nueva charreada</button>` : ""}
      </article>
      ${
        charreadas.length
          ? renderCharreadasCards(charreadas, activeCharreadaResolution.id || "")
          : html`
              <div class="empty program-empty">
	                <h2>${teams.length ? "Aun no hay charreadas programadas" : labels.firstBeforeProgram}</h2>
	                <p>${teams.length ? `Crea una charreada, selecciona ${labels.plural} y pon el orden real de salida.` : `Cuando tengas ${labels.plural}, podras armar el programa de participacion.`}</p>
	                ${canManage ? html`<button class="button primary" data-action="${teams.length ? "new-charreada" : "new-team"}" ${locked ? "disabled" : ""}>${teams.length ? "Crear primera charreada" : labels.add}</button>` : ""}
              </div>
            `
      }
    </section>
  `;
}

function renderOfficialProgram() {
  const tournament = getActiveTournament();
  const charreadas = getTournamentCharreadas();
  const teams = getTournamentTeams();
  const labels = getEntityLabels(tournament);
  const groups = groupProgramCharreadasByDay(charreadas);
  const collapsedDays = readOfficialProgramCollapsedDays();
  const activeCharreadaResolution = resolveActiveScoringCharreada(charreadas, tournament);

  console.info("[programa-001] grouped by day", groups.map((group) => ({
    key: group.key,
    label: group.label,
    charreadas: group.charreadas.length
  })));
  console.info("[programa-001] collapse restored", {
    collapsedDays: Object.keys(collapsedDays).filter((key) => collapsedDays[key])
  });
  console.info("[programa-001] program rendered", {
    tournamentId: tournament?.id || state.activeTournamentId || "",
    days: groups.length,
    charreadas: charreadas.length
  });

  return html`
    <section class="content official-program-page">
      <article class="program-hero official-program-hero">
        <div>
          <span>Programa de Competencias</span>
          <h2>${escapeHTML(tournament?.name || "Torneo")}</h2>
          <p>${charreadas.length ? `${charreadas.length} charreada${charreadas.length === 1 ? "" : "s"} / ${teams.length} ${labels.plural}` : "Aun no hay charreadas programadas."}</p>
        </div>
        <div class="scope-card-metrics">
          <div><span>Dias</span><strong>${groups.length}</strong></div>
          <div><span>Charreadas</span><strong>${charreadas.length}</strong></div>
          <div><span>${escapeHTML(labels.title)}</span><strong>${teams.length}</strong></div>
        </div>
      </article>
      ${
        groups.length
          ? html`
              <div class="official-program-day-list">
                ${groups.map((group) => renderOfficialProgramDayGroup(group, activeCharreadaResolution.id || "", collapsedDays)).join("")}
              </div>
            `
          : html`
              <div class="empty program-empty">
                <h2>Programa sin charreadas</h2>
                <p>Cuando se programen charreadas, apareceran aqui agrupadas por fecha.</p>
              </div>
            `
      }
    </section>
  `;
}

function renderOfficialProgramDayGroup(group, activeCharreadaId = state.activeCharreadaId, collapsedDays = {}) {
  const collapsed = Boolean(collapsedDays[group.key]);
  return html`
    <section class="official-program-day ${collapsed ? "collapsed" : ""}">
      <button class="program-day-header official-program-day-header" data-action="toggle-official-program-day" data-id="${escapeHTML(group.key)}" type="button" aria-expanded="${collapsed ? "false" : "true"}">
        <div>
          <span>Dia de competencia</span>
          <strong>${escapeHTML(group.label)}</strong>
        </div>
        <div class="program-day-meta">
          <span class="pill">${group.charreadas.length} charreada${group.charreadas.length === 1 ? "" : "s"}</span>
          <span class="pill">${escapeHTML(formatProgramDayPhases(group.charreadas))}</span>
          <b>${collapsed ? "Mostrar" : "Ocultar"}</b>
        </div>
      </button>
      ${
        collapsed
          ? ""
          : html`
              <div class="official-program-grid">
                ${group.charreadas.map((charreada) => renderOfficialProgramCard(charreada, activeCharreadaId)).join("")}
              </div>
            `
      }
    </section>
  `;
}

function renderOfficialProgramCard(charreada, activeCharreadaId = state.activeCharreadaId) {
  const isActive = charreada.id === activeCharreadaId;
  const displayStatus = getCanonicalCharreadaStatus(charreada, activeCharreadaId);
  const operationalStatus = getCharreadaOperationalStatus(charreada);
  const statusClass = operationalStatus ? getOperationalStatusClass(operationalStatus) : getCharreadaStatusClass(displayStatus);
  const participants = getCharreadaParticipantEntries(charreada);
  const competitionLabel = formatCharreadaCompetition(charreada);
  const locked = isCharreadaFrozen(charreada);
  const canManage = roleCan(firebaseAccess.role, "manage");
  const canOperate = roleCan(firebaseAccess.role, "operate");
  const venue = getCharreadaProductionValue(charreada, ["venue", "sede", "lienzo", "productionVenue"]);
  const announcer = getCharreadaProductionValue(charreada, ["announcer", "locutor", "assignedAnnouncer"]);
  const judges = getCharreadaProductionValue(charreada, ["judges", "jueces", "assignedJudges"]);
  const productionLead = getCharreadaProductionValue(charreada, ["productionLead", "responsableProduccion", "productionManager"]);
  const realStartTime = getCharreadaProductionValue(charreada, ["realStartTime", "actualStartTime", "horaRealInicio"]);
  const realEndTime = getCharreadaProductionValue(charreada, ["realEndTime", "actualEndTime", "horaRealTermino"]);
  const duration = getCharreadaRealDuration(charreada);
  const notes = getCharreadaProductionValue(charreada, ["internalNotes", "notasInternas", "productionNotes"]);

  return html`
    <article class="official-program-card ${statusClass} ${isActive ? "active" : ""}">
      <div class="official-program-time">
        <span>Hora programada</span>
        <strong>${escapeHTML(formatTimeLabel(charreada.startTime) || "—")}</strong>
        <small>${escapeHTML(formatDateLabel(charreada.date) || "Fecha por confirmar")}</small>
      </div>
      <div class="official-program-main">
        <div class="official-program-card-head">
          <div>
            <span class="program-card-kicker">${escapeHTML(formatDateLabel(charreada.date) || "Sin fecha")}</span>
            <h3>${escapeHTML(charreada.name || "Charreada")}</h3>
          </div>
          <div class="program-card-badges">
            <span class="pill">${escapeHTML(formatCharreadaPhase(charreada))}</span>
            <span class="pill">${escapeHTML(competitionLabel)}</span>
            <span class="pill">${participants.length} participante${participants.length === 1 ? "" : "s"}</span>
            <span class="pill ${statusClass}">${escapeHTML(formatCharreadaStatus(displayStatus))}</span>
            <span class="pill ${statusClass}">Operativo: ${escapeHTML(formatOperationalStatus(operationalStatus))}</span>
            ${isActive ? html`<span class="pill blue">Activa</span>` : ""}
          </div>
        </div>
        <div class="official-program-meta-grid">
          <div><span>Lienzo / sede</span><strong>${escapeHTML(venue || "—")}</strong></div>
          <div><span>Inicio real</span><strong>${escapeHTML(formatTimeLabel(realStartTime) || "—")}</strong></div>
          <div><span>Termino real</span><strong>${escapeHTML(formatTimeLabel(realEndTime) || "—")}</strong></div>
          <div><span>Duracion</span><strong>${escapeHTML(duration)}</strong></div>
          <div><span>Locutor</span><strong>${escapeHTML(announcer || "—")}</strong></div>
          <div><span>Jueces</span><strong>${escapeHTML(judges || "—")}</strong></div>
          <div><span>Produccion</span><strong>${escapeHTML(productionLead || "—")}</strong></div>
        </div>
        <div class="official-program-teams">
          ${
            participants.length
              ? participants.map((participant, index) => html`<span>${index + 1}. ${escapeHTML(participant.name)}${participant.meta ? ` / ${escapeHTML(participant.meta)}` : ""}</span>`).join("")
              : html`<span>${isIndividualCompetition(charreada) ? "Sin participantes individuales" : "Sin equipos asignados"}</span>`
          }
        </div>
        <div class="official-program-notes">
          <span>Notas internas</span>
          <strong>${escapeHTML(notes || "—")}</strong>
        </div>
      </div>
      <div class="official-program-actions">
        <button class="button small" data-action="open-program-charreada" data-id="${escapeHTML(charreada.id)}">Abrir</button>
        ${canManage ? html`<button class="button small" data-action="edit-charreada" data-id="${escapeHTML(charreada.id)}" ${locked ? "disabled" : ""}>Editar</button>` : ""}
        ${canOperate ? html`<button class="button primary small" data-action="set-active-charreada" data-id="${escapeHTML(charreada.id)}" ${isActive ? "disabled" : ""}>Activar</button>` : ""}
        <a class="button small" href="${escapeHTML(getProgramQuickHref("jueces.html", charreada.id))}" target="_blank" rel="noopener">Juez</a>
        <a class="button small" href="${escapeHTML(getProgramQuickHref("locutores.html", charreada.id))}" target="_blank" rel="noopener">Locutores</a>
        <a class="button small" href="${escapeHTML(getProgramQuickHref("graficos.html", charreada.id))}" target="_blank" rel="noopener">Graficos</a>
        <a class="button small" href="${escapeHTML(getProgramQuickHref("obs.html", charreada.id))}" target="_blank" rel="noopener">OBS</a>
      </div>
    </article>
  `;
}

function renderCharreadasCards(charreadas, activeCharreadaId = state.activeCharreadaId) {
  const groups = groupProgramCharreadasByDay(charreadas);
  return html`
    <div class="program-day-list">
      ${groups.map((group) => renderProgramDayGroup(group, activeCharreadaId)).join("")}
    </div>
  `;
}

function renderProgramDayGroup(group, activeCharreadaId = state.activeCharreadaId) {
  const collapsed = isProgramDayCollapsed(group.key);
  return html`
    <section class="program-day-group ${collapsed ? "collapsed" : ""}">
      <button class="program-day-header" data-action="toggle-program-day" data-id="${escapeHTML(group.key)}" type="button" aria-expanded="${collapsed ? "false" : "true"}">
        <div>
          <span>Fecha / dia</span>
          <strong>${escapeHTML(group.label)}</strong>
        </div>
        <div class="program-day-meta">
          <span class="pill">${group.charreadas.length} charreada${group.charreadas.length === 1 ? "" : "s"}</span>
          <span class="pill">${escapeHTML(formatProgramDayPhases(group.charreadas))}</span>
          <b>${collapsed ? "Mostrar" : "Ocultar"}</b>
        </div>
      </button>
      ${
        collapsed
          ? ""
          : html`
              <div class="program-card-grid">
                ${group.charreadas.map((charreada) => renderCharreadaProgramCard(charreada, activeCharreadaId)).join("")}
              </div>
            `
      }
    </section>
  `;
}

function renderCharreadaProgramCard(charreada, activeCharreadaId = state.activeCharreadaId) {
  const isActive = charreada.id === activeCharreadaId;
  const displayStatus = getCanonicalCharreadaStatus(charreada, activeCharreadaId);
  const statusClass = getCharreadaStatusClass(displayStatus);
  const participants = getCharreadaParticipantEntries(charreada);
  const competitionLabel = formatCharreadaCompetition(charreada);
  const labels = getEntityLabels();
  const locked = isCharreadaFrozen(charreada);
  const canManage = roleCan(firebaseAccess.role, "manage");
  const canOperate = roleCan(firebaseAccess.role, "operate");
  const canScoreThisCharreada = canScoreCharreada(charreada) && !locked;

  return html`
    <article class="program-card ${isActive ? "active" : ""} ${locked ? "locked" : ""}">
      <div class="program-card-main">
        <div class="program-card-top">
          <div>
            <span class="program-card-kicker">${escapeHTML(formatCharreadaDateTime(charreada))}</span>
            <h3>${escapeHTML(charreada.name)}</h3>
          </div>
          <div class="program-card-badges">
            <span class="pill">${escapeHTML(formatCharreadaPhase(charreada))}</span>
            <span class="pill">${escapeHTML(competitionLabel)}</span>
            <span class="pill">${participants.length} participante${participants.length === 1 ? "" : "s"}</span>
            ${isActive ? html`<span class="pill blue">Activa</span>` : ""}
            <span class="pill ${statusClass}">${escapeHTML(formatCharreadaStatus(displayStatus))}</span>
          </div>
        </div>
        <div class="program-team-strip">
          ${
            participants.length
              ? participants.map((participant, index) => html`
                  <span class="program-team-chip">
                    <b>${index + 1}</b>
	                    ${escapeHTML(participant.name)}
	                  </span>
	                `).join("")
	              : html`<span class="card-subtitle">${isIndividualCompetition(charreada) ? "Sin participantes individuales" : `Sin ${escapeHTML(labels.plural)} asignados`}</span>`
          }
        </div>
      </div>
      <div class="program-card-actions">
        ${canOperate ? html`<button class="button small" data-action="set-active-charreada" data-id="${charreada.id}" ${isActive ? "disabled" : ""}>Activar</button>` : ""}
        ${canManage ? html`<button class="button small" data-action="edit-charreada" data-id="${charreada.id}" ${locked ? "disabled" : ""}>Editar</button>` : ""}
        ${roleCan(firebaseAccess.role, "score") ? html`<button class="button primary small" data-action="start-scoring" data-id="${charreada.id}" ${canScoreThisCharreada ? "" : "disabled"}>Calificar</button>` : ""}
        ${canManage ? html`<button class="button red small" data-action="delete-charreada" data-id="${charreada.id}" ${locked ? "disabled" : ""}>Eliminar</button>` : ""}
      </div>
    </article>
  `;
}

function groupProgramCharreadasByDay(charreadas = []) {
  const groups = new Map();
  const sorted = charreadas
    .map((charreada, index) => ({ charreada, index }))
    .sort((a, b) => compareProgramCharreadas(a.charreada, b.charreada, a.index, b.index))
    .map((item) => item.charreada);

  sorted.forEach((charreada) => {
    const key = getProgramDayKey(charreada);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatProgramDayLabel(charreada),
        charreadas: []
      });
    }
    groups.get(key).charreadas.push(charreada);
  });

  console.info("[program-fase-002] day groups built", [...groups.values()].map((group) => ({
    key: group.key,
    label: group.label,
    count: group.charreadas.length
  })));

  return [...groups.values()];
}

function compareProgramCharreadas(a = {}, b = {}, aIndex = 0, bIndex = 0) {
  const dateCompare = getProgramDaySortValue(a).localeCompare(getProgramDaySortValue(b), "es");
  if (dateCompare) return dateCompare;
  const timeCompare = String(a.startTime || "").localeCompare(String(b.startTime || ""), "es");
  if (timeCompare) return timeCompare;
  const orderCompare = getProgramCharreadaOrder(a, aIndex) - getProgramCharreadaOrder(b, bIndex);
  if (orderCompare) return orderCompare;
  return String(a.name || "").localeCompare(String(b.name || ""), "es");
}

function getProgramCharreadaOrder(charreada = {}, fallbackIndex = 0) {
  const raw = charreada.order ?? charreada.orden ?? charreada.charreadaOrder ?? charreada.programOrder;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallbackIndex + 1;
}

function getProgramDayKey(charreada = {}) {
  const date = String(charreada.date || "").trim();
  return date || "sin-fecha";
}

function getProgramDaySortValue(charreada = {}) {
  const date = String(charreada.date || "").trim();
  return date || "9999-99-99";
}

function formatProgramDayLabel(charreada = {}) {
  const date = String(charreada.date || "").trim();
  if (!date) return "Sin fecha programada";
  const parsed = parseLocalDate(date);
  if (!parsed) return formatDateLabel(date);
  const label = parsed.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return label ? `${label.charAt(0).toLocaleUpperCase("es-MX")}${label.slice(1)}` : formatDateLabel(date);
}

function parseLocalDate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatProgramDayPhases(charreadas = []) {
  const phases = [...new Set(charreadas.map((charreada) => formatCharreadaPhase(charreada)).filter(Boolean))];
  return phases.length ? phases.join(" / ") : "Sin fase";
}

function isProgramDayCollapsed(dayKey) {
  return Boolean(state.programCollapsedDays?.[dayKey]);
}

function toggleProgramDay(dayKey = "") {
  if (!dayKey) return;
  state.programCollapsedDays = {
    ...(state.programCollapsedDays || {}),
    [dayKey]: !isProgramDayCollapsed(dayKey)
  };
  console.info("[program-fase-002] day group toggled", { dayKey, collapsed: state.programCollapsedDays[dayKey] });
  saveState({ silent: true });
  render();
}

function readOfficialProgramCollapsedDays() {
  try {
    const saved = sessionStorage.getItem(scopedStorageKey(OFFICIAL_PROGRAM_COLLAPSE_STORAGE_KEY));
    return saved ? JSON.parse(saved) || {} : {};
  } catch {
    return {};
  }
}

function saveOfficialProgramCollapsedDays(collapsedDays = {}) {
  try {
    sessionStorage.setItem(scopedStorageKey(OFFICIAL_PROGRAM_COLLAPSE_STORAGE_KEY), JSON.stringify(collapsedDays));
  } catch {
    // La preferencia visual no debe bloquear la consulta del programa.
  }
}

function toggleOfficialProgramDay(dayKey = "") {
  if (!dayKey) return;
  const collapsedDays = readOfficialProgramCollapsedDays();
  collapsedDays[dayKey] = !Boolean(collapsedDays[dayKey]);
  saveOfficialProgramCollapsedDays(collapsedDays);
  console.info("[programa-001] collapse restored", {
    toggled: dayKey,
    collapsed: collapsedDays[dayKey]
  });
  render();
}

function openProgramCharreada(charreadaId = "") {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!charreada) return;
  const activeResolution = resolveActiveScoringCharreada(getTournamentCharreadas(charreada.tournamentId), getActiveTournament());
  const isActive = activeResolution.id === charreada.id;
  const displayStatus = getCanonicalCharreadaStatus(charreada, activeResolution.id || state.activeCharreadaId || "");
  const participants = getCharreadaParticipantEntries(charreada);
  const operationalStatus = getCharreadaOperationalStatus(charreada);
  showModal({
    title: charreada.name || "Charreada",
    body: html`
      <div class="official-program-modal">
        <div class="program-card-badges">
          <span class="pill">${escapeHTML(formatDateLabel(charreada.date) || "Sin fecha")}</span>
          <span class="pill">${escapeHTML(formatTimeLabel(charreada.startTime) || "Hora por confirmar")}</span>
          <span class="pill">${escapeHTML(formatCharreadaPhase(charreada))}</span>
          <span class="pill">${escapeHTML(formatCharreadaCompetition(charreada))}</span>
          <span class="pill">${participants.length} participante${participants.length === 1 ? "" : "s"}</span>
          <span class="pill ${getCharreadaStatusClass(displayStatus)}">${escapeHTML(formatCharreadaStatus(displayStatus))}</span>
          <span class="pill ${getOperationalStatusClass(operationalStatus)}">Operativo: ${escapeHTML(formatOperationalStatus(operationalStatus))}</span>
          ${isActive ? html`<span class="pill blue">Activa</span>` : ""}
        </div>
        <div class="official-program-meta-grid">
          <div><span>Lienzo / sede</span><strong>${escapeHTML(getCharreadaProductionValue(charreada, ["venue", "sede", "lienzo", "productionVenue"]) || "—")}</strong></div>
          <div><span>Hora programada</span><strong>${escapeHTML(formatTimeLabel(charreada.startTime) || "—")}</strong></div>
          <div><span>Inicio real</span><strong>${escapeHTML(formatTimeLabel(getCharreadaProductionValue(charreada, ["realStartTime", "actualStartTime", "horaRealInicio"])) || "—")}</strong></div>
          <div><span>Termino real</span><strong>${escapeHTML(formatTimeLabel(getCharreadaProductionValue(charreada, ["realEndTime", "actualEndTime", "horaRealTermino"])) || "—")}</strong></div>
          <div><span>Duracion</span><strong>${escapeHTML(getCharreadaRealDuration(charreada))}</strong></div>
          <div><span>Locutor</span><strong>${escapeHTML(getCharreadaProductionValue(charreada, ["announcer", "locutor", "assignedAnnouncer"]) || "—")}</strong></div>
          <div><span>Jueces</span><strong>${escapeHTML(getCharreadaProductionValue(charreada, ["judges", "jueces", "assignedJudges"]) || "—")}</strong></div>
          <div><span>Produccion</span><strong>${escapeHTML(getCharreadaProductionValue(charreada, ["productionLead", "responsableProduccion", "productionManager"]) || "—")}</strong></div>
        </div>
        <div class="official-program-notes">
          <span>Notas internas</span>
          <strong>${escapeHTML(getCharreadaProductionValue(charreada, ["internalNotes", "notasInternas", "productionNotes"]) || "—")}</strong>
        </div>
        <div class="official-program-teams">
          ${
            participants.length
              ? participants.map((participant, index) => html`<span>${index + 1}. ${escapeHTML(participant.name)}${participant.meta ? ` / ${escapeHTML(participant.meta)}` : ""}</span>`).join("")
              : html`<span>${isIndividualCompetition(charreada) ? "Sin participantes individuales" : "Sin equipos asignados"}</span>`
          }
        </div>
      </div>
    `,
    actions: html`
      <button class="button primary" data-action="close-modal">Cerrar</button>
    `
  });
}

function renderCharreadasSummaryList(charreadas) {
  const activeCharreadaId = resolveActiveScoringCharreada(charreadas, getActiveTournament()).id || state.activeCharreadaId || "";
  return html`
    <div class="program-summary-list">
      ${charreadas.map((charreada) => {
        const isActive = charreada.id === activeCharreadaId;
        const participants = getCharreadaParticipantEntries(charreada);
        const canOperate = roleCan(firebaseAccess.role, "operate");
        const canScoreThisCharreada = canScoreCharreada(charreada) && !isCharreadaFrozen(charreada);
        return html`
          <div class="program-summary-row ${isActive ? "active" : ""}">
            <div class="program-summary-main">
              <div>
                <span class="program-card-kicker">${escapeHTML(formatCharreadaDateTime(charreada))}</span>
                <strong>${escapeHTML(charreada.name)}</strong>
                <span class="pill">${escapeHTML(formatCharreadaPhase(charreada))}</span>
                <span class="pill">${escapeHTML(formatCharreadaCompetition(charreada))}</span>
              </div>
              <div class="program-summary-teams">
                ${
                  participants.length
	                    ? participants.map((participant, index) => html`<span>${index + 1}. ${escapeHTML(participant.name)}</span>`).join("")
	                    : html`<span>Sin registros</span>`
                }
              </div>
            </div>
            <div class="program-summary-actions">
              ${isActive ? html`<span class="pill blue">Activa</span>` : canOperate ? html`<button class="button small" data-action="set-active-charreada" data-id="${charreada.id}">Activar</button>` : ""}
              ${roleCan(firebaseAccess.role, "score") ? html`<button class="button primary small" data-action="start-scoring" data-id="${charreada.id}" ${canScoreThisCharreada ? "" : "disabled"}>Calificar</button>` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function formatCharreadaDateTime(charreada) {
  const date = formatDateLabel(charreada.date);
  const time = formatTimeLabel(charreada.startTime);
  return [date, time].filter(Boolean).join(" / ") || "Sin fecha";
}

function getCharreadaPhase(charreada = {}) {
  return String(charreada.phase || charreada.fase || "").trim();
}

function formatCharreadaPhase(charreada = {}) {
  return getCharreadaPhase(charreada) || "Sin fase";
}

function getCharreadaCompetition(charreada = {}) {
  return getCompetitionType(charreada?.competitionType || charreada?.competitionId || "equipos_completo");
}

function formatCharreadaCompetition(charreada = {}) {
  return getCharreadaCompetition(charreada).label || "Competencia por equipos";
}

function buildCharreadaCompetitionFields(competitionType = "") {
  const competition = getCompetitionType(competitionType || "equipos_completo");
  return {
    competitionType: competition.type,
    competitionScope: competition.scope,
    competitionId: competition.type,
    suerteIds: [...competition.suerteIds]
  };
}

function isIndividualCompetition(charreadaOrCompetition = {}) {
  if (charreadaOrCompetition?.scope) {
    return String(charreadaOrCompetition.scope).trim() === "individual";
  }
  if (charreadaOrCompetition?.competitionScope) {
    return String(charreadaOrCompetition.competitionScope).trim() === "individual";
  }
  return getCharreadaCompetition(charreadaOrCompetition).scope === "individual";
}

function normalizeIndividualParticipants(participants = []) {
  const rows = Array.isArray(participants) ? participants : Object.values(participants || {});
  return rows
    .map((participant, index) => ({
      id: String(participant?.id || uid("participante")),
      name: String(participant?.name || participant?.nombre || "").trim(),
      association: String(participant?.association || participant?.asociacion || "").trim(),
      category: String(participant?.category || participant?.categoria || "").trim(),
      horseName: String(participant?.horseName || participant?.caballo || "").trim(),
      order: normalizeParticipantOrder(participant?.order, index)
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeParticipantOrder(value, fallbackIndex = 0) {
  const order = Number(value);
  return Number.isFinite(order) && order > 0 ? order : fallbackIndex + 1;
}

function getCharreadaParticipantEntries(charreada = {}) {
  if (isIndividualCompetition(charreada)) {
    return normalizeIndividualParticipants(charreada.individualParticipants).map((participant) => ({
      id: participant.id,
      name: participant.name || "Participante sin nombre",
      meta: [participant.category, participant.association, participant.horseName ? `Caballo: ${participant.horseName}` : ""].filter(Boolean).join(" / "),
      order: participant.order,
      kind: "individual"
    }));
  }

  return (charreada.teamIds || [])
    .map((teamId, index) => {
      const team = getTeam(teamId);
      return team
        ? {
            id: team.id,
            name: getEntryDisplayName(team),
            meta: [getTeamCategory(team), team.association].filter(Boolean).join(" / "),
            order: index + 1,
            kind: "team"
          }
        : null;
    })
    .filter(Boolean);
}

function getCharreadaPhaseFormState(charreada = null) {
  const phase = getCharreadaPhase(charreada || {});
  const optionValues = new Set(CHARREADA_PHASE_OPTIONS.map(([value]) => value));
  if (!charreada) return { selectValue: "Fase 1", customValue: "" };
  if (!phase) return { selectValue: "", customValue: "" };
  if (optionValues.has(phase)) return { selectValue: phase, customValue: "" };
  return { selectValue: "__other", customValue: phase };
}

function normalizeCharreadaPhaseInput(value, customValue) {
  const selected = String(value || "").trim();
  const custom = String(customValue || "").trim();
  if (selected === "__other") return custom || "Otro";
  return selected;
}

function renderIndividualParticipantsSection(participants = [], visible = false) {
  const rows = participants.length ? participants : [];
  return html`
    <div class="individual-participants-section" data-competition-section="individual" ${visible ? "" : "hidden"}>
      <div class="individual-participants-head">
        <div>
          <label>Participantes</label>
          <p class="card-subtitle">Participantes individuales de esta competencia. Estos datos son temporales y no crean Master Data.</p>
        </div>
        <div class="topbar-actions compact-actions">
          <button class="button small" data-action="add-individual-participant" type="button">Agregar participante</button>
          <button class="button small" data-action="renumber-individual-participants" type="button">Renumerar orden</button>
        </div>
      </div>
      <div class="individual-participants-warning" data-individual-participants-warning ${rows.length ? "hidden" : ""}>
        Esta competencia requiere participantes individuales antes de poder calificarse.
      </div>
      <div class="individual-participants-list">
        ${rows.map((participant, index) => renderIndividualParticipantRow(participant, index)).join("")}
      </div>
    </div>
  `;
}

function renderIndividualParticipantRow(participant = {}, index = 0) {
  const normalized = normalizeIndividualParticipants([{ ...participant, order: participant.order || index + 1 }])[0];
  return html`
    <div class="individual-participant-row">
      <input type="hidden" name="individualParticipantId" value="${escapeHTML(normalized.id)}">
      <div>
        <label>Nombre</label>
        <input name="individualParticipantName" value="${escapeHTML(normalized.name)}" placeholder="Nombre del participante">
      </div>
      <div>
        <label>Asociacion</label>
        <input name="individualParticipantAssociation" value="${escapeHTML(normalized.association)}" placeholder="Asociacion o municipio">
      </div>
      <div>
        <label>Categoria</label>
        <input name="individualParticipantCategory" value="${escapeHTML(normalized.category)}" placeholder="Libre, AA, Juvenil...">
      </div>
      <div>
        <label>Caballo</label>
        <input name="individualParticipantHorseName" value="${escapeHTML(normalized.horseName)}" placeholder="Nombre del caballo">
      </div>
      <div>
        <label>Orden</label>
        <input class="individual-participant-order" type="number" name="individualParticipantOrder" min="1" value="${normalized.order}">
      </div>
      <div class="individual-participant-actions">
        <button class="button red small" data-action="remove-individual-participant" type="button">Eliminar</button>
      </div>
    </div>
  `;
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

function getCharreadaProductionValue(charreada = {}, keys = []) {
  for (const key of keys) {
    const value = charreada?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function getCharreadaOperationalStatus(charreada = {}) {
  return getCharreadaProductionValue(charreada, ["operationalStatus", "estadoOperativo", "productionStatus"]);
}

function formatOperationalStatus(status) {
  const normalized = String(status || "").trim();
  const option = OPERATIONAL_STATUS_OPTIONS.find(([value]) => value === normalized);
  return option?.[1] || "—";
}

function getOperationalStatusClass(status) {
  if (status === "en_vivo" || status === "terminada") return "green";
  if (status === "preparando" || status === "pausada" || status === "suspendida") return "amber";
  if (status === "cancelada") return "red";
  return "blue";
}

function getCharreadaRealDuration(charreada = {}) {
  const explicitDuration = getCharreadaProductionValue(charreada, ["realDuration", "durationReal", "duracionReal"]);
  if (explicitDuration) return explicitDuration;
  const start = getCharreadaProductionValue(charreada, ["realStartTime", "actualStartTime", "horaRealInicio"]);
  const end = getCharreadaProductionValue(charreada, ["realEndTime", "actualEndTime", "horaRealTermino"]);
  const minutes = getTimeDifferenceMinutes(start, end);
  if (!Number.isFinite(minutes)) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours} h ${rest} min`;
  if (hours) return `${hours} h`;
  return `${rest} min`;
}

function getTimeDifferenceMinutes(start, end) {
  const startParts = String(start || "").split(":").map(Number);
  const endParts = String(end || "").split(":").map(Number);
  if (startParts.length < 2 || endParts.length < 2) return NaN;
  const [startHour, startMinute] = startParts;
  const [endHour, endMinute] = endParts;
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return NaN;
  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;
  if (endTotal < startTotal) endTotal += 24 * 60;
  return endTotal - startTotal;
}

function formatCharreadaStatus(status) {
  if (status === "en_vivo") return "En vivo";
  if (status === "terminada" || status === "finalizada") return "Terminada";
  if (status === "suspendida") return "Suspendida";
  if (status === "cancelada") return "Cancelada";
  if (status === "congelada") return "Congelada";
  return "Programada";
}

function getCharreadaStatusClass(status) {
  if (status === "en_vivo") return "green";
  if (status === "terminada" || status === "finalizada") return "amber";
  if (status === "congelada" || status === "cancelada") return "red";
  if (status === "suspendida") return "amber";
  return "blue";
}

function formatTournamentStatus(status) {
  if (status === "en_vivo") return "En vivo";
  if (status === "finalizado") return "Finalizado";
  if (status === "congelado") return "Congelado";
  return "Preparacion";
}

function getTournamentStatusClass(status) {
  if (status === "en_vivo") return "green";
  if (status === "finalizado") return "amber";
  if (status === "congelado") return "red";
  return "blue";
}

function renderResults() {
  const tournament = getActiveTournament();
  const tournamentCharreadas = getTournamentCharreadas();
  const competitions = buildResultsCompetitionOptions(tournament, tournamentCharreadas);
  const selectedCompetition = getSelectedResultsCompetition(competitions);
  const charreadas = selectedCompetition?.charreadas || [];
  const phaseColumns = buildResultsPhaseColumns(charreadas);
  const selectedPhaseId = getSelectedResultsPhaseId(phaseColumns);
  const selectedPhase = phaseColumns.find((column) => column.id === selectedPhaseId) || null;
  const standings = buildResultsCompetitionStandings(tournament, selectedCompetition, phaseColumns);
  const visibleStandings = selectedPhase ? filterResultsStandingsByPhase(standings, selectedPhase) : standings;
  const visibleTeamIds = new Set(visibleStandings.map((row) => row.team?.id).filter(Boolean));
  const awards = buildResultsCompetitionAwards(tournament, selectedCompetition);
  const awardPlaces = getIndividualAwardPlaces(tournament);
  const labels = getResultsCompetitionLabels(selectedCompetition, tournament);
  const locked = isTournamentFrozen(tournament);
  console.info("[resultados-002B] charreadas source sample", charreadas.slice(0, 4).map((charreada, index) => ({
    id: charreada?.id || "",
    name: charreada?.name || `Charreada ${index + 1}`,
    phase: charreada?.phase || "",
    fase: charreada?.fase || "",
    competitionType: charreada?.competitionType || "",
    competitionScope: charreada?.competitionScope || ""
  })));
  console.info("[results-competitions-001] competition options", competitions.map((competition) => ({
    id: competition.id,
    label: competition.label,
    scope: competition.scope,
    charreadas: competition.charreadas.length
  })));
  console.info("[results-competitions-001] selected competition", selectedCompetition ? {
    id: selectedCompetition.id,
    label: selectedCompetition.label,
    scope: selectedCompetition.scope,
    charreadas: selectedCompetition.charreadas.length
  } : null);
  console.info("[resultados-002B] phase by charreada", charreadas.map((charreada, index) => ({
    charreadaId: charreada?.id || "",
    charreadaName: charreada?.name || `Charreada ${index + 1}`,
    phase: getResultsPhaseName(charreada)
  })));
  console.info("[resultados-002B] phase columns built", phaseColumns.map((column) => ({
    id: column.id,
    label: column.label,
    charreadaIds: column.charreadaIds
  })));
  console.info("[resultados-002B] scores grouped by phase", buildResultsPhaseGroupedTotals(standings, phaseColumns));
  console.info("[resultados-003] selected phase", selectedPhase?.label || "Todas");
  console.info("[resultados-003] phase detail charreadas", selectedPhase
    ? selectedPhase.sourceCharreadas.map((charreada) => ({ id: charreada.id, name: charreada.name }))
    : phaseColumns.map((column) => ({ phase: column.label, charreadas: column.charreadaIds.length })));
  console.info("[resultados-004] summary by phase rendered", {
    mode: "all",
    columns: phaseColumns.map((column) => column.label)
  });
  console.info("[resultados-004] phase detail rendered", selectedPhase ? {
    phase: selectedPhase.label,
    charreadas: selectedPhase.sourceCharreadas.map((charreada) => charreada.name)
  } : { phase: "Todas" });
  console.info("[resultados-004] visible teams by phase", {
    phase: selectedPhase?.label || "Todas",
    teams: visibleStandings.map((row) => getEntryDisplayName(row.team))
  });
  console.info("[resultados-005] general table by phase rendered", {
    columns: phaseColumns.map((column) => column.label),
    rows: standings.length
  });
  console.info("[resultados-005] sabana phase selector rendered", {
    selected: selectedPhase?.label || "Todas",
    options: phaseColumns.map((column) => column.label)
  });

  return html`
    <section class="content">
      <article class="scope-card results-scope-card">
        <div>
          <span>Vista del torneo activo</span>
          <h2>${escapeHTML(tournament.name)}</h2>
          <p>Esta pagina es operativa: muestra tabla, sabana y premiacion de la competencia seleccionada.</p>
        </div>
        <div class="scope-card-metrics">
          <div><span>${escapeHTML(labels.title)}</span><strong>${standings.length}</strong></div>
          <div><span>Jornadas</span><strong>${charreadas.length}</strong></div>
          <div><span>Fases</span><strong>${phaseColumns.length}</strong></div>
          <div><span>Competencias</span><strong>${competitions.length}</strong></div>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Competencia</h2>
            <p class="card-subtitle">Selecciona el bloque competitivo. Ranking, sabana y top no mezclan equipos con participantes individuales.</p>
          </div>
        </div>
        <div class="card-body">
          ${renderResultsCompetitionSelector(competitions, selectedCompetition?.id || "")}
        </div>
      </article>

      <div class="topbar-actions">
        <button class="button green" data-action="save-stat-history">Guardar este torneo en historial</button>
        <button class="button" data-action="export-csv">Exportar CSV</button>
        <a class="button" href="${escapeHTML(getPageHref("formato-federacion.html"))}" target="_blank" rel="noreferrer">Ver hoja Federacion</a>
        <button class="button primary" data-action="export-official-xlsx">Exportar Excel Federacion</button>
        <button class="button" data-action="export-json">Respaldo JSON</button>
      </div>

      <article class="card">
        <div class="card-header">
          <div>
	            <h2 class="card-title">${selectedCompetition?.scope === "individual" ? "Ranking individual" : "Ranking por equipos"}</h2>
            <p class="card-subtitle">
              ${escapeHTML(selectedCompetition?.label || "Competencia por equipos")} · Vista rapida por fase/ronda.
            </p>
          </div>
        </div>
        <div class="card-body">
          ${standings.length
            ? renderTournamentStandingsTable(phaseColumns, standings, {
                showMetrics: false,
                labels
              })
            : html`<div class="empty">Sin resultados en esta competencia.</div>`}
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${selectedPhase ? `Sabana - ${escapeHTML(selectedPhase.label)}` : "Sabana - Resumen general por fases"}</h2>
	            <p class="card-subtitle">
	              ${selectedPhase
                  ? html`Desglose por charreada y suerte solo de ${escapeHTML(selectedPhase.label)}.`
                  : html`Resumen general por fases y total del torneo.`}
	            </p>
          </div>
        </div>
        <div class="card-body">
          ${renderResultsPhaseSelector(phaseColumns, selectedPhaseId)}
          ${selectedPhase ? renderResultsPhaseDetail(selectedPhase) : ""}
          ${
            charreadas.length
              ? renderResultsScoreSheet({
                  selectedPhase,
                  phaseColumns,
                  standings: visibleStandings,
                  visibleTeamIds,
                  labels
                })
              : html`<div class="empty">Sin jornadas para esta competencia.</div>`
          }
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Top ${escapeHTML(selectedCompetition?.label || "competencia")}</h2>
            <p class="card-subtitle">Primeros lugares por suerte solo de la competencia seleccionada.</p>
          </div>
          <div class="award-control">
            <label for="individual-award-places">Lugares</label>
            <input id="individual-award-places" data-action="individual-awards-places" type="number" min="1" max="20" step="1" value="${awardPlaces}" ${locked ? "disabled" : ""}>
          </div>
        </div>
        <div class="card-body award-grid">
          ${awards
            .map(({ suerte, results }) => renderIndividualAwardPanel(suerte, results, awardPlaces))
            .join("")}
        </div>
      </article>
    </section>
  `;
}

function buildResultsCompetitionOptions(tournament = getActiveTournament(), charreadas = getTournamentCharreadas()) {
  const records = new Map();
  const tournamentId = tournament?.id || state.activeTournamentId || "";

  (Array.isArray(charreadas) ? charreadas : [])
    .filter((charreada) => charreada?.tournamentId === tournamentId)
    .forEach((charreada) => {
      const context = getCharreadaCompetitionContext(charreada, tournament);
      const typeConfig = getCompetitionType(context.competitionType);
      const id = context.competitionId || context.competitionType || typeConfig.type;
      const existing = records.get(id) || {
        id,
        type: context.competitionType || typeConfig.type,
        scope: context.competitionScope || typeConfig.scope,
        label: typeConfig.label || formatCompetitionTypeLabel(context.competitionType),
        category: charreada.category || charreada.categoria || "",
        phases: new Set(),
        charreadas: []
      };
      existing.charreadas.push(charreada);
      existing.phases.add(getResultsPhaseName(charreada));
      records.set(id, existing);
    });

  if (!records.size && tournamentId) {
    const typeConfig = getCompetitionType(tournament?.type === "caladero" || tournament?.type === "coleadero" || tournament?.type === "pialadero"
      ? tournament.type
      : "equipos_completo");
    records.set(typeConfig.type, {
      id: typeConfig.type,
      type: typeConfig.type,
      scope: typeConfig.scope,
      label: typeConfig.label,
      category: "",
      phases: new Set(),
      charreadas: []
    });
  }

  const order = new Map(COMPETITION_TYPES.map((competition, index) => [competition.type, index]));
  return [...records.values()]
    .map((competition) => ({
      ...competition,
      phases: [...competition.phases]
    }))
    .sort((left, right) =>
      (order.get(left.type) ?? 99) - (order.get(right.type) ?? 99) ||
      String(left.label || "").localeCompare(String(right.label || ""), "es")
    );
}

function getSelectedResultsCompetition(competitions = []) {
  if (!competitions.length) return null;
  const selected = String(state.resultsCompetitionFilter || "").trim();
  return competitions.find((competition) => competition.id === selected) || competitions[0];
}

function selectResultsCompetition(competitionId = "") {
  state.resultsCompetitionFilter = String(competitionId || "").trim();
  state.resultsPhaseFilter = "";
  console.info("[results-competitions-001] selector competition changed", state.resultsCompetitionFilter || "default");
  saveState({ silent: true });
  render();
}

function renderResultsCompetitionSelector(competitions = [], selectedId = "") {
  if (!competitions.length) return html`<div class="empty compact">Sin competencias programadas.</div>`;
  return html`
    <label class="results-competition-selector">
      <span>Competencia</span>
      <select data-action="select-results-competition">
        ${competitions.map((competition) => html`
          <option value="${escapeHTML(competition.id)}" ${competition.id === selectedId ? "selected" : ""}>
            ${escapeHTML(competition.label)}
          </option>
        `).join("")}
      </select>
    </label>
  `;
}

function getResultsCompetitionLabels(competition = null, tournament = getActiveTournament()) {
  const labels = getEntityLabels(tournament);
  if (competition?.scope !== "individual") return labels;
  return {
    ...labels,
    singular: "participante",
    plural: "participantes",
    title: "Participantes",
    nameHeader: "Participante"
  };
}

function formatCompetitionTypeLabel(type = "") {
  const competition = getCompetitionType(type || "equipos_completo");
  return competition.label || "Competencia por equipos";
}

function buildResultsCompetitionStandings(tournament = getActiveTournament(), competition = null, phaseColumns = []) {
  if (!competition) return [];
  const entries = buildResultsCompetitionEntryMap(competition);
  const rows = [...entries.values()].map((entry) => {
    const results = phaseColumns.map((column, index) => {
      const phaseCharreadas = (competition.charreadas || []).filter((charreada) => column.charreadaIds.includes(charreada.id));
      const participatedCharreadas = phaseCharreadas.filter((charreada) => hasCompetitionEntryInCharreada(charreada, entry.id));
      const participated = participatedCharreadas.length > 0;
      const total = participated
        ? participatedCharreadas.reduce((sum, charreada) => sum + getTeamCharreadaTotal(charreada.id, entry.id), 0)
        : null;
      const infr = participated
        ? participatedCharreadas.reduce((sum, charreada) => sum + getTeamInfrTotal(charreada.id, entry.id), 0)
        : 0;
      return {
        charreada: {
          id: column.id || `fase_${index + 1}`,
          name: column.label || column.phase || `Fase ${index + 1}`,
          charreadaIds: column.charreadaIds || []
        },
        participated,
        total,
        infr
      };
    });
    const played = results.filter((result) => result.participated);
    const total = played.reduce((sum, result) => sum + Number(result.total || 0), 0);
    const infr = played.reduce((sum, result) => sum + Number(result.infr || 0), 0);
    const average = played.length ? total / played.length : 0;
    const bestResult = played.length
      ? Math.max(...played.map((result) => Number(result.total || 0)))
      : 0;

    return {
      team: entry,
      results,
      total,
      average,
      charreadasCount: played.length,
      infr,
      negativePoints: infr,
      bestResult,
      competitionId: competition.id,
      competitionType: competition.type,
      competitionScope: competition.scope,
      category: entry.category || competition.category || "",
      tieBreakCriteria: {
        average,
        total,
        negativePoints: infr,
        bestResult,
        name: getEntryDisplayName(entry)
      }
    };
  });

  return rows
    .filter((row) => row.charreadasCount || competition.scope === "team")
    .sort(compareResultsCompetitionRows);
}

function buildResultsCompetitionEntryMap(competition = null) {
  const entries = new Map();
  (competition?.charreadas || []).forEach((charreada) => {
    getCharreadaScoringEntries(charreada).forEach((entry) => {
      if (!entry?.id || entries.has(entry.id)) return;
      entries.set(entry.id, {
        ...entry,
        competitionId: competition.id,
        competitionType: competition.type,
        competitionScope: competition.scope
      });
    });
    getScoreTeamIdsForCharreada(charreada.id).forEach((entryId) => {
      if (entries.has(entryId)) return;
      const entry = resolveScoreSheetEntry(charreada, entryId);
      if (entry?.id) entries.set(entry.id, entry);
    });
  });
  return entries;
}

function compareResultsCompetitionRows(left, right) {
  return Number(right.total || 0) - Number(left.total || 0) ||
    Number(left.negativePoints ?? left.infr ?? 0) - Number(right.negativePoints ?? right.infr ?? 0) ||
    Number(right.bestResult || 0) - Number(left.bestResult || 0) ||
    String(getEntryDisplayName(left.team) || "").localeCompare(String(getEntryDisplayName(right.team) || ""), "es");
}

function hasCompetitionEntryInCharreada(charreada = {}, entryId = "") {
  if (!charreada?.id || !entryId) return false;
  const scoringEntries = getCharreadaScoringEntries(charreada);
  if (scoringEntries.some((entry) => entry.id === entryId)) return true;
  return getScoreTeamIdsForCharreada(charreada.id).includes(entryId);
}

function buildResultsCompetitionAwards(tournament = getActiveTournament(), competition = null) {
  if (!competition) return [];
  const suertes = buildResultsSuerteColumns(competition.charreadas);
  return suertes.map((suerte) => {
    const results = [];
    (competition.charreadas || []).forEach((charreada) => {
      getCharreadaScoringEntries(charreada).forEach((entry) => {
        const collection = state.scores[scoreKey(charreada.id, entry.id, suerte.id)];
        if (!collection) return;

        if (suerte.type === "coleadero") {
          const coleadores = entry.isIndividualParticipant || entry.participantName ? collection.slice(0, 1) : collection;
          coleadores.forEach((coleadorAttempts, index) => {
            const attempts = Array.isArray(coleadorAttempts) ? coleadorAttempts : [];
            const total = attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
            const active = attempts.some((attempt) => hasAttemptActivity(attempt));
            if (!active) return;
            results.push({
              suerte,
              team: entry,
              charreada,
              charro: entry.participantName || entry.roster?.colas?.[index] || `Coleador ${index + 1}`,
              total
            });
          });
          return;
        }

        const attempts = Array.isArray(collection) ? collection : [];
        const total = attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
        const active = attempts.some((attempt) => hasAttemptActivity(attempt));
        if (!active) return;
        results.push({
          suerte,
          team: entry,
          charreada,
          charro: entry.participantName || getRosterNameForSuerte(entry, suerte) || "Sin registrar",
          total
        });
      });
    });
    results.sort((left, right) => Number(right.total || 0) - Number(left.total || 0) || String(left.charro || "").localeCompare(String(right.charro || ""), "es"));
    return { suerte, results };
  });
}

function renderGlobalStatsCenter() {
  const global = buildGlobalStatsCenter();

  return html`
    <section class="content stats-center-page">
      <article class="stats-hero-card">
        <div>
          <span>Vista global</span>
          <h2>Centro de Estadisticas CharroPro</h2>
          <p>Resumen de todos los torneos cargados y de los historiales guardados por temporada.</p>
        </div>
        <div class="stats-hero-grid">
          <div><span>Torneos</span><strong>${global.tournamentsCount}</strong></div>
          <div><span>Temporadas</span><strong>${global.seasonsCount}</strong></div>
          <div><span>Equipos</span><strong>${global.teamsCount}</strong></div>
          <div><span>Charreadas</span><strong>${global.charreadasCount}</strong></div>
        </div>
      </article>

      <div class="grid cols-2">
        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Ranking global</h2>
              <p class="card-subtitle">Promedio historico por equipo usando torneos guardados.</p>
            </div>
          </div>
          <div class="card-body">${renderGlobalTeamRanking(global.topTeams)}</div>
        </article>

        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Marcas globales por suerte</h2>
              <p class="card-subtitle">Mejores registros individuales entre historiales guardados.</p>
            </div>
          </div>
          <div class="card-body">${renderGlobalSuerteRecords(global.topSuerteRecords)}</div>
        </article>
      </div>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Historial de campeones</h2>
            <p class="card-subtitle">Campeones tomados del archivo historico guardado.</p>
          </div>
        </div>
        <div class="card-body">${renderChampionsHistory(global.championsHistory)}</div>
      </article>
    </section>
  `;
}

function renderTournamentStatsCenter() {
  const center = buildCharroProStatsCenter(state.activeTournamentId);
  const tournament = getActiveTournament();
  const labels = getEntityLabels(tournament);

  if (!center) {
    return html`<section class="content"><div class="empty">No hay torneo activo para estadisticas.</div></section>`;
  }

  return html`
    <section class="content stats-center-page">

      <article class="scope-card stats-active-scope">
        <div>
          <span>Torneo activo</span>
          <h2>${escapeHTML(center.tournament.name)}</h2>
          <p>Lo siguiente corresponde solo al torneo seleccionado: records, top 10, efectividad y premios individuales.</p>
        </div>
        <div class="scope-card-metrics">
          <div><span>${escapeHTML(labels.title)}</span><strong>${center.summary.teamsCount}</strong></div>
          <div><span>Charreadas</span><strong>${center.summary.charreadasCount}</strong></div>
          <div><span>Suertes</span><strong>${center.summary.suertesCount}</strong></div>
          <div><span>Publicadas</span><strong>${center.summary.publishedAttemptsCount}</strong></div>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Records del torneo activo</h2>
            <p class="card-subtitle">Marcas destacadas generadas automaticamente.</p>
          </div>
        </div>
        <div class="card-body stats-record-grid">
          ${center.tournamentRecords.map(renderStatsRecordCard).join("")}
        </div>
      </article>

      <div class="grid cols-2">
        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Top 10 ${escapeHTML(labels.plural)}</h2>
              <p class="card-subtitle">Ranking general por promedio, total e infracciones.</p>
            </div>
          </div>
          <div class="card-body">${renderStatsTopTeams(center.topTeams, labels)}</div>
        </article>

        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Efectividad por ${escapeHTML(labels.singular)}</h2>
              <p class="card-subtitle">Intentos exitosos sobre intentos publicados.</p>
            </div>
          </div>
          <div class="card-body">${renderTeamEffectiveness(center.effectiveness, labels)}</div>
        </article>
      </div>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Top 10 por suerte</h2>
            <p class="card-subtitle">Lideres individuales por cada suerte del torneo.</p>
          </div>
        </div>
        <div class="card-body stats-suerte-grid">
          ${renderTopBySuerte(center.topBySuerte)}
        </div>
      </article>

      <div class="grid cols-2">
        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Premios individuales</h2>
              <p class="card-subtitle">Segun los lugares configurados para premiacion.</p>
            </div>
          </div>
          <div class="card-body award-grid">
            ${center.individualAwards.map(({ suerte, results }) => renderIndividualAwardPanel(suerte, results, results.length || 5)).join("")}
          </div>
        </article>

        <article class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Guardar corte historico</h2>
              <p class="card-subtitle">Congela un corte estadistico de este torneo para futuras comparaciones.</p>
            </div>
          </div>
          <div class="card-body topbar-actions">
            <button class="button green" data-action="save-stat-history">Guardar este torneo en historial</button>
            <button class="button" data-view="globalStats">Ver estadisticas globales</button>
          </div>
        </article>
      </div>
    </section>
  `;
}

function buildGlobalStatsCenter() {
  const snapshots = getLatestHistorySnapshotsByTournament();
  const indexedTeamCount = state.tournaments.reduce((sum, tournament) => sum + Number(tournament.teamCount || 0), 0);
  const indexedCharreadaCount = state.tournaments.reduce((sum, tournament) => sum + Number(tournament.charreadaCount || 0), 0);
  const seasons = new Set([
    ...state.tournaments.map((tournament) => getTournamentSeason(tournament)),
    ...snapshots.map((snapshot) => getTournamentSeason(snapshot.tournament))
  ].filter(Boolean));

  return {
    tournamentsCount: state.tournaments.length,
    seasonsCount: seasons.size,
    teamsCount: indexedTeamCount || state.teams.length,
    charreadasCount: indexedCharreadaCount || state.charreadas.length,
    historyCount: snapshots.length,
    topTeams: buildGlobalTeamRanking(snapshots),
    topSuerteRecords: buildGlobalSuerteRecords(snapshots),
    championsHistory: buildGlobalChampionsHistory(snapshots)
  };
}

function buildGlobalChampionsHistory(snapshots = []) {
  return snapshots
    .map((snapshot) => ({
      snapshotId: snapshot.id || "",
      generatedAt: snapshot.generatedAt || "",
      tournament: snapshot.tournament || {},
      champion: snapshot.summary?.leader || null
    }))
    .filter((item) => item.champion?.team)
    .sort((a, b) => {
      const seasonDiff = Number(getTournamentSeason(b.tournament)) - Number(getTournamentSeason(a.tournament));
      if (seasonDiff) return seasonDiff;
      return Date.parse(b.generatedAt || "") - Date.parse(a.generatedAt || "");
    });
}

function buildGlobalTeamRanking(snapshots = []) {
  const rows = new Map();

  snapshots.forEach((snapshot) => {
    (snapshot.standings || []).forEach((row) => {
      if (!row.team) return;
      const name = getEntryDisplayName(row.team);
      const key = normalizeNameForCompare(name);
      if (!key) return;
      const current = rows.get(key) || {
        team: row.team,
        name,
        tournaments: 0,
        total: 0,
        averageSum: 0,
        bestTotal: 0,
        bestAverage: 0,
        championships: 0
      };
      current.tournaments += 1;
      current.total += Number(row.total || 0);
      current.averageSum += Number(row.average || 0);
      current.bestTotal = Math.max(current.bestTotal, Number(row.total || 0));
      current.bestAverage = Math.max(current.bestAverage, Number(row.average || 0));
      current.championships += row.rank === 1 ? 1 : 0;
      rows.set(key, current);
    });
  });

  return [...rows.values()]
    .map((row) => ({
      ...row,
      average: row.tournaments ? row.averageSum / row.tournaments : 0
    }))
    .sort((a, b) =>
      b.average - a.average ||
      b.championships - a.championships ||
      b.total - a.total ||
      a.name.localeCompare(b.name, "es")
    )
    .slice(0, 10)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildGlobalSuerteRecords(snapshots = []) {
  return snapshots
    .flatMap((snapshot) =>
      (snapshot.awards || []).flatMap((group) =>
        (group.results || []).map((result) => ({
          suerte: group.suerte,
          result,
          tournament: snapshot.tournament,
          generatedAt: snapshot.generatedAt || ""
        }))
      )
    )
    .sort((a, b) =>
      Number(b.result?.total || 0) - Number(a.result?.total || 0) ||
      String(a.result?.charro || "").localeCompare(String(b.result?.charro || ""), "es")
    )
    .slice(0, 10)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function renderGlobalTeamRanking(rows) {
  if (!rows.length) {
    return html`<div class="empty">Guarda historial estadistico de torneos para construir ranking global.</div>`;
  }

  return html`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th class="num">Prom.</th>
            <th class="num">Torneos</th>
            <th class="num">1ros</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => html`
            <tr>
              <td>${row.rank}</td>
              <td><strong>${escapeHTML(row.name)}</strong></td>
              <td class="num"><strong>${formatAverage(row.average)}</strong></td>
              <td class="num">${moneylessNumber(row.tournaments)}</td>
              <td class="num">${moneylessNumber(row.championships)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderGlobalSuerteRecords(records) {
  if (!records.length) {
    return html`<div class="empty">Todavia no hay marcas historicas por suerte.</div>`;
  }

  return html`
    <div class="global-record-list">
      ${records.map((record) => html`
        <section class="global-record-row">
          <b>${record.rank}</b>
          <div>
            <span>${escapeHTML(record.suerte?.fullName || record.suerte?.name || "Suerte")}</span>
            <strong>${escapeHTML(record.result?.charro || "Sin registrar")}</strong>
            <p>${escapeHTML(getEntryDisplayName(record.result?.team || {}))} / ${escapeHTML(record.tournament?.name || "Torneo")}</p>
          </div>
          <mark>${moneylessNumber(record.result?.total || 0)}</mark>
        </section>
      `).join("")}
    </div>
  `;
}

function renderStatsRecordCard(record) {
  return html`
    <div class="stats-record-card">
      <span>${escapeHTML(record.label)}</span>
      <strong>${escapeHTML(record.value)}</strong>
      <p>${escapeHTML(record.detail)}</p>
    </div>
  `;
}

function renderStatsTopTeams(rows, labels) {
  if (!rows.length) return html`<div class="empty">Sin resultados para ranking.</div>`;

  return html`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${escapeHTML(labels.nameHeader)}</th>
            <th class="num">Prom.</th>
            <th class="num">Total</th>
            <th class="num">Infr.</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => html`
            <tr>
              <td>${row.rank}</td>
              <td><strong>${escapeHTML(getEntryDisplayName(row.team))}</strong></td>
              <td class="num"><strong>${formatAverage(row.average)}</strong></td>
              <td class="num">${moneylessNumber(row.total)}</td>
              <td class="num">${moneylessNumber(row.infr)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTeamEffectiveness(rows, labels) {
  const activeRows = rows.filter((row) => row.possible > 0).slice(0, 10);
  if (!activeRows.length) {
    return html`<div class="empty">Aun no hay intentos publicados para calcular efectividad.</div>`;
  }

  return html`
    <div class="stats-effectiveness-list">
      ${activeRows.map((row, index) => html`
        <section class="stats-effectiveness-row">
          <div>
            <span>#${index + 1} ${escapeHTML(labels.singular)}</span>
            <strong>${escapeHTML(getEntryDisplayName(row.team))}</strong>
            <p>${row.successes} de ${row.possible} / ${moneylessNumber(row.points)} pts</p>
          </div>
          <mark>${formatPercent(row.percent)}</mark>
          <div class="stats-suerte-chips">
            ${row.bySuerte.slice(0, 4).map((item) => html`
              <span>${escapeHTML(item.suerte.name)} ${item.successes}/${item.possible}</span>
            `).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderTopBySuerte(groups) {
  const activeGroups = groups.filter((group) => group.results?.length);
  if (!activeGroups.length) return html`<div class="empty">Sin resultados individuales por suerte.</div>`;

  return activeGroups.map((group) => html`
    <section class="stats-suerte-panel">
      <header>
        <div>
          <span>${escapeHTML(group.suerte.name)}</span>
          <strong>${escapeHTML(group.suerte.fullName)}</strong>
        </div>
        <em>Top 10</em>
      </header>
      <ol>
        ${group.results.map((result) => html`
          <li>
            <b>${result.rank}</b>
            <span>
              <strong>${escapeHTML(result.charro)}</strong>
              <em>${escapeHTML(getEntryDisplayName(result.team))}</em>
            </span>
            <mark>${moneylessNumber(result.total)}</mark>
          </li>
        `).join("")}
      </ol>
    </section>
  `).join("");
}

function renderChampionsHistory(champions) {
  if (!champions.length) {
    return html`<div class="empty">Aun no hay campeones guardados. Guarda o congela un torneo para iniciar este historial.</div>`;
  }

  return html`
    <div class="champions-list">
      ${champions.slice(0, 12).map((item) => html`
        <section class="champion-row">
          <div>
            <span>${escapeHTML(getTournamentSeason(item.tournament))}</span>
            <strong>${escapeHTML(item.tournament.name || "Torneo")}</strong>
            <p>${escapeHTML(formatHistoryDate(item.generatedAt))}</p>
          </div>
          <div>
            <span>Campeon</span>
            <strong>${escapeHTML(getEntryDisplayName(item.champion.team))}</strong>
            <p>Total ${moneylessNumber(item.champion.total)} / Prom. ${formatAverage(item.champion.average)}</p>
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderHistory() {
  const tournament = getActiveTournament();
  const snapshots = getLatestHistorySnapshotsByTournament();
  const seasons = new Set(snapshots.map((snapshot) => getTournamentSeason(snapshot.tournament)).filter(Boolean));

  return html`
    <section class="content history-page">
      <div class="topbar-actions">
        <button class="button green" data-action="save-stat-history" ${tournament ? "" : "disabled"}>
          Guardar torneo activo en historial
        </button>
      </div>

      <article class="history-hero-card">
        <div>
          <span>Archivo historico</span>
          <h2>Temporadas y torneos guardados</h2>
          <p>Esta pagina no recalcula el torneo activo: aqui se consultan cortes guardados para estadisticas historicas.</p>
        </div>
        <div class="history-hero-stats">
          <div><span>Temporadas</span><strong>${seasons.size}</strong></div>
          <div><span>Torneos</span><strong>${snapshots.length}</strong></div>
          <div><span>Activo</span><strong>${escapeHTML(tournament ? getTournamentSeason(tournament) : "-")}</strong></div>
        </div>
      </article>

      ${renderHistoryArchive()}
    </section>
  `;
}

function renderHistoryArchive() {
  const snapshots = getLatestHistorySnapshotsByTournament();
  if (!snapshots.length) {
    return html`
      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Archivo historico</h2>
            <p class="card-subtitle">Aqui apareceran los torneos guardados por temporada.</p>
          </div>
        </div>
        <div class="card-body"><div class="empty">Guarda el primer historial estadistico para iniciar el archivo.</div></div>
      </article>
    `;
  }

  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Archivo historico por temporada</h2>
          <p class="card-subtitle">Consulta rapida de torneos ya guardados.</p>
        </div>
      </div>
      <div class="card-body history-season-list">
        ${groupHistorySnapshotsBySeason(snapshots).map((group) => html`
          <section class="history-season-section">
            <header>
              <div>
                <span>Temporada</span>
                <strong>${escapeHTML(group.season)}</strong>
              </div>
              <em>${group.snapshots.length} torneo${group.snapshots.length === 1 ? "" : "s"}</em>
            </header>
            <div class="history-archive-grid">
              ${group.snapshots.map(renderHistoryArchiveItem).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </article>
  `;
}

function getLatestHistorySnapshotsByTournament() {
  const byTournament = new Map();
  (state.statHistorySnapshots || []).forEach((snapshot) => {
    const tournamentId = snapshot.tournament?.id;
    if (!tournamentId) return;
    const current = byTournament.get(tournamentId);
    if (!current || Date.parse(snapshot.generatedAt || "") > Date.parse(current.generatedAt || "")) {
      byTournament.set(tournamentId, snapshot);
    }
  });

  return [...byTournament.values()].sort((a, b) => {
    const seasonDiff = Number(getTournamentSeason(b.tournament)) - Number(getTournamentSeason(a.tournament));
    if (seasonDiff) return seasonDiff;
    return Date.parse(b.generatedAt || "") - Date.parse(a.generatedAt || "");
  });
}

function groupHistorySnapshotsBySeason(snapshots) {
  const groups = new Map();
  snapshots.forEach((snapshot) => {
    const season = getTournamentSeason(snapshot.tournament);
    if (!groups.has(season)) groups.set(season, []);
    groups.get(season).push(snapshot);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([season, items]) => ({ season, snapshots: items }));
}

function renderHistoryArchiveItem(snapshot) {
  const leader = snapshot.summary?.leader;
  return html`
    <button class="history-archive-item" data-action="open-tournament" data-id="${escapeHTML(snapshot.tournament.id)}">
      <span>${escapeHTML(formatHistoryDate(snapshot.generatedAt))}</span>
      <strong>${escapeHTML(snapshot.tournament.name || "Torneo")}</strong>
      <em>${escapeHTML(leader?.team ? getEntryDisplayName(leader.team) : "Sin lider")} / ${moneylessNumber(leader?.total || 0)} pts</em>
    </button>
  `;
}

function renderHistoryLeader(snapshot) {
  const leader = snapshot.summary?.leader;
  if (!leader?.team) return html`<div class="empty">Sin lider guardado.</div>`;

  return html`
    <div class="history-leader">
      <span>#${leader.rank}</span>
      <strong>${escapeHTML(getEntryDisplayName(leader.team))}</strong>
      <p>Total ${moneylessNumber(leader.total)} / Prom. ${formatAverage(leader.average)} / Infr. ${moneylessNumber(leader.infr)}</p>
    </div>
  `;
}

function renderHistoryStandingsTable(snapshot, labels) {
  const columns = snapshot.columns || [];
  const standings = snapshot.standings || [];
  if (!standings.length) return html`<div class="empty">Sin tabla historica.</div>`;

  return html`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${escapeHTML(labels.nameHeader)}</th>
            ${columns.map((column) => html`<th class="num">${escapeHTML(column.name)}</th>`).join("")}
            <th class="num">Prom.</th>
            <th class="num">Total</th>
            <th class="num">Infr.</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map((row) => html`
            <tr>
              <td>${row.rank}</td>
              <td><strong>${escapeHTML(getEntryDisplayName(row.team || {}))}</strong></td>
              ${columns.map((column) => {
                const result = (row.results || []).find((item) => item.column?.id === column.id);
                return html`<td class="num">${result?.participated ? moneylessNumber(result.total) : "-"}</td>`;
              }).join("")}
              <td class="num"><strong>${formatAverage(row.average)}</strong></td>
              <td class="num"><strong>${moneylessNumber(row.total)}</strong></td>
              <td class="num">${moneylessNumber(row.infr)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderHistoryAwards(snapshot) {
  const groups = (snapshot.awards || []).filter((group) => group.results?.length);
  if (!groups.length) return html`<div class="empty">Sin lideres por suerte.</div>`;

  return groups.map((group) => html`
    <section class="award-panel">
      <header>
        <div>
          <span>${escapeHTML(group.suerte.fullName)}</span>
          <strong>Top 5</strong>
        </div>
      </header>
      <ol class="award-list">
        ${group.results.slice(0, 5).map((result) => html`
          <li>
            <b>${result.rank}</b>
            <span>
              <strong>${escapeHTML(result.charro)}</strong>
              <em>${escapeHTML(getEntryDisplayName(result.team || {}))}</em>
            </span>
            <mark>${moneylessNumber(result.total)}</mark>
          </li>
        `).join("")}
      </ol>
    </section>
  `).join("");
}

function renderHistoryCharreadas(snapshot) {
  const charreadas = snapshot.charreadas || [];
  if (!charreadas.length) return html`<div class="empty">Sin charreadas guardadas.</div>`;

  return html`
    <div class="history-charreada-list">
      ${charreadas.map((charreada) => {
        const winner = charreada.leaderboard?.[0];
        return html`
          <div class="history-charreada-row">
            <div>
              <span>${escapeHTML(formatDateLabel(charreada.date) || "Sin fecha")}</span>
              <strong>${escapeHTML(charreada.name)}</strong>
            </div>
            <div>
              <span>Ganador</span>
              <strong>${escapeHTML(winner?.team ? getEntryDisplayName(winner.team) : "Sin resultado")}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>${moneylessNumber(winner?.total || 0)}</strong>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function formatHistoryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderIndividualAwardPanel(suerte, results, awardPlaces) {
  const topResults = results.slice(0, awardPlaces);
  return html`
    <section class="award-panel">
      <header>
        <div>
          <span>${escapeHTML(suerte.fullName)}</span>
          <strong>Top ${awardPlaces}</strong>
        </div>
      </header>
      ${
        topResults.length
          ? html`
              <ol class="award-list">
                ${topResults.map((result, index) => html`
                  <li>
                    <b>${index + 1}</b>
                    <span>
                      <strong>${escapeHTML(result.charro)}</strong>
                      <em>${escapeHTML(getEntryDisplayName(result.team))}</em>
                    </span>
                    <mark>${moneylessNumber(result.total)}</mark>
                  </li>
                `).join("")}
              </ol>
            `
          : html`<div class="award-empty">Sin registro</div>`
      }
    </section>
  `;
}

function getIndividualAwardPlaces(tournament = getActiveTournament()) {
  return clampAwardPlaces(tournament?.individualAwardPlaces || 5);
}

function clampAwardPlaces(value) {
  const places = Math.round(Number(value || 5));
  if (!Number.isFinite(places)) return 5;
  return Math.max(1, Math.min(20, places));
}

function renderTournamentStandingsTable(columns, standings, options = {}) {
  const labels = options.labels || getEntityLabels();
  const showMetrics = options.showMetrics !== false;
  const phaseTotalColumn = options.phaseTotalColumn || null;
  return html`
    <div class="table-wrap">
      <table>
        <thead>
            <tr>
              <th>#</th>
	              <th>${escapeHTML(labels.nameHeader)}</th>
            ${columns.map((column, index) => html`
              <th class="num standings-phase-header" title="${escapeHTML(column.title || column.label)}">
                ${escapeHTML(column.label)}
              </th>
            `).join("")}
            ${phaseTotalColumn ? html`<th class="num">Total ${escapeHTML(phaseTotalColumn.label)}</th>` : ""}
            ${showMetrics ? html`<th class="num">Prom.</th>` : ""}
            ${showMetrics ? html`<th class="num">Neg.</th>` : ""}
            ${showMetrics ? html`<th class="num">Mejor</th>` : ""}
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${standings
            .map((row, index) => html`
              <tr>
                <td>${index + 1}</td>
	                <td><strong>${escapeHTML(getEntryDisplayName(row.team))}</strong></td>
                ${columns
                  .map((column) => {
                    const result = getStandingPhaseResult(row, column);
                    return html`<td class="num">${result.participated ? moneylessNumber(result.total) : "-"}</td>`;
                  })
                  .join("")}
                ${phaseTotalColumn ? html`<td class="num"><strong>${moneylessNumber(getStandingPhaseResult(row, phaseTotalColumn).total || 0)}</strong></td>` : ""}
                ${showMetrics ? html`<td class="num"><strong>${formatAverage(row.average)}</strong></td>` : ""}
                ${showMetrics ? html`<td class="num negative-points"><strong>${formatNegativePoints(row.negativePoints ?? row.infr)}</strong></td>` : ""}
                ${showMetrics ? html`<td class="num"><strong>${moneylessNumber(row.bestResult || 0)}</strong></td>` : ""}
                <td class="num"><strong>${moneylessNumber(row.total)}</strong></td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderResultsPhaseSelector(columns = [], selectedPhaseId = "") {
  if (!columns.length) return "";
  return html`
    <div class="results-phase-toolbar">
      <div class="segmented results-phase-selector" aria-label="Seleccionar fase de resultados">
        <button data-action="select-results-phase" data-id="" class="${selectedPhaseId ? "" : "active"}" type="button">Todas</button>
        ${columns.map((column) => html`
          <button
            data-action="select-results-phase"
            data-id="${escapeHTML(column.id)}"
            class="${column.id === selectedPhaseId ? "active" : ""}"
            type="button"
          >
            ${escapeHTML(column.label)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderResultsPhaseDetail(column = null) {
  if (!column) return "";
  return html`
    <section class="results-phase-detail" aria-label="Charreadas de la fase seleccionada">
      <strong>Charreadas de ${escapeHTML(column.label)}</strong>
      <div>
        ${column.sourceCharreadas.map((charreada, index) => html`
          <span class="pill blue">${index + 1}. ${escapeHTML(charreada.name)}</span>
        `).join("")}
      </div>
    </section>
  `;
}

function filterResultsStandingsByPhase(standings = [], column = null) {
  if (!column) return standings;
  return standings.filter((row) => getStandingPhaseResult(row, column).participated);
}

function buildResultsPhaseDetailColumns(column = {}) {
  return (column.sourceCharreadas || []).map((charreada, index) => ({
    id: `${column.id}_${charreada.id || index + 1}`,
    phase: column.phase,
    label: charreada.name || `Charreada ${index + 1}`,
    title: `${column.phase} · ${charreada.name || `Charreada ${index + 1}`}`,
    charreadaIds: [charreada.id],
    sourceCharreadas: [charreada]
  }));
}

function buildResultsPhaseColumns(charreadas = []) {
  const columns = new Map();

  charreadas.forEach((charreada, index) => {
    const phase = getResultsPhaseName(charreada);
    const key = normalizeResultsPhaseKey(phase);
    const charreadaId = charreada?.id || `charreada_${index + 1}`;
    const sourceCharreada = {
      ...charreada,
      id: charreadaId,
      name: String(charreada?.name || `Charreada ${index + 1}`).trim() || `Charreada ${index + 1}`,
      phase,
      teamIds: Array.isArray(charreada?.teamIds) ? charreada.teamIds : [],
      entryIds: getCharreadaScoringEntries(charreada).map((entry) => entry.id).filter(Boolean),
      competitionType: charreada?.competitionType || "",
      competitionScope: charreada?.competitionScope || "",
      competitionId: charreada?.competitionId || "",
      restas: charreada?.restas || {}
    };

    if (!columns.has(key)) {
      columns.set(key, {
        id: key,
        phase,
        label: phase,
        title: phase,
        charreadaIds: [],
        sourceCharreadas: []
      });
    }

    const column = columns.get(key);
    column.charreadaIds.push(charreadaId);
    column.sourceCharreadas.push(sourceCharreada);
  });

  return [...columns.values()];
}

function getResultsPhaseName(charreada = {}) {
  return getCharreadaPhase(charreada) || "Ronda única";
}

function getSelectedResultsPhaseId(columns = []) {
  const selected = String(state.resultsPhaseFilter || "").trim();
  if (!selected) return "";
  return columns.some((column) => column.id === selected) ? selected : "";
}

function selectResultsPhase(phaseId = "") {
  state.resultsPhaseFilter = String(phaseId || "").trim();
  console.info("[resultados-003] selector phase changed", state.resultsPhaseFilter || "Todas");
  console.info("[resultados-004] selector phase changed", state.resultsPhaseFilter || "Todas");
  console.info("[resultados-005] sabana phase changed", state.resultsPhaseFilter || "Todas");
  saveState({ silent: true });
  render();
}

function formatResultsPhaseCharreadas(column = {}) {
  const names = (column.sourceCharreadas || []).map((charreada) => charreada.name).filter(Boolean);
  return names.length ? names.join(", ") : "sin charreadas";
}

function normalizeResultsPhaseKey(value) {
  const key = String(value || "Ronda única")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/\s+/g, " ");
  return key || "ronda unica";
}

function getStandingPhaseResult(row = {}, column = {}) {
  const teamId = row.team?.id || "";
  const resultRows = getStandingResultsForPhase(row, column);
  if (resultRows.length) {
    const participatedRows = resultRows.filter((result) => result.participated);
    if (!participatedRows.length) return { participated: false, total: null };
    const total = participatedRows.reduce((sum, result) => (
      sum + (Number.isFinite(Number(result.total)) ? Number(result.total) : 0)
    ), 0);
    return { participated: true, total };
  }

  const phaseCharreadas = (column.sourceCharreadas || []).filter((charreada) =>
    (Array.isArray(charreada.entryIds) && charreada.entryIds.includes(teamId)) ||
    (Array.isArray(charreada.teamIds) && charreada.teamIds.includes(teamId)) ||
    hasTeamScoreInCharreada(teamId, charreada.id)
  );

  if (!teamId || !phaseCharreadas.length) {
    return { participated: false, total: null };
  }

  const total = phaseCharreadas.reduce((sum, charreada) => (
    sum + Number(getTeamCharreadaTotal(charreada.id, teamId) || 0)
  ), 0);

  return { participated: true, total };
}

function getStandingResultsForPhase(row = {}, column = {}) {
  const targetIds = new Set((column.charreadaIds || []).filter(Boolean));
  if (!targetIds.size || !Array.isArray(row.results)) return [];
  return row.results.filter((result) => {
    const resultIds = result?.charreada?.charreadaIds || [];
    return resultIds.some((charreadaId) => targetIds.has(charreadaId));
  });
}

function hasTeamScoreInCharreada(teamId = "", charreadaId = "") {
  if (!teamId || !charreadaId) return false;
  const charreada = state.charreadas.find((item) => item.id === charreadaId) || null;
  const tournament = state.tournaments.find((item) => item.id === charreada?.tournamentId) || getActiveTournament();
  return getCharreadaScoringSuertes(charreada, tournament).some((suerte) => hasScoreCollectionActivity(state.scores[scoreKey(charreadaId, teamId, suerte.id)]));
}

function hasScoreCollectionActivity(collection) {
  if (!collection) return false;
  const attempts = Array.isArray(collection) ? collection.flat(Infinity) : [collection];
  return attempts.some((attempt) => hasAttemptActivity(attempt));
}

function buildResultsPhaseGroupedTotals(standings = [], columns = []) {
  return standings.slice(0, 5).map((row) => ({
    teamId: row.team?.id || "",
    teamName: getEntryDisplayName(row.team),
    phases: columns.map((column) => {
      const result = getStandingPhaseResult(row, column);
      return {
        phase: column.phase,
        total: result.participated ? result.total : null
      };
    })
  }));
}

function renderScoreSheet(charreadas) {
  return renderDetailedScoreSheet(charreadas);
}

function renderResultsScoreSheet({ selectedPhase = null, phaseColumns = [], standings = [], visibleTeamIds = new Set(), labels = getEntityLabels() } = {}) {
  if (!selectedPhase) return renderPhaseSummaryScoreSheet(phaseColumns, standings, { labels });
  return renderDetailedScoreSheet(selectedPhase.sourceCharreadas || [], { visibleTeamIds, labels });
}

function renderPhaseSummaryScoreSheet(columns = [], standings = [], options = {}) {
  const labels = options.labels || getEntityLabels();
  return html`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>${escapeHTML(labels.nameHeader)}</th>
            ${columns.map((column) => html`<th class="num">${escapeHTML(column.label)}</th>`).join("")}
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map((row) => html`
            <tr>
              <td><strong>${escapeHTML(getEntryDisplayName(row.team))}</strong></td>
              ${columns.map((column) => {
                const result = getStandingPhaseResult(row, column);
                return html`<td class="num">${result.participated ? moneylessNumber(result.total) : "-"}</td>`;
              }).join("")}
              <td class="num"><strong>${moneylessNumber(row.total)}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderDetailedScoreSheet(charreadas, options = {}) {
  const suertes = options.suertes || buildResultsSuerteColumns(charreadas);
  const labels = options.labels || getEntityLabels();
  const visibleTeamIds = options.visibleTeamIds instanceof Set ? options.visibleTeamIds : null;
  const showRestas = charreadas.some((charreada) =>
    Object.values(charreada.restas || {}).some((value) => Number(value || 0) !== 0)
  );
  const rows = charreadas.flatMap((charreada) =>
    getScoreSheetTeamIds(charreada, visibleTeamIds).map((teamId) => ({ charreada, teamId, entry: resolveScoreSheetEntry(charreada, teamId) }))
  );

  if (!rows.length) return html`<div class="empty">Sin ${escapeHTML(labels.plural)} en esta fase.</div>`;

  return html`
    <div class="table-wrap">
      <table>
        <thead>
	          <tr>
	            <th>Charreada</th>
	            <th>${escapeHTML(labels.nameHeader)}</th>
            ${suertes.map((suerte) => html`<th class="num">${escapeHTML(suerte.name)}</th>`).join("")}
            ${showRestas ? html`<th class="num">Restas</th>` : ""}
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(({ charreada, teamId, entry }) => {
                return html`
                  <tr>
                    <td>${escapeHTML(charreada.name)}</td>
	                    <td><strong>${escapeHTML(entry ? getEntryDisplayName(entry) : "")}</strong></td>
                    ${suertes.map((suerte) => html`<td class="num">${moneylessNumber(getTeamSuerteTotal(charreada.id, teamId, suerte.id))}</td>`).join("")}
                    ${showRestas ? html`<td class="num">${moneylessNumber(getTeamCharreadaResta(charreada.id, teamId))}</td>` : ""}
                    <td class="num"><strong>${moneylessNumber(getTeamCharreadaTotal(charreada.id, teamId))}</strong></td>
                  </tr>
                `;
              })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getScoreSheetTeamIds(charreada = {}, visibleTeamIds = null) {
  const ids = new Set(getCharreadaScoringEntries(charreada).map((entry) => entry.id).filter(Boolean));
  getScoreTeamIdsForCharreada(charreada.id).forEach((teamId) => ids.add(teamId));
  return [...ids].filter((teamId) => !visibleTeamIds || visibleTeamIds.has(teamId));
}

function resolveScoreSheetEntry(charreada = {}, entryId = "") {
  if (!entryId) return null;
  return getCharreadaScoringEntries(charreada).find((entry) => entry.id === entryId) ||
    getTeam(entryId) ||
    {
      id: entryId,
      name: "Participante no registrado",
      participantName: "Participante no registrado"
    };
}

function buildResultsSuerteColumns(charreadas = []) {
  const suertes = [];
  const seen = new Set();
  (Array.isArray(charreadas) ? charreadas : []).forEach((charreada) => {
    const tournament = state.tournaments.find((item) => item.id === charreada?.tournamentId) || getActiveTournament();
    getCharreadaScoringSuertes(charreada, tournament).forEach((suerte) => {
      if (!suerte?.id || seen.has(suerte.id)) return;
      seen.add(suerte.id);
      suertes.push(suerte);
    });
  });
  return suertes;
}

function getScoreTeamIdsForCharreada(charreadaId = "") {
  if (!charreadaId) return [];
  const prefix = `${charreadaId}__`;
  const teamIds = new Set();
  Object.entries(state.scores || {}).forEach(([key, collection]) => {
    if (!key.startsWith(prefix) || !hasScoreCollectionActivity(collection)) return;
    const [, teamId] = key.split("__");
    if (teamId) teamIds.add(teamId);
  });
  return [...teamIds];
}

function renderRules(scope = "tournament") {
  const isGlobalScope = scope === "global";
  const tournament = getActiveTournament();
  const suertes = getRuleEditorSuertes(tournament, isGlobalScope);
  if (!suertes.length) return html`<section class="content"><div class="empty">Sin suertes disponibles.</div></section>`;

  if (!suertes.some((suerte) => suerte.id === state.ruleEditorSuerteId)) {
    state.ruleEditorSuerteId = suertes[0].id;
  }

  const suerte = suertes.find((item) => item.id === state.ruleEditorSuerteId) || suertes[0];
  const catalog = getEditableRuleCatalog(suerte.id, scope);
  const hasCustomRules = isGlobalScope
    ? Boolean(state.settings.globalRuleOverrides?.[suerte.id])
    : Boolean(tournament?.ruleOverrides?.[suerte.id]);
  const editorTitle = isGlobalScope ? "Botoneras generales" : "Botoneras del torneo";
  const editorSubtitle = isGlobalScope
    ? "Edita el reglamento base oculto del sistema. Los torneos heredan estos cambios salvo que tengan convocatoria propia."
    : "Edita etiquetas, puntos y botones activos. Los cambios aplican solo al torneo seleccionado.";
  const locked = !isGlobalScope && isTournamentFrozen(tournament);
  const statusLabel = hasCustomRules
    ? isGlobalScope ? "General personalizada" : "Personalizada"
    : isGlobalScope ? "Federacion base" : "Base general";
  const helpText = isGlobalScope
    ? "Usa esta vista para actualizar reglas permanentes. Si un torneo ya tiene botonera propia, ese torneo conserva su convocatoria."
    : "Desactiva un boton para ocultarlo del calificador. Agrega botones de convocatoria cuando un torneo tenga criterios propios.";

  return html`
    <section class="content">
      <article class="card rules-editor-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${editorTitle}</h2>
            <p class="card-subtitle">${editorSubtitle}</p>
          </div>
          <div class="topbar-actions">
            <button class="button" data-action="reset-rule-editor" data-suerte="${suerte.id}" data-scope="${scope}" ${hasCustomRules && !locked ? "" : "disabled"}>
              ${isGlobalScope ? "Restaurar general" : "Restaurar suerte"}
            </button>
            <button class="button primary" data-action="save-rule-editor" ${locked ? "disabled" : ""}>Guardar botoneras</button>
          </div>
        </div>
        <div class="card-body">
          <div class="rules-tabs">
            ${suertes.map((item) => html`
              <button class="${item.id === suerte.id ? "active" : ""}" data-action="select-rule-suerte" data-id="${item.id}">
                ${escapeHTML(item.name)}
              </button>
            `).join("")}
          </div>

          <form id="rules-form" class="rules-editor" data-suerte="${suerte.id}" data-scope="${scope}">
            <div class="rules-editor-heading">
              <div>
                <span class="pill ${hasCustomRules ? "amber" : "green"}">${statusLabel}</span>
                <h3>${escapeHTML(suerte.fullName)}</h3>
              </div>
              <p>${helpText}</p>
              ${locked ? html`<p class="locked-notice">Torneo congelado. Botoneras solo para consulta.</p>` : ""}
            </div>
            ${RULE_GROUPS.map((group) => renderRuleEditorGroup(group, catalog[group.id] || [], locked, scope)).join("")}
          </form>
        </div>
      </article>
    </section>
  `;
}

function renderRuleEditorGroup(group, rules, locked = false, scope = "tournament") {
  return html`
    <section class="rule-group-editor ${group.color}">
      <header>
        <div>
          <h4>${escapeHTML(group.title)}</h4>
          <p>${group.hasPoints ? "Etiqueta, puntos y visibilidad del boton." : "Motivos disponibles en el menu desplegable."}</p>
        </div>
        <span>${rules.filter((rule) => rule.enabled !== false).length}/${rules.length} activos</span>
      </header>
      <div class="rule-editor-list">
        ${rules.length
          ? rules.map((rule) => renderRuleEditorRow(group, rule, locked, scope)).join("")
          : html`<div class="empty compact-empty">Sin botones en este grupo.</div>`}
      </div>
      <div class="rule-add-row">
        <input id="new-rule-label-${group.id}" placeholder="${group.hasPoints ? "Nuevo boton" : "Nuevo motivo"}" ${locked ? "disabled" : ""}>
        ${
          group.hasPoints
            ? html`<input id="new-rule-pts-${group.id}" type="number" min="0" value="1" aria-label="Puntos" ${locked ? "disabled" : ""}>`
            : ""
        }
        <button class="button small ${group.color === "red" ? "red" : group.color === "green" ? "green" : ""}" data-action="add-rule-editor" data-group="${group.id}" ${locked ? "disabled" : ""}>
          Agregar
        </button>
      </div>
    </section>
  `;
}

function renderRuleEditorRow(group, rule, locked = false, scope = "tournament") {
  const isGlobalScope = scope === "global";
  const pillLabel = isGlobalScope ? "Base general" : (rule.custom ? "Convocatoria" : "Base general");
  const buttonLabel = isGlobalScope ? (rule.custom ? "Quitar" : "Ocultar") : (rule.custom ? "Quitar" : "Ocultar");
  return html`
    <div class="rule-editor-row ${rule.enabled === false ? "disabled" : ""}" data-rule-row data-group="${group.id}" data-id="${escapeHTML(rule.id)}" data-custom="${rule.custom ? "1" : "0"}">
      <label class="rule-toggle">
        <input type="checkbox" data-field="enabled" ${rule.enabled === false ? "" : "checked"} ${locked ? "disabled" : ""}>
        <span>Activo</span>
      </label>
      <input data-field="label" value="${escapeHTML(rule.label)}" placeholder="Etiqueta" ${locked ? "disabled" : ""}>
      ${
        group.hasPoints
          ? html`<input class="rule-points-input" data-field="pts" type="number" min="0" value="${Number(rule.pts || 0)}" aria-label="Puntos" ${locked ? "disabled" : ""}>`
          : html`<input data-field="pts" type="hidden" value="0">`
      }
      <span class="pill ${rule.custom && !isGlobalScope ? "blue" : "green"}">${pillLabel}</span>
      <button class="button small" data-action="delete-rule-editor" data-group="${group.id}" data-id="${escapeHTML(rule.id)}" ${locked ? "disabled" : ""}>
        ${buttonLabel}
      </button>
    </div>
  `;
}

function formatAverage(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0.0";
  return number.toFixed(1);
}

function formatNegativePoints(value) {
  const number = Math.abs(Number(value || 0));
  if (!Number.isFinite(number) || !number) return "0";
  return `-${moneylessNumber(number)}`;
}

function formatPercent(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0%";
  return `${Math.round(number)}%`;
}

function getActiveTournamentSuertes() {
  return getTournamentSuertes(getActiveTournament(), state.settings.globalRuleOverrides);
}

function renderRecoveryCenter() {
  return html`
    <section class="content recovery-center-page">
      ${renderRecoveryCenterCard()}
    </section>
  `;
}

function renderRecoveryCenterCard({ compact = false } = {}) {
  const tournament = getActiveTournament();
  const tournamentId = tournament?.id || "";
  const summary = buildRecoveryCenterSummary(tournament);
  const lastBackupAt = readRecoveryLastBackupAt(tournamentId);
  const hasRecentBackup = Boolean(lastBackupAt);
  const statusLabel = hasRecentBackup ? "Protegido" : "En riesgo";
  const statusMessage = hasRecentBackup
    ? "Ultimo respaldo generado hace unos momentos."
    : "Este torneo no tiene respaldo reciente.";

  console.info("[recovery-001b] recovery panel rendered", {
    tournamentId,
    status: statusLabel,
    compact
  });

  return html`
    <article class="card recovery-center-card ${hasRecentBackup ? "is-protected" : "is-risk"}">
      <div class="card-header">
        <div>
          <h2 class="card-title">🛡 Recovery Center</h2>
          <p class="card-subtitle">Respaldo manual del torneo activo.</p>
        </div>
        <span class="pill ${hasRecentBackup ? "green" : "red"}">Estado: ${escapeHTML(statusLabel)}</span>
      </div>
      <div class="card-body recovery-center-body">
        <div class="recovery-status-panel">
          <strong>${escapeHTML(statusMessage)}</strong>
          <p class="card-subtitle">Ultimo respaldo: ${lastBackupAt ? escapeHTML(formatRecoveryDateTime(lastBackupAt)) : "—"}</p>
        </div>
        <div class="recovery-summary-grid">
          <div class="stat">
            <span>Torneo actual</span>
            <strong>${escapeHTML(summary.tournamentName || "Sin torneo activo")}</strong>
          </div>
          <div class="stat">
            <span>Equipos</span>
            <strong>${summary.teamsCount}</strong>
          </div>
          <div class="stat">
            <span>Charreadas</span>
            <strong>${summary.charreadasCount}</strong>
          </div>
          <div class="stat">
            <span>Scores</span>
            <strong>${summary.scoresCount}</strong>
          </div>
        </div>
        <div class="recovery-actions">
          <button class="button primary" data-action="create-full-backup" ${tournamentId ? "" : "disabled"}>Crear respaldo completo</button>
          <button class="button" disabled>Restaurar respaldo — Proximamente</button>
        </div>
        ${renderRecoveryHealthPanel(tournamentId, summary)}
        ${renderRecoveryBackupHistory(tournamentId)}
      </div>
    </article>
  `;
}

function renderRecoveryHealthPanel(tournamentId = "", summary = buildRecoveryCenterSummary(getActiveTournament())) {
  const health = buildRecoveryHealthStatus(tournamentId, summary);
  console.info("[recovery-001d] health panel rendered", {
    tournamentId,
    status: health.status,
    indicators: health.indicators.map((indicator) => `${indicator.key}:${indicator.level}`)
  });

  return html`
    <section class="recovery-health">
      <div class="recovery-health-header">
        <div>
          <h3>🛡 Salud del torneo</h3>
          <p class="card-subtitle">Revision local de respaldo, datos, snapshot y actividad de scores.</p>
        </div>
        <span class="recovery-overall recovery-overall-${health.level}">${escapeHTML(health.status)}</span>
      </div>
      <div class="recovery-health-grid">
        ${health.indicators.map(renderRecoveryHealthIndicator).join("")}
      </div>
    </section>
  `;
}

function renderRecoveryHealthIndicator(indicator = {}) {
  return html`
    <article class="recovery-health-card recovery-health-${escapeHTML(indicator.level)}">
      <span aria-hidden="true">${escapeHTML(indicator.icon)}</span>
      <div>
        <strong>${escapeHTML(indicator.title)}</strong>
        <p>${escapeHTML(indicator.message)}</p>
      </div>
    </article>
  `;
}

function renderRecoveryBackupHistory(tournamentId = "") {
  const history = readRecoveryBackupHistory(tournamentId);
  console.info("[recovery-001c] backup history rendered", {
    tournamentId,
    count: history.length
  });

  return html`
    <section class="recovery-history">
      <div class="recovery-history-header">
        <div>
          <h3>📜 Historial de respaldos</h3>
          <p class="card-subtitle">Ultimos 10 respaldos generados en este navegador para este torneo.</p>
        </div>
        <button class="button small" data-action="clear-recovery-history" ${history.length ? "" : "disabled"}>Limpiar historial local</button>
      </div>
      ${history.length
        ? html`
          <div class="recovery-history-list">
            ${history.map(renderRecoveryBackupHistoryItem).join("")}
          </div>
        `
        : html`<div class="empty compact">Aún no hay respaldos registrados en este navegador.</div>`}
    </section>
  `;
}

function renderRecoveryBackupHistoryItem(record = {}) {
  return html`
    <article class="recovery-history-item">
      <div>
        <strong>${escapeHTML(formatRecoveryDateTime(record.createdAt) || "Sin fecha")}</strong>
        <span>Tipo: ${escapeHTML(record.type === "manual" ? "Manual" : record.type || "Manual")}</span>
      </div>
      <div class="recovery-history-file">
        <span>Archivo</span>
        <strong>${escapeHTML(record.fileName || "—")}</strong>
      </div>
      <div class="recovery-history-meta">
        <span>Equipos ${Number(record.teamsCount || 0)}</span>
        <span>Charreadas ${Number(record.charreadasCount || 0)}</span>
        <span>Scores ${Number(record.scoresCount || 0)}</span>
      </div>
    </article>
  `;
}

function renderSettings() {
  const liveScreenGroups = getLiveScreenGroups();
  const role = firebaseAccess.role;
  const canSettings = roleCan(role, "settings");
  const canOperate = roleCan(role, "operate");
  const canManage = roleCan(role, "manage");

  return html`
    <section class="content">
      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Acceso y sincronizacion en vivo</h2>
            <p class="card-subtitle">Roles de Firebase y estado compartido entre dispositivos.</p>
          </div>
          <div class="topbar-actions">
            ${isActiveAccessSession(firebaseAccess)
              ? html`<button class="button small" data-action="sign-out-access">Cerrar sesion</button>`
              : html`<button class="button primary small" data-action="show-access-login">Iniciar sesion</button>`}
          </div>
        </div>
        <div class="card-body grid">
          <div class="quick-team-list">
            <span class="pill ${isActiveAccessSession(firebaseAccess) ? "green" : "red"}">
              ${getAccessStatusText()}
            </span>
            <span class="pill blue">Estado del torneo: charropro/tournaments/${escapeHTML(state.activeTournamentId || "sin-torneo")}</span>
            <span class="pill">Dispositivo: ${escapeHTML(firebaseClientId)}</span>
          </div>
          <div class="quick-team-list">
            ${renderPermissionPill("Operar evento", roleCan(role, "operate"))}
            ${renderPermissionPill("Calificar", roleCan(role, "score"))}
            ${renderPermissionPill("Cronometro", roleCan(role, "timer"))}
            ${renderPermissionPill("Botoneras", roleCan(role, "rules"))}
            ${renderPermissionPill("Auditoria", roleCan(role, "audit"))}
            ${renderPermissionPill("Usuarios", roleCan(role, "users"))}
            ${renderPermissionPill("Graficos", roleCan(role, "graphics"))}
          </div>
          <p class="card-subtitle">Operador y supervisor administran el evento. Juez califica y maneja cronometro. Solo lectura consulta sin publicar cambios.</p>
        </div>
      </article>

      ${renderFirebaseDiagnosticsPanel()}

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Sincronizacion Google Sheets</h2>
            <p class="card-subtitle">Pega la URL del Web App de Google Apps Script.</p>
          </div>
        </div>
        <div class="card-body grid">
          <label for="sheets-url">URL del Web App</label>
          <input id="sheets-url" value="${escapeHTML(state.settings.googleSheetsUrl || "")}" placeholder="https://script.google.com/macros/s/...">
          <div class="topbar-actions">
            <button class="button primary" data-action="save-settings" ${canSettings ? "" : "disabled"}>Guardar</button>
            <button class="button" data-action="test-sync" ${canOperate ? "" : "disabled"}>Enviar prueba</button>
            <button class="button green" data-action="publish-live-state" ${canOperate ? "" : "disabled"}>Enviar estado actual</button>
          </div>
          <p class="card-subtitle">Firebase en vivo: canal del torneo activo <strong>charropro/live/${escapeHTML(getActiveLiveChannel())}</strong>. Los links copiados de aqui quedan separados por torneo.</p>
          <p class="card-subtitle">Ultimo intento guardado: ${escapeHTML(state.settings.lastSyncAt || "Sin sincronizar")}</p>
        </div>
      </article>

      ${renderPublicPageLinksCard()}

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Pantallas en vivo</h2>
            <p class="card-subtitle">Abrelas en otra ventana o copia la URL para OBS.</p>
          </div>
        </div>
        <div class="card-body grid">
          <div class="live-screen-groups">
            ${liveScreenGroups.map(renderLiveScreenGroup).join("")}
          </div>
          <p class="card-subtitle">Los graficos OBS son para fuentes de navegador. Controles y operacion son paginas para manejar o consultar el evento.</p>
        </div>
      </article>

      ${renderRecoveryCenterCard({ compact: true })}

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Respaldos</h2>
            <p class="card-subtitle">Exporta datos o limpia la prueba local.</p>
          </div>
        </div>
        <div class="card-body topbar-actions">
          <button class="button" data-action="export-json">Descargar respaldo</button>
          <button class="button primary" data-action="export-official-xlsx">Descargar Excel Federacion</button>
          <button class="button" data-action="clear-local-cache">Limpiar cache local</button>
          <button class="button red" data-action="reset-data" ${canManage ? "" : "disabled"}>Borrar datos locales</button>
        </div>
      </article>
    </section>
  `;
}

function renderPermissionPill(label, enabled) {
  return html`<span class="pill ${enabled ? "green" : "red"}">${enabled ? "SI" : "NO"} ${escapeHTML(label)}</span>`;
}

function buildRecoveryCenterSummary(tournament = {}) {
  const tournamentId = tournament?.id || "";
  const teams = tournamentId ? getTournamentTeams(tournamentId) : [];
  const charreadas = tournamentId ? getTournamentCharreadas(tournamentId) : [];
  const charreadaIds = new Set(charreadas.map((charreada) => charreada.id));
  const teamIds = new Set(teams.map((team) => team.id));
  const scoresCount = Object.keys(state.scores || {})
    .filter((key) => scoreKeyBelongsToTournament(key, charreadaIds, teamIds))
    .length;

  return {
    tournamentId,
    tournamentName: tournament?.name || "",
    teamsCount: teams.length,
    charreadasCount: charreadas.length,
    scoresCount
  };
}

function getRecoveryLastBackupStorageKey(tournamentId = "") {
  return scopedStorageKey(`${RECOVERY_LAST_BACKUP_STORAGE_KEY}_${tournamentId || "sin_torneo"}`);
}

function getRecoveryBackupHistoryStorageKey(tournamentId = "") {
  return scopedStorageKey(`${RECOVERY_BACKUP_HISTORY_STORAGE_KEY}_${tournamentId || "sin_torneo"}`);
}

function readRecoveryLastBackupAt(tournamentId = "") {
  if (!tournamentId) return "";
  try {
    return sessionStorage.getItem(getRecoveryLastBackupStorageKey(tournamentId)) || "";
  } catch {
    return "";
  }
}

function saveRecoveryLastBackupAt(tournamentId = "", createdAt = "") {
  if (!tournamentId || !createdAt) return;
  try {
    sessionStorage.setItem(getRecoveryLastBackupStorageKey(tournamentId), createdAt);
  } catch {
    // El respaldo ya se descargo; si sessionStorage falla, no debe bloquear al juez/operador.
  }
  console.info("[recovery-001b] backup status updated", {
    tournamentId,
    lastBackupAt: createdAt
  });
}

function readRecoveryBackupHistory(tournamentId = "") {
  if (!tournamentId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(getRecoveryBackupHistoryStorageKey(tournamentId)) || "[]");
    return Array.isArray(parsed)
      ? parsed
        .filter((record) => record && typeof record === "object")
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

function buildRecoveryHealthStatus(tournamentId = "", summary = buildRecoveryCenterSummary(getActiveTournament())) {
  const backupHistory = readRecoveryBackupHistory(tournamentId);
  const latestBackup = backupHistory[0] || null;
  const backupTimestamp = latestBackup?.createdAt ? new Date(latestBackup.createdAt).getTime() : NaN;
  const backupAgeMs = Number.isFinite(backupTimestamp) ? Date.now() - backupTimestamp : Infinity;
  const hasTournament = Boolean(tournamentId && getActiveTournament()?.id === tournamentId);
  const missingData = !summary.teamsCount || !summary.charreadasCount || !summary.scoresCount;
  const hasSnapshot = Boolean(getLocalRecoveryPublicSnapshot(tournamentId));
  const indicators = [
    {
      key: "backup",
      level: !latestBackup ? "red" : backupAgeMs > 24 * 60 * 60 * 1000 ? "yellow" : "green",
      icon: !latestBackup ? "🔴" : backupAgeMs > 24 * 60 * 60 * 1000 ? "🟡" : "🟢",
      title: !latestBackup ? "Sin respaldo local" : backupAgeMs > 24 * 60 * 60 * 1000 ? "Respaldo local antiguo" : "Respaldo reciente",
      message: latestBackup
        ? `Ultimo respaldo: ${formatRecoveryDateTime(latestBackup.createdAt)}`
        : "No hay respaldo registrado en este navegador."
    },
    {
      key: "data",
      level: !hasTournament ? "red" : missingData ? "yellow" : "green",
      icon: !hasTournament ? "🔴" : missingData ? "🟡" : "🟢",
      title: !hasTournament ? "Sin torneo activo" : missingData ? "Datos incompletos" : "Torneo con datos",
      message: hasTournament
        ? `${summary.teamsCount} equipos / ${summary.charreadasCount} charreadas / ${summary.scoresCount} scores`
        : "No se detecto torneo activo."
    },
    {
      key: "snapshot",
      level: hasSnapshot ? "green" : "yellow",
      icon: hasSnapshot ? "🟢" : "🟡",
      title: hasSnapshot ? "Snapshot publico local detectado" : "Snapshot publico no detectado en esta sesion",
      message: hasSnapshot
        ? "Hay snapshot publico cargado en memoria local."
        : "Puede existir en Firebase; esta revision solo valida datos cargados localmente."
    },
    {
      key: "scores",
      level: summary.scoresCount ? "green" : "yellow",
      icon: summary.scoresCount ? "🟢" : "🟡",
      title: summary.scoresCount ? `${summary.scoresCount} scores registrados` : "Sin scores registrados",
      message: summary.scoresCount
        ? "Hay actividad de calificacion local en el torneo."
        : "Aun no hay scores detectados localmente."
    }
  ];
  const level = indicators.some((indicator) => indicator.level === "red")
    ? "risk"
    : indicators.some((indicator) => indicator.level === "yellow") ? "warning" : "protected";
  const status = level === "risk" ? "RIESGO" : level === "warning" ? "ADVERTENCIA" : "PROTEGIDO";
  console.info("[recovery-001d] health status calculated", {
    tournamentId,
    status,
    levels: indicators.map((indicator) => indicator.level)
  });
  return { level, status, indicators };
}

function saveRecoveryBackupHistoryRecord(backup = {}, fileName = "") {
  const manifest = backup.manifest || {};
  const tournamentId = manifest.tournamentId || "";
  if (!tournamentId) return;
  const record = {
    id: uid("backup_history"),
    createdAt: manifest.createdAt || new Date().toISOString(),
    fileName,
    tournamentId,
    tournamentName: manifest.tournamentName || "",
    teamsCount: Number(manifest.teamsCount || 0),
    charreadasCount: Number(manifest.charreadasCount || 0),
    scoresCount: Number(manifest.scoresCount || 0),
    publishedScoresCount: Number(manifest.publishedScoresCount || 0),
    appVersion: manifest.appVersion || CHARROPRO_APP_VERSION,
    type: "manual"
  };
  const nextHistory = [record, ...readRecoveryBackupHistory(tournamentId)]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10);
  try {
    localStorage.setItem(getRecoveryBackupHistoryStorageKey(tournamentId), JSON.stringify(nextHistory));
  } catch {
    // El historial local no debe bloquear la descarga del respaldo.
  }
  console.info("[recovery-001c] backup history saved", {
    tournamentId,
    count: nextHistory.length
  });
}

function clearRecoveryBackupHistory() {
  const tournamentId = getActiveTournament()?.id || "";
  if (!tournamentId) {
    showToast("No hay torneo activo para limpiar historial.");
    return;
  }
  try {
    localStorage.removeItem(getRecoveryBackupHistoryStorageKey(tournamentId));
  } catch {
    // Si el navegador bloquea localStorage, solo se refresca la vista.
  }
  console.info("[recovery-001c] backup history cleared", { tournamentId });
  showToast("Historial local de respaldos limpiado.");
  if (["recovery", "settings"].includes(state.view)) render();
}

function formatRecoveryDateTime(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function createRecoveryFullBackup() {
  const tournament = getActiveTournament();
  if (!tournament?.id) {
    showToast("No hay torneo activo para respaldar.");
    return;
  }

  console.info("[recovery-001] backup started", { tournamentId: tournament.id });
  const backup = buildRecoveryFullBackup(tournament);
  const filename = buildRecoveryBackupFilename(tournament.id);
  downloadJsonFile(filename, backup);
  saveRecoveryLastBackupAt(tournament.id, backup.manifest?.createdAt || new Date().toISOString());
  saveRecoveryBackupHistoryRecord(backup, filename);
  registerEvent(buildEvent(EVENT_TYPES.BACKUP_CREATED, {
    fileName: filename,
    tournamentId: backup.manifest?.tournamentId || tournament.id,
    tournamentName: backup.manifest?.tournamentName || tournament.name || "",
    teamsCount: backup.manifest?.teamsCount || 0,
    charreadasCount: backup.manifest?.charreadasCount || 0,
    scoresCount: backup.manifest?.scoresCount || 0,
    publishedScoresCount: backup.manifest?.publishedScoresCount || 0
  }, {
    tournamentId: backup.manifest?.tournamentId || tournament.id,
    source: "recovery-center"
  }));
  console.info("[recovery-001] backup downloaded", {
    tournamentId: tournament.id,
    filename
  });
  if (["recovery", "settings"].includes(state.view)) render();
  showToast("Respaldo generado correctamente.");
}

function buildRecoveryFullBackup(tournament) {
  const tournamentId = tournament.id;
  const teams = getTournamentTeams(tournamentId).map(cloneJson);
  const charreadas = getTournamentCharreadas(tournamentId).map(cloneJson);
  const charreadaIds = new Set(charreadas.map((charreada) => charreada.id));
  const teamIds = new Set(teams.map((team) => team.id));
  const scores = Object.fromEntries(
    Object.entries(state.scores || {})
      .filter(([key]) => scoreKeyBelongsToTournament(key, charreadaIds, teamIds))
      .map(([key, value]) => [key, cloneJson(value)])
  );
  const publishedScores = (state.publishedScores || [])
    .filter((score) => (score.tournament?.id || score.tournamentId || "") === tournamentId)
    .map(cloneJson);
  const users = buildRecoveryTournamentUsers(tournamentId);
  const createdAt = new Date().toISOString();
  const backup = {
    manifest: {
      app: "CharroPro",
      backupVersion: 1,
      createdAt,
      tournamentId,
      tournamentName: tournament.name || "",
      teamsCount: teams.length,
      charreadasCount: charreadas.length,
      scoresCount: Object.keys(scores).length,
      publishedScoresCount: publishedScores.length,
      appVersion: CHARROPRO_APP_VERSION
    },
    tournament: cloneJson(tournament),
    teams,
    charreadas,
    scores,
    publishedScores,
    publicSnapshot: getLocalRecoveryPublicSnapshot(tournamentId),
    settings: buildRecoveryPublicSettings(tournament),
    users,
    roles: users.map((user) => ({
      uid: user.uid || "",
      role: user.role || "",
      active: Boolean(user.active),
      tournamentAccess: user.tournamentAccess || "",
      tournamentIds: user.tournamentIds || []
    })),
    audit: buildRecoveryAuditBasic(tournamentId),
    version: CHARROPRO_APP_VERSION
  };
  console.info("[recovery-001] backup built", {
    tournamentId,
    teamsCount: backup.manifest.teamsCount,
    charreadasCount: backup.manifest.charreadasCount,
    scoresCount: backup.manifest.scoresCount,
    publishedScoresCount: backup.manifest.publishedScoresCount
  });
  return backup;
}

function buildRecoveryTournamentUsers(tournamentId = "") {
  return (firebaseUsers || [])
    .filter((user) => {
      const access = normalizeTournamentAccess(user);
      return access.tournamentAccess !== "selected" || access.tournamentIds.includes(tournamentId);
    })
    .map((user) => ({
      uid: user.uid || "",
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      active: Boolean(user.active),
      tournamentAccess: normalizeTournamentAccess(user).tournamentAccess,
      tournamentIds: normalizeTournamentAccess(user).tournamentIds || []
    }));
}

function buildRecoveryPublicSettings(tournament = {}) {
  return {
    graphicsConfig: cloneJson(state.settings?.graphicsConfig || null),
    ruleOverrides: cloneJson(tournament.ruleOverrides || {}),
    globalRuleOverrides: cloneJson(state.settings?.globalRuleOverrides || {}),
    scoringButtonLayouts: cloneJson(tournament.scoringButtonLayouts || state.settings?.scoringButtonLayouts || {}),
    globalRuleOverridesUpdatedAt: state.settings?.globalRuleOverridesUpdatedAt || null
  };
}

function buildRecoveryAuditBasic(tournamentId = "") {
  const lastPublished = firebaseDiagnostics.lastPublishedScore || {};
  return {
    localCounts: getLocalTournamentDiagnostics(tournamentId),
    remoteCounts: cloneJson(firebaseDiagnostics.remoteCounts?.[tournamentId] || {}),
    localVersion: Number(firebaseDiagnostics.localVersions?.[tournamentId] || 0),
    remoteVersion: Number(firebaseDiagnostics.remoteVersions?.[tournamentId] || 0),
    activeCharreadaId: firebaseDiagnostics.activeCharreadaIds?.[tournamentId] || state.activeCharreadaId || "",
    lastPublishedScore: lastPublished.tournamentId === tournamentId ? cloneJson(lastPublished) : null,
    lastPublishedScoreError: firebaseDiagnostics.lastPublishedScoreError || "",
    scoresListener: cloneJson(firebaseDiagnostics.scoresListener || null)
  };
}

function getLocalRecoveryPublicSnapshot(tournamentId = "") {
  const snapshots = state.publicSnapshots || state.publicTournaments || null;
  if (snapshots && typeof snapshots === "object") return cloneJson(snapshots[tournamentId] || null);
  return null;
}

function buildRecoveryBackupFilename(tournamentId = "") {
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, "").replace(/[:T]/g, "-");
  return `CharroPro_Backup_${sanitizeFilenamePart(tournamentId || "sin_torneo")}_${stamp}.json`;
}

function sanitizeFilenamePart(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "sin_dato";
}

function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderFirebaseDiagnosticsPanel() {
  const activeTournament = getActiveTournament();
  const tournamentIds = firebaseAccess.tournamentIds || [];
  const activeTournamentId = activeTournament?.id || state.activeTournamentId || "";
  const localCounts = activeTournamentId ? getLocalTournamentDiagnostics(activeTournamentId) : {};
  const remoteCounts = activeTournamentId ? firebaseDiagnostics.remoteCounts?.[activeTournamentId] || {} : {};
  const localVersion = activeTournamentId ? getLocalTournamentVersion(activeTournamentId) : 0;
  const remoteVersion = activeTournamentId ? Number(firebaseDiagnostics.remoteVersions?.[activeTournamentId] || 0) : 0;
  const scoresListener = firebaseDiagnostics.scoresListener || {};
  const lastPublishedDiagnostic = firebaseDiagnostics.lastPublishedScore || {};
  const firebaseStatus = isFirebaseLiveConfigured()
    ? firebaseAccess.ready ? "Firebase configurado / sesion leida" : "Firebase configurado / conectando sesion"
    : "Firebase no configurado";

  const rows = [
    ["Usuario", firebaseAccess.name || firebaseAccess.email || "-"],
    ["UID", firebaseAccess.uid || "-"],
    ["Rol", getRoleLabel(firebaseAccess.role)],
    ["Activo", firebaseAccess.active ? "Si" : "No"],
    ["Acceso torneos", firebaseAccess.tournamentAccess || "-"],
    ["Torneos asignados", tournamentIds.length ? tournamentIds.join(", ") : "-"],
    ["Torneo actual", activeTournament ? `${activeTournament.name} / ${activeTournament.id}` : state.activeTournamentId || "-"],
    ["Ultima sincronizacion", prepareState.syncedAt || state.settings.lastPreparationSyncAt || "-"],
    ["Version local", localVersion || "0"],
    ["Version remota", remoteVersion || "0"],
    ["Equipos local/remoto", `${localCounts.teams || 0} / ${remoteCounts.teams || 0}`],
    ["Charreadas local/remoto", `${localCounts.charreadas || 0} / ${remoteCounts.charreadas || 0}`],
    ["Scores local/remoto", `${localCounts.scores || 0} / ${remoteCounts.scores || 0}`],
    ["Publicaciones local/remoto", `${localCounts.publishedScores || 0} / ${remoteCounts.publishedScores || 0}`],
    ["Ultimo publishedScore", lastPublishedDiagnostic.id || "-"],
    ["Ruta ultimo publishedScore", lastPublishedDiagnostic.path || "-"],
    ["Ruta auditoria publishedScore", lastPublishedDiagnostic.auditPath || "-"],
    ["Ultimo error publicacion oficial", firebaseDiagnostics.lastPublishedScoreError || "-"],
    ["Escuchando scores", scoresListener.listening ? "Si" : "No"],
    ["Ruta scores", scoresListener.path || "-"],
    ["Scores recibidos", String(scoresListener.count || 0)],
    ["Ultimo score recibido", scoresListener.lastScoreId || "-"],
    ["Ultimo error listener scores", scoresListener.lastError || "-"],
    ["Conexion Firebase", `${firebaseStatus}${navigator.onLine ? "" : " / sin internet del navegador"}`],
    ["Ultimo error de sincronizacion", lastSyncError || lastFirebaseError || firebaseDiagnostics.lastError || "Sin errores registrados"]
  ];

  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Diagnostico CharroPro</h2>
          <p class="card-subtitle">Diagnostico CharroPro de este dispositivo para leer y escribir torneos.</p>
        </div>
      </div>
      <div class="card-body">
        <div class="table-wrap">
          <table>
            <tbody>
              ${rows.map(([label, value]) => html`
                <tr>
                  <th>${escapeHTML(label)}</th>
                  <td>${escapeHTML(value)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

function renderUsersAdmin() {
  if (!roleCan(firebaseAccess.role, "users")) {
    return renderRoleAccessHome();
  }

  return html`
    <section class="content">
      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Usuarios y permisos</h2>
            <p class="card-subtitle">Administra los roles que CharroPro lee desde Firebase Authentication + Realtime Database.</p>
          </div>
          <button class="button primary" data-action="new-user-profile">Agregar usuario</button>
        </div>
        <div class="card-body">
          ${firebaseUsers.length ? renderUsersTable() : html`<div class="empty">Aun no hay usuarios o Firebase no permitio leer la lista.</div>`}
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Como dar de alta</h2>
            <p class="card-subtitle">Con Cloud Functions puedes crear la cuenta completa desde CharroPro.</p>
          </div>
        </div>
        <div class="card-body">
          <div class="quick-team-list">
            <span class="pill blue">1. Agregar usuario</span>
            <span class="pill blue">2. Correo y contrasena</span>
            <span class="pill green">3. Asignar rol</span>
            <span class="pill">4. Guardar</span>
          </div>
          <p class="card-subtitle">Si la funcion aun no esta desplegada, usa el metodo de respaldo: crea la cuenta en Firebase Authentication, copia el UID y pegalo aqui.</p>
        </div>
      </article>
    </section>
  `;
}

function renderUsersTable() {
  return html`
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Torneos</th>
            <th>Estado</th>
            <th class="num">Accion</th>
          </tr>
        </thead>
        <tbody>
          ${firebaseUsers.map((user) => html`
            <tr>
              <td>
                <strong>${escapeHTML(user.name || "Sin nombre")}</strong>
                <p class="table-subtext">${escapeHTML(user.uid)}</p>
              </td>
              <td>${escapeHTML(user.email || "")}</td>
              <td><span class="pill blue">${escapeHTML(getRoleLabel(user.role))}</span></td>
              <td>${renderUserTournamentAccess(user)}</td>
              <td><span class="pill ${user.active ? "green" : "red"}">${user.active ? "Activo" : "Inactivo"}</span></td>
              <td class="num">
                <button class="button small" data-action="edit-user-profile" data-uid="${escapeHTML(user.uid)}">Editar</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderUserTournamentAccess(user) {
  const access = normalizeTournamentAccess(user);
  if (access.tournamentAccess !== "selected") return html`<span class="pill green">Todos activos</span>`;
  if (!access.tournamentIds.length) return html`<span class="pill red">Sin torneos</span>`;
  const operationalIds = access.tournamentIds.filter((id) => {
    const tournament = state.tournaments.find((item) => item.id === id);
    return tournament ? isOperationalTournament(tournament) : false;
  });
  if (!operationalIds.length) return html`<span class="pill red">Sin torneos activos</span>`;
  const names = operationalIds
    .map((id) => state.tournaments.find((tournament) => tournament.id === id)?.name || id)
    .slice(0, 2);
  const extra = operationalIds.length > names.length ? ` +${operationalIds.length - names.length}` : "";
  return html`
    <span class="pill blue">${operationalIds.length} torneo${operationalIds.length === 1 ? "" : "s"}</span>
    <p class="table-subtext">${escapeHTML(names.join(" / ") + extra)}</p>
  `;
}

function renderGraphicsAccess() {
  const liveScreenGroups = getLiveScreenGroups();
  const groups = liveScreenGroups.filter((group) => group.key === "obs" || group.key === "control");

  return html`
    <section class="content">
      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">Graficos y OBS</h2>
            <p class="card-subtitle">Links para fuentes de navegador y control visual autorizado.</p>
          </div>
          <a class="button primary" href="${escapeHTML(getPageHref("graficos.html"))}" target="_blank" rel="noreferrer">Abrir editor</a>
        </div>
        <div class="card-body grid">
          <div class="live-screen-groups">
            ${groups.map(renderLiveScreenGroup).join("")}
          </div>
        </div>
      </article>
    </section>
  `;
}

function showUserProfileModal(uid = "") {
  const user = firebaseUsers.find((item) => item.uid === uid) || null;
  showModal({
    title: user ? "Editar usuario" : "Agregar usuario",
    body: html`
      <form id="user-profile-form" class="form-grid" data-existing="${user ? "1" : "0"}">
        <div class="wide">
          <label>UID de Firebase Authentication</label>
          <input name="uid" value="${escapeHTML(user?.uid || "")}" ${user ? "readonly" : ""} placeholder="${user ? "UID exacto del usuario" : "Opcional si crearas cuenta desde CharroPro"}">
        </div>
        <div>
          <label>Nombre</label>
          <input name="name" required value="${escapeHTML(user?.name || "")}" placeholder="Nombre visible">
        </div>
        <div>
          <label>Correo</label>
          <input name="email" type="email" required value="${escapeHTML(user?.email || "")}" placeholder="correo@ejemplo.com">
        </div>
        <div>
          <label>Rol</label>
          <select name="role">
            ${ROLE_OPTIONS.map((role) => html`
              <option value="${role}" ${user?.role === role ? "selected" : ""}>${escapeHTML(getRoleLabel(role))}</option>
            `).join("")}
          </select>
        </div>
        <div class="wide">
          <label>${user ? "Nueva contrasena (opcional)" : "Contrasena inicial"}</label>
          <input name="password" type="password" minlength="6" autocomplete="new-password" placeholder="${user ? "Solo si quieres cambiarla" : "Minimo 6 caracteres"}">
        </div>
        <label class="checkbox-row wide">
          <input type="checkbox" name="useAuthFunction" ${user ? "" : "checked"}>
          ${user ? "Actualizar tambien la cuenta de acceso en Authentication" : "Crear cuenta de acceso en Authentication desde CharroPro"}
        </label>
        <label class="checkbox-row wide">
          <input type="checkbox" name="active" ${user?.active === false ? "" : "checked"}>
          Usuario activo
        </label>
        ${renderTournamentAssignmentFields(user)}
        <div class="wide access-help">
          <strong>Nota</strong>
          <p>Con Cloud Functions desplegado, CharroPro crea la cuenta y el rol. Si aun no esta desplegado, crea la cuenta en Firebase Authentication y pega aqui el UID.</p>
        </div>
      </form>
    `,
    actions: html`
      ${user ? html`<button class="button ${user.active ? "red" : "green"}" data-action="deactivate-user-profile" data-uid="${escapeHTML(user.uid)}">${user.active ? "Desactivar" : "Reactivar"}</button>` : ""}
      <button class="button primary" data-action="save-user-profile">Guardar usuario</button>
    `
  });
}

function renderTournamentAssignmentFields(user = null) {
  const access = normalizeTournamentAccess(user || {});
  const selected = new Set(access.tournamentIds);
  const assignableTournaments = state.tournaments.filter(isOperationalTournament);
  return html`
    <div class="wide tournament-assignment-box">
      <label class="checkbox-row">
        <input type="checkbox" name="allTournaments" ${access.tournamentAccess === "selected" ? "" : "checked"}>
        Acceso a todos los torneos activos o programados
      </label>
      <p class="card-subtitle">Si lo desmarcas, este usuario solo vera y operara los torneos seleccionados.</p>
      <div class="tournament-assignment-list">
        ${
          assignableTournaments.length
            ? assignableTournaments.map((tournament) => html`
                <label class="checkbox-row tournament-assignment-item">
                  <input type="checkbox" name="tournamentIds" value="${escapeHTML(tournament.id)}" ${selected.has(tournament.id) ? "checked" : ""}>
                  <span>
                    <strong>${escapeHTML(tournament.name)}</strong>
                    <em>${escapeHTML(getTournamentSeason(tournament))} / ${escapeHTML(formatTournamentStatus(tournament.status))}</em>
                  </span>
                </label>
              `).join("")
            : html`<div class="empty compact-empty">No hay torneos activos o programados para asignar.</div>`
        }
      </div>
    </div>
  `;
}

async function saveUserProfile() {
  const form = document.getElementById("user-profile-form");
  if (!form?.reportValidity()) return;
  const data = new FormData(form);
  const isExisting = form.dataset.existing === "1";
  const payload = {
    uid: String(data.get("uid") || "").trim(),
    name: data.get("name"),
    email: data.get("email"),
    password: data.get("password"),
    role: data.get("role"),
    active: data.has("active"),
    tournamentAccess: data.has("allTournaments") ? "all" : "selected",
    tournamentIds: data.getAll("tournamentIds").map((id) => String(id || "").trim()).filter(Boolean)
  };
  const wantsAuthFunction = data.has("useAuthFunction") || !payload.uid || Boolean(String(payload.password || "").trim());

  if (!payload.uid && !String(payload.password || "").trim()) {
    showToast("Escribe una contrasena inicial o pega el UID de Firebase.");
    return;
  }

  let result = wantsAuthFunction
    ? await saveFirebaseAuthUserProfile(payload)
    : await saveFirebaseUserProfile(payload.uid, payload);

  if (!result.ok && payload.uid && !isExisting) {
    result = await saveFirebaseUserProfile(payload.uid, payload);
    if (result.ok) {
      showToast("Usuario guardado por UID. Cloud Function aun no respondio.");
    }
  }

  if (!result.ok) {
    showToast(formatUserSaveError(result.reason, Boolean(payload.uid)));
    return;
  }

  const savedUid = result.uid || payload.uid;
  if (savedUid) {
    const profileResult = await saveFirebaseUserProfile(savedUid, {
      ...payload,
      uid: savedUid
    });
    if (!profileResult.ok) {
      showToast("Cuenta creada, pero no se pudo guardar la asignacion de torneo.");
      return;
    }
  }

  closeModal();
  showToast(savedUid ? `Usuario guardado: ${savedUid}.` : "Usuario guardado.");
}

function formatUserSaveError(reason = "", hasUid = false) {
  if (reason.includes("permission_denied")) return "Firebase no permitio guardar. Revisa rol supervisor.";
  if (reason.includes("not-found") || reason.includes("functions")) {
    return hasUid
      ? "Cloud Function no respondio. Se puede guardar por UID si desactivas crear cuenta."
      : "Falta desplegar Cloud Functions para crear cuentas desde CharroPro.";
  }
  if (reason.includes("invalid-argument")) return "Revisa correo, rol y contrasena minima de 6 caracteres.";
  if (reason.includes("unauthenticated")) return "Inicia sesion como supervisor.";
  if (reason.includes("permission-denied")) return "Solo supervisor puede crear usuarios.";
  return "No se pudo guardar usuario.";
}

async function toggleUserProfileActive(uid) {
  const user = firebaseUsers.find((item) => item.uid === uid);
  if (!user) return;
  const result = await saveFirebaseUserProfile(uid, {
    ...user,
    active: !user.active
  });
  if (!result.ok) {
    showToast("No se pudo cambiar el estado.");
    return;
  }
  closeModal();
  showToast(user.active ? "Usuario desactivado." : "Usuario reactivado.");
}

function getLiveScreenGroups() {
  const screens = getLiveScreens();
  return [
    {
      key: "obs",
      title: "Graficos OBS",
      subtitle: "Fuentes de navegador para transmision.",
      screens: screens.filter((screen) => screen.group === "obs")
    },
    {
      key: "control",
      title: "Controles",
      subtitle: "Paginas para operar funciones en vivo.",
      screens: screens.filter((screen) => screen.group === "control")
    },
    {
      key: "operation",
      title: "Operacion",
      subtitle: "Consulta y apoyo para jueces o locutores.",
      screens: screens.filter((screen) => screen.group === "operation")
    }
  ].filter((group) => group.screens.length);
}

function renderPublicPageLinksCard() {
  const tournament = getActiveTournament();
  const links = buildPublicPageLinks(tournament);
  const futurePath = buildFuturePublicFriendlyPath(tournament);
  return html`
    <article class="card public-links-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Pagina publica</h2>
          <p class="card-subtitle">Enlaces de consulta para clientes, publico y produccion.</p>
        </div>
        <div class="topbar-actions">
          <a class="button primary small" href="${escapeHTML(links.general.href)}" target="_blank" rel="noreferrer">Abrir pagina publica</a>
          <button class="button small" data-action="copy-public-url" data-target="${escapeHTML(links.general.inputId)}" type="button">Copiar enlace publico</button>
        </div>
      </div>
      <div class="card-body grid">
        ${renderPublicLinkRow(links.general)}
        ${links.competitions.length ? html`
          <div class="public-links-list">
            <h3>Accesos por competencia</h3>
            ${links.competitions.map(renderPublicLinkRow).join("")}
          </div>
        ` : html`<p class="card-subtitle">Este torneo aun no tiene competencias internas detectables; se muestra solo el enlace general.</p>`}
        <p class="card-subtitle">
          URL amigable futura: ${escapeHTML(futurePath || "requiere slug publico del torneo")}. Pendiente de rewrites del servidor.
        </p>
      </div>
    </article>
  `;
}

function renderPublicLinkRow(link) {
  return html`
    <label class="public-link-field">
      <span>${escapeHTML(link.label)}</span>
      <div class="copy-row public-link-row">
        <input id="${escapeHTML(link.inputId)}" readonly value="${escapeHTML(link.absoluteHref)}" onclick="this.select()">
        <a class="button small" href="${escapeHTML(link.href)}" target="_blank" rel="noreferrer">Abrir</a>
        <button class="button small" data-action="copy-public-url" data-target="${escapeHTML(link.inputId)}" type="button">Copiar</button>
      </div>
    </label>
  `;
}

function buildPublicPageLinks(tournament = getActiveTournament()) {
  const tournamentId = tournament?.id || state.activeTournamentId || "";
  const general = {
    id: "general",
    label: "Enlace general",
    inputId: "public-url-general",
    href: getPublicTournamentHref(),
    absoluteHref: getAbsolutePublicTournamentHref()
  };
  if (!tournamentId) return { general, competitions: [] };

  const competitions = detectTournamentPublicCompetitions(tournament).map((competition) => ({
    id: competition.type,
    label: competition.label,
    inputId: `public-url-${sanitizeDomId(competition.type)}`,
    href: getPublicTournamentHref(competition.type),
    absoluteHref: getAbsolutePublicTournamentHref(competition.type),
    competitionType: competition.type
  }));

  return { general, competitions };
}

function detectTournamentPublicCompetitions(tournament = getActiveTournament()) {
  if (!tournament?.id) return [];
  const records = new Map();
  getTournamentCharreadas(tournament.id).forEach((charreada) => {
    if (!hasExplicitCompetitionMetadata(charreada)) return;
    const context = getCharreadaCompetitionContext(charreada, tournament);
    const competition = getCompetitionType(context.competitionType || context.competitionId || "equipos_completo");
    if (!records.has(competition.type)) records.set(competition.type, competition);
  });
  const order = new Map(COMPETITION_TYPES.map((competition, index) => [competition.type, index]));
  return [...records.values()].sort((left, right) =>
    (order.get(left.type) ?? 99) - (order.get(right.type) ?? 99) ||
    String(left.label || "").localeCompare(String(right.label || ""), "es")
  );
}

function hasExplicitCompetitionMetadata(charreada = {}) {
  return Boolean(
    charreada.competitionType ||
    charreada.competitionScope ||
    charreada.competitionId ||
    Array.isArray(charreada.suerteIds) && charreada.suerteIds.length
  );
}

function buildFuturePublicFriendlyPath(tournament = getActiveTournament(), competitionType = "") {
  const slug = normalizePublicSlug(tournament?.slug || tournament?.publicSlug || "");
  if (!slug) return "";
  const segmentByType = {
    equipos_completo: "equipos",
    charro_completo: "charro-completo",
    caladero: "caladero",
    coleadero: "coleadero",
    pialadero: "pialadero"
  };
  const segment = segmentByType[competitionType] || "";
  return `/evento/${slug}${segment ? `/${segment}` : ""}`;
}

function normalizePublicSlug(value = "") {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeDomId(value = "") {
  return String(value || "item").replace(/[^a-z0-9_-]/gi, "-");
}

function getLiveScreens() {
  return [
    {
      label: "OBS completo",
      group: "obs",
      fileName: "obs.html",
      href: getObsHref(),
      absoluteHref: getAbsoluteObsHref(),
      primary: true
    },
    {
      label: "Marcador",
      group: "obs",
      fileName: "grafico-marcador.html",
      href: getGraphicHref("grafico-marcador.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-marcador.html")
    },
    {
      label: "Cronometro",
      group: "obs",
      fileName: "grafico-cronometro.html",
      href: getGraphicHref("grafico-cronometro.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-cronometro.html")
    },
    {
      label: "Turno",
      group: "obs",
      fileName: "grafico-turno.html",
      href: getGraphicHref("grafico-turno.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-turno.html")
    },
    {
      label: "Turno caladero",
      group: "obs",
      fileName: "grafico-caladero-turno.html",
      href: getGraphicHref("grafico-caladero-turno.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-caladero-turno.html")
    },
    {
      label: "Turno coleadero",
      group: "obs",
      fileName: "grafico-coleadero-turno.html",
      href: getGraphicHref("grafico-coleadero-turno.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-coleadero-turno.html")
    },
    {
      label: "Detalle de cala",
      group: "obs",
      fileName: "grafico-cala-detalle.html",
      href: getGraphicHref("grafico-cala-detalle.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-cala-detalle.html")
    },
    {
      label: "Ranking",
      group: "obs",
      fileName: "grafico-ranking.html",
      href: getGraphicHref("grafico-ranking.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-ranking.html")
    },
    {
      label: "Coleadero",
      group: "obs",
      fileName: "grafico-coleadero.html",
      href: getGraphicHref("grafico-coleadero.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-coleadero.html")
    },
    {
      label: "Categoria",
      group: "obs",
      fileName: "grafico-categoria.html",
      href: getGraphicHref("grafico-categoria.html"),
      absoluteHref: getAbsoluteGraphicHref("grafico-categoria.html")
    },
    {
      label: "Control cronometro",
      group: "control",
      fileName: "cronometro.html",
      href: getPageHref("cronometro.html"),
      absoluteHref: getAbsolutePageHref("cronometro.html")
    },
    {
      label: "Cronometro pantalla",
      group: "control",
      fileName: "cronometro-pantalla.html",
      href: getPageHref("cronometro-pantalla.html"),
      absoluteHref: getAbsolutePageHref("cronometro-pantalla.html")
    },
    {
      label: "Editor graficos",
      group: "control",
      fileName: "graficos.html",
      href: getPageHref("graficos.html"),
      absoluteHref: getAbsolutePageHref("graficos.html")
    },
    {
      label: "Supervision",
      group: "operation",
      fileName: "supervision.html",
      href: getPageHref("supervision.html"),
      absoluteHref: getAbsolutePageHref("supervision.html"),
      primary: true
    },
    {
      label: "Hoja Federacion",
      group: "operation",
      fileName: "formato-federacion.html",
      href: getPageHref("formato-federacion.html"),
      absoluteHref: getAbsolutePageHref("formato-federacion.html")
    },
    {
      label: "Locutores",
      group: "operation",
      fileName: "locutores.html",
      href: getPageHref("locutores.html"),
      absoluteHref: getAbsolutePageHref("locutores.html")
    },
    {
      label: "Jueces",
      group: "operation",
      fileName: "jueces.html",
      href: getPageHref("jueces.html"),
      absoluteHref: getAbsolutePageHref("jueces.html")
    }
  ];
}

function renderLiveScreenGroup(group) {
  return html`
    <section class="live-screen-group ${escapeHTML(group.key)}">
      <div class="live-screen-group-head">
        <div>
          <h3>${escapeHTML(group.title)}</h3>
          <p>${escapeHTML(group.subtitle)}</p>
        </div>
      </div>
      <div class="live-screen-buttons">
        ${group.screens
          .map(
            (screen) => html`
              <a class="button live-screen-button ${screen.primary ? "primary" : ""}" href="${escapeHTML(screen.href)}" target="_blank" rel="noreferrer">
                ${escapeHTML(screen.label)}
              </a>
            `
          )
          .join("")}
      </div>
      <div class="live-url-grid">
        ${group.screens.map(renderLiveScreenUrl).join("")}
      </div>
    </section>
  `;
}

function renderLiveScreenUrl(screen) {
  const id = `live-url-${screen.fileName.replace(/[^a-z0-9]/gi, "-")}`;
  return html`
    <label class="obs-url-field ${escapeHTML(screen.group || "")}">
      ${escapeHTML(screen.label)}
      <div class="copy-row">
        <input id="${id}" readonly value="${escapeHTML(screen.absoluteHref)}" onclick="this.select()">
        <button class="button small" data-action="copy-live-url" data-target="${id}" type="button">Copiar</button>
      </div>
    </label>
  `;
}

function renderScoring({ preserveScroll = false } = {}) {
  const scrollSnapshot = preserveScroll ? captureScoringScroll() : null;
  const tournament = getActiveTournament();
  const activeResolution = resolveActiveScoringCharreada(getTournamentCharreadas(tournament?.id), tournament);
  if (activeResolution.id && activeResolution.id !== state.activeCharreadaId) {
    setCanonicalActiveCharreada(activeResolution.id, { source: "scoring-render" });
    resetScoringPointer();
  }
  const charreada = activeResolution.charreada || getActiveCharreada();
  if (!charreada) {
    if (IS_TOURNAMENT_APP && launchRequestedScoring) {
      app.innerHTML = html`
        <main class="access-page">
          <section class="access-panel">
            <div class="access-brand">
              <span>CharroPro</span>
              <h1>Cargando calificador</h1>
              <p>Estamos recibiendo los datos del torneo asignado.</p>
            </div>
          </section>
        </main>
      `;
      return;
    }
    setView("program");
    render();
    return;
  }
  if (launchRequestedScoring) launchRequestedScoring = false;
  if (isCharreadaFrozen(charreada)) {
    setView("results");
    showToast("Resultados congelados. Se abrio modo consulta.");
    render();
    return;
  }
  if (isSupervisorAccess()) enterSupervisorScoringReviewMode();
  else exitSupervisorScoringReviewMode();

  ensureScoresForCharreada(charreada.id);
  const scoringEntries = getCharreadaScoringEntries(charreada);
  if (!scoringEntries.length) {
    app.innerHTML = html`
      <main class="content">
        <section class="card">
          <div class="card-body empty">
            <h2>Sin participantes para calificar</h2>
            <p>${isIndividualCompetition(charreada)
              ? "Esta competencia requiere participantes individuales antes de poder calificarse."
              : "Esta charreada requiere equipos participantes antes de poder calificarse."}</p>
            <button class="button primary" data-action="go-view" data-view="program" type="button">Volver al programa</button>
          </div>
        </section>
      </main>
    `;
    return;
  }
  const suertes = getCharreadaScoringSuertes(charreada, tournament);
  if (!suertes.length) {
    app.innerHTML = html`
      <main class="content">
        <section class="card">
          <div class="card-body empty">
            <h2>Sin suertes calificables</h2>
            <p>Esta competencia no tiene suertes configuradas para el calificador.</p>
            <button class="button primary" data-action="go-view" data-view="program" type="button">Volver al programa</button>
          </div>
        </section>
      </main>
    `;
    return;
  }
  if (state.scoringSuerteIdx >= suertes.length) state.scoringSuerteIdx = 0;
  const context = getCurrentContext();
  if (!context) {
    setView("program");
    render();
    return;
  }
  const charroName = getCharroName(context);
  const leaderboard = buildCharreadaLeaderboard(charreada.id);
  const labels = getScoringEntityLabels(context);
  const showColeadorSelector = context.suerte.type === "coleadero" && !context.competitionContext?.isIndividualCompetition && !isIndividualTournament(context.tournament);

  app.innerHTML = html`
    <div class="scoring-shell cp-scoring-shell scoring-shell-classic ${turnPanelCollapsed ? "turn-panel-collapsed" : ""}">
      ${renderScoringHeader(charreada, context, charroName)}
      <nav class="suertes-strip cp-suertes-strip">
        ${suertes.map(
          (suerte, index) => html`
            <button class="suerte-tab ${index === state.scoringSuerteIdx ? "active" : ""}" data-action="select-suerte" data-index="${index}">
              ${escapeHTML(suerte.name)}
            </button>
          `
        ).join("")}
      </nav>
      ${renderScoringOpportunityBar(context, charroName, showColeadorSelector)}

      <main class="scoring-main">
        <section class="score-workspace cp-scoring-main">
          ${context.attempt.desc ? renderDescState(context.attempt) : ""}
          ${renderScoringMainPanel(charreada, context, charroName)}
          ${renderTimeNoteSection(context)}
          <section class="cp-botonera-panel">
            ${renderScoringActionAccordions(charreada, context, charroName, leaderboard)}
          </section>
        </section>
      </main>

      ${renderScoringBottomBar(context)}
    </div>
  `;
  updateTimerDisplay();
  restoreScoringScroll(scrollSnapshot);
}

function renderScoringMainPanel(charreada, context, charroName) {
  if (context.suerte.id === "cala") return renderCalaMainPanel(context);
  if (context.suerte.type === "coleadero" || context.suerte.id === "colas") return renderColeaderoMainPanel(context);
  if (["piales", "manganas_pie", "manganas_caballo"].includes(context.suerte.id)) return renderAttemptMainPanel(context);
  if (["toro", "yegua"].includes(context.suerte.id)) return renderJineteoMainPanel(context);
  if (context.suerte.id === "terna") return renderTernaMainPanel(context);
  if (context.suerte.id === "paso") return renderPasoMainPanel(context);
  return renderGenericMainPanel(charreada, context, charroName);
}

function renderClassicTurnPanel(charreada, context, labels, showColeadorSelector, leaderboard) {
  const scoringEntries = getCharreadaScoringEntries(charreada);
  return html`
    <aside class="turn-panel">
      <div class="turn-panel-head">
        <div class="turn-panel-title">
          <h2>${escapeHTML(context.suerte.fullName)}</h2>
          <p>${escapeHTML(labels.scoreTurnHelp)}</p>
        </div>
        <button
          class="panel-toggle"
          data-action="toggle-turn-panel"
          type="button"
          aria-label="${turnPanelCollapsed ? "Expandir panel" : "Contraer panel"}"
          title="${turnPanelCollapsed ? "Expandir panel" : "Contraer panel"}"
        >
          ${turnPanelCollapsed ? ">" : "<"}
        </button>
      </div>
      <div class="turn-panel-body">
        <div class="turn-list">
          ${scoringEntries
            .map((entry, index) => {
              return html`
                <button class="turn-button ${index === state.scoringTeamIdx ? "active" : ""}" data-action="select-team" data-index="${index}">
                  <strong>${escapeHTML(entry ? getEntryDisplayName(entry) : labels.nameHeader)}</strong>
                  <span>${moneylessNumber(getTeamCharreadaTotal(charreada.id, entry.id))} pts</span>
                </button>
              `;
            })
            .join("")}
        </div>
        <div class="turn-list">
          ${Array.from({ length: context.suerte.attempts }, (_, index) => html`
            <button class="turn-button ${index === state.scoringAttemptIdx ? "active" : ""}" data-action="select-attempt" data-index="${index}">
              <strong>Oportunidad ${index + 1}</strong>
              <span>${index === state.scoringAttemptIdx ? "Activa" : "Tocar para editar"}</span>
            </button>
          `).join("")}
          ${
            showColeadorSelector
              ? [0, 1, 2].map((index) => html`
                  <button class="turn-button ${index === state.scoringColeadorIdx ? "active" : ""}" data-action="select-coleador" data-index="${index}">
                    <strong>Coleador ${index + 1}</strong>
                    <span>${index === state.scoringColeadorIdx ? "Activo" : "Tocar para editar"}</span>
                  </button>
                `).join("")
              : ""
          }
        </div>
        <div class="timer">
          <span class="card-subtitle">${escapeHTML(getTimerLabel())}</span>
          <strong class="timer-display">${formatTimer()}</strong>
          <div class="timer-actions">
            <button class="button primary" data-action="timer-toggle">${timerRunning ? "Pausar" : "Iniciar"}</button>
            <button class="button" data-action="timer-reset">Reiniciar</button>
          </div>
        </div>
        <article class="card">
          <div class="card-body">
            <p class="card-subtitle">Tabla de esta charreada</p>
            ${renderLeaderboardMini(leaderboard, labels)}
          </div>
        </article>
      </div>
    </aside>
  `;
}

function renderScoringOpportunityBar(context, charroName, showColeadorSelector) {
  return html`
    <section class="scoring-opportunity-bar">
      <div class="opportunity-summary">
        <span>Oportunidad</span>
        <strong>${context.attemptIndex + 1}/${context.suerte.attempts}</strong>
        <em>${escapeHTML(charroName || "Sin registrar")}</em>
      </div>
      <div class="opportunity-controls" aria-label="Oportunidades">
        ${Array.from({ length: context.suerte.attempts }, (_, index) => html`
          <button data-action="select-attempt" data-index="${index}" class="${index === state.scoringAttemptIdx ? "active" : ""}">
            Oportunidad ${index + 1}
          </button>
        `).join("")}
        ${
          showColeadorSelector
            ? [0, 1, 2].map((index) => html`
                <button data-action="select-coleador" data-index="${index}" class="${index === state.scoringColeadorIdx ? "active" : ""}">
                  Coleador ${index + 1}
                </button>
              `).join("")
            : ""
        }
      </div>
      <div class="opportunity-summary">
        <span>Charro</span>
        <strong>${escapeHTML(charroName || "Sin registrar")}</strong>
        <em>${escapeHTML(getEntryDisplayName(context.team))}</em>
      </div>
    </section>
  `;
}

function renderCalaMainPanel(context) {
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("target")}</span>
          <h2>Calculador de punta</h2>
        </div>
        <p>Ingrese metros enteros y numero de marcas segun su evaluacion.</p>
      </header>
      ${renderCalaPuntaSection(context)}
    </section>
  `;
}

function renderAttemptMainPanel(context) {
  const title = context.suerte.id === "piales"
    ? "Calificador de piales"
    : context.suerte.id === "manganas_pie"
      ? "Calificador de manganas a pie"
      : "Calificador de manganas a caballo";
  const attempts = getAttemptsForContext(context);
  const activeAttempt = attempts[context.attemptIndex] || context.attempt;
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("target")}</span>
          <h2>${title}</h2>
        </div>
        <p>Registra cada intento y usa la botonera para aplicar valores oficiales.</p>
      </header>
      <div class="cp-attempt-panel">
        ${Array.from({ length: context.suerte.attempts }, (_, index) => html`
          ${renderAttemptSummaryButton(index, attempts[index], index === context.attemptIndex)}
        `).join("")}
        <article class="cp-main-total-card">
          <span>Total de oportunidad activa</span>
          <strong>${moneylessNumber(calculateAttemptTotal(activeAttempt))}</strong>
          <em>${formatAttemptBreakdown(activeAttempt)}</em>
        </article>
      </div>
    </section>
  `;
}

function renderColeaderoMainPanel(context) {
  const coleadorName = getCharroName(context);
  const collection = getScoreCollectionForContext(context);
  const coleadorCount = context.tournament?.type === "coleadero" || context.competitionContext?.isIndividualCompetition
    ? 1
    : Math.max(3, Array.isArray(collection) ? collection.length : 0);
  const activeAttempts = getAttemptsForContext(context);
  const coleadorTotal = activeAttempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("rope")}</span>
          <h2>Calculador de colas en el lienzo</h2>
        </div>
        <p>Controla coleador, oportunidad y total del intento actual.</p>
      </header>
      <div class="cp-attempt-panel">
        ${Array.from({ length: coleadorCount }, (_, index) => {
          const attempts = getAttemptsForContext(context, index);
          const total = attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
          const name = context.team?.roster?.colas?.[index] || (context.team?.participantName && index === 0 ? context.team.participantName : `Coleador ${index + 1}`);
          return html`
            <button class="cp-attempt-card ${index === context.coleadorIndex ? "active" : ""}" data-action="select-coleador" data-index="${index}">
              <span>Coleador ${index + 1}</span>
              <strong>${escapeHTML(name || `Coleador ${index + 1}`)}</strong>
              <em>${moneylessNumber(total)} pts</em>
            </button>
          `;
        }).join("")}
        <article class="cp-main-total-card">
          <span>Total del coleador activo</span>
          <strong>${moneylessNumber(coleadorTotal)}</strong>
          <em>${escapeHTML(coleadorName)}</em>
        </article>
      </div>
      <div class="cp-attempt-panel cp-opportunity-panel">
        ${Array.from({ length: context.suerte.attempts }, (_, index) => html`
          ${renderAttemptSummaryButton(index, activeAttempts[index], index === context.attemptIndex, `Oportunidad ${index + 1}`)}
        `).join("")}
        <article class="cp-main-total-card">
          <span>Oportunidad activa</span>
          <strong>${moneylessNumber(calculateAttemptTotal(context.attempt))}</strong>
          <em>${formatAttemptBreakdown(context.attempt)}</em>
        </article>
      </div>
    </section>
  `;
}

function getScoreCollectionForContext(context) {
  const key = scoreKey(context.charreada.id, context.team.id, context.suerte.id);
  return state.scores[key] || [];
}

function getAttemptsForContext(context, coleadorIndex = context.coleadorIndex) {
  const collection = getScoreCollectionForContext(context);
  if (context.suerte.type === "coleadero") {
    return Array.isArray(collection?.[coleadorIndex]) ? collection[coleadorIndex] : [];
  }
  return Array.isArray(collection) ? collection : [];
}

function renderAttemptSummaryButton(index, attempt = emptyAttempt(), active = false, label = `${index + 1}° intento`) {
  const hasResult = hasAttemptVisibleResult(attempt);
  return html`
    <button class="cp-attempt-card ${active ? "active" : ""} ${hasResult ? "has-result" : ""}" data-action="select-attempt" data-index="${index}">
      <span>${escapeHTML(label)}</span>
      <strong>${hasResult || active ? moneylessNumber(calculateAttemptTotal(attempt)) : "-"}</strong>
      <em>${active ? "Oportunidad activa" : hasResult ? formatAttemptBreakdown(attempt) : "Sin registrar"}</em>
    </button>
  `;
}

function hasAttemptVisibleResult(attempt = {}) {
  return hasAttemptScoringActivity(attempt) || Boolean(attempt.attempted || attempt.notAchieved);
}

function formatAttemptBreakdown(attempt = {}) {
  if (attempt.desc) return "Descalificado";
  if (attempt.notAchieved || attempt.attempted) return "0 no logrado";
  return `Base ${moneylessNumber(attempt.base)} / Adic. ${moneylessNumber(Number(attempt.adic || 0) + Number(attempt.puntaPts || 0))} / Infr. ${moneylessNumber(attempt.infr)}`;
}

function renderJineteoMainPanel(context) {
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("shield")}</span>
          <h2>${escapeHTML(context.suerte.id === "toro" ? "Calificador de jineteo de toro" : "Calificador de jineteo de yegua")}</h2>
        </div>
        <p>Suma base y adicionales; aplica deducciones desde la botonera.</p>
      </header>
    </section>
  `;
}

function renderTernaMainPanel(context) {
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("rope")}</span>
          <h2>Calificador de terna en el ruedo</h2>
        </div>
        <p>Evalua lazo de cabeza, pial de ruedo y tiempo. Las acciones oficiales estan abajo.</p>
      </header>
    </section>
  `;
}

function renderPasoMainPanel(context) {
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("flag")}</span>
          <h2>Calificador de paso de la muerte</h2>
        </div>
        <p>Registra monta, ejecucion, estilo, tiempo y deducciones desde la botonera.</p>
      </header>
    </section>
  `;
}

function renderGenericMainPanel(charreada, context, charroName) {
  return html`
    <section class="cp-scoring-card cp-main-suerte-panel">
      <header>
        <div>
          <span>${renderCpIcon("target")}</span>
          <h2>${escapeHTML(context.suerte.fullName)}</h2>
        </div>
        <p>Usa las secciones de botonera para capturar la calificacion oficial.</p>
      </header>
    </section>
  `;
}

function renderScoringActionAccordions(charreada, context, charroName, leaderboard) {
  const buttons = getConfiguredScoringButtonList(context);
  const baseButtons = buttons.filter((button) => button.ruleType === "base");
  const adicButtons = buttons.filter((button) => button.ruleType === "adic");
  const infrButtons = buttons.filter((button) => button.ruleType === "infr");

  return [
    renderScoringAccordionGroup("base", "Calificaciones base", "target", renderScoringActionGroupBody("base", baseButtons, charreada, context, charroName, leaderboard)),
    renderScoringAccordionGroup("adic", "Adicionales", "plus", renderScoringActionGroupBody("adic", adicButtons, charreada, context, charroName, leaderboard)),
    renderScoringAccordionGroup("infr", "Infracciones", "warning", renderScoringActionGroupBody("infr", infrButtons, charreada, context, charroName, leaderboard)),
    renderScoringAccordionGroup("teamPenalties", "Infracciones al equipo", "shield", renderTeamPenaltySection(context)),
    renderScoringAccordionGroup("desc", "Descalificaciones", "ban", renderDescSection(context))
  ].join("");
}

function renderScoringActionGroupBody(groupId, buttons, charreada, context, charroName, leaderboard) {
  const buttonGrid = buttons.length
    ? html`<div class="cp-scoring-button-grid">${buttons.map((button) => renderConfigurableScoringButton(button)).join("")}</div>`
    : html`<div class="cp-empty-actions">Sin botones activos en este grupo.</div>`;

  if (groupId === "adic") {
    return html`
      ${buttonGrid}
      ${renderCustomScoreSection("adic", context)}
    `;
  }

  if (groupId === "infr") {
    return html`
      ${buttonGrid}
      ${renderCustomScoreSection("infr", context)}
    `;
  }

  return buttonGrid;
}

function renderConfigurableScoringButton(button) {
  const dataset = Object.entries(button.dataset || {})
    .map(([key, value]) => `data-${key}="${escapeHTML(value)}"`)
    .join(" ");
  const confirm = button.requiresConfirmation ? `data-confirm-message="${escapeHTML(`Aplicar ${button.shortLabel || button.label}?`)}"` : "";
  return html`
    <button class="cp-scoring-action-button cp-scoring-action-button--${escapeHTML(button.type)} ${button.active ? "active" : ""}" ${dataset} ${confirm}>
      <span aria-hidden="true">${renderCpIcon(button.icon || "target")}</span>
      <b>${escapeHTML(button.valueLabel || "")}</b>
      <strong>${escapeHTML(button.shortLabel || button.label)}</strong>
      ${button.description ? html`<em>${escapeHTML(button.description)}</em>` : ""}
    </button>
  `;
}

function getConfiguredScoringButtons(context) {
  const buttons = applyScoringButtonOverrides(buildScoringActionButtons(context), context.suerte.id);
  return Object.fromEntries(SCORING_BUTTON_GROUPS.map((group) => [
    group.id,
    buttons
      .filter((button) => button.enabled !== false && button.group === group.id)
      .sort((a, b) => a.order - b.order || String(a.label).localeCompare(String(b.label), "es"))
  ]));
}

function getConfiguredScoringButtonList(context) {
  return applyScoringButtonOverrides(buildScoringActionButtons(context), context.suerte.id)
    .filter((button) => button.enabled !== false)
    .sort((a, b) => a.order - b.order || String(a.label).localeCompare(String(b.label), "es"));
}

function buildScoringActionButtons(context) {
  const catalog = context.suerte.catalog || {};
  const buttons = [];
  const usedQuick = new Set();

  (catalog.base || []).forEach((rule, index) => {
    buttons.push(makeRuleScoringButton(rule, "base", "neutral", "quickActions", index + 1, context));
    usedQuick.add(rule.id);
  });

  (catalog.adic || []).forEach((rule, index) => {
    const group = index < 8 ? "quickActions" : "more";
    buttons.push(makeRuleScoringButton(rule, "adic", "positive", group, 20 + index, context));
    if (group === "quickActions") usedQuick.add(rule.id);
  });

  (catalog.infr || []).forEach((rule, index) => {
    buttons.push(makeRuleScoringButton(rule, "infr", "negative", "infractions", 100 + index, context));
  });

  return buttons;
}

function makeRuleScoringButton(rule, ruleType, visualType, group, order, context) {
  const isInfr = ruleType === "infr";
  return {
    id: `rule__${ruleType}__${rule.id}`,
    ruleId: rule.id,
    label: rule.label,
    shortLabel: rule.label,
    valueLabel: `${isInfr ? "-" : ruleType === "base" ? "" : "+"}${moneylessNumber(rule.pts)}`,
    points: isInfr ? -Number(rule.pts || 0) : Number(rule.pts || 0),
    type: visualType,
    icon: isInfr ? "warning" : ruleType === "base" ? "target" : "plus",
    ruleType,
    group,
    action: "toggle-rule",
    enabled: rule.enabled !== false,
    order,
    active: context.attempt.applied?.includes(rule.id),
    dataset: { action: "toggle-rule", type: ruleType, id: rule.id }
  };
}

function applyScoringButtonOverrides(buttons, suerteId) {
  const overrides = getScoringButtonLayoutForSuerte(suerteId).buttons || {};
  return buttons.map((button) => {
    const override = overrides[button.id];
    if (!override) return button;
    return {
      ...button,
      enabled: override.enabled !== false,
      group: normalizeScoringButtonGroup(override.group || button.group),
      order: Number.isFinite(Number(override.order)) ? Number(override.order) : button.order,
      shortLabel: override.shortLabel || button.shortLabel || button.label,
      icon: override.icon || button.icon,
      requiresConfirmation: Boolean(override.requiresConfirmation)
    };
  });
}

function getScoringButtonLayoutForSuerte(suerteId) {
  const tournament = getActiveTournament();
  const tournamentLayouts = normalizeScoringButtonLayouts(tournament?.scoringButtonLayouts || {});
  const globalLayouts = normalizeScoringButtonLayouts(state.settings?.scoringButtonLayouts || {});
  return tournamentLayouts[suerteId] || globalLayouts[suerteId] || { buttons: {} };
}

function renderScoringContextBar(charreada, context, charroName) {
  const teamTotal = getTeamCharreadaTotal(charreada.id, context.team.id);
  const horseName = context.team?.horseName || getParticipantHorseParts(context.team).horseName || "";
  const association = context.team?.association || context.tournament?.venue || "";

  return html`
    <section class="cp-context-bar">
      ${renderContextCard("user", "Participante", charroName || getEntryDisplayName(context.team), getEntryDisplayName(context.team))}
      ${renderContextCard("horse", "Caballo", horseName || "Sin caballo registrado", association || "Sin asociacion")}
      ${renderContextCard("event", "Charreada", charreada.name || "Sin charreada", context.tournament?.venue || context.tournament?.name || "")}
      ${renderContextCard("score", "Puntaje total", moneylessNumber(teamTotal), "puntos", true)}
    </section>
  `;
}

function renderContextCard(icon, label, value, subvalue = "", highlight = false) {
  return html`
    <article class="cp-context-card ${highlight ? "highlight" : ""}">
      <span class="cp-context-icon" aria-hidden="true">${renderCpIcon(icon)}</span>
      <div>
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(String(value || "-"))}</strong>
        <em>${escapeHTML(String(subvalue || ""))}</em>
      </div>
    </article>
  `;
}

function renderScoringTurnSelector(charreada, context, labels, showColeadorSelector) {
  const scoringEntries = getCharreadaScoringEntries(charreada);
  return html`
    <section class="cp-turn-selector">
      <div class="cp-turn-selector-head">
        <div>
          <span>${escapeHTML(labels.scoreEntityLabel)}</span>
          <strong>${escapeHTML(getEntryDisplayName(context.team))}</strong>
        </div>
        <div>
          <span>Oportunidad</span>
          <strong>${context.attemptIndex + 1}/${context.suerte.attempts}</strong>
        </div>
      </div>
      <div class="cp-turn-scroll" aria-label="Turnos y puntuaciones">
        ${scoringEntries
          .map((entry, index) => {
            return html`
              <button class="cp-turn-chip ${index === state.scoringTeamIdx ? "active" : ""}" data-action="select-team" data-index="${index}">
                <span>${index + 1}</span>
                <strong>${escapeHTML(entry ? getEntryDisplayName(entry) : labels.nameHeader)}</strong>
                <em>${moneylessNumber(getTeamCharreadaTotal(charreada.id, entry.id))} pts</em>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="cp-mini-controls">
        ${Array.from({ length: context.suerte.attempts }, (_, index) => html`
          <button data-action="select-attempt" data-index="${index}" class="${index === state.scoringAttemptIdx ? "active" : ""}">
            Oportunidad ${index + 1}
          </button>
        `).join("")}
        ${
          showColeadorSelector
            ? [0, 1, 2].map((index) => html`
                <button data-action="select-coleador" data-index="${index}" class="${index === state.scoringColeadorIdx ? "active" : ""}">
                  Coleador ${index + 1}
                </button>
              `).join("")
            : ""
        }
      </div>
    </section>
  `;
}

function renderScoringAccordionGroup(groupId, title, icon, body) {
  return html`
    <section class="cp-accordion-group open cp-fixed-action-block" data-accordion="${groupId}">
      <header class="cp-accordion-header cp-block-header">
        <span class="cp-accordion-icon" aria-hidden="true">${renderCpIcon(icon)}</span>
        <strong>${escapeHTML(title)}</strong>
      </header>
      <div class="cp-accordion-body">
        ${body}
      </div>
    </section>
  `;
}

function renderScoringTimerCard() {
  return html`
    <article class="card cp-timer-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHTML(getTimerLabel())}</h2>
          <p class="card-subtitle">Cronometro integrado del turno actual.</p>
        </div>
        <strong class="timer-display">${formatTimer()}</strong>
      </div>
      <div class="card-body cp-timer-actions">
        <button class="button primary" data-action="timer-toggle">${timerRunning ? "Pausar" : "Iniciar"}</button>
        <button class="button" data-action="timer-reset">Reiniciar</button>
      </div>
    </article>
  `;
}

function renderScoringSummaryCards(charreada, context, charroName) {
  return html`
    <div class="score-summary cp-summary-grid">
      <div class="summary-box wide">
        <span>En accion</span>
        <strong>${escapeHTML(charroName)}</strong>
        <p class="card-subtitle">${escapeHTML(getEntryDisplayName(context.team))} / Turno ${context.teamIndex + 1}</p>
      </div>
      <div class="summary-box"><span>Base</span><strong>${moneylessNumber(context.attempt.base)}</strong></div>
      <div class="summary-box"><span>Adic.</span><strong>${moneylessNumber(context.attempt.adic + context.attempt.puntaPts)}</strong></div>
      <div class="summary-box"><span>Infr.</span><strong>${moneylessNumber(context.attempt.infr)}</strong></div>
      <div class="summary-box"><span>Equipo</span><strong>${moneylessNumber(sumTeamPenalties(context.attempt))}</strong></div>
      <div class="summary-box"><span>Total</span><strong>${moneylessNumber(calculateAttemptTotal(context.attempt))}</strong></div>
    </div>
  `;
}

function renderLiveSummaryPanel(charreada, context, charroName, leaderboard) {
  const obtained = calculateAttemptTotal(context.attempt);
  const maxScore = estimateSuerteMaximum(context.suerte);
  const diff = Number.isFinite(maxScore) ? obtained - maxScore : 0;
  return html`
    <aside class="cp-live-panel">
      <header>
        <div>
          <h2>Resumen en vivo</h2>
          <p>${escapeHTML(charreada.name || "")}</p>
        </div>
        <span class="cp-live-pill">En vivo</span>
      </header>
      <div class="cp-live-metrics">
        <div><span>Ejercicio</span><strong>${escapeHTML(context.suerte.name || context.suerte.fullName)}</strong></div>
        <div><span>Maximo</span><strong>${Number.isFinite(maxScore) ? moneylessNumber(maxScore) : "-"}</strong></div>
        <div><span>Obtenido</span><strong class="positive">${moneylessNumber(obtained)}</strong></div>
        <div><span>Diferencia</span><strong class="${diff < 0 ? "negative" : "positive"}">${diff > 0 ? "+" : ""}${moneylessNumber(diff)}</strong></div>
      </div>
      <section class="cp-recent-actions">
        <div class="cp-panel-title">
          <h3>Acciones recientes</h3>
          <button class="button small" data-action="previous-score">Deshacer</button>
        </div>
        ${renderRecentActions(context)}
      </section>
      <section class="cp-sync-grid">
        <span>Lectura lista</span>
        <span>Puntaje listo</span>
        <span>Canal vivo listo</span>
        <span>Cronometro listo</span>
      </section>
      <section class="cp-live-standings">
        <h3>Top charreada</h3>
        ${(leaderboard || []).slice(0, 3).map((item, index) => html`
          <div>
            <span>${index + 1}</span>
            <strong>${escapeHTML(getEntryDisplayName(item.team))}</strong>
            <em>${moneylessNumber(item.total)}</em>
          </div>
        `).join("")}
      </section>
    </aside>
  `;
}

function renderRecentActions(context) {
  const actions = buildRecentActions(context).slice(0, 5);
  if (!actions.length) return html`<div class="cp-empty-actions">Sin acciones en esta oportunidad.</div>`;

  return html`
    <div class="cp-recent-list">
      ${actions.map((item) => html`
        <div class="cp-recent-row ${item.kind}">
          <span>${escapeHTML(item.points)}</span>
          <strong>${escapeHTML(item.label)}</strong>
          <em>${escapeHTML(context.suerte.name || "")}</em>
        </div>
      `).join("")}
      <button class="cp-view-all-actions" data-action="show-scoring-action-history" type="button">Ver todas</button>
    </div>
  `;
}

function buildRecentActions(context) {
  const attempt = context.attempt || {};
  const catalog = context.suerte.catalog || {};
  const actions = [];

  (attempt.applied || []).forEach((ruleId) => {
    const match = ["base", "adic", "infr"]
      .map((type) => ({ type, rule: (catalog[type] || []).find((item) => item.id === ruleId) }))
      .find((item) => item.rule);
    if (!match) return;
    actions.push({
      label: match.rule.label,
      points: `${match.type === "infr" ? "-" : "+"}${moneylessNumber(match.rule.pts)}`,
      kind: match.type === "infr" ? "negative" : "positive",
      dataset: `data-action="toggle-rule" data-type="${match.type}" data-id="${escapeHTML(match.rule.id)}"`
    });
  });

  (attempt.customAdic || []).forEach((item) => actions.push({
    label: item.label || "Manual",
    points: `+${moneylessNumber(item.pts)}`,
    kind: "positive",
    dataset: `data-action="remove-custom" data-type="adic" data-id="${escapeHTML(item.id)}"`
  }));

  (attempt.customInfr || []).forEach((item) => actions.push({
    label: item.label || "Manual",
    points: `-${moneylessNumber(item.pts)}`,
    kind: "negative",
    dataset: `data-action="remove-custom" data-type="infr" data-id="${escapeHTML(item.id)}"`
  }));

  (attempt.teamPenalties || []).forEach((item) => actions.push({
    label: item.label || "Infraccion al equipo",
    points: `-${moneylessNumber(item.total || item.pts)}`,
    kind: "negative",
    dataset: `data-action="remove-team-penalty" data-id="${escapeHTML(item.id)}"`
  }));

  if (attempt.desc) {
    actions.push({
      label: attempt.desc,
      points: "0",
      kind: "negative",
      dataset: `data-action="toggle-desc" data-label="${escapeHTML(attempt.desc)}"`
    });
  }

  if (attempt.notAchieved) {
    actions.push({
      label: "Suerte no lograda",
      points: "0",
      kind: "neutral",
      dataset: `data-action="toggle-attempt-zero"`
    });
  }

  return actions.reverse();
}

function renderScoringSearchActions(context) {
  return buildScoringActionItems(context).map((item) => html`
    <button class="cp-search-result" data-search-action-result data-search-text="${escapeHTML(item.searchText)}" ${item.dataset} hidden>
      <span class="${item.kind}">${escapeHTML(item.points)}</span>
      <strong>${escapeHTML(item.label)}</strong>
      <em>${escapeHTML(item.group)}</em>
    </button>
  `).join("");
}

function buildScoringActionItems(context) {
  const catalog = context.suerte.catalog || {};
  const items = [];
  ["base", "adic", "infr"].forEach((type) => {
    (catalog[type] || []).forEach((rule) => {
      const kind = type === "infr" ? "negative" : type === "base" ? "neutral" : "positive";
      const points = `${type === "infr" ? "-" : type === "base" ? "" : "+"}${moneylessNumber(rule.pts)}`;
      items.push({
        label: rule.label,
        group: type === "base" ? "Base" : type === "adic" ? "Adicionales" : "Infracciones",
        points,
        kind,
        searchText: `${rule.label} ${points} ${type} ${context.suerte.name}`.toLowerCase(),
        dataset: `data-action="toggle-rule" data-type="${type}" data-id="${escapeHTML(rule.id)}"`
      });
    });
  });

  getTeamPenaltyRulesForSuerte(context.suerte).forEach((rule) => {
    items.push({
      label: rule.label,
      group: "Infracciones al equipo",
      points: `-${moneylessNumber(rule.pts)}`,
      kind: "negative",
      searchText: `${rule.label} -${rule.pts} equipo ${context.suerte.name}`.toLowerCase(),
      dataset: `data-action="toggle-team-penalty" data-id="${escapeHTML(rule.id)}"`
    });
  });

  items.push({
    label: "Suerte no lograda",
    group: "Resumen",
    points: "0",
    kind: "neutral",
    searchText: `0 no logro no califico incompleta ${context.suerte.name}`.toLowerCase(),
    dataset: `data-action="toggle-attempt-zero"`
  });

  return items;
}

function renderScoringBottomBar(context) {
  const canEditLayout = canEditScoringButtonLayout();
  const zeroActive = Boolean(context.attempt.attempted || context.attempt.notAchieved);
  const zeroDisabled = !zeroActive && hasAttemptScoringActivity(context.attempt);
  const syncLabel = lastScoreSaveStatus.label || "Conectado";
  const syncDetail =
    lastScoreSaveStatus.detail ||
    (lastScoreSaveStatus.state === "saved" && lastScoreSaveStatus.savedAtMs
      ? `Ultimo guardado ${formatScoreSaveTime(lastScoreSaveStatus.savedAtMs)}`
      : `Turno ${context.teamIndex + 1} / oportunidad ${context.attemptIndex + 1}`);
  return html`
    <footer class="cp-bottom-bar">
      <div class="cp-bottom-actions muted">
        <button class="button" type="button" disabled>${renderCpIcon("keyboard")} Teclado</button>
        <button class="button" data-action="show-scoring-button-settings" type="button" ${canEditLayout ? "" : "disabled"}>${renderCpIcon("settings")} Ajustar botonera</button>
      </div>
      <div class="cp-bottom-sync ${escapeHTML(lastScoreSaveStatus.state || "connected")}">
        <span class="cp-sync-dot"></span>
        <strong>${escapeHTML(syncLabel)}</strong>
        <em>${escapeHTML(syncDetail)}</em>
      </div>
      <div class="cp-bottom-actions">
        <button class="button" data-action="previous-score">${renderCpIcon("undo")} Deshacer</button>
        <button class="button cp-zero-footer-button ${zeroActive ? "amber" : ""}" data-action="toggle-attempt-zero" ${zeroDisabled ? "disabled" : ""}>
          ${renderCpIcon("ban")} ${zeroActive ? "0 no logrado" : "Marcar 0"}
        </button>
        <button class="button primary cp-save-score-button" data-action="next-score" ${officialPublishInProgress ? "disabled" : ""}>
          ${renderCpIcon("check")} ${officialPublishInProgress ? "Publicando..." : "Guardar y siguiente"}
        </button>
      </div>
    </footer>
  `;
}

function hasAttemptScoringActivity(attempt = {}) {
  return Boolean(
    Number(attempt.base || 0) ||
    Number(attempt.adic || 0) ||
    Number(attempt.infr || 0) ||
    Number(attempt.puntaPts || 0) ||
    attempt.desc ||
    attempt.applied?.length ||
    attempt.customAdic?.length ||
    attempt.customInfr?.length ||
    attempt.teamPenalties?.length
  );
}

function canEditScoringButtonLayout() {
  return isActiveAccessSession(firebaseAccess) && [ROLES.SUPERVISOR, ROLES.OPERADOR].includes(firebaseAccess.role);
}

function estimateSuerteMaximum(suerte = {}) {
  const baseMax = Math.max(0, ...(suerte.catalog?.base || []).map((rule) => Number(rule.pts || 0)));
  const adicTotal = (suerte.catalog?.adic || []).reduce((sum, rule) => sum + Math.max(0, Number(rule.pts || 0)), 0);
  const puntaAllowance = suerte.id === "cala" ? 0 : 0;
  return baseMax + adicTotal + puntaAllowance;
}

function renderCpIcon(name) {
  const icons = {
    user: html`<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"></path><path d="M4 21a8 8 0 0 1 16 0"></path>`,
    horse: html`<path d="M5 19c2-5 2-9 1-14 4 0 7 2 9 5l3 1-1 4h-4l-1 5"></path><path d="M8 19h8"></path>`,
    event: html`<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4"></path><path d="M16 3v4"></path><path d="M3 11h18"></path>`,
    score: html`<path d="M12 3v18"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"></path>`,
    star: html`<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9Z"></path>`,
    warning: html`<path d="M12 3 2 21h20Z"></path><path d="M12 9v5"></path><path d="M12 17h.01"></path>`,
    timer: html`<path d="M10 2h4"></path><path d="M12 14V8"></path><circle cx="12" cy="14" r="8"></circle>`,
    hand: html`<path d="M8 11V6a2 2 0 0 1 4 0v4"></path><path d="M12 10V5a2 2 0 0 1 4 0v7"></path><path d="M16 12V8a2 2 0 0 1 4 0v7a7 7 0 0 1-14 0v-3"></path>`,
    clipboard: html`<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4a3 3 0 0 1 6 0"></path><path d="M9 12h6"></path><path d="M9 16h6"></path>`,
    search: html`<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>`,
    target: html`<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M2 12h4"></path><path d="M18 12h4"></path>`,
    bolt: html`<path d="M13 2 4 14h7l-1 8 9-12h-7Z"></path>`,
    dots: html`<path d="M5 12h.01"></path><path d="M12 12h.01"></path><path d="M19 12h.01"></path>`,
    plus: html`<path d="M12 5v14"></path><path d="M5 12h14"></path>`,
    play: html`<path d="m8 5 11 7-11 7Z"></path>`,
    pause: html`<path d="M8 5v14"></path><path d="M16 5v14"></path>`,
    reset: html`<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v6h6"></path>`,
    ban: html`<circle cx="12" cy="12" r="9"></circle><path d="m5.7 5.7 12.6 12.6"></path>`,
    flag: html`<path d="M5 21V4"></path><path d="M5 4h12l-1.5 4L17 12H5"></path>`,
    rope: html`<path d="M6 8c2-4 10-4 12 0 2 5-6 9-10 5-3-3 1-8 5-6"></path><path d="M5 18c4-3 9-3 14 0"></path>`,
    shield: html`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>`,
    keyboard: html`<rect x="3" y="6" width="18" height="12" rx="2"></rect><path d="M7 10h.01M11 10h.01M15 10h.01M19 10h.01M7 14h10"></path>`,
    settings: html`<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5h-4l-.4 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 3h4l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5Z"></path>`,
    undo: html`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10a6 6 0 0 1 0 12h-2"></path>`,
    check: html`<path d="m4 12 5 5L20 6"></path>`
  };

  return html`
    <svg class="cp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      ${icons[name] || icons.check}
    </svg>
  `;
}

function renderScoringHeader(charreada, context, charroName) {
  const attemptTotal = calculateAttemptTotal(context.attempt);
  const teamTotal = getTeamCharreadaTotal(charreada.id, context.team.id);
  const labels = getScoringEntityLabels(context);
  const scoringEntries = getCharreadaScoringEntries(charreada);

  return html`
    <header class="scoring-header">
      <button class="button" data-action="exit-scoring">Salir</button>
      <div class="scoring-livebar">
        <div class="scoring-live-top">
          <div class="scoring-title">
            <p>Calificando en vivo</p>
            <h1>${escapeHTML(charreada.name)} / ${escapeHTML(context.suerte.fullName)}</h1>
            ${renderSupervisorReviewNotice()}
          </div>
          <div class="live-metrics">
	          <div class="live-metric wide">
	              <span>${escapeHTML(labels.scoreEntityLabel)}</span>
	              <strong>${escapeHTML(getEntryDisplayName(context.team))}</strong>
	              <em>Turno ${context.teamIndex + 1}</em>
	            </div>
            <div class="live-metric">
              <span>Oportunidad</span>
              <strong>${context.attemptIndex + 1}/${context.suerte.attempts}</strong>
              <em>${escapeHTML(charroName)}</em>
            </div>
            <div class="live-metric">
	              <span>Pasada</span>
	              <strong>${moneylessNumber(attemptTotal)}</strong>
	              <em>${moneylessNumber(teamTotal)} ${escapeHTML(labels.pointsSuffix)}</em>
            </div>
            <div class="header-timer read-only">
              <span>${escapeHTML(getTimerLabel())}</span>
              <strong class="timer-display">${formatTimer()}</strong>
              <em>Control externo</em>
            </div>
          </div>
        </div>
        <div class="header-turn-strip" aria-label="Turnos y puntuaciones">
          ${scoringEntries
            .map((entry, index) => {
              return html`
                <button class="header-turn-chip ${index === state.scoringTeamIdx ? "active" : ""}" data-action="select-team" data-index="${index}">
                  <span>${index + 1}</span>
	                  <strong>${escapeHTML(entry ? getEntryDisplayName(entry) : labels.nameHeader)}</strong>
                  <em>${moneylessNumber(getTeamCharreadaTotal(charreada.id, entry.id))} pts</em>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    </header>
  `;
}

function renderSupervisorReviewNotice() {
  if (!isSupervisorAccess() || !supervisorScoringReviewMode) return "";
  if (supervisorLiveControlEnabled) {
    return html`
      <div class="supervisor-review-notice live-control">
        <span>Control en vivo activo</span>
      </div>
    `;
  }

  return html`
    <div class="supervisor-review-notice">
      <span>Modo revisión — no afecta gráficos en vivo</span>
      <button class="button small" data-action="take-live-control" type="button">Tomar control en vivo</button>
    </div>
  `;
}

function captureScoringScroll() {
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    elements: scoringScrollSelectors
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        return { selector, left: element.scrollLeft, top: element.scrollTop };
      })
      .filter(Boolean)
  };
}

function restoreScoringScroll(snapshot) {
  if (!snapshot) return;

  const apply = () => {
    snapshot.elements.forEach(({ selector, left, top }) => {
      const element = document.querySelector(selector);
      if (!element) return;
      element.scrollLeft = left;
      element.scrollTop = top;
    });
    window.scrollTo(snapshot.windowX, snapshot.windowY);
  };

  window.requestAnimationFrame(() => {
    apply();
    window.requestAnimationFrame(apply);
  });
}

function renderDescState(attempt) {
  return html`
    <div class="danger-state">
      <div>
        <strong>Descalificado</strong>
        <p>${escapeHTML(attempt.desc)}</p>
      </div>
      <button class="button red" data-action="toggle-desc" data-label="${escapeHTML(attempt.desc)}">Deshacer</button>
    </div>
  `;
}

function renderScoreSection(title, type, rules, color, context) {
  if (!rules?.length) return "";

  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHTML(title)}</h2>
          <p class="card-subtitle">${type === "base" ? "Inicia desactivada; toca para activar o quitar la base." : "Toca para agregar o quitar."}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="button-grid">
          ${rules
            .map((rule) => {
              const active = context.attempt.applied?.includes(rule.id);
              const prefix = type === "infr" ? "-" : type === "adic" ? "+" : "";
              return html`
                <button class="score-button ${color} ${active ? "active" : ""}" data-action="toggle-rule" data-type="${type}" data-id="${rule.id}">
                  <b>${prefix}${moneylessNumber(rule.pts)}</b>
                  <span>${escapeHTML(rule.label)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function renderCustomScoreSection(type, context) {
  const title = type === "adic" ? "Adicional manual" : "Infraccion manual";
  const items = context.attempt[type === "adic" ? "customAdic" : "customInfr"] || [];
  return html`
    <article class="card">
      <div class="card-body">
        ${
          items.length
            ? html`
                <div class="grid" style="margin-bottom: 10px;">
                  ${items
                    .map(
                      (item) => html`
                        <button class="button ${type === "adic" ? "green" : "red"}" data-action="remove-custom" data-type="${type}" data-id="${item.id}">
                          ${type === "adic" ? "+" : "-"}${moneylessNumber(item.pts)} ${escapeHTML(item.label)}
                        </button>
                      `
                    )
                    .join("")}
                </div>
              `
            : ""
        }
        <div class="form-grid">
          <div>
            <label>${title}</label>
            <input id="custom-${type}-label" placeholder="Concepto">
          </div>
          <div>
            <label>Puntos</label>
            <input id="custom-${type}-pts" type="number" min="1" value="1">
          </div>
        </div>
        <div class="topbar-actions" style="margin-top: 10px;">
          <button class="button ${type === "adic" ? "green" : "red"}" data-action="add-custom" data-type="${type}">Agregar</button>
        </div>
      </div>
    </article>
  `;
}

function renderTeamPenaltySection(context) {
  const penalties = context.attempt.teamPenalties || [];
  const activeIds = new Set(penalties.map((item) => item.id));
  const catalog = getTeamPenaltyRulesForSuerte(context.suerte);
  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Infracciones al equipo</h2>
          <p class="card-subtitle">Se descuentan del total del equipo y quedan separadas de la calificacion del charro.</p>
        </div>
        <span class="pill red">-${moneylessNumber(sumTeamPenalties(context.attempt))}</span>
      </div>
      <div class="card-body">
        ${
          penalties.length
            ? html`
                <div class="grid" style="margin-bottom: 10px;">
                  ${penalties.map((item) => html`
                    <button class="button red" data-action="remove-team-penalty" data-id="${escapeHTML(item.id)}">
                      -${moneylessNumber(item.total || item.pts)} ${escapeHTML(item.label)}
                    </button>
                  `).join("")}
                </div>
              `
            : ""
        }
        <div class="button-grid compact">
          ${catalog.map((rule) => html`
            <button class="score-button red ${activeIds.has(rule.id) ? "active" : ""}" data-action="toggle-team-penalty" data-id="${rule.id}">
              <b>-${moneylessNumber(rule.pts)}</b>
              <span>${escapeHTML(rule.label)}</span>
            </button>
          `).join("")}
        </div>
        <div class="form-grid" style="margin-top: 12px;">
          <div>
            <label>Infraccion al equipo manual</label>
            <input id="team-penalty-label" placeholder="Concepto">
          </div>
          <div>
            <label>Puntos</label>
            <input id="team-penalty-pts" type="number" min="1" value="1">
          </div>
        </div>
        <div class="topbar-actions" style="margin-top: 10px;">
          <button class="button red" data-action="add-team-penalty">Agregar al equipo</button>
        </div>
      </div>
    </article>
  `;
}

function getTeamPenaltyRulesForSuerte(suerte = {}) {
  return suerte?.id === "cala"
    ? CALA_TEAM_PENALTY_RULES.concat(GENERAL_TEAM_PENALTY_RULES)
    : GENERAL_TEAM_PENALTY_RULES;
}

function renderZeroAttemptSection(context) {
  const active = Boolean(context.attempt.attempted || context.attempt.notAchieved);
  const hasScore = hasAttemptScoreValue(context.attempt);
  return html`
    <article class="card">
      <div class="card-body zero-attempt-row">
        <div>
          <h2 class="card-title">Suerte realizada en cero</h2>
          <p class="card-subtitle">Cuenta como oportunidad hecha para estadisticas aunque no haya puntos ni infracciones.</p>
        </div>
        <button class="button ${active ? "amber" : ""}" data-action="toggle-attempt-zero" ${hasScore ? "disabled" : ""}>
          ${active ? "0 no logrado marcado" : "Marcar 0 no logrado"}
        </button>
      </div>
    </article>
  `;
}

function hasAttemptScoreValue(attempt = {}) {
  return Boolean(
    Number(attempt.base || 0) ||
    Number(attempt.adic || 0) ||
    Number(attempt.infr || 0) ||
    Number(attempt.puntaPts || 0) ||
    attempt.desc ||
    attempt.applied?.length ||
    attempt.customAdic?.length ||
    attempt.customInfr?.length ||
    attempt.teamPenalties?.length
  );
}

function renderCalaFastScoring(context) {
  const ruleMap = Object.fromEntries(context.suerte.catalog.adic.map((rule) => [rule.id, rule]));
  const groupedAdicIds = new Set(CALA_ADIC_SECTIONS.flatMap((section) => section.ids));
  const extraAdicRules = context.suerte.catalog.adic.filter((rule) => !groupedAdicIds.has(rule.id));
  return html`
    ${renderCalaPuntaSection(context)}
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Base de cala</h2>
          <p class="card-subtitle">Inicia desactivada; toca para activar o quitar la base.</p>
        </div>
      </div>
      <div class="card-body">
        <div class="button-grid compact">
          ${context.suerte.catalog.base.map((rule) => renderRuleButton(rule, "base", "blue", context)).join("")}
        </div>
      </div>
    </article>

    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Adicionales de cala</h2>
          <p class="card-subtitle">Cada grupo alimenta su columna oficial.</p>
        </div>
      </div>
      <div class="card-body cala-fast-grid">
        ${CALA_ADIC_SECTIONS.map((section) =>
          renderCalaAdicGroup(section.label, section.code, section.ids.map((id) => ruleMap[id]), context)
        ).join("")}
      </div>
    </article>

    ${renderScoreSection("Adicionales de convocatoria", "adic", extraAdicRules, "green", context)}
    ${renderCustomScoreSection("adic", context)}
  `;
}

function renderCalaPuntaSection(context) {
  const metros = Number(context.attempt.puntaMetros || 0);
  const marcas = Number(context.attempt.puntaPiquetes || 1);
  return html`
    <article class="card cala-punta-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Calculador de punta</h2>
          <p class="card-subtitle">Metros de punta y tiempos de Cala.</p>
        </div>
        <span class="punta-total">+${moneylessNumber(context.attempt.puntaPts)} pts</span>
      </div>
      <div class="card-body cala-punta-grid">
        ${renderPuntaCounter("Metros de punta", "puntaMetros", metros, [
          { label: "+3 Mts", delta: 3 },
          { label: "+5 Mts", delta: 5 }
        ])}
        ${renderPuntaCounter("Tiempos / marcas", "puntaPiquetes", marcas, [
          { label: "1 marca", set: 1 },
          { label: "2 marcas", set: 2 },
          { label: "3 marcas", set: 3 }
        ], "Desde 7 m: +1 por metro / 1 tiempo +3 / 2 +2 / 3 +1 / 4 +0")}
      </div>
    </article>
  `;
}

function renderPuntaCounter(title, field, value, quickActions, helper = "") {
  return html`
    <div class="punta-counter">
      <label>${escapeHTML(title)}</label>
      <div class="counter-row">
        <button class="counter-button" data-action="punta-step" data-field="${field}" data-delta="-1">-</button>
        <strong>${moneylessNumber(value)}</strong>
        <button class="counter-button primary" data-action="punta-step" data-field="${field}" data-delta="1">+</button>
      </div>
      ${helper ? html`<p>${escapeHTML(helper)}</p>` : ""}
      <div class="quick-row">
        ${quickActions
          .map((item) => html`
            <button
              class="quick-button"
              data-action="${item.set ? "punta-set" : "punta-step"}"
              data-field="${field}"
              data-delta="${item.delta || ""}"
              data-value="${item.set || ""}"
            >
              ${escapeHTML(item.label)}
            </button>
          `)
          .join("")}
      </div>
    </div>
  `;
}

function renderCalaAdicGroup(title, code, rules, context) {
  const validRules = rules.filter(Boolean);
  return html`
    <section class="cala-adic-group">
      <div>
        <h3>${escapeHTML(code)}</h3>
        <p>${escapeHTML(title)}</p>
      </div>
      <div class="cala-adic-buttons">
        ${validRules.map((rule) => renderRuleButton(rule, "adic", "green", context)).join("")}
      </div>
    </section>
  `;
}

function renderRuleButton(rule, type, color, context) {
  const active = context.attempt.applied?.includes(rule.id);
  const prefix = type === "infr" ? "-" : type === "adic" ? "+" : "";
  return html`
    <button class="score-button ${color} ${active ? "active" : ""}" data-action="toggle-rule" data-type="${type}" data-id="${rule.id}">
      <b>${prefix}${moneylessNumber(rule.pts)}</b>
      <span>${escapeHTML(rule.label)}</span>
    </button>
  `;
}

function renderPuntaSection(context) {
  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Calculador de punta</h2>
          <p class="card-subtitle">Metros y marcas para Cala de Caballo.</p>
        </div>
        <span class="pill blue">+${moneylessNumber(context.attempt.puntaPts)} pts</span>
      </div>
      <div class="card-body grid cols-2">
        <div>
          <label>Metros de punta</label>
          <input type="number" min="0" value="${context.attempt.puntaMetros || 0}" data-action="punta-input" data-field="puntaMetros">
        </div>
        <div>
          <label>Marcas</label>
          <input type="number" min="1" max="4" value="${context.attempt.puntaPiquetes || 1}" data-action="punta-input" data-field="puntaPiquetes">
        </div>
      </div>
    </article>
  `;
}

function renderDescSection(context) {
  const descOptions = context.suerte.catalog.desc || [];
  const selectedDesc = context.attempt.desc || "";
  const catalogLabels = descOptions.map((rule) => rule.label);
  const selectValue = selectedDesc && !catalogLabels.includes(selectedDesc) ? "__other" : selectedDesc;
  const otherValue = selectValue === "__other" && selectedDesc !== "Otro" ? selectedDesc : "";

  return html`
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Descalificaciones</h2>
          <p class="card-subtitle">Selecciona el motivo correspondiente.</p>
        </div>
      </div>
      <div class="card-body desc-grid">
        <div>
          <label>Motivo</label>
          <select data-action="desc-select">
            <option value="" ${selectValue ? "" : "selected"}>Sin descalificacion</option>
            ${descOptions
              .map(
                (rule) => html`
                  <option value="${escapeHTML(rule.label)}" ${selectValue === rule.label ? "selected" : ""}>
                    ${escapeHTML(rule.label)}
                  </option>
                `
              )
              .join("")}
            <option value="__other" ${selectValue === "__other" ? "selected" : ""}>Otro</option>
          </select>
        </div>
        ${
          selectValue === "__other"
            ? html`
                <div>
                  <label>Otro motivo</label>
                  <input data-action="desc-other" value="${escapeHTML(otherValue)}" placeholder="Escribe el motivo">
                </div>
              `
            : ""
        }
      </div>
    </article>
  `;
}

function renderTimeNoteSection(context) {
  const evidence = normalizeTimeEvidenceList(context.attempt.timeEvidence);
  return html`
    <article class="card time-evidence-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Evidencia de tiempo</h2>
          <p class="card-subtitle">Captura manualmente el cronometro cuando el juez lo decida.</p>
        </div>
        <button class="button primary" data-action="capture-time-evidence" type="button">Tomar tiempo</button>
      </div>
      <div class="card-body form-grid">
        <div>
          <label>Tiempo observado</label>
          <input value="${escapeHTML(context.attempt.tiempo || "")}" data-action="attempt-field" data-field="tiempo" placeholder="00:00.0">
        </div>
        <div>
          <label>Nota de juez</label>
          <input value="${escapeHTML(context.attempt.note || "")}" data-action="attempt-field" data-field="note" placeholder="Observacion breve">
        </div>
        <div class="wide">
          ${evidence.length
            ? html`
                <div class="time-evidence-list">
                  ${evidence.map((item) => html`
                    <div class="time-evidence-row">
                      <div>
                        <strong>${escapeHTML(item.label || "Tiempo")}</strong>
                        <span>${escapeHTML(item.timeText || formatMilliseconds(item.timeMs || 0))}</span>
                        <em>${escapeHTML(formatEvidenceCapturedAt(item.capturedAt))} / ${item.timerRunning ? "corriendo" : "detenido"}</em>
                      </div>
                      <button class="button small red" data-action="remove-time-evidence" data-id="${escapeHTML(item.id)}" type="button">Eliminar</button>
                    </div>
                  `).join("")}
                </div>
              `
            : html`<div class="time-evidence-empty">Sin tiempos capturados.</div>`}
        </div>
      </div>
    </article>
  `;
}

function normalizeTimeEvidenceList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

function captureTimeEvidence() {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;
  const timerView = getTimerView(
    {
      running: timerRunning,
      startedAt: timerRunning ? timerStartedAt : null,
      elapsedMs: timerElapsedMs
    },
    getTimerSource()
  );
  pendingTimeEvidenceCapture = {
    id: uid("tiempo"),
    timeMs: Number(timerView.displayMs || 0),
    timeText: timerView.formatted || formatTimerMs(timerView.displayMs || 0),
    capturedAt: new Date().toISOString(),
    timerRunning: Boolean(timerRunning),
    source: "calificador-manual"
  };

  showModal({
    title: "Tomar tiempo",
    body: html`
      <form id="time-evidence-form" class="grid">
        <div class="time-evidence-preview">
          <span>Tiempo capturado</span>
          <strong>${escapeHTML(pendingTimeEvidenceCapture.timeText)}</strong>
          <em>${pendingTimeEvidenceCapture.timerRunning ? "Cronometro corriendo" : "Cronometro detenido"}</em>
        </div>
        <div class="form-grid">
          <div>
            <label>Etiqueta</label>
            <select name="label">
              ${TIME_EVIDENCE_LABEL_OPTIONS.map(([value, label]) => html`
                <option value="${escapeHTML(value)}">${escapeHTML(label)}</option>
              `).join("")}
            </select>
          </div>
          <div>
            <label>Otro</label>
            <input name="labelOther" placeholder="Etiqueta personalizada">
          </div>
        </div>
      </form>
    `,
    actions: html`
      <button class="button" data-action="close-modal">Cancelar</button>
      <button class="button primary" data-action="save-time-evidence">Guardar tiempo</button>
    `
  });
}

function saveTimeEvidence() {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  const form = document.getElementById("time-evidence-form");
  if (!context?.attempt || !pendingTimeEvidenceCapture || !form) return;
  const data = new FormData(form);
  const selectedLabel = String(data.get("label") || "").trim();
  const customLabel = String(data.get("labelOther") || "").trim();
  const label = selectedLabel === "__other" ? customLabel || "Otro" : selectedLabel || "Tiempo oficial";
  const evidence = {
    ...pendingTimeEvidenceCapture,
    label
  };
  context.attempt.timeEvidence = normalizeTimeEvidenceList(context.attempt.timeEvidence).concat(evidence);
  pendingTimeEvidenceCapture = null;
  closeModal();
  console.info("[calificador-001] time captured", {
    label: evidence.label,
    timeMs: evidence.timeMs,
    timeText: evidence.timeText,
    timerRunning: evidence.timerRunning
  });
  persistScoreChange();
}

function removeTimeEvidence(evidenceId = "") {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt || !evidenceId) return;
  const before = normalizeTimeEvidenceList(context.attempt.timeEvidence);
  context.attempt.timeEvidence = before.filter((item) => item.id !== evidenceId);
  console.info("[calificador-001] time removed", { id: evidenceId });
  persistScoreChange();
}

function formatMilliseconds(value) {
  return formatTimerMs(Number(value || 0));
}

function formatEvidenceCapturedAt(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function renderRosterFields(team = { roster: createRoster("") }) {
  if (isIndividualTournament()) return renderParticipantFields(team);

  const roster = team.roster || createRoster("");
  const suertes = getActiveTournamentSuertes();
  const showColas = suertes.some((suerte) => suerte.id === "colas");
  const showTerna = suertes.some((suerte) => ["lazo", "pial_ruedo"].includes(suerte.id));
  const rosterSuertes = suertes.filter((suerte) => !["colas", "lazo", "pial_ruedo"].includes(suerte.id));
  const ternaRoster = getTernaRosterParts(roster);
  return html`
    <div class="form-grid">
      <div class="wide">
        <label>Nombre del equipo</label>
        <input name="name" value="${escapeHTML(team.name || "")}" required placeholder="Ej. Rancho El Capricho">
      </div>
      <div class="wide">
        <label>Categoria</label>
        <input name="category" list="team-category-options" value="${escapeHTML(getTeamCategory(team))}" placeholder="Libre">
        <datalist id="team-category-options">
          ${TEAM_CATEGORIES.map((category) => html`<option value="${escapeHTML(category)}"></option>`).join("")}
        </datalist>
      </div>
      <div class="wide">
        <label>Asociacion</label>
        <input name="association" value="${escapeHTML(team.association || "")}" placeholder="Asociacion o municipio">
      </div>
      <div class="wide">
        <label>Capitan</label>
        <input name="captain" value="${escapeHTML(team.captain || "")}" placeholder="Nombre del capitan">
      </div>
      ${rosterSuertes
        .map(
          (suerte) => html`
            <div>
              <label>${escapeHTML(suerte.fullName)}</label>
              <input name="roster.${suerte.id}" value="${escapeHTML(roster[suerte.id] || "")}">
            </div>
          `
        )
        .join("")}
      ${
        showTerna
          ? html`
              <div>
                <label>Terna 1 - Lazo a la cabeza</label>
                <input name="roster.terna.0" value="${escapeHTML(ternaRoster[0] || "")}">
              </div>
              <div>
                <label>Terna 2 - Pial en el ruedo</label>
                <input name="roster.terna.1" value="${escapeHTML(ternaRoster[1] || "")}">
              </div>
              <div>
                <label>Terna 3 - Apoyo</label>
                <input name="roster.terna.2" value="${escapeHTML(ternaRoster[2] || "")}">
              </div>
            `
          : ""
      }
      ${
        showColas
          ? html`
              <div>
                <label>Coleador 1</label>
                <input name="roster.colas.0" value="${escapeHTML(roster.colas?.[0] || "")}">
              </div>
              <div>
                <label>Coleador 2</label>
                <input name="roster.colas.1" value="${escapeHTML(roster.colas?.[1] || "")}">
              </div>
              <div>
                <label>Coleador 3</label>
                <input name="roster.colas.2" value="${escapeHTML(roster.colas?.[2] || "")}">
              </div>
            `
          : ""
      }
    </div>
  `;
}

function renderParticipantFields(team = {}) {
  const labels = getEntityLabels();
  const { participantName, horseName } = getParticipantHorseParts(team);
  return html`
    <div class="form-grid">
      <div class="wide">
        <label>${escapeHTML(labels.nameLabel)}</label>
        <input name="participantName" value="${escapeHTML(participantName)}" required placeholder="${escapeHTML(labels.namePlaceholder)}">
      </div>
      <div class="wide">
        <label>${escapeHTML(labels.horseLabel)}</label>
        <input name="horseName" value="${escapeHTML(horseName)}" required placeholder="${escapeHTML(labels.horsePlaceholder)}">
      </div>
      <div class="wide">
        <label>Categoria</label>
        <input name="category" list="team-category-options" value="${escapeHTML(getTeamCategory(team))}" placeholder="Libre">
        <datalist id="team-category-options">
          ${TEAM_CATEGORIES.map((category) => html`<option value="${escapeHTML(category)}"></option>`).join("")}
        </datalist>
      </div>
      <div class="wide">
        <label>Asociacion</label>
        <input name="association" value="${escapeHTML(team.association || "")}" placeholder="Asociacion o municipio">
      </div>
    </div>
  `;
}

function showTournamentModal() {
  showModal({
    title: "Nuevo torneo",
    body: html`
      <form id="tournament-form" class="form-grid">
        <div class="wide">
          <label>Nombre</label>
          <input name="name" required placeholder="Ej. Torneo Estatal 2026">
        </div>
        <div>
          <label>Temporada</label>
          <input name="season" inputmode="numeric" pattern="[0-9]{4}" value="${new Date().getFullYear()}" placeholder="2026">
        </div>
        <div>
          <label>Estado</label>
          <select name="status">
            ${TOURNAMENT_STATUS_OPTIONS.map(([value, label], index) => html`
              <option value="${value}" ${index === 0 ? "selected" : ""}>${escapeHTML(label)}</option>
            `).join("")}
          </select>
        </div>
        <div class="wide">
          <label>Tipo de torneo</label>
          <div class="tournament-type-grid">
            ${TOURNAMENT_TYPES.map((type, index) => html`
              <label class="tournament-type-option">
                <input type="radio" name="type" value="${type.id}" ${index === 0 ? "checked" : ""}>
                <span>
                  <strong>${escapeHTML(type.name)}</strong>
                  <em>${escapeHTML(type.description)}</em>
                </span>
              </label>
            `).join("")}
          </div>
        </div>
        <div>
          <label>Fecha</label>
          <input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div>
          <label>Lienzo</label>
          <input name="venue" placeholder="Nombre del lienzo">
        </div>
      </form>
    `,
    actions: html`<button class="button primary" data-action="save-tournament">Guardar torneo</button>`
  });
}

function showTeamModal(teamId = null) {
  if (!guardUnlockedTournament()) return;
  const team = teamId ? getTeam(teamId) : null;
  const labels = getEntityLabels();
  showModal({
    title: team ? labels.formTitleEdit : labels.formTitleNew,
    body: html`<form id="team-form" data-id="${team?.id || ""}">${renderRosterFields(team || undefined)}</form>`,
    actions: html`
      ${team ? html`<button class="button red" data-action="delete-team" data-id="${team.id}">Eliminar</button>` : ""}
      <button class="button primary" data-action="save-team">${escapeHTML(labels.formSave)}</button>
    `
  });
}

function showCharreadaModal(charreadaId = null) {
  if (!guardUnlockedTournament()) return;
  const teams = getTournamentTeams();
  const charreada = charreadaId ? state.charreadas.find((item) => item.id === charreadaId) : null;
  if (charreada && !guardUnlockedCharreada(charreada)) return;
  const selectedTeamIds = charreada?.teamIds || [];
  const labels = getEntityLabels();
  const phaseState = getCharreadaPhaseFormState(charreada);
  const operationalStatus = getCharreadaOperationalStatus(charreada || {});
  const selectedCompetition = getCharreadaCompetition(charreada || {});
  const individualParticipants = normalizeIndividualParticipants(charreada?.individualParticipants || []);
  const individualMode = selectedCompetition.scope === "individual";
  const orderedTeams = teams
    .map((team, index) => ({
      team,
      index,
      orderIndex: selectedTeamIds.indexOf(team.id)
    }))
    .sort((a, b) => {
      const aSelected = a.orderIndex >= 0;
      const bSelected = b.orderIndex >= 0;
      if (aSelected && bSelected) return a.orderIndex - b.orderIndex;
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return a.index - b.index;
    });

  showModal({
    title: charreada ? "Editar charreada" : "Nueva charreada",
    body: html`
      <form id="charreada-form" class="grid" data-id="${charreada?.id || ""}">
        <div class="form-grid">
          <div>
            <label>Nombre</label>
            <input name="name" required value="${escapeHTML(charreada?.name || `Charreada ${getTournamentCharreadas().length + 1}`)}">
          </div>
          <div>
            <label>Fecha</label>
            <input name="date" type="date" value="${escapeHTML(charreada?.date || new Date().toISOString().slice(0, 10))}">
          </div>
          <div>
            <label>Hora</label>
            <input name="startTime" type="time" value="${escapeHTML(charreada?.startTime || "12:00")}">
          </div>
          <div>
            <label>Estado</label>
            <select name="status">
              ${CHARREADA_STATUS_OPTIONS.map(([value, label]) => html`
                <option value="${value}" ${charreada?.status === value ? "selected" : ""}>${escapeHTML(label)}</option>
              `).join("")}
            </select>
          </div>
          <div>
            <label>Tipo de competencia</label>
            <select name="competitionType">
              ${COMPETITION_TYPES.map((competition) => html`
                <option value="${escapeHTML(competition.type)}" ${selectedCompetition.type === competition.type ? "selected" : ""}>${escapeHTML(competition.label)}</option>
              `).join("")}
            </select>
          </div>
          <div>
            <label>Fase/Ronda</label>
            <select name="phase">
              ${CHARREADA_PHASE_OPTIONS.map(([value, label]) => html`
                <option value="${escapeHTML(value)}" ${phaseState.selectValue === value ? "selected" : ""}>${escapeHTML(label)}</option>
              `).join("")}
            </select>
          </div>
          <div>
            <label>Fase personalizada</label>
            <input name="phaseOther" value="${escapeHTML(phaseState.customValue)}" placeholder="Usar solo si elegiste Otro">
          </div>
          <div>
            <label>Lienzo / sede</label>
            <input name="venue" value="${escapeHTML(getCharreadaProductionValue(charreada || {}, ["venue", "sede", "lienzo", "productionVenue"]))}" placeholder="Lienzo principal">
          </div>
          <div>
            <label>Locutor asignado</label>
            <input name="announcer" value="${escapeHTML(getCharreadaProductionValue(charreada || {}, ["announcer", "locutor", "assignedAnnouncer"]))}" placeholder="Nombre del locutor">
          </div>
          <div>
            <label>Jueces asignados</label>
            <input name="judges" value="${escapeHTML(getCharreadaProductionValue(charreada || {}, ["judges", "jueces", "assignedJudges"]))}" placeholder="Juez 1, Juez 2">
          </div>
          <div>
            <label>Responsable de produccion</label>
            <input name="productionLead" value="${escapeHTML(getCharreadaProductionValue(charreada || {}, ["productionLead", "responsableProduccion", "productionManager"]))}" placeholder="Responsable operativo">
          </div>
          <div>
            <label>Hora real de inicio</label>
            <input name="realStartTime" type="time" value="${escapeHTML(getCharreadaProductionValue(charreada || {}, ["realStartTime", "actualStartTime", "horaRealInicio"]))}">
          </div>
          <div>
            <label>Hora real de termino</label>
            <input name="realEndTime" type="time" value="${escapeHTML(getCharreadaProductionValue(charreada || {}, ["realEndTime", "actualEndTime", "horaRealTermino"]))}">
          </div>
          <div>
            <label>Estado operativo</label>
            <select name="operationalStatus">
              ${OPERATIONAL_STATUS_OPTIONS.map(([value, label]) => html`
                <option value="${escapeHTML(value)}" ${operationalStatus === value ? "selected" : ""}>${escapeHTML(label)}</option>
              `).join("")}
            </select>
          </div>
          <div class="wide">
            <label>Notas internas</label>
            <textarea name="internalNotes" rows="3" placeholder="Notas para produccion, jueces o logistica">${escapeHTML(getCharreadaProductionValue(charreada || {}, ["internalNotes", "notasInternas", "productionNotes"]))}</textarea>
          </div>
	        </div>
	        <div class="charreada-team-section" data-competition-section="team" ${individualMode ? "hidden" : ""}>
	          <label>${escapeHTML(labels.orderLabel)}</label>
          <div class="program-order-tools">
            <div class="program-order-search">
              <input data-action="charreada-filter-teams" type="search" placeholder="Buscar ${escapeHTML(labels.singular)}...">
              <span class="pill" id="charreada-search-count">${teams.length} visibles</span>
              <span class="pill blue" id="charreada-selected-count">${selectedTeamIds.length} / ${teams.length}</span>
            </div>
	          <div class="topbar-actions compact-actions">
              <button class="button small" data-action="charreada-select-all" type="button">Todos</button>
              <button class="button small" data-action="charreada-clear-teams" type="button">Limpiar</button>
              <button class="button small" data-action="charreada-compact-order" type="button">Renumerar orden</button>
            </div>
          </div>
          <div class="team-order-list">
            ${orderedTeams
              .map(({ team, index, orderIndex }) => {
                const isSelected = orderIndex >= 0;
                return html`
                  <label class="team-order-row ${isSelected ? "selected" : ""}" data-team-name="${escapeHTML(getEntryDisplayName(team))}">
                    <input type="checkbox" name="teamIds" value="${team.id}" ${isSelected ? "checked" : ""}>
	                    <span>${escapeHTML(getEntryDisplayName(team))}</span>
	                    <input class="team-order-input" type="number" name="teamOrder.${team.id}" min="1" value="${isSelected ? orderIndex + 1 : ""}" ${isSelected ? "" : "disabled"} aria-label="Orden de ${escapeHTML(getEntryDisplayName(team))}" placeholder="${index + 1}">
                  </label>
                `;
              })
              .join("")}
          </div>
          <div class="team-order-empty" id="charreada-filter-empty" hidden>Sin coincidencias.</div>
	          <p class="card-subtitle">${escapeHTML(labels.orderHelp)}</p>
        </div>
        ${renderIndividualParticipantsSection(individualParticipants, individualMode)}
      </form>
    `,
    actions: html`
      ${charreada ? html`<button class="button red" data-action="delete-charreada" data-id="${charreada.id}">Eliminar</button>` : ""}
      <button class="button primary" data-action="save-charreada">Guardar charreada</button>
    `
  });
}

function wireGlobalEvents() {
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("#access-login-form");
    if (!form) return;
    event.preventDefault();
    signInAccess();
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action], [data-view]");
    if (!target) return;
    if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) {
      event.preventDefault();
    }

    const action = target.dataset.action;
    const view = target.dataset.view;

    if (view) {
      setView(view);
      render();
      return;
    }

    handleAction(action, target);
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "select-tournament") {
      if (!canAccessTournamentId(target.value)) {
        showToast("Este usuario no tiene ese torneo asignado.");
        render();
        return;
      }
      setActiveTournament(target.value);
      queueSharedAppStatePublish(150);
      render();
    }

    if (target.dataset.action === "individual-awards-places") {
      if (!canUseAction(target.dataset.action)) return;
      saveIndividualAwardPlaces(target.value);
    }

    if (target.dataset.action === "select-results-competition") {
      selectResultsCompetition(target.value);
    }

    if (target.dataset.action === "punta-input") {
      if (!canUseAction(target.dataset.action)) return;
      if (!guardUnlockedCharreada()) return;
      const attempt = getCurrentContext()?.attempt;
      if (!attempt) return;
      writePuntaField(attempt, target.dataset.field, Number(target.value || 0));
      persistScoreChange();
    }

    if (target.dataset.action === "attempt-field") {
      if (!canUseAction(target.dataset.action)) return;
      if (!guardUnlockedCharreada()) return;
      const attempt = getCurrentContext()?.attempt;
      if (!attempt) return;
      attempt[target.dataset.field] = target.value;
      persistScoreChange();
    }

    if (target.dataset.action === "desc-select") {
      if (!canUseAction(target.dataset.action)) return;
      setDescReason(target.value === "__other" ? "Otro" : target.value);
    }

    if (target.dataset.action === "desc-other") {
      if (!canUseAction(target.dataset.action)) return;
      setDescReason(target.value.trim() || "Otro");
    }

    if (target.closest("#charreada-form") && target.getAttribute("name") === "teamIds") {
      refreshCharreadaTeamOrderRows();
    }

    if (target.closest("#charreada-form") && target.getAttribute("name") === "competitionType") {
      refreshCharreadaCompetitionSections();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "charreada-filter-teams") {
      filterCharreadaTeamRows(target.value || "");
    }

    if (target.dataset.action === "scoring-action-search") {
      filterScoringActionResults(target.value || "");
    }
  });
}

function closeActiveModal() {
  if (pendingBestColeadorModal) {
    continueAfterBestColeadorModal();
    return;
  }
  closeModal();
}

function handleAction(action, target) {
  if (!canUseAction(action)) return;
  if (target?.dataset?.confirmMessage && !window.confirm(target.dataset.confirmMessage)) return;

  const handlers = {
    "close-modal": closeActiveModal,
    "show-access-login": showAccessLoginModal,
    "sign-in-access": signInAccess,
    "sign-out-access": signOutAccess,
    "prepare-clear-cache": prepareClearLocalCache,
    "prepare-sync": prepareSyncWithCharroPro,
    "toggle-sidebar": toggleSidebar,
    "toggle-turn-panel": toggleTurnPanel,
    "toggle-scoring-accordion": () => toggleScoringAccordion(target.dataset.group),
    "show-scoring-action-history": showScoringActionHistoryModal,
    "take-live-control": takeSupervisorLiveControl,
    "new-tournament": showTournamentModal,
    "save-tournament": saveTournament,
    "open-tournament": () => openTournament(target.dataset.id, "dashboard"),
    "open-tournament-program": () => openTournament(target.dataset.id, "officialProgram"),
    "open-program-charreada": () => openProgramCharreada(target.dataset.id),
    "toggle-official-program-day": () => toggleOfficialProgramDay(target.dataset.id),
    "toggle-program-day": () => toggleProgramDay(target.dataset.id),
    "set-tournament-status": () => setTournamentStatus(target.dataset.id, target.dataset.status),
    "confirm-freeze-tournament": () => confirmFreezeTournament(target.dataset.id),
    "freeze-tournament": () => freezeTournament(target.dataset.id),
    "confirm-delete-tournament": () => confirmDeleteTournament(target.dataset.id),
    "delete-tournament-permanent": () => deleteTournamentPermanent(target.dataset.id),
    "new-team": () => showTeamModal(),
    "select-teams-tab": () => selectTeamsTab(target.dataset.tab),
	    "select-results-phase": () => selectResultsPhase(target.dataset.id),
	    "select-rule-suerte": () => selectRuleEditorSuerte(target.dataset.id),
	    "save-rule-editor": saveRuleEditor,
	    "add-rule-editor": () => addRuleEditorItem(target.dataset.group),
	    "delete-rule-editor": () => deleteRuleEditorItem(target.dataset.group, target.dataset.id),
	    "reset-rule-editor": () => resetRuleEditorSuerte(target.dataset.suerte, target.dataset.scope),
	    "save-quick-teams": saveQuickTeams,
    "edit-team": () => showTeamModal(target.dataset.id),
    "save-team": saveTeam,
    "delete-team": () => deleteTeam(target.dataset.id),
    "new-charreada": () => showCharreadaModal(),
    "edit-charreada": () => showCharreadaModal(target.dataset.id),
    "save-charreada": saveCharreada,
    "charreada-select-all": selectAllCharreadaTeams,
    "charreada-clear-teams": clearCharreadaTeams,
    "charreada-compact-order": compactCharreadaTeamOrder,
    "add-individual-participant": addIndividualParticipantRow,
    "remove-individual-participant": () => removeIndividualParticipantRow(target),
    "renumber-individual-participants": renumberIndividualParticipants,
    "delete-charreada": () => confirmDeleteCharreada(target.dataset.id),
    "set-active-charreada": () => activateCharreada(target.dataset.id),
    "start-scoring": () => startScoring(target.dataset.id),
    "exit-scoring": () => {
      stopTimer();
      exitSupervisorScoringReviewMode();
      setView("dashboard");
      render();
    },
    "select-suerte": () => {
      stopTimer(true);
      state.scoringSuerteIdx = Number(target.dataset.index);
      state.scoringAttemptIdx = 0;
      state.scoringColeadorIdx = 0;
      saveScoringNavigationDraft();
      render();
    },
    "select-team": () => {
      stopTimer(true);
      state.scoringTeamIdx = Number(target.dataset.index);
      state.scoringAttemptIdx = 0;
      state.scoringColeadorIdx = 0;
      saveScoringNavigationDraft();
      render();
    },
    "select-attempt": () => {
      stopTimer(true);
      state.scoringAttemptIdx = Number(target.dataset.index);
      saveScoringNavigationDraft();
      render();
    },
    "select-coleador": () => {
      stopTimer(true);
      state.scoringColeadorIdx = Number(target.dataset.index);
      saveScoringNavigationDraft();
      render();
    },
    "punta-step": () => adjustPunta(target.dataset.field, Number(target.dataset.delta || 0)),
    "punta-set": () => setPuntaValue(target.dataset.field, Number(target.dataset.value || 0)),
    "toggle-rule": () => toggleRule(target.dataset.type, target.dataset.id),
    "toggle-team-penalty": () => toggleTeamPenalty(target.dataset.id),
    "add-team-penalty": addTeamPenalty,
    "remove-team-penalty": () => removeTeamPenalty(target.dataset.id),
    "toggle-attempt-zero": toggleAttemptZero,
    "capture-time-evidence": captureTimeEvidence,
    "save-time-evidence": saveTimeEvidence,
    "remove-time-evidence": () => removeTimeEvidence(target.dataset.id),
    "continue-best-coleador-modal": continueAfterBestColeadorModal,
    "toggle-desc": () => toggleDesc(target.dataset.label),
    "add-custom": () => addCustomScore(target.dataset.type),
    "remove-custom": () => removeCustomScore(target.dataset.type, target.dataset.id),
    "reset-attempt": resetAttempt,
    "previous-score": previousScore,
    "next-score": nextScore,
    "timer-toggle": toggleTimer,
    "timer-reset": () => stopTimer(true),
    "show-scoring-button-settings": showScoringButtonSettingsModal,
    "save-scoring-button-layout": () => saveScoringButtonLayout(target.dataset.scope),
    "reset-scoring-button-layout": () => resetScoringButtonLayout(target.dataset.scope),
    "save-settings": saveSettings,
    "new-user-profile": () => showUserProfileModal(),
    "edit-user-profile": () => showUserProfileModal(target.dataset.uid),
    "save-user-profile": saveUserProfile,
    "deactivate-user-profile": () => toggleUserProfileActive(target.dataset.uid),
    "save-stat-history": saveStatHistory,
    "test-sync": testSync,
    "publish-live-state": publishLiveState,
    "export-csv": () => exportCurrentTournamentCsv(state.activeTournamentId),
    "export-official-xlsx": () => downloadOfficialFormatXlsx(state.activeCharreadaId),
    "export-json": exportBackupJson,
    "create-full-backup": createRecoveryFullBackup,
    "clear-recovery-history": clearRecoveryBackupHistory,
    "clear-local-cache": clearLocalCacheAndReload,
    "copy-live-url": () => copyLiveUrl(target.dataset.target),
    "copy-public-url": () => copyLiveUrl(target.dataset.target),
    "reset-data": confirmReset,
    "confirm-reset": () => {
      resetAllData();
      closeModal();
      render();
    },
    "confirm-delete-charreada": () => deleteCharreada(target.dataset.id)
  };

  handlers[action]?.();
}

function toggleScoringAccordion(groupId) {
  if (!groupId) return;
  scoringAccordionState[groupId] = !isScoringAccordionOpen(groupId);
  saveScoringAccordionPreference();
  render({ preserveScoringScroll: state.view === "scoring" });
}

function filterScoringActionResults(value) {
  const needle = normalizeNameForCompare(value);
  const results = [...document.querySelectorAll("[data-search-action-result]")];
  let shown = 0;
  results.forEach((result) => {
    const text = normalizeNameForCompare(result.dataset.searchText || "");
    const visible = Boolean(needle && text.includes(needle) && shown < 8);
    result.hidden = !visible;
    if (visible) shown += 1;
  });
}

function showScoringActionHistoryModal() {
  const context = getCurrentContext();
  if (!context) return;
  const actions = buildRecentActions(context);
  showModal({
    title: "Historial de acciones",
    body: html`
      <div class="cp-history-action-modal">
        ${
          actions.length
            ? actions.map((item) => html`
                <div class="cp-recent-row ${item.kind}">
                  <span>${escapeHTML(item.points)}</span>
                  <strong>${escapeHTML(item.label)}</strong>
                  <em>${escapeHTML(context.suerte.name || "")}</em>
                </div>
              `).join("")
            : html`<div class="empty">Sin acciones en esta oportunidad.</div>`
        }
      </div>
    `,
    actions: html`<button class="button primary" data-action="close-modal">Cerrar</button>`
  });
}

function showScoringButtonSettingsModal() {
  if (!canEditScoringButtonLayout()) {
    showToast("Solo supervisor u operador pueden ajustar la botonera.");
    return;
  }

  const context = getCurrentContext();
  if (!context) return;
  const buttons = applyScoringButtonOverrides(buildScoringActionButtons(context), context.suerte.id)
    .sort((a, b) => a.group.localeCompare(b.group) || a.order - b.order || a.label.localeCompare(b.label, "es"));

  showModal({
    title: "Ajustes de botonera",
    body: html`
      <form id="scoring-button-layout-form" class="cp-button-settings-modal" data-suerte="${escapeHTML(context.suerte.id)}">
        <div class="cp-settings-intro">
          <strong>${escapeHTML(context.suerte.fullName)}</strong>
          <span>Esta pantalla solo cambia la presentacion de botones. Los puntos y acciones siguen saliendo del reglamento.</span>
        </div>
        <div class="cp-button-settings-list">
          ${buttons.map((button) => renderScoringButtonSettingsRow(button)).join("")}
        </div>
      </form>
    `,
    actions: html`
      <button class="button" data-action="reset-scoring-button-layout" data-scope="tournament">Restaurar torneo</button>
      <button class="button primary" data-action="save-scoring-button-layout" data-scope="tournament">Guardar para este torneo</button>
      ${
        firebaseAccess.role === ROLES.SUPERVISOR
          ? html`<button class="button green" data-action="save-scoring-button-layout" data-scope="global">Guardar global</button>`
          : ""
      }
    `
  });
}

function renderScoringButtonSettingsRow(button) {
  const officialGroup = getOfficialScoringButtonSettingsGroup(button);
  return html`
    <section class="cp-button-settings-row" data-button-id="${escapeHTML(button.id)}">
      <label class="rule-toggle">
        <input data-field="enabled" type="checkbox" ${button.enabled !== false ? "checked" : ""}>
        <span>Activo</span>
      </label>
      <div>
        <label>Boton</label>
        <strong>${escapeHTML(button.label)}</strong>
        <em>${escapeHTML(button.valueLabel || button.action || "")}</em>
      </div>
      <div>
        <label>Nombre corto</label>
        <input data-field="shortLabel" value="${escapeHTML(button.shortLabel || button.label)}">
      </div>
      <div>
        <label>Bloque</label>
        <strong>${escapeHTML(officialGroup.title)}</strong>
        <em>Fijo por reglamento</em>
        <input data-field="group" type="hidden" value="${escapeHTML(officialGroup.group)}">
      </div>
      <div>
        <label>Orden</label>
        <input data-field="order" type="number" min="1" step="1" value="${Number(button.order || 999)}">
      </div>
      <label class="rule-toggle">
        <input data-field="requiresConfirmation" type="checkbox" ${button.requiresConfirmation ? "checked" : ""}>
        <span>Confirmar</span>
      </label>
    </section>
  `;
}

function getOfficialScoringButtonSettingsGroup(button) {
  if (button.ruleType === "infr") return { title: "Infracciones", group: "infractions" };
  if (button.ruleType === "adic") return { title: "Adicionales", group: "quickActions" };
  return { title: "Calificaciones base", group: "quickActions" };
}

function readScoringButtonLayoutForm() {
  const form = document.getElementById("scoring-button-layout-form");
  if (!form) return null;
  const buttons = {};
  form.querySelectorAll("[data-button-id]").forEach((row) => {
    const id = row.dataset.buttonId;
    if (!id) return;
    buttons[id] = {
      enabled: row.querySelector('[data-field="enabled"]')?.checked !== false,
      shortLabel: row.querySelector('[data-field="shortLabel"]')?.value.trim() || "",
      group: normalizeScoringButtonGroup(row.querySelector('[data-field="group"]')?.value),
      order: Number(row.querySelector('[data-field="order"]')?.value || 999),
      requiresConfirmation: Boolean(row.querySelector('[data-field="requiresConfirmation"]')?.checked)
    };
  });
  return {
    suerteId: form.dataset.suerte,
    layout: {
      buttons,
      updatedAt: new Date().toISOString()
    }
  };
}

function saveScoringButtonLayout(scope = "tournament") {
  if (!canEditScoringButtonLayout()) {
    showToast("No tienes permiso para ajustar la botonera.");
    return;
  }
  const result = readScoringButtonLayoutForm();
  if (!result?.suerteId) return;

  if (scope === "global") {
    if (firebaseAccess.role !== ROLES.SUPERVISOR) {
      showToast("Solo supervisor puede guardar global.");
      return;
    }
    state.settings.scoringButtonLayouts = normalizeScoringButtonLayouts({
      ...(state.settings.scoringButtonLayouts || {}),
      [result.suerteId]: result.layout
    });
    void publishFirebaseScoringButtonLayouts(state.settings.scoringButtonLayouts, result.layout.updatedAt);
  } else {
    const tournament = getActiveTournament();
    if (!tournament) return;
    tournament.scoringButtonLayouts = normalizeScoringButtonLayouts({
      ...(tournament.scoringButtonLayouts || {}),
      [result.suerteId]: result.layout
    });
  }

  closeModal();
  saveState();
  scheduleFirebaseSync(100);
  showToast(scope === "global" ? "Botonera global guardada." : "Botonera guardada para este torneo.");
  render({ preserveScoringScroll: state.view === "scoring" });
}

function resetScoringButtonLayout(scope = "tournament") {
  if (!canEditScoringButtonLayout()) return;
  const context = getCurrentContext();
  if (!context) return;

  if (scope === "global") {
    if (firebaseAccess.role !== ROLES.SUPERVISOR) return;
    const layouts = { ...(state.settings.scoringButtonLayouts || {}) };
    delete layouts[context.suerte.id];
    state.settings.scoringButtonLayouts = normalizeScoringButtonLayouts(layouts);
    void publishFirebaseScoringButtonLayouts(state.settings.scoringButtonLayouts, new Date().toISOString());
  } else {
    const tournament = getActiveTournament();
    if (!tournament) return;
    const layouts = { ...(tournament.scoringButtonLayouts || {}) };
    delete layouts[context.suerte.id];
    tournament.scoringButtonLayouts = normalizeScoringButtonLayouts(layouts);
  }

  closeModal();
  saveState();
  scheduleFirebaseSync(100);
  showToast("Botonera restaurada a defaults.");
  render({ preserveScoringScroll: state.view === "scoring" });
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  saveSidebarPreference();
  render();
}

function toggleTurnPanel() {
  turnPanelCollapsed = !turnPanelCollapsed;
  saveTurnPanelPreference();
  render({ preserveScoringScroll: true });
}

function selectTeamsTab(tab) {
  teamsTab = tab === "list" ? "list" : "quick";
  saveTeamsTabPreference();
  render();
}

function openTournament(tournamentId, view = "dashboard") {
  if (!state.tournaments.some((tournament) => tournament.id === tournamentId)) return;
  if (!canAccessTournamentId(tournamentId)) {
    showToast("Este usuario no tiene ese torneo asignado.");
    return;
  }
  if (!IS_TOURNAMENT_APP) {
    window.location.href = buildTournamentUrl("torneo.html", tournamentId, { view });
    return;
  }
  setActiveTournament(tournamentId);
  state.view = view;
  saveState({ silent: true });
  render();
}

function saveIndividualAwardPlaces(value) {
  const tournament = getActiveTournament();
  if (!tournament) return;
  if (!guardUnlockedTournament("El torneo esta congelado; no se puede cambiar la premiacion.")) return;
  tournament.individualAwardPlaces = clampAwardPlaces(value);
  saveState();
  scheduleFirebaseSync(100);
  render();
}

function setTournamentStatus(tournamentId, status) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return;
  if (tournament.status === "congelado") {
    showToast("El torneo ya esta congelado. Solo se puede consultar.");
    return;
  }
  if (status === "finalizado") {
    freezeTournament(tournamentId, {
      toast: "Torneo finalizado, congelado y guardado en historial."
    });
    return;
  }
  tournament.status = status || "preparacion";
  claimGoogleSyncControl();
  saveState();
  scheduleFirebaseSync(100);
  showToast("Estado del torneo actualizado.");
  render();
}

function confirmFreezeTournament(tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return;

  showModal({
    title: "Congelar torneo",
    body: html`
      <p>Se congelara <strong>${escapeHTML(tournament.name)}</strong>. Las charreadas, equipos y calificaciones quedaran solo para consulta.</p>
      <p class="card-subtitle">Usa esto cuando el resultado ya sea oficial.</p>
    `,
    actions: html`
      <button class="button" data-action="close-modal">Cancelar</button>
      <button class="button red" data-action="freeze-tournament" data-id="${tournament.id}">Congelar resultados</button>
    `
  });
}

function canDeleteTournamentPermanently() {
  return isActiveAccessSession(firebaseAccess) && firebaseAccess.role === ROLES.SUPERVISOR;
}

function confirmDeleteTournament(tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return;

  showModal({
    title: "Eliminar torneo definitivamente",
    body: html`
      <p>Se eliminara <strong>${escapeHTML(tournament.name)}</strong> de CharroPro y Firebase.</p>
      <p class="card-subtitle">Tambien se borraran sus equipos, charreadas, calificaciones, graficos en vivo, historial estadistico y asignaciones de usuarios. Esta accion no se puede deshacer.</p>
    `,
    actions: html`
      <button class="button" data-action="close-modal">Cancelar</button>
      <button class="button red" data-action="delete-tournament-permanent" data-id="${tournament.id}">Eliminar definitivamente</button>
    `
  });
}

async function deleteTournamentPermanent(tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return;
  if (!canDeleteTournamentPermanently()) {
    showToast("Solo supervisor puede eliminar torneos definitivamente.");
    return;
  }

  const result = await deleteFirebaseTournament(tournamentId, getAccessActor());
  if (!result.ok) {
    setLastFirebaseError(result.reason || "delete-failed", result.detail?.error?.message || result.detail?.phase || "");
    showToast(formatDeleteTournamentError(result));
    return;
  }

  if (result.cleanupOk === false) {
    setLastFirebaseError(result.cleanupReason || "cleanup-failed", "El torneo se borro, pero no se limpiaron todas las asignaciones de usuarios.");
  } else {
    setLastFirebaseError("");
  }
  removeLocalTournamentData(tournamentId);
  closeModal();
  saveState();
  showToast(result.cleanupOk === false
    ? "Torneo eliminado. Revisa Usuarios: no se limpiaron todas las asignaciones."
    : "Torneo eliminado definitivamente.");
  render();
}

async function freezeTournament(tournamentId, options = {}) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return;
  const backup = await createFirebaseTournamentBackup(tournament.id, getAccessActor());
  if (!backup.ok && backup.reason !== "missing-tournament-data") {
    setLastFirebaseError(backup.reason || "backup-failed", backup.detail?.error?.message || "");
    showToast("No se pudo crear respaldo automatico. Sincroniza antes de congelar.");
    return;
  }
  tournament.status = "congelado";
  getTournamentCharreadas(tournament.id).forEach((charreada) => {
    charreada.status = "congelada";
  });
  const snapshot = buildStatisticalHistorySnapshot(tournament.id);
  const historyRecord = snapshot ? recordStatHistorySnapshot(snapshot) : null;
  if (state.activeTournamentId === tournament.id && state.view === "scoring") {
    state.view = "results";
  }
  closeModal();
  claimGoogleSyncControl();
  saveState();
  scheduleFirebaseSync(100);
  if (historyRecord) void publishFirebaseStatHistory(historyRecord);
  syncCurrentLiveState({ repeat: true });
  showToast(options.toast || "Resultados congelados y guardados en historial.");
  render();
}

async function saveStatHistory() {
  const snapshot = buildStatisticalHistorySnapshot(state.activeTournamentId);
  if (!snapshot) {
    showToast("No hay torneo activo para guardar.");
    return;
  }

  const record = recordStatHistorySnapshot(snapshot);
  saveState();
  const result = await publishFirebaseStatHistory(record);
  showToast(result.ok ? "Historial estadistico guardado." : "Guardado local; Firebase no respondio.");
  render();
}

function saveTournament() {
  const form = document.getElementById("tournament-form");
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const id = uid("torneo");

	  state.tournaments.push({
	    id,
	    name: data.name.trim(),
	    season: getSeasonFromInput(data.season || data.date),
	    date: data.date,
	    venue: data.venue.trim(),
	    type: data.type || "completo",
	    ruleOverrides: {},
	    individualAwardPlaces: 5,
	    status: data.status || "preparacion"
	  });
  state.activeTournamentId = id;
  state.activeCharreadaId = null;
  state.view = "dashboard";
  closeModal();
  saveState();
  scheduleFirebaseSync(100);
	  render();
	}

function selectRuleEditorSuerte(suerteId) {
  if (!suerteId) return;
  state.ruleEditorSuerteId = suerteId;
  saveState({ silent: true });
  render();
}

function saveRuleEditor() {
  if (document.getElementById("rules-form")?.dataset.scope !== "global" && !guardUnlockedTournament("El torneo esta congelado; no se pueden cambiar botoneras.")) return;
  const form = document.getElementById("rules-form");
  if (!form) return;

  setRuleEditorCatalog(form.dataset.suerte, readRuleEditorCatalog(form), form.dataset.scope);
  persistRuleEditorScope(form.dataset.scope);
  showToast(form.dataset.scope === "global" ? "Botonera general guardada." : "Botoneras guardadas para este torneo.");
  render();
}

function addRuleEditorItem(groupId) {
  if (document.getElementById("rules-form")?.dataset.scope !== "global" && !guardUnlockedTournament("El torneo esta congelado; no se pueden cambiar botoneras.")) return;
  const form = document.getElementById("rules-form");
  const suerteId = state.ruleEditorSuerteId;
  if (!form || !suerteId || !groupId) return;

  const labelInput = document.getElementById(`new-rule-label-${groupId}`);
  const ptsInput = document.getElementById(`new-rule-pts-${groupId}`);
  const label = labelInput?.value.trim() || "";
  const pts = Number(ptsInput?.value || 0);

  if (!label) {
    showToast("Escribe el nombre del boton.");
    return;
  }

  const catalog = readRuleEditorCatalog(form) || getEditableRuleCatalog(suerteId, form.dataset.scope);
  catalog[groupId] = catalog[groupId] || [];
  catalog[groupId].push({
    id: uid(`${suerteId}_${groupId}`),
    label,
    pts: groupId === "desc" ? 0 : Math.max(0, pts),
    enabled: true,
    custom: form.dataset.scope !== "global"
  });

  setRuleEditorCatalog(suerteId, catalog, form.dataset.scope);
  persistRuleEditorScope(form.dataset.scope);
  showToast("Boton agregado.");
  render();
}

function deleteRuleEditorItem(groupId, ruleId) {
  if (document.getElementById("rules-form")?.dataset.scope !== "global" && !guardUnlockedTournament("El torneo esta congelado; no se pueden cambiar botoneras.")) return;
  const form = document.getElementById("rules-form");
  const suerteId = state.ruleEditorSuerteId;
  if (!form || !suerteId) return;
  const catalog = readRuleEditorCatalog(form) || getEditableRuleCatalog(suerteId, form.dataset.scope);
  const rules = catalog[groupId] || [];
  const rule = rules.find((item) => item.id === ruleId);
  if (!rule) return;

  if (rule.custom) catalog[groupId] = rules.filter((item) => item.id !== ruleId);
  else rule.enabled = false;

  setRuleEditorCatalog(suerteId, catalog, form.dataset.scope);
  persistRuleEditorScope(form.dataset.scope);
  showToast(rule.custom ? "Boton eliminado." : "Boton oculto.");
  render();
}

function resetRuleEditorSuerte(suerteId, scope = "tournament") {
  if (!suerteId) return;
  if (scope !== "global" && !guardUnlockedTournament("El torneo esta congelado; no se pueden cambiar botoneras.")) return;
  if (scope === "global") {
    if (!state.settings.globalRuleOverrides) return;
    delete state.settings.globalRuleOverrides[suerteId];
    state.settings.globalRuleOverridesUpdatedAt = new Date().toISOString();
  } else {
    const tournament = getActiveTournament();
    if (!tournament?.ruleOverrides) return;
    delete tournament.ruleOverrides[suerteId];
  }
  persistRuleEditorScope(scope);
  showToast(scope === "global" ? "Suerte general restaurada a Federacion." : "Suerte restaurada a la base general.");
  render();
}

function getRuleEditorSuertes(tournament = getActiveTournament(), includeAll = false) {
  if (includeAll) return SUERTES;
  const config = getTournamentTypeConfig(tournament?.type);
  return config.suerteIds
    .map((suerteId) => SUERTES.find((suerte) => suerte.id === suerteId))
    .filter(Boolean);
}

function getEditableRuleCatalog(suerteId, scope = "tournament") {
  const baseSuerte = getRuleEditorBaseSuerte(suerteId, scope);
  const override = scope === "global"
    ? state.settings.globalRuleOverrides?.[suerteId]?.catalog || {}
    : getActiveTournament()?.ruleOverrides?.[suerteId]?.catalog || {};
  return Object.fromEntries(
    RULE_GROUPS.map((group) => [
      group.id,
      mergeEditableRules(baseSuerte?.catalog?.[group.id] || [], override[group.id], group.id)
    ])
  );
}

function getRuleEditorBaseSuerte(suerteId, scope = "tournament") {
  if (scope === "global") return SUERTES.find((suerte) => suerte.id === suerteId);
  return getTournamentSuertes(
    { type: "completo", ruleOverrides: {} },
    state.settings.globalRuleOverrides
  ).find((suerte) => suerte.id === suerteId) || SUERTES.find((suerte) => suerte.id === suerteId);
}

function mergeEditableRules(defaultRules, overrideRules, groupId) {
  if (Array.isArray(overrideRules)) {
    return overrideRules.map((rule) => normalizeEditableRule(rule, groupId));
  }

  return (defaultRules || []).map((rule) => normalizeEditableRule({ ...rule, enabled: true, custom: false }, groupId));
}

function normalizeEditableRule(rule, groupId) {
  return {
    id: String(rule.id || uid(`${groupId}_rule`)),
    label: String(rule.label || "").trim() || "Sin nombre",
    pts: groupId === "desc" ? 0 : Number(rule.pts || 0),
    enabled: rule.enabled !== false,
    custom: Boolean(rule.custom)
  };
}

function readRuleEditorCatalog(form) {
  if (!form) return null;
  const catalog = Object.fromEntries(RULE_GROUPS.map((group) => [group.id, []]));
  const isGlobalScope = form.dataset.scope === "global";

  form.querySelectorAll("[data-rule-row]").forEach((row) => {
    const groupId = row.dataset.group;
    if (!catalog[groupId]) catalog[groupId] = [];
    const label = row.querySelector('[data-field="label"]')?.value.trim() || "";
    const pts = Number(row.querySelector('[data-field="pts"]')?.value || 0);
    const enabled = Boolean(row.querySelector('[data-field="enabled"]')?.checked);
    if (!label) return;
    catalog[groupId].push({
      id: row.dataset.id || uid(`${groupId}_rule`),
      label,
      pts: groupId === "desc" ? 0 : Math.max(0, pts),
      enabled,
      custom: isGlobalScope ? false : row.dataset.custom === "1"
    });
  });

  return catalog;
}

function setRuleEditorCatalog(suerteId, catalog, scope = "tournament") {
  if (!suerteId || !catalog) return;
  const target = scope === "global" ? state.settings : getActiveTournament();
  if (!target) return;
  const key = scope === "global" ? "globalRuleOverrides" : "ruleOverrides";
  const updatedAt = new Date().toISOString();
  target[key] = target[key] || {};
  target[key][suerteId] = {
    updatedAt,
    catalog: Object.fromEntries(RULE_GROUPS.map((group) => [
      group.id,
      (catalog[group.id] || []).map((rule) => normalizeEditableRule(rule, group.id))
    ]))
  };
  if (scope === "global") target.globalRuleOverridesUpdatedAt = updatedAt;
}

function persistRuleEditorScope(scope = "tournament") {
  claimGoogleSyncControl();
  saveState();
  if (scope === "global") {
    void publishFirebaseGlobalRuleOverrides(
      state.settings.globalRuleOverrides,
      state.settings.globalRuleOverridesUpdatedAt
    );
  }
  scheduleFirebaseSync(100);
}

function saveTeam() {
  if (!guardUnlockedTournament("El torneo esta congelado; no se pueden modificar equipos.")) return;
  const form = document.getElementById("team-form");
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const id = form.dataset.id || uid("equipo");
  const existing = getTeam(id);

  if (isIndividualTournament()) {
    const participantName = String(data.get("participantName") || "").trim();
    const horseName = String(data.get("horseName") || "").trim();
    const payload = {
      id,
      tournamentId: state.activeTournamentId,
      name: buildIndividualEntryName(participantName, horseName),
      participantName,
      horseName,
      category: normalizeTeamCategory(data.get("category")),
      association: String(data.get("association") || "").trim(),
      captain: "",
      roster: makeIndividualRoster(participantName)
    };

    if (existing) Object.assign(existing, payload);
    else state.teams.push(payload);

    closeModal();
    saveState();
    scheduleFirebaseSync(100);
    render();
    return;
  }

  const roster = createRoster("");

  SUERTES.filter((suerte) => suerte.id !== "colas").forEach((suerte) => {
    roster[suerte.id] = data.get(`roster.${suerte.id}`)?.trim() || "";
  });
  roster.terna = [0, 1, 2].map((index) => data.get(`roster.terna.${index}`)?.trim() || "");
  roster.lazo = roster.terna[0] || roster.lazo || "";
  roster.pial_ruedo = roster.terna[1] || roster.pial_ruedo || "";
  roster.terna_auxiliar = roster.terna[2] || "";
  roster.colas = [0, 1, 2].map((index) => data.get(`roster.colas.${index}`)?.trim() || "");

	  const payload = {
	    id,
	    tournamentId: state.activeTournamentId,
	    name: data.get("name").trim(),
	    participantName: "",
	    horseName: "",
	    category: normalizeTeamCategory(data.get("category")),
    association: data.get("association").trim(),
    captain: data.get("captain").trim(),
    roster
  };

  if (existing) Object.assign(existing, payload);
  else state.teams.push(payload);

  closeModal();
  saveState();
  scheduleFirebaseSync(100);
  render();
}

function saveQuickTeams() {
  if (!guardUnlockedTournament("El torneo esta congelado; no se pueden agregar registros.")) return;
  const form = document.getElementById("quick-team-form");
  if (!form) return;

  const data = new FormData(form);
  const lines = String(data.get("teamNames") || "")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (!lines.length) {
    showToast(`Escribe al menos un ${getEntityLabels().singular}.`);
    return;
  }

  if (isIndividualTournament()) {
    saveQuickParticipants(form, data, lines);
    return;
  }

  const existingNames = new Set(
    getTournamentTeams()
      .map((team) => normalizeNameForCompare(team.name))
      .filter(Boolean)
  );
  const category = normalizeTeamCategory(data.get("category"));
  const association = String(data.get("association") || "").trim();
  let added = 0;
  let skipped = 0;

  lines.forEach((name) => {
    const key = normalizeNameForCompare(name);
    if (!key || existingNames.has(key)) {
      skipped += 1;
      return;
    }

    existingNames.add(key);
    state.teams.push({
      id: uid("equipo"),
      tournamentId: state.activeTournamentId,
      name,
      category,
      association,
      captain: "",
      roster: createBlankRoster()
    });
    added += 1;
  });

  if (!added) {
    showToast("No se agregaron equipos nuevos.");
    return;
  }

  form.reset();
  form.elements.category.value = category;
  form.elements.association.value = association;
  saveState();
  scheduleFirebaseSync(100);
  render();
  showToast(`${added} equipo${added === 1 ? "" : "s"} agregado${added === 1 ? "" : "s"}${skipped ? `, ${skipped} repetido${skipped === 1 ? "" : "s"}` : ""}.`);
}

function saveQuickParticipants(form, data, lines) {
  const existingKeys = new Set(
    getTournamentTeams()
      .map((team) => {
        const { participantName, horseName } = getParticipantHorseParts(team);
        return getIndividualEntryKey(participantName, horseName);
      })
      .filter((key) => key !== "__")
  );
  const category = normalizeTeamCategory(data.get("category"));
  const association = String(data.get("association") || "").trim();
  let added = 0;
  let skipped = 0;
  let incomplete = 0;

  lines.forEach((line) => {
    const { participantName, horseName } = parseParticipantLine(line);
    const key = getIndividualEntryKey(participantName, horseName);
    if (!participantName || !horseName) {
      incomplete += 1;
      return;
    }
    if (existingKeys.has(key)) {
      skipped += 1;
      return;
    }

    existingKeys.add(key);
    state.teams.push({
      id: uid("equipo"),
      tournamentId: state.activeTournamentId,
      name: buildIndividualEntryName(participantName, horseName),
      participantName,
      horseName,
      category,
      association,
      captain: "",
      roster: makeIndividualRoster(participantName)
    });
    added += 1;
  });

  if (!added) {
    showToast(incomplete ? "Usa el formato Participante / Caballo." : "No se agregaron participantes nuevos.");
    return;
  }

  form.reset();
  form.elements.category.value = category;
  form.elements.association.value = association;
  saveState();
  scheduleFirebaseSync(100);
  render();
  showToast(`${added} participante${added === 1 ? "" : "s"} agregado${added === 1 ? "" : "s"}${skipped ? `, ${skipped} repetido${skipped === 1 ? "" : "s"}` : ""}${incomplete ? `, ${incomplete} incompleto${incomplete === 1 ? "" : "s"}` : ""}.`);
}

function normalizeNameForCompare(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/\s+/g, " ");
}

function createBlankRoster() {
  const roster = createRoster("");
  SUERTES.filter((suerte) => suerte.id !== "colas").forEach((suerte) => {
    roster[suerte.id] = "";
  });
  roster.colas = ["", "", ""];
  roster.terna = ["", "", ""];
  roster.terna_auxiliar = "";
  return roster;
}

function getTernaRosterParts(roster = {}) {
  const terna = Array.isArray(roster.terna) ? roster.terna : [];
  return [
    terna[0] || roster.lazo || "",
    terna[1] || roster.pial_ruedo || "",
    terna[2] || roster.terna_auxiliar || ""
  ];
}

function getTeamCategory(team = {}) {
  return normalizeTeamCategory(team.category);
}

function normalizeTeamCategory(category) {
  const value = String(category || "").trim();
  return value || "Libre";
}

function deleteTeam(teamId) {
  if (!guardUnlockedTournament("El torneo esta congelado; no se pueden eliminar equipos.")) return;
  state.teams = state.teams.filter((team) => team.id !== teamId);
  state.charreadas.forEach((charreada) => {
    charreada.teamIds = charreada.teamIds.filter((id) => id !== teamId);
  });
  Object.keys(state.scores).forEach((key) => {
    if (key.includes(`__${teamId}__`)) delete state.scores[key];
  });
  removePublishedScoresFor({ teamId });
  closeModal();
  saveState();
  render();
}

function selectAllCharreadaTeams() {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  const rows = [...form.querySelectorAll(".team-order-row")];
  rows.forEach((row, index) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    const order = row.querySelector(".team-order-input");
    if (checkbox) checkbox.checked = true;
    if (order) order.value = index + 1;
  });
  refreshCharreadaTeamOrderRows({ compact: true });
}

function clearCharreadaTeams() {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  form.querySelectorAll('input[name="teamIds"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  refreshCharreadaTeamOrderRows();
}

function compactCharreadaTeamOrder() {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  refreshCharreadaTeamOrderRows({ compact: true });
}

function refreshCharreadaTeamOrderRows({ compact = false } = {}) {
  const form = document.getElementById("charreada-form");
  const list = form?.querySelector(".team-order-list");
  if (!form || !list) return;

  const rows = [...list.querySelectorAll(".team-order-row")];
  const selectedRows = rows.filter((row) => row.querySelector('input[name="teamIds"]')?.checked);
  const usedOrders = selectedRows
    .map((row) => Number(row.querySelector(".team-order-input")?.value || 0))
    .filter((value) => value > 0);
  let nextOrder = usedOrders.length ? Math.max(...usedOrders) + 1 : 1;

  selectedRows.forEach((row) => {
    const order = row.querySelector(".team-order-input");
    row.classList.add("selected");
    if (!order) return;
    order.disabled = false;
    if (!Number(order.value || 0)) {
      order.value = nextOrder;
      nextOrder += 1;
    }
  });

  rows
    .filter((row) => !row.querySelector('input[name="teamIds"]')?.checked)
    .forEach((row) => {
      const order = row.querySelector(".team-order-input");
      row.classList.remove("selected");
      if (order) {
        order.value = "";
        order.disabled = true;
      }
    });

  const sortedSelectedRows = selectedRows
    .slice()
    .sort((a, b) => Number(a.querySelector(".team-order-input")?.value || 0) - Number(b.querySelector(".team-order-input")?.value || 0));

  if (compact) {
    sortedSelectedRows.forEach((row, index) => {
      const order = row.querySelector(".team-order-input");
      if (order) order.value = index + 1;
    });
  }

  sortedSelectedRows
    .concat(rows.filter((row) => !row.querySelector('input[name="teamIds"]')?.checked))
    .forEach((row) => list.appendChild(row));

  const selectedCount = document.getElementById("charreada-selected-count");
  if (selectedCount) selectedCount.textContent = `${selectedRows.length} / ${rows.length}`;

  const filterInput = form.querySelector('[data-action="charreada-filter-teams"]');
  filterCharreadaTeamRows(filterInput?.value || "");
}

function filterCharreadaTeamRows(value) {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  const needle = normalizeNameForCompare(value);
  const rows = [...form.querySelectorAll(".team-order-row")];
  let visibleCount = 0;

  rows.forEach((row) => {
    const name = normalizeNameForCompare(row.dataset.teamName || "");
    const isVisible = !needle || name.includes(needle);
    row.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  const count = document.getElementById("charreada-search-count");
  if (count) count.textContent = needle ? `${visibleCount} encontrado${visibleCount === 1 ? "" : "s"}` : `${rows.length} visibles`;

  const empty = document.getElementById("charreada-filter-empty");
  if (empty) empty.hidden = visibleCount > 0;
}

function refreshCharreadaCompetitionSections() {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  const competition = getCompetitionType(form.querySelector('[name="competitionType"]')?.value || "equipos_completo");
  const individualMode = competition.scope === "individual";
  const teamSection = form.querySelector('[data-competition-section="team"]');
  const individualSection = form.querySelector('[data-competition-section="individual"]');

  if (teamSection) teamSection.hidden = individualMode;
  if (individualSection) individualSection.hidden = !individualMode;
  updateIndividualParticipantsWarning();
}

function addIndividualParticipantRow() {
  const form = document.getElementById("charreada-form");
  const list = form?.querySelector(".individual-participants-list");
  if (!form || !list) return;
  const nextOrder = list.querySelectorAll(".individual-participant-row").length + 1;
  list.insertAdjacentHTML("beforeend", renderIndividualParticipantRow({ id: uid("participante"), order: nextOrder }, nextOrder - 1));
  updateIndividualParticipantsWarning();
}

function removeIndividualParticipantRow(target) {
  const row = target.closest(".individual-participant-row");
  if (!row) return;
  row.remove();
  renumberIndividualParticipants();
  updateIndividualParticipantsWarning();
}

function renumberIndividualParticipants() {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  [...form.querySelectorAll(".individual-participant-row")].forEach((row, index) => {
    const order = row.querySelector('[name="individualParticipantOrder"]');
    if (order) order.value = index + 1;
  });
  updateIndividualParticipantsWarning();
}

function updateIndividualParticipantsWarning() {
  const form = document.getElementById("charreada-form");
  if (!form) return;
  const warning = form.querySelector("[data-individual-participants-warning]");
  const rows = form.querySelectorAll(".individual-participant-row");
  if (warning) warning.hidden = rows.length > 0;
}

function saveCharreada() {
  if (!guardUnlockedTournament("El torneo esta congelado; no se puede modificar el programa.")) return;
  const form = document.getElementById("charreada-form");
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const teamIds = getOrderedCharreadaTeamIds(data);
  const competitionFields = buildCharreadaCompetitionFields(data.get("competitionType"));
  const individualMode = competitionFields.competitionScope === "individual";
  const individualParticipants = getIndividualParticipantsFromCharreadaForm(form);

  if (!individualMode && !teamIds.length) {
    showToast(`Selecciona al menos un ${getEntityLabels().singular}.`);
    return;
  }

  if (individualMode && !individualParticipants.length) {
    showToast("Esta competencia requiere participantes individuales antes de poder calificarse.");
  }

  const existingId = form.dataset.id || "";
  const existing = existingId ? state.charreadas.find((item) => item.id === existingId) : null;
  if (existing && !guardUnlockedCharreada(existing, "Esta charreada esta congelada; no se puede modificar.")) return;
  const id = existing?.id || uid("charreada");
  const wasActive = state.activeCharreadaId === id;
  const phase = normalizeCharreadaPhaseInput(data.get("phase"), data.get("phaseOther"));
  const payload = {
    id,
    tournamentId: state.activeTournamentId,
    name: data.get("name").trim(),
    date: data.get("date"),
    startTime: data.get("startTime"),
    status: data.get("status"),
    phase,
    ...competitionFields,
    venue: String(data.get("venue") || "").trim(),
    announcer: String(data.get("announcer") || "").trim(),
    judges: String(data.get("judges") || "").trim(),
    productionLead: String(data.get("productionLead") || "").trim(),
    realStartTime: String(data.get("realStartTime") || "").trim(),
    realEndTime: String(data.get("realEndTime") || "").trim(),
    operationalStatus: String(data.get("operationalStatus") || "").trim(),
    internalNotes: String(data.get("internalNotes") || "").trim(),
    teamIds: individualMode ? [] : teamIds,
    individualParticipants: individualMode ? individualParticipants : []
  };
  console.info("[program-fase-001] phase saved", { charreadaId: id, phase: phase || "Sin fase" });
  console.info("[program-003] competition saved", {
    charreadaId: id,
    competitionType: payload.competitionType,
    competitionScope: payload.competitionScope,
    suerteIds: payload.suerteIds,
    individualParticipants: payload.individualParticipants.length
  });

  if (existing) {
    const existingTeamIds = Array.isArray(existing.teamIds) ? existing.teamIds : [];
    const removedTeamIds = existingTeamIds.filter((teamId) => !payload.teamIds.includes(teamId));
    removedTeamIds.forEach((teamId) => deleteScoresForCharreadaTeam(existing.id, teamId));
    Object.assign(existing, payload);
  } else {
    state.charreadas.push(payload);
  }

  if (!existing || wasActive || payload.status === "en_vivo") {
    setCanonicalActiveCharreada(id, { source: "save-charreada" });
    resetScoringPointer();
  }
  ensureScoresForCharreada(id);
  closeModal();
  saveState();
  if (state.activeCharreadaId === id) syncCurrentLiveState({ repeat: true });
  render();
}

function getOrderedCharreadaTeamIds(data) {
  const selected = data.getAll("teamIds");
  return selected
    .map((teamId, index) => ({
      teamId,
      order: Number(data.get(`teamOrder.${teamId}`) || index + 1),
      index
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.index - b.index;
    })
    .map((item) => item.teamId);
}

function getIndividualParticipantsFromCharreadaForm(form) {
  if (!form) return [];
  const rows = [...form.querySelectorAll(".individual-participant-row")];
  const participants = rows
    .map((row, index) => {
      const id = row.querySelector('[name="individualParticipantId"]')?.value || uid("participante");
      const name = row.querySelector('[name="individualParticipantName"]')?.value || "";
      const association = row.querySelector('[name="individualParticipantAssociation"]')?.value || "";
      const category = row.querySelector('[name="individualParticipantCategory"]')?.value || "";
      const horseName = row.querySelector('[name="individualParticipantHorseName"]')?.value || "";
      const order = row.querySelector('[name="individualParticipantOrder"]')?.value || index + 1;
      return {
        id: String(id).trim() || uid("participante"),
        name: String(name).trim(),
        association: String(association).trim(),
        category: String(category).trim(),
        horseName: String(horseName).trim(),
        order: normalizeParticipantOrder(order, index)
      };
    })
    .filter((participant) => (
      participant.name ||
      participant.association ||
      participant.category ||
      participant.horseName
    ));

  return normalizeIndividualParticipants(participants);
}

function confirmDeleteCharreada(charreadaId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!charreada) return;
  if (!guardUnlockedCharreada(charreada, "Esta charreada esta congelada; no se puede eliminar.")) return;

  showModal({
    title: "Eliminar charreada",
    body: html`<p>Se eliminara <strong>${escapeHTML(charreada.name)}</strong> y sus calificaciones. Esta accion no afecta otras charreadas.</p>`,
    actions: html`
      <button class="button" data-action="close-modal">Cancelar</button>
      <button class="button red" data-action="confirm-delete-charreada" data-id="${charreada.id}">Eliminar</button>
    `
  });
}

function deleteCharreada(charreadaId) {
  const deleted = state.charreadas.find((item) => item.id === charreadaId);
  if (!deleted) return;
  if (!guardUnlockedCharreada(deleted, "Esta charreada esta congelada; no se puede eliminar.")) return;

  state.charreadas = state.charreadas.filter((charreada) => charreada.id !== charreadaId);
  Object.keys(state.scores).forEach((key) => {
    if (key.startsWith(`${charreadaId}__`)) delete state.scores[key];
  });
  removePublishedScoresFor({ charreadaId });

  if (state.activeCharreadaId === charreadaId) {
    const nextCharreada = state.charreadas.find((item) => item.tournamentId === deleted.tournamentId);
    if (nextCharreada) setCanonicalActiveCharreada(nextCharreada.id, { source: "delete-charreada" });
    else state.activeCharreadaId = null;
    resetScoringPointer();
  }

  closeModal();
  saveState();
  syncCurrentLiveState({ repeat: true });
  render();
}

function deleteScoresForCharreadaTeam(charreadaId, teamId) {
  Object.keys(state.scores).forEach((key) => {
    if (key.startsWith(`${charreadaId}__${teamId}__`)) delete state.scores[key];
  });
  removePublishedScoresFor({ charreadaId, teamId });
}

function activateCharreada(charreadaId, options = {}) {
  if (!charreadaId) return;
  const targetCharreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!targetCharreada) return;
  if (options.scoring && !guardUnlockedCharreada(targetCharreada)) return;
  if (options.scoring && isSupervisorAccess()) enterSupervisorScoringReviewMode();
  const activation = setCanonicalActiveCharreada(charreadaId, { source: options.scoring ? "scoring" : "manual" });
  const previousCharreadaId = activation.previousId;
  if (previousCharreadaId !== charreadaId) state.lastPublishedScore = null;
  ensureScoresForCharreada(charreadaId);
  resetScoringPointer();
  stopTimer(true);
  if (options.scoring) state.view = "scoring";
  claimGoogleSyncControl();
  saveState();
  if (isSupervisorAccess() && !options.scoring) {
    console.info("[event-test] supervisor activo charreada", {
      tournamentId: targetCharreada?.tournamentId || state.activeTournamentId || "",
      charreadaId
    });
  }
  syncCurrentLiveState({ repeat: true });
  render();
}

function startScoring(charreadaId = null) {
  if (firebaseAccess.role === ROLES.JUEZ) {
    const tournament = getActiveTournament();
    const activeResolution = resolveActiveScoringCharreada(getTournamentCharreadas(tournament?.id), tournament);
    const requestedCharreadaId = String(charreadaId || activeResolution.id || "").trim();
    if (!activeResolution.id || requestedCharreadaId !== activeResolution.id) {
      console.info("[active-charreada] source:", {
        tournamentId: tournament?.id || state.activeTournamentId || "",
        requestedCharreadaId,
        activeCharreadaId: activeResolution.id || "",
        source: activeResolution.source || "none"
      });
      showToast("Solo puedes calificar la charreada activa.");
      return;
    }
    charreadaId = activeResolution.id;
  }
  if (!charreadaId && firebaseAccess.role === ROLES.JUEZ) {
    const tournament = getActiveTournament();
    const resolution = resolveActiveScoringCharreada(getTournamentCharreadas(tournament?.id), tournament);
    logJudgeContextResolution(tournament?.id || state.activeTournamentId, resolution);
    charreadaId = resolution.id || "";
  }
  if (firebaseAccess.role === ROLES.JUEZ) {
    console.info("[judge-context] entrando a charreada:", charreadaId || "");
    console.info("[event-test] juez entro a charreada", {
      tournamentId: getActiveTournament()?.id || state.activeTournamentId || "",
      charreadaId: charreadaId || state.activeCharreadaId || ""
    });
  }

  if (charreadaId && charreadaId !== state.activeCharreadaId) {
    activateCharreada(charreadaId, { scoring: true });
    return;
  }

  const charreada = getActiveCharreada();
  if (!charreada) {
    showToast("Primero crea o activa una charreada.");
    return;
  }
  if (!guardUnlockedCharreada(charreada)) return;
  if (isSupervisorAccess()) enterSupervisorScoringReviewMode();
  ensureScoresForCharreada(charreada.id);
  resetScoringPointer();
  state.view = "scoring";
  claimGoogleSyncControl();
  saveState();
  syncCurrentLiveState();
  render();
}

function adjustPunta(field, delta) {
  if (!guardUnlockedCharreada()) return;
  const attempt = getCurrentContext()?.attempt;
  if (!attempt || attempt.desc) return;

  const current = Number(attempt[field] || 0);
  writePuntaField(attempt, field, current + delta);
  persistScoreChange();
}

function setPuntaValue(field, value) {
  if (!guardUnlockedCharreada()) return;
  const attempt = getCurrentContext()?.attempt;
  if (!attempt || attempt.desc) return;

  writePuntaField(attempt, field, value);
  persistScoreChange();
}

function writePuntaField(attempt, field, value) {
  if (field === "puntaPiquetes") {
    attempt.puntaPiquetes = Math.max(1, Math.min(4, Number(value) || 1));
  } else {
    attempt[field] = Math.max(0, Number(value) || 0);
  }
  applyPuntaCalculation(attempt);
}

function toggleRule(type, ruleId) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt || context.attempt.desc) return;

  const rule = context.suerte.catalog[type].find((item) => item.id === ruleId);
  if (!rule) return;

  context.attempt.applied = context.attempt.applied || [];

  if (type === "base") {
    const baseIds = context.suerte.catalog.base.map((item) => item.id);
    const wasActive = context.attempt.applied.includes(ruleId);
    context.attempt.applied = context.attempt.applied.filter((id) => !baseIds.includes(id));
    context.attempt.base = 0;
    context.attempt.initializedBase = false;

    if (!wasActive) {
      context.attempt.applied.push(ruleId);
      context.attempt.base = rule.pts;
      context.attempt.initializedBase = true;
    }
  } else {
    const active = context.attempt.applied.includes(ruleId);
    if (active) {
      context.attempt.applied = context.attempt.applied.filter((id) => id !== ruleId);
      context.attempt[type] = Math.max(0, Number(context.attempt[type] || 0) - rule.pts);
    } else {
      context.attempt.applied.push(ruleId);
      context.attempt[type] = Number(context.attempt[type] || 0) + rule.pts;
    }
  }

  persistScoreChange();
}

function toggleTeamPenalty(ruleId) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;

  const rule = getTeamPenaltyRulesForSuerte(context.suerte).find((item) => item.id === ruleId);
  if (!rule) return;

  context.attempt.teamPenalties = Array.isArray(context.attempt.teamPenalties)
    ? context.attempt.teamPenalties
    : [];
  const active = context.attempt.teamPenalties.some((item) => item.id === rule.id);
  context.attempt.teamPenalties = active
    ? context.attempt.teamPenalties.filter((item) => item.id !== rule.id)
    : [...context.attempt.teamPenalties, normalizeTeamPenalty(rule)];

  persistScoreChange();
}

function addTeamPenalty() {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;

  const labelInput = document.getElementById("team-penalty-label");
  const ptsInput = document.getElementById("team-penalty-pts");
  const label = labelInput?.value.trim() || "";
  const pts = Number(ptsInput?.value || 0);
  if (!label || !pts || pts < 1) {
    showToast("Agrega concepto y puntos de la infraccion al equipo.");
    return;
  }

  context.attempt.teamPenalties = Array.isArray(context.attempt.teamPenalties)
    ? context.attempt.teamPenalties
    : [];
  context.attempt.teamPenalties.push(normalizeTeamPenalty({
    id: uid("equipo_infraccion"),
    label,
    pts
  }));
  persistScoreChange();
}

function removeTeamPenalty(id) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;
  context.attempt.teamPenalties = (context.attempt.teamPenalties || []).filter((item) => item.id !== id);
  persistScoreChange();
}

function toggleAttemptZero() {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt || hasAttemptScoreValue(context.attempt)) return;
  context.attempt.attempted = !context.attempt.attempted;
  context.attempt.notAchieved = Boolean(context.attempt.attempted);
  persistScoreChange();
}

function markAttemptZeroIfBlank(attempt = {}) {
  if (hasAttemptScoreValue(attempt)) return;
  attempt.attempted = true;
  attempt.notAchieved = true;
}

function buildPublishedScoreSnapshot(context) {
  const attempt = cloneAttempt(context.attempt || emptyAttempt());
  if (Array.isArray(attempt.timeEvidence) && attempt.timeEvidence.length) {
    console.info("[calificador-001] time evidence saved", {
      count: attempt.timeEvidence.length,
      teamId: context.team?.id || "",
      suerteId: context.suerte?.id || "",
      attemptIndex: context.attemptIndex || 0
    });
  }
  return {
    id: uid("publicado"),
    publishedAt: new Date().toISOString(),
    publishedBy: getPublishedBy(),
    tournament: compactPublishedTournament(context.tournament),
    charreada: compactPublishedCharreada(context.charreada),
    team: compactPublishedTeam(context.team),
    competition: context.competitionContext || null,
    suerte: compactPublishedSuerte(context.suerte),
    attemptIndex: context.attemptIndex || 0,
    coleadorIndex: context.coleadorIndex || 0,
    charro: getPublishedCharroName(context),
    attempt,
    total: calculateAttemptTotal(attempt),
    breakdown: buildPublishedBreakdown(context, attempt)
  };
}

function getPublishedBy() {
  if (isActiveAccessSession(firebaseAccess)) {
    return {
      id: firebaseAccess.uid || "",
      name: firebaseAccess.name || firebaseAccess.email || "",
      role: getRoleLabel(firebaseAccess.role),
      contact: firebaseAccess.email || ""
    };
  }
  return {
    id: "app-maestra",
    name: "App maestra",
    role: "Captura",
    contact: ""
  };
}

function compactPublishedTournament(tournament) {
  if (!tournament) return null;
  return {
    id: tournament.id || "",
    name: tournament.name || "",
    season: getTournamentSeason(tournament),
    type: tournament.type || "completo",
    date: tournament.date || "",
    venue: tournament.venue || ""
  };
}

function compactPublishedCharreada(charreada) {
  if (!charreada) return null;
  return {
    id: charreada.id || "",
    tournamentId: charreada.tournamentId || "",
    name: charreada.name || "",
    date: charreada.date || "",
    startTime: charreada.startTime || "",
    phase: getCharreadaPhase(charreada),
    competitionType: charreada.competitionType || "",
    competitionScope: charreada.competitionScope || "",
    competitionId: charreada.competitionId || charreada.competitionType || "",
    suerteIds: Array.isArray(charreada.suerteIds) ? charreada.suerteIds : [],
    teamIds: charreada.teamIds || []
  };
}

function compactPublishedTeam(team) {
  if (!team) return null;
  return {
    id: team.id || "",
    name: team.name || "",
    participantName: team.participantName || "",
    horseName: team.horseName || "",
    category: team.category || "Libre",
    association: team.association || ""
  };
}

function compactPublishedSuerte(suerte) {
  if (!suerte) return null;
  return {
    id: suerte.id || "",
    name: suerte.name || "",
    fullName: suerte.fullName || suerte.name || "",
    type: suerte.type || "",
    attempts: Number(suerte.attempts || 1)
  };
}

function cloneAttempt(attempt) {
  return JSON.parse(JSON.stringify(attempt || emptyAttempt()));
}

function getPublishedCharroName(context) {
  if (context.team?.participantName) return context.team.participantName;
  if (context.suerte?.type === "coleadero") {
    return context.team?.roster?.colas?.[context.coleadorIndex] || `Coleador ${Number(context.coleadorIndex || 0) + 1}`;
  }
  return getRosterNameForSuerte(context.team, context.suerte) || context.team?.name || "";
}

function buildPublishedBreakdown(context, attempt) {
  const punta = context.suerte?.id === "cala" ? calculatePuntaBreakdown(attempt) : null;
  const teamPenalties = (attempt.teamPenalties || []).map(normalizeTeamPenalty);
  return {
    rulebook: context.suerte?.id === "cala"
      ? { discipline: "cala", version: CALA_RULEBOOK_VERSION }
      : null,
    base: Number(attempt.base || 0),
    adic: Number(attempt.adic || 0),
    infr: Number(attempt.infr || 0),
    puntaPts: Number(attempt.puntaPts || 0),
    puntaMetros: Number(attempt.puntaMetros || 0),
    puntaPiquetes: Number(attempt.puntaPiquetes || 1),
    punta,
    individualTotal: calculateAttemptTotal(attempt),
    teamPenaltyTotal: teamPenalties.reduce((sum, item) => sum + Number(item.total || 0), 0),
    total: calculateAttemptTotal(attempt),
    teamAdjustedTotal: calculateAttemptTotal(attempt) - teamPenalties.reduce((sum, item) => sum + Number(item.total || 0), 0),
    attempted: Boolean(attempt.attempted),
    notAchieved: Boolean(attempt.notAchieved),
    desc: attempt.desc || null,
    adicGroups: context.suerte?.id === "cala" ? buildPublishedCalaAdicGroups(context.suerte, attempt) : [],
    extraAdicItems: context.suerte?.id === "cala" ? buildPublishedCalaExtraAdicItems(context.suerte, attempt) : [],
    infrItems: buildPublishedRuleItems(context.suerte?.catalog?.infr || [], attempt, "infr"),
    teamPenalties,
    customAdic: (attempt.customAdic || []).map((item) => ({
      id: item.id || "",
      label: item.label || "Manual",
      abbr: abbreviateScoreLabel(item.label),
      pts: Number(item.pts || 0)
    })),
    customInfr: (attempt.customInfr || []).map((item) => ({
      id: item.id || "",
      label: item.label || "Manual",
      abbr: abbreviateScoreLabel(item.label),
      pts: Number(item.pts || 0)
    }))
  };
}

function buildPublishedCalaAdicGroups(suerte, attempt) {
  const catalog = suerte?.catalog?.adic || [];
  return CALA_ADIC_SECTIONS.map((group) => {
    const items = buildPublishedRuleItems(
      catalog.filter((rule) => group.ids.includes(rule.id)),
      attempt,
      "adic",
      { includeCustom: false }
    );
    return {
      code: group.code,
      label: group.label,
      total: items.reduce((sum, item) => sum + Number(item.pts || 0), 0),
      items
    };
  });
}

function buildPublishedCalaExtraAdicItems(suerte, attempt) {
  const fixedIds = new Set(CALA_ADIC_SECTIONS.flatMap((group) => group.ids));
  return buildPublishedRuleItems(
    (suerte?.catalog?.adic || []).filter((rule) => !fixedIds.has(rule.id)),
    attempt,
    "adic"
  );
}

function buildPublishedRuleItems(rules, attempt, type, options = {}) {
  const applied = new Set(attempt.applied || []);
  const catalogItems = (rules || [])
    .filter((rule) => applied.has(rule.id))
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      abbr: abbreviateScoreLabel(rule.label),
      pts: Number(rule.pts || 0)
    }));

  if (options.includeCustom === false) return catalogItems;

  const customKey = type === "infr" ? "customInfr" : "customAdic";
  return catalogItems.concat((attempt[customKey] || []).map((item) => ({
    id: item.id || "",
    label: item.label || "Manual",
    abbr: abbreviateScoreLabel(item.label),
    pts: Number(item.pts || 0)
  })));
}

function abbreviateScoreLabel(label) {
  const clean = String(label || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[-+]\d+/g, "")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return "M";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
}

function toggleDesc(label) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;

  if (context.attempt.desc === label) {
    clearDesc(context.attempt);
  } else {
    applyDescReason(context, label);
  }

  persistScoreChange();
}

function setDescReason(label) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;

  if (!label) clearDesc(context.attempt);
  else applyDescReason(context, label);

  persistScoreChange();
}

function applyDescReason(context, label) {
  const infrIds = context.suerte.catalog.infr.map((item) => item.id);
  context.attempt.desc = label;
  context.attempt.base = 0;
  context.attempt.adic = 0;
  context.attempt.puntaPts = 0;
  context.attempt.puntaMetros = 0;
  context.attempt.puntaPiquetes = 1;
  context.attempt.customAdic = [];
  context.attempt.applied = (context.attempt.applied || []).filter((id) => infrIds.includes(id));
  context.attempt.initializedBase = false;
}

function clearDesc(attempt) {
  attempt.desc = null;
  attempt.initializedBase = false;
}

function addCustomScore(type) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt || context.attempt.desc) return;

  const labelInput = document.getElementById(`custom-${type}-label`);
  const ptsInput = document.getElementById(`custom-${type}-pts`);
  const label = labelInput.value.trim();
  const pts = Number(ptsInput.value);

  if (!label || !pts || pts < 1) {
    showToast("Agrega concepto y puntos.");
    return;
  }

  const key = type === "adic" ? "customAdic" : "customInfr";
  context.attempt[key] = context.attempt[key] || [];
  context.attempt[key].push({ id: uid("manual"), label, pts });
  context.attempt[type] = Number(context.attempt[type] || 0) + pts;
  persistScoreChange();
}

function removeCustomScore(type, id) {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;

  const key = type === "adic" ? "customAdic" : "customInfr";
  const item = (context.attempt[key] || []).find((entry) => entry.id === id);
  if (!item) return;

  context.attempt[key] = context.attempt[key].filter((entry) => entry.id !== id);
  context.attempt[type] = Math.max(0, Number(context.attempt[type] || 0) - Number(item.pts || 0));
  persistScoreChange();
}

function resetAttempt() {
  if (!guardUnlockedCharreada()) return;
  const context = getCurrentContext();
  if (!context?.attempt) return;
  Object.assign(context.attempt, emptyAttempt());
  context.attempt.timeEvidence = [];
  persistScoreChange();
}

function getScoreNodeMissingFields(context) {
  const missing = [];
  if (!context?.tournament?.id) missing.push("tournamentId");
  if (!context?.charreada?.id) missing.push("charreadaId");
  if (!context?.team?.id) missing.push("teamId");
  if (!context?.suerte?.id) missing.push("suerte");
  return missing;
}

function getScoreNodeForContext(context) {
  const missing = getScoreNodeMissingFields(context);
  if (missing.length) return { ok: false, missing };
  const id = scoreKey(context.charreada.id, context.team.id, context.suerte.id);
  if (!id) return { ok: false, missing: ["scoreId"] };
  return {
    ok: true,
    id,
    tournamentId: context.tournament.id,
    charreadaId: context.charreada.id,
    teamId: context.team.id,
    suerteId: context.suerte.id,
    payload: cloneScorePayload(state.scores[id] || [])
  };
}

function markActiveScoringDraft(context = getCurrentContext()) {
  const scoreNode = getScoreNodeForContext(context);
  if (!scoreNode?.ok) return;
  isScoringDirty = true;
  activeScoringDraft = {
    id: scoreNode.id,
    tournamentId: scoreNode.tournamentId,
    payload: cloneScorePayload(scoreNode.payload),
    updatedAtMs: Date.now()
  };
}

function releaseActiveScoringDraft(scoreId = "") {
  if (scoreId && activeScoringDraft?.id && activeScoringDraft.id !== scoreId) return;
  isScoringDirty = false;
  activeScoringDraft = null;
  console.info("[scoring] score guardado; draft liberado", { scoreId });
}

async function publishCurrentScoreNode(context) {
  const scoreNode = getScoreNodeForContext(context);
  if (!scoreNode?.ok) {
    const missing = scoreNode?.missing || ["score"];
    setLastFirebaseError("missing-score-data", missing.join(", "));
    setScoreSaveStatus({
      state: "error",
      label: "Error al guardar",
      detail: "Faltan datos del score.",
      savedAtMs: 0,
      scoreId: ""
    });
    logJudgeScore("error al guardar", { reason: "missing-score-data", missing });
    showToast("No se pudo guardar: faltan datos del score.");
    return { ok: false, reason: "missing-score-data", missing };
  }

  const actor = getAccessActor();
  const path = `charropro/tournaments/${scoreNode.tournamentId}/scores/${scoreNode.id}`;
  logJudgeScore(`tournamentId: ${scoreNode.tournamentId}`);
  logJudgeScore(`scoreId generado: ${scoreNode.id}`);
  logJudgeScore("payload:", scoreNode.payload);
  logJudgeScore("actor:", actor);
  logJudgeScore(`escribiendo ruta: ${path}`);

  setScoreSaveStatus({
    state: "saving",
    label: "Guardando en CharroPro",
    detail: `Score ${scoreNode.id}`,
    scoreId: scoreNode.id
  });

  const result = await publishFirebaseScore(scoreNode.tournamentId, scoreNode.id, scoreNode.payload, actor);
  if (!result.ok) {
    setLastFirebaseError(result.reason || "score-save-failed", result.detail?.error?.message || result.detail?.message || "");
    setScoreSaveStatus({
      state: "error",
      label: "Error al guardar",
      detail: result.reason || "No se pudo guardar.",
      savedAtMs: 0,
      scoreId: scoreNode.id
    });
    logJudgeScore("error al guardar", result);
    if (isPermissionFailure(result)) showToast("No se pudo guardar la calificación en CharroPro por permisos.");
    else showToast("No se pudo guardar la calificacion. Tus datos siguen en pantalla.");
    return result;
  }

  const savedAtMs = Date.now();
  setScoreSaveStatus({
    state: "saved",
    label: "Guardado en CharroPro",
    detail: `Guardado ${formatScoreSaveTime(savedAtMs)}`,
    savedAtMs,
    scoreId: scoreNode.id
  });
  logJudgeScore("guardado exitoso", { path: result.path || path });
  if (isSupervisorAccess()) console.info("[score][supervisor] guardado exitoso", { path: result.path || path });
  return result;
}

function updatePublishedScoreDiagnostics(tournamentId, publishedScore, result = {}) {
  const remoteCounts = firebaseDiagnostics.remoteCounts || {};
  const localCounts = getLocalTournamentDiagnostics(tournamentId);
  firebaseDiagnostics.remoteCounts = {
    ...remoteCounts,
    [tournamentId]: {
      ...(remoteCounts[tournamentId] || {}),
      publishedScores: Math.max(
        Number(remoteCounts[tournamentId]?.publishedScores || 0),
        Number(localCounts.publishedScores || 0)
      )
    }
  };
  firebaseDiagnostics.lastPublishedScore = {
    tournamentId,
    id: publishedScore?.id || result.id || "",
    path: result.path || "",
    auditPath: result.auditPath || "",
    total: Number(publishedScore?.total || 0),
    publishedAt: publishedScore?.publishedAt || "",
    updatedAtMs: Date.now()
  };
  firebaseDiagnostics.lastPublishedScoreError = "";
  saveFirebaseDiagnostics();
}

function updatePublishedScoreErrorDiagnostics(tournamentId, result = {}) {
  firebaseDiagnostics.lastPublishedScoreError = result.reason || result.detail?.error?.message || "published-score-error";
  firebaseDiagnostics.lastPublishedScore = {
    ...(firebaseDiagnostics.lastPublishedScore || {}),
    tournamentId,
    errorAtMs: Date.now()
  };
  saveFirebaseDiagnostics();
}

async function validateActiveCharreadaBeforePublish(tournamentId, scoreCharreadaId) {
  const cleanTournamentId = String(tournamentId || "").trim();
  const cleanScoreCharreadaId = String(scoreCharreadaId || "").trim();
  console.info("[publish-guard-c003] validando charreada activa", {
    tournamentId: cleanTournamentId,
    scoreCharreadaId: cleanScoreCharreadaId
  });

  if (!cleanTournamentId || !cleanScoreCharreadaId) {
    console.warn("[publish-guard-c003] bloqueado por score sin charreada valida", {
      tournamentId: cleanTournamentId,
      scoreCharreadaId: cleanScoreCharreadaId
    });
    return { ok: false, reason: "invalid-score-charreada", activeCharreadaId: "" };
  }

  const remote = await readFirebaseActiveCharreadaSnapshot(cleanTournamentId);
  console.info("[publish-guard-c003] respuesta remota", {
    tournamentId: cleanTournamentId,
    scoreCharreadaId: cleanScoreCharreadaId,
    activeCharreadaId: remote.activeCharreadaId || "",
    source: remote.source || "",
    reason: remote.reason || ""
  });

  if (!remote.ok) {
    console.warn("[publish-guard-c003] publicacion bloqueada", remote);
    return {
      ...remote,
      ok: false,
      scoreCharreadaId: cleanScoreCharreadaId
    };
  }

  if (String(remote.activeCharreadaId || "") !== cleanScoreCharreadaId) {
    console.warn("[publish-guard-c003] charreada activa cambio", {
      tournamentId: cleanTournamentId,
      scoreCharreadaId: cleanScoreCharreadaId,
      activeCharreadaId: remote.activeCharreadaId || ""
    });
    return {
      ok: false,
      reason: "active-charreada-changed",
      scoreCharreadaId: cleanScoreCharreadaId,
      activeCharreadaId: remote.activeCharreadaId || ""
    };
  }

  console.info("[publish-guard-c003] validacion ok", {
    tournamentId: cleanTournamentId,
    scoreCharreadaId: cleanScoreCharreadaId,
    activeCharreadaId: remote.activeCharreadaId || ""
  });
  return {
    ok: true,
    activeCharreadaId: remote.activeCharreadaId || "",
    source: remote.source || ""
  };
}

function getPublishGuardMessage(result = {}) {
  if (result.reason === "invalid-score-charreada") return "La calificación no tiene una charreada válida.";
  if (result.reason === "active-charreada-changed") return "La charreada activa cambió. Revisa antes de publicar.";
  if (result.reason === "multiple-active-charreadas") return "Hay más de una charreada activa. Revisa con supervisor antes de publicar.";
  return "No se pudo validar la charreada activa. Intenta sincronizar antes de publicar.";
}

async function publishOfficialScoreForContext(context) {
  const scoreNode = getScoreNodeForContext(context);
  if (!scoreNode?.ok) {
    const missing = scoreNode?.missing || ["score"];
    setLastFirebaseError("missing-score-data", missing.join(", "));
    setScoreSaveStatus({
      state: "error",
      label: "Error al guardar",
      detail: "Faltan datos del score.",
      savedAtMs: 0,
      scoreId: ""
    });
    logJudgeScore("error al guardar", { reason: "missing-score-data", missing });
    showToast("No se pudo guardar: faltan datos del score.");
    return { ok: false, reason: "missing-score-data", missing };
  }

  const guard = await validateActiveCharreadaBeforePublish(scoreNode.tournamentId, scoreNode.charreadaId);
  if (!guard.ok) {
    const message = getPublishGuardMessage(guard);
    setLastFirebaseError(guard.reason || "active-charreada-validation-failed", message);
    setScoreSaveStatus({
      state: "error",
      label: "Publicación bloqueada",
      detail: message,
      savedAtMs: 0,
      scoreId: scoreNode.id
    });
    showToast(message);
    return guard;
  }

  const actor = getAccessActor();
  const previousPublishedScores = cloneJson(state.publishedScores || []);
  const previousLastPublishedScore = cloneJson(state.lastPublishedScore || null);
  const published = recordPublishedScore(buildPublishedScoreSnapshot(context));
  if (!published) {
    setLastFirebaseError("missing-published-score", "No se pudo preparar la publicación oficial.");
    setScoreSaveStatus({
      state: "error",
      label: "Error al publicar",
      detail: "No se pudo preparar la publicación oficial.",
      savedAtMs: 0,
      scoreId: scoreNode.id
    });
    showToast("No se pudo publicar la calificación oficial.");
    return { ok: false, reason: "missing-published-score" };
  }

  console.info("[publish-atomic-c003] publicando score oficial", {
    tournamentId: scoreNode.tournamentId,
    scoreId: scoreNode.id,
    publishedScoreId: published.id || ""
  });

  const result = await publishFirebaseOfficialScoreAtomic(scoreNode.tournamentId, scoreNode.id, scoreNode.payload, published, actor, {
    livePayload: buildLivePayload({ includeOfficial: false })
  });

  if (!result.ok) {
    state.publishedScores = previousPublishedScores || [];
    state.lastPublishedScore = previousLastPublishedScore || null;
    setLastFirebaseError(result.reason || "official-publish-failed", result.detail?.error?.message || result.detail?.message || "");
    updatePublishedScoreErrorDiagnostics(scoreNode.tournamentId, result);
    setScoreSaveStatus({
      state: "error",
      label: "Error al publicar",
      detail: result.reason || "No se pudo publicar.",
      savedAtMs: 0,
      scoreId: scoreNode.id
    });
    console.error("[publish-atomic-c003] publicacion oficial fallida", result);
    if (isPermissionFailure(result)) showToast("Firebase rechazó la publicación oficial por permisos.");
    else showToast("No se pudo publicar la calificación oficial en CharroPro.");
    saveState({ silent: true });
    return result;
  }

  const savedAtMs = Date.now();
  setScoreSaveStatus({
    state: "saved",
    label: "Guardado en CharroPro",
    detail: `Guardado ${formatScoreSaveTime(savedAtMs)}`,
    savedAtMs,
    scoreId: scoreNode.id
  });
  updatePublishedScoreDiagnostics(scoreNode.tournamentId, published, result);
  logJudgeScore("publicacion oficial exitosa", {
    scorePath: result.scorePath || "",
    publishedPath: result.publishedPath || result.path || "",
    auditPath: result.auditPath || ""
  });
  return { ...result, published, scoreId: scoreNode.id };
}

function continueOfficialScoreFlowAfterPublish() {
  suppressNextSharedAppStatePublish = true;
  stopTimer(true);
  advanceScoringPointer();
  syncCurrentLiveState({ repeat: true });
  officialPublishInProgress = false;
  render();
}

function isColasContext(context = {}) {
  return context?.suerte?.id === "colas" || context?.suerte?.type === "coleadero";
}

function getColeadorCountForContext(context = {}, collection = null) {
  if (context?.tournament?.type === "coleadero") return 1;
  return Math.max(3, Array.isArray(collection) ? collection.length : 0);
}

function isCompletingColasForTeam(context = {}) {
  if (!isColasContext(context)) return false;
  const collection = getScoreCollectionForContext(context);
  const coleadorCount = getColeadorCountForContext(context, collection);
  const attempts = Math.max(1, Number(context.suerte?.attempts || 1));
  return Number(context.coleadorIndex || 0) >= coleadorCount - 1
    && Number(context.attemptIndex || 0) >= attempts - 1;
}

function readColeadorNameFromAttempt(attempt = {}) {
  const fields = [
    "coleadorName",
    "charroName",
    "participantName",
    "athleteName",
    "charro",
    "competidor",
    "ejecutante",
    "name"
  ];
  for (const field of fields) {
    const value = attempt?.[field];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = value.name || value.nombre || value.fullName || value.displayName;
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
  }
  return "";
}

function resolveColeadorName(context = {}, coleadorIndex = 0, attempts = []) {
  const attemptName = attempts.map(readColeadorNameFromAttempt).find(Boolean);
  if (attemptName) return attemptName;
  const rosterName = context.team?.roster?.colas?.[coleadorIndex] || "";
  if (rosterName) return rosterName;
  if (coleadorIndex === 0 && context.team?.participantName) return context.team.participantName;
  return "Coleador no registrado";
}

function buildBestColeadorSummary(context = {}) {
  if (!isCompletingColasForTeam(context)) return null;
  const collection = getScoreCollectionForContext(context);
  const coleadorCount = getColeadorCountForContext(context, collection);
  const entries = Array.from({ length: coleadorCount }, (_, index) => {
    const attempts = Array.isArray(collection?.[index]) ? collection[index] : [];
    const total = attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0);
    return {
      index,
      name: resolveColeadorName(context, index, attempts),
      total,
      hasScores: attempts.some((attempt) => hasAttemptVisibleResult(attempt))
    };
  }).filter((entry) => entry.hasScores);

  if (!entries.length) return null;

  const bestTotal = Math.max(...entries.map((entry) => Number(entry.total || 0)));
  const winners = entries.filter((entry) => Number(entry.total || 0) === bestTotal);
  const summary = {
    teamName: getEntryDisplayName(context.team) || context.team?.name || "—",
    bestTotal,
    winners,
    entries
  };
  console.info("[colas-001] best coleador calculated", {
    team: summary.teamName,
    bestTotal,
    winners: winners.map((entry) => entry.name)
  });
  return summary;
}

function maybeShowBestColeadorModal(context = {}) {
  const summary = buildBestColeadorSummary(context);
  if (!summary) return false;
  const title = summary.winners.length > 1 ? "Mejores coleadores" : "Mejor coleador";
  pendingBestColeadorModal = summary;
  showModal({
    title,
    body: html`
      <div class="best-coleador-modal">
        <div class="best-coleador-hero">
          <span aria-hidden="true">🏆</span>
          <div>
            <strong>${escapeHTML(title)}</strong>
            <em>Equipo: ${escapeHTML(summary.teamName || "—")}</em>
          </div>
        </div>
        <div class="best-coleador-list">
          ${summary.winners.map((entry) => html`
            <article class="best-coleador-row">
              <strong>${escapeHTML(entry.name || "Coleador no registrado")}</strong>
              <span>${moneylessNumber(entry.total)} pts</span>
            </article>
          `).join("")}
        </div>
      </div>
    `,
    actions: html`<button class="button primary" data-action="continue-best-coleador-modal">Aceptar</button>`
  });
  console.info("[colas-001] best coleador modal shown", {
    team: summary.teamName,
    winners: summary.winners.length,
    bestTotal: summary.bestTotal
  });
  return true;
}

function continueAfterBestColeadorModal() {
  if (!pendingBestColeadorModal) {
    closeModal();
    return;
  }
  const summary = pendingBestColeadorModal;
  pendingBestColeadorModal = null;
  closeModal();
  console.info("[colas-001] best coleador modal closed", {
    team: summary.teamName,
    winners: summary.winners?.map((entry) => entry.name) || []
  });
  continueOfficialScoreFlowAfterPublish();
}

async function nextScore() {
  if (!guardUnlockedCharreada()) return;
  if (officialPublishInProgress) {
    console.warn("[publish-lock-c003] intento duplicado ignorado");
    showToast("Publicación en curso. Espera un momento.");
    return;
  }
  const context = getCurrentContext();
  logJudgeScore("click Guardar y siguiente");
  if (!context) {
    setLastFirebaseError("missing-score-data", "Sin contexto de calificacion.");
    setScoreSaveStatus({
      state: "error",
      label: "Error al guardar",
      detail: "Faltan datos del score.",
      savedAtMs: 0,
      scoreId: ""
    });
    logJudgeScore("error al guardar", { reason: "missing-score-data", missing: ["context"] });
    showToast("No se pudo guardar: faltan datos del score.");
    render({ preserveScoringScroll: true });
    return;
  }
  officialPublishInProgress = true;
  setScoreSaveStatus({
    state: "saving",
    label: "Publicando en CharroPro",
    detail: "Validando charreada activa...",
    scoreId: scoreKey(context.charreada.id, context.team.id, context.suerte.id)
  });
  render({ preserveScoringScroll: true });
  try {
    if (context) {
      markAttemptZeroIfBlank(context.attempt);
      markActiveScoringDraft(context);
      saveState({ silent: true });
      const publishResult = await publishOfficialScoreForContext(context);
      if (!publishResult.ok) {
        officialPublishInProgress = false;
        render({ preserveScoringScroll: true });
        return;
      }
      if (firebaseAccess.role === ROLES.JUEZ) {
        console.info("[event-test] juez publico score", {
          tournamentId: context.tournament.id,
          charreadaId: context.charreada.id,
          scoreId: scoreKey(context.charreada.id, context.team.id, context.suerte.id)
        });
      }

      console.info("[event-test] live/current actualizado", {
        tournamentId: context.tournament.id,
        publishedScoreId: publishResult.published?.id || publishResult.id || ""
      });

      releaseActiveScoringDraft(scoreKey(context.charreada.id, context.team.id, context.suerte.id));
    }
    if (maybeShowBestColeadorModal(context)) return;
    continueOfficialScoreFlowAfterPublish();
  } catch (error) {
    officialPublishInProgress = false;
    setLastFirebaseError("official-publish-exception", error?.message || "");
    setScoreSaveStatus({
      state: "error",
      label: "Error al publicar",
      detail: "La publicación no se completó.",
      savedAtMs: 0,
      scoreId: scoreKey(context.charreada.id, context.team.id, context.suerte.id)
    });
    console.error("[publish-atomic-c003] excepcion no controlada", error);
    showToast("No se pudo publicar la calificación oficial en CharroPro.");
    render({ preserveScoringScroll: true });
  }
}

function previousScore() {
  stopTimer(true);
  const result = previousScoringPointer();
  saveScoringNavigationDraft();
  if (result.atStart) showToast("Ya estas en la primera pasada.");
  render();
}

function saveScoringNavigationDraft() {
  // Navegar entre equipo/suerte/oportunidad actualiza el turno en vivo sin publicar puntos borrador.
  saveState({ silent: true });
  if (!guardSupervisorLivePublish()) return;
  sendToFirebaseTurn();
  window.setTimeout(() => sendToFirebaseTurn(), 350);
}

function persistScoreChange() {
  claimGoogleSyncControl();
  markActiveScoringDraft();
  resetScoreSaveStatusForDraft();
  saveState({ silent: true });
  // La calificacion queda como borrador local hasta que el juez toque "Publicar y siguiente".
  render({ preserveScoringScroll: true });
}

function syncCurrentLiveState(options = {}) {
  if (!guardSupervisorLivePublish()) return;
  sendToFirebaseLive();
  if (options.repeat) {
    window.setTimeout(() => sendToFirebaseLive(), 350);
    window.setTimeout(() => sendToFirebaseLive(), 1200);
  }
  if (!state.settings.googleSheetsUrl) return;
  claimGoogleSyncControl();
  sendToGoogleSheets({ force: true }).then(() => {
    saveState({ silent: true });
  });
  if (options.repeat) {
    window.setTimeout(() => sendToGoogleSheets({ force: true }), 750);
    window.setTimeout(() => sendToGoogleSheets({ force: true }), 1800);
  }
}

function saveSettings() {
  const input = document.getElementById("sheets-url");
  state.settings.googleSheetsUrl = input.value.trim();
  saveState();
  showToast("Configuracion guardada.");
  render();
}

async function testSync() {
  claimGoogleSyncControl();
  saveState();
  const firebaseResult = await sendToFirebaseLive();
  const appStateResult = canPublishSharedState() ? await publishSharedAppState() : { ok: false };
  const sheetsResult = await sendToGoogleSheets({ force: true });
  showToast(firebaseResult.ok || appStateResult.ok || sheetsResult.ok ? "Sincronizacion enviada." : "No se pudo sincronizar.");
  saveState();
  render({ preserveScoringScroll: state.view === "scoring" });
}

async function publishLiveState() {
  claimGoogleSyncControl();
  saveState();
  const firebaseResult = await sendToFirebaseLive();
  const appStateResult = canPublishSharedState() ? await publishSharedAppState() : { ok: false };
  const sheetsResult = await sendToGoogleSheets({ force: true });
  if (firebaseResult.ok || appStateResult.ok || sheetsResult.ok) {
    window.setTimeout(() => sendToFirebaseLive(), 350);
    if (canPublishSharedState()) window.setTimeout(() => publishSharedAppState(), 500);
    window.setTimeout(() => sendToGoogleSheets({ force: true }), 750);
    showToast("Estado actual enviado.");
  } else {
    showToast("No se pudo enviar el estado.");
  }
  saveState();
  render({ preserveScoringScroll: state.view === "scoring" });
}

function copyLiveUrl(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.select();
  if (!navigator.clipboard) {
    showToast("URL seleccionada para copiar.");
    return;
  }

  navigator.clipboard.writeText(input.value).then(
    () => showToast("URL copiada."),
    () => showToast("URL seleccionada para copiar.")
  );
}

function confirmReset() {
  const labels = getEntityLabels();
  showModal({
    title: "Borrar datos locales",
    body: html`<p>${escapeHTML(labels.deleteDataText)}</p>`,
    actions: html`
      <button class="button" data-action="close-modal">Cancelar</button>
      <button class="button red" data-action="confirm-reset">Borrar todo</button>
    `
  });
}

function getCharroName(context) {
  if (context.team?.participantName) return context.team.participantName;
  if (context.suerte.type === "coleadero") {
    return context.team.roster.colas?.[context.coleadorIndex] || `Coleador ${context.coleadorIndex + 1}`;
  }
  return getRosterNameForSuerte(context.team, context.suerte) || "Sin registrar";
}

function getRosterNameForSuerte(team = {}, suerte = {}) {
  const roster = team.roster || {};
  if (suerte?.id === "lazo") return roster.terna?.[0] || roster.lazo || "";
  if (suerte?.id === "pial_ruedo") return roster.terna?.[1] || roster.pial_ruedo || "";
  return roster[suerte?.id] || "";
}

function hydrateTimerFromState() {
  const timer = chooseFreshTimer(state.liveTimer, readStoredLiveTimer()) || {};
  timerRunning = Boolean(timer.running);
  timerStartedAt = Number(timer.startedAt || 0);
  timerElapsedMs = Number(timer.elapsedMs || 0);
  if (timerRunning) {
    timerInterval = window.setInterval(updateTimerDisplay, 100);
  }
}

function subscribeExternalTimerControl() {
  if (!isPreparationComplete()) return;
  const liveChannel = getActiveLiveChannel();
  if (firebaseTimerUnsubscribe && firebaseTimerChannel === liveChannel) return;
  if (firebaseTimerUnsubscribe) firebaseTimerUnsubscribe();
  firebaseTimerChannel = liveChannel;
  firebaseTimerUnsubscribe = subscribeFirebaseLive((payload) => {
    const incoming = normalizeTimer({
      ...(payload?.timer || {}),
      updatedAt: payload?.timer?.updatedAt || payload?.timestamp || null
    });
    const remoteFreshness = getFirebaseTimerFreshness(payload, incoming);
    if (!hasTimerValue(incoming) || !shouldApplyExternalTimer(incoming, remoteFreshness)) return;
    applyExternalTimer(incoming, remoteFreshness);
  }, liveChannel);
}

function subscribeGlobalRuleOverridesUpdates() {
  if (!isPreparationComplete()) return;
  if (globalRulesUnsubscribe) return;
  globalRulesUnsubscribe = subscribeFirebaseGlobalRuleOverrides((payload) => {
    const remoteRules = payload?.ruleOverrides;
    if (!remoteRules || typeof remoteRules !== "object") return;

    const remoteUpdatedAt = payload.updatedAt || "";
    const localUpdatedAt = state.settings.globalRuleOverridesUpdatedAt || "";
    if (isRemoteGlobalRulesOlder(remoteUpdatedAt, localUpdatedAt)) return;

    setGlobalRuleOverrides(remoteRules, remoteUpdatedAt || new Date().toISOString());
    saveState({ silent: true });

    if (["rulesAdmin", "rules", "scoring"].includes(state.view)) {
      render({ preserveScoringScroll: state.view === "scoring" });
    }
  });
}

function subscribeGlobalScoringButtonLayoutUpdates() {
  if (!isPreparationComplete()) return;
  if (globalScoringLayoutsUnsubscribe) return;
  globalScoringLayoutsUnsubscribe = subscribeFirebaseScoringButtonLayouts((payload) => {
    const remoteLayouts = normalizeScoringButtonLayouts(payload?.layouts || {});
    if (!Object.keys(remoteLayouts).length) return;
    state.settings.scoringButtonLayouts = remoteLayouts;
    saveState({ silent: true });
    if (state.view === "scoring") render({ preserveScoringScroll: true });
  });
}

function isRemoteGlobalRulesOlder(remoteUpdatedAt, localUpdatedAt) {
  const remoteTime = Date.parse(remoteUpdatedAt || "");
  const localTime = Date.parse(localUpdatedAt || "");
  if (Number.isFinite(remoteTime) && Number.isFinite(localTime)) return remoteTime <= localTime;
  if (!Number.isFinite(remoteTime) && localUpdatedAt) return true;
  return false;
}

function shouldApplyExternalTimer(incoming, remoteFreshness = 0) {
  const current = normalizeTimer({
    running: timerRunning,
    startedAt: timerRunning ? timerStartedAt : null,
    elapsedMs: timerElapsedMs,
    revision: state.liveTimer?.revision || 0,
    updatedAtMs: state.liveTimer?.updatedAtMs || 0,
    updatedAt: state.liveTimer?.updatedAt || null
  });
  const incomingRevision = Number(incoming.revision || 0);
  const currentRevision = Number(current.revision || 0);
  const incomingFreshness = remoteFreshness || getTimerFreshness(incoming);
  const currentFreshness = getTimerFreshness(current);
  const timerChanged =
    Boolean(incoming.running) !== timerRunning ||
    Number(incoming.startedAt || 0) !== Number(timerStartedAt || 0) ||
    Number(incoming.elapsedMs || 0) !== Number(timerElapsedMs || 0);

  if (incomingRevision && currentRevision && incomingRevision !== currentRevision) {
    return incomingRevision > currentRevision;
  }
  if (remoteFreshness && remoteFreshness < lastExternalTimerAt) return false;
  if (timerChanged && remoteFreshness) return true;
  if (incomingFreshness < currentFreshness) return false;
  if (incomingFreshness > currentFreshness) return true;

  return timerChanged;
}

function applyExternalTimer(timer, remoteFreshness = 0) {
  window.clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = Boolean(timer.running);
  timerStartedAt = Number(timer.startedAt || 0);
  timerElapsedMs = Number(timer.elapsedMs || 0);

  if (timerRunning) {
    timerInterval = window.setInterval(updateTimerDisplay, 100);
  }

  const snapshot = {
    revision: Number(timer.revision || 0),
    running: timerRunning,
    startedAt: timerRunning ? timerStartedAt : null,
    elapsedMs: timerElapsedMs,
    ...getTimerSnapshotMeta(timer),
    updatedAtMs: Number(timer.updatedAtMs || remoteFreshness || Date.now()),
    clientId: timer.clientId || "",
    updatedAt: timer.updatedAt || new Date().toISOString()
  };
  lastExternalTimerAt = remoteFreshness || getTimerFreshness(snapshot);
  lastTimerSyncAt = Date.now();
  state.liveTimer = snapshot;
  writeStoredLiveTimer(snapshot);
  saveState({ silent: true });
  updateTimerDisplay();
  updateTimerButtons();
}

function getFirebaseTimerFreshness(payload, timer) {
  if (payload?.firebaseUpdatedAt) return Number(payload.firebaseUpdatedAt || 0);
  return Number(timer?.updatedAtMs || 0) || Date.parse(payload?.timestamp || timer?.updatedAt || "") || Number(timer?.startedAt || 0) || 0;
}

function persistTimerState() {
  claimGoogleSyncControl();
  const meta = getTimerSnapshotMeta();
  const context = getCurrentContext();
  const storedTimer = readStoredLiveTimer() || {};
  const nextRevision = Math.max(Number(state.liveTimer?.revision || 0), Number(storedTimer.revision || 0)) + 1;
  const updatedAtMs = Date.now();
  const timerSnapshot = {
    revision: nextRevision,
    tournamentId: context?.tournament?.id || state.activeTournamentId || "",
    charreadaId: context?.charreada?.id || state.activeCharreadaId || "",
    teamId: context?.team?.id || "",
    suerteId: context?.suerte?.id || "",
    attemptId: `${context?.team?.id || ""}_${context?.suerte?.id || ""}_${context?.attemptIndex || 0}_${context?.coleadorIndex || 0}`,
    running: timerRunning,
    startedAt: timerRunning ? timerStartedAt : null,
    elapsedMs: timerElapsedMs,
    ...meta,
    updatedAtMs,
    clientId: firebaseClientId,
    updatedAt: new Date().toISOString()
  };
  state.liveTimer = timerSnapshot;
  writeStoredLiveTimer(timerSnapshot);
  if (!guardSupervisorLivePublish()) {
    saveState({ silent: true });
    lastTimerSyncAt = Date.now();
    return;
  }
  saveState();
  publishFirebaseTimer(timerSnapshot, getActiveLiveChannel());
  lastTimerSyncAt = Date.now();
}

function readStoredLiveTimer() {
  try {
    const raw = localStorage.getItem(LIVE_TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredLiveTimer(timer) {
  try {
    localStorage.setItem(LIVE_TIMER_KEY, JSON.stringify(timer));
  } catch {
    // Si el navegador bloquea almacenamiento auxiliar, el estado principal sigue funcionando.
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

function toggleTimer() {
  if (state.view === "scoring" && !guardUnlockedCharreada()) return;
  if (timerRunning) {
    timerElapsedMs += Date.now() - timerStartedAt;
    timerRunning = false;
    window.clearInterval(timerInterval);
  } else {
    timerStartedAt = Date.now();
    timerRunning = true;
    timerInterval = window.setInterval(updateTimerDisplay, 100);
  }
  persistTimerState();
  render({ preserveScoringScroll: true });
}

function stopTimer(reset = false) {
  if (timerRunning) {
    timerElapsedMs += Date.now() - timerStartedAt;
  }
  timerRunning = false;
  window.clearInterval(timerInterval);
  timerInterval = null;
  if (reset) timerElapsedMs = 0;
  persistTimerState();
  updateTimerDisplay();
}

function getTimerSource() {
  const context = getCurrentContext();
  return context ? { ...context, charreada: getActiveCharreada() } : {};
}

function getTimerSnapshotMeta(sourceTimer = {}) {
  const source = getTimerSource();
  const view = getTimerView(
    {
      ...sourceTimer,
      running: timerRunning,
      startedAt: timerRunning ? timerStartedAt : null,
      elapsedMs: timerElapsedMs
    },
    source
  );
  return {
    elapsedLiveMs: view.elapsedMs,
    displayMs: view.displayMs,
    remainingMs: view.remainingMs,
    formatted: view.formatted,
    mode: view.rule.mode,
    limitMs: view.rule.limitMs,
    limitLabel: view.rule.label,
    stateLabel: view.stateLabel,
    expired: view.expired,
    scopeKey: getTimerScopeKey(source)
  };
}

function getTimerLabel() {
  return getTimerView(
    {
      running: timerRunning,
      startedAt: timerRunning ? timerStartedAt : null,
      elapsedMs: timerElapsedMs
    },
    getTimerSource()
  ).rule.label;
}

function formatTimer() {
  return getTimerView(
    {
      running: timerRunning,
      startedAt: timerRunning ? timerStartedAt : null,
      elapsedMs: timerElapsedMs
    },
    getTimerSource()
  ).formatted;
}

function updateTimerDisplay() {
  document.querySelectorAll(".timer-display").forEach((display) => {
    display.textContent = formatTimer();
  });
}

function updateTimerButtons() {
  document.querySelectorAll('[data-action="timer-toggle"]').forEach((button) => {
    button.textContent = timerRunning ? "Pausar" : "Iniciar";
  });
}

function syncRunningTimerIfNeeded() {
  // El cronometro se publica solo cuando cambia de estado: iniciar, pausar o reiniciar.
  // Las pantallas calculan el avance con startedAt, asi evitamos que una pantalla atrasada
  // vuelva a escribir un estado viejo mientras el reloj corre.
}
