import assert from "node:assert/strict";
import {
  BROADCAST_STATE_VERSION,
  applyBroadcastStatePatch,
  clearPreviewState,
  clearProgramState,
  cloneBroadcastState,
  createInitialBroadcastState,
  dequeueBroadcastItem,
  enqueueBroadcastItem,
  getActiveLayers,
  getBroadcastQueue,
  getBroadcastStateRevision,
  getBroadcastStateWarnings,
  getVisibleGraphics,
  normalizeBroadcastState,
  promotePreviewToProgram,
  setBroadcastContextRef,
  setGraphicState,
  setLayerState,
  setOutputState,
  setPreviewState,
  setProgramState,
  validateBroadcastState
} from "../js/broadcast/broadcastState.js";

const T0 = "2026-07-13T12:00:00.000Z";
const T1 = "2026-07-13T12:00:01.000Z";
const T2 = "2026-07-13T12:00:02.000Z";
const T3 = "2026-07-13T12:00:03.000Z";
const T4 = "2026-07-13T12:00:04.000Z";

function initial(overrides = {}) {
  return createInitialBroadcastState({
    now: T0,
    session: {
      id: "session_1",
      tournamentId: "torneo_1",
      competitionId: "equipos_completo",
      outputIds: ["program_1"],
      status: "active",
      recoverable: true
    },
    contextRef: {
      contractVersion: "1.0.0",
      contractRevision: 4,
      generatedAt: T0,
      freshness: "current",
      tournamentId: "torneo_1",
      competitionId: "equipos_completo",
      charreadaId: "charreada_1",
      teamId: "equipo_1",
      suerteId: "cala",
      sourceType: "broadcastContext"
    },
    ...overrides
  });
}

function expectCode(callback, code) {
  assert.throws(callback, (error) => error?.name === "BroadcastStateError" && error?.code === code);
}

// Initial state and normalization.
const options = {
  now: T0,
  session: { id: "session_options", tournamentId: "torneo_options", outputIds: ["program_1"] },
  selection: { opacity: 0, autoHide: false, payloadBindings: { label: "" } }
};
const optionsCopy = structuredClone(options);
const base = createInitialBroadcastState(options);
assert.deepEqual(options, optionsCopy);
assert.equal(BROADCAST_STATE_VERSION, "1.0.0");
assert.equal(base.stateVersion, "1.0.0");
assert.equal(base.revision, 0);
assert.equal(base.createdAt, T0);
assert.equal(base.updatedAt, T0);
assert.equal(base.preview.active, false);
assert.equal(base.program.active, false);
assert.equal(base.selection.opacity, 0);
assert.equal(base.selection.autoHide, false);
assert.equal(base.selection.payloadBindings.label, "");
assert.deepEqual(Object.keys(base.layers), [
  "background",
  "scoreboard",
  "turn",
  "score",
  "timer",
  "alerts",
  "sponsors",
  "fullscreen",
  "emergency"
]);
assert.equal(validateBroadcastState(base).valid, true);

const recovered = createInitialBroadcastState({
  now: T0,
  recovery: true,
  session: { id: "session_recovery", tournamentId: "torneo_1", recoveryRequired: true },
  program: { active: true, status: "on_air", outputIds: ["program_1"] }
});
assert.equal(recovered.program.active, false);
assert.equal(recovered.program.status, "inactive");
assert.ok(getBroadcastStateWarnings(recovered).includes("recovery-required"));
assert.ok(recovered.warnings.includes("program-recovery-cleared"));
const blockedInitialProgram = createInitialBroadcastState({
  now: T0,
  session: { id: "session_initial", tournamentId: "torneo_1" },
  program: { active: true, status: "on_air", outputIds: ["program_1"] }
});
assert.equal(blockedInitialProgram.program.active, false);
assert.ok(blockedInitialProgram.warnings.includes("program-initialization-blocked"));

