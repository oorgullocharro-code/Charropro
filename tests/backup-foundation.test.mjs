import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import backupFoundation from "../functions/backupFoundation.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import backupService from "../functions/backupService.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

const {
  BACKUP_FOUNDATION_VERSION,
  BACKUP_SCHEMA_VERSION,
  BACKUP_STATUSES,
  applyBackupClaim,
  authorizeBackupRequest,
  buildBackupArchive,
  buildBackupAuditEvent,
  cloneBackupValue,
  planBackupRetention,
  pruneBackupControl,
  prepareBackupRequest,
  selectBackupSource,
  sha256,
  validateBackupArchive,
  verifyBackupSerialization
} = backupFoundation;
const { createBackupRuntime } = backupService;

const T0 = Date.parse("2026-08-01T12:00:00.000Z");
const actor = {
  uid: "supervisor-a",
  name: "Supervisor A",
  role: "supervisor",
  tenantId: "tenant-a",
  organizationId: "organization-a"
};

assert.equal(BACKUP_FOUNDATION_VERSION, "1.0.0");
assert.equal(BACKUP_SCHEMA_VERSION, "charropro-backup/1");

const source = buildSource();
const requestInput = {
  mode: "manual",
  backupType: "full",
  scopeType: "tournament",
  tournamentId: "tournament-a",
  organizationId: "organization-a",
  idempotencyKey: "manual:tournament-a:request-0001",
  reason: "operator-request"
};
const prepared = prepareBackupRequest(requestInput, actor, { nowMs: T0 });
assert.equal(prepared.valid, true);
assert.match(prepared.request.backupId, /^backup_[a-f0-9]{40}$/);
assert.match(prepared.request.scopeKey, /^scope_[a-f0-9]{40}$/);
assert.equal(
  authorizeBackupRequest(prepared.request, {
    tournament: source.charropro.tournaments["tournament-a"],
    hasTournamentAccess: true
  }).allowed,
  true
);

const deniedRole = prepareBackupRequest(requestInput, { ...actor, uid: "viewer", role: "lectura" }, { nowMs: T0 });
assert.equal(deniedRole.valid, false);
assert.ok(deniedRole.errors.includes("backup-role-denied"));
const deniedTenant = authorizeBackupRequest(prepared.request, {
  tournament: {
    ...source.charropro.tournaments["tournament-a"],
    info: { ...source.charropro.tournaments["tournament-a"].info, tenantId: "tenant-b" }
  },
  hasTournamentAccess: true
});
assert.equal(deniedTenant.allowed, false);
assert.equal(deniedTenant.reason, "backup-tenant-mismatch");

const unsupportedIncremental = prepareBackupRequest({
  ...requestInput,
  backupType: "incremental",
  idempotencyKey: "manual:tournament-a:incremental-0001"
}, actor, { nowMs: T0 });
assert.equal(unsupportedIncremental.valid, false);
assert.ok(unsupportedIncremental.errors.includes("backup-incremental-not-supported"));

const selected = selectBackupSource(source.charropro, prepared.request);
assert.equal(selected.tournament.info.id, "tournament-a");
assert.equal(selected.tournament.scores.score_a.total, 0);
assert.equal(selected.tournament.scores.score_a.confirmed, false);
assert.equal(selected.tournament.scores.score_a.note, "");
assert.equal(selected.tournament.scores.score_a.optional, null);
assert.equal(selected.live, undefined);
assert.equal(selected.broadcastStudio, undefined);
assert.equal(selected.backups, undefined);

