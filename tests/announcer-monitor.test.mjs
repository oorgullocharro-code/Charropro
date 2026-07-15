import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as api from "../js/broadcast/announcerMonitor.js";
import {
  ANNOUNCER_MONITOR_DISPLAY_MODES,
  ANNOUNCER_MONITOR_ERROR_CODES,
  ANNOUNCER_MONITOR_STATES,
  ANNOUNCER_MONITOR_VERSION,
  BroadcastAnnouncerMonitorError,
  clearAnnouncerMonitor,
  cloneAnnouncerSnapshot,
  configureAnnouncerMonitor,
  createAnnouncerMonitor,
  destroyAnnouncerMonitor,
  getAnnouncerErrors,
  getAnnouncerMonitor,
  getAnnouncerSnapshot,
  getAnnouncerStatus,
  getAnnouncerWarnings,
  mountAnnouncerMonitor,
  renderAnnouncerProjection,
  setAnnouncerDisplayMode,
  setAnnouncerViewport,
  updateAnnouncerMonitor,
  validateAnnouncerMonitorConfig,
  validateAnnouncerProjection,
  validateAnnouncerSnapshot
} from "../js/broadcast/announcerMonitor.js";

class MockStyle {
  constructor() { this.properties = new Map(); }
  setProperty(name, value) { this.properties.set(name, String(value)); }
}

class MockElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = new MockStyle();
    this.className = "";
    this._textContent = "";
    this.value = "";
    this.clientWidth = 1920;
    this.clientHeight = 1080;
    this.requestFullscreenCalls = 0;
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
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "value") this.value = String(value);
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  requestFullscreen() { this.requestFullscreenCalls += 1; return Promise.resolve(); }
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
  constructor() { this.nodeType = 9; this.body = new MockElement("body", this); }
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

const T0 = "2026-07-15T21:00:00.000Z";
const T1 = "2026-07-15T21:00:01.000Z";
const T2 = "2026-07-15T21:00:02.000Z";
const T3 = "2026-07-15T21:00:03.000Z";

function config(overrides = {}) {
  return {
    announcerMonitorId: overrides.announcerMonitorId || "announcer-monitor-test",
    browserOutputId: overrides.browserOutputId || "browser-output-announcer-test",
    routeId: overrides.routeId || "route-announcer-monitor",
    outputId: overrides.outputId || "announcer-monitor",
    routeType: overrides.routeType || "announcer_monitor",
    sourceType: overrides.sourceType || "announcer_projection",
    displayMode: overrides.displayMode || "balanced",
    visibility: overrides.visibility || "operational",
    resolution: overrides.resolution || { width: 1920, height: 1080 },
    orientation: overrides.orientation || "landscape",
    transparentBackground: overrides.transparentBackground ?? false,
    viewport: overrides.viewport ?? null,
    videoRegion: overrides.videoRegion || {
      enabled: true,
      status: "placeholder",
      sourceType: null,
      connected: false,
      muted: true,
      aspectRatio: "16:9"
    },
    tenantId: overrides.tenantId ?? "tenant-a",
    organizationId: overrides.organizationId ?? "organization-a",
    clientId: overrides.clientId ?? "client-a",
    tournamentId: overrides.tournamentId ?? "tournament-a",
    competitionId: overrides.competitionId ?? "competition-a",
    sessionId: overrides.sessionId ?? "session-a",
    metadata: overrides.metadata || { fixture: true }
  };
}

