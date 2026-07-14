import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ACTION_CONFIRMATION_TYPES,
  ACTION_MODES,
  ACTION_RESULT_CODES,
  ACTION_STATUSES,
  ACTION_TYPES,
  BROADCAST_ACTION_ENGINE_VERSION,
  BroadcastActionError,
  buildBroadcastActionAuditEntry,
  canExecuteBroadcastAction,
  cancelBroadcastAction,
  cloneBroadcastAction,
  confirmBroadcastAction,
  createBroadcastAction,
  createBroadcastActionContext,
  dispatchBroadcastAction,
  executeBroadcastAction,
  getBroadcastAction,
  getBroadcastActionResult,
  getBroadcastActionWarnings,
  listBroadcastActions,
  normalizeBroadcastAction,
  rejectBroadcastAction,
  requiresBroadcastActionConfirmation,
  validateBroadcastAction,
  validateBroadcastActionContext
} from "../js/broadcast/actionEngine.js";
import {
  createInitialBroadcastState,
  getBroadcastQueue,
  setPreviewState,
  validateBroadcastState
} from "../js/broadcast/broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import {
  getBroadcastOutput,
  registerBroadcastOutput,
  removeBroadcastOutput
} from "../js/broadcast/broadcastOutput.js?v=20260713-broadcast-output-001-output-v1";

const T0 = "2026-07-13T22:00:00.000Z";
const T1 = "2026-07-13T22:00:01.000Z";
const T2 = "2026-07-13T22:00:02.000Z";
const T3 = "2026-07-13T22:00:03.000Z";
const OUTPUT_ID = "action_test_program";
const ACTOR = Object.freeze({
  id: "operator_test",
  name: "Operador",
  role: "operador",
  sessionId: "action_session",
  deviceId: "device_test",
  source: "action-test",
  visibility: "operational"
});

assert.equal(BROADCAST_ACTION_ENGINE_VERSION, "1.0.0");
assert.equal(Object.keys(ACTION_TYPES).length, 33);
assert.equal(Object.keys(ACTION_STATUSES).length, 11);
assert.equal(Object.keys(ACTION_MODES).length, 4);
assert.equal(Object.keys(ACTION_CONFIRMATION_TYPES).length, 5);
assert.equal(Object.keys(ACTION_RESULT_CODES).length, 19);
assert.ok(BroadcastActionError.prototype instanceof Error);
const actionEngineSource = await readFile(new URL("../js/broadcast/actionEngine.js", import.meta.url), "utf8");
for (const actionName of Object.keys(ACTION_TYPES)) {
  assert.ok(actionEngineSource.includes(`case ACTION_TYPES.${actionName}:`), `Missing execution handler for ${actionName}`);
}

removeBroadcastOutput(OUTPUT_ID);
const output = registerBroadcastOutput({
  id: OUTPUT_ID,
  name: "Program Action Test",
  type: "program",
  status: "offline",
  enabled: true,
  visibility: "restricted",
  resolution: { width: 1920, height: 1080 },
  assignedLayers: ["scoreboard", "emergency"],
  capabilities: { heartbeat: true, multiLayer: true, supportsProgram: true, supportsPreview: true },
  heartbeat: { at: null, status: "unknown", sequence: 0 },
  projection: { enabled: true, view: "program", visibility: "restricted" }
}, { now: T0, actor: ACTOR });

let state = createInitialBroadcastState({
  now: T0,
  source: "action-test",
  session: { id: "action_session", outputIds: [OUTPUT_ID], status: "active" },
  outputs: { [OUTPUT_ID]: output }
});

function context(currentState = state, overrides = {}) {
  return createBroadcastActionContext({
    state: currentState,
    outputs: { [OUTPUT_ID]: getBroadcastOutput(OUTPUT_ID) },
    assets: {},
    actor: ACTOR,
    visibility: "operational",
    safeMode: true,
    outputIds: [OUTPUT_ID],
    now: overrides.now || T1,
    ...overrides
  });
}

function action(type, target = {}, payload = {}, options = {}) {
  return createBroadcastAction(type, payload, {
    actionId: options.actionId || `action_${type.toLowerCase()}_${options.suffix || "1"}`,
    target,
    actor: options.actor === undefined ? ACTOR : options.actor,
    mode: options.mode || ACTION_MODES.MANUAL,
    idempotencyKey: options.idempotencyKey || null,
    context: options.context,
    now: options.now || T1,
    allowInvalid: options.allowInvalid === true
  });
}

function confirm(actionInput, currentContext, type, now = T1) {
  let confirmed = confirmBroadcastAction(actionInput, { type, confirmationId: `${actionInput.actionId}_confirm_1` }, {
    context: currentContext,
    actor: ACTOR,
    now
  });
  if (type === ACTION_CONFIRMATION_TYPES.DOUBLE_CONFIRMATION) {
    confirmed = confirmBroadcastAction(confirmed, { type, confirmationId: `${actionInput.actionId}_confirm_2` }, {
      context: currentContext,
      actor: ACTOR,
      now
    });
  }
  return confirmed;
}

