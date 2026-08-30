import assert from "node:assert/strict";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot
} from "../js/core/scoringAttempt.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import {
  createOfficialFormatSnapshot,
  validateOfficialFormatSnapshot
} from "../js/core/officialFormatSnapshot.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import {
  buildOfficialTeamSheet,
  createOfficialFormatXlsxBlob
} from "../js/core/officialFormat.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import { renderOfficialFormatSheetHtml } from "../js/core/officialFormatHtml.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import { buildPublicProjection } from "../js/public/publicProjection.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import {
  buildCanonicalTernaRoster,
  getCanonicalTernaRoster,
  getTernaParticipant,
  isCanonicalTernaParticipant
} from "../js/core/ternaParticipantIdentity.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import { getRuleProfile, resolveEffectiveRules } from "../js/data/ruleProfiles.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";

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
    terna: buildCanonicalTernaRoster(TEAM_ID, ["Charro 1", "Charro 2", "Charro 3"])
  }
};
assert.deepEqual(
  team.roster.terna.map(({ participantSlot, participantName }) => ({ participantSlot, participantName })),
  [
    { participantSlot: 1, participantName: "Charro 1" },
    { participantSlot: 2, participantName: "Charro 2" },
    { participantSlot: 3, participantName: "Charro 3" }
  ]
);
assert.ok(team.roster.terna.every(isCanonicalTernaParticipant));
assert.equal(getTernaParticipant(team, 1).participantId, team.roster.terna[1].participantId);
const renamedRoster = buildCanonicalTernaRoster(
  TEAM_ID,
  ["Charro 1", "Charro 2 actualizado", "Charro 3"],
  team.roster.terna
);
assert.deepEqual(
  renamedRoster.map((participant) => participant.participantId),
  team.roster.terna.map((participant) => participant.participantId),
  "editing names never changes participant row identity"
);
assert.deepEqual(
  getCanonicalTernaRoster(structuredClone(team)),
  team.roster.terna,
  "Firebase/snapshot serialization preserves the canonical three-participant roster"
);
assert.deepEqual(
  getCanonicalTernaRoster({
    id: TEAM_ID,
    roster: { terna: ["", "", ""], lazo: "Charro 1", pial_ruedo: "Charro 2", terna_auxiliar: "Charro 3" }
  }).map((participant) => participant.participantName),
  ["Charro 1", "Charro 2", "Charro 3"],
  "legacy aliases are promoted into the canonical roster without losing participant names"
);
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

const failedHead = publishTernaComponent({
  suerteId: "lazo",
  attemptIndex: 0,
  participantId: "charro-1",
  participantSlot: 1,
  participantName: "Charro 1",
  baseRuleId: null,
  additionalRuleIds: [],
  expectedTotal: 0,
  notAchieved: true,
  idempotencyKey: "score:terna-head-failed-row-0001",
  nowMs: Date.parse(PUBLISHED_AT)
});
storedTournament = failedHead.tournament;
assert.equal(failedHead.outcome.ok, true);
assert.equal(failedHead.outcome.record.breakdown.attemptV2.identity.participantSlot, 1);
assert.equal(failedHead.outcome.record.total, 0);

const head = publishTernaComponent({
  suerteId: "lazo",
  attemptIndex: 1,
  participantId: "charro-2",
  participantSlot: 2,
  participantName: "Publicación Cabecero Charro Dos",
  baseRuleId: "lazo_base_floreado",
  additionalRuleIds: [
    "lazo_adic_arracadas",
    "lazo_adic_espejos",
    "lazo_adic_resorte_corvejones",
    "lazo_adic_giro_contrario",
    "lazo_adic_resorte_sostenido_cabeza",
    "lazo_adic_movimiento_especificado",
    "lazo_adic_pararse_pasada"
  ],
  expectedTotal: 26,
  idempotencyKey: "score:terna-head-row-two-0001",
  nowMs: Date.parse(PUBLISHED_AT) + 2000
});
storedTournament = head.tournament;
assert.equal(head.outcome.ok, true);
assert.equal(head.outcome.record.breakdown.attemptV2.identity.suerteId, "lazo");
assert.equal(head.outcome.record.breakdown.attemptV2.identity.participantId, "charro-2");
assert.equal(head.outcome.record.breakdown.attemptV2.identity.participantSlot, 2);
assert.equal(head.outcome.record.total, 26);

