import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BroadcastTemplateRendererIntegrationError,
  TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES,
  TEMPLATE_RENDERER_INTEGRATION_STATES,
  TEMPLATE_RENDERER_INTEGRATION_VERSION,
  buildTemplateRenderSnapshot,
  clearTemplateRendererIntegration,
  cloneTemplateRenderResult,
  createTemplateRendererIntegration,
  destroyTemplateRendererIntegration,
  getRenderedTemplate,
  getTemplateRenderErrors,
  getTemplateRenderWarnings,
  listRenderedTemplates,
  prepareTemplateRender,
  removeTemplateRender,
  renderTemplateInstance,
  updateTemplateRender,
  validateTemplateRenderSnapshot,
  validateTemplateRendererIntegrationTarget
} from "../js/broadcast/templateRendererIntegration.js";
import {
  createComponentRenderer,
  destroyComponentRenderer,
  listRenderedComponents,
  renderBroadcastComponent
} from "../js/broadcast/componentRenderer.js?v=20260714-component-renderer-001-renderer-v1";
import {
  buildComponentInstance,
  createBroadcastComponent
} from "../js/broadcast/componentLibrary.js";
import { createBroadcastTemplate } from "../js/broadcast/templateEngine.js";
import {
  TEMPLATE_ENGINE_FIXTURE_TYPES,
  buildTemplateEngineFixture
} from "../fixtures/templateEngineFixtures.js";
import { buildComponentRendererFixture } from "../js/broadcast/fixtures/componentRendererFixtures.js";

class MockElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.namespaceURI = this.tagName === "SVG" ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml";
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.style = {};
    this.className = "";
    this.attributes = new Map();
    this._textContent = "";
    this.isConnected = false;
    this.clientWidth = 1920;
    this.clientHeight = 1080;
  }

  appendChild(child) {
    if (child.parentNode) child.remove();
    child.parentNode = this;
    child.setConnected(this.isConnected);
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  replaceChildren(...children) {
    this.children.forEach((child) => { child.parentNode = null; child.setConnected(false); });
    this.children = [];
    this._textContent = "";
    this.append(...children);
  }

  replaceWith(next) {
    if (!this.parentNode) return;
    const parent = this.parentNode;
    const index = parent.children.indexOf(this);
    this.parentNode = null;
    this.setConnected(false);
    next.parentNode = parent;
    next.setConnected(parent.isConnected);
    parent.children[index] = next;
  }

  remove() {
    if (!this.parentNode) return;
    const parent = this.parentNode;
    parent.children = parent.children.filter((child) => child !== this);
    this.parentNode = null;
    this.setConnected(false);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  setConnected(value) {
    this.isConnected = value;
    this.children.forEach((child) => child.setConnected(value));
  }

  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; child.setConnected(false); });
    this.children = [];
    this._textContent = String(value ?? "");
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.baseURI = "https://charropro.test/production-console.html";
    this.defaultView = { location: new URL(this.baseURI), HTMLElement: MockElement };
    this.body = new MockElement("body", this);
    this.body.isConnected = true;
  }

  createElement(tagName) {
    return new MockElement(tagName, this);
  }
}

const T0 = "2026-07-14T12:00:00.000Z";
const T1 = "2026-07-14T12:01:00.000Z";
const T2 = "2026-07-14T12:02:00.000Z";
const ACTOR = Object.freeze({ id: "template_renderer_test", name: "Template renderer test", role: "production" });
const OUTPUT = Object.freeze({ outputId: "template_preview_16_9", width: 1920, height: 1080, orientation: "landscape", safeArea: { top: 54, right: 96, bottom: 54, left: 96 } });

assert.equal(TEMPLATE_RENDERER_INTEGRATION_VERSION, "1.0.0");
assert.equal(TEMPLATE_RENDERER_INTEGRATION_STATES.includes("partially_rendered"), true);
assert.equal(BroadcastTemplateRendererIntegrationError.prototype instanceof Error, true);
assert.equal(Object.values(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES).length >= 10, true);

// The integration accepts only controlled HTML targets and preserves host children.
const document = new MockDocument();
const target = document.createElement("section");
document.body.appendChild(target);
for (const invalid of [null, undefined, "#target", {}, document, document.defaultView]) {
  assert.equal(validateTemplateRendererIntegrationTarget(invalid).valid, false);
}
for (const tag of ["iframe", "object", "embed", "script", "svg"]) {
  const forbidden = document.createElement(tag);
  document.body.appendChild(forbidden);
  assert.equal(validateTemplateRendererIntegrationTarget(forbidden).valid, false, tag);
}
const disconnected = document.createElement("div");
assert.equal(validateTemplateRendererIntegrationTarget(disconnected).valid, false);
assert.equal(validateTemplateRendererIntegrationTarget(disconnected, { allowDisconnected: true }).valid, true);
const foreignNode = document.createElement("div");
foreignNode.textContent = "Nodo ajeno";
target.appendChild(foreignNode);
const integration = createIntegration(target, "integration_main");
assert.equal(integration.state, "ready");
assert.equal(target.children.includes(foreignNode), true);
const controlledIntegrationRoot = findByClass(target, "cp-template-renderer-integration-root")[0];
controlledIntegrationRoot.clientWidth = 900;
controlledIntegrationRoot.clientHeight = 506;

