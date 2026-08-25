import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_CALA_ADIC_RULES,
  FMCH_2026_CALA_BASE_RULES,
  FMCH_2026_CALA_DESC_RULES,
  FMCH_2026_CALA_INFR_RULES,
  FMCH_2026_CALA_RULEBOOK_VERSION,
  FMCH_2026_CALA_TEAM_PENALTY_RULES,
  calculatePuntaBreakdown
} from "../js/data/calaRules.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import {
  FMCH_2026_LIBRE_PROFILE,
  resolveEffectiveRules,
  resolveRuleProfileSelection
} from "../js/data/ruleProfiles.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  setScoringAttemptDq
} from "../js/core/scoringAttempt.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import {
  applyPuntaCalculation,
  calculateAttemptPointSummary,
  calculateAttemptTotal
} from "../js/core/scoring.js?v=20260825-official-timer-lifecycle-sync-001-v1";

const RELEASE_ID = "20260825-official-timer-lifecycle-sync-001-v1";
const publishedAt = "2026-08-08T18:00:00.000Z";

assert.equal(FMCH_2026_CALA_RULEBOOK_VERSION, "fmch_2026_cala_0.2.0");
assert.equal(FMCH_2026_CALA_BASE_RULES.length, 1);
assert.equal(FMCH_2026_CALA_BASE_RULES[0].pts, 20);
assert.equal(FMCH_2026_CALA_ADIC_RULES.length, 7);
assert.equal(FMCH_2026_CALA_INFR_RULES.length, 43);
assert.equal(FMCH_2026_CALA_TEAM_PENALTY_RULES.length, 2);
assert.equal(FMCH_2026_CALA_DESC_RULES.length, 36);
assert.equal(new Set(FMCH_2026_CALA_INFR_RULES.map((rule) => rule.id)).size, 43);
assert.equal(new Set(FMCH_2026_CALA_DESC_RULES.map((rule) => rule.id)).size, 36);

const productCala = SUERTES.find((suerte) => suerte.id === "cala");
const productCalaBefore = structuredClone(productCala);
const effectiveCala = resolveEffectiveRules({ suerte: productCala, profile: FMCH_2026_LIBRE_PROFILE });
assert.equal(effectiveCala.valid, true);
assert.equal(effectiveCala.suerte.catalog.base.length, 1);
assert.equal(effectiveCala.suerte.catalog.adic.length, 7);
assert.equal(effectiveCala.suerte.catalog.infr.length, 43);
assert.equal(effectiveCala.suerte.catalog.team_infr.length, 2);
assert.equal(effectiveCala.suerte.catalog.desc.length, 36);
assert.equal(effectiveCala.suerte.ruleResolution.profile.profileId, "FMCH_2026_LIBRE");
assert.equal(effectiveCala.suerte.ruleResolution.profile.profileVersion, "0.6.0");
assert.equal(effectiveCala.suerte.ruleMetadata.fieldIdMappingStatus, "CERTIFIED_ALIASES_WITH_NON_SPORTING_CONTROL");
assert.equal(effectiveCala.suerte.ruleMetadata.fieldIdMappings["FMCH.TEAM_SHEET.CALA.MD"].ruleId, "cala_medio_derecho");
assert.equal(effectiveCala.suerte.ruleMetadata.fieldIdMappings["FMCH.TEAM_SHEET.CALA.MI"].ruleId, "cala_medio_izquierdo");
assert.equal(effectiveCala.suerte.ruleMetadata.fieldIdMappings["FMCH.TEAM_SHEET.CALA.PC"].ruleId, "cala_cambio_rectangulo_costado");
assert.equal(effectiveCala.suerte.ruleMetadata.nonSportingControls[0].scoringEffect, "NONE");
assert.deepEqual(productCala, productCalaBefore, "profile resolution does not mutate Product Base");

const calaTournamentOverride = resolveEffectiveRules({
  suerte: productCala,
  profile: FMCH_2026_LIBRE_PROFILE,
  tournamentOverride: {
    rules: [{
      suerteId: "cala",
      category: "adic",
      ruleId: "cala_medio_derecho",
      value: 2
    }]
  }
});
assert.equal(calaTournamentOverride.valid, true);
assert.equal(
  calaTournamentOverride.suerte.catalog.adic.find((rule) => rule.id === "cala_medio_derecho").pts,
  2,
  "the tournament override remains the final resolution layer for Cala"
);
assert.equal(
  effectiveCala.suerte.catalog.adic.find((rule) => rule.id === "cala_medio_derecho").pts,
  1,
  "a tournament override does not mutate the FMCH profile resolution"
);

