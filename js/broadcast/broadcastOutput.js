import {
  normalizeBroadcastState,
  validateBroadcastState
} from "./broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import {
  sanitizeBroadcastDataContract,
  validateBroadcastDataContract
} from "./dataContract.js?v=20260713-broadcast-output-001-output-v1";

export const BROADCAST_OUTPUT_VERSION = "1.0.0";

export const BROADCAST_OUTPUT_TYPES = Object.freeze([
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

export const BROADCAST_OUTPUT_STATUSES = Object.freeze([
  "unregistered",
  "offline",
  "connecting",
  "online",
  "stale",
  "degraded",
  "error",
  "disabled"
]);

export const BROADCAST_OUTPUT_VISIBILITIES = Object.freeze([
  "public",
  "production",
  "operational",
  "restricted"
]);

const CAPABILITY_SCHEMA_V1 = Object.freeze({
  transparency: Object.freeze({ kind: "boolean" }),
  audio: Object.freeze({ kind: "boolean" }),
  video: Object.freeze({ kind: "boolean" }),
  browserSource: Object.freeze({ kind: "boolean" }),
  heartbeat: Object.freeze({ kind: "boolean" }),
  interaction: Object.freeze({ kind: "boolean" }),
  multiLayer: Object.freeze({ kind: "boolean" }),
  dynamicResize: Object.freeze({ kind: "boolean" }),
  alphaChannel: Object.freeze({ kind: "boolean" }),
  animation: Object.freeze({ kind: "boolean" }),
  reducedMotion: Object.freeze({ kind: "boolean" }),
  supportsPreview: Object.freeze({ kind: "boolean" }),
  supportsProgram: Object.freeze({ kind: "boolean" }),
  maxWidth: Object.freeze({ kind: "positiveIntegerOrNull" }),
  maxHeight: Object.freeze({ kind: "positiveIntegerOrNull" }),
  supportedFormats: Object.freeze({ kind: "stringArray" })
});

export const BROADCAST_OUTPUT_CAPABILITIES = Object.freeze(Object.keys(CAPABILITY_SCHEMA_V1));

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SAFE_AREA_UNITS = new Set(["px", "%", "normalized"]);
const PROJECTION_VIEWS = new Set(["preview", "program"]);
const HEARTBEAT_STATUSES = new Set(["offline", "connecting", "online", "stale", "degraded", "error"]);
const MAX_DEPTH = 12;
const MAX_ARRAY_LENGTH = 250;
const DEFAULT_STALE_AFTER_MS = 15000;
const OUTPUT_REGISTRY = new Map();

const VISIBILITY_RANK = Object.freeze({
  public: 0,
  production: 1,
  operational: 2,
  restricted: 3
});

export class BroadcastOutputError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastOutputError";
    this.code = code;
    this.details = cloneSerializable(details, [], "error.details") || {};
  }
}

export function createBroadcastOutput(input = {}, options = {}) {
  if (!isRecord(input)) throw outputError("output-not-object");
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const safeInput = cloneSerializable(input, [], "output") || {};
  const id = normalizeId(firstDefined(safeInput.id, safeInput.outputId, options.id)) || buildOutputId(now, options.random);
  const output = normalizeBroadcastOutput({
    ...safeInput,
    id,
    createdAt: firstDefined(safeInput.createdAt, now),
    updatedAt: firstDefined(safeInput.updatedAt, now),
    createdBy: firstDefined(safeInput.createdBy, options.actor),
    updatedBy: firstDefined(safeInput.updatedBy, options.actor),
    revision: firstDefined(safeInput.revision, 0)
  }, { ...options, now });
  assertValidOutput(output);
  return output;
}

export function normalizeBroadcastOutput(input = {}, options = {}) {
  const cloneWarnings = [];
  const raw = cloneSerializable(isRecord(input) ? input : {}, cloneWarnings, "output") || {};
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const id = normalizeId(firstDefined(raw.id, raw.outputId, options.id));
  const type = BROADCAST_OUTPUT_TYPES.includes(raw.type) ? raw.type : "browser";
  const resolution = normalizeResolution(raw.resolution, raw);
  const orientation = normalizeOrientation(firstDefined(raw.orientation, resolution.orientation), resolution.width, resolution.height);
  resolution.orientation = orientation;
  const aspectRatio = normalizeAspectRatio(firstDefined(raw.aspectRatio, resolution.aspectRatio), resolution.width, resolution.height);
  resolution.aspectRatio = aspectRatio;
  const visibility = normalizeVisibility(firstDefined(raw.visibility, raw.projection?.visibility, options.visibility));
  const capabilities = normalizeCapabilities(raw.capabilities, type);
  const heartbeat = normalizeHeartbeat(raw.heartbeat);
  let status = BROADCAST_OUTPUT_STATUSES.includes(raw.status) ? raw.status : "unregistered";
  const enabled = hasOwn(raw, "enabled") ? raw.enabled === true : status !== "disabled";
  if (!enabled) status = "disabled";
  const staleAfterMs = positiveNumber(firstDefined(raw.staleAfterMs, options.staleAfterMs), DEFAULT_STALE_AFTER_MS);
  if (status !== "disabled" && enabled && capabilities.heartbeat && isHeartbeatStale(heartbeat, status, now, staleAfterMs)) {
    status = "stale";
  }

  const createdAt = normalizeIsoDate(raw.createdAt) || now;
  const normalized = {
    outputVersion: BROADCAST_OUTPUT_VERSION,
    revision: nonNegativeInteger(raw.revision, 0),
    id,
    name: nullableString(raw.name),
    type,
    status,
    enabled: status === "disabled" ? false : enabled,
    visibility,
    resolution,
    orientation,
    aspectRatio,
    safeArea: normalizeSafeArea(raw.safeArea),
    assignedLayers: uniqueStrings(raw.assignedLayers),
    themeId: nullableId(raw.themeId),
    capabilities,
    heartbeat,
    staleAfterMs,
    lastAppliedRevision: nonNegativeInteger(raw.lastAppliedRevision, 0),
    lastAppliedAt: normalizeIsoDate(raw.lastAppliedAt),
    latency: nonNegativeNumberOrNull(raw.latency),
    projection: normalizeProjectionSettings(raw.projection, type, visibility),
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...cloneWarnings]),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : []),
    createdAt,
    updatedAt: normalizeIsoDate(raw.updatedAt) || createdAt,
    createdBy: normalizeActor(raw.createdBy),
    updatedBy: normalizeActor(raw.updatedBy),
    tenantId: nullableId(raw.tenantId),
    organizationId: nullableId(raw.organizationId),
    tournamentId: nullableId(raw.tournamentId),
    competitionId: nullableId(raw.competitionId),
    sessionId: nullableId(raw.sessionId)
  };

  const detectedWarnings = detectOutputWarnings(normalized, { now });
  normalized.warnings = uniqueStrings([...normalized.warnings, ...detectedWarnings]);
  return normalized;
}