// All twelve official template fixtures prepare and render through Component Renderer.
for (const type of TEMPLATE_ENGINE_FIXTURE_TYPES) {
  const fixture = buildTemplateEngineFixture(type);
  const before = structuredClone(fixture.template);
  const prepared = prepareFixture(fixture, {
    templateRenderId: `template_render_fixture_${type}`,
    templateInstanceId: `template_instance_fixture_${type}`
  });
  assert.equal(prepared.state, "prepared", type);
  assert.equal(prepared.errors.length, 0, type);
  const rendered = renderTemplateInstance(integration, prepared, { now: T0, includeRoot: true });
  assert.equal(["rendered", "partially_rendered"].includes(rendered.state), true, type);
  assert.equal(rendered.componentCount, fixture.template.components.length, type);
  assert.ok(rendered.root, type);
  const visualScale = Number(String(rendered.root.style.transform).match(/scale\(([^)]+)\)/)?.[1]);
  assert.equal(visualScale > 0 && visualScale < 1, true, `${type}: scaled to controlled target`);
  assert.deepEqual(fixture.template, before, type);
}
assert.equal(listRenderedTemplates(integration).length, TEMPLATE_ENGINE_FIXTURE_TYPES.length);

// Bindings are resolved before rendering and hostile HTML remains literal text.
const hostile = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<iframe>",
  "<object>",
  "<embed>",
  "javascript:alert(1)",
  "file:///tmp/test",
  "data:text/html,test",
  "vbscript:alert(1)"
].join("|");
const hostileFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_hostile" });
hostileFixture.sources.broadcastContract.participant.name = hostile;
const hostilePrepared = prepareFixture(hostileFixture, {
  templateRenderId: "template_render_hostile",
  templateInstanceId: "template_instance_hostile"
});
hostilePrepared.components[0].resolvedBindings["properties.text"] = hostile;
const hostileResult = renderTemplateInstance(integration, hostilePrepared, { now: T0, includeRoot: true });
assert.equal(hostileResult.root.textContent.includes(hostile), true);
assert.equal(findByTags(hostileResult.root, ["SCRIPT", "IMG", "IFRAME", "OBJECT", "EMBED"]).length, 0);

// DOM order is deterministic by declaration; CSS z-index remains authoritative for visual stacking.
const orderFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_order" });
orderFixture.template.components[0].layout.zIndex = 8;
orderFixture.template.components[1].layout.zIndex = 2;
const orderPrepared = prepareFixture(orderFixture, {
  templateRenderId: "template_render_order",
  templateInstanceId: "template_instance_order"
});
assert.deepEqual(orderPrepared.componentOrder, [
  orderFixture.template.components[0].instanceId,
  orderFixture.template.components[1].instanceId
]);
const orderRendered = renderTemplateInstance(integration, orderPrepared, { now: T0, includeRoot: true });
assert.deepEqual(orderRendered.root.children.map((node) => node.style.zIndex), ["8", "2"]);

const stableOrderFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_stable_order" });
stableOrderFixture.template.components.forEach((component) => { component.layout.zIndex = 5; });
const stableOrderPrepared = prepareFixture(stableOrderFixture, {
  templateRenderId: "template_render_stable_order",
  templateInstanceId: "template_instance_stable_order"
});
const reversedDelivery = structuredClone(stableOrderPrepared);
reversedDelivery.templateRenderId = "template_render_stable_order_reversed";
reversedDelivery.components.reverse();
const stableOrderResult = renderTemplateInstance(integration, stableOrderPrepared, { now: T0, includeRoot: true });
const reversedOrderResult = renderTemplateInstance(integration, reversedDelivery, { now: T0, includeRoot: true });
assert.deepEqual(reversedOrderResult.componentOrder, stableOrderResult.componentOrder);
assert.deepEqual(
  reversedOrderResult.root.children.map((node) => node.getAttribute("data-instance-id")),
  stableOrderResult.root.children.map((node) => node.getAttribute("data-instance-id"))
);

