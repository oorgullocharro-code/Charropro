export const PORTAL_V2_VIEWS = Object.freeze([
  "en-vivo", "programa", "resultados", "posiciones", "sabana", "estadisticas"
]);

const VIEW_SET = new Set(PORTAL_V2_VIEWS);
const ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,180}$/;
const UNSAFE_ID_PATTERN = /^(?:javascript|data|file|vbscript):|(?:^|[./:@-])(?:__proto__|prototype|constructor)(?:$|[./:@-])/i;
const TOURNAMENT_ALIASES = Object.freeze([
  "tournamentId", "canal", "channel", "id", "torneo", "tournament", "evento", "event"
]);

export function parsePortalV2Route(input, fallback = {}) {
  const url = toUrl(input);
  const params = url.searchParams;
  return {
    tournamentId: firstTournamentId(params) || sanitizePortalV2Id(fallback.tournamentId),
    view: sanitizePortalV2View(params.get("view")) || sanitizePortalV2View(fallback.view) || "en-vivo"
  };
}

export function buildPortalV2Url(input, patch = {}) {
  const url = toUrl(input);
  const current = parsePortalV2Route(url);
  const tournamentId = Object.prototype.hasOwnProperty.call(patch, "tournamentId")
    ? sanitizePortalV2Id(patch.tournamentId)
    : current.tournamentId;
  const view = Object.prototype.hasOwnProperty.call(patch, "view")
    ? sanitizePortalV2View(patch.view) || "en-vivo"
    : current.view;
  setParam(url.searchParams, "tournamentId", tournamentId);
  setParam(url.searchParams, "view", view === "en-vivo" ? "" : view);
  for (const alias of TOURNAMENT_ALIASES) {
    if (alias !== "tournamentId") url.searchParams.delete(alias);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function sanitizePortalV2View(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return VIEW_SET.has(normalized) ? normalized : "";
}

export function sanitizePortalV2Id(value) {
  const normalized = String(value || "").trim();
  return ID_PATTERN.test(normalized) && !UNSAFE_ID_PATTERN.test(normalized) ? normalized : "";
}

function firstTournamentId(params) {
  for (const alias of TOURNAMENT_ALIASES) {
    const value = sanitizePortalV2Id(params.get(alias));
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
  try {
    return new URL(String(input || "/"), "https://charropro.local");
  } catch {
    return new URL("/", "https://charropro.local");
  }
}
