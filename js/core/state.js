import { getTournamentSuertes, normalizeTournamentType } from "../data/suertes.js?v=20260708-tournament-types-001-pialadero1";
import { migrateCalaAttempt, normalizeCalaRuleOverrideCatalog } from "../data/calaRules.js?v=20260708-recovery-001b-panel-status1";
import { normalizeScoringButtonLayouts } from "../data/defaultScoringButtonLayouts.js?v=20260708-recovery-001b-panel-status1";
import { DEFAULT_GRAPHICS_CONFIG, normalizeGraphicsConfig } from "./graphicsConfig.js?v=20260708-recovery-001b-panel-status1";
import {
  LEGACY_GLOBAL_RULES_STORAGE_KEY,
  LEGACY_GRAPHICS_CONFIG_KEY,
  LEGACY_LIVE_TIMER_KEY,
  LEGACY_STATE_STORAGE_KEY,
  getActiveTournamentCacheId,
  getTournamentScopedStorageKey,
  getTournamentStateStorageKey,
  hasLegacyCacheKeys,
  normalizeTournamentCacheId,
  removeLegacyCacheKeys,
  setActiveTournamentCacheId
} from "./localCache.js?v=20260708-recovery-001b-panel-status1";

export const LIVE_CHANNEL = "charropro_live_channel";
export let STORAGE_KEY = getTournamentStateStorageKey(getActiveTournamentCacheId());
export let LIVE_TIMER_KEY = getTournamentScopedStorageKey("live_timer_v1", getActiveTournamentCacheId());
export let GLOBAL_RULES_STORAGE_KEY = getTournamentScopedStorageKey("global_rule_overrides_v1", getActiveTournamentCacheId());
const CURRENT_SCHEMA_VERSION = 2;
const CALA_MIGRATION_BACKUP_SUFFIX = "backup_before_cala_migration";

export const emptyAttempt = () => ({
  base: 0,
  adic: 0,
  infr: 0,
  puntaPts: 0,
  puntaMetros: 0,
  puntaPiquetes: 1,
  tiempo: "",
  desc: null,
  applied: [],
  customAdic: [],
  customInfr: [],
  teamPenalties: [],
  attempted: false,
  notAchieved: false,
  initializedBase: false,
  note: ""
});

const createInitialState = () => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  view: "dashboard",
  activeTournamentId: null,
  activeCharreadaId: null,
  scoringSuerteIdx: 0,
  scoringTeamIdx: 0,
	  scoringAttemptIdx: 0,
	  scoringColeadorIdx: 0,
	  ruleEditorSuerteId: "cala",
	  liveTimer: {
    running: false,
    startedAt: null,
    elapsedMs: 0,
    updatedAt: null
  },
  lastPublishedScore: null,
  tournaments: [],
  teams: [],
  charreadas: [],
  scores: {},
  publishedScores: [],
  statHistorySnapshots: [],
  migrationLog: [],
  settings: {
    googleSheetsUrl: "",
    lastSyncAt: null,
    graphicsConfig: DEFAULT_GRAPHICS_CONFIG,
    scoringButtonLayouts: {},
    globalRuleOverrides: {},
    globalRuleOverridesUpdatedAt: null
  }
});

export let state = createInitialState();

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function refreshTournamentCacheKeys(tournamentId = "") {
  const cleanTournamentId = getActiveTournamentCacheId(tournamentId || state?.activeTournamentId || "");
  STORAGE_KEY = getTournamentStateStorageKey(cleanTournamentId);
  LIVE_TIMER_KEY = getTournamentScopedStorageKey("live_timer_v1", cleanTournamentId);
  GLOBAL_RULES_STORAGE_KEY = getTournamentScopedStorageKey("global_rule_overrides_v1", cleanTournamentId);
  console.info("[local-cache-22B] cache key", {
    tournamentId: cleanTournamentId,
    storageKey: STORAGE_KEY
  });
  return cleanTournamentId;
}

export function getScopedLocalStorageKey(suffix = "", tournamentId = "") {
  return getTournamentScopedStorageKey(suffix, tournamentId || state?.activeTournamentId || getActiveTournamentCacheId());
}

