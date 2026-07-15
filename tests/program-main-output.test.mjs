import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as api from "../js/broadcast/programMainOutput.js";
import {
  BroadcastProgramMainOutputError,
  PROGRAM_MAIN_OUTPUT_DISPLAY_MODES,
  PROGRAM_MAIN_OUTPUT_ERROR_CODES,
  PROGRAM_MAIN_OUTPUT_RENDER_STATES,
  PROGRAM_MAIN_OUTPUT_STATES,
  PROGRAM_MAIN_OUTPUT_VERSION,
  applyProgramMainProjection,
  buildProgramMainOutputSnapshot,
  clearProgramMainOutput,
  cloneProgramMainOutputResult,
  configureProgramMainOutput,
  createProgramMainOutput,
  destroyProgramMainOutput,
  getProgramMainOutput,
  getProgramMainOutputErrors,
  getProgramMainOutputStatus,
  getProgramMainOutputWarnings,
  mountProgramMainOutput,
  renderProgramMainProjection,
  setProgramMainOutputDisplayMode,
  setProgramMainOutputViewport,
  updateProgramMainOutput,
  validateProgramMainOutputConfig,
  validateProgramMainOutputSnapshot,
  validateProgramMainProjection
} from "../js/broadcast/programMainOutput.js";

class MockStyle {
  constructor() {
    this.properties = new Map();
  }

  setProperty(name, value) {
    this.properties.set(name, String(value));
  }

  removeProperty(name) {
    this.properties.delete(name);
  }
}

class MockElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.namespaceURI = "http://www.w3.org/1999/xhtml";
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.style = new MockStyle();
    this.className = "";
    this.attributes = new Map();
    this._textContent = "";
    this.clientWidth = 1920;
    this.clientHeight = 1080;
  }

  get isConnected() {
    let node = this;
    while (node) {
      if (node === this.ownerDocument?.body) return true;
      node = node.parentNode;
    }
    return false;
  }

  appendChild(child) {
    if (child.parentNode) child.remove();
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  replaceChildren(...children) {
    this.children.forEach((child) => { child.parentNode = null; });
    this.children = [];
    this._textContent = "";
    this.append(...children);
  }

  replaceWith(next) {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index < 0) return;
    if (next.parentNode) next.remove();
    this.parentNode.children[index] = next;
    next.parentNode = this.parentNode;
    this.parentNode = null;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  set textContent(value) {
    this.replaceChildren();
    this._textContent = String(value ?? "");
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (node) => {
      if (matchesSelector(node, selector)) matches.push(node);
      node.children.forEach(visit);
    };
    this.children.forEach(visit);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.body = new MockElement("body", this);
    this.defaultView = { location: { href: "http://127.0.0.1/" } };
  }

  createElement(tagName) {
    return new MockElement(tagName, this);
  }
}