// Creation, normalization and cloning are immutable and preserve valid falsy values.
const definition = {
  actionId: "action_creation",
  actionType: ACTION_TYPES.SET_SELECTION,
  actor: ACTOR,
  target: {},
  payload: { selection: { opacity: 0, autoHide: false, payloadBindings: { title: "" } } },
  createdAt: T0
};
const originalDefinition = structuredClone(definition);
const created = createBroadcastAction(definition, {}, { now: T0 });
assert.deepEqual(definition, originalDefinition);
assert.equal(created.payload.selection.opacity, 0);
assert.equal(created.payload.selection.autoHide, false);
assert.equal(created.payload.selection.payloadBindings.title, "");
assert.notEqual(cloneBroadcastAction(created), created);
assert.equal(validateBroadcastAction(created).valid, true);
assert.equal(normalizeBroadcastAction(created).actionId, created.actionId);
assert.equal(getBroadcastActionWarnings(created).includes("idempotency-key-not-provided"), true);

const uniqueOne = createBroadcastAction(ACTION_TYPES.SET_SELECTION, {}, { actor: ACTOR, now: T0 });
const uniqueTwo = createBroadcastAction(ACTION_TYPES.SET_SELECTION, {}, { actor: ACTOR, now: T0 });
assert.notEqual(uniqueOne.actionId, uniqueTwo.actionId);

// Invalid type, missing actor, target, payload and expiration are controlled.
assert.throws(() => createBroadcastAction("NOT_AN_ACTION", {}, { actor: ACTOR, now: T0 }), BroadcastActionError);
const missingActor = action(ACTION_TYPES.TAKE, {}, {}, { actor: null, allowInvalid: true, suffix: "missing_actor" });
assert.equal(validateBroadcastAction(missingActor).errors.includes("action-actor-required"), true);
const missingOutput = action(ACTION_TYPES.SEND_HEARTBEAT, {}, { heartbeat: {} }, { suffix: "missing_output", allowInvalid: true });
assert.equal(validateBroadcastAction(missingOutput, context()).errors.includes("action-target-output-required"), true);
const badPayload = action(ACTION_TYPES.SET_GRAPHIC_OPACITY, { graphicId: "graphic" }, { opacity: 2 }, { allowInvalid: true, suffix: "bad_payload" });
assert.equal(validateBroadcastAction(badPayload).errors.includes("action-opacity-invalid"), true);
const expired = createBroadcastAction({
  actionId: "action_expired",
  actionType: ACTION_TYPES.SET_SELECTION,
  actor: ACTOR,
  target: {},
  payload: {},
  createdAt: T0,
  expiresAt: T1
}, {}, { now: T0, allowInvalid: true });
assert.equal(dispatchBroadcastAction(expired, context(state, { now: T2 })).result.code, ACTION_RESULT_CODES.ACTION_EXPIRED);
assert.equal(validateBroadcastActionContext(context()).valid, true);

// Preview is prepared exclusively through the State public APIs and Program remains untouched.
const previewAction = action(ACTION_TYPES.PREPARE_PREVIEW, {
  graphicId: "scoreboard_action_1",
  layerId: "scoreboard",
  outputIds: [OUTPUT_ID]
}, {
  graphicState: {
    templateId: "scoreboard-test",
    layerId: "scoreboard",
    visible: true,
    status: "prepared",
    position: { x: 0, y: 0, anchor: "top-left", unit: "normalized" },
    size: { width: 0.5, height: 0.2, unit: "normalized" },
    scale: 1,
    opacity: 0,
    outputIds: [OUTPUT_ID],
    payloadBindings: { title: "", enabled: false }
  },
  layerState: { visible: true, graphicIds: ["scoreboard_action_1"], outputIds: [OUTPUT_ID], status: "visible" },
  previewState: {
    active: true,
    compositionId: "action-composition",
    templateInstances: { scoreboard_action_1: { graphicId: "scoreboard_action_1", layerId: "scoreboard" } },
    visibleGraphics: ["scoreboard_action_1"],
    activeLayers: ["scoreboard"],
    outputIds: [OUTPUT_ID],
    status: "ready",
    validation: { valid: true, checkedAt: T1, warnings: [], errors: [] }
  }
}, { suffix: "preview" });
const sourceStateBeforePreview = structuredClone(state);
let dispatched = dispatchBroadcastAction(previewAction, context());
assert.equal(dispatched.result.success, true);
assert.equal(dispatched.state.preview.active, true);
assert.equal(dispatched.state.program.active, false);
assert.equal(dispatched.state.graphics.scoreboard_action_1.opacity, 0);
assert.deepEqual(state, sourceStateBeforePreview);
state = dispatched.state;

