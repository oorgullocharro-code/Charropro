const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onValueCreated, onValueWritten } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const {
  ALLOWED_ROLES,
  applyOfficialScoreTransaction,
  buildOfficialScoreFanoutUpdates,
  markOfficialScoreFanoutDelivered,
  markOfficialScoreFanoutFailed,
  prepareOfficialScoreRequest,
  toFirebaseDatabaseValue
} = require("./officialScoreConcurrency");
const {
  createBackupRuntime,
  createFirebaseBackupAdapter
} = require("./backupService");
const { BackupFoundationError } = require("./backupFoundation");
const {
  createFirebaseRestoreAdapter,
  createRestoreRuntime
} = require("./restoreService");
const { RestoreEngineError } = require("./restoreEngine");
const configurationDefaults = require("./configuration.defaults.json");
const {
  ConfigurationEngineError,
  getConfigurationValue,
  validateRuntimeConfigurationBaseline
} = require("./configurationEngine");
const {
  createConfigurationRuntime,
  createFirebaseConfigurationAdapter
} = require("./configurationService");
const ruleProfileCertificationRegistry = require("./ruleProfileCertificationRegistry.json");
const { RuleProfileLifecycleError } = require("./ruleProfileLifecycleEngine");
const {
  RuleProfileAssignmentError,
  applyTournamentRuleProfileAssignment
} = require("./ruleProfileAssignmentEngine");
const {
  DELETION_AUDIT_ROOT,
  TournamentDeletionError,
  assertDeletionActor,
  buildDeletionSuccess,
  buildTournamentDeletionPlan,
  buildTournamentDeletionPreflight,
  prepareTournamentDeletionRequest
} = require("./tournamentDeletionAuthority");
const {
  createFirebaseRuleProfileLifecycleAdapter,
  createRuleProfileLifecycleRuntime
} = require("./ruleProfileLifecycleService");
const { createFirebaseRestCas } = require("./firebaseRestCas");

admin.initializeApp();

const baselineValidation = validateRuntimeConfigurationBaseline(configurationDefaults);
if (!baselineValidation.valid) {
  throw new ConfigurationEngineError("configuration-baseline-invalid", { errors: baselineValidation.errors });
}
const baselineConfiguration = baselineValidation.configuration;
const FIREBASE_PATHS = getConfigurationValue(baselineConfiguration, "firebase.paths", {});
const FUNCTIONS_CONFIG = getConfigurationValue(baselineConfiguration, "firebase.functions", {});
const APPLICATION_CONFIG = getConfigurationValue(baselineConfiguration, "application", {});
const FUNCTIONS_REGION = getConfigurationValue(baselineConfiguration, "firebase.functionsRegion", "");
const CONFIGURATION_ROOT_PATH = FIREBASE_PATHS.configurationManagement;
const RULE_PROFILE_LIFECYCLE_ROOT_PATH = FIREBASE_PATHS.ruleProfileLifecycle;
const CHARROPRO_ROOT_PATH = FIREBASE_PATHS.root;
if (!FUNCTIONS_REGION || !CONFIGURATION_ROOT_PATH || !RULE_PROFILE_LIFECYCLE_ROOT_PATH || !CHARROPRO_ROOT_PATH) {
  throw new ConfigurationEngineError("configuration-bootstrap-required");
}
const backupRuntime = createBackupRuntime(createFirebaseBackupAdapter(admin), {
  appVersion: FUNCTIONS_CONFIG.backupCompatibilityAppVersion
});
const restoreRuntime = createRestoreRuntime(createFirebaseRestoreAdapter(admin));
const configurationRuntime = createConfigurationRuntime(createFirebaseConfigurationAdapter(admin, {
  rootPath: CONFIGURATION_ROOT_PATH
}), { baseline: baselineConfiguration });
const ruleProfileLifecycleRuntime = createRuleProfileLifecycleRuntime(
  createFirebaseRuleProfileLifecycleAdapter(admin, { rootPath: RULE_PROFILE_LIFECYCLE_ROOT_PATH }),
  { registry: ruleProfileCertificationRegistry }
);
const firebaseRestCas = createFirebaseRestCas(admin);

const USERS_PATH = FIREBASE_PATHS.users;
const USER_TOURNAMENT_ACCESS_PATH = FIREBASE_PATHS.userTournamentAccess;
const TOURNAMENTS_PATH = FIREBASE_PATHS.tournaments;
const AUDIT_PUBLISHED_SCORES_PATH = FIREBASE_PATHS.auditPublishedScores;
const PROJECTION_OUTBOX_PATH = FIREBASE_PATHS.projectionOutbox;
const VALID_ROLES = new Set([
  "supervisor",
  "operador",
  "juez",
  "locutor",
  "graficos",
  "organizador",
  "lectura"
]);

exports.upsertCharroProUser = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "Inicia sesion para administrar usuarios.");
  }

  await requireSupervisor(callerUid);

  const data = normalizePayload(request.data || {});
  validatePayload(data);

  const userRecord = await upsertAuthUser(data);
  const profile = {
    name: data.name,
    email: data.email,
    role: data.role,
    active: data.active,
    tournamentAccess: data.tournamentAccess,
    tournamentIds: data.tournamentIds,
    updatedAt: new Date().toISOString(),
    updatedBy: callerUid
  };

  await admin.database().ref(`${USERS_PATH}/${userRecord.uid}`).update(profile);
  await admin.database().ref(`${USER_TOURNAMENT_ACCESS_PATH}/${userRecord.uid}`).set(
    profile.tournamentAccess === "selected"
      ? Object.fromEntries(profile.tournamentIds.map((tournamentId) => [normalizeKey(tournamentId), true]))
      : {}
  );

  return {
    ok: true,
    uid: userRecord.uid,
    email: userRecord.email || data.email
  };
});

