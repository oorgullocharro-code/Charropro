import assert from "node:assert/strict";
import * as api from "../js/broadcast/liveBindings.js";

assert.equal(api.LIVE_BINDINGS_VERSION, "1.0.0");
[
  "LIVE_BINDINGS_VERSION", "LIVE_BINDING_TYPES", "LIVE_BINDING_STATES", "LIVE_BINDING_ERROR_CODES",
  "BroadcastLiveBindingError", "createLiveBindingsEngine", "registerLiveBinding", "updateLiveBinding",
  "removeLiveBinding", "resolveLiveBindings", "applyLiveBindingsToPreview", "applyLiveBindingsToProgram",
  "buildLiveBindingsSnapshot", "destroyLiveBindingsEngine"
].forEach((name) => assert.ok(name in api, `missing export ${name}`));

const engine = api.createLiveBindingsEngine({ engineId: "live-test" });
api.registerLiveBinding(engine, { bindingId: "team", type: "current_team", targetPath: "projection.live.team", targets: ["preview", "program"] });
api.registerLiveBinding(engine, { bindingId: "score", type: "current_score", targetPath: "projection.live.score", targets: ["program"] });
api.registerLiveBinding(engine, { bindingId: "timer", type: "official_timer", targetPath: "projection.live.timer" });
api.registerLiveBinding(engine, { bindingId: "standings", type: "standings", targetPath: "projection.live.standings" });

const source = {
  turn: { team: { id: "team-b", name: "Equipo B" } },
  score: { total: 0 },
  timer: { status: "running", display: "00:04.21", elapsed: 4210 },
  statistics: { standings: [{ position: 1, teamId: "team-a", total: 203 }] }
};
const original = structuredClone(source);
const resolution = api.resolveLiveBindings(engine, source);
assert.equal(resolution.status, "resolved");
assert.equal(resolution.values.team.name, "Equipo B");
assert.equal(resolution.values.score, 0);
assert.deepEqual(source, original, "source remains immutable");

const program = { projection: { live: { label: "" } }, components: [{ id: "component-a" }] };
const applied = api.applyLiveBindingsToProgram(engine, program, resolution);
assert.equal(applied.projection.live.team.name, "Equipo B");
assert.equal(applied.projection.live.score, 0);
assert.equal(applied.projection.live.timer.display, "00:04.21");
assert.equal(applied.projection.live.standings.length, 1);
assert.equal(program.projection.live.team, undefined);
const preview = api.applyLiveBindingsToPreview(engine, program, resolution);
assert.equal(preview.projection.live.team.name, "Equipo B");
assert.equal(preview.projection.live.score, undefined, "program-only binding does not update Preview");

assert.throws(
  () => api.registerLiveBinding(engine, { bindingId: "bad", type: "current_score", sourcePath: "score.penalties", targetPath: "projection.score" }),
  (error) => error.code === api.LIVE_BINDING_ERROR_CODES.SOURCE_PATH_INVALID
);
assert.throws(
  () => api.registerLiveBinding(engine, { bindingId: "bad-target", type: "current_team", targetPath: "__proto__.polluted" }),
  (error) => error.code === api.LIVE_BINDING_ERROR_CODES.TARGET_PATH_INVALID
);
assert.throws(
  () => api.registerLiveBinding(engine, { bindingId: "ranking-calc", type: "standings", sourcePath: "scores", targetPath: "projection.ranking" }),
  (error) => error.code === api.LIVE_BINDING_ERROR_CODES.SOURCE_PATH_INVALID
);

const cyclic = { team: {} };
cyclic.team.self = cyclic.team;
assert.throws(
  () => api.resolveLiveBindings(engine, cyclic),
  (error) => error.code === api.LIVE_BINDING_ERROR_CODES.UNSAFE
);
let getterExecuted = false;
const accessorSource = {};
Object.defineProperty(accessorSource, "team", {
  enumerable: true,
  get() { getterExecuted = true; return { name: "No ejecutar" }; }
});
assert.throws(
  () => api.resolveLiveBindings(engine, accessorSource),
  (error) => error.code === api.LIVE_BINDING_ERROR_CODES.UNSAFE
);
assert.equal(getterExecuted, false);

const snapshot = api.buildLiveBindingsSnapshot(engine);
assert.equal(snapshot.bindings.length, 4);
assert.equal("values" in snapshot.lastResolution, false);
snapshot.bindings[0].sourcePath = "changed";
assert.equal(api.buildLiveBindingsSnapshot(engine).bindings[0].sourcePath, "turn.team");

api.destroyLiveBindingsEngine(engine);
assert.throws(() => api.buildLiveBindingsSnapshot(engine), (error) => error.code === api.LIVE_BINDING_ERROR_CODES.DESTROYED);

console.log("live-bindings.test.mjs: ok");
