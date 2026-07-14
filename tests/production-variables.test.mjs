import assert from "node:assert/strict";
import {
  PRODUCTION_VARIABLES_VERSION,
  VARIABLE_SCOPES,
  VARIABLE_SOURCES,
  VARIABLE_STATUSES,
  VARIABLE_TYPES,
  VARIABLE_VISIBILITIES,
  BroadcastVariableError,
  buildProductionVariablesSnapshot,
  cloneProductionVariable,
  createProductionVariable,
  expireProductionVariable,
  getProductionVariable,
  getProductionVariableWarnings,
  listProductionVariables,
  normalizeProductionVariable,
  registerProductionVariable,
  removeProductionVariable,
  resetProductionVariableValue,
  resolveProductionVariable,
  resolveProductionVariables,
  setProductionVariableValue,
  updateProductionVariable,
  validateProductionVariable,
  validateProductionVariablesSnapshot
} from "../js/broadcast/productionVariables.js";
import {
  ACTION_RESULT_CODES,
  ACTION_TYPES,
  BROADCAST_ACTION_ENGINE_VERSION,
  createBroadcastAction,
  createBroadcastActionContext,
  dispatchBroadcastAction
} from "../js/broadcast/actionEngine.js";
import { createInitialBroadcastState } from "../js/broadcast/broadcastState.js?v=20260713-broadcast-output-001-output-v1";

const T0 = "2026-07-13T20:00:00.000Z";
const T1 = "2026-07-13T20:01:00.000Z";
const T2 = "2026-07-13T20:02:00.000Z";
const SUPERVISOR = Object.freeze({ id: "supervisor_variables", name: "Supervisor", role: "supervisor" });
const OPERATOR = Object.freeze({ id: "operator_variables", name: "Operador", role: "operador" });
const GRAPHICS = Object.freeze({ id: "graphics_variables", name: "Gráficos", role: "graficos" });
const JUDGE = Object.freeze({ id: "judge_variables", name: "Juez", role: "juez" });

assert.equal(PRODUCTION_VARIABLES_VERSION, "1.0.0");
assert.deepEqual(VARIABLE_TYPES, ["text", "number", "boolean", "color", "date", "datetime", "duration", "enum", "asset_ref", "contract_ref", "structured"]);
assert.equal(VARIABLE_SCOPES.length, 10);
assert.equal(VARIABLE_VISIBILITIES.length, 4);
assert.equal(VARIABLE_STATUSES.length, 6);
assert.equal(VARIABLE_SOURCES.length, 6);
assert.ok(BroadcastVariableError.prototype instanceof Error);

function definition(overrides = {}) {
  return {
    variableId: overrides.variableId || `var_${String(overrides.key || "production.test").replaceAll(".", "_")}`,
    key: overrides.key || "production.test",
    label: overrides.label || "Variable de prueba",
    dataType: overrides.dataType || "text",
    value: Object.hasOwn(overrides, "value") ? overrides.value : null,
    defaultValue: Object.hasOwn(overrides, "defaultValue") ? overrides.defaultValue : null,
    status: overrides.status || "active",
    scope: overrides.scope || "tournament",
    visibility: overrides.visibility || "production",
    source: overrides.source,
    tenantId: Object.hasOwn(overrides, "tenantId") ? overrides.tenantId : "tenant_test",
    organizationId: overrides.organizationId ?? null,
    clientId: overrides.clientId ?? null,
    tournamentId: Object.hasOwn(overrides, "tournamentId") ? overrides.tournamentId : "tournament_test",
    competitionId: overrides.competitionId ?? null,
    charreadaId: overrides.charreadaId ?? null,
    outputId: overrides.outputId ?? null,
    userId: overrides.userId ?? null,
    sessionId: overrides.sessionId ?? null,
    schemaId: overrides.schemaId ?? null,
    options: overrides.options || [],
    validation: overrides.validation || {},
    writableBy: overrides.writableBy || ["supervisor", "operador", "graficos"],
    readableBy: overrides.readableBy || [],
    ttl: overrides.ttl ?? null,
    expiresAt: overrides.expiresAt ?? null,
    version: overrides.version || "1.0.0",
    revision: overrides.revision ?? 0
  };
}