export function loadState(tournamentId = "") {
  const cacheTournamentId = refreshTournamentCacheKeys(tournamentId);
  migrateLegacyTournamentCaches(cacheTournamentId);
  copyRemainingLegacyAuxiliaryCache(cacheTournamentId);
  console.info("[local-cache-22B] loading tournament cache", { tournamentId: cacheTournamentId, storageKey: STORAGE_KEY });
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state = createInitialState();
    if (cacheTournamentId && cacheTournamentId !== "sin_torneo") state.activeTournamentId = cacheTournamentId;
    state.settings = applyStoredGlobalRules(state.settings);
    saveState({ silent: true });
    verifyAndCleanupLegacyCache(state.activeTournamentId || cacheTournamentId, [state.activeTournamentId || cacheTournamentId]);
    console.info("[local-cache-22B] restore completed", { tournamentId: state.activeTournamentId || cacheTournamentId, empty: true });
    return state;
  }

  try {
    const parsed = migrateStoredState(JSON.parse(raw));
    const base = createInitialState();
    state = {
      ...base,
      ...parsed,
      tournaments: (parsed.tournaments || []).map(normalizeTournament),
      teams: (parsed.teams || []).map(normalizeTeam),
      charreadas: (parsed.charreadas || []).map(normalizeCharreada),
      publishedScores: normalizePublishedScores(parsed.publishedScores, parsed.lastPublishedScore),
      statHistorySnapshots: normalizeStatHistorySnapshots(parsed.statHistorySnapshots),
      migrationLog: Array.isArray(parsed.migrationLog) ? parsed.migrationLog : [],
      settings: {
        ...applyStoredGlobalRules({
          ...base.settings,
          ...(parsed.settings || {}),
          graphicsConfig: normalizeGraphicsConfig(parsed.settings?.graphicsConfig),
          scoringButtonLayouts: normalizeScoringButtonLayouts(parsed.settings?.scoringButtonLayouts)
        })
      }
    };
    if (cacheTournamentId && cacheTournamentId !== "sin_torneo" && !state.activeTournamentId) state.activeTournamentId = cacheTournamentId;
    if (parsed.__migrated) {
      delete state.__migrated;
      saveState({ silent: true });
    }
  } catch {
    state = createInitialState();
    if (cacheTournamentId && cacheTournamentId !== "sin_torneo") state.activeTournamentId = cacheTournamentId;
    state.settings = applyStoredGlobalRules(state.settings);
  }

  if (state.activeTournamentId) setActiveTournamentCacheId(state.activeTournamentId);
  refreshTournamentCacheKeys(state.activeTournamentId || cacheTournamentId);
  copyRemainingLegacyAuxiliaryCache(state.activeTournamentId || cacheTournamentId);
  verifyAndCleanupLegacyCache(state.activeTournamentId || cacheTournamentId, [state.activeTournamentId || cacheTournamentId]);
  console.info("[local-cache-22B] active tournament", state.activeTournamentId || "");
  console.info("[local-cache-22B] restore completed", { tournamentId: state.activeTournamentId || cacheTournamentId });
  return state;
}

function migrateLegacyTournamentCaches(preferredTournamentId = "") {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STATE_STORAGE_KEY);
    if (!legacyRaw) return;

    const legacyState = migrateStoredState(JSON.parse(legacyRaw));
    const tournamentIds = Array.from(new Set([
      preferredTournamentId,
      legacyState.activeTournamentId,
      ...(legacyState.tournaments || []).map((tournament) => tournament?.id)
    ].map(normalizeTournamentCacheId).filter((id) => id && id !== "sin_torneo")));

    if (!tournamentIds.length) return;

    const legacyTimerRaw = localStorage.getItem(LEGACY_LIVE_TIMER_KEY);
    const legacyRulesRaw = localStorage.getItem(LEGACY_GLOBAL_RULES_STORAGE_KEY);
    const legacyGraphicsRaw = localStorage.getItem(LEGACY_GRAPHICS_CONFIG_KEY);
    let migrationOk = true;

    tournamentIds.forEach((tournamentId) => {
      const key = getTournamentStateStorageKey(tournamentId);
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(scopeStateForTournament(legacyState, tournamentId)));
      }

      if (legacyRulesRaw) {
        const rulesKey = getTournamentScopedStorageKey("global_rule_overrides_v1", tournamentId);
        if (!localStorage.getItem(rulesKey)) localStorage.setItem(rulesKey, legacyRulesRaw);
      }

      if (legacyGraphicsRaw) {
        const graphicsKey = getTournamentScopedStorageKey("graphics_config_v1", tournamentId);
        if (!localStorage.getItem(graphicsKey)) localStorage.setItem(graphicsKey, legacyGraphicsRaw);
      }

      if (legacyTimerRaw && tournamentId === normalizeTournamentCacheId(legacyState.activeTournamentId || preferredTournamentId)) {
        const timerKey = getTournamentScopedStorageKey("live_timer_v1", tournamentId);
        if (!localStorage.getItem(timerKey)) localStorage.setItem(timerKey, legacyTimerRaw);
      }

      migrationOk = migrationOk && Boolean(localStorage.getItem(key));
    });

    const activeId = normalizeTournamentCacheId(legacyState.activeTournamentId || preferredTournamentId || tournamentIds[0]);
    setActiveTournamentCacheId(activeId);
    if (migrationOk) {
      console.info("[local-cache-22B] migration completed", {
        tournaments: tournamentIds.length,
        activeTournamentId: activeId
      });
      verifyAndCleanupLegacyCache(activeId, tournamentIds);
    }
  } catch {
    // Si la migracion legacy falla, se conserva la cache anterior para no perder datos.
  }
}

