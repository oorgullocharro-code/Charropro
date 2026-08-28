import assert from "node:assert/strict";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot
} from "../js/core/scoringAttempt.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";
import {
  createOfficialFormatSnapshot,
  validateOfficialFormatSnapshot
} from "../js/core/officialFormatSnapshot.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";
import { buildPublicProjection } from "../js/public/publicProjection.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";
import { getRuleProfile, resolveEffectiveRules } from "../js/data/ruleProfiles.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001-v1";

const {
  applyOfficialScoreTransaction,
  prepareOfficialScoreRequest
} = officialScoreConcurrency;

const PROFILE_ID = "FMCH_2026_LIBRE";
const PROFILE_VERSION = "0.6.1";
const PROFILE_FINGERPRINT = "rptp_10e596046446e850";
const TOURNAMENT_ID = "tournament_terna_recovery";
const CHARREADA_ID = "charreada_terna_recovery";
const TEAM_ID = "team_terna_recovery";
const PUBLISHED_AT = "2026-08-28T15:00:00.000Z";
const actor = {
  uid: "judge_terna_recovery",
  name: "Juez Terna",
  email: "judge.terna@example.test",
  role: "juez",
  clientId: "scorer_terna_recovery"
};

const profile = getRuleProfile(PROFILE_ID, PROFILE_VERSION);
assert.ok(profile, "the certified 0.6.1 profile is available");

const team = {
  id: TEAM_ID,
  tournamentId: TOURNAMENT_ID,
  name: "Equipo Terna Oficial",
  category: "Libre",
  roster: {
    terna: ["Cabecero Oficial", "Pialador Oficial", "Auxiliar Oficial"]
  }
};
const charreada = {
  id: CHARREADA_ID,
  tournamentId: TOURNAMENT_ID,
  competitionId: "equipos_completo",
  competitionType: "equipos_completo",
  competitionScope: "team",
  name: "Charreada Terna Oficial",
  status: "en_vivo",
  teamIds: [TEAM_ID],
  suerteIds: ["terna"]
};
const tournamentInfo = {
  id: TOURNAMENT_ID,
  name: "Torneo Terna Oficial",
  status: "en_vivo",
  ruleProfileId: PROFILE_ID,
  ruleProfileVersion: PROFILE_VERSION,
  ruleProfileStatus: "active",
  ruleProfileContentFingerprint: PROFILE_FINGERPRINT,
  ruleProfileAssignment: {
    profileId: PROFILE_ID,
    version: PROFILE_VERSION,
    status: "active",
    revision: 1,
    contentFingerprint: PROFILE_FINGERPRINT
  }
};

let storedTournament = {
  info: tournamentInfo,
  meta: { activeCharreadaId: CHARREADA_ID },
  teams: { [TEAM_ID]: team },
  charreadas: { [CHARREADA_ID]: charreada },
  scores: {},
  publishedScores: {}
};

const head = publishTernaComponent({
  suerteId: "lazo",
  attemptIndex: 0,
  participantName: team.roster.terna[0],
  total: 10,
  idempotencyKey: "score:terna-head-recovery-0001",
  nowMs: Date.parse(PUBLISHED_AT)
});
storedTournament = head.tournament;
assert.equal(head.outcome.ok, true);
assert.equal(head.outcome.record.breakdown.attemptV2.identity.suerteId, "lazo");
assert.equal(head.outcome.record.total, 10);

const pial = publishTernaComponent({
  suerteId: "pial_ruedo",
  attemptIndex: 1,
  participantName: team.roster.terna[1],
  total: 8,
  idempotencyKey: "score:terna-pial-recovery-0001",
  nowMs: Date.parse(PUBLISHED_AT) + 1000
});
storedTournament = pial.tournament;
assert.equal(pial.outcome.ok, true);
assert.equal(pial.outcome.record.breakdown.attemptV2.identity.suerteId, "pial_ruedo");
assert.equal(pial.outcome.record.total, 8);

const activeOfficialScores = Object.values(storedTournament.publishedScores).filter((record) => !record.superseded);
assert.equal(activeOfficialScores.length, 2, "Official Score preserves both Terna components");
assert.equal(activeOfficialScores.reduce((sum, record) => sum + record.total, 0), 18, "the official team total includes complete Terna");

const formatSnapshot = createOfficialFormatSnapshot({
  tournament: tournamentInfo,
  charreada,
  team,
  officialScores: storedTournament.publishedScores,
  officialScoreLedger: storedTournament.officialScoreLedger
}, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: "2026-08-28T15:05:00.000Z"
});
const formatValidation = validateOfficialFormatSnapshot(formatSnapshot);
assert.equal(formatValidation.valid, true, formatValidation.errors.join(", "));
assert.equal(formatSnapshot.documentStatus, "READY");
assert.equal(formatSnapshot.suertes.terna.attempts.length, 2);
assert.equal(formatSnapshot.suertes.terna.officialScoreTotal, 18);
assert.equal(formatSnapshot.suertes.terna.attempts[0].suerteId, "lazo");
assert.equal(formatSnapshot.suertes.terna.attempts[1].suerteId, "pial_ruedo");

const incompleteFormatSnapshot = createOfficialFormatSnapshot({
  tournament: tournamentInfo,
  charreada,
  team,
  officialScores: { [head.outcome.record.id]: head.outcome.record },
  officialScoreLedger: {
    [head.outcome.attemptId]: storedTournament.officialScoreLedger[head.outcome.attemptId]
  }
}, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: "2026-08-28T15:05:30.000Z"
});
assert.ok(incompleteFormatSnapshot.errors.includes("official-format-required-suerte-missing:pial_ruedo"));
assert.ok(!incompleteFormatSnapshot.errors.includes("official-format-required-suerte-missing:terna"));

