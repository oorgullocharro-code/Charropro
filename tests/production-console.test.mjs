import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PRODUCTION_CONSOLE_APP_VERSION,
  PRODUCTION_CONSOLE_FIXTURES,
  PRODUCTION_CONSOLE_GRAPHICS,
  PRODUCTION_CONSOLE_OUTPUT_ROUTES,
  PRODUCTION_CONSOLE_THEME_DEFINITIONS,
  PRODUCTION_CONSOLE_VERSION,
  activateProductionConsoleTheme,
  buildProductionProjection,
  buildProductionRenderDescriptor,
  changeProductionQueuePriority,
  clearProductionConsoleComponentRenderer,
  clearProductionConsoleTemplateRenderer,
  clearProductionConsoleThemeTemplate,
  clearProductionConsoleOfficialPreview,
  clearProductionConsoleOfficialProgram,
  clearProductionConsoleOutputRoute,
  clearProductionPreview,
  clearProductionProgram,
  clearProductionQueue,
  createProductionConsoleModel,
  createProductionConsoleComponentRenderer,
  createProductionConsoleTemplateRendererIntegration,
  createProductionConsoleThemeTemplateIntegration,
  createProductionConsoleOfficialPreviewEngine,
  createProductionConsoleOfficialProgramEngine,
  createProductionConsoleOutputRoutingEngine,
  createProductionConsoleTestComponent,
  createProductionConsoleTemplate,
  createProductionConsoleTheme,
  deactivateProductionConsoleTheme,
  dispatchProductionConsoleAction,
  disposeProductionConsole,
  duplicateProductionConsoleComponent,
  duplicateProductionConsoleTemplate,
  duplicateProductionConsoleTheme,
  enqueueProductionGraphic,
  escapeProductionConsoleText,
  getProductionConsoleTemplateClipboardSnapshot,
  getProductionConsoleTemplateRenderClipboardSnapshot,
  getProductionConsoleThemeTemplateClipboardSnapshot,
  getProductionConsoleOfficialPreviewClipboardSnapshot,
  getProductionConsoleOfficialProgramClipboardSnapshot,
  getProductionConsoleOutputRoutingClipboardSnapshot,
  getProductionConsoleInspector,
  getProductionConsoleThemeClipboardSnapshot,
  initializeProductionConsole,
  loadProductionConsoleFixture,
  prepareProductionPreview,
  instantiateProductionConsoleTemplate,
  instantiateProductionConsoleTemplateForRenderer,
  prepareProductionConsoleTemplateRenderer,
  prepareProductionConsoleThemeTemplate,
  prepareProductionConsoleOfficialPreview,
  prepareProductionConsoleOfficialProgram,
  removeProductionConsoleComponent,
  removeProductionConsoleTemplate,
  removeProductionConsoleTheme,
  removeProductionQueueItem,
  renderProductionConsoleComponentFixture,
  renderProductionConsoleTemplateRenderer,
  renderProductionConsoleThemeTemplate,
  renderProductionConsoleOfficialPreview,
  resolveProductionConsoleOutputRoute,
  resolveProductionConsoleThemeTemplate,
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
  selectProductionConsoleThemeTemplateTheme,
  selectProductionConsoleTheme,
  selectProductionGraphic,
  selectProductionOutput,
  setProductionLayerAction,
  setProductionOutputAction,
  setProductionConsoleOutputRouteEnabled,
  setProductionConsoleVariable,
  setProductionConsoleVariableStatus,
  setProductionVisibility,
  snapshotProductionConsoleTemplate,
  snapshotProductionConsoleTheme,
  transitionProductionToProgram,
  updateProductionConsoleTemplateRenderer,
  updateProductionConsoleThemeTemplate,
  updateProductionConsoleOfficialPreview,
  updateProductionConsoleOfficialProgram,
  configureProductionConsoleOutputRoute,
  takeProductionConsoleOfficialProgram,
  cutProductionConsoleOfficialProgram,
  autoProductionConsoleOfficialProgram,
  validateProductionConsoleModel
} from "../js/broadcast/productionConsole.js";
import { destroyPreviewEngine, validatePreview } from "../js/broadcast/previewEngine.js?v=20260715-preview-engine-001-official-preview-v1";
import { destroyProgramEngine, validateProgram } from "../js/broadcast/programEngine.js?v=20260715-program-engine-001-official-program-v1";
import {
  destroyOutputRoutingEngine,
  listOutputRoutes,
  validateOutputRoutingSnapshot
} from "../js/broadcast/outputRouting.js?v=20260715-browser-output-001-common-web-output-infrastructure-v1";
import {
  configureOutputSynchronization,
  createOutputSynchronization,
  startOutputSynchronization,
  synchronizeProgramMain
} from "../js/broadcast/outputSynchronization.js";
import {
  buildProgramMainOutputSnapshot,
  configureProgramMainOutput,
  createProgramMainOutput,
  mountProgramMainOutput
} from "../js/broadcast/programMainOutput.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import { listBroadcastThemes, resolveBroadcastTheme, validateBroadcastTheme } from "../js/broadcast/themeEngine.js";
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
import {
  THEME_TEMPLATE_INTEGRATION_VERSION,
  destroyThemeTemplateIntegration,
  validateThemeTemplateSnapshot
} from "../js/broadcast/themeTemplateIntegration.js?v=20260714-theme-template-integration-001-themed-compositions-v1";