function verifyAndCleanupLegacyCache(activeTournamentId = "", tournamentIds = []) {
  if (!hasLegacyCacheKeys()) return;

  const cleanActiveId = normalizeTournamentCacheId(activeTournamentId || getActiveTournamentCacheId());
  const cleanTournamentIds = Array.from(new Set(
    [cleanActiveId, ...(tournamentIds || [])]
      .map(normalizeTournamentCacheId)
      .filter((id) => id && id !== "sin_torneo")
  ));
  if (!cleanTournamentIds.length) return;

  copyRemainingLegacyAuxiliaryCache(cleanActiveId);
  const verified = cleanTournamentIds.every((tournamentId) => Boolean(localStorage.getItem(getTournamentStateStorageKey(tournamentId))));
  if (!verified) return;

  console.info("[local-cache-22B1] legacy migration verified", {
    tournaments: cleanTournamentIds.length,
    activeTournamentId: cleanActiveId
  });
  removeLegacyCacheKeys();
  console.info("[local-cache-22B1] tournament sandbox active", { activeTournamentId: cleanActiveId });
}

function copyRemainingLegacyAuxiliaryCache(tournamentId = "") {
  const cleanTournamentId = normalizeTournamentCacheId(tournamentId);
  if (!cleanTournamentId || cleanTournamentId === "sin_torneo") return;

  try {
    const legacyRulesRaw = localStorage.getItem(LEGACY_GLOBAL_RULES_STORAGE_KEY);
    if (legacyRulesRaw) {
      const rulesKey = getTournamentScopedStorageKey("global_rule_overrides_v1", cleanTournamentId);
      if (!localStorage.getItem(rulesKey)) localStorage.setItem(rulesKey, legacyRulesRaw);
    }

    const legacyGraphicsRaw = localStorage.getItem(LEGACY_GRAPHICS_CONFIG_KEY);
    if (legacyGraphicsRaw) {
      const graphicsKey = getTournamentScopedStorageKey("graphics_config_v1", cleanTournamentId);
      if (!localStorage.getItem(graphicsKey)) localStorage.setItem(graphicsKey, legacyGraphicsRaw);
    }

    const legacyTimerRaw = localStorage.getItem(LEGACY_LIVE_TIMER_KEY);
    if (legacyTimerRaw) {
      const timerKey = getTournamentScopedStorageKey("live_timer_v1", cleanTournamentId);
      if (!localStorage.getItem(timerKey)) localStorage.setItem(timerKey, legacyTimerRaw);
    }
  } catch {
    // La migracion de auxiliares legacy no debe bloquear el estado principal por torneo.
  }
}

function scopeStateForTournament(source = {}, tournamentId = "") {
  const cleanTournamentId = normalizeTournamentCacheId(tournamentId);
  const tournament = (source.tournaments || []).find((item) => item?.id === cleanTournamentId) || null;
  const teams = (source.teams || []).filter((team) => team?.tournamentId === cleanTournamentId);
  const charreadas = (source.charreadas || []).filter((charreada) => charreada?.tournamentId === cleanTournamentId);
  const teamIds = new Set(teams.map((team) => team.id));
  const charreadaIds = new Set(charreadas.map((charreada) => charreada.id));
  const scores = Object.fromEntries(
    Object.entries(source.scores || {}).filter(([key]) => {
      const [charreadaId, teamId] = key.split("__");
      return charreadaIds.has(charreadaId) && teamIds.has(teamId);
    })
  );
  const publishedScores = (source.publishedScores || []).filter((record) => {
    const ids = getPublishedScoreIds(record);
    return ids.tournamentId === cleanTournamentId;
  });
  const statHistorySnapshots = (source.statHistorySnapshots || []).filter((record) => {
    return (record?.tournament?.id || record?.tournamentId || "") === cleanTournamentId;
  });
  const activeCharreadaId = charreadaIds.has(source.activeCharreadaId) ? source.activeCharreadaId : charreadas[0]?.id || null;

  return {
    ...createInitialState(),
    ...source,
    activeTournamentId: cleanTournamentId,
    activeCharreadaId,
    tournaments: tournament ? [tournament] : [],
    teams,
    charreadas,
    scores,
    publishedScores,
    statHistorySnapshots,
    lastPublishedScore: publishedScores.find((record) => record.id === source.lastPublishedScore?.id) || null,
    settings: {
      ...createInitialState().settings,
      ...(source.settings || {}),
      graphicsConfig: normalizeGraphicsConfig(source.settings?.graphicsConfig),
      scoringButtonLayouts: normalizeScoringButtonLayouts(source.settings?.scoringButtonLayouts)
    }
  };
}

