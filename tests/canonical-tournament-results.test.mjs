import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalOfficialResults } from "../js/core/canonicalOfficialResults.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import {
  adaptCanonicalTournamentResultsToPublicV3,
  buildCanonicalTournamentResults,
  buildCanonicalTournamentResultsHash,
  validateCanonicalTournamentResults
} from "../js/core/canonicalTournamentResults.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";

const TOURNAMENT_ID = "tournament-results";
const CHARREADA_ID = "charreada-results";

test("canonical results compose resolved official values and preserve 0 versus unscored", () => {
  const result = build(sample([
    official("cala", "team-a", "cala", 31), official("pial-zero", "team-a", "piales", 0), official("pial-b", "team-b", "piales", 22)
  ]));
  const teamA = result.results.items.find((row) => row.teamId === "team-a");
  assert.equal(teamA.suertes.cala.total, 31);
  assert.equal(teamA.suertes.piales.total, 0);
  assert.equal(teamA.suertes.toro, undefined);
  assert.equal(teamA.status, "OFFICIAL");
  assert.equal(result.teams.find((team) => team.teamId === "team-a").total, 31);
});

test("single team total, sheet, and official ranking share the resolved team total", () => {
  const result = build(sample([
    official("cala", "team-a", "cala", 31), official("piales", "team-a", "piales", 38), official("terna", "team-a", "pial_ruedo", 21), official("rest", "team-a", "paso", 103)
  ], { restas: { "team-a": 0 } }));
  const row = result.results.items[0];
  assert.equal(row.total, 193);
  assert.equal(result.sheet.competitions[0].rows[0].total, 193);
  assert.equal(result.standings.items.find((item) => item.scopeType === "charreada").total, 193);
  assert.equal(row.suertes.pial_ruedo.total, 21);
  assert.deepEqual(validateCanonicalTournamentResults(result), { valid: true, errors: [] });
});

test("canonical official correction and legacy duplicate heads become PR 21 and total 193", () => {
  const raw = [
    official("cala", "team-a", "cala", 31), official("piales", "team-a", "piales", 38), official("rest", "team-a", "paso", 103),
    official("pr-a", "team-a", "pial_ruedo", 21, { shared: "terna:op:4", timestampMs: 10 }),
    official("pr-b", "team-a", "pial_ruedo", 21, { shared: "terna:op:4", timestampMs: 20 }),
    official("pr-c", "team-a", "pial_ruedo", 21, { shared: "terna:op:4", timestampMs: 30 })
  ];
  const canonical = buildCanonicalOfficialResults({ publishedScores: raw, tournamentId: TOURNAMENT_ID });
  const result = build({ ...sample([]), canonicalOfficialResults: canonical });
  assert.equal(result.results.items[0].suertes.pial_ruedo.total, 21);
  assert.equal(result.results.items[0].total, 193);
  assert.equal(result.provenance.duplicateHeadsResolved, 2);
  const publicV3 = createCanonicalPublicTournamentData(adaptCanonicalTournamentResultsToPublicV3(result, publicInput()));
  assert.equal(publicV3.results.teams[0].columns.pial_ruedo, 21);
  assert.equal(publicV3.results.teams[0].total, 193);
});

test("corrections, multiple charreadas, penalties, and phases retain canonical identities", () => {
  const base = sample([
    official("old", "team-a", "cala", 15, { timestampMs: 1, shared: "cala:1" }), official("new", "team-a", "cala", 21, { timestampMs: 2, revision: 2, shared: "cala:1" }),
    official("b", "team-b", "cala", 21, { individualBadPoints: 2, teamBadPoints: 3 })
  ], { secondCharreada: true });
  base.publishedScores.push(official("a2", "team-a", "paso", 10, { charreadaId: "charreada-two", phaseId: "final" }));
  const result = build(base);
  assert.equal(result.results.items.find((row) => row.teamId === "team-a" && row.charreadaId === CHARREADA_ID).total, 21);
  assert.equal(result.results.items.find((row) => row.teamId === "team-a" && row.charreadaId === "charreada-two").total, 10);
  assert.equal(result.results.items.find((row) => row.teamId === "team-b").penalties, 5);
  assert.ok(result.standings.items.some((item) => item.scopeType === "phase" && item.phaseId === "final"));
});

test("determinism excludes generatedAt and preserves privacy at the V3 boundary", () => {
  const input = sample([official("score", "team-a", "terna", 46)]);
  const first = build(input, { generatedAt: "2026-09-08T00:00:00.000Z" });
  const second = build(input, { generatedAt: "2026-09-08T01:00:00.000Z" });
  assert.equal(first.sourceHash, second.sourceHash);
  assert.equal(buildCanonicalTournamentResultsHash(first), buildCanonicalTournamentResultsHash(second));
  const publicV3 = createCanonicalPublicTournamentData(adaptCanonicalTournamentResultsToPublicV3(first, publicInput()));
  assert.equal(JSON.stringify(publicV3).includes("attemptV2"), false);
  assert.equal(JSON.stringify(publicV3).includes("idempotency"), false);
});

function build(input, options = {}) { return buildCanonicalTournamentResults(input, { generatedAt: options.generatedAt || "2026-09-08T00:00:00.000Z", sourceRevision: 9 }); }

function sample(scores, options = {}) {
  const charreadas = [{ id: CHARREADA_ID, competitionId: "equipos_completo", competitionName: "Equipos", phaseId: "qualifying", phaseName: "Clasificatoria", restas: options.restas || {} }];
  if (options.secondCharreada) charreadas.push({ id: "charreada-two", competitionId: "equipos_completo", competitionName: "Equipos", phaseId: "final", phaseName: "Final", restas: {} });
  return { tournament: { id: TOURNAMENT_ID, status: options.status || "live" }, teams: [{ id: "team-a", name: "Equipo A" }, { id: "team-b", name: "Equipo B" }], charreadas, publishedScores: scores, sourceRevision: 9 };
}

function official(id, teamId, suerteId, total, options = {}) {
  const charreadaId = options.charreadaId || CHARREADA_ID;
  const timestampMs = options.timestampMs || 10;
  return {
    id, tournamentId: TOURNAMENT_ID, charreadaId, competitionId: "equipos_completo", phaseId: options.phaseId || "qualifying",
    teamId, teamName: teamId === "team-a" ? "Equipo A" : "Equipo B", suerteId, attemptIndex: 0,
    revision: options.revision || 1, timestampMs, publishedAt: new Date(timestampMs).toISOString(), total,
    breakdown: { attemptV2: { identity: { tournamentId: TOURNAMENT_ID, charreadaId, competitionId: "equipos_completo", phaseId: options.phaseId || "qualifying", teamId, suerteId }, sportState: { opportunity: { number: 1, sharedOpportunityId: options.shared || "" } }, scoring: { teamAdjustedPoints: total, individualBadPoints: options.individualBadPoints || 0, teamBadPoints: options.teamBadPoints || 0 } } }
  };
}

function publicInput() { return { projectionRevision: 1, generatedAt: "2026-09-08T00:00:00.000Z", lifecycle: { status: "LIVE" }, tournament: { name: "Torneo" }, statistics: { status: "READY" } }; }
