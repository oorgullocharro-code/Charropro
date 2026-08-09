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
} from "../js/data/calaRules.js";
import {
  FMCH_2026_LIBRE_PROFILE,
  resolveEffectiveRules,
  resolveRuleProfileSelection
} from "../js/data/ruleProfiles.js";
import { SUERTES } from "../js/data/suertes.js";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot,
  setScoringAttemptDq
} from "../js/core/scoringAttempt.js";
import { calculateAttemptPointSummary, calculateAttemptTotal } from "../js/core/scoring.js";

const RELEASE_ID = "20260808-fmch-2026-piales-coleadero-001-v1";
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
assert.equal(effectiveCala.suerte.ruleResolution.profile.profileVersion, "0.3.0");
assert.equal(effectiveCala.suerte.ruleMetadata.fieldIdMappingStatus, "FIELDID_MAPPING_BLOCKED");
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
assert.deepEqual(FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds, ["cala", "piales", "colas"]);

for (const otherSuerte of SUERTES.filter((suerte) => !["cala", "piales", "colas"].includes(suerte.id))) {
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
assert.equal(attemptV2.context.ruleProfileId, "FMCH_2026_LIBRE");
assert.equal(attemptV2.context.ruleProfileVersion, "0.3.0");

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
assert.equal(official.context.ruleProfileVersion, "0.3.0");
assert.equal(official.dq.ruleId, "cala_desc_caida_jinete");
assert.equal(official.scoring.netAttemptPoints, -4);
assert.throws(() => { official.scoring.netAttemptPoints = 999; }, TypeError);
assert.equal(calculateAttemptTotal({ ...legacyAttempt, desc: "Caida del jinete" }), -4);

const legacyPublishedScore = { total: 20, breakdown: { base: 20, adic: 0, infr: 0 } };
const legacyPublishedBefore = structuredClone(legacyPublishedScore);
resolveEffectiveRules({ suerte: productCala, profile: FMCH_2026_LIBRE_PROFILE });
assert.deepEqual(legacyPublishedScore, legacyPublishedBefore, "legacy official scores are not recalculated");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const stateSource = readFileSync(new URL("../js/core/state.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(appSource, /data-action="punta-input" data-field="puntaMetros"/);
assert.doesNotMatch(appSource, /data-field="puntaMetros"[^>]*max=/);
assert.match(appSource, /function adjustRuleQuantity/);
assert.match(appSource, /descRuleId/);
assert.match(appSource, /async function nextScore\(\)[\s\S]*publishOfficialScoreForContext\(context\)[\s\S]*continueOfficialScoreFlowAfterPublish/);
assert.match(stateSource, /ruleQuantities:\s*\{\}/);
assert.match(indexSource, new RegExp(RELEASE_ID));

console.log("FMCH 2026 Cala scorer: catalog, Punta, quantities, DQ, Attempt V2 and freeze passed.");
