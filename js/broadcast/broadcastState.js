export const BROADCAST_STATE_VERSION = "1.0.0";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 12;
const MAX_ARRAY_LENGTH = 250;
const DEFAULT_OUTPUT_STALE_AFTER_MS = 15000;
const DEFAULT_CONTEXT_STALE_AFTER_MS = 120000;
const VIEW_STATUSES = Object.freeze(["inactive", "ready", "on_air", "clearing", "error"]);
const GRAPHIC_STATUSES = Object.freeze(["idle", "prepared", "visible", "hidden", "entering", "exiting", "error"]);
const QUEUE_STATUSES = Object.freeze(["queued", "ready", "playing", "completed", "cancelled", "expired", "error"]);
const OUTPUT_TYPES = Object.freeze([
  "preview",
  "program",
  "browser",
  "obs",
  "vmix",
  "wirecast",
  "streamlabs",
  "led",
  "locutor_monitor",
  "mobile_monitor"
]);
const POSITION_UNITS = Object.freeze(["normalized", "%", "px", "vw", "vh"]);
const ALLOWED_PATCH_ROOTS = new Set([
  "session",
  "selection",
  "automation",
  "messages",
  "legacy",
  "source",
  "status"
]);
const LAYER_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "background", order: 10, group: "base", priority: 10 }),
  Object.freeze({ id: "scoreboard", order: 20, group: "sports", priority: 20 }),
  Object.freeze({ id: "turn", order: 30, group: "sports", priority: 30 }),
  Object.freeze({ id: "score", order: 40, group: "sports", priority: 40 }),
  Object.freeze({ id: "timer", order: 50, group: "sports", priority: 50 }),
  Object.freeze({ id: "alerts", order: 60, group: "overlay", priority: 60 }),
  Object.freeze({ id: "sponsors", order: 70, group: "overlay", priority: 70 }),
  Object.freeze({ id: "fullscreen", order: 80, group: "exclusive", priority: 80, exclusive: true }),
  Object.freeze({ id: "emergency", order: 90, group: "emergency", priority: 100, exclusive: true })
]);

export function createInitialBroadcastState(options = {}) {
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const source = isRecord(options.state) ? options.state : {};
  const sessionSource = firstRecord(options.session, source.session);
  const recoveryMode = options.recover === true || options.recovery === true || sessionSource.recoveryRequired === true;
  const requestedProgram = firstRecord(options.program, source.program);
  const initialWarnings = [
    ...(Array.isArray(source.warnings) ? source.warnings : []),
    ...(requestedProgram.active === true
      ? [recoveryMode ? "program-recovery-cleared" : "program-initialization-blocked"]
      : [])
  ];
  return normalizeBroadcastState({
    ...source,
    stateVersion: BROADCAST_STATE_VERSION,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    session: sessionSource,
    contextRef: firstRecord(options.contextRef, source.contextRef),
    selection: firstRecord(options.selection, source.selection),
    preview: firstRecord(options.preview, source.preview),
    program: {},
    layers: firstRecord(options.layers, source.layers),
    graphics: firstRecord(options.graphics, source.graphics),
    outputs: firstRecord(options.outputs, source.outputs),
    queue: firstArray(options.queue, source.queue),
    automation: firstRecord(options.automation, source.automation),
    messages: firstRecord(options.messages, source.messages),
    legacy: firstRecord(options.legacy, source.legacy),
    warnings: initialWarnings,
    source: firstDefined(options.source, source.source, "broadcast-state"),
    status: firstDefined(options.status, source.status, "idle")
  }, { ...options, now });
}

export function normalizeBroadcastState(state = {}, options = {}) {
  const cloneWarnings = [];
  const raw = cloneSerializable(isRecord(state) ? state : {}, cloneWarnings, "state") || {};
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const createdAt = normalizeIsoDate(raw.createdAt) || now;
  const revision = nonNegativeInteger(raw.revision, 0);
  const recoveryMode = options.recover === true || options.recovery === true;
  const recoveryWarnings = recoveryMode && raw.program?.active === true ? ["program-recovery-cleared"] : [];
  const session = normalizeSession(raw.session, createdAt);
  const contextRef = normalizeContextRef(raw.contextRef);
  const selection = normalizeSelection(raw.selection);
  const layers = normalizeLayers(raw.layers, createdAt);
  const graphics = normalizeGraphics(raw.graphics);
  const outputs = normalizeOutputs(raw.outputs, revision, now, options);
  const queue = normalizeQueue(raw.queue, now);

  const normalized = {
    stateVersion: BROADCAST_STATE_VERSION,
    revision,
    createdAt,
    updatedAt: normalizeIsoDate(raw.updatedAt) || createdAt,
    sessionId: nullableId(firstDefined(raw.sessionId, session.id)),
    source: nullableString(raw.source),
    status: nullableString(raw.status) || "idle",
    session,
    contextRef,
    selection,
    preview: normalizePreview(raw.preview),
    program: normalizeProgram(recoveryMode ? {} : raw.program),
    layers,
    graphics,
    outputs,
    queue,
    automation: normalizeAutomation(raw.automation),
    messages: normalizeMessages(raw.messages),
    legacy: normalizeLegacy(raw.legacy),
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...cloneWarnings, ...recoveryWarnings]),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };

  const validation = validateBroadcastState(normalized);
  normalized.errors = uniqueStrings([...normalized.errors, ...validation.errors]);
  return normalized;
}

