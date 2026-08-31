import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ATTEMPT_PUBLICATION_STATES,
  ATTEMPT_SPORT_STATUSES,
  SCORING_ATTEMPT_CONTRACT_VERSION,
  SCORING_ATTEMPT_SCHEMA_VERSION,
  SCORING_ATTEMPT_WRITE_MODE,
  adaptLegacyAttemptToV2,
  buildEffectiveRulesFingerprint,
  buildOfficialScoringAttemptSnapshot,
  buildScoringAttemptIdentity,
  calculateScoringAttemptV2Points,
  isScoringAttemptV2,
  normalizeScoringAttemptV2,
  serializeScoringAttemptV2,
  setScoringAttemptDq,
  updateScoringAttemptClassification,
  validateScoringAttemptV2
} from "../js/core/scoringAttempt.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import { calculateAttemptPointSummary, calculateAttemptTotal } from "../js/core/scoring.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

const publishedAt = "2026-08-08T12:00:00.000Z";
const actor = { id: "judge_1", name: "Juez Sintetico", role: "Juez" };

function legacyContext(overrides = {}) {
  return {
    tournamentId: "tournament_1",
    competitionId: "equipos_completo",
    competitionScope: "team",
    charreadaId: "charreada_1",
    teamId: "team_1",
    participantId: null,
    suerteId: "cala",
    opportunityNumber: 1,
    participantSlot: 0,
    category: "Libre",
    phase: "Final",
    teamName: "Equipo Uno",
    catalog: {
      base: [{ id: "base_20", label: "Base", pts: 20 }],
      adic: [{ id: "adic_3", label: "Adicional", pts: 3 }],
      infr: [{ id: "infr_2", label: "Infraccion", pts: 2 }],
      team_infr: [{ id: "team_4", label: "Equipo", pts: 4 }],
      desc: [{ id: "dq_caida", label: "Descalificado", pts: 0 }]
    },
    ruleResolution: {
      contractVersion: "1.0.0",
      profile: { profileId: "fmch_2026_libre", profileVersion: "1.0.0" },
      layers: ["PRODUCT_BASE"]
    },
    ...overrides
  };
}

function legacyAttempt(overrides = {}) {
  return {
    base: 20,
    adic: 3,
    infr: 2,
    puntaPts: 0,
    puntaMetros: 0,
    puntaPiquetes: 1,
    tiempo: "00:18.200",
    desc: null,
    applied: ["base_20", "adic_3", "infr_2"],
    customAdic: [],
    customInfr: [],
    teamPenalties: [],
    attempted: true,
    notAchieved: false,
    initializedBase: true,
    note: "Nota operativa",
    timeEvidence: [{
      id: "evidence_1",
      label: "Tiempo oficial",
      timeMs: 18200,
      timeText: "00:18.200",
      capturedAt: publishedAt,
      timerRunning: false
    }],
    ...overrides
  };
}

const source = legacyAttempt();
const sourceBefore = structuredClone(source);
const simple = adaptLegacyAttemptToV2(source, legacyContext(), {
  actor,
  adaptedAt: publishedAt,
  pointSummary: calculateAttemptPointSummary(source)
});