function envelope(overrides = {}) {
  const revision = overrides.revision ?? 1;
  return {
    routeId: overrides.routeId || "route-announcer-monitor",
    routeType: overrides.routeType || "announcer_monitor",
    outputId: overrides.outputId || "announcer-monitor",
    sourceType: overrides.sourceType || "announcer_projection",
    sourceRevision: overrides.sourceRevision ?? revision,
    routeRevision: overrides.routeRevision ?? revision,
    status: overrides.status || "routed",
    visibility: overrides.visibility || "operational",
    resolution: overrides.resolution || { width: 1920, height: 1080 },
    projection: overrides.projection === undefined ? {
      kind: "announcer-monitor",
      status: overrides.projectionStatus || "ready",
      current: {
        teamId: "team-b", teamName: "Rancheros de Tijuana",
        participantId: "participant-b", participantName: "Carlos Rodríguez",
        horseId: "horse-b", horseName: "Lucero", suerteId: "colas", suerteName: "Colas",
        attempt: 2, score: 201, position: 3, leader: false, status: "active", turnRevision: 18
      },
      next: {
        teamId: "team-c", teamName: "Rancho del Centro", participantId: "participant-c",
        participantName: "Miguel Torres", horseName: "Relámpago", suerteName: "Colas",
        estimatedOrder: 2, status: "queued"
      },
      standings: [
        { position: 1, teamId: "team-a", teamName: "Rancho El Laurel", score: 303 },
        { position: 2, teamId: "team-last", teamName: "Charros de Jalisco", score: 302 },
        { position: 3, teamId: "team-b", teamName: "Rancheros de Tijuana", score: 201 }
      ],
      timer: { timerId: "timer-official", status: "running", formattedTime: "00:42.18", elapsedMs: 42180, remainingMs: 17820, sourceRevision: revision },
      notes: [{ messageId: "note-1", text: "Mencionar categoría", visibility: "operational" }],
      privateNotes: [{ messageId: "private-1", text: "Nota interna", visibility: "restricted" }],
      sponsorMention: { sponsorId: "sponsor-1", sponsorName: "Patrocinador", mentionText: "Mensaje autorizado", logoRef: { assetId: "asset-sponsor" } },
      alerts: [{ alertId: "alert-1", level: "warning", title: "Producción", message: "Revisar siguiente turno", visibility: "operational" }],
      context: {
        tournamentId: "tournament-a", tournamentName: "Millonario 2026",
        competitionId: "competition-a", competitionName: "Competencia por equipos",
        sessionId: "session-a", sessionName: "Charreada 4", charreadaName: "Charreada 4",
        venueName: "Lienzo Principal", currentSuerteName: "Colas", categoryName: "AAA",
        eventDate: "2026-07-15", progress: 0, status: "live"
      },
      generatedAt: T1,
      empty: false
    } : overrides.projection,
    warnings: overrides.warnings || [],
    errors: overrides.errors || [],
    resolvedAt: overrides.resolvedAt || T1,
    tenantId: overrides.tenantId ?? "tenant-a",
    organizationId: overrides.organizationId ?? "organization-a",
    clientId: overrides.clientId ?? "client-a",
    tournamentId: overrides.tournamentId ?? "tournament-a",
    competitionId: overrides.competitionId ?? "competition-a",
    sessionId: overrides.sessionId ?? "session-a"
  };
}

function mounted(overrides = {}) {
  const document = new MockDocument();
  const container = document.createElement("main");
  document.body.appendChild(container);
  const instance = createAnnouncerMonitor({
    announcerMonitorId: overrides.announcerMonitorId || "announcer-monitor-test",
    browserOutputId: overrides.browserOutputId || "browser-output-announcer-test"
  }, { now: T0 });
  configureAnnouncerMonitor(instance, config(overrides), { now: T0 });
  mountAnnouncerMonitor(instance, container, { now: T0 });
  return { document, container, instance };
}

