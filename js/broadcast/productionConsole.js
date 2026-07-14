import {
  BROADCAST_DATA_CONTRACT_VERSION,
  buildBroadcastDataContract,
  getBroadcastField,
  validateBroadcastDataContract
} from "./dataContract.js?v=20260713-broadcast-output-001-output-v1";
import {
  BROADCAST_STATE_VERSION,
  clearPreviewState,
  clearProgramState,
  cloneBroadcastState,
  createInitialBroadcastState,
  dequeueBroadcastItem,
  enqueueBroadcastItem,
  getBroadcastQueue,
  getBroadcastStateWarnings,
  promotePreviewToProgram,
  setBroadcastContextRef,
  setGraphicState,
  setLayerState,
  setOutputState,
  setPreviewState,
  validateBroadcastState
} from "./broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import {
  BROADCAST_OUTPUT_VERSION,
  assignLayersToOutput,
  buildBroadcastOutputProjection,
  getBroadcastOutput,
  getBroadcastOutputWarnings,
  listBroadcastOutputs,
  registerBroadcastOutput,
  removeBroadcastOutput,
  setBroadcastOutputStatus,
  updateBroadcastOutput,
  updateBroadcastOutputHeartbeat,
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
import { CHARROPRO_APP_VERSION } from "../core/version.js?v=20260713-production-console-001-control-center1";

export const PRODUCTION_CONSOLE_VERSION = "1.0.0";
export const PRODUCTION_CONSOLE_APP_VERSION = "20260713-production-console-001-control-center1";

