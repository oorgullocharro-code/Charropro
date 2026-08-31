import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import backupFoundation from "../functions/backupFoundation.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import restoreEngine from "../functions/restoreEngine.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import restoreService from "../functions/restoreService.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

const {
  buildBackupArchive,
  buildBackupCatalogRecord,
  prepareBackupRequest
} = backupFoundation;
const {
  RESTORE_ENGINE_VERSION,
  RESTORE_STATUSES,
  prepareRestoreValidation,
  validateRestoreArchive
} = restoreEngine;
const { createRestoreRuntime } = restoreService;
const { applyOfficialScoreTransaction, buildOfficialScoreFanoutUpdates, prepareOfficialScoreRequest } = officialScoreConcurrency;

const T0 = Date.parse("2026-08-01T12:00:00.000Z");
const actor = {
  uid: "supervisor-a",
  name: "Supervisor A",
  role: "supervisor",
  tenantId: "tenant-a",
  organizationId: "organization-a",
  platformAdmin: true,
  device: { id: "device-a", name: "Laptop A" }
};

assert.equal(RESTORE_ENGINE_VERSION, "1.0.0");

const sourceRoot = buildRoot(25);
const currentRoot = buildRoot(99);
currentRoot.audit.publishedScores["tournament-a"].current_only = { result: "CURRENT_HISTORY" };
currentRoot.tournaments["tournament-a"].officialScoreAudit.current_only = { eventId: "current-only", result: "CURRENT_HISTORY" };
currentRoot.tournaments["tournament-a"].officialScoreFanout.official_a = { status: "PENDING" };

const adapter = createMemoryAdapter({ charropro: currentRoot }, T0);
const sourceBackup = installBackup(adapter, sourceRoot, {
  scopeType: "tournament",
  tournamentId: "tournament-a",
  organizationId: "organization-a",
  idempotencyKey: "backup:source:tournament-a:0001"
});
const safetyBackup = installBackup(adapter, currentRoot, {
  scopeType: "tournament",
  tournamentId: "tournament-a",
  organizationId: "organization-a",
  idempotencyKey: "backup:safety:tournament-a:0001"
});
const runtime = createRestoreRuntime(adapter);
const restoreInput = {
  scopeType: "tournament",
  tournamentId: "tournament-a",
  organizationId: "organization-a",
  sourceScopeKey: sourceBackup.scopeKey,
  backupId: sourceBackup.backupId,
  safetyScopeKey: safetyBackup.scopeKey,
  safetyBackupId: safetyBackup.backupId,
  idempotencyKey: "restore:tournament-a:official-0001",
  reason: "disaster-recovery-validation"
};

const preflight = await runtime.validateRestore(restoreInput, actor);
assert.equal(preflight.valid, true);
assert.equal(preflight.targetExists, true);
assert.match(preflight.validationId, /^validation_[a-f0-9]{40}$/);
assert.match(preflight.confirmationToken, /^[A-Za-z0-9_-]{32,}$/);
assert.equal(preflight.confirmationPhrase, `RESTORE tournament:tournament-a FROM ${sourceBackup.backupId}`);

await assert.rejects(
  runtime.requestRestore({
    validationId: preflight.validationId,
    confirmationToken: preflight.confirmationToken,
    confirmationPhrase: "RESTORE WRONG",
    idempotencyKey: restoreInput.idempotencyKey
  }, actor),
  (error) => error.code === "restore-confirmation-phrase-mismatch"
);

const accepted = await runtime.requestRestore({
  validationId: preflight.validationId,
  confirmationToken: preflight.confirmationToken,
  confirmationPhrase: preflight.confirmationPhrase,
  idempotencyKey: restoreInput.idempotencyKey
}, actor);
assert.equal(accepted.accepted, true);
assert.match(accepted.restoreId, /^restore_[a-f0-9]{40}$/);

