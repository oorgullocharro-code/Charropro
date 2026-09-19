import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyFmch2026ManganaAttemptTiming,
  applyFmch2026ManganaTechnicalRemate,
  buildFmch2026ManganaFaenaKey,
  getFmch2026ManganaFaenaTimeSettlement,
  recordFmch2026ManganaEventEvidence,
  setFmch2026ManganaManualAdditionalTotal,
  settleFmch2026ManganaFaenaTime,
  validateFmch2026ManganaOfficialCollection,
  validateFmch2026ManganaRemateIdentity,
  validateFmch2026ManganaRemateUniqueness
} from "../js/core/manganasFaenaScoring.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";
import { resolveEffectiveRules, getRuleProfile } from "../js/data/ruleProfiles.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";
import { calculateAttemptTotal, calculateCollectionTotal } from "../js/core/scoring.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";
import { emptyAttempt } from "../js/core/state.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot
} from "../js/core/scoringAttempt.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";

const profile = getRuleProfile("FMCH_2026_LIBRE", "0.6.1");
const pie = resolveEffectiveRules({
  suerte: SUERTES.find((item) => item.id === "manganas_pie"),
  profile
}).suerte;
const caballo = resolveEffectiveRules({
  suerte: SUERTES.find((item) => item.id === "manganas_caballo"),
  profile
}).suerte;
const identity = {
  tournamentId: "torneo_test",
  competitionId: "equipos_completo",
  charreadaId: "charreada_test",
  teamId: "equipo_test",
  suerteId: "manganas_pie",
  timerId: "timer_manganas_pie:test"
};

function achievedPieAttempt() {
  return {
    ...emptyAttempt(),
    base: 10,
    initializedBase: true,
    attempted: true,
    manganaResult: "ACHIEVED",
    applied: ["manganas_pie_base_sencilla_pasada"]
  };
}

function settle(attempts, overrides = {}) {
  return settleFmch2026ManganaFaenaTime(attempts, pie, {
    ...identity,
    officialElapsedMs: 240000,
    wallElapsedMs: 240000,
    status: "FINISHED",
    ...overrides
  });
}

assert.equal(buildFmch2026ManganaFaenaKey(identity).includes("torneo_test"), true);

// TIME-01..05: the same seven-minute faena can own only one temporal settlement.
const threeAchieved = [achievedPieAttempt(), achievedPieAttempt(), achievedPieAttempt()];
const firstSettlement = settle(threeAchieved);
assert.equal(firstSettlement.settlement.points, 3);
assert.equal(firstSettlement.attempts.filter((attempt) => attempt.manganaFaenaTimeSettlement?.points === 3).length, 1);
assert.deepEqual(
  firstSettlement.attempts.map((attempt) => attempt.ruleQuantities.manganas_pie_adic_tiempo_no_usado || 0),
  [0, 0, 3]
);
assert.equal(calculateCollectionTotal(firstSettlement.attempts, pie), 33);

const secondSettlement = settle(firstSettlement.attempts);
assert.deepEqual(secondSettlement, firstSettlement, "reapplying the same timer evidence is idempotent");
assert.equal(getFmch2026ManganaFaenaTimeSettlement(secondSettlement.attempts)?.points, 3);

for (const successes of [0, 1, 2, 3]) {
  const attempts = Array.from({ length: 3 }, (_, index) => index < successes
    ? achievedPieAttempt()
    : { ...emptyAttempt(), manganaResult: "NOT_ACHIEVED", attempted: true, notAchieved: true });
  const result = settle(attempts);
  assert.equal(result.settlement.points, successes === 0 ? 0 : 3);
  assert.equal(
    result.attempts.reduce((sum, attempt) => sum + Number(attempt.ruleQuantities.manganas_pie_adic_tiempo_no_usado || 0), 0),
    successes === 0 ? 0 : 3
  );
}

const duplicateOfficialInput = firstSettlement.attempts.map((attempt) => ({ ...attempt }));
duplicateOfficialInput[0] = {
  ...duplicateOfficialInput[0],
  manganaFaenaTimeSettlement: { ...firstSettlement.settlement, ownerOpportunityNumber: 1 },
  applied: [...duplicateOfficialInput[0].applied, "manganas_pie_adic_tiempo_no_usado"],
  ruleQuantities: { ...duplicateOfficialInput[0].ruleQuantities, manganas_pie_adic_tiempo_no_usado: 3 },
  adic: Number(duplicateOfficialInput[0].adic || 0) + 3
};
const officialGuard = validateFmch2026ManganaOfficialCollection(duplicateOfficialInput, pie, identity);
assert.equal(officialGuard.valid, false);
assert.ok(officialGuard.errors.includes("manganas-faena-time-settlement-duplicate"));

