import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire, registerHooks } from "node:module";
import { listPublicLiveFeedEvents, validatePublicLiveFeed } from "../js/public/publicLiveFeed.js";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));

const {
  applyOfficialScoreTransaction,
  buildOfficialScoreFanoutUpdates,
  prepareOfficialScoreRequest
} = officialScoreConcurrency;

const TEST_STATE_KEY = "__charroProPublicFeedFirebaseTest";
const firebase = createFirebaseTestAdapter();
globalThis[TEST_STATE_KEY] = firebase;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("https://www.gstatic.com/firebasejs/12.13.0/")) {
      const moduleName = specifier.split("/").at(-1);
      return {
        shortCircuit: true,
        url: `charropro-firebase-test:${moduleName}`
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.startsWith("charropro-firebase-test:")) return nextLoad(url, context);
    const moduleName = url.slice("charropro-firebase-test:".length);
    return {
      format: "module",
      shortCircuit: true,
      source: firebaseModuleSource(moduleName)
    };
  }
});

const firebaseSync = await import(`../js/core/firebaseSync.js?public-feed-integration=${Date.now()}`);
const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const firebaseSyncImportVersions = await collectFirebaseSyncImportVersions(new URL("../js/", import.meta.url));
const tournamentId = "tournament-feed-integration";
const charreadaId = "charreada-feed-integration";
const teamId = "team-feed-integration";

assert.deepEqual(
  [...firebaseSyncImportVersions],
  ["20260811-official-timer-authority-sync-001-v1"],
  "all browser entrypoints share one firebaseSync module identity"
);

assert.equal(
  firebaseSync.getFirebasePublicProjectionOutboxJobPath(tournamentId, "../projection"),
  "",
  "projection paths reject ambiguous identifiers"
);

firebase.seed({
  charropro: {
    tournaments: {
      [tournamentId]: {
        info: {
          id: tournamentId,
          nombre: "Torneo Feed Integration",
          type: "completo"
        },
        meta: {
          activeCharreadaId: charreadaId,
          updatedAt: "2026-07-28T10:00:00.000Z"
        },
        teams: {
          [teamId]: { id: teamId, name: "Equipo Integration" }
        },
        charreadas: {
          [charreadaId]: {
            id: charreadaId,
            name: "Charreada Integration",
            status: "en_vivo",
            competitionId: "equipos_completo",
            competitionType: "equipos_completo",
            teamIds: [teamId],
            suerteIds: ["cala", "piales"]
          }
        },
        scores: {},
        publishedScores: {}
      }
    },
    live: {},
    publicTournaments: {},
    audit: { publishedScores: {} }
  }
});
firebase.requireFreshOutboxTransition = true;

const first = await publishOfficial({
  publishedId: "published-integration-1",
  scoreId: "score-integration-1",
  suerteId: "cala",
  total: 10,
  publishedAt: "2026-07-28T10:01:00.000Z",
  actorUid: "forged-user"
});
assert.equal(first.ok, true);
assert.equal(first.complete, true);
assert.equal(first.partialFailure, false);
assert.equal(first.privateWrite.ok, true);
assert.equal(first.publicSnapshot.ok, true);
assert.equal(first.publicSnapshot.publicSnapshotValidation, true);
assert.equal(firebase.privateWriteCount, 1, "private score is written once");
assert.equal(
  firebase.read(`${first.projectionOutboxPath}/intent/createdBy/uid`),
  "test-user",
  "the authenticated Firebase user overrides a forged actor uid"
);
const firstOutboxState = firebase.read(`${first.projectionOutboxPath}/state`);
assert.equal(firstOutboxState.status, "CLIENT_CONFIRMED");
assert.equal(firstOutboxState.attempts, 1);
assert.ok(firstOutboxState.projectedAt);
assert.ok(firstOutboxState.clientConfirmedAt);
assert.ok(firstOutboxState.targetRevision >= 1);
assert.ok(firstOutboxState.targetFingerprint);
assert.ok(
  firebase.freshOutboxStateReads >= 2,
  "PROJECTED and CLIENT_CONFIRMED refresh the durable state before each CAS"
);
const stableConfirmed = await firebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor" },
  { nowMs: Date.parse("2026-07-28T10:01:30.000Z") }
);
assert.equal(stableConfirmed.ok, true);
assert.equal(firebase.read(`${first.projectionOutboxPath}/state`).attempts, 1);
assert.equal(
  stableConfirmed.jobs.find((job) => job.projectionId === first.projectionId)?.status,
  "CLIENT_CONFIRMED",
  "a confirmed job is never claimed again"
);

const publicPath = `charropro/publicTournaments/${tournamentId}`;
const firstProjection = firebase.read(publicPath);
assertFirebaseSdkSerializable(firstProjection);
assert.equal(firstProjection.schemaVersion, 2);
assert.equal(firstProjection.projectionRevision, 1);
assert.equal(firstProjection.liveFeed.revision, 1);
assert.equal(firstProjection.liveFeed.status, "live");
assert.equal(validatePublicLiveFeed(firstProjection.liveFeed).valid, true);
const firstEvents = listPublicLiveFeedEvents(firstProjection.liveFeed);
assert.equal(firstEvents.length, 1);
assert.ok(firstEvents[0].eventId);
assert.equal(firstEvents[0].eventType, "score_published");
assert.ok(Number.isSafeInteger(firstEvents[0].sequence) && firstEvents[0].sequence > 0);
assert.equal(firstEvents[0].revision, 1);
assert.equal(firstEvents[0].occurredAt, Date.parse("2026-07-28T10:01:00.000Z"));
assert.equal(firstEvents[0].publishedAt, Date.parse("2026-07-28T10:01:00.000Z"));
assert.equal(firstEvents[0].score, 10);
assert.equal(firstEvents[0].teamId, teamId);
assert.equal(firstEvents[0].suerteId, "cala");
assert.equal(firstEvents[0].status, "official");

