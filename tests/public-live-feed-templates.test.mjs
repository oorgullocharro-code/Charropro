import assert from "node:assert/strict";
import { PUBLIC_LIVE_FEED_EVENT_TYPES } from "../js/public/publicLiveFeed.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { buildPublicLiveFeedMessage } from "../js/publicPortal/liveFeedTemplates.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  buildPublicLiveFeedModel,
  sanitizePublicLiveFeedFilter
} from "../js/publicPortal/liveFeedModel.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

const labels = {
  teamName: "Rancho Norte",
  participantName: "Charro Uno",
  suerteName: "Manganas a pie"
};
const expected = {
  score_published: "Charro Uno sumó 26 puntos en Manganas a pie.",
  penalty_published: "Se publicó una infracción de -4 puntos para Rancho Norte.",
  official_total_updated: "El total oficial de Rancho Norte se actualizó a 278 puntos.",
  official_position_changed: "Rancho Norte pasó a la posición 1.º.",
  team_turn_started: "Inicia la participación de Rancho Norte.",
  competition_paused: "La competencia se encuentra en pausa."
};
for (const [eventType, description] of Object.entries(expected)) {
  const message = buildPublicLiveFeedMessage({
    eventType,
    score: 26,
    penalty: -4,
    officialTotal: 278,
    officialPosition: 1
  }, labels);
  assert.equal(message.description, description);
}
assert.equal(buildPublicLiveFeedMessage({ eventType: "unknown" }, labels), null);
for (const eventType of PUBLIC_LIVE_FEED_EVENT_TYPES) {
  assert.notEqual(
    buildPublicLiveFeedMessage({ eventType }, labels),
    null,
    `${eventType} must use a closed, declarative template`
  );
}
const malicious = buildPublicLiveFeedMessage({
  eventType: "score_published",
  score: 10
}, {
  teamName: "<img src=x onerror=alert(1)>",
  suerteName: "<script>alert(1)</script>"
});
assert.equal(malicious.description.includes("<"), false);
assert.equal(malicious.description.includes(">"), false);
for (const unsafeText of [
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "\"><svg onload=alert(1)>",
  "<iframe src=javascript:alert(1)>",
  "<object data=x>",
  "<embed src=x>"
]) {
  const safeMessage = buildPublicLiveFeedMessage(
    { eventType: "team_turn_started" },
    { teamName: unsafeText }
  );
  assert.equal(safeMessage.description.includes("<"), false);
  assert.equal(safeMessage.description.includes(">"), false);
}
assert.ok(buildPublicLiveFeedMessage(
  { eventType: "team_turn_started" },
  { teamName: "a".repeat(1_000) }
).description.length < 250);

const feed = {
  revision: 4,
  status: "live",
  updatedAt: "2026-07-27T12:00:00.000Z",
  items: {
    score: baseEvent({ eventId: "score", sequence: 4, eventType: "score_published" }),
    turn: baseEvent({ eventId: "turn", sequence: 3, eventType: "team_turn_started" }),
    penalty: baseEvent({ eventId: "penalty", sequence: 2, eventType: "penalty_published", penalty: -2 }),
    timer: baseEvent({ eventId: "timer", sequence: 1, eventType: "timer_started" })
  }
};
const context = {
  live: { status: "live", turn: { team: { id: "team-a", name: "Rancho Norte" } } },
  results: [{ teamId: "team-a", teamName: "Rancho Norte" }],
  program: []
};
assert.equal(buildPublicLiveFeedModel(feed, context, { filter: "all" }).items.length, 4);
assert.deepEqual(buildPublicLiveFeedModel(feed, context, { filter: "score" }).items.map((item) => item.eventId), ["score"]);
assert.deepEqual(buildPublicLiveFeedModel(feed, context, { filter: "turn" }).items.map((item) => item.eventId), ["turn"]);
assert.deepEqual(buildPublicLiveFeedModel(feed, context, { filter: "penalty" }).items.map((item) => item.eventId), ["penalty"]);
assert.deepEqual(buildPublicLiveFeedModel(feed, context, { filter: "timer" }).items.map((item) => item.eventId), ["timer"]);
assert.equal(sanitizePublicLiveFeedFilter("javascript:"), "all");
assert.equal(buildPublicLiveFeedModel(feed, context, {
  nowMs: Date.parse("2026-07-27T12:01:01.000Z"),
  connection: "online"
}).freshness, "stale");
assert.equal(buildPublicLiveFeedModel(feed, context, {
  nowMs: Date.parse("2026-07-27T12:03:01.000Z"),
  connection: "online"
}).freshness, "stale-important");
assert.equal(buildPublicLiveFeedModel(feed, context, { connection: "offline" }).freshness, "offline");
assert.equal(buildPublicLiveFeedModel(
  { ...feed, status: "finished" },
  context
).status, "finished");
assert.equal(buildPublicLiveFeedModel(
  { ...feed, status: "paused" },
  context
).status, "paused");
assert.equal(buildPublicLiveFeedModel(
  { revision: 1, status: "empty", items: {} },
  { live: {}, results: [], program: [] }
).items.length, 0);

console.log("public-live-feed-templates.test.mjs: ok");

function baseEvent(overrides) {
  return {
    eventId: "event",
    sequence: 1,
    eventType: "score_published",
    occurredAt: 1000,
    publishedAt: 1000,
    status: "official",
    revision: 1,
    teamId: "team-a",
    suerteId: "cala",
    score: 10,
    ...overrides
  };
}
