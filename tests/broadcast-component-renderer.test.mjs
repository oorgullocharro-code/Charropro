import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BroadcastComponentRendererError,
  COMPONENT_RENDERER_ERROR_CODES,
  COMPONENT_RENDERER_STATES,
  COMPONENT_RENDERER_VERSION,
  RENDERABLE_COMPONENT_TYPES,
  buildComponentRenderSnapshot,
  clearBroadcastComponentRenderer,
  cloneComponentRenderResult,
  createComponentRenderNode,
  createComponentRenderer,
  destroyComponentRenderer,
  getComponentRenderWarnings,
  getRenderedComponent,
  listRenderedComponents,
  removeBroadcastComponentRender,
  renderBroadcastComponent,
  updateBroadcastComponentRender,
  validateComponentRenderSnapshot,
  validateComponentRenderTarget
} from "../js/broadcast/componentRenderer.js";
import {
  COMPONENT_RENDERER_FIXTURE_TYPES,
  COMPONENT_RENDERER_OUTPUTS,
  buildComponentRendererFixture,
  getComponentRendererOutput
} from "../js/broadcast/fixtures/componentRendererFixtures.js";
import { buildComponentInstance, createBroadcastComponent } from "../js/broadcast/componentLibrary.js";

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
const ACTOR = Object.freeze({ id: "renderer_test", name: "Renderer test", role: "production" });

assert.equal(COMPONENT_RENDERER_VERSION, "1.0.0");
assert.equal(COMPONENT_RENDERER_STATES.includes("destroyed"), true);
assert.deepEqual([...RENDERABLE_COMPONENT_TYPES].sort(), [...COMPONENT_RENDERER_FIXTURE_TYPES].sort());
assert.equal(RENDERABLE_COMPONENT_TYPES.includes("custom"), false);
assert.equal(BroadcastComponentRendererError.prototype instanceof Error, true);
assert.equal(COMPONENT_RENDERER_OUTPUTS.length, 3);

// Target validation accepts only controlled HTML elements.
const document = new MockDocument();
const target = document.createElement("section");
document.body.appendChild(target);
for (const invalid of [null, undefined, "#target", {}, document, document.defaultView]) {
  assert.equal(validateComponentRenderTarget(invalid).valid, false);
}
for (const tag of ["iframe", "object", "embed", "script", "svg"]) {
  const forbidden = document.createElement(tag);
  document.body.appendChild(forbidden);
  assert.equal(validateComponentRenderTarget(forbidden).valid, false, tag);
}
const disconnected = document.createElement("div");
assert.equal(validateComponentRenderTarget(disconnected).valid, false);
assert.equal(validateComponentRenderTarget(disconnected, { allowDisconnected: true }).valid, true);
assert.equal(validateComponentRenderTarget(target).valid, true);

const output = getComponentRendererOutput("component_16_9");
const foreignNode = document.createElement("div");
foreignNode.textContent = "Nodo ajeno";
target.appendChild(foreignNode);
const renderer = createComponentRenderer(target, {
  rendererId: "renderer_test_main",
  outputId: output.id,
  width: output.width,
  height: output.height,
  orientation: output.orientation,
  safeArea: output.safeArea,
  visibility: "production",
  now: T0
});
assert.equal(renderer.state, "ready");
assert.equal(target.children.includes(foreignNode), true);

// Every v1 type renders from a valid Component Instance without reordering source data.
for (const type of COMPONENT_RENDERER_FIXTURE_TYPES) {
  const fixture = buildComponentRendererFixture(type);
  const before = structuredClone(fixture.instance);
  const result = renderBroadcastComponent(renderer, fixture.instance, {
    renderId: `render_fixture_${type}`,
    resolvedBindings: fixture.resolvedBindings,
    resolvedContent: fixture.resolvedContent,
    resolvedAssets: fixture.resolvedAssets,
    fallback: fixture.fallback,
    now: T0
  });
  assert.equal(result.componentType, type);
  assert.equal(result.status, "rendered");
  assert.ok(result.node, type);
  assert.deepEqual(fixture.instance, before, type);
}
assert.equal(listRenderedComponents(renderer).length, COMPONENT_RENDERER_FIXTURE_TYPES.length);
const rankingFixture = buildComponentRendererFixture("ranking");
const rankingNode = getRenderedComponent(renderer, "render_fixture_ranking", { includeNode: true }).node;
assert.deepEqual(
  findByClass(rankingNode, "cp-component-ranking-name").map((node) => node.textContent),
  rankingFixture.resolvedContent.entries.map((entry) => entry.name)
);

