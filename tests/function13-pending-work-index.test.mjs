import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import {
  PUBLIC_PROJECTION_STATUSES,
  buildPublicProjectionIntent,
  buildPublicProjectionState
} from "../js/core/publicProjectionOutbox.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { createPublicProjectionServerDelivery } from "../functions/publicProjectionServerDelivery.mjs";
import {
  PROJECTION_PENDING_INDEX_PATH,
  buildProjectionPendingIndexEntry,
  collectProjectionPendingIndexEntries,
  reconcileProjectionPendingWork
} from "../functions/projectionPendingWork.mjs";

const require = createRequire(import.meta.url);
const { buildOfficialScoreFanoutUpdates } = require("../functions/officialScoreConcurrency.js");
const tournamentId = "torneo_mubf2gr9_cp5z2m";
const nowMs = Date.parse("2026-09-23T15:00:00.000Z");

const fanoutIntent = intentFor(record("official-index", 42, "attempt-index"));
const fanoutUpdates = buildOfficialScoreFanoutUpdates(tournamentId, {
  record: { id: "official-index" },
  projectionIntent: fanoutIntent
});
assert.deepEqual(
  fanoutUpdates[`projectionPendingIndex/${fanoutIntent.projectionId}`],
  {
    projectionId: fanoutIntent.projectionId,
    tournamentId,
    createdAtMs: fanoutIntent.createdAtMs,
    nextEligibleAtMs: fanoutIntent.createdAtMs
  },
  "the server producer atomically creates a minimal, deterministic discovery entry"
);
assert.equal(JSON.stringify(fanoutUpdates[`projectionPendingIndex/${fanoutIntent.projectionId}`]).includes("total"), false);

const emptyCalls = { list: 0, jobs: 0, deliver: 0, writes: 0, removes: 0, batchLimit: 0 };
const empty = await reconcileProjectionPendingWork({
  async listDueEntries({ batchLimit }) { emptyCalls.list += 1; emptyCalls.batchLimit = batchLimit; return {}; },
  async readJob() { emptyCalls.jobs += 1; return null; },
  async deliver() { emptyCalls.deliver += 1; return { ok: false }; },
  async writeEntry() { emptyCalls.writes += 1; },
  async removeEntry() { emptyCalls.removes += 1; }
}, { nowMs });
assert.deepEqual(empty, { scanned: 0, candidates: 0, stale: 0, confirmed: 0, pending: 0, results: [] });
assert.deepEqual(emptyCalls, { list: 1, jobs: 0, deliver: 0, writes: 0, removes: 0, batchLimit: 100 }, "an empty run reads only the bounded index query");

const terminalOutbox = Object.fromEntries(Array.from({ length: 59 }, (_, index) => {
  const status = index < 55 ? PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED : PUBLIC_PROJECTION_STATUSES.SUPERSEDED;
  const intent = intentFor(record(`official-terminal-${index}`, index, `attempt-terminal-${index}`));
  return [intent.projectionId, { intent, state: { status, updatedAtMs: nowMs } }];
}));
assert.deepEqual(collectProjectionPendingIndexEntries({ [tournamentId]: terminalOutbox }, nowMs), {}, "terminal and superseded jobs never enter discovery");

const terminalCalls = { jobs: 0, deliver: 0, removes: 0 };
const terminal = await reconcileProjectionPendingWork({
  async listDueEntries() { return {}; },
  async readJob() { terminalCalls.jobs += 1; return null; },
  async deliver() { terminalCalls.deliver += 1; return { ok: false }; },
  async writeEntry() {},
  async removeEntry() { terminalCalls.removes += 1; }
}, { nowMs });
assert.equal(terminal.scanned, 0);
assert.deepEqual(terminalCalls, { jobs: 0, deliver: 0, removes: 0 }, "59 historical terminal jobs cause zero targeted reads and zero delivery calls");

await recoverHistoricalCase(42, "case-42");
await recoverHistoricalCase(18, "case-18");

