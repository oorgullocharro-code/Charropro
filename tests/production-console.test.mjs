import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PRODUCTION_CONSOLE_APP_VERSION,
  PRODUCTION_CONSOLE_FIXTURES,
  PRODUCTION_CONSOLE_GRAPHICS,
  PRODUCTION_CONSOLE_VERSION,
  buildProductionProjection,
  buildProductionRenderDescriptor,
  changeProductionQueuePriority,
  clearProductionPreview,
  clearProductionProgram,
  clearProductionQueue,
  createProductionConsoleModel,
  createProductionConsoleTestComponent,
  dispatchProductionConsoleAction,
  disposeProductionConsole,
  duplicateProductionConsoleComponent,
  enqueueProductionGraphic,
  escapeProductionConsoleText,
  getProductionConsoleInspector,
  loadProductionConsoleFixture,
  prepareProductionPreview,
  removeProductionConsoleComponent,
  removeProductionQueueItem,
  restoreLastProductionPreview,
  resetProductionConsoleVariable,
  sanitizeProductionConsoleInspectorData,
  selectProductionAsset,
  selectProductionGraphic,
  selectProductionOutput,
  setProductionLayerAction,
  setProductionOutputAction,
  setProductionConsoleVariable,
  setProductionConsoleVariableStatus,
  setProductionVisibility,
  transitionProductionToProgram,
  validateProductionConsoleModel
} from "../js/broadcast/productionConsole.js";
import { getBroadcastQueue, validateBroadcastState } from "../js/broadcast/broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import { getBroadcastOutput, validateBroadcastOutput } from "../js/broadcast/broadcastOutput.js?v=20260713-broadcast-output-001-output-v1";
import { listBroadcastAssets, validateBroadcastAsset } from "../js/broadcast/assetManager.js?v=20260713-asset-manager-001-assets-v1";
import { ACTION_TYPES } from "../js/broadcast/actionEngine.js?v=20260713-production-variables-001-variables-v1";
import { findBroadcastComponent, listBroadcastComponents, validateBroadcastComponent } from "../js/broadcast/componentLibrary.js";

const T0 = "2026-07-13T20:00:00.000Z";
const T1 = "2026-07-13T20:00:01.000Z";
const T2 = "2026-07-13T20:00:02.000Z";
const T3 = "2026-07-13T20:00:03.000Z";
const T4 = "2026-07-13T20:00:04.000Z";

assert.equal(PRODUCTION_CONSOLE_VERSION, "1.0.0");
assert.equal(PRODUCTION_CONSOLE_APP_VERSION, "20260713-component-library-001-components-v1");
assert.equal(PRODUCTION_CONSOLE_FIXTURES.length, 6);
assert.equal(Object.keys(PRODUCTION_CONSOLE_GRAPHICS).length, 8);

// Initial load is valid, safe and contains no operational recovery.
let model = createProductionConsoleModel({ now: T0 });
assert.equal(validateProductionConsoleModel(model).valid, true);
assert.equal(validateBroadcastState(model.state).valid, true);
assert.equal(model.safeMode, true);
assert.equal(model.state.preview.active, false);
assert.equal(model.state.program.active, false);
assert.equal(model.programSnapshot, null);
assert.deepEqual(model.actionHistory, []);
assert.deepEqual(getBroadcastQueue(model.state), []);
assert.equal(model.outputIds.length, 5);
assert.equal(Object.keys(model.variableRegistry.variables).length, 14);
assert.equal(listBroadcastComponents(model.componentRegistry).length, 0);
for (const outputId of model.outputIds) {
  const output = getBroadcastOutput(outputId);
  assert.equal(validateBroadcastOutput(output).valid, true);
  assert.equal(output.status, "offline");
  assert.equal(output.assignedLayers.length, 9);
}

