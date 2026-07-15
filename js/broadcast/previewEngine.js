import {
  getThemedTemplateRender,
  removeThemedTemplateRender,
  renderThemedTemplate,
  updateThemedTemplateRender,
  validateThemeTemplateSnapshot
} from "./themeTemplateIntegration.js?v=20260714-theme-template-integration-001-themed-compositions-v1";

export const PREVIEW_ENGINE_VERSION = "1.0.0";

const PROGRAM_PROJECTION_VERSION = "1.0.0";

const ENGINES = new WeakMap();
const STATES = new Set([
  "uninitialized", "ready", "preparing", "prepared", "rendering",
  "rendered", "updating", "cleared", "destroyed", "error"
]);
const VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const RUNTIME_KEYS = new Set([
  "actor", "cache", "caches", "dom", "element", "listener", "listeners", "node", "root",
  "runtime", "renderer", "target", "weakmap", "weakset"
]);
const SECRET_KEYS = new Set([
  "accesstoken", "apikey", "auth", "authorization", "cookie", "cookies", "credential",
  "credentials", "header", "headers", "password", "privatekey", "refreshtoken", "secret",
  "signedurl", "token", "tokens"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "actor", "clientid", "createdby", "organizationid", "operatorid", "sessionid",
  "tenantid", "updatedby", "userid", "diagnostics", "internalnotes", "operationalnotes",
  "privatenotes"
]);
const UNSAFE_TEXT = /<\s*\/?\s*[a-z][^>]*>|\bon(?:error|load|click)\s*=|(?:^|[\s"'])\s*(?:javascript|file|data|vbscript):|\beval\s*\(|\bnew\s+Function\b|\bexpression\s*\(|@import\b|url\s*\(\s*["']?\s*(?:javascript|file|data\s*:\s*text\/html|vbscript):/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 20000;
const MAX_COMPONENTS = 300;
const CONTEXT_FIELDS = Object.freeze([
  "tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "sessionId"
]);

export class BroadcastPreviewError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastPreviewError";
    this.code = code;
    this.details = safeClone(details, { rejectUnsafeText: false }).value || {};
  }
}

export function createPreviewEngine(options = {}) {
  const now = normalizeNow(options.now);
  const engine = {
    previewEngineVersion: PREVIEW_ENGINE_VERSION,
    engineId: normalizeId(options.engineId) || `preview_engine_${compactTimestamp(now)}`,
    state: "ready",
    revision: 0,
    createdAt: now,
    updatedAt: now
  };
  ENGINES.set(engine, {
    adapter: normalizeAdapter(options),
    preview: null,
    prepared: null,
    activeRuntime: null,
    sequence: 0,
    state: "ready"
  });
  return engine;
}

export function destroyPreviewEngine(engine, options = {}) {
  const runtime = requireEngine(engine, { allowDestroyed: true });
  if (!runtime || engine.state === "destroyed") return engine;
  if (runtime.preview || runtime.prepared || runtime.activeRuntime) {
    clearRuntime(runtime, { ...options, force: true });
  }
  runtime.preview = null;
  runtime.prepared = null;
  runtime.activeRuntime = null;
  runtime.adapter = null;
  runtime.state = "destroyed";
  setEngineState(engine, runtime, "destroyed", options.now, false);
  ENGINES.delete(engine);
  return engine;
}

export function preparePreview(engine, snapshot, options = {}) {
  const runtime = requireEngine(engine);
  const source = normalizeThemeTemplateSnapshot(snapshot, options);
  const sourceRender = selectSnapshotRender(source, options.themeRenderId);
  const previous = captureRuntime(runtime, engine);
  setEngineState(engine, runtime, "preparing", options.now, false);
  try {
    const adapterPreparation = runtime.adapter.prepare(source, sourceRender, options);
    assertPreparationCoherence(adapterPreparation, sourceRender, { operation: "prepare" });
    if (runtime.activeRuntime) runtime.adapter.clear(runtime.activeRuntime, { ...options, reason: "preview-replaced" });
    const now = normalizeNow(options.now);
    const previewId = buildPreviewId(engine, runtime, now);
    const prepared = { snapshot: source, sourceRender, adapterPreparation };
    const preview = buildPreviewDescriptor(source, sourceRender, {
      previewId,
      revision: 0,
      status: "prepared",
      createdAt: now,
      updatedAt: now,
      visibility: options.visibility,
      output: options.output,
      prepared
    });
    runtime.preview = preview;
    runtime.prepared = prepared;
    runtime.activeRuntime = null;
    setEngineState(engine, runtime, "prepared", now);
    return clonePreview(preview);
  } catch (error) {
    restoreRuntime(runtime, engine, previous);
    throw normalizeError(error, "preview-prepare-failed");
  }
}

export function renderPreview(engine, options = {}) {
  const runtime = requireEngine(engine);
  if (runtime.state === "rendered" && runtime.preview) return clonePreview(runtime.preview);
  if (runtime.state !== "prepared" || !runtime.prepared || !runtime.preview) {
    throw previewError("preview-not-prepared");
  }
  const previous = captureRuntime(runtime, engine);
  setEngineState(engine, runtime, "rendering", options.now, false);
  try {
    const rendered = runtime.adapter.render(runtime.prepared, options);
    const now = normalizeNow(options.now);
    const renderedPrepared = resolveOperationPreparation(runtime.prepared, rendered, {
      operation: "render",
      expectedThemeId: rendered?.themeId || runtime.preview.themeId,
      expectedTemplateId: rendered?.templateId || runtime.preview.templateId,
      requireFresh: false
    });
    const preview = mergeRenderedPreview(runtime.preview, rendered, {
      revision: runtime.preview.revision + 1,
      status: "rendered",
      updatedAt: now
    }, renderedPrepared);
    const validation = validatePreview(preview);
    if (!validation.valid) throw previewError("preview-render-invalid", { errors: validation.errors });
    runtime.preview = preview;
    runtime.prepared = renderedPrepared;
    runtime.activeRuntime = buildActiveRuntime(rendered, renderedPrepared);
    setEngineState(engine, runtime, "rendered", now);
    return clonePreview(preview);
  } catch (error) {
    restoreRuntime(runtime, engine, previous);
    throw normalizeError(error, "preview-render-failed");
  }
}

