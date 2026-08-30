export const BRAKE_REVIEW_CONTRACT_VERSION = "1.0.0";
export const BRAKE_REVIEW_PHASE_ID = "freno_review";
export const BRAKE_REVIEW_PROFILE = Object.freeze({
  profileId: "FMCH_2026_LIBRE",
  profileVersion: "0.6.1",
  profileFingerprint: "rptp_10e596046446e850"
});
export const BRAKE_REVIEW_TEMPORAL_POLICY = Object.freeze({
  policyId: "FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES",
  policyVersion: "1.0.0",
  policyFingerprint: "fmchtp_7d1e001181026f6d",
  timerRuleId: "fmch_2026_cala_freno_review"
});
export const BRAKE_REVIEW_STAGES = Object.freeze({
  REVIEW: "BRAKE_REVIEW",
  PROTOCOL: "WAITING_PROTOCOL",
  JUDGES_CALL: "JUDGES_CALL",
  CALA_READY: "CALA_READY",
  DISQUALIFIED: "DISQUALIFIED"
});
export const BRAKE_REVIEW_RESULTS = Object.freeze({
  PENDING: "PENDING",
  AUTHORIZED: "AUTHORIZED",
  AUTHORIZED_WITH_INFRACTIONS: "AUTHORIZED_WITH_INFRACTIONS",
  DISQUALIFIED: "DISQUALIFIED"
});
export const BRAKE_REVIEW_BATCH_STATUSES = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED"
});
export const BRAKE_REVIEW_ACTIONS = Object.freeze({
  SYNC_TEMPORAL: "SYNC_TEMPORAL",
  TOGGLE_RULE: "TOGGLE_RULE",
  AUTHORIZE: "AUTHORIZE",
  CONFIRM_DISQUALIFICATION: "CONFIRM_DISQUALIFICATION",
  OPEN_PROTOCOL: "OPEN_PROTOCOL",
  CALL_JUDGES: "CALL_JUDGES",
  MARK_CALA_READY: "MARK_CALA_READY"
});

const TEMPORAL_RULES = Object.freeze([
  Object.freeze({ ruleId: "cala_inf_revision_freno_mas_un_minuto", thresholdMs: 60_000, inclusive: false }),
  Object.freeze({ ruleId: "cala_inf_revision_freno_mas_dos_minutos", thresholdMs: 120_000, inclusive: false }),
  Object.freeze({ ruleId: "cala_desc_revision_freno_mas_tres_minutos", thresholdMs: 180_000, inclusive: true, dq: true })
]);
const ALLOWED_ROLES = new Set(["juez", "supervisor", "operador"]);
const MAX_AUDIT_ENTRIES = 100;
const MAX_COMMAND_IDS = 100;

export function createBrakeReviewAutomaticCommandGuard() {
  const pending = new Map();
  const terminalFailures = new Set();

  return Object.freeze({
    begin(key, commandId) {
      const normalizedKey = clean(key);
      const normalizedCommandId = clean(commandId);
      if (!normalizedKey || !normalizedCommandId || pending.has(normalizedKey) || terminalFailures.has(normalizedKey)) {
        return false;
      }
      pending.set(normalizedKey, normalizedCommandId);
      return true;
    },
    complete(key, succeeded) {
      const normalizedKey = clean(key);
      if (!normalizedKey) return;
      pending.delete(normalizedKey);
      if (succeeded !== true) terminalFailures.add(normalizedKey);
    },
    commandId(key) {
      return pending.get(clean(key)) || "";
    },
    reset(key) {
      const normalizedKey = clean(key);
      pending.delete(normalizedKey);
      terminalFailures.delete(normalizedKey);
    },
    diagnostics() {
      return Object.freeze({
        pending: pending.size,
        terminalFailures: terminalFailures.size
      });
    }
  });
}

