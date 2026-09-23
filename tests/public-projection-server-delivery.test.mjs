import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPublicProjectionIntent } from "../js/core/publicProjectionOutbox.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { buildPublicProjection } from "../functions/reconciliationShared/public/publicProjection.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { createPublicProjectionServerDelivery } from "../functions/publicProjectionServerDelivery.mjs";

const tournamentId = "torneo_mubf2gr9_cp5z2m";
let nowMs = Date.parse("2026-09-23T12:00:00.000Z");
const currentRecord = official("official_0b5649777b7d8dd09711d2cff0294fbd", "cala", 42, "attempt-cala");
const staleRecord = { ...currentRecord, total: 8, attempt: { total: 8 } };
const tournament = tournamentFixture([currentRecord]);
const stale = buildPublicProjection({ tournament: tournamentFixture([staleRecord]), liveCurrent: { currentScore: 8 } }, { tournamentId, nowMs });
stale.projectionRevision = 189;

const store = memoryStore({
  charropro: {
    tournaments: { [tournamentId]: tournament },
    live: { [tournamentId]: { current: { currentScore: 42 } } },
    publicTournaments: { [tournamentId]: stale },
    projectionOutbox: { [tournamentId]: {} }
  }
});
const delivery = createPublicProjectionServerDelivery(store, { now: () => nowMs });
const intent = projectionIntent(currentRecord);
store.write(`charropro/projectionOutbox/${tournamentId}/${intent.projectionId}/intent`, intent);

const cold = await delivery.deliver(tournamentId, intent);
assert.equal(cold.ok, true, "cold intent is delivered without any browser recovery");
assert.equal(cold.status, "CLIENT_CONFIRMED");
const coldState = store.read(`charropro/projectionOutbox/${tournamentId}/${intent.projectionId}/state`);
assert.equal(coldState.status, "CLIENT_CONFIRMED");
assert.equal(coldState.attempts, 1);
assert.ok(coldState.targetFingerprint, "the server persists the canonical public fingerprint");
const projected = store.read(`charropro/publicTournaments/${tournamentId}`);
assert.equal(projected.results.teams[0].columns.cala, 42, "the real production-shaped 42 replaces stale public 8");
assert.equal(projected.live.currentScore, 42, "public live follows the same canonical 42");
assert.ok(projected.projectionRevision > 189, "public revision remains monotonic");

const duplicateRevision = projected.projectionRevision;
const duplicate = await delivery.deliver(tournamentId, intent);
assert.equal(duplicate.ok, true);
assert.equal(store.read(`charropro/publicTournaments/${tournamentId}`).projectionRevision, duplicateRevision, "duplicate fanout is idempotent");
assert.equal(Object.keys(store.read(`charropro/tournaments/${tournamentId}/publishedScores`)).length, 1, "delivery never creates a second Official Score");

const second = official("official_second", "piales", 27, "attempt-piales");
const third = official("official_third", "toro", 15, "attempt-toro");
const fourth = official("official_fourth", "colas", 0, "attempt-colas");
const fifth = official("official_fifth", "paso", 19, "attempt-paso");
store.write(`charropro/tournaments/${tournamentId}/publishedScores/${second.id}`, second);
store.write(`charropro/tournaments/${tournamentId}/publishedScores/${third.id}`, third);
store.write(`charropro/tournaments/${tournamentId}/publishedScores/${fourth.id}`, fourth);
store.write(`charropro/tournaments/${tournamentId}/publishedScores/${fifth.id}`, fifth);
const secondIntent = projectionIntent(second);
const thirdIntent = projectionIntent(third);
const fourthIntent = projectionIntent(fourth);
const fifthIntent = projectionIntent(fifth);
store.write(`charropro/projectionOutbox/${tournamentId}/${secondIntent.projectionId}/intent`, secondIntent);
store.write(`charropro/projectionOutbox/${tournamentId}/${thirdIntent.projectionId}/intent`, thirdIntent);
store.write(`charropro/projectionOutbox/${tournamentId}/${fourthIntent.projectionId}/intent`, fourthIntent);
store.write(`charropro/projectionOutbox/${tournamentId}/${fifthIntent.projectionId}/intent`, fifthIntent);
const [parallelA, parallelB] = await Promise.all([
  delivery.deliver(tournamentId, secondIntent),
  delivery.deliver(tournamentId, thirdIntent)
]);
assert.equal(parallelA.ok, true);
assert.equal(parallelB.ok, true);
const concurrent = store.read(`charropro/publicTournaments/${tournamentId}`);
assert.equal(concurrent.results.teams[0].columns.cala, 42);
assert.equal(concurrent.results.teams[0].columns.piales, 27, "two simultaneous jobs converge from the full canonical source");
assert.equal(concurrent.results.teams[0].columns.toro, 15);