const T0 = "2026-07-13T20:00:00.000Z";
const T1 = "2026-07-13T20:00:01.000Z";
const T2 = "2026-07-13T20:00:02.000Z";
const T3 = "2026-07-13T20:00:03.000Z";
const T4 = "2026-07-13T20:00:04.000Z";

assert.equal(PRODUCTION_CONSOLE_VERSION, "1.0.0");
assert.equal(PRODUCTION_CONSOLE_APP_VERSION, "20260715-broadcast-access-and-sync-001-local-output-sync-v1");
assert.equal(COMPONENT_RENDERER_VERSION, "1.0.0");
assert.equal(TEMPLATE_RENDERER_INTEGRATION_VERSION, "1.0.0");
assert.equal(THEME_TEMPLATE_INTEGRATION_VERSION, "1.0.0");
assert.equal(PRODUCTION_CONSOLE_FIXTURES.length, 6);
assert.equal(Object.keys(PRODUCTION_CONSOLE_GRAPHICS).length, 8);
assert.equal(PRODUCTION_CONSOLE_THEME_DEFINITIONS.length, 7);
assert.deepEqual(PRODUCTION_CONSOLE_OUTPUT_ROUTES.map((route) => route.outputId), ["program-main", "announcer-monitor", "timer-display"]);

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
assert.equal(model.themeTemplateThemeId, "theme_default");
assert.equal(model.themeTemplateState, "uninitialized");
assert.equal(model.themeTemplatePreparation, null);
assert.equal(model.themeTemplateResult, null);
for (const outputId of model.outputIds) {
  const output = getBroadcastOutput(outputId);
  assert.equal(validateBroadcastOutput(output).valid, true);
  assert.equal(output.status, "offline");
  assert.equal(output.assignedLayers.length, 9);
}

