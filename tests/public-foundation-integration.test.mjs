import assert from "node:assert/strict";
import { buildPublicProjection, reconcilePublicProjection } from "../js/public/publicProjection.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  applyPublicPortalConnection,
  applyPublicPortalSnapshot,
  createPublicPortalClientState,
  getPublicPortalViewSnapshot
} from "../js/public/publicPortalClient.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

const qa = {
  tournament: {
    info: { id: "integration-qa", nombre: "Integración QA", type: "completo" },
    meta: { updatedAt: "2026-07-27T10:00:00.000Z", activeCharreadaId: "team-round" },
    teams: [{ id: "team-a", name: "Equipo A" }, { id: "team-b", name: "Equipo B" }],
    charreadas: [
      {
        id: "team-round",
        name: "Equipos",
        competitionId: "team-competition",
        competitionType: "equipos_completo",
        categoryId: "aaa",
        phaseId: "phase-1",
        teamIds: ["team-a", "team-b"],
        suerteIds: ["cala"]
      },
      {
        id: "individual-round",
        name: "Caladero",
        competitionId: "caladero-libre",
        competitionType: "caladero",
        categoryId: "libre",
        phaseId: "final",
        individualParticipants: [{ id: "rider-a", name: "Jinete A" }]
      }
    ],
    scores: {
      private: { teamId: "team-b", total: 500, notes: "private score" }
    },
    publishedScores: {}
  },
  liveCurrent: {
    charreada: { id: "team-round", name: "Equipos" },
    competitionId: "team-competition",
    turn: { team: { id: "team-b", name: "Equipo B" }, suerte: { id: "cala", name: "Cala" } },
    notes: "operational",
    timestamp: "2026-07-27T10:00:01.000Z"
  }
};

let stored = null;
let writes = 0;
const publish = (nowMs) => {
  const candidate = buildPublicProjection(qa, { tournamentId: "integration-qa", nowMs });
  const result = reconcilePublicProjection(stored, candidate, { nowMs });
  if (result.ok && result.changed) {
    stored = result.projection;
    writes += 1;
  }
  return result;
};

const first = publish(Date.parse("2026-07-27T10:00:02.000Z"));
assert.equal(first.ok, true);
assert.equal(stored.schemaVersion, 2);
assert.equal(stored.projectionRevision, 1);
assert.equal(writes, 1);
assert.deepEqual(stored.results.items, []);
assert.equal(stored.live.turn.team.id, "team-b");

qa.tournament.publishedScores.a = {
  id: "published-a",
  attemptKey: "team-a-cala",
  revision: 1,
  charreada: { id: "team-round" },
  competition: { id: "team-competition", type: "equipos_completo" },
  team: { id: "team-a", name: "Equipo A" },
  suerte: { id: "cala" },
  breakdown: { total: 12 },
  total: 12,
  publishedAt: "2026-07-27T10:00:03.000Z"
};
qa.tournament.meta.updatedAt = "2026-07-27T10:00:03.000Z";
const scorePublished = publish(Date.parse("2026-07-27T10:00:04.000Z"));
assert.equal(scorePublished.ok, true);
assert.equal(stored.projectionRevision, 2);
assert.equal(stored.results.items[0].subtotal, 12);
assert.equal(stored.live.turn.team.id, "team-b", "official turn remains B when A receives a score");
assert.equal(JSON.stringify(stored).includes("private score"), false);

qa.tournament.publishedScores.a.superseded = true;
qa.tournament.publishedScores.a2 = {
  ...qa.tournament.publishedScores.a,
  id: "published-a-correction",
  superseded: false,
  revision: 2,
  correction: true,
  breakdown: { total: 18 },
  total: 18,
  publishedAt: "2026-07-27T10:00:05.000Z"
};
qa.tournament.meta.updatedAt = "2026-07-27T10:00:05.000Z";
publish(Date.parse("2026-07-27T10:00:06.000Z"));
assert.equal(stored.projectionRevision, 3);
assert.equal(stored.results.items.length, 1);
assert.equal(stored.results.items[0].subtotal, 18);

qa.liveCurrent.charreada = { id: "individual-round", name: "Caladero" };
qa.liveCurrent.competitionId = "caladero-libre";
qa.liveCurrent.turn = { participant: { id: "rider-a", name: "Jinete A" }, suerte: { id: "cala", name: "Cala" } };
qa.liveCurrent.timestamp = "2026-07-27T10:00:07.000Z";
publish(Date.parse("2026-07-27T10:00:08.000Z"));
assert.equal(stored.projectionRevision, 4);
assert.equal(stored.overview.activeCompetitionId, "caladero-libre");
assert.equal(stored.overview.activeCharreadaId, "individual-round");

const unchanged = publish(Date.parse("2026-07-27T10:00:09.000Z"));
assert.equal(unchanged.changed, false);
assert.equal(stored.projectionRevision, 4);
assert.equal(writes, 4);
const duplicate = publish(Date.parse("2026-07-27T10:00:10.000Z"));
assert.equal(duplicate.changed, false);
assert.equal(writes, 4);

let client = createPublicPortalClientState();
client = applyPublicPortalSnapshot(client, stored, { nowMs: Date.parse("2026-07-27T10:00:11.000Z") }).state;
client = applyPublicPortalConnection(client, false);
assert.equal(client.connection, "offline");
assert.ok(getPublicPortalViewSnapshot(client));
client = applyPublicPortalConnection(client, true);
assert.equal(client.connection, "reconnecting");
const reconnected = applyPublicPortalSnapshot(client, {
  ...stored,
  projectionRevision: stored.projectionRevision + 1,
  generatedAt: "2026-07-27T10:00:12.000Z",
  generatedAtMs: Date.parse("2026-07-27T10:00:12.000Z")
});
assert.equal(reconnected.accepted, true);
assert.equal(reconnected.state.connection, "online");
assert.equal(JSON.stringify(stored).includes("operational"), false);

console.log("public-foundation-integration.test.mjs: ok");
