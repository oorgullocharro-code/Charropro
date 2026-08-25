import assert from "node:assert/strict";
import {
  PUBLIC_LIVE_FEED_EVENT_TYPES,
  PUBLIC_LIVE_FEED_MAX_EVENTS,
  buildPublicLiveFeed,
  listPublicLiveFeedEvents,
  mergePublicLiveFeeds,
  normalizePublicLiveFeedEvent,
  validatePublicLiveFeed
} from "../js/public/publicLiveFeed.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import { buildPublicProjection, reconcilePublicProjection } from "../js/public/publicProjection.js?v=20260825-official-timer-lifecycle-sync-001-v1";
import { validatePublicProjection } from "../js/public/publicProjectionSchema.js?v=20260825-official-timer-lifecycle-sync-001-v1";

const source = {
  publishedScores: {
    score_a: scoreRecord({ id: "score_a", publishedAt: 1000, score: 0, sequence: 10 }),
    score_b: scoreRecord({ id: "score_b", publishedAt: 2000, score: 26, sequence: 11, penalty: -2 })
  },
  publicLiveFeed: {
    status: "live",
    current: { teamId: "team-a", suerteId: "manganas_pie", attemptNumber: 0 },
    items: {
      turn: event({ eventId: "turn", sequence: 9, eventType: "team_turn_started", publishedAt: 900 }),
      unknown: event({ eventId: "unknown", sequence: 12, eventType: "not_allowed", publishedAt: 2100 })
    }
  }
};
const original = structuredClone(source);
const feed = buildPublicLiveFeed(source, {
  active: { competitionId: "competition-a", charreadaId: "charreada-a" },
  turn: { team: { id: "team-a" }, suerteId: "manganas_pie" },
  sourceUpdatedAt: "2026-07-27T12:00:00.000Z",
  status: "live"
});
feed.revision = 1;

assert.deepEqual(source, original, "builder does not mutate source");
assert.equal(validatePublicLiveFeed(feed).valid, true);
const events = listPublicLiveFeedEvents(feed);
assert.equal(events.some((item) => item.eventType === "not_allowed"), false);
assert.equal(events.find((item) => item.eventType === "score_published" && item.score === 0).score, 0);
assert.equal(events.filter((item) => item.eventType === "penalty_published").length, 1);
assert.equal(new Set(events.map((item) => item.sequence)).size, events.length);
assert.deepEqual(events.map((item) => item.sequence), [...events.map((item) => item.sequence)].sort((a, b) => b - a));

const correction = buildPublicLiveFeed({
  publishedScores: {
    score_b: scoreRecord({
      id: "score_b",
      publishedAt: 3000,
      score: 28,
      sequence: 12,
      revision: 2,
      correction: true
    })
  }
}, { status: "live", sourceUpdatedAt: 3000 });
correction.revision = 2;
const merged = mergePublicLiveFeeds(feed, correction);
merged.revision = 2;
assert.equal(validatePublicLiveFeed(merged).valid, true);
assert.equal(listPublicLiveFeedEvents(merged).some((item) => item.eventType === "score_published"), true);
assert.equal(listPublicLiveFeedEvents(merged).some((item) => item.eventType === "score_corrected"), true);
assert.equal(
  listPublicLiveFeedEvents(mergePublicLiveFeeds(merged, correction)).length,
  listPublicLiveFeedEvents(merged).length,
  "same publication is idempotent"
);

const duplicateRevision = {
  ...events[0],
  score: 99,
  revision: events[0].revision + 1
};
const canonical = mergePublicLiveFeeds(
  { revision: 1, status: "live", items: { [events[0].eventId]: events[0] } },
  { revision: 2, status: "live", items: { [events[0].eventId]: duplicateRevision } }
);
assert.equal(listPublicLiveFeedEvents(canonical)[0].score, 99);

assert.equal(normalizePublicLiveFeedEvent(event({ eventId: "<script>", sequence: -1 })), null);
assert.equal(normalizePublicLiveFeedEvent(event({ score: { value: 10 } })).score, undefined);
assert.equal(normalizePublicLiveFeedEvent(event({ eventType: "fake" })), null);
assert.equal(normalizePublicLiveFeedEvent(event({ occurredAt: Infinity })), null);
assert.equal(normalizePublicLiveFeedEvent(event({ publishedAt: Infinity })), null);
assert.equal(normalizePublicLiveFeedEvent(event({ sequence: Number.MAX_SAFE_INTEGER + 1 })), null);
assert.equal(normalizePublicLiveFeedEvent(event({ officialPosition: 1.5 })).officialPosition, undefined);
assert.equal(normalizePublicLiveFeedEvent(event({ participantId: "\"><svg onload=alert(1)>" })).participantId, undefined);
assert.equal(normalizePublicLiveFeedEvent(event({ teamId: "a".repeat(200) })).teamId.length, 120);
assert.equal(normalizePublicLiveFeedEvent(event({ score: 0 })).score, 0);
for (const dangerousKey of ["__proto__", "constructor", "prototype"]) {
  const dangerous = event();
  Object.defineProperty(dangerous, dangerousKey, {
    enumerable: true,
    configurable: true,
    value: { polluted: true }
  });
  assert.equal(normalizePublicLiveFeedEvent(dangerous), null);
}
const accessor = event();
Object.defineProperty(accessor, "score", { enumerable: true, get() { throw new Error("must not run"); } });
assert.equal(normalizePublicLiveFeedEvent(accessor), null);

