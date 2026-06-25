import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { get, getDatabase, onValue, push, ref, set, update } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";
import { makeAccessSession, normalizeRole, normalizeTournamentAccess } from "./roles.js?v=20260622-prepare-gate1";
import { normalizeScoringButtonLayouts } from "../data/defaultScoringButtonLayouts.js?v=20260622-prepare-gate1";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD1GjI5EJYAMhe1JRM7nETHQSqHceiBBD8",
  authDomain: "charropro-e8a68.firebaseapp.com",
  databaseURL: "https://charropro-e8a68-default-rtdb.firebaseio.com",
  projectId: "charropro-e8a68",
  storageBucket: "charropro-e8a68.firebasestorage.app",
  messagingSenderId: "956248612215",
  appId: "1:956248612215:web:48645013025eddba905572"
};

const LIVE_ROOT_PATH = "charropro/live";
const TOURNAMENT_INDEX_PATH = "charropro/tournamentIndex";
const TOURNAMENTS_PATH = "charropro/tournaments";
const USERS_PATH = "charropro/users";
const GLOBAL_RULE_OVERRIDES_PATH = "charropro/settings/globalRuleOverrides";
const GLOBAL_SCORING_BUTTON_LAYOUTS_PATH = "charropro/settings/scoringButtonLayouts";
const JUDGE_SESSIONS_PATH = "charropro/judges/sessions";
const JUDGE_EVENTS_PATH = "charropro/judges/events";
const AUDIT_PUBLISHED_SCORES_PATH = "charropro/audit/publishedScores";
const HISTORY_STATISTICS_PATH = "charropro/history/statistics";

let appInstance = null;
let databaseInstance = null;
let authInstance = null;
let functionsInstance = null;

export function isFirebaseLiveConfigured() {
  return Boolean(FIREBASE_CONFIG.databaseURL);
}

export function normalizeLiveChannel(value) {
  const clean = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean;
}

export function getTournamentLiveChannel(tournament = {}) {
  return normalizeLiveChannel(tournament?.id || tournament?.liveChannel || "");
}

export function getLiveChannelFromUrl(defaultValue = "") {
  if (typeof window === "undefined") return normalizeLiveChannel(defaultValue);
  const params = new URLSearchParams(window.location.search);
  return normalizeLiveChannel(
    params.get("tournamentId") ||
      params.get("canal") ||
      params.get("channel") ||
      params.get("id") ||
      params.get("torneo") ||
      params.get("tournament") ||
      params.get("evento") ||
      params.get("event") ||
      defaultValue
  );
}

export function getFirebaseLivePath(channel = "") {
  const liveChannel = normalizeLiveChannel(channel);
  return liveChannel ? `${LIVE_ROOT_PATH}/${liveChannel}` : "";
}

