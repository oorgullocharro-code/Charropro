import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPublicProjection,
  reconcilePublicProjection
} from "../js/public/publicProjection.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import {
  validatePublicProjection,
  validatePublicProjectionForRead
} from "../js/public/publicProjectionSchema.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import { applyPublicPortalSnapshot } from "../js/public/publicPortalClient.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import { adaptPublicProjectionToLegacy } from "../js/public/publicProjectionLegacyAdapter.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import {
  buildPublicPortalModel,
  getPortalViewDependencies
} from "../js/publicPortal/portalSelectors.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import {
  buildOfficialRankingItems,
  compareOfficialRankingRows
} from "../js/core/officialRanking.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

const NOW = Date.parse("2026-08-31T18:00:00.000Z");

const empty = project(sourceFixture({ teams: [], charreadas: [], scores: [] }));
assert.equal(empty.rankings.status, "empty");
assert.deepEqual(empty.rankings.items, []);

const one = project(sourceFixture({
  teams: [team("a", "Equipo A")],
  charreadas: [charreada("j1", ["a"])],
  scores: [score("a-j1", "j1", "a", "Equipo A", 30)]
}));
assert.deepEqual(competitionRanking(one).map(summary), [{ id: "a", total: 30, position: 1 }]);

const source = sourceFixture({
  teams: [team("a", "Equipo A"), team("b", "Equipo B"), team("c", "Equipo C")],
  charreadas: [charreada("j1", ["a", "b", "c"]), charreada("j2", ["a", "b", "c"])],
  scores: [
    score("a-j1", "j1", "a", "Equipo A", 30),
    score("b-j1", "j1", "b", "Equipo B", 25),
    score("c-j1", "j1", "c", "Equipo C", 20),
    score("a-j2", "j2", "a", "Equipo A", 10),
    score("b-j2", "j2", "b", "Equipo B", 25),
    score("c-j2", "j2", "c", "Equipo C", 35)
  ]
});

const projection = project(source);
assert.deepEqual(competitionRanking(projection).map(summary), [
  { id: "c", total: 55, position: 1 },
  { id: "b", total: 50, position: 2 },
  { id: "a", total: 40, position: 3 }
]);
assert.equal(projection.results.items.length, 6, "documentary rows remain scoped by charreada");
assert.equal(competitionRanking(projection).length, 3, "global ranking contains one row per team");
assert.deepEqual(projection.live.standings.map((row) => row.teamId), ["c", "b", "a"]);

const portal = buildPublicPortalModel(projection, { competitionId: "competition-team" });
assert.deepEqual(portal.rankedResults.map((row) => row.teamId), ["c", "b", "a"]);
assert.deepEqual(portal.rankedResults.map((row) => row.displayTotal), [55, 50, 40]);
assert.deepEqual(portal.rankedResults.map((row) => row.displayPosition), [1, 2, 3]);
assert.equal(getPortalViewDependencies("competencias").includes("rankings"), true);
assert.equal(portal.sheet.rows.length, 6, "the score sheet preserves per-charreada rows");

const legacy = adaptPublicProjectionToLegacy(projection);
assert.deepEqual(legacy.generalRanking.map((row) => row.teamId), ["c", "b", "a"]);
assert.deepEqual(legacy.generalRanking.map((row) => row.total), [55, 50, 40]);

const withDraft = structuredClone(source);
withDraft.tournament.publishedScores.draft = {
  ...score("draft", "j2", "a", "Equipo A", 999),
  draft: true,
  published: false
};
assert.deepEqual(competitionRanking(project(withDraft)).map(summary), competitionRanking(projection).map(summary));

const corrected = structuredClone(source);
corrected.tournament.publishedScores["a-j1-correction"] = {
  ...corrected.tournament.publishedScores["a-j1"],
  id: "a-j1-correction",
  revision: 2,
  correction: true,
  attempt: { total: 60 },
  publishedAt: "2026-08-31T17:10:00.000Z"
};
assert.deepEqual(competitionRanking(project(corrected)).map(summary), [
  { id: "a", total: 70, position: 1 },
  { id: "c", total: 55, position: 2 },
  { id: "b", total: 50, position: 3 }
]);

const tied = project(sourceFixture({
  teams: [team("z", "Zulu"), team("a", "Alfa")],
  charreadas: [charreada("j1", ["z", "a"])],
  scores: [score("z-j1", "j1", "z", "Zulu", 30), score("a-j1", "j1", "a", "Alfa", 30)]
}));
assert.deepEqual(competitionRanking(tied).map((row) => [row.teamName, row.position]), [["Alfa", 1], ["Zulu", 2]]);
assert.equal(compareOfficialRankingRows(competitionRanking(tied)[0], competitionRanking(tied)[1]) < 0, true);

