export const SCORING_ATTEMPT_SCHEMA_VERSION = 2;
export const SCORING_ATTEMPT_CONTRACT_VERSION = "2.0.0";
export const SCORING_ATTEMPT_WRITE_MODE = "official_snapshot_only";

export const ATTEMPT_SPORT_STATUSES = Object.freeze([
  "NOT_STARTED",
  "ATTEMPTED",
  "VALID",
  "NOT_ACHIEVED",
  "ZERO",
  "DQ",
  "LOST_OPPORTUNITY",
  "REPLACEMENT",
  "REPOSITION",
  "PENDING"
]);

export const ATTEMPT_PUBLICATION_STATES = Object.freeze([
  "DRAFT",
  "OFFICIAL"
]);

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,239}$/;
const MAX_DEPTH = 14;
const MAX_ARRAY = 400;
const MAX_KEYS = 500;
const MAX_STRING = 4000;

export function isScoringAttemptV2(attempt) {
  return Number(attempt?.attemptSchemaVersion) === SCORING_ATTEMPT_SCHEMA_VERSION;
}

export function buildScoringAttemptIdentity(context = {}) {
  const competitionScope = normalizeScope(context.competitionScope, context.participantId, context.teamId);
  const identity = {
    tournamentId: normalizeId(context.tournamentId),
    competitionId: normalizeId(context.competitionId || "equipos_completo"),
    charreadaId: normalizeId(context.charreadaId),
    participantId: competitionScope === "individual" ? nullableId(context.participantId) : nullableId(context.participantId),
    teamId: competitionScope === "team" ? nullableId(context.teamId) : null,
    suerteId: normalizeId(context.suerteId || context.suerte),
    opportunityNumber: positiveInteger(context.opportunityNumber, 1),
    participantSlot: nonNegativeInteger(context.participantSlot, 0),
    revision: nonNegativeInteger(context.revision, 0),
    attemptId: ""
  };
  identity.attemptId = normalizeId(context.attemptId) || buildStableAttemptId(identity, competitionScope);
  return identity;
}

export function adaptLegacyAttemptToV2(legacyAttempt = {}, context = {}, options = {}) {
  const legacy = cloneFirebaseSafe(legacyAttempt).value || {};
  const catalog = normalizeCatalog(context.catalog || context.suerte?.catalog);
  const identity = buildScoringAttemptIdentity({
    ...context,
    suerteId: context.suerteId || context.suerte?.id,
    revision: context.revision ?? legacy.attemptRevision
  });
  const competitionScope = normalizeScope(context.competitionScope, identity.participantId, identity.teamId);
  const baseSelection = buildLegacyBaseSelection(legacy, catalog.base);
  const additionalSelections = buildLegacySelections(
    legacy,
    catalog.adic,
    legacy.customAdic,
    "additional",
    finiteNumber(legacy.adic, 0),
    { specialSelections: buildLegacySportAdditionalSelections(legacy, identity.suerteId) }
  );
  const infractions = buildLegacySelections(
    legacy,
    catalog.infr,
    legacy.customInfr,
    "infraction",
    finiteNumber(legacy.infr, 0)
  );
  const teamInfractions = normalizeSelections(legacy.teamPenalties, {
    category: "team_infraction",
    source: "LEGACY",
    manualDefault: false
  });
  const dq = buildLegacyDq(legacy, catalog.desc);
  const calculationDetail = buildLegacyCalculationDetail(legacy, context);
  const ruleContext = context.ruleResolution || context.suerte?.ruleResolution || {};
  const profile = ruleContext.profile || {};
  const classification = normalizeClassification(legacy.classification || {
    classificationId: legacy.classificationId,
    classificationLabel: legacy.classificationLabel,
    classificationValue: legacy.classificationValue
  });
  const pointSummary = normalizePointSummary(options.pointSummary) || calculateScoringAttemptV2Points({
    scoring: { baseSelection, additionalSelections, calculationDetail },
    infractions,
    teamInfractions,
    dq
  });
  const sportStatus = resolveLegacySportStatus(legacy, pointSummary, dq);

  return normalizeScoringAttemptV2({
    attemptSchemaVersion: SCORING_ATTEMPT_SCHEMA_VERSION,
    contractVersion: SCORING_ATTEMPT_CONTRACT_VERSION,
    identity,
    context: {
      competitionScope,
      category: normalizeText(context.category, 160),
      phase: normalizeText(context.phase, 160),
      participantName: normalizeText(context.participantName, 240),
      teamName: normalizeText(context.teamName, 240),
      horseName: normalizeText(context.horseName, 240),
      ruleProfileId: nullableId(context.ruleProfileId || profile.profileId),
      ruleProfileVersion: nullableVersion(context.ruleProfileVersion || profile.profileVersion),
      effectiveRulesFingerprint: normalizeText(
        context.effectiveRulesFingerprint || buildEffectiveRulesFingerprint(context.suerte || { catalog }),
        240
      ) || null
    },
    sportState: {
      status: sportStatus,
      legacyStatusMapping: true,
      classification,
      opportunity: {
        number: identity.opportunityNumber,
        status: normalizeOpportunityStatus(legacy.opportunityStatus, sportStatus),
        type: normalizeText(legacy.opportunityType || context.opportunityType, 80) || null,
        sharedOpportunityId: nullableId(legacy.sharedOpportunityId || context.sharedOpportunityId),
        sharedSequenceNumber: nullablePositiveInteger(legacy.sharedSequenceNumber || context.sharedSequenceNumber)
      },
      remate: normalizeRemate(legacy.remate || {
        remateId: legacy.remateId,
        remateLabel: legacy.remateLabel,
        remateMetadata: legacy.remateMetadata
      }),
      result: normalizeExecutionResult(legacy.manganaResult || legacy.pasoResult, sportStatus),
      floreo: normalizeFloreo({
        total: legacy.floreoTotal,
        scoredTotal: legacy.floreoScoredTotal,
        detail: legacy.floreoDetail,
        source: legacy.floreoSource
      }),
      pullCount: nonNegativeInteger(legacy.pullCount, 0),
      vuelta: nullablePositiveInteger(legacy.pasoVuelta),
      distance: {
        meters: finiteNumber(legacy.distanceMeters, 0),
        resolvedValue: finiteNumber(legacy.distanceAdditionalPoints, 0)
      },
      dynamicContext: normalizeDynamicContext(legacy.dynamicScoring)
    },
    scoring: {
      baseSelection,
      additionalSelections,
      calculationDetail,
      goodPoints: pointSummary.goodPoints,
      individualBadPoints: pointSummary.individualBadPoints,
      teamBadPoints: pointSummary.teamBadPoints,
      netAttemptPoints: pointSummary.netAttemptPoints,
      teamAdjustedPoints: pointSummary.teamAdjustedPoints
    },
    infractions,
    teamInfractions,
    dq,
    timing: normalizeTiming(legacy.timing || context.timing || {}, legacy.tiempo),
    evidence: normalizeEvidence(legacy.timeEvidence || legacy.evidence),
    note: normalizeText(legacy.note, 2000),
    publication: {
      state: "DRAFT",
      frozen: false,
      publishedAt: null,
      officialRevision: null
    },
    auditMetadata: {
      source: "legacy-adapter",
      adaptedAt: normalizeIso(options.adaptedAt) || null,
      actor: normalizeActor(options.actor),
      device: normalizePlainObject(options.device)
    }
  });
}

