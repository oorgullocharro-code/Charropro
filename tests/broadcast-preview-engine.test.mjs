import assert from "node:assert/strict";
import {
  PREVIEW_ENGINE_VERSION,
  BroadcastPreviewError,
  clearPreview,
  createPreviewEngine,
  destroyPreviewEngine,
  disposePreview,
  getPreview,
  getPreviewSnapshot,
  getPreviewState,
  hasPreview,
  isPreviewDestroyed,
  isPreviewReady,
  preparePreview,
  renderPreview,
  updatePreview,
  validatePreview
} from "../js/broadcast/previewEngine.js";

const T0 = "2026-07-15T12:00:00.000Z";
const T1 = "2026-07-15T12:01:00.000Z";
const T2 = "2026-07-15T12:02:00.000Z";
const T3 = "2026-07-15T12:03:00.000Z";

function snapshot(overrides = {}) {
  const render = {
    themedRenderId: "themed_render_scoreboard",
    templateRenderId: "template_render_scoreboard",
    templateId: "template_scoreboard",
    templateVersion: "1.0.0",
    templateInstanceId: "template_instance_scoreboard",
    themeId: "theme_default",
    themeVersion: "1.0.0",
    outputId: "preview_1080",
    visibility: "production",
    state: "prepared",
    status: "prepared",
    warnings: [],
    errors: [],
    createdAt: T0,
    updatedAt: T0,
    ...(overrides.render || {})
  };
  return {
    snapshotVersion: "1.0.0",
    integrationVersion: "1.0.0",
    generatedAt: T0,
    visibility: "production",
    integrationId: "theme_template_preview",
    state: "prepared",
    outputId: render.outputId,
    tenantId: "tenant_internal",
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
    errors: [],
    ...overrides,
    renders: overrides.renders || [render]
  };
}

function themedPreparation(sourceRender, overrides = {}) {
  const component = {
    instance: {
      instanceId: "scoreboard_rows",
      componentId: "scoreboard_table",
      componentType: "table",
      visibility: "production",
      layout: { x: 120, y: 120, width: 1680, height: 720, rotation: 0, anchor: "center", scale: 1, zIndex: 10 },
      style: { opacity: 1, color: "#ffffff", backgroundColor: "#111111" },
      properties: {
        columns: ["Equipo", "Total"],
        rows: [["Rancheros de Tijuana", 203], ["Charros de Jalisco", 202], ["Tres Regalos", 201]],
        alignments: ["left", "right"]
      },
      metadata: { layerId: "scoreboard" }
    },
    resolvedBindings: {
      turn: { team: { id: "team_tijuana", name: "Rancheros de Tijuana" } },
      lastScoredTeam: { id: "team_jalisco", name: "Charros de Jalisco" }
    },
    resolvedContent: { title: "Marcador oficial" }
  };
  return {
    preparationVersion: "1.0.0",
    themedPreparationVersion: "1.0.0",
    preparationId: "preparation_scoreboard",
    templateId: sourceRender.templateId,
    templateInstanceId: sourceRender.templateInstanceId,
    templateType: "scoreboard",
    templateInstance: {
      templateId: sourceRender.templateId,
      templateInstanceId: sourceRender.templateInstanceId,
      templateType: "scoreboard",
      templateVersion: "1.0.0",
      tenantId: "tenant_internal",
      tournamentId: "tournament_a",
      competitionId: "competition_a"
    },
    themeId: overrides.themeId || sourceRender.themeId,
    themeVersion: "1.0.0",
    themeScope: "tournament",
    brandingStatus: "confirmed",
    visibility: "production",
    effectiveVisibility: "production",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    safeArea: { top: 54, right: 96, bottom: 54, left: 96 },
    layout: { mode: "absolute" },
    themeBackground: { type: "transparent" },
    resolvedBindings: component.resolvedBindings,
    components: [component],
    componentOrder: [component.instance.instanceId],
    warnings: [],
    errors: [],
    ...overrides
  };
}

