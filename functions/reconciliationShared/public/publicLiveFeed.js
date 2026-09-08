export const PUBLIC_LIVE_FEED_VERSION = "1.0.0";
export const PUBLIC_LIVE_FEED_MAX_EVENTS = 200;

export const PUBLIC_LIVE_FEED_EVENT_TYPES = Object.freeze([
  "competition_started",
  "competition_finished",
  "team_turn_started",
  "team_turn_finished",
  "participant_started",
  "participant_finished",
  "suerte_started",
  "suerte_finished",
  "attempt_started",
  "attempt_finished",
  "score_published",
  "penalty_published",
  "score_corrected",
  "official_total_updated",
  "official_position_changed",
  "timer_started",
  "timer_paused",
  "timer_resumed",
  "timer_finished",
  "competition_paused",
  "competition_resumed",
  "live_status_changed"
]);

export const PUBLIC_LIVE_FEED_OFFICIAL_EVENT_TYPES = Object.freeze([
  "score_published",
  "penalty_published",
  "score_corrected",
  "official_total_updated",
  "official_position_changed",
  "team_turn_finished",
  "participant_finished",
  "suerte_finished",
  "attempt_finished",
  "competition_finished"
]);

export const PUBLIC_LIVE_FEED_RUNNING_EVENT_TYPES = Object.freeze(
  PUBLIC_LIVE_FEED_EVENT_TYPES.filter((type) => !PUBLIC_LIVE_FEED_OFFICIAL_EVENT_TYPES.includes(type))
);