const profileSelection = resolveRuleProfileSelection({
  ruleProfileId: FMCH_2026_LIBRE_PROFILE.profileId,
  ruleProfileVersion: FMCH_2026_LIBRE_PROFILE.version
});
assert.equal(profileSelection.blocked, true, "the draft profile cannot be activated in production");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
assert.deepEqual(FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds, ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"]);

for (const otherSuerte of SUERTES.filter((suerte) => !FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds.includes(suerte.id))) {
  const before = structuredClone(otherSuerte);
  const effective = resolveEffectiveRules({ suerte: otherSuerte, profile: FMCH_2026_LIBRE_PROFILE });
  assert.equal(effective.valid, true, `${otherSuerte.id} remains resolvable`);
  for (const group of ["base", "adic", "infr", "team_infr", "desc"]) {
    assert.deepEqual(
      effective.suerte.catalog[group].map(({ id, label, pts }) => ({ id, label, pts })),
      (before.catalog[group] || []).map(({ id, label, pts }) => ({ id, label, pts })),
      `${otherSuerte.id}/${group} has no sporting change`
    );
  }
}

assert.equal(calculatePuntaBreakdown({ puntaMetros: 5, puntaPiquetes: 1 }).total, 0);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 5.99, puntaPiquetes: 1 }).total, 3);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 8, puntaPiquetes: 1 }).total, 5);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 8.51, puntaPiquetes: 1 }).metrosCalificados, 8);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 8.52, puntaPiquetes: 1 }).metrosCalificados, 9);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 90, puntaPiquetes: 1 }).total, 87);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 8, puntaPiquetes: 5 }).total, 0);

const repeatableRule = effectiveCala.suerte.catalog.infr.find((rule) => rule.id === "cala_inf_lados_caminando");
assert.equal(repeatableRule.metadata.repeatable, true);
assert.equal(repeatableRule.metadata.maxQuantity, 2);

const legacyAttempt = {
  base: 20,
  adic: 2,
  infr: 4,
  puntaPts: 5,
  puntaMetros: 8,
  puntaMetrosCalificados: 8,
  puntaCentimetros: 0,
  puntaPiquetes: 1,
  desc: null,
  descRuleId: null,
  applied: ["cala_base_completa", "cala_lado_derecho_velocidad", "cala_inf_lados_caminando"],
  ruleQuantities: { cala_inf_lados_caminando: 2 },
  customAdic: [],
  customInfr: [],
  teamPenalties: [{
    id: "cala_equipo_revisor_no_compite",
    label: "Revisor de punta que no participa en otra faena",
    pts: 5,
    quantity: 1,
    total: 5
  }],
  attempted: true,
  notAchieved: false,
  note: "Nota de Cala sintetica",
  timeEvidence: [{ id: "evidence_cala", timeMs: 0, timeText: "", label: "Evidencia sintetica" }]
};
applyPuntaCalculation(legacyAttempt);
const context = {
  tournamentId: "tournament_cala",
  competitionId: "equipos_completo",
  competitionScope: "team",
  charreadaId: "charreada_cala",
  teamId: "team_cala",
  participantId: null,
  suerteId: "cala",
  opportunityNumber: 1,
  participantSlot: 0,
  category: "Libre",
  phase: "Final",
  teamName: "Equipo Cala",
  catalog: effectiveCala.suerte.catalog,
  suerte: effectiveCala.suerte,
  ruleResolution: effectiveCala.suerte.ruleResolution
};
const summary = calculateAttemptPointSummary(legacyAttempt);
assert.deepEqual(summary, {
  goodPoints: 27,
  individualBadPoints: 4,
  teamBadPoints: 5,
  netAttemptPoints: 23,
  teamAdjustedPoints: 18
});

