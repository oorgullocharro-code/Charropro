import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";

const {
  OFFICIAL_SCORE_LEDGER_VERSION,
  applyOfficialScoreTransaction,
  buildOfficialScoreFanoutUpdates,
  markOfficialScoreFanoutDelivered,
  prepareOfficialScoreRequest,
  toFirebaseDatabaseValue
} = officialScoreConcurrency;

const tournamentId = "tournament-concurrency";
const charreadaId = "charreada-concurrency";
const teamId = "team-concurrency";
const suerteId = "cala";
const attemptKey = `${tournamentId}__${charreadaId}__${teamId}__${suerteId}__0__0`;
const actor = {
  uid: "judge-a",
  name: "Juez A",
  email: "juez@example.test",
  role: "juez",
  clientId: "client-a"
};

assert.equal(OFFICIAL_SCORE_LEDGER_VERSION, "1.0.0");

const seed = buildTournament();
const retryRequest = prepare({ idempotencyKey: "score:retry-request-0001", expectedRevision: 0, total: 10 });
const retryStore = createTransactionalStore(seed);
const retryResults = await Promise.all(
  Array.from({ length: 100 }, () => retryStore.transact(retryRequest))
);
assert.equal(retryResults.filter((result) => result.outcome.ok).length, 100);
assert.equal(retryResults.filter((result) => result.outcome.idempotent).length, 99);
assert.equal(activeRecords(retryStore.read(), attemptKey).length, 1, "one active record survives one hundred retries");
assert.equal(ledgerFor(retryStore.read()).revision, 1);
assert.equal(Object.keys(ledgerFor(retryStore.read()).records).length, 1);
assert.equal(Object.keys(ledgerFor(retryStore.read()).requests).length, 1);
assert.equal(Object.keys(retryStore.read().officialScoreAudit).length, 1, "an idempotent retry does not duplicate audit history");

const firstOutcome = retryResults[0].outcome;
assert.equal(firstOutcome.record.revision, 1);
assert.equal(firstOutcome.record.version, 1);
assert.equal(firstOutcome.record.authUid, actor.uid);
assert.equal(firstOutcome.record.actor.uid, actor.uid);
assert.equal(firstOutcome.record.idempotencyKey, retryRequest.idempotencyKey);
assert.equal(firstOutcome.record.source, "charropro-calificador");
assert.equal(firstOutcome.record.total, 10, "the official total is preserved, not recalculated");
assert.ok(firstOutcome.record.createdAt);
assert.ok(firstOutcome.record.updatedAt);
assert.ok(firstOutcome.record.timestamp);

const retryAfterLostResponse = await retryStore.transact(retryRequest);
assert.equal(retryAfterLostResponse.outcome.ok, true);
assert.equal(retryAfterLostResponse.outcome.idempotent, true, "timeout/refresh retry returns the prior commit");
assert.equal(retryAfterLostResponse.outcome.recordId, firstOutcome.recordId);
assert.equal(ledgerFor(retryStore.read()).revision, 1);

const concurrentStore = createTransactionalStore(seed);
const competing = Array.from({ length: 24 }, (_, index) => prepare({
  idempotencyKey: `score:device-${String(index).padStart(4, "0")}`,
  expectedRevision: 0,
  total: 20 + index,
  actor: { ...actor, uid: `judge-${index}`, name: `Juez ${index}` },
  nowMs: Date.parse("2026-08-01T12:10:00.000Z") + index
}));
const concurrentResults = await Promise.all(competing.map((request) => concurrentStore.transact(request)));
assert.equal(concurrentResults.filter((result) => result.outcome.ok).length, 1, "CAS accepts one concurrent base revision");
assert.equal(concurrentResults.filter((result) => result.outcome.conflict).length, 23);
assert.equal(activeRecords(concurrentStore.read(), attemptKey).length, 1);
assert.equal(ledgerFor(concurrentStore.read()).revision, 1);
assert.equal(
  Object.values(concurrentStore.read().officialScoreAudit).filter((event) => event.result === "CONFLICT").length,
  23,
  "every rejected concurrent operation remains auditable"
);