// A UI-created NOT_ACHIEVED opportunity may legitimately omit optional scoring collections.
// Faena settlement must normalize that sparse draft before Attempt V2 publication.
const physicalMixedAttempts = [
  applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), pie, {
    name: "Rodada",
    effectFinal: "rodada",
    orientation: "MASK",
    turnDirection: "SAME"
  }),
  applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), pie, {
    name: "Bigotona",
    effectFinal: "bigotona",
    orientation: "MASK",
    turnDirection: "SAME"
  }),
  {
    attempted: true,
    notAchieved: true,
    manganaResult: "NOT_ACHIEVED",
    base: 0,
    adic: 0,
    infr: 0
  }
];
const physicalMixedSettlement = settle(physicalMixedAttempts);
assert.equal(physicalMixedSettlement.settlement.points, 3);
assert.equal(validateFmch2026ManganaOfficialCollection(physicalMixedSettlement.attempts, pie, identity).valid, true);
assert.deepEqual(
  physicalMixedSettlement.attempts.map((attempt) => attempt.ruleQuantities.manganas_pie_adic_tiempo_no_usado || 0),
  [0, 0, 3]
);
assert.equal(physicalMixedSettlement.attempts[2].manganaRemate, undefined);

for (const successes of [0, 1]) {
  const sparseAttempts = Array.from({ length: 3 }, (_, index) => index < successes
    ? applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), pie, {
        name: `Remate ${index + 1}`,
        effectFinal: `remate ${index + 1}`,
        orientation: "MASK",
        turnDirection: "SAME"
      })
    : { attempted: true, notAchieved: true, manganaResult: "NOT_ACHIEVED", base: 0, adic: 0, infr: 0 });
  const sparseSettlement = settle(sparseAttempts);
  assert.equal(sparseSettlement.settlement.points, successes ? 3 : 0);
  assert.equal(validateFmch2026ManganaOfficialCollection(sparseSettlement.attempts, pie, identity).valid, true);
}

const officialContext = {
  ...identity,
  competitionScope: "team",
  opportunityNumber: 3,
  participantSlot: 0,
  suerte: pie,
  catalog: pie.catalog,
  ruleResolution: pie.ruleResolution
};
const officialOwnerAttempt = applyFmch2026ManganaTechnicalRemate(firstSettlement.attempts[2], pie, {
  name: "Rodada",
  effectFinal: "rodada",
  orientation: "MASK",
  turnDirection: "SAME"
});
const officialOwner = adaptLegacyAttemptToV2(officialOwnerAttempt, officialContext);
const frozenOwner = buildOfficialScoringAttemptSnapshot(officialOwner, {
  publishedAt: "2026-09-13T12:00:00.000Z",
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez fixture", role: "juez" }
});
assert.equal(frozenOwner.sportState.manganaFaenaTimeSettlement.points, 3);
assert.equal(frozenOwner.identity.opportunityNumber, 3);
assert.equal(frozenOwner.sportState.remate.remateSignature, frozenOwner.sportState.remate.signature);

const physicalNotAchievedOwner = adaptLegacyAttemptToV2(
  physicalMixedSettlement.attempts[2],
  officialContext
);
const frozenPhysicalNotAchievedOwner = buildOfficialScoringAttemptSnapshot(physicalNotAchievedOwner, {
  publishedAt: "2026-09-13T12:00:00.000Z",
  officialRevision: 1,
  actor: { id: "judge_fixture", name: "Juez fixture", role: "juez" }
});
assert.equal(frozenPhysicalNotAchievedOwner.sportState.result, "NOT_ACHIEVED");
assert.equal(frozenPhysicalNotAchievedOwner.sportState.remate, null);
assert.equal(frozenPhysicalNotAchievedOwner.sportState.manganaFaenaTimeSettlement.points, 3);

// REMATE-01..03: technical identity is independent from scoring points.
const rodada = applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), pie, {
  name: "Rodada",
  effectFinal: "rodada",
  orientation: "MASK",
  turnDirection: "SAME",
  bodyFinish: ""
});
assert.equal(validateFmch2026ManganaRemateIdentity(rodada.manganaRemate).valid, true);
assert.equal(calculateAttemptTotal(rodada), 10, "a documented remate may add zero points");
assert.equal(rodada.manganaRemate.remateName, "Rodada");
assert.equal(rodada.manganaRemate.remateSignature, rodada.manganaRemate.signature);