const stableProgramBeforePreviewClear = structuredClone(state.program);
dispatched = dispatchBroadcastAction(action(ACTION_TYPES.CLEAR_PREVIEW, {}, {}, { suffix: "clear_preview" }), context(state));
assert.equal(dispatched.state.preview.active, false);
assert.deepEqual(dispatched.state.program, stableProgramBeforePreviewClear);

// Restore Preview for Program tests.
state = dispatchBroadcastAction(previewAction, context(dispatched.state, { expectedRevision: dispatched.state.revision })).state;
const programBefore = structuredClone(state.program);
const take = action(ACTION_TYPES.TAKE, { outputIds: [OUTPUT_ID] }, {
  takenBy: "forged_payload_actor",
  actor: { id: "forged_actor", role: "supervisor" }
}, { suffix: "take", idempotencyKey: "take_once" });
let pending = dispatchBroadcastAction(take, context(state));
assert.equal(pending.action.status, ACTION_STATUSES.PENDING_CONFIRMATION);
assert.equal(pending.result.code, ACTION_RESULT_CODES.CONFIRMATION_REQUIRED);
assert.deepEqual(pending.state.program, programBefore);
const confirmedTake = confirm(pending.action, context(state), ACTION_CONFIRMATION_TYPES.SIMPLE, T2);
assert.equal(confirmedTake.status, ACTION_STATUSES.CONFIRMED);
dispatched = dispatchBroadcastAction(confirmedTake, context(state, { now: T2 }));
assert.equal(dispatched.result.success, true);
assert.equal(dispatched.state.program.active, true);
assert.equal(dispatched.state.program.transitionMode, "take");
assert.equal(dispatched.state.program.takenBy, ACTOR.id);
assert.equal(dispatched.auditEntry.stateRevisionBefore, state.revision);
assert.equal(dispatched.auditEntry.stateRevisionAfter, dispatched.state.revision);
assert.equal(Object.hasOwn(dispatched.auditEntry, "state"), false);
assert.equal(Object.hasOwn(dispatched.auditEntry, "contract"), false);
const idempotentRetry = dispatchBroadcastAction(confirmedTake, context(state, { now: T3 }));
assert.deepEqual(idempotentRetry.result, dispatched.result);
state = dispatched.state;

// Same idempotency key with another payload is rejected atomically.
const conflictingTake = confirm(action(ACTION_TYPES.TAKE, { outputIds: [OUTPUT_ID] }, { changed: true }, {
  suffix: "take_conflict",
  idempotencyKey: "take_once"
}), context(state), ACTION_CONFIRMATION_TYPES.DESTRUCTIVE, T3);
const conflict = dispatchBroadcastAction(conflictingTake, context(state, { now: T3 }));
assert.equal(conflict.result.code, ACTION_RESULT_CODES.IDEMPOTENCY_CONFLICT);
assert.deepEqual(conflict.state, state);

// Cut and Auto are controlled Program transitions. Active Program elevates confirmation to destructive.
for (const type of [ACTION_TYPES.CUT, ACTION_TYPES.AUTO]) {
  const cleanState = setPreviewState(createInitialBroadcastState({
    now: T0,
    session: { id: "action_session", outputIds: [OUTPUT_ID], status: "active" },
    outputs: { [OUTPUT_ID]: getBroadcastOutput(OUTPUT_ID) }
  }), previewAction.payload.previewState, { now: T1, actor: ACTOR });
  const transition = action(type, { outputIds: [OUTPUT_ID] }, {}, { suffix: type.toLowerCase() });
  const requirement = requiresBroadcastActionConfirmation(transition, context(cleanState));
  assert.equal(requirement.required, true);
  const confirmed = confirm(transition, context(cleanState), requirement.type, T2);
  const result = dispatchBroadcastAction(confirmed, context(cleanState, { now: T2 }));
  assert.equal(result.state.program.transitionMode, type.toLowerCase());
}

// Invalid Preview, missing actor and revision conflicts never mutate state.
const invalidPreviewState = setPreviewState(state, {
  active: true,
  status: "error",
  validation: { valid: false, checkedAt: T2, errors: ["blocking"], warnings: [] },
  errors: ["blocking"]
}, { now: T2, actor: ACTOR });
const invalidTake = action(ACTION_TYPES.TAKE, { outputIds: [OUTPUT_ID] }, {}, { suffix: "invalid_preview" });
assert.equal(dispatchBroadcastAction(invalidTake, context(invalidPreviewState)).result.code, ACTION_RESULT_CODES.PREVIEW_NOT_READY);
assert.equal(dispatchBroadcastAction(missingActor, context(state, { actor: null })).result.code, ACTION_RESULT_CODES.INVALID_ACTOR);
const revisionConflict = dispatchBroadcastAction(action(ACTION_TYPES.CLEAR_PREVIEW, {}, {}, { suffix: "revision" }), context(state, { expectedRevision: state.revision - 1 }));
assert.equal(revisionConflict.result.code, ACTION_RESULT_CODES.STATE_REVISION_CONFLICT);
assert.deepEqual(revisionConflict.state, state);