export function isBrakeReviewProfile(context = {}) {
  const source = context.tournament || context;
  const profileId = clean(source.ruleProfileId || source.profileId);
  const profileVersion = clean(source.ruleProfileVersion || source.profileVersion);
  const profileFingerprint = clean(
    source.ruleProfileContentFingerprint
      || source.effectiveRulesFingerprint
      || source.ruleProfileFingerprint
      || source.profileFingerprint
  );
  return profileId === BRAKE_REVIEW_PROFILE.profileId
    && profileVersion === BRAKE_REVIEW_PROFILE.profileVersion
    && profileFingerprint === BRAKE_REVIEW_PROFILE.profileFingerprint;
}

export function canOperateBrakeReview(actor = {}) {
  return actor.active !== false && ALLOWED_ROLES.has(clean(actor.role).toLowerCase());
}

export function getBrakeReviewRules(catalog = {}, options = {}) {
  const consequence = clean(options.consequence).toUpperCase();
  return [
    ...(Array.isArray(catalog.infr) ? catalog.infr : []),
    ...(Array.isArray(catalog.desc) ? catalog.desc : [])
  ].filter((rule) => {
    const metadata = rule?.metadata || {};
    const phaseIds = Array.isArray(metadata.phaseIds) ? metadata.phaseIds : [];
    const phaseMatch = clean(metadata.phaseId) === BRAKE_REVIEW_PHASE_ID
      || phaseIds.some((phaseId) => clean(phaseId) === BRAKE_REVIEW_PHASE_ID);
    if (!phaseMatch || rule?.enabled === false) return false;
    if (!consequence) return true;
    return getBrakeReviewRuleConsequence(rule) === consequence;
  }).map(clone);
}

export function getBrakeReviewRuleConsequence(rule = {}) {
  if (clean(rule.category).toLowerCase() === "desc") return "DISQUALIFICATION";
  const consequence = clean(rule.metadata?.consequence).toUpperCase();
  return consequence || "BAD_POINTS";
}

export function createBrakeReviewState(context = {}, options = {}) {
  const now = iso(options.now);
  return normalizeBrakeReviewState({
    contractVersion: BRAKE_REVIEW_CONTRACT_VERSION,
    phaseId: BRAKE_REVIEW_PHASE_ID,
    stage: BRAKE_REVIEW_STAGES.REVIEW,
    result: BRAKE_REVIEW_RESULTS.PENDING,
    tournamentId: context.tournamentId,
    competitionId: context.competitionId || "equipos_completo",
    charreadaId: context.charreadaId,
    teamId: context.teamId,
    competitorId: context.competitorId || context.participantId,
    horseId: context.horseId,
    presenterName: context.presenterName || context.participantName,
    horseName: context.horseName,
    ruleProfileId: BRAKE_REVIEW_PROFILE.profileId,
    ruleProfileVersion: BRAKE_REVIEW_PROFILE.profileVersion,
    ruleProfileFingerprint: BRAKE_REVIEW_PROFILE.profileFingerprint,
    temporalPolicyId: BRAKE_REVIEW_TEMPORAL_POLICY.policyId,
    temporalPolicyVersion: BRAKE_REVIEW_TEMPORAL_POLICY.policyVersion,
    temporalPolicyFingerprint: BRAKE_REVIEW_TEMPORAL_POLICY.policyFingerprint,
    timerId: context.timerId,
    timerRevision: Number(context.timerRevision || 0),
    elapsedMs: Number(context.elapsedMs || 0),
    appliedRuleIds: [],
    manualRuleIds: [],
    temporalRuleIds: [],
    dqRuleId: null,
    revision: 0,
    commandIds: [],
    audit: [],
    createdAt: now,
    updatedAt: now,
    authorizedAt: null,
    authorizedBy: null,
    calaReadyAt: null,
    calaReadyBy: null
  });
}