// Production Variables are edited only through Action Engine and never alter Preview, Program or Outputs.
const stateBeforeVariables = structuredClone(model.state);
const programBeforeVariables = structuredClone(model.state.program);
const outputsBeforeVariables = Object.fromEntries(model.outputIds.map((outputId) => [outputId, structuredClone(getBroadcastOutput(outputId))]));
model = setProductionConsoleVariable(model, "var_production_message", "Mensaje operativo", { now: T1 });
assert.equal(model.variableRegistry.variables.var_production_message.value, "Mensaje operativo");
assert.equal(model.actionHistory[0].actionType, ACTION_TYPES.SET_VARIABLE);
assert.deepEqual(model.state.program, programBeforeVariables);
model = resetProductionConsoleVariable(model, "var_production_message", { now: T2 });
assert.equal(model.variableRegistry.variables.var_production_message.value, null);
assert.equal(model.actionHistory[0].actionType, ACTION_TYPES.RESET_VARIABLE);
assert.deepEqual(model.state.program, programBeforeVariables);
model = setProductionConsoleVariableStatus(model, "var_production_message", false, { now: T2 });
assert.equal(model.variableRegistry.variables.var_production_message.status, "disabled");
assert.equal(model.actionHistory[0].actionType, ACTION_TYPES.DISABLE_VARIABLE);
model = setProductionConsoleVariableStatus(model, "var_production_message", true, { now: T3 });
assert.equal(model.variableRegistry.variables.var_production_message.status, "active");
assert.equal(model.actionHistory[0].actionType, ACTION_TYPES.ENABLE_VARIABLE);
assert.deepEqual(model.state.program, programBeforeVariables);
assert.deepEqual(model.state, stateBeforeVariables);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeVariables[outputId]);

const variablesInspector = getProductionConsoleInspector(model, { visibility: "operational", now: T3 }).variables;
assert.equal(variablesInspector.registry.variables.length, 14);
assert.equal(variablesInspector.snapshot.snapshotVersion, "1.0.0");
assert.ok(variablesInspector.resolved.some((entry) => entry.key === "production.message"));
const publicVariablesInspector = getProductionConsoleInspector(model, { visibility: "public", now: T3 }).variables;
assert.equal(publicVariablesInspector.registry.variables.every((variable) => variable.visibility === "public"), true);
assert.equal(publicVariablesInspector.resolved.some((entry) => entry.key === "production.interviewName"), false);
assert.equal(publicVariablesInspector.resolved.some((entry) => entry.key === "production.activeCamera"), false);
assert.equal(JSON.stringify(publicVariablesInspector).includes('"actor"'), false);
assert.equal(JSON.stringify(publicVariablesInspector).includes('"tenantId"'), false);
assert.equal(JSON.stringify(publicVariablesInspector).includes('"sessionId"'), false);

// Component Library remains in memory and its console controls never alter Preview, Program or Outputs.
const stateBeforeComponents = structuredClone(model.state);
const outputsBeforeComponents = Object.fromEntries(model.outputIds.map((outputId) => [outputId, structuredClone(getBroadcastOutput(outputId))]));
model = createProductionConsoleTestComponent(model, { now: T1 });
assert.equal(model.inspectorTab, "components");
assert.equal(listBroadcastComponents(model.componentRegistry).length, 1);
assert.equal(validateBroadcastComponent(findBroadcastComponent(model.componentRegistry, model.selectedComponentId)).valid, true);
const firstComponentId = model.selectedComponentId;
model = duplicateProductionConsoleComponent(model, firstComponentId, { now: T2 });
assert.equal(listBroadcastComponents(model.componentRegistry).length, 2);
assert.notEqual(model.selectedComponentId, firstComponentId);
const componentInspector = getProductionConsoleInspector(model, { visibility: "production", now: T2 }).components;
assert.equal(componentInspector.version, "1.0.0");
assert.equal(componentInspector.registry.components.length, 2);
assert.equal(componentInspector.selected.componentId, model.selectedComponentId);
assert.equal(componentInspector.snapshot.version, "1.0.0");
assert.equal(componentInspector.snapshot.resolvedBindings["properties.text"], "");
model = removeProductionConsoleComponent(model, model.selectedComponentId, { now: T3 });
assert.equal(listBroadcastComponents(model.componentRegistry).length, 1);
assert.equal(model.selectedComponentId, firstComponentId);
assert.deepEqual(model.state, stateBeforeComponents);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeComponents[outputId]);

