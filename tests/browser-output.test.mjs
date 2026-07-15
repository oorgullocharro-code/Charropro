import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as browserOutputApi from "../js/broadcast/browserOutput.js";
import {
  BROWSER_OUTPUT_DISPLAY_MODES,
  BROWSER_OUTPUT_ERROR_CODES,
  BROWSER_OUTPUT_ORIENTATIONS,
  BROWSER_OUTPUT_STATES,
  BROWSER_OUTPUT_TYPES,
  BROWSER_OUTPUT_VERSION,
  BroadcastBrowserOutputError,
  applyBrowserOutputProjection,
  buildBrowserOutputSnapshot,
  clearBrowserOutput,
  cloneBrowserOutputResult,
  configureBrowserOutput,
  createBrowserOutput,
  destroyBrowserOutput,
  getBrowserOutput,
  getBrowserOutputErrors,
  getBrowserOutputStatus,
  getBrowserOutputWarnings,
  mountBrowserOutput,
  resolveBrowserOutputRequest,
  setBrowserOutputDisplayMode,
  setBrowserOutputViewport,
  updateBrowserOutput,
  validateBrowserOutputConfig,
  validateBrowserOutputProjection,
  validateBrowserOutputSnapshot
} from "../js/broadcast/browserOutput.js";

class MockStyle {
  constructor() {
    this.properties = new Map();
  }

  setProperty(name, value) {
    this.properties.set(name, String(value));
  }
}

class MockElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.style = new MockStyle();
    this.className = "";
    this.attributes = new Map();
    this._textContent = "";
    this.requestFullscreenCalls = 0;
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

  set textContent(value) {
    this.replaceChildren();
    this._textContent = String(value ?? "");
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }

  requestFullscreen() {
    this.requestFullscreenCalls += 1;
    return Promise.resolve();
  }
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.body = new MockElement("body", this);
  }

  createElement(tagName) {
    return new MockElement(tagName, this);
  }
}

const T0 = "2026-07-15T20:00:00.000Z";
const T1 = "2026-07-15T20:00:01.000Z";
const T2 = "2026-07-15T20:00:02.000Z";
const T3 = "2026-07-15T20:00:03.000Z";

const ROUTES = Object.freeze({
  program_main: Object.freeze({ outputId: "program-main", sourceType: "program_snapshot", visibility: "public" }),
  announcer_monitor: Object.freeze({ outputId: "announcer-monitor", sourceType: "announcer_projection", visibility: "operational" }),
  timer_display: Object.freeze({ outputId: "timer-display", sourceType: "timer_projection", visibility: "public" })
});

function config(type = "program_main", overrides = {}) {
  const route = ROUTES[type];
  return {
    browserOutputId: overrides.browserOutputId || `browser_${type}`,
    outputType: overrides.outputType || type,
    routeId: overrides.routeId || `route-${route.outputId}`,
    outputId: overrides.outputId || route.outputId,
    displayMode: "fit",
    visibility: overrides.visibility || route.visibility,
    resolution: overrides.resolution || { width: 1920, height: 1080 },
    orientation: overrides.orientation || "landscape",
    safeArea: overrides.safeArea || { top: 5, right: 5, bottom: 5, left: 5, unit: "percent" },
    transparentBackground: overrides.transparentBackground ?? false,
    fullscreenAllowed: overrides.fullscreenAllowed ?? true,
    tenantId: overrides.tenantId ?? "tenant_a",
    tournamentId: overrides.tournamentId ?? "tournament_a",
    competitionId: overrides.competitionId ?? "competition_a",
    metadata: overrides.metadata || { fixture: true }
  };
}