export function normalizeBrakeReviewState(value = {}, context = {}) {
  const base = {
    ...createBrakeReviewStateUnsafe(context, value.createdAt || value.updatedAt),
    ...clone(value)
  };
  const stage = Object.values(BRAKE_REVIEW_STAGES).includes(base.stage)
    ? base.stage
    : BRAKE_REVIEW_STAGES.REVIEW;
  const result = Object.values(BRAKE_REVIEW_RESULTS).includes(base.result)
    ? base.result
    : BRAKE_REVIEW_RESULTS.PENDING;
  return {
    ...base,
    contractVersion: BRAKE_REVIEW_CONTRACT_VERSION,
    phaseId: BRAKE_REVIEW_PHASE_ID,
    stage,
    result,
    ruleProfileId: BRAKE_REVIEW_PROFILE.profileId,
    ruleProfileVersion: BRAKE_REVIEW_PROFILE.profileVersion,
    ruleProfileFingerprint: BRAKE_REVIEW_PROFILE.profileFingerprint,
    temporalPolicyId: BRAKE_REVIEW_TEMPORAL_POLICY.policyId,
    temporalPolicyVersion: BRAKE_REVIEW_TEMPORAL_POLICY.policyVersion,
    temporalPolicyFingerprint: BRAKE_REVIEW_TEMPORAL_POLICY.policyFingerprint,
    timerRevision: Math.max(0, integer(base.timerRevision)),
    elapsedMs: Math.max(0, integer(base.elapsedMs)),
    appliedRuleIds: uniqueStrings(base.appliedRuleIds),
    manualRuleIds: uniqueStrings(base.manualRuleIds),
    temporalRuleIds: uniqueStrings(base.temporalRuleIds),
    dqRuleId: clean(base.dqRuleId) || null,
    revision: Math.max(0, integer(base.revision)),
    commandIds: uniqueStrings(base.commandIds).slice(-MAX_COMMAND_IDS),
    audit: (Array.isArray(base.audit) ? base.audit : []).map(clone).slice(-MAX_AUDIT_ENTRIES),
    createdAt: iso(base.createdAt),
    updatedAt: iso(base.updatedAt || base.createdAt)
  };
}

export function getBrakeReviewStateFromTimer(timer = {}, context = {}) {
  return timer.brakeReview
    ? normalizeBrakeReviewState(timer.brakeReview, context)
    : createBrakeReviewState({ ...context, timerId: timer.timerId, timerRevision: timer.revision });
}

export function buildBrakeReviewBatchState(presentations = []) {
  const queue = (Array.isArray(presentations) ? presentations : []).map((presentation, index) => {
    const review = normalizeBrakeReviewState(presentation?.review || {}, presentation?.context || {});
    return {
      ...clone(presentation || {}),
      index,
      teamId: clean(presentation?.teamId || review.teamId),
      timerId: clean(presentation?.timerId || review.timerId),
      review,
      completed: isCompletedBrakeReview(review)
    };
  });
  const firstIncompleteIndex = queue.findIndex((presentation) => !presentation.completed);
  const completed = queue.filter((presentation) => presentation.completed);
  const allCompleted = queue.length > 0 && completed.length === queue.length;
  const currentIndex = allCompleted
    ? Math.max(0, queue.length - 1)
    : Math.max(0, firstIncompleteIndex);
  const current = queue[currentIndex] || null;
  const finalReview = queue.at(-1)?.review || null;
  const hasActivity = queue.some((presentation) => (
    presentation.review.revision > 0
    || presentation.review.stage !== BRAKE_REVIEW_STAGES.REVIEW
    || Number(presentation.review.elapsedMs || 0) > 0
  ));
  const status = allCompleted
    ? BRAKE_REVIEW_BATCH_STATUSES.COMPLETED
    : hasActivity ? BRAKE_REVIEW_BATCH_STATUSES.IN_PROGRESS : BRAKE_REVIEW_BATCH_STATUSES.NOT_STARTED;
  return {
    status,
    queue,
    current,
    currentIndex,
    currentBrakeReviewTeamId: current?.teamId || null,
    completedBrakeReviews: completed.map((presentation) => presentation.teamId),
    remainingBrakeReviews: queue.filter((presentation) => !presentation.completed).map((presentation) => presentation.teamId),
    allCompleted,
    protocolStage: allCompleted ? finalReview?.stage || null : null,
    calaReady: allCompleted && finalReview?.stage === BRAKE_REVIEW_STAGES.CALA_READY
  };
}

export function isCompletedBrakeReview(review = {}) {
  const normalized = normalizeBrakeReviewState(review);
  return [
    BRAKE_REVIEW_STAGES.PROTOCOL,
    BRAKE_REVIEW_STAGES.JUDGES_CALL,
    BRAKE_REVIEW_STAGES.CALA_READY
  ].includes(normalized.stage);
}

