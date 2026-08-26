import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_MANGANAS_CABALLO_BASE_RULES,
  FMCH_2026_MANGANAS_DURATION_MS,
  FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT,
  FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION,
  FMCH_2026_PASO_CLASSIFICATIONS,
  FMCH_2026_PASO_DISMOUNT_DURATION_MS,
  FMCH_2026_PASO_EXIT_DURATION_MS,
  applyFmch2026ManganaTiming,
  applyFmch2026PasoTiming,
  buildFmch2026ManganaRemateHistory,
  reconcileFmch2026ManganaAttempt,
  reconcileFmch2026PasoAttempt,
  resolveFmch2026ManganaTiming,
  resolveFmch2026PasoRuleValue,
  resolveFmch2026PasoTiming,
  setFmch2026ManganaFloreoTotal,
  setFmch2026ManganaPullCount,
  setFmch2026ManganaRemate,
  setFmch2026ManganaResult,
  shouldDisqualifyRepeatedManganaRemate,
  toggleFmch2026ManganaFloreoDetail
} from "../js/data/fmch2026ManganasPasoRules.js?v=20260825-official-timer-live-context-001-v1";
import {
  FMCH_2026_LIBRE_PROFILE,
  FMCH_2026_LIBRE_PROFILE_0_5_0,
  getRuleProfile,
  resolveEffectiveRules,
  validateRuleProfile
} from "../js/data/ruleProfiles.js?v=20260825-official-timer-live-context-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260825-official-timer-live-context-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  setScoringAttemptDq,
  validateScoringAttemptV2
} from "../js/core/scoringAttempt.js?v=20260825-official-timer-live-context-001-v1";
import { calculateAttemptPointSummary, calculateAttemptTotal } from "../js/core/scoring.js?v=20260825-official-timer-live-context-001-v1";
import { emptyAttempt } from "../js/core/state.js?v=20260825-official-timer-live-context-001-v1";
import {
  applyOfficialTimerCommand,
  createOfficialTimerContext,
  getOfficialTimerContextView,
  validateOfficialTimerContext
} from "../js/core/timerRules.js?v=20260825-official-timer-live-context-001-v1";

const productPie = SUERTES.find((item) => item.id === "manganas_pie");
const productCaballo = SUERTES.find((item) => item.id === "manganas_caballo");
const productPaso = SUERTES.find((item) => item.id === "paso");
const pie = resolveEffectiveRules({ suerte: productPie, profile: FMCH_2026_LIBRE_PROFILE }).suerte;
const caballo = resolveEffectiveRules({ suerte: productCaballo, profile: FMCH_2026_LIBRE_PROFILE }).suerte;
const paso = resolveEffectiveRules({ suerte: productPaso, profile: FMCH_2026_LIBRE_PROFILE }).suerte;

// Profile and source reconciliation.
assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
const currentRuleKeys = FMCH_2026_LIBRE_PROFILE.rules.map((rule) => `${rule.suerteId}:${rule.category}:${rule.ruleId}`);
assert.equal(new Set(currentRuleKeys).size, currentRuleKeys.length, "FMCH_2026_LIBRE 0.6.0 no debe contener RuleKey duplicados");
assert.equal(validateRuleProfile(FMCH_2026_LIBRE_PROFILE).valid, true);
assert.equal(getRuleProfile("FMCH_2026_LIBRE", "0.5.0"), FMCH_2026_LIBRE_PROFILE_0_5_0);
assert.equal(getRuleProfile("FMCH_2026_LIBRE", "0.6.0"), FMCH_2026_LIBRE_PROFILE);
assert.equal(FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION, "fmch_2026_manganas_paso_0.6.0");
assert.equal(pie.attempts, 3);
assert.equal(caballo.attempts, 3);
assert.equal(FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT, 3);
assert.equal(pie.ruleMetadata.sportingCertification, "PASS");
assert.equal(caballo.ruleMetadata.sportingCertification, "PASS");
assert.equal(caballo.ruleMetadata.contraMascaraIdentityStatus, "RESOLVED_SINGLE_CANONICAL_IDENTITY");
assert.equal(paso.ruleMetadata.sportingCertification, "PASS");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds.length, 10);

