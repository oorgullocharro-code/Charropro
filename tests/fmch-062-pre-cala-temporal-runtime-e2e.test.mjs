import assert from "node:assert/strict";
import {
  BRAKE_REVIEW_ACTIONS,
  BRAKE_REVIEW_STAGES,
  applyBrakeReviewCommand,
  getBrakeReviewStateFromTimer,
  isBrakeReviewProfile
} from "../js/core/brakeReviewPhase.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import {
  applyOfficialTimerCommand,
  buildOfficialTimerDefinitionsFromContext,
  createOfficialTimerContext
} from "../js/core/timerRules.js?v=20260923-client-cache-version-recovery-fix-010-v1";

const tournament = {
  id: "new-fmch-062-tournament",
  name: "Nuevo torneo FMCH 0.6.2",
  category: "Libre",
  type: "completo",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.2",
  ruleProfileStatus: "active",
  ruleProfileContentFingerprint: "rptp_faaf4360de95f84c",
  effectiveRulesFingerprint: "rptp_faaf4360de95f84c"
};
const charreada = {
  id: "new-fmch-062-charreada",
  tournamentId: tournament.id,
  competitionId: "equipos_completo",
  teamIds: ["team-fmch-062"]
};
const turn = {
  competition: { id: "equipos_completo", competitionId: "equipos_completo" },
  team: { id: "team-fmch-062", name: "Equipo FMCH", participantName: "Calador", horseName: "Caballo" },
  suerte: { id: "cala", name: "Cala de Caballo" },
  attemptIndex: 0
};
const context = { tournament, charreada, turn };

assert.equal(isBrakeReviewProfile(tournament), true, "the new tournament is eligible for the canonical Brake Review phase");
const definitions = buildOfficialTimerDefinitionsFromContext(context);
assert.doesNotMatch(JSON.stringify(definitions), /official-temporal-runtime-version-unsupported/);
const brake = definitions.find((definition) => definition.phaseId === "freno_review");
const partidero = definitions.find((definition) => definition.phaseId === "partidero_start");
assert.ok(brake, "Brake Review is available before Cala");
assert.ok(partidero, "Cala partidero timer is available after Brake Review");
assert.equal(brake.durationMs, 180000);
assert.equal(partidero.durationMs, 120000);
assert.equal(brake.temporalPolicyStatus, "ACTIVE");
assert.equal(partidero.temporalPolicyStatus, "ACTIVE");

let brakeTimer = createOfficialTimerContext(brake, { now: "2026-09-23T12:00:00.000Z" });
let review = getBrakeReviewStateFromTimer(brakeTimer, { ...brake, tournamentId: tournament.id });
assert.equal(review.ruleProfileVersion, "0.6.2");
assert.equal(review.ruleProfileFingerprint, "rptp_faaf4360de95f84c");

for (const action of [
  BRAKE_REVIEW_ACTIONS.AUTHORIZE,
  BRAKE_REVIEW_ACTIONS.CALL_JUDGES,
  BRAKE_REVIEW_ACTIONS.MARK_CALA_READY
]) {
  const applied = applyBrakeReviewCommand(review, {
    action,
    commandId: `${action.toLowerCase()}-${review.revision + 1}`,
    expectedRevision: review.revision,
    timerRevision: brakeTimer.revision,
    actor: { uid: "judge-fmch-062", role: "juez", active: true }
  }, {
    context: { ...brake, tournamentId: tournament.id },
    now: `2026-09-23T12:00:0${review.revision + 1}.000Z`
  });
  assert.equal(applied.ok, true, `${action} is accepted for FMCH 0.6.2`);
  review = applied.review;
}
assert.equal(review.stage, BRAKE_REVIEW_STAGES.CALA_READY, "Brake Review hands off canonically to Cala");

const started = applyOfficialTimerCommand(createOfficialTimerContext(partidero, { now: "2026-09-23T12:01:00.000Z" }), {
  type: "START",
  commandId: "start-partidero-fmch-062",
  actor: { uid: "judge-fmch-062", role: "juez" }
}, {
  definition: partidero,
  now: "2026-09-23T12:01:01.000Z",
  expectedRevision: 0,
  requireCommandId: true
});
assert.equal(started.ok, true, "the certified Cala timer can start after Brake Review");
assert.equal(started.timer.status, "RUNNING");

console.log("fmch-062-pre-cala-temporal-runtime-e2e.test.mjs: ok");