function routeEnvelope(type = "program_main", overrides = {}) {
  const route = ROUTES[type];
  const projectionByType = {
    program_main: {
      kind: "program-main",
      programId: "program_1",
      templateId: "template_1",
      themeId: "theme_1",
      components: [{ id: "scoreboard", value: 0 }],
      generatedAt: T1
    },
    announcer_monitor: {
      kind: "announcer-monitor",
      current: {
        team: { id: "team_1", name: "Rancho El Laurel", total: 318, position: 1 },
        participant: { id: "participant_1", name: "Alejandro Montaño" },
        horse: { id: "horse_1", name: "Lucero" },
        suerte: { id: "piales", name: "Piales", status: "active" },
        score: { id: "score_1", total: 32, status: "published" }
      },
      next: { participant: { id: "participant_2", name: "Pedro López" } },
      standings: [{ id: "team_1", name: "Rancho El Laurel", total: 318 }],
      timer: { status: "running", display: "00:34.2" },
      sponsorMention: { id: "sponsor_1", name: "Patrocinador" },
      notes: ["Mensaje autorizado"],
      generatedAt: T1
    },
    timer_display: {
      kind: "timer-display",
      timerId: "timer_1",
      status: "running",
      formattedTime: "00:34.2",
      elapsedMs: 34200,
      remainingMs: 25800,
      sourceRevision: 2,
      contextRef: { tournamentId: "tournament_a", competitionId: "competition_a", suerteId: "piales" },
      generatedAt: T1
    }
  };
  return {
    routeId: `route-${route.outputId}`,
    routeType: type,
    outputId: route.outputId,
    sourceType: route.sourceType,
    sourceRevision: 2,
    routeRevision: 3,
    status: "routed",
    visibility: route.visibility,
    resolution: { width: 1920, height: 1080 },
    projection: projectionByType[type],
    warnings: [],
    errors: [],
    resolvedAt: T1,
    tenantId: "tenant_a",
    tournamentId: "tournament_a",
    competitionId: "competition_a",
    ...overrides
  };
}

function createMounted(type = "program_main", overrides = {}) {
  const document = new MockDocument();
  const target = document.createElement("section");
  document.body.appendChild(target);
  const instance = createBrowserOutput({ browserOutputId: overrides.browserOutputId || `browser_${type}` }, { now: T0 });
  configureBrowserOutput(instance, config(type, overrides), { now: T0 });
  mountBrowserOutput(instance, target, { now: T0 });
  return { document, target, instance };
}

const requiredExports = [
  "BROWSER_OUTPUT_VERSION", "BROWSER_OUTPUT_STATES", "BROWSER_OUTPUT_TYPES", "BROWSER_OUTPUT_ERROR_CODES",
  "BROWSER_OUTPUT_ORIENTATIONS", "BROWSER_OUTPUT_DISPLAY_MODES", "BroadcastBrowserOutputError",
  "createBrowserOutput", "configureBrowserOutput", "mountBrowserOutput", "updateBrowserOutput",
  "clearBrowserOutput", "destroyBrowserOutput", "getBrowserOutput", "getBrowserOutputStatus",
  "getBrowserOutputWarnings", "getBrowserOutputErrors", "validateBrowserOutputConfig",
  "validateBrowserOutputProjection", "validateBrowserOutputSnapshot", "resolveBrowserOutputRequest",
  "applyBrowserOutputProjection", "setBrowserOutputDisplayMode", "setBrowserOutputViewport",
  "buildBrowserOutputSnapshot", "cloneBrowserOutputResult"
];

requiredExports.forEach((name) => assert.ok(name in browserOutputApi, `${name} missing`));
assert.equal(BROWSER_OUTPUT_VERSION, "1.0.0");
assert.deepEqual(BROWSER_OUTPUT_TYPES, ["generic", "program_main", "announcer_monitor", "timer_display"]);
assert.equal(BROWSER_OUTPUT_STATES.includes("destroyed"), true);
assert.equal(BROWSER_OUTPUT_STATES.includes("disabled"), true);
assert.deepEqual(BROWSER_OUTPUT_ORIENTATIONS, ["landscape", "portrait", "ultra_wide", "auto"]);
assert.deepEqual(BROWSER_OUTPUT_DISPLAY_MODES, ["fit", "fill", "native", "responsive", "fullscreen"]);
assert.equal(BROWSER_OUTPUT_ERROR_CODES.includes("browser-output-revision-regression"), true);
assert.equal(BroadcastBrowserOutputError.prototype instanceof Error, true);