function migrateStoredState(parsed = {}) {
  const schemaVersion = Number(parsed.schemaVersion || 1);
  if (schemaVersion >= CURRENT_SCHEMA_VERSION) return parsed;

  backupBeforeCalaMigration(parsed);
  const changes = [];

  Object.entries(parsed.scores || {}).forEach(([key, collection]) => {
    if (!key.endsWith("__cala")) return;
    flattenScoreCollection(collection).forEach((attempt) => {
      const attemptChanges = migrateCalaAttempt(attempt);
      attemptChanges.forEach((change) => changes.push(`${key}: ${change}`));
    });
  });

  if (parsed.settings?.globalRuleOverrides?.cala?.catalog) {
    parsed.settings.globalRuleOverrides.cala.catalog = normalizeCalaRuleOverrideCatalog(
      parsed.settings.globalRuleOverrides.cala.catalog
    );
    changes.push("Botonera general de Cala normalizada");
  }

  (parsed.tournaments || []).forEach((tournament) => {
    if (tournament?.ruleOverrides?.cala?.catalog) {
      tournament.ruleOverrides.cala.catalog = normalizeCalaRuleOverrideCatalog(tournament.ruleOverrides.cala.catalog);
      changes.push(`Botonera de Cala normalizada en ${tournament.name || tournament.id || "torneo"}`);
    }
  });

  parsed.schemaVersion = CURRENT_SCHEMA_VERSION;
  parsed.__migrated = true;
  parsed.migrationLog = Array.isArray(parsed.migrationLog) ? parsed.migrationLog : [];
  parsed.migrationLog.push({
    version: CURRENT_SCHEMA_VERSION,
    name: "cala_reglamento_base",
    migratedAt: new Date().toISOString(),
    changes
  });

  return parsed;
}

function backupBeforeCalaMigration(parsed) {
  try {
    const backupKey = getTournamentScopedStorageKey(CALA_MIGRATION_BACKUP_SUFFIX, parsed.activeTournamentId || state.activeTournamentId || getActiveTournamentCacheId());
    if (localStorage.getItem(backupKey)) return;
    localStorage.setItem(backupKey, JSON.stringify({
      backedUpAt: new Date().toISOString(),
      state: parsed
    }));
  } catch {
    // Si el respaldo local falla, la migracion sigue siendo conservadora y no toca publicados.
  }
}

function flattenScoreCollection(collection) {
  if (!Array.isArray(collection)) return [];
  if (Array.isArray(collection[0])) return collection.flat().filter(Boolean);
  return collection.filter(Boolean);
}

function normalizeTeam(team = {}) {
  return {
    ...team,
    participantName: String(team.participantName || "").trim(),
    horseName: String(team.horseName || "").trim(),
    category: cleanCategory(team.category)
  };
}

function normalizeCharreada(charreada = {}) {
  const phase = String(charreada.phase || charreada.fase || "").trim();
  if (phase) console.info("[program-fase-001] phase restored", { charreadaId: charreada.id || "", phase });
  return {
    ...charreada,
    phase,
    status: normalizeCharreadaStatus(charreada.status)
  };
}

function normalizePublishedScores(records = [], lastPublishedScore = null) {
  const normalized = (Array.isArray(records) ? records : [])
    .map(normalizePublishedScore)
    .filter((record) => record.attemptKey);

  if (!normalized.length && lastPublishedScore) {
    const fallback = normalizePublishedScore(lastPublishedScore);
    if (fallback.attemptKey) normalized.push(fallback);
  }

  return normalized;
}

function normalizePublishedScore(record = {}) {
  const attemptKey = record.attemptKey || getPublishedAttemptKey(record);
  return {
    ...record,
    id: String(record.id || uid("publicado")),
    attemptKey,
    publishedAt: record.publishedAt || new Date().toISOString(),
    revision: Math.max(1, Number(record.revision || 1)),
    correction: Boolean(record.correction),
    correctedRecordId: record.correctedRecordId || "",
    previousTotal: record.previousTotal === null || record.previousTotal === undefined ? null : Number(record.previousTotal || 0),
    superseded: Boolean(record.superseded),
    supersededBy: record.supersededBy || "",
    supersededAt: record.supersededAt || "",
    total: Number(record.total || 0)
  };
}