export function validateBroadcastState(state) {
  const errors = [];
  const warnings = [];
  if (!isRecord(state)) {
    return { valid: false, errors: ["state-not-object"], warnings, stateVersion: BROADCAST_STATE_VERSION, revision: 0 };
  }
  if (state.stateVersion !== BROADCAST_STATE_VERSION) errors.push("state-version-incompatible");
  if (!Number.isInteger(state.revision) || state.revision < 0) errors.push("revision-invalid");
  if (!isIsoDate(state.createdAt)) errors.push("created-at-invalid");
  if (!isIsoDate(state.updatedAt)) errors.push("updated-at-invalid");

  ["session", "contextRef", "selection", "preview", "program", "layers", "graphics", "outputs", "automation", "messages", "legacy"].forEach((key) => {
    if (!isRecord(state[key])) errors.push(`block-invalid:${key}`);
  });
  if (!Array.isArray(state.queue)) errors.push("queue-not-array");
  if (!Array.isArray(state.warnings)) errors.push("warnings-not-array");
  if (!Array.isArray(state.errors)) errors.push("errors-not-array");

  validateView(state.preview, "preview", errors);
  validateView(state.program, "program", errors);
  validateGeometry(state.selection, "selection", errors);
  if (!Array.isArray(state.program?.lockedLayers)) errors.push("program-locked-layers-not-array");
  if (typeof state.program?.emergencyMode !== "boolean") errors.push("program-emergency-mode-invalid");

  Object.entries(isRecord(state.layers) ? state.layers : {}).forEach(([id, layer]) => validateLayer(id, layer, errors));
  Object.entries(isRecord(state.graphics) ? state.graphics : {}).forEach(([id, graphic]) => validateGraphic(id, graphic, errors));
  Object.entries(isRecord(state.outputs) ? state.outputs : {}).forEach(([id, output]) => validateOutput(id, output, errors));
  (Array.isArray(state.queue) ? state.queue : []).forEach((item, index) => validateQueueItem(item, index, errors));

  const outputIds = new Set(Object.keys(isRecord(state.outputs) ? state.outputs : {}));
  collectReferencedOutputIds(state).forEach((outputId) => {
    if (!outputIds.has(outputId)) warnings.push(`output-reference-missing:${outputId}`);
  });
  (state.program?.lockedLayers || []).forEach((layerId) => {
    if (!hasOwn(state.layers || {}, layerId)) warnings.push(`locked-layer-missing:${layerId}`);
  });

  warnings.push(...detectBroadcastStateWarnings(state));
  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    stateVersion: BROADCAST_STATE_VERSION,
    revision: Number.isInteger(state.revision) ? state.revision : 0
  };
}

export function applyBroadcastStatePatch(state, patch, options = {}) {
  if (!isRecord(patch)) throw broadcastStateError("patch-not-object");
  Object.keys(patch).forEach((key) => {
    const root = key.split(".")[0];
    if (root === "program") throw broadcastStateError("program-patch-forbidden");
    if (DANGEROUS_KEYS.has(key) || !ALLOWED_PATCH_ROOTS.has(key)) throw broadcastStateError(`patch-route-not-allowed:${key}`);
  });
  return transitionBroadcastState(state, options, (draft) => {
    Object.entries(patch).forEach(([key, value]) => {
      draft[key] = isRecord(value) && isRecord(draft[key])
        ? mergeSafeRecords(draft[key], value)
        : cloneSerializable(value, [], `patch.${key}`);
    });
  });
}

export function setPreviewState(state, previewState, options = {}) {
  if (!isRecord(previewState)) throw broadcastStateError("preview-state-not-object");
  return transitionBroadcastState(state, options, (draft, base, now) => {
    const next = options.replace === true ? previewState : mergeSafeRecords(base.preview, previewState);
    if (next.active === true) {
      next.preparedAt = firstDefined(previewState.preparedAt, now);
      next.preparedBy = firstDefined(previewState.preparedBy, actorId(options));
      next.status = firstDefined(previewState.status, "ready");
      next.clearedAt = null;
      next.clearedBy = null;
    }
    next.revision = base.preview.revision + 1;
    draft.preview = next;
  });
}

export function setProgramState(state, programState, options = {}) {
  if (!isRecord(programState)) throw broadcastStateError("program-state-not-object");
  if (programState.draft === true || hasBlockingErrors(programState)) throw broadcastStateError("program-state-not-authorized");
  return transitionBroadcastState(state, options, (draft, base, now) => {
    let next = options.replace === true ? programState : mergeSafeRecords(base.program, programState);
    next = preserveLockedProgramContent(base, next, options);
    if (base.program.emergencyMode && next.active !== true) throw broadcastStateError("program-emergency-active");
    if (base.program.active && next.active !== true) throw broadcastStateError("program-clear-required");
    if (next.active === true) {
      const actor = actorId(options);
      const outputIds = uniqueIds(next.outputIds);
      if (!actor) throw broadcastStateError("program-actor-required");
      if (!outputIds.length) throw broadcastStateError("program-output-required");
      if (hasBlockingErrors(next)) throw broadcastStateError("program-state-not-authorized");
      next.outputIds = outputIds;
      next.takenAt = now;
      next.takenBy = actor;
      next.status = "on_air";
      next.transitionMode = normalizeTransitionMode(firstDefined(programState.transitionMode, options.mode), "take");
      next.clearedAt = null;
      next.clearedBy = null;
    }
    next.revision = base.program.revision + 1;
    draft.program = next;
  });
}

export function promotePreviewToProgram(state, options = {}) {
  const base = normalizeBroadcastState(state, options);
  if (!base.preview.active) throw broadcastStateError("preview-not-active");
  if (base.preview.validation.valid === false || hasBlockingErrors(base.preview)) {
    throw broadcastStateError("preview-has-blocking-errors");
  }
  const actor = actorId(options);
  if (!actor) throw broadcastStateError("program-actor-required");
  if (!base.preview.outputIds.length) throw broadcastStateError("program-output-required");
  const mode = normalizeTransitionMode(options.mode, "take");
  return transitionBroadcastState(base, options, (draft, current, now) => {
    const projection = {
      active: true,
      revision: current.program.revision + 1,
      compositionId: current.preview.compositionId,
      sceneId: current.preview.sceneId,
      templateInstances: cloneSerializable(current.preview.templateInstances, [], "preview.templateInstances"),
      visibleGraphics: [...current.preview.visibleGraphics],
      activeLayers: [...current.preview.activeLayers],
      outputIds: [...current.preview.outputIds],
      themeId: current.preview.themeId,
      contextRef: cloneSerializable(current.preview.contextRef, [], "preview.contextRef") || {},
      takenAt: now,
      takenBy: actor,
      status: "on_air",
      transitionMode: mode,
      lockedLayers: [...current.program.lockedLayers],
      emergencyMode: current.program.emergencyMode,
      clearedAt: null,
      clearedBy: null,
      warnings: [],
      errors: []
    };
    draft.program = preserveLockedProgramContent(current, projection, options);
  });
}

export function clearPreviewState(state, options = {}) {
  return transitionBroadcastState(state, options, (draft, base, now) => {
    draft.preview = {
      ...emptyPreview(),
      revision: base.preview.revision + 1,
      clearedAt: now,
      clearedBy: actorId(options)
    };
  });
}