const EVENT_TYPE_SET = new Set(PUBLIC_LIVE_FEED_EVENT_TYPES);
const OFFICIAL_TYPE_SET = new Set(PUBLIC_LIVE_FEED_OFFICIAL_EVENT_TYPES);
const EVENT_ID_PATTERN = /^[A-Za-z0-9._:@-]{1,160}$/;
const REFERENCE_ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,120}$/;
const TIMER_STATES = new Set(["running", "paused", "finished", "stopped", "unavailable"]);
const EVENT_STATUSES = new Set([
  "official",
  "corrected",
  "in_progress",
  "paused",
  "finished",
  "published",
  "unavailable"
]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const EVENT_FIELDS = Object.freeze([
  "eventId",
  "sequence",
  "eventType",
  "occurredAt",
  "publishedAt",
  "competitionId",
  "charreadaId",
  "categoryId",
  "phaseId",
  "teamId",
  "participantId",
  "suerteId",
  "attemptNumber",
  "score",
  "penalty",
  "officialTotal",
  "officialPosition",
  "previousOfficialPosition",
  "timerState",
  "durationMs",
  "status",
  "revision"
]);
const CURRENT_FIELDS = Object.freeze([
  "competitionId",
  "charreadaId",
  "categoryId",
  "phaseId",
  "teamId",
  "participantId",
  "suerteId",
  "attemptNumber",
  "phase",
  "timerState"
]);

export function buildPublicLiveFeed(source = {}, context = {}, options = {}) {
  const maxEvents = positiveInteger(options.maxEvents, PUBLIC_LIVE_FEED_MAX_EVENTS);
  const sourceFeed = source.publicLiveFeed || source.liveFeed || {};
  const explicitFeed = normalizePublicLiveFeed(
    sourceFeed,
    { maxEvents }
  );
  const derivedEvents = derivePublishedScoreEvents(source.publishedScores);
  const current = normalizePublicLiveFeedCurrent({
    ...(explicitFeed.current || {}),
    competitionId: context.active?.competitionId || explicitFeed.current?.competitionId,
    charreadaId: context.active?.charreadaId || explicitFeed.current?.charreadaId,
    categoryId: context.active?.categoryId || explicitFeed.current?.categoryId,
    phaseId: context.active?.phaseId || explicitFeed.current?.phaseId,
    teamId: context.turn?.team?.id || explicitFeed.current?.teamId,
    participantId: context.turn?.participant?.id || explicitFeed.current?.participantId,
    suerteId: context.turn?.suerteId || explicitFeed.current?.suerteId,
    attemptNumber: readAttemptNumber(context.liveCurrent),
    phase: readLivePhase(context.liveCurrent),
    timerState: readTimerState(context.liveCurrent?.timer)
  });
  const items = mergePublicLiveFeedItems(explicitFeed.items, derivedEvents, { maxEvents });
  const updatedAt = latestTimestamp([
    explicitFeed.updatedAt,
    context.sourceUpdatedAt,
    ...Object.values(items).map((event) => event.publishedAt || event.occurredAt)
  ]);
  return {
    revision: 0,
    status: normalizeFeedStatus(
      sourceFeed.status,
      context.status,
      Object.keys(items).length,
      current
    ),
    updatedAt,
    current,
    items
  };
}

export function normalizePublicLiveFeed(input = {}, options = {}) {
  const maxEvents = positiveInteger(options.maxEvents, PUBLIC_LIVE_FEED_MAX_EVENTS);
  const sourceItems = collectionEntries(input?.items);
  const normalizedItems = [];
  for (const [sourceKey, value] of sourceItems) {
    const event = normalizePublicLiveFeedEvent(value, { sourceKey });
    if (event) normalizedItems.push(event);
  }
  const current = normalizePublicLiveFeedCurrent(input?.current);
  return {
    revision: nonNegativeInteger(input?.revision, 0),
    status: normalizeFeedStatus(input?.status, "", normalizedItems.length, current),
    updatedAt: timestampOrEmpty(input?.updatedAt),
    current,
    items: eventsToMap(selectCanonicalEvents(normalizedItems).slice(0, maxEvents))
  };
}

export function normalizePublicLiveFeedEvent(input, options = {}) {
  if (!isPlainRecord(input) || hasAccessor(input) || containsDangerousKey(input)) return null;
  const eventType = safeString(input.eventType, 60);
  if (!EVENT_TYPE_SET.has(eventType)) return null;
  const eventId = eventIdValue(input.eventId || options.sourceKey);
  const sequence = positiveInteger(input.sequence, null);
  const occurredAt = timestampNumber(input.occurredAt);
  const publishedAt = timestampNumber(input.publishedAt);
  const revision = positiveInteger(input.revision, 1);
  if (!eventId || sequence === null || !occurredAt || !publishedAt) return null;

  const event = {
    eventId,
    sequence,
    eventType,
    occurredAt,
    publishedAt,
    competitionId: referenceId(input.competitionId),
    charreadaId: referenceId(input.charreadaId),
    categoryId: referenceId(input.categoryId),
    phaseId: referenceId(input.phaseId),
    teamId: referenceId(input.teamId),
    participantId: referenceId(input.participantId),
    suerteId: referenceId(input.suerteId),
    attemptNumber: nonNegativeInteger(input.attemptNumber, null),
    score: finiteNumber(input.score),
    penalty: finiteNumber(input.penalty),
    officialTotal: finiteNumber(input.officialTotal),
    officialPosition: positiveInteger(input.officialPosition, null),
    previousOfficialPosition: positiveInteger(input.previousOfficialPosition, null),
    timerState: TIMER_STATES.has(input.timerState) ? input.timerState : null,
    durationMs: nonNegativeNumber(input.durationMs),
    status: EVENT_STATUSES.has(input.status)
      ? input.status
      : OFFICIAL_TYPE_SET.has(eventType) ? "official" : "in_progress",
    revision
  };
  return compactRecord(event);
}

export function normalizePublicLiveFeedCurrent(input = {}) {
  if (!isPlainRecord(input)) return {};
  return compactRecord({
    competitionId: referenceId(input.competitionId),
    charreadaId: referenceId(input.charreadaId),
    categoryId: referenceId(input.categoryId),
    phaseId: referenceId(input.phaseId),
    teamId: referenceId(input.teamId),
    participantId: referenceId(input.participantId),
    suerteId: referenceId(input.suerteId),
    attemptNumber: nonNegativeInteger(input.attemptNumber, null),
    phase: safeString(input.phase, 40),
    timerState: TIMER_STATES.has(input.timerState) ? input.timerState : null
  });
}

export function mergePublicLiveFeeds(previous = {}, candidate = {}, options = {}) {
  const maxEvents = positiveInteger(options.maxEvents, PUBLIC_LIVE_FEED_MAX_EVENTS);
  const previousFeed = normalizePublicLiveFeed(previous, { maxEvents });
  const nextFeed = normalizePublicLiveFeed(candidate, { maxEvents });
  const items = mergePublicLiveFeedItems(previousFeed.items, nextFeed.items, { maxEvents });
  return {
    revision: nextFeed.revision,
    status: nextFeed.status,
    updatedAt: latestTimestamp([
      previousFeed.updatedAt,
      nextFeed.updatedAt,
      ...Object.values(items).map((event) => event.publishedAt || event.occurredAt)
    ]),
    current: nextFeed.current,
    items
  };
}

export function validatePublicLiveFeed(input) {
  const errors = [];
  if (!isPlainRecord(input)) {
    return { valid: false, errors: ["liveFeed-object-required"], warnings: [] };
  }
  validateAllowedKeys(input, new Set(["revision", "status", "updatedAt", "current", "items"]), "liveFeed", errors);
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) errors.push("liveFeed-revision-invalid");
  if (!["empty", "ready", "live", "paused", "finished", "unavailable"].includes(input.status)) {
    errors.push("liveFeed-status-invalid");
  }
  if (input.updatedAt && !timestampNumber(input.updatedAt)) errors.push("liveFeed-updatedAt-invalid");
  if (!isPlainRecord(input.current)) errors.push("liveFeed-current-invalid");
  else validateAllowedKeys(input.current, new Set(CURRENT_FIELDS), "liveFeed.current", errors);
  if (!isPlainRecord(input.items)) {
    errors.push("liveFeed-items-invalid");
  } else {
    const entries = Object.entries(input.items);
    if (entries.length > PUBLIC_LIVE_FEED_MAX_EVENTS) errors.push("liveFeed-items-limit");
    const sequences = [];
    for (const [key, value] of entries) {
      if (!EVENT_ID_PATTERN.test(key)) errors.push(`liveFeed.items.${key}-key-invalid`);
      if (!isPlainRecord(value)) {
        errors.push(`liveFeed.items.${key}-invalid`);
        continue;
      }
      validateAllowedKeys(value, new Set(EVENT_FIELDS), `liveFeed.items.${key}`, errors);
      const normalized = normalizePublicLiveFeedEvent(value, { sourceKey: key });
      if (!normalized) errors.push(`liveFeed.items.${key}-event-invalid`);
      else {
        if (normalized.eventId !== key) errors.push(`liveFeed.items.${key}-id-mismatch`);
        sequences.push(normalized.sequence);
      }
    }
    if (new Set(sequences).size !== sequences.length) errors.push("liveFeed-sequence-duplicate");
  }
  if (containsDangerousKey(input)) errors.push("liveFeed-dangerous-key");
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [] };
}