assert.deepEqual(source, sourceBefore, "the legacy adapter does not mutate its input");
assert.equal(SCORING_ATTEMPT_SCHEMA_VERSION, 2);
assert.equal(SCORING_ATTEMPT_CONTRACT_VERSION, "2.0.0");
assert.equal(SCORING_ATTEMPT_WRITE_MODE, "official_snapshot_only");
assert.ok(ATTEMPT_SPORT_STATUSES.includes("ZERO"));
assert.ok(ATTEMPT_SPORT_STATUSES.includes("LOST_OPPORTUNITY"));
assert.deepEqual(ATTEMPT_PUBLICATION_STATES, ["DRAFT", "OFFICIAL"]);
assert.equal(isScoringAttemptV2(simple), true);
assert.equal(simple.scoring.goodPoints, 23);
assert.equal(simple.scoring.individualBadPoints, 2);
assert.equal(simple.scoring.teamBadPoints, 0);
assert.equal(simple.scoring.netAttemptPoints, 21);
assert.equal(simple.scoring.teamAdjustedPoints, 21);
assert.equal(simple.scoring.baseSelection.selectedRuleId, "base_20");
assert.equal(simple.scoring.additionalSelections[0].selectedRuleId, "adic_3");
assert.equal(simple.infractions[0].selectedRuleId, "infr_2");
assert.equal(simple.evidence[0].timeMs, 18200);
assert.equal(simple.note, "Nota operativa");
assert.equal(simple.context.ruleProfileId, "fmch_2026_libre");
assert.equal(simple.context.ruleProfileVersion, "1.0.0");
assert.match(simple.context.effectiveRulesFingerprint, /^rules_[a-f0-9]+$/);
assert.equal(validateScoringAttemptV2(simple).valid, true);

const identityA = buildScoringAttemptIdentity(legacyContext());
const identityARepeat = buildScoringAttemptIdentity(legacyContext());
const identityB = buildScoringAttemptIdentity({ ...legacyContext(), opportunityNumber: 2 });
assert.equal(identityA.attemptId, identityARepeat.attemptId, "identity is deterministic");
assert.notEqual(identityA.attemptId, identityB.attemptId, "opportunity belongs to identity");

const dq = setScoringAttemptDq(simple, {
  active: true,
  ruleId: "dq_caida",
  reason: "Descalificado",
  source: "PRODUCT_BASE"
});
assert.equal(dq.sportState.status, "DQ");
assert.equal(dq.dq.active, true);
assert.equal(dq.scoring.goodPoints, 23, "DQ preserves reconstructable good points");
assert.equal(dq.scoring.netAttemptPoints, -2, "DQ nullifies good points and preserves bad points");
assert.equal(dq.scoring.individualBadPoints, 2);
assert.deepEqual(dq.scoring.baseSelection, simple.scoring.baseSelection);
assert.deepEqual(dq.scoring.additionalSelections, simple.scoring.additionalSelections);
assert.deepEqual(dq.infractions, simple.infractions);
assert.deepEqual(dq.evidence, simple.evidence);
assert.equal(dq.note, simple.note);
assert.equal(simple.dq.active, false, "DQ operation is pure");

const restored = setScoringAttemptDq(dq, false);
assert.equal(restored.dq.active, false);
assert.equal(restored.dq.reason, "Descalificado", "draft keeps the DQ audit reason");
assert.equal(restored.scoring.netAttemptPoints, 21);
assert.deepEqual(restored.scoring.baseSelection, simple.scoring.baseSelection);
assert.deepEqual(restored.scoring.additionalSelections, simple.scoring.additionalSelections);
assert.deepEqual(restored.infractions, simple.infractions);
assert.deepEqual(restored.evidence, simple.evidence);
assert.equal(restored.note, simple.note);

const classified = normalizeScoringAttemptV2({
  ...simple,
  sportState: {
    ...simple.sportState,
    classification: { classificationId: "EXCELENTE", classificationLabel: "Excelente" }
  },
  scoring: {
    ...simple.scoring,
    additionalSelections: [{
      selectionId: "selection_A",
      selectedRuleId: "rule_A",
      label: "Adicional A",
      category: "additional",
      value: 3,
      resolvedValue: 3,
      quantity: 1,
      total: 3,
      source: "TEST_MATRIX",
      manual: false,
      valueByClassification: { EXCELENTE: 3, BUENA: 1 }
    }]
  }
});
const reclassified = updateScoringAttemptClassification(classified, {
  classificationId: "BUENA",
  classificationLabel: "Buena"
});
assert.equal(reclassified.scoring.additionalSelections[0].selectionId, "selection_A");
assert.equal(reclassified.scoring.additionalSelections[0].selectedRuleId, "rule_A");
assert.equal(reclassified.scoring.additionalSelections[0].resolvedValue, 1);
assert.equal(reclassified.scoring.additionalSelections[0].total, 1);
assert.equal(classified.scoring.additionalSelections[0].resolvedValue, 3, "classification update is pure");

