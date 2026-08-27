import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_COLEADERO_ADIC_RULES,
  FMCH_2026_COLEADERO_BASE_RULES,
  FMCH_2026_COLEADERO_DESC_RULES,
  FMCH_2026_COLEADERO_INFR_RULES,
  FMCH_2026_COLEADERO_RULEBOOK_VERSION,
  FMCH_2026_COLEADERO_TEAM_PENALTY_RULES,
  FMCH_2026_PIALES_ADIC_RULES,
  FMCH_2026_PIALES_BASE_RULES,
  FMCH_2026_PIALES_DESC_RULES,
  FMCH_2026_PIALES_DISTANCE_RULE_ID,
  FMCH_2026_PIALES_INFR_RULES,
  FMCH_2026_PIALES_REPEATED_REMATE_DQ_RULE_ID,
  FMCH_2026_PIALES_RULEBOOK_VERSION,
  FMCH_2026_PIALES_TEAM_PENALTY_RULES,
  buildPialesRemateHistory,
  calculatePialesDistanceAdditional,
  resolveConditionalBasePoints,
  shouldDisqualifyRepeatedThirdPialesRemate
} from "../js/data/fmch2026PialesColeaderoRules.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";
import { FMCH_2026_LIBRE_PROFILE, resolveEffectiveRules } from "../js/data/ruleProfiles.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  setScoringAttemptDq
} from "../js/core/scoringAttempt.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";
import { calculateAttemptPointSummary, calculateAttemptTotal } from "../js/core/scoring.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";
import { createScoreCollection, emptyAttempt } from "../js/core/state.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";

const publishedAt = "2026-08-08T20:00:00.000Z";
const productPiales = SUERTES.find((suerte) => suerte.id === "piales");
const productColas = SUERTES.find((suerte) => suerte.id === "colas");
const legacyPiales = structuredClone(productPiales);
const legacyColas = structuredClone(productColas);
const effectivePiales = resolveEffectiveRules({ suerte: productPiales, profile: FMCH_2026_LIBRE_PROFILE });
const effectiveColas = resolveEffectiveRules({ suerte: productColas, profile: FMCH_2026_LIBRE_PROFILE });

assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
assert.deepEqual(FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds, ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"]);
assert.equal(FMCH_2026_PIALES_RULEBOOK_VERSION, "fmch_2026_piales_0.3.0");
assert.equal(FMCH_2026_COLEADERO_RULEBOOK_VERSION, "fmch_2026_coleadero_0.3.0");

assert.equal(effectivePiales.valid, true);
assert.equal(effectiveColas.valid, true);
assert.deepEqual(effectivePiales.suerte.catalog.base.map(({ label, pts }) => [label, pts]), [
  ["Lazo de verijas", 14],
  ["Remolineado adelante", 18],
  ["Remolineado atras", 20],
  ["Piquete adelante", 22],
  ["Piquete atras", 24],
  ["Rompe chaqueta por lado del lienzo", 26],
  ["Floreado adelante", 28],
  ["Floreado atras", 30]
]);
assert.equal(effectivePiales.suerte.catalog.adic.length, 4);
assert.equal(effectivePiales.suerte.catalog.infr.length, 13);
assert.equal(effectivePiales.suerte.catalog.team_infr.length, 1);
assert.equal(effectivePiales.suerte.catalog.desc.length, 17);
assert.equal(effectivePiales.suerte.ruleMetadata.sportingCertification, "PASS");
assert.equal(effectivePiales.suerte.attempts, 3);

assert.equal(calculatePialesDistanceAdditional(3.8, "piales_base_floreado_atras"), 3);
assert.equal(calculatePialesDistanceAdditional(3, "piales_base_verijas"), 0);
assert.equal(calculatePialesDistanceAdditional(-1, "piales_base_floreado_atras"), 0);
assert.equal(FMCH_2026_PIALES_ADIC_RULES.find((rule) => rule.id === FMCH_2026_PIALES_DISTANCE_RULE_ID).metadata.specializedInput, "distanceMeters");

const pialesAttempts = [
  { base: 18, remateId: "piales_base_remolineado_adelante", remateLabel: "Remolineado adelante" },
  { base: 18, remateId: "piales_base_remolineado_adelante", remateLabel: "Remolineado adelante" },
  { base: 18, remateId: "piales_base_remolineado_adelante", remateLabel: "Remolineado adelante" }
];
assert.equal(shouldDisqualifyRepeatedThirdPialesRemate(pialesAttempts, 2, pialesAttempts[2].remateId), true);
assert.equal(shouldDisqualifyRepeatedThirdPialesRemate(pialesAttempts, 1, pialesAttempts[1].remateId), false);
assert.equal(buildPialesRemateHistory(pialesAttempts).length, 3);
assert.ok(effectivePiales.suerte.catalog.desc.some((rule) => rule.id === FMCH_2026_PIALES_REPEATED_REMATE_DQ_RULE_ID));

const pialesAttempt = {
  ...emptyAttempt(),
  base: 28,
  adic: 5,
  infr: 2,
  distanceMeters: 3.4,
  distanceAdditionalPoints: 3,
  remateId: "piales_base_floreado_adelante",
  remateLabel: "Floreado adelante",
  attempted: true,
  applied: [
    "piales_base_floreado_adelante",
    FMCH_2026_PIALES_DISTANCE_RULE_ID,
    "piales_adic_relleno_madera",
    "piales_infr_tiempo_excedido_minuto"
  ],
  ruleQuantities: { [FMCH_2026_PIALES_DISTANCE_RULE_ID]: 3 }
};
const pialesSummary = calculateAttemptPointSummary(pialesAttempt);
assert.equal(pialesSummary.netAttemptPoints, 31);
const pialesV2 = adaptLegacyAttemptToV2(pialesAttempt, buildContext(effectivePiales.suerte, 1));
assert.equal(pialesV2.sportState.remate.remateId, "piales_base_floreado_adelante");
assert.equal(pialesV2.scoring.calculationDetail.type, "piales_distancia");
assert.equal(pialesV2.scoring.calculationDetail.details.distanceMeters, 3.4);
assert.equal(pialesV2.scoring.additionalSelections.find((item) => item.selectedRuleId === FMCH_2026_PIALES_DISTANCE_RULE_ID).quantity, 3);

const pialesDq = setScoringAttemptDq(pialesV2, {
  active: true,
  ruleId: FMCH_2026_PIALES_REPEATED_REMATE_DQ_RULE_ID,
  reason: "Tercer remate no diferente",
  source: "RULE_PROFILE"
});
assert.equal(pialesDq.scoring.netAttemptPoints, -2);
assert.equal(pialesDq.infractions.length, pialesV2.infractions.length);
assert.equal(calculateAttemptTotal({ ...pialesAttempt, desc: "Descalificacion" }), -2);
assert.notEqual(
  adaptLegacyAttemptToV2({ ...emptyAttempt(), attempted: true, notAchieved: true }, buildContext(effectivePiales.suerte, 1)).sportState.status,
  "DQ"
);

const pialesManual = { ...emptyAttempt(), adic: 4, infr: 3, customAdic: [{ id: "manual_a", label: "Confirmado", pts: 4 }], customInfr: [{ id: "manual_i", label: "Confirmada", pts: 3 }] };
const pialesManualV2 = adaptLegacyAttemptToV2(pialesManual, buildContext(effectivePiales.suerte, 2));
assert.equal(pialesManualV2.scoring.additionalSelections.some((item) => item.manual), true);
assert.equal(pialesManualV2.infractions.some((item) => item.manual), true);

assert.deepEqual(effectiveColas.suerte.catalog.base.map(({ label, pts }) => [label, pts]), [
  ["Redonda derecha", 12],
  ["Media derecha", 10],
  ["Sobre lomo derecha", 10],
  ["Sobre lomo izquierda", 6],
  ["Redonda contraria", 8],
  ["Media contraria", 6],
  ["Panzazo", 6],
  ["Senton", 6],
  ["Molinete", 6]
]);
assert.equal(effectiveColas.suerte.catalog.adic.length, 5);
assert.equal(effectiveColas.suerte.catalog.infr.length, 23);
assert.equal(effectiveColas.suerte.catalog.team_infr.length, 2);
assert.equal(effectiveColas.suerte.catalog.desc.length, 15);
assert.equal(effectiveColas.suerte.ruleMetadata.fourthRowStatus, "NON_SPORTING_ADMINISTRATIVE_ROW");
assert.deepEqual(effectiveColas.suerte.ruleMetadata.blockedFieldIds, []);
assert.equal(effectiveColas.suerte.ruleMetadata.activeParticipantCount, 3);
assert.equal(effectiveColas.suerte.ruleMetadata.opportunitiesPerParticipant, 3);
assert.equal(effectiveColas.suerte.ruleMetadata.nonSportingControls.length, 2);
assert.equal(effectiveColas.suerte.ruleMetadata.nonSportingControls.every((item) => item.scoringEffect === "NONE"), true);
assert.equal(FMCH_2026_COLEADERO_BASE_RULES.every((rule) => rule.metadata.suppressGenericIcon), true);
assert.equal(FMCH_2026_COLEADERO_BASE_RULES.every((rule) => rule.metadata.officialDiagramAvailable === false), true);
assert.equal(FMCH_2026_COLEADERO_ADIC_RULES.filter((rule) => rule.metadata.exclusiveGroup === "distance").length, 3);
assert.equal(FMCH_2026_COLEADERO_TEAM_PENALTY_RULES.length, 2);

const colasCollection = createScoreCollection(effectiveColas.suerte);
assert.equal(colasCollection.length, 3);
assert.equal(colasCollection.every((attempts) => attempts.length === 3), true);

const colasAttempt = {
  ...emptyAttempt(),
  base: 12,
  adic: 3,
  infr: 2,
  attempted: true,
  applied: ["colas_base_redonda_derecha", "colas_adic_antes_30m", "colas_infr_no_saludar"],
  teamPenalties: [{ id: "colas_team_apretador_lado_sombra", label: "Apretador", pts: 4 }]
};
assert.equal(calculateAttemptTotal(colasAttempt), 13);
const colasV2 = adaptLegacyAttemptToV2(colasAttempt, buildContext(effectiveColas.suerte, 1, 2));
assert.equal(colasV2.identity.participantSlot, 2);
assert.equal(colasV2.scoring.baseSelection.selectedRuleId, "colas_base_redonda_derecha");
assert.equal(colasV2.teamInfractions[0].resolvedValue, 4);
assert.equal(resolveConditionalBasePoints(colasAttempt, effectiveColas.suerte.catalog), 12);
const colasAnnulled = {
  ...colasAttempt,
  applied: [...colasAttempt.applied, "colas_infr_dos_intentos_arcionar"]
};
assert.equal(resolveConditionalBasePoints(colasAnnulled, effectiveColas.suerte.catalog), 0);

const colasDq = setScoringAttemptDq(colasV2, {
  active: true,
  ruleId: "colas_desc_caida_caballo",
  reason: "Caida del caballo",
  source: "RULE_PROFILE"
});
assert.equal(colasDq.scoring.netAttemptPoints, -2);
assert.equal(colasDq.scoring.teamBadPoints, 4);
assert.deepEqual(colasDq.infractions, colasV2.infractions);
const officialColas = buildOfficialScoringAttemptSnapshot(colasDq, {
  publishedAt,
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez sintetico", role: "Juez" },
  source: "official-score-publication"
});
assert.equal(officialColas.publication.frozen, true);
assert.equal(officialColas.context.ruleProfileVersion, "0.6.0");
assert.throws(() => { officialColas.scoring.netAttemptPoints = 999; }, TypeError);

assert.deepEqual(productPiales, legacyPiales, "Product Base Piales remains physically intact for legacy reads");
assert.deepEqual(productColas, legacyColas, "Product Base Coleadero remains physically intact for legacy reads");
for (const suerte of SUERTES.filter((item) => !["cala", "piales", "colas"].includes(item.id))) {
  const before = structuredClone(suerte);
  resolveEffectiveRules({ suerte, profile: FMCH_2026_LIBRE_PROFILE });
  assert.deepEqual(suerte, before, `${suerte.id} is not modified by the profile`);
}

assert.equal(FMCH_2026_PIALES_BASE_RULES.length, 8);
assert.equal(FMCH_2026_PIALES_INFR_RULES.length, 13);
assert.equal(FMCH_2026_PIALES_TEAM_PENALTY_RULES.length, 1);
assert.equal(FMCH_2026_PIALES_DESC_RULES.length, 17);
assert.equal(FMCH_2026_COLEADERO_INFR_RULES.length, 23);
assert.equal(FMCH_2026_COLEADERO_DESC_RULES.length, 15);

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const fixtureSource = readFileSync(new URL("./fixtures/fmch-piales-coleadero-runtime.html", import.meta.url), "utf8");
assert.match(appSource, /data-action="piales-distance-input"/);
assert.match(appSource, /buildPialesRemateHistory\(getAttemptsForContext\(context\)\)/);
assert.match(appSource, /getColeadorDisplayName\(context, index\)/);
assert.match(appSource, /suppressGenericIcon/);
assert.match(appSource, /hasConditionalBaseRules/);
assert.match(appSource, /publishOfficialScoreForContext\(publicationContext,\s*\{/);
assert.match(cssSource, /\.cp-piales-distance/);
assert.match(cssSource, /\.cp-official-fall-diagram/);
assert.match(fixtureSource, /http:\/\/127\.0\.0\.1:9000/);
assert.match(fixtureSource, /demo-charropro-local/);
assert.match(fixtureSource, /fixture-loopback-required/);
assert.doesNotMatch(fixtureSource, /charropro-e8a68|firebaseio\.com|firebasestorage\.app/);

console.log("FMCH 2026 Piales/Coleadero: catalogs, conditions, Attempt V2, DQ, freeze and legacy passed.");

function buildContext(suerte, opportunityNumber, participantSlot = 0) {
  return {
    tournamentId: "tournament_fmch_2026",
    competitionId: "equipos_completo",
    competitionScope: "team",
    charreadaId: "charreada_fmch_2026",
    teamId: "team_fmch_2026",
    participantId: null,
    participantName: participantSlot === 0 ? "Alberto Demo" : `Coleador Demo ${participantSlot + 1}`,
    teamName: "Equipo Demo FMCH",
    horseName: "Caballo Demo",
    suerteId: suerte.id,
    opportunityNumber,
    participantSlot,
    category: "Libre",
    phase: "Final",
    catalog: suerte.catalog,
    suerte,
    ruleResolution: suerte.ruleResolution
  };
}