export function normalizeScoringAttemptV2(attempt = {}) {
  const source = cloneFirebaseSafe(attempt).value || {};
  const identity = buildScoringAttemptIdentity(source.identity || {});
  const context = source.context || {};
  const sportState = source.sportState || {};
  const scoring = source.scoring || {};
  const dq = normalizeDq(source.dq);
  const normalized = {
    attemptSchemaVersion: SCORING_ATTEMPT_SCHEMA_VERSION,
    contractVersion: SCORING_ATTEMPT_CONTRACT_VERSION,
    identity,
    context: {
      competitionScope: normalizeScope(context.competitionScope, identity.participantId, identity.teamId),
      category: normalizeText(context.category, 160),
      phase: normalizeText(context.phase, 160),
      participantName: normalizeText(context.participantName, 240),
      teamName: normalizeText(context.teamName, 240),
      horseName: normalizeText(context.horseName, 240),
      ruleProfileId: nullableId(context.ruleProfileId),
      ruleProfileVersion: nullableVersion(context.ruleProfileVersion),
      effectiveRulesFingerprint: normalizeText(context.effectiveRulesFingerprint, 240) || null
    },
    sportState: {
      status: normalizeSportStatus(sportState.status),
      legacyStatusMapping: Boolean(sportState.legacyStatusMapping),
      classification: normalizeClassification(sportState.classification),
      opportunity: normalizeOpportunity(sportState.opportunity, identity.opportunityNumber),
      remate: normalizeRemate(sportState.remate),
      result: normalizeExecutionResult(sportState.result, sportState.status),
      floreo: normalizeFloreo(sportState.floreo),
      pullCount: nonNegativeInteger(sportState.pullCount, 0),
      vuelta: nullablePositiveInteger(sportState.vuelta),
      distance: {
        meters: finiteNumber(sportState.distance?.meters, 0),
        resolvedValue: finiteNumber(sportState.distance?.resolvedValue, 0)
      },
      dynamicContext: normalizeDynamicContext(sportState.dynamicContext)
    },
    scoring: {
      baseSelection: scoring.baseSelection ? normalizeSelection(scoring.baseSelection, { category: "base" }) : null,
      additionalSelections: normalizeSelections(scoring.additionalSelections, { category: "additional" }),
      calculationDetail: normalizeCalculationDetail(scoring.calculationDetail),
      goodPoints: finiteNumber(scoring.goodPoints, 0),
      individualBadPoints: finiteNumber(scoring.individualBadPoints, 0),
      teamBadPoints: finiteNumber(scoring.teamBadPoints, 0),
      netAttemptPoints: finiteNumber(scoring.netAttemptPoints, 0),
      teamAdjustedPoints: finiteNumber(scoring.teamAdjustedPoints, 0)
    },
    infractions: normalizeSelections(source.infractions, { category: "infraction" }),
    teamInfractions: normalizeSelections(source.teamInfractions, { category: "team_infraction" }),
    dq,
    timing: normalizeTiming(source.timing),
    evidence: normalizeEvidence(source.evidence),
    note: normalizeText(source.note, 2000),
    publication: normalizePublication(source.publication),
    auditMetadata: {
      source: normalizeText(source.auditMetadata?.source, 160) || "scoring-attempt-v2",
      adaptedAt: normalizeIso(source.auditMetadata?.adaptedAt) || null,
      actor: normalizeActor(source.auditMetadata?.actor),
      device: normalizePlainObject(source.auditMetadata?.device)
    }
  };
  const summary = calculateScoringAttemptV2Points(normalized);
  normalized.scoring = { ...normalized.scoring, ...summary };
  if (normalized.dq.active) normalized.sportState.status = "DQ";
  return normalized;
}