function add(registry, input, now = T0) {
  return registerProductionVariable(registry, input, {
    actor: SUPERVISOR,
    expectedRevision: registry.revision || 0,
    now,
    random: () => 0.123
  });
}

// Creation covers every supported type and never mutates its definition.
const creationCases = [
  ["text", ""],
  ["number", 0],
  ["boolean", false],
  ["color", "#D6AD43"],
  ["date", "2026-07-13"],
  ["datetime", "2026-07-13T20:00:00.000Z"],
  ["duration", 0],
  ["enum", "camara_1", { options: ["camara_1", "camara_2"] }],
  ["asset_ref", { assetId: "asset_logo", version: "1.0.0", variantId: "program" }],
  ["contract_ref", "score.total", { source: "contract_reference" }],
  ["structured", { title: "Bloque", enabled: false, zero: 0, empty: "" }, { schemaId: "production.key_value_v1" }]
];
for (const [dataType, value, extra = {}] of creationCases) {
  const input = definition({ key: `production.test${dataType.replaceAll("_", "")}`, dataType, value, ...extra });
  const before = structuredClone(input);
  const variable = createProductionVariable(input, { actor: SUPERVISOR, now: T0, random: () => 0.1 });
  assert.deepEqual(input, before, dataType);
  assert.equal(validateProductionVariable(variable, { now: T0 }).valid, true, dataType);
  if (["number", "boolean", "duration", "text"].includes(dataType)) assert.equal(variable.value, value);
  assert.notEqual(cloneProductionVariable(variable), variable);
}

// Invalid types and values fail closed.
for (const input of [
  definition({ dataType: "unknown", value: "x" }),
  definition({ key: "production.nan", dataType: "number", value: Number.NaN }),
  definition({ key: "production.infinity", dataType: "number", value: Number.POSITIVE_INFINITY }),
  definition({ key: "production.color", dataType: "color", value: "red" }),
  definition({ key: "production.enum", dataType: "enum", value: "c", options: ["a", "b"] }),
  definition({ key: "production.date", dataType: "date", value: "2026-02-31" }),
  definition({ key: "production.asset", dataType: "asset_ref", value: { assetId: "asset_logo", externalUrl: "https://example.com/logo.png" } }),
  definition({ key: "production.contract", dataType: "contract_ref", value: "system.diagnostics", source: "contract_reference" }),
  definition({ key: "production.structured", dataType: "structured", value: { ok: true } })
]) {
  assert.equal(validateProductionVariable(input, { now: T0 }).valid, false, `${input.key}:${input.dataType}`);
}

// Registry identity, atomic concurrency and tenant isolation.
let registry = { variablesVersion: PRODUCTION_VARIABLES_VERSION, revision: 0, tenantId: "tenant_test", variables: {}, createdAt: T0, updatedAt: T0 };
registry = add(registry, definition({ variableId: "var_message_tournament", key: "production.message", value: "Torneo" }));
assert.equal(registry.revision, 1);
assert.equal(getProductionVariable(registry, "production.message").value, "Torneo");
assert.equal(listProductionVariables(registry).length, 1);
assert.throws(() => add(registry, definition({ variableId: "var_message_tournament", key: "production.other" })), /variable-id-duplicate/);
assert.throws(() => add(registry, definition({ variableId: "var_message_duplicate", key: "production.message" })), /variable-key-scope-duplicate/);
assert.throws(() => add(registry, definition({ variableId: "var_other_tenant", key: "production.other", tenantId: "tenant_other" })), /variable-tenant-conflict/);

const beforeRejectedPatch = structuredClone(registry);
assert.throws(() => updateProductionVariable(registry, "var_message_tournament", { key: "production.changed" }, {
  actor: SUPERVISOR, expectedRevision: 0, now: T1
}), /variable-patch-field-forbidden:key/);
assert.deepEqual(registry, beforeRejectedPatch);
assert.throws(() => updateProductionVariable(registry, "var_message_tournament", { label: "Cambio" }, {
  actor: SUPERVISOR, expectedRevision: 99, now: T1
}), /variable-expected-revision-conflict/);
assert.deepEqual(registry, beforeRejectedPatch);