// createComponentRenderNode is detached and custom is rejected with a controlled error.
const detachedFixture = buildComponentRendererFixture("text");
const detached = createComponentRenderNode(renderer, detachedFixture.instance, {
  resolvedContent: detachedFixture.resolvedContent
});
assert.equal(detached.parentNode, null);
const customComponent = createBroadcastComponent(componentDefinition("custom"), { now: T0, actor: ACTOR });
const customInstance = buildComponentInstance(customComponent, { instanceId: "renderer_custom_instance" }, { now: T0, actor: ACTOR });
assert.throws(
  () => renderBroadcastComponent(renderer, customInstance),
  (error) => error?.code === COMPONENT_RENDERER_ERROR_CODES.TYPE_UNSUPPORTED
);

// Dynamic text is always literal. Hostile HTML never creates executable nodes.
const hostilePayloads = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<iframe src=https://evil.test></iframe>",
  "<object data=x></object>",
  "<embed src=x>",
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "file:///tmp/evil",
  "vbscript:msgbox(1)"
];
hostilePayloads.forEach((payload, index) => {
  const fixture = buildComponentRendererFixture("text", { variant: index + 1 });
  fixture.instance.properties.text = payload;
  const result = renderBroadcastComponent(renderer, fixture.instance, { renderId: `hostile_${index}` });
  assert.equal(result.node.textContent, payload);
  assert.equal(findByTags(result.node, ["SCRIPT", "IFRAME", "OBJECT", "EMBED", "IMG"]).length, 0);
});

// Asset URLs are accepted only after explicit resolution and protocol/origin checks.
const assetFixture = buildComponentRendererFixture("image");
for (const url of ["javascript:alert(1)", "data:text/html,bad", "file:///tmp/bad", "vbscript:bad", "//evil.test/bad.png", "https://evil.test/bad.png"]) {
  const result = renderBroadcastComponent(renderer, assetFixture.instance, {
    renderId: `unsafe_asset_${url.replace(/[^a-z0-9]/gi, "_")}`,
    resolvedAssets: { asset_renderer_image: { assetId: "asset_renderer_image", url, authorized: true } },
    fallback: { type: "placeholder", text: "Bloqueado" }
  });
  assert.equal(findByTag(result.node, "IMG").length, 0, url);
  assert.equal(result.warnings.some((warning) => warning.includes("forbidden") || warning.includes("fallback")), true, url);
}
const safeAssetResult = renderBroadcastComponent(renderer, assetFixture.instance, {
  renderId: "safe_asset",
  resolvedAssets: assetFixture.resolvedAssets,
  resolvedContent: assetFixture.resolvedContent
});
assert.equal(findByTag(safeAssetResult.node, "IMG").length, 1);
const blobBlocked = renderBroadcastComponent(renderer, assetFixture.instance, {
  renderId: "blob_blocked",
  resolvedAssets: { asset_renderer_image: { assetId: "asset_renderer_image", url: "blob:https://charropro.test/example", authorized: true, blobAuthorized: true } },
  fallback: { type: "hide" }
});
assert.equal(blobBlocked.node.children.length, 0);
const blobAllowed = renderBroadcastComponent(renderer, assetFixture.instance, {
  renderId: "blob_allowed",
  resolvedAssets: { asset_renderer_image: { assetId: "asset_renderer_image", url: "blob:https://charropro.test/example", authorized: true, blobAuthorized: true } },
  allowBlobAssets: true
});
assert.equal(findByTag(blobAllowed.node, "IMG").length, 1);

// Fallback modes are explicit and never execute content.
for (const type of ["text", "placeholder", "hide", "empty", "error_badge"]) {
  const fixture = buildComponentRendererFixture("logo", { variant: type.length });
  const result = renderBroadcastComponent(renderer, fixture.instance, {
    renderId: `fallback_${type}`,
    resolvedAssets: {},
    fallback: { type, text: "<script>fallback</script>" }
  });
  assert.equal(result.warnings.includes(`component-render-fallback-${type}`), true, type);
  if (type === "hide") assert.equal(result.node.style.display, "none");
  if (type !== "hide") assert.equal(result.node.textContent.includes("<script>fallback</script>"), type !== "empty", type);
  assert.equal(findByTag(result.node, "SCRIPT").length, 0, type);
}

