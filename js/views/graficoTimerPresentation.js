const TIMER_STATUSES = Object.freeze({
  READY: "TIEMPO LISTO",
  RUNNING: "TIEMPO EN CURSO",
  PAUSED: "TIEMPO PAUSADO",
  FINISHED: "TIEMPO FINALIZADO",
  STALE: "TIEMPO DESACTUALIZADO",
  OFFLINE: "TIEMPO SIN CONEXION",
  UNAVAILABLE: "TIEMPO NO DISPONIBLE"
});

export function readGraphicTimerPresentationOptions(search = "") {
  const params = new URLSearchParams(String(search || ""));
  return Object.freeze({
    showMinutes: readOptionalBoolean(params.get("showMinutes") ?? params.get("minutes"))
  });
}

export function buildGraphicTimerPresentation(timer = {}, live = {}, payload = {}, options = {}) {
  const displayMs = finiteNumber(live.displayMs, finiteNumber(timer.displayMs, 0));
  const status = String(live.status || timer.officialStatus || timer.status || "READY").trim().toUpperCase();
  const showMinutes = options.showMinutes === true
    || (options.showMinutes !== false && finiteNumber(live.durationMs, timer.durationMs) >= 60_000);
  const overtime = live.overtime === true || Number(live.overtimeMs || timer.overtimeMs || 0) > 0 || displayMs < 0;

  return Object.freeze({
    stateLabel: TIMER_STATUSES[status] || TIMER_STATUSES.READY,
    formattedTime: formatGraphicTimerMs(displayMs, { showMinutes }),
    suerteLabel: resolveGraphicTimerSuerteLabel(timer, payload),
    overtime,
    showMinutes
  });
}

export function formatGraphicTimerMs(value, options = {}) {
  const milliseconds = Math.trunc(finiteNumber(value, 0));
  const negative = milliseconds < 0;
  const absolute = Math.abs(milliseconds);
  const seconds = Math.floor((absolute % 60_000) / 1_000);
  const tenths = Math.floor((absolute % 1_000) / 100);
  const prefix = negative ? "-" : "";
  if (options.showMinutes !== true) return `${prefix}${Math.floor(absolute / 1_000)}.${tenths}`;
  return `${prefix}${String(Math.floor(absolute / 60_000)).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function resolveGraphicTimerSuerteLabel(timer, payload) {
  const turnSuerte = payload?.turn?.suerte || {};
  const context = timer?.contextRef || {};
  const candidates = [
    timer?.suerteLabel,
    context?.suerteLabel,
    turnSuerte.fullName,
    turnSuerte.name,
    timer?.phaseLabel
  ];
  return candidates.map(cleanLabel).find(Boolean) || "SUERTE EN CURSO";
}

function readOptionalBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "si"].includes(normalized)) return true;
  if (["0", "false", "no"].includes(normalized)) return false;
  return null;
}

function cleanLabel(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
