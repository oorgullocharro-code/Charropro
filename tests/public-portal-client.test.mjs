import assert from "node:assert/strict";
import {
  applyPublicPortalConnection,
  applyPublicPortalSnapshot,
  createPublicPortalClientState,
  evaluatePublicPortalStale,
  getPublicPortalViewSnapshot
} from "../js/public/publicPortalClient.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1";
import { buildPublicProjection, reconcilePublicProjection } from "../js/public/publicProjection.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1";

const candidate = buildPublicProjection({
  tournament: {
    info: { id: "portal-qa", nombre: "Portal QA" },
    meta: { updatedAt: "2026-07-27T12:00:00.000Z" },
    charreadas: [],
    publishedScores: []
  },
  liveCurrent: {}
}, { tournamentId: "portal-qa", nowMs: Date.parse("2026-07-27T12:00:00.000Z") });
const projection = reconcilePublicProjection(null, candidate, {
  nowMs: Date.parse("2026-07-27T12:00:00.000Z")
}).projection;

let state = createPublicPortalClientState({ staleThresholdMs: 60000 });
state = applyPublicPortalConnection(state, true);
assert.equal(state.connection, "connecting");

const accepted = applyPublicPortalSnapshot(state, projection, {
  nowMs: Date.parse("2026-07-27T12:00:01.000Z")
});
assert.equal(accepted.accepted, true);
assert.equal(accepted.duplicate, false);
assert.equal(accepted.state.connection, "online");
assert.equal(accepted.state.projectionRevision, 1);
assert.deepEqual(accepted.changedSections, ["snapshot"]);
assert.equal(getPublicPortalViewSnapshot(accepted.state).schemaVersion, 1);
state = accepted.state;

const duplicate = applyPublicPortalSnapshot(state, structuredClone(projection), {
  nowMs: Date.parse("2026-07-27T12:00:02.000Z")
});
assert.equal(duplicate.accepted, false);
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.state.snapshot, state.snapshot);

const inconsistentProjection = createCanonicalPublicTournamentData({
  ...projection,
  tournament: { ...projection.tournament, name: "Different content" }
});
const inconsistent = applyPublicPortalSnapshot(state, inconsistentProjection);
assert.equal(inconsistent.accepted, false);
assert.equal(inconsistent.duplicate, false);
assert.equal(inconsistent.reason, "projection-revision-inconsistent");
assert.equal(inconsistent.state.connection, "error");

const regressionProjection = structuredClone(projection);
regressionProjection.projectionRevision = 0;
const regression = applyPublicPortalSnapshot(state, regressionProjection);
assert.equal(regression.accepted, false);
assert.equal(regression.reason, "projection-revision-regression");
assert.equal(regression.state.projectionRevision, 1);

const offline = applyPublicPortalConnection(state, false);
assert.equal(offline.connection, "offline");
assert.ok(offline.snapshot, "last valid snapshot remains available offline");
const reconnecting = applyPublicPortalConnection(offline, true);
assert.equal(reconnecting.connection, "reconnecting");
const recoveredProjection = createCanonicalPublicTournamentData({
  ...projection,
  projectionRevision: 2,
  generatedAt: "2026-07-27T12:01:00.000Z",
  live: { ...projection.live, status: "LIVE" }
});
const recovered = applyPublicPortalSnapshot(reconnecting, recoveredProjection, {
  nowMs: Date.parse("2026-07-27T12:01:00.000Z")
}, { nowMs: Date.parse("2026-07-27T12:01:00.000Z") });
assert.equal(recovered.accepted, true);
assert.equal(recovered.state.connection, "online");

const stale = evaluatePublicPortalStale(recovered.state, {
  nowMs: Date.parse("2026-07-27T12:02:01.000Z")
});
assert.equal(stale.connection, "stale");
assert.ok(stale.snapshot);

const temporaryError = applyPublicPortalSnapshot(stale, null);
assert.equal(temporaryError.accepted, false);
assert.ok(temporaryError.state.snapshot, "temporary error never blanks valid view");

const legacy = applyPublicPortalSnapshot(createPublicPortalClientState(), {
  version: 1,
  info: { id: "legacy", nombre: "Legacy" },
  generatedAt: "2026-07-27T12:00:00.000Z",
  schedule: []
});
assert.equal(legacy.accepted, true);
assert.equal(legacy.legacy, true);
assert.equal(getPublicPortalViewSnapshot(legacy.state).info.id, "legacy");

const rtdbEmptyRoundTrip = structuredClone(projection);
delete rtdbEmptyRoundTrip.program.items;
delete rtdbEmptyRoundTrip.results.teams;
delete rtdbEmptyRoundTrip.standings.items;
delete rtdbEmptyRoundTrip.sheet.competitions;
delete rtdbEmptyRoundTrip.timeline.items;
delete rtdbEmptyRoundTrip.statistics.items;
const emptyRoundTrip = applyPublicPortalSnapshot(createPublicPortalClientState(), rtdbEmptyRoundTrip);
assert.equal(emptyRoundTrip.accepted, false, "a partial V3 snapshot is never accepted as a mixed revision");

console.log("public-portal-client.test.mjs: ok");
