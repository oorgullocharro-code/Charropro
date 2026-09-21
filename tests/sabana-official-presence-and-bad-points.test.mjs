import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  aggregateCanonicalOfficialTeamTotals,
  getCanonicalOfficialSuerteTotals,
  getCanonicalOfficialTeamTotals
} from "../js/core/canonicalOfficialResults.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";
import { SUERTES } from "../js/data/suertes.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";
import { getTournamentTeams, state } from "../js/core/state.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";

const tournamentId = "tournament-sabana";
const charreadaId = "charreada-sabana";
const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");

test("official score sheet preserves positive and zero values while marking an absent suerte pending", () => {
  const totals = getCanonicalOfficialTeamTotals({
    publishedScores: [
      official("cala-15", "team-a", "cala", 15),
      official("piales-0", "team-a", "piales", 0)
    ]
  }, scope("team-a"));

  assert.deepEqual(getCanonicalOfficialSuerteTotals(totals, "cala"), {
    hasOfficialResult: true,
    total: 15,
    badPoints: 0
  });
  assert.deepEqual(getCanonicalOfficialSuerteTotals(totals, "piales"), {
    hasOfficialResult: true,
    total: 0,
    badPoints: 0
  });
  assert.deepEqual(getCanonicalOfficialSuerteTotals(totals, "toro"), {
    hasOfficialResult: false,
    total: null,
    badPoints: null
  });
});

test("per-suerte bad points and the team total use the selected canonical official records", () => {
  const totals = getCanonicalOfficialTeamTotals({
    publishedScores: [
      official("cala", "team-a", "cala", 15, { individualBadPoints: 2 }),
      official("piales", "team-a", "piales", 8, { individualBadPoints: 1, teamBadPoints: 3 })
    ]
  }, scope("team-a"));

  assert.equal(getCanonicalOfficialSuerteTotals(totals, "cala").badPoints, 2);
  assert.equal(getCanonicalOfficialSuerteTotals(totals, "piales").badPoints, 4);
  assert.equal(totals.badPoints, 6);
});

test("the active ledger head replaces both score and bad points without changing the team roster scope", () => {
  const old = official("old", "team-a", "cala", 15, { individualBadPoints: 4, timestampMs: 10 });
  const current = official("current", "team-a", "cala", 21, { individualBadPoints: 1, timestampMs: 20 });
  const source = {
    publishedScores: [old, current],
    officialScoreLedger: {
      "ledger-cala": { activeRecordId: "current", records: { old, current } }
    }
  };
  const totals = getCanonicalOfficialTeamTotals(source, scope("team-a"));

  assert.equal(getCanonicalOfficialSuerteTotals(totals, "cala").total, 21);
  assert.equal(getCanonicalOfficialSuerteTotals(totals, "cala").badPoints, 1);
  assert.equal(totals.badPoints, 1);
});

test("three and four team sheets retain every rostered team state without conflating zero and absence", () => {
  for (const teamIds of [["team-a", "team-b", "team-c"], ["team-a", "team-b", "team-c", "team-d"]]) {
    const source = {
      publishedScores: [official("zero", "team-a", "cala", 0)]
    };
    const states = teamIds.map((teamId) => getCanonicalOfficialSuerteTotals(
      getCanonicalOfficialTeamTotals(source, scope(teamId)),
      "cala"
    ));
    assert.equal(states.length, teamIds.length);
    assert.deepEqual(states[0], { hasOfficialResult: true, total: 0, badPoints: 0 });
    states.slice(1).forEach((state) => assert.deepEqual(state, {
      hasOfficialResult: false,
      total: null,
      badPoints: null
    }));
  }
});

test("the tournament-wide roster includes teams from every charreada, not the active charreada or another tournament", () => {
  const previousTeams = state.teams;
  const previousTournamentId = state.activeTournamentId;
  const previousCharreadaId = state.activeCharreadaId;
  try {
    state.activeTournamentId = tournamentId;
    state.teams = [
      ...["team-a", "team-b", "team-c", "team-d", "team-e", "team-f"].map((id) => ({ id, tournamentId, name: id })),
      { id: "other-tournament-team", tournamentId: "other-tournament", name: "Otro" }
    ];
    const roster = getTournamentTeams(tournamentId);
    assert.deepEqual(roster.map((team) => team.id), ["team-a", "team-b", "team-c", "team-d", "team-e", "team-f"]);

    state.activeCharreadaId = "charreada-one";
    assert.deepEqual(getTournamentTeams(tournamentId).map((team) => team.id), roster.map((team) => team.id));
    state.activeCharreadaId = "charreada-two";
    assert.deepEqual(getTournamentTeams(tournamentId).map((team) => team.id), roster.map((team) => team.id));
    assert.equal(new Set(roster.map((team) => team.id)).size, 6);
  } finally {
    state.teams = previousTeams;
    state.activeTournamentId = previousTournamentId;
    state.activeCharreadaId = previousCharreadaId;
  }
});

