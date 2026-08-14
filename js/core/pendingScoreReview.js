export const PENDING_SCORE_REVIEW_VERSION = "1.0.0";
export const PENDING_SCORE_REVIEW_STATUSES = Object.freeze({
  PENDING: "pending_review",
  RESOLVED: "resolved"
});

const MAX_DEPTH = 14;
const MAX_ARRAY_LENGTH = 500;
const MAX_STRING_LENGTH = 4000;
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function safeClone(value, depth = 0, seen = new WeakSet()) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
    return Number.isFinite(value) || typeof value !== "number" ? value : null;
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
  if (depth >= MAX_DEPTH || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    const clone = value.slice(0, MAX_ARRAY_LENGTH)
      .map((item) => safeClone(item, depth + 1, seen))
      .filter((item) => item !== undefined);
    seen.delete(value);
    return clone;
  }
  const clone = {};
  Object.keys(value).forEach((key) => {
    if (BLOCKED_KEYS.has(key)) return;
    const item = safeClone(value[key], depth + 1, seen);
    if (item !== undefined) clone[key] = item;
  });
  seen.delete(value);
  return clone;
}

function cleanId(value, fallback = "") {
  const clean = String(value ?? "").trim().replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return clean.slice(0, 180) || fallback;
}

function cleanText(value, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanActor(actor = {}) {
  return {
    uid: cleanText(actor.uid || actor.id, 160),
    name: cleanText(actor.name || actor.email, 180),
    role: cleanText(actor.role, 40),
    clientId: cleanText(actor.clientId, 160),
    tabSessionId: cleanText(actor.tabSessionId, 160)
  };
}

function stableHash(value = "") {
  let hash = 2166136261;
  const source = String(value);
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeIndex(value) {
  const numeric = Number(value || 0);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : 0;
}

export function buildPendingScoreAttemptKey(identity = {}) {
  return [
    cleanId(identity.tournamentId, "tournament"),
    cleanId(identity.competitionId, "competition"),
    cleanId(identity.charreadaId, "charreada"),
    cleanId(identity.participantId || identity.teamId, "entry"),
    cleanId(identity.suerteId, "suerte"),
    normalizeIndex(identity.coleadorIndex),
    normalizeIndex(identity.attemptIndex),
    cleanId(identity.sharedOpportunityId, "none")
  ].join("::");
}

export function buildPendingScoreReviewId(identity = {}) {
  const attemptKey = buildPendingScoreAttemptKey(identity);
  const hint = [identity.charreadaId, identity.suerteId, identity.participantId || identity.teamId]
    .map((value) => cleanId(value))
    .filter(Boolean)
    .join("_")
    .slice(0, 100);
  return `pending_${hint || "attempt"}_${stableHash(attemptKey)}`;
}

export function buildScorerReturnContext(context = {}) {
  return {
    tournamentId: cleanText(context.tournamentId, 180),
    competitionId: cleanText(context.competitionId, 180),
    charreadaId: cleanText(context.charreadaId, 180),
    teamId: cleanText(context.teamId, 180),
    participantId: cleanText(context.participantId, 180),
    suerteId: cleanText(context.suerteId, 100),
    scoringTeamIdx: normalizeIndex(context.scoringTeamIdx ?? context.teamIndex),
    scoringSuerteIdx: normalizeIndex(context.scoringSuerteIdx ?? context.suerteIndex),
    scoringAttemptIdx: normalizeIndex(context.scoringAttemptIdx ?? context.attemptIndex),
    scoringColeadorIdx: normalizeIndex(context.scoringColeadorIdx ?? context.coleadorIndex),
    sharedOpportunityId: cleanText(context.sharedOpportunityId, 240),
    sharedSequenceNumber: normalizeIndex(context.sharedSequenceNumber),
    returnDraft: context.returnDraft ? safeClone(context.returnDraft) : null,
    view: cleanText(context.view || "scoring", 40) || "scoring"
  };
}

function normalizeReason(reason = {}) {
  if (typeof reason === "string") return { code: "other", label: cleanText(reason), note: "" };
  return {
    code: cleanId(reason.code || "other", "other").toLowerCase(),
    label: cleanText(reason.label, 120),
    note: cleanText(reason.note, 500)
  };
}

function appendAudit(record, operation, actor, at, detail = {}) {
  const audit = Array.isArray(record.audit) ? safeClone(record.audit) : [];
  audit.push({ operation, at, actor: cleanActor(actor), ...safeClone(detail) });
  return audit.slice(-100);
}

export function createPendingScoreReview(definition = {}, options = {}) {
  const now = options.now || new Date().toISOString();
  const actor = cleanActor(options.actor || definition.createdBy);
  const identity = {
    tournamentId: cleanText(definition.tournamentId, 180),
    competitionId: cleanText(definition.competitionId, 180),
    charreadaId: cleanText(definition.charreadaId, 180),
    teamId: cleanText(definition.teamId, 180),
    participantId: cleanText(definition.participantId, 180),
    suerteId: cleanText(definition.suerteId, 100),
    attemptIndex: normalizeIndex(definition.attemptIndex),
    coleadorIndex: normalizeIndex(definition.coleadorIndex),
    sharedOpportunityId: cleanText(definition.sharedOpportunityId, 240),
    sharedSequenceNumber: normalizeIndex(definition.sharedSequenceNumber)
  };
  const attemptKey = buildPendingScoreAttemptKey(identity);
  const pendingId = cleanId(definition.pendingId) || buildPendingScoreReviewId(identity);
  return normalizePendingScoreReview({
    pendingReviewVersion: PENDING_SCORE_REVIEW_VERSION,
    pendingId,
    attemptKey,
    idempotencyKey: cleanText(definition.idempotencyKey || `pending-review:${attemptKey}`, 300),
    ...identity,
    scoreId: cleanText(definition.scoreId, 300),
    participantScope: definition.participantScope === "individual" ? "individual" : "team",
    status: PENDING_SCORE_REVIEW_STATUSES.PENDING,
    reason: normalizeReason(definition.reason),
    draftSnapshot: safeClone(definition.draftSnapshot || {}),
    metadata: safeClone(definition.metadata || {}),
    returnContext: null,
    resolutionSession: null,
    officialScore: null,
    revision: 1,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
    resolvedAt: null,
    resolvedBy: null,
    audit: [{ operation: "created", at: now, actor }]
  });
}

export function normalizePendingScoreReview(record = {}) {
  const normalized = safeClone(record) || {};
  const status = Object.values(PENDING_SCORE_REVIEW_STATUSES).includes(normalized.status)
    ? normalized.status
    : PENDING_SCORE_REVIEW_STATUSES.PENDING;
  return {
    ...normalized,
    pendingReviewVersion: PENDING_SCORE_REVIEW_VERSION,
    pendingId: cleanId(normalized.pendingId),
    attemptKey: cleanText(normalized.attemptKey, 500),
    idempotencyKey: cleanText(normalized.idempotencyKey, 500),
    tournamentId: cleanText(normalized.tournamentId, 180),
    competitionId: cleanText(normalized.competitionId, 180),
    charreadaId: cleanText(normalized.charreadaId, 180),
    teamId: cleanText(normalized.teamId, 180),
    participantId: cleanText(normalized.participantId, 180),
    suerteId: cleanText(normalized.suerteId, 100),
    attemptIndex: normalizeIndex(normalized.attemptIndex),
    coleadorIndex: normalizeIndex(normalized.coleadorIndex),
    sharedOpportunityId: cleanText(normalized.sharedOpportunityId, 240),
    sharedSequenceNumber: normalizeIndex(normalized.sharedSequenceNumber),
    scoreId: cleanText(normalized.scoreId, 300),
    participantScope: normalized.participantScope === "individual" ? "individual" : "team",
    status,
    reason: normalizeReason(normalized.reason),
    draftSnapshot: safeClone(normalized.draftSnapshot || {}),
    metadata: safeClone(normalized.metadata || {}),
    returnContext: normalized.returnContext ? buildScorerReturnContext(normalized.returnContext) : null,
    resolutionSession: normalized.resolutionSession ? safeClone(normalized.resolutionSession) : null,
    officialScore: normalized.officialScore ? safeClone(normalized.officialScore) : null,
    revision: Math.max(1, Math.trunc(Number(normalized.revision || 1))),
    createdAt: cleanText(normalized.createdAt, 40),
    createdBy: cleanActor(normalized.createdBy),
    updatedAt: cleanText(normalized.updatedAt || normalized.createdAt, 40),
    updatedBy: cleanActor(normalized.updatedBy || normalized.createdBy),
    resolvedAt: normalized.resolvedAt ? cleanText(normalized.resolvedAt, 40) : null,
    resolvedBy: normalized.resolvedBy ? cleanActor(normalized.resolvedBy) : null,
    audit: Array.isArray(normalized.audit) ? safeClone(normalized.audit).slice(-100) : []
  };
}

export function validatePendingScoreReview(record = {}) {
  const normalized = normalizePendingScoreReview(record);
  const errors = [];
  ["pendingId", "attemptKey", "tournamentId", "charreadaId", "suerteId", "scoreId"].forEach((field) => {
    if (!normalized[field]) errors.push(`missing-${field}`);
  });
  if (!normalized.teamId && !normalized.participantId) errors.push("missing-entry-id");
  if (!normalized.createdAt || !Number.isFinite(Date.parse(normalized.createdAt))) errors.push("invalid-createdAt");
  if (!normalized.updatedAt || !Number.isFinite(Date.parse(normalized.updatedAt))) errors.push("invalid-updatedAt");
  if (!normalized.createdBy.uid) errors.push("missing-createdBy");
  if (normalized.status === PENDING_SCORE_REVIEW_STATUSES.RESOLVED && !normalized.officialScore?.id) {
    errors.push("missing-official-score");
  }
  return { valid: errors.length === 0, errors, record: normalized };
}

export function normalizePendingScoreReviewRegistry(registry = {}) {
  const values = Array.isArray(registry) ? registry : Object.values(registry || {});
  return Object.fromEntries(values
    .map(normalizePendingScoreReview)
    .filter((record) => record.pendingId)
    .map((record) => [record.pendingId, record]));
}

export function reconcilePendingScoreReviewRegistries(localRegistry = {}, remoteRegistry = {}, options = {}) {
  const local = normalizePendingScoreReviewRegistry(localRegistry);
  const remote = normalizePendingScoreReviewRegistry(remoteRegistry);
  const reconciled = { ...local };

  Object.values(remote).forEach((remoteRecord) => {
    const localRecord = local[remoteRecord.pendingId];
    reconciled[remoteRecord.pendingId] = localRecord && localRecord.revision > remoteRecord.revision
      ? localRecord
      : remoteRecord;
  });

  return reconciled;
}

export function listPendingScoreReviews(registry = {}, filters = {}) {
  return Object.values(normalizePendingScoreReviewRegistry(registry))
    .filter((record) => !filters.tournamentId || record.tournamentId === filters.tournamentId)
    .filter((record) => !filters.charreadaId || record.charreadaId === filters.charreadaId)
    .filter((record) => !filters.status || record.status === filters.status)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)));
}