// All fixtures rebuild through the Data Contract and preserve their sports scope.
for (const fixture of PRODUCTION_CONSOLE_FIXTURES) {
  model = loadProductionConsoleFixture(model, fixture.id, { now: T1 });
  assert.equal(model.contract.competition.type, fixture.competitionType);
  assert.equal(model.contract.contractVersion, "1.0.0");
}
model = loadProductionConsoleFixture(model, "charro_completo", { now: T1 });
assert.equal(model.contract.competition.scope, "individual");
assert.equal(model.contract.team.id, null);
assert.ok(model.contract.participant.id);
assert.ok(model.contract.horse.id);
assert.equal(model.contract.competition.suerteIds.includes("terna"), false);
assert.equal(model.contract.competition.suerteIds.includes("yegua"), false);

// Preview preparation preserves valid zero/false/empty values and Program remains empty.
model = selectProductionGraphic(model, "message-test");
model = prepareProductionPreview(model, {
  message: "",
  geometry: {
    position: { x: 0, y: 0, anchor: "top-left", unit: "normalized" },
    size: { width: 0.5, height: 0.2, unit: "normalized" },
    scale: 1,
    opacity: 0,
    layerId: "alerts"
  },
  animation: { duration: 0, delay: 0, autoHide: false }
}, { now: T1, confirmed: true });
assert.equal(model.state.preview.active, true);
assert.equal(model.actionHistory[0].actionType, ACTION_TYPES.PREPARE_PREVIEW);
assert.equal(model.actionHistory[0].resultCode, "action-succeeded");
assert.equal(model.state.program.active, false);
let previewProjection = buildProductionProjection(model, "preview", { now: T1 });
assert.equal(previewProjection.graphics[0].position.x, 0);
assert.equal(previewProjection.graphics[0].position.y, 0);
assert.equal(previewProjection.graphics[0].opacity, 0);
assert.equal(previewProjection.graphics[0].autoHide, false);
let previewDescriptor = buildProductionRenderDescriptor(previewProjection, model.assetRegistry);
assert.equal(previewDescriptor.graphics[0].content.title, "");
assert.equal(previewDescriptor.graphics[0].duration, 0);
assert.equal(previewDescriptor.graphics[0].delay, 0);

// Invalid geometry is normalized to safe values before reaching Broadcast State.
model = prepareProductionPreview(model, {
  geometry: {
    position: { x: Number.NaN, y: Number.POSITIVE_INFINITY, anchor: "center", unit: "normalized" },
    size: { width: -1, height: 0, unit: "normalized" },
    scale: 0,
    opacity: 2,
    layerId: "alerts"
  }
}, { now: T1, confirmed: true });
previewProjection = buildProductionProjection(model, "preview", { now: T1 });
const normalizedGraphic = previewProjection.graphics[0];
assert.equal(Number.isFinite(normalizedGraphic.position.x), true);
assert.equal(Number.isFinite(normalizedGraphic.position.y), true);
assert.ok(normalizedGraphic.size.width > 0);
assert.ok(normalizedGraphic.size.height > 0);
assert.ok(normalizedGraphic.scale > 0);
assert.ok(normalizedGraphic.opacity >= 0 && normalizedGraphic.opacity <= 1);

// Safe mode blocks accidental Program transitions and controlled Take captures a snapshot.
assert.throws(
  () => transitionProductionToProgram(model, "take", { now: T2 }),
  (error) => error?.code === "console-safe-mode-confirmation-required"
);
model = transitionProductionToProgram(model, "take", { now: T2, confirmed: true });
assert.equal(model.state.program.active, true);
assert.equal(model.state.program.transitionMode, "take");
assert.ok(model.programSnapshot);
const stableProgram = structuredClone(model.state.program);
const stableProgramProjection = structuredClone(buildProductionProjection(model, "program", { now: T2 }));