// Every principal mutating action rejects a stale State revision before touching State or Outputs.
const revisionFixtureState = setPreviewState(createInitialBroadcastState({
  now: T0,
  session: { id: "action_session", outputIds: [OUTPUT_ID], status: "active" },
  outputs: { [OUTPUT_ID]: getBroadcastOutput(OUTPUT_ID) }
}), previewAction.payload.previewState, { now: T1, actor: ACTOR });
const revisionCandidates = [
  action(ACTION_TYPES.PREPARE_PREVIEW, previewAction.target, previewAction.payload, { suffix: "stale_prepare" }),
  action(ACTION_TYPES.TAKE, { outputIds: [OUTPUT_ID] }, {}, { suffix: "stale_take" }),
  action(ACTION_TYPES.CUT, { outputIds: [OUTPUT_ID] }, {}, { suffix: "stale_cut" }),
  action(ACTION_TYPES.AUTO, { outputIds: [OUTPUT_ID] }, {}, { suffix: "stale_auto" }),
  action(ACTION_TYPES.CLEAR_PREVIEW, {}, {}, { suffix: "stale_clear_preview" }),
  action(ACTION_TYPES.CLEAR_PROGRAM, {}, {}, { suffix: "stale_clear_program" }),
  action(ACTION_TYPES.SET_LAYER, { layerId: "scoreboard" }, { patch: { visible: false } }, { suffix: "stale_layer" }),
  action(ACTION_TYPES.UPDATE_OUTPUT, { outputId: OUTPUT_ID }, { patch: { name: "Blocked stale update" } }, { suffix: "stale_output" }),
  action(ACTION_TYPES.ENQUEUE_GRAPHIC, {}, {
    item: { queueItemId: "stale_queue_item", type: "graphic", graphicId: "scoreboard-test", priority: 10, status: "queued", queuedAt: T2 }
  }, { suffix: "stale_enqueue" }),
  action(ACTION_TYPES.DEQUEUE_GRAPHIC, { queueItemId: "stale_queue_item" }, {}, { suffix: "stale_dequeue" })
];
for (const candidate of revisionCandidates) {
  const stateBeforeConflict = structuredClone(revisionFixtureState);
  const outputBeforeConflict = structuredClone(getBroadcastOutput(OUTPUT_ID));
  const rejected = dispatchBroadcastAction(candidate, context(revisionFixtureState, {
    expectedRevision: revisionFixtureState.revision + 1,
    now: T2
  }));
  assert.equal(rejected.result.code, ACTION_RESULT_CODES.STATE_REVISION_CONFLICT, candidate.actionType);
  assert.equal(rejected.result.stateRevisionBefore, revisionFixtureState.revision);
  assert.equal(rejected.result.stateRevisionAfter, revisionFixtureState.revision);
  assert.deepEqual(rejected.state, stateBeforeConflict, candidate.actionType);
  assert.deepEqual(getBroadcastOutput(OUTPUT_ID), outputBeforeConflict, candidate.actionType);
}

// Program targets are validated as a complete set before any output can be updated.
const outputBeforeAtomicTake = structuredClone(getBroadcastOutput(OUTPUT_ID));
const atomicTake = action(ACTION_TYPES.TAKE, { outputIds: [OUTPUT_ID, "missing_program_output"] }, {}, { suffix: "atomic_take" });
const atomicTakeResult = dispatchBroadcastAction(atomicTake, context(revisionFixtureState, { now: T2 }));
assert.equal(atomicTakeResult.result.code, ACTION_RESULT_CODES.OUTPUT_NOT_FOUND);
assert.deepEqual(atomicTakeResult.state, revisionFixtureState);
assert.deepEqual(getBroadcastOutput(OUTPUT_ID), outputBeforeAtomicTake);

// Program clear is destructive, preserves Preview and respects emergency mode.
const clearProgram = action(ACTION_TYPES.CLEAR_PROGRAM, {}, {}, { suffix: "clear_program", idempotencyKey: "clear_program_once" });
pending = dispatchBroadcastAction(clearProgram, context(state));
assert.equal(pending.result.code, ACTION_RESULT_CODES.CONFIRMATION_REQUIRED);
const previewBeforeProgramClear = structuredClone(state.preview);
const confirmedClear = confirm(pending.action, context(state), ACTION_CONFIRMATION_TYPES.DESTRUCTIVE, T3);
dispatched = dispatchBroadcastAction(confirmedClear, context(state, { now: T3 }));
assert.equal(dispatched.state.program.active, false);
assert.deepEqual(dispatched.state.preview, previewBeforeProgramClear);
const clearProgramRetry = dispatchBroadcastAction(confirmedClear, context(dispatched.state, { now: T3 }));
assert.deepEqual(clearProgramRetry.result, dispatched.result);
assert.equal(clearProgramRetry.state.revision, dispatched.state.revision);
state = dispatched.state;

