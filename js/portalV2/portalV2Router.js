export const PORTAL_V2_VIEWS = Object.freeze([
  "inicio", "en-vivo", "programa", "resultados", "posiciones", "sabana"
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
    view: sanitizePortalV2View(params.get("view")) || sanitizePortalV2View(fallback.view) || "inicio",
    competitionId: sanitizePortalV2Id(params.get("competition")) || sanitizePortalV2Id(fallback.competitionId),
    phaseId: sanitizePortalV2Id(params.get("phase")) || sanitizePortalV2Id(fallback.phaseId)
  };
}

export function buildPortalV2Url(input, patch = {}) {
  const url = toUrl(input);
  const current = parsePortalV2Route(url);
  const tournamentId = Object.prototype.hasOwnProperty.call(patch, "tournamentId")
    ? sanitizePortalV2Id(patch.tournamentId)
    : current.tournamentId;
  const view = Object.prototype.hasOwnProperty.call(patch, "view")
    ? sanitizePortalV2View(patch.view) || "inicio"
    : current.view;
  const competitionId = Object.prototype.hasOwnProperty.call(patch, "competitionId")
    ? sanitizePortalV2Id(patch.competitionId)
    : current.competitionId;
  const phaseId = Object.prototype.hasOwnProperty.call(patch, "phaseId")
    ? sanitizePortalV2Id(patch.phaseId)
    : current.phaseId;
  setParam(url.searchParams, "tournamentId", tournamentId);
  setParam(url.searchParams, "view", view === "inicio" ? "" : view);
  setParam(url.searchParams, "competition", competitionId);
  setParam(url.searchParams, "phase", phaseId);
  for (const alias of TOURNAMENT_ALIASES) {
    if (alias !== "tournamentId") url.searchParams.delete(alias);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

// Public sharing starts from a clean URL; it never inherits operator or build parameters.
export function buildPortalV2PublicPath(tournamentId, options = {}) {
  const params = new URLSearchParams();
  const normalizedTournamentId = sanitizePortalV2Id(tournamentId);
  const competitionId = sanitizePortalV2Id(options.competitionId);
  const phaseId = sanitizePortalV2Id(options.phaseId);
  if (normalizedTournamentId) params.set("tournamentId", normalizedTournamentId);
  if (competitionId) params.set("competition", competitionId);
  if (phaseId) params.set("phase", phaseId);
  return `./portal-v2.html${params.size ? `?${params.toString()}` : ""}`;
}

export function buildPortalV2PublicUrl(tournamentId, baseUrl, options = {}) {
  return new URL(buildPortalV2PublicPath(tournamentId, options), baseUrl || "https://charropro.local/").href;
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