function matchesSelector(node, selector) {
  if (selector.startsWith("[")) {
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (!match) return false;
    const value = node.getAttribute(match[1]);
    return match[2] === undefined ? value !== null : value === match[2];
  }
  if (selector.startsWith(".")) return String(node.className).split(/\s+/).includes(selector.slice(1));
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

const T0 = "2026-07-15T20:00:00.000Z";
const T1 = "2026-07-15T20:00:01.000Z";
const T2 = "2026-07-15T20:00:02.000Z";
const T3 = "2026-07-15T20:00:03.000Z";
const T4 = "2026-07-15T20:00:04.000Z";

function config(overrides = {}) {
  return {
    programMainOutputId: overrides.programMainOutputId || "program-main-output",
    browserOutputId: overrides.browserOutputId || "browser-output-program-main",
    routeId: overrides.routeId || "route-program-main",
    outputId: overrides.outputId || "program-main",
    routeType: overrides.routeType || "program_main",
    sourceType: overrides.sourceType || "program_snapshot",
    displayMode: overrides.displayMode || "fit",
    visibility: overrides.visibility || "public",
    resolution: overrides.resolution || { width: 1920, height: 1080 },
    orientation: overrides.orientation || "landscape",
    safeArea: overrides.safeArea || { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: overrides.transparentBackground ?? true,
    viewport: overrides.viewport ?? null,
    tenantId: overrides.tenantId ?? null,
    tournamentId: overrides.tournamentId ?? "tournament_a",
    competitionId: overrides.competitionId ?? "competition_a",
    sessionId: overrides.sessionId ?? null,
    metadata: overrides.metadata || { fixture: true }
  };
}

function component(id, type, layerId, order, geometry, properties = {}, content = {}, style = {}) {
  return {
    componentId: id,
    sourceComponentId: `source-${id}`,
    componentType: type,
    parentId: null,
    layerId,
    order,
    visibility: "public",
    geometry: {
      x: 0,
      y: 0,
      width: 300,
      height: 100,
      rotation: 0,
      anchor: "top-left",
      scale: 1,
      zIndex: order + 1,
      safeArea: {},
      responsive: {},
      ...geometry
    },
    opacity: style.opacity ?? 1,
    style: {
      color: "#ffffff",
      backgroundColor: "#111111",
      borderColor: "#d6ad43",
      borderWidth: 1,
      borderRadius: 4,
      fontFamily: "Arial",
      fontSize: 34,
      fontWeight: 700,
      opacity: style.opacity ?? 1,
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
      ...style
    },
    properties,
    content,
    data: {},
    assetRefs: [],
    metadata: { fixture: true }
  };
}

function teamComponents(teams, layerId = "scoreboard", startOrder = 0) {
  return teams.map((team, index) => component(
    `score-${team.id}`,
    "score",
    layerId,
    startOrder + index,
    { x: 120, y: 140 + (index * 120), width: 1120, height: 92, zIndex: 10 + index },
    { label: team.name, value: team.total },
    { label: team.name, value: team.total, active: team.active },
    { backgroundColor: team.active ? "#174ea6" : "#111111" }
  ));
}

const TEAMS_3 = Object.freeze([
  Object.freeze({ id: "laurel", name: "Rancho El Laurel", total: 203, active: false }),
  Object.freeze({ id: "jalisco", name: "Charros de Jalisco", total: 202, active: false }),
  Object.freeze({ id: "tijuana", name: "Rancheros de Tijuana", total: 201, active: true })
]);

const TEAMS_4 = Object.freeze([
  ...TEAMS_3,
  Object.freeze({ id: "centro", name: "Rancho del Centro", total: 198, active: false })
]);

function activeEnvelope(options = {}) {
  const revision = options.revision ?? 1;
  const teams = options.teams || TEAMS_3;
  const name = options.name || "A";
  const components = teamComponents(teams);
  const extras = options.extras || [
    component("sponsor", "sponsor", "sponsor", components.length, { x: 1400, y: 780, width: 360, height: 170, zIndex: 40 }, { assetRef: null }, { name: "Patrocinador A" }),
    component("bug", "badge", "bug", components.length + 1, { x: 1580, y: 60, width: 220, height: 70, zIndex: 80 }, { value: "EN VIVO" }, { value: "EN VIVO", variant: "live" })
  ];
  components.push(...extras);
  const layers = [...new Map(components.map((item) => [item.layerId, item.layerId])).keys()].map((layerId, index) => ({
    layerId,
    order: index,
    zIndex: Math.min(...components.filter((item) => item.layerId === layerId).map((item) => item.geometry.zIndex)),
    visibility: "public",
    componentIds: components.filter((item) => item.layerId === layerId).map((item) => item.componentId)
  }));
  const composition = {
    compositionVersion: "1.0.0",
    compositionId: `composition-${name}`,
    templateId: `template-${name}`,
    themeId: `theme-${name}`,
    appliedThemeId: `theme-${name}`,
    rootComponentId: components[0].componentId,
    components: structuredClone(components),
    layers: structuredClone(layers),
    order: components.map((item) => item.componentId),
    geometry: options.geometry || { width: 1920, height: 1080, orientation: "landscape" },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: options.transparentBackground ?? true,
    background: { type: "transparent" },
    data: {
      turn: { team: { id: "tijuana", name: "Rancheros de Tijuana" } },
      lastScoredTeam: { id: "jalisco", name: "Charros de Jalisco" }
    },
    metadata: { fixture: true, appliedThemeId: `theme-${name}` }
  };
  return {
    routeId: "route-program-main",
    routeType: "program_main",
    outputId: "program-main",
    sourceType: "program_snapshot",
    sourceRevision: revision,
    routeRevision: revision,
    status: options.status || "routed",
    visibility: options.visibility || "public",
    resolution: { width: composition.geometry.width, height: composition.geometry.height },
    projection: {
      kind: "program-main",
      state: options.programState || "program",
      projectionVersion: "1.0.0",
      programId: `program-${name}`,
      templateId: `template-${name}`,
      themeId: `theme-${name}`,
      appliedThemeId: `theme-${name}`,
      composition,
      components: structuredClone(components),
      layers: structuredClone(layers),
      sourceRevision: revision,
      programRevision: revision,
      visibility: options.visibility || "public",
      generatedAt: options.resolvedAt || T1
    },
    warnings: [],
    errors: [],
    resolvedAt: options.resolvedAt || T1,
    tenantId: options.tenantId,
    tournamentId: options.tournamentId || "tournament_a",
    competitionId: options.competitionId || "competition_a"
  };
}

function emptyEnvelope(revision = 1) {
  return {
    routeId: "route-program-main",
    routeType: "program_main",
    outputId: "program-main",
    sourceType: "program_snapshot",
    sourceRevision: revision,
    routeRevision: revision,
    status: "controlled-empty",
    visibility: "public",
    resolution: { width: 1920, height: 1080 },
    projection: {
      kind: "program-main",
      state: "controlled-empty",
      projectionVersion: "1.0.0",
      composition: null,
      components: [],
      layers: [],
      sourceRevision: revision,
      programRevision: null,
      generatedAt: T1
    },
    warnings: [],
    errors: [],
    resolvedAt: T1,
    tournamentId: "tournament_a",
    competitionId: "competition_a"
  };
}

function mounted(overrides = {}) {
  const document = new MockDocument();
  const container = document.createElement("section");
  document.body.appendChild(container);
  const instance = createProgramMainOutput({
    programMainOutputId: overrides.programMainOutputId,
    browserOutputId: overrides.browserOutputId,
    name: overrides.name
  }, { now: T0, debug: overrides.debug });
  configureProgramMainOutput(instance, config(overrides), { now: T0 });
  mountProgramMainOutput(instance, container, { now: T0 });
  return { document, container, instance };
}

const requiredExports = [
  "PROGRAM_MAIN_OUTPUT_VERSION", "PROGRAM_MAIN_OUTPUT_STATES", "PROGRAM_MAIN_OUTPUT_ERROR_CODES",
  "PROGRAM_MAIN_OUTPUT_DISPLAY_MODES", "PROGRAM_MAIN_OUTPUT_RENDER_STATES", "BroadcastProgramMainOutputError",
  "createProgramMainOutput", "configureProgramMainOutput", "mountProgramMainOutput", "applyProgramMainProjection",
  "updateProgramMainOutput", "clearProgramMainOutput", "destroyProgramMainOutput", "getProgramMainOutput",
  "getProgramMainOutputStatus", "getProgramMainOutputWarnings", "getProgramMainOutputErrors",
  "validateProgramMainOutputConfig", "validateProgramMainProjection", "validateProgramMainOutputSnapshot",
  "renderProgramMainProjection", "setProgramMainOutputViewport", "setProgramMainOutputDisplayMode",
  "buildProgramMainOutputSnapshot", "cloneProgramMainOutputResult"
];
requiredExports.forEach((name) => assert.equal(typeof api[name] === "function" || api[name] !== undefined, true, `missing export ${name}`));
assert.equal(PROGRAM_MAIN_OUTPUT_VERSION, "1.0.0");
assert.ok(PROGRAM_MAIN_OUTPUT_STATES.includes("destroyed"));
assert.ok(PROGRAM_MAIN_OUTPUT_RENDER_STATES.includes("ready"));
assert.deepEqual(PROGRAM_MAIN_OUTPUT_DISPLAY_MODES, ["fit", "fill", "native", "responsive", "fullscreen"]);
assert.equal(new BroadcastProgramMainOutputError("test").code, "test");

// Configuration is strict and keeps the one official route.
assert.equal(validateProgramMainOutputConfig(config()).valid, true);
for (const bad of [
  { routeId: "route-announcer-monitor" },
  { routeType: "announcer_monitor" },
  { sourceType: "preview_snapshot" },
  { outputId: "timer-display" },
  { visibility: "operational" },
  { orientation: "diagonal" },
  { displayMode: "zoom" },
  { resolution: { width: Infinity, height: 1080 } },
  { safeArea: { top: 60, right: 0, bottom: 50, left: 0, unit: "percent" } },
  { metadata: { token: "secret" } }
]) assert.equal(validateProgramMainOutputConfig(config(bad)).valid, false);

// Lifecycle requires configuration and mount, and mount owns one root.
const lifecycleDocument = new MockDocument();
const lifecycleContainer = lifecycleDocument.createElement("section");
lifecycleDocument.body.appendChild(lifecycleContainer);
const lifecycle = createProgramMainOutput({}, { now: T0 });
assert.equal(getProgramMainOutput(lifecycle).status, "created");
assert.throws(() => mountProgramMainOutput(lifecycle, lifecycleContainer), (error) => error.code === PROGRAM_MAIN_OUTPUT_ERROR_CODES.NOT_CONFIGURED);
configureProgramMainOutput(lifecycle, config(), { now: T0 });
assert.equal(getProgramMainOutput(lifecycle).status, "configured");
assert.throws(
  () => configureProgramMainOutput(lifecycle, config({ routeType: "announcer_monitor" })),
  (error) => error.code === PROGRAM_MAIN_OUTPUT_ERROR_CODES.CONFIG_INVALID
);
mountProgramMainOutput(lifecycle, lifecycleContainer, { now: T0 });
mountProgramMainOutput(lifecycle, lifecycleContainer, { now: T0 });
assert.equal(lifecycleContainer.querySelectorAll("[data-program-main-output-id]").length, 1);
assert.equal(getProgramMainOutput(lifecycle).status, "mounted");

// Active Program renders every component/layer through one controlled root.
const programA = activeEnvelope({ revision: 1, name: "A", resolvedAt: T1 });
const programASource = structuredClone(programA);
let result = applyProgramMainProjection(lifecycle, programA, { now: T1 });
assert.equal(result.status, "ready");
assert.equal(result.renderStatus, "ready");
assert.equal(result.programId, "program-A");
assert.equal(result.templateId, "template-A");
assert.equal(result.themeId, "theme-A");
assert.equal(result.appliedThemeId, "theme-A");
assert.equal(result.compositionId, "composition-A");
assert.equal(result.rootComponentId, "score-laurel");
assert.deepEqual(programA, programASource);
assert.equal(lifecycleContainer.querySelectorAll("[data-program-main-output-id]").length, 1);
assert.equal(lifecycleContainer.querySelectorAll("[data-render-id]").length, programA.projection.components.length);
const root = lifecycleContainer.querySelector("[data-program-main-output-id]");
assert.equal(root.getAttribute("data-layer-count"), String(programA.projection.layers.length));
assert.equal(root.getAttribute("data-program-id"), "program-A");
assert.match(root.textContent, /Rancheros de Tijuana/);
assert.match(root.textContent, /Charros de Jalisco/);
assert.deepEqual(result.safeArea, { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" });

// Idempotency does not increment the local projection revision.
const beforeIdempotent = getProgramMainOutput(lifecycle);
result = updateProgramMainOutput(lifecycle, structuredClone(programA), { now: T2 });
assert.equal(result.projectionRevision, beforeIdempotent.projectionRevision);

// Program B removes sponsor, adds lower third and timer, and leaves no A residue.
const extrasB = [
  component("lower-third", "text", "lower-third", 10, { x: 140, y: 820, width: 900, height: 100, zIndex: 50 }, { text: "Final por equipos" }, { text: "Final por equipos" }),
  component("graphic-timer", "timer", "timer", 11, { x: 1450, y: 820, width: 300, height: 100, zIndex: 60 }, { value: "00:34.2" }, { label: "Tiempo", display: "00:34.2", status: "running" }),
  component("bug", "badge", "bug", 12, { x: 1580, y: 60, width: 220, height: 70, zIndex: 80 }, { value: "EN VIVO" }, { value: "EN VIVO", variant: "live" })
];
const programB = activeEnvelope({ revision: 2, name: "B", teams: TEAMS_4, extras: extrasB, resolvedAt: T2 });
result = renderProgramMainProjection(lifecycle, programB, { now: T2 });
assert.equal(result.status, "ready");
assert.equal(result.programId, "program-B");
assert.equal(result.themeId, "theme-B");
assert.equal(result.appliedThemeId, "theme-B");
assert.equal(lifecycleContainer.querySelectorAll("[data-render-id]").length, programB.projection.components.length);
assert.doesNotMatch(root.textContent, /Patrocinador A/);
assert.match(root.textContent, /Final por equipos/);
assert.match(root.textContent, /00:34\.2/);
assert.match(root.textContent, /Rancho del Centro/);
const hiddenLayer = structuredClone(programB);
hiddenLayer.sourceRevision = 3;
hiddenLayer.routeRevision = 3;
hiddenLayer.resolvedAt = T3;
hiddenLayer.projection.layers.find((layer) => layer.layerId === "lower-third").visibility = false;
hiddenLayer.projection.composition.layers = structuredClone(hiddenLayer.projection.layers);
result = applyProgramMainProjection(lifecycle, hiddenLayer, { now: T3 });
assert.doesNotMatch(root.textContent, /Final por equipos/);
programB.sourceRevision = 4;
programB.routeRevision = 4;
programB.resolvedAt = T4;
programB.projection.layers.find((layer) => layer.layerId === "lower-third").visibility = "public";
programB.projection.composition.layers = structuredClone(programB.projection.layers);
result = applyProgramMainProjection(lifecycle, programB, { now: T4 });
assert.match(root.textContent, /Final por equipos/);

// Official turn is copied verbatim; the last scored team never becomes active by inference.
assert.equal(programB.projection.composition.data.turn.team.name, "Rancheros de Tijuana");
assert.equal(programB.projection.composition.data.lastScoredTeam.name, "Charros de Jalisco");
const snapshotB = buildProgramMainOutputSnapshot(lifecycle, { visibility: "public", now: T2 });
assert.equal(snapshotB.componentCount, 7);
assert.equal(snapshotB.layerCount, 4);
assert.deepEqual(snapshotB.compositionSummary.componentIds, programB.projection.components.map((item) => item.componentId));

// Three and four teams are preserved without hard-coded limits.
const three = mounted({ programMainOutputId: "three", browserOutputId: "browser-three" });
applyProgramMainProjection(three.instance, activeEnvelope({ revision: 1, name: "three", teams: TEAMS_3 }), { now: T1 });
assert.equal(three.container.querySelectorAll("[data-render-id]").filter((node) => node.textContent.includes("Rancho") || node.textContent.includes("Rancheros") || node.textContent.includes("Charros")).length, 3);
const four = mounted({ programMainOutputId: "four", browserOutputId: "browser-four" });
applyProgramMainProjection(four.instance, activeEnvelope({ revision: 1, name: "four", teams: TEAMS_4 }), { now: T1 });
assert.equal(four.container.querySelectorAll("[data-render-id]").filter((node) => node.textContent.includes("Rancho") || node.textContent.includes("Charros") || node.textContent.includes("Rancheros")).length, 4);

// Empty, disabled and unavailable clear old visual content without destroying the root.
const empty = emptyEnvelope(5);
result = applyProgramMainProjection(lifecycle, empty, { now: T3 });
assert.equal(result.status, "empty");
assert.equal(root.getAttribute("data-layer-count"), "0");
assert.equal(lifecycleContainer.querySelectorAll("[data-render-id]").length, 0);
assert.equal(lifecycleContainer.querySelectorAll("[data-program-main-output-id]").length, 1);
assert.equal(root.textContent, "");
const staleAfterEmpty = activeEnvelope({ revision: 6, name: "stale-after-empty", status: "stale", resolvedAt: T4 });
result = applyProgramMainProjection(lifecycle, staleAfterEmpty, { now: T4 });
assert.equal(result.status, "stale");
assert.equal(lifecycleContainer.querySelectorAll("[data-render-id]").length, 0);

const disabled = emptyEnvelope(7);
disabled.status = "disabled";
disabled.projection.state = "disabled";
result = applyProgramMainProjection(lifecycle, disabled, { now: T4 });
assert.equal(result.status, "disabled");
const unavailable = emptyEnvelope(8);
unavailable.status = "unavailable";
unavailable.projection.state = "unavailable";
result = applyProgramMainProjection(lifecycle, unavailable, { now: T4 });
assert.equal(result.status, "unavailable");

// Stale retains the last valid visual Program while advancing routed revisions.
const staleHarness = mounted({ programMainOutputId: "stale", browserOutputId: "browser-stale" });
const staleA = activeEnvelope({ revision: 4, name: "stale-A", resolvedAt: T1 });
applyProgramMainProjection(staleHarness.instance, staleA, { now: T1 });
const staleText = staleHarness.container.textContent;
const staleEnvelope = activeEnvelope({ revision: 5, name: "ignored-stale", resolvedAt: T2, status: "stale" });
result = applyProgramMainProjection(staleHarness.instance, staleEnvelope, { now: T2 });
assert.equal(result.status, "stale");
assert.equal(staleHarness.container.textContent, staleText);
assert.ok(getProgramMainOutputWarnings(staleHarness.instance).includes("program-main-output-stale"));

// Revision regression and same-revision conflicts reject without replacing valid DOM.
const staleBeforeFailure = staleHarness.container.textContent;
assert.throws(
  () => applyProgramMainProjection(staleHarness.instance, activeEnvelope({ revision: 3, name: "old" }), { now: T3 }),
  (error) => error.code === PROGRAM_MAIN_OUTPUT_ERROR_CODES.REVISION_REGRESSION
);
assert.equal(staleHarness.container.textContent, staleBeforeFailure);
const conflicting = structuredClone(staleEnvelope);
conflicting.projection.programId = "program-conflict";
assert.throws(
  () => applyProgramMainProjection(staleHarness.instance, conflicting, { now: T3 }),
  (error) => error.code === PROGRAM_MAIN_OUTPUT_ERROR_CODES.REVISION_CONFLICT
);
assert.equal(staleHarness.container.textContent, staleBeforeFailure);

// Only the routed program-main envelope is accepted.
assert.equal(validateProgramMainProjection(activeEnvelope()).valid, true);
assert.equal(validateProgramMainProjection(emptyEnvelope()).valid, true);
for (const invalid of [
  activeEnvelope().projection,
  { preview: activeEnvelope().projection },
  { templateId: "template-direct" },
  { themeId: "theme-direct" },
  { componentId: "component-direct" },
  { ...activeEnvelope(), routeType: "announcer_monitor", outputId: "announcer-monitor", sourceType: "announcer_projection" },
  { ...activeEnvelope(), routeType: "timer_display", outputId: "timer-display", sourceType: "timer_projection" },
  { ...activeEnvelope(), routeType: "generic" },
  { ...activeEnvelope(), outputId: "obs" },
  { ...activeEnvelope(), sourceType: "preview_snapshot" }
]) assert.equal(validateProgramMainProjection(invalid).valid, false);

// Security rejects executable protocols and non-serializable values, while markup stays inert text.
const unsafeFactories = [
  () => { const value = activeEnvelope(); value.projection.components[0].content.url = "javascript:alert(1)"; return value; },
  () => { const value = activeEnvelope(); value.projection.components[0].content.url = "file:///tmp/private"; return value; },
  () => { const value = activeEnvelope(); value.projection.components[0].content.url = "data:text/html,<script>alert(1)</script>"; return value; },
  () => { const value = activeEnvelope(); value.projection.components[0].content.fn = () => true; return value; },
  () => { const value = activeEnvelope(); value.projection.components[0].content.symbol = Symbol("unsafe"); return value; },
  () => { const value = activeEnvelope(); value.projection.components[0].content.big = 1n; return value; },
  () => { const value = activeEnvelope(); value.projection.metadata = { token: "private" }; return value; },
  () => { const value = activeEnvelope(); value.projection.components[0].content.loop = value; return value; },
  () => {
    const value = activeEnvelope();
    Object.defineProperty(value.projection.components[0].content, "computed", { enumerable: true, get: () => "unsafe" });
    return value;
  },
  () => {
    const value = activeEnvelope();
    Object.defineProperty(value.projection.components[0].content, "__proto__", { enumerable: true, value: { polluted: true } });
    return value;
  }
];
unsafeFactories.forEach((factory, index) => assert.equal(validateProgramMainProjection(factory()).valid, false, `unsafe fixture ${index}`));
const markup = activeEnvelope({ revision: 20, name: "markup" });
markup.projection.components[0].content.label = "<script>alert(1)</script><img src=x onerror=alert(1)>";
markup.projection.components[0].properties.label = markup.projection.components[0].content.label;
markup.projection.composition.components = structuredClone(markup.projection.components);
const markupHarness = mounted({ programMainOutputId: "markup", browserOutputId: "browser-markup" });
applyProgramMainProjection(markupHarness.instance, markup, { now: T2 });
assert.match(markupHarness.container.textContent, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.equal(markupHarness.container.querySelectorAll("script").length, 0);
assert.equal(markupHarness.container.querySelectorAll("img").length, 0);

const tooMany = activeEnvelope();
tooMany.projection.components = Array.from({ length: 301 }, (_, index) => ({ ...structuredClone(tooMany.projection.components[0]), componentId: `component-${index}` }));
assert.equal(validateProgramMainProjection(tooMany).valid, false);

// Public output removes tenant and actor from the accepted projection boundary and snapshots.
const privacy = activeEnvelope({ revision: 1, name: "privacy", tenantId: "tenant_private" });
privacy.actor = { id: "operator_private" };
privacy.projection.actor = { id: "operator_private" };
privacy.projection.composition.metadata.operationalNotes = "No publicar";
const privacyHarness = mounted({ programMainOutputId: "privacy", browserOutputId: "browser-privacy" });
applyProgramMainProjection(privacyHarness.instance, privacy, { now: T1 });
const privacySnapshot = buildProgramMainOutputSnapshot(privacyHarness.instance, { visibility: "public", now: T2 });
const privacyJson = JSON.stringify(privacySnapshot);
assert.doesNotMatch(privacyJson, /tenant_private|operator_private|No publicar/);

// Snapshot is compact, serializable and detached from instance, projection and DOM.
const snapshot = buildProgramMainOutputSnapshot(four.instance, { visibility: "public", now: T3 });
assert.equal(validateProgramMainOutputSnapshot(snapshot).valid, true);
assert.doesNotThrow(() => JSON.stringify(snapshot));
assert.equal("dom" in snapshot, false);
assert.equal("renderer" in snapshot, false);
assert.equal("projection" in snapshot, false);
const fourBeforeSnapshotMutation = getProgramMainOutput(four.instance);
snapshot.compositionSummary.componentIds[0] = "mutated";
snapshot.resolution.width = 1;
assert.deepEqual(getProgramMainOutput(four.instance), fourBeforeSnapshotMutation);
const cloneSource = { zero: 0, disabled: false, empty: "", nil: null, nested: { value: 1 } };
const cloned = cloneProgramMainOutputResult(cloneSource);
cloned.nested.value = 2;
assert.equal(cloneSource.nested.value, 1);
assert.deepEqual({ zero: cloned.zero, disabled: cloned.disabled, empty: cloned.empty, nil: cloned.nil }, { zero: 0, disabled: false, empty: "", nil: null });

// Display modes, viewport, safe area and transparency are controlled without mutating projections.
const presentation = mounted({ programMainOutputId: "presentation", browserOutputId: "browser-presentation", transparentBackground: false });
const presentationProjection = activeEnvelope({ revision: 1, name: "presentation" });
const presentationSource = structuredClone(presentationProjection);
applyProgramMainProjection(presentation.instance, presentationProjection, { now: T1 });
for (const displayMode of PROGRAM_MAIN_OUTPUT_DISPLAY_MODES) {
  setProgramMainOutputDisplayMode(presentation.instance, displayMode, { now: T2 });
  assert.equal(getProgramMainOutput(presentation.instance).displayMode, displayMode);
}
setProgramMainOutputViewport(presentation.instance, { width: 390, height: 844 }, { now: T2 });
assert.deepEqual(getProgramMainOutput(presentation.instance).viewport, { width: 390, height: 844 });
assert.deepEqual(presentationProjection, presentationSource);
assert.equal(presentation.container.querySelector("[data-program-main-output-id]").getAttribute("data-transparent-background"), "false");

for (const resolution of [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 1080, height: 1920 },
  { width: 3840, height: 720 }
]) assert.equal(validateProgramMainOutputConfig(config({ resolution, orientation: resolution.height > resolution.width ? "portrait" : resolution.width / resolution.height > 3 ? "ultra_wide" : "landscape" })).valid, true);

// Clear keeps one reusable root; apply works again; destroy is isolated and terminal.
result = clearProgramMainOutput(lifecycle, { now: T4 });
assert.equal(result.status, "cleared");
assert.equal(lifecycleContainer.querySelectorAll("[data-program-main-output-id]").length, 1);
assert.equal(lifecycleContainer.querySelectorAll("[data-render-id]").length, 0);
result = applyProgramMainProjection(lifecycle, activeEnvelope({ revision: 1, name: "after-clear" }), { now: T4 });
assert.equal(result.status, "ready");
const other = mounted({ programMainOutputId: "other", browserOutputId: "browser-other" });
applyProgramMainProjection(other.instance, activeEnvelope({ revision: 1, name: "other" }), { now: T1 });
const otherBeforeDestroy = getProgramMainOutput(other.instance);
destroyProgramMainOutput(lifecycle, { now: T4 });
assert.equal(lifecycleContainer.querySelectorAll("[data-program-main-output-id]").length, 0);
assert.deepEqual(getProgramMainOutput(other.instance), otherBeforeDestroy);
for (const operation of [
  () => configureProgramMainOutput(lifecycle, config()),
  () => mountProgramMainOutput(lifecycle, lifecycleContainer),
  () => applyProgramMainProjection(lifecycle, activeEnvelope()),
  () => updateProgramMainOutput(lifecycle, activeEnvelope()),
  () => clearProgramMainOutput(lifecycle),
  () => setProgramMainOutputDisplayMode(lifecycle, "fit"),
  () => setProgramMainOutputViewport(lifecycle, { width: 100, height: 100 }),
  () => buildProgramMainOutputSnapshot(lifecycle),
  () => getProgramMainOutput(lifecycle),
  () => getProgramMainOutputStatus(lifecycle),
  () => getProgramMainOutputErrors(lifecycle),
  () => getProgramMainOutputWarnings(lifecycle),
  () => destroyProgramMainOutput(lifecycle)
]) assert.throws(operation, (error) => error.code === PROGRAM_MAIN_OUTPUT_ERROR_CODES.DESTROYED);

// Static checks keep the page clean and the implementation on approved infrastructure.
const source = await readFile(new URL("../js/broadcast/programMainOutput.js", import.meta.url), "utf8");
const html = await readFile(new URL("../program-main-output.html", import.meta.url), "utf8");
const css = await readFile(new URL("../css/program-main-output.css", import.meta.url), "utf8");
assert.match(source, /createBrowserOutput\(/);
assert.match(source, /applyBrowserOutputProjection\(/);
assert.match(source, /createComponentRenderer\(/);
assert.match(source, /renderBroadcastComponent\(/);
assert.doesNotMatch(source, /from\s+["']\.\/previewEngine|from\s+["']\.\/programEngine|from\s+["']\.\.\/core\/firebase/i);
assert.doesNotMatch(source, /WebSocket|EventSource|BroadcastChannel|ServiceWorker|setInterval|requestAnimationFrame/);
assert.doesNotMatch(source, /\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function|\.cssText/);
assert.doesNotMatch(html, /<button|<select|<nav|inspector|Take|Cut|Auto|OBS|vMix|Wirecast/i);
assert.match(html, /data-program-main-output-page/);
assert.match(html, /program-main-output-host/);
assert.match(css, /background:\s*transparent/);
assert.match(css, /overflow:\s*hidden/);

console.log("program-main-output tests passed");