const requiredExports = [
  "ANNOUNCER_MONITOR_VERSION", "ANNOUNCER_MONITOR_STATES", "ANNOUNCER_MONITOR_DISPLAY_MODES",
  "ANNOUNCER_MONITOR_ERROR_CODES", "BroadcastAnnouncerMonitorError", "createAnnouncerMonitor",
  "configureAnnouncerMonitor", "mountAnnouncerMonitor", "updateAnnouncerMonitor",
  "renderAnnouncerProjection", "clearAnnouncerMonitor", "destroyAnnouncerMonitor",
  "setAnnouncerDisplayMode", "setAnnouncerViewport", "getAnnouncerMonitor", "getAnnouncerStatus",
  "getAnnouncerWarnings", "getAnnouncerErrors", "getAnnouncerSnapshot",
  "validateAnnouncerMonitorConfig", "validateAnnouncerProjection", "validateAnnouncerSnapshot",
  "cloneAnnouncerSnapshot"
];
for (const name of requiredExports) assert.ok(name in api, `missing export ${name}`);
assert.equal(ANNOUNCER_MONITOR_VERSION, "1.0.0");
assert.ok(ANNOUNCER_MONITOR_STATES.includes("stale"));
assert.deepEqual([...ANNOUNCER_MONITOR_DISPLAY_MODES], ["balanced", "video_focus", "data_focus", "compact", "large_text"]);
assert.equal(new BroadcastAnnouncerMonitorError("test").code, "test");

// Configuration and route contract are strict and reserve video as a disconnected placeholder.
assert.equal(validateAnnouncerMonitorConfig(config()).valid, true);
for (const patch of [
  { routeType: "program_main" }, { outputId: "program-main" }, { sourceType: "program_snapshot" },
  { visibility: "public" }, { displayMode: "invalid" },
  { videoRegion: { enabled: true, status: "placeholder", sourceType: "ndi", connected: false, muted: true, aspectRatio: "16:9" } }
]) assert.equal(validateAnnouncerMonitorConfig(config(patch)).valid, false);
const unsafeConfig = config();
unsafeConfig.metadata.handler = () => {};
assert.equal(validateAnnouncerMonitorConfig(unsafeConfig).valid, false);
assert.equal(validateAnnouncerProjection(envelope(), { config: config() }).valid, true);
assert.equal(validateAnnouncerProjection(envelope({ routeType: "timer_display" }), { config: config() }).valid, false);
assert.equal(validateAnnouncerProjection(envelope({ visibility: "public" }), { config: config() }).valid, false);

// Lifecycle creates exactly one root and all fixed regions.
const base = mounted();
assert.equal(base.container.querySelectorAll("[data-announcer-monitor-id]").length, 1);
for (const className of [
  "announcer-video-region", "announcer-current-region", "announcer-timer-region", "announcer-next-region",
  "announcer-standings-region", "announcer-notes-region", "announcer-sponsor-region", "announcer-alerts-region"
]) assert.ok(base.container.querySelector(`.${className}`), `missing ${className}`);
const root = base.container.querySelector("[data-announcer-monitor-id]");
assert.equal(getAnnouncerMonitor(base.instance).videoRegionId, "announcer-video-region-announcer-monitor-test");
assert.equal(base.container.querySelector(".announcer-video-region").getAttribute("id"), "announcer-video-region-announcer-monitor-test");
assert.equal(root.getAttribute("data-video-connected"), "false");
assert.equal(root.getAttribute("data-video-muted"), "true");
assert.match(base.container.textContent, /VIDEO LOCAL/);
assert.match(base.container.textContent, /Fuente NDI pendiente de conexión/);
mountAnnouncerMonitor(base.instance, base.container, { now: T0 });
assert.equal(base.container.querySelectorAll("[data-announcer-monitor-id]").length, 1);

// Current state comes from the official projection and never from the latest scored team.
const source = envelope();
const sourceClone = structuredClone(source);
const rendered = renderAnnouncerProjection(base.instance, source, { now: T1 });
assert.equal(rendered.status, "ready");
assert.equal(rendered.sourceRevision, 1);
assert.match(base.container.textContent, /Rancheros de Tijuana/);
assert.match(base.container.textContent, /Charros de Jalisco/);
assert.equal(getAnnouncerSnapshot(base.instance, { now: T2 }).currentSummary.teamName, "Rancheros de Tijuana");
assert.deepEqual(source, sourceClone);
assert.deepEqual(getAnnouncerWarnings(base.instance), []);
assert.deepEqual(getAnnouncerErrors(base.instance), []);
assert.equal(getAnnouncerStatus(base.instance).status, "ready");

