import {
  applyBroadcastStatePatch,
  clearPreviewState,
  clearProgramState,
  cloneBroadcastState,
  dequeueBroadcastItem,
  enqueueBroadcastItem,
  getBroadcastQueue,
  promotePreviewToProgram,
  setBroadcastContextRef,
  setGraphicState,
  setLayerState,
  setOutputState,
  setPreviewState,
  validateBroadcastState
} from "./broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import {
  assignLayersToOutput,
  assignThemeToOutput,
  getBroadcastOutput,
  listBroadcastOutputs,
  setBroadcastOutputStatus,
  updateBroadcastOutput,
  updateBroadcastOutputHeartbeat
} from "./broadcastOutput.js?v=20260713-broadcast-output-001-output-v1";
import { getBroadcastAsset } from "./assetManager.js?v=20260713-asset-manager-001-assets-v1";
import { validateBroadcastDataContract } from "./dataContract.js?v=20260713-broadcast-output-001-output-v1";
import {
  expireProductionVariable,
  registerProductionVariable,
  resetProductionVariableValue,
  setProductionVariableValue,
  updateProductionVariable
} from "./productionVariables.js?v=20260713-production-variables-001-variables-v1";

export const BROADCAST_ACTION_ENGINE_VERSION = "1.1.0";

export const ACTION_TYPES = Object.freeze({
  SELECT_GRAPHIC: "SELECT_GRAPHIC",
  SET_SELECTION: "SET_SELECTION",
  PREPARE_PREVIEW: "PREPARE_PREVIEW",
  CLEAR_PREVIEW: "CLEAR_PREVIEW",
  TAKE: "TAKE",
  CUT: "CUT",
  AUTO: "AUTO",
  CLEAR_PROGRAM: "CLEAR_PROGRAM",
  SHOW_GRAPHIC: "SHOW_GRAPHIC",
  HIDE_GRAPHIC: "HIDE_GRAPHIC",
  HIDE_ALL: "HIDE_ALL",
  UPDATE_GRAPHIC: "UPDATE_GRAPHIC",
  SET_GRAPHIC_GEOMETRY: "SET_GRAPHIC_GEOMETRY",
  SET_GRAPHIC_LAYER: "SET_GRAPHIC_LAYER",
  SET_GRAPHIC_ASSET: "SET_GRAPHIC_ASSET",
  SET_GRAPHIC_OPACITY: "SET_GRAPHIC_OPACITY",
  SET_GRAPHIC_SCALE: "SET_GRAPHIC_SCALE",
  SET_OUTPUT: "SET_OUTPUT",
  UPDATE_OUTPUT: "UPDATE_OUTPUT",
  SET_OUTPUT_STATUS: "SET_OUTPUT_STATUS",
  SEND_HEARTBEAT: "SEND_HEARTBEAT",
  ASSIGN_LAYERS_TO_OUTPUT: "ASSIGN_LAYERS_TO_OUTPUT",
  ASSIGN_THEME_TO_OUTPUT: "ASSIGN_THEME_TO_OUTPUT",
  ENQUEUE_GRAPHIC: "ENQUEUE_GRAPHIC",
  DEQUEUE_GRAPHIC: "DEQUEUE_GRAPHIC",
  CLEAR_QUEUE: "CLEAR_QUEUE",
  SET_LAYER: "SET_LAYER",
  LOCK_LAYER: "LOCK_LAYER",
  UNLOCK_LAYER: "UNLOCK_LAYER",
  SHOW_LAYER: "SHOW_LAYER",
  HIDE_LAYER: "HIDE_LAYER",
  ACKNOWLEDGE_WARNING: "ACKNOWLEDGE_WARNING",
  ACKNOWLEDGE_ERROR: "ACKNOWLEDGE_ERROR",
  REGISTER_VARIABLE: "REGISTER_VARIABLE",
  SET_VARIABLE: "SET_VARIABLE",
  RESET_VARIABLE: "RESET_VARIABLE",
  DISABLE_VARIABLE: "DISABLE_VARIABLE",
  ENABLE_VARIABLE: "ENABLE_VARIABLE",
  EXPIRE_VARIABLE: "EXPIRE_VARIABLE"
});

export const ACTION_STATUSES = Object.freeze({
  CREATED: "created",
  VALIDATING: "validating",
  PENDING_CONFIRMATION: "pending_confirmation",
  CONFIRMED: "confirmed",
  EXECUTING: "executing",
  SUCCEEDED: "succeeded",
  PARTIALLY_SUCCEEDED: "partially_succeeded",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  FAILED: "failed",
  EXPIRED: "expired"
});

export const ACTION_MODES = Object.freeze({
  MANUAL: "manual",
  SEMIAUTOMATIC: "semiautomatic",
  AUTOMATIC: "automatic",
  SYSTEM: "system"
});

export const ACTION_CONFIRMATION_TYPES = Object.freeze({
  NONE: "none",
  SIMPLE: "simple",
  DESTRUCTIVE: "destructive",
  CRITICAL: "critical",
  DOUBLE_CONFIRMATION: "double_confirmation"
});

export const ACTION_RESULT_CODES = Object.freeze({
  SUCCEEDED: "action-succeeded",
  REJECTED: "action-rejected",
  CANCELLED: "action-cancelled",
  FAILED: "action-failed",
  CONFIRMATION_REQUIRED: "confirmation-required",
  INVALID_ACTION: "invalid-action",
  INVALID_PAYLOAD: "invalid-payload",
  INVALID_TARGET: "invalid-target",
  INVALID_ACTOR: "invalid-actor",
  OUTPUT_NOT_FOUND: "output-not-found",
  GRAPHIC_NOT_FOUND: "graphic-not-found",
  LAYER_NOT_FOUND: "layer-not-found",
  PREVIEW_NOT_READY: "preview-not-ready",
  PROGRAM_PROTECTED: "program-protected",
  STATE_REVISION_CONFLICT: "state-revision-conflict",
  ACTION_EXPIRED: "action-expired",
  IDEMPOTENCY_CONFLICT: "idempotency-conflict",
  PERMISSION_DENIED: "permission-denied",
  SAFE_MODE_BLOCKED: "safe-mode-blocked"
});

const ACTION_TYPE_VALUES = new Set(Object.values(ACTION_TYPES));
const ACTION_STATUS_VALUES = new Set(Object.values(ACTION_STATUSES));
const ACTION_MODE_VALUES = new Set(Object.values(ACTION_MODES));
const CONFIRMATION_VALUES = new Set(Object.values(ACTION_CONFIRMATION_TYPES));
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 14;
const MAX_ARRAY_LENGTH = 500;
const MAX_STORE_SIZE = 500;
const PROGRAM_ACTIONS = new Set([ACTION_TYPES.TAKE, ACTION_TYPES.CUT, ACTION_TYPES.AUTO, ACTION_TYPES.CLEAR_PROGRAM]);
const QUEUE_ACTIONS = new Set([ACTION_TYPES.ENQUEUE_GRAPHIC, ACTION_TYPES.DEQUEUE_GRAPHIC, ACTION_TYPES.CLEAR_QUEUE]);
const VARIABLE_ACTIONS = new Set([
  ACTION_TYPES.REGISTER_VARIABLE,
  ACTION_TYPES.SET_VARIABLE,
  ACTION_TYPES.RESET_VARIABLE,
  ACTION_TYPES.DISABLE_VARIABLE,
  ACTION_TYPES.ENABLE_VARIABLE,
  ACTION_TYPES.EXPIRE_VARIABLE
]);
const STATE_MUTATING_ACTIONS = new Set(Object.values(ACTION_TYPES).filter((type) => ![
  ACTION_TYPES.ACKNOWLEDGE_WARNING,
  ACTION_TYPES.ACKNOWLEDGE_ERROR,
  ...VARIABLE_ACTIONS
].includes(type)));
const ACTION_STORE = new Map();
const IDEMPOTENCY_STORE = new Map();
let actionSequence = 0;

