import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { get, getDatabase, onValue, push, ref, set, update } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";
import { makeAccessSession, normalizeRole, normalizeTournamentAccess } from "./roles.js?v=20260708-recovery-001b-panel-status1";
import { normalizeScoringButtonLayouts } from "../data/defaultScoringButtonLayouts.js?v=20260708-recovery-001b-panel-status1";

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
const PUBLIC_TOURNAMENTS_PATH = "charropro/publicTournaments";
const TOURNAMENT_INDEX_PATH = "charropro/tournamentIndex";
const TOURNAMENTS_PATH = "charropro/tournaments";
const USERS_PATH = "charropro/users";
const GLOBAL_RULE_OVERRIDES_PATH = "charropro/settings/globalRuleOverrides";
const GLOBAL_SCORING_BUTTON_LAYOUTS_PATH = "charropro/settings/scoringButtonLayouts";
const JUDGE_SESSIONS_PATH = "charropro/judges/sessions";
const JUDGE_EVENTS_PATH = "charropro/judges/events";
const AUDIT_PUBLISHED_SCORES_PATH = "charropro/audit/publishedScores";
const HISTORY_STATISTICS_PATH = "charropro/history/statistics";
const PUBLIC_SNAPSHOT_VERSION = 1;
const PUBLIC_SUERTES = [
  { key: "CC", aliases: ["cc", "cala", "calaCaballo", "cala_de_caballo"], label: "Cala" },
  { key: "P", aliases: ["p", "pial", "piales", "pialesLienza", "pialesLienzo"], label: "Piales" },
  { key: "C", aliases: ["c", "colas", "coleadero"], label: "Colas" },
  { key: "JT", aliases: ["jt", "toro", "jineteoToro"], label: "Jineteo de Toro" },
  { key: "LC", aliases: ["lc", "lazo", "lazoCabecero"], label: "Lazo Cabecero" },
  { key: "PR", aliases: ["pr", "pialRuedo", "pial_de_ruedo"], label: "Pial de Ruedo" },
  { key: "JY", aliases: ["jy", "yegua", "jineteoYegua"], label: "Jineteo de Yegua" },
  { key: "MP", aliases: ["mp", "manganasPie", "manganasAPie"], label: "Manganas a Pie" },
  { key: "MC", aliases: ["mc", "manganasCaballo", "manganasACaballo"], label: "Manganas a Caballo" },
  { key: "PM", aliases: ["pm", "paso", "pasoMuerte", "pasoDeLaMuerte"], label: "Paso de la Muerte" }
];
const PUBLIC_SCORESHEET_COLUMNS = ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "TOTAL"];

let appInstance = null;
let databaseInstance = null;
let authInstance = null;
let functionsInstance = null;
let publicSnapshotBuildCount = 0;
let publicSnapshotPublishCount = 0;
let publicSnapshotSetCount = 0;

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

export async function publishFirebasePublishedScore(tournamentId, publishedScore, actor = {}, options = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId || publishedScore?.tournament?.id);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const now = Date.now();
    const record = compactPublishedScore({
      ...publishedScore,
      id: publishedScore?.id || createId("publicado")
    });
    const publishedScoreId = String(record?.id || "").trim();
    if (!publishedScoreId) return { ok: false, reason: "missing-published-score" };

    const tournamentPath = `${TOURNAMENTS_PATH}/${cleanTournamentId}/publishedScores/${publishedScoreId}`;
    const auditPath = `${AUDIT_PUBLISHED_SCORES_PATH}/${cleanTournamentId}/${publishedScoreId}`;
    const actorRecord = compactActor(actor);
    const updates = {
      [tournamentPath]: record,
      [auditPath]: record,
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedAt`]: new Date(now).toISOString(),
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedAtMs`]: now,
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedBy`]: actorRecord,
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedByName`]: actor.name || actor.email || ""
    };

    if (options.livePayload) {
      const current = compactLivePayload({
        ...options.livePayload,
        liveChannel: cleanTournamentId,
        published: record,
        timestamp: new Date(now).toISOString()
      });
      updates[`${LIVE_ROOT_PATH}/${cleanTournamentId}/current`] = current;
    }

    console.info("[publishedScore] preparando publicación oficial", {
      tournamentId: cleanTournamentId,
      publishedScoreId
    });
    console.info(`[publishedScore] escribiendo ruta: ${tournamentPath}`);
    console.info(`[publishedScore] auditando ruta: ${auditPath}`);

    await update(ref(getFirebaseDatabase()), cleanUndefined(updates));
    const publicSnapshot = await publishPublicTournamentSnapshot(cleanTournamentId, null, { source: "publishedScore" });
    console.info("[publishedScore] publicado en CharroPro", {
      tournamentId: cleanTournamentId,
      publishedScoreId,
      path: tournamentPath,
      auditPath,
      publicSnapshot
    });
    return { ok: true, id: publishedScoreId, path: tournamentPath, auditPath, publicSnapshot };
  } catch (error) {
    console.error("[publishedScore] error al publicar", {
      tournamentId: cleanTournamentId,
      publishedScore,
      actor,
      options,
      error
    });
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
  }
}

