import assert from "node:assert/strict";
import {
  BROADCAST_OUTPUT_CAPABILITIES,
  BROADCAST_OUTPUT_STATUSES,
  BROADCAST_OUTPUT_TYPES,
  BROADCAST_OUTPUT_VERSION,
  BROADCAST_OUTPUT_VISIBILITIES,
  assignLayersToOutput,
  assignThemeToOutput,
  buildBroadcastOutputProjection,
  cloneBroadcastOutput,
  createBroadcastOutput,
  getBroadcastOutput,
  getBroadcastOutputWarnings,
  isBroadcastOutputStale,
  listBroadcastOutputs,
  normalizeBroadcastOutput,
  registerBroadcastOutput,
  removeBroadcastOutput,
  setBroadcastOutputCapabilities,
  setBroadcastOutputStatus,
  setOutputResolution,
  setOutputSafeArea,
  updateBroadcastOutput,
  updateBroadcastOutputHeartbeat,
  validateBroadcastOutput,
  validateOutputProjection
} from "../js/broadcast/broadcastOutput.js";
import {
  createInitialBroadcastState,
  setGraphicState,
  setPreviewState,
  setProgramState
} from "../js/broadcast/broadcastState.js";
import { buildBroadcastDataContract } from "../js/broadcast/dataContract.js";

const T0 = "2026-07-13T12:00:00.000Z";
const T1 = "2026-07-13T12:00:05.000Z";
const T2 = "2026-07-13T12:00:10.000Z";
const T_STALE = "2026-07-13T12:00:21.000Z";

function expectCode(callback, code) {
  assert.throws(callback, (error) => error?.code === code, `Expected error code ${code}`);
}

function cleanup(...ids) {
  ids.forEach((id) => removeBroadcastOutput(id));
}

assert.equal(BROADCAST_OUTPUT_VERSION, "1.0.0");
assert.deepEqual(BROADCAST_OUTPUT_TYPES, [
  "preview",
  "program",
  "browser",
  "obs",
  "vmix",
  "wirecast",
  "streamlabs",
  "led",
  "locutor_monitor",
  "mobile_monitor",
  "api"
]);
assert.deepEqual(BROADCAST_OUTPUT_STATUSES, [
  "unregistered",
  "offline",
  "connecting",
  "online",
  "stale",
  "degraded",
  "error",
  "disabled"
]);
assert.deepEqual(BROADCAST_OUTPUT_VISIBILITIES, ["public", "production", "operational", "restricted"]);
assert.equal(BROADCAST_OUTPUT_CAPABILITIES.length, 16);

// Creation and normalization preserve valid falsey values without mutating input.
const creationSource = {
  id: "output_create",
  name: "",
  type: "obs",
  status: "offline",
  enabled: false,
  visibility: "production",
  resolution: { width: 1280, height: 720, pixelRatio: 1, refreshRate: 0 },
  safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
  capabilities: { interaction: false, audio: false, supportedFormats: ["html", "html"] },
  latency: 0,
  themeId: "",
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  competitionId: "equipos_completo",
  sessionId: "session_1"
};
const creationCopy = structuredClone(creationSource);
const created = createBroadcastOutput(creationSource, { now: T0, actor: { userId: "operator_1", role: "production" } });
assert.deepEqual(creationSource, creationCopy);
assert.equal(created.outputVersion, "1.0.0");
assert.equal(created.name, "");
assert.equal(created.enabled, false);
assert.equal(created.latency, 0);
assert.equal(created.themeId, "");
assert.equal(created.safeArea.top, 0);
assert.equal(created.capabilities.interaction, false);
assert.deepEqual(created.capabilities.supportedFormats, ["html"]);
assert.equal(created.resolution.refreshRate, null);
assert.equal(created.orientation, "landscape");
assert.equal(created.aspectRatio, "16:9");
assert.equal(created.createdBy.userId, "operator_1");
assert.equal(validateBroadcastOutput(created).valid, true);

const generated = createBroadcastOutput({ type: "browser" }, { now: T0, random: () => 0.25 });
assert.match(generated.id, /^output_\d+_/);
assert.equal(generated.projection.view, "program");
assert.equal(generated.visibility, "production");