const burst = await Promise.all([
  delivery.deliver(tournamentId, secondIntent),
  delivery.deliver(tournamentId, fourthIntent),
  delivery.deliver(tournamentId, fifthIntent)
]);
assert.equal(burst.every((result) => result.ok), true, "duplicate plus burst fanout remains idempotent");
const burstProjection = store.read(`charropro/publicTournaments/${tournamentId}`);
assert.equal(burstProjection.results.teams[0].columns.colas, 0);
assert.equal(burstProjection.results.teams[0].columns.paso, 19);

const convergedIntent = projectionIntent(official("official_converged", "colas", 0, "attempt-colas"));
const convergedTournament = tournamentFixture([currentRecord, second, official("official_converged", "colas", 0, "attempt-colas")]);
const convergedProjection = buildPublicProjection({ tournament: convergedTournament, liveCurrent: { currentScore: 42 } }, { tournamentId, nowMs });
convergedProjection.projectionRevision = 220;
const convergedStore = memoryStore({
  charropro: {
    tournaments: { [tournamentId]: convergedTournament },
    live: { [tournamentId]: { current: { currentScore: 42 } } },
    publicTournaments: { [tournamentId]: convergedProjection },
    projectionOutbox: { [tournamentId]: { [convergedIntent.projectionId]: { intent: convergedIntent } } }
  }
});
const converged = await createPublicProjectionServerDelivery(convergedStore, { now: () => nowMs }).deliver(tournamentId, convergedIntent);
assert.equal(converged.ok, true);
assert.equal(convergedStore.read(`charropro/projectionOutbox/${tournamentId}/${convergedIntent.projectionId}/state/status`), "CLIENT_CONFIRMED");
assert.equal(convergedStore.read(`charropro/publicTournaments/${tournamentId}`).projectionRevision, 220, "converged recovery does not republish");

const failingStore = memoryStore({
  charropro: {
    tournaments: { [tournamentId]: tournamentFixture([currentRecord]) },
    live: { [tournamentId]: { current: { currentScore: 42 } } },
    publicTournaments: {},
    projectionOutbox: { [tournamentId]: { [intent.projectionId]: { intent } } }
  }
}, { failPublicTransactionOnce: true });
const failingDelivery = createPublicProjectionServerDelivery(failingStore, { now: () => nowMs });
const partial = await failingDelivery.deliver(tournamentId, intent);
assert.equal(partial.ok, false);
assert.equal(failingStore.read(`charropro/projectionOutbox/${tournamentId}/${intent.projectionId}/state/status`), "RETRY_WAIT");
nowMs += 1001;
const retried = await failingDelivery.deliver(tournamentId, intent);
assert.equal(retried.ok, true, "retry succeeds without a client after a partial failure");

const [app, functionsSource] = await Promise.all([
  readFile(new URL("../js/app.js", import.meta.url), "utf8"),
  readFile(new URL("../functions/index.js", import.meta.url), "utf8")
]);
const observe = app.slice(app.indexOf("function enterSupervisorScoringReviewMode"), app.indexOf("function exitSupervisorScoringReviewMode"));
assert.match(observe, /supervisorLiveControlEnabled = false/);
assert.doesNotMatch(observe, /syncCurrentLiveState|applyFirebaseOfficialTimerAuthority|publishFirebase/,
  "observing as Supervisor cannot claim live control, a lease, timer, score, or projection");