const second = await publishOfficial({
  publishedId: "published-integration-2",
  scoreId: "score-integration-2",
  suerteId: "piales",
  total: 25,
  publishedAt: "2026-07-28T10:02:00.000Z"
});
assert.equal(second.ok, true);
assert.equal(second.complete, true);
assert.equal(second.partialFailure, false);
assert.equal(second.publicSnapshot.ok, true);
assert.equal(firebase.privateWriteCount, 2);
const secondProjection = firebase.read(publicPath);
assert.equal(secondProjection.projectionRevision, 2);
assert.equal(secondProjection.liveFeed.revision, 2);
assert.equal(listPublicLiveFeedEvents(secondProjection.liveFeed).length, 2);

firebase.failPublicTransactions = true;
const beforePartialProjection = firebase.read(publicPath);
const partial = await publishOfficial({
  publishedId: "published-integration-3",
  scoreId: "score-integration-3",
  suerteId: "colas",
  total: 33,
  publishedAt: "2026-07-28T10:03:00.000Z"
});
assert.equal(partial.ok, true, "private publication remains successful");
assert.equal(partial.complete, false);
assert.equal(partial.partialFailure, true);
assert.equal(partial.privateWrite.ok, true);
assert.equal(partial.publicSnapshot.ok, false);
assert.equal(partial.publicSnapshot.reason, "permission-denied");
assert.equal(partial.publicSnapshot.errorMessage, "No se pudo actualizar la proyección pública.");
assert.equal(firebase.privateWriteCount, 3, "partial failure never repeats the private write");
assert.equal(
  Object.keys(firebase.read(`charropro/tournaments/${tournamentId}/publishedScores`)).length,
  3,
  "the third official score remains privately published once"
);
assert.deepEqual(firebase.read(publicPath), beforePartialProjection, "failed public transaction is atomic");
assert.equal(JSON.stringify(partial).includes("AIza"), false);
assert.equal(JSON.stringify(partial).includes("credentials"), false);

const partialOutboxPath = partial.projectionOutboxPath;
const partialJob = firebase.read(partialOutboxPath);
assert.equal(partialJob.intent.projectionId, partial.projectionId);
assert.equal(partialJob.intent.sourceId, partial.id);
assert.equal(partialJob.intent.scoreId, `${charreadaId}__${teamId}__colas`);
assert.equal(partialJob.intent.sourceRevision, 1);
assert.equal(partialJob.intent.targetPath, publicPath);
assert.equal(partialJob.state.status, "RETRY_WAIT");
assert.equal(partialJob.state.attempts, 1);
assert.equal(partialJob.state.lastErrorCode, "permission-denied");
assert.ok(partialJob.state.nextRetryAtMs > partialJob.state.lastAttemptAtMs);
assert.equal(JSON.stringify(partialJob).includes("AIza"), false);
assert.equal(JSON.stringify(partialJob).includes("credentials"), false);

firebase.failPublicTransactions = false;
const restartedFirebaseSync = await import(`../js/core/firebaseSync.js?public-feed-restart=${Date.now()}`);
const recovered = await restartedFirebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor", clientId: "new-browser" },
  {
    nowMs: partialJob.state.nextRetryAtMs + 1,
    jitter: false
  }
);
assert.equal(recovered.ok, true, "a new module instance recovers the durable job");
assert.equal(recovered.jobs.find((job) => job.projectionId === partial.projectionId)?.status, "CLIENT_CONFIRMED");
assert.equal(firebase.read(`${partialOutboxPath}/state`).status, "CLIENT_CONFIRMED");
assert.equal(firebase.read(publicPath).projectionRevision, 3);
assert.equal(listPublicLiveFeedEvents(firebase.read(publicPath).liveFeed).length, 3);

const outboxBeforeDuplicate = firebase.read(`charropro/projectionOutbox/${tournamentId}`);
const duplicate = await publishOfficial({
  publishedId: "published-integration-3",
  scoreId: "score-integration-3",
  suerteId: "colas",
  total: 33,
  publishedAt: "2026-07-28T10:03:00.000Z"
});
assert.equal(duplicate.projectionId, partial.projectionId, "equivalent publication reuses projection identity");
assert.equal(duplicate.projectionJob.status, "CLIENT_CONFIRMED");
assert.equal(
  Object.keys(firebase.read(`charropro/projectionOutbox/${tournamentId}`)).length,
  Object.keys(outboxBeforeDuplicate).length,
  "equivalent publication does not create another durable job"
);
assert.equal(
  Object.keys(firebase.read(`charropro/tournaments/${tournamentId}/publishedScores`)).length,
  3,
  "equivalent publication does not duplicate the official score"
);

firebase.failAfterPublicCommitOnce = true;
const uncertain = await publishOfficial({
  publishedId: "published-integration-4",
  scoreId: "score-integration-4",
  suerteId: "toro",
  total: 41,
  publishedAt: "2026-07-28T10:04:00.000Z"
});
assert.equal(uncertain.ok, true);
assert.equal(uncertain.partialFailure, true, "a timeout after the public commit stays pending");
assert.equal(firebase.read(`${uncertain.projectionOutboxPath}/state`).status, "RETRY_WAIT");
const uncertainRetry = await restartedFirebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor" },
  {
    projectionIds: [uncertain.projectionId],
    manual: true,
    nowMs: Date.parse("2026-07-28T10:04:05.000Z"),
    jitter: false
  }
);
assert.equal(uncertainRetry.ok, true);
assert.equal(firebase.read(`${uncertain.projectionOutboxPath}/state`).status, "CLIENT_CONFIRMED");
assert.equal(
  Object.keys(firebase.read(`charropro/tournaments/${tournamentId}/publishedScores`)).length,
  4,
  "retry after uncertain public commit never rewrites or duplicates the private score"
);