// Update keeps one template root, updates bindings and removes absent instances without duplication.
const updateFixture = buildTemplateEngineFixture("scoreboard", { templateId: "template_update" });
const updateSources = structuredClone(updateFixture.sources);
const firstPrepared = prepareTemplateRender(updateFixture.template, updateSources, prepareOptions({
  templateRenderId: "template_render_update",
  templateInstanceId: "template_instance_update",
  now: T0
}));
const firstRender = renderTemplateInstance(integration, firstPrepared, { now: T0, includeRoot: true });
const stableRoot = firstRender.root;
updateSources.broadcastContract.score.total = 99;
const secondPrepared = prepareTemplateRender(updateFixture.template, updateSources, prepareOptions({
  templateRenderId: "template_render_update",
  templateInstanceId: "template_instance_update",
  now: T1
}));
const secondRender = updateTemplateRender(integration, "template_render_update", secondPrepared, { now: T1, includeRoot: true });
assert.equal(secondRender.root, stableRoot);
assert.equal(secondRender.componentCount, 2);
assert.equal(findByAttribute(stableRoot, "data-render-id").length, 2);
assert.equal(stableRoot.textContent.includes("99"), true);
updateSources.broadcastContract.team.name = "Equipo actualizado";
const textPrepared = prepareTemplateRender(updateFixture.template, updateSources, prepareOptions({
  templateRenderId: "template_render_update",
  templateInstanceId: "template_instance_update",
  now: T1
}));
const textUpdated = updateTemplateRender(integration, "template_render_update", textPrepared, { now: T1, includeRoot: true });
assert.equal(textUpdated.root.textContent.includes("Equipo actualizado"), true);

const oneComponentTemplate = structuredClone(updateFixture.template);
oneComponentTemplate.components = [oneComponentTemplate.components[0]];
const reducedPrepared = prepareTemplateRender(oneComponentTemplate, updateSources, prepareOptions({
  templateRenderId: "template_render_update",
  templateInstanceId: "template_instance_update",
  now: T2
}));
const reduced = updateTemplateRender(integration, "template_render_update", reducedPrepared, { now: T2, includeRoot: true });
assert.equal(reduced.componentCount, 1);
assert.equal(findByAttribute(stableRoot, "data-render-id").length, 1);

const restoredPrepared = prepareTemplateRender(updateFixture.template, updateSources, prepareOptions({
  templateRenderId: "template_render_update",
  templateInstanceId: "template_instance_update",
  now: T2
}));
const restored = updateTemplateRender(integration, "template_render_update", restoredPrepared, { now: T2, includeRoot: true });
assert.equal(restored.componentCount, 2);
assert.equal(findByAttribute(stableRoot, "data-render-id").length, 2);

const timerReplacement = structuredClone(buildTemplateEngineFixture("timer").template.components[0]);
timerReplacement.instanceId = updateFixture.template.components[0].instanceId;
const typeChangedTemplate = structuredClone(oneComponentTemplate);
typeChangedTemplate.components = [timerReplacement];
const typeChangedPrepared = prepareTemplateRender(typeChangedTemplate, buildTemplateEngineFixture("timer").sources, prepareOptions({
  templateRenderId: "template_render_update",
  templateInstanceId: "template_instance_update",
  now: T2
}));
const typeChanged = updateTemplateRender(integration, "template_render_update", typeChangedPrepared, { now: T2, includeRoot: true });
assert.equal(typeChanged.componentCount, 1);
assert.equal(findByAttribute(stableRoot, "data-component-type")[0].getAttribute("data-component-type"), "timer");

const assetFixture = buildTemplateEngineFixture("bug", { templateId: "template_asset_update" });
const assetPrepared = prepareFixture(assetFixture, {
  templateRenderId: "template_render_asset_update",
  templateInstanceId: "template_instance_asset_update"
});
const assetRendered = renderTemplateInstance(integration, assetPrepared, { now: T0, includeRoot: true });
const assetRoot = assetRendered.root;
const nextAssetTemplate = structuredClone(assetFixture.template);
nextAssetTemplate.components[0].bindings[0].assetRef.assetId = "asset-sponsor";
const nextAssetPrepared = prepareTemplateRender(nextAssetTemplate, assetFixture.sources, prepareOptions({
  templateRenderId: "template_render_asset_update",
  templateInstanceId: "template_instance_asset_update",
  now: T1
}));
assert.equal(nextAssetPrepared.components[0].resolvedBindings["properties.assetRef"].assetId, "asset-sponsor");
const assetUpdated = updateTemplateRender(integration, "template_render_asset_update", nextAssetPrepared, { now: T1, includeRoot: true });
assert.equal(assetUpdated.root, assetRoot);
assert.equal(assetUpdated.componentCount, 1);

// Optional unsupported components degrade safely; required ones block before DOM unless a valid fallback exists.
const optionalCustom = buildCustomTemplate(false, "template_custom_optional");
const optionalPrepared = prepareTemplateRender(optionalCustom.template, optionalCustom.sources, prepareOptions({
  templateRenderId: "template_render_custom_optional",
  templateInstanceId: "template_instance_custom_optional"
}));
assert.equal(optionalPrepared.errors.length, 0);
const optionalResult = renderTemplateInstance(integration, optionalPrepared, { now: T0 });
assert.equal(optionalResult.state, "partially_rendered");
assert.equal(optionalResult.failedCount, 1);

const bestEffortFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_best_effort_sequence" });
const optionalMiddle = buildCustomTemplate(false, "template_best_effort_middle").instance;
const bestEffortThird = structuredClone(bestEffortFixture.template.components[1]);
bestEffortThird.instanceId = "template_best_effort_third";
bestEffortFixture.template.components = [bestEffortFixture.template.components[0], optionalMiddle, bestEffortThird];
const bestEffortPrepared = prepareTemplateRender(bestEffortFixture.template, bestEffortFixture.sources, prepareOptions({
  templateRenderId: "template_render_best_effort_sequence",
  templateInstanceId: "template_instance_best_effort_sequence"
}));
const bestEffortResult = renderTemplateInstance(integration, bestEffortPrepared, { now: T0, includeRoot: true });
assert.equal(bestEffortResult.state, "partially_rendered");
assert.equal(bestEffortResult.componentCount, 3);
assert.equal(bestEffortResult.renderedCount, 2);
assert.equal(bestEffortResult.failedCount, 1);
assert.equal(bestEffortResult.root.children.length, 2);
assert.equal(new Set(bestEffortResult.root.children.map((node) => node.getAttribute("data-instance-id"))).size, 2);
assert.equal(bestEffortResult.errors.some((error) => error.includes(optionalMiddle.instanceId)), true);

const requiredCustom = buildCustomTemplate(true, "template_custom_required");
const requiredPrepared = prepareTemplateRender(requiredCustom.template, requiredCustom.sources, prepareOptions({
  templateRenderId: "template_render_custom_required",
  templateInstanceId: "template_instance_custom_required"
}));
assert.equal(requiredPrepared.errors.some((error) => error.includes("type-unsupported")), true);
const integrationRoot = findByClass(target, "cp-template-renderer-integration-root")[0];
const childCountBeforeRequired = integrationRoot.children.length;
assert.throws(
  () => renderTemplateInstance(integration, requiredPrepared),
  (error) => error?.code === TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_BLOCKED
);
assert.equal(integrationRoot.children.length, childCountBeforeRequired);

// Strict rendering rolls back DOM and registration even after an earlier component was created.
const strictRendererTarget = document.createElement("section");
document.body.appendChild(strictRendererTarget);
const strictRenderer = createComponentRenderer(strictRendererTarget, {
  rendererId: "renderer_strict_rollback",
  outputId: "strict_rollback_output",
  width: 1920,
  height: 1080,
  orientation: "landscape",
  visibility: "production",
  now: T0
});
const strictTemplateFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_strict_rollback" });
strictTemplateFixture.template.components[1].metadata = {
  ...(strictTemplateFixture.template.components[1].metadata || {}),
  required: true
};
const thirdStrictComponent = structuredClone(strictTemplateFixture.template.components[0]);
thirdStrictComponent.instanceId = "template_strict_rollback_third";
strictTemplateFixture.template.components.push(thirdStrictComponent);
const strictDuplicateRenderId = `template_render_strict_rollback__${strictTemplateFixture.template.components[1].instanceId}`;
const strictDuplicateFixture = buildComponentRendererFixture("text");
renderBroadcastComponent(strictRenderer, strictDuplicateFixture.instance, {
  renderId: strictDuplicateRenderId,
  resolvedContent: strictDuplicateFixture.resolvedContent,
  now: T0
});
const strictIntegrationTarget = document.createElement("section");
document.body.appendChild(strictIntegrationTarget);
const strictIntegration = createTemplateRendererIntegration(strictIntegrationTarget, {
  integrationId: "integration_strict_rollback",
  renderer: strictRenderer,
  visibility: "production",
  now: T0
});
const strictPrepared = prepareTemplateRender(strictTemplateFixture.template, strictTemplateFixture.sources, prepareOptions({
  outputId: "strict_rollback_output",
  templateRenderId: "template_render_strict_rollback",
  templateInstanceId: "template_instance_strict_rollback"
}));
const unaffectedTemplateCount = listRenderedTemplates(integration).length;
assert.equal(strictPrepared.errors.length, 0);
assert.throws(
  () => renderTemplateInstance(strictIntegration, strictPrepared, { now: T0 }),
  (error) => error?.code === TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_REQUIRED_FAILED
);
assert.equal(findByClass(strictIntegrationTarget, "cp-template-render-root").length, 0);
assert.equal(listRenderedTemplates(strictIntegration).length, 0);
assert.deepEqual(listRenderedComponents(strictRenderer).map((item) => item.renderId), [strictDuplicateRenderId]);
assert.equal(listRenderedTemplates(integration).length, unaffectedTemplateCount);
destroyTemplateRendererIntegration(strictIntegration);
assert.notEqual(strictRenderer.state, "destroyed");
destroyComponentRenderer(strictRenderer);

