import {
  buildBroadcastDataContract,
  getBroadcastField,
  validateBroadcastDataContract
} from "./dataContract.js?v=20260713-broadcast-output-001-output-v1";
import {
  clearPreviewState,
  clearProgramState,
  cloneBroadcastState,
  createInitialBroadcastState,
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
  listBroadcastAssets,
  registerBroadcastAsset,
  resolveBroadcastAsset,
  validateBroadcastAsset
} from "./assetManager.js?v=20260713-asset-manager-001-assets-v1";
import {
  PLAYGROUND_ASSET_DEFINITIONS,
  PLAYGROUND_COMPETITIONS,
  PLAYGROUND_COUNT_OPTIONS,
  PLAYGROUND_GRAPHIC_DEFINITIONS,
  PLAYGROUND_LAYER_IDS,
  PLAYGROUND_OUTPUT_DEFINITIONS,
  buildPlaygroundFixture,
  getPlaygroundGraphicDefinition
} from "./fixtures/broadcastPlaygroundFixtures.js?v=20260713-broadcast-playground-001-visual-test1";

export const BROADCAST_PLAYGROUND_VERSION = "1.0.0";
export const BROADCAST_PLAYGROUND_APP_VERSION = "20260713-broadcast-playground-001-visual-test1";

const DEFAULT_COMPETITION = "equipos_completo";
const DEFAULT_COUNT = "three";
const DEFAULT_GRAPHIC = "scoreboard-test";
const DEFAULT_ASSET = "asset-tournament-logo";
const DEFAULT_OUTPUT = "playground_program";
const DEFAULT_VISIBILITY = "production";
const PREVIEW_OUTPUT_ID = "playground_preview";
const PLAYGROUND_ACTOR = Object.freeze({ userId: "playground_operator", name: "Operador Playground", role: "production" });
const VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const ANIMATIONS = Object.freeze([
  "none",
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale-in",
  "scale-out"
]);
const ANCHORS = Object.freeze([
  "center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right"
]);
const POSITION_UNITS = Object.freeze(["normalized", "%", "px", "vw", "vh"]);
const SESSION_SETTINGS_KEY = "charropro_broadcast_playground_settings_v1";