registry = updateProductionVariable(registry, "var_message_tournament", { label: "Mensaje del torneo" }, {
  actor: SUPERVISOR, expectedRevision: 0, now: T1
});
assert.equal(registry.variables.var_message_tournament.revision, 1);
assert.equal(registry.variables.var_message_tournament.createdAt, T0);

// Scope resolution is deterministic and independent from insertion order.
const scopeDefinitions = [
  ["global", {}, "Global"],
  ["tenant", { tenantId: "tenant_test", tournamentId: null }, "Tenant"],
  ["organization", { organizationId: "org_test", tournamentId: null }, "Organización"],
  ["client", { clientId: "client_test", tournamentId: null }, "Cliente"],
  ["competition", { competitionId: "competition_test" }, "Competencia"],
  ["charreada", { charreadaId: "charreada_test" }, "Charreada"],
  ["output", { outputId: "program_test" }, "Output"],
  ["user", { userId: "user_test" }, "Usuario"],
  ["session", { sessionId: "session_test" }, "Sesión"]
];
for (const [scope, ids, value] of scopeDefinitions) {
  const globalIds = scope === "global"
    ? { tenantId: null, tournamentId: null }
    : ids;
  registry = add(registry, definition({
    variableId: `var_message_${scope}`,
    key: "production.message",
    scope,
    value,
    ...globalIds
  }));
}
const resolutionContext = {
  tenantId: "tenant_test", organizationId: "org_test", clientId: "client_test", tournamentId: "tournament_test",
  competitionId: "competition_test", charreadaId: "charreada_test", outputId: "program_test", userId: "user_test",
  sessionId: "session_test", visibility: "production", now: T1
};
assert.equal(resolveProductionVariable(registry, "production.message", resolutionContext).value, "Sesión");
const reversedRegistry = { ...registry, variables: Object.fromEntries(Object.entries(registry.variables).reverse()) };
assert.deepEqual(resolveProductionVariable(reversedRegistry, "production.message", resolutionContext), resolveProductionVariable(registry, "production.message", resolutionContext));

const resolutionLevels = [
  ["sessionId", "Sesión"], ["userId", "Usuario"], ["outputId", "Output"], ["charreadaId", "Charreada"],
  ["competitionId", "Competencia"], ["tournamentId", "Torneo"], ["clientId", "Cliente"],
  ["organizationId", "Organización"], ["tenantId", "Tenant"], [null, "Global"]
];
const narrowingContext = { ...resolutionContext };
for (const [field, expected] of resolutionLevels) {
  assert.equal(resolveProductionVariable(registry, "production.message", narrowingContext).value, expected, field || "global");
  if (field) delete narrowingContext[field];
}

let revisionRegistry = add({ revision: 0, variables: {}, tenantId: "tenant_test", createdAt: T0, updatedAt: T0 }, definition({
  variableId: "var_revision_high_version", key: "production.revisionTie", scope: "output", outputId: "program_test",
  tournamentId: null, value: "Versión mayor", version: "2.0.0", revision: 1
}));
revisionRegistry = add(revisionRegistry, definition({
  variableId: "var_revision_high_revision", key: "production.revisionTie", scope: "output", outputId: "program_test",
  value: "Revisión mayor", version: "1.0.0", revision: 8
}));
assert.equal(resolveProductionVariable(revisionRegistry, "production.revisionTie", resolutionContext).value, "Revisión mayor");
const reverseRevisionRegistry = { ...revisionRegistry, variables: Object.fromEntries(Object.entries(revisionRegistry.variables).reverse()) };
assert.equal(resolveProductionVariable(reverseRevisionRegistry, "production.revisionTie", resolutionContext).value, "Revisión mayor");
assert.equal(resolveProductionVariable(revisionRegistry, "production.revisionTie", { ...resolutionContext, tenantId: null }).resolved, false);

