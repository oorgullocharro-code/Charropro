import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BroadcastComponentError,
  COMPONENT_LIBRARY_VERSION,
  COMPONENT_STATES,
  COMPONENT_TYPES,
  COMPONENT_VISIBILITY,
  buildComponentInstance,
  buildComponentSnapshot,
  cloneBroadcastComponent,
  cloneComponentInstance,
  createBroadcastComponent,
  findBroadcastComponent,
  getComponentWarnings,
  listBroadcastComponents,
  normalizeBroadcastComponent,
  registerBroadcastComponent,
  removeBroadcastComponent,
  resolveComponentBindings,
  sanitizeComponentSnapshot,
  updateBroadcastComponent,
  validateBroadcastComponent,
  validateComponentInstance,
  validateComponentSnapshot
} from "../js/broadcast/componentLibrary.js";

const T0 = "2026-07-13T22:00:00.000Z";
const T1 = "2026-07-13T22:01:00.000Z";
const ACTOR = Object.freeze({ id: "component_architect", name: "Arquitecto", role: "supervisor" });

assert.equal(COMPONENT_LIBRARY_VERSION, "1.0.0");
assert.deepEqual(COMPONENT_STATES, ["draft", "active", "disabled", "deprecated", "error"]);
assert.deepEqual(COMPONENT_VISIBILITY, ["public", "production", "operational", "restricted"]);
assert.equal(COMPONENT_TYPES.length, 19);
assert.ok(BroadcastComponentError.prototype instanceof Error);

function propertiesFor(type) {
  if (type === "text") return { text: "Marcador", multiline: true, ellipsis: true, maxLines: 2, textTransform: "uppercase" };
  if (["image", "logo", "icon", "qr", "sponsor"].includes(type)) return {
    assetRef: { assetId: `asset_${type}`, version: "1.0.0", variantId: "program" }
  };
  if (type === "timer") return { value: 0, display: "00:00", format: "mm:ss" };
  if (type === "score") return { label: "Total", value: 0 };
  if (type === "table") return { columns: ["Equipo", "Total"], rows: [["A", 0]], alignments: ["left", "right"] };
  if (type === "list") return { items: ["Primero", "Segundo"], spacing: 0, bullet: false };
  if (type === "ranking") return { entries: [{ id: "b", total: 10 }, { id: "a", total: 20 }] };
  if (type === "progress") return { value: 0, direction: "horizontal" };
  if (type === "ticker") return { items: ["Uno", "Dos"], separator: "" };
  return { enabled: false, zero: 0, empty: "", nil: null };
}

function definition(type, overrides = {}) {
  return {
    componentId: overrides.componentId || `component_${type}`,
    name: overrides.name || `Componente ${type}`,
    componentType: type,
    componentVersion: overrides.componentVersion || "1.0.0",
    componentRevision: overrides.componentRevision ?? 0,
    visibility: overrides.visibility || "production",
    status: overrides.status || "draft",
    bindings: overrides.bindings || [],
    style: overrides.style || {
      fontFamily: "Inter", fontSize: 32, fontWeight: 700, italic: false, underline: false,
      letterSpacing: 0, lineHeight: 1.2, color: "#ffffff", backgroundColor: "#000000",
      borderColor: "#d6ad43", borderWidth: 1, borderRadius: 4, opacity: 1,
      shadow: { x: 0, y: 2, blur: 4, spread: 0, color: "#000000" },
      textAlign: "left", verticalAlign: "middle", padding: 0, margin: 0
    },
    layout: overrides.layout || {
      x: 0, y: 0, width: 1, height: 1, rotation: 0, anchor: "center", scale: 1,
      zIndex: 0, safeArea: 0, responsive: { enabled: false }
    },
    animation: overrides.animation || {
      type: "none", duration: 0, delay: 0, easing: "linear", repeat: 0, direction: "normal", trigger: "manual"
    },
    properties: overrides.properties || propertiesFor(type),
    metadata: overrides.metadata || { fixture: true }
  };
}

// Every declared type can be normalized, validated and cloned without sharing references.
for (const type of COMPONENT_TYPES) {
  const input = definition(type);
  const before = structuredClone(input);
  const component = createBroadcastComponent(input, { now: T0, actor: ACTOR, random: () => 0.1 });
  assert.deepEqual(input, before, type);
  assert.equal(component.componentType, type);
  assert.equal(validateBroadcastComponent(component, { now: T0 }).valid, true, type);
  const cloned = cloneBroadcastComponent(component);
  assert.notEqual(cloned, component);
  cloned.layout.x = 99;
  assert.equal(component.layout.x, 0);
}

const text = createBroadcastComponent(definition("text", {
  componentId: "component_text_full",
  properties: { text: "Linea", multiline: true, ellipsis: true, maxLines: 3, textTransform: "capitalize" }
}), { now: T0, actor: ACTOR });
assert.equal(text.properties.multiline, true);
assert.equal(text.properties.ellipsis, true);
assert.equal(text.properties.maxLines, 3);
assert.equal(text.properties.textTransform, "capitalize");

