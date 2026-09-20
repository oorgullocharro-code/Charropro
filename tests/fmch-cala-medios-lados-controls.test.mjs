import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_CALA_CA5_CA8_IDA_VUELTA_MAPPING_RECOVERABLE,
  FMCH_2026_CALA_GRANULAR_MEDIOS_LADOS_RULES,
  FMCH_2026_CALA_LEGACY_MEDIOS_LADOS_RULE_IDS,
  FMCH_2026_CALA_MEDIOS_LADOS_RULE_IDS,
  migrateCalaAttempt
} from "../js/data/calaRules.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import {
  FMCH_2026_LIBRE_PROFILE_0_6_1,
  FMCH_2026_LIBRE_PROFILE_0_6_2,
  resolveEffectiveRules
} from "../js/data/ruleProfiles.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot
} from "../js/core/scoringAttempt.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import { createOfficialFormatSnapshot } from "../js/core/officialFormatSnapshot.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import {
  buildOfficialTeamSheet,
  resolveCalaMediosLadosPresentation
} from "../js/core/officialFormat.js?v=20260919-scoring-infractions-panel-persistence-001-v1";
import {
  SCORER_DUPLICATE_TAP_WINDOW_MS,
  createScorerDuplicateActionGuard
} from "../js/core/scorerInteractionLatency.js?v=20260919-scoring-infractions-panel-persistence-001-v1";

const IDS = FMCH_2026_CALA_MEDIOS_LADOS_RULE_IDS;
const ALL_GRANULAR = [IDS.RIGHT_OUTBOUND, IDS.RIGHT_RETURN, IDS.LEFT_OUTBOUND, IDS.LEFT_RETURN];
const baseCala = SUERTES.find((suerte) => suerte.id === "cala");
const resolution = resolveEffectiveRules({ suerte: baseCala, profile: FMCH_2026_LIBRE_PROFILE_0_6_2 });

assert.equal(resolution.valid, true);
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_2.version, "0.6.2");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_2.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_2.metadata.derivedFromVersion, "0.6.1");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_2.metadata.activationReady, false);
assert.equal(buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE_0_6_1), "rptp_10e596046446e850");
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_1.rules.length, 734);
assert.equal(
  createHash("sha256").update(JSON.stringify(FMCH_2026_LIBRE_PROFILE_0_6_1)).digest("hex"),
  "d09d4155e73ff50419a08ff768b931dbe6feda6669051a5d9be4451a12514d5e"
);
const profileFingerprint = buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE_0_6_2);
assert.equal(FMCH_2026_LIBRE_PROFILE_0_6_2.rules.length, 738);
assert.equal(profileFingerprint, "rptp_faaf4360de95f84c");
const certificationRegistry = JSON.parse(readFileSync(new URL(
  "../functions/ruleProfileCertificationRegistry.json",
  import.meta.url
), "utf8"));
const certificate = certificationRegistry.profiles["FMCH_2026_LIBRE@0.6.2"];
assert.equal(certificate.definitionStatus, "draft");
assert.equal(certificate.catalogRuleCount, FMCH_2026_LIBRE_PROFILE_0_6_2.rules.length);
assert.equal(certificate.contentFingerprint, profileFingerprint);
for (const fieldId of ["FMCH.TEAM_SHEET.CALA.MD", "FMCH.TEAM_SHEET.CALA.MI"]) {
  const mapping = FMCH_2026_LIBRE_PROFILE_0_6_2.suerteMetadata.cala.fieldIdMappings[fieldId];
  assert.equal(Object.hasOwn(mapping, "ruleId"), false, `${fieldId} has no ambiguous singular 0.6.2 authority`);
  assert.equal(mapping.ruleIds.length, 2);
  assert.equal(mapping.aggregation, "SUM_GRANULAR_OR_LEGACY_AGGREGATE");
}

assert.deepEqual(ALL_GRANULAR, [
  "cala_medio_derecho_ida",
  "cala_medio_derecho_vuelta",
  "cala_medio_izquierdo_ida",
  "cala_medio_izquierdo_vuelta"
]);
assert.equal(FMCH_2026_CALA_GRANULAR_MEDIOS_LADOS_RULES.length, 4);
assert.equal(FMCH_2026_CALA_CA5_CA8_IDA_VUELTA_MAPPING_RECOVERABLE, false);
for (const rule of FMCH_2026_CALA_GRANULAR_MEDIOS_LADOS_RULES) {
  assert.equal(rule.pts, 1, `${rule.id} is +1`);
  assert.equal(rule.metadata.maxQuantity, 1, `${rule.id} has max quantity 1`);
}