const ALL_CURRENT_ACTIONS = Object.freeze([
  ACTION_TYPES.SELECT_GRAPHIC,
  ACTION_TYPES.SET_SELECTION,
  ACTION_TYPES.PREPARE_PREVIEW,
  ACTION_TYPES.CLEAR_PREVIEW,
  ACTION_TYPES.TAKE,
  ACTION_TYPES.CUT,
  ACTION_TYPES.AUTO,
  ACTION_TYPES.CLEAR_PROGRAM,
  ACTION_TYPES.SHOW_GRAPHIC,
  ACTION_TYPES.HIDE_GRAPHIC,
  ACTION_TYPES.HIDE_ALL,
  ACTION_TYPES.UPDATE_GRAPHIC,
  ACTION_TYPES.SET_GRAPHIC_GEOMETRY,
  ACTION_TYPES.SET_GRAPHIC_LAYER,
  ACTION_TYPES.SET_GRAPHIC_ASSET,
  ACTION_TYPES.SET_GRAPHIC_OPACITY,
  ACTION_TYPES.SET_GRAPHIC_SCALE,
  ACTION_TYPES.SET_OUTPUT,
  ACTION_TYPES.UPDATE_OUTPUT,
  ACTION_TYPES.SET_OUTPUT_STATUS,
  ACTION_TYPES.SEND_HEARTBEAT,
  ACTION_TYPES.ASSIGN_LAYERS_TO_OUTPUT,
  ACTION_TYPES.ASSIGN_THEME_TO_OUTPUT,
  ACTION_TYPES.ENQUEUE_GRAPHIC,
  ACTION_TYPES.DEQUEUE_GRAPHIC,
  ACTION_TYPES.CLEAR_QUEUE,
  ACTION_TYPES.SET_LAYER,
  ACTION_TYPES.LOCK_LAYER,
  ACTION_TYPES.UNLOCK_LAYER,
  ACTION_TYPES.SHOW_LAYER,
  ACTION_TYPES.HIDE_LAYER,
  ACTION_TYPES.ACKNOWLEDGE_WARNING,
  ACTION_TYPES.ACKNOWLEDGE_ERROR,
  ...VARIABLE_ACTIONS
]);
const GRAPHICS_ACTIONS = Object.freeze([
  ACTION_TYPES.SELECT_GRAPHIC,
  ACTION_TYPES.SET_SELECTION,
  ACTION_TYPES.PREPARE_PREVIEW,
  ACTION_TYPES.CLEAR_PREVIEW,
  ACTION_TYPES.TAKE,
  ACTION_TYPES.CUT,
  ACTION_TYPES.AUTO,
  ACTION_TYPES.CLEAR_PROGRAM,
  ACTION_TYPES.SHOW_GRAPHIC,
  ACTION_TYPES.HIDE_GRAPHIC,
  ACTION_TYPES.HIDE_ALL,
  ACTION_TYPES.UPDATE_GRAPHIC,
  ACTION_TYPES.SET_GRAPHIC_GEOMETRY,
  ACTION_TYPES.SET_GRAPHIC_LAYER,
  ACTION_TYPES.SET_GRAPHIC_ASSET,
  ACTION_TYPES.SET_GRAPHIC_OPACITY,
  ACTION_TYPES.SET_GRAPHIC_SCALE,
  ACTION_TYPES.SET_OUTPUT,
  ACTION_TYPES.SEND_HEARTBEAT,
  ACTION_TYPES.ENQUEUE_GRAPHIC,
  ACTION_TYPES.DEQUEUE_GRAPHIC,
  ACTION_TYPES.CLEAR_QUEUE,
  ACTION_TYPES.SET_LAYER,
  ACTION_TYPES.LOCK_LAYER,
  ACTION_TYPES.UNLOCK_LAYER,
  ACTION_TYPES.SHOW_LAYER,
  ACTION_TYPES.HIDE_LAYER
]);
const ROLE_CAPABILITIES = Object.freeze({
  supervisor: new Set(ALL_CURRENT_ACTIONS),
  operador: new Set([...ALL_CURRENT_ACTIONS.filter((type) => !VARIABLE_ACTIONS.has(type)), ACTION_TYPES.SET_VARIABLE, ACTION_TYPES.RESET_VARIABLE, ACTION_TYPES.DISABLE_VARIABLE, ACTION_TYPES.ENABLE_VARIABLE]),
  graficos: new Set([...GRAPHICS_ACTIONS, ACTION_TYPES.SET_VARIABLE, ACTION_TYPES.RESET_VARIABLE]),
  locutor: new Set([ACTION_TYPES.SELECT_GRAPHIC, ACTION_TYPES.SET_SELECTION]),
  juez: new Set(),
  lectura: new Set(),
  system: new Set([ACTION_TYPES.SEND_HEARTBEAT, ACTION_TYPES.ACKNOWLEDGE_WARNING, ACTION_TYPES.ACKNOWLEDGE_ERROR, ACTION_TYPES.EXPIRE_VARIABLE])
});

export class BroadcastActionError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastActionError";
    this.code = code;
    this.details = cloneSerializable(details, [], "error.details") || {};
  }
}

export function createBroadcastAction(actionType, payload = {}, options = {}) {
  const source = isRecord(actionType) ? actionType : { ...options, actionType, payload };
  const now = normalizeIsoDate(options.now ?? source.createdAt) || new Date().toISOString();
  const action = normalizeBroadcastAction({
    ...source,
    actionId: source.actionId || buildActionId(now, options.random),
    createdAt: source.createdAt || now,
    status: source.status || ACTION_STATUSES.CREATED
  }, { ...options, now });
  const validation = validateBroadcastAction(action, options.context);
  if (!validation.valid && options.allowInvalid !== true) {
    throw new BroadcastActionError(ACTION_RESULT_CODES.INVALID_ACTION, { errors: validation.errors });
  }
  return action;
}

export function normalizeBroadcastAction(input = {}, options = {}) {
  const warnings = [];
  const raw = cloneSerializable(isRecord(input) ? input : {}, warnings, "action") || {};
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const actor = normalizeActor(options.actor || raw.actor);
  const context = normalizeActionReference(raw.context, options.context);
  const confirmation = normalizeConfirmation(raw.confirmation);
  return {
    actionEngineVersion: BROADCAST_ACTION_ENGINE_VERSION,
    actionId: normalizeId(raw.actionId),
    sequence: nonNegativeInteger(raw.sequence, 0),
    actionType: normalizeEnum(raw.actionType, ACTION_TYPE_VALUES, null),
    status: normalizeEnum(raw.status, ACTION_STATUS_VALUES, ACTION_STATUSES.CREATED),
    mode: normalizeEnum(raw.mode, ACTION_MODE_VALUES, ACTION_MODES.MANUAL),
    target: safeRecord(raw.target),
    payload: stripControlledPayloadFields(safeRecord(raw.payload)),
    actor,
    context,
    permissions: uniqueStrings(raw.permissions),
    confirmation,
    preconditions: normalizePreconditions(raw.preconditions),
    correlationId: normalizeId(raw.correlationId),
    causationId: normalizeId(raw.causationId),
    idempotencyKey: normalizeId(raw.idempotencyKey),
    createdAt: normalizeIsoDate(raw.createdAt) || now,
    validatedAt: normalizeIsoDate(raw.validatedAt),
    confirmedAt: normalizeIsoDate(raw.confirmedAt),
    executedAt: normalizeIsoDate(raw.executedAt),
    completedAt: normalizeIsoDate(raw.completedAt),
    expiresAt: normalizeIsoDate(raw.expiresAt),
    result: isRecord(raw.result) ? safeRecord(raw.result) : null,
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...warnings]),
    errors: uniqueStrings(raw.errors),
    audit: safeRecord(raw.audit)
  };
}

export function validateBroadcastAction(actionInput, contextInput = null) {
  const action = normalizeBroadcastAction(actionInput, { context: contextInput });
  const errors = [];
  const warnings = [...action.warnings];
  if (!action.actionId) errors.push("action-id-required");
  if (!ACTION_TYPE_VALUES.has(action.actionType)) errors.push("action-type-invalid");
  if (!ACTION_STATUS_VALUES.has(action.status)) errors.push("action-status-invalid");
  if (!ACTION_MODE_VALUES.has(action.mode)) errors.push("action-mode-invalid");
  if (!isRecord(action.target)) errors.push("action-target-invalid");
  if (!isRecord(action.payload)) errors.push("action-payload-invalid");
  if (containsDangerousKey(action)) errors.push("action-dangerous-key-present");
  if (!isIsoDate(action.createdAt)) errors.push("action-created-at-invalid");
  if (action.expiresAt && Date.parse(action.expiresAt) <= Date.parse(resolveNow(contextInput))) errors.push("action-expired");
  if ((PROGRAM_ACTIONS.has(action.actionType) || (QUEUE_ACTIONS.has(action.actionType) && action.mode !== ACTION_MODES.SYSTEM)) && !action.actor?.id) {
    errors.push("action-actor-required");
  }
  if (action.actor?.role && !ROLE_CAPABILITIES[action.actor.role]) warnings.push(`actor-role-unrecognized:${action.actor.role}`);
  validateActionTargetAndPayload(action, contextInput, errors, warnings);
  if (contextInput) {
    const contextValidation = validateBroadcastActionContext(contextInput);
    errors.push(...contextValidation.errors);
    warnings.push(...contextValidation.warnings);
  }
  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    actionType: action.actionType
  };
}

