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
export const OFFICIAL_TIMER_CONTROL_OPERATIONS = Object.freeze([
  "CLAIM_CONTROL",
  "TAKEOVER_CONTROL",
  "HANDOFF_CONTROL",
  "UPDATE_PAUSE_REASON"
]);
export const OFFICIAL_TIMER_CONTROLLER_TYPES = Object.freeze([
  "field_remote",
  "scorer_backup",
  "supervisor_backup",
  "system",
  "web_remote",
  "smartwatch",
  "hardware_remote"
]);
export const OFFICIAL_TIMER_LEASE_MS = 45 * 1000;

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
    controllerId: null,
    controllerUid: null,
    controllerRole: null,
    controllerSessionId: null,
    controllerType: null,
    controllerClaimedAt: null,
    controllerLeaseExpiresAtMs: 0,
    previousController: null,
    lastCommandId: null,
    commandIds: [],
    authorityAudit: [],
    lastOperation: null,
    source: normalizeTimerText(definition.source || options.source || "scorer", 120),
    commandSource: null,
    actor: null,
    authorityAcceptedAt: null,
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
    tournamentId: normalizeTimerId(timer.tournamentId || definition.tournamentId),
    competitionId: normalizeTimerId(timer.competitionId || definition.competitionId),
    charreadaId: normalizeTimerId(timer.charreadaId || definition.charreadaId),
    teamId: normalizeTimerId(timer.teamId || definition.teamId),
    participantId: normalizeTimerId(timer.participantId || definition.participantId),
    suerteId: normalizeTimerId(timer.suerteId || definition.suerteId),
    label: normalizeTimerText(timer.label || definition.label || timer.contextType || "Cronometro oficial", 160),
    controllerId: nullableTimerId(timer.controllerId),
    controllerUid: nullableTimerId(timer.controllerUid),
    controllerRole: nullableTimerText(timer.controllerRole, 120),
    controllerSessionId: nullableTimerId(timer.controllerSessionId),
    controllerType: normalizeControllerType(timer.controllerType),
    controllerClaimedAt: normalizeIso(timer.controllerClaimedAt),
    controllerLeaseExpiresAtMs: Math.max(0, Math.trunc(finiteNumber(timer.controllerLeaseExpiresAtMs))),
    previousController: normalizeOfficialTimerController(timer.previousController),
    lastCommandId: nullableTimerId(timer.lastCommandId),
    commandIds: normalizeCommandIds(timer.commandIds),
    authorityAudit: normalizeAuthorityAudit(timer.authorityAudit),
    lastOperation: nullableTimerText(timer.lastOperation, 80),
    source: normalizeTimerText(timer.source || definition.source || "scorer", 120),
    commandSource: timer.commandSource ? normalizeTimerText(timer.commandSource, 120) : null,
    actor: normalizeTimerActor(timer.actor),
    authorityAcceptedAt: normalizeIso(timer.authorityAcceptedAt),
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
  const commandId = nullableTimerId(command?.commandId || options.commandId);
  if (commandId && current.commandIds.includes(commandId)) {
    return { ok: true, idempotent: true, reason: "official-timer-command-replayed", timer: current };
  }
  if (options.requireCommandId === true && !commandId) {
    return { ok: false, reason: "official-timer-command-id-required", timer: current };
  }
  const nowMs = resolveNowMs(options.now ?? command?.acceptedAt ?? Date.now());
  const now = new Date(nowMs).toISOString();
  const expectedRevision = options.expectedRevision ?? command?.expectedRevision;
  if (expectedRevision !== undefined && Number(expectedRevision) !== current.revision) {
    return { ok: false, reason: "official-timer-revision-conflict", timer: current };
  }

  const next = clonePlain(current);
  const actor = normalizeTimerActor(command?.actor || options.actor);
  const controller = normalizeOfficialTimerController(command?.controller || options.controller, actor);
  const enforceOwnership = options.enforceOwnership === true;
  if (enforceOwnership) {
    if (!controller?.controllerId || !controller.controllerUid) {
      return { ok: false, reason: "official-timer-controller-required", timer: current };
    }
    if (
      current.controllerId && current.controllerId !== controller.controllerId ||
      current.controllerUid && current.controllerUid !== controller.controllerUid
    ) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    if (!current.controllerId) {
      if (options.autoClaim !== true || !isPrimaryTimerController(controller)) {
        return { ok: false, reason: "official-timer-control-not-claimed", timer: current };
      }
      assignOfficialTimerController(next, controller, nowMs, options.leaseMs);
    } else {
      extendOfficialTimerLease(next, nowMs, options.leaseMs);
    }
  }
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
  next.actor = actor;
  next.lastCommandId = commandId;
  next.commandIds = appendCommandId(current.commandIds, commandId);
  next.lastOperation = type;
  next.updatedAt = now;
  next.revision = current.revision + 1;
  next.authorityAudit = appendAuthorityAudit(current.authorityAudit, {
    commandId,
    operation: type,
    controllerId: next.controllerId,
    controllerType: next.controllerType,
    actorId: next.actor?.id || null,
    issuedAt: normalizeIso(command?.issuedAt) || now,
    acceptedAt: now,
    fromRevision: current.revision,
    toRevision: next.revision,
    result: "accepted"
  });
  return { ok: true, idempotent: false, timer: normalizeOfficialTimerContext(next) };
}

