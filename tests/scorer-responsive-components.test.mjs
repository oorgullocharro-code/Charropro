import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildScorerAttemptViewModel,
  buildScorerClassificationModel,
  buildScorerRuleButtonModel,
  buildScorerTimerGroup,
  buildSharedTimerReference,
  buildScorerRemateHistory,
  SCORER_COMPONENT_SYSTEM_VERSION,
  SCORER_RESPONSIVE_BREAKPOINTS
} from "../js/core/scorerComponents.js";
import {
  normalizeScoringAttemptV2,
  setScoringAttemptDq,
  updateScoringAttemptClassification
} from "../js/core/scoringAttempt.js";

const RELEASE_ID = "20260808-fmch-2026-piales-coleadero-001-v1";

function attemptFixture(overrides = {}) {
  return normalizeScoringAttemptV2({
    attemptSchemaVersion: 2,
    contractVersion: "2.0.0",
    identity: {
      tournamentId: "TEST_TOURNAMENT",
      competitionId: "TEST_COMPETITION",
      charreadaId: "TEST_CHARREADA",
      teamId: "TEST_TEAM",
      participantId: null,
      suerteId: "TEST_SUERTE",
      opportunityNumber: 2,
      participantSlot: 0,
      revision: 0
    },
    context: { competitionScope: "team", teamName: "Equipo de prueba" },
    sportState: {
      status: "ATTEMPTED",
      classification: { classificationId: "EXCELENTE", classificationLabel: "Excelente" },
      opportunity: {
        number: 2,
        status: "ATTEMPTED",
        type: "TEST_DUMMY",
        sharedOpportunityId: "TEST_SHARED_1",
        sharedSequenceNumber: 3
      },
      remate: { remateMetadata: { history: [{ id: "TEST_REMATE_1", label: "Remate de prueba", value: 4 }] } }
    },
    scoring: {
      baseSelection: {
        selectionId: "TEST_BASE",
        selectedRuleId: "TEST_BASE_RULE",
        label: "Base de prueba",
        category: "base",
        value: 20,
        resolvedValue: 20,
        quantity: 1,
        total: 20,
        source: "TEST_DUMMY"
      },
      additionalSelections: [{
        selectionId: "TEST_DYNAMIC",
        selectedRuleId: "TEST_DYNAMIC_RULE",
        label: "Adicional dinamico de prueba",
        category: "additional",
        value: 5,
        resolvedValue: 5,
        quantity: 1,
        total: 5,
        source: "TEST_DUMMY",
        valueByClassification: { EXCELENTE: 5, BUENA: 3, REGULAR: 2, MEDIA_REGULAR: 1, MINIMA: 0 }
      }, {
        selectionId: "TEST_MANUAL_ADD",
        selectedRuleId: "TEST_MANUAL_ADD",
        label: "Adicional manual de prueba",
        category: "additional",
        value: 2,
        resolvedValue: 2,
        quantity: 1,
        total: 2,
        source: "MANUAL",
        manual: true,
        reason: "Motivo de prueba"
      }]
    },
    infractions: [{
      selectionId: "TEST_INFR",
      selectedRuleId: "TEST_INFR_RULE",
      label: "Infraccion individual de prueba",
      category: "infraction",
      value: 3,
      resolvedValue: 3,
      quantity: 1,
      total: 3,
      source: "TEST_DUMMY"
    }, {
      selectionId: "TEST_MANUAL_INFR",
      selectedRuleId: "TEST_MANUAL_INFR",
      label: "Infraccion manual de prueba",
      category: "infraction",
      value: 1,
      resolvedValue: 1,
      quantity: 1,
      total: 1,
      source: "MANUAL",
      manual: true,
      reason: "Motivo de prueba"
    }],
    teamInfractions: [{
      selectionId: "TEST_TEAM_INFR",
      selectedRuleId: "TEST_TEAM_INFR_RULE",
      label: "Infraccion al equipo de prueba",
      category: "team_infraction",
      value: 4,
      resolvedValue: 4,
      quantity: 1,
      total: 4,
      source: "TEST_DUMMY"
    }],
    evidence: [{ id: "TEST_EVIDENCE", label: "Tiempo de prueba", timeMs: 0, timeText: "" }],
    note: "Nota sintetica del juez",
    ...overrides
  });
}