function harness() {
  const state = {
    roots: [],
    clears: 0,
    failUpdate: false,
    omitPreparationOnUpdate: false,
    preparationPreparedAt: null,
    resultUpdatedAt: null
  };
  const adapter = {
    prepare(source, sourceRender) {
      state.preparation = themedPreparation(sourceRender);
      return { source, sourceRender, preparation: state.preparation };
    },
    render(prepared) {
      const root = { nodeType: 1, id: prepared.sourceRender.themedRenderId };
      state.roots.splice(0, state.roots.length, root);
      return { ...prepared.sourceRender, state: "rendered", status: "rendered", root };
    },
    update(active, changes) {
      if (state.failUpdate) throw new Error("fixture-update-failed");
      const next = changes.sourceRender || {};
      if (state.omitPreparationOnUpdate) {
        return {
          themedRenderId: next.themedRenderId || active.themeRenderId,
          templateRenderId: next.templateRenderId || active.templateRenderId,
          templateId: next.templateId,
          templateInstanceId: next.templateInstanceId,
          themeId: changes.themeId || next.themeId,
          state: "rendered",
          status: "rendered",
          root: state.roots[0]
        };
      }
      const root = { nodeType: 1, id: next.themedRenderId || active.themeRenderId };
      state.roots.splice(0, state.roots.length, root);
      state.preparation = themedPreparation(next, {
        themeId: changes.themeId || next.themeId,
        ...(state.preparationPreparedAt ? { preparedAt: state.preparationPreparedAt } : {})
      });
      return {
        themedRenderId: next.themedRenderId || active.themeRenderId,
        templateRenderId: next.templateRenderId || active.templateRenderId,
        templateId: next.templateId,
        templateInstanceId: next.templateInstanceId,
        themeId: changes.themeId || next.themeId,
        outputId: next.outputId,
        visibility: changes.visibility,
        state: "rendered",
        status: "rendered",
        ...(state.resultUpdatedAt ? { updatedAt: state.resultUpdatedAt } : {}),
        preparation: state.preparation,
        root
      };
    },
    clear() {
      state.clears += 1;
      state.roots.length = 0;
      return { removed: true };
    }
  };
  return { state, adapter };
}

assert.equal(PREVIEW_ENGINE_VERSION, "1.0.0");
assert.equal(BroadcastPreviewError.prototype instanceof Error, true);

const fixture = harness();
const engine = createPreviewEngine({ engineId: "official_preview", adapter: fixture.adapter, now: T0 });
assert.equal(getPreviewState(engine), "ready");
assert.equal(isPreviewReady(engine), true);
assert.equal(hasPreview(engine), false);

const source = snapshot();
const sourceClone = structuredClone(source);
let preview = preparePreview(engine, source, { now: T0 });
assert.equal(preview.status, "prepared");
assert.equal(preview.revision, 0);
assert.equal(preview.themeRenderId, "themed_render_scoreboard");
assert.equal(preview.templateRenderId, "template_render_scoreboard");
assert.equal(preview.composition.components.length, 1);
assert.equal(preview.components[0].componentType, "table");
assert.equal(preview.composition.data.turn.team.name, "Rancheros de Tijuana");
assert.equal(preview.layers[0].layerId, "scoreboard");
assert.deepEqual(source, sourceClone);

preview = renderPreview(engine, { now: T1 });
assert.equal(preview.status, "rendered");
assert.equal(preview.revision, 1);
assert.equal(fixture.state.roots.length, 1);
assert.equal(validatePreview(preview).valid, true);
const originalId = preview.previewId;

// Double render is idempotent and never creates a second root.
assert.deepEqual(renderPreview(engine, { now: T1 }), preview);
assert.equal(fixture.state.roots.length, 1);

preview = updatePreview(engine, { themeId: "theme_dark", visibility: "restricted" }, { now: T2 });
assert.equal(preview.previewId, originalId);
assert.equal(preview.themeId, "theme_dark");
assert.equal(preview.composition.themeId, "theme_dark");
assert.equal(preview.visibility, "restricted");
assert.equal(preview.revision, 2);
assert.equal(fixture.state.roots.length, 1);

// Atomic failure preserves identity, state, timestamps, snapshot and root.
const beforeFailure = getPreview(engine);
const beforeFailureSnapshot = getPreviewSnapshot(engine, { now: T2 });
const rootBeforeFailure = fixture.state.roots[0];
fixture.state.failUpdate = true;
assert.throws(
  () => updatePreview(engine, { themeId: "theme_invalid" }, { now: T3 }),
  (error) => error instanceof BroadcastPreviewError && error.code === "fixture-update-failed"
);
fixture.state.failUpdate = false;
assert.deepEqual(getPreview(engine), beforeFailure);
assert.equal(getPreviewState(engine), "rendered");
assert.equal(fixture.state.roots[0], rootBeforeFailure);
assert.equal(
  JSON.stringify(getPreviewSnapshot(engine, { now: T2 })),
  JSON.stringify(beforeFailureSnapshot)
);