// Selection is independent from Preview and Program.
const selected = applyBroadcastStatePatch(initial(), {
  selection: {
    templateId: "scoreboard_v2",
    variantId: "compact",
    outputIds: ["preview_1"],
    position: { x: 0, y: 0, unit: "%" },
    size: { width: 0, height: 320, unit: "px" },
    scale: 1,
    opacity: 0,
    autoHide: false,
    payloadBindings: { title: "" }
  }
}, { now: T1, expectedRevision: 0 });
assert.equal(selected.revision, 1);
assert.equal(selected.selection.templateId, "scoreboard_v2");
assert.equal(selected.selection.opacity, 0);
assert.equal(selected.selection.size.width, 0);
assert.equal(selected.selection.autoHide, false);
assert.equal(selected.selection.payloadBindings.title, "");
assert.equal(selected.preview.active, false);
assert.equal(selected.program.active, false);
assert.equal(base.selection.templateId, null);
expectCode(
  () => applyBroadcastStatePatch(selected, { selection: { themeId: "gold" } }, { now: T2, expectedRevision: 0 }),
  "expected-revision-mismatch"
);
expectCode(
  () => applyBroadcastStatePatch(selected, { selection: { scale: -1 } }, { now: T2 }),
  "state-transition-invalid"
);
expectCode(
  () => applyBroadcastStatePatch(selected, { stateVersion: "2.0.0" }, { now: T2 }),
  "patch-route-not-allowed:stateVersion"
);

// Generic patches cannot bypass block-specific setters or touch Program.
const protectedState = initial();
const protectedCopy = structuredClone(protectedState);
const forbiddenProgramPatches = [
  { active: true },
  { status: "on_air" },
  { visibleGraphics: ["graphic_1"] },
  { activeLayers: ["scoreboard"] },
  { outputIds: ["program_1"] },
  { takenAt: T1 },
  { takenBy: "director_1" }
];
for (const programPatch of forbiddenProgramPatches) {
  expectCode(
    () => applyBroadcastStatePatch(protectedState, { program: programPatch }, { now: T1 }),
    "program-patch-forbidden"
  );
  assert.deepEqual(protectedState, protectedCopy);
}
for (const path of ["program.active", "program.status", "program.visibleGraphics.0"]) {
  expectCode(
    () => applyBroadcastStatePatch(protectedState, { [path]: true }, { now: T1 }),
    "program-patch-forbidden"
  );
}
expectCode(
  () => applyBroadcastStatePatch(protectedState, {
    selection: { templateId: "must_not_apply" },
    program: { active: true }
  }, { now: T1 }),
  "program-patch-forbidden"
);
assert.deepEqual(protectedState, protectedCopy);
assert.equal(protectedState.revision, 0);
assert.equal(protectedState.createdAt, T0);
assert.equal(protectedState.updatedAt, T0);
for (const root of ["preview", "layers", "graphics", "outputs", "queue", "contextRef"]) {
  expectCode(
    () => applyBroadcastStatePatch(protectedState, { [root]: {} }, { now: T1 }),
    `patch-route-not-allowed:${root}`
  );
}

// Preview lifecycle never changes Program.
const preview = setPreviewState(initial(), {
  active: true,
  compositionId: "composition_1",
  sceneId: "scene_scoreboard",
  templateInstances: {
    scoreboard: { instanceId: "scoreboard", graphicId: "scoreboard_graphic", layerId: "scoreboard" }
  },
  visibleGraphics: ["scoreboard_graphic"],
  activeLayers: ["scoreboard"],
  outputIds: ["preview_1"],
  themeId: "gold",
  validation: { valid: true, errors: [], warnings: [] }
}, { now: T1, actor: { userId: "operator_1" }, expectedRevision: 0 });
assert.equal(preview.preview.active, true);
assert.equal(preview.preview.preparedBy, "operator_1");
assert.equal(preview.preview.status, "ready");
assert.equal(preview.program.active, false);
const previewCleared = clearPreviewState(preview, { now: T2, actorId: "operator_1" });
assert.equal(previewCleared.preview.active, false);
assert.equal(previewCleared.preview.clearedAt, T2);
assert.equal(previewCleared.program.active, false);

// Program can be controlled directly only through its state function.
const program = setProgramState(initial(), {
  active: true,
  compositionId: "program_composition",
  outputIds: ["program_1"],
  activeLayers: ["scoreboard"],
  visibleGraphics: ["scoreboard_graphic"]
}, { now: T1, actorId: "director_1" });
assert.equal(program.program.active, true);
assert.equal(program.program.takenBy, "director_1");
assert.equal(program.program.takenAt, T1);
assert.equal(program.program.status, "on_air");
assert.equal(program.program.transitionMode, "take");
expectCode(() => setProgramState(program, { draft: true }, { now: T2 }), "program-state-not-authorized");
expectCode(
  () => setProgramState(program, { active: false }, { now: T2, actorId: "director_1" }),
  "program-clear-required"
);
expectCode(
  () => setProgramState(initial(), { active: true, outputIds: ["program_1"] }, { now: T1 }),
  "program-actor-required"
);
expectCode(
  () => setProgramState(initial(), {
    active: true,
    outputIds: ["program_1"],
    takenBy: "untrusted_payload_actor"
  }, { now: T1 }),
  "program-actor-required"
);
expectCode(
  () => setProgramState(initial(), { active: true }, { now: T1, actorId: "director_1" }),
  "program-output-required"
);