export function createBroadcastPlaygroundModel(options = {}) {
  const now = normalizeNow(options.now);
  cleanupPlaygroundOutputs();
  const outputs = registerPlaygroundOutputs(now);
  const assetRegistry = registerPlaygroundAssets(now);
  const fixtureType = PLAYGROUND_COMPETITIONS[options.competitionType]
    ? options.competitionType
    : DEFAULT_COMPETITION;
  const countOption = PLAYGROUND_COUNT_OPTIONS.some((item) => item.value === options.countOption)
    ? options.countOption
    : DEFAULT_COUNT;
  const fixtureSource = stampFixtureSource(buildPlaygroundFixture(fixtureType, countOption), now);
  const visibility = normalizeVisibility(options.visibility);
  const previewContract = buildBroadcastDataContract(fixtureSource, {
    visibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  const outputMap = Object.fromEntries(outputs.map((output) => [output.id, output]));
  const state = createInitialBroadcastState({
    now,
    source: "broadcast-playground",
    session: {
      id: "session_playground",
      tournamentId: previewContract.tournament.id,
      competitionId: previewContract.competition.id,
      outputIds: outputs.map((output) => output.id),
      status: "active",
      recoverable: false
    },
    contextRef: contextRefFromContract(previewContract),
    outputs: outputMap,
    legacy: {
      enabled: true,
      activeEngine: "v1",
      v1OutputIds: [],
      v2OutputIds: outputs.map((output) => output.id),
      fallbackAvailable: false
    }
  });
  const definition = getPlaygroundGraphicDefinition(options.graphicId || DEFAULT_GRAPHIC);

  return {
    playgroundVersion: BROADCAST_PLAYGROUND_VERSION,
    appVersion: BROADCAST_PLAYGROUND_APP_VERSION,
    state,
    fixtureSource,
    previewContract,
    programSnapshot: null,
    assetRegistry,
    competitionType: fixtureType,
    countOption,
    selectedGraphicId: definition.graphicId,
    selectedAssetId: options.assetId || DEFAULT_ASSET,
    selectedOutputId: outputIds().includes(options.outputId) ? options.outputId : DEFAULT_OUTPUT,
    visibility,
    geometry: geometryFromDefinition(definition),
    animation: {
      enter: "fade-in",
      exit: "fade-out",
      duration: 350,
      autoHide: false
    },
    previewVisible: true,
    graphicSequence: 0,
    currentGraphicInstanceId: null,
    lastAction: "initialized",
    lastActionError: null,
    outputIds: outputs.map((output) => output.id)
  };
}

export function disposeBroadcastPlayground(model) {
  const ids = Array.isArray(model?.outputIds) ? model.outputIds : outputIds();
  ids.forEach((id) => removeBroadcastOutput(id));
}

export function loadPlaygroundFixture(model, competitionType, countOption, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const type = PLAYGROUND_COMPETITIONS[competitionType] ? competitionType : DEFAULT_COMPETITION;
  const selectedCount = PLAYGROUND_COUNT_OPTIONS.some((item) => item.value === countOption)
    ? countOption
    : (PLAYGROUND_COMPETITIONS[type].scope === "team" ? "three" : "two");
  const source = stampFixtureSource(buildPlaygroundFixture(type, selectedCount), now);
  const contract = buildBroadcastDataContract(source, {
    visibility: model.visibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  let state = clearPreviewState(model.state, { now, actor: PLAYGROUND_ACTOR });
  state = setBroadcastContextRef(state, contextRefFromContract(contract), { now, actor: PLAYGROUND_ACTOR });
  return {
    ...model,
    state,
    fixtureSource: source,
    previewContract: contract,
    competitionType: type,
    countOption: selectedCount,
    currentGraphicInstanceId: null,
    lastAction: "fixture-loaded",
    lastActionError: null
  };
}

export function selectPlaygroundGraphic(model, graphicId) {
  assertModel(model);
  const definition = getPlaygroundGraphicDefinition(graphicId);
  return {
    ...model,
    selectedGraphicId: definition.graphicId,
    geometry: geometryFromDefinition(definition),
    previewVisible: definition.visible,
    lastAction: "graphic-selected",
    lastActionError: null
  };
}

export function selectPlaygroundAsset(model, assetId) {
  assertModel(model);
  const exists = listBroadcastAssets(model.assetRegistry, { allVersions: false }).some((asset) => asset.assetId === assetId);
  return {
    ...model,
    selectedAssetId: exists ? assetId : DEFAULT_ASSET,
    lastAction: "asset-selected",
    lastActionError: null
  };
}

export function selectPlaygroundOutput(model, outputId) {
  assertModel(model);
  if (!getBroadcastOutput(outputId)) throw playgroundError("playground-output-not-found", { outputId });
  return {
    ...model,
    selectedOutputId: outputId,
    lastAction: "output-selected",
    lastActionError: null
  };
}

export function setPlaygroundVisibility(model, visibility, options = {}) {
  assertModel(model);
  const normalizedVisibility = normalizeVisibility(visibility);
  const now = normalizeNow(options.now);
  const contract = buildBroadcastDataContract(model.fixtureSource, {
    visibility: normalizedVisibility,
    outputType: "preview",
    includeLegacyAliases: true,
    now
  });
  return {
    ...model,
    visibility: normalizedVisibility,
    previewContract: contract,
    lastAction: "visibility-changed",
    lastActionError: null
  };
}

export function preparePlaygroundPreview(model, patch = {}, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const definition = getPlaygroundGraphicDefinition(patch.graphicId || model.selectedGraphicId);
  const geometry = normalizeGeometry({
    ...model.geometry,
    ...(patch.geometry || {}),
    layerId: patch.layerId || patch.geometry?.layerId || model.geometry.layerId || definition.layerId
  });
  const animation = normalizeAnimation({ ...model.animation, ...(patch.animation || {}) });
  const visible = patch.visible !== undefined ? patch.visible === true : model.previewVisible !== false;
  const sequence = model.graphicSequence + 1;
  const instanceId = `${definition.graphicId}-instance-${sequence}`;
  const outputIdsForGraphic = [...model.outputIds];
  const payloadBindings = {
    definitionId: definition.graphicId,
    type: definition.type,
    requiredData: [...definition.requiredData],
    dataBindings: cloneValue(definition.dataBindings),
    fallback: definition.fallback,
    assetId: patch.assetId || model.selectedAssetId,
    variantId: patch.variantId || null,
    message: patch.message !== undefined ? String(patch.message) : "Información oficial de producción",
    enterAnimation: animation.enter,
    exitAnimation: animation.exit
  };

  let state = setGraphicState(model.state, instanceId, {
    templateId: definition.graphicId,
    templateVersion: "1.0.0",
    variantId: "playground",
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
    outputIds: outputIdsForGraphic,
    contextRef: contextRefFromContract(model.previewContract),
    payloadBindings,
    errors: [],
    warnings: []
  }, { now, actor: PLAYGROUND_ACTOR });

  const currentLayer = state.layers[geometry.layerId];
  if (currentLayer?.locked && options.confirmed !== true) {
    throw playgroundError("playground-layer-locked", { layerId: geometry.layerId });
  }
  state = setLayerState(state, geometry.layerId, {
    visible,
    graphicIds: visible ? [instanceId] : [],
    outputIds: outputIdsForGraphic,
    status: visible ? "visible" : "hidden"
  }, {
    now,
    actor: PLAYGROUND_ACTOR,
    force: currentLayer?.locked === true && options.confirmed === true
  });
  const activeLayers = visible ? [geometry.layerId] : [];
  state = setPreviewState(state, {
    active: true,
    compositionId: `composition-${definition.graphicId}`,
    sceneId: `scene-${model.competitionType}`,
    templateInstances: visible ? {
      [instanceId]: {
        instanceId,
        graphicId: instanceId,
        templateId: definition.graphicId,
        layerId: geometry.layerId
      }
    } : {},
    visibleGraphics: visible ? [instanceId] : [],
    activeLayers,
    outputIds: outputIdsForGraphic,
    themeId: "charropro_gold",
    contextRef: contextRefFromContract(model.previewContract),
    status: "ready",
    validation: { valid: true, checkedAt: now, errors: [], warnings: [] },
    warnings: [],
    errors: []
  }, { now, actor: PLAYGROUND_ACTOR });

  return {
    ...model,
    state,
    geometry,
    animation,
    selectedGraphicId: definition.graphicId,
    selectedAssetId: payloadBindings.assetId,
    previewVisible: visible,
    graphicSequence: sequence,
    currentGraphicInstanceId: instanceId,
    lastAction: "preview-prepared",
    lastActionError: null
  };
}

export function takePlaygroundToProgram(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const mode = ["take", "cut", "auto"].includes(options.mode) ? options.mode : "take";
  let state = promotePreviewToProgram(model.state, {
    now,
    actor: PLAYGROUND_ACTOR,
    mode,
    expectedRevision: model.state.revision
  });
  model.outputIds.forEach((outputId) => {
    const output = updateBroadcastOutput(outputId, {
      lastAppliedRevision: state.program.revision,
      lastAppliedAt: now
    }, { now, actor: PLAYGROUND_ACTOR });
    state = setOutputState(state, outputId, output, { now, actor: PLAYGROUND_ACTOR });
  });
  const programState = cloneBroadcastState(state);
  const programContract = cloneValue(model.previewContract);
  return {
    ...model,
    state,
    programSnapshot: {
      state: programState,
      contract: programContract,
      visibility: model.visibility,
      takenAt: now,
      mode
    },
    lastAction: `program-${mode}`,
    lastActionError: null
  };
}

export function clearPlaygroundPreview(model, options = {}) {
  assertModel(model);
  return {
    ...model,
    state: clearPreviewState(model.state, { now: normalizeNow(options.now), actor: PLAYGROUND_ACTOR }),
    currentGraphicInstanceId: null,
    lastAction: "preview-cleared",
    lastActionError: null
  };
}

export function clearPlaygroundProgram(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const force = options.force === true;
  const state = clearProgramState(model.state, {
    now,
    actor: PLAYGROUND_ACTOR,
    force,
    expectedRevision: model.state.revision
  });
  return {
    ...model,
    state,
    programSnapshot: null,
    lastAction: "program-cleared",
    lastActionError: null
  };
}

export function hideAllPlaygroundGraphics(model, options = {}) {
  return clearPlaygroundPreview(model, options);
}

export function restorePlaygroundValues(model, options = {}) {
  assertModel(model);
  const definition = getPlaygroundGraphicDefinition(model.selectedGraphicId);
  let restored = {
    ...model,
    geometry: geometryFromDefinition(definition),
    animation: {
      enter: "fade-in",
      exit: "fade-out",
      duration: 350,
      autoHide: false
    },
    previewVisible: true,
    lastActionError: null
  };
  restored = restorePlaygroundOutputOnline(restored, { now: options.now });
  return preparePlaygroundPreview(restored, {}, { now: options.now, confirmed: true });
}

export function simulatePlaygroundPreviewError(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const state = setPreviewState(model.state, {
    active: true,
    status: "error",
    validation: {
      valid: false,
      checkedAt: now,
      errors: ["playground-simulated-error"],
      warnings: []
    },
    errors: ["playground-simulated-error"]
  }, { now, actor: PLAYGROUND_ACTOR });
  return {
    ...model,
    state,
    lastAction: "preview-error-simulated",
    lastActionError: "playground-simulated-error"
  };
}

export function simulatePlaygroundStaleContext(model, options = {}) {
  assertModel(model);
  const now = normalizeNow(options.now);
  const staleAt = new Date(Date.parse(now) - 10 * 60 * 1000).toISOString();
  const state = setBroadcastContextRef(model.state, {
    ...contextRefFromContract(model.previewContract),
    generatedAt: staleAt,
    freshness: "stale"
  }, { now, actor: PLAYGROUND_ACTOR });
  return {
    ...model,
    state,
    lastAction: "context-stale-simulated",
    lastActionError: null
  };
}

export function setPlaygroundLayerAction(model, layerId, action, options = {}) {
  assertModel(model);
  if (!PLAYGROUND_LAYER_IDS.includes(layerId)) throw playgroundError("playground-layer-not-found", { layerId });
  if (!["show", "hide", "lock", "unlock", "select"].includes(action)) {
    throw playgroundError("playground-layer-action-invalid", { action });
  }
  if (action === "select") {
    return {
      ...model,
      geometry: { ...model.geometry, layerId },
      lastAction: "layer-selected",
      lastActionError: null
    };
  }
  const layer = model.state.layers[layerId];
  const protectedAction = layerId === "emergency" || (layer?.locked && ["hide", "unlock"].includes(action));
  if (protectedAction && options.confirmed !== true) {
    throw playgroundError("playground-layer-confirmation-required", { layerId, action });
  }
  const now = normalizeNow(options.now);
  const patch = action === "lock"
    ? { locked: true }
    : action === "unlock"
      ? { locked: false }
      : { visible: action === "show", status: action === "show" ? "visible" : "hidden" };
  let state = setLayerState(model.state, layerId, patch, {
    now,
    actor: PLAYGROUND_ACTOR,
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
    }, { now, actor: PLAYGROUND_ACTOR });
  }
  return {
    ...model,
    state,
    lastAction: `layer-${action}`,
    lastActionError: null
  };
}

export function sendPlaygroundHeartbeat(model, mode = "online", options = {}) {
  assertModel(model);
  const outputId = options.outputId || model.selectedOutputId;
  const current = getBroadcastOutput(outputId);
  if (!current) throw playgroundError("playground-output-not-found", { outputId });
  const now = normalizeNow(options.now);
  const currentSequence = current.heartbeat.sequence || 0;
  if (mode === "repeated") {
    try {
      updateBroadcastOutputHeartbeat(outputId, {
        at: now,
        status: "online",
        sequence: currentSequence,
        latency: current.latency ?? 0
      }, { now, actor: PLAYGROUND_ACTOR });
    } catch (error) {
      return {
        ...model,
        lastAction: "heartbeat-repeated-rejected",
        lastActionError: error?.code || error?.message || "heartbeat-error"
      };
    }
  }
  const staleAt = new Date(Date.parse(now) - 60 * 1000).toISOString();
  const heartbeatAt = ["delayed", "stale"].includes(mode) ? staleAt : now;
  const status = mode === "offline" ? "offline" : mode === "stale" ? "stale" : "online";
  const output = updateBroadcastOutputHeartbeat(outputId, {
    at: heartbeatAt,
    status,
    sequence: currentSequence + 1,
    latency: mode === "delayed" ? 1800 : mode === "stale" ? 4200 : 34
  }, { now, actor: PLAYGROUND_ACTOR });
  const state = setOutputState(model.state, outputId, output, { now, actor: PLAYGROUND_ACTOR });
  return {
    ...model,
    state,
    lastAction: `heartbeat-${mode}`,
    lastActionError: null
  };
}

export function setPlaygroundOutputOffline(model, options = {}) {
  assertModel(model);
  const outputId = options.outputId || model.selectedOutputId;
  const now = normalizeNow(options.now);
  const output = setBroadcastOutputStatus(outputId, "offline", { now, actor: PLAYGROUND_ACTOR });
  return {
    ...model,
    state: setOutputState(model.state, outputId, output, { now, actor: PLAYGROUND_ACTOR }),
    lastAction: "output-offline",
    lastActionError: null
  };
}

export function restorePlaygroundOutputOnline(model, options = {}) {
  assertModel(model);
  const outputId = options.outputId || model.selectedOutputId;
  const now = normalizeNow(options.now);
  let output = setBroadcastOutputStatus(outputId, "online", { now, actor: PLAYGROUND_ACTOR });
  output = updateBroadcastOutputHeartbeat(outputId, {
    at: now,
    status: "online",
    sequence: (output.heartbeat.sequence || 0) + 1,
    latency: 28
  }, { now, actor: PLAYGROUND_ACTOR });
  return {
    ...model,
    state: setOutputState(model.state, outputId, output, { now, actor: PLAYGROUND_ACTOR }),
    lastAction: "output-online",
    lastActionError: null
  };
}

export function buildPlaygroundProjection(model, view = "preview", options = {}) {
  assertModel(model);
  const selectedView = view === "program" ? "program" : "preview";
  const outputId = selectedView === "preview" ? PREVIEW_OUTPUT_ID : (options.outputId || model.selectedOutputId);
  const output = getBroadcastOutput(outputId);
  if (!output) throw playgroundError("playground-output-not-found", { outputId });
  const snapshot = selectedView === "program" ? model.programSnapshot : null;
  const state = snapshot?.state || model.state;
  const contract = snapshot?.contract || model.previewContract;
  const visibility = normalizeVisibility(options.visibility || snapshot?.visibility || model.visibility);
  const projection = buildBroadcastOutputProjection(output, state, contract, {
    now: normalizeNow(options.now),
    view: selectedView,
    visibility
  });
  projection.output = {
    ...projection.output,
    heartbeat: cloneValue(output.heartbeat),
    outputRevision: output.revision
  };
  return projection;
}

export function buildPlaygroundRenderDescriptor(projection, options = {}) {
  if (!projection || typeof projection !== "object") throw playgroundError("playground-projection-required");
  const sourceCopy = cloneValue(projection);
  const assetRegistry = options.assetRegistry || { assets: {}, currentVersions: {} };
  const graphics = (Array.isArray(sourceCopy.graphics) ? sourceCopy.graphics : []).map((graphic) => {
    const definition = getPlaygroundGraphicDefinition(graphic.templateId);
    const assetResolution = resolvePlaygroundGraphicAsset(graphic, sourceCopy, assetRegistry);
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
      content: buildGraphicContent(definition, sourceCopy.contract, graphic.payloadBindings),
      asset: assetResolution.resolved ? {
        assetId: assetResolution.asset.assetId,
        assetFamilyId: assetResolution.asset.assetFamilyId,
        version: assetResolution.asset.version,
        status: assetResolution.asset.status,
        visibility: assetResolution.asset.visibility,
        scope: assetResolution.sourceScope,
        variantId: assetResolution.variant?.variantId || null,
        fallbackUsed: assetResolution.fallbackUsed,
        fallbackReason: assetResolution.fallbackReason
      } : null,
      fallbackUsed: !assetResolution.resolved || assetResolution.fallbackUsed,
      warnings: [...(assetResolution.warnings || [])],
      errors: [...(assetResolution.errors || [])]
    };
  });
  return {
    renderer: "broadcast-playground-test-renderer",
    rendererVersion: BROADCAST_PLAYGROUND_VERSION,
    active: sourceCopy.broadcast?.active === true,
    view: sourceCopy.broadcast?.selectedView || null,
    stateRevision: sourceCopy.broadcast?.revision ?? 0,
    viewRevision: sourceCopy.broadcast?.viewRevision ?? 0,
    status: sourceCopy.broadcast?.status || "inactive",
    output: cloneValue(sourceCopy.output),
    safeArea: cloneValue(sourceCopy.output?.safeArea || {}),
    layers: cloneValue(sourceCopy.layers || []),
    graphics,
    warnings: uniqueStrings([
      ...(sourceCopy.warnings || []),
      ...graphics.flatMap((graphic) => graphic.warnings)
    ]),
    errors: uniqueStrings([
      ...(sourceCopy.errors || []),
      ...graphics.flatMap((graphic) => graphic.errors)
    ])
  };
}

export function getPlaygroundInspector(model, options = {}) {
  assertModel(model);
  const inspectorProjectionOptions = { ...options, visibility: model.visibility };
  const previewProjection = buildPlaygroundProjection(model, "preview", inspectorProjectionOptions);
  const programProjection = buildPlaygroundProjection(model, "program", inspectorProjectionOptions);
  const selectedOutput = getBroadcastOutput(model.selectedOutputId);
  const isPublic = model.visibility === "public";
  const assets = listBroadcastAssets(model.assetRegistry, { allVersions: false })
    .filter((asset) => !isPublic || asset.visibility === "public")
    .map((asset) => isPublic ? publicAssetDescriptor(asset) : asset);
  const state = isPublic ? publicStateDescriptor(model.state) : cloneBroadcastState(model.state);
  const output = isPublic ? publicOutputDescriptor(selectedOutput) : selectedOutput;
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
  return {
    contract: cloneValue(model.previewContract),
    state,
    output,
    projection: {
      preview: previewProjection,
      program: programProjection
    },
    assets,
    warnings,
    errors,
    versions: {
      playground: BROADCAST_PLAYGROUND_VERSION,
      dataContract: model.previewContract.contractVersion,
      broadcastState: model.state.stateVersion,
      broadcastOutput: selectedOutput?.outputVersion || null,
      assetManager: assets[0]?.assetManagerVersion || "1.0.0"
    }
  };
}

export function escapePlaygroundText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function validatePlaygroundModel(model) {
  if (!model || typeof model !== "object") {
    return { valid: false, errors: ["playground-model-invalid"], warnings: [] };
  }
  const stateValidation = validateBroadcastState(model.state);
  const contractValidation = validateBroadcastDataContract(model.previewContract);
  const outputValidations = model.outputIds.map((id) => validateBroadcastOutput(getBroadcastOutput(id)));
  const assetValidations = listBroadcastAssets(model.assetRegistry, { allVersions: true })
    .map((asset) => validateBroadcastAsset(asset));
  const errors = uniqueStrings([
    ...stateValidation.errors,
    ...contractValidation.errors,
    ...outputValidations.flatMap((item) => item.errors),
    ...assetValidations.flatMap((item) => item.errors)
  ]);
  return {
    valid: errors.length === 0,
    errors,
    warnings: uniqueStrings([
      ...stateValidation.warnings,
      ...contractValidation.warnings,
      ...outputValidations.flatMap((item) => item.warnings),
      ...assetValidations.flatMap((item) => item.warnings)
    ])
  };
}

export function initializeBroadcastPlayground(root = document) {
  if (!root?.querySelector || !root.querySelector("#broadcast-playground")) return null;
  const sessionSettings = readSessionSettings();
  let model = createBroadcastPlaygroundModel(sessionSettings);
  const refs = collectRefs(root);
  populateStaticControls(refs, model);
  bindControls(refs, () => model, (nextModel) => {
    model = nextModel;
    writeSessionSettings(model);
    renderPlayground(refs, model);
  });
  renderPlayground(refs, model);
  console.info("[broadcast-playground] initialized", {
    version: BROADCAST_PLAYGROUND_VERSION,
    appVersion: BROADCAST_PLAYGROUND_APP_VERSION
  });
  return {
    getModel: () => model,
    dispose: () => disposeBroadcastPlayground(model)
  };
}

function registerPlaygroundOutputs(now) {
  return PLAYGROUND_OUTPUT_DEFINITIONS.map((definition) => {
    let output = registerBroadcastOutput({
      id: definition.id,
      name: definition.name,
      type: definition.type,
      status: "online",
      enabled: true,
      visibility: "restricted",
      resolution: definition.resolution,
      safeArea: definition.safeArea,
      assignedLayers: [...PLAYGROUND_LAYER_IDS],
      themeId: "charropro_gold",
      heartbeat: {
        at: now,
        status: "online",
        sequence: 1,
        source: "playground"
      },
      staleAfterMs: 15000,
      lastAppliedRevision: 0,
      latency: 28,
      projection: {
        enabled: true,
        view: definition.projectionView,
        visibility: "restricted"
      },
      capabilities: {
        heartbeat: true,
        interaction: true,
        multiLayer: true,
        dynamicResize: true,
        animation: true,
        supportsPreview: true,
        supportsProgram: true
      },
      tenantId: "tenant_playground",
      organizationId: "organizacion_playground",
      tournamentId: "torneo_playground",
      competitionId: "equipos_completo",
      sessionId: "session_playground"
    }, { now, actor: PLAYGROUND_ACTOR });
    output = assignLayersToOutput(output.id, [...PLAYGROUND_LAYER_IDS], { now, actor: PLAYGROUND_ACTOR });
    return output;
  });
}

function registerPlaygroundAssets(now) {
  return PLAYGROUND_ASSET_DEFINITIONS.reduce((registry, definition) => (
    registerBroadcastAsset(registry, definition, {
      now,
      actor: PLAYGROUND_ACTOR,
      requireOriginalVariant: true
    })
  ), {});
}

function cleanupPlaygroundOutputs() {
  outputIds().forEach((id) => removeBroadcastOutput(id));
}

function outputIds() {
  return PLAYGROUND_OUTPUT_DEFINITIONS.map((output) => output.id);
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

function geometryFromDefinition(definition) {
  return normalizeGeometry({
    position: definition.position,
    size: definition.size,
    scale: definition.scale,
    opacity: definition.opacity,
    layerId: definition.layerId
  });
}

function normalizeGeometry(value = {}) {
  const position = value.position || {};
  const size = value.size || {};
  const x = finiteNumber(position.x, 0.5);
  const y = finiteNumber(position.y, 0.5);
  const width = nullableNonNegativeNumber(size.width, 0.6);
  const height = nullableNonNegativeNumber(size.height, 0.2);
  const scale = positiveNumber(value.scale, 1);
  const opacity = boundedNumber(value.opacity, 0, 1, 1);
  return {
    position: {
      x,
      y,
      anchor: ANCHORS.includes(position.anchor) ? position.anchor : "center",
      unit: POSITION_UNITS.includes(position.unit) ? position.unit : "normalized"
    },
    size: {
      width,
      height,
      unit: POSITION_UNITS.includes(size.unit) ? size.unit : (POSITION_UNITS.includes(position.unit) ? position.unit : "normalized")
    },
    scale,
    opacity,
    layerId: PLAYGROUND_LAYER_IDS.includes(value.layerId) ? value.layerId : "scoreboard"
  };
}

function normalizeAnimation(value = {}) {
  return {
    enter: normalizeAnimationName(value.enter, "fade-in"),
    exit: normalizeAnimationName(value.exit, "fade-out"),
    duration: boundedNumber(value.duration, 0, 10000, 350),
    autoHide: value.autoHide === true
  };
}

function normalizeAnimationName(value, fallback) {
  return ANIMATIONS.includes(value) ? value : fallback;
}

function resolvePlaygroundGraphicAsset(graphic, projection, assetRegistry) {
  const assetId = graphic.payloadBindings?.assetId;
  if (!assetId) {
    return {
      resolved: false,
      asset: null,
      variant: null,
      sourceScope: null,
      fallbackUsed: false,
      fallbackReason: null,
      warnings: [],
      errors: []
    };
  }
  return resolveBroadcastAsset(assetRegistry, {
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
  if (definition.type === "scoreboard" || definition.type === "ranking") {
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
    const name = scope === "individual"
      ? getBroadcastField(contract, "participant.name", fallback)
      : getBroadcastField(contract, "team.name", fallback);
    return {
      kind: "turn",
      title: "En turno",
      name,
      detail: getBroadcastField(contract, "suerte.name", fallback)
    };
  }
  if (definition.type === "score") {
    return {
      kind: "score",
      title: getBroadcastField(contract, "suerte.name", "Calificación"),
      value: getBroadcastField(contract, "score.total", null)
    };
  }
  if (definition.type === "timer") {
    return {
      kind: "timer",
      title: getBroadcastField(contract, "timer.running", false) ? "Tiempo activo" : "Tiempo",
      value: getBroadcastField(contract, "timer.display", fallback)
    };
  }
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
  if (definition.type === "sponsor") {
    return {
      kind: "sponsor",
      title: getBroadcastField(contract, "sponsor.active.name", fallback),
      detail: getBroadcastField(contract, "sponsor.active.campaign", "")
    };
  }
  return {
    kind: "message",
    title: String(payload.message ?? fallback)
  };
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
    root: id("broadcast-playground"),
    competition: id("playground-competition"),
    count: id("playground-count"),
    loadFixture: id("playground-load-fixture"),
    graphic: id("playground-graphic"),
    asset: id("playground-asset"),
    visibility: id("playground-visibility"),
    output: id("playground-output"),
    transition: id("playground-transition"),
    x: id("playground-x"),
    y: id("playground-y"),
    width: id("playground-width"),
    height: id("playground-height"),
    scale: id("playground-scale"),
    opacity: id("playground-opacity"),
    anchor: id("playground-anchor"),
    unit: id("playground-unit"),
    layer: id("playground-layer"),
    enterAnimation: id("playground-enter-animation"),
    exitAnimation: id("playground-exit-animation"),
    duration: id("playground-duration"),
    autoHide: id("playground-autohide"),
    actions: [...root.querySelectorAll("[data-playground-action]")],
    presets: [...root.querySelectorAll("[data-playground-preset]")],
    previewStage: id("playground-preview-stage"),
    programStage: id("playground-program-stage"),
    outputSummary: id("playground-output-summary"),
    heartbeatSummary: id("playground-heartbeat-summary"),
    assetsSummary: id("playground-assets-summary"),
    layersBody: id("playground-layers-body"),
    status: id("playground-status"),
    inspector: id("playground-inspector"),
    inspectorExpand: id("playground-inspector-expand"),
    inspectorCollapse: id("playground-inspector-collapse")
  };
}

function populateStaticControls(refs, model) {
  populateSelect(refs.competition, Object.values(PLAYGROUND_COMPETITIONS).map((item) => ({
    value: item.type,
    label: item.label
  })), model.competitionType);
  populateSelect(refs.count, PLAYGROUND_COUNT_OPTIONS, model.countOption);
  populateSelect(refs.graphic, Object.values(PLAYGROUND_GRAPHIC_DEFINITIONS).map((item) => ({
    value: item.graphicId,
    label: item.label
  })), model.selectedGraphicId);
  populateSelect(refs.asset, listBroadcastAssets(model.assetRegistry).map((asset) => ({
    value: asset.assetId,
    label: asset.name
  })), model.selectedAssetId);
  populateSelect(refs.output, listBroadcastOutputs().filter((item) => model.outputIds.includes(item.id)).map((output) => ({
    value: output.id,
    label: output.name
  })), model.selectedOutputId);
  populateSelect(refs.visibility, VISIBILITIES.map((value) => ({ value, label: value })), model.visibility);
  populateSelect(refs.anchor, ANCHORS.map((value) => ({ value, label: anchorLabel(value) })), model.geometry.position.anchor);
  populateSelect(refs.unit, POSITION_UNITS.map((value) => ({ value, label: value })), model.geometry.position.unit);
  populateSelect(refs.layer, PLAYGROUND_LAYER_IDS.map((value) => ({ value, label: value })), model.geometry.layerId);
  populateSelect(refs.enterAnimation, ANIMATIONS.map((value) => ({ value, label: value })), model.animation.enter);
  populateSelect(refs.exitAnimation, ANIMATIONS.map((value) => ({ value, label: value })), model.animation.exit);
}

function bindControls(refs, getModel, setModel) {
  const run = (callback) => {
    try {
      setModel(callback(getModel()));
    } catch (error) {
      console.error("[broadcast-playground] action failed", error);
      setModel({
        ...getModel(),
        lastAction: "action-failed",
        lastActionError: error?.code || error?.message || "playground-action-failed"
      });
    }
  };
  refs.loadFixture?.addEventListener("click", () => run((model) => (
    loadPlaygroundFixture(model, refs.competition.value, refs.count.value)
  )));
  refs.graphic?.addEventListener("change", () => run((model) => selectPlaygroundGraphic(model, refs.graphic.value)));
  refs.asset?.addEventListener("change", () => run((model) => {
    const selected = selectPlaygroundAsset(model, refs.asset.value);
    return selected.state.preview.active ? preparePlaygroundPreview(selected) : selected;
  }));
  refs.output?.addEventListener("change", () => run((model) => selectPlaygroundOutput(model, refs.output.value)));
  refs.visibility?.addEventListener("change", () => run((model) => setPlaygroundVisibility(model, refs.visibility.value)));

  [
    refs.x,
    refs.y,
    refs.width,
    refs.height,
    refs.scale,
    refs.opacity,
    refs.anchor,
    refs.unit,
    refs.layer,
    refs.enterAnimation,
    refs.exitAnimation,
    refs.duration,
    refs.autoHide
  ].filter(Boolean).forEach((control) => {
    control.addEventListener("change", () => run((model) => preparePlaygroundPreview(model, {
      geometry: readGeometryControls(refs),
      animation: readAnimationControls(refs)
    }, { confirmed: true })));
  });

  refs.actions.forEach((button) => {
    button.addEventListener("click", () => run((model) => handlePlaygroundAction(model, button.dataset.playgroundAction, refs)));
  });
  refs.presets.forEach((button) => {
    button.addEventListener("click", () => run((model) => preparePlaygroundPreview(model, {
      geometry: geometryPreset(button.dataset.playgroundPreset, model.geometry)
    }, { confirmed: true })));
  });
  refs.layersBody?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-layer-action]");
    if (!button) return;
    const layerId = button.dataset.layerId;
    const action = button.dataset.layerAction;
    const layer = getModel().state.layers[layerId];
    const needsConfirmation = layerId === "emergency" || (layer?.locked && ["hide", "unlock"].includes(action));
    const confirmed = !needsConfirmation || window.confirm(`Confirmar acción ${action} sobre la capa ${layerId}.`);
    if (!confirmed) return;
    run((model) => setPlaygroundLayerAction(model, layerId, action, { confirmed }));
  });
  refs.inspector?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy-inspector]");
    if (!button) return;
    const target = refs.inspector.querySelector(`pre[data-inspector-key="${button.dataset.copyInspector}"]`);
    if (!target) return;
    await copyText(target.textContent || "");
    button.textContent = "Copiado";
    window.setTimeout(() => { button.textContent = "Copiar JSON"; }, 1200);
  });
  refs.inspectorExpand?.addEventListener("click", () => {
    refs.inspector.querySelectorAll("details").forEach((details) => { details.open = true; });
  });
  refs.inspectorCollapse?.addEventListener("click", () => {
    refs.inspector.querySelectorAll("details").forEach((details) => { details.open = false; });
  });
}