for (const type of BROADCAST_OUTPUT_TYPES) {
  const typed = createBroadcastOutput({ id: `type_${type}`, type }, { now: T0 });
  assert.equal(typed.type, type);
  assert.equal(validateBroadcastOutput(typed).valid, true);
}
for (const status of BROADCAST_OUTPUT_STATUSES) {
  const statusOutput = createBroadcastOutput({
    id: `status_${status}`,
    status,
    heartbeat: { at: T0, status: ["unregistered", "disabled"].includes(status) ? "offline" : status }
  }, { now: T0 });
  assert.equal(statusOutput.status, status);
}

// Registry operations are isolated, revisioned and return defensive copies.
const registryId = "output_registry";
cleanup(registryId);
const registered = registerBroadcastOutput({
  id: registryId,
  name: "Program principal",
  type: "obs",
  status: "offline",
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  competitionId: "equipos_completo",
  sessionId: "session_1"
}, { now: T0, actor: "operator_1" });
assert.equal(registered.revision, 0);
expectCode(() => registerBroadcastOutput({ id: registryId }, { now: T0 }), "output-already-registered");

const retrieved = getBroadcastOutput(registryId);
retrieved.name = "Mutated outside registry";
retrieved.capabilities.audio = true;
assert.equal(getBroadcastOutput(registryId).name, "Program principal");
assert.equal(getBroadcastOutput(registryId).capabilities.audio, false);

const updated = updateBroadcastOutput(registryId, {
  name: "",
  latency: 0
}, { now: T1, expectedRevision: 0, actor: { userId: "operator_2" } });
assert.equal(updated.revision, 1);
assert.equal(updated.name, "");
assert.equal(updated.latency, 0);
assert.equal(updated.createdAt, T0);
assert.equal(updated.updatedAt, T1);
assert.equal(updated.updatedBy.userId, "operator_2");
const immutableBaseline = getBroadcastOutput(registryId);
const immutableSourceCopy = structuredClone(updated);
for (const [field, value] of [
  ["id", "other_output"],
  ["outputId", "other_output"],
  ["outputVersion", "2.0.0"],
  ["createdAt", T2],
  ["createdBy", { userId: "intruder" }]
]) {
  const rejectedPatch = { [field]: value, name: "must not apply atomically" };
  const rejectedPatchCopy = structuredClone(rejectedPatch);
  expectCode(
    () => updateBroadcastOutput(registryId, rejectedPatch, { now: T2 }),
    `output-patch-field-forbidden:${field}`
  );
  assert.deepEqual(rejectedPatch, rejectedPatchCopy);
  assert.deepEqual(getBroadcastOutput(registryId), immutableBaseline);
}
assert.deepEqual(updated, immutableSourceCopy);
expectCode(
  () => updateBroadcastOutput(registryId, { name: "must not apply" }, { now: T2, expectedRevision: 0 }),
  "output-expected-revision-mismatch"
);
assert.equal(getBroadcastOutput(registryId).name, "");
expectCode(() => updateBroadcastOutput(registryId, { id: "other" }), "output-patch-field-forbidden:id");
expectCode(() => updateBroadcastOutput(registryId, { type: "unknown" }), "output-type-invalid");

assert.equal(listBroadcastOutputs({ tenantId: "tenant_1", tournamentId: "torneo_1" }).some((item) => item.id === registryId), true);
assert.equal(listBroadcastOutputs({ tenantId: "tenant_2" }).some((item) => item.id === registryId), false);

// Capabilities, layers, theme, resolution and safe area use controlled setters.
let configured = setBroadcastOutputCapabilities(registryId, {
  transparency: true,
  audio: false,
  maxWidth: 3840,
  maxHeight: 2160,
  supportedFormats: ["html", "rgba"]
}, { now: T2 });
assert.equal(configured.capabilities.transparency, true);
assert.equal(configured.capabilities.audio, false);
assert.deepEqual(configured.capabilities.supportedFormats, ["html", "rgba"]);
expectCode(() => setBroadcastOutputCapabilities(registryId, { unsupported: true }), "output-capability-not-supported:unsupported");
expectCode(
  () => setBroadcastOutputCapabilities(registryId, { animation: { enabled: true, maxFPS: 60 } }),
  "output-capability-animation-invalid"
);