const stableProgram = structuredClone(program.program);
const nonProgramTransitions = [
  applyBroadcastStatePatch(program, { selection: { templateId: "selection_only" } }, { now: T2 }),
  setPreviewState(program, {
    active: true,
    outputIds: ["preview_1"],
    validation: { valid: true }
  }, { now: T2, actorId: "operator_1" }),
  clearPreviewState(program, { now: T2, actorId: "operator_1" }),
  setLayerState(program, "alerts", { visible: true, graphicIds: ["alert_1"] }, { now: T2 }),
  setGraphicState(program, "alert_1", { templateId: "alert", layerId: "alerts" }, { now: T2 }),
  setOutputState(program, "program_1", {
    type: "program",
    status: "connected",
    heartbeat: { at: T2, status: "ok" }
  }, { now: T2 }),
  setBroadcastContextRef(program, { tournamentId: "torneo_1", freshness: "current" }, { now: T2 }),
  enqueueBroadcastItem(program, { queueItemId: "program_guard_queue", priority: 1 }, { now: T2 }),
  normalizeBroadcastState(program, { now: T2 })
];
nonProgramTransitions.forEach((nextState) => assert.deepEqual(nextState.program, stableProgram));

// Preview promotion supports take, cut and auto and never mutates its source.
for (const mode of ["take", "cut", "auto"]) {
  const source = setPreviewState(initial(), {
    active: true,
    compositionId: `composition_${mode}`,
    sceneId: "scene_1",
    outputIds: ["program_1"],
    activeLayers: ["scoreboard"],
    visibleGraphics: ["scoreboard_graphic"],
    validation: { valid: true }
  }, { now: T1 });
  const sourceCopy = structuredClone(source);
  const promoted = promotePreviewToProgram(source, {
    now: T2,
    mode,
    actor: { userId: "director_1" },
    expectedRevision: source.revision
  });
  assert.deepEqual(source, sourceCopy);
  assert.equal(promoted.program.active, true);
  assert.equal(promoted.program.transitionMode, mode);
  assert.equal(promoted.program.takenBy, "director_1");
  assert.equal(promoted.program.compositionId, `composition_${mode}`);
  assert.equal(promoted.revision, source.revision + 1);
}
const invalidPreview = setPreviewState(initial(), {
  active: true,
  outputIds: ["program_1"],
  validation: { valid: false, errors: ["template-missing"] }
}, { now: T1 });
expectCode(() => promotePreviewToProgram(invalidPreview, { now: T2 }), "preview-has-blocking-errors");
expectCode(() => promotePreviewToProgram(initial(), { now: T1 }), "preview-not-active");
const validPreviewWithoutActor = setPreviewState(initial(), {
  active: true,
  outputIds: ["program_1"],
  validation: { valid: true }
}, { now: T1 });
expectCode(
  () => promotePreviewToProgram(validPreviewWithoutActor, { now: T2 }),
  "program-actor-required"
);
const validPreviewWithoutOutput = setPreviewState(initial(), {
  active: true,
  validation: { valid: true }
}, { now: T1 });
expectCode(
  () => promotePreviewToProgram(validPreviewWithoutOutput, { now: T2, actorId: "director_1" }),
  "program-output-required"
);