exports.publishCharroProOfficialScore = onCall({ region: FUNCTIONS_REGION }, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "Inicia sesion para publicar una calificacion oficial.");
  }

  const actor = await requireOfficialScoreActor(callerUid, request.data?.tournamentId);
  const prepared = prepareOfficialScoreRequest(request.data || {}, actor);
  if (!prepared.valid) {
    throw new HttpsError("invalid-argument", "La publicacion oficial no cumple el contrato.", {
      reason: prepared.errors[0] || "official-score-request-invalid",
      errors: prepared.errors
    });
  }

  const officialRequest = prepared.request;
  const tournamentRef = admin.database().ref(`${TOURNAMENTS_PATH}/${officialRequest.tournamentId}`);
  let transactionOutcome = null;
  const transaction = await tournamentRef.transaction((current) => {
    const applied = applyOfficialScoreTransaction(current || {}, officialRequest);
    transactionOutcome = applied.outcome;
    return toFirebaseDatabaseValue(applied.tournament);
  }, undefined, false);

  if (!transaction.committed || !transactionOutcome) {
    throw new HttpsError("aborted", "No se pudo confirmar la revision oficial.", {
      reason: "official-score-transaction-aborted"
    });
  }
  if (!transactionOutcome.ok) {
    throw new HttpsError("aborted", "La calificacion oficial cambio en otro dispositivo.", {
      ...transactionOutcome,
      reason: transactionOutcome.reason || "official-score-conflict"
    });
  }

  const tournament = transaction.snapshot.val() || {};
  const fanoutJob = tournament.officialScoreFanout?.[transactionOutcome.recordId] || null;
  let fanout = { ok: false, pending: true, reason: "official-score-fanout-pending" };
  if (fanoutJob) {
    try {
      await deliverOfficialScoreFanout(officialRequest.tournamentId, transactionOutcome.recordId, fanoutJob);
      fanout = { ok: true, pending: false, reason: "official-score-fanout-delivered" };
    } catch (error) {
      await markFanoutFailure(officialRequest.tournamentId, transactionOutcome.recordId, error);
      fanout = {
        ok: false,
        pending: true,
        reason: normalizeFunctionError(error)
      };
    }
  }

  return {
    ok: true,
    complete: fanout.ok,
    partialFailure: !fanout.ok,
    idempotent: transactionOutcome.idempotent,
    conflict: false,
    reason: transactionOutcome.reason,
    tournamentId: officialRequest.tournamentId,
    scoreId: officialRequest.scoreId,
    attemptId: transactionOutcome.attemptId,
    id: transactionOutcome.recordId,
    revision: transactionOutcome.revision,
    published: transactionOutcome.record,
    scorePath: `${TOURNAMENTS_PATH}/${officialRequest.tournamentId}/scores/${officialRequest.scoreId}`,
    publishedPath: `${TOURNAMENTS_PATH}/${officialRequest.tournamentId}/publishedScores/${transactionOutcome.recordId}`,
    auditPath: `${AUDIT_PUBLISHED_SCORES_PATH}/${officialRequest.tournamentId}/${transactionOutcome.recordId}`,
    projectionId: fanoutJob?.projectionIntent?.projectionId || "",
    projectionOutboxPath: fanoutJob?.projectionIntent?.projectionId
      ? `${PROJECTION_OUTBOX_PATH}/${officialRequest.tournamentId}/${fanoutJob.projectionIntent.projectionId}`
      : "",
    fanout
  };
});

exports.deliverCharroProOfficialScoreFanout = onValueWritten({
  ref: `/${TOURNAMENTS_PATH}/{tournamentId}/officialScoreFanout/{recordId}`,
  region: FUNCTIONS_REGION,
  retry: APPLICATION_CONFIG.retry.firebaseWorkers
}, async (event) => {
  const job = event.data.after.val();
  if (!job || job.status === "DELIVERED") return;
  const { tournamentId, recordId } = event.params;
  try {
    await deliverOfficialScoreFanout(tournamentId, recordId, job);
  } catch (error) {
    await markFanoutFailure(tournamentId, recordId, error);
    throw error;
  }
});

exports.requestCharroProBackup = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para generar un respaldo.");
  try {
    const authorization = await requireBackupActor(callerUid, request.data || {});
    return await backupRuntime.requestBackup({
      ...(request.data || {}),
      mode: "manual",
      backupType: "full",
      organizationId: authorization.actor.organizationId
    }, authorization.actor, authorization.context);
  } catch (error) {
    throw toBackupHttpsError(error);
  }
});

exports.cancelCharroProBackup = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.cancelSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para cancelar un respaldo.");
  try {
    const authorization = await requireBackupActor(callerUid, request.data || {}, { cancellation: true });
    return await backupRuntime.cancelBackup(request.data || {}, authorization.actor);
  } catch (error) {
    throw toBackupHttpsError(error);
  }
});

exports.executeCharroProBackup = onValueCreated({
  ref: `/${FIREBASE_PATHS.backupFoundation}/control/{scopeKey}/jobs/{backupId}`,
  region: FUNCTIONS_REGION,
  retry: APPLICATION_CONFIG.retry.firebaseWorkers,
  memory: FUNCTIONS_CONFIG.workerMemory,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.workerSeconds
}, async (event) => {
  const result = await backupRuntime.executeBackup(event.params.scopeKey, event.params.backupId);
  if (result?.terminal === true || result?.status === "COMPLETED") return result;
  return result;
});

