import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BroadcastTemplateError,
  TEMPLATE_ENGINE_VERSION,
  TemplateStates,
  TemplateTypes,
  TemplateVisibility,
  buildTemplateSnapshot,
  clearTemplateRegistry,
  cloneBroadcastTemplate,
  cloneTemplateResult,
  createBroadcastTemplate,
  duplicateBroadcastTemplate,
  getRegisteredTemplate,
  instantiateBroadcastTemplate,
  listRegisteredTemplates,
  registerBroadcastTemplate,
  removeBroadcastTemplate,
  resolveTemplateBindings,
  updateBroadcastTemplate,
  validateBroadcastTemplate,
  validateTemplateSnapshot
} from "../js/broadcast/templateEngine.js";
import {
  TEMPLATE_ENGINE_FIXTURE_TYPES,
  buildTemplateEngineFixture
} from "../fixtures/templateEngineFixtures.js";
import { createBroadcastComponent } from "../js/broadcast/componentLibrary.js";

const T0 = "2026-07-14T12:00:00.000Z";
const T1 = "2026-07-14T12:01:00.000Z";
const T2 = "2026-07-14T12:02:00.000Z";
const ACTOR_A = Object.freeze({ id: "operator_a", name: "Operador A", role: "producer" });
const ACTOR_B = Object.freeze({ id: "operator_b", name: "Operador B", role: "supervisor" });

assert.equal(TEMPLATE_ENGINE_VERSION, "1.0.0");
assert.equal(BroadcastTemplateError.prototype instanceof Error, true);
assert.deepEqual(TemplateVisibility, ["public", "production", "operational", "restricted"]);
assert.equal(TemplateStates.includes("active"), true);
assert.equal(TemplateTypes.includes("custom"), true);
assert.equal(TEMPLATE_ENGINE_FIXTURE_TYPES.length, 12);

// All requested fixtures are valid, contain only Component Instances and remain immutable.
for (const type of TEMPLATE_ENGINE_FIXTURE_TYPES) {
  const fixture = buildTemplateEngineFixture(type, { now: T0 });
  const before = structuredClone(fixture.template);
  const validation = validateBroadcastTemplate(fixture.template, { now: T0 });
  assert.equal(validation.valid, true, `${type}: ${validation.errors.join(",")}`);
  assert.equal(fixture.template.templateType, type);
  assert.ok(fixture.template.components.length > 0);
  fixture.template.components.forEach((component) => {
    assert.equal(typeof component.instanceId, "string");
    assert.equal(typeof component.componentId, "string");
    assert.equal(typeof component.componentType, "string");
    assert.equal(typeof component.instanceRevision, "number");
    assert.equal(component.libraryVersion, undefined);
  });
  cloneBroadcastTemplate(fixture.template).name = "mutated clone";
  assert.deepEqual(fixture.template, before);
  const instance = instantiateBroadcastTemplate(fixture.template, fixture.sources, { now: T1 });
  assert.equal(instance.templateInstance.templateType, type);
  assert.equal(validateTemplateSnapshot(instance.snapshot).valid, true);
}