export function updatePreview(engine, changes = {}, options = {}) {
  const runtime = requireEngine(engine);
  if (runtime.state !== "rendered" || !runtime.preview || !runtime.activeRuntime) {
    throw previewError("preview-not-rendered");
  }
  const safeChanges = normalizeUpdateChanges(changes);
  const nextSnapshot = safeChanges.snapshot
    ? normalizeThemeTemplateSnapshot(safeChanges.snapshot, options)
    : runtime.prepared.snapshot;
  const nextRender = safeChanges.snapshot
    ? selectSnapshotRender(nextSnapshot, safeChanges.themeRenderId)
    : runtime.prepared.sourceRender;
  const compatible = isCompatible(runtime.preview, nextSnapshot, nextRender, safeChanges, options);
  const previous = captureRuntime(runtime, engine);
  setEngineState(engine, runtime, "updating", options.now, false);
  try {
    const result = runtime.adapter.update(runtime.activeRuntime, {
      ...safeChanges,
      snapshot: nextSnapshot,
      sourceRender: nextRender,
      replace: !compatible
    }, options);
    const now = normalizeNow(options.now);
    const previewId = compatible ? runtime.preview.previewId : buildPreviewId(engine, runtime, now);
    const currentPreparation = findPreparation(runtime.prepared.adapterPreparation);
    const resultThemeId = normalizeId(result?.themeId || safeChanges.themeId || nextRender.themeId);
    const requiresFreshPreparation = Boolean(
      safeChanges.snapshot
      || safeChanges.themeId
      || safeChanges.templateId
      || safeChanges.binding
      || safeChanges.context
      || safeChanges.visibility
      || (resultThemeId && resultThemeId !== normalizeId(currentPreparation?.themeId || runtime.preview.themeId))
    );
    const nextPrepared = resolveOperationPreparation({
      snapshot: nextSnapshot,
      sourceRender: nextRender,
      adapterPreparation: runtime.prepared.adapterPreparation
    }, result, {
      operation: "update",
      expectedThemeId: resultThemeId,
      expectedTemplateId: result?.templateId || safeChanges.templateId || nextRender.templateId,
      requireFresh: requiresFreshPreparation
    });
    const base = compatible
      ? runtime.preview
      : buildPreviewDescriptor(nextSnapshot, nextRender, {
        previewId,
        revision: 0,
        status: "prepared",
        createdAt: now,
        updatedAt: now,
        visibility: safeChanges.visibility,
        output: safeChanges.output,
        prepared: nextPrepared
      });
    const preview = mergeRenderedPreview(base, result, {
      previewId,
      revision: compatible ? runtime.preview.revision + 1 : 1,
      status: "rendered",
      updatedAt: now
    }, nextPrepared);
    const validation = validatePreview(preview);
    if (!validation.valid) throw previewError("preview-update-invalid", { errors: validation.errors });
    runtime.preview = preview;
    runtime.prepared = nextPrepared;
    runtime.activeRuntime = buildActiveRuntime(result, runtime.prepared);
    setEngineState(engine, runtime, "rendered", now);
    return clonePreview(preview);
  } catch (error) {
    restoreRuntime(runtime, engine, previous);
    throw normalizeError(error, "preview-update-failed");
  }
}

export function clearPreview(engine, options = {}) {
  const runtime = requireEngine(engine);
  clearRuntime(runtime, options);
  runtime.preview = null;
  runtime.prepared = null;
  runtime.activeRuntime = null;
  setEngineState(engine, runtime, "cleared", options.now);
  setEngineState(engine, runtime, "ready", options.now, false);
  return { cleared: true, state: engine.state, revision: engine.revision };
}

export function getPreview(engine) {
  const runtime = requireEngine(engine);
  return runtime.preview ? clonePreview(runtime.preview) : null;
}

export function hasPreview(engine) {
  const runtime = requireEngine(engine);
  return Boolean(runtime.preview);
}

export function getPreviewState(engine) {
  const runtime = requireEngine(engine, { allowDestroyed: true });
  return runtime?.state || engine?.state || "destroyed";
}

export function getPreviewSnapshot(engine, options = {}) {
  const runtime = requireEngine(engine);
  const visibility = normalizeVisibility(options.visibility || runtime.preview?.visibility || "production");
  const sourceVisibility = normalizeVisibility(runtime.preview?.visibility || "production");
  const effectiveVisibility = moreRestrictiveVisibility(sourceVisibility, visibility);
  const snapshot = {
    snapshotVersion: PREVIEW_ENGINE_VERSION,
    generatedAt: normalizeNow(options.now),
    state: runtime.state,
    revision: engine.revision,
    visibility: effectiveVisibility,
    preview: runtime.preview ? clonePreview(runtime.preview) : null,
    warnings: uniqueStrings(runtime.preview?.warnings || []),
    errors: uniqueStrings(runtime.preview?.errors || [])
  };
  return sanitizeSnapshot(snapshot, visibility);
}

