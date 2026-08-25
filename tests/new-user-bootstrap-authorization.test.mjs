import assert from "node:assert/strict";
import { executeBootstrap, profile, TOURNAMENT_A, tournamentIndex, tournamentRecord } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { plan, result, diagnostics, reads } = await executeBootstrap(
  profile(),
  { [TOURNAMENT_A]: true },
  {
    indexes: { [TOURNAMENT_A]: tournamentIndex(TOURNAMENT_A) },
    tournaments: { [TOURNAMENT_A]: tournamentRecord(TOURNAMENT_A) }
  }
);

assert.equal(plan.globalIndexRead, false);
assert.deepEqual(plan.tournamentIds, [TOURNAMENT_A]);
assert.equal(result.ok, true);
assert.equal(diagnostics.tournamentRead, "PASS");
assert.equal(reads.includes("charropro/tournamentIndex"), false);
assert.deepEqual(reads, [
  `charropro/tournamentIndex/${TOURNAMENT_A}`,
  `charropro/tournaments/${TOURNAMENT_A}`
]);
console.log("new-user-bootstrap-authorization.test.mjs: ok");