const built = buildBackupArchive(source.charropro, prepared.request, {
  nowMs: T0,
  capturedAtMs: T0 + 1000,
  appVersion: "test-version"
});
assert.equal(validateBackupArchive(built.archive, { expectedBackupId: prepared.request.backupId }).valid, true);
assert.equal(built.manifest.capturedAt, "2026-08-01T12:00:01.000Z");
assert.equal(built.manifest.counts.tournaments, 1);
assert.equal(built.manifest.counts.charreadas, 1);
assert.equal(built.manifest.counts.teams, 2);
assert.equal(built.manifest.counts.participants, 2);
assert.equal(built.manifest.counts.scores, 1);
assert.equal(built.manifest.counts.publishedScores, 1);
assert.equal(built.manifest.counts.officialScoreLedgers, 1);
assert.equal(built.manifest.counts.officialScoreAuditEvents, 1);
assert.equal(sha256(built.serialized), built.archiveChecksum);
assert.equal(verifyBackupSerialization(built.serialized, built.archiveChecksum).valid, true);
assert.equal(verifyBackupSerialization(`${built.serialized} `, built.archiveChecksum).valid, false);

const tamperedArchive = structuredClone(built.archive);
tamperedArchive.data.tournament.scores.score_a.total = 999;
assert.equal(validateBackupArchive(tamperedArchive).valid, false);

const sourceBeforeClone = structuredClone(source);
const clone = cloneBackupValue(source);
clone.charropro.tournaments["tournament-a"].scores.score_a.total = 999;
assert.deepEqual(source, sourceBeforeClone, "backup cloning never mutates source data");
const unsafe = { zero: 0, no: false, empty: "", nullable: null };
unsafe.cycle = unsafe;
assert.throws(() => cloneBackupValue(unsafe), /backup-cycle-detected/);
assert.throws(() => cloneBackupValue({ value: 1n }), /backup-value-not-serializable/);
const withGetter = {};
Object.defineProperty(withGetter, "secret", { enumerable: true, get() { throw new Error("must not run"); } });
assert.throws(() => cloneBackupValue(withGetter), /backup-accessor-forbidden/);

const claimed = applyBackupClaim({}, prepared.request, { nowMs: T0 });
const idempotentClaim = applyBackupClaim(claimed.control, prepared.request, { nowMs: T0 + 1 });
assert.equal(idempotentClaim.outcome.idempotent, true);
assert.equal(idempotentClaim.outcome.backupId, prepared.request.backupId);
const replacementRequest = prepareBackupRequest({
  ...requestInput,
  idempotencyKey: "manual:tournament-a:replacement-0001"
}, actor, { nowMs: T0 + 16 * 60 * 1000 }).request;
const replacedClaim = applyBackupClaim(claimed.control, replacementRequest, { nowMs: T0 + 16 * 60 * 1000 });
assert.equal(replacedClaim.outcome.ok, true);
assert.equal(replacedClaim.outcome.expiredJob.status, BACKUP_STATUSES.FAILED);
assert.equal(replacedClaim.outcome.expiredJob.lastError, "backup-lease-expired");
const deterministicAuditA = buildBackupAuditEvent(prepared.request, "BACKUP_STARTED", { result: "RUNNING" }, {
  nowMs: T0,
  eventKey: "started:2"
});
const deterministicAuditB = buildBackupAuditEvent(prepared.request, "BACKUP_STARTED", { result: "RUNNING" }, {
  nowMs: T0 + 100,
  eventKey: "started:2"
});
assert.equal(deterministicAuditA.eventId, deterministicAuditB.eventId, "audit retry is idempotent");

const adapter = createMemoryAdapter(source, T0);
const runtime = createBackupRuntime(adapter, { appVersion: "test-version" });
const accepted = await runtime.requestBackup(requestInput, actor, {
  tournament: source.charropro.tournaments["tournament-a"],
  hasTournamentAccess: true
});
assert.equal(accepted.accepted, true);
assert.equal(accepted.idempotent, false);
const acceptedRetry = await runtime.requestBackup(requestInput, actor, {
  tournament: source.charropro.tournaments["tournament-a"],
  hasTournamentAccess: true
});
assert.equal(acceptedRetry.idempotent, true);
assert.equal(acceptedRetry.backupId, accepted.backupId);