export const PRODUCTION_CONSOLE_FIXTURES = Object.freeze([
  Object.freeze({ id: "equipos_3", label: "Competencia por equipos - 3 equipos", competitionType: "equipos_completo", countOption: "three" }),
  Object.freeze({ id: "equipos_4", label: "Competencia por equipos - 4 equipos", competitionType: "equipos_completo", countOption: "four" }),
  Object.freeze({ id: "charro_completo", label: "Charro Completo", competitionType: "charro_completo", countOption: "two" }),
  Object.freeze({ id: "caladero", label: "Caladero", competitionType: "caladero", countOption: "two" }),
  Object.freeze({ id: "coleadero", label: "Coleadero", competitionType: "coleadero", countOption: "two" }),
  Object.freeze({ id: "pialadero", label: "Pialadero", competitionType: "pialadero", countOption: "two" })
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

const CONSOLE_ACTOR = Object.freeze({ userId: "production_console_operator", name: "Operador de consola", role: "production" });
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
  return {
    consoleVersion: PRODUCTION_CONSOLE_VERSION,
    appVersion: CHARROPRO_APP_VERSION || PRODUCTION_CONSOLE_APP_VERSION,
    state,
    fixtureSource,
    contract,
    programSnapshot: null,
    lastPreviewConfig: null,
    assetRegistry,
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
    currentGraphicInstanceId: null,
    inspectorTab: normalizeInspectorTab(options.inspectorTab),
    panelSize: normalizePanelSize(options.panelSize),
    lastAction: "initialized",
    lastActionError: null,
    outputIds
  };
}

export function disposeProductionConsole(model) {
  const ids = Array.isArray(model?.outputIds) ? model.outputIds : consoleOutputIds();
  ids.forEach((id) => removeBroadcastOutput(id));
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
  let state = clearPreviewState(model.state, { now, actor: CONSOLE_ACTOR });
  state = setBroadcastContextRef(state, contextRefFromContract(contract), { now, actor: CONSOLE_ACTOR });
  return {
    ...model,
    state,
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
  return {
    ...model,
    selectedGraphicId: graphic.graphicId,
    geometry: geometryFromGraphic(graphic),
    previewVisible: true,
    lastAction: "graphic-selected",
    lastActionError: null
  };
}

export function selectProductionAsset(model, assetId) {
  assertModel(model);
  return {
    ...model,
    selectedAssetId: assetExists(model.assetRegistry, assetId) ? assetId : DEFAULT_ASSET_ID,
    lastAction: "asset-selected",
    lastActionError: null
  };
}

export function selectProductionOutput(model, outputId) {
  assertModel(model);
  if (!model.outputIds.includes(outputId) || !getBroadcastOutput(outputId)) throw consoleError("console-output-not-found", { outputId });
  return { ...model, selectedOutputId: outputId, lastAction: "output-selected", lastActionError: null };
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
  return {
    ...model,
    visibility: nextVisibility,
    contract,
    lastAction: "visibility-rebuilt",
    lastActionError: null
  };
}

export function setProductionSafeMode(model, enabled) {
  assertModel(model);
  return { ...model, safeMode: enabled !== false, lastAction: enabled !== false ? "safe-mode-on" : "safe-mode-off", lastActionError: null };
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
  let state = setGraphicState(model.state, instanceId, {
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
  }, { now, actor: CONSOLE_ACTOR });
  const currentLayer = state.layers[geometry.layerId];
  if (currentLayer?.locked && options.confirmed !== true) throw consoleError("console-layer-locked", { layerId: geometry.layerId });
  state = setLayerState(state, geometry.layerId, {
    visible,
    graphicIds: visible ? [instanceId] : [],
    outputIds: targetOutputIds,
    status: visible ? "visible" : "hidden"
  }, { now, actor: CONSOLE_ACTOR, force: currentLayer?.locked === true && options.confirmed === true });
  state = setPreviewState(state, {
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
  }, { now, actor: CONSOLE_ACTOR });
  return {
    ...model,
    state,
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
  let state = promotePreviewToProgram(model.state, {
    now,
    actor: CONSOLE_ACTOR,
    mode: transitionMode,
    expectedRevision: model.state.revision
  });
  model.outputIds.forEach((outputId) => {
    const output = updateBroadcastOutput(outputId, {
      lastAppliedRevision: state.program.revision,
      lastAppliedAt: now
    }, { now, actor: CONSOLE_ACTOR });
    state = setOutputState(state, outputId, output, { now, actor: CONSOLE_ACTOR });
  });
  return {
    ...model,
    state,
    programSnapshot: {
      state: cloneBroadcastState(state),
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
  return {
    ...model,
    state: clearPreviewState(model.state, { now: normalizeNow(options.now), actor: CONSOLE_ACTOR }),
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
  return {
    ...model,
    state: clearProgramState(model.state, {
      now,
      actor: CONSOLE_ACTOR,
      force,
      expectedRevision: model.state.revision
    }),
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
  if (action === "select") return { ...model, geometry: { ...model.geometry, layerId }, lastAction: "layer-selected", lastActionError: null };
  const layer = model.state.layers[layerId];
  const protectedAction = layerId === "emergency" || (layer?.locked && ["hide", "unlock"].includes(action));
  if (protectedAction && options.confirmed !== true) throw consoleError("console-layer-confirmation-required", { layerId, action });
  const now = normalizeNow(options.now);
  const patch = action === "lock"
    ? { locked: true }
    : action === "unlock"
      ? { locked: false }
      : { visible: action === "show", status: action === "show" ? "visible" : "hidden" };
  let state = setLayerState(model.state, layerId, patch, {
    now,
    actor: CONSOLE_ACTOR,
    force: options.confirmed === true
  });
  if (["show", "hide"].includes(action)) {
    const activeLayers = new Set(state.preview.activeLayers);
    if (action === "show") activeLayers.add(layerId);
    else activeLayers.delete(layerId);
    const visibleGraphics = state.preview.visibleGraphics.filter((graphicId) => (
      action === "show" || state.graphics[graphicId]?.layerId !== layerId
    ));
    state = setPreviewState(state, {
      activeLayers: [...activeLayers],
      visibleGraphics,
      templateInstances: filterTemplateInstances(state.preview.templateInstances, visibleGraphics)
    }, { now, actor: CONSOLE_ACTOR });
  }
  return { ...model, state, lastAction: `layer-${action}`, lastActionError: null };
}

export function setProductionOutputAction(model, action, options = {}) {
  assertModel(model);
  const outputId = options.outputId || model.selectedOutputId;
  const current = getBroadcastOutput(outputId);
  if (!current) throw consoleError("console-output-not-found", { outputId });
  const now = normalizeNow(options.now);
  let output;
  let lastActionError = null;
  if (action === "offline") output = setBroadcastOutputStatus(outputId, "offline", { now, actor: CONSOLE_ACTOR });
  else if (action === "stale") {
    output = updateBroadcastOutputHeartbeat(outputId, {
      at: new Date(Date.parse(now) - 60000).toISOString(),
      status: "stale",
      sequence: (current.heartbeat.sequence || 0) + 1,
      latency: 4200
    }, { now, actor: CONSOLE_ACTOR });
  } else if (action === "heartbeat" || action === "online") {
    if (action === "online") setBroadcastOutputStatus(outputId, "online", { now, actor: CONSOLE_ACTOR });
    const refreshed = getBroadcastOutput(outputId);
    output = updateBroadcastOutputHeartbeat(outputId, {
      at: now,
      status: "online",
      sequence: (refreshed.heartbeat.sequence || 0) + 1,
      latency: 28
    }, { now, actor: CONSOLE_ACTOR });
  } else if (action === "repeated") {
    try {
      output = updateBroadcastOutputHeartbeat(outputId, {
        at: now,
        status: "online",
        sequence: current.heartbeat.sequence,
        latency: current.latency ?? 0
      }, { now, actor: CONSOLE_ACTOR });
    } catch (error) {
      output = current;
      lastActionError = error?.code || error?.message || "heartbeat-rejected";
    }
  } else throw consoleError("console-output-action-invalid", { action });
  return {
    ...model,
    state: setOutputState(model.state, outputId, output, { now, actor: CONSOLE_ACTOR }),
    lastAction: `output-${action}`,
    lastActionError
  };
}

export function enqueueProductionGraphic(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const graphic = getGraphicDefinition(options.graphicId || model.selectedGraphicId);
  const sequence = model.queueSequence + 1;
  const queueItemId = options.queueItemId || `console-queue-${sequence}`;
  const state = enqueueBroadcastItem(model.state, {
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
    queuedBy: CONSOLE_ACTOR.userId,
    expiresAt: options.expiresAt || null,
    duration: options.duration ?? model.animation.duration,
    autoHide: options.autoHide ?? model.animation.autoHide,
    notes: options.notes ?? ""
  }, { now, actor: CONSOLE_ACTOR });
  return { ...model, state, queueSequence: sequence, lastAction: "queue-enqueued", lastActionError: null };
}

export function removeProductionQueueItem(model, queueItemId, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  return {
    ...model,
    state: dequeueBroadcastItem(model.state, { queueItemId, now, actor: CONSOLE_ACTOR }),
    lastAction: "queue-dequeued",
    lastActionError: null
  };
}

export function changeProductionQueuePriority(model, queueItemId, delta, options = {}) {
  assertModel(model);
  const item = getBroadcastQueue(model.state).find((entry) => entry.queueItemId === queueItemId);
  if (!item) throw consoleError("console-queue-item-not-found", { queueItemId });
  const now = normalizeNow(options.now);
  let state = dequeueBroadcastItem(model.state, { queueItemId, now, actor: CONSOLE_ACTOR });
  state = enqueueBroadcastItem(state, {
    ...item,
    priority: finiteNumber(item.priority, 0) + finiteNumber(delta, 0),
    queuedAt: item.queuedAt
  }, { now, actor: CONSOLE_ACTOR });
  return { ...model, state, lastAction: "queue-priority-changed", lastActionError: null };
}

export function clearProductionQueue(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  let state = model.state;
  getBroadcastQueue(state).forEach((item) => {
    state = dequeueBroadcastItem(state, { queueItemId: item.queueItemId, now, actor: CONSOLE_ACTOR });
  });
  return { ...model, state, lastAction: "queue-cleared", lastActionError: null };
}

export function restoreProductionConsole(model, options = {}) {
  assertModel(model);
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
  return { ...restored, lastAction: "console-restored" };
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
  const warnings = uniqueStrings([
    ...getBroadcastStateWarnings(model.state),
    ...getBroadcastOutputWarnings(selectedOutput),
    ...(previewProjection.warnings || []),
    ...(programProjection.warnings || [])
  ]);
  const errors = uniqueStrings([
    ...(model.state.errors || []),
    ...(selectedOutput?.errors || []),
    ...(previewProjection.errors || []),
    ...(programProjection.errors || []),
    ...(model.lastActionError ? [model.lastActionError] : [])
  ]);
  const inspector = {
    contract: cloneValue(model.contract),
    state: publicView ? publicStateDescriptor(model.state) : cloneBroadcastState(model.state),
    preview: cloneValue(model.state.preview),
    program: cloneValue(model.state.program),
    output: publicView ? publicOutputDescriptor(selectedOutput) : cloneValue(selectedOutput),
    projection: { preview: previewProjection, program: programProjection },
    assets,
    queue: getBroadcastQueue(model.state),
    warnings: publicView ? [] : warnings,
    errors: publicView ? [] : errors,
    versions: {
      application: model.appVersion,
      console: PRODUCTION_CONSOLE_VERSION,
      dataContract: BROADCAST_DATA_CONTRACT_VERSION,
      broadcastState: BROADCAST_STATE_VERSION,
      broadcastOutput: BROADCAST_OUTPUT_VERSION,
      assetManager: ASSET_MANAGER_VERSION
    }
  };
  return sanitizeProductionConsoleInspectorData(inspector, visibility, {
    preserveRootKeys: ["warnings", "errors"]
  });
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
  const errors = uniqueStrings([
    ...state.errors,
    ...contract.errors,
    ...outputs.flatMap((item) => item.errors),
    ...assets.flatMap((item) => item.errors)
  ]);
  return {
    valid: errors.length === 0,
    errors,
    warnings: uniqueStrings([
      ...state.warnings,
      ...contract.warnings,
      ...outputs.flatMap((item) => item.warnings),
      ...assets.flatMap((item) => item.warnings)
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
  const settings = readSessionSettings();
  let model = createProductionConsoleModel({ ...settings, safeMode: true });
  const refs = collectRefs(root);
  populateStaticControls(refs, model);
  const update = (nextModel) => {
    model = nextModel;
    writeSessionSettings(model);
    renderConsole(refs, model);
  };
  bindConsoleEvents(refs, () => model, update);
  renderConsole(refs, model);
  console.info("[production-console] initialized", {
    version: PRODUCTION_CONSOLE_VERSION,
    appVersion: PRODUCTION_CONSOLE_APP_VERSION
  });
  return { getModel: () => model, dispose: () => disposeProductionConsole(model) };
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
    output = assignLayersToOutput(output.id, [...PLAYGROUND_LAYER_IDS], { now, actor: CONSOLE_ACTOR });
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
    system: id("console-system"),
    inspectorTabs: id("console-inspector-tabs"),
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
}

function bindConsoleEvents(refs, getModel, setModel) {
  const run = (callback) => {
    try {
      setModel(callback(getModel()));
    } catch (error) {
      console.error("[production-console] action failed", error);
      setModel({ ...getModel(), lastAction: "action-failed", lastActionError: error?.code || error?.message || "console-action-failed" });
    }
  };
  refs.loadFixture?.addEventListener("click", () => run((model) => loadProductionConsoleFixture(model, refs.fixture.value)));
  refs.asset?.addEventListener("change", () => run((model) => {
    const selected = selectProductionAsset(model, refs.asset.value);
    return selected.state.preview.active ? prepareProductionPreview(selected, {}, { confirmed: true }) : selected;
  }));
  refs.visibility?.addEventListener("change", () => run((model) => setProductionVisibility(model, refs.visibility.value)));
  refs.output?.addEventListener("change", () => run((model) => selectProductionOutput(model, refs.output.value)));
  [refs.x, refs.y, refs.width, refs.height, refs.scale, refs.opacity, refs.anchor, refs.unit, refs.layer, refs.enterAnimation, refs.exitAnimation, refs.duration, refs.delay, refs.autoHide]
    .filter(Boolean)
    .forEach((control) => control.addEventListener("change", () => run((model) => prepareProductionPreview(model, {
      geometry: readGeometryControls(refs),
      animation: readAnimationControls(refs)
    }, { confirmed: true }))));
  refs.graphicLibrary?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-graphic-id]");
    if (!button) return;
    run((model) => selectProductionGraphic(model, button.dataset.graphicId));
  });
  refs.actions.forEach((button) => button.addEventListener("click", () => run((model) => handleConsoleAction(model, button.dataset.consoleAction, refs))));
  refs.presets.forEach((button) => button.addEventListener("click", () => run((model) => prepareProductionPreview(model, {
    geometry: geometryPreset(button.dataset.consolePreset, model.geometry)
  }, { confirmed: true }))));
  refs.layersBody?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-layer-action]");
    if (!button) return;
    const layer = getModel().state.layers[button.dataset.layerId];
    const needsConfirmation = button.dataset.layerId === "emergency" || (layer?.locked && ["hide", "unlock"].includes(button.dataset.layerAction));
    const confirmed = !needsConfirmation || window.confirm(`Confirmar ${button.dataset.layerAction} en ${button.dataset.layerId}.`);
    if (!confirmed) return;
    run((model) => setProductionLayerAction(model, button.dataset.layerId, button.dataset.layerAction, { confirmed }));
  });
  refs.outputsList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-output-action]");
    if (!button) return;
    run((model) => {
      const selected = selectProductionOutput(model, button.dataset.outputId);
      return setProductionOutputAction(selected, button.dataset.outputAction, { outputId: button.dataset.outputId });
    });
  });
  refs.queueList?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-queue-action]");
    if (!button) return;
    run((model) => {
      if (button.dataset.queueAction === "remove") return removeProductionQueueItem(model, button.dataset.queueId);
      return changeProductionQueuePriority(model, button.dataset.queueId, button.dataset.queueAction === "up" ? 10 : -10);
    });
  });
  refs.inspectorTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-inspector-tab]");
    if (!button) return;
    run((model) => ({ ...model, inspectorTab: normalizeInspectorTab(button.dataset.inspectorTab), lastAction: "inspector-tab-changed" }));
  });
  refs.inspector?.addEventListener("click", async (event) => {
    const refreshButton = event.target.closest('button[data-console-action="refresh-inspector"]');
    if (refreshButton) {
      run((model) => ({ ...model, lastAction: "inspector-refreshed", lastActionError: null }));
      return;
    }
    const button = event.target.closest("button[data-copy-json]");
    if (!button) return;
    const pre = refs.inspector.querySelector("pre");
    await copyText(pre?.textContent || "");
    button.textContent = "Copiado";
    window.setTimeout(() => { button.textContent = "Copiar JSON"; }, 1200);
  });
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
    const confirmed = !model.state.program.active || !protectedProgram || window.confirm("Confirmar limpieza de Program.");
    return confirmed ? clearProductionProgram(model, { confirmed, force: model.state.program.emergencyMode || model.state.program.lockedLayers.length > 0 }) : model;
  }
  if (action === "hide") return prepareProductionPreview(model, { visible: false }, { confirmed: true });
  if (action === "hide-all") return clearProductionPreview(model);
  if (action === "replace") return prepareProductionPreview(model, { replace: true, geometry: readGeometryControls(refs), animation: readAnimationControls(refs) }, { confirmed: true });
  if (action === "restore-preview") return restoreLastProductionPreview(model);
  if (action === "enqueue") return enqueueProductionGraphic(model);
  if (action === "clear-queue") return clearProductionQueue(model);
  if (action === "safe-mode") return setProductionSafeMode(model, !model.safeMode);
  if (action === "restore") return restoreProductionConsole(model);
  if (action === "clear-all") {
    if (!window.confirm("Confirmar limpieza de Preview, Program y cola.")) return model;
    let cleared = clearProductionPreview(model);
    if (cleared.state.program.active) cleared = clearProductionProgram(cleared, { confirmed: true, force: true });
    return clearProductionQueue(cleared);
  }
  if (action === "refresh-inspector") return { ...model, lastAction: "inspector-refreshed" };
  return model;
}