function handlePlaygroundAction(model, action, refs) {
  if (action === "prepare") return preparePlaygroundPreview(model, {
    geometry: readGeometryControls(refs),
    animation: readAnimationControls(refs)
  }, { confirmed: true });
  if (action === "take") return takePlaygroundToProgram(model, { mode: refs.transition?.value || "take" });
  if (action === "clear-preview") return clearPlaygroundPreview(model);
  if (action === "clear-program") {
    const protectedProgram = model.state.program.emergencyMode || model.state.program.lockedLayers.length > 0;
    const confirmed = !protectedProgram || window.confirm("Program tiene capas protegidas. ¿Desea forzar la limpieza?");
    return confirmed ? clearPlaygroundProgram(model, { force: protectedProgram }) : model;
  }
  if (action === "show") return preparePlaygroundPreview(model, { visible: true }, { confirmed: true });
  if (action === "hide") return preparePlaygroundPreview(model, { visible: false }, { confirmed: true });
  if (action === "hide-all") return hideAllPlaygroundGraphics(model);
  if (action === "restore") return restorePlaygroundValues(model);
  if (action === "simulate-error") return simulatePlaygroundPreviewError(model);
  if (action === "simulate-disconnected") return setPlaygroundOutputOffline(model);
  if (action === "simulate-stale-context") return simulatePlaygroundStaleContext(model);
  if (action === "heartbeat") return sendPlaygroundHeartbeat(model, "online");
  if (action === "heartbeat-delayed") return sendPlaygroundHeartbeat(model, "delayed");
  if (action === "heartbeat-repeated") return sendPlaygroundHeartbeat(model, "repeated");
  if (action === "heartbeat-stale") return sendPlaygroundHeartbeat(model, "stale");
  if (action === "heartbeat-offline") return sendPlaygroundHeartbeat(model, "offline");
  if (action === "heartbeat-online") return restorePlaygroundOutputOnline(model);
  return model;
}