const raceRecord = record("official-race", 27, "attempt-race");
const raceIntent = intentFor(raceRecord);
const raceStore = storeFor([raceRecord], raceIntent, { publicTotal: 0 });
const raceDelivery = createPublicProjectionServerDelivery(raceStore, { now: () => nowMs });
const raceAdapter = pendingAdapter(raceStore, raceDelivery);
await Promise.all([
  reconcileProjectionPendingWork(raceAdapter, { nowMs }),
  reconcileProjectionPendingWork(raceAdapter, { nowMs })
]);
assert.equal(raceStore.read(`charropro/projectionOutbox/${tournamentId}/${raceIntent.projectionId}/state/status`), "CLIENT_CONFIRMED");
assert.equal(raceStore.read(`${PROJECTION_PENDING_INDEX_PATH}/${raceIntent.projectionId}`), undefined, "a late scheduler removes the already-confirmed discovery entry");
assert.equal(raceStore.read(`charropro/publicTournaments/${tournamentId}`).results.teams[0].columns.cala, 27);

const vanishedRecord = record("official-vanished", 31, "attempt-vanished");
const vanishedIntent = intentFor(vanishedRecord);
const vanishedStore = storeFor([vanishedRecord], vanishedIntent, { publicTotal: 0 });
const vanishedDelivery = createPublicProjectionServerDelivery(vanishedStore, { now: () => nowMs });
const vanishedAdapter = pendingAdapter(vanishedStore, vanishedDelivery, {
  beforeFirstReadJob() { vanishedStore.remove(`${PROJECTION_PENDING_INDEX_PATH}/${vanishedIntent.projectionId}`); }
});
const vanished = await reconcileProjectionPendingWork(vanishedAdapter, { nowMs });
assert.equal(vanished.confirmed, 1, "a scheduler that already discovered work completes safely if the disposable index vanishes");
assert.equal(vanishedStore.read(`charropro/projectionOutbox/${tournamentId}/${vanishedIntent.projectionId}/state/status`), "CLIENT_CONFIRMED");
assert.equal(vanishedStore.read(`${PROJECTION_PENDING_INDEX_PATH}/${vanishedIntent.projectionId}`), undefined);

const retryRecord = record("official-retry", 33, "attempt-retry");
const retryIntent = intentFor(retryRecord);
const retryStore = storeFor([retryRecord], retryIntent, { publicTotal: 0 });
let retryDeliveries = 0;
const retryAdapter = pendingAdapter(retryStore, {
  async deliver() {
    retryDeliveries += 1;
    const path = `charropro/projectionOutbox/${tournamentId}/${retryIntent.projectionId}/state`;
    if (retryDeliveries === 1) {
      const processing = buildPublicProjectionState("PROCESSING", {}, {}, { nowMs });
      retryStore.write(path, buildPublicProjectionState("RETRY_WAIT", processing, {
        nextRetryAtMs: nowMs + 5000,
        lastErrorCode: "network-error"
      }, { nowMs }));
      return { ok: false, status: "RETRY_WAIT" };
    }
    const claimed = buildPublicProjectionState("PROCESSING", retryStore.read(path), {}, { nowMs: nowMs + 5000 });
    const projected = buildPublicProjectionState("PROJECTED", claimed, {}, { nowMs: nowMs + 5000 });
    retryStore.write(path, buildPublicProjectionState("CLIENT_CONFIRMED", projected, {}, { nowMs: nowMs + 5000 }));
    return { ok: true, status: "CLIENT_CONFIRMED" };
  }
});
await reconcileProjectionPendingWork(retryAdapter, { nowMs });
assert.equal(retryStore.read(`${PROJECTION_PENDING_INDEX_PATH}/${retryIntent.projectionId}`).nextEligibleAtMs, nowMs + 5000);
await reconcileProjectionPendingWork(retryAdapter, { nowMs: nowMs + 4999 });
assert.equal(retryDeliveries, 1, "retry waits are not delivered before their canonical retry time");
await reconcileProjectionPendingWork(retryAdapter, { nowMs: nowMs + 5000 });
assert.equal(retryDeliveries, 2);
assert.equal(retryStore.read(`${PROJECTION_PENDING_INDEX_PATH}/${retryIntent.projectionId}`), undefined, "terminal recovery removes only the index, never durable history");