export function validateBroadcastOutput(output) {
  const errors = [];
  const warnings = [];
  if (!isRecord(output)) {
    return { valid: false, errors: ["output-not-object"], warnings, outputVersion: BROADCAST_OUTPUT_VERSION };
  }
  if (output.outputVersion !== BROADCAST_OUTPUT_VERSION) errors.push("output-version-incompatible");
  if (!normalizeId(output.id)) errors.push("output-id-required");
  if (!BROADCAST_OUTPUT_TYPES.includes(output.type)) errors.push("output-type-invalid");
  if (!BROADCAST_OUTPUT_STATUSES.includes(output.status)) errors.push("output-status-invalid");
  if (typeof output.enabled !== "boolean") errors.push("output-enabled-invalid");
  if (!BROADCAST_OUTPUT_VISIBILITIES.includes(output.visibility)) errors.push("output-visibility-invalid");
  validateResolution(output.resolution, errors);
  if (!output.resolution || output.orientation !== output.resolution.orientation) errors.push("output-orientation-mismatch");
  if (!output.resolution || output.aspectRatio !== output.resolution.aspectRatio) errors.push("output-aspect-ratio-mismatch");
  validateSafeArea(output.safeArea, errors);
  validateCapabilities(output.capabilities, errors);
  validateHeartbeat(output.heartbeat, errors);
  if (!Array.isArray(output.assignedLayers)) errors.push("output-assigned-layers-invalid");
  if (!Number.isInteger(output.revision) || output.revision < 0) errors.push("output-revision-invalid");
  if (!Number.isInteger(output.lastAppliedRevision) || output.lastAppliedRevision < 0) errors.push("output-last-applied-revision-invalid");
  if (!isIsoDate(output.createdAt)) errors.push("output-created-at-invalid");
  if (!isIsoDate(output.updatedAt)) errors.push("output-updated-at-invalid");
  if (output.lastAppliedAt !== null && !isIsoDate(output.lastAppliedAt)) errors.push("output-last-applied-at-invalid");
  if (output.latency !== null && (!Number.isFinite(output.latency) || output.latency < 0)) errors.push("output-latency-invalid");
  if (!isRecord(output.projection) || !PROJECTION_VIEWS.has(output.projection.view)) errors.push("output-projection-invalid");
  if (containsDangerousKey(output)) errors.push("output-dangerous-key-present");
  warnings.push(...detectOutputWarnings(output));
  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    outputVersion: BROADCAST_OUTPUT_VERSION
  };
}

export function registerBroadcastOutput(input, options = {}) {
  const output = createBroadcastOutput(input, options);
  const current = OUTPUT_REGISTRY.get(output.id);
  if (current && options.replace !== true) throw outputError("output-already-registered", { id: output.id });
  const stored = current
    ? normalizeBroadcastOutput({
        ...output,
        createdAt: current.createdAt,
        createdBy: current.createdBy,
        revision: current.revision + 1,
        updatedAt: normalizeIsoDate(options.now) || new Date().toISOString(),
        updatedBy: firstDefined(options.actor, output.updatedBy)
      }, options)
    : output;
  assertValidOutput(stored);
  OUTPUT_REGISTRY.set(stored.id, freezeDeep(cloneBroadcastOutput(stored)));
  return cloneBroadcastOutput(stored);
}

export function updateBroadcastOutput(outputId, patch = {}, options = {}) {
  const id = requiredId(outputId);
  const current = OUTPUT_REGISTRY.get(id);
  if (!current) throw outputError("output-not-registered", { id });
  if (!isRecord(patch)) throw outputError("output-patch-not-object", { id });
  assertExpectedRevision(current, options.expectedRevision);
  assertPatchFields(patch);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const safePatch = cloneSerializable(patch, [], `outputs.${id}`) || {};
  const mergedResolution = hasOwn(safePatch, "resolution")
    ? mergeSafeRecords(current.resolution, safePatch.resolution)
    : current.resolution;
  const mergedSafeArea = hasOwn(safePatch, "safeArea")
    ? mergeSafeRecords(current.safeArea, safePatch.safeArea)
    : current.safeArea;
  const resolutionDimensionsChanged = hasOwn(safePatch.resolution || {}, "width") || hasOwn(safePatch.resolution || {}, "height");
  if (resolutionDimensionsChanged && !hasOwn(safePatch.resolution, "orientation")) delete mergedResolution.orientation;
  if (resolutionDimensionsChanged && !hasOwn(safePatch.resolution, "aspectRatio")) delete mergedResolution.aspectRatio;
  if (hasOwn(safePatch, "resolution")) assertResolutionInput(mergedResolution);
  if (hasOwn(safePatch, "safeArea")) assertSafeAreaInput(mergedSafeArea);
  const candidate = normalizeBroadcastOutput({
    ...current,
    ...safePatch,
    id,
    outputVersion: BROADCAST_OUTPUT_VERSION,
    revision: current.revision + 1,
    resolution: mergedResolution,
    orientation: resolutionDimensionsChanged && !hasOwn(safePatch, "orientation") ? null : firstDefined(safePatch.orientation, current.orientation),
    aspectRatio: resolutionDimensionsChanged && !hasOwn(safePatch, "aspectRatio") ? null : firstDefined(safePatch.aspectRatio, current.aspectRatio),
    safeArea: mergedSafeArea,
    capabilities: hasOwn(safePatch, "capabilities") ? mergeSafeRecords(current.capabilities, safePatch.capabilities) : current.capabilities,
    heartbeat: hasOwn(safePatch, "heartbeat") ? mergeSafeRecords(current.heartbeat, safePatch.heartbeat) : current.heartbeat,
    projection: hasOwn(safePatch, "projection") ? mergeSafeRecords(current.projection, safePatch.projection) : current.projection,
    createdAt: current.createdAt,
    createdBy: current.createdBy,
    updatedAt: now,
    updatedBy: firstDefined(options.actor, current.updatedBy)
  }, { ...options, now });
  assertValidOutput(candidate);
  OUTPUT_REGISTRY.set(id, freezeDeep(cloneBroadcastOutput(candidate)));
  return cloneBroadcastOutput(candidate);
}

