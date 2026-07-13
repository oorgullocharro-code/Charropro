import { SUERTES, getTournamentSuertes } from "../data/suertes.js?v=20260708-tournament-types-001-pialadero1";
import { getCompetitionType } from "../data/competitionTypes.js?v=20260712-production-competitions-001-broadcast-context1";
import { normalizeGraphicsConfig, readLocalGraphicsConfig } from "./graphicsConfig.js?v=20260708-recovery-001b-panel-status1";
import { buildOfficialPackage } from "./officialFormat.js?v=20260709-competitions-003-scoring-by-competition1";
import { buildCharreadaLeaderboard, buildTournamentStandingColumns, buildTournamentTeamStandings, calculateAttemptTotal } from "./scoring.js?v=20260709-competitions-003-scoring-by-competition1";
import { getActiveCharreada, getActiveTournament, getCurrentContext, getScopedLocalStorageKey, getTeam, getTournamentCharreadas, LIVE_TIMER_KEY, scoreKey, state } from "./state.js?v=20260709-competitions-003-scoring-by-competition1";
import { getLiveChannelFromUrl, getTournamentLiveChannel, isFirebaseLiveConfigured, publishFirebaseLive, publishFirebaseTurn } from "./firebaseSync.js?v=20260712-production-competitions-001-broadcast-context1";
import { getTimerScopeKey, getTimerView } from "./timerRules.js?v=20260708-recovery-001b-panel-status1";

let syncTimer = null;
let firebaseSyncTimer = null;
const SYNC_OWNER_KEY = "sync_owner_v1";
const SYNC_CLIENT_ID = getSyncClientId();
let lastBroadcastLogFingerprint = "";

function isIndividualTournament(tournament = getActiveTournament()) {
  return ["caladero", "coleadero", "pialadero"].includes(tournament?.type);
}

export function buildLivePayload(options = {}) {
  const context = getCurrentContext();
  const charreada = getActiveCharreada();
  const tournament = context?.tournament || getActiveTournament();
  const tournamentPayload = tournament ? { ...tournament, globalRuleOverrides: state.settings.globalRuleOverrides || {} } : null;
  const leaderboard = charreada ? buildCharreadaLeaderboard(charreada.id) : [];
  const timer = buildTimerPayload();
  const published = state.lastPublishedScore || null;
  const broadcastContext = buildBroadcastContext({
    context,
    charreada,
    tournament,
    leaderboard,
    published,
    timer
  });
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
    ...buildBroadcastFlatFields(broadcastContext),
    broadcastContext,
    turn: context
      ? {
          team: context.team,
          participant: broadcastContext.participant,
          competition: broadcastContext.competition,
          participantScope: broadcastContext.competition.participantScope,
          currentTurnId: broadcastContext.production.currentTurnId,
          currentTurnName: broadcastContext.production.currentTurnName,
          suerte: context.suerte,
          attemptIndex: context.attemptIndex,
          coleadorIndex: context.coleadorIndex,
          attempt: options.includeDraftAttempt === false ? emptyLiveAttempt(context.attempt) : context.attempt,
          charro: getCharroName(context)
        }
      : null,
    timer,
    graphicsConfig: normalizeGraphicsConfig(state.settings.graphicsConfig || readLocalGraphicsConfig()),
	  leaderboard,
	  coleadero: buildColeaderoGraphicData(charreada, context, options),
	  teamStandings,
	  published
  };

  logBroadcastContext(broadcastContext);

  if (options.includeOfficial === false) return payload;

  return {
    ...payload,
    detalles: buildFederationDetails(charreada),
    details: buildDetails(charreada),
    formatoFederacion: buildOfficialPackage(charreada?.id)
  };
}