firebase.failPublicTransactions = true;
const staleRevision = await publishOfficial({
  publishedId: "published-correction-1",
  scoreId: "score-correction",
  suerteId: "piales",
  total: 18,
  revision: 2,
  publishedAt: "2026-07-28T10:05:00.000Z"
});
assert.equal(staleRevision.partialFailure, true);
firebase.failPublicTransactions = false;
const currentRevision = await publishOfficial({
  publishedId: "published-correction-2",
  scoreId: "score-correction",
  suerteId: "piales",
  total: 28,
  revision: 3,
  publishedAt: "2026-07-28T10:06:00.000Z"
});
assert.equal(currentRevision.complete, true);
assert.notEqual(currentRevision.projectionId, staleRevision.projectionId);
assert.equal(firebase.read(`${staleRevision.projectionOutboxPath}/state`).status, "SUPERSEDED");
assert.equal(
  firebase.read(`${staleRevision.projectionOutboxPath}/state`).supersededBy,
  currentRevision.projectionId
);
assert.equal(firebase.read(`${currentRevision.projectionOutboxPath}/state`).status, "CLIENT_CONFIRMED");
const staleRetry = await restartedFirebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor" },
  {
    projectionIds: [staleRevision.projectionId],
    manual: true,
    nowMs: Date.parse("2026-07-28T10:07:00.000Z")
  }
);
assert.equal(staleRetry.jobs[0].status, "SUPERSEDED");
assert.equal(
  firebase.read(`${staleRevision.projectionOutboxPath}/state`).status,
  "SUPERSEDED",
  "an old projection can never replace the current revision"
);

firebase.failPublicTransactions = true;
const missingSource = await publishOfficial({
  publishedId: "published-missing-source",
  scoreId: "score-missing-source",
  suerteId: "manganas_pie",
  total: 12,
  publishedAt: "2026-07-28T10:08:00.000Z"
});
const missingSourcePath = missingSource.publishedPath;
const missingSourceRecord = firebase.read(missingSourcePath);
firebase.write(missingSourcePath, null);
firebase.failPublicTransactions = false;
const deadLetter = await restartedFirebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor" },
  {
    projectionIds: [missingSource.projectionId],
    manual: true,
    nowMs: Date.parse("2026-07-28T10:09:00.000Z"),
    jitter: false
  }
);
assert.equal(deadLetter.jobs[0].status, "DEAD_LETTER");
const deadLetterState = firebase.read(`${missingSource.projectionOutboxPath}/state`);
assert.equal(deadLetterState.deadLetterReason, "missing-projection-source");
assert.equal(deadLetterState.nextRetryAtMs, 0, "non-recoverable error has no retry loop");
assert.equal(JSON.stringify(deadLetterState).includes("credentials"), false);

const unauthorizedRetry = await restartedFirebaseSync.retryFirebasePublicProjectionJob(
  tournamentId,
  missingSource.projectionId,
  { uid: "announcer", role: "locutor" }
);
assert.equal(unauthorizedRetry.ok, false);
assert.equal(unauthorizedRetry.reason, "projection-recovery-not-authorized");

firebase.write(missingSourcePath, missingSourceRecord);
const repaired = await restartedFirebaseSync.retryFirebasePublicProjectionJob(
  tournamentId,
  missingSource.projectionId,
  { uid: "recovery-user", role: "supervisor" },
  {
    nowMs: Date.parse("2026-07-28T10:10:00.000Z"),
    jitter: false
  }
);
assert.equal(repaired.ok, true, "authorized manual repair converges after the source is restored");
assert.equal(firebase.read(`${missingSource.projectionOutboxPath}/state`).status, "CLIENT_CONFIRMED");
const verifiedAgain = await restartedFirebaseSync.verifyFirebasePublicProjectionJob(
  tournamentId,
  missingSource.projectionId,
  { uid: "recovery-user", role: "supervisor" },
  { nowMs: Date.parse("2026-07-28T10:11:00.000Z") }
);
assert.equal(verifiedAgain.ok, true);
assert.equal(verifiedAgain.clientConfirmed, true);
assert.equal(verifiedAgain.authoritativelyVerified, false);
assert.equal(verifiedAgain.status, "CLIENT_CONFIRMED");
assert.equal(
  firebase.read(`${missingSource.projectionOutboxPath}/state`).status,
  "CLIENT_CONFIRMED",
  "diagnostic readback does not mutate the job to VERIFIED"
);

firebase.failOutboxTransactionsOnce = true;
const claimFailure = await publishOfficial({
  publishedId: "published-claim-failure",
  scoreId: "score-claim-failure",
  suerteId: "manganas_caballo",
  total: 17,
  publishedAt: "2026-07-28T10:12:00.000Z"
});
assert.equal(claimFailure.ok, true, "a claim failure does not misreport the completed private write");
assert.equal(claimFailure.privateWrite.ok, true);
assert.equal(claimFailure.partialFailure, true);
assert.equal(firebase.read(claimFailure.projectionOutboxPath).intent.projectionId, claimFailure.projectionId);
assert.equal(firebase.read(`${claimFailure.projectionOutboxPath}/state`), undefined);
const recoveredClaimFailure = await restartedFirebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor" },
  {
    projectionIds: [claimFailure.projectionId],
    manual: true,
    nowMs: Date.parse("2026-07-28T10:12:05.000Z"),
    jitter: false
  }
);
assert.equal(recoveredClaimFailure.ok, true);
assert.equal(firebase.read(`${claimFailure.projectionOutboxPath}/state`).status, "CLIENT_CONFIRMED");