function renderPlayground(refs, model) {
  syncControls(refs, model);
  const previewProjection = buildPlaygroundProjection(model, "preview");
  const programProjection = buildPlaygroundProjection(model, "program");
  renderStage(refs.previewStage, previewProjection, buildPlaygroundRenderDescriptor(previewProjection, {
    assetRegistry: model.assetRegistry
  }), "Preview");
  renderStage(refs.programStage, programProjection, buildPlaygroundRenderDescriptor(programProjection, {
    assetRegistry: model.assetRegistry
  }), "Program");
  renderOutputSummary(refs.outputSummary, getBroadcastOutput(model.selectedOutputId));
  renderHeartbeatSummary(refs.heartbeatSummary, getBroadcastOutput(model.selectedOutputId));
  renderAssetsSummary(refs.assetsSummary, model);
  renderLayers(refs.layersBody, model);
  renderInspector(refs.inspector, getPlaygroundInspector(model));
  renderStatus(refs.status, model);
}

function syncControls(refs, model) {
  setValue(refs.competition, model.competitionType);
  setValue(refs.count, model.countOption);
  setValue(refs.graphic, model.selectedGraphicId);
  setValue(refs.asset, model.selectedAssetId);
  setValue(refs.output, model.selectedOutputId);
  setValue(refs.visibility, model.visibility);
  setValue(refs.x, model.geometry.position.x);
  setValue(refs.y, model.geometry.position.y);
  setValue(refs.width, model.geometry.size.width ?? "");
  setValue(refs.height, model.geometry.size.height ?? "");
  setValue(refs.scale, model.geometry.scale);
  setValue(refs.opacity, model.geometry.opacity);
  setValue(refs.anchor, model.geometry.position.anchor);
  setValue(refs.unit, model.geometry.position.unit);
  setValue(refs.layer, model.geometry.layerId);
  setValue(refs.enterAnimation, model.animation.enter);
  setValue(refs.exitAnimation, model.animation.exit);
  setValue(refs.duration, model.animation.duration);
  if (refs.autoHide) refs.autoHide.checked = model.animation.autoHide;
}