const bigotona = applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), pie, {
  name: "Bigotona",
  effectFinal: "bigotona",
  orientation: "MASK",
  turnDirection: "SAME"
});
const contraRodada = applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), pie, {
  name: "Contra rodada",
  effectFinal: "rodada",
  orientation: "COUNTER_MASK",
  turnDirection: "OPPOSITE"
});
assert.equal(validateFmch2026ManganaRemateUniqueness([rodada, bigotona, contraRodada]).valid, true);
assert.equal(validateFmch2026ManganaRemateUniqueness([rodada, bigotona, rodada]).valid, false);

const missingRemateV2 = adaptLegacyAttemptToV2({
  ...achievedPieAttempt(),
  manganaScoringContractVersion: "2.0.0"
}, { ...officialContext, opportunityNumber: 1 });
assert.throws(
  () => buildOfficialScoringAttemptSnapshot(missingRemateV2, {
    publishedAt: "2026-09-13T12:00:00.000Z",
    actor: { id: "judge_fixture", name: "Juez fixture", role: "juez" }
  }),
  /manganas-official-remate-required/
);

const caballoRodada = applyFmch2026ManganaTechnicalRemate(achievedPieAttempt(), caballo, {
  shortcutId: "manganas_caballo_base_rodada"
});
assert.equal(validateFmch2026ManganaRemateIdentity(caballoRodada.manganaRemate).valid, true);
assert.equal(caballoRodada.manganaRemate.scoringRuleId, "manganas_caballo_base_rodada");

// FLOREO/ADDITIONAL: detail remains documentary and the quick +/- total remains authoritative.
const withManualAdditional = setFmch2026ManganaManualAdditionalTotal(rodada, pie, 2);
withManualAdditional.floreoDetail = [{
  selectedRuleId: "manganas_pie_floreo_giro_contrario",
  label: "Giro al sentido contrario",
  resolvedValue: 3,
  source: "FMCH_2026"
}];
assert.equal(calculateAttemptTotal(withManualAdditional), 12, "documentary detail must not double-count the quick total");
const manualAdditionalV2 = adaptLegacyAttemptToV2(withManualAdditional, { ...officialContext, opportunityNumber: 1 });
assert.equal(manualAdditionalV2.sportState.manganaManualAdditionalTotal, 2);
assert.equal(
  manualAdditionalV2.scoring.additionalSelections.some((item) => item.selectedRuleId === "manganas_pie_manual_additional_total"),
  true
);

// Placement and down evidence are distinct; down time alone cannot infer placement.
let minuteSeven = recordFmch2026ManganaEventEvidence(rodada, "PLACED", {
  timerId: identity.timerId,
  officialElapsedMs: 390000
});
minuteSeven = recordFmch2026ManganaEventEvidence(minuteSeven, "DOWN", {
  timerId: identity.timerId,
  officialElapsedMs: 425000
});
minuteSeven = applyFmch2026ManganaAttemptTiming(minuteSeven, pie, {
  timerId: identity.timerId,
  officialElapsedMs: 425000,
  hasConsumed: true,
  sequenceComplete: true
});
assert.equal(minuteSeven.desc, null);
assert.equal(minuteSeven.applied.includes("manganas_pie_infr_minuto_7"), true);
assert.equal(calculateAttemptTotal(minuteSeven), 7);

const downOnly = applyFmch2026ManganaAttemptTiming(
  recordFmch2026ManganaEventEvidence(rodada, "DOWN", {
    timerId: identity.timerId,
    officialElapsedMs: 425000
  }),
  pie,
  { timerId: identity.timerId, officialElapsedMs: 425000, hasConsumed: true, sequenceComplete: true }
);
assert.equal(downOnly.descRuleId, "manganas_pie_desc_tiempo_agotado");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /Adicionales/);
assert.match(appSource, /Detalle de floreo opcional/);
assert.match(appSource, /Adicional por tiempo de la faena/);
assert.match(appSource, /Identidad técnica del remate/);
assert.match(appSource, /Rodada/);
assert.match(appSource, /Bigotona/);
assert.match(appSource, /Contra rodada/);
assert.match(appSource, /Otro \/ captura técnica/);
assert.match(appSource, /data-action="select-mangana-remate-shortcut"/);
assert.match(appSource, /isManganaRemateShortcutSelected\(technicalRemate, shortcut\)/);
assert.match(appSource, /data-action="save-mangana-remate"/);

const stylesSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
assert.match(stylesSource, /"technical history"\s+"effects history"/);
assert.match(stylesSource, /\.cp-mangana-technical-remate\s*\{\s*grid-area:\s*technical/);
assert.match(stylesSource, /\.cp-mangana-remate-effects\s*\{\s*grid-area:\s*effects/);
assert.doesNotMatch(stylesSource, /\.scoring-shell-classic \.cp-mangana-remates\s*\{\s*grid-area:\s*remates/);

console.log("fmch-manganas-time-remate-practical-capture: PASS");