const many = {};
for (let index = 1; index <= 260; index += 1) {
  many[`event_${index}`] = event({ eventId: `event_${index}`, sequence: index, publishedAt: index });
}
const limited = buildPublicLiveFeed({ publicLiveFeed: { status: "live", items: many } });
assert.equal(Object.keys(limited.items).length, PUBLIC_LIVE_FEED_MAX_EVENTS);
assert.equal(listPublicLiveFeedEvents(limited)[0].sequence, 260);

const activeWithItems = buildPublicLiveFeed({
  publicLiveFeed: {
    status: "empty",
    items: { score: event({ eventId: "score", sequence: 1 }) }
  }
}, {
  active: { competitionId: "competition-a", charreadaId: "charreada-a" },
  status: "live"
});
assert.equal(activeWithItems.status, "live", "active context and items cannot remain empty");

const activeWithoutItems = buildPublicLiveFeed({}, {
  active: { competitionId: "competition-a", charreadaId: "charreada-a" },
  status: "live"
});
assert.equal(activeWithoutItems.status, "live", "active context without items remains live");

const historicalItems = buildPublicLiveFeed({
  publicLiveFeed: {
    status: "empty",
    items: { score: event({ eventId: "score", sequence: 1 }) }
  }
});
assert.equal(historicalItems.status, "ready", "events without active context are not empty");
assert.equal(buildPublicLiveFeed({}).status, "empty");
assert.equal(buildPublicLiveFeed({ publicLiveFeed: { status: "unavailable" } }).status, "unavailable");

const outOfOrder = buildPublicLiveFeed({
  publicLiveFeed: {
    status: "finished",
    items: {
      late: event({ eventId: "late", sequence: 2, occurredAt: 500, publishedAt: 3000 }),
      first: event({ eventId: "first", sequence: 1, occurredAt: 1000, publishedAt: 1000 }),
      current: event({ eventId: "current", sequence: 3, occurredAt: 2000, publishedAt: 2000 })
    }
  }
});
assert.equal(outOfOrder.status, "finished");
assert.deepEqual(listPublicLiveFeedEvents(outOfOrder).map((item) => item.eventId), ["current", "late", "first"]);
assert.equal(new Set(PUBLIC_LIVE_FEED_EVENT_TYPES).size, PUBLIC_LIVE_FEED_EVENT_TYPES.length);

const projectedSource = {
  tournament: {
    info: { id: "feed-tournament", nombre: "Torneo Feed", type: "completo" },
    meta: { updatedAt: "2026-07-27T12:00:00.000Z", activeCharreadaId: "charreada-a" },
    teams: [{ id: "team-a", name: "Rancho Norte" }],
    charreadas: [{
      id: "charreada-a",
      name: "Charreada 1",
      competitionId: "competition-a",
      competitionType: "equipos_completo",
      teamIds: ["team-a"],
      suerteIds: ["cala"]
    }],
    publishedScores: {
      score_a: {
        ...scoreRecord({ id: "score_a", publishedAt: "2026-07-27T11:59:00.000Z", score: 35 }),
        total: 280,
        attempt: { total: 35 }
      }
    }
  },
  liveCurrent: {
    tournament: { id: "feed-tournament" },
    charreada: { id: "charreada-a" },
    turn: { team: { id: "team-a", name: "Rancho Norte" }, suerteId: "cala" },
    timestamp: "2026-07-27T12:00:00.000Z"
  }
};
const initial = reconcilePublicProjection(
  null,
  buildPublicProjection(projectedSource, { tournamentId: "feed-tournament", nowMs: Date.parse("2026-07-27T12:00:00.000Z") })
);
assert.equal(initial.ok, true);
const projectedScore = listPublicLiveFeedEvents(initial.projection.liveFeed).find((item) => item.eventType === "score_published");
assert.equal(projectedScore.score, 35, "feed uses official attempt precedence and never exposes anomalous Cala 280");
const previousV2 = structuredClone(initial.projection);
delete previousV2.liveFeed;
assert.equal(validatePublicProjection(previousV2).valid, true, "previous schema v2 without liveFeed remains readable");

console.log("public-live-feed.test.mjs: ok");

function scoreRecord(overrides = {}) {
  return {
    id: "score",
    published: true,
    publishedAt: 1000,
    occurredAt: 900,
    revision: 1,
    competitionId: "competition-a",
    charreadaId: "charreada-a",
    teamId: "team-a",
    suerteId: "manganas_pie",
    attemptNumber: 1,
    attempt: { total: overrides.score ?? 10 },
    teamPenaltyTotal: overrides.penalty ?? 0,
    ...overrides
  };
}

function event(overrides = {}) {
  return {
    eventId: "event",
    sequence: 1,
    eventType: "score_published",
    occurredAt: overrides.publishedAt ?? 1000,
    publishedAt: 1000,
    status: "official",
    revision: 1,
    teamId: "team-a",
    suerteId: "cala",
    score: 10,
    ...overrides
  };
}