const projection = buildPublicProjection({ tournament: storedTournament }, {
  tournamentId: TOURNAMENT_ID,
  nowMs: Date.parse("2026-08-28T15:06:00.000Z")
});
const result = projection.results.items.find((item) => item.teamId === TEAM_ID);
assert.ok(result, "the official result row is projected");
assert.equal(result.scores.LC, 10);
assert.equal(result.scores.PR, 8);
assert.equal(result.accumulatedTotal, 18);

console.log("fmch-terna-federation-official-score-recovery.test.mjs: ok");

function publishTernaComponent({ suerteId, attemptIndex, participantName, total, idempotencyKey, nowMs }) {
  const effective = resolveEffectiveRules({
    suerte: SUERTES.find((item) => item.id === suerteId),
    profile
  });
  assert.equal(effective.valid, true);
  const baseRule = effective.suerte.catalog.base.find((rule) => Number(rule.pts) === total)
    || effective.suerte.catalog.base[0];
  const resolvedTotal = Number(baseRule.pts);
  const legacyAttempt = {
    base: resolvedTotal,
    adic: 0,
    infr: 0,
    applied: [baseRule.id],
    ruleQuantities: { [baseRule.id]: 1 },
    remateId: baseRule.id,
    remateLabel: baseRule.label,
    remateMetadata: { source: "RULE_PROFILE" },
    attempted: true,
    initializedBase: true,
    sharedOpportunityId: `terna:${TOURNAMENT_ID}:${CHARREADA_ID}:${TEAM_ID}:op:${attemptIndex + 1}`,
    sharedSequenceNumber: attemptIndex + 1,
    sharedTimerId: `terna:${TOURNAMENT_ID}:${CHARREADA_ID}:${TEAM_ID}:timer`,
    opportunityType: suerteId === "lazo" ? "HEAD" : "PIAL",
    opportunityStatus: "CONSUMED",
    timing: {
      timerId: `terna:${TOURNAMENT_ID}:${CHARREADA_ID}:${TEAM_ID}:timer`,
      sharedTimerId: `terna:${TOURNAMENT_ID}:${CHARREADA_ID}:${TEAM_ID}:timer`,
      officialElapsedMs: 120000,
      elapsedMs: 120000,
      remainingMs: 300000,
      status: "FINISHED"
    },
    teamPenalties: [],
    customAdic: [],
    customInfr: []
  };
  const attemptV2 = buildOfficialScoringAttemptSnapshot(adaptLegacyAttemptToV2(legacyAttempt, {
    tournamentId: TOURNAMENT_ID,
    competitionId: "equipos_completo",
    competitionScope: "team",
    charreadaId: CHARREADA_ID,
    teamId: TEAM_ID,
    suerteId,
    opportunityNumber: attemptIndex + 1,
    participantSlot: 0,
    participantName,
    teamName: team.name,
    category: "Libre",
    phase: "Final",
    catalog: effective.suerte.catalog,
    suerte: effective.suerte,
    ruleResolution: effective.suerte.ruleResolution,
    ruleProfileId: PROFILE_ID,
    ruleProfileVersion: PROFILE_VERSION,
    effectiveRulesFingerprint: PROFILE_FINGERPRINT
  }, {
    adaptedAt: new Date(nowMs).toISOString(),
    pointSummary: {
      goodPoints: resolvedTotal,
      individualBadPoints: 0,
      teamBadPoints: 0,
      netAttemptPoints: resolvedTotal,
      teamAdjustedPoints: resolvedTotal
    }
  }), {
    publishedAt: new Date(nowMs).toISOString(),
    officialRevision: 1,
    actor,
    source: "official-score-publication"
  });
  const publishedScore = {
    attemptKey: [TOURNAMENT_ID, CHARREADA_ID, TEAM_ID, suerteId, attemptIndex, 0].join("__"),
    tournament: { id: TOURNAMENT_ID, name: tournamentInfo.name },
    charreada,
    competition: { id: "equipos_completo", type: "equipos_completo", scope: "team" },
    team: { id: TEAM_ID, name: team.name },
    suerte: {
      id: suerteId,
      name: effective.suerte.name,
      fullName: effective.suerte.fullName,
      type: effective.suerte.type,
      attempts: effective.suerte.attempts
    },
    attemptIndex,
    coleadorIndex: 0,
    charro: participantName,
    attempt: legacyAttempt,
    total: resolvedTotal,
    breakdown: {
      rulebook: {
        ruleProfileId: PROFILE_ID,
        ruleProfileVersion: PROFILE_VERSION,
        ruleProfileStatus: "active"
      },
      total: resolvedTotal,
      teamAdjustedTotal: resolvedTotal,
      attemptV2
    }
  };
  const prepared = prepareOfficialScoreRequest({
    tournamentId: TOURNAMENT_ID,
    scoreId: `${CHARREADA_ID}__${TEAM_ID}__${suerteId}`,
    idempotencyKey,
    expectedRevision: 0,
    source: "charropro-calificador",
    device: { deviceId: "device_terna_recovery", platform: "test" },
    scorePayload: [legacyAttempt],
    publishedScore
  }, actor, { nowMs });
  assert.equal(prepared.valid, true, prepared.errors?.join(", "));
  return applyOfficialScoreTransaction(storedTournament, prepared.request);
}