firebase.failProjectedTransitionOnce = true;
const projectedTransitionFailure = await publishOfficial({
  publishedId: "published-projected-transition-failure",
  scoreId: "score-projected-transition-failure",
  suerteId: "paso",
  total: 22,
  publishedAt: "2026-07-28T10:13:00.000Z"
});
assert.equal(projectedTransitionFailure.ok, true, "the official score remains durable when PROJECTED is rejected");
assert.equal(projectedTransitionFailure.privateWrite.ok, true);
assert.equal(projectedTransitionFailure.partialFailure, true);
const projectedFailureState = firebase.read(`${projectedTransitionFailure.projectionOutboxPath}/state`);
assert.equal(projectedFailureState.status, "RETRY_WAIT");
assert.equal(projectedFailureState.attempts, 1);
assert.equal(projectedFailureState.lastErrorCode, "permission-denied");
assert.equal(projectedFailureState.projectedAt, "");
assert.equal(projectedFailureState.clientConfirmedAt, "");
const projectedTransitionRecovered = await restartedFirebaseSync.reconcileFirebasePublicProjectionOutbox(
  tournamentId,
  { uid: "recovery-user", role: "supervisor" },
  {
    projectionIds: [projectedTransitionFailure.projectionId],
    manual: true,
    nowMs: Date.parse("2026-07-28T10:13:05.000Z"),
    jitter: false
  }
);
assert.equal(projectedTransitionRecovered.ok, true);
const projectedRecoveredState = firebase.read(`${projectedTransitionFailure.projectionOutboxPath}/state`);
assert.equal(projectedRecoveredState.status, "CLIENT_CONFIRMED");
assert.equal(projectedRecoveredState.attempts, 2);
assert.ok(projectedRecoveredState.projectedAt);
assert.ok(projectedRecoveredState.clientConfirmedAt);

const backlog = await restartedFirebaseSync.readFirebasePublicProjectionOutbox(tournamentId);
assert.equal(backlog.ok, true);
assert.equal(backlog.pending, 0);
assert.equal(backlog.retry, 0);
assert.equal(backlog.deadLetter, 0);
assert.ok(backlog.clientConfirmed >= 5);
assert.equal(backlog.verified, 0);
assert.ok(backlog.counts.SUPERSEDED >= 1);

