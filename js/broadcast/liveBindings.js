export const LIVE_BINDINGS_VERSION = "1.0.0";

export const LIVE_BINDING_TYPES = Object.freeze([
  "current_team", "current_participant", "current_horse", "current_suerte", "current_score",
  "standings", "official_timer", "next_team", "next_participant", "sponsor_mention",
  "production_message", "tournament_context"
]);

export const LIVE_BINDING_STATES = Object.freeze([
  "uninitialized", "ready", "resolved", "partial", "stale", "destroyed", "error"
]);

export const LIVE_BINDING_ERROR_CODES = Object.freeze({
  INVALID: "live-binding-invalid",
  TYPE_INVALID: "live-binding-type-invalid",
  SOURCE_PATH_INVALID: "live-binding-source-path-invalid",
  TARGET_PATH_INVALID: "live-binding-target-path-invalid",
  DUPLICATE: "live-binding-duplicate",
  NOT_FOUND: "live-binding-not-found",
  REVISION_CONFLICT: "live-binding-revision-conflict",
  CONTEXT_CONFLICT: "live-binding-context-conflict",
  UNSAFE: "live-binding-unsafe",
  DESTROYED: "live-bindings-destroyed"
});

const ENGINES = new WeakMap();
const TYPE_SET = new Set(LIVE_BINDING_TYPES);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const SAFE_PATH = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+){0,11}$/;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 500;
const MAX_OBJECT_KEYS = 700;
const MAX_TEXT_LENGTH = 12000;

const TYPE_PATHS = Object.freeze({
  current_team: Object.freeze(["turn.team", "team", "team.id", "team.name", "team.shortName", "team.total", "team.position"]),
  current_participant: Object.freeze(["turn.participant", "participant", "participant.id", "participant.name", "participant.alias", "participant.category", "participant.association", "participant.total", "participant.position"]),
  current_horse: Object.freeze(["turn.horse", "horse", "horse.id", "horse.name", "horse.category"]),
  current_suerte: Object.freeze(["turn.suerte", "suerte", "suerte.id", "suerte.name", "suerte.status", "suerte.attempt", "charreada.currentSuerte"]),
  current_score: Object.freeze(["score.total", "score", "score.value", "score.time", "score.status", "score.published", "score.timestamp"]),
  standings: Object.freeze(["statistics.standings", "ranking", "ranking.entries"]),
  official_timer: Object.freeze(["timer", "timer.value", "timer.elapsed", "timer.remaining", "timer.running", "timer.paused", "timer.status", "timer.display", "timer.revision"]),
  next_team: Object.freeze(["turn.nextTeam"]),
  next_participant: Object.freeze(["turn.nextParticipant"]),
  sponsor_mention: Object.freeze(["sponsor.active", "production.sponsorMention"]),
  production_message: Object.freeze(["production.message", "production.messages", "production.notes"]),
  tournament_context: Object.freeze(["tournament"])
});

export class BroadcastLiveBindingError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastLiveBindingError";
    this.code = code;
    this.details = cloneValue(details);
  }
}

export function createLiveBindingsEngine(definition = {}, options = {}) {
  const now = normalizeNow(options.now);
  const engine = {
    liveBindingsVersion: LIVE_BINDINGS_VERSION,
    engineId: normalizeId(definition.engineId) || `live_bindings_${String(now).replace(/\D/g, "").slice(0, 17)}`,
    status: "uninitialized",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  };
  ENGINES.set(engine, { bindings: new Map(), lastResolution: null, destroyed: false });
  engine.status = "ready";
  return engine;
}

export function registerLiveBinding(engine, definition = {}, options = {}) {
  const runtime = requireEngine(engine);
  assertExpectedRevision(engine, options.expectedRevision);
  const binding = normalizeBinding(definition);
  if (runtime.bindings.has(binding.bindingId)) throw bindingError(LIVE_BINDING_ERROR_CODES.DUPLICATE);
  runtime.bindings.set(binding.bindingId, freezeDeep(cloneValue(binding)));
  advance(engine, options.now);
  return cloneValue(binding);
}

export function updateLiveBinding(engine, bindingId, patch = {}, options = {}) {
  const runtime = requireEngine(engine);
  assertExpectedRevision(engine, options.expectedRevision);
  const cleanId = normalizeId(bindingId);
  const current = cleanId ? runtime.bindings.get(cleanId) : null;
  if (!current) throw bindingError(LIVE_BINDING_ERROR_CODES.NOT_FOUND);
  const next = normalizeBinding({
    ...current,
    ...cloneValue(patch),
    bindingId: current.bindingId,
    createdAt: current.createdAt,
    updatedAt: normalizeNow(options.now)
  });
  runtime.bindings.set(cleanId, freezeDeep(cloneValue(next)));
  advance(engine, options.now);
  return cloneValue(next);
}