export function removeBroadcastOutput(outputId, options = {}) {
  const id = requiredId(outputId);
  const current = OUTPUT_REGISTRY.get(id);
  if (!current) return null;
  assertExpectedRevision(current, options.expectedRevision);
  OUTPUT_REGISTRY.delete(id);
  return cloneBroadcastOutput(current);
}

export function getBroadcastOutput(outputId) {
  const id = normalizeId(outputId);
  if (!id || !OUTPUT_REGISTRY.has(id)) return null;
  return cloneBroadcastOutput(OUTPUT_REGISTRY.get(id));
}

export function listBroadcastOutputs(filter = {}) {
  const safeFilter = isRecord(filter) ? filter : {};
  return [...OUTPUT_REGISTRY.values()]
    .filter((output) => matchesOutputFilter(output, safeFilter))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
    .map((output) => cloneBroadcastOutput(output));
}

export function setBroadcastOutputStatus(outputId, status, options = {}) {
  if (!BROADCAST_OUTPUT_STATUSES.includes(status)) throw outputError("output-status-invalid", { status });
  return updateBroadcastOutput(outputId, {
    status,
    enabled: status !== "disabled"
  }, options);
}

export function updateBroadcastOutputHeartbeat(outputId, heartbeat = {}, options = {}) {
  const id = requiredId(outputId);
  const current = OUTPUT_REGISTRY.get(id);
  if (!current) throw outputError("output-not-registered", { id });
  if (!isRecord(heartbeat)) throw outputError("heartbeat-not-object", { id });
  assertExpectedRevision(current, options.expectedRevision);
  const now = normalizeIsoDate(firstDefined(heartbeat.at, options.now)) || new Date().toISOString();
  const requestedSequence = hasOwn(heartbeat, "sequence") ? nonNegativeIntegerOrNull(heartbeat.sequence) : null;
  if (hasOwn(heartbeat, "sequence") && requestedSequence === null) {
    throw outputError("heartbeat-sequence-invalid", { id, received: heartbeat.sequence });
  }
  if (requestedSequence !== null && requestedSequence <= current.heartbeat.sequence) {
    throw outputError("heartbeat-sequence-out-of-order", {
      id,
      current: current.heartbeat.sequence,
      received: requestedSequence
    });
  }
  const currentHeartbeatAt = normalizeIsoDate(current.heartbeat.at);
  if (requestedSequence === null && currentHeartbeatAt && Date.parse(now) < Date.parse(currentHeartbeatAt)) {
    throw outputError("heartbeat-timestamp-out-of-order", {
      id,
      currentAt: currentHeartbeatAt,
      receivedAt: now
    });
  }
  const sequence = requestedSequence === null ? current.heartbeat.sequence + 1 : requestedSequence;
  const heartbeatStatus = HEARTBEAT_STATUSES.has(heartbeat.status) ? heartbeat.status : "online";
  const nextStatus = current.status === "disabled" ? "disabled" : heartbeatStatus;
  return updateBroadcastOutput(id, {
    heartbeat: {
      ...current.heartbeat,
      ...heartbeat,
      at: now,
      status: heartbeatStatus,
      sequence
    },
    status: nextStatus,
    latency: hasOwn(heartbeat, "latency") ? heartbeat.latency : current.latency
  }, options);
}

export function setBroadcastOutputCapabilities(outputId, capabilities, options = {}) {
  if (!isRecord(capabilities)) throw outputError("output-capabilities-not-object");
  assertCapabilitiesInput(capabilities);
  return updateBroadcastOutput(outputId, { capabilities }, options);
}

export function assignLayersToOutput(outputId, layerIds, options = {}) {
  if (!Array.isArray(layerIds)) throw outputError("output-layers-not-array");
  return updateBroadcastOutput(outputId, { assignedLayers: uniqueStrings(layerIds) }, options);
}

export function assignThemeToOutput(outputId, themeId, options = {}) {
  if (themeId !== null && typeof themeId !== "string") throw outputError("output-theme-invalid");
  return updateBroadcastOutput(outputId, { themeId }, options);
}

export function setOutputResolution(outputId, resolution, options = {}) {
  assertResolutionInput(resolution);
  return updateBroadcastOutput(outputId, { resolution }, options);
}

export function setOutputSafeArea(outputId, safeArea, options = {}) {
  assertSafeAreaInput(safeArea);
  return updateBroadcastOutput(outputId, { safeArea }, options);
}

