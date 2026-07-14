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
  clearProductionConsoleComponentRenderer,
  clearProductionConsoleTemplateRenderer,
  clearProductionPreview,
  clearProductionProgram,
  clearProductionQueue,
  createProductionConsoleModel,
  createProductionConsoleComponentRenderer,
  createProductionConsoleTemplateRendererIntegration,
  createProductionConsoleTestComponent,
  createProductionConsoleTemplate,
  dispatchProductionConsoleAction,
  disposeProductionConsole,
  duplicateProductionConsoleComponent,
  duplicateProductionConsoleTemplate,
  enqueueProductionGraphic,
  escapeProductionConsoleText,
  getProductionConsoleTemplateClipboardSnapshot,
  getProductionConsoleTemplateRenderClipboardSnapshot,
  getProductionConsoleInspector,
  initializeProductionConsole,
  loadProductionConsoleFixture,
  prepareProductionPreview,
  instantiateProductionConsoleTemplate,
  instantiateProductionConsoleTemplateForRenderer,
  prepareProductionConsoleTemplateRenderer,
  removeProductionConsoleComponent,
  removeProductionConsoleTemplate,
  removeProductionQueueItem,
  renderProductionConsoleComponentFixture,
  renderProductionConsoleTemplateRenderer,
  restoreLastProductionPreview,
  resetProductionConsoleVariable,
  sanitizeProductionConsoleInspectorData,
  selectProductionAsset,
  selectProductionComponentRendererFixture,
  selectProductionComponentRendererOutput,
  selectProductionConsoleTemplate,
  selectProductionConsoleTemplateFixture,
  selectProductionConsoleTemplateRendererContext,
  selectProductionConsoleTemplateRendererOutput,
  selectProductionConsoleTemplateRendererVisibility,
  selectProductionGraphic,
  selectProductionOutput,
  setProductionLayerAction,
  setProductionOutputAction,
  setProductionConsoleVariable,
  setProductionConsoleVariableStatus,
  setProductionVisibility,
  snapshotProductionConsoleTemplate,
  transitionProductionToProgram,
  updateProductionConsoleTemplateRenderer,
  validateProductionConsoleModel
} from "../js/broadcast/productionConsole.js";
import { COMPONENT_RENDERER_VERSION, destroyComponentRenderer } from "../js/broadcast/componentRenderer.js?v=20260714-component-renderer-001-renderer-v1";
import { getBroadcastQueue, validateBroadcastState } from "../js/broadcast/broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import { getBroadcastOutput, validateBroadcastOutput } from "../js/broadcast/broadcastOutput.js?v=20260713-broadcast-output-001-output-v1";
import { listBroadcastAssets, validateBroadcastAsset } from "../js/broadcast/assetManager.js?v=20260713-asset-manager-001-assets-v1";
import { ACTION_TYPES } from "../js/broadcast/actionEngine.js?v=20260713-production-variables-001-variables-v1";
import { findBroadcastComponent, listBroadcastComponents, validateBroadcastComponent } from "../js/broadcast/componentLibrary.js";
import {
  createBroadcastTemplate,
  getRegisteredTemplate,
  listRegisteredTemplates,
  registerBroadcastTemplate,
  validateTemplateSnapshot
} from "../js/broadcast/templateEngine.js";
import {
  TEMPLATE_RENDERER_INTEGRATION_VERSION,
  destroyTemplateRendererIntegration,
  validateTemplateRenderSnapshot
} from "../js/broadcast/templateRendererIntegration.js?v=20260714-template-renderer-integration-001-composed-preview-v1";

const T0 = "2026-07-13T20:00:00.000Z";
const T1 = "2026-07-13T20:00:01.000Z";
const T2 = "2026-07-13T20:00:02.000Z";
const T3 = "2026-07-13T20:00:03.000Z";
const T4 = "2026-07-13T20:00:04.000Z";