configured = assignLayersToOutput(registryId, ["scoreboard", "alerts", "scoreboard"], { now: T2 });
assert.deepEqual(configured.assignedLayers, ["scoreboard", "alerts"]);
configured = assignThemeToOutput(registryId, "gold", { now: T2 });
assert.equal(configured.themeId, "gold");
configured = setOutputResolution(registryId, {
  width: 1080,
  height: 1920,
  pixelRatio: 2,
  refreshRate: 60
}, { now: T2 });
assert.equal(configured.orientation, "portrait");
assert.equal(configured.aspectRatio, "9:16");
assert.equal(configured.resolution.pixelRatio, 2);
configured = setOutputSafeArea(registryId, {
  top: 0.05,
  right: 0,
  bottom: 0.1,
  left: 0,
  unit: "normalized"
}, { now: T2 });
assert.equal(configured.safeArea.top, 0.05);
assert.equal(configured.safeArea.right, 0);
expectCode(() => setOutputResolution(registryId, { width: 0 }), "output-width-invalid");
expectCode(() => setOutputResolution(registryId, { width: Number.POSITIVE_INFINITY }), "output-width-invalid");
expectCode(() => setOutputSafeArea(registryId, { top: 1.1, unit: "normalized" }), "output-safe-area-top-invalid");
expectCode(() => setOutputSafeArea(registryId, { top: 2 }), "output-safe-area-top-invalid");

// Heartbeat has monotonic sequence and stale detection without opening connections.
const heartbeat = updateBroadcastOutputHeartbeat(registryId, {
  at: T1,
  status: "online",
  source: "obs-adapter",
  version: "30.1",
  lastError: "",
  latency: 0
}, { now: T1 });
assert.equal(heartbeat.status, "online");
assert.equal(heartbeat.heartbeat.sequence, 1);
assert.equal(heartbeat.heartbeat.lastError, "");
assert.equal(heartbeat.latency, 0);
assert.equal(isBroadcastOutputStale(heartbeat, { now: T2 }), false);
assert.equal(isBroadcastOutputStale(heartbeat, { now: T_STALE }), true);
assert.ok(getBroadcastOutputWarnings(heartbeat, { now: T_STALE }).includes("output-stale"));
expectCode(
  () => updateBroadcastOutputHeartbeat(registryId, { at: T2, status: "online", sequence: 1 }, { now: T2 }),
  "heartbeat-sequence-out-of-order"
);
expectCode(
  () => updateBroadcastOutputHeartbeat(registryId, { at: T2, status: "online", sequence: -1 }, { now: T2 }),
  "heartbeat-sequence-invalid"
);
const degraded = updateBroadcastOutputHeartbeat(registryId, {
  at: T2,
  status: "degraded",
  sequence: 2,
  lastError: "High latency"
}, { now: T2 });
assert.equal(degraded.status, "degraded");
assert.ok(getBroadcastOutputWarnings(degraded, { now: T2 }).includes("output-degraded"));
const heartbeatBaseline = getBroadcastOutput(registryId);
expectCode(
  () => updateBroadcastOutputHeartbeat(registryId, { at: T2, status: "online", sequence: 2 }, { now: T2 }),
  "heartbeat-sequence-out-of-order"
);
expectCode(
  () => updateBroadcastOutputHeartbeat(registryId, { at: T2, status: "online", sequence: 1 }, { now: T2 }),
  "heartbeat-sequence-out-of-order"
);
expectCode(
  () => updateBroadcastOutputHeartbeat(registryId, { at: T1, status: "online" }, { now: T1 }),
  "heartbeat-timestamp-out-of-order"
);
assert.deepEqual(getBroadcastOutput(registryId), heartbeatBaseline);
const disabled = setBroadcastOutputStatus(registryId, "disabled", { now: T2 });
assert.equal(disabled.enabled, false);
assert.equal(isBroadcastOutputStale(disabled, { now: T_STALE }), false);
expectCode(() => setBroadcastOutputStatus(registryId, "connected"), "output-status-invalid");