// Geometry preserves zero, safe areas and each supported output shape.
for (const outputDefinition of COMPONENT_RENDERER_OUTPUTS) {
  const outputTarget = document.createElement("div");
  document.body.appendChild(outputTarget);
  const outputRenderer = createComponentRenderer(outputTarget, {
    rendererId: `renderer_${outputDefinition.id}`,
    outputId: outputDefinition.id,
    width: outputDefinition.width,
    height: outputDefinition.height,
    orientation: outputDefinition.orientation,
    safeArea: outputDefinition.safeArea,
    allowDisconnected: false,
    now: T0
  });
  const fixture = buildComponentRendererFixture("rectangle");
  fixture.instance.layout = { ...fixture.instance.layout, x: 0, y: 0, width: 0.5, height: 0.5, scale: 1, rotation: 45 };
  fixture.instance.style = { ...fixture.instance.style, opacity: 0 };
  const result = renderBroadcastComponent(outputRenderer, fixture.instance, { renderId: `geometry_${outputDefinition.id}` });
  assert.equal(result.node.style.opacity, "0");
  assert.ok(result.node.style.left.endsWith("%"));
  assert.ok(result.node.style.top.endsWith("%"));
  assert.ok(result.node.style.transform.includes("rotate(45deg)"));
  assert.equal(outputRenderer.orientation, outputDefinition.orientation);
  destroyComponentRenderer(outputRenderer);
}

// Arbitrary styles, inline handlers and CSS payloads are ignored.
const styleFixture = buildComponentRendererFixture("text", { variant: 20 });
styleFixture.instance.style.fontFamily = "url(javascript:alert(1))";
styleFixture.instance.style.cssText = "position:fixed; inset:0";
styleFixture.instance.style.filter = "url(#bad)";
styleFixture.instance.style.behavior = "url(evil.htc)";
styleFixture.instance.style.onclick = "alert(1)";
const styleResult = renderBroadcastComponent(renderer, styleFixture.instance, { renderId: "unsafe_style" });
assert.equal(styleResult.node.style.fontFamily || "", "");
assert.equal(styleResult.node.style.cssText, undefined);
assert.equal(styleResult.node.getAttribute("onclick"), null);

// Update reuses the node for the same type and replaces it for a changed type.
const initial = buildComponentRendererFixture("text", { variant: 30 });
const rendered = renderBroadcastComponent(renderer, initial.instance, {
  renderId: "update_target",
  resolvedContent: initial.resolvedContent,
  now: T0
});
const originalNode = rendered.node;
const changed = buildComponentRendererFixture("text", { variant: 31 });
const changedBefore = structuredClone(changed.instance);
const updated = updateBroadcastComponentRender(renderer, "update_target", changed.instance, {
  resolvedContent: changed.resolvedContent,
  now: T1
});
assert.equal(updated.node, originalNode);
assert.equal(updated.renderId, "update_target");
assert.deepEqual(changed.instance, changedBefore);
const score = buildComponentRendererFixture("score", { variant: 32 });
const replaced = updateBroadcastComponentRender(renderer, "update_target", score.instance, {
  resolvedContent: score.resolvedContent,
  now: T1
});
assert.notEqual(replaced.node, originalNode);
assert.equal(replaced.renderId, "update_target");
assert.equal(findByRenderId(target, "update_target").length, 1);

// Remove is idempotent; clear and destroy affect only renderer-owned nodes.
assert.equal(removeBroadcastComponentRender(renderer, "update_target").removed, true);
assert.equal(removeBroadcastComponentRender(renderer, "update_target").removed, false);
const rendersBeforeClear = listRenderedComponents(renderer).length;
const clearResult = clearBroadcastComponentRenderer(renderer, { now: T1 });
assert.equal(clearResult.removedCount, rendersBeforeClear);
assert.equal(listRenderedComponents(renderer).length, 0);
assert.equal(target.children.includes(foreignNode), true);
assert.equal(renderer.state, "cleared");
destroyComponentRenderer(renderer, { now: T1 });
assert.equal(renderer.state, "destroyed");
assert.equal(target.children.includes(foreignNode), true);
assert.throws(
  () => renderBroadcastComponent(renderer, detachedFixture.instance),
  (error) => error?.code === COMPONENT_RENDERER_ERROR_CODES.DESTROYED
);