const attemptV2 = adaptLegacyAttemptToV2(legacyAttempt, context, { pointSummary: summary });
const repeatedSelection = attemptV2.infractions.find((selection) => selection.selectedRuleId === repeatableRule.id);
assert.equal(repeatedSelection.quantity, 2);
assert.equal(repeatedSelection.resolvedValue, 2);
assert.equal(repeatedSelection.total, 4);
assert.equal(attemptV2.scoring.calculationDetail.details.metros, 8);
assert.equal(attemptV2.scoring.calculationDetail.details.metrosCalificados, 8);
assert.equal(attemptV2.scoring.calculationDetail.details.distancePoints, 2);
assert.equal(attemptV2.scoring.calculationDetail.details.timePoints, 3);
assert.equal(attemptV2.scoring.calculationDetail.details.totalPoints, 5);
assert.equal(attemptV2.context.ruleProfileId, "FMCH_2026_LIBRE");
assert.equal(attemptV2.context.ruleProfileVersion, "0.6.0");

const dq = setScoringAttemptDq(attemptV2, {
  active: true,
  ruleId: "cala_desc_caida_jinete",
  reason: "Caida del jinete",
  source: "RULE_PROFILE"
});
assert.equal(dq.scoring.goodPoints, 27);
assert.equal(dq.scoring.individualBadPoints, 4);
assert.equal(dq.scoring.teamBadPoints, 5);
assert.equal(dq.scoring.netAttemptPoints, -4);
assert.equal(dq.scoring.teamAdjustedPoints, -9);
assert.deepEqual(dq.scoring.additionalSelections, attemptV2.scoring.additionalSelections);
assert.deepEqual(dq.infractions, attemptV2.infractions);
assert.deepEqual(dq.teamInfractions, attemptV2.teamInfractions);
assert.deepEqual(dq.evidence, attemptV2.evidence);
assert.equal(dq.note, attemptV2.note);

const restored = setScoringAttemptDq(dq, false);
assert.equal(restored.scoring.netAttemptPoints, 23);
assert.equal(restored.scoring.teamAdjustedPoints, 18);
assert.deepEqual(restored.infractions, attemptV2.infractions);
assert.equal(restored.note, attemptV2.note);

const official = buildOfficialScoringAttemptSnapshot(dq, {
  publishedAt,
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez sintetico", role: "Juez" },
  source: "official-score-publication"
});
assert.equal(official.publication.frozen, true);
assert.equal(official.context.ruleProfileVersion, "0.6.0");
assert.equal(official.dq.ruleId, "cala_desc_caida_jinete");
assert.equal(official.scoring.netAttemptPoints, -4);
assert.equal(official.scoring.calculationDetail.details.distancePoints, 2);
assert.equal(official.scoring.calculationDetail.details.timePoints, 3);
assert.throws(() => { official.scoring.netAttemptPoints = 999; }, TypeError);
assert.equal(calculateAttemptTotal({ ...legacyAttempt, desc: "Caida del jinete" }), -4);

const inconsistentPuntaEvidence = structuredClone(attemptV2);
inconsistentPuntaEvidence.scoring.calculationDetail.details.timePoints = 99;
assert.throws(
  () => buildOfficialScoringAttemptSnapshot(inconsistentPuntaEvidence, {
    publishedAt,
    officialRevision: 1,
    source: "cala-punta-inconsistent-evidence-test"
  }),
  /attempt-cala-punta-evidence-total-mismatch/
);

const legacyPublishedScore = { total: 20, breakdown: { base: 20, adic: 0, infr: 0 } };
const legacyPublishedBefore = structuredClone(legacyPublishedScore);
resolveEffectiveRules({ suerte: productCala, profile: FMCH_2026_LIBRE_PROFILE });
assert.deepEqual(legacyPublishedScore, legacyPublishedBefore, "legacy official scores are not recalculated");

const puntaEvidenceCases = [
  { name: "sin punta valida", meters: 5, times: 1, distancePoints: 0, timePoints: 0, total: 0 },
  { name: "cero reglamentario", meters: 6, times: 4, distancePoints: 0, timePoints: 0, total: 0 },
  { name: "distancia y tres tiempos", meters: 7, times: 3, distancePoints: 1, timePoints: 1, total: 2 },
  { name: "distancia y dos tiempos", meters: 8, times: 2, distancePoints: 2, timePoints: 2, total: 4 },
  { name: "distancia y un tiempo", meters: 9, times: 1, distancePoints: 3, timePoints: 3, total: 6 },
  { name: "limite 51 centimetros", meters: 8.51, times: 1, distancePoints: 2, timePoints: 3, total: 5 },
  { name: "sobre limite 51 centimetros", meters: 8.52, times: 1, distancePoints: 3, timePoints: 3, total: 6 }
];