export function clearProgramState(state, options = {}) {
  const base = normalizeBroadcastState(state, options);
  if (base.program.emergencyMode && options.force !== true) throw broadcastStateError("program-emergency-active");
  return transitionBroadcastState(base, options, (draft, current, now) => {
    const lockedLayers = options.force === true ? [] : [...current.program.lockedLayers];
    const lockedGraphicIds = options.force === true ? [] : graphicsForLayers(current, lockedLayers, current.program.visibleGraphics);
    const active = lockedLayers.length > 0 || lockedGraphicIds.length > 0;
    draft.program = {
      ...emptyProgram(),
      active,
      revision: current.program.revision + 1,
      templateInstances: active
        ? filterTemplateInstances(current.program.templateInstances, lockedLayers, current.graphics)
        : {},
      visibleGraphics: lockedGraphicIds,
      activeLayers: [...lockedLayers],
      outputIds: active ? [...current.program.outputIds] : [],
      themeId: active ? current.program.themeId : null,
      contextRef: active ? cloneSerializable(current.program.contextRef, [], "program.contextRef") || {} : {},
      status: active ? "on_air" : "inactive",
      lockedLayers: [...lockedLayers],
      emergencyMode: active ? current.program.emergencyMode : false,
      clearedAt: now,
      clearedBy: actorId(options)
    };
  });
}

export function setLayerState(state, layerId, layerState, options = {}) {
  const id = requiredSafeId(layerId, "layer-id-required");
  if (!isRecord(layerState)) throw broadcastStateError("layer-state-not-object");
  const base = normalizeBroadcastState(state, options);
  if (base.layers[id]?.locked && options.force !== true) throw broadcastStateError(`layer-locked:${id}`);
  return transitionBroadcastState(base, options, (draft, current, now) => {
    draft.layers[id] = {
      ...(current.layers[id] || emptyLayer(id)),
      ...cloneSerializable(layerState, [], `layers.${id}`),
      id,
      updatedAt: now,
      updatedBy: actorId(options)
    };
  });
}

export function setGraphicState(state, graphicId, graphicState, options = {}) {
  const id = requiredSafeId(graphicId, "graphic-id-required");
  if (!isRecord(graphicState)) throw broadcastStateError("graphic-state-not-object");
  assertGraphicGeometry(graphicState);
  return transitionBroadcastState(state, options, (draft, base, now) => {
    draft.graphics[id] = {
      ...(base.graphics[id] || emptyGraphic(id)),
      ...cloneSerializable(graphicState, [], `graphics.${id}`),
      graphicId: id,
      updatedAt: now,
      updatedBy: actorId(options)
    };
  });
}

export function setOutputState(state, outputId, outputState, options = {}) {
  const id = requiredSafeId(outputId, "output-id-required");
  if (!isRecord(outputState)) throw broadcastStateError("output-state-not-object");
  return transitionBroadcastState(state, options, (draft, base, now) => {
    const nextOutput = {
      ...(base.outputs[id] || emptyOutput(id, now, base.revision, options)),
      ...cloneSerializable(outputState, [], `outputs.${id}`),
      id
    };
    if (!hasOwn(outputState, "stale")) delete nextOutput.stale;
    draft.outputs[id] = nextOutput;
  });
}

export function setBroadcastContextRef(state, contextRef, options = {}) {
  if (!isRecord(contextRef)) throw broadcastStateError("context-ref-not-object");
  return transitionBroadcastState(state, options, (draft) => {
    draft.contextRef = cloneSerializable(contextRef, [], "contextRef") || {};
  });
}

export function enqueueBroadcastItem(state, item, options = {}) {
  if (!isRecord(item)) throw broadcastStateError("queue-item-not-object");
  return transitionBroadcastState(state, options, (draft, base, now) => {
    const queueItemId = nullableId(item.queueItemId) || buildId("queue", now);
    if (base.queue.some((entry) => entry.queueItemId === queueItemId)) throw broadcastStateError(`queue-item-duplicate:${queueItemId}`);
    const normalizedItem = normalizeQueueItem({
      ...cloneSerializable(item, [], `queue.${queueItemId}`),
      queueItemId,
      queuedAt: firstDefined(item.queuedAt, now),
      queuedBy: firstDefined(item.queuedBy, actorId(options))
    }, base.queue.length, now);
    draft.queue = [...base.queue, normalizedItem];
  });
}

export function dequeueBroadcastItem(state, options = {}) {
  const base = normalizeBroadcastState(state, options);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const queue = sortQueue(normalizeQueue(base.queue, now));
  const requestedId = nullableId(options.queueItemId);
  const selected = requestedId
    ? queue.find((item) => item.queueItemId === requestedId && isQueueItemPlayable(item, now))
    : queue.find((item) => isQueueItemPlayable(item, now));
  if (!selected) return base;
  return transitionBroadcastState(base, options, (draft) => {
    draft.queue = base.queue.filter((item) => item.queueItemId !== selected.queueItemId);
  });
}

export function getBroadcastQueue(state) {
  const now = new Date().toISOString();
  const rawQueue = Array.isArray(state?.queue) ? state.queue : [];
  return cloneSerializable(sortQueue(normalizeQueue(rawQueue, now)), [], "queue") || [];
}

export function getVisibleGraphics(state, outputId) {
  const normalized = normalizeBroadcastState(state);
  const activeLayerIds = new Set(getActiveLayers(normalized, outputId).map((layer) => layer.id));
  return Object.values(normalized.graphics)
    .filter((graphic) => graphic.visible && activeLayerIds.has(graphic.layerId) && appliesToOutput(graphic.outputIds, outputId))
    .sort((left, right) => {
      const layerDifference = (normalized.layers[left.layerId]?.order || 0) - (normalized.layers[right.layerId]?.order || 0);
      return layerDifference || left.graphicId.localeCompare(right.graphicId);
    })
    .map((graphic) => cloneBroadcastState(graphic));
}

export function getActiveLayers(state, outputId) {
  const normalized = normalizeBroadcastState(state);
  const visible = Object.values(normalized.layers)
    .filter((layer) => layer.visible && appliesToOutput(layer.outputIds, outputId))
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const emergency = visible.find((layer) => layer.id === "emergency");
  if (emergency) return [cloneBroadcastState(emergency)];
  const fullscreen = visible.find((layer) => layer.id === "fullscreen");
  if (fullscreen) return [cloneBroadcastState(fullscreen)];
  const exclusive = [...visible].filter((layer) => layer.exclusive).sort((left, right) => right.priority - left.priority)[0];
  return (exclusive ? [exclusive] : visible).map((layer) => cloneBroadcastState(layer));
}

