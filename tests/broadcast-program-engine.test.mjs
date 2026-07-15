import assert from "node:assert/strict";
import * as programApi from "../js/broadcast/programEngine.js";
import {
  PROGRAM_ENGINE_VERSION,
  BroadcastProgramError,
  autoProgram,
  clearProgram,
  createProgramEngine,
  cutProgram,
  destroyProgramEngine,
  disposeProgram,
  getProgram,
  getProgramSnapshot,
  getProgramState,
  hasProgram,
  isProgramDestroyed,
  isProgramReady,
  prepareProgram,
  takeProgram,
  updateProgram,
  validateProgram
} from "../js/broadcast/programEngine.js";

const T0 = "2026-07-15T16:00:00.000Z";
const T1 = "2026-07-15T16:01:00.000Z";
const T2 = "2026-07-15T16:02:00.000Z";
const T3 = "2026-07-15T16:03:00.000Z";
const T4 = "2026-07-15T16:04:00.000Z";

function previewSnapshot(overrides = {}) {
  const preview = {
    previewId: "preview_official_scoreboard",
    createdAt: T0,
    updatedAt: T1,
    revision: 1,
    status: "rendered",
    visibility: "production",
    output: {
      outputId: "preview_1080",
      type: "preview",
      orientation: "landscape",
      resolution: { width: 1920, height: 1080 },
      safeArea: { top: 0, right: 54, bottom: false, left: "" }
    },
    themeRenderId: "themed_render_scoreboard",
    templateRenderId: "template_render_scoreboard",
    templateId: "template_scoreboard",
    themeId: "theme_default",
    templateInstanceId: "template_instance_scoreboard",
    warnings: [],
    errors: [],
    ...(overrides.preview || {})
  };
  const components = [{
    componentId: "scoreboard_rows",
    sourceComponentId: "scoreboard_table",
    componentType: "table",
    parentId: null,
    layerId: "scoreboard",
    order: 0,
    visibility: "production",
    geometry: { x: 100, y: 100, width: 1720, height: 760, rotation: 0, anchor: "center", scale: 1, zIndex: 10 },
    opacity: 1,
    style: { opacity: 1 },
    properties: { columns: ["Equipo", "Total"], rows: [["Rancheros de Tijuana", 203]] },
    content: {},
    data: { turn: { team: { id: "team_tijuana", name: "Rancheros de Tijuana" } } },
    assetRefs: [],
    metadata: {}
  }];
  Object.assign(preview, {
    projectionVersion: "1.0.0",
    composition: {
      compositionVersion: "1.0.0",
      compositionId: `composition_${preview.templateInstanceId}`,
      templateId: preview.templateId,
      themeId: preview.themeId,
      rootComponentId: components[0].componentId,
      components: structuredClone(components),
      layers: [{ layerId: "scoreboard", order: 0, zIndex: 10, visibility: "production", componentIds: [components[0].componentId] }],
      order: [components[0].componentId],
      geometry: { width: preview.output.resolution.width, height: preview.output.resolution.height, orientation: preview.output.orientation },
      safeArea: structuredClone(preview.output.safeArea),
      transparentBackground: true,
      background: { type: "transparent" },
      data: structuredClone(components[0].data),
      metadata: {}
    },
    components: structuredClone(components),
    layers: [{ layerId: "scoreboard", order: 0, zIndex: 10, visibility: "production", componentIds: [components[0].componentId] }],
    sourceRevision: preview.revision,
    tenantId: "tenant_a",
    tournamentId: "tournament_a",
    competitionId: "competition_a"
  });
  return {
    snapshotVersion: "1.0.0",
    generatedAt: T1,
    state: "rendered",
    revision: 2,
    visibility: "production",
    preview,
    warnings: [],
    errors: [],
    ...overrides,
    preview: overrides.preview ? { ...preview, ...overrides.preview } : preview
  };
}