function renderStage(root, projection, descriptor, label) {
  if (!root) return;
  root.replaceChildren();
  const header = element("div", "playground-stage-bar");
  const title = element("strong", "playground-stage-title", label);
  const metadata = element("span", "playground-stage-meta");
  metadata.textContent = `${projection.output?.name || "Output"} · rev ${descriptor.stateRevision} · ${descriptor.status}`;
  const indicator = element("span", `playground-signal ${descriptor.active ? "is-active" : "is-idle"}`, descriptor.active ? "Activo" : "Vacío");
  header.append(title, metadata, indicator);

  const frame = element("div", "playground-stage-frame");
  const viewport = element("div", "playground-output-viewport");
  const width = projection.output?.resolution?.width || 1920;
  const height = projection.output?.resolution?.height || 1080;
  viewport.style.aspectRatio = `${width} / ${height}`;
  if (height > width) viewport.classList.add("is-vertical");
  if (width / height > 3) viewport.classList.add("is-panoramic");
  viewport.dataset.outputType = projection.output?.type || "browser";
  const safeArea = element("div", "playground-safe-area");
  applySafeArea(safeArea, projection.output?.safeArea, width, height);
  viewport.append(safeArea);

  if (!descriptor.active) {
    viewport.append(element("div", "playground-empty-output", `${label} sin composición activa`));
  }
  descriptor.graphics.forEach((graphic) => viewport.append(renderGraphic(graphic)));
  frame.append(viewport);

  const footer = element("div", "playground-stage-footer");
  const validation = projection.validation?.valid ? "Validación correcta" : "Validación con errores";
  footer.append(
    element("span", projection.validation?.valid ? "status-ok" : "status-error", validation),
    element("span", "", `Warnings: ${descriptor.warnings.length}`),
    element("span", "", `Heartbeat: ${projection.output?.heartbeat?.status || "sin datos"}`)
  );
  root.append(header, frame, footer);
}