export function getBroadcastStateWarnings(state) {
  const revisionInvalid = !Number.isInteger(state?.revision) || state.revision < 0;
  const normalized = normalizeBroadcastState(state);
  const validation = validateBroadcastState(normalized);
  return uniqueStrings([
    ...(normalized.warnings || []),
    ...validation.warnings,
    ...(revisionInvalid ? ["revision-invalid"] : [])
  ]);
}

export function cloneBroadcastState(state) {
  return cloneSerializable(state, [], "state");
}

export function getBroadcastStateRevision(state) {
  return Number.isInteger(state?.revision) && state.revision >= 0 ? state.revision : 0;
}

function transitionBroadcastState(state, options, mutate) {
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const base = normalizeBroadcastState(state, { ...options, now });
  assertExpectedRevision(base, options.expectedRevision);
  const draft = cloneBroadcastState(base);
  mutate(draft, base, now);
  draft.stateVersion = BROADCAST_STATE_VERSION;
  draft.revision = base.revision + 1;
  draft.createdAt = base.createdAt;
  draft.updatedAt = now;
  if (isRecord(draft.session)) {
    draft.session.lastActivityAt = now;
    if (actorId(options)) draft.session.operatorId = firstDefined(draft.session.operatorId, actorId(options));
  }
  draft.sessionId = nullableId(draft.session?.id);

  const candidateValidation = validateBroadcastState(draft);
  if (!candidateValidation.valid) throw broadcastStateError("state-transition-invalid", candidateValidation.errors);
  const normalized = normalizeBroadcastState(draft, { ...options, now });
  const validation = validateBroadcastState(normalized);
  if (!validation.valid) throw broadcastStateError("state-transition-invalid", validation.errors);
  return normalized;
}

function normalizeSession(value, createdAt) {
  const raw = firstRecord(value);
  return {
    id: nullableId(firstDefined(raw.id, raw.sessionId)),
    tournamentId: nullableId(raw.tournamentId),
    competitionId: nullableId(raw.competitionId),
    outputIds: uniqueIds(raw.outputIds),
    operatorId: nullableId(raw.operatorId),
    operatorName: nullableString(raw.operatorName),
    startedAt: normalizeIsoDate(raw.startedAt),
    lastActivityAt: normalizeIsoDate(raw.lastActivityAt),
    status: nullableString(raw.status) || "inactive",
    recoverable: booleanValue(raw.recoverable, false),
    recoveryRequired: booleanValue(raw.recoveryRequired, false),
    closedAt: normalizeIsoDate(raw.closedAt),
    deviceId: nullableId(raw.deviceId),
    clientId: nullableId(raw.clientId),
    tenantId: nullableId(raw.tenantId),
    createdAt: normalizeIsoDate(raw.createdAt) || createdAt
  };
}

function normalizeContextRef(value) {
  const raw = firstRecord(value);
  return {
    contractVersion: nullableString(raw.contractVersion),
    contractRevision: nonNegativeIntegerOrNull(raw.contractRevision),
    generatedAt: normalizeIsoDate(raw.generatedAt),
    freshness: nullableString(raw.freshness) || "unknown",
    tournamentId: nullableId(raw.tournamentId),
    competitionId: nullableId(raw.competitionId),
    charreadaId: nullableId(raw.charreadaId),
    participantId: nullableId(raw.participantId),
    teamId: nullableId(raw.teamId),
    suerteId: nullableId(raw.suerteId),
    scoreId: nullableId(raw.scoreId),
    timerId: nullableId(raw.timerId),
    sourceType: nullableString(raw.sourceType)
  };
}

function normalizeSelection(value) {
  const raw = firstRecord(value);
  return {
    templateId: nullableId(raw.templateId),
    templateVersion: nullableString(raw.templateVersion),
    variantId: nullableId(raw.variantId),
    themeId: nullableId(raw.themeId),
    sceneId: nullableId(raw.sceneId),
    graphicId: nullableId(raw.graphicId),
    layerId: nullableId(raw.layerId),
    outputIds: uniqueIds(raw.outputIds),
    position: normalizePosition(raw.position),
    size: normalizeSize(raw.size),
    scale: positiveNumber(raw.scale, 1),
    opacity: opacityNumber(raw.opacity, 1),
    rotation: finiteNumber(raw.rotation, 0),
    duration: nonNegativeNumberOrNull(raw.duration),
    autoHide: booleanValue(raw.autoHide, false),
    payloadBindings: safeRecord(raw.payloadBindings),
    selectedAt: normalizeIsoDate(raw.selectedAt),
    selectedBy: nullableId(raw.selectedBy)
  };
}

function normalizePreview(value) {
  const raw = firstRecord(value);
  return {
    active: booleanValue(raw.active, false),
    revision: nonNegativeInteger(raw.revision, 0),
    compositionId: nullableId(raw.compositionId),
    sceneId: nullableId(raw.sceneId),
    templateInstances: normalizeSerializableContainer(raw.templateInstances, {}),
    visibleGraphics: uniqueIds(raw.visibleGraphics),
    activeLayers: uniqueIds(raw.activeLayers),
    outputIds: uniqueIds(raw.outputIds),
    themeId: nullableId(raw.themeId),
    contextRef: normalizeContextRef(raw.contextRef),
    preparedAt: normalizeIsoDate(raw.preparedAt),
    preparedBy: nullableId(raw.preparedBy),
    clearedAt: normalizeIsoDate(raw.clearedAt),
    clearedBy: nullableId(raw.clearedBy),
    status: VIEW_STATUSES.includes(raw.status) ? raw.status : "inactive",
    validation: normalizeValidation(raw.validation),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : []),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };
}

function normalizeProgram(value) {
  const raw = firstRecord(value);
  return {
    active: booleanValue(raw.active, false),
    revision: nonNegativeInteger(raw.revision, 0),
    compositionId: nullableId(raw.compositionId),
    sceneId: nullableId(raw.sceneId),
    templateInstances: normalizeSerializableContainer(raw.templateInstances, {}),
    visibleGraphics: uniqueIds(raw.visibleGraphics),
    activeLayers: uniqueIds(raw.activeLayers),
    outputIds: uniqueIds(raw.outputIds),
    themeId: nullableId(raw.themeId),
    contextRef: normalizeContextRef(raw.contextRef),
    takenAt: normalizeIsoDate(raw.takenAt),
    takenBy: nullableId(raw.takenBy),
    clearedAt: normalizeIsoDate(raw.clearedAt),
    clearedBy: nullableId(raw.clearedBy),
    status: VIEW_STATUSES.includes(raw.status) ? raw.status : "inactive",
    transitionMode: ["take", "cut", "auto"].includes(raw.transitionMode) ? raw.transitionMode : null,
    lockedLayers: uniqueIds(raw.lockedLayers),
    emergencyMode: booleanValue(raw.emergencyMode, false),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : []),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };
}