const concurrentResults = await Promise.all([
  runtime.executeRestore(accepted.scopeKey, accepted.restoreId),
  runtime.executeRestore(accepted.scopeKey, accepted.restoreId)
]);
assert.equal(concurrentResults.filter((result) => result.status === RESTORE_STATUSES.COMPLETED).length >= 1, true);
const restored = getPath(adapter.state, "charropro/tournaments/tournament-a");
assert.equal(restored.scores.score_a.total, 25);
assert.equal(restored.publishedScores.official_a.total, 25);
assert.deepEqual(restored.officialScoreFanout, {});
assert.equal(restored.officialScoreAudit.current_only.result, "CURRENT_HISTORY");
assert.equal(getPath(adapter.state, "charropro/audit/publishedScores/tournament-a/current_only/result"), "CURRENT_HISTORY");
assert.equal(getPath(adapter.state, "charropro/projectionOutbox/tournament-a/projection_a/state/status"), "SUPERSEDED");
assert.equal(getPath(adapter.state, "charropro/live/tournament-a"), undefined);
assert.equal(restored.meta.restore.restoreId, accepted.restoreId);
assert.equal(getPath(adapter.state, `charropro/restoreFoundation/catalog/${accepted.scopeKey}/${accepted.restoreId}/status`), "COMPLETED");

const repeatedRequest = await runtime.requestRestore({
  validationId: preflight.validationId,
  confirmationToken: preflight.confirmationToken,
  confirmationPhrase: preflight.confirmationPhrase,
  idempotencyKey: restoreInput.idempotencyKey
}, actor);
assert.equal(repeatedRequest.restoreId, accepted.restoreId);
assert.equal(repeatedRequest.idempotent, true);
await assert.rejects(
  runtime.requestRestore({
    validationId: preflight.validationId,
    confirmationToken: preflight.confirmationToken,
    confirmationPhrase: preflight.confirmationPhrase,
    idempotencyKey: restoreInput.idempotencyKey
  }, { ...actor, uid: "supervisor-b" }),
  (error) => error.code === "restore-validation-actor-mismatch"
);
const repeatedExecution = await runtime.executeRestore(accepted.scopeKey, accepted.restoreId);
assert.equal(repeatedExecution.idempotent, true);
assert.equal(repeatedExecution.status, "COMPLETED");

const restoreAudit = getPath(adapter.state, `charropro/restoreFoundation/audit/${accepted.scopeKey}`);
const operations = Object.values(restoreAudit).map((event) => event.operation);
for (const operation of ["RESTORE_VALIDATED", "RESTORE_REQUESTED", "RESTORE_STARTED", "RESTORE_APPLIED", "RESTORE_VERIFIED", "RESTORE_COMPLETED"]) {
  assert.ok(operations.includes(operation), `missing audit operation ${operation}`);
}
assert.ok(Object.values(restoreAudit).every((event) => event.authUid === actor.uid));

const sourceCatalog = getPath(adapter.state, `charropro/backupFoundation/catalog/${sourceBackup.scopeKey}/${sourceBackup.backupId}`);
assert.equal(validateRestoreArchive(adapter.storage.get(sourceCatalog.storageRef), sourceCatalog).valid, true);
assert.equal(validateRestoreArchive(`${adapter.storage.get(sourceCatalog.storageRef)} `, sourceCatalog).valid, false);
const corruptCatalog = { ...sourceCatalog, archiveChecksum: "0".repeat(64) };
assert.equal(validateRestoreArchive(adapter.storage.get(sourceCatalog.storageRef), corruptCatalog).valid, false);

await assert.rejects(
  runtime.validateRestore({ ...restoreInput, backupId: `backup_${"f".repeat(40)}` }, actor),
  (error) => error.code === "restore-backup-not-found"
);

const permissionProbe = prepareRestoreValidation(restoreInput, { ...actor, role: "operador" }, {
  sourceValidation: validateRestoreArchive(adapter.storage.get(sourceCatalog.storageRef), sourceCatalog),
  currentRoot: adapter.state.charropro
}, { nowMs: adapter.now(), confirmationToken: "x".repeat(43) });
assert.equal(permissionProbe.valid, false);
assert.ok(permissionProbe.errors.includes("restore-role-denied"));

await assert.rejects(
  runtime.validateRestore({ ...restoreInput, organizationId: "organization-b", idempotencyKey: "restore:wrong-org:0001" }, actor),
  (error) => error.code === "restore-organization-mismatch" || error.code === "restore-actor-organization-mismatch"
);

await testCancellation();
await testConcurrentTargetChange();
await testSafetyAndIntegrityGuards();
await testCreateOnlyRestore();
await testCharreadaRestore();
await testOrganizationRestore();
await testSystemRestore();
testOfficialScoreCompatibility(restored);
testProjectionRecoveryCompatibility(restored);

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8"));
assert.equal(rules.rules.charropro.restoreFoundation[".read"], false);
assert.equal(rules.rules.charropro.restoreFoundation[".write"], false);
const functionsSource = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
for (const exportName of ["validateCharroProRestore", "requestCharroProRestore", "cancelCharroProRestore", "executeCharroProRestore"]) {
  assert.match(functionsSource, new RegExp(`exports\\.${exportName}`));
}
assert.equal(functionsSource.includes("publicTournaments').set"), false);

