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
  prepareOfficialScoreRequest
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

admin.initializeApp();

const backupRuntime = createBackupRuntime(createFirebaseBackupAdapter(admin), {
  appVersion: "20260801-backup-foundation-001-v1"
});
const restoreRuntime = createRestoreRuntime(createFirebaseRestoreAdapter(admin));

const USERS_PATH = "charropro/users";
const USER_TOURNAMENT_ACCESS_PATH = "charropro/userTournamentAccess";
const VALID_ROLES = new Set([
  "supervisor",
  "operador",
  "juez",
  "locutor",
  "graficos",
  "organizador",
  "lectura"
]);

exports.upsertCharroProUser = onCall({ region: "us-central1" }, async (request) => {
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

exports.publishCharroProOfficialScore = onCall({ region: "us-central1" }, async (request) => {
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
  const tournamentRef = admin.database().ref(`charropro/tournaments/${officialRequest.tournamentId}`);
  let transactionOutcome = null;
  const transaction = await tournamentRef.transaction((current) => {
    const applied = applyOfficialScoreTransaction(current || {}, officialRequest);
    transactionOutcome = applied.outcome;
    return applied.tournament;
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
    scorePath: `charropro/tournaments/${officialRequest.tournamentId}/scores/${officialRequest.scoreId}`,
    publishedPath: `charropro/tournaments/${officialRequest.tournamentId}/publishedScores/${transactionOutcome.recordId}`,
    auditPath: `charropro/audit/publishedScores/${officialRequest.tournamentId}/${transactionOutcome.recordId}`,
    projectionId: fanoutJob?.projectionIntent?.projectionId || "",
    projectionOutboxPath: fanoutJob?.projectionIntent?.projectionId
      ? `charropro/projectionOutbox/${officialRequest.tournamentId}/${fanoutJob.projectionIntent.projectionId}`
      : "",
    fanout
  };
});

exports.deliverCharroProOfficialScoreFanout = onValueWritten({
  ref: "/charropro/tournaments/{tournamentId}/officialScoreFanout/{recordId}",
  region: "us-central1",
  retry: true
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
  region: "us-central1",
  timeoutSeconds: 60
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
  region: "us-central1",
  timeoutSeconds: 30
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
  ref: "/charropro/backupFoundation/control/{scopeKey}/jobs/{backupId}",
  region: "us-central1",
  retry: true,
  memory: "1GiB",
  timeoutSeconds: 540
}, async (event) => {
  const result = await backupRuntime.executeBackup(event.params.scopeKey, event.params.backupId);
  if (result?.terminal === true || result?.status === "COMPLETED") return result;
  return result;
});

exports.scheduleCharroProBackups = onSchedule({
  schedule: "every day 03:00",
  timeZone: "America/Mexico_City",
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 540
}, async () => backupRuntime.enqueueAutomaticBackups());

exports.validateCharroProRestore = onCall({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 540
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
  region: "us-central1",
  timeoutSeconds: 60
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
  region: "us-central1",
  timeoutSeconds: 30
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
  ref: "/charropro/restoreFoundation/control/{scopeKey}/jobs/{restoreId}",
  region: "us-central1",
  retry: true,
  memory: "1GiB",
  timeoutSeconds: 540
}, async (event) => {
  const result = await restoreRuntime.executeRestore(event.params.scopeKey, event.params.restoreId);
  if (result?.pending === true) throw new Error("restore-worker-already-running");
  return result;
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
      admin.database().ref(`charropro/tournaments/${tournamentId}`).get(),
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
    const tournamentSnapshot = await admin.database().ref(`charropro/tournaments/${tournamentId}`).get();
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

async function deliverOfficialScoreFanout(tournamentId, recordId, job) {
  const updates = buildOfficialScoreFanoutUpdates(tournamentId, job);
  if (!updates) throw new Error("official-score-fanout-invalid");
  await admin.database().ref("charropro").update(updates);
  const jobRef = admin.database().ref(`charropro/tournaments/${tournamentId}/officialScoreFanout/${recordId}`);
  await jobRef.transaction((current) => {
    if (!current || current.status === "DELIVERED") return current;
    const container = { officialScoreFanout: { [recordId]: current } };
    return markOfficialScoreFanoutDelivered(container, recordId).officialScoreFanout[recordId];
  }, undefined, false);
}

async function markFanoutFailure(tournamentId, recordId, error) {
  const jobRef = admin.database().ref(`charropro/tournaments/${tournamentId}/officialScoreFanout/${recordId}`);
  await jobRef.transaction((current) => {
    if (!current || current.status === "DELIVERED") return current;
    const container = { officialScoreFanout: { [recordId]: current } };
    return markOfficialScoreFanoutFailed(
      container,
      recordId,
      normalizeFunctionError(error)
    ).officialScoreFanout[recordId];
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
