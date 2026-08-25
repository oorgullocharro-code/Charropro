import assert from "node:assert/strict";
import { buildUserAccessBootstrapPlan, readUserAccessBootstrapTournaments } from "../js/core/userAccessBootstrap.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import { createBootstrapHarness, executeBootstrap, profile, TOURNAMENT_A, TOURNAMENT_B, tournamentIndex, tournamentRecord } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { result, reads } = await executeBootstrap(
  profile({ tournamentIds: [TOURNAMENT_A] }),
  { [TOURNAMENT_B]: false },
  {
    indexes: {
      [TOURNAMENT_A]: tournamentIndex(TOURNAMENT_A),
      [TOURNAMENT_B]: tournamentIndex(TOURNAMENT_B)
    },
    tournaments: {
      [TOURNAMENT_A]: tournamentRecord(TOURNAMENT_A),
      [TOURNAMENT_B]: tournamentRecord(TOURNAMENT_B)
    }
  }
);
assert.equal(result.ok, true);
assert.deepEqual(Object.keys(result.tournaments), [TOURNAMENT_A]);
assert.equal(reads.some((path) => path.endsWith(TOURNAMENT_B)), false);
assert.equal(reads.includes("charropro/tournamentIndex"), false);

const plan = buildUserAccessBootstrapPlan(profile({ tournamentIds: [TOURNAMENT_A] }), {});
const deniedHarness = createBootstrapHarness({ denied: [`charropro/tournamentIndex/${TOURNAMENT_A}`] });
const denied = await readUserAccessBootstrapTournaments(plan, deniedHarness.adapter);
assert.equal(denied.ok, false);
assert.equal(denied.reason, "TOURNAMENT_ACCESS_DENIED");
assert.equal(denied.deniedPath, `charropro/tournamentIndex/${TOURNAMENT_A}`);

const unsafe = buildUserAccessBootstrapPlan(profile(), { "tournament-a/../tournament-b": true });
assert.deepEqual(unsafe.tournamentIds, []);
assert.equal(unsafe.status, "NO_ASSIGNMENTS");
console.log("judge-cross-tournament-denied.test.mjs: ok");
