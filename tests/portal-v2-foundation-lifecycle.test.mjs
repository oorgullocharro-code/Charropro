import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { applyPortalV2Snapshot } from "../js/portalV2/portalV2ProjectionState.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { createPortalV2Model, isCanonicalPublicV3 } from "../js/portalV2/portalV2Model.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { buildPortalV2Url, parsePortalV2Route } from "../js/portalV2/portalV2Router.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { createPublicPortalClientState, evaluatePublicPortalStale } from "../js/public/publicPortalClient.js?v=20260909-public-timeline-canonical-event-producer-001-v1";

function fixture(overrides = {}) {
  return createCanonicalPublicTournamentData({
    tournamentId: "portal-v2-fixture",
    sourceRevision: 5,
    projectionRevision: 2,
    generatedAt: "2026-09-09T18:00:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: "portal-v2-fixture", name: "Charreada de prueba", edition: "2026", venue: "Lienzo de prueba", city: "Tequila" },
    branding: { primaryColor: "#17324d", secondaryColor: "#f0e6d2", accentColor: "#b5252a", backgroundColor: "#f6f7f5", textColor: "#17212b" },
    modules: [
      { type: "results", enabled: true, order: 30 },
      { type: "live", enabled: true, order: 10 },
      { type: "standings", enabled: true, order: 20 },
      { type: "program", enabled: false, order: 0 },
      { type: "sponsors", enabled: true, order: 40 }
    ],
    sponsors: [{ id: "sponsor-1", name: "Patrocinador", placement: "hero", tier: "principal", order: 1 }],
    live: { status: "LIVE", currentTeam: "Rancho Los Laureles", currentSuerte: "Piales", currentScore: 21, updatedAt: "2026-09-09T18:00:00.000Z" },
    results: { teams: [{ resultId: "result-1", teamId: "team-1", teamName: "Rancho Los Laureles", charreadaId: "charreada-1", competitionId: "equipos", columns: { PR: 21 }, penalties: 0, subtotal: 193, total: 193, status: "PARTIAL" }] },
    standings: { items: [{ rankingId: "standing-1", resultId: "result-1", position: 1, teamId: "team-1", teamName: "Rancho Los Laureles", total: 193, status: "PARTIAL" }] },
    sheet: { competitions: [{ competitionId: "equipos", rows: [{ resultId: "result-1", teamId: "team-1", teamName: "Rancho Los Laureles", columns: { PR: 21 }, total: 193 }] }] },
    ...overrides
  });
}

test("Portal V2 consumes resolved V3 lifecycle and values without scoring calculation", () => {
  const model = createPortalV2Model(fixture(), { availability: "ready", view: "posiciones", connection: "online" });
  assert.equal(model.lifecycle.status, "LIVE");
  assert.equal(model.primaryResult.pr, 21);
  assert.equal(model.primaryResult.total, 193);
  assert.equal(model.leader.position, 1);
  assert.deepEqual(model.navigation.map((item) => item.view), ["inicio", "en-vivo", "resultados", "posiciones"]);
  assert.equal(model.sponsors.length, 1);
});

test("Portal V2 renders the five canonical lifecycle states", () => {
  for (const status of ["PRE_EVENT", "LIVE", "PAUSED", "FINALIZED", "ARCHIVED"]) {
    const model = createPortalV2Model(fixture({ lifecycle: { status } }), { availability: "ready" });
    assert.equal(model.lifecycle.status, status);
    assert.ok(model.lifecycle.label);
  }
});

test("Portal V2 uses neutral branding fallbacks and accepts only safe asset URLs", () => {
  const fallback = createPortalV2Model(fixture({ branding: {} }), { availability: "ready" });
  assert.equal(fallback.branding.heroImageUrl, "");
  assert.equal(fallback.branding.logoUrl, "");
  const branded = createPortalV2Model(fixture({ branding: { heroImageUrl: "https://example.test/hero.jpg", primaryColor: "#102030" } }), { availability: "ready" });
  assert.equal(branded.branding.heroImageUrl, "https://example.test/hero.jpg");
  assert.equal(branded.branding.primaryColor, "#102030");
});

test("Portal V2 accepts only V3 and keeps public-client revision guards", () => {
  const current = fixture();
  const initial = applyPortalV2Snapshot(createPublicPortalClientState(), current, { nowMs: 100 });
  assert.equal(initial.accepted, true);
  const duplicate = applyPortalV2Snapshot(initial.state, current, { nowMs: 200 });
  assert.equal(duplicate.duplicate, true);
  const older = fixture({ projectionRevision: 1 });
  const regression = applyPortalV2Snapshot(initial.state, older, { nowMs: 300 });
  assert.equal(regression.reason, "projection-revision-regression");
  const inconsistent = fixture({ tournament: { id: "portal-v2-fixture", name: "Nombre no compatible" } });
  const conflict = applyPortalV2Snapshot(initial.state, inconsistent, { nowMs: 400 });
  assert.equal(conflict.reason, "projection-revision-inconsistent");
  const legacy = { schemaVersion: 2, projectionRevision: 3 };
  assert.equal(isCanonicalPublicV3(legacy), false);
  assert.equal(applyPortalV2Snapshot(initial.state, legacy).reason, "portal-v2-schema-required");
});

test("Portal V2 keeps the last V3 snapshot visible while it becomes stale", () => {
  const generatedAtMs = Date.parse("2026-09-09T18:00:00.000Z");
  const accepted = applyPortalV2Snapshot(createPublicPortalClientState({ staleThresholdMs: 20 }), fixture(), { nowMs: generatedAtMs });
  const stale = evaluatePublicPortalStale(accepted.state, { nowMs: generatedAtMs + 21 });
  assert.equal(stale.connection, "stale");
  assert.equal(stale.snapshot.results.teams[0].total, 193);
});

test("Portal V2 routing preserves the public tournamentId and local runtime query", () => {
  const route = parsePortalV2Route("https://example.test/portal-v2.html?canal=torneo-1&charroproEnv=local");
  assert.equal(route.tournamentId, "torneo-1");
  const url = buildPortalV2Url("https://example.test/portal-v2.html?tournamentId=torneo-1&charroproEnv=local", { view: "resultados" });
  assert.equal(url, "/portal-v2.html?tournamentId=torneo-1&charroproEnv=local&view=resultados");
});

test("Portal V2 remains isolated from legacy/raw scoring paths and has a safe entrypoint", async () => {
  const [app, projectionState, model, render, html, css] = await Promise.all([
    readFile(new URL("../js/portalV2/portalV2App.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2ProjectionState.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Model.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Render.js", import.meta.url), "utf8"),
    readFile(new URL("../portal-v2.html", import.meta.url), "utf8"),
    readFile(new URL("../css/portal-v2.css", import.meta.url), "utf8")
  ]);
  const source = `${app}\n${model}\n${render}`.toLowerCase();
  for (const forbidden of ["publishedscores", "officialscoreledger", "attemptv2", "firebase.database().ref", "reduce(", "officialscoreledger"]) {
    assert.equal(source.includes(forbidden), false, `V2 avoids ${forbidden}`);
  }
  assert.match(app, /subscribePublicTournamentSnapshot/);
  assert.match(projectionState, /applyPublicPortalSnapshot/);
  assert.match(html, /data-charropro-entry="\.\/js\/views\/portal-v2\.js"/);
  assert.match(css, /@media \(max-width: 780px\)/);
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(css, /linear-gradient|radial-gradient/);
});

console.log("portal-v2-foundation-lifecycle.test.mjs: ok");