exports.scheduleCharroProBackups = onSchedule({
  schedule: FUNCTIONS_CONFIG.backupSchedule,
  timeZone: FUNCTIONS_CONFIG.backupTimeZone,
  region: FUNCTIONS_REGION,
  memory: FUNCTIONS_CONFIG.scheduleMemory,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.workerSeconds
}, async () => backupRuntime.enqueueAutomaticBackups());

exports.validateCharroProRestore = onCall({
  region: FUNCTIONS_REGION,
  memory: FUNCTIONS_CONFIG.workerMemory,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.workerSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para validar una restauracion.");
  try {
    const actor = await requireRestoreActor(callerUid, request.data || {});
    return await restoreRuntime.validateRestore(request.data || {}, actor);
  } catch (error) {
    throw toRestoreHttpsError(error);
  }
});

exports.requestCharroProRestore = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para confirmar una restauracion.");
  try {
    const actor = await requireRestoreActor(callerUid, request.data || {});
    return await restoreRuntime.requestRestore(request.data || {}, actor);
  } catch (error) {
    throw toRestoreHttpsError(error);
  }
});

exports.cancelCharroProRestore = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.cancelSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para cancelar una restauracion.");
  try {
    const actor = await requireRestoreActor(callerUid, request.data || {});
    return await restoreRuntime.cancelRestore(request.data || {}, actor);
  } catch (error) {
    throw toRestoreHttpsError(error);
  }
});

exports.executeCharroProRestore = onValueCreated({
  ref: `/${FIREBASE_PATHS.restoreFoundation}/control/{scopeKey}/jobs/{restoreId}`,
  region: FUNCTIONS_REGION,
  retry: APPLICATION_CONFIG.retry.firebaseWorkers,
  memory: FUNCTIONS_CONFIG.workerMemory,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.workerSeconds
}, async (event) => {
  const result = await restoreRuntime.executeRestore(event.params.scopeKey, event.params.restoreId);
  if (result?.pending === true) throw new Error("restore-worker-already-running");
  return result;
});

exports.getCharroProConfiguration = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para consultar configuracion.");
  try {
    const actor = await requireConfigurationActor(callerUid, request.data || {}, "read");
    return await configurationRuntime.readConfiguration(request.data || {}, actor);
  } catch (error) {
    throw toConfigurationHttpsError(error);
  }
});

exports.publishCharroProConfiguration = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para publicar configuracion.");
  try {
    const actor = await requireConfigurationActor(callerUid, request.data || {}, "write");
    return await configurationRuntime.publishConfiguration(request.data || {}, actor);
  } catch (error) {
    throw toConfigurationHttpsError(error);
  }
});

exports.transitionCharroProRuleProfileLifecycle = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para administrar perfiles reglamentarios.");
  try {
    const actor = await requireRuleProfileLifecycleActor(callerUid, request.data || {});
    return await ruleProfileLifecycleRuntime.transition(request.data || {}, actor);
  } catch (error) {
    throw toRuleProfileLifecycleHttpsError(error);
  }
});

exports.getCharroProRuleProfileLifecycle = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para consultar perfiles reglamentarios.");
  try {
    const actor = await requireRuleProfileLifecycleActor(callerUid, request.data || {});
    return await ruleProfileLifecycleRuntime.read(request.data || {}, actor);
  } catch (error) {
    throw toRuleProfileLifecycleHttpsError(error);
  }
});

exports.assignCharroProTournamentRuleProfile = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para asignar perfiles reglamentarios.");
  try {
    const actor = await requireRuleProfileLifecycleActor(callerUid, request.data || {});
    const lifecycle = await ruleProfileLifecycleRuntime.read({
      profileId: request.data?.profileId,
      version: request.data?.version,
      tenantId: request.data?.tenantId,
      organizationId: request.data?.organizationId
    }, actor);
    const certificate = ruleProfileCertificationRegistry.profiles[`${request.data?.profileId || ""}@${request.data?.version || ""}`];
    if (!certificate) throw new RuleProfileAssignmentError("tournament-rule-profile-version-not-found");
    const tournamentId = normalizeKey(request.data?.tournamentId);
    const assignedAt = new Date().toISOString();
    const outcome = await firebaseRestCas.compareAndSwap(`${TOURNAMENTS_PATH}/${tournamentId}`, (current) => {
      try {
        const applied = applyTournamentRuleProfileAssignment(
          current || {},
          request.data || {},
          actor,
          lifecycle,
          certificate,
          { now: assignedAt }
        );
        return { outcome: applied.outcome, state: applied.tournament };
      } catch (error) {
        return {
          outcome: { ok: false, reason: error?.code || error?.message || "tournament-rule-profile-error" },
          state: current || null
        };
      }
    });
    if (!outcome?.ok) {
      throw new RuleProfileAssignmentError(outcome?.reason || "tournament-rule-profile-transaction-aborted", outcome || {});
    }
    await admin.database().ref(`${FIREBASE_PATHS.tournamentIndex}/${tournamentId}`).update({
      ruleProfileId: outcome.assignment.profileId,
      ruleProfileVersion: outcome.assignment.version,
      ruleProfileStatus: outcome.assignment.status,
      ruleProfileContentFingerprint: outcome.assignment.contentFingerprint,
      ruleProfileAssignmentRevision: outcome.assignment.revision
    });
    return outcome;
  } catch (error) {
    throw toRuleProfileAssignmentHttpsError(error);
  }
});