export async function publishFirebaseLive(payload, options = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const liveChannel = requireLiveChannel(payload, options);
    await writeLiveSet(buildLiveRootPayload({ ...payload, liveChannel }), liveChannel);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function publishFirebaseAuditScore(score) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const record = compactPublishedScore(score);
    const tournamentId = record?.tournament?.id || "sin_torneo";
    const recordId = record?.id || createId("publicado");
    await set(ref(getFirebaseDatabase(), `${AUDIT_PUBLISHED_SCORES_PATH}/${tournamentId}/${recordId}`), {
      ...record,
      id: recordId
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function publishFirebaseStatHistory(snapshot) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const record = compactStatHistorySnapshot(snapshot);
    const tournamentId = record?.tournament?.id || "sin_torneo";
    const recordId = record?.id || createId("historial");
    const payload = { ...record, id: recordId };
    await update(ref(getFirebaseDatabase(), `${HISTORY_STATISTICS_PATH}/${tournamentId}`), cleanUndefined({
      latest: payload,
      [`snapshots/${recordId}`]: payload
    }));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export function subscribeFirebaseStatHistory(callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    return onValue(ref(getFirebaseDatabase(), HISTORY_STATISTICS_PATH), (snapshot) => {
      callback(flattenStatHistorySnapshots(snapshot.val()));
    }, () => {
      callback([]);
    });
  } catch {
    return () => {};
  }
}

export async function deleteFirebaseTournament(tournamentId, actor = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return buildDeleteTournamentError("missing-tournament", { tournamentId, actor });
  if (!isFirebaseLiveConfigured()) return buildDeleteTournamentError("missing-firebase", { tournamentId: cleanTournamentId, actor });

  const authUser = getFirebaseAuth().currentUser;
  if (!authUser?.uid) {
    return buildDeleteTournamentError("not-authenticated", { tournamentId: cleanTournamentId, actor });
  }

  let profile = null;
  try {
    const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${authUser.uid}`));
    if (!profileSnapshot.exists()) {
      return buildDeleteTournamentError("missing-profile", { tournamentId: cleanTournamentId, uid: authUser.uid, email: authUser.email || "", actor });
    }
    profile = profileSnapshot.val() || {};
  } catch (error) {
    return buildDeleteTournamentError(normalizeFirebaseFailureReason(error), {
      phase: "read-profile",
      tournamentId: cleanTournamentId,
      uid: authUser.uid,
      email: authUser.email || "",
      actor,
      error
    });
  }

  if (profile.active !== true) {
    return buildDeleteTournamentError("inactive-user", { tournamentId: cleanTournamentId, uid: authUser.uid, profile, actor });
  }

  if (normalizeRole(profile.role) !== "supervisor") {
    return buildDeleteTournamentError("not-supervisor", { tournamentId: cleanTournamentId, uid: authUser.uid, profile, actor });
  }

  const backupResult = await createFirebaseTournamentBackup(cleanTournamentId, {
    ...actor,
    uid: authUser.uid,
    email: profile.email || authUser.email || "",
    name: profile.name || actor.name || "",
    role: profile.role || actor.role || ""
  });
  if (!backupResult.ok && backupResult.reason !== "missing-tournament-data") {
    return buildDeleteTournamentError("backup-failed", {
      phase: "backup-before-delete",
      tournamentId: cleanTournamentId,
      uid: authUser.uid,
      profile,
      backupReason: backupResult.reason,
      backupDetail: backupResult.detail || null
    });
  }

  const deleteUpdates = {
    [`tournamentIndex/${cleanTournamentId}`]: null,
    [`tournaments/${cleanTournamentId}`]: null,
    [`live/${cleanTournamentId}`]: null,
    [`history/statistics/${cleanTournamentId}`]: null,
    [`audit/publishedScores/${cleanTournamentId}`]: null
  };

  try {
    await update(ref(getFirebaseDatabase(), "charropro"), cleanUndefined(deleteUpdates));
  } catch (error) {
    return buildDeleteTournamentError(normalizeFirebaseFailureReason(error), {
      phase: "delete-tournament-data",
      tournamentId: cleanTournamentId,
      uid: authUser.uid,
      profile,
      updates: Object.keys(deleteUpdates),
      error
    });
  }

  const cleanupUpdates = {};
  try {
    const usersSnapshot = await get(ref(getFirebaseDatabase(), USERS_PATH));
    Object.entries(usersSnapshot.val() || {}).forEach(([uid, userProfile]) => {
      const ids = getProfileTournamentIds(userProfile).filter((id) => normalizeLiveChannel(id) !== cleanTournamentId);
      cleanupUpdates[`users/${uid}/tournamentIds`] = ids;
      cleanupUpdates[`userTournamentAccess/${uid}/${cleanTournamentId}`] = null;
    });

    if (Object.keys(cleanupUpdates).length) {
      await update(ref(getFirebaseDatabase(), "charropro"), cleanUndefined(cleanupUpdates));
    }
    return {
      ok: true,
      reason: "deleted",
      cleanupOk: true,
      deletedTournamentId: cleanTournamentId
    };
  } catch (error) {
    const cleanupReason = normalizeFirebaseFailureReason(error);
    console.error("[CharroPro] deleteFirebaseTournament cleanup failed", {
      reason: cleanupReason,
      phase: "cleanup-user-access",
      tournamentId: cleanTournamentId,
      uid: authUser.uid,
      profile,
      updates: Object.keys(cleanupUpdates),
      error
    });
    return {
      ok: true,
      reason: "cleanup-failed",
      cleanupOk: false,
      cleanupReason,
      deletedTournamentId: cleanTournamentId
    };
  }
}

export async function publishFirebaseTurn(payload, options = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const liveChannel = requireLiveChannel(payload, options);
    const nextPayload = {
      action: payload.action || "update_live_graphics",
      timestamp: payload.timestamp || new Date().toISOString(),
      firebaseUpdatedAt: Date.now(),
      liveChannel,
      tournament: compactTournament(payload.tournament),
      charreada: compactCharreada(payload.charreada),
      turn: compactTurn(payload.turn),
      timer: compactTimer(payload.timer),
      coleadero: compactColeadero(payload.coleadero),
      published: compactPublishedScore(payload.published)
    };
    if (Array.isArray(payload.leaderboard)) nextPayload.leaderboard = payload.leaderboard.map(compactLeaderboardItem);
    if (payload.teamStandings) nextPayload.teamStandings = compactTeamStandings(payload.teamStandings);
    await writeLiveUpdate(buildLivePartialUpdate(nextPayload), liveChannel);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

function buildDeleteTournamentError(reason, detail = {}) {
  console.error("[CharroPro] deleteFirebaseTournament failed", {
    reason,
    ...detail
  });
  return {
    ok: false,
    reason,
    detail: normalizeErrorDetail(detail)
  };
}

function normalizeFirebaseFailureReason(error) {
  const raw = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (raw.includes("permission")) return "permission-denied";
  if (raw.includes("auth") || raw.includes("unauth")) return "not-authenticated";
  return error?.code || error?.message || "firebase-error";
}

function normalizeErrorDetail(detail = {}) {
  const normalized = { ...detail };
  if (normalized.error instanceof Error) {
    normalized.error = {
      code: normalized.error.code || "",
      message: normalized.error.message || "",
      stack: normalized.error.stack || ""
    };
  }
  return normalized;
}

function resolveVisibleTournamentIds(profile = {}, accessProfile = {}, userTournamentAccess = {}, indexById = {}) {
  const profileAccess = normalizeTournamentAccess(profile || {});
  const fallbackAccess = normalizeTournamentAccess(accessProfile || {});
  const role = normalizeRole(profile.role || accessProfile.role);
  if (role === "supervisor" || profileAccess.tournamentAccess !== "selected") {
    return new Set(Object.keys(indexById || {}).filter(Boolean));
  }

  const ids = new Set([
    ...(profileAccess.tournamentIds || []),
    ...(fallbackAccess.tournamentIds || []),
    ...Object.entries(userTournamentAccess || {})
      .filter(([, enabled]) => enabled !== false)
      .map(([id]) => id)
  ].map(normalizeLiveChannel).filter(Boolean));

  return ids;
}

function buildTournamentRecordCounts(record = {}) {
  return {
    teams: countStoredRecords(record.teams),
    charreadas: countStoredRecords(record.charreadas),
    scores: countStoredRecords(record.scores),
    publishedScores: countStoredRecords(record.publishedScores)
  };
}

function countStoredRecords(value) {
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).filter((item) => item !== null && item !== undefined).length;
}

export async function publishFirebaseGraphicsConfig(graphicsConfig, options = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const liveChannel = requireLiveChannel(null, options);
    await writeLiveUpdate({
      graphicsConfig,
      firebaseUpdatedAt: Date.now(),
      liveChannel,
      timestamp: new Date().toISOString()
    }, liveChannel);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function publishFirebaseTimer(timer, options = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const liveChannel = requireLiveChannel(timer, options);
    const compactedTimer = compactTimer(timer);
    await writeLiveUpdate({
      timer: compactedTimer,
      "current/action": "update_live_graphics",
      "current/timer": compactedTimer,
      firebaseUpdatedAt: Date.now(),
      liveChannel,
      timestamp: new Date().toISOString()
    }, liveChannel);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function publishFirebaseGlobalRuleOverrides(ruleOverrides = {}, updatedAt = null) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    await set(ref(getFirebaseDatabase(), GLOBAL_RULE_OVERRIDES_PATH), cleanUndefined({
      updatedAt: updatedAt || new Date().toISOString(),
      ruleOverrides: ruleOverrides || {}
    }));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function publishFirebaseScoringButtonLayouts(layouts = {}, updatedAt = null) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    await set(ref(getFirebaseDatabase(), GLOBAL_SCORING_BUTTON_LAYOUTS_PATH), cleanUndefined({
      updatedAt: updatedAt || new Date().toISOString(),
      layouts: normalizeScoringButtonLayouts(layouts)
    }));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export function subscribeFirebaseLive(callback, options = {}) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    const liveChannel = resolveLiveChannel(null, options) || getLiveChannelFromUrl();
    const path = getFirebaseLivePath(liveChannel);
    if (!path) return () => {};
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const payload = unpackLiveRootPayload(snapshot.val());
      if (payload) callback(payload);
    });
  } catch {
    return () => {};
  }
}

function resolveLiveChannel(payload = null, options = {}) {
  if (typeof options === "string") return normalizeLiveChannel(options);
  return normalizeLiveChannel(options.channel || options.liveChannel || payload?.liveChannel || payload?.tournament?.liveChannel || payload?.tournament?.id);
}

function requireLiveChannel(payload = null, options = {}) {
  const liveChannel = resolveLiveChannel(payload, options);
  if (!liveChannel) throw new Error("missing-tournament");
  return liveChannel;
}

function getLiveWritePaths(channel) {
  const liveChannel = normalizeLiveChannel(channel);
  const path = getFirebaseLivePath(liveChannel);
  if (!path) throw new Error("missing-tournament");
  return [path];
}

async function writeLiveSet(payload, channel) {
  const value = cleanUndefined(payload);
  await Promise.all(getLiveWritePaths(channel).map((path) => update(ref(getFirebaseDatabase(), path), value)));
}

async function writeLiveUpdate(payload, channel) {
  const value = cleanUndefined(payload);
  await Promise.all(getLiveWritePaths(channel).map((path) => update(ref(getFirebaseDatabase(), path), value)));
}

export function subscribeFirebaseGlobalRuleOverrides(callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    return onValue(ref(getFirebaseDatabase(), GLOBAL_RULE_OVERRIDES_PATH), (snapshot) => {
      const payload = snapshot.val();
      if (payload) callback(payload);
    });
  } catch {
    return () => {};
  }
}

export function subscribeFirebaseScoringButtonLayouts(callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    return onValue(ref(getFirebaseDatabase(), GLOBAL_SCORING_BUTTON_LAYOUTS_PATH), (snapshot) => {
      const payload = snapshot.val();
      if (payload) callback({
        updatedAt: payload.updatedAt || "",
        layouts: normalizeScoringButtonLayouts(payload.layouts || payload)
      });
    });
  } catch {
    return () => {};
  }
}

export function subscribeFirebaseAuditScores(tournamentId, callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    const path = tournamentId ? `${AUDIT_PUBLISHED_SCORES_PATH}/${tournamentId}` : AUDIT_PUBLISHED_SCORES_PATH;
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      callback(flattenAuditScores(snapshot.val(), Boolean(tournamentId)));
    });
  } catch {
    return () => {};
  }
}

export function subscribeFirebaseUsers(callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    return onValue(ref(getFirebaseDatabase(), USERS_PATH), (snapshot) => {
      callback(formatFirebaseUsers(snapshot.val()));
    });
  } catch {
    return () => {};
  }
}

export async function saveFirebaseUserProfile(uid, profile = {}) {
  if (!uid || !isFirebaseLiveConfigured()) return { ok: false, reason: "missing-user" };

  try {
    const access = normalizeTournamentAccess(profile);
    await set(ref(getFirebaseDatabase(), `${USERS_PATH}/${uid}`), cleanUndefined({
      name: String(profile.name || "").trim(),
      email: String(profile.email || "").trim(),
      role: normalizeRole(profile.role),
      active: profile.active !== false,
      ...access,
      updatedAt: new Date().toISOString()
    }));
    await set(ref(getFirebaseDatabase(), `charropro/userTournamentAccess/${uid}`), cleanUndefined(
      access.tournamentAccess === "selected"
        ? Object.fromEntries(access.tournamentIds.map((tournamentId) => [normalizeLiveChannel(tournamentId), true]))
        : {}
    ));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function saveFirebaseAuthUserProfile(profile = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const callable = httpsCallable(getFirebaseFunctions(), "upsertCharroProUser");
    const result = await callable(cleanUndefined({
      uid: String(profile.uid || "").trim() || null,
      name: String(profile.name || "").trim(),
      email: String(profile.email || "").trim(),
      password: String(profile.password || ""),
      role: normalizeRole(profile.role),
      active: profile.active !== false,
      ...normalizeTournamentAccess(profile)
    }));
    return { ok: true, uid: result.data?.uid || profile.uid || "" };
  } catch (error) {
    return { ok: false, reason: error.code || error.message || "functions-error" };
  }
}

export function subscribeFirebaseAuthSession(callback) {
  try {
    let profileUnsubscribe = null;
    const authUnsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (!user) {
        callback(makeAccessSession(null));
        return;
      }

      profileUnsubscribe = onValue(ref(getFirebaseDatabase(), `${USERS_PATH}/${user.uid}`), (snapshot) => {
        const profile = snapshot.val() || {};
        callback(makeAccessSession(user, {
          ...profile,
          uid: user.uid,
          email: profile.email || user.email || "",
          role: normalizeRole(profile.role),
          active: profile.active !== false
        }));
      }, () => {
        callback(makeAccessSession(user, {
          uid: user.uid,
          email: user.email || "",
          role: "",
          active: false
        }));
      });
    });

    return () => {
      if (profileUnsubscribe) profileUnsubscribe();
      authUnsubscribe();
    };
  } catch {
    callback(makeAccessSession(null));
    return () => {};
  }
}

export function subscribeAuditAuth(callback) {
  try {
    return subscribeFirebaseAuthSession((session) => callback(session.user, session));
  } catch {
    callback(null, makeAccessSession(null));
    return () => {};
  }
}

export async function signInFirebaseUser(email, password) {
  try {
    const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    const profile = await readFirebaseUserProfile(result.user);
    return { ok: true, user: result.user, session: makeAccessSession(result.user, profile) };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function signInAuditUser(email, password) {
  return signInFirebaseUser(email, password);
}

export async function signOutFirebaseUser() {
  try {
    await signOut(getFirebaseAuth());
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function signOutAuditUser() {
  return signOutFirebaseUser();
}

export async function readFirebasePreparationSnapshot(accessProfile = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const authUser = getFirebaseAuth().currentUser;
    if (!authUser?.uid) return { ok: false, reason: "not-authenticated" };

    const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${authUser.uid}`));
    if (!profileSnapshot.exists()) {
      return { ok: false, reason: "missing-profile", uid: authUser.uid, email: authUser.email || "" };
    }

    const rawProfile = profileSnapshot.val() || {};
    const access = normalizeTournamentAccess(rawProfile);
    const profile = {
      ...rawProfile,
      uid: authUser.uid,
      email: rawProfile.email || authUser.email || "",
      role: normalizeRole(rawProfile.role),
      active: rawProfile.active !== false,
      ...access
    };

    if (profile.active !== true) return { ok: false, reason: "inactive-user", profile };

    const userAccessSnapshot = await get(ref(getFirebaseDatabase(), `charropro/userTournamentAccess/${authUser.uid}`));
    const userTournamentAccess = userAccessSnapshot.val() || {};
    const indexSnapshot = await get(ref(getFirebaseDatabase(), TOURNAMENT_INDEX_PATH));
    const indexById = indexSnapshot.val() || {};
    const visibleIds = resolveVisibleTournamentIds(profile, accessProfile, userTournamentAccess, indexById);
    const tournamentIndex = Object.values(indexById)
      .filter((item) => item?.id && visibleIds.has(item.id))
      .sort((a, b) => Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0));
    const tournaments = {};

    await Promise.all(tournamentIndex.map(async (item) => {
      const id = normalizeLiveChannel(item.id);
      if (!id) return;
      const tournamentSnapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${id}`));
      const value = tournamentSnapshot.val();
      if (value) tournaments[id] = inflateTournamentStatePayload(id, value);
    }));

    return {
      ok: true,
      profile,
      tournamentIndex,
      userTournamentAccess,
      tournaments,
      syncedAt: new Date().toISOString(),
      syncedAtMs: Date.now()
    };
  } catch (error) {
    console.error("[CharroPro] readFirebasePreparationSnapshot failed", error);
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
  }
}

export async function readFirebaseTournamentSafetySnapshot(tournamentId) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const snapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${cleanTournamentId}`));
    if (!snapshot.exists()) {
      return {
        ok: true,
        missing: true,
        tournamentId: cleanTournamentId,
        version: 0,
        counts: buildTournamentRecordCounts({})
      };
    }

    const record = snapshot.val() || {};
    return {
      ok: true,
      missing: false,
      tournamentId: cleanTournamentId,
      version: Number(record.meta?.version || 0),
      meta: record.meta || {},
      counts: buildTournamentRecordCounts(record),
      updatedAt: record.meta?.updatedAt || "",
      updatedAtMs: Number(record.meta?.updatedAtMs || 0)
    };
  } catch (error) {
    console.error("[CharroPro] readFirebaseTournamentSafetySnapshot failed", {
      tournamentId: cleanTournamentId,
      error
    });
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
  }
}