const effectiveAdditional = resolution.suerte.catalog.adic;
for (const ruleId of ALL_GRANULAR) {
  assert.equal(effectiveAdditional.find((rule) => rule.id === ruleId)?.pts, 1, `${ruleId} enabled in 0.6.2`);
}
for (const ruleId of Object.values(FMCH_2026_CALA_LEGACY_MEDIOS_LADOS_RULE_IDS)) {
  const profileRule = FMCH_2026_LIBRE_PROFILE_0_6_2.rules.find((rule) => rule.ruleId === ruleId);
  assert.equal(profileRule?.enabled, false, `${ruleId} disabled for new 0.6.2 capture`);
  assert.equal(profileRule?.metadata?.legacyGranularity, "LEGACY_AGGREGATE_GRANULARITY_UNKNOWN");
}

const context = {
  tournamentId: "tournament_cala_medios_062",
  competitionId: "equipos_completo",
  competitionScope: "team",
  charreadaId: "charreada_cala_medios_062",
  teamId: "team_cala_medios_062",
  suerteId: "cala",
  suerte: resolution.suerte,
  catalog: resolution.suerte.catalog,
  opportunityNumber: 1,
  participantSlot: 0,
  ruleResolution: resolution.suerte.ruleResolution,
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.2"
};

function officialAttempt(ruleIds = []) {
  const selected = [...new Set(ruleIds)];
  const attempt = {
    base: 20,
    adic: selected.length,
    infr: 0,
    puntaPts: 0,
    applied: ["cala_base_completa", ...selected],
    ruleQuantities: {},
    customAdic: [],
    customInfr: [],
    teamPenalties: [],
    attempted: true
  };
  const attemptV2 = adaptLegacyAttemptToV2(attempt, context);
  return buildOfficialScoringAttemptSnapshot(attemptV2, {
    publishedAt: "2026-09-19T12:00:00.000Z",
    officialRevision: 1,
    source: "fmch-cala-medios-lados-controls-test"
  });
}

const cases = [
  [[], 20, 0, 0],
  [[IDS.RIGHT_OUTBOUND], 21, 1, 0],
  [[IDS.RIGHT_RETURN], 21, 1, 0],
  [[IDS.LEFT_OUTBOUND], 21, 0, 1],
  [[IDS.LEFT_RETURN], 21, 0, 1],
  [[IDS.RIGHT_OUTBOUND, IDS.RIGHT_RETURN], 22, 2, 0],
  [[IDS.LEFT_OUTBOUND, IDS.LEFT_RETURN], 22, 0, 2],
  [ALL_GRANULAR, 24, 2, 2],
  [[IDS.RIGHT_OUTBOUND, IDS.RIGHT_OUTBOUND], 21, 1, 0]
];

for (const [ruleIds, total, right, left] of cases) {
  const official = officialAttempt(ruleIds);
  const selections = official.scoring.additionalSelections;
  assert.equal(official.scoring.netAttemptPoints, total);
  assert.equal(new Set(selections.map((item) => item.selectedRuleId)).size, selections.length);
  assert.deepEqual(resolveCalaMediosLadosPresentation(selections), { right, left });
}

const reopened = JSON.parse(JSON.stringify(officialAttempt(ALL_GRANULAR)));
assert.deepEqual(
  reopened.scoring.additionalSelections.map((item) => item.selectedRuleId).sort(),
  ALL_GRANULAR.slice().sort()
);

let clock = 1000;
const duplicateGuard = createScorerDuplicateActionGuard({ now: () => clock });
const toggleDataset = { type: "adic", id: IDS.RIGHT_OUTBOUND };
assert.equal(duplicateGuard.accept("toggle-rule", toggleDataset).accepted, true, "first ON is accepted");
clock += SCORER_DUPLICATE_TAP_WINDOW_MS - 1;
assert.equal(duplicateGuard.accept("toggle-rule", toggleDataset).accepted, false, "rapid duplicate does not accumulate");
clock += SCORER_DUPLICATE_TAP_WINDOW_MS;
assert.equal(duplicateGuard.accept("toggle-rule", toggleDataset).accepted, true, "later OFF is accepted");