export function resolveBrakeReviewTemporalRuleIds(elapsedMs) {
  const elapsed = Math.max(0, Number(elapsedMs || 0));
  return TEMPORAL_RULES.filter((rule) => (
    rule.inclusive ? elapsed >= rule.thresholdMs : elapsed > rule.thresholdMs
  )).map((rule) => rule.ruleId);
}

export function hasPendingBrakeReviewTemporalConsequences(review = {}, elapsedMs = 0) {
  const current = new Set(normalizeBrakeReviewState(review).temporalRuleIds);
  return resolveBrakeReviewTemporalRuleIds(elapsedMs).some((ruleId) => !current.has(ruleId));
}

export function applyBrakeReviewCommand(review = {}, request = {}, options = {}) {
  const current = normalizeBrakeReviewState(review, options.context);
  const commandId = clean(request.commandId);
  if (!commandId) return fail("brake-review-command-id-required", current);
  if (current.commandIds.includes(commandId)) {
    return { ok: true, idempotent: true, reason: "brake-review-command-replayed", review: current };
  }
  if (request.expectedRevision !== undefined && Number(request.expectedRevision) !== current.revision) {
    return fail("brake-review-revision-conflict", current);
  }
  const actor = normalizeActor(request.actor || options.actor);
  if (!canOperateBrakeReview(actor)) return fail("brake-review-permission-denied", current);
  const action = clean(request.action || request.type).toUpperCase();
  if (!Object.values(BRAKE_REVIEW_ACTIONS).includes(action)) return fail("brake-review-action-invalid", current);
  const now = iso(options.now || request.acceptedAt);
  const elapsedMs = Math.max(current.elapsedMs, integer(request.elapsedMs));
  const timerRevision = Math.max(current.timerRevision, integer(request.timerRevision));
  let next = clone(current);
  let ruleId = clean(request.ruleId);

  if (action === BRAKE_REVIEW_ACTIONS.SYNC_TEMPORAL) {
    const temporalRuleIds = resolveBrakeReviewTemporalRuleIds(elapsedMs);
    next.temporalRuleIds = uniqueStrings([...current.temporalRuleIds, ...temporalRuleIds]);
    next.appliedRuleIds = uniqueStrings([...current.manualRuleIds, ...next.temporalRuleIds]);
    const temporalDq = temporalRuleIds.find((id) => id === "cala_desc_revision_freno_mas_tres_minutos");
    if (temporalDq) {
      next.dqRuleId = temporalDq;
      next.stage = BRAKE_REVIEW_STAGES.DISQUALIFIED;
      next.result = BRAKE_REVIEW_RESULTS.DISQUALIFIED;
    }
  }

  if (action === BRAKE_REVIEW_ACTIONS.TOGGLE_RULE) {
    const allowedRules = getBrakeReviewRules(options.catalog || {}, {});
    const rule = allowedRules.find((candidate) => clean(candidate.ruleId || candidate.id) === ruleId);
    if (!rule) return fail("brake-review-rule-not-allowed", current);
    if (TEMPORAL_RULES.some((candidate) => candidate.ruleId === ruleId)) {
      return fail("brake-review-temporal-rule-manual-toggle-denied", current);
    }
    const manual = new Set(current.manualRuleIds);
    if (manual.has(ruleId)) manual.delete(ruleId);
    else manual.add(ruleId);
    next.manualRuleIds = [...manual];
    next.appliedRuleIds = uniqueStrings([...next.manualRuleIds, ...current.temporalRuleIds]);
    const selectedDq = next.manualRuleIds.find((id) => {
      const selected = allowedRules.find((candidate) => clean(candidate.ruleId || candidate.id) === id);
      return getBrakeReviewRuleConsequence(selected) === "DISQUALIFICATION";
    });
    next.dqRuleId = selectedDq || (current.temporalRuleIds.includes("cala_desc_revision_freno_mas_tres_minutos")
      ? "cala_desc_revision_freno_mas_tres_minutos"
      : null);
    if (next.dqRuleId) {
      next.stage = BRAKE_REVIEW_STAGES.DISQUALIFIED;
      next.result = BRAKE_REVIEW_RESULTS.DISQUALIFIED;
    } else if (current.stage === BRAKE_REVIEW_STAGES.DISQUALIFIED) {
      next.stage = BRAKE_REVIEW_STAGES.REVIEW;
      next.result = BRAKE_REVIEW_RESULTS.PENDING;
    }
  }

  if (action === BRAKE_REVIEW_ACTIONS.AUTHORIZE) {
    if (current.stage !== BRAKE_REVIEW_STAGES.REVIEW || current.dqRuleId) {
      return fail("brake-review-authorize-invalid-state", current);
    }
    next.stage = BRAKE_REVIEW_STAGES.PROTOCOL;
    next.result = current.appliedRuleIds.length
      ? BRAKE_REVIEW_RESULTS.AUTHORIZED_WITH_INFRACTIONS
      : BRAKE_REVIEW_RESULTS.AUTHORIZED;
    next.authorizedAt = now;
    next.authorizedBy = actor;
  }

  if (action === BRAKE_REVIEW_ACTIONS.CONFIRM_DISQUALIFICATION) {
    if (current.stage !== BRAKE_REVIEW_STAGES.DISQUALIFIED || !current.dqRuleId) {
      return fail("brake-review-disqualification-confirm-invalid-state", current);
    }
    next.stage = BRAKE_REVIEW_STAGES.PROTOCOL;
    next.result = BRAKE_REVIEW_RESULTS.DISQUALIFIED;
    next.authorizedAt = now;
    next.authorizedBy = actor;
  }

  if (action === BRAKE_REVIEW_ACTIONS.OPEN_PROTOCOL) {
    if (current.stage !== BRAKE_REVIEW_STAGES.PROTOCOL) return fail("brake-review-protocol-invalid-state", current);
  }

  if (action === BRAKE_REVIEW_ACTIONS.CALL_JUDGES) {
    if (current.stage !== BRAKE_REVIEW_STAGES.PROTOCOL) return fail("brake-review-judges-call-invalid-state", current);
    next.stage = BRAKE_REVIEW_STAGES.JUDGES_CALL;
  }

  if (action === BRAKE_REVIEW_ACTIONS.MARK_CALA_READY) {
    if (current.stage !== BRAKE_REVIEW_STAGES.JUDGES_CALL) return fail("brake-review-cala-ready-invalid-state", current);
    next.stage = BRAKE_REVIEW_STAGES.CALA_READY;
    next.calaReadyAt = now;
    next.calaReadyBy = actor;
  }

  next.elapsedMs = elapsedMs;
  next.timerRevision = timerRevision;
  next.revision = current.revision + 1;
  next.commandIds = uniqueStrings([...current.commandIds, commandId]).slice(-MAX_COMMAND_IDS);
  next.updatedAt = now;
  next.audit = [...current.audit, buildAuditEntry({
    current,
    next,
    action,
    actor,
    commandId,
    ruleId,
    elapsedMs,
    timerRevision,
    now,
    catalog: options.catalog || {},
    source: request.source
  })].slice(-MAX_AUDIT_ENTRIES);
  return { ok: true, idempotent: false, review: normalizeBrakeReviewState(next) };
}