// Snapshots are serializable, visibility aware and detached from runtime DOM.
const snapshotTarget = document.createElement("div");
document.body.appendChild(snapshotTarget);
const snapshotRenderer = createComponentRenderer(snapshotTarget, { rendererId: "snapshot_renderer", outputId: "preview", now: T0 });
const publicFixture = buildComponentRendererFixture("score");
publicFixture.instance.visibility = "public";
renderBroadcastComponent(snapshotRenderer, publicFixture.instance, { renderId: "snapshot_public", resolvedContent: publicFixture.resolvedContent });
const restrictedFixture = buildComponentRendererFixture("text", { variant: 40 });
restrictedFixture.instance.visibility = "restricted";
renderBroadcastComponent(snapshotRenderer, restrictedFixture.instance, { renderId: "snapshot_restricted", visibility: "restricted" });
const snapshot = buildComponentRenderSnapshot(snapshotRenderer, { visibility: "public", now: T1 });
assert.equal(validateComponentRenderSnapshot(snapshot).valid, true);
assert.deepEqual(snapshot.renderIds, ["snapshot_public"]);
assert.equal(JSON.stringify(snapshot).includes("nodeType"), false);
assert.doesNotThrow(() => JSON.stringify(snapshot));
const clonedResult = cloneComponentRenderResult(getRenderedComponent(snapshotRenderer, "snapshot_public", { includeNode: true }));
assert.equal(clonedResult.node, null);
snapshot.components[0].status = "mutated";
assert.equal(getRenderedComponent(snapshotRenderer, "snapshot_public").status, "rendered");
assert.equal(getComponentRenderWarnings(snapshotRenderer).includes("component-render-visibility-blocked"), true);
destroyComponentRenderer(snapshotRenderer);

// The renderer source is pure browser rendering code without forbidden integration or execution paths.
const source = await readFile(new URL("../js/broadcast/componentRenderer.js", import.meta.url), "utf8");
for (const forbidden of [
  "innerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function", "setInterval",
  "requestAnimationFrame", "addEventListener", "WebSocket", "EventSource", "live/current",
  "publicTournaments", "../core/state.js", "firebase", ".program =", ".preview =", ".outputs ="
]) assert.equal(source.includes(forbidden), false, forbidden);
assert.equal(source.includes("textContent"), true);
assert.equal(source.includes("STYLE_PROPERTIES"), true);
assert.equal(source.includes("safeSetAttribute"), true);

console.log("broadcast-component-renderer.test.mjs: ok");

function componentDefinition(type) {
  return {
    componentId: `renderer_component_${type}`,
    name: `Renderer ${type}`,
    componentType: type,
    componentVersion: "1.0.0",
    componentRevision: 0,
    visibility: "production",
    status: "draft",
    bindings: [],
    style: { fontFamily: "Inter", fontSize: 32, fontWeight: 700, color: "#ffffff", backgroundColor: "#000000", borderColor: "#ffffff", borderWidth: 0, borderRadius: 0, opacity: 1, padding: 0, margin: 0 },
    layout: { x: 0.5, y: 0.5, width: 0.5, height: 0.2, rotation: 0, anchor: "center", scale: 1, zIndex: 1 },
    animation: { type: "none", duration: 0, delay: 0, easing: "linear", repeat: 0, direction: "normal", trigger: "manual" },
    properties: { value: "custom" },
    metadata: {}
  };
}

function findByClass(root, className) {
  return walk(root).filter((node) => String(node.className || "").split(/\s+/).includes(className));
}

function findByTag(root, tagName) {
  return walk(root).filter((node) => node.tagName === tagName);
}

function findByTags(root, tagNames) {
  const tags = new Set(tagNames);
  return walk(root).filter((node) => tags.has(node.tagName));
}

function findByRenderId(root, renderId) {
  return walk(root).filter((node) => node.getAttribute?.("data-render-id") === renderId);
}

function walk(root) {
  if (!root) return [];
  return [root, ...(root.children || []).flatMap(walk)];
}
