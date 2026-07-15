import {
  getThemedTemplateRender,
  removeThemedTemplateRender,
  renderThemedTemplate,
  updateThemedTemplateRender,
  validateThemeTemplateSnapshot
} from "./themeTemplateIntegration.js?v=20260714-theme-template-integration-001-themed-compositions-v1";

export const PREVIEW_ENGINE_VERSION = "1.0.0";

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
  "apikey", "authorization", "cookie", "credentials", "password", "privatekey",
  "secret", "signedurl", "token"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "actor", "clientid", "createdby", "organizationid", "operatorid", "sessionid",
  "tenantid", "updatedby", "userid"
]);
const UNSAFE_TEXT = /<\s*(?:script|iframe|object|embed|style|link|img)\b|\bon(?:error|load|click)\s*=|(?:^|[\s"'])\s*(?:javascript|file|data|vbscript):|\beval\s*\(|\bnew\s+Function\b/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 20000;

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
    if (runtime.activeRuntime) runtime.adapter.clear(runtime.activeRuntime, { ...options, reason: "preview-replaced" });
    const now = normalizeNow(options.now);
    const previewId = buildPreviewId(engine, runtime, now);
    const preview = buildPreviewDescriptor(source, sourceRender, {
      previewId,
      revision: 0,
      status: "prepared",
      createdAt: now,
      updatedAt: now,
      visibility: options.visibility,
      output: options.output
    });
    runtime.preview = preview;
    runtime.prepared = { snapshot: source, sourceRender, adapterPreparation };
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
    const preview = mergeRenderedPreview(runtime.preview, rendered, {
      revision: runtime.preview.revision + 1,
      status: "rendered",
      updatedAt: now
    });
    const validation = validatePreview(preview);
    if (!validation.valid) throw previewError("preview-render-invalid", { errors: validation.errors });
    runtime.preview = preview;
    runtime.activeRuntime = buildActiveRuntime(rendered, runtime.prepared);
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
    const base = compatible
      ? runtime.preview
      : buildPreviewDescriptor(nextSnapshot, nextRender, {
        previewId,
        revision: 0,
        status: "prepared",
        createdAt: now,
        updatedAt: now,
        visibility: safeChanges.visibility,
        output: safeChanges.output
      });
    const preview = mergeRenderedPreview(base, result, {
      previewId,
      revision: compatible ? runtime.preview.revision + 1 : 1,
      status: "rendered",
      updatedAt: now
    });
    const validation = validatePreview(preview);
    if (!validation.valid) throw previewError("preview-update-invalid", { errors: validation.errors });
    runtime.preview = preview;
    runtime.prepared = {
      snapshot: nextSnapshot,
      sourceRender: nextRender,
      adapterPreparation: result?.preparation || runtime.prepared.adapterPreparation
    };
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
  return sanitizeSnapshot(snapshot, effectiveVisibility);
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
    warnings: uniqueStrings([...(snapshot.warnings || []), ...(render.warnings || [])]),
    errors: uniqueStrings([...(snapshot.errors || []), ...(render.errors || [])])
  };
}

function mergeRenderedPreview(base, rendered, overrides) {
  const result = isRecord(rendered) ? rendered : {};
  return {
    ...base,
    ...overrides,
    visibility: moreRestrictiveVisibility(base.visibility, normalizeVisibility(result.visibility || base.visibility)),
    output: normalizeOutput({ ...base.output, outputId: result.outputId || base.output.outputId }),
    themeRenderId: normalizeId(result.themedRenderId) || base.themeRenderId,
    templateRenderId: normalizeId(result.templateRenderId) || base.templateRenderId,
    templateId: normalizeId(result.templateId) || base.templateId,
    themeId: normalizeId(result.themeId) || base.themeId,
    templateInstanceId: normalizeId(result.templateInstanceId) || base.templateInstanceId,
    warnings: uniqueStrings([...(base.warnings || []), ...(result.warnings || [])]),
    errors: uniqueStrings([...(result.errors || [])])
  };
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
    keyFilter: (key) => {
      const normalized = key.toLowerCase();
      if (SECRET_KEYS.has(normalized) || RUNTIME_KEYS.has(normalized)) return false;
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
    if (RUNTIME_KEYS.has(normalized) || SECRET_KEYS.has(normalized)) {
      state.errors.push(`preview-field-forbidden:${state.path}.${key}`);
      return;
    }
    if (options.keyFilter && !options.keyFilter(key, state.path)) return;
    const child = safeClone(descriptor.value, options, { ...state, depth: state.depth + 1, path: `${state.path}.${key}` });
    if (child.value !== undefined) result[key] = child.value;
  });
  state.ancestors.delete(value);
  return { value: result, errors: state.errors };
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
