import assert from "node:assert/strict";
import {
  createPreviewEngine,
  getPreview,
  getPreviewSnapshot,
  preparePreview,
  renderPreview,
  updatePreview
} from "../js/broadcast/previewEngine.js";
import {
  autoProgram,
  createProgramEngine,
  cutProgram,
  getProgram,
  getProgramSnapshot,
  prepareProgram,
  takeProgram
} from "../js/broadcast/programEngine.js";
import {
  createOutputRoute,
  createOutputRoutingEngine,
  routeProgramToOutput
} from "../js/broadcast/outputRouting.js";
import {
  buildThemeTemplateSnapshot,
  buildThemedTemplatePreparation,
  createThemeTemplateIntegration,
  destroyThemeTemplateIntegration,
  getThemedTemplateRender
} from "../js/broadcast/themeTemplateIntegration.js?v=20260714-theme-template-integration-001-themed-compositions-v1";
import {
  createTemplateRendererIntegration,
  destroyTemplateRendererIntegration,
  prepareTemplateRender
} from "../js/broadcast/templateRendererIntegration.js?v=20260714-template-renderer-integration-001-composed-preview-v1";
import { createProductionConsoleModel } from "../js/broadcast/productionConsole.js";
import { buildTemplateEngineFixture } from "../fixtures/templateEngineFixtures.js";

const T0 = "2026-07-15T20:00:00.000Z";
const T1 = "2026-07-15T20:00:01.000Z";
const T2 = "2026-07-15T20:00:02.000Z";
const T3 = "2026-07-15T20:00:03.000Z";
const T4 = "2026-07-15T20:00:04.000Z";
const CONTEXT = Object.freeze({
  tenantId: "tenant_a",
  organizationId: "organization_a",
  clientId: "client_a",
  tournamentId: "tournament_a",
  competitionId: "competition_a",
  sessionId: "session_a"
});
const REAL_CONTEXT = Object.freeze({
  tenantId: "tenant_playground",
  organizationId: "organizacion_playground",
  clientId: "cliente_playground",
  tournamentId: "torneo_playground",
  competitionId: "equipos_completo",
  sessionId: "session_projection_real"
});
const REAL_OUTPUT = Object.freeze({
  id: "program_projection_real_preview",
  outputId: "program_projection_real_preview",
  type: "preview",
  width: 1920,
  height: 1080,
  orientation: "landscape",
  safeArea: { top: 54, right: 96, bottom: 54, left: 96 }
});

class ProjectionClassList {
  constructor(element) { this.element = element; }
  add(...names) {
    const current = new Set(String(this.element.className || "").split(/\s+/).filter(Boolean));
    names.forEach((name) => current.add(name));
    this.element.className = [...current].join(" ");
  }
  contains(name) { return String(this.element.className || "").split(/\s+/).includes(name); }
}

class ProjectionElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.namespaceURI = this.tagName === "SVG" ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml";
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.style = {};
    this.className = "";
    this.classList = new ProjectionClassList(this);
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
  append(...children) { children.forEach((child) => this.appendChild(child)); }
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
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  setConnected(value) {
    this.isConnected = value;
    this.children.forEach((child) => child.setConnected(value));
  }
  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; child.setConnected(false); });
    this.children = [];
    this._textContent = String(value ?? "");
  }
  get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
}

class ProjectionDocument {
  constructor() {
    this.nodeType = 9;
    this.baseURI = "https://charropro.test/production-console.html";
    this.defaultView = { location: new URL(this.baseURI), HTMLElement: ProjectionElement };
    this.body = new ProjectionElement("body", this);
    this.body.isConnected = true;
  }
  createElement(tagName) { return new ProjectionElement(tagName, this); }
}

const TEAMS_A = Object.freeze([
  { id: "team_tijuana", name: "Rancheros de Tijuana", total: 203, active: true },
  { id: "team_jalisco", name: "Charros de Jalisco", total: 202, active: false },
  { id: "team_tres", name: "Tres Regalos", total: 201, active: false }
]);
const TEAMS_B = Object.freeze([
  { id: "team_norte", name: "Hacienda del Norte", total: 310, active: false },
  { id: "team_centro", name: "Rancho del Centro", total: 307, active: true },
  { id: "team_sur", name: "Charros del Sur", total: 304, active: false },
  { id: "team_valle", name: "Lienzo del Valle", total: 301, active: false }
]);