// Registry operations are immutable and revision controlled.
let registry = { libraryVersion: COMPONENT_LIBRARY_VERSION, revision: 0, components: {}, createdAt: T0, updatedAt: T0 };
registry = registerBroadcastComponent(registry, definition("text", { componentId: "component_registry" }), {
  now: T0, actor: ACTOR, expectedRevision: 0
});
assert.equal(registry.revision, 1);
assert.equal(listBroadcastComponents(registry).length, 1);
assert.equal(findBroadcastComponent(registry, "component_registry").componentType, "text");
assert.throws(() => registerBroadcastComponent(registry, definition("text", { componentId: "component_registry" }), {
  now: T0, actor: ACTOR, expectedRevision: 1
}), /component-id-duplicate/);

const beforeUpdate = structuredClone(registry);
const updated = updateBroadcastComponent(registry, "component_registry", {
  name: "Texto actualizado", layout: { ...registry.components.component_registry.layout, x: 0.25 }
}, { now: T1, actor: ACTOR, expectedRevision: 0 });
assert.deepEqual(registry, beforeUpdate);
assert.equal(updated.components.component_registry.componentRevision, 1);
assert.equal(updated.components.component_registry.layout.x, 0.25);
assert.throws(() => updateBroadcastComponent(updated, "component_registry", { componentType: "score" }, {
  now: T1, actor: ACTOR, expectedRevision: 1
}), /component-patch-field-forbidden/);
assert.throws(() => updateBroadcastComponent(updated, "component_registry", { name: "Stale" }, {
  now: T1, actor: ACTOR, expectedRevision: 0
}), /component-revision-conflict/);
const removed = removeBroadcastComponent(updated, "component_registry", { now: T1, expectedRevision: 1 });
assert.equal(findBroadcastComponent(removed, "component_registry"), null);
assert.equal(findBroadcastComponent(updated, "component_registry").name, "Texto actualizado");

// Instances copy all mutable structures and never alter their component definition.
const sourceBeforeInstance = structuredClone(text);
const instance = buildComponentInstance(text, {
  instanceId: "instance_text_1",
  style: { opacity: 0 },
  layout: { x: 0.5 },
  properties: { text: "Instancia", multiline: false }
}, { now: T1, actor: ACTOR });
assert.equal(validateComponentInstance(instance).valid, true);
assert.equal(instance.style.opacity, 0);
assert.equal(instance.layout.x, 0.5);
assert.equal(instance.properties.text, "Instancia");
instance.properties.text = "Mutada";
assert.deepEqual(text, sourceBeforeInstance);
const clonedInstance = cloneComponentInstance(instance);
clonedInstance.layout.x = 1;
assert.equal(instance.layout.x, 0.5);

// Bindings resolve only from Production Variables, Broadcast Contract and Asset Manager identities.
const boundComponent = createBroadcastComponent(definition("score", {
  componentId: "component_bound",
  status: "active",
  visibility: "public",
  bindings: [
    { bindingId: "binding_variable", target: "properties.label", source: "production_variables", key: "production.message", required: true, visibility: "public" },
    { bindingId: "binding_contract", target: "properties.value", source: "broadcast_contract", path: "score.total", required: true, visibility: "public" },
    { bindingId: "binding_asset", target: "metadata.logo", source: "asset_manager", assetRef: { assetId: "asset_logo", version: "1.0.0", variantId: "program" }, visibility: "public" }
  ]
}), { now: T0, actor: ACTOR });
const bindingSources = {
  productionVariables: { values: { "production.message": "", "production.false": false } },
  broadcastContract: { score: { total: 0 } },
  assetManager: { assets: { asset_logo: { assetId: "asset_logo", version: "1.0.0" } } }
};
const bindingSourcesBefore = structuredClone(bindingSources);
const resolved = resolveComponentBindings(boundComponent, bindingSources, { visibility: "public" });
assert.equal(resolved.values["properties.label"], "");
assert.equal(resolved.values["properties.value"], 0);
assert.deepEqual(resolved.values["metadata.logo"], { assetId: "asset_logo", version: "1.0.0", variantId: "program" });
resolved.values["metadata.logo"].assetId = "mutated";
assert.deepEqual(bindingSources, bindingSourcesBefore);
assert.equal(resolveComponentBindings(createBroadcastComponent(definition("text", {
  componentId: "component_fallback",
  bindings: [{ bindingId: "binding_missing", target: "properties.text", source: "production_variables", key: "production.missing", fallback: false, visibility: "public" }]
}), { now: T0 }), {}, { visibility: "public" }).values["properties.text"], false);

for (const source of ["core", "firebase", "state", "live_current", "scores"]) {
  assert.equal(validateBroadcastComponent(definition("text", {
    componentId: `component_forbidden_${source}`,
    bindings: [{ bindingId: "binding_forbidden", target: "properties.text", source, path: "score.total" }]
  }), { now: T0 }).valid, false, source);
}