const source = attemptFixture();
const sourceBefore = structuredClone(source);
const view = buildScorerAttemptViewModel(source, {
  opportunityTotal: 5,
  timers: [
    { timerId: "TEST_TIMER_MAIN", label: "Tiempo principal", display: "03:00", primary: true },
    { timerId: "TEST_TIMER_SECONDARY", label: "Tiempo secundario", display: "01:00" }
  ],
  sharedTimer: { sharedTimerId: "TEST_SHARED_TIMER", label: "Tiempo compartido", display: "00:25" },
  specializedCalculator: { id: "TEST_CALA_PUNTA", label: "Calculador de prueba", active: true }
});

assert.deepEqual(source, sourceBefore, "the component layer does not mutate Attempt V2");
assert.equal(SCORER_COMPONENT_SYSTEM_VERSION, "1.0.0");
assert.deepEqual(SCORER_RESPONSIVE_BREAKPOINTS, { compact: 640, tablet: 980, wide: 1220 });
assert.equal(view.summary.basePoints, 20);
assert.equal(view.summary.additionalPoints, 7);
assert.equal(view.summary.individualBadPoints, 4);
assert.equal(view.summary.teamBadPoints, 4);
assert.equal(view.summary.goodPoints, 27);
assert.equal(view.summary.badPoints, 8);
assert.equal(view.summary.totalPoints, 23);
assert.equal(view.summary.teamAdjustedPoints, 19);
assert.equal(view.note, "Nota sintetica del juez");
assert.equal(view.evidenceCount, 1);
assert.equal(view.opportunity.number, 2);
assert.equal(view.opportunity.total, 5);
assert.equal(view.opportunity.sharedOpportunityId, "TEST_SHARED_1");
assert.equal(view.timers.length, 2);
assert.equal(view.sharedTimer.timerId, "TEST_SHARED_TIMER");
assert.equal(view.remateHistory[0].id, "TEST_REMATE_1");
assert.equal(view.specializedCalculator.id, "TEST_CALA_PUNTA");

const longRule = buildScorerRuleButtonModel({
  id: "TEST_LONG_RULE",
  label: "Contracuadrilero izquierdo con descripcion operativa completa",
  source: "PRODUCT_BASE",
  category: "additional",
  valueByClassification: { EXCELENTE: 5 }
}, {
  selected: true,
  disabled: true,
  disabledReason: "Requiere clasificacion de prueba",
  resolvedValue: 5,
  classificationId: "EXCELENTE"
});
assert.equal(longRule.label, "Contracuadrilero izquierdo con descripcion operativa completa");
assert.equal(longRule.selected, true);
assert.equal(longRule.pressed, true);
assert.equal(longRule.disabled, true);
assert.equal(longRule.dynamic, true);
assert.equal(longRule.source, "PRODUCT_BASE");
assert.equal(longRule.disabledReason, "Requiere clasificacion de prueba");

const manyRules = Array.from({ length: 36 }, (_, index) => buildScorerRuleButtonModel({
  id: `TEST_RULE_${index + 1}`,
  label: `Regla sintetica numero ${index + 1}`,
  value: index
}));
assert.equal(manyRules.length, 36, "the common model does not truncate a large effective ruleset");
assert.equal(manyRules.at(-1).label, "Regla sintetica numero 36");

const dqAttempt = setScoringAttemptDq(source, { active: true, reason: "DQ sintetica" });
const dqView = buildScorerAttemptViewModel(dqAttempt);
assert.equal(dqView.status.label, "Descalificacion");
assert.equal(dqView.status.isDq, true);
assert.equal(dqView.status.isZero, false);
assert.equal(dqView.summary.totalPoints, -4);
assert.equal(dqView.summary.goodPoints, 27, "DQ keeps reconstructable good points visible");
assert.equal(dqView.summary.individualBadPoints, 4);
assert.equal(dqView.evidenceCount, 1);
assert.equal(dqView.note, "Nota sintetica del juez");
assert.deepEqual(dqAttempt.scoring.additionalSelections, source.scoring.additionalSelections);

