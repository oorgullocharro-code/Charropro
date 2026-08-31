import { listPublicLiveFeedEvents } from "../public/publicLiveFeed.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";
import { buildPublicLiveFeedMessage } from "./liveFeedTemplates.js?v=20260830-grafico-cronometro-obs-responsive-layout-001-v1";

export const PUBLIC_LIVE_FEED_FILTERS = Object.freeze(["all", "score", "turn", "penalty", "timer"]);
export const PUBLIC_LIVE_FEED_RENDER_LIMIT = 50;
export const PUBLIC_LIVE_FEED_STALE_MS = 60000;
export const PUBLIC_LIVE_FEED_CRITICAL_STALE_MS = 180000;

const FILTER_TYPES = Object.freeze({
  score: new Set(["score_published", "score_corrected", "official_total_updated", "official_position_changed"]),
  turn: new Set(["team_turn_started", "team_turn_finished", "participant_started", "participant_finished"]),
  penalty: new Set(["penalty_published", "competition_paused", "competition_resumed", "live_status_changed"]),
  timer: new Set(["timer_started", "timer_paused", "timer_resumed", "timer_finished"])
});

export function buildPublicLiveFeedModel(feed = {}, context = {}, options = {}) {
  const filter = sanitizePublicLiveFeedFilter(options.filter);
  const lookups = buildLookups(context);
  const normalized = listPublicLiveFeedEvents(feed);
  const selected = filter === "all"
    ? normalized
    : normalized.filter((event) => FILTER_TYPES[filter]?.has(event.eventType));
  const items = selected
    .slice(0, positiveInteger(options.limit, PUBLIC_LIVE_FEED_RENDER_LIMIT))
    .map((event) => presentEvent(event, lookups))
    .filter(Boolean);
  const updatedAt = timestamp(feed.updatedAt);
  const nowMs = timestamp(options.nowMs) || Date.now();
  return {
    revision: nonNegativeInteger(feed.revision),
    status: text(feed.status) || "empty",
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : "",
    freshness: resolveFreshness(updatedAt, nowMs, options.connection, context.live?.status),
    filter,
    totalCount: normalized.length,
    filteredCount: selected.length,
    items,
    current: normalizeCurrent(feed.current),
    diagnostics: {
      omittedUnknown: Math.max(0, sourceItemCount(feed.items) - normalized.length),
      retained: normalized.length
    }
  };
}

export function sanitizePublicLiveFeedFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PUBLIC_LIVE_FEED_FILTERS.includes(normalized) ? normalized : "all";
}

export function resolvePublicLiveFeedFilter(eventType) {
  for (const [filter, types] of Object.entries(FILTER_TYPES)) {
    if (types.has(eventType)) return filter;
  }
  return "all";
}

function presentEvent(event, lookups) {
  const labels = {
    teamName: lookup(lookups.teams, event.teamId),
    participantName: lookup(lookups.participants, event.participantId),
    suerteName: suerteLabel(event.suerteId)
  };
  const message = buildPublicLiveFeedMessage(event, labels);
  if (!message) return null;
  return {
    ...event,
    ...message,
    teamName: labels.teamName,
    participantName: labels.participantName,
    suerteName: labels.suerteName,
    filter: resolvePublicLiveFeedFilter(event.eventType)
  };
}

function buildLookups(context) {
  const teams = new Map();
  const participants = new Map();
  for (const result of context.results || []) {
    if (result.teamId && result.teamName) teams.set(result.teamId, result.teamName);
    if (result.participantId && result.participantName) participants.set(result.participantId, result.participantName);
  }
  for (const item of context.program || []) {
    for (const participant of item.participants || []) {
      if (!participant.id || !participant.name) continue;
      if (item.competitionScope === "individual") participants.set(participant.id, participant.name);
      else teams.set(participant.id, participant.name);
    }
  }
  const turn = context.live?.turn || {};
  if (turn.team?.id && turn.team?.name) teams.set(turn.team.id, turn.team.name);
  if (turn.participant?.id && turn.participant?.name) participants.set(turn.participant.id, turn.participant.name);
  return { teams, participants };
}

function resolveFreshness(updatedAt, nowMs, connection, liveStatus) {
  if (["offline", "error", "reconnecting"].includes(connection)) return "offline";
  if (!updatedAt || !["live", "paused", "prepared"].includes(String(liveStatus || "").toLowerCase())) return "current";
  const age = Math.max(0, nowMs - updatedAt);
  if (age >= PUBLIC_LIVE_FEED_CRITICAL_STALE_MS) return "stale-important";
  if (age >= PUBLIC_LIVE_FEED_STALE_MS) return "stale";
  return "current";
}

function normalizeCurrent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const key of [
    "competitionId", "charreadaId", "categoryId", "phaseId", "teamId",
    "participantId", "suerteId", "phase", "timerState"
  ]) {
    const clean = text(value[key]);
    if (clean) output[key] = clean;
  }
  if (Number.isSafeInteger(value.attemptNumber) && value.attemptNumber >= 0) {
    output.attemptNumber = value.attemptNumber;
  }
  return output;
}

function suerteLabel(value) {
  const labels = {
    cala: "Cala de caballo",
    piales: "Piales en el lienzo",
    colas: "Colas",
    toro: "Jineteo de toro",
    terna: "Terna en el ruedo",
    yegua: "Jineteo de yegua",
    manganas_pie: "Manganas a pie",
    manganas_caballo: "Manganas a caballo",
    paso: "Paso de la muerte"
  };
  return labels[value] || text(value);
}

function lookup(map, key) {
  return key ? text(map.get(key)) : "";
}

function sourceItemCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function timestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[<>]/g, "").slice(0, 400);
}