const deadIntent = intentFor(record("official-dead", 0, "attempt-dead"));
const deadState = buildPublicProjectionState("DEAD_LETTER", {}, { deadLetterReason: "missing-projection-source" }, { nowMs });
const deadEntries = collectProjectionPendingIndexEntries({ [tournamentId]: { [deadIntent.projectionId]: { intent: deadIntent, state: deadState } } }, nowMs);
assert.ok(deadEntries[deadIntent.projectionId], "DEAD_LETTER remains discoverable only for canonical convergence handling");

const staleRecord = record("official-stale", 0, "attempt-stale");
const staleIntent = intentFor(staleRecord);
const staleStore = storeFor([staleRecord], staleIntent, { publicTotal: 0, rawIntentOnly: true });
staleStore.write(`charropro/projectionOutbox/${tournamentId}/${staleIntent.projectionId}`, {
  intent: staleIntent,
  state: { status: "SUPERSEDED", updatedAtMs: nowMs }
});
staleStore.write(`${PROJECTION_PENDING_INDEX_PATH}/${staleIntent.projectionId}`, buildProjectionPendingIndexEntry(tournamentId, staleIntent, {}, nowMs));
let staleDeliveryCalls = 0;
await reconcileProjectionPendingWork(pendingAdapter(staleStore, { deliver: async () => { staleDeliveryCalls += 1; return { ok: false }; } }), { nowMs });
assert.equal(staleDeliveryCalls, 0, "a stale index can never revive a superseded job");
assert.equal(staleStore.read(`${PROJECTION_PENDING_INDEX_PATH}/${staleIntent.projectionId}`), undefined);

const functionSource = readFileSync(new URL("../functions/index.js", import.meta.url), "utf8");
assert.doesNotMatch(functionSource, /ref\(PROJECTION_OUTBOX_PATH\)\.get\(\)/, "Function 13 no longer reads the global outbox root");
assert.match(functionSource, /PROJECTION_PENDING_INDEX_PATH/);
assert.match(functionSource, /orderByChild\("nextEligibleAtMs"\)\.endAt\(nowMs\)\.limitToFirst\(batchLimit\)/);

const rules = require("../firebase-rules-auditoria.json").rules.charropro;
assert.deepEqual(rules.projectionPendingIndex, { ".indexOn": "nextEligibleAtMs" }, "the due-entry query has exactly its required RTDB index");
assert.equal(rules.projectionPendingIndex[".read"], undefined, "the query index does not grant client reads");
assert.equal(rules.projectionPendingIndex[".write"], undefined, "the query index does not grant client writes");
assert.equal(rules[".write"], false, "the root Rules default remains server-only");

console.log("function13-pending-work-index.test.mjs: ok");

async function recoverHistoricalCase(total, suffix) {
  const sourceRecord = record(`official-${suffix}`, total, `attempt-${suffix}`);
  const intent = intentFor(sourceRecord);
  const store = storeFor([sourceRecord], intent, { publicTotal: 0 });
  const delivery = createPublicProjectionServerDelivery(store, { now: () => nowMs });
  const outcome = await reconcileProjectionPendingWork(pendingAdapter(store, delivery), { nowMs });
  assert.equal(outcome.confirmed, 1, `Case ${total} recovers autonomously without a browser`);
  assert.equal(store.read(`charropro/projectionOutbox/${tournamentId}/${intent.projectionId}/state/status`), "CLIENT_CONFIRMED");
  assert.equal(store.read(`${PROJECTION_PENDING_INDEX_PATH}/${intent.projectionId}`), undefined);
  assert.equal(store.read(`charropro/publicTournaments/${tournamentId}`).results.teams[0].columns.cala, total);
}

