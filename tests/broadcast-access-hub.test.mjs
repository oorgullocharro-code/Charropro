import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as api from "../js/broadcast/broadcastAccessHub.js";

const T0 = "2026-07-15T20:00:00.000Z";
const T1 = "2026-07-15T20:00:01.000Z";
const expectedLinks = [
  "production-console",
  "broadcast-playground",
  "program-main",
  "announcer-monitor",
  "browser-output",
  "judges",
  "supervision"
];

assert.equal(api.BROADCAST_ACCESS_HUB_VERSION, "1.0.0");
assert.deepEqual([...api.BROADCAST_ACCESS_HUB_SECTIONS], ["operation", "outputs", "status", "portals"]);
assert.deepEqual(api.BROADCAST_ACCESS_HUB_LINKS.map((link) => link.id), expectedLinks);
assert.equal(api.BROADCAST_ACCESS_HUB_LINKS.find((link) => link.id === "program-main").href, "./program-main-output.html");
assert.equal(api.BROADCAST_ACCESS_HUB_LINKS.find((link) => link.id === "announcer-monitor").href, "./announcer-monitor.html");
assert.equal(api.BROADCAST_ACCESS_HUB_LINKS.find((link) => link.id === "judges").href, "./jueces.html");
assert.equal(api.BROADCAST_ACCESS_HUB_LINKS.find((link) => link.id === "supervision").href, "./supervision.html");
assert.equal(api.BROADCAST_ACCESS_HUB_LINKS.filter((link) => /locutor/i.test(link.label)).length, 0);

class MockElement {
  constructor(tagName, ownerDocument) {
    this.tagName = String(tagName).toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = new Map();
    this.className = "";
    this.textContent = "";
  }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  querySelectorAll(selector) {
    const result = [];
    const visit = (node) => {
      if (selector === "a" && node.tagName === "A") result.push(node);
      if (selector === "[data-broadcast-section]" && node.attributes?.has("data-broadcast-section")) result.push(node);
      node.children?.forEach(visit);
    };
    this.children.forEach(visit);
    return result;
  }
}

class MockDocument {
  constructor() {
    this.baseURI = "https://charropro.test/charropro/broadcast-studio.html";
  }
  createElement(tagName) { return new MockElement(tagName, this); }
}

const documentRef = new MockDocument();
const root = new MockElement("main", documentRef);
const hub = api.createBroadcastAccessHub({ accessHubId: "hub_test", now: T0 });
assert.equal(api.validateBroadcastAccessHub(hub).valid, true);
api.renderBroadcastAccessHub(hub, root, { now: T0, baseUrl: documentRef.baseURI });
assert.equal(root.querySelectorAll("a").length, 7);
assert.equal(root.querySelectorAll("[data-broadcast-section]").length, 4);
const links = root.querySelectorAll("a").map((anchor) => anchor.attributes.get("href"));
assert.ok(links.includes("/charropro/program-main-output.html"));
assert.ok(links.includes("/charropro/announcer-monitor.html"));
assert.ok(links.includes("/charropro/jueces.html"));
assert.ok(links.includes("/charropro/supervision.html"));

const source = api.getBroadcastAccessHub(hub);
const snapshot = api.buildBroadcastAccessHubSnapshot(hub, { now: T0 });
snapshot.moduleStatus.program.status = "mutated";
assert.equal(api.getBroadcastAccessHub(hub).moduleStatus.program.status, source.moduleStatus.program.status);
api.updateBroadcastAccessHubStatus(hub, {
  program_main: { status: "synchronized", detail: "Salida local aplicada.", revision: 3 }
}, { now: T1 });
assert.equal(api.getBroadcastAccessHub(hub).moduleStatus.program_main.status, "synchronized");
assert.equal(api.getBroadcastAccessHub(hub).moduleStatus.program_main.revision, 3);
api.destroyBroadcastAccessHub(hub, { now: T1 });
assert.equal(hub.status, "destroyed");
assert.equal(root.children.length, 0);

const html = await readFile(new URL("../broadcast-studio.html", import.meta.url), "utf8");
const css = await readFile(new URL("../css/broadcast-studio.css", import.meta.url), "utf8");
const sourceCode = await readFile(new URL("../js/broadcast/broadcastAccessHub.js", import.meta.url), "utf8");
for (const text of ["Consola de Producción", "Playground de Broadcast", "Program Main Output", "Announcer Monitor", "Browser Output Lab", "Portal de Jueces", "Portal de Supervisión"]) {
  assert.ok(sourceCode.includes(text), `missing access ${text}`);
}
assert.match(html, /20260716-broadcast-workspace-context-bridge-001-auto-context-v1/);
assert.match(html, /broadcastStudioWorkspace\.js/);
assert.match(css, /@media \(max-width: 1180px\)/);
assert.match(css, /@media \(max-width: 820px\)/);
assert.match(css, /@media \(max-width: 560px\)/);
assert.doesNotMatch(sourceCode, /WebSocket|BroadcastChannel|EventSource|setInterval|fetch\s*\(|localStorage|sessionStorage|indexedDB|postMessage/);
assert.doesNotMatch(sourceCode, /innerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new Function/);

console.log("broadcast-access-hub.test.mjs: ok");
