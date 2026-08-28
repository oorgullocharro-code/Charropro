import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_LAZO_ADIC_RULES,
  FMCH_2026_LAZO_BASE_RULES,
  FMCH_2026_LAZO_DESC_RULES,
  FMCH_2026_LAZO_INFR_RULES,
  FMCH_2026_PIAL_RUEDO_ADIC_RULES,
  FMCH_2026_PIAL_RUEDO_BASE_RULES,
  FMCH_2026_PIAL_RUEDO_DESC_RULES,
  FMCH_2026_PIAL_RUEDO_INFR_RULES,
  FMCH_2026_PIAL_RUEDO_TEAM_PENALTY_RULES,
  FMCH_2026_TERNA_DURATION_MS,
  FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
  FMCH_2026_TERNA_RULEBOOK_VERSION,
  applyFmch2026TernaTimeAdditional,
  buildFmch2026TernaOfficialAttempt,
  buildFmch2026TernaOpportunityDraft,
  buildFmch2026TernaRemateHistory,
  commitFmch2026TernaOpportunity,
  createFmch2026TernaSession,
  reserveFmch2026TernaOpportunity,
  resolveFmch2026TernaTimeAdditional,
  shouldDisqualifyRepeatedFmch2026TernaRemate,
  validateFmch2026TernaSession
} from "../js/data/fmch2026TernaRules.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import {
  FMCH_2026_LIBRE_PROFILE,
  FMCH_2026_LIBRE_PROFILE_0_4_0,
  FMCH_2026_LIBRE_PROFILE_0_5_0,
  getRuleProfile,
  resolveEffectiveRules,
  validateRuleProfile
} from "../js/data/ruleProfiles.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  setScoringAttemptDq
} from "../js/core/scoringAttempt.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import {
  applyOfficialTimerCommand,
  createOfficialTimerContext,
  getOfficialTimerContextView,
  validateOfficialTimerContext
} from "../js/core/timerRules.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import { calculateAttemptTotal } from "../js/core/scoring.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import { emptyAttempt, normalizeScoreCollectionForSuerte } from "../js/core/state.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";

const identity = {
  tournamentId: "tournament_fmch_2026",
  competitionId: "equipos_completo",
  charreadaId: "charreada_fmch_2026",
  teamId: "team_fmch_2026"
};
const productLazo = SUERTES.find((suerte) => suerte.id === "lazo");
const productPial = SUERTES.find((suerte) => suerte.id === "pial_ruedo");
const legacyLazo = structuredClone(productLazo);
const legacyPial = structuredClone(productPial);
const effectiveLazo = resolveEffectiveRules({ suerte: productLazo, profile: FMCH_2026_LIBRE_PROFILE });
const effectivePial = resolveEffectiveRules({ suerte: productPial, profile: FMCH_2026_LIBRE_PROFILE });

assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
assert.equal(validateRuleProfile(FMCH_2026_LIBRE_PROFILE).valid, true);
assert.equal(FMCH_2026_LIBRE_PROFILE.rules.length, 731);
assert.equal(getRuleProfile("FMCH_2026_LIBRE", "0.4.0"), FMCH_2026_LIBRE_PROFILE_0_4_0);
assert.equal(getRuleProfile("FMCH_2026_LIBRE", "0.5.0"), FMCH_2026_LIBRE_PROFILE_0_5_0);
assert.equal(FMCH_2026_TERNA_RULEBOOK_VERSION, "fmch_2026_terna_0.5.0");
assert.equal(FMCH_2026_TERNA_OPPORTUNITY_LIMIT, 5);
assert.equal(FMCH_2026_TERNA_DURATION_MS, 420000);
assert.equal(effectiveLazo.valid, true);
assert.equal(effectivePial.valid, true);
assert.equal(effectiveLazo.suerte.attempts, 5);
assert.equal(effectivePial.suerte.attempts, 5);
assert.equal(effectiveLazo.suerte.ruleMetadata.sharedDomain, "terna");
assert.equal(effectivePial.suerte.ruleMetadata.sharedDomain, "terna");