export function validatePreview(preview) {
  const errors = [];
  const warnings = [];
  if (!isRecord(preview)) return validation(["preview-invalid"], warnings);
  if (!isSafeId(preview.previewId)) errors.push("preview-id-invalid");
  if (!isIso(preview.createdAt) || !isIso(preview.updatedAt)) errors.push("preview-timestamp-invalid");
  if (!Number.isInteger(preview.revision) || preview.revision < 0) errors.push("preview-revision-invalid");
  if (!STATES.has(preview.status)) errors.push("preview-status-invalid");
  if (!VISIBILITIES.includes(preview.visibility)) errors.push("preview-visibility-invalid");
  ["themeRenderId", "templateRenderId", "templateId", "themeId", "templateInstanceId"].forEach((field) => {
    if (!isSafeId(preview[field])) errors.push(`preview-${field}-invalid`);
  });
  if (!isRecord(preview.output)) errors.push("preview-output-invalid");
  if (!Array.isArray(preview.warnings) || !Array.isArray(preview.errors)) errors.push("preview-diagnostics-invalid");
  validateDeclarativeProjection(preview, errors, "preview");
  const safety = safeClone(preview);
  errors.push(...safety.errors);
  return validation(uniqueStrings(errors), warnings);
}

export function disposePreview(engine, options = {}) {
  return clearPreview(engine, options);
}

export function isPreviewReady(engine) {
  const runtime = ENGINES.get(engine);
  return Boolean(runtime && runtime.state === "ready");
}

export function isPreviewDestroyed(engine) {
  return engine?.state === "destroyed" || !ENGINES.has(engine);
}

function normalizeAdapter(options) {
  if (isRecord(options.adapter)) {
    for (const method of ["prepare", "render", "update", "clear"]) {
      if (typeof options.adapter[method] !== "function") throw previewError(`preview-adapter-${method}-required`);
    }
    return options.adapter;
  }
  const integration = options.themeTemplateIntegration;
  const resolvePreparation = options.resolvePreparation;
  if (!integration || typeof resolvePreparation !== "function") {
    return {
      prepare() { return {}; },
      render() { throw previewError("preview-theme-template-adapter-required"); },
      update() { throw previewError("preview-theme-template-adapter-required"); },
      clear() { return { removed: false }; }
    };
  }
  return {
    prepare(snapshot, sourceRender) {
      const preparation = resolvePreparation(snapshot, sourceRender);
      if (!isRecord(preparation)) throw previewError("preview-theme-template-preparation-required");
      return { preparation };
    },
    render(prepared, renderOptions) {
      return renderThemedTemplate(integration, prepared.adapterPreparation.preparation, {
        ...renderOptions,
        themedRenderId: prepared.sourceRender.themedRenderId,
        includeRoot: true
      });
    },
    update(activeRuntime, changes, updateOptions) {
      const themeId = changes.themeId || changes.sourceRender?.themeId;
      const result = updateThemedTemplateRender(integration, activeRuntime.themeRenderId, themeId, {
        ...updateOptions,
        visibility: changes.visibility,
        includeRoot: true
      });
      return result;
    },
    clear(activeRuntime, clearOptions) {
      if (!activeRuntime?.themeRenderId) return { removed: false };
      return removeThemedTemplateRender(integration, activeRuntime.themeRenderId, clearOptions);
    },
    get(themeRenderId) {
      return getThemedTemplateRender(integration, themeRenderId, { includeRoot: true });
    }
  };
}

function resolveOperationPreparation(currentPrepared, result, options = {}) {
  const returnedPreparation = findPreparation(result);
  const currentPreparation = findPreparation(currentPrepared?.adapterPreparation);
  if (!returnedPreparation) {
    if (options.requireFresh) {
      throw previewError("preview-theme-preparation-mismatch", {
        operation: options.operation,
        reason: "updated-preparation-required",
        expectedThemeId: normalizeId(options.expectedThemeId) || null
      });
    }
    assertPreparationCoherence(currentPreparation, {
      themeId: options.expectedThemeId,
      templateId: options.expectedTemplateId
    }, options);
    return currentPrepared;
  }
  assertPreparationCoherence(returnedPreparation, {
    themeId: options.expectedThemeId || result?.themeId,
    themeVersion: result?.themeVersion,
    templateId: options.expectedTemplateId || result?.templateId,
    updatedAt: result?.updatedAt
  }, { ...options, requireFresh: options.requireFresh === true });
  const cloned = safeClone(returnedPreparation);
  if (cloned.errors.length) throw previewError("preview-theme-preparation-mismatch", { operation: options.operation, errors: cloned.errors });
  const sourceRender = {
    ...currentPrepared.sourceRender,
    themedRenderId: normalizeId(result?.themedRenderId) || currentPrepared.sourceRender.themedRenderId,
    templateRenderId: normalizeId(result?.templateRenderId) || currentPrepared.sourceRender.templateRenderId,
    templateId: normalizeId(result?.templateId) || cloned.value.templateId || currentPrepared.sourceRender.templateId,
    templateInstanceId: normalizeId(result?.templateInstanceId) || cloned.value.templateInstanceId || currentPrepared.sourceRender.templateInstanceId,
    themeId: normalizeId(result?.themeId) || cloned.value.themeId || currentPrepared.sourceRender.themeId,
    themeVersion: result?.themeVersion || cloned.value.themeVersion || currentPrepared.sourceRender.themeVersion,
    state: result?.state || currentPrepared.sourceRender.state,
    status: result?.status || currentPrepared.sourceRender.status,
    updatedAt: result?.updatedAt || currentPrepared.sourceRender.updatedAt,
    preparation: cloned.value
  };
  return {
    ...currentPrepared,
    sourceRender,
    adapterPreparation: cloned.value
  };
}