// Layers, locked Program content and effective exclusive projections.
let layered = initial();
layered = setGraphicState(layered, "scoreboard_graphic", {
  templateId: "scoreboard_v2",
  layerId: "scoreboard",
  visible: true,
  status: "visible",
  outputIds: ["program_1"]
}, { now: T1 });
layered = setLayerState(layered, "scoreboard", {
  visible: true,
  locked: true,
  status: "visible",
  graphicIds: ["scoreboard_graphic"],
  outputIds: ["program_1"]
}, { now: T2 });
layered = setProgramState(layered, {
  active: true,
  activeLayers: ["scoreboard"],
  lockedLayers: ["scoreboard"],
  visibleGraphics: ["scoreboard_graphic"],
  outputIds: ["program_1"],
  templateInstances: {
    scoreboard: { graphicId: "scoreboard_graphic", layerId: "scoreboard" }
  }
}, { now: T3, actorId: "director_1" });
expectCode(() => setLayerState(layered, "scoreboard", { visible: false }, { now: T4 }), "layer-locked:scoreboard");
const clearLocked = clearProgramState(layered, { now: T4 });
assert.equal(clearLocked.program.active, true);
assert.deepEqual(clearLocked.program.lockedLayers, ["scoreboard"]);
assert.deepEqual(clearLocked.program.visibleGraphics, ["scoreboard_graphic"]);
const replacementPreview = setPreviewState(layered, {
  active: true,
  compositionId: "alerts_only",
  activeLayers: ["alerts"],
  visibleGraphics: ["alerts_graphic"],
  outputIds: ["program_1"],
  validation: { valid: true }
}, { now: T4 });
const promotedWithLock = promotePreviewToProgram(replacementPreview, { now: T4, mode: "cut", actorId: "director_1" });
assert.ok(promotedWithLock.program.activeLayers.includes("scoreboard"));
assert.ok(promotedWithLock.program.visibleGraphics.includes("scoreboard_graphic"));
assert.deepEqual(promotedWithLock.program.lockedLayers, ["scoreboard"]);
const forceCleared = clearProgramState(layered, { now: T4, force: true });
assert.equal(forceCleared.program.active, false);
assert.deepEqual(forceCleared.program.lockedLayers, []);

let exclusive = setLayerState(initial(), "scoreboard", {
  visible: true,
  graphicIds: ["scoreboard_graphic"]
}, { now: T1, actorId: "director_1" });
exclusive = setLayerState(exclusive, "timer", {
  visible: true,
  graphicIds: ["timer_graphic"]
}, { now: T2 });
assert.deepEqual(getActiveLayers(exclusive).map((layer) => layer.id), ["scoreboard", "timer"]);
exclusive = setLayerState(exclusive, "fullscreen", {
  visible: true,
  graphicIds: ["fullscreen_graphic"]
}, { now: T3, actorId: "director_1" });
assert.deepEqual(getActiveLayers(exclusive).map((layer) => layer.id), ["fullscreen"]);
assert.equal(exclusive.layers.scoreboard.visible, true);
exclusive = setLayerState(exclusive, "emergency", {
  visible: true,
  graphicIds: ["emergency_graphic"]
}, { now: T4 });
assert.deepEqual(getActiveLayers(exclusive).map((layer) => layer.id), ["emergency"]);
assert.ok(getBroadcastStateWarnings(exclusive).includes("emergency-active"));

const emergencyProgram = setProgramState(initial(), {
  active: true,
  outputIds: ["program_1"],
  emergencyMode: true,
  activeLayers: ["emergency"]
}, { now: T1, actorId: "director_1" });
expectCode(() => clearProgramState(emergencyProgram, { now: T2 }), "program-emergency-active");
expectCode(
  () => setProgramState(emergencyProgram, { active: false }, { now: T2, actorId: "director_1" }),
  "program-emergency-active"
);
assert.equal(clearProgramState(emergencyProgram, { now: T2, force: true }).program.active, false);

// Graphic geometry and visibility.
let graphicsState = setLayerState(initial(), "scoreboard", {
  visible: true,
  graphicIds: ["graphic_1"],
  outputIds: ["program_1"]
}, { now: T1 });
graphicsState = setGraphicState(graphicsState, "graphic_1", {
  templateId: "scoreboard_v2",
  layerId: "scoreboard",
  visible: true,
  status: "visible",
  position: { x: 0, y: 0, anchor: "bottom-left", unit: "%" },
  size: { width: 0, height: 300, unit: "px" },
  scale: 1,
  opacity: 0,
  rotation: 0,
  autoHide: false,
  payloadBindings: { subtitle: "" },
  outputIds: ["program_1"]
}, { now: T2 });
assert.equal(graphicsState.graphics.graphic_1.opacity, 0);
assert.equal(graphicsState.graphics.graphic_1.size.width, 0);
assert.equal(graphicsState.graphics.graphic_1.autoHide, false);
assert.equal(graphicsState.graphics.graphic_1.payloadBindings.subtitle, "");
assert.deepEqual(getVisibleGraphics(graphicsState, "program_1").map((graphic) => graphic.graphicId), ["graphic_1"]);
expectCode(() => setGraphicState(graphicsState, "bad_scale", { scale: 0 }, { now: T3 }), "graphic-scale-invalid");
expectCode(() => setGraphicState(graphicsState, "bad_opacity", { opacity: 2 }, { now: T3 }), "graphic-opacity-invalid");
expectCode(() => setGraphicState(graphicsState, "bad_position", { position: { x: Number.NaN } }, { now: T3 }), "graphic-position-invalid:x");
expectCode(() => setGraphicState(graphicsState, "bad_size", { size: { width: -1 } }, { now: T3 }), "graphic-size-invalid:width");