function pendingAdapter(store, delivery, options = {}) {
  let firstRead = true;
  return {
    async listDueEntries({ nowMs: dueAtMs, batchLimit }) {
      return Object.fromEntries(Object.entries(store.read(PROJECTION_PENDING_INDEX_PATH) || {})
        .filter(([, entry]) => Number(entry?.nextEligibleAtMs || 0) <= dueAtMs)
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(0, batchLimit));
    },
    async readJob(id, projectionId) {
      if (firstRead) {
        firstRead = false;
        options.beforeFirstReadJob?.();
      }
      return store.read(`charropro/projectionOutbox/${id}/${projectionId}`);
    },
    async writeEntry(entry) { store.write(`${PROJECTION_PENDING_INDEX_PATH}/${entry.projectionId}`, entry); },
    async removeEntry(projectionId) { store.remove(`${PROJECTION_PENDING_INDEX_PATH}/${projectionId}`); },
    async deliver(id, intent) { return delivery.deliver(id, intent); }
  };
}

function storeFor(records, intent, options = {}) {
  const rawIntentOnly = options.rawIntentOnly === true;
  const seed = {
    charropro: {
      tournaments: { [tournamentId]: tournament(records) },
      live: { [tournamentId]: { current: { currentScore: records[0]?.total || 0 } } },
      publicTournaments: { [tournamentId]: publicProjection(options.publicTotal || 0) },
      projectionOutbox: { [tournamentId]: rawIntentOnly ? {} : { [intent.projectionId]: { intent } } },
      projectionPendingIndex: rawIntentOnly ? {} : { [intent.projectionId]: buildProjectionPendingIndexEntry(tournamentId, intent, {}, nowMs) }
    }
  };
  return memoryStore(seed);
}

function record(id, total, attemptKey) {
  return {
    id,
    revision: 1,
    tournamentId,
    charreadaId: "charreada_1",
    competitionId: "equipos_completo",
    teamId: "equipo_1",
    teamName: "Amazonas",
    suerteId: "cala",
    attemptKey,
    attempt: { total },
    total,
    published: true,
    officialStatus: "active",
    publishedAt: "2026-09-23T15:00:00.000Z"
  };
}

function intentFor(source) {
  return buildPublicProjectionIntent({
    tournamentId,
    charreadaId: source.charreadaId,
    competitionId: source.competitionId,
    sourceId: source.id,
    scoreId: `${source.charreadaId}__${source.teamId}__${source.suerteId}`,
    attemptKey: source.attemptKey,
    sourceRevision: source.revision,
    publishedAt: source.publishedAt,
    total: source.total,
    actor: { uid: "judge-a", role: "juez" }
  }, { nowMs });
}

function tournament(records) {
  return {
    info: { id: tournamentId, nombre: "Amazonas 2026", status: "en_vivo", type: "equipos_completo" },
    teams: [{ id: "equipo_1", name: "Amazonas" }],
    charreadas: [{ id: "charreada_1", competitionId: "equipos_completo", name: "Charreada 1", teamIds: ["equipo_1"] }],
    publishedScores: Object.fromEntries(records.map((item) => [item.id, item]))
  };
}

function publicProjection(total) {
  return {
    projectionVersion: "3",
    projectionRevision: 1,
    results: { teams: [{ teamId: "equipo_1", columns: { cala: total } }] },
    live: { currentScore: total }
  };
}

function memoryStore(seed) {
  const root = structuredClone(seed);
  return {
    read(path) { return structuredClone(getPath(root, path)); },
    write(path, value) { setPath(root, path, structuredClone(value)); },
    remove(path) { deletePath(root, path); },
    async transaction(path, updater) {
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

function deletePath(root, path) {
  const parts = String(path).split("/").filter(Boolean);
  const last = parts.pop();
  const parent = parts.reduce((node, key) => node?.[key], root);
  if (parent) delete parent[last];
}
