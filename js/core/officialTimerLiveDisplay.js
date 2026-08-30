const DEFAULT_CADENCE_MS = 100;
const OFFICIAL_STATUSES = new Set([
  "READY",
  "RUNNING",
  "PAUSED",
  "FINISHED",
  "STALE",
  "OFFLINE",
  "UNAVAILABLE"
]);

export function deriveOfficialTimerLiveDisplay(snapshot = {}, now = Date.now()) {
  const status = normalizeStatus(snapshot);
  const nowMs = normalizeNow(now);
  const durationMs = nonNegativeNumber(snapshot.durationMs ?? snapshot.limitMs);
  const officialElapsedBaseMs = nonNegativeNumber(
    snapshot.officialElapsedMs ?? snapshot.elapsedMs ?? snapshot.elapsedLiveMs
  );
  const anchorMs = parseTimestamp(
    snapshot.runningSince ?? snapshot.officialAnchor ?? snapshot.anchorAt ?? snapshot.startedAt
  );
  const canInterpolate = status === "RUNNING" && anchorMs !== null;
  const interpolatedMs = canInterpolate ? Math.max(0, nowMs - anchorMs) : 0;
  const elapsedMs = nonNegativeNumber(officialElapsedBaseMs + interpolatedMs);
  const mode = normalizeMode(snapshot.mode, durationMs);
  const remainingMs = durationMs > 0 ? durationMs - elapsedMs : null;
  const overtimeMs = durationMs > 0 ? Math.max(0, elapsedMs - durationMs) : 0;
  const displayMs = mode === "countdown" && remainingMs !== null ? remainingMs : elapsedMs;

  return Object.freeze({
    timerId: normalizeText(snapshot.timerId ?? snapshot.id),
    status,
    running: status === "RUNNING",
    paused: status === "PAUSED",
    finished: status === "FINISHED",
    stale: status === "STALE",
    offline: status === "OFFLINE",
    canInterpolate,
    mode,
    durationMs,
    officialElapsedBaseMs,
    elapsedMs,
    remainingMs,
    overtimeMs,
    displayMs,
    formattedElapsed: formatOfficialTimerMs(elapsedMs),
    formattedRemaining: formatOfficialTimerMs(remainingMs ?? elapsedMs),
    formatted: formatOfficialTimerMs(displayMs),
    expired: Boolean(durationMs > 0 && elapsedMs >= durationMs),
    overtime: overtimeMs > 0,
    alertState: overtimeMs > 0 ? "overtime" : "normal",
    sourceRevision: nonNegativeInteger(snapshot.sourceRevision ?? snapshot.revision),
    anchorMs,
    derivedAtMs: nowMs,
    stateLabel: officialTimerDisplayStateLabel(status)
  });
}

export function formatOfficialTimerMs(value) {
  const numeric = Number(value);
  const safeMs = Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
  const negative = safeMs < 0;
  const absoluteMs = Math.abs(safeMs);
  const minutes = Math.floor(absoluteMs / 60000);
  const seconds = Math.floor((absoluteMs % 60000) / 1000);
  const decimals = Math.floor((absoluteMs % 1000) / 100);
  return `${negative ? "-" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${decimals}`;
}

export function officialTimerDisplayStateLabel(status) {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "RUNNING") return "CORRIENDO";
  if (normalized === "PAUSED") return "PAUSADO";
  if (normalized === "FINISHED") return "FINALIZADO";
  if (normalized === "STALE") return "DESACTUALIZADO";
  if (normalized === "OFFLINE") return "SIN CONEXION";
  if (normalized === "UNAVAILABLE") return "NO DISPONIBLE";
  return "LISTO";
}

export function compareOfficialTimerSnapshots(current = {}, incoming = {}, options = {}) {
  const expected = normalizeIdentity(options.expectedIdentity || {});
  const currentIdentity = normalizeIdentity(current);
  const incomingIdentity = normalizeIdentity(incoming);
  if (expected.timerId && incomingIdentity.timerId !== expected.timerId) {
    return { adopt: false, reason: "official-timer-context-mismatch" };
  }
  for (const field of ["charreadaId", "suerteId"]) {
    if (expected[field] && incomingIdentity[field] && incomingIdentity[field] !== expected[field]) {
      return { adopt: false, reason: "official-timer-context-mismatch" };
    }
  }
  const currentRevision = nonNegativeInteger(current.sourceRevision ?? current.revision);
  const incomingRevision = nonNegativeInteger(incoming.sourceRevision ?? incoming.revision);
  if (currentIdentity.timerId && currentIdentity.timerId === incomingIdentity.timerId) {
    if (incomingRevision < currentRevision) return { adopt: false, reason: "official-timer-revision-regression" };
    if (incomingRevision === currentRevision) return { adopt: false, reason: "official-timer-revision-duplicate" };
  }
  if (currentIdentity.timerId && currentIdentity.timerId !== incomingIdentity.timerId && !expected.timerId) {
    const currentFreshness = snapshotFreshness(current);
    const incomingFreshness = snapshotFreshness(incoming);
    if (incomingFreshness < currentFreshness) return { adopt: false, reason: "official-timer-context-stale" };
  }
  return { adopt: true, reason: "official-timer-snapshot-advanced" };
}