export function applyOfficialTimerControlOperation(timer = {}, request = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const operation = String(request?.operation || request?.type || "").trim().toUpperCase();
  if (!OFFICIAL_TIMER_CONTROL_OPERATIONS.includes(operation)) {
    return { ok: false, reason: "official-timer-control-operation-invalid", timer: current };
  }
  const commandId = nullableTimerId(request.commandId || options.commandId);
  if (commandId && current.commandIds.includes(commandId)) {
    return { ok: true, idempotent: true, reason: "official-timer-command-replayed", timer: current };
  }
  if (options.requireCommandId === true && !commandId) {
    return { ok: false, reason: "official-timer-command-id-required", timer: current };
  }
  const expectedRevision = options.expectedRevision ?? request.expectedRevision;
  if (expectedRevision !== undefined && Number(expectedRevision) !== current.revision) {
    return { ok: false, reason: "official-timer-revision-conflict", timer: current };
  }

  const nowMs = resolveNowMs(options.now ?? request.acceptedAt ?? Date.now());
  const now = new Date(nowMs).toISOString();
  const actor = normalizeTimerActor(request.actor || options.actor);
  const controller = normalizeOfficialTimerController(request.controller || options.controller, actor);
  const next = clonePlain(current);

  if (operation === "CLAIM_CONTROL") {
    if (!controller?.controllerId || !controller.controllerUid) return { ok: false, reason: "official-timer-controller-required", timer: current };
    const sameController = current.controllerId === controller.controllerId && current.controllerUid === controller.controllerUid;
    const occupied = Boolean(current.controllerId && !sameController);
    if (occupied && !isOfficialTimerLeaseExpired(current, nowMs)) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    if (sameController && !isOfficialTimerLeaseExpired(current, nowMs)) {
      return { ok: true, idempotent: true, reason: "official-timer-control-already-owned", timer: current };
    }
    if (occupied) next.previousController = snapshotOfficialTimerController(current);
    assignOfficialTimerController(next, controller, nowMs, options.leaseMs);
  }

  if (operation === "TAKEOVER_CONTROL") {
    if (!controller?.controllerId || !controller.controllerUid) return { ok: false, reason: "official-timer-controller-required", timer: current };
    if (current.controllerId === controller.controllerId && current.controllerUid === controller.controllerUid) {
      return { ok: true, idempotent: true, reason: "official-timer-control-already-owned", timer: current };
    }
    if (!isAuthorizedTakeoverController(controller)) {
      return { ok: false, reason: "official-timer-takeover-not-authorized", timer: current };
    }
    const explicitReason = normalizeTimerText(request.reason || options.reason, 240);
    if (!explicitReason) return { ok: false, reason: "official-timer-takeover-reason-required", timer: current };
    if (current.controllerId) next.previousController = snapshotOfficialTimerController(current);
    assignOfficialTimerController(next, controller, nowMs, options.leaseMs);
  }

  if (operation === "HANDOFF_CONTROL") {
    if (
      !controller?.controllerId ||
      current.controllerId !== controller.controllerId ||
      current.controllerUid !== controller.controllerUid
    ) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    const targetController = normalizeOfficialTimerController(request.targetController || options.targetController || current.previousController);
    if (!targetController?.controllerId) {
      return { ok: false, reason: "official-timer-handoff-target-required", timer: current };
    }
    next.previousController = snapshotOfficialTimerController(current);
    assignOfficialTimerController(next, targetController, nowMs, options.leaseMs);
  }

  if (operation === "UPDATE_PAUSE_REASON") {
    if (
      !controller?.controllerId ||
      current.controllerId !== controller.controllerId ||
      current.controllerUid !== controller.controllerUid
    ) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    if (current.status !== "PAUSED") {
      return { ok: false, reason: "official-timer-pause-reason-invalid-state", timer: current };
    }
    const reason = normalizeTimerText(request.reason || options.reason, 240);
    if (!reason) return { ok: false, reason: "official-timer-pause-reason-required", timer: current };
    next.pauseReason = reason;
    next.pauses = current.pauses.map((item, index) => index === current.pauses.length - 1 ? { ...item, reason } : item);
    extendOfficialTimerLease(next, nowMs, options.leaseMs);
  }

  next.actor = actor;
  next.commandSource = normalizeTimerText(request.source || options.source || current.source || "timer-authority", 120);
  next.lastCommandId = commandId;
  next.commandIds = appendCommandId(current.commandIds, commandId);
  next.lastOperation = operation;
  next.updatedAt = now;
  next.revision = current.revision + 1;
  next.authorityAudit = appendAuthorityAudit(current.authorityAudit, {
    commandId,
    operation,
    controllerId: next.controllerId,
    controllerType: next.controllerType,
    actorId: actor?.id || null,
    issuedAt: normalizeIso(request.issuedAt) || now,
    acceptedAt: now,
    fromRevision: current.revision,
    toRevision: next.revision,
    result: "accepted",
    reason: normalizeTimerText(request.reason || options.reason, 240) || null
  });
  return { ok: true, idempotent: false, timer: normalizeOfficialTimerContext(next) };
}