export async function publishFirebaseOfficialScoreAtomic(tournamentId, scoreId, scorePayload, publishedScore, actor = {}, options = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId || publishedScore?.tournament?.id);
  const cleanScoreId = String(scoreId || "").trim();
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!cleanScoreId) return { ok: false, reason: "missing-score" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const now = Date.now();
    const record = compactPublishedScore({
      ...publishedScore,
      id: publishedScore?.id || createId("publicado")
    });
    const publishedScoreId = String(record?.id || "").trim();
    if (!publishedScoreId) return { ok: false, reason: "missing-published-score" };

    const scorePath = `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores/${cleanScoreId}`;
    const publishedPath = `${TOURNAMENTS_PATH}/${cleanTournamentId}/publishedScores/${publishedScoreId}`;
    const auditPath = `${AUDIT_PUBLISHED_SCORES_PATH}/${cleanTournamentId}/${publishedScoreId}`;
    const livePath = `${LIVE_ROOT_PATH}/${cleanTournamentId}/current`;
    const actorRecord = compactActor(actor);
    const updates = {
      [scorePath]: scorePayload,
      [publishedPath]: record,
      [auditPath]: record,
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedAt`]: new Date(now).toISOString(),
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedAtMs`]: now,
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedBy`]: actorRecord,
      [`${TOURNAMENTS_PATH}/${cleanTournamentId}/meta/updatedByName`]: actor.name || actor.email || ""
    };

    if (options.livePayload) {
      updates[livePath] = compactLivePayload({
        ...options.livePayload,
        liveChannel: cleanTournamentId,
        published: record,
        timestamp: new Date(now).toISOString()
      });
    }

    console.info("[publish-atomic-c003] preparando publicacion oficial", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      publishedScoreId
    });
    console.info("[publish-atomic-c003] score path:", scorePath);
    console.info("[publish-atomic-c003] published path:", publishedPath);
    console.info("[publish-atomic-c003] audit path:", auditPath);
    if (options.livePayload) console.info("[publish-atomic-c003] live path:", livePath);

    await update(ref(getFirebaseDatabase()), cleanUndefined(updates));
    const publicSnapshot = await publishPublicTournamentSnapshot(cleanTournamentId, null, { source: "officialScoreAtomic" });
    console.info("[publish-atomic-c003] multipath update exitoso", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      publishedScoreId,
      publicSnapshot
    });
    return {
      ok: true,
      id: publishedScoreId,
      scorePath,
      path: publishedPath,
      publishedPath,
      auditPath,
      livePath: options.livePayload ? livePath : "",
      publicSnapshot
    };
  } catch (error) {
    console.error("[publish-atomic-c003] error firebase update", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      publishedScore,
      actor,
      error
    });
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
  }
}

export async function readFirebaseActiveCharreadaSnapshot(tournamentId) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}`;
    const snapshot = await get(ref(getFirebaseDatabase(), path));
    if (!snapshot.exists()) return { ok: false, reason: "missing-tournament-data", tournamentId: cleanTournamentId, path };

    const record = snapshot.val() || {};
    const charreadas = arrayFromRecord(record.charreadas);
    const explicitActiveId = String(
      record.meta?.activeCharreadaId ||
        record.info?.activeCharreadaId ||
        record.tournamentState?.activeCharreadaId ||
        record.activeCharreadaId ||
        ""
    ).trim();
    const liveCharreadas = charreadas.filter((charreada) => String(charreada?.status || "") === "en_vivo");

    if (explicitActiveId) {
      return {
        ok: true,
        tournamentId: cleanTournamentId,
        path,
        activeCharreadaId: explicitActiveId,
        source: "remote-activeCharreadaId",
        liveCharreadaCount: liveCharreadas.length
      };
    }

    if (liveCharreadas.length === 1) {
      return {
        ok: true,
        tournamentId: cleanTournamentId,
        path,
        activeCharreadaId: liveCharreadas[0].id || "",
        source: "remote-status-en_vivo",
        liveCharreadaCount: 1
      };
    }

    if (liveCharreadas.length > 1) {
      return {
        ok: false,
        reason: "multiple-active-charreadas",
        tournamentId: cleanTournamentId,
        path,
        activeCharreadaId: "",
        liveCharreadaCount: liveCharreadas.length,
        charreadaIds: liveCharreadas.map((charreada) => charreada.id).filter(Boolean)
      };
    }

    return {
      ok: false,
      reason: "missing-active-charreada",
      tournamentId: cleanTournamentId,
      path,
      activeCharreadaId: "",
      liveCharreadaCount: 0
    };
  } catch (error) {
    console.error("[publish-guard-c003] error leyendo charreada activa remota", {
      tournamentId: cleanTournamentId,
      error
    });
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) };
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

export function subscribeFirebaseLiveCurrent(tournamentId, callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  const liveChannel = normalizeLiveChannel(tournamentId || getLiveChannelFromUrl());
  const path = liveChannel ? `${LIVE_ROOT_PATH}/${liveChannel}/current` : "";
  if (!path) return () => {};

  console.info(`[live/current] ruta escuchada: ${path}`);

  try {
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const payload = snapshot.val();
      if (!payload) {
        callback(null);
        return;
      }

      const current = cleanUndefined({
        ...payload,
        liveChannel: payload.liveChannel || liveChannel
      });
      const publishedScoreId = current.publishedScoreId || current.published?.id || "";

      console.info("[live/current] recibido desde CharroPro", current);
      console.info("[live/current] último publishedScoreId:", publishedScoreId);
      callback(current);
    }, (error) => {
      console.error("[live/current] error de listener:", {
        path,
        error
      });
      callback(null, { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }) });
    });
  } catch (error) {
    console.error("[live/current] error de listener:", {
      path,
      error
    });
    return () => {};
  }
}