exports.deleteCharroProTournament = onCall({
  region: FUNCTIONS_REGION,
  timeoutSeconds: APPLICATION_CONFIG.timeouts.callableSeconds
}, async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Inicia sesion para eliminar un torneo.");
  const input = request.data || {};
  const tournamentId = normalizeKey(input.tournamentId);
  try {
    const actor = await requireTournamentDeletionActor(callerUid, tournamentId);
    const operation = String(input.operation || "delete").trim().toLowerCase();
    if (!new Set(["preflight", "delete"]).has(operation)) {
      throw new TournamentDeletionError("tournament-delete-operation-invalid");
    }
    const source = await readTournamentDeletionSource(tournamentId);
    assertDeletionActor(actor, source.tournament);
    const preflight = buildTournamentDeletionPreflight(source, tournamentId);
    if (operation === "preflight") return { ok: true, operation, preflight };

    const prepared = prepareTournamentDeletionRequest(input);
    if (!prepared.valid) throw new TournamentDeletionError(prepared.errors[0], { errors: prepared.errors });
    const deletionRequest = prepared.request;
    const auditRef = admin.database().ref(`${CHARROPRO_ROOT_PATH}/${DELETION_AUDIT_ROOT}/${deletionRequest.requestId}`);
    const existingAudit = (await auditRef.get()).val();
    if (existingAudit?.deleted === true && existingAudit.tournamentId === tournamentId) {
      return buildDeletionSuccess(existingAudit, true);
    }
    if (preflight.blockingReasons.length) {
      return { ok: false, code: preflight.blockingReasons[0], preflight, blockingReasons: preflight.blockingReasons };
    }
    if (preflight.revision !== deletionRequest.expectedRevision) {
      return { ok: false, code: "tournament-delete-stale-revision", preflight, expectedRevision: deletionRequest.expectedRevision, revision: preflight.revision };
    }

    const lock = await reserveTournamentDeletion(tournamentId, deletionRequest, actor);
    if (!lock.ok) return { ok: false, code: lock.code, ...lock };
    let backup = null;
    let deleted = false;
    try {
      const backupRequest = await backupRuntime.requestBackup({
        mode: "manual",
        backupType: "full",
        scopeType: "tournament",
        tournamentId,
        organizationId: actor.organizationId,
        idempotencyKey: `tournament-delete-backup:${deletionRequest.requestId}`,
        reason: "tournament-delete-authority"
      }, actor, { tournament: lock.tournament, hasTournamentAccess: true });
      backup = await waitForTournamentDeletionBackup(backupRequest.scopeKey, backupRequest.backupId);
      if (!backup.ok || backup.status !== "COMPLETED") {
        throw new TournamentDeletionError("tournament-delete-backup-failed", { backup });
      }

      const finalSource = await readTournamentDeletionSource(tournamentId);
      const finalPreflight = buildTournamentDeletionPreflight(finalSource, tournamentId);
      if (String(finalSource.tournament?.deletionAuthority?.requestId || "") !== deletionRequest.requestId) {
        throw new TournamentDeletionError("tournament-delete-lock-lost");
      }
      if (finalPreflight.blockingReasons.length) {
        return { ok: false, code: finalPreflight.blockingReasons[0], preflight: finalPreflight, blockingReasons: finalPreflight.blockingReasons };
      }
      if (finalPreflight.revision !== deletionRequest.expectedRevision) {
        return { ok: false, code: "tournament-delete-stale-revision", preflight: finalPreflight, expectedRevision: deletionRequest.expectedRevision, revision: finalPreflight.revision };
      }
      const updates = buildTournamentDeletionPlan(finalSource, finalPreflight, deletionRequest, actor, Date.now(), backup);
      await admin.database().ref(CHARROPRO_ROOT_PATH).update(updates);
      deleted = true;
      return buildDeletionSuccess(updates[`${DELETION_AUDIT_ROOT}/${deletionRequest.requestId}`]);
    } finally {
      if (!deleted) {
        await releaseTournamentDeletionLock(tournamentId, deletionRequest.requestId);
      }
    }
  } catch (error) {
    throw toTournamentDeletionHttpsError(error);
  }
});

async function requireOfficialScoreActor(uid, tournamentId) {
  const cleanTournamentId = normalizeKey(tournamentId);
  const [profileSnapshot, selectedAccessSnapshot] = await Promise.all([
    admin.database().ref(`${USERS_PATH}/${uid}`).get(),
    admin.database().ref(`${USER_TOURNAMENT_ACCESS_PATH}/${uid}/${cleanTournamentId}`).get()
  ]);
  const profile = profileSnapshot.val() || {};
  if (profile.active !== true) {
    throw new HttpsError("permission-denied", "El usuario no esta activo.", {
      reason: "official-score-user-inactive"
    });
  }
  const role = String(profile.role || "").toLowerCase();
  if (!ALLOWED_ROLES.has(role)) {
    throw new HttpsError("permission-denied", "El rol no puede publicar scores oficiales.", {
      reason: "official-score-role-denied"
    });
  }
  const profileTournamentIds = Array.isArray(profile.tournamentIds)
    ? profile.tournamentIds
    : Object.values(profile.tournamentIds || {});
  const hasAccess = role === "supervisor"
    || profile.tournamentAccess !== "selected"
    || selectedAccessSnapshot.val() === true
    || profileTournamentIds.map(String).includes(cleanTournamentId);
  if (!hasAccess) {
    throw new HttpsError("permission-denied", "El usuario no tiene acceso al torneo.", {
      reason: "official-score-tournament-access-denied"
    });
  }
  return {
    uid,
    name: String(profile.name || profile.email || "").slice(0, 160),
    email: String(profile.email || "").slice(0, 180),
    role,
    clientId: "",
    tenantId: String(profile.tenantId || "").slice(0, 128),
    organizationId: String(profile.organizationId || "").slice(0, 128)
  };
}

