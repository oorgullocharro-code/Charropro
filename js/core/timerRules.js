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
