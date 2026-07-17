import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { get, getDatabase, onValue, push, ref, runTransaction, set, update } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-functions.js";
import {
  COMPETITION_TYPES,
  getCompetitionType,
  getCompetitionTypeFromTournamentType
} from "../data/competitionTypes.js?v=20260712-production-competitions-001-broadcast-context1";
import { makeAccessSession, normalizeRole, normalizeTournamentAccess } from "./roles.js?v=20260708-recovery-001b-panel-status1";
import { normalizeScoringButtonLayouts } from "../data/defaultScoringButtonLayouts.js?v=20260708-recovery-001b-panel-status1";
import {
  BROADCAST_SINGLE_TENANT_SCOPE_ID,
  buildBroadcastAutomaticSessionId,
  createBroadcastTemporaryAccessDescriptor,
  isBroadcastTemporaryAccessActive,
  revokeBroadcastTemporaryAccessDescriptor,
  validateBroadcastTemporaryAccessDescriptor
} from "../broadcast/broadcastRealtimeTransport.js?v=20260716-broadcast-context-resolution-001-real-context-v1";

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
const BROADCAST_STUDIO_SESSIONS_PATH = "charropro/broadcastStudio/sessions";
const BROADCAST_TEMPORARY_ACCESS_TYPES = new Set(["program_main", "announcer_monitor"]);
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
const PUBLIC_SUERTE_ID_COLUMNS = Object.freeze({
  cala: ["CC"],
  piales: ["P"],
  colas: ["C"],
  toro: ["JT"],
  terna: ["LC", "PR"],
  yegua: ["JY"],
  manganas_pie: ["MP"],
  manganas_caballo: ["MC"],
  paso: ["PM"]
});

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

export function getFirebaseBroadcastSessionPath(sessionId = "") {
  const cleanSessionId = normalizeBroadcastContextId(sessionId);
  return cleanSessionId ? `${BROADCAST_STUDIO_SESSIONS_PATH}/${cleanSessionId}` : "";
}

export function getFirebaseBroadcastTemporaryAccessPath(sessionId = "", accessId = "") {
  const sessionPath = getFirebaseBroadcastSessionPath(sessionId);
  const cleanAccessId = normalizeBroadcastContextId(accessId);
  return sessionPath && cleanAccessId ? `${sessionPath}/access/${cleanAccessId}` : "";
}

export async function getOrCreateFirebaseBroadcastTemporaryAccess(value = {}, outputType, options = {}) {
  const context = normalizeFirebaseBroadcastContext(value);
  const normalizedOutputType = normalizeFirebaseBroadcastOutputType(outputType);
  const access = await resolveFirebaseBroadcastAccess(context, "publish");
  const sessionPath = getFirebaseBroadcastSessionPath(context.sessionId);
  await ensureFirebaseBroadcastSessionContext(sessionPath, context, access);
  const accessRoot = ref(getFirebaseDatabase(), `${sessionPath}/access`);
  const snapshot = await get(accessRoot);
  const now = options.now || new Date().toISOString();
  const candidates = Object.values(snapshot.val() || {})
    .map((entry) => entry?.descriptor)
    .filter((descriptor) => descriptor?.outputType === normalizedOutputType)
    .filter((descriptor) => isBroadcastTemporaryAccessActive(descriptor, { now }))
    .sort((left, right) => Number(right.createdAt && Date.parse(right.createdAt) || 0) - Number(left.createdAt && Date.parse(left.createdAt) || 0));
  if (options.renew !== true && candidates[0]) return cloneFirebaseBroadcastValue(candidates[0]);
  const updates = {};
  if (options.renew === true) {
    for (const descriptor of candidates) {
      const revoked = revokeBroadcastTemporaryAccessDescriptor(descriptor, { now });
      updates[`${descriptor.accessId}/descriptor`] = cloneFirebaseBroadcastValue(revoked);
    }
  }
  const descriptor = createBroadcastTemporaryAccessDescriptor(context, normalizedOutputType, {
    accessId: options.accessId,
    ttlMs: options.ttlMs,
    now
  });
  updates[`${descriptor.accessId}/descriptor`] = cloneFirebaseBroadcastValue(descriptor);
  await update(accessRoot, updates);
  console.info("[broadcast-simple-access] temporary access ready", {
    outputType: normalizedOutputType,
    sessionId: context.sessionId,
    expiresAt: descriptor.expiresAtIso
  });
  return cloneFirebaseBroadcastValue(descriptor);
}

export async function revokeFirebaseBroadcastTemporaryAccess(value = {}, accessId, options = {}) {
  const context = normalizeFirebaseBroadcastContext(value);
  await resolveFirebaseBroadcastAccess(context, "publish");
  const accessPath = getFirebaseBroadcastTemporaryAccessPath(context.sessionId, accessId);
  if (!accessPath) throw firebaseBroadcastError("broadcast-temporary-access-invalid");
  const descriptorRef = ref(getFirebaseDatabase(), `${accessPath}/descriptor`);
  const snapshot = await get(descriptorRef);
  const descriptor = snapshot.val();
  if (!descriptor || !sameFirebaseBroadcastAccessContext(descriptor.context, context)) {
    throw firebaseBroadcastError("broadcast-temporary-access-context-conflict");
  }
  const revoked = revokeBroadcastTemporaryAccessDescriptor(descriptor, { now: options.now });
  await set(descriptorRef, cloneFirebaseBroadcastValue(revoked));
  return cloneFirebaseBroadcastValue(revoked);
}

export async function closeFirebaseBroadcastSession(value = {}, options = {}) {
  const context = normalizeFirebaseBroadcastContext(value);
  await resolveFirebaseBroadcastAccess(context, "publish");
  const session = await readFirebaseBroadcastSessionContext(context);
  if (!session.exists) {
    return Object.freeze({
      ...context,
      status: "not-found",
      revision: 0,
      alreadyClosed: false
    });
  }
  await revokeAllFirebaseBroadcastTemporaryAccess(context, options);
  return setFirebaseBroadcastSessionStatus(context, "closed", options);
}

export async function renewFirebaseBroadcastSession(value = {}, options = {}) {
  const context = normalizeFirebaseBroadcastContext(value);
  await resolveFirebaseBroadcastAccess(context, "publish");
  await revokeAllFirebaseBroadcastTemporaryAccess(context, options);
  return setFirebaseBroadcastSessionStatus(context, "active", options);
}

export async function resolveFirebaseBroadcastTemporaryAccess(value = {}, expectedOutputType) {
  const sessionId = normalizeBroadcastContextId(value.sessionId);
  const accessId = normalizeBroadcastContextId(value.accessId || value.access);
  const outputType = normalizeFirebaseBroadcastOutputType(expectedOutputType || value.outputType);
  const accessPath = getFirebaseBroadcastTemporaryAccessPath(sessionId, accessId);
  if (!accessPath) throw firebaseBroadcastError("broadcast-temporary-access-invalid");
  const snapshot = await get(ref(getFirebaseDatabase(), `${accessPath}/descriptor`));
  const descriptor = snapshot.val();
  const validation = validateBroadcastTemporaryAccessDescriptor(descriptor);
  if (!validation.valid) {
    const code = validation.errors.includes("broadcast-realtime-temporary-access-expired")
      ? "broadcast-temporary-access-expired"
      : validation.errors.includes("broadcast-realtime-temporary-access-revoked")
        ? "broadcast-temporary-access-revoked"
        : "broadcast-temporary-access-invalid";
    throw firebaseBroadcastError(code);
  }
  if (descriptor.outputType !== outputType || descriptor.sessionId !== sessionId || descriptor.readOnly !== true) {
    throw firebaseBroadcastError("broadcast-temporary-access-scope-conflict");
  }
  return Object.freeze({
    descriptor: Object.freeze(cloneFirebaseBroadcastValue(descriptor)),
    context: Object.freeze({
      tenantId: BROADCAST_SINGLE_TENANT_SCOPE_ID,
      organizationId: null,
      clientId: null,
      tournamentId: descriptor.context.tournamentId,
      competitionId: descriptor.context.competitionId || null,
      activeCharreadaId: descriptor.context.activeCharreadaId || null,
      sessionId: descriptor.sessionId
    }),
    accessPath,
    outputType,
    channel: descriptor.channel
  });
}

