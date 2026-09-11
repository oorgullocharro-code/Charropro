import assert from "node:assert/strict";
import test from "node:test";
import {
  CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION,
  CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION,
  buildCanonicalPublicTournamentDataHash,
  createCanonicalPublicTournamentData,
  normalizeCanonicalPublicTournamentData,
  validateCanonicalPublicTournamentData
} from "../js/public/canonicalPublicTournamentData.js?v=20260911-coleadero-xlsx-microsoft-excel-compatibility-fix-001-v1";

const tournamentId = "test-reconciliation-fixture";
const resultId = "result-casa-1";

function fixture(overrides = {}) {
  return {
    tournamentId,
    sourceRevision: 7,
    projectionRevision: 1,
    generatedAt: "2026-09-08T18:00:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: tournamentId, slug: "prueba-estatal", name: "Prueba estatal", season: "2026", status: "live" },
    branding: { theme: "charro", primaryColor: "#102030", secondaryColor: "#e0c040", accentColor: "#cb1f2d", backgroundColor: "#ffffff", textColor: "#101010" },
    modules: [{ type: "hero", enabled: true, order: 10 }, { type: "results", enabled: true, order: 20 }],
    sponsors: [{ id: "sponsor-1", name: "Patrocinador", logoUrl: "https://example.test/logo.png", url: "https://example.test", tier: "principal", order: 1, placement: "hero" }],
    program: { items: [{ id: "charreada-fixture", charreadaId: "charreada-fixture", competitionId: "equipos_completo", name: "Charreada 1", scheduledDate: "2026-09-08", scheduledTime: "12:00", status: "LIVE", order: 1, teamIds: ["casa-1"] }] },
    live: { status: "LIVE", currentCharreada: "charreada-fixture", currentTeam: "casa-1", currentSuerte: "pial_ruedo", currentScore: 21, updatedAt: "2026-09-08T18:00:00.000Z" },
    results: { teams: [{ resultId, teamId: "casa-1", teamName: "Casa 1", charreadaId: "charreada-fixture", competitionId: "equipos_completo", phase: "Ronda única", columns: { cala: 31, piales: 38, colas: 68, toro: 20, ternaLazo: 15, ternaPialRuedo: 21 }, penalties: 0, subtotal: 193, total: 193, status: "PARTIAL", position: 1 }] },
    standings: { items: [{ rankingId: "standing-casa-1", resultId, position: 1, teamId: "casa-1", teamName: "Casa 1", total: 193, classification: "provisional", status: "PARTIAL", phase: "Ronda única", tieBreakLabel: "" }] },
    sheet: { competitions: [{ competitionId: "equipos_completo", name: "Equipos", rows: [{ resultId, teamId: "casa-1", teamName: "Casa 1", columns: { cala: 31, piales: 38, colas: 68, toro: 20, ternaLazo: 15, ternaPialRuedo: 21 }, total: 193 }] }] },
    timeline: { items: [{ eventId: "score-corrected-1", sequence: 10, occurredAt: "2026-09-08T17:59:00.000Z", type: "SCORE_CORRECTED", charreadaId: "charreada-fixture", teamId: "casa-1", suerteId: "pial_ruedo", label: "Calificación oficial actualizada", score: 21, previousScore: 15, status: "OFFICIAL" }] },
    statistics: { status: "UNAVAILABLE", items: [] },
    ...overrides
  };
}

test("contract materializes only already-resolved PR 21 / total 193 data", () => {
  const snapshot = createCanonicalPublicTournamentData(fixture({
    publishedScores: [{ total: 63 }],
    officialScoreLedger: { private: true },
    attemptV2: { private: true }
  }));
  assert.equal(snapshot.schemaVersion, CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION);
  assert.equal(snapshot.projectionVersion, CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION);
  assert.equal(snapshot.results.teams[0].columns.ternaPialRuedo, 21);
  assert.equal(snapshot.results.teams[0].total, 193);
  assert.equal(snapshot.standings.items[0].total, 193);
  assert.equal(snapshot.sheet.competitions[0].rows[0].total, 193);
  assert.equal("publishedScores" in snapshot, false);
  assert.equal(JSON.stringify(snapshot).includes("officialScoreLedger"), false);
  assert.equal(JSON.stringify(snapshot).includes("attemptV2"), false);
});

test("legacy duplicate heads are already collapsed before entering the public contract", () => {
  const snapshot = createCanonicalPublicTournamentData(fixture());
  assert.equal(snapshot.results.teams[0].columns.ternaPialRuedo, 21);
  assert.equal(snapshot.results.teams[0].total, 193);
  assert.notEqual(snapshot.results.teams[0].columns.ternaPialRuedo, 63);
});

test("sheet, resolved result, and standing cannot diverge", () => {
  const normalized = normalizeCanonicalPublicTournamentData(fixture({
    standings: { items: [{ rankingId: "standing-casa-1", resultId, position: 1, teamId: "casa-1", total: 235, status: "PARTIAL" }] }
  }));
  assert.equal(validateCanonicalPublicTournamentData(normalized).valid, false);
  assert.ok(validateCanonicalPublicTournamentData(normalized).errors.includes("standing-total-diverges-from-result"));
});

test("hash is deterministic and excludes publication-only clock and projection revision", () => {
  const first = createCanonicalPublicTournamentData(fixture());
  const second = createCanonicalPublicTournamentData(fixture({ generatedAt: "2026-09-08T19:00:00.000Z", projectionRevision: 2 }));
  assert.equal(first.contentHash, second.contentHash);
  assert.equal(first.contentHash, buildCanonicalPublicTournamentDataHash(first));
});

test("lifecycle, private data, unresolved positions, and malformed public references fail closed", () => {
  const invalidLifecycle = normalizeCanonicalPublicTournamentData(fixture({ lifecycle: { status: "UNKNOWN" } }));
  assert.ok(validateCanonicalPublicTournamentData(invalidLifecycle).errors.includes("lifecycle-status-invalid"));

  const unresolvedPosition = normalizeCanonicalPublicTournamentData(fixture({
    standings: { items: [{ rankingId: "standing-casa-1", resultId, position: 0, teamId: "casa-1", total: 193, status: "PARTIAL" }] }
  }));
  assert.ok(validateCanonicalPublicTournamentData(unresolvedPosition).errors.includes("standing-position-unresolved"));

  const malformedSheet = normalizeCanonicalPublicTournamentData(fixture({
    sheet: { competitions: [{ competitionId: "equipos_completo", rows: [{ resultId: "foreign-result", teamId: "casa-1", columns: {}, total: 193 }] }] }
  }));
  assert.ok(validateCanonicalPublicTournamentData(malformedSheet).errors.includes("sheet-result-reference-invalid"));
});

console.log("canonical-public-tournament-data-contract.test.mjs: ok");