// Build independent Preview and Program views from Broadcast State.
let broadcastState = createInitialBroadcastState({
  now: T0,
  session: { id: "broadcast_session", tournamentId: "torneo_1", competitionId: "equipos_completo" },
  contextRef: { contractVersion: "1.0.0", tournamentId: "torneo_1" }
});
broadcastState = setGraphicState(broadcastState, "graphic_preview", {
  templateId: "scoreboard_preview",
  layerId: "scoreboard",
  visible: true,
  outputIds: ["preview_projection"]
}, { now: T0 });
broadcastState = setGraphicState(broadcastState, "graphic_program", {
  templateId: "alert_program",
  layerId: "alerts",
  visible: true,
  outputIds: ["program_projection", "public_projection"]
}, { now: T0 });
broadcastState = setPreviewState(broadcastState, {
  active: true,
  compositionId: "composition_preview",
  sceneId: "scene_preview",
  activeLayers: ["scoreboard"],
  visibleGraphics: ["graphic_preview"],
  outputIds: ["preview_projection"],
  templateInstances: {
    preview_scoreboard: { graphicId: "graphic_preview", layerId: "scoreboard", value: 0 }
  },
  validation: { valid: true, errors: [], warnings: [] }
}, { now: T1, actorId: "operator_1" });
broadcastState = setProgramState(broadcastState, {
  active: true,
  compositionId: "composition_program",
  sceneId: "scene_program",
  activeLayers: ["alerts"],
  visibleGraphics: ["graphic_program"],
  outputIds: ["program_projection", "public_projection"],
  templateInstances: {
    program_alert: { graphicId: "graphic_program", layerId: "alerts", visible: false, text: "" }
  }
}, { now: T2, actorId: "director_1" });

const contractSource = {
  tournament: { id: "torneo_1", name: "Torneo Output", status: "en_vivo" },
  organization: { id: "org_1", name: "Orgullo Charro", tenantId: "tenant_1", clientId: "client_private" },
  competition: {
    id: "equipos_completo",
    type: "equipos_completo",
    name: "Competencia por equipos",
    scope: "team",
    suerteIds: ["cala", "piales"]
  },
  charreada: { id: "charreada_1", name: "Charreada 1", active: true },
  team: { id: "team_1", name: "Rancho Demo", total: 0 },
  participant: { scope: "team", name: "" },
  suerte: { id: "cala", name: "Cala", active: true },
  score: { scoreId: "score_1", totalPoints: 0, published: false, judgeId: "judge_private" },
  timer: { elapsedMs: 0, running: false },
  production: { operatorId: "operator_private", operatorName: "Operador Privado", outputType: "program" },
  system: { syncStatus: "connected", diagnostics: { private: true } },
  customFields: {
    tournament: {
      publicLabel: { value: "", visibility: "public" },
      restrictedNote: { value: "private", visibility: "restricted" }
    }
  }
};
const contract = buildBroadcastDataContract(contractSource, {
  generatedAt: T2,
  now: T2,
  visibility: "restricted",
  includeLegacyAliases: true
});
const stateCopy = structuredClone(broadcastState);
const contractCopy = structuredClone(contract);

const previewOutput = createBroadcastOutput({
  id: "preview_projection",
  type: "preview",
  status: "offline",
  assignedLayers: ["scoreboard"],
  visibility: "production",
  projection: { view: "preview" }
}, { now: T2 });
const previewProjection = buildBroadcastOutputProjection(previewOutput, broadcastState, contract, { now: T2 });
assert.equal(previewProjection.broadcast.selectedView, "preview");
assert.equal(previewProjection.broadcast.compositionId, "composition_preview");
assert.equal(previewProjection.broadcast.sceneId, "scene_preview");
assert.equal(Object.hasOwn(previewProjection.broadcast, "program"), false);
assert.equal(Object.hasOwn(previewProjection.broadcast, "preview"), false);
assert.deepEqual(previewProjection.broadcast.activeLayerIds, ["scoreboard"]);
assert.deepEqual(previewProjection.broadcast.visibleGraphicIds, ["graphic_preview"]);
assert.equal(previewProjection.broadcast.templateInstances.preview_scoreboard.value, 0);
assert.equal(previewProjection.validation.valid, true);