// Layers show, hide, lock and unlock through State APIs; emergency needs critical confirmation.
dispatched = dispatchBroadcastAction(action(ACTION_TYPES.SHOW_LAYER, { layerId: "scoreboard" }, {}, { suffix: "show_layer" }), context(state));
assert.equal(dispatched.state.layers.scoreboard.visible, true);
state = dispatched.state;
dispatched = dispatchBroadcastAction(action(ACTION_TYPES.LOCK_LAYER, { layerId: "scoreboard" }, {}, { suffix: "lock_layer" }), context(state));
assert.equal(dispatched.state.layers.scoreboard.locked, true);
state = dispatched.state;
const unlock = action(ACTION_TYPES.UNLOCK_LAYER, { layerId: "scoreboard" }, { force: true }, { suffix: "unlock_layer" });
pending = dispatchBroadcastAction(unlock, context(state));
assert.equal(pending.result.code, ACTION_RESULT_CODES.CONFIRMATION_REQUIRED);
const unlockConfirmed = confirm(pending.action, context(state), ACTION_CONFIRMATION_TYPES.CRITICAL, T3);
dispatched = dispatchBroadcastAction(unlockConfirmed, context(state, { now: T3 }));
assert.equal(dispatched.state.layers.scoreboard.locked, false);
state = dispatched.state;
const emergency = action(ACTION_TYPES.UNLOCK_LAYER, { layerId: "emergency" }, { force: true }, { suffix: "emergency" });
assert.equal(requiresBroadcastActionConfirmation(emergency, context(state)).type, ACTION_CONFIRMATION_TYPES.DOUBLE_CONFIRMATION);
let emergencyConfirmed = confirm(emergency, context(state), ACTION_CONFIRMATION_TYPES.DOUBLE_CONFIRMATION, T3);
assert.equal(emergencyConfirmed.confirmation.confirmations.length, 2);
assert.equal(emergencyConfirmed.status, ACTION_STATUSES.CONFIRMED);

// HIDE_ALL never hides locked or emergency graphics.
let hideState = dispatchBroadcastAction(previewAction, context(state)).state;
hideState = dispatchBroadcastAction(action(ACTION_TYPES.LOCK_LAYER, { layerId: "scoreboard" }, {}, { suffix: "hide_lock" }), context(hideState)).state;
const hideAll = action(ACTION_TYPES.HIDE_ALL, {}, {}, { suffix: "hide_all" });
const hideConfirmed = confirm(hideAll, context(hideState), ACTION_CONFIRMATION_TYPES.SIMPLE, T3);
dispatched = dispatchBroadcastAction(hideConfirmed, context(hideState, { now: T3 }));
assert.equal(dispatched.state.preview.visibleGraphics.includes("scoreboard_action_1"), true);

// Output selection, status and heartbeat are delegated and never change Program.
const outputProgram = structuredClone(state.program);
dispatched = dispatchBroadcastAction(action(ACTION_TYPES.SET_OUTPUT, { outputId: OUTPUT_ID }, {}, { suffix: "set_output" }), context(state));
assert.deepEqual(dispatched.state.selection.outputIds, [OUTPUT_ID]);
state = dispatched.state;
dispatched = dispatchBroadcastAction(action(ACTION_TYPES.SET_OUTPUT_STATUS, { outputId: OUTPUT_ID }, { status: "online" }, { suffix: "output_status" }), context(state));
assert.ok(getBroadcastOutput(OUTPUT_ID).revision > 0);
assert.deepEqual(dispatched.state.program, outputProgram);
state = dispatched.state;
const heartbeatAction = action(ACTION_TYPES.SEND_HEARTBEAT, { outputId: OUTPUT_ID }, {
  heartbeat: { at: T3, status: "online", sequence: getBroadcastOutput(OUTPUT_ID).heartbeat.sequence + 1, latency: 0 }
}, { suffix: "heartbeat", idempotencyKey: "heartbeat_once" });
dispatched = dispatchBroadcastAction(heartbeatAction, context(state, { now: T3 }));
assert.equal(dispatched.result.success, true);
assert.equal(getBroadcastOutput(OUTPUT_ID).heartbeat.at, T3);
assert.deepEqual(dispatched.state.program, outputProgram);
state = dispatched.state;
const heartbeatOutputAfterFirst = structuredClone(getBroadcastOutput(OUTPUT_ID));
const heartbeatRetry = dispatchBroadcastAction(heartbeatAction, context(state, { now: T3 }));
assert.deepEqual(heartbeatRetry.result, dispatched.result);
assert.deepEqual(getBroadcastOutput(OUTPUT_ID), heartbeatOutputAfterFirst);
const staleHeartbeatState = structuredClone(state);
const staleHeartbeat = action(ACTION_TYPES.SEND_HEARTBEAT, { outputId: OUTPUT_ID }, {
  heartbeat: { at: T3, status: "online", sequence: heartbeatOutputAfterFirst.heartbeat.sequence, latency: 0 }
}, { suffix: "heartbeat_stale", idempotencyKey: "heartbeat_stale" });
const staleHeartbeatResult = dispatchBroadcastAction(staleHeartbeat, context(state, { now: T3 }));
assert.equal(staleHeartbeatResult.result.success, false);
assert.equal(staleHeartbeatResult.result.errors.includes("heartbeat-sequence-out-of-order"), true);
assert.deepEqual(staleHeartbeatResult.state, staleHeartbeatState);
assert.deepEqual(getBroadcastOutput(OUTPUT_ID), heartbeatOutputAfterFirst);
const noOutput = dispatchBroadcastAction(action(ACTION_TYPES.SEND_HEARTBEAT, { outputId: "missing_output" }, { heartbeat: {} }, { suffix: "missing_output_2" }), context(state));
assert.equal(noOutput.result.code, ACTION_RESULT_CODES.OUTPUT_NOT_FOUND);