// Geometry, layer, asset, output, fixture and heartbeat changes affect Preview only.
model = selectProductionGraphic(model, "score-test");
model = selectProductionAsset(model, "asset-sponsor");
model = selectProductionOutput(model, "console_vertical");
model = prepareProductionPreview(model, {
  geometry: {
    position: { x: 0.9, y: 0.1, anchor: "top-right", unit: "normalized" },
    size: { width: 0.3, height: 0.2, unit: "normalized" },
    scale: 1.4,
    opacity: 0.4,
    layerId: "score"
  }
}, { now: T3, confirmed: true });
assert.deepEqual(model.state.program, stableProgram);
model = setProductionOutputAction(model, "online", { now: T3, outputId: "console_vertical" });
assert.deepEqual(model.state.program, stableProgram);
model = setProductionOutputAction(model, "heartbeat", { now: T4, outputId: "console_vertical" });
assert.deepEqual(model.state.program, stableProgram);
model = setProductionOutputAction(model, "stale", { now: T4, outputId: "console_vertical" });
assert.equal(getBroadcastOutput("console_vertical").status, "stale");
assert.deepEqual(model.state.program, stableProgram);
model = setProductionOutputAction(model, "offline", { now: T4, outputId: "console_vertical" });
assert.equal(getBroadcastOutput("console_vertical").status, "offline");
assert.deepEqual(model.state.program, stableProgram);

// Clear Preview cannot alter Program; restoring uses the last declarative Preview config.
const programBeforePreviewClear = structuredClone(model.state.program);
model = clearProductionPreview(model, { now: T4 });
assert.equal(model.state.preview.active, false);
assert.deepEqual(model.state.program, programBeforePreviewClear);
model = restoreLastProductionPreview(model, { now: T4 });
assert.equal(model.state.preview.active, true);
assert.deepEqual(model.state.program, programBeforePreviewClear);

model = loadProductionConsoleFixture(model, "caladero", { now: T4 });
assert.deepEqual(model.state.program, stableProgram);
assert.deepEqual(buildProductionProjection(model, "program", { now: T4, outputId: "console_program" }).graphics, stableProgramProjection.graphics);

// Program is read-only and Clear Program requires safe-mode confirmation.
assert.throws(
  () => clearProductionProgram(model, { now: T4 }),
  (error) => error?.code === "console-clear-program-confirmation-required"
);
const previewBeforeClearProgram = structuredClone(model.state.preview);
model = clearProductionProgram(model, { now: T4, confirmed: true });
assert.equal(model.state.program.active, false);
assert.equal(model.programSnapshot, null);
assert.deepEqual(model.state.preview, previewBeforeClearProgram);

// Cut and Auto use the same controlled State transition.
for (const mode of ["cut", "auto"]) {
  disposeProductionConsole(model);
  model = createProductionConsoleModel({ now: T0 });
  model = prepareProductionPreview(model, {}, { now: T1 });
  model = transitionProductionToProgram(model, mode, { now: T2, confirmed: true });
  assert.equal(model.state.program.transitionMode, mode);
  assert.equal(model.programSnapshot.mode, mode);
}

// A blocking Preview cannot reach Program.
disposeProductionConsole(model);
model = createProductionConsoleModel({ now: T0 });
model = prepareProductionPreview(model, { errors: ["fixture-blocking-error"] }, { now: T1, confirmed: true });
assert.throws(() => transitionProductionToProgram(model, "take", { now: T2, confirmed: true }));
assert.equal(model.state.program.active, false);