async function requireTournamentDeletionActor(uid, tournamentId) {
  const profileSnapshot = await admin.database().ref(`${USERS_PATH}/${uid}`).get();
  const profile = profileSnapshot.val() || {};
  return {
    uid,
    name: String(profile.name || profile.email || "").slice(0, 160),
    role: String(profile.role || "").toLowerCase(),
    active: profile.active === true,
    platformAdmin: profile.platformAdmin === true,
    tenantId: String(profile.tenantId || "").slice(0, 180),
    organizationId: String(profile.organizationId || "").slice(0, 180)
  };
}

async function readTournamentDeletionSource(tournamentId) {
  const root = CHARROPRO_ROOT_PATH;
  const database = admin.database();
  const [tournament, auditPublishedScores, historyStatistics, live, publicTournament, projectionOutbox, judgeAssignments, judgeEvents, userTournamentAccess, users, broadcastSessions] = await Promise.all([
    database.ref(`${TOURNAMENTS_PATH}/${tournamentId}`).get(),
    database.ref(`${AUDIT_PUBLISHED_SCORES_PATH}/${tournamentId}`).get(),
    database.ref(`${root}/history/statistics/${tournamentId}`).get(),
    database.ref(`${FIREBASE_PATHS.live}/${tournamentId}`).get(),
    database.ref(`${FIREBASE_PATHS.publicTournaments}/${tournamentId}`).get(),
    database.ref(`${PROJECTION_OUTBOX_PATH}/${tournamentId}`).get(),
    database.ref(`${root}/judges/assignments/${tournamentId}`).get(),
    database.ref(`${root}/judges/events`).get(),
    database.ref(USER_TOURNAMENT_ACCESS_PATH).get(),
    database.ref(USERS_PATH).get(),
    database.ref(`${FIREBASE_PATHS.broadcastStudioSessions}`).get()
  ]);
  return {
    tournament: tournament.val() || {},
    audit: { publishedScores: auditPublishedScores.val() || {} },
    historyStatistics: historyStatistics.val() || {},
    live: live.val(),
    publicTournament: publicTournament.val(),
    projectionOutbox: projectionOutbox.val() || {},
    judgeAssignments: judgeAssignments.val() || {},
    judgeEvents: judgeEvents.val() || {},
    userTournamentAccess: userTournamentAccess.val() || {},
    users: users.val() || {},
    broadcastSessions: broadcastSessions.val() || {}
  };
}

async function reserveTournamentDeletion(tournamentId, deletionRequest, actor) {
  let outcome = null;
  const result = await admin.database().ref(`${TOURNAMENTS_PATH}/${tournamentId}`).transaction((current) => {
    const tournament = current || {};
    if (!tournament.info?.id) {
      outcome = { ok: false, code: "tournament-not-found" };
      return current;
    }
    const currentRevision = Number(tournament.meta?.version ?? tournament.version ?? 0) || 0;
    if (currentRevision !== deletionRequest.expectedRevision) {
      outcome = { ok: false, code: "tournament-delete-stale-revision", revision: currentRevision };
      return current;
    }
    const pending = tournament.deletionAuthority || {};
    if (pending.requestId && pending.requestId !== deletionRequest.requestId) {
      outcome = { ok: false, code: "tournament-delete-in-progress" };
      return current;
    }
    outcome = { ok: true, tournament };
    return {
      ...tournament,
      deletionAuthority: {
        requestId: deletionRequest.requestId,
        idempotencyKey: deletionRequest.idempotencyKey,
        requestedAt: new Date().toISOString(),
        requestedBy: { uid: actor.uid, role: actor.role }
      }
    };
  }, undefined, false);
  if (!result.committed || !outcome?.ok) return outcome || { ok: false, code: "tournament-delete-lock-aborted" };
  return { ok: true, tournament: result.snapshot.val() || outcome.tournament };
}

async function releaseTournamentDeletionLock(tournamentId, requestId) {
  await admin.database().ref(`${TOURNAMENTS_PATH}/${tournamentId}`).transaction((current) => {
    if (!current || current.deletionAuthority?.requestId !== requestId) return current;
    const next = { ...current };
    delete next.deletionAuthority;
    return next;
  }, undefined, false);
}