export function calculateScoringAttemptV2Points(attempt = {}) {
  const scoring = attempt.scoring || {};
  const basePoints = selectionTotal(scoring.baseSelection);
  const additionalPoints = sumSelections(scoring.additionalSelections);
  const calculatorPoints = finiteNumber(scoring.calculationDetail?.value, 0);
  const goodPoints = basePoints + additionalPoints + calculatorPoints;
  const individualBadPoints = sumSelections(attempt.infractions);
  const teamBadPoints = sumSelections(attempt.teamInfractions);
  const netAttemptPoints = attempt.dq?.active ? 0 - individualBadPoints : goodPoints - individualBadPoints;
  return {
    goodPoints,
    individualBadPoints,
    teamBadPoints,
    netAttemptPoints,
    teamAdjustedPoints: netAttemptPoints - teamBadPoints
  };
}

export function setScoringAttemptDq(attempt, dqInput = {}) {
  const next = normalizeScoringAttemptV2(attempt);
  const active = typeof dqInput === "boolean" ? dqInput : dqInput.active !== false;
  const previousStatus = next.dq.active
    ? next.dq.previousStatus
    : next.sportState.status === "DQ" ? "ATTEMPTED" : next.sportState.status;
  next.dq = active
    ? normalizeDq({
        ...next.dq,
        ...(typeof dqInput === "object" ? dqInput : {}),
        active: true,
        previousStatus
      })
    : normalizeDq({ ...next.dq, active: false, previousStatus });
  next.sportState.status = active
    ? "DQ"
    : normalizeSportStatus(previousStatus || deriveStatusFromContent(next));
  next.identity.revision += 1;
  next.publication = { ...next.publication, state: "DRAFT", frozen: false, publishedAt: null, officialRevision: null };
  next.scoring = { ...next.scoring, ...calculateScoringAttemptV2Points(next) };
  return next;
}

export function updateScoringAttemptClassification(attempt, classification = {}, valueMatrix = {}) {
  const next = normalizeScoringAttemptV2(attempt);
  const normalizedClassification = normalizeClassification(classification);
  next.sportState.classification = normalizedClassification;
  next.scoring.baseSelection = resolveSelectionClassification(
    next.scoring.baseSelection,
    normalizedClassification.classificationId,
    valueMatrix
  );
  next.scoring.additionalSelections = next.scoring.additionalSelections.map((selection) =>
    resolveSelectionClassification(selection, normalizedClassification.classificationId, valueMatrix)
  );
  next.identity.revision += 1;
  next.publication = { ...next.publication, state: "DRAFT", frozen: false, publishedAt: null, officialRevision: null };
  next.scoring = { ...next.scoring, ...calculateScoringAttemptV2Points(next) };
  return next;
}

export function buildOfficialScoringAttemptSnapshot(attempt, options = {}) {
  const sourceSerialization = cloneFirebaseSafe(attempt);
  if (sourceSerialization.errors.length) {
    const error = new Error(`scoring-attempt-v2-unsafe: ${sourceSerialization.errors.join(", ")}`);
    error.name = "ScoringAttemptValidationError";
    error.code = "scoring-attempt-v2-unsafe";
    error.details = sourceSerialization;
    throw error;
  }
  const next = normalizeScoringAttemptV2(sourceSerialization.value);
  next.publication = {
    state: "OFFICIAL",
    frozen: true,
    publishedAt: normalizeIso(options.publishedAt || next.publication.publishedAt),
    officialRevision: nullableNonNegativeInteger(options.officialRevision ?? next.publication.officialRevision)
  };
  next.auditMetadata = {
    ...next.auditMetadata,
    source: normalizeText(options.source || next.auditMetadata.source || "official-publication", 160),
    actor: normalizeActor(options.actor || next.auditMetadata.actor),
    device: normalizePlainObject(options.device || next.auditMetadata.device)
  };
  const validation = validateScoringAttemptV2(next, { requireOfficial: true });
  if (!validation.valid) {
    const error = new Error(`scoring-attempt-v2-invalid: ${validation.errors.join(", ")}`);
    error.name = "ScoringAttemptValidationError";
    error.code = "scoring-attempt-v2-invalid";
    error.details = validation;
    throw error;
  }
  return deepFreeze(cloneFirebaseSafe(next).value);
}

