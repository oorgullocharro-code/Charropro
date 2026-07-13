import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BROADCAST_PLAYGROUND_APP_VERSION,
  BROADCAST_PLAYGROUND_VERSION,
  buildPlaygroundProjection,
  buildPlaygroundRenderDescriptor,
  clearPlaygroundPreview,
  clearPlaygroundProgram,
  createBroadcastPlaygroundModel,
  disposeBroadcastPlayground,
  escapePlaygroundText,
  getPlaygroundInspector,
  loadPlaygroundFixture,
  preparePlaygroundPreview,
  selectPlaygroundAsset,
  selectPlaygroundOutput,
  sendPlaygroundHeartbeat,
  setPlaygroundLayerAction,
  setPlaygroundVisibility,
  takePlaygroundToProgram,
  validatePlaygroundModel
} from "../js/broadcast/broadcastPlayground.js";
import {
  PLAYGROUND_ASSET_DEFINITIONS,
  PLAYGROUND_COMPETITIONS,
  PLAYGROUND_GRAPHIC_DEFINITIONS,
  PLAYGROUND_OUTPUT_DEFINITIONS,
  buildPlaygroundFixture
} from "../js/broadcast/fixtures/broadcastPlaygroundFixtures.js";
import {
  buildBroadcastDataContract,
  validateBroadcastDataContract
} from "../js/broadcast/dataContract.js?v=20260713-broadcast-output-001-output-v1";
import {
  getBroadcastOutput,
  validateBroadcastOutput
} from "../js/broadcast/broadcastOutput.js?v=20260713-broadcast-output-001-output-v1";
import { validateBroadcastState } from "../js/broadcast/broadcastState.js?v=20260713-broadcast-output-001-output-v1";
import {
  listBroadcastAssets,
  validateBroadcastAsset
} from "../js/broadcast/assetManager.js?v=20260713-asset-manager-001-assets-v1";

const T0 = "2026-07-13T18:30:00.000Z";
const T1 = "2026-07-13T18:30:01.000Z";
const T2 = "2026-07-13T18:30:02.000Z";
const T3 = "2026-07-13T18:30:03.000Z";
const T4 = "2026-07-13T18:30:04.000Z";

assert.equal(BROADCAST_PLAYGROUND_VERSION, "1.0.0");
assert.equal(BROADCAST_PLAYGROUND_APP_VERSION, "20260713-broadcast-playground-001-visual-test1");
assert.equal(Object.keys(PLAYGROUND_COMPETITIONS).length, 5);
assert.equal(Object.keys(PLAYGROUND_GRAPHIC_DEFINITIONS).length, 8);
assert.equal(PLAYGROUND_OUTPUT_DEFINITIONS.length, 5);
assert.equal(PLAYGROUND_ASSET_DEFINITIONS.length, 7);

// Fixtures are independent, immutable inputs and all pass through Data Contract v1.
for (const type of Object.keys(PLAYGROUND_COMPETITIONS)) {
  const fixture = buildPlaygroundFixture(type, type === "equipos_completo" ? "three" : "two");
  const fixtureCopy = structuredClone(fixture);
  const contract = buildBroadcastDataContract(fixture, {
    visibility: "production",
    now: T0
  });
  assert.deepEqual(fixture, fixtureCopy);
  assert.equal(validateBroadcastDataContract(contract).valid, true, `Contract should be valid for ${type}`);
  assert.equal(contract.competition.type, type);
  assert.equal(contract.competition.scope, PLAYGROUND_COMPETITIONS[type].scope);
}

const charroFixture = buildPlaygroundFixture("charro_completo", "two");
const charroContract = buildBroadcastDataContract(charroFixture, { visibility: "production", now: T0 });
assert.equal(charroContract.team.id, null);
assert.equal(charroContract.participant.scope, "individual");
assert.equal(charroContract.competition.suerteIds.includes("terna"), false);
assert.equal(charroContract.competition.suerteIds.includes("yegua"), false);
assert.deepEqual(charroContract.competition.suerteIds, [
  "cala",
  "piales",
  "colas",
  "toro",
  "manganas_pie",
  "manganas_caballo",
  "paso"
]);