// Disabled and expired values fall back without mutating the registry.
let fallbackRegistry = add({ revision: 0, variables: {}, tenantId: "tenant_test", createdAt: T0, updatedAt: T0 }, definition({
  variableId: "var_fallback_global", key: "production.fallback", scope: "global", tenantId: null, tournamentId: null,
  value: "Global", defaultValue: "Default"
}));
fallbackRegistry = add(fallbackRegistry, definition({
  variableId: "var_fallback_session", key: "production.fallback", scope: "session", sessionId: "session_test", value: "Sesión",
  expiresAt: T1
}), T0);
assert.equal(resolveProductionVariable(fallbackRegistry, "production.fallback", { ...resolutionContext, now: T0 }).value, "Sesión");
const fallbackBefore = structuredClone(fallbackRegistry);
const expiredResolution = resolveProductionVariable(fallbackRegistry, "production.fallback", { ...resolutionContext, now: T2 });
assert.equal(expiredResolution.value, "Global");
assert.equal(expiredResolution.sourceScope, "global");
assert.deepEqual(fallbackRegistry, fallbackBefore);

let mutableRegistry = add({ revision: 0, variables: {}, tenantId: "tenant_test", createdAt: T0, updatedAt: T0 }, definition({
  variableId: "var_mutable", key: "production.mutable", value: "Inicial", defaultValue: "Default", ttl: 60000
}));
mutableRegistry = setProductionVariableValue(mutableRegistry, "var_mutable", "Actualizado", { actor: OPERATOR, expectedRevision: 0, now: T1 });
assert.equal(mutableRegistry.variables.var_mutable.value, "Actualizado");
assert.equal(mutableRegistry.variables.var_mutable.expiresAt, T2);
mutableRegistry = resetProductionVariableValue(mutableRegistry, "var_mutable", { actor: GRAPHICS, expectedRevision: 1, strategy: "default", now: T2 });
assert.equal(mutableRegistry.variables.var_mutable.value, "Default");
mutableRegistry = expireProductionVariable(mutableRegistry, "var_mutable", { actor: SUPERVISOR, expectedRevision: 2, now: T2 });
assert.equal(mutableRegistry.variables.var_mutable.status, "expired");
assert.equal(getProductionVariableWarnings(mutableRegistry.variables.var_mutable, { now: T2 }).includes("variable-expired"), true);
assert.throws(() => setProductionVariableValue(mutableRegistry, "var_mutable", "Bloqueado", { actor: JUDGE, expectedRevision: 3, now: T2 }), /variable-write-not-authorized/);

// Contract and asset references expose only registered paths/identifiers.
let references = add({ revision: 0, variables: {}, tenantId: "tenant_test", createdAt: T0, updatedAt: T0 }, definition({
  variableId: "var_contract_score", key: "production.contractScore", dataType: "contract_ref", value: "score.total", source: "contract_reference"
}));
references = add(references, definition({
  variableId: "var_asset_qr", key: "production.qr", dataType: "asset_ref",
  value: { assetId: "asset_qr", version: "1.2.0", variantId: "program" }, visibility: "public"
}));
assert.equal(resolveProductionVariable(references, "production.contractScore", resolutionContext, { contract: { score: { total: 0 } } }).value, 0);
assert.deepEqual(resolveProductionVariable(references, "production.qr", { ...resolutionContext, visibility: "public" }).value, {
  assetId: "asset_qr", version: "1.2.0", variantId: "program"
});

for (const [index, value] of [
  { url: "https://example.com/asset.png" },
  { assetId: "asset_qr", url: "https://example.com/asset.png" },
  { assetId: "file://private/asset.png" },
  { assetId: "javascript:" },
  { assetId: "data:" },
  { assetId: "asset_qr", assetVersion: "1.0.0" }
].entries()) {
  assert.equal(validateProductionVariable(definition({
    variableId: `var_asset_invalid_${index}`, key: `production.invalidAsset${index}`, dataType: "asset_ref", value
  }), { now: T0 }).valid, false);
}