const fallbackFixture = buildTemplateEngineFixture("lower_third");
const fallbackPrepared = prepareTemplateRender(requiredCustom.template, requiredCustom.sources, prepareOptions({
  templateRenderId: "template_render_custom_fallback",
  templateInstanceId: "template_instance_custom_fallback",
  fallbackComponents: { [requiredCustom.instance.instanceId]: fallbackFixture.template.components[0] }
}));
assert.equal(fallbackPrepared.errors.length, 0);
const fallbackResult = renderTemplateInstance(integration, fallbackPrepared, { now: T0 });
assert.equal(fallbackResult.state, "partially_rendered");
assert.equal(fallbackResult.components[0].fallbackUsed, true);

// Output and visibility mismatches are explicit and do not create a template root.
const mismatchFixture = buildTemplateEngineFixture("bug", { templateId: "template_mismatch" });
const mismatchPrepared = prepareTemplateRender(mismatchFixture.template, mismatchFixture.sources, prepareOptions({
  outputId: "template_preview_vertical",
  width: 1080,
  height: 1920,
  orientation: "portrait",
  templateRenderId: "template_render_mismatch",
  templateInstanceId: "template_instance_mismatch"
}));
assert.throws(
  () => renderTemplateInstance(integration, mismatchPrepared),
  (error) => error?.code === TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.OUTPUT_MISMATCH
);

// Removal is idempotent and clear removes only integration-owned renders from an injected renderer.
assert.equal(removeTemplateRender(integration, "template_render_hostile").removed, true);
assert.equal(removeTemplateRender(integration, "template_render_hostile").removed, false);
const externalTarget = document.createElement("section");
document.body.appendChild(externalTarget);
const externalRenderer = createComponentRenderer(externalTarget, {
  rendererId: "renderer_external",
  outputId: "external_output",
  width: 1920,
  height: 1080,
  orientation: "landscape",
  visibility: "production",
  now: T0
});
const unrelatedFixture = buildComponentRendererFixture("text");
renderBroadcastComponent(externalRenderer, unrelatedFixture.instance, {
  renderId: "unrelated_external_render",
  resolvedContent: unrelatedFixture.resolvedContent,
  now: T0
});
const injectedTarget = document.createElement("section");
document.body.appendChild(injectedTarget);
const injected = createTemplateRendererIntegration(injectedTarget, {
  integrationId: "integration_injected",
  renderer: externalRenderer,
  visibility: "production",
  now: T0
});
const injectedFixture = buildTemplateEngineFixture("timer", { templateId: "template_injected" });
const injectedPrepared = prepareTemplateRender(injectedFixture.template, injectedFixture.sources, prepareOptions({
  outputId: "external_output",
  templateRenderId: "template_render_injected",
  templateInstanceId: "template_instance_injected"
}));
renderTemplateInstance(injected, injectedPrepared, { now: T0 });
const secondInjectedTarget = document.createElement("section");
document.body.appendChild(secondInjectedTarget);
const secondInjected = createTemplateRendererIntegration(secondInjectedTarget, {
  integrationId: "integration_injected_second",
  renderer: externalRenderer,
  visibility: "production",
  now: T0
});
const secondInjectedFixture = buildTemplateEngineFixture("bug", { templateId: "template_injected_second" });
const secondInjectedPrepared = prepareTemplateRender(secondInjectedFixture.template, secondInjectedFixture.sources, prepareOptions({
  outputId: "external_output",
  templateRenderId: "template_render_injected_second",
  templateInstanceId: "template_instance_injected_second"
}));
renderTemplateInstance(secondInjected, secondInjectedPrepared, { now: T0 });
assert.equal(listRenderedComponents(externalRenderer).length, 3);
assert.equal(clearTemplateRendererIntegration(injected).removedCount, 1);
assert.deepEqual(listRenderedComponents(externalRenderer).map((item) => item.renderId), [
  "unrelated_external_render",
  `template_render_injected_second__${secondInjectedFixture.template.components[0].instanceId}`
]);
destroyTemplateRendererIntegration(injected);
assert.notEqual(externalRenderer.state, "destroyed");
assert.equal(listRenderedTemplates(secondInjected).length, 1);
destroyTemplateRendererIntegration(secondInjected);
assert.deepEqual(listRenderedComponents(externalRenderer).map((item) => item.renderId), ["unrelated_external_render"]);
assert.notEqual(externalRenderer.state, "destroyed");
destroyComponentRenderer(externalRenderer);