function integrationSnapshot({ themeId = "theme_default", visibility = "production" } = {}) {
  const render = {
    themedRenderId: "themed_render_scoreboard",
    templateRenderId: "template_render_scoreboard",
    templateId: "template_scoreboard",
    templateVersion: "1.0.0",
    templateInstanceId: "template_instance_scoreboard",
    themeId,
    themeVersion: "1.0.0",
    outputId: "preview_1080",
    visibility,
    state: "prepared",
    status: "prepared",
    warnings: [],
    errors: [],
    createdAt: T0,
    updatedAt: T0
  };
  return {
    snapshotVersion: "1.0.0",
    integrationVersion: "1.0.0",
    generatedAt: T0,
    visibility,
    integrationId: "theme_template_program_projection",
    state: "prepared",
    outputId: render.outputId,
    tenantId: CONTEXT.tenantId,
    themedRenderIds: [render.themedRenderId],
    renders: [render],
    rendererSummary: {
      integrationVersion: "1.0.0",
      outputId: render.outputId,
      orientation: "landscape",
      resolution: { width: 1920, height: 1080 },
      safeArea: { top: 54, right: 96, bottom: 54, left: 96 },
      templateRenderIds: [render.templateRenderId]
    },
    warnings: [],
    errors: []
  };
}

function preparation(teams, options = {}) {
  const themeId = options.themeId || "theme_default";
  const turn = teams.find((team) => team.active) || teams[0];
  const components = teams.map((team, index) => ({
    instance: {
      instanceId: `score_row_${team.id}`,
      componentId: "scoreboard_team_row",
      componentType: "score",
      visibility: options.visibility || "production",
      layout: {
        x: 120,
        y: 160 + (index * 120),
        width: 1680,
        height: 96,
        rotation: 0,
        anchor: "center",
        scale: 1,
        zIndex: 10 + index,
        safeArea: {},
        responsive: {}
      },
      style: {
        color: "#ffffff",
        backgroundColor: team.active ? "#8f6d24" : "#111111",
        borderColor: "#d6ad43",
        opacity: team.active ? 1 : 0.9,
        fontFamily: "Arial",
        fontSize: 42,
        fontWeight: 700,
        shadow: { x: 0, y: 2, blur: 6, spread: 0, color: "#000000" }
      },
      properties: { label: team.name, value: team.total },
      metadata: {
        layerId: "scoreboard_rows",
        branding: { sponsorAssetId: "asset_sponsor_1" },
        operationalNotes: "No publicar esta nota"
      }
    },
    resolvedBindings: { team: { ...team }, position: index + 1 },
    resolvedContent: { name: team.name, score: team.total, active: team.active },
    assetRefs: index === 0 ? [{ assetId: "asset_sponsor_1", version: "1.0.0", variantId: "program" }] : [],
    required: true,
    declaredIndex: index,
    zIndex: 10 + index,
    warnings: [],
    errors: []
  }));
  return {
    preparationVersion: "1.0.0",
    themedPreparationVersion: "1.0.0",
    preparationId: options.preparationId || `preparation_${teams.length}_teams`,
    templateId: "template_scoreboard",
    templateInstanceId: "template_instance_scoreboard",
    templateType: "scoreboard",
    templateInstance: {
      templateId: "template_scoreboard",
      templateInstanceId: "template_instance_scoreboard",
      templateType: "scoreboard",
      templateVersion: "1.0.0",
      layout: { mode: "absolute" },
      ...CONTEXT
    },
    themeId,
    themeVersion: "1.0.0",
    themeScope: "tournament",
    brandingStatus: "confirmed",
    visibility: options.visibility || "production",
    effectiveVisibility: options.visibility || "production",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    safeArea: { top: 54, right: 96, bottom: 54, left: 96 },
    layout: { mode: "absolute", zIndex: 0 },
    themeBackground: { type: "transparent" },
    resolvedBindings: {
      turn: { team: { id: turn.id, name: turn.name } },
      lastScoredTeam: { id: "team_jalisco", name: "Charros de Jalisco" }
    },
    components,
    componentOrder: components.map((component) => component.instance.instanceId),
    warnings: [],
    errors: []
  };
}

