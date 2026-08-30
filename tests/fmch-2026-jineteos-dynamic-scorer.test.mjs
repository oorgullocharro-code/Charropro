import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_JINETEO_CLASSIFICATIONS,
  FMCH_2026_TORO_ADIC_RULES,
  FMCH_2026_TORO_DESC_RULES,
  FMCH_2026_TORO_INFR_RULES,
  FMCH_2026_TORO_RULEBOOK_VERSION,
  FMCH_2026_TORO_TEAM_PENALTY_RULES,
  FMCH_2026_YEGUA_ADIC_RULES,
  FMCH_2026_YEGUA_DESC_RULES,
  FMCH_2026_YEGUA_INFR_RULES,
  FMCH_2026_YEGUA_RULEBOOK_VERSION,
  FMCH_2026_YEGUA_TEAM_PENALTY_RULES,
  applyFmch2026JineteoTiming,
  reconcileFmch2026JineteoAttempt,
  resolveFmch2026JineteoTiming,
  resolveFmch2026YeguaDismountTiming,
  resolveJineteoRuleValue,
  setFmch2026JineteoClassification
} from "../js/data/fmch2026JineteosRules.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { FMCH_2026_LIBRE_PROFILE, resolveEffectiveRules, validateRuleProfile } from "../js/data/ruleProfiles.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { SUERTES, resolveTournamentRules } from "../js/data/suertes.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  setScoringAttemptDq
} from "../js/core/scoringAttempt.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { calculateAttemptPointSummary, calculateAttemptTotal } from "../js/core/scoring.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import { emptyAttempt } from "../js/core/state.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

const productToro = SUERTES.find((suerte) => suerte.id === "toro");
const productYegua = SUERTES.find((suerte) => suerte.id === "yegua");
const legacyToro = structuredClone(productToro);
const legacyYegua = structuredClone(productYegua);
const effectiveToro = resolveEffectiveRules({ suerte: productToro, profile: FMCH_2026_LIBRE_PROFILE });
const effectiveYegua = resolveEffectiveRules({ suerte: productYegua, profile: FMCH_2026_LIBRE_PROFILE });

assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
assert.deepEqual(FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds, ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"]);
assert.equal(validateRuleProfile(FMCH_2026_LIBRE_PROFILE).valid, true);
const completeTournamentRules = resolveTournamentRules({
  id: "tournament_fmch_2026",
  type: "completo",
  category: "Libre",
  ruleProfileId: FMCH_2026_LIBRE_PROFILE.profileId,
  ruleProfileVersion: FMCH_2026_LIBRE_PROFILE.version,
  ruleProfile: { ...FMCH_2026_LIBRE_PROFILE, status: "active" }
});
assert.equal(completeTournamentRules.valid, true);
assert.equal(completeTournamentRules.suertes.length, SUERTES.length);
assert.equal(FMCH_2026_TORO_RULEBOOK_VERSION, "fmch_2026_toro_0.4.0");
assert.equal(FMCH_2026_YEGUA_RULEBOOK_VERSION, "fmch_2026_yegua_0.4.0");
assert.deepEqual(FMCH_2026_JINETEO_CLASSIFICATIONS.map(({ id, value }) => [id, value]), [
  ["EXCELENTE", 20],
  ["BUENA", 16],
  ["REGULAR", 12],
  ["MEDIA_REGULAR", 8],
  ["MINIMA", 6]
]);

for (const effective of [effectiveToro, effectiveYegua]) {
  assert.equal(effective.valid, true);
  assert.equal(effective.suerte.catalog.base.length, 5);
  assert.equal(effective.suerte.ruleMetadata.classificationControlsBase, true);
  assert.equal(effective.suerte.ruleMetadata.sportingCertification, "PASS");
  assert.equal(effective.suerte.ruleMetadata.timerContract.limitMs, 300000);
  assert.deepEqual(effective.suerte.catalog.base.map((rule) => rule.pts), [20, 16, 12, 8, 6]);
}

assert.equal(FMCH_2026_TORO_ADIC_RULES.length, 13);
assert.equal(FMCH_2026_TORO_INFR_RULES.length, 14);
assert.equal(FMCH_2026_TORO_TEAM_PENALTY_RULES.length, 1);
assert.equal(FMCH_2026_TORO_DESC_RULES.length, 16);
assert.equal(FMCH_2026_YEGUA_ADIC_RULES.length, 13);
assert.equal(FMCH_2026_YEGUA_INFR_RULES.length, 12);
assert.equal(FMCH_2026_YEGUA_TEAM_PENALTY_RULES.length, 3);
assert.equal(FMCH_2026_YEGUA_DESC_RULES.length, 17);

const allJineteoIds = [
  ...Object.values(effectiveToro.suerte.catalog).flat(),
  ...Object.values(effectiveYegua.suerte.catalog).flat()
].map((rule) => rule.id);
assert.equal(new Set(allJineteoIds).size, allJineteoIds.length, "Toro and Yegua use globally distinct rule IDs");
assert.ok(allJineteoIds.includes("toro_adic_tentemozo"));
assert.ok(allJineteoIds.includes("toro_infr_apretalamiento_minuto_4"));
assert.notEqual("toro_adic_tentemozo", "toro_infr_apretalamiento_minuto_4");

assertDynamicRow(effectiveToro.suerte, "adic", "toro_adic_tentemozo", [4, 4, 3, 1, 0]);
assertDynamicRow(effectiveToro.suerte, "adic", "toro_adic_lola", [3, 2, 1, 0, 0]);
assertDynamicRow(effectiveToro.suerte, "adic", "toro_adic_cara_atras", [3, 2, 1, 1, 0]);
assertDynamicRow(effectiveToro.suerte, "adic", "toro_adic_jugar_piernas", [3, 2, 1, 0, 0]);
assertDynamicRow(effectiveToro.suerte, "adic", "toro_adic_quitar_verijero", [2, 2, 1, 0, 0]);
assertDynamicRow(effectiveToro.suerte, "adic", "toro_adic_levanta_sin_ayuda", [3, 2, 1, 1, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_cara_atras", [3, 2, 1, 0, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_lola", [3, 2, 1, 0, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_tentemozo", [4, 4, 3, 1, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_jugar_piernas", [3, 2, 1, 1, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_quitar_verijero", [2, 2, 1, 1, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_levanta_sin_ayuda", [3, 2, 1, 0, 0]);
assertDynamicRow(effectiveYegua.suerte, "adic", "yegua_adic_oreja_cruzar_pierna", [1, 1, 1, 0, 0]);
assertDynamicRow(effectiveToro.suerte, "infr", "toro_infr_descomponerse", [1, 2, 3, 4, 5]);
assertDynamicRow(effectiveYegua.suerte, "infr", "yegua_infr_descomponerse", [1, 2, 3, 4, 5]);

let toroAttempt = setFmch2026JineteoClassification(emptyAttempt(), effectiveToro.suerte, "EXCELENTE");
toroAttempt.note = "Evidencia sintetica";
toroAttempt.timeEvidence = [{ id: "evidence_1", elapsedMs: 120000 }];
toroAttempt.applied.push("toro_adic_tentemozo", "toro_infr_descomponerse");
toroAttempt = reconcileFmch2026JineteoAttempt(toroAttempt, effectiveToro.suerte);
assert.equal(toroAttempt.base, 20);
assert.equal(toroAttempt.adic, 4);
assert.equal(toroAttempt.infr, 1);
assert.equal(toroAttempt.resolvedRuleValues.toro_adic_tentemozo, 4);
assert.equal(calculateAttemptTotal(toroAttempt), 23);

const selectedIdsBefore = [...toroAttempt.applied];
toroAttempt = setFmch2026JineteoClassification(toroAttempt, effectiveToro.suerte, "MEDIA_REGULAR");
assert.ok(toroAttempt.applied.includes("toro_adic_tentemozo"));
assert.ok(toroAttempt.applied.includes("toro_infr_descomponerse"));
assert.equal(toroAttempt.resolvedRuleValues.toro_adic_tentemozo, 1);
assert.equal(toroAttempt.resolvedRuleValues.toro_infr_descomponerse, 4);
assert.equal(toroAttempt.note, "Evidencia sintetica");
assert.deepEqual(toroAttempt.timeEvidence, [{ id: "evidence_1", elapsedMs: 120000 }]);
assert.equal(selectedIdsBefore.filter((id) => !id.startsWith("toro_base_")).every((id) => toroAttempt.applied.includes(id)), true);

let yeguaZero = setFmch2026JineteoClassification(emptyAttempt(), effectiveYegua.suerte, "MEDIA_REGULAR");
yeguaZero.applied.push("yegua_adic_cara_atras");
yeguaZero = reconcileFmch2026JineteoAttempt(yeguaZero, effectiveYegua.suerte);
assert.equal(yeguaZero.resolvedRuleValues.yegua_adic_cara_atras, 0);
assert.ok(yeguaZero.applied.includes("yegua_adic_cara_atras"));
const yeguaZeroV2 = adaptLegacyAttemptToV2(yeguaZero, buildContext(effectiveYegua.suerte));
const yeguaZeroSelection = yeguaZeroV2.scoring.additionalSelections.find((item) => item.selectedRuleId === "yegua_adic_cara_atras");
assert.equal(yeguaZeroSelection.resolvedValue, 0);
assert.notEqual(yeguaZeroV2.sportState.status, "DQ");

let noRepara = setFmch2026JineteoClassification(emptyAttempt(), effectiveYegua.suerte, "EXCELENTE");
noRepara.applied.push("yegua_adic_tentemozo");
noRepara = reconcileFmch2026JineteoAttempt(noRepara, effectiveYegua.suerte);
noRepara = setFmch2026JineteoClassification(noRepara, effectiveYegua.suerte, "MINIMA", { noRepara: true });
assert.equal(noRepara.base, 6);
assert.equal(noRepara.adic, 0);
assert.equal(noRepara.noRepara, true);
assert.equal(noRepara.desc, null);
assert.equal(calculateAttemptTotal(noRepara), 6);

assert.deepEqual(resolveFmch2026JineteoTiming(60000, "EXCELENTE"), {
  elapsedMs: 60000,
  remainingMs: 240000,
  overtimeMs: 0,
  timeSavedQuantity: 2,
  minute4Penalty: false,
  minute5Penalty: false,
  disqualified: false
});
assert.equal(resolveFmch2026JineteoTiming(180001, "BUENA").minute4Penalty, true);
assert.equal(resolveFmch2026JineteoTiming(240001, "BUENA").minute5Penalty, true);
assert.equal(resolveFmch2026JineteoTiming(300001, "BUENA").disqualified, true);
assert.equal(resolveFmch2026JineteoTiming(60000, "MINIMA").timeSavedQuantity, 0);
assert.equal(resolveFmch2026YeguaDismountTiming(60000).penaltyQuantity, 0);
assert.equal(resolveFmch2026YeguaDismountTiming(60001).penaltyQuantity, 1);
assert.equal(resolveFmch2026YeguaDismountTiming(120001).penaltyQuantity, 2);

let timedToro = setFmch2026JineteoClassification(emptyAttempt(), effectiveToro.suerte, "BUENA");
timedToro = applyFmch2026JineteoTiming(timedToro, effectiveToro.suerte, 60000);
assert.equal(timedToro.ruleQuantities.toro_adic_tiempo_ahorrado, 2);
assert.equal(timedToro.adic, 2);
timedToro = applyFmch2026JineteoTiming(timedToro, effectiveToro.suerte, 240001);
assert.equal(timedToro.infr, 2);
assert.equal(timedToro.desc, null);
timedToro = applyFmch2026JineteoTiming(timedToro, effectiveToro.suerte, 300001);
assert.equal(timedToro.descRuleId, "toro_desc_apretalamiento_mas_5_min");
assert.equal(calculateAttemptTotal(timedToro), -2);

let timedYegua = setFmch2026JineteoClassification(emptyAttempt(), effectiveYegua.suerte, "EXCELENTE");
timedYegua = applyFmch2026JineteoTiming(timedYegua, effectiveYegua.suerte, 60000);
assert.equal(timedYegua.ruleQuantities.yegua_adic_tiempo_ahorrado, 2);
assert.equal(timedYegua.adic, 2);
timedYegua = applyFmch2026JineteoTiming(timedYegua, effectiveYegua.suerte, 300001);
assert.equal(timedYegua.descRuleId, "yegua_desc_apretalamiento_mas_5_min");
assert.equal(calculateAttemptTotal(timedYegua), -2);
const timedYeguaDismount = applyFmch2026JineteoTiming(
  setFmch2026JineteoClassification(emptyAttempt(), effectiveYegua.suerte, "EXCELENTE"),
  effectiveYegua.suerte,
  120000,
  { dismountTimerId: "timer_yegua_dismount:fixture", dismountOfficialElapsedMs: 60001 }
);
assert.equal(timedYeguaDismount.applied.includes("yegua_infr_desmonte_tardio"), true);
assert.equal(timedYeguaDismount.timing.secondaryTimers[0].overtimeMs, 1);
const correctedYeguaDismount = applyFmch2026JineteoTiming(
  timedYeguaDismount,
  effectiveYegua.suerte,
  120000,
  { dismountTimerId: "timer_yegua_dismount:fixture", dismountOfficialElapsedMs: 60000 }
);
assert.equal(correctedYeguaDismount.applied.includes("yegua_infr_desmonte_tardio"), false);

const timedNoRepara = applyFmch2026JineteoTiming(noRepara, effectiveYegua.suerte, 60000);
assert.equal(timedNoRepara.adic, 0);
assert.equal(timedNoRepara.ruleQuantities.yegua_adic_tiempo_ahorrado, undefined);

const teamAttempt = {
  ...toroAttempt,
  teamPenalties: [{ id: "toro_team_fuera_cuadro_sin_orden", label: "Fuera del cuadro", pts: 4 }]
};
const teamV2 = adaptLegacyAttemptToV2(teamAttempt, buildContext(effectiveToro.suerte));
assert.equal(teamV2.teamInfractions[0].resolvedValue, 4);
assert.equal(calculateAttemptPointSummary(teamAttempt).teamBadPoints, 4);

const yeguaTeamAttempt = {
  ...yeguaZero,
  note: "Evidencia sintetica Yegua",
  timeEvidence: [{ id: "evidence_yegua", elapsedMs: 90000 }],
  teamPenalties: [{ id: "yegua_team_no_devolver", label: "No devolver la yegua", pts: 2 }]
};
const yeguaTeamV2 = adaptLegacyAttemptToV2(yeguaTeamAttempt, buildContext(effectiveYegua.suerte));
assert.equal(yeguaTeamV2.teamInfractions[0].resolvedValue, 2);
assert.equal(calculateAttemptPointSummary(yeguaTeamAttempt).teamBadPoints, 2);

const toroV2 = adaptLegacyAttemptToV2(toroAttempt, buildContext(effectiveToro.suerte));
assert.equal(toroV2.scoring.baseSelection.selectedRuleId, "toro_base_media_regular");
assert.equal(toroV2.scoring.baseSelection.resolvedValue, 8);
assert.equal(toroV2.scoring.additionalSelections.find((item) => item.selectedRuleId === "toro_adic_tentemozo").resolvedValue, 1);
assert.equal(toroV2.infractions.find((item) => item.selectedRuleId === "toro_infr_descomponerse").resolvedValue, 4);
assert.equal(toroV2.evidence.length, 1);

const toroDq = setScoringAttemptDq(toroV2, {
  active: true,
  ruleId: "toro_desc_quitar_reparos",
  reason: "Quitar reparos",
  source: "RULE_PROFILE"
});
assert.equal(toroDq.scoring.netAttemptPoints, -4);
assert.deepEqual(toroDq.infractions, toroV2.infractions);
assert.deepEqual(toroDq.teamInfractions, toroV2.teamInfractions);
assert.equal(toroDq.evidence.length, 1);
assert.equal(toroDq.note, "Evidencia sintetica");

const yeguaDq = setScoringAttemptDq(yeguaTeamV2, {
  active: true,
  ruleId: "yegua_desc_quitar_reparos",
  reason: "Quitar reparos",
  source: "RULE_PROFILE"
});
assert.equal(yeguaDq.scoring.netAttemptPoints, 0);
assert.deepEqual(yeguaDq.scoring.additionalSelections, yeguaTeamV2.scoring.additionalSelections);
assert.deepEqual(yeguaDq.teamInfractions, yeguaTeamV2.teamInfractions);
assert.equal(yeguaDq.evidence.length, 1);
assert.equal(yeguaDq.note, "Evidencia sintetica Yegua");

const official = buildOfficialScoringAttemptSnapshot(toroDq, {
  publishedAt: "2026-08-08T22:00:00.000Z",
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez sintetico", role: "Juez" },
  source: "official-score-publication"
});
assert.equal(official.publication.frozen, true);
assert.equal(official.context.ruleProfileVersion, "0.6.0");
assert.equal(official.scoring.additionalSelections[0].selectedRuleId, "toro_adic_tentemozo");
assert.equal(official.scoring.additionalSelections[0].resolvedValue, 1);
assert.throws(() => { official.scoring.netAttemptPoints = 999; }, TypeError);

const officialYegua = buildOfficialScoringAttemptSnapshot(yeguaDq, {
  publishedAt: "2026-08-08T22:05:00.000Z",
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez sintetico", role: "Juez" },
  source: "official-score-publication"
});
assert.equal(officialYegua.publication.frozen, true);
assert.equal(officialYegua.context.ruleProfileVersion, "0.6.0");
assert.equal(officialYegua.scoring.additionalSelections[0].selectedRuleId, "yegua_adic_cara_atras");
assert.equal(officialYegua.scoring.additionalSelections[0].resolvedValue, 0);
assert.throws(() => { officialYegua.teamInfractions[0].resolvedValue = 999; }, TypeError);

const manual = reconcileFmch2026JineteoAttempt({
  ...setFmch2026JineteoClassification(emptyAttempt(), effectiveYegua.suerte, "BUENA"),
  customAdic: [{ id: "manual_a", label: "Adicional confirmado", pts: 3 }],
  customInfr: [{ id: "manual_i", label: "Infraccion confirmada", pts: 2 }]
}, effectiveYegua.suerte);
const manualV2 = adaptLegacyAttemptToV2(manual, buildContext(effectiveYegua.suerte));
assert.equal(manualV2.scoring.additionalSelections.some((item) => item.manual), true);
assert.equal(manualV2.infractions.some((item) => item.manual), true);

assert.deepEqual(productToro, legacyToro, "Product Base Toro remains physically intact for legacy reads");
assert.deepEqual(productYegua, legacyYegua, "Product Base Yegua remains physically intact for legacy reads");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const fixtureSource = readFileSync(new URL("./fixtures/fmch-jineteos-runtime.html", import.meta.url), "utf8");
assert.match(appSource, /setFmch2026JineteoClassification/);
assert.match(appSource, /applyFmch2026JineteoTiming/);
assert.match(appSource, /data-action="toggle-jineteo-no-repara"/);
assert.match(appSource, /data-action="apply-jineteo-timing"/);
assert.match(cssSource, /\.cp-jineteo-controls/);
assert.match(cssSource, /@media \(max-width: 760px\)/);
assert.match(fixtureSource, /http:\/\/127\.0\.0\.1:9000/);
assert.match(fixtureSource, /demo-charropro-local/);
assert.match(fixtureSource, /fixture-loopback-required/);
assert.doesNotMatch(fixtureSource, /charropro-e8a68|firebaseio\.com|firebasestorage\.app/);

console.log("FMCH 2026 Jineteos: dynamic matrices, timing, Attempt V2, DQ, freeze and legacy passed.");

function assertDynamicRow(suerte, category, ruleId, expected) {
  const rule = suerte.catalog[category].find((item) => item.id === ruleId);
  assert.ok(rule, `${ruleId} exists`);
  assert.deepEqual(
    FMCH_2026_JINETEO_CLASSIFICATIONS.map((item) => resolveJineteoRuleValue(rule, item.id)),
    expected,
    `${ruleId} resolves its classification matrix`
  );
}

function buildContext(suerte) {
  return {
    tournamentId: "tournament_fmch_2026",
    competitionId: "equipos_completo",
    competitionScope: "team",
    charreadaId: "charreada_fmch_2026",
    teamId: "team_fmch_2026",
    participantId: null,
    participantName: "Jinete Demo",
    teamName: "Equipo Demo FMCH",
    horseName: "Caballo Demo",
    suerteId: suerte.id,
    opportunityNumber: 1,
    participantSlot: 0,
    category: "Libre",
    phase: "Final",
    catalog: suerte.catalog,
    suerte,
    ruleResolution: suerte.ruleResolution
  };
}