assert.equal(PRODUCTION_CONSOLE_VERSION, "1.0.0");
assert.equal(PRODUCTION_CONSOLE_APP_VERSION, "20260714-template-renderer-integration-001-composed-preview-v1");
assert.equal(COMPONENT_RENDERER_VERSION, "1.0.0");
assert.equal(TEMPLATE_RENDERER_INTEGRATION_VERSION, "1.0.0");
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
assert.equal(model.variableRegistry.tenantId, model.fixtureSource.organization.tenantId);
assert.equal(listBroadcastComponents(model.componentRegistry).length, 0);
assert.equal(listRegisteredTemplates(model.templateRegistry).length, 0);
assert.equal(model.templateRendererState, "uninitialized");
assert.equal(model.templateRendererPreparation, null);
assert.equal(model.templateRendererResult, null);
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

// The renderer lab is visual-only and never mutates Preview, Program or registered Outputs.
const stateBeforeRenderer = structuredClone(model.state);
const outputsBeforeRenderer = Object.fromEntries(model.outputIds.map((outputId) => [outputId, structuredClone(getBroadcastOutput(outputId))]));
const rendererDocument = createRendererMockDocument();
const rendererTarget = rendererDocument.createElement("div");
rendererDocument.body.appendChild(rendererTarget);
let componentRenderer = createProductionConsoleComponentRenderer(model, rendererTarget, { rendererId: "console_renderer_test", now: T1 });
assert.equal(componentRenderer.state, "ready");
model = selectProductionComponentRendererFixture(model, "score");
model = renderProductionConsoleComponentFixture(model, componentRenderer, "render", { now: T1 });
assert.equal(model.componentRendererState, "rendered");
assert.equal(model.componentRendererResult.componentType, "score");
assert.equal(model.componentRendererSnapshot.components.length, 1);
model = renderProductionConsoleComponentFixture(model, componentRenderer, "update", { now: T2 });
assert.equal(model.componentRendererResult.renderId, "production_console_score");
destroyComponentRenderer(componentRenderer);

// Template Engine controls only prepare template instances and snapshots in memory.
const stateBeforeTemplates = structuredClone(model.state);
const outputsBeforeTemplates = Object.fromEntries(model.outputIds.map((outputId) => [outputId, structuredClone(getBroadcastOutput(outputId))]));
const rendererStateBeforeTemplates = structuredClone(model.componentRendererSnapshot);
for (const assetTemplateType of ["sponsor", "qr", "bug"]) {
  model = selectProductionConsoleTemplateFixture(model, assetTemplateType);
  model = createProductionConsoleTemplate(model, { now: T1 });
  model = instantiateProductionConsoleTemplate(model, model.selectedTemplateId, { now: T1 });
  assert.equal(model.templateInstanceResult.templateInstance.templateType, assetTemplateType);
  assert.doesNotThrow(() => getProductionConsoleInspector(model, { visibility: "production", now: T1 }));
  model = removeProductionConsoleTemplate(model, model.selectedTemplateId, { now: T1 });
}
model = selectProductionConsoleTemplateFixture(model, "scoreboard");
model = createProductionConsoleTemplate(model, { now: T1 });
assert.equal(model.inspectorTab, "templates");
assert.equal(listRegisteredTemplates(model.templateRegistry).length, 1);
const firstTemplateId = model.selectedTemplateId;
assert.equal(getRegisteredTemplate(model.templateRegistry, firstTemplateId).templateType, "scoreboard");
model = instantiateProductionConsoleTemplate(model, firstTemplateId, { now: T2 });
assert.equal(model.templateInstanceResult.templateInstance.templateId, firstTemplateId);
assert.equal(validateTemplateSnapshot(model.templateSnapshot).valid, true);
model = snapshotProductionConsoleTemplate(model, firstTemplateId, { now: T2 });
assert.equal(validateTemplateSnapshot(model.templateSnapshot).valid, true);
model = duplicateProductionConsoleTemplate(model, firstTemplateId, { now: T3 });
assert.equal(listRegisteredTemplates(model.templateRegistry).length, 2);
assert.notEqual(model.selectedTemplateId, firstTemplateId);
const duplicateTemplateId = model.selectedTemplateId;
model = selectProductionConsoleTemplate(model, duplicateTemplateId);
model = removeProductionConsoleTemplate(model, duplicateTemplateId, { now: T4 });
assert.equal(listRegisteredTemplates(model.templateRegistry).length, 1);
const templatesInspector = getProductionConsoleInspector(model, { visibility: "production", now: T4 }).templates;
assert.equal(templatesInspector.version, "1.0.0");
assert.equal(templatesInspector.registry.templates.length, 1);
assert.equal(templatesInspector.selected.templateId, firstTemplateId);

