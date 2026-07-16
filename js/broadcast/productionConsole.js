import {
  BROADCAST_DATA_CONTRACT_VERSION,
  buildBroadcastDataContract,
  getBroadcastField,
  validateBroadcastDataContract
} from "./dataContract.js?v=20260713-broadcast-output-001-output-v1";
import {
  BROADCAST_STATE_VERSION,
  cloneBroadcastState,
  createInitialBroadcastState,
  getBroadcastQueue,
  getBroadcastStateWarnings,
  validateBroadcastState
} from "./broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import {
  BROADCAST_OUTPUT_VERSION,
  buildBroadcastOutputProjection,
  getBroadcastOutput,
  getBroadcastOutputWarnings,
  listBroadcastOutputs,
  registerBroadcastOutput,
  removeBroadcastOutput,
  validateBroadcastOutput
} from "./broadcastOutput.js?v=20260713-broadcast-output-001-output-v1";
import {
  ASSET_MANAGER_VERSION,
  listBroadcastAssets,
  registerBroadcastAsset,
  resolveBroadcastAsset,
  validateBroadcastAsset
} from "./assetManager.js?v=20260713-asset-manager-001-assets-v1";
import {
  PLAYGROUND_ASSET_DEFINITIONS,
  PLAYGROUND_GRAPHIC_DEFINITIONS,
  PLAYGROUND_LAYER_IDS,
  PLAYGROUND_OUTPUT_DEFINITIONS,
  buildPlaygroundFixture
} from "./fixtures/broadcastPlaygroundFixtures.js?v=20260713-broadcast-playground-001-visual-test1";
import {
  ACTION_CONFIRMATION_TYPES,
  ACTION_TYPES,
  BROADCAST_ACTION_ENGINE_VERSION,
  confirmBroadcastAction,
  createBroadcastAction,
  createBroadcastActionContext,
  dispatchBroadcastAction,
  requiresBroadcastActionConfirmation
} from "./actionEngine.js?v=20260713-production-variables-001-variables-v1";
import {
  PRODUCTION_VARIABLES_VERSION,
  PRODUCTION_VARIABLE_DEFINITIONS,
  buildProductionVariablesSnapshot,
  listProductionVariables,
  registerProductionVariable,
  resolveProductionVariables,
  validateProductionVariable
} from "./productionVariables.js?v=20260713-production-variables-001-variables-v1";
import {
  COMPONENT_LIBRARY_VERSION,
  buildComponentSnapshot,
  findBroadcastComponent,
  listBroadcastComponents,
  registerBroadcastComponent,
  removeBroadcastComponent,
  validateBroadcastComponent
} from "./componentLibrary.js?v=20260713-component-library-001-components-v1";
import {
  COMPONENT_RENDERER_VERSION,
  buildComponentRenderSnapshot,
  clearBroadcastComponentRenderer,
  cloneComponentRenderResult,
  createComponentRenderer,
  destroyComponentRenderer,
  renderBroadcastComponent,
  updateBroadcastComponentRender
} from "./componentRenderer.js?v=20260714-component-renderer-001-renderer-v1";
import {
  COMPONENT_RENDERER_FIXTURE_TYPES,
  COMPONENT_RENDERER_OUTPUTS,
  buildComponentRendererFixture,
  getComponentRendererOutput
} from "./fixtures/componentRendererFixtures.js?v=20260714-component-renderer-001-renderer-v1";
import {
  TEMPLATE_ENGINE_VERSION,
  buildTemplateSnapshot,
  clearTemplateRegistry,
  cloneTemplateResult,
  duplicateBroadcastTemplate,
  getRegisteredTemplate,
  instantiateBroadcastTemplate,
  listRegisteredTemplates,
  registerBroadcastTemplate,
  removeBroadcastTemplate,
  validateBroadcastTemplate
} from "./templateEngine.js?v=20260714-template-engine-001-template-v1";
import {
  TEMPLATE_ENGINE_FIXTURES,
  TEMPLATE_ENGINE_FIXTURE_TYPES,
  buildTemplateEngineFixture
} from "../../fixtures/templateEngineFixtures.js?v=20260714-template-engine-001-template-v1";
import {
  TEMPLATE_RENDERER_INTEGRATION_VERSION,
  buildTemplateRenderSnapshot,
  clearTemplateRendererIntegration,
  cloneTemplateRenderResult,
  createTemplateRendererIntegration,
  destroyTemplateRendererIntegration,
  prepareTemplateRender,
  renderTemplateInstance,
  updateTemplateRender,
  validateTemplateRenderSnapshot
} from "./templateRendererIntegration.js?v=20260714-template-renderer-integration-001-composed-preview-v1";
import {
  THEME_ENGINE_VERSION,
  activateBroadcastTheme,
  buildBroadcastThemeSnapshot,
  createBroadcastTheme,
  deactivateBroadcastTheme,
  deleteBroadcastTheme,
  duplicateBroadcastTheme,
  getBroadcastTheme,
  listBroadcastThemes,
  publishBroadcastTheme,
  resolveBroadcastTheme,
  validateBroadcastTheme
} from "./themeEngine.js?v=20260714-theme-engine-001-theme-system-v1";
import {
  THEME_TEMPLATE_INTEGRATION_VERSION,
  buildThemeTemplateSnapshot,
  buildThemedTemplatePreparation,
  clearThemeTemplateIntegration,
  createThemeTemplateIntegration,
  destroyThemeTemplateIntegration,
  renderThemedTemplate,
  resolveThemeForTemplate,
  updateThemedTemplateRender,
  validateThemeTemplateSnapshot
} from "./themeTemplateIntegration.js?v=20260714-theme-template-integration-001-themed-compositions-v1";
import {
  PREVIEW_ENGINE_VERSION,
  clearPreview as clearOfficialPreview,
  createPreviewEngine,
  destroyPreviewEngine,
  getPreviewSnapshot,
  getPreviewState,
  preparePreview as prepareOfficialPreview,
  renderPreview as renderOfficialPreview,
  updatePreview as updateOfficialPreview
} from "./previewEngine.js?v=20260715-preview-engine-001-official-preview-v1";
import {
  PROGRAM_ENGINE_VERSION,
  autoProgram as autoOfficialProgram,
  clearProgram as clearOfficialProgram,
  createProgramEngine,
  cutProgram as cutOfficialProgram,
  destroyProgramEngine,
  getProgramSnapshot,
  getProgramState,
  isProgramDestroyed,
  prepareProgram as prepareOfficialProgram,
  takeProgram as takeOfficialProgram,
  updateProgram as updateOfficialProgram,
  validateProgram
} from "./programEngine.js?v=20260715-program-engine-001-official-program-v1";
import {
  OUTPUT_ROUTING_VERSION,
  buildOutputRoutingSnapshot,
  clearOutputRoute,
  createOutputRoute,
  createOutputRoutingEngine,
  destroyOutputRoutingEngine,
  disableOutputRoute,
  enableOutputRoute,
  getOutputRoute,
  getOutputRoutingErrors,
  getOutputRoutingStatus,
  getOutputRoutingWarnings,
  listOutputRoutes,
  routeAnnouncerMonitor,
  routeProgramToOutput,
  routeTimerDisplay,
  updateOutputRoute,
  validateOutputRoutingSnapshot
} from "./outputRouting.js?v=20260715-browser-output-001-common-web-output-infrastructure-v1";
import {
  buildProgramMainOutputSnapshot,
  configureProgramMainOutput,
  createProgramMainOutput,
  destroyProgramMainOutput,
  mountProgramMainOutput
} from "./programMainOutput.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import {
  configureAnnouncerMonitor,
  createAnnouncerMonitor,
  destroyAnnouncerMonitor,
  getAnnouncerSnapshot,
  mountAnnouncerMonitor
} from "./announcerMonitor.js?v=20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1";
import {
  OUTPUT_SYNCHRONIZATION_VERSION,
  buildOutputSynchronizationSnapshot,
  clearSynchronizedOutput,
  configureOutputSynchronization,
  createOutputSynchronization,
  destroyOutputSynchronization,
  getOutputSynchronizationErrors,
  getOutputSynchronizationStatus,
  getOutputSynchronizationWarnings,
  startOutputSynchronization,
  synchronizeAllOutputs,
  synchronizeAnnouncerMonitor,
  synchronizeProgramMain,
  validateOutputSynchronizationSnapshot
} from "./outputSynchronization.js?v=20260715-broadcast-access-and-sync-001-local-output-sync-v1";
import { CHARROPRO_APP_VERSION } from "../core/version.js?v=20260715-broadcast-access-and-sync-001-local-output-sync-v1";

export const PRODUCTION_CONSOLE_VERSION = "1.0.0";
export const PRODUCTION_CONSOLE_APP_VERSION = "20260715-broadcast-access-and-sync-001-local-output-sync-v1";

export const PRODUCTION_CONSOLE_OUTPUT_ROUTES = Object.freeze([
  Object.freeze({ routeId: "route-program-main", routeType: "program_main", outputId: "program-main", sourceType: "program_snapshot", visibility: "public", name: "Program Main" }),
  Object.freeze({ routeId: "route-announcer-monitor", routeType: "announcer_monitor", outputId: "announcer-monitor", sourceType: "announcer_projection", visibility: "operational", name: "Announcer Monitor" }),
  Object.freeze({ routeId: "route-timer-display", routeType: "timer_display", outputId: "timer-display", sourceType: "timer_projection", visibility: "public", name: "Timer Display" })
]);

export const PRODUCTION_CONSOLE_FIXTURES = Object.freeze([
  Object.freeze({ id: "equipos_3", label: "Competencia por equipos - 3 equipos", competitionType: "equipos_completo", countOption: "three" }),
  Object.freeze({ id: "equipos_4", label: "Competencia por equipos - 4 equipos", competitionType: "equipos_completo", countOption: "four" }),
  Object.freeze({ id: "charro_completo", label: "Charro Completo", competitionType: "charro_completo", countOption: "two" }),
  Object.freeze({ id: "caladero", label: "Caladero", competitionType: "caladero", countOption: "two" }),
  Object.freeze({ id: "coleadero", label: "Coleadero", competitionType: "coleadero", countOption: "two" }),
  Object.freeze({ id: "pialadero", label: "Pialadero", competitionType: "pialadero", countOption: "two" })
]);

export const PRODUCTION_CONSOLE_THEME_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "theme_default", name: "Default", description: "Base visual neutral de Broadcast Studio.", status: "active", visibility: "public", metadata: Object.freeze({ brandingStatus: "neutral" }) }),
  Object.freeze({
    id: "theme_orgullo_charro",
    name: "Orgullo Charro",
    description: "Identidad confirmada en negro, azul rey, plata y rojo tinto.",
    status: "inactive",
    visibility: "public",
    baseThemeId: "theme_default",
    metadata: Object.freeze({ brandingStatus: "confirmed" }),
    colors: Object.freeze({
      primary: "#090A0C", secondary: "#174EA6", accent: "#C0C5CC", success: "#174EA6",
      warning: "#7A1538", danger: "#7A1538", neutral: "#C0C5CC", background: "#090A0C",
      surface: "#15171B", textPrimary: "#C0C5CC", textSecondary: "#9EA4AC", border: "#C0C5CC",
      highlight: "#7A1538", overlay: "#090A0CCC", transparent: "transparent"
    }),
    borders: Object.freeze({
      subtle: Object.freeze({ width: 1, radius: 4, style: "solid", color: "#C0C5CC" }),
      emphasis: Object.freeze({ width: 2, radius: 4, style: "solid", color: "#174EA6" })
    }),
    shadows: Object.freeze({
      panel: Object.freeze({ x: 0, y: 8, blur: 24, opacity: 0.35, color: "#090A0C" }),
      text: Object.freeze({ x: 0, y: 2, blur: 4, opacity: 0.5, color: "#090A0C" })
    }),
    backgrounds: Object.freeze({
      program: Object.freeze({ type: "solid", color: "#090A0C" }),
      panel: Object.freeze({ type: "solid", color: "#15171B" }),
      emphasis: Object.freeze({ type: "gradient", gradientType: "linear", angle: 90, stops: Object.freeze([Object.freeze({ color: "#090A0C", position: 0 }), Object.freeze({ color: "#174EA6", position: 1 })]) }),
      transparent: Object.freeze({ type: "transparent" })
    })
  }),
  Object.freeze({ id: "theme_liga_mexicana", name: "Liga Mexicana - Provisional", description: "Tema técnico heredado de Default; identidad pendiente de aprobación de marca.", status: "inactive", visibility: "public", baseThemeId: "theme_default", metadata: Object.freeze({ brandingStatus: "provisional" }) }),
  Object.freeze({ id: "theme_rodeo", name: "Rodeo", description: "Paleta técnica provisional para producción.", status: "inactive", visibility: "production", baseThemeId: "theme_default", metadata: Object.freeze({ brandingStatus: "provisional" }), colors: Object.freeze({ primary: "#241A16", secondary: "#6E4934", accent: "#D69A4A", highlight: "#F3D6A0", surface: "#33251F" }) }),
  Object.freeze({ id: "theme_empresarial", name: "Empresarial", description: "Presentación técnica provisional para clientes y patrocinadores.", status: "inactive", visibility: "production", baseThemeId: "theme_default", metadata: Object.freeze({ brandingStatus: "provisional" }), colors: Object.freeze({ primary: "#14283D", secondary: "#315A78", accent: "#49A6C8", highlight: "#DCEEF6", surface: "#193147" }) }),
  Object.freeze({ id: "theme_dark", name: "Dark", description: "Tema técnico oscuro de alto contraste.", status: "inactive", visibility: "public", baseThemeId: "theme_default", metadata: Object.freeze({ brandingStatus: "neutral" }), colors: Object.freeze({ primary: "#07080A", secondary: "#191C22", accent: "#8EB8FF", highlight: "#FFFFFF", background: "#050609", surface: "#111319" }) }),
  Object.freeze({ id: "theme_light", name: "Light", description: "Tema técnico claro para monitores y fondos luminosos.", status: "inactive", visibility: "public", baseThemeId: "theme_default", metadata: Object.freeze({ brandingStatus: "neutral" }), colors: Object.freeze({ primary: "#F4F6F8", secondary: "#DCE2E8", accent: "#9B7424", highlight: "#6D4F15", background: "#FFFFFF", surface: "#F1F3F5", textPrimary: "#111318", textSecondary: "#505661", border: "#C9CFD6", overlay: "#FFFFFFCC" }) })
]);

export const PRODUCTION_CONSOLE_GRAPHICS = Object.freeze(Object.fromEntries(
  Object.entries(PLAYGROUND_GRAPHIC_DEFINITIONS).map(([id, definition]) => [id, Object.freeze({
    graphicId: definition.graphicId,
    type: definition.type,
    label: definition.label,
    layerId: definition.layerId,
    requiredData: Object.freeze([...(definition.requiredData || [])]),
    defaultPosition: Object.freeze({ ...(definition.position || {}) }),
    defaultSize: Object.freeze({ ...(definition.size || {}) }),
    defaultScale: definition.scale,
    defaultOpacity: definition.opacity,
    dataBindings: Object.freeze({ ...(definition.dataBindings || {}) }),
    fallback: definition.fallback
  })])
));

const CONSOLE_ACTOR = Object.freeze({
  id: "production_console_operator",
  name: "Operador de consola",
  role: "operador",
  sessionId: "session_production_console",
  deviceId: null,
  source: "production-console",
  visibility: "operational"
});
const CONSOLE_SETUP_ACTOR = Object.freeze({
  id: "production_console_setup",
  name: "Configuración de consola",
  role: "supervisor",
  source: "production-console"
});
const PRODUCTION_CONSOLE_INSTANCES = new WeakMap();
const DEFAULT_FIXTURE_ID = "equipos_3";
const DEFAULT_GRAPHIC_ID = "scoreboard-test";
const DEFAULT_ASSET_ID = "asset-tournament-logo";
const DEFAULT_OUTPUT_ID = "console_program";
const PREVIEW_OUTPUT_ID = "console_preview";
const DEFAULT_VISIBILITY = "production";
const SESSION_SETTINGS_KEY = "charropro_production_console_preferences_v1";
const VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const INSPECTOR_MAX_DEPTH = 14;
const INSPECTOR_MAX_ARRAY_ITEMS = 500;
const INSPECTOR_DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const INSPECTOR_SECRET_FIELDS = new Set([
  "authorization", "cookie", "credentials", "password", "passwordhash", "privatekey",
  "secret", "secrets", "signedurl", "token", "tokens", "accesstoken", "refreshtoken", "apikey"
]);
const INSPECTOR_ACTOR_FIELDS = new Set([
  "actor", "actorid", "actorname", "createdby", "deviceid", "judgeid", "judgename",
  "operatorid", "operatorname", "pausedby", "preparedby", "queuedby", "selectedby", "takenby", "updatedby", "userid"
]);
const INSPECTOR_RESTRICTED_CONTEXT_FIELDS = new Set(["clientid", "organizationid", "tenantid"]);
const INSPECTOR_OPERATIONAL_FIELDS = new Set([
  "diagnostics", "firebaseconnected", "internaldiagnostics", "session", "sessionid", "sourceversion"
]);
const INSPECTOR_PUBLIC_ONLY_FIELDS = new Set([
  "errors", "lasterror", "latency", "metadata", "scoreDetail", "scoredetail", "warnings"
]);
const ANCHORS = Object.freeze(["center", "top-left", "top-right", "bottom-left", "bottom-right"]);
const POSITION_UNITS = Object.freeze(["normalized", "%", "px", "vw", "vh"]);
const ANIMATIONS = Object.freeze([
  "none", "fade-in", "fade-out", "slide-up", "slide-down", "slide-left", "slide-right", "scale-in", "scale-out"
]);

const CONSOLE_OUTPUT_DEFINITIONS = Object.freeze(PLAYGROUND_OUTPUT_DEFINITIONS.map((definition) => Object.freeze({
  ...definition,
  id: definition.id.replace("playground_", "console_")
})));