const correctionRequest = prepare({
  idempotencyKey: "score:authorized-correction-0001",
  expectedRevision: 1,
  total: 35,
  nowMs: Date.parse("2026-08-01T12:20:00.000Z")
});
const corrected = await retryStore.transact(correctionRequest);
assert.equal(corrected.outcome.ok, true);
assert.equal(corrected.outcome.revision, 2);
assert.equal(activeRecords(retryStore.read(), attemptKey).length, 1);
assert.equal(activeRecords(retryStore.read(), attemptKey)[0].total, 35);
const ledgerAfterCorrection = ledgerFor(retryStore.read());
assert.equal(ledgerAfterCorrection.records[firstOutcome.recordId].status, "historical");
assert.equal(ledgerAfterCorrection.records[firstOutcome.recordId].superseded, true);
assert.equal(ledgerAfterCorrection.records[firstOutcome.recordId].supersededBy, corrected.outcome.recordId);
assert.equal(Object.keys(ledgerAfterCorrection.records).length, 2, "correction preserves complete history");

const staleRetry = await retryStore.transact(retryRequest);
assert.equal(staleRetry.outcome.ok, false);
assert.equal(staleRetry.outcome.reason, "official-score-request-superseded");
assert.equal(activeRecords(retryStore.read(), attemptKey)[0].total, 35, "stale retry cannot reactivate historical data");

const regressive = await retryStore.transact(prepare({
  idempotencyKey: "score:regressive-revision-0001",
  expectedRevision: 0,
  total: 99
}));
assert.equal(regressive.outcome.ok, false);
assert.equal(regressive.outcome.reason, "official-score-revision-conflict");
assert.equal(ledgerFor(retryStore.read()).revision, 2);
assert.equal(activeRecords(retryStore.read(), attemptKey)[0].total, 35);

const legacyTournament = buildTournament();
legacyTournament.publishedScores = {
  legacy_b: {
    ...buildInput({ idempotencyKey: "score:legacy-b-0001", expectedRevision: 0, total: 12 }).publishedScore,
    id: "legacy_b",
    revision: 1,
    publishedAt: "2026-07-01T10:00:00.000Z",
    superseded: false
  },
  legacy_a: {
    ...buildInput({ idempotencyKey: "score:legacy-a-0001", expectedRevision: 0, total: 11 }).publishedScore,
    id: "legacy_a",
    revision: 1,
    publishedAt: "2026-07-01T10:01:00.000Z",
    superseded: false
  }
};
const migrated = applyOfficialScoreTransaction(legacyTournament, prepare({
  idempotencyKey: "score:legacy-correction-0001",
  expectedRevision: 1,
  total: 20,
  nowMs: Date.parse("2026-08-01T12:25:00.000Z")
}));
assert.equal(migrated.outcome.ok, true, "legacy history bootstraps inside the official transaction");
assert.equal(migrated.outcome.revision, 2);
assert.equal(Object.keys(ledgerFor(migrated.tournament).records).length, 3);
assert.equal(migrated.tournament.publishedScores.legacy_a.superseded, true);
assert.equal(migrated.tournament.publishedScores.legacy_b.superseded, true);
assert.equal(activeRecords(migrated.tournament, attemptKey).length, 1, "legacy split head is resolved deterministically");
assert.equal(activeRecords(migrated.tournament, attemptKey)[0].id, migrated.outcome.recordId);

const splitLedgerTournament = retryStore.read();
const splitLedger = ledgerFor(splitLedgerTournament);
splitLedger.records[firstOutcome.recordId].status = "active";
splitLedger.records[firstOutcome.recordId].officialStatus = "active";
splitLedger.records[firstOutcome.recordId].superseded = false;
splitLedgerTournament.officialScoreLedger[splitLedger.attemptId] = splitLedger;
const splitLedgerRejected = applyOfficialScoreTransaction(splitLedgerTournament, prepare({
  idempotencyKey: "score:split-ledger-repair-0001",
  expectedRevision: 0,
  total: 36
}));
assert.equal(splitLedgerRejected.outcome.ok, false);
assert.equal(
  Object.values(ledgerFor(splitLedgerRejected.tournament).records).filter((record) => record.status === "active").length,
  1,
  "normalization repairs a split ledger head even when the requested revision is rejected"
);

const sameKeyDifferentPayload = await retryStore.transact(prepare({
  idempotencyKey: correctionRequest.idempotencyKey,
  expectedRevision: 2,
  total: 36
}));
assert.equal(sameKeyDifferentPayload.outcome.ok, false);
assert.equal(sameKeyDifferentPayload.outcome.reason, "official-score-idempotency-conflict");
assert.equal(ledgerFor(retryStore.read()).revision, 2);