const otherTournament = project(sourceFixture({
  tournamentId: "tournament-b",
  teams: [team("x", "Equipo X")],
  charreadas: [charreada("j1", ["x"], { tournamentId: "tournament-b" })],
  scores: [score("x-j1", "j1", "x", "Equipo X", 999, { tournamentId: "tournament-b" })]
}));
assert.deepEqual(competitionRanking(otherTournament).map(summary), [{ id: "x", total: 999, position: 1 }]);
assert.deepEqual(competitionRanking(projection).map(summary), [
  { id: "c", total: 55, position: 1 },
  { id: "b", total: 50, position: 2 },
  { id: "a", total: 40, position: 3 }
]);

const duplicateCandidate = buildPublicProjection(source, { tournamentId: "tournament-a", nowMs: NOW + 1000 });
const duplicate = reconcilePublicProjection(projection, duplicateCandidate, { nowMs: NOW + 1000 });
assert.equal(duplicate.ok, true);
assert.equal(duplicate.changed, false);
assert.equal(duplicate.projection.rankings.revision, projection.rankings.revision);
const reloaded = buildPublicPortalModel(structuredClone(projection), { competitionId: "competition-team" });
assert.deepEqual(reloaded.rankedResults.map(summaryPortal), portal.rankedResults.map(summaryPortal));

const individual = project(sourceFixture({
  teams: [],
  charreadas: [
    charreada("caladero", [], {
      competitionId: "caladero-libre",
      competitionType: "caladero",
      competitionScope: "individual",
      individualParticipants: [{ id: "p1", name: "Ana" }, { id: "p2", name: "Beatriz" }],
      suerteIds: ["cala"]
    }),
    charreada("coleadero", [], {
      competitionId: "coleadero-libre",
      competitionType: "coleadero",
      competitionScope: "individual",
      individualParticipants: [{ id: "p3", name: "Carlos" }, { id: "p4", name: "Diego" }],
      suerteIds: ["colas"]
    })
  ],
  scores: [
    individualScore("caladero-p1", "caladero", "caladero-libre", "caladero", "p1", "Ana", "cala", 38),
    individualScore("caladero-p2", "caladero", "caladero-libre", "caladero", "p2", "Beatriz", "cala", 35),
    individualScore("coleadero-p3", "coleadero", "coleadero-libre", "coleadero", "p3", "Carlos", "colas", 42),
    individualScore("coleadero-p4", "coleadero", "coleadero-libre", "coleadero", "p4", "Diego", "colas", 41)
  ]
}));
assert.deepEqual(competitionRanking(individual, "caladero-libre").map((row) => row.participantId), ["p1", "p2"]);
assert.deepEqual(competitionRanking(individual, "coleadero-libre").map((row) => row.participantId), ["p3", "p4"]);

assert.deepEqual(validatePublicProjection(projection).errors, []);
const legacyUnavailable = structuredClone(projection);
legacyUnavailable.rankings = { revision: 0, status: "unavailable", items: [] };
assert.equal(validatePublicProjection(legacyUnavailable).valid, false, "current writes remain strict");
assert.equal(validatePublicProjectionForRead(legacyUnavailable).valid, true, "legacy unavailable is accepted for reads");
const legacyRead = applyPublicPortalSnapshot({}, legacyUnavailable, { nowMs: NOW });
assert.equal(legacyRead.accepted, true);
const legacyPortal = buildPublicPortalModel(legacyRead.state.snapshot, { competitionId: "competition-team" });
assert.equal(legacyPortal.rankingStatus, "unavailable");
assert.deepEqual(legacyPortal.rankedResults, [], "legacy result rows never become an invented aggregate ranking");
assert.equal(legacyPortal.results.length, 6, "valid public results remain available");
for (const status of ["ready", "empty"]) {
  const current = structuredClone(projection);
  current.rankings.status = status;
  if (status === "empty") current.rankings.items = [];
  assert.equal(validatePublicProjectionForRead(current).valid, true, `${status} remains readable`);
  assert.equal(validatePublicProjection(current).valid, true, `${status} remains writable`);
}
const unknownRankingStatus = structuredClone(projection);
unknownRankingStatus.rankings.status = "future-unknown";
assert.equal(validatePublicProjectionForRead(unknownRankingStatus).valid, false, "unknown ranking status is denied");
const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const scoringSource = readFileSync(new URL("../js/core/scoring.js", import.meta.url), "utf8");
const syncSource = readFileSync(new URL("../js/core/sync.js", import.meta.url), "utf8");
const portalRenderSource = readFileSync(new URL("../js/publicPortal/portalRender.js", import.meta.url), "utf8");
assert.match(appSource, /compareOfficialRankingRows/);
assert.match(scoringSource, /compareOfficialRankingRows/);
assert.match(syncSource, /buildOfficialOutputRanking/);
assert.match(syncSource, /publishedScores/);
assert.doesNotMatch(syncSource, /buildCharreadaLeaderboard/);
assert.match(portalRenderSource, /Ranking no disponible/);

