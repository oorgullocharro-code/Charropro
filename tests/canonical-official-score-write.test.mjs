import assert from "node:assert/strict";
import test from "node:test";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260911-coleadero-live-graphics-five-rider-window-001-v1";

const { applyOfficialScoreTransaction, prepareOfficialScoreRequest } = officialScoreConcurrency;
const tournamentId = "tournament-write-merge";
const charreadaId = "charreada-write-merge";
const teamId = "team-write-merge";
const actor = { uid: "judge", name: "Juez", email: "judge@example.test", role: "juez" };

test("CAS on distinct attempts preserves both score cells", () => {
  let tournament = seed("piales", [{ base: 0 }, { base: 0 }]);
  const first = prepared({ suerteId: "piales", attemptIndex: 0, total: 12, scorePayload: [{ base: 12 }, { base: 0 }], idempotencyKey: "score:merge-first-0001" });
  const second = prepared({ suerteId: "piales", attemptIndex: 1, total: 18, scorePayload: [{ base: 0 }, { base: 18 }], idempotencyKey: "score:merge-second-0001" });
  tournament = applyOfficialScoreTransaction(tournament, first).tournament;
  tournament = applyOfficialScoreTransaction(tournament, second).tournament;
  assert.deepEqual(tournament.scores[scoreId("piales")].map((item) => item.base), [12, 18]);
});

test("reverse CAS order also preserves both score cells", () => {
  let tournament = seed("piales", [{ base: 0 }, { base: 0 }]);
  const first = prepared({ suerteId: "piales", attemptIndex: 0, total: 12, scorePayload: [{ base: 12 }, { base: 0 }], idempotencyKey: "score:merge-reverse-first-0001" });
  const second = prepared({ suerteId: "piales", attemptIndex: 1, total: 18, scorePayload: [{ base: 0 }, { base: 18 }], idempotencyKey: "score:merge-reverse-second-0001" });
  tournament = applyOfficialScoreTransaction(tournament, second).tournament;
  tournament = applyOfficialScoreTransaction(tournament, first).tournament;
  assert.deepEqual(tournament.scores[scoreId("piales")].map((item) => item.base), [12, 18]);
});

test("coleadero writes merge by participant and attempt", () => {
  const initial = Array.from({ length: 3 }, () => [{ base: 0 }, { base: 0 }]);
  let tournament = seed("colas", initial);
  const payloadA = structuredClone(initial);
  const payloadB = structuredClone(initial);
  payloadA[0][1] = { base: 9 };
  payloadB[2][0] = { base: 11 };
  tournament = applyOfficialScoreTransaction(tournament, prepared({ suerteId: "colas", suerteType: "coleadero", attemptIndex: 1, coleadorIndex: 0, total: 9, scorePayload: payloadA, idempotencyKey: "score:colas-a-0001" })).tournament;
  tournament = applyOfficialScoreTransaction(tournament, prepared({ suerteId: "colas", suerteType: "coleadero", attemptIndex: 0, coleadorIndex: 2, total: 11, scorePayload: payloadB, idempotencyKey: "score:colas-b-0001" })).tournament;
  assert.equal(tournament.scores[scoreId("colas")][0][1].base, 9);
  assert.equal(tournament.scores[scoreId("colas")][2][0].base, 11);
});

test("shared Terna opportunity keeps one ledger across external index changes", () => {
  let tournament = seed("pial_ruedo", Array.from({ length: 5 }, () => ({ base: 0 })));
  const original = prepared({ suerteId: "pial_ruedo", attemptIndex: 3, coleadorIndex: 1, total: 15, sharedOpportunityId: "terna:test:op:4", participantId: "slot-2", participantSlot: 2, scorePayload: [{}, {}, {}, { base: 15 }, {}], idempotencyKey: "score:terna-original-0001" });
  const correction = prepared({ suerteId: "pial_ruedo", attemptIndex: 3, coleadorIndex: 0, total: 21, sharedOpportunityId: "terna:test:op:4", participantId: "slot-1", participantSlot: 1, scorePayload: [{}, {}, {}, { base: 21 }, {}], expectedRevision: 1, idempotencyKey: "score:terna-correction-0001" });
  assert.equal(original.attemptId, correction.attemptId);
  tournament = applyOfficialScoreTransaction(tournament, original).tournament;
  const applied = applyOfficialScoreTransaction(tournament, correction);
  assert.equal(applied.outcome.ok, true);
  assert.equal(applied.outcome.revision, 2);
  assert.equal(Object.keys(applied.tournament.officialScoreLedger).length, 1);
  assert.equal(Object.values(applied.tournament.publishedScores).filter((item) => !item.superseded).length, 1);
});

test("distinct shared opportunities retain independent CAS revisions", () => {
  const first = prepared({ suerteId: "pial_ruedo", attemptIndex: 0, total: 10, sharedOpportunityId: "terna:test:op:1", scorePayload: [{ base: 10 }], idempotencyKey: "score:terna-distinct-a-0001" });
  const second = prepared({ suerteId: "pial_ruedo", attemptIndex: 1, total: 20, sharedOpportunityId: "terna:test:op:2", scorePayload: [{ base: 0 }, { base: 20 }], idempotencyKey: "score:terna-distinct-b-0001" });
  assert.notEqual(first.attemptId, second.attemptId);
});

function prepared(options) {
  const suerteId = options.suerteId;
  const attemptIndex = options.attemptIndex || 0;
  const coleadorIndex = options.coleadorIndex || 0;
  const publishedScore = {
    attemptKey: `${tournamentId}__${charreadaId}__${teamId}__${suerteId}__${attemptIndex}__${coleadorIndex}`,
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId: "equipos_completo" },
    competition: { id: "equipos_completo", scope: "team" },
    team: { id: teamId },
    suerte: { id: suerteId, type: options.suerteType || "" },
    attemptIndex,
    coleadorIndex,
    total: options.total,
    breakdown: {
      total: options.total,
      attemptV2: {
        identity: {
          tournamentId,
          charreadaId,
          competitionId: "equipos_completo",
          teamId,
          suerteId,
          opportunityNumber: attemptIndex + 1,
          participantId: options.participantId || "",
          participantSlot: options.participantSlot || coleadorIndex + 1
        },
        sportState: { opportunity: { number: attemptIndex + 1, sharedOpportunityId: options.sharedOpportunityId || "" } },
        scoring: { teamAdjustedPoints: options.total }
      }
    }
  };
  const result = prepareOfficialScoreRequest({
    tournamentId,
    scoreId: scoreId(suerteId),
    idempotencyKey: options.idempotencyKey,
    expectedRevision: options.expectedRevision || 0,
    scorePayload: options.scorePayload,
    publishedScore
  }, actor, { nowMs: Date.now() });
  assert.equal(result.valid, true, result.errors?.join(", "));
  return result.request;
}

function seed(suerteId, collection) {
  return {
    info: { id: tournamentId, status: "en_vivo" },
    meta: { activeCharreadaId: charreadaId },
    charreadas: { [charreadaId]: { id: charreadaId, competitionId: "equipos_completo", teamIds: [teamId], suerteIds: [suerteId] } },
    teams: { [teamId]: { id: teamId } },
    scores: { [scoreId(suerteId)]: structuredClone(collection) },
    publishedScores: {}
  };
}

function scoreId(suerteId) {
  return `${charreadaId}__${teamId}__${suerteId}`;
}