export function subscribePublicTournamentSnapshot(tournamentId, callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  const cleanTournamentId = normalizeLiveChannel(tournamentId || getLiveChannelFromUrl());
  const path = cleanTournamentId ? `${PUBLIC_TOURNAMENTS_PATH}/${cleanTournamentId}` : "";
  if (!path) return () => {};

  console.info("[publicTournament] ruta escuchada:", path);

  try {
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const payload = snapshot.val();
      callback(payload || null, {
        ok: Boolean(payload),
        exists: Boolean(payload),
        path,
        tournamentId: cleanTournamentId
      });
    }, (error) => {
      console.warn("[publicTournament] lectura no disponible:", {
        path,
        error
      });
      callback(null, {
        ok: false,
        exists: false,
        path,
        tournamentId: cleanTournamentId,
        reason: normalizeFirebaseFailureReason(error),
        detail: normalizeErrorDetail({ error })
      });
    });
  } catch (error) {
    console.warn("[publicTournament] listener no iniciado:", {
      path,
      error
    });
    callback(null, {
      ok: false,
      exists: false,
      path,
      tournamentId: cleanTournamentId,
      reason: normalizeFirebaseFailureReason(error),
      detail: normalizeErrorDetail({ error })
    });
    return () => {};
  }
}

export function buildPublicTournamentSnapshot(tournamentState = {}) {
  publicSnapshotBuildCount += 1;
  console.log("[public-core] build start");
  console.log("[public-core] build count", publicSnapshotBuildCount);
  console.info("[public-core] snapshot build");
  const source = normalizePublicTournamentState(tournamentState);
  const info = buildPublicInfo(source);
  let teams = normalizePublicTeams(source);
  const charreadas = normalizePublicCharreadas(source, teams);
  const activeCharreadaId = resolvePublicActiveCharreadaId(source);
  const activeCharreadaSource = activeCharreadaId
    ? charreadas.find((charreada) => charreada.charreadaId === activeCharreadaId) || null
    : null;
  const normalizedScores = normalizePublicScores(source, teams, charreadas);
  teams = mergePublicTeamsWithScores(teams, normalizedScores);
  const publicTeams = buildPublicTeamsList({ teams, normalizedScores });
  const activeCharreada = buildActiveCharreadaPublic({
    charreada: activeCharreadaSource,
    source,
    normalizedScores
  });
  const currentScoreboard = buildCurrentScoreboardPublic({
    teams,
    charreadas,
    activeCharreadaId,
    normalizedScores
  });
  const generalRanking = buildGeneralRankingPublic({
    teams,
    charreadas,
    normalizedScores
  });
  const scoresheet = buildScoreSheetPublic({
    teams,
    normalizedScores,
    generalRanking
  });
  const leaders = buildLeadersPublic({ normalizedScores });
  const schedule = buildSchedulePublic({ charreadas });
  const lastScores = buildLastScoresPublic({ normalizedScores });
  const stats = {
    teams: teams.length,
    charreadas: charreadas.length,
    scores: countStoredRecords(source.scores),
    publishedScores: countStoredRecords(source.publishedScores),
    normalizedScores: normalizedScores.length,
    updatedAt: publicReadString(source.meta.updatedAt)
  };

  logPublicCore003Diagnostics({
    activeCharreadaId,
    activeCharreada: activeCharreadaSource,
    teams,
    normalizedScores,
    currentScoreboard,
    generalRanking,
    scoresheet,
    publicTeams,
    leaders
  });

  const snapshot = cleanUndefined({
    info,
    activeCharreada,
    currentScoreboard,
    generalRanking,
    scoresheet,
    scoresheetColumns: PUBLIC_SCORESHEET_COLUMNS,
    leaders,
    schedule,
    lastScores,
    teams: publicTeams,
    stats,
    generatedAt: new Date().toISOString(),
    generatedAtMs: Date.now(),
    version: PUBLIC_SNAPSHOT_VERSION
  });

  console.log("[public-core] snapshot keys", Object.keys(snapshot));
  console.log("[public-core] build finished");
  return snapshot;
}