// Theme controls stay in memory and never mutate Preview, Program, Broadcast State or Outputs.
assert.equal(listBroadcastThemes(model.themeRegistry).length, 7);
assert.equal(model.themeRegistry.activeThemeId, "theme_default");
assert.equal(listBroadcastThemes(model.themeRegistry).every((theme) => validateBroadcastTheme(theme).valid), true);
assert.equal(model.themeRegistry.themes.theme_default.status, "active");
assert.equal(listBroadcastThemes(model.themeRegistry).filter((theme) => theme.themeId !== "theme_default").every((theme) => theme.status === "published"), true);
assert.equal(model.themeRegistry.themes.theme_orgullo_charro.metadata.brandingStatus, "confirmed");
assert.equal(model.themeRegistry.themes.theme_liga_mexicana.metadata.brandingStatus, "provisional");
assert.equal(model.themeRegistry.themes.theme_liga_mexicana.name, "Liga Mexicana - Provisional");
const resolvedOrgulloTheme = resolveBroadcastTheme(model.themeRegistry, "theme_orgullo_charro");
for (const legacyGold of ["#D6AD43", "#F0CC69", "#C79A3B", "#E9C66B"]) {
  assert.equal(JSON.stringify({
    colors: resolvedOrgulloTheme.colors,
    borders: resolvedOrgulloTheme.borders,
    shadows: resolvedOrgulloTheme.shadows,
    backgrounds: resolvedOrgulloTheme.backgrounds
  }).includes(legacyGold), false);
}
const stateBeforeThemes = structuredClone(model.state);
const previewBeforeThemes = structuredClone(model.state.preview);
const programBeforeThemes = structuredClone(model.state.program);
const outputsBeforeThemes = Object.fromEntries(model.outputIds.map((outputId) => [outputId, structuredClone(getBroadcastOutput(outputId))]));
model = selectProductionConsoleTheme(model, "theme_orgullo_charro");
model = activateProductionConsoleTheme(model, "theme_orgullo_charro", { now: T2 });
assert.equal(model.themeRegistry.activeThemeId, "theme_orgullo_charro");
assert.equal(model.themeRegistry.themes.theme_default.status, "inactive");
model = duplicateProductionConsoleTheme(model, "theme_orgullo_charro", { id: "theme_console_copy", now: T1 });
assert.equal(listBroadcastThemes(model.themeRegistry).length, 8);
assert.equal(model.selectedThemeId, "theme_console_copy");
assert.equal(model.themeRegistry.themes.theme_console_copy.status, "draft");
model = snapshotProductionConsoleTheme(model, { visibility: "public", now: T2 });
assert.equal(model.themeSnapshot.themeEngineVersion, "1.0.0");
assert.equal(model.themeSnapshot.activeThemeId, "theme_orgullo_charro");
model = removeProductionConsoleTheme(model, "theme_console_copy", { now: T3 });
assert.equal(listBroadcastThemes(model.themeRegistry).length, 7);
model = deactivateProductionConsoleTheme(model, "theme_orgullo_charro", { now: T3 });
assert.equal(model.themeRegistry.activeThemeId, null);
model = activateProductionConsoleTheme(model, "theme_default", { now: T4 });
model = createProductionConsoleTheme(model, { id: "theme_console_temporary", now: T4 });
assert.equal(listBroadcastThemes(model.themeRegistry).length, 8);
model = removeProductionConsoleTheme(model, "theme_console_temporary", { now: T4 });
assert.equal(listBroadcastThemes(model.themeRegistry).length, 7);
assert.deepEqual(model.state, stateBeforeThemes);
assert.deepEqual(model.state.preview, previewBeforeThemes);
assert.deepEqual(model.state.program, programBeforeThemes);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeThemes[outputId]);

