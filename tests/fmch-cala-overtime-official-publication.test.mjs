import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  FMCH_2026_CALA_ADIC_RULES,
  FMCH_2026_CALA_BASE_RULES,
  FMCH_2026_CALA_DESC_RULES,
  FMCH_2026_CALA_INFR_RULES,
  FMCH_2026_CALA_TEAM_PENALTY_RULES,
  applyFmch2026CalaPartideroTiming
} from "../js/data/calaRules.js?v=20260831-official-field-timer-responsive-display-recovery-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  validateScoringAttemptV2
} from "../js/core/scoringAttempt.js?v=20260831-official-field-timer-responsive-display-recovery-001-v1";
import {
  calculateAttemptPointSummary,
  calculateAttemptTotal
} from "../js/core/scoring.js?v=20260831-official-field-timer-responsive-display-recovery-001-v1";

const require = createRequire(import.meta.url);
const {
  applyOfficialScoreTransaction,
  buildOfficialScoreFanoutUpdates,
  prepareOfficialScoreRequest
} = require("../functions/officialScoreConcurrency.js");

const PUBLISHED_AT = "2026-08-29T12:00:00.000Z";
const ACTOR = {
  uid: "judge_cala_overtime",
  name: "Juez Cala",
  email: "judge@example.test",
  role: "juez",
  tenantId: "tenant_test",
  organizationId: "organization_test"
};
const CATALOG = {
  base: FMCH_2026_CALA_BASE_RULES,
  adic: FMCH_2026_CALA_ADIC_RULES,
  infr: FMCH_2026_CALA_INFR_RULES,
  team_infr: FMCH_2026_CALA_TEAM_PENALTY_RULES,
  desc: FMCH_2026_CALA_DESC_RULES
};
const CONTEXT = {
  tournamentId: "tournament_cala_overtime",
  competitionId: "equipos_completo",
  competitionScope: "team",
  charreadaId: "charreada_cala_overtime",
  teamId: "team_cala",
  participantId: null,
  suerteId: "cala",
  opportunityNumber: 1,
  participantSlot: 0,
  category: "Libre",
  phase: "Final",
  teamName: "Equipo Cala",
  catalog: CATALOG,
  suerte: {
    id: "cala",
    catalog: CATALOG,
    ruleResolution: {
      contractVersion: "1.0.0",
      profile: { profileId: "FMCH_2026_LIBRE", profileVersion: "0.6.1" }
    }
  },
  ruleResolution: {
    contractVersion: "1.0.0",
    profile: { profileId: "FMCH_2026_LIBRE", profileVersion: "0.6.1" }
  }
};

function createCalaAttempt(officialElapsedMs) {
  const attempt = applyFmch2026CalaPartideroTiming({
    base: 20,
    adic: 0,
    infr: 0,
    puntaPts: 0,
    puntaMetros: 0,
    puntaPiquetes: 1,
    desc: null,
    descRuleId: null,
    applied: ["cala_base_completa"],
    ruleQuantities: {},
    customAdic: [],
    customInfr: [],
    teamPenalties: [],
    attempted: true,
    notAchieved: false,
    timeEvidence: [{
      id: `evidence_${officialElapsedMs}`,
      label: "Tiempo oficial Cala",
      timeMs: officialElapsedMs,
      timeText: String(officialElapsedMs),
      capturedAt: PUBLISHED_AT,
      timerRunning: false,
      source: "official_timer"
    }]
  }, {
    timerId: `timer_cala_${officialElapsedMs}`,
    officialElapsedMs,
    durationMs: 120000,
    status: "FINISHED"
  });
  if (attempt.applied.includes("cala_inf_arrancar_despues_un_minuto")) attempt.infr = 1;
  return attempt;
}

function buildPublicationCase(name, officialElapsedMs) {
  const legacyAttempt = createCalaAttempt(officialElapsedMs);
  const pointSummary = calculateAttemptPointSummary(legacyAttempt);
  const draftV2 = adaptLegacyAttemptToV2(legacyAttempt, CONTEXT, {
    pointSummary,
    actor: ACTOR,
    adaptedAt: PUBLISHED_AT
  });
  const attemptV2 = buildOfficialScoringAttemptSnapshot(draftV2, {
    publishedAt: PUBLISHED_AT,
    actor: ACTOR,
    source: "official-score-publication"
  });
  const attemptIndex = 0;
  const coleadorIndex = 0;
  const attemptKey = [
    CONTEXT.tournamentId,
    CONTEXT.charreadaId,
    CONTEXT.teamId,
    CONTEXT.suerteId,
    attemptIndex,
    coleadorIndex
  ].join("__");
  const publishedScore = {
    id: `published_${name}`,
    attemptKey,
    tournament: { id: CONTEXT.tournamentId, name: "Torneo Cala" },
    charreada: {
      id: CONTEXT.charreadaId,
      tournamentId: CONTEXT.tournamentId,
      name: "Charreada Cala",
      competitionId: CONTEXT.competitionId
    },
    competition: { id: CONTEXT.competitionId, scope: "team" },
    team: { id: CONTEXT.teamId, name: CONTEXT.teamName },
    suerte: { id: CONTEXT.suerteId, name: "Cala", attempts: 1 },
    attemptIndex,
    coleadorIndex,
    attempt: legacyAttempt,
    total: calculateAttemptTotal(legacyAttempt),
    breakdown: { attemptV2 }
  };
  const request = prepareOfficialScoreRequest({
    tournamentId: CONTEXT.tournamentId,
    scoreId: `${CONTEXT.charreadaId}__${CONTEXT.teamId}__${CONTEXT.suerteId}`,
    scorePayload: [legacyAttempt],
    publishedScore,
    expectedRevision: 0,
    idempotencyKey: `official-score:${name}:attempt-1`
  }, ACTOR, { nowMs: Date.parse(PUBLISHED_AT) });
  return { legacyAttempt, pointSummary, attemptV2, publishedScore, request };
}