function renderGraphic(graphic) {
  const node = element("section", `playground-graphic playground-graphic-${graphic.type}`);
  node.dataset.graphicId = graphic.graphicId;
  node.dataset.layerId = graphic.layerId || "";
  node.classList.add(`animation-${graphic.enterAnimation}`);
  applyGraphicGeometry(node, graphic);
  if (graphic.asset) {
    const assetChip = element("span", "playground-asset-chip", graphic.asset.assetId);
    assetChip.title = `${graphic.asset.version} · ${graphic.asset.variantId || "sin variante"}`;
    node.append(assetChip);
  }
  const content = graphic.content || {};
  if (content.kind === "ranking") {
    node.append(element("h3", "", content.title));
    const list = element("ol", "playground-ranking-list");
    content.rows.forEach((row) => {
      const item = element("li");
      item.append(
        element("span", "rank-position", valueText(row.position, "—")),
        element("span", "rank-name", row.name),
        element("strong", "rank-total", valueText(row.total, "—"))
      );
      list.append(item);
    });
    if (!content.rows.length) list.append(element("li", "playground-fallback", "Ranking sin datos"));
    node.append(list);
  } else if (content.kind === "turn") {
    node.append(
      element("span", "graphic-kicker", content.title),
      element("strong", "graphic-primary", content.name),
      element("span", "graphic-secondary", content.detail)
    );
  } else if (content.kind === "score" || content.kind === "timer") {
    node.append(
      element("span", "graphic-kicker", content.title),
      element("strong", "graphic-value", valueText(content.value, "—"))
    );
  } else if (content.kind === "details") {
    node.append(element("h3", "", content.title));
    if (content.fallback) {
      node.append(element("p", "playground-fallback", content.fallback));
    } else {
      const grid = element("dl", "playground-detail-grid");
      content.rows.forEach((row) => {
        grid.append(element("dt", "", readableLabel(row.label)), element("dd", "", valueText(row.value, "—")));
      });
      node.append(grid, element("strong", "graphic-detail-total", `Total ${valueText(content.total, "—")}`));
    }
  } else if (content.kind === "sponsor") {
    node.append(
      element("span", "graphic-kicker", "Presentado por"),
      element("strong", "graphic-primary", content.title),
      element("span", "graphic-secondary", content.detail)
    );
  } else {
    node.append(element("strong", "graphic-message", content.title || "Mensaje de producción"));
  }
  if (graphic.fallbackUsed) node.append(element("span", "playground-fallback-flag", "Fallback"));
  return node;
}

