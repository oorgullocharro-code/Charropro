import { normalizeScoringAttemptV2 } from "./scoringAttempt.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";

export const SCORER_COMPONENT_SYSTEM_VERSION = "1.0.0";

export const SCORER_RESPONSIVE_BREAKPOINTS = Object.freeze({
  compact: 640,
  tablet: 980,
  wide: 1220
});

const STATUS_PRESENTATION = Object.freeze({
  NOT_STARTED: Object.freeze({ label: "No iniciado", tone: "neutral" }),
  IN_PROGRESS: Object.freeze({ label: "En captura", tone: "progress" }),
  ATTEMPTED: Object.freeze({ label: "Calificado", tone: "success" }),
  VALID: Object.freeze({ label: "Calificado", tone: "success" }),
  ZERO: Object.freeze({ label: "Cero", tone: "zero" }),
  NOT_ACHIEVED: Object.freeze({ label: "Cero no logrado", tone: "zero" }),
  LOST_OPPORTUNITY: Object.freeze({ label: "Oportunidad no lograda", tone: "zero" }),
  REPLACEMENT: Object.freeze({ label: "Reemplazo", tone: "progress" }),
  REPOSITION: Object.freeze({ label: "Reposicion", tone: "progress" }),
  PENDING: Object.freeze({ label: "Pendiente", tone: "progress" }),
  DQ: Object.freeze({ label: "Descalificacion", tone: "danger" })
});

export function buildScorerAttemptViewModel(attemptInput = {}, options = {}) {
  const attempt = normalizeScoringAttemptV2(attemptInput);
  const scoring = attempt.scoring;
  const status = buildAttemptStatus(attempt);
  const basePoints = finiteNumber(scoring.baseSelection?.total);
  const calculatorPoints = finiteNumber(scoring.calculationDetail?.value);
  const additionalRulePoints = sumSelectionTotals(scoring.additionalSelections);
  const individualBadPoints = finiteNumber(scoring.individualBadPoints);
  const teamBadPoints = finiteNumber(scoring.teamBadPoints);
  const opportunity = attempt.sportState.opportunity || {};

  return {
    version: SCORER_COMPONENT_SYSTEM_VERSION,
    attemptId: attempt.identity.attemptId,
    summary: {
      basePoints,
      additionalPoints: additionalRulePoints + calculatorPoints,
      calculatorPoints,
      individualBadPoints,
      teamBadPoints,
      goodPoints: finiteNumber(scoring.goodPoints),
      badPoints: individualBadPoints + teamBadPoints,
      totalPoints: finiteNumber(scoring.netAttemptPoints),
      teamAdjustedPoints: finiteNumber(scoring.teamAdjustedPoints)
    },
    status,
    classification: {
      id: attempt.sportState.classification?.classificationId || null,
      label: attempt.sportState.classification?.classificationLabel || null,
      value: attempt.sportState.classification?.classificationValue ?? null
    },
    opportunity: {
      number: positiveInteger(opportunity.number, 1),
      total: positiveInteger(options.opportunityTotal, positiveInteger(opportunity.number, 1)),
      status: opportunity.status || status.id,
      type: opportunity.type || null,
      sharedOpportunityId: opportunity.sharedOpportunityId || null,
      sharedSequenceNumber: opportunity.sharedSequenceNumber || null
    },
    timers: buildScorerTimerGroup(options.timers || timingAsTimer(attempt.timing)),
    sharedTimer: buildSharedTimerReference(options.sharedTimer || sharedTimingReference(attempt.timing)),
    remateHistory: buildScorerRemateHistory(
      options.remateHistory || attempt.sportState.remate?.remateMetadata?.history || []
    ),
    specializedCalculator: normalizeSpecializedCalculator(options.specializedCalculator),
    note: attempt.note,
    evidenceCount: attempt.evidence.length,
    publicationState: attempt.publication.state
  };
}

export function buildScorerRuleButtonModel(rule = {}, options = {}) {
  const label = cleanText(rule.label, 500);
  const category = cleanText(options.category || rule.category, 80) || "rule";
  const resolvedValue = finiteNumber(
    options.resolvedValue ?? rule.resolvedValue ?? rule.value ?? rule.pts
  );
  const disabled = options.disabled === true || rule.disabled === true;
  return {
    id: cleanId(rule.ruleId || rule.id),
    label,
    points: resolvedValue,
    valueLabel: `${category === "infr" || category === "team_infr" ? "-" : category === "base" ? "" : "+"}${resolvedValue}`,
    selected: options.selected === true,
    disabled,
    disabledReason: disabled ? cleanText(options.disabledReason || rule.disabledReason, 500) : "",
    source: cleanText(rule.source || options.source, 120) || "PRODUCT_BASE",
    category,
    dynamic: Boolean(rule.valueByClassification || options.dynamic),
    classificationId: cleanId(options.classificationId),
    pressed: options.selected === true
  };
}