export function removeLiveBinding(engine, bindingId, options = {}) {
  const runtime = requireEngine(engine);
  assertExpectedRevision(engine, options.expectedRevision);
  const cleanId = normalizeId(bindingId);
  if (!cleanId || !runtime.bindings.delete(cleanId)) throw bindingError(LIVE_BINDING_ERROR_CODES.NOT_FOUND);
  advance(engine, options.now);
  return true;
}

export function resolveLiveBindings(engine, source = {}, options = {}) {
  const runtime = requireEngine(engine);
  const safeSource = safeClone(source);
  if (safeSource.errors.length) throw bindingError(LIVE_BINDING_ERROR_CODES.UNSAFE, { errors: safeSource.errors });
  const values = Object.create(null);
  const missing = [];
  for (const binding of runtime.bindings.values()) {
    if (!binding.enabled) continue;
    const value = getPath(safeSource.value, binding.sourcePath);
    if (value === undefined) {
      missing.push(binding.bindingId);
      if (binding.fallback !== undefined) values[binding.bindingId] = cloneValue(binding.fallback);
      continue;
    }
    values[binding.bindingId] = cloneValue(value);
  }
  const now = normalizeNow(options.now);
  const result = {
    liveBindingsVersion: LIVE_BINDINGS_VERSION,
    engineId: engine.engineId,
    revision: engine.revision,
    status: missing.length ? "partial" : "resolved",
    values,
    missing,
    generatedAt: now,
    warnings: missing.map((id) => `binding-missing:${id}`),
    errors: []
  };
  runtime.lastResolution = freezeDeep(cloneValue(result));
  engine.status = result.status;
  engine.updatedAt = now;
  engine.warnings = result.warnings;
  return cloneValue(result);
}

export function applyLiveBindingsToPreview(engine, previewProjection, resolution, options = {}) {
  return applyBindings(engine, previewProjection, resolution, { ...options, target: "preview" });
}

export function applyLiveBindingsToProgram(engine, programProjection, resolution, options = {}) {
  return applyBindings(engine, programProjection, resolution, { ...options, target: "program" });
}

export function buildLiveBindingsSnapshot(engine, options = {}) {
  const runtime = requireEngine(engine);
  return cloneValue({
    snapshotVersion: "1.0.0",
    liveBindingsVersion: LIVE_BINDINGS_VERSION,
    engineId: engine.engineId,
    status: engine.status,
    revision: engine.revision,
    bindings: [...runtime.bindings.values()].map((binding) => ({
      bindingId: binding.bindingId,
      type: binding.type,
      sourcePath: binding.sourcePath,
      targetPath: binding.targetPath,
      enabled: binding.enabled,
      liveBindable: true
    })),
    lastResolution: runtime.lastResolution ? {
      status: runtime.lastResolution.status,
      revision: runtime.lastResolution.revision,
      generatedAt: runtime.lastResolution.generatedAt,
      missing: runtime.lastResolution.missing
    } : null,
    warnings: engine.warnings,
    errors: engine.errors,
    generatedAt: normalizeNow(options.now)
  });
}

export function destroyLiveBindingsEngine(engine, options = {}) {
  const runtime = requireEngine(engine);
  runtime.bindings.clear();
  runtime.lastResolution = null;
  runtime.destroyed = true;
  engine.status = "destroyed";
  engine.revision += 1;
  engine.updatedAt = normalizeNow(options.now);
  return { engineId: engine.engineId, status: "destroyed" };
}

function applyBindings(engine, projection, resolution, options) {
  const runtime = requireEngine(engine);
  const safeProjection = safeClone(projection);
  const safeResolution = safeClone(resolution);
  if (safeProjection.errors.length || safeResolution.errors.length) throw bindingError(LIVE_BINDING_ERROR_CODES.UNSAFE);
  const output = cloneValue(safeProjection.value);
  for (const binding of runtime.bindings.values()) {
    if (!binding.enabled || binding.targets.length && !binding.targets.includes(options.target)) continue;
    if (!Object.prototype.hasOwnProperty.call(safeResolution.value?.values || {}, binding.bindingId)) continue;
    setPath(output, binding.targetPath, safeResolution.value.values[binding.bindingId]);
  }
  return output;
}