export function createProductionConsoleModel(options = {}) {
  const now = normalizeNow(options.now);
  cleanupConsoleOutputs();
  const outputs = registerConsoleOutputs(now);
  const assetRegistry = registerConsoleAssets(now);
  const fixtureDefinition = getFixtureDefinition(options.fixtureId);
  const fixtureSource = stampFixtureSource(
    buildPlaygroundFixture(fixtureDefinition.competitionType, fixtureDefinition.countOption),
    now
  );
  const visibility = normalizeVisibility(options.visibility);
  const contract = buildBroadcastDataContract(fixtureSource, {
    visibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  const outputMap = Object.fromEntries(outputs.map((output) => [output.id, output]));
  const state = createInitialBroadcastState({
    now,
    source: "production-console",
    session: {
      id: "session_production_console",
      tournamentId: contract.tournament.id,
      competitionId: contract.competition.id,
      outputIds: outputs.map((output) => output.id),
      status: "active",
      recoverable: false
    },
    contextRef: contextRefFromContract(contract),
    outputs: outputMap,
    legacy: {
      enabled: true,
      activeEngine: "v1",
      v1OutputIds: [],
      v2OutputIds: outputs.map((output) => output.id),
      fallbackAvailable: false
    }
  });
  const graphic = getGraphicDefinition(options.graphicId);
  const outputIds = outputs.map((output) => output.id);
  const variableRegistry = registerConsoleVariables(
    contract,
    outputIds,
    now,
    fixtureSource.organization?.tenantId
  );
  const componentRegistry = emptyComponentRegistry(now);
  const templateRegistry = clearTemplateRegistry({}, { resetRevision: true, now });
  const themeRegistry = registerConsoleThemes(now);
  return {
    consoleVersion: PRODUCTION_CONSOLE_VERSION,
    appVersion: CHARROPRO_APP_VERSION || PRODUCTION_CONSOLE_APP_VERSION,
    state,
    fixtureSource,
    contract,
    programSnapshot: null,
    lastPreviewConfig: null,
    assetRegistry,
    variableRegistry,
    componentRegistry,
    templateRegistry,
    themeRegistry,
    fixtureId: fixtureDefinition.id,
    selectedGraphicId: graphic.graphicId,
    selectedAssetId: assetExists(assetRegistry, options.assetId) ? options.assetId : DEFAULT_ASSET_ID,
    selectedOutputId: outputIds.includes(options.outputId) ? options.outputId : DEFAULT_OUTPUT_ID,
    visibility,
    safeMode: options.safeMode !== false,
    geometry: geometryFromGraphic(graphic),
    animation: normalizeAnimation(options.animation),
    previewVisible: true,
    graphicSequence: 0,
    queueSequence: 0,
    actionSequence: 0,
    componentSequence: 0,
    componentRendererFixtureType: COMPONENT_RENDERER_FIXTURE_TYPES[0],
    componentRendererOutputId: COMPONENT_RENDERER_OUTPUTS[0].id,
    componentRendererState: "uninitialized",
    componentRendererResult: null,
    componentRendererSnapshot: null,
    componentRendererWarnings: [],
    componentRendererErrors: [],
    componentRendererSequence: 0,
    templateFixtureType: TEMPLATE_ENGINE_FIXTURE_TYPES[0],
    templateSequence: 0,
    selectedTemplateId: null,
    templateInstanceResult: null,
    templateSnapshot: null,
    templateWarnings: [],
    templateErrors: [],
    templateRendererContextId: fixtureDefinition.id,
    templateRendererOutputId: COMPONENT_RENDERER_OUTPUTS[0].id,
    templateRendererVisibility: visibility,
    templateRendererState: "uninitialized",
    templateRendererPreparation: null,
    templateRendererResult: null,
    templateRendererSnapshot: null,
    templateRendererWarnings: [],
    templateRendererErrors: [],
    themeTemplateThemeId: themeRegistry.activeThemeId || "theme_default",
    themeTemplateState: "uninitialized",
    themeTemplateResolution: null,
    themeTemplatePreparation: null,
    themeTemplateResult: null,
    themeTemplateSnapshot: null,
    themeTemplateWarnings: [],
    themeTemplateErrors: [],
    officialPreviewState: "uninitialized",
    officialPreview: null,
    officialPreviewSnapshot: null,
    officialPreviewWarnings: [],
    officialPreviewErrors: [],
    officialProgramState: "uninitialized",
    officialProgram: null,
    officialProgramSnapshot: null,
    officialProgramWarnings: [],
    officialProgramErrors: [],
    outputRoutingVersion: OUTPUT_ROUTING_VERSION,
    outputRoutingState: "uninitialized",
    outputRoutingRoutes: [],
    outputRoutingResults: {},
    outputRoutingSnapshot: null,
    outputRoutingWarnings: [],
    outputRoutingErrors: [],
    outputSynchronizationVersion: OUTPUT_SYNCHRONIZATION_VERSION,
    outputSynchronizationState: "uninitialized",
    outputSynchronizationSnapshot: null,
    outputSynchronizationWarnings: [],
    outputSynchronizationErrors: [],
    themeSequence: PRODUCTION_CONSOLE_THEME_DEFINITIONS.length,
    selectedThemeId: themeRegistry.activeThemeId || "theme_default",
    themeSnapshot: null,
    themeWarnings: [],
    themeErrors: [],
    actionHistory: [],
    currentGraphicInstanceId: null,
    selectedComponentId: null,
    inspectorTab: normalizeInspectorTab(options.inspectorTab),
    panelSize: normalizePanelSize(options.panelSize),
    lastAction: "initialized",
    lastActionError: null,
    outputIds
  };
}

export function createProductionConsoleTestComponent(model, options = {}) {
  assertModel(model);
  const sequence = model.componentSequence + 1;
  const componentId = `component_console_${sequence}`;
  const registry = registerBroadcastComponent(model.componentRegistry, {
    componentId,
    name: `Texto de prueba ${sequence}`,
    componentType: "text",
    componentVersion: "1.0.0",
    componentRevision: 0,
    visibility: "production",
    status: "draft",
    bindings: [{
      bindingId: `binding_console_${sequence}`,
      target: "properties.text",
      source: "production_variables",
      key: "production.message",
      fallback: "Texto de prueba",
      visibility: "production"
    }],
    style: {
      fontFamily: "Inter", fontSize: 36, fontWeight: 700, color: "#ffffff",
      backgroundColor: "#000000", borderColor: "#d6ad43", borderWidth: 1,
      borderRadius: 4, opacity: 1, padding: 12, margin: 0
    },
    layout: { x: 0.5, y: 0.8, width: 0.7, height: 0.16, anchor: "center", scale: 1, zIndex: 10 },
    animation: { type: "none", duration: 0, delay: 0, easing: "linear", repeat: 0, direction: "normal", trigger: "manual" },
    properties: { text: "Texto de prueba", multiline: true, ellipsis: true, maxLines: 2, textTransform: "none" },
    metadata: { fixture: true, source: "production-console" }
  }, {
    actor: CONSOLE_SETUP_ACTOR,
    expectedRevision: model.componentRegistry.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    componentRegistry: registry,
    componentSequence: sequence,
    selectedComponentId: componentId,
    inspectorTab: "components",
    lastAction: "component-created",
    lastActionError: null
  };
}

export function duplicateProductionConsoleComponent(model, componentId = model?.selectedComponentId, options = {}) {
  assertModel(model);
  const source = findBroadcastComponent(model.componentRegistry, componentId);
  if (!source) throw consoleError("console-component-not-found");
  const sequence = model.componentSequence + 1;
  const duplicateId = `component_console_${sequence}`;
  const registry = registerBroadcastComponent(model.componentRegistry, {
    ...source,
    componentId: duplicateId,
    name: `${source.name} copia`,
    componentRevision: 0,
    status: "draft",
    createdAt: undefined,
    updatedAt: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    warnings: [],
    errors: []
  }, {
    actor: CONSOLE_SETUP_ACTOR,
    expectedRevision: model.componentRegistry.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    componentRegistry: registry,
    componentSequence: sequence,
    selectedComponentId: duplicateId,
    inspectorTab: "components",
    lastAction: "component-duplicated",
    lastActionError: null
  };
}

export function removeProductionConsoleComponent(model, componentId = model?.selectedComponentId, options = {}) {
  assertModel(model);
  const current = findBroadcastComponent(model.componentRegistry, componentId);
  if (!current) throw consoleError("console-component-not-found");
  const registry = removeBroadcastComponent(model.componentRegistry, componentId, {
    expectedRevision: current.componentRevision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    componentRegistry: registry,
    selectedComponentId: listBroadcastComponents(registry)[0]?.componentId || null,
    inspectorTab: "components",
    lastAction: "component-removed",
    lastActionError: null
  };
}

export function selectProductionConsoleComponent(model, componentId) {
  assertModel(model);
  if (!findBroadcastComponent(model.componentRegistry, componentId)) throw consoleError("console-component-not-found");
  return { ...model, selectedComponentId: componentId, inspectorTab: "components", lastAction: "component-selected", lastActionError: null };
}

export function selectProductionComponentRendererFixture(model, componentType) {
  assertModel(model);
  const selected = COMPONENT_RENDERER_FIXTURE_TYPES.includes(componentType) ? componentType : COMPONENT_RENDERER_FIXTURE_TYPES[0];
  return {
    ...model,
    componentRendererFixtureType: selected,
    inspectorTab: "components",
    lastAction: "component-renderer-fixture-selected",
    lastActionError: null
  };
}

export function selectProductionComponentRendererOutput(model, outputId) {
  assertModel(model);
  const output = getComponentRendererOutput(outputId);
  return {
    ...model,
    componentRendererOutputId: output.id,
    componentRendererState: "uninitialized",
    componentRendererResult: null,
    componentRendererSnapshot: null,
    componentRendererWarnings: [],
    componentRendererErrors: [],
    inspectorTab: "components",
    lastAction: "component-renderer-output-selected",
    lastActionError: null
  };
}

export function createProductionConsoleComponentRenderer(model, target, options = {}) {
  assertModel(model);
  const output = getComponentRendererOutput(options.outputId || model.componentRendererOutputId);
  return createComponentRenderer(target, {
    rendererId: options.rendererId || `production_console_component_renderer_${output.id}`,
    outputId: output.id,
    width: output.width,
    height: output.height,
    orientation: output.orientation,
    safeArea: output.safeArea,
    visibility: model.visibility,
    debug: options.debug === true,
    allowDisconnected: options.allowDisconnected === true,
    now: options.now
  });
}

export function renderProductionConsoleComponentFixture(model, renderer, mode = "render", options = {}) {
  assertModel(model);
  const sequence = model.componentRendererSequence + 1;
  const fixture = buildComponentRendererFixture(model.componentRendererFixtureType, { variant: sequence, now: options.now });
  const renderOptions = {
    resolvedBindings: fixture.resolvedBindings,
    resolvedContent: fixture.resolvedContent,
    resolvedAssets: fixture.resolvedAssets,
    fallback: fixture.fallback,
    now: options.now
  };
  let result;
  if (mode === "update" && model.componentRendererResult?.renderId) {
    result = updateBroadcastComponentRender(renderer, model.componentRendererResult.renderId, fixture.instance, renderOptions);
  } else {
    if (model.componentRendererResult?.renderId) clearBroadcastComponentRenderer(renderer, { now: options.now });
    result = renderBroadcastComponent(renderer, fixture.instance, {
      ...renderOptions,
      renderId: `production_console_${model.componentRendererFixtureType}`
    });
  }
  const snapshot = buildComponentRenderSnapshot(renderer, { visibility: model.visibility, now: options.now });
  return {
    ...model,
    componentRendererState: renderer.state,
    componentRendererResult: cloneComponentRenderResult(result),
    componentRendererSnapshot: snapshot,
    componentRendererWarnings: [...(result.warnings || []), ...(snapshot.warnings || [])],
    componentRendererErrors: [...(result.errors || []), ...(snapshot.errors || [])],
    componentRendererSequence: sequence,
    inspectorTab: "components",
    lastAction: mode === "update" ? "component-renderer-updated" : "component-renderer-rendered",
    lastActionError: null
  };
}

export function clearProductionConsoleComponentRenderer(model, renderer, options = {}) {
  assertModel(model);
  const result = clearBroadcastComponentRenderer(renderer, { now: options.now });
  const snapshot = buildComponentRenderSnapshot(renderer, { visibility: model.visibility, now: options.now });
  return {
    ...model,
    componentRendererState: result.state,
    componentRendererResult: null,
    componentRendererSnapshot: snapshot,
    componentRendererWarnings: snapshot.warnings || [],
    componentRendererErrors: snapshot.errors || [],
    inspectorTab: "components",
    lastAction: "component-renderer-cleared",
    lastActionError: null
  };
}

export function selectProductionConsoleTheme(model, themeId) {
  assertModel(model);
  if (!getBroadcastTheme(model.themeRegistry, themeId)) throw consoleError("console-theme-not-found");
  return {
    ...model,
    selectedThemeId: themeId,
    themeSnapshot: null,
    ...themeDiagnostics(model.themeRegistry, themeId),
    inspectorTab: "themes",
    lastAction: "theme-selected",
    lastActionError: null
  };
}

export function createProductionConsoleTheme(model, options = {}) {
  assertModel(model);
  const sequence = model.themeSequence + 1;
  const id = options.id || `theme_console_${sequence}`;
  const themeRegistry = createBroadcastTheme(model.themeRegistry, {
    id,
    name: options.name || `Tema ${sequence}`,
    description: "Tema declarativo de sesión.",
    status: "draft",
    visibility: normalizeVisibility(options.visibility || model.visibility),
    scope: "global",
    baseThemeId: options.baseThemeId || "theme_default",
    colors: cloneValue(options.colors || {}),
    typography: cloneValue(options.typography || {}),
    metadata: { source: "production-console", temporary: true }
  }, {
    actor: CONSOLE_ACTOR,
    expectedRegistryRevision: model.themeRegistry.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    themeRegistry,
    themeSequence: sequence,
    selectedThemeId: id,
    themeSnapshot: null,
    ...themeDiagnostics(themeRegistry, id),
    inspectorTab: "themes",
    lastAction: "theme-created",
    lastActionError: null
  };
}

export function duplicateProductionConsoleTheme(model, themeId = model?.selectedThemeId, options = {}) {
  assertModel(model);
  const source = getBroadcastTheme(model.themeRegistry, themeId);
  if (!source) throw consoleError("console-theme-not-found");
  const sequence = model.themeSequence + 1;
  const id = options.id || `theme_console_${sequence}`;
  const themeRegistry = duplicateBroadcastTheme(model.themeRegistry, source.id, {
    id,
    name: options.name || `${source.name} copia`
  }, {
    actor: CONSOLE_ACTOR,
    expectedRegistryRevision: model.themeRegistry.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    themeRegistry,
    themeSequence: sequence,
    selectedThemeId: id,
    themeSnapshot: null,
    ...themeDiagnostics(themeRegistry, id),
    inspectorTab: "themes",
    lastAction: "theme-duplicated",
    lastActionError: null
  };
}

export function removeProductionConsoleTheme(model, themeId = model?.selectedThemeId, options = {}) {
  assertModel(model);
  const current = getBroadcastTheme(model.themeRegistry, themeId);
  if (!current) throw consoleError("console-theme-not-found");
  const themeRegistry = deleteBroadcastTheme(model.themeRegistry, current.id, {
    expectedRegistryRevision: model.themeRegistry.revision,
    now: normalizeNow(options.now)
  });
  const selectedThemeId = themeRegistry.activeThemeId || listBroadcastThemes(themeRegistry)[0]?.id || null;
  return {
    ...model,
    themeRegistry,
    selectedThemeId,
    themeSnapshot: null,
    ...themeDiagnostics(themeRegistry, selectedThemeId),
    inspectorTab: "themes",
    lastAction: "theme-removed",
    lastActionError: null
  };
}

export function activateProductionConsoleTheme(model, themeId = model?.selectedThemeId, options = {}) {
  assertModel(model);
  const current = getBroadcastTheme(model.themeRegistry, themeId);
  if (!current) throw consoleError("console-theme-not-found");
  const themeRegistry = activateBroadcastTheme(model.themeRegistry, current.id, {
    actor: CONSOLE_ACTOR,
    expectedRegistryRevision: model.themeRegistry.revision,
    expectedRevision: current.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    themeRegistry,
    selectedThemeId: current.id,
    themeSnapshot: null,
    ...themeDiagnostics(themeRegistry, current.id),
    inspectorTab: "themes",
    lastAction: "theme-activated",
    lastActionError: null
  };
}

export function deactivateProductionConsoleTheme(model, themeId = model?.selectedThemeId, options = {}) {
  assertModel(model);
  const current = getBroadcastTheme(model.themeRegistry, themeId);
  if (!current) throw consoleError("console-theme-not-found");
  const themeRegistry = deactivateBroadcastTheme(model.themeRegistry, current.id, {
    actor: CONSOLE_ACTOR,
    expectedRegistryRevision: model.themeRegistry.revision,
    expectedRevision: current.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    themeRegistry,
    selectedThemeId: current.id,
    themeSnapshot: null,
    ...themeDiagnostics(themeRegistry, current.id),
    inspectorTab: "themes",
    lastAction: "theme-deactivated",
    lastActionError: null
  };
}

export function snapshotProductionConsoleTheme(model, options = {}) {
  assertModel(model);
  const snapshot = getProductionConsoleThemeClipboardSnapshot(model, options);
  return {
    ...model,
    themeSnapshot: snapshot,
    inspectorTab: "themes",
    lastAction: "theme-snapshot-built",
    lastActionError: null
  };
}

export function getProductionConsoleThemeClipboardSnapshot(model, options = {}) {
  assertModel(model);
  return buildBroadcastThemeSnapshot(model.themeRegistry, {
    visibility: normalizeVisibility(options.visibility || model.visibility),
    resolve: options.resolve !== false,
    now: options.now
  });
}

export function selectProductionConsoleTemplateFixture(model, templateType) {
  assertModel(model);
  const selected = TEMPLATE_ENGINE_FIXTURE_TYPES.includes(templateType) ? templateType : TEMPLATE_ENGINE_FIXTURE_TYPES[0];
  return {
    ...model,
    templateFixtureType: selected,
    inspectorTab: "templates",
    lastAction: "template-fixture-selected",
    lastActionError: null
  };
}

export function createProductionConsoleTemplate(model, options = {}) {
  assertModel(model);
  const sequence = model.templateSequence + 1;
  const templateId = `template_console_${sequence}`;
  const fixture = buildProductionConsoleTemplateFixture(model, {
    templateId,
    state: "draft",
    variant: sequence,
    now: normalizeNow(options.now)
  });
  const templateRegistry = registerBroadcastTemplate(model.templateRegistry, fixture.template, {
    expectedRevision: model.templateRegistry.revision,
    actor: CONSOLE_ACTOR,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    templateRegistry,
    templateSequence: sequence,
    selectedTemplateId: templateId,
    templateInstanceResult: null,
    templateSnapshot: null,
    templateWarnings: [],
    templateErrors: [],
    ...emptyTemplateRendererRuntimeState(),
    inspectorTab: "templates",
    lastAction: "template-created",
    lastActionError: null
  };
}

export function duplicateProductionConsoleTemplate(model, templateId = model?.selectedTemplateId, options = {}) {
  assertModel(model);
  const source = getRegisteredTemplate(model.templateRegistry, templateId);
  if (!source) throw consoleError("console-template-not-found");
  const sequence = model.templateSequence + 1;
  const duplicateId = `template_console_${sequence}`;
  const templateRegistry = duplicateBroadcastTemplate(model.templateRegistry, source.templateId, {
    templateId: duplicateId,
    name: `${source.name} copia`,
    state: "draft"
  }, {
    expectedRevision: source.revision,
    expectedRegistryRevision: model.templateRegistry.revision,
    actor: CONSOLE_ACTOR,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    templateRegistry,
    templateSequence: sequence,
    selectedTemplateId: duplicateId,
    templateInstanceResult: null,
    templateSnapshot: null,
    templateWarnings: [],
    templateErrors: [],
    ...emptyTemplateRendererRuntimeState(),
    inspectorTab: "templates",
    lastAction: "template-duplicated",
    lastActionError: null
  };
}

export function removeProductionConsoleTemplate(model, templateId = model?.selectedTemplateId, options = {}) {
  assertModel(model);
  const current = getRegisteredTemplate(model.templateRegistry, templateId);
  if (!current) throw consoleError("console-template-not-found");
  const templateRegistry = removeBroadcastTemplate(model.templateRegistry, current.templateId, {
    expectedRevision: current.revision,
    expectedRegistryRevision: model.templateRegistry.revision,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    templateRegistry,
    selectedTemplateId: listRegisteredTemplates(templateRegistry)[0]?.templateId || null,
    templateInstanceResult: null,
    templateSnapshot: null,
    templateWarnings: [],
    templateErrors: [],
    ...emptyTemplateRendererRuntimeState(),
    inspectorTab: "templates",
    lastAction: "template-removed",
    lastActionError: null
  };
}

export function selectProductionConsoleTemplate(model, templateId) {
  assertModel(model);
  if (!getRegisteredTemplate(model.templateRegistry, templateId)) throw consoleError("console-template-not-found");
  return {
    ...model,
    selectedTemplateId: templateId,
    templateInstanceResult: null,
    templateSnapshot: null,
    templateWarnings: [],
    templateErrors: [],
    ...emptyTemplateRendererRuntimeState(),
    inspectorTab: "templates",
    lastAction: "template-selected",
    lastActionError: null
  };
}

export function instantiateProductionConsoleTemplate(model, templateId = model?.selectedTemplateId, options = {}) {
  assertModel(model);
  const template = getRegisteredTemplate(model.templateRegistry, templateId);
  if (!template) throw consoleError("console-template-not-found");
  const sources = options.sources || buildProductionConsoleTemplateSources(model, options);
  const result = instantiateBroadcastTemplate(template, sources, {
    visibility: normalizeVisibility(options.visibility || model.visibility),
    tenantId: template.tenantId,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    templateInstanceResult: cloneTemplateResult(result),
    templateSnapshot: cloneValue(result.snapshot),
    templateWarnings: uniqueStrings(result.warnings || []),
    templateErrors: uniqueStrings(result.errors || []),
    templateRendererPreparation: null,
    templateRendererResult: null,
    templateRendererSnapshot: null,
    templateRendererWarnings: [],
    templateRendererErrors: [],
    inspectorTab: "templates",
    lastAction: "template-instantiated",
    lastActionError: null
  };
}

export function snapshotProductionConsoleTemplate(model, templateId = model?.selectedTemplateId, options = {}) {
  assertModel(model);
  const snapshot = getProductionConsoleTemplateClipboardSnapshot(model, {
    ...options,
    templateId,
    visibility: options.visibility || model.visibility
  });
  return {
    ...model,
    templateSnapshot: snapshot,
    templateWarnings: uniqueStrings(snapshot.warnings || []),
    templateErrors: uniqueStrings(snapshot.errors || []),
    inspectorTab: "templates",
    lastAction: "template-snapshot-built",
    lastActionError: null
  };
}

export function getProductionConsoleTemplateClipboardSnapshot(model, options = {}) {
  assertModel(model);
  const templateId = options.templateId || model.selectedTemplateId;
  const template = getRegisteredTemplate(model.templateRegistry, templateId);
  if (!template) throw consoleError("console-template-not-found");
  return buildTemplateSnapshot(template, buildProductionConsoleTemplateSources(model, options), {
    visibility: normalizeVisibility(options.visibility || model.visibility),
    tenantId: template.tenantId,
    templateInstanceId: options.templateInstanceId || `template_snapshot_${template.templateId}_${template.revision}`,
    now: normalizeNow(options.now)
  });
}

export function selectProductionConsoleTemplateRendererContext(model, fixtureId) {
  assertModel(model);
  const fixture = getFixtureDefinition(fixtureId);
  return {
    ...model,
    templateRendererContextId: fixture.id,
    templateInstanceResult: null,
    ...emptyTemplateRendererRuntimeState(),
    inspectorTab: "templates",
    lastAction: "template-renderer-context-selected",
    lastActionError: null
  };
}

export function selectProductionConsoleTemplateRendererOutput(model, outputId) {
  assertModel(model);
  const output = getComponentRendererOutput(outputId);
  return {
    ...model,
    templateRendererOutputId: output.id,
    templateInstanceResult: null,
    ...emptyTemplateRendererRuntimeState(),
    inspectorTab: "templates",
    lastAction: "template-renderer-output-selected",
    lastActionError: null
  };
}

export function selectProductionConsoleTemplateRendererVisibility(model, visibility) {
  assertModel(model);
  const selection = {
    ...model,
    templateRendererVisibility: normalizeVisibility(visibility),
    inspectorTab: "templates",
    lastAction: "template-renderer-visibility-selected",
    lastActionError: null
  };
  if (model.themeTemplateResult) return selection;
  return {
    ...selection,
    templateInstanceResult: null,
    ...emptyTemplateRendererRuntimeState()
  };
}

export function createProductionConsoleTemplateRendererIntegration(model, target, options = {}) {
  assertModel(model);
  const output = getComponentRendererOutput(options.outputId || model.templateRendererOutputId);
  const sources = buildProductionConsoleTemplateRendererSources(model, options);
  return createTemplateRendererIntegration(target, {
    integrationId: options.integrationId || `production_console_template_renderer_${output.id}`,
    rendererId: options.rendererId || `production_console_template_component_renderer_${output.id}`,
    outputId: output.id,
    width: output.width,
    height: output.height,
    orientation: output.orientation,
    safeArea: output.safeArea,
    visibility: normalizeVisibility(options.visibility || model.templateRendererVisibility),
    tenantId: sources.broadcastContract?.tenant?.id,
    allowDisconnected: options.allowDisconnected === true,
    now: options.now
  });
}

export function instantiateProductionConsoleTemplateForRenderer(model, options = {}) {
  assertModel(model);
  const sources = buildProductionConsoleTemplateRendererSources(model, options);
  return {
    ...instantiateProductionConsoleTemplate(model, options.templateId || model.selectedTemplateId, {
      ...options,
      sources,
      visibility: model.templateRendererVisibility
    }),
    lastAction: "template-renderer-instantiated"
  };
}

export function prepareProductionConsoleTemplateRenderer(model, options = {}) {
  assertModel(model);
  const template = requireConsoleTemplate(model, options.templateId);
  const sources = buildProductionConsoleTemplateRendererSources(model, options);
  const output = getComponentRendererOutput(options.outputId || model.templateRendererOutputId);
  const templateInstanceId = options.templateInstanceId || `template_lab_instance_${template.templateId}`;
  const instance = instantiateBroadcastTemplate(template, sources, {
    visibility: model.templateRendererVisibility,
    tenantId: sources.broadcastContract?.tenant?.id,
    templateInstanceId,
    now: normalizeNow(options.now)
  });
  const preparation = prepareTemplateRender(instance, sources, {
    templateRenderId: options.templateRenderId || model.templateRendererResult?.templateRenderId || `template_lab_render_${template.templateId}`,
    outputId: output.id,
    outputType: "preview",
    width: output.width,
    height: output.height,
    orientation: output.orientation,
    safeArea: output.safeArea,
    visibility: model.templateRendererVisibility,
    tenantId: sources.broadcastContract?.tenant?.id,
    now: normalizeNow(options.now)
  });
  return {
    ...model,
    templateInstanceResult: cloneTemplateResult(instance),
    templateRendererPreparation: cloneValue(preparation),
    templateRendererState: preparation.status,
    templateRendererWarnings: uniqueStrings(preparation.warnings || []),
    templateRendererErrors: uniqueStrings(preparation.errors || []),
    inspectorTab: "templates",
    lastAction: "template-renderer-prepared",
    lastActionError: preparation.errors?.[0] || null
  };
}

export function renderProductionConsoleTemplateRenderer(model, integration, options = {}) {
  assertModel(model);
  if (!model.templateRendererPreparation) throw consoleError("console-template-renderer-not-prepared");
  const result = renderTemplateInstance(integration, model.templateRendererPreparation, {
    now: options.now
  });
  const snapshot = buildTemplateRenderSnapshot(integration, {
    visibility: model.templateRendererVisibility,
    now: options.now
  });
  return templateRendererModelResult(model, integration, result, snapshot, "template-renderer-rendered");
}

export function updateProductionConsoleTemplateRenderer(model, integration, options = {}) {
  assertModel(model);
  const currentId = model.templateRendererResult?.templateRenderId;
  if (!currentId) throw consoleError("console-template-renderer-not-rendered");
  const preparedModel = prepareProductionConsoleTemplateRenderer(model, { ...options, templateRenderId: currentId });
  if (preparedModel.templateRendererErrors.length) return preparedModel;
  const result = updateTemplateRender(integration, currentId, preparedModel.templateRendererPreparation, { now: options.now });
  const snapshot = buildTemplateRenderSnapshot(integration, {
    visibility: preparedModel.templateRendererVisibility,
    now: options.now
  });
  return templateRendererModelResult(preparedModel, integration, result, snapshot, "template-renderer-updated");
}

export function clearProductionConsoleTemplateRenderer(model, integration, options = {}) {
  assertModel(model);
  clearTemplateRendererIntegration(integration, { now: options.now });
  const snapshot = buildTemplateRenderSnapshot(integration, {
    visibility: model.templateRendererVisibility,
    now: options.now
  });
  return {
    ...model,
    templateRendererState: integration.state,
    templateRendererPreparation: null,
    templateRendererResult: null,
    templateRendererSnapshot: snapshot,
    templateRendererWarnings: uniqueStrings(snapshot.warnings || []),
    templateRendererErrors: uniqueStrings(snapshot.errors || []),
    inspectorTab: "templates",
    lastAction: "template-renderer-cleared",
    lastActionError: null
  };
}

export function getProductionConsoleTemplateRenderClipboardSnapshot(model, integration, options = {}) {
  assertModel(model);
  const snapshot = integration
    ? buildTemplateRenderSnapshot(integration, {
        visibility: normalizeVisibility(options.visibility || model.templateRendererVisibility),
        now: options.now
      })
    : cloneValue(model.templateRendererSnapshot);
  if (!snapshot || !validateTemplateRenderSnapshot(snapshot).valid) throw consoleError("console-template-renderer-snapshot-invalid");
  return snapshot;
}

export function selectProductionConsoleThemeTemplateTheme(model, themeId) {
  assertModel(model);
  if (!getBroadcastTheme(model.themeRegistry, themeId)) throw consoleError("console-theme-not-found");
  return {
    ...model,
    themeTemplateThemeId: themeId,
    themeTemplateResolution: null,
    themeTemplatePreparation: null,
    themeTemplateWarnings: [],
    themeTemplateErrors: [],
    themeTemplateState: model.themeTemplateResult ? model.themeTemplateState : "ready",
    inspectorTab: "templates",
    lastAction: "theme-template-theme-selected",
    lastActionError: null
  };
}

export function createProductionConsoleThemeTemplateIntegration(model, templateRendererIntegration, options = {}) {
  assertModel(model);
  if (!templateRendererIntegration) throw consoleError("console-template-renderer-not-ready");
  const output = getComponentRendererOutput(options.outputId || model.templateRendererOutputId);
  const sources = buildProductionConsoleTemplateRendererSources(model, options);
  const sourceFixture = getFixtureDefinition(options.fixtureId || model.templateRendererContextId);
  const source = buildPlaygroundFixture(sourceFixture.competitionType, sourceFixture.countOption);
  return createThemeTemplateIntegration({
    integrationId: options.integrationId || `production_console_theme_template_${output.id}`,
    themeRegistry: model.themeRegistry,
    templateRegistry: model.templateRegistry,
    componentRegistry: model.componentRegistry,
    templateRendererIntegration,
    assetRegistry: model.assetRegistry,
    productionVariables: sources.productionVariables,
    broadcastContract: sources.broadcastContract,
    output: {
      id: output.id,
      outputId: output.id,
      type: "preview",
      width: output.width,
      height: output.height,
      orientation: output.orientation,
      safeArea: output.safeArea
    },
    visibility: normalizeVisibility(options.visibility || model.templateRendererVisibility),
    tenantId: source.organization?.tenantId,
    organizationId: source.organization?.id,
    clientId: source.organization?.clientId,
    tournamentId: source.tournament?.id,
    competitionId: source.competition?.id,
    eventId: source.tournament?.id,
    sessionId: "session_production_console",
    themeSelections: {
      sessionThemeId: options.sessionThemeId,
      outputThemeId: options.outputThemeId,
      competitionThemeId: options.competitionThemeId,
      tournamentThemeId: options.tournamentThemeId
    }
  }, { now: options.now });
}

export function resolveProductionConsoleThemeTemplate(model, integration, options = {}) {
  assertModel(model);
  const resolution = resolveThemeForTemplate(options.themeId || model.themeTemplateThemeId, integration, {
    visibility: model.templateRendererVisibility,
    now: options.now
  });
  return {
    ...model,
    themeTemplateState: integration.state,
    themeTemplateResolution: cloneValue(resolution),
    themeTemplatePreparation: null,
    themeTemplateWarnings: uniqueStrings(resolution.warnings || []),
    themeTemplateErrors: uniqueStrings(resolution.errors || []),
    inspectorTab: "templates",
    lastAction: "theme-template-theme-resolved",
    lastActionError: resolution.errors?.[0] || null
  };
}

export function prepareProductionConsoleThemeTemplate(model, integration, options = {}) {
  assertModel(model);
  const baseModel = prepareProductionConsoleTemplateRenderer(model, options);
  const resolution = baseModel.themeTemplateResolution
    || resolveThemeForTemplate(options.themeId || baseModel.themeTemplateThemeId, integration, {
      visibility: baseModel.templateRendererVisibility,
      now: options.now
    });
  const preparation = buildThemedTemplatePreparation(
    baseModel.templateRendererPreparation,
    resolution,
    integration,
    { visibility: baseModel.templateRendererVisibility, now: options.now }
  );
  return {
    ...baseModel,
    themeTemplateState: integration.state,
    themeTemplateResolution: cloneValue(resolution),
    themeTemplatePreparation: cloneValue(preparation),
    themeTemplateWarnings: uniqueStrings(preparation.warnings || []),
    themeTemplateErrors: uniqueStrings(preparation.errors || []),
    inspectorTab: "templates",
    lastAction: "theme-template-prepared",
    lastActionError: preparation.errors?.[0] || null
  };
}

export function renderProductionConsoleThemeTemplate(model, integration, options = {}) {
  assertModel(model);
  if (!model.themeTemplatePreparation) throw consoleError("console-theme-template-not-prepared");
  const result = renderThemedTemplate(integration, model.themeTemplatePreparation, { now: options.now });
  const snapshot = buildThemeTemplateSnapshot(integration, result.themedRenderId, {
    visibility: model.templateRendererVisibility,
    now: options.now
  });
  return themeTemplateModelResult(model, integration, result, snapshot, "theme-template-rendered");
}

export function changeProductionConsoleThemeTemplate(model, integration, options = {}) {
  assertModel(model);
  const themedRenderId = model.themeTemplateResult?.themedRenderId;
  if (!themedRenderId) throw consoleError("console-theme-template-not-rendered");
  const themeId = options.themeId || model.themeTemplateThemeId;
  const result = updateThemedTemplateRender(
    integration,
    themedRenderId,
    themeId,
    { visibility: model.templateRendererVisibility, now: options.now }
  );
  const resolution = resolveThemeForTemplate(
    themeId,
    buildProductionConsoleThemeResolutionContext(model, options),
    { visibility: model.templateRendererVisibility, now: options.now }
  );
  const snapshot = buildThemeTemplateSnapshot(integration, themedRenderId, {
    visibility: model.templateRendererVisibility,
    now: options.now
  });
  return {
    ...themeTemplateModelResult(model, integration, result, snapshot, "theme-template-theme-changed"),
    themeTemplateResolution: cloneValue(resolution)
  };
}

function buildProductionConsoleThemeResolutionContext(model, options = {}) {
  const output = getComponentRendererOutput(options.outputId || model.templateRendererOutputId);
  const sourceFixture = getFixtureDefinition(options.fixtureId || model.templateRendererContextId);
  const source = buildPlaygroundFixture(sourceFixture.competitionType, sourceFixture.countOption);
  return {
    themeRegistry: model.themeRegistry,
    assetRegistry: model.assetRegistry,
    output: {
      id: output.id,
      outputId: output.id,
      type: "preview",
      width: output.width,
      height: output.height,
      orientation: output.orientation,
      safeArea: output.safeArea
    },
    visibility: normalizeVisibility(options.visibility || model.templateRendererVisibility),
    tenantId: source.organization?.tenantId,
    organizationId: source.organization?.id,
    clientId: source.organization?.clientId,
    tournamentId: source.tournament?.id,
    competitionId: source.competition?.id,
    eventId: source.tournament?.id,
    sessionId: "session_production_console"
  };
}

export function updateProductionConsoleThemeTemplate(model, integration, options = {}) {
  return changeProductionConsoleThemeTemplate(model, integration, options);
}

export function clearProductionConsoleThemeTemplate(model, integration, options = {}) {
  assertModel(model);
  clearThemeTemplateIntegration(integration, { now: options.now });
  return {
    ...model,
    themeTemplateState: integration.state,
    themeTemplateResolution: null,
    themeTemplatePreparation: null,
    themeTemplateResult: null,
    themeTemplateSnapshot: null,
    themeTemplateWarnings: [],
    themeTemplateErrors: [],
    templateRendererPreparation: null,
    templateRendererResult: null,
    templateRendererSnapshot: null,
    templateRendererWarnings: [],
    templateRendererErrors: [],
    inspectorTab: "templates",
    lastAction: "theme-template-cleared",
    lastActionError: null
  };
}

export function getProductionConsoleThemeTemplateClipboardSnapshot(model, integration, options = {}) {
  assertModel(model);
  const themedRenderId = options.themedRenderId || model.themeTemplateResult?.themedRenderId;
  const snapshot = buildThemeTemplateSnapshot(integration, themedRenderId || null, {
    visibility: normalizeVisibility(options.visibility || model.templateRendererVisibility),
    now: options.now
  });
  if (!validateThemeTemplateSnapshot(snapshot).valid) throw consoleError("console-theme-template-snapshot-invalid");
  return snapshot;
}

export function createProductionConsoleOfficialPreviewEngine(model, integration, preparationStore = {}, options = {}) {
  assertModel(model);
  const output = getComponentRendererOutput(options.outputId || model.templateRendererOutputId);
  return createPreviewEngine({
    engineId: options.engineId || `production_console_official_preview_${output.id}`,
    themeTemplateIntegration: integration,
    resolvePreparation: () => preparationStore.preparation,
    now: options.now
  });
}

export function prepareProductionConsoleOfficialPreview(model, engine, preparationStore = {}, integration, options = {}) {
  assertModel(model);
  const preparedModel = prepareProductionConsoleThemeTemplate(model, integration, options);
  preparationStore.preparation = cloneValue(preparedModel.themeTemplatePreparation);
  const sourceSnapshot = buildProductionConsoleOfficialPreviewSourceSnapshot(preparedModel, integration, options);
  const preview = prepareOfficialPreview(engine, sourceSnapshot, {
    visibility: preparedModel.templateRendererVisibility,
    now: options.now
  });
  return officialPreviewModelResult(preparedModel, engine, preview, "official-preview-prepared", options);
}

export function renderProductionConsoleOfficialPreview(model, engine, options = {}) {
  assertModel(model);
  const preview = renderOfficialPreview(engine, { now: options.now });
  return officialPreviewModelResult(model, engine, preview, "official-preview-rendered", options);
}

export function updateProductionConsoleOfficialPreview(model, engine, options = {}) {
  assertModel(model);
  const preview = updateOfficialPreview(engine, {
    themeId: options.themeId || model.themeTemplateThemeId,
    visibility: options.visibility || model.templateRendererVisibility
  }, { now: options.now });
  return officialPreviewModelResult(model, engine, preview, "official-preview-updated", options);
}

export function clearProductionConsoleOfficialPreview(model, engine, preparationStore = {}, options = {}) {
  assertModel(model);
  clearOfficialPreview(engine, { now: options.now });
  preparationStore.preparation = null;
  return {
    ...model,
    officialPreviewState: getPreviewState(engine),
    officialPreview: null,
    officialPreviewSnapshot: getPreviewSnapshot(engine, {
      visibility: model.templateRendererVisibility,
      now: options.now
    }),
    officialPreviewWarnings: [],
    officialPreviewErrors: [],
    themeTemplateState: integrationStateAfterOfficialClear(model),
    themeTemplateResult: null,
    themeTemplateSnapshot: null,
    inspectorTab: "templates",
    lastAction: "official-preview-cleared",
    lastActionError: null
  };
}

export function getProductionConsoleOfficialPreviewClipboardSnapshot(model, engine, options = {}) {
  assertModel(model);
  return getPreviewSnapshot(engine, {
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
}

export function createProductionConsoleOfficialProgramEngine(model, options = {}) {
  assertModel(model);
  return createProgramEngine({
    engineId: options.engineId || "production_console_official_program",
    now: options.now
  });
}

export function prepareProductionConsoleOfficialProgram(model, programEngine, previewEngine, options = {}) {
  assertModel(model);
  if (model.officialPreview?.status !== "rendered") throw consoleError("console-official-preview-not-rendered");
  const previewSnapshot = getPreviewSnapshot(previewEngine, {
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
  prepareOfficialProgram(programEngine, previewSnapshot, {
    rendererId: options.rendererId || "production-console-preview-runtime-v1",
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
  return {
    ...model,
    officialProgramState: getProgramState(programEngine),
    officialProgramSnapshot: getProgramSnapshot(programEngine, {
      visibility: options.visibility || model.templateRendererVisibility,
      now: options.now
    }),
    officialProgramWarnings: [],
    officialProgramErrors: [],
    inspectorTab: "templates",
    lastAction: "official-program-prepared",
    lastActionError: null
  };
}

export function takeProductionConsoleOfficialProgram(model, engine, options = {}) {
  assertModel(model);
  return officialProgramModelResult(model, engine, takeOfficialProgram(engine, { now: options.now }), "official-program-taken", options);
}

export function cutProductionConsoleOfficialProgram(model, engine, options = {}) {
  assertModel(model);
  return officialProgramModelResult(model, engine, cutOfficialProgram(engine, { now: options.now }), "official-program-cut", options);
}

export function autoProductionConsoleOfficialProgram(model, engine, options = {}) {
  assertModel(model);
  return officialProgramModelResult(model, engine, autoOfficialProgram(engine, { now: options.now }), "official-program-auto", options);
}

export function updateProductionConsoleOfficialProgram(model, programEngine, previewEngine, options = {}) {
  assertModel(model);
  const previewSnapshot = getPreviewSnapshot(previewEngine, {
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
  const program = updateOfficialProgram(programEngine, previewSnapshot, {
    rendererId: options.rendererId || "production-console-preview-runtime-v1",
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
  return officialProgramModelResult(model, programEngine, program, "official-program-updated", options);
}

export function clearProductionConsoleOfficialProgram(model, engine, options = {}) {
  assertModel(model);
  clearOfficialProgram(engine, { now: options.now });
  return {
    ...model,
    officialProgramState: getProgramState(engine),
    officialProgram: null,
    officialProgramSnapshot: getProgramSnapshot(engine, {
      visibility: options.visibility || model.templateRendererVisibility,
      now: options.now
    }),
    officialProgramWarnings: [],
    officialProgramErrors: [],
    inspectorTab: "templates",
    lastAction: "official-program-cleared",
    lastActionError: null
  };
}

export function getProductionConsoleOfficialProgramClipboardSnapshot(model, engine, options = {}) {
  assertModel(model);
  return getProgramSnapshot(engine, {
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
}

export function createProductionConsoleOutputRoutingEngine(model, options = {}) {
  assertModel(model);
  const engine = createOutputRoutingEngine({
    engineId: options.engineId || "production_console_output_routing",
    now: options.now
  });
  const scope = productionConsoleRoutingScope(model);
  PRODUCTION_CONSOLE_OUTPUT_ROUTES.forEach((definition) => {
    createOutputRoute(engine, {
      ...definition,
      ...scope,
      resolution: { width: 1920, height: 1080, transparentBackground: definition.routeType === "program_main" },
      enabled: true,
      refreshMode: "manual",
      permissions: {
        readOnly: true,
        canResolve: true,
        canConfigure: true,
        canControlProgram: false,
        canControlPreview: false,
        canControlTimer: false
      },
      metadata: { source: "production-console", physicalOutput: false }
    }, { now: options.now });
  });
  return engine;
}

export function configureProductionConsoleOutputRoute(model, engine, routeId, options = {}) {
  assertModel(model);
  const route = getOutputRoute(engine, routeId, { now: options.now });
  if (!route) throw consoleError("console-output-route-not-found");
  const scope = productionConsoleRoutingScope(model);
  updateOutputRoute(engine, routeId, {
    name: PRODUCTION_CONSOLE_OUTPUT_ROUTES.find((entry) => entry.routeId === routeId)?.name || route.name,
    organizationId: scope.organizationId,
    clientId: scope.clientId,
    tournamentId: scope.tournamentId,
    competitionId: scope.competitionId,
    sessionId: scope.sessionId,
    metadata: { source: "production-console", physicalOutput: false, configured: true }
  }, {
    expectedRevision: route.revision,
    actor: CONSOLE_SETUP_ACTOR,
    now: options.now
  });
  return syncProductionConsoleOutputRoutingModel(model, engine, {
    lastAction: "output-routing-configured",
    now: options.now
  });
}

export function resolveProductionConsoleOutputRoute(model, engine, routeId, options = {}) {
  assertModel(model);
  const scope = productionConsoleRoutingScope(model);
  const sharedOptions = {
    context: scope,
    visibility: routeId === "route-announcer-monitor" ? "operational" : undefined,
    now: options.now
  };
  let result;
  if (routeId === "route-program-main") {
    const snapshot = options.programEngine
      ? getProgramSnapshot(options.programEngine, { visibility: "public", now: options.now })
      : model.officialProgramSnapshot;
    if (!snapshot) throw consoleError("console-output-routing-program-snapshot-required");
    result = routeProgramToOutput(engine, routeId, snapshot, sharedOptions);
  } else if (routeId === "route-announcer-monitor") {
    result = routeAnnouncerMonitor(engine, routeId, buildProductionConsoleAnnouncerSources(model), sharedOptions);
  } else if (routeId === "route-timer-display") {
    result = routeTimerDisplay(engine, routeId, buildProductionConsoleOfficialTimerState(model), sharedOptions);
  } else {
    throw consoleError("console-output-route-not-found");
  }
  return syncProductionConsoleOutputRoutingModel(model, engine, {
    result,
    routeId,
    lastAction: options.update === true ? "output-routing-updated" : "output-routing-resolved",
    now: options.now
  });
}

export function setProductionConsoleOutputRouteEnabled(model, engine, routeId, enabled, options = {}) {
  assertModel(model);
  const route = getOutputRoute(engine, routeId, { now: options.now });
  if (!route) throw consoleError("console-output-route-not-found");
  if (enabled) enableOutputRoute(engine, routeId, {
    expectedRevision: route.revision,
    actor: CONSOLE_SETUP_ACTOR,
    now: options.now
  });
  else disableOutputRoute(engine, routeId, {
    expectedRevision: route.revision,
    actor: CONSOLE_SETUP_ACTOR,
    now: options.now
  });
  return syncProductionConsoleOutputRoutingModel(model, engine, {
    lastAction: enabled ? "output-routing-enabled" : "output-routing-disabled",
    now: options.now
  });
}

export function clearProductionConsoleOutputRoute(model, engine, routeId, options = {}) {
  assertModel(model);
  const route = getOutputRoute(engine, routeId, { now: options.now });
  if (!route) throw consoleError("console-output-route-not-found");
  clearOutputRoute(engine, routeId, {
    expectedRevision: route.revision,
    actor: CONSOLE_SETUP_ACTOR,
    now: options.now
  });
  const results = { ...(model.outputRoutingResults || {}) };
  delete results[routeId];
  return syncProductionConsoleOutputRoutingModel({ ...model, outputRoutingResults: results }, engine, {
    lastAction: "output-routing-cleared",
    now: options.now
  });
}

export function getProductionConsoleOutputRoutingClipboardSnapshot(model, engine, options = {}) {
  assertModel(model);
  return buildOutputRoutingSnapshot(engine, {
    visibility: options.visibility || "production",
    now: options.now
  });
}

function syncProductionConsoleOutputRoutingModel(model, engine, options = {}) {
  const results = { ...(model.outputRoutingResults || {}) };
  if (options.routeId && options.result) results[options.routeId] = cloneValue(options.result);
  const snapshot = buildOutputRoutingSnapshot(engine, { visibility: "production", now: options.now });
  return {
    ...model,
    outputRoutingState: getOutputRoutingStatus(engine, { now: options.now }).state,
    outputRoutingRoutes: listOutputRoutes(engine, {}, { now: options.now }),
    outputRoutingResults: results,
    outputRoutingSnapshot: snapshot,
    outputRoutingWarnings: getOutputRoutingWarnings(engine, { now: options.now }),
    outputRoutingErrors: getOutputRoutingErrors(engine),
    lastAction: options.lastAction || model.lastAction,
    lastActionError: null
  };
}

function productionConsoleRoutingScope(model) {
  return {
    tenantId: model.fixtureSource?.organization?.tenantId || null,
    organizationId: model.contract?.organization?.id || model.fixtureSource?.organization?.id || null,
    clientId: model.fixtureSource?.organization?.clientId || null,
    tournamentId: model.contract?.tournament?.id || null,
    competitionId: model.contract?.competition?.id || null,
    sessionId: model.state?.session?.id || "session_production_console"
  };
}

function buildProductionConsoleAnnouncerSources(model) {
  const contract = model.contract || {};
  const rankingEntries = Array.isArray(contract.ranking?.entries) ? contract.ranking.entries : [];
  const currentId = contract.participant?.id || contract.team?.id || null;
  const nextEntry = rankingEntries.find((entry) => entry.id && entry.id !== currentId) || null;
  return {
    sourceRevision: contract.revision ?? 0,
    visibility: "operational",
    ...productionConsoleRoutingScope(model),
    contract,
    next: nextEntry ? {
      team: contract.competition?.scope === "team" ? nextEntry : null,
      participant: contract.competition?.scope === "individual" ? nextEntry : null
    } : null,
    standings: rankingEntries,
    timer: contract.timer || null,
    notes: contract.production?.messages || [],
    sponsorMention: contract.sponsor?.active || null,
    alerts: contract.warnings || [],
    context: {
      tournamentId: contract.tournament?.id || null,
      competitionId: contract.competition?.id || null,
      charreadaId: contract.charreada?.id || null,
      suerteId: contract.suerte?.id || null
    },
    generatedAt: contract.generatedAt
  };
}

function setupProductionConsoleOutputSynchronization(model, runtime, refs, options = {}) {
  disposeProductionConsoleOutputSynchronization(runtime, options);
  if (!refs.outputSynchronizationProgramHost || !refs.outputSynchronizationAnnouncerHost || !runtime.outputRoutingEngine) {
    return model;
  }
  const scope = productionConsoleRoutingScope(model);
  const now = options.now;
  runtime.synchronizedProgramMainOutput = createProgramMainOutput({
    programMainOutputId: "production-console-program-main-output",
    browserOutputId: "production-console-browser-program-main"
  }, { now });
  configureProgramMainOutput(runtime.synchronizedProgramMainOutput, {
    programMainOutputId: "production-console-program-main-output",
    browserOutputId: "production-console-browser-program-main",
    routeId: "route-program-main",
    outputId: "program-main",
    routeType: "program_main",
    sourceType: "program_snapshot",
    displayMode: "fit",
    visibility: "production",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: true,
    viewport: null,
    ...scope,
    metadata: { source: "production-console", synchronization: "local-explicit" }
  }, { now });
  mountProgramMainOutput(runtime.synchronizedProgramMainOutput, refs.outputSynchronizationProgramHost, { now });

  runtime.synchronizedAnnouncerMonitor = createAnnouncerMonitor({
    announcerMonitorId: "production-console-announcer-monitor",
    browserOutputId: "production-console-browser-announcer"
  }, { now });
  configureAnnouncerMonitor(runtime.synchronizedAnnouncerMonitor, {
    announcerMonitorId: "production-console-announcer-monitor",
    browserOutputId: "production-console-browser-announcer",
    routeId: "route-announcer-monitor",
    outputId: "announcer-monitor",
    routeType: "announcer_monitor",
    sourceType: "announcer_projection",
    displayMode: "balanced",
    visibility: "operational",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    transparentBackground: false,
    viewport: null,
    videoRegion: { enabled: true, status: "placeholder", sourceType: null, connected: false, muted: true, aspectRatio: "16:9" },
    ...scope,
    metadata: { source: "production-console", synchronization: "local-explicit" }
  }, { now });
  mountAnnouncerMonitor(runtime.synchronizedAnnouncerMonitor, refs.outputSynchronizationAnnouncerHost, { now });

  runtime.outputSynchronization = createOutputSynchronization({
    synchronizationId: "production-console-output-synchronization"
  }, { now });
  configureOutputSynchronization(runtime.outputSynchronization, {
    targets: ["program_main", "announcer_monitor"],
    staleAfterMs: 15000,
    context: scope
  }, { expectedRevision: 0, now });
  startOutputSynchronization(runtime.outputSynchronization, { expectedRevision: 1, now });
  return syncProductionConsoleOutputSynchronizationModel(model, runtime, {
    lastAction: "output-synchronization-ready",
    now
  });
}

function runProductionConsoleOutputSynchronization(model, runtime, action, options = {}) {
  if (!runtime.outputSynchronization || runtime.outputSynchronization.status === "destroyed") {
    throw consoleError("console-output-synchronization-unavailable");
  }
  const scope = productionConsoleRoutingScope(model);
  let next = model;
  if (["sync-program", "sync-all"].includes(action)) {
    next = configureProductionConsoleOutputRoute(next, runtime.outputRoutingEngine, "route-program-main", options);
  }
  if (["sync-announcer", "sync-all"].includes(action)) {
    next = configureProductionConsoleOutputRoute(next, runtime.outputRoutingEngine, "route-announcer-monitor", options);
  }
  if (action === "sync-program") {
    synchronizeProgramMain(runtime.outputSynchronization, {
      routingEngine: runtime.outputRoutingEngine,
      programEngine: runtime.officialProgramEngine,
      programMainOutput: runtime.synchronizedProgramMainOutput,
      context: scope
    }, { expectedRevision: runtime.outputSynchronization.revision, now: options.now });
  } else if (action === "sync-announcer") {
    synchronizeAnnouncerMonitor(runtime.outputSynchronization, {
      routingEngine: runtime.outputRoutingEngine,
      announcerSources: buildProductionConsoleAnnouncerSources(next),
      announcerMonitor: runtime.synchronizedAnnouncerMonitor,
      context: scope,
      visibility: "operational"
    }, { expectedRevision: runtime.outputSynchronization.revision, now: options.now });
  } else if (action === "sync-all") {
    synchronizeAllOutputs(runtime.outputSynchronization, {
      programMain: {
        routingEngine: runtime.outputRoutingEngine,
        programEngine: runtime.officialProgramEngine,
        programMainOutput: runtime.synchronizedProgramMainOutput,
        context: scope
      },
      announcerMonitor: {
        routingEngine: runtime.outputRoutingEngine,
        announcerSources: buildProductionConsoleAnnouncerSources(next),
        announcerMonitor: runtime.synchronizedAnnouncerMonitor,
        context: scope,
        visibility: "operational"
      }
    }, { expectedRevision: runtime.outputSynchronization.revision, now: options.now });
  } else if (action === "clear-program") {
    clearSynchronizedOutput(runtime.outputSynchronization, "program_main", {
      programMainOutput: runtime.synchronizedProgramMainOutput
    }, { expectedRevision: runtime.outputSynchronization.revision, now: options.now });
  } else if (action === "clear-announcer") {
    clearSynchronizedOutput(runtime.outputSynchronization, "announcer_monitor", {
      announcerMonitor: runtime.synchronizedAnnouncerMonitor
    }, { expectedRevision: runtime.outputSynchronization.revision, now: options.now });
  } else {
    throw consoleError("console-output-synchronization-action-invalid");
  }
  return syncProductionConsoleOutputSynchronizationModel(next, runtime, {
    lastAction: `output-synchronization-${action}`,
    now: options.now
  });
}

function syncProductionConsoleOutputSynchronizationModel(model, runtime, options = {}) {
  if (!runtime.outputSynchronization || runtime.outputSynchronization.status === "destroyed") {
    return {
      ...model,
      outputSynchronizationState: "uninitialized",
      outputSynchronizationSnapshot: null,
      outputSynchronizationWarnings: [],
      outputSynchronizationErrors: []
    };
  }
  const snapshot = buildOutputSynchronizationSnapshot(runtime.outputSynchronization, { now: options.now });
  return {
    ...model,
    outputSynchronizationState: getOutputSynchronizationStatus(runtime.outputSynchronization, { now: options.now }).status,
    outputSynchronizationSnapshot: snapshot,
    outputSynchronizationWarnings: getOutputSynchronizationWarnings(runtime.outputSynchronization, { now: options.now }),
    outputSynchronizationErrors: getOutputSynchronizationErrors(runtime.outputSynchronization, { now: options.now }),
    lastAction: options.lastAction || model.lastAction,
    lastActionError: null
  };
}

function disposeProductionConsoleOutputSynchronization(runtime, options = {}) {
  if (runtime.outputSynchronization && runtime.outputSynchronization.status !== "destroyed") {
    destroyOutputSynchronization(runtime.outputSynchronization, { now: options.now });
  }
  if (runtime.synchronizedProgramMainOutput && runtime.synchronizedProgramMainOutput.status !== "destroyed") {
    destroyProgramMainOutput(runtime.synchronizedProgramMainOutput, { now: options.now });
  }
  if (runtime.synchronizedAnnouncerMonitor && runtime.synchronizedAnnouncerMonitor.status !== "destroyed") {
    destroyAnnouncerMonitor(runtime.synchronizedAnnouncerMonitor, { now: options.now });
  }
  runtime.outputSynchronization = null;
  runtime.synchronizedProgramMainOutput = null;
  runtime.synchronizedAnnouncerMonitor = null;
}

function buildProductionConsoleOfficialTimerState(model) {
  const timer = model.contract?.timer || {};
  return {
    timerId: timer.id,
    status: timer.status,
    formattedTime: timer.display,
    elapsedMs: timer.elapsed,
    remainingMs: timer.remaining,
    startedAt: timer.startedAt,
    pausedAt: timer.pausedAt || null,
    stoppedAt: timer.stoppedAt || null,
    sourceRevision: timer.revision,
    contextRef: {
      tournamentId: model.contract?.tournament?.id || null,
      competitionId: model.contract?.competition?.id || null,
      charreadaId: model.contract?.charreada?.id || null,
      teamId: model.contract?.team?.id || null,
      participantId: model.contract?.participant?.id || null,
      suerteId: model.contract?.suerte?.id || null
    },
    generatedAt: timer.updatedAt || model.contract?.generatedAt,
    alertState: timer.alertState || null,
    suerte: model.contract?.suerte || null,
    team: model.contract?.team || null,
    participant: model.contract?.participant || null,
    attempt: model.contract?.suerte?.attempt ?? null,
    visibility: "public",
    ...productionConsoleRoutingScope(model)
  };
}

function buildProductionConsoleOfficialPreviewSourceSnapshot(model, integration, options = {}) {
  const preparation = model.themeTemplatePreparation;
  if (!preparation) throw consoleError("console-official-preview-preparation-required");
  const output = getComponentRendererOutput(model.templateRendererOutputId);
  const now = normalizeNow(options.now);
  const themedRenderId = `themed_${preparation.templateRenderId}_${preparation.themeId}`;
  const render = {
    themedRenderId,
    templateRenderId: preparation.templateRenderId,
    templateId: preparation.templateId,
    templateVersion: preparation.templateInstance?.templateVersion || "1.0.0",
    templateInstanceId: preparation.templateInstanceId,
    themeId: preparation.themeId,
    themeVersion: preparation.themeVersion,
    themeScope: preparation.themeScope,
    brandingStatus: preparation.brandingStatus,
    outputId: output.id,
    visibility: preparation.effectiveVisibility || model.templateRendererVisibility,
    state: "prepared",
    status: "prepared",
    componentCount: preparation.componentInstances?.length || 0,
    renderedCount: 0,
    warnings: uniqueStrings(preparation.warnings || []),
    errors: uniqueStrings(preparation.errors || []),
    createdAt: now,
    updatedAt: now
  };
  const snapshot = {
    snapshotVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    integrationVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    generatedAt: now,
    visibility: render.visibility,
    integrationId: integration.integrationId,
    state: "prepared",
    outputId: output.id,
    tenantId: integration.tenantId,
    themedRenderIds: [themedRenderId],
    renders: [render],
    rendererSummary: {
      integrationVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
      outputId: output.id,
      orientation: output.orientation,
      resolution: { width: output.width, height: output.height },
      safeArea: cloneValue(output.safeArea),
      templateRenderIds: [preparation.templateRenderId]
    },
    warnings: uniqueStrings(preparation.warnings || []),
    errors: uniqueStrings(preparation.errors || [])
  };
  if (!validateThemeTemplateSnapshot(snapshot).valid) throw consoleError("console-official-preview-source-snapshot-invalid");
  return snapshot;
}

function officialPreviewModelResult(model, engine, preview, lastAction, options = {}) {
  const snapshot = getPreviewSnapshot(engine, {
    visibility: model.templateRendererVisibility,
    now: options.now
  });
  return {
    ...model,
    officialPreviewState: getPreviewState(engine),
    officialPreview: cloneValue(preview),
    officialPreviewSnapshot: cloneValue(snapshot),
    officialPreviewWarnings: uniqueStrings([...(preview.warnings || []), ...(snapshot.warnings || [])]),
    officialPreviewErrors: uniqueStrings([...(preview.errors || []), ...(snapshot.errors || [])]),
    inspectorTab: "templates",
    lastAction,
    lastActionError: preview.errors?.[0] || null
  };
}

function officialProgramModelResult(model, engine, program, lastAction, options = {}) {
  const snapshot = getProgramSnapshot(engine, {
    visibility: options.visibility || model.templateRendererVisibility,
    now: options.now
  });
  return {
    ...model,
    officialProgramState: getProgramState(engine),
    officialProgram: cloneValue(program),
    officialProgramSnapshot: cloneValue(snapshot),
    officialProgramWarnings: uniqueStrings([...(program.warnings || []), ...(snapshot.warnings || [])]),
    officialProgramErrors: uniqueStrings([...(program.errors || []), ...(snapshot.errors || [])]),
    inspectorTab: "templates",
    lastAction,
    lastActionError: program.errors?.[0] || null
  };
}

function integrationStateAfterOfficialClear(model) {
  return model.themeTemplateState === "destroyed" ? "destroyed" : "cleared";
}

export function disposeProductionConsole(model) {
  const ids = Array.isArray(model?.outputIds) ? model.outputIds : consoleOutputIds();
  ids.forEach((id) => removeBroadcastOutput(id));
}

export function dispatchProductionConsoleAction(model, actionType, target = {}, payload = {}, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const sequence = model.actionSequence + 1;
  const actionContext = createBroadcastActionContext({
    state: model.state,
    contract: model.contract,
    outputs: Object.fromEntries(listBroadcastOutputs().filter((output) => model.outputIds.includes(output.id)).map((output) => [output.id, output])),
    assets: model.assetRegistry,
    variables: model.variableRegistry,
    actor: CONSOLE_ACTOR,
    visibility: model.visibility,
    safeMode: model.safeMode,
    outputIds: model.outputIds,
    now
  }, { expectedRevision: options.expectedRevision ?? model.state.revision, now });
  let action = createBroadcastAction(actionType, payload, {
    actionId: options.actionId || undefined,
    target,
    actor: CONSOLE_ACTOR,
    mode: options.mode || "manual",
    idempotencyKey: options.idempotencyKey || null,
    correlationId: options.correlationId || null,
    causationId: options.causationId || null,
    context: actionContext,
    now
  });
  const confirmation = requiresBroadcastActionConfirmation(action, actionContext);
  const confirmations = options.confirmations ?? (options.confirmed === true ? confirmation.requiredCount : 0);
  for (let index = 0; index < confirmations; index += 1) {
    action = confirmBroadcastAction(action, {
      type: confirmation.type,
      confirmationId: `${action.actionId}_confirmation_${index + 1}`
    }, { context: actionContext, actor: CONSOLE_ACTOR, now });
  }
  const dispatch = dispatchBroadcastAction(action, actionContext, { now });
  const result = dispatch.result;
  const historyItem = {
    actionId: dispatch.action.actionId,
    actionType: dispatch.action.actionType,
    status: dispatch.action.status,
    resultCode: result.code,
    success: result.success,
    actor: dispatch.action.actor,
    timestamp: result.completedAt || dispatch.action.createdAt,
    stateRevisionBefore: result.stateRevisionBefore,
    stateRevisionAfter: result.stateRevisionAfter
  };
  const nextModel = {
    ...model,
    state: dispatch.state,
    assetRegistry: dispatch.assets,
    variableRegistry: dispatch.variables,
    actionSequence: sequence,
    actionHistory: [historyItem, ...(model.actionHistory || [])].slice(0, 20),
    lastAction: options.label || actionType.toLowerCase().replaceAll("_", "-"),
    lastActionError: result.success ? null : result.code
  };
  if (!result.success && options.allowFailure !== true) throw consoleActionError(dispatch, actionType);
  return nextModel;
}

export function setProductionConsoleVariable(model, variableId, value, options = {}) {
  const variable = requireConsoleVariable(model, variableId);
  return dispatchProductionConsoleAction(model, ACTION_TYPES.SET_VARIABLE, { variableId }, {
    expectedRevision: options.expectedRevision ?? variable.revision,
    value
  }, { ...options, label: options.label || "variable-value-set" });
}

export function resetProductionConsoleVariable(model, variableId, options = {}) {
  const variable = requireConsoleVariable(model, variableId);
  return dispatchProductionConsoleAction(model, ACTION_TYPES.RESET_VARIABLE, { variableId }, {
    expectedRevision: options.expectedRevision ?? variable.revision,
    strategy: options.strategy || "null"
  }, { ...options, label: options.label || "variable-value-reset" });
}

export function setProductionConsoleVariableStatus(model, variableId, enabled, options = {}) {
  const variable = requireConsoleVariable(model, variableId);
  return dispatchProductionConsoleAction(model, enabled ? ACTION_TYPES.ENABLE_VARIABLE : ACTION_TYPES.DISABLE_VARIABLE, { variableId }, {
    expectedRevision: options.expectedRevision ?? variable.revision
  }, { ...options, label: options.label || (enabled ? "variable-enabled" : "variable-disabled") });
}

export function loadProductionConsoleFixture(model, fixtureId, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const definition = getFixtureDefinition(fixtureId);
  const source = stampFixtureSource(buildPlaygroundFixture(definition.competitionType, definition.countOption), now);
  const contract = buildBroadcastDataContract(source, {
    visibility: model.visibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_SELECTION, {}, {
    selection: model.state.selection,
    contextRef: contextRefFromContract(contract),
    clearPreview: true,
    model: { fixtureId: definition.id }
  }, { now, label: "context-loaded" });
  return {
    ...dispatched,
    fixtureSource: source,
    contract,
    fixtureId: definition.id,
    currentGraphicInstanceId: null,
    lastPreviewConfig: null,
    lastAction: "context-loaded",
    lastActionError: null
  };
}

export function selectProductionGraphic(model, graphicId) {
  assertModel(model);
  const graphic = getGraphicDefinition(graphicId);
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SELECT_GRAPHIC, {
    graphicId: graphic.graphicId,
    layerId: graphic.layerId,
    outputIds: [model.selectedOutputId]
  }, {
    templateId: graphic.graphicId,
    position: graphic.defaultPosition,
    size: graphic.defaultSize,
    scale: graphic.defaultScale,
    opacity: graphic.defaultOpacity
  }, { label: "graphic-selected" });
  return {
    ...dispatched,
    selectedGraphicId: graphic.graphicId,
    geometry: geometryFromGraphic(graphic),
    previewVisible: true,
    lastAction: "graphic-selected",
    lastActionError: null
  };
}

export function selectProductionAsset(model, assetId) {
  assertModel(model);
  const selectedAssetId = assetExists(model.assetRegistry, assetId) ? assetId : DEFAULT_ASSET_ID;
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_SELECTION, {}, {
    selection: {
      ...model.state.selection,
      payloadBindings: { ...model.state.selection.payloadBindings, assetId: selectedAssetId }
    },
    model: { selectedAssetId }
  }, { label: "asset-selected" });
  return {
    ...dispatched,
    selectedAssetId,
    lastAction: "asset-selected",
    lastActionError: null
  };
}

export function selectProductionOutput(model, outputId) {
  assertModel(model);
  if (!model.outputIds.includes(outputId) || !getBroadcastOutput(outputId)) throw consoleError("console-output-not-found", { outputId });
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_OUTPUT, { outputId }, {}, { label: "output-selected" });
  return { ...dispatched, selectedOutputId: outputId, lastAction: "output-selected", lastActionError: null };
}

export function setProductionVisibility(model, visibility, options = {}) {
  assertModel(model);
  const nextVisibility = normalizeVisibility(visibility);
  const now = normalizeNow(options.now);
  const contract = buildBroadcastDataContract(model.fixtureSource, {
    visibility: nextVisibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_SELECTION, {}, {
    selection: model.state.selection,
    model: { visibility: nextVisibility }
  }, { now, label: "visibility-rebuilt" });
  return {
    ...dispatched,
    visibility: nextVisibility,
    contract,
    lastAction: "visibility-rebuilt",
    lastActionError: null
  };
}

export function setProductionSafeMode(model, enabled) {
  assertModel(model);
  const safeMode = enabled !== false;
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_SELECTION, {}, {
    selection: model.state.selection,
    model: { safeMode }
  }, { label: safeMode ? "safe-mode-on" : "safe-mode-off" });
  return { ...dispatched, safeMode, lastAction: safeMode ? "safe-mode-on" : "safe-mode-off", lastActionError: null };
}

export function prepareProductionPreview(model, patch = {}, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const graphic = getGraphicDefinition(patch.graphicId || model.selectedGraphicId);
  const geometry = normalizeGeometry({
    ...model.geometry,
    ...(patch.geometry || {}),
    layerId: patch.layerId || patch.geometry?.layerId || model.geometry.layerId || graphic.layerId
  });
  const animation = normalizeAnimation({ ...model.animation, ...(patch.animation || {}) });
  const visible = patch.visible !== undefined ? patch.visible === true : model.previewVisible !== false;
  const sequence = model.graphicSequence + 1;
  const instanceId = `${graphic.graphicId}-console-${sequence}`;
  const targetOutputIds = uniqueStrings([PREVIEW_OUTPUT_ID, patch.outputId || model.selectedOutputId]);
  const payloadBindings = {
    definitionId: graphic.graphicId,
    type: graphic.type,
    requiredData: [...graphic.requiredData],
    dataBindings: cloneValue(graphic.dataBindings),
    fallback: graphic.fallback,
    assetId: patch.assetId || model.selectedAssetId,
    variantId: patch.variantId || null,
    message: patch.message !== undefined ? String(patch.message) : "Información oficial de producción",
    enterAnimation: animation.enter,
    exitAnimation: animation.exit,
    delay: animation.delay
  };
  const graphicState = {
    templateId: graphic.graphicId,
    templateVersion: "1.0.0",
    variantId: "production-console",
    themeId: "charropro_gold",
    layerId: geometry.layerId,
    visible,
    status: visible ? "prepared" : "hidden",
    position: geometry.position,
    size: geometry.size,
    scale: geometry.scale,
    opacity: geometry.opacity,
    rotation: 0,
    duration: animation.duration,
    autoHide: animation.autoHide,
    outputIds: targetOutputIds,
    contextRef: contextRefFromContract(model.contract),
    payloadBindings,
    errors: patch.errors || [],
    warnings: patch.warnings || []
  };
  const currentLayer = model.state.layers[geometry.layerId];
  if (currentLayer?.locked && options.confirmed !== true) throw consoleError("console-layer-locked", { layerId: geometry.layerId });
  const layerState = {
    visible,
    graphicIds: visible ? [instanceId] : [],
    outputIds: targetOutputIds,
    status: visible ? "visible" : "hidden"
  };
  const previewState = {
    active: true,
    compositionId: `console-composition-${graphic.graphicId}`,
    sceneId: `console-scene-${model.fixtureId}`,
    templateInstances: visible ? {
      [instanceId]: { instanceId, graphicId: instanceId, templateId: graphic.graphicId, layerId: geometry.layerId }
    } : {},
    visibleGraphics: visible ? [instanceId] : [],
    activeLayers: visible ? [geometry.layerId] : [],
    outputIds: targetOutputIds,
    themeId: "charropro_gold",
    contextRef: contextRefFromContract(model.contract),
    status: patch.errors?.length ? "error" : "ready",
    validation: {
      valid: !patch.errors?.length,
      checkedAt: now,
      errors: patch.errors || [],
      warnings: patch.warnings || []
    },
    warnings: patch.warnings || [],
    errors: patch.errors || []
  };
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.PREPARE_PREVIEW, {
    graphicId: instanceId,
    layerId: geometry.layerId,
    outputIds: targetOutputIds
  }, {
    graphicState,
    layerState,
    previewState,
    replace: patch.replace === true,
    force: currentLayer?.locked === true && options.confirmed === true
  }, {
    now,
    confirmed: options.confirmed === true,
    label: patch.replace === true ? "preview-replaced" : "preview-prepared"
  });
  return {
    ...dispatched,
    lastPreviewConfig: model.state.preview.active ? {
      graphicId: model.selectedGraphicId,
      assetId: model.selectedAssetId,
      outputId: model.selectedOutputId,
      geometry: cloneValue(model.geometry),
      animation: cloneValue(model.animation),
      visible: model.previewVisible
    } : model.lastPreviewConfig,
    geometry,
    animation,
    selectedGraphicId: graphic.graphicId,
    selectedAssetId: payloadBindings.assetId,
    previewVisible: visible,
    graphicSequence: sequence,
    currentGraphicInstanceId: instanceId,
    lastAction: patch.replace === true ? "preview-replaced" : "preview-prepared",
    lastActionError: null
  };
}

export function transitionProductionToProgram(model, mode = "take", options = {}) {
  assertModel(model);
  const transitionMode = ["take", "cut", "auto"].includes(mode) ? mode : "take";
  if (model.safeMode && options.confirmed !== true) throw consoleError("console-safe-mode-confirmation-required", { mode: transitionMode });
  const now = normalizeNow(options.now);
  const actionType = { take: ACTION_TYPES.TAKE, cut: ACTION_TYPES.CUT, auto: ACTION_TYPES.AUTO }[transitionMode];
  const dispatched = dispatchProductionConsoleAction(model, actionType, { outputIds: model.outputIds }, {}, {
    now,
    confirmed: options.confirmed === true,
    label: `program-${transitionMode}`,
    idempotencyKey: options.idempotencyKey || null
  });
  return {
    ...dispatched,
    programSnapshot: {
      state: cloneBroadcastState(dispatched.state),
      contract: cloneValue(model.contract),
      visibility: model.visibility,
      takenAt: now,
      mode: transitionMode
    },
    lastAction: `program-${transitionMode}`,
    lastActionError: null
  };
}

export function clearProductionPreview(model, options = {}) {
  assertModel(model);
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.CLEAR_PREVIEW, {}, {}, {
    now: options.now,
    label: "preview-cleared"
  });
  return {
    ...dispatched,
    currentGraphicInstanceId: null,
    lastAction: "preview-cleared",
    lastActionError: null
  };
}

export function clearProductionProgram(model, options = {}) {
  assertModel(model);
  if (model.safeMode && model.state.program.active && options.confirmed !== true) {
    throw consoleError("console-clear-program-confirmation-required");
  }
  const now = normalizeNow(options.now);
  const force = options.force === true;
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.CLEAR_PROGRAM, {}, { force }, {
    now,
    confirmed: options.confirmed === true,
    confirmations: options.confirmations,
    label: "program-cleared"
  });
  return {
    ...dispatched,
    programSnapshot: null,
    lastAction: "program-cleared",
    lastActionError: null
  };
}

export function restoreLastProductionPreview(model, options = {}) {
  assertModel(model);
  const saved = model.lastPreviewConfig;
  if (!saved) return { ...model, lastAction: "preview-restore-unavailable", lastActionError: "preview-restore-unavailable" };
  let restored = selectProductionGraphic(model, saved.graphicId);
  restored = selectProductionAsset(restored, saved.assetId);
  restored = selectProductionOutput(restored, saved.outputId);
  return prepareProductionPreview(restored, {
    geometry: saved.geometry,
    animation: saved.animation,
    visible: saved.visible
  }, { now: options.now, confirmed: true });
}

export function setProductionLayerAction(model, layerId, action, options = {}) {
  assertModel(model);
  if (!PLAYGROUND_LAYER_IDS.includes(layerId)) throw consoleError("console-layer-not-found", { layerId });
  if (!['select', 'show', 'hide', 'lock', 'unlock'].includes(action)) throw consoleError("console-layer-action-invalid", { action });
  if (action === "select") {
    const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_SELECTION, {}, {
      selection: { ...model.state.selection, layerId },
      model: { layerId }
    }, { now: options.now, label: "layer-selected" });
    return { ...dispatched, geometry: { ...model.geometry, layerId }, lastAction: "layer-selected", lastActionError: null };
  }
  const layer = model.state.layers[layerId];
  const protectedAction = layerId === "emergency" || (layer?.locked && ["hide", "unlock"].includes(action));
  if (protectedAction && options.confirmed !== true) throw consoleError("console-layer-confirmation-required", { layerId, action });
  const actionType = {
    show: ACTION_TYPES.SHOW_LAYER,
    hide: ACTION_TYPES.HIDE_LAYER,
    lock: ACTION_TYPES.LOCK_LAYER,
    unlock: ACTION_TYPES.UNLOCK_LAYER
  }[action];
  return dispatchProductionConsoleAction(model, actionType, { layerId }, {
    force: protectedAction && options.confirmed === true
  }, {
    now: options.now,
    confirmed: options.confirmed === true,
    confirmations: options.confirmations,
    label: `layer-${action}`
  });
}

export function setProductionOutputAction(model, action, options = {}) {
  assertModel(model);
  const outputId = options.outputId || model.selectedOutputId;
  const current = getBroadcastOutput(outputId);
  if (!current) throw consoleError("console-output-not-found", { outputId });
  const now = normalizeNow(options.now);
  let dispatched = model;
  if (action === "offline") {
    dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_OUTPUT_STATUS, { outputId }, { status: "offline" }, { now, label: "output-offline" });
  } else if (action === "stale") {
    dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SEND_HEARTBEAT, { outputId }, { heartbeat: {
      at: new Date(Date.parse(now) - 60000).toISOString(),
      status: "stale",
      sequence: (current.heartbeat.sequence || 0) + 1,
      latency: 4200
    } }, { now, label: "output-stale" });
  } else if (action === "heartbeat" || action === "online") {
    if (action === "online") {
      dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SET_OUTPUT_STATUS, { outputId }, { status: "online" }, { now, label: "output-online" });
    }
    const refreshed = getBroadcastOutput(outputId);
    dispatched = dispatchProductionConsoleAction(dispatched, ACTION_TYPES.SEND_HEARTBEAT, { outputId }, { heartbeat: {
      at: now,
      status: "online",
      sequence: (refreshed.heartbeat.sequence || 0) + 1,
      latency: 28
    } }, { now, label: `output-${action}` });
  } else if (action === "repeated") {
    dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.SEND_HEARTBEAT, { outputId }, { heartbeat: {
        at: now,
        status: "online",
        sequence: current.heartbeat.sequence,
        latency: current.latency ?? 0
      } }, { now, label: "output-repeated", allowFailure: true });
  } else throw consoleError("console-output-action-invalid", { action });
  return dispatched;
}

export function enqueueProductionGraphic(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const graphic = getGraphicDefinition(options.graphicId || model.selectedGraphicId);
  const sequence = model.queueSequence + 1;
  const queueItemId = options.queueItemId || `console-queue-${sequence}`;
  const dispatched = dispatchProductionConsoleAction(model, ACTION_TYPES.ENQUEUE_GRAPHIC, {}, { item: {
    queueItemId,
    type: "graphic",
    graphicId: graphic.graphicId,
    templateId: graphic.graphicId,
    payloadBindings: {
      assetId: options.assetId || model.selectedAssetId,
      visibility: model.visibility
    },
    outputIds: [options.outputId || model.selectedOutputId],
    priority: finiteNumber(options.priority, 50),
    status: "queued",
    queuedAt: now,
    queuedBy: CONSOLE_ACTOR.id,
    expiresAt: options.expiresAt || null,
    duration: options.duration ?? model.animation.duration,
    autoHide: options.autoHide ?? model.animation.autoHide,
    notes: options.notes ?? ""
  } }, { now, label: "queue-enqueued", idempotencyKey: options.idempotencyKey || null });
  return { ...dispatched, queueSequence: sequence, lastAction: "queue-enqueued", lastActionError: null };
}

export function removeProductionQueueItem(model, queueItemId, options = {}) {
  assertModel(model);
  return dispatchProductionConsoleAction(model, ACTION_TYPES.DEQUEUE_GRAPHIC, { queueItemId }, {}, {
    now: options.now,
    label: "queue-dequeued"
  });
}

export function changeProductionQueuePriority(model, queueItemId, delta, options = {}) {
  assertModel(model);
  const item = getBroadcastQueue(model.state).find((entry) => entry.queueItemId === queueItemId);
  if (!item) throw consoleError("console-queue-item-not-found", { queueItemId });
  return dispatchProductionConsoleAction(model, ACTION_TYPES.ENQUEUE_GRAPHIC, {}, {
    replaceQueueItemId: queueItemId,
    item: {
      ...item,
      priority: finiteNumber(item.priority, 0) + finiteNumber(delta, 0),
      queuedAt: item.queuedAt
    }
  }, { now: options.now, label: "queue-priority-changed" });
}

export function clearProductionQueue(model, options = {}) {
  assertModel(model);
  return dispatchProductionConsoleAction(model, ACTION_TYPES.CLEAR_QUEUE, {}, {}, {
    now: options.now,
    confirmed: options.confirmed === true,
    label: "queue-cleared"
  });
}

export function restoreProductionConsole(model, options = {}) {
  assertModel(model);
  let cleared = clearProductionPreview(model, options);
  if (cleared.state.program.active) cleared = clearProductionProgram(cleared, { ...options, confirmed: true, force: true });
  if (getBroadcastQueue(cleared.state).length) cleared = clearProductionQueue(cleared, { ...options, confirmed: true });
  const restored = createProductionConsoleModel({
    fixtureId: model.fixtureId,
    graphicId: model.selectedGraphicId,
    assetId: model.selectedAssetId,
    outputId: model.selectedOutputId,
    visibility: model.visibility,
    safeMode: model.safeMode,
    inspectorTab: model.inspectorTab,
    panelSize: model.panelSize,
    now: options.now
  });
  return {
    ...restored,
    actionSequence: cleared.actionSequence,
    actionHistory: cleared.actionHistory,
    lastAction: "console-restored"
  };
}

export function buildProductionProjection(model, view = "preview", options = {}) {
  assertModel(model);
  const selectedView = view === "program" ? "program" : "preview";
  const outputId = selectedView === "preview" ? PREVIEW_OUTPUT_ID : (options.outputId || model.selectedOutputId);
  const output = getBroadcastOutput(outputId);
  if (!output) throw consoleError("console-output-not-found", { outputId });
  const snapshot = selectedView === "program" ? model.programSnapshot : null;
  const state = snapshot?.state || model.state;
  const contract = snapshot?.contract || model.contract;
  return buildBroadcastOutputProjection(output, state, contract, {
    now: normalizeNow(options.now),
    view: selectedView,
    visibility: normalizeVisibility(options.visibility || model.visibility)
  });
}

export function buildProductionRenderDescriptor(projection, assetRegistry) {
  if (!projection || typeof projection !== "object") throw consoleError("console-projection-required");
  const source = cloneValue(projection);
  const graphics = (source.graphics || []).map((graphic) => {
    const definition = getGraphicDefinition(graphic.templateId);
    const asset = resolveConsoleAsset(graphic, source, assetRegistry);
    return {
      graphicId: graphic.graphicId,
      templateId: graphic.templateId,
      type: definition.type,
      layerId: graphic.layerId,
      position: cloneValue(graphic.position),
      size: cloneValue(graphic.size),
      scale: graphic.scale,
      opacity: graphic.opacity,
      duration: graphic.duration,
      autoHide: graphic.autoHide,
      enterAnimation: normalizeAnimationName(graphic.payloadBindings?.enterAnimation, "fade-in"),
      exitAnimation: normalizeAnimationName(graphic.payloadBindings?.exitAnimation, "fade-out"),
      delay: nonNegativeNumber(graphic.payloadBindings?.delay, 0),
      content: buildGraphicContent(definition, source.contract, graphic.payloadBindings),
      asset: asset.resolved ? {
        assetId: asset.asset.assetId,
        assetFamilyId: asset.asset.assetFamilyId,
        version: asset.asset.version,
        status: asset.asset.status,
        visibility: asset.asset.visibility,
        scope: asset.sourceScope,
        variantId: asset.variant?.variantId || null,
        fallbackUsed: asset.fallbackUsed,
        fallbackReason: asset.fallbackReason
      } : null,
      fallbackUsed: !asset.resolved || asset.fallbackUsed,
      warnings: [...(asset.warnings || [])],
      errors: [...(asset.errors || [])]
    };
  });
  return {
    renderer: "production-console-test-renderer",
    rendererVersion: PRODUCTION_CONSOLE_VERSION,
    active: source.broadcast?.active === true,
    view: source.broadcast?.selectedView || null,
    stateRevision: source.broadcast?.revision ?? 0,
    viewRevision: source.broadcast?.viewRevision ?? 0,
    status: source.broadcast?.status || "inactive",
    output: cloneValue(source.output),
    safeArea: cloneValue(source.output?.safeArea || {}),
    layers: cloneValue(source.layers || []),
    graphics,
    warnings: uniqueStrings([...(source.warnings || []), ...graphics.flatMap((graphic) => graphic.warnings)]),
    errors: uniqueStrings([...(source.errors || []), ...graphics.flatMap((graphic) => graphic.errors)])
  };
}

export function getProductionConsoleInspector(model, options = {}) {
  assertModel(model);
  const visibility = normalizeVisibility(options.visibility || model.visibility);
  const previewProjection = buildProductionProjection(model, "preview", { ...options, visibility });
  const programProjection = buildProductionProjection(model, "program", { ...options, visibility });
  const selectedOutput = getBroadcastOutput(model.selectedOutputId);
  const publicView = visibility === "public";
  const assets = listBroadcastAssets(model.assetRegistry)
    .filter((asset) => !publicView || asset.visibility === "public")
    .map((asset) => publicView ? publicAssetDescriptor(asset) : asset);
  const variables = buildConsoleVariablesInspector(model, visibility, options);
  const components = buildConsoleComponentsInspector(model, visibility, options);
  const templates = buildConsoleTemplatesInspector(model, visibility, options);
  const themes = buildConsoleThemesInspector(model, visibility, options);
  const warnings = uniqueStrings([
    ...getBroadcastStateWarnings(model.state),
    ...getBroadcastOutputWarnings(selectedOutput),
    ...(previewProjection.warnings || []),
    ...(programProjection.warnings || []),
    ...(variables.warnings || []),
    ...(components.warnings || []),
    ...(templates.warnings || []),
    ...(themes.warnings || []),
    ...(model.outputRoutingWarnings || []),
    ...(model.outputSynchronizationWarnings || [])
  ]);
  const errors = uniqueStrings([
    ...(model.state.errors || []),
    ...(selectedOutput?.errors || []),
    ...(previewProjection.errors || []),
    ...(programProjection.errors || []),
    ...(model.lastActionError ? [model.lastActionError] : []),
    ...(variables.errors || []),
    ...(components.errors || []),
    ...(templates.errors || []),
    ...(themes.errors || []),
    ...(model.outputRoutingErrors || []),
    ...(model.outputSynchronizationErrors || [])
  ]);
  const inspector = {
    contract: cloneValue(model.contract),
    state: publicView ? publicStateDescriptor(model.state) : cloneBroadcastState(model.state),
    preview: cloneValue(model.state.preview),
    program: cloneValue(model.state.program),
    output: publicView ? publicOutputDescriptor(selectedOutput) : cloneValue(selectedOutput),
    projection: { preview: previewProjection, program: programProjection },
    assets,
    variables,
    components,
    templates,
    themes,
    outputRouting: {
      version: OUTPUT_ROUTING_VERSION,
      state: model.outputRoutingState,
      routes: cloneValue(model.outputRoutingRoutes || []),
      results: publicView ? {} : cloneValue(model.outputRoutingResults || {}),
      snapshot: cloneValue(model.outputRoutingSnapshot),
      warnings: cloneValue(model.outputRoutingWarnings || []),
      errors: cloneValue(model.outputRoutingErrors || [])
    },
    outputSynchronization: {
      version: OUTPUT_SYNCHRONIZATION_VERSION,
      state: model.outputSynchronizationState,
      snapshot: cloneValue(model.outputSynchronizationSnapshot),
      warnings: cloneValue(model.outputSynchronizationWarnings || []),
      errors: cloneValue(model.outputSynchronizationErrors || [])
    },
    queue: getBroadcastQueue(model.state),
    actions: cloneValue(model.actionHistory || []),
    warnings: publicView ? [] : warnings,
    errors: publicView ? [] : errors,
    versions: {
      application: model.appVersion,
      console: PRODUCTION_CONSOLE_VERSION,
      dataContract: BROADCAST_DATA_CONTRACT_VERSION,
      broadcastState: BROADCAST_STATE_VERSION,
      broadcastOutput: BROADCAST_OUTPUT_VERSION,
      outputRouting: OUTPUT_ROUTING_VERSION,
      outputSynchronization: OUTPUT_SYNCHRONIZATION_VERSION,
      assetManager: ASSET_MANAGER_VERSION,
      actionEngine: BROADCAST_ACTION_ENGINE_VERSION,
      productionVariables: PRODUCTION_VARIABLES_VERSION,
      componentLibrary: COMPONENT_LIBRARY_VERSION,
      componentRenderer: COMPONENT_RENDERER_VERSION,
      templateEngine: TEMPLATE_ENGINE_VERSION,
      templateRendererIntegration: TEMPLATE_RENDERER_INTEGRATION_VERSION,
      themeEngine: THEME_ENGINE_VERSION,
      previewEngine: PREVIEW_ENGINE_VERSION,
      programEngine: PROGRAM_ENGINE_VERSION
    }
  };
  const sanitized = sanitizeProductionConsoleInspectorData(inspector, visibility, {
    preserveRootKeys: ["warnings", "errors"]
  });
  if (sanitized.templates && templates) {
    sanitized.templates.snapshot = cloneValue(templates.snapshot);
    sanitized.templates.clipboardSnapshot = cloneValue(templates.clipboardSnapshot);
  }
  if (sanitized.themes && themes) {
    sanitized.themes.snapshot = cloneValue(themes.snapshot);
    sanitized.themes.clipboardSnapshot = cloneValue(themes.clipboardSnapshot);
  }
  return sanitized;
}

export function sanitizeProductionConsoleInspectorData(value, visibility = "production", options = {}) {
  const selectedVisibility = normalizeVisibility(visibility);
  const preserveRootKeys = new Set(Array.isArray(options.preserveRootKeys) ? options.preserveRootKeys : []);
  const maxDepth = positiveInteger(options.maxDepth, INSPECTOR_MAX_DEPTH);
  const maxArrayItems = positiveInteger(options.maxArrayItems, INSPECTOR_MAX_ARRAY_ITEMS);
  const ancestors = new WeakSet();

  const visit = (current, path, depth) => {
    if (current === null) return null;
    if (["string", "number", "boolean"].includes(typeof current)) {
      if (typeof current === "number" && !Number.isFinite(current)) return undefined;
      if (typeof current === "string" && isUnsafeInspectorReference(current)) return undefined;
      return current;
    }
    if (["undefined", "function", "symbol", "bigint"].includes(typeof current)) return undefined;
    if (depth > maxDepth || typeof current !== "object") return undefined;
    if (ancestors.has(current)) return undefined;
    ancestors.add(current);

    if (Array.isArray(current)) {
      const result = [];
      current.slice(0, maxArrayItems).forEach((item, index) => {
        const sanitized = visit(item, [...path, String(index)], depth + 1);
        if (sanitized !== undefined) result.push(sanitized);
      });
      ancestors.delete(current);
      return result;
    }

    const result = {};
    Object.entries(current).forEach(([key, item]) => {
      if (INSPECTOR_DANGEROUS_KEYS.has(key)) return;
      const normalizedKey = normalizeInspectorFieldName(key);
      const rootPreserved = path.length === 0 && preserveRootKeys.has(key);
      if (!rootPreserved && shouldRemoveInspectorField(normalizedKey, selectedVisibility)) return;
      const sanitized = visit(item, [...path, key], depth + 1);
      if (sanitized !== undefined) result[key] = sanitized;
    });
    ancestors.delete(current);
    return result;
  };

  return visit(value, [], 0);
}

export function getProductionSystemStatus(model, options = {}) {
  const inspector = getProductionConsoleInspector(model, options);
  const selectedOutput = getBroadcastOutput(model.selectedOutputId);
  const contextStale = model.state.contextRef?.freshness === "stale";
  const outputStale = selectedOutput?.status === "stale";
  const disconnected = selectedOutput?.status === "offline";
  const level = inspector.errors.length ? "error" : disconnected ? "disconnected" : (contextStale || outputStale || inspector.warnings.length) ? "warning" : "ok";
  return {
    level,
    label: level === "ok" ? "Correcto" : level === "error" ? "Error" : level === "disconnected" ? "Desconectado" : "Advertencia",
    stateRevision: model.state.revision,
    previewRevision: model.state.preview.revision,
    programRevision: model.state.program.revision,
    outputRevision: selectedOutput?.lastAppliedRevision ?? 0,
    contextStale,
    outputStale,
    previewActive: model.state.preview.active,
    programActive: model.state.program.active,
    safeMode: model.safeMode,
    warnings: inspector.warnings,
    errors: inspector.errors
  };
}

export function validateProductionConsoleModel(model) {
  if (!model || typeof model !== "object") return { valid: false, errors: ["console-model-invalid"], warnings: [] };
  const state = validateBroadcastState(model.state);
  const contract = validateBroadcastDataContract(model.contract);
  const outputs = model.outputIds.map((id) => validateBroadcastOutput(getBroadcastOutput(id)));
  const assets = listBroadcastAssets(model.assetRegistry, { allVersions: true }).map((asset) => validateBroadcastAsset(asset));
  const variables = listProductionVariables(model.variableRegistry).map((variable) => validateProductionVariable(variable));
  const components = listBroadcastComponents(model.componentRegistry).map((component) => validateBroadcastComponent(component));
  const themes = listBroadcastThemes(model.themeRegistry).map((theme) => validateBroadcastTheme(theme));
  const templateRenderer = model.templateRendererSnapshot
    ? validateTemplateRenderSnapshot(model.templateRendererSnapshot)
    : { valid: true, errors: [], warnings: [] };
  const themeTemplate = model.themeTemplateSnapshot
    ? validateThemeTemplateSnapshot(model.themeTemplateSnapshot)
    : { valid: true, errors: [], warnings: [] };
  const officialProgram = model.officialProgram
    ? validateProgram(model.officialProgram)
    : { valid: true, errors: [], warnings: [] };
  const outputRouting = model.outputRoutingSnapshot
    ? validateOutputRoutingSnapshot(model.outputRoutingSnapshot)
    : { valid: true, errors: [], warnings: [] };
  const outputSynchronization = model.outputSynchronizationSnapshot
    ? validateOutputSynchronizationSnapshot(model.outputSynchronizationSnapshot)
    : { valid: true, errors: [], warnings: [] };
  const errors = uniqueStrings([
    ...state.errors,
    ...contract.errors,
    ...outputs.flatMap((item) => item.errors),
    ...assets.flatMap((item) => item.errors),
    ...variables.flatMap((item) => item.errors),
    ...components.flatMap((item) => item.errors),
    ...themes.flatMap((item) => item.errors),
    ...templateRenderer.errors,
    ...themeTemplate.errors,
    ...officialProgram.errors,
    ...outputRouting.errors,
    ...outputSynchronization.errors
  ]);
  return {
    valid: errors.length === 0,
    errors,
    warnings: uniqueStrings([
      ...state.warnings,
      ...contract.warnings,
      ...outputs.flatMap((item) => item.warnings),
      ...assets.flatMap((item) => item.warnings),
      ...variables.flatMap((item) => item.warnings),
      ...components.flatMap((item) => item.warnings),
      ...themes.flatMap((item) => item.warnings),
      ...templateRenderer.warnings,
      ...themeTemplate.warnings,
      ...officialProgram.warnings,
      ...outputRouting.warnings,
      ...outputSynchronization.warnings
    ])
  };
}

export function escapeProductionConsoleText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function initializeProductionConsole(root = document) {
  if (!root?.querySelector || !root.querySelector("#production-console")) return null;
  const currentInstance = PRODUCTION_CONSOLE_INSTANCES.get(root);
  if (currentInstance && !currentInstance.disposed) return currentInstance.api;
  const settings = readSessionSettings();
  let model = createProductionConsoleModel({ ...settings, safeMode: true });
  const refs = collectRefs(root);
  const controller = new AbortController();
  const runtime = {
    componentRenderer: null,
    templateRendererIntegration: null,
    themeTemplateIntegration: null,
    officialPreviewEngine: null,
    officialPreviewPreparationStore: { preparation: null },
    officialProgramEngine: null,
    officialProgramVisualRoot: null,
    outputRoutingEngine: null,
    outputSynchronization: null,
    synchronizedProgramMainOutput: null,
    synchronizedAnnouncerMonitor: null,
    controller
  };
  runtime.officialProgramEngine = createProductionConsoleOfficialProgramEngine(model);
  runtime.outputRoutingEngine = createProductionConsoleOutputRoutingEngine(model);
  model = syncProductionConsoleOutputRoutingModel(model, runtime.outputRoutingEngine);
  model = setupProductionConsoleOutputSynchronization(model, runtime, refs);
  populateStaticControls(refs, model);
  if (refs.componentRendererTarget) {
    runtime.componentRenderer = createProductionConsoleComponentRenderer(model, refs.componentRendererTarget);
    model = { ...model, componentRendererState: runtime.componentRenderer.state };
  }
  if (refs.templateRendererTarget) {
    runtime.templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, refs.templateRendererTarget);
    runtime.themeTemplateIntegration = createProductionConsoleThemeTemplateIntegration(model, runtime.templateRendererIntegration);
    runtime.officialPreviewEngine = createProductionConsoleOfficialPreviewEngine(
      model,
      runtime.themeTemplateIntegration,
      runtime.officialPreviewPreparationStore
    );
    model = {
      ...model,
      templateRendererState: runtime.templateRendererIntegration.state,
      themeTemplateState: runtime.themeTemplateIntegration.state,
      officialPreviewState: getPreviewState(runtime.officialPreviewEngine),
      officialProgramState: getProgramState(runtime.officialProgramEngine)
    };
  }
  const update = (nextModel) => {
    model = nextModel;
    writeSessionSettings(model);
    renderConsole(refs, model, runtime);
  };
  bindConsoleEvents(refs, () => model, update, runtime, controller.signal);
  renderConsole(refs, model, runtime);
  console.info("[production-console] initialized", {
    version: PRODUCTION_CONSOLE_VERSION,
    appVersion: PRODUCTION_CONSOLE_APP_VERSION
  });
  const instance = { disposed: false, api: null };
  const api = {
    getModel: () => model,
    dispose: () => {
      if (instance.disposed) return;
      instance.disposed = true;
      controller.abort();
      if (runtime.componentRenderer && runtime.componentRenderer.state !== "destroyed") destroyComponentRenderer(runtime.componentRenderer);
      if (runtime.officialPreviewEngine && !isOfficialPreviewEngineDestroyed(runtime.officialPreviewEngine)) {
        destroyPreviewEngine(runtime.officialPreviewEngine);
      }
      if (runtime.officialProgramEngine && !isProgramDestroyed(runtime.officialProgramEngine)) {
        destroyProgramEngine(runtime.officialProgramEngine);
      }
      if (runtime.outputRoutingEngine && runtime.outputRoutingEngine.state !== "destroyed") {
        destroyOutputRoutingEngine(runtime.outputRoutingEngine);
      }
      disposeProductionConsoleOutputSynchronization(runtime);
      if (runtime.themeTemplateIntegration && runtime.themeTemplateIntegration.state !== "destroyed") {
        destroyThemeTemplateIntegration(runtime.themeTemplateIntegration);
      }
      if (runtime.templateRendererIntegration && runtime.templateRendererIntegration.state !== "destroyed") {
        destroyTemplateRendererIntegration(runtime.templateRendererIntegration);
      }
      disposeProductionConsole(model);
      PRODUCTION_CONSOLE_INSTANCES.delete(root);
    }
  };
  instance.api = api;
  PRODUCTION_CONSOLE_INSTANCES.set(root, instance);
  return api;
}

function recreateProductionConsoleTemplateRendererRuntime(model, runtime, refs) {
  if (runtime.officialPreviewEngine && !isOfficialPreviewEngineDestroyed(runtime.officialPreviewEngine)) {
    destroyPreviewEngine(runtime.officialPreviewEngine);
  }
  runtime.officialPreviewEngine = null;
  runtime.officialPreviewPreparationStore.preparation = null;
  if (runtime.themeTemplateIntegration && runtime.themeTemplateIntegration.state !== "destroyed") {
    destroyThemeTemplateIntegration(runtime.themeTemplateIntegration);
  }
  runtime.themeTemplateIntegration = null;
  if (runtime.templateRendererIntegration && runtime.templateRendererIntegration.state !== "destroyed") {
    destroyTemplateRendererIntegration(runtime.templateRendererIntegration);
  }
  runtime.templateRendererIntegration = null;
  if (refs.templateRendererTarget) {
    runtime.templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, refs.templateRendererTarget);
    runtime.themeTemplateIntegration = createProductionConsoleThemeTemplateIntegration(model, runtime.templateRendererIntegration);
    runtime.officialPreviewEngine = createProductionConsoleOfficialPreviewEngine(
      model,
      runtime.themeTemplateIntegration,
      runtime.officialPreviewPreparationStore
    );
  }
  return {
    ...model,
    ...emptyTemplateRendererRuntimeState(),
    templateRendererState: runtime.templateRendererIntegration?.state || "uninitialized",
    themeTemplateState: runtime.themeTemplateIntegration?.state || "uninitialized",
    officialPreviewState: runtime.officialPreviewEngine ? getPreviewState(runtime.officialPreviewEngine) : "uninitialized",
    officialPreview: null,
    officialPreviewSnapshot: null,
    officialPreviewWarnings: [],
    officialPreviewErrors: []
  };
}

function ensureProductionConsoleTemplateRendererRuntime(model, runtime, refs) {
  if (!runtime.templateRendererIntegration || runtime.templateRendererIntegration.state === "destroyed") {
    runtime.templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, refs.templateRendererTarget);
  }
  if (!runtime.themeTemplateIntegration || runtime.themeTemplateIntegration.state === "destroyed") {
    runtime.themeTemplateIntegration = createProductionConsoleThemeTemplateIntegration(model, runtime.templateRendererIntegration);
  }
  if (!runtime.officialPreviewEngine || isOfficialPreviewEngineDestroyed(runtime.officialPreviewEngine)) {
    runtime.officialPreviewPreparationStore.preparation = null;
    runtime.officialPreviewEngine = createProductionConsoleOfficialPreviewEngine(
      model,
      runtime.themeTemplateIntegration,
      runtime.officialPreviewPreparationStore
    );
  }
  return runtime.templateRendererIntegration;
}

function ensureProductionConsoleThemeTemplateRuntime(model, runtime, refs) {
  ensureProductionConsoleTemplateRendererRuntime(model, runtime, refs);
  return runtime.themeTemplateIntegration;
}

function isOfficialPreviewEngineDestroyed(engine) {
  return !engine || engine.state === "destroyed";
}

function registerConsoleOutputs(now) {
  return CONSOLE_OUTPUT_DEFINITIONS.map((definition) => {
    let output = registerBroadcastOutput({
      id: definition.id,
      name: definition.name,
      type: definition.type,
      status: "offline",
      enabled: true,
      visibility: "restricted",
      resolution: definition.resolution,
      safeArea: definition.safeArea,
      assignedLayers: [...PLAYGROUND_LAYER_IDS],
      themeId: "charropro_gold",
      heartbeat: { at: null, status: "unknown", sequence: 0, source: "production-console" },
      staleAfterMs: 15000,
      lastAppliedRevision: 0,
      latency: null,
      projection: { enabled: true, view: definition.projectionView, visibility: "restricted" },
      capabilities: {
        heartbeat: true,
        interaction: true,
        multiLayer: true,
        dynamicResize: true,
        animation: true,
        supportsPreview: true,
        supportsProgram: true
      },
      tenantId: "tenant_console_fixture",
      organizationId: "organizacion_playground",
      tournamentId: "torneo_playground",
      competitionId: "equipos_completo",
      sessionId: "session_production_console"
    }, { now, actor: CONSOLE_ACTOR });
    return output;
  });
}

function registerConsoleAssets(now) {
  return PLAYGROUND_ASSET_DEFINITIONS.reduce((registry, definition) => registerBroadcastAsset(registry, definition, {
    now,
    actor: CONSOLE_ACTOR,
    requireOriginalVariant: true
  }), {});
}

function registerConsoleThemes(now) {
  const baseDefinition = buildConsoleBaseThemeDefinition();
  return PRODUCTION_CONSOLE_THEME_DEFINITIONS.reduce((registry, definition) => {
    const shouldActivate = definition.status === "active";
    let next = createBroadcastTheme(registry, {
      ...(definition.id === "theme_default" ? baseDefinition : {}),
      ...cloneValue(definition),
      status: "draft",
      scope: "global",
      colors: {
        ...(definition.id === "theme_default" ? baseDefinition.colors : {}),
        ...(definition.colors || {})
      },
      metadata: {
        ...(definition.id === "theme_default" ? baseDefinition.metadata : {}),
        ...(definition.metadata || {})
      }
    }, {
      actor: CONSOLE_SETUP_ACTOR,
      expectedRegistryRevision: registry.revision,
      now
    });
    const draft = getBroadcastTheme(next, definition.id);
    next = publishBroadcastTheme(next, definition.id, {
      actor: CONSOLE_SETUP_ACTOR,
      expectedRegistryRevision: next.revision,
      expectedRevision: draft.revision,
      now
    });
    if (!shouldActivate) return next;
    const published = getBroadcastTheme(next, definition.id);
    return activateBroadcastTheme(next, definition.id, {
      actor: CONSOLE_SETUP_ACTOR,
      expectedRegistryRevision: next.revision,
      expectedRevision: published.revision,
      now
    });
  }, {
    themeEngineVersion: THEME_ENGINE_VERSION,
    revision: 0,
    activeThemeId: null,
    activeThemes: {},
    themes: {},
    createdAt: now,
    updatedAt: now
  });
}

function buildConsoleBaseThemeDefinition() {
  return {
    colors: {
      primary: "#17191D",
      secondary: "#2A2E35",
      accent: "#C79A3B",
      success: "#2FA36B",
      warning: "#E0A43A",
      danger: "#CF4B4B",
      neutral: "#8B929E",
      background: "#0D0F12",
      surface: "#191C21",
      textPrimary: "#F5F7FA",
      textSecondary: "#B7BDC7",
      border: "#3B414A",
      highlight: "#E9C66B",
      overlay: "#090A0CCC",
      transparent: "transparent"
    },
    typography: {
      display: { family: "Arial", weight: 800, size: 72, lineHeight: 1.05, tracking: 0, uppercase: false, fallbacks: ["sans-serif"] },
      heading: { family: "Arial", weight: 700, size: 42, lineHeight: 1.1, tracking: 0, uppercase: false, fallbacks: ["sans-serif"] },
      body: { family: "Arial", weight: 400, size: 28, lineHeight: 1.35, tracking: 0, uppercase: false, fallbacks: ["sans-serif"] },
      score: { family: "Arial", weight: 800, size: 88, lineHeight: 1, tracking: 0, uppercase: false, fallbacks: ["sans-serif"] },
      label: { family: "Arial", weight: 700, size: 20, lineHeight: 1.2, tracking: 1, uppercase: true, fallbacks: ["sans-serif"] }
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
    radius: { none: 0, sm: 2, md: 4, lg: 8 },
    borders: {
      subtle: { width: 1, radius: 4, style: "solid", color: "#3B414A" },
      emphasis: { width: 2, radius: 4, style: "solid", color: "#C79A3B" }
    },
    shadows: {
      panel: { x: 0, y: 8, blur: 24, opacity: 0.35, color: "#000000" },
      text: { x: 0, y: 2, blur: 4, opacity: 0.5, color: "#000000" }
    },
    logos: {
      organization: { assetId: "asset-organization-logo", variantId: "original", version: "1.0.0", position: "top-left", scale: 1, visibility: "public" },
      tournament: { assetId: "asset-tournament-logo", variantId: "original", version: "1.0.0", position: "top-right", scale: 1, visibility: "public" },
      sponsor: { assetId: "asset-sponsor", variantId: "original", version: "1.0.0", position: "bottom-right", scale: 1, visibility: "public" }
    },
    backgrounds: {
      program: { type: "solid", color: "#0D0F12" },
      panel: { type: "solid", color: "#191C21" },
      emphasis: {
        type: "gradient",
        angle: 90,
        stops: [{ color: "#17191D", position: 0 }, { color: "#2A2E35", position: 1 }]
      },
      transparent: { type: "transparent" }
    },
    icons: {
      watermark: { assetId: "asset-watermark", variantId: "original", version: "1.0.0", position: "center", scale: 1, visibility: "public" }
    },
    watermarks: {
      primary: {
        asset: { assetId: "asset-watermark", variantId: "original", version: "1.0.0", position: "bottom-right", scale: 1, visibility: "public" },
        opacity: 0.18,
        position: "bottom-right",
        scale: 0.7,
        safeArea: { top: 0, right: 48, bottom: 36, left: 0 }
      }
    },
    safeArea: { top: 54, right: 96, bottom: 54, left: 96 },
    defaults: { outputRole: "program", backgroundToken: "program", logoToken: "tournament", watermarkToken: "primary" },
    metadata: { source: "production-console", preset: true, allowTenantInheritance: true, brandingStatus: "neutral" }
  };
}

function registerConsoleVariables(contract, outputIds, now, sourceTenantId = null) {
  const tenantId = sourceTenantId || contract.tenant?.id || "tenant_console_fixture";
  const organizationId = contract.organization?.id || "organizacion_playground";
  const tournamentId = contract.tournament?.id || "torneo_playground";
  const base = {
    variablesVersion: PRODUCTION_VARIABLES_VERSION,
    revision: 0,
    tenantId,
    variables: {},
    createdAt: now,
    updatedAt: now
  };
  return PRODUCTION_VARIABLE_DEFINITIONS.reduce((registry, definition) => registerProductionVariable(registry, {
    ...definition,
    tenantId,
    organizationId,
    tournamentId,
    outputId: definition.scope === "output" ? (outputIds.includes(DEFAULT_OUTPUT_ID) ? DEFAULT_OUTPUT_ID : outputIds[0]) : null
  }, {
    actor: CONSOLE_SETUP_ACTOR,
    expectedRevision: registry.revision,
    now
  }), base);
}

function emptyComponentRegistry(now) {
  return {
    libraryVersion: COMPONENT_LIBRARY_VERSION,
    revision: 0,
    components: {},
    createdAt: now,
    updatedAt: now
  };
}

function cleanupConsoleOutputs() {
  consoleOutputIds().forEach((id) => removeBroadcastOutput(id));
}

function consoleOutputIds() {
  return CONSOLE_OUTPUT_DEFINITIONS.map((definition) => definition.id);
}

function getFixtureDefinition(fixtureId) {
  return PRODUCTION_CONSOLE_FIXTURES.find((fixture) => fixture.id === fixtureId) || PRODUCTION_CONSOLE_FIXTURES[0];
}

function getGraphicDefinition(graphicId) {
  return PRODUCTION_CONSOLE_GRAPHICS[graphicId] || PRODUCTION_CONSOLE_GRAPHICS[DEFAULT_GRAPHIC_ID];
}

function assetExists(registry, assetId) {
  return typeof assetId === "string" && listBroadcastAssets(registry).some((asset) => asset.assetId === assetId);
}

function contextRefFromContract(contract) {
  return {
    contractVersion: contract.contractVersion,
    contractRevision: contract.revision,
    generatedAt: contract.generatedAt,
    freshness: contract.source?.freshness || "current",
    tournamentId: contract.tournament?.id || null,
    competitionId: contract.competition?.id || null,
    charreadaId: contract.charreada?.id || null,
    participantId: contract.participant?.id || null,
    teamId: contract.team?.id || null,
    suerteId: contract.suerte?.id || null,
    sourceType: "broadcastDataContract"
  };
}

function stampFixtureSource(source, now) {
  const stamped = cloneValue(source);
  stamped.generatedAt = now;
  if (stamped.score) stamped.score.timestamp = now;
  if (stamped.timer) stamped.timer.updatedAt = now;
  if (stamped.production) stamped.production.updatedAt = now;
  return stamped;
}

function geometryFromGraphic(graphic) {
  return normalizeGeometry({
    position: graphic.defaultPosition,
    size: graphic.defaultSize,
    scale: graphic.defaultScale,
    opacity: graphic.defaultOpacity,
    layerId: graphic.layerId
  });
}

function normalizeGeometry(value = {}) {
  const position = value.position || {};
  const size = value.size || {};
  return {
    position: {
      x: finiteNumber(position.x, 0.5),
      y: finiteNumber(position.y, 0.5),
      anchor: ANCHORS.includes(position.anchor) ? position.anchor : "center",
      unit: POSITION_UNITS.includes(position.unit) ? position.unit : "normalized"
    },
    size: {
      width: positiveNumber(size.width, 0.6),
      height: positiveNumber(size.height, 0.2),
      unit: POSITION_UNITS.includes(size.unit) ? size.unit : (POSITION_UNITS.includes(position.unit) ? position.unit : "normalized")
    },
    scale: positiveNumber(value.scale, 1),
    opacity: boundedNumber(value.opacity, 0, 1, 1),
    layerId: PLAYGROUND_LAYER_IDS.includes(value.layerId) ? value.layerId : "scoreboard"
  };
}

function normalizeAnimation(value = {}) {
  return {
    enter: normalizeAnimationName(value.enter, "fade-in"),
    exit: normalizeAnimationName(value.exit, "fade-out"),
    duration: boundedNumber(value.duration, 0, 10000, 350),
    delay: boundedNumber(value.delay, 0, 10000, 0),
    autoHide: value.autoHide === true
  };
}

function normalizeAnimationName(value, fallback) {
  return ANIMATIONS.includes(value) ? value : fallback;
}

function resolveConsoleAsset(graphic, projection, assetRegistry) {
  const assetId = graphic.payloadBindings?.assetId;
  if (!assetId) return { resolved: false, asset: null, variant: null, sourceScope: null, fallbackUsed: false, fallbackReason: null, warnings: [], errors: [] };
  return resolveBroadcastAsset(assetRegistry || {}, {
    assetId,
    version: "1.0.0",
    variantId: graphic.payloadBindings?.variantId,
    variantRequired: false,
    outputType: projection.output?.type,
    visibility: projection.visibility
  }, {
    tenantId: "tenant_playground",
    organizationId: "organizacion_playground",
    tournamentId: "torneo_playground",
    competitionId: projection.contract?.competition?.id,
    outputId: projection.output?.id,
    visibility: projection.visibility,
    broadcastUse: true,
    commercialUse: true,
    publicDisplay: projection.visibility === "public"
  });
}

function buildGraphicContent(definition, contract, payload = {}) {
  const fallback = definition.fallback || "Información no disponible";
  if (["scoreboard", "ranking"].includes(definition.type)) {
    const rows = getBroadcastField(contract, "ranking.entries", []);
    return {
      kind: "ranking",
      title: getBroadcastField(contract, "competition.name", fallback),
      rows: Array.isArray(rows) ? rows.slice(0, definition.type === "scoreboard" ? 4 : 8).map((row) => ({
        position: row.position,
        name: row.name || fallback,
        total: row.total
      })) : []
    };
  }
  if (definition.type === "turn") {
    const scope = getBroadcastField(contract, "competition.scope", "team");
    return {
      kind: "turn",
      title: "En turno",
      name: scope === "individual" ? getBroadcastField(contract, "participant.name", fallback) : getBroadcastField(contract, "team.name", fallback),
      detail: getBroadcastField(contract, "suerte.name", fallback)
    };
  }
  if (definition.type === "score") return { kind: "score", title: getBroadcastField(contract, "suerte.name", "Calificación"), value: getBroadcastField(contract, "score.total", null) };
  if (definition.type === "timer") return { kind: "timer", title: getBroadcastField(contract, "timer.running", false) ? "Tiempo activo" : "Tiempo", value: getBroadcastField(contract, "timer.display", fallback) };
  if (definition.type === "cala_detail") {
    const detail = getBroadcastField(contract, "scoreDetail", null);
    const cala = detail?.cala && typeof detail.cala === "object" ? detail.cala : {};
    return {
      kind: "details",
      title: "Detalle de Cala",
      rows: Object.entries(cala).slice(0, 8).map(([label, value]) => ({ label, value })),
      total: getBroadcastField(contract, "score.total", null),
      fallback: Object.keys(cala).length ? null : fallback
    };
  }
  if (definition.type === "sponsor") return { kind: "sponsor", title: getBroadcastField(contract, "sponsor.active.name", fallback), detail: getBroadcastField(contract, "sponsor.active.campaign", "") };
  return { kind: "message", title: String(payload.message ?? fallback) };
}

function filterTemplateInstances(instances, visibleGraphicIds) {
  const visible = new Set(visibleGraphicIds);
  return Object.entries(instances || {}).reduce((result, [id, instance]) => {
    if (visible.has(instance?.graphicId || id)) result[id] = instance;
    return result;
  }, {});
}

function buildConsoleVariablesInspector(model, visibility, options = {}) {
  const context = {
    tenantId: model.variableRegistry?.tenantId || null,
    organizationId: model.contract.organization?.id || null,
    clientId: model.contract.client?.id || null,
    tournamentId: model.contract.tournament?.id || null,
    competitionId: model.contract.competition?.id || null,
    charreadaId: model.contract.charreada?.id || null,
    outputId: model.selectedOutputId,
    userId: CONSOLE_ACTOR.id,
    sessionId: model.state.session?.id || CONSOLE_ACTOR.sessionId,
    visibility,
    actor: CONSOLE_ACTOR,
    contract: model.contract,
    now: options.now
  };
  const rank = VISIBILITY_RANK[visibility] ?? VISIBILITY_RANK.production;
  const visibleVariables = listProductionVariables(model.variableRegistry)
    .filter((variable) => (VISIBILITY_RANK[variable.visibility] ?? VISIBILITY_RANK.restricted) <= rank);
  const visibleKeys = new Set(visibleVariables.map((variable) => variable.key));
  const definitions = visibleVariables.map((variable) => visibility === "public" ? publicVariableDescriptor(variable) : variable);
  const resolved = resolveProductionVariables(model.variableRegistry, context, {
    visibility,
    contract: model.contract,
    now: options.now
  });
  const snapshot = buildProductionVariablesSnapshot(model.variableRegistry, context, {
    visibility,
    contract: model.contract,
    now: options.now
  });
  const resolvedEntries = resolved.entries.filter((entry) => visibleKeys.has(entry.key));
  return {
    registry: {
      variablesVersion: PRODUCTION_VARIABLES_VERSION,
      revision: model.variableRegistry?.revision ?? 0,
      variables: definitions
    },
    resolved: resolvedEntries,
    snapshot,
    warnings: uniqueStrings([...resolvedEntries.flatMap((entry) => entry.warnings || []), ...(snapshot.warnings || [])]),
    errors: uniqueStrings([...resolvedEntries.flatMap((entry) => entry.errors || []), ...(snapshot.errors || [])])
  };
}

function buildConsoleComponentsInspector(model, visibility, options = {}) {
  const rank = VISIBILITY_RANK[visibility] ?? VISIBILITY_RANK.production;
  const components = listBroadcastComponents(model.componentRegistry)
    .filter((component) => (VISIBILITY_RANK[component.visibility] ?? VISIBILITY_RANK.restricted) <= rank);
  const visibleIds = new Set(components.map((component) => component.componentId));
  const selectedComponentId = visibleIds.has(model.selectedComponentId) ? model.selectedComponentId : components[0]?.componentId || null;
  const selected = selectedComponentId ? findBroadcastComponent(model.componentRegistry, selectedComponentId) : null;
  const variables = buildConsoleVariablesInspector(model, visibility, options);
  const snapshot = selected ? buildComponentSnapshot(selected, {
    productionVariables: variables.snapshot,
    broadcastContract: model.contract,
    assetManager: listBroadcastAssets(model.assetRegistry)
  }, {
    visibility,
    now: options.now
  }) : null;
  const validations = components.map((component) => validateBroadcastComponent(component));
  return {
    version: COMPONENT_LIBRARY_VERSION,
    renderer: {
      version: COMPONENT_RENDERER_VERSION,
      state: model.componentRendererState,
      fixtureType: model.componentRendererFixtureType,
      output: getComponentRendererOutput(model.componentRendererOutputId),
      result: cloneValue(model.componentRendererResult),
      snapshot: cloneValue(model.componentRendererSnapshot),
      warnings: cloneValue(model.componentRendererWarnings || []),
      errors: cloneValue(model.componentRendererErrors || [])
    },
    registry: {
      libraryVersion: COMPONENT_LIBRARY_VERSION,
      revision: model.componentRegistry?.revision ?? 0,
      components
    },
    selectedComponentId,
    selected,
    snapshot,
    warnings: uniqueStrings([
      ...validations.flatMap((validation) => validation.warnings || []),
      ...(snapshot?.warnings || []),
      ...(model.componentRendererWarnings || [])
    ]),
    errors: uniqueStrings([
      ...validations.flatMap((validation) => validation.errors || []),
      ...(snapshot?.errors || []),
      ...(model.componentRendererErrors || [])
    ])
  };
}

function buildProductionConsoleTemplateSources(model, options = {}) {
  const variables = buildConsoleVariablesInspector(model, model.visibility, options);
  return {
    productionVariables: variables.snapshot,
    broadcastContract: model.contract,
    assetManager: model.assetRegistry
  };
}

function buildProductionConsoleTemplateFixture(model, options = {}) {
  const fixture = buildTemplateEngineFixture(model.templateFixtureType, options);
  const context = getFixtureDefinition(model.templateRendererContextId || model.fixtureId);
  const source = buildPlaygroundFixture(context.competitionType, context.countOption);
  if (model.templateFixtureType === "roster") {
    return withConsoleTemplateComponentProperties(fixture, {
      items: (source.team?.members || []).map((member) => member?.name || member?.id || "").filter(Boolean)
    });
  }
  if (model.templateFixtureType === "ticker") {
    return withConsoleTemplateComponentProperties(fixture, { items: ["CharroPro"] });
  }
  if (model.templateFixtureType === "standings") {
    return withConsoleTemplateComponentProperties(fixture, {
      rows: (source.ranking?.entries || []).map((entry) => [entry.position, entry.name, entry.total])
    });
  }
  if (model.templateFixtureType !== "scoreboard") return fixture;
  if (context.competitionType !== "equipos_completo" || !["three", "four"].includes(context.countOption)) return fixture;
  const count = context.countOption === "four" ? 4 : 3;
  const rankingFixture = buildTemplateEngineFixture("ranking", options);
  const ranking = cloneValue(rankingFixture.template.components[0]);
  ranking.instanceId = `template_instance_scoreboard_${options.variant || 1}_teams`;
  ranking.layout = { ...ranking.layout, x: 0.05, y: 0.1, width: 0.9, height: 0.78, anchor: "top-left", zIndex: 2 };
  return {
    ...fixture,
    template: {
      ...fixture.template,
      components: [ranking],
      metadata: { ...fixture.template.metadata, consoleTeamCount: count }
    }
  };
}

function withConsoleTemplateComponentProperties(fixture, properties) {
  const component = cloneValue(fixture.template.components[0]);
  component.bindings = [];
  component.properties = { ...component.properties, ...properties };
  return {
    ...fixture,
    template: {
      ...fixture.template,
      components: [component],
      metadata: { ...fixture.template.metadata, consoleDisplayAdapter: true }
    }
  };
}

function buildProductionConsoleTemplateRendererSources(model, options = {}) {
  const now = normalizeNow(options.now);
  const fixture = getFixtureDefinition(options.fixtureId || model.templateRendererContextId);
  const source = stampFixtureSource(buildPlaygroundFixture(fixture.competitionType, fixture.countOption), now);
  const visibility = normalizeVisibility(options.visibility || model.templateRendererVisibility);
  const contract = buildBroadcastDataContract(source, {
    visibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  const variables = buildConsoleVariablesInspector(model, visibility, options);
  return {
    productionVariables: variables.snapshot,
    broadcastContract: contract,
    assetManager: model.assetRegistry
  };
}

function requireConsoleTemplate(model, templateId) {
  const template = getRegisteredTemplate(model.templateRegistry, templateId || model.selectedTemplateId);
  if (!template) throw consoleError("console-template-not-found");
  return template;
}

function emptyTemplateRendererRuntimeState() {
  return {
    templateRendererState: "uninitialized",
    templateRendererPreparation: null,
    templateRendererResult: null,
    templateRendererSnapshot: null,
    templateRendererWarnings: [],
    templateRendererErrors: [],
    ...emptyThemeTemplateRuntimeState()
  };
}

function emptyThemeTemplateRuntimeState() {
  return {
    themeTemplateState: "uninitialized",
    themeTemplateResolution: null,
    themeTemplatePreparation: null,
    themeTemplateResult: null,
    themeTemplateSnapshot: null,
    themeTemplateWarnings: [],
    themeTemplateErrors: [],
    officialPreviewState: "uninitialized",
    officialPreview: null,
    officialPreviewSnapshot: null,
    officialPreviewWarnings: [],
    officialPreviewErrors: []
  };
}

function themeTemplateModelResult(model, integration, result, snapshot, lastAction) {
  const safeResult = cloneValue(result);
  return {
    ...model,
    themeTemplateState: integration.state,
    themeTemplateResult: safeResult,
    themeTemplateSnapshot: cloneValue(snapshot),
    themeTemplateWarnings: uniqueStrings([...(safeResult.warnings || []), ...(snapshot.warnings || [])]),
    themeTemplateErrors: uniqueStrings([...(safeResult.errors || []), ...(snapshot.errors || [])]),
    inspectorTab: "templates",
    lastAction,
    lastActionError: safeResult.errors?.[0] || null
  };
}

function templateRendererModelResult(model, integration, result, snapshot, lastAction) {
  const clonedResult = cloneTemplateRenderResult(result);
  return {
    ...model,
    templateRendererState: integration.state,
    templateRendererResult: clonedResult,
    templateRendererSnapshot: cloneValue(snapshot),
    templateRendererWarnings: uniqueStrings([...(clonedResult.warnings || []), ...(snapshot.warnings || [])]),
    templateRendererErrors: uniqueStrings([...(clonedResult.errors || []), ...(snapshot.errors || [])]),
    inspectorTab: "templates",
    lastAction,
    lastActionError: clonedResult.errors?.[0] || null
  };
}

function buildConsoleTemplatesInspector(model, visibility, options = {}) {
  const rank = VISIBILITY_RANK[visibility] ?? VISIBILITY_RANK.production;
  const templates = listRegisteredTemplates(model.templateRegistry)
    .filter((template) => (VISIBILITY_RANK[template.visibility] ?? VISIBILITY_RANK.restricted) <= rank);
  const visibleIds = new Set(templates.map((template) => template.templateId));
  const selectedTemplateId = visibleIds.has(model.selectedTemplateId) ? model.selectedTemplateId : templates[0]?.templateId || null;
  const selected = selectedTemplateId ? getRegisteredTemplate(model.templateRegistry, selectedTemplateId) : null;
  const validations = templates.map((template) => validateBroadcastTemplate(template));
  const snapshot = selected
    ? getProductionConsoleTemplateClipboardSnapshot(model, { ...options, templateId: selected.templateId, visibility })
    : null;
  return {
    version: TEMPLATE_ENGINE_VERSION,
    rendererIntegration: {
      version: TEMPLATE_RENDERER_INTEGRATION_VERSION,
      state: model.templateRendererState,
      contextId: model.templateRendererContextId,
      output: getComponentRendererOutput(model.templateRendererOutputId),
      visibility: model.templateRendererVisibility,
      preparation: cloneValue(model.templateRendererPreparation),
      result: cloneValue(model.templateRendererResult),
      componentResults: cloneValue(model.templateRendererResult?.componentResults || []),
      snapshot: cloneValue(model.templateRendererSnapshot),
      warnings: cloneValue(model.templateRendererWarnings || []),
      errors: cloneValue(model.templateRendererErrors || [])
    },
    themeTemplateIntegration: {
      version: THEME_TEMPLATE_INTEGRATION_VERSION,
      state: model.themeTemplateState,
      themeSelection: model.themeTemplateThemeId,
      resolvedTheme: cloneValue(model.themeTemplateResolution),
      themedPreparation: cloneValue(model.themeTemplatePreparation),
      themedComponentInstances: cloneValue(model.themeTemplatePreparation?.componentInstances || []),
      themedRenderResult: cloneValue(model.themeTemplateResult),
      snapshot: cloneValue(model.themeTemplateSnapshot),
      appliedTokens: cloneValue(model.themeTemplateResult?.appliedTokens || model.themeTemplatePreparation?.appliedTokens || []),
      fallbackTokens: cloneValue(model.themeTemplateResult?.fallbackTokens || model.themeTemplatePreparation?.fallbackTokens || []),
      ignoredTokens: cloneValue(model.themeTemplateResult?.ignoredTokens || model.themeTemplatePreparation?.ignoredTokens || []),
      warnings: cloneValue(model.themeTemplateWarnings || []),
      errors: cloneValue(model.themeTemplateErrors || [])
    },
    officialPreview: {
      version: PREVIEW_ENGINE_VERSION,
      state: model.officialPreviewState,
      preview: cloneValue(model.officialPreview),
      snapshot: cloneValue(model.officialPreviewSnapshot),
      warnings: cloneValue(model.officialPreviewWarnings || []),
      errors: cloneValue(model.officialPreviewErrors || [])
    },
    officialProgram: {
      version: PROGRAM_ENGINE_VERSION,
      state: model.officialProgramState,
      program: cloneValue(model.officialProgram),
      snapshot: cloneValue(model.officialProgramSnapshot),
      warnings: cloneValue(model.officialProgramWarnings || []),
      errors: cloneValue(model.officialProgramErrors || [])
    },
    registry: {
      engineVersion: TEMPLATE_ENGINE_VERSION,
      revision: model.templateRegistry?.revision ?? 0,
      templates
    },
    selectedTemplateId,
    selected,
    instance: cloneValue(model.templateInstanceResult),
    snapshot: cloneValue(snapshot),
    clipboardSnapshot: cloneValue(snapshot),
    warnings: uniqueStrings([
      ...validations.flatMap((validation) => validation.warnings || []),
      ...(snapshot?.warnings || []),
      ...(model.templateWarnings || []),
      ...(model.templateRendererWarnings || []),
      ...(model.themeTemplateWarnings || []),
      ...(model.officialPreviewWarnings || []),
      ...(model.officialProgramWarnings || [])
    ]),
    errors: uniqueStrings([
      ...validations.flatMap((validation) => validation.errors || []),
      ...(snapshot?.errors || []),
      ...(model.templateErrors || []),
      ...(model.templateRendererErrors || []),
      ...(model.themeTemplateErrors || []),
      ...(model.officialPreviewErrors || []),
      ...(model.officialProgramErrors || [])
    ])
  };
}

function buildConsoleThemesInspector(model, visibility, options = {}) {
  const rank = VISIBILITY_RANK[visibility] ?? VISIBILITY_RANK.production;
  const themes = listBroadcastThemes(model.themeRegistry)
    .filter((theme) => (VISIBILITY_RANK[theme.visibility] ?? VISIBILITY_RANK.restricted) <= rank);
  const visibleIds = new Set(themes.map((theme) => theme.id));
  const selectedThemeId = visibleIds.has(model.selectedThemeId)
    ? model.selectedThemeId
    : visibleIds.has(model.themeRegistry.activeThemeId)
      ? model.themeRegistry.activeThemeId
      : themes[0]?.id || null;
  const selected = selectedThemeId ? getBroadcastTheme(model.themeRegistry, selectedThemeId) : null;
  let resolved = null;
  let resolutionError = null;
  if (selected) {
    try {
      resolved = resolveBroadcastTheme(model.themeRegistry, selected.id);
    } catch (error) {
      resolutionError = error?.code || error?.message || "theme-resolution-failed";
    }
  }
  const validations = themes.map((theme) => validateBroadcastTheme(theme));
  const snapshot = buildBroadcastThemeSnapshot(model.themeRegistry, {
    visibility,
    resolve: true,
    now: options.now
  });
  return {
    version: THEME_ENGINE_VERSION,
    registry: {
      themeEngineVersion: THEME_ENGINE_VERSION,
      revision: model.themeRegistry?.revision ?? 0,
      activeThemeId: visibleIds.has(model.themeRegistry?.activeThemeId) ? model.themeRegistry.activeThemeId : null,
      themes
    },
    selectedThemeId,
    selected,
    resolved,
    snapshot: cloneValue(snapshot),
    clipboardSnapshot: cloneValue(snapshot),
    warnings: uniqueStrings([
      ...validations.flatMap((validation) => validation.warnings || []),
      ...(snapshot.warnings || []),
      ...(model.themeWarnings || [])
    ]),
    errors: uniqueStrings([
      ...validations.flatMap((validation) => validation.errors || []),
      ...(snapshot.errors || []),
      ...(resolutionError ? [resolutionError] : []),
      ...(model.themeErrors || [])
    ])
  };
}

function themeDiagnostics(registry, themeId) {
  if (!themeId) return { themeWarnings: [], themeErrors: [] };
  const theme = getBroadcastTheme(registry, themeId);
  if (!theme) return { themeWarnings: [], themeErrors: ["theme-not-found"] };
  const validation = validateBroadcastTheme(theme);
  const errors = [...(validation.errors || [])];
  try {
    resolveBroadcastTheme(registry, theme.id);
  } catch (error) {
    errors.push(error?.code || error?.message || "theme-resolution-failed");
  }
  return {
    themeWarnings: uniqueStrings(validation.warnings || []),
    themeErrors: uniqueStrings(errors)
  };
}

function publicVariableDescriptor(variable) {
  return {
    variablesVersion: variable.variablesVersion,
    variableId: variable.variableId,
    key: variable.key,
    label: variable.label,
    dataType: variable.dataType,
    value: cloneValue(variable.value),
    defaultValue: cloneValue(variable.defaultValue),
    status: variable.status,
    scope: variable.scope,
    visibility: variable.visibility,
    source: variable.source,
    version: variable.version,
    revision: variable.revision,
    expiresAt: variable.expiresAt
  };
}

function publicStateDescriptor(state) {
  return {
    stateVersion: state.stateVersion,
    revision: state.revision,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    status: state.status,
    selection: cloneValue(state.selection),
    preview: cloneValue(state.preview),
    program: cloneValue(state.program),
    layers: cloneValue(state.layers),
    graphics: cloneValue(state.graphics),
    outputs: Object.fromEntries(Object.entries(state.outputs || {}).map(([id, output]) => [id, {
      id: output.id,
      name: output.name,
      type: output.type,
      status: output.status,
      resolution: output.resolution,
      orientation: output.orientation,
      aspectRatio: output.aspectRatio,
      safeArea: output.safeArea,
      assignedLayers: output.assignedLayers,
      heartbeat: output.heartbeat,
      lastAppliedRevision: output.lastAppliedRevision,
      stale: output.stale
    }])),
    queue: getBroadcastQueue(state),
    warnings: cloneValue(state.warnings),
    errors: cloneValue(state.errors)
  };
}

function publicOutputDescriptor(output) {
  if (!output) return null;
  return {
    outputVersion: output.outputVersion,
    revision: output.revision,
    id: output.id,
    name: output.name,
    type: output.type,
    status: output.status,
    enabled: output.enabled,
    visibility: output.visibility,
    resolution: output.resolution,
    orientation: output.orientation,
    aspectRatio: output.aspectRatio,
    safeArea: output.safeArea,
    assignedLayers: output.assignedLayers,
    heartbeat: output.heartbeat,
    staleAfterMs: output.staleAfterMs,
    lastAppliedRevision: output.lastAppliedRevision,
    lastAppliedAt: output.lastAppliedAt,
    latency: output.latency,
    warnings: output.warnings,
    errors: output.errors
  };
}

function publicAssetDescriptor(asset) {
  return {
    assetManagerVersion: asset.assetManagerVersion,
    assetId: asset.assetId,
    assetFamilyId: asset.assetFamilyId,
    name: asset.name,
    type: asset.type,
    status: asset.status,
    visibility: asset.visibility,
    scope: asset.scope,
    version: asset.version,
    revision: asset.revision,
    variants: asset.variants.map((variant) => ({
      variantId: variant.variantId,
      type: variant.type,
      status: variant.status,
      visibility: variant.visibility,
      orientation: variant.orientation,
      outputTypes: variant.outputTypes
    })),
    warnings: asset.warnings,
    errors: asset.errors
  };
}

function collectRefs(root) {
  const id = (value) => root.querySelector(`#${value}`);
  return {
    root: id("production-console"),
    headerStatus: id("console-header-status"),
    fixture: id("console-fixture"),
    loadFixture: id("console-load-fixture"),
    context: id("console-context"),
    graphicLibrary: id("console-graphic-library"),
    asset: id("console-asset"),
    visibility: id("console-visibility"),
    output: id("console-output"),
    x: id("console-x"),
    y: id("console-y"),
    width: id("console-width"),
    height: id("console-height"),
    scale: id("console-scale"),
    opacity: id("console-opacity"),
    anchor: id("console-anchor"),
    unit: id("console-unit"),
    layer: id("console-layer"),
    enterAnimation: id("console-enter-animation"),
    exitAnimation: id("console-exit-animation"),
    duration: id("console-duration"),
    delay: id("console-delay"),
    autoHide: id("console-autohide"),
    preview: id("console-preview"),
    program: id("console-program"),
    layersBody: id("console-layers-body"),
    outputsList: id("console-outputs-list"),
    queueList: id("console-queue-list"),
    assetsList: id("console-assets-list"),
    variables: id("console-variables"),
    system: id("console-system"),
    inspectorTabs: id("console-inspector-tabs"),
    themeLab: id("console-theme-lab"),
    themeSelect: id("console-theme-select"),
    themeStatus: id("console-theme-status"),
    themePalette: id("console-theme-palette"),
    themeTypography: id("console-theme-typography"),
    themeLogos: id("console-theme-logos"),
    themeBackgrounds: id("console-theme-backgrounds"),
    themeWatermark: id("console-theme-watermark"),
    themeBorders: id("console-theme-borders"),
    themeComponents: id("console-theme-components"),
    themeWarnings: id("console-theme-warnings"),
    themeErrors: id("console-theme-errors"),
    themeActions: [...root.querySelectorAll("[data-theme-action]")],
    templateLab: id("console-template-lab"),
    templateFixture: id("console-template-fixture"),
    templateStatus: id("console-template-status"),
    templateWarnings: id("console-template-warnings"),
    templateErrors: id("console-template-errors"),
    templateActions: [...root.querySelectorAll("[data-template-action]")],
    templateRendererLab: id("console-template-renderer-lab"),
    templateRendererTemplate: id("console-template-renderer-template"),
    templateRendererTheme: id("console-template-renderer-theme"),
    templateRendererContext: id("console-template-renderer-context"),
    templateRendererOutput: id("console-template-renderer-output"),
    templateRendererVisibility: id("console-template-renderer-visibility"),
    templateRendererFrame: id("console-template-renderer-frame"),
    templateRendererSafeArea: id("console-template-renderer-safe-area"),
    templateRendererTarget: id("console-template-renderer-target"),
    templateRendererStatus: id("console-template-renderer-status"),
    templateRendererMetrics: id("console-template-renderer-metrics"),
    templateRendererWarnings: id("console-template-renderer-warnings"),
    templateRendererErrors: id("console-template-renderer-errors"),
    templateRendererActions: [...root.querySelectorAll("[data-template-renderer-action]")],
    officialPreviewActions: [...root.querySelectorAll("[data-official-preview-action]")],
    officialProgramLab: id("console-official-program-lab"),
    officialProgramStatus: id("console-official-program-status"),
    officialProgramFrame: id("console-official-program-frame"),
    officialProgramTarget: id("console-official-program-target"),
    officialProgramMetrics: id("console-official-program-metrics"),
    officialProgramWarnings: id("console-official-program-warnings"),
    officialProgramErrors: id("console-official-program-errors"),
    officialProgramActions: [...root.querySelectorAll("[data-official-program-action]")],
    outputRouting: id("console-output-routing"),
    outputRoutingStatus: id("console-output-routing-status"),
    outputRoutingRoutes: id("console-output-routing-routes"),
    outputRoutingActions: [...root.querySelectorAll("[data-output-routing-action]")],
    outputSynchronization: id("console-output-synchronization"),
    outputSynchronizationStatus: id("console-output-synchronization-status"),
    outputSynchronizationTargets: id("console-output-synchronization-targets"),
    outputSynchronizationProgramHost: id("console-output-synchronization-program-host"),
    outputSynchronizationAnnouncerHost: id("console-output-synchronization-announcer-host"),
    componentRendererLab: id("console-component-renderer-lab"),
    componentRendererFixture: id("console-component-renderer-fixture"),
    componentRendererOutput: id("console-component-renderer-output"),
    componentRendererFrame: id("console-component-renderer-frame"),
    componentRendererSafeArea: id("console-component-renderer-safe-area"),
    componentRendererTarget: id("console-component-renderer-target"),
    componentRendererStatus: id("console-component-renderer-status"),
    componentRendererWarnings: id("console-component-renderer-warnings"),
    componentRendererErrors: id("console-component-renderer-errors"),
    componentRendererActions: [...root.querySelectorAll("[data-component-renderer-action]")],
    inspector: id("console-inspector"),
    actions: [...root.querySelectorAll("[data-console-action]")],
    presets: [...root.querySelectorAll("[data-console-preset]")]
  };
}

function populateStaticControls(refs, model) {
  populateSelect(refs.fixture, PRODUCTION_CONSOLE_FIXTURES.map((fixture) => ({ value: fixture.id, label: fixture.label })), model.fixtureId);
  populateSelect(refs.asset, listBroadcastAssets(model.assetRegistry).map((asset) => ({ value: asset.assetId, label: asset.name })), model.selectedAssetId);
  populateSelect(refs.visibility, VISIBILITIES.map((value) => ({ value, label: value })), model.visibility);
  populateSelect(refs.output, listBroadcastOutputs().filter((output) => model.outputIds.includes(output.id)).map((output) => ({ value: output.id, label: output.name })), model.selectedOutputId);
  populateSelect(refs.anchor, ANCHORS.map((value) => ({ value, label: readableLabel(value) })), model.geometry.position.anchor);
  populateSelect(refs.unit, POSITION_UNITS.map((value) => ({ value, label: value })), model.geometry.position.unit);
  populateSelect(refs.layer, PLAYGROUND_LAYER_IDS.map((value) => ({ value, label: value })), model.geometry.layerId);
  populateSelect(refs.enterAnimation, ANIMATIONS.map((value) => ({ value, label: value })), model.animation.enter);
  populateSelect(refs.exitAnimation, ANIMATIONS.map((value) => ({ value, label: value })), model.animation.exit);
  populateSelect(refs.templateFixture, TEMPLATE_ENGINE_FIXTURES.map((fixture) => ({ value: fixture.type, label: fixture.label })), model.templateFixtureType);
  populateSelect(refs.templateRendererContext, PRODUCTION_CONSOLE_FIXTURES.map((fixture) => ({ value: fixture.id, label: fixture.label })), model.templateRendererContextId);
  populateSelect(refs.templateRendererTheme, listBroadcastThemes(model.themeRegistry).map((theme) => ({
    value: theme.themeId,
    label: `${theme.name} · ${theme.metadata?.brandingStatus || "neutral"}`
  })), model.themeTemplateThemeId);
  populateSelect(refs.templateRendererOutput, COMPONENT_RENDERER_OUTPUTS.map((value) => ({ value: value.id, label: value.label })), model.templateRendererOutputId);
  populateSelect(refs.templateRendererVisibility, VISIBILITIES.map((value) => ({ value, label: value })), model.templateRendererVisibility);
  populateSelect(refs.componentRendererFixture, COMPONENT_RENDERER_FIXTURE_TYPES.map((value) => ({ value, label: readableLabel(value) })), model.componentRendererFixtureType);
  populateSelect(refs.componentRendererOutput, COMPONENT_RENDERER_OUTPUTS.map((value) => ({ value: value.id, label: value.label })), model.componentRendererOutputId);
}

function bindConsoleEvents(refs, getModel, setModel, runtime, signal) {
  const run = (callback) => {
    try {
      setModel(callback(getModel()));
    } catch (error) {
      console.error("[production-console] action failed", error);
      setModel({ ...getModel(), lastAction: "action-failed", lastActionError: error?.code || error?.message || "console-action-failed" });
    }
  };
  listen(refs.loadFixture, "click", () => run((model) => {
    const next = loadProductionConsoleFixture(model, refs.fixture.value);
    return setupProductionConsoleOutputSynchronization(next, runtime, refs);
  }), signal);
  listen(refs.asset, "change", () => run((model) => {
    const selected = selectProductionAsset(model, refs.asset.value);
    return selected.state.preview.active ? prepareProductionPreview(selected, {}, { confirmed: true }) : selected;
  }), signal);
  listen(refs.visibility, "change", () => run((model) => {
    const selected = setProductionVisibility(model, refs.visibility.value);
    if (runtime.componentRenderer && runtime.componentRenderer.state !== "destroyed") destroyComponentRenderer(runtime.componentRenderer);
    runtime.componentRenderer = createProductionConsoleComponentRenderer(selected, refs.componentRendererTarget);
    return { ...selected, componentRendererState: runtime.componentRenderer.state, componentRendererResult: null, componentRendererSnapshot: null };
  }), signal);
  listen(refs.output, "change", () => run((model) => selectProductionOutput(model, refs.output.value)), signal);
  [refs.x, refs.y, refs.width, refs.height, refs.scale, refs.opacity, refs.anchor, refs.unit, refs.layer, refs.enterAnimation, refs.exitAnimation, refs.duration, refs.delay, refs.autoHide]
    .filter(Boolean)
    .forEach((control) => listen(control, "change", () => run((model) => prepareProductionPreview(model, {
      geometry: readGeometryControls(refs),
      animation: readAnimationControls(refs)
    }, { confirmed: true })), signal));
  listen(refs.graphicLibrary, "click", (event) => {
    const button = event.target.closest("button[data-graphic-id]");
    if (!button) return;
    run((model) => selectProductionGraphic(model, button.dataset.graphicId));
  }, signal);
  refs.actions.forEach((button) => listen(button, "click", () => run((model) => handleConsoleAction(model, button.dataset.consoleAction, refs)), signal));
  refs.presets.forEach((button) => listen(button, "click", () => run((model) => prepareProductionPreview(model, {
    geometry: geometryPreset(button.dataset.consolePreset, model.geometry)
  }, { confirmed: true })), signal));
  listen(refs.layersBody, "click", (event) => {
    const button = event.target.closest("button[data-layer-action]");
    if (!button) return;
    const layer = getModel().state.layers[button.dataset.layerId];
    const needsConfirmation = button.dataset.layerId === "emergency" || (layer?.locked && ["hide", "unlock"].includes(button.dataset.layerAction));
    const confirmations = !needsConfirmation ? 0 : button.dataset.layerId === "emergency"
      ? countExplicitConfirmations([
          `Confirmar ${button.dataset.layerAction} en emergency.`,
          "Confirmar nuevamente la acción crítica sobre emergency."
        ])
      : countExplicitConfirmations([`Confirmar ${button.dataset.layerAction} en ${button.dataset.layerId}.`]);
    const confirmed = !needsConfirmation || confirmations > 0;
    if (!confirmed) return;
    run((model) => setProductionLayerAction(model, button.dataset.layerId, button.dataset.layerAction, { confirmed, confirmations }));
  }, signal);
  listen(refs.outputsList, "click", (event) => {
    const button = event.target.closest("button[data-output-action]");
    if (!button) return;
    run((model) => {
      const selected = selectProductionOutput(model, button.dataset.outputId);
      return setProductionOutputAction(selected, button.dataset.outputAction, { outputId: button.dataset.outputId });
    });
  }, signal);
  listen(refs.queueList, "click", (event) => {
    const button = event.target.closest("button[data-queue-action]");
    if (!button) return;
    run((model) => {
      if (button.dataset.queueAction === "remove") return removeProductionQueueItem(model, button.dataset.queueId);
      return changeProductionQueuePriority(model, button.dataset.queueId, button.dataset.queueAction === "up" ? 10 : -10);
    });
  }, signal);
  listen(refs.variables, "click", (event) => {
    const button = event.target.closest("button[data-variable-action]");
    if (!button) return;
    const variableId = button.dataset.variableId;
    run((model) => {
      if (button.dataset.variableAction === "reset") return resetProductionConsoleVariable(model, variableId);
      if (button.dataset.variableAction === "toggle") {
        const variable = requireConsoleVariable(model, variableId);
        return setProductionConsoleVariableStatus(model, variableId, variable.status !== "active");
      }
      const input = refs.variables.querySelector(`[data-variable-input="${CSS.escape(variableId)}"]`);
      return setProductionConsoleVariable(model, variableId, readProductionVariableControl(input, requireConsoleVariable(model, variableId), model));
    });
  }, signal);
  listen(refs.inspectorTabs, "click", (event) => {
    const button = event.target.closest("button[data-inspector-tab]");
    if (!button) return;
    run((model) => ({ ...model, inspectorTab: normalizeInspectorTab(button.dataset.inspectorTab), lastAction: "inspector-tab-changed" }));
  }, signal);
  listen(refs.themeSelect, "change", () => run((model) => selectProductionConsoleTheme(model, refs.themeSelect.value)), signal);
  refs.themeActions.forEach((button) => listen(button, "click", () => run((model) => {
    const action = button.dataset.themeAction;
    let next = model;
    if (action === "create") next = createProductionConsoleTheme(model);
    else if (action === "duplicate") next = duplicateProductionConsoleTheme(model);
    else if (action === "delete") next = removeProductionConsoleTheme(model);
    else if (action === "activate") next = activateProductionConsoleTheme(model);
    else if (action === "deactivate") next = deactivateProductionConsoleTheme(model);
    if (action === "snapshot") return snapshotProductionConsoleTheme(model);
    return next === model ? model : recreateProductionConsoleTemplateRendererRuntime(next, runtime, refs);
  }), signal));
  listen(refs.templateFixture, "change", () => run((model) => selectProductionConsoleTemplateFixture(model, refs.templateFixture.value)), signal);
  refs.templateActions.forEach((button) => listen(button, "click", () => run((model) => {
    let next = model;
    if (button.dataset.templateAction === "create") next = createProductionConsoleTemplate(model);
    else if (button.dataset.templateAction === "duplicate") next = duplicateProductionConsoleTemplate(model);
    else if (button.dataset.templateAction === "delete") next = removeProductionConsoleTemplate(model);
    else if (button.dataset.templateAction === "instantiate") next = instantiateProductionConsoleTemplate(model);
    if (button.dataset.templateAction === "snapshot") return snapshotProductionConsoleTemplate(model);
    return next === model ? model : recreateProductionConsoleTemplateRendererRuntime(next, runtime, refs);
  }), signal));
  listen(refs.templateRendererTemplate, "change", () => run((model) => {
    if (!refs.templateRendererTemplate.value) return model;
    return recreateProductionConsoleTemplateRendererRuntime(
      selectProductionConsoleTemplate(model, refs.templateRendererTemplate.value),
      runtime,
      refs
    );
  }), signal);
  listen(refs.templateRendererTheme, "change", () => run((model) => {
    if (!refs.templateRendererTheme.value) return model;
    return selectProductionConsoleThemeTemplateTheme(model, refs.templateRendererTheme.value);
  }), signal);
  listen(refs.templateRendererContext, "change", () => run((model) => recreateProductionConsoleTemplateRendererRuntime(
    selectProductionConsoleTemplateRendererContext(model, refs.templateRendererContext.value),
    runtime,
    refs
  )), signal);
  listen(refs.templateRendererOutput, "change", () => run((model) => recreateProductionConsoleTemplateRendererRuntime(
    selectProductionConsoleTemplateRendererOutput(model, refs.templateRendererOutput.value),
    runtime,
    refs
  )), signal);
  listen(refs.templateRendererVisibility, "change", () => run((model) => {
    const selected = selectProductionConsoleTemplateRendererVisibility(model, refs.templateRendererVisibility.value);
    if (model.themeTemplateResult) return selected;
    return recreateProductionConsoleTemplateRendererRuntime(selected, runtime, refs);
  }), signal);
  refs.templateRendererActions.forEach((button) => listen(button, "click", async () => {
    if (button.dataset.templateRendererAction === "copy-snapshot") {
      try {
        const snapshot = getProductionConsoleThemeTemplateClipboardSnapshot(getModel(), runtime.themeTemplateIntegration);
        await copyText(JSON.stringify(snapshot, null, 2));
        button.textContent = "Copiado";
        window.setTimeout(() => { button.textContent = "Copiar Snapshot"; }, 1200);
      } catch (error) {
        console.error("[production-console] template snapshot copy failed", error);
      }
      return;
    }
    run((model) => {
      const action = button.dataset.templateRendererAction;
      if (action === "instantiate") {
        const next = instantiateProductionConsoleTemplateForRenderer(model);
        return recreateProductionConsoleTemplateRendererRuntime(next, runtime, refs);
      }
      const integration = ensureProductionConsoleThemeTemplateRuntime(model, runtime, refs);
      if (action === "resolve-theme") return resolveProductionConsoleThemeTemplate(model, integration);
      if (action === "prepare") return prepareProductionConsoleThemeTemplate(model, integration);
      if (action === "render") return renderProductionConsoleThemeTemplate(model, integration);
      if (action === "change-theme") return changeProductionConsoleThemeTemplate(model, integration);
      if (action === "update") return updateProductionConsoleThemeTemplate(model, integration);
      if (action === "clear") return clearProductionConsoleThemeTemplate(model, integration);
      return model;
    });
  }, signal));
  refs.officialPreviewActions.forEach((button) => listen(button, "click", async () => {
    if (button.dataset.officialPreviewAction === "snapshot") {
      try {
        const snapshot = getProductionConsoleOfficialPreviewClipboardSnapshot(
          getModel(),
          runtime.officialPreviewEngine
        );
        await copyText(JSON.stringify(snapshot, null, 2));
        button.textContent = "Copiado";
        window.setTimeout(() => { button.textContent = "Snapshot"; }, 1200);
      } catch (error) {
        console.error("[production-console] official preview snapshot failed", error);
      }
      return;
    }
    run((model) => {
      ensureProductionConsoleThemeTemplateRuntime(model, runtime, refs);
      const action = button.dataset.officialPreviewAction;
      if (action === "prepare") {
        return prepareProductionConsoleOfficialPreview(
          model,
          runtime.officialPreviewEngine,
          runtime.officialPreviewPreparationStore,
          runtime.themeTemplateIntegration
        );
      }
      if (action === "render") return renderProductionConsoleOfficialPreview(model, runtime.officialPreviewEngine);
      if (action === "update") return updateProductionConsoleOfficialPreview(model, runtime.officialPreviewEngine);
      if (action === "clear") {
        return clearProductionConsoleOfficialPreview(
          model,
          runtime.officialPreviewEngine,
          runtime.officialPreviewPreparationStore
        );
      }
      return model;
    });
  }, signal));
  refs.officialProgramActions.forEach((button) => listen(button, "click", async () => {
    const action = button.dataset.officialProgramAction;
    if (action === "snapshot") {
      try {
        const snapshot = getProductionConsoleOfficialProgramClipboardSnapshot(
          getModel(),
          runtime.officialProgramEngine
        );
        await copyText(JSON.stringify(snapshot, null, 2));
        button.textContent = "Copiado";
        window.setTimeout(() => { button.textContent = "Snapshot"; }, 1200);
      } catch (error) {
        console.error("[production-console] official program snapshot failed", error);
      }
      return;
    }
    run((model) => {
      if (!runtime.officialProgramEngine || isProgramDestroyed(runtime.officialProgramEngine)) {
        runtime.officialProgramEngine = createProductionConsoleOfficialProgramEngine(model);
      }
      if (action === "prepare") {
        return prepareProductionConsoleOfficialProgram(
          model,
          runtime.officialProgramEngine,
          runtime.officialPreviewEngine
        );
      }
      if (["take", "cut", "auto"].includes(action)) {
        const next = action === "take"
          ? takeProductionConsoleOfficialProgram(model, runtime.officialProgramEngine)
          : action === "cut"
            ? cutProductionConsoleOfficialProgram(model, runtime.officialProgramEngine)
            : autoProductionConsoleOfficialProgram(model, runtime.officialProgramEngine);
        captureOfficialProgramVisual(refs, runtime);
        return next;
      }
      if (action === "update") {
        const next = updateProductionConsoleOfficialProgram(
          model,
          runtime.officialProgramEngine,
          runtime.officialPreviewEngine
        );
        captureOfficialProgramVisual(refs, runtime);
        return next;
      }
      if (action === "clear") {
        const next = clearProductionConsoleOfficialProgram(model, runtime.officialProgramEngine);
        clearOfficialProgramVisual(refs, runtime);
        return next;
      }
      return model;
    });
  }, signal));
  listen(refs.outputRouting, "click", async (event) => {
    const button = event.target.closest("button[data-output-routing-action]");
    if (!button) return;
    const action = button.dataset.outputRoutingAction;
    const routeId = button.dataset.outputRoutingRouteId;
    if (action === "snapshot") {
      try {
        const snapshot = getProductionConsoleOutputRoutingClipboardSnapshot(
          getModel(),
          runtime.outputRoutingEngine
        );
        await copyText(JSON.stringify(snapshot, null, 2));
        button.textContent = "Copiado";
        window.setTimeout(() => { button.textContent = "Copiar Snapshot"; }, 1200);
      } catch (error) {
        console.error("[production-console] output routing snapshot failed", error);
      }
      return;
    }
    if (!routeId) return;
    run((model) => {
      if (!runtime.outputRoutingEngine || runtime.outputRoutingEngine.state === "destroyed") {
        runtime.outputRoutingEngine = createProductionConsoleOutputRoutingEngine(model);
      }
      if (action === "configure") {
        return configureProductionConsoleOutputRoute(model, runtime.outputRoutingEngine, routeId);
      }
      if (action === "resolve" || action === "update") {
        return resolveProductionConsoleOutputRoute(model, runtime.outputRoutingEngine, routeId, {
          programEngine: runtime.officialProgramEngine,
          update: action === "update"
        });
      }
      if (action === "enable") {
        return setProductionConsoleOutputRouteEnabled(model, runtime.outputRoutingEngine, routeId, true);
      }
      if (action === "disable") {
        return setProductionConsoleOutputRouteEnabled(model, runtime.outputRoutingEngine, routeId, false);
      }
      if (action === "clear") {
        return clearProductionConsoleOutputRoute(model, runtime.outputRoutingEngine, routeId);
      }
      return model;
    });
  }, signal);
  listen(refs.outputSynchronization, "click", (event) => {
    const button = event.target.closest("button[data-output-synchronization-action]");
    if (!button) return;
    run((model) => runProductionConsoleOutputSynchronization(
      model,
      runtime,
      button.dataset.outputSynchronizationAction
    ));
  }, signal);
  listen(refs.componentRendererFixture, "change", () => run((model) => selectProductionComponentRendererFixture(model, refs.componentRendererFixture.value)), signal);
  listen(refs.componentRendererOutput, "change", () => run((model) => {
    if (runtime.componentRenderer && runtime.componentRenderer.state !== "destroyed") destroyComponentRenderer(runtime.componentRenderer);
    const selected = selectProductionComponentRendererOutput(model, refs.componentRendererOutput.value);
    runtime.componentRenderer = createProductionConsoleComponentRenderer(selected, refs.componentRendererTarget);
    return { ...selected, componentRendererState: runtime.componentRenderer.state };
  }), signal);
  refs.componentRendererActions.forEach((button) => listen(button, "click", () => run((model) => {
    if (!runtime.componentRenderer || runtime.componentRenderer.state === "destroyed") {
      runtime.componentRenderer = createProductionConsoleComponentRenderer(model, refs.componentRendererTarget);
    }
    if (button.dataset.componentRendererAction === "clear") return clearProductionConsoleComponentRenderer(model, runtime.componentRenderer);
    return renderProductionConsoleComponentFixture(model, runtime.componentRenderer, button.dataset.componentRendererAction);
  }), signal));
  listen(refs.inspector, "click", async (event) => {
    const componentAction = event.target.closest("button[data-component-action]");
    if (componentAction) {
      run((model) => {
        if (componentAction.dataset.componentAction === "create") return createProductionConsoleTestComponent(model);
        if (componentAction.dataset.componentAction === "duplicate") return duplicateProductionConsoleComponent(model);
        if (componentAction.dataset.componentAction === "delete") return removeProductionConsoleComponent(model);
        return model;
      });
      return;
    }
    const componentSelection = event.target.closest("button[data-component-id]");
    if (componentSelection) {
      run((model) => selectProductionConsoleComponent(model, componentSelection.dataset.componentId));
      return;
    }
    const templateSelection = event.target.closest("button[data-template-id]");
    if (templateSelection) {
      run((model) => recreateProductionConsoleTemplateRendererRuntime(
        selectProductionConsoleTemplate(model, templateSelection.dataset.templateId),
        runtime,
        refs
      ));
      return;
    }
    const themeSelection = event.target.closest("button[data-theme-id]");
    if (themeSelection) {
      run((model) => selectProductionConsoleTheme(model, themeSelection.dataset.themeId));
      return;
    }
    const refreshButton = event.target.closest('button[data-console-action="refresh-inspector"]');
    if (refreshButton) {
      run((model) => ({ ...model, lastAction: "inspector-refreshed", lastActionError: null }));
      return;
    }
    const button = event.target.closest("button[data-copy-json]");
    if (!button) return;
    const value = button.dataset.copyJson === "template-snapshot"
      ? getProductionConsoleTemplateClipboardSnapshot(getModel(), { visibility: getModel().visibility })
      : button.dataset.copyJson === "theme-snapshot"
        ? getProductionConsoleThemeClipboardSnapshot(getModel(), { visibility: getModel().visibility })
        : null;
    const pre = refs.inspector.querySelector("pre");
    await copyText(value ? JSON.stringify(value, null, 2) : pre?.textContent || "");
    button.textContent = "Copiado";
    window.setTimeout(() => { button.textContent = "Copiar JSON"; }, 1200);
  }, signal);
}

function listen(target, type, handler, signal) {
  if (!target?.addEventListener) return;
  target.addEventListener(type, handler, signal ? { signal } : undefined);
}

function captureOfficialProgramVisual(refs, runtime) {
  const previewRoot = refs.templateRendererTarget?.firstElementChild;
  if (!previewRoot || typeof previewRoot.cloneNode !== "function") {
    throw consoleError("console-official-program-preview-root-required");
  }
  const nextRoot = previewRoot.cloneNode(true);
  runtime.officialProgramVisualRoot = nextRoot;
  refs.officialProgramTarget?.replaceChildren(nextRoot);
}

function clearOfficialProgramVisual(refs, runtime) {
  runtime.officialProgramVisualRoot = null;
  refs.officialProgramTarget?.replaceChildren();
}

function handleConsoleAction(model, action, refs) {
  if (action === "prepare") return prepareProductionPreview(model, { geometry: readGeometryControls(refs), animation: readAnimationControls(refs) }, { confirmed: true });
  if (["take", "cut", "auto"].includes(action)) {
    const confirmed = !model.safeMode || window.confirm(`Confirmar envío ${action.toUpperCase()} a Program.`);
    return confirmed ? transitionProductionToProgram(model, action, { confirmed }) : model;
  }
  if (action === "clear-preview") return clearProductionPreview(model);
  if (action === "clear-program") {
    const protectedProgram = model.safeMode || model.state.program.emergencyMode || model.state.program.lockedLayers.length > 0;
    const force = model.state.program.emergencyMode || model.state.program.lockedLayers.length > 0;
    const confirmations = !model.state.program.active || !protectedProgram ? 0 : force && model.state.program.emergencyMode
      ? countExplicitConfirmations(["Confirmar limpieza de Program.", "Confirmar nuevamente la limpieza crítica de Program."])
      : countExplicitConfirmations(["Confirmar limpieza de Program."]);
    const confirmed = !model.state.program.active || !protectedProgram || confirmations > 0;
    return confirmed ? clearProductionProgram(model, { confirmed, confirmations, force }) : model;
  }
  if (action === "hide") return prepareProductionPreview(model, { visible: false }, { confirmed: true });
  if (action === "hide-all") {
    if (!window.confirm("Confirmar ocultar todos los gráficos no protegidos en Preview.")) return model;
    return dispatchProductionConsoleAction(model, ACTION_TYPES.HIDE_ALL, {}, {}, { confirmed: true, label: "preview-hide-all" });
  }
  if (action === "replace") return prepareProductionPreview(model, { replace: true, geometry: readGeometryControls(refs), animation: readAnimationControls(refs) }, { confirmed: true });
  if (action === "restore-preview") return restoreLastProductionPreview(model);
  if (action === "enqueue") return enqueueProductionGraphic(model);
  if (action === "clear-queue") return window.confirm("Confirmar limpieza de la cola.")
    ? clearProductionQueue(model, { confirmed: true })
    : model;
  if (action === "safe-mode") return setProductionSafeMode(model, !model.safeMode);
  if (action === "restore") return restoreProductionConsole(model);
  if (action === "clear-all") {
    if (!window.confirm("Confirmar limpieza de Preview, Program y cola.")) return model;
    let cleared = clearProductionPreview(model);
    if (cleared.state.program.active) cleared = clearProductionProgram(cleared, { confirmed: true, force: true });
    return clearProductionQueue(cleared, { confirmed: true });
  }
  if (action === "refresh-inspector") return { ...model, lastAction: "inspector-refreshed" };
  return model;
}

function renderConsole(refs, model, runtime = {}) {
  syncControls(refs, model);
  const previewProjection = buildProductionProjection(model, "preview");
  const programProjection = buildProductionProjection(model, "program");
  renderHeader(refs.headerStatus, model);
  renderContext(refs.context, model.contract);
  renderGraphicLibrary(refs.graphicLibrary, model);
  renderStage(refs.preview, previewProjection, buildProductionRenderDescriptor(previewProjection, model.assetRegistry), "Preview");
  renderStage(refs.program, programProjection, buildProductionRenderDescriptor(programProjection, model.assetRegistry), "Program");
  renderOutputRouting(refs, model, runtime);
  renderOutputSynchronization(refs, model, runtime);
  renderLayers(refs.layersBody, model);
  renderOutputs(refs.outputsList, model);
  renderQueue(refs.queueList, model);
  renderAssets(refs.assetsList, model);
  renderVariables(refs.variables, model);
  renderSystem(refs.system, model);
  renderInspectorTabs(refs.inspectorTabs, model);
  renderThemeLab(refs, model);
  renderTemplateLab(refs, model);
  renderTemplateRendererLab(refs, model, runtime);
  renderOfficialProgramLab(refs, model, runtime);
  renderComponentRendererLab(refs, model, runtime);
  renderInspector(refs.inspector, model);
}

function syncControls(refs, model) {
  setValue(refs.fixture, model.fixtureId);
  setValue(refs.asset, model.selectedAssetId);
  setValue(refs.visibility, model.visibility);
  setValue(refs.output, model.selectedOutputId);
  setValue(refs.x, model.geometry.position.x);
  setValue(refs.y, model.geometry.position.y);
  setValue(refs.width, model.geometry.size.width);
  setValue(refs.height, model.geometry.size.height);
  setValue(refs.scale, model.geometry.scale);
  setValue(refs.opacity, model.geometry.opacity);
  setValue(refs.anchor, model.geometry.position.anchor);
  setValue(refs.unit, model.geometry.position.unit);
  setValue(refs.layer, model.geometry.layerId);
  setValue(refs.enterAnimation, model.animation.enter);
  setValue(refs.exitAnimation, model.animation.exit);
  setValue(refs.duration, model.animation.duration);
  setValue(refs.delay, model.animation.delay);
  setValue(refs.templateFixture, model.templateFixtureType);
  setValue(refs.templateRendererTemplate, model.selectedTemplateId || "");
  setValue(refs.templateRendererContext, model.templateRendererContextId);
  setValue(refs.templateRendererOutput, model.templateRendererOutputId);
  setValue(refs.templateRendererVisibility, model.templateRendererVisibility);
  setValue(refs.componentRendererFixture, model.componentRendererFixtureType);
  setValue(refs.componentRendererOutput, model.componentRendererOutputId);
  if (refs.autoHide) refs.autoHide.checked = model.animation.autoHide;
}

function renderHeader(root, model) {
  if (!root) return;
  const status = getProductionSystemStatus(model);
  root.replaceChildren(
    statusChip(status.label, status.level),
    element("span", "console-meta", `App ${model.appVersion}`),
    element("span", "console-meta", `Contract ${BROADCAST_DATA_CONTRACT_VERSION}`),
    element("span", "console-meta", `State ${BROADCAST_STATE_VERSION}`),
    element("span", "console-meta", `Output ${BROADCAST_OUTPUT_VERSION}`),
    element("span", "console-meta", `Routing ${OUTPUT_ROUTING_VERSION}`),
    element("span", "console-meta", `Sync ${OUTPUT_SYNCHRONIZATION_VERSION}`),
    element("span", "console-meta", `Assets ${ASSET_MANAGER_VERSION}`),
    element("span", "console-meta", `Preview ${PREVIEW_ENGINE_VERSION}`),
    element("span", "console-meta", `Actions ${BROADCAST_ACTION_ENGINE_VERSION}`),
    element("span", "console-meta", `Variables ${PRODUCTION_VARIABLES_VERSION}`),
    element("span", "console-meta", `Components ${COMPONENT_LIBRARY_VERSION}`),
    element("span", "console-meta", `Renderer ${COMPONENT_RENDERER_VERSION}`),
    element("span", "console-meta", `Templates ${TEMPLATE_ENGINE_VERSION}`),
    element("span", "console-meta", `Template Render ${TEMPLATE_RENDERER_INTEGRATION_VERSION}`),
    element("span", "console-meta", `Themes ${THEME_ENGINE_VERSION}`),
    element("span", "console-meta", `${getFixtureDefinition(model.fixtureId).label}`),
    element("span", "console-meta", `${getBroadcastOutput(model.selectedOutputId)?.name || "Sin output"}`),
    statusChip(model.safeMode ? "Modo seguro activo" : "Modo seguro inactivo", model.safeMode ? "ok" : "warning")
  );
}

function renderContext(root, contract) {
  if (!root) return;
  root.replaceChildren();
  const scope = contract.competition?.scope;
  [
    ["Torneo", contract.tournament?.name],
    ["Competencia", contract.competition?.name],
    ["Jornada", contract.charreada?.name],
    [scope === "individual" ? "Participante" : "Equipo", scope === "individual" ? contract.participant?.name : contract.team?.name],
    ["Caballo", contract.horse?.name],
    ["Suerte", contract.suerte?.name],
    ["Total", contract.score?.total],
    ["Posición", contract.ranking?.currentPosition]
  ].forEach(([label, value]) => root.append(definitionItem(label, value)));
}

function renderGraphicLibrary(root, model) {
  if (!root) return;
  root.replaceChildren();
  Object.values(PRODUCTION_CONSOLE_GRAPHICS).forEach((graphic) => {
    const button = element("button", `console-library-item ${model.selectedGraphicId === graphic.graphicId ? "is-selected" : ""}`);
    button.type = "button";
    button.dataset.graphicId = graphic.graphicId;
    button.append(element("strong", "", graphic.label), element("span", "", `${graphic.type} · ${graphic.layerId}`));
    root.append(button);
  });
}

function renderStage(root, projection, descriptor, label) {
  if (!root) return;
  root.replaceChildren();
  const header = element("div", "console-stage-header");
  header.append(
    element("strong", "", label),
    element("span", "", `${projection.output?.name || "Output"} · ${projection.output?.resolution?.width || 0}×${projection.output?.resolution?.height || 0}`),
    statusChip(descriptor.active ? (label === "Program" ? "on_air" : "preparado") : "inactivo", descriptor.active ? "ok" : "neutral")
  );
  const viewportWrap = element("div", "console-stage-wrap");
  const viewport = element("div", "console-output-viewport");
  const width = projection.output?.resolution?.width || 1920;
  const height = projection.output?.resolution?.height || 1080;
  viewport.style.aspectRatio = `${width} / ${height}`;
  if (height > width) viewport.classList.add("is-vertical");
  if (width / height > 3) viewport.classList.add("is-panoramic");
  const safeArea = element("div", "console-safe-area");
  applySafeArea(safeArea, projection.output?.safeArea, width, height);
  viewport.append(safeArea);
  if (!descriptor.active) viewport.append(element("div", "console-empty-output", `${label} sin composición activa`));
  descriptor.graphics.forEach((graphic) => viewport.append(renderGraphic(graphic)));
  viewportWrap.append(viewport);
  const footer = element("div", "console-stage-footer");
  footer.append(
    element("span", projection.validation?.valid ? "status-ok" : "status-error", projection.validation?.valid ? "Validación correcta" : "Validación con errores"),
    element("span", "", `Rev ${descriptor.viewRevision}`),
    element("span", "", `Layers ${descriptor.layers.length}`),
    element("span", "", `Warnings ${descriptor.warnings.length}`),
    element("span", "", `Errors ${descriptor.errors.length}`),
    element("span", "", `Heartbeat ${projection.output?.heartbeat?.status || "sin datos"}`)
  );
  root.append(header, viewportWrap, footer);
}

function renderGraphic(graphic) {
  const node = element("section", `console-graphic console-graphic-${graphic.type} animation-${graphic.enterAnimation}`);
  node.dataset.graphicId = graphic.graphicId;
  node.dataset.layerId = graphic.layerId || "";
  applyGraphicGeometry(node, graphic);
  if (graphic.asset) node.append(element("span", "console-asset-chip", `${graphic.asset.assetId} · ${graphic.asset.variantId || "base"}`));
  const content = graphic.content || {};
  if (content.kind === "ranking") {
    node.append(element("h3", "", content.title));
    const list = element("ol", "console-ranking-list");
    content.rows.forEach((row) => {
      const item = element("li");
      item.append(element("span", "rank-position", valueText(row.position, "-")), element("span", "rank-name", row.name), element("strong", "rank-total", valueText(row.total, "-")));
      list.append(item);
    });
    node.append(list);
  } else if (content.kind === "turn") {
    node.append(element("span", "graphic-kicker", content.title), element("strong", "graphic-primary", content.name), element("span", "graphic-secondary", content.detail));
  } else if (["score", "timer"].includes(content.kind)) {
    node.append(element("span", "graphic-kicker", content.title), element("strong", "graphic-value", valueText(content.value, "-")));
  } else if (content.kind === "details") {
    node.append(element("h3", "", content.title));
    if (content.fallback) node.append(element("p", "console-fallback", content.fallback));
    else {
      const grid = element("dl", "console-detail-grid");
      content.rows.forEach((row) => grid.append(element("dt", "", readableLabel(row.label)), element("dd", "", valueText(row.value, "-"))));
      node.append(grid, element("strong", "graphic-detail-total", `Total ${valueText(content.total, "-")}`));
    }
  } else if (content.kind === "sponsor") {
    node.append(element("span", "graphic-kicker", "Presentado por"), element("strong", "graphic-primary", content.title), element("span", "graphic-secondary", content.detail));
  } else node.append(element("strong", "graphic-message", valueText(content.title, "Mensaje de producción")));
  if (graphic.fallbackUsed) node.append(element("span", "console-fallback-flag", "Fallback"));
  return node;
}

function renderLayers(root, model) {
  if (!root) return;
  root.replaceChildren();
  PLAYGROUND_LAYER_IDS.forEach((layerId) => {
    const layer = model.state.layers[layerId];
    const row = document.createElement("tr");
    row.className = model.geometry.layerId === layerId ? "is-selected" : "";
    [layer.id, layer.order, layer.priority, layer.visible ? "Sí" : "No", layer.locked ? "Sí" : "No", layer.exclusive ? "Sí" : "No", layer.graphicIds.length, layer.outputIds.length || model.outputIds.length, layer.status]
      .forEach((value) => row.append(element("td", "", String(value))));
    const actions = element("td", "console-row-actions");
    [["select", "Seleccionar"], [layer.visible ? "hide" : "show", layer.visible ? "Ocultar" : "Mostrar"], [layer.locked ? "unlock" : "lock", layer.locked ? "Desbloquear" : "Bloquear"]]
      .forEach(([action, label]) => {
        const button = element("button", "button button-quiet button-small", label);
        button.type = "button";
        button.dataset.layerAction = action;
        button.dataset.layerId = layerId;
        actions.append(button);
      });
    row.append(actions);
    root.append(row);
  });
}

function renderOutputs(root, model) {
  if (!root) return;
  root.replaceChildren();
  listBroadcastOutputs().filter((output) => model.outputIds.includes(output.id)).forEach((output) => {
    const item = element("article", `console-output-item ${model.selectedOutputId === output.id ? "is-selected" : ""}`);
    const header = element("div", "console-item-header");
    header.append(element("strong", "", output.name), statusChip(output.status, output.status === "online" ? "ok" : output.status === "stale" ? "warning" : "error"));
    const meta = element("dl", "console-compact-definition");
    [
      ["Tipo", output.type], ["Resolución", `${output.resolution.width}×${output.resolution.height}`], ["Orientación", output.orientation],
      ["Aspect ratio", output.aspectRatio], ["Safe area", safeAreaText(output.safeArea)], ["Visibilidad", output.visibility],
      ["Heartbeat", output.heartbeat.status], ["Stale", output.status === "stale" ? "Sí" : "No"], ["Last applied", output.lastAppliedRevision],
      ["Layers", output.assignedLayers.length], ["Theme", output.themeId], ["Warnings", output.warnings.length], ["Errors", output.errors.length]
    ].forEach(([label, value]) => meta.append(definitionItem(label, value)));
    const actions = element("div", "console-row-actions");
    [["online", "Online"], ["offline", "Offline"], ["stale", "Stale"], ["heartbeat", "Heartbeat"]].forEach(([action, label]) => {
      const button = element("button", "button button-quiet button-small", label);
      button.type = "button";
      button.dataset.outputAction = action;
      button.dataset.outputId = output.id;
      actions.append(button);
    });
    item.append(header, meta, actions);
    root.append(item);
  });
}

function renderQueue(root, model) {
  if (!root) return;
  root.replaceChildren();
  const queue = getBroadcastQueue(model.state);
  if (!queue.length) {
    root.append(element("p", "console-empty-message", "La cola está vacía. No existe reproducción automática."));
    return;
  }
  queue.forEach((item, index) => {
    const row = element("article", "console-queue-item");
    const header = element("div", "console-item-header");
    header.append(element("strong", "", `${index + 1}. ${item.graphicId || "Gráfico"}`), statusChip(item.status, item.status === "queued" ? "neutral" : "warning"));
    const meta = element("dl", "console-compact-definition");
    [["Prioridad", item.priority], ["Template", item.templateId], ["Output", item.outputIds.join(", ")], ["Duración", item.duration], ["AutoHide", item.autoHide ? "Sí" : "No"], ["QueuedAt", item.queuedAt], ["QueuedBy", item.queuedBy], ["ExpiresAt", item.expiresAt]]
      .forEach(([label, value]) => meta.append(definitionItem(label, value)));
    const actions = element("div", "console-row-actions");
    [["up", "Subir prioridad"], ["down", "Bajar prioridad"], ["remove", "Quitar"]].forEach(([action, label]) => {
      const button = element("button", "button button-quiet button-small", label);
      button.type = "button";
      button.dataset.queueAction = action;
      button.dataset.queueId = item.queueItemId;
      actions.append(button);
    });
    row.append(header, meta, actions);
    root.append(row);
  });
}

function renderAssets(root, model) {
  if (!root) return;
  root.replaceChildren();
  listBroadcastAssets(model.assetRegistry).filter((asset) => model.visibility !== "public" || asset.visibility === "public").forEach((asset) => {
    const row = element("article", `console-asset-item ${model.selectedAssetId === asset.assetId ? "is-selected" : ""}`);
    row.append(
      element("strong", "", asset.name),
      element("span", "", `${asset.assetId} · familia ${asset.assetFamilyId}`),
      element("span", "", `v${asset.version} · ${asset.variants[0]?.variantId || "sin variante"}`),
      element("span", "", `${asset.scope} · ${asset.visibility} · ${asset.status}`),
      element("span", "", `Fallback ${asset.fallbackStrategy || "none"}`)
    );
    root.append(row);
  });
}

function renderVariables(root, model) {
  if (!root) return;
  root.replaceChildren();
  const inspector = buildConsoleVariablesInspector(model, "operational");
  const resolvedById = new Map((inspector.resolved || []).map((entry) => [entry.variableId, entry]));
  const variablesByKey = new Map(listProductionVariables(model.variableRegistry).map((variable) => [variable.key, variable]));
  const groups = [
    ["Textos", ["production.message", "production.blockTitle", "production.lowerThirdTitle", "production.lowerThirdSubtitle", "production.emergencyText", "production.nextBroadcast"]],
    ["Entrevista", ["production.interviewName", "production.interviewRole"]],
    ["Producción", ["production.activeCamera", "production.commercialCue", "production.bumperDuration", "production.customColor"]],
    ["Recursos", ["production.selectedSponsor", "production.qrAsset"]]
  ];
  groups.forEach(([label, keys]) => {
    const section = element("section", "console-variable-group");
    section.append(element("h3", "console-variable-group-title", label));
    keys.forEach((key) => {
      const variable = variablesByKey.get(key);
      if (!variable) return;
      const resolved = resolvedById.get(variable.variableId) || (inspector.resolved || []).find((entry) => entry.key === key);
      section.append(renderVariableControl(variable, resolved, model));
    });
    root.append(section);
  });
}

function renderVariableControl(variable, resolved, model) {
  const card = element("article", "console-variable-item");
  const header = element("div", "console-item-header");
  header.append(
    element("strong", "", variable.label),
    statusChip(variable.status, variable.status === "active" ? "ok" : variable.status === "disabled" ? "warning" : "error")
  );
  const field = element("label", "console-field");
  field.append(element("span", "", variable.dataType === "duration" ? `${variable.label} (ms)` : variable.label));
  const control = buildProductionVariableControl(variable, resolved, model);
  control.dataset.variableInput = variable.variableId;
  control.disabled = variable.status !== "active";
  field.append(control);
  const actions = element("div", "console-row-actions");
  [["save", "Guardar"], ["reset", "Reset"], ["toggle", variable.status === "active" ? "Desactivar" : "Activar"]].forEach(([action, label]) => {
    const button = element("button", "button button-quiet button-small", label);
    button.type = "button";
    button.dataset.variableAction = action;
    button.dataset.variableId = variable.variableId;
    if (action === "save" && variable.status !== "active") button.disabled = true;
    actions.append(button);
  });
  const meta = element("dl", "console-compact-definition console-variable-meta");
  [
    ["Scope", variable.scope],
    ["Valor efectivo", formatVariableValue(resolved?.value)],
    ["Procedencia", resolved?.sourceScope || "fallback"],
    ["Revisión", variable.revision],
    ["Expira", variable.expiresAt || "—"]
  ].forEach(([label, value]) => meta.append(definitionItem(label, value)));
  card.append(header, field, actions, meta);
  return card;
}

function buildProductionVariableControl(variable, resolved, model) {
  const effective = resolved?.resolved ? resolved.value : variable.value ?? variable.defaultValue;
  if (variable.dataType === "enum") {
    const select = document.createElement("select");
    populateSelect(select, variable.options.map((value) => ({ value, label: readableLabel(value) })), effective);
    return select;
  }
  if (variable.dataType === "asset_ref") {
    const select = document.createElement("select");
    const assets = listBroadcastAssets(model.assetRegistry).filter((asset) => asset.status === "published");
    populateSelect(select, [{ value: "", label: "Sin recurso" }, ...assets.map((asset) => ({ value: asset.assetId, label: asset.name }))], effective?.assetId || "");
    return select;
  }
  const input = document.createElement(["production.message", "production.emergencyText", "production.commercialCue"].includes(variable.key) ? "textarea" : "input");
  if (input.tagName === "INPUT") {
    input.type = variable.dataType === "boolean" ? "checkbox"
      : ["number", "duration"].includes(variable.dataType) ? "number"
        : variable.dataType === "date" ? "date"
          : variable.dataType === "datetime" ? "datetime-local"
            : "text";
  }
  if (variable.dataType === "boolean") input.checked = effective === true;
  else input.value = variable.dataType === "datetime" ? toDateTimeLocal(effective) : effective ?? "";
  if (["number", "duration"].includes(variable.dataType)) {
    input.min = variable.validation?.min ?? (variable.dataType === "duration" ? 0 : "");
    input.max = variable.validation?.max ?? "";
    input.step = variable.dataType === "duration" ? "1" : String(10 ** -(variable.validation?.decimals ?? 2));
  }
  if (variable.validation?.maxLength) input.maxLength = variable.validation.maxLength;
  return input;
}

function readProductionVariableControl(control, variable, model) {
  if (!control) throw consoleError("console-variable-control-not-found");
  if (variable.dataType === "boolean") return control.checked;
  if (["number", "duration"].includes(variable.dataType)) return control.value === "" ? null : Number(control.value);
  if (variable.dataType === "datetime") return control.value ? new Date(control.value).toISOString() : null;
  if (variable.dataType === "asset_ref") {
    if (!control.value) return null;
    const asset = listBroadcastAssets(model.assetRegistry).find((item) => item.assetId === control.value);
    return { assetId: control.value, version: asset?.version || null, variantId: asset?.variants?.[0]?.variantId || null };
  }
  return control.value;
}

function formatVariableValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return value.assetId || JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function toDateTimeLocal(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function renderOutputSynchronization(refs, model, runtime) {
  if (!refs.outputSynchronizationTargets) return;
  const snapshot = runtime.outputSynchronization && runtime.outputSynchronization.status !== "destroyed"
    ? buildOutputSynchronizationSnapshot(runtime.outputSynchronization)
    : model.outputSynchronizationSnapshot;
  const program = snapshot?.targets?.program_main || {};
  const announcer = snapshot?.targets?.announcer_monitor || {};
  const laboratory = model.fixtureSource?.metadata?.fixture !== false;
  if (refs.outputSynchronizationStatus) {
    refs.outputSynchronizationStatus.replaceChildren(
      statusChip(readableLabel(snapshot?.status || "uninitialized"), snapshot?.status === "synchronized" ? "ok" : snapshot?.status === "stale" || snapshot?.status === "partial" ? "warning" : "neutral"),
      element("span", `console-source-label ${laboratory ? "is-fixture" : "is-session"}`, laboratory ? "FIXTURE DE LABORATORIO" : "DATOS REALES DE LA SESIÓN")
    );
  }
  refs.outputSynchronizationTargets.replaceChildren(
    renderOutputSynchronizationTarget({
      id: "program_main",
      title: "Program Main",
      status: program.status,
      primaryRevision: model.officialProgramSnapshot?.revision ?? "—",
      primaryLabel: "Program revision",
      sourceRevision: program.sourceRevision,
      routeRevision: program.routeRevision,
      outputRevision: program.outputRevision,
      stale: program.stale,
      lastSynchronizedAt: program.lastSynchronizedAt,
      warnings: program.warnings,
      errors: program.errors,
      actions: [["sync-program", "Sincronizar", "primary"], ["clear-program", "Limpiar salida", "danger"]],
      href: "./program-main-output.html",
      openLabel: "Abrir salida"
    }),
    renderOutputSynchronizationTarget({
      id: "announcer_monitor",
      title: "Announcer Monitor",
      status: announcer.status,
      primaryRevision: announcer.sourceRevision ?? "—",
      primaryLabel: "Source revision",
      sourceRevision: announcer.sourceRevision,
      routeRevision: announcer.routeRevision,
      outputRevision: announcer.outputRevision,
      stale: announcer.stale,
      lastSynchronizedAt: announcer.lastSynchronizedAt,
      warnings: announcer.warnings,
      errors: announcer.errors,
      actions: [["sync-announcer", "Sincronizar", "primary"], ["clear-announcer", "Limpiar monitor", "danger"]],
      href: "./announcer-monitor.html",
      openLabel: "Abrir monitor"
    })
  );
}

function renderOutputSynchronizationTarget(definition) {
  const card = element("article", "console-output-synchronization-card");
  card.dataset.outputSynchronizationTarget = definition.id;
  const heading = element("div", "console-output-synchronization-heading");
  heading.append(
    element("h3", "", definition.title),
    statusChip(readableLabel(definition.status || "ready"), definition.status === "synchronized" ? "ok" : definition.status === "stale" ? "warning" : definition.status === "error" ? "error" : "neutral")
  );
  const metrics = element("dl", "console-output-synchronization-metrics");
  [
    [definition.primaryLabel, definition.primaryRevision],
    ["Source revision", definition.sourceRevision ?? "—"],
    ["Route revision", definition.routeRevision ?? "—"],
    ["Output revision", definition.outputRevision ?? "—"],
    ["Stale", definition.stale ? "Sí" : "No"],
    ["Última sincronización", definition.lastSynchronizedAt || "—"]
  ].forEach(([label, value]) => metrics.append(definitionItem(label, value)));
  const diagnostics = element("div", "console-output-synchronization-diagnostics");
  diagnostics.append(
    element("span", "", `Warnings ${definition.warnings?.length || 0}`),
    element("span", "", `Errors ${definition.errors?.length || 0}`)
  );
  const actions = element("div", "console-output-synchronization-actions");
  definition.actions.forEach(([action, label, style]) => {
    const button = element("button", `button button-small button-${style}`, label);
    button.type = "button";
    button.dataset.outputSynchronizationAction = action;
    actions.append(button);
  });
  const link = element("a", "button button-small button-quiet", definition.openLabel);
  link.href = definition.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  actions.append(link);
  card.append(heading, metrics, diagnostics, actions);
  return card;
}

function renderOutputRouting(refs, model, runtime) {
  if (!refs.outputRoutingRoutes) return;
  const routes = runtime.outputRoutingEngine && runtime.outputRoutingEngine.state !== "destroyed"
    ? listOutputRoutes(runtime.outputRoutingEngine)
    : model.outputRoutingRoutes || [];
  const status = runtime.outputRoutingEngine && runtime.outputRoutingEngine.state !== "destroyed"
    ? getOutputRoutingStatus(runtime.outputRoutingEngine)
    : { state: model.outputRoutingState || "uninitialized", routes: routes.length, stale: 0 };
  if (refs.outputRoutingStatus) {
    refs.outputRoutingStatus.replaceChildren(
      statusChip(readableLabel(status.state), status.state === "routed" ? "ok" : status.state === "stale" ? "warning" : "neutral"),
      element("span", "console-meta", `${status.routes} rutas`)
    );
  }
  refs.outputRoutingRoutes.replaceChildren();
  PRODUCTION_CONSOLE_OUTPUT_ROUTES.forEach((definition) => {
    const route = routes.find((entry) => entry.routeId === definition.routeId) || null;
    const result = model.outputRoutingResults?.[definition.routeId] || null;
    const card = element("article", `console-output-route-card console-output-route-${definition.routeType.replaceAll("_", "-")}`);
    card.dataset.outputRoutingRouteId = definition.routeId;
    const heading = element("div", "console-output-route-heading");
    heading.append(
      element("h3", "", definition.name),
      statusChip(readableLabel(route?.status || "uninitialized"), route?.status === "routed" ? "ok" : route?.status === "stale" ? "warning" : route?.status === "disabled" ? "error" : "neutral")
    );
    const metrics = element("dl", "console-output-route-metrics");
    [
      ["Source revision", route?.sourceRevision ?? "—"],
      ["Route revision", route?.revision ?? "—"],
      ["Resolución", route ? `${route.resolution.width} × ${route.resolution.height}` : "—"],
      ["Visibilidad", route?.visibility || definition.visibility],
      ["Stale", route?.status === "stale" ? "Sí" : "No"]
    ].forEach(([label, value]) => metrics.append(definitionItem(label, value)));
    const preview = renderOutputRoutePreview(definition.routeType, result);
    const diagnostics = element("div", "console-output-route-diagnostics");
    const warningBlock = element("div", "");
    warningBlock.append(element("strong", "", "Warnings"));
    renderOutputRouteDiagnosticItems(warningBlock, route?.warnings || result?.warnings || [], "Sin warnings.");
    const errorBlock = element("div", "");
    errorBlock.append(element("strong", "", "Errors"));
    renderOutputRouteDiagnosticItems(errorBlock, route?.errors || result?.errors || [], "Sin errores.");
    diagnostics.append(warningBlock, errorBlock);
    const actions = element("div", "console-output-route-actions");
    [
      ["configure", "Configurar"],
      ["resolve", "Resolver"],
      ["update", "Actualizar"],
      ["enable", "Habilitar"],
      ["disable", "Deshabilitar"],
      ["clear", "Limpiar proyección"]
    ].forEach(([action, label]) => {
      const button = element("button", `button button-small ${action === "resolve" ? "button-primary" : action === "clear" ? "button-danger" : "button-quiet"}`, label);
      button.type = "button";
      button.dataset.outputRoutingAction = action;
      button.dataset.outputRoutingRouteId = definition.routeId;
      button.disabled = !route
        || (["resolve", "update", "disable", "clear"].includes(action) && route.enabled === false)
        || (action === "update" && !result)
        || (action === "enable" && route.enabled === true)
        || (action === "disable" && route.enabled === false);
      actions.append(button);
    });
    card.append(heading, metrics, preview, diagnostics, actions);
    refs.outputRoutingRoutes.append(card);
  });
}

function renderOutputRoutePreview(routeType, result) {
  const preview = element("div", "console-output-route-preview");
  const projection = result?.projection;
  if (!projection) {
    preview.append(element("p", "console-empty-message", "Proyección no resuelta."));
    return preview;
  }
  if (routeType === "program_main") {
    preview.append(
      element("span", "console-output-route-kicker", result.status === "controlled-empty" ? "CONTROLLED EMPTY" : "PROGRAM"),
      element("strong", "", projection.programId || "Program sin contenido"),
      element("span", "", projection.templateId || "Sin Template"),
      element("small", "", projection.themeId || "Sin Theme")
    );
    return preview;
  }
  if (routeType === "announcer_monitor") {
    preview.append(
      element("span", "console-output-route-kicker", "SOLO LECTURA"),
      element("strong", "", projection.current?.team?.name || projection.current?.participant?.name || "NO DISPONIBLE"),
      element("span", "", projection.current?.suerte?.name || "Suerte no disponible"),
      element("small", "", projection.timer?.display || projection.timer?.formattedTime || "Tiempo no disponible")
    );
    return preview;
  }
  preview.classList.add("console-output-route-timer-preview");
  preview.append(
    element("span", "console-output-route-kicker", "CRONÓMETRO OFICIAL · SOLO LECTURA"),
    element("strong", "console-output-route-time", projection.formattedTime || "—"),
    element("span", "", readableLabel(projection.status || "unavailable")),
    element("small", "", projection.suerte?.name || projection.contextRef?.suerteId || "Contexto no disponible")
  );
  return preview;
}

function renderOutputRouteDiagnosticItems(root, values, emptyText) {
  const entries = uniqueStrings(values || []);
  if (!entries.length) {
    root.append(element("span", "console-empty-message", emptyText));
    return;
  }
  entries.slice(0, 5).forEach((entry) => root.append(element("span", "", entry)));
}

function renderSystem(root, model) {
  if (!root) return;
  const status = getProductionSystemStatus(model);
  root.replaceChildren(statusChip(status.label, status.level));
  const grid = element("dl", "console-system-grid");
  [
    ["State revision", status.stateRevision], ["Preview revision", status.previewRevision], ["Program revision", status.programRevision],
    ["Output applied", status.outputRevision], ["Contract", BROADCAST_DATA_CONTRACT_VERSION], ["State", BROADCAST_STATE_VERSION],
    ["Output", BROADCAST_OUTPUT_VERSION], ["Output Routing", OUTPUT_ROUTING_VERSION], ["Output Sync", OUTPUT_SYNCHRONIZATION_VERSION], ["Asset Manager", ASSET_MANAGER_VERSION], ["Action Engine", BROADCAST_ACTION_ENGINE_VERSION], ["Variables", PRODUCTION_VARIABLES_VERSION], ["Components", COMPONENT_LIBRARY_VERSION], ["Renderer", COMPONENT_RENDERER_VERSION], ["Template Renderer", TEMPLATE_RENDERER_INTEGRATION_VERSION], ["Theme + Template", THEME_TEMPLATE_INTEGRATION_VERSION], ["Context stale", status.contextStale ? "Sí" : "No"],
    ["Output stale", status.outputStale ? "Sí" : "No"], ["Preview activo", status.previewActive ? "Sí" : "No"],
    ["Program activo", status.programActive ? "Sí" : "No"], ["Modo seguro", status.safeMode ? "Sí" : "No"],
    ["Warnings", status.warnings.length], ["Errors", status.errors.length]
  ].forEach(([label, value]) => grid.append(definitionItem(label, value)));
  const recent = element("section", "console-action-history");
  recent.append(element("h4", "", "Últimas acciones"));
  const history = (model.actionHistory || []).slice(0, 8);
  const showOperationalActor = (VISIBILITY_RANK[model.visibility] ?? VISIBILITY_RANK.production) >= VISIBILITY_RANK.operational;
  if (!history.length) recent.append(element("p", "console-empty-message", "No hay acciones operativas en esta sesión."));
  history.forEach((item) => {
    const row = element("article", "console-action-history-item");
    const actionIdentity = showOperationalActor
      ? `${item.actor?.name || item.actor?.role || "Sistema"} · ${item.timestamp || "-"}`
      : item.timestamp || "-";
    row.append(
      element("strong", "", item.actionType),
      statusChip(item.status, item.success ? "ok" : item.status === "pending_confirmation" ? "warning" : "error"),
      element("span", "", item.resultCode),
      element("span", "", actionIdentity),
      element("span", "", `Rev ${valueText(item.stateRevisionBefore, "-")} → ${valueText(item.stateRevisionAfter, "-")}`)
    );
    recent.append(row);
  });
  root.append(grid, recent);
}

function renderInspectorTabs(root, model) {
  if (!root) return;
  root.replaceChildren();
  inspectorKeys().forEach((key) => {
    const button = element("button", `console-tab ${model.inspectorTab === key ? "is-active" : ""}`, inspectorLabel(key));
    button.type = "button";
    button.dataset.inspectorTab = key;
    root.append(button);
  });
}

function renderThemeLab(refs, model) {
  const root = refs.themeLab;
  if (!root) return;
  root.hidden = model.inspectorTab !== "themes";
  const themes = listBroadcastThemes(model.themeRegistry);
  const selected = getBroadcastTheme(model.themeRegistry, model.selectedThemeId)
    || getBroadcastTheme(model.themeRegistry, model.themeRegistry.activeThemeId)
    || themes[0]
    || null;
  populateSelect(refs.themeSelect, themes.map((theme) => ({
    value: theme.id,
    label: `${theme.name} · ${readableLabel(theme.status)}`
  })), selected?.id || "");
  let resolved = null;
  let resolutionError = null;
  if (selected) {
    try {
      resolved = resolveBroadcastTheme(model.themeRegistry, selected.id);
    } catch (error) {
      resolutionError = error?.code || error?.message || "theme-resolution-failed";
    }
  }
  if (refs.themeStatus) {
    refs.themeStatus.replaceChildren(
      statusChip(selected ? readableLabel(selected.status) : "Sin tema", selected?.status === "active" ? "ok" : selected?.status === "error" ? "error" : "warning"),
      element("span", "console-meta", `${themes.length} temas`),
      element("span", "console-meta", `Registro rev ${model.themeRegistry.revision}`),
      element("span", "console-meta", selected?.baseThemeId ? `Base ${selected.baseThemeId}` : "Tema base")
    );
  }
  const hasChildren = selected && themes.some((theme) => theme.baseThemeId === selected.id);
  refs.themeActions.forEach((button) => {
    const action = button.dataset.themeAction;
    if (action === "create") button.disabled = false;
    else if (!selected) button.disabled = true;
    else if (action === "delete") button.disabled = !["draft", "error"].includes(selected.status) || hasChildren;
    else if (action === "activate") button.disabled = selected.status === "active" || !["published", "inactive"].includes(selected.status);
    else if (action === "deactivate") button.disabled = selected.status !== "active";
    else button.disabled = false;
  });
  renderThemePalette(refs.themePalette, resolved?.colors || {});
  renderThemeTypography(refs.themeTypography, resolved?.typography || {});
  renderThemeAssetReferences(refs.themeLogos, resolved?.logos || {}, "No hay logos configurados.");
  renderThemeBackgrounds(refs.themeBackgrounds, resolved?.backgrounds || {});
  renderThemeWatermarks(refs.themeWatermark, resolved?.watermarks || {});
  renderThemeBorders(refs.themeBorders, resolved?.borders || {}, resolved?.shadows || {});
  renderThemeComponents(refs.themeComponents, resolved);
  renderDiagnosticList(refs.themeWarnings, model.themeWarnings, "Sin warnings de temas.");
  renderDiagnosticList(refs.themeErrors, uniqueStrings([...(model.themeErrors || []), ...(resolutionError ? [resolutionError] : [])]), "Sin errores de temas.");
}

function renderThemePalette(root, colors) {
  if (!root) return;
  root.replaceChildren();
  Object.entries(colors).forEach(([name, color]) => {
    const item = element("div", "console-theme-swatch");
    const sample = element("span", "console-theme-swatch-color");
    sample.style.backgroundColor = color;
    item.append(sample, element("strong", "", name), element("span", "", color));
    root.append(item);
  });
  if (!root.children.length) root.append(element("p", "console-empty-message", "No hay colores configurados."));
}

function renderThemeTypography(root, typography) {
  if (!root) return;
  root.replaceChildren();
  Object.entries(typography).forEach(([name, token]) => {
    const item = element("div", "console-theme-type-sample");
    const sample = element("span", "", name === "score" ? "303" : "CharroPro Broadcast");
    sample.style.fontFamily = [token.family, ...(token.fallbacks || [])].filter(Boolean).join(", ");
    sample.style.fontWeight = String(token.weight ?? 400);
    sample.style.fontSize = `${Math.min(token.size || 24, 42)}px`;
    sample.style.lineHeight = String(token.lineHeight || 1.2);
    sample.style.letterSpacing = `${Math.min(token.tracking || 0, 3)}px`;
    sample.style.textTransform = token.uppercase ? "uppercase" : token.capitalize ? "capitalize" : "none";
    sample.style.fontStyle = token.italic ? "italic" : "normal";
    item.append(element("strong", "", name), sample, element("small", "", `${token.family || "—"} · ${token.size ?? "—"} · ${token.weight ?? "—"}`));
    root.append(item);
  });
  if (!root.children.length) root.append(element("p", "console-empty-message", "No hay tipografías configuradas."));
}

function renderThemeAssetReferences(root, references, emptyText) {
  if (!root) return;
  root.replaceChildren();
  Object.entries(references).forEach(([name, reference]) => {
    const item = element("div", "console-theme-asset-reference");
    item.append(
      element("span", "console-theme-asset-placeholder", name.slice(0, 2).toUpperCase()),
      element("strong", "", name),
      element("span", "", reference.assetId || "Sin asset"),
      element("small", "", reference.variantId || "variante por defecto")
    );
    root.append(item);
  });
  if (!root.children.length) root.append(element("p", "console-empty-message", emptyText));
}

function renderThemeBackgrounds(root, backgrounds) {
  if (!root) return;
  root.replaceChildren();
  Object.entries(backgrounds).forEach(([name, background]) => {
    const item = element("div", "console-theme-background-sample");
    const sample = element("span", "console-theme-background-visual");
    if (background.type === "solid") sample.style.backgroundColor = background.color;
    else if (background.type === "gradient" && background.stops?.length >= 2) {
      const stops = background.stops.map((stop) => `${stop.color} ${stop.position * 100}%`).join(", ");
      sample.style.backgroundImage = `linear-gradient(${background.angle}deg, ${stops})`;
    } else if (background.type === "transparent") sample.classList.add("is-transparent");
    item.append(sample, element("strong", "", name), element("span", "", background.type));
    if (background.type === "asset") item.append(element("small", "", background.asset?.assetId || "Sin asset"));
    root.append(item);
  });
  if (!root.children.length) root.append(element("p", "console-empty-message", "No hay fondos configurados."));
}

function renderThemeWatermarks(root, watermarks) {
  if (!root) return;
  root.replaceChildren();
  Object.entries(watermarks).forEach(([name, watermark]) => {
    const item = element("div", "console-theme-watermark-item");
    item.append(
      element("strong", "", name),
      element("span", "", watermark.asset?.assetId || "Sin asset"),
      element("small", "", `${watermark.position} · opacidad ${watermark.opacity}`)
    );
    root.append(item);
  });
  if (!root.children.length) root.append(element("p", "console-empty-message", "No hay marca de agua configurada."));
}

function renderThemeBorders(root, borders, shadows) {
  if (!root) return;
  root.replaceChildren();
  Object.entries(borders).forEach(([name, border]) => {
    const item = element("div", "console-theme-border-sample", name);
    item.style.borderWidth = `${border.width ?? 0}px`;
    item.style.borderStyle = border.style || "solid";
    item.style.borderColor = border.color || "transparent";
    item.style.borderRadius = `${border.radius ?? 0}px`;
    const shadow = shadows[name] || shadows.panel;
    if (shadow) item.style.boxShadow = `${shadow.x}px ${shadow.y}px ${shadow.blur}px color-mix(in srgb, ${shadow.color} ${shadow.opacity * 100}%, transparent)`;
    root.append(item);
  });
  if (!root.children.length) root.append(element("p", "console-empty-message", "No hay bordes configurados."));
}

function renderThemeComponents(root, theme) {
  if (!root) return;
  root.replaceChildren();
  if (!theme) {
    root.append(element("p", "console-empty-message", "No hay tema resuelto para la muestra."));
    return;
  }
  const samples = [
    ["Marcador", "Rancho El Laurel", "303"],
    ["Lower third", "Juan Pérez", "Charro Completo"],
    ["Cronómetro", "Tiempo oficial", "00:42.8"]
  ];
  samples.forEach(([label, title, value]) => {
    const sample = element("article", "console-theme-component-sample");
    sample.style.backgroundColor = theme.colors.surface;
    sample.style.color = theme.colors.textPrimary;
    sample.style.borderColor = theme.colors.border;
    sample.style.borderRadius = `${theme.radius.md ?? 0}px`;
    const eyebrow = element("span", "", label);
    eyebrow.style.color = theme.colors.accent;
    const heading = element("strong", "", title);
    heading.style.fontFamily = theme.typography.heading?.family || theme.typography.body?.family || "sans-serif";
    heading.style.fontWeight = String(theme.typography.heading?.weight ?? 700);
    const data = element("b", "", value);
    data.style.color = theme.colors.highlight;
    data.style.fontFamily = theme.typography.score?.family || theme.typography.body?.family || "sans-serif";
    data.style.fontWeight = String(theme.typography.score?.weight ?? 800);
    sample.append(eyebrow, heading, data);
    root.append(sample);
  });
}

function renderTemplateLab(refs, model) {
  const root = refs.templateLab;
  if (!root) return;
  root.hidden = model.inspectorTab !== "templates";
  const selected = model.selectedTemplateId ? getRegisteredTemplate(model.templateRegistry, model.selectedTemplateId) : null;
  if (refs.templateStatus) {
    refs.templateStatus.replaceChildren(
      statusChip(selected ? readableLabel(selected.status) : "Sin template", selected?.status === "error" ? "error" : selected ? "ok" : "warning"),
      element("span", "console-meta", readableLabel(model.templateFixtureType)),
      element("span", "console-meta", `${listRegisteredTemplates(model.templateRegistry).length} registrados`),
      element("span", "console-meta", model.templateInstanceResult ? "Instanciado" : "Sin instancia")
    );
  }
  refs.templateActions.forEach((button) => {
    button.disabled = button.dataset.templateAction !== "create" && !selected;
  });
  renderDiagnosticList(refs.templateWarnings, model.templateWarnings, "Sin warnings de templates.");
  renderDiagnosticList(refs.templateErrors, model.templateErrors, "Sin errores de templates.");
}

function renderTemplateRendererLab(refs, model, runtime) {
  const root = refs.templateRendererLab;
  if (!root) return;
  root.hidden = model.inspectorTab !== "templates";
  const templates = listRegisteredTemplates(model.templateRegistry);
  populateSelect(refs.templateRendererTemplate, [
    { value: "", label: "Selecciona un template" },
    ...templates.map((template) => ({ value: template.templateId, label: `${template.name} · ${readableLabel(template.templateType)}` }))
  ], model.selectedTemplateId || "");
  const themes = listBroadcastThemes(model.themeRegistry);
  populateSelect(refs.templateRendererTheme, themes.map((theme) => ({
    value: theme.themeId,
    label: `${theme.name} · ${theme.metadata?.brandingStatus || "neutral"}`
  })), model.themeTemplateThemeId || "theme_default");
  const selected = model.selectedTemplateId ? getRegisteredTemplate(model.templateRegistry, model.selectedTemplateId) : null;
  const selectedTheme = getBroadcastTheme(model.themeRegistry, model.themeTemplateThemeId);
  const output = getComponentRendererOutput(model.templateRendererOutputId);
  if (refs.templateRendererFrame) {
    refs.templateRendererFrame.style.aspectRatio = `${output.width} / ${output.height}`;
    refs.templateRendererFrame.dataset.orientation = output.orientation;
  }
  if (refs.templateRendererSafeArea) {
    refs.templateRendererSafeArea.style.top = `${(output.safeArea.top / output.height) * 100}%`;
    refs.templateRendererSafeArea.style.right = `${(output.safeArea.right / output.width) * 100}%`;
    refs.templateRendererSafeArea.style.bottom = `${(output.safeArea.bottom / output.height) * 100}%`;
    refs.templateRendererSafeArea.style.left = `${(output.safeArea.left / output.width) * 100}%`;
  }
  const runtimeState = runtime.themeTemplateIntegration?.state || model.themeTemplateState;
  const officialState = runtime.officialPreviewEngine
    ? getPreviewState(runtime.officialPreviewEngine)
    : model.officialPreviewState;
  if (refs.templateRendererStatus) {
    refs.templateRendererStatus.replaceChildren(
      statusChip(`Template ${selected ? readableLabel(selected.status) : "sin selección"}`, selected ? "ok" : "warning"),
      statusChip(`Theme ${selectedTheme?.name || "sin selección"}`, selectedTheme ? "ok" : "warning"),
      statusChip(`Preview ${readableLabel(officialState)}`, officialState === "error" ? "error" : officialState === "uninitialized" ? "warning" : "ok"),
      statusChip(`Integración ${readableLabel(runtimeState)}`, runtimeState === "error" ? "error" : runtimeState === "uninitialized" ? "warning" : "ok")
    );
  }
  if (refs.templateRendererMetrics) {
    const result = model.officialPreview;
    const resolution = model.themeTemplateResolution;
    refs.templateRendererMetrics.replaceChildren(
      definitionItem("Preview ID", result?.previewId || "—"),
      definitionItem("Estado", readableLabel(officialState)),
      definitionItem("Revision", result?.revision ?? 0),
      definitionItem("Template", selected?.name || "—"),
      definitionItem("Template Instance", result?.templateInstanceId || model.templateInstanceResult?.templateInstance?.templateInstanceId || "—"),
      definitionItem("Theme", result?.themeId || resolution?.themeId || selectedTheme?.themeId || "—"),
      definitionItem("Theme version", resolution?.themeVersion || selectedTheme?.themeVersion || "—"),
      definitionItem("Branding", resolution?.brandingStatus || selectedTheme?.metadata?.brandingStatus || "neutral"),
      definitionItem("Scope", resolution?.themeScope || selectedTheme?.scope || "—"),
      definitionItem("Resolved from", resolution?.resolvedFrom?.join(" → ") || "—"),
      definitionItem("Selección", resolution?.selectionReason || "—"),
      definitionItem("Fallback", resolution?.fallbackUsed ? "Sí" : "No"),
      definitionItem("Theme Render", result?.themeRenderId || "—"),
      definitionItem("Template Render", result?.templateRenderId || "—"),
      definitionItem("Output", output.label),
      definitionItem("Resolución", `${output.width} x ${output.height}`),
      definitionItem("Safe area", `${output.safeArea.top}/${output.safeArea.right}/${output.safeArea.bottom}/${output.safeArea.left}`),
      definitionItem("Visibilidad", model.templateRendererVisibility)
    );
  }
  refs.templateRendererActions.forEach((button) => {
    const action = button.dataset.templateRendererAction;
    if (["instantiate", "prepare"].includes(action)) button.disabled = !selected;
    else if (action === "resolve-theme") button.disabled = !selected || !selectedTheme;
    else if (action === "render") button.disabled = !model.themeTemplatePreparation || Boolean(model.themeTemplateResult);
    else if (["change-theme", "update"].includes(action)) button.disabled = !model.themeTemplateResult || !selectedTheme;
    else if (action === "clear") button.disabled = !model.themeTemplateResult && runtimeState !== "partially_rendered" && runtimeState !== "rendered";
    else if (action === "copy-snapshot") button.disabled = !model.themeTemplateSnapshot;
  });
  refs.officialPreviewActions.forEach((button) => {
    const action = button.dataset.officialPreviewAction;
    if (action === "prepare") button.disabled = !selected || officialState === "rendering" || officialState === "updating";
    else if (action === "render") button.disabled = officialState !== "prepared";
    else if (action === "update") button.disabled = officialState !== "rendered" || !selectedTheme;
    else if (action === "clear") button.disabled = !model.officialPreview;
    else if (action === "snapshot") button.disabled = !model.officialPreviewSnapshot;
  });
  renderDiagnosticList(refs.templateRendererWarnings, model.officialPreviewWarnings, "Sin warnings de Official Preview.");
  renderDiagnosticList(refs.templateRendererErrors, model.officialPreviewErrors, "Sin errores de Official Preview.");
}

function renderOfficialProgramLab(refs, model, runtime) {
  if (!refs.officialProgramLab) return;
  refs.officialProgramLab.hidden = model.inspectorTab !== "templates";
  const state = runtime.officialProgramEngine
    ? getProgramState(runtime.officialProgramEngine)
    : model.officialProgramState;
  const program = model.officialProgram;
  const output = program?.output || model.officialPreview?.output || {};
  const resolution = output.resolution || {};
  const width = Number(resolution.width) || 1920;
  const height = Number(resolution.height) || 1080;
  if (refs.officialProgramFrame) {
    refs.officialProgramFrame.style.aspectRatio = `${width} / ${height}`;
    refs.officialProgramFrame.dataset.orientation = output.orientation || (height > width ? "portrait" : "landscape");
  }
  if (refs.officialProgramStatus) {
    refs.officialProgramStatus.replaceChildren(
      statusChip(`Estado ${readableLabel(state)}`, state === "error" ? "error" : state === "ready" ? "warning" : "ok"),
      statusChip(program ? "AL AIRE" : "SIN PROGRAM", program ? "error" : "warning"),
      statusChip(program?.transitionMode ? readableLabel(program.transitionMode) : "Sin transición", program ? "ok" : "warning")
    );
  }
  if (refs.officialProgramMetrics) {
    refs.officialProgramMetrics.replaceChildren(
      definitionItem("Program ID", program?.programId || "—"),
      definitionItem("Estado", readableLabel(state)),
      definitionItem("Revision", program?.revision ?? 0),
      definitionItem("Theme", program?.themeId || "—"),
      definitionItem("Template", program?.templateId || "—"),
      definitionItem("Output", program?.output?.outputId || "—"),
      definitionItem("Preview fuente", program?.previewId || "—"),
      definitionItem("Resolución", `${width} x ${height}`),
      definitionItem("Visibilidad", program?.visibility || model.templateRendererVisibility)
    );
  }
  if (refs.officialProgramTarget) {
    if (!program) {
      refs.officialProgramTarget.replaceChildren();
      runtime.officialProgramVisualRoot = null;
    } else if (runtime.officialProgramVisualRoot && refs.officialProgramTarget.firstElementChild !== runtime.officialProgramVisualRoot) {
      refs.officialProgramTarget.replaceChildren(runtime.officialProgramVisualRoot);
    } else if (!runtime.officialProgramVisualRoot) {
      const root = element("div", "console-official-program-slate");
      root.replaceChildren(
        element("span", "console-official-program-live", "AL AIRE"),
        element("strong", "", program.templateId),
        element("span", "console-meta", `${program.themeId} · ${program.output.outputId}`)
      );
      runtime.officialProgramVisualRoot = root;
      refs.officialProgramTarget.replaceChildren(root);
    }
  }
  refs.officialProgramActions.forEach((button) => {
    const action = button.dataset.officialProgramAction;
    if (action === "prepare") button.disabled = model.officialPreview?.status !== "rendered" || model.officialPreviewErrors.length > 0;
    else if (["take", "cut", "auto"].includes(action)) button.disabled = state !== "prepared";
    else if (action === "update") button.disabled = !program || !model.officialPreview;
    else if (action === "clear") button.disabled = !program;
    else if (action === "snapshot") button.disabled = !model.officialProgramSnapshot;
  });
  renderDiagnosticList(refs.officialProgramWarnings, model.officialProgramWarnings, "Sin warnings de Official Program.");
  renderDiagnosticList(refs.officialProgramErrors, model.officialProgramErrors, "Sin errores de Official Program.");
}

function renderComponentRendererLab(refs, model, runtime) {
  const root = refs.componentRendererLab;
  if (!root) return;
  root.hidden = model.inspectorTab !== "components";
  const output = getComponentRendererOutput(model.componentRendererOutputId);
  if (refs.componentRendererFrame) {
    refs.componentRendererFrame.style.aspectRatio = `${output.width} / ${output.height}`;
    refs.componentRendererFrame.dataset.orientation = output.orientation;
  }
  if (refs.componentRendererSafeArea) {
    refs.componentRendererSafeArea.style.top = `${(output.safeArea.top / output.height) * 100}%`;
    refs.componentRendererSafeArea.style.right = `${(output.safeArea.right / output.width) * 100}%`;
    refs.componentRendererSafeArea.style.bottom = `${(output.safeArea.bottom / output.height) * 100}%`;
    refs.componentRendererSafeArea.style.left = `${(output.safeArea.left / output.width) * 100}%`;
  }
  const runtimeState = runtime.componentRenderer?.state || model.componentRendererState;
  if (refs.componentRendererStatus) {
    refs.componentRendererStatus.replaceChildren(
      statusChip(readableLabel(runtimeState), runtimeState === "error" ? "error" : runtimeState === "destroyed" ? "warning" : "ok"),
      element("span", "console-meta", readableLabel(model.componentRendererFixtureType)),
      element("span", "console-meta", `${output.width} x ${output.height}`),
      element("span", "console-meta", output.orientation)
    );
  }
  renderDiagnosticList(refs.componentRendererWarnings, model.componentRendererWarnings, "Sin warnings del renderer.");
  renderDiagnosticList(refs.componentRendererErrors, model.componentRendererErrors, "Sin errores del renderer.");
}

function renderDiagnosticList(root, values, emptyText) {
  if (!root) return;
  root.replaceChildren();
  const items = uniqueStrings(values || []);
  if (!items.length) {
    root.append(element("span", "console-empty-message", emptyText));
    return;
  }
  items.forEach((value) => root.append(element("span", "console-diagnostic-item", value)));
}

function renderInspector(root, model) {
  if (!root) return;
  const inspector = getProductionConsoleInspector(model);
  if (model.inspectorTab === "components") {
    renderComponentManager(root, inspector.components);
    return;
  }
  if (model.inspectorTab === "templates") {
    renderTemplateManager(root, inspector.templates);
    return;
  }
  if (model.inspectorTab === "themes") {
    renderThemeManager(root, inspector.themes);
    return;
  }
  const value = inspectorValue(inspector, model.inspectorTab);
  root.replaceChildren();
  const toolbar = element("div", "console-inspector-toolbar");
  toolbar.append(element("strong", "", inspectorLabel(model.inspectorTab)));
  const copy = element("button", "button button-quiet button-small", "Copiar JSON");
  copy.type = "button";
  copy.dataset.copyJson = "true";
  const refresh = element("button", "button button-quiet button-small", "Actualizar inspector");
  refresh.type = "button";
  refresh.dataset.consoleAction = "refresh-inspector";
  toolbar.append(copy, refresh);
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(value, null, 2);
  root.append(toolbar, pre);
}

function renderComponentManager(root, componentsInspector) {
  root.replaceChildren();
  const selected = componentsInspector?.selected || null;
  const toolbar = element("div", "console-inspector-toolbar console-component-toolbar");
  toolbar.append(element("strong", "", "Componentes"));
  [["create", "Crear componente de prueba"], ["duplicate", "Duplicar"], ["delete", "Eliminar"]].forEach(([action, label]) => {
    const button = element("button", "button button-quiet button-small", label);
    button.type = "button";
    button.dataset.componentAction = action;
    if (action !== "create" && !selected) button.disabled = true;
    toolbar.append(button);
  });

  const layout = element("div", "console-component-manager");
  const library = element("section", "console-component-library");
  library.append(element("h4", "", "Lista"));
  const componentList = componentsInspector?.registry?.components || [];
  if (!componentList.length) library.append(element("p", "console-empty-message", "No hay componentes en esta sesión."));
  componentList.forEach((component) => {
    const button = element("button", `console-component-item ${selected?.componentId === component.componentId ? "is-selected" : ""}`);
    button.type = "button";
    button.dataset.componentId = component.componentId;
    button.append(
      element("strong", "", component.name),
      element("span", "", `${component.componentType} · ${component.status}`),
      element("span", "", `v${component.componentVersion} · rev ${component.componentRevision}`)
    );
    library.append(button);
  });

  const detail = element("section", "console-component-detail");
  detail.append(element("h4", "", "Inspector"));
  if (!selected) detail.append(element("p", "console-empty-message", "Crea o selecciona un componente para inspeccionarlo."));
  else {
    const definition = element("dl", "console-compact-definition console-component-definition");
    [
      ["ID", selected.componentId], ["Nombre", selected.name], ["Tipo", selected.componentType],
      ["Estado", selected.status], ["Visibilidad", selected.visibility], ["Bindings", selected.bindings.length],
      ["Versión", selected.componentVersion], ["Revisión", selected.componentRevision]
    ].forEach(([label, value]) => definition.append(definitionItem(label, value)));
    detail.append(definition);
  }

  const snapshot = element("section", "console-component-snapshot");
  snapshot.append(element("h4", "", "Inspector de componente y renderer"));
  const copy = element("button", "button button-quiet button-small", "Copiar JSON");
  copy.type = "button";
  copy.dataset.copyJson = "true";
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify({
    component: componentsInspector?.snapshot || null,
    renderer: componentsInspector?.renderer || null
  }, null, 2);
  snapshot.append(copy, pre);
  layout.append(library, detail, snapshot);
  root.append(toolbar, layout);
}

function renderTemplateManager(root, templatesInspector) {
  root.replaceChildren();
  const selected = templatesInspector?.selected || null;
  const toolbar = element("div", "console-inspector-toolbar console-template-toolbar");
  toolbar.append(element("strong", "", "Templates"));
  const copy = element("button", "button button-quiet button-small", "Copiar JSON");
  copy.type = "button";
  copy.dataset.copyJson = "template-snapshot";
  toolbar.append(copy);

  const layout = element("div", "console-template-manager");
  const library = element("section", "console-template-library");
  library.append(element("h4", "", "Registro en memoria"));
  const templates = templatesInspector?.registry?.templates || [];
  if (!templates.length) library.append(element("p", "console-empty-message", "Crea un template desde un fixture para comenzar."));
  templates.forEach((template) => {
    const button = element("button", `console-template-item ${selected?.templateId === template.templateId ? "is-selected" : ""}`);
    button.type = "button";
    button.dataset.templateId = template.templateId;
    button.append(
      element("strong", "", template.name),
      element("span", "", `${readableLabel(template.templateType)} · ${template.status}`),
      element("span", "", `v${template.templateVersion} · rev ${template.revision}`)
    );
    library.append(button);
  });

  const detail = element("section", "console-template-detail");
  detail.append(element("h4", "", "Inspector"));
  if (!selected) detail.append(element("p", "console-empty-message", "No hay un template seleccionado."));
  else {
    const definition = element("dl", "console-compact-definition console-template-definition");
    [
      ["ID", selected.templateId], ["Nombre", selected.name], ["Tipo", readableLabel(selected.templateType)],
      ["Estado", selected.status], ["Visibilidad", selected.visibility], ["Componentes", selected.components.length],
      ["Layout", selected.layout.mode], ["Outputs", selected.outputs.join(", ") || "—"],
      ["Versión", selected.templateVersion], ["Revisión", selected.revision]
    ].forEach(([label, value]) => definition.append(definitionItem(label, value)));
    detail.append(definition);
  }

  const snapshot = element("section", "console-template-snapshot");
  snapshot.append(element("h4", "", "Inspector de Template y composición"));
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify({
    templateDefinition: selected,
    templateInstance: templatesInspector?.instance || null,
    preparedTemplate: templatesInspector?.rendererIntegration?.preparation || null,
    templateRenderResult: templatesInspector?.rendererIntegration?.result || null,
    componentResults: templatesInspector?.rendererIntegration?.componentResults || [],
    templateRenderSnapshot: templatesInspector?.rendererIntegration?.snapshot || null,
    warnings: templatesInspector?.rendererIntegration?.warnings || [],
    errors: templatesInspector?.rendererIntegration?.errors || []
  }, null, 2);
  snapshot.append(pre);
  layout.append(library, detail, snapshot);
  root.append(toolbar, layout);
}

function renderThemeManager(root, themesInspector) {
  root.replaceChildren();
  const selected = themesInspector?.selected || null;
  const resolved = themesInspector?.resolved || null;
  const toolbar = element("div", "console-inspector-toolbar console-theme-toolbar");
  toolbar.append(element("strong", "", "Themes"));
  const copy = element("button", "button button-quiet button-small", "Copiar Snapshot");
  copy.type = "button";
  copy.dataset.copyJson = "theme-snapshot";
  toolbar.append(copy);

  const layout = element("div", "console-theme-manager");
  const library = element("section", "console-theme-library");
  library.append(element("h4", "", "Registro en memoria"));
  const themes = themesInspector?.registry?.themes || [];
  if (!themes.length) library.append(element("p", "console-empty-message", "No hay temas visibles para este contexto."));
  themes.forEach((theme) => {
    const button = element("button", `console-theme-item ${selected?.id === theme.id ? "is-selected" : ""}`);
    button.type = "button";
    button.dataset.themeId = theme.id;
    button.append(
      element("strong", "", theme.name),
      element("span", "", `${readableLabel(theme.status)} · ${theme.visibility}`),
      element("span", "", `rev ${theme.revision}${theme.baseThemeId ? ` · base ${theme.baseThemeId}` : ""}`)
    );
    library.append(button);
  });

  const detail = element("section", "console-theme-detail");
  detail.append(element("h4", "", "Tema resuelto"));
  if (!selected) detail.append(element("p", "console-empty-message", "Selecciona un tema para inspeccionarlo."));
  else {
    const definition = element("dl", "console-compact-definition console-theme-definition");
    [
      ["ID", selected.id], ["Nombre", selected.name], ["Estado", readableLabel(selected.status)],
      ["Visibilidad", selected.visibility], ["Base", selected.baseThemeId || "—"],
      ["Herencia", resolved?.resolvedFrom?.join(" → ") || "—"], ["Revisión", selected.revision],
      ["Colores", Object.keys(resolved?.colors || {}).length], ["Tipografías", Object.keys(resolved?.typography || {}).length]
    ].forEach(([label, value]) => definition.append(definitionItem(label, value)));
    detail.append(definition);
  }

  const snapshot = element("section", "console-theme-snapshot");
  snapshot.append(element("h4", "", "Snapshot serializable"));
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(themesInspector?.snapshot || null, null, 2);
  snapshot.append(pre);
  layout.append(library, detail, snapshot);
  root.append(toolbar, layout);
}

function inspectorValue(inspector, key) {
  if (key === "data-contract") return inspector.contract;
  if (key === "broadcast-state") return inspector.state;
  if (key === "preview") return inspector.preview;
  if (key === "program") return inspector.program;
  if (key === "output") return inspector.output;
  if (key === "projection") return inspector.projection;
  if (key === "assets") return inspector.assets;
  if (key === "variables") return inspector.variables;
  if (key === "components") return inspector.components;
  if (key === "templates") return inspector.templates;
  if (key === "themes") return inspector.themes;
  if (key === "queue") return inspector.queue;
  if (key === "actions") return inspector.actions;
  if (key === "warnings") return inspector.warnings;
  return inspector.errors;
}

function inspectorKeys() {
  return ["data-contract", "broadcast-state", "preview", "program", "output", "projection", "assets", "variables", "components", "templates", "themes", "queue", "actions", "warnings", "errors"];
}

function normalizeInspectorTab(value) {
  return inspectorKeys().includes(value) ? value : "data-contract";
}

function inspectorLabel(value) {
  return {
    "data-contract": "Data Contract", "broadcast-state": "Broadcast State", preview: "Preview", program: "Program", output: "Output",
    projection: "Projection", assets: "Assets", variables: "Variables", components: "Componentes", templates: "Templates", themes: "Themes", queue: "Queue", actions: "Acciones", warnings: "Warnings", errors: "Errors"
  }[value] || value;
}

function readGeometryControls(refs) {
  return normalizeGeometry({
    position: { x: numberFromControl(refs.x), y: numberFromControl(refs.y), anchor: refs.anchor.value, unit: refs.unit.value },
    size: { width: numberFromControl(refs.width), height: numberFromControl(refs.height), unit: refs.unit.value },
    scale: numberFromControl(refs.scale),
    opacity: numberFromControl(refs.opacity),
    layerId: refs.layer.value
  });
}

function readAnimationControls(refs) {
  return normalizeAnimation({
    enter: refs.enterAnimation.value,
    exit: refs.exitAnimation.value,
    duration: numberFromControl(refs.duration),
    delay: numberFromControl(refs.delay),
    autoHide: refs.autoHide.checked
  });
}

function geometryPreset(name, current) {
  const base = cloneValue(current);
  const presets = {
    "top-left": { position: { x: 0.08, y: 0.08, anchor: "top-left", unit: "normalized" } },
    "top-right": { position: { x: 0.92, y: 0.08, anchor: "top-right", unit: "normalized" } },
    "bottom-left": { position: { x: 0.08, y: 0.92, anchor: "bottom-left", unit: "normalized" } },
    "bottom-right": { position: { x: 0.92, y: 0.92, anchor: "bottom-right", unit: "normalized" } },
    center: { position: { x: 0.5, y: 0.5, anchor: "center", unit: "normalized" } },
    fullscreen: { position: { x: 0, y: 0, anchor: "top-left", unit: "normalized" }, size: { width: 1, height: 1, unit: "normalized" }, scale: 1 },
    small: { size: { width: 0.28, height: 0.16, unit: "normalized" }, scale: 0.85 },
    medium: { size: { width: 0.55, height: 0.32, unit: "normalized" }, scale: 1 },
    large: { size: { width: 0.82, height: 0.62, unit: "normalized" }, scale: 1 }
  };
  const selected = presets[name] || {};
  return normalizeGeometry({ ...base, ...selected, position: { ...base.position, ...(selected.position || {}) }, size: { ...base.size, ...(selected.size || {}) } });
}

function applyGraphicGeometry(node, graphic) {
  node.style.left = cssPositionValue(graphic.position?.x, graphic.position?.unit);
  node.style.top = cssPositionValue(graphic.position?.y, graphic.position?.unit);
  node.style.width = cssSizeValue(graphic.size?.width, graphic.size?.unit);
  node.style.height = cssSizeValue(graphic.size?.height, graphic.size?.unit);
  node.style.opacity = String(graphic.opacity);
  node.style.setProperty("--graphic-scale", String(graphic.scale));
  node.style.setProperty("--anchor-x", anchorTranslateX(graphic.position?.anchor));
  node.style.setProperty("--anchor-y", anchorTranslateY(graphic.position?.anchor));
  node.style.setProperty("--animation-duration", `${graphic.duration ?? 350}ms`);
  node.style.setProperty("--animation-delay", `${graphic.delay ?? 0}ms`);
}

function applySafeArea(node, safeArea = {}, width, height) {
  const unit = safeArea.unit || "px";
  const toPercent = (value, axis) => unit === "%" ? `${value || 0}%` : unit === "normalized" ? `${(value || 0) * 100}%` : `${((value || 0) / axis) * 100}%`;
  node.style.top = toPercent(safeArea.top, height);
  node.style.right = toPercent(safeArea.right, width);
  node.style.bottom = toPercent(safeArea.bottom, height);
  node.style.left = toPercent(safeArea.left, width);
}

function cssPositionValue(value, unit) {
  return unit === "normalized" ? `${finiteNumber(value, 0) * 100}%` : `${finiteNumber(value, 0)}${unit || "%"}`;
}

function cssSizeValue(value, unit) {
  return unit === "normalized" ? `${positiveNumber(value, 0.1) * 100}%` : `${positiveNumber(value, 1)}${unit || "%"}`;
}

function anchorTranslateX(anchor) {
  if (["top-left", "bottom-left"].includes(anchor)) return "0%";
  if (["top-right", "bottom-right"].includes(anchor)) return "-100%";
  return "-50%";
}

function anchorTranslateY(anchor) {
  if (["top-left", "top-right"].includes(anchor)) return "0%";
  if (["bottom-left", "bottom-right"].includes(anchor)) return "-100%";
  return "-50%";
}

function populateSelect(select, entries, selectedValue) {
  if (!select) return;
  select.replaceChildren();
  entries.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = entry.value === selectedValue;
    select.append(option);
  });
}

function statusChip(label, level) {
  return element("span", `console-status console-status-${level}`, label);
}

function definitionItem(label, value) {
  const item = element("div", "console-definition-item");
  item.append(element("dt", "", label), element("dd", "", valueText(value, "-")));
  return item;
}

function element(tagName, className = "", textValue) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (textValue !== undefined) node.textContent = String(textValue);
  return node;
}

function setValue(control, value) {
  if (control && String(control.value) !== String(value ?? "")) control.value = value ?? "";
}

function numberFromControl(control) {
  const value = Number(control?.value);
  if (!Number.isFinite(value)) throw consoleError("console-number-invalid", { id: control?.id });
  return value;
}

function countExplicitConfirmations(messages) {
  let count = 0;
  for (const message of messages) {
    if (!window.confirm(message)) break;
    count += 1;
  }
  return count;
}

function safeAreaText(value = {}) {
  return `${value.top ?? 0} / ${value.right ?? 0} / ${value.bottom ?? 0} / ${value.left ?? 0} ${value.unit || "px"}`;
}

function readableLabel(value) {
  return String(value ?? "").replaceAll("_", " ").replaceAll("-", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());
}

function shouldRemoveInspectorField(normalizedKey, visibility) {
  const rank = VISIBILITY_RANK[visibility] ?? VISIBILITY_RANK.production;
  if (!normalizedKey) return false;
  if (INSPECTOR_SECRET_FIELDS.has(normalizedKey) || /(authorization|cookie|credential|password|privatekey|secret|signedurl|token|apikey)/.test(normalizedKey)) return true;
  if (rank < VISIBILITY_RANK.operational && (
    INSPECTOR_ACTOR_FIELDS.has(normalizedKey)
    || /^(approved|cleared|created|locked|modified|paused|prepared|published|queued|registered|taken|unlocked|updated)by$/.test(normalizedKey)
    || /^(actor|judge|operator|user)(id|name)?$/.test(normalizedKey)
  )) return true;
  if (rank < VISIBILITY_RANK.restricted && INSPECTOR_RESTRICTED_CONTEXT_FIELDS.has(normalizedKey)) return true;
  if (rank < VISIBILITY_RANK.operational && (
    INSPECTOR_OPERATIONAL_FIELDS.has(normalizedKey)
    || normalizedKey.startsWith("internal")
  )) return true;
  if (rank === VISIBILITY_RANK.public && INSPECTOR_PUBLIC_ONLY_FIELDS.has(normalizedKey)) return true;
  if (rank === VISIBILITY_RANK.public && ["cdnref", "externalurl", "localdevelopmentref", "storageref"].includes(normalizedKey)) return true;
  return false;
}

function normalizeInspectorFieldName(value) {
  return String(value ?? "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function isUnsafeInspectorReference(value) {
  const normalized = String(value).trim().toLowerCase();
  return normalized.startsWith("javascript:") || normalized.startsWith("file://");
}

function valueText(value, fallback) {
  return value === null || value === undefined ? fallback : String(value);
}

function readSessionSettings() {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_SETTINGS_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeSessionSettings(model) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify({
      fixtureId: model.fixtureId,
      outputId: model.selectedOutputId,
      inspectorTab: model.inspectorTab,
      panelSize: model.panelSize,
      safeMode: model.safeMode,
      visibility: model.visibility
    }));
  } catch {
    // La consola sigue operando completamente en memoria.
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function normalizeVisibility(value) {
  return VISIBILITIES.includes(value) ? value : DEFAULT_VISIBILITY;
}

function normalizePanelSize(value) {
  return ["compact", "normal", "wide"].includes(value) ? value : "normal";
}

function normalizeNow(value) {
  if (typeof value === "function") return normalizeNow(value());
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback;
}

function cloneValue(value) {
  return structuredClone(value);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))];
}

function assertModel(model) {
  if (!model || typeof model !== "object" || !model.state || !model.contract) throw consoleError("console-model-required");
}

function requireConsoleVariable(model, variableId) {
  assertModel(model);
  const variable = model.variableRegistry?.variables?.[variableId];
  if (!variable) throw consoleError("console-variable-not-found");
  return variable;
}

function consoleActionError(dispatch, actionType) {
  let code = dispatch.result?.code || "console-action-failed";
  if (code === "confirmation-required") {
    if ([ACTION_TYPES.TAKE, ACTION_TYPES.CUT, ACTION_TYPES.AUTO].includes(actionType)) code = "console-safe-mode-confirmation-required";
    else if (actionType === ACTION_TYPES.CLEAR_PROGRAM) code = "console-clear-program-confirmation-required";
    else if ([ACTION_TYPES.SET_LAYER, ACTION_TYPES.LOCK_LAYER, ACTION_TYPES.UNLOCK_LAYER, ACTION_TYPES.SHOW_LAYER, ACTION_TYPES.HIDE_LAYER].includes(actionType)) code = "console-layer-confirmation-required";
    else code = "console-action-confirmation-required";
  }
  return consoleError(code, {
    actionId: dispatch.action?.actionId,
    actionType,
    resultCode: dispatch.result?.code,
    errors: dispatch.errors
  });
}

function consoleError(code, details = {}) {
  const error = new Error(code);
  error.name = "ProductionConsoleError";
  error.code = code;
  error.details = details;
  return error;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initializeProductionConsole(document), { once: true });
  else initializeProductionConsole(document);
}