// Template Renderer Integration composes only inside its isolated laboratory.
const stateBeforeTemplateRenderer = structuredClone(model.state);
const previewBeforeTemplateRenderer = structuredClone(model.state.preview);
const programBeforeTemplateRenderer = structuredClone(model.state.program);
const outputsBeforeTemplateRenderer = Object.fromEntries(model.outputIds.map((outputId) => [outputId, structuredClone(getBroadcastOutput(outputId))]));
const templateRendererDocument = createRendererMockDocument();
const templateRendererTarget = templateRendererDocument.createElement("div");
templateRendererDocument.body.appendChild(templateRendererTarget);
model = selectProductionConsoleTemplateRendererContext(model, "equipos_3");
model = selectProductionConsoleTemplateRendererOutput(model, "component_16_9");
model = selectProductionConsoleTemplateRendererVisibility(model, "production");
let templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, templateRendererTarget, {
  integrationId: "console_template_renderer_test",
  now: T1
});
assert.equal(templateRendererIntegration.state, "ready");
model = instantiateProductionConsoleTemplateForRenderer(model, { now: T1 });
assert.equal(model.templateInstanceResult.templateInstance.templateId, firstTemplateId);
model = prepareProductionConsoleTemplateRenderer(model, { now: T2 });
assert.equal(model.templateRendererPreparation.status, "prepared");
assert.equal(model.templateRendererPreparation.componentInstances.length, 1);
model = renderProductionConsoleTemplateRenderer(model, templateRendererIntegration, { now: T2 });
assert.equal(model.templateRendererResult.status, "rendered");
assert.equal(model.templateRendererResult.componentCount, 1);
assert.equal(countByClass(templateRendererTarget, "cp-component-ranking-row"), 3);
assert.equal(validateTemplateRenderSnapshot(model.templateRendererSnapshot).valid, true);
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const stableTemplateRenderId = model.templateRendererResult.templateRenderId;
model = updateProductionConsoleTemplateRenderer(model, templateRendererIntegration, { now: T3 });
assert.equal(model.templateRendererResult.templateRenderId, stableTemplateRenderId);
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const renderClipboard = getProductionConsoleTemplateRenderClipboardSnapshot(model, templateRendererIntegration, { visibility: "production", now: T3 });
assert.equal(validateTemplateRenderSnapshot(renderClipboard).valid, true);
assert.equal(JSON.stringify(renderClipboard).includes("nodeType"), false);
assert.deepEqual(model.state, stateBeforeTemplateRenderer);
assert.deepEqual(model.state.preview, previewBeforeTemplateRenderer);
assert.deepEqual(model.state.program, programBeforeTemplateRenderer);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeTemplateRenderer[outputId]);
model = clearProductionConsoleTemplateRenderer(model, templateRendererIntegration, { now: T4 });
assert.equal(model.templateRendererState, "cleared");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 0);
destroyTemplateRendererIntegration(templateRendererIntegration);

model = selectProductionConsoleTemplateRendererOutput(model, "component_vertical");
templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, templateRendererTarget, {
  integrationId: "console_template_renderer_vertical",
  now: T4
});
assert.deepEqual(templateRendererIntegration.resolution, { width: 1080, height: 1920 });
assert.equal(templateRendererIntegration.orientation, "portrait");
destroyTemplateRendererIntegration(templateRendererIntegration);
model = selectProductionConsoleTemplateRendererOutput(model, "component_16_9");

