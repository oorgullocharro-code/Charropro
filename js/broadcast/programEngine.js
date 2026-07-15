import {
  PREVIEW_ENGINE_VERSION,
  validatePreview
} from "./previewEngine.js?v=20260715-preview-engine-001-official-preview-v1";

export const PROGRAM_ENGINE_VERSION = "1.0.0";

const PROGRAM_PROJECTION_VERSION = "1.0.0";

const ENGINES = new WeakMap();
const STATES = new Set([
  "uninitialized", "ready", "prepared", "taking", "program", "cutting",
  "auto_transition", "updating", "cleared", "destroyed", "error"
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
const PRIVATE_KEYS = new Set([
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

export class BroadcastProgramError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastProgramError";
    this.code = code;
    this.details = safeClone(details, { rejectUnsafeText: false }).value || {};
  }
}

export function createProgramEngine(options = {}) {
  const now = normalizeNow(options.now);
  const engine = {
    programEngineVersion: PROGRAM_ENGINE_VERSION,
    engineId: normalizeId(options.engineId) || `program_engine_${compactTimestamp(now)}`,
    state: "ready",
    revision: 0,
    createdAt: now,
    updatedAt: now
  };
  ENGINES.set(engine, {
    state: "ready",
    program: null,
    prepared: null,
    activeRuntime: null,
    sequence: 0
  });
  return engine;
}

export function destroyProgramEngine(engine, options = {}) {
  const runtime = requireEngine(engine, { allowDestroyed: true });
  if (!runtime || engine.state === "destroyed") return engine;
  runtime.program = null;
  runtime.prepared = null;
  runtime.activeRuntime = null;
  runtime.state = "destroyed";
  setEngineState(engine, runtime, "destroyed", options.now, false);
  ENGINES.delete(engine);
  return engine;
}

export function prepareProgram(engine, previewSnapshot, options = {}) {
  const runtime = requireEngine(engine);
  const source = normalizePreviewSnapshot(previewSnapshot, options);
  const now = normalizeNow(options.now);
  const prepared = buildPreparedSource(source, options, now);
  runtime.prepared = prepared;
  setEngineState(engine, runtime, "prepared", now);
  return preparedDescriptor(prepared);
}

export function takeProgram(engine, options = {}) {
  return promotePreparedProgram(engine, "taking", "take", options);
}

export function cutProgram(engine, options = {}) {
  return promotePreparedProgram(engine, "cutting", "cut", options);
}

export function autoProgram(engine, options = {}) {
  return promotePreparedProgram(engine, "auto_transition", "auto", options);
}

export function updateProgram(engine, previewSnapshot, options = {}) {
  const runtime = requireEngine(engine);
  if (!runtime.program || !runtime.activeRuntime) throw programError("program-not-active");
  const source = previewSnapshot === undefined || previewSnapshot === null
    ? runtime.prepared?.snapshot
    : previewSnapshot;
  if (!source) throw programError("program-preview-snapshot-required");
  const normalized = normalizePreviewSnapshot(source, options);
  const prepared = buildPreparedSource(normalized, options, normalizeNow(options.now));
  const previous = captureRuntime(runtime, engine);
  setEngineState(engine, runtime, "updating", options.now, false);
  try {
    const now = normalizeNow(options.now);
    const compatible = isCompatibleProgram(runtime.program, runtime.activeRuntime, prepared);
    const program = buildProgram(runtime, engine, prepared, {
      compatible,
      mode: "update",
      now
    });
    const validation = validateProgram(program);
    if (!validation.valid) throw programError("program-update-invalid", { errors: validation.errors });
    runtime.program = program;
    runtime.prepared = null;
    runtime.activeRuntime = buildProgramRuntime(program, prepared, "update");
    setEngineState(engine, runtime, "program", now);
    return cloneProgram(program);
  } catch (error) {
    restoreRuntime(runtime, engine, previous);
    throw normalizeError(error, "program-update-failed");
  }
}

export function clearProgram(engine, options = {}) {
  const runtime = requireEngine(engine);
  runtime.program = null;
  runtime.prepared = null;
  runtime.activeRuntime = null;
  setEngineState(engine, runtime, "cleared", options.now);
  setEngineState(engine, runtime, "ready", options.now, false);
  return { cleared: true, state: engine.state, revision: engine.revision };
}

export function getProgram(engine) {
  const runtime = requireEngine(engine);
  return runtime.program ? cloneProgram(runtime.program) : null;
}

export function hasProgram(engine) {
  const runtime = requireEngine(engine);
  return Boolean(runtime.program);
}

export function getProgramState(engine) {
  const runtime = requireEngine(engine, { allowDestroyed: true });
  return runtime?.state || engine?.state || "destroyed";
}

export function getProgramSnapshot(engine, options = {}) {
  const runtime = requireEngine(engine);
  const visibility = normalizeVisibility(options.visibility || runtime.program?.visibility || "production");
  const sourceVisibility = normalizeVisibility(runtime.program?.visibility || "production");
  const effectiveVisibility = moreRestrictiveVisibility(sourceVisibility, visibility);
  const snapshot = {
    snapshotVersion: PROGRAM_ENGINE_VERSION,
    generatedAt: normalizeNow(options.now),
    state: runtime.state,
    revision: engine.revision,
    visibility: effectiveVisibility,
    program: runtime.program ? cloneProgram(runtime.program) : null,
    warnings: uniqueStrings(runtime.program?.warnings || []),
    errors: uniqueStrings(runtime.program?.errors || [])
  };
  return sanitizeSnapshot(snapshot, visibility);
}

export function validateProgram(program) {
  const errors = [];
  const warnings = [];
  if (!isRecord(program)) return validation(["program-invalid"], warnings);
  if (!isSafeId(program.programId)) errors.push("program-id-invalid");
  if (!isIso(program.createdAt) || !isIso(program.updatedAt)) errors.push("program-timestamp-invalid");
  if (!Number.isInteger(program.revision) || program.revision < 0) errors.push("program-revision-invalid");
  if (program.status !== "program") errors.push("program-status-invalid");
  if (!VISIBILITIES.includes(program.visibility)) errors.push("program-visibility-invalid");
  ["previewId", "themeRenderId", "templateRenderId", "templateId", "themeId", "templateInstanceId"].forEach((field) => {
    if (!isSafeId(program[field])) errors.push(`program-${field}-invalid`);
  });
  if (!isRecord(program.output)) errors.push("program-output-invalid");
  else if (!isSafeId(program.output.outputId) || !isSafeId(program.output.type)) errors.push("program-output-invalid");
  if (!Array.isArray(program.warnings) || !Array.isArray(program.errors)) errors.push("program-diagnostics-invalid");
  validateProgramProjection(program, errors);
  const safety = safeClone(program);
  errors.push(...safety.errors);
  return validation(uniqueStrings(errors), warnings);
}

export function disposeProgram(engine, options = {}) {
  return clearProgram(engine, options);
}

export function isProgramReady(engine) {
  const runtime = ENGINES.get(engine);
  return Boolean(runtime && runtime.state === "ready");
}

export function isProgramDestroyed(engine) {
  return engine?.state === "destroyed" || !ENGINES.has(engine);
}

function promotePreparedProgram(engine, transitionState, mode, options) {
  const runtime = requireEngine(engine);
  if (!runtime.prepared) throw programError("program-not-prepared");
  const previous = captureRuntime(runtime, engine);
  setEngineState(engine, runtime, transitionState, options.now, false);
  try {
    const now = normalizeNow(options.now);
    const compatible = Boolean(runtime.program && runtime.activeRuntime)
      && isCompatibleProgram(runtime.program, runtime.activeRuntime, runtime.prepared);
    const program = buildProgram(runtime, engine, runtime.prepared, { compatible, mode, now });
    const result = validateProgram(program);
    if (!result.valid) throw programError("program-take-invalid", { errors: result.errors });
    runtime.program = program;
    runtime.activeRuntime = buildProgramRuntime(program, runtime.prepared, mode);
    runtime.prepared = null;
    setEngineState(engine, runtime, "program", now);
    return cloneProgram(program);
  } catch (error) {
    restoreRuntime(runtime, engine, previous);
    throw normalizeError(error, `program-${mode}-failed`);
  }
}

function normalizePreviewSnapshot(snapshot, options = {}) {
  const cloned = safeClone(snapshot);
  if (cloned.errors.length) throw programError("program-preview-snapshot-unsafe", { errors: cloned.errors });
  const value = cloned.value;
  if (!isRecord(value) || value.snapshotVersion !== PREVIEW_ENGINE_VERSION) {
    throw programError("program-preview-snapshot-invalid");
  }
  if (!isIso(value.generatedAt) || !isRecord(value.preview)) throw programError("program-preview-snapshot-invalid");
  const previewValidation = validatePreview(value.preview);
  if (!previewValidation.valid) throw programError("program-preview-invalid", { errors: previewValidation.errors });
  if (!new Set(["prepared", "rendered"]).has(value.preview.status)) {
    throw programError("program-preview-not-ready");
  }
  const errors = uniqueStrings([...(value.errors || []), ...(value.preview.errors || [])]);
  if (errors.length) throw programError("program-preview-has-errors", { errors });
  const sourceVisibility = normalizeVisibility(value.preview.visibility || value.visibility);
  const requestedVisibility = options.visibility
    ? normalizeVisibility(options.visibility)
    : sourceVisibility;
  value.visibility = moreRestrictiveVisibility(sourceVisibility, requestedVisibility);
  value.preview.visibility = value.visibility;
  assertContextCompatible(value, options.context);
  return value;
}

function buildPreparedSource(snapshot, options, now) {
  const preview = snapshot.preview;
  const contextClone = safeClone(options.context ?? null);
  if (contextClone.errors.length) throw programError("program-context-unsafe", { errors: contextClone.errors });
  return {
    snapshot,
    preview: cloneProgram(preview),
    rendererId: normalizeId(options.rendererId) || "preview-runtime-v1",
    context: contextClone.value,
    preparedAt: now,
    compatibilityKey: compatibilityKey(preview.output, normalizeId(options.rendererId) || "preview-runtime-v1")
  };
}

function preparedDescriptor(prepared) {
  return {
    prepared: true,
    previewId: prepared.preview.previewId,
    output: cloneProgram(prepared.preview.output),
    visibility: prepared.preview.visibility,
    preparedAt: prepared.preparedAt
  };
}

function buildProgram(runtime, engine, prepared, options) {
  const previous = runtime.program;
  const programId = options.compatible && previous
    ? previous.programId
    : buildProgramId(engine, runtime, options.now);
  const createdAt = options.compatible && previous ? previous.createdAt : options.now;
  const revision = options.compatible && previous ? previous.revision + 1 : 0;
  const preview = prepared.preview;
  const context = extractContext(preview, prepared.snapshot);
  return {
    projectionVersion: preview.projectionVersion || PROGRAM_PROJECTION_VERSION,
    programId,
    createdAt,
    updatedAt: options.now,
    revision,
    status: "program",
    visibility: preview.visibility,
    output: cloneProgram(preview.output),
    previewId: preview.previewId,
    themeRenderId: preview.themeRenderId,
    templateRenderId: preview.templateRenderId,
    templateId: preview.templateId,
    themeId: preview.themeId,
    templateInstanceId: preview.templateInstanceId,
    composition: preview.composition === null || preview.composition === undefined
      ? null
      : cloneProgram(preview.composition),
    components: Array.isArray(preview.components) ? cloneProgram(preview.components) : [],
    layers: Array.isArray(preview.layers) ? cloneProgram(preview.layers) : [],
    sourceRevision: nonNegativeInteger(prepared.snapshot.revision, nonNegativeInteger(preview.sourceRevision, 0)),
    programRevision: revision,
    generatedAt: options.now,
    ...context,
    transitionMode: options.mode,
    warnings: uniqueStrings([...(prepared.snapshot.warnings || []), ...(preview.warnings || [])]),
    errors: []
  };
}

function validateProgramProjection(program, errors) {
  const hasProjection = program.projectionVersion !== undefined
    || program.composition !== undefined
    || program.layers !== undefined
    || program.sourceRevision !== undefined
    || program.programRevision !== undefined;
  if (!hasProjection) return;
  if (program.projectionVersion !== PROGRAM_PROJECTION_VERSION) errors.push("program-projection-version-invalid");
  if (!Array.isArray(program.components) || program.components.length > MAX_COMPONENTS) errors.push("program-components-invalid");
  if (!Array.isArray(program.layers) || program.layers.length > MAX_COMPONENTS) errors.push("program-layers-invalid");
  if (!Number.isInteger(program.sourceRevision) || program.sourceRevision < 0) errors.push("program-source-revision-invalid");
  if (!Number.isInteger(program.programRevision) || program.programRevision !== program.revision) errors.push("program-projection-revision-invalid");
  if (!isIso(program.generatedAt)) errors.push("program-projection-timestamp-invalid");
  if (program.composition === null) {
    if ((program.components || []).length || (program.layers || []).length) errors.push("program-empty-composition-invalid");
    return;
  }
  const composition = program.composition;
  if (!isRecord(composition) || composition.compositionVersion !== PROGRAM_PROJECTION_VERSION) {
    errors.push("program-composition-invalid");
    return;
  }
  if (!isSafeId(composition.compositionId) || !isSafeId(composition.templateId) || !isSafeId(composition.themeId)
    || composition.templateId !== program.templateId || composition.themeId !== program.themeId) {
    errors.push("program-composition-identity-invalid");
  }
  if (!Array.isArray(composition.components) || !Array.isArray(composition.layers) || !Array.isArray(composition.order)) {
    errors.push("program-composition-structure-invalid");
    return;
  }
  if (!isRecord(composition.geometry)
    || !Number.isFinite(composition.geometry.width) || composition.geometry.width <= 0
    || !Number.isFinite(composition.geometry.height) || composition.geometry.height <= 0
    || !isSafeId(composition.geometry.orientation)) errors.push("program-composition-geometry-invalid");
  const ids = new Set();
  composition.components.forEach((component) => {
    if (!isRecord(component) || !isSafeId(component.componentId) || !isSafeId(component.componentType)
      || ids.has(component.componentId) || !isRecord(component.geometry)) {
      errors.push("program-component-invalid");
      return;
    }
    ids.add(component.componentId);
    const geometry = component.geometry;
    if (![geometry.x, geometry.y, geometry.width, geometry.height, geometry.rotation, geometry.scale, geometry.zIndex].every(Number.isFinite)
      || geometry.width < 0 || geometry.height < 0 || geometry.scale <= 0
      || !Number.isFinite(component.opacity) || component.opacity < 0 || component.opacity > 1) {
      errors.push("program-component-geometry-invalid");
    }
  });
  if (composition.order.length !== ids.size || composition.order.some((id) => !ids.has(id))) errors.push("program-composition-order-invalid");
  if (program.components.length !== composition.components.length) errors.push("program-components-mismatch");
}

function assertContextCompatible(snapshot, requestedContext) {
  if (!isRecord(requestedContext)) return;
  const source = extractContext(snapshot.preview, snapshot);
  CONTEXT_FIELDS.forEach((field) => {
    const requested = normalizeId(requestedContext[field]);
    if (source[field] && requested && source[field] !== requested) {
      throw programError(`program-${field}-mismatch`, { expected: requested, actual: source[field] });
    }
  });
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

function buildProgramRuntime(program, prepared, mode) {
  return {
    runtimeId: `program_runtime_${program.programId}_${program.revision}`,
    root: {
      rootId: `program_root_${program.programId}`,
      previewId: program.previewId,
      sourceRevision: prepared.snapshot.revision
    },
    rootCount: 1,
    rendererId: prepared.rendererId,
    compatibilityKey: prepared.compatibilityKey,
    previewSnapshot: safeClone(prepared.snapshot, { rejectUnsafeText: false }).value,
    context: safeClone(prepared.context, { rejectUnsafeText: false }).value,
    transitionMode: mode
  };
}

function isCompatibleProgram(program, activeRuntime, prepared) {
  if (!program || !activeRuntime) return false;
  if (activeRuntime.rendererId !== prepared.rendererId) return false;
  return activeRuntime.compatibilityKey === prepared.compatibilityKey;
}

function compatibilityKey(output, rendererId) {
  const normalized = normalizeOutput(output);
  return [
    rendererId,
    normalized.outputId,
    normalized.type,
    normalized.orientation || "",
    normalized.resolution.width ?? "",
    normalized.resolution.height ?? ""
  ].join("|");
}

function normalizeOutput(output) {
  const value = isRecord(output) ? output : {};
  const resolution = isRecord(value.resolution) ? value.resolution : {};
  return {
    outputId: normalizeId(value.outputId || value.id) || "program",
    type: normalizeId(value.type) || "program",
    orientation: normalizeId(value.orientation) || null,
    resolution: {
      width: finiteNumber(resolution.width ?? value.width),
      height: finiteNumber(resolution.height ?? value.height)
    },
    safeArea: safeClone(value.safeArea || {}, { rejectUnsafeText: false }).value || {}
  };
}

function captureRuntime(runtime, engine) {
  return {
    publicState: { ...engine },
    state: runtime.state,
    program: runtime.program,
    prepared: runtime.prepared,
    activeRuntime: runtime.activeRuntime,
    sequence: runtime.sequence
  };
}

function restoreRuntime(runtime, engine, previous) {
  Object.assign(engine, previous.publicState);
  runtime.state = previous.state;
  runtime.program = previous.program;
  runtime.prepared = previous.prepared;
  runtime.activeRuntime = previous.activeRuntime;
  runtime.sequence = previous.sequence;
}

function requireEngine(engine, options = {}) {
  const runtime = ENGINES.get(engine);
  if (!runtime) {
    if (options.allowDestroyed && engine?.state === "destroyed") return null;
    if (engine?.state === "destroyed") throw programError("program-engine-destroyed");
    throw programError("program-engine-invalid");
  }
  if (runtime.state === "destroyed" && options.allowDestroyed !== true) {
    throw programError("program-engine-destroyed");
  }
  return runtime;
}

function setEngineState(engine, runtime, state, now, increment = true) {
  if (!STATES.has(state)) throw programError("program-state-invalid");
  runtime.state = state;
  engine.state = state;
  if (increment) engine.revision += 1;
  engine.updatedAt = normalizeNow(now);
}

function buildProgramId(engine, runtime, now) {
  runtime.sequence += 1;
  return `program_${normalizeId(engine.engineId)}_${compactTimestamp(now)}_${runtime.sequence}`;
}

function cloneProgram(value) {
  return safeClone(value, { rejectUnsafeText: false }).value;
}

function sanitizeSnapshot(snapshot, visibility) {
  return safeClone(snapshot, {
    rejectUnsafeText: false,
    keyFilter: (key) => {
      const normalized = key.toLowerCase();
      if (SECRET_KEYS.has(normalized) || RUNTIME_KEYS.has(normalized)) return false;
      if (visibility === "public" && PRIVATE_KEYS.has(normalized)) return false;
      return true;
    }
  }).value || {};
}

function safeClone(value, options = {}, state = { depth: 0, ancestors: new WeakSet(), path: "root", errors: [] }) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      state.errors.push(`program-non-finite:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    if (typeof value === "string" && value.length > MAX_TEXT_LENGTH) {
      state.errors.push(`program-text-too-long:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    if (typeof value === "string" && options.rejectUnsafeText !== false && UNSAFE_TEXT.test(value)) {
      state.errors.push(`program-unsafe-text:${state.path}`);
      return { value: undefined, errors: state.errors };
    }
    return { value, errors: state.errors };
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    state.errors.push(`program-non-serializable:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (state.depth >= MAX_DEPTH) {
    state.errors.push(`program-depth-limit:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (value instanceof WeakMap || value instanceof WeakSet || value?.nodeType || value?.ownerDocument) {
    state.errors.push(`program-runtime-reference:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  if (state.ancestors.has(value)) {
    state.errors.push(`program-cycle:${state.path}`);
    return { value: undefined, errors: state.errors };
  }
  state.ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) state.errors.push(`program-array-limit:${state.path}`);
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
  if (keys.length > MAX_OBJECT_KEYS) state.errors.push(`program-object-limit:${state.path}`);
  const result = Object.create(null);
  keys.slice(0, MAX_OBJECT_KEYS).forEach((key) => {
    const descriptor = descriptors[key];
    const normalized = key.toLowerCase();
    if (DANGEROUS_KEYS.has(key)) {
      state.errors.push(`program-dangerous-key:${state.path}.${key}`);
      return;
    }
    if (descriptor.get || descriptor.set) {
      state.errors.push(`program-accessor-forbidden:${state.path}.${key}`);
      return;
    }
    if (RUNTIME_KEYS.has(normalized) || SECRET_KEYS.has(normalized)) {
      state.errors.push(`program-field-forbidden:${state.path}.${key}`);
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

function nonNegativeInteger(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
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
  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    programEngineVersion: PROGRAM_ENGINE_VERSION
  };
}

function programError(code, details) {
  return new BroadcastProgramError(code, details);
}

function normalizeError(error, fallback) {
  return error instanceof BroadcastProgramError
    ? error
    : programError(error?.code || error?.message || fallback);
}
