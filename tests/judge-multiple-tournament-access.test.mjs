import assert from "node:assert/strict";
import { executeBootstrap, profile, TOURNAMENT_A, TOURNAMENT_B, tournamentIndex, tournamentRecord } from "./helpers/userAccessBootstrapTestHarness.mjs";

const fixture = {
  indexes: {
    [TOURNAMENT_A]: tournamentIndex(TOURNAMENT_A, 1),
    [TOURNAMENT_B]: tournamentIndex(TOURNAMENT_B, 2)
  },
  tournaments: {
    [TOURNAMENT_A]: tournamentRecord(TOURNAMENT_A),
    [TOURNAMENT_B]: tournamentRecord(TOURNAMENT_B)
  }
};
const { plan, result, reads } = await executeBootstrap(
  profile({ tournamentIds: [TOURNAMENT_A] }),
  { [TOURNAMENT_B]: true },
  fixture
);
assert.deepEqual(plan.tournamentIds, [TOURNAMENT_A, TOURNAMENT_B]);
assert.deepEqual(result.tournamentIndex.map((item) => item.id), [TOURNAMENT_B, TOURNAMENT_A]);
assert.deepEqual(Object.keys(result.tournaments).sort(), [TOURNAMENT_A, TOURNAMENT_B]);
assert.equal(reads.includes("charropro/tournamentIndex"), false);
console.log("judge-multiple-tournament-access.test.mjs: ok");