function previewHarness(initialPreparation) {
  const state = { preparation: structuredClone(initialPreparation), roots: [] };
  const adapter = {
    prepare(_source, _render) {
      return { preparation: state.preparation };
    },
    render(prepared) {
      const root = { nodeType: 1, id: "preview_root" };
      state.roots.splice(0, state.roots.length, root);
      return {
        ...prepared.sourceRender,
        state: "rendered",
        status: "rendered",
        preparation: state.preparation,
        root
      };
    },
    update(active, changes) {
      const root = { nodeType: 1, id: active.themeRenderId };
      state.roots.splice(0, state.roots.length, root);
      return {
        ...changes.sourceRender,
        themedRenderId: active.themeRenderId,
        themeId: state.preparation.themeId,
        state: "rendered",
        status: "rendered",
        preparation: state.preparation,
        root
      };
    },
    clear() {
      state.roots.length = 0;
      return { removed: true };
    }
  };
  return {
    adapter,
    setPreparation(next) { state.preparation = next; }
  };
}

function buildRealBasePreparation(teams, suffix) {
  const fixture = buildTemplateEngineFixture("scoreboard", { variant: teams.length });
  const template = structuredClone(fixture.template);
  const row = structuredClone(template.components[1]);
  template.templateId = `template_real_scoreboard_${suffix}`;
  template.name = `Marcador real ${suffix}`;
  template.components = teams.map((team, index) => ({
    ...structuredClone(row),
    instanceId: `real_score_row_${suffix}_${team.id}`,
    bindings: [],
    properties: { label: team.name, value: team.total },
    layout: {
      ...row.layout,
      x: 0.5,
      y: 0.18 + (index * 0.15),
      width: 0.8,
      height: 0.11,
      anchor: "center",
      zIndex: 10 + index
    },
    metadata: { ...row.metadata, layerId: "scoreboard_rows", active: team.active }
  }));
  const base = prepareTemplateRender(template, fixture.sources, {
    templateRenderId: `template_render_real_${suffix}`,
    templateInstanceId: `template_instance_real_${suffix}`,
    outputId: REAL_OUTPUT.outputId,
    outputType: "preview",
    width: REAL_OUTPUT.width,
    height: REAL_OUTPUT.height,
    orientation: REAL_OUTPUT.orientation,
    safeArea: REAL_OUTPUT.safeArea,
    visibility: "production",
    tenantId: REAL_CONTEXT.tenantId,
    organizationId: REAL_CONTEXT.organizationId,
    tournamentId: REAL_CONTEXT.tournamentId,
    competitionId: REAL_CONTEXT.competitionId,
    now: T0
  });
  const turn = teams.find((team) => team.active) || teams[0];
  base.resolvedBindings = {
    ...base.resolvedBindings,
    turn: { team: { id: turn.id, name: turn.name } },
    lastScoredTeam: { id: "team_jalisco", name: "Charros de Jalisco" },
    teams: teams.map((team) => ({ ...team }))
  };
  base.components.forEach((component, index) => {
    component.resolvedBindings = { team: { ...teams[index] }, position: index + 1 };
    component.resolvedContent = {
      name: teams[index].name,
      score: teams[index].total,
      active: teams[index].active
    };
  });
  return base;
}