// Canonical identity is explicit and only controlled APIs may change update identity.
const identityFixture = buildTemplateEngineFixture("scoreboard", { now: T0 });
const identityTemplate = createBroadcastTemplate({
  ...identityFixture.template,
  templateId: "template_identity_a",
  status: "valid",
  tenantId: "tenant_a",
  organizationId: "organization_a",
  tournamentId: "tournament_a",
  competitionId: "competition_a",
  createdBy: undefined,
  updatedBy: undefined
}, { now: T0, actor: ACTOR_A });
assert.equal(identityTemplate.status, "valid");
assert.equal(identityTemplate.state, "valid");
assert.equal(identityTemplate.tenantId, "tenant_a");
assert.equal(identityTemplate.organizationId, "organization_a");
assert.equal(identityTemplate.tournamentId, "tournament_a");
assert.equal(identityTemplate.competitionId, "competition_a");
assert.deepEqual(identityTemplate.createdBy, ACTOR_A);
assert.deepEqual(identityTemplate.updatedBy, ACTOR_A);
let identityRegistry = registerBroadcastTemplate(clearTemplateRegistry({}, { resetRevision: true, now: T0 }), identityTemplate, {
  expectedRevision: 0,
  now: T0
});
const registeredIdentity = getRegisteredTemplate(identityRegistry, identityTemplate.templateId);
identityRegistry = updateBroadcastTemplate(identityRegistry, identityTemplate.templateId, { description: "Actualizado" }, {
  expectedRevision: registeredIdentity.revision,
  expectedRegistryRevision: identityRegistry.revision,
  actor: ACTOR_B,
  now: T1
});
const updatedIdentity = getRegisteredTemplate(identityRegistry, identityTemplate.templateId);
assert.deepEqual(updatedIdentity.createdBy, ACTOR_A);
assert.deepEqual(updatedIdentity.updatedBy, ACTOR_B);
assert.equal(updatedIdentity.tenantId, "tenant_a");
for (const [field, value] of [["tenantId", "tenant_b"], ["createdBy", ACTOR_B], ["createdAt", T2], ["templateId", "other"]]) {
  const before = structuredClone(identityRegistry);
  assert.throws(
    () => updateBroadcastTemplate(identityRegistry, identityTemplate.templateId, { [field]: value }, {
      expectedRevision: updatedIdentity.revision,
      expectedRegistryRevision: identityRegistry.revision,
      actor: ACTOR_B,
      now: T2
    }),
    (error) => error?.code === `template-patch-field-forbidden:${field}`
  );
  assert.deepEqual(identityRegistry, before);
}

// Published templates are immutable; only the controlled deprecation transition is permitted.
const publishedTemplate = createBroadcastTemplate({
  ...identityFixture.template,
  templateId: "template_published_a",
  status: "published",
  tenantId: "tenant_a",
  createdBy: undefined,
  updatedBy: undefined
}, { now: T0, actor: ACTOR_A });
let publishedRegistry = registerBroadcastTemplate(clearTemplateRegistry({}, { resetRevision: true, now: T0 }), publishedTemplate, {
  expectedRevision: 0,
  now: T0
});
const publishedBefore = structuredClone(publishedRegistry);
assert.throws(
  () => updateBroadcastTemplate(publishedRegistry, publishedTemplate.templateId, { metadata: { changed: true } }, {
    expectedRevision: publishedTemplate.revision,
    expectedRegistryRevision: publishedRegistry.revision,
    actor: ACTOR_B,
    now: T1
  }),
  (error) => error?.code === "template-published-immutable"
);
assert.deepEqual(publishedRegistry, publishedBefore);
publishedRegistry = updateBroadcastTemplate(publishedRegistry, publishedTemplate.templateId, { status: "deprecated" }, {
  expectedRevision: publishedTemplate.revision,
  expectedRegistryRevision: publishedRegistry.revision,
  actor: ACTOR_B,
  now: T1
});
const deprecatedTemplate = getRegisteredTemplate(publishedRegistry, publishedTemplate.templateId);
assert.equal(deprecatedTemplate.status, "deprecated");
assert.equal(deprecatedTemplate.revision, 1);
assert.equal(deprecatedTemplate.createdAt, T0);
assert.equal(deprecatedTemplate.updatedAt, T1);

// Layout modes, output IDs and zero-like defaults are preserved without a layout engine.
for (const mode of ["absolute", "stack", "row", "column", "grid", "overlay", "safe_area"]) {
  const fixture = buildTemplateEngineFixture("full_screen", { now: T0, variant: mode.length });
  const template = createBroadcastTemplate({
    ...fixture.template,
    templateId: `template_layout_${mode}`,
    layout: { ...fixture.template.layout, mode, columns: mode === "grid" ? 2 : null, rows: mode === "grid" ? 2 : null },
    defaults: { zero: 0, enabled: false, empty: "", nullable: null }
  }, { now: T0 });
  assert.equal(template.layout.mode, mode);
  assert.deepEqual(template.outputs, ["preview", "program"]);
  assert.deepEqual(template.defaults, { zero: 0, enabled: false, empty: "", nullable: null });
}