assert.match(appSource, /result\.publicSnapshot\?\.ok === false/);
assert.match(appSource, /result\.partialFailure === true/);
assert.match(appSource, /Guardado; recuperación pública pendiente/);
assert.match(appSource, /La recuperación del Portal Público quedó programada\./);
assert.match(appSource, /schedulePublicProjectionRecovery\(1500\)/);
assert.match(appSource, /window\.setInterval\(\(\) => \{[\s\S]*?runPublicProjectionRecovery[\s\S]*?30000/);
assert.match(appSource, /window\.addEventListener\("online"[\s\S]*?schedulePublicProjectionRecovery\(250\)/);
assert.match(appSource, /configurePublicProjectionRecovery\(\)/);
assert.match(appSource, /retryFirebasePublicProjectionJob/);
assert.match(appSource, /retryAllFirebasePublicProjectionJobs/);
assert.match(appSource, /verifyFirebasePublicProjectionJob/);
assert.match(appSource, />Proyección pública</);
assert.match(appSource, />Proyección escrita</);
assert.match(appSource, />Verificación autoritativa pendiente</);
assert.match(appSource, />Verificados por autoridad</);
assert.match(appSource, />Diagnosticar</);
assert.doesNotMatch(appSource, />Verificar</);
assert.doesNotMatch(appSource, /reparada y verificada/);
assert.doesNotMatch(appSource, /elegibles quedaron verificadas/);
const diagnosticSource = String(
  restartedFirebaseSync.verifyFirebasePublicProjectionJob
);
assert.doesNotMatch(
  diagnosticSource,
  /transitionFirebaseProjectionState|PUBLIC_PROJECTION_STATUSES\.VERIFIED/,
  "the manual verification action remains a read-only diagnostic"
);
assert.equal(
  appSource.slice(
    appSource.indexOf("async function publishOfficialScoreForContext"),
    appSource.indexOf("function continueOfficialScoreFlowAfterPublish")
  ).includes("publishFirebaseOfficialScoreAtomic("),
  true
);

const sharedTournamentId = "tournament-shared-score-guard";
const sharedCharreadaId = "charreada-shared-score-guard";
const sharedTeamId = "team-shared-score-guard";
const remote453 = Object.fromEntries(
  Array.from({ length: 453 }, (_, index) => [
    `${sharedCharreadaId}__${sharedTeamId}__suerte_${String(index).padStart(3, "0")}`,
    [{ total: index }]
  ])
);
const local450 = Object.fromEntries(Object.entries(remote453).slice(0, 450));
const sharedAppState = buildSharedTournamentAppState(local450);

firebase.seed({
  charropro: {
    tournaments: {
      [sharedTournamentId]: buildSharedTournamentRecord(remote453)
    },
    tournamentIndex: {},
    publicTournaments: {},
    audit: {
      publishedScores: {
        [sharedTournamentId]: {
          audit_a: { result: "SUCCESS" }
        }
      }
    }
  }
});

const blockedSharedWrite = await firebaseSync.publishFirebaseTournamentState(
  sharedTournamentId,
  sharedAppState,
  { uid: "shared-guard-user", role: "supervisor" }
);
assert.equal(blockedSharedWrite.ok, false, "453 remote / 450 local aborts the shared write");
assert.equal(blockedSharedWrite.reason, "remote-score-ids-missing");
assert.equal(blockedSharedWrite.scoreWriteGuard.countRemote, 453);
assert.equal(blockedSharedWrite.scoreWriteGuard.countProposed, 450);
assert.equal(blockedSharedWrite.scoreWriteGuard.missingRemoteIds.length, 3);
assert.equal(
  Object.keys(firebase.read(`charropro/tournaments/${sharedTournamentId}/scores`)).length,
  453,
  "the remote score universe remains complete"
);

const idsABC = ["a", "b", "c"].map((suffix) => `${sharedCharreadaId}__${sharedTeamId}__${suffix}`);
const remoteABC = Object.fromEntries(idsABC.map((scoreId, index) => [scoreId, [{ total: index + 1 }]]));
firebase.seed({
  charropro: {
    tournaments: {
      [sharedTournamentId]: buildSharedTournamentRecord(remoteABC)
    },
    tournamentIndex: {},
    publicTournaments: {},
    audit: {
      publishedScores: {
        [sharedTournamentId]: {
          audit_a: { result: "SUCCESS" }
        }
      }
    }
  }
});

const missingCState = buildSharedTournamentAppState({
  [idsABC[0]]: [{ total: 100 }],
  [idsABC[1]]: [{ total: 200 }]
});
const beforeBlockedTournament = firebase.read(`charropro/tournaments/${sharedTournamentId}`);
const blockedC = await firebaseSync.publishFirebaseTournamentState(
  sharedTournamentId,
  missingCState,
  { uid: "shared-guard-user", role: "supervisor" }
);
assert.equal(blockedC.ok, false);
assert.deepEqual(blockedC.scoreWriteGuard.missingRemoteIds, [idsABC[2]]);
assert.deepEqual(
  firebase.read(`charropro/tournaments/${sharedTournamentId}`),
  beforeBlockedTournament,
  "a blocked replacement is atomic"
);

const sameIdsState = buildSharedTournamentAppState({
  [idsABC[0]]: [{ total: 100 }],
  [idsABC[1]]: [{ total: 200 }],
  [idsABC[2]]: [{ total: 300 }]
});
const publishedBeforeSharedWrite = firebase.read(`charropro/tournaments/${sharedTournamentId}/publishedScores`);
const auditBeforeSharedWrite = firebase.read(`charropro/audit/publishedScores/${sharedTournamentId}`);
const allowedSharedWrite = await firebaseSync.publishFirebaseTournamentState(
  sharedTournamentId,
  sameIdsState,
  { uid: "shared-guard-user", role: "supervisor" }
);
assert.equal(allowedSharedWrite.ok, true);
assert.equal(allowedSharedWrite.scoreWriteGuard.missingRemoteIds.length, 0);
assert.deepEqual(
  firebase.read(`charropro/tournaments/${sharedTournamentId}/scores`),
  remoteABC,
  "shared state never rewrites score payloads even when all IDs match"
);
assert.deepEqual(
  firebase.read(`charropro/tournaments/${sharedTournamentId}/publishedScores`),
  publishedBeforeSharedWrite,
  "shared state preserves publishedScores"
);
assert.deepEqual(
  firebase.read(`charropro/audit/publishedScores/${sharedTournamentId}`),
  auditBeforeSharedWrite,
  "shared state preserves the official audit"
);

const individualScoreWrite = await firebaseSync.publishFirebaseScore(
  sharedTournamentId,
  idsABC[0],
  [{ total: 999 }],
  { uid: "judge-test", role: "juez" }
);
assert.equal(individualScoreWrite.ok, true);
assert.deepEqual(firebase.read(`charropro/tournaments/${sharedTournamentId}/scores/${idsABC[0]}`), [{ total: 999 }]);
assert.deepEqual(firebase.read(`charropro/tournaments/${sharedTournamentId}/scores/${idsABC[1]}`), remoteABC[idsABC[1]]);
assert.deepEqual(firebase.read(`charropro/tournaments/${sharedTournamentId}/scores/${idsABC[2]}`), remoteABC[idsABC[2]]);

const testSyncSource = appSource.slice(
  appSource.indexOf("async function testSync()"),
  appSource.indexOf("async function publishLiveState()")
);
assert.doesNotMatch(testSyncSource, /publishSharedAppState\s*\(/, "Enviar prueba does not publish private shared state");
assert.match(testSyncSource, /saveState\(\{ silent: true \}\)/, "Enviar prueba does not queue a shared-state write indirectly");

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runFirebaseEmulatorSharedScoreGuard();
}

delete globalThis[TEST_STATE_KEY];
console.log("public-live-feed-integration.test.mjs: ok");

async function runFirebaseEmulatorSharedScoreGuard() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const databaseHost = String(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "").trim();
  assert.equal(projectId, "demo-charropro-local", "the score guard fixture only runs against the isolated local project");
  assert.match(databaseHost, /^127\.0\.0\.1:\d+$/, "the fixture requires an explicit loopback RTDB Emulator");
  assert.equal(JSON.stringify(process.env).includes("charropro-e8a68"), false, "the fixture cannot target Production");

  await firebase.connectDatabaseEmulator(projectId, databaseHost);
  const tournamentPath = `charropro/tournaments/${sharedTournamentId}`;
  const publishedPath = `${tournamentPath}/publishedScores`;
  const auditPath = `charropro/audit/publishedScores/${sharedTournamentId}`;
  try {
    await firebase.writeRemote(tournamentPath, buildSharedTournamentRecord(remote453));
    await firebase.writeRemote(`charropro/tournamentIndex/${sharedTournamentId}`, null);
    await firebase.writeRemote(`charropro/publicTournaments/${sharedTournamentId}`, null);
    await firebase.writeRemote(auditPath, { audit_a: { result: "SUCCESS" } });

    const beforeScores = await firebase.readRemote(`${tournamentPath}/scores`);
    const beforePublished = await firebase.readRemote(publishedPath);
    const beforeAudit = await firebase.readRemote(auditPath);
    assert.equal(Object.keys(beforeScores).length, 453);

    const blocked = await firebaseSync.publishFirebaseTournamentState(
      sharedTournamentId,
      buildSharedTournamentAppState(local450),
      { uid: "emulator-shared-guard-user", role: "supervisor" }
    );
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, "remote-score-ids-missing");
    assert.equal(blocked.scoreWriteGuard.countRemote, 453);
    assert.equal(blocked.scoreWriteGuard.countProposed, 450);
    assert.equal(blocked.scoreWriteGuard.missingRemoteIds.length, 3);
    assert.deepEqual(await firebase.readRemote(`${tournamentPath}/scores`), beforeScores);
    assert.deepEqual(await firebase.readRemote(publishedPath), beforePublished);
    assert.deepEqual(await firebase.readRemote(auditPath), beforeAudit);

    const safeShared = await firebaseSync.publishFirebaseTournamentState(
      sharedTournamentId,
      buildSharedTournamentAppState(remote453),
      { uid: "emulator-shared-guard-user", role: "supervisor" }
    );
    assert.equal(safeShared.ok, true);
    assert.equal(safeShared.publicSnapshot?.ok, true, "public snapshot remains operational in Emulator");
    assert.deepEqual(await firebase.readRemote(`${tournamentPath}/scores`), beforeScores);
    assert.deepEqual(await firebase.readRemote(publishedPath), beforePublished);
    assert.deepEqual(await firebase.readRemote(auditPath), beforeAudit);

    const targetScoreId = Object.keys(remote453)[0];
    const individual = await firebaseSync.publishFirebaseScore(
      sharedTournamentId,
      targetScoreId,
      [{ total: 999 }],
      { uid: "emulator-judge", role: "juez" }
    );
    assert.equal(individual.ok, true);
    const afterIndividual = await firebase.readRemote(`${tournamentPath}/scores`);
    assert.equal(Object.keys(afterIndividual).length, 453);
    assert.deepEqual(afterIndividual[targetScoreId], [{ total: 999 }]);
    assert.deepEqual(afterIndividual[Object.keys(remote453)[1]], beforeScores[Object.keys(remote453)[1]]);
  } finally {
    await firebase.writeRemote(tournamentPath, null);
    await firebase.writeRemote(`charropro/tournamentIndex/${sharedTournamentId}`, null);
    await firebase.writeRemote(`charropro/publicTournaments/${sharedTournamentId}`, null);
    await firebase.writeRemote(auditPath, null);
    await firebase.disconnectDatabaseEmulator();
  }
}

async function publishOfficial({
  publishedId,
  scoreId,
  suerteId,
  total,
  publishedAt,
  revision = 1,
  attemptKey = `${tournamentId}__${charreadaId}__${teamId}__${suerteId}__0__0`,
  actorUid = "test-user"
}) {
  const canonicalScoreId = `${charreadaId}__${teamId}__${suerteId}`;
  return firebaseSync.publishFirebaseOfficialScoreAtomic(
    tournamentId,
    canonicalScoreId,
    [{ total }],
    {
      id: publishedId,
      attemptKey,
      publishedAt,
      revision,
      tournament: { id: tournamentId, name: "Torneo Feed Integration" },
      charreada: {
        id: charreadaId,
        name: "Charreada Integration",
        competitionId: "equipos_completo",
        competitionType: "equipos_completo"
      },
      competition: {
        id: "equipos_completo",
        type: "equipos_completo",
        scope: "team"
      },
      team: { id: teamId, name: "Equipo Integration" },
      suerte: { id: suerteId, name: suerteId, attempts: 1 },
      attempt: { total },
      total
    },
    { uid: actorUid, role: "supervisor" },
    {
      nowMs: Date.parse(publishedAt),
      jitter: false,
      livePayload: {
        tournament: { id: tournamentId, name: "Torneo Feed Integration" },
        charreada: { id: charreadaId, name: "Charreada Integration" },
        competitionId: "equipos_completo",
        turn: {
          team: { id: teamId, name: "Equipo Integration" },
          suerte: { id: suerteId, name: suerteId }
        }
      }
    }
  );
}

function buildSharedTournamentRecord(scores) {
  return {
    info: {
      id: sharedTournamentId,
      name: "Shared Score Guard",
      type: "completo"
    },
    meta: {
      version: 7,
      activeCharreadaId: sharedCharreadaId,
      updatedAt: "2026-08-08T12:00:00.000Z",
      updatedAtMs: Date.parse("2026-08-08T12:00:00.000Z")
    },
    teams: {
      [sharedTeamId]: {
        id: sharedTeamId,
        tournamentId: sharedTournamentId,
        name: "Equipo Guard"
      }
    },
    charreadas: {
      [sharedCharreadaId]: {
        id: sharedCharreadaId,
        tournamentId: sharedTournamentId,
        name: "Charreada Guard",
        status: "en_vivo",
        competitionId: "equipos_completo",
        competitionType: "equipos_completo",
        teamIds: [sharedTeamId]
      }
    },
    scores: structuredClone(scores),
    publishedScores: {
      published_a: {
        id: "published_a",
        tournament: { id: sharedTournamentId },
        charreada: { id: sharedCharreadaId },
        team: { id: sharedTeamId, name: "Equipo Guard" },
        suerte: { id: "cala", name: "Cala" },
        total: 1,
        revision: 1,
        superseded: false
      }
    }
  };
}

function buildSharedTournamentAppState(scores) {
  return {
    schemaVersion: 2,
    activeTournamentId: sharedTournamentId,
    activeCharreadaId: sharedCharreadaId,
    tournaments: [{ id: sharedTournamentId, name: "Shared Score Guard", type: "completo" }],
    teams: [{ id: sharedTeamId, tournamentId: sharedTournamentId, name: "Equipo Guard" }],
    charreadas: [{
      id: sharedCharreadaId,
      tournamentId: sharedTournamentId,
      name: "Charreada Guard",
      status: "en_vivo",
      competitionId: "equipos_completo",
      competitionType: "equipos_completo",
      teamIds: [sharedTeamId]
    }],
    scores: structuredClone(scores),
    publishedScores: [],
    statHistorySnapshots: [],
    settings: {}
  };
}

function firebaseModuleSource(moduleName) {
  const state = `globalThis.${TEST_STATE_KEY}`;
  const modules = {
    "firebase-app.js": `
      export const getApps = () => ${state}.getApps();
      export const initializeApp = (config) => ${state}.initializeApp(config);
    `,
    "firebase-auth.js": `
      export const getAuth = (app) => ${state}.getAuth(app);
      export const onAuthStateChanged = (...args) => ${state}.onAuthStateChanged(...args);
      export const signInWithEmailAndPassword = (...args) => ${state}.signInWithEmailAndPassword(...args);
      export const signOut = (...args) => ${state}.signOut(...args);
    `,
    "firebase-database.js": `
      export const getDatabase = (app) => ${state}.getDatabase(app);
      export const ref = (database, path = "") => ${state}.ref(database, path);
      export const get = (target) => ${state}.get(target);
      export const set = (target, value) => ${state}.set(target, value);
      export const update = (target, value) => ${state}.update(target, value);
      export const runTransaction = (target, handler, options) => ${state}.runTransaction(target, handler, options);
      export const onValue = (...args) => ${state}.onValue(...args);
      export const push = (target) => ${state}.push(target);
    `,
    "firebase-functions.js": `
      export const getFunctions = (app, region) => ${state}.getFunctions(app, region);
      export const httpsCallable = (...args) => ${state}.httpsCallable(...args);
    `
  };
  if (!modules[moduleName]) throw new Error(`Unsupported Firebase test module: ${moduleName}`);
  return modules[moduleName];
}

function createFirebaseTestAdapter() {
  let data = {};
  let authUser = { uid: "test-user" };
  let emulatorApp = null;
  let emulatorDatabase = null;
  let deleteEmulatorApp = null;
  const app = { name: "test-app" };
  const database = { name: "test-database" };
  return {
    privateWriteCount: 0,
    freshOutboxStateReads: 0,
    requireFreshOutboxTransition: false,
    failPublicTransactions: false,
    failAfterPublicCommitOnce: false,
    failOutboxTransactionsOnce: false,
    failProjectedTransitionOnce: false,
    seed(value) {
      data = structuredClone(value);
      this.privateWriteCount = 0;
      this.freshOutboxStateReads = 0;
      this.requireFreshOutboxTransition = false;
      this.failPublicTransactions = false;
      this.failAfterPublicCommitOnce = false;
      this.failOutboxTransactionsOnce = false;
      this.failProjectedTransitionOnce = false;
      authUser = { uid: "test-user" };
    },
    read(path) {
      return structuredClone(readPath(data, path));
    },
    async connectDatabaseEmulator(projectId, databaseHost) {
      const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
      const { getDatabase } = requireFromFunctions("firebase-admin/database");
      emulatorApp = initializeApp({
        projectId,
        databaseURL: `http://${databaseHost}?ns=${projectId}`
      }, `public-shared-score-guard-${Date.now()}`);
      emulatorDatabase = getDatabase(emulatorApp);
      deleteEmulatorApp = deleteApp;
    },
    async disconnectDatabaseEmulator() {
      if (emulatorApp && deleteEmulatorApp) await deleteEmulatorApp(emulatorApp);
      emulatorApp = null;
      emulatorDatabase = null;
      deleteEmulatorApp = null;
    },
    async readRemote(path) {
      assert.ok(emulatorDatabase, "Firebase Emulator adapter is connected");
      const result = await emulatorDatabase.ref(path).once("value");
      return structuredClone(result.val());
    },
    async writeRemote(path, value) {
      assert.ok(emulatorDatabase, "Firebase Emulator adapter is connected");
      await emulatorDatabase.ref(path).set(structuredClone(value));
    },
    write(path, value) {
      writePath(data, path, structuredClone(value));
    },
    getApps() {
      return [app];
    },
    initializeApp() {
      return app;
    },
    getDatabase() {
      return database;
    },
    ref(_database, path = "") {
      return { path: String(path || "") };
    },
    async get(target) {
      if (emulatorDatabase) {
        const result = await emulatorDatabase.ref(target.path).once("value");
        return snapshot(result.val());
      }
      const value = readPath(data, target.path);
      if (target.path.includes("/projectionOutbox/") && target.path.endsWith("/state")) {
        this.freshOutboxStateReads += 1;
        this.lastFreshOutboxStatePath = target.path;
      }
      return snapshot(value);
    },
    async set(target, value) {
      if (emulatorDatabase) {
        await emulatorDatabase.ref(target.path).set(structuredClone(value));
        return;
      }
      writePath(data, target.path, structuredClone(value));
    },
    async update(target, value) {
      if (emulatorDatabase) {
        await emulatorDatabase.ref(target.path).update(structuredClone(value));
        return;
      }
      if (!target.path) this.privateWriteCount += 1;
      for (const [path, entry] of Object.entries(value || {})) {
        writePath(data, joinPath(target.path, path), structuredClone(entry));
      }
    },
    async runTransaction(target, handler) {
      if (emulatorDatabase) {
        return emulatorDatabase.ref(target.path).transaction(handler, undefined, false);
      }
      if (this.failOutboxTransactionsOnce && target.path.includes("/projectionOutbox/")) {
        this.failOutboxTransactionsOnce = false;
        const error = new Error("permission denied while claiming projection");
        error.code = "PERMISSION_DENIED";
        throw error;
      }
      if (this.failPublicTransactions && target.path.includes("/publicTournaments/")) {
        const error = new Error("permission denied");
        error.code = "PERMISSION_DENIED";
        throw error;
      }
      const serverCurrent = structuredClone(readPath(data, target.path));
      const staleOutboxTransition = this.requireFreshOutboxTransition
        && target.path.includes("/projectionOutbox/")
        && target.path.endsWith("/state")
        && serverCurrent?.status === "PROCESSING"
        && this.lastFreshOutboxStatePath !== target.path;
      const current = staleOutboxTransition
        ? {
          ...serverCurrent,
          status: "PENDING",
          updatedAtMs: Math.max(0, Number(serverCurrent.updatedAtMs || 0) - 1)
        }
        : serverCurrent;
      this.lastFreshOutboxStatePath = "";
      const next = handler(current);
      if (next === undefined) {
        return { committed: false, snapshot: snapshot(current) };
      }
      if (this.failProjectedTransitionOnce && next?.status === "PROJECTED") {
        this.failProjectedTransitionOnce = false;
        const error = new Error("permission denied while marking projection projected");
        error.code = "PERMISSION_DENIED";
        throw error;
      }
      assertFirebaseSdkSerializable(next, target.path || "snapshot");
      writePath(data, target.path, structuredClone(next));
      if (this.failAfterPublicCommitOnce && target.path.includes("/publicTournaments/")) {
        this.failAfterPublicCommitOnce = false;
        const error = new Error("timeout after public commit");
        error.code = "TIMEOUT";
        throw error;
      }
      return { committed: true, snapshot: snapshot(next) };
    },
    onValue(_target, callback) {
      callback(snapshot(null));
      return () => {};
    },
    push(target) {
      return { path: joinPath(target.path, "generated"), key: "generated" };
    },
    getAuth() {
      return {
        currentUser: authUser,
        authStateReady: async () => {}
      };
    },
    onAuthStateChanged(_auth, callback) {
      callback(authUser);
      return () => {};
    },
    async signInWithEmailAndPassword() {
      return { user: null };
    },
    async signOut() {},
    getFunctions() {
      return {};
    },
    httpsCallable(_functions, name) {
      if (name !== "publishCharroProOfficialScore") return async () => ({ data: null });
      return async (payload) => {
        const prepared = prepareOfficialScoreRequest(payload, {
          uid: authUser.uid,
          name: "Test User",
          email: "test@example.test",
          role: "supervisor",
          clientId: "test-client"
        }, {
          nowMs: Date.parse(payload.publishedScore?.publishedAt || "") || Date.now()
        });
        if (!prepared.valid) throw callableError("functions/invalid-argument", prepared.errors[0], {
          reason: prepared.errors[0],
          errors: prepared.errors
        });
        const request = prepared.request;
        const tournamentPath = `charropro/tournaments/${request.tournamentId}`;
        const applied = applyOfficialScoreTransaction(readPath(data, tournamentPath), request);
        writePath(data, tournamentPath, structuredClone(applied.tournament));
        if (!applied.outcome.ok) {
          throw callableError("functions/aborted", applied.outcome.reason, applied.outcome);
        }
        this.privateWriteCount += applied.outcome.idempotent ? 0 : 1;
        const fanoutJob = applied.tournament.officialScoreFanout[applied.outcome.recordId];
        const updates = buildOfficialScoreFanoutUpdates(request.tournamentId, fanoutJob);
        for (const [path, value] of Object.entries(updates || {})) {
          writePath(data, joinPath("charropro", path), structuredClone(value));
        }
        return {
          data: {
            ok: true,
            complete: true,
            partialFailure: false,
            idempotent: applied.outcome.idempotent,
            conflict: false,
            reason: applied.outcome.reason,
            tournamentId: request.tournamentId,
            scoreId: request.scoreId,
            attemptId: applied.outcome.attemptId,
            id: applied.outcome.recordId,
            revision: applied.outcome.revision,
            published: applied.outcome.record,
            scorePath: `${tournamentPath}/scores/${request.scoreId}`,
            publishedPath: `${tournamentPath}/publishedScores/${applied.outcome.recordId}`,
            auditPath: `charropro/audit/publishedScores/${request.tournamentId}/${applied.outcome.recordId}`,
            projectionId: fanoutJob.projectionIntent.projectionId,
            projectionOutboxPath: `charropro/projectionOutbox/${request.tournamentId}/${fanoutJob.projectionIntent.projectionId}`,
            fanout: { ok: true, pending: false, reason: "official-score-fanout-delivered" }
          }
        };
      };
    }
  };
}

function snapshot(value) {
  const copy = value === undefined ? null : structuredClone(value);
  return {
    exists: () => copy !== null && copy !== undefined,
    val: () => structuredClone(copy)
  };
}

function callableError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function readPath(root, path) {
  if (!path) return root;
  return String(path).split("/").filter(Boolean).reduce((value, key) => value?.[key], root);
}

function writePath(root, path, value) {
  const parts = String(path).split("/").filter(Boolean);
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts.at(-1)] = value;
}

