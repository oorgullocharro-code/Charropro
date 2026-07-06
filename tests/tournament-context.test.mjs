import assert from "node:assert/strict";
import {
  buildTournamentUrl,
  clearTournamentContext,
  getTournamentContext,
  getTournamentIdFromUrl,
  setTournamentContext
} from "../js/core/tournamentContext.js";

assert.equal(getTournamentIdFromUrl("?id=torneo_a"), "torneo_a");
assert.equal(getTournamentIdFromUrl("?tournamentId=torneo_b"), "torneo_b");
assert.equal(getTournamentIdFromUrl("?canal=torneo_c"), "torneo_c");
assert.equal(getTournamentIdFromUrl("?v=1"), "");

setTournamentContext("torneo_a", "test");
assert.deepEqual(getTournamentContext(), { tournamentId: "torneo_a", source: "test" });

clearTournamentContext();
assert.deepEqual(getTournamentContext(), { tournamentId: "", source: "" });

assert.equal(
  buildTournamentUrl("obs.html", "torneo_a", { view: "graphics", empty: "" }),
  "./obs.html?tournamentId=torneo_a&view=graphics"
);

console.log("Tournament context tests passed");