// Snapshots are serializable, detached, visibility-aware and free of runtime references.
const preparedForValues = prepareFixture(buildTemplateEngineFixture("scoreboard", { templateId: "template_snapshot_values" }), {
  templateRenderId: "template_render_snapshot_values",
  templateInstanceId: "template_instance_snapshot_values"
});
preparedForValues.resolvedBindings = { zero: 0, off: false, empty: "", nothing: null, token: "hidden" };
renderTemplateInstance(integration, preparedForValues, { now: T0 });
const productionSnapshot = buildTemplateRenderSnapshot(integration, { visibility: "production", now: T1 });
assert.equal(validateTemplateRenderSnapshot(productionSnapshot).valid, true);
assert.equal(productionSnapshot.integrationVersion, "1.0.0");
assert.equal(productionSnapshot.integrationId, integration.integrationId);
assert.deepEqual(productionSnapshot.resolution, { width: 1920, height: 1080 });
assert.equal(productionSnapshot.templateRenderIds.includes("template_render_snapshot_values"), true);
assert.equal(productionSnapshot.integration.tenantId, "tenant_alpha");
assert.equal(JSON.stringify(productionSnapshot).includes("nodeType"), false);
assert.doesNotThrow(() => JSON.stringify(productionSnapshot));
const valueTemplate = productionSnapshot.templates.find((item) => item.templateRenderId === "template_render_snapshot_values");
assert.deepEqual(valueTemplate.resolvedBindings, { zero: 0, off: false, empty: "", nothing: null });
const publicSnapshot = buildTemplateRenderSnapshot(integration, { visibility: "public", now: T1 });
assert.equal(JSON.stringify(publicSnapshot).includes("tenant_alpha"), false);
assert.equal(JSON.stringify(publicSnapshot).includes("hidden"), false);
productionSnapshot.templates[0].state = "mutated";
assert.notEqual(getRenderedTemplate(integration, productionSnapshot.templates[0].templateRenderId).state, "mutated");
const cloned = cloneTemplateRenderResult(getRenderedTemplate(integration, "template_render_update", { includeRoot: true }));
assert.equal(cloned.root, null);
assert.equal(getTemplateRenderWarnings(integration).length >= 1, true);
assert.equal(getTemplateRenderErrors(integration).length >= 1, true);

// Accessors, cycles, functions, symbols and BigInt are removed without execution.
let getterCalls = 0;
const hostileContext = {
  productionVariables: { values: { safe: 0, disabled: false, empty: "", nothing: null, bigint: 1n, fn: () => true, symbol: Symbol("x") } },
  broadcastContract: {},
  assetManager: {}
};
Object.defineProperty(hostileContext.broadcastContract, "participant", {
  enumerable: true,
  get() { getterCalls += 1; return { name: "No debe leerse" }; }
});
hostileContext.broadcastContract.cycle = hostileContext.broadcastContract;
const safePrepared = prepareTemplateRender(buildTemplateEngineFixture("full_screen").template, hostileContext, prepareOptions({
  templateRenderId: "template_render_safe_clone",
  templateInstanceId: "template_instance_safe_clone"
}));
assert.equal(getterCalls, 0);
assert.equal(safePrepared.errors.length, 0);

// Public visibility never elevates production components.
const publicTarget = document.createElement("section");
document.body.appendChild(publicTarget);
const publicIntegration = createTemplateRendererIntegration(publicTarget, {
  integrationId: "integration_public",
  outputId: OUTPUT.outputId,
  width: OUTPUT.width,
  height: OUTPUT.height,
  visibility: "public",
  now: T0
});
const publicFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_public_filter" });
const publicPrepared = prepareTemplateRender(publicFixture.template, publicFixture.sources, {
  ...prepareOptions({ templateRenderId: "template_render_public_filter", templateInstanceId: "template_instance_public_filter" }),
  tenantId: null,
  visibility: "public"
});
assert.equal(publicPrepared.componentInstances.length, 0);
assert.equal(publicPrepared.warnings.includes("template-render-component-visibility-filtered"), true);
const publicResult = renderTemplateInstance(publicIntegration, publicPrepared, { now: T0 });
assert.equal(publicResult.componentCount, 0);
destroyTemplateRendererIntegration(publicIntegration);