function preparedThemeSnapshot(integration, preparationValue, suffix) {
  const themedRenderId = `themed_render_real_${suffix}`;
  const render = {
    themedRenderId,
    templateRenderId: preparationValue.templateRenderId,
    templateId: preparationValue.templateId,
    templateVersion: preparationValue.templateInstance.templateVersion,
    templateInstanceId: preparationValue.templateInstanceId,
    themeId: preparationValue.themeId,
    themeVersion: preparationValue.themeVersion,
    themeScope: preparationValue.themeScope,
    brandingStatus: preparationValue.brandingStatus,
    outputId: REAL_OUTPUT.outputId,
    visibility: preparationValue.effectiveVisibility,
    state: "prepared",
    status: "prepared",
    componentCount: preparationValue.components.length,
    renderedCount: 0,
    warnings: [],
    errors: [],
    createdAt: T0,
    updatedAt: T0
  };
  return {
    snapshotVersion: "1.0.0",
    integrationVersion: "1.0.0",
    generatedAt: T0,
    visibility: "production",
    integrationId: integration.integrationId,
    state: "prepared",
    outputId: REAL_OUTPUT.outputId,
    tenantId: REAL_CONTEXT.tenantId,
    themedRenderIds: [themedRenderId],
    renders: [render],
    rendererSummary: {
      integrationVersion: "1.0.0",
      outputId: REAL_OUTPUT.outputId,
      orientation: REAL_OUTPUT.orientation,
      resolution: { width: REAL_OUTPUT.width, height: REAL_OUTPUT.height },
      safeArea: REAL_OUTPUT.safeArea,
      templateRenderIds: [preparationValue.templateRenderId]
    },
    warnings: [],
    errors: []
  };
}

function createRealProgramRoute(engine, suffix) {
  return createOutputRoute(engine, {
    routeId: `route_program_real_${suffix}`,
    routeType: "program_main",
    outputId: "program-main",
    sourceType: "program_snapshot",
    visibility: "production",
    staleAfterMs: 60000,
    ...REAL_CONTEXT
  }, { now: T0 });
}

function createProgramRoute(engine) {
  return createOutputRoute(engine, {
    routeId: "route-program-main",
    routeType: "program_main",
    outputId: "program-main",
    sourceType: "program_snapshot",
    visibility: "public",
    staleAfterMs: 60000,
    ...CONTEXT
  }, { now: T0 });
}

const sourceA = preparation(TEAMS_A);
const sourceAClone = structuredClone(sourceA);
const harness = previewHarness(sourceA);
const previewEngine = createPreviewEngine({ engineId: "projection_preview", adapter: harness.adapter, now: T0 });
preparePreview(previewEngine, integrationSnapshot(), { now: T0 });
renderPreview(previewEngine, { now: T1 });
assert.deepEqual(sourceA, sourceAClone);

let previewSnapshot = getPreviewSnapshot(previewEngine, { visibility: "production", now: T1 });
assert.equal(previewSnapshot.preview.projectionVersion, "1.0.0");
assert.equal(previewSnapshot.preview.composition.components.length, 3);
assert.equal(previewSnapshot.preview.components.length, 3);
assert.deepEqual(previewSnapshot.preview.composition.order, TEAMS_A.map((team) => `score_row_${team.id}`));
assert.equal(previewSnapshot.preview.composition.geometry.width, 1920);
assert.equal(previewSnapshot.preview.composition.geometry.height, 1080);
assert.equal(previewSnapshot.preview.composition.transparentBackground, true);
assert.equal(previewSnapshot.preview.composition.data.turn.team.name, "Rancheros de Tijuana");
assert.equal(previewSnapshot.preview.composition.data.lastScoredTeam.name, "Charros de Jalisco");
assert.deepEqual(
  previewSnapshot.preview.components.map((component) => component.data.team.name),
  TEAMS_A.map((team) => team.name)
);

const programEngine = createProgramEngine({ engineId: "projection_program", now: T0 });
prepareProgram(programEngine, previewSnapshot, { now: T1, rendererId: "renderer_v1", context: CONTEXT });
let program = takeProgram(programEngine, { now: T2 });
assert.equal(program.transitionMode, "take");
assert.equal(program.composition.components.length, 3);
assert.equal(program.composition.data.turn.team.name, "Rancheros de Tijuana");
assert.equal(program.composition.data.lastScoredTeam.name, "Charros de Jalisco");
assert.equal(program.templateId, "template_scoreboard");
assert.equal(program.themeId, "theme_default");
assert.equal(program.programRevision, 0);
assert.equal(program.sourceRevision, previewSnapshot.revision);