assert.deepEqual(FMCH_2026_LAZO_BASE_RULES.map(({ label, pts }) => [label, pts]), [
  ["Sencillo", 5],
  ["Sencillo o floreado con toro echado", 5],
  ["De efecto", 8],
  ["Floreado", 10]
]);
assert.equal(FMCH_2026_LAZO_ADIC_RULES.length, 20);
assert.equal(FMCH_2026_LAZO_INFR_RULES.length, 19);
assert.equal(FMCH_2026_LAZO_DESC_RULES.length, 15);
assert.equal(FMCH_2026_PIAL_RUEDO_BASE_RULES.length, 15);
assert.equal(FMCH_2026_PIAL_RUEDO_ADIC_RULES.length, 23);
assert.equal(FMCH_2026_PIAL_RUEDO_INFR_RULES.length, 17);
assert.equal(FMCH_2026_PIAL_RUEDO_TEAM_PENALTY_RULES.length, 3);
assert.equal(FMCH_2026_PIAL_RUEDO_DESC_RULES.length, 21);
assert.ok(effectivePial.suerte.catalog.desc.some((rule) => rule.id === "pial_ruedo_desc_repetir_remate"));

let session = createFmch2026TernaSession(identity, { now: "2026-08-10T12:00:00.000Z" });
assert.equal(validateFmch2026TernaSession(session).valid, true);
assert.equal(session.opportunities.length, 5);
assert.equal(session.currentOpportunity, 1);
assert.equal(session.history.length, 0);
assert.equal(validateFmch2026TernaSession({ ...session, status: "IN_PROGRESS" }).session.status, "IN_PROGRESS");
assert.ok(validateFmch2026TernaSession({
  ...session,
  history: Array.from({ length: 6 }, (_, index) => ({
    sharedOpportunityId: `${session.ternaSessionId}:op:${index + 1}`,
    sharedSequenceNumber: index + 1,
    type: "HEAD"
  }))
}).errors.includes("terna-opportunity-limit-exceeded"));

session = consume(session, {
  type: "HEAD",
  participantName: "Cabecero Demo",
  result: "VALID",
  countsForTerna: true,
  remateId: "lazo_base_floreado",
  remateLabel: "Floreado"
});
assert.equal(session.history.length, 1);
assert.equal(session.currentOpportunity, 2);
assert.equal(session.headCounted, true);

session = consume(session, {
  type: "PIAL",
  participantName: "Pialador Demo",
  result: "VALID",
  countsForTerna: true,
  remateId: "pial_ruedo_base_corvero_derecho",
  remateLabel: "Corvero derecho"
});
assert.equal(session.history.length, 2);
assert.equal(session.currentOpportunity, null);
assert.equal(session.pialCounted, true);
assert.equal(session.status, "COMPLETED");
assert.equal(session.opportunities.filter((opportunity) => opportunity.status === "CLOSED_UNUSED").length, 3);
assert.equal(buildFmch2026TernaOpportunityDraft(session, { type: "PIAL" }).reason, "terna-opportunity-limit-reached");
assert.deepEqual(session.history.map((entry) => entry.type), ["HEAD", "PIAL"]);
assert.deepEqual(buildFmch2026TernaRemateHistory(session.history).PIAL.map((item) => item.remateId), [
  "pial_ruedo_base_corvero_derecho"
]);
assert.equal(shouldDisqualifyRepeatedFmch2026TernaRemate(session, {
  type: "PIAL",
  participantName: "Pialador Demo",
  remateId: "pial_ruedo_base_corvero_derecho"
}), true);
assert.equal(shouldDisqualifyRepeatedFmch2026TernaRemate(session, {
  type: "PIAL",
  participantName: "Otro Pialador",
  remateId: "pial_ruedo_base_corvero_derecho"
}), false);