const visibilityTarget = document.createElement("section");
document.body.appendChild(visibilityTarget);
const visibilityIntegration = createTemplateRendererIntegration(visibilityTarget, {
  integrationId: "integration_visibility_update",
  outputId: OUTPUT.outputId,
  width: OUTPUT.width,
  height: OUTPUT.height,
  visibility: "production",
  tenantId: "tenant_alpha",
  now: T0
});
const visibilityFixture = buildTemplateEngineFixture("lower_third", { templateId: "template_visibility_update" });
const visibilityProductionPrepared = prepareTemplateRender(visibilityFixture.template, visibilityFixture.sources, prepareOptions({
  templateRenderId: "template_render_visibility_update",
  templateInstanceId: "template_instance_visibility_update"
}));
const visibilityProductionResult = renderTemplateInstance(visibilityIntegration, visibilityProductionPrepared, { now: T0, includeRoot: true });
assert.equal(visibilityProductionResult.root.children.length, 2);
const visibilityPublicPrepared = prepareTemplateRender(visibilityFixture.template, visibilityFixture.sources, prepareOptions({
  templateRenderId: "template_render_visibility_update",
  templateInstanceId: "template_instance_visibility_update",
  visibility: "public",
  tenantId: null,
  now: T1
}));
const visibilityPublicResult = updateTemplateRender(visibilityIntegration, "template_render_visibility_update", visibilityPublicPrepared, { now: T1, includeRoot: true });
assert.equal(visibilityPublicResult.componentCount, 0);
assert.equal(visibilityPublicResult.root.children.length, 0);
assert.equal(visibilityPublicResult.root.textContent.includes("tenant_alpha"), false);
destroyTemplateRendererIntegration(visibilityIntegration);

// Each supported simulated output preserves its declared resolution and orientation.
for (const outputDefinition of [
  { outputId: "template_preview_16_9_test", width: 1920, height: 1080, orientation: "landscape" },
  { outputId: "template_preview_vertical_test", width: 1080, height: 1920, orientation: "portrait" },
  { outputId: "template_preview_led_test", width: 3840, height: 720, orientation: "panoramic" }
]) {
  const outputTarget = document.createElement("section");
  outputTarget.clientWidth = outputDefinition.width;
  outputTarget.clientHeight = outputDefinition.height;
  document.body.appendChild(outputTarget);
  const outputIntegration = createTemplateRendererIntegration(outputTarget, { ...outputDefinition, visibility: "production", now: T0 });
  const outputFixture = buildTemplateEngineFixture("bug", { templateId: `template_${outputDefinition.outputId}` });
  const outputPrepared = prepareTemplateRender(outputFixture.template, outputFixture.sources, {
    ...outputDefinition,
    visibility: "production",
    templateRenderId: `render_${outputDefinition.outputId}`,
    templateInstanceId: `instance_${outputDefinition.outputId}`,
    now: T0
  });
  const outputResult = renderTemplateInstance(outputIntegration, outputPrepared, { now: T0 });
  assert.deepEqual(outputResult.resolution, { width: outputDefinition.width, height: outputDefinition.height });
  assert.equal(outputResult.orientation, outputDefinition.orientation);
  destroyTemplateRendererIntegration(outputIntegration);
}

// A single internally owned composition can be updated to another simulated output safely.
const reconfigureTarget = document.createElement("section");
document.body.appendChild(reconfigureTarget);
const reconfigureIntegration = createTemplateRendererIntegration(reconfigureTarget, {
  integrationId: "integration_reconfigure",
  outputId: "template_reconfigure_landscape",
  width: 1920,
  height: 1080,
  orientation: "landscape",
  visibility: "production",
  now: T0
});
const reconfigureFixture = buildTemplateEngineFixture("scoreboard", { templateId: "template_reconfigure" });
const landscapePrepared = prepareTemplateRender(reconfigureFixture.template, reconfigureFixture.sources, {
  outputId: "template_reconfigure_landscape",
  width: 1920,
  height: 1080,
  orientation: "landscape",
  visibility: "production",
  templateRenderId: "template_render_reconfigure",
  templateInstanceId: "template_instance_reconfigure",
  now: T0
});
renderTemplateInstance(reconfigureIntegration, landscapePrepared, { now: T0 });
const portraitPrepared = prepareTemplateRender(reconfigureFixture.template, reconfigureFixture.sources, {
  outputId: "template_reconfigure_portrait",
  width: 1080,
  height: 1920,
  orientation: "portrait",
  visibility: "production",
  templateRenderId: "template_render_reconfigure",
  templateInstanceId: "template_instance_reconfigure",
  now: T1
});
const portraitResult = updateTemplateRender(reconfigureIntegration, "template_render_reconfigure", portraitPrepared, { now: T1 });
assert.equal(portraitResult.templateRenderId, "template_render_reconfigure");
assert.deepEqual(portraitResult.resolution, { width: 1080, height: 1920 });
assert.equal(reconfigureIntegration.outputId, "template_reconfigure_portrait");
assert.equal(findByClass(reconfigureTarget, "cp-template-render-root").length, 1);
destroyTemplateRendererIntegration(reconfigureIntegration);