// A mixed valid/forbidden output patch is rejected atomically.
const atomicOutputState = structuredClone(state);
const atomicOutputBefore = structuredClone(getBroadcastOutput(OUTPUT_ID));
const atomicOutputPatch = dispatchBroadcastAction(action(ACTION_TYPES.UPDATE_OUTPUT, { outputId: OUTPUT_ID }, {
  patch: { name: "Must not be applied", id: "forged_output_id" }
}, { suffix: "atomic_output_patch" }), context(state));
assert.equal(atomicOutputPatch.result.success, false);
assert.deepEqual(atomicOutputPatch.state, atomicOutputState);
assert.deepEqual(getBroadcastOutput(OUTPUT_ID), atomicOutputBefore);

// Queue is ordered by State, idempotent, removable and never plays Program.
const queueProgram = structuredClone(state.program);
const enqueue = action(ACTION_TYPES.ENQUEUE_GRAPHIC, {}, {
  item: { queueItemId: "action_queue_1", type: "graphic", graphicId: "scoreboard-test", priority: 50, status: "queued", queuedAt: T3, outputIds: [OUTPUT_ID] }
}, { suffix: "enqueue", idempotencyKey: "enqueue_once" });
dispatched = dispatchBroadcastAction(enqueue, context(state, { now: T3 }));
assert.equal(getBroadcastQueue(dispatched.state).length, 1);
assert.deepEqual(dispatched.state.program, queueProgram);
const queueRetry = dispatchBroadcastAction(enqueue, context(state, { now: T3 }));
assert.equal(getBroadcastQueue(queueRetry.state).length, 1);
state = dispatched.state;
dispatched = dispatchBroadcastAction(action(ACTION_TYPES.DEQUEUE_GRAPHIC, { queueItemId: "action_queue_1" }, {}, { suffix: "dequeue" }), context(state));
assert.equal(getBroadcastQueue(dispatched.state).length, 0);
state = dispatchBroadcastAction(action(ACTION_TYPES.ENQUEUE_GRAPHIC, {}, {
  item: { queueItemId: "action_queue_2", type: "graphic", graphicId: "scoreboard-test", priority: 40, status: "queued", queuedAt: T3 }
}, { suffix: "enqueue_2" }), context(dispatched.state)).state;
const clearQueue = action(ACTION_TYPES.CLEAR_QUEUE, {}, {}, { suffix: "clear_queue" });
const clearQueueConfirmed = confirm(clearQueue, context(state), ACTION_CONFIRMATION_TYPES.SIMPLE, T3);
dispatched = dispatchBroadcastAction(clearQueueConfirmed, context(state, { now: T3 }));
assert.deepEqual(getBroadcastQueue(dispatched.state), []);
assert.deepEqual(dispatched.state.program, queueProgram);

