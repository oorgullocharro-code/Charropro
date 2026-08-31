import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SUPERVISOR_OVERVIEW_VIEW,
  SUPERVISOR_TOURNAMENTS_VIEW,
  buildSupervisorPortalSearch,
  readSupervisorNavigationRequest,
  resolveSupervisorEntryNavigation,
  shouldUseSupervisorPortalNavigation
} from "../js/core/supervisorNavigation.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

const overviewFor = (tournamentIds = [], lastTournamentId = "") => resolveSupervisorEntryNavigation({
  tournamentIds,
  tournamentIndexReady: true,
  lastTournamentId
});

assert.deepEqual(overviewFor([]), {
  target: "portal",
  view: SUPERVISOR_OVERVIEW_VIEW,
  tournamentId: "",
  reason: "default-supervisor-entry"
});
assert.equal(overviewFor(["torneo_unico"]).view, SUPERVISOR_OVERVIEW_VIEW);
assert.equal(overviewFor(["torneo_a", "torneo_b"]).view, SUPERVISOR_OVERVIEW_VIEW);
assert.equal(overviewFor(["torneo_unico"], "torneo_unico").view, SUPERVISOR_OVERVIEW_VIEW);

const tournamentsRoute = resolveSupervisorEntryNavigation({
  requestedView: SUPERVISOR_TOURNAMENTS_VIEW,
  tournamentIds: ["torneo_unico"],
  tournamentIndexReady: true,
  lastTournamentId: "torneo_unico"
});
assert.equal(tournamentsRoute.target, "portal");
assert.equal(tournamentsRoute.view, SUPERVISOR_TOURNAMENTS_VIEW);

const explicitTournament = resolveSupervisorEntryNavigation({
  requestedTournamentId: "torneo_b",
  tournamentIds: ["torneo_a", "torneo_b"],
  tournamentIndexReady: true
});
assert.equal(explicitTournament.target, "tournament");
assert.equal(explicitTournament.tournamentId, "torneo_b");

const pendingTournament = resolveSupervisorEntryNavigation({
  requestedTournamentId: "torneo_b",
  tournamentIds: [],
  tournamentIndexReady: false
});
assert.equal(pendingTournament.target, "pending");

const invalidTournament = resolveSupervisorEntryNavigation({
  requestedTournamentId: "torneo_inexistente",
  tournamentIds: ["torneo_a"],
  tournamentIndexReady: true
});
assert.equal(invalidTournament.target, "portal");
assert.equal(invalidTournament.view, SUPERVISOR_OVERVIEW_VIEW);
assert.equal(invalidTournament.reason, "invalid-tournament");

const invalidRoute = resolveSupervisorEntryNavigation({
  requestedView: "ruta-corrupta",
  tournamentIds: ["torneo_a"],
  tournamentIndexReady: true,
  lastTournamentId: "torneo_a"
});
assert.equal(invalidRoute.view, SUPERVISOR_OVERVIEW_VIEW);
assert.equal(invalidRoute.reason, "invalid-global-view");

assert.deepEqual(
  readSupervisorNavigationRequest("?view=tournaments&tournamentId=torneo_1"),
  {
    view: SUPERVISOR_TOURNAMENTS_VIEW,
    rawView: SUPERVISOR_TOURNAMENTS_VIEW,
    tournamentId: "torneo_1",
    hasExplicitView: true,
    hasExplicitTournament: true
  }
);
assert.equal(readSupervisorNavigationRequest("?view=vista-general").view, SUPERVISOR_OVERVIEW_VIEW);
assert.equal(readSupervisorNavigationRequest("?view=%7Bbad-json").view, "");
assert.equal(buildSupervisorPortalSearch(SUPERVISOR_OVERVIEW_VIEW), "?view=supervisor-overview");
assert.equal(buildSupervisorPortalSearch(SUPERVISOR_TOURNAMENTS_VIEW), "?view=tournaments");
assert.equal(
  buildSupervisorPortalSearch(SUPERVISOR_TOURNAMENTS_VIEW, "20260728-navigation-v1"),
  "?view=tournaments&v=20260728-navigation-v1"
);
assert.equal(shouldUseSupervisorPortalNavigation("supervisor", "portal"), true);
for (const role of ["operador", "juez", "locutor", "graficos", "lectura", "organizador", ""]) {
  assert.equal(shouldUseSupervisorPortalNavigation(role, "portal"), false, `${role || "empty"} keeps its existing entry flow`);
}
assert.equal(shouldUseSupervisorPortalNavigation("supervisor", "tournament"), false);

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /if \(isSupervisorPortalAccess\(profile\) && !launchRequestedScoring\) return routeSupervisorPortalEntry\(profile\)/);
assert.match(appSource, /if \(isSupervisorPortalAccess\(firebaseAccess\)\) return "";/);
assert.match(appSource, /window\.addEventListener\("popstate", restoreAppHistoryRoute\)/);
assert.match(appSource, /function navigateTournamentAppView[\s\S]*url\.searchParams\.set\("view", resolvedView\)/);
assert.match(appSource, /Volver a Torneos/);
assert.match(appSource, /Vista General/);
assert.match(appSource, /if \(tournaments\.length === 1\)[\s\S]*buildJudgeTournamentHref/, "judge single-tournament routing remains scoped to the judge home");

console.log("Supervisor navigation tests passed.");