const allowedContractPaths = [
  "tournament.name", "competition.name", "participant.name", "team.name", "horse.name", "score.total", "timer.value"
];
for (const [index, path] of allowedContractPaths.entries()) {
  assert.equal(validateProductionVariable(definition({
    variableId: `var_contract_allowed_${index}`, key: `production.contractAllowed${index}`, dataType: "contract_ref",
    value: path, source: "contract_reference"
  }), { now: T0 }).valid, true, path);
}
for (const [index, path] of [
  "system.diagnostics", "operator.name", "judge.name", "score", "score.detail", "customFields.public", "__proto__.polluted",
  "constructor.name", "prototype.value"
].entries()) {
  assert.equal(validateProductionVariable(definition({
    variableId: `var_contract_forbidden_${index}`, key: `production.contractForbidden${index}`, dataType: "contract_ref",
    value: path, source: "contract_reference"
  }), { now: T0 }).valid, false, path);
}
const readonlyContract = Object.freeze({ score: Object.freeze({ total: 69 }) });
const readonlyBefore = structuredClone(readonlyContract);
const readonlyResolution = resolveProductionVariable(references, "production.contractScore", resolutionContext, { contract: readonlyContract });
assert.equal(readonlyResolution.value, 69);
readonlyResolution.value = 999;
delete readonlyResolution.value;
assert.deepEqual(readonlyContract, readonlyBefore);
assert.throws(() => setProductionVariableValue(references, "var_contract_score", "team.name", {
  actor: SUPERVISOR, expectedRevision: 0, now: T1
}), /variable-contract-ref-read-only/);
assert.throws(() => resetProductionVariableValue(references, "var_contract_score", {
  actor: SUPERVISOR, expectedRevision: 0, now: T1
}), /variable-contract-ref-read-only/);

// Public snapshots exclude higher visibility identities and preserve authorized falsy values.
let snapshotRegistry = add({ revision: 0, variables: {}, tenantId: "tenant_test", createdAt: T0, updatedAt: T0 }, definition({
  variableId: "var_public_false", key: "production.publicFalse", dataType: "boolean", value: false, visibility: "public"
}));
snapshotRegistry = add(snapshotRegistry, definition({
  variableId: "var_private_text", key: "production.privateText", value: "Interno", visibility: "restricted"
}));
snapshotRegistry = add(snapshotRegistry, definition({
  variableId: "var_public_structured", key: "production.publicStructured", dataType: "structured",
  schemaId: "production.key_value_v1", value: { nested: { score: 69 }, zero: 0, disabled: false, empty: "", nil: null }, visibility: "public"
}));
const snapshotRegistryBefore = structuredClone(snapshotRegistry);
const snapshot = buildProductionVariablesSnapshot(snapshotRegistry, { ...resolutionContext, actor: OPERATOR }, { visibility: "public", now: T1 });
assert.equal(snapshot.values["production.publicFalse"], false);
assert.equal(Object.hasOwn(snapshot.values, "production.privateText"), false);
assert.equal(snapshot.context.tenantId, null);
assert.equal(snapshot.context.sessionId, null);
assert.equal(Object.hasOwn(snapshot.context, "actor"), false);
assert.equal(validateProductionVariablesSnapshot(snapshot).valid, true);
assert.equal(resolveProductionVariables(snapshotRegistry, resolutionContext).values["production.publicFalse"], false);
snapshot.values["production.publicStructured"].nested.score = 999;
snapshot.context.tournamentId = "tampered";
snapshot.revisions["production.publicStructured"] = 999;
assert.deepEqual(snapshotRegistry, snapshotRegistryBefore);
const freshSnapshot = buildProductionVariablesSnapshot(snapshotRegistry, { ...resolutionContext, actor: OPERATOR }, { visibility: "public", now: T1 });
assert.equal(freshSnapshot.values["production.publicStructured"].nested.score, 69);
assert.equal(freshSnapshot.context.tournamentId, "tournament_test");

