export const EVENT_TYPES = Object.freeze({
  TOURNAMENT_CREATED: "TOURNAMENT_CREATED",
  CHARREADA_CREATED: "CHARREADA_CREATED",
  CHARREADA_STARTED: "CHARREADA_STARTED",
  CHARREADA_FINISHED: "CHARREADA_FINISHED",
  SCORE_PUBLISHED: "SCORE_PUBLISHED",
  TEAM_FINISHED: "TEAM_FINISHED",
  BACKUP_CREATED: "BACKUP_CREATED",
  RECOVERY_STATUS_CHANGED: "RECOVERY_STATUS_CHANGED"
});

export const EVENT_CATEGORIES = Object.freeze({
  SYSTEM: "SYSTEM",
  RECOVERY: "RECOVERY",
  SCORING: "SCORING",
  PROGRAM: "PROGRAM",
  PRODUCTION: "PRODUCTION",
  PUBLIC: "PUBLIC",
  STATISTICS: "STATISTICS",
  AUDIT: "AUDIT"
});

const EVENT_CATEGORY_BY_TYPE = Object.freeze({
  [EVENT_TYPES.BACKUP_CREATED]: EVENT_CATEGORIES.RECOVERY,
  [EVENT_TYPES.RECOVERY_STATUS_CHANGED]: EVENT_CATEGORIES.RECOVERY,
  [EVENT_TYPES.SCORE_PUBLISHED]: EVENT_CATEGORIES.SCORING,
  [EVENT_TYPES.CHARREADA_CREATED]: EVENT_CATEGORIES.PROGRAM,
  [EVENT_TYPES.CHARREADA_STARTED]: EVENT_CATEGORIES.PROGRAM,
  [EVENT_TYPES.CHARREADA_FINISHED]: EVENT_CATEGORIES.PROGRAM,
  [EVENT_TYPES.TOURNAMENT_CREATED]: EVENT_CATEGORIES.SYSTEM,
  [EVENT_TYPES.TEAM_FINISHED]: EVENT_CATEGORIES.SCORING
});

const eventStore = [];
let eventSequence = 0;

export function buildEvent(type, payload = {}, options = {}) {
  return normalizeEvent({
    type,
    category: options.category || "",
    tournamentId: options.tournamentId ?? payload?.tournamentId ?? "",
    charreadaId: options.charreadaId ?? payload?.charreadaId ?? "",
    teamId: options.teamId ?? payload?.teamId ?? "",
    suerteId: options.suerteId ?? payload?.suerteId ?? "",
    phase: options.phase ?? payload?.phase ?? "",
    source: options.source || payload?.source || "system",
    actor: options.actor ?? null,
    payload
  });
}

export function registerEvent(event = {}) {
  const normalized = normalizeEvent(event);
  if (!normalized) {
    console.warn("[event-engine] rejected event without type");
    return null;
  }

  const registered = {
    ...normalized,
    sequence: nextEventSequence()
  };
  eventStore.push(registered);
  console.info("[event-engine] registered", {
    eventId: registered.eventId,
    type: registered.type,
    category: registered.category,
    tournamentId: registered.tournamentId
  });
  console.info("[event-engine] sequence", registered.sequence);
  console.info("[event-engine] total events", eventStore.length);
  return cloneEvent(registered);
}

export function getEvents(filter = {}) {
  return eventStore
    .filter((event) => eventMatchesFilter(event, filter))
    .map(cloneEvent);
}

export function clearEvents() {
  eventStore.length = 0;
  eventSequence = 0;
  console.info("[event-engine] cleared");
  console.info("[event-engine] sequence", eventSequence);
  console.info("[event-engine] total events", eventStore.length);
}

export function normalizeEvent(event = {}) {
  const type = String(event?.type || "").trim();
  if (!type) return null;

  return {
    eventId: String(event.eventId || event.id || createEventId()),
    sequence: normalizeSequence(event.sequence),
    timestamp: String(event.timestamp || new Date().toISOString()),
    type,
    category: normalizeCategory(event.category || inferEventCategory(type)),
    tournamentId: String(event.tournamentId || ""),
    charreadaId: String(event.charreadaId || ""),
    teamId: String(event.teamId || ""),
    suerteId: String(event.suerteId || ""),
    phase: String(event.phase || ""),
    source: String(event.source || "system"),
    actor: normalizeActor(event.actor),
    payload: clonePayload(event.payload || {})
  };
}

function eventMatchesFilter(event = {}, filter = {}) {
  return ["type", "category", "tournamentId", "charreadaId", "teamId", "suerteId", "source"]
    .every((key) => filter[key] === undefined || String(event[key] || "") === String(filter[key] || ""));
}

function inferEventCategory(type = "") {
  return EVENT_CATEGORY_BY_TYPE[type] || EVENT_CATEGORIES.SYSTEM;
}

function normalizeCategory(category = "") {
  const cleanCategory = String(category || "").trim();
  return Object.values(EVENT_CATEGORIES).includes(cleanCategory) ? cleanCategory : EVENT_CATEGORIES.SYSTEM;
}

function normalizeActor(actor = null) {
  if (!actor || typeof actor !== "object") return null;
  return {
    userId: String(actor.userId || actor.uid || actor.id || ""),
    name: String(actor.name || ""),
    role: String(actor.role || "")
  };
}

function normalizeSequence(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function nextEventSequence() {
  eventSequence += 1;
  return eventSequence;
}

function createEventId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneEvent(event = {}) {
  return {
    ...event,
    actor: event.actor ? { ...event.actor } : null,
    payload: clonePayload(event.payload || {})
  };
}

function clonePayload(payload = {}) {
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return {};
  }
}