function renderOutputSummary(root, output) {
  if (!root || !output) return;
  root.replaceChildren();
  const values = [
    ["Tipo", output.type],
    ["Resolución", `${output.resolution.width} × ${output.resolution.height}`],
    ["Orientación", output.orientation],
    ["Safe area", safeAreaText(output.safeArea)],
    ["Estado", output.status],
    ["Stale", output.status === "stale" ? "Sí" : "No"],
    ["Revisión aplicada", output.lastAppliedRevision],
    ["Visibilidad máxima", output.visibility],
    ["Capas", output.assignedLayers.length]
  ];
  values.forEach(([label, value]) => root.append(definitionItem(label, value)));
}

function renderHeartbeatSummary(root, output) {
  if (!root || !output) return;
  root.replaceChildren();
  [
    ["Secuencia", output.heartbeat.sequence],
    ["Timestamp", output.heartbeat.at || "—"],
    ["Status", output.heartbeat.status],
    ["Stale", output.status === "stale" ? "Sí" : "No"],
    ["Latencia", output.latency === null ? "—" : `${output.latency} ms`],
    ["Last applied", output.lastAppliedRevision]
  ].forEach(([label, value]) => root.append(definitionItem(label, value)));
}

function renderAssetsSummary(root, model) {
  if (!root) return;
  root.replaceChildren();
  const assets = listBroadcastAssets(model.assetRegistry).filter((asset) => (
    model.visibility !== "public" || asset.visibility === "public"
  ));
  assets.forEach((asset) => {
    const row = element("div", "playground-asset-row");
    const identity = element("div");
    identity.append(
      element("strong", "", asset.name),
      element("span", "", `${asset.assetId} · familia ${asset.assetFamilyId}`)
    );
    const meta = element("div", "playground-asset-meta");
    meta.append(
      element("span", "", `v${asset.version}`),
      element("span", "", asset.status),
      element("span", "", asset.visibility),
      element("span", "", asset.scope),
      element("span", "", asset.variants[0]?.variantId || "sin variante")
    );
    row.append(identity, meta);
    root.append(row);
  });
}

