const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onValueWritten } = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
const {
  ALLOWED_ROLES,
  applyOfficialScoreTransaction,
  buildOfficialScoreFanoutUpdates,
  markOfficialScoreFanoutDelivered,
  markOfficialScoreFanoutFailed,
  prepareOfficialScoreRequest
} = require("./officialScoreConcurrency");

admin.initializeApp();

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