export function getOfficialTimerControlView(timer = {}, controller = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const candidate = normalizeOfficialTimerController(controller);
  const nowMs = resolveNowMs(options.now ?? Date.now());
  const hasController = Boolean(current.controllerId);
  const isOwner = Boolean(
    hasController &&
    candidate?.controllerId === current.controllerId &&
    candidate?.controllerUid === current.controllerUid
  );
  const leaseExpired = hasController ? isOfficialTimerLeaseExpired(current, nowMs) : true;
  return {
    hasController,
    isOwner,
    leaseExpired,
    canClaim: !hasController || isOwner || leaseExpired,
    canTakeover: !isOwner && isAuthorizedTakeoverController(candidate),
    canHandback: isOwner && Boolean(current.previousController?.controllerId),
    controllerId: current.controllerId,
    controllerUid: current.controllerUid,
    controllerRole: current.controllerRole,
    controllerSessionId: current.controllerSessionId,
    controllerType: current.controllerType,
    controllerLabel: getOfficialTimerControllerLabel(current.controllerType),
    previousController: current.previousController ? clonePlain(current.previousController) : null,
    leaseExpiresAtMs: current.controllerLeaseExpiresAtMs
  };
}

export function buildOfficialTimerProjection(timer = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const view = getOfficialTimerContextView(current, options);
  const generatedAt = toIso(options.now ?? Date.now());
  return {
    official: true,
    timerId: current.timerId,
    id: current.timerId,
    contextType: current.contextType,
    label: current.label,
    status: current.status.toLowerCase(),
    officialStatus: current.status,
    running: view.running,
    paused: view.paused,
    runningSince: current.runningSince,
    startedAt: current.wallStartedAt,
    pausedAt: current.pausedAt,
    stoppedAt: current.wallFinishedAt,
    elapsedMs: view.officialElapsedMs,
    officialElapsedMs: view.officialElapsedMs,
    elapsedLiveMs: view.officialElapsedMs,
    displayMs: view.remainingMs ?? view.officialElapsedMs,
    remainingMs: view.remainingMs,
    formatted: view.formattedRemaining,
    formattedTime: view.formattedRemaining,
    display: view.formattedRemaining,
    timeText: view.formattedRemaining,
    limitMs: current.durationMs,
    durationMs: current.durationMs,
    mode: current.durationMs ? "countdown" : "elapsed",
    expired: view.expired,
    revision: current.revision,
    sourceRevision: current.revision,
    generatedAt,
    updatedAt: current.updatedAt,
    updatedAtMs: Date.parse(current.updatedAt || "") || 0,
    contextRef: {
      tournamentId: current.tournamentId || null,
      competitionId: current.competitionId || null,
      charreadaId: current.charreadaId || null,
      teamId: current.teamId || null,
      participantId: current.participantId || null,
      suerteId: current.suerteId || null
    },
    controllerType: current.controllerType,
    pauseReason: current.pauseReason,
    stateLabel: officialTimerStatusLabel(current.status)
  };
}

