import assert from "node:assert/strict";
import { executeBootstrap, profile } from "./helpers/userAccessBootstrapTestHarness.mjs";

const { plan, reads } = await executeBootstrap(profile({ active: false }), {}, {});
assert.equal(plan.ok, false);
assert.equal(plan.status, "INACTIVE");
assert.equal(plan.reason, "USER_INACTIVE");
assert.deepEqual(reads, []);
console.log("inactive-user-denied.test.mjs: ok");