const themesInspector = getProductionConsoleInspector(model, { visibility: "production", now: T4 }).themes;
assert.equal(themesInspector.version, "1.0.0");
assert.equal(themesInspector.registry.themes.length, 7);
assert.equal(themesInspector.registry.activeThemeId, "theme_default");
assert.equal(themesInspector.resolved.id, "theme_default");
assert.ok(themesInspector.resolved.colors.accent);
const publicThemeSnapshot = getProductionConsoleThemeClipboardSnapshot(model, { visibility: "public", now: T4 });
assert.equal(publicThemeSnapshot.themes.every((theme) => theme.visibility === "public"), true);
assert.equal(publicThemeSnapshot.themes.every((theme) => ["confirmed", "provisional", "neutral"].includes(theme.metadata?.brandingStatus)), true);
for (const unsafeField of ["tenantId", "organizationId", "sessionId", "actor", "signedUrl", "externalUrl", "storageRef"]) {
  assert.equal(JSON.stringify(publicThemeSnapshot).includes(`"${unsafeField}"`), false);
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

// Theme + Template Lab applies a resolved Theme manually without touching Preview, Program or Outputs.
templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, templateRendererTarget, {
  integrationId: "console_theme_template_renderer_test",
  now: T1
});
let themeTemplateIntegration = createProductionConsoleThemeTemplateIntegration(model, templateRendererIntegration, { now: T1 });
model = selectProductionConsoleThemeTemplateTheme(model, "theme_orgullo_charro");
model = resolveProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T1 });
assert.equal(model.themeTemplateResolution.themeId, "theme_orgullo_charro");
assert.equal(model.themeTemplateResolution.brandingStatus, "confirmed");
model = prepareProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T2 });
assert.equal(model.themeTemplatePreparation.status, "prepared");
assert.equal(model.themeTemplatePreparation.appliedTokens.length > 0, true);
model = renderProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T2 });
assert.equal(["rendered", "partially_rendered"].includes(model.themeTemplateResult.status), true);
assert.equal(model.themeTemplateResult.themeId, "theme_orgullo_charro");
assert.equal(countByClass(templateRendererTarget, "cp-component-ranking-row"), 3);
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const themedRenderId = model.themeTemplateResult.themedRenderId;
const themedTemplateRenderId = model.themeTemplateResult.templateRenderId;
model = selectProductionConsoleThemeTemplateTheme(model, "theme_dark");
model = updateProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T3 });
assert.equal(model.themeTemplateResult.themedRenderId, themedRenderId);
assert.equal(model.themeTemplateResult.templateRenderId, themedTemplateRenderId);
assert.equal(model.themeTemplateResult.themeId, "theme_dark");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const themedRootBeforeVisibility = templateRendererTarget.children[0];
model = selectProductionConsoleTemplateRendererVisibility(model, "public");
assert.equal(model.themeTemplateResult.themedRenderId, themedRenderId);
model = updateProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T3 });
assert.equal(model.themeTemplateResult.visibility, "public");
assert.equal(templateRendererTarget.children[0], themedRootBeforeVisibility);
model = selectProductionConsoleTemplateRendererVisibility(model, "production");
model = updateProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T3 });
assert.equal(model.themeTemplateResult.visibility, "production");
const themedClipboard = getProductionConsoleThemeTemplateClipboardSnapshot(model, themeTemplateIntegration, {
  visibility: "production", now: T3
});
assert.equal(validateThemeTemplateSnapshot(themedClipboard).valid, true);
assert.equal(JSON.stringify(themedClipboard).includes("nodeType"), false);
const themeTemplateInspector = getProductionConsoleInspector(model, { visibility: "production", now: T3 }).templates.themeTemplateIntegration;
assert.equal(themeTemplateInspector.version, "1.0.0");
assert.equal(themeTemplateInspector.resolvedTheme.themeId, "theme_dark");
assert.equal(themeTemplateInspector.themedRenderResult.themeId, "theme_dark");
assert.deepEqual(model.state, stateBeforeTemplateRenderer);
assert.deepEqual(model.state.preview, previewBeforeTemplateRenderer);
assert.deepEqual(model.state.program, programBeforeTemplateRenderer);
for (const outputId of model.outputIds) assert.deepEqual(getBroadcastOutput(outputId), outputsBeforeTemplateRenderer[outputId]);
model = clearProductionConsoleThemeTemplate(model, themeTemplateIntegration, { now: T4 });
assert.equal(model.themeTemplateState, "cleared");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 0);
destroyThemeTemplateIntegration(themeTemplateIntegration, { now: T4 });
destroyTemplateRendererIntegration(templateRendererIntegration);

// Official Preview owns one isolated themed composition and never mutates Broadcast State or Program.
templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, templateRendererTarget, {
  integrationId: "console_official_preview_renderer_test",
  now: T1
});
themeTemplateIntegration = createProductionConsoleThemeTemplateIntegration(model, templateRendererIntegration, { now: T1 });
const officialPreparationStore = { preparation: null };
const officialPreviewEngine = createProductionConsoleOfficialPreviewEngine(
  model,
  themeTemplateIntegration,
  officialPreparationStore,
  { now: T1 }
);
model = selectProductionConsoleThemeTemplateTheme(model, "theme_orgullo_charro");
model = prepareProductionConsoleOfficialPreview(
  model,
  officialPreviewEngine,
  officialPreparationStore,
  themeTemplateIntegration,
  { now: T1 }
);
assert.equal(model.officialPreviewState, "prepared");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 0);
model = renderProductionConsoleOfficialPreview(model, officialPreviewEngine, { now: T2 });
assert.equal(model.officialPreviewState, "rendered");
assert.equal(validatePreview(model.officialPreview).valid, true);
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const officialPreviewId = model.officialPreview.previewId;
model = selectProductionConsoleThemeTemplateTheme(model, "theme_dark");
model = updateProductionConsoleOfficialPreview(model, officialPreviewEngine, { now: T3 });
assert.equal(model.officialPreview.previewId, officialPreviewId);
assert.equal(model.officialPreview.themeId, "theme_dark");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const officialSnapshot = getProductionConsoleOfficialPreviewClipboardSnapshot(model, officialPreviewEngine, {
  visibility: "public",
  now: T3
});
assert.equal(JSON.stringify(officialSnapshot).includes("nodeType"), false);
assert.equal(JSON.stringify(officialSnapshot).includes("tenantId"), false);
assert.deepEqual(model.state, stateBeforeTemplateRenderer);
assert.deepEqual(model.state.program, programBeforeTemplateRenderer);