const legacySelections = [
  { selectedRuleId: "cala_medio_derecho", total: 1 },
  { selectedRuleId: "cala_medio_izquierdo", total: 1 }
];
assert.deepEqual(resolveCalaMediosLadosPresentation(legacySelections), { right: 1, left: 1 });
const legacyAttempt = { applied: ["ca5", "ca8"], customAdic: [], customInfr: [], teamPenalties: [] };
migrateCalaAttempt(legacyAttempt);
assert.deepEqual(legacyAttempt.applied.sort(), ["cala_medio_derecho", "cala_medio_izquierdo"]);
assert.equal(legacyAttempt.applied.some((ruleId) => ALL_GRANULAR.includes(ruleId)), false, "ca5-ca8 never infer ida/vuelta");
assert.deepEqual(resolveCalaMediosLadosPresentation([
  ...legacySelections,
  { selectedRuleId: IDS.RIGHT_OUTBOUND, total: 1 },
  { selectedRuleId: IDS.RIGHT_RETURN, total: 1 },
  { selectedRuleId: IDS.LEFT_RETURN, total: 1 }
]), { right: 2, left: 1 }, "granular representation wins per side without legacy double count");

const granularOfficial = officialAttempt(ALL_GRANULAR);
const officialRecord = {
  id: "official_cala_medios_062",
  attemptKey: "cala-medios-062",
  tournamentId: context.tournamentId,
  competitionId: context.competitionId,
  charreadaId: context.charreadaId,
  teamId: context.teamId,
  suerteId: "cala",
  suerte: { id: "cala", name: "Cala" },
  attemptIndex: 0,
  coleadorIndex: 0,
  charro: "Cala de prueba",
  total: 24,
  revision: 1,
  status: "active",
  officialStatus: "active",
  superseded: false,
  publishedAt: "2026-09-19T12:00:00.000Z",
  breakdown: {
    total: 24,
    teamPenaltyTotal: 0,
    teamAdjustedTotal: 24,
    rulebook: {
      ruleProfileId: "FMCH_2026_LIBRE",
      ruleProfileVersion: "0.6.2",
      ruleProfileStatus: "draft"
    },
    attemptV2: granularOfficial
  }
};
const formatSnapshot = createOfficialFormatSnapshot({
  tournament: {
    id: context.tournamentId,
    name: "Torneo Cala 0.6.2",
    ruleProfileId: "FMCH_2026_LIBRE",
    ruleProfileVersion: "0.6.2",
    ruleProfileStatus: "draft",
    ruleProfileContentFingerprint: profileFingerprint
  },
  charreada: {
    id: context.charreadaId,
    tournamentId: context.tournamentId,
    competitionId: context.competitionId,
    teamIds: [context.teamId],
    suerteIds: ["cala"]
  },
  team: { id: context.teamId, tournamentId: context.tournamentId, name: "Equipo Cala" },
  officialScores: [officialRecord]
}, {
  tournamentId: context.tournamentId,
  charreadaId: context.charreadaId,
  teamId: context.teamId,
  generatedAt: "2026-09-19T12:01:00.000Z"
});
const formatSheet = buildOfficialTeamSheet(formatSnapshot);
assert.equal(formatSnapshot.suertes.cala.attempts[0].additionalSelections.length, 4);
assert.equal(formatSheet.visualRows[7][14].value, 2, "MD prints right outbound + return");
assert.equal(formatSheet.visualRows[7][15].value, 2, "MI prints left outbound + return");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
assert.doesNotMatch(appSource, /renderCalaMediosLadosControls/);
assert.match(appSource, /renderCalaMediosLadosAdditionalGroup/);
assert.match(appSource, /MEDIO LADO DERECHO/);
assert.match(appSource, /MEDIO LADO IZQUIERDO/);
assert.match(appSource, /data-action="toggle-rule"/);
assert.match(cssSource, /\.cp-cala-medios-lados-additional/);

const browserCala = readFileSync(new URL("../js/data/calaRules.js", import.meta.url), "utf8");
const functionsCala = readFileSync(new URL("../functions/reconciliationShared/data/calaRules.js", import.meta.url), "utf8");
const browserProfiles = readFileSync(new URL("../js/data/ruleProfiles.js", import.meta.url), "utf8");
const functionsProfiles = readFileSync(new URL("../functions/reconciliationShared/data/ruleProfiles.js", import.meta.url), "utf8");
const normalizeMirror = (source) => source.replace(/\?v=[A-Za-z0-9._-]+/g, "");
assert.equal(normalizeMirror(functionsCala), normalizeMirror(browserCala));
assert.equal(normalizeMirror(functionsProfiles), normalizeMirror(browserProfiles));

console.log("fmch-cala-medios-lados-controls.test.mjs: ok");
