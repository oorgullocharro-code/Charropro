export const SUPERVISOR_OVERVIEW_VIEW = "supervisor-overview";
export const SUPERVISOR_TOURNAMENTS_VIEW = "tournaments";

const SUPERVISOR_GLOBAL_VIEWS = new Set([
  SUPERVISOR_OVERVIEW_VIEW,
  SUPERVISOR_TOURNAMENTS_VIEW,
  "production",
  "globalStats",
  "history",
  "users",
  "rulesAdmin"
]);

export function readSupervisorNavigationRequest(search = "") {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return {
    view: normalizeSupervisorGlobalView(params.get("view")),
    rawView: String(params.get("view") || "").trim(),
    tournamentId: normalizeNavigationId(params.get("tournamentId")),
    hasExplicitView: params.has("view"),
    hasExplicitTournament: params.has("tournamentId")
  };
}

export function resolveSupervisorEntryNavigation({
  requestedView = "",
  requestedTournamentId = "",
  tournamentIds = [],
  tournamentIndexReady = false,
  lastTournamentId = ""
} = {}) {
  void lastTournamentId;
  const tournamentId = normalizeNavigationId(requestedTournamentId);
  const view = normalizeSupervisorGlobalView(requestedView);

  if (tournamentId) {
    if (!tournamentIndexReady) {
      return {
        target: "pending",
        view: SUPERVISOR_OVERVIEW_VIEW,
        tournamentId,
        reason: "tournament-index-pending"
      };
    }

    const availableIds = new Set((Array.isArray(tournamentIds) ? tournamentIds : []).map(normalizeNavigationId).filter(Boolean));
    if (availableIds.has(tournamentId)) {
      return {
        target: "tournament",
        view: "dashboard",
        tournamentId,
        reason: "explicit-tournament"
      };
    }

    return {
      target: "portal",
      view: SUPERVISOR_OVERVIEW_VIEW,
      tournamentId: "",
      reason: "invalid-tournament"
    };
  }

  if (view) {
    return {
      target: "portal",
      view,
      tournamentId: "",
      reason: "explicit-global-view"
    };
  }

  return {
    target: "portal",
    view: SUPERVISOR_OVERVIEW_VIEW,
    tournamentId: "",
    reason: requestedView ? "invalid-global-view" : "default-supervisor-entry"
  };
}

export function normalizeSupervisorGlobalView(value = "") {
  const clean = String(value || "").trim();
  if (clean === "overview" || clean === "vista-general") return SUPERVISOR_OVERVIEW_VIEW;
  return SUPERVISOR_GLOBAL_VIEWS.has(clean) ? clean : "";
}

export function isSupervisorGlobalView(value = "") {
  return Boolean(normalizeSupervisorGlobalView(value));
}

export function shouldUseSupervisorPortalNavigation(role = "", appMode = "portal") {
  return appMode === "portal" && String(role || "").trim().toLowerCase() === "supervisor";
}

export function buildSupervisorPortalSearch(view = SUPERVISOR_OVERVIEW_VIEW, version = "") {
  const resolvedView = normalizeSupervisorGlobalView(view) || SUPERVISOR_OVERVIEW_VIEW;
  const params = new URLSearchParams();
  params.set("view", resolvedView);
  const cleanVersion = String(version || "").trim().replace(/[^A-Za-z0-9._-]/g, "");
  if (cleanVersion) params.set("v", cleanVersion);
  return `?${params.toString()}`;
}

function normalizeNavigationId(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "");
}
