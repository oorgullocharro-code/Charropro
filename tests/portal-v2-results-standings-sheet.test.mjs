import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPortalV2PreviewSnapshot } from "../fixtures/portalV2PreviewFixtures.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { buildPortalV2Url } from "../js/portalV2/portalV2Router.js?v=20260909-public-timeline-canonical-event-producer-001-v1";

test("results, standings, and sheet present the same resolved PR 21 / total 193", () => {
  const model = portalModel("live", "resultados");
  const result = model.publicData.results.find((item) => item.teamName === "Rancho Los Laureles");
  const standing = model.publicData.standings.find((item) => item.teamName === "Rancho Los Laureles");
  const sheet = model.publicData.sheet[0].rows.find((item) => item.teamName === "Rancho Los Laureles");
  assert.equal(result.columns.find((column) => column.key === "pial_ruedo").value, 21);
  assert.equal(result.total, 193);
  assert.equal(standing.total, 193);
  assert.equal(sheet.total, 193);
  assert.equal(model.publicData.consistency.valid, true);
});

test("official zero remains visible while an unscored column remains absent", () => {
  const model = portalModel("live", "resultados");
  const jalisco = model.publicData.results.find((item) => item.teamName === "Charros de Jalisco");
  assert.equal(jalisco.columns.find((column) => column.key === "cala").value, 0);
  assert.equal(jalisco.columns.some((column) => column.key === "piales"), false);
  assert.equal(jalisco.status.label, "Oficial");
});

test("standings preserve the supplied position rather than deriving it from total", () => {
  const snapshot = getPortalV2PreviewSnapshot("live");
  const altered = structuredClone(snapshot);
  altered.results.teams[0].total = 10;
  altered.results.teams[0].subtotal = 10;
  altered.results.teams[0].columns = { cala: 10 };
  altered.standings.items[0].total = 10;
  altered.sheet.competitions[0].rows[0].total = 10;
  altered.sheet.competitions[0].rows[0].columns = { cala: 10 };
  const canonical = createCanonicalPublicTournamentData(altered);
  const model = createPortalV2Model(canonical, { availability: "ready", view: "posiciones" });
  assert.equal(model.publicData.standings[0].position, 1);
  assert.equal(model.publicData.standings[0].total, 10);
});

test("multiple competitions remain separate public groups", () => {
  const snapshot = structuredClone(getPortalV2PreviewSnapshot("live"));
  const result = {
    resultId: "result-final", teamId: "team-laureles", teamName: "Rancho Los Laureles", charreadaId: "charreada-final", competitionId: "equipos-final", phase: "Final",
    columns: { cala: 20 }, penalties: 0, subtotal: 20, total: 20, status: "FINAL"
  };
  snapshot.results.teams.push(result);
  snapshot.standings.items.push({ rankingId: "standing-final", resultId: "result-final", position: 1, teamId: "team-laureles", teamName: "Rancho Los Laureles", total: 20, classification: "final", status: "FINAL", phase: "Final", competitionId: "equipos-final" });
  snapshot.sheet.competitions.push({ competitionId: "equipos-final", name: "Final", rows: [{ resultId: "result-final", teamId: "team-laureles", teamName: "Rancho Los Laureles", columns: { cala: 20 }, total: 20 }] });
  const model = createPortalV2Model(createCanonicalPublicTournamentData(snapshot), { availability: "ready", view: "resultados" });
  assert.equal(model.publicData.resultGroups.length, 2);
  assert.equal(model.publicData.standingGroups.length, 2);
  assert.equal(model.publicData.sheet.length, 2);
});

test("PRE_EVENT is empty, PAUSED preserves data, FINALIZED and ARCHIVED expose only supplied champion", () => {
  const preEvent = portalModel("pre-event", "resultados");
  assert.equal(preEvent.publicData.resultState, "no-results-yet");
  const paused = portalModel("paused", "resultados");
  assert.equal(paused.publicData.results.length, 3);
  const finalized = portalModel("finalized", "posiciones");
  assert.equal(finalized.publicData.champion.teamName, "Rancho Los Laureles");
  const archived = portalModel("archived", "sabana");
  assert.equal(archived.publicData.champion.position, 1);
});

test("disabled public modules remain hidden and the local preview survives view navigation", () => {
  const snapshot = structuredClone(getPortalV2PreviewSnapshot("live"));
  snapshot.modules = snapshot.modules.map((module) => module.type === "sheet" ? { ...module, enabled: false } : module);
  const model = createPortalV2Model(createCanonicalPublicTournamentData(snapshot), { availability: "ready", view: "sabana" });
  assert.equal(model.navigation.some((item) => item.view === "sabana"), false);
  assert.notEqual(model.view, "sabana");
  assert.equal(
    buildPortalV2Url("/portal-v2.html?tournamentId=portal-v2-local-preview&charroproEnv=local&portalV2Fixture=live", { view: "posiciones" }),
    "/portal-v2.html?tournamentId=portal-v2-local-preview&charroproEnv=local&portalV2Fixture=live&view=posiciones"
  );
});

test("inconsistent canonical data fails closed before it can render a false parity", () => {
  const inconsistent = structuredClone(getPortalV2PreviewSnapshot("live"));
  inconsistent.sheet.competitions[0].rows[0].total = 999;
  const model = createPortalV2Model(inconsistent, { availability: "ready", view: "sabana" });
  assert.equal(model.availability, "unsupported");
  assert.equal(model.publicData.results.length, 0);
});

test("preview fixture and V2 presentation do not expose raw sporting or calculate scores", async () => {
  const [modelSource, renderSource, appSource, fixtureSource, css] = await Promise.all([
    readFile(new URL("../js/portalV2/portalV2ResultsModel.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Render.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2App.js", import.meta.url), "utf8"),
    readFile(new URL("../fixtures/portalV2PreviewFixtures.js", import.meta.url), "utf8"),
    readFile(new URL("../css/portal-v2.css", import.meta.url), "utf8")
  ]);
  const source = `${modelSource}\n${renderSource}\n${appSource}\n${fixtureSource}`.toLowerCase();
  for (const forbidden of ["publishedscores", "officialscoreledger", "attemptv2", "reduce(", "buildofficialranking", "reconcilepublicprojection"]) {
    assert.equal(source.includes(forbidden), false, `V2 results avoids ${forbidden}`);
  }
  assert.match(modelSource, /left\.position - right\.position/);
  assert.match(appSource, /charroproEnv/);
  assert.match(appSource, /portalV2Fixture/);
  assert.match(css, /overflow-x: auto/);
  assert.match(renderSource, /scope = "col"/);
});

function portalModel(name, view) {
  return createPortalV2Model(getPortalV2PreviewSnapshot(name), { availability: "ready", view, connection: "online" });
}

console.log("portal-v2-results-standings-sheet.test.mjs: ok");