const snapshotBeforeInvalid = retryStore.read();
const invalidTournament = prepare({
  idempotencyKey: "score:closed-tournament-0001",
  expectedRevision: 2,
  total: 40
});
const closedSource = retryStore.read();
closedSource.info.status = "finalizado";
const closedApplied = applyOfficialScoreTransaction(closedSource, invalidTournament);
assert.equal(closedApplied.outcome.ok, false);
assert.equal(closedApplied.outcome.reason, "official-score-tournament-closed");
assert.equal(ledgerFor(closedApplied.tournament).revision, 2);
assert.deepEqual(ledgerFor(retryStore.read()), ledgerFor(snapshotBeforeInvalid), "rejected operation is atomic for official state");

const immutableSource = buildTournament();
const immutableRequestInput = buildInput({
  idempotencyKey: "score:immutable-source-0001",
  expectedRevision: 0,
  total: 0
});
immutableRequestInput.scorePayload[0].zero = 0;
immutableRequestInput.scorePayload[0].flag = false;
immutableRequestInput.scorePayload[0].note = "";
immutableRequestInput.scorePayload[0].nullable = null;
immutableRequestInput.scorePayload[0].fn = () => "unsafe";
immutableRequestInput.scorePayload[0].big = 1n;
immutableRequestInput.scorePayload[0].cycle = immutableRequestInput.scorePayload;
Object.defineProperty(immutableRequestInput.scorePayload[0], "secretGetter", {
  enumerable: true,
  get() { throw new Error("getter must not execute"); }
});
const preparedImmutable = prepareOfficialScoreRequest(immutableRequestInput, actor, { nowMs: Date.parse("2026-08-01T12:30:00.000Z") });
assert.equal(preparedImmutable.valid, true);
assert.equal(preparedImmutable.request.scorePayload[0].zero, 0);
assert.equal(preparedImmutable.request.scorePayload[0].flag, false);
assert.equal(preparedImmutable.request.scorePayload[0].note, "");
assert.equal(preparedImmutable.request.scorePayload[0].nullable, null);
assert.equal("fn" in preparedImmutable.request.scorePayload[0], false);
assert.equal("big" in preparedImmutable.request.scorePayload[0], false);
assert.equal(preparedImmutable.request.scorePayload[0].cycle, null);
assert.equal("secretGetter" in preparedImmutable.request.scorePayload[0], false);
const immutableApplied = applyOfficialScoreTransaction(immutableSource, preparedImmutable.request);
immutableApplied.tournament.publishedScores[immutableApplied.outcome.recordId].total = 999;
assert.deepEqual(immutableSource.publishedScores, {}, "transaction output does not mutate its source");
const firebaseCompatibleTournament = toFirebaseDatabaseValue(immutableApplied.tournament);
assert.equal(Object.getPrototypeOf(firebaseCompatibleTournament), Object.prototype, "RTDB receives a normal root object");
assert.equal(Object.getPrototypeOf(firebaseCompatibleTournament.publishedScores), Object.prototype, "RTDB receives normal nested records");
assert.equal(firebaseCompatibleTournament.publishedScores[immutableApplied.outcome.recordId].total, 999);
assert.equal(Object.prototype.hasOwnProperty.call(firebaseCompatibleTournament, "__proto__"), false);
const firebaseCompatibleFanout = toFirebaseDatabaseValue(
  markOfficialScoreFanoutDelivered(
    { officialScoreFanout: { [immutableApplied.outcome.recordId]: immutableApplied.tournament.officialScoreFanout[immutableApplied.outcome.recordId] } },
    immutableApplied.outcome.recordId
  ).officialScoreFanout[immutableApplied.outcome.recordId]
);
assert.equal(Object.getPrototypeOf(firebaseCompatibleFanout), Object.prototype, "RTDB receives a normal fanout transaction value");

const fanoutJob = retryStore.read().officialScoreFanout[corrected.outcome.recordId];
const fanoutUpdates = buildOfficialScoreFanoutUpdates(tournamentId, fanoutJob);
assert.equal(fanoutUpdates[`audit/publishedScores/${tournamentId}/${corrected.outcome.recordId}`].id, corrected.outcome.recordId);
assert.equal(fanoutUpdates[`projectionOutbox/${tournamentId}/${fanoutJob.projectionIntent.projectionId}/intent`].sourceRevision, 2);
assert.equal(fanoutUpdates[`live/${tournamentId}/current`].published.revision, 2);
assert.equal(fanoutUpdates[`live/${tournamentId}/current`].published.id, corrected.outcome.recordId);