function emptyPreview() {
  return normalizePreview({});
}

function emptyProgram() {
  return normalizeProgram({});
}

function normalizeLayers(value, now) {
  const raw = firstRecord(value);
  const layers = {};
  LAYER_DEFINITIONS.forEach((definition) => {
    layers[definition.id] = normalizeLayer({ ...definition, ...firstRecord(raw[definition.id]) }, definition.id, now);
  });
  Object.entries(raw).forEach(([id, layer]) => {
    if (DANGEROUS_KEYS.has(id) || hasOwn(layers, id) || !isRecord(layer)) return;
    layers[id] = normalizeLayer(layer, id, now);
  });
  return layers;
}

function normalizeLayer(value, fallbackId, now) {
  const raw = firstRecord(value);
  const id = nullableId(firstDefined(raw.id, fallbackId));
  return {
    id,
    order: finiteNumber(raw.order, 0),
    group: nullableString(raw.group) || "custom",
    visible: booleanValue(raw.visible, false),
    locked: booleanValue(raw.locked, false),
    exclusive: booleanValue(raw.exclusive, false),
    priority: finiteNumber(raw.priority, 0),
    outputIds: uniqueIds(raw.outputIds),
    graphicIds: uniqueIds(raw.graphicIds),
    status: nullableString(raw.status) || "idle",
    updatedAt: normalizeIsoDate(raw.updatedAt) || now,
    updatedBy: nullableId(raw.updatedBy)
  };
}

function emptyLayer(id) {
  return normalizeLayer({ id }, id, new Date().toISOString());
}

function normalizeGraphics(value) {
  const raw = firstRecord(value);
  return Object.entries(raw).reduce((graphics, [mapId, graphic]) => {
    if (DANGEROUS_KEYS.has(mapId) || !isRecord(graphic)) return graphics;
    const normalized = normalizeGraphic(graphic, mapId);
    if (normalized.graphicId) graphics[normalized.graphicId] = normalized;
    return graphics;
  }, {});
}

function normalizeGraphic(value, fallbackId) {
  const raw = firstRecord(value);
  return {
    graphicId: nullableId(firstDefined(raw.graphicId, raw.id, fallbackId)),
    templateId: nullableId(raw.templateId),
    templateVersion: nullableString(raw.templateVersion),
    variantId: nullableId(raw.variantId),
    themeId: nullableId(raw.themeId),
    layerId: nullableId(raw.layerId),
    visible: booleanValue(raw.visible, false),
    status: GRAPHIC_STATUSES.includes(raw.status) ? raw.status : "idle",
    position: normalizePosition(raw.position),
    size: normalizeSize(raw.size),
    scale: positiveNumber(raw.scale, 1),
    opacity: opacityNumber(raw.opacity, 1),
    rotation: finiteNumber(raw.rotation, 0),
    duration: nonNegativeNumberOrNull(raw.duration),
    autoHide: booleanValue(raw.autoHide, false),
    outputIds: uniqueIds(raw.outputIds),
    contextRef: normalizeContextRef(raw.contextRef),
    payloadBindings: safeRecord(raw.payloadBindings),
    startedAt: normalizeIsoDate(raw.startedAt),
    updatedAt: normalizeIsoDate(raw.updatedAt),
    updatedBy: nullableId(raw.updatedBy),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : []),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : [])
  };
}

function emptyGraphic(id) {
  return normalizeGraphic({ graphicId: id }, id);
}

function normalizeOutputs(value, revision, now, options) {
  const raw = firstRecord(value);
  return Object.entries(raw).reduce((outputs, [mapId, output]) => {
    if (DANGEROUS_KEYS.has(mapId) || !isRecord(output)) return outputs;
    const normalized = normalizeOutput(output, mapId, revision, now, options);
    if (normalized.id) outputs[normalized.id] = normalized;
    return outputs;
  }, {});
}

function normalizeOutput(value, fallbackId, revision, now, options) {
  const raw = firstRecord(value);
  const heartbeat = normalizeHeartbeat(raw.heartbeat);
  const staleAfterMs = nonNegativeNumber(options.outputStaleAfterMs, DEFAULT_OUTPUT_STALE_AFTER_MS);
  const heartbeatAge = Date.parse(now) - Date.parse(heartbeat.at || "");
  const stale = raw.stale === true
    || raw.status === "disconnected"
    || (Number.isFinite(heartbeatAge) && heartbeatAge > staleAfterMs);
  return {
    id: nullableId(firstDefined(raw.id, raw.outputId, fallbackId)),
    name: nullableString(raw.name),
    type: OUTPUT_TYPES.includes(raw.type) ? raw.type : "browser",
    status: nullableString(raw.status) || "disconnected",
    resolution: normalizeResolution(raw.resolution),
    orientation: nullableString(raw.orientation),
    aspectRatio: nullableString(raw.aspectRatio),
    safeArea: normalizeSafeArea(raw.safeArea),
    assignedLayers: uniqueIds(raw.assignedLayers),
    themeId: nullableId(raw.themeId),
    heartbeat,
    lastAppliedRevision: nonNegativeInteger(raw.lastAppliedRevision, 0),
    latency: nonNegativeNumberOrNull(raw.latency),
    stale,
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : []),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : []),
    capabilities: safeRecord(raw.capabilities),
    connectedAt: normalizeIsoDate(raw.connectedAt),
    disconnectedAt: normalizeIsoDate(raw.disconnectedAt),
    targetRevision: nonNegativeInteger(firstDefined(raw.targetRevision, revision), revision)
  };
}

function emptyOutput(id, now, revision, options) {
  return normalizeOutput({ id, type: "browser", status: "disconnected" }, id, revision, now, options);
}

function normalizeQueue(value, now) {
  const raw = Array.isArray(value) ? value : [];
  return raw.slice(0, MAX_ARRAY_LENGTH).map((item, index) => normalizeQueueItem(item, index, now)).filter(Boolean);
}