// Non-finite template layout values are rejected instead of silently becoming zero.
const layoutFixture = buildTemplateEngineFixture("full_screen", { now: T0 });
for (const [label, layout] of [
  ["z-index-nan", { ...layoutFixture.template.layout, zIndex: Number.NaN }],
  ["gap-infinity", { ...layoutFixture.template.layout, gap: Number.POSITIVE_INFINITY }],
  ["width-negative-infinity", { ...layoutFixture.template.layout, width: Number.NEGATIVE_INFINITY }],
  ["padding-nan", { ...layoutFixture.template.layout, padding: { ...layoutFixture.template.layout.padding, left: Number.NaN } }],
  ["safe-area-infinity", { ...layoutFixture.template.layout, safeArea: { ...layoutFixture.template.layout.safeArea, top: Number.POSITIVE_INFINITY } }]
]) {
  assert.throws(
    () => createBroadcastTemplate({ ...layoutFixture.template, templateId: `template_layout_${label}`, layout }, { now: T0 }),
    (error) => error?.code === "template-layout-non-finite",
    label
  );
}
const zeroLayout = createBroadcastTemplate({
  ...layoutFixture.template,
  templateId: "template_layout_zero",
  layout: { ...layoutFixture.template.layout, zIndex: 0, gap: 0, x: 0, y: 0, width: 0, height: 0, padding: 0, margin: 0 }
}, { now: T0 });
assert.equal(zeroLayout.layout.zIndex, 0);
assert.equal(zeroLayout.layout.gap, 0);
assert.equal(zeroLayout.layout.width, 0);
let layoutRegistry = registerBroadcastTemplate(clearTemplateRegistry({}, { resetRevision: true, now: T0 }), zeroLayout, {
  expectedRevision: 0,
  now: T0
});
const layoutRegistryBefore = structuredClone(layoutRegistry);
assert.throws(
  () => updateBroadcastTemplate(layoutRegistry, zeroLayout.templateId, {
    layout: { ...zeroLayout.layout, margin: { ...zeroLayout.layout.margin, right: Number.NEGATIVE_INFINITY } }
  }, {
    expectedRevision: zeroLayout.revision,
    expectedRegistryRevision: layoutRegistry.revision,
    now: T1
  }),
  (error) => error?.code === "template-layout-non-finite"
);
assert.deepEqual(layoutRegistry, layoutRegistryBefore);

// Component Definitions are rejected; the engine accepts only Component Instances.
const definition = createBroadcastComponent({
  componentId: "component_definition_only",
  name: "Definition only",
  componentType: "text",
  status: "active",
  visibility: "production",
  properties: { text: "Definition" }
}, { now: T0 });
assert.throws(
  () => createBroadcastTemplate({ templateId: "template_definition_forbidden", templateType: "full_screen", name: "Definition", state: "active", visibility: "production", components: [definition] }, { now: T0 }),
  (error) => error?.code === "template-invalid"
);