export function buildBroadcastOutputProjection(outputOrId, broadcastState, broadcastContract, options = {}) {
  const output = resolveOutput(outputOrId, options);
  assertValidOutput(output);
  if (!output.enabled || output.status === "disabled") throw outputError("output-disabled", { id: output.id });
  if (output.projection.enabled !== true) throw outputError("output-projection-disabled", { id: output.id });
  if (!isRecord(broadcastState)) throw outputError("broadcast-state-required");
  if (!isRecord(broadcastContract)) throw outputError("broadcast-contract-required");

  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const normalizedState = normalizeBroadcastState(broadcastState, { now });
  const stateValidation = validateBroadcastState(normalizedState);
  const requestedView = firstDefined(options.view, output.projection.view, inferProjectionView(output.type));
  if (!PROJECTION_VIEWS.has(requestedView)) throw outputError("projection-view-invalid", { view: requestedView });
  const visibility = restrictVisibility(output.projection.visibility, options.visibility);
  const sanitizedContract = sanitizeBroadcastDataContract(broadcastContract, visibility);
  const contractValidation = validateBroadcastDataContract(sanitizedContract);
  const selectedView = cloneSerializable(normalizedState[requestedView], [], `state.${requestedView}`) || {};
  const activeLayerIds = uniqueStrings(selectedView.activeLayers);
  const assignedLayerIds = output.assignedLayers.length
    ? output.assignedLayers.filter((layerId) => activeLayerIds.includes(layerId))
    : activeLayerIds;
  const assignedSet = new Set(assignedLayerIds);
  const layers = assignedLayerIds
    .map((layerId) => normalizedState.layers?.[layerId])
    .filter(Boolean)
    .map((layer) => cloneSerializable(layer, [], `layers.${layer.id}`));
  const visibleGraphicIds = uniqueStrings(selectedView.visibleGraphics);
  const graphics = visibleGraphicIds
    .map((graphicId) => normalizedState.graphics?.[graphicId])
    .filter((graphic) => graphic && (!graphic.layerId || !assignedSet.size || assignedSet.has(graphic.layerId)))
    .filter((graphic) => !graphic.outputIds?.length || graphic.outputIds.includes(output.id))
    .map((graphic) => cloneSerializable(graphic, [], `graphics.${graphic.graphicId}`));
  const visibleGraphicSet = new Set(graphics.map((graphic) => graphic.graphicId));
  const templateInstances = Object.entries(isRecord(selectedView.templateInstances) ? selectedView.templateInstances : {})
    .reduce((instances, [instanceId, instance]) => {
      if (DANGEROUS_KEYS.has(instanceId) || !isRecord(instance)) return instances;
      const graphicId = normalizeId(firstDefined(instance.graphicId, instance.id, instanceId));
      const layerId = normalizeId(instance.layerId);
      if (graphicId && visibleGraphicSet.size && !visibleGraphicSet.has(graphicId)) return instances;
      if (layerId && assignedSet.size && !assignedSet.has(layerId)) return instances;
      instances[instanceId] = cloneSerializable(instance, [], `templateInstances.${instanceId}`);
      return instances;
    }, {});

  const warnings = uniqueStrings([
    ...output.warnings,
    ...stateValidation.warnings.map((warning) => `state:${warning}`),
    ...contractValidation.warnings.map((warning) => `contract:${warning}`),
    ...output.assignedLayers.filter((layerId) => !activeLayerIds.includes(layerId)).map((layerId) => `assigned-layer-inactive:${layerId}`),
    ...(requestedView === "preview" && !output.capabilities.supportsPreview ? ["output-does-not-declare-preview-support"] : []),
    ...(requestedView === "program" && !output.capabilities.supportsProgram ? ["output-does-not-declare-program-support"] : []),
    ...(isBroadcastOutputStale(output, { now }) ? ["output-stale"] : [])
  ]);
  const errors = uniqueStrings([
    ...output.errors.map((error) => `output:${error}`),
    ...stateValidation.errors.map((error) => `state:${error}`),
    ...contractValidation.errors.map((error) => `contract:${error}`)
  ]);

  const projection = {
    projectionVersion: BROADCAST_OUTPUT_VERSION,
    projectionId: `projection_${output.id}_${requestedView}_${normalizedState.revision}`,
    generatedAt: now,
    visibility,
    output: buildProjectionOutputDescriptor(output, now, visibility),
    broadcast: {
      stateVersion: normalizedState.stateVersion,
      revision: normalizedState.revision,
      selectedView: requestedView,
      viewRevision: nonNegativeInteger(selectedView.revision, 0),
      active: selectedView.active === true,
      status: nullableString(selectedView.status),
      compositionId: nullableId(selectedView.compositionId),
      sceneId: nullableId(selectedView.sceneId),
      themeId: output.themeId ?? nullableId(selectedView.themeId),
      transitionMode: requestedView === "program" ? nullableString(selectedView.transitionMode) : null,
      contextRef: cloneSerializable(selectedView.contextRef, [], "projection.contextRef") || {},
      templateInstances,
      activeLayerIds: assignedLayerIds,
      visibleGraphicIds: graphics.map((graphic) => graphic.graphicId)
    },
    layers,
    graphics,
    contract: sanitizedContract,
    warnings,
    errors
  };
  const validation = validateOutputProjection(projection);
  projection.validation = validation;
  projection.warnings = uniqueStrings([...projection.warnings, ...validation.warnings]);
  projection.errors = uniqueStrings([...projection.errors, ...validation.errors]);
  projection.validation = {
    ...validation,
    valid: projection.errors.length === 0,
    errors: [...projection.errors],
    warnings: [...projection.warnings]
  };
  return cloneSerializable(projection, [], "projection");
}