assert.deepEqual(Object.keys(programApi).sort(), [
  "BroadcastProgramError",
  "PROGRAM_ENGINE_VERSION",
  "autoProgram",
  "clearProgram",
  "createProgramEngine",
  "cutProgram",
  "destroyProgramEngine",
  "disposeProgram",
  "getProgram",
  "getProgramSnapshot",
  "getProgramState",
  "hasProgram",
  "isProgramDestroyed",
  "isProgramReady",
  "prepareProgram",
  "takeProgram",
  "updateProgram",
  "validateProgram"
].sort());
assert.equal(PROGRAM_ENGINE_VERSION, "1.0.0");
assert.equal(BroadcastProgramError.prototype instanceof Error, true);

const engine = createProgramEngine({ engineId: "official_program", now: T0 });
assert.equal(getProgramState(engine), "ready");
assert.equal(isProgramReady(engine), true);
assert.equal(hasProgram(engine), false);

const source = previewSnapshot();
const sourceClone = structuredClone(source);
let prepared = prepareProgram(engine, source, { now: T1, rendererId: "renderer_v1" });
assert.equal(prepared.prepared, true);
assert.equal(prepared.previewId, source.preview.previewId);
assert.equal(getProgramState(engine), "prepared");
assert.deepEqual(source, sourceClone);

let program = takeProgram(engine, { now: T2 });
assert.equal(getProgramState(engine), "program");
assert.equal(program.status, "program");
assert.equal(program.transitionMode, "take");
assert.equal(program.revision, 0);
assert.equal(program.previewId, source.preview.previewId);
assert.equal(program.projectionVersion, "1.0.0");
assert.equal(program.composition.data.turn.team.name, "Rancheros de Tijuana");
assert.equal(program.components.length, 1);
assert.equal(program.layers.length, 1);
assert.equal(program.programRevision, program.revision);
assert.equal(program.output.safeArea.top, 0);
assert.equal(program.output.safeArea.bottom, false);
assert.equal(program.output.safeArea.left, "");
assert.equal(validateProgram(program).valid, true);
assert.equal(hasProgram(engine), true);
const originalProgramId = program.programId;

// Program snapshot is detached, serializable and never exposes runtime, roots, listeners or actors.
const programSnapshot = getProgramSnapshot(engine, { visibility: "public", now: T2 });
assert.doesNotThrow(() => JSON.stringify(programSnapshot));
for (const forbidden of ["runtime", "renderer", "listener", "actor", "tenantId", "signedUrl", "secret"]) {
  assert.equal(JSON.stringify(programSnapshot).includes(forbidden), false, `${forbidden} leaked`);
}
assert.doesNotMatch(JSON.stringify(programSnapshot), /"root"\s*:/);
programSnapshot.program.output.outputId = "mutated";
programSnapshot.program.composition.data.turn.team.name = "mutated";
assert.equal(getProgram(engine).output.outputId, "preview_1080");
assert.equal(getProgram(engine).composition.data.turn.team.name, "Rancheros de Tijuana");

// CUT and AUTO are synchronous modeled transitions that retain one compatible Program identity.
prepareProgram(engine, previewSnapshot({
  preview: { previewId: "preview_cut", themeId: "theme_dark", updatedAt: T2, revision: 2 }
}), { now: T2, rendererId: "renderer_v1" });
program = cutProgram(engine, { now: T2 });
assert.equal(program.programId, originalProgramId);
assert.equal(program.transitionMode, "cut");
assert.equal(program.revision, 1);

prepareProgram(engine, previewSnapshot({
  preview: { previewId: "preview_auto", templateId: "template_lower_third", updatedAt: T3, revision: 3 }
}), { now: T3, rendererId: "renderer_v1" });
program = autoProgram(engine, { now: T3 });
assert.equal(program.programId, originalProgramId);
assert.equal(program.transitionMode, "auto");
assert.equal(program.revision, 2);

// Compatible update can replace Preview, Theme, Template, context and visibility without replacing Program identity.
program = updateProgram(engine, previewSnapshot({
  preview: {
    previewId: "preview_update",
    templateId: "template_fullscreen",
    themeId: "theme_orgullo_charro",
    visibility: "restricted",
    updatedAt: T4,
    revision: 4
  },
  visibility: "restricted"
}), { now: T4, rendererId: "renderer_v1", context: { score: 0, visible: false, label: "", optional: null } });
assert.equal(program.programId, originalProgramId);
assert.equal(program.templateId, "template_fullscreen");
assert.equal(program.themeId, "theme_orgullo_charro");
assert.equal(program.visibility, "restricted");
assert.equal(program.revision, 3);