const completed = await runtime.executeBackup(accepted.scopeKey, accepted.backupId);
assert.equal(completed.ok, true);
assert.equal(completed.status, BACKUP_STATUSES.COMPLETED);
assert.equal(completed.validation.status, "VALID");
const completedRetry = await runtime.executeBackup(accepted.scopeKey, accepted.backupId);
assert.equal(completedRetry.idempotent, true, "worker retry after completion does not write another archive");
assert.equal(adapter.storage.size, 1);
const storedArchive = JSON.parse([...adapter.storage.values()][0].serialized);
assert.equal(storedArchive.data.tournament.info.id, "tournament-a");
assert.equal(storedArchive.data.tournament.officialScoreLedger.attempt_a.revision, 1);
assert.equal(storedArchive.data.publishedScoreAudit.audit_a.result, "SUCCESS");
assert.equal(storedArchive.data.judgeEvents.event_a.operation, "SCORE_PUBLISHED");
assert.equal(storedArchive.data.projectionOutbox.projection_a.state.status, "VERIFIED");
assert.equal(storedArchive.data.criticalSettings.scoringButtonLayouts.layout_a.enabled, true);
const catalog = getPath(adapter.state, `charropro/backupFoundation/catalog/${accepted.scopeKey}/${accepted.backupId}`);
assert.equal(catalog.status, BACKUP_STATUSES.COMPLETED);
assert.equal(catalog.archiveChecksum, completed.archiveChecksum);
assert.equal(catalog.storageRef.startsWith("gs://test-backups/"), true);
const audit = getPath(adapter.state, `charropro/backupFoundation/audit/${accepted.scopeKey}`);
const operations = Object.values(audit).map((event) => event.operation);
for (const operation of ["BACKUP_REQUESTED", "BACKUP_STARTED", "BACKUP_VALIDATED", "BACKUP_COMPLETED"]) {
  assert.ok(operations.includes(operation), `${operation} remains auditable`);
}

const emptySource = buildSource();
emptySource.charropro.tournaments["tournament-a"].charreadas = {};
emptySource.charropro.tournaments["tournament-a"].teams = {};
emptySource.charropro.tournaments["tournament-a"].scores = {};
emptySource.charropro.tournaments["tournament-a"].publishedScores = {};
const emptyAdapter = createMemoryAdapter(emptySource, T0);
const emptyRuntime = createBackupRuntime(emptyAdapter, { appVersion: "test-version" });
const emptyAccepted = await emptyRuntime.requestBackup({
  ...requestInput,
  idempotencyKey: "manual:tournament-a:empty-0001"
}, actor, { tournament: emptySource.charropro.tournaments["tournament-a"], hasTournamentAccess: true });
const emptyCompleted = await emptyRuntime.executeBackup(emptyAccepted.scopeKey, emptyAccepted.backupId);
assert.equal(emptyCompleted.ok, true);
const emptyArchive = JSON.parse([...emptyAdapter.storage.values()][0].serialized);
assert.equal(emptyArchive.manifest.counts.charreadas, 0);
assert.equal(emptyArchive.manifest.counts.scores, 0);

const cancelAdapter = createMemoryAdapter(source, T0);
const cancelRuntime = createBackupRuntime(cancelAdapter);
const cancelAccepted = await cancelRuntime.requestBackup({
  ...requestInput,
  idempotencyKey: "manual:tournament-a:cancel-0001",
  retentionDays: 1,
  retentionCount: 1
}, actor, { tournament: source.charropro.tournaments["tournament-a"], hasTournamentAccess: true });
const cancelJobBefore = getPath(cancelAdapter.state, `charropro/backupFoundation/control/${cancelAccepted.scopeKey}/jobs/${cancelAccepted.backupId}`);
assert.equal(cancelJobBefore.retention.days, 90, "client cannot weaken server retention policy");
assert.equal(cancelJobBefore.retention.count, 30);
await assert.rejects(() => cancelRuntime.cancelBackup({
  scopeKey: cancelAccepted.scopeKey,
  backupId: cancelAccepted.backupId
}, {
  ...actor,
  uid: "supervisor-b",
  tenantId: "tenant-b",
  organizationId: "organization-b"
}), (error) => error.code === "backup-cancellation-denied");
const cancellation = await cancelRuntime.cancelBackup({
  scopeKey: cancelAccepted.scopeKey,
  backupId: cancelAccepted.backupId
}, actor);
assert.equal(cancellation.cancellationRequested, true);
const cancelled = await cancelRuntime.executeBackup(cancelAccepted.scopeKey, cancelAccepted.backupId);
assert.equal(cancelled.status, BACKUP_STATUSES.CANCELLED);
assert.equal(cancelAdapter.storage.size, 0);

