import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import {
  ROLES,
  TOURNAMENT_ACCESS,
  hasTournamentAccess,
  normalizeTournamentAccess
} from "../js/core/roles.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { buildUserAccessBootstrapPlan } from "../js/core/userAccessBootstrap.js?v=20260923-client-cache-version-recovery-fix-010-v1";

const require = createRequire(import.meta.url);
const { hasExplicitTournamentAccess, normalizeTournamentAccessForWrite } = require("../functions/tournamentAccess.js");
const TOURNAMENT_A = "tournament-a";
const TOURNAMENT_B = "tournament-b";

function session(profile = {}) {
  return { user: { uid: "user-a" }, active: true, ...profile };
}

const selectedJudge = session({ role: ROLES.JUEZ, tournamentAccess: "selected", tournamentIds: [TOURNAMENT_A] });
assert.equal(hasTournamentAccess(selectedJudge, TOURNAMENT_A), true);
assert.equal(hasTournamentAccess(selectedJudge, TOURNAMENT_B), false);
assert.equal(hasExplicitTournamentAccess(selectedJudge, TOURNAMENT_A, true), true);
assert.equal(hasExplicitTournamentAccess(selectedJudge, TOURNAMENT_B, false), false);

for (const tournamentAccess of [undefined, null, "", "unknown", { mode: "selected" }]) {
  const profile = session({ role: ROLES.JUEZ, tournamentAccess, tournamentIds: [TOURNAMENT_A] });
  assert.equal(normalizeTournamentAccess(profile).tournamentAccess, TOURNAMENT_ACCESS.NONE);
  assert.equal(hasTournamentAccess(profile, TOURNAMENT_A), false);
  assert.equal(buildUserAccessBootstrapPlan(profile, { [TOURNAMENT_A]: true }).status, "NO_ASSIGNMENTS");
  assert.equal(hasExplicitTournamentAccess(profile, TOURNAMENT_A, true), false);
}

const emptySelected = session({ role: ROLES.JUEZ, tournamentAccess: "selected", tournamentIds: [] });
assert.equal(hasTournamentAccess(emptySelected, TOURNAMENT_A), false);
assert.equal(hasExplicitTournamentAccess(emptySelected, TOURNAMENT_A, false), false);

const globalJudge = session({ role: ROLES.JUEZ, tournamentAccess: "all" });
assert.equal(normalizeTournamentAccess(globalJudge).tournamentAccess, TOURNAMENT_ACCESS.NONE);
assert.equal(hasTournamentAccess(globalJudge, TOURNAMENT_A), false);
assert.equal(hasExplicitTournamentAccess(globalJudge, TOURNAMENT_A, false), false);

const globalSupervisor = session({ role: ROLES.SUPERVISOR, tournamentAccess: "all" });
assert.equal(normalizeTournamentAccess(globalSupervisor).tournamentAccess, TOURNAMENT_ACCESS.ALL);
assert.equal(hasTournamentAccess(globalSupervisor, TOURNAMENT_B), true);
assert.equal(hasExplicitTournamentAccess(globalSupervisor, TOURNAMENT_B, false), true);

const scopedSupervisor = session({ role: ROLES.SUPERVISOR, tournamentAccess: "selected", tournamentIds: [TOURNAMENT_A] });
assert.equal(hasTournamentAccess(scopedSupervisor, TOURNAMENT_A), true);
assert.equal(hasTournamentAccess(scopedSupervisor, TOURNAMENT_B), false);

const inactive = session({ role: ROLES.JUEZ, active: false, tournamentAccess: "selected", tournamentIds: [TOURNAMENT_A] });
assert.equal(hasTournamentAccess(inactive, TOURNAMENT_A), false);

assert.equal(normalizeTournamentAccessForWrite("all", "supervisor"), "all");
assert.equal(normalizeTournamentAccessForWrite("all", "juez"), "none");
assert.equal(normalizeTournamentAccessForWrite("selected", "juez"), "selected");
assert.equal(normalizeTournamentAccessForWrite("unknown", "supervisor"), "none");

const [firebaseSyncSource, functionsSource] = await Promise.all([
  readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8"),
  readFile(new URL("../functions/index.js", import.meta.url), "utf8")
]);
assert.doesNotMatch(firebaseSyncSource, /profile\.tournamentAccess !== "selected"/);
assert.doesNotMatch(functionsSource, /profile\.tournamentAccess !== "selected"/);
assert.match(firebaseSyncSource, /canUseGlobalTournamentAccess/);
assert.match(functionsSource, /hasExplicitTournamentAccess/);

console.log("tournament-access-fail-closed.test.mjs: ok");