async function waitForTournamentDeletionBackup(scopeKey, backupId) {
  const deadline = Date.now() + Math.max(5000, APPLICATION_CONFIG.timeouts.callableSeconds * 1000 - 4000);
  const path = `${FIREBASE_PATHS.backupFoundation}/control/${scopeKey}/jobs/${backupId}`;
  while (Date.now() < deadline) {
    const job = (await admin.database().ref(path).get()).val() || {};
    if (job.status === "COMPLETED") {
      return {
        ok: true,
        status: job.status,
        backupId,
        scopeKey,
        archiveChecksum: job.archiveChecksum || ""
      };
    }
    if (["FAILED", "CANCELLED", "EXPIRED"].includes(job.status)) {
      return { ok: false, status: job.status, backupId, scopeKey, reason: job.lastError || job.reason || "backup-failed" };
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return { ok: false, status: "TIMEOUT", backupId, scopeKey, reason: "tournament-delete-backup-timeout" };
}

async function requireBackupActor(uid, data = {}, options = {}) {
  const scopeType = String(data.scopeType || "tournament").trim().toLowerCase();
  const tournamentId = normalizeKey(data.tournamentId);
  const profileSnapshot = await admin.database().ref(`${USERS_PATH}/${uid}`).get();
  const profile = profileSnapshot.val() || {};
  if (profile.active !== true) {
    throw new BackupFoundationError("backup-user-inactive");
  }
  const role = String(profile.role || "").toLowerCase();
  if (!new Set(["supervisor", "operador"]).has(role)) {
    throw new BackupFoundationError("backup-role-denied");
  }

  let tournament = null;
  let hasTournamentAccess = role === "supervisor";
  if (!options.cancellation && scopeType === "tournament") {
    const [tournamentSnapshot, selectedAccessSnapshot] = await Promise.all([
      admin.database().ref(`${TOURNAMENTS_PATH}/${tournamentId}`).get(),
      admin.database().ref(`${USER_TOURNAMENT_ACCESS_PATH}/${uid}/${tournamentId}`).get()
    ]);
    tournament = tournamentSnapshot.val();
    const profileTournamentIds = Array.isArray(profile.tournamentIds)
      ? profile.tournamentIds
      : Object.values(profile.tournamentIds || {});
    hasTournamentAccess = role === "supervisor"
      || profile.tournamentAccess !== "selected"
      || selectedAccessSnapshot.val() === true
      || profileTournamentIds.map(String).includes(tournamentId);
  }
  const tournamentTenantId = String(tournament?.info?.tenantId || tournament?.meta?.tenantId || "").slice(0, 180);
  const tournamentOrganizationId = String(tournament?.info?.organizationId || tournament?.meta?.organizationId || "").slice(0, 180);
  const profileTenantId = String(profile.tenantId || "").slice(0, 180);
  const profileOrganizationId = String(profile.organizationId || "").slice(0, 180);
  if (tournamentTenantId && profileTenantId && tournamentTenantId !== profileTenantId) {
    throw new BackupFoundationError("backup-tenant-mismatch");
  }
  if (tournamentOrganizationId && profileOrganizationId && tournamentOrganizationId !== profileOrganizationId) {
    throw new BackupFoundationError("backup-organization-mismatch");
  }
  return {
    actor: {
      uid,
      name: String(profile.name || profile.email || "").slice(0, 160),
      role,
      tenantId: tournamentTenantId || profileTenantId,
      organizationId: tournamentOrganizationId || profileOrganizationId,
      platformAdmin: profile.platformAdmin === true
    },
    context: { tournament, hasTournamentAccess }
  };
}

async function requireRestoreActor(uid, data = {}) {
  const tournamentId = normalizeKey(data.tournamentId);
  const profileSnapshot = await admin.database().ref(`${USERS_PATH}/${uid}`).get();
  const profile = profileSnapshot.val() || {};
  if (profile.active !== true) throw new RestoreEngineError("restore-user-inactive");
  const role = String(profile.role || "").toLowerCase();
  if (role !== "supervisor") throw new RestoreEngineError("restore-role-denied");

  let tournament = null;
  if (tournamentId) {
    const tournamentSnapshot = await admin.database().ref(`${TOURNAMENTS_PATH}/${tournamentId}`).get();
    tournament = tournamentSnapshot.val();
  }
  const tournamentTenantId = String(tournament?.info?.tenantId || tournament?.meta?.tenantId || "").slice(0, 180);
  const tournamentOrganizationId = String(tournament?.info?.organizationId || tournament?.meta?.organizationId || "").slice(0, 180);
  const profileTenantId = String(profile.tenantId || "").slice(0, 180);
  const profileOrganizationId = String(profile.organizationId || "").slice(0, 180);
  if (tournamentTenantId && profileTenantId && tournamentTenantId !== profileTenantId) {
    throw new RestoreEngineError("restore-tenant-mismatch");
  }
  if (tournamentOrganizationId && profileOrganizationId && tournamentOrganizationId !== profileOrganizationId) {
    throw new RestoreEngineError("restore-organization-mismatch");
  }
  return {
    uid,
    name: String(profile.name || profile.email || "").slice(0, 160),
    role,
    tenantId: tournamentTenantId || profileTenantId,
    organizationId: tournamentOrganizationId || profileOrganizationId,
    platformAdmin: profile.platformAdmin === true,
    device: {
      id: String(data.device?.id || "").slice(0, 180),
      name: String(data.device?.name || "").slice(0, 180)
    }
  };
}

async function requireConfigurationActor(uid, data = {}, operation = "read") {
  const profileSnapshot = await admin.database().ref(`${USERS_PATH}/${uid}`).get();
  const profile = profileSnapshot.val() || {};
  if (profile.active !== true) throw new ConfigurationEngineError("configuration-user-inactive");
  const role = String(profile.role || "").toLowerCase();
  const requestedOrganizationId = String(
    data.organizationId || data.scope?.organizationId || profile.organizationId || ""
  ).slice(0, 128);
  const profileOrganizationId = String(profile.organizationId || "").slice(0, 128);
  if (requestedOrganizationId && !profileOrganizationId && profile.platformAdmin !== true) {
    throw new ConfigurationEngineError("configuration-organization-unresolved");
  }
  if (requestedOrganizationId && profileOrganizationId && requestedOrganizationId !== profileOrganizationId) {
    throw new ConfigurationEngineError("configuration-organization-denied");
  }
  const requestedTenantId = String(data.tenantId || data.scope?.tenantId || profile.tenantId || "").slice(0, 128);
  const profileTenantId = String(profile.tenantId || "").slice(0, 128);
  if (requestedTenantId && !profileTenantId && profile.platformAdmin !== true) {
    throw new ConfigurationEngineError("configuration-tenant-unresolved");
  }
  if (requestedTenantId && profileTenantId && requestedTenantId !== profileTenantId) {
    throw new ConfigurationEngineError("configuration-tenant-denied");
  }
  const tournamentId = normalizeOptionalKey(data.tournamentId || data.scope?.tournamentId);
  if (tournamentId) {
    const selectedAccess = await admin.database().ref(`${USER_TOURNAMENT_ACCESS_PATH}/${uid}/${tournamentId}`).get();
    const profileTournamentIds = Array.isArray(profile.tournamentIds)
      ? profile.tournamentIds
      : Object.values(profile.tournamentIds || {});
    const hasAccess = role === "supervisor"
      || profile.tournamentAccess !== "selected"
      || selectedAccess.val() === true
      || profileTournamentIds.map(String).includes(tournamentId);
    if (!hasAccess) throw new ConfigurationEngineError("configuration-tournament-denied");
  }
  if (operation === "write" && role !== "supervisor" && profile.platformAdmin !== true) {
    throw new ConfigurationEngineError("configuration-write-role-denied");
  }
  return {
    uid,
    name: String(profile.name || profile.email || "").slice(0, 180),
    role,
    tenantId: requestedTenantId || profileTenantId,
    organizationId: requestedOrganizationId || profileOrganizationId,
    platformAdmin: profile.platformAdmin === true,
    active: true
  };
}

async function requireRuleProfileLifecycleActor(uid, data = {}) {
  const profileSnapshot = await admin.database().ref(`${USERS_PATH}/${uid}`).get();
  const profile = profileSnapshot.val() || {};
  if (profile.active !== true) throw new RuleProfileLifecycleError("rule-profile-user-inactive");
  const role = String(profile.role || "").toLowerCase();
  if (role !== "supervisor" && profile.platformAdmin !== true) {
    throw new RuleProfileLifecycleError("rule-profile-role-denied");
  }
  const profileTenantId = String(profile.tenantId || "").slice(0, 128);
  const profileOrganizationId = String(profile.organizationId || "").slice(0, 128);
  const requestedTenantId = String(data.tenantId || "").slice(0, 128);
  const requestedOrganizationId = String(data.organizationId || "").slice(0, 128);
  if (requestedTenantId !== profileTenantId && profile.platformAdmin !== true) {
    throw new RuleProfileLifecycleError("rule-profile-tenant-mismatch");
  }
  if (requestedOrganizationId !== profileOrganizationId && profile.platformAdmin !== true) {
    throw new RuleProfileLifecycleError("rule-profile-organization-mismatch");
  }
  return {
    uid,
    name: String(profile.name || profile.email || "").slice(0, 180),
    role,
    tenantId: requestedTenantId,
    organizationId: requestedOrganizationId,
    platformAdmin: profile.platformAdmin === true,
    active: true
  };
}

function toBackupHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const reason = String(error?.code || error?.message || "backup-error").slice(0, 160);
  const denied = reason.includes("denied") || reason.includes("unauthorized") || reason.includes("mismatch") || reason.includes("inactive");
  const conflict = reason.includes("conflict") || reason.includes("busy") || reason.includes("aborted");
  const invalid = reason.includes("invalid") || reason.includes("required") || reason.includes("not-found") || reason.includes("not-supported");
  const code = denied ? "permission-denied" : conflict ? "aborted" : invalid ? "invalid-argument" : "internal";
  return new HttpsError(code, "No se pudo procesar la operacion de respaldo.", {
    reason,
    details: error instanceof BackupFoundationError ? error.details : undefined
  });
}

function toRestoreHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const reason = String(error?.code || error?.message || "restore-error").slice(0, 180);
  const denied = reason.includes("denied") || reason.includes("authority") || reason.includes("mismatch") || reason.includes("inactive");
  const conflict = reason.includes("conflict") || reason.includes("busy") || reason.includes("changed") || reason.includes("aborted");
  const invalid = reason.includes("invalid") || reason.includes("required") || reason.includes("not-found") || reason.includes("expired") || reason.includes("incompatible");
  const code = denied ? "permission-denied" : conflict ? "aborted" : invalid ? "invalid-argument" : "internal";
  return new HttpsError(code, "No se pudo procesar la restauracion.", {
    reason,
    details: error instanceof RestoreEngineError ? error.details : undefined
  });
}

function toConfigurationHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const reason = String(error?.code || error?.message || "configuration-error").slice(0, 180);
  const denied = reason.includes("denied") || reason.includes("required") || reason.includes("inactive") || reason.includes("unresolved");
  const conflict = reason.includes("conflict") || reason.includes("aborted") || reason.includes("duplicate");
  const invalid = reason.includes("invalid") || reason.includes("mismatch") || reason.includes("not-found") || reason.includes("limit");
  const code = denied ? "permission-denied" : conflict ? "aborted" : invalid ? "invalid-argument" : "internal";
  return new HttpsError(code, "No se pudo procesar la configuracion.", {
    reason,
    details: error instanceof ConfigurationEngineError ? error.details : undefined
  });
}

function toRuleProfileLifecycleHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const reason = String(error?.code || error?.message || "rule-profile-lifecycle-error").slice(0, 180);
  const denied = reason.includes("denied") || reason.includes("auth-required") || reason.includes("inactive")
    || reason.includes("platform-admin-required") || reason.includes("tenant-mismatch")
    || reason.includes("organization-mismatch");
  const conflict = reason.includes("conflict") || reason.includes("aborted") || reason.includes("overlap")
    || reason.includes("fingerprint-mismatch");
  const invalid = reason.includes("invalid") || reason.includes("required") || reason.includes("not-found")
    || reason.includes("failed") || reason.includes("blocked") || reason.includes("not-eligible");
  const code = denied ? "permission-denied" : conflict ? "aborted" : invalid ? "failed-precondition" : "internal";
  return new HttpsError(code, "No se pudo procesar el perfil reglamentario.", {
    reason,
    details: error instanceof RuleProfileLifecycleError ? error.details : undefined
  });
}

function toRuleProfileAssignmentHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const reason = String(error?.code || error?.message || "tournament-rule-profile-error").slice(0, 180);
  const denied = reason.includes("denied") || reason.includes("auth-required") || reason.includes("inactive")
    || reason.includes("platform-admin-required") || reason.includes("tenant-mismatch")
    || reason.includes("organization-mismatch") || reason.includes("historical-scores-blocked");
  const conflict = reason.includes("conflict") || reason.includes("aborted") || reason.includes("already-assigned");
  const invalid = reason.includes("invalid") || reason.includes("mismatch") || reason.includes("not-found")
    || reason.includes("not-active") || reason.includes("not-effective") || reason.includes("expired")
    || reason.includes("blocked") || reason.includes("required");
  const code = denied ? "permission-denied" : conflict ? "aborted" : invalid ? "failed-precondition" : "internal";
  return new HttpsError(code, "No se pudo asignar el perfil reglamentario.", {
    reason,
    details: error instanceof RuleProfileAssignmentError ? error.details : undefined
  });
}

function toTournamentDeletionHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const reason = String(error?.code || error?.message || "tournament-delete-error").slice(0, 180);
  const denied = reason.includes("auth") || reason.includes("inactive") || reason.includes("role-denied")
    || reason.includes("tenant-mismatch") || reason.includes("organization-mismatch");
  const conflict = reason.includes("stale") || reason.includes("in-progress") || reason.includes("lock");
  const invalid = reason.includes("invalid") || reason.includes("not-found") || reason.includes("history");
  return new HttpsError(denied ? "permission-denied" : conflict ? "aborted" : invalid ? "failed-precondition" : "internal", "No se pudo eliminar el torneo.", {
    reason,
    details: error instanceof TournamentDeletionError ? error.details : undefined
  });
}

async function deliverOfficialScoreFanout(tournamentId, recordId, job) {
  const updates = buildOfficialScoreFanoutUpdates(tournamentId, job);
  if (!updates) throw new Error("official-score-fanout-invalid");
  await admin.database().ref(CHARROPRO_ROOT_PATH).update(updates);
  const jobRef = admin.database().ref(`${TOURNAMENTS_PATH}/${tournamentId}/officialScoreFanout/${recordId}`);
  await jobRef.transaction((current) => {
    if (!current || current.status === "DELIVERED") return current;
    const container = { officialScoreFanout: { [recordId]: current } };
    return toFirebaseDatabaseValue(
      markOfficialScoreFanoutDelivered(container, recordId).officialScoreFanout[recordId]
    );
  }, undefined, false);
}

async function markFanoutFailure(tournamentId, recordId, error) {
  const jobRef = admin.database().ref(`${TOURNAMENTS_PATH}/${tournamentId}/officialScoreFanout/${recordId}`);
  await jobRef.transaction((current) => {
    if (!current || current.status === "DELIVERED") return current;
    const container = { officialScoreFanout: { [recordId]: current } };
    return toFirebaseDatabaseValue(
      markOfficialScoreFanoutFailed(
        container,
        recordId,
        normalizeFunctionError(error)
      ).officialScoreFanout[recordId]
    );
  }, undefined, false);
}

function normalizeFunctionError(error) {
  return String(error?.code || error?.message || "official-score-fanout-failed")
    .replace(/^functions\//, "")
    .slice(0, 120);
}

async function requireSupervisor(uid) {
  const snapshot = await admin.database().ref(`${USERS_PATH}/${uid}`).get();
  const profile = snapshot.val() || {};

  if (profile.active !== true || profile.role !== "supervisor") {
    throw new HttpsError("permission-denied", "Solo supervisor puede administrar usuarios.");
  }
}

function normalizePayload(data) {
  return {
    uid: String(data.uid || "").trim(),
    name: String(data.name || "").trim(),
    email: String(data.email || "").trim().toLowerCase(),
    password: String(data.password || ""),
    role: String(data.role || "").trim().toLowerCase(),
    active: data.active !== false,
    tournamentAccess: data.tournamentAccess === "selected" ? "selected" : "all",
    tournamentIds: Array.isArray(data.tournamentIds)
      ? [...new Set(data.tournamentIds.map((id) => String(id || "").trim()).filter(Boolean))]
      : []
  };
}

function validatePayload(data) {
  if (!data.name) {
    throw new HttpsError("invalid-argument", "Falta nombre.");
  }

  if (!isEmail(data.email)) {
    throw new HttpsError("invalid-argument", "Correo invalido.");
  }

  if (!VALID_ROLES.has(data.role)) {
    throw new HttpsError("invalid-argument", "Rol invalido.");
  }

  if (!data.uid && data.password.length < 6) {
    throw new HttpsError("invalid-argument", "La contrasena inicial debe tener minimo 6 caracteres.");
  }

  if (data.password && data.password.length < 6) {
    throw new HttpsError("invalid-argument", "La contrasena debe tener minimo 6 caracteres.");
  }
}

async function upsertAuthUser(data) {
  const authPayload = {
    email: data.email,
    displayName: data.name,
    disabled: !data.active
  };

  if (data.password) authPayload.password = data.password;

  if (data.uid) {
    return admin.auth().updateUser(data.uid, authPayload);
  }

  try {
    const existing = await admin.auth().getUserByEmail(data.email);
    return admin.auth().updateUser(existing.uid, authPayload);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    return admin.auth().createUser(authPayload);
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "current";
}

function normalizeOptionalKey(value) {
  const raw = String(value || "").trim();
  return raw ? normalizeKey(raw) : "";
}