const calaFixture = buildPlaygroundFixture("caladero", "one");
const calaContract = buildBroadcastDataContract(calaFixture, { visibility: "production", now: T0 });
assert.equal(calaContract.score.total, 42);
assert.equal(calaContract.scoreDetail.cala.punta, 8);
assert.deepEqual(calaContract.competition.suerteIds, ["cala"]);
assert.deepEqual(
  buildBroadcastDataContract(buildPlaygroundFixture("coleadero", "two"), { visibility: "production", now: T0 }).competition.suerteIds,
  ["colas"]
);
assert.deepEqual(
  buildBroadcastDataContract(buildPlaygroundFixture("pialadero", "two"), { visibility: "production", now: T0 }).competition.suerteIds,
  ["piales"]
);

let model = createBroadcastPlaygroundModel({ now: T0 });
assert.equal(validatePlaygroundModel(model).valid, true);
assert.equal(validateBroadcastState(model.state).valid, true);
assert.equal(model.state.program.active, false);
assert.equal(model.previewContract.ranking.entries.length, 3);
assert.equal(model.previewContract.competition.scope, "team");

for (const outputDefinition of PLAYGROUND_OUTPUT_DEFINITIONS) {
  const output = getBroadcastOutput(outputDefinition.id);
  assert.ok(output);
  assert.equal(validateBroadcastOutput(output).valid, true);
}
assert.equal(getBroadcastOutput("playground_vertical").resolution.width, 1080);
assert.equal(getBroadcastOutput("playground_vertical").resolution.height, 1920);
assert.equal(getBroadcastOutput("playground_vertical").orientation, "portrait");
assert.equal(getBroadcastOutput("playground_led").resolution.width, 3840);
assert.equal(getBroadcastOutput("playground_led").resolution.height, 720);
assert.equal(getBroadcastOutput("playground_led").orientation, "landscape");

const assets = listBroadcastAssets(model.assetRegistry);
assert.equal(assets.length, 7);
assert.ok(assets.every((asset) => validateBroadcastAsset(asset, { requireOriginalVariant: true }).valid));

// Four-team fixture and individual fixtures keep their own identity type.
model = loadPlaygroundFixture(model, "equipos_completo", "four", { now: T1 });
assert.equal(model.previewContract.ranking.entries.length, 4);
assert.equal(model.previewContract.team.id, "equipo_1");
model = loadPlaygroundFixture(model, "charro_completo", "two", { now: T1 });
assert.equal(model.previewContract.ranking.entries.length, 2);
assert.equal(model.previewContract.team.id, null);
assert.equal(model.previewContract.participant.id, "participante_charro_completo_1");

// Preview prepares a declarative graphic and Program changes only with explicit Take.
model = preparePlaygroundPreview(model, {}, { now: T1 });
assert.equal(model.state.preview.active, true);
assert.equal(model.state.program.active, false);
assert.equal(model.state.preview.visibleGraphics.length, 1);
const previewProjection = buildPlaygroundProjection(model, "preview", { now: T1 });
assert.equal(previewProjection.broadcast.selectedView, "preview");
assert.equal(previewProjection.graphics.length, 1);
const programBeforeTake = buildPlaygroundProjection(model, "program", { now: T1 });
assert.equal(programBeforeTake.broadcast.active, false);
assert.equal(programBeforeTake.graphics.length, 0);

model = takePlaygroundToProgram(model, { now: T2, mode: "take" });
assert.equal(model.state.program.active, true);
assert.equal(model.state.program.transitionMode, "take");
assert.equal(model.programSnapshot.state.program.active, true);
const stableProgramBlock = structuredClone(model.state.program);
const stableProgramProjection = buildPlaygroundProjection(model, "program", { now: T2 });
assert.equal(stableProgramProjection.graphics.length, 1);
assert.equal(stableProgramProjection.graphics[0].scale, 1);