function normalizeQueueItem(value, index, now) {
  if (!isRecord(value)) return null;
  const expiresAt = normalizeIsoDate(value.expiresAt);
  const expired = expiresAt && Date.parse(expiresAt) <= Date.parse(now);
  return {
    queueItemId: nullableId(value.queueItemId) || `queue_${index + 1}`,
    type: nullableString(value.type) || "graphic",
    graphicId: nullableId(value.graphicId),
    templateId: nullableId(value.templateId),
    sceneId: nullableId(value.sceneId),
    payloadBindings: safeRecord(value.payloadBindings),
    outputIds: uniqueIds(value.outputIds),
    priority: finiteNumber(value.priority, 0),
    status: expired ? "expired" : (QUEUE_STATUSES.includes(value.status) ? value.status : "queued"),
    queuedAt: normalizeIsoDate(value.queuedAt) || now,
    queuedBy: nullableId(value.queuedBy),
    scheduledAt: normalizeIsoDate(value.scheduledAt),
    expiresAt,
    duration: nonNegativeNumberOrNull(value.duration),
    autoHide: booleanValue(value.autoHide, false),
    notes: nullableString(value.notes)
  };
}

function normalizeAutomation(value) {
  const raw = firstRecord(value);
  return {
    enabled: booleanValue(raw.enabled, false),
    mode: ["manual", "semiautomatic", "automatic"].includes(raw.mode) ? raw.mode : "manual",
    paused: booleanValue(raw.paused, false),
    pausedAt: normalizeIsoDate(raw.pausedAt),
    pausedBy: nullableId(raw.pausedBy),
    lastTrigger: normalizeSerializableContainer(raw.lastTrigger, null),
    pendingSuggestions: cloneArray(raw.pendingSuggestions),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };
}

function normalizeMessages(value) {
  const raw = firstRecord(value);
  return {
    active: booleanValue(raw.active, false),
    unreadCount: nonNegativeInteger(raw.unreadCount, 0),
    lastMessageId: nullableId(raw.lastMessageId),
    pendingAcknowledgements: cloneArray(raw.pendingAcknowledgements),
    channels: cloneArray(raw.channels),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };
}

function normalizeLegacy(value) {
  const raw = firstRecord(value);
  return {
    enabled: booleanValue(raw.enabled, true),
    activeEngine: ["v1", "v2", "none"].includes(raw.activeEngine) ? raw.activeEngine : "v1",
    v1OutputIds: uniqueIds(raw.v1OutputIds),
    v2OutputIds: uniqueIds(raw.v2OutputIds),
    fallbackAvailable: booleanValue(raw.fallbackAvailable, true),
    fallbackReason: nullableString(raw.fallbackReason),
    legacyProjectionRevision: nonNegativeInteger(raw.legacyProjectionRevision, 0),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : [])
  };
}

function normalizeValidation(value) {
  const raw = firstRecord(value);
  return {
    valid: typeof raw.valid === "boolean" ? raw.valid : true,
    checkedAt: normalizeIsoDate(raw.checkedAt),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : []),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : [])
  };
}

function normalizePosition(value) {
  const raw = firstRecord(value);
  return {
    x: finiteNumber(raw.x, 0),
    y: finiteNumber(raw.y, 0),
    anchor: nullableString(raw.anchor) || "center",
    unit: POSITION_UNITS.includes(raw.unit) ? raw.unit : "normalized"
  };
}

function normalizeSize(value) {
  const raw = firstRecord(value);
  return {
    width: nonNegativeNumberOrNull(raw.width),
    height: nonNegativeNumberOrNull(raw.height),
    unit: POSITION_UNITS.includes(raw.unit) ? raw.unit : "normalized"
  };
}

function normalizeResolution(value) {
  const raw = firstRecord(value);
  return {
    width: nonNegativeIntegerOrNull(raw.width),
    height: nonNegativeIntegerOrNull(raw.height)
  };
}

function normalizeSafeArea(value) {
  const raw = firstRecord(value);
  return {
    top: nonNegativeNumber(raw.top, 0),
    right: nonNegativeNumber(raw.right, 0),
    bottom: nonNegativeNumber(raw.bottom, 0),
    left: nonNegativeNumber(raw.left, 0),
    unit: POSITION_UNITS.includes(raw.unit) ? raw.unit : "%"
  };
}

function normalizeHeartbeat(value) {
  const raw = firstRecord(value);
  return {
    at: normalizeIsoDate(firstDefined(raw.at, raw.timestamp)),
    status: nullableString(raw.status) || "unknown"
  };
}

function validateView(view, name, errors) {
  if (!isRecord(view)) return;
  if (typeof view.active !== "boolean") errors.push(`${name}-active-invalid`);
  if (!Number.isInteger(view.revision) || view.revision < 0) errors.push(`${name}-revision-invalid`);
  ["visibleGraphics", "activeLayers", "outputIds", "warnings", "errors"].forEach((key) => {
    if (!Array.isArray(view[key])) errors.push(`${name}-${key}-not-array`);
  });
  if (!VIEW_STATUSES.includes(view.status)) errors.push(`${name}-status-invalid`);
}

function validateGeometry(value, name, errors) {
  if (!isRecord(value)) return;
  if (!Number.isFinite(value.scale) || value.scale <= 0) errors.push(`${name}-scale-invalid`);
  if (!Number.isFinite(value.opacity) || value.opacity < 0 || value.opacity > 1) errors.push(`${name}-opacity-invalid`);
  if (!Number.isFinite(value.position?.x) || !Number.isFinite(value.position?.y)) errors.push(`${name}-position-invalid`);
  if (value.size?.width !== null && (!Number.isFinite(value.size?.width) || value.size.width < 0)) errors.push(`${name}-width-invalid`);
  if (value.size?.height !== null && (!Number.isFinite(value.size?.height) || value.size.height < 0)) errors.push(`${name}-height-invalid`);
}

function validateLayer(id, layer, errors) {
  if (!isRecord(layer) || layer.id !== id) errors.push(`layer-invalid:${id}`);
  if (!Number.isFinite(layer?.order) || !Number.isFinite(layer?.priority)) errors.push(`layer-order-invalid:${id}`);
  if (![layer?.visible, layer?.locked, layer?.exclusive].every((value) => typeof value === "boolean")) errors.push(`layer-flags-invalid:${id}`);
  if (!Array.isArray(layer?.outputIds) || !Array.isArray(layer?.graphicIds)) errors.push(`layer-arrays-invalid:${id}`);
}

function validateGraphic(id, graphic, errors) {
  if (!isRecord(graphic) || graphic.graphicId !== id) errors.push(`graphic-invalid:${id}`);
  if (!GRAPHIC_STATUSES.includes(graphic?.status)) errors.push(`graphic-status-invalid:${id}`);
  validateGeometry(graphic, `graphic:${id}`, errors);
  if (!Array.isArray(graphic?.outputIds) || !Array.isArray(graphic?.errors) || !Array.isArray(graphic?.warnings)) errors.push(`graphic-arrays-invalid:${id}`);
}

