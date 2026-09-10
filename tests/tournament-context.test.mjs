import assert from "node:assert/strict";
import {
  buildTournamentUrl,
  clearTournamentContext,
  getTournamentContext,
  getTournamentIdFromUrl,
  setTournamentContext
} from "../js/core/tournamentContext.js?v=20260909-public-timeline-canonical-event-producer-001-v1";

assert.equal(getTournamentIdFromUrl("?id=torneo_a"), "torneo_a");
assert.equal(getTournamentIdFromUrl("?tournamentId=torneo_b"), "torneo_b");
assert.equal(getTournamentIdFromUrl("?canal=torneo_c"), "torneo_c");
assert.equal(getTournamentIdFromUrl(""), "");

setTournamentContext("torneo_a", "test");
assert.deepEqual(getTournamentContext(), { tournamentId: "torneo_a", source: "test" });

clearTournamentContext();
assert.deepEqual(getTournamentContext(), { tournamentId: "", source: "" });

assert.equal(
  buildTournamentUrl("obs.html", "torneo_a", { view: "graphics", empty: "" }),
  "./obs.html?tournamentId=torneo_a&view=graphics"
);

const previousWindow = globalThis.window;
try {
  globalThis.window = { location: { search: "?charroproEnv=local" } };
  assert.equal(
    buildTournamentUrl("torneo.html", "demo-local-fmch-2026", { view: "dashboard", v: "local-build" }),
    "./torneo.html?tournamentId=demo-local-fmch-2026&view=dashboard&v=local-build&charroproEnv=local"
  );
} finally {
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
}
assert.equal(
  buildTournamentUrl(
    "torneo.html",
    "torneo_produccion",
    { view: "dashboard" },
    "?charroproEnv=production"
  ),
  "./torneo.html?tournamentId=torneo_produccion&view=dashboard"
);

console.log("Tournament context tests passed");