function findPreparation(value) {
  const candidates = [
    value?.preparation,
    value?.themedPreparation,
    value?.nextPreparation,
    value?.adapterPreparation?.preparation,
    value?.adapterPreparation,
    value
  ];
  return candidates.find((candidate) => isRecord(candidate) && Array.isArray(candidate.components)) || null;
}

function assertPreparationCoherence(value, expected = {}, options = {}) {
  const preparation = findPreparation(value);
  if (!preparation) throw previewError("preview-theme-preparation-mismatch", { operation: options.operation, reason: "preparation-missing" });
  const expectedThemeId = normalizeId(expected.themeId || options.expectedThemeId);
  const expectedTemplateId = normalizeId(expected.templateId || options.expectedTemplateId);
  if ((expectedThemeId && preparation.themeId !== expectedThemeId)
    || (expectedTemplateId && preparation.templateId !== expectedTemplateId)
    || (expected.themeVersion && preparation.themeVersion && preparation.themeVersion !== expected.themeVersion)) {
    throw previewError("preview-theme-preparation-mismatch", {
      operation: options.operation,
      expectedThemeId: expectedThemeId || null,
      actualThemeId: preparation.themeId || null,
      expectedTemplateId: expectedTemplateId || null,
      actualTemplateId: preparation.templateId || null
    });
  }
  for (const component of preparation.components) {
    const appliedThemeId = normalizeId(component?.instance?.metadata?.themeApplication?.appliedThemeId);
    if (expectedThemeId && appliedThemeId && appliedThemeId !== expectedThemeId) {
      throw previewError("preview-theme-preparation-mismatch", {
        operation: options.operation,
        reason: "component-theme-mismatch",
        componentId: component?.instance?.instanceId || null
      });
    }
  }
  return preparation;
}

function normalizeThemeTemplateSnapshot(snapshot, options) {
  const cloned = safeClone(snapshot);
  if (cloned.errors.length) throw previewError("preview-snapshot-unsafe", { errors: cloned.errors });
  const value = cloned.value;
  const validationResult = validateThemeTemplateSnapshot(value);
  if (!validationResult.valid) throw previewError("preview-snapshot-invalid", { errors: validationResult.errors });
  const visibility = normalizeVisibility(value.visibility);
  const requested = options.visibility ? normalizeVisibility(options.visibility) : visibility;
  value.visibility = moreRestrictiveVisibility(visibility, requested);
  return value;
}

function selectSnapshotRender(snapshot, themeRenderId) {
  const id = normalizeId(themeRenderId);
  const render = id
    ? snapshot.renders.find((item) => item?.themedRenderId === id)
    : snapshot.renders[0];
  if (!isRecord(render)) throw previewError("preview-theme-render-required");
  const normalized = safeClone(render).value;
  const required = ["themedRenderId", "templateRenderId", "templateId", "themeId", "templateInstanceId"];
  required.forEach((field) => {
    if (!isSafeId(normalized[field])) throw previewError(`preview-${field}-invalid`);
  });
  return normalized;
}

function buildPreviewDescriptor(snapshot, render, options) {
  const output = normalizeOutput(options.output || {
    outputId: render.outputId || snapshot.outputId || snapshot.rendererSummary?.outputId,
    type: "preview",
    orientation: snapshot.rendererSummary?.orientation,
    resolution: snapshot.rendererSummary?.resolution,
    safeArea: snapshot.rendererSummary?.safeArea
  });
  const sourceVisibility = normalizeVisibility(render.visibility || snapshot.visibility);
  const projection = buildDeclarativeProjection(snapshot, render, options.prepared, null, output);
  return {
    previewId: options.previewId,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
    revision: options.revision,
    status: options.status,
    visibility: moreRestrictiveVisibility(sourceVisibility, normalizeVisibility(options.visibility || sourceVisibility)),
    output,
    themeRenderId: render.themedRenderId,
    templateRenderId: render.templateRenderId,
    templateId: render.templateId,
    themeId: render.themeId,
    templateInstanceId: render.templateInstanceId,
    ...projection,
    warnings: uniqueStrings([...(snapshot.warnings || []), ...(render.warnings || [])]),
    errors: uniqueStrings([...(snapshot.errors || []), ...(render.errors || [])])
  };
}

function mergeRenderedPreview(base, rendered, overrides, prepared) {
  const result = isRecord(rendered) ? rendered : {};
  const output = normalizeOutput({ ...base.output, outputId: result.outputId || base.output.outputId });
  const projection = buildDeclarativeProjection(prepared?.snapshot || {}, prepared?.sourceRender || {}, prepared, result, output);
  return {
    ...base,
    ...overrides,
    visibility: moreRestrictiveVisibility(base.visibility, normalizeVisibility(result.visibility || base.visibility)),
    output,
    themeRenderId: normalizeId(result.themedRenderId) || base.themeRenderId,
    templateRenderId: normalizeId(result.templateRenderId) || base.templateRenderId,
    templateId: normalizeId(result.templateId) || base.templateId,
    themeId: normalizeId(result.themeId) || base.themeId,
    templateInstanceId: normalizeId(result.templateInstanceId) || base.templateInstanceId,
    ...projection,
    warnings: uniqueStrings([...(base.warnings || []), ...(result.warnings || [])]),
    errors: uniqueStrings([...(result.errors || [])])
  };
}