const pial = publishTernaComponent({
  suerteId: "pial_ruedo",
  attemptIndex: 2,
  participantId: "charro-3",
  participantSlot: 3,
  participantName: "Publicación Pial Charro Tres",
  baseRuleId: "pial_ruedo_base_contraviento_izquierdo",
  additionalRuleIds: ["pial_ruedo_adic_resorte_corvejones"],
  expectedTotal: 20,
  idempotencyKey: "score:terna-pial-row-three-0001",
  nowMs: Date.parse(PUBLISHED_AT) + 1000
});
storedTournament = pial.tournament;
assert.equal(pial.outcome.ok, true);
assert.equal(pial.outcome.record.breakdown.attemptV2.identity.suerteId, "pial_ruedo");
assert.equal(pial.outcome.record.breakdown.attemptV2.identity.participantId, "charro-3");
assert.equal(pial.outcome.record.breakdown.attemptV2.identity.participantSlot, 3);
assert.equal(pial.outcome.record.total, 20);

const activeOfficialScores = Object.values(storedTournament.publishedScores).filter((record) => !record.superseded);
assert.equal(activeOfficialScores.length, 3, "Official Score preserves failed and successful Terna attempts");
assert.equal(activeOfficialScores.reduce((sum, record) => sum + record.total, 0), 46, "the official team total includes complete Terna");
assert.ok(
  activeOfficialScores.every((record) => record.team.roster.terna.every(isCanonicalTernaParticipant)),
  "every Firebase Official Score carries the canonical three-participant roster"
);

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
assert.equal(formatSnapshot.suertes.terna.attempts.length, 3);
assert.equal(formatSnapshot.suertes.terna.officialScoreTotal, 46);
assert.equal(formatSnapshot.suertes.terna.attempts[0].suerteId, "lazo");
assert.equal(formatSnapshot.suertes.terna.attempts[0].participantId, "charro-1");
assert.equal(formatSnapshot.suertes.terna.attempts[0].participantSlot, 1);
assert.equal(formatSnapshot.suertes.terna.attempts[1].suerteId, "lazo");
assert.equal(formatSnapshot.suertes.terna.attempts[1].participantId, "charro-2");
assert.equal(formatSnapshot.suertes.terna.attempts[1].participantSlot, 2);
assert.equal(formatSnapshot.suertes.terna.attempts[2].suerteId, "pial_ruedo");
assert.equal(formatSnapshot.suertes.terna.attempts[2].participantId, "charro-3");
assert.equal(formatSnapshot.suertes.terna.attempts[2].participantSlot, 3);