let exhaustedSession = createFmch2026TernaSession({ ...identity, teamId: "team_exhausted" });
for (let index = 0; index < FMCH_2026_TERNA_OPPORTUNITY_LIMIT; index += 1) {
  exhaustedSession = consume(exhaustedSession, {
    type: "HEAD",
    participantName: "Cabecero sin cuenta",
    result: index === 3 ? "DQ" : "ZERO",
    countsForTerna: false
  });
}
assert.equal(exhaustedSession.history[2].result, "ZERO");
assert.notEqual(exhaustedSession.history[2].result, "DQ");
assert.equal(exhaustedSession.history.length, 5);
assert.equal(exhaustedSession.currentOpportunity, null);
assert.equal(exhaustedSession.status, "COMPLETED");
assert.equal(buildFmch2026TernaOpportunityDraft(exhaustedSession, { type: "PIAL" }).reason, "terna-opportunity-limit-reached");

const corrected = commitFmch2026TernaOpportunity(exhaustedSession, {
  ...exhaustedSession.history[2],
  result: "VALID",
  qualifiesForTerna: true,
  remateId: "lazo_base_efecto",
  remateLabel: "De efecto"
}, { scoreId: "score_head", publishedScoreId: "published_correction" }, { now: "2026-08-10T12:10:00.000Z" });
assert.equal(corrected.ok, true);
assert.equal(corrected.correction, true);
assert.equal(corrected.session.history.length, 5);
assert.equal(corrected.session.history[2].result, "VALID");

const failedPublicationSession = createFmch2026TernaSession({ ...identity, teamId: "team_failure" });
const failedDraft = buildFmch2026TernaOpportunityDraft(failedPublicationSession, { type: "HEAD", result: "VALID" });
const failedReservation = reserveFmch2026TernaOpportunity(failedPublicationSession, failedDraft.opportunity);
assert.equal(failedReservation.session.activeOpportunity.status, "ACTIVE");
assert.equal(failedPublicationSession.history.length, 0, "a failed publish does not consume the source session");
assert.equal(failedPublicationSession.currentOpportunity, 1);

const publicationDraftAttempt = { base: 10, opportunityStatus: "PENDING_PUBLICATION", nested: { value: 1 } };
const officialTernaAttempt = buildFmch2026TernaOfficialAttempt(publicationDraftAttempt, failedDraft.opportunity);
assert.equal(officialTernaAttempt.opportunityStatus, "CONSUMED");
assert.equal(officialTernaAttempt.sharedOpportunityId, failedDraft.opportunity.sharedOpportunityId);
officialTernaAttempt.nested.value = 2;
assert.equal(publicationDraftAttempt.opportunityStatus, "PENDING_PUBLICATION");
assert.equal(publicationDraftAttempt.nested.value, 1);

const startedAt = Date.parse("2026-08-10T13:00:00.000Z");
let ternaTimer = createOfficialTimerContext({
  timerId: "timer_terna_demo",
  contextType: "terna",
  durationMs: FMCH_2026_TERNA_DURATION_MS
}, { now: startedAt });
ternaTimer = applyTimer(ternaTimer, "START", startedAt).timer;
assert.equal(ternaTimer.status, "RUNNING");
let timerView = getOfficialTimerContextView(ternaTimer, { now: startedAt + 106000 });
assert.equal(timerView.remainingMs, 314000);
ternaTimer = applyTimer(ternaTimer, "PAUSE", startedAt + 106000, "Limpieza de ruedo").timer;
timerView = getOfficialTimerContextView(ternaTimer, { now: startedAt + 153000 });
assert.equal(timerView.remainingMs, 314000);
assert.equal(timerView.officialElapsedMs, 106000);
assert.equal(timerView.wallElapsedMs, 153000);
assert.equal(timerView.pauseReason, "Limpieza de ruedo");
ternaTimer = applyTimer(ternaTimer, "RESUME", startedAt + 153000).timer;
timerView = getOfficialTimerContextView(ternaTimer, { now: startedAt + 154000 });
assert.equal(timerView.remainingMs, 313000);
ternaTimer = applyTimer(ternaTimer, "FINISH", startedAt + 154000).timer;
assert.equal(validateOfficialTimerContext(ternaTimer).valid, true);
assert.equal(ternaTimer.pauses[0].wallPauseMs, 47000);
assert.ok(validateOfficialTimerContext({ ...ternaTimer, status: "BROKEN" }).errors.includes("official-timer-status-invalid"));

