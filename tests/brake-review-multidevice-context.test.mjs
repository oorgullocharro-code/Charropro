import assert from "node:assert/strict";
import { BRAKE_REVIEW_ACTIONS, getBrakeReviewStateFromTimer } from "../js/core/brakeReviewPhase.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import { command, context, freshReview } from "./helpers/brake-review-fixture.mjs";

const deviceA = command(freshReview(), BRAKE_REVIEW_ACTIONS.TOGGLE_RULE, {
  ruleId: "cala_inf_resistirse_estribo",
  commandId: "device-a"
}).review;
const remoteTimer = JSON.parse(JSON.stringify({ timerId: context.timerId, revision: 3, brakeReview: deviceA }));
const deviceB = getBrakeReviewStateFromTimer(remoteTimer, context);
assert.equal(deviceB.timerId, deviceA.timerId);
assert.equal(deviceB.appliedRuleIds.includes("cala_inf_resistirse_estribo"), true);
const stale = command(freshReview(), BRAKE_REVIEW_ACTIONS.AUTHORIZE, {
  expectedRevision: deviceB.revision
});
assert.equal(stale.ok, false);
assert.equal(stale.reason, "brake-review-revision-conflict");
console.log("brake-review-multidevice-context.test.mjs: ok");
