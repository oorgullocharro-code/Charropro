import { resolveFmch2026PialesPreviousOpportunityTimerResolution } from "../data/fmch2026PialesColeaderoRules.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";
import {
  buildOfficialTimerDefinitionsFromContext,
  buildOfficialTimerProjection,
  createOfficialTimerContext,
  normalizeOfficialTimerContext
} from "./timerRules.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";

export const OFFICIAL_CURRENT_TIMER_CONTEXT_VERSION = "1.0.0";
export const TORO_TO_TERNA_HANDOFF = "TORO_TO_TERNA_READY";

export function resolveOfficialCurrentTimerContext(input = {}) {
  const source = input.source && typeof input.source === "object" ? input.source : {};
  const registry = normalizeRegistry(input.registry);
  const definitions = normalizeDefinitions(input.definitions || buildOfficialTimerDefinitionsFromContext(source));
  const projected = normalizeProjectedContext(input.currentTimerContext || source.currentTimerContext);
  const selectedDefinition = selectCurrentDefinition({ source, registry, definitions, projected });
  if (!selectedDefinition) return null;

  const registered = registry[selectedDefinition.timerId];
  const timer = registered
    ? normalizeOfficialTimerContext(registered, selectedDefinition)
    : selectedDefinition.contractVersion === OFFICIAL_CURRENT_TIMER_CONTEXT_VERSION
      ? normalizeOfficialTimerContext(selectedDefinition, selectedDefinition)
      : createOfficialTimerContext(selectedDefinition, { now: input.now ?? Date.now() });
  return buildOfficialCurrentTimerContext(timer, selectedDefinition, {
    now: input.now,
    sourceRevision: input.sourceRevision ?? resolveSourceRevision(source),
    contextRevision: input.contextRevision,
    transition: projected?.timerId === selectedDefinition.timerId ? projected.transition : input.transition,
    handoffFromTimerId: projected?.timerId === selectedDefinition.timerId
      ? projected.handoffFromTimerId
      : input.handoffFromTimerId
  });
}

export function buildOfficialCurrentTimerContext(timer = {}, definition = {}, options = {}) {
  const normalized = normalizeOfficialTimerContext(timer, definition);
  const projection = buildOfficialTimerProjection(normalized, { now: options.now ?? Date.now(), definition });
  const sourceRevision = nonNegativeInteger(options.sourceRevision ?? projection.sourceRevision);
  const contextRevision = nonNegativeInteger(options.contextRevision ?? Math.max(sourceRevision, normalized.revision));
  return {
    contractVersion: OFFICIAL_CURRENT_TIMER_CONTEXT_VERSION,
    timerId: normalized.timerId,
    timerDefinitionId: normalized.timerRuleId || normalized.contextType,
    tournamentId: normalized.tournamentId || null,
    competitionId: normalized.competitionId || null,
    charreadaId: normalized.charreadaId || null,
    ruleProfileId: normalized.ruleProfileId || null,
    ruleProfileVersion: normalized.ruleProfileVersion || null,
    ruleProfileFingerprint: normalized.ruleProfileFingerprint || null,
    temporalPolicyId: normalized.temporalPolicyId || null,
    temporalPolicyVersion: normalized.temporalPolicyVersion || null,
    temporalPolicyFingerprint: normalized.temporalFingerprint || null,
    phase: normalized.phaseId || normalized.contextType || null,
    phaseLabel: normalized.phaseLabel || null,
    suerteId: normalized.suerteId || null,
    suerteLabel: normalized.suerteLabel || normalized.label || null,
    teamId: normalized.teamId || null,
    teamName: normalized.teamName || null,
    participantId: normalized.participantId || null,
    participantName: normalized.participantName || null,
    horseId: normalized.horseId || null,
    horseName: normalized.horseName || null,
    attemptId: normalized.attemptId || null,
    attemptIndex: nonNegativeInteger(normalized.attemptIndex),
    opportunityIndex: nonNegativeInteger(normalized.opportunityIndex),
    coleadorIndex: nonNegativeInteger(normalized.coleadorIndex),
    durationMs: nonNegativeInteger(normalized.durationMs),
    mode: normalized.mode,
    status: normalized.status,
    startedAt: normalized.wallStartedAt,
    runningSince: normalized.runningSince,
    pausedAt: normalized.pausedAt,
    finishedAt: normalized.wallFinishedAt,
    elapsedMs: nonNegativeInteger(normalized.officialElapsedMs),
    remainingMs: projection.remainingMs,
    timerRevision: nonNegativeInteger(normalized.revision),
    sourceRevision,
    contextRevision,
    transition: cleanText(options.transition || null),
    handoffFromTimerId: cleanText(options.handoffFromTimerId || null),
    generatedAt: projection.generatedAt
  };
}