// Real Output Routing nested projection shape is normalized without changing scope semantics.
const nested = envelope({ revision: 2 });
nested.projection.current = {
  tournament: { id: "tournament-a", name: "Millonario 2026", venue: "Lienzo Principal", status: "live" },
  competition: { id: "competition-a", name: "Charro Completo", scope: "individual", category: "Libre" },
  charreada: { id: "charreada-2", name: "Final", date: "2026-07-15", status: "live" },
  suerte: { id: "piales", name: "Piales", status: "active", attempt: 0 },
  participant: { id: "participant-zero", name: "Juan Pérez", position: 0 },
  horse: { id: "horse-zero", name: "Centenario" },
  score: { total: 0, status: "published" },
  leader: false,
  turnRevision: 0
};
nested.projection.next = { participant: { id: "participant-2", name: "Pedro López" }, suerte: { id: "piales", name: "Piales" }, order: 0 };
nested.projection.standings = [
  { position: 1, participantId: "participant-zero", participantName: "Juan Pérez", total: 0 },
  { position: 2, participantId: "participant-2", participantName: "Pedro López", total: 0 }
];
nested.projection.timer = { id: "timer-real", status: "paused", display: "", elapsedMs: 0, remainingMs: 0, revision: 0 };
nested.projection.context = { tournamentId: "tournament-a", competitionId: "competition-a", sessionId: "session-a", progress: 0 };
updateAnnouncerMonitor(base.instance, nested, { now: T2 });
const zeroSnapshot = getAnnouncerSnapshot(base.instance, { now: T2 });
assert.equal(zeroSnapshot.currentSummary.participantName, "Juan Pérez");
assert.equal(zeroSnapshot.currentSummary.teamName, null);
assert.equal(zeroSnapshot.currentSummary.score, 0);
assert.equal(zeroSnapshot.currentSummary.position, 0);
assert.equal(zeroSnapshot.timerSummary.formattedTime, "");
assert.equal(zeroSnapshot.timerSummary.elapsedMs, 0);

// Standings preserve order and cardinality for team and individual fixtures.
const four = mounted({ announcerMonitorId: "four-monitor", browserOutputId: "four-browser" });
const fourSource = envelope({ revision: 1 });
fourSource.projection.standings.push({ position: 4, teamId: "team-d", teamName: "Cuarto Equipo", score: 0 });
updateAnnouncerMonitor(four.instance, fourSource, { now: T1 });
assert.equal(getAnnouncerSnapshot(four.instance).standingsCount, 4);
assert.equal(four.container.querySelectorAll(".announcer-standings-list")[0].children.length, 4);

// Partial, stale, disabled and unavailable are controlled non-writing states.
const states = mounted({ announcerMonitorId: "states-monitor", browserOutputId: "states-browser" });
const partial = envelope({ revision: 1 });
partial.projection.current = { participantName: "Solo participante" };
partial.projection.timer = { status: "unavailable", formattedTime: null };
partial.projection.context = {};
assert.equal(updateAnnouncerMonitor(states.instance, partial, { now: T1 }).status, "partial");
const partialSnapshot = getAnnouncerSnapshot(states.instance, { now: T1 });
assert.equal(partialSnapshot.currentSummary.participantName, "Solo participante");
assert.equal(updateAnnouncerMonitor(states.instance, envelope({ revision: 2, status: "stale" }), { now: T2 }).status, "stale");
assert.match(states.container.textContent, /Datos pendientes de actualización/);
const disabled = envelope({ revision: 3, status: "disabled", projection: null });
assert.equal(updateAnnouncerMonitor(states.instance, disabled, { now: T2 }).status, "disabled");
const unavailable = envelope({ revision: 4, projectionStatus: "unavailable" });
assert.equal(updateAnnouncerMonitor(states.instance, unavailable, { now: T3 }).status, "unavailable");

