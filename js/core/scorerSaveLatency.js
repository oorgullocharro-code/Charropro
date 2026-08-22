export const SCORER_SAVE_LATENCY_VERSION = "1.0.0";

export const SCORER_SAVE_STAGES = Object.freeze([
  "T0",
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12"
]);

const STAGE_SET = new Set(SCORER_SAVE_STAGES);

export function createScorerSaveLatencyTrace(options = {}) {
  const now = typeof options.now === "function" ? options.now : monotonicNow;
  const traceId = normalizeTraceId(options.traceId) || `save_${Date.now().toString(36)}`;
  const marks = {};
  let finishedStatus = "running";
  let finishedDetail = {};

  function mark(stage, detail = {}) {
    if (!STAGE_SET.has(stage)) throw new Error("scorer-save-latency-stage-invalid");
    if (Object.hasOwn(marks, stage)) return snapshot();
    marks[stage] = {
      atMs: finiteNumber(now(), "scorer-save-latency-clock-invalid"),
      detail: sanitizeDetail(detail)
    };
    return snapshot();
  }

  function finish(status = "completed", detail = {}) {
    finishedStatus = normalizeStatus(status);
    finishedDetail = sanitizeDetail(detail);
    return snapshot();
  }

  function snapshot() {
    const outputMarks = Object.fromEntries(
      SCORER_SAVE_STAGES
        .filter((stage) => Object.hasOwn(marks, stage))
        .map((stage) => [stage, { ...marks[stage], detail: { ...marks[stage].detail } }])
    );
    return Object.freeze({
      latencyVersion: SCORER_SAVE_LATENCY_VERSION,
      traceId,
      status: finishedStatus,
      detail: Object.freeze({ ...finishedDetail }),
      marks: Object.freeze(outputMarks),
      durations: Object.freeze(buildDurations(outputMarks))
    });
  }

  return Object.freeze({ mark, finish, snapshot });
}

export function summarizeScorerSaveLatency(samples = []) {
  const valid = (Array.isArray(samples) ? samples : [])
    .map((sample) => sample?.durations || sample)
    .filter((durations) => durations && typeof durations === "object");
  return Object.freeze({
    sampleCount: valid.length,
    saveCriticalPath: summarizeMetric(valid, "saveCriticalPathMs"),
    visualNextTurn: summarizeMetric(valid, "visualNextTurnMs"),
    fullSync: summarizeMetric(valid, "fullSyncMs")
  });
}

function buildDurations(marks) {
  const duration = (start, end) => {
    if (!marks[start] || !marks[end]) return null;
    return Math.max(0, marks[end].atMs - marks[start].atMs);
  };
  const visualAt = marks.T11?.atMs;
  const backgroundAt = marks.T12?.atMs;
  const finalAt = [visualAt, backgroundAt].filter(Number.isFinite).reduce((max, value) => Math.max(max, value), -Infinity);
  return {
    t0ToT1Ms: duration("T0", "T1"),
    t1ToT3Ms: duration("T1", "T3"),
    t3ToT5Ms: duration("T3", "T5"),
    t5ToT7Ms: duration("T5", "T7"),
    t7ToT9Ms: duration("T7", "T9"),
    t9ToT11Ms: duration("T9", "T11"),
    t11ToT12Ms: duration("T11", "T12"),
    saveCriticalPathMs: duration("T0", "T5"),
    visualNextTurnMs: duration("T0", "T11"),
    fullSyncMs: marks.T0 && Number.isFinite(finalAt) ? Math.max(0, finalAt - marks.T0.atMs) : null,
    projectionBlockedVisual: Number.isFinite(backgroundAt) && Number.isFinite(visualAt) && backgroundAt <= visualAt
  };
}

function summarizeMetric(samples, key) {
  const values = samples.map((sample) => sample[key]).filter(Number.isFinite).sort((left, right) => left - right);
  if (!values.length) return Object.freeze({ count: 0, p50Ms: null, p95Ms: null, maxMs: null });
  return Object.freeze({
    count: values.length,
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    maxMs: values[values.length - 1]
  });
}

function percentile(values, ratio) {
  const index = Math.max(0, Math.ceil(values.length * ratio) - 1);
  return values[index];
}

function sanitizeDetail(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 20)) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key)) continue;
    if (typeof item === "string") output[key] = item.slice(0, 160);
    else if (typeof item === "boolean") output[key] = item;
    else if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
    else if (item === null) output[key] = null;
  }
  return output;
}

function normalizeTraceId(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/.test(text) ? text : "";
}

function normalizeStatus(value) {
  const status = String(value || "completed");
  return ["running", "completed", "partial", "failed"].includes(status) ? status : "completed";
}

function finiteNumber(value, code) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(code);
  return number;
}

function monotonicNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}
