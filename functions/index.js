const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

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