function normalizeStatHistorySnapshots(records = []) {
  return (Array.isArray(records) ? records : [])
    .filter((record) => record && typeof record === "object" && record.tournament?.id)
    .map((record) => ({
      ...record,
      id: String(record.id || uid("historial")),
      generatedAt: record.generatedAt || new Date().toISOString(),
      schemaVersion: Number(record.schemaVersion || 1)
    }));
}

function normalizeTournament(tournament = {}) {
  return {
    ...tournament,
    season: normalizeSeason(tournament.season || tournament.date),
    type: normalizeTournamentType(tournament.type),
    individualAwardPlaces: cleanAwardPlaces(tournament.individualAwardPlaces),
    ruleOverrides: normalizeRuleOverrides(tournament.ruleOverrides),
    scoringButtonLayouts: normalizeScoringButtonLayouts(tournament.scoringButtonLayouts),
    status: normalizeTournamentStatus(tournament.status)
  };
}

function normalizeRuleOverrides(ruleOverrides = {}) {
  if (!ruleOverrides || typeof ruleOverrides !== "object") return {};
  return Object.fromEntries(
    Object.entries(ruleOverrides)
      .filter(([suerteId, override]) => suerteId && override && typeof override === "object")
      .map(([suerteId, override]) => [
        suerteId,
        {
          ...override,
          catalog: normalizeOverrideCatalog(suerteId === "cala"
            ? normalizeCalaRuleOverrideCatalog(override.catalog)
            : override.catalog)
        }
      ])
  );
}

function normalizeOverrideCatalog(catalog = {}) {
  if (!catalog || typeof catalog !== "object") return {};
  return Object.fromEntries(
    ["base", "adic", "infr", "desc"].map((group) => [
      group,
      Array.isArray(catalog[group]) ? catalog[group].map(normalizeRuleOverride) : []
    ])
  );
}

function normalizeRuleOverride(rule = {}) {
  return {
    id: String(rule.id || uid("rule")),
    label: String(rule.label || "").trim() || "Sin nombre",
    pts: Number(rule.pts || 0),
    enabled: rule.enabled !== false,
    custom: Boolean(rule.custom)
  };
}

function applyStoredGlobalRules(settings = {}) {
  const stored = readStoredGlobalRuleOverrides();
  const local = {
    ruleOverrides: normalizeRuleOverrides(settings.globalRuleOverrides),
    updatedAt: settings.globalRuleOverridesUpdatedAt || null
  };
  const source = stored && isTimestampAfter(stored.updatedAt, local.updatedAt) ? stored : local;

  return {
    ...settings,
    globalRuleOverrides: normalizeRuleOverrides(source.ruleOverrides),
    globalRuleOverridesUpdatedAt: source.updatedAt || null
  };
}

function readStoredGlobalRuleOverrides() {
  try {
    const raw = localStorage.getItem(GLOBAL_RULES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ruleOverrides: normalizeRuleOverrides(parsed.ruleOverrides || {}),
      updatedAt: parsed.updatedAt || null
    };
  } catch {
    return null;
  }
}

function persistGlobalRuleOverrides() {
  try {
    const stored = readStoredGlobalRuleOverrides();
    const updatedAt = state.settings?.globalRuleOverridesUpdatedAt || null;
    if (stored && isTimestampAfter(stored.updatedAt, updatedAt)) return;

    localStorage.setItem(
      GLOBAL_RULES_STORAGE_KEY,
      JSON.stringify({
        updatedAt,
        ruleOverrides: normalizeRuleOverrides(state.settings?.globalRuleOverrides)
      })
    );
  } catch {
    // La app puede seguir trabajando aunque el navegador no permita guardar esta copia extra.
  }
}

export function setGlobalRuleOverrides(ruleOverrides = {}, updatedAt = null) {
  state.settings.globalRuleOverrides = normalizeRuleOverrides(ruleOverrides);
  state.settings.globalRuleOverridesUpdatedAt = updatedAt || new Date().toISOString();
  persistGlobalRuleOverrides();
}

function isTimestampAfter(left, right) {
  const leftTime = Date.parse(left || "");
  const rightTime = Date.parse(right || "");
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime > rightTime;
  return Number.isFinite(leftTime) && !Number.isFinite(rightTime);
}

