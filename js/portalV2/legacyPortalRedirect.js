import { PORTAL_V2_VIEWS, sanitizePortalV2Id, sanitizePortalV2View } from "./portalV2Router.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";

const TOURNAMENT_ALIASES = Object.freeze([
  "tournamentId", "canal", "channel", "id", "torneo", "tournament", "evento", "event"
]);

export function buildLegacyPortalV2RedirectPath(input) {
  const source = toUrl(input);
  const target = new URL("./portal-v2.html", source);
  const tournamentId = resolveTournamentId(source.searchParams);
  const view = sanitizePortalV2View(source.searchParams.get("view"));
  const competitionId = sanitizePortalV2Id(source.searchParams.get("competition") || source.searchParams.get("competitionId"));
  const phaseId = sanitizePortalV2Id(source.searchParams.get("phase") || source.searchParams.get("phaseId"));

  if (tournamentId) target.searchParams.set("tournamentId", tournamentId);
  if (view && view !== "inicio") target.searchParams.set("view", view);
  if (competitionId) target.searchParams.set("competition", competitionId);
  if (phaseId) target.searchParams.set("phase", phaseId);
  return `${target.pathname}${target.search}`;
}

export function redirectLegacyPublicPortal(environment = globalThis.window) {
  if (!environment?.location) return "";
  const target = buildLegacyPortalV2RedirectPath(environment.location.href);
  environment.location.replace(target);
  return target;
}

function resolveTournamentId(params) {
  for (const alias of TOURNAMENT_ALIASES) {
    const value = sanitizePortalV2Id(params.get(alias));
    if (value) return value;
  }
  return "";
}

function toUrl(input) {
  try {
    return new URL(String(input || "/"), "https://charropro.local");
  } catch {
    return new URL("/", "https://charropro.local");
  }
}

export const LEGACY_PORTAL_V2_CERTIFIED_VIEWS = PORTAL_V2_VIEWS;

if (typeof window !== "undefined") redirectLegacyPublicPortal();
