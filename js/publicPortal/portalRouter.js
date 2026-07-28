export const PUBLIC_PORTAL_VIEWS = Object.freeze([
  "inicio",
  "en-vivo",
  "programa",
  "competencias",
  "resultados",
  "sabana"
]);
export const PUBLIC_PORTAL_FEED_FILTERS = Object.freeze(["all", "score", "turn", "penalty", "timer"]);

const VIEW_SET = new Set(PUBLIC_PORTAL_VIEWS);
const ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,180}$/;
const UNSAFE_ID_PATTERN = /^(?:javascript|data|file|vbscript):|(?:^|[./:@-])(?:__proto__|prototype|constructor)(?:$|[./:@-])/i;
const TOURNAMENT_ALIASES = Object.freeze([
  "tournamentId",
  "canal",
  "channel",
  "id",
  "torneo",
  "tournament",
  "evento",
  "event"
]);

export function parsePublicPortalRoute(input, fallback = {}) {
  const url = toUrl(input);
  const params = url.searchParams;
  const requestedView = sanitizePortalView(params.get("view"));
  return {
    tournamentId: firstPortalId(params, TOURNAMENT_ALIASES) || sanitizePortalId(fallback.tournamentId),
    view: requestedView || sanitizePortalView(fallback.view) || "inicio",
    competitionId: sanitizePortalId(params.get("competitionId") || params.get("competition")),
    categoryId: sanitizePortalId(params.get("categoryId")),
    phaseId: sanitizePortalId(params.get("phaseId")),
    charreadaId: sanitizePortalId(params.get("charreadaId")),
    programDay: sanitizePortalDay(params.get("day")),
    programPhaseId: sanitizePortalId(params.get("phase")),
    feed: sanitizePortalFeedFilter(params.get("feed"))
  };
}

export function buildPublicPortalUrl(input, patch = {}) {
  const url = toUrl(input);
  const current = parsePublicPortalRoute(url);
  const next = {
    ...current,
    ...sanitizeRoutePatch(patch)
  };
  setParam(url.searchParams, "tournamentId", next.tournamentId);
  setParam(url.searchParams, "view", next.view === "inicio" ? "" : next.view);
  setParam(url.searchParams, "competitionId", next.competitionId);
  setParam(url.searchParams, "categoryId", next.categoryId);
  setParam(url.searchParams, "phaseId", next.phaseId);
  setParam(url.searchParams, "charreadaId", next.charreadaId);
  setParam(url.searchParams, "day", next.programDay);
  setParam(url.searchParams, "phase", next.programPhaseId);
  setParam(url.searchParams, "feed", next.feed === "all" ? "" : next.feed);
  url.searchParams.delete("competition");
  for (const alias of TOURNAMENT_ALIASES) {
    if (alias !== "tournamentId") url.searchParams.delete(alias);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function sanitizePortalView(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return VIEW_SET.has(normalized) ? normalized : "";
}

export function sanitizePortalId(value) {
  const normalized = String(value || "").trim();
  return ID_PATTERN.test(normalized) && !UNSAFE_ID_PATTERN.test(normalized) ? normalized : "";
}

export function sanitizePortalDay(value) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return "";
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  ) ? normalized : "";
}

export function isPublicPortalView(value) {
  return VIEW_SET.has(String(value || ""));
}

export function sanitizePortalFeedFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PUBLIC_PORTAL_FEED_FILTERS.includes(normalized) ? normalized : "all";
}

function sanitizeRoutePatch(patch) {
  const clean = {};
  if (Object.prototype.hasOwnProperty.call(patch, "tournamentId")) {
    clean.tournamentId = sanitizePortalId(patch.tournamentId);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "view")) {
    clean.view = sanitizePortalView(patch.view) || "inicio";
  }
  for (const key of ["competitionId", "categoryId", "phaseId", "charreadaId"]) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) clean[key] = sanitizePortalId(patch[key]);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "programDay")) {
    clean.programDay = sanitizePortalDay(patch.programDay);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "programPhaseId")) {
    clean.programPhaseId = sanitizePortalId(patch.programPhaseId);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "feed")) {
    clean.feed = sanitizePortalFeedFilter(patch.feed);
  }
  return clean;
}

function firstPortalId(params, keys) {
  for (const key of keys) {
    const value = sanitizePortalId(params.get(key));
    if (value) return value;
  }
  return "";
}

function setParam(params, key, value) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function toUrl(input) {
  if (input instanceof URL) return new URL(input.toString());
  const value = String(input || "");
  try {
    return new URL(value || "/", "https://charropro.local");
  } catch (error) {
    return new URL("/", "https://charropro.local");
  }
}