export async function createFirebaseTournamentBackup(tournamentId, actor = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const snapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${cleanTournamentId}`));
    if (!snapshot.exists()) return { ok: false, reason: "missing-tournament-data" };

    const record = snapshot.val() || {};
    const timestamp = Date.now();
    await set(ref(getFirebaseDatabase(), `charropro/backups/${cleanTournamentId}/${timestamp}`), cleanUndefined({
      info: record.info || null,
      teams: record.teams || [],
      charreadas: record.charreadas || [],
      scores: record.scores || {},
      publishedScores: record.publishedScores || [],
      history: record.history || [],
      meta: record.meta || {},
      createdAt: new Date(timestamp).toISOString(),
      createdAtMs: timestamp,
      createdBy: compactActor(actor)
    }));
    return { ok: true, id: String(timestamp), tournamentId: cleanTournamentId };
  } catch (error) {
    console.error("[CharroPro] createFirebaseTournamentBackup failed", {
      tournamentId: cleanTournamentId,
      actor,
      error
    });
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
  }
}

export async function publishFirebaseScore(tournamentId, scoreId, scorePayload, actor = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  const cleanScoreId = String(scoreId || "").trim();
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!cleanScoreId) return { ok: false, reason: "missing-score" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const now = Date.now();
    const meta = {
      updatedAt: new Date(now).toISOString(),
      updatedAtMs: now,
      updatedBy: compactActor(actor),
      updatedByName: actor.name || actor.email || ""
    };
    await update(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${cleanTournamentId}`), cleanUndefined({
      [`scores/${cleanScoreId}`]: scorePayload,
      "meta/updatedAt": meta.updatedAt,
      "meta/updatedAtMs": meta.updatedAtMs,
      "meta/updatedBy": meta.updatedBy,
      "meta/updatedByName": meta.updatedByName
    }));
    console.info("[score] guardado en CharroPro por nodo individual", {
      path: `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores/${cleanScoreId}`,
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId
    });
    return { ok: true, path: `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores/${cleanScoreId}` };
  } catch (error) {
    console.error("[CharroPro] publishFirebaseScore failed", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      actor,
      error
    });
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
  }
}