export function validateOutputProjection(projection) {
  const errors = [];
  const warnings = [];
  if (!isRecord(projection)) {
    return { valid: false, errors: ["projection-not-object"], warnings, projectionVersion: BROADCAST_OUTPUT_VERSION };
  }
  if (projection.projectionVersion !== BROADCAST_OUTPUT_VERSION) errors.push("projection-version-incompatible");
  if (!normalizeId(projection.projectionId)) errors.push("projection-id-required");
  if (!isIsoDate(projection.generatedAt)) errors.push("projection-generated-at-invalid");
  if (!BROADCAST_OUTPUT_VISIBILITIES.includes(projection.visibility)) errors.push("projection-visibility-invalid");
  if (!isRecord(projection.output) || !normalizeId(projection.output.id)) {
    errors.push("projection-output-invalid");
  } else {
    if (!BROADCAST_OUTPUT_TYPES.includes(projection.output.type)) errors.push("projection-output-type-invalid");
    if (!BROADCAST_OUTPUT_STATUSES.includes(projection.output.status)) errors.push("projection-output-status-invalid");
    if (typeof projection.output.enabled !== "boolean") errors.push("projection-output-enabled-invalid");
    if (!BROADCAST_OUTPUT_VISIBILITIES.includes(projection.output.visibility)) errors.push("projection-output-visibility-invalid");
    if (BROADCAST_OUTPUT_VISIBILITIES.includes(projection.output.visibility)
      && VISIBILITY_RANK[projection.visibility] > VISIBILITY_RANK[projection.output.visibility]) {
      errors.push("projection-visibility-escalated");
    }
    validateResolution(projection.output.resolution, errors);
    validateSafeArea(projection.output.safeArea, errors);
    validateCapabilities(projection.output.capabilities, errors);
  }
  if (!isRecord(projection.broadcast)) errors.push("projection-broadcast-invalid");
  if (!PROJECTION_VIEWS.has(projection.broadcast?.selectedView)) errors.push("projection-view-invalid");
  if (!Number.isInteger(projection.broadcast?.revision) || projection.broadcast.revision < 0) errors.push("projection-state-revision-invalid");
  if (!Number.isInteger(projection.broadcast?.viewRevision) || projection.broadcast.viewRevision < 0) errors.push("projection-view-revision-invalid");
  if (typeof projection.broadcast?.active !== "boolean") errors.push("projection-view-active-invalid");
  if (!Array.isArray(projection.broadcast?.activeLayerIds)) errors.push("projection-active-layer-ids-invalid");
  if (!Array.isArray(projection.broadcast?.visibleGraphicIds)) errors.push("projection-visible-graphic-ids-invalid");
  if (hasOwn(projection.broadcast || {}, "preview") || hasOwn(projection.broadcast || {}, "program")) {
    errors.push("projection-view-mixed");
  }
  if (!Array.isArray(projection.layers)) errors.push("projection-layers-invalid");
  if (!Array.isArray(projection.graphics)) errors.push("projection-graphics-invalid");
  if (!isRecord(projection.contract)) errors.push("projection-contract-invalid");
  if (isRecord(projection.contract) && projection.contract.visibility !== projection.visibility) errors.push("projection-contract-visibility-mismatch");
  if (!Array.isArray(projection.warnings)) errors.push("projection-warnings-invalid");
  if (!Array.isArray(projection.errors)) errors.push("projection-errors-invalid");
  if (containsDangerousKey(projection)) errors.push("projection-dangerous-key-present");
  if (projection.output?.stale === true) warnings.push("output-stale");
  return {
    valid: errors.length === 0 && (!Array.isArray(projection.errors) || projection.errors.length === 0),
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    projectionVersion: BROADCAST_OUTPUT_VERSION
  };
}

export function getBroadcastOutputWarnings(outputOrId, options = {}) {
  const output = typeof outputOrId === "string" ? getBroadcastOutput(outputOrId) : outputOrId;
  if (!isRecord(output)) return ["output-not-found"];
  const normalized = normalizeBroadcastOutput(output, options);
  return uniqueStrings([
    ...(Array.isArray(normalized.warnings) ? normalized.warnings : []),
    ...detectOutputWarnings(normalized, options)
  ]);
}

export function isBroadcastOutputStale(outputOrId, options = {}) {
  const output = typeof outputOrId === "string" ? OUTPUT_REGISTRY.get(outputOrId) : outputOrId;
  if (!isRecord(output) || output.enabled === false || output.status === "disabled") return false;
  if (output.status === "stale") return true;
  if (output.status === "offline" || output.status === "unregistered") return false;
  const capabilities = isRecord(output.capabilities) ? output.capabilities : {};
  if (capabilities.heartbeat !== true) return false;
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const staleAfterMs = positiveNumber(firstDefined(options.staleAfterMs, output.staleAfterMs), DEFAULT_STALE_AFTER_MS);
  return isHeartbeatStale(output.heartbeat, output.status, now, staleAfterMs);
}

export function cloneBroadcastOutput(output) {
  return cloneSerializable(output, [], "output") || null;
}

function resolveOutput(outputOrId, options) {
  if (typeof outputOrId === "string") {
    const registered = getBroadcastOutput(outputOrId);
    if (!registered) throw outputError("output-not-registered", { id: outputOrId });
    return registered;
  }
  return normalizeBroadcastOutput(outputOrId, options);
}

function buildProjectionOutputDescriptor(output, now, visibility) {
  const descriptor = {
    id: output.id,
    name: output.name,
    type: output.type,
    status: output.status,
    enabled: output.enabled,
    visibility: output.visibility,
    resolution: cloneBroadcastOutput(output.resolution),
    orientation: output.orientation,
    aspectRatio: output.aspectRatio,
    safeArea: cloneBroadcastOutput(output.safeArea),
    assignedLayers: [...output.assignedLayers],
    themeId: output.themeId,
    capabilities: cloneBroadcastOutput(output.capabilities),
    lastAppliedRevision: output.lastAppliedRevision,
    lastAppliedAt: output.lastAppliedAt,
    latency: output.latency,
    stale: isBroadcastOutputStale(output, { now }),
    tenantId: output.tenantId,
    organizationId: output.organizationId,
    tournamentId: output.tournamentId,
    competitionId: output.competitionId,
    sessionId: output.sessionId
  };
  if (visibility === "public") {
    delete descriptor.tenantId;
    delete descriptor.organizationId;
    delete descriptor.sessionId;
  }
  return descriptor;
}