// Functional in-memory registry: register, duplicate, update, remove, query and clear.
let registry = clearTemplateRegistry({}, { resetRevision: true, now: T0 });
assert.equal(registry.revision, 0);
for (const type of TEMPLATE_ENGINE_FIXTURE_TYPES) {
  const fixture = buildTemplateEngineFixture(type, { now: T0 });
  registry = registerBroadcastTemplate(registry, fixture.template, { expectedRevision: registry.revision, now: T0 });
}
assert.equal(listRegisteredTemplates(registry).length, 12);
assert.equal(listRegisteredTemplates(registry, { templateType: "timer" }).length, 1);
const lowerThird = getRegisteredTemplate(registry, "template_fixture_lower_third_1");
assert.equal(lowerThird.templateType, "lower_third");
const registryBeforeConflict = structuredClone(registry);
assert.throws(
  () => updateBroadcastTemplate(registry, lowerThird.templateId, { name: "Conflict" }, { expectedRevision: 99, now: T1 }),
  (error) => error?.code === "template-revision-conflict"
);
assert.deepEqual(registry, registryBeforeConflict);
registry = updateBroadcastTemplate(registry, lowerThird.templateId, { name: "Lower Third actualizado" }, {
  expectedRevision: lowerThird.revision,
  expectedRegistryRevision: registry.revision,
  now: T1
});
const updated = getRegisteredTemplate(registry, lowerThird.templateId);
assert.equal(updated.revision, 1);
assert.equal(updated.createdAt, lowerThird.createdAt);
assert.equal(updated.updatedAt, T1);
registry = duplicateBroadcastTemplate(registry, lowerThird.templateId, {
  templateId: "template_lower_third_copy",
  name: "Lower Third copia"
}, {
  expectedRevision: updated.revision,
  expectedRegistryRevision: registry.revision,
  actor: ACTOR_B,
  now: T2
});
const duplicate = getRegisteredTemplate(registry, "template_lower_third_copy");
assert.equal(duplicate.revision, 0);
assert.equal(duplicate.status, "draft");
assert.deepEqual(duplicate.createdBy, ACTOR_B);
assert.equal(duplicate.updatedBy, null);
assert.equal(duplicate.metadata.duplicatedFromTemplateId, lowerThird.templateId);
registry = removeBroadcastTemplate(registry, duplicate.templateId, {
  expectedRevision: duplicate.revision,
  expectedRegistryRevision: registry.revision,
  now: T2
});
assert.equal(getRegisteredTemplate(registry, duplicate.templateId), null);
assert.throws(
  () => removeBroadcastTemplate(registry, updated.templateId, { expectedRevision: updated.revision, expectedRegistryRevision: registry.revision, now: T2 }),
  (error) => error?.code === "template-remove-active-forbidden"
);
const cleared = clearTemplateRegistry(registry, { now: T2 });
assert.equal(listRegisteredTemplates(cleared).length, 0);
assert.equal(cleared.revision, registry.revision + 1);

// Duplication preserves scope, resets lifecycle identity and strips executable or sensitive metadata.
const duplicateSource = createBroadcastTemplate({
  ...identityFixture.template,
  templateId: "template_duplicate_source",
  tenantId: "tenant_a",
  status: "published",
  metadata: {
    safeLabel: "visible",
    apiKey: "secret-key",
    plugins: ["runtime-plugin"],
    createdBy: "metadata_operator",
    nested: { values: [1, 2, 3] }
  },
  createdBy: undefined,
  updatedBy: undefined
}, { now: T0, actor: ACTOR_A });
let duplicateRegistry = registerBroadcastTemplate(clearTemplateRegistry({}, { resetRevision: true, now: T0 }), duplicateSource, {
  expectedRevision: 0,
  now: T0
});
assert.throws(
  () => duplicateBroadcastTemplate(duplicateRegistry, duplicateSource.templateId, { templateId: "template_without_actor" }, {
    expectedRevision: duplicateSource.revision,
    expectedRegistryRevision: duplicateRegistry.revision,
    now: T1
  }),
  (error) => error?.code === "template-duplicate-actor-required"
);
duplicateRegistry = duplicateBroadcastTemplate(duplicateRegistry, duplicateSource.templateId, {
  templateId: "template_duplicate_target",
  name: "Duplicado seguro"
}, {
  expectedRevision: duplicateSource.revision,
  expectedRegistryRevision: duplicateRegistry.revision,
  actor: ACTOR_B,
  now: T1
});
const safeDuplicate = getRegisteredTemplate(duplicateRegistry, "template_duplicate_target");
assert.equal(safeDuplicate.status, "draft");
assert.equal(safeDuplicate.revision, 0);
assert.equal(safeDuplicate.tenantId, "tenant_a");
assert.equal(safeDuplicate.sourceTemplateId, duplicateSource.templateId);
assert.deepEqual(safeDuplicate.createdBy, ACTOR_B);
assert.equal(safeDuplicate.updatedBy, null);
assert.equal(safeDuplicate.metadata.safeLabel, "visible");
assert.equal("apiKey" in safeDuplicate.metadata, false);
assert.equal("plugins" in safeDuplicate.metadata, false);
assert.equal("createdBy" in safeDuplicate.metadata, false);
safeDuplicate.components[0].properties.text = "Mutado";
safeDuplicate.metadata.nested.values.push(4);
assert.notEqual(duplicateSource.components[0].properties.text, "Mutado");
assert.deepEqual(duplicateSource.metadata.nested.values, [1, 2, 3]);