function cleanCategory(category) {
  const value = String(category || "").trim();
  return value || "Libre";
}

function cleanAwardPlaces(value) {
  const places = Math.round(Number(value || 5));
  if (!Number.isFinite(places)) return 5;
  return Math.max(1, Math.min(20, places));
}

function normalizeSeason(value) {
  const clean = String(value || "").trim();
  const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) return yearMatch[1];
  return new Date().getFullYear().toString();
}

function normalizeTournamentStatus(status) {
  const clean = String(status || "").trim();
  if (["preparacion", "en_vivo", "finalizado", "congelado"].includes(clean)) return clean;
  return "preparacion";
}

function normalizeCharreadaStatus(status) {
  const clean = String(status || "").trim();
  if (["programada", "en_vivo", "finalizada", "congelada"].includes(clean)) return clean;
  return "programada";
}

export function saveState(options = {}) {
  const cacheTournamentId = refreshTournamentCacheKeys(state.activeTournamentId || getActiveTournamentCacheId());
  const payload = cacheTournamentId && cacheTournamentId !== "sin_torneo"
    ? scopeStateForTournament(state, cacheTournamentId)
    : state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (state.activeTournamentId) setActiveTournamentCacheId(state.activeTournamentId);
  persistGlobalRuleOverrides();
  verifyAndCleanupLegacyCache(cacheTournamentId, [cacheTournamentId]);
  if (!options.silent) publishLiveUpdate();
}

export function publishLiveUpdate() {
  const detail = {
    at: new Date().toISOString(),
    state
  };

  window.dispatchEvent(new CustomEvent("charropro:state", { detail }));

  try {
    localStorage.setItem(`${STORAGE_KEY}_live_ping`, JSON.stringify({ at: detail.at }));
  } catch {
    // El guardado principal ya ocurrio; este ping solo avisa a otras pantallas.
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(LIVE_CHANNEL);
    channel.postMessage(detail);
    channel.close();
  }
}

export function subscribeToLiveUpdates(callback) {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === `${STORAGE_KEY}_live_ping`) {
      loadState();
      callback(state);
    }
  };

  window.addEventListener("storage", onStorage);

  let channel = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(LIVE_CHANNEL);
    channel.onmessage = () => {
      loadState();
      callback(state);
    };
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    if (channel) channel.close();
  };
}

export function setView(view) {
  state.view = view;
  saveState({ silent: true });
}

export function setActiveTournament(tournamentId) {
  const cleanTournamentId = normalizeTournamentCacheId(tournamentId);
  if (!cleanTournamentId || cleanTournamentId === "sin_torneo") return;

  const previousState = state;
  const previousTournaments = Array.isArray(previousState.tournaments) ? previousState.tournaments : [];
  if (previousState.activeTournamentId && previousState.activeTournamentId !== cleanTournamentId) saveState({ silent: true });

  setActiveTournamentCacheId(cleanTournamentId);
  refreshTournamentCacheKeys(cleanTournamentId);

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = migrateStoredState(JSON.parse(raw));
      const base = createInitialState();
      state = {
        ...base,
        ...parsed,
        tournaments: mergeTournamentLists(previousTournaments, (parsed.tournaments || []).map(normalizeTournament)),
        teams: (parsed.teams || []).map(normalizeTeam),
        charreadas: (parsed.charreadas || []).map(normalizeCharreada),
        publishedScores: normalizePublishedScores(parsed.publishedScores, parsed.lastPublishedScore),
        statHistorySnapshots: normalizeStatHistorySnapshots(parsed.statHistorySnapshots),
        migrationLog: Array.isArray(parsed.migrationLog) ? parsed.migrationLog : [],
        settings: {
          ...applyStoredGlobalRules({
            ...base.settings,
            ...(parsed.settings || {}),
            graphicsConfig: normalizeGraphicsConfig(parsed.settings?.graphicsConfig),
            scoringButtonLayouts: normalizeScoringButtonLayouts(parsed.settings?.scoringButtonLayouts)
          })
        }
      };
    } catch {
      state = createInitialState();
    }
  } else {
    const selectedTournament = previousTournaments.find((item) => item.id === cleanTournamentId) || null;
    state = {
      ...createInitialState(),
      view: previousState.view || "dashboard",
      settings: {
        ...createInitialState().settings,
        ...(previousState.settings || {})
      },
      tournaments: selectedTournament ? mergeTournamentLists(previousTournaments, [selectedTournament]) : previousTournaments
    };
  }

  state.activeTournamentId = cleanTournamentId;
  const tournamentCharreadas = state.charreadas.filter((item) => item.tournamentId === cleanTournamentId);
  const activeCharreadaExists = tournamentCharreadas.some((item) => item.id === state.activeCharreadaId);
  if (!activeCharreadaExists) state.activeCharreadaId = tournamentCharreadas[0]?.id || null;
  saveState({ silent: true });
  console.info("[local-cache-22B] active tournament", cleanTournamentId);
}