export function buildOfficialTimerDefinitionsFromContext(source = {}) {
  const context = source?.turn ? source : { turn: source };
  const turn = context.turn || {};
  const tournamentId = normalizeTimerId(context.tournament?.id || context.tournamentId);
  const competitionId = normalizeTimerId(turn.competition?.competitionId || turn.competition?.id || context.charreada?.competitionId || context.competitionId || "equipos_completo");
  const charreadaId = normalizeTimerId(context.charreada?.id || context.charreadaId);
  const teamId = normalizeTimerId(turn.team?.id || context.team?.id || context.teamId);
  const participantId = normalizeTimerId(turn.participant?.id || context.participant?.id || context.participantId);
  const suerteId = normalizeTimerId(turn.suerte?.id || context.suerte?.id || context.suerteId);
  const participantScopeId = teamId || participantId;
  if (!tournamentId || !charreadaId || !participantScopeId || !suerteId || suerteId === "cala") return [];
  const identity = { tournamentId, competitionId, charreadaId, teamId, participantId, suerteId };
  const scope = `${charreadaId}:${participantScopeId}`;
  if (suerteId === "toro" || suerteId === "yegua") {
    return [{
      ...identity,
      timerId: `timer_${suerteId}_apretalamiento:${scope}`,
      contextType: `${suerteId}_apretalamiento`,
      durationMs: 300000,
      label: suerteId === "toro" ? "Apretalamiento de Toro" : "Apretalamiento de Yegua"
    }];
  }
  if (suerteId === "lazo" || suerteId === "pial_ruedo" || suerteId === "terna") {
    return [{
      ...identity,
      suerteId: "terna",
      timerId: `terna:${tournamentId}:${competitionId}:${charreadaId}:${participantScopeId}:timer`,
      contextType: "terna",
      durationMs: 420000,
      label: "Terna"
    }];
  }
  if (suerteId === "manganas_pie" || suerteId === "manganas_caballo") {
    return [{
      ...identity,
      timerId: `timer_${suerteId}:${scope}`,
      contextType: `timer_${suerteId}`,
      durationMs: 420000,
      label: suerteId === "manganas_pie" ? "Manganas a Pie" : "Manganas a Caballo"
    }];
  }
  if (suerteId === "paso") {
    return [
      { ...identity, timerId: `timer_paso_3min:${scope}`, contextType: "timer_paso_3min", durationMs: 180000, label: "Paso: salida 3 min" },
      { ...identity, timerId: `timer_paso_1min:${scope}`, contextType: "timer_paso_1min", durationMs: 60000, label: "Paso: desmonte 1 min" }
    ];
  }
  const legacyRule = getTimerRuleForSource({ suerteId });
  return [{
    ...identity,
    timerId: `timer_${suerteId}:${scope}`,
    contextType: suerteId,
    durationMs: legacyRule.mode === "countdown" ? legacyRule.limitMs : 0,
    label: legacyRule.label || `Cronometro ${suerteId}`
  }];
}

