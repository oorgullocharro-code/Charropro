import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPublicProjection } from "../js/public/publicProjection.js?v=20260825-official-timer-live-context-001-v1";
import { validatePublicProjection } from "../js/public/publicProjectionSchema.js?v=20260825-official-timer-live-context-001-v1";
import { buildPublicPortalModel } from "../js/publicPortal/portalSelectors.js?v=20260825-official-timer-live-context-001-v1";

const source = buildSource();
let projection = buildPublicProjection(source, {
  tournamentId: "demo-local-fmch-2026",
  nowMs: Date.parse("2026-08-13T14:00:00.000Z")
});
projection.projectionRevision = 1;
for (const section of ["metadata", "overview", "program", "live", "liveFeed", "competitions", "results"]) {
  projection[section].revision = 1;
}
assert.deepEqual(validatePublicProjection(projection).errors, []);

assertPartialProjection(projection, { "equipo-a": 38, "equipo-b": 26 });
let model = buildPublicPortalModel(projection, { competitionId: "competencia-equipos" });
assert.deepEqual(model.rankedResults.map((row) => row.displayName), ["Charros Demo del Norte", "Rancheros de Ensayo"]);
assert.deepEqual(model.rankedResults.map((row) => row.displayTotal), [38, 26]);
assert.deepEqual(model.rankedResults.map((row) => row.displayPosition), [1, 2]);
assert.deepEqual(model.sheet.rows.map((row) => row.displayTotal), [38, 26]);
assert.deepEqual(model.sheet.rows.map((row) => row.displayPosition), [1, 2]);
assert.equal(model.results.every((row) => row.totalStatus === "partial"), true);
assert.equal(model.results.every((row) => row.officialTotal === null), true, "partial totals never impersonate final totals");

source.tournament.publishedScores.aLazo = {
  ...officialScore({
    id: "a-lazo",
    teamId: "equipo-a",
    teamName: "Charros Demo del Norte",
    suerteId: "lazo",
    total: 10,
    publishedAt: "2026-08-13T14:00:30.000Z"
  }),
  participantScope: undefined,
  teamId: undefined,
  suerteId: undefined,
  team: { id: "equipo-a", name: "Charros Demo del Norte" },
  suerte: { id: "lazo" }
};
const officialTernaProjection = buildPublicProjection(source, {
  tournamentId: "demo-local-fmch-2026",
  nowMs: Date.parse("2026-08-13T14:00:40.000Z")
});
const officialTernaRow = officialTernaProjection.results.items.find((row) => row.teamId === "equipo-a");
assert.equal(officialTernaRow.scores.LC, 10, "the official lazo id projects into the Cabecero column");
assert.equal(officialTernaRow.accumulatedTotal, 48, "the official lazo score contributes to the partial total");

delete source.tournament.publishedScores.aLazo;

source.tournament.publishedScores.aPiales = officialScore({
  id: "a-piales",
  teamId: "equipo-a",
  teamName: "Charros Demo del Norte",
  suerteId: "piales",
  total: 20,
  attemptIndex: 0,
  publishedAt: "2026-08-13T14:01:00.000Z"
});
source.tournament.publishedScores.bPialesZero = officialScore({
  id: "b-piales-zero",
  teamId: "equipo-b",
  teamName: "Rancheros de Ensayo",
  suerteId: "piales",
  total: 0,
  attemptIndex: 0,
  publishedAt: "2026-08-13T14:01:10.000Z",
  result: "ZERO"
});
source.tournament.publishedScores.bColasDq = officialScore({
  id: "b-colas-dq",
  teamId: "equipo-b",
  teamName: "Rancheros de Ensayo",
  suerteId: "colas",
  total: 0,
  attemptIndex: 0,
  publishedAt: "2026-08-13T14:01:20.000Z",
  result: "DQ"
});
projection = buildPublicProjection(source, {
  tournamentId: "demo-local-fmch-2026",
  nowMs: Date.parse("2026-08-13T14:02:00.000Z")
});
assertPartialProjection(projection, { "equipo-a": 58, "equipo-b": 26 });
const bRow = projection.results.items.find((row) => row.teamId === "equipo-b");
assert.equal(bRow.scores.P, 0, "published zero remains present");
assert.equal(bRow.scores.C, 0, "published DQ consumes its official total without reinterpretation");

model = buildPublicPortalModel(structuredClone(projection), { competitionId: "competencia-equipos" });
assert.equal(model.rankedResults[0].displayTotal, 58, "reload preserves the same accumulated total");
assert.equal(model.rankedResults[0].displayPosition, 1, "reload preserves provisional order");
assert.equal(model.live.standings.find((row) => row.name === "Charros Demo del Norte")?.total, 58);