export function applyBrakeReviewToCalaAttempt(attempt = {}, review = {}, catalog = {}) {
  const source = clone(attempt);
  const normalized = normalizeBrakeReviewState(review);
  const phaseRules = getBrakeReviewRules(catalog);
  const phaseRuleIds = new Set(phaseRules.map((rule) => clean(rule.ruleId || rule.id)));
  const infraRules = phaseRules.filter((rule) => getBrakeReviewRuleConsequence(rule) !== "DISQUALIFICATION");
  const infraRuleIds = new Set(infraRules.map((rule) => clean(rule.ruleId || rule.id)));
  const sourceApplied = new Set(Array.isArray(source.applied) ? source.applied : []);
  const previousBrakePoints = infraRules.reduce((sum, rule) => {
    const ruleId = clean(rule.ruleId || rule.id);
    if (!sourceApplied.has(ruleId)) return sum;
    const quantity = Math.max(1, integer(source.ruleQuantities?.[ruleId] || 1));
    return sum + Number(rule.pts ?? rule.value ?? 0) * quantity;
  }, 0);
  const nextBrakePoints = infraRules.reduce((sum, rule) => (
    normalized.appliedRuleIds.includes(clean(rule.ruleId || rule.id))
      ? sum + Number(rule.pts ?? rule.value ?? 0)
      : sum
  ), 0);
  const applied = uniqueStrings([
    ...(Array.isArray(source.applied) ? source.applied : []).filter((ruleId) => !phaseRuleIds.has(ruleId)),
    ...normalized.appliedRuleIds.filter((ruleId) => infraRuleIds.has(ruleId))
  ]);
  const ruleQuantities = { ...(source.ruleQuantities || {}) };
  phaseRuleIds.forEach((ruleId) => delete ruleQuantities[ruleId]);
  applied.filter((ruleId) => phaseRuleIds.has(ruleId)).forEach((ruleId) => {
    ruleQuantities[ruleId] = 1;
  });
  const dqRule = phaseRules.find((rule) => clean(rule.ruleId || rule.id) === normalized.dqRuleId);
  return {
    ...source,
    applied,
    ruleQuantities,
    infr: Math.max(0, Number(source.infr || 0) - previousBrakePoints + nextBrakePoints),
    desc: normalized.dqRuleId ? dqRule?.label || "Descalificacion en revision de freno" : source.desc,
    descRuleId: normalized.dqRuleId || source.descRuleId || null,
    autoDescRuleId: normalized.dqRuleId || source.autoDescRuleId || null,
    attempted: normalized.dqRuleId ? true : source.attempted,
    brakeReview: buildBrakeReviewSnapshot(normalized)
  };
}