const rebuilt = buildOfficialRankingItems(projection.results.items);
assert.deepEqual(
  rebuilt.filter((row) => row.scopeType === "competition").map(summary),
  competitionRanking(projection).map(summary)
);

console.log("official-ranking-authority-public-parity.test.mjs: ok");

function project(sourceValue) {
  const tournamentId = sourceValue.tournament.info.id;
  const candidate = buildPublicProjection(sourceValue, { tournamentId, nowMs: NOW });
  const reconciled = reconcilePublicProjection(null, candidate, { nowMs: NOW });
  assert.equal(reconciled.ok, true, JSON.stringify(reconciled.errors || []));
  return reconciled.projection;
}

function competitionRanking(value, competitionId = "competition-team") {
  return value.rankings.items
    .filter((row) => row.scopeType === "competition" && row.competitionId === competitionId)
    .sort((left, right) => left.position - right.position);
}

function summary(row) {
  return { id: row.teamId || row.participantId, total: row.total, position: row.position };
}

function summaryPortal(row) {
  return { id: row.teamId || row.participantId, total: row.displayTotal, position: row.displayPosition };
}

function sourceFixture({ tournamentId = "tournament-a", teams, charreadas, scores }) {
  return {
    tournament: {
      info: { id: tournamentId, name: "Ranking QA", type: "completo" },
      meta: { updatedAt: "2026-08-31T17:30:00.000Z", activeCharreadaId: charreadas[0]?.id || "" },
      teams,
      charreadas,
      publishedScores: Object.fromEntries(scores.map((item, index) => [item.id, {
        ...item,
        publishedAt: `2026-08-31T17:00:${String(index + 1).padStart(2, "0")}.000Z`
      }]))
    },
    liveCurrent: {
      tournament: { id: tournamentId },
      activeCharreadaId: charreadas[0]?.id || "",
      competitionId: charreadas[0]?.competitionId || "",
      timestamp: "2026-08-31T17:30:00.000Z"
    }
  };
}

function team(id, name) {
  return { id, name, order: id.charCodeAt(0) };
}

function charreada(id, teamIds, overrides = {}) {
  return {
    id,
    tournamentId: overrides.tournamentId || "tournament-a",
    name: `Jornada ${id}`,
    competitionId: "competition-team",
    competitionType: "equipos_completo",
    competitionScope: "team",
    categoryId: "libre",
    categoryName: "Libre",
    phaseId: "clasificatoria",
    phaseName: "Clasificatoria",
    teamIds,
    suerteIds: ["cala"],
    ...overrides
  };
}

function score(id, charreadaId, teamId, teamName, total, overrides = {}) {
  const second = String([...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 50).padStart(2, "0");
  return {
    id,
    attemptKey: `${overrides.tournamentId || "tournament-a"}:${charreadaId}:${teamId}:cala:0:0`,
    tournamentId: overrides.tournamentId || "tournament-a",
    charreadaId,
    competitionId: "competition-team",
    competitionType: "equipos_completo",
    participantScope: "team",
    teamId,
    teamName,
    suerteId: "cala",
    attemptIndex: 0,
    attempt: { total },
    revision: 1,
    published: true,
    publishedAt: `2026-08-31T17:00:${second}.000Z`,
    ...overrides
  };
}

function individualScore(id, charreadaId, competitionId, competitionType, participantId, participantName, suerteId, total) {
  const second = String([...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 50).padStart(2, "0");
  return {
    id,
    attemptKey: `tournament-a:${charreadaId}:${participantId}:${suerteId}:0:0`,
    tournamentId: "tournament-a",
    charreadaId,
    competitionId,
    competitionType,
    participantScope: "individual",
    participantId,
    participantName,
    team: { id: participantId, name: participantName, participantName },
    suerteId,
    attemptIndex: 0,
    attempt: { total },
    revision: 1,
    published: true,
    publishedAt: `2026-08-31T17:00:${second}.000Z`
  };
}