const manualLegacy = legacyAttempt({
  adic: 5,
  infr: 3,
  customAdic: [{ id: "manual_add_2", label: "Prueba adicional", pts: 2 }],
  customInfr: [{ id: "manual_infr_1", label: "Prueba infraccion", pts: 1 }],
  teamPenalties: [{ id: "team_4", label: "Equipo", pts: 4, quantity: 1, total: 4 }]
});
const manual = adaptLegacyAttemptToV2(manualLegacy, legacyContext(), {
  pointSummary: calculateAttemptPointSummary(manualLegacy)
});
assert.equal(manual.scoring.additionalSelections.find((item) => item.selectionId === "manual_add_2").manual, true);
assert.equal(manual.scoring.additionalSelections.find((item) => item.selectionId === "manual_add_2").reason, "Prueba adicional");
assert.equal(manual.infractions.find((item) => item.selectionId === "manual_infr_1").manual, true);
assert.equal(manual.infractions.find((item) => item.selectionId === "manual_infr_1").reason, "Prueba infraccion");
assert.equal(manual.scoring.individualBadPoints, 3);
assert.equal(manual.scoring.teamBadPoints, 4);
assert.equal(manual.scoring.netAttemptPoints, 22);
assert.equal(manual.scoring.teamAdjustedPoints, 18);
const manualDq = setScoringAttemptDq(manual, { reason: "DQ de prueba" });
assert.equal(manualDq.scoring.individualBadPoints, 3);
assert.equal(manualDq.scoring.teamBadPoints, 4);
assert.equal(manualDq.scoring.netAttemptPoints, -3);
assert.equal(manualDq.scoring.teamAdjustedPoints, -7);

const zero = adaptLegacyAttemptToV2(legacyAttempt({
  base: 0,
  adic: 0,
  infr: 0,
  applied: [],
  attempted: true,
  notAchieved: true,
  note: "No logrado"
}), legacyContext());
assert.equal(zero.sportState.status, "NOT_ACHIEVED");
assert.equal(zero.dq.active, false);
assert.equal(zero.note, "No logrado");
const explicitZero = normalizeScoringAttemptV2({
  ...zero,
  sportState: { ...zero.sportState, status: "ZERO" }
});
assert.equal(explicitZero.sportState.status, "ZERO");
assert.equal(explicitZero.dq.active, false);

const contextualInfraction = normalizeScoringAttemptV2({
  ...simple,
  infractions: [{
    id: "infr_context",
    label: "Infraccion contextual",
    pts: 1,
    timestamp: publishedAt,
    context: { suerteId: "cala", count: 0 }
  }]
});
assert.equal(contextualInfraction.infractions[0].timestamp, publishedAt);
assert.equal(contextualInfraction.infractions[0].context.suerteId, "cala");
assert.equal(contextualInfraction.infractions[0].context.count, 0);

for (const fixture of [
  ["Cala", legacyAttempt()],
  ["Piales", legacyAttempt({ puntaPts: 0, puntaMetros: 0 })],
  ["Coleadero", legacyAttempt({ base: 12, adic: 0, infr: 0, applied: [] })],
  ["Infracciones", legacyAttempt({ infr: 4 })],
  ["DQ", legacyAttempt({ desc: "Descalificado" })],
  ["Nota", legacyAttempt({ note: "Con nota" })],
  ["Evidencia", legacyAttempt({ timeEvidence: [{ id: "time_legacy", timeMs: 0, timeText: "" }] })]
]) {
  const [label, legacy] = fixture;
  const before = structuredClone(legacy);
  const adapted = adaptLegacyAttemptToV2(legacy, legacyContext({ suerteId: label.toLowerCase() }));
  assert.equal(isScoringAttemptV2(legacy), false, `${label} remains legacy`);
  assert.equal(isScoringAttemptV2(adapted), true, `${label} is readable through the adapter`);
  assert.deepEqual(legacy, before, `${label} is not mutated`);
}