// Every official timer state is displayed as received without a local clock.
const timerStates = mounted({ announcerMonitorId: "timer-monitor", browserOutputId: "timer-browser" });
for (const [index, timerStatus] of ["ready", "running", "paused", "stopped", "finished", "completed", "unavailable", "stale", "offline"].entries()) {
  const timerEnvelope = envelope({ revision: index + 1 });
  timerEnvelope.projection.timer = {
    timerId: "timer-official",
    status: timerStatus,
    formattedTime: timerStatus === "unavailable" || timerStatus === "offline" ? null : `00:0${index}`,
    elapsedMs: index === 0 ? 0 : index * 1000,
    remainingMs: 0,
    sourceRevision: index,
    alertState: index === 0 ? "" : null
  };
  updateAnnouncerMonitor(timerStates.instance, timerEnvelope, { now: T2 });
  const timerSnapshot = getAnnouncerSnapshot(timerStates.instance, { now: T2 });
  assert.equal(timerSnapshot.timerSummary.status, timerStatus);
  assert.equal(timerSnapshot.timerSummary.elapsedMs, index === 0 ? 0 : index * 1000);
  assert.equal(timerSnapshot.timerSummary.remainingMs, 0);
  assert.equal(timerSnapshot.timerSummary.sourceRevision, index);
}

// Revision and context protections are atomic and deterministic.
const revisions = mounted({ announcerMonitorId: "revision-monitor", browserOutputId: "revision-browser" });
updateAnnouncerMonitor(revisions.instance, envelope({ revision: 2 }), { now: T1 });
const stableBefore = getAnnouncerSnapshot(revisions.instance, { now: T2 });
updateAnnouncerMonitor(revisions.instance, envelope({ revision: 2 }), { now: T2 });
assert.equal(getAnnouncerMonitor(revisions.instance).projectionRevision, stableBefore.projectionRevision);
assert.throws(() => updateAnnouncerMonitor(revisions.instance, envelope({ revision: 1 })), (error) => error.code === ANNOUNCER_MONITOR_ERROR_CODES.REVISION_REGRESSION);
const conflict = envelope({ revision: 2 });
conflict.projection.current.teamName = "Cambio sin revisión";
assert.throws(() => updateAnnouncerMonitor(revisions.instance, conflict), (error) => error.code === ANNOUNCER_MONITOR_ERROR_CODES.REVISION_CONFLICT);
assert.throws(() => updateAnnouncerMonitor(revisions.instance, envelope({ revision: 3, tenantId: "tenant-b" })), (error) => error.code === ANNOUNCER_MONITOR_ERROR_CODES.CONTEXT_CONFLICT);
assert.deepEqual(getAnnouncerSnapshot(revisions.instance, { now: T2 }).currentSummary, stableBefore.currentSummary);

// Restricted notes are available only to a restricted monitor; visibility never elevates.
const restricted = mounted({ announcerMonitorId: "restricted-monitor", browserOutputId: "restricted-browser", visibility: "restricted" });
updateAnnouncerMonitor(restricted.instance, envelope({ revision: 1, visibility: "restricted" }), { now: T1 });
assert.equal(getAnnouncerSnapshot(restricted.instance, { visibility: "restricted" }).notesCount, 2);
assert.equal(getAnnouncerSnapshot(restricted.instance, { visibility: "operational" }).notesCount, 1);
updateAnnouncerMonitor(restricted.instance, envelope({ revision: 2, visibility: "operational" }), { now: T2 });
assert.equal(getAnnouncerSnapshot(restricted.instance, { visibility: "operational" }).notesCount, 1);
assert.doesNotMatch(restricted.container.textContent, /Nota interna/);
assert.throws(() => getAnnouncerSnapshot(base.instance, { visibility: "restricted" }), (error) => error.code === ANNOUNCER_MONITOR_ERROR_CODES.INVALID_VISIBILITY);