function buildDeclarativeProjection(snapshot, render, prepared, rendered, output) {
  const source = findDeclarativeCompositionSource(rendered, prepared, render);
  const sourceRevision = nonNegativeInteger(snapshot?.revision ?? render?.revision, 0);
  if (!source) {
    return {
      projectionVersion: PROGRAM_PROJECTION_VERSION,
      composition: null,
      components: [],
      layers: [],
      sourceRevision,
      ...extractContext({}, snapshot)
    };
  }
  const templateInstance = isRecord(source.templateInstance) ? source.templateInstance : {};
  const templateId = normalizeId(rendered?.templateId || source.templateId || source.composition?.templateId || templateInstance.templateId || render.templateId);
  const themeId = normalizeId(rendered?.themeId || source.themeId || source.composition?.themeId || render.themeId);
  const rawComposition = isRecord(source.composition) ? source.composition : source;
  const componentInputs = Array.isArray(rawComposition.components) ? rawComposition.components : [];
  if (componentInputs.length > MAX_COMPONENTS) throw previewError("preview-composition-components-limit");
  const declaredOrder = Array.isArray(rawComposition.order)
    ? rawComposition.order
    : Array.isArray(source.componentOrder) ? source.componentOrder : [];
  const orderIndex = new Map(declaredOrder.map((id, index) => [normalizeId(id), index]));
  const components = componentInputs
    .map((component, index) => buildDeclarativeComponent(component, index, orderIndex))
    .sort(compareDeclarativeComponents)
    .map((component, index) => ({ ...component, order: index }));
  const componentIds = new Set(components.map((component) => component.componentId));
  if (componentIds.size !== components.length) throw previewError("preview-composition-component-duplicate");
  const order = components.map((component) => component.componentId);
  const layers = buildDeclarativeLayers(rawComposition.layers, components);
  const geometrySource = isRecord(rawComposition.geometry) ? rawComposition.geometry : {};
  const resolution = isRecord(source.resolution) ? source.resolution : output.resolution;
  const background = cloneProjectionValue(
    rawComposition.background ?? rendered?.themeBackground ?? source.themeBackground ?? null,
    null,
    "composition.background"
  );
  const context = extractContext(source, templateInstance, rawComposition, snapshot);
  const compositionId = normalizeId(rawComposition.compositionId || source.preparationId)
    || normalizeId(`composition_${templateInstance.templateInstanceId || templateId || "program"}`);
  const rootComponentId = normalizeId(rawComposition.rootComponentId || templateInstance.metadata?.rootComponentId)
    || components[0]?.componentId
    || null;
  const composition = {
    compositionVersion: PROGRAM_PROJECTION_VERSION,
    compositionId,
    templateId,
    themeId,
    rootComponentId,
    components: cloneProjectionValue(components, [], "composition.components"),
    layers: cloneProjectionValue(layers, [], "composition.layers"),
    order: [...order],
    geometry: {
      width: positiveFinite(geometrySource.width ?? resolution?.width, 1920),
      height: positiveFinite(geometrySource.height ?? resolution?.height, 1080),
      orientation: normalizeId(geometrySource.orientation || source.orientation || output.orientation) || "landscape"
    },
    safeArea: cloneProjectionValue(rawComposition.safeArea ?? source.safeArea ?? output.safeArea ?? {}, {}, "composition.safeArea"),
    transparentBackground: typeof rawComposition.transparentBackground === "boolean"
      ? rawComposition.transparentBackground
      : background?.type === "transparent",
    background,
    data: cloneProjectionValue(rawComposition.data ?? source.resolvedBindings ?? {}, {}, "composition.data"),
    metadata: cloneProjectionValue({
      ...(isRecord(rawComposition.metadata) ? rawComposition.metadata : {}),
      templateType: source.templateType || templateInstance.templateType || null,
      templateVersion: templateInstance.templateVersion || render.templateVersion || null,
      themeVersion: rendered?.themeVersion || source.themeVersion || render.themeVersion || null,
      themeScope: source.themeScope || null,
      brandingStatus: source.brandingStatus || null,
      layout: source.layout || templateInstance.layout || null
    }, {}, "composition.metadata")
  };
  const projection = {
    projectionVersion: PROGRAM_PROJECTION_VERSION,
    composition,
    components: cloneProjectionValue(components, [], "projection.components"),
    layers: cloneProjectionValue(layers, [], "projection.layers"),
    sourceRevision,
    ...context
  };
  const errors = [];
  validateDeclarativeProjection({ ...projection, templateId, themeId }, errors, "preview");
  if (errors.length) throw previewError("preview-composition-invalid", { errors });
  return projection;
}

function findDeclarativeCompositionSource(rendered, prepared, render) {
  const candidates = [
    rendered?.composition,
    rendered?.preparation,
    prepared?.adapterPreparation?.composition,
    prepared?.adapterPreparation?.preparation,
    prepared?.adapterPreparation,
    render?.composition
  ];
  return candidates.find((candidate) => isRecord(candidate) && Array.isArray(candidate.components)) || null;
}