assert.match(app.slice(app.indexOf("function takeSupervisorLiveControl"), app.indexOf("function wireFirebaseAppStatePublisher")), /window\.confirm/, "takeover remains explicit");
assert.doesNotMatch(app.slice(app.indexOf("function exitSupervisorScoringReviewMode"), app.indexOf("function isSupervisorScoringReviewMode")), /syncCurrentLiveState|applyFirebaseOfficialTimerAuthority|publishFirebase/,
  "closing an observing Supervisor does not affect the Judge operation");
assert.match(functionsSource, /await deliverPublicProjectionFromFunction\(tournamentId, job\.projectionIntent\)/,
  "official fanout invokes the server-side projection worker before delivery is acknowledged");
assert.match(functionsSource, /exports\.reconcileCharroProPublicProjectionOutbox = onSchedule/,
  "a bounded server worker recovers historical cold intents without a browser");

console.log("public-projection-server-delivery.test.mjs: ok");

function official(id, suerteId, total, attemptKey) {
  return {
    id,
    revision: 1,
    tournamentId,
    charreadaId: "charreada_mudgcpkh_vll4r6",
    competitionId: "equipos_completo",
    participantScope: "team",
    teamId: "equipo_mubf4dkm_hz28vm",
    teamName: "Amazonas",
    suerteId,
    attemptKey,
    attempt: { total },
    total,
    published: true,
    officialStatus: "active",
    publishedAt: "2026-09-23T12:00:00.000Z"
  };
}

function projectionIntent(record) {
  return buildPublicProjectionIntent({
    tournamentId,
    charreadaId: record.charreadaId,
    competitionId: record.competitionId,
    sourceId: record.id,
    scoreId: `${record.charreadaId}__${record.teamId}__${record.suerteId}`,
    attemptKey: record.attemptKey,
    sourceRevision: record.revision,
    publishedAt: record.publishedAt,
    total: record.total,
    actor: { uid: "judge-a", role: "juez" }
  }, { nowMs });
}

function tournamentFixture(records) {
  return {
    info: { id: tournamentId, nombre: "Amazonas 2026", status: "en_vivo", type: "equipos_completo" },
    teams: [{ id: "equipo_mubf4dkm_hz28vm", name: "Amazonas" }],
    charreadas: [{
      id: "charreada_mudgcpkh_vll4r6",
      competitionId: "equipos_completo",
      competitionName: "Charreada 1",
      name: "Charreada 1",
      status: "en_vivo",
      teamIds: ["equipo_mubf4dkm_hz28vm"]
    }],
    publishedScores: Object.fromEntries(records.map((record) => [record.id, record]))
  };
}

function memoryStore(seed, options = {}) {
  const root = structuredClone(seed);
  let failPublicTransactionOnce = options.failPublicTransactionOnce === true;
  return {
    read(path) { return structuredClone(getPath(root, path)); },
    write(path, value) { setPath(root, path, structuredClone(value)); },
    async transaction(path, updater) {
      if (failPublicTransactionOnce && path.includes("/publicTournaments/")) {
        failPublicTransactionOnce = false;
        throw new Error("network-error");
      }
      const current = getPath(root, path);
      const next = updater(structuredClone(current));
      if (next === undefined) return { committed: false, value: structuredClone(current) };
      setPath(root, path, structuredClone(next));
      return { committed: true, value: structuredClone(next) };
    }
  };
}

function getPath(root, path) {
  return String(path).split("/").filter(Boolean).reduce((value, key) => value?.[key], root);
}

function setPath(root, path, value) {
  const parts = String(path).split("/").filter(Boolean);
  const last = parts.pop();
  const parent = parts.reduce((node, key) => node[key] ||= {}, root);
  parent[last] = value;
}
