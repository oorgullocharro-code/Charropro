import { SUERTES, getTournamentSuertes } from "../data/suertes.js?v=20260706-release22d-active-charreada-source2";
import { normalizeGraphicsConfig, readLocalGraphicsConfig } from "./graphicsConfig.js?v=20260706-release22d-active-charreada-source2";
import { buildOfficialPackage } from "./officialFormat.js?v=20260706-release22d-active-charreada-source2";
import { buildCharreadaLeaderboard, buildTournamentStandingColumns, buildTournamentTeamStandings, calculateAttemptTotal } from "./scoring.js?v=20260706-release22d-active-charreada-source2";
import { getActiveCharreada, getActiveTournament, getCurrentContext, getScopedLocalStorageKey, getTeam, getTournamentCharreadas, LIVE_TIMER_KEY, scoreKey, state } from "./state.js?v=20260706-release22d-active-charreada-source2";
import { getLiveChannelFromUrl, getTournamentLiveChannel, isFirebaseLiveConfigured, publishFirebaseLive, publishFirebaseTurn } from "./firebaseSync.js?v=20260706-release22d-active-charreada-source2";
import { getTimerScopeKey, getTimerView } from "./timerRules.js?v=20260706-release22d-active-charreada-source2";

let syncTimer = null;
let firebaseSyncTimer = null;
const SYNC_OWNER_KEY = "sync_owner_v1";
const SYNC_CLIENT_ID = getSyncClientId();

function isIndividualTournament(tournament = getActiveTournament()) {
  return ["caladero", "coleadero"].includes(tournament?.type);
}

export function buildLivePayload(options = {}) {
  const context = getCurrentContext();
  const charreada = getActiveCharreada();
  const tournament = context?.tournament || getActiveTournament();
  const tournamentPayload = tournament ? { ...tournament, globalRuleOverrides: state.settings.globalRuleOverrides || {} } : null;
  const leaderboard = charreada ? buildCharreadaLeaderboard(charreada.id) : [];
  const tournamentColumns = tournament ? buildTournamentStandingColumns(tournament.id) : [];
  const individualTournament = isIndividualTournament(tournament);
  const teamStandings = tournament
    ? {
        title: individualTournament ? "Tabla general por participantes" : "Tabla general por equipos",
        charreadas: tournamentColumns.map((item, index) => ({
          id: item.id,
          name: item.name || `Fase ${index + 1}`,
          date: item.date || "",
          startTime: item.startTime || "",
          status: item.status || "",
          charreadaIds: item.charreadaIds || []
        })),
        rows: buildTournamentTeamStandings(tournament.id)
      }
    : null;

  const payload = {
    action: "update_live_graphics",
    timestamp: new Date().toISOString(),
    liveChannel: getActiveLiveChannel(tournament),
    tournament: tournamentPayload,
    charreada: charreada || null,
    turn: context
      ? {
          team: context.team,
          suerte: context.suerte,
          attemptIndex: context.attemptIndex,
          coleadorIndex: context.coleadorIndex,
          attempt: options.includeDraftAttempt === false ? emptyLiveAttempt(context.attempt) : context.attempt,
          charro: getCharroName(context)
        }
      : null,
    timer: buildTimerPayload(),
    graphicsConfig: normalizeGraphicsConfig(state.settings.graphicsConfig || readLocalGraphicsConfig()),
	    leaderboard,
	    coleadero: buildColeaderoGraphicData(charreada, context, options),
	    teamStandings,
	    published: state.lastPublishedScore || null
		  };

  if (options.includeOfficial === false) return payload;

  return {
    ...payload,
    detalles: buildFederationDetails(charreada),
    details: buildDetails(charreada),
    formatoFederacion: buildOfficialPackage(charreada?.id)
  };
}

export function getActiveLiveChannel(tournament = getActiveTournament()) {
  return getTournamentLiveChannel(tournament) || getLiveChannelFromUrl(state.activeTournamentId || "");
}

