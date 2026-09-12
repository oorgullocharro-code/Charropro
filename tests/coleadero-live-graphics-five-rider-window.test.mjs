import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildIndividualColeaderoLiveData,
  isIndividualColeaderoLiveContext,
  selectColeaderoFiveRiderWindow
} from "../js/core/coleaderoLiveGraphic.js?v=20260911-admin-page-vertical-scroll-restore-001-v1";
import { buildCanonicalOfficialResults } from "../js/core/canonicalOfficialResults.js?v=20260911-admin-page-vertical-scroll-restore-001-v1";

const tournament = {
  id: "coleadero-live",
  type: "coleadero",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.1",
  ruleProfileAssignment: {
    authorityVersion: "1.0.0",
    tournamentId: "coleadero-live",
    profileId: "FMCH_2026_LIBRE",
    version: "0.6.1",
    status: "active",
    contentFingerprint: "rptp_10e596046446e850",
    revision: 1
  }
};
const charreada = {
  id: "lote-uno",
  name: "Lote Uno",
  competitionId: "coleadero",
  competitionType: "coleadero",
  competitionScope: "individual",
  participantIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]
};
const entries = charreada.participantIds.map((participantId, index) => ({
  id: participantId,
  participantName: participantId === "p1" || participantId === "p2" ? "Gustavo Mares" : `Participante ${index + 1}`,
  horseId: `h${index + 1}`,
  horseName: participantId === "p1" ? "Moro" : participantId === "p2" ? "Canela" : `Caballo ${index + 1}`
}));

test("five-rider window preserves roster order at every edge", () => {
  const rows = entries.map((entry) => ({ participantId: entry.id }));
  assert.deepEqual(selectColeaderoFiveRiderWindow(rows, "p1").map((row) => row.participantId), ["p1", "p2", "p3", "p4", "p5"]);
  assert.deepEqual(selectColeaderoFiveRiderWindow(rows, "p2").map((row) => row.participantId), ["p1", "p2", "p3", "p4", "p5"]);
  assert.deepEqual(selectColeaderoFiveRiderWindow(rows, "p4").map((row) => row.participantId), ["p2", "p3", "p4", "p5", "p6"]);
  assert.deepEqual(selectColeaderoFiveRiderWindow(rows, "p6").map((row) => row.participantId), ["p3", "p4", "p5", "p6", "p7"]);
  assert.deepEqual(selectColeaderoFiveRiderWindow(rows, "p7").map((row) => row.participantId), ["p3", "p4", "p5", "p6", "p7"]);
  assert.equal(selectColeaderoFiveRiderWindow(rows.slice(0, 3), "p2").length, 3);
  assert.equal(selectColeaderoFiveRiderWindow(rows.slice(0, 1), "p1").length, 1);
});

test("individual Coleadero rows use canonical official records, identities, and profile slots", () => {
  const canonicalOfficialResults = buildCanonicalOfficialResults({
    tournamentId: tournament.id,
    publishedScores: [
      official("p3-zero", "p3", 1, 0),
      official("p3-third", "p3", 3, 10),
      official("p4-first", "p4", 1, 15),
      official("p4-second", "p4", 2, 12),
      official("p4-third", "p4", 3, 14),
      official("p1-correction-old", "p1", 1, 9, 1),
      official("p1-correction-current", "p1", 1, 11, 2)
    ]
  });
  const data = buildIndividualColeaderoLiveData({
    tournament,
    charreada,
    entries,
    currentParticipantId: "p4",
    canonicalOfficialResults
  });

  assert.equal(data.participantScope, "individual");
  assert.equal(data.currentParticipantId, "p4");
  assert.equal(data.currentIndex, 3);
  assert.equal(data.opportunitiesPerParticipant, 3);
  assert.deepEqual(data.rows.map((row) => row.participantId), ["p2", "p3", "p4", "p5", "p6"]);
  assert.equal(data.rows.find((row) => row.participantId === "p4").active, true);

  const p3 = data.rows.find((row) => row.participantId === "p3");
  assert.equal(p3.participantName, "Participante 3");
  assert.equal(p3.horseId, "h3");
  assert.equal(p3.horseName, "Caballo 3");
  assert.deepEqual(p3.opportunities, [
    { opportunityNumber: 1, officialPoints: 0, status: "OFFICIAL" },
    { opportunityNumber: 3, officialPoints: 10, status: "OFFICIAL" }
  ]);
  assert.equal(p3.officialTotal, 10);

  const p4 = data.rows.find((row) => row.participantId === "p4");
  assert.equal(p4.officialTotal, 41);
  assert.deepEqual(p4.opportunities.map((item) => item.officialPoints), [15, 12, 14]);

  const p1 = buildIndividualColeaderoLiveData({
    tournament,
    charreada,
    entries,
    currentParticipantId: "p1",
    canonicalOfficialResults
  }).rows.find((row) => row.participantId === "p1");
  assert.equal(p1.officialTotal, 11, "active official correction wins without recalculating draft state");
});

test("individual scope is explicit and team scope remains outside the new branch", async () => {
  assert.equal(isIndividualColeaderoLiveContext(charreada, { competitionContext: { competitionScope: "individual" } }), true);
  assert.equal(isIndividualColeaderoLiveContext({ ...charreada, competitionScope: "team" }, { competitionContext: { competitionScope: "team" } }), false);

  const [syncSource, graphicSource] = await Promise.all([
    readFile(new URL("../js/core/sync.js", import.meta.url), "utf8"),
    readFile(new URL("../js/views/grafico.js", import.meta.url), "utf8")
  ]);
  assert.match(syncSource, /if \(isIndividualColeaderoLiveContext\(charreada, context\)\) \{/);
  assert.match(syncSource, /const rowCount = team\.participantName \? 1 : 3;/, "team payload builder remains present after individual branch");
  assert.match(graphicSource, /function renderTraditionalColeaderoGraphic\(payload, config\) \{\s+const data = getColeaderoData\(payload\);\s+const rows = data\.rows\.slice\(0, 3\);/);
  assert.match(graphicSource, /function renderTournamentColeaderoGraphic\(payload, config\) \{\s+const data = getColeaderoData\(payload\);\s+if \(data\.participantScope !== "individual"\) return renderTournamentColeaderoUnavailableGraphic\(\);\s+return renderIndividualColeaderoGraphic\(data, config\);/);
  assert.match(graphicSource, /const rows = data\.rows\.slice\(0, 3\);/, "team renderer remains the legacy three-row renderer");
});

function official(id, participantId, opportunityNumber, officialPoints, revision = 1) {
  return {
    id,
    revision,
    officialStatus: "active",
    published: true,
    timestampMs: revision,
    tournament: { id: tournament.id },
    charreada: { id: charreada.id, competitionId: "coleadero" },
    competition: { id: "coleadero", scope: "individual", competitionScope: "individual" },
    participant: { id: participantId },
    team: { id: participantId },
    suerte: { id: "colas" },
    breakdown: {
      attemptV2: {
        identity: {
          tournamentId: tournament.id,
          charreadaId: charreada.id,
          competitionId: "coleadero",
          participantId,
          participantScope: "individual",
          suerteId: "colas",
          opportunityNumber
        },
        sportState: { status: "OFFICIAL", opportunity: { number: opportunityNumber } },
        scoring: { teamAdjustedPoints: officialPoints }
      }
    }
  };
}