function mergeTournamentLists(primary = [], secondary = []) {
  const records = new Map();
  [...primary, ...secondary].forEach((tournament) => {
    if (!tournament?.id) return;
    records.set(tournament.id, normalizeTournament({ ...(records.get(tournament.id) || {}), ...tournament }));
  });
  return Array.from(records.values());
}

export function getActiveTournament() {
  return state.tournaments.find((item) => item.id === state.activeTournamentId) || null;
}

export function getActiveCharreada() {
  return state.charreadas.find((item) => item.id === state.activeCharreadaId) || null;
}

export function getTeam(teamId) {
  return state.teams.find((team) => team.id === teamId) || null;
}

export function getTournamentTeams(tournamentId = state.activeTournamentId) {
  return state.teams.filter((team) => team.tournamentId === tournamentId);
}

export function getTournamentCharreadas(tournamentId = state.activeTournamentId) {
  return state.charreadas.filter((charreada) => charreada.tournamentId === tournamentId);
}

export function ensureScoresForCharreada(charreadaId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!charreada) return;
  const tournament = state.tournaments.find((item) => item.id === charreada.tournamentId) || null;
  const suertes = getTournamentSuertes(tournament, state.settings.globalRuleOverrides);

  charreada.teamIds.forEach((teamId) => {
    suertes.forEach((suerte) => {
      const key = scoreKey(charreadaId, teamId, suerte.id);
      if (state.scores[key]) return;
      state.scores[key] = createScoreCollection(suerte);
    });
  });

  saveState({ silent: true });
}

export function createScoreCollection(suerte) {
  if (suerte.type === "coleadero") {
    return Array.from({ length: 3 }, () =>
      Array.from({ length: suerte.attempts }, () => emptyAttempt())
    );
  }

  return Array.from({ length: suerte.attempts }, () => emptyAttempt());
}

export function scoreKey(charreadaId, teamId, suerteId) {
  return `${charreadaId}__${teamId}__${suerteId}`;
}

export function getCurrentAttempt() {
  const charreada = getActiveCharreada();
  if (!charreada) return null;

  const tournament = state.tournaments.find((item) => item.id === charreada.tournamentId) || null;
  const suertes = getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
  if (state.scoringSuerteIdx >= suertes.length) state.scoringSuerteIdx = 0;
  const teamId = charreada.teamIds[state.scoringTeamIdx];
  const suerte = suertes[state.scoringSuerteIdx];
  if (!suerte) return null;
  const key = scoreKey(charreada.id, teamId, suerte.id);
  const collection = state.scores[key] || createScoreCollection(suerte);
  state.scores[key] = collection;

  if (suerte.type === "coleadero") {
    if (tournament?.type === "coleadero") state.scoringColeadorIdx = 0;
    return collection[state.scoringColeadorIdx][state.scoringAttemptIdx];
  }

  return collection[state.scoringAttemptIdx];
}

export function getCurrentContext() {
  const charreada = getActiveCharreada();
  const tournament = getActiveTournament();
  if (!charreada) return null;

  const suertes = getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
  if (state.scoringSuerteIdx >= suertes.length) state.scoringSuerteIdx = 0;
  const suerte = suertes[state.scoringSuerteIdx];
  if (!suerte) return null;
  const teamId = charreada.teamIds[state.scoringTeamIdx];
  const team = getTeam(teamId);
  const attempt = getCurrentAttempt();

  return {
    tournament,
    charreada,
    suerte,
    team,
    attempt,
    teamIndex: state.scoringTeamIdx,
    attemptIndex: state.scoringAttemptIdx,
    coleadorIndex: state.scoringColeadorIdx
  };
}

export function resetAllData() {
  const globalRuleOverrides = state.settings.globalRuleOverrides || {};
  const globalRuleOverridesUpdatedAt = state.settings.globalRuleOverridesUpdatedAt || null;
  const scoringButtonLayouts = state.settings.scoringButtonLayouts || {};
  state = createInitialState();
  state.settings.globalRuleOverrides = globalRuleOverrides;
  state.settings.globalRuleOverridesUpdatedAt = globalRuleOverridesUpdatedAt;
  state.settings.scoringButtonLayouts = scoringButtonLayouts;
  saveState();
}