export function validateScoringAttemptV2(attempt, options = {}) {
  const serialization = cloneFirebaseSafe(attempt);
  const errors = [...serialization.errors];
  const warnings = [...serialization.warnings];
  const source = serialization.value || {};
  if (Number(source.attemptSchemaVersion) !== SCORING_ATTEMPT_SCHEMA_VERSION) errors.push("attempt-schema-version-invalid");
  if (source.contractVersion !== SCORING_ATTEMPT_CONTRACT_VERSION) errors.push("attempt-contract-version-invalid");
  const identity = source.identity || {};
  for (const field of ["tournamentId", "competitionId", "charreadaId", "suerteId", "attemptId"]) {
    if (!normalizeId(identity[field])) errors.push(`attempt-identity-${field}-invalid`);
  }
  const scope = normalizeScope(source.context?.competitionScope, identity.participantId, identity.teamId);
  if (scope === "individual" && !normalizeId(identity.participantId)) errors.push("attempt-participant-required");
  if (scope === "team" && !normalizeId(identity.teamId)) errors.push("attempt-team-required");
  if (!Number.isInteger(identity.opportunityNumber) || identity.opportunityNumber < 1) errors.push("attempt-opportunity-invalid");
  if (!Number.isInteger(identity.revision) || identity.revision < 0) errors.push("attempt-revision-invalid");
  if (!ATTEMPT_SPORT_STATUSES.includes(source.sportState?.status)) errors.push("attempt-sport-status-invalid");
  if (!Array.isArray(source.scoring?.additionalSelections)) errors.push("attempt-additional-invalid");
  if (!Array.isArray(source.infractions)) errors.push("attempt-infractions-invalid");
  if (!Array.isArray(source.teamInfractions)) errors.push("attempt-team-infractions-invalid");
  validateSelections(source.scoring?.baseSelection ? [source.scoring.baseSelection] : [], errors, warnings);
  validateSelections(source.scoring?.additionalSelections, errors, warnings);
  validateSelections(source.infractions, errors, warnings);
  validateSelections(source.teamInfractions, errors, warnings);
  for (const field of ["goodPoints", "individualBadPoints", "teamBadPoints", "netAttemptPoints", "teamAdjustedPoints"]) {
    if (!Number.isFinite(source.scoring?.[field])) errors.push(`attempt-${field}-invalid`);
  }
  if (source.dq?.active && !normalizeText(source.dq.reason, 1000)) errors.push("attempt-dq-reason-required");
  if (source.dq?.active && source.sportState?.status !== "DQ") errors.push("attempt-dq-status-conflict");
  validateClassification(source.sportState?.classification, errors);
  if (source.sportState?.floreo && !Array.isArray(source.sportState.floreo.detail)) errors.push("attempt-floreo-detail-invalid");
  if (!Number.isInteger(source.sportState?.pullCount) || source.sportState.pullCount < 0) errors.push("attempt-pull-count-invalid");
  validateTiming(source.timing, errors);
  if (!Array.isArray(source.evidence)) errors.push("attempt-evidence-invalid");
  if (!ATTEMPT_PUBLICATION_STATES.includes(source.publication?.state)) errors.push("attempt-publication-state-invalid");
  if (options.requireOfficial) {
    if (source.publication?.state !== "OFFICIAL" || source.publication?.frozen !== true) errors.push("attempt-official-freeze-required");
    if (!normalizeIso(source.publication?.publishedAt)) errors.push("attempt-published-at-required");
  }
  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    attemptSchemaVersion: SCORING_ATTEMPT_SCHEMA_VERSION
  };
}

export function serializeScoringAttemptV2(attempt) {
  const sourceSerialization = cloneFirebaseSafe(attempt);
  const normalized = normalizeScoringAttemptV2(sourceSerialization.value);
  const serialized = cloneFirebaseSafe(normalized);
  const validation = validateScoringAttemptV2(serialized.value);
  return {
    valid: sourceSerialization.errors.length === 0 && serialized.errors.length === 0 && validation.valid,
    value: serialized.value,
    errors: [...new Set([...sourceSerialization.errors, ...serialized.errors, ...validation.errors])],
    warnings: [...new Set([...sourceSerialization.warnings, ...serialized.warnings, ...validation.warnings])]
  };
}

export function buildEffectiveRulesFingerprint(suerte = {}) {
  const catalog = normalizeCatalog(suerte.catalog);
  const canonical = ["base", "adic", "infr", "team_infr", "desc"].flatMap((category) =>
    catalog[category].map((rule) => ({
      category,
      ruleId: normalizeId(rule.ruleId || rule.id),
      value: finiteNumber(rule.value ?? rule.pts, 0),
      valueByClassification: normalizeValueTable(rule.valueByClassification),
      source: normalizeText(rule.source || rule.origin, 80),
      enabled: rule.enabled !== false,
      order: finiteNumber(rule.order, 0)
    }))
  ).sort((left, right) => `${left.category}:${left.ruleId}`.localeCompare(`${right.category}:${right.ruleId}`));
  const profile = suerte.ruleResolution?.profile || {};
  return `rules_${stableHash(JSON.stringify({
    contractVersion: suerte.ruleResolution?.contractVersion || null,
    profileId: profile.profileId || null,
    profileVersion: profile.profileVersion || null,
    canonical
  }))}`;
}

function buildStableAttemptId(identity, scope) {
  const participantKey = scope === "individual" ? identity.participantId : identity.teamId;
  const parts = [
    identity.tournamentId,
    identity.competitionId,
    identity.charreadaId,
    scope,
    participantKey || "",
    identity.suerteId,
    String(identity.opportunityNumber),
    String(identity.participantSlot)
  ];
  const canonical = parts.map((part) => `${String(part).length}:${String(part)}`).join("|");
  return `attempt_${stableHash(canonical)}${stableHash([...canonical].reverse().join(""))}`;
}