// Official Program promotes only the Official Preview snapshot and never consumes Preview.
const officialProgramEngine = createProductionConsoleOfficialProgramEngine(model, {
  engineId: "console_official_program_test",
  now: T3
});
model = prepareProductionConsoleOfficialProgram(model, officialProgramEngine, officialPreviewEngine, { now: T3 });
assert.equal(model.officialProgramState, "prepared");
assert.equal(model.officialPreviewState, "rendered");
model = takeProductionConsoleOfficialProgram(model, officialProgramEngine, { now: T3 });
assert.equal(model.officialProgramState, "program");
assert.equal(validateProgram(model.officialProgram).valid, true);
assert.equal(model.officialProgram.previewId, model.officialPreview.previewId);
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
const officialProgramId = model.officialProgram.programId;

model = prepareProductionConsoleOfficialProgram(model, officialProgramEngine, officialPreviewEngine, { now: T3 });
model = cutProductionConsoleOfficialProgram(model, officialProgramEngine, { now: T3 });
assert.equal(model.officialProgram.programId, officialProgramId);
assert.equal(model.officialProgram.transitionMode, "cut");
model = prepareProductionConsoleOfficialProgram(model, officialProgramEngine, officialPreviewEngine, { now: T3 });
model = autoProductionConsoleOfficialProgram(model, officialProgramEngine, { now: T3 });
assert.equal(model.officialProgram.programId, officialProgramId);
assert.equal(model.officialProgram.transitionMode, "auto");
model = updateProductionConsoleOfficialProgram(model, officialProgramEngine, officialPreviewEngine, { now: T3 });
assert.equal(model.officialProgram.programId, officialProgramId);
assert.equal(model.officialProgram.transitionMode, "update");

const officialProgramSnapshot = getProductionConsoleOfficialProgramClipboardSnapshot(
  model,
  officialProgramEngine,
  { visibility: "public", now: T3 }
);
assert.doesNotThrow(() => JSON.stringify(officialProgramSnapshot));
assert.equal(JSON.stringify(officialProgramSnapshot).includes("nodeType"), false);
assert.equal(JSON.stringify(officialProgramSnapshot).includes("runtime"), false);
assert.equal(JSON.stringify(officialProgramSnapshot).includes("tenantId"), false);
assert.deepEqual(model.state, stateBeforeTemplateRenderer);
assert.deepEqual(model.state.program, programBeforeTemplateRenderer);

// Output Routing exposes exactly three logical, read-only routes and never mutates Program or the official timer source.
const outputRoutingEngine = createProductionConsoleOutputRoutingEngine(model, {
  engineId: "console_output_routing_test",
  now: T3
});
assert.deepEqual(listOutputRoutes(outputRoutingEngine).map((route) => route.outputId), ["announcer-monitor", "program-main", "timer-display"]);
const officialProgramBeforeRouting = structuredClone(model.officialProgram);
const contractBeforeRouting = structuredClone(model.contract);
model = configureProductionConsoleOutputRoute(model, outputRoutingEngine, "route-program-main", { now: T3 });
model = resolveProductionConsoleOutputRoute(model, outputRoutingEngine, "route-program-main", {
  programEngine: officialProgramEngine,
  now: T3
});
assert.equal(model.outputRoutingResults["route-program-main"].projection.programId, officialProgramId);
assert.equal(model.outputRoutingResults["route-program-main"].projection.kind, "program-main");