export function buildTimerPayload() {
  const timer = chooseFreshTimer(state.liveTimer, readStoredLiveTimer()) || {};
  const baseElapsedMs = Number(timer.elapsedMs || 0);
  const context = getCurrentContext();
  const source = context ? { ...context, charreada: getActiveCharreada() } : {};
  const view = getTimerView(timer, source);

  return {
    revision: Number(timer.revision || 0),
    running: Boolean(timer.running),
    startedAt: timer.startedAt || null,
    elapsedMs: baseElapsedMs,
    elapsedLiveMs: view.elapsedMs,
    displayMs: view.displayMs,
    remainingMs: view.remainingMs,
    formatted: view.formatted,
    mode: view.rule.mode,
    limitMs: view.rule.limitMs,
    limitLabel: view.rule.label,
    stateLabel: view.stateLabel,
    expired: view.expired,
    scopeKey: getTimerScopeKey(source),
    updatedAtMs: Number(timer.updatedAtMs || 0),
    clientId: timer.clientId || "",
    updatedAt: timer.updatedAt || null
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

export function scheduleGoogleSync() {
  if (!state.settings.googleSheetsUrl) return;
  if (document.visibilityState === "visible") claimGoogleSyncControl();
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    sendToGoogleSheets();
  }, 900);
}

export function scheduleFirebaseSync(delay = 150) {
  if (!isFirebaseLiveConfigured()) return;
  window.clearTimeout(firebaseSyncTimer);
  firebaseSyncTimer = window.setTimeout(() => {
    sendToFirebaseLive();
  }, delay);
}

export async function sendToFirebaseLive() {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  const payload = buildLivePayload({ includeOfficial: false });
  const result = await publishFirebaseLive(payload, payload.liveChannel);
  if (result.ok) state.settings.lastFirebaseSyncAt = new Date().toISOString();
  return result;
}

export async function sendToFirebaseTurn() {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  const payload = buildLivePayload({
    includeOfficial: false,
    includeDraftAttempt: false,
    includeDraftColeadero: false,
    includePublishedHistory: false
  });
  const result = await publishFirebaseTurn(payload, payload.liveChannel);
  if (result.ok) state.settings.lastFirebaseSyncAt = new Date().toISOString();
  return result;
}

export function claimGoogleSyncControl() {
  try {
    localStorage.setItem(getScopedLocalStorageKey(SYNC_OWNER_KEY), JSON.stringify({
      clientId: SYNC_CLIENT_ID,
      charreadaId: state.activeCharreadaId || "",
      at: Date.now()
    }));
  } catch {
    // Si localStorage falla, la pestana actual sigue intentando sincronizar.
  }
}