console.log("backup restore validation tests passed");

async function testCancellation() {
  const root = buildRoot(70);
  const local = createMemoryAdapter({ charropro: root }, T0 + 10000);
  const source = installBackup(local, buildRoot(10), {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:cancel:source:0001"
  });
  const safety = installBackup(local, root, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:cancel:safety:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  const input = {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    sourceScopeKey: source.scopeKey, backupId: source.backupId,
    safetyScopeKey: safety.scopeKey, safetyBackupId: safety.backupId,
    idempotencyKey: "restore:cancel:tournament:0001"
  };
  const validation = await localRuntime.validateRestore(input, actor);
  const request = await localRuntime.requestRestore({
    validationId: validation.validationId,
    confirmationToken: validation.confirmationToken,
    confirmationPhrase: validation.confirmationPhrase,
    idempotencyKey: input.idempotencyKey
  }, actor);
  const cancellation = await localRuntime.cancelRestore({ scopeKey: request.scopeKey, restoreId: request.restoreId }, actor);
  assert.equal(cancellation.cancellationRequested, true);
  const execution = await localRuntime.executeRestore(request.scopeKey, request.restoreId);
  assert.equal(execution.cancelled, true);
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_a/total"), 70);
}

async function testConcurrentTargetChange() {
  const root = buildRoot(80);
  const local = createMemoryAdapter({ charropro: root }, T0 + 20000);
  const source = installBackup(local, buildRoot(20), {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:conflict:source:0001"
  });
  const safety = installBackup(local, root, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:conflict:safety:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  const input = {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    sourceScopeKey: source.scopeKey, backupId: source.backupId,
    safetyScopeKey: safety.scopeKey, safetyBackupId: safety.backupId,
    idempotencyKey: "restore:conflict:tournament:0001"
  };
  const validation = await localRuntime.validateRestore(input, actor);
  const request = await localRuntime.requestRestore({
    validationId: validation.validationId,
    confirmationToken: validation.confirmationToken,
    confirmationPhrase: validation.confirmationPhrase,
    idempotencyKey: input.idempotencyKey
  }, actor);
  local.state.charropro.tournaments["tournament-a"].scores.score_a.total = 81;
  const execution = await localRuntime.executeRestore(request.scopeKey, request.restoreId);
  assert.equal(execution.ok, false);
  assert.equal(execution.reason, "restore-target-changed-after-validation");
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_a/total"), 81);
}

async function testSafetyAndIntegrityGuards() {
  const root = buildRoot(55);
  const local = createMemoryAdapter({ charropro: root }, T0 + 25000);
  const source = installBackup(local, buildRoot(5), {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:guards:source:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  await assert.rejects(
    localRuntime.validateRestore({
      scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
      sourceScopeKey: source.scopeKey, backupId: source.backupId,
      idempotencyKey: "restore:missing-safety:0001"
    }, actor),
    (error) => error.code === "restore-safety-backup-required"
  );

  const invalidRoot = buildRoot(6);
  delete invalidRoot.tournaments["tournament-a"].officialScoreLedger.attempt_a.records.official_a;
  invalidRoot.tournaments["tournament-a"].officialScoreLedger.attempt_a.records.historical_a = {
    id: "historical_a",
    attemptKey: "other-attempt",
    status: "historical",
    officialStatus: "historical",
    superseded: true
  };
  const invalidBackup = installBackup(local, invalidRoot, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:guards:invalid-ledger:0001"
  });
  const safety = installBackup(local, root, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:guards:safety:0001"
  });
  await assert.rejects(
    localRuntime.validateRestore({
      scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
      sourceScopeKey: invalidBackup.scopeKey, backupId: invalidBackup.backupId,
      safetyScopeKey: safety.scopeKey, safetyBackupId: safety.backupId,
      idempotencyKey: "restore:invalid-ledger:0001"
    }, actor),
    (error) => String(error.code).startsWith("restore-official-ledger-")
  );
}

async function testCreateOnlyRestore() {
  const sourceRootValue = buildRoot(13);
  const emptyTarget = buildRoot(1);
  delete emptyTarget.tournaments["tournament-a"];
  delete emptyTarget.tournamentIndex["tournament-a"];
  delete emptyTarget.projectionOutbox["tournament-a"];
  delete emptyTarget.publicTournaments["tournament-a"];
  const local = createMemoryAdapter({ charropro: emptyTarget }, T0 + 27000);
  const source = installBackup(local, sourceRootValue, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:create-only:source:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  await performRestore(localRuntime, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    sourceScopeKey: source.scopeKey, backupId: source.backupId,
    idempotencyKey: "restore:create-only:tournament:0001"
  });
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_a/total"), 13);
}

async function testCharreadaRestore() {
  const root = buildRoot(66);
  root.tournaments["tournament-a"].charreadas.charreada_b = { id: "charreada-b", name: "Segunda" };
  root.tournaments["tournament-a"].scores.score_b = { id: "score-b", total: 44, charreada: { id: "charreada-b" } };
  const sourceRoot = structuredClone(root);
  sourceRoot.tournaments["tournament-a"].scores.score_a.total = 12;
  const local = createMemoryAdapter({ charropro: root }, T0 + 30000);
  const source = installBackup(local, sourceRoot, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:charreada:source:0001"
  });
  const safety = installBackup(local, root, {
    scopeType: "tournament", tournamentId: "tournament-a", organizationId: "organization-a",
    idempotencyKey: "backup:charreada:safety:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  const input = {
    scopeType: "charreada", tournamentId: "tournament-a", charreadaId: "charreada-a", organizationId: "organization-a",
    sourceScopeKey: source.scopeKey, backupId: source.backupId,
    safetyScopeKey: safety.scopeKey, safetyBackupId: safety.backupId,
    idempotencyKey: "restore:charreada-a:0001"
  };
  await performRestore(localRuntime, input);
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_a/total"), 12);
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_b/total"), 44);
  assert.equal(getPath(local.state, "charropro/publicTournaments/tournament-a"), undefined);
}

async function testOrganizationRestore() {
  const current = buildRoot(51);
  current.settings.globalRuleOverrides.enabled = true;
  current.tournaments["tournament-extra"] = buildTournament("tournament-extra", "tenant-a", "organization-a", 88);
  current.tournamentIndex["tournament-extra"] = { id: "tournament-extra" };
  const source = buildRoot(15);
  const local = createMemoryAdapter({ charropro: current }, T0 + 40000);
  const sourceBackup = installBackup(local, source, {
    scopeType: "organization", organizationId: "organization-a", idempotencyKey: "backup:organization:source:0001"
  });
  const safetyBackup = installBackup(local, current, {
    scopeType: "organization", organizationId: "organization-a", idempotencyKey: "backup:organization:safety:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  await performRestore(localRuntime, {
    scopeType: "organization", organizationId: "organization-a",
    sourceScopeKey: sourceBackup.scopeKey, backupId: sourceBackup.backupId,
    safetyScopeKey: safetyBackup.scopeKey, safetyBackupId: safetyBackup.backupId,
    idempotencyKey: "restore:organization-a:0001"
  });
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_a/total"), 15);
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-extra"), undefined);
  assert.ok(getPath(local.state, "charropro/tournaments/tournament-b"));
  assert.equal(getPath(local.state, "charropro/settings/globalRuleOverrides/enabled"), true);
}

async function testSystemRestore() {
  const current = buildRoot(61);
  current.users.user_a.name = "Current";
  current.settings.globalRuleOverrides.enabled = true;
  const source = buildRoot(11);
  source.users.user_a.name = "Archived";
  const local = createMemoryAdapter({ charropro: current }, T0 + 50000);
  const sourceBackup = installBackup(local, source, {
    scopeType: "system", idempotencyKey: "backup:system:source:0001"
  });
  const safetyBackup = installBackup(local, current, {
    scopeType: "system", idempotencyKey: "backup:system:safety:0001"
  });
  const localRuntime = createRestoreRuntime(local);
  await performRestore(localRuntime, {
    scopeType: "system",
    sourceScopeKey: sourceBackup.scopeKey, backupId: sourceBackup.backupId,
    safetyScopeKey: safetyBackup.scopeKey, safetyBackupId: safetyBackup.backupId,
    idempotencyKey: "restore:system:0001"
  });
  assert.equal(getPath(local.state, "charropro/tournaments/tournament-a/scores/score_a/total"), 11);
  assert.equal(getPath(local.state, "charropro/users/user_a/name"), "Archived");
  assert.equal(getPath(local.state, "charropro/settings/globalRuleOverrides/enabled"), false);
}

async function performRestore(runtimeValue, input) {
  const validation = await runtimeValue.validateRestore(input, actor);
  const request = await runtimeValue.requestRestore({
    validationId: validation.validationId,
    confirmationToken: validation.confirmationToken,
    confirmationPhrase: validation.confirmationPhrase,
    idempotencyKey: input.idempotencyKey
  }, actor);
  const result = await runtimeValue.executeRestore(request.scopeKey, request.restoreId);
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.postValidation.valid, true);
  return result;
}

function testOfficialScoreCompatibility(tournament) {
  const published = {
    tournament: { id: "tournament-a", name: "Torneo A" },
    charreada: { id: "charreada-a", name: "Primera" },
    team: { id: "team-a", name: "Equipo A" },
    suerte: { id: "cala", name: "Cala" },
    competition: { id: "equipos_completo", scope: "team" },
    attemptIndex: 1,
    coleadorIndex: 0,
    total: 30
  };
  published.attemptKey = ["tournament-a", "charreada-a", "team-a", "cala", 1, 0].join("__");
  const prepared = prepareOfficialScoreRequest({
    tournamentId: "tournament-a",
    scoreId: "charreada-a__team-a__cala",
    idempotencyKey: "score:after-restore:0001",
    expectedRevision: 0,
    scorePayload: { id: "charreada-a__team-a__cala", total: 30 },
    publishedScore: published
  }, { ...actor, role: "juez" }, { nowMs: T0 + 70000 });
  assert.equal(prepared.valid, true, prepared.errors.join(","));
  const result = applyOfficialScoreTransaction(tournament, prepared.request);
  assert.equal(result.outcome.ok, true, result.outcome.reason);
}

function testProjectionRecoveryCompatibility(tournament) {
  assert.deepEqual(tournament.officialScoreFanout, {});
  const updates = buildOfficialScoreFanoutUpdates("tournament-a", {
    status: "PENDING",
    record: tournament.publishedScores.official_a,
    auditRecord: tournament.publishedScores.official_a,
    projectionIntent: {
      projectionId: "projection_after_restore",
      sourceRevision: 2,
      intent: { projectionId: "projection_after_restore", sourceRevision: 2 },
      state: { status: "PENDING", sourceRevision: 2 }
    }
  });
  assert.ok(updates);
  assert.equal(updates["projectionOutbox/tournament-a/projection_after_restore/intent"].projectionId, "projection_after_restore");
}

function installBackup(adapterValue, charroproRoot, input) {
  const prepared = prepareBackupRequest({
    mode: "manual",
    backupType: "full",
    ...input
  }, actor, { nowMs: adapterValue.now() });
  assert.equal(prepared.valid, true, prepared.errors?.join(","));
  const built = buildBackupArchive(charroproRoot, prepared.request, {
    appVersion: "restore-test",
    capturedAtMs: adapterValue.now()
  });
  const storageRef = `gs://memory/${prepared.request.backupId}.json`;
  const completedAtMs = adapterValue.now();
  const catalog = buildBackupCatalogRecord(prepared.request, built, {
    storageRef,
    generation: "1",
    completedAt: new Date(completedAtMs).toISOString(),
    completedAtMs,
    validatedAt: new Date(completedAtMs).toISOString(),
    validatedAtMs: completedAtMs,
    durationMs: 1
  });
  setPath(adapterValue.state, `charropro/backupFoundation/catalog/${prepared.request.scopeKey}/${prepared.request.backupId}`, catalog);
  adapterValue.storage.set(storageRef, built.serialized);
  return { ...prepared.request, catalog, built };
}

function buildRoot(total) {
  return {
    tournaments: {
      "tournament-a": buildTournament("tournament-a", "tenant-a", "organization-a", total),
      "tournament-b": buildTournament("tournament-b", "tenant-b", "organization-b", 5)
    },
    tournamentIndex: {
      "tournament-a": { id: "tournament-a", name: "Torneo A" },
      "tournament-b": { id: "tournament-b", name: "Torneo B" }
    },
    projectionOutbox: {
      "tournament-a": {
        projection_a: {
          intent: { projectionId: "projection_a", charreadaId: "charreada-a", sourceRevision: 1 },
          state: { status: "PENDING", updatedAt: "2026-08-01T11:00:00.000Z", updatedAtMs: T0 - 3600000 }
        }
      }
    },
    publicTournaments: { "tournament-a": { metadata: { tournamentId: "tournament-a" }, projectionRevision: 1 } },
    history: { statistics: { "tournament-a": { historical_a: { total } } } },
    audit: { publishedScores: { "tournament-a": { official_a: { recordId: "official_a", result: "SUCCESS" } } } },
    judges: {
      assignments: { "tournament-a": { "charreada-a": { judge_a: true } } },
      events: { judge_event_a: { tournamentId: "tournament-a", charreadaId: "charreada-a", operation: "SCORE_PUBLISHED" } }
    },
    settings: {
      globalRuleOverrides: { enabled: false },
      scoringButtonLayouts: { layout_a: { enabled: true } },
      unrelated: { keep: true }
    },
    users: { user_a: { uid: "user-a", name: "User A", role: "supervisor" } },
    userTournamentAccess: { user_a: { "tournament-a": true } },
    live: { "tournament-a": { current: { total } } },
    broadcastStudio: { sessions: { session_a: { status: "online" } } }
  };
}

function buildTournament(id, tenantId, organizationId, total) {
  const attemptKey = `${id}|charreada-a|equipos_completo|team-a|cala|0|0`;
  const recordId = "official_a";
  return {
    info: { id, name: id === "tournament-a" ? "Torneo A" : id, tenantId, organizationId, status: "activo" },
    meta: { tenantId, organizationId, activeCharreadaId: "charreada-a" },
    charreadas: { "charreada-a": { id: "charreada-a", name: "Primera", competitionId: "equipos_completo" } },
    teams: { team_a: { id: "team-a", name: "Equipo A" } },
    scores: { score_a: { id: "score-a", total, confirmed: false, note: "", optional: null, charreada: { id: "charreada-a" } } },
    publishedScores: {
      [recordId]: {
        id: recordId,
        attemptKey,
        charreada: { id: "charreada-a" },
        team: { id: "team-a", name: "Equipo A" },
        suerte: { id: "cala" },
        total,
        revision: 1,
        status: "active",
        officialStatus: "active",
        superseded: false
      }
    },
    officialScoreLedger: {
      attempt_a: {
        attemptId: "attempt_a",
        attemptKey,
        charreadaId: "charreada-a",
        revision: 1,
        activeRecordId: recordId,
        records: {
          [recordId]: {
            id: recordId,
            attemptKey,
            charreada: { id: "charreada-a" },
            total,
            revision: 1,
            status: "active",
            officialStatus: "active",
            superseded: false
          }
        },
        requests: {}
      }
    },
    officialScoreAudit: { audit_a: { eventId: "audit-a", charreadaId: "charreada-a", result: "SUCCESS" } },
    officialScoreFanout: { [recordId]: { status: "DELIVERED", charreadaId: "charreada-a" } }
  };
}

function createMemoryAdapter(seed, startMs) {
  let clock = startMs;
  let queue = Promise.resolve();
  const state = structuredClone(seed);
  const storage = new Map();
  return {
    state,
    storage,
    now: () => ++clock,
    async read(path) {
      return structuredClone(getPath(state, path));
    },
    async readArchive(storageRef) {
      if (!storage.has(storageRef)) throw Object.assign(new Error("restore-backup-payload-missing"), { code: "restore-backup-payload-missing" });
      return storage.get(storageRef);
    },
    transaction(path, updater) {
      const operation = queue.then(async () => {
        const current = structuredClone(getPath(state, path));
        const next = updater(current);
        if (next === undefined) return { committed: false, value: current };
        setPath(state, path, structuredClone(next));
        return { committed: true, value: structuredClone(next) };
      });
      queue = operation.catch(() => {});
      return operation;
    }
  };
}

function getPath(root, path) {
  return String(path).split("/").filter(Boolean).reduce((node, key) => node?.[key], root);
}

function setPath(root, path, value) {
  const parts = String(path).split("/").filter(Boolean);
  let node = root;
  for (const key of parts.slice(0, -1)) {
    node[key] ||= {};
    node = node[key];
  }
  if (value === undefined || value === null) delete node[parts.at(-1)];
  else node[parts.at(-1)] = value;
}