function buildDeclarativeComponent(input, fallbackOrder, orderIndex) {
  if (!isRecord(input)) throw previewError("preview-composition-component-invalid");
  const instance = isRecord(input.instance) ? input.instance : input;
  const componentId = normalizeId(instance.instanceId || input.componentId || instance.componentId);
  const componentType = normalizeId(instance.componentType || input.componentType);
  if (!componentId || !componentType) throw previewError("preview-composition-component-invalid");
  const rawGeometry = isRecord(input.geometry)
    ? input.geometry
    : isRecord(instance.layout) ? instance.layout : isRecord(input.layout) ? input.layout : {};
  const style = cloneProjectionValue(instance.style ?? input.style ?? {}, {}, `component.${componentId}.style`);
  const metadata = cloneProjectionValue(instance.metadata ?? input.metadata ?? {}, {}, `component.${componentId}.metadata`);
  const zIndex = finiteInteger(rawGeometry.zIndex, 0);
  const declared = orderIndex.has(componentId) ? orderIndex.get(componentId) : fallbackOrder;
  const layerId = normalizeId(input.layerId || metadata.layerId) || normalizeId(`layer_${zIndex}`);
  const assetRefs = collectAuthorizedAssetRefs(instance.properties, input.assetRefs);
  return {
    componentId,
    sourceComponentId: normalizeId(instance.componentId) || componentId,
    componentType,
    parentId: normalizeId(input.parentId || metadata.parentId),
    layerId,
    order: nonNegativeInteger(input.order, declared),
    visibility: normalizeComponentVisibility(input.visibility ?? instance.visibility),
    geometry: {
      x: finite(rawGeometry.x, 0),
      y: finite(rawGeometry.y, 0),
      width: nonNegativeFinite(rawGeometry.width, 0),
      height: nonNegativeFinite(rawGeometry.height, 0),
      rotation: finite(rawGeometry.rotation, 0),
      anchor: normalizeId(rawGeometry.anchor) || "center",
      scale: positiveFinite(rawGeometry.scale, 1),
      zIndex,
      safeArea: cloneProjectionValue(rawGeometry.safeArea ?? {}, {}, `component.${componentId}.safeArea`),
      responsive: cloneProjectionValue(rawGeometry.responsive ?? {}, {}, `component.${componentId}.responsive`)
    },
    opacity: opacityValue(input.opacity ?? style.opacity, 1),
    style,
    properties: cloneProjectionValue(instance.properties ?? input.properties ?? {}, {}, `component.${componentId}.properties`),
    content: cloneProjectionValue(input.resolvedContent ?? input.content ?? {}, {}, `component.${componentId}.content`),
    data: cloneProjectionValue(input.resolvedBindings ?? input.data ?? {}, {}, `component.${componentId}.data`),
    assetRefs,
    metadata
  };
}

function compareDeclarativeComponents(left, right) {
  return left.order - right.order
    || left.geometry.zIndex - right.geometry.zIndex
    || left.componentId.localeCompare(right.componentId);
}

function buildDeclarativeLayers(rawLayers, components) {
  const byLayer = new Map();
  components.forEach((component) => {
    if (!byLayer.has(component.layerId)) {
      byLayer.set(component.layerId, {
        layerId: component.layerId,
        order: component.order,
        zIndex: component.geometry.zIndex,
        visibility: component.visibility,
        componentIds: []
      });
    }
    const layer = byLayer.get(component.layerId);
    layer.order = Math.min(layer.order, component.order);
    layer.zIndex = Math.min(layer.zIndex, component.geometry.zIndex);
    layer.componentIds.push(component.componentId);
  });
  if (Array.isArray(rawLayers)) {
    rawLayers.forEach((raw, index) => {
      if (!isRecord(raw)) return;
      const layerId = normalizeId(raw.layerId || raw.id);
      if (!layerId || !byLayer.has(layerId)) return;
      const layer = byLayer.get(layerId);
      layer.order = nonNegativeInteger(raw.order, layer.order ?? index);
      layer.zIndex = finiteInteger(raw.zIndex, layer.zIndex);
      if (typeof raw.visibility === "boolean" || typeof raw.visibility === "string") layer.visibility = normalizeComponentVisibility(raw.visibility);
    });
  }
  return [...byLayer.values()]
    .sort((left, right) => left.order - right.order || left.zIndex - right.zIndex || left.layerId.localeCompare(right.layerId))
    .map((layer, index) => ({ ...layer, order: index }));
}

function collectAuthorizedAssetRefs(properties, supplied) {
  const candidates = [];
  if (isRecord(properties?.assetRef)) candidates.push(properties.assetRef);
  if (Array.isArray(supplied)) candidates.push(...supplied);
  const seen = new Set();
  return candidates.map((candidate) => {
    if (!isRecord(candidate)) return null;
    const assetId = normalizeId(candidate.assetId);
    if (!assetId) return null;
    const value = {
      assetId,
      version: typeof candidate.version === "string" ? candidate.version.slice(0, 40) : null,
      variantId: normalizeId(candidate.variantId || candidate.variant) || null
    };
    const key = `${value.assetId}|${value.version || ""}|${value.variantId || ""}`;
    if (seen.has(key)) return null;
    seen.add(key);
    return value;
  }).filter(Boolean);
}

function extractContext(...sources) {
  const result = {};
  CONTEXT_FIELDS.forEach((field) => {
    for (const source of sources) {
      const value = normalizeId(source?.[field] || source?.context?.[field]);
      if (value) {
        result[field] = value;
        break;
      }
    }
  });
  return result;
}