model = selectProductionConsoleTemplateRendererContext(model, "equipos_4");
model = selectProductionConsoleTemplateFixture(model, "scoreboard");
model = createProductionConsoleTemplate(model, { now: T4 });
const fourTeamTemplateId = model.selectedTemplateId;
assert.equal(getRegisteredTemplate(model.templateRegistry, fourTeamTemplateId).metadata.consoleTeamCount, 4);
templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, templateRendererTarget, {
  integrationId: "console_template_renderer_four_teams",
  now: T4
});
model = prepareProductionConsoleTemplateRenderer(model, { now: T4 });
model = renderProductionConsoleTemplateRenderer(model, templateRendererIntegration, { now: T4 });
assert.equal(countByClass(templateRendererTarget, "cp-component-ranking-row"), 4);
destroyTemplateRendererIntegration(templateRendererIntegration);
model = removeProductionConsoleTemplate(model, fourTeamTemplateId, { now: T4 });
model = selectProductionConsoleTemplateRendererContext(model, "equipos_3");

for (const [templateType, expectedText] of [
  ["roster", "José de la Torre"],
  ["ticker", "CharroPro"],
  ["standings", "Rancho El Laurel"]
]) {
  model = selectProductionConsoleTemplateFixture(model, templateType);
  model = createProductionConsoleTemplate(model, { now: T4 });
  templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, templateRendererTarget, {
    integrationId: `console_template_renderer_${templateType}`,
    now: T4
  });
  model = prepareProductionConsoleTemplateRenderer(model, { now: T4 });
  model = renderProductionConsoleTemplateRenderer(model, templateRendererIntegration, { now: T4 });
  assert.equal(templateRendererTarget.textContent.includes(expectedText), true, templateType);
  assert.equal(templateRendererTarget.textContent.includes("[object Object]"), false, templateType);
  destroyTemplateRendererIntegration(templateRendererIntegration);
  model = removeProductionConsoleTemplate(model, model.selectedTemplateId, { now: T4 });
}