const failureAdapter = createMemoryAdapter(source, T0);
const failureRuntime = createBackupRuntime(failureAdapter);
const failureAccepted = await failureRuntime.requestBackup({
  ...requestInput,
  idempotencyKey: "manual:tournament-a:deleted-before-capture-0001"
}, actor, { tournament: source.charropro.tournaments["tournament-a"], hasTournamentAccess: true });
setPath(failureAdapter.state, "charropro/tournaments/tournament-a", null);
const failed = await failureRuntime.executeBackup(failureAccepted.scopeKey, failureAccepted.backupId);
assert.equal(failed.status, BACKUP_STATUSES.FAILED);
assert.equal(failed.reason, "backup-tournament-not-found");

const corruptAdapter = createMemoryAdapter(source, T0);
const readStoredArchive = corruptAdapter.readArchive.bind(corruptAdapter);
corruptAdapter.readArchive = async (objectPath) => `${await readStoredArchive(objectPath)} `;
const corruptRuntime = createBackupRuntime(corruptAdapter);
const corruptAccepted = await corruptRuntime.requestBackup({
  ...requestInput,
  idempotencyKey: "manual:tournament-a:corrupt-storage-0001"
}, actor, { tournament: source.charropro.tournaments["tournament-a"], hasTournamentAccess: true });
for (let attempt = 1; attempt < 5; attempt += 1) {
  await assert.rejects(
    () => corruptRuntime.executeBackup(corruptAccepted.scopeKey, corruptAccepted.backupId),
    (error) => error.code === "backup-storage-validation-failed"
  );
}
const corruptFailed = await corruptRuntime.executeBackup(corruptAccepted.scopeKey, corruptAccepted.backupId);
assert.equal(corruptFailed.status, BACKUP_STATUSES.FAILED);
assert.equal(corruptFailed.reason, "backup-storage-validation-failed");
assert.equal(corruptAdapter.storage.size, 1, "immutable object is not duplicated across validation retries");

const concurrencyAdapter = createMemoryAdapter(source, T0);
const concurrencyRuntime = createBackupRuntime(concurrencyAdapter);
const concurrentRequests = await Promise.allSettled(Array.from({ length: 20 }, (_, index) => concurrencyRuntime.requestBackup({
  ...requestInput,
  idempotencyKey: `manual:tournament-a:device-${String(index).padStart(4, "0")}`
}, { ...actor, uid: `supervisor-${index}` }, {
  tournament: source.charropro.tournaments["tournament-a"],
  hasTournamentAccess: true
})));
assert.equal(concurrentRequests.filter((result) => result.status === "fulfilled").length, 1);
assert.equal(concurrentRequests.filter((result) => result.status === "rejected" && result.reason.code === "backup-scope-busy").length, 19);
const concurrentControl = getPath(concurrencyAdapter.state, `charropro/backupFoundation/control/${concurrentRequests.find((result) => result.status === "fulfilled").value.scopeKey}`);
assert.equal(Object.keys(concurrentControl.jobs).length, 1, "scope transaction admits one concurrent backup");

