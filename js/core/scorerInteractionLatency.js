export const SCORER_INTERACTION_LATENCY_VERSION = "1.0.0";
export const SCORER_DUPLICATE_TAP_WINDOW_MS = 320;

const DUPLICATE_SENSITIVE_ACTIONS = new Set([
  "select-suerte",
  "select-terna-suerte",
  "select-team",
  "select-attempt",
  "select-coleador",
  "toggle-rule",
  "toggle-team-penalty",
  "toggle-attempt-zero",
  "toggle-desc",
  "select-scoring-classification",
  "toggle-jineteo-no-repara",
  "toggle-mangana-floreo-detail",
  "set-mangana-result",
  "set-paso-result",
  "set-mangana-remate"
]);

const SCORER_ACTIONS = new Set([
  ...DUPLICATE_SENSITIVE_ACTIONS,
  "punta-step",
  "punta-set",
  "adjust-piales-distance",
  "adjust-rule-quantity",
  "add-team-penalty",
  "remove-team-penalty",
  "add-custom",
  "remove-custom",
  "adjust-mangana-floreo",
  "adjust-mangana-pulls",
  "apply-jineteo-timing",
  "apply-sport-timing",
  "reset-attempt",
  "previous-score",
  "next-score"
]);

const KEY_FIELDS = ["id", "type", "index", "field", "value", "result", "delta", "group"];

export function isScorerInteractionAction(action) {
  return SCORER_ACTIONS.has(String(action || ""));
}

export function buildScorerInteractionKey(action, dataset = {}) {
  const normalizedAction = String(action || "");
  const identity = KEY_FIELDS
    .map((field) => `${field}:${String(dataset?.[field] ?? "")}`)
    .join("|");
  return `${normalizedAction}|${identity}`;
}

export function createScorerDuplicateActionGuard(options = {}) {
  const now = typeof options.now === "function" ? options.now : monotonicNow;
  const duplicateWindowMs = Math.max(0, Number(options.duplicateWindowMs ?? SCORER_DUPLICATE_TAP_WINDOW_MS));
  const acceptedAtByKey = new Map();

  return Object.freeze({
    accept(action, dataset = {}) {
      const normalizedAction = String(action || "");
      const key = buildScorerInteractionKey(normalizedAction, dataset);
      const atMs = Number(now());
      if (!DUPLICATE_SENSITIVE_ACTIONS.has(normalizedAction)) {
        return Object.freeze({ accepted: true, duplicate: false, key, atMs });
      }
      const previousAtMs = acceptedAtByKey.get(key);
      if (Number.isFinite(previousAtMs) && atMs - previousAtMs < duplicateWindowMs) {
        return Object.freeze({ accepted: false, duplicate: true, key, atMs });
      }
      acceptedAtByKey.set(key, atMs);
      return Object.freeze({ accepted: true, duplicate: false, key, atMs });
    },
    reset() {
      acceptedAtByKey.clear();
    },
    size() {
      return acceptedAtByKey.size;
    }
  });
}

export function createAfterPaintTaskQueue(options = {}) {
  const scheduleFrame = typeof options.scheduleFrame === "function"
    ? options.scheduleFrame
    : (callback) => globalThis.requestAnimationFrame?.(callback) ?? globalThis.setTimeout(callback, 0);
  const scheduleTask = typeof options.scheduleTask === "function"
    ? options.scheduleTask
    : (callback) => globalThis.setTimeout(callback, 0);
  const tasks = new Map();
  const scheduledKeys = new Set();

  function run(key) {
    scheduledKeys.delete(key);
    const task = tasks.get(key);
    tasks.delete(key);
    return typeof task === "function" ? task() : undefined;
  }

  return Object.freeze({
    schedule(key, task) {
      const normalizedKey = String(key || "default");
      if (typeof task !== "function") throw new Error("scorer-after-paint-task-invalid");
      tasks.set(normalizedKey, task);
      if (scheduledKeys.has(normalizedKey)) return false;
      scheduledKeys.add(normalizedKey);
      scheduleFrame(() => scheduleTask(() => run(normalizedKey)));
      return true;
    },
    flush(key) {
      return run(String(key || "default"));
    },
    flushAll() {
      return [...tasks.keys()].map((key) => run(key));
    },
    pendingCount() {
      return tasks.size;
    }
  });
}

export function createScorerInteractionTrace(options = {}) {
  const now = typeof options.now === "function" ? options.now : monotonicNow;
  const kind = String(options.kind || "interaction");
  const traceId = String(options.traceId || `${kind}:${Date.now().toString(36)}`);
  const marks = {};
  let status = "running";

  function snapshot() {
    const copy = Object.fromEntries(Object.entries(marks).map(([stage, mark]) => [stage, { ...mark }]));
    return Object.freeze({
      latencyVersion: SCORER_INTERACTION_LATENCY_VERSION,
      traceId,
      kind,
      status,
      marks: Object.freeze(copy),
      durations: Object.freeze(buildDurations(copy))
    });
  }

  return Object.freeze({
    mark(stage) {
      const normalizedStage = String(stage || "");
      if (!normalizedStage || Object.hasOwn(marks, normalizedStage)) return snapshot();
      marks[normalizedStage] = { atMs: Number(now()) };
      return snapshot();
    },
    finish(nextStatus = "completed") {
      status = String(nextStatus || "completed");
      return snapshot();
    },
    snapshot
  });
}

function buildDurations(marks) {
  const between = (start, end) => {
    if (!marks[start] || !marks[end]) return null;
    return Math.max(0, marks[end].atMs - marks[start].atMs);
  };
  return {
    touchToHandlerMs: between("T0", "T1"),
    touchToLocalStateMs: between("T0", "T2"),
    touchToDomMs: between("T0", "T3"),
    touchToVisibleMs: between("T0", "T4"),
    persistenceMs: between("T5", "T6"),
    switchToResolvedMs: between("S0", "S1"),
    switchToDomMs: between("S0", "S3"),
    switchToVisibleMs: between("S0", "S4"),
    switchToSyncReadyMs: between("S0", "S5")
  };
}

function monotonicNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}