export function buildBroadcastContext(source = {}) {
  const context = source.context || null;
  const charreada = source.charreada || context?.charreada || null;
  const tournament = source.tournament || context?.tournament || null;
  const competitionContext = context?.competitionContext || {};
  const competitionType = charreada?.competitionType || competitionContext.competitionType || legacyCompetitionTypeFromTournament(tournament);
  const competitionConfig = getCompetitionType(competitionType);
  const competitionScope = charreada?.competitionScope || competitionContext.competitionScope || competitionConfig.scope || "team";
  const competitionId = charreada?.competitionId || competitionContext.competitionId || competitionType;
  const participantScope = competitionScope === "individual" ? "individual" : "team";
  const suerteIds = normalizeBroadcastSuerteIds(
    Array.isArray(charreada?.suerteIds) && charreada.suerteIds.length
      ? charreada.suerteIds
      : competitionConfig.suerteIds
  );
  const currentEntry = context?.team || null;
  const participant = buildBroadcastParticipant(currentEntry, context, participantScope);
  const team = participantScope === "team" ? buildBroadcastTeam(currentEntry) : null;
  const horseName = participant?.horseName || currentEntry?.horseName || "";
  const published = publishedBelongsToActiveCharreada(source.published, charreada) ? source.published : null;
  const score = buildBroadcastScore(published);
  const scoreDetail = buildBroadcastScoreDetail(published);
  const currentTurnId = participantScope === "individual" ? participant?.id || "" : team?.id || "";
  const currentTurnName = participantScope === "individual" ? participant?.name || "" : team?.name || "";
  const competitionName = charreada?.competitionName || competitionConfig.label || competitionType;
  const category = charreada?.category || participant?.category || team?.category || tournament?.category || "";
  const phase = charreada?.phase || charreada?.fase || "";

  return cloneBroadcastValue({
    tournament: tournament
      ? {
          id: tournament.id || "",
          name: tournament.name || "",
          type: tournament.type || "",
          venue: tournament.venue || ""
        }
      : null,
    competition: {
      type: competitionType,
      scope: competitionScope,
      id: competitionId,
      name: competitionName,
      category,
      phase,
      suerteIds,
      participantScope
    },
    charreada: charreada
      ? {
          id: charreada.id || "",
          name: charreada.name || "",
          date: charreada.date || "",
          startTime: charreada.startTime || "",
          status: charreada.status || ""
        }
      : null,
    participant,
    team,
    horse: horseName ? { name: horseName } : null,
    suerte: context?.suerte
      ? {
          id: context.suerte.id || "",
          name: context.suerte.fullName || context.suerte.name || "",
          type: context.suerte.type || "",
          suerteIds
        }
      : null,
    score,
    scoreDetail,
    ranking: buildBroadcastRanking(source.leaderboard, participantScope),
    timer: source.timer || null,
    production: {
      liveChannel: getActiveLiveChannel(tournament),
      currentTurnId,
      currentTurnName,
      updatedAt: new Date().toISOString()
    }
  });
}

function buildBroadcastFlatFields(broadcast = {}) {
  const individual = broadcast.competition?.participantScope === "individual";
  return {
    tournamentId: broadcast.tournament?.id || "",
    tournamentName: broadcast.tournament?.name || "",
    activeCharreadaId: broadcast.charreada?.id || "",
    charreadaId: broadcast.charreada?.id || "",
    charreadaName: broadcast.charreada?.name || "",
    competitionType: broadcast.competition?.type || "equipos_completo",
    competitionScope: broadcast.competition?.scope || "team",
    competitionId: broadcast.competition?.id || "equipos_completo",
    competitionName: broadcast.competition?.name || "Competencia por equipos",
    category: broadcast.competition?.category || "",
    phase: broadcast.competition?.phase || "",
    participantScope: broadcast.competition?.participantScope || "team",
    participantId: individual ? broadcast.participant?.id || "" : undefined,
    participantName: broadcast.participant?.name || "",
    teamId: individual ? undefined : broadcast.team?.id || "",
    teamName: individual ? undefined : broadcast.team?.name || "",
    association: broadcast.participant?.association || broadcast.team?.association || "",
    horseName: broadcast.horse?.name || "",
    suerteId: broadcast.suerte?.id || "",
    suerteName: broadcast.suerte?.name || "",
    suerteIds: broadcast.competition?.suerteIds || [],
    currentTurnId: broadcast.production?.currentTurnId || "",
    currentTurnName: broadcast.production?.currentTurnName || "",
    scoreId: broadcast.score?.scoreId || "",
    basePoints: broadcast.score?.basePoints ?? null,
    additionalPoints: broadcast.score?.additionalPoints ?? null,
    infractions: broadcast.score?.infractions ?? null,
    penalties: broadcast.score?.penalties ?? null,
    totalPoints: broadcast.score?.totalPoints ?? null,
    time: broadcast.score?.time ?? null,
    attempts: broadcast.score?.attempts ?? null,
    scoreStatus: broadcast.score?.status ?? null,
    scoreTimestamp: broadcast.score?.timestamp ?? null,
    scoreDetail: broadcast.scoreDetail || null
  };
}

function buildBroadcastParticipant(entry, context, participantScope) {
  if (!entry) return null;
  const currentCharro = getCharroName(context);
  const name = participantScope === "individual"
    ? entry.participantName || entry.name || currentCharro
    : currentCharro;
  if (!name && participantScope !== "individual") return null;
  return {
    id: participantScope === "individual" ? entry.id || "" : null,
    name: name || "",
    association: entry.association || "",
    category: entry.category || "",
    horseName: entry.horseName || "",
    scope: participantScope
  };
}

