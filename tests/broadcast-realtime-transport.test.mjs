import assert from "node:assert/strict";
import * as api from "../js/broadcast/broadcastRealtimeTransport.js";

const CONTEXT = Object.freeze({
  tenantId: "tenant-a",
  organizationId: "org-a",
  clientId: "client-a",
  tournamentId: "tournament-a",
  competitionId: "competition-a",
  activeCharreadaId: "charreada-a",
  sessionId: "session-a"
});

function createHub() {
  const values = new Map();
  const listeners = new Map();
  const statuses = new Set();
  return {
    adapter() {
      return {
        async connect({ onStatus }) {
          statuses.add(onStatus);
          onStatus({ connected: true, at: "2026-07-16T12:00:00.000Z" });
          return () => statuses.delete(onStatus);
        },
        subscribe({ path, onValue }) {
          if (!listeners.has(path)) listeners.set(path, new Set());
          listeners.get(path).add(onValue);
          if (values.has(path)) onValue(structuredClone(values.get(path)));
          return () => listeners.get(path)?.delete(onValue);
        },
        async publish({ path, envelope, expectedRevision }) {
          const current = values.get(path);
          assert.equal(Number(current?.revision || 0), Number(expectedRevision || 0));
          values.set(path, structuredClone(envelope));
          listeners.get(path)?.forEach((listener) => listener(structuredClone(envelope)));
          return { ok: true, revision: envelope.revision };
        },
        async publishOutputState({ path, state }) {
          values.set(path, structuredClone(state));
          return { ok: true, revision: state.revision };
        },
        async read(path) {
          return structuredClone(values.get(path) || null);
        }
      };
    },
    emitStatus(status) {
      statuses.forEach((listener) => listener(status));
    },
    inject(path, value) {
      values.set(path, structuredClone(value));
      listeners.get(path)?.forEach((listener) => listener(structuredClone(value)));
    }
  };
}

function configured(adapter, context = CONTEXT, onStatus = null) {
  const transport = api.createBroadcastRealtimeTransport({ transportId: `transport-${Math.random().toString(16).slice(2)}` });
  api.configureBroadcastRealtimeTransport(transport, { adapter, context, staleAfterMs: 1000, onStatus }, { expectedRevision: 0 });
  return transport;
}

assert.equal(api.BROADCAST_REALTIME_TRANSPORT_VERSION, "1.0.0");
[
  "BROADCAST_REALTIME_TRANSPORT_VERSION", "BROADCAST_REALTIME_STATES", "BROADCAST_REALTIME_ERROR_CODES",
  "BroadcastRealtimeTransportError", "createBroadcastRealtimeTransport", "configureBroadcastRealtimeTransport",
  "connectBroadcastRealtimeTransport", "disconnectBroadcastRealtimeTransport", "publishBroadcastProjection",
  "subscribeBroadcastProjection", "unsubscribeBroadcastProjection", "publishOutputState",
  "getBroadcastRealtimeStatus", "getBroadcastRealtimeWarnings", "getBroadcastRealtimeErrors",
  "buildBroadcastRealtimeSnapshot", "destroyBroadcastRealtimeTransport",
  "BROADCAST_SINGLE_TENANT_SCOPE_ID", "BROADCAST_TEMPORARY_ACCESS_VERSION",
  "BROADCAST_TEMPORARY_ACCESS_OUTPUT_TYPES", "buildBroadcastAutomaticSessionId",
  "createBroadcastTemporaryAccessDescriptor", "validateBroadcastTemporaryAccessDescriptor",
  "isBroadcastTemporaryAccessActive", "revokeBroadcastTemporaryAccessDescriptor"
].forEach((name) => assert.ok(name in api, `missing export ${name}`));

