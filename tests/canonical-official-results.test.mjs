import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanonicalOfficialResults,
  getCanonicalOfficialTeamTotals,
  getCanonicalSportingOpportunityKey
} from "../js/core/canonicalOfficialResults.js?v=20260909-portal-v2-live-timeline-001-v1";
import { buildPublicProjection } from "../js/public/publicProjection.js?v=20260909-portal-v2-live-timeline-001-v1";
import { adaptCanonicalPublicV3ToLegacyPresentation } from "../js/public/publicProjectionLegacyAdapter.js?v=20260909-portal-v2-live-timeline-001-v1";

const tournamentId = "tournament-canonical";
const charreadaId = "charreada-canonical";
const teamId = "team-canonical";

test("1. runtime incident collapses three active external slots", () => {
  const records = [
    official({ id: "r-slot-0", total: 21, shared: "terna:op:4", coleadorIndex: 0, participantSlot: 1, timestampMs: 100 }),
    official({ id: "r-slot-1", total: 21, shared: "terna:op:4", coleadorIndex: 1, participantSlot: 2, revision: 2, timestampMs: 200 }),
    official({ id: "r-slot-2", total: 21, shared: "terna:op:4", coleadorIndex: 2, participantSlot: 3, timestampMs: 300 })
  ];
  const result = buildCanonicalOfficialResults({ publishedScores: records });
  assert.equal(result.currentRecords.length, 1);
  assert.equal(result.currentRecords[0].id, "r-slot-2");
  assert.equal(result.duplicateHeadsResolved, 2);
});

test("2. public projection uses one value for the runtime incident", () => {
  const publishedScores = [
    official({ id: "cala", suerteId: "cala", total: 31, shared: "cala:1", timestampMs: 10 }),
    official({ id: "piales", suerteId: "piales", total: 38, shared: "piales:1", timestampMs: 20 }),
    official({ id: "colas", suerteId: "colas", suerteType: "coleadero", total: 68, attemptIndex: 0, participantSlot: 1, timestampMs: 30 }),
    official({ id: "toro", suerteId: "toro", total: 20, shared: "toro:1", timestampMs: 40 }),
    official({ id: "lazo", suerteId: "lazo", total: 15, shared: "terna:op:1", timestampMs: 50 }),
    official({ id: "pr-0", total: 21, shared: "terna:op:4", coleadorIndex: 0, timestampMs: 60 }),
    official({ id: "pr-1", total: 21, shared: "terna:op:4", coleadorIndex: 1, timestampMs: 70 }),
    official({ id: "pr-2", total: 21, shared: "terna:op:4", coleadorIndex: 2, timestampMs: 80 })
  ];
  const projection = buildPublicProjection(tournament({ publishedScores }), { nowMs: 1000 });
  const presentation = adaptCanonicalPublicV3ToLegacyPresentation(projection);
  assert.equal(projection.results.teams[0].columns.pial_ruedo, 21);
  assert.equal(projection.results.teams[0].total, 193);
  assert.equal(presentation.generalRanking[0].total, 193);
});

test("3. correction on the same publication key selects the newest record", () => {
  const result = canonical([
    official({ id: "old", total: 15, revision: 1, timestampMs: 100 }),
    official({ id: "new", total: 21, revision: 2, timestampMs: 200 })
  ]);
  assert.deepEqual(result.currentRecords.map((item) => item.id), ["new"]);
});

test("4. external index change does not create a sporting attempt", () => {
  const left = official({ id: "a", shared: "terna:op:4", coleadorIndex: 0 });
  const right = official({ id: "b", shared: "terna:op:4", attemptIndex: 4, coleadorIndex: 2 });
  assert.equal(getCanonicalSportingOpportunityKey(left), getCanonicalSportingOpportunityKey(right));
});

test("5. participant change on one shared opportunity remains one attempt", () => {
  const result = canonical([
    official({ id: "participant-a", shared: "terna:op:4", participantId: "participant-a", timestampMs: 1 }),
    official({ id: "participant-b", shared: "terna:op:4", participantId: "participant-b", timestampMs: 2 })
  ]);
  assert.equal(result.currentRecords.length, 1);
  assert.equal(result.currentRecords[0].id, "participant-b");
});

test("6. idempotent duplicate delivery is deduplicated by record id", () => {
  const duplicate = official({ id: "same-id", timestampMs: 1 });
  const result = canonical([duplicate, structuredClone(duplicate)]);
  assert.equal(result.sourceRecordCount, 1);
  assert.equal(result.currentRecords.length, 1);
});