export function recordPublishedScore(score = {}) {
  const attemptKey = getPublishedAttemptKey(score);
  if (!attemptKey) return null;

  const now = score.publishedAt || new Date().toISOString();
  if (!Array.isArray(state.publishedScores)) state.publishedScores = [];

  const previousRecords = state.publishedScores.filter((record) => record.attemptKey === attemptKey);
  const activePrevious = [...previousRecords].reverse().find((record) => !record.superseded) || null;
  const record = normalizePublishedScore({
    ...score,
    id: score.id || uid("publicado"),
    attemptKey,
    publishedAt: now,
    revision: previousRecords.length + 1,
    correction: Boolean(activePrevious),
    correctedRecordId: activePrevious?.id || "",
    previousTotal: activePrevious ? Number(activePrevious.total || 0) : null,
    superseded: false,
    supersededBy: "",
    supersededAt: ""
  });

  state.publishedScores.forEach((item) => {
    if (item.attemptKey !== attemptKey || item.superseded) return;
    item.superseded = true;
    item.supersededBy = record.id;
    item.supersededAt = record.publishedAt;
  });

  state.publishedScores.push(record);
  state.lastPublishedScore = record;
  return record;
}

export function removePublishedScoresFor(filters = {}) {
  if (!Array.isArray(state.publishedScores)) state.publishedScores = [];
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  if (!activeFilters.length) return;

  state.publishedScores = state.publishedScores.filter((record) => {
    const ids = getPublishedScoreIds(record);
    return !activeFilters.every(([key, value]) => ids[key] === value);
  });

  if (state.lastPublishedScore) {
    const ids = getPublishedScoreIds(state.lastPublishedScore);
    const shouldClearLast = activeFilters.every(([key, value]) => ids[key] === value);
    if (shouldClearLast) state.lastPublishedScore = null;
  }
}

export function recordStatHistorySnapshot(snapshot = {}) {
  if (!snapshot?.tournament?.id) return null;
  if (!Array.isArray(state.statHistorySnapshots)) state.statHistorySnapshots = [];
  const tournamentId = snapshot.tournament.id;

  const record = {
    ...snapshot,
    id: `historial_${tournamentId}`,
    generatedAt: snapshot.generatedAt || new Date().toISOString(),
    schemaVersion: Number(snapshot.schemaVersion || 1)
  };

  state.statHistorySnapshots = state.statHistorySnapshots.filter((item) => {
    return (item.tournament?.id || item.tournamentId || "") !== tournamentId;
  });
  state.statHistorySnapshots.push(record);
  return record;
}

export function getLatestStatHistorySnapshot(tournamentId = state.activeTournamentId) {
  return (state.statHistorySnapshots || [])
    .filter((record) => record.tournament?.id === tournamentId)
    .slice()
    .sort((a, b) => Date.parse(b.generatedAt || "") - Date.parse(a.generatedAt || ""))[0] || null;
}

export function getPublishedAttemptKey(record = {}) {
  const ids = getPublishedScoreIds(record);
  if (!ids.tournamentId || !ids.charreadaId || !ids.teamId || !ids.suerteId) return "";
  return [
    ids.tournamentId,
    ids.charreadaId,
    ids.teamId,
    ids.suerteId,
    Number(record.attemptIndex || 0),
    Number(record.coleadorIndex || 0)
  ].join("__");
}

function getPublishedScoreIds(record = {}) {
  return {
    tournamentId: record.tournament?.id || record.tournamentId || "",
    charreadaId: record.charreada?.id || record.charreadaId || "",
    teamId: record.team?.id || record.teamId || "",
    suerteId: record.suerte?.id || record.suerteId || ""
  };
}

export function createRoster(prefix = "") {
  return {
    cala: `${prefix} Cala`.trim(),
    piales: `${prefix} Piales`.trim(),
    colas: [
      `${prefix} Coleador 1`.trim(),
      `${prefix} Coleador 2`.trim(),
      `${prefix} Coleador 3`.trim()
    ],
    toro: `${prefix} Jinete Toro`.trim(),
    lazo: `${prefix} Lazo Cabeza`.trim(),
    pial_ruedo: `${prefix} Pial Ruedo`.trim(),
    terna: [
      `${prefix} Lazo Cabeza`.trim(),
      `${prefix} Pial Ruedo`.trim(),
      `${prefix} Tercer Terna`.trim()
    ],
    yegua: `${prefix} Jinete Yegua`.trim(),
    manganas_pie: `${prefix} Mangana Pie`.trim(),
    manganas_caballo: `${prefix} Mangana Caballo`.trim(),
    paso: `${prefix} Paso`.trim()
  };
}