export function selectOfficialTimerForContext(registry = {}, source = {}) {
  const definitions = buildOfficialTimerDefinitionsFromContext(source);
  const values = Array.isArray(registry) ? registry : Object.values(registry || {});
  for (const definition of definitions) {
    const timer = values.find((item) => item?.timerId === definition.timerId);
    if (timer) return normalizeOfficialTimerContext(timer, definition);
  }
  return null;
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

function assignOfficialTimerController(timer, controller, nowMs, leaseMs) {
  timer.controllerId = controller.controllerId;
  timer.controllerUid = controller.controllerUid;
  timer.controllerRole = controller.controllerRole;
  timer.controllerSessionId = controller.controllerSessionId;
  timer.controllerType = controller.controllerType;
  timer.controllerClaimedAt = new Date(nowMs).toISOString();
  timer.controllerLeaseExpiresAtMs = nowMs + normalizeLeaseMs(leaseMs);
}

function extendOfficialTimerLease(timer, nowMs, leaseMs) {
  timer.controllerLeaseExpiresAtMs = nowMs + normalizeLeaseMs(leaseMs);
}

function normalizeLeaseMs(value) {
  const parsed = Math.trunc(finiteNumber(value));
  return parsed > 0 ? Math.min(parsed, 5 * 60 * 1000) : OFFICIAL_TIMER_LEASE_MS;
}

function isOfficialTimerLeaseExpired(timer, nowMs) {
  return !timer.controllerLeaseExpiresAtMs || timer.controllerLeaseExpiresAtMs <= nowMs;
}

function normalizeOfficialTimerController(value = {}, actor = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const controller = {
    controllerId: nullableTimerId(value.controllerId || value.id || value.clientId),
    controllerUid: nullableTimerId(value.controllerUid || value.uid || actor?.uid || actor?.id),
    controllerRole: nullableTimerText(value.controllerRole || value.role, 120),
    controllerSessionId: nullableTimerId(value.controllerSessionId || value.sessionId || value.tabSessionId),
    controllerType: normalizeControllerType(value.controllerType || value.type)
  };
  return controller.controllerId ? controller : null;
}

function normalizeControllerType(value) {
  const type = String(value || "").trim().toLowerCase();
  return OFFICIAL_TIMER_CONTROLLER_TYPES.includes(type) ? type : null;
}

function isPrimaryTimerController(controller) {
  return ["field_remote", "web_remote"].includes(controller?.controllerType);
}

function isAuthorizedTakeoverController(controller) {
  return ["field_remote", "web_remote", "scorer_backup", "supervisor_backup", "system"].includes(controller?.controllerType);
}

function snapshotOfficialTimerController(timer = {}) {
  return normalizeOfficialTimerController({
    controllerId: timer.controllerId,
    controllerUid: timer.controllerUid,
    controllerRole: timer.controllerRole,
    controllerSessionId: timer.controllerSessionId,
    controllerType: timer.controllerType
  });
}

function getOfficialTimerControllerLabel(type) {
  if (["field_remote", "web_remote"].includes(type)) return "Juez de campo";
  if (type === "scorer_backup") return "Calificador de respaldo";
  if (type === "supervisor_backup") return "Supervisor de respaldo";
  if (type === "system") return "Sistema";
  if (type === "smartwatch") return "Smartwatch";
  if (type === "hardware_remote") return "Control fisico";
  return "Sin controlador";
}

function officialTimerStatusLabel(status) {
  if (status === "RUNNING") return "Tiempo en curso";
  if (status === "PAUSED") return "Tiempo pausado";
  if (status === "FINISHED") return "Tiempo finalizado";
  return "Listo para iniciar";
}

function normalizeCommandIds(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((item) => nullableTimerId(item))
    .filter(Boolean)))
    .slice(-50);
}

function appendCommandId(commandIds, commandId) {
  if (!commandId) return normalizeCommandIds(commandIds);
  return normalizeCommandIds([...(commandIds || []), commandId]);
}

function normalizeAuthorityAudit(value) {
  return (Array.isArray(value) ? value : []).slice(-100).map((item) => ({
    commandId: nullableTimerId(item?.commandId),
    operation: nullableTimerText(item?.operation, 80),
    controllerId: nullableTimerId(item?.controllerId),
    controllerType: normalizeControllerType(item?.controllerType),
    actorId: nullableTimerId(item?.actorId),
    issuedAt: normalizeIso(item?.issuedAt),
    acceptedAt: normalizeIso(item?.acceptedAt),
    fromRevision: Math.max(0, Math.trunc(finiteNumber(item?.fromRevision))),
    toRevision: Math.max(0, Math.trunc(finiteNumber(item?.toRevision))),
    result: nullableTimerText(item?.result, 80),
    reason: item?.reason === null || item?.reason === undefined ? null : normalizeTimerText(item.reason, 240)
  }));
}

function appendAuthorityAudit(audit, entry) {
  return normalizeAuthorityAudit([...(audit || []), entry]);
}

function normalizeTimerId(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9._:@/-]/g, "_").slice(0, 240);
}

function nullableTimerId(value) {
  const normalized = normalizeTimerId(value);
  return normalized || null;
}

function normalizeTimerText(value, maxLength = 500) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function nullableTimerText(value, maxLength = 500) {
  if (value === null || value === undefined) return null;
  const normalized = normalizeTimerText(value, maxLength);
  return normalized || null;
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
