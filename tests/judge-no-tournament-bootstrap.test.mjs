import assert from "node:assert/strict";
import { executeBootstrap, profile } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { plan, result, reads } = await executeBootstrap(profile(), {}, {});
assert.equal(plan.status, "NO_ASSIGNMENTS");
assert.equal(result.ok, true);
assert.equal(result.status, "NO_ASSIGNMENTS");
assert.deepEqual(result.tournamentIndex, []);
assert.deepEqual(result.tournaments, {});
assert.deepEqual(reads, []);
console.log("judge-no-tournament-bootstrap.test.mjs: ok");