const zeroAttempt = normalizeScoringAttemptV2({
  ...source,
  sportState: { ...source.sportState, status: "ZERO" },
  scoring: { baseSelection: null, additionalSelections: [], calculationDetail: null },
  infractions: [],
  teamInfractions: []
});
const zeroView = buildScorerAttemptViewModel(zeroAttempt);
assert.equal(zeroView.status.isZero, true);
assert.equal(zeroView.status.isDq, false);
assert.equal(zeroView.status.tone, "zero");
assert.equal(zeroView.evidenceCount, 1);
assert.equal(zeroView.note, "Nota sintetica del juez");

const classificationOptions = [
  ["EXCELENTE", "Excelente"],
  ["BUENA", "Buena"],
  ["REGULAR", "Regular"],
  ["MEDIA_REGULAR", "Media Regular"],
  ["MINIMA", "Minima"]
].map(([id, label]) => ({ id, label }));
const classification = buildScorerClassificationModel(classificationOptions, "EXCELENTE");
assert.equal(classification.options.length, 5);
assert.equal(classification.selectedId, "EXCELENTE");
const reclassified = updateScoringAttemptClassification(source, {
  classificationId: "BUENA",
  classificationLabel: "Buena"
});
const dynamicSelection = reclassified.scoring.additionalSelections.find((item) => item.selectionId === "TEST_DYNAMIC");
assert.equal(dynamicSelection.resolvedValue, 3);
assert.equal(dynamicSelection.total, 3);
assert.equal(source.scoring.additionalSelections[0].resolvedValue, 5, "the TEST/DUMMY classification fixture is pure");
const dynamicButton = buildScorerRuleButtonModel(dynamicSelection, {
  category: "additional",
  resolvedValue: dynamicSelection.resolvedValue,
  classificationId: "BUENA"
});
assert.equal(dynamicButton.points, 3);
assert.equal(dynamicButton.dynamic, true);

assert.equal(buildScorerTimerGroup([
  { id: "TEST_3_MIN", display: "03:00" },
  { id: "TEST_1_MIN", display: "01:00" }
]).length, 2);
assert.equal(buildSharedTimerReference({ id: "TEST_TERNA_SHARED", display: "00:45" }).timerId, "TEST_TERNA_SHARED");
assert.equal(buildScorerRemateHistory(Array.from({ length: 20 }, (_, index) => ({ id: `R_${index}`, label: `R ${index}` }))).length, 12);

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(appSource, /data-action="previous-score"[\s\S]{0,220}Deshacer/);
assert.match(appSource, /data-action="toggle-attempt-zero"[\s\S]{0,260}Marcar 0/);
assert.match(appSource, /data-action="next-score"[\s\S]{0,260}Guardar y siguiente/);
assert.match(appSource, /data-action="show-scoring-button-settings"[\s\S]{0,220}Ajustar botonera/);
assert.doesNotMatch(appSource, /Pendiente a revisi[oó]n/i);
assert.match(appSource, /function previousScore\(\)[\s\S]*?stopTimer\(true\)[\s\S]*?previousScoringPointer/);
assert.match(appSource, /async function nextScore\(\)[\s\S]*?publishOfficialScoreForContext\(context\)[\s\S]*?continueOfficialScoreFlowAfterPublish/);
assert.match(cssSource, /--scorer-touch-target:\s*56px/);
assert.match(cssSource, /position:\s*sticky;[\s\S]{0,80}bottom:\s*0/);
assert.match(cssSource, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*var\(--scorer-rule-min\)\),\s*1fr\)\)/);
assert.match(cssSource, /env\(safe-area-inset-bottom\)/);
assert.match(indexSource, new RegExp(RELEASE_ID));

console.log("Scorer responsive component system tests passed.");