// The permission matrix is explicit for every declared action type and exact role name.
const allActions = Object.values(ACTION_TYPES);
const graphicsActions = new Set([
  ACTION_TYPES.SELECT_GRAPHIC, ACTION_TYPES.SET_SELECTION, ACTION_TYPES.PREPARE_PREVIEW, ACTION_TYPES.CLEAR_PREVIEW,
  ACTION_TYPES.TAKE, ACTION_TYPES.CUT, ACTION_TYPES.AUTO, ACTION_TYPES.CLEAR_PROGRAM,
  ACTION_TYPES.SHOW_GRAPHIC, ACTION_TYPES.HIDE_GRAPHIC, ACTION_TYPES.HIDE_ALL, ACTION_TYPES.UPDATE_GRAPHIC,
  ACTION_TYPES.SET_GRAPHIC_GEOMETRY, ACTION_TYPES.SET_GRAPHIC_LAYER, ACTION_TYPES.SET_GRAPHIC_ASSET,
  ACTION_TYPES.SET_GRAPHIC_OPACITY, ACTION_TYPES.SET_GRAPHIC_SCALE, ACTION_TYPES.SET_OUTPUT,
  ACTION_TYPES.SEND_HEARTBEAT, ACTION_TYPES.ENQUEUE_GRAPHIC, ACTION_TYPES.DEQUEUE_GRAPHIC, ACTION_TYPES.CLEAR_QUEUE,
  ACTION_TYPES.SET_LAYER, ACTION_TYPES.LOCK_LAYER, ACTION_TYPES.UNLOCK_LAYER, ACTION_TYPES.SHOW_LAYER, ACTION_TYPES.HIDE_LAYER
]);
const roleMatrix = {
  supervisor: new Set(allActions),
  operador: new Set(allActions),
  graficos: graphicsActions,
  locutor: new Set([ACTION_TYPES.SELECT_GRAPHIC, ACTION_TYPES.SET_SELECTION]),
  juez: new Set(),
  lectura: new Set(),
  system: new Set([ACTION_TYPES.SEND_HEARTBEAT, ACTION_TYPES.ACKNOWLEDGE_WARNING, ACTION_TYPES.ACKNOWLEDGE_ERROR])
};
for (const [role, allowedTypes] of Object.entries(roleMatrix)) {
  for (const actionType of allActions) {
    const roleActor = { ...ACTOR, role };
    const candidate = action(actionType, {}, {}, {
      actor: roleActor,
      mode: role === "system" ? ACTION_MODES.SYSTEM : ACTION_MODES.MANUAL,
      suffix: `matrix_${role}_${actionType.toLowerCase()}`,
      allowInvalid: true
    });
    assert.equal(
      canExecuteBroadcastAction(candidate, context(state, { actor: roleActor })).allowed,
      allowedTypes.has(actionType),
      `${role}:${actionType}`
    );
  }
}
const unknownRole = { ...ACTOR, role: "desconocido" };
assert.equal(canExecuteBroadcastAction(action(ACTION_TYPES.CLEAR_PREVIEW, {}, {}, {
  actor: unknownRole,
  suffix: "unknown_role"
}), context(state, { actor: unknownRole })).allowed, false);

// Locutor may only change local selection; protected production blocks remain byte-for-byte stable.
const locutorActor = { ...ACTOR, id: "locutor_test", role: "locutor" };
const locutorBefore = {
  preview: structuredClone(state.preview),
  program: structuredClone(state.program),
  layers: structuredClone(state.layers),
  queue: structuredClone(getBroadcastQueue(state)),
  output: structuredClone(getBroadcastOutput(OUTPUT_ID))
};
const locutorSelection = dispatchBroadcastAction(action(ACTION_TYPES.SET_SELECTION, {}, {
  selection: { graphicId: "locutor_suggestion", payloadBindings: { title: "Sugerencia" } }
}, { actor: locutorActor, suffix: "locutor_selection" }), context(state, { actor: locutorActor }));
assert.equal(locutorSelection.result.success, true);
assert.equal(locutorSelection.state.selection.graphicId, "locutor_suggestion");
assert.deepEqual(locutorSelection.state.preview, locutorBefore.preview);
assert.deepEqual(locutorSelection.state.program, locutorBefore.program);
assert.deepEqual(locutorSelection.state.layers, locutorBefore.layers);
assert.deepEqual(getBroadcastQueue(locutorSelection.state), locutorBefore.queue);
assert.deepEqual(getBroadcastOutput(OUTPUT_ID), locutorBefore.output);
for (const forbiddenSelectionPayload of [{ clearPreview: true }, { contextRef: { contractRevision: 99 } }]) {
  const forbidden = action(ACTION_TYPES.SET_SELECTION, {}, forbiddenSelectionPayload, {
    actor: locutorActor,
    suffix: `locutor_forbidden_${Object.keys(forbiddenSelectionPayload)[0]}`
  });
  assert.equal(dispatchBroadcastAction(forbidden, context(state, { actor: locutorActor })).result.code, ACTION_RESULT_CODES.PERMISSION_DENIED);
}
assert.equal(canExecuteBroadcastAction(action(ACTION_TYPES.SET_OUTPUT, { outputId: OUTPUT_ID }, {}, {
  actor: locutorActor,
  suffix: "locutor_output"
}), context(state, { actor: locutorActor })).allowed, false);