for (const fixture of puntaEvidenceCases) {
  const attempt = {
    ...legacyAttempt,
    puntaMetros: fixture.meters,
    puntaPiquetes: fixture.times,
    puntaPts: fixture.total,
    puntaPuntosDistancia: null,
    puntaPuntosTiempos: null
  };
  const totalBeforeEvidenceFreeze = attempt.puntaPts;
  const calaSummaryBeforeEvidenceFreeze = calculateAttemptPointSummary(attempt);
  applyPuntaCalculation(attempt);
  assert.equal(attempt.puntaPuntosDistancia, fixture.distancePoints, `${fixture.name}: P`);
  assert.equal(attempt.puntaPuntosTiempos, fixture.timePoints, `${fixture.name}: T`);
  assert.equal(attempt.puntaPts, fixture.total, `${fixture.name}: total`);
  assert.equal(attempt.puntaPuntosDistancia + attempt.puntaPuntosTiempos, attempt.puntaPts, `${fixture.name}: P + T`);
  assert.equal(attempt.puntaPts, totalBeforeEvidenceFreeze, `${fixture.name}: total deportivo sin cambio`);
  assert.deepEqual(
    calculateAttemptPointSummary(attempt),
    calaSummaryBeforeEvidenceFreeze,
    `${fixture.name}: total de Cala sin cambio`
  );

  const summaryBeforeFreeze = calculateAttemptPointSummary(attempt);
  const frozen = buildOfficialScoringAttemptSnapshot(
    adaptLegacyAttemptToV2(attempt, context, { pointSummary: summaryBeforeFreeze }),
    { publishedAt, officialRevision: 1, source: "cala-punta-evidence-freeze-test" }
  );
  assert.equal(frozen.scoring.calculationDetail.details.distancePoints, fixture.distancePoints);
  assert.equal(frozen.scoring.calculationDetail.details.timePoints, fixture.timePoints);
  assert.equal(frozen.scoring.calculationDetail.details.totalPoints, fixture.total);
  assert.equal(frozen.scoring.calculationDetail.value, fixture.total);
  assert.equal(frozen.scoring.goodPoints, summaryBeforeFreeze.goodPoints);
  assert.equal(frozen.scoring.netAttemptPoints, summaryBeforeFreeze.netAttemptPoints);
}

const historicalWithoutPuntaSplit = structuredClone(legacyAttempt);
delete historicalWithoutPuntaSplit.puntaPuntosDistancia;
delete historicalWithoutPuntaSplit.puntaPuntosTiempos;
const historicalAttemptV2 = adaptLegacyAttemptToV2(historicalWithoutPuntaSplit, context, {
  pointSummary: calculateAttemptPointSummary(historicalWithoutPuntaSplit)
});
assert.equal(historicalAttemptV2.scoring.calculationDetail.details.distancePoints, null);
assert.equal(historicalAttemptV2.scoring.calculationDetail.details.timePoints, null);
assert.equal(historicalAttemptV2.scoring.calculationDetail.value, 5);

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const stateSource = readFileSync(new URL("../js/core/state.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const configurationSource = readFileSync(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8");
assert.match(appSource, /data-action="punta-input" data-field="puntaMetros"/);
assert.doesNotMatch(appSource, /data-field="puntaMetros"[^>]*max=/);
assert.match(appSource, /function adjustRuleQuantity/);
assert.match(appSource, /descRuleId/);
assert.match(appSource, /async function nextScore\(\)[\s\S]*publishOfficialScoreForContext\(publicationContext,\s*\{[\s\S]*continueOfficialScoreFlowAfterPublish/);
assert.match(appSource, /function buildPublishedScoreSnapshot\(context\)[\s\S]*applyPuntaCalculation\(attempt\)[\s\S]*cala-punta-evidence-total-mismatch/);
assert.match(stateSource, /ruleQuantities:\s*\{\}/);
assert.match(indexSource, /src="\.\/js\/core\/clientBootstrap\.js"/);
assert.match(configurationSource, new RegExp(RELEASE_ID));

console.log("FMCH 2026 Cala scorer: catalog, Punta, quantities, DQ, Attempt V2 and freeze passed.");