const normal = buildPublicationCase("normal", 50000);
assert.equal(normal.request.valid, true);
assert.equal(normal.publishedScore.total, 20);

const temporalMinusOne = buildPublicationCase("temporal-minus-one", 61000);
assert.equal(temporalMinusOne.legacyAttempt.applied.includes("cala_inf_arrancar_despues_un_minuto"), true);
assert.equal(temporalMinusOne.legacyAttempt.ruleQuantities.cala_inf_arrancar_despues_un_minuto, 1);
assert.equal(temporalMinusOne.attemptV2.timing.remainingMs, 59000);
assert.equal(temporalMinusOne.publishedScore.total, 19);
assert.equal(temporalMinusOne.request.valid, true);

const temporalDq = buildPublicationCase("temporal-dq", 123600);
assert.equal(temporalDq.legacyAttempt.descRuleId, "cala_desc_dos_minutos");
assert.equal(temporalDq.legacyAttempt.ruleQuantities.cala_inf_arrancar_despues_un_minuto, 1);
assert.equal(temporalDq.attemptV2.dq.active, true);
assert.equal(temporalDq.attemptV2.dq.ruleId, "cala_desc_dos_minutos");
assert.equal(temporalDq.attemptV2.timing.officialElapsedMs, 123600);
assert.equal(temporalDq.attemptV2.timing.remainingMs, -3600);
assert.equal(temporalDq.attemptV2.timing.overtimeMs, 3600);
assert.equal(validateScoringAttemptV2(temporalDq.attemptV2, { requireOfficial: true }).valid, true);
assert.equal(temporalDq.publishedScore.total, -1, "the existing sporting total remains unchanged");
assert.equal(temporalDq.request.valid, true);

const tournament = {
  info: {
    id: CONTEXT.tournamentId,
    status: "activo",
    tenantId: ACTOR.tenantId,
    organizationId: ACTOR.organizationId
  },
  meta: { activeCharreadaId: CONTEXT.charreadaId },
  charreadas: [{ id: CONTEXT.charreadaId, competitionId: CONTEXT.competitionId }]
};
const committed = applyOfficialScoreTransaction(tournament, temporalDq.request.request);
assert.equal(committed.outcome.ok, true);
assert.equal(committed.outcome.idempotent, false);
assert.equal(committed.outcome.revision, 1);
assert.ok(committed.tournament.officialScoreFanout[committed.outcome.recordId]);
assert.ok(buildOfficialScoreFanoutUpdates(
  CONTEXT.tournamentId,
  committed.tournament.officialScoreFanout[committed.outcome.recordId]
));

const retried = applyOfficialScoreTransaction(committed.tournament, temporalDq.request.request);
assert.equal(retried.outcome.ok, true);
assert.equal(retried.outcome.idempotent, true);
assert.equal(retried.outcome.revision, 1, "the same publication is committed once");
assert.equal(Object.keys(retried.tournament.officialScoreFanout).length, 1);

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const nextScoreSource = appSource.slice(
  appSource.indexOf("async function nextScore()"),
  appSource.indexOf("function previousScore()")
);
assert.equal((nextScoreSource.match(/publishOfficialScoreForContext\(publicationContext/g) || []).length, 1);
assert.equal((nextScoreSource.match(/continueOfficialScoreFlowAfterPublish\(context, latencyTrace\)/g) || []).length, 1);
assert.ok(nextScoreSource.indexOf("if (officialPublishInProgress)") < nextScoreSource.indexOf("publishOfficialScoreForContext(publicationContext"));
assert.ok(nextScoreSource.indexOf("if (!publishResult.ok)") < nextScoreSource.indexOf("continueOfficialScoreFlowAfterPublish(context, latencyTrace)"));
assert.match(appSource, /Attempt V2 rechazó la publicación: \$\{reason\}/);

console.log("FMCH Cala overtime official publication: normal, -1, temporal DQ, idempotency and single advance passed.");