const routingEngine = createOutputRoutingEngine({ engineId: "projection_routing", now: T0 });
createProgramRoute(routingEngine);
let programSnapshot = getProgramSnapshot(programEngine, { visibility: "production", now: T2 });
const programSnapshotSerialized = JSON.stringify(programSnapshot);
let routed = routeProgramToOutput(routingEngine, "route-program-main", programSnapshot, { now: T2, context: CONTEXT });
assert.equal(routed.projection.composition.data.turn.team.name, "Rancheros de Tijuana");
assert.equal(routed.projection.composition.data.lastScoredTeam.name, "Charros de Jalisco");
assert.equal(routed.projection.components.length, 3);
assert.equal(routed.projection.layers.length, 1);
assert.equal(routed.projection.templateId, "template_scoreboard");
assert.equal(routed.projection.themeId, "theme_default");
assert.equal(JSON.stringify(programSnapshot), programSnapshotSerialized);

// Program keeps A after Preview changes to B; only a later official operation can replace it.
const sourceB = preparation(TEAMS_B, { themeId: "theme_dark", preparationId: "preparation_four_teams" });
harness.setPreparation(sourceB);
updatePreview(previewEngine, { themeId: "theme_dark" }, { now: T3 });
assert.equal(getPreview(previewEngine).composition.components.length, 4);
assert.equal(getPreview(previewEngine).composition.data.turn.team.name, "Rancho del Centro");
assert.equal(getProgram(programEngine).composition.components.length, 3);
assert.equal(getProgram(programEngine).composition.data.turn.team.name, "Rancheros de Tijuana");

previewSnapshot = getPreviewSnapshot(previewEngine, { visibility: "production", now: T3 });
prepareProgram(programEngine, previewSnapshot, { now: T3, rendererId: "renderer_v1", context: CONTEXT });
program = cutProgram(programEngine, { now: T3 });
assert.equal(program.transitionMode, "cut");
assert.equal(program.composition.components.length, 4);
assert.deepEqual(program.components.map((component) => component.data.team.name), TEAMS_B.map((team) => team.name));
assert.equal(JSON.stringify(program).includes("Rancheros de Tijuana"), false);
assert.equal(program.programRevision, 1);

// AUTO transports the same declarative contract without losing Theme, layers or geometry.
harness.setPreparation(sourceA);
updatePreview(previewEngine, { themeId: "theme_default" }, { now: T4 });
previewSnapshot = getPreviewSnapshot(previewEngine, { visibility: "production", now: T4 });
prepareProgram(programEngine, previewSnapshot, { now: T4, rendererId: "renderer_v1", context: CONTEXT });
program = autoProgram(programEngine, { now: T4 });
assert.equal(program.transitionMode, "auto");
assert.equal(program.components.length, 3);
assert.equal(program.composition.geometry.orientation, "landscape");
assert.equal(program.layers[0].componentIds.length, 3);
assert.equal(program.programRevision, 2);

// Every boundary is detached, including nested component and asset metadata.
const previewDetached = getPreviewSnapshot(previewEngine, { visibility: "production", now: T4 });
previewDetached.preview.components[0].data.team.name = "Preview mutado";
previewDetached.preview.components[0].assetRefs[0].variantId = "mutated";
assert.equal(getPreview(previewEngine).components[0].data.team.name, "Rancheros de Tijuana");
assert.equal(getPreview(previewEngine).components[0].assetRefs[0].variantId, "program");
programSnapshot = getProgramSnapshot(programEngine, { visibility: "production", now: T4 });
programSnapshot.program.components[0].data.team.name = "Program snapshot mutado";
assert.equal(getProgram(programEngine).components[0].data.team.name, "Rancheros de Tijuana");
routed = routeProgramToOutput(routingEngine, "route-program-main", getProgramSnapshot(programEngine, { visibility: "production", now: T4 }), { now: T4, context: CONTEXT });
routed.projection.components[0].data.team.name = "Routing mutado";
assert.equal(getProgram(programEngine).components[0].data.team.name, "Rancheros de Tijuana");