export function createFirebaseBroadcastTemporaryAccessAdapter(accessDefinition = {}, options = {}) {
  const descriptor = accessDefinition.descriptor;
  const context = normalizeFirebaseBroadcastContext(accessDefinition.context);
  const outputType = normalizeFirebaseBroadcastOutputType(accessDefinition.outputType || descriptor?.outputType);
  const channel = outputType === "program_main" ? "program" : "announcer";
  const accessPath = getFirebaseBroadcastTemporaryAccessPath(context.sessionId, descriptor?.accessId);
  if (!accessPath || descriptor?.channel !== channel) throw firebaseBroadcastError("broadcast-temporary-access-invalid");
  let connectionUnsubscribe = null;
  return Object.freeze({
    adapterId: normalizeBroadcastContextId(options.adapterId) || `firebase-broadcast-access-${descriptor.accessId}`,
    type: "firebase-rtdb-read-only-access",
    async connect(request = {}) {
      const requested = normalizeFirebaseBroadcastContext(request.context);
      if (!sameFirebaseBroadcastContext(context, requested)) throw firebaseBroadcastError("broadcast-temporary-access-context-conflict");
      connectionUnsubscribe?.();
      connectionUnsubscribe = onValue(
        ref(getFirebaseDatabase(), ".info/connected"),
        (snapshot) => request.onStatus?.({ connected: snapshot.val() === true, offline: snapshot.val() !== true, at: new Date().toISOString() }),
        (error) => request.onError?.(normalizeFirebaseBroadcastError(error))
      );
      return () => {
        connectionUnsubscribe?.();
        connectionUnsubscribe = null;
      };
    },
    subscribe(request = {}) {
      if (!String(request.path || "").endsWith(`/${channel}/current`)) {
        throw firebaseBroadcastError("broadcast-temporary-access-channel-forbidden");
      }
      return onValue(
        ref(getFirebaseDatabase(), `${accessPath}/${channel}/current`),
        (snapshot) => {
          const envelope = decodeFirebaseBroadcastValue(snapshot.val());
          request.onValue?.(envelope ? { ...envelope, context: cloneFirebaseBroadcastValue(context) } : null);
        },
        (error) => request.onError?.(normalizeFirebaseBroadcastError(error))
      );
    },
    async publish() {
      throw firebaseBroadcastError("broadcast-temporary-access-read-only");
    },
    async publishOutputState() {
      throw firebaseBroadcastError("broadcast-temporary-access-read-only");
    },
    async read() {
      return null;
    },
    disconnect() {
      connectionUnsubscribe?.();
      connectionUnsubscribe = null;
    }
  });
}

export function createFirebaseBroadcastAdapter(options = {}) {
  const adapterId = normalizeBroadcastContextId(options.adapterId) || "firebase-broadcast-adapter";
  const accessMode = options.accessMode === "publish" ? "publish" : "read";
  let connectionUnsubscribe = null;
  let access = null;
  let connectedContext = null;

  return Object.freeze({
    adapterId,
    type: "firebase-rtdb",
    async connect(request = {}) {
      const context = normalizeFirebaseBroadcastContext(request.context);
      const sessionPath = requireFirebaseBroadcastSessionPath(request.sessionPath, context.sessionId);
      access = await resolveFirebaseBroadcastAccess(context, accessMode);
      await validateExistingFirebaseBroadcastSessionContext(sessionPath, context, accessMode);
      connectedContext = context;
      connectionUnsubscribe?.();
      connectionUnsubscribe = onValue(
        ref(getFirebaseDatabase(), ".info/connected"),
        (snapshot) => request.onStatus?.({ connected: snapshot.val() === true, offline: snapshot.val() !== true, at: new Date().toISOString() }),
        (error) => request.onError?.(normalizeFirebaseBroadcastError(error))
      );
      return () => {
        connectionUnsubscribe?.();
        connectionUnsubscribe = null;
      };
    },
    subscribe(request = {}) {
      const context = request.context
        ? normalizeFirebaseBroadcastContext(request.context)
        : connectedContext;
      const sessionPath = requireConnectedFirebaseBroadcastAdapterContext(connectedContext, context);
      const path = requireFirebaseBroadcastPath(request.path, sessionPath);
      return onValue(
        ref(getFirebaseDatabase(), path),
        (snapshot) => request.onValue?.(decodeFirebaseBroadcastValue(snapshot.val())),
        (error) => request.onError?.(normalizeFirebaseBroadcastError(error))
      );
    },
    subscribeContract(request = {}) {
      const context = normalizeFirebaseBroadcastContext(request.context || connectedContext);
      if (!access || !connectedContext || !sameFirebaseBroadcastContext(connectedContext, context)) {
        throw firebaseBroadcastError("broadcast-adapter-not-connected");
      }
      const path = `${LIVE_ROOT_PATH}/${normalizeLiveChannel(context.tournamentId)}/current/broadcastContract`;
      return onValue(
        ref(getFirebaseDatabase(), path),
        (snapshot) => request.onValue?.(snapshot.val()),
        (error) => request.onError?.(normalizeFirebaseBroadcastError(error))
      );
    },
    async publish(request = {}) {
      const context = normalizeFirebaseBroadcastContext(request.context);
      requireConnectedFirebaseBroadcastAdapterContext(connectedContext, context);
      const sessionPath = requireFirebaseBroadcastSessionPath(request.sessionPath, context.sessionId);
      const path = requireFirebaseBroadcastPath(request.path, sessionPath);
      access = await resolveFirebaseBroadcastAccess(context, "publish");
      await ensureFirebaseBroadcastSessionContext(sessionPath, context, access);
      const firebaseEnvelope = encodeFirebaseBroadcastValue(request.envelope);
      const result = await publishFirebaseBroadcastValue(path, firebaseEnvelope, {
        expectedRevision: request.expectedRevision,
        idempotencyKey: request.idempotencyKey
      });
      await updateFirebaseBroadcastRevision(sessionPath, request.channel, result.revision, context);
      await publishFirebaseBroadcastTemporaryAccessCopies(sessionPath, request.channel, firebaseEnvelope);
      return result;
    },
    async publishOutputState(request = {}) {
      const context = normalizeFirebaseBroadcastContext(request.context);
      requireConnectedFirebaseBroadcastAdapterContext(connectedContext, context);
      const sessionPath = requireFirebaseBroadcastSessionPath(request.sessionPath, context.sessionId);
      const path = requireFirebaseBroadcastPath(request.path, sessionPath);
      access = await resolveFirebaseBroadcastAccess(context, "publish");
      await ensureFirebaseBroadcastSessionContext(sessionPath, context, access);
      return publishFirebaseBroadcastValue(path, {
        outputId: normalizeBroadcastContextId(request.outputId),
        context,
        ...cleanUndefined(request.state || {})
      }, { expectedRevision: request.expectedRevision });
    },
    async read(path = "") {
      const sessionPath = requireConnectedFirebaseBroadcastAdapterContext(connectedContext);
      const cleanPath = requireFirebaseBroadcastPath(path, sessionPath);
      const snapshot = await get(ref(getFirebaseDatabase(), cleanPath));
      return decodeFirebaseBroadcastValue(snapshot.val());
    },
    disconnect() {
      connectionUnsubscribe?.();
      connectionUnsubscribe = null;
      access = null;
      connectedContext = null;
    }
  });
}