function normalizeResolution(value, envelope = {}) {
  const raw = isRecord(value) ? value : {};
  const width = positiveInteger(firstDefined(raw.width, envelope.width), 1920);
  const height = positiveInteger(firstDefined(raw.height, envelope.height), 1080);
  const orientation = normalizeOrientation(firstDefined(raw.orientation, envelope.orientation), width, height);
  const aspectRatio = normalizeAspectRatio(firstDefined(raw.aspectRatio, envelope.aspectRatio), width, height);
  return {
    width,
    height,
    orientation,
    aspectRatio,
    pixelRatio: positiveNumber(raw.pixelRatio, 1),
    refreshRate: positiveNumberOrNull(raw.refreshRate)
  };
}

function normalizeSafeArea(value) {
  const raw = isRecord(value) ? value : {};
  const unit = SAFE_AREA_UNITS.has(raw.unit) ? raw.unit : "px";
  const max = unit === "%" ? 100 : unit === "normalized" ? 1 : Number.POSITIVE_INFINITY;
  return {
    top: boundedNonNegativeNumber(raw.top, 0, max),
    right: boundedNonNegativeNumber(raw.right, 0, max),
    bottom: boundedNonNegativeNumber(raw.bottom, 0, max),
    left: boundedNonNegativeNumber(raw.left, 0, max),
    unit
  };
}

function normalizeCapabilities(value, type) {
  const raw = isRecord(value) ? value : {};
  const defaults = capabilityDefaults(type);
  return Object.entries(CAPABILITY_SCHEMA_V1).reduce((result, [key, definition]) => {
    const value = raw[key];
    if (definition.kind === "boolean") result[key] = hasOwn(raw, key) ? value === true : defaults[key] === true;
    if (definition.kind === "positiveIntegerOrNull") result[key] = positiveIntegerOrNull(value);
    if (definition.kind === "stringArray") result[key] = uniqueStrings(value);
    return result;
  }, {});
}

function capabilityDefaults(type) {
  const browserFamily = ["browser", "obs", "vmix", "wirecast", "streamlabs"].includes(type);
  const monitor = ["locutor_monitor", "mobile_monitor"].includes(type);
  return {
    transparency: ["browser", "obs", "vmix", "wirecast", "streamlabs"].includes(type),
    audio: false,
    video: false,
    browserSource: browserFamily,
    heartbeat: !["preview", "program"].includes(type),
    interaction: monitor || type === "api",
    multiLayer: !monitor,
    dynamicResize: browserFamily || monitor || type === "led",
    alphaChannel: ["browser", "obs", "vmix", "wirecast", "streamlabs"].includes(type),
    animation: !["led", "locutor_monitor", "mobile_monitor", "api"].includes(type),
    reducedMotion: monitor,
    supportsPreview: type === "preview" || monitor || browserFamily,
    supportsProgram: type === "program" || browserFamily || type === "led" || type === "api"
  };
}

function normalizeHeartbeat(value) {
  const raw = isRecord(value) ? value : {};
  return {
    at: normalizeIsoDate(raw.at),
    status: HEARTBEAT_STATUSES.has(raw.status) ? raw.status : "offline",
    sequence: nonNegativeInteger(raw.sequence, 0),
    source: nullableString(raw.source),
    version: nullableString(raw.version),
    lastError: nullableString(raw.lastError)
  };
}

function normalizeProjectionSettings(value, type, visibility) {
  const raw = isRecord(value) ? value : {};
  const view = PROJECTION_VIEWS.has(raw.view) ? raw.view : inferProjectionView(type);
  return {
    enabled: hasOwn(raw, "enabled") ? raw.enabled === true : true,
    view,
    visibility: restrictVisibility(visibility, raw.visibility)
  };
}

function normalizeActor(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return { userId: value, name: null, role: null };
  if (!isRecord(value)) return null;
  return {
    userId: nullableId(firstDefined(value.userId, value.uid, value.id)),
    name: nullableString(value.name),
    role: nullableString(value.role)
  };
}

function validateResolution(resolution, errors) {
  if (!isRecord(resolution)) {
    errors.push("output-resolution-invalid");
    return;
  }
  if (!Number.isInteger(resolution.width) || resolution.width <= 0) errors.push("output-width-invalid");
  if (!Number.isInteger(resolution.height) || resolution.height <= 0) errors.push("output-height-invalid");
  if (!isPositiveFinite(resolution.pixelRatio)) errors.push("output-pixel-ratio-invalid");
  if (resolution.refreshRate !== null && !isPositiveFinite(resolution.refreshRate)) errors.push("output-refresh-rate-invalid");
  if (!["landscape", "portrait", "square"].includes(resolution.orientation)) errors.push("output-orientation-invalid");
  if (typeof resolution.aspectRatio !== "string" || !resolution.aspectRatio) errors.push("output-aspect-ratio-invalid");
}

function validateSafeArea(safeArea, errors) {
  if (!isRecord(safeArea) || !SAFE_AREA_UNITS.has(safeArea.unit)) {
    errors.push("output-safe-area-invalid");
    return;
  }
  const max = safeArea.unit === "%" ? 100 : safeArea.unit === "normalized" ? 1 : Number.POSITIVE_INFINITY;
  ["top", "right", "bottom", "left"].forEach((edge) => {
    if (!Number.isFinite(safeArea[edge]) || safeArea[edge] < 0 || safeArea[edge] > max) {
      errors.push(`output-safe-area-${edge}-invalid`);
    }
  });
}