let toroTimer = createOfficialTimerContext({
  timerId: "timer_toro_apretalamiento_demo",
  contextType: "toro_apretalamiento",
  durationMs: 300000
}, { now: startedAt });
toroTimer = applyTimer(toroTimer, "START", startedAt).timer;
const pausedTerna = applyTimer(
  createOfficialTimerContext({ timerId: "timer_terna_parallel", durationMs: FMCH_2026_TERNA_DURATION_MS }, { now: startedAt }),
  "START",
  startedAt
).timer;
const independentlyPaused = applyTimer(pausedTerna, "PAUSE", startedAt + 10000, "Ganado").timer;
assert.equal(independentlyPaused.status, "PAUSED");
assert.equal(toroTimer.status, "RUNNING");
assert.notEqual(independentlyPaused.timerId, toroTimer.timerId);

const bonus = resolveFmch2026TernaTimeAdditional({ remainingMs: 119999 }, session);
assert.deepEqual(bonus, {
  eligible: true,
  completeUnusedMinutes: 1,
  pointsPerLazador: 1,
  totalPoints: 2
});
const headWithBonus = applyFmch2026TernaTimeAdditional({
  ...emptyAttempt(),
  base: 10,
  adic: 0,
  applied: ["lazo_base_floreado"]
}, effectiveLazo.suerte, 1);
assert.equal(headWithBonus.ruleQuantities.lazo_adic_tiempo_no_usado, 1);
assert.equal(headWithBonus.adic, 1);
assert.equal(calculateAttemptTotal(headWithBonus), 11);

const sharedAttempt = {
  ...headWithBonus,
  sharedOpportunityId: `${corrected.session.ternaSessionId}:op:1`,
  sharedSequenceNumber: 1,
  sharedTimerId: corrected.session.sharedTimerId,
  opportunityType: "HEAD",
  opportunityStatus: "CONSUMED",
  remateId: "lazo_base_floreado",
  remateLabel: "Floreado",
  timing: {
    timerId: corrected.session.sharedTimerId,
    sharedTimerId: corrected.session.sharedTimerId,
    elapsedMs: 301000,
    remainingMs: 119000,
    status: "FINISHED"
  },
  note: "Nota sintetica",
  timeEvidence: [{ id: "evidence_terna", label: "Fin", timeMs: 119000, source: "terna-official-timer" }]
};
const attemptV2 = adaptLegacyAttemptToV2(sharedAttempt, buildContext(effectiveLazo.suerte, 1));
assert.equal(attemptV2.sportState.opportunity.sharedOpportunityId, sharedAttempt.sharedOpportunityId);
assert.equal(attemptV2.sportState.opportunity.sharedSequenceNumber, 1);
assert.equal(attemptV2.timing.sharedTimerId, corrected.session.sharedTimerId);
assert.equal(attemptV2.sportState.remate.remateId, "lazo_base_floreado");
assert.equal(attemptV2.context.ruleProfileVersion, "0.6.0");
assert.equal(attemptV2.note, "Nota sintetica");
assert.equal(attemptV2.evidence.length, 1);

const dqAttempt = setScoringAttemptDq(attemptV2, {
  active: true,
  ruleId: "lazo_desc_perder_reata",
  reason: "Perder la reata",
  source: "RULE_PROFILE"
});
assert.equal(dqAttempt.sportState.status, "DQ");
assert.equal(dqAttempt.sportState.opportunity.sharedOpportunityId, sharedAttempt.sharedOpportunityId);
assert.equal(dqAttempt.note, "Nota sintetica");
const official = buildOfficialScoringAttemptSnapshot(dqAttempt, {
  publishedAt: "2026-08-10T14:00:00.000Z",
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez sintetico", role: "Juez" },
  source: "official-score-publication"
});
assert.equal(official.publication.frozen, true);
assert.equal(official.context.ruleProfileVersion, "0.6.0");
assert.equal(official.sportState.opportunity.sharedOpportunityId, sharedAttempt.sharedOpportunityId);
assert.equal(official.timing.sharedTimerId, corrected.session.sharedTimerId);
assert.throws(() => { official.sportState.opportunity.sharedSequenceNumber = 99; }, TypeError);