export async function resolveCurrentBroadcastContext(value = {}, options = {}) {
  const input = normalizeFirebaseBroadcastRequestContext(value);
  const operation = options.operation === "publish" ? "publish" : "read";
  const user = await getFirebaseBroadcastAuthenticatedUser();
  if (!user?.uid) throw firebaseBroadcastError("broadcast-auth-required");
  const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${user.uid}`));
  const profile = profileSnapshot.val() || {};
  const tournamentAssigned = await readFirebaseBroadcastTournamentAssignment(profile, user.uid, input.tournamentId);
  const tournamentSnapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${input.tournamentId}`));
  if (!tournamentSnapshot.exists()) throw firebaseBroadcastError("broadcast-context-unavailable");
  const tournament = tournamentSnapshot.val() || {};
  const officialTournamentId = normalizeBroadcastContextId(tournament.info?.id || input.tournamentId);
  if (officialTournamentId !== input.tournamentId) throw firebaseBroadcastError("broadcast-context-mismatch");
  const charreadas = arrayFromRecord(tournament.charreadas);
  const officialActiveCharreadaId = normalizeBroadcastContextId(
    tournament.meta?.activeCharreadaId ||
      tournament.info?.activeCharreadaId ||
      tournament.tournamentState?.activeCharreadaId ||
      tournament.activeCharreadaId
  );
  if (!officialActiveCharreadaId) throw firebaseBroadcastError("broadcast-context-unavailable");
  const activeCharreada = charreadas.find((charreada) => normalizeBroadcastContextId(charreada?.id) === officialActiveCharreadaId);
  if (!activeCharreada) throw firebaseBroadcastError("broadcast-context-mismatch");
  if (input.activeCharreadaId && input.activeCharreadaId !== officialActiveCharreadaId) {
    throw firebaseBroadcastError("broadcast-context-mismatch");
  }
  const officialCompetitionId = normalizeBroadcastContextId(
    activeCharreada.competitionId ||
      activeCharreada.competitionType ||
      getCompetitionTypeFromTournamentType(tournament.info?.type)
  );
  if (!officialCompetitionId) throw firebaseBroadcastError("broadcast-context-unavailable");
  if (input.competitionId && input.competitionId !== officialCompetitionId) {
    throw firebaseBroadcastError("broadcast-context-mismatch");
  }
  const sessionId = buildBroadcastAutomaticSessionId({
    tournamentId: officialTournamentId,
    competitionId: officialCompetitionId,
    activeCharreadaId: officialActiveCharreadaId
  });
  if (input.sessionId && input.sessionId !== sessionId) throw firebaseBroadcastError("broadcast-session-context-conflict");
  const context = {
    tenantId: BROADCAST_SINGLE_TENANT_SCOPE_ID,
    organizationId: null,
    clientId: null,
    tournamentId: officialTournamentId,
    competitionId: officialCompetitionId,
    activeCharreadaId: officialActiveCharreadaId,
    sessionId,
    source: "firebase-tournament-active-charreada",
    revision: Number(tournament.meta?.version || tournament.version || 0),
    resolvedAt: options.now ? new Date(options.now).toISOString() : new Date().toISOString()
  };
  validateFirebaseBroadcastProfileAccess(profile, user.uid, context, operation, { tournamentAssigned });
  return Object.freeze(context);
}

export async function resolveFirebaseBroadcastAuthorizedContext(value = {}, operation = "read") {
  return resolveCurrentBroadcastContext(value, { operation });
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
      ...compactProductionFields(payload),
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
  const teams = normalizePublicTeams(source);
  const charreadas = normalizePublicCharreadas(source, teams);
  const competitions = buildPublicCompetitionsList(charreadas);
  const activeCharreadaId = resolvePublicActiveCharreadaId(source);
  const activeCharreadaSource = activeCharreadaId
    ? charreadas.find((charreada) => charreada.charreadaId === activeCharreadaId) || null
    : null;
  const normalizedScores = normalizePublicScores(source, teams, charreadas);
  const publicEntries = buildPublicCompetitionEntries({ teams, charreadas, normalizedScores });
  const publicTeams = buildPublicTeamsList({ teams: publicEntries, normalizedScores });
  const activeCharreada = buildActiveCharreadaPublic({
    charreada: activeCharreadaSource,
    source,
    normalizedScores
  });
  const currentScoreboard = buildCurrentScoreboardPublic({
    teams: publicEntries,
    charreadas,
    activeCharreadaId,
    normalizedScores
  });
  const generalRanking = buildGeneralRankingPublic({
    teams: publicEntries,
    charreadas,
    normalizedScores
  });
  const scoresheet = buildScoreSheetPublic({
    teams: publicEntries,
    normalizedScores,
    generalRanking
  });
  const leaders = buildLeadersPublic({ normalizedScores });
  const schedule = buildSchedulePublic({ charreadas });
  const lastScores = buildLastScoresPublic({ normalizedScores });
  const stats = {
    teams: teams.length,
    publicEntries: publicEntries.length,
    competitions: competitions.length,
    charreadas: charreadas.length,
    scores: countStoredRecords(source.scores),
    publishedScores: countStoredRecords(source.publishedScores),
    normalizedScores: normalizedScores.length,
    updatedAt: publicReadString(source.meta.updatedAt)
  };

  logPublicCore003Diagnostics({
    activeCharreadaId,
    activeCharreada: activeCharreadaSource,
    teams: publicEntries,
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
    scoresheetColumns: buildPublicScoreSheetColumnsByCompetition(competitions),
    leaders,
    schedule,
    lastScores,
    teams: publicTeams,
    competitions,
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
    const competition = resolvePublicCompetitionContext(row);
    const teamIds = extractPublicTeamIds(row.teamIds || row.equipoIds || row.teams || row.equipos || row.scoreboardTeams);
    const equipos = teamIds.map((teamId) => {
      const team = teamsById.get(teamId);
      return {
        teamId,
        teamName: team?.teamName || team?.name || teamId,
        name: team?.teamName || team?.name || teamId
      };
    });
    const individualParticipants = normalizePublicIndividualParticipants(
      row.individualParticipants || row.participants || row.participantes
    );
    return {
      charreadaId: publicReadString(row.id, row.charreadaId, row._id, row.key, mapKey, `charreada_${index + 1}`),
      nombre: publicReadString(row.name, row.nombre, row.displayName, row.title, row.label, `Charreada ${index + 1}`),
      fecha: publicReadString(row.fecha, row.date, row.scheduledAt, row.startAt),
      hora: publicReadString(row.hora, row.startTime, row.time),
      phase: publicReadString(row.phase, row.fase, row.phaseName, row.phase?.name, row.phase?.nombre),
      status: publicReadString(row.status, row.estado),
      teamIds,
      equipos,
      individualParticipants,
      competitionType: competition.competitionType,
      competitionScope: competition.competitionScope,
      competitionId: competition.competitionId,
      category: publicReadString(row.category, row.categoria),
      suerteIds: competition.suerteIds,
      participantScope: competition.competitionScope === "individual" ? "individual" : "team",
      participantsCount: competition.competitionScope === "individual" ? individualParticipants.length : 0,
      teamsCount: competition.competitionScope === "team" ? equipos.length : 0,
      order: publicReadNumber(row.charreadaOrder, row.order, row.orden, index + 1)
    };
  });
}

function resolvePublicCompetitionContext(row = {}) {
  const rawType = publicReadString(row.competitionType, row.competitionId) || "equipos_completo";
  const config = getCompetitionType(rawType);
  const competitionType = config.type || "equipos_completo";
  const competitionScope = publicReadString(row.competitionScope, config.scope, "team");
  const competitionId = publicReadString(row.competitionId, competitionType);
  const suerteIds = normalizePublicSuerteIds(row.suerteIds, config.suerteIds);
  return {
    competitionType,
    competitionScope,
    competitionId,
    suerteIds
  };
}