// Bindings resolve only through public APIs for variables, contract and asset identity.
const scoreboardFixture = buildTemplateEngineFixture("scoreboard", { now: T0 });
const resolved = resolveTemplateBindings(scoreboardFixture.template, scoreboardFixture.sources, { visibility: "production", now: T0 });
assert.equal(resolved.errors.length, 0);
assert.equal(resolved.resolvedBindings["defaults.title"], "Marcador");
const scoreInstance = scoreboardFixture.template.components.find((component) => component.componentType === "score");
assert.equal(resolved.componentBindings[scoreInstance.instanceId].values["properties.value"], 42);
const fallbackResolution = resolveTemplateBindings(scoreboardFixture.template, {}, { visibility: "production", now: T0 });
assert.equal(fallbackResolution.resolvedBindings["defaults.title"], "Marcador");
assert.equal(fallbackResolution.componentBindings[scoreInstance.instanceId].values["properties.value"], 0);
assert.ok(fallbackResolution.warnings.some((warning) => warning.includes("fallback-used")));

// Tenant boundaries apply to component instances, instantiation context and binding fallbacks.
const tenantAComponents = scoreboardFixture.template.components.map((component) => ({ ...component, tenantId: "tenant_a" }));
const tenantTemplate = createBroadcastTemplate({
  ...scoreboardFixture.template,
  templateId: "template_tenant_a",
  tenantId: "tenant_a",
  components: tenantAComponents,
  createdBy: undefined,
  updatedBy: undefined
}, { now: T0, actor: ACTOR_A });
assert.throws(
  () => createBroadcastTemplate({
    ...scoreboardFixture.template,
    templateId: "template_cross_tenant_component",
    tenantId: "tenant_a",
    components: scoreboardFixture.template.components.map((component, index) => ({
      ...component,
      tenantId: index === 0 ? "tenant_b" : "tenant_a"
    }))
  }, { now: T0, actor: ACTOR_A }),
  (error) => error?.code === "template-invalid" && error.details.errors.some((value) => value.includes("tenant-mismatch"))
);
assert.throws(
  () => createBroadcastTemplate({
    ...scoreboardFixture.template,
    templateId: "template_global_mixed_tenants",
    components: scoreboardFixture.template.components.map((component, index) => ({
      ...component,
      tenantId: index === 0 ? "tenant_a" : "tenant_b"
    }))
  }, { now: T0, authorizedTenantIds: ["tenant_a", "tenant_b"] }),
  (error) => error?.code === "template-invalid" && error.details.errors.includes("template-component-tenants-mixed")
);
assert.throws(
  () => instantiateBroadcastTemplate(tenantTemplate, scoreboardFixture.sources, { tenantId: "tenant_b", now: T1 }),
  (error) => error?.code === "template-tenant-context-mismatch"
);
assert.doesNotThrow(() => instantiateBroadcastTemplate(tenantTemplate, scoreboardFixture.sources, { tenantId: "tenant_a", now: T1 }));
assert.throws(
  () => instantiateBroadcastTemplate(scoreboardFixture.template, {
    ...scoreboardFixture.sources,
    productionVariables: { ...scoreboardFixture.sources.productionVariables, tenantId: "tenant_a" },
    broadcastContract: { ...scoreboardFixture.sources.broadcastContract, tenantId: "tenant_b" }
  }, { authorizedTenantIds: ["tenant_a", "tenant_b"], now: T1 }),
  (error) => error?.code === "template-binding-tenant-mismatch"
);
const tenantFallbackTemplate = createBroadcastTemplate({
  ...tenantTemplate,
  templateId: "template_tenant_fallback",
  bindings: [{
    bindingId: "binding_cross_tenant_fallback",
    target: "defaults.title",
    source: "production_variables",
    key: "production.blockTitle",
    fallback: { tenantId: "tenant_b", value: "No permitido" },
    visibility: "production"
  }]
}, { now: T0 });
assert.throws(
  () => instantiateBroadcastTemplate(tenantFallbackTemplate, {}, { tenantId: "tenant_a", now: T1 }),
  (error) => error?.code === "template-binding-tenant-mismatch"
);