// Action Engine 1.1 performs all writes without touching Broadcast State or Program.
assert.equal(BROADCAST_ACTION_ENGINE_VERSION, "1.1.0");
const state = createInitialBroadcastState({ now: T0, session: { id: "variables_session", status: "active" } });
const stateBeforeActions = structuredClone(state);
let actionRegistry = { variablesVersion: PRODUCTION_VARIABLES_VERSION, revision: 0, tenantId: "tenant_test", variables: {}, createdAt: T0, updatedAt: T0 };
function actionContext(actor = SUPERVISOR) {
  return createBroadcastActionContext({
    state,
    variables: actionRegistry,
    actor,
    tenantId: "tenant_test",
    tournamentId: "tournament_test",
    visibility: "operational",
    now: T1
  });
}
function dispatchVariable(type, target, payload, actor = SUPERVISOR, idempotencyKey = null) {
  const action = createBroadcastAction(type, payload, {
    actionId: `action_${type.toLowerCase()}_${actionRegistry.revision}`,
    target,
    actor,
    idempotencyKey,
    now: T1
  });
  return dispatchBroadcastAction(action, actionContext(actor), { now: T1 });
}

let dispatched = dispatchVariable(ACTION_TYPES.REGISTER_VARIABLE, { variableId: "var_action_message" }, {
  expectedRevision: 0,
  variable: definition({ variableId: "var_action_message", key: "production.actionMessage", value: "Inicial" })
});
assert.equal(dispatched.result.success, true);
assert.deepEqual(dispatched.state, stateBeforeActions);
assert.equal(dispatched.variables.variables.var_action_message.value, "Inicial");
assert.equal(dispatched.auditEntry.actionType, ACTION_TYPES.REGISTER_VARIABLE);
assert.deepEqual(dispatched.outputs, {});
assert.deepEqual(dispatched.assets, {});
actionRegistry = dispatched.variables;

dispatched = dispatchVariable(ACTION_TYPES.SET_VARIABLE, { variableId: "var_action_message" }, {
  expectedRevision: 0, value: "En vivo"
}, OPERATOR, "set_variable_once");
assert.equal(dispatched.result.success, true);
assert.equal(dispatched.variables.variables.var_action_message.value, "En vivo");
assert.deepEqual(dispatched.state, stateBeforeActions);
assert.deepEqual(dispatched.outputs, {});
assert.deepEqual(dispatched.assets, {});
const idempotent = dispatchBroadcastAction(dispatched.action, actionContext(OPERATOR), { now: T2 });
assert.deepEqual(idempotent.result, dispatched.result);
actionRegistry = dispatched.variables;

for (const [type, expectedStatus] of [
  [ACTION_TYPES.DISABLE_VARIABLE, "disabled"],
  [ACTION_TYPES.ENABLE_VARIABLE, "active"]
]) {
  dispatched = dispatchVariable(type, { variableId: "var_action_message" }, {
    expectedRevision: actionRegistry.variables.var_action_message.revision
  }, OPERATOR);
  assert.equal(dispatched.result.success, true);
  assert.equal(dispatched.variables.variables.var_action_message.status, expectedStatus);
  assert.deepEqual(dispatched.state, stateBeforeActions);
  assert.deepEqual(dispatched.outputs, {});
  actionRegistry = dispatched.variables;
}
dispatched = dispatchVariable(ACTION_TYPES.RESET_VARIABLE, { variableId: "var_action_message" }, {
  expectedRevision: actionRegistry.variables.var_action_message.revision, strategy: "null"
}, GRAPHICS);
assert.equal(dispatched.variables.variables.var_action_message.value, null);
assert.deepEqual(dispatched.state, stateBeforeActions);
assert.deepEqual(dispatched.outputs, {});
assert.deepEqual(dispatched.assets, {});
actionRegistry = dispatched.variables;

dispatched = dispatchVariable(ACTION_TYPES.EXPIRE_VARIABLE, { variableId: "var_action_message" }, {
  expectedRevision: actionRegistry.variables.var_action_message.revision
});
assert.equal(dispatched.variables.variables.var_action_message.status, "expired");
assert.deepEqual(dispatched.state, stateBeforeActions);
assert.deepEqual(dispatched.outputs, {});
assert.deepEqual(dispatched.assets, {});
actionRegistry = dispatched.variables;