export function createBroadcastActionContext(input = {}, options = {}) {
  const source = isRecord(input) ? input : {};
  const now = normalizeIsoDate(options.now ?? source.now) || new Date().toISOString();
  const state = source.state ? cloneBroadcastState(source.state) : null;
  const contract = cloneSerializable(source.contract, [], "context.contract") || null;
  const outputs = normalizeOutputRegistry(source.outputs ?? source.outputRegistry);
  const assets = cloneSerializable(source.assets ?? source.assetRegistry, [], "context.assets") || {};
  const variables = cloneSerializable(source.variables ?? source.variableRegistry, [], "context.variables") || {};
  const actor = normalizeActor(options.actor || source.actor);
  return {
    state,
    contract,
    outputs,
    assets,
    variables,
    visibility: normalizeVisibility(source.visibility),
    safeMode: source.safeMode !== false,
    actor,
    expectedRevision: integerOrNull(options.expectedRevision ?? source.expectedRevision ?? state?.revision),
    now,
    confirmations: normalizeConfirmations(source.confirmations),
    tenantId: normalizeId(source.tenantId ?? contract?.tenant?.id ?? state?.session?.tenantId),
    organizationId: normalizeId(source.organizationId ?? contract?.organization?.id),
    tournamentId: normalizeId(source.tournamentId ?? contract?.tournament?.id ?? state?.session?.tournamentId),
    competitionId: normalizeId(source.competitionId ?? contract?.competition?.id ?? state?.session?.competitionId),
    charreadaId: normalizeId(source.charreadaId ?? contract?.charreada?.id),
    outputIds: uniqueStrings(source.outputIds?.length ? source.outputIds : Object.keys(outputs)),
    contractRevision: integerOrNull(source.contractRevision ?? contract?.revision),
    metadata: safeRecord(source.metadata)
  };
}

export function validateBroadcastActionContext(contextInput) {
  const errors = [];
  const warnings = [];
  if (!isRecord(contextInput)) return { valid: false, errors: ["action-context-required"], warnings };
  const context = createBroadcastActionContext(contextInput, { now: contextInput.now });
  if (!context.state) errors.push("action-context-state-required");
  else {
    const stateValidation = validateBroadcastState(context.state);
    if (!stateValidation.valid) errors.push(...stateValidation.errors.map((error) => `state:${error}`));
    warnings.push(...stateValidation.warnings.map((warning) => `state:${warning}`));
  }
  if (context.contract) {
    const contractValidation = validateBroadcastDataContract(context.contract);
    if (!contractValidation.valid) errors.push(...contractValidation.errors.map((error) => `contract:${error}`));
    warnings.push(...contractValidation.warnings.map((warning) => `contract:${warning}`));
  }
  if (context.expectedRevision !== null && (!Number.isInteger(context.expectedRevision) || context.expectedRevision < 0)) {
    errors.push("expected-revision-invalid");
  }
  return { valid: errors.length === 0, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings) };
}

export function dispatchBroadcastAction(actionInput, contextInput, options = {}) {
  const context = createBroadcastActionContext(contextInput, options);
  const now = resolveNow(context, options);
  let action = normalizeBroadcastAction(actionInput, { context, actor: context.actor || actionInput?.actor, now });
  action = withActionStatus(action, ACTION_STATUSES.VALIDATING, { validatedAt: now });
  const revisionBefore = context.state?.revision ?? null;

  if (action.idempotencyKey) {
    const previous = IDEMPOTENCY_STORE.get(action.idempotencyKey);
    const fingerprint = actionFingerprint(action);
    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return rejectedDispatch(action, context, ACTION_RESULT_CODES.IDEMPOTENCY_CONFLICT, ["idempotency-key-payload-mismatch"], now);
      }
      return cloneDispatchResult(previous.dispatch);
    }
  }

  const validation = validateBroadcastAction(action, context);
  if (!validation.valid) {
    const expired = validation.errors.includes("action-expired");
    const code = expired ? ACTION_RESULT_CODES.ACTION_EXPIRED : mapValidationCode(validation.errors);
    return rejectedDispatch(action, context, code, validation.errors, now, expired ? ACTION_STATUSES.EXPIRED : ACTION_STATUSES.REJECTED);
  }

  const permission = canExecuteBroadcastAction(action, context);
  if (!permission.allowed) return rejectedDispatch(action, context, ACTION_RESULT_CODES.PERMISSION_DENIED, [permission.reason], now);

  const preconditionErrors = evaluatePreconditions(action, context);
  if (preconditionErrors.length) return rejectedDispatch(action, context, mapPreconditionCode(preconditionErrors), preconditionErrors, now);

  if (STATE_MUTATING_ACTIONS.has(action.actionType) && context.expectedRevision !== null && context.expectedRevision !== revisionBefore) {
    return rejectedDispatch(action, context, ACTION_RESULT_CODES.STATE_REVISION_CONFLICT, [
      `expected:${context.expectedRevision}`,
      `actual:${revisionBefore}`
    ], now);
  }

  const requiredConfirmation = requiresBroadcastActionConfirmation(action, context);
  if (requiredConfirmation.required && !confirmationSatisfied(action.confirmation, requiredConfirmation)) {
    action = withActionStatus(action, ACTION_STATUSES.PENDING_CONFIRMATION, {
      confirmation: {
        ...action.confirmation,
        required: true,
        type: requiredConfirmation.type,
        reason: requiredConfirmation.reason,
        requiredCount: requiredConfirmation.requiredCount
      }
    });
    const dispatch = buildDispatchEnvelope(action, context, buildActionResult(action, {
      code: ACTION_RESULT_CODES.CONFIRMATION_REQUIRED,
      success: false,
      startedAt: now,
      completedAt: now,
      stateRevisionBefore: revisionBefore,
      stateRevisionAfter: revisionBefore,
      warnings: [requiredConfirmation.reason]
    }));
    storeAction(action);
    return dispatch;
  }

  action = withActionStatus(action, action.confirmation.confirmed ? ACTION_STATUSES.CONFIRMED : ACTION_STATUSES.EXECUTING, {
    executedAt: now
  });
  try {
    const execution = executeBroadcastAction(action, context, { ...options, now });
    const result = buildActionResult(action, {
      code: ACTION_RESULT_CODES.SUCCEEDED,
      success: true,
      startedAt: now,
      completedAt: resolveNow(context, options),
      stateRevisionBefore: revisionBefore,
      stateRevisionAfter: execution.state?.revision ?? revisionBefore,
      outputIds: execution.outputIds,
      warnings: execution.warnings,
      errors: execution.errors,
      data: execution.data
    });
    action = withActionStatus(action, execution.partial ? ACTION_STATUSES.PARTIALLY_SUCCEEDED : ACTION_STATUSES.SUCCEEDED, {
      completedAt: result.completedAt,
      result,
      warnings: uniqueStrings([...action.warnings, ...result.warnings]),
      errors: uniqueStrings([...action.errors, ...result.errors])
    });
    const auditEntry = buildBroadcastActionAuditEntry(action, result, context);
    action = { ...action, audit: auditEntry };
    const dispatch = buildDispatchEnvelope(action, context, result, execution, auditEntry);
    storeSuccessfulDispatch(action, dispatch);
    return dispatch;
  } catch (error) {
    const code = mapExecutionError(error);
    const errors = uniqueStrings([error?.code || error?.message || "action-execution-failed"]);
    const result = buildActionResult(action, {
      code,
      success: false,
      startedAt: now,
      completedAt: resolveNow(context, options),
      stateRevisionBefore: revisionBefore,
      stateRevisionAfter: revisionBefore,
      errors
    });
    action = withActionStatus(action, ACTION_STATUSES.FAILED, { completedAt: result.completedAt, result, errors });
    const auditEntry = buildBroadcastActionAuditEntry(action, result, context);
    action = { ...action, audit: auditEntry };
    const dispatch = buildDispatchEnvelope(action, context, result, {}, auditEntry);
    storeAction(action);
    return dispatch;
  }
}