function buildLegacyBaseSelection(attempt, baseRules) {
  const applied = new Set(Array.isArray(attempt.applied) ? attempt.applied.map(String) : []);
  const selected = baseRules.find((rule) => applied.has(String(rule.id || rule.ruleId)));
  if (selected) {
    const ruleId = String(selected.id || selected.ruleId || "");
    return normalizeSelection(selected, {
      category: "base",
      resolvedValue: finiteNumber(attempt.resolvedRuleValues?.[ruleId], finiteNumber(attempt.base, selected.pts))
    });
  }
  if (finiteNumber(attempt.base, 0) === 0) return null;
  return normalizeSelection({
    id: "legacy_base_aggregate",
    label: "Base legacy",
    value: finiteNumber(attempt.base, 0),
    resolvedValue: finiteNumber(attempt.base, 0),
    source: "LEGACY_AGGREGATE",
    metadata: { aggregate: true }
  }, { category: "base" });
}

function buildLegacySelections(attempt, catalogRules, manualItems, category, aggregateTotal, options = {}) {
  const applied = new Set(Array.isArray(attempt.applied) ? attempt.applied.map(String) : []);
  const catalogSelections = catalogRules
    .filter((rule) => applied.has(String(rule.id || rule.ruleId)))
    .map((rule) => {
      const ruleId = String(rule.id || rule.ruleId || "");
      const quantity = Math.max(1, Math.floor(finiteNumber(attempt.ruleQuantities?.[ruleId], 1)));
      const resolvedValue = finiteNumber(
        attempt.resolvedRuleValues?.[ruleId],
        finiteNumber(rule.resolvedValue ?? rule.value ?? rule.pts, 0)
      );
      return normalizeSelection({
        ...rule,
        resolvedValue,
        quantity,
        total: resolvedValue * quantity
      }, { category, manualDefault: false });
    });
  const manualSelections = normalizeSelections(manualItems, { category, source: "MANUAL", manualDefault: true });
  const specialSelections = normalizeSelections(options.specialSelections, { category, source: "FMCH_2026", manualDefault: false });
  const selections = [...catalogSelections, ...manualSelections, ...specialSelections];
  const resolved = sumSelections(selections);
  const remainder = finiteNumber(aggregateTotal, 0) - resolved;
  if (Math.abs(remainder) > 0.000001) {
    selections.push(normalizeSelection({
      id: `legacy_${category}_aggregate_adjustment`,
      label: `Ajuste agregado legacy ${category}`,
      value: remainder,
      resolvedValue: remainder,
      source: "LEGACY_AGGREGATE",
      metadata: { aggregateAdjustment: true }
    }, { category }));
  }
  return selections;
}

function buildLegacySportAdditionalSelections(attempt = {}, suerteId = "") {
  if (!["manganas_pie", "manganas_caballo"].includes(suerteId)) return [];
  const resolvedValue = Math.max(0, finiteNumber(attempt.floreoScoredTotal ?? attempt.floreoTotal, 0));
  if (!resolvedValue && !attempt.floreoSource && !(attempt.floreoDetail || []).length) return [];
  return [{
    id: `${suerteId}_floreo_total`,
    selectedRuleId: `${suerteId}_floreo_total`,
    label: "Floreo total",
    resolvedValue,
    value: resolvedValue,
    quantity: 1,
    source: attempt.floreoSource || "FMCH_2026",
    metadata: {
      source: attempt.floreoSource || "FMCH_2026",
      identity: "floreoTotal",
      detailOptional: true
    }
  }];
}

function buildLegacyDq(attempt, rules) {
  const reason = normalizeText(attempt.desc || attempt.dq?.reason, 1000);
  const matched = rules.find((rule) =>
    normalizeText(rule.id || rule.ruleId, 240) === normalizeText(attempt.descRuleId || attempt.dq?.ruleId, 240)
    || normalizeText(rule.label, 1000) === reason
  );
  return normalizeDq({
    active: Boolean(reason || attempt.dq?.active),
    ruleId: matched?.ruleId || matched?.id || attempt.descRuleId || attempt.dq?.ruleId || null,
    reason,
    source: matched?.source || attempt.dq?.source || "LEGACY",
    previousStatus: attempt.dq?.previousStatus || null
  });
}

function buildLegacyCalculationDetail(attempt, context) {
  if (attempt.calculationDetail) return normalizeCalculationDetail(attempt.calculationDetail);
  const suerteId = context.suerteId || context.suerte?.id;
  if (suerteId === "piales") {
    return normalizeCalculationDetail({
      type: "piales_distancia",
      value: 0,
      selections: [],
      details: {
        distanceMeters: finiteNumber(attempt.distanceMeters, 0),
        distanceAdditionalPoints: finiteNumber(attempt.distanceAdditionalPoints, 0),
        remateId: normalizeText(attempt.remateId, 240) || null,
        remateLabel: normalizeText(attempt.remateLabel, 500) || null
      }
    });
  }
  if (suerteId !== "cala" && !attempt.puntaPts && !attempt.puntaMetros) return null;
  return normalizeCalculationDetail({
    type: "cala_punta",
    value: finiteNumber(attempt.puntaPts, 0),
    selections: [],
    details: {
      metros: finiteNumber(attempt.puntaMetros, 0),
      metrosCalificados: finiteNumber(attempt.puntaMetrosCalificados, finiteNumber(attempt.puntaMetros, 0)),
      centimetros: nonNegativeInteger(attempt.puntaCentimetros, 0),
      piquetes: positiveInteger(attempt.puntaPiquetes, 1)
    }
  });
}