function validateDeclarativeProjection(holder, errors, prefix) {
  const hasProjection = holder.projectionVersion !== undefined
    || holder.composition !== undefined
    || holder.components !== undefined
    || holder.layers !== undefined;
  if (!hasProjection) return;
  if (holder.projectionVersion !== PROGRAM_PROJECTION_VERSION) errors.push(`${prefix}-projection-version-invalid`);
  if (!Array.isArray(holder.components) || holder.components.length > MAX_COMPONENTS) errors.push(`${prefix}-components-invalid`);
  if (!Array.isArray(holder.layers) || holder.layers.length > MAX_COMPONENTS) errors.push(`${prefix}-layers-invalid`);
  if (!Number.isInteger(holder.sourceRevision) || holder.sourceRevision < 0) errors.push(`${prefix}-source-revision-invalid`);
  if (holder.composition === null) {
    if ((holder.components || []).length || (holder.layers || []).length) errors.push(`${prefix}-empty-composition-invalid`);
    return;
  }
  const composition = holder.composition;
  if (!isRecord(composition) || composition.compositionVersion !== PROGRAM_PROJECTION_VERSION) {
    errors.push(`${prefix}-composition-invalid`);
    return;
  }
  if (!isSafeId(composition.compositionId) || !isSafeId(composition.templateId) || !isSafeId(composition.themeId)) {
    errors.push(`${prefix}-composition-identity-invalid`);
  }
  if (holder.templateId && composition.templateId !== holder.templateId) errors.push(`${prefix}-composition-template-mismatch`);
  if (holder.themeId && composition.themeId !== holder.themeId) errors.push(`${prefix}-composition-theme-mismatch`);
  if (!Array.isArray(composition.components) || !Array.isArray(composition.layers) || !Array.isArray(composition.order)) {
    errors.push(`${prefix}-composition-structure-invalid`);
    return;
  }
  if (!isRecord(composition.geometry)
    || !Number.isFinite(composition.geometry.width) || composition.geometry.width <= 0
    || !Number.isFinite(composition.geometry.height) || composition.geometry.height <= 0
    || !isSafeId(composition.geometry.orientation)) errors.push(`${prefix}-composition-geometry-invalid`);
  const ids = new Set();
  composition.components.forEach((component) => {
    if (!isRecord(component) || !isSafeId(component.componentId) || !isSafeId(component.componentType)
      || ids.has(component.componentId) || !isRecord(component.geometry)) {
      errors.push(`${prefix}-component-invalid`);
      return;
    }
    ids.add(component.componentId);
    const geometry = component.geometry;
    if (![geometry.x, geometry.y, geometry.width, geometry.height, geometry.rotation, geometry.scale, geometry.zIndex].every(Number.isFinite)
      || geometry.width < 0 || geometry.height < 0 || geometry.scale <= 0
      || !Number.isFinite(component.opacity) || component.opacity < 0 || component.opacity > 1) {
      errors.push(`${prefix}-component-geometry-invalid`);
    }
  });
  if (composition.order.length !== ids.size || composition.order.some((id) => !ids.has(id))) errors.push(`${prefix}-composition-order-invalid`);
  if (holder.components.length !== composition.components.length) errors.push(`${prefix}-components-mismatch`);
}

function cloneProjectionValue(value, fallback, path) {
  if (value === undefined) return fallback;
  const result = safeClone(value);
  if (result.errors.length) throw previewError("preview-composition-unsafe", { path, errors: result.errors });
  return result.value === undefined ? fallback : result.value;
}

function buildActiveRuntime(result, prepared) {
  return {
    themeRenderId: result?.themedRenderId || prepared.sourceRender.themedRenderId,
    templateRenderId: result?.templateRenderId || prepared.sourceRender.templateRenderId,
    root: result?.root || null
  };
}

function normalizeUpdateChanges(changes) {
  if (!isRecord(changes)) throw previewError("preview-update-invalid");
  const allowed = new Set(["snapshot", "themeRenderId", "themeId", "templateId", "binding", "context", "visibility", "output", "rendererId"]);
  Object.keys(changes).forEach((key) => {
    if (DANGEROUS_KEYS.has(key) || !allowed.has(key)) throw previewError(`preview-update-field-forbidden:${key}`);
  });
  const cloned = safeClone(changes);
  if (cloned.errors.length) throw previewError("preview-update-unsafe", { errors: cloned.errors });
  return cloned.value || {};
}

function isCompatible(preview, snapshot, render, changes, options) {
  const nextOutput = normalizeOutput(changes.output || {
    outputId: render.outputId || snapshot.outputId || snapshot.rendererSummary?.outputId,
    type: "preview",
    orientation: snapshot.rendererSummary?.orientation,
    resolution: snapshot.rendererSummary?.resolution
  });
  if (preview.output.outputId !== nextOutput.outputId || preview.output.type !== nextOutput.type) return false;
  if (changes.templateId && changes.templateId !== preview.templateId) return false;
  if (render.templateId !== preview.templateId) return false;
  if (changes.rendererId && options.rendererId && changes.rendererId !== options.rendererId) return false;
  return true;
}

function clearRuntime(runtime, options) {
  if (!runtime.adapter) return;
  if (runtime.activeRuntime) runtime.adapter.clear(runtime.activeRuntime, options);
}

function requireEngine(engine, options = {}) {
  const runtime = ENGINES.get(engine);
  if (!runtime) {
    if (options.allowDestroyed && engine?.state === "destroyed") return null;
    if (engine?.state === "destroyed") throw previewError("preview-engine-destroyed");
    throw previewError("preview-engine-invalid");
  }
  if (runtime.state === "destroyed" && options.allowDestroyed !== true) throw previewError("preview-engine-destroyed");
  return runtime;
}

function setEngineState(engine, runtime, state, now, increment = true) {
  if (!STATES.has(state)) throw previewError("preview-state-invalid");
  runtime.state = state;
  engine.state = state;
  if (increment) engine.revision += 1;
  engine.updatedAt = normalizeNow(now);
}

function captureRuntime(runtime, engine) {
  return {
    publicState: { ...engine },
    preview: runtime.preview,
    prepared: runtime.prepared,
    activeRuntime: runtime.activeRuntime,
    state: runtime.state,
    sequence: runtime.sequence
  };
}

function restoreRuntime(runtime, engine, previous) {
  Object.assign(engine, previous.publicState);
  runtime.preview = previous.preview;
  runtime.prepared = previous.prepared;
  runtime.activeRuntime = previous.activeRuntime;
  runtime.state = previous.state;
  runtime.sequence = previous.sequence;
}