export async function sendToGoogleSheets(options = {}) {
  if (!state.settings.googleSheetsUrl) return { ok: false, reason: "missing-url" };
  if (!options.force && !hasGoogleSyncControl()) return { ok: false, reason: "not-sync-owner" };

  const payload = buildLivePayload({ includePublishedHistory: false });

  try {
    await fetch(state.settings.googleSheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    state.settings.lastSyncAt = new Date().toISOString();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

function hasGoogleSyncControl() {
  try {
    const raw = localStorage.getItem(getScopedLocalStorageKey(SYNC_OWNER_KEY));
    if (!raw) {
      claimGoogleSyncControl();
      return true;
    }

    const owner = JSON.parse(raw);
    if (owner.clientId === SYNC_CLIENT_ID) return true;
    if (Date.now() - Number(owner.at || 0) > 30000 && document.visibilityState === "visible") {
      claimGoogleSyncControl();
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

function getSyncClientId() {
  try {
    const key = getScopedLocalStorageKey("sync_client_id");
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function getCharroName(context) {
  if (!context?.team || !context?.suerte) return "";
  if (context.team.participantName) return context.team.participantName;
  const roster = context.team.roster || {};
  if (context.suerte.type === "coleadero") {
    return roster.colas?.[context.coleadorIndex] || `Coleador ${context.coleadorIndex + 1}`;
  }
  if (context.suerte.id === "lazo") return roster.terna?.[0] || roster.lazo || "Sin registrar";
  if (context.suerte.id === "pial_ruedo") return roster.terna?.[1] || roster.pial_ruedo || "Sin registrar";
  return roster[context.suerte.id] || "Sin registrar";
}

function buildColeaderoGraphicData(charreada, context, options = {}) {
  if (!charreada) return null;

  const colas = SUERTES.find((suerte) => suerte.id === "colas");
  const isColeaderoTurn = context?.suerte?.id === "colas";
  const teamId = context?.team?.id || charreada.teamIds[state.scoringTeamIdx] || charreada.teamIds[0] || "";
  const team = context?.team || getTeam(teamId);
  if (!colas || !team) return null;

  const collection = state.scores[scoreKey(charreada.id, team.id, "colas")] || [];
  const activeColeadorIndex = isColeaderoTurn ? Number(context.coleadorIndex || 0) : -1;
  const activeAttemptIndex = isColeaderoTurn ? Number(context.attemptIndex || 0) : -1;
  const rowCount = team.participantName ? 1 : 3;

  const rows = Array.from({ length: rowCount }, (_, coleadorIndex) => {
    const attempts = Array.from({ length: colas.attempts || 3 }, (_, attemptIndex) => {
      const attempt = options.includeDraftColeadero === false ? {} : (collection[coleadorIndex]?.[attemptIndex] || {});
      const hasActivity = hasGraphicAttemptActivity(attempt);
      return {
        index: attemptIndex,
        total: calculateAttemptTotal(attempt),
        base: Number(attempt.base || 0),
        adic: Number(attempt.adic || 0),
        infr: Number(attempt.infr || 0),
        desc: attempt.desc || null,
        hasActivity,
        active: isColeaderoTurn && coleadorIndex === activeColeadorIndex && attemptIndex === activeAttemptIndex
      };
    });

	    return {
	      index: coleadorIndex,
	      name: team.participantName || team.roster?.colas?.[coleadorIndex] || `Coleador ${coleadorIndex + 1}`,
      attempts,
      total: attempts.reduce((sum, attempt) => sum + (attempt.hasActivity || attempt.desc ? Number(attempt.total || 0) : 0), 0),
      active: isColeaderoTurn && coleadorIndex === activeColeadorIndex
    };
  });

  return {
    charreada: {
      id: charreada.id || "",
      name: charreada.name || ""
    },
	    team: {
	      id: team.id || "",
	      name: team.name || "Equipo",
	      participantName: team.participantName || "",
	      horseName: team.horseName || ""
    },
    suerte: {
      id: "colas",
      name: "Colas",
      fullName: "Coleadero"
    },
    activeColeadorIndex,
    activeAttemptIndex,
    rows
  };
}

function emptyLiveAttempt(attempt = {}) {
  return {
    base: 0,
    adic: 0,
    infr: 0,
    puntaPts: 0,
    puntaMetros: Number(attempt.puntaMetros || 0),
    puntaPiquetes: Number(attempt.puntaPiquetes || 1),
    tiempo: "",
    desc: null,
    note: "",
    teamPenalties: []
  };
}

function hasGraphicAttemptActivity(attempt = {}) {
  return Boolean(
    attempt.base ||
    attempt.adic ||
    attempt.infr ||
    attempt.puntaPts ||
    attempt.desc ||
    attempt.tiempo ||
    attempt.applied?.length ||
    attempt.customAdic?.length ||
    attempt.customInfr?.length
  );
}

function buildDetails(charreada) {
  if (!charreada) return [];
  const suertes = getCharreadaSuertes(charreada);

  return charreada.teamIds.map((teamId) => {
    const team = getTeam(teamId);
    return {
      team,
      suertes: suertes.map((suerte) => ({
        suerte,
        scoreKey: `${charreada.id}__${teamId}__${suerte.id}`,
        scores: state.scores[`${charreada.id}__${teamId}__${suerte.id}`] || []
      }))
    };
  });
}

function buildFederationDetails(charreada) {
  if (!charreada) return [];
  const suertes = getCharreadaSuertes(charreada);

  return charreada.teamIds.map((teamId) => {
    const team = getTeam(teamId);
    return {
	      id: team?.id || teamId,
	      name: team?.name || "",
	      participantName: team?.participantName || "",
	      horseName: team?.horseName || "",
	      category: team?.category || "Libre",
      captain: team?.captain || "",
      association: team?.association || "",
      suertes: suertes.map((suerte) => {
        const scores = state.scores[`${charreada.id}__${teamId}__${suerte.id}`] || [];

	        if (suerte.type === "coleadero") {
	          const coleadores = team?.participantName ? scores.slice(0, 1) : scores;
	          return {
	            suerteId: suerte.id,
	            suerteName: suerte.fullName,
	            attempts: coleadores.map((coleadorArr, coleadorIndex) => ({
	              coleadorIndex,
	              coleadorName: team?.participantName || team?.roster?.colas?.[coleadorIndex] || `Coleador ${coleadorIndex + 1}`,
	              attempts: (coleadorArr || []).map((attempt, attemptIndex) =>
	                mapAttemptForFederation(attempt, {
	                  attemptIndex,
	                  charro: team?.participantName || team?.roster?.colas?.[coleadorIndex] || `Coleador ${coleadorIndex + 1}`,
	                  suerte
	                })
              )
            }))
          };
        }

        return {
          suerteId: suerte.id,
          suerteName: suerte.fullName,
          attempts: scores.map((attempt, attemptIndex) =>
            mapAttemptForFederation(attempt, {
              attemptIndex,
	              charro: team?.participantName || team?.roster?.[suerte.id] || "",
              suerte
            })
          )
        };
      })
    };
  });
}

function getCharreadaSuertes(charreada) {
  const tournament = state.tournaments.find((item) => item.id === charreada?.tournamentId) || null;
  return getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
}

function mapAttemptForFederation(attempt = {}, extra = {}) {
  const suerte = extra.suerte;
  return {
    attemptIndex: extra.attemptIndex,
    coleadorIndex: extra.coleadorIndex,
    charro: extra.charro,
    base: Number(attempt.base) || 0,
    adic: Number(attempt.adic) || 0,
    infr: Number(attempt.infr) || 0,
    puntaPts: Number(attempt.puntaPts) || 0,
    puntaMetros: Number(attempt.puntaMetros) || 0,
    puntaPiquetes: Number(attempt.puntaPiquetes) || 0,
    tiempoTendido: attempt.tiempo || attempt.tiempoTendido || "",
    tiempo: attempt.tiempo || attempt.tiempoTendido || "",
    desc: attempt.desc || null,
    note: attempt.note || "",
    attempted: Boolean(attempt.attempted),
    notAchieved: Boolean(attempt.notAchieved),
    applied: attempt.applied || [],
    adicItems: buildRuleItems(attempt, suerte, "adic"),
    infrItems: buildRuleItems(attempt, suerte, "infr"),
    customAdic: attempt.customAdic || [],
    customInfr: attempt.customInfr || [],
    teamPenalties: attempt.teamPenalties || []
  };
}

function buildRuleItems(attempt = {}, suerte, type) {
  const catalogItems = suerte?.catalog?.[type] || [];
  const appliedItems = (attempt.applied || [])
    .map((id) => catalogItems.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      label: item.label,
      abbr: abbreviateRule(item),
      pts: Number(item.pts) || 0
    }));

  const customKey = type === "infr" ? "customInfr" : "customAdic";
  const customItems = (attempt[customKey] || []).map((item) => ({
    id: item.id,
    label: item.label,
    abbr: abbreviateCustom(item.label),
    pts: Number(item.pts) || 0
  }));

  return [...appliedItems, ...customItems];
}

const RULE_ABBREVIATIONS = {
  cala_inf_abrir_hocico: "AH",
  cala_inf_rabear_espiguear: "RE",
  cala_inf_enjetarse: "ENJ",
  cala_inf_cachetear: "CAC",
  cala_inf_estrellar_despapar_gorbetear: "EDG",
  cala_inf_alborotarse: "ALB",
  cala_inf_no_correr_recto: "NCR",
  cala_inf_no_poner_en_mano: "NPM",
  cala_inf_cambiar_mano: "CM",
  cala_inf_patada_una_extremidad: "PAT",
  cala_inf_lados_caminando: "LC",
  cala_inf_espalda_fin_lado: "EFL",
  cala_inf_medio_incompleto: "MI",
  cala_inf_anticiparse: "ANT",
  cala_inf_ceja_fuera_linea: "CFL",
  cala_inf_disminuir_velocidad_lado: "DVL",
  cala_inf_disminuir_velocidad_ceja: "DVC",
  cala_inf_sangrado: "SAN"
};

function abbreviateRule(rule) {
  if (RULE_ABBREVIATIONS[rule.id]) return RULE_ABBREVIATIONS[rule.id];
  return abbreviateCustom(rule.label);
}

function abbreviateCustom(label = "") {
  const clean = String(label)
    .replace(/\([^)]*\)/g, "")
    .replace(/[-+]\d+/g, "")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return "M";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
}
