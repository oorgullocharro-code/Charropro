import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  selectActiveCharreadaScoreboard,
  selectPublicProjectionStandingRows
} from "../js/core/generalScoreboard.js?v=20260920-coleadero-explicit-official-result-zero-fix-001-v1";
import { normalizeGraphicsConfig } from "../js/core/graphicsConfig.js?v=20260920-coleadero-explicit-official-result-zero-fix-001-v1";

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

const v3Standings = {
  standings: {
    items: [
      { scopeType: "competition", competitionId: "equipos_completo", teamId: "team-a", teamName: "A", total: 53, position: 1 },
      { scopeType: "charreada", charreadaId: "charreada-v3", competitionId: "equipos_completo", teamId: "team-a", teamName: "A", total: 53, position: 1 },
      { scopeType: "charreada", charreadaId: "charreada-v3", competitionId: "equipos_completo", teamId: "team-b", teamName: "B", total: 27, position: 4 },
      { scopeType: "charreada", charreadaId: "charreada-v3", competitionId: "equipos_completo", teamId: "team-c", teamName: "C", total: 42, position: 2 },
      { scopeType: "charreada", charreadaId: "charreada-v3", competitionId: "equipos_completo", teamId: "team-d", teamName: "D", total: 32, position: 3 },
      { scopeType: "charreada", charreadaId: "other-charreada", competitionId: "equipos_completo", teamId: "team-x", teamName: "X", total: 99, position: 1 }
    ]
  }
};
const v3Rows = selectPublicProjectionStandingRows(v3Standings, {
  activeCharreada: { id: "charreada-v3", competitionId: "equipos_completo" }
});
assert.deepEqual(v3Rows.charreadaRows.map((row) => [row.teamId, row.total]), [
  ["team-a", 53], ["team-c", 42], ["team-d", 32], ["team-b", 27]
]);
const v3Scoreboard = selectActiveCharreadaScoreboard({
  charreada: { teamIds: ["team-a", "team-b", "team-c", "team-d", "team-e"] },
  teams: teams(["team-a", "A"], ["team-b", "B"], ["team-c", "C"], ["team-d", "D"], ["team-e", "E"]),
  leaderboard: v3Rows.charreadaRows.map((row) => ({ team: { id: row.teamId, name: row.teamName }, total: row.total })),
  turn: { team: { id: "team-c" }, charro: "Patricia" }
});
assert.deepEqual(v3Scoreboard.rows.map((row) => [row.id, row.total, row.status]), [
  ["team-a", 53, "OFFICIAL"],
  ["team-b", 27, "OFFICIAL"],
  ["team-c", 42, "OFFICIAL"],
  ["team-d", 32, "OFFICIAL"],
  ["team-e", 0, "NOT_STARTED"]
]);
assert.equal(v3Scoreboard.rows[2].currentCharro, "Patricia");

const officialZero = selectActiveCharreadaScoreboard({
  charreada: { teamIds: ["team-zero", "team-pending"] },
  teams: teams(["team-zero", "Cero"], ["team-pending", "Pendiente"]),
  leaderboard: [official("team-zero", "Cero", 0)],
  turn: null
});
assert.deepEqual(officialZero.rows.map((row) => [row.total, row.status, row.hasOfficialScore]), [
  [0, "OFFICIAL", true], [0, "NOT_STARTED", false]
]);

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
assert.match(graphicSource, /moneylessNumber\(team\.total\)/);

const syncSource = readFileSync(new URL("../js/core/sync.js", import.meta.url), "utf8");
assert.match(syncSource, /selectPublicProjectionStandingRows\(projection/);
assert.doesNotMatch(syncSource, /projection\.rankings\?\.items/);

console.log("GENERAL_SCOREBOARD_ACTIVE_CHARREADA_MULTI_TEAM: PASS");