export function buildBrakeReviewSnapshot(review = {}) {
  const normalized = normalizeBrakeReviewState(review);
  return clone({
    contractVersion: normalized.contractVersion,
    phaseId: normalized.phaseId,
    stage: normalized.stage,
    result: normalized.result,
    ruleProfileId: normalized.ruleProfileId,
    ruleProfileVersion: normalized.ruleProfileVersion,
    ruleProfileFingerprint: normalized.ruleProfileFingerprint,
    temporalPolicyId: normalized.temporalPolicyId,
    temporalPolicyVersion: normalized.temporalPolicyVersion,
    temporalPolicyFingerprint: normalized.temporalPolicyFingerprint,
    timerId: normalized.timerId,
    timerRevision: normalized.timerRevision,
    elapsedMs: normalized.elapsedMs,
    appliedRuleIds: normalized.appliedRuleIds,
    dqRuleId: normalized.dqRuleId,
    revision: normalized.revision,
    authorizedAt: normalized.authorizedAt,
    authorizedBy: normalized.authorizedBy,
    calaReadyAt: normalized.calaReadyAt,
    calaReadyBy: normalized.calaReadyBy
  });
}

function createBrakeReviewStateUnsafe(context = {}, timestamp = null) {
  const now = iso(timestamp);
  return {
    contractVersion: BRAKE_REVIEW_CONTRACT_VERSION,
    phaseId: BRAKE_REVIEW_PHASE_ID,
    stage: BRAKE_REVIEW_STAGES.REVIEW,
    result: BRAKE_REVIEW_RESULTS.PENDING,
    tournamentId: clean(context.tournamentId),
    competitionId: clean(context.competitionId || "equipos_completo"),
    charreadaId: clean(context.charreadaId),
    teamId: clean(context.teamId),
    competitorId: clean(context.competitorId || context.participantId) || null,
    horseId: clean(context.horseId) || null,
    presenterName: clean(context.presenterName || context.participantName) || null,
    horseName: clean(context.horseName) || null,
    ruleProfileId: BRAKE_REVIEW_PROFILE.profileId,
    ruleProfileVersion: BRAKE_REVIEW_PROFILE.profileVersion,
    ruleProfileFingerprint: BRAKE_REVIEW_PROFILE.profileFingerprint,
    temporalPolicyId: BRAKE_REVIEW_TEMPORAL_POLICY.policyId,
    temporalPolicyVersion: BRAKE_REVIEW_TEMPORAL_POLICY.policyVersion,
    temporalPolicyFingerprint: BRAKE_REVIEW_TEMPORAL_POLICY.policyFingerprint,
    timerId: clean(context.timerId),
    timerRevision: 0,
    elapsedMs: 0,
    appliedRuleIds: [],
    manualRuleIds: [],
    temporalRuleIds: [],
    dqRuleId: null,
    revision: 0,
    commandIds: [],
    audit: [],
    createdAt: now,
    updatedAt: now,
    authorizedAt: null,
    authorizedBy: null,
    calaReadyAt: null,
    calaReadyBy: null
  };
}