// Checkpoint A: Manganas a Pie.
let pieAttempt = { ...emptyAttempt(), base: 10, applied: ["manganas_pie_base_sencilla_pasada"], initializedBase: true };
pieAttempt = setFmch2026ManganaRemate(pieAttempt, pie, "manganas_pie_adic_remate_desden");
pieAttempt = setFmch2026ManganaFloreoTotal(pieAttempt, pie, 8);
pieAttempt = setFmch2026ManganaResult(pieAttempt, pie, "ACHIEVED");
assert.equal(pieAttempt.remateLabel, "Desdén");
assert.equal(pieAttempt.floreoTotal, 8);
assert.equal(pieAttempt.floreoScoredTotal, 8);
assert.equal(pieAttempt.manganaResult, "ACHIEVED");
assert.equal(calculateAttemptTotal(pieAttempt), 19);

const pieBeforeDetail = calculateAttemptTotal(pieAttempt);
pieAttempt = toggleFmch2026ManganaFloreoDetail(pieAttempt, pie, "manganas_pie_floreo_giro_contrario");
assert.equal(pieAttempt.floreoDetail.length, 1);
assert.equal(pieAttempt.floreoDetail[0].resolvedValue, 3);
assert.equal(calculateAttemptTotal(pieAttempt), pieBeforeDetail, "optional detail does not duplicate quick total");
pieAttempt = toggleFmch2026ManganaFloreoDetail(pieAttempt, pie, "manganas_pie_floreo_giro_contrario");
assert.equal(pieAttempt.floreoDetail.length, 0);

pieAttempt = setFmch2026ManganaPullCount(pieAttempt, pie, 2);
assert.equal(pieAttempt.infr, 2);
pieAttempt = setFmch2026ManganaPullCount(pieAttempt, pie, 3);
assert.equal(pieAttempt.infr, 4, "third pull is accumulated -4, not -6");
assert.equal(pieAttempt.applied.includes("manganas_pie_infr_segundo_tiron"), false);
assert.equal(pieAttempt.applied.includes("manganas_pie_infr_tercer_tiron_total"), true);
pieAttempt = setFmch2026ManganaPullCount(pieAttempt, pie, 0);
assert.equal(pieAttempt.infr, 0);

const notAchieved = setFmch2026ManganaResult(emptyAttempt(), pie, "NOT_ACHIEVED");
assert.equal(notAchieved.notAchieved, true);
assert.equal(notAchieved.desc, null);
assert.equal(calculateAttemptTotal(notAchieved), 0);
assert.equal(setFmch2026ManganaResult(emptyAttempt(), pie, "ACHIEVED").manganaResult, "ACHIEVED");

const pieHistory = buildFmch2026ManganaRemateHistory([
  { remateId: "r1", remateLabel: "Uno", manganaResult: "ACHIEVED" },
  { remateId: "r2", remateLabel: "Dos", manganaResult: "NOT_ACHIEVED" },
  { remateId: "r3", remateLabel: "Tres", desc: "DQ" },
  { remateId: "r4", remateLabel: "No permitido" }
]);
assert.deepEqual(pieHistory.map((item) => item.opportunityNumber), [1, 2, 3]);
assert.equal(shouldDisqualifyRepeatedManganaRemate([{ remateId: "r1" }, { remateId: "r2" }], 2, "r1"), true);
assert.equal(shouldDisqualifyRepeatedManganaRemate([{ remateId: "r1" }, { remateId: "r2" }], 2, "r3"), false);
assert.equal(shouldDisqualifyRepeatedManganaRemate([{ remateId: "r1" }], 3, "r1"), false, "there is no fourth opportunity");