// Layers use State APIs, respect locks and protect emergency actions.
model = prepareProductionPreview(model, {}, { now: T2, confirmed: true });
model = setProductionLayerAction(model, "scoreboard", "lock", { now: T2 });
assert.equal(model.state.layers.scoreboard.locked, true);
assert.throws(
  () => setProductionLayerAction(model, "scoreboard", "unlock", { now: T2 }),
  (error) => error?.code === "console-layer-confirmation-required"
);
model = setProductionLayerAction(model, "scoreboard", "unlock", { now: T2, confirmed: true });
assert.equal(model.state.layers.scoreboard.locked, false);
assert.throws(
  () => setProductionLayerAction(model, "emergency", "show", { now: T2 }),
  (error) => error?.code === "console-layer-confirmation-required"
);
const scoreboardBeforeFullscreen = structuredClone(model.state.layers.scoreboard);
model = setProductionLayerAction(model, "fullscreen", "show", { now: T2 });
assert.ok(model.state.layers.scoreboard);
assert.deepEqual(model.state.layers.scoreboard, scoreboardBeforeFullscreen);

// Queue uses Broadcast State APIs, keeps priority order and never starts Program.
const programBeforeQueue = structuredClone(model.state.program);
model = enqueueProductionGraphic(model, { now: T2, priority: 40, queueItemId: "queue_a" });
model = enqueueProductionGraphic(model, { now: T2, priority: 40, queueItemId: "queue_b" });
model = enqueueProductionGraphic(model, { now: T3, priority: 80, queueItemId: "queue_c" });
let queue = getBroadcastQueue(model.state);
assert.deepEqual(queue.map((item) => item.queueItemId), ["queue_c", "queue_a", "queue_b"]);
assert.deepEqual(model.state.program, programBeforeQueue);
model = changeProductionQueuePriority(model, "queue_a", 60, { now: T3 });
queue = getBroadcastQueue(model.state);
assert.equal(queue[0].queueItemId, "queue_a");
model = removeProductionQueueItem(model, "queue_b", { now: T3 });
assert.equal(getBroadcastQueue(model.state).some((item) => item.queueItemId === "queue_b"), false);
model = clearProductionQueue(model, { now: T3, confirmed: true });
assert.deepEqual(getBroadcastQueue(model.state), []);
assert.deepEqual(model.state.program, programBeforeQueue);

// Asset Manager registry remains immutable and controlled fallbacks resolve locally.
const registryCopy = structuredClone(model.assetRegistry);
const assets = listBroadcastAssets(model.assetRegistry);
assert.equal(assets.length, 7);
assert.ok(assets.every((asset) => validateBroadcastAsset(asset, { requireOriginalVariant: true }).valid));
model = selectProductionAsset(model, "asset-sponsor");
model = prepareProductionPreview(model, { variantId: "missing-variant" }, { now: T3, confirmed: true });
previewDescriptor = buildProductionRenderDescriptor(buildProductionProjection(model, "preview", { now: T3 }), model.assetRegistry);
assert.equal(previewDescriptor.graphics[0].asset.fallbackUsed, true);
assert.deepEqual(model.assetRegistry, registryCopy);

// Visibility rebuilds the contract and public inspector contains no restricted values.
for (const visibility of ["production", "operational", "restricted"]) {
  model = setProductionVisibility(model, visibility, { now: T3 });
  assert.equal(model.contract.visibility, visibility);
}
model = setProductionVisibility(model, "public", { now: T4 });
assert.equal(Object.hasOwn(model.contract, "scoreDetail"), false);
const publicInspector = JSON.stringify(getProductionConsoleInspector(model, { now: T4 }));
for (const restricted of [
  "tenant_playground",
  "tenant_console_fixture",
  "cliente_playground",
  "operador_playground",
  "juez_playground",
  "internalToken",
  "produccion@ejemplo.invalid",
  "participants/current.png"
]) {
  assert.equal(publicInspector.includes(restricted), false, `Public inspector leaked ${restricted}`);
}

