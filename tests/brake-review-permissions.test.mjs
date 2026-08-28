import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BRAKE_REVIEW_ACTIONS, canOperateBrakeReview } from "../js/core/brakeReviewPhase.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { command, freshReview } from "./helpers/brake-review-fixture.mjs";

for (const role of ["juez", "supervisor", "operador"]) {
  assert.equal(canOperateBrakeReview({ uid: role, role, active: true }), true, role);
  assert.equal(command(freshReview(), BRAKE_REVIEW_ACTIONS.AUTHORIZE, {
    actor: { uid: role, role, active: true },
    commandId: `authorize:${role}`
  }).ok, true, role);
}
for (const role of ["locutor", "graficos", "organizador", "lectura", "sin_acceso"]) {
  assert.equal(canOperateBrakeReview({ uid: role, role, active: true }), false, role);
  assert.equal(command(freshReview(), BRAKE_REVIEW_ACTIONS.AUTHORIZE, {
    actor: { uid: role, role, active: true },
    commandId: `deny:${role}`
  }).reason, "brake-review-permission-denied", role);
}
const firebaseSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
assert.match(firebaseSource, /if \(!isBrakeReviewProfile\(definition\)\) return \{ ok: false, reason: "brake-review-profile-mismatch" \};/);
console.log("brake-review-permissions.test.mjs: ok");