assert.deepEqual(resolveFmch2026ManganaTiming(240000, { hasConsumed: true }), {
  officialElapsedMs: 240000,
  remainingMs: 180000,
  completeUnusedMinutes: 3,
  minuteSevenPenalty: false,
  expired: false
});
assert.equal(resolveFmch2026ManganaTiming(240000, { hasConsumed: false }).completeUnusedMinutes, 0);
assert.equal(resolveFmch2026ManganaTiming(FMCH_2026_MANGANAS_DURATION_MS, { hasConsumed: true }).expired, true);
let timedPie = applyFmch2026ManganaTiming(pieAttempt, pie, {
  timerId: "timer_manganas_pie:fixture",
  officialElapsedMs: 240000,
  wallElapsedMs: 300000,
  status: "FINISHED",
  hasConsumed: true
});
assert.equal(timedPie.ruleQuantities.manganas_pie_adic_tiempo_no_usado, 3);
assert.equal(timedPie.timing.officialElapsedMs, 240000);
assert.equal(timedPie.timing.wallElapsedMs, 300000);
assert.equal(timedPie.adic, 12);
timedPie = applyFmch2026ManganaTiming(timedPie, pie, { officialElapsedMs: 400000, hasConsumed: true, placedInMinuteSeven: true });
assert.equal(timedPie.infr, 3);

// Checkpoint B: Manganas a Caballo.
assert.ok(FMCH_2026_MANGANAS_CABALLO_BASE_RULES.length >= 19);
const contraMascara = caballo.catalog.base.find((item) => item.id === "manganas_caballo_base_contra_mascara");
assert.equal(contraMascara.pts, 14);
assert.equal(contraMascara.metadata.sourceStatus, "CONFIRMED");
assert.equal(contraMascara.metadata.sourceResolution, "SINGLE_CANONICAL_SPORTING_IDENTITY");
assert.equal(contraMascara.metadata.simultaneousDuplicateSelectionAllowed, false);
assert.equal(caballo.catalog.base.filter((item) => item.id === "manganas_caballo_base_contra_mascara").length, 1);

let caballoAttempt = {
  ...emptyAttempt(),
  base: 12,
  applied: ["manganas_caballo_base_rodada"],
  initializedBase: true
};
caballoAttempt = setFmch2026ManganaRemate(caballoAttempt, caballo, "manganas_caballo_base_rodada");
caballoAttempt = setFmch2026ManganaFloreoTotal(caballoAttempt, caballo, 5);
caballoAttempt = setFmch2026ManganaResult(caballoAttempt, caballo, "ACHIEVED");
assert.equal(calculateAttemptTotal(caballoAttempt), 17);
assert.equal(caballoAttempt.remateLabel, "Rodada");
caballoAttempt = setFmch2026ManganaPullCount(caballoAttempt, caballo, 3);
assert.equal(caballoAttempt.infr, 4);
assert.equal(calculateAttemptTotal(caballoAttempt), 13);

let centenario = {
  ...emptyAttempt(),
  base: 16,
  applied: ["manganas_caballo_base_centenario"],
  initializedBase: true
};
centenario = setFmch2026ManganaRemate(centenario, caballo, "manganas_caballo_base_centenario");
centenario = setFmch2026ManganaFloreoTotal(centenario, caballo, 9);
centenario = setFmch2026ManganaResult(centenario, caballo, "ACHIEVED");
assert.equal(centenario.floreoTotal, 9, "raw audit value is preserved");
assert.equal(centenario.floreoScoredTotal, 0, "Centenario ignores floreo points");
assert.equal(calculateAttemptTotal(centenario), 16);

const caballoTimed = applyFmch2026ManganaTiming(caballoAttempt, caballo, {
  timerId: "timer_manganas_caballo:fixture",
  officialElapsedMs: 300000,
  hasConsumed: true
});
assert.equal(caballoTimed.ruleQuantities.manganas_caballo_adic_tiempo_no_usado, 2);
assert.equal(caballoTimed.timing.timerId, "timer_manganas_caballo:fixture");
assert.equal(shouldDisqualifyRepeatedManganaRemate([{ remateId: "a" }], 1, "a"), true);
assert.equal(shouldDisqualifyRepeatedManganaRemate([{ remateId: "a" }], 1, "b"), false);