// Configuration is strict and atomic.
assert.equal(validateBrowserOutputConfig(config()).valid, true);
assert.equal(validateBrowserOutputConfig(config("program_main", { browserOutputId: "bad id" })).valid, false);
assert.equal(validateBrowserOutputConfig({ ...config(), outputType: "arbitrary" }).valid, false);
assert.equal(validateBrowserOutputConfig(config("program_main", { outputId: "timer-display" })).valid, false);
assert.equal(validateBrowserOutputConfig(config("program_main", { resolution: { width: Infinity, height: 1080 } })).valid, false);
assert.equal(validateBrowserOutputConfig(config("program_main", { resolution: { width: -1, height: 1080 } })).valid, false);
assert.equal(validateBrowserOutputConfig(config("program_main", { safeArea: { top: 50, bottom: 50, left: 0, right: 0, unit: "percent" } })).valid, false);
assert.equal(validateBrowserOutputConfig(config("program_main", { orientation: "diagonal" })).valid, false);
assert.equal(validateBrowserOutputConfig(config("program_main", { metadata: { url: "javascript:alert(1)" } })).valid, false);

// Normal lifecycle and exactly one controlled root.
const lifecycle = createMounted();
assert.equal(lifecycle.instance.status, "mounted");
assert.equal(lifecycle.target.children.length, 1);
const root = lifecycle.target.children[0];
assert.equal(root.getAttribute("data-browser-output-id"), "browser_program_main");
assert.equal(root.getAttribute("data-output-type"), "program_main");
mountBrowserOutput(lifecycle.instance, lifecycle.target, { now: T1 });
assert.equal(lifecycle.target.children.length, 1);
const source = routeEnvelope();
const sourceBefore = structuredClone(source);
applyBrowserOutputProjection(lifecycle.instance, source, { now: T1 });
assert.equal(lifecycle.instance.status, "ready");
assert.equal(lifecycle.instance.projectionRevision, 1);
assert.equal(root.getAttribute("data-output-state"), "ready");
assert.deepEqual(source, sourceBefore);
const idempotent = applyBrowserOutputProjection(lifecycle.instance, source, { now: T2 });
assert.equal(idempotent.projectionRevision, 1);

// Empty, stale, unavailable and disabled are controlled states.
const empty = createMounted("program_main", { browserOutputId: "browser_empty" });
applyBrowserOutputProjection(empty.instance, routeEnvelope("program_main", {
  status: "controlled-empty",
  projection: { kind: "program-main", contentState: "empty", generatedAt: T1 }
}), { now: T1 });
assert.equal(empty.instance.status, "empty");
assert.match(empty.target.textContent, /Sin contenido al aire/);

const stale = routeEnvelope("program_main", {
  status: "stale",
  sourceRevision: 3,
  routeRevision: 4,
  projection: { kind: "program-main", programId: "stale_should_not_replace", generatedAt: T2 }
});
applyBrowserOutputProjection(lifecycle.instance, stale, { now: T2 });
assert.equal(lifecycle.instance.status, "stale");
assert.match(lifecycle.target.textContent, /Datos pendientes de actualización/);
const staleSnapshot = buildBrowserOutputSnapshot(lifecycle.instance, { visibility: "public", now: T2 });
assert.equal(staleSnapshot.projectionSummary.programId, "program_1");

const unavailable = createMounted("timer_display", { browserOutputId: "browser_unavailable" });
applyBrowserOutputProjection(unavailable.instance, routeEnvelope("timer_display", {
  projection: { ...routeEnvelope("timer_display").projection, status: "unavailable", formattedTime: null }
}), { now: T1 });
assert.equal(unavailable.instance.status, "unavailable");
assert.match(unavailable.target.textContent, /Salida no disponible/);

const disabled = createMounted("timer_display", { browserOutputId: "browser_disabled" });
applyBrowserOutputProjection(disabled.instance, routeEnvelope("timer_display", { status: "disabled", projection: null }), { now: T1 });
assert.equal(disabled.instance.status, "disabled");
assert.match(disabled.target.textContent, /Salida deshabilitada/);

// Clear preserves root and permits a later explicit application.
clearBrowserOutput(lifecycle.instance, { now: T2 });
assert.equal(lifecycle.instance.status, "cleared");
assert.equal(lifecycle.target.children.length, 1);
const reapplied = routeEnvelope("program_main", { sourceRevision: 5, routeRevision: 6, resolvedAt: T3 });
updateBrowserOutput(lifecycle.instance, reapplied, { now: T3 });
assert.equal(lifecycle.instance.status, "ready");
assert.equal(lifecycle.target.children.length, 1);