function validateOutput(id, output, errors) {
  if (!isRecord(output) || output.id !== id) errors.push(`output-invalid:${id}`);
  if (!OUTPUT_TYPES.includes(output?.type)) errors.push(`output-type-invalid:${id}`);
  if (!Number.isInteger(output?.lastAppliedRevision) || output.lastAppliedRevision < 0) errors.push(`output-revision-invalid:${id}`);
  if (!Array.isArray(output?.assignedLayers) || !Array.isArray(output?.errors) || !Array.isArray(output?.warnings)) errors.push(`output-arrays-invalid:${id}`);
}

function validateQueueItem(item, index, errors) {
  if (!isRecord(item) || !item.queueItemId) errors.push(`queue-item-invalid:${index}`);
  if (!QUEUE_STATUSES.includes(item?.status)) errors.push(`queue-status-invalid:${index}`);
  if (!Number.isFinite(item?.priority)) errors.push(`queue-priority-invalid:${index}`);
  if (!Array.isArray(item?.outputIds)) errors.push(`queue-outputs-invalid:${index}`);
}

function detectBroadcastStateWarnings(state) {
  const warnings = [];
  if (!state.session?.id) warnings.push("session-missing");
  if (!state.session?.tournamentId) warnings.push("tournament-id-missing");
  if (state.session?.recoveryRequired) warnings.push("recovery-required");
  if (hasBlockingErrors(state.preview)) warnings.push("preview-has-errors");
  if (state.program?.active && !state.program.outputIds.length) warnings.push("program-active-without-outputs");
  if (state.contextRef?.freshness === "stale" || contextAgeIsStale(state.contextRef)) warnings.push("context-stale");

  Object.values(state.outputs || {}).forEach((output) => {
    if (output.status === "disconnected") warnings.push(`output-disconnected:${output.id}`);
    if (output.stale) warnings.push(`output-stale:${output.id}`);
    if (state.program?.active && state.program.outputIds.includes(output.id) && output.lastAppliedRevision < state.program.revision) {
      warnings.push(`program-revision-not-applied:${output.id}`);
    }
  });
  Object.values(state.graphics || {}).forEach((graphic) => {
    if (graphic.visible && !graphic.templateId) warnings.push(`visible-graphic-without-template:${graphic.graphicId}`);
  });
  Object.values(state.layers || {}).forEach((layer) => {
    if (layer.visible && !layer.graphicIds.length) warnings.push(`visible-layer-without-graphics:${layer.id}`);
    if (layer.locked && !layer.visible && layer.status === "visible") warnings.push(`locked-layer-inconsistent:${layer.id}`);
  });
  (state.queue || []).forEach((item) => {
    if (item.status === "expired") warnings.push(`queue-item-expired:${item.queueItemId}`);
  });
  const conflicts = intersection(state.legacy?.v1OutputIds, state.legacy?.v2OutputIds);
  conflicts.forEach((outputId) => warnings.push(`legacy-v2-output-conflict:${outputId}`));
  if (state.program?.emergencyMode || state.layers?.emergency?.visible) warnings.push("emergency-active");
  if (!Number.isInteger(state.revision) || state.revision < 0) warnings.push("revision-invalid");
  return uniqueStrings(warnings);
}

function preserveLockedProgramContent(state, nextProgram, options) {
  const current = state.program;
  if (options.overrideLockedLayers === true || options.force === true || !current.lockedLayers.length) return nextProgram;
  const lockedLayers = [...current.lockedLayers];
  const lockedGraphics = graphicsForLayers(state, lockedLayers, current.visibleGraphics);
  return {
    ...nextProgram,
    lockedLayers,
    activeLayers: uniqueIds([...(nextProgram.activeLayers || []), ...lockedLayers]),
    visibleGraphics: uniqueIds([...(nextProgram.visibleGraphics || []), ...lockedGraphics]),
    templateInstances: mergeTemplateInstances(
      nextProgram.templateInstances,
      filterTemplateInstances(current.templateInstances, lockedLayers, state.graphics)
    ),
    emergencyMode: current.emergencyMode || nextProgram.emergencyMode === true
  };
}

function graphicsForLayers(state, layerIds, graphicIds) {
  const layerSet = new Set(layerIds);
  return uniqueIds(graphicIds).filter((graphicId) => layerSet.has(state.graphics?.[graphicId]?.layerId));
}

function filterTemplateInstances(instances, layerIds, graphics) {
  const layerSet = new Set(layerIds);
  if (Array.isArray(instances)) {
    return instances.filter((instance) => layerSet.has(instance?.layerId) || layerSet.has(graphics?.[instance?.graphicId]?.layerId));
  }
  if (!isRecord(instances)) return {};
  return Object.entries(instances).reduce((output, [id, instance]) => {
    if (layerSet.has(instance?.layerId) || layerSet.has(graphics?.[instance?.graphicId || id]?.layerId)) output[id] = instance;
    return output;
  }, {});
}