export function listPublicLiveFeedEvents(feed = {}) {
  return selectCanonicalEvents(Object.values(normalizePublicLiveFeed(feed).items));
}

export function isPublicLiveFeedEventType(value) {
  return EVENT_TYPE_SET.has(String(value || ""));
}

function derivePublishedScoreEvents(value) {
  const records = collectionEntries(value)
    .filter(([, record]) => isPlainRecord(record) && record.draft !== true && record.published !== false)
    .map(([sourceKey, record]) => normalizePublishedRecord(record, sourceKey))
    .filter(Boolean)
    .sort(compareEventsAscending);
  const events = [];
  for (const record of records) {
    events.push(record.event);
    if (record.penalty !== null && record.penalty !== 0) {
      events.push(normalizePublicLiveFeedEvent({
        ...record.event,
        eventId: eventIdValue(`${record.event.eventId}:penalty`),
        sequence: record.event.sequence + 1,
        eventType: "penalty_published",
        penalty: record.penalty,
        score: null,
        status: "official"
      }));
    }
  }
  return events.filter(Boolean);
}

function normalizePublishedRecord(record, sourceKey) {
  const publishedAt = timestampNumber(record.publishedAt || record.timestamp || record.createdAt);
  if (!publishedAt) return null;
  const occurredAt = timestampNumber(
    record.occurredAt ||
    record.attempt?.occurredAt ||
    record.attempt?.timestamp ||
    record.createdAt ||
    publishedAt
  ) || publishedAt;
  const revision = positiveInteger(record.revision || record.correctionRevision, 1);
  const score = firstFinite([
    record.attempt?.total,
    record.attempt?.breakdown?.final,
    record.breakdown?.final,
    record.breakdown?.total,
    record.total,
    record.score,
    record.points
  ]);
  if (score === null) return null;
  const fingerprint = [
    safeString(record.id || sourceKey, 120),
    safeString(record.attemptKey, 120),
    revision,
    publishedAt
  ].join(":");
  const eventId = eventIdValue(`evt_score_${stableHash(fingerprint)}`);
  const attemptIndex = nonNegativeInteger(record.attemptIndex, null);
  const explicitSequence = positiveInteger(record.sequence, null);
  const event = normalizePublicLiveFeedEvent({
    eventId,
    sequence: explicitSequence === null ? publishedAt * 2 : explicitSequence * 2,
    eventType: record.correction === true || revision > 1 || record.superseded === true
      ? "score_corrected"
      : "score_published",
    occurredAt,
    publishedAt,
    competitionId: record.competitionId || record.competition?.id,
    charreadaId: record.charreadaId || record.charreada?.id,
    categoryId: record.categoryId || record.category?.id,
    phaseId: record.phaseId || record.phase?.id,
    teamId: record.teamId || record.team?.id,
    participantId: record.participantId || record.participant?.id || record.charro?.id,
    suerteId: normalizeSuerteId(record.suerteId || record.suerte?.id || record.suerte),
    attemptNumber: nonNegativeInteger(record.attemptNumber, attemptIndex === null ? null : attemptIndex + 1),
    score,
    penalty: firstFinite([record.teamPenaltyTotal, record.teamPenalty, record.penalty]),
    officialTotal: firstFinite([record.officialTotal, record.resultTotal]),
    officialPosition: positiveInteger(record.officialPosition, null),
    previousOfficialPosition: positiveInteger(record.previousOfficialPosition, null),
    status: record.correction === true || revision > 1 ? "corrected" : "official",
    revision
  });
  return event ? { event, penalty: event.penalty ?? null } : null;
}