// A Theme change without the corresponding public preparation is rejected atomically.
fixture.state.omitPreparationOnUpdate = true;
assert.throws(
  () => updatePreview(engine, { themeId: "theme_missing_preparation" }, { now: T3 }),
  (error) => error instanceof BroadcastPreviewError && error.code === "preview-theme-preparation-mismatch"
);
fixture.state.omitPreparationOnUpdate = false;
assert.deepEqual(getPreview(engine), beforeFailure);
assert.equal(getPreviewState(engine), "rendered");

// Preparation and render timestamps may be consecutive without representing a stale Theme.
fixture.state.preparationPreparedAt = T2;
fixture.state.resultUpdatedAt = T3;
preview = updatePreview(engine, { themeId: "theme_light" }, { now: T3 });
assert.equal(preview.themeId, "theme_light");
assert.equal(preview.revision, 3);
fixture.state.preparationPreparedAt = null;
fixture.state.resultUpdatedAt = null;

// Snapshot is detached, serializable and public visibility removes tenant identity.
const publicSnapshot = getPreviewSnapshot(engine, { visibility: "public", now: T3 });
assert.doesNotThrow(() => JSON.stringify(publicSnapshot));
assert.equal("tenantId" in publicSnapshot, false);
assert.equal(JSON.stringify(publicSnapshot).includes("tenant_internal"), false);
assert.equal(publicSnapshot.preview.composition.data.turn.team.name, "Rancheros de Tijuana");
publicSnapshot.preview.output.outputId = "mutated";
assert.equal(getPreview(engine).output.outputId, "preview_1080");

// Incompatible output creates a new deterministic Preview identity.
const outputSnapshot = snapshot({
  render: { outputId: "preview_vertical" },
  rendererSummary: {
    integrationVersion: "1.0.0",
    outputId: "preview_vertical",
    orientation: "portrait",
    resolution: { width: 1080, height: 1920 },
    safeArea: { top: 96, right: 54, bottom: 96, left: 54 },
    templateRenderIds: ["template_render_scoreboard"]
  }
});
preview = updatePreview(engine, { snapshot: outputSnapshot }, { now: T3 });
assert.notEqual(preview.previewId, originalId);
assert.equal(preview.output.outputId, "preview_vertical");
assert.equal(fixture.state.roots.length, 1);

const cleared = clearPreview(engine, { now: T3 });
assert.equal(cleared.state, "ready");
assert.equal(hasPreview(engine), false);
assert.equal(fixture.state.roots.length, 0);
assert.equal(getPreviewSnapshot(engine, { now: T3 }).preview, null);

// Dispose clears only Preview and leaves the engine reusable.
preparePreview(engine, snapshot(), { now: T3 });
renderPreview(engine, { now: T3 });
disposePreview(engine, { now: T3 });
assert.equal(isPreviewReady(engine), true);

// Unsafe Theme Template snapshots are rejected before the adapter is touched.
for (const unsafe of [
  { actor: { id: "operator" } },
  { html: "<script>alert(1)</script>" },
  { url: "javascript:alert(1)" },
  { value: 1n },
  { listener: () => {} },
  { renderer: { state: "ready" } }
]) {
  assert.throws(() => preparePreview(engine, snapshot(unsafe), { now: T3 }), BroadcastPreviewError);
}
const cyclic = snapshot();
cyclic.loop = cyclic;
assert.throws(() => preparePreview(engine, cyclic, { now: T3 }), BroadcastPreviewError);
const getterSnapshot = snapshot();
Object.defineProperty(getterSnapshot, "computed", { enumerable: true, get: () => "unsafe" });
assert.throws(() => preparePreview(engine, getterSnapshot, { now: T3 }), BroadcastPreviewError);

// Valid values are preserved.
const valuesSnapshot = snapshot({ zero: 0, disabled: false, empty: "", nullable: null });
assert.doesNotThrow(() => preparePreview(engine, valuesSnapshot, { now: T3 }));

destroyPreviewEngine(engine, { now: T3 });
assert.equal(isPreviewDestroyed(engine), true);
assert.equal(getPreviewState(engine), "destroyed");
for (const operation of [
  () => preparePreview(engine, snapshot()),
  () => renderPreview(engine),
  () => updatePreview(engine, {}),
  () => clearPreview(engine),
  () => getPreviewSnapshot(engine)
]) {
  assert.throws(operation, (error) => error.code === "preview-engine-destroyed");
}

console.log("broadcast-preview-engine.test.mjs: ok");