// Hostile markup is text, while executable structures and oversized collections are rejected.
const security = mounted({ announcerMonitorId: "security-monitor", browserOutputId: "security-browser" });
const hostile = envelope({ revision: 1 });
hostile.projection.notes = [{ messageId: "hostile", text: "<script>alert(1)</script><img src=x onerror=alert(1)> javascript: data:text/html", visibility: "operational" }];
hostile.projection.alerts = [{ alertId: "hostile-alert", level: "critical", title: "<iframe>", message: "<object><embed>", visibility: "operational" }];
updateAnnouncerMonitor(security.instance, hostile, { now: T1 });
assert.equal(security.container.querySelectorAll("script").length, 0);
assert.equal(security.container.querySelectorAll("iframe").length, 0);
assert.equal(security.container.querySelectorAll("img").length, 0);
assert.match(security.container.textContent, /‹script›/);
const unsafeFunction = envelope({ revision: 2 });
unsafeFunction.projection.notes[0].handler = () => {};
assert.equal(validateAnnouncerProjection(unsafeFunction, { config: config() }).valid, false);
const unsafeGetter = envelope({ revision: 2 });
Object.defineProperty(unsafeGetter.projection.current, "secretValue", { get() { return "bad"; }, enumerable: true });
assert.equal(validateAnnouncerProjection(unsafeGetter, { config: config() }).valid, false);
const cyclic = envelope({ revision: 2 });
cyclic.projection.current.cycle = cyclic.projection;
assert.equal(validateAnnouncerProjection(cyclic, { config: config() }).valid, false);
const tooMany = envelope({ revision: 2 });
tooMany.projection.standings = Array.from({ length: 101 }, (_, index) => ({ position: index + 1, teamName: `Equipo ${index}` }));
assert.equal(validateAnnouncerProjection(tooMany, { config: config() }).valid, false);

// Local display controls never change source data or revisions.
const modes = mounted({ announcerMonitorId: "mode-monitor", browserOutputId: "mode-browser" });
const modeSource = envelope({ revision: 1 });
updateAnnouncerMonitor(modes.instance, modeSource, { now: T1 });
const modeSourceClone = structuredClone(modeSource);
for (const mode of ANNOUNCER_MONITOR_DISPLAY_MODES) {
  const before = getAnnouncerMonitor(modes.instance);
  const descriptor = setAnnouncerDisplayMode(modes.instance, mode, { now: T2 });
  assert.equal(descriptor.displayMode, mode);
  assert.equal(descriptor.videoDisplayMode, mode);
  assert.equal(descriptor.sourceRevision, before.sourceRevision);
  assert.equal(modes.container.querySelector("[data-announcer-monitor-id]").getAttribute("data-display-mode"), mode);
}
assert.throws(() => setAnnouncerDisplayMode(modes.instance, "invalid"), (error) => error.code === ANNOUNCER_MONITOR_ERROR_CODES.INVALID_CONFIG);
setAnnouncerViewport(modes.instance, { width: 390, height: 844 }, { now: T2 });
assert.equal(getAnnouncerMonitor(modes.instance).viewport.width, 390);
assert.equal(getAnnouncerMonitor(modes.instance).viewport.height, 844);
assert.deepEqual(modeSource, modeSourceClone);

// Snapshots are compact, serializable and deeply detached.
const snapshot = getAnnouncerSnapshot(modes.instance, { now: T3 });
assert.equal(validateAnnouncerSnapshot(snapshot).valid, true);
assert.doesNotThrow(() => JSON.stringify(snapshot));
const snapshotText = JSON.stringify(snapshot);
for (const forbidden of ["signedUrl", "token", "password", "actor", "ndiSource", "buffer", "firebase"]) {
  assert.equal(snapshotText.includes(forbidden), false, `${forbidden} leaked`);
}
const snapshotClone = cloneAnnouncerSnapshot(snapshot);
snapshotClone.currentSummary.teamName = "Mutado";
snapshotClone.timerSummary.formattedTime = "99:99";
snapshotClone.warnings.push("mutated");
const snapshotAfter = getAnnouncerSnapshot(modes.instance, { now: T3 });
assert.equal(snapshotAfter.currentSummary.teamName, "Rancheros de Tijuana");
assert.equal(snapshotAfter.timerSummary.formattedTime, "00:42.18");
assert.equal(snapshotAfter.warnings.includes("mutated"), false);

