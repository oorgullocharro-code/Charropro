import {
  FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT,
  applyFmch2026ManganaTiming,
  isFmch2026ManganaSuerte,
  reconcileFmch2026ManganaAttempt,
  resolveFmch2026ManganaTiming
} from "../data/fmch2026ManganasPasoRules.js?v=20260920-coleadero-explicit-official-result-zero-fix-001-v1";

export const FMCH_2026_MANGANA_REMATE_SCHEMA_VERSION = "1.0.0";
export const FMCH_2026_MANGANA_TIME_SETTLEMENT_VERSION = "1.0.0";
export const FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION = "2.0.0";
export const FMCH_2026_MANGANA_TIME_OWNER_OPPORTUNITY = FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT;

const TIME_RULE_BY_SUERTE = Object.freeze({
  manganas_pie: "manganas_pie_adic_tiempo_no_usado",
  manganas_caballo: "manganas_caballo_adic_tiempo_no_usado"
});
const ORIENTATIONS = new Set(["MASK", "COUNTER_MASK", "CATALOG_DEFINED"]);
const TURN_DIRECTIONS = new Set(["SAME", "OPPOSITE", "CATALOG_DEFINED"]);

export function buildFmch2026ManganaFaenaKey(identity = {}) {
  const parts = [
    identity.tournamentId,
    identity.competitionId,
    identity.charreadaId,
    identity.teamId || identity.participantId,
    identity.suerteId,
    identity.timerId
  ].map(normalizeIdentityPart);
  if (parts.some((part) => !part)) return "";
  return `mangana_faena:${parts.map((part) => `${part.length}:${part}`).join("|")}`;
}