export function executeBroadcastAction(actionInput, contextInput, options = {}) {
  const context = createBroadcastActionContext(contextInput, options);
  const action = normalizeBroadcastAction(actionInput, { context, actor: context.actor || actionInput?.actor, now: options.now });
  const actor = action.actor;
  const now = resolveNow(context, options);
  let state = cloneBroadcastState(context.state);
  let variables = cloneSerializable(context.variables, [], "execution.variables") || {};
  const outputIds = new Set();
  let data = {};
  const stateOptions = { now, actor, force: action.payload.force === true };

  switch (action.actionType) {
    case ACTION_TYPES.SELECT_GRAPHIC:
      state = applyBroadcastStatePatch(state, { selection: selectionPatch(action, now) }, stateOptions);
      data = { graphicId: action.target.graphicId || action.payload.graphicId };
      break;
    case ACTION_TYPES.SET_SELECTION:
      state = applyBroadcastStatePatch(state, { selection: safeRecord(action.payload.selection || action.payload) }, stateOptions);
      if (action.payload.contextRef) state = setBroadcastContextRef(state, action.payload.contextRef, stateOptions);
      if (action.payload.clearPreview === true) state = clearPreviewState(state, stateOptions);
      data = safeRecord(action.payload.model || action.payload.selection || action.payload);
      break;
    case ACTION_TYPES.PREPARE_PREVIEW:
      ({ state, data } = executePreparePreview(state, action, stateOptions));
      break;
    case ACTION_TYPES.CLEAR_PREVIEW:
      state = clearPreviewState(state, stateOptions);
      break;
    case ACTION_TYPES.TAKE:
    case ACTION_TYPES.CUT:
    case ACTION_TYPES.AUTO:
      state = promotePreviewToProgram(state, { ...stateOptions, mode: action.actionType.toLowerCase() });
      for (const outputId of uniqueStrings(action.target.outputIds?.length ? action.target.outputIds : state.program.outputIds)) {
        const current = requireOutput(outputId);
        const output = updateBroadcastOutput(outputId, {
          lastAppliedRevision: state.program.revision,
          lastAppliedAt: now
        }, { now, actor, expectedRevision: current.revision });
        state = setOutputState(state, outputId, output, stateOptions);
        outputIds.add(outputId);
      }
      data = { mode: action.actionType.toLowerCase(), programRevision: state.program.revision };
      break;
    case ACTION_TYPES.CLEAR_PROGRAM:
      state = clearProgramState(state, stateOptions);
      break;
    case ACTION_TYPES.SHOW_GRAPHIC:
    case ACTION_TYPES.HIDE_GRAPHIC:
    case ACTION_TYPES.UPDATE_GRAPHIC:
    case ACTION_TYPES.SET_GRAPHIC_GEOMETRY:
    case ACTION_TYPES.SET_GRAPHIC_LAYER:
    case ACTION_TYPES.SET_GRAPHIC_ASSET:
    case ACTION_TYPES.SET_GRAPHIC_OPACITY:
    case ACTION_TYPES.SET_GRAPHIC_SCALE:
      ({ state, data } = executeGraphicAction(state, action, context, stateOptions));
      break;
    case ACTION_TYPES.HIDE_ALL:
      ({ state, data } = executeHideAll(state, action, stateOptions));
      break;
    case ACTION_TYPES.SET_OUTPUT:
      state = applyBroadcastStatePatch(state, { selection: { outputIds: [requiredTargetId(action, "outputId")] } }, stateOptions);
      data = { outputId: action.target.outputId };
      break;
    case ACTION_TYPES.UPDATE_OUTPUT:
    case ACTION_TYPES.SET_OUTPUT_STATUS:
    case ACTION_TYPES.SEND_HEARTBEAT:
    case ACTION_TYPES.ASSIGN_LAYERS_TO_OUTPUT:
    case ACTION_TYPES.ASSIGN_THEME_TO_OUTPUT:
      ({ state, data } = executeOutputAction(state, action, stateOptions));
      outputIds.add(data.outputId);
      break;
    case ACTION_TYPES.ENQUEUE_GRAPHIC:
      ({ state, data } = executeEnqueue(state, action, stateOptions));
      break;
    case ACTION_TYPES.DEQUEUE_GRAPHIC:
      state = dequeueBroadcastItem(state, { ...stateOptions, queueItemId: action.target.queueItemId || action.payload.queueItemId });
      data = { queueItemId: action.target.queueItemId || action.payload.queueItemId };
      break;
    case ACTION_TYPES.CLEAR_QUEUE:
      for (const item of getBroadcastQueue(state)) state = dequeueBroadcastItem(state, { ...stateOptions, queueItemId: item.queueItemId });
      data = { cleared: true };
      break;
    case ACTION_TYPES.SET_LAYER:
    case ACTION_TYPES.LOCK_LAYER:
    case ACTION_TYPES.UNLOCK_LAYER:
    case ACTION_TYPES.SHOW_LAYER:
    case ACTION_TYPES.HIDE_LAYER:
      ({ state, data } = executeLayerAction(state, action, stateOptions));
      break;
    case ACTION_TYPES.ACKNOWLEDGE_WARNING:
    case ACTION_TYPES.ACKNOWLEDGE_ERROR:
      data = { acknowledgedId: action.target.warningId || action.target.errorId || action.payload.id || null };
      break;
    case ACTION_TYPES.REGISTER_VARIABLE:
    case ACTION_TYPES.SET_VARIABLE:
    case ACTION_TYPES.RESET_VARIABLE:
    case ACTION_TYPES.DISABLE_VARIABLE:
    case ACTION_TYPES.ENABLE_VARIABLE:
    case ACTION_TYPES.EXPIRE_VARIABLE:
      ({ variables, data } = executeVariableAction(variables, action, { now, actor }));
      break;
    default:
      throw new BroadcastActionError(ACTION_RESULT_CODES.INVALID_ACTION, { actionType: action.actionType });
  }

  return {
    state,
    outputs: currentOutputMap(context.outputIds),
    assets: cloneSerializable(context.assets, [], "execution.assets") || {},
    variables: cloneSerializable(variables, [], "execution.variables") || {},
    outputIds: uniqueStrings([...outputIds]),
    data: cloneSerializable(data, [], "execution.data") || {},
    warnings: [],
    errors: [],
    partial: false
  };
}

export function canExecuteBroadcastAction(actionInput, contextInput = {}) {
  const context = createBroadcastActionContext(contextInput);
  const action = normalizeBroadcastAction(actionInput, { context, actor: context.actor || actionInput?.actor });
  const role = normalizeRole(action.actor?.role);
  if (!role || !ROLE_CAPABILITIES[role]) return { allowed: false, role, reason: "actor-role-not-authorized" };
  if (action.mode === ACTION_MODES.SYSTEM && role !== "system") {
    return { allowed: false, role, reason: "system-mode-requires-system-actor" };
  }
  const allowed = ROLE_CAPABILITIES[role].has(action.actionType);
  if (!allowed) return { allowed: false, role, reason: `action-not-allowed-for-role:${role}` };
  if (role === "locutor" && action.actionType === ACTION_TYPES.SET_SELECTION
    && (action.payload.clearPreview === true || isRecord(action.payload.contextRef))) {
    return { allowed: false, role, reason: "locutor-selection-must-remain-local" };
  }
  return { allowed: true, role, reason: null };
}

export function requiresBroadcastActionConfirmation(actionInput, contextInput = {}) {
  const context = createBroadcastActionContext(contextInput);
  const action = normalizeBroadcastAction(actionInput, { context, actor: context.actor || actionInput?.actor });
  let type = ACTION_CONFIRMATION_TYPES.NONE;
  let reason = null;
  if ([ACTION_TYPES.TAKE, ACTION_TYPES.AUTO, ACTION_TYPES.HIDE_ALL, ACTION_TYPES.CLEAR_QUEUE].includes(action.actionType)) {
    type = ACTION_CONFIRMATION_TYPES.SIMPLE;
    reason = "operational-confirmation-required";
  }
  if (action.actionType === ACTION_TYPES.CUT && context.safeMode) {
    type = ACTION_CONFIRMATION_TYPES.SIMPLE;
    reason = "safe-mode-cut-confirmation-required";
  }
  if (action.actionType === ACTION_TYPES.CLEAR_PROGRAM || (PROGRAM_ACTIONS.has(action.actionType) && context.state?.program?.active)) {
    type = ACTION_CONFIRMATION_TYPES.DESTRUCTIVE;
    reason = action.actionType === ACTION_TYPES.CLEAR_PROGRAM ? "program-clear-confirmation-required" : "program-replace-confirmation-required";
  }
  const layerId = action.target.layerId || action.payload.layerId;
  const protectedLayer = layerId === "emergency" || context.state?.layers?.[layerId]?.locked === true;
  if (action.actionType === ACTION_TYPES.UNLOCK_LAYER && protectedLayer) {
    type = layerId === "emergency" ? ACTION_CONFIRMATION_TYPES.CRITICAL : ACTION_CONFIRMATION_TYPES.DESTRUCTIVE;
    reason = "protected-layer-confirmation-required";
  }
  if (action.payload.force === true && (layerId === "emergency" || context.state?.program?.emergencyMode)) {
    type = ACTION_CONFIRMATION_TYPES.DOUBLE_CONFIRMATION;
    reason = "emergency-force-double-confirmation-required";
  } else if (action.payload.force === true && protectedLayer) {
    type = ACTION_CONFIRMATION_TYPES.CRITICAL;
    reason = "locked-layer-force-confirmation-required";
  }
  const requiredCount = type === ACTION_CONFIRMATION_TYPES.DOUBLE_CONFIRMATION ? 2 : type === ACTION_CONFIRMATION_TYPES.NONE ? 0 : 1;
  return { required: requiredCount > 0, type, reason, requiredCount };
}

export function confirmBroadcastAction(actionInput, confirmation = {}, options = {}) {
  const action = normalizeBroadcastAction(actionInput, { context: options.context, actor: actionInput?.actor, now: options.now });
  if (![ACTION_STATUSES.CREATED, ACTION_STATUSES.VALIDATING, ACTION_STATUSES.PENDING_CONFIRMATION, ACTION_STATUSES.CONFIRMED].includes(action.status)) {
    throw new BroadcastActionError("action-confirmation-status-invalid", { status: action.status });
  }
  const requirement = requiresBroadcastActionConfirmation(action, options.context || {});
  const type = normalizeEnum(confirmation.type, CONFIRMATION_VALUES, requirement.type);
  if (requirement.required && type !== requirement.type) throw new BroadcastActionError("action-confirmation-type-invalid", { expected: requirement.type, received: type });
  const actor = normalizeActor(options.actor || confirmation.actor || action.actor);
  if (!actor?.id) throw new BroadcastActionError(ACTION_RESULT_CODES.INVALID_ACTOR);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const confirmations = [...action.confirmation.confirmations, {
    confirmationId: normalizeId(confirmation.confirmationId) || `confirm_${Date.parse(now)}_${action.confirmation.confirmations.length + 1}`,
    type,
    actorId: actor.id,
    at: now
  }];
  const requiredCount = requirement.requiredCount || 0;
  const confirmed = confirmations.length >= requiredCount;
  return normalizeBroadcastAction({
    ...action,
    status: confirmed ? ACTION_STATUSES.CONFIRMED : ACTION_STATUSES.PENDING_CONFIRMATION,
    confirmedAt: confirmed ? now : null,
    confirmation: {
      required: requirement.required,
      type,
      reason: requirement.reason,
      requiredCount,
      confirmed,
      confirmations
    }
  }, { now });
}