function transitionRecord(record, options, operation, mutate) {
  const current = normalizePendingScoreReview(record);
  const expectedRevision = Number(options.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision !== current.revision) {
    return { ok: false, conflict: true, reason: "pending-review-revision-conflict", record: current };
  }
  const now = options.now || new Date().toISOString();
  const actor = cleanActor(options.actor);
  const next = normalizePendingScoreReview(mutate({ ...current }, { now, actor }));
  next.revision = current.revision + 1;
  next.createdAt = current.createdAt;
  next.createdBy = current.createdBy;
  next.updatedAt = now;
  next.updatedBy = actor;
  next.audit = appendAudit(current, operation, actor, now, options.auditDetail || {});
  return { ok: true, record: next };
}

export function openPendingScoreReview(record, options = {}) {
  if (record?.status !== PENDING_SCORE_REVIEW_STATUSES.PENDING) {
    return { ok: false, reason: "pending-review-not-active", record: normalizePendingScoreReview(record) };
  }
  return transitionRecord(record, options, "opened", (next, { now, actor }) => ({
    ...next,
    returnContext: buildScorerReturnContext(options.returnContext),
    resolutionSession: {
      status: "open",
      openedAt: now,
      openedBy: actor,
      expectedRevision: Number(options.expectedRevision) + 1
    }
  }));
}

