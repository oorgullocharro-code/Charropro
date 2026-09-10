import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPortalV2PreviewSnapshot } from "../fixtures/portalV2PreviewFixtures.js?v=20260910-recovery-skip-redundant-pending-reset-001-v1";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260910-recovery-skip-redundant-pending-reset-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260910-recovery-skip-redundant-pending-reset-001-v1";
import { buildPortalV2Url, parsePortalV2Route } from "../js/portalV2/portalV2Router.js?v=20260910-recovery-skip-redundant-pending-reset-001-v1";

test("Portal V2 exposes the approved navigation and keeps Timeline inside En Vivo", () => {
  const model = createPortalV2Model(getPortalV2PreviewSnapshot("live"), { availability: "ready", view: "inicio" });
  assert.deepEqual(model.navigation.map((item) => item.label), ["Inicio", "En vivo", "Programa", "Resultados", "Posiciones", "Sábana"]);
  assert.equal(model.navigation.some((item) => /minuto/i.test(item.label)), false);
  assert.equal(model.view, "inicio");
});

test("public phase and competition metadata filter Program, Results, Standings, and Sheet directly", () => {
  const model = createPortalV2Model(createCanonicalPublicTournamentData(multiContextFixture()), {
    availability: "ready",
    view: "programa",
    competitionId: "equipos-local",
    phaseId: "fase-final"
  });
  assert.equal(model.context.selectedCompetition.name, "Equipos");
  assert.equal(model.context.selectedPhase.name, "Final");
  assert.deepEqual(model.context.program.map((item) => item.name), ["Charreada Final"]);
  assert.deepEqual(model.context.results.map((item) => item.resultId), ["result-final"]);
  assert.deepEqual(model.context.standings.map((item) => item.resultIds), [["result-final"]]);
  assert.deepEqual(model.context.sheet.map((item) => item.charreadaName), ["Charreada Final"]);
  assert.equal(model.context.results[0].total, 120);
  assert.equal(model.context.standings[0].total, 120);
  assert.equal(model.context.sheet[0].rows[0].total, 120);
  assert.equal(model.context.program[0].teamNames.length, 0, "the final fixture has no public roster and does not invent one");
});

test("Program preserves a variable public roster only when names are in V3", () => {
  const model = createPortalV2Model(getPortalV2PreviewSnapshot("live"), { availability: "ready", view: "programa" });
  assert.deepEqual(model.context.program[0].teamNames, ["Rancho Los Laureles", "Hacienda San Miguel", "Charros de Jalisco"]);
  assert.deepEqual(model.context.program[0].participantNames, []);
});

test("phase selector remains absent when V3 does not publish a safe phase label", () => {
  const snapshot = structuredClone(getPortalV2PreviewSnapshot("live"));
  for (const item of snapshot.program.items) delete item.phaseName;
  for (const item of snapshot.results.teams) delete item.phaseName;
  for (const item of snapshot.standings.items) delete item.phaseName;
  for (const item of snapshot.sheet.competitions) delete item.phaseName;
  const model = createPortalV2Model(createCanonicalPublicTournamentData(snapshot), { availability: "ready", phaseId: "fase-unica" });
  assert.equal(model.context.phases.length, 0);
  assert.equal(model.context.hasInvalidSelection, true);
  assert.equal(model.context.selectedPhaseId, "");
});

test("phase and competition deep links preserve local runtime parameters without changing authority", () => {
  const url = buildPortalV2Url(
    "/portal-v2.html?tournamentId=portal-v2-local-preview&charroproEnv=local&portalV2Fixture=live",
    { view: "programa", competitionId: "equipos-local", phaseId: "fase-final" }
  );
  assert.equal(url, "/portal-v2.html?tournamentId=portal-v2-local-preview&charroproEnv=local&portalV2Fixture=live&view=programa&competition=equipos-local&phase=fase-final");
  assert.deepEqual(parsePortalV2Route(url), {
    tournamentId: "portal-v2-local-preview", view: "programa", competitionId: "equipos-local", phaseId: "fase-final"
  });
});

test("Program and context presentation read V3 only and do not create sporting authority", async () => {
  const [context, render, router] = await Promise.all([
    readFile(new URL("../js/portalV2/portalV2ContextModel.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Render.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Router.js", import.meta.url), "utf8")
  ]);
  const source = `${context}\n${render}\n${router}`.toLowerCase();
  for (const forbidden of ["publishedscores", "officialscoreledger", "attemptv2", "buildofficialranking", "reconcilepublicprojection", "firebase", "reduce("]) {
    assert.equal(source.includes(forbidden), false, `Portal context avoids ${forbidden}`);
  }
  assert.match(render, /Minuto a minuto/);
  assert.match(render, /portalV2Phase/);
  assert.match(render, /portalV2Competition/);
});

function multiContextFixture() {
  const snapshot = structuredClone(getPortalV2PreviewSnapshot("live"));
  snapshot.program.items.push({
    id: "charreada-final", charreadaId: "charreada-final", competitionId: "equipos-local", competitionName: "Equipos",
    phase: "fase-final", phaseName: "Final", name: "Charreada Final", scheduledDate: "2026-09-10", scheduledTime: "17:00", status: "Programada", order: 2
  });
  snapshot.results.teams.push({
    resultId: "result-final", teamId: "team-final", teamName: "Hacienda Finalista", charreadaId: "charreada-final", charreadaName: "Charreada Final",
    competitionId: "equipos-local", competitionName: "Equipos", phase: "fase-final", phaseName: "Final",
    columns: { cala: 120 }, penalties: 0, subtotal: 120, total: 120, status: "OFFICIAL", position: 1
  });
  snapshot.standings.items.push({
    rankingId: "standing-final", resultId: "result-final", position: 1, scopeType: "charreada", teamId: "team-final", teamName: "Hacienda Finalista",
    charreadaId: "charreada-final", competitionId: "equipos-local", competitionName: "Equipos", phase: "fase-final", phaseName: "Final",
    total: 120, classification: "provisional", status: "OFFICIAL", tieBreakLabel: ""
  });
  snapshot.sheet.competitions.push({
    competitionId: "equipos-local", name: "Equipos", charreadaId: "charreada-final", charreadaName: "Charreada Final", phase: "fase-final", phaseName: "Final",
    rows: [{ resultId: "result-final", teamId: "team-final", teamName: "Hacienda Finalista", columns: { cala: 120 }, total: 120 }]
  });
  return snapshot;
}

console.log("portal-v2-navigation-program-phases-context.test.mjs: ok");