const individual = adaptLegacyAttemptToV2(legacyAttempt(), legacyContext({
  competitionId: "charro_completo",
  competitionScope: "individual",
  participantId: "participant_1",
  participantName: "Participante Uno",
  teamId: null,
  teamName: null,
  horseName: "Caballo Uno"
}));
assert.equal(individual.identity.participantId, "participant_1");
assert.equal(individual.identity.teamId, null);
assert.equal(validateScoringAttemptV2(individual).valid, true);
const invalidIndividual = normalizeScoringAttemptV2({
  ...individual,
  identity: { ...individual.identity, participantId: null },
  context: { ...individual.context, competitionScope: "individual" }
});
assert.ok(validateScoringAttemptV2(invalidIndividual).errors.includes("attempt-participant-required"));

const domainRich = normalizeScoringAttemptV2({
  ...individual,
  sportState: {
    ...individual.sportState,
    opportunity: {
      number: 3,
      status: "ATTEMPTED",
      type: "HEAD",
      sharedOpportunityId: "terna_shared_1",
      sharedSequenceNumber: 5
    },
    remate: {
      remateId: "remate_1",
      remateLabel: "Mascota",
      remateMetadata: { source: "fixture" }
    }
  },
  scoring: {
    ...individual.scoring,
    calculationDetail: {
      type: "compact_calculator",
      value: 4,
      selections: [{ id: "floreo_1", label: "Floreo", pts: 4 }],
      details: { movements: 2 }
    }
  },
  timing: {
    timerId: "timer_1",
    sharedTimerId: "shared_timer_1",
    elapsedMs: 0,
    remainingMs: 420000,
    status: "RUNNING",
    adjustments: [{ valueMs: 0, reason: "" }]
  }
});
assert.equal(domainRich.sportState.opportunity.sharedOpportunityId, "terna_shared_1");
assert.equal(domainRich.sportState.opportunity.sharedSequenceNumber, 5);
assert.equal(domainRich.sportState.remate.remateId, "remate_1");
assert.equal(domainRich.scoring.calculationDetail.type, "compact_calculator");
assert.equal(domainRich.timing.sharedTimerId, "shared_timer_1");
assert.equal(domainRich.timing.elapsedMs, 0);
assert.equal(domainRich.timing.adjustments[0].valueMs, 0);
assert.equal(domainRich.timing.adjustments[0].reason, "");

const serializable = serializeScoringAttemptV2({
  ...domainRich,
  note: "",
  auditMetadata: { ...domainRich.auditMetadata, device: { count: 0, enabled: false, label: "", optional: null } }
});
assert.equal(serializable.valid, true);
assert.equal(serializable.value.auditMetadata.device.count, 0);
assert.equal(serializable.value.auditMetadata.device.enabled, false);
assert.equal(serializable.value.auditMetadata.device.label, "");
assert.equal(serializable.value.auditMetadata.device.optional, null);
assert.doesNotThrow(() => JSON.stringify(serializable.value));
assert.equal(JSON.stringify(serializable.value).includes("undefined"), false);