function joinPath(left, right) {
  return [left, right].filter(Boolean).join("/").replace(/\/+/g, "/");
}

function assertFirebaseSdkSerializable(value, path = "snapshot", seen = new WeakSet()) {
  if (value === null || ["string", "boolean", "number"].includes(typeof value)) return;
  assert.notEqual(value, undefined, `${path} cannot be undefined`);
  assert.equal(typeof value, "object", `${path} must be Firebase serializable`);
  if (seen.has(value)) assert.fail(`${path} cannot contain a cycle`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFirebaseSdkSerializable(item, `${path}[${index}]`, seen));
    seen.delete(value);
    return;
  }
  assert.equal(Object.getPrototypeOf(value), Object.prototype, `${path} must use Object.prototype`);
  assert.equal(typeof value.hasOwnProperty, "function", `${path}.hasOwnProperty must be callable`);
  for (const key of Object.keys(value)) {
    assert.equal(value.hasOwnProperty(key), true, `${path}.${key} must be an own property`);
    assertFirebaseSdkSerializable(value[key], `${path}.${key}`, seen);
  }
  seen.delete(value);
}

async function collectFirebaseSyncImportVersions(directoryUrl) {
  const versions = new Set();
  for (const entry of await readdir(directoryUrl, { withFileTypes: true })) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directoryUrl);
    if (entry.isDirectory()) {
      for (const version of await collectFirebaseSyncImportVersions(entryUrl)) versions.add(version);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;
    const source = await readFile(entryUrl, "utf8");
    for (const match of source.matchAll(/firebaseSync\.js\?v=([^"']+)/g)) versions.add(match[1]);
  }
  return versions;
}