// Revision regression and same-revision mutation reject atomically.
const beforeRegression = getBrowserOutput(lifecycle.instance);
assert.throws(
  () => updateBrowserOutput(lifecycle.instance, routeEnvelope("program_main", { sourceRevision: 4, routeRevision: 6 }), { now: T3 }),
  (error) => error.code === "browser-output-revision-regression"
);
assert.deepEqual(getBrowserOutput(lifecycle.instance), beforeRegression);
assert.throws(
  () => updateBrowserOutput(lifecycle.instance, routeEnvelope("program_main", {
    sourceRevision: 5,
    routeRevision: 6,
    projection: { ...reapplied.projection, programId: "changed_same_revision" }
  }), { now: T3 }),
  (error) => error.code === "browser-output-revision-conflict"
);
assert.deepEqual(getBrowserOutput(lifecycle.instance), beforeRegression);

// Projection contract rejects direct or incompatible sources.
assert.equal(validateBrowserOutputProjection(routeEnvelope()).valid, true);
assert.equal(validateBrowserOutputProjection({ programId: "direct_program" }).valid, false);
assert.equal(validateBrowserOutputProjection({ previewId: "direct_preview" }).valid, false);
assert.equal(validateBrowserOutputProjection({ timerId: "direct_timer", status: "running" }).valid, false);
assert.equal(validateBrowserOutputProjection(routeEnvelope("program_main", { sourceType: "timer_projection" })).valid, false);
assert.equal(validateBrowserOutputProjection(routeEnvelope("program_main", { outputId: "timer-display" })).valid, false);
assert.equal(validateBrowserOutputProjection(routeEnvelope("program_main", { routeType: "timer_display" })).valid, false);

// Visibility and context never elevate or cross scope.
const publicGeneric = createMounted("program_main", {
  browserOutputId: "browser_public_generic",
  outputType: "generic",
  visibility: "public"
});
assert.throws(
  () => applyBrowserOutputProjection(publicGeneric.instance, routeEnvelope("announcer_monitor"), { now: T1 }),
  (error) => error.code === "browser-output-type-incompatible" || error.code === "browser-output-visibility-incompatible"
);
const announcer = createMounted("announcer_monitor", { browserOutputId: "browser_announcer" });
applyBrowserOutputProjection(announcer.instance, routeEnvelope("announcer_monitor"), { now: T1 });
assert.equal(announcer.instance.visibility, "operational");
assert.throws(
  () => applyBrowserOutputProjection(announcer.instance, routeEnvelope("announcer_monitor", {
    sourceRevision: 4,
    routeRevision: 5,
    tournamentId: "tournament_b"
  }), { now: T2 }),
  (error) => error.code === "browser-output-context-conflict"
);
assert.equal(announcer.instance.sourceRevision, 2);

// Display modes, viewport, transparency and fullscreen remain presentation-only.
setBrowserOutputDisplayMode(lifecycle.instance, "fill", { now: T2 });
assert.equal(lifecycle.instance.scaleMode, "cover");
setBrowserOutputDisplayMode(lifecycle.instance, "fullscreen", { now: T2 });
assert.equal(lifecycle.instance.displayMode, "fullscreen");
assert.equal(root.requestFullscreenCalls, 0, "fullscreen must never activate automatically");
setBrowserOutputViewport(lifecycle.instance, { width: 1280, height: 720 }, { now: T2 });
assert.deepEqual(lifecycle.instance.viewport, { width: 1280, height: 720 });
assert.throws(() => setBrowserOutputViewport(lifecycle.instance, { width: 0, height: 720 }), (error) => error.code === "browser-output-config-invalid");
const noFullscreen = createMounted("program_main", { browserOutputId: "browser_no_fullscreen", fullscreenAllowed: false });
assert.throws(() => setBrowserOutputDisplayMode(noFullscreen.instance, "fullscreen"), (error) => error.code === "browser-output-fullscreen-not-allowed");

// Request resolver accepts only allowlisted local laboratory parameters.
const request = resolveBrowserOutputRequest("?type=generic&width=1280&height=720&orientation=landscape", {
  routeType: "timer_display",
  fullscreenAllowed: true
});
assert.equal(request.outputType, "generic");
assert.equal(request.outputId, "timer-display");
assert.deepEqual(request.resolution, { width: 1280, height: 720 });
assert.throws(() => resolveBrowserOutputRequest("?type=javascript:alert(1)"), (error) => error.code === "browser-output-request-unsafe");
assert.throws(() => resolveBrowserOutputRequest("?routeId=file:///etc/passwd"), (error) => error.code === "browser-output-request-unsafe");
assert.throws(() => resolveBrowserOutputRequest("?outputId=data:text/html,<script>x</script>"), (error) => error.code === "browser-output-request-unsafe");

