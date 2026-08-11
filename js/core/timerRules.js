const DEFAULT_TIMER_RULE = {
  mode: "elapsed",
  label: "Cronometro",
  activeLabel: "Cronometro",
  pausedLabel: "Cronometro pausado",
  expiredLabel: "Tiempo agotado",
  limitMs: 0
};

const TIMER_RULES = {
  colas: {
    mode: "countdown",
    label: "Tiempo de salida",
    activeLabel: "Tiempo de salida",
    pausedLabel: "Tiempo de salida pausado",
    expiredLabel: "Tiempo agotado",
    limitMs: 15000
  }
};

export const OFFICIAL_TIMER_CONTEXT_VERSION = "1.0.0";
export const OFFICIAL_TIMER_STATUSES = Object.freeze([
  "READY",
  "RUNNING",
  "PAUSED",
  "FINISHED"
]);
export const OFFICIAL_TIMER_COMMANDS = Object.freeze([
  "START",
  "PAUSE",
  "RESUME",
  "FINISH"
]);

export function getTimerRuleForSource(source = {}) {
  const suerte = source?.turn?.suerte || source?.suerte || source;
  const suerteId = suerte?.id || source?.suerteId || "";
  return normalizeTimerRule(TIMER_RULES[suerteId] || DEFAULT_TIMER_RULE);
}

export function getTimerScopeKey(source = {}) {
  const turn = source?.turn || source;
  const charreadaId = source?.charreada?.id || source?.charreadaId || "";
  const teamId = turn?.team?.id || source?.team?.id || "";
  const suerteId = turn?.suerte?.id || source?.suerte?.id || source?.suerteId || "";
  const attemptIndex = Number(turn?.attemptIndex ?? source?.attemptIndex ?? 0);
  const coleadorIndex = Number(turn?.coleadorIndex ?? source?.coleadorIndex ?? 0);
  return [charreadaId, teamId, suerteId, attemptIndex, coleadorIndex].join("__");
}

export function getTimerView(timer = {}, source = {}) {
  const hasSourceRule = Boolean(source?.turn?.suerte || source?.suerte || source?.suerteId);
  const rule = hasSourceRule ? getTimerRuleForSource(source) : getTimerRuleFromTimer(timer);
  const elapsedMs = getTimerElapsedMs(timer);
  const countdown = rule.mode === "countdown" && rule.limitMs > 0;
  const remainingMs = countdown ? Math.max(0, rule.limitMs - elapsedMs) : null;
  const displayMs = countdown ? remainingMs : elapsedMs;
  const expired = countdown && elapsedMs >= rule.limitMs;

  return {
    rule,
    scopeKey: getTimerScopeKey(source),
    elapsedMs,
    displayMs,
    remainingMs,
    expired,
    formatted: formatTimerMs(displayMs),
    stateLabel: getTimerStateLabel(timer, rule, expired),
    limitText: rule.limitMs ? `${Math.round(rule.limitMs / 1000)} seg` : ""
  };
}

export function getTimerElapsedMs(timer = {}) {
  const base = Number(timer.elapsedMs || 0);
  if (!timer.running || !timer.startedAt) return base;
  return base + Math.max(0, Date.now() - Number(timer.startedAt));
}