function renderConsole(refs, model) {
  syncControls(refs, model);
  const previewProjection = buildProductionProjection(model, "preview");
  const programProjection = buildProductionProjection(model, "program");
  renderHeader(refs.headerStatus, model);
  renderContext(refs.context, model.contract);
  renderGraphicLibrary(refs.graphicLibrary, model);
  renderStage(refs.preview, previewProjection, buildProductionRenderDescriptor(previewProjection, model.assetRegistry), "Preview");
  renderStage(refs.program, programProjection, buildProductionRenderDescriptor(programProjection, model.assetRegistry), "Program");
  renderLayers(refs.layersBody, model);
  renderOutputs(refs.outputsList, model);
  renderQueue(refs.queueList, model);
  renderAssets(refs.assetsList, model);
  renderSystem(refs.system, model);
  renderInspectorTabs(refs.inspectorTabs, model);
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
    element("span", "console-meta", `Assets ${ASSET_MANAGER_VERSION}`),
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

function renderSystem(root, model) {
  if (!root) return;
  const status = getProductionSystemStatus(model);
  root.replaceChildren(statusChip(status.label, status.level));
  const grid = element("dl", "console-system-grid");
  [
    ["State revision", status.stateRevision], ["Preview revision", status.previewRevision], ["Program revision", status.programRevision],
    ["Output applied", status.outputRevision], ["Contract", BROADCAST_DATA_CONTRACT_VERSION], ["State", BROADCAST_STATE_VERSION],
    ["Output", BROADCAST_OUTPUT_VERSION], ["Asset Manager", ASSET_MANAGER_VERSION], ["Context stale", status.contextStale ? "Sí" : "No"],
    ["Output stale", status.outputStale ? "Sí" : "No"], ["Preview activo", status.previewActive ? "Sí" : "No"],
    ["Program activo", status.programActive ? "Sí" : "No"], ["Modo seguro", status.safeMode ? "Sí" : "No"],
    ["Warnings", status.warnings.length], ["Errors", status.errors.length]
  ].forEach(([label, value]) => grid.append(definitionItem(label, value)));
  root.append(grid);
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

function renderInspector(root, model) {
  if (!root) return;
  const inspector = getProductionConsoleInspector(model);
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

function inspectorValue(inspector, key) {
  if (key === "data-contract") return inspector.contract;
  if (key === "broadcast-state") return inspector.state;
  if (key === "preview") return inspector.preview;
  if (key === "program") return inspector.program;
  if (key === "output") return inspector.output;
  if (key === "projection") return inspector.projection;
  if (key === "assets") return inspector.assets;
  if (key === "queue") return inspector.queue;
  if (key === "warnings") return inspector.warnings;
  return inspector.errors;
}

function inspectorKeys() {
  return ["data-contract", "broadcast-state", "preview", "program", "output", "projection", "assets", "queue", "warnings", "errors"];
}

function normalizeInspectorTab(value) {
  return inspectorKeys().includes(value) ? value : "data-contract";
}

function inspectorLabel(value) {
  return {
    "data-contract": "Data Contract", "broadcast-state": "Broadcast State", preview: "Preview", program: "Program", output: "Output",
    projection: "Projection", assets: "Assets", queue: "Queue", warnings: "Warnings", errors: "Errors"
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