function mergePublicLiveFeedItems(left, right, options = {}) {
  const maxEvents = positiveInteger(options.maxEvents, PUBLIC_LIVE_FEED_MAX_EVENTS);
  const candidates = [
    ...Object.values(normalizeItemsOnly(left)),
    ...Object.values(normalizeItemsOnly(right))
  ];
  return eventsToMap(selectCanonicalEvents(candidates).slice(0, maxEvents));
}

function normalizeItemsOnly(value) {
  const normalized = [];
  const entries = Array.isArray(value)
    ? collectionEntries(value)
    : isPlainRecord(value) && !("eventType" in value) ? collectionEntries(value) : [];
  for (const [sourceKey, event] of entries) {
    const clean = normalizePublicLiveFeedEvent(event, { sourceKey });
    if (clean) normalized.push(clean);
  }
  return eventsToMap(normalized);
}

function selectCanonicalEvents(events) {
  const byId = new Map();
  for (const value of events) {
    const event = normalizePublicLiveFeedEvent(value);
    if (!event) continue;
    const current = byId.get(event.eventId);
    if (!current || compareEventRevision(event, current) > 0) byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(compareEventsDescending);
}

function compareEventRevision(left, right) {
  return (
    left.revision - right.revision ||
    left.sequence - right.sequence ||
    left.publishedAt - right.publishedAt ||
    left.eventId.localeCompare(right.eventId)
  );
}

function compareEventsAscending(left, right) {
  return (
    left.event.sequence - right.event.sequence ||
    left.event.publishedAt - right.event.publishedAt ||
    left.event.occurredAt - right.event.occurredAt ||
    left.event.eventId.localeCompare(right.event.eventId)
  );
}

function compareEventsDescending(left, right) {
  return (
    right.sequence - left.sequence ||
    right.publishedAt - left.publishedAt ||
    right.occurredAt - left.occurredAt ||
    left.eventId.localeCompare(right.eventId)
  );
}

function eventsToMap(events) {
  const output = Object.create(null);
  for (const event of events) output[event.eventId] = event;
  return output;
}

function normalizeFeedStatus(primary, fallback, eventCount, current = {}) {
  const aliases = {
    active: "live",
    "en vivo": "live",
    programada: "ready",
    scheduled: "ready",
    completed: "finished",
    terminada: "finished",
    terminado: "finished"
  };
  const allowed = new Set(["empty", "ready", "live", "paused", "finished", "unavailable"]);
  const normalize = (value) => {
    const candidate = safeString(value, 40).toLowerCase();
    const normalized = aliases[candidate] || candidate;
    return allowed.has(normalized) ? normalized : "";
  };
  const primaryStatus = normalize(primary);
  const fallbackStatus = normalize(fallback);
  const candidate = primaryStatus && primaryStatus !== "empty"
    ? primaryStatus
    : fallbackStatus && fallbackStatus !== "empty"
      ? fallbackStatus
      : primaryStatus || fallbackStatus;
  const hasActiveContext = Boolean(current.competitionId || current.charreadaId);

  if (hasActiveContext) {
    if (["paused", "finished", "unavailable"].includes(candidate)) return candidate;
    return "live";
  }
  if (eventCount) {
    if (["paused", "finished", "unavailable"].includes(candidate)) return candidate;
    return "ready";
  }
  return candidate || "empty";
}

function readAttemptNumber(liveCurrent) {
  return nonNegativeInteger(
    liveCurrent?.attemptNumber ??
    liveCurrent?.attempt?.number ??
    liveCurrent?.turn?.attemptNumber,
    null
  );
}

function readLivePhase(liveCurrent) {
  const status = safeString(
    liveCurrent?.phase ||
    liveCurrent?.turn?.phase ||
    liveCurrent?.status,
    40
  ).toLowerCase();
  return status || "";
}

function readTimerState(timer) {
  if (!isPlainRecord(timer)) return null;
  if (timer.running === true) return "running";
  const state = safeString(timer.status || timer.state, 40).toLowerCase();
  return TIMER_STATES.has(state) ? state : timer.running === false ? "paused" : null;
}

function normalizeSuerteId(value) {
  const clean = safeString(value?.id || value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const aliases = {
    cc: "cala",
    p: "piales",
    c: "colas",
    jt: "toro",
    lc: "terna",
    pr: "terna",
    jy: "yegua",
    mp: "manganas_pie",
    mc: "manganas_caballo",
    pm: "paso"
  };
  return referenceId(aliases[clean] || clean);
}

function compactRecord(value) {
  const output = Object.create(null);
  for (const [key, entry] of Object.entries(value)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    if (entry === null || entry === undefined || entry === "") continue;
    output[key] = entry;
  }
  return output;
}

function validateAllowedKeys(value, allowed, prefix, errors) {
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) errors.push(`${prefix}.${key}-not-allowed`);
  }
}

