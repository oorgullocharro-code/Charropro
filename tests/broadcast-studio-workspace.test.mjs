import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BROADCAST_STUDIO_APP_VERSION,
  BROADCAST_STUDIO_FILTERS,
  BROADCAST_STUDIO_GRAPHICS,
  BROADCAST_STUDIO_WORKSPACE_VERSION,
  createBroadcastStudioContextBridge,
  createBroadcastStudioController,
  filterBroadcastStudioGraphics
} from "../js/broadcast/broadcastStudioWorkspace.js";

assert.equal(BROADCAST_STUDIO_WORKSPACE_VERSION, "1.0.0");
assert.equal(BROADCAST_STUDIO_APP_VERSION, "20260716-broadcast-workspace-context-bridge-001-auto-context-v1");
assert.equal(BROADCAST_STUDIO_GRAPHICS.length, 15);
assert.equal(new Set(BROADCAST_STUDIO_GRAPHICS.map((entry) => entry.id)).size, 15);
assert.deepEqual(BROADCAST_STUDIO_FILTERS.map((entry) => entry.label), [
  "Todos", "Marcadores", "Competencia", "Resultados", "Patrocinadores", "Institucional", "Especiales"
]);

for (const name of [
  "Marcador principal", "Marcador compacto", "Equipo en turno", "Siguiente equipo", "Programa",
  "Clasificación", "Top general", "Top por suerte", "Patrocinador", "Lower third", "Logo",
  "Bienvenida", "Gracias", "Entrevista", "Cronómetro"
]) {
  assert.ok(BROADCAST_STUDIO_GRAPHICS.some((entry) => entry.name === name), `missing ${name}`);
}
const timer = BROADCAST_STUDIO_GRAPHICS.find((entry) => entry.id === "timer");
assert.equal(timer.disabled, true);
assert.equal(timer.templateType, "timer");
assert.equal(BROADCAST_STUDIO_GRAPHICS.filter((entry) => entry.disabled).length, 1);

assert.deepEqual(filterBroadcastStudioGraphics(undefined, "marcador").map((entry) => entry.id), ["main-scoreboard", "compact-scoreboard"]);
assert.deepEqual(filterBroadcastStudioGraphics(undefined, "clasificacion").map((entry) => entry.id), ["standings"]);
assert.deepEqual(filterBroadcastStudioGraphics(undefined, "equipo", "competition").map((entry) => entry.id), ["current-team", "next-team"]);
assert.deepEqual(filterBroadcastStudioGraphics(undefined, "", "sponsors").map((entry) => entry.id), ["sponsor"]);
assert.equal(filterBroadcastStudioGraphics(undefined, "sin coincidencias").length, 0);

const calls = [];
const controller = createBroadcastStudioController({
  ready: true,
  services: {
    focusPreview: (entry) => calls.push(["focus", entry.id]),
    prepare: async (entry) => calls.push(["prepare", entry.id]),
    transition: async (mode, entry) => calls.push([mode, entry.id]),
    clear: async () => calls.push(["clear"])
  }
});

const initial = controller.getState();
initial.query = "mutated";
assert.equal(controller.getState().query, "");
assert.equal(controller.getGraphicStatus("main-scoreboard"), "available");
assert.equal(controller.getGraphicStatus("timer"), "disabled");

controller.setFilter("results");
assert.deepEqual(controller.getFilteredGraphics().map((entry) => entry.id), ["standings", "overall-top", "suerte-top"]);
controller.setSearch("general");
assert.deepEqual(controller.getFilteredGraphics().map((entry) => entry.id), ["overall-top"]);
controller.setFilter("all");
controller.setSearch("");

controller.previewGraphic("main-scoreboard");
assert.deepEqual(calls, [["focus", "main-scoreboard"]]);
assert.equal(controller.getGraphicStatus("main-scoreboard"), "prepared");
assert.equal(controller.getState().previewGraphicId, null);

await controller.prepare();
assert.deepEqual(calls.at(-1), ["prepare", "main-scoreboard"]);
assert.equal(controller.getGraphicStatus("main-scoreboard"), "preview");
assert.equal(controller.getState().programGraphicId, null, "prepare must not change Program");

for (const mode of ["take", "cut", "auto"]) {
  await controller.transition(mode);
  assert.deepEqual(calls.at(-1), [mode, "main-scoreboard"]);
  assert.equal(controller.getGraphicStatus("main-scoreboard"), "on_air");
}

controller.previewGraphic("welcome");
await controller.prepare();
assert.equal(controller.getGraphicStatus("welcome"), "preview");
assert.equal(controller.getGraphicStatus("main-scoreboard"), "on_air", "changing Preview must not change Program");
await controller.transition("take");
assert.equal(controller.getGraphicStatus("welcome"), "on_air");
assert.equal(controller.getGraphicStatus("main-scoreboard"), "available");

await controller.clear();
assert.deepEqual(calls.at(-1), ["clear"]);
assert.equal(controller.getState().previewGraphicId, null);
assert.equal(controller.getState().programGraphicId, null);
assert.equal(controller.getGraphicStatus("welcome"), "prepared");
await assert.rejects(controller.prepare("timer"), /broadcast-studio-graphic-disabled/);

const disconnected = createBroadcastStudioController({ services: { prepare: async () => calls.push(["unexpected"]) } });
disconnected.selectGraphic("logo");
await assert.rejects(disconnected.prepare(), /broadcast-studio-context-unavailable/);
assert.equal(disconnected.getState().previewGraphicId, null);