function renderLayers(root, model) {
  if (!root) return;
  root.replaceChildren();
  PLAYGROUND_LAYER_IDS.forEach((layerId) => {
    const layer = model.state.layers[layerId];
    const row = document.createElement("tr");
    row.className = model.geometry.layerId === layerId ? "is-selected" : "";
    [
      layer.id,
      layer.order,
      layer.visible ? "Sí" : "No",
      layer.locked ? "Sí" : "No",
      layer.exclusive ? "Sí" : "No",
      layer.graphicIds.length,
      layer.outputIds.length || model.outputIds.length
    ].forEach((value) => row.append(element("td", "", String(value))));
    const actions = element("td", "layer-actions");
    [
      ["select", "Seleccionar"],
      [layer.visible ? "hide" : "show", layer.visible ? "Ocultar" : "Mostrar"],
      [layer.locked ? "unlock" : "lock", layer.locked ? "Desbloquear" : "Bloquear"]
    ].forEach(([action, label]) => {
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

function renderInspector(root, inspector) {
  if (!root) return;
  const sections = [
    ["contract", "Data Contract", inspector.contract],
    ["state", "Broadcast State", inspector.state],
    ["output", "Output", inspector.output],
    ["projection", "Projection", inspector.projection],
    ["assets", "Assets", inspector.assets],
    ["warnings", "Warnings", inspector.warnings],
    ["errors", "Errors", inspector.errors]
  ];
  root.replaceChildren();
  sections.forEach(([key, label, value], index) => {
    const details = document.createElement("details");
    details.open = index < 2;
    const summary = document.createElement("summary");
    summary.append(element("span", "", label));
    const count = Array.isArray(value) ? value.length : null;
    if (count !== null) summary.append(element("span", "inspector-count", String(count)));
    const body = element("div", "inspector-body");
    const copyButton = element("button", "button button-quiet button-small", "Copiar JSON");
    copyButton.type = "button";
    copyButton.dataset.copyInspector = key;
    const pre = document.createElement("pre");
    pre.dataset.inspectorKey = key;
    pre.textContent = JSON.stringify(value, null, 2);
    body.append(copyButton, pre);
    details.append(summary, body);
    root.append(details);
  });
}

function renderStatus(root, model) {
  if (!root) return;
  root.replaceChildren();
  const validation = validatePlaygroundModel(model);
  root.append(
    element("span", validation.valid ? "status-ok" : "status-error", validation.valid ? "Módulos válidos" : "Revisar validación"),
    element("span", "", `Acción: ${model.lastAction}`),
    element("span", "", `State rev ${model.state.revision}`),
    element("span", "", `Program rev ${model.state.program.revision}`),
    element("span", "", `Visibilidad ${model.visibility}`)
  );
  if (model.lastActionError) root.append(element("span", "status-error", model.lastActionError));
}

function readGeometryControls(refs) {
  return normalizeGeometry({
    position: {
      x: numberFromControl(refs.x),
      y: numberFromControl(refs.y),
      anchor: refs.anchor.value,
      unit: refs.unit.value
    },
    size: {
      width: numberFromControl(refs.width),
      height: numberFromControl(refs.height),
      unit: refs.unit.value
    },
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
    fullscreen: {
      position: { x: 0, y: 0, anchor: "top-left", unit: "normalized" },
      size: { width: 1, height: 1, unit: "normalized" },
      scale: 1
    },
    small: { size: { width: 0.28, height: 0.16, unit: "normalized" }, scale: 0.85 },
    medium: { size: { width: 0.55, height: 0.32, unit: "normalized" }, scale: 1 },
    large: { size: { width: 0.82, height: 0.62, unit: "normalized" }, scale: 1 }
  };
  const selected = presets[name] || {};
  return normalizeGeometry({
    ...base,
    ...selected,
    position: { ...base.position, ...(selected.position || {}) },
    size: { ...base.size, ...(selected.size || {}) }
  });
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
  node.style.setProperty("--animation-duration", `${graphic.duration || 350}ms`);
}

function applySafeArea(node, safeArea = {}, width, height) {
  const unit = safeArea.unit || "px";
  const toPercent = (value, axis) => {
    if (unit === "%") return `${value || 0}%`;
    if (unit === "normalized") return `${(value || 0) * 100}%`;
    return `${((value || 0) / axis) * 100}%`;
  };
  node.style.top = toPercent(safeArea.top, height);
  node.style.right = toPercent(safeArea.right, width);
  node.style.bottom = toPercent(safeArea.bottom, height);
  node.style.left = toPercent(safeArea.left, width);
}

function cssPositionValue(value, unit) {
  if (unit === "normalized") return `${finiteNumber(value, 0) * 100}%`;
  return `${finiteNumber(value, 0)}${unit || "%"}`;
}

function cssSizeValue(value, unit) {
  if (value === null || value === undefined) return "auto";
  if (unit === "normalized") return `${finiteNumber(value, 0) * 100}%`;
  return `${finiteNumber(value, 0)}${unit || "%"}`;
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

function definitionItem(label, value) {
  const item = element("div", "playground-definition-item");
  item.append(element("dt", "", label), element("dd", "", valueText(value, "—")));
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
  if (!Number.isFinite(value)) throw playgroundError("playground-number-invalid", { id: control?.id });
  return value;
}

function safeAreaText(value = {}) {
  return `${value.top || 0} / ${value.right || 0} / ${value.bottom || 0} / ${value.left || 0} ${value.unit || "px"}`;
}

function anchorLabel(value) {
  return {
    center: "Centro",
    "top-left": "Superior izquierda",
    "top-right": "Superior derecha",
    "bottom-left": "Inferior izquierda",
    "bottom-right": "Inferior derecha"
  }[value] || value;
}

function readableLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
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
      competitionType: model.competitionType,
      countOption: model.countOption,
      graphicId: model.selectedGraphicId,
      assetId: model.selectedAssetId,
      outputId: model.selectedOutputId,
      visibility: model.visibility
    }));
  } catch {
    // El Playground sigue siendo completamente funcional solo en memoria.
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
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

function normalizeNow(value) {
  if (typeof value === "function") return normalizeNow(value());
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nullableNonNegativeNumber(value, fallback) {
  if (value === null) return null;
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
  if (!model || typeof model !== "object" || !model.state || !model.previewContract) {
    throw playgroundError("playground-model-required");
  }
}

function playgroundError(code, details = {}) {
  const error = new Error(code);
  error.name = "BroadcastPlaygroundError";
  error.code = code;
  error.details = details;
  return error;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initializeBroadcastPlayground(document), { once: true });
  } else {
    initializeBroadcastPlayground(document);
  }
}