export function rejectBroadcastAction(actionInput, reason = "action-rejected", options = {}) {
  return finishWithoutExecution(actionInput, ACTION_STATUSES.REJECTED, ACTION_RESULT_CODES.REJECTED, reason, options);
}

export function cancelBroadcastAction(actionInput, reason = "action-cancelled", options = {}) {
  return finishWithoutExecution(actionInput, ACTION_STATUSES.CANCELLED, ACTION_RESULT_CODES.CANCELLED, reason, options);
}

export function getBroadcastAction(actionId) {
  const id = normalizeId(actionId);
  return id && ACTION_STORE.has(id) ? cloneBroadcastAction(ACTION_STORE.get(id)) : null;
}

export function listBroadcastActions(filter = {}) {
  const safeFilter = isRecord(filter) ? filter : {};
  return [...ACTION_STORE.values()]
    .filter((action) => !safeFilter.actionType || action.actionType === safeFilter.actionType)
    .filter((action) => !safeFilter.status || action.status === safeFilter.status)
    .filter((action) => !safeFilter.actorId || action.actor?.id === safeFilter.actorId)
    .filter((action) => !safeFilter.correlationId || action.correlationId === safeFilter.correlationId)
    .sort((left, right) => right.sequence - left.sequence)
    .map((action) => cloneBroadcastAction(action));
}

export function getBroadcastActionWarnings(actionInput, contextInput = {}) {
  const action = normalizeBroadcastAction(actionInput, { context: contextInput });
  const warnings = [...action.warnings];
  const validation = validateBroadcastAction(action, contextInput);
  warnings.push(...validation.warnings);
  if (!action.idempotencyKey) warnings.push("idempotency-key-not-provided");
  if (PROGRAM_ACTIONS.has(action.actionType) && !action.actor?.id) warnings.push("program-actor-missing");
  if (action.expiresAt && Date.parse(action.expiresAt) - Date.parse(resolveNow(contextInput)) < 30000) warnings.push("action-expiring-soon");
  return uniqueStrings(warnings);
}

export function buildBroadcastActionAuditEntry(actionInput, resultInput, contextInput = {}) {
  const action = normalizeBroadcastAction(actionInput, { context: contextInput });
  const result = getBroadcastActionResult(resultInput) || safeRecord(resultInput);
  const timestamp = result.completedAt || resolveNow(contextInput);
  return {
    auditId: `audit_${action.actionId}`,
    actionId: action.actionId,
    actionType: action.actionType,
    actor: action.actor ? {
      id: action.actor.id,
      name: action.actor.name,
      role: action.actor.role,
      source: action.actor.source,
      visibility: action.actor.visibility
    } : null,
    timestamp,
    mode: action.mode,
    target: safeRecord(action.target),
    outputIds: uniqueStrings(result.outputIds),
    stateRevisionBefore: result.stateRevisionBefore ?? null,
    stateRevisionAfter: result.stateRevisionAfter ?? null,
    resultCode: result.code || ACTION_RESULT_CODES.FAILED,
    success: result.success === true,
    confirmation: {
      type: action.confirmation.type,
      confirmed: action.confirmation.confirmed,
      count: action.confirmation.confirmations.length
    },
    correlationId: action.correlationId,
    causationId: action.causationId,
    idempotencyKey: action.idempotencyKey,
    warnings: uniqueStrings(result.warnings),
    errors: uniqueStrings(result.errors)
  };
}

export function cloneBroadcastAction(action) {
  return cloneSerializable(action, [], "action.clone") || {};
}

export function getBroadcastActionResult(value) {
  if (isRecord(value?.result)) return cloneSerializable(value.result, [], "result") || null;
  if (isRecord(value) && typeof value.code === "string" && typeof value.success === "boolean") return cloneSerializable(value, [], "result") || null;
  return null;
}

function executePreparePreview(state, action, options) {
  const graphicId = requiredTargetId(action, "graphicId");
  const layerId = normalizeId(action.target.layerId || action.payload.layerId || action.payload.graphicState?.layerId);
  if (!layerId || !state.layers[layerId]) throw new BroadcastActionError(ACTION_RESULT_CODES.LAYER_NOT_FOUND, { layerId });
  const currentLayer = state.layers[layerId];
  const force = action.payload.force === true;
  if (currentLayer.locked && !force) throw new BroadcastActionError(ACTION_RESULT_CODES.PROGRAM_PROTECTED, { layerId });
  state = setGraphicState(state, graphicId, action.payload.graphicState || {}, { ...options, force });
  state = setLayerState(state, layerId, action.payload.layerState || {
    visible: true,
    graphicIds: [graphicId],
    outputIds: action.target.outputIds || [],
    status: "visible"
  }, { ...options, force });
  state = setPreviewState(state, action.payload.previewState || {}, { ...options, replace: action.payload.replace === true });
  return { state, data: { graphicId, layerId } };
}

function executeGraphicAction(state, action, context, options) {
  const graphicId = requiredTargetId(action, "graphicId");
  const current = state.graphics[graphicId];
  if (!current) throw new BroadcastActionError(ACTION_RESULT_CODES.GRAPHIC_NOT_FOUND, { graphicId });
  let patch = safeRecord(action.payload.patch);
  if (action.actionType === ACTION_TYPES.SHOW_GRAPHIC) patch = { ...patch, visible: true, status: "visible" };
  if (action.actionType === ACTION_TYPES.HIDE_GRAPHIC) patch = { ...patch, visible: false, status: "hidden" };
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_GEOMETRY) patch = pick(action.payload, ["position", "size", "scale", "opacity", "rotation"]);
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_LAYER) patch = { layerId: requiredTargetId(action, "layerId") };
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_ASSET) {
    const assetId = normalizeId(action.target.assetId || action.payload.assetId);
    if (!assetId || !getBroadcastAsset(context.assets, assetId)) throw new BroadcastActionError("asset-not-found", { assetId });
    patch = { payloadBindings: { ...(current?.payloadBindings || {}), assetId, variantId: action.payload.variantId ?? null } };
  }
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_OPACITY) patch = { opacity: action.payload.opacity };
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_SCALE) patch = { scale: action.payload.scale };
  state = setGraphicState(state, graphicId, patch, options);
  if ([ACTION_TYPES.SHOW_GRAPHIC, ACTION_TYPES.HIDE_GRAPHIC].includes(action.actionType)) {
    const show = action.actionType === ACTION_TYPES.SHOW_GRAPHIC;
    const visibleGraphics = new Set(state.preview.visibleGraphics);
    if (show) visibleGraphics.add(graphicId); else visibleGraphics.delete(graphicId);
    state = setPreviewState(state, { visibleGraphics: [...visibleGraphics] }, options);
  }
  return { state, data: { graphicId } };
}

function executeHideAll(state, action, options) {
  const hidden = [];
  const preserved = [];
  for (const graphicId of state.preview.visibleGraphics) {
    const graphic = state.graphics[graphicId];
    const layer = state.layers[graphic?.layerId];
    if (graphic?.layerId === "emergency" || layer?.locked) {
      preserved.push(graphicId);
      continue;
    }
    state = setGraphicState(state, graphicId, { visible: false, status: "hidden" }, options);
    hidden.push(graphicId);
  }
  const activeLayers = state.preview.activeLayers.filter((layerId) => layerId === "emergency" || state.layers[layerId]?.locked);
  state = setPreviewState(state, {
    active: preserved.length > 0,
    visibleGraphics: preserved,
    activeLayers,
    templateInstances: filterInstances(state.preview.templateInstances, preserved),
    status: preserved.length ? "ready" : "inactive"
  }, options);
  return { state, data: { hidden, preserved } };
}

function executeOutputAction(state, action, options) {
  const outputId = requiredTargetId(action, "outputId");
  const current = requireOutput(outputId);
  const outputOptions = { now: options.now, actor: options.actor, expectedRevision: current.revision };
  let output;
  if (action.actionType === ACTION_TYPES.UPDATE_OUTPUT) output = updateBroadcastOutput(outputId, safeRecord(action.payload.patch || action.payload), outputOptions);
  if (action.actionType === ACTION_TYPES.SET_OUTPUT_STATUS) output = setBroadcastOutputStatus(outputId, action.payload.status, outputOptions);
  if (action.actionType === ACTION_TYPES.SEND_HEARTBEAT) output = updateBroadcastOutputHeartbeat(outputId, safeRecord(action.payload.heartbeat || action.payload), outputOptions);
  if (action.actionType === ACTION_TYPES.ASSIGN_LAYERS_TO_OUTPUT) output = assignLayersToOutput(outputId, action.payload.layerIds || [], outputOptions);
  if (action.actionType === ACTION_TYPES.ASSIGN_THEME_TO_OUTPUT) output = assignThemeToOutput(outputId, action.payload.themeId ?? null, outputOptions);
  state = setOutputState(state, outputId, output, options);
  return { state, data: { outputId, outputRevision: output.revision, status: output.status } };
}