// Security: accessors are not executed and unsafe structures are rejected or sanitized.
let getterCalls = 0;
const accessorProjection = routeEnvelope();
Object.defineProperty(accessorProjection.projection, "danger", {
  enumerable: true,
  get() {
    getterCalls += 1;
    return "secret";
  }
});
assert.equal(validateBrowserOutputProjection(accessorProjection).valid, false);
assert.equal(getterCalls, 0);
const cyclic = routeEnvelope();
cyclic.projection.loop = cyclic.projection;
assert.equal(validateBrowserOutputProjection(cyclic).valid, false);
assert.equal(validateBrowserOutputProjection(routeEnvelope("program_main", { projection: { kind: "program-main", token: "secret" } })).valid, false);
assert.equal(validateBrowserOutputProjection(routeEnvelope("program_main", { projection: { kind: "program-main", value: 1n } })).valid, false);
assert.equal(validateBrowserOutputProjection(routeEnvelope("program_main", { projection: { kind: "program-main", values: Array(501).fill(0) } })).valid, false);
const markup = routeEnvelope("announcer_monitor");
markup.projection.current.participant.name = "<script>alert(1)</script>";
assert.equal(validateBrowserOutputProjection(markup).valid, true);
const markupOutput = createMounted("announcer_monitor", { browserOutputId: "browser_markup" });
applyBrowserOutputProjection(markupOutput.instance, markup, { now: T1 });
assert.doesNotMatch(markupOutput.target.textContent, /<script>/);

// Snapshots are serializable, detached and public context is sanitized.
const restrictedSnapshot = buildBrowserOutputSnapshot(announcer.instance, { visibility: "restricted", now: T2 });
assert.equal(validateBrowserOutputSnapshot(restrictedSnapshot).valid, true);
assert.doesNotThrow(() => JSON.stringify(restrictedSnapshot));
const publicSnapshot = buildBrowserOutputSnapshot(lifecycle.instance, { visibility: "public", now: T2 });
assert.equal("tenantId" in publicSnapshot, false);
assert.equal("projection" in publicSnapshot, false);
assert.equal("root" in publicSnapshot, false);
assert.equal("listeners" in publicSnapshot, false);
const instanceBeforeSnapshotMutation = getBrowserOutput(lifecycle.instance);
publicSnapshot.resolution.width = 1;
publicSnapshot.projectionSummary.programId = "mutated";
assert.deepEqual(getBrowserOutput(lifecycle.instance), instanceBeforeSnapshotMutation);
const cloneSource = { zero: 0, disabled: false, empty: "", nil: null };
const clone = cloneBrowserOutputResult(cloneSource);
assert.deepEqual(clone, cloneSource);
clone.zero = 9;
assert.equal(cloneSource.zero, 0);

// Two instances, roots, clears, errors and destruction are isolated.
const isolatedA = createMounted("program_main", { browserOutputId: "browser_isolated_a" });
const isolatedB = createMounted("timer_display", { browserOutputId: "browser_isolated_b" });
applyBrowserOutputProjection(isolatedA.instance, routeEnvelope("program_main"), { now: T1 });
applyBrowserOutputProjection(isolatedB.instance, routeEnvelope("timer_display"), { now: T1 });
const isolatedBBefore = getBrowserOutput(isolatedB.instance);
clearBrowserOutput(isolatedA.instance, { now: T2 });
assert.deepEqual(getBrowserOutput(isolatedB.instance), isolatedBBefore);
assert.throws(() => applyBrowserOutputProjection(isolatedA.instance, routeEnvelope("timer_display")), (error) => error.code === "browser-output-type-incompatible");
assert.deepEqual(getBrowserOutput(isolatedB.instance), isolatedBBefore);
destroyBrowserOutput(isolatedA.instance, { now: T3 });
assert.equal(isolatedA.target.children.length, 0);
assert.equal(isolatedB.target.children.length, 1);
assert.deepEqual(getBrowserOutput(isolatedB.instance), isolatedBBefore);