function normalizePublicSuerteIds(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizePublicIndividualParticipants(value) {
  return publicEntries(value).map(([mapKey, participant], index) => {
    const row = participant && typeof participant === "object" ? participant : { name: participant };
    const participantId = publicReadString(row.id, row.participantId, row.charroId, row._id, row.key, mapKey, `participant_${index + 1}`);
    const participantName = publicReadString(row.name, row.nombre, row.participantName, row.charroName, row.charro, participantId, `Participante ${index + 1}`);
    return {
      participantId,
      participantName,
      name: participantName,
      association: publicReadString(row.association, row.asociacion),
      category: publicReadString(row.category, row.categoria),
      horseName: publicReadString(row.horseName, row.caballo, row.horse?.name),
      order: publicReadNumber(row.order, row.orden, index + 1)
    };
  }).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

function buildPublicCompetitionsList(charreadas = []) {
  const records = new Map();
  charreadas.forEach((charreada) => {
    const competitionType = charreada.competitionType || "equipos_completo";
    const config = getCompetitionType(competitionType);
    const competitionId = charreada.competitionId || competitionType;
    if (!records.has(competitionId)) {
      records.set(competitionId, {
        competitionId,
        competitionType,
        competitionScope: charreada.competitionScope || config.scope,
        label: config.label,
        category: charreada.category || "",
        suerteIds: normalizePublicSuerteIds(charreada.suerteIds, config.suerteIds),
        charreadasCount: 0
      });
    }
    const record = records.get(competitionId);
    record.charreadasCount += 1;
  });
  const order = new Map(COMPETITION_TYPES.map((competition, index) => [competition.type, index]));
  return [...records.values()].sort((left, right) =>
    (order.get(left.competitionType) ?? 99) - (order.get(right.competitionType) ?? 99) ||
    String(left.label || "").localeCompare(String(right.label || ""), "es")
  );
}

function buildPublicScoreSheetColumnsByCompetition(competitions = []) {
  if (!competitions.length) return { equipos_completo: PUBLIC_SCORESHEET_COLUMNS };
  return Object.fromEntries(competitions.map((competition) => [
    competition.competitionId || competition.competitionType,
    publicSuerteIdsToColumns(competition.suerteIds)
  ]));
}

function publicSuerteIdsToColumns(suerteIds = []) {
  const columns = [];
  suerteIds.forEach((suerteId) => {
    const mappedColumns = PUBLIC_SUERTE_ID_COLUMNS[suerteId] || [normalizeSuerteAbbr(suerteId)];
    mappedColumns.forEach((column) => {
      if (column && !columns.includes(column)) columns.push(column);
    });
  });
  if (!columns.includes("TOTAL")) columns.push("TOTAL");
  return columns.length > 1 ? columns : PUBLIC_SCORESHEET_COLUMNS;
}

function buildPublicCompetitionEntries({ teams = [], charreadas = [], normalizedScores = [] } = {}) {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const entries = new Map();
  charreadas.forEach((charreada) => {
    const competition = publicCompetitionFields(charreada);
    if (competition.competitionScope === "individual") {
      charreada.individualParticipants.forEach((participant) => {
        const entry = publicEntryFromParticipant(participant, charreada, competition);
        if (entry.teamId) entries.set(publicEntryKey(entry), entry);
      });
      return;
    }
    charreada.teamIds.forEach((teamId, index) => {
      const team = teamsById.get(teamId) || charreada.equipos[index] || { teamId, teamName: teamId };
      const entry = publicEntryFromTeam(team, charreada, competition);
      if (entry.teamId) entries.set(publicEntryKey(entry), entry);
    });
  });

  if (!entries.size) {
    teams.forEach((team) => {
      const competition = {
        competitionType: "equipos_completo",
        competitionScope: "team",
        competitionId: "equipos_completo",
        category: team.category || "",
        participantScope: "team"
      };
      const entry = publicEntryFromTeam(team, {}, competition);
      if (entry.teamId) entries.set(publicEntryKey(entry), entry);
    });
  }

  normalizedScores.forEach((score) => {
    const key = publicEntryKey(score);
    if (entries.has(key)) return;
    entries.set(key, publicEntryFromScore(score));
  });

  return [...entries.values()];
}

function publicEntryFromTeam(team = {}, charreada = {}, competition = {}) {
  return cleanUndefined({
    ...competition,
    teamId: publicReadString(team.teamId, team.id),
    teamName: publicReadString(team.teamName, team.name, team.nombre, team.teamId, team.id),
    name: publicReadString(team.teamName, team.name, team.nombre, team.teamId, team.id),
    category: publicReadString(charreada.category, team.category, team.categoria, competition.category),
    abbreviation: publicReadString(team.abbreviation, team.abreviatura),
    logo: publicReadString(team.logo, team.logoUrl)
  });
}

function publicEntryFromParticipant(participant = {}, charreada = {}, competition = {}) {
  const participantId = publicReadString(participant.participantId, participant.id);
  const participantName = publicReadString(participant.participantName, participant.name, participantId);
  return cleanUndefined({
    ...competition,
    participantScope: "individual",
    teamId: participantId,
    teamName: participantName,
    name: participantName,
    participantId,
    participantName,
    association: participant.association || "",
    category: publicReadString(participant.category, charreada.category, competition.category),
    horseName: participant.horseName || ""
  });
}

function publicEntryFromScore(score = {}) {
  return cleanUndefined({
    competitionType: score.competitionType || "equipos_completo",
    competitionScope: score.competitionScope || "team",
    competitionId: score.competitionId || score.competitionType || "equipos_completo",
    category: score.category || "",
    participantScope: score.participantScope || "team",
    teamId: score.teamId,
    teamName: score.teamName,
    name: score.teamName,
    participantId: score.participantId || "",
    participantName: score.participantName || "",
    association: score.association || "",
    horseName: score.horseName || ""
  });
}

function publicEntryKey(entry = {}) {
  return `${entry.competitionId || entry.competitionType || "equipos_completo"}__${entry.teamId || entry.participantId || ""}`;
}

function getPublicCharreadaEntries(charreada = {}) {
  const competition = publicCompetitionFields(charreada);
  if (competition.competitionScope === "individual") {
    return (charreada.individualParticipants || []).map((participant) => publicEntryFromParticipant(participant, charreada, competition));
  }
  return (charreada.equipos || []).map((team) => publicEntryFromTeam(team, charreada, competition));
}

function publicScoreMatchesEntry(score = {}, entry = {}) {
  const scoreCompetitionId = score.competitionId || score.competitionType || "equipos_completo";
  const entryCompetitionId = entry.competitionId || entry.competitionType || "equipos_completo";
  const scoreEntryId = score.teamId || score.participantId || "";
  const entryId = entry.teamId || entry.participantId || "";
  return scoreCompetitionId === entryCompetitionId && scoreEntryId === entryId;
}

function publicCompetitionFields(source = {}) {
  const config = getCompetitionType(source.competitionType || source.competitionId || "equipos_completo");
  const competitionType = source.competitionType || config.type;
  const competitionScope = source.competitionScope || config.scope;
  return {
    competitionType,
    competitionScope,
    competitionId: source.competitionId || competitionType,
    category: source.category || "",
    participantScope: competitionScope === "individual" ? "individual" : "team"
  };
}

function normalizePublicScores(tournamentState = {}, teams = [], charreadas = []) {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const charreadasById = new Map(charreadas.map((charreada) => [charreada.charreadaId, charreada]));
  const publishedScores = publicEntries(tournamentState.publishedScores)
    .filter(([, score]) => score && typeof score === "object" && !score.superseded)
    .map(([mapKey, score], index) => normalizePublicScoreRecord(score, {
      mapKey,
      index,
      teamsById,
      charreadasById,
      source: "publishedScores"
    }))
    .filter(isPublicScoreUsable);

  const rawScores = publishedScores.length ? [] : normalizePublicRawScores(tournamentState.scores, teamsById, charreadasById);
  const selected = publishedScores.length ? publishedScores : rawScores;
  return dedupePublicScores(selected)
    .sort((a, b) => publicDateValue(a.updatedAt) - publicDateValue(b.updatedAt) || a._order - b._order);
}

function normalizePublicRawScores(scores = {}, teamsById = new Map(), charreadasById = new Map()) {
  return publicEntries(scores).flatMap(([scoreKey, payload], scoreIndex) => {
    const compound = parsePublicCompoundScoreId(scoreKey);
    if (!compound.charreadaId || !compound.teamId || !compound.suerteRaw) {
      return [normalizePublicScoreRecord(payload, {
        mapKey: scoreKey,
        index: scoreIndex,
        teamsById,
        charreadasById,
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
      charreadasById,
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
  const charreadaId = publicReadString(
    charreadaObject.id,
    score.charreadaId,
    typeof score.charreada === "string" ? score.charreada : "",
    score.tournament?.charreadaId,
    compound.charreadaId
  );
  const charreada = context.charreadasById?.get(charreadaId) || null;
  const scoreCompetition = resolvePublicScoreCompetition(score, charreada);
  const publicEntry = resolvePublicScoreEntry({ score, teamId, team, charreada, scoreCompetition });

  return {
    id: publicReadString(score.id, score.attemptKey, context.mapKey, `${compound.charreadaId || ""}__${teamId}__${suerteAbbr}__${attempt}__${opportunity}`),
    charreadaId,
    competitionType: scoreCompetition.competitionType,
    competitionScope: scoreCompetition.competitionScope,
    competitionId: scoreCompetition.competitionId,
    category: scoreCompetition.category,
    participantScope: scoreCompetition.participantScope,
    participantId: publicEntry.participantId,
    participantName: publicEntry.participantName,
    association: publicEntry.association,
    horseName: publicEntry.horseName,
    teamId: publicEntry.teamId,
    teamName: publicEntry.teamName,
    suerteKey: suerteAbbr,
    suerteAbbr,
    total,
    charroName: publicReadString(
      charroObject.name,
      typeof score.charro === "string" ? score.charro : "",
      score.charroName,
      publicEntry.participantName,
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

function resolvePublicScoreCompetition(score = {}, charreada = null) {
  const fromCharreada = charreada ? publicCompetitionFields(charreada) : null;
  if (fromCharreada) return fromCharreada;
  const context = resolvePublicCompetitionContext(score);
  return {
    competitionType: context.competitionType,
    competitionScope: context.competitionScope,
    competitionId: context.competitionId,
    category: publicReadString(score.category, score.categoria),
    participantScope: context.competitionScope === "individual" ? "individual" : "team"
  };
}

function resolvePublicScoreEntry({ score = {}, teamId = "", team = null, charreada = null, scoreCompetition = {} } = {}) {
  const teamObject = score.team && typeof score.team === "object" ? score.team : {};
  const participant = scoreCompetition.competitionScope === "individual"
    ? findPublicParticipant(charreada, teamId, score)
    : null;

  if (scoreCompetition.competitionScope === "individual") {
    const participantId = publicReadString(
      score.participantId,
      teamObject.participantId,
      participant?.participantId,
      teamId
    );
    const participantName = publicReadString(
      score.participantName,
      teamObject.participantName,
      participant?.participantName,
      score.charroName,
      typeof score.charro === "string" ? score.charro : "",
      participantId
    );
    return {
      teamId: participantId,
      teamName: participantName,
      participantId,
      participantName,
      association: publicReadString(score.association, teamObject.association, participant?.association),
      horseName: publicReadString(score.horseName, teamObject.horseName, participant?.horseName)
    };
  }

  return {
    teamId,
    teamName: publicReadString(teamObject.name, teamObject.nombre, score.teamName, score.equipo, team?.teamName, team?.name, teamId),
    participantId: "",
    participantName: "",
    association: "",
    horseName: ""
  };
}

function findPublicParticipant(charreada = null, entryId = "", score = {}) {
  const candidates = charreada?.individualParticipants || [];
  const participantId = publicReadString(score.participantId, score.teamId, entryId);
  const participantName = publicReadString(score.participantName, score.charroName, typeof score.charro === "string" ? score.charro : "");
  return candidates.find((participant) => participant.participantId === participantId) ||
    candidates.find((participant) => participant.participantName === participantName) ||
    null;
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
    const teamScores = normalizedScores.filter((score) => publicScoreMatchesEntry(score, team));
    return cleanUndefined({
      competitionType: team.competitionType || "equipos_completo",
      competitionScope: team.competitionScope || "team",
      competitionId: team.competitionId || team.competitionType || "equipos_completo",
      category: team.category || "",
      participantScope: team.participantScope || "team",
      teamId: team.teamId,
      name: team.teamName || team.name || team.teamId,
      teamName: team.teamName || team.name || team.teamId,
      participantId: team.participantId || "",
      participantName: team.participantName || "",
      association: team.association || "",
      horseName: team.horseName || "",
      abbreviation: team.abbreviation || "",
      logo: team.logo || "",
      total: sumPublicScores(teamScores)
    });
  });
}

function buildActiveCharreadaPublic({ charreada, source = {}, normalizedScores = [] } = {}) {
  if (!charreada) return null;
  const meta = source.meta || {};
  const activeEntries = getPublicCharreadaEntries(charreada);
  const currentTeam = activeEntries[publicReadNumber(meta.scoringTeamIdx, 0)] || null;
  const currentSuerte = getPublicCharreadaSuerte(charreada, publicReadNumber(meta.scoringSuerteIdx, 0));
  return {
    id: charreada.charreadaId,
    nombre: charreada.nombre,
    fecha: charreada.fecha,
    hora: charreada.hora,
    phase: charreada.phase || "",
    competitionType: charreada.competitionType,
    competitionScope: charreada.competitionScope,
    competitionId: charreada.competitionId,
    category: charreada.category || "",
    suerteIds: charreada.suerteIds,
    participantScope: charreada.participantScope,
    participantsCount: charreada.participantsCount,
    teamsCount: charreada.teamsCount,
    equipos: activeEntries.map((entry) => cleanUndefined({
      ...entry,
      total: sumPublicScores(normalizedScores.filter((score) => score.charreadaId === charreada.charreadaId && publicScoreMatchesEntry(score, entry)))
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
  const teamsByKey = new Map(teams.map((team) => [publicEntryKey(team), team]));
  const scoreTeamIds = [...new Set(normalizedScores
    .filter((score) => score.charreadaId === activeCharreada.charreadaId)
    .map((score) => score.teamId)
    .filter(Boolean))];
  const activeEntries = getPublicCharreadaEntries(activeCharreada);
  const entries = activeEntries.length
    ? activeEntries
    : scoreTeamIds.map((teamId) => publicEntryFromScore({
      teamId,
      teamName: teamId,
      ...publicCompetitionFields(activeCharreada)
    }));
  return entries.map((entry, order) => {
    const team = teamsByKey.get(publicEntryKey(entry)) || entry;
    const teamScores = normalizedScores.filter((score) => score.charreadaId === activeCharreada.charreadaId && publicScoreMatchesEntry(score, team));
    const lastScore = teamScores.slice().sort((a, b) => publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))[0] || null;
    return {
      ...publicCompetitionFields(team),
      teamId: team.teamId,
      teamName: team.teamName || team.name,
      participantId: team.participantId || "",
      participantName: team.participantName || "",
      association: team.association || "",
      horseName: team.horseName || "",
      total: sumPublicScores(teamScores),
      lastSuerte: lastScore?.suerteAbbr || "",
      updatedAt: lastScore?.updatedAt || "",
      _order: order
    };
  })
    .sort((a, b) => b.total - a.total || a._order - b._order)
    .map((row, index) => cleanUndefined({
      position: index + 1,
      competitionType: row.competitionType,
      competitionScope: row.competitionScope,
      competitionId: row.competitionId,
      category: row.category,
      participantScope: row.participantScope,
      teamId: row.teamId,
      teamName: row.teamName,
      participantId: row.participantId,
      participantName: row.participantName,
      association: row.association,
      horseName: row.horseName,
      total: row.total,
      lastSuerte: row.lastSuerte,
      updatedAt: row.updatedAt
    }));
}

function buildGeneralRankingPublic({ teams = [], normalizedScores = [] } = {}) {
  return teams.map((team, order) => {
    const teamScores = normalizedScores.filter((score) => publicScoreMatchesEntry(score, team));
    const charreadasTerminadas = new Set(teamScores.map((score) => score.charreadaId).filter(Boolean)).size;
    const lastScore = teamScores.slice().sort((a, b) => publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))[0] || null;
    return {
      teamId: team.teamId,
      teamName: team.teamName || team.name,
      participantId: team.participantId || "",
      participantName: team.participantName || "",
      association: team.association || "",
      horseName: team.horseName || "",
      ...publicCompetitionFields(team),
      total: sumPublicScores(teamScores),
      charreadasTerminadas,
      updatedAt: lastScore?.updatedAt || "",
      _order: order
    };
  })
    .sort((a, b) => b.total - a.total || a._order - b._order)
    .map((row, index) => cleanUndefined({
      position: index + 1,
      competitionType: row.competitionType,
      competitionScope: row.competitionScope,
      competitionId: row.competitionId,
      category: row.category,
      participantScope: row.participantScope,
      teamId: row.teamId,
      teamName: row.teamName,
      participantId: row.participantId,
      participantName: row.participantName,
      association: row.association,
      horseName: row.horseName,
      total: row.total,
      charreadasTerminadas: row.charreadasTerminadas,
      updatedAt: row.updatedAt
    }));
}

function buildScoreSheetPublic({ teams = [], normalizedScores = [], generalRanking = [] } = {}) {
  const rankByTeam = new Map(generalRanking.map((row) => [publicEntryKey(row), row.position]));
  return teams.map((team) => {
    const row = {
      position: rankByTeam.get(publicEntryKey(team)) || 0,
      competitionType: team.competitionType || "equipos_completo",
      competitionScope: team.competitionScope || "team",
      competitionId: team.competitionId || team.competitionType || "equipos_completo",
      category: team.category || "",
      participantScope: team.participantScope || "team",
      teamId: team.teamId,
      teamName: team.teamName || team.name,
      participantId: team.participantId || "",
      participantName: team.participantName || "",
      association: team.association || "",
      horseName: team.horseName || "",
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
    const teamScores = normalizedScores.filter((score) => publicScoreMatchesEntry(score, team));
    teamScores
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
  const scoresByCompetition = new Map();
  normalizedScores.forEach((score) => {
    const competitionId = score.competitionId || score.competitionType || "equipos_completo";
    if (!scoresByCompetition.has(competitionId)) scoresByCompetition.set(competitionId, []);
    scoresByCompetition.get(competitionId).push(score);
  });

  return Object.fromEntries([...scoresByCompetition.entries()].map(([competitionId, scores]) => [
    competitionId,
    Object.fromEntries(PUBLIC_SUERTES.map((suerte) => {
      const leader = scores
        .filter((score) => score.suerteAbbr === suerte.key)
        .sort((a, b) => Number(b.total || 0) - Number(a.total || 0) || publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))[0];
      return [suerte.key, leader ? cleanUndefined({
        competitionType: leader.competitionType,
        competitionScope: leader.competitionScope,
        competitionId: leader.competitionId,
        category: leader.category,
        suerte: suerte.key,
        label: suerte.label,
        charro: leader.charroName || leader.participantName || "Charro no registrado",
        team: {
          teamId: leader.teamId,
          name: leader.teamName
        },
        participantId: leader.participantId || "",
        participantName: leader.participantName || "",
        association: leader.association || "",
        horseName: leader.horseName || "",
        score: Number(leader.total || 0),
        updatedAt: leader.updatedAt || ""
      }) : null];
    }))
  ]));
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
        competitionType: charreada.competitionType,
        competitionScope: charreada.competitionScope,
        competitionId: charreada.competitionId,
        category: charreada.category || "",
        participantScope: charreada.participantScope,
        suerteIds: charreada.suerteIds,
        phase: charreada.phase || null,
        equipos: charreada.equipos,
        individualParticipants: charreada.individualParticipants,
        participantsCount: charreada.participantsCount,
        teamsCount: charreada.teamsCount,
        status: charreada.status
      };
    });
}

function buildLastScoresPublic({ normalizedScores = [] } = {}) {
  return normalizedScores.slice()
    .sort((a, b) => publicDateValue(b.updatedAt) - publicDateValue(a.updatedAt))
    .slice(0, 30)
    .map((score) => cleanUndefined({
      competitionType: score.competitionType,
      competitionScope: score.competitionScope,
      competitionId: score.competitionId,
      category: score.category,
      participantScope: score.participantScope,
      team: {
        teamId: score.teamId,
        name: score.teamName
      },
      participantId: score.participantId || "",
      participantName: score.participantName || "",
      association: score.association || "",
      horseName: score.horseName || "",
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
    competitionId: score.competitionId,
    competitionType: score.competitionType,
    teamId: score.teamId,
    participantId: score.participantId,
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

function getPublicCharreadaSuerte(charreada = {}, index = 0) {
  const suerteIds = Array.isArray(charreada.suerteIds) && charreada.suerteIds.length
    ? charreada.suerteIds
    : getCompetitionType(charreada.competitionType || "equipos_completo").suerteIds;
  const suerteId = suerteIds[Math.max(0, Number(index || 0))] || suerteIds[0] || "";
  const columns = publicSuerteIdsToColumns([suerteId]).filter((column) => column !== "TOTAL");
  const key = columns[0] || normalizeSuerteAbbr(suerteId);
  return key ? { key, nombre: getPublicSuerteLabel(key) } : null;
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

async function getFirebaseBroadcastAuthenticatedUser() {
  const auth = getFirebaseAuth();
  if (typeof auth.authStateReady === "function") await auth.authStateReady();
  return auth.currentUser;
}

function getFirebaseFunctions() {
  if (!appInstance) appInstance = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  if (!functionsInstance) functionsInstance = getFunctions(appInstance, "us-central1");
  return functionsInstance;
}

async function resolveFirebaseBroadcastAccess(context, operation = "read") {
  const user = await getFirebaseBroadcastAuthenticatedUser();
  if (!user?.uid) throw firebaseBroadcastError("broadcast-auth-required");
  const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${user.uid}`));
  const profile = profileSnapshot.val() || {};
  const tournamentAssigned = await readFirebaseBroadcastTournamentAssignment(profile, user.uid, context.tournamentId);
  return validateFirebaseBroadcastProfileAccess(profile, user.uid, context, operation, { tournamentAssigned });
}

function validateFirebaseBroadcastProfileAccess(profile, uid, context, operation = "read", options = {}) {
  if (profile.active !== true) throw firebaseBroadcastError("broadcast-user-inactive");
  const role = normalizeRole(profile.role);
  const readRoles = new Set(["supervisor", "graficos"]);
  const publishRoles = new Set(["supervisor", "graficos"]);
  if (operation === "publish" ? !publishRoles.has(role) : !readRoles.has(role)) {
    throw firebaseBroadcastError("broadcast-permission-denied");
  }
  if (context.tenantId !== BROADCAST_SINGLE_TENANT_SCOPE_ID || context.organizationId !== null || context.clientId !== null) {
    throw firebaseBroadcastError("broadcast-single-tenant-context-conflict");
  }
  if (!firebaseProfileHasTournamentAccess(profile, context.tournamentId, options.tournamentAssigned)) {
    throw firebaseBroadcastError("broadcast-tournament-access-denied");
  }
  return {
    uid,
    role,
    operation: operation === "publish" ? "publish" : "read",
    tenantId: BROADCAST_SINGLE_TENANT_SCOPE_ID,
    organizationId: null,
    clientId: null,
    tournamentId: context.tournamentId
  };
}

async function readFirebaseBroadcastTournamentAssignment(profile, uid, tournamentId) {
  if (profile?.tournamentAccess !== "selected") return true;
  const snapshot = await get(ref(getFirebaseDatabase(), `charropro/userTournamentAccess/${uid}/${tournamentId}`));
  return snapshot.val() === true;
}

function firebaseProfileHasTournamentAccess(profile, tournamentId, tournamentAssigned = false) {
  if (profile.tournamentAccess !== "selected") return true;
  if (tournamentAssigned === true) return true;
  const ids = Array.isArray(profile.tournamentIds)
    ? profile.tournamentIds
    : Array.isArray(profile.assignedTournamentIds) ? profile.assignedTournamentIds : [];
  return ids.map((id) => String(id || "").trim()).includes(tournamentId);
}

async function ensureFirebaseBroadcastSessionContext(sessionPath, context, access) {
  let conflict = false;
  const contextRef = ref(getFirebaseDatabase(), `${sessionPath}/context`);
  const result = await runTransaction(contextRef, (current) => {
    if (!current) {
      const now = new Date().toISOString();
      return { ...context, status: "active", revision: 1, createdAt: now, updatedAt: now, createdByUid: access.uid };
    }
    if (!sameFirebaseBroadcastContext(current, context)) {
      conflict = true;
      return;
    }
    if (current.status === "closed") {
      return {
        ...current,
        status: "active",
        revision: Number(current.revision || 0) + 1,
        updatedAt: new Date().toISOString()
      };
    }
    return current;
  }, { applyLocally: false });
  if (conflict || !result.committed && !result.snapshot.exists()) throw firebaseBroadcastError("broadcast-session-context-conflict");
}

async function validateExistingFirebaseBroadcastSessionContext(sessionPath, context, operation) {
  const snapshot = await get(ref(getFirebaseDatabase(), `${sessionPath}/context`));
  if (!snapshot.exists()) {
    if (operation === "read") throw firebaseBroadcastError("broadcast-session-not-initialized");
    return;
  }
  if (!sameFirebaseBroadcastContext(snapshot.val() || {}, context)) {
    throw firebaseBroadcastError("broadcast-session-context-conflict");
  }
}

async function setFirebaseBroadcastSessionStatus(value, status, options = {}) {
  const context = normalizeFirebaseBroadcastContext(value);
  await resolveFirebaseBroadcastAccess(context, "publish");
  const sessionPath = getFirebaseBroadcastSessionPath(context.sessionId);
  const session = await readFirebaseBroadcastSessionContext(context);
  if (!session.exists) {
    return Object.freeze({
      ...context,
      status: "not-found",
      revision: 0,
      alreadyClosed: false
    });
  }
  if (session.value.status === status) {
    return Object.freeze({
      ...context,
      status,
      revision: Number(session.value.revision || 0),
      alreadyClosed: status === "closed"
    });
  }
  let conflict = null;
  const baseline = cloneFirebaseBroadcastValue(session.value);
  const result = await runTransaction(ref(getFirebaseDatabase(), `${sessionPath}/context`), (current) => {
    const source = current || baseline;
    if (!sameFirebaseBroadcastContext(source, context)) {
      conflict = "broadcast-session-context-conflict";
      return;
    }
    return {
      ...source,
      status,
      revision: Number(source.revision || 0) + 1,
      updatedAt: options.now ? new Date(options.now).toISOString() : new Date().toISOString()
    };
  }, { applyLocally: false });
  if (conflict || !result.committed) throw firebaseBroadcastError(conflict || "broadcast-session-status-update-failed");
  const next = result.snapshot.val() || {};
  return Object.freeze({
    ...normalizeFirebaseBroadcastContext(next),
    status: next.status,
    revision: Number(next.revision || 0),
    alreadyClosed: false
  });
}

async function readFirebaseBroadcastSessionContext(context) {
  const sessionPath = getFirebaseBroadcastSessionPath(context.sessionId);
  const snapshot = await get(ref(getFirebaseDatabase(), `${sessionPath}/context`));
  if (!snapshot.exists()) return { exists: false, value: null };
  const value = snapshot.val() || {};
  if (!sameFirebaseBroadcastContext(value, context)) {
    throw firebaseBroadcastError("broadcast-session-context-conflict");
  }
  return { exists: true, value };
}

async function revokeAllFirebaseBroadcastTemporaryAccess(context, options = {}) {
  const sessionPath = getFirebaseBroadcastSessionPath(context.sessionId);
  const accessRoot = ref(getFirebaseDatabase(), `${sessionPath}/access`);
  const snapshot = await get(accessRoot);
  const updates = {};
  for (const [accessId, entry] of Object.entries(snapshot.val() || {})) {
    const descriptor = entry?.descriptor;
    if (!descriptor || descriptor.status !== "active") continue;
    updates[`${accessId}/descriptor`] = cloneFirebaseBroadcastValue(
      revokeBroadcastTemporaryAccessDescriptor(descriptor, { now: options.now })
    );
  }
  if (Object.keys(updates).length) await update(accessRoot, updates);
}

async function publishFirebaseBroadcastTemporaryAccessCopies(sessionPath, channel, envelope) {
  const cleanChannel = channel === "announcer" ? "announcer" : "program";
  const outputType = cleanChannel === "program" ? "program_main" : "announcer_monitor";
  const accessRoot = ref(getFirebaseDatabase(), `${sessionPath}/access`);
  const snapshot = await get(accessRoot);
  const updates = {};
  for (const [accessId, entry] of Object.entries(snapshot.val() || {})) {
    const descriptor = entry?.descriptor;
    if (descriptor?.outputType !== outputType || !isBroadcastTemporaryAccessActive(descriptor)) continue;
    if (!sameFirebaseBroadcastAccessContext(descriptor.context, envelope?.context)) continue;
    const publicEnvelope = cloneFirebaseBroadcastValue(envelope);
    publicEnvelope.context = cloneFirebaseBroadcastValue(descriptor.context);
    updates[`${accessId}/${cleanChannel}/current`] = publicEnvelope;
  }
  if (Object.keys(updates).length) await update(accessRoot, updates);
}

function normalizeFirebaseBroadcastOutputType(value) {
  const outputType = String(value || "").trim().toLowerCase();
  if (!BROADCAST_TEMPORARY_ACCESS_TYPES.has(outputType)) {
    throw firebaseBroadcastError("broadcast-temporary-access-output-invalid");
  }
  return outputType;
}

function sameFirebaseBroadcastAccessContext(left = {}, right = {}) {
  return ["tournamentId", "competitionId", "activeCharreadaId", "sessionId"]
    .every((key) => (left[key] || null) === (right[key] || null));
}

function cloneFirebaseBroadcastValue(value) {
  return typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : cleanUndefined(value);
}

function encodeFirebaseBroadcastValue(value) {
  if (Array.isArray(value)) return value.map(encodeFirebaseBroadcastValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key.replace(/[~.#$/\[\]]/g, (character) => `~${character.codePointAt(0).toString(16).padStart(2, "0")}`),
    encodeFirebaseBroadcastValue(child)
  ]));
}

function decodeFirebaseBroadcastValue(value) {
  if (Array.isArray(value)) return value.map(decodeFirebaseBroadcastValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key.replace(/~([0-9a-f]{2})/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16))),
    decodeFirebaseBroadcastValue(child)
  ]));
}

async function publishFirebaseBroadcastValue(path, value, options = {}) {
  const expectedRevision = options.expectedRevision;
  const idempotencyKey = normalizeBroadcastContextId(options.idempotencyKey);
  let conflict = null;
  let duplicate = false;
  const targetRef = ref(getFirebaseDatabase(), path);
  const baselineSnapshot = await get(targetRef);
  const baseline = baselineSnapshot.val();
  const result = await runTransaction(targetRef, (current) => {
    const source = current || baseline;
    const currentRevision = Number(source?.revision || 0);
    if (expectedRevision !== undefined && Number(expectedRevision) !== currentRevision) {
      conflict = "broadcast-revision-conflict";
      return;
    }
    if (idempotencyKey && source?.idempotencyKey === idempotencyKey) {
      if (source?.messageId === value?.messageId) duplicate = true;
      else conflict = "broadcast-idempotency-conflict";
      return;
    }
    return cleanUndefined(value);
  }, { applyLocally: false });
  if (duplicate) return { ok: true, duplicate: true, revision: Number(result.snapshot.val()?.revision || value?.revision || 0) };
  if (conflict) throw firebaseBroadcastError(conflict);
  if (!result.committed) throw firebaseBroadcastError("broadcast-publish-aborted");
  return { ok: true, revision: Number(result.snapshot.val()?.revision || value?.revision || 0) };
}

async function updateFirebaseBroadcastRevision(sessionPath, channel, revision, context) {
  const cleanChannel = channel === "announcer" ? "announcer" : "program";
  await set(ref(getFirebaseDatabase(), `${sessionPath}/revisions/${cleanChannel}`), {
    revision: Number(revision || 0),
    context,
    updatedAt: new Date().toISOString()
  });
}

function normalizeFirebaseBroadcastContext(value = {}, options = {}) {
  const context = {
    tenantId: normalizeBroadcastContextId(value.tenantId),
    organizationId: normalizeBroadcastOptionalContextId(value.organizationId),
    clientId: normalizeBroadcastOptionalContextId(value.clientId),
    tournamentId: normalizeBroadcastContextId(value.tournamentId),
    competitionId: normalizeBroadcastOptionalContextId(value.competitionId),
    activeCharreadaId: normalizeBroadcastOptionalContextId(value.activeCharreadaId || value.charreadaId),
    sessionId: normalizeBroadcastContextId(value.sessionId)
  };
  if ((options.requireTenant !== false && !context.tenantId) || !context.tournamentId || !context.sessionId) {
    throw firebaseBroadcastError("broadcast-context-missing");
  }
  return context;
}

function normalizeFirebaseBroadcastRequestContext(value = {}) {
  for (const key of ["tenantId", "organizationId", "clientId"]) {
    if (value?.[key] !== undefined && value?.[key] !== null && value?.[key] !== "") {
      throw firebaseBroadcastError("broadcast-external-identity-forbidden");
    }
  }
  const context = {
    tournamentId: normalizeBroadcastContextId(value.tournamentId),
    competitionId: normalizeBroadcastOptionalContextId(value.competitionId),
    activeCharreadaId: normalizeBroadcastOptionalContextId(value.activeCharreadaId || value.charreadaId),
    sessionId: normalizeBroadcastContextId(value.sessionId)
  };
  if (!context.tournamentId) throw firebaseBroadcastError("broadcast-context-missing");
  return context;
}

function sameFirebaseBroadcastContext(left = {}, right = {}) {
  return ["tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "activeCharreadaId", "sessionId"]
    .every((key) => (left[key] || null) === (right[key] || null));
}

function requireFirebaseBroadcastSessionPath(path, sessionId) {
  const expected = getFirebaseBroadcastSessionPath(sessionId);
  if (!expected || path !== expected) throw firebaseBroadcastError("broadcast-session-path-invalid");
  return expected;
}

function requireConnectedFirebaseBroadcastAdapterContext(connectedContext, requestedContext = connectedContext) {
  if (!connectedContext || !requestedContext || !sameFirebaseBroadcastContext(connectedContext, requestedContext)) {
    throw firebaseBroadcastError("broadcast-adapter-context-conflict");
  }
  return getFirebaseBroadcastSessionPath(connectedContext.sessionId);
}

function requireFirebaseBroadcastPath(path, sessionPath = "") {
  const clean = String(path || "").trim().replace(/^\/+|\/+$/g, "");
  const base = sessionPath || BROADCAST_STUDIO_SESSIONS_PATH;
  if (!clean.startsWith(`${base}/`) && clean !== base) throw firebaseBroadcastError("broadcast-path-outside-namespace");
  if (/\/(?:scores|publishedScores|audit|live|publicTournaments)(?:\/|$)/i.test(clean)) {
    throw firebaseBroadcastError("broadcast-sports-path-forbidden");
  }
  return clean;
}

function normalizeBroadcastContextId(value) {
  const clean = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(clean) ? clean : "";
}

function normalizeBroadcastOptionalContextId(value) {
  if (value === null || value === undefined || value === "") return null;
  const clean = normalizeBroadcastContextId(value);
  if (!clean) throw firebaseBroadcastError("broadcast-context-id-invalid");
  return clean;
}

function normalizeFirebaseBroadcastError(error) {
  return {
    code: String(error?.code || "broadcast-firebase-error"),
    message: String(error?.message || "broadcast-firebase-error").slice(0, 300)
  };
}

function firebaseBroadcastError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function compactLivePayload(payload = {}) {
  return cleanUndefined({
    action: payload.action || "update_live_graphics",
    timestamp: payload.timestamp || new Date().toISOString(),
    firebaseUpdatedAt: Date.now(),
    liveChannel: normalizeLiveChannel(payload.liveChannel || payload.tournament?.liveChannel || payload.tournament?.id),
    ...compactProductionFields(payload),
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
    category: charreada.category || "",
    competitionType: charreada.competitionType || "",
    competitionScope: charreada.competitionScope || "",
    competitionId: charreada.competitionId || charreada.competitionType || "",
    competitionName: charreada.competitionName || "",
    suerteIds: Array.isArray(charreada.suerteIds) ? charreada.suerteIds : [],
    status: charreada.status || "",
    teamIds: charreada.teamIds || []
  };
}

function compactTurn(turn) {
  if (!turn) return null;
  const suerte = turn.suerte || {};
  return {
    team: compactTeam(turn.team),
    participant: turn.participant || null,
    competition: turn.competition || null,
    participantScope: turn.participantScope || "",
    currentTurnId: turn.currentTurnId || "",
    currentTurnName: turn.currentTurnName || "",
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
    logo: team.logo || team.logoUrl || "",
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
	    competition: score.competition || null,
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

function compactProductionFields(payload = {}) {
  return cleanUndefined({
    tournamentId: payload.tournamentId || payload.tournament?.id || "",
    tournamentName: payload.tournamentName || payload.tournament?.name || "",
    activeCharreadaId: payload.activeCharreadaId || payload.charreadaId || payload.charreada?.id || "",
    charreadaId: payload.charreadaId || payload.charreada?.id || "",
    charreadaName: payload.charreadaName || payload.charreada?.name || "",
    competitionType: payload.competitionType || payload.broadcastContext?.competition?.type || "equipos_completo",
    competitionScope: payload.competitionScope || payload.broadcastContext?.competition?.scope || "team",
    competitionId: payload.competitionId || payload.broadcastContext?.competition?.id || "equipos_completo",
    competitionName: payload.competitionName || payload.broadcastContext?.competition?.name || "Competencia por equipos",
    category: payload.category || payload.broadcastContext?.competition?.category || "",
    phase: payload.phase || payload.broadcastContext?.competition?.phase || "",
    participantScope: payload.participantScope || payload.broadcastContext?.competition?.participantScope || "team",
    participantId: payload.participantId,
    participantName: payload.participantName || "",
    teamId: payload.teamId,
    teamName: payload.teamName,
    association: payload.association || "",
    horseName: payload.horseName || "",
    suerteId: payload.suerteId || payload.broadcastContext?.suerte?.id || "",
    suerteName: payload.suerteName || payload.broadcastContext?.suerte?.name || "",
    suerteIds: Array.isArray(payload.suerteIds) ? payload.suerteIds : payload.broadcastContext?.competition?.suerteIds || [],
    currentTurnId: payload.currentTurnId || payload.broadcastContext?.production?.currentTurnId || "",
    currentTurnName: payload.currentTurnName || payload.broadcastContext?.production?.currentTurnName || "",
    scoreId: payload.scoreId || "",
    basePoints: payload.basePoints ?? null,
    additionalPoints: payload.additionalPoints ?? null,
    infractions: payload.infractions ?? null,
    penalties: payload.penalties ?? null,
    totalPoints: payload.totalPoints ?? null,
    time: payload.time ?? null,
    attempts: payload.attempts ?? null,
    scoreStatus: payload.scoreStatus ?? null,
    scoreTimestamp: payload.scoreTimestamp ?? null,
    scoreDetail: payload.scoreDetail || null,
    broadcastContext: payload.broadcastContext || null,
    broadcastContract: payload.broadcastContract || null,
    broadcastState: payload.broadcastState || null
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
