import assert from "node:assert/strict";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260912-portal-v2-home-visual-composition-002-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260912-portal-v2-home-visual-composition-002-v1";

const tournamentId = "public-v3-function-parity";
const nowMs = Date.parse("2026-09-09T12:00:00.000Z");
const source = {
  tournament: {
    info: { id: tournamentId, nombre: "Paridad Publica V3", status: "en_vivo", type: "equipos_completo" },
    teams: [
      { id: "team-a", name: "Equipo A" },
      { id: "team-b", name: "Equipo B" }
    ],
    charreadas: [{
      id: "charreada-a",
      competitionId: "equipos_completo",
      competitionName: "Equipos Completo",
      name: "Charreada A",
      status: "en_vivo",
      teamIds: ["team-a", "team-b"]
    }],
    publishedScores: {
      a: officialScore("score-a", "team-a", "Equipo A", 21),
      b: officialScore("score-b", "team-b", "Equipo B", 17)
    }
  },
  liveCurrent: { activeCharreadaId: "charreada-a", status: "LIVE" },
  publicTimeline: [{
    eventId: "timeline-score-a",
    sequence: 1767960000000,
    occurredAt: "2026-09-09T12:00:00.000Z",
    publishedAt: "2026-09-09T12:00:00.000Z",
    type: "SCORE",
    status: "OFFICIAL",
    charreadaId: "charreada-a",
    charreadaName: "Charreada A",
    competitionId: "equipos_completo",
    competitionName: "Equipos Completo",
    phaseId: "fase-unica",
    phaseName: "Ronda única",
    teamId: "team-a",
    teamName: "Equipo A",
    suerteId: "cala",
    suerteName: "Cala",
    label: "Cala · Equipo A",
    score: 21,
    authUid: "must-not-leave-the-source",
    idempotencyKey: "must-not-leave-the-source"
  }]
};

const browser = buildBrowserProjection(source, { tournamentId, nowMs });
const functionProjection = buildFunctionProjection(source, { tournamentId, nowMs });

for (const key of ["schemaVersion", "projectionVersion", "tournamentId", "sourceRevision", "lifecycle", "program", "live", "results", "standings", "sheet", "timeline", "statistics"]) {
  assert.deepEqual(functionProjection[key], browser[key], `shared Function projection matches browser V3 ${key}`);
}
assert.equal(functionProjection.contentHash, browser.contentHash, "shared Function and browser V3 outputs have one canonical content hash");
assert.equal(functionProjection.results.teams[0].columns.cala, 21);
assert.equal(functionProjection.standings.items[0].position, 1);
assert.equal(browser.timeline.items[0].teamName, "Equipo A");
assert.equal(JSON.stringify(browser.timeline.items).includes("must-not-leave-the-source"), false);

console.log("public-projection-v3-function-parity.test.mjs: ok");

function officialScore(id, teamId, teamName, total) {
  return {
    id,
    revision: 1,
    tournamentId,
    charreadaId: "charreada-a",
    competitionId: "equipos_completo",
    participantScope: "team",
    teamId,
    teamName,
    suerteId: "cala",
    attempt: { total },
    total,
    published: true,
    publishedAt: "2026-09-09T12:00:00.000Z"
  };
}
