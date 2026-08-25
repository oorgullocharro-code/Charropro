import assert from "node:assert/strict";
import { executeBootstrap, profile, TOURNAMENT_A, tournamentIndex, tournamentRecord } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { result, reads } = await executeBootstrap(
  profile({ tournamentIds: [TOURNAMENT_A] }),
  {},
  {
    indexes: { [TOURNAMENT_A]: tournamentIndex(TOURNAMENT_A) },
    tournaments: { [TOURNAMENT_A]: tournamentRecord(TOURNAMENT_A) }
  }
);
assert.equal(result.status, "READY");
assert.deepEqual(Object.keys(result.tournaments), [TOURNAMENT_A]);
assert.equal(reads.some((path) => path.endsWith("tournament-b")), false);
console.log("judge-single-tournament-access.test.mjs: ok");