// Templates display and copy the same visibility-aware snapshot, never the full inspector.
const clipboardSource = getRegisteredTemplate(model.templateRegistry, firstTemplateId);
const privateClipboardTemplate = createBroadcastTemplate({
  ...clipboardSource,
  templateId: "template_console_clipboard_private",
  visibility: "public",
  status: "draft",
  tenantId: "tenant_private",
  organizationId: "organization_private",
  components: clipboardSource.components.map((component) => ({
    ...component,
    visibility: "public",
    tenantId: "tenant_private",
    createdBy: "template_operator",
    metadata: {
      ...component.metadata,
      apiKey: "secret-key",
      plugins: ["runtime-plugin"],
      safeLabel: "visible"
    }
  })),
  metadata: { apiKey: "template-secret", plugins: ["template-plugin"] },
  createdBy: undefined,
  updatedBy: undefined
}, {
  actor: { id: "clipboard_operator", name: "Clipboard operator", role: "producer" },
  now: T4
});
model = {
  ...model,
  visibility: "public",
  selectedTemplateId: privateClipboardTemplate.templateId,
  templateRegistry: registerBroadcastTemplate(model.templateRegistry, privateClipboardTemplate, {
    expectedRevision: model.templateRegistry.revision,
    now: T4
  })
};
const clipboardSnapshot = getProductionConsoleTemplateClipboardSnapshot(model, { visibility: "public", now: T4 });
const clipboardJson = JSON.stringify(clipboardSnapshot);
for (const privateValue of [
  "template_operator", "clipboard_operator", "tenant_private", "organization_private",
  "secret-key", "template-secret", "runtime-plugin", "template-plugin", "apiKey", "plugins"
]) assert.equal(clipboardJson.includes(privateValue), false, privateValue);
assert.equal(clipboardJson.includes(privateClipboardTemplate.templateId), true);
assert.equal(clipboardJson.includes('"templateType":"scoreboard"'), true);
assert.equal(clipboardJson.includes('"components"'), true);
assert.equal(clipboardJson.includes('"safeLabel":"visible"'), true);
const publicTemplatesInspector = getProductionConsoleInspector(model, { visibility: "public", now: T4 }).templates;
assert.deepEqual(publicTemplatesInspector.clipboardSnapshot, clipboardSnapshot);
assert.deepEqual(publicTemplatesInspector.snapshot, clipboardSnapshot);
assert.equal("registry" in clipboardSnapshot, false);
model = removeProductionConsoleTemplate(model, privateClipboardTemplate.templateId, { now: T4 });
model = { ...model, visibility: "production" };
assert.deepEqual(model.state, stateBeforeTemplates);
assert.deepEqual(model.componentRendererSnapshot, rendererStateBeforeTemplates);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeTemplates[outputId]);
model = selectProductionComponentRendererOutput(model, "component_vertical");
componentRenderer = createProductionConsoleComponentRenderer(model, rendererTarget, { rendererId: "console_renderer_vertical", now: T2 });
assert.equal(componentRenderer.orientation, "portrait");
model = renderProductionConsoleComponentFixture(model, componentRenderer, "render", { now: T2 });
model = clearProductionConsoleComponentRenderer(model, componentRenderer, { now: T3 });
assert.equal(model.componentRendererState, "cleared");
assert.equal(model.componentRendererSnapshot.components.length, 0);
assert.deepEqual(model.state, stateBeforeRenderer);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeRenderer[outputId]);
destroyComponentRenderer(componentRenderer);

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
  "console-template-lab",
  "console-template-fixture",
  "console-template-status",
  "console-template-renderer-lab",
  "console-template-renderer-template",
  "console-template-renderer-context",
  "console-template-renderer-output",
  "console-template-renderer-visibility",
  "console-template-renderer-frame",
  "console-template-renderer-safe-area",
  "console-template-renderer-target",
  "console-template-renderer-metrics",
  "console-component-renderer-lab",
  "console-component-renderer-target",
  "console-component-renderer-fixture",
  "console-component-renderer-output",
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
assert.ok(source.includes('templates: "Templates"'));
assert.ok(source.includes("createProductionConsoleTemplate"));
assert.ok(source.includes("instantiateProductionConsoleTemplate"));
assert.ok(source.includes("getProductionConsoleTemplateClipboardSnapshot"));
assert.ok(source.includes('copy.dataset.copyJson = "template-snapshot"'));
assert.ok(html.includes("Template Engine V1"));
assert.ok(html.includes("Laboratorio de Templates V2"));
assert.ok(source.includes("TEMPLATE_RENDERER_INTEGRATION_VERSION"));
assert.ok(source.includes("prepareProductionConsoleTemplateRenderer"));
assert.ok(source.includes("renderProductionConsoleTemplateRenderer"));
assert.ok(source.includes("updateProductionConsoleTemplateRenderer"));
assert.ok(source.includes("clearProductionConsoleTemplateRenderer"));
assert.ok(source.includes("getProductionConsoleTemplateRenderClipboardSnapshot"));
assert.ok(source.includes("Crear componente de prueba"));
assert.ok(html.includes("Laboratorio de Componentes V2"));
assert.ok(source.includes("COMPONENT_RENDERER_VERSION"));
assert.ok(source.includes("renderProductionConsoleComponentFixture"));
assert.ok(source.includes("clearProductionConsoleComponentRenderer"));
assert.ok(source.includes("sessionStorage"));
assert.ok(source.includes("fixtureId: model.fixtureId"));
assert.ok(source.includes("safeMode: model.safeMode"));
assert.equal(source.includes("programSnapshot: model.programSnapshot"), false);
const sessionWriterSource = source.slice(source.indexOf("function writeSessionSettings"), source.indexOf("async function copyText"));
assert.equal(sessionWriterSource.includes("state: model.state"), false);
assert.equal(sessionWriterSource.includes("componentRegistry"), false);
assert.equal(sessionWriterSource.includes("templateRegistry"), false);
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
assert.equal(listRegisteredTemplates(reloaded.templateRegistry).length, 0);
disposeProductionConsole(reloaded);

