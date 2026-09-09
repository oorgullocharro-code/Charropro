const EVENT_PRESENTATION = Object.freeze({
  SCORE: { label: "Puntuación publicada", tone: "score" },
  CORRECTION: { label: "Corrección oficial", tone: "correction" },
  START: { label: "Inicio", tone: "status" },
  END: { label: "Cierre", tone: "status" },
  TEAM_CHANGE: { label: "Cambio de equipo", tone: "status" },
  CHARREADA_CHANGE: { label: "Cambio de charreada", tone: "status" },
  STATUS: { label: "Estado actualizado", tone: "status" },
  INFORMATION: { label: "Información", tone: "information" }
});

export function createPortalV2LiveTimelineModel(snapshot, options = {}) {
  const lifecycleStatus = text(options.lifecycleStatus).toUpperCase();
  const connection = text(options.connection || "connecting");
  const live = displayLive(snapshot.live, lifecycleStatus);
  const timeline = displayTimeline(snapshot.timeline?.items);
  const results = currentScope(options.results, live.currentCharreadaId);
  const standings = currentScope(options.standings, live.currentCharreadaId);
  return Object.freeze({
    live,
    timeline,
    timelineState: timeline.length ? connection === "stale" ? "timeline-stale" : "timeline-available" : "timeline-empty",
    currentResults: Object.freeze(results),
    currentStandings: Object.freeze(standings),
    progressTracking: "not-available-in-v3"
  });
}

function displayLive(value = {}, lifecycleStatus) {
  const source = value && typeof value === "object" ? value : {};
  return Object.freeze({
    status: text(source.status),
    lifecycleStatus,
    isLive: lifecycleStatus === "LIVE",
    currentCharreadaId: text(source.currentCharreada),
    currentCharreada: publicContextLabel(source.currentCharreada),
    currentTeam: text(source.currentTeam),
    currentParticipant: text(source.currentParticipant),
    currentSuerte: text(source.currentSuerte),
    currentScore: directNumber(source.currentScore),
    updatedAt: text(source.updatedAt),
    hasCurrentAction: Boolean(text(source.currentTeam) || text(source.currentParticipant) || text(source.currentSuerte) || directNumber(source.currentScore) !== null)
  });
}

function displayTimeline(source) {
  const byId = new Map();
  for (const item of Array.isArray(source) ? source : []) {
    const event = displayEvent(item);
    if (event.eventId && !byId.has(event.eventId)) byId.set(event.eventId, event);
  }
  return Object.freeze([...byId.values()].sort((left, right) => right.sequence - left.sequence));
}

function displayEvent(value = {}) {
  const type = text(value.type).toUpperCase();
  const presentation = EVENT_PRESENTATION[type] || { label: "Actualización pública", tone: "information" };
  const previousScore = directNumber(value.previousScore);
  const score = directNumber(value.score);
  return Object.freeze({
    eventId: text(value.eventId),
    sequence: directInteger(value.sequence),
    occurredAt: text(value.occurredAt),
    type,
    typeLabel: presentation.label,
    tone: presentation.tone,
    label: text(value.label) || presentation.label,
    score,
    previousScore,
    status: text(value.status),
    correction: type === "CORRECTION" && previousScore !== null && score !== null
      ? Object.freeze({ previousScore, score })
      : null
  });
}

function currentScope(items, currentCharreada) {
  if (!currentCharreada) return [];
  return (Array.isArray(items) ? items : []).filter((item) => item.charreadaId === currentCharreada);
}

function directNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function directInteger(value) {
  return Number.isSafeInteger(value) ? value : 0;
}

function text(value) {
  return String(value || "").trim();
}

function publicContextLabel(value) {
  const label = text(value);
  return /^(?:charreada|torneo|tournament|equipo|team|participant)[_:-]/i.test(label) ? "" : label;
}