// Payload fields, declared permissions and system mode cannot elevate a real restricted actor.
const judgeActor = { ...ACTOR, id: "judge_test", role: "juez" };
const elevationAttempt = createBroadcastAction({
  actionId: "action_role_elevation",
  actionType: ACTION_TYPES.CLEAR_PREVIEW,
  actor: judgeActor,
  permissions: ["all", "program:write"],
  target: {},
  payload: {
    actor: { id: "forged_supervisor", role: "supervisor" },
    role: "supervisor",
    permissions: ["all"]
  },
  createdAt: T3
}, {}, { now: T3 });
assert.equal(Object.hasOwn(elevationAttempt.payload, "actor"), false);
assert.equal(Object.hasOwn(elevationAttempt.payload, "role"), false);
assert.equal(Object.hasOwn(elevationAttempt.payload, "permissions"), false);
assert.equal(dispatchBroadcastAction(elevationAttempt, context(state, { actor: judgeActor })).result.code, ACTION_RESULT_CODES.PERMISSION_DENIED);
const forgedSystemHeartbeat = action(ACTION_TYPES.SEND_HEARTBEAT, { outputId: OUTPUT_ID }, {
  heartbeat: { at: T3, status: "online", sequence: getBroadcastOutput(OUTPUT_ID).heartbeat.sequence + 1 }
}, { actor: judgeActor, mode: ACTION_MODES.SYSTEM, suffix: "forged_system" });
assert.equal(dispatchBroadcastAction(forgedSystemHeartbeat, context(state, { actor: judgeActor })).result.code, ACTION_RESULT_CODES.PERMISSION_DENIED);
const systemActor = { id: "broadcast_system", name: "Broadcast System", role: "system", source: "action-test" };
const systemTake = action(ACTION_TYPES.TAKE, { outputIds: [OUTPUT_ID] }, {}, {
  actor: systemActor,
  mode: ACTION_MODES.SYSTEM,
  suffix: "system_take"
});
assert.equal(canExecuteBroadcastAction(systemTake, context(state, { actor: systemActor })).allowed, false);

// Reject/cancel do not execute and audit/result helpers expose only compact records.
const rejectable = action(ACTION_TYPES.SET_SELECTION, {}, {}, { suffix: "reject" });
assert.equal(rejectBroadcastAction(rejectable, "operator-rejected", { now: T3 }).status, ACTION_STATUSES.REJECTED);
const cancellable = action(ACTION_TYPES.SET_SELECTION, {}, {}, { suffix: "cancel" });
assert.equal(cancelBroadcastAction(cancellable, "operator-cancelled", { now: T3 }).status, ACTION_STATUSES.CANCELLED);
assert.ok(getBroadcastAction(dispatched.action.actionId));
assert.ok(listBroadcastActions({ status: ACTION_STATUSES.SUCCEEDED }).length > 0);
assert.equal(getBroadcastActionResult(dispatched).code, ACTION_RESULT_CODES.SUCCEEDED);
const audit = buildBroadcastActionAuditEntry(dispatched.action, dispatched.result, context(dispatched.state));
assert.equal(audit.actionId, dispatched.action.actionId);
assert.equal(Object.hasOwn(audit, "state"), false);
assert.equal(Object.hasOwn(audit, "contract"), false);

// Security removes executable values, symbols, cycles and dangerous keys without losing falsy values.
let executed = false;
const unsafePayload = { zero: 0, disabled: false, empty: "", callback: () => { executed = true; }, symbol: Symbol("blocked") };
unsafePayload.self = unsafePayload;
Object.defineProperty(unsafePayload, "__proto__", { value: { polluted: true }, enumerable: true });
const sanitized = createBroadcastAction(ACTION_TYPES.SET_SELECTION, unsafePayload, {
  actionId: "action_security",
  actor: ACTOR,
  now: T3
});
assert.equal(sanitized.payload.zero, 0);
assert.equal(sanitized.payload.disabled, false);
assert.equal(sanitized.payload.empty, "");
assert.equal(Object.hasOwn(sanitized.payload, "callback"), false);
assert.equal(Object.hasOwn(sanitized.payload, "symbol"), false);
assert.equal(Object.hasOwn(sanitized.payload, "self"), false);
assert.equal(Object.hasOwn(sanitized.payload, "__proto__"), false);
dispatchBroadcastAction(sanitized, context(state));
assert.equal(executed, false);
assert.equal({}.polluted, undefined);

// The low-level execute API also returns fresh blocks and never mutates context.
const executionContext = context(state);
const executionContextCopy = structuredClone(executionContext);
const execution = executeBroadcastAction(action(ACTION_TYPES.CLEAR_PREVIEW, {}, {}, { suffix: "execute_direct" }), executionContext, { now: T3 });
assert.equal(validateBroadcastState(execution.state).valid, true);
assert.deepEqual(executionContext, executionContextCopy);

removeBroadcastOutput(OUTPUT_ID);
console.log("broadcast-action-engine.test.mjs: OK");