// Instantiation prepares components and snapshots but never renders or changes operational state.
const instantiated = instantiateBroadcastTemplate(scoreboardFixture.template, scoreboardFixture.sources, {
  visibility: "production",
  templateInstanceId: "template_instance_scoreboard",
  now: T1
});
assert.equal(instantiated.templateInstance.state, "instantiated");
assert.equal(instantiated.templateInstance.templateId, scoreboardFixture.template.templateId);
assert.equal(instantiated.components.length, scoreboardFixture.template.components.length);
assert.equal(instantiated.snapshot.snapshotVersion, TEMPLATE_ENGINE_VERSION);
assert.equal(validateTemplateSnapshot(instantiated.snapshot).valid, true);
assert.equal("node" in instantiated, false);
assert.equal("renderer" in instantiated, false);
assert.equal("preview" in instantiated, false);
assert.equal("program" in instantiated, false);
const clonedResult = cloneTemplateResult(instantiated);
clonedResult.components[0].properties = { changed: true };
assert.notDeepEqual(clonedResult.components[0].properties, instantiated.components[0].properties);

// Snapshots are detached, serializable and visibility-aware.
const snapshot = buildTemplateSnapshot(scoreboardFixture.template, scoreboardFixture.sources, { visibility: "production", now: T1 });
assert.equal(validateTemplateSnapshot(snapshot).valid, true);
assert.doesNotThrow(() => JSON.stringify(snapshot));
const sourceName = scoreboardFixture.template.name;
snapshot.template.name = "mutated snapshot";
snapshot.components[0].instance.properties = { changed: true };
assert.equal(scoreboardFixture.template.name, sourceName);
assert.notDeepEqual(snapshot.components[0].instance.properties, scoreboardFixture.template.components[0].properties);
const restrictedComponentTemplate = createBroadcastTemplate({
  ...scoreboardFixture.template,
  templateId: "template_restricted_component",
  visibility: "restricted",
  components: scoreboardFixture.template.components.map((component, index) => ({ ...component, visibility: index === 0 ? "public" : "restricted" }))
}, { now: T0 });
const publicSnapshot = buildTemplateSnapshot(restrictedComponentTemplate, scoreboardFixture.sources, { visibility: "public", now: T1 });
assert.equal(publicSnapshot.components.length, 1);
assert.ok(publicSnapshot.warnings.includes("template-snapshot-component-visibility-filtered"));