// Shared Timer Engine, independent logical contexts and pause exclusion.
const startedAt = Date.parse("2026-08-10T12:00:00.000Z");
let pieTimer = createOfficialTimerContext({ timerId: "timer_manganas_pie:fixture", durationMs: FMCH_2026_MANGANAS_DURATION_MS }, { now: startedAt });
let caballoTimer = createOfficialTimerContext({ timerId: "timer_manganas_caballo:fixture", durationMs: FMCH_2026_MANGANAS_DURATION_MS }, { now: startedAt });
pieTimer = applyOfficialTimerCommand(pieTimer, { type: "START" }, { now: startedAt, expectedRevision: 0 }).timer;
pieTimer = applyOfficialTimerCommand(pieTimer, { type: "PAUSE" }, { now: startedAt + 60000, expectedRevision: 1 }).timer;
pieTimer = applyOfficialTimerCommand(pieTimer, { type: "RESUME" }, { now: startedAt + 120000, expectedRevision: 2 }).timer;
pieTimer = applyOfficialTimerCommand(pieTimer, { type: "FINISH" }, { now: startedAt + 180000, expectedRevision: 3 }).timer;
assert.equal(getOfficialTimerContextView(pieTimer, { now: startedAt + 180000 }).officialElapsedMs, 120000);
assert.equal(getOfficialTimerContextView(pieTimer, { now: startedAt + 180000 }).wallElapsedMs, 180000);
assert.equal(caballoTimer.revision, 0, "Caballo timer remains independent");
assert.equal(validateOfficialTimerContext(pieTimer).valid, true);

// Checkpoint C: Paso de la Muerte dynamic scoring.
assert.deepEqual(FMCH_2026_PASO_CLASSIFICATIONS.map((item) => item.id), ["EXCELENTE", "BUENA", "REGULAR", "MINIMA"]);
assert.equal(FMCH_2026_PASO_EXIT_DURATION_MS, 180000);
assert.equal(FMCH_2026_PASO_DISMOUNT_DURATION_MS, 60000);
const pasoSinArreo = paso.catalog.adic.find((item) => item.id === "paso_adic_sin_arreo");
assert.equal(resolveFmch2026PasoRuleValue(pasoSinArreo, "EXCELENTE"), 6);
assert.equal(resolveFmch2026PasoRuleValue(pasoSinArreo, "BUENA"), 4);

let pasoAttempt = {
  ...emptyAttempt(),
  base: 20,
  applied: ["paso_base_primera_vuelta", "paso_adic_distancia_primer_cuarto", "paso_adic_sin_arreo"],
  classification: { classificationId: "EXCELENTE", classificationLabel: "Excelente", classificationValue: null },
  pasoResult: "ACHIEVED",
  attempted: true,
  initializedBase: true
};
pasoAttempt = reconcileFmch2026PasoAttempt(pasoAttempt, paso);
assert.equal(pasoAttempt.pasoVuelta, 1);
assert.equal(pasoAttempt.adic, 9);
assert.equal(calculateAttemptTotal(pasoAttempt), 29);
assert.equal(pasoAttempt.resolvedRuleValues.paso_adic_sin_arreo, 6);

let pasoSecond = {
  ...pasoAttempt,
  base: 15,
  applied: pasoAttempt.applied.filter((id) => id !== "paso_base_primera_vuelta").concat("paso_base_segunda_vuelta"),
  classification: { classificationId: "BUENA", classificationLabel: "Buena" }
};
pasoSecond = reconcileFmch2026PasoAttempt(pasoSecond, paso);
assert.equal(pasoSecond.pasoVuelta, 2);
assert.equal(pasoSecond.applied.includes("paso_adic_distancia_primer_cuarto"), false);
assert.equal(pasoSecond.adic, 4);
assert.equal(calculateAttemptTotal(pasoSecond), 19);

let pasoStopped = {
  ...emptyAttempt(),
  base: 5,
  applied: ["paso_base_yegua_parada", "paso_adic_sin_arreo", "paso_adic_distancia_primer_cuarto"],
  classification: { classificationId: "EXCELENTE", classificationLabel: "Excelente" },
  pasoResult: "ACHIEVED",
  attempted: true
};
pasoStopped = reconcileFmch2026PasoAttempt(pasoStopped, paso);
assert.equal(pasoStopped.adic, 0);
assert.equal(calculateAttemptTotal(pasoStopped), 5);