export function buildOfficialTimerProjectionFromCurrentContext(context = {}, options = {}) {
  const normalized = normalizeProjectedContext(context);
  if (!normalized?.timerId) return null;
  return buildOfficialTimerProjection({
    ...normalized,
    timerRuleId: normalized.timerDefinitionId,
    temporalFingerprint: normalized.temporalPolicyFingerprint,
    phaseId: normalized.phase,
    wallStartedAt: normalized.startedAt,
    wallFinishedAt: normalized.finishedAt,
    officialElapsedMs: normalized.elapsedMs,
    revision: normalized.timerRevision
  }, { now: options.now ?? Date.now() });
}

export function buildOfficialTimerSnapshotFromCurrentContext(context = {}, options = {}) {
  const normalized = normalizeProjectedContext(context);
  if (!normalized?.timerId) return null;
  const now = options.now ?? Date.now();
  return normalizeOfficialTimerContext({
    ...normalized,
    contextType: normalized.phase || normalized.timerDefinitionId || "official",
    timerRuleId: normalized.timerDefinitionId,
    temporalFingerprint: normalized.temporalPolicyFingerprint,
    phaseId: normalized.phase,
    wallStartedAt: normalized.startedAt,
    wallFinishedAt: normalized.finishedAt,
    officialElapsedMs: normalized.elapsedMs,
    revision: normalized.timerRevision,
    createdAt: normalized.createdAt || normalized.generatedAt || new Date(now).toISOString(),
    updatedAt: normalized.updatedAt || normalized.generatedAt || new Date(now).toISOString()
  });
}

export function reconcileOfficialTimerConsumerState(input = {}) {
  const previousContext = normalizeProjectedContext(input.currentTimerContext);
  const incomingContext = normalizeProjectedContext(input.incomingCurrentTimerContext);
  const registry = {
    ...normalizeRegistry(input.registry),
    ...normalizeRegistry(input.incomingRegistry)
  };
  const selectedContext = incomingContext || previousContext;
  const projectedSnapshot = incomingContext
    ? buildOfficialTimerSnapshotFromCurrentContext(incomingContext, input)
    : null;
  const registeredSnapshot = selectedContext ? registry[selectedContext.timerId] : null;
  const contextSnapshot = selectedContext
    ? selectFreshestTimerSnapshot(projectedSnapshot, registeredSnapshot)
      || buildOfficialTimerSnapshotFromCurrentContext(selectedContext, input)
    : null;
  if (contextSnapshot?.timerId) registry[contextSnapshot.timerId] = contextSnapshot;

  const currentTimerContext = contextSnapshot
    ? buildOfficialCurrentTimerContext(contextSnapshot, selectedContext, {
        now: input.now,
        sourceRevision: selectedContext?.sourceRevision,
        contextRevision: selectedContext?.contextRevision,
        transition: selectedContext?.transition,
        handoffFromTimerId: selectedContext?.handoffFromTimerId
      })
    : selectedContext;
  const timerIdChanged = cleanText(previousContext?.timerId) !== cleanText(currentTimerContext?.timerId);
  const timerRevisionChanged = nonNegativeInteger(previousContext?.timerRevision)
    !== nonNegativeInteger(currentTimerContext?.timerRevision);
  const statusChanged = cleanText(previousContext?.status) !== cleanText(currentTimerContext?.status);

  return {
    registry,
    currentTimerContext,
    timerIdChanged,
    timerRevisionChanged,
    statusChanged,
    changed: timerIdChanged || timerRevisionChanged || statusChanged
  };
}