assert.deepEqual(productLazo, legacyLazo, "legacy Lazo Product Base remains intact");
assert.deepEqual(productPial, legacyPial, "legacy Pial Product Base remains intact");
assert.equal(productLazo.attempts, 3);
assert.equal(productPial.attempts, 3);
const legacyThreeAttempts = Array.from({ length: 3 }, (_, index) => ({ ...emptyAttempt(), note: `legacy-${index + 1}` }));
const adaptedFiveAttempts = normalizeScoreCollectionForSuerte(legacyThreeAttempts, effectiveLazo.suerte);
assert.equal(adaptedFiveAttempts.length, 5);
assert.deepEqual(adaptedFiveAttempts.slice(0, 3), legacyThreeAttempts);
assert.equal(adaptedFiveAttempts[3].note, "");
assert.equal(adaptedFiveAttempts[4].note, "");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const timerSource = readFileSync(new URL("../js/core/timerRules.js", import.meta.url), "utf8");
const stateSource = readFileSync(new URL("../js/core/state.js", import.meta.url), "utf8");
assert.match(appSource, /prepareTernaAttemptForPublication/);
assert.match(appSource, /commitTernaAttemptAfterPublication/);
assert.match(appSource, /rollbackTernaPublicationReservation/);
assert.match(appSource, /publishOfficialScoreForContext\(context, options = \{\}\)/);
assert.match(appSource, /attemptOverride/);
assert.match(appSource, /opportunityHistory/);
assert.match(appSource, /buildFmch2026TernaOfficialAttempt/);
assert.match(appSource, /data-action="select-terna-suerte"/);
assert.match(appSource, /data-action="terna-timer-pause"/);
assert.match(stateSource, /officialTimers:\s*\{\}/);
assert.match(stateSource, /ternaSessions:\s*\{\}/);
assert.doesNotMatch(`${appSource}\n${timerSource}\n${stateSource}`, /class\s+(?:TernaEngine|TernaStore|SharedOpportunityEngine|SharedTimerEngine)/);

console.log("FMCH 2026 Terna: shared opportunities, official timer, rules, Attempt V2, freeze and legacy passed.");

function consume(sourceSession, input) {
  const draft = buildFmch2026TernaOpportunityDraft(sourceSession, input);
  assert.equal(draft.ok, true);
  const reservation = reserveFmch2026TernaOpportunity(sourceSession, draft.opportunity);
  assert.equal(reservation.ok, true);
  const committed = commitFmch2026TernaOpportunity(
    reservation.session,
    draft.opportunity,
    {
      scoreId: `score_${draft.opportunity.sharedSequenceNumber}`,
      publishedScoreId: `published_${draft.opportunity.sharedSequenceNumber}`
    }
  );
  assert.equal(committed.ok, true);
  return committed.session;
}

function applyTimer(timer, type, now, reason = "") {
  const result = applyOfficialTimerCommand(timer, { type, reason, source: "fixture" }, {
    now,
    expectedRevision: timer.revision
  });
  assert.equal(result.ok, true);
  return result;
}

function buildContext(suerte, opportunityNumber) {
  return {
    ...identity,
    competitionScope: "team",
    participantId: null,
    participantName: suerte.id === "lazo" ? "Cabecero Demo" : "Pialador Demo",
    teamName: "Equipo Demo FMCH",
    horseName: "Caballo Demo",
    suerteId: suerte.id,
    opportunityNumber,
    participantSlot: 0,
    opportunityType: suerte.id === "lazo" ? "HEAD" : "PIAL",
    sharedOpportunityId: `terna:demo:op:${opportunityNumber}`,
    sharedSequenceNumber: opportunityNumber,
    category: "Libre",
    phase: "Final",
    catalog: suerte.catalog,
    suerte,
    ruleResolution: suerte.ruleResolution
  };
}