export function closePendingScoreReview(record, options = {}) {
  if (record?.status !== PENDING_SCORE_REVIEW_STATUSES.PENDING) {
    return { ok: false, reason: "pending-review-not-active", record: normalizePendingScoreReview(record) };
  }
  return transitionRecord(record, options, "closed", (next) => ({
    ...next,
    draftSnapshot: options.draftSnapshot ? safeClone(options.draftSnapshot) : next.draftSnapshot,
    returnContext: null,
    resolutionSession: null
  }));
}

export function updatePendingScoreReviewDraft(record, options = {}) {
  if (record?.status !== PENDING_SCORE_REVIEW_STATUSES.PENDING) {
    return { ok: false, reason: "pending-review-not-active", record: normalizePendingScoreReview(record) };
  }
  return transitionRecord(record, options, "draft_updated", (next) => ({
    ...next,
    draftSnapshot: safeClone(options.draftSnapshot || next.draftSnapshot)
  }));
}

export function resolvePendingScoreReview(record, options = {}) {
  if (record?.status === PENDING_SCORE_REVIEW_STATUSES.RESOLVED) {
    const normalized = normalizePendingScoreReview(record);
    const sameScore = normalized.officialScore?.id && normalized.officialScore.id === options.officialScore?.id;
    return sameScore
      ? { ok: true, idempotent: true, record: normalized }
      : { ok: false, conflict: true, reason: "pending-review-already-resolved", record: normalized };
  }
  return transitionRecord(record, options, "resolved", (next, { now, actor }) => ({
    ...next,
    status: PENDING_SCORE_REVIEW_STATUSES.RESOLVED,
    resolvedAt: now,
    resolvedBy: actor,
    officialScore: safeClone(options.officialScore || {}),
    resolutionSession: {
      ...(next.resolutionSession || {}),
      status: "resolved",
      resolvedAt: now,
      resolvedBy: actor
    }
  }));
}

export function putPendingScoreReview(registry = {}, record = {}) {
  const normalizedRegistry = normalizePendingScoreReviewRegistry(registry);
  const validation = validatePendingScoreReview(record);
  if (!validation.valid) return { ok: false, reason: "invalid-pending-review", errors: validation.errors, registry: normalizedRegistry };
  const current = normalizedRegistry[validation.record.pendingId];
  if (current && current.attemptKey !== validation.record.attemptKey) {
    return { ok: false, conflict: true, reason: "pending-review-id-conflict", registry: normalizedRegistry, record: current };
  }
  if (current && current.revision > validation.record.revision) {
    return { ok: false, conflict: true, reason: "pending-review-stale", registry: normalizedRegistry, record: current };
  }
  return {
    ok: true,
    registry: { ...normalizedRegistry, [validation.record.pendingId]: validation.record },
    record: validation.record,
    idempotent: Boolean(current && current.revision === validation.record.revision)
  };
}