export async function publishFirebaseTournamentState(tournamentId, appState = {}, actor = {}) {
  if (!tournamentId || !isFirebaseLiveConfigured()) return { ok: false, reason: "missing-tournament" };

  try {
    const cleanTournamentId = normalizeLiveChannel(tournamentId);
    const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}`;
    const snapshot = await get(ref(getFirebaseDatabase(), path));
    const remote = snapshot.val()?.meta || {};
    const version = Number(remote.version || 0) + 1;
    const now = Date.now();
    const record = compactTournamentRecord(cleanTournamentId, appState);
    const meta = {
      ...record.meta,
      version,
      updatedAt: new Date(now).toISOString(),
      updatedAtMs: now,
      updatedBy: compactActor(actor),
      updatedByName: actor.name || actor.email || "",
      clientId: actor.clientId || ""
    };
    const payload = cleanUndefined({
      ...record,
      meta
    });

    await update(ref(getFirebaseDatabase(), path), payload);
    await update(ref(getFirebaseDatabase(), `${TOURNAMENT_INDEX_PATH}/${cleanTournamentId}`), compactTournamentIndex(payload));
    return { ok: true, version };
  } catch (error) {
    console.error("[CharroPro] publishFirebaseTournamentState failed", {
      tournamentId,
      actor,
      error
    });
    return { ok: false, reason: error.message };
  }
}

export function subscribeFirebaseTournamentState(tournamentId, callback) {
  if (!tournamentId || !isFirebaseLiveConfigured()) return () => {};

  try {
    return onValue(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${normalizeLiveChannel(tournamentId)}`), (snapshot) => {
      const payload = snapshot.val();
      if (payload) callback(inflateTournamentStatePayload(tournamentId, payload));
      else callback({
        deleted: true,
        tournamentId: normalizeLiveChannel(tournamentId),
        updatedAtMs: Date.now()
      });
    });
  } catch {
    return () => {};
  }
}