let pasoRegular = {
  ...emptyAttempt(),
  base: 20,
  applied: ["paso_base_primera_vuelta", "paso_adic_distancia_segundo_cuarto", "paso_adic_cuartear_sin_arreo", "paso_infr_descomponerse"],
  classification: { classificationId: "REGULAR", classificationLabel: "Regular" },
  pasoResult: "ACHIEVED",
  attempted: true
};
pasoRegular = reconcileFmch2026PasoAttempt(pasoRegular, paso);
assert.equal(pasoRegular.adic, 3);
assert.equal(pasoRegular.infr, 2);
assert.equal(calculateAttemptTotal(pasoRegular), 21);

assert.deepEqual(resolveFmch2026PasoTiming({ exitOfficialElapsedMs: 120000, dismountOfficialElapsedMs: 60000 }), {
  exitElapsedMs: 120000,
  dismountElapsedMs: 60000,
  exitDisqualified: false,
  dismountPenaltyQuantity: 0
});
assert.equal(resolveFmch2026PasoTiming({ exitOfficialElapsedMs: 180001 }).exitDisqualified, true);
assert.equal(resolveFmch2026PasoTiming({ dismountOfficialElapsedMs: 120001 }).dismountPenaltyQuantity, 2);

let timedPaso = applyFmch2026PasoTiming(pasoAttempt, paso, {
  timerId: "timer_paso_3min:fixture",
  dismountTimerId: "timer_paso_1min:fixture",
  exitOfficialElapsedMs: 120000,
  dismountOfficialElapsedMs: 120001
});
assert.equal(timedPaso.infr, 2);
assert.equal(timedPaso.timing.secondaryTimers[0].timerId, "timer_paso_1min:fixture");
assert.equal(timedPaso.desc, null);
timedPaso = applyFmch2026PasoTiming(timedPaso, paso, { exitOfficialElapsedMs: 180001, dismountOfficialElapsedMs: 0 });
assert.equal(timedPaso.descRuleId, "paso_desc_salida_mas_3_min");
assert.equal(calculateAttemptTotal(timedPaso), 0);
assert.equal(timedPaso.infr, 0);

const noIntentar = {
  ...pasoAttempt,
  applied: [...pasoAttempt.applied, "paso_infr_no_intentar"]
};
const reconciledNoIntentar = reconcileFmch2026PasoAttempt(noIntentar, paso);
assert.equal(reconciledNoIntentar.infr, 10);
assert.equal(reconciledNoIntentar.desc, null, "No intentar is -10, not automatic DQ");

// Attempt V2 freeze, DQ preservation, legacy compatibility and official publication.
pieAttempt.note = "Nota sintética";
pieAttempt.timeEvidence = [{ id: "evidence_mangana", label: "Evidencia", timeMs: 120000 }];
pieAttempt.teamPenalties = [{ id: "manganas_pie_team_no_devolver", label: "No devolver", pts: 2 }];
pieAttempt.timing = { timerId: "timer_manganas_pie:fixture", officialElapsedMs: 120000, wallElapsedMs: 180000, elapsedMs: 120000, status: "FINISHED" };
const pieV2 = adaptLegacyAttemptToV2(pieAttempt, buildContext(pie));
assert.equal(pieV2.sportState.floreo.total, 8);
assert.equal(pieV2.sportState.floreo.source, "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001");
assert.equal(pieV2.scoring.additionalSelections.some((item) => item.selectedRuleId === "manganas_pie_floreo_total"), true);
assert.equal(pieV2.sportState.remate.remateId, "manganas_pie_adic_remate_desden");
assert.equal(pieV2.sportState.pullCount, 0);
assert.equal(pieV2.timing.officialElapsedMs, 120000);
assert.equal(pieV2.timing.wallElapsedMs, 180000);
assert.equal(pieV2.context.ruleProfileVersion, "0.6.0");
assert.equal(pieV2.evidence.length, 1);
assert.equal(validateScoringAttemptV2(pieV2).valid, true);