function selectFreshestTimerSnapshot(projectedSnapshot, registeredSnapshot) {
  if (!projectedSnapshot) return registeredSnapshot || null;
  if (!registeredSnapshot) return projectedSnapshot;
  return nonNegativeInteger(projectedSnapshot.revision) >= nonNegativeInteger(registeredSnapshot.revision)
    ? projectedSnapshot
    : registeredSnapshot;
}

export function partitionOfficialTimerHistory(currentContext = {}, registry = {}) {
  const currentTimerId = cleanText(currentContext?.timerId);
  const historical = Object.values(normalizeRegistry(registry))
    .filter((timer) => timer.timerId !== currentTimerId)
    .sort((left, right) => timerFreshness(right) - timerFreshness(left));
  return {
    current: currentTimerId ? normalizeRegistry(registry)[currentTimerId] || null : null,
    historical
  };
}

export function resolvePreviousPialesOpportunity(input = {}) {
  const currentOpportunityIndex = nonNegativeInteger(input.currentOpportunityIndex);
  if (currentOpportunityIndex === 0) return "NO_EXTENSION";
  const attempts = Array.isArray(input.attempts) ? input.attempts : [];
  const previous = attempts[currentOpportunityIndex - 1];
  return resolveFmch2026PialesPreviousOpportunityTimerResolution(previous);
}

export function buildToroToTernaReadyDefinition(source = {}, finishedTimer = {}) {
  const turn = source.turn || {};
  const toro = normalizeOfficialTimerContext(finishedTimer);
  if (!isToroApretalamientoTimer(toro) || toro.status !== "FINISHED") return null;
  const ternaSource = {
    ...source,
    tournament: source.tournament || {
      id: toro.tournamentId,
      ruleProfileId: toro.ruleProfileId,
      ruleProfileVersion: toro.ruleProfileVersion,
      ruleProfileContentFingerprint: toro.ruleProfileFingerprint,
      temporalPolicyId: toro.temporalPolicyId,
      temporalPolicyVersion: toro.temporalPolicyVersion,
      temporalFingerprint: toro.temporalFingerprint
    },
    charreada: source.charreada || {
      id: toro.charreadaId,
      competitionId: toro.competitionId
    },
    turn: {
      ...turn,
      competition: turn.competition || { id: toro.competitionId, competitionId: toro.competitionId },
      team: turn.team || (toro.teamId ? { id: toro.teamId, name: toro.teamName } : null),
      participant: turn.participant || (toro.participantId ? { id: toro.participantId, name: toro.participantName } : null),
      suerte: {
        id: "lazo",
        name: "Lazo Cabecero",
        fullName: "Terna en el Ruedo",
        ruleResolution: turn.suerte?.ruleResolution || null
      },
      attemptIndex: 0,
      coleadorIndex: 0,
      previousOpportunityResolution: "NO_EXTENSION"
    }
  };
  const definition = buildOfficialTimerDefinitionsFromContext(ternaSource)
    .find((item) => item.timerRuleId === "fmch_2026_terna_shared_window" || item.suerteId === "terna");
  return definition ? {
    ...definition,
    handoffFromTimerId: toro.timerId,
    transition: TORO_TO_TERNA_HANDOFF,
    source: "official-timer-orchestration"
  } : null;
}

export function isToroApretalamientoTimer(timer = {}) {
  return timer.timerRuleId === "fmch_2026_toro_apretalamiento"
    || timer.contextType === "timer_toro_apretalamiento";
}