export function formatTimerMs(elapsedMs) {
  const safeMs = Math.max(0, Number(elapsedMs || 0));
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const decimals = Math.floor((safeMs % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${decimals}`;
}

export function createOfficialTimerContext(definition = {}, options = {}) {
  const timerId = normalizeTimerId(definition.timerId || definition.id);
  if (!timerId) throw new Error("official-timer-id-required");
  const durationMs = Math.max(0, finiteNumber(definition.durationMs ?? definition.limitMs));
  const createdAt = toIso(options.now ?? Date.now());
  return {
    contractVersion: OFFICIAL_TIMER_CONTEXT_VERSION,
    timerId,
    contextType: normalizeTimerId(definition.contextType || "official"),
    status: "READY",
    durationMs,
    officialElapsedMs: 0,
    runningSince: null,
    wallStartedAt: null,
    wallFinishedAt: null,
    pausedAt: null,
    pauseReason: null,
    pauses: [],
    revision: 0,
    source: normalizeTimerText(definition.source || options.source || "scorer", 120),
    commandSource: null,
    actor: null,
    createdAt,
    updatedAt: createdAt
  };
}

export function normalizeOfficialTimerContext(timer = {}, definition = {}) {
  const timerId = normalizeTimerId(timer?.timerId || definition?.timerId || definition?.id);
  if (!timerId) throw new Error("official-timer-id-required");
  const status = OFFICIAL_TIMER_STATUSES.includes(timer.status) ? timer.status : "READY";
  const durationMs = Math.max(0, finiteNumber(timer.durationMs ?? definition.durationMs ?? definition.limitMs));
  return {
    ...createOfficialTimerContext({ ...definition, ...timer, timerId, durationMs }, { now: timer.createdAt || Date.now() }),
    ...clonePlain(timer),
    contractVersion: OFFICIAL_TIMER_CONTEXT_VERSION,
    timerId,
    contextType: normalizeTimerId(timer.contextType || definition.contextType || "official"),
    status,
    durationMs,
    officialElapsedMs: Math.max(0, finiteNumber(timer.officialElapsedMs)),
    runningSince: normalizeIso(timer.runningSince),
    wallStartedAt: normalizeIso(timer.wallStartedAt),
    wallFinishedAt: normalizeIso(timer.wallFinishedAt),
    pausedAt: normalizeIso(timer.pausedAt),
    pauseReason: timer.pauseReason === null || timer.pauseReason === undefined
      ? null
      : normalizeTimerText(timer.pauseReason, 240),
    pauses: (Array.isArray(timer.pauses) ? timer.pauses : []).slice(0, 100).map((item) => ({
      pausedAt: normalizeIso(item?.pausedAt),
      resumedAt: normalizeIso(item?.resumedAt),
      reason: normalizeTimerText(item?.reason, 240),
      officialElapsedAtPause: Math.max(0, finiteNumber(item?.officialElapsedAtPause)),
      wallPauseMs: item?.wallPauseMs === null || item?.wallPauseMs === undefined
        ? null
        : Math.max(0, finiteNumber(item.wallPauseMs))
    })),
    revision: Math.max(0, Math.trunc(finiteNumber(timer.revision))),
    source: normalizeTimerText(timer.source || definition.source || "scorer", 120),
    commandSource: timer.commandSource ? normalizeTimerText(timer.commandSource, 120) : null,
    actor: normalizeTimerActor(timer.actor),
    createdAt: normalizeIso(timer.createdAt) || new Date().toISOString(),
    updatedAt: normalizeIso(timer.updatedAt) || new Date().toISOString()
  };
}

export function applyOfficialTimerCommand(timer = {}, command = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const type = String(command?.type || command || "").trim().toUpperCase();
  if (!OFFICIAL_TIMER_COMMANDS.includes(type)) {
    return { ok: false, reason: "official-timer-command-invalid", timer: current };
  }
  const nowMs = resolveNowMs(options.now ?? command?.at ?? Date.now());
  const now = new Date(nowMs).toISOString();
  const expectedRevision = options.expectedRevision ?? command?.expectedRevision;
  if (expectedRevision !== undefined && Number(expectedRevision) !== current.revision) {
    return { ok: false, reason: "official-timer-revision-conflict", timer: current };
  }

  const next = clonePlain(current);
  if (type === "START") {
    if (current.status === "RUNNING") return { ok: true, idempotent: true, timer: current };
    if (current.status !== "READY") return { ok: false, reason: "official-timer-start-invalid-state", timer: current };
    next.status = "RUNNING";
    next.wallStartedAt = now;
    next.runningSince = now;
  }
  if (type === "PAUSE") {
    if (current.status === "PAUSED") return { ok: true, idempotent: true, timer: current };
    if (current.status !== "RUNNING") return { ok: false, reason: "official-timer-pause-invalid-state", timer: current };
    next.officialElapsedMs = resolveOfficialElapsedMs(current, nowMs);
    next.status = "PAUSED";
    next.runningSince = null;
    next.pausedAt = now;
    next.pauseReason = normalizeTimerText(command?.reason || options.pauseReason || "Pausa autorizada", 240);
    next.pauses = [...current.pauses, {
      pausedAt: now,
      resumedAt: null,
      reason: next.pauseReason,
      officialElapsedAtPause: next.officialElapsedMs,
      wallPauseMs: null
    }];
  }
  if (type === "RESUME") {
    if (current.status === "RUNNING") return { ok: true, idempotent: true, timer: current };
    if (current.status !== "PAUSED") return { ok: false, reason: "official-timer-resume-invalid-state", timer: current };
    const pauses = current.pauses.map((item, index) => {
      if (index !== current.pauses.length - 1 || item.resumedAt) return item;
      const pausedAtMs = Date.parse(item.pausedAt || "");
      return {
        ...item,
        resumedAt: now,
        wallPauseMs: Number.isFinite(pausedAtMs) ? Math.max(0, nowMs - pausedAtMs) : null
      };
    });
    next.status = "RUNNING";
    next.runningSince = now;
    next.pausedAt = null;
    next.pauseReason = null;
    next.pauses = pauses;
  }
  if (type === "FINISH") {
    if (current.status === "FINISHED") return { ok: true, idempotent: true, timer: current };
    next.officialElapsedMs = current.status === "RUNNING"
      ? resolveOfficialElapsedMs(current, nowMs)
      : current.officialElapsedMs;
    next.status = "FINISHED";
    next.runningSince = null;
    next.wallFinishedAt = now;
  }

  next.officialElapsedMs = current.durationMs
    ? Math.min(current.durationMs, Math.max(0, next.officialElapsedMs))
    : Math.max(0, next.officialElapsedMs);
  next.commandSource = normalizeTimerText(command?.source || options.source || current.source || "scorer", 120);
  next.actor = normalizeTimerActor(command?.actor || options.actor);
  next.updatedAt = now;
  next.revision = current.revision + 1;
  return { ok: true, idempotent: false, timer: normalizeOfficialTimerContext(next) };
}

export function getOfficialTimerContextView(timer = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const nowMs = resolveNowMs(options.now ?? Date.now());
  const officialElapsedMs = resolveOfficialElapsedMs(current, nowMs);
  const remainingMs = current.durationMs ? Math.max(0, current.durationMs - officialElapsedMs) : null;
  const wallStartedAtMs = Date.parse(current.wallStartedAt || "");
  const wallFinishedAtMs = Date.parse(current.wallFinishedAt || "");
  const wallElapsedMs = Number.isFinite(wallStartedAtMs)
    ? Math.max(0, (Number.isFinite(wallFinishedAtMs) ? wallFinishedAtMs : nowMs) - wallStartedAtMs)
    : 0;
  return {
    timerId: current.timerId,
    status: current.status,
    running: current.status === "RUNNING",
    paused: current.status === "PAUSED",
    finished: current.status === "FINISHED",
    durationMs: current.durationMs,
    officialElapsedMs,
    remainingMs,
    wallElapsedMs,
    pauseReason: current.pauseReason,
    revision: current.revision,
    formattedElapsed: formatTimerMs(officialElapsedMs),
    formattedRemaining: formatTimerMs(remainingMs ?? officialElapsedMs),
    expired: Boolean(current.durationMs && officialElapsedMs >= current.durationMs)
  };
}

export function validateOfficialTimerContext(timer = {}) {
  const errors = [];
  let normalized = null;
  if (timer?.status !== undefined && !OFFICIAL_TIMER_STATUSES.includes(timer.status)) {
    errors.push("official-timer-status-invalid");
  }
  try {
    normalized = normalizeOfficialTimerContext(timer);
  } catch (error) {
    errors.push(error?.message || "official-timer-invalid");
  }
  if (normalized) {
    if (normalized.status === "RUNNING" && !normalized.runningSince) errors.push("official-timer-running-since-required");
    if (normalized.status !== "RUNNING" && normalized.runningSince) errors.push("official-timer-running-since-unexpected");
    if (normalized.durationMs && normalized.officialElapsedMs > normalized.durationMs) errors.push("official-timer-elapsed-overflow");
  }
  return { valid: errors.length === 0, errors, timer: normalized };
}

function getTimerRuleFromTimer(timer = {}) {
  const sourceRule = timer.rule || {
    mode: timer.mode,
    label: timer.limitLabel || timer.label,
    activeLabel: timer.activeLabel,
    pausedLabel: timer.pausedLabel,
    expiredLabel: timer.expiredLabel,
    limitMs: timer.limitMs ?? timer.durationMs
  };
  return normalizeTimerRule(sourceRule);
}

function normalizeTimerRule(rule = {}) {
  const merged = { ...DEFAULT_TIMER_RULE, ...(rule || {}) };
  const limitMs = Number(merged.limitMs || merged.durationMs || 0);
  return {
    mode: merged.mode === "countdown" && limitMs > 0 ? "countdown" : "elapsed",
    label: merged.label || DEFAULT_TIMER_RULE.label,
    activeLabel: merged.activeLabel || merged.label || DEFAULT_TIMER_RULE.activeLabel,
    pausedLabel: merged.pausedLabel || `${merged.label || DEFAULT_TIMER_RULE.label} pausado`,
    expiredLabel: merged.expiredLabel || DEFAULT_TIMER_RULE.expiredLabel,
    limitMs
  };
}

function getTimerStateLabel(timer = {}, rule, expired) {
  if (expired) return rule.expiredLabel;
  return timer.running ? rule.activeLabel : rule.pausedLabel;
}

function resolveOfficialElapsedMs(timer, nowMs) {
  const base = Math.max(0, finiteNumber(timer.officialElapsedMs));
  if (timer.status !== "RUNNING" || !timer.runningSince) return base;
  const startedMs = Date.parse(timer.runningSince);
  if (!Number.isFinite(startedMs)) return base;
  const elapsed = base + Math.max(0, nowMs - startedMs);
  return timer.durationMs ? Math.min(timer.durationMs, elapsed) : elapsed;
}

function resolveNowMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeTimerId(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9._:@/-]/g, "_").slice(0, 240);
}

function normalizeTimerText(value, maxLength = 500) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function normalizeTimerActor(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const actor = {
    id: normalizeTimerId(value.id || value.uid),
    name: normalizeTimerText(value.name || value.displayName, 240),
    role: normalizeTimerText(value.role, 120)
  };
  return actor.id || actor.name || actor.role ? actor : null;
}

function normalizeIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toIso(value) {
  const date = new Date(resolveNowMs(value));
  return date.toISOString();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clonePlain(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}