const programOutput = createBroadcastOutput({
  id: "program_projection",
  type: "program",
  status: "offline",
  assignedLayers: ["alerts"],
  visibility: "production",
  projection: { view: "program" },
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  competitionId: "equipos_completo",
  sessionId: "broadcast_session"
}, { now: T2 });
const programOutputCopy = structuredClone(programOutput);
const programProjection = buildBroadcastOutputProjection(programOutput, broadcastState, contract, { now: T2 });
assert.equal(programProjection.broadcast.selectedView, "program");
assert.equal(programProjection.broadcast.compositionId, "composition_program");
assert.equal(programProjection.broadcast.sceneId, "scene_program");
assert.equal(programProjection.broadcast.transitionMode, "take");
assert.deepEqual(programProjection.broadcast.activeLayerIds, ["alerts"]);
assert.deepEqual(programProjection.broadcast.visibleGraphicIds, ["graphic_program"]);
assert.equal(programProjection.broadcast.templateInstances.program_alert.visible, false);
assert.equal(programProjection.broadcast.templateInstances.program_alert.text, "");
assert.equal(programProjection.output.tenantId, "tenant_1");
assert.equal(programProjection.output.organizationId, "org_1");
assert.equal(programProjection.output.sessionId, "broadcast_session");
assert.equal(programProjection.validation.valid, true);
assert.notEqual(previewProjection.broadcast.compositionId, programProjection.broadcast.compositionId);

// A public Output cannot be escalated by an options override.
const publicOutput = createBroadcastOutput({
  id: "public_projection",
  type: "browser",
  status: "offline",
  visibility: "restricted",
  assignedLayers: ["alerts"],
  projection: { view: "program", visibility: "public" },
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  competitionId: "equipos_completo",
  sessionId: "broadcast_session"
}, { now: T2 });
const publicProjection = buildBroadcastOutputProjection(publicOutput, broadcastState, contract, {
  now: T2,
  visibility: "restricted"
});
assert.equal(publicProjection.visibility, "public");
assert.equal(publicProjection.contract.visibility, "public");
assert.equal(publicProjection.contract.production?.operatorId, undefined);
assert.equal(publicProjection.contract.score?.judgeId, undefined);
assert.equal(publicProjection.contract.system?.diagnostics, undefined);
assert.equal(publicProjection.contract.customFields?.tournament?.restrictedNote, undefined);
assert.equal(publicProjection.contract.score.total, 0);
assert.equal(publicProjection.contract.score.published, false);
assert.equal(publicProjection.contract.participant.name, "");
assert.equal(publicProjection.output.tenantId, undefined);
assert.equal(publicProjection.output.organizationId, undefined);
assert.equal(publicProjection.output.tournamentId, "torneo_1");
assert.equal(publicProjection.output.competitionId, "equipos_completo");
assert.equal(publicProjection.output.sessionId, undefined);
assert.equal(validateOutputProjection(publicProjection).valid, true);

programProjection.output.resolution.width = 1;
programProjection.output.capabilities.audio = true;
programProjection.broadcast.contextRef.tournamentId = "mutated_tournament";
programProjection.broadcast.templateInstances.program_alert.text = "mutated text";
programProjection.contract.team.name = "Mutated team";
programProjection.layers[0].visible = true;
programProjection.graphics[0].templateId = "mutated_template";
assert.deepEqual(broadcastState, stateCopy);
assert.deepEqual(contract, contractCopy);
assert.deepEqual(programOutput, programOutputCopy);
assert.equal(broadcastState.program.templateInstances.program_alert.text, "");
assert.equal(contract.team.name, "Rancho Demo");
assert.equal(broadcastState.legacy.activeEngine, "v1");
assert.equal(contract.legacy.aliasesIncluded, true);