const organizationRequest = prepareBackupRequest({
  mode: "manual",
  backupType: "full",
  scopeType: "organization",
  organizationId: "organization-a",
  idempotencyKey: "manual:organization-a:request-0001"
}, actor, { nowMs: T0 }).request;
const organizationData = selectBackupSource(source.charropro, organizationRequest);
assert.deepEqual(Object.keys(organizationData.tournaments), ["tournament-a"]);
assert.equal(organizationData.users, null);
const organizationAdapter = createMemoryAdapter(source, T0);
const organizationRuntime = createBackupRuntime(organizationAdapter);
const organizationAccepted = await organizationRuntime.requestBackup({
  mode: "manual",
  backupType: "full",
  scopeType: "organization",
  organizationId: "organization-a",
  idempotencyKey: "manual:organization-a:runtime-0001"
}, actor);
assert.equal((await organizationRuntime.executeBackup(organizationAccepted.scopeKey, organizationAccepted.backupId)).ok, true);
const organizationArchive = JSON.parse([...organizationAdapter.storage.values()][0].serialized);
assert.deepEqual(Object.keys(organizationArchive.data.tournaments), ["tournament-a"]);
assert.equal(organizationArchive.data.users, null);
const systemActor = { uid: "system", role: "system", platformAdmin: true };
const systemRequest = prepareBackupRequest({
  mode: "automatic",
  backupType: "full",
  scopeType: "system",
  idempotencyKey: "automatic:system:2026-08-01"
}, systemActor, { nowMs: T0 }).request;
const systemData = selectBackupSource(source.charropro, systemRequest);
assert.equal(Object.keys(systemData.tournaments).length, 2);
assert.equal(systemData.users.user_a.role, "supervisor");
const systemAdapter = createMemoryAdapter(source, T0);
const systemRuntime = createBackupRuntime(systemAdapter);
const systemAccepted = await systemRuntime.requestBackup({
  mode: "automatic",
  backupType: "full",
  scopeType: "system",
  idempotencyKey: "automatic:system:runtime-0001"
}, systemActor);
assert.equal((await systemRuntime.executeBackup(systemAccepted.scopeKey, systemAccepted.backupId)).ok, true);
const systemArchive = JSON.parse([...systemAdapter.storage.values()][0].serialized);
assert.equal(Object.keys(systemArchive.data.tournaments).length, 2);
assert.equal(systemArchive.data.users.user_a.role, "supervisor");

const scheduleAdapter = createMemoryAdapter(source, T0);
const scheduleRuntime = createBackupRuntime(scheduleAdapter);
const scheduled = await scheduleRuntime.enqueueAutomaticBackups();
assert.equal(scheduled.requested, 2);
assert.equal(scheduled.failed, 0);

const retentionCatalog = {};
for (let index = 0; index < 35; index += 1) {
  retentionCatalog[`backup_${index}`] = {
    backupId: `backup_${index}`,
    status: BACKUP_STATUSES.COMPLETED,
    createdAtMs: T0 - index * 24 * 60 * 60 * 1000,
    pinned: index === 34
  };
}
const retention = planBackupRetention(retentionCatalog, { count: 5, days: 10 }, { nowMs: T0 });
assert.ok(retention.keep.includes("backup_0"));
assert.ok(retention.keep.includes("backup_34"), "pinned backup survives retention");
assert.ok(retention.expire.includes("backup_10"));
const pruned = pruneBackupControl({
  jobs: {
    active: { backupId: "active", status: BACKUP_STATUSES.CAPTURING, updatedAtMs: T0 },
    expired: { backupId: "expired", status: BACKUP_STATUSES.COMPLETED, completedAtMs: T0 - 100 * 86400000 }
  },
  idempotency: {
    active_request: { backupId: "active" },
    expired_request: { backupId: "expired" }
  },
  lock: { backupId: "active" }
}, ["expired"], { nowMs: T0, days: 90 });
assert.equal(pruned.jobs.active.status, BACKUP_STATUSES.CAPTURING);
assert.equal(pruned.jobs.expired, undefined);
assert.equal(pruned.idempotency.expired_request, undefined);
assert.equal(pruned.lock.backupId, "active");