export function subscribeFirebaseTournamentIndex(callback, accessProfile = {}) {
  if (!isFirebaseLiveConfigured()) return () => {};

  try {
    const access = normalizeTournamentAccess(accessProfile || {});
    const role = normalizeRole(accessProfile?.role);
    if (role !== "supervisor" && access.tournamentAccess === "selected") {
      const records = new Map();
      const ids = access.tournamentIds || [];
      if (!ids.length) {
        callback([]);
        return () => {};
      }
      const unsubscribers = ids.map((tournamentId) =>
        onValue(ref(getFirebaseDatabase(), `${TOURNAMENT_INDEX_PATH}/${normalizeLiveChannel(tournamentId)}`), (snapshot) => {
          const value = snapshot.val();
          if (value) records.set(tournamentId, value);
          else records.delete(tournamentId);
          callback([...records.values()]);
        }, () => {
          records.delete(tournamentId);
          callback([...records.values()]);
        })
      );
      return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    }

    return onValue(ref(getFirebaseDatabase(), TOURNAMENT_INDEX_PATH), (snapshot) => {
      const value = snapshot.val() || {};
      callback(Object.values(value).filter(Boolean));
    }, () => {
      callback([]);
    });
  } catch {
    return () => {};
  }
}

export async function registerJudgeSession(session) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const sessionId = session.id || createId("juez");
    await update(ref(getFirebaseDatabase(), `${JUDGE_SESSIONS_PATH}/${sessionId}`), cleanUndefined({
      ...session,
      id: sessionId,
      active: true,
      updatedAt: new Date().toISOString()
    }));
    return { ok: true, id: sessionId };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export async function publishJudgeEvent(event) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const eventRef = push(ref(getFirebaseDatabase(), JUDGE_EVENTS_PATH));
    await set(eventRef, cleanUndefined({
      ...event,
      id: eventRef.key,
      createdAt: new Date().toISOString()
    }));
    return { ok: true, id: eventRef.key };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