const unsafeContract = cloneBroadcastOutput(contract);
unsafeContract.production.runtimeFunction = () => "must be removed";
unsafeContract.production.runtimeSymbol = Symbol("must be removed");
unsafeContract.self = unsafeContract;
Object.defineProperty(unsafeContract.production, "__proto__", {
  value: { polluted: true },
  enumerable: true,
  configurable: true
});
const unsafeProjection = buildBroadcastOutputProjection(programOutput, broadcastState, unsafeContract, { now: T2 });
assert.doesNotThrow(() => JSON.stringify(unsafeProjection));
assert.equal(unsafeProjection.contract.production.runtimeFunction, undefined);
assert.equal(unsafeProjection.contract.production.runtimeSymbol, undefined);
assert.equal(unsafeProjection.contract.self, undefined);
assert.equal(Object.hasOwn(unsafeProjection.contract.production, "__proto__"), false);
assert.equal({}.polluted, undefined);

// Security cloning drops executable/dangerous content, controls cycles and keeps falsey values.
const unsafe = {
  zero: 0,
  disabled: false,
  empty: "",
  infinite: Number.POSITIVE_INFINITY,
  oversized: Array.from({ length: 300 }, (_, index) => index),
  fn: () => "not serializable",
  symbol: Symbol("not serializable"),
  nested: { value: 1 }
};
unsafe.self = unsafe;
let getterCalled = false;
Object.defineProperties(unsafe.nested, {
  ["__proto__"]: { value: { polluted: true }, enumerable: true, configurable: true },
  constructor: { value: { polluted: true }, enumerable: true, configurable: true },
  prototype: { value: { polluted: true }, enumerable: true, configurable: true },
  accessor: {
    get() {
      getterCalled = true;
      return "must not execute";
    },
    enumerable: true,
    configurable: true
  }
});
const safeClone = cloneBroadcastOutput(unsafe);
assert.equal(safeClone.zero, 0);
assert.equal(safeClone.disabled, false);
assert.equal(safeClone.empty, "");
assert.equal(safeClone.infinite, null);
assert.equal(safeClone.oversized.length, 250);
assert.equal(Object.hasOwn(safeClone, "fn"), false);
assert.equal(Object.hasOwn(safeClone, "symbol"), false);
assert.equal(safeClone.self, null);
assert.equal(Object.hasOwn(safeClone.nested, "__proto__"), false);
assert.equal(Object.hasOwn(safeClone.nested, "constructor"), false);
assert.equal(Object.hasOwn(safeClone.nested, "prototype"), false);
assert.equal(Object.hasOwn(safeClone.nested, "accessor"), false);
assert.equal(getterCalled, false);
assert.equal({}.polluted, undefined);

const tooDeep = { id: "deep_output" };
let cursor = tooDeep;
for (let index = 0; index < 20; index += 1) {
  cursor.next = {};
  cursor = cursor.next;
}
const deepClone = cloneBroadcastOutput(tooDeep);
let observedDepth = 0;
cursor = deepClone;
while (cursor?.next && observedDepth < 30) {
  observedDepth += 1;
  cursor = cursor.next;
}
assert.ok(observedDepth <= 13);

assert.equal(validateOutputProjection({}).valid, false);
assert.equal(normalizeBroadcastOutput({ id: "normalize_only", type: "unknown" }, { now: T0 }).type, "browser");
expectCode(
  () => buildBroadcastOutputProjection({ ...programOutput, enabled: false }, broadcastState, contract, { now: T2 }),
  "output-disabled"
);
expectCode(
  () => buildBroadcastOutputProjection({
    ...programOutput,
    projection: { ...programOutput.projection, enabled: false }
  }, broadcastState, contract, { now: T2 }),
  "output-projection-disabled"
);

const removed = removeBroadcastOutput(registryId);
assert.equal(removed.id, registryId);
assert.equal(getBroadcastOutput(registryId), null);
assert.equal(removeBroadcastOutput(registryId), null);

console.log("broadcast-output.test.mjs: OK");