assert.equal(api.BROADCAST_SINGLE_TENANT_SCOPE_ID, "charropro-e8a68");
const automaticSessionId = api.buildBroadcastAutomaticSessionId({
  tournamentId: "tournament-a",
  competitionId: "competition-a",
  activeCharreadaId: "charreada-a"
});
assert.equal(automaticSessionId, api.buildBroadcastAutomaticSessionId({
  tournamentId: "tournament-a",
  competitionId: "competition-a",
  activeCharreadaId: "charreada-a"
}), "automatic session identity is deterministic");
assert.notEqual(automaticSessionId, api.buildBroadcastAutomaticSessionId({
  tournamentId: "tournament-a",
  competitionId: "competition-a",
  activeCharreadaId: "charreada-b"
}));
const temporaryProgramAccess = api.createBroadcastTemporaryAccessDescriptor({
  tournamentId: "tournament-a",
  competitionId: "competition-a",
  activeCharreadaId: "charreada-a",
  sessionId: automaticSessionId
}, "program_main", {
  accessId: "bca_program_test",
  ttlMs: 60000,
  now: "2026-07-16T12:00:00.000Z"
});
assert.equal(temporaryProgramAccess.readOnly, true);
assert.equal(temporaryProgramAccess.channel, "program");
assert.equal(api.validateBroadcastTemporaryAccessDescriptor(temporaryProgramAccess, { now: "2026-07-16T12:00:30.000Z" }).valid, true);
assert.equal(api.isBroadcastTemporaryAccessActive(temporaryProgramAccess, { now: "2026-07-16T12:01:01.000Z" }), false, "temporary access expires");
const revokedProgramAccess = api.revokeBroadcastTemporaryAccessDescriptor(temporaryProgramAccess, { now: "2026-07-16T12:00:30.000Z" });
assert.equal(revokedProgramAccess.status, "revoked");
assert.equal(api.isBroadcastTemporaryAccessActive(revokedProgramAccess, { now: "2026-07-16T12:00:31.000Z" }), false, "revoked access stays inactive");
assert.throws(
  () => api.createBroadcastTemporaryAccessDescriptor(temporaryProgramAccess.context, "timer_display", { accessId: "bca_invalid" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.TEMPORARY_ACCESS_INVALID
);

const hub = createHub();
const consoleTransport = configured(hub.adapter());
const programTransport = configured(hub.adapter());
await api.connectBroadcastRealtimeTransport(consoleTransport, { expectedRevision: 1 });
await api.connectBroadcastRealtimeTransport(programTransport, { expectedRevision: 1 });
assert.equal(api.getBroadcastRealtimeStatus(consoleTransport).connected, true);

const received = [];
api.subscribeBroadcastProjection(programTransport, "program", (message) => received.push(message));
const projection = { routeId: "route-program-main", status: "routed", visibility: "public", projection: { turn: { team: { name: "Equipo B" } }, score: 0, enabled: false, label: "" } };
const published = await api.publishBroadcastProjection(consoleTransport, "program", projection, {
  expectedRevision: 0,
  idempotencyKey: "program-rev-1",
  visibility: "public",
  now: "2026-07-16T12:00:01.000Z"
});
assert.equal(published.revision, 1);
assert.equal(received.length, 1);
assert.equal(received[0].projection.projection.turn.team.name, "Equipo B");
assert.equal(received[0].projection.projection.score, 0);
assert.equal(received[0].projection.projection.enabled, false);
assert.equal(received[0].projection.projection.label, "");

received[0].projection.projection.turn.team.name = "Mutado";
assert.equal(projection.projection.turn.team.name, "Equipo B");
const duplicate = await api.publishBroadcastProjection(consoleTransport, "program", projection, {
  expectedRevision: 1,
  idempotencyKey: "program-rev-1",
  visibility: "public"
});
assert.equal(duplicate.revision, 1);
assert.equal(received.length, 1);

await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", { different: true }, { expectedRevision: 1, idempotencyKey: "program-rev-1", visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT
);
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", projection, { expectedRevision: 0, visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.REVISION_CONFLICT
);
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", projection, { expectedRevision: 1, visibility: "restricted" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.VISIBILITY_INVALID
);
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", { token: "secret" }, { expectedRevision: 1, visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE
);
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", { operatorId: "private" }, { expectedRevision: 1, visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE
);
for (const key of ["tenantId", "organizationId", "clientId"]) {
  await assert.rejects(
    () => api.publishBroadcastProjection(consoleTransport, "program", { content: { [key]: "spoof" } }, { expectedRevision: 1, visibility: "public" }),
    (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE
  );
}
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", { label: "<script>alert(1)</script>" }, { expectedRevision: 1, visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE
);
const cyclic = { value: 1 };
cyclic.self = cyclic;
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", cyclic, { expectedRevision: 1, visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE
);
let getterExecuted = false;
const accessor = {};
Object.defineProperty(accessor, "value", { enumerable: true, get() { getterExecuted = true; return 1; } });
await assert.rejects(
  () => api.publishBroadcastProjection(consoleTransport, "program", accessor, { expectedRevision: 1, visibility: "public" }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.PAYLOAD_UNSAFE
);
assert.equal(getterExecuted, false);

const path = "charropro/broadcastStudio/sessions/session-a/program/current";
hub.inject(path, { ...received[0], revision: 0 });
assert.equal(received.length, 1, "regressive revision ignored");
hub.inject(path, {
  ...published.envelope,
  revision: 2,
  projection: { ...published.envelope.projection, tenantId: "spoof" }
});
assert.equal(received.length, 1, "projection identity cannot override the authenticated envelope context");
for (const conflict of [
  { tenantId: "tenant-b" },
  { tournamentId: "tournament-b" },
  { competitionId: "competition-b" },
  { sessionId: "session-b" }
]) {
  hub.inject(path, { ...published.envelope, revision: 2, context: { ...CONTEXT, ...conflict }, sessionId: conflict.sessionId || CONTEXT.sessionId });
  assert.equal(received.length, 1, `context conflict rejected: ${Object.keys(conflict)[0]}`);
}

hub.emitStatus({ connected: false, offline: true, at: "2026-07-16T12:00:02.000Z" });
assert.equal(api.getBroadcastRealtimeStatus(programTransport).offline, true);
assert.equal(received.length, 1, "offline keeps last valid projection");
hub.emitStatus({ connected: true, at: "2026-07-16T12:00:03.000Z" });
hub.inject(path, { ...published.envelope, publishedAt: "2026-07-16T12:00:03.000Z" });
assert.equal(api.getBroadcastRealtimeStatus(programTransport, { now: "2026-07-16T12:00:03.000Z" }).connected, true);
assert.ok(api.getBroadcastRealtimeStatus(programTransport, { now: "2026-07-16T12:00:03.000Z" }).reconnectCount >= 1);

const otherSession = configured(hub.adapter(), { ...CONTEXT, sessionId: "session-b" });
await api.connectBroadcastRealtimeTransport(otherSession, { expectedRevision: 1 });
let leaked = false;
api.subscribeBroadcastProjection(otherSession, "program", () => { leaked = true; });
assert.equal(leaked, false, "session B does not receive session A");

assert.throws(
  () => configured(hub.adapter(), { ...CONTEXT, tenantId: null }),
  (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.CONTEXT_MISSING
);
const snapshot = api.buildBroadcastRealtimeSnapshot(consoleTransport);
assert.equal(snapshot.context.tenantId, "tenant-a");
assert.equal("projection" in snapshot, false);
snapshot.context.tenantId = "changed";
assert.equal(api.buildBroadcastRealtimeSnapshot(consoleTransport).context.tenantId, "tenant-a");

api.destroyBroadcastRealtimeTransport(programTransport);
assert.throws(() => api.getBroadcastRealtimeStatus(programTransport), (error) => error.code === api.BROADCAST_REALTIME_ERROR_CODES.DESTROYED);

console.log("broadcast-realtime-transport.test.mjs: ok");