// Destroy is terminal and removes only the controlled root.
const destroyedDescriptor = destroyBrowserOutput(lifecycle.instance, { now: T3 });
assert.equal(destroyedDescriptor.status, "destroyed");
assert.equal(lifecycle.target.children.length, 0);
for (const operation of [
  () => getBrowserOutput(lifecycle.instance),
  () => getBrowserOutputStatus(lifecycle.instance),
  () => getBrowserOutputWarnings(lifecycle.instance),
  () => getBrowserOutputErrors(lifecycle.instance),
  () => configureBrowserOutput(lifecycle.instance, config()),
  () => mountBrowserOutput(lifecycle.instance, lifecycle.target),
  () => applyBrowserOutputProjection(lifecycle.instance, routeEnvelope()),
  () => clearBrowserOutput(lifecycle.instance),
  () => setBrowserOutputDisplayMode(lifecycle.instance, "fit"),
  () => setBrowserOutputViewport(lifecycle.instance, { width: 1, height: 1 }),
  () => buildBrowserOutputSnapshot(lifecycle.instance),
  () => destroyBrowserOutput(lifecycle.instance)
]) {
  assert.throws(operation, (error) => error.code === "browser-output-destroyed");
}

// Structural guardrails: no forbidden transport, persistence or unsafe DOM APIs.
const sourceText = await readFile(new URL("../js/broadcast/browserOutput.js", import.meta.url), "utf8");
const labHtml = await readFile(new URL("../browser-output.html", import.meta.url), "utf8");
const labCss = await readFile(new URL("../css/browser-output.css", import.meta.url), "utf8");
for (const forbidden of [
  "WebSocket", "BroadcastChannel", "EventSource", "ServiceWorker", "setInterval(",
  "publicTournaments", "localStorage", "sessionStorage", "innerHTML", "outerHTML",
  "insertAdjacentHTML", "document.write", "eval(", "new Function"
]) {
  assert.equal(sourceText.includes(forbidden), false, forbidden);
}
assert.doesNotMatch(sourceText, /from\s+["'][^"']*firebase|\bfirebase\s*\./i);
assert.equal(sourceText.includes("programEngine.js"), false);
assert.equal(sourceText.includes("previewEngine.js"), false);
assert.equal(sourceText.includes("outputRouting.js"), false);
assert.match(labHtml, /LABORATORIO TÉCNICO — NO ES UNA SALIDA DE PRODUCCIÓN/);
assert.match(labHtml, /browserOutput\.js\?v=20260715-browser-output-001-common-web-output-infrastructure-v1/);
assert.match(labHtml, /browser-output\.css\?v=20260715-browser-output-001-common-web-output-infrastructure-v1/);
for (const fixtureId of [
  "program-empty", "program-active", "announcer-operational", "timer-ready", "timer-running",
  "timer-paused", "timer-stopped", "timer-finished", "timer-stale", "output-unavailable", "output-disabled"
]) assert.match(labHtml, new RegExp(`value="${fixtureId}"`));
for (const action of ["configure", "mount", "apply", "update", "clear", "fullscreen", "snapshot", "destroy"]) {
  assert.match(labHtml, new RegExp(`data-browser-output-action="${action}"`));
}
assert.equal((labHtml.match(/id="browser-output-stage"/g) || []).length, 1);
assert.doesNotMatch(labHtml, /program-main-output\.html|announcer-monitor\.html|timer-display\.html|Browser Source|\bOBS\b|\bvMix\b|Wirecast|Start Timer|Pause Timer|Stop Timer|Reset Timer/);
assert.doesNotMatch(labHtml, /on(?:click|load|error)=|javascript:|file:\/\/|data:text\/html/i);
assert.match(labCss, /\.browser-output-safe-area/);
assert.match(labCss, /data-orientation="portrait"/);
assert.match(labCss, /data-orientation="ultra_wide"/);
assert.match(labCss, /@media \(max-width: 820px\)/);
assert.match(sourceText, /data-browser-output-initialized/);
assert.match(sourceText, /if \(status === "destroyed"\) return true;/);
assert.doesNotMatch(sourceText, /lab\.instance\.status === "destroyed"\)[^{]*\{\s*lab\.instance = createBrowserOutput/);

console.log("browser-output.test.mjs: OK");