// Clear and destroy affect only owned runtime nodes and never host content.
const totalBeforeClear = listRenderedTemplates(integration).length;
assert.equal(clearTemplateRendererIntegration(integration, { now: T2 }).removedCount, totalBeforeClear);
assert.equal(listRenderedTemplates(integration).length, 0);
assert.equal(target.children.includes(foreignNode), true);
destroyTemplateRendererIntegration(integration, { now: T2 });
assert.equal(integration.state, "destroyed");
assert.equal(target.children.includes(foreignNode), true);
for (const operation of [
  () => renderTemplateInstance(integration, firstPrepared),
  () => updateTemplateRender(integration, "template_render_update", firstPrepared),
  () => removeTemplateRender(integration, "template_render_update"),
  () => clearTemplateRendererIntegration(integration),
  () => listRenderedTemplates(integration),
  () => buildTemplateRenderSnapshot(integration)
]) assert.throws(operation, (error) => error?.code === TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.INTEGRATION_DESTROYED);

// The module remains a pure integration layer without forbidden state, output or transport paths.
const source = await readFile(new URL("../js/broadcast/templateRendererIntegration.js", import.meta.url), "utf8");
for (const forbidden of [
  "innerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function", "setInterval",
  "requestAnimationFrame", "addEventListener", "WebSocket", "EventSource", "live/current",
  "publicTournaments", "../core/state.js", "firebase", ".program =", ".preview =", ".outputs ="
]) assert.equal(source.includes(forbidden), false, forbidden);
assert.equal(source.includes("instantiateBroadcastTemplate"), true);
assert.equal(source.includes("renderBroadcastComponent"), true);
assert.equal(source.includes("updateBroadcastComponentRender"), true);
assert.equal(source.includes("removeBroadcastComponentRender"), true);

console.log("template-renderer-integration.test.mjs: ok");

function createIntegration(targetElement, integrationId) {
  return createTemplateRendererIntegration(targetElement, {
    integrationId,
    outputId: OUTPUT.outputId,
    width: OUTPUT.width,
    height: OUTPUT.height,
    orientation: OUTPUT.orientation,
    safeArea: OUTPUT.safeArea,
    visibility: "production",
    tenantId: "tenant_alpha",
    now: T0
  });
}

function prepareOptions(overrides = {}) {
  return {
    outputId: OUTPUT.outputId,
    outputType: "preview",
    width: OUTPUT.width,
    height: OUTPUT.height,
    orientation: OUTPUT.orientation,
    safeArea: OUTPUT.safeArea,
    visibility: "production",
    tenantId: "tenant_alpha",
    now: T0,
    ...overrides
  };
}

function prepareFixture(fixture, overrides = {}) {
  return prepareTemplateRender(fixture.template, fixture.sources, prepareOptions(overrides));
}

function buildCustomTemplate(required, templateId) {
  const definition = createBroadcastComponent({
    componentId: `${templateId}_component`,
    name: "Componente custom",
    componentType: "custom",
    componentVersion: "1.0.0",
    componentRevision: 0,
    visibility: "production",
    status: "active",
    bindings: [],
    style: { fontFamily: "Inter", fontSize: 32, fontWeight: 700, color: "#ffffff", backgroundColor: "#000000", borderColor: "#ffffff", borderWidth: 0, borderRadius: 0, opacity: 1, padding: 0, margin: 0 },
    layout: { x: 0.5, y: 0.5, width: 0.5, height: 0.2, rotation: 0, anchor: "center", scale: 1, zIndex: 1 },
    animation: { type: "none", duration: 0, delay: 0, easing: "linear", repeat: 0, direction: "normal", trigger: "manual" },
    properties: { value: "custom" },
    metadata: { required }
  }, { now: T0, actor: ACTOR });
  const instance = buildComponentInstance(definition, { instanceId: `${templateId}_instance`, metadata: { required } }, { now: T0, actor: ACTOR });
  instance.metadata.required = required;
  const template = createBroadcastTemplate({
    templateId,
    templateVersion: "1.0.0",
    templateType: "custom",
    name: "Template custom",
    visibility: "production",
    status: "active",
    components: [instance],
    layout: { mode: "absolute", gap: 0, padding: 0, margin: 0, align: "stretch", justify: "start", anchor: "center", zIndex: 0, clip: true, safeArea: 0 },
    bindings: [],
    defaults: {},
    outputs: ["preview"],
    metadata: { declarative: true }
  }, { now: T0, actor: ACTOR });
  return { template, instance, sources: { productionVariables: {}, broadcastContract: {}, assetManager: {} } };
}

function findByClass(root, className) {
  return walk(root).filter((node) => String(node.className || "").split(/\s+/).includes(className));
}

function findByTags(root, tagNames) {
  const tags = new Set(tagNames);
  return walk(root).filter((node) => tags.has(node.tagName));
}

function findByAttribute(root, name) {
  return walk(root).filter((node) => node.getAttribute?.(name) !== null);
}

function walk(root) {
  if (!root) return [];
  return [root, ...(root.children || []).flatMap(walk)];
}
