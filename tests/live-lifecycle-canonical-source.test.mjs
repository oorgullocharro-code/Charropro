import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveCanonicalTournamentLifecycle } from "../js/core/canonicalTournamentLifecycle.js?v=20260911-coleadero-excel-federation-colas-layout-001-v1";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260911-coleadero-excel-federation-colas-layout-001-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260911-coleadero-excel-federation-colas-layout-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260911-coleadero-excel-federation-colas-layout-001-v1";

const tournamentId = "lifecycle-fixture";
const nowMs = Date.parse("2026-09-09T20:00:00.000Z");

function source({ tournamentStatus = "preparacion", charreadaStatus = "programada", liveCurrent = {}, scores = [] } = {}) {
  return {
    tournament: {
      info: { id: tournamentId, nombre: "Lifecycle fixture", status: tournamentStatus, type: "equipos_completo" },
      charreadas: [
        { id: "charreada-1", name: "Charreada 1", competitionId: "equipos_completo", status: charreadaStatus, teamIds: ["team-1"] },
        { id: "charreada-2", name: "Charreada 2", competitionId: "equipos_completo", status: "programada", teamIds: ["team-1"] }
      ],
      teams: [{ id: "team-1", name: "Rancho Local" }],
      publishedScores: scores
    },
    liveCurrent
  };
}

function projection(input) {
  return buildBrowserProjection(input, { tournamentId, nowMs });
}

test("new tournament without an active charreada remains PRE_EVENT", () => {
  const input = source();
  assert.equal(resolveCanonicalTournamentLifecycle(input).status, "PRE_EVENT");
  assert.equal(projection(input).lifecycle.status, "PRE_EVENT");
});

for (const [name, scores] of [["no score", []], ["zero score", score(0)], ["positive score", score(26)]]) {
  test(`verified active charreada is LIVE with ${name}`, () => {
    const input = source({ liveCurrent: { activeCharreadaId: "charreada-1" }, scores });
    const result = projection(input);
    assert.equal(resolveCanonicalTournamentLifecycle(input).status, "LIVE");
    assert.equal(result.lifecycle.status, "LIVE");
    assert.equal(result.live.status, "LIVE");
  });
}

test("results alone never promote lifecycle to LIVE", () => {
  const input = source({ scores: [score(26)] });
  assert.equal(resolveCanonicalTournamentLifecycle(input).status, "PRE_EVENT");
  assert.equal(projection(input).lifecycle.status, "PRE_EVENT");
});

test("unknown live identity never fabricates LIVE", () => {
  const input = source({ liveCurrent: { activeCharreadaId: "not-in-program" }, scores: [score(26)] });
  assert.equal(resolveCanonicalTournamentLifecycle(input).status, "PRE_EVENT");
});

test("explicit lifecycle statuses have terminal and pause precedence", () => {
  assert.equal(resolveCanonicalTournamentLifecycle(source({ tournamentStatus: "pausado", liveCurrent: { activeCharreadaId: "charreada-1" } })).status, "PAUSED");
  assert.equal(resolveCanonicalTournamentLifecycle(source({ tournamentStatus: "finalizado", liveCurrent: { activeCharreadaId: "charreada-1", lifecycleStatus: "LIVE" } })).status, "FINALIZED");
  assert.equal(resolveCanonicalTournamentLifecycle(source({ tournamentStatus: "archivado", liveCurrent: { activeCharreadaId: "charreada-1", lifecycleStatus: "LIVE" } })).status, "ARCHIVED");
  assert.equal(resolveCanonicalTournamentLifecycle(source({ liveCurrent: { lifecycleStatus: "PAUSED" } })).status, "PAUSED");
  assert.equal(resolveCanonicalTournamentLifecycle(source({ liveCurrent: { lifecycleStatus: "LIVE", activeCharreadaId: "charreada-1" } })).status, "LIVE");
});

test("one completed charreada does not finalize a multi-charreada tournament", () => {
  const input = source({ charreadaStatus: "finalizado" });
  assert.equal(resolveCanonicalTournamentLifecycle(input).status, "PRE_EVENT");
});

test("program active status and reload reconstruction remain canonical", () => {
  const input = source({ charreadaStatus: "en_vivo" });
  const first = resolveCanonicalTournamentLifecycle(structuredClone(input));
  const recovered = resolveCanonicalTournamentLifecycle(JSON.parse(JSON.stringify(input)));
  assert.deepEqual(recovered, first);
  assert.equal(first.status, "LIVE");
});

test("Public V3 Browser and Function transports use the same lifecycle authority", () => {
  const input = source({ liveCurrent: { activeCharreadaId: "charreada-1" }, scores: [score(0)] });
  const browser = buildBrowserProjection(input, { tournamentId, nowMs });
  const functions = buildFunctionProjection(input, { tournamentId, nowMs });
  assert.equal(browser.lifecycle.status, "LIVE");
  assert.deepEqual(functions.lifecycle, browser.lifecycle);
  assert.deepEqual(functions.live, browser.live);
});

test("Portal V2 presents the supplied V3 lifecycle without inference", () => {
  const snapshot = projection(source({ liveCurrent: { activeCharreadaId: "charreada-1" } }));
  const model = createPortalV2Model(snapshot, { availability: "ready", view: "en-vivo" });
  assert.equal(model.lifecycle.status, "LIVE");
  assert.equal(model.lifecycle.label, "En vivo");
});

test("live publisher persists the canonical lifecycle status before V3 reads it", async () => {
  const [sync, firebaseSync] = await Promise.all([
    readFile(new URL("../js/core/sync.js", import.meta.url), "utf8"),
    readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8")
  ]);
  assert.match(sync, /lifecycleStatus\s*=\s*resolveCanonicalTournamentLifecycle/);
  assert.match(firebaseSync, /lifecycleStatus:\s*publicReadString\(payload\.lifecycleStatus\)/);
});

function score(total) {
  return [{
    id: `score-${total}`,
    revision: 1,
    tournamentId,
    charreadaId: "charreada-1",
    competitionId: "equipos_completo",
    participantScope: "team",
    teamId: "team-1",
    teamName: "Rancho Local",
    suerteId: "cala",
    attempt: { total },
    total,
    published: true,
    publishedAt: "2026-09-09T20:00:00.000Z"
  }];
}