test("tournament-wide totals aggregate only each team's canonical scores from its scheduled charreadas", () => {
  const charreadaOne = "charreada-one";
  const charreadaTwo = "charreada-two";
  const source = {
    publishedScores: [
      official("a-c1", "team-a", "cala", 15, { charreadaId: charreadaOne, individualBadPoints: 1 }),
      official("d-c2", "team-d", "piales", 0, { charreadaId: charreadaTwo, teamBadPoints: 2 }),
      { ...official("foreign", "other-tournament-team", "cala", 99), tournamentId: "other-tournament" }
    ]
  };
  const totalsFor = (teamId) => aggregateCanonicalOfficialTeamTotals([
    getCanonicalOfficialTeamTotals(source, { tournamentId, charreadaId: charreadaOne, teamId }),
    getCanonicalOfficialTeamTotals(source, { tournamentId, charreadaId: charreadaTwo, teamId })
  ]);

  const teamA = totalsFor("team-a");
  const teamD = totalsFor("team-d");
  const teamB = totalsFor("team-b");
  assert.deepEqual(getCanonicalOfficialSuerteTotals(teamA, "cala"), { hasOfficialResult: true, total: 15, badPoints: 1 });
  assert.deepEqual(getCanonicalOfficialSuerteTotals(teamD, "piales"), { hasOfficialResult: true, total: 0, badPoints: 2 });
  assert.equal(teamD.badPoints, 2);
  assert.deepEqual(getCanonicalOfficialSuerteTotals(teamB, "cala"), { hasOfficialResult: false, total: null, badPoints: null });
  assert.equal(teamB.hasOfficialRecords, false);
});

test("the tournament-wide sheet presents compact point-only suerte columns and one canonical infraction total", () => {
  const source = {
    publishedScores: [
      official("cala-18", "team-a", "cala", 18, { individualBadPoints: 2 }),
      official("piales-0", "team-a", "piales", 0, { teamBadPoints: 1 })
    ]
  };
  const totals = getCanonicalOfficialTeamTotals(source, scope("team-a"));
  const tournamentWideRenderer = appSource.slice(
    appSource.indexOf("function renderTournamentWideScoreSheet"),
    appSource.indexOf("function renderPhaseSummaryScoreSheet")
  );

  assert.deepEqual(getCanonicalOfficialSuerteTotals(totals, "cala"), {
    hasOfficialResult: true,
    total: 18,
    badPoints: 2
  });
  assert.deepEqual(getCanonicalOfficialSuerteTotals(totals, "piales"), {
    hasOfficialResult: true,
    total: 0,
    badPoints: 1
  });
  assert.equal(getCanonicalOfficialSuerteTotals(totals, "toro").hasOfficialResult, false);
  assert.equal(totals.badPoints, 3);
  assert.match(tournamentWideRenderer, /getCompactScoreSheetSuerteLabel/);
  assert.match(tournamentWideRenderer, /<th class="num">Total<\/th>/);
  assert.match(tournamentWideRenderer, /Infracciones totales">Inf T/);
  assert.match(tournamentWideRenderer, /includeInfractions: false/);
  assert.doesNotMatch(tournamentWideRenderer, /Puntos malos|Restas|score-sheet-bad-points/);
  for (const label of ["C", "P", "T", "LC", "PR", "Y", "MC", "MP", "PM"]) {
    assert.match(appSource, new RegExp(`: "${label}"`));
  }
});

test("the selected phase sheet matches the compact tournament sheet without changing its charreada scope", () => {
  const phaseRenderer = appSource.slice(
    appSource.indexOf("function renderDetailedScoreSheet"),
    appSource.indexOf("function renderScoreSheetSuerteCell")
  );
  const compactLabels = ["C", "P", "C", "T", "LC", "PR", "Y", "MP", "MC", "PM"];

  assert.match(phaseRenderer, /<th>Charreada<\/th>/);
  assert.match(phaseRenderer, /getCompactScoreSheetSuerteLabel/);
  assert.match(phaseRenderer, /includeInfractions: false/);
  assert.match(phaseRenderer, /<th class="num">Total<\/th>/);
  assert.match(phaseRenderer, /Infracciones totales">Inf T/);
  assert.doesNotMatch(phaseRenderer, /Puntos malos|Restas|score-sheet-bad-points/);
  assert.match(
    appSource,
    /return renderDetailedScoreSheet\(selectedPhase\.sourceCharreadas \|\| \[\], \{ visibleTeamIds, labels \}\);/
  );
  assert.ok(
    SUERTES.findIndex((suerte) => suerte.id === "manganas_pie") <
      SUERTES.findIndex((suerte) => suerte.id === "manganas_caballo"),
    "Manganas a Pie must precede Manganas a Caballo in the compact sports order"
  );
  compactLabels.forEach((label) => assert.match(appSource, new RegExp(`: "${label}"`)));
});

function scope(teamId) {
  return { tournamentId, charreadaId, teamId };
}

function official(id, teamId, suerteId, total, options = {}) {
  const timestampMs = options.timestampMs || 1;
  return {
    id,
    tournamentId,
    charreadaId: options.charreadaId || charreadaId,
    teamId,
    suerteId,
    revision: 1,
    timestampMs,
    publishedAt: new Date(timestampMs).toISOString(),
    breakdown: {
      attemptV2: {
        identity: { tournamentId, charreadaId: options.charreadaId || charreadaId, teamId, suerteId },
        scoring: {
          teamAdjustedPoints: total,
          individualBadPoints: options.individualBadPoints || 0,
          teamBadPoints: options.teamBadPoints || 0
        }
      }
    }
  };
}
