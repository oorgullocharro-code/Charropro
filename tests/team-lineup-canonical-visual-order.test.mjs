import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  TEAM_LINEUP_POSITIONS,
  getTeamLineupEntryValue,
  resolveTeamLineupEntries
} from "../js/core/teamLineup.js?v=20260920-team-lineup-canonical-visual-order-001-v1";

const fullSuerteIds = ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"];
const roster = {
  cala: "Cala",
  piales: "Piales",
  colas: ["Coleador 1", "Coleador 2", "Coleador 3"],
  toro: "Toro",
  lazo: "Lazador",
  pial_ruedo: "Pialador",
  terna: ["Lazador", "Pialador", "Apoyo"],
  yegua: "Yegua",
  manganas_pie: "Pie",
  manganas_caballo: "Caballo",
  paso: "Paso",
  legacy_slot: "Histórico"
};
const before = structuredClone(roster);
const entries = resolveTeamLineupEntries(roster, fullSuerteIds);

assert.deepEqual(TEAM_LINEUP_POSITIONS.map((entry) => entry.id), [
  "cala", "piales", "colas-1", "colas-2", "colas-3", "toro", "terna-1", "terna-2", "terna-3", "yegua", "manganas-pie", "manganas-caballo", "paso"
]);
assert.deepEqual(entries.map((entry) => entry.id), [
  "cala", "piales", "colas-1", "colas-2", "colas-3", "toro", "terna-1", "terna-2", "terna-3", "yegua", "manganas-pie", "manganas-caballo", "paso", "legacy:legacy_slot"
]);
assert.equal(getTeamLineupEntryValue(entries[2], roster, roster.terna), "Coleador 1");
assert.equal(getTeamLineupEntryValue(entries[4], roster, roster.terna), "Coleador 3");
assert.equal(getTeamLineupEntryValue(entries[6], roster, roster.terna), "Lazador");
assert.equal(getTeamLineupEntryValue(entries[8], roster, roster.terna), "Apoyo");
assert.equal(getTeamLineupEntryValue(entries[10], roster, roster.terna), "Pie");
assert.equal(getTeamLineupEntryValue(entries[11], roster, roster.terna), "Caballo");
assert.equal(getTeamLineupEntryValue(entries.at(-1), roster, roster.terna), "Histórico");
assert.deepEqual(roster, before, "visual lineup ordering cannot mutate roster assignments");

const incomplete = resolveTeamLineupEntries({ cala: "Cala", colas: ["Uno"] }, ["cala", "colas"]);
assert.deepEqual(incomplete.map((entry) => entry.id), ["cala", "colas-1", "colas-2", "colas-3"]);
assert.equal(getTeamLineupEntryValue(incomplete[2], { cala: "Cala", colas: ["Uno"] }), "");

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /const roster = \{ \.\.\.\(existing\?\.roster \|\| \{\}\), \.\.\.createRoster\(""\) \};/, "editing a lineup preserves unknown legacy roster keys");

console.log("team lineup canonical visual order tests passed");