const renderSource = readFileSync(new URL("../js/publicPortal/portalRender.js", import.meta.url), "utf8");
const publicRules = readFileSync(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
assert.match(renderSource, /model\.rankedResults/);
assert.match(renderSource, /row\.displayTotal/);
assert.match(renderSource, /row\.displayPosition/);
assert.match(renderSource, /Acumulado parcial/);
assert.match(renderSource, /hasProvisionalPositions/);
assert.match(renderSource, /Posición provisional/);
assert.doesNotMatch(renderSource, /calculateAttemptTotal|ruleProfile|breakdown\.final/);
for (const field of ["accumulatedTotal", "totalStatus", "provisionalPosition"]) {
  assert.match(publicRules, new RegExp(field), `${field} is accepted by the existing public projection allowlist`);
}

const finalSource = buildSource();
finalSource.tournament.publishedScores.aCala.officialTotal = 38;
finalSource.tournament.publishedScores.aCala.officialPosition = 1;
const finalProjection = buildPublicProjection(finalSource, {
  tournamentId: "demo-local-fmch-2026",
  nowMs: Date.parse("2026-08-13T14:03:00.000Z")
});
const finalRow = finalProjection.results.items.find((row) => row.teamId === "equipo-a");
assert.equal(finalRow.totalStatus, "final");
assert.equal(finalRow.officialTotal, 38);
assert.equal(finalRow.officialPosition, 1);
assert.equal(finalRow.positionStatus, "official");

console.log("public-portal-partial-standings.test.mjs: ok");

function assertPartialProjection(current, expected) {
  for (const [teamId, total] of Object.entries(expected)) {
    const row = current.results.items.find((item) => item.teamId === teamId);
    assert.ok(row);
    assert.equal(row.accumulatedTotal, total);
    assert.equal(row.officialTotal, null);
    assert.equal(row.totalStatus, "partial");
    assert.equal(row.positionStatus, "provisional");
  }
  const ranked = [...current.results.items].sort((left, right) => left.provisionalPosition - right.provisionalPosition);
  assert.deepEqual(ranked.map((row) => row.provisionalPosition), [1, 2]);
}

function buildSource() {
  return {
    tournament: {
      info: { id: "demo-local-fmch-2026", nombre: "Demo FMCH 2026", type: "completo" },
      meta: { updatedAt: "2026-08-13T14:00:00.000Z", activeCharreadaId: "jornada-1" },
      teams: [
        { id: "equipo-a", name: "Charros Demo del Norte", order: 1 },
        { id: "equipo-b", name: "Rancheros de Ensayo", order: 2 }
      ],
      charreadas: [{
        id: "jornada-1",
        name: "Jornada 1",
        competitionId: "competencia-equipos",
        competitionType: "equipos_completo",
        competitionScope: "team",
        teamIds: ["equipo-a", "equipo-b"],
        suerteIds: ["cala", "piales", "colas", "toro", "terna", "yegua", "manganas_pie", "manganas_caballo", "paso"]
      }],
      publishedScores: {
        aCala: officialScore({
          id: "a-cala",
          teamId: "equipo-a",
          teamName: "Charros Demo del Norte",
          suerteId: "cala",
          total: 38,
          publishedAt: "2026-08-13T13:58:00.000Z"
        }),
        bCala: officialScore({
          id: "b-cala",
          teamId: "equipo-b",
          teamName: "Rancheros de Ensayo",
          suerteId: "cala",
          total: 26,
          publishedAt: "2026-08-13T13:59:00.000Z"
        })
      }
    },
    liveCurrent: {
      tournament: { id: "demo-local-fmch-2026" },
      activeCharreadaId: "jornada-1",
      competitionId: "competencia-equipos",
      turn: { team: { id: "equipo-b", name: "Rancheros de Ensayo" }, suerteId: "piales" },
      timestamp: "2026-08-13T14:00:00.000Z"
    }
  };
}

function officialScore(definition) {
  return {
    id: definition.id,
    tournamentId: "demo-local-fmch-2026",
    charreadaId: "jornada-1",
    competitionId: "competencia-equipos",
    competitionType: "equipos_completo",
    participantScope: "team",
    teamId: definition.teamId,
    teamName: definition.teamName,
    suerteId: definition.suerteId,
    attemptIndex: definition.attemptIndex || 0,
    attempt: { total: definition.total, result: definition.result || "VALID" },
    revision: 1,
    published: true,
    publishedAt: definition.publishedAt
  };
}