// Clear, destroy and independent instances do not leak state or roots.
const first = mounted({ announcerMonitorId: "first-monitor", browserOutputId: "first-browser" });
const second = mounted({ announcerMonitorId: "second-monitor", browserOutputId: "second-browser", tournamentId: "tournament-b", competitionId: "competition-b", sessionId: "session-b" });
updateAnnouncerMonitor(first.instance, envelope({ revision: 1 }), { now: T1 });
const secondSource = envelope({ revision: 1, tournamentId: "tournament-b", competitionId: "competition-b", sessionId: "session-b" });
secondSource.projection.context.tournamentId = "tournament-b";
secondSource.projection.context.competitionId = "competition-b";
secondSource.projection.context.sessionId = "session-b";
updateAnnouncerMonitor(second.instance, secondSource, { now: T1 });
clearAnnouncerMonitor(first.instance, { now: T2 });
assert.equal(getAnnouncerMonitor(first.instance).status, "cleared");
assert.equal(getAnnouncerMonitor(second.instance).status, "ready");
assert.match(first.container.textContent, /VIDEO LOCAL/);
updateAnnouncerMonitor(first.instance, envelope({ revision: 3 }), { now: T3 });
assert.equal(getAnnouncerMonitor(first.instance).status, "ready");
destroyAnnouncerMonitor(first.instance, { now: T3 });
assert.equal(first.container.querySelectorAll("[data-announcer-monitor-id]").length, 0);
for (const operation of [
  () => mountAnnouncerMonitor(first.instance, first.container),
  () => updateAnnouncerMonitor(first.instance, envelope({ revision: 3 })),
  () => clearAnnouncerMonitor(first.instance),
  () => setAnnouncerDisplayMode(first.instance, "balanced"),
  () => setAnnouncerViewport(first.instance, { width: 1920, height: 1080 }),
  () => getAnnouncerSnapshot(first.instance)
]) assert.throws(operation, (error) => error.code === ANNOUNCER_MONITOR_ERROR_CODES.DESTROYED);

// Static surface stays isolated from Program, Preview, Firebase, media transport and timer controls.
const [sourceText, html, css, docs] = await Promise.all([
  readFile(new URL("../js/broadcast/announcerMonitor.js", import.meta.url), "utf8"),
  readFile(new URL("../announcer-monitor.html", import.meta.url), "utf8"),
  readFile(new URL("../css/announcer-monitor.css", import.meta.url), "utf8"),
  readFile(new URL("../BROADCAST_ANNOUNCER_MONITOR_V1.md", import.meta.url), "utf8")
]);
assert.match(html, /data-announcer-monitor-page/);
assert.match(html, /announcerMonitor\.js\?v=20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1/);
assert.match(html, /announcer-monitor\.css\?v=20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1/);
assert.doesNotMatch(html, /<video\b|<iframe\b|autoplay|src="https?:|\bTake\b|\bCut\b|\bAuto\b/i);
assert.doesNotMatch(sourceText, /from\s+["'][^"']*(?:programEngine|previewEngine|firebase|state\.js)/i);
assert.doesNotMatch(sourceText, /\b(?:fetch|WebSocket|EventSource|BroadcastChannel|RTCPeerConnection|setInterval)\s*\(/);
assert.doesNotMatch(sourceText, /createElement\(["'](?:video|iframe|audio|canvas)["']\)/i);
assert.doesNotMatch(sourceText, /\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write|\beval\s*\(|new Function|\.cssText\s*=/);
assert.match(sourceText, /from "\.\/browserOutput\.js\?v=/);
assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
assert.match(css, /data-display-mode="video_focus"/);
assert.match(css, /data-display-mode="data_focus"/);
assert.match(css, /@media \(max-width: 680px\)/);
assert.match(docs, /announcer_projection/);
assert.match(docs, /NDI/i);
assert.match(docs, /NDI no está implementado/i);

console.log("announcer-monitor.test.mjs: ok");