const wrongAttempt = prepareOfficialScoreRequest({
  ...buildInput({ idempotencyKey: "score:wrong-attempt-0001", expectedRevision: 0, total: 1 }),
  publishedScore: {
    ...buildInput({ idempotencyKey: "score:wrong-attempt-0001", expectedRevision: 0, total: 1 }).publishedScore,
    attemptKey: "forged"
  }
}, actor);
assert.equal(wrongAttempt.valid, false);
assert.ok(wrongAttempt.errors.includes("official-score-attempt-key-mismatch"));

const invalidRole = prepareOfficialScoreRequest(
  buildInput({ idempotencyKey: "score:invalid-role-0001", expectedRevision: 0, total: 1 }),
  { ...actor, role: "locutor" }
);
assert.equal(invalidRole.valid, false);
assert.ok(invalidRole.errors.includes("official-score-role-denied"));

const forgedAuthorityInput = buildInput({
  idempotencyKey: "score:forged-authority-fields-0001",
  expectedRevision: 0,
  total: 8
});
forgedAuthorityInput.source = "forged-client-source";
forgedAuthorityInput.publishedScore.revision = 999;
forgedAuthorityInput.publishedScore.version = 999;
forgedAuthorityInput.publishedScore.authUid = "forged-user";
forgedAuthorityInput.publishedScore.createdAt = "2099-01-01T00:00:00.000Z";
const forgedAuthorityPrepared = prepareOfficialScoreRequest(forgedAuthorityInput, actor, {
  nowMs: Date.parse("2026-08-01T12:40:00.000Z")
});
assert.equal(forgedAuthorityPrepared.valid, true);
const forgedAuthorityApplied = applyOfficialScoreTransaction(buildTournament(), forgedAuthorityPrepared.request);
assert.equal(forgedAuthorityApplied.outcome.record.source, "charropro-calificador");
assert.equal(forgedAuthorityApplied.outcome.record.revision, 1);
assert.equal(forgedAuthorityApplied.outcome.record.version, 1);
assert.equal(forgedAuthorityApplied.outcome.record.authUid, actor.uid);
assert.equal(forgedAuthorityApplied.outcome.record.createdAt, "2026-08-01T12:40:00.000Z");

const scopedTournament = buildTournament();
scopedTournament.info.tenantId = "tenant-a";
scopedTournament.info.organizationId = "organization-a";
const wrongTenantPrepared = prepareOfficialScoreRequest(
  buildInput({ idempotencyKey: "score:wrong-tenant-0001", expectedRevision: 0, total: 9 }),
  { ...actor, tenantId: "tenant-b", organizationId: "organization-a" }
);
assert.equal(wrongTenantPrepared.valid, true);
const wrongTenantApplied = applyOfficialScoreTransaction(scopedTournament, wrongTenantPrepared.request);
assert.equal(wrongTenantApplied.outcome.ok, false);
assert.equal(wrongTenantApplied.outcome.reason, "official-score-tenant-mismatch");
assert.equal(Object.keys(wrongTenantApplied.tournament.publishedScores || {}).length, 0);

const wrongOrganizationPrepared = prepareOfficialScoreRequest(
  buildInput({ idempotencyKey: "score:wrong-organization-0001", expectedRevision: 0, total: 9 }),
  { ...actor, tenantId: "tenant-a", organizationId: "organization-b" }
);
assert.equal(wrongOrganizationPrepared.valid, true);
const wrongOrganizationApplied = applyOfficialScoreTransaction(scopedTournament, wrongOrganizationPrepared.request);
assert.equal(wrongOrganizationApplied.outcome.ok, false);
assert.equal(wrongOrganizationApplied.outcome.reason, "official-score-organization-mismatch");
assert.equal(Object.keys(wrongOrganizationApplied.tournament.publishedScores || {}).length, 0);

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8")).rules.charropro;
const tournamentRules = rules.tournaments.$tournamentId;
assert.match(tournamentRules[".write"], /!newData\.exists\(\)/, "only supervisor deletion remains at tournament root");
assert.match(tournamentRules[".write"], /!data\.child\('officialScoreLedger'\)\.exists\(\)/, "a tournament with official history cannot be deleted by a client");
assert.equal(tournamentRules.publishedScores[".write"], false, "clients cannot bypass the authority by writing publishedScores");
assert.equal(tournamentRules.officialScoreLedger[".write"], false);
assert.equal(tournamentRules.officialScoreAudit[".write"], false);
assert.equal(tournamentRules.officialScoreFanout[".write"], false);
assert.equal(rules.audit.publishedScores.$tournamentId[".write"], false, "the official audit cannot be deleted by a client");
assert.equal(rules.audit.publishedScores.$tournamentId.$recordId[".write"], false, "legacy audit is server-only and append-preserving");

