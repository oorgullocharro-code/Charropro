import { LEGACY_GRAPHICS_CONFIG_KEY, getActiveTournamentCacheId, getTournamentScopedStorageKey } from "./localCache.js?v=20260708-recovery-001b-panel-status1";

export const GRAPHICS_CONFIG_KEY = "graphics_config_v1";

export const DEFAULT_GRAPHICS_CONFIG = {
  logoImage: "./assets/obs/logo-och-dorado.png",
  barImage: "./assets/obs/barra.png",
  accentColor: "#d4b15a",
  textColor: "#fff7dc",
  scoreColor: "#ffffff",
  panelColor: "rgba(8, 22, 12, .94)",
  mutedColor: "#d7c79a",
  glowColor: "rgba(255, 221, 116, .72)",
  fontFamily: "Cinzel, Georgia, serif",
  scoreboardScale: 1,
  timerScale: 1,
  turnScale: 1,
  maxTeams: 3,
  showLogo: true
};

export function normalizeGraphicsConfig(config = {}) {
  const source = config && typeof config === "object" ? config : {};
  return {
    ...DEFAULT_GRAPHICS_CONFIG,
    ...source,
    logoImage: normalizeLogoImage(source.logoImage),
    scoreboardScale: clampNumber(source.scoreboardScale, DEFAULT_GRAPHICS_CONFIG.scoreboardScale, 0.2, 3),
    timerScale: clampNumber(source.timerScale, DEFAULT_GRAPHICS_CONFIG.timerScale, 0.2, 3),
    turnScale: clampNumber(source.turnScale, DEFAULT_GRAPHICS_CONFIG.turnScale, 0.2, 3),
    maxTeams: Math.round(clampNumber(source.maxTeams, DEFAULT_GRAPHICS_CONFIG.maxTeams, 1, 8)),
    showLogo: source.showLogo === undefined ? DEFAULT_GRAPHICS_CONFIG.showLogo : Boolean(source.showLogo)
  };
}

function normalizeLogoImage(value) {
  const raw = String(value || "").trim();
  if (!raw || /\/?(logo1|logo3)\.png(?:$|\?)/i.test(raw)) return DEFAULT_GRAPHICS_CONFIG.logoImage;
  return raw;
}

export function readLocalGraphicsConfig() {
  try {
    const key = getGraphicsConfigStorageKey();
    let raw = localStorage.getItem(key);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_GRAPHICS_CONFIG_KEY);
      if (raw) {
        localStorage.setItem(key, raw);
        localStorage.removeItem(LEGACY_GRAPHICS_CONFIG_KEY);
      }
    }
    return raw ? normalizeGraphicsConfig(JSON.parse(raw)) : normalizeGraphicsConfig();
  } catch {
    return normalizeGraphicsConfig();
  }
}

export function writeLocalGraphicsConfig(config) {
  const normalized = normalizeGraphicsConfig(config);
  localStorage.setItem(getGraphicsConfigStorageKey(), JSON.stringify(normalized));
  return normalized;
}

function getGraphicsConfigStorageKey() {
  return getTournamentScopedStorageKey(GRAPHICS_CONFIG_KEY, getActiveTournamentCacheId());
}

export function applyGraphicsConfig(config, target = document.documentElement) {
  const normalized = normalizeGraphicsConfig(config);
  const style = target.style;
  style.setProperty("--graphic-logo-image", cssUrl(resolveAssetUrl(normalized.logoImage)));
  style.setProperty("--graphic-bar-image", cssUrl(resolveAssetUrl(normalized.barImage)));
  style.setProperty("--graphic-accent", normalized.accentColor);
  style.setProperty("--graphic-text", normalized.textColor);
  style.setProperty("--graphic-score", normalized.scoreColor);
  style.setProperty("--graphic-panel", normalized.panelColor);
  style.setProperty("--graphic-muted", normalized.mutedColor);
  style.setProperty("--graphic-glow", normalized.glowColor);
  style.setProperty("--graphic-font", normalized.fontFamily);
  style.setProperty("--graphic-scoreboard-scale", String(normalized.scoreboardScale));
  style.setProperty("--graphic-timer-scale", String(normalized.timerScale));
  style.setProperty("--graphic-turn-scale", String(normalized.turnScale));
  return normalized;
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function cssUrl(value) {
  const safe = String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "");
  return `url("${safe}")`;
}

function resolveAssetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(raw)) return raw;

  try {
    return new URL(raw, window.location.href).href;
  } catch {
    return raw;
  }
}
