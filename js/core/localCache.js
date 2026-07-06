export const LEGACY_STATE_STORAGE_KEY = "charropro_organizado_v1";
export const LEGACY_STATE_LIVE_PING_KEY = `${LEGACY_STATE_STORAGE_KEY}_live_ping`;
export const LEGACY_LIVE_TIMER_KEY = "charropro_live_timer_v1";
export const LEGACY_GLOBAL_RULES_STORAGE_KEY = "charropro_global_rule_overrides_v1";
export const LEGACY_GRAPHICS_CONFIG_KEY = "charropro_graphics_config_v1";
export const LEGACY_SYNC_OWNER_KEY = "charropro_sync_owner_v1";
export const LEGACY_PREPARE_STATUS_KEY = "charropro_prepare_status_v1";
export const LEGACY_PREPARE_DIAGNOSTICS_KEY = "charropro_prepare_status_v1_diagnostics";
export const ACTIVE_TOURNAMENT_CACHE_KEY = "charropro_tournament_active_v1";

const DEFAULT_TOURNAMENT_SCOPE = "sin_torneo";
const LEGACY_LOCAL_STORAGE_KEYS = [
  LEGACY_STATE_STORAGE_KEY,
  LEGACY_STATE_LIVE_PING_KEY,
  LEGACY_LIVE_TIMER_KEY,
  LEGACY_GLOBAL_RULES_STORAGE_KEY,
  LEGACY_GRAPHICS_CONFIG_KEY,
  LEGACY_SYNC_OWNER_KEY,
  LEGACY_PREPARE_DIAGNOSTICS_KEY
];
const LEGACY_SESSION_STORAGE_KEYS = [
  LEGACY_PREPARE_STATUS_KEY
];

export function normalizeTournamentCacheId(value = "") {
  const clean = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean || DEFAULT_TOURNAMENT_SCOPE;
}

export function getUrlTournamentCacheId() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeTournamentCacheId(
      params.get("tournamentId") ||
        params.get("canal") ||
        params.get("channel") ||
        params.get("id") ||
        params.get("torneo") ||
        params.get("tournament") ||
        params.get("evento") ||
        params.get("event") ||
        ""
    );
  } catch {
    return "";
  }
}

export function getStoredActiveTournamentCacheId() {
  if (typeof localStorage === "undefined") return "";
  try {
    return normalizeTournamentCacheId(localStorage.getItem(ACTIVE_TOURNAMENT_CACHE_KEY) || "");
  } catch {
    return "";
  }
}

export function getActiveTournamentCacheId(fallback = "") {
  const cleanFallback = normalizeTournamentCacheId(fallback);
  if (cleanFallback && cleanFallback !== DEFAULT_TOURNAMENT_SCOPE) return cleanFallback;

  const urlId = getUrlTournamentCacheId();
  if (urlId && urlId !== DEFAULT_TOURNAMENT_SCOPE) return urlId;

  const storedId = getStoredActiveTournamentCacheId();
  if (storedId && storedId !== DEFAULT_TOURNAMENT_SCOPE) return storedId;

  return DEFAULT_TOURNAMENT_SCOPE;
}

export function setActiveTournamentCacheId(tournamentId = "") {
  if (typeof localStorage === "undefined") return;
  const clean = normalizeTournamentCacheId(tournamentId);
  if (!clean || clean === DEFAULT_TOURNAMENT_SCOPE) return;
  try {
    localStorage.setItem(ACTIVE_TOURNAMENT_CACHE_KEY, clean);
  } catch {
    // El aislamiento local no debe bloquear la operacion si el navegador restringe storage.
  }
}

export function getTournamentStateStorageKey(tournamentId = "") {
  return `charropro_tournament_${normalizeTournamentCacheId(tournamentId)}`;
}

export function getTournamentScopedStorageKey(suffix = "", tournamentId = "") {
  const cleanSuffix = String(suffix || "")
    .trim()
    .replace(/^charropro_/, "")
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${getTournamentStateStorageKey(tournamentId)}_${cleanSuffix || "cache"}`;
}

export function hasLegacyCacheKeys() {
  try {
    if (typeof localStorage !== "undefined" && LEGACY_LOCAL_STORAGE_KEYS.some((key) => localStorage.getItem(key) !== null)) return true;
  } catch {
    return false;
  }

  try {
    if (typeof sessionStorage !== "undefined" && LEGACY_SESSION_STORAGE_KEYS.some((key) => sessionStorage.getItem(key) !== null)) return true;
  } catch {
    return false;
  }

  return false;
}

export function removeLegacyCacheKeys() {
  if (!hasLegacyCacheKeys()) return 0;
  console.info("[local-cache-22B1] removing legacy cache");
  let removed = 0;

  try {
    LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
      if (localStorage.getItem(key) === null) return;
      localStorage.removeItem(key);
      removed += 1;
    });
  } catch {
    // La limpieza legacy no debe bloquear la cache nueva por torneo.
  }

  try {
    LEGACY_SESSION_STORAGE_KEYS.forEach((key) => {
      if (sessionStorage.getItem(key) === null) return;
      sessionStorage.removeItem(key);
      removed += 1;
    });
  } catch {
    // La limpieza legacy no debe bloquear la cache nueva por torneo.
  }

  console.info("[local-cache-22B1] legacy cleanup completed", { removed });
  return removed;
}

export function clearTournamentSandboxStorage(tournamentId = "") {
  const cleanTournamentId = normalizeTournamentCacheId(tournamentId);
  let removed = 0;

  try {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) keys.push(key);
    }

    keys.forEach((key) => {
      if (!key.startsWith("charropro_tournament_") && !LEGACY_LOCAL_STORAGE_KEYS.includes(key)) return;
      localStorage.removeItem(key);
      removed += 1;
    });

    if (cleanTournamentId && cleanTournamentId !== DEFAULT_TOURNAMENT_SCOPE) {
      localStorage.setItem(ACTIVE_TOURNAMENT_CACHE_KEY, cleanTournamentId);
    }
  } catch {
    // La preparacion no debe bloquearse si el navegador restringe una llave local.
  }

  try {
    const keys = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key) keys.push(key);
    }

    keys.forEach((key) => {
      if (!key.startsWith("charropro_tournament_") && !LEGACY_SESSION_STORAGE_KEYS.includes(key)) return;
      sessionStorage.removeItem(key);
      removed += 1;
    });
  } catch {
    // La preparacion no debe bloquearse si el navegador restringe sessionStorage.
  }

  return removed;
}