// Output lifecycle, stale heartbeat and revision warnings.
let outputs = setOutputState(initial(), "program_1", {
  name: "Program",
  type: "program",
  status: "connected",
  heartbeat: { at: T1, status: "ok" },
  lastAppliedRevision: 0,
  assignedLayers: ["scoreboard"],
  capabilities: { alpha: false }
}, { now: T2, outputStaleAfterMs: 5000 });
assert.equal(outputs.outputs.program_1.stale, false);
assert.equal(outputs.outputs.program_1.capabilities.alpha, false);
outputs = setProgramState(outputs, {
  active: true,
  outputIds: ["program_1"],
  activeLayers: ["scoreboard"]
}, { now: T3, actorId: "director_1" });
assert.ok(getBroadcastStateWarnings(outputs).includes("program-revision-not-applied:program_1"));
const staleOutput = setOutputState(outputs, "program_1", {
  status: "connected",
  heartbeat: { at: T0, status: "ok" },
  lastAppliedRevision: outputs.program.revision
}, { now: "2026-07-13T12:01:00.000Z", outputStaleAfterMs: 5000 });
assert.equal(staleOutput.outputs.program_1.stale, true);
assert.ok(getBroadcastStateWarnings(staleOutput).includes("output-stale:program_1"));
const disconnected = setOutputState(outputs, "program_1", { status: "disconnected" }, { now: T4 });
assert.ok(getBroadcastStateWarnings(disconnected).includes("output-disconnected:program_1"));

// Queue: priority, FIFO, expiration and dequeue.
let queued = initial();
queued = enqueueBroadcastItem(queued, {
  queueItemId: "low",
  type: "graphic",
  priority: 1,
  queuedAt: T1,
  outputIds: ["program_1"]
}, { now: T1, actorId: "director_1" });
queued = enqueueBroadcastItem(queued, {
  queueItemId: "high_first",
  type: "graphic",
  priority: 10,
  queuedAt: T2,
  outputIds: ["program_1"]
}, { now: T2 });
queued = enqueueBroadcastItem(queued, {
  queueItemId: "high_second",
  type: "graphic",
  priority: 10,
  queuedAt: T3,
  outputIds: ["program_1"]
}, { now: T3 });
queued = enqueueBroadcastItem(queued, {
  queueItemId: "expired",
  type: "graphic",
  priority: 100,
  queuedAt: T0,
  expiresAt: T1,
  outputIds: ["program_1"]
}, { now: T2 });
assert.deepEqual(getBroadcastQueue(queued).map((item) => item.queueItemId), ["expired", "high_first", "high_second", "low"]);
assert.equal(getBroadcastQueue(queued)[0].status, "expired");
assert.ok(getBroadcastStateWarnings(queued).includes("queue-item-expired:expired"));
const dequeued = dequeueBroadcastItem(queued, { now: T4 });
assert.equal(dequeued.queue.some((item) => item.queueItemId === "high_first"), false);
assert.equal(dequeued.queue.some((item) => item.queueItemId === "high_second"), true);
assert.equal(dequeueBroadcastItem(dequeued, { now: T4, queueItemId: "expired" }).revision, dequeued.revision);

// Context references stay minimal and never change Program by side effect.
const contextBase = setProgramState(initial(), {
  active: true,
  compositionId: "program_stable",
  outputIds: ["program_1"]
}, { now: T1, actorId: "director_1" });
const contextUpdated = setBroadcastContextRef(contextBase, {
  contractVersion: "1.0.0",
  contractRevision: 5,
  generatedAt: T2,
  freshness: "stale",
  tournamentId: "torneo_1",
  competitionId: "charro_completo",
  participantId: "participante_1",
  suerteId: "piales",
  sourceType: "broadcastContract",
  tournament: { largeContractBlock: true }
}, { now: T3 });
assert.equal(contextUpdated.contextRef.contractRevision, 5);
assert.equal(contextUpdated.contextRef.participantId, "participante_1");
assert.equal(Object.hasOwn(contextUpdated.contextRef, "tournament"), false);
assert.equal(contextUpdated.program.compositionId, "program_stable");
assert.ok(getBroadcastStateWarnings(contextUpdated).includes("context-stale"));