export function createOfficialTimerTicker(options = {}) {
  const cadenceMs = Math.max(50, Math.trunc(Number(options.cadenceMs || DEFAULT_CADENCE_MS)));
  const now = typeof options.now === "function" ? options.now : Date.now;
  const scheduleTimeout = options.setTimeout || globalThis.setTimeout?.bind(globalThis);
  const cancelTimeout = options.clearTimeout || globalThis.clearTimeout?.bind(globalThis);
  const subscribers = new Map();
  let sequence = 0;
  let timeoutId = null;
  let ticks = 0;

  function activeEntries() {
    return [...subscribers.values()].filter((entry) => entry.active);
  }

  function stop() {
    if (timeoutId !== null && cancelTimeout) cancelTimeout(timeoutId);
    timeoutId = null;
  }

  function schedule() {
    if (timeoutId !== null || !scheduleTimeout || !activeEntries().length) return;
    timeoutId = scheduleTimeout(run, cadenceMs);
  }

  function run() {
    timeoutId = null;
    const tickNow = normalizeNow(now());
    ticks += 1;
    for (const entry of activeEntries()) entry.callback(tickNow);
    schedule();
  }

  function subscribe(callback, subscriptionOptions = {}) {
    if (typeof callback !== "function") throw new TypeError("official-timer-ticker-callback-required");
    const id = ++sequence;
    subscribers.set(id, { callback, active: subscriptionOptions.active === true });
    schedule();
    return Object.freeze({
      setActive(active) {
        const entry = subscribers.get(id);
        if (!entry) return;
        entry.active = active === true;
        if (entry.active) schedule();
        else if (!activeEntries().length) stop();
      },
      refresh(at = now()) {
        const entry = subscribers.get(id);
        if (entry) entry.callback(normalizeNow(at));
      },
      unsubscribe() {
        subscribers.delete(id);
        if (!activeEntries().length) stop();
      }
    });
  }

  return Object.freeze({
    subscribe,
    destroy() {
      subscribers.clear();
      stop();
    },
    diagnostics() {
      return Object.freeze({
        subscribers: subscribers.size,
        activeSubscribers: activeEntries().length,
        scheduled: timeoutId !== null,
        ticks,
        cadenceMs
      });
    }
  });
}

export function updateOfficialTimerDomDisplays(root, registry = {}, now = Date.now()) {
  if (!root?.querySelectorAll) return Object.freeze({ updatedCount: 0, hasRunningTimer: false });
  let updatedCount = 0;
  let hasRunningTimer = false;
  root.querySelectorAll(".terna-timer-display[data-terna-timer-id], .official-timer-display[data-official-timer-id]").forEach((display) => {
    const timerId = display?.dataset?.ternaTimerId || display?.dataset?.officialTimerId;
    const timer = timerId ? registry?.[timerId] : null;
    if (!timer) return;
    const live = deriveOfficialTimerLiveDisplay(timer, now);
    display.textContent = live.formatted;
    display.dataset.timerStatus = live.status;
    display.dataset.timerAlertState = live.alertState;
    display.classList?.toggle?.("overtime", live.overtime);
    hasRunningTimer ||= live.running;
    updatedCount += 1;
  });
  return Object.freeze({ updatedCount, hasRunningTimer });
}

export const officialTimerTicker = createOfficialTimerTicker();

function normalizeStatus(snapshot) {
  let status = String(snapshot.officialStatus || snapshot.status || "").trim().toUpperCase();
  if (!status && snapshot.running === true) status = "RUNNING";
  if (!status && snapshot.paused === true) status = "PAUSED";
  if (!status) status = "READY";
  if (status === "STOPPED") status = "FINISHED";
  return OFFICIAL_STATUSES.has(status) ? status : "UNAVAILABLE";
}

function normalizeMode(value, durationMs) {
  const mode = String(value || "").trim().toLowerCase();
  if (["countdown", "deadline", "shared_window", "independent_countdown"].includes(mode)) return "countdown";
  if (["countup", "count_up", "elapsed"].includes(mode)) return "countup";
  return durationMs > 0 ? "countdown" : "countup";
}

function normalizeIdentity(value = {}) {
  const context = value.contextRef && typeof value.contextRef === "object" ? value.contextRef : {};
  return {
    timerId: normalizeText(value.timerId ?? value.id),
    charreadaId: normalizeText(value.charreadaId ?? context.charreadaId),
    suerteId: normalizeText(value.suerteId ?? context.suerteId)
  };
}

function snapshotFreshness(value = {}) {
  return parseTimestamp(value.updatedAt ?? value.generatedAt ?? value.authorityAcceptedAt) || 0;
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0) return number;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNow(value) {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0) return number;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function nonNegativeInteger(value) {
  return Math.max(0, Math.trunc(nonNegativeNumber(value)));
}

function normalizeText(value) {
  return String(value || "").trim();
}
