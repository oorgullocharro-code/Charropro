import {
  CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION,
  CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION,
  PUBLIC_TOURNAMENT_LIFECYCLE_STATUSES,
  validateCanonicalPublicTournamentData
} from "../public/canonicalPublicTournamentData.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { createPortalV2ResultsModel } from "./portalV2ResultsModel.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { createPortalV2LiveTimelineModel } from "./portalV2LiveTimelineModel.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { createPortalV2ContextModel } from "./portalV2ContextModel.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";

export const PORTAL_V2_NAVIGATION = Object.freeze([
  { view: "inicio", module: "", label: "Inicio" },
  { view: "en-vivo", module: "live", label: "En vivo" },
  { view: "programa", module: "program", label: "Programa" },
  { view: "resultados", module: "results", label: "Resultados" },
  { view: "posiciones", module: "standings", label: "Posiciones" },
  { view: "sabana", module: "sheet", label: "Sábana" }
]);

const SAFE_COLORS = Object.freeze({
  primaryColor: "#17324d",
  secondaryColor: "#f0e6d2",
  accentColor: "#b5252a",
  backgroundColor: "#f6f7f5",
  textColor: "#17212b"
});
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function createPortalV2Model(snapshot, options = {}) {
  const availability = String(options.availability || "loading");
  if (!isCanonicalPublicV3(snapshot)) return unavailableModel(availability === "ready" ? "unsupported" : availability);

  const lifecycle = lifecycleModel(snapshot.lifecycle.status);
  const modules = visibleModules(snapshot.modules);
  const navigation = Object.freeze(PORTAL_V2_NAVIGATION.filter((item) => !item.module || modules.some((module) => module.type === item.module)));
  const routeView = navigation.some((item) => item.view === options.view) ? options.view : "inicio";
  const primaryResult = snapshot.results?.teams?.[0] || null;
  const leader = snapshot.standings?.items?.find((item) => item.position === 1) || null;
  const live = snapshot.live || {};
  const publicData = createPortalV2ResultsModel(snapshot, lifecycle.status);
  const context = createPortalV2ContextModel(snapshot, lifecycle.status, options.route || options);
  const connection = text(options.connection || "connecting");
  const liveTimeline = createPortalV2LiveTimelineModel(snapshot, {
    lifecycleStatus: lifecycle.status,
    connection,
    results: publicData.results,
    standings: publicData.standings
  });
  return Object.freeze({
    availability,
    schemaVersion: snapshot.schemaVersion,
    projectionVersion: snapshot.projectionVersion,
    projectionRevision: snapshot.projectionRevision,
    contentHash: snapshot.contentHash,
    lifecycle,
    tournament: displayTournament(snapshot.tournament),
    branding: safeBranding(snapshot.branding),
    modules,
    navigation,
    view: routeView,
    context,
    live: Object.freeze({
      status: text(live.status),
      currentCharreada: text(live.currentCharreada),
      currentTeam: text(live.currentTeam),
      currentParticipant: text(live.currentParticipant),
      currentSuerte: text(live.currentSuerte),
      currentScore: directValue(live.currentScore),
      updatedAt: text(live.updatedAt)
    }),
    primaryResult: primaryResult ? Object.freeze({
      teamName: text(primaryResult.teamName),
      total: directValue(primaryResult.total),
      pr: directValue(primaryResult.columns?.PR ?? primaryResult.columns?.pr),
      status: text(primaryResult.status)
    }) : null,
    leader: leader ? Object.freeze({
      position: directValue(leader.position),
      teamName: text(leader.teamName),
      total: directValue(leader.total),
      classification: text(leader.classification)
    }) : null,
    publicData,
    liveTimeline,
    sponsors: modules.some((module) => module.type === "sponsors") ? visibleSponsors(snapshot.sponsors) : Object.freeze([]),
    connection
  });
}

export function isCanonicalPublicV3(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  if (snapshot.schemaVersion !== CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION) return false;
  if (snapshot.projectionVersion !== CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION) return false;
  return validateCanonicalPublicTournamentData(snapshot).valid;
}