const recoveredProgram = normalizeBroadcastState(program, { now: T2, recovery: true });
assert.equal(program.program.active, true);
assert.equal(recoveredProgram.program.active, false);
assert.equal(recoveredProgram.program.status, "inactive");
assert.deepEqual(recoveredProgram.program.outputIds, []);
assert.ok(recoveredProgram.warnings.includes("program-recovery-cleared"));

// Legacy V1/V2 ownership remains explicit and never activates fallback.
const legacy = createInitialBroadcastState({
  now: T0,
  session: { id: "session_legacy", tournamentId: "torneo_1" },
  legacy: {
    enabled: true,
    activeEngine: "v1",
    v1OutputIds: ["program_1"],
    v2OutputIds: ["program_1"],
    fallbackAvailable: true,
    fallbackReason: "manual-only"
  }
});
assert.equal(legacy.legacy.activeEngine, "v1");
assert.equal(legacy.program.active, false);
assert.ok(getBroadcastStateWarnings(legacy).includes("legacy-v2-output-conflict:program_1"));

// Serialization hardening: immutable source, functions, cycles, depth and dangerous keys.
const cyclic = { name: "source", falseValue: false, zeroValue: 0, emptyValue: "" };
cyclic.self = cyclic;
cyclic.fn = () => "not serializable";
cyclic.deep = {};
let cursor = cyclic.deep;
for (let index = 0; index < 20; index += 1) {
  cursor.next = {};
  cursor = cursor.next;
}
Object.defineProperty(cyclic, "__proto__", { value: { polluted: true }, enumerable: true });
const hardened = normalizeBroadcastState({
  stateVersion: "1.0.0",
  revision: 0,
  createdAt: T0,
  updatedAt: T0,
  session: { id: "session_secure", tournamentId: "torneo_1" },
  automation: { lastTrigger: cyclic }
}, { now: T0 });
assert.equal(cyclic.self, cyclic);
assert.equal(hardened.automation.lastTrigger.falseValue, false);
assert.equal(hardened.automation.lastTrigger.zeroValue, 0);
assert.equal(hardened.automation.lastTrigger.emptyValue, "");
assert.equal(Object.hasOwn(hardened.automation.lastTrigger, "fn"), false);
assert.equal(Object.hasOwn(hardened.automation.lastTrigger, "self"), false);
assert.equal(Object.hasOwn(hardened.automation.lastTrigger, "__proto__"), false);
assert.equal(Object.prototype.polluted, undefined);
assert.ok(hardened.warnings.some((warning) => warning.startsWith("circular-reference-removed:")));
assert.ok(hardened.warnings.some((warning) => warning.startsWith("non-serializable-removed:")));
assert.ok(hardened.warnings.some((warning) => warning.startsWith("depth-limited:")));
assert.ok(hardened.warnings.some((warning) => warning.startsWith("dangerous-key-removed:")));
const sharedValue = { label: "shared" };
const sharedClone = cloneBroadcastState({ left: sharedValue, right: sharedValue });
assert.deepEqual(sharedClone.left, { label: "shared" });
assert.deepEqual(sharedClone.right, { label: "shared" });
assert.notEqual(sharedClone.left, sharedClone.right);
const truncated = normalizeBroadcastState({
  ...initial(),
  messages: { channels: Array.from({ length: 300 }, (_, index) => ({ id: `channel_${index}` })) }
}, { now: T0 });
assert.equal(truncated.messages.channels.length, 250);
assert.ok(truncated.warnings.some((warning) => warning.startsWith("array-truncated:")));
assert.ok(getBroadcastStateWarnings({ ...initial(), revision: -1 }).includes("revision-invalid"));
expectCode(
  () => applyBroadcastStatePatch(initial(), JSON.parse('{"__proto__":{"polluted":true}}'), { now: T1 }),
  "patch-route-not-allowed:__proto__"
);
expectCode(
  () => applyBroadcastStatePatch(initial(), JSON.parse('{"selection":{"payloadBindings":{"constructor":{"polluted":true}}}}'), { now: T1 }),
  "dangerous-key:constructor"
);

const cloned = cloneBroadcastState(contextUpdated);
cloned.session.tournamentId = "changed";
assert.equal(contextUpdated.session.tournamentId, "torneo_1");
assert.equal(getBroadcastStateRevision(contextUpdated), contextUpdated.revision);
assert.equal(validateBroadcastState(contextUpdated).valid, true);

console.log("broadcast-state.test.mjs: OK");