export async function publishPublicTournamentSnapshot(tournamentId, tournamentState = null, options = {}) {
  publicSnapshotPublishCount += 1;
  console.log("[public-core] publish start", tournamentId);
  console.log("[public-core] publish count", publicSnapshotPublishCount);
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) {
    console.log("[public-core] skipped:", { reason: "missing tournamentId" });
    console.log("[public-core] publish finished", tournamentId);
    return { ok: false, reason: "missing-tournament" };
  }
  if (!isFirebaseLiveConfigured()) {
    console.log("[public-core] skipped:", { reason: "missing firebase" });
    console.log("[public-core] publish finished", cleanTournamentId);
    return { ok: false, reason: "missing-firebase" };
  }

  const path = `${PUBLIC_TOURNAMENTS_PATH}/${cleanTournamentId}`;
  try {
    let source = tournamentState;
    if (!source) {
      const privateSnapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${cleanTournamentId}`));
      source = privateSnapshot.val() || null;
    }
    if (!source) {
      console.log("[public-core] skipped:", { reason: "tournament undefined", path });
      console.log("[public-core] publish finished", cleanTournamentId);
      return { ok: false, reason: "missing-tournament-data", path };
    }

    const snapshot = buildPublicTournamentSnapshot(source);
    const existingSnapshot = await get(ref(getFirebaseDatabase(), path));
    const existing = existingSnapshot.val() || null;
    const nextSignature = buildPublicSnapshotSignature(snapshot);
    const previousSignature = buildPublicSnapshotSignature(existing);
    if (existing && previousSignature === nextSignature) {
      console.log("[public-core] skipped:", {
        reason: "snapshot unchanged",
        path
      });
      console.info("[public-core] snapshot published", {
        path,
        skipped: true,
        source: options.source || ""
      });
      console.log("[public-core] publish finished", cleanTournamentId);
      return { ok: true, skipped: true, path, source: options.source || "" };
    }

    console.log("[public-core] set start", path);
    await set(ref(getFirebaseDatabase(), path), cleanUndefined(snapshot));
    publicSnapshotSetCount += 1;
    console.log("[public-core] set finished", {
      path,
      setCount: publicSnapshotSetCount
    });
    console.info("[public-core] snapshot published", {
      path,
      skipped: false,
      source: options.source || ""
    });
    console.log("[public-core] publish finished", cleanTournamentId);
    return { ok: true, skipped: false, path, source: options.source || "" };
  } catch (error) {
    console.error("[public-core] snapshot publish failed", {
      path,
      source: options.source || "",
      error
    });
    console.log("[public-core] skipped:", {
      reason: normalizeFirebaseFailureReason(error),
      path
    });
    console.log("[public-core] publish finished", cleanTournamentId);
    return { ok: false, reason: normalizeFirebaseFailureReason(error), detail: normalizeErrorDetail({ error }), path };
  }
}

function normalizePublicTournamentState(tournamentState = {}) {
  const statePayload = tournamentState.state || {};
  const info = statePayload.tournament || tournamentState.info || tournamentState.tournament || {};
  const meta = {
    ...(tournamentState.meta || {}),
    activeCharreadaId: publicReadString(
      tournamentState.meta?.activeCharreadaId,
      statePayload.activeCharreadaId,
      tournamentState.tournamentState?.activeCharreadaId,
      info.activeCharreadaId
    ),
    updatedAt: publicReadString(tournamentState.meta?.updatedAt, tournamentState.updatedAt, statePayload.updatedAt)
  };

  return {
    info,
    tournamentState: tournamentState.tournamentState || {},
    meta,
    teams: statePayload.teams || tournamentState.teams || tournamentState.equipos || [],
    charreadas: statePayload.charreadas || tournamentState.charreadas || tournamentState.program || tournamentState.schedule || [],
    scores: statePayload.scores || tournamentState.scores || {},
    publishedScores: statePayload.publishedScores || tournamentState.publishedScores || [],
    settings: statePayload.settings || tournamentState.settings || {}
  };
}

function buildPublicInfo(source = {}) {
  const info = source.info || {};
  return {
    id: publicReadString(info.id, info.tournamentId),
    nombre: publicReadString(info.nombre, info.name, "Torneo"),
    temporada: publicReadString(info.temporada, info.season, getTournamentSeason(info)),
    estado: publicReadString(info.estado, info.status),
    logo: publicReadString(info.logo, info.logoUrl),
    sede: publicReadString(info.sede, info.venue, info.location),
    fechaInicio: publicReadString(info.fechaInicio, info.startDate, info.date),
    fechaFin: publicReadString(info.fechaFin, info.endDate),
    categoria: publicReadString(info.categoria, info.category, info.categoryName)
  };
}

function normalizePublicTeams(tournamentState = {}) {
  return publicEntries(tournamentState.teams).map(([mapKey, team], index) => {
    const row = team && typeof team === "object" ? team : { name: team };
    const teamId = publicReadString(row.id, row.teamId, row.equipoId, row._id, row.key, mapKey, `team_${index + 1}`);
    return {
      teamId,
      teamName: publicReadString(row.name, row.nombre, row.teamName, row.equipo, teamId, `Equipo ${index + 1}`),
      name: publicReadString(row.name, row.nombre, row.teamName, row.equipo, teamId, `Equipo ${index + 1}`),
      abbreviation: publicReadString(row.abbreviation, row.abreviatura, row.abbr, row.shortName, row.teamShortName),
      logo: publicReadString(row.logo, row.logoUrl),
      category: publicReadString(row.category, row.categoria)
    };
  });
}

function mergePublicTeamsWithScores(teams = [], scores = []) {
  const byId = new Map(teams.map((team) => [team.teamId, team]));
  scores.forEach((score) => {
    if (!score.teamId || byId.has(score.teamId)) return;
    byId.set(score.teamId, {
      teamId: score.teamId,
      teamName: score.teamName || score.teamId,
      name: score.teamName || score.teamId,
      abbreviation: "",
      logo: "",
      category: ""
    });
  });
  return [...byId.values()];
}

function normalizePublicCharreadas(tournamentState = {}, teams = []) {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  return publicEntries(tournamentState.charreadas).map(([mapKey, charreada], index) => {
    const row = charreada && typeof charreada === "object" ? charreada : { name: charreada };
    const teamIds = extractPublicTeamIds(row.teamIds || row.equipoIds || row.teams || row.equipos || row.scoreboardTeams);
    const equipos = teamIds.map((teamId) => {
      const team = teamsById.get(teamId);
      return {
        teamId,
        teamName: team?.teamName || team?.name || teamId,
        name: team?.teamName || team?.name || teamId
      };
    });
    return {
      charreadaId: publicReadString(row.id, row.charreadaId, row._id, row.key, mapKey, `charreada_${index + 1}`),
      nombre: publicReadString(row.name, row.nombre, row.displayName, row.title, row.label, `Charreada ${index + 1}`),
      fecha: publicReadString(row.fecha, row.date, row.scheduledAt, row.startAt),
      hora: publicReadString(row.hora, row.startTime, row.time),
      phase: publicReadString(row.phase, row.fase, row.phaseName, row.phase?.name, row.phase?.nombre),
      status: publicReadString(row.status, row.estado),
      teamIds,
      equipos,
      order: publicReadNumber(row.charreadaOrder, row.order, row.orden, index + 1)
    };
  });
}

function normalizePublicScores(tournamentState = {}, teams = []) {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const publishedScores = publicEntries(tournamentState.publishedScores)
    .filter(([, score]) => score && typeof score === "object" && !score.superseded)
    .map(([mapKey, score], index) => normalizePublicScoreRecord(score, {
      mapKey,
      index,
      teamsById,
      source: "publishedScores"
    }))
    .filter(isPublicScoreUsable);

  const rawScores = publishedScores.length ? [] : normalizePublicRawScores(tournamentState.scores, teamsById);
  const selected = publishedScores.length ? publishedScores : rawScores;
  return dedupePublicScores(selected)
    .sort((a, b) => publicDateValue(a.updatedAt) - publicDateValue(b.updatedAt) || a._order - b._order);
}

function normalizePublicRawScores(scores = {}, teamsById = new Map()) {
  return publicEntries(scores).flatMap(([scoreKey, payload], scoreIndex) => {
    const compound = parsePublicCompoundScoreId(scoreKey);
    if (!compound.charreadaId || !compound.teamId || !compound.suerteRaw) {
      return [normalizePublicScoreRecord(payload, {
        mapKey: scoreKey,
        index: scoreIndex,
        teamsById,
        source: "scores",
        compound
      })].filter(isPublicScoreUsable);
    }

    return flattenPublicAttempts(payload).map(({ attempt, attemptIndex, opportunity }) => normalizePublicScoreRecord({
      ...attempt,
      id: `${scoreKey}__${opportunity}__${attemptIndex}`,
      charreadaId: compound.charreadaId,
      teamId: compound.teamId,
      suerteId: compound.suerteRaw,
      attemptIndex,
      opportunity,
      coleadorIndex: opportunity
    }, {
      mapKey: scoreKey,
      index: scoreIndex + attemptIndex,
      teamsById,
      source: "scores",
      compound
    })).filter(isPublicScoreUsable);
  });
}

function normalizePublicScoreRecord(score = {}, context = {}) {
  if (!score || typeof score !== "object") return null;
  const compound = context.compound || parsePublicCompoundScoreId(context.mapKey || score.id || score.attemptKey || "");
  const teamObject = score.team && typeof score.team === "object" ? score.team : {};
  const charreadaObject = score.charreada && typeof score.charreada === "object" ? score.charreada : {};
  const suerteObject = score.suerte && typeof score.suerte === "object" ? score.suerte : {};
  const charroObject = score.charro && typeof score.charro === "object" ? score.charro : {};
  const teamId = publicReadString(
    teamObject.id,
    teamObject.teamId,
    score.teamId,
    score.equipoId,
    typeof score.team === "string" ? score.team : "",
    compound.teamId
  );
  const team = context.teamsById?.get(teamId);
  const suerteRaw = publicReadString(
    suerteObject.key,
    suerteObject.id,
    suerteObject.name,
    score.suerteKey,
    score.suerteId,
    typeof score.suerte === "string" ? score.suerte : "",
    compound.suerteRaw
  );
  const suerteAbbr = normalizeSuerteAbbr(suerteRaw);
  const attempt = publicReadNumber(score.attempt, score.attemptIndex, score.attempt?.index, compound.attempt, 0);
  const opportunity = publicReadNumber(score.opportunity, score.opportunityIndex, score.oportunidad, score.coleadorIndex, score.attempt?.opportunity, compound.opportunity, 0);
  const total = publicReadNumberOrNull(
    score.total,
    score.score,
    score.points,
    score.result,
    score.breakdown?.total,
    score.breakdown?.final,
    score.totalPoints
  );

  return {
    id: publicReadString(score.id, score.attemptKey, context.mapKey, `${compound.charreadaId || ""}__${teamId}__${suerteAbbr}__${attempt}__${opportunity}`),
    charreadaId: publicReadString(
      charreadaObject.id,
      score.charreadaId,
      typeof score.charreada === "string" ? score.charreada : "",
      score.tournament?.charreadaId,
      compound.charreadaId
    ),
    teamId,
    teamName: publicReadString(teamObject.name, teamObject.nombre, score.teamName, score.equipo, team?.teamName, team?.name, teamId),
    suerteKey: suerteAbbr,
    suerteAbbr,
    total,
    charroName: publicReadString(
      charroObject.name,
      typeof score.charro === "string" ? score.charro : "",
      score.charroName,
      score.participantName,
      score.athleteName,
      score.competidor,
      score.ejecutante,
      score.riderName,
      score.coleadorName,
      score.manganadorName,
      "Charro no registrado"
    ),
    attempt,
    opportunity,
    updatedAt: publicReadString(score.updatedAt, score.timestamp, score.createdAt, score.publishedAt),
    source: context.source || "",
    _order: Number(context.index || 0),
    _revision: publicReadNumber(score.revision, 1)
  };
}

function isPublicScoreUsable(score) {
  return Boolean(score && score.charreadaId && score.teamId && score.suerteAbbr && score.total !== null && score.total !== undefined);
}

function dedupePublicScores(scores = []) {
  const byKey = new Map();
  scores.forEach((score) => {
    const key = [
      score.charreadaId,
      score.teamId,
      score.suerteAbbr,
      score.attempt,
      score.opportunity
    ].join("__");
    const previous = byKey.get(key);
    if (!previous || comparePublicScoreFreshness(score, previous) >= 0) byKey.set(key, score);
  });
  return [...byKey.values()];
}

function resolvePublicActiveCharreadaId(source = {}) {
  return publicReadString(
    source.meta?.activeCharreadaId,
    source.info?.activeCharreadaId,
    source.tournamentState?.activeCharreadaId
  );
}

function buildPublicTeamsList({ teams = [], normalizedScores = [] } = {}) {
  return teams.map((team) => {
    const teamScores = normalizedScores.filter((score) => score.teamId === team.teamId);
    return cleanUndefined({
      teamId: team.teamId,
      name: team.teamName || team.name || team.teamId,
      abbreviation: team.abbreviation || "",
      logo: team.logo || "",
      category: team.category || "",
      total: sumPublicScores(teamScores)
    });
  });
}

function buildActiveCharreadaPublic({ charreada, source = {}, normalizedScores = [] } = {}) {
  if (!charreada) return null;
  const meta = source.meta || {};
  const currentTeam = charreada.equipos[publicReadNumber(meta.scoringTeamIdx, 0)] || null;
  const currentSuerte = PUBLIC_SUERTES[publicReadNumber(meta.scoringSuerteIdx, 0)] || null;
  return {
    id: charreada.charreadaId,
    nombre: charreada.nombre,
    fecha: charreada.fecha,
    hora: charreada.hora,
    phase: charreada.phase || "",
    equipos: charreada.equipos.map((team) => ({
      ...team,
      total: sumPublicScores(normalizedScores.filter((score) => score.charreadaId === charreada.charreadaId && score.teamId === team.teamId))
    })),
    status: charreada.status,
    currentSuerte: currentSuerte ? { key: currentSuerte.key, nombre: currentSuerte.label } : null,
    currentTeam,
    currentAttempt: publicReadNumber(meta.scoringAttemptIdx, 0) + 1,
    timer: meta.liveTimer || null
  };
}

function buildCurrentScoreboardPublic({ teams = [], charreadas = [], activeCharreadaId = "", normalizedScores = [] } = {}) {
  const activeCharreada = activeCharreadaId
    ? charreadas.find((charreada) => charreada.charreadaId === activeCharreadaId) || null
    : null;
  if (!activeCharreada) return [];
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const scoreTeamIds = [...new Set(normalizedScores
    .filter((score) => score.charreadaId === activeCharreada.charreadaId)
    .map((score) => score.teamId)
    .filter(Boolean))];
  const teamIds = activeCharreada.teamIds.length ? activeCharreada.teamIds : scoreTeamIds;
  return teamIds.map((teamId, order) => {
    const team = teamsById.get(teamId) || activeCharreada.equipos.find((item) => item.teamId === teamId) || { teamId, teamName: teamId, name: teamId };
    const teamScores = normalizedScores.filter((score) => score.charreadaId === activeCharreada.charreadaId && score.teamId === team.teamId);
    const lastScore = teamScores.slice().sort((a, b) => publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))[0] || null;
    return {
      teamId: team.teamId,
      teamName: team.teamName || team.name,
      total: sumPublicScores(teamScores),
      lastSuerte: lastScore?.suerteAbbr || "",
      updatedAt: lastScore?.updatedAt || "",
      _order: order
    };
  })
    .sort((a, b) => b.total - a.total || a._order - b._order)
    .map((row, index) => cleanUndefined({
      position: index + 1,
      teamId: row.teamId,
      teamName: row.teamName,
      total: row.total,
      lastSuerte: row.lastSuerte,
      updatedAt: row.updatedAt
    }));
}

function buildGeneralRankingPublic({ teams = [], normalizedScores = [] } = {}) {
  return teams.map((team, order) => {
    const teamScores = normalizedScores.filter((score) => score.teamId === team.teamId);
    const charreadasTerminadas = new Set(teamScores.map((score) => score.charreadaId).filter(Boolean)).size;
    const lastScore = teamScores.slice().sort((a, b) => publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))[0] || null;
    return {
      teamId: team.teamId,
      teamName: team.teamName || team.name,
      total: sumPublicScores(teamScores),
      charreadasTerminadas,
      updatedAt: lastScore?.updatedAt || "",
      _order: order
    };
  })
    .sort((a, b) => b.total - a.total || a._order - b._order)
    .map((row, index) => cleanUndefined({
      position: index + 1,
      teamId: row.teamId,
      teamName: row.teamName,
      total: row.total,
      charreadasTerminadas: row.charreadasTerminadas,
      updatedAt: row.updatedAt
    }));
}

function buildScoreSheetPublic({ teams = [], normalizedScores = [], generalRanking = [] } = {}) {
  const rankByTeam = new Map(generalRanking.map((row) => [row.teamId, row.position]));
  return teams.map((team) => {
    const row = {
      position: rankByTeam.get(team.teamId) || 0,
      teamId: team.teamId,
      teamName: team.teamName || team.name,
      CC: null,
      P: null,
      C: null,
      JT: null,
      LC: null,
      PR: null,
      JY: null,
      MP: null,
      MC: null,
      PM: null,
      TOTAL: null
    };
    const teamScores = normalizedScores.filter((score) => score.teamId === team.teamId);
    teamScores
      .filter((score) => score.teamId === team.teamId)
      .forEach((score) => {
        if (row[score.suerteAbbr] === null) row[score.suerteAbbr] = 0;
        row[score.suerteAbbr] += Number(score.total || 0);
      });
    row.TOTAL = PUBLIC_SUERTES.reduce((total, suerte) => total + (row[suerte.key] === null ? 0 : Number(row[suerte.key] || 0)), 0);
    if (!teamScores.length) row.TOTAL = null;
    return row;
  }).sort((a, b) => Number(a.position || 9999) - Number(b.position || 9999));
}

function buildLeadersPublic({ normalizedScores = [] } = {}) {
  return Object.fromEntries(PUBLIC_SUERTES.map((suerte) => {
    const leader = normalizedScores
      .filter((score) => score.suerteAbbr === suerte.key)
      .sort((a, b) => Number(b.total || 0) - Number(a.total || 0) || publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))[0];
    return [suerte.key, leader ? {
      suerte: suerte.key,
      label: suerte.label,
      charro: leader.charroName || "Charro no registrado",
      team: {
        teamId: leader.teamId,
        name: leader.teamName
      },
      score: Number(leader.total || 0),
      updatedAt: leader.updatedAt || ""
    } : null];
  }));
}

function buildSchedulePublic({ charreadas = [] } = {}) {
  return charreadas.slice()
    .sort((a, b) => publicDateValue(`${a.fecha || ""} ${a.hora || ""}`) - publicDateValue(`${b.fecha || ""} ${b.hora || ""}`) || String(a.phase || "").localeCompare(String(b.phase || ""), "es") || Number(a.order || 0) - Number(b.order || 0))
    .map((charreada) => {
      console.info("[program-fase-001] schedule phase included", {
        charreadaId: charreada.charreadaId,
        phase: charreada.phase || null
      });
      return {
        charreadaId: charreada.charreadaId,
        nombre: charreada.nombre,
        fecha: charreada.fecha,
        hora: charreada.hora,
        phase: charreada.phase || null,
        equipos: charreada.equipos,
        status: charreada.status
      };
    });
}

function buildLastScoresPublic({ normalizedScores = [] } = {}) {
  return normalizedScores.slice()
    .sort((a, b) => publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))
    .slice(0, 30)
    .map((score) => ({
      team: {
        teamId: score.teamId,
        name: score.teamName
      },
      charro: score.charroName || "Charro no registrado",
      suerte: {
        key: score.suerteAbbr,
        nombre: getPublicSuerteLabel(score.suerteAbbr)
      },
      score: Number(score.total || 0),
      timestamp: score.updatedAt || ""
    }));
}

function logPublicCore003Diagnostics({
  activeCharreadaId = "",
  activeCharreada = null,
  teams = [],
  normalizedScores = [],
  currentScoreboard = [],
  generalRanking = [],
  scoresheet = [],
  publicTeams = [],
  leaders = {}
} = {}) {
  console.info("[public-core-003] normalized scores count", normalizedScores.length);
  console.info("[public-core-003] normalized scores sample", summarizePublicScores(normalizedScores.slice(0, 3)));
  console.info("[public-core-003] current scoreboard rows", currentScoreboard.length);
  console.info("[public-core-003] current scoreboard totals", summarizePublicTotals(currentScoreboard, "total"));
  console.info("[public-core-003] general ranking rows", generalRanking.length);
  console.info("[public-core-003] general ranking totals", summarizePublicTotals(generalRanking, "total"));
  console.info("[public-core-003] scoresheet rows", scoresheet.length);
  console.info("[public-core-003] scoresheet totals", summarizePublicTotals(scoresheet, "TOTAL"));
  console.info("[public-core-003] teams totals", summarizePublicTotals(publicTeams, "total"));
  console.info("[public-core-003] leaders built", Object.keys(leaders).filter((key) => leaders[key]).length);

  const rankingHasTotals = generalRanking.some((row) => Number(row.total || 0) > 0);
  const scoreboardAllZero = currentScoreboard.length > 0 && currentScoreboard.every((row) => Number(row.total || 0) === 0);
  const scoresheetAllZero = scoresheet.length > 0 && scoresheet.every((row) => Number(row.TOTAL || 0) === 0);

  if (rankingHasTotals && scoreboardAllZero) {
    console.warn("[public-core-003] WARNING scoreboard zero while ranking has totals");
    const activeTeamIds = activeCharreada?.teamIds || [];
    console.warn("[public-core-003] scoreboard debug", {
      activeCharreadaId,
      activeTeamIds,
      scoresForActiveCharreada: summarizePublicScores(normalizedScores.filter((score) => score.charreadaId === activeCharreadaId).slice(0, 10)),
      scoresForActiveTeams: summarizePublicScores(normalizedScores.filter((score) => activeTeamIds.includes(score.teamId)).slice(0, 10))
    });
  }

  if (rankingHasTotals && scoresheetAllZero) {
    console.warn("[public-core-003] WARNING scoresheet zero while ranking has totals");
  }

  const rankingByTeam = new Map(generalRanking.map((row) => [row.teamId, row]));
  publicTeams.forEach((team) => {
    const rankingRow = rankingByTeam.get(team.teamId);
    if (!rankingRow) return;
    if (Number(team.total || 0) === 0 && Number(rankingRow.total || 0) > 0) {
      console.warn("[public-core-003] WARNING team total mismatch", {
        teamId: team.teamId,
        teamTotal: team.total,
        rankingTotal: rankingRow.total
      });
    }
  });

  if (!teams.length && normalizedScores.length) {
    console.warn("[public-core-003] WARNING normalized scores without teams catalog");
  }
}

function summarizePublicTotals(rows = [], key = "total", limit = 20) {
  return rows.slice(0, limit).map((row) => ({
    teamId: row.teamId,
    total: Number(row[key] || 0)
  }));
}

function summarizePublicScores(scores = []) {
  return scores.map((score) => ({
    id: score.id,
    charreadaId: score.charreadaId,
    teamId: score.teamId,
    suerteAbbr: score.suerteAbbr,
    total: score.total,
    attempt: score.attempt,
    opportunity: score.opportunity,
    updatedAt: score.updatedAt,
    source: score.source
  }));
}

function buildPublicSnapshotSignature(snapshot) {
  return JSON.stringify(stripVolatilePublicSnapshotFields(snapshot || null));
}

function stripVolatilePublicSnapshotFields(value) {
  if (Array.isArray(value)) return value.map(stripVolatilePublicSnapshotFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "generatedAt" && key !== "generatedAtMs")
    .map(([key, entry]) => [key, stripVolatilePublicSnapshotFields(entry)]));
}

function flattenPublicAttempts(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    if (payload.some(Array.isArray)) {
      return payload.flatMap((attempts, coleadorIndex) => publicArray(attempts).map((attempt, attemptIndex) => ({
        attempt,
        attemptIndex,
        opportunity: coleadorIndex
      })));
    }
    return payload.map((attempt, attemptIndex) => ({ attempt, attemptIndex, opportunity: 0 }));
  }
  if (typeof payload === "object") {
    const nested = payload.attempts || payload.intentos || payload.rows || payload.coleadores;
    if (nested) return flattenPublicAttempts(nested);
    return [{ attempt: payload, attemptIndex: publicReadNumber(payload.attemptIndex, 0), opportunity: publicReadNumber(payload.opportunity, payload.opportunityIndex, payload.coleadorIndex, 0) }];
  }
  return [];
}

function parsePublicCompoundScoreId(value) {
  const parts = String(value || "").split("__");
  return {
    charreadaId: parts[0] || "",
    teamId: parts[1] || "",
    suerteRaw: parts[2] || "",
    attempt: publicReadNumber(parts[3], 0),
    opportunity: publicReadNumber(parts[4], 0)
  };
}

function extractPublicTeamIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(extractPublicTeamId).filter(Boolean);
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => extractPublicTeamId(item, key)).filter(Boolean);
  return [String(value)];
}

function extractPublicTeamId(item, fallback = "") {
  if (!item) return "";
  if (typeof item === "string" || typeof item === "number") return String(item);
  return publicReadString(item.teamId, item.id, item.equipoId, fallback);
}

function normalizeSuerteAbbr(value) {
  const clean = publicCleanKey(value);
  if (!clean) return "";
  if (clean.includes("pialderuedo") || clean.includes("pialruedo") || clean.includes("pialr")) return "PR";
  if (clean.includes("manganascaballo") || clean.includes("manganasacaballo")) return "MC";
  if (clean.includes("manganaspie") || clean.includes("manganasapie")) return "MP";
  if (clean.includes("jineteotoro")) return "JT";
  if (clean.includes("jineteoyegua")) return "JY";
  if (clean.includes("pasomuerte") || clean.includes("pasodelamuerte")) return "PM";
  if (clean.includes("lazocabecero")) return "LC";
  const match = PUBLIC_SUERTES.find((suerte) => suerte.aliases.some((alias) => publicCleanKey(alias) === clean || clean.includes(publicCleanKey(alias))));
  return match?.key || "";
}

function normalizePublicSuerteKey(value) {
  return normalizeSuerteAbbr(value);
}

function getPublicSuerteLabel(key) {
  return PUBLIC_SUERTES.find((suerte) => suerte.key === key)?.label || key || "";
}

function comparePublicScoreFreshness(a, b) {
  const revisionDiff = Number(a._revision || 0) - Number(b._revision || 0);
  if (revisionDiff) return revisionDiff;
  const dateDiff = publicDateValue(a.updatedAt) - publicDateValue(b.updatedAt);
  if (dateDiff) return dateDiff;
  return Number(a._order || 0) - Number(b._order || 0);
}

function sumPublicScores(scores = []) {
  return scores.reduce((sum, score) => sum + Number(score.total || 0), 0);
}

function publicEntries(value) {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => [publicReadString(item?.key, item?.id, item?.teamId, item?.charreadaId, index), item])
      .filter(([, item]) => item !== null && item !== undefined);
  }
  if (value && typeof value === "object") return Object.entries(value).filter(([, item]) => item !== null && item !== undefined);
  return [];
}

function publicArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).filter(Boolean);
  return [];
}

function publicReadString(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function publicReadNumber(...values) {
  const value = publicReadNumberOrNull(...values);
  return value === null ? 0 : value;
}

function publicReadNumberOrNull(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function publicDateValue(value) {
  if (!value) return 0;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function publicCleanKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
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
    const publicSnapshot = await publishPublicTournamentSnapshot(cleanTournamentId, null, { source: "score" });
    console.info("[score] guardado en CharroPro por nodo individual", {
      path: `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores/${cleanScoreId}`,
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      publicSnapshot
    });
    return { ok: true, path: `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores/${cleanScoreId}`, publicSnapshot };
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
    const publicSnapshot = await publishPublicTournamentSnapshot(cleanTournamentId, payload, { source: "tournamentState" });
    return { ok: true, version, publicSnapshot };
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

export function subscribeFirebaseScores(tournamentId, callback) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId || !isFirebaseLiveConfigured()) return () => {};

  const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores`;
  try {
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const scores = snapshot.val() || {};
      const scoreIds = Object.keys(scores);
      const lastScoreId = scoreIds[scoreIds.length - 1] || "";
      console.info("[scores] recibido desde CharroPro", {
        path,
        tournamentId: cleanTournamentId,
        count: scoreIds.length,
        lastScoreId
      });
      callback({
        tournamentId: cleanTournamentId,
        path,
        scores,
        exists: snapshot.exists(),
        count: scoreIds.length,
        lastScoreId,
        receivedAtMs: Date.now()
      });
    }, (error) => {
      callback({
        tournamentId: cleanTournamentId,
        path,
        scores: {},
        exists: false,
        count: 0,
        lastScoreId: "",
        error,
        reason: normalizeFirebaseFailureReason(error),
        receivedAtMs: Date.now()
      });
    });
  } catch (error) {
    callback({
      tournamentId: cleanTournamentId,
      path,
      scores: {},
      exists: false,
      count: 0,
      lastScoreId: "",
      error,
      reason: normalizeFirebaseFailureReason(error),
      receivedAtMs: Date.now()
    });
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
  const phase = publicReadString(charreada.phase, charreada.fase);
  return {
    ...charreada,
    id: charreada.id || "",
    tournamentId: charreada.tournamentId || "",
    name: charreada.name || "",
    phase,
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
    phase: publicReadString(charreada.phase, charreada.fase),
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
    timeEvidence: compactTimeEvidence(attempt.timeEvidence),
    teamPenalties: compactPublishedItems(attempt.teamPenalties)
  };
}

function compactTimeEvidence(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({
        id: item.id || "",
        label: item.label || "",
        timeMs: Number(item.timeMs || 0),
        timeText: item.timeText || "",
        capturedAt: item.capturedAt || "",
        timerRunning: Boolean(item.timerRunning),
        source: item.source || ""
      }))
    : [];
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