// The actual Production Console Program reaches the mounted local Program Main target.
const synchronizedProgramDocument = createRendererMockDocument();
const synchronizedProgramHost = synchronizedProgramDocument.createElement("section");
synchronizedProgramDocument.body.appendChild(synchronizedProgramHost);
const synchronizedProgramOutput = createProgramMainOutput({
  programMainOutputId: "production_console_program_main_test",
  browserOutputId: "production_console_browser_program_main_test"
}, { now: T3 });
configureProgramMainOutput(synchronizedProgramOutput, {
  programMainOutputId: "production_console_program_main_test",
  browserOutputId: "production_console_browser_program_main_test",
  routeId: "route-program-main",
  outputId: "program-main",
  routeType: "program_main",
  sourceType: "program_snapshot",
  displayMode: "fit",
  visibility: model.officialProgram.visibility,
  resolution: { width: 1920, height: 1080 },
  orientation: "landscape",
  safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
  transparentBackground: true,
  tournamentId: model.contract.tournament.id,
  competitionId: model.contract.competition.id
}, { now: T3 });
mountProgramMainOutput(synchronizedProgramOutput, synchronizedProgramHost, { now: T3 });
const productionConsoleSynchronization = createOutputSynchronization({
  synchronizationId: "production_console_output_sync_test"
}, { now: T3 });
configureOutputSynchronization(productionConsoleSynchronization, {
  targets: ["program_main"],
  staleAfterMs: 60000,
  context: {
    tournamentId: model.contract.tournament.id,
    competitionId: model.contract.competition.id
  }
}, { expectedRevision: 0, now: T3 });
startOutputSynchronization(productionConsoleSynchronization, { expectedRevision: 1, now: T3 });
const productionConsoleSyncResult = synchronizeProgramMain(productionConsoleSynchronization, {
  routingEngine: outputRoutingEngine,
  programEngine: officialProgramEngine,
  programMainOutput: synchronizedProgramOutput,
  context: {
    tournamentId: model.contract.tournament.id,
    competitionId: model.contract.competition.id
  }
}, { expectedRevision: 2, now: T3 });
assert.equal(productionConsoleSyncResult.targets.program_main.status, "synchronized");
assert.equal(buildProgramMainOutputSnapshot(synchronizedProgramOutput, { now: T3 }).programId, officialProgramId);

model = resolveProductionConsoleOutputRoute(model, outputRoutingEngine, "route-announcer-monitor", { now: T3 });
assert.equal(model.outputRoutingResults["route-announcer-monitor"].visibility, "operational");
assert.equal(model.outputRoutingResults["route-announcer-monitor"].projection.kind, "announcer-monitor");
assert.equal("controls" in model.outputRoutingResults["route-announcer-monitor"].projection, false);
model = resolveProductionConsoleOutputRoute(model, outputRoutingEngine, "route-timer-display", { now: T3 });
assert.equal(model.outputRoutingResults["route-timer-display"].projection.kind, "timer-display");
assert.equal(model.outputRoutingResults["route-timer-display"].projection.formattedTime, model.contract.timer.display);
assert.equal(model.outputRoutingResults["route-timer-display"].projection.sourceRevision, model.contract.timer.revision);
assert.equal("controls" in model.outputRoutingResults["route-timer-display"].projection, false);
assert.deepEqual(model.officialProgram, officialProgramBeforeRouting);
assert.deepEqual(model.contract, contractBeforeRouting);
const announcerProjectionBeforeDisable = structuredClone(model.outputRoutingResults["route-announcer-monitor"]);
model = setProductionConsoleOutputRouteEnabled(model, outputRoutingEngine, "route-timer-display", false, { now: T3 });
assert.equal(listOutputRoutes(outputRoutingEngine).find((route) => route.routeId === "route-timer-display").enabled, false);
assert.deepEqual(model.outputRoutingResults["route-announcer-monitor"], announcerProjectionBeforeDisable);
model = setProductionConsoleOutputRouteEnabled(model, outputRoutingEngine, "route-timer-display", true, { now: T3 });
model = clearProductionConsoleOutputRoute(model, outputRoutingEngine, "route-program-main", { now: T3 });
assert.equal(model.outputRoutingResults["route-program-main"], undefined);
assert.deepEqual(model.outputRoutingResults["route-announcer-monitor"], announcerProjectionBeforeDisable);
const outputRoutingSnapshot = getProductionConsoleOutputRoutingClipboardSnapshot(model, outputRoutingEngine, {
  visibility: "public",
  now: T3
});
assert.equal(validateOutputRoutingSnapshot(outputRoutingSnapshot).valid, true);
assert.equal(JSON.stringify(outputRoutingSnapshot).includes("tenantId"), false);
assert.equal(JSON.stringify(outputRoutingSnapshot).includes("officialProgram"), false);
destroyOutputRoutingEngine(outputRoutingEngine, { now: T3 });

model = clearProductionConsoleOfficialProgram(model, officialProgramEngine, { now: T3 });
assert.equal(model.officialProgramState, "ready");
assert.equal(model.officialProgram, null);
assert.equal(model.officialPreviewState, "rendered");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 1);
destroyProgramEngine(officialProgramEngine, { now: T3 });