export function applyFmch2026ManganaTechnicalRemate(attempt = {}, suerte = {}, input = {}) {
  if (!isFmch2026ManganaSuerte(suerte?.id)) return cloneAttempt(attempt);
  const remate = buildFmch2026ManganaRemateIdentity(input, suerte);
  if (!remate) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  next.manganaScoringContractVersion = FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION;
  next.manganaRemate = remate;
  next.remateId = remate.shortcutId || `technical_${remate.signature}`;
  next.remateLabel = remate.name;
  next.remateMetadata = {
    source: remate.source,
    schemaVersion: remate.schemaVersion,
    signature: remate.signature,
    technicalIdentity: {
      effectFinal: remate.effectFinal,
      orientation: remate.orientation,
      turnDirection: remate.turnDirection,
      bodyFinish: remate.bodyFinish
    }
  };
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function setFmch2026ManganaManualAdditionalTotal(attempt = {}, suerte = {}, total = 0) {
  if (!isFmch2026ManganaSuerte(suerte?.id)) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  next.manganaScoringContractVersion = FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION;
  next.manganaManualAdditionalTotal = Math.min(99, nonNegativeInteger(total));
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function buildFmch2026ManganaRemateIdentity(input = {}, suerte = {}) {
  if (!isFmch2026ManganaSuerte(suerte?.id)) return null;
  const shortcutId = normalizeToken(input.shortcutId);
  const shortcut = shortcutId
    ? (suerte.catalog?.base || []).find((item) => normalizeToken(item.id) === shortcutId)
    : null;
  const name = normalizeText(input.name || shortcut?.label, 120);
  const effectFinal = normalizeText(input.effectFinal || shortcut?.metadata?.remateFamily || shortcut?.label, 120);
  const orientation = normalizeEnum(input.orientation || (shortcut ? "CATALOG_DEFINED" : ""), ORIENTATIONS);
  const turnDirection = normalizeEnum(input.turnDirection || (shortcut ? "CATALOG_DEFINED" : ""), TURN_DIRECTIONS);
  const bodyFinish = normalizeText(input.bodyFinish || (shortcut ? "CATALOG_DEFINED" : ""), 120);
  if (!name || !effectFinal || !orientation || !turnDirection) return null;
  const signatureInput = {
    effectFinal: normalizeSignaturePart(effectFinal),
    orientation,
    turnDirection,
    bodyFinish: normalizeSignaturePart(bodyFinish)
  };
  const signature = `mrem_${stableHash(JSON.stringify(signatureInput))}`;
  return {
    schemaVersion: FMCH_2026_MANGANA_REMATE_SCHEMA_VERSION,
    remateId: shortcut?.id || `technical_${signature}`,
    remateName: name,
    remateSignature: signature,
    name,
    shortcutId: shortcut?.id || null,
    scoringRuleId: shortcut?.id || null,
    effectFinal,
    orientation,
    turnDirection,
    bodyFinish: bodyFinish || null,
    signature,
    source: shortcut ? "FMCH_2026_RULE_PROFILE" : "JUDGE_TECHNICAL_CAPTURE"
  };
}

export function normalizeFmch2026ManganaRemateIdentity(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = {
    schemaVersion: normalizeText(source.schemaVersion, 40),
    remateId: normalizeToken(source.remateId || source.shortcutId) || null,
    remateName: normalizeText(source.remateName || source.name, 120),
    remateSignature: normalizeToken(source.remateSignature || source.signature),
    name: normalizeText(source.name || source.remateName || source.remateLabel, 120),
    shortcutId: normalizeToken(source.shortcutId) || null,
    scoringRuleId: normalizeToken(source.scoringRuleId) || null,
    effectFinal: normalizeText(source.effectFinal, 120),
    orientation: normalizeEnum(source.orientation, ORIENTATIONS),
    turnDirection: normalizeEnum(source.turnDirection, TURN_DIRECTIONS),
    bodyFinish: normalizeText(source.bodyFinish, 120) || null,
    signature: normalizeToken(source.signature),
    source: normalizeText(source.source, 80) || "JUDGE_TECHNICAL_CAPTURE"
  };
  if (!validateFmch2026ManganaRemateIdentity(normalized).valid) return null;
  normalized.remateId = normalized.shortcutId || normalized.remateId || `technical_${normalized.signature}`;
  normalized.remateName = normalized.name;
  normalized.remateSignature = normalized.signature;
  return normalized;
}

export function validateFmch2026ManganaRemateIdentity(value = {}) {
  const errors = [];
  if (value?.schemaVersion !== FMCH_2026_MANGANA_REMATE_SCHEMA_VERSION) errors.push("manganas-remate-schema-invalid");
  if (!normalizeText(value?.name, 120)) errors.push("manganas-remate-name-required");
  if (!normalizeText(value?.effectFinal, 120)) errors.push("manganas-remate-effect-required");
  if (!ORIENTATIONS.has(value?.orientation)) errors.push("manganas-remate-orientation-invalid");
  if (!TURN_DIRECTIONS.has(value?.turnDirection)) errors.push("manganas-remate-turn-direction-invalid");
  const expectedSignature = value?.effectFinal && value?.orientation && value?.turnDirection
    ? `mrem_${stableHash(JSON.stringify({
        effectFinal: normalizeSignaturePart(value.effectFinal),
        orientation: value.orientation,
        turnDirection: value.turnDirection,
        bodyFinish: normalizeSignaturePart(value.bodyFinish)
      }))}`
    : "";
  if (!normalizeToken(value?.signature) || value.signature !== expectedSignature) errors.push("manganas-remate-signature-invalid");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateFmch2026ManganaRemateUniqueness(attempts = []) {
  const signatures = [];
  const errors = [];
  for (const attempt of normalizeAttempts(attempts)) {
    const remate = normalizeFmch2026ManganaRemateIdentity(attempt.manganaRemate);
    if (!remate) continue;
    if (signatures.includes(remate.signature)) errors.push("manganas-remate-signature-repeated");
    signatures.push(remate.signature);
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], signatures };
}

export function settleFmch2026ManganaFaenaTime(attempts = [], suerte = {}, timingInput = {}) {
  const normalizedAttempts = normalizeAttempts(attempts);
  if (!isFmch2026ManganaSuerte(suerte?.id)) return { attempts: normalizedAttempts, settlement: null };
  const timeRuleId = TIME_RULE_BY_SUERTE[suerte.id];
  const ownerIndex = FMCH_2026_MANGANA_TIME_OWNER_OPPORTUNITY - 1;
  const hasConsumed = normalizedAttempts.some((attempt) => attempt.manganaResult === "ACHIEVED");
  const timing = resolveFmch2026ManganaTiming(timingInput.officialElapsedMs, {
    hasConsumed,
    sequenceComplete: true,
    placedInMinuteSeven: timingInput.placedInMinuteSeven === true
  });
  const faenaKey = buildFmch2026ManganaFaenaKey({ ...timingInput, suerteId: suerte.id });
  const settlement = {
    schemaVersion: FMCH_2026_MANGANA_TIME_SETTLEMENT_VERSION,
    scoringContractVersion: FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION,
    faenaKey,
    suerteId: suerte.id,
    timerId: normalizeIdentityPart(timingInput.timerId),
    ownerOpportunityNumber: FMCH_2026_MANGANA_TIME_OWNER_OPPORTUNITY,
    officialElapsedMs: timing.officialElapsedMs,
    completeUnusedMinutes: timing.completeUnusedMinutes,
    points: timing.completeUnusedMinutes,
    eligible: hasConsumed,
    source: "OFFICIAL_TIMER_FAENA_SETTLEMENT"
  };

  const nextAttempts = normalizedAttempts.map((attempt, index) => {
    let next = removeTimeSettlement(attempt, suerte, timeRuleId);
    if (index === ownerIndex) {
      next = applyFmch2026ManganaAttemptTiming(next, suerte, {
        ...timingInput,
        hasConsumed,
        sequenceComplete: true
      });
      next.manganaScoringContractVersion = FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION;
      next.manganaFaenaTimeSettlement = settlement;
    }
    return reconcileFmch2026ManganaAttempt(next, suerte);
  });
  return { attempts: nextAttempts, settlement };
}

export function applyFmch2026ManganaAttemptTiming(attempt = {}, suerte = {}, timingInput = {}) {
  let next = applyFmch2026ManganaTiming(attempt, suerte, timingInput);
  const placedAt = normalizeFmch2026ManganaEventEvidence(next.manganaPlacedAt);
  const downAt = normalizeFmch2026ManganaEventEvidence(next.manganaDownAt);
  const placedInMinuteSeven = placedAt
    && placedAt.timerId === normalizeIdentityPart(timingInput.timerId)
    && placedAt.officialElapsedMs >= 6 * 60 * 1000
    && placedAt.officialElapsedMs <= 7 * 60 * 1000;
  const downMatchesPlacement = downAt
    && downAt.timerId === placedAt?.timerId
    && downAt.officialElapsedMs >= placedAt.officialElapsedMs;
  if (placedInMinuteSeven && downMatchesPlacement && next.manganaResult === "ACHIEVED") {
    const timeDqRuleId = `${suerte.id}_desc_tiempo_agotado`;
    if (next.autoDescRuleId === timeDqRuleId || next.descRuleId === timeDqRuleId) {
      next.desc = null;
      next.descRuleId = null;
      next.autoDescRuleId = null;
    }
    next.applied = Array.isArray(next.applied) ? next.applied : [];
    next.ruleQuantities = { ...(next.ruleQuantities || {}) };
    const minuteSevenRuleId = `${suerte.id}_infr_minuto_7`;
    if (!next.applied.includes(minuteSevenRuleId)) next.applied.push(minuteSevenRuleId);
    delete next.ruleQuantities[minuteSevenRuleId];
    next.timing.adjustments = (next.timing.adjustments || [])
      .filter((item) => item.selectedRuleId !== timeDqRuleId && item.selectedRuleId !== minuteSevenRuleId);
    next.timing.adjustments.push({ selectedRuleId: minuteSevenRuleId, resolvedValue: 3, quantity: 1 });
    next = reconcileFmch2026ManganaAttempt(next, suerte);
  }
  return next;
}

export function recordFmch2026ManganaEventEvidence(attempt = {}, eventType = "PLACED", timingInput = {}) {
  const next = cloneAttempt(attempt);
  const key = eventType === "DOWN" ? "manganaDownAt" : "manganaPlacedAt";
  next.manganaScoringContractVersion = FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION;
  next[key] = {
    eventType: eventType === "DOWN" ? "DOWN" : "PLACED",
    timerId: normalizeIdentityPart(timingInput.timerId),
    officialElapsedMs: nonNegativeNumber(timingInput.officialElapsedMs),
    source: "OFFICIAL_TIMER_EVENT_EVIDENCE"
  };
  return next;
}

export function normalizeFmch2026ManganaEventEvidence(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const eventType = source.eventType === "DOWN" ? "DOWN" : source.eventType === "PLACED" ? "PLACED" : "";
  const timerId = normalizeIdentityPart(source.timerId);
  if (!eventType || !timerId || !Number.isFinite(Number(source.officialElapsedMs))) return null;
  return {
    eventType,
    timerId,
    officialElapsedMs: nonNegativeNumber(source.officialElapsedMs),
    source: normalizeText(source.source, 120) || "OFFICIAL_TIMER_EVENT_EVIDENCE"
  };
}

export function getFmch2026ManganaFaenaTimeSettlement(attempts = []) {
  const values = normalizeAttempts(attempts)
    .map((attempt) => normalizeFmch2026ManganaFaenaTimeSettlement(attempt.manganaFaenaTimeSettlement))
    .filter(Boolean);
  if (!values.length) return null;
  return values.find((item) => item.ownerOpportunityNumber === FMCH_2026_MANGANA_TIME_OWNER_OPPORTUNITY) || values[0];
}

export function normalizeFmch2026ManganaFaenaTimeSettlement(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = {
    schemaVersion: normalizeText(source.schemaVersion, 40),
    scoringContractVersion: normalizeText(source.scoringContractVersion, 40),
    faenaKey: normalizeText(source.faenaKey, 600),
    suerteId: normalizeToken(source.suerteId),
    timerId: normalizeText(source.timerId, 240),
    ownerOpportunityNumber: nonNegativeInteger(source.ownerOpportunityNumber),
    officialElapsedMs: nonNegativeNumber(source.officialElapsedMs),
    completeUnusedMinutes: nonNegativeInteger(source.completeUnusedMinutes),
    points: nonNegativeInteger(source.points),
    eligible: source.eligible === true,
    source: normalizeText(source.source, 120)
  };
  return validateFmch2026ManganaFaenaTimeSettlement(normalized).valid ? normalized : null;
}

export function validateFmch2026ManganaFaenaTimeSettlement(value = {}) {
  const errors = [];
  if (value?.schemaVersion !== FMCH_2026_MANGANA_TIME_SETTLEMENT_VERSION) errors.push("manganas-faena-time-schema-invalid");
  if (value?.scoringContractVersion !== FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION) errors.push("manganas-scoring-contract-invalid");
  if (!normalizeText(value?.faenaKey, 600)) errors.push("manganas-faena-key-required");
  if (!TIME_RULE_BY_SUERTE[value?.suerteId]) errors.push("manganas-faena-suerte-invalid");
  if (!normalizeText(value?.timerId, 240)) errors.push("manganas-faena-timer-required");
  if (value?.ownerOpportunityNumber !== FMCH_2026_MANGANA_TIME_OWNER_OPPORTUNITY) errors.push("manganas-faena-time-owner-invalid");
  for (const field of ["officialElapsedMs", "completeUnusedMinutes", "points"]) {
    if (!Number.isFinite(value?.[field]) || value[field] < 0) errors.push(`manganas-faena-${field}-invalid`);
  }
  if (value?.points !== value?.completeUnusedMinutes) errors.push("manganas-faena-time-points-mismatch");
  if (!value?.eligible && value?.points !== 0) errors.push("manganas-faena-time-ineligible-points");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateFmch2026ManganaOfficialCollection(attempts = [], suerte = {}, identity = {}) {
  const timeRuleId = TIME_RULE_BY_SUERTE[suerte?.id];
  if (!timeRuleId) return { valid: true, errors: [] };
  const errors = [];
  let settlementCount = 0;
  let timeRuleCount = 0;
  normalizeAttempts(attempts).forEach((attempt, index) => {
    const rawSettlement = attempt.manganaFaenaTimeSettlement;
    const settlement = normalizeFmch2026ManganaFaenaTimeSettlement(attempt.manganaFaenaTimeSettlement);
    const quantity = getRuleQuantity(attempt, timeRuleId);
    if (settlement) {
      settlementCount += 1;
      if (index + 1 !== settlement.ownerOpportunityNumber) errors.push("manganas-faena-time-owner-mismatch");
      const expectedKey = buildFmch2026ManganaFaenaKey({ ...identity, suerteId: suerte.id, timerId: settlement.timerId });
      if (expectedKey && settlement.faenaKey !== expectedKey) errors.push("manganas-faena-time-key-mismatch");
      if (quantity !== settlement.points) errors.push("manganas-faena-time-selection-mismatch");
    }
    if (rawSettlement && !settlement) errors.push("manganas-faena-time-settlement-invalid");
    if (quantity > 0) {
      timeRuleCount += 1;
      if (!settlement && attempt.manganaScoringContractVersion === FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION) {
        errors.push("manganas-faena-time-settlement-required");
      }
    }
  });
  if (settlementCount > 1 || timeRuleCount > 1) errors.push("manganas-faena-time-settlement-duplicate");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateFmch2026ManganaAttemptForOfficial(attemptV2 = {}) {
  const suerteId = normalizeToken(attemptV2?.identity?.suerteId);
  if (!TIME_RULE_BY_SUERTE[suerteId]) return { valid: true, errors: [] };
  const errors = [];
  const result = attemptV2?.sportState?.result;
  const remate = attemptV2?.sportState?.remate;
  const settlement = attemptV2?.sportState?.manganaFaenaTimeSettlement;
  const timeSelections = (attemptV2?.scoring?.additionalSelections || []).filter((item) => (
    normalizeToken(item.selectedRuleId || item.ruleId || item.id) === TIME_RULE_BY_SUERTE[suerteId]
  ));
  const newContract = attemptV2?.sportState?.manganaScoringContractVersion === FMCH_2026_MANGANA_SCORING_CONTRACT_VERSION;
  if (!newContract) return { valid: true, errors: [], legacy: true };
  if (result === "ACHIEVED") {
    const validation = validateFmch2026ManganaRemateIdentity(remate);
    if (!validation.valid) errors.push("manganas-official-remate-required", ...validation.errors);
  }
  if (timeSelections.length > 1) errors.push("manganas-official-time-selection-duplicate");
  if (timeSelections.length) {
    const validation = validateFmch2026ManganaFaenaTimeSettlement(settlement);
    if (!validation.valid) errors.push("manganas-official-time-settlement-required", ...validation.errors);
    const quantity = timeSelections.reduce((sum, item) => sum + nonNegativeNumber(item.total ?? item.resolvedValue), 0);
    if (settlement && quantity !== settlement.points) errors.push("manganas-official-time-settlement-mismatch");
    if (attemptV2.identity?.opportunityNumber !== FMCH_2026_MANGANA_TIME_OWNER_OPPORTUNITY) {
      errors.push("manganas-official-time-owner-invalid");
    }
  } else if (settlement?.points > 0) {
    errors.push("manganas-official-time-selection-required");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], legacy: false };
}

function removeTimeSettlement(attempt, suerte, timeRuleId) {
  const next = cloneAttempt(attempt);
  next.applied = Array.isArray(next.applied)
    ? next.applied.filter((ruleId) => ruleId !== timeRuleId)
    : [];
  next.ruleQuantities = { ...(next.ruleQuantities || {}) };
  delete next.ruleQuantities[timeRuleId];
  delete next.manganaFaenaTimeSettlement;
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

function getRuleQuantity(attempt = {}, ruleId = "") {
  if (!(attempt.applied || []).includes(ruleId)) return 0;
  return Math.max(1, nonNegativeInteger(attempt.ruleQuantities?.[ruleId] || 1));
}

function normalizeAttempts(attempts) {
  const values = Array.isArray(attempts) ? attempts.slice(0, FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT) : [];
  while (values.length < FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT) values.push({});
  return values.map(cloneAttempt);
}

function cloneAttempt(value = {}) {
  return JSON.parse(JSON.stringify(value && typeof value === "object" ? value : {}));
}

function normalizeIdentityPart(value) {
  return normalizeText(value, 240).replace(/[.#$\[\]/]/g, "_");
}

function normalizeText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeToken(value) {
  return normalizeText(value, 240).replace(/[^A-Za-z0-9:_-]/g, "_");
}

function normalizeSignaturePart(value) {
  return normalizeText(value, 120).toLocaleLowerCase("es-MX").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function normalizeEnum(value, allowed) {
  const normalized = normalizeText(value, 80).toUpperCase();
  return allowed.has(normalized) ? normalized : "";
}

function nonNegativeInteger(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function nonNegativeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