function resolveLegacySportStatus(attempt, summary, dq) {
  const explicit = normalizeSportStatus(attempt.sportStatus || attempt.status);
  if (explicit !== "NOT_STARTED") return explicit;
  if (dq.active) return "DQ";
  if (attempt.notAchieved) return "NOT_ACHIEVED";
  if (attempt.attempted) return summary.goodPoints || summary.individualBadPoints ? "VALID" : "ATTEMPTED";
  if (summary.goodPoints || summary.individualBadPoints || summary.teamBadPoints || attempt.note || attempt.timeEvidence?.length) return "VALID";
  return "NOT_STARTED";
}

function deriveStatusFromContent(attempt) {
  if (attempt.dq?.active) return "DQ";
  if (attempt.scoring?.goodPoints || attempt.scoring?.individualBadPoints || attempt.scoring?.teamBadPoints) return "VALID";
  return "NOT_STARTED";
}

function normalizeCatalog(catalog = {}) {
  return Object.fromEntries(["base", "adic", "infr", "team_infr", "desc"].map((key) => [
    key,
    Array.isArray(catalog?.[key]) ? catalog[key] : []
  ]));
}

function normalizeSelections(items, defaults = {}) {
  return (Array.isArray(items) ? items : []).slice(0, MAX_ARRAY).map((item) => normalizeSelection(item, defaults));
}

function normalizeSelection(item = {}, defaults = {}) {
  const source = cloneFirebaseSafe(item).value || {};
  const selectedRuleId = nullableId(source.selectedRuleId || source.ruleId || source.id);
  const quantity = positiveNumber(source.quantity, 1);
  const resolvedValue = finiteNumber(
    defaults.resolvedValue ?? source.resolvedValue ?? source.value ?? source.pts,
    0
  );
  const manual = source.manual === true || defaults.manualDefault === true;
  return {
    selectionId: normalizeId(source.selectionId || source.id || selectedRuleId) || `selection_${stableHash(JSON.stringify(source))}`,
    selectedRuleId,
    label: normalizeText(source.label, 500),
    category: normalizeText(source.category || defaults.category, 80),
    value: finiteNumber(source.value ?? source.pts ?? resolvedValue, resolvedValue),
    resolvedValue,
    quantity,
    total: finiteNumber(source.total, resolvedValue * quantity),
    source: normalizeText(source.source || source.origin || defaults.source || "PRODUCT_BASE", 120),
    manual,
    reason: manual ? normalizeText(source.reason || source.label, 1000) : normalizeText(source.reason, 1000) || null,
    timestamp: normalizeIso(source.timestamp || source.createdAt) || null,
    context: normalizePlainObject(source.context),
    valueByClassification: normalizeValueTable(source.valueByClassification),
    metadata: normalizePlainObject(source.metadata)
  };
}

function resolveSelectionClassification(selection, classificationId, valueMatrix) {
  if (!selection) return null;
  const next = normalizeSelection(selection, { category: selection.category });
  const externalTable = valueMatrix?.[next.selectedRuleId || next.selectionId];
  const table = normalizeValueTable(externalTable || next.valueByClassification);
  if (!classificationId || !Number.isFinite(table?.[classificationId])) return next;
  next.resolvedValue = Number(table[classificationId]);
  next.total = next.resolvedValue * next.quantity;
  next.valueByClassification = table;
  return next;
}

function normalizeValueTable(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 100)) {
    if (!normalizeId(key) || !Number.isFinite(Number(item))) continue;
    output[key] = Number(item);
  }
  return Object.keys(output).length ? output : null;
}

function normalizeDq(value = {}) {
  return {
    active: Boolean(value?.active),
    ruleId: nullableId(value?.ruleId),
    reason: normalizeText(value?.reason, 1000),
    source: normalizeText(value?.source, 120) || null,
    previousStatus: value?.previousStatus && ATTEMPT_SPORT_STATUSES.includes(value.previousStatus)
      ? value.previousStatus
      : null
  };
}

function normalizeClassification(value = {}) {
  return {
    classificationId: nullableId(value?.classificationId || value?.id),
    classificationLabel: normalizeText(value?.classificationLabel || value?.label, 240) || null,
    classificationValue: value?.classificationValue === null || value?.classificationValue === undefined
      ? null
      : finiteNumber(value.classificationValue, null)
  };
}

function normalizeOpportunity(value = {}, fallbackNumber = 1) {
  return {
    number: positiveInteger(value?.number || value?.opportunityNumber, fallbackNumber),
    status: normalizeOpportunityStatus(value?.status, "NOT_STARTED"),
    type: normalizeText(value?.type, 80) || null,
    sharedOpportunityId: nullableId(value?.sharedOpportunityId),
    sharedSequenceNumber: nullablePositiveInteger(value?.sharedSequenceNumber)
  };
}

function normalizeOpportunityStatus(value, sportStatus) {
  const clean = normalizeText(value, 80).toUpperCase();
  return clean || sportStatus || "NOT_STARTED";
}