// Empty Program has one documented controlled policy.
const emptyProgramEngine = createProgramEngine({ engineId: "empty_program", now: T0 });
const emptySnapshot = getProgramSnapshot(emptyProgramEngine, { visibility: "production", now: T1 });
const emptyRoutingEngine = createOutputRoutingEngine({ engineId: "empty_routing", now: T0 });
createProgramRoute(emptyRoutingEngine);
const emptyResult = routeProgramToOutput(emptyRoutingEngine, "route-program-main", emptySnapshot, { now: T1, context: CONTEXT });
assert.equal(emptyResult.status, "controlled-empty");
assert.equal(emptyResult.projection.composition, null);
assert.deepEqual(emptyResult.projection.components, []);
assert.deepEqual(emptyResult.projection.layers, []);

// Context boundaries reject tenant, tournament, competition and session crossover atomically.
const contextSnapshot = getPreviewSnapshot(previewEngine, { visibility: "production", now: T4 });
const beforeContextFailure = getProgram(programEngine);
for (const [field, value] of [
  ["tenantId", "tenant_b"],
  ["tournamentId", "tournament_b"],
  ["competitionId", "competition_b"],
  ["sessionId", "session_b"]
]) {
  assert.throws(
    () => prepareProgram(programEngine, contextSnapshot, { now: T4, context: { ...CONTEXT, [field]: value } }),
    (error) => error.code === `program-${field}-mismatch`
  );
  assert.deepEqual(getProgram(programEngine), beforeContextFailure);
}