// Regression: active Preview and Program remain visible without exposing operational identity.
let privacyModel = createProductionConsoleModel({ now: T0 });
privacyModel = prepareProductionPreview(privacyModel, {}, { now: T1, confirmed: true });
privacyModel = transitionProductionToProgram(privacyModel, "take", { now: T2, confirmed: true });
privacyModel = enqueueProductionGraphic(privacyModel, { now: T3, queueItemId: "privacy_queue" });
const activeProductionInspectorText = JSON.stringify(getProductionConsoleInspector(privacyModel, {
  now: T3,
  visibility: "production"
}));
for (const restricted of ["production_console_operator", '"actor"', "deviceId", "sessionId", "permissions"]) {
  assert.equal(activeProductionInspectorText.includes(restricted), false, `Active production inspector leaked ${restricted}`);
}
privacyModel = setProductionVisibility(privacyModel, "public", { now: T4 });
const stateBeforePublicInspector = structuredClone(privacyModel.state);
const outputBeforePublicInspector = structuredClone(getBroadcastOutput(privacyModel.selectedOutputId));
const assetsBeforePublicInspector = structuredClone(privacyModel.assetRegistry);
const previewProjectionBeforePublicInspector = buildProductionProjection(privacyModel, "preview", { now: T4 });
const programProjectionBeforePublicInspector = buildProductionProjection(privacyModel, "program", { now: T4 });
const activePublicInspector = getProductionConsoleInspector(privacyModel, { now: T4 });
const activePublicText = JSON.stringify(activePublicInspector);
for (const restricted of [
  "production_console_operator", "preparedBy", "takenBy", "updatedBy", "createdBy", "queuedBy", "selectedBy",
  "operatorId", "operatorName", "actor", "actorId", "actorName", "userId", "deviceId", "sessionId",
  "tenantId", "clientId", "organizationId", "judgeId", "judgeName", "diagnostics", "internalDiagnostics", '"session"', "lastError"
]) {
  assert.equal(activePublicText.includes(restricted), false, `Active public inspector leaked ${restricted}`);
}
assert.equal(activePublicInspector.preview.active, true);
assert.equal(activePublicInspector.program.active, true);
assert.equal(activePublicInspector.program.status, "on_air");
assert.ok(activePublicInspector.program.visibleGraphics.length > 0);
assert.ok(activePublicInspector.program.activeLayers.length > 0);
assert.ok(activePublicInspector.program.revision > 0);
assert.equal(Object.hasOwn(activePublicInspector.queue[0], "queuedBy"), false);
assert.deepEqual(privacyModel.state, stateBeforePublicInspector);
assert.deepEqual(getBroadcastOutput(privacyModel.selectedOutputId), outputBeforePublicInspector);
assert.deepEqual(privacyModel.assetRegistry, assetsBeforePublicInspector);
assert.deepEqual(buildProductionProjection(privacyModel, "preview", { now: T4 }), previewProjectionBeforePublicInspector);
assert.deepEqual(buildProductionProjection(privacyModel, "program", { now: T4 }), programProjectionBeforePublicInspector);

// The central sanitizer enforces the visibility matrix, recursion limits and unsafe-value guards.
const sensitiveInspectorValue = {
  preparedBy: "production_console_operator",
  takenBy: "production_console_operator",
  updatedBy: "production_console_operator",
  operatorId: "production_console_operator",
  operatorName: "Operador",
  actor: { userId: "production_console_operator", role: "production" },
  selectedBy: "production_console_operator",
  session: { id: "session_internal", deviceId: "device_internal" },
  sessionId: "session_internal",
  tenantId: "tenant_internal",
  clientId: "client_internal",
  organizationId: "organization_internal",
  diagnostics: { firebaseConnected: true, latency: 0 },
  lastError: "internal-output-error",
  scoreDetail: { cala: { total: 0 } },
  metadata: { label: "visible", internalToken: "metadata-secret" },
  credentials: "never-visible",
  token: "never-visible",
  secret: "never-visible",
  localRef: "file:///private/fixture.json",
  unsafeRef: "javascript:alert(1)",
  zero: 0,
  disabled: false,
  empty: "",
  callback: () => "blocked",
  symbolValue: Symbol("blocked")
};
sensitiveInspectorValue.self = sensitiveInspectorValue;
const publicSanitized = sanitizeProductionConsoleInspectorData(sensitiveInspectorValue, "public");
assert.equal(JSON.stringify(publicSanitized).includes("production_console_operator"), false);
for (const field of ["preparedBy", "takenBy", "updatedBy", "selectedBy", "operatorId", "operatorName", "actor", "session", "sessionId", "tenantId", "clientId", "organizationId", "diagnostics", "lastError", "scoreDetail", "metadata", "credentials", "token", "secret", "localRef", "unsafeRef", "callback", "symbolValue", "self"]) {
  assert.equal(Object.hasOwn(publicSanitized, field), false, `Public sanitizer retained ${field}`);
}
assert.equal(publicSanitized.zero, 0);
assert.equal(publicSanitized.disabled, false);
assert.equal(publicSanitized.empty, "");

