import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getTraditionalColeaderoOfficialAttempt, indexTraditionalColeaderoOfficialAttempts } from "../js/core/coleaderoLiveGraphic.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";

const tournamentId = "coleadero-zero-tournament";
const charreadaId = "coleadero-zero-charreada";
const teamId = "coleadero-zero-team";

test("traditional Coleadero indexes official 15 and official zero without materializing absence", () => {
  const index = indexTraditionalColeaderoOfficialAttempts([
    officialRecord("colas-fifteen", 0, 0, 15),
    officialRecord("colas-zero", 0, 1, 0)
  ], { tournamentId, charreadaId, teamId });

  assert.equal(index.get("0:0")?.breakdown.attemptV2.scoring.teamAdjustedPoints, 15);
  assert.equal(index.get("0:1")?.breakdown.attemptV2.scoring.teamAdjustedPoints, 0);
  assert.equal(index.has("0:2"), false, "an absent opportunity has no canonical official record");

  assert.deepEqual(getTraditionalColeaderoOfficialAttempt(index.get("0:0")), { total: 15, hasOfficialResult: true });
  assert.deepEqual(getTraditionalColeaderoOfficialAttempt(index.get("0:1")), { total: 0, hasOfficialResult: true });
  assert.deepEqual(getTraditionalColeaderoOfficialAttempt(index.get("0:2")), { total: 0, hasOfficialResult: false });
});

test("traditional adapter, compact transport, and renderer use explicit official existence", async () => {
  const [syncSource, firebaseSource, graphicSource] = await Promise.all([
    readFile(new URL("../js/core/sync.js", import.meta.url), "utf8"),
    readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8"),
    readFile(new URL("../js/views/grafico.js", import.meta.url), "utf8")
  ]);

  assert.match(syncSource, /const officialAttempt = getTraditionalColeaderoOfficialAttempt\(officialRecord\)/);
  assert.match(syncSource, /total: officialAttempt\.hasOfficialResult \? officialAttempt\.total : calculateAttemptTotal\(attempt\)/);
  assert.match(syncSource, /hasOfficialResult: officialAttempt\.hasOfficialResult/);
  assert.match(firebaseSource, /hasOfficialResult: attempt\.hasOfficialResult === true/);
  assert.match(graphicSource, /const hasOfficialResult = attempt\?\.hasOfficialResult === true/);
  assert.match(graphicSource, /const value = hasOfficialResult \? moneylessNumber\(attempt\.total\) : "—"/);
  assert.doesNotMatch(graphicSource, /function renderColeaderoAttempt\(attempt\) \{[\s\S]*?hasActivity \|\| attempt\?\.desc \|\| Number\(attempt\?\.total \|\| 0\)/);
});

function officialRecord(id, coleadorIndex, attemptIndex, total) {
  return {
    id,
    published: true,
    officialStatus: "official",
    tournament: { id: tournamentId },
    charreada: { id: charreadaId },
    team: { id: teamId },
    suerte: { id: "colas", type: "coleadero" },
    coleadorIndex,
    attemptIndex,
    total,
    breakdown: {
      attemptV2: {
        identity: {
          tournamentId,
          charreadaId,
          teamId,
          suerteId: "colas",
          participantSlot: coleadorIndex + 1,
          opportunityNumber: attemptIndex + 1
        },
        sportState: { status: "OFFICIAL", opportunity: { number: attemptIndex + 1 } },
        scoring: { teamAdjustedPoints: total }
      }
    }
  };
}

console.log("COLEADERO_EXPLICIT_OFFICIAL_RESULT_ZERO: PASS");