function validateCapabilities(capabilities, errors) {
  if (!isRecord(capabilities)) {
    errors.push("output-capabilities-invalid");
    return;
  }
  Object.entries(CAPABILITY_SCHEMA_V1).forEach(([key, definition]) => {
    const value = capabilities[key];
    if (definition.kind === "boolean" && typeof value !== "boolean") errors.push(`output-capability-${key}-invalid`);
    if (definition.kind === "positiveIntegerOrNull" && value !== null && (!Number.isInteger(value) || value <= 0)) {
      errors.push(`output-capability-${key}-invalid`);
    }
    if (definition.kind === "stringArray" && !Array.isArray(value)) errors.push(`output-capability-${key}-invalid`);
  });
}

function validateHeartbeat(heartbeat, errors) {
  if (!isRecord(heartbeat)) {
    errors.push("output-heartbeat-invalid");
    return;
  }
  if (heartbeat.at !== null && !isIsoDate(heartbeat.at)) errors.push("output-heartbeat-at-invalid");
  if (!HEARTBEAT_STATUSES.has(heartbeat.status)) errors.push("output-heartbeat-status-invalid");
  if (!Number.isInteger(heartbeat.sequence) || heartbeat.sequence < 0) errors.push("output-heartbeat-sequence-invalid");
}

function assertResolutionInput(resolution) {
  if (!isRecord(resolution)) throw outputError("output-resolution-not-object");
  if (hasOwn(resolution, "width") && (!Number.isInteger(resolution.width) || resolution.width <= 0)) throw outputError("output-width-invalid");
  if (hasOwn(resolution, "height") && (!Number.isInteger(resolution.height) || resolution.height <= 0)) throw outputError("output-height-invalid");
  if (hasOwn(resolution, "pixelRatio") && !isPositiveFinite(resolution.pixelRatio)) throw outputError("output-pixel-ratio-invalid");
  if (hasOwn(resolution, "refreshRate") && resolution.refreshRate !== null && !isPositiveFinite(resolution.refreshRate)) {
    throw outputError("output-refresh-rate-invalid");
  }
}

function assertSafeAreaInput(safeArea) {
  if (!isRecord(safeArea)) throw outputError("output-safe-area-not-object");
  const unit = firstDefined(safeArea.unit, "px");
  if (!SAFE_AREA_UNITS.has(unit)) throw outputError("output-safe-area-unit-invalid");
  const max = unit === "%" ? 100 : unit === "normalized" ? 1 : Number.POSITIVE_INFINITY;
  ["top", "right", "bottom", "left"].forEach((edge) => {
    if (hasOwn(safeArea, edge) && (!Number.isFinite(safeArea[edge]) || safeArea[edge] < 0 || safeArea[edge] > max)) {
      throw outputError(`output-safe-area-${edge}-invalid`);
    }
  });
}

function assertCapabilitiesInput(capabilities) {
  Object.keys(capabilities).forEach((key) => {
    const definition = CAPABILITY_SCHEMA_V1[key];
    if (DANGEROUS_KEYS.has(key) || !definition) throw outputError(`output-capability-not-supported:${key}`);
    if (definition.kind === "boolean" && typeof capabilities[key] !== "boolean") throw outputError(`output-capability-${key}-invalid`);
    if (definition.kind === "positiveIntegerOrNull" && capabilities[key] !== null && (!Number.isInteger(capabilities[key]) || capabilities[key] <= 0)) {
      throw outputError(`output-capability-${key}-invalid`);
    }
    if (definition.kind === "stringArray" && !Array.isArray(capabilities[key])) throw outputError(`output-capability-${key}-invalid`);
  });
}

function assertPatchFields(patch) {
  ["id", "outputId", "outputVersion", "revision", "createdAt", "createdBy"].forEach((key) => {
    if (hasOwn(patch, key)) throw outputError(`output-patch-field-forbidden:${key}`);
  });
  if (hasOwn(patch, "type") && !BROADCAST_OUTPUT_TYPES.includes(patch.type)) throw outputError("output-type-invalid");
  if (hasOwn(patch, "status") && !BROADCAST_OUTPUT_STATUSES.includes(patch.status)) throw outputError("output-status-invalid");
  if (hasOwn(patch, "visibility") && !BROADCAST_OUTPUT_VISIBILITIES.includes(patch.visibility)) throw outputError("output-visibility-invalid");
  if (hasOwn(patch, "resolution")) assertResolutionInput(patch.resolution);
  if (hasOwn(patch, "safeArea")) assertSafeAreaInput(patch.safeArea);
  if (hasOwn(patch, "capabilities")) assertCapabilitiesInput(patch.capabilities);
}

function assertValidOutput(output) {
  const validation = validateBroadcastOutput(output);
  if (!validation.valid) throw outputError("output-invalid", { errors: validation.errors });
}

function assertExpectedRevision(output, expectedRevision) {
  if (expectedRevision === undefined || expectedRevision === null) return;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== output.revision) {
    throw outputError("output-expected-revision-mismatch", {
      expectedRevision,
      actualRevision: output.revision
    });
  }
}

function detectOutputWarnings(output, options = {}) {
  if (!isRecord(output)) return ["output-not-object"];
  const warnings = [];
  if (output.enabled === false || output.status === "disabled") warnings.push("output-disabled");
  if (output.status === "offline" || output.status === "unregistered") warnings.push("output-offline");
  if (output.status === "degraded") warnings.push("output-degraded");
  if (output.status === "error") warnings.push("output-error");
  if (isBroadcastOutputStale(output, options)) warnings.push("output-stale");
  if (output.capabilities?.maxWidth && output.resolution?.width > output.capabilities.maxWidth) warnings.push("output-width-exceeds-capability");
  if (output.capabilities?.maxHeight && output.resolution?.height > output.capabilities.maxHeight) warnings.push("output-height-exceeds-capability");
  if (output.projection?.view === "preview" && output.capabilities?.supportsPreview !== true) warnings.push("output-does-not-declare-preview-support");
  if (output.projection?.view === "program" && output.capabilities?.supportsProgram !== true) warnings.push("output-does-not-declare-program-support");
  return uniqueStrings(warnings);
}

