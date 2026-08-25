import assert from "node:assert/strict";
import { executeBootstrap, profile, TOURNAMENT_A } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { plan, reads } = await executeBootstrap(
  profile({ role: "invented-admin", tournamentAccess: "all", tournamentIds: [TOURNAMENT_A] }),
  { [TOURNAMENT_A]: true },
  {}
);
assert.equal(plan.ok, false);
assert.equal(plan.status, "ROLE_REVIEW_REQUIRED");
assert.equal(plan.reason, "ROLE_INVALID");
assert.deepEqual(reads, []);

const legacy = await executeBootstrap(profile({ role: "judge" }), { [TOURNAMENT_A]: true }, {});
assert.equal(legacy.plan.ok, false);
assert.equal(legacy.plan.reason, "ROLE_INVALID");
assert.deepEqual(legacy.reads, []);
console.log("invalid-role-fail-closed.test.mjs: ok");