function normalizeRemate(value = {}) {
  const remateId = nullableId(value?.remateId || value?.id);
  const remateLabel = normalizeText(value?.remateLabel || value?.label, 240) || null;
  if (!remateId && !remateLabel && !value?.remateMetadata && !value?.metadata) return null;
  return {
    remateId,
    remateLabel,
    remateMetadata: normalizePlainObject(value?.remateMetadata || value?.metadata)
  };
}

function normalizeExecutionResult(value, sportStatus) {
  const clean = normalizeText(value, 80).toUpperCase();
  if (["NOT_STARTED", "ACHIEVED", "NOT_ACHIEVED"].includes(clean)) return clean;
  if (sportStatus === "NOT_ACHIEVED" || sportStatus === "ZERO") return "NOT_ACHIEVED";
  if (["ATTEMPTED", "VALID", "DQ"].includes(sportStatus)) return "ACHIEVED";
  return "NOT_STARTED";
}

function normalizeFloreo(value = {}) {
  const total = finiteNumber(value?.total, 0);
  const scoredTotal = value?.scoredTotal === null || value?.scoredTotal === undefined
    ? total
    : finiteNumber(value.scoredTotal, 0);
  return {
    total: Math.max(0, total),
    scoredTotal: Math.max(0, scoredTotal),
    source: normalizeText(value?.source, 240) || null,
    detail: (Array.isArray(value?.detail) ? value.detail : []).slice(0, 100).map((item) => ({
      selectedRuleId: nullableId(item?.selectedRuleId || item?.ruleId || item?.id),
      label: normalizeText(item?.label, 240),
      resolvedValue: finiteNumber(item?.resolvedValue ?? item?.value, 0),
      source: normalizeText(item?.source, 240) || null
    })).filter((item) => item.selectedRuleId)
  };
}

function normalizeDynamicContext(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    contractVersion: normalizeText(value.contractVersion, 80) || null,
    classificationId: nullableId(value.classificationId),
    vuelta: nullablePositiveInteger(value.vuelta),
    selectedRuleIds: (Array.isArray(value.selectedRuleIds) ? value.selectedRuleIds : [])
      .slice(0, 100).map(normalizeId).filter(Boolean),
    resolvedRuleValues: normalizePlainObject(value.resolvedRuleValues),
    source: normalizeText(value.source, 240) || null
  };
}

function normalizeCalculationDetail(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    type: normalizeText(value.type, 120),
    value: finiteNumber(value.value, 0),
    selections: normalizeSelections(value.selections, { category: "calculator" }),
    details: normalizePlainObject(value.details || value.metadata)
  };
}

function normalizeTiming(value = {}, legacyText = "") {
  return {
    timerId: nullableId(value?.timerId || value?.id),
    sharedTimerId: nullableId(value?.sharedTimerId),
    officialElapsedMs: nullableNonNegativeNumber(value?.officialElapsedMs ?? value?.elapsedMs),
    wallElapsedMs: nullableNonNegativeNumber(value?.wallElapsedMs),
    elapsedMs: nullableNonNegativeNumber(value?.elapsedMs),
    remainingMs: nullableNonNegativeNumber(value?.remainingMs),
    startedAt: normalizeIso(value?.startedAt) || null,
    endedAt: normalizeIso(value?.endedAt) || null,
    status: normalizeText(value?.status || value?.timingStatus, 80) || null,
    legacyText: normalizeText(value?.legacyText ?? legacyText, 240),
    secondaryTimers: (Array.isArray(value?.secondaryTimers) ? value.secondaryTimers : []).slice(0, 20).map((timer) => ({
      timerId: nullableId(timer?.timerId || timer?.id),
      officialElapsedMs: nullableNonNegativeNumber(timer?.officialElapsedMs ?? timer?.elapsedMs),
      wallElapsedMs: nullableNonNegativeNumber(timer?.wallElapsedMs),
      status: normalizeText(timer?.status, 80) || null
    })).filter((timer) => timer.timerId),
    adjustments: (Array.isArray(value?.adjustments || value?.timeAdjustments)
      ? value.adjustments || value.timeAdjustments
      : []).slice(0, 100).map((item) => normalizePlainObject(item))
  };
}

function normalizeEvidence(items) {
  return (Array.isArray(items) ? items : []).slice(0, MAX_ARRAY).map((item) => {
    const source = cloneFirebaseSafe(item).value || {};
    return {
      id: normalizeId(source.id) || `evidence_${stableHash(JSON.stringify(source))}`,
      label: normalizeText(source.label, 500),
      timeMs: nullableNonNegativeNumber(source.timeMs),
      timeText: normalizeText(source.timeText, 240),
      capturedAt: normalizeIso(source.capturedAt) || null,
      timerRunning: Boolean(source.timerRunning),
      source: normalizeText(source.source, 120),
      metadata: normalizePlainObject(source.metadata)
    };
  });
}

function normalizePublication(value = {}) {
  const state = ATTEMPT_PUBLICATION_STATES.includes(value?.state) ? value.state : "DRAFT";
  return {
    state,
    frozen: state === "OFFICIAL" ? value?.frozen !== false : Boolean(value?.frozen),
    publishedAt: normalizeIso(value?.publishedAt) || null,
    officialRevision: nullableNonNegativeInteger(value?.officialRevision)
  };
}

function normalizeActor(value = {}) {
  return {
    id: normalizeText(value?.id || value?.uid, 240),
    name: normalizeText(value?.name, 240),
    role: normalizeText(value?.role, 120)
  };
}

