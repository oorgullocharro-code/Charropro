import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as api from "../js/broadcast/outputSynchronization.js";
import {
  createOutputRoute,
  createOutputRoutingEngine
} from "../js/broadcast/outputRouting.js?v=20260715-browser-output-001-common-web-output-infrastructure-v1";
import {
  createProgramEngine,
  getProgramSnapshot,
  prepareProgram,
  takeProgram
} from "../js/broadcast/programEngine.js?v=20260715-program-engine-001-official-program-v1";
import {
  buildProgramMainOutputSnapshot,
  configureProgramMainOutput,
  createProgramMainOutput,
  mountProgramMainOutput
} from "../js/broadcast/programMainOutput.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import {
  configureAnnouncerMonitor,
  createAnnouncerMonitor,
  getAnnouncerSnapshot,
  mountAnnouncerMonitor
} from "../js/broadcast/announcerMonitor.js?v=20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1";

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
  charreadaId: "charreada_a",
  sessionId: "session_a"
});

class MockStyle {
  constructor() { this.properties = new Map(); }
  setProperty(name, value) { this.properties.set(name, String(value)); }
  removeProperty(name) { this.properties.delete(name); }
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
    this.listeners = new Map();
    this._textContent = "";
    this.value = "";
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
  append(...children) { children.forEach((child) => this.appendChild(child)); }
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
  setAttribute(name, value) { this.attributes.set(name, String(value)); if (name === "value") this.value = String(value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  requestFullscreen() { return Promise.resolve(); }
  set textContent(value) { this.replaceChildren(); this._textContent = String(value ?? ""); }
  get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
  querySelectorAll(selector) {
    const matches = [];
    const visit = (node) => {
      if (matchesSelector(node, selector)) matches.push(node);
      node.children.forEach(visit);
    };
    this.children.forEach(visit);
    return matches;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.body = new MockElement("body", this);
    this.defaultView = { location: { href: "http://127.0.0.1/" } };
  }
  createElement(tagName) { return new MockElement(tagName, this); }
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

function previewSnapshot(teamName = "Rancheros de Tijuana", revision = 1) {
  const components = [{
    componentId: "scoreboard_rows",
    sourceComponentId: "scoreboard_table",
    componentType: "table",
    parentId: null,
    layerId: "scoreboard",
    order: 0,
    visibility: "public",
    geometry: { x: 100, y: 100, width: 1720, height: 760, rotation: 0, anchor: "center", scale: 1, zIndex: 10 },
    opacity: 1,
    style: { opacity: 1 },
    properties: { columns: ["Equipo", "Total"], rows: [[teamName, 203]] },
    content: {},
    data: { turn: { team: { id: "team_current", name: teamName } } },
    assetRefs: [],
    metadata: {}
  }];
  const preview = {
    previewId: `preview_${revision}`,
    createdAt: T0,
    updatedAt: T1,
    revision,
    status: "rendered",
    visibility: "public",
    output: {
      outputId: "preview_1080",
      type: "preview",
      orientation: "landscape",
      resolution: { width: 1920, height: 1080 },
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    themeRenderId: "themed_render_scoreboard",
    templateRenderId: "template_render_scoreboard",
    templateId: "template_scoreboard",
    themeId: "theme_default",
    templateInstanceId: "template_instance_scoreboard",
    projectionVersion: "1.0.0",
    composition: {
      compositionVersion: "1.0.0",
      compositionId: "composition_scoreboard",
      templateId: "template_scoreboard",
      themeId: "theme_default",
      rootComponentId: "scoreboard_rows",
      components: structuredClone(components),
      layers: [{ layerId: "scoreboard", order: 0, zIndex: 10, visibility: "public", componentIds: ["scoreboard_rows"] }],
      order: ["scoreboard_rows"],
      geometry: { width: 1920, height: 1080, orientation: "landscape" },
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      transparentBackground: true,
      background: { type: "transparent" },
      data: structuredClone(components[0].data),
      metadata: {}
    },
    components: structuredClone(components),
    layers: [{ layerId: "scoreboard", order: 0, zIndex: 10, visibility: "public", componentIds: ["scoreboard_rows"] }],
    sourceRevision: revision,
    tenantId: CONTEXT.tenantId,
    tournamentId: CONTEXT.tournamentId,
    competitionId: CONTEXT.competitionId,
    warnings: [],
    errors: []
  };
  return {
    snapshotVersion: "1.0.0",
    generatedAt: T1,
    state: "rendered",
    revision,
    visibility: "public",
    preview,
    warnings: [],
    errors: []
  };
}

function createProgram(teamName = "Rancheros de Tijuana", revision = 1) {
  const engine = createProgramEngine({ engineId: `program_${revision}`, now: T0 });
  prepareProgram(engine, previewSnapshot(teamName, revision), { now: T1, rendererId: "renderer_v1", context: CONTEXT });
  takeProgram(engine, { now: T2 });
  return engine;
}

function announcerSources(revision = 1) {
  return {
    sourceRevision: revision,
    visibility: "operational",
    ...CONTEXT,
    contract: {
      revision,
      generatedAt: T1,
      tournament: { id: CONTEXT.tournamentId, name: "Millonario 2026", status: "live", venue: "Lienzo Principal" },
      competition: { id: CONTEXT.competitionId, name: "Competencia por equipos", type: "equipos_completo", scope: "team" },
      charreada: { id: CONTEXT.charreadaId, name: "Charreada 4", status: "live" },
      suerte: { id: "colas", name: "Colas", status: "active", attempt: 2 },
      team: { id: "team_current", name: "Rancheros de Tijuana", total: 201, position: 3 },
      participant: { id: "participant_current", name: "Carlos Rodríguez" },
      horse: { id: "horse_current", name: "Lucero" },
      score: { id: "score_current", total: 0, status: "published", published: true, timestamp: T1 }
    },
    next: { team: { id: "team_next", name: "Rancho del Centro" }, status: "queued" },
    standings: [
      { position: 1, teamId: "team_a", teamName: "Rancho El Laurel", score: 303 },
      { position: 2, teamId: "team_last", teamName: "Charros de Jalisco", score: 302 },
      { position: 3, teamId: "team_current", teamName: "Rancheros de Tijuana", score: 201 }
    ],
    timer: { timerId: "timer_official", status: "running", formattedTime: "00:42.18", elapsedMs: 42180, remainingMs: 17820, sourceRevision: revision },
    notes: [{ messageId: "note_1", text: "Mencionar categoría", visibility: "operational" }],
    sponsorMention: { sponsorId: "sponsor_1", sponsorName: "Patrocinador", mentionText: "Mensaje autorizado" },
    alerts: [{ alertId: "alert_1", level: "warning", message: "Revisar siguiente turno", visibility: "operational" }],
    context: { tournamentId: CONTEXT.tournamentId, competitionId: CONTEXT.competitionId, charreadaId: CONTEXT.charreadaId, suerteId: "colas" },
    generatedAt: T1
  };
}

function mountedTargets() {
  const documentRef = new MockDocument();
  const programHost = documentRef.createElement("section");
  const announcerHost = documentRef.createElement("section");
  documentRef.body.append(programHost, announcerHost);
  const programMainOutput = createProgramMainOutput({ programMainOutputId: "program_output_sync", browserOutputId: "browser_program_sync" }, { now: T0 });
  configureProgramMainOutput(programMainOutput, {
    programMainOutputId: "program_output_sync",
    browserOutputId: "browser_program_sync",
    routeId: "route-program-main",
    outputId: "program-main",
    routeType: "program_main",
    sourceType: "program_snapshot",
    displayMode: "fit",
    visibility: "public",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: true,
    tournamentId: CONTEXT.tournamentId,
    competitionId: CONTEXT.competitionId
  }, { now: T0 });
  mountProgramMainOutput(programMainOutput, programHost, { now: T0 });

  const announcerMonitor = createAnnouncerMonitor({ announcerMonitorId: "announcer_sync", browserOutputId: "browser_announcer_sync" }, { now: T0 });
  configureAnnouncerMonitor(announcerMonitor, {
    announcerMonitorId: "announcer_sync",
    browserOutputId: "browser_announcer_sync",
    routeId: "route-announcer-monitor",
    outputId: "announcer-monitor",
    routeType: "announcer_monitor",
    sourceType: "announcer_projection",
    displayMode: "balanced",
    visibility: "operational",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    transparentBackground: false,
    videoRegion: { enabled: true, status: "placeholder", sourceType: null, connected: false, muted: true, aspectRatio: "16:9" },
    ...CONTEXT
  }, { now: T0 });
  mountAnnouncerMonitor(announcerMonitor, announcerHost, { now: T0 });
  return { documentRef, programMainOutput, announcerMonitor };
}

function routingEngine() {
  const engine = createOutputRoutingEngine({ engineId: "sync_routing", now: T0 });
  createOutputRoute(engine, {
    routeId: "route-program-main",
    routeType: "program_main",
    outputId: "program-main",
    sourceType: "program_snapshot",
    visibility: "public",
    staleAfterMs: 60000,
    ...CONTEXT
  }, { now: T0 });
  createOutputRoute(engine, {
    routeId: "route-announcer-monitor",
    routeType: "announcer_monitor",
    outputId: "announcer-monitor",
    sourceType: "announcer_projection",
    visibility: "operational",
    staleAfterMs: 60000,
    ...CONTEXT
  }, { now: T0 });
  return engine;
}

assert.equal(api.OUTPUT_SYNCHRONIZATION_VERSION, "1.0.0");
assert.deepEqual([...api.OUTPUT_SYNCHRONIZATION_TARGETS], ["program_main", "announcer_monitor"]);
assert.ok(api.OUTPUT_SYNCHRONIZATION_STATES.includes("stale"));
for (const name of [
  "createOutputSynchronization", "configureOutputSynchronization", "startOutputSynchronization", "stopOutputSynchronization",
  "synchronizeProgramMain", "synchronizeAnnouncerMonitor", "synchronizeAllOutputs", "clearSynchronizedOutput",
  "markSynchronizedOutputStale", "getOutputSynchronization", "getOutputSynchronizationStatus",
  "getOutputSynchronizationWarnings", "getOutputSynchronizationErrors", "buildOutputSynchronizationSnapshot",
  "validateOutputSynchronizationSnapshot", "cloneOutputSynchronizationResult", "destroyOutputSynchronization"
]) assert.equal(typeof api[name], "function", `missing export ${name}`);

const targets = mountedTargets();
const routes = routingEngine();
const program = createProgram();
const sync = api.createOutputSynchronization({ synchronizationId: "sync_test" }, { now: T0 });
assert.equal(sync.status, "uninitialized");
api.configureOutputSynchronization(sync, { targets: [...api.OUTPUT_SYNCHRONIZATION_TARGETS], staleAfterMs: 60000, context: CONTEXT }, { expectedRevision: 0, now: T0 });
api.startOutputSynchronization(sync, { expectedRevision: 1, now: T0 });
assert.equal(sync.status, "ready");

const programSnapshotBefore = getProgramSnapshot(program, { visibility: "public", now: T2 });
const programSourceSerialized = JSON.stringify(programSnapshotBefore);
let result = api.synchronizeProgramMain(sync, {
  routingEngine: routes,
  programEngine: program,
  programMainOutput: targets.programMainOutput,
  context: CONTEXT
}, { expectedRevision: 2, idempotencyKey: "program_1", now: T2 });
assert.equal(result.targets.program_main.status, "synchronized");
assert.equal(result.targets.announcer_monitor.status, "ready");
assert.equal(buildProgramMainOutputSnapshot(targets.programMainOutput, { now: T2 }).componentCount, 1);
assert.equal(JSON.stringify(getProgramSnapshot(program, { visibility: "public", now: T2 })), programSourceSerialized);

const syncRevisionAfterProgram = sync.revision;
const outputRevisionAfterProgram = result.targets.program_main.outputRevision;
result = api.synchronizeProgramMain(sync, {
  routingEngine: routes,
  programEngine: program,
  programMainOutput: targets.programMainOutput,
  context: CONTEXT
}, { idempotencyKey: "program_1", now: T3 });
assert.equal(sync.revision, syncRevisionAfterProgram);
assert.equal(result.targets.program_main.outputRevision, outputRevisionAfterProgram);

// An official empty Program clears Program Main without treating absence as an error.
const emptyProgram = createProgramEngine({ engineId: "program_empty", now: T0 });
result = api.synchronizeProgramMain(sync, {
  routingEngine: routes,
  programEngine: emptyProgram,
  programMainOutput: targets.programMainOutput,
  context: CONTEXT
}, { expectedRevision: sync.revision, now: T3 });
assert.equal(result.targets.program_main.status, "cleared");
assert.equal(result.targets.program_main.sourceRevision, 0);
assert.equal(buildProgramMainOutputSnapshot(targets.programMainOutput, { now: T3 }).componentCount, 0);
assert.equal(result.errors.length, 0);

const announcerSource = announcerSources(1);
const announcerSourceClone = structuredClone(announcerSource);
result = api.synchronizeAnnouncerMonitor(sync, {
  routingEngine: routes,
  announcerSources: announcerSource,
  announcerMonitor: targets.announcerMonitor,
  context: CONTEXT,
  visibility: "operational"
}, { expectedRevision: sync.revision, idempotencyKey: "announcer_1", now: T2 });
assert.equal(result.targets.announcer_monitor.status, "synchronized");
assert.equal(getAnnouncerSnapshot(targets.announcerMonitor, { now: T2 }).currentSummary.teamName, "Rancheros de Tijuana");
assert.equal(getAnnouncerSnapshot(targets.announcerMonitor, { now: T2 }).timerSummary.formattedTime, "00:42.18");
assert.equal(getAnnouncerSnapshot(targets.announcerMonitor, { now: T2 }).currentSummary.score, 0);
assert.deepEqual(announcerSource, announcerSourceClone);

// Explicit clear and stale remain isolated per target.
const announcerRevisionBeforeProgramClear = getAnnouncerSnapshot(targets.announcerMonitor, { now: T2 }).projectionRevision;
result = api.clearSynchronizedOutput(sync, "program_main", { programMainOutput: targets.programMainOutput }, {
  expectedRevision: sync.revision,
  idempotencyKey: "clear_program",
  now: T3
});
assert.equal(result.targets.program_main.status, "cleared");
assert.equal(getAnnouncerSnapshot(targets.announcerMonitor, { now: T3 }).projectionRevision, announcerRevisionBeforeProgramClear);
result = api.markSynchronizedOutputStale(sync, "announcer_monitor", { expectedRevision: sync.revision, reason: "source-changed", now: T3 });
assert.equal(result.targets.announcer_monitor.stale, true);
assert.equal(result.targets.program_main.stale, false);

// Expected revision conflicts are atomic.
const beforeConflict = api.getOutputSynchronization(sync, { now: T3 });
assert.throws(
  () => api.clearSynchronizedOutput(sync, "announcer_monitor", { announcerMonitor: targets.announcerMonitor }, { expectedRevision: 0, now: T3 }),
  (error) => error.code === api.OUTPUT_SYNCHRONIZATION_ERROR_CODES.REVISION_CONFLICT
);
assert.deepEqual(api.getOutputSynchronization(sync, { now: T3 }), beforeConflict);

// Same idempotency key with a different intention is rejected.
assert.throws(
  () => api.synchronizeAnnouncerMonitor(sync, {
    routingEngine: routes,
    announcerSources: announcerSources(2),
    announcerMonitor: targets.announcerMonitor,
    context: CONTEXT
  }, { idempotencyKey: "announcer_1", now: T4 }),
  (error) => error.code === api.OUTPUT_SYNCHRONIZATION_ERROR_CODES.IDEMPOTENCY_CONFLICT
);

// Unsafe values and cross-tenant contexts never reach a target.
assert.throws(
  () => api.synchronizeAnnouncerMonitor(sync, {
    routingEngine: routes,
    announcerSources: { ...announcerSources(2), injected: () => "bad" },
    announcerMonitor: targets.announcerMonitor,
    context: CONTEXT
  }, { now: T4 }),
  (error) => error.code === api.OUTPUT_SYNCHRONIZATION_ERROR_CODES.UNSAFE_PAYLOAD
);
assert.throws(
  () => api.synchronizeProgramMain(sync, {
    routingEngine: routes,
    programEngine: program,
    programMainOutput: targets.programMainOutput,
    context: { ...CONTEXT, tenantId: "tenant_b" }
  }, { now: T4 }),
  (error) => error.code === api.OUTPUT_SYNCHRONIZATION_ERROR_CODES.CONTEXT_CONFLICT
);

const accessorSource = announcerSources(3);
Object.defineProperty(accessorSource, "unsafeGetter", { enumerable: true, get() { throw new Error("must-not-run"); } });
assert.throws(
  () => api.synchronizeAnnouncerMonitor(sync, {
    routingEngine: routes,
    announcerSources: accessorSource,
    announcerMonitor: targets.announcerMonitor,
    context: CONTEXT
  }, { now: T4 }),
  (error) => error.code === api.OUTPUT_SYNCHRONIZATION_ERROR_CODES.UNSAFE_PAYLOAD
);

// synchronizeAll updates both targets in one controlled synchronization revision.
const beforeAllRevision = sync.revision;
result = api.synchronizeAllOutputs(sync, {
  programMain: {
    routingEngine: routes,
    programEngine: program,
    programMainOutput: targets.programMainOutput,
    context: CONTEXT
  },
  announcerMonitor: {
    routingEngine: routes,
    announcerSources: announcerSources(1),
    announcerMonitor: targets.announcerMonitor,
    context: CONTEXT,
    visibility: "operational"
  }
}, { expectedRevision: beforeAllRevision, idempotencyKey: "all_1", now: T4 });
assert.equal(sync.revision, beforeAllRevision + 1);
assert.equal(result.status, "synchronized");
assert.equal(result.targets.program_main.status, "synchronized");
assert.equal(result.targets.announcer_monitor.status, "synchronized");

const snapshot = api.buildOutputSynchronizationSnapshot(sync, { now: T4 });
assert.equal(api.validateOutputSynchronizationSnapshot(snapshot).valid, true);
assert.doesNotThrow(() => JSON.stringify(snapshot));
for (const forbidden of ["programSnapshot", "announcerSources", "runtime", "listener", "callback", "firebase", "password", "token"]) {
  assert.equal(JSON.stringify(snapshot).toLowerCase().includes(forbidden.toLowerCase()), false, `${forbidden} leaked`);
}
snapshot.targets.program_main.status = "mutated";
assert.notEqual(api.buildOutputSynchronizationSnapshot(sync, { now: T4 }).targets.program_main.status, "mutated");

api.stopOutputSynchronization(sync, { expectedRevision: sync.revision, idempotencyKey: "stop_1", now: T4 });
assert.equal(sync.status, "stopped");
api.destroyOutputSynchronization(sync, { expectedRevision: sync.revision, now: T4 });
assert.equal(sync.status, "destroyed");
for (const operation of [
  () => api.startOutputSynchronization(sync),
  () => api.synchronizeProgramMain(sync, {}),
  () => api.synchronizeAnnouncerMonitor(sync, {}),
  () => api.clearSynchronizedOutput(sync, "program_main", {}),
  () => api.markSynchronizedOutputStale(sync, "program_main"),
  () => api.getOutputSynchronization(sync),
  () => api.buildOutputSynchronizationSnapshot(sync)
]) {
  assert.throws(operation, (error) => error.code === api.OUTPUT_SYNCHRONIZATION_ERROR_CODES.DESTROYED);
}

const moduleSource = await readFile(new URL("../js/broadcast/outputSynchronization.js", import.meta.url), "utf8");
assert.doesNotMatch(moduleSource, /WebSocket|BroadcastChannel|EventSource|ServiceWorker|setInterval|setTimeout|localStorage|sessionStorage|indexedDB|postMessage|fetch\s*\(/);
assert.doesNotMatch(moduleSource, /eval\s*\(|new Function|innerHTML|cssText/);
assert.doesNotMatch(moduleSource, /firebase/i);

console.log("output-synchronization.test.mjs: ok");