const stale = dispatchVariable(ACTION_TYPES.SET_VARIABLE, { variableId: "var_action_message" }, { expectedRevision: 0, value: "Stale" }, OPERATOR);
assert.equal(stale.result.code, ACTION_RESULT_CODES.STATE_REVISION_CONFLICT);
assert.deepEqual(stale.variables, actionRegistry);
const forbidden = dispatchVariable(ACTION_TYPES.SET_VARIABLE, { variableId: "var_action_message" }, {
  expectedRevision: actionRegistry.variables.var_action_message.revision, value: "Juez"
}, JUDGE);
assert.equal(forbidden.result.code, ACTION_RESULT_CODES.PERMISSION_DENIED);
assert.deepEqual(forbidden.variables, actionRegistry);

// Security strips executable values, symbols, cycles and dangerous keys while retaining valid falsy values.
let executed = false;
const structuredValue = {
  zero: 0, disabled: false, empty: "", nil: null, big: 1n,
  callback: () => { executed = true; }, symbol: Symbol("blocked")
};
structuredValue.self = structuredValue;
Object.defineProperty(structuredValue, "__proto__", { value: { polluted: true }, enumerable: true });
Object.defineProperty(structuredValue, "constructor", { value: { polluted: true }, enumerable: true });
Object.defineProperty(structuredValue, "prototype", { value: { polluted: true }, enumerable: true });
const secureVariable = normalizeProductionVariable(definition({
  variableId: "var_secure", key: "production.secure", dataType: "structured", schemaId: "production.key_value_v1", value: structuredValue
}), { now: T0 });
assert.equal(secureVariable.value.zero, 0);
assert.equal(secureVariable.value.disabled, false);
assert.equal(secureVariable.value.empty, "");
assert.equal(secureVariable.value.nil, null);
assert.equal(Object.hasOwn(secureVariable.value, "callback"), false);
assert.equal(Object.hasOwn(secureVariable.value, "symbol"), false);
assert.equal(Object.hasOwn(secureVariable.value, "big"), false);
assert.equal(Object.hasOwn(secureVariable.value, "self"), false);
assert.equal(Object.hasOwn(secureVariable.value, "__proto__"), false);
assert.equal(Object.hasOwn(secureVariable.value, "constructor"), false);
assert.equal(Object.hasOwn(secureVariable.value, "prototype"), false);
assert.equal(executed, false);
assert.equal({}.polluted, undefined);

for (const payload of [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "<iframe src='about:blank'></iframe>",
  "<object data='x'></object>",
  "<embed src='x'>"
]) {
  const normalized = normalizeProductionVariable(definition({
    variableId: "var_unsafe_text", key: "production.unsafeText", dataType: "text", value: payload
  }), { now: T0 });
  assert.equal(typeof normalized.value, "string");
  assert.equal(validateProductionVariable(normalized, { now: T0 }).valid, false, payload);
}

const giantStructured = Object.fromEntries(Array.from({ length: 1500 }, (_, index) => [`field_${index}`, index]));
assert.equal(validateProductionVariable(definition({
  variableId: "var_giant", key: "production.giant", dataType: "structured", schemaId: "production.key_value_v1",
  value: giantStructured
}), { now: T0 }).valid, false);
const tooDeep = { zero: 0, disabled: false, empty: "", nil: null };
let deepCursor = tooDeep;
for (let index = 0; index < 12; index += 1) {
  deepCursor.next = {};
  deepCursor = deepCursor.next;
}
assert.equal(validateProductionVariable(definition({
  variableId: "var_deep", key: "production.deep", dataType: "structured", schemaId: "production.key_value_v1", value: tooDeep
}), { now: T0 }).valid, false);

// Draft/disabled definitions can be removed without touching the source registry.
let removable = add({ revision: 0, variables: {}, tenantId: "tenant_test", createdAt: T0, updatedAt: T0 }, definition({
  variableId: "var_removable", key: "production.removable", status: "disabled"
}));
const removableBefore = structuredClone(removable);
const removed = removeProductionVariable(removable, "var_removable", { actor: SUPERVISOR, expectedRevision: 0, now: T1 });
assert.equal(Object.hasOwn(removed.variables, "var_removable"), false);
assert.deepEqual(removable, removableBefore);

console.log("production-variables.test.mjs: OK");