function containsDangerousKey(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) continue;
    if (containsDangerousKey(descriptor.value, seen)) return true;
  }
  return false;
}

function hasAccessor(value, seen = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  if (depth > 12) return true;
  seen.add(value);
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) return true;
    if (hasAccessor(descriptor.value, seen, depth + 1)) return true;
  }
  return false;
}

function collectionEntries(value) {
  if (Array.isArray(value)) return value.map((entry, index) => [String(index), entry]).filter(([, entry]) => entry);
  if (isPlainRecord(value)) return Object.entries(value).filter(([, entry]) => entry);
  return [];
}

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function safeString(value, maxLength) {
  if (value === null || value === undefined) return "";
  if (!["string", "number", "boolean"].includes(typeof value)) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
}

function eventIdValue(value) {
  const clean = safeString(value, 160);
  return EVENT_ID_PATTERN.test(clean) ? clean : null;
}

function referenceId(value) {
  if (value === null || value === undefined || value === "") return null;
  const clean = safeString(value, 120);
  return REFERENCE_ID_PATTERN.test(clean) ? clean : null;
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (!["number", "string"].includes(typeof value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nonNegativeNumber(value) {
  const number = finiteNumber(value);
  return number !== null && number >= 0 ? number : null;
}

function nonNegativeInteger(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
}

function positiveInteger(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function timestampNumber(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.trunc(value);
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function timestampOrEmpty(value) {
  const timestamp = timestampNumber(value);
  return timestamp ? new Date(timestamp).toISOString() : "";
}

function latestTimestamp(values) {
  const timestamps = values.map(timestampNumber).filter(Boolean);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : "";
}

function firstFinite(values) {
  for (const value of values) {
    const number = finiteNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