const retentionAdapter = createMemoryAdapter(source, T0);
const retentionRuntime = createBackupRuntime(retentionAdapter);
const retentionScopeKey = prepared.request.scopeKey;
for (let index = 0; index < 3; index += 1) {
  const backupId = `backup_${String(index).padStart(40, "a")}`;
  const objectPath = `retention/${backupId}.json`;
  retentionAdapter.storage.set(objectPath, { serialized: "{}", metadata: {}, generation: "1" });
  setPath(retentionAdapter.state, `charropro/backupFoundation/catalog/${retentionScopeKey}/${backupId}`, {
    backupId,
    scopeType: "tournament",
    scopeId: "tournament-a",
    scopeKey: retentionScopeKey,
    tenantId: "tenant-a",
    organizationId: "organization-a",
    tournamentId: "tournament-a",
    status: BACKUP_STATUSES.COMPLETED,
    createdAtMs: T0 - index * 86400000,
    storageRef: `gs://test-backups/${objectPath}`
  });
  setPath(retentionAdapter.state, `charropro/backupFoundation/control/${retentionScopeKey}/jobs/${backupId}`, {
    backupId,
    status: BACKUP_STATUSES.COMPLETED,
    completedAtMs: T0 - index * 86400000
  });
  setPath(retentionAdapter.state, `charropro/backupFoundation/control/${retentionScopeKey}/idempotency/request_${index}`, { backupId });
}
const enforced = await retentionRuntime.enforceRetention(retentionScopeKey, { count: 1, days: 90 });
assert.equal(enforced.keep.length, 1);
assert.equal(enforced.expire.length, 2);
assert.equal(retentionAdapter.storage.size, 1);
for (const backupId of enforced.expire) {
  assert.equal(getPath(retentionAdapter.state, `charropro/backupFoundation/catalog/${retentionScopeKey}/${backupId}`).status, BACKUP_STATUSES.EXPIRED);
  assert.equal(getPath(retentionAdapter.state, `charropro/backupFoundation/control/${retentionScopeKey}/jobs/${backupId}`), undefined);
}

const rulesRaw = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const rules = JSON.parse(rulesRaw).rules.charropro;
assert.equal(rules.backupFoundation[".read"], false, "clients cannot read backup control or catalog");
assert.equal(rules.backupFoundation[".write"], false, "clients cannot forge backup jobs or audit");
const functionsRaw = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
assert.match(functionsRaw, /requestCharroProBackup/);
assert.match(functionsRaw, /cancelCharroProBackup/);
assert.match(functionsRaw, /executeCharroProBackup/);
assert.match(functionsRaw, /scheduleCharroProBackups/);
assert.equal(functionsRaw.includes("publicTournaments').set"), false);
assert.equal(functionsRaw.includes("publishedScores').set"), false);

console.log("backup foundation tests passed");