const formatSheet = buildOfficialTeamSheet(formatSnapshot);
const visualField = (fieldId) => formatSheet.visualRows.flat().find((cell) => cell?.fieldId === fieldId);
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.PARTICIPANT_01.NAME")?.value, "Charro 1");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.PARTICIPANT_02.NAME")?.value, "Charro 2");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.PARTICIPANT_03.NAME")?.value, "Charro 3");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_01.BASE_ADDITIONALES_01")?.value, "-");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_01.BASE_ADDITIONALES_02")?.value, "-");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_01.TOTAL")?.value, 0, "the real failed-attempt zero remains numeric");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_02.BASE_ADDITIONALES_01")?.value, 26);
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_02.BASE_ADDITIONALES_02")?.value, "-");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_02.TOTAL")?.value, 26);
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_03.BASE_ADDITIONALES_01")?.value, "-");
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_03.BASE_ADDITIONALES_02")?.value, 20);
assert.equal(visualField("FMCH.TEAM_SHEET.TERNA.ROW_03.TOTAL")?.value, 20);
assert.equal(
  [1, 2, 3].reduce((sum, row) => {
    const value = visualField(`FMCH.TEAM_SHEET.TERNA.ROW_0${row}.TOTAL`)?.value;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0),
  46,
  "the three participant rows preserve the official Terna total"
);

const renderedHtml = renderOfficialFormatSheetHtml(formatSheet);
assert.match(renderedHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_01\.BASE_ADDITIONALES_01"[^>]*>-<\/td>/);
assert.match(renderedHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_02\.BASE_ADDITIONALES_01"[^>]*>26<\/td>/);
assert.match(renderedHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_02\.TOTAL"[^>]*>26<\/td>/);
assert.match(renderedHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_03\.BASE_ADDITIONALES_02"[^>]*>20<\/td>/);
assert.match(renderedHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_03\.TOTAL"[^>]*>20<\/td>/);

const xlsx = createOfficialFormatXlsxBlob({
  generatedAt: "2026-08-28T15:05:00.000Z",
  sheets: [formatSheet]
});
const xlsxFiles = readStoredZip(Buffer.from(await xlsx.arrayBuffer()));
const worksheetXml = xlsxFiles.get("xl/worksheets/sheet1.xml")?.toString("utf8") || "";
assert.equal(readNumericXlsxCell(worksheetXml, "J32"), null, "failed Cabecero is not materialized as a numeric score in row 1");
assert.equal(readNumericXlsxCell(worksheetXml, "AD32"), 0, "the XLSX preserves the real failed-attempt total zero");
assert.equal(readNumericXlsxCell(worksheetXml, "J33"), 26, "the XLSX Cabecero value belongs to roster row 2");
assert.equal(readNumericXlsxCell(worksheetXml, "AD33"), 26, "the XLSX Cabecero total belongs to roster row 2");
assert.equal(readNumericXlsxCell(worksheetXml, "R34"), 20, "the XLSX Pial value belongs to roster row 3");
assert.equal(readNumericXlsxCell(worksheetXml, "AD34"), 20, "the XLSX Pial total belongs to roster row 3");

const reorderedOfficialScores = Object.fromEntries(
  Object.entries(structuredClone(storedTournament.publishedScores)).reverse()
);
const reconnectedSnapshot = createOfficialFormatSnapshot({
  tournament: structuredClone(tournamentInfo),
  charreada: structuredClone(charreada),
  team: structuredClone(team),
  officialScores: reorderedOfficialScores,
  officialScoreLedger: structuredClone(storedTournament.officialScoreLedger)
}, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: "2026-08-28T15:05:00.000Z"
});
const reconnectedSheet = buildOfficialTeamSheet(reconnectedSnapshot);
const reconnectedField = (fieldId) => reconnectedSheet.visualRows.flat().find((cell) => cell?.fieldId === fieldId)?.value;
assert.equal(reconnectedField("FMCH.TEAM_SHEET.TERNA.ROW_01.TOTAL"), 0);
assert.equal(reconnectedField("FMCH.TEAM_SHEET.TERNA.ROW_02.TOTAL"), 26);
assert.equal(reconnectedField("FMCH.TEAM_SHEET.TERNA.ROW_03.TOTAL"), 20);
assert.equal(reconnectedSnapshot.suertes.terna.officialScoreTotal, 46, "refresh/reconnect and publication order preserve Terna row ownership");

const slotOnlyOfficialScores = structuredClone({
  [head.outcome.record.id]: head.outcome.record,
  [pial.outcome.record.id]: pial.outcome.record
});
for (const record of Object.values(slotOnlyOfficialScores)) {
  delete record.breakdown.attemptV2.identity.participantId;
  record.breakdown.attemptV2.identity.participantSlot = 0;
  record.breakdown.attemptV2.context.participantName = "";
  record.charro = team.name;
}
const slotOnlyTeam = structuredClone(team);
slotOnlyTeam.roster.terna = ["", "", ""];
const slotOnlySnapshot = createOfficialFormatSnapshot({
  tournament: tournamentInfo,
  charreada,
  team: slotOnlyTeam,
  officialScores: slotOnlyOfficialScores,
  officialScoreLedger: {}
}, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: "2026-08-28T15:05:15.000Z"
});
const slotOnlySheet = buildOfficialTeamSheet(slotOnlySnapshot);
const slotOnlyField = (fieldId) => slotOnlySheet.visualRows.flat().find((cell) => cell?.fieldId === fieldId)?.value;
assert.equal(slotOnlySnapshot.suertes.terna.officialScoreTotal, 46);
assert.equal(slotOnlyField("FMCH.TEAM_SHEET.TERNA.ROW_01.BASE_ADDITIONALES_01"), 26);
assert.equal(slotOnlyField("FMCH.TEAM_SHEET.TERNA.ROW_01.BASE_ADDITIONALES_02"), 20);
assert.equal(slotOnlyField("FMCH.TEAM_SHEET.TERNA.ROW_01.TOTAL"), 46);
assert.equal(slotOnlyField("FMCH.TEAM_SHEET.TERNA.ROW_02.TOTAL"), "-");
assert.equal(slotOnlyField("FMCH.TEAM_SHEET.TERNA.ROW_03.TOTAL"), "-");
const slotOnlyHtml = renderOfficialFormatSheetHtml(slotOnlySheet);
assert.match(slotOnlyHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_01\.BASE_ADDITIONALES_01"[^>]*>26<\/td>/);
assert.match(slotOnlyHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_01\.BASE_ADDITIONALES_02"[^>]*>20<\/td>/);
assert.match(slotOnlyHtml, /data-field-id="FMCH\.TEAM_SHEET\.TERNA\.ROW_01\.TOTAL"[^>]*>46<\/td>/);

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
assert.equal(result.scores.LC, 26);
assert.equal(result.scores.PR, 20);
assert.equal(result.accumulatedTotal, 46);

console.log("fmch-terna-federation-official-score-recovery.test.mjs: ok");

function publishTernaComponent({
  suerteId,
  attemptIndex,
  participantId,
  participantSlot,
  participantName,
  baseRuleId,
  additionalRuleIds,
  expectedTotal,
  notAchieved = false,
  idempotencyKey,
  nowMs
}) {
  const effective = resolveEffectiveRules({
    suerte: SUERTES.find((item) => item.id === suerteId),
    profile
  });
  assert.equal(effective.valid, true);
  const baseRule = baseRuleId
    ? effective.suerte.catalog.base.find((rule) => rule.id === baseRuleId)
    : null;
  const additionalRules = additionalRuleIds.map((ruleId) =>
    effective.suerte.catalog.adic.find((rule) => rule.id === ruleId)
  );
  if (baseRuleId) assert.ok(baseRule, `base rule ${baseRuleId} is available`);
  assert.ok(additionalRules.every(Boolean), "all additional rules are available");
  const additionalTotal = additionalRules.reduce((sum, rule) => sum + Number(rule.pts), 0);
  const resolvedTotal = Number(baseRule?.pts || 0) + additionalTotal;
  assert.equal(resolvedTotal, expectedTotal);
  const legacyAttempt = {
    base: Number(baseRule?.pts || 0),
    adic: additionalTotal,
    infr: 0,
    applied: [baseRule, ...additionalRules].filter(Boolean).map((rule) => rule.id),
    ruleQuantities: Object.fromEntries([baseRule, ...additionalRules].filter(Boolean).map((rule) => [rule.id, 1])),
    remateId: baseRule?.id || "",
    remateLabel: baseRule?.label || "",
    remateMetadata: baseRule ? { source: "RULE_PROFILE" } : null,
    attempted: true,
    notAchieved,
    initializedBase: Boolean(baseRule),
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
    participantId,
    suerteId,
    opportunityNumber: attemptIndex + 1,
    participantSlot,
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
    team: { id: TEAM_ID, name: team.name, roster: { terna: structuredClone(team.roster.terna) } },
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

function readStoredZip(bytes) {
  const files = new Map();
  let offset = 0;
  while (offset + 30 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = bytes.subarray(nameStart, nameStart + nameLength).toString("utf8");
    files.set(name, bytes.subarray(dataStart, dataStart + size));
    offset = dataStart + size;
  }
  return files;
}

function readNumericXlsxCell(worksheetXml, reference) {
  return readNumericXlsxCells(worksheetXml).get(reference) ?? null;
}

function readNumericXlsxCells(worksheetXml) {
  const cells = new Map();
  const pattern = /<c r="([A-Z]+[0-9]+)"[^>]*><v>([^<]+)<\/v><\/c>/g;
  for (const match of worksheetXml.matchAll(pattern)) cells.set(match[1], Number(match[2]));
  return cells;
}