const bridgeEvents = [];
const bridgeOperations = [];
let emitOfficialContext = null;
let bridgeUnsubscribed = false;
const contextA = {
  tenantId: "charropro",
  tournamentId: "torneo-real",
  competitionId: "equipos_completo",
  activeCharreadaId: "charreada-3",
  sessionId: "broadcast_torneo-real_equipos_completo_charreada-3",
  source: "firebase-tournament-active-charreada"
};
const contextB = {
  ...contextA,
  activeCharreadaId: "charreada-4",
  sessionId: "broadcast_torneo-real_equipos_completo_charreada-4"
};
const bridge = createBroadcastStudioContextBridge({
  subscribe(callback) {
    emitOfficialContext = callback;
    return () => { bridgeUnsubscribed = true; };
  },
  connect: async (context) => bridgeOperations.push(["connect", context.activeCharreadaId]),
  teardown: async (context) => bridgeOperations.push(["teardown", context.activeCharreadaId]),
  onStatus: (event) => bridgeEvents.push(event)
});
await bridge.start();
assert.equal(bridgeOperations.length, 0, "Workspace waits for delayed Auth/context resolution");
assert.equal(bridgeEvents.at(-1).connectionState, "preparing");

emitOfficialContext({ status: "ready", context: contextA, reason: "auth-restored" });
await bridge.flush();
assert.deepEqual(bridgeOperations, [["connect", "charreada-3"]]);
assert.equal(bridge.getContext().activeCharreadaId, "charreada-3");
bridge.getContext().activeCharreadaId = "mutated";
assert.equal(bridge.getContext().activeCharreadaId, "charreada-3", "bridge context is immutable from callers");

emitOfficialContext({ status: "ready", context: contextA, reason: "duplicate-listener" });
await bridge.flush();
assert.equal(bridgeOperations.length, 1, "duplicate listeners do not reconnect the same session");
emitOfficialContext({ status: "offline", reason: "firebase-disconnected" });
await bridge.flush();
assert.equal(bridge.getContext().activeCharreadaId, "charreada-3", "offline preserves the isolated context for reconnect");

emitOfficialContext({ status: "ready", context: contextB, reason: "active-charreada-changed" });
await bridge.flush();
assert.deepEqual(bridgeOperations.slice(-2), [["teardown", "charreada-3"], ["connect", "charreada-4"]]);
assert.equal(bridge.getContext().activeCharreadaId, "charreada-4");
emitOfficialContext({ status: "unauthorized", reason: "broadcast-permission-denied" });
await bridge.flush();
assert.deepEqual(bridgeOperations.at(-1), ["teardown", "charreada-4"]);
assert.equal(bridge.getContext(), null);
await bridge.dispose();
assert.equal(bridgeUnsubscribed, true);

const html = await readFile(new URL("../broadcast-studio.html", import.meta.url), "utf8");
const css = await readFile(new URL("../css/broadcast-studio.css", import.meta.url), "utf8");
const source = await readFile(new URL("../js/broadcast/broadcastStudioWorkspace.js", import.meta.url), "utf8");
const firebaseSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");

assert.match(html, /id="broadcast-studio-workspace"/);
assert.match(html, /id="broadcast-graphic-search"[^>]+type="search"/);
assert.match(html, /aria-label="Filtrar gráficos"/);
assert.match(html, /aria-label="Salida Preview oficial"/);
assert.match(html, /aria-label="Salida Program oficial"/);
assert.match(html, /id="broadcast-program-link"[^>]*>Abrir Program Main/);
assert.match(html, /id="broadcast-announcer-link"[^>]*>Abrir Locutores/);
for (const action of ["prepare", "take", "cut", "auto", "clear"]) {
  assert.match(html, new RegExp(`data-workspace-action="${action}"`));
}
assert.match(html, /broadcastStudioWorkspace\.js\?v=20260716-broadcast-workspace-context-bridge-001-auto-context-v1/);
assert.doesNotMatch(html, /Snapshot|Contract|Variables|Bindings|Themes|Templates|Firebase|Output Routing|Revisiones|IDs/);
assert.doesNotMatch(html, /contexto oficial|Program Main activo/i);

assert.match(css, /grid-template-columns:\s*minmax\(280px, 340px\) minmax\(360px, 1fr\) minmax\(360px, 1fr\)/);
assert.match(css, /@media \(max-width: 1180px\)/);
assert.match(css, /@media \(max-width: 820px\)/);
assert.match(css, /@media \(max-width: 560px\)/);
assert.match(css, /aspect-ratio:\s*16 \/ 9/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /\.broadcast-output-links/);
assert.match(css, /\.broadcast-live-status\.is-unauthorized/);

assert.match(source, /createProductionConsoleOfficialPreviewEngine/);
assert.match(source, /createProductionConsoleOfficialProgramEngine/);
assert.match(source, /createProductionConsoleTemplateRendererIntegration/);
assert.match(source, /createProductionConsoleThemeTemplateIntegration/);
assert.match(source, /applyProgramMainProjection/);
assert.match(source, /connectProductionConsoleRealtime/);
assert.match(source, /subscribeFirebaseBroadcastContext/);
assert.match(source, /resolveCurrentBroadcastContext\(\{\}, \{ operation: "publish" \}\)/);
assert.match(source, /closeProductionConsoleRealtimeSession/);
assert.match(source, /model\.contract\?\.team\?\.name/);
assert.doesNotMatch(source, /localStorage|sessionStorage|torneo_playground/);
assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new Function|WebSocket|EventSource|setInterval/);

assert.match(firebaseSource, /authStateReady/);
assert.match(firebaseSource, /export function subscribeFirebaseBroadcastContext/);
assert.match(firebaseSource, /resolveFirebaseBroadcastActiveTournamentId/);
assert.match(firebaseSource, /broadcastContract\?\.charreada\?\.id/);
assert.match(firebaseSource, /broadcast-context-ambiguous/);

console.log("broadcast-studio-workspace.test.mjs: ok");