function executeEnqueue(state, action, options) {
  const item = safeRecord(action.payload.item || action.payload);
  const replaceId = normalizeId(action.payload.replaceQueueItemId);
  if (replaceId) state = dequeueBroadcastItem(state, { ...options, queueItemId: replaceId });
  state = enqueueBroadcastItem(state, item, options);
  return { state, data: { queueItemId: item.queueItemId || null } };
}

function executeLayerAction(state, action, options) {
  const layerId = requiredTargetId(action, "layerId");
  if (!state.layers[layerId]) throw new BroadcastActionError(ACTION_RESULT_CODES.LAYER_NOT_FOUND, { layerId });
  let patch = safeRecord(action.payload.patch || action.payload);
  if (action.actionType === ACTION_TYPES.LOCK_LAYER) patch = { locked: true };
  if (action.actionType === ACTION_TYPES.UNLOCK_LAYER) patch = { locked: false };
  if (action.actionType === ACTION_TYPES.SHOW_LAYER) patch = { visible: true, status: "visible" };
  if (action.actionType === ACTION_TYPES.HIDE_LAYER) patch = { visible: false, status: "hidden" };
  state = setLayerState(state, layerId, patch, options);
  if ([ACTION_TYPES.SHOW_LAYER, ACTION_TYPES.HIDE_LAYER].includes(action.actionType)) {
    const show = action.actionType === ACTION_TYPES.SHOW_LAYER;
    const activeLayers = new Set(state.preview.activeLayers);
    if (show) activeLayers.add(layerId); else activeLayers.delete(layerId);
    const visibleGraphics = show
      ? state.preview.visibleGraphics
      : state.preview.visibleGraphics.filter((graphicId) => state.graphics[graphicId]?.layerId !== layerId);
    state = setPreviewState(state, {
      activeLayers: [...activeLayers],
      visibleGraphics,
      templateInstances: filterInstances(state.preview.templateInstances, visibleGraphics)
    }, options);
  }
  return { state, data: { layerId, locked: state.layers[layerId].locked, visible: state.layers[layerId].visible } };
}

function executeVariableAction(registry, action, options) {
  const variableId = requiredTargetId(action, "variableId");
  const variableOptions = {
    now: options.now,
    actor: options.actor,
    expectedRevision: action.payload.expectedRevision
  };
  let variables = registry;
  switch (action.actionType) {
    case ACTION_TYPES.REGISTER_VARIABLE:
      variables = registerProductionVariable(variables, {
        ...safeRecord(action.payload.variable),
        variableId
      }, variableOptions);
      break;
    case ACTION_TYPES.SET_VARIABLE:
      variables = setProductionVariableValue(variables, variableId, action.payload.value, variableOptions);
      break;
    case ACTION_TYPES.RESET_VARIABLE:
      variables = resetProductionVariableValue(variables, variableId, {
        ...variableOptions,
        strategy: action.payload.strategy
      });
      break;
    case ACTION_TYPES.DISABLE_VARIABLE:
    case ACTION_TYPES.ENABLE_VARIABLE:
      variables = updateProductionVariable(variables, variableId, {
        status: action.actionType === ACTION_TYPES.ENABLE_VARIABLE ? "active" : "disabled"
      }, { ...variableOptions, allowOperationalStatus: true });
      break;
    case ACTION_TYPES.EXPIRE_VARIABLE:
      variables = expireProductionVariable(variables, variableId, variableOptions);
      break;
    default:
      throw new BroadcastActionError(ACTION_RESULT_CODES.INVALID_ACTION, { actionType: action.actionType });
  }
  const variable = variables.variables?.[variableId] || null;
  return {
    variables,
    data: {
      variableId,
      variableRevision: variable?.revision ?? null,
      registryRevision: variables.revision ?? null,
      status: variable?.status ?? null
    }
  };
}

function validateActionTargetAndPayload(action, contextInput, errors, warnings) {
  const context = contextInput ? createBroadcastActionContext(contextInput) : null;
  const needsOutput = [ACTION_TYPES.SET_OUTPUT, ACTION_TYPES.UPDATE_OUTPUT, ACTION_TYPES.SET_OUTPUT_STATUS, ACTION_TYPES.SEND_HEARTBEAT, ACTION_TYPES.ASSIGN_LAYERS_TO_OUTPUT, ACTION_TYPES.ASSIGN_THEME_TO_OUTPUT].includes(action.actionType);
  const needsLayer = [ACTION_TYPES.SET_GRAPHIC_LAYER, ACTION_TYPES.SET_LAYER, ACTION_TYPES.LOCK_LAYER, ACTION_TYPES.UNLOCK_LAYER, ACTION_TYPES.SHOW_LAYER, ACTION_TYPES.HIDE_LAYER].includes(action.actionType);
  const needsGraphic = [ACTION_TYPES.SELECT_GRAPHIC, ACTION_TYPES.SHOW_GRAPHIC, ACTION_TYPES.HIDE_GRAPHIC, ACTION_TYPES.UPDATE_GRAPHIC, ACTION_TYPES.SET_GRAPHIC_GEOMETRY, ACTION_TYPES.SET_GRAPHIC_LAYER, ACTION_TYPES.SET_GRAPHIC_ASSET, ACTION_TYPES.SET_GRAPHIC_OPACITY, ACTION_TYPES.SET_GRAPHIC_SCALE, ACTION_TYPES.PREPARE_PREVIEW].includes(action.actionType);
  const outputId = normalizeId(action.target.outputId);
  const layerId = normalizeId(action.target.layerId || action.payload.layerId || action.payload.graphicState?.layerId);
  const graphicId = normalizeId(action.target.graphicId || action.payload.graphicId);
  if (needsOutput && !outputId) errors.push("action-target-output-required");
  if (needsOutput && context && outputId && !getBroadcastOutput(outputId)) errors.push("action-output-not-found");
  if (needsLayer && !normalizeId(action.target.layerId)) errors.push("action-target-layer-required");
  if (needsLayer && context?.state && !context.state.layers?.[action.target.layerId]) errors.push("action-layer-not-found");
  if (needsGraphic && !graphicId) errors.push("action-target-graphic-required");
  if (action.actionType === ACTION_TYPES.PREPARE_PREVIEW && !isRecord(action.payload.previewState)) errors.push("action-preview-payload-required");
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_OPACITY && (!Number.isFinite(action.payload.opacity) || action.payload.opacity < 0 || action.payload.opacity > 1)) errors.push("action-opacity-invalid");
  if (action.actionType === ACTION_TYPES.SET_GRAPHIC_SCALE && (!Number.isFinite(action.payload.scale) || action.payload.scale <= 0)) errors.push("action-scale-invalid");
  if (action.actionType === ACTION_TYPES.SEND_HEARTBEAT && !isRecord(action.payload.heartbeat || action.payload)) errors.push("action-heartbeat-payload-invalid");
  if (action.actionType === ACTION_TYPES.ENQUEUE_GRAPHIC && !isRecord(action.payload.item || action.payload)) errors.push("action-queue-payload-invalid");
  if (VARIABLE_ACTIONS.has(action.actionType)) {
    if (!normalizeId(action.target.variableId)) errors.push("action-target-variable-required");
    if (!Number.isInteger(action.payload.expectedRevision) || action.payload.expectedRevision < 0) errors.push("action-variable-expected-revision-required");
    if (action.actionType === ACTION_TYPES.REGISTER_VARIABLE && !isRecord(action.payload.variable)) errors.push("action-variable-definition-required");
    if (action.actionType === ACTION_TYPES.SET_VARIABLE && !hasOwn(action.payload, "value")) errors.push("action-variable-value-required");
    if (action.actionType === ACTION_TYPES.RESET_VARIABLE && action.payload.strategy !== undefined && !["null", "default"].includes(action.payload.strategy)) {
      errors.push("action-variable-reset-strategy-invalid");
    }
  }
  if (layerId === "emergency") warnings.push("emergency-layer-targeted");
}