function buildBroadcastTeam(entry) {
  if (!entry) return null;
  return {
    id: entry.id || "",
    name: entry.name || "",
    logo: entry.logo || entry.logoUrl || "",
    association: entry.association || "",
    category: entry.category || ""
  };
}

function buildBroadcastRanking(leaderboard = [], participantScope = "team") {
  return (Array.isArray(leaderboard) ? leaderboard : []).map((row, index) => {
    const entry = row?.team || {};
    const identity = participantScope === "individual"
      ? {
          participant: {
            id: entry.id || "",
            name: entry.participantName || entry.name || "",
            association: entry.association || "",
            category: entry.category || "",
            horseName: entry.horseName || ""
          },
          participantId: entry.id || "",
          participantName: entry.participantName || entry.name || ""
        }
      : {
          team: buildBroadcastTeam(entry),
          teamId: entry.id || "",
          teamName: entry.name || ""
        };
    return {
      position: index + 1,
      ...identity,
      total: Number(row?.total || 0),
      infractions: Number(row?.infr || 0)
    };
  });
}

function buildBroadcastScore(published) {
  if (!published) return null;
  const attempt = published.attempt || {};
  const breakdown = published.breakdown || {};
  const scoreCompetitionScope = published.competition?.competitionScope || published.competition?.scope || published.charreada?.competitionScope || "team";
  const individual = scoreCompetitionScope === "individual";
  return {
    scoreId: published.id || "",
    participantScope: individual ? "individual" : "team",
    participantId: individual ? published.team?.id || "" : undefined,
    participantName: individual ? published.team?.participantName || published.charro || published.team?.name || "" : undefined,
    teamId: individual ? undefined : published.team?.id || "",
    teamName: individual ? undefined : published.team?.name || "",
    suerteId: published.suerte?.id || "",
    suerteName: published.suerte?.fullName || published.suerte?.name || "",
    basePoints: numberOrNull(breakdown.base ?? attempt.base),
    additionalPoints: numberOrNull(breakdown.adic ?? attempt.adic),
    infractions: numberOrNull(breakdown.infr ?? attempt.infr),
    penalties: cloneBroadcastValue(breakdown.teamPenalties ?? attempt.teamPenalties ?? null),
    totalPoints: numberOrNull(published.total ?? breakdown.total),
    time: attempt.tiempo || attempt.tiempoTendido || null,
    attempts: numberOrNull(published.suerte?.attempts),
    status: published.status || attempt.status || breakdown.status || attempt.desc || null,
    timestamp: published.publishedAt || published.timestamp || null
  };
}

function buildBroadcastScoreDetail(published) {
  if (!published) return null;
  const detail = {};
  if (published.attempt && typeof published.attempt === "object") detail.attempt = cloneBroadcastValue(published.attempt);
  if (published.breakdown && typeof published.breakdown === "object") detail.breakdown = cloneBroadcastValue(published.breakdown);
  return Object.keys(detail).length ? detail : null;
}

function publishedBelongsToActiveCharreada(published, charreada) {
  if (!published || !charreada?.id) return false;
  const scoreCharreadaId = published.charreada?.id || published.charreadaId || "";
  return String(scoreCharreadaId) === String(charreada.id);
}

function normalizeBroadcastSuerteIds(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function legacyCompetitionTypeFromTournament(tournament) {
  if (["caladero", "coleadero", "pialadero"].includes(tournament?.type)) return tournament.type;
  return "equipos_completo";
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cloneBroadcastValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function logBroadcastContext(broadcast = {}) {
  const fingerprint = [
    broadcast.tournament?.id,
    broadcast.charreada?.id,
    broadcast.competition?.id,
    broadcast.production?.currentTurnId,
    broadcast.suerte?.id,
    broadcast.score?.scoreId,
    broadcast.timer?.revision
  ].join("|");
  if (fingerprint === lastBroadcastLogFingerprint) return;
  lastBroadcastLogFingerprint = fingerprint;
  console.info("[production-competitions-001] competition context", broadcast.competition);
  console.info("[production-competitions-001] participant context", {
    participant: broadcast.participant,
    team: broadcast.team,
    horse: broadcast.horse
  });
  console.info("[production-competitions-001] active score detail", {
    score: broadcast.score,
    hasScoreDetail: Boolean(broadcast.scoreDetail)
  });
  console.info("[production-competitions-001] broadcast payload", {
    tournamentId: broadcast.tournament?.id || "",
    charreadaId: broadcast.charreada?.id || "",
    competitionId: broadcast.competition?.id || "",
    currentTurnId: broadcast.production?.currentTurnId || "",
    suerteId: broadcast.suerte?.id || ""
  });
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