test("7. two distinct shared opportunities remain distinct", () => {
  const result = canonical([
    official({ id: "op-1", shared: "terna:op:1" }),
    official({ id: "op-2", shared: "terna:op:2" })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("8. the same shared id in different suertes remains distinct", () => {
  const result = canonical([
    official({ id: "lazo", suerteId: "lazo", shared: "terna:op:1" }),
    official({ id: "pial", suerteId: "pial_ruedo", shared: "terna:op:1" })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("9. the same opportunity for different teams remains distinct", () => {
  const result = canonical([
    official({ id: "team-a", shared: "terna:op:1", teamId: "team-a" }),
    official({ id: "team-b", shared: "terna:op:1", teamId: "team-b" })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("10. the same opportunity for different charreadas remains distinct", () => {
  const result = canonical([
    official({ id: "charreada-a", shared: "terna:op:1", charreadaId: "charreada-a" }),
    official({ id: "charreada-b", shared: "terna:op:1", charreadaId: "charreada-b" })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("11. ledger activeRecordId overrides stale record flags", () => {
  const old = official({ id: "ledger-old", timestampMs: 1 });
  const current = official({ id: "ledger-current", timestampMs: 2 });
  const result = buildCanonicalOfficialResults({
    publishedScores: [old, current],
    officialScoreLedger: { ledger: { activeRecordId: old.id, records: { [old.id]: old, [current.id]: current } } }
  });
  assert.deepEqual(result.currentRecords.map((item) => item.id), [old.id]);
});

test("12. superseded records are excluded without a ledger", () => {
  const result = canonical([
    official({ id: "historical", superseded: true, timestampMs: 2 }),
    official({ id: "active", timestampMs: 1 })
  ]);
  assert.deepEqual(result.currentRecords.map((item) => item.id), ["active"]);
});

test("13. chronology resolves split active ledger heads", () => {
  const result = canonical([
    official({ id: "higher-revision", revision: 5, timestampMs: 100 }),
    official({ id: "newer-event", revision: 1, timestampMs: 200 })
  ]);
  assert.equal(result.currentRecords[0].id, "newer-event");
});

test("14. revision resolves equal timestamps deterministically", () => {
  const result = canonical([
    official({ id: "revision-1", revision: 1, timestampMs: 100 }),
    official({ id: "revision-2", revision: 2, timestampMs: 100 })
  ]);
  assert.equal(result.currentRecords[0].id, "revision-2");
});

test("15. ordinary non-shared attempt indexes remain distinct", () => {
  const result = canonical([
    official({ id: "attempt-0", suerteId: "piales", shared: "", attemptIndex: 0 }),
    official({ id: "attempt-1", suerteId: "piales", shared: "", attemptIndex: 1 })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("16. coleadero participant slots remain distinct", () => {
  const result = canonical([
    official({ id: "coleador-1", suerteId: "colas", suerteType: "coleadero", shared: "", participantSlot: 1, coleadorIndex: 0 }),
    official({ id: "coleador-2", suerteId: "colas", suerteType: "coleadero", shared: "", participantSlot: 2, coleadorIndex: 1 })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("17. coleadero correction for the same participant collapses", () => {
  const result = canonical([
    official({ id: "cola-old", suerteId: "colas", suerteType: "coleadero", shared: "", participantSlot: 1, timestampMs: 1 }),
    official({ id: "cola-new", suerteId: "colas", suerteType: "coleadero", shared: "", participantSlot: 1, timestampMs: 2 })
  ]);
  assert.equal(result.currentRecords.length, 1);
  assert.equal(result.currentRecords[0].id, "cola-new");
});

test("18. individual competition participants remain distinct", () => {
  const result = canonical([
    official({ id: "individual-a", teamId: "", participantId: "individual-a", participantScope: "individual" }),
    official({ id: "individual-b", teamId: "", participantId: "individual-b", participantScope: "individual" })
  ]);
  assert.equal(result.currentRecords.length, 2);
});

test("19. team-adjusted official values are not recalculated", () => {
  const totals = getCanonicalOfficialTeamTotals({ publishedScores: [
    official({ id: "penalty", total: 7, goodPoints: 10, individualBadPoints: 1, teamBadPoints: 2 })
  ] }, { tournamentId, charreadaId, teamId });
  assert.equal(totals.total, 7);
  assert.equal(totals.badPoints, 3);
});

test("20. negative charreada adjustment is reflected once", () => {
  const totals = getCanonicalOfficialTeamTotals({
    publishedScores: [official({ id: "resta", total: 20 })],
    charreadas: [{ id: charreadaId, restas: { [teamId]: -5 } }]
  }, { tournamentId, charreadaId, teamId });
  assert.equal(totals.total, 15);
  assert.equal(totals.badPoints, 5);
});

test("21. zero is preserved as an official current value", () => {
  const totals = getCanonicalOfficialTeamTotals({ publishedScores: [official({ id: "zero", total: 0 })] }, { tournamentId, charreadaId, teamId });
  assert.equal(totals.hasOfficialRecords, true);
  assert.equal(totals.total, 0);
});

test("22. negative official attempt values are preserved", () => {
  const totals = getCanonicalOfficialTeamTotals({ publishedScores: [official({ id: "negative", total: -4 })] }, { tournamentId, charreadaId, teamId });
  assert.equal(totals.total, -4);
});

test("23. piales sum distinct official opportunities", () => {
  const totals = getCanonicalOfficialTeamTotals({ publishedScores: [
    official({ id: "pial-1", suerteId: "piales", total: 12, attemptIndex: 0 }),
    official({ id: "pial-2", suerteId: "piales", total: 18, attemptIndex: 1 })
  ] }, { tournamentId, charreadaId, teamId });
  assert.equal(totals.suerteTotals.piales, 30);
});

test("24. frozen temporal points stay in the official value", () => {
  const totals = getCanonicalOfficialTeamTotals({ publishedScores: [
    official({ id: "temporal", total: 21, goodPoints: 21, shared: "terna:op:4" })
  ] }, { tournamentId, charreadaId, teamId });
  assert.equal(totals.suerteTotals.pial_ruedo, 21);
});

test("25. old records without Attempt V2 retain a deterministic fallback identity", () => {
  const legacy = {
    id: "legacy",
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId: "equipos_completo" },
    competition: { id: "equipos_completo", scope: "team" },
    team: { id: teamId },
    suerte: { id: "cala" },
    attemptIndex: 0,
    coleadorIndex: 0,
    total: 9,
    publishedAt: "2026-09-01T00:00:00.000Z"
  };
  assert.match(getCanonicalSportingOpportunityKey(legacy), /__cala__op:1$/);
  assert.equal(canonical([legacy]).currentRecords.length, 1);
});

function canonical(publishedScores) {
  return buildCanonicalOfficialResults({ publishedScores });
}

function official(options = {}) {
  const suerteId = options.suerteId || "pial_ruedo";
  const attemptIndex = options.attemptIndex ?? 3;
  const coleadorIndex = options.coleadorIndex ?? 0;
  const selectedTeamId = options.teamId === undefined ? teamId : options.teamId;
  const participantId = options.participantId || (options.participantSlot ? `participant-${options.participantSlot}` : "");
  const shared = options.shared === undefined
    ? ["lazo", "pial_ruedo"].includes(suerteId) ? "terna:op:4" : ""
    : options.shared;
  const total = options.total ?? 10;
  return {
    id: options.id || `record-${suerteId}-${attemptIndex}-${coleadorIndex}`,
    attemptKey: `${tournamentId}__${options.charreadaId || charreadaId}__${selectedTeamId || participantId}__${suerteId}__${attemptIndex}__${coleadorIndex}`,
    tournament: { id: tournamentId, name: "Torneo Canonical" },
    charreada: { id: options.charreadaId || charreadaId, competitionId: "equipos_completo" },
    competition: { id: "equipos_completo", type: "equipos_completo", scope: options.participantScope || "team" },
    team: { id: selectedTeamId, name: selectedTeamId || "" },
    participantId,
    participantScope: options.participantScope,
    suerte: { id: suerteId, type: options.suerteType || "" },
    attemptIndex,
    coleadorIndex,
    revision: options.revision || 1,
    superseded: options.superseded || false,
    officialStatus: options.superseded ? "historical" : "active",
    total,
    timestampMs: options.timestampMs || 0,
    publishedAt: new Date(options.timestampMs || 1).toISOString(),
    breakdown: {
      total,
      attemptV2: {
        identity: {
          tournamentId,
          charreadaId: options.charreadaId || charreadaId,
          competitionId: "equipos_completo",
          teamId: selectedTeamId,
          participantId,
          participantSlot: options.participantSlot || coleadorIndex + 1,
          suerteId,
          opportunityNumber: attemptIndex + 1
        },
        sportState: { opportunity: { number: attemptIndex + 1, sharedOpportunityId: shared || "" } },
        scoring: {
          goodPoints: options.goodPoints ?? total,
          individualBadPoints: options.individualBadPoints || 0,
          teamBadPoints: options.teamBadPoints || 0,
          teamAdjustedPoints: total
        }
      }
    }
  };
}

function tournament({ publishedScores }) {
  return {
    info: { id: tournamentId, name: "Torneo Canonical", type: "completo" },
    teams: [{ id: teamId, name: "Casa 1", tournamentId }],
    charreadas: [{
      id: charreadaId,
      name: "Charreada 1",
      tournamentId,
      competitionId: "equipos_completo",
      competitionType: "equipos_completo",
      competitionScope: "team",
      phase: "Fase 1",
      teamIds: [teamId],
      suerteIds: ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo"]
    }],
    publishedScores,
    officialScoreLedger: {},
    meta: { activeCharreadaId: charreadaId, updatedAt: "2026-09-01T00:00:00.000Z" }
  };
}