// Incompatible output creates a fresh Program identity, while Preview source remains untouched.
program = updateProgram(engine, previewSnapshot({
  preview: {
    previewId: "preview_vertical",
    output: {
      outputId: "preview_vertical",
      type: "preview",
      orientation: "portrait",
      resolution: { width: 1080, height: 1920 },
      safeArea: {}
    }
  }
}), { now: T4, rendererId: "renderer_v1" });
assert.notEqual(program.programId, originalProgramId);
assert.equal(program.output.outputId, "preview_vertical");
const verticalProgramId = program.programId;

// Renderer incompatibility also replaces identity.
program = updateProgram(engine, previewSnapshot({
  preview: {
    previewId: "preview_vertical_renderer_2",
    output: {
      outputId: "preview_vertical",
      type: "preview",
      orientation: "portrait",
      resolution: { width: 1080, height: 1920 },
      safeArea: {}
    }
  }
}), { now: T4, rendererId: "renderer_v2" });
assert.notEqual(program.programId, verticalProgramId);

// Invalid updates are atomic: identity, state, revision, timestamps and snapshot remain exact.
const beforeFailure = getProgram(engine);
const beforeFailureState = getProgramState(engine);
const beforeFailureEngineRevision = engine.revision;
const beforeFailureUpdatedAt = engine.updatedAt;
const beforeFailureSnapshot = getProgramSnapshot(engine, { now: T4 });
assert.throws(
  () => updateProgram(engine, previewSnapshot({ html: "<script>alert(1)</script>" }), { now: T4 }),
  (error) => error instanceof BroadcastProgramError && error.code === "program-preview-snapshot-unsafe"
);
assert.deepEqual(getProgram(engine), beforeFailure);
assert.equal(getProgramState(engine), beforeFailureState);
assert.equal(engine.revision, beforeFailureEngineRevision);
assert.equal(engine.updatedAt, beforeFailureUpdatedAt);
assert.deepEqual(getProgramSnapshot(engine, { now: T4 }), beforeFailureSnapshot);

// Unsafe input never reaches Program.
for (const unsafe of [
  { html: "<img src=x onerror=alert(1)>" },
  { url: "javascript:alert(1)" },
  { path: "file:///tmp/program" },
  { data: "data:text/html,<script>alert(1)</script>" },
  { actor: { id: "operator" } },
  { value: 1n },
  { listener: () => {} },
  { renderer: { state: "ready" } }
]) {
  assert.throws(() => prepareProgram(engine, previewSnapshot(unsafe), { now: T4 }), BroadcastProgramError);
}
const cyclic = previewSnapshot();
cyclic.loop = cyclic;
assert.throws(() => prepareProgram(engine, cyclic, { now: T4 }), BroadcastProgramError);
const getterSnapshot = previewSnapshot();
Object.defineProperty(getterSnapshot, "computed", { enumerable: true, get: () => "unsafe" });
assert.throws(() => prepareProgram(engine, getterSnapshot, { now: T4 }), BroadcastProgramError);

const cleared = clearProgram(engine, { now: T4 });
assert.equal(cleared.state, "ready");
assert.equal(hasProgram(engine), false);
assert.equal(getProgramSnapshot(engine, { now: T4 }).program, null);
assert.throws(() => takeProgram(engine), (error) => error.code === "program-not-prepared");

prepareProgram(engine, previewSnapshot(), { now: T4 });
takeProgram(engine, { now: T4 });
disposeProgram(engine, { now: T4 });
assert.equal(isProgramReady(engine), true);

destroyProgramEngine(engine, { now: T4 });
assert.equal(isProgramDestroyed(engine), true);
assert.equal(getProgramState(engine), "destroyed");
for (const operation of [
  () => prepareProgram(engine, previewSnapshot()),
  () => takeProgram(engine),
  () => cutProgram(engine),
  () => autoProgram(engine),
  () => updateProgram(engine, previewSnapshot()),
  () => clearProgram(engine),
  () => getProgramSnapshot(engine)
]) {
  assert.throws(operation, (error) => error.code === "program-engine-destroyed");
}

console.log("broadcast-program-engine.test.mjs: ok");