export function lifecycleModel(status) {
  const normalized = PUBLIC_TOURNAMENT_LIFECYCLE_STATUSES.includes(status) ? status : "PRE_EVENT";
  return Object.freeze({
    status: normalized,
    label: {
      PRE_EVENT: "Próximamente",
      LIVE: "En vivo",
      PAUSED: "En pausa",
      FINALIZED: "Finalizado",
      ARCHIVED: "Archivo"
    }[normalized],
    detail: {
      PRE_EVENT: "La información oficial estará disponible al iniciar el evento.",
      LIVE: "Resultados y contexto oficial en actualización.",
      PAUSED: "La actividad deportiva se encuentra en pausa.",
      FINALIZED: "Resultados oficiales finales disponibles.",
      ARCHIVED: "Consulta histórica del evento."
    }[normalized]
  });
}

function visibleModules(source) {
  return Object.freeze((Array.isArray(source) ? source : [])
    .filter((module) => module?.enabled === true)
    .map((module) => Object.freeze({ type: module.type, order: Number(module.order) || 0 }))
    .sort((left, right) => left.order - right.order || left.type.localeCompare(right.type)));
}

function visibleSponsors(source) {
  return Object.freeze((Array.isArray(source) ? source : [])
    .filter((sponsor) => sponsor?.name && sponsor.placement === "hero")
    .map((sponsor) => Object.freeze({ name: text(sponsor.name), logoUrl: safeAssetUrl(sponsor.logoUrl), url: safeAssetUrl(sponsor.url) })));
}

function safeBranding(branding = {}) {
  const output = { ...SAFE_COLORS };
  for (const key of Object.keys(SAFE_COLORS)) {
    if (COLOR_PATTERN.test(String(branding[key] || ""))) output[key] = branding[key];
  }
  return Object.freeze({
    ...output,
    logoUrl: safeAssetUrl(branding.logoUrl),
    coverImageUrl: safeAssetUrl(branding.coverImageUrl),
    heroImageUrl: safeAssetUrl(branding.heroImageUrl)
  });
}

function displayTournament(tournament = {}) {
  return Object.freeze({
    name: text(tournament.name) || "Torneo CharroPro",
    shortName: text(tournament.shortName),
    edition: text(tournament.edition),
    season: text(tournament.season),
    startDate: text(tournament.startDate),
    endDate: text(tournament.endDate),
    venue: text(tournament.venue),
    city: text(tournament.city),
    state: text(tournament.state),
    organization: text(tournament.organization)
  });
}

function unavailableModel(availability) {
  return Object.freeze({
    availability,
    schemaVersion: 0,
    projectionVersion: "",
    projectionRevision: 0,
    contentHash: "",
    lifecycle: lifecycleModel("PRE_EVENT"),
    tournament: displayTournament(),
    branding: safeBranding(),
    modules: Object.freeze([]),
    navigation: Object.freeze([]),
    view: "inicio",
    context: Object.freeze({
      program: Object.freeze([]), programState: "no-program-yet", competitions: Object.freeze([]), phases: Object.freeze([]),
      selectedCompetitionId: "", selectedPhaseId: "", selectedCompetition: null, selectedPhase: null,
      hasInvalidSelection: false, phaseContextAvailable: false, currentPhase: null,
      results: Object.freeze([]), resultGroups: Object.freeze([]), standings: Object.freeze([]), standingGroups: Object.freeze([]), sheet: Object.freeze([]),
      champion: null, resultState: "no-results-yet", standingsState: "no-standings-yet", sheetState: "no-sheet-yet"
    }),
    live: Object.freeze({}),
    primaryResult: null,
    leader: null,
    publicData: Object.freeze({
      status: "incomplete-snapshot", consistency: Object.freeze({ valid: false, reason: "snapshot-unavailable" }),
      results: Object.freeze([]), resultGroups: Object.freeze([]), standings: Object.freeze([]), standingGroups: Object.freeze([]), sheet: Object.freeze([]),
      champion: null, resultState: "no-results-yet", standingsState: "no-standings-yet", sheetState: "no-sheet-yet"
    }),
    liveTimeline: Object.freeze({
      live: Object.freeze({ isLive: false, hasCurrentAction: false }),
      timeline: Object.freeze([]), timelineState: "timeline-empty", currentResults: Object.freeze([]), currentStandings: Object.freeze([]), progressTracking: "not-available-in-v3"
    }),
    sponsors: Object.freeze([]),
    connection: "connecting"
  });
}

function safeAssetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(?:\.\/|\/)/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function directValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function text(value) {
  return String(value || "").trim();
}