export function buildScorerClassificationModel(options = [], selectedId = null) {
  const normalized = (Array.isArray(options) ? options : []).slice(0, 20).map((option) => ({
    id: cleanId(option?.id || option?.classificationId),
    label: cleanText(option?.label || option?.classificationLabel, 240),
    value: option?.value === null || option?.value === undefined ? null : finiteNumber(option.value),
    selected: cleanId(option?.id || option?.classificationId) === cleanId(selectedId)
  })).filter((option) => option.id && option.label);
  return {
    selectedId: normalized.find((option) => option.selected)?.id || null,
    options: normalized
  };
}

export function buildScorerTimerGroup(timers = []) {
  return (Array.isArray(timers) ? timers : []).slice(0, 4).map((timer, index) => ({
    timerId: cleanId(timer?.timerId || timer?.id) || `timer_${index + 1}`,
    label: cleanText(timer?.label, 160) || `Cronometro ${index + 1}`,
    display: cleanText(timer?.display || timer?.formatted || timer?.legacyText, 120) || "00:00.0",
    status: cleanText(timer?.status, 80) || "idle",
    warning: cleanText(timer?.warning, 500),
    primary: index === 0 || timer?.primary === true
  }));
}

export function buildSharedTimerReference(timer = null) {
  if (!timer || typeof timer !== "object") return null;
  const timerId = cleanId(timer.sharedTimerId || timer.timerId || timer.id);
  if (!timerId) return null;
  return {
    timerId,
    label: cleanText(timer.label, 160) || "Cronometro compartido",
    display: cleanText(timer.display || timer.formatted || timer.legacyText, 120) || "00:00.0",
    status: cleanText(timer.status, 80) || "reference"
  };
}

export function buildScorerRemateHistory(items = []) {
  return (Array.isArray(items) ? items : []).slice(0, 12).map((item, index) => ({
    id: cleanId(item?.id || item?.remateId) || `remate_${index + 1}`,
    label: cleanText(item?.label || item?.remateLabel, 240) || `Remate ${index + 1}`,
    value: item?.value === null || item?.value === undefined ? null : finiteNumber(item.value),
    status: cleanText(item?.status, 80) || null
  }));
}

function buildAttemptStatus(attempt) {
  const requested = attempt.dq?.active ? "DQ" : attempt.sportState?.status || "NOT_STARTED";
  const presentation = STATUS_PRESENTATION[requested] || STATUS_PRESENTATION.NOT_STARTED;
  return {
    id: requested,
    label: presentation.label,
    tone: presentation.tone,
    reason: attempt.dq?.active ? attempt.dq.reason || "Descalificacion" : null,
    isDq: requested === "DQ",
    isZero: ["ZERO", "NOT_ACHIEVED", "LOST_OPPORTUNITY"].includes(requested),
    isStarted: requested !== "NOT_STARTED"
  };
}

function timingAsTimer(timing = {}) {
  const hasTiming = timing.timerId || timing.elapsedMs !== null || timing.remainingMs !== null || timing.legacyText;
  if (!hasTiming) return [];
  return [{
    timerId: timing.timerId,
    label: "Cronometro",
    display: timing.legacyText,
    status: timing.status
  }];
}

function sharedTimingReference(timing = {}) {
  return timing.sharedTimerId ? {
    sharedTimerId: timing.sharedTimerId,
    label: "Cronometro compartido",
    display: timing.legacyText,
    status: timing.status
  } : null;
}

function normalizeSpecializedCalculator(value) {
  if (!value || typeof value !== "object") return null;
  const id = cleanId(value.id || value.calculatorId);
  if (!id) return null;
  return {
    id,
    label: cleanText(value.label, 240) || "Calculador especializado",
    active: value.active !== false
  };
}

function sumSelectionTotals(items) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + finiteNumber(item?.total), 0);
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function cleanText(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanId(value) {
  const clean = cleanText(value, 240);
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(clean) ? clean : "";
}