// Snapshots are visibility-aware, immutable and contain resolved values only.
const snapshot = buildComponentSnapshot(boundComponent, bindingSources, { visibility: "public", now: T1 });
assert.equal(validateComponentSnapshot(snapshot).valid, true);
assert.equal(snapshot.version, "1.0.0");
assert.equal(snapshot.resolvedBindings["properties.value"], 0);
const boundBeforeSnapshotMutation = structuredClone(boundComponent);
snapshot.component.style.opacity = 0.2;
snapshot.resolvedBindings["properties.value"] = 999;
assert.deepEqual(boundComponent, boundBeforeSnapshotMutation);
assert.deepEqual(bindingSources, bindingSourcesBefore);

const restricted = createBroadcastComponent(definition("text", {
  componentId: "component_restricted", visibility: "restricted", metadata: { internalNote: "No publicar" }
}), { now: T0, actor: ACTOR });
const blockedSnapshot = buildComponentSnapshot(restricted, {}, { visibility: "public", now: T1 });
assert.equal(blockedSnapshot.component, null);
assert.equal(blockedSnapshot.warnings.includes("component-visibility-blocked"), true);
const operationalSnapshot = buildComponentSnapshot(restricted, {}, { visibility: "restricted", now: T1 });
const publicSanitized = sanitizeComponentSnapshot({ ...operationalSnapshot, component: { ...operationalSnapshot.component, visibility: "public" } }, "public");
assert.equal(Object.hasOwn(publicSanitized.component, "createdBy"), false);
assert.equal(Object.hasOwn(publicSanitized.component, "metadata"), false);

// Type-specific models remain representational only.
const ranking = createBroadcastComponent(definition("ranking"), { now: T0 });
assert.deepEqual(ranking.properties.entries.map((entry) => entry.id), ["b", "a"]);
assert.equal(validateBroadcastComponent(definition("progress", { properties: { value: 101, direction: "horizontal" } }), { now: T0 }).valid, false);
assert.equal(createBroadcastComponent(definition("list")).properties.spacing, 0);
assert.equal(createBroadcastComponent(definition("ticker")).properties.separator, "");
assert.equal(createBroadcastComponent(definition("timer")).properties.value, 0);
assert.equal(createBroadcastComponent(definition("score")).properties.value, 0);

// Sanitization removes executable values, symbols, BigInt, cycles, prototypes and unsafe schemes.
let executed = false;
const hostileMetadata = {
  zero: 0,
  disabled: false,
  empty: "",
  nil: null,
  callback: () => { executed = true; },
  symbol: Symbol("blocked"),
  bigint: 1n
};
hostileMetadata.self = hostileMetadata;
Object.defineProperty(hostileMetadata, "__proto__", { value: { polluted: true }, enumerable: true });
Object.defineProperty(hostileMetadata, "constructor", { value: { polluted: true }, enumerable: true });
Object.defineProperty(hostileMetadata, "prototype", { value: { polluted: true }, enumerable: true });
const secure = createBroadcastComponent(definition("custom", {
  componentId: "component_secure", metadata: hostileMetadata
}), { now: T0 });
assert.equal(secure.metadata.zero, 0);
assert.equal(secure.metadata.disabled, false);
assert.equal(secure.metadata.empty, "");
assert.equal(secure.metadata.nil, null);
for (const key of ["callback", "symbol", "bigint", "self", "__proto__", "constructor", "prototype"]) {
  assert.equal(Object.hasOwn(secure.metadata, key), false, key);
}
assert.equal(executed, false);
assert.equal({}.polluted, undefined);

for (const payload of [
  "javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///tmp/asset",
  "<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "<iframe></iframe>", "<object></object>", "<embed>"
]) {
  assert.equal(validateBroadcastComponent(definition("text", {
    componentId: `component_unsafe_${Buffer.from(payload).toString("hex").slice(0, 20)}`,
    properties: { text: payload, multiline: false, ellipsis: false, maxLines: 1, textTransform: "none" }
  }), { now: T0 }).valid, false, payload);
}

for (const assetRef of [
  { assetId: "javascript:", version: "1.0.0", variantId: null },
  { assetId: "data:", version: "1.0.0", variantId: null },
  { assetId: "file://asset", version: "1.0.0", variantId: null },
  { assetId: "asset_ok", version: "1.0.0", variantId: null, url: "https://example.com" }
]) {
  assert.equal(validateBroadcastComponent(definition("image", { properties: { assetRef } }), { now: T0 }).valid, false);
}

const giant = createBroadcastComponent(definition("custom", {
  componentId: "component_giant",
  metadata: { items: Array.from({ length: 400 }, (_, index) => index) }
}), { now: T0 });
assert.equal(giant.metadata.items.length, 200);
assert.equal(getComponentWarnings(giant).some((warning) => warning.includes("array-truncated")), true);

// The pure module contains no renderer, DOM, Canvas, Firebase, persistence or OBS integration.
const source = await readFile(new URL("../js/broadcast/componentLibrary.js", import.meta.url), "utf8");
for (const forbidden of ["document.", "window.", "localStorage", "sessionStorage", "firebase", "live/current", "publicTournaments", "WebSocket", "canvas", "innerHTML", "outerHTML"]) {
  assert.equal(source.includes(forbidden), false, forbidden);
}

console.log("broadcast-component-library.test.mjs: OK");