function evaluatePreconditions(action, context) {
  const errors = [];
  if (PROGRAM_ACTIONS.has(action.actionType) && action.actionType !== ACTION_TYPES.CLEAR_PROGRAM) {
    if (!context.state.preview?.active) errors.push("preview-not-active");
    if (context.state.preview?.validation?.valid === false || context.state.preview?.errors?.length) errors.push("preview-has-blocking-errors");
    const programOutputIds = uniqueStrings(action.target.outputIds?.length ? action.target.outputIds : context.state.preview?.outputIds);
    if (!programOutputIds.length) errors.push("program-output-required");
    for (const outputId of programOutputIds) {
      if (!getBroadcastOutput(outputId)) errors.push(`program-output-not-found:${outputId}`);
    }
  }
  if (action.actionType === ACTION_TYPES.CLEAR_PROGRAM && context.state.program?.emergencyMode && action.payload.force !== true) errors.push("program-emergency-active");
  for (const precondition of action.preconditions) {
    if (precondition.type === "state_revision" && precondition.value !== context.state.revision) errors.push("precondition-state-revision-failed");
    if (precondition.type === "preview_active" && context.state.preview.active !== precondition.value) errors.push("precondition-preview-active-failed");
    if (precondition.type === "program_active" && context.state.program.active !== precondition.value) errors.push("precondition-program-active-failed");
  }
  return uniqueStrings(errors);
}

function selectionPatch(action, now) {
  return {
    graphicId: action.target.graphicId || action.payload.graphicId,
    templateId: action.payload.templateId || action.target.graphicId,
    layerId: action.target.layerId || action.payload.layerId || null,
    outputIds: action.target.outputIds || action.payload.outputIds || [],
    position: action.payload.position,
    size: action.payload.size,
    scale: action.payload.scale,
    opacity: action.payload.opacity,
    payloadBindings: action.payload.payloadBindings,
    selectedAt: now,
    selectedBy: action.actor?.id
  };
}

function rejectedDispatch(actionInput, context, code, errors, now, status = ACTION_STATUSES.REJECTED) {
  let action = withActionStatus(actionInput, status, { completedAt: now, errors: uniqueStrings(errors) });
  const result = buildActionResult(action, {
    code,
    success: false,
    startedAt: now,
    completedAt: now,
    stateRevisionBefore: context.state?.revision ?? null,
    stateRevisionAfter: context.state?.revision ?? null,
    errors
  });
  action = { ...action, result };
  const auditEntry = buildBroadcastActionAuditEntry(action, result, context);
  action = { ...action, audit: auditEntry };
  storeAction(action);
  return buildDispatchEnvelope(action, context, result, {}, auditEntry);
}

function buildActionResult(action, input = {}) {
  return {
    code: input.code || ACTION_RESULT_CODES.FAILED,
    success: input.success === true,
    message: input.message || readableResultMessage(input.code),
    actionId: action.actionId,
    actionType: action.actionType,
    startedAt: normalizeIsoDate(input.startedAt),
    completedAt: normalizeIsoDate(input.completedAt),
    stateRevisionBefore: integerOrNull(input.stateRevisionBefore),
    stateRevisionAfter: integerOrNull(input.stateRevisionAfter),
    outputIds: uniqueStrings(input.outputIds),
    warnings: uniqueStrings(input.warnings),
    errors: uniqueStrings(input.errors),
    data: safeRecord(input.data)
  };
}

function buildDispatchEnvelope(action, context, result, execution = {}, auditEntry = null) {
  return {
    action: cloneBroadcastAction(action),
    state: execution.state ? cloneBroadcastState(execution.state) : cloneBroadcastState(context.state),
    outputs: cloneSerializable(execution.outputs || context.outputs, [], "dispatch.outputs") || {},
    assets: cloneSerializable(execution.assets || context.assets, [], "dispatch.assets") || {},
    variables: cloneSerializable(execution.variables || context.variables, [], "dispatch.variables") || {},
    result: cloneSerializable(result, [], "dispatch.result") || {},
    auditEntry: cloneSerializable(auditEntry || action.audit, [], "dispatch.audit") || {},
    warnings: uniqueStrings(result.warnings),
    errors: uniqueStrings(result.errors)
  };
}

function finishWithoutExecution(actionInput, status, code, reason, options) {
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const action = normalizeBroadcastAction(actionInput, { now });
  if ([ACTION_STATUSES.SUCCEEDED, ACTION_STATUSES.FAILED, ACTION_STATUSES.REJECTED, ACTION_STATUSES.CANCELLED, ACTION_STATUSES.EXPIRED].includes(action.status)) {
    throw new BroadcastActionError("action-final-state", { status: action.status });
  }
  const result = buildActionResult(action, {
    code,
    success: false,
    startedAt: now,
    completedAt: now,
    stateRevisionBefore: action.context.stateRevision,
    stateRevisionAfter: action.context.stateRevision,
    errors: [reason]
  });
  const finished = normalizeBroadcastAction({ ...action, status, completedAt: now, result, errors: [reason] }, { now });
  storeAction(finished);
  return finished;
}

function confirmationSatisfied(confirmation, requirement) {
  if (!requirement.required) return true;
  return confirmation?.confirmed === true
    && confirmation.type === requirement.type
    && confirmation.confirmations.length >= requirement.requiredCount;
}

function normalizeConfirmation(value) {
  const raw = safeRecord(value);
  const confirmations = normalizeConfirmations(raw.confirmations);
  const type = normalizeEnum(raw.type, CONFIRMATION_VALUES, ACTION_CONFIRMATION_TYPES.NONE);
  const requiredCount = nonNegativeInteger(raw.requiredCount, type === ACTION_CONFIRMATION_TYPES.DOUBLE_CONFIRMATION ? 2 : type === ACTION_CONFIRMATION_TYPES.NONE ? 0 : 1);
  return {
    required: raw.required === true || requiredCount > 0,
    type,
    reason: nullableString(raw.reason),
    requiredCount,
    confirmed: raw.confirmed === true && confirmations.length >= requiredCount,
    confirmations
  };
}

function normalizeConfirmations(values) {
  return (Array.isArray(values) ? values : []).slice(0, 10).map((item) => ({
    confirmationId: normalizeId(item?.confirmationId),
    type: normalizeEnum(item?.type, CONFIRMATION_VALUES, ACTION_CONFIRMATION_TYPES.SIMPLE),
    actorId: normalizeId(item?.actorId),
    at: normalizeIsoDate(item?.at)
  })).filter((item) => item.confirmationId && item.actorId && item.at);
}

function normalizeActionReference(value, contextInput) {
  const raw = safeRecord(value);
  const context = isRecord(contextInput) ? contextInput : {};
  return {
    tenantId: normalizeId(raw.tenantId ?? context.tenantId),
    organizationId: normalizeId(raw.organizationId ?? context.organizationId),
    tournamentId: normalizeId(raw.tournamentId ?? context.tournamentId),
    competitionId: normalizeId(raw.competitionId ?? context.competitionId),
    charreadaId: normalizeId(raw.charreadaId ?? context.charreadaId),
    outputIds: uniqueStrings(raw.outputIds?.length ? raw.outputIds : context.outputIds),
    stateRevision: integerOrNull(raw.stateRevision ?? context.expectedRevision ?? context.state?.revision),
    contractRevision: integerOrNull(raw.contractRevision ?? context.contractRevision ?? context.contract?.revision)
  };
}

function normalizeActor(value) {
  if (!isRecord(value)) return null;
  const actor = {
    id: normalizeId(value.id ?? value.userId),
    name: nullableString(value.name),
    role: normalizeRole(value.role),
    sessionId: normalizeId(value.sessionId),
    deviceId: normalizeId(value.deviceId),
    source: nullableString(value.source) || "production-console",
    visibility: normalizeVisibility(value.visibility)
  };
  return actor.id || actor.role ? actor : null;
}

function normalizeRole(value) {
  const role = String(value ?? "").trim().toLowerCase().replaceAll("á", "a").replaceAll("ó", "o");
  const aliases = { admin: "supervisor", administrator: "supervisor", operator: "operador", graphics: "graficos", production: "operador", read: "lectura", readonly: "lectura" };
  return aliases[role] || role || null;
}

function normalizeOutputRegistry(value) {
  const source = Array.isArray(value) ? value : isRecord(value) ? Object.values(value) : listBroadcastOutputs();
  return Object.fromEntries(source.filter((output) => normalizeId(output?.id)).map((output) => [output.id, cloneSerializable(output, [], `outputs.${output.id}`)]));
}

function currentOutputMap(outputIds) {
  const ids = uniqueStrings(outputIds?.length ? outputIds : listBroadcastOutputs().map((output) => output.id));
  return Object.fromEntries(ids.map((id) => [id, getBroadcastOutput(id)]).filter(([, output]) => output));
}

function requireOutput(outputId) {
  const output = getBroadcastOutput(outputId);
  if (!output) throw new BroadcastActionError(ACTION_RESULT_CODES.OUTPUT_NOT_FOUND, { outputId });
  return output;
}

function requiredTargetId(action, key) {
  const id = normalizeId(action.target?.[key] ?? action.payload?.[key]);
  if (!id) throw new BroadcastActionError(ACTION_RESULT_CODES.INVALID_TARGET, { key });
  return id;
}

function filterInstances(instances, graphicIds) {
  const visible = new Set(graphicIds);
  return Object.fromEntries(Object.entries(isRecord(instances) ? instances : {}).filter(([id, instance]) => visible.has(instance?.graphicId || id)));
}

function stripControlledPayloadFields(payload) {
  const clone = { ...payload };
  delete clone.actor;
  delete clone.permissions;
  delete clone.role;
  return clone;
}