function buildAuditEntry(input) {
  const rules = getBrakeReviewRules(input.catalog || {});
  const addedRuleIds = input.next.appliedRuleIds.filter((ruleId) => !input.current.appliedRuleIds.includes(ruleId));
  const removedRuleIds = input.current.appliedRuleIds.filter((ruleId) => !input.next.appliedRuleIds.includes(ruleId));
  const effectiveRuleId = input.ruleId || addedRuleIds.at(-1) || removedRuleIds.at(-1) || null;
  const effectiveRule = rules.find((rule) => clean(rule.ruleId || rule.id) === effectiveRuleId);
  return {
    auditVersion: "1.0.0",
    tournamentId: input.next.tournamentId,
    competitionId: input.next.competitionId,
    charreadaId: input.next.charreadaId,
    teamId: input.next.teamId,
    competitorId: input.next.competitorId,
    horseId: input.next.horseId,
    phaseId: input.next.phaseId,
    ruleProfileId: input.next.ruleProfileId,
    ruleProfileVersion: input.next.ruleProfileVersion,
    ruleProfileFingerprint: input.next.ruleProfileFingerprint,
    temporalPolicyId: input.next.temporalPolicyId,
    temporalPolicyVersion: input.next.temporalPolicyVersion,
    temporalPolicyFingerprint: input.next.temporalPolicyFingerprint,
    operation: input.action,
    result: "ACCEPTED",
    reason: "",
    commandId: input.commandId,
    idempotencyKey: input.commandId,
    ruleId: effectiveRuleId,
    ruleIdsApplied: addedRuleIds,
    ruleIdsRemoved: removedRuleIds,
    consequence: effectiveRuleId
      ? getBrakeReviewRuleConsequence(effectiveRule || { category: input.next.dqRuleId === effectiveRuleId ? "desc" : "infr" })
      : null,
    points: badPointTotal(input.next.appliedRuleIds, rules) - badPointTotal(input.current.appliedRuleIds, rules),
    dq: Boolean(input.next.dqRuleId),
    timerId: input.next.timerId,
    timerRevision: input.timerRevision,
    elapsedMs: input.elapsedMs,
    actor: input.actor,
    actorUid: input.actor.uid,
    actorRole: input.actor.role,
    source: clean(input.source || "scorer"),
    officialTimestamp: input.now,
    acceptedAt: input.now,
    fromRevision: input.current.revision,
    toRevision: input.next.revision
  };
}

function badPointTotal(ruleIds, rules) {
  const selected = new Set(ruleIds);
  return rules.reduce((total, rule) => {
    const ruleId = clean(rule.ruleId || rule.id);
    if (!selected.has(ruleId) || getBrakeReviewRuleConsequence(rule) === "DISQUALIFICATION") return total;
    return total + Number(rule.pts ?? rule.value ?? 0);
  }, 0);
}

function normalizeActor(actor = {}) {
  return {
    uid: clean(actor.uid || actor.id),
    role: clean(actor.role).toLowerCase(),
    name: clean(actor.name),
    clientId: clean(actor.clientId)
  };
}

function fail(reason, review) {
  return { ok: false, idempotent: false, reason, review };
}

function clean(value) {
  return String(value ?? "").trim();
}

function integer(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function iso(value = null) {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}