const functionSource = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
assert.match(functionSource, /publishCharroProOfficialScore/);
assert.match(functionSource, /request\.auth/);
assert.match(functionSource, /requireOfficialScoreActor/);
assert.match(functionSource, /tournamentAccess/);
assert.match(functionSource, /transaction\(/);
assert.match(functionSource, /deliverCharroProOfficialScoreFanout/);
assert.doesNotMatch(functionSource, /publishedScore\.total\s*=|calculateAttemptTotal|ranking/i, "server authority does not recalculate sports data");

console.log("official-score-concurrency.test.mjs: ok");

function prepare(options = {}) {
  const actorValue = options.actor || actor;
  const prepared = prepareOfficialScoreRequest(buildInput(options), actorValue, {
    nowMs: options.nowMs || Date.parse("2026-08-01T12:00:00.000Z")
  });
  assert.equal(prepared.valid, true, prepared.errors?.join(", "));
  return prepared.request;
}

function buildInput({ idempotencyKey, expectedRevision, total }) {
  return {
    tournamentId,
    scoreId: `${charreadaId}__${teamId}__${suerteId}`,
    idempotencyKey,
    expectedRevision,
    source: "charropro-calificador",
    device: {
      deviceId: "device-test",
      platform: "test",
      userAgent: "CharroPro Test"
    },
    scorePayload: [{ base: total, total }],
    publishedScore: {
      attemptKey,
      tournament: { id: tournamentId, name: "Torneo Concurrency" },
      charreada: {
        id: charreadaId,
        name: "Charreada Concurrency",
        competitionId: "equipos_completo",
        competitionType: "equipos_completo"
      },
      competition: { id: "equipos_completo", type: "equipos_completo", scope: "team" },
      team: { id: teamId, name: "Equipo Concurrency" },
      suerte: { id: suerteId, name: "Cala", attempts: 1 },
      attemptIndex: 0,
      coleadorIndex: 0,
      attempt: { base: total, total },
      breakdown: { total },
      total
    },
    livePayload: {
      tournament: { id: tournamentId },
      charreada: { id: charreadaId },
      published: { id: "client-provisional", revision: 999 }
    }
  };
}

function buildTournament() {
  return {
    info: {
      id: tournamentId,
      name: "Torneo Concurrency",
      status: "en_vivo"
    },
    meta: {
      activeCharreadaId: charreadaId
    },
    charreadas: {
      [charreadaId]: {
        id: charreadaId,
        status: "en_vivo",
        competitionId: "equipos_completo",
        competitionType: "equipos_completo",
        teamIds: [teamId],
        suerteIds: [suerteId]
      }
    },
    teams: {
      [teamId]: { id: teamId, name: "Equipo Concurrency" }
    },
    scores: {},
    publishedScores: {}
  };
}

function createTransactionalStore(initial) {
  let value = structuredClone(initial);
  let queue = Promise.resolve();
  return {
    transact(request) {
      const work = queue.then(async () => {
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3)));
        const applied = applyOfficialScoreTransaction(value, request);
        value = applied.tournament;
        return structuredClone(applied);
      });
      queue = work.then(() => undefined, () => undefined);
      return work;
    },
    read() {
      return structuredClone(value);
    }
  };
}

function ledgerFor(tournament) {
  const ledgers = Object.values(tournament.officialScoreLedger || {});
  assert.equal(ledgers.length, 1);
  return ledgers[0];
}

function activeRecords(tournament, key) {
  return Object.values(tournament.publishedScores || {}).filter((record) => (
    record.attemptKey === key && record.superseded !== true && record.officialStatus === "active"
  ));
}