// Public snapshots remove tenant and operational notes without changing the effective content.
const publicPreview = getPreviewSnapshot(previewEngine, { visibility: "public", now: T4 });
const publicProgram = getProgramSnapshot(programEngine, { visibility: "public", now: T4 });
for (const snapshot of [publicPreview, publicProgram]) {
  const serialized = JSON.stringify(snapshot);
  for (const forbidden of ["tenant_a", "organization_a", "client_a", "session_a", "No publicar esta nota"]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} leaked`);
  }
  assert.doesNotMatch(serialized, /"(?:root|renderer|listener|runtime|actor|signedUrl|privateKey|token|credentials)"\s*:/i);
  assert.doesNotThrow(() => JSON.parse(serialized));
}
assert.equal(publicProgram.program.components[0].properties.value, 203);
assert.equal(publicProgram.program.components[0].content.active, true);

// Unsafe composition input is rejected and never replaces the valid Preview.
const safePreviewBeforeAttack = getPreview(previewEngine);
for (const hostileValue of [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "javascript:alert(1)",
  "file:///tmp/program",
  "data:text/html,<iframe></iframe>",
  "vbscript:msgbox(1)",
  "url(javascript:alert(1))",
  "expression(alert(1))"
]) {
  const hostile = preparation(TEAMS_A, { themeId: "theme_hostile" });
  hostile.components[0].resolvedContent.attack = hostileValue;
  harness.setPreparation(hostile);
  assert.throws(() => updatePreview(previewEngine, { themeId: "theme_hostile" }, { now: T4 }));
  assert.deepEqual(getPreview(previewEngine), safePreviewBeforeAttack);
}

const hostileShapes = [
  () => { const value = preparation(TEAMS_A); value.components[0].resolvedContent.fn = () => true; return value; },
  () => { const value = preparation(TEAMS_A); value.components[0].resolvedContent.symbol = Symbol("unsafe"); return value; },
  () => { const value = preparation(TEAMS_A); value.components[0].resolvedContent.big = 1n; return value; },
  () => { const value = preparation(TEAMS_A); value.components[0].resolvedContent.loop = value; return value; },
  () => { const value = preparation(TEAMS_A); Object.defineProperty(value.components[0].resolvedContent, "computed", { enumerable: true, get: () => "unsafe" }); return value; },
  () => { const value = preparation(TEAMS_A); Object.defineProperty(value.components[0].resolvedContent, "__proto__", { enumerable: true, value: { polluted: true } }); return value; }
];
for (const buildHostile of hostileShapes) {
  harness.setPreparation(buildHostile());
  assert.throws(() => updatePreview(previewEngine, { themeId: "theme_hostile" }, { now: T4 }));
  assert.deepEqual(getPreview(previewEngine), safePreviewBeforeAttack);
}
assert.equal(Object.prototype.polluted, undefined);

const tooMany = preparation(TEAMS_A);
tooMany.components = Array.from({ length: 301 }, (_, index) => ({
  ...structuredClone(tooMany.components[0]),
  instance: { ...structuredClone(tooMany.components[0].instance), instanceId: `score_row_limit_${index}` }
}));
tooMany.componentOrder = tooMany.components.map((component) => component.instance.instanceId);
harness.setPreparation(tooMany);
assert.throws(() => updatePreview(previewEngine, { themeId: "theme_limit" }, { now: T4 }), (error) => error.code === "preview-composition-components-limit");
assert.deepEqual(getPreview(previewEngine), safePreviewBeforeAttack);

// Real Theme Template Integration -> Preview -> Program -> Output Routing regression.
function runRealThemeProjection(teams, suffix) {
  const model = createProductionConsoleModel({ now: T0 });
  const document = new ProjectionDocument();
  const target = document.createElement("section");
  document.body.appendChild(target);
  const renderer = createTemplateRendererIntegration(target, {
    integrationId: `renderer_real_${suffix}`,
    rendererId: `component_renderer_real_${suffix}`,
    outputId: REAL_OUTPUT.outputId,
    width: REAL_OUTPUT.width,
    height: REAL_OUTPUT.height,
    orientation: REAL_OUTPUT.orientation,
    safeArea: REAL_OUTPUT.safeArea,
    visibility: "production",
    tenantId: REAL_CONTEXT.tenantId,
    now: T0
  });
  const integration = createThemeTemplateIntegration({
    themeRegistry: model.themeRegistry,
    templateRegistry: model.templateRegistry,
    componentRegistry: model.componentRegistry,
    templateRendererIntegration: renderer,
    assetRegistry: model.assetRegistry,
    productionVariables: {},
    broadcastContract: {},
    output: REAL_OUTPUT,
    visibility: "production",
    ...REAL_CONTEXT
  }, { integrationId: `theme_template_real_${suffix}`, now: T0 });
  const base = buildRealBasePreparation(teams, suffix);
  const themeA = buildThemedTemplatePreparation(base, "theme_orgullo_charro", integration, { now: T0 });
  const themeAOriginal = structuredClone(themeA);
  const source = preparedThemeSnapshot(integration, themeA, suffix);
  const store = { preparation: themeA };
  const realPreviewEngine = createPreviewEngine({
    engineId: `preview_real_${suffix}`,
    themeTemplateIntegration: integration,
    resolvePreparation: () => store.preparation,
    now: T0
  });
  preparePreview(realPreviewEngine, source, { now: T0, output: REAL_OUTPUT });
  const previewA = renderPreview(realPreviewEngine, { now: T1 });
  const publicRenderA = getThemedTemplateRender(integration, `themed_render_real_${suffix}`);
  assert.equal(publicRenderA.preparation.themeId, "theme_orgullo_charro");
  assert.deepEqual(publicRenderA.preparation.components, themeA.components);
  assert.equal(previewA.composition.components.length, teams.length);
  const styleA = structuredClone(previewA.components[0].style);

  const previewB = updatePreview(realPreviewEngine, { themeId: "theme_light" }, { now: T2 });
  const publicRenderB = getThemedTemplateRender(integration, `themed_render_real_${suffix}`);
  assert.equal(publicRenderB.themeId, "theme_light");
  assert.equal(publicRenderB.preparation.themeId, "theme_light");
  assert.equal(publicRenderB.preparation.preparedAt, T2);
  assert.equal(publicRenderB.preparation.templateId, themeA.templateId);
  assert.notDeepEqual(publicRenderB.preparation.components[0].instance.style, themeA.components[0].instance.style);
  assert.equal(publicRenderB.preparation.components.every((component) => (
    component.instance.metadata.themeApplication.appliedThemeId === "theme_light"
  )), true);
  assert.equal(JSON.stringify(publicRenderB.preparation).includes("theme_orgullo_charro"), false);
  assert.deepEqual(themeA, themeAOriginal);
  assert.equal(previewB.themeId, "theme_light");
  assert.equal(previewB.composition.themeId, "theme_light");
  assert.equal(previewB.components.length, teams.length);
  assert.notDeepEqual(previewB.components[0].style, styleA);
  assert.equal(
    JSON.stringify(previewB.components[0].style),
    JSON.stringify(publicRenderB.preparation.components[0].instance.style)
  );
  assert.deepEqual(previewB.components.map((component) => component.data.team.name), teams.map((team) => team.name));
  assert.deepEqual(previewB.components.map((component) => component.properties.value), teams.map((team) => team.total));
  assert.equal(previewB.components.filter((component) => component.content.active === true).length, 1);

  const integrationSnapshotB = buildThemeTemplateSnapshot(integration, `themed_render_real_${suffix}`, {
    visibility: "production",
    now: T2
  });
  assert.equal(integrationSnapshotB.renders[0].preparation.themeId, "theme_light");
  assert.deepEqual(integrationSnapshotB.renders[0].preparation.components, publicRenderB.preparation.components);

  const realPreviewSnapshot = getPreviewSnapshot(realPreviewEngine, { visibility: "production", now: T2 });
  const programs = {};
  for (const [mode, transition] of [["take", takeProgram], ["cut", cutProgram], ["auto", autoProgram]]) {
    const engine = createProgramEngine({ engineId: `program_real_${suffix}_${mode}`, now: T0 });
    prepareProgram(engine, realPreviewSnapshot, { now: T2, rendererId: "renderer_v1", context: REAL_CONTEXT });
    const result = transition(engine, { now: T3 });
    assert.equal(result.transitionMode, mode);
    assert.equal(result.themeId, "theme_light");
    assert.equal(result.composition.themeId, "theme_light");
    assert.equal(result.components.length, teams.length);
    assert.deepEqual(result.components.map((component) => component.data.team.name), teams.map((team) => team.name));
    assert.deepEqual(result.components.map((component) => component.properties.value), teams.map((team) => team.total));
    programs[mode] = { engine, result };
  }

  const routing = createOutputRoutingEngine({ engineId: `routing_real_${suffix}`, now: T0 });
  createRealProgramRoute(routing, suffix);
  const programSnapshotB = getProgramSnapshot(programs.take.engine, { visibility: "production", now: T3 });
  const routedB = routeProgramToOutput(routing, `route_program_real_${suffix}`, programSnapshotB, {
    now: T3,
    context: REAL_CONTEXT
  });
  assert.equal(routedB.projection.themeId, "theme_light");
  assert.equal(routedB.projection.composition.themeId, "theme_light");
  assert.equal(routedB.projection.components.length, teams.length);
  assert.deepEqual(routedB.projection.components.map((component) => component.data.team.name), teams.map((team) => team.name));

  if (teams.length === 3) {
    assert.equal(previewB.composition.data.turn.team.name, "Rancheros de Tijuana");
    assert.equal(previewB.composition.data.lastScoredTeam.name, "Charros de Jalisco");
    assert.equal(programs.take.result.composition.data.turn.team.name, "Rancheros de Tijuana");
    assert.equal(routedB.projection.composition.data.turn.team.name, "Rancheros de Tijuana");
    assert.equal(programs.take.result.components.find((component) => component.data.team.name === "Charros de Jalisco").properties.value, 202);
  }

  const programBeforePreviewChange = structuredClone(programs.take.result);
  updatePreview(realPreviewEngine, { themeId: "theme_dark" }, { now: T4 });
  assert.equal(getPreview(realPreviewEngine).themeId, "theme_dark");
  assert.equal(JSON.stringify(getProgram(programs.take.engine)), JSON.stringify(programBeforePreviewChange));

  destroyThemeTemplateIntegration(integration, { now: T4 });
  destroyTemplateRendererIntegration(renderer, { now: T4 });
}

runRealThemeProjection(TEAMS_A, "three_teams");
runRealThemeProjection(TEAMS_B, "four_teams");

console.log("broadcast-program-projection.test.mjs: ok");