model = clearProductionConsoleOfficialPreview(model, officialPreviewEngine, officialPreparationStore, { now: T4 });
assert.equal(model.officialPreviewState, "ready");
assert.equal(countByClass(templateRendererTarget, "cp-template-render-root"), 0);
destroyPreviewEngine(officialPreviewEngine, { now: T4 });
destroyThemeTemplateIntegration(themeTemplateIntegration, { now: T4 });
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
  "console-theme-lab",
  "console-theme-select",
  "console-theme-status",
  "console-theme-palette",
  "console-theme-typography",
  "console-theme-logos",
  "console-theme-backgrounds",
  "console-theme-watermark",
  "console-theme-borders",
  "console-theme-components",
  "console-template-lab",
  "console-template-fixture",
  "console-template-status",
  "console-template-renderer-lab",
  "console-template-renderer-template",
  "console-template-renderer-theme",
  "console-template-renderer-context",
  "console-template-renderer-output",
  "console-template-renderer-visibility",
  "console-template-renderer-frame",
  "console-template-renderer-safe-area",
  "console-template-renderer-target",
  "console-template-renderer-metrics",
  "console-official-program-lab",
  "console-official-program-status",
  "console-official-program-frame",
  "console-official-program-target",
  "console-official-program-metrics",
  "console-official-program-warnings",
  "console-official-program-errors",
  "console-output-routing",
  "console-output-routing-status",
  "console-output-routing-routes",
  "console-output-synchronization",
  "console-output-synchronization-status",
  "console-output-synchronization-targets",
  "console-output-synchronization-program-host",
  "console-output-synchronization-announcer-host",
  "console-component-renderer-lab",
  "console-component-renderer-target",
  "console-component-renderer-fixture",
  "console-component-renderer-output",
  "console-inspector"
]) assert.ok(html.includes(`id="${id}"`), `HTML missing ${id}`);
for (const action of ["prepare", "render", "update", "clear", "snapshot"]) {
  assert.ok(html.includes(`data-official-preview-action="${action}"`), `Official Preview missing ${action}`);
}
const officialPreviewMarkup = html.slice(html.indexOf("<h3>Official Preview</h3>"), html.indexOf("console-official-program-lab"));
assert.doesNotMatch(officialPreviewMarkup, /\bTake\b|\bCut\b|\bAuto\b|\bProgram\b/);
for (const action of ["prepare", "take", "cut", "auto", "update", "clear", "snapshot"]) {
  assert.ok(html.includes(`data-official-program-action="${action}"`), `Official Program missing ${action}`);
}
const officialProgramMarkup = html.slice(html.indexOf("<h3>Official Program</h3>"), html.indexOf("console-component-renderer-lab"));
assert.doesNotMatch(officialProgramMarkup, /\bOBS\b|\bvMix\b|Browser Output|Firebase/);
const outputRoutingMarkup = html.slice(html.indexOf("<h2>OUTPUT ROUTING</h2>"), html.indexOf("console-geometry-panel"));
assert.match(outputRoutingMarkup, /Copiar Snapshot/);
assert.match(outputRoutingMarkup, /href="\.\/program-main-output\.html"/);
assert.match(outputRoutingMarkup, /Abrir Program Main Output/);
assert.match(outputRoutingMarkup, /href="\.\/announcer-monitor\.html"/);
assert.equal((outputRoutingMarkup.match(/Abrir Announcer Monitor/g) || []).length, 1);
assert.match(outputRoutingMarkup, /href="\.\/browser-output\.html\?type=generic"/);
assert.match(outputRoutingMarkup, /Abrir laboratorio Browser Output/);
assert.doesNotMatch(outputRoutingMarkup, /Abrir Browser Source|\bOBS\b|\bvMix\b|URL pública|NDI conectado|tiempo real|Start Timer|Pause Timer|Reset Timer|\bTake\b|\bCut\b|\bAuto\b/);
const synchronizationMarkup = html.slice(html.indexOf("<h2>SINCRONIZACIÓN DE SALIDAS</h2>"), html.indexOf("console-geometry-panel"));
for (const action of ["sync-all", "sync-program", "clear-program", "sync-announcer", "clear-announcer"]) {
  const presentInHtml = synchronizationMarkup.includes(`data-output-synchronization-action="${action}"`);
  const generatedInSource = source.includes(`["${action}"`) || source.includes(`action === "${action}"`);
  assert.equal(presentInHtml || generatedInSource, true, `Missing synchronization action ${action}`);
}
assert.match(synchronizationMarkup, /Sincronización local explícita/);
assert.doesNotMatch(synchronizationMarkup, /Start Timer|Pause Timer|Reset Timer|NDI Connect|OBS Connect|Firebase Connect|tiempo real/i);
assert.ok(source.includes("synchronizeProgramMain"));
assert.ok(source.includes("synchronizeAnnouncerMonitor"));
assert.ok(source.includes("synchronizeAllOutputs"));
assert.ok(source.includes("FIXTURE DE LABORATORIO"));
assert.ok(source.includes("DATOS REALES DE LA SESIÓN"));
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
assert.ok(source.includes('themes: "Themes"'));
assert.ok(source.includes("createProductionConsoleTheme"));
assert.ok(source.includes("duplicateProductionConsoleTheme"));
assert.ok(source.includes("activateProductionConsoleTheme"));
assert.ok(source.includes("deactivateProductionConsoleTheme"));
assert.ok(source.includes("getProductionConsoleThemeClipboardSnapshot"));
assert.ok(source.includes('copy.dataset.copyJson = "theme-snapshot"'));
assert.ok(html.includes("Theme Engine V1"));
assert.ok(source.includes("createProductionConsoleTemplate"));
assert.ok(source.includes("instantiateProductionConsoleTemplate"));
assert.ok(source.includes("getProductionConsoleTemplateClipboardSnapshot"));
assert.ok(source.includes('copy.dataset.copyJson = "template-snapshot"'));
assert.ok(html.includes("Template Engine V1"));
assert.ok(html.includes("Official Preview"));
assert.ok(html.includes("Official Program"));
assert.ok(html.includes("OUTPUT ROUTING"));
assert.ok(source.includes("PRODUCTION_CONSOLE_OUTPUT_ROUTES"));
assert.ok(source.includes('routeId: "route-program-main"'));
assert.ok(source.includes('routeId: "route-announcer-monitor"'));
assert.ok(source.includes('routeId: "route-timer-display"'));
for (const action of ["configure", "resolve", "update", "enable", "disable", "clear"]) {
  assert.ok(source.includes(`[\"${action}\",`), `Output Routing missing ${action}`);
}
for (const forbiddenOutput of ["public-results", "judge-output", "generic-led", "social-output", "multiview"]) {
  assert.equal(source.includes(forbiddenOutput), false);
}
assert.ok(source.includes("createProductionConsoleOfficialProgramEngine"));
assert.ok(source.includes("prepareProductionConsoleOfficialProgram"));
assert.ok(source.includes("takeProductionConsoleOfficialProgram"));
assert.ok(source.includes("cutProductionConsoleOfficialProgram"));
assert.ok(source.includes("autoProductionConsoleOfficialProgram"));
assert.ok(source.includes("updateProductionConsoleOfficialProgram"));
assert.ok(source.includes("clearProductionConsoleOfficialProgram"));
assert.ok(source.includes("TEMPLATE_RENDERER_INTEGRATION_VERSION"));
assert.ok(source.includes("prepareProductionConsoleTemplateRenderer"));
assert.ok(source.includes("renderProductionConsoleTemplateRenderer"));
assert.ok(source.includes("updateProductionConsoleTemplateRenderer"));
assert.ok(source.includes("clearProductionConsoleTemplateRenderer"));
assert.ok(source.includes("getProductionConsoleTemplateRenderClipboardSnapshot"));
assert.ok(source.includes("THEME_TEMPLATE_INTEGRATION_VERSION"));
assert.ok(source.includes("createProductionConsoleThemeTemplateIntegration"));
assert.ok(source.includes("resolveProductionConsoleThemeTemplate"));
assert.ok(source.includes("prepareProductionConsoleThemeTemplate"));
assert.ok(source.includes("renderProductionConsoleThemeTemplate"));
assert.ok(source.includes("updateProductionConsoleThemeTemplate"));
assert.ok(source.includes("clearProductionConsoleThemeTemplate"));
assert.ok(source.includes("getProductionConsoleThemeTemplateClipboardSnapshot"));
assert.equal((html.match(/data-official-preview-action=/g) || []).length, 5);
assert.equal((html.match(/data-official-program-action=/g) || []).length, 7);
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