function buildPreviewId(engine, runtime, now) {
  runtime.sequence += 1;
  return `preview_${normalizeId(engine.engineId)}_${compactTimestamp(now)}_${runtime.sequence}`;
}

function normalizeOutput(output) {
  const value = isRecord(output) ? output : {};
  const resolution = isRecord(value.resolution) ? value.resolution : {};
  return {
    outputId: normalizeId(value.outputId || value.id) || "preview",
    type: normalizeId(value.type) || "preview",
    orientation: normalizeId(value.orientation) || null,
    resolution: {
      width: finiteNumber(resolution.width ?? value.width),
      height: finiteNumber(resolution.height ?? value.height)
    },
    safeArea: safeClone(value.safeArea || {}, { rejectUnsafeText: false }).value || {}
  };
}

function clonePreview(preview) {
  return safeClone(preview, { rejectUnsafeText: false }).value;
}

function sanitizeSnapshot(snapshot, visibility) {
  return safeClone(snapshot, {
    rejectUnsafeText: false,
    keyFilter: (key, path, value) => {
      const normalized = key.toLowerCase();
      if (SECRET_KEYS.has(normalized)) return false;
      if (RUNTIME_KEYS.has(normalized) && !isDeclarativeBindingTarget(key, path, value)) return false;
      if (visibility === "public" && PUBLIC_PRIVATE_KEYS.has(normalized)) return false;
      return true;
    }
  }).value || {};
}

function safeClone(value, options = {}, state = { depth: 0, ancestors: new WeakSet(), path: "root", errors: [] }) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      state.errors.push(`preview-non-finite:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    if (typeof value === "string" && value.length > MAX_TEXT_LENGTH) {
      state.errors.push(`preview-text-too-long:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    if (typeof value === "string" && options.rejectUnsafeText !== false && UNSAFE_TEXT.test(value)) {
      state.errors.push(`preview-unsafe-text:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    return { value, errors: state.errors };
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    state.errors.push(`preview-non-serializable:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (state.depth >= MAX_DEPTH) {
    state.errors.push(`preview-depth-limit:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (value instanceof WeakMap || value instanceof WeakSet || value?.nodeType || value?.ownerDocument) {
    state.errors.push(`preview-runtime-reference:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (state.ancestors.has(value)) {
    state.errors.push(`preview-cycle:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  state.ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) state.errors.push(`preview-array-limit:${state.path}`);
    const result = [];
    value.slice(0, MAX_ARRAY_ITEMS).forEach((item, index) => {
      const child = safeClone(item, options, { ...state, depth: state.depth + 1, path: `${state.path}.${index}` });
      if (child.value !== undefined) result.push(child.value);
    });
    state.ancestors.delete(value);
    return { value: result, errors: state.errors };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(descriptors);
  if (keys.length > MAX_OBJECT_KEYS) state.errors.push(`preview-object-limit:${state.path}`);
  const result = Object.create(null);
  keys.slice(0, MAX_OBJECT_KEYS).forEach((key) => {
    const descriptor = descriptors[key];
    const normalized = key.toLowerCase();
    if (DANGEROUS_KEYS.has(key)) {
      state.errors.push(`preview-dangerous-key:${state.path}.${key}`);
      return;
    }
    if (descriptor.get || descriptor.set) {
      state.errors.push(`preview-accessor-forbidden:${state.path}.${key}`);
      return;
    }
    if ((RUNTIME_KEYS.has(normalized) && !isDeclarativeBindingTarget(key, state.path, descriptor.value))
      || SECRET_KEYS.has(normalized)) {
      state.errors.push(`preview-field-forbidden:${state.path}.${key}`);
      return;
    }
    if (options.keyFilter && !options.keyFilter(key, state.path, descriptor.value)) return;
    const child = safeClone(descriptor.value, options, { ...state, depth: state.depth + 1, path: `${state.path}.${key}` });
    if (child.value !== undefined) result[key] = child.value;
  });
  state.ancestors.delete(value);
  return { value: result, errors: state.errors };
}

function isDeclarativeBindingTarget(key, path, value) {
  return key === "target"
    && typeof value === "string"
    && /(?:^|\.)bindings\.\d+$/.test(path);
}

function moreRestrictiveVisibility(left, right) {
  return VISIBILITY_RANK[left] >= VISIBILITY_RANK[right] ? left : right;
}

function normalizeVisibility(value) {
  return VISIBILITIES.includes(value) ? value : "production";
}

function normalizeNow(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function compactTimestamp(value) {
  return normalizeNow(value).replace(/[-:.TZ]/g, "");
}

function normalizeId(value) {
  return typeof value === "string" && SAFE_ID.test(value.trim()) ? value.trim() : null;
}

function isSafeId(value) {
  return Boolean(normalizeId(value));
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function finiteInteger(value, fallback = 0) {
  return Number.isInteger(value) ? value : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function nonNegativeFinite(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function positiveFinite(value, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function opacityValue(value, fallback = 1) {
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
}

function normalizeComponentVisibility(value) {
  if (typeof value === "boolean") return value;
  return VISIBILITIES.includes(value) ? value : "production";
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value))];
}

function validation(errors, warnings) {
  return { valid: errors.length === 0, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), previewEngineVersion: PREVIEW_ENGINE_VERSION };
}

function previewError(code, details) {
  return new BroadcastPreviewError(code, details);
}

function normalizeError(error, fallback) {
  return error instanceof BroadcastPreviewError ? error : previewError(error?.code || error?.message || fallback);
}
