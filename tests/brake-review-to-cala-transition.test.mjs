import assert from "node:assert/strict";
import fs from "node:fs";
import { BRAKE_REVIEW_ACTIONS, BRAKE_REVIEW_STAGES } from "../js/core/brakeReviewPhase.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import { command, freshReview } from "./helpers/brake-review-fixture.mjs";

let review = command(freshReview(), BRAKE_REVIEW_ACTIONS.AUTHORIZE).review;
assert.equal(review.stage, BRAKE_REVIEW_STAGES.PROTOCOL);
assert.equal(command(review, BRAKE_REVIEW_ACTIONS.MARK_CALA_READY).ok, false);
review = command(review, BRAKE_REVIEW_ACTIONS.CALL_JUDGES).review;
assert.equal(review.stage, BRAKE_REVIEW_STAGES.JUDGES_CALL);
review = command(review, BRAKE_REVIEW_ACTIONS.MARK_CALA_READY).review;
assert.equal(review.stage, BRAKE_REVIEW_STAGES.CALA_READY);
assert.equal(review.timerId.includes("freno_review"), true);
const appSource = fs.readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /definition\.phaseId === "partidero_start"/);
assert.match(appSource, /brakeReviewCala = suerteId === "cala" && isBrakeReviewProfile/);
assert.match(appSource, /!runtime\.batch\?\.calaReady/);
assert.match(appSource, /buildBrakeReviewBatchState\(presentations\)/);
console.log("brake-review-to-cala-transition.test.mjs: ok");