// Initialization is idempotent per root; dispose removes only its listeners and permits a clean restart.
const lifecycleHarness = createConsoleLifecycleHarness();
const firstInitialization = initializeProductionConsole(lifecycleHarness.root);
const secondInitialization = initializeProductionConsole(lifecycleHarness.root);
assert.strictEqual(secondInitialization, firstInitialization);
lifecycleHarness.templateAction.dispatchEvent(new Event("click"));
assert.equal(listRegisteredTemplates(firstInitialization.getModel().templateRegistry).length, 1);
firstInitialization.dispose();
lifecycleHarness.templateAction.dispatchEvent(new Event("click"));
assert.equal(listRegisteredTemplates(firstInitialization.getModel().templateRegistry).length, 1);
const thirdInitialization = initializeProductionConsole(lifecycleHarness.root);
assert.notStrictEqual(thirdInitialization, firstInitialization);
lifecycleHarness.templateAction.dispatchEvent(new Event("click"));
assert.equal(listRegisteredTemplates(thirdInitialization.getModel().templateRegistry).length, 1);
thirdInitialization.dispose();

console.log("production-console.test.mjs: OK");

function createConsoleLifecycleHarness() {
  const templateAction = new EventTarget();
  templateAction.dataset = { templateAction: "create" };
  const consoleRoot = {};
  const root = {
    querySelector(selector) {
      return selector === "#production-console" ? consoleRoot : null;
    },
    querySelectorAll(selector) {
      return selector === "[data-template-action]" ? [templateAction] : [];
    }
  };
  return { root, templateAction };
}

function createRendererMockDocument() {
  class Element {
    constructor(tagName, ownerDocument) {
      this.nodeType = 1;
      this.tagName = String(tagName).toUpperCase();
      this.namespaceURI = "http://www.w3.org/1999/xhtml";
      this.ownerDocument = ownerDocument;
      this.parentNode = null;
      this.children = [];
      this.style = {};
      this.className = "";
      this.attributes = new Map();
      this.isConnected = false;
      this._textContent = "";
      this.clientWidth = 1920;
      this.clientHeight = 1080;
    }
    appendChild(child) { child.remove(); child.parentNode = this; child.setConnected(this.isConnected); this.children.push(child); return child; }
    append(...children) { children.forEach((child) => this.appendChild(child)); }
    replaceChildren(...children) { this.children.forEach((child) => { child.parentNode = null; child.setConnected(false); }); this.children = []; this._textContent = ""; this.append(...children); }
    replaceWith(next) { if (!this.parentNode) return; const parent = this.parentNode; const index = parent.children.indexOf(this); this.parentNode = null; next.parentNode = parent; next.setConnected(parent.isConnected); parent.children[index] = next; }
    remove() { if (!this.parentNode) return; const parent = this.parentNode; parent.children = parent.children.filter((child) => child !== this); this.parentNode = null; this.setConnected(false); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    removeAttribute(name) { this.attributes.delete(name); }
    setConnected(value) { this.isConnected = value; this.children.forEach((child) => child.setConnected(value)); }
    set textContent(value) { this.replaceChildren(); this._textContent = String(value ?? ""); }
    get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
  }
  const mockDocument = {
    nodeType: 9,
    baseURI: "https://charropro.test/production-console.html",
    defaultView: { location: new URL("https://charropro.test/production-console.html"), HTMLElement: Element },
    createElement(tagName) { return new Element(tagName, mockDocument); }
  };
  mockDocument.body = mockDocument.createElement("body");
  mockDocument.body.isConnected = true;
  return mockDocument;
}

function countByClass(root, className) {
  if (!root) return 0;
  const own = String(root.className || "").split(/\s+/).includes(className) ? 1 : 0;
  return own + (root.children || []).reduce((total, child) => total + countByClass(child, className), 0);
}
