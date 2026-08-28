import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PENDING_SCORE_REVIEW_STATUSES,
  buildPendingScoreReviewId,
  buildScorerReturnContext,
  closePendingScoreReview,
  createPendingScoreReview,
  listPendingScoreReviews,
  openPendingScoreReview,
  putPendingScoreReview,
  resolvePendingScoreReview,
  updatePendingScoreReviewDraft,
  validatePendingScoreReview
} from "../js/core/pendingScoreReview.js?v=20260828-fmch-terna-participant-identity-roster-persistence-001-v1";

const actor = Object.freeze({
  uid: "judge-local-1",
  name: "Juez Local",
  role: "juez",
  clientId: "device-a",
  tabSessionId: "tab-a"
});

const definition = {
  tournamentId: "demo-local-fmch-2026",
  competitionId: "equipos_completo",
  charreadaId: "demo-local-fmch-jornada-1",
  teamId: "equipo-a",
  participantId: "",
  participantScope: "team",
  suerteId: "manganas_pie",
  attemptIndex: 1,
  coleadorIndex: 0,
  sharedOpportunityId: "manganas-pie-op-2",
  sharedSequenceNumber: 2,
  scoreId: "demo-local-fmch-jornada-1__equipo-a__manganas_pie",
  reason: { code: "video_review", label: "Revisión de video", note: "Confirmar remate" },
  draftSnapshot: {
    scorePayload: [{ base: 0 }, {
      base: 23,
      adic: 4,
      infr: 2,
      desc: "DQ provisional",
      notAchieved: true,
      note: "Nota del juez",
      timeEvidence: [{ id: "evidence-1", kind: "video", second: 18 }],
      timing: { timerId: "timer-mp", elapsedMs: 28000, remainingMs: 92000 },
      floreoTotal: 4,
      floreoDetail: [{ id: "floreo-1", points: 2 }],
      pullCount: 2,
      remateId: "remate-rodado",
      classification: { classificationId: "libre", classificationLabel: "Libre" },
      customAdic: [{ id: "manual-a", pts: 1 }],
      customInfr: [{ id: "manual-i", pts: 1 }],
      teamPenalties: [{ id: "team-i", total: 2 }],
      attempted: true
    }],
    attemptV2: { attemptVersion: "2.0.0", status: "DRAFT" }
  },
  metadata: { suerteName: "Manganas a Pie", entryName: "Equipo A", opportunityNumber: 2 }
};

const created = createPendingScoreReview(definition, {
  actor,
  now: "2026-08-11T12:00:00.000Z"
});
assert.equal(validatePendingScoreReview(created).valid, true);
assert.equal(created.status, PENDING_SCORE_REVIEW_STATUSES.PENDING);
assert.equal(created.revision, 1);
assert.equal(created.pendingId, buildPendingScoreReviewId(definition));
assert.equal(created.draftSnapshot.scorePayload[1].desc, "DQ provisional");
assert.equal(created.draftSnapshot.scorePayload[1].notAchieved, true);
assert.equal(created.draftSnapshot.scorePayload[1].customAdic[0].pts, 1);
assert.equal(created.draftSnapshot.scorePayload[1].customInfr[0].pts, 1);
assert.equal(created.draftSnapshot.scorePayload[1].timeEvidence[0].second, 18);
assert.equal(created.draftSnapshot.scorePayload[1].timing.timerId, "timer-mp");
assert.equal(created.draftSnapshot.scorePayload[1].floreoTotal, 4);
assert.equal(created.draftSnapshot.scorePayload[1].remateId, "remate-rodado");

definition.draftSnapshot.scorePayload[1].base = 999;
assert.equal(created.draftSnapshot.scorePayload[1].base, 23, "create must not retain mutable source references");