// Geometry and asset changes create a new Preview instance without mutating Program.
model = preparePlaygroundPreview(model, {
  geometry: {
    ...model.geometry,
    position: { x: 0, y: 0, anchor: "top-left", unit: "normalized" },
    size: { width: 0, height: 0.25, unit: "normalized" },
    scale: 1.4,
    opacity: 0
  }
}, { now: T3, confirmed: true });
assert.deepEqual(model.state.program, stableProgramBlock);
const changedPreviewProjection = buildPlaygroundProjection(model, "preview", { now: T3 });
const unchangedProgramProjection = buildPlaygroundProjection(model, "program", { now: T3 });
assert.equal(changedPreviewProjection.graphics[0].scale, 1.4);
assert.equal(changedPreviewProjection.graphics[0].opacity, 0);
assert.equal(changedPreviewProjection.graphics[0].size.width, 0);
assert.equal(unchangedProgramProjection.graphics[0].scale, 1);
assert.equal(unchangedProgramProjection.graphics[0].opacity, 1);
assert.equal(changedPreviewProjection.graphics[0].autoHide, false);

const invalidGeometryModel = preparePlaygroundPreview(model, {
  geometry: {
    ...model.geometry,
    position: { x: Number.NaN, y: Number.POSITIVE_INFINITY, anchor: "center", unit: "normalized" },
    scale: 0,
    opacity: Number.NaN
  }
}, { now: T3, confirmed: true });
const sanitizedGeometry = buildPlaygroundProjection(invalidGeometryModel, "preview", { now: T3 }).graphics[0];
assert.equal(Number.isFinite(sanitizedGeometry.position.x), true);
assert.equal(Number.isFinite(sanitizedGeometry.position.y), true);
assert.ok(sanitizedGeometry.scale > 0);
assert.ok(sanitizedGeometry.opacity >= 0 && sanitizedGeometry.opacity <= 1);

model = selectPlaygroundAsset(model, "asset-sponsor");
model = preparePlaygroundPreview(model, {}, { now: T3, confirmed: true });
assert.equal(buildPlaygroundProjection(model, "preview", { now: T3 }).graphics[0].payloadBindings.assetId, "asset-sponsor");
assert.equal(buildPlaygroundProjection(model, "program", { now: T3 }).graphics[0].payloadBindings.assetId, "asset-tournament-logo");
assert.deepEqual(model.state.program, stableProgramBlock);
model = preparePlaygroundPreview(model, { variantId: "variant-missing-for-fallback" }, { now: T3, confirmed: true });
const fallbackDescriptor = buildPlaygroundRenderDescriptor(
  buildPlaygroundProjection(model, "preview", { now: T3 }),
  { assetRegistry: model.assetRegistry }
);
assert.equal(fallbackDescriptor.graphics[0].asset.variantId, "asset-sponsor-original");
assert.equal(fallbackDescriptor.graphics[0].asset.fallbackUsed, true);

// Clearing Preview, selecting another output and heartbeat updates do not alter Program.
model = clearPlaygroundPreview(model, { now: T3 });
assert.equal(model.state.preview.active, false);
assert.deepEqual(model.state.program, stableProgramBlock);
model = selectPlaygroundOutput(model, "playground_vertical");
assert.deepEqual(model.state.program, stableProgramBlock);
model = sendPlaygroundHeartbeat(model, "online", { now: T3 });
assert.deepEqual(model.state.program, stableProgramBlock);
assert.equal(getBroadcastOutput("playground_vertical").heartbeat.status, "online");
assert.equal(buildPlaygroundProjection(model, "program", { now: T3 }).output.heartbeat.status, "online");
model = sendPlaygroundHeartbeat(model, "stale", { now: T4 });
assert.equal(getBroadcastOutput("playground_vertical").status, "stale");
assert.deepEqual(model.state.program, stableProgramBlock);
const repeatedSequence = getBroadcastOutput("playground_vertical").heartbeat.sequence;
model = sendPlaygroundHeartbeat(model, "repeated", { now: T4 });
assert.equal(model.lastActionError, "heartbeat-sequence-out-of-order");
assert.equal(getBroadcastOutput("playground_vertical").heartbeat.sequence, repeatedSequence);
assert.deepEqual(model.state.program, stableProgramBlock);