function normalizePreconditions(value) {
  return (Array.isArray(value) ? value : []).slice(0, 50).map((item) => ({
    type: nullableString(item?.type),
    value: cloneSerializable(item?.value, [], "precondition.value")
  })).filter((item) => item.type);
}

function withActionStatus(actionInput, status, patch = {}) {
  return normalizeBroadcastAction({ ...actionInput, ...patch, status }, { now: patch.completedAt || patch.executedAt || patch.validatedAt || actionInput.createdAt });
}

function storeAction(actionInput) {
  const action = normalizeBroadcastAction(actionInput);
  const previous = ACTION_STORE.get(action.actionId);
  if (!action.sequence) action.sequence = previous?.sequence || ++actionSequence;
  ACTION_STORE.set(action.actionId, freezeDeep(cloneBroadcastAction(action)));
  while (ACTION_STORE.size > MAX_STORE_SIZE) ACTION_STORE.delete(ACTION_STORE.keys().next().value);
}

function storeSuccessfulDispatch(action, dispatch) {
  storeAction(action);
  if (action.idempotencyKey) {
    IDEMPOTENCY_STORE.set(action.idempotencyKey, {
      fingerprint: actionFingerprint(action),
      dispatch: freezeDeep(cloneDispatchResult(dispatch))
    });
    while (IDEMPOTENCY_STORE.size > MAX_STORE_SIZE) IDEMPOTENCY_STORE.delete(IDEMPOTENCY_STORE.keys().next().value);
  }
}

function cloneDispatchResult(dispatch) {
  return {
    action: cloneBroadcastAction(dispatch.action),
    state: cloneBroadcastState(dispatch.state),
    outputs: cloneSerializable(dispatch.outputs, [], "dispatch.outputs") || {},
    assets: cloneSerializable(dispatch.assets, [], "dispatch.assets") || {},
    variables: cloneSerializable(dispatch.variables, [], "dispatch.variables") || {},
    result: cloneSerializable(dispatch.result, [], "dispatch.result") || {},
    auditEntry: cloneSerializable(dispatch.auditEntry, [], "dispatch.audit") || {},
    warnings: uniqueStrings(dispatch.warnings),
    errors: uniqueStrings(dispatch.errors)
  };
}

function actionFingerprint(action) {
  return stableSerialize({
    actionType: action.actionType,
    mode: action.mode,
    target: action.target,
    payload: action.payload,
    actorId: action.actor?.id,
    actorRole: action.actor?.role,
    context: pick(action.context, ["tenantId", "organizationId", "tournamentId", "competitionId", "charreadaId"]),
    correlationId: action.correlationId,
    causationId: action.causationId
  });
}

function stableSerialize(value) {
  if (value === null) return "null";
  if (["string", "boolean", "number"].includes(typeof value)) return `${typeof value}:${String(value)}`;
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${key}:${stableSerialize(value[key])}`).join(",")}}`;
  return "undefined";
}

function mapValidationCode(errors) {
  if (errors.includes("action-actor-required")) return ACTION_RESULT_CODES.INVALID_ACTOR;
  if (errors.some((error) => error.includes("target"))) return ACTION_RESULT_CODES.INVALID_TARGET;
  if (errors.includes("action-output-not-found")) return ACTION_RESULT_CODES.OUTPUT_NOT_FOUND;
  if (errors.includes("action-layer-not-found")) return ACTION_RESULT_CODES.LAYER_NOT_FOUND;
  if (errors.some((error) => error.includes("payload") || error.includes("opacity") || error.includes("scale"))) return ACTION_RESULT_CODES.INVALID_PAYLOAD;
  return ACTION_RESULT_CODES.INVALID_ACTION;
}

function mapPreconditionCode(errors) {
  if (errors.some((error) => error.startsWith("preview-"))) return ACTION_RESULT_CODES.PREVIEW_NOT_READY;
  if (errors.some((error) => error === "program-output-required" || error.startsWith("program-output-not-found:"))) return ACTION_RESULT_CODES.OUTPUT_NOT_FOUND;
  if (errors.includes("safe-mode-force-blocked")) return ACTION_RESULT_CODES.SAFE_MODE_BLOCKED;
  if (errors.includes("program-emergency-active")) return ACTION_RESULT_CODES.PROGRAM_PROTECTED;
  return ACTION_RESULT_CODES.REJECTED;
}

function mapExecutionError(error) {
  const code = error?.code || error?.message || "";
  if (Object.values(ACTION_RESULT_CODES).includes(code)) return code;
  if (String(code).includes("expected-revision")) return ACTION_RESULT_CODES.STATE_REVISION_CONFLICT;
  if (String(code).includes("not-authorized") || String(code).includes("actor-required")) return ACTION_RESULT_CODES.PERMISSION_DENIED;
  if (String(code).includes("variable-not-found")) return ACTION_RESULT_CODES.INVALID_TARGET;
  if (String(code).includes("variable") && (String(code).includes("invalid") || String(code).includes("required") || String(code).includes("forbidden"))) {
    return ACTION_RESULT_CODES.INVALID_PAYLOAD;
  }
  if (String(code).includes("preview")) return ACTION_RESULT_CODES.PREVIEW_NOT_READY;
  if (String(code).includes("program") || String(code).includes("locked")) return ACTION_RESULT_CODES.PROGRAM_PROTECTED;
  if (String(code).includes("output")) return ACTION_RESULT_CODES.OUTPUT_NOT_FOUND;
  if (String(code).includes("layer")) return ACTION_RESULT_CODES.LAYER_NOT_FOUND;
  if (String(code).includes("graphic")) return ACTION_RESULT_CODES.GRAPHIC_NOT_FOUND;
  return ACTION_RESULT_CODES.FAILED;
}

function readableResultMessage(code) {
  return {
    [ACTION_RESULT_CODES.SUCCEEDED]: "Acción ejecutada correctamente.",
    [ACTION_RESULT_CODES.CONFIRMATION_REQUIRED]: "La acción requiere confirmación.",
    [ACTION_RESULT_CODES.PERMISSION_DENIED]: "El actor no tiene permiso conceptual para esta acción.",
    [ACTION_RESULT_CODES.STATE_REVISION_CONFLICT]: "La revisión esperada no coincide con el estado actual."
  }[code] || "La acción no pudo completarse.";
}

function buildActionId(now, random) {
  const suffix = typeof random === "function" ? random() : Math.random();
  return `act_${Date.parse(now)}_${String(suffix).replace(/\D/g, "").slice(0, 10) || "0"}`;
}

function resolveNow(context = {}, options = {}) {
  const source = isRecord(context) ? context : {};
  const value = options.now ?? source.now;
  if (typeof value === "function") return resolveNow({ now: value() });
  return normalizeIsoDate(value) || new Date().toISOString();
}

function normalizeIsoDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isIsoDate(value) {
  return typeof value === "string" && normalizeIsoDate(value) === value;
}

function normalizeId(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const id = String(value).trim();
  return id && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(id) ? id : null;
}

function normalizeVisibility(value) {
  return ["public", "production", "operational", "restricted"].includes(value) ? value : "production";
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.has(value) ? value : fallback;
}

function integerOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function nullableString(value) {
  if (value === null || value === undefined) return null;
  return String(value);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}

function safeRecord(value) {
  return isRecord(value) ? cloneSerializable(value, [], "record") || {} : {};
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function containsDangerousKey(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key) || containsDangerousKey(value[key], seen)) return true;
  }
  return false;
}

function pick(value, keys) {
  const source = safeRecord(value);
  return Object.fromEntries(keys.filter((key) => Object.prototype.hasOwnProperty.call(source, key)).map((key) => [key, source[key]]));
}

function cloneSerializable(value, warnings = [], path = "value", ancestors = new WeakSet(), depth = 0) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return String(value);
  if (value === undefined) return undefined;
  if (typeof value === "function" || typeof value === "symbol") {
    warnings.push(`non-serializable-removed:${path}`);
    return undefined;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (depth >= MAX_DEPTH) {
    warnings.push(`depth-limited:${path}`);
    return null;
  }
  if (typeof value !== "object") return null;
  if (ancestors.has(value)) {
    warnings.push(`circular-reference-removed:${path}`);
    return undefined;
  }
  ancestors.add(value);
  const output = Array.isArray(value) ? [] : {};
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, MAX_ARRAY_LENGTH);
    for (let index = 0; index < limit; index += 1) {
      const cloned = cloneSerializable(value[index], warnings, `${path}.${index}`, ancestors, depth + 1);
      if (cloned !== undefined) output.push(cloned);
    }
    if (value.length > MAX_ARRAY_LENGTH) warnings.push(`array-truncated:${path}`);
  } else {
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) {
        warnings.push(`dangerous-key-removed:${path}.${key}`);
        continue;
      }
      const cloned = cloneSerializable(value[key], warnings, `${path}.${key}`, ancestors, depth + 1);
      if (cloned !== undefined) output[key] = cloned;
    }
  }
  ancestors.delete(value);
  return output;
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((item) => freezeDeep(item, seen));
  return Object.freeze(value);
}