const dqPie = setScoringAttemptDq(pieV2, { active: true, ruleId: "manganas_pie_desc_rotura", reason: "Rotura", source: "RULE_PROFILE" });
assert.equal(dqPie.sportState.floreo.total, 8);
assert.equal(dqPie.sportState.remate.remateLabel, "Desdén");
assert.equal(dqPie.note, "Nota sintética");
assert.equal(dqPie.evidence.length, 1);
assert.equal(dqPie.teamInfractions.length, 1);
assert.equal(dqPie.scoring.netAttemptPoints, 0);

const officialPie = buildOfficialScoringAttemptSnapshot(pieV2, {
  publishedAt: "2026-08-10T18:00:00.000Z",
  officialRevision: 1,
  source: "official-score",
  actor: { id: "judge_fixture", name: "Juez Sintético", role: "juez" }
});
assert.equal(officialPie.publication.state, "OFFICIAL");
assert.equal(officialPie.publication.frozen, true);
assert.throws(() => { officialPie.sportState.floreo.total = 99; }, TypeError);

const pasoV2 = adaptLegacyAttemptToV2(pasoAttempt, buildContext(paso));
assert.equal(pasoV2.sportState.vuelta, 1);
assert.equal(pasoV2.sportState.classification.classificationId, "EXCELENTE");
assert.equal(pasoV2.scoring.additionalSelections.find((item) => item.selectedRuleId === "paso_adic_sin_arreo").resolvedValue, 6);
assert.equal(pasoV2.sportState.dynamicContext.selectedRuleIds.includes("paso_adic_sin_arreo"), true);

const legacy = adaptLegacyAttemptToV2({ base: 10, adic: 2, infr: 1, applied: [] }, buildContext(productPie));
assert.equal(legacy.sportState.floreo.total, 0);
assert.equal(legacy.sportState.result, "ACHIEVED");
assert.equal(calculateAttemptPointSummary({ base: 10, adic: 2, infr: 1 }).netAttemptPoints, 11);

// Static integration and responsive contract.
const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
assert.match(appSource, /timer_manganas_pie/);
assert.match(appSource, /timer_manganas_caballo/);
assert.match(appSource, /timer_paso_3min/);
assert.match(appSource, /timer_paso_1min/);
assert.match(appSource, /selectedDetail\.size \? "open"/);
assert.match(appSource, /function isAttemptZeroMarked/);
assert.match(appSource, /attempt\.manganaResult === "NOT_ACHIEVED"/);
assert.match(appSource, /attempt\.pasoResult === "NOT_ACHIEVED"/);
for (const action of [
  "adjust-mangana-floreo",
  "toggle-mangana-floreo-detail",
  "adjust-mangana-pulls",
  "set-mangana-result",
  "set-paso-result",
  "set-mangana-remate",
  "apply-sport-timing"
]) {
  assert.match(appSource, new RegExp(`"${action}": "score"`));
}
assert.match(appSource, /"sport-timer-command": "timer"/);
assert.match(appSource, /Detalle de floreo opcional/);
assert.match(appSource, /Guardar y siguiente/);
assert.doesNotMatch(appSource, /ManganaPieTimerEngine|PasoEngine/);
assert.match(cssSource, /\.cp-manganas-dashboard/);
assert.match(cssSource, /@media \(max-width: 700px\)/);
assert.match(cssSource, /grid-template-columns: minmax\(0, 1fr\)/);

console.log("fmch-2026-manganas-paso-scorer: ok");

function buildContext(suerte) {
  return {
    tournamentId: "tournament_fixture",
    competitionId: "equipos_completo",
    competitionScope: "team",
    charreadaId: "charreada_fixture",
    teamId: "team_fixture",
    suerteId: suerte.id,
    suerte,
    catalog: suerte.catalog,
    opportunityNumber: 1,
    participantSlot: 0,
    ruleResolution: suerte.ruleResolution
  };
}