function mergeTemplateInstances(primary, locked) {
  if (Array.isArray(primary) || Array.isArray(locked)) {
    const all = [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(locked) ? locked : [])];
    const seen = new Set();
    return all.filter((item) => {
      const id = item?.instanceId || item?.graphicId || JSON.stringify(item);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
  return { ...safeRecord(primary), ...safeRecord(locked) };
}

function assertGraphicGeometry(value) {
  if (hasOwn(value, "scale") && (!Number.isFinite(Number(value.scale)) || Number(value.scale) <= 0)) throw broadcastStateError("graphic-scale-invalid");
  if (hasOwn(value, "opacity") && (!Number.isFinite(Number(value.opacity)) || Number(value.opacity) < 0 || Number(value.opacity) > 1)) throw broadcastStateError("graphic-opacity-invalid");
  if (isRecord(value.position)) {
    ["x", "y"].forEach((key) => {
      if (hasOwn(value.position, key) && !Number.isFinite(Number(value.position[key]))) throw broadcastStateError(`graphic-position-invalid:${key}`);
    });
  }
  if (isRecord(value.size)) {
    ["width", "height"].forEach((key) => {
      if (hasOwn(value.size, key) && (!Number.isFinite(Number(value.size[key])) || Number(value.size[key]) < 0)) throw broadcastStateError(`graphic-size-invalid:${key}`);
    });
  }
}

function collectReferencedOutputIds(state) {
  return uniqueIds([
    ...(state.session?.outputIds || []),
    ...(state.selection?.outputIds || []),
    ...(state.preview?.outputIds || []),
    ...(state.program?.outputIds || []),
    ...Object.values(state.layers || {}).flatMap((layer) => layer.outputIds || []),
    ...Object.values(state.graphics || {}).flatMap((graphic) => graphic.outputIds || []),
    ...(state.queue || []).flatMap((item) => item.outputIds || [])
  ]);
}

function sortQueue(queue) {
  return [...queue].sort((left, right) => {
    const priorityDifference = right.priority - left.priority;
    if (priorityDifference) return priorityDifference;
    const timeDifference = Date.parse(left.queuedAt || "") - Date.parse(right.queuedAt || "");
    return timeDifference || left.queueItemId.localeCompare(right.queueItemId);
  });
}

function isQueueItemPlayable(item, now) {
  if (!item || !["queued", "ready"].includes(item.status)) return false;
  if (item.expiresAt && Date.parse(item.expiresAt) <= Date.parse(now)) return false;
  if (item.scheduledAt && Date.parse(item.scheduledAt) > Date.parse(now)) return false;
  return true;
}

function appliesToOutput(outputIds, outputId) {
  if (!outputId) return true;
  return !Array.isArray(outputIds) || !outputIds.length || outputIds.includes(outputId);
}

function contextAgeIsStale(contextRef) {
  if (!contextRef?.generatedAt) return false;
  const age = Date.now() - Date.parse(contextRef.generatedAt);
  return Number.isFinite(age) && age > DEFAULT_CONTEXT_STALE_AFTER_MS;
}

function assertExpectedRevision(state, expectedRevision) {
  if (expectedRevision === undefined || expectedRevision === null) return;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== state.revision) {
    throw broadcastStateError("expected-revision-mismatch", { expectedRevision, actualRevision: state.revision });
  }
}

function actorId(options) {
  const actor = firstRecord(options.actor);
  return nullableId(firstDefined(actor.userId, actor.id, options.updatedBy, options.actorId));
}

function hasBlockingErrors(view) {
  return (Array.isArray(view?.errors) && view.errors.length > 0)
    || (Array.isArray(view?.validation?.errors) && view.validation.errors.length > 0)
    || view?.validation?.valid === false;
}

function mergeSafeRecords(base, patch) {
  const output = cloneSerializable(base, [], "base") || {};
  Object.entries(patch).forEach(([key, value]) => {
    if (DANGEROUS_KEYS.has(key)) throw broadcastStateError(`dangerous-key:${key}`);
    output[key] = isRecord(value) && isRecord(output[key])
      ? mergeSafeRecords(output[key], value)
      : cloneSerializable(value, [], `patch.${key}`);
  });
  return output;
}

function cloneSerializable(value, warnings = [], path = "value", ancestors = new WeakSet(), depth = 0) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return String(value);
  if (value === undefined) return undefined;
  if (typeof value === "function" || typeof value === "symbol") {
    warnings.push(`non-serializable-removed:${path}`);
    return undefined;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (depth >= MAX_DEPTH) {
    warnings.push(`depth-limited:${path}`);
    return null;
  }
  if (typeof value !== "object") return null;
  if (ancestors.has(value)) {
    warnings.push(`circular-reference-removed:${path}`);
    return undefined;
  }
  const output = Array.isArray(value) ? [] : {};
  ancestors.add(value);
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, MAX_ARRAY_LENGTH);
    for (let index = 0; index < limit; index += 1) {
      const cloned = cloneSerializable(value[index], warnings, `${path}.${index}`, ancestors, depth + 1);
      if (cloned !== undefined) output.push(cloned);
    }
    if (value.length > MAX_ARRAY_LENGTH) warnings.push(`array-truncated:${path}`);
    ancestors.delete(value);
    return output;
  }
  Object.keys(value).forEach((key) => {
    if (DANGEROUS_KEYS.has(key)) {
      warnings.push(`dangerous-key-removed:${path}.${key}`);
      return;
    }
    const cloned = cloneSerializable(value[key], warnings, `${path}.${key}`, ancestors, depth + 1);
    if (cloned !== undefined) output[key] = cloned;
  });
  ancestors.delete(value);
  return output;
}

function normalizeSerializableContainer(value, fallback) {
  if (!Array.isArray(value) && !isRecord(value)) return cloneSerializable(fallback, [], "fallback");
  return cloneSerializable(value, [], "container");
}

function safeRecord(value) {
  return isRecord(value) ? cloneSerializable(value, [], "record") || {} : {};
}

function cloneArray(value) {
  return Array.isArray(value) ? cloneSerializable(value, [], "array") || [] : [];
}

function uniqueIds(value) {
  const values = Array.isArray(value) ? value : [];
  return [...new Set(values.map((item) => nullableId(item)).filter(Boolean))].slice(0, MAX_ARRAY_LENGTH);
}

function intersection(left, right) {
  const rightSet = new Set(Array.isArray(right) ? right : []);
  return uniqueIds(left).filter((item) => rightSet.has(item));
}

function nullableString(value) {
  return value === null || value === undefined ? null : String(value);
}

function nullableId(value) {
  if (value === null || value === undefined || value === "") return null;
  const id = String(value);
  return DANGEROUS_KEYS.has(id) ? null : id;
}

function requiredSafeId(value, code) {
  const id = nullableId(value);
  if (!id) throw broadcastStateError(code);
  return id;
}

function booleanValue(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function finiteNumber(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveNumber(value, fallback) {
  const number = finiteNumber(value, fallback);
  return number > 0 ? number : fallback;
}

function opacityNumber(value, fallback) {
  const number = finiteNumber(value, fallback);
  return number >= 0 && number <= 1 ? number : fallback;
}

function normalizeTransitionMode(value, fallback = null) {
  return ["take", "cut", "auto"].includes(value) ? value : fallback;
}

function nonNegativeNumber(value, fallback) {
  const number = finiteNumber(value, fallback);
  return number >= 0 ? number : fallback;
}

function nonNegativeNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function nonNegativeIntegerOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function normalizeIsoDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isIsoDate(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstRecord(...values) {
  return values.find((value) => isRecord(value)) || {};
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))];
}

function buildId(prefix, now) {
  return `${prefix}_${Date.parse(now)}_${Math.random().toString(36).slice(2, 8)}`;
}

function broadcastStateError(code, details = null) {
  const error = new Error(code);
  error.name = "BroadcastStateError";
  error.code = code;
  error.details = details;
  return error;
}