const productionSanitized = sanitizeProductionConsoleInspectorData(sensitiveInspectorValue, "production");
assert.equal(Object.hasOwn(productionSanitized, "preparedBy"), false);
assert.equal(Object.hasOwn(productionSanitized, "takenBy"), false);
assert.equal(Object.hasOwn(productionSanitized, "updatedBy"), false);
assert.equal(Object.hasOwn(productionSanitized, "sessionId"), false);
assert.deepEqual(productionSanitized.scoreDetail, { cala: { total: 0 } });
assert.deepEqual(productionSanitized.metadata, { label: "visible" });

const operationalSanitized = sanitizeProductionConsoleInspectorData(sensitiveInspectorValue, "operational");
assert.equal(operationalSanitized.preparedBy, "production_console_operator");
assert.equal(operationalSanitized.takenBy, "production_console_operator");
assert.equal(operationalSanitized.updatedBy, "production_console_operator");
assert.equal(operationalSanitized.sessionId, "session_internal");
assert.equal(Object.hasOwn(operationalSanitized, "tenantId"), false);
assert.equal(Object.hasOwn(operationalSanitized, "token"), false);

const restrictedSanitized = sanitizeProductionConsoleInspectorData(sensitiveInspectorValue, "restricted");
assert.equal(restrictedSanitized.operatorId, "production_console_operator");
assert.equal(restrictedSanitized.tenantId, "tenant_internal");
assert.equal(restrictedSanitized.clientId, "client_internal");
assert.equal(Object.hasOwn(restrictedSanitized, "credentials"), false);
assert.equal(Object.hasOwn(restrictedSanitized, "token"), false);
assert.equal(Object.hasOwn(restrictedSanitized, "secret"), false);
assert.equal(Object.hasOwn(restrictedSanitized, "localRef"), false);
assert.equal(sensitiveInspectorValue.preparedBy, "production_console_operator");
assert.equal(sensitiveInspectorValue.self, sensitiveInspectorValue);
disposeProductionConsole(privacyModel);

// Safe text handling and static source checks protect the browser shell.
for (const payload of [
  "<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>", "<iframe></iframe>", "<object></object>", "<embed>"
]) {
  const escaped = escapeProductionConsoleText(payload);
  assert.equal(escaped.includes("<"), false, payload);
  assert.equal(escaped.includes(">"), false, payload);
}
assert.equal(escapeProductionConsoleText(0), "0");
assert.equal(escapeProductionConsoleText(false), "false");
assert.equal(escapeProductionConsoleText(""), "");