// Public snapshots recursively remove private identity, secrets and executable metadata from components.
const privateComponent = {
  ...scoreboardFixture.template.components[0],
  visibility: "public",
  tenantId: "tenant-private",
  organizationId: "organization_private",
  createdBy: "template_operator",
  updatedBy: ACTOR_B,
  actorName: "private_actor_name",
  preparedBy: "private_preparer",
  sessionId: "session_private",
  permissions: { edit: true },
  metadata: {
    apiKey: "secret-key",
    accessToken: "access-secret",
    secretValue: "hidden",
    plugins: ["runtime-plugin"],
    nested: { credentials: "private-credential", safeLabel: "visible" },
    safeLabel: "visible"
  }
};
const privateTemplate = createBroadcastTemplate({
  ...scoreboardFixture.template,
  templateId: "template_public_snapshot_privacy",
  visibility: "public",
  status: "valid",
  tenantId: "tenant-private",
  organizationId: "organization_private",
  components: [privateComponent],
  defaults: { zero: 0, disabled: false, empty: "", nullable: null },
  metadata: {
    safeLabel: "template-visible",
    password: "private-password",
    diagnostics: { raw: "private-diagnostic" },
    hooks: ["runtime-hook"]
  },
  createdBy: undefined,
  updatedBy: undefined
}, { now: T0, actor: ACTOR_A });
const privateTemplateBefore = structuredClone(privateTemplate);
const strictPublicSnapshot = buildTemplateSnapshot(privateTemplate, scoreboardFixture.sources, {
  visibility: "public",
  tenantId: "tenant-private",
  now: T1
});
const publicJson = JSON.stringify(strictPublicSnapshot);
for (const privateValue of [
  "template_operator", "tenant-private", "organization_private", "secret-key", "access-secret",
  "private-credential", "private-password", "runtime-plugin", "runtime-hook", "apiKey", "plugins",
  "createdBy", "updatedBy", "private_actor_name", "private_preparer", "permissions", "sessionId", "diagnostics"
]) assert.equal(publicJson.includes(privateValue), false, privateValue);
assert.equal(publicJson.includes('"safeLabel":"visible"'), true);
assert.equal(publicJson.includes('"safeLabel":"template-visible"'), false);
assert.deepEqual(strictPublicSnapshot.templateInstance.defaults, { zero: 0, disabled: false, empty: "", nullable: null });
assert.deepEqual(privateTemplate, privateTemplateBefore);
const productionSnapshot = buildTemplateSnapshot(privateTemplate, scoreboardFixture.sources, {
  visibility: "production",
  tenantId: "tenant-private",
  now: T1
});
const productionJson = JSON.stringify(productionSnapshot);
assert.equal(productionJson.includes("tenant-private"), false);
assert.equal(productionJson.includes("operator_a"), false);
const operationalSnapshot = buildTemplateSnapshot(privateTemplate, scoreboardFixture.sources, {
  visibility: "operational",
  tenantId: "tenant-private",
  now: T1
});
assert.equal(JSON.stringify(operationalSnapshot).includes("operator_a"), true);
const restrictedSnapshot = buildTemplateSnapshot(privateTemplate, scoreboardFixture.sources, {
  visibility: "restricted",
  tenantId: "tenant-private",
  now: T1
});
const restrictedJson = JSON.stringify(restrictedSnapshot);
assert.equal(restrictedJson.includes("tenant-private"), true);
assert.equal(restrictedJson.includes("operator_a"), true);
for (const privateValue of ["secret-key", "access-secret", "private-credential", "private-password", "runtime-plugin", "runtime-hook"]) {
  assert.equal(restrictedJson.includes(privateValue), false, privateValue);
}