function selectCurrentDefinition({ source, registry, definitions, projected }) {
  if (projected?.timerId && projectedContextApplies(source, definitions, projected)) {
    const projectedDefinition = definitions.find((item) => item.timerId === projected.timerId);
    const projectedTimer = registry[projected.timerId] || projected;
    if (!projectedDefinition || normalizeOfficialTimerContext(projectedTimer, projectedDefinition).status !== "FINISHED") {
      return projectedDefinition || projected;
    }
  }
  if (!definitions.length) return null;

  const unfinishedIndex = definitions.findIndex((definition) => {
    const timer = registry[definition.timerId];
    return !timer || normalizeOfficialTimerContext(timer, definition).status !== "FINISHED";
  });
  return unfinishedIndex >= 0 ? definitions[unfinishedIndex] : definitions[definitions.length - 1];
}

function projectedContextApplies(source, definitions, projected) {
  if (definitions.some((definition) => definition.timerId === projected.timerId)) return true;
  if (projected.transition !== TORO_TO_TERNA_HANDOFF || projected.suerteId !== "terna") return false;
  const turn = source.turn || {};
  const sourceSuerteId = cleanText(turn.suerte?.id || source.suerteId);
  const sourceTeamId = cleanText(turn.team?.id || source.teamId);
  const sourceCharreadaId = cleanText(source.charreada?.id || source.charreadaId);
  return ["toro", "terna", "lazo", "pial_ruedo"].includes(sourceSuerteId)
    && (!sourceTeamId || sourceTeamId === projected.teamId)
    && (!sourceCharreadaId || sourceCharreadaId === projected.charreadaId);
}

function normalizeDefinitions(value) {
  return (Array.isArray(value) ? value : [])
    .filter((item) => item && typeof item === "object" && cleanText(item.timerId))
    .map((item) => ({ ...item, timerId: cleanText(item.timerId) }));
}

function normalizeRegistry(value) {
  const entries = Array.isArray(value)
    ? value.map((timer) => [timer?.timerId, timer])
    : Object.entries(value && typeof value === "object" ? value : {});
  return Object.fromEntries(entries
    .filter(([timerId, timer]) => cleanText(timerId) && timer && typeof timer === "object")
    .map(([timerId, timer]) => [cleanText(timerId), normalizeOfficialTimerContext(timer)]));
}

function normalizeProjectedContext(value) {
  if (!value || typeof value !== "object" || !cleanText(value.timerId)) return null;
  return {
    ...value,
    timerId: cleanText(value.timerId),
    timerDefinitionId: cleanText(value.timerDefinitionId),
    tournamentId: cleanText(value.tournamentId),
    competitionId: cleanText(value.competitionId),
    charreadaId: cleanText(value.charreadaId),
    teamId: cleanText(value.teamId),
    participantId: cleanText(value.participantId),
    suerteId: cleanText(value.suerteId),
    phase: cleanText(value.phase),
    phaseId: cleanText(value.phase),
    status: cleanText(value.status).toUpperCase() || "READY",
    wallStartedAt: value.startedAt || null,
    wallFinishedAt: value.finishedAt || null,
    officialElapsedMs: nonNegativeInteger(value.elapsedMs),
    revision: nonNegativeInteger(value.timerRevision),
    timerRuleId: cleanText(value.timerDefinitionId),
    temporalFingerprint: cleanText(value.temporalPolicyFingerprint),
    transition: cleanText(value.transition),
    handoffFromTimerId: cleanText(value.handoffFromTimerId)
  };
}

function resolveSourceRevision(source) {
  return nonNegativeInteger(
    source.broadcastContract?.revision
      ?? source.broadcastContext?.revision
      ?? source.currentTimerContext?.sourceRevision
      ?? source.timer?.sourceRevision
      ?? source.timer?.revision
      ?? 0
  );
}

function timerFreshness(timer) {
  return Date.parse(timer.updatedAt || timer.authorityAcceptedAt || timer.createdAt || "") || nonNegativeInteger(timer.revision);
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function cleanText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}