function normalizeBinding(definition) {
  if (!isRecord(definition)) throw bindingError(LIVE_BINDING_ERROR_CODES.INVALID);
  const type = String(definition.type || "").trim().toLowerCase();
  if (!TYPE_SET.has(type)) throw bindingError(LIVE_BINDING_ERROR_CODES.TYPE_INVALID);
  const sourcePath = String(definition.sourcePath || TYPE_PATHS[type][0] || "").trim();
  if (!SAFE_PATH.test(sourcePath) || !TYPE_PATHS[type].includes(sourcePath)) throw bindingError(LIVE_BINDING_ERROR_CODES.SOURCE_PATH_INVALID);
  const targetPath = String(definition.targetPath || `data.live.${type}`).trim();
  if (!SAFE_PATH.test(targetPath) || targetPath.split(".").some((key) => DANGEROUS_KEYS.has(key))) throw bindingError(LIVE_BINDING_ERROR_CODES.TARGET_PATH_INVALID);
  const now = normalizeNow(definition.updatedAt || definition.createdAt);
  return {
    bindingId: normalizeId(definition.bindingId) || `binding_${type}`,
    type,
    sourcePath,
    targetPath,
    enabled: definition.enabled !== false,
    targets: uniqueStrings(definition.targets).filter((target) => target === "preview" || target === "program"),
    fallback: definition.fallback === undefined ? undefined : cloneValue(definition.fallback),
    createdAt: normalizeNow(definition.createdAt || now),
    updatedAt: now
  };
}

function requireEngine(engine) {
  const runtime = ENGINES.get(engine);
  if (!runtime || runtime.destroyed) throw bindingError(LIVE_BINDING_ERROR_CODES.DESTROYED);
  return runtime;
}

function assertExpectedRevision(engine, expectedRevision) {
  if (expectedRevision === undefined) return;
  if (Number(expectedRevision) !== engine.revision) throw bindingError(LIVE_BINDING_ERROR_CODES.REVISION_CONFLICT);
}

function advance(engine, now) {
  engine.revision += 1;
  engine.status = "ready";
  engine.updatedAt = normalizeNow(now);
  engine.warnings = [];
  engine.errors = [];
}

function getPath(source, path) {
  return path.split(".").reduce((value, key) => value === null || value === undefined ? undefined : value[key], source);
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  parts.forEach((key, index) => {
    if (index === parts.length - 1) cursor[key] = cloneValue(value);
    else {
      if (!isRecord(cursor[key])) cursor[key] = Object.create(null);
      cursor = cursor[key];
    }
  });
}

function safeClone(input) {
  const errors = [];
  const seen = new WeakSet();
  let nodes = 0;
  function visit(value, depth) {
    if (depth > MAX_DEPTH || nodes++ > MAX_OBJECT_KEYS * 4) { errors.push("depth-limit"); return undefined; }
    if (value === null || value === undefined || typeof value === "boolean") return value;
    if (typeof value === "string") return value.slice(0, MAX_TEXT_LENGTH);
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (["function", "symbol", "bigint"].includes(typeof value)) { errors.push("unsupported-value"); return undefined; }
    if (seen.has(value)) { errors.push("cyclic-value"); return undefined; }
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, MAX_ARRAY_ITEMS).map((item) => visit(item, depth + 1)).filter((item) => item !== undefined);
    let descriptors;
    try { descriptors = Object.getOwnPropertyDescriptors(value); } catch { errors.push("descriptor-rejected"); return undefined; }
    const keys = Object.keys(descriptors);
    if (keys.length > MAX_OBJECT_KEYS) errors.push("object-limit");
    const output = Object.create(null);
    for (const key of keys.slice(0, MAX_OBJECT_KEYS)) {
      if (DANGEROUS_KEYS.has(key)) { errors.push("dangerous-key"); continue; }
      const descriptor = descriptors[key];
      if (!descriptor || typeof descriptor.get === "function" || typeof descriptor.set === "function") {
        errors.push("accessor-rejected");
        continue;
      }
      const cloned = visit(descriptor.value, depth + 1);
      if (cloned !== undefined) output[key] = cloned;
    }
    return output;
  }
  return { value: visit(input, 0), errors: uniqueStrings(errors) };
}

function cloneValue(value) {
  return safeClone(value).value;
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => freezeDeep(child, seen));
  return Object.freeze(value);
}

function normalizeId(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(text) ? text : null;
}

function normalizeNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : []).filter((item) => typeof item === "string" && item))];
}

function bindingError(code, details = {}) {
  return new BroadcastLiveBindingError(code, details);
}
