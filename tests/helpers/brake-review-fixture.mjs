import {
  FMCH_2026_LIBRE_PROFILE_0_6_1,
  getRuleProfileRulesByPhase
} from "../../js/data/ruleProfiles.js?v=20260826-pre-cala-brake-review-official-phase-002-v1";
import {
  BRAKE_REVIEW_ACTIONS,
  applyBrakeReviewCommand,
  createBrakeReviewState
} from "../../js/core/brakeReviewPhase.js?v=20260826-pre-cala-brake-review-official-phase-002-v1";

export const actor = Object.freeze({ uid: "judge-fixture", role: "juez", active: true, clientId: "test-client" });
export const context = Object.freeze({
  tournamentId: "tournament-fixture",
  competitionId: "equipos_completo",
  charreadaId: "charreada-fixture",
  teamId: "team-fixture",
  competitorId: "competitor-fixture",
  horseId: "horse-fixture",
  presenterName: "Presentador Fixture",
  horseName: "Caballo Fixture",
  timerId: "timer_cala_freno_review:charreada-fixture:team-fixture"
});

const rules = getRuleProfileRulesByPhase(FMCH_2026_LIBRE_PROFILE_0_6_1, "freno_review");
export const catalog = Object.freeze({
  infr: Object.freeze(rules.filter((rule) => rule.category === "infr")),
  desc: Object.freeze(rules.filter((rule) => rule.category === "desc"))
});

export function freshReview() {
  return createBrakeReviewState(context, { now: "2026-08-26T12:00:00.000Z" });
}

export function command(review, action, options = {}) {
  return applyBrakeReviewCommand(review, {
    action,
    commandId: options.commandId || `${action}:${review.revision + 1}`,
    expectedRevision: options.expectedRevision ?? review.revision,
    elapsedMs: options.elapsedMs ?? review.elapsedMs,
    timerRevision: options.timerRevision ?? review.timerRevision + 1,
    ruleId: options.ruleId || "",
    actor: options.actor || actor,
    source: options.source || "test"
  }, {
    actor: options.actor || actor,
    catalog,
    context,
    now: options.now || `2026-08-26T12:00:${String(review.revision + 1).padStart(2, "0")}.000Z`
  });
}

export function authorizeToCala(review = freshReview()) {
  let result = command(review, BRAKE_REVIEW_ACTIONS.AUTHORIZE);
  if (!result.ok) return result;
  result = command(result.review, BRAKE_REVIEW_ACTIONS.CALL_JUDGES);
  if (!result.ok) return result;
  return command(result.review, BRAKE_REVIEW_ACTIONS.MARK_CALA_READY);
}