function normalizePointSummary(value) {
  if (!value || typeof value !== "object") return null;
  const fields = ["goodPoints", "individualBadPoints", "teamBadPoints", "netAttemptPoints", "teamAdjustedPoints"];
  if (!fields.every((field) => Number.isFinite(Number(value[field])))) return null;
  return Object.fromEntries(fields.map((field) => [field, Number(value[field])]));
}

function validateSelections(items, errors, warnings) {
  for (const item of Array.isArray(items) ? items : []) {
    if (!normalizeId(item.selectionId)) errors.push("attempt-selection-id-invalid");
    if (item.selectedRuleId !== null && !normalizeId(item.selectedRuleId)) errors.push("attempt-rule-id-invalid");
    for (const field of ["value", "resolvedValue", "quantity", "total"]) {
      if (!Number.isFinite(item[field])) errors.push(`attempt-selection-${field}-invalid`);
    }
    if (item.manual && !normalizeText(item.reason, 1000)) errors.push("attempt-manual-reason-required");
    if (!item.selectedRuleId && item.source === "LEGACY_AGGREGATE") warnings.push("attempt-legacy-aggregate-selection");
  }
}

function validateClassification(value, errors) {
  if (!value) return;
  if (value.classificationId !== null && !normalizeId(value.classificationId)) errors.push("attempt-classification-id-invalid");
  if (value.classificationValue !== null && !Number.isFinite(value.classificationValue)) errors.push("attempt-classification-value-invalid");
}

function validateTiming(value, errors) {
  if (!value || typeof value !== "object") {
    errors.push("attempt-timing-invalid");
    return;
  }
  for (const field of ["elapsedMs", "remainingMs"]) {
    if (value[field] !== null && (!Number.isFinite(value[field]) || value[field] < 0)) errors.push(`attempt-timing-${field}-invalid`);
  }
}

function selectionTotal(selection) {
  return selection ? finiteNumber(selection.total, finiteNumber(selection.resolvedValue, 0) * positiveNumber(selection.quantity, 1)) : 0;
}

function sumSelections(items) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + selectionTotal(item), 0);
}

function normalizeSportStatus(value) {
  const clean = normalizeText(value, 80).toUpperCase();
  return ATTEMPT_SPORT_STATUSES.includes(clean) ? clean : "NOT_STARTED";
}

function normalizeScope(value, participantId, teamId) {
  const clean = normalizeText(value, 40).toLowerCase();
  if (clean === "individual" || clean === "team") return clean;
  return participantId && !teamId ? "individual" : "team";
}

function normalizePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return cloneFirebaseSafe(value).value || {};
}

function cloneFirebaseSafe(value, path = "attempt", depth = 0, seen = new WeakSet(), result = { errors: [], warnings: [] }) {
  if (depth > MAX_DEPTH) {
    result.errors.push(`${path}:depth-limit`);
    return { ...result, value: null };
  }
  if (value === null || typeof value === "boolean") return { ...result, value };
  if (typeof value === "string") {
    if (value.length > MAX_STRING) result.warnings.push(`${path}:string-truncated`);
    return { ...result, value: value.slice(0, MAX_STRING) };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      result.errors.push(`${path}:number-invalid`);
      return { ...result, value: null };
    }
    return { ...result, value };
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    result.errors.push(`${path}:value-forbidden`);
    return { ...result, value: null };
  }
  if (seen.has(value)) {
    result.errors.push(`${path}:cycle`);
    return { ...result, value: null };
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY) result.errors.push(`${path}:array-limit`);
      const output = [];
      for (let index = 0; index < Math.min(value.length, MAX_ARRAY); index += 1) {
        output.push(cloneFirebaseSafe(value[index], `${path}[${index}]`, depth + 1, seen, result).value);
      }
      return { ...result, value: output };
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      result.errors.push(`${path}:prototype-forbidden`);
      return { ...result, value: null };
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_KEYS) result.errors.push(`${path}:key-limit`);
    const output = {};
    for (const key of keys.slice(0, MAX_KEYS)) {
      if (typeof key !== "string" || DANGEROUS_KEYS.has(key)) {
        result.errors.push(`${path}:key-forbidden`);
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        result.errors.push(`${path}.${key}:accessor-forbidden`);
        continue;
      }
      output[key] = cloneFirebaseSafe(descriptor.value, `${path}.${key}`, depth + 1, seen, result).value;
    }
    return { ...result, value: output };
  } finally {
    seen.delete(value);
  }
}

function normalizeId(value) {
  const clean = normalizeText(value, 240).trim();
  return ID_PATTERN.test(clean) ? clean : "";
}

function nullableId(value) {
  return normalizeId(value) || null;
}

function nullableVersion(value) {
  const clean = normalizeText(value, 120).trim();
  return /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(clean) ? clean : null;
}

function normalizeText(value, maxLength = MAX_STRING) {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, maxLength);
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
}

function nullablePositiveInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : null;
}

function nullableNonNegativeInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function nullableNonNegativeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeIso(value) {
  if (!value) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function stableHash(value) {
  let left = 2166136261;
  let right = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 16777619);
    right = Math.imul(right ^ code, 3266489917);
  }
  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0).toString(16).padStart(8, "0")}`;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}