// Layers are managed through State APIs and protected actions require confirmation.
model = setPlaygroundLayerAction(model, "alerts", "lock", { now: T4 });
assert.equal(model.state.layers.alerts.locked, true);
assert.throws(
  () => setPlaygroundLayerAction(model, "alerts", "unlock", { now: T4 }),
  (error) => error?.code === "playground-layer-confirmation-required"
);
model = setPlaygroundLayerAction(model, "alerts", "unlock", { now: T4, confirmed: true });
assert.equal(model.state.layers.alerts.locked, false);
assert.throws(
  () => setPlaygroundLayerAction(model, "emergency", "show", { now: T4 }),
  (error) => error?.code === "playground-layer-confirmation-required"
);

// Public visibility strips restricted production data from every inspector section.
model = setPlaygroundVisibility(model, "public", { now: T4 });
const publicContract = model.previewContract;
assert.equal(Object.hasOwn(publicContract, "scoreDetail"), false);
assert.equal(Object.hasOwn(publicContract.production || {}, "operatorId"), false);
const publicInspectorText = JSON.stringify(getPlaygroundInspector(model, { now: T4 }));
for (const restrictedText of [
  "tenant_playground",
  "operador_playground",
  "juez_playground",
  "internalToken",
  "fixture-only-not-a-secret"
]) {
  assert.equal(publicInspectorText.includes(restrictedText), false, `Public inspector leaked ${restrictedText}`);
}

// Test renderer reads projections, applies controlled fallbacks and never mutates its input.
const programProjection = buildPlaygroundProjection(model, "program", { now: T4 });
const projectionCopy = structuredClone(programProjection);
const descriptor = buildPlaygroundRenderDescriptor(programProjection, { assetRegistry: model.assetRegistry });
assert.deepEqual(programProjection, projectionCopy);
assert.equal(descriptor.renderer, "broadcast-playground-test-renderer");
assert.equal(descriptor.view, "program");
assert.equal(descriptor.output.resolution.width, 1080);
assert.equal(descriptor.output.resolution.height, 1920);
assert.ok(Array.isArray(descriptor.graphics));

const previewBeforeProgramClear = structuredClone(model.state.preview);
const programCleared = clearPlaygroundProgram(model, { now: T4 });
assert.equal(programCleared.state.program.active, false);
assert.equal(programCleared.programSnapshot, null);
assert.deepEqual(programCleared.state.preview, previewBeforeProgramClear);

assert.equal(escapePlaygroundText("<script>alert('x')</script>"), "&lt;script&gt;alert(&#039;x&#039;)&lt;/script&gt;");
assert.equal(escapePlaygroundText(0), "0");
assert.equal(escapePlaygroundText(false), "false");
assert.equal(escapePlaygroundText(""), "");

// A new page model always starts Program empty; no on-air state is persisted.
const reloaded = createBroadcastPlaygroundModel({ now: T4 });
assert.equal(reloaded.state.program.active, false);
assert.equal(reloaded.programSnapshot, null);
assert.equal(validatePlaygroundModel(reloaded).valid, true);

const html = await readFile(new URL("../broadcast-playground.html", import.meta.url), "utf8");
const source = await readFile(new URL("../js/broadcast/broadcastPlayground.js", import.meta.url), "utf8");
for (const id of [
  "broadcast-playground",
  "playground-preview-stage",
  "playground-program-stage",
  "playground-inspector",
  "playground-layers-body"
]) {
  assert.ok(html.includes(`id="${id}"`), `HTML missing ${id}`);
}
assert.equal(source.includes("localStorage"), false);
assert.equal(source.includes("firebase"), false);
assert.equal(source.includes("../core/state.js"), false);
assert.equal(source.includes("innerHTML"), false);

disposeBroadcastPlayground(reloaded);
console.log("broadcast-playground.test.mjs: OK");