async function readFirebaseUserProfile(user) {
  if (!user?.uid || !isFirebaseLiveConfigured()) return null;

  try {
    const snapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${user.uid}`));
    const profile = snapshot.val() || {};
    return {
      ...profile,
      uid: user.uid,
      email: profile.email || user.email || "",
      role: normalizeRole(profile.role),
      active: profile.active !== false
    };
  } catch {
    return {
      uid: user.uid,
      email: user.email || "",
      role: "",
      active: false
    };
  }
}

function getFirebaseDatabase() {
  if (!appInstance) appInstance = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  if (!databaseInstance) databaseInstance = getDatabase(appInstance);
  return databaseInstance;
}

function getFirebaseAuth() {
  if (!appInstance) appInstance = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  if (!authInstance) authInstance = getAuth(appInstance);
  return authInstance;
}

function getFirebaseFunctions() {
  if (!appInstance) appInstance = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  if (!functionsInstance) functionsInstance = getFunctions(appInstance, "us-central1");
  return functionsInstance;
}

function compactLivePayload(payload = {}) {
  return cleanUndefined({
    action: payload.action || "update_live_graphics",
    timestamp: payload.timestamp || new Date().toISOString(),
    firebaseUpdatedAt: Date.now(),
    liveChannel: normalizeLiveChannel(payload.liveChannel || payload.tournament?.liveChannel || payload.tournament?.id),
    tournament: compactTournament(payload.tournament),
    charreada: compactCharreada(payload.charreada),
    turn: compactTurn(payload.turn),
    timer: compactTimer(payload.timer),
    graphicsConfig: payload.graphicsConfig || null,
	    leaderboard: (payload.leaderboard || []).map(compactLeaderboardItem),
	    coleadero: compactColeadero(payload.coleadero),
		    teamStandings: compactTeamStandings(payload.teamStandings),
		    published: compactPublishedScore(payload.published)
		  });
}

function buildLiveRootPayload(payload = {}) {
  const current = compactLivePayload(payload);
  return cleanUndefined({
    tournamentId: current.tournament?.id || current.liveChannel || "",
    liveChannel: current.liveChannel || current.tournament?.id || "",
    timestamp: current.timestamp,
    firebaseUpdatedAt: current.firebaseUpdatedAt,
    current,
    timer: current.timer,
    turn: current.turn,
    ranking: {
      leaderboard: current.leaderboard || [],
      teamStandings: current.teamStandings || null
    },
    category: {
      tournament: current.tournament,
      charreada: current.charreada,
      leaderboard: current.leaderboard || []
    },
    calaDetail: current.published || null,
    coleadero: current.coleadero || null
  });
}

function buildLivePartialUpdate(payload = {}) {
  const current = compactLivePayload(payload);
  return cleanUndefined({
    tournamentId: current.tournament?.id || current.liveChannel || "",
    liveChannel: current.liveChannel || current.tournament?.id || "",
    timestamp: current.timestamp,
    firebaseUpdatedAt: current.firebaseUpdatedAt,
    current,
    timer: current.timer,
    turn: current.turn,
    ranking: {
      leaderboard: current.leaderboard || [],
      teamStandings: current.teamStandings || null
    },
    category: {
      tournament: current.tournament,
      charreada: current.charreada,
      leaderboard: current.leaderboard || []
    },
    calaDetail: current.published || null,
    coleadero: current.coleadero || null
  });
}

function unpackLiveRootPayload(value = {}) {
  if (!value || typeof value !== "object") return null;
  if (!value.current) return value;
  const current = value.current || {};
  return cleanUndefined({
    ...current,
    timestamp: value.timestamp || current.timestamp,
    firebaseUpdatedAt: Number(value.firebaseUpdatedAt || current.firebaseUpdatedAt || 0),
    liveChannel: value.liveChannel || current.liveChannel || value.tournamentId || "",
    timer: value.timer || current.timer,
    turn: value.turn || current.turn,
    leaderboard: value.ranking?.leaderboard || current.leaderboard || [],
    teamStandings: value.ranking?.teamStandings || current.teamStandings || null,
    coleadero: value.coleadero || current.coleadero || null,
    graphicsConfig: value.graphicsConfig || current.graphicsConfig || null,
    published: value.calaDetail || current.published || null
  });
}

function formatFirebaseUsers(value = {}) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value)
    .map(([uid, profile]) => {
      const tournamentAccess = normalizeTournamentAccess(profile || {});
      return {
        uid,
        name: profile?.name || "",
        email: profile?.email || "",
        role: normalizeRole(profile?.role),
        active: profile?.active !== false,
        updatedAt: profile?.updatedAt || "",
        ...tournamentAccess
      };
    })
    .sort((a, b) => String(a.name || a.email || a.uid).localeCompare(String(b.name || b.email || b.uid), "es"));
}

function getProfileTournamentIds(profile = {}) {
  const raw = profile?.tournamentIds;
  if (Array.isArray(raw)) return raw.map((id) => String(id || "").trim()).filter(Boolean);
  if (raw && typeof raw === "object") return Object.values(raw).map((id) => String(id || "").trim()).filter(Boolean);
  return [];
}

function flattenStatHistorySnapshots(value = {}) {
  if (!value || typeof value !== "object") return [];
  return Object.values(value)
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const snapshots = entry.snapshots && typeof entry.snapshots === "object"
        ? Object.values(entry.snapshots)
        : [];
      return snapshots.length ? snapshots : [entry.latest].filter(Boolean);
    })
    .map(compactStatHistorySnapshot)
    .filter((snapshot) => snapshot?.tournament?.id);
}

function compactActor(actor = {}) {
  return {
    uid: actor.uid || actor.id || "",
    email: actor.email || "",
    name: actor.name || "",
    role: normalizeRole(actor.role),
    clientId: actor.clientId || ""
  };
}

function compactTournamentRecord(tournamentId, appState = {}) {
  const cleanTournamentId = String(tournamentId || "").trim();
  const settings = appState.settings || {};
  const tournament = (appState.tournaments || []).find((item) => item.id === cleanTournamentId) || { id: cleanTournamentId };
  const teams = (appState.teams || []).filter((team) => team.tournamentId === cleanTournamentId);
  const charreadas = (appState.charreadas || []).filter((charreada) => charreada.tournamentId === cleanTournamentId);
  const teamIds = new Set(teams.map((team) => team.id).filter(Boolean));
  const charreadaIds = new Set(charreadas.map((charreada) => charreada.id).filter(Boolean));
  const scores = Object.fromEntries(
    Object.entries(appState.scores || {}).filter(([key]) => scoreKeyBelongsToTournament(key, charreadaIds, teamIds))
  );
  const publishedScores = (appState.publishedScores || []).filter((score) =>
    publishedScoreBelongsToTournament(score, cleanTournamentId, charreadaIds, teamIds)
  );
  const history = (appState.statHistorySnapshots || []).filter((snapshot) =>
    (snapshot.tournament?.id || snapshot.tournamentId || "") === cleanTournamentId
  );

  return cleanUndefined({
    info: compactStoredTournament(tournament),
    teams: teams.map(compactStoredTeam),
    charreadas: charreadas.map(compactStoredCharreada),
    scores,
    publishedScores: publishedScores.map(compactPublishedScore),
    history: history.map(compactStatHistorySnapshot),
    settings: {
      googleSheetsUrl: settings.googleSheetsUrl || "",
      lastSyncAt: settings.lastSyncAt || null,
      graphicsConfig: settings.graphicsConfig || null,
      scoringButtonLayouts: normalizeScoringButtonLayouts(tournament.scoringButtonLayouts || settings.scoringButtonLayouts || {}),
      globalRuleOverrides: settings.globalRuleOverrides || {},
      globalRuleOverridesUpdatedAt: settings.globalRuleOverridesUpdatedAt || null
    },
    meta: {
      schemaVersion: Number(appState.schemaVersion || 1),
      activeTournamentId: cleanTournamentId,
      activeCharreadaId: charreadaIds.has(appState.activeCharreadaId) ? appState.activeCharreadaId : null,
      scoringSuerteIdx: Number(appState.scoringSuerteIdx || 0),
      scoringTeamIdx: Number(appState.scoringTeamIdx || 0),
      scoringAttemptIdx: Number(appState.scoringAttemptIdx || 0),
      scoringColeadorIdx: Number(appState.scoringColeadorIdx || 0),
      ruleEditorSuerteId: appState.ruleEditorSuerteId || "cala",
      liveTimer: compactTimer(appState.liveTimer),
      lastPublishedScore: publishedScoreBelongsToTournament(appState.lastPublishedScore, cleanTournamentId, charreadaIds, teamIds)
        ? compactPublishedScore(appState.lastPublishedScore)
        : null
    }
  });
}

function compactTournamentIndex(record = {}) {
  const info = record.info || {};
  const rows = record.publishedScores || [];
  const leader = rows[rows.length - 1]?.team || null;
  return cleanUndefined({
    ...info,
    teamCount: (record.teams || []).length,
    charreadaCount: (record.charreadas || []).length,
    scoreCount: Object.keys(record.scores || {}).length,
    leaderName: leader?.name || "",
    updatedAt: record.meta?.updatedAt || new Date().toISOString(),
    updatedAtMs: Number(record.meta?.updatedAtMs || Date.now())
  });
}

function inflateTournamentStatePayload(tournamentId, record = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  const meta = record.meta || {};
  const state = {
    schemaVersion: Number(meta.schemaVersion || 1),
    activeTournamentId: cleanTournamentId,
    activeCharreadaId: meta.activeCharreadaId || null,
    scoringSuerteIdx: Number(meta.scoringSuerteIdx || 0),
    scoringTeamIdx: Number(meta.scoringTeamIdx || 0),
    scoringAttemptIdx: Number(meta.scoringAttemptIdx || 0),
    scoringColeadorIdx: Number(meta.scoringColeadorIdx || 0),
    ruleEditorSuerteId: meta.ruleEditorSuerteId || "cala",
    tournament: compactStoredTournament(record.info || { id: cleanTournamentId }),
    teams: arrayFromRecord(record.teams).map(compactStoredTeam),
    charreadas: arrayFromRecord(record.charreadas).map(compactStoredCharreada),
    scores: record.scores || {},
    publishedScores: arrayFromRecord(record.publishedScores).map(compactPublishedScore),
    history: arrayFromRecord(record.history).map(compactStatHistorySnapshot),
    statHistorySnapshots: arrayFromRecord(record.history).map(compactStatHistorySnapshot),
    settings: record.settings || {},
    liveTimer: meta.liveTimer || null,
    lastPublishedScore: meta.lastPublishedScore || null
  };

  return cleanUndefined({
    version: Number(meta.version || 0),
    updatedAt: meta.updatedAt || "",
    updatedAtMs: Number(meta.updatedAtMs || 0),
    updatedBy: meta.updatedBy || {},
    clientId: meta.clientId || "",
    state
  });
}

function arrayFromRecord(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.values(value).filter(Boolean);
}

function scoreKeyBelongsToTournament(key, charreadaIds, teamIds) {
  const [charreadaId, teamId] = String(key || "").split("__");
  return charreadaIds.has(charreadaId) && teamIds.has(teamId);
}

function publishedScoreBelongsToTournament(score, tournamentId, charreadaIds, teamIds) {
  if (!score) return false;
  const scoreTournamentId = score.tournament?.id || score.tournamentId || "";
  if (scoreTournamentId === tournamentId) return true;
  const charreadaId = score.charreada?.id || score.charreadaId || "";
  const teamId = score.team?.id || score.teamId || "";
  return charreadaIds.has(charreadaId) && (!teamId || teamIds.has(teamId));
}

function compactStoredTournament(tournament = {}) {
  return {
    ...tournament,
    id: tournament.id || "",
    name: tournament.name || "",
    season: getTournamentSeason(tournament),
    type: tournament.type || "completo",
    status: tournament.status || "preparacion"
  };
}

function compactStoredTeam(team = {}) {
  return {
    ...team,
    id: team.id || "",
    name: team.name || "",
    category: team.category || "Libre",
    roster: team.roster || {}
  };
}

function compactStoredCharreada(charreada = {}) {
  return {
    ...charreada,
    id: charreada.id || "",
    tournamentId: charreada.tournamentId || "",
    name: charreada.name || "",
    status: charreada.status || "programada",
    teamIds: charreada.teamIds || []
  };
}

function flattenAuditScores(value, scopedToTournament) {
  if (!value || typeof value !== "object") return [];

  const records = scopedToTournament
    ? Object.values(value)
    : Object.values(value).flatMap((group) => Object.values(group || {}));

  return records
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""));
}

function compactTournament(tournament) {
  if (!tournament) return null;
  return {
    id: tournament.id || "",
    name: tournament.name || "",
    season: getTournamentSeason(tournament),
    date: tournament.date || "",
    venue: tournament.venue || "",
    type: tournament.type || "completo",
    status: tournament.status || ""
  };
}

function compactCharreada(charreada) {
  if (!charreada) return null;
  return {
    id: charreada.id || "",
    tournamentId: charreada.tournamentId || "",
    name: charreada.name || "",
    date: charreada.date || "",
    startTime: charreada.startTime || "",
    status: charreada.status || "",
    teamIds: charreada.teamIds || []
  };
}

function compactTurn(turn) {
  if (!turn) return null;
  const suerte = turn.suerte || {};
  return {
    team: compactTeam(turn.team),
    suerte: {
      id: suerte.id || "",
      name: suerte.name || "",
      fullName: suerte.fullName || suerte.name || "",
      type: suerte.type || "",
      attempts: suerte.attempts || 1
    },
    attemptIndex: Number(turn.attemptIndex || 0),
    coleadorIndex: Number(turn.coleadorIndex || 0),
    attempt: compactAttempt(turn.attempt),
    charro: turn.charro || ""
  };
}

function compactTeam(team) {
  if (!team) return null;
  return {
    id: team.id || "",
    name: team.name || "",
    participantName: team.participantName || "",
    horseName: team.horseName || "",
    category: team.category || "Libre",
    captain: team.captain || "",
    association: team.association || ""
  };
}

function compactAttempt(attempt) {
  if (!attempt) return null;
  return {
    base: Number(attempt.base || 0),
    adic: Number(attempt.adic || 0),
    infr: Number(attempt.infr || 0),
    puntaPts: Number(attempt.puntaPts || 0),
    puntaMetros: Number(attempt.puntaMetros || 0),
    puntaPiquetes: Number(attempt.puntaPiquetes || 0),
    tiempo: attempt.tiempo || "",
    desc: attempt.desc || null,
    note: attempt.note || "",
    attempted: Boolean(attempt.attempted),
    notAchieved: Boolean(attempt.notAchieved),
    teamPenalties: compactPublishedItems(attempt.teamPenalties)
  };
}

function compactTimer(timer) {
  timer = timer || {};
  return {
    revision: Number(timer.revision || 0),
    tournamentId: timer.tournamentId || "",
    charreadaId: timer.charreadaId || "",
    teamId: timer.teamId || "",
    suerteId: timer.suerteId || "",
    attemptId: timer.attemptId || "",
    running: Boolean(timer.running),
    startedAt: timer.startedAt || null,
    elapsedMs: Number(timer.elapsedMs || 0),
    elapsedLiveMs: Number(timer.elapsedLiveMs || 0),
    displayMs: Number(timer.displayMs || 0),
    remainingMs: timer.remainingMs === null || timer.remainingMs === undefined ? null : Number(timer.remainingMs || 0),
    formatted: timer.formatted || "00:00.0",
    mode: timer.mode || "elapsed",
    limitMs: Number(timer.limitMs || 0),
    limitLabel: timer.limitLabel || "",
    stateLabel: timer.stateLabel || "",
    expired: Boolean(timer.expired),
    scopeKey: timer.scopeKey || "",
    updatedAtMs: Number(timer.updatedAtMs || 0),
    clientId: timer.clientId || "",
    updatedAt: timer.updatedAt || null
  };
}

function compactLeaderboardItem(item) {
  item = item || {};
  return {
    team: compactTeam(item.team),
    total: Number(item.total || 0),
    infr: Number(item.infr || 0)
  };
}

function compactColeadero(coleadero) {
  if (!coleadero) return null;
  return {
    charreada: {
      id: coleadero.charreada?.id || "",
      name: coleadero.charreada?.name || ""
    },
    team: compactTeam(coleadero.team),
    suerte: {
      id: "colas",
      name: "Colas",
      fullName: "Coleadero"
    },
    activeColeadorIndex: Number(coleadero.activeColeadorIndex ?? -1),
    activeAttemptIndex: Number(coleadero.activeAttemptIndex ?? -1),
    rows: (coleadero.rows || []).map((row, rowIndex) => ({
      index: Number(row.index ?? rowIndex),
      name: row.name || `Coleador ${rowIndex + 1}`,
      total: Number(row.total || 0),
      active: Boolean(row.active),
      attempts: (row.attempts || []).map((attempt, attemptIndex) => ({
        index: Number(attempt.index ?? attemptIndex),
        total: Number(attempt.total || 0),
        base: Number(attempt.base || 0),
        adic: Number(attempt.adic || 0),
        infr: Number(attempt.infr || 0),
        desc: attempt.desc || null,
        hasActivity: Boolean(attempt.hasActivity || attempt.desc),
        active: Boolean(attempt.active)
      }))
    }))
  };
}

function compactPublishedScore(score) {
  if (!score) return null;
  const suerte = score.suerte || {};
	  return cleanUndefined({
	    id: score.id || "",
	    attemptKey: score.attemptKey || "",
	    publishedAt: score.publishedAt || "",
	    publishedBy: compactPublishedBy(score.publishedBy),
	    revision: Number(score.revision || 1),
	    correction: Boolean(score.correction),
	    correctedRecordId: score.correctedRecordId || "",
	    previousTotal: score.previousTotal === null || score.previousTotal === undefined ? null : Number(score.previousTotal || 0),
	    superseded: Boolean(score.superseded),
	    supersededBy: score.supersededBy || "",
	    supersededAt: score.supersededAt || "",
	    tournament: compactTournament(score.tournament),
    charreada: compactCharreada(score.charreada),
    team: compactTeam(score.team),
    suerte: {
      id: suerte.id || "",
      name: suerte.name || "",
      fullName: suerte.fullName || suerte.name || "",
      type: suerte.type || "",
      attempts: Number(suerte.attempts || 1)
    },
    attemptIndex: Number(score.attemptIndex || 0),
    coleadorIndex: Number(score.coleadorIndex || 0),
    charro: score.charro || "",
    attempt: compactAttempt(score.attempt),
    total: Number(score.total || 0),
    breakdown: compactPublishedBreakdown(score.breakdown)
	  });
}

function compactPublishedBy(publishedBy = {}) {
  return {
    id: publishedBy.id || "",
    name: publishedBy.name || "",
    role: publishedBy.role || "",
    contact: publishedBy.contact || ""
  };
}

function compactStatHistorySnapshot(snapshot = {}) {
  return cleanUndefined({
    id: snapshot.id || "",
    schemaVersion: Number(snapshot.schemaVersion || 1),
    generatedAt: snapshot.generatedAt || new Date().toISOString(),
    tournament: snapshot.tournament || null,
    summary: snapshot.summary || {},
    columns: snapshot.columns || [],
    standings: snapshot.standings || [],
    charreadas: snapshot.charreadas || [],
    awards: snapshot.awards || [],
    performances: snapshot.performances || []
  });
}

function getTournamentSeason(tournament = {}) {
  const value = String(tournament.season || tournament.date || "").trim();
  const match = value.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? match[1] : new Date().getFullYear().toString();
}

function compactPublishedBreakdown(breakdown) {
  if (!breakdown) return null;
  return {
    rulebook: breakdown.rulebook || null,
    base: Number(breakdown.base || 0),
    adic: Number(breakdown.adic || 0),
    infr: Number(breakdown.infr || 0),
    puntaPts: Number(breakdown.puntaPts || 0),
    puntaMetros: Number(breakdown.puntaMetros || 0),
    puntaPiquetes: Number(breakdown.puntaPiquetes || 0),
    punta: breakdown.punta
      ? {
          metros: Number(breakdown.punta.metros || 0),
          tiempos: Number(breakdown.punta.tiempos || 0),
          puntosDistancia: Number(breakdown.punta.puntosDistancia || 0),
          puntosTiempos: Number(breakdown.punta.puntosTiempos || 0),
          total: Number(breakdown.punta.total || 0)
        }
      : null,
    individualTotal: Number(breakdown.individualTotal || 0),
    teamPenaltyTotal: Number(breakdown.teamPenaltyTotal || 0),
    total: Number(breakdown.total || 0),
    teamAdjustedTotal: breakdown.teamAdjustedTotal === null || breakdown.teamAdjustedTotal === undefined
      ? Number(breakdown.total || 0)
      : Number(breakdown.teamAdjustedTotal || 0),
    attempted: Boolean(breakdown.attempted),
    notAchieved: Boolean(breakdown.notAchieved),
    desc: breakdown.desc || null,
    adicGroups: (breakdown.adicGroups || []).map((group) => ({
      code: group.code || "",
      label: group.label || "",
      total: Number(group.total || 0),
      items: compactPublishedItems(group.items)
    })),
    extraAdicItems: compactPublishedItems(breakdown.extraAdicItems),
    infrItems: compactPublishedItems(breakdown.infrItems),
    teamPenalties: compactPublishedItems(breakdown.teamPenalties),
    customAdic: compactPublishedItems(breakdown.customAdic),
    customInfr: compactPublishedItems(breakdown.customInfr)
  };
}

function compactPublishedItems(items = []) {
  return (items || []).map((item) => ({
    id: item.id || "",
    label: item.label || "",
    abbr: item.abbr || "",
    pts: Number(item.pts || 0),
    quantity: Number(item.quantity || 1),
    total: item.total === undefined || item.total === null ? Number(item.pts || 0) : Number(item.total || 0),
    legacyRule: Boolean(item.legacyRule)
  }));
}

function compactTeamStandings(table) {
  table = table || {};
  return {
    title: table.title || "Tabla general por equipos",
    charreadas: (table.charreadas || []).map((charreada, index) => ({
      id: charreada.id || "",
      name: charreada.name || `Charreada ${index + 1}`,
      date: charreada.date || "",
      startTime: charreada.startTime || "",
      status: charreada.status || "",
      charreadaIds: charreada.charreadaIds || []
    })),
    rows: (table.rows || []).map((row) => ({
      team: compactTeam(row.team),
      results: (row.results || []).map((result) => ({
        charreada: {
          id: result.charreada?.id || "",
          name: result.charreada?.name || ""
        },
        participated: Boolean(result.participated),
        total: result.total === null || result.total === undefined ? null : Number(result.total || 0),
        infr: Number(result.infr || 0)
      })),
      total: Number(row.total || 0),
      average: Number(row.average || 0),
      charreadasCount: Number(row.charreadasCount || 0),
      infr: Number(row.infr || 0),
      negativePoints: Number(row.negativePoints ?? row.infr ?? 0),
      bestResult: Number(row.bestResult || 0),
      tieBreakCriteria: row.tieBreakCriteria || null
    }))
  };
}

function cleanUndefined(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