function buildSource() {
  const tournamentA = {
    info: {
      id: "tournament-a",
      name: "Torneo A",
      tenantId: "tenant-a",
      organizationId: "organization-a",
      status: "activo"
    },
    charreadas: {
      charreada_a: {
        id: "charreada-a",
        individualParticipants: [
          { id: "participant-a", name: "Participante A", order: 1 },
          { id: "participant-b", name: "Participante B", order: 2 }
        ]
      }
    },
    teams: {
      team_a: { id: "team-a", name: "Equipo A" },
      team_b: { id: "team-b", name: "Equipo B" }
    },
    scores: {
      score_a: { id: "score-a", total: 0, confirmed: false, note: "", optional: null }
    },
    publishedScores: {
      published_a: { id: "published-a", total: 25, revision: 1 }
    },
    officialScoreLedger: {
      attempt_a: { attemptId: "attempt-a", revision: 1, activeRecordId: "published-a" }
    },
    officialScoreAudit: {
      event_a: { eventId: "event-a", result: "SUCCESS" }
    },
    officialScoreFanout: {
      published_a: { status: "DELIVERED" }
    }
  };
  const tournamentB = {
    info: {
      id: "tournament-b",
      name: "Torneo B",
      tenantId: "tenant-b",
      organizationId: "organization-b",
      status: "activo"
    },
    charreadas: {},
    teams: {},
    scores: {},
    publishedScores: {}
  };
  return {
    charropro: {
      tournaments: { "tournament-a": tournamentA, "tournament-b": tournamentB },
      tournamentIndex: {
        "tournament-a": { id: "tournament-a", name: "Torneo A" },
        "tournament-b": { id: "tournament-b", name: "Torneo B" }
      },
      projectionOutbox: {
        "tournament-a": { projection_a: { state: { status: "VERIFIED" } } }
      },
      publicTournaments: {
        "tournament-a": { metadata: { tournamentId: "tournament-a" }, projectionRevision: 4 }
      },
      history: { statistics: { "tournament-a": { historical_a: { total: 25 } } } },
      audit: { publishedScores: { "tournament-a": { audit_a: { result: "SUCCESS" } } } },
      judges: {
        assignments: { "tournament-a": { charreada_a: { judge_a: true } } },
        events: { event_a: { tournamentId: "tournament-a", operation: "SCORE_PUBLISHED" } }
      },
      settings: {
        globalRuleOverrides: { enabled: false },
        scoringButtonLayouts: { layout_a: { enabled: true } },
        temporaryPreference: { ignored: true }
      },
      users: { user_a: { uid: "user-a", role: "supervisor" } },
      userTournamentAccess: { user_a: { "tournament-a": true } },
      live: { "tournament-a": { current: { total: 25 } } },
      broadcastStudio: { sessions: { session_a: { status: "online" } } },
      backups: { "tournament-a": { legacy: { old: true } } },
      backupFoundation: { catalog: { forbidden: true } }
    }
  };
}

function createMemoryAdapter(seed, startMs) {
  const state = structuredClone(seed);
  const storage = new Map();
  let clock = startMs;
  let queue = Promise.resolve();
  const adapter = {
    state,
    storage,
    now() {
      clock += 1;
      return clock;
    },
    async read(path) {
      return structuredClone(getPath(state, path));
    },
    async write(path, value) {
      setPath(state, path, structuredClone(value));
    },
    async readByChild(path, child, value) {
      const records = getPath(state, path) || {};
      return Object.fromEntries(Object.entries(records).filter(([, record]) => record?.[child] === value));
    },
    async updateRoot(updates) {
      for (const [path, value] of Object.entries(updates)) setPath(state.charropro, path, structuredClone(value));
    },
    async transaction(path, updater) {
      const operation = queue.then(() => {
        const current = structuredClone(getPath(state, path));
        const next = updater(current);
        setPath(state, path, structuredClone(next));
        return { committed: true, value: structuredClone(next) };
      });
      queue = operation.catch(() => {});
      return operation;
    },
    async saveArchive(objectPath, serialized, metadata) {
      if (!storage.has(objectPath)) {
        storage.set(objectPath, {
          serialized,
          metadata: structuredClone(metadata),
          generation: "1"
        });
      }
      const stored = storage.get(objectPath);
      return {
        existing: stored.serialized !== serialized,
        storageRef: `gs://test-backups/${objectPath}`,
        objectPath,
        generation: stored.generation,
        size: Buffer.byteLength(stored.serialized, "utf8"),
        archiveChecksum: stored.metadata.archiveChecksum
      };
    },
    async readArchive(objectPath) {
      if (!storage.has(objectPath)) throw new Error("storage-object-missing");
      return storage.get(objectPath).serialized;
    },
    async deleteArchive(objectPath) {
      storage.delete(objectPath);
    }
  };
  return adapter;
}

function getPath(root, path) {
  return String(path || "").split("/").filter(Boolean).reduce((value, key) => value?.[key], root);
}

function setPath(root, path, value) {
  const parts = String(path || "").split("/").filter(Boolean);
  let target = root;
  for (const part of parts.slice(0, -1)) {
    if (!target[part] || typeof target[part] !== "object") target[part] = {};
    target = target[part];
  }
  const key = parts.at(-1);
  if (value === null) delete target[key];
  else target[key] = value;
}
