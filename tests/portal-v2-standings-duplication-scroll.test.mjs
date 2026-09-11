import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";

test("Portal V2 presents one competition ranking per team without collapsing distinct scopes upstream", () => {
  const model = createPortalV2Model(fixture(), { availability: "ready", view: "posiciones" });

  assert.equal(model.publicData.standings.length, 6, "V3 transports all three canonical ranking scopes");
  assert.equal(model.context.standings.length, 2, "the default presentation selects the competition scope");
  assert.deepEqual(model.context.standings.map((row) => [row.position, row.teamName, row.total]), [
    [1, "michoacan", 21],
    [2, "la casa", 20]
  ]);
  assert.equal(model.context.standingGroups.length, 1);
  assert.deepEqual(model.context.standingGroups[0].podium.map((row) => row.teamName), ["michoacan", "la casa"]);
  assert.deepEqual(model.context.standingGroups[0].items.map((row) => row.teamId), ["team-michoacan", "team-la-casa"]);
});

test("Portal V2 selects the phase scope only for an explicit phase filter and preserves other contexts", () => {
  const snapshot = fixture();
  snapshot.standings.items.push(...[
    standing("phase-michoacan", "phase", "team-michoacan", "michoacan", 17, 1, { phase: "final", phaseName: "Final" }),
    standing("phase-la-casa", "phase", "team-la-casa", "la casa", 16, 2, { phase: "final", phaseName: "Final" }),
    standing("charreada-michoacan", "charreada", "team-michoacan", "michoacan", 17, 1, { phase: "final", phaseName: "Final", charreadaId: "charreada-final" }),
    standing("charreada-la-casa", "charreada", "team-la-casa", "la casa", 16, 2, { phase: "final", phaseName: "Final", charreadaId: "charreada-final" })
  ]);
  snapshot.results.teams.push(...[
    result("result-final-michoacan", "team-michoacan", "michoacan", 17, "final", "Final", "charreada-final"),
    result("result-final-la-casa", "team-la-casa", "la casa", 16, "final", "Final", "charreada-final")
  ]);
  snapshot.sheet.competitions.push({
    competitionId: "equipos", name: "Equipos", charreadaId: "charreada-final", phase: "final", phaseName: "Final",
    rows: [
      { resultId: "result-final-michoacan", teamId: "team-michoacan", teamName: "michoacan", columns: { cala: 17 }, total: 17 },
      { resultId: "result-final-la-casa", teamId: "team-la-casa", teamName: "la casa", columns: { cala: 16 }, total: 16 }
    ]
  });

  const model = createPortalV2Model(createCanonicalPublicTournamentData(snapshot), {
    availability: "ready", view: "posiciones", competitionId: "equipos", phaseId: "final"
  });
  assert.deepEqual(model.context.standings.map((row) => [row.scopeType, row.teamName, row.total]), [
    ["phase", "michoacan", 17],
    ["phase", "la casa", 16]
  ]);
  assert.equal(model.context.standings.some((row) => row.scopeType === "charreada"), false);
});

test("Portal V2 owns a naturally scrollable document canvas at desktop and mobile widths", async () => {
  const css = await readFile(new URL("../css/portal-v2.css", import.meta.url), "utf8");
  assert.match(css, /\.portal-v2-body\s*\{[\s\S]*?min-block-size:\s*100dvh;[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/);
  assert.match(css, /#portal-v2-root\s*\{\s*min-block-size:\s*100dvh;\s*\}/);
  const portalCanvasRules = css.match(/(?:\.portal-v2-body|\.portal-v2-shell|\.portal-v2-main)\s*\{[^}]*\}/g) || [];
  assert.equal(
    portalCanvasRules.some((rule) => /(?:^|[;{]\s*)(?:height|max-height)\s*:/m.test(rule)),
    false,
  );
  assert.match(css, /\.portal-v2-table-scroll\s*\{[^}]*overflow-x:\s*auto;/);
});

function fixture() {
  return createCanonicalPublicTournamentData({
    tournamentId: "portal-v2-standings-fixture",
    sourceRevision: 1,
    projectionRevision: 1,
    generatedAt: "2026-09-10T12:00:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: "portal-v2-standings-fixture", name: "Fixture Posiciones" },
    modules: [{ type: "standings", enabled: true, order: 10 }],
    branding: {}, live: { status: "LIVE" }, program: { items: [] }, timeline: { items: [] }, statistics: { status: "READY", items: [] },
    results: { teams: [
      result("result-michoacan", "team-michoacan", "michoacan", 21),
      result("result-la-casa", "team-la-casa", "la casa", 20)
    ] },
    standings: { items: [
      standing("competition-michoacan", "competition", "team-michoacan", "michoacan", 21, 1),
      standing("competition-la-casa", "competition", "team-la-casa", "la casa", 20, 2),
      standing("phase-michoacan-default", "phase", "team-michoacan", "michoacan", 21, 1, { phaseName: "Fase 1" }),
      standing("phase-la-casa-default", "phase", "team-la-casa", "la casa", 20, 2, { phaseName: "Fase 1" }),
      standing("charreada-michoacan-default", "charreada", "team-michoacan", "michoacan", 21, 1, { phaseName: "Fase 1", charreadaId: "charreada-1" }),
      standing("charreada-la-casa-default", "charreada", "team-la-casa", "la casa", 20, 2, { phaseName: "Fase 1", charreadaId: "charreada-1" })
    ] },
    sheet: { competitions: [{
      competitionId: "equipos", name: "Equipos", charreadaId: "charreada-1", phase: "", phaseName: "Fase 1",
      rows: [
        { resultId: "result-michoacan", teamId: "team-michoacan", teamName: "michoacan", columns: { cala: 21 }, total: 21 },
        { resultId: "result-la-casa", teamId: "team-la-casa", teamName: "la casa", columns: { cala: 20 }, total: 20 }
      ]
    }] }
  });
}

function result(resultId, teamId, teamName, total, phase = "", phaseName = "", charreadaId = "charreada-1") {
  return { resultId, teamId, teamName, charreadaId, competitionId: "equipos", phase, phaseName, columns: { cala: total }, penalties: 0, subtotal: total, total, status: "OFFICIAL" };
}

function standing(rankingId, scopeType, teamId, teamName, total, position, context = {}) {
  const resultId = context.phase === "final" ? `result-final-${teamName.replaceAll(" ", "-")}` : `result-${teamName.replaceAll(" ", "-")}`;
  return {
    rankingId, resultId, resultIds: [resultId], position, scopeType, teamId, teamName, total,
    competitionId: "equipos", charreadaId: context.charreadaId || "", phase: context.phase || "", phaseName: context.phaseName || "",
    classification: "partial", status: "provisional", tieBreakLabel: ""
  };
}