// Custom templates are declarative structures: empty or executable definitions are rejected.
assert.throws(
  () => createBroadcastTemplate({
    templateId: "template_custom_empty",
    templateType: "custom",
    name: "Custom vacío",
    visibility: "production",
    status: "valid",
    components: [],
    outputs: []
  }, { now: T0 }),
  (error) => error?.code === "custom-template-empty"
);
for (const [key, value] of [
  ["plugins", ["runtime-plugin"]],
  ["hooks", { beforeRender: "execute" }],
  ["handler", "run"],
  ["html", "<div>runtime</div>"],
  ["onClick", "execute"]
]) {
  assert.throws(
    () => createBroadcastTemplate({
      ...scoreboardFixture.template,
      templateId: `template_custom_${key.toLowerCase()}`,
      templateType: "custom",
      metadata: { [key]: value }
    }, { now: T0 }),
    (error) => error?.code === "custom-template-executable-metadata-forbidden",
    key
  );
}
const custom = createBroadcastTemplate({
  ...scoreboardFixture.template,
  templateId: "template_custom_structure",
  templateType: "custom",
  name: "Custom estructural",
  status: "valid",
  metadata: { structure: { variant: "compact", enabled: false, count: 0, label: "" } }
}, { now: T0 });
const customResult = instantiateBroadcastTemplate(custom, scoreboardFixture.sources, { now: T1 });
assert.ok(customResult.warnings.includes("template-custom-structure-only"));
assert.ok(customResult.components.length > 0);
assert.equal("renderer" in customResult, false);
assert.equal("node" in customResult, false);

// Invalid binding sources and expressions are rejected.
for (const binding of [
  { bindingId: "bad_source", target: "defaults.title", source: "firebase", path: "score.total", visibility: "production" },
  { bindingId: "bad_path", target: "defaults.title", source: "broadcast_contract", path: "score.total()", visibility: "production" },
  { bindingId: "bad_asset", target: "defaults.asset", source: "asset_manager", assetRef: { assetId: "asset", url: "https://evil.test" }, visibility: "production" }
]) {
  assert.throws(
    () => createBroadcastTemplate({ ...scoreboardFixture.template, templateId: `template_${binding.bindingId}`, bindings: [binding] }, { now: T0 }),
    (error) => error?.code === "template-invalid"
  );
}

// Security rejects executable markup, unsafe protocols and non-serializable values atomically.
for (const unsafe of [
  "<script>alert(1)</script>",
  "<iframe src=x>",
  "<object data=x>",
  "<embed src=x>",
  "javascript:alert(1)",
  "file:///tmp/test",
  "data:text/html,test",
  "vbscript:alert(1)"
]) {
  assert.throws(
    () => createBroadcastTemplate({ ...scoreboardFixture.template, templateId: `template_unsafe_${unsafe.length}`, description: unsafe }, { now: T0 }),
    (error) => error?.code === "template-invalid",
    unsafe
  );
}
for (const [label, value] of [["function", () => true], ["symbol", Symbol("unsafe")], ["bigint", 1n]]) {
  assert.throws(
    () => createBroadcastTemplate({ ...scoreboardFixture.template, templateId: `template_${label}`, metadata: { value } }, { now: T0 }),
    (error) => error?.code === "template-invalid",
    label
  );
}
const cyclic = {};
cyclic.self = cyclic;
assert.throws(
  () => createBroadcastTemplate({ ...scoreboardFixture.template, templateId: "template_cycle", metadata: cyclic }, { now: T0 }),
  (error) => error?.code === "template-invalid"
);
const dangerous = {};
Object.defineProperty(dangerous, "__proto__", { enumerable: true, value: { polluted: true } });
assert.throws(
  () => createBroadcastTemplate({ ...scoreboardFixture.template, templateId: "template_dangerous_key", metadata: dangerous }, { now: T0 }),
  (error) => error?.code === "template-invalid"
);
assert.equal({}.polluted, undefined);

// The engine imports Component Library only and contains no renderer/state/persistence integration.
const source = await readFile(new URL("../js/broadcast/templateEngine.js", import.meta.url), "utf8");
for (const forbidden of [
  "componentRenderer.js", "broadcastState.js", "broadcastOutput.js", "productionVariables.js", "assetManager.js",
  "firebase", "localStorage", "sessionStorage", "innerHTML", "insertAdjacentHTML", "eval(", "new Function",
  "WebSocket", "EventSource", "setInterval", ".program =", ".preview =", ".outputs ="
]) assert.equal(source.includes(forbidden), false, forbidden);
assert.equal(source.includes("componentLibrary.js"), true);
assert.equal(source.includes("resolveComponentBindings"), true);

console.log("broadcast-template-engine.test.mjs: OK");
