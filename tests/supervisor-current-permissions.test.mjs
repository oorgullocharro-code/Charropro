import assert from "node:assert/strict";
import { executeBootstrap, profile, TOURNAMENT_A, TOURNAMENT_B, tournamentIndex, tournamentRecord } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { plan, result, reads } = await executeBootstrap(
  profile({ role: "supervisor", tournamentAccess: "selected", tournamentIds: [] }),
  {},
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
assert.equal(plan.globalIndexRead, true);
assert.equal(reads[0], "charropro/tournamentIndex");
assert.deepEqual(Object.keys(result.tournaments).sort(), [TOURNAMENT_A, TOURNAMENT_B]);
console.log("supervisor-current-permissions.test.mjs: ok");
