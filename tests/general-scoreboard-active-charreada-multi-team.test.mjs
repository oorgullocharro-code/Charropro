import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { selectActiveCharreadaScoreboard } from "../js/core/generalScoreboard.js?v=20260920-general-scoreboard-active-charreada-multi-team-fix-001-v1";
import { normalizeGraphicsConfig } from "../js/core/graphicsConfig.js?v=20260920-general-scoreboard-active-charreada-multi-team-fix-001-v1";

function teams(...entries) {
  return entries.map(([id, name]) => ({ id, name }));
}

function official(teamId, name, total) {
  return { team: { id: teamId, name }, total };
}

const rosterThree = { teamIds: ["team-a", "team-b", "team-c"] };
let result = selectActiveCharreadaScoreboard({
  charreada: rosterThree,
  teams: teams(["team-a", "A"], ["team-b", "B"], ["team-c", "C"]),
  leaderboard: [],
  turn: null
});
assert.equal(result.source, "active-charreada");
assert.deepEqual(result.rows.map((row) => row.id), ["team-a", "team-b", "team-c"]);
assert.deepEqual(result.rows.map((row) => [row.total, row.status, row.hasOfficialScore]), [
  [0, "NOT_STARTED", false], [0, "NOT_STARTED", false], [0, "NOT_STARTED", false]
]);

const rosterFour = { teamIds: ["team-d", "team-b", "team-a", "team-c"] };
result = selectActiveCharreadaScoreboard({
  charreada: rosterFour,
  teams: teams(["team-a", "A"], ["team-b", "B"], ["team-c", "C"], ["team-d", "D"]),
  leaderboard: [official("team-a", "A", 120), official("team-c", "C", 0)],
  turn: { team: { id: "team-b", name: "B" }, charro: "Alejandro" }
});
assert.deepEqual(result.rows.map((row) => row.id), ["team-d", "team-b", "team-a", "team-c"]);
assert.deepEqual(result.rows.map((row) => [row.id, row.total, row.status, row.hasOfficialScore]), [
  ["team-d", 0, "NOT_STARTED", false],
  ["team-b", 0, "NOT_STARTED", false],
  ["team-a", 120, "OFFICIAL", true],
  ["team-c", 0, "OFFICIAL", true]
]);
assert.equal(result.rows[1].active, true);
assert.equal(result.rows[1].currentCharro, "Alejandro");

const corrected = selectActiveCharreadaScoreboard({
  charreada: rosterFour,
  teams: teams(["team-a", "A"], ["team-b", "B"], ["team-c", "C"], ["team-d", "D"]),
  leaderboard: [official("team-a", "A", 118), official("team-c", "C", 0)],
  turn: { team: { id: "team-a", name: "A" }, charro: "Roberto" }
});
assert.deepEqual(corrected.rows.map((row) => row.id), result.rows.map((row) => row.id));
assert.equal(corrected.rows[2].total, 118);
assert.equal(corrected.rows[2].currentCharro, "Roberto");

const nextCharreada = selectActiveCharreadaScoreboard({
  charreada: { teamIds: ["team-x", "team-y", "team-z"] },
  teams: teams(["team-x", "X"], ["team-y", "Y"], ["team-z", "Z"]),
  leaderboard: [official("team-x", "X", 10)],
  turn: { team: { id: "team-y", name: "Y" }, charro: "Daniel" }
});
assert.deepEqual(nextCharreada.rows.map((row) => row.id), ["team-x", "team-y", "team-z"]);
assert.equal(nextCharreada.rows.some((row) => row.id === "team-a"), false);

const legacy = selectActiveCharreadaScoreboard({
  charreada: { id: "legacy" },
  leaderboard: [official("legacy-a", "Legado A", 9)],
  turn: { team: { id: "legacy-b", name: "Legado B" }, charro: "Juez" }
});
assert.equal(legacy.source, "legacy");
assert.deepEqual(legacy.rows.map((row) => row.id), ["legacy-b", "legacy-a"]);
assert.equal(normalizeGraphicsConfig().maxTeams, 3, "The global graphics default remains unchanged.");

const graphicSource = readFileSync(new URL("../js/views/grafico.js", import.meta.url), "utf8");
assert.match(graphicSource, /scoreboard\.source === "active-charreada" \? scoreboard\.rows : scoreboard\.rows\.slice\(0, config\.maxTeams\)/);
assert.match(graphicSource, /graphic-team-current/);

console.log("GENERAL_SCOREBOARD_ACTIVE_CHARREADA_MULTI_TEAM: PASS");