const firstPut = putPendingScoreReview({}, created);
assert.equal(firstPut.ok, true);
const duplicatePut = putPendingScoreReview(firstPut.registry, created);
assert.equal(duplicatePut.ok, true);
assert.equal(duplicatePut.idempotent, true);
assert.equal(listPendingScoreReviews(duplicatePut.registry, { status: "pending_review" }).length, 1);

const returnContext = buildScorerReturnContext({
  tournamentId: definition.tournamentId,
  competitionId: definition.competitionId,
  charreadaId: definition.charreadaId,
  teamId: "equipo-b",
  suerteId: "manganas_caballo",
  scoringTeamIdx: 1,
  scoringSuerteIdx: 8,
  scoringAttemptIdx: 1,
  scoringColeadorIdx: 0,
  sharedOpportunityId: "mc-op-2",
  sharedSequenceNumber: 2,
  returnDraft: {
    scoreId: "demo-local-fmch-jornada-1__equipo-b__manganas_caballo",
    scorePayload: [{ base: 0 }, { base: 18, note: "Borrador operativo" }]
  }
});
const opened = openPendingScoreReview(created, {
  actor,
  expectedRevision: 1,
  returnContext,
  now: "2026-08-11T12:01:00.000Z"
});
assert.equal(opened.ok, true);
assert.equal(opened.record.revision, 2);
assert.deepEqual(opened.record.returnContext, returnContext);
assert.equal(opened.record.resolutionSession.status, "open");
assert.equal(opened.record.resolutionSession.openedBy.tabSessionId, "tab-a");

returnContext.scoringTeamIdx = 99;
returnContext.returnDraft.scorePayload[1].base = 999;
assert.equal(opened.record.returnContext.scoringTeamIdx, 1, "return context must be detached");
assert.equal(opened.record.returnContext.returnDraft.scorePayload[1].base, 18, "return draft must be detached");

const staleDraft = updatePendingScoreReviewDraft(opened.record, {
  actor,
  expectedRevision: 1,
  draftSnapshot: { scorePayload: [] }
});
assert.equal(staleDraft.ok, false);
assert.equal(staleDraft.conflict, true);
assert.equal(staleDraft.record.revision, 2);

const updatedDraft = updatePendingScoreReviewDraft(opened.record, {
  actor,
  expectedRevision: 2,
  now: "2026-08-11T12:02:00.000Z",
  draftSnapshot: {
    ...opened.record.draftSnapshot,
    scorePayload: [{ base: 0 }, { ...opened.record.draftSnapshot.scorePayload[1], base: 25 }]
  }
});
assert.equal(updatedDraft.ok, true);
assert.equal(updatedDraft.record.revision, 3);
assert.equal(updatedDraft.record.draftSnapshot.scorePayload[1].base, 25);

const cancelled = closePendingScoreReview(updatedDraft.record, {
  actor,
  expectedRevision: 3,
  now: "2026-08-11T12:03:00.000Z",
  draftSnapshot: updatedDraft.record.draftSnapshot
});
assert.equal(cancelled.ok, true);
assert.equal(cancelled.record.status, PENDING_SCORE_REVIEW_STATUSES.PENDING);
assert.equal(cancelled.record.returnContext, null);
assert.equal(cancelled.record.draftSnapshot.scorePayload[1].base, 25);

const reopened = openPendingScoreReview(cancelled.record, {
  actor,
  expectedRevision: 4,
  returnContext: buildScorerReturnContext({ ...returnContext, scoringTeamIdx: 1 }),
  now: "2026-08-11T12:04:00.000Z"
});
assert.equal(reopened.ok, true);

const resolved = resolvePendingScoreReview(reopened.record, {
  actor,
  expectedRevision: 5,
  now: "2026-08-11T12:05:00.000Z",
  officialScore: {
    id: "official-score-1",
    scoreId: definition.scoreId,
    attemptKey: created.attemptKey,
    revision: 1,
    publishedAt: "2026-08-11T12:05:00.000Z"
  }
});
assert.equal(resolved.ok, true);
assert.equal(resolved.record.status, PENDING_SCORE_REVIEW_STATUSES.RESOLVED);
assert.equal(resolved.record.officialScore.id, "official-score-1");
assert.equal(resolved.record.returnContext.scoringTeamIdx, 1);
assert.equal(resolved.record.audit.at(-1).operation, "resolved");