function isHeartbeatStale(heartbeat, status, now, staleAfterMs) {
  if (!["online", "connecting", "degraded", "stale"].includes(status)) return false;
  const at = normalizeIsoDate(heartbeat?.at);
  if (!at) return status === "online" || status === "degraded" || status === "stale";
  const age = Date.parse(now) - Date.parse(at);
  return status === "stale" || (Number.isFinite(age) && age > staleAfterMs);
}

function matchesOutputFilter(output, filter) {
  const fields = ["id", "type", "status", "tenantId", "organizationId", "tournamentId", "competitionId", "sessionId"];
  if (fields.some((field) => hasOwn(filter, field) && output[field] !== filter[field])) return false;
  if (hasOwn(filter, "enabled") && output.enabled !== filter.enabled) return false;
  if (hasOwn(filter, "visibility") && output.visibility !== filter.visibility) return false;
  return true;
}

function inferProjectionView(type) {
  return type === "preview" || ["locutor_monitor", "mobile_monitor"].includes(type) ? "preview" : "program";
}

function normalizeOrientation(value, width, height) {
  if (["landscape", "portrait", "square"].includes(value)) return value;
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function normalizeAspectRatio(value, width, height) {
  if (typeof value === "string" && value.trim()) return value.trim();
  const divisor = greatestCommonDivisor(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function restrictVisibility(configured, requested) {
  const base = normalizeVisibility(configured);
  const candidate = BROADCAST_OUTPUT_VISIBILITIES.includes(requested) ? requested : base;
  return VISIBILITY_RANK[candidate] < VISIBILITY_RANK[base] ? candidate : base;
}

function normalizeVisibility(value) {
  return BROADCAST_OUTPUT_VISIBILITIES.includes(value) ? value : "production";
}

function requiredId(value) {
  const id = normalizeId(value);
  if (!id) throw outputError("output-id-required");
  return id;
}

function normalizeId(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const id = String(value).trim();
  return id && !DANGEROUS_KEYS.has(id) ? id : null;
}

function buildOutputId(now, randomSource) {
  const timestamp = Date.parse(now) || Date.now();
  const randomValue = typeof randomSource === "function" ? randomSource() : Math.random();
  const suffix = Math.abs(Number(randomValue) || 0).toString(36).replace(".", "").slice(0, 8) || "0";
  return `output_${timestamp}_${suffix}`;
}

function mergeSafeRecords(base, patch) {
  const safeBase = isRecord(base) ? cloneSerializable(base, [], "merge.base") || {} : {};
  const safePatch = isRecord(patch) ? cloneSerializable(patch, [], "merge.patch") || {} : {};
  return { ...safeBase, ...safePatch };
}

function cloneSerializable(value, warnings = [], path = "value", ancestors = new WeakSet(), depth = 0) {
  if (depth > MAX_DEPTH) {
    warnings.push(`max-depth:${path}`);
    return null;
  }
  if (value === null || value === undefined) return value;
  if (["string", "boolean"].includes(typeof value)) return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    warnings.push(`non-finite-number:${path}`);
    return null;
  }
  if (["function", "symbol", "bigint"].includes(typeof value)) {
    warnings.push(`unsupported-value:${path}`);
    return undefined;
  }
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  if (typeof value !== "object") return undefined;
  if (ancestors.has(value)) {
    warnings.push(`cycle:${path}`);
    return null;
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) warnings.push(`array-truncated:${path}`);
    const result = value.slice(0, MAX_ARRAY_LENGTH).map((item, index) => {
      const cloned = cloneSerializable(item, warnings, `${path}.${index}`, ancestors, depth + 1);
      return cloned === undefined ? null : cloned;
    });
    ancestors.delete(value);
    return result;
  }
  const result = {};
  for (const key of Object.keys(value).slice(0, MAX_ARRAY_LENGTH)) {
    if (DANGEROUS_KEYS.has(key)) {
      warnings.push(`dangerous-key:${path}.${key}`);
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !hasOwn(descriptor, "value")) {
      warnings.push(`accessor-skipped:${path}.${key}`);
      continue;
    }
    const cloned = cloneSerializable(descriptor.value, warnings, `${path}.${key}`, ancestors, depth + 1);
    if (cloned !== undefined) result[key] = cloned;
  }
  ancestors.delete(value);
  return result;
}

function containsDangerousKey(value, ancestors = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return false;
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && hasOwn(descriptor, "value") && containsDangerousKey(descriptor.value, ancestors, depth + 1)) return true;
  }
  ancestors.delete(value);
  return false;
}

function freezeDeep(value, ancestors = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return value;
  ancestors.add(value);
  Object.values(value).forEach((child) => freezeDeep(child, ancestors, depth + 1));
  return Object.freeze(value);
}

function outputError(code, details) {
  return new BroadcastOutputError(code, details);
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function normalizeIsoDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function nullableString(value) {
  return typeof value === "string" ? value : value === null || value === undefined ? null : String(value);
}

function nullableId(value) {
  return value === "" ? "" : normalizeId(value);
}

function nonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function nonNegativeIntegerOrNull(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function positiveIntegerOrNull(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function positiveNumber(value, fallback) {
  return isPositiveFinite(value) ? value : fallback;
}

function positiveNumberOrNull(value) {
  return isPositiveFinite(value) ? value : null;
}

function nonNegativeNumberOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function boundedNonNegativeNumber(value, fallback, max) {
  return Number.isFinite(value) && value >= 0 && value <= max ? value : fallback;
}

function isPositiveFinite(value) {
  return Number.isFinite(value) && value > 0;
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(Math.trunc(left));
  let b = Math.abs(Math.trunc(right));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && item.length > 0))].slice(0, MAX_ARRAY_LENGTH);
}