const html = await readFile(new URL("../production-console.html", import.meta.url), "utf8");
const css = await readFile(new URL("../css/production-console.css", import.meta.url), "utf8");
const source = await readFile(new URL("../js/broadcast/productionConsole.js", import.meta.url), "utf8");
for (const id of [
  "production-console",
  "console-preview",
  "console-program",
  "console-graphic-library",
  "console-layers-body",
  "console-outputs-list",
  "console-queue-list",
  "console-variables",
  "console-inspector"
]) assert.ok(html.includes(`id="${id}"`), `HTML missing ${id}`);
assert.equal(source.includes("innerHTML"), false);
assert.equal(source.includes("localStorage"), false);
assert.equal(/from\s+["'][^"']*firebase/i.test(source), false);
assert.equal(/\bfirebase\s*\.(database|firestore|storage|auth)/i.test(source), false);
assert.ok(source.includes('"firebaseconnected"'));
assert.equal(source.includes("../core/state.js"), false);
assert.equal(source.includes("broadcastContext"), false);
assert.equal(source.includes("live/current"), false);
assert.equal(source.includes("publicTournaments"), false);
assert.equal(source.includes("WebSocket"), false);
assert.equal(source.includes("EventSource"), false);
assert.equal(source.includes("setInterval"), false);
assert.equal(/\.program\s*=/.test(source), false);
assert.equal(/\.queue\s*=/.test(source), false);
assert.ok(source.includes("sanitizeProductionConsoleInspectorData(inspector, visibility"));
assert.ok(source.includes("pre.textContent = JSON.stringify(value, null, 2)"));
assert.ok(source.includes('const pre = refs.inspector.querySelector("pre")'));
assert.ok(source.includes("componentRegistry"));
assert.ok(source.includes('components: "Componentes"'));
assert.ok(source.includes("Crear componente de prueba"));
assert.ok(source.includes("Vista previa JSON"));
assert.ok(source.includes("sessionStorage"));
assert.ok(source.includes("fixtureId: model.fixtureId"));
assert.ok(source.includes("safeMode: model.safeMode"));
assert.equal(source.includes("programSnapshot: model.programSnapshot"), false);
const sessionWriterSource = source.slice(source.indexOf("function writeSessionSettings"), source.indexOf("async function copyText"));
assert.equal(sessionWriterSource.includes("state: model.state"), false);
assert.equal(sessionWriterSource.includes("componentRegistry"), false);
assert.ok(source.includes("dispatchBroadcastAction(action, actionContext"));
assert.ok(source.includes("variables: model.variableRegistry"));
assert.ok(source.includes("ACTION_TYPES.SET_VARIABLE"));
assert.ok(source.includes("ACTION_TYPES.RESET_VARIABLE"));
assert.ok(source.includes("ACTION_TYPES.ENABLE_VARIABLE"));
assert.ok(source.includes("ACTION_TYPES.DISABLE_VARIABLE"));
assert.ok(source.includes("Últimas acciones"));
assert.ok(source.includes("showOperationalActor"));
assert.ok(source.includes("? `${item.actor?.name || item.actor?.role || \"Sistema\"} · ${item.timestamp || \"-\"}`"));
const handlersSource = source.slice(source.indexOf("function bindConsoleEvents"), source.indexOf("function renderConsole"));
for (const protectedApi of [
  "setPreviewState(", "promotePreviewToProgram(", "clearPreviewState(", "clearProgramState(",
  "setLayerState(", "setGraphicState(", "setOutputState(", "enqueueBroadcastItem(",
  "dequeueBroadcastItem(", "updateBroadcastOutput(", "updateBroadcastOutputHeartbeat("
]) assert.equal(handlersSource.includes(protectedApi), false, `Console handler bypassed Action Engine with ${protectedApi}`);
assert.equal(css.includes("@media (max-width: 1600px)"), true);
assert.equal(css.includes("@media (max-width: 1199px)"), true);
assert.equal(css.includes("@media (max-width: 900px)"), true);
assert.equal(css.includes("overflow-x: hidden"), true);
assert.equal(css.includes("minmax(0, 1fr)"), true);

// A fresh model always starts with safe mode, Preview, Program and queue reset.
disposeProductionConsole(model);
const reloaded = createProductionConsoleModel({ now: T4 });
assert.equal(reloaded.safeMode, true);
assert.equal(reloaded.state.preview.active, false);
assert.equal(reloaded.state.program.active, false);
assert.equal(reloaded.programSnapshot, null);
assert.deepEqual(getBroadcastQueue(reloaded.state), []);
assert.equal(reloaded.variableRegistry.variables.var_production_message.value, null);
assert.equal(reloaded.variableRegistry.variables.var_production_message.revision, 0);
assert.equal(listBroadcastComponents(reloaded.componentRegistry).length, 0);
disposeProductionConsole(reloaded);

console.log("production-console.test.mjs: OK");