const idempotentResolve = resolvePendingScoreReview(resolved.record, {
  actor,
  expectedRevision: 6,
  officialScore: { id: "official-score-1" }
});
assert.equal(idempotentResolve.ok, true);
assert.equal(idempotentResolve.idempotent, true);
assert.equal(idempotentResolve.record.revision, 6);

const conflictingResolve = resolvePendingScoreReview(resolved.record, {
  actor,
  expectedRevision: 6,
  officialScore: { id: "official-score-2" }
});
assert.equal(conflictingResolve.ok, false);
assert.equal(conflictingResolve.conflict, true);

const malicious = createPendingScoreReview({
  ...definition,
  draftSnapshot: {
    validZero: 0,
    validFalse: false,
    validEmpty: "",
    fn: () => "blocked",
    nested: { constructor: { polluted: true }, prototype: { polluted: true } }
  }
}, { actor, now: "2026-08-11T13:00:00.000Z" });
assert.equal(malicious.draftSnapshot.validZero, 0);
assert.equal(malicious.draftSnapshot.validFalse, false);
assert.equal(malicious.draftSnapshot.validEmpty, "");
assert.equal("fn" in malicious.draftSnapshot, false);
assert.equal(Object.hasOwn(malicious.draftSnapshot.nested, "constructor"), false);
assert.equal(Object.hasOwn(malicious.draftSnapshot.nested, "prototype"), false);

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const firebaseSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8"));
assert.match(appSource, /publishOfficialScoreForContext\(publicationContext/);
assert.doesNotMatch(appSource, /function\s+publishPendingScore/);
assert.match(appSource, /completePendingResolutionAfterPublish\(publishResult\)/);
assert.match(appSource, /scheduleActivePendingDraftSync\(\)/);
assert.match(appSource, /sessionStorage\.getItem\(key\)/);
assert.match(appSource, /openedBy\?\.tabSessionId === pendingReviewTabSessionId/);
assert.doesNotMatch(appSource, /openedBy\?\.clientId === firebaseClientId/);
assert.match(
  appSource,
  /function recoverPendingResolutionSession\(\)[\s\S]*markActiveScoringDraft\(getCurrentContext\(\)\);/,
  "reload recovery must reactivate the existing draft guard before remote scores hydrate"
);
for (const action of [
  "show-pending-review-create",
  "show-pending-review-list",
  "close-pending-review-panel",
  "confirm-pending-review",
  "open-pending-review",
  "cancel-pending-resolution"
]) {
  assert.match(appSource, new RegExp(`"${action}": "score"`), `${action} must remain available to the Judge role`);
}
assert.match(firebaseSource, /runTransaction\(ref\(getFirebaseDatabase\(\), path\)/);
assert.match(firebaseSource, /pendingScoreReviews: _transactionalPendingScoreReviews/);
assert.match(firebaseSource, /subscribeFirebasePendingScoreReviews/);
assert.ok(rules.rules.charropro.tournaments.$tournamentId.pendingScoreReviews.$pendingId);
assert.doesNotMatch(
  rules.rules.charropro.tournaments.$tournamentId.pendingScoreReviews.$pendingId[".write"],
  /role'\)\.val\(\) === 'operador'/
);
assert.match(
  rules.rules.charropro.tournaments.$tournamentId.pendingScoreReviews.$pendingId[".write"],
  /role'\)\.val\(\) === 'juez'/
);
assert.match(
  rules.rules.charropro.tournaments.$tournamentId.pendingScoreReviews.$pendingId[".write"],
  /role'\)\.val\(\) === 'supervisor'/
);

console.log("pending score review workflow tests passed");