for (const [label, unsafeValue] of [
  ["function", () => true],
  ["symbol", Symbol("unsafe")],
  ["bigint", 1n],
  ["date", new Date(publishedAt)],
  ["map", new Map([["a", 1]])],
  ["set", new Set([1])],
  ["undefined", undefined]
]) {
  const unsafe = { ...domainRich, auditMetadata: { ...domainRich.auditMetadata, device: { unsafeValue } } };
  assert.equal(serializeScoringAttemptV2(unsafe).valid, false, `${label} is rejected`);
  assert.throws(() => buildOfficialScoringAttemptSnapshot(unsafe, { publishedAt, actor }), /scoring-attempt-v2-unsafe/);
}
const cyclic = { ...domainRich, auditMetadata: { ...domainRich.auditMetadata, device: {} } };
cyclic.auditMetadata.device.cycle = cyclic;
assert.equal(serializeScoringAttemptV2(cyclic).valid, false);
const polluted = { ...domainRich, auditMetadata: { ...domainRich.auditMetadata, device: { safe: true } } };
Object.defineProperty(polluted.auditMetadata.device, "__proto__", { value: { polluted: true }, enumerable: true });
assert.equal(serializeScoringAttemptV2(polluted).valid, false);
const accessor = { ...domainRich, auditMetadata: { ...domainRich.auditMetadata, device: {} } };
Object.defineProperty(accessor.auditMetadata.device, "secret", { get: () => "unsafe", enumerable: true });
assert.equal(serializeScoringAttemptV2(accessor).valid, false);
const oversizedArray = { ...domainRich, auditMetadata: { ...domainRich.auditMetadata, device: { items: Array(401).fill(0) } } };
assert.equal(serializeScoringAttemptV2(oversizedArray).valid, false);
let deepValue = { terminal: true };
for (let index = 0; index < 16; index += 1) deepValue = { child: deepValue };
const excessiveDepth = { ...domainRich, auditMetadata: { ...domainRich.auditMetadata, device: deepValue } };
assert.equal(serializeScoringAttemptV2(excessiveDepth).valid, false);

const profileFixture = { profileId: "profile_X", profileVersion: "1.0.0" };
const profileAttempt = adaptLegacyAttemptToV2(source, legacyContext({
  ruleResolution: { profile: profileFixture }
}), { pointSummary: calculateAttemptPointSummary(source) });
const official = buildOfficialScoringAttemptSnapshot(profileAttempt, {
  publishedAt,
  officialRevision: 7,
  actor,
  source: "official-score-publication"
});
profileFixture.profileVersion = "2.0.0";
assert.equal(official.context.ruleProfileVersion, "1.0.0");
assert.equal(official.publication.state, "OFFICIAL");
assert.equal(official.publication.frozen, true);
assert.equal(official.publication.officialRevision, 7);
assert.equal(Object.isFrozen(official), true);
assert.equal(Object.isFrozen(official.scoring.additionalSelections), true);
assert.throws(() => { official.scoring.netAttemptPoints = 999; }, TypeError);

const fingerprintA = buildEffectiveRulesFingerprint({
  catalog: legacyContext().catalog,
  ruleResolution: legacyContext().ruleResolution
});
const fingerprintB = buildEffectiveRulesFingerprint({
  catalog: legacyContext().catalog,
  ruleResolution: legacyContext().ruleResolution
});
assert.equal(fingerprintA, fingerprintB);
assert.deepEqual(calculateScoringAttemptV2Points(simple), {
  goodPoints: 23,
  individualBadPoints: 2,
  teamBadPoints: 0,
  netAttemptPoints: 21,
  teamAdjustedPoints: 21
});
assert.equal(calculateAttemptTotal(source), 21, "legacy calculator remains authoritative and unchanged");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const firebaseSyncSource = readFileSync(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const officialConcurrencySource = readFileSync(new URL("../functions/officialScoreConcurrency.js", import.meta.url), "utf8");
const applyDqBody = appSource.match(/function applyDescReason\([\s\S]*?\n\}/)?.[0] || "";
assert.match(appSource, /buildOfficialScoringAttemptSnapshot/);
assert.match(appSource, /attemptV2,/);
assert.doesNotMatch(applyDqBody, /\.base\s*=|\.adic\s*=|\.infr\s*=|\.applied\s*=|\.timeEvidence\s*=|\.note\s*=/);
assert.match(firebaseSyncSource, /attemptV2:\s*breakdown\.attemptV2 \|\| null/);
assert.match(officialConcurrencySource, /breakdown:\s*published\.breakdown \|\| null/);
assert.doesNotMatch(officialConcurrencySource, /attemptV2[^\n]*calculate|calculate[^\n]*attemptV2/);

console.log("Scoring Attempt V2: identity, legacy, DQ, dynamic values, official freeze and safety passed.");
