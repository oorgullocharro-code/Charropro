import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "./configurationBootstrap.js";
import {
  buildFirebaseEmulatorConnectionPlan,
  getFirebaseRuntimePublicDiagnostics,
  resolveFirebaseRuntime
} from "./firebaseRuntime.js?v=20260825-user-access-bootstrap-001-v1";
import {
  COMPETITION_TYPES,
  getCompetitionType,
  getCompetitionTypeFromTournamentType
} from "../data/competitionTypes.js?v=20260825-user-access-bootstrap-001-v1";
import { makeAccessSession, normalizeRole, normalizeTournamentAccess } from "./roles.js?v=20260825-user-access-bootstrap-001-v1";
import {
  USER_ACCESS_BOOTSTRAP_ERROR,
  buildUserAccessBootstrapPlan,
  diagnoseUserAccessBootstrap,
  readUserAccessBootstrapTournaments
} from "./userAccessBootstrap.js?v=20260825-user-access-bootstrap-001-v1";
import { normalizeScoringButtonLayouts } from "../data/defaultScoringButtonLayouts.js?v=20260825-user-access-bootstrap-001-v1";
import {
  BROADCAST_SINGLE_TENANT_SCOPE_ID,
  buildBroadcastAutomaticSessionId,
  createBroadcastTemporaryAccessDescriptor,
  isBroadcastTemporaryAccessActive,
  revokeBroadcastTemporaryAccessDescriptor,
  validateBroadcastTemporaryAccessDescriptor
} from "../broadcast/broadcastRealtimeTransport.js?v=20260825-user-access-bootstrap-001-v1";
import {
  buildPublicProjection,
  getPublicProjectionSignature,
  reconcilePublicProjection
} from "../public/publicProjection.js?v=20260825-user-access-bootstrap-001-v1";
import {
  adaptPublicProjectionToLegacyLive
} from "../public/publicProjectionLegacyAdapter.js?v=20260825-user-access-bootstrap-001-v1";
import {
  diagnosePublicProjectionFirebaseCompatibility,
  normalizePublicProjectionForFirebase,
  validatePublicProjection
} from "../public/publicProjectionSchema.js?v=20260825-user-access-bootstrap-001-v1";
import {
  PUBLIC_PROJECTION_LEASE_MS,
  PUBLIC_PROJECTION_MAX_ATTEMPTS,
  PUBLIC_PROJECTION_STATUSES,
  buildPublicProjectionFailureState,
  buildPublicProjectionOutboxSnapshot,
  buildPublicProjectionState,
  claimPublicProjectionState,
  comparePublicProjectionJobs,
  isPublicProjectionJobEligible,
  normalizePublicProjectionJob,
  normalizePublicProjectionState,
  sanitizeProjectionActor,
  sanitizeProjectionErrorCode,
  sanitizeProjectionErrorMessage
} from "./publicProjectionOutbox.js?v=20260825-user-access-bootstrap-001-v1";
import {
  normalizePendingScoreReview,
  validatePendingScoreReview
} from "./pendingScoreReview.js?v=20260825-user-access-bootstrap-001-v1";
import {
  applyOfficialTimerCommand,
  applyOfficialTimerControlOperation,
  buildOfficialTimerProjection,
  createOfficialTimerContext,
  normalizeOfficialTimerContext
} from "./timerRules.js?v=20260825-user-access-bootstrap-001-v1";

const CONFIGURATION_BOOTSTRAP = await loadConfigurationBootstrap();
const FIREBASE_RUNTIME = resolveFirebaseRuntime({
  location: globalThis.location,
  bootstrap: {
    sdkVersion: requireConfigurationValue("firebase.sdkVersion"),
    functionsRegion: requireConfigurationValue("firebase.functionsRegion"),
    client: requireConfigurationValue("firebase.client")
  }
});
const FIREBASE_SDK_VERSION = FIREBASE_RUNTIME.sdkVersion;
const FIREBASE_SDK_ROOT = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
const [firebaseAppApi, firebaseAuthApi, firebaseDatabaseApi, firebaseFunctionsApi] = await Promise.all([
  import(`${FIREBASE_SDK_ROOT}/firebase-app.js`),
  import(`${FIREBASE_SDK_ROOT}/firebase-auth.js`),
  import(`${FIREBASE_SDK_ROOT}/firebase-database.js`),
  import(`${FIREBASE_SDK_ROOT}/firebase-functions.js`)
]);
const { getApps, initializeApp } = firebaseAppApi;
const { connectAuthEmulator, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } = firebaseAuthApi;
const { connectDatabaseEmulator, get, getDatabase, onValue, push, ref, runTransaction, set, update } = firebaseDatabaseApi;
const { connectFunctionsEmulator, getFunctions, httpsCallable } = firebaseFunctionsApi;
const FIREBASE_CONFIG = Object.freeze({ ...FIREBASE_RUNTIME.firebaseConfig });
const FIREBASE_FUNCTIONS_REGION = FIREBASE_RUNTIME.functionsRegion;
const LIVE_ROOT_PATH = requireConfigurationValue("firebase.paths.live");
const PUBLIC_TOURNAMENTS_PATH = requireConfigurationValue("firebase.paths.publicTournaments");
const TOURNAMENT_INDEX_PATH = requireConfigurationValue("firebase.paths.tournamentIndex");
const TOURNAMENTS_PATH = requireConfigurationValue("firebase.paths.tournaments");
const USERS_PATH = requireConfigurationValue("firebase.paths.users");
const GLOBAL_RULE_OVERRIDES_PATH = requireConfigurationValue("firebase.paths.globalRuleOverrides");
const GLOBAL_SCORING_BUTTON_LAYOUTS_PATH = requireConfigurationValue("firebase.paths.scoringButtonLayouts");
const JUDGE_SESSIONS_PATH = requireConfigurationValue("firebase.paths.judgeSessions");
const JUDGE_EVENTS_PATH = requireConfigurationValue("firebase.paths.judgeEvents");
const AUDIT_PUBLISHED_SCORES_PATH = requireConfigurationValue("firebase.paths.auditPublishedScores");
const PUBLIC_PROJECTION_OUTBOX_PATH = requireConfigurationValue("firebase.paths.projectionOutbox");
const HISTORY_STATISTICS_PATH = requireConfigurationValue("firebase.paths.historyStatistics");
const BROADCAST_STUDIO_SESSIONS_PATH = requireConfigurationValue("firebase.paths.broadcastStudioSessions");
const RULE_PROFILE_ASSIGNMENT_FIELDS = new Set([
  "ruleProfileId",
  "ruleProfileVersion",
  "ruleProfileStatus",
  "ruleProfileContentFingerprint",
  "ruleProfileAssignmentRevision",
  "ruleProfileAssignment"
]);
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
let localEmulatorConnections = null;
let publicSnapshotBuildCount = 0;
let publicSnapshotPublishCount = 0;
let publicSnapshotSetCount = 0;

function requireConfigurationValue(path) {
  const value = getBootstrapConfigurationValue(CONFIGURATION_BOOTSTRAP, path, undefined);
  if (value === undefined || value === null || value === "") {
    throw new Error(`configuration-bootstrap-required:${path}`);
  }
  return value;
}

export function isFirebaseLiveConfigured() {
  return Boolean(FIREBASE_CONFIG.databaseURL);
}

export async function readFirebaseConfiguration(request = {}) {
  const callable = httpsCallable(getFirebaseFunctions(), "getCharroProConfiguration");
  const response = await callable(cloneFirebaseBroadcastValue(request));
  return cloneFirebaseBroadcastValue(response?.data || {});
}

export async function publishFirebaseConfiguration(request = {}) {
  const callable = httpsCallable(getFirebaseFunctions(), "publishCharroProConfiguration");
  const response = await callable(cloneFirebaseBroadcastValue(request));
  return cloneFirebaseBroadcastValue(response?.data || {});
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
  const input = normalizeFirebaseBroadcastRequestContext(value, { allowMissingTournament: true });
  const operation = options.operation === "publish" ? "publish" : "read";
  const user = await getFirebaseBroadcastAuthenticatedUser();
  if (!user?.uid) throw firebaseBroadcastError("broadcast-auth-required");
  const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${user.uid}`));
  const profile = profileSnapshot.val() || {};
  validateFirebaseBroadcastProfileEligibility(profile, operation);
  const selectedTournamentId = input.tournamentId || await resolveFirebaseBroadcastActiveTournamentId(profile, user.uid);
  const tournamentAssigned = await readFirebaseBroadcastTournamentAssignment(profile, user.uid, selectedTournamentId);
  const tournamentSnapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${selectedTournamentId}`));
  if (!tournamentSnapshot.exists()) throw firebaseBroadcastError("broadcast-context-unavailable");
  const tournament = tournamentSnapshot.val() || {};
  const officialTournamentId = normalizeBroadcastContextId(tournament.info?.id || selectedTournamentId);
  if (officialTournamentId !== selectedTournamentId) throw firebaseBroadcastError("broadcast-context-mismatch");
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

export function subscribeFirebaseBroadcastContext(callback, options = {}) {
  if (typeof callback !== "function" || !isFirebaseLiveConfigured()) return () => {};
  const operation = options.operation === "publish" ? "publish" : "read";
  let disposed = false;
  let connected = null;
  let authSession = null;
  let resolveQueue = Promise.resolve();
  let currentContext = null;
  let authUnsubscribe = null;
  let indexUnsubscribe = null;
  let tournamentUnsubscribe = null;
  let liveUnsubscribe = null;
  let connectionUnsubscribe = null;

  const emit = (status, detail = {}) => {
    if (disposed) return;
    callback(Object.freeze({
      status,
      context: detail.context ? Object.freeze(cloneFirebaseBroadcastValue(detail.context)) : null,
      reason: detail.reason || null,
      error: detail.error || null,
      source: detail.source || "firebase-broadcast-context"
    }));
  };
  const clearContextListeners = () => {
    tournamentUnsubscribe?.();
    liveUnsubscribe?.();
    tournamentUnsubscribe = null;
    liveUnsubscribe = null;
  };
  const watchResolvedContext = (context) => {
    const changed = !currentContext || !sameFirebaseBroadcastContext(currentContext, context);
    currentContext = context;
    if (!changed) return;
    clearContextListeners();
    tournamentUnsubscribe = subscribeFirebaseTournamentState(context.tournamentId, (payload = {}) => {
      if (disposed || payload.deleted === true) {
        scheduleResolve("tournament-removed");
        return;
      }
      const nextActiveId = normalizeBroadcastOptionalContextId(payload.activeCharreadaId);
      if (nextActiveId !== context.activeCharreadaId) scheduleResolve("active-charreada-changed");
    });
    liveUnsubscribe = subscribeFirebaseOperationalLiveCurrent(context.tournamentId, (payload, error) => {
      if (disposed) return;
      if (error) {
        emit("offline", { context: currentContext, reason: error.reason || "live-current-unavailable" });
        return;
      }
      if (!payload) return;
      const liveTournamentId = normalizeBroadcastOptionalContextId(
        payload.broadcastContract?.tournament?.id || payload.tournament?.id || payload.liveChannel
      );
      const liveCharreadaId = normalizeBroadcastOptionalContextId(
        payload.broadcastContract?.charreada?.id || payload.charreada?.id || payload.activeCharreadaId
      );
      if (liveTournamentId && liveTournamentId !== context.tournamentId) scheduleResolve("live-tournament-changed");
      else if (liveCharreadaId && liveCharreadaId !== context.activeCharreadaId) scheduleResolve("live-charreada-changed");
    });
  };
  const resolveAndEmit = async (reason) => {
    try {
      const context = await resolveCurrentBroadcastContext({}, { operation });
      if (disposed) return;
      watchResolvedContext(context);
      emit("ready", { context, reason, source: context.source });
    } catch (error) {
      if (disposed) return;
      const status = firebaseBroadcastContextStatusFromError(error);
      if (status === "unauthorized" || status === "no_context") {
        clearContextListeners();
        currentContext = null;
      }
      emit(status, {
        context: status === "offline" ? currentContext : null,
        reason: error?.code || error?.message || "broadcast-context-unavailable",
        error: normalizeFirebaseBroadcastError(error)
      });
    }
  };
  const scheduleResolve = (reason = "context-refresh") => {
    resolveQueue = resolveQueue.then(() => resolveAndEmit(reason));
    return resolveQueue;
  };

  emit("preparing", { reason: "auth-pending" });
  connectionUnsubscribe = onValue(
    ref(getFirebaseDatabase(), ".info/connected"),
    (snapshot) => {
      const nextConnected = snapshot.val() === true;
      if (connected === nextConnected) return;
      connected = nextConnected;
      if (!nextConnected) emit("offline", { context: currentContext, reason: "firebase-disconnected" });
      else if (authSession?.user) scheduleResolve("firebase-reconnected");
    },
    (error) => emit("offline", { context: currentContext, reason: "firebase-connection-error", error: normalizeFirebaseBroadcastError(error) })
  );
  authUnsubscribe = subscribeFirebaseAuthSession((session) => {
    if (disposed) return;
    authSession = session;
    indexUnsubscribe?.();
    indexUnsubscribe = null;
    if (!session?.user) {
      clearContextListeners();
      currentContext = null;
      emit("unauthorized", { reason: "broadcast-auth-required" });
      return;
    }
    if (session.active !== true || !["supervisor", "graficos"].includes(normalizeRole(session.role))) {
      clearContextListeners();
      currentContext = null;
      emit("unauthorized", { reason: session.active !== true ? "broadcast-user-inactive" : "broadcast-permission-denied" });
      return;
    }
    indexUnsubscribe = subscribeFirebaseTournamentIndex(() => scheduleResolve("tournament-index-updated"), session);
    scheduleResolve("auth-restored");
  });

  return () => {
    disposed = true;
    authUnsubscribe?.();
    indexUnsubscribe?.();
    connectionUnsubscribe?.();
    clearContextListeners();
    authUnsubscribe = null;
    indexUnsubscribe = null;
    connectionUnsubscribe = null;
    currentContext = null;
  };
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
    const publicSnapshot = await publishPublicTournamentSnapshot(liveChannel, null, { source: "live" });
    return { ok: true, publicSnapshot };
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
      publishedScoreId: publishedScore?.id || "",
      reason: normalizeFirebaseFailureReason(error)
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
    const now = Number(options.nowMs || Date.now());
    const record = compactPublishedScore({
      ...publishedScore,
      id: publishedScore?.id || createId("publicado")
    });
    if (!record?.attemptKey) return { ok: false, reason: "missing-published-score" };
    const actorRecord = await resolveAuthenticatedProjectionActor(actor);
    if (!actorRecord?.uid) {
      return { ok: false, reason: "official-score-auth-required" };
    }
    const expectedRevision = Math.max(0, Number(record.revision || 1) - 1);
    const operation = getOrCreateOfficialScoreOperation(record, scorePayload, expectedRevision);
    const livePayload = options.livePayload
      ? compactLivePayload({
        ...options.livePayload,
        liveChannel: cleanTournamentId,
        published: record,
        timestamp: new Date(now).toISOString()
      })
      : null;

    console.info("[official-score-concurrency-001] solicitando publicacion oficial", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      attemptKey: record.attemptKey,
      expectedRevision,
      idempotencyKey: operation.idempotencyKey
    });
    notifyOfficialScoreTiming(options, "T4", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId
    });
    const authorityResult = await callOfficialScoreAuthority({
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      scorePayload,
      publishedScore: record,
      expectedRevision: operation.expectedRevision,
      idempotencyKey: operation.idempotencyKey,
      source: "charropro-calificador",
      device: getOfficialScoreDevice(),
      livePayload
    }, options);
    notifyOfficialScoreTiming(options, "T5", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      ok: Boolean(authorityResult?.ok)
    });
    if (!authorityResult?.ok) {
      if (authorityResult?.conflict) clearOfficialScoreOperation(record.attemptKey);
      return {
        ok: false,
        complete: false,
        partialFailure: false,
        conflict: Boolean(authorityResult?.conflict),
        reason: authorityResult?.reason || "official-score-authority-failed",
        revision: Number(authorityResult?.revision || 0),
        expectedRevision: operation.expectedRevision,
        detail: authorityResult?.detail || {}
      };
    }
    clearOfficialScoreOperation(record.attemptKey);
    const canonicalRecord = compactPublishedScore(authorityResult.published || record);
    const publishedScoreId = String(canonicalRecord?.id || authorityResult.id || "").trim();
    const scorePath = authorityResult.scorePath || `${TOURNAMENTS_PATH}/${cleanTournamentId}/scores/${cleanScoreId}`;
    const publishedPath = authorityResult.publishedPath || `${TOURNAMENTS_PATH}/${cleanTournamentId}/publishedScores/${publishedScoreId}`;
    const auditPath = authorityResult.auditPath || `${AUDIT_PUBLISHED_SCORES_PATH}/${cleanTournamentId}/${publishedScoreId}`;
    const livePath = livePayload ? `${LIVE_ROOT_PATH}/${cleanTournamentId}/current` : "";
    const projectionId = String(authorityResult.projectionId || "");
    const projectionOutboxPath = authorityResult.projectionOutboxPath || getFirebasePublicProjectionOutboxJobPath(
      cleanTournamentId,
      projectionId
    );
    const privateWrite = {
      ok: true,
      scorePath,
      publishedPath,
      auditPath,
      livePath: options.livePayload ? livePath : ""
    };
    const reconcileProjection = () => projectionId
      ? reconcileFirebasePublicProjectionOutbox(cleanTournamentId, actorRecord, {
        projectionIds: [projectionId],
        manual: true,
        nowMs: now,
        jitter: options.jitter
      })
      : Promise.resolve({
        ok: false,
        reason: authorityResult.fanout?.reason || "official-score-fanout-pending",
        jobs: []
      });
    if (options.deferPublicProjection === true) {
      void reconcileProjection()
        .then((recovery) => {
          const settlement = buildOfficialScoreProjectionSettlement(recovery, projectionId);
          notifyOfficialScoreTiming(options, "T12", {
            tournamentId: cleanTournamentId,
            scoreId: cleanScoreId,
            projectionId,
            ok: !settlement.partialFailure
          });
          notifyOfficialScoreBackgroundSettlement(options, {
            ok: !settlement.partialFailure,
            tournamentId: cleanTournamentId,
            scoreId: cleanScoreId,
            publishedScoreId,
            projectionId,
            projectionOutboxPath,
            ...settlement
          });
        })
        .catch((error) => {
          const reason = normalizeFirebaseFailureReason(error);
          notifyOfficialScoreTiming(options, "T12", {
            tournamentId: cleanTournamentId,
            scoreId: cleanScoreId,
            projectionId,
            ok: false
          });
          notifyOfficialScoreBackgroundSettlement(options, {
            ok: false,
            tournamentId: cleanTournamentId,
            scoreId: cleanScoreId,
            publishedScoreId,
            projectionId,
            projectionOutboxPath,
            partialFailure: true,
            reason,
            publicSnapshot: normalizePublicSnapshotPublicationResult({ ok: false, reason })
          });
        });
      return {
        ok: true,
        complete: false,
        partialFailure: false,
        backgroundPending: true,
        privateWrite,
        publicSnapshot: normalizePublicSnapshotPublicationResult({
          ok: false,
          pending: true,
          reason: "projection-background-pending"
        }),
        projectionJob: {
          projectionId,
          status: "PENDING",
          ok: false,
          reason: "projection-background-pending"
        },
        projectionId,
        projectionOutboxPath,
        id: publishedScoreId,
        published: canonicalRecord,
        revision: Number(canonicalRecord?.revision || authorityResult.revision || 0),
        idempotent: Boolean(authorityResult.idempotent),
        scorePath,
        path: publishedPath,
        publishedPath,
        auditPath,
        livePath: privateWrite.livePath
      };
    }
    const recovery = await reconcileProjection();
    notifyOfficialScoreTiming(options, "T12", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      projectionId,
      ok: Boolean(recovery?.ok)
    });
    const {
      projectionJob,
      publicSnapshot,
      partialFailure
    } = buildOfficialScoreProjectionSettlement(recovery, projectionId);
    console.info("[official-score-concurrency-001] autoridad confirmada", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      publishedScoreId,
      revision: Number(canonicalRecord?.revision || authorityResult.revision || 0),
      idempotent: Boolean(authorityResult.idempotent),
      privateWrite: privateWrite.ok,
      publicSnapshot: publicSnapshot.ok,
      partialFailure,
      publicSnapshotReason: partialFailure ? publicSnapshot.reason : "",
      projectionRevision: publicSnapshot.projectionRevision || 0,
      changedSections: publicSnapshot.changedSections || [],
      projectionId,
      projectionStatus: projectionJob.status
    });
    if (partialFailure) {
      console.warn("[publish-atomic-c003] sincronizacion publica pendiente", {
        tournamentId: cleanTournamentId,
        scoreId: cleanScoreId,
        publishedScoreId,
        reason: publicSnapshot.reason,
        errorCode: publicSnapshot.errorCode,
        projectionId,
        projectionStatus: projectionJob.status
      });
    }
    return {
      ok: true,
      complete: !partialFailure,
      partialFailure,
      privateWrite,
      publicSnapshot,
      projectionJob,
      projectionId,
      projectionOutboxPath,
      id: publishedScoreId,
      published: canonicalRecord,
      revision: Number(canonicalRecord?.revision || authorityResult.revision || 0),
      idempotent: Boolean(authorityResult.idempotent),
      scorePath,
      path: publishedPath,
      publishedPath,
      auditPath,
      livePath: privateWrite.livePath
    };
  } catch (error) {
    const authorityFailure = normalizeOfficialScoreAuthorityError(error);
    if (authorityFailure.conflict) clearOfficialScoreOperation(publishedScore?.attemptKey || "");
    console.error("[official-score-concurrency-001] publicacion rechazada", {
      tournamentId: cleanTournamentId,
      scoreId: cleanScoreId,
      publishedScoreId: publishedScore?.id || "",
      reason: authorityFailure.reason,
      conflict: authorityFailure.conflict
    });
    return {
      ok: false,
      complete: false,
      partialFailure: false,
      privateWrite: { ok: false },
      publicSnapshot: {
        ok: false,
        skipped: true,
        reason: "not-attempted",
        errorCode: "not-attempted",
        errorMessage: "La proyección pública no se intentó porque falló la escritura privada."
      },
      conflict: authorityFailure.conflict,
      reason: authorityFailure.reason,
      revision: authorityFailure.revision,
      expectedRevision: authorityFailure.expectedRevision,
      detail: normalizeErrorDetail({ error, authority: authorityFailure })
    };
  }
}

function notifyOfficialScoreTiming(options = {}, stage = "", detail = {}) {
  if (typeof options.onTimingStage !== "function") return;
  try {
    options.onTimingStage(stage, detail);
  } catch (error) {
    console.warn("[scorer-save-latency-001] timing callback ignored", {
      stage,
      reason: String(error?.message || error || "timing-callback-failed").slice(0, 160)
    });
  }
}

function notifyOfficialScoreBackgroundSettlement(options = {}, settlement = {}) {
  if (typeof options.onBackgroundSettled !== "function") return;
  try {
    options.onBackgroundSettled(settlement);
  } catch (error) {
    console.warn("[scorer-save-latency-001] background callback ignored", {
      reason: String(error?.message || error || "background-callback-failed").slice(0, 160)
    });
  }
}

function buildOfficialScoreProjectionSettlement(recovery = {}, projectionId = "") {
  const projectionJob = (Array.isArray(recovery.jobs) ? recovery.jobs : [])
    .find((job) => job.projectionId === projectionId) || {
      projectionId,
      status: "PENDING",
      ok: false,
      reason: recovery.reason || "projection-pending"
    };
  const publicSnapshot = normalizePublicSnapshotPublicationResult(
    projectionJob.publicSnapshot || {
      ok: [
        PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
        PUBLIC_PROJECTION_STATUSES.VERIFIED
      ].includes(projectionJob.status),
      clientConfirmed: projectionJob.status === PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
      verified: projectionJob.status === PUBLIC_PROJECTION_STATUSES.VERIFIED,
      authoritativelyVerified: projectionJob.status === PUBLIC_PROJECTION_STATUSES.VERIFIED,
      reason: projectionJob.reason || recovery.reason || "projection-pending"
    }
  );
  const projectionConfirmed = (
    projectionJob.status === PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED
    && publicSnapshot.clientConfirmed === true
  ) || (
    projectionJob.status === PUBLIC_PROJECTION_STATUSES.VERIFIED
    && publicSnapshot.verified === true
  );
  return {
    recovery,
    projectionJob,
    publicSnapshot,
    projectionConfirmed,
    partialFailure: !projectionConfirmed,
    reason: projectionConfirmed ? "" : publicSnapshot.reason || recovery.reason || "projection-pending"
  };
}

async function callOfficialScoreAuthority(payload, options = {}) {
  const callable = httpsCallable(getFirebaseFunctions(), "publishCharroProOfficialScore");
  const retryDelays = Array.isArray(options.officialScoreRetryDelays)
    ? options.officialScoreRetryDelays
    : [0, 250, 750];
  let lastError = null;
  for (let index = 0; index < retryDelays.length; index += 1) {
    if (retryDelays[index] > 0) await new Promise((resolve) => setTimeout(resolve, retryDelays[index]));
    try {
      const response = await callable(payload);
      return response?.data || { ok: false, reason: "official-score-empty-response" };
    } catch (error) {
      lastError = error;
      const normalized = normalizeOfficialScoreAuthorityError(error);
      if (normalized.conflict || !isRetryableOfficialScoreFailure(normalized.reason)) throw error;
    }
  }
  throw lastError || new Error("official-score-authority-unavailable");
}

function normalizeOfficialScoreAuthorityError(error = {}) {
  const details = error?.details || error?.customData?.details || error?.data || {};
  const rawReason = String(details.reason || error?.code || error?.message || "official-score-authority-failed");
  const reason = rawReason.replace(/^functions\//, "").slice(0, 160);
  return {
    reason,
    conflict: Boolean(details.conflict || reason.includes("conflict") || reason.includes("mismatch") || reason.includes("superseded") || reason === "aborted"),
    revision: Number(details.revision || 0),
    expectedRevision: Number(details.expectedRevision || 0)
  };
}

function isRetryableOfficialScoreFailure(reason = "") {
  const clean = String(reason || "").toLowerCase();
  return ["unavailable", "timeout", "network", "internal", "deadline", "disconnected", "aborted"].some((token) => clean.includes(token));
}

function getOrCreateOfficialScoreOperation(record = {}, scorePayload = null, expectedRevision = 0) {
  const attemptKey = String(record.attemptKey || "");
  const storageKey = `charropro.officialScoreOperation.v1.${stableOfficialScoreDigest(attemptKey)}`;
  const fingerprint = stableOfficialScoreDigest(stableOfficialScoreStringify({
    attemptKey,
    expectedRevision,
    scorePayload,
    total: record.total,
    attempt: record.attempt,
    breakdown: record.breakdown
  }));
  const stored = readOfficialScoreStorage(storageKey);
  if (stored?.fingerprint === fingerprint && stored?.idempotencyKey) return stored;
  const operation = {
    fingerprint,
    expectedRevision,
    idempotencyKey: `score:${stableOfficialScoreDigest(`${attemptKey}|${record.id || createId("request")}`)}`,
    createdAt: new Date().toISOString()
  };
  writeOfficialScoreStorage(storageKey, operation);
  return operation;
}

function clearOfficialScoreOperation(attemptKey = "") {
  if (!attemptKey || typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(`charropro.officialScoreOperation.v1.${stableOfficialScoreDigest(attemptKey)}`);
  } catch {
    // Storage is an optimization for retries; server idempotency remains authoritative.
  }
}

function getOfficialScoreDevice() {
  const storageKey = "charropro.officialScoreDevice.v1";
  const stored = readOfficialScoreStorage(storageKey);
  const deviceId = stored?.deviceId || `device_${stableOfficialScoreDigest(createId("device"))}`;
  if (!stored?.deviceId) writeOfficialScoreStorage(storageKey, { deviceId });
  return {
    deviceId,
    platform: typeof navigator !== "undefined" ? String(navigator.platform || "").slice(0, 80) : "",
    userAgent: typeof navigator !== "undefined" ? String(navigator.userAgent || "").slice(0, 240) : ""
  };
}

function readOfficialScoreStorage(key) {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function writeOfficialScoreStorage(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A blocked storage API must not prevent an authorized publication.
  }
}

function stableOfficialScoreDigest(value = "") {
  const text = String(value || "");
  let left = 2166136261;
  let right = 2246822507;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    left ^= code;
    left = Math.imul(left, 16777619);
    right ^= code + index;
    right = Math.imul(right, 3266489909);
  }
  return `${(left >>> 0).toString(16).padStart(8, "0")}${(right >>> 0).toString(16).padStart(8, "0")}`;
}

function stableOfficialScoreStringify(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (Array.isArray(value)) return `[${value.map(stableOfficialScoreStringify).join(",")}]`;
  if (!value || typeof value !== "object") return "null";
  return `{${Object.keys(value).sort().filter((key) => !["__proto__", "constructor", "prototype"].includes(key)).map((key) => `${JSON.stringify(key)}:${stableOfficialScoreStringify(value[key])}`).join(",")}}`;
}

function normalizePublicSnapshotPublicationResult(result = {}) {
  const ok = result?.ok === true;
  const reason = String(result?.reason || (ok ? "updated" : "public-snapshot-failed")).slice(0, 120);
  const changedSections = Array.isArray(result?.changedSections)
    ? result.changedSections.map((section) => String(section || "").slice(0, 80)).filter(Boolean)
    : [];
  return cleanUndefined({
    ok,
    skipped: Boolean(result?.skipped),
    reason,
    errorCode: ok ? "" : reason,
    errorMessage: ok ? "" : "No se pudo actualizar la proyección pública.",
    path: String(result?.path || "").slice(0, 300),
    source: String(result?.source || "").slice(0, 80),
    projected: Boolean(result?.projected),
    publicSnapshotValidation: result?.publicSnapshotValidation === true,
    clientConfirmed: Boolean(result?.clientConfirmed || result?.verified),
    verified: Boolean(result?.authoritativelyVerified),
    projectionRevision: Number.isSafeInteger(result?.projectionRevision)
      ? result.projectionRevision
      : 0,
    targetRevision: Number.isSafeInteger(result?.targetRevision)
      ? result.targetRevision
      : Number.isSafeInteger(result?.projectionRevision) ? result.projectionRevision : 0,
    sourceUpdatedAt: String(result?.sourceUpdatedAt || "").slice(0, 40),
    targetFingerprint: String(result?.targetFingerprint || "").slice(0, 80),
    changedSections
  });
}

export function getFirebasePublicProjectionOutboxPath(tournamentId = "") {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  return cleanTournamentId
    ? `${PUBLIC_PROJECTION_OUTBOX_PATH}/${cleanTournamentId}`
    : "";
}

export function getFirebasePublicProjectionOutboxJobPath(tournamentId = "", projectionId = "") {
  const outboxPath = getFirebasePublicProjectionOutboxPath(tournamentId);
  const cleanProjectionId = String(projectionId || "").trim();
  if (!/^[A-Za-z0-9_-]{1,180}$/.test(cleanProjectionId)) return "";
  return outboxPath && cleanProjectionId ? `${outboxPath}/${cleanProjectionId}` : "";
}

export async function readFirebasePublicProjectionOutbox(tournamentId = "", options = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  const path = getFirebasePublicProjectionOutboxPath(cleanTournamentId);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament", path: "" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase", path };
  try {
    const snapshot = await get(ref(getFirebaseDatabase(), path));
    return {
      ok: true,
      path,
      ...buildPublicProjectionOutboxSnapshot(snapshot.val() || {}, {
        tournamentId: cleanTournamentId,
        nowMs: options.nowMs
      })
    };
  } catch (error) {
    return {
      ok: false,
      path,
      tournamentId: cleanTournamentId,
      reason: normalizeFirebaseFailureReason(error),
      errorCode: sanitizeProjectionErrorCode(normalizeFirebaseFailureReason(error)),
      errorMessage: sanitizeProjectionErrorMessage(error?.message)
    };
  }
}

export async function reconcileFirebasePublicProjectionOutbox(tournamentId = "", actor = {}, options = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament", jobs: [] };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase", jobs: [] };
  const actorRecord = await resolveAuthenticatedProjectionActor(actor);
  if (!actorRecord?.uid || !isAuthorizedProjectionRecoveryActor(actorRecord)) {
    return { ok: false, reason: "projection-recovery-not-authorized", jobs: [] };
  }
  try {
    return await runFirebasePublicProjectionReconciliation(cleanTournamentId, actorRecord, options);
  } catch (error) {
    return {
      ok: false,
      reason: normalizeFirebaseFailureReason(error),
      errorCode: sanitizeProjectionErrorCode(normalizeFirebaseFailureReason(error)),
      errorMessage: sanitizeProjectionErrorMessage(error?.message),
      tournamentId: cleanTournamentId,
      jobs: []
    };
  }
}

async function runFirebasePublicProjectionReconciliation(tournamentId, actor, options = {}) {
  const listed = await readFirebasePublicProjectionOutbox(tournamentId, options);
  if (!listed.ok) return { ...listed, jobs: [] };
  const workerId = buildProjectionWorkerId(actor);
  const superseded = await supersedeStaleFirebaseProjectionJobs(tournamentId, listed.jobs, {
    nowMs: options.nowMs,
    workerId,
    actor
  });
  const requestedIds = new Set(
    Array.isArray(options.projectionIds)
      ? options.projectionIds.map(String).filter(Boolean)
      : []
  );
  const candidates = listed.jobs
    .filter((job) => !requestedIds.size || requestedIds.has(job.projectionId))
    .sort((left, right) => left.intent.createdAtMs - right.intent.createdAtMs)
    .slice(0, Math.max(1, Math.min(25, Number(options.limit || 10))));
  const results = [];

  for (const job of candidates) {
    const supersededResult = superseded.get(job.projectionId);
    if (supersededResult) {
      results.push(supersededResult);
      continue;
    }
    if ([
      PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
      PUBLIC_PROJECTION_STATUSES.VERIFIED
    ].includes(job.state.status)) {
      const authoritativelyVerified = job.state.status === PUBLIC_PROJECTION_STATUSES.VERIFIED;
      results.push({
        ok: true,
        projectionId: job.projectionId,
        status: job.state.status,
        reason: authoritativelyVerified ? "already-verified" : "already-client-confirmed",
        publicSnapshot: {
          ok: true,
          projected: true,
          clientConfirmed: !authoritativelyVerified,
          verified: authoritativelyVerified,
          authoritativelyVerified,
          reason: authoritativelyVerified ? "already-verified" : "already-client-confirmed",
          projectionRevision: job.state.targetRevision,
          targetRevision: job.state.targetRevision,
          targetFingerprint: job.state.targetFingerprint
        }
      });
      continue;
    }
    if (!isPublicProjectionJobEligible(job, options)) {
      results.push({
        ok: false,
        projectionId: job.projectionId,
        status: job.state.status,
        reason: "projection-not-eligible"
      });
      continue;
    }
    results.push(await processFirebasePublicProjectionJob(tournamentId, job, actor, {
      ...options,
      workerId,
      actor
    }));
  }

  const finalSnapshot = await readFirebasePublicProjectionOutbox(tournamentId, options);
  const failed = results.filter((result) => (
    result.status !== PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED &&
    result.status !== PUBLIC_PROJECTION_STATUSES.VERIFIED &&
    result.status !== PUBLIC_PROJECTION_STATUSES.SUPERSEDED
  ));
  console.info("[projection-recovery-001] reconciliation completed", {
    tournamentId,
    processed: results.length,
    clientConfirmed: results.filter((result) => result.status === PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED).length,
    verified: results.filter((result) => result.status === PUBLIC_PROJECTION_STATUSES.VERIFIED).length,
    superseded: results.filter((result) => result.status === PUBLIC_PROJECTION_STATUSES.SUPERSEDED).length,
    pending: finalSnapshot.pending || 0,
    retry: finalSnapshot.retry || 0,
    deadLetter: finalSnapshot.deadLetter || 0
  });
  return {
    ok: failed.length === 0,
    reason: failed.length ? "projection-recovery-incomplete" : "projection-recovery-complete",
    tournamentId,
    jobs: results,
    snapshot: finalSnapshot
  };
}

export async function retryFirebasePublicProjectionJob(tournamentId = "", projectionId = "", actor = {}, options = {}) {
  const actorRecord = await resolveAuthenticatedProjectionActor(actor);
  if (!actorRecord?.uid || !isAuthorizedProjectionRecoveryActor(actorRecord)) {
    return { ok: false, reason: "projection-recovery-not-authorized" };
  }
  const path = getFirebasePublicProjectionOutboxJobPath(tournamentId, projectionId);
  if (!path) return { ok: false, reason: "invalid-projection-job" };
  const statePath = `${path}/state`;
  let resetState = null;
  try {
    const transaction = await runTransaction(ref(getFirebaseDatabase(), statePath), (current) => {
      const state = normalizePublicProjectionState(current || {});
      if ([
        PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
        PUBLIC_PROJECTION_STATUSES.VERIFIED,
        PUBLIC_PROJECTION_STATUSES.SUPERSEDED,
        PUBLIC_PROJECTION_STATUSES.CANCELLED
      ].includes(state.status)) {
        return undefined;
      }
      resetState = buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.PENDING, state, {
        nextRetryAt: "",
        nextRetryAtMs: 0,
        lastErrorCode: "",
        lastErrorMessage: "",
        deadLetterReason: "",
        retriedBy: actorRecord,
        updatedBy: actorRecord
      }, { nowMs: options.nowMs, force: true });
      return resetState || undefined;
    }, { applyLocally: false });
    if (!transaction.committed || !resetState) {
      return { ok: false, reason: "projection-retry-not-allowed", projectionId };
    }
    return reconcileFirebasePublicProjectionOutbox(tournamentId, actorRecord, {
      ...options,
      manual: true,
      projectionIds: [projectionId]
    });
  } catch (error) {
    return {
      ok: false,
      reason: normalizeFirebaseFailureReason(error),
      errorMessage: sanitizeProjectionErrorMessage(error?.message),
      projectionId
    };
  }
}

export async function retryAllFirebasePublicProjectionJobs(tournamentId = "", actor = {}, options = {}) {
  const actorRecord = await resolveAuthenticatedProjectionActor(actor);
  if (!actorRecord?.uid || !isAuthorizedProjectionRecoveryActor(actorRecord)) {
    return { ok: false, reason: "projection-recovery-not-authorized", jobs: [] };
  }
  const listed = await readFirebasePublicProjectionOutbox(tournamentId, options);
  if (!listed.ok) return { ...listed, jobs: [] };
  const retryable = listed.jobs
    .filter((job) => [
      PUBLIC_PROJECTION_STATUSES.PENDING,
      PUBLIC_PROJECTION_STATUSES.RETRY_WAIT,
      PUBLIC_PROJECTION_STATUSES.FAILED,
      PUBLIC_PROJECTION_STATUSES.DEAD_LETTER
    ].includes(job.state.status))
    .slice(0, Math.max(1, Math.min(25, Number(options.limit || 10))));
  const resetResults = [];
  for (const job of retryable) {
    const path = `${getFirebasePublicProjectionOutboxJobPath(tournamentId, job.projectionId)}/state`;
    let nextState = null;
    const transaction = await runTransaction(ref(getFirebaseDatabase(), path), (current) => {
      const state = normalizePublicProjectionState(current || {}, job.intent);
      nextState = buildPublicProjectionState(PUBLIC_PROJECTION_STATUSES.PENDING, state, {
        nextRetryAt: "",
        nextRetryAtMs: 0,
        lastErrorCode: "",
        lastErrorMessage: "",
        deadLetterReason: "",
        retriedBy: actorRecord,
        updatedBy: actorRecord
      }, { nowMs: options.nowMs, force: true });
      return nextState || undefined;
    }, { applyLocally: false });
    resetResults.push({ projectionId: job.projectionId, reset: transaction.committed });
  }
  const reconciliation = await reconcileFirebasePublicProjectionOutbox(tournamentId, actorRecord, {
    ...options,
    manual: true,
    projectionIds: retryable.map((job) => job.projectionId)
  });
  return { ...reconciliation, resetResults };
}

export async function verifyFirebasePublicProjectionJob(tournamentId = "", projectionId = "", actor = {}, options = {}) {
  const actorRecord = await resolveAuthenticatedProjectionActor(actor);
  if (!actorRecord?.uid || !isAuthorizedProjectionRecoveryActor(actorRecord)) {
    return { ok: false, reason: "projection-recovery-not-authorized" };
  }
  const jobPath = getFirebasePublicProjectionOutboxJobPath(tournamentId, projectionId);
  if (!jobPath) return { ok: false, reason: "invalid-projection-job" };
  try {
    const [jobSnapshot, tournamentSnapshot, liveSnapshot, targetSnapshot] = await Promise.all([
      get(ref(getFirebaseDatabase(), jobPath)),
      get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${normalizeLiveChannel(tournamentId)}`)),
      get(ref(getFirebaseDatabase(), `${LIVE_ROOT_PATH}/${normalizeLiveChannel(tournamentId)}/current`)),
      get(ref(getFirebaseDatabase(), `${PUBLIC_TOURNAMENTS_PATH}/${normalizeLiveChannel(tournamentId)}`))
    ]);
    const job = normalizePublicProjectionJob(jobSnapshot.val() || {});
    if (!job) return { ok: false, reason: "invalid-projection-intent", projectionId };
    const source = tournamentSnapshot.val() || null;
    if (!source) return { ok: false, reason: "missing-projection-source", projectionId };
    const candidate = buildPublicProjection({
      tournament: source,
      liveCurrent: liveSnapshot.val() || {}
    }, {
      tournamentId: normalizeLiveChannel(tournamentId),
      nowMs: options.nowMs
    });
    const current = targetSnapshot.val() || null;
    const reconciliation = reconcilePublicProjection(current, candidate, { nowMs: options.nowMs });
    const converged = reconciliation.ok === true && reconciliation.changed === false;
    if (!converged) {
      return {
        ok: false,
        clientConfirmed: false,
        reason: reconciliation.reason || "public-projection-not-verified",
        projectionId,
        status: job.state.status
      };
    }
    const fingerprint = getPublicProjectionSignature(current);
    return {
      ok: true,
      clientConfirmed: true,
      authoritativelyVerified: false,
      reason: "client-readback-confirmed",
      projectionId,
      status: job.state.status,
      targetRevision: Number(current.projectionRevision || 0),
      targetFingerprint: fingerprint
    };
  } catch (error) {
    return {
      ok: false,
      reason: normalizeFirebaseFailureReason(error),
      errorMessage: sanitizeProjectionErrorMessage(error?.message),
      projectionId
    };
  }
}

async function processFirebasePublicProjectionJob(tournamentId, inputJob, actor, options = {}) {
  const job = normalizePublicProjectionJob(inputJob);
  if (!job) {
    return { ok: false, projectionId: "", status: "DEAD_LETTER", reason: "invalid-projection-intent" };
  }
  const projectionId = job.projectionId;
  const claimed = await claimFirebaseProjectionJob(tournamentId, job, {
    ...options,
    actor
  });
  if (!claimed) {
    return {
      ok: false,
      projectionId,
      status: job.state.status,
      reason: "projection-claim-not-acquired"
    };
  }
  if (claimed.status === PUBLIC_PROJECTION_STATUSES.DEAD_LETTER) {
    return {
      ok: false,
      projectionId,
      status: claimed.status,
      reason: claimed.deadLetterReason || "attempts-exhausted"
    };
  }

  try {
    const sourceSnapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${tournamentId}`));
    const source = sourceSnapshot.val() || null;
    if (!source) {
      return failFirebaseProjectionJob(tournamentId, job, claimed, {
        reason: "missing-projection-source",
        message: "No existe la fuente oficial del torneo."
      }, options);
    }
    const sourceCheck = inspectProjectionSource(job, source.publishedScores);
    if (!sourceCheck.ok && sourceCheck.supersededBy) {
      const state = await transitionFirebaseProjectionState(
        tournamentId,
        projectionId,
        PUBLIC_PROJECTION_STATUSES.SUPERSEDED,
        { supersededBy: sourceCheck.supersededBy },
        { ...options, actor }
      );
      return {
        ok: true,
        projectionId,
        status: state?.status || PUBLIC_PROJECTION_STATUSES.SUPERSEDED,
        reason: "projection-superseded",
        supersededBy: sourceCheck.supersededBy
      };
    }
    if (!sourceCheck.ok) {
      return failFirebaseProjectionJob(tournamentId, job, claimed, {
        reason: sourceCheck.reason,
        message: sourceCheck.message
      }, options);
    }

    const publicSnapshot = normalizePublicSnapshotPublicationResult(
      await publishPublicTournamentSnapshot(tournamentId, source, {
        source: "projectionOutbox",
        nowMs: options.nowMs
      })
    );
    let latestState = claimed;
    if (publicSnapshot.projected) {
      const projectedState = await transitionFirebaseProjectionState(
        tournamentId,
        projectionId,
        PUBLIC_PROJECTION_STATUSES.PROJECTED,
        {
          projectedAt: new Date(Number(options.nowMs || Date.now())).toISOString(),
          targetRevision: publicSnapshot.targetRevision || publicSnapshot.projectionRevision,
          targetFingerprint: publicSnapshot.targetFingerprint
        },
        {
          ...options,
          actor,
          expectedRevision: job.intent.sourceRevision
        }
      );
      if (!projectedState) {
        return failFirebaseProjectionJob(tournamentId, job, latestState, {
          reason: "transaction-aborted",
          message: "La proyeccion publica se escribio, pero el estado PROJECTED no quedo persistido."
        }, {
          ...options,
          publicSnapshot
        });
      }
      latestState = projectedState;
    }
    if (publicSnapshot.ok && publicSnapshot.clientConfirmed) {
      if ([
        PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
        PUBLIC_PROJECTION_STATUSES.VERIFIED
      ].includes(latestState.status)) {
        return {
          ok: true,
          projectionId,
          status: latestState.status,
          reason: latestState.status === PUBLIC_PROJECTION_STATUSES.VERIFIED
            ? "projection-already-verified"
            : "projection-client-confirmed",
          attempts: latestState.attempts,
          publicSnapshot
        };
      }
      const clientConfirmedState = await transitionFirebaseProjectionState(
        tournamentId,
        projectionId,
        PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
        {
          clientConfirmedAt: new Date(Number(options.nowMs || Date.now())).toISOString(),
          targetRevision: publicSnapshot.targetRevision || publicSnapshot.projectionRevision,
          targetFingerprint: publicSnapshot.targetFingerprint
        },
        {
          ...options,
          actor,
          expectedRevision: job.intent.sourceRevision
        }
      );
      if (!clientConfirmedState) {
        return {
          ok: false,
          projectionId,
          status: latestState.status,
          reason: "projection-verification-state-conflict",
          publicSnapshot
        };
      }
      return {
        ok: true,
        projectionId,
        status: clientConfirmedState.status,
        reason: "projection-client-confirmed",
        attempts: clientConfirmedState.attempts,
        publicSnapshot
      };
    }
    return failFirebaseProjectionJob(tournamentId, job, latestState, {
      reason: publicSnapshot.reason || "public-projection-not-verified",
      message: publicSnapshot.errorMessage || "No se pudo verificar la proyección pública."
    }, {
      ...options,
      publicSnapshot
    });
  } catch (error) {
    return failFirebaseProjectionJob(tournamentId, job, claimed, error, options);
  }
}

async function claimFirebaseProjectionJob(tournamentId, job, options = {}) {
  const statePath = `${getFirebasePublicProjectionOutboxJobPath(tournamentId, job.projectionId)}/state`;
  let claimed = null;
  const transaction = await runTransaction(ref(getFirebaseDatabase(), statePath), (current) => {
    claimed = claimPublicProjectionState(current || job.state, {
      nowMs: options.nowMs,
      manual: options.manual,
      maxAttempts: options.maxAttempts || PUBLIC_PROJECTION_MAX_ATTEMPTS,
      leaseMs: options.leaseMs || PUBLIC_PROJECTION_LEASE_MS,
      leaseOwner: options.workerId,
      actor: options.actor
    });
    return claimed || undefined;
  }, { applyLocally: false });
  return transaction.committed ? normalizePublicProjectionState(transaction.snapshot.val() || claimed, job.intent) : null;
}

async function failFirebaseProjectionJob(tournamentId, job, previousState, error, options = {}) {
  const failureState = buildPublicProjectionFailureState(previousState, error, {
    nowMs: options.nowMs,
    maxAttempts: options.maxAttempts || PUBLIC_PROJECTION_MAX_ATTEMPTS,
    jitter: options.jitter,
    seed: job.projectionId,
    actor: options.actor
  });
  const state = await setFirebaseProjectionState(tournamentId, job.projectionId, failureState, options);
  console.warn("[projection-recovery-001] projection pending", {
    tournamentId,
    projectionId: job.projectionId,
    status: state?.status || failureState.status,
    attempts: state?.attempts || failureState.attempts,
    nextRetryAt: state?.nextRetryAt || failureState.nextRetryAt,
    reason: state?.lastErrorCode || failureState.lastErrorCode
  });
  return {
    ok: false,
    projectionId: job.projectionId,
    status: state?.status || failureState.status,
    reason: state?.lastErrorCode || failureState.lastErrorCode,
    attempts: state?.attempts || failureState.attempts,
    nextRetryAt: state?.nextRetryAt || failureState.nextRetryAt,
    publicSnapshot: options.publicSnapshot || null
  };
}

async function supersedeStaleFirebaseProjectionJobs(tournamentId, jobs = [], options = {}) {
  const latestByAttempt = new Map();
  for (const job of jobs) {
    const key = `${job.intent.projectionType}|${job.intent.attemptKey}`;
    const latest = latestByAttempt.get(key);
    if (!latest || comparePublicProjectionJobs(job, latest) > 0) latestByAttempt.set(key, job);
  }
  const results = new Map();
  for (const job of jobs) {
    const key = `${job.intent.projectionType}|${job.intent.attemptKey}`;
    const latest = latestByAttempt.get(key);
    if (!latest || latest.projectionId === job.projectionId) continue;
    if ([
      PUBLIC_PROJECTION_STATUSES.SUPERSEDED,
      PUBLIC_PROJECTION_STATUSES.CANCELLED
    ].includes(job.state.status)) continue;
    const state = await transitionFirebaseProjectionState(
      tournamentId,
      job.projectionId,
      PUBLIC_PROJECTION_STATUSES.SUPERSEDED,
      { supersededBy: latest.projectionId },
      options
    );
    if (state) {
      results.set(job.projectionId, {
        ok: true,
        projectionId: job.projectionId,
        status: state.status,
        reason: "projection-superseded",
        supersededBy: latest.projectionId
      });
    }
  }
  return results;
}

async function transitionFirebaseProjectionState(tournamentId, projectionId, status, patch = {}, options = {}) {
  const path = `${getFirebasePublicProjectionOutboxJobPath(tournamentId, projectionId)}/state`;
  const stateRef = ref(getFirebaseDatabase(), path);
  let nextState = null;
  let transactionInput = null;
  try {
    // A transaction with applyLocally:false can otherwise begin from the state
    // cached before the claim and abort locally without consulting RTDB again.
    const beforeSnapshot = await get(stateRef);
    const beforeState = normalizePublicProjectionState(beforeSnapshot.val() || {});
    console.info("[projection-recovery-001] state transition requested", JSON.stringify({
      projectionId,
      path,
      previousStatus: beforeState.status,
      requestedStatus: status,
      attempts: beforeState.attempts,
      expectedRevision: Number(options.expectedRevision || beforeState.sourceRevision || 0),
      targetRevision: Number(patch.targetRevision || beforeState.targetRevision || 0),
      targetFingerprint: String(patch.targetFingerprint || beforeState.targetFingerprint || ""),
      projectedAt: String(patch.projectedAt || beforeState.projectedAt || ""),
      clientConfirmedAt: String(patch.clientConfirmedAt || beforeState.clientConfirmedAt || "")
    }));

    const transaction = await runTransaction(stateRef, (current) => {
      const localState = normalizePublicProjectionState(current || {});
      // Firebase can invoke the first transaction callback with the cached
      // state that existed before the claim. Seed the CAS with the newer
      // durable read; Firebase still reruns this callback with server state if
      // another client wins the race.
      transactionInput = beforeState.updatedAtMs > localState.updatedAtMs
        ? beforeState
        : localState;
      nextState = buildPublicProjectionState(status, transactionInput, {
        ...patch,
        updatedBy: options.actor
      }, {
        nowMs: options.nowMs,
        force: options.force,
        authority: options.authority
      });
      return nextState || undefined;
    }, { applyLocally: false });

    const readbackSnapshot = await get(stateRef);
    const readbackState = normalizePublicProjectionState(readbackSnapshot.val() || {});
    const acceptedStatuses = status === PUBLIC_PROJECTION_STATUSES.PROJECTED
      ? new Set([
        PUBLIC_PROJECTION_STATUSES.PROJECTED,
        PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
        PUBLIC_PROJECTION_STATUSES.VERIFIED
      ])
      : status === PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED
        ? new Set([
          PUBLIC_PROJECTION_STATUSES.CLIENT_CONFIRMED,
          PUBLIC_PROJECTION_STATUSES.VERIFIED
        ])
        : new Set([status]);
    const persisted = acceptedStatuses.has(readbackState.status)
      && readbackState.sourceRevision === Number(options.expectedRevision || readbackState.sourceRevision);

    console.info("[projection-recovery-001] state transition result", JSON.stringify({
      projectionId,
      path,
      previousStatus: transactionInput?.status || beforeState.status,
      requestedStatus: status,
      candidateStatus: nextState?.status || "",
      committed: transaction.committed,
      persisted,
      persistedStatus: readbackState.status,
      attempts: readbackState.attempts,
      expectedRevision: Number(options.expectedRevision || readbackState.sourceRevision || 0),
      targetRevision: readbackState.targetRevision,
      targetFingerprint: readbackState.targetFingerprint,
      projectedAt: readbackState.projectedAt,
      clientConfirmedAt: readbackState.clientConfirmedAt
    }));

    if (!persisted) {
      console.warn("[projection-recovery-001] state transition not persisted", JSON.stringify({
        projectionId,
        path,
        previousStatus: transactionInput?.status || beforeState.status,
        requestedStatus: status,
        committed: transaction.committed,
        persistedStatus: readbackState.status,
        attempts: readbackState.attempts
      }));
      return null;
    }
    return readbackState;
  } catch (error) {
    console.error("[projection-recovery-001] state transition failed", JSON.stringify({
      projectionId,
      path,
      requestedStatus: status,
      previousStatus: transactionInput?.status || "",
      attempts: transactionInput?.attempts || 0,
      expectedRevision: Number(options.expectedRevision || 0),
      targetRevision: Number(patch.targetRevision || 0),
      reason: normalizeFirebaseFailureReason(error),
      errorMessage: sanitizeProjectionErrorMessage(error?.message)
    }));
    throw error;
  }
}

async function setFirebaseProjectionState(tournamentId, projectionId, state, options = {}) {
  if (!state) return null;
  return transitionFirebaseProjectionState(
    tournamentId,
    projectionId,
    state.status,
    state,
    {
      ...options,
      expectedRevision: state.sourceRevision
    }
  );
}

function inspectProjectionSource(job, value) {
  const records = Object.entries(value || {})
    .map(([key, record]) => ({ ...(record || {}), id: record?.id || key }))
    .filter((record) => record && typeof record === "object")
    .filter((record) => String(record.attemptKey || "") === job.intent.attemptKey)
    .sort(compareProjectionSourceRecords);
  const source = records.find((record) => String(record.id || "") === job.intent.sourceId);
  if (!source) {
    return {
      ok: false,
      reason: "missing-projection-source",
      message: "No existe el publishedScore asociado al trabajo."
    };
  }
  const latest = records.at(-1) || source;
  if (
    String(latest.id || "") !== job.intent.sourceId ||
    source.superseded === true ||
    String(source.supersededBy || "")
  ) {
    return {
      ok: false,
      reason: "projection-superseded",
      supersededBy: String(latest.id || source.supersededBy || "")
    };
  }
  if (Number(source.revision || 1) !== job.intent.sourceRevision) {
    return {
      ok: false,
      reason: "projection-source-mismatch",
      message: "La revisión de la fuente no coincide con la intención durable."
    };
  }
  return { ok: true, source };
}

function compareProjectionSourceRecords(left, right) {
  return (
    Number(left?.revision || 1) - Number(right?.revision || 1) ||
    (Date.parse(left?.publishedAt || "") || 0) - (Date.parse(right?.publishedAt || "") || 0) ||
    String(left?.id || "").localeCompare(String(right?.id || ""))
  );
}

function isAuthorizedProjectionRecoveryActor(actor = {}) {
  return ["supervisor", "operador", "juez"].includes(normalizeRole(actor.role));
}

function buildProjectionWorkerId(actor = {}) {
  return [
    String(actor.clientId || "").trim(),
    String(actor.uid || actor.id || "").trim(),
    normalizeRole(actor.role)
  ].filter(Boolean).join(":").slice(0, 180) || "projection-worker";
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
    const profilePath = `${USERS_PATH}/${authUser.uid}`;
    const profileSnapshot = await readFirebasePreparationPath(profilePath);
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
    const publicSnapshot = await publishPublicTournamentSnapshot(liveChannel, null, { source: "turn" });
    return { ok: true, publicSnapshot };
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

function buildTournamentRecordIds(record = {}) {
  return {
    teams: listStoredRecordIds(record.teams),
    charreadas: listStoredRecordIds(record.charreadas),
    scores: listStoredRecordIds(record.scores),
    publishedScores: listStoredRecordIds(record.publishedScores)
  };
}

function buildCollectionIdGuard(remoteCollection, proposedCollection, operation = "collection-write") {
  const remoteIds = listStoredRecordIds(remoteCollection);
  const proposedIds = listStoredRecordIds(proposedCollection);
  const proposedSet = new Set(proposedIds);
  const missingRemoteIds = remoteIds.filter((id) => !proposedSet.has(id));
  return {
    ok: missingRemoteIds.length === 0,
    operation,
    countRemote: remoteIds.length,
    countProposed: proposedIds.length,
    missingRemoteIds
  };
}

function listStoredRecordIds(value) {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => String(item?.id || index))
      .filter(Boolean)
      .sort();
  }
  if (!value || typeof value !== "object") return [];
  return Object.keys(value).filter(Boolean).sort();
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
    const publicSnapshot = await publishPublicTournamentSnapshot(liveChannel, null, { source: "timer" });
    return { ok: true, publicSnapshot };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

export function getFirebaseOfficialTimerPath(tournamentId = "", timerId = "") {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  const timerKey = normalizeFirebaseTimerKey(timerId);
  return cleanTournamentId && timerKey
    ? `${TOURNAMENTS_PATH}/${cleanTournamentId}/officialTimers/${timerKey}`
    : "";
}

export function subscribeFirebaseOfficialTimers(tournamentId, callback) {
  if (!isFirebaseLiveConfigured()) return () => {};
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return () => {};
  const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}/officialTimers`;
  try {
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const registry = snapshot.val() || {};
      const timers = Object.values(registry)
        .map((timer) => {
          try {
            return normalizeOfficialTimerContext(timer);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      callback({
        tournamentId: cleanTournamentId,
        timers,
        registry: Object.fromEntries(timers.map((timer) => [timer.timerId, timer])),
        observedAt: new Date().toISOString(),
        observedAtMs: Date.now()
      });
    }, (error) => {
      callback({
        tournamentId: cleanTournamentId,
        timers: [],
        registry: {},
        observedAt: new Date().toISOString(),
        observedAtMs: Date.now(),
        error: normalizeFirebaseFailureReason(error)
      });
    });
  } catch {
    return () => {};
  }
}

export async function applyFirebaseOfficialTimerAuthority(definition = {}, request = {}, options = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };
  const tournamentId = normalizeLiveChannel(definition.tournamentId || options.tournamentId);
  const timerId = String(definition.timerId || request.timerId || "").trim();
  const path = getFirebaseOfficialTimerPath(tournamentId, timerId);
  if (!tournamentId || !timerId || !path) return { ok: false, reason: "official-timer-identity-required" };

  const auth = getFirebaseAuth();
  if (typeof auth.authStateReady === "function") await auth.authStateReady();
  const authUser = auth.currentUser;
  if (!authUser?.uid) return { ok: false, reason: "not-authenticated" };

  const actor = compactTimerAuthorityActor({
    ...(options.actor || request.actor || {}),
    id: authUser.uid,
    uid: authUser.uid
  });
  const acceptedAtMs = resolveFirebaseTimerNow(options.now ?? request.acceptedAt);
  const acceptedAt = new Date(acceptedAtMs).toISOString();
  const normalizedRequest = cleanUndefined({
    ...request,
    timerId,
    actor,
    acceptedAt,
    issuedAt: request.issuedAt || acceptedAt
  });
  let transition = null;
  let conflictTimer = null;
  let failureReason = "official-timer-transaction-conflict";

  try {
    const transaction = await runTransaction(ref(getFirebaseDatabase(), path), (currentValue) => {
      let current = null;
      try {
        current = currentValue
          ? normalizeOfficialTimerContext(currentValue, definition)
          : createOfficialTimerContext(definition, { now: acceptedAtMs, source: request.source || definition.source || "timer-authority" });
      } catch {
        failureReason = "official-timer-invalid-current-state";
        return;
      }
      if (
        current.timerId !== timerId ||
        current.tournamentId && current.tournamentId !== tournamentId ||
        current.charreadaId && definition.charreadaId && current.charreadaId !== definition.charreadaId
      ) {
        failureReason = "official-timer-identity-conflict";
        conflictTimer = current;
        return;
      }

      const expectedRevision = request.expectedRevision ?? options.expectedRevision;
      const operation = String(request.operation || "").trim().toUpperCase();
      transition = operation
        ? applyOfficialTimerControlOperation(current, normalizedRequest, {
            definition,
            expectedRevision,
            now: acceptedAtMs,
            actor,
            controller: request.controller,
            targetController: request.targetController,
            leaseMs: options.leaseMs,
            requireCommandId: true,
            source: request.source
          })
        : applyOfficialTimerCommand(current, normalizedRequest, {
            definition,
            expectedRevision,
            now: acceptedAtMs,
            actor,
            controller: request.controller,
            leaseMs: options.leaseMs,
            requireCommandId: true,
            enforceOwnership: true,
            autoClaim: true,
            source: request.source
          });
      if (!transition.ok) {
        failureReason = transition.reason;
        conflictTimer = transition.timer;
        return;
      }
      if (transition.idempotent) {
        conflictTimer = current;
        return;
      }
      return cleanUndefined({
        ...transition.timer,
        timerKey: normalizeFirebaseTimerKey(timerId),
        tournamentId,
        competitionId: String(definition.competitionId || transition.timer.competitionId || "equipos_completo"),
        charreadaId: String(definition.charreadaId || transition.timer.charreadaId || ""),
        teamId: String(definition.teamId || transition.timer.teamId || ""),
        participantId: String(definition.participantId || transition.timer.participantId || ""),
        suerteId: String(definition.suerteId || transition.timer.suerteId || ""),
        label: String(definition.label || transition.timer.label || transition.timer.contextType || "Cronometro oficial"),
        authorityAcceptedAt: acceptedAt,
        actor
      });
    }, { applyLocally: false });

    if (!transaction.committed && transition?.ok && transition.idempotent && conflictTimer) {
      const timer = normalizeOfficialTimerContext(conflictTimer, definition);
      const authorityAcceptedAt = timer.authorityAcceptedAt || timer.updatedAt;
      const authorityAcceptedAtMs = resolveFirebaseTimerNow(authorityAcceptedAt);
      return {
        ok: true,
        idempotent: true,
        path,
        timer,
        projection: buildOfficialTimerProjection(timer, { now: authorityAcceptedAtMs }),
        projectionResult: { ok: true, skipped: true },
        authorityAcceptedAt,
        authorityAcceptedAtMs
      };
    }

    if (!transaction.committed || !transition?.ok) {
      return {
        ok: false,
        conflict: true,
        reason: failureReason,
        expectedRevision: request.expectedRevision ?? options.expectedRevision,
        timer: transaction.snapshot?.exists()
          ? normalizeOfficialTimerContext(transaction.snapshot.val(), definition)
          : conflictTimer
      };
    }

    const timer = normalizeOfficialTimerContext(transaction.snapshot.val(), definition);
    const authorityAcceptedAt = timer.authorityAcceptedAt || acceptedAt;
    const authorityAcceptedAtMs = resolveFirebaseTimerNow(authorityAcceptedAt);
    const projection = buildOfficialTimerProjection(timer, { now: authorityAcceptedAtMs });
    let projectionResult = { ok: true };
    try {
      await writeLiveUpdate({
        timer: projection,
        "current/action": "official_timer_update",
        "current/timer": projection,
        firebaseUpdatedAt: authorityAcceptedAtMs,
        liveChannel: tournamentId,
        timestamp: authorityAcceptedAt
      }, tournamentId);
    } catch (error) {
      projectionResult = { ok: false, reason: normalizeFirebaseFailureReason(error) };
    }
    return {
      ok: true,
      idempotent: Boolean(transition.idempotent),
      path,
      timer,
      projection,
      projectionResult,
      authorityAcceptedAt,
      authorityAcceptedAtMs
    };
  } catch (error) {
    return {
      ok: false,
      reason: normalizeFirebaseFailureReason(error),
      detail: normalizeErrorDetail({ error }),
      timer: conflictTimer
    };
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
    let fallbackUnsubscribe = null;
    const unsubscribe = onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const payload = unpackLiveRootPayload(snapshot.val());
      if (payload) callback(payload);
    }, (error) => {
      if (normalizeFirebaseFailureReason(error) !== "permission-denied" || fallbackUnsubscribe) return;
      fallbackUnsubscribe = subscribePublicProjectionAsLegacyLive(liveChannel, callback);
    });
    return () => {
      unsubscribe();
      fallbackUnsubscribe?.();
    };
  } catch {
    return () => {};
  }
}

export function subscribeFirebaseLiveCurrent(tournamentId, callback) {
  let fallbackUnsubscribe = null;
  const unsubscribe = subscribeFirebaseOperationalLiveCurrent(tournamentId, callback, (liveChannel) => {
    if (fallbackUnsubscribe) return;
    fallbackUnsubscribe = subscribePublicProjectionAsLegacyLive(liveChannel, callback);
  });
  return () => {
    unsubscribe();
    fallbackUnsubscribe?.();
  };
}

function subscribeFirebaseOperationalLiveCurrent(tournamentId, callback, permissionFallback = null) {
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

      console.info("[live/current] actualización operativa recibida", {
        tournamentId: liveChannel,
        publishedScoreId,
        hasTurn: Boolean(current.turn?.team?.id || current.turn?.team?.name)
      });
      callback(current);
    }, (error) => {
      const reason = normalizeFirebaseFailureReason(error);
      console.error("[live/current] error de listener:", {
        path,
        reason
      });
      if (reason === "permission-denied" && permissionFallback) {
        permissionFallback(liveChannel);
        return;
      }
      callback(null, { ok: false, reason, detail: normalizeErrorDetail({ error }) });
    });
  } catch (error) {
    console.error("[live/current] error de listener:", {
      path,
      error
    });
    return () => {};
  }
}

function subscribePublicProjectionAsLegacyLive(tournamentId, callback) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return () => {};
  const path = `${PUBLIC_TOURNAMENTS_PATH}/${cleanTournamentId}`;
  return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
    const current = adaptPublicProjectionToLegacyLive(snapshot.val(), cleanTournamentId);
    if (current) callback(current);
  }, (error) => {
    callback(null, {
      ok: false,
      reason: normalizeFirebaseFailureReason(error),
      detail: normalizeErrorDetail({ error })
    });
  });
}

export function subscribePublicTournamentSnapshot(tournamentId, callback) {
  if (!isFirebaseLiveConfigured()) return () => {};

  const cleanTournamentId = normalizeLiveChannel(tournamentId || getLiveChannelFromUrl());
  const path = cleanTournamentId ? `${PUBLIC_TOURNAMENTS_PATH}/${cleanTournamentId}` : "";
  if (!path) return () => {};

  console.info("[publicTournament] ruta escuchada:", path);

  try {
    let hasValidSnapshot = false;
    let previouslyConnected = null;
    const unsubscribeProjection = onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      const payload = snapshot.val();
      hasValidSnapshot = Boolean(payload);
      callback(payload || null, {
        ok: Boolean(payload),
        exists: Boolean(payload),
        path,
        tournamentId: cleanTournamentId,
        connection: payload ? "online" : "connecting",
        event: "projection"
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
        connection: "error",
        event: "projection",
        detail: normalizeErrorDetail({ error })
      });
    });
    const unsubscribeConnection = onValue(ref(getFirebaseDatabase(), ".info/connected"), (snapshot) => {
      const connected = snapshot.val() === true;
      const connection = connected
        ? previouslyConnected === false && hasValidSnapshot ? "reconnecting" : hasValidSnapshot ? "online" : "connecting"
        : "offline";
      previouslyConnected = connected;
      callback(undefined, {
        ok: connected,
        exists: hasValidSnapshot,
        path,
        tournamentId: cleanTournamentId,
        connected,
        connection,
        event: "connection"
      });
    });
    return () => {
      unsubscribeProjection();
      unsubscribeConnection();
    };
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

export function buildPublicTournamentSnapshot(tournamentState = {}, options = {}) {
  const candidate = buildPublicProjection({
    tournament: tournamentState,
    liveCurrent: options.liveCurrent || {}
  }, {
    tournamentId: options.tournamentId,
    nowMs: options.nowMs
  });
  const result = reconcilePublicProjection(options.previous || null, candidate, { nowMs: options.nowMs });
  if (!result.ok || !result.projection) {
    throw new Error(result.reason || "public-projection-build-failed");
  }
  return result.projection;
}

function buildPublicTournamentSnapshotV1(tournamentState = {}) {
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
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  const path = `${PUBLIC_TOURNAMENTS_PATH}/${cleanTournamentId}`;
  let projected = false;
  let projectedRevision = 0;
  try {
    let source = tournamentState;
    if (!source) {
      const privateSnapshot = await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${cleanTournamentId}`));
      source = privateSnapshot.val() || null;
    }
    if (!source) {
      return { ok: false, reason: "missing-tournament-data", path };
    }

    const liveSnapshot = await get(ref(getFirebaseDatabase(), `${LIVE_ROOT_PATH}/${cleanTournamentId}/current`));
    const builtCandidate = buildPublicProjection({
      tournament: source,
      liveCurrent: liveSnapshot.val() || {}
    }, {
      tournamentId: cleanTournamentId,
      nowMs: options.nowMs
    });
    console.info("[public-core] snapshot build OK", {
      tournamentId: cleanTournamentId,
      schemaVersion: builtCandidate.schemaVersion
    });
    const candidateNormalization = normalizePublicProjectionForFirebase(builtCandidate, {
      rootPath: "snapshot"
    });
    if (!candidateNormalization.valid) {
      console.error("[public-core] snapshot normalize failed", {
        tournamentId: cleanTournamentId,
        issues: summarizePublicSnapshotIssues(candidateNormalization.issues)
      });
      return {
        ok: false,
        reason: "invalid-public-snapshot-firebase-compatibility",
        diagnostics: summarizePublicSnapshotIssues(candidateNormalization.issues),
        path
      };
    }
    const candidate = candidateNormalization.value;
    console.info("[public-core] snapshot normalize OK", {
      tournamentId: cleanTournamentId,
      normalizedPaths: summarizePublicSnapshotIssues(candidateNormalization.normalizedIssues)
    });
    let reconciliation = null;
    let prewriteValidation = null;
    const transaction = await runTransaction(ref(getFirebaseDatabase(), path), (current) => {
      reconciliation = reconcilePublicProjection(current, candidate, { nowMs: options.nowMs });
      if (!reconciliation.ok || !reconciliation.changed) return undefined;
      const normalized = normalizePublicProjectionForFirebase(reconciliation.projection, {
        rootPath: "snapshot"
      });
      const contractValidation = validatePublicProjection(normalized.value);
      const firebaseValidation = diagnosePublicProjectionFirebaseCompatibility(normalized.value, {
        rootPath: "snapshot"
      });
      prewriteValidation = {
        valid: normalized.valid && contractValidation.valid && firebaseValidation.valid,
        contractErrors: contractValidation.errors || [],
        firebaseIssues: firebaseValidation.issues || [],
        normalizedIssues: normalized.normalizedIssues || []
      };
      if (!prewriteValidation.valid) return undefined;
      reconciliation = { ...reconciliation, projection: normalized.value };
      return normalized.value;
    }, { applyLocally: false });
    if (prewriteValidation && !prewriteValidation.valid) {
      const diagnostics = summarizePublicSnapshotIssues(prewriteValidation.firebaseIssues);
      console.error("[public-core] snapshot validation failed", {
        tournamentId: cleanTournamentId,
        errors: prewriteValidation.contractErrors,
        issues: diagnostics
      });
      return {
        ok: false,
        reason: "invalid-public-projection",
        errors: prewriteValidation.contractErrors,
        diagnostics,
        path
      };
    }
    if (reconciliation && !reconciliation.ok) {
      return {
        ok: false,
        skipped: true,
        reason: reconciliation.reason,
        path,
        source: options.source || "",
        projectionRevision: reconciliation.projection?.projectionRevision || 0
      };
    }
    const projection = transaction.snapshot?.val() || reconciliation?.projection || null;
    const validation = projection
      ? validatePublicProjection(projection)
      : { valid: false, errors: ["missing-projection"] };
    const firebaseValidation = projection
      ? diagnosePublicProjectionFirebaseCompatibility(projection, { rootPath: "snapshot" })
      : { valid: false, issues: [{ path: "snapshot", reason: "missing-projection" }] };
    if (!validation.valid || !firebaseValidation.valid) {
      const diagnostics = summarizePublicSnapshotIssues(firebaseValidation.issues);
      console.error("[public-core] snapshot validation failed", {
        tournamentId: cleanTournamentId,
        errors: validation.errors,
        issues: diagnostics
      });
      return {
        ok: false,
        reason: "invalid-public-projection",
        errors: validation.errors,
        diagnostics,
        path
      };
    }
    console.info("[public-core] snapshot validation OK", {
      tournamentId: cleanTournamentId,
      publicSnapshotValidation: true
    });
    projected = true;
    projectedRevision = Number(projection.projectionRevision || 0);
    console.info("[public-core] snapshot write OK", {
      tournamentId: cleanTournamentId,
      committed: transaction.committed,
      projectionRevision: projectedRevision
    });
    const confirmationSnapshot = await get(ref(getFirebaseDatabase(), path));
    const confirmation = confirmationSnapshot.val() || null;
    const verification = verifyPublicProjectionConfirmation(projection, confirmation, cleanTournamentId);
    if (!verification.ok) {
      return {
        ok: false,
        projected: true,
        clientConfirmed: false,
        verified: false,
        reason: verification.reason,
        path,
        source: options.source || "",
        projectionRevision: projectedRevision,
        targetRevision: verification.targetRevision,
        sourceUpdatedAt: projection.sourceUpdatedAt || "",
        targetFingerprint: verification.targetFingerprint
      };
    }
    if (transaction.committed) publicSnapshotSetCount += 1;
    console.info("[public-foundation-001] projection publication", {
      tournamentId: cleanTournamentId,
      schemaVersion: projection.schemaVersion,
      projectionRevision: projection.projectionRevision,
      changedSections: reconciliation?.changedSections || [],
      result: transaction.committed ? "updated" : reconciliation?.reason || "unchanged",
      source: options.source || ""
    });
    console.info("[public-core] snapshot publish complete", {
      tournamentId: cleanTournamentId,
      projectionRevision: projection.projectionRevision,
      publicSnapshot: true
    });
    return {
      ok: true,
      projected: true,
      clientConfirmed: true,
      verified: false,
      verificationAuthority: "client-readback",
      skipped: !transaction.committed,
      reason: reconciliation?.reason || (transaction.committed ? "updated" : "unchanged"),
      path,
      source: options.source || "",
      projectionRevision: projection.projectionRevision,
      targetRevision: verification.targetRevision,
      sourceUpdatedAt: confirmation.sourceUpdatedAt || projection.sourceUpdatedAt || "",
      targetFingerprint: verification.targetFingerprint,
      changedSections: reconciliation?.changedSections || [],
      publicSnapshotValidation: true
    };
  } catch (error) {
    console.error("[public-core] snapshot publish failed", {
      path,
      source: options.source || "",
      reason: normalizeFirebaseFailureReason(error)
    });
    return {
      ok: false,
      projected,
      verified: false,
      projectionRevision: projectedRevision,
      reason: normalizeFirebaseFailureReason(error),
      detail: normalizeErrorDetail({ error }),
      path
    };
  }
}

function summarizePublicSnapshotIssues(issues = []) {
  return issues.slice(0, 20).map((issue) => ({
    path: issue.path || "snapshot",
    reason: issue.reason || "unknown",
    valueType: issue.valueType || "unknown",
    constructor: issue.constructor || null,
    prototype: issue.prototype || null
  }));
}

function verifyPublicProjectionConfirmation(expected, actual, tournamentId) {
  const validation = actual
    ? validatePublicProjection(actual)
    : { valid: false, errors: ["missing-projection"] };
  if (!validation.valid) {
    return {
      ok: false,
      reason: "public-projection-not-verified",
      targetRevision: Number(actual?.projectionRevision || 0),
      targetFingerprint: ""
    };
  }
  if (String(actual.metadata?.tournamentId || "") !== String(tournamentId || "")) {
    return {
      ok: false,
      reason: "projection-source-mismatch",
      targetRevision: Number(actual.projectionRevision || 0),
      targetFingerprint: ""
    };
  }
  const expectedFingerprint = getPublicProjectionSignature(expected);
  const targetFingerprint = getPublicProjectionSignature(actual);
  const expectedRevision = Number(expected?.projectionRevision || 0);
  const targetRevision = Number(actual?.projectionRevision || 0);
  const expectedSourceMs = Date.parse(expected?.sourceUpdatedAt || "") || 0;
  const targetSourceMs = Date.parse(actual?.sourceUpdatedAt || "") || 0;
  const exact = expectedFingerprint === targetFingerprint && targetRevision >= expectedRevision;
  const newer = targetRevision > expectedRevision && targetSourceMs >= expectedSourceMs;
  return {
    ok: exact || newer,
    reason: exact ? "verified" : newer ? "verified-newer-projection" : "public-projection-not-verified",
    expectedFingerprint,
    targetFingerprint,
    targetRevision
  };
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

  return dedupePublicScores(publishedScores)
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

export async function getFirebaseRuleProfileLifecycle(profileId, version, context = {}) {
  try {
    const callable = httpsCallable(getFirebaseFunctions(), "getCharroProRuleProfileLifecycle");
    const result = await callable(cleanUndefined({
      profileId: String(profileId || "").trim(),
      version: String(version || "").trim(),
      tenantId: String(context.tenantId || "").trim(),
      organizationId: String(context.organizationId || "").trim()
    }));
    return { ok: true, ...result.data };
  } catch (error) {
    return {
      ok: false,
      reason: error?.details?.reason || error?.code || error?.message || "functions-error"
    };
  }
}

export async function transitionFirebaseRuleProfileLifecycle(request = {}) {
  try {
    const callable = httpsCallable(getFirebaseFunctions(), "transitionCharroProRuleProfileLifecycle");
    const result = await callable(cleanUndefined({
      profileId: String(request.profileId || "").trim(),
      version: String(request.version || "").trim(),
      requestedTransition: String(request.requestedTransition || "").trim(),
      expectedRevision: Number(request.expectedRevision),
      idempotencyKey: String(request.idempotencyKey || "").trim(),
      effectiveFrom: request.effectiveFrom || null,
      effectiveTo: request.effectiveTo || null,
      reason: String(request.reason || "").trim(),
      tenantId: String(request.tenantId || "").trim(),
      organizationId: String(request.organizationId || "").trim()
    }));
    return { ok: true, ...result.data };
  } catch (error) {
    return {
      ok: false,
      reason: error?.details?.reason || error?.code || error?.message || "functions-error"
    };
  }
}

export async function assignFirebaseTournamentRuleProfile(request = {}) {
  try {
    const callable = httpsCallable(getFirebaseFunctions(), "assignCharroProTournamentRuleProfile");
    const result = await callable(cleanUndefined({
      tournamentId: String(request.tournamentId || "").trim(),
      profileId: String(request.profileId || "").trim(),
      version: String(request.version || "").trim(),
      expectedRevision: Number(request.expectedRevision),
      idempotencyKey: String(request.idempotencyKey || "").trim(),
      source: String(request.source || "explicit").trim(),
      policyId: String(request.policyId || "").trim(),
      reason: String(request.reason || "").trim(),
      tenantId: String(request.tenantId || "").trim(),
      organizationId: String(request.organizationId || "").trim()
    }));
    return { ok: true, ...result.data };
  } catch (error) {
    return {
      ok: false,
      reason: error?.details?.reason || error?.code || error?.message || "functions-error"
    };
  }
}

export async function readFirebasePreparationSnapshot(accessProfile = {}) {
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  try {
    const authUser = getFirebaseAuth().currentUser;
    if (!authUser?.uid) return { ok: false, reason: USER_ACCESS_BOOTSTRAP_ERROR.AUTH_NOT_LOGGED_IN };

    const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${authUser.uid}`));
    if (!profileSnapshot.exists()) {
      return { ok: false, reason: USER_ACCESS_BOOTSTRAP_ERROR.USER_PROFILE_MISSING, uid: authUser.uid, email: authUser.email || "" };
    }

    const rawProfile = profileSnapshot.val() || {};
    const profileValidation = buildUserAccessBootstrapPlan(rawProfile, {});
    if (!profileValidation.ok) {
      return {
        ...profileValidation,
        profile: {
          ...rawProfile,
          uid: authUser.uid,
          email: rawProfile.email || authUser.email || "",
          role: profileValidation.role || normalizeRole(rawProfile.role),
          active: rawProfile.active === true,
          ...normalizeTournamentAccess(rawProfile)
        }
      };
    }

    const userAccessPath = `charropro/userTournamentAccess/${authUser.uid}`;
    const userAccessSnapshot = await readFirebasePreparationPath(userAccessPath);
    const userTournamentAccess = userAccessSnapshot.val() || {};
    const plan = buildUserAccessBootstrapPlan(rawProfile, userTournamentAccess);
    const authorizedIds = plan.tournamentIds || [];
    const access = normalizeTournamentAccess(rawProfile);
    const profile = {
      ...rawProfile,
      uid: authUser.uid,
      email: rawProfile.email || authUser.email || "",
      role: plan.role || normalizeRole(rawProfile.role),
      active: rawProfile.active === true,
      ...access,
      tournamentIds: plan.globalIndexRead ? access.tournamentIds : authorizedIds
    };
    if (!plan.ok) return { ...plan, profile };

    const scopedResult = await readUserAccessBootstrapTournaments(plan, {
      readTournamentIndexRoot: async () => (await get(ref(getFirebaseDatabase(), TOURNAMENT_INDEX_PATH))).val() || {},
      readTournamentIndexItem: async (tournamentId) => (await get(ref(getFirebaseDatabase(), `${TOURNAMENT_INDEX_PATH}/${normalizeLiveChannel(tournamentId)}`))).val(),
      readTournament: async (tournamentId) => (await get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${normalizeLiveChannel(tournamentId)}`))).val(),
      isPermissionDenied: (error) => normalizeFirebaseFailureReason(error) === "permission-denied"
    });
    if (!scopedResult.ok) {
      return {
        ...scopedResult,
        profile,
        detail: normalizeErrorDetail({ error: scopedResult.error })
      };
    }

    const tournaments = Object.fromEntries(Object.entries(scopedResult.tournaments || {})
      .map(([id, value]) => [id, inflateTournamentStatePayload(id, value)]));
    const accessDiagnostics = diagnoseUserAccessBootstrap({
      uid: authUser.uid,
      profile,
      userTournamentAccess,
      result: { ...scopedResult, tournaments }
    });

    return {
      ok: true,
      status: scopedResult.status,
      profile,
      tournamentIndex: scopedResult.tournamentIndex,
      userTournamentAccess,
      tournaments,
      accessDiagnostics,
      syncedAt: new Date().toISOString(),
      syncedAtMs: Date.now()
    };
  } catch (error) {
    console.error("[CharroPro] readFirebasePreparationSnapshot failed", error);
    const permissionDenied = normalizeFirebaseFailureReason(error) === "permission-denied";
    return {
      ok: false,
      status: "ACCESS_ERROR",
      reason: permissionDenied
        ? USER_ACCESS_BOOTSTRAP_ERROR.BOOTSTRAP_READ_DENIED
        : USER_ACCESS_BOOTSTRAP_ERROR.SYNC_FAILED,
      deniedPath: String(error?.bootstrapPath || ""),
      detail: normalizeErrorDetail({ error })
    };
  }
}

async function readFirebasePreparationPath(path) {
  try {
    return await get(ref(getFirebaseDatabase(), path));
  } catch (error) {
    error.bootstrapPath = path;
    throw error;
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
        counts: buildTournamentRecordCounts({}),
        ids: buildTournamentRecordIds({})
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
      ids: buildTournamentRecordIds(record),
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

export async function writeFirebasePendingScoreReview(tournamentId, pendingReview, actor = {}, options = {}) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId || pendingReview?.tournamentId);
  const validation = validatePendingScoreReview(pendingReview);
  if (!cleanTournamentId) return { ok: false, reason: "missing-tournament" };
  if (!validation.valid) return { ok: false, reason: "invalid-pending-review", errors: validation.errors };
  if (validation.record.tournamentId !== cleanTournamentId) {
    return { ok: false, reason: "pending-review-tournament-conflict" };
  }
  if (!isFirebaseLiveConfigured()) return { ok: false, reason: "missing-firebase" };

  const expectedRevision = Math.max(0, Number(options.expectedRevision ?? validation.record.revision - 1));
  const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}/pendingScoreReviews/${validation.record.pendingId}`;
  const actorRecord = compactActor(actor);
  let conflictReason = "pending-review-revision-conflict";
  let idempotent = false;

  try {
    const transaction = await runTransaction(ref(getFirebaseDatabase(), path), (currentValue) => {
      if (!currentValue) {
        if (expectedRevision !== 0 || validation.record.revision !== 1) return;
        return validation.record;
      }

      const current = normalizePendingScoreReview(currentValue);
      if (
        current.pendingId !== validation.record.pendingId ||
        current.attemptKey !== validation.record.attemptKey ||
        current.tournamentId !== validation.record.tournamentId ||
        current.charreadaId !== validation.record.charreadaId
      ) {
        conflictReason = "pending-review-identity-conflict";
        return;
      }
      if (
        current.revision === validation.record.revision &&
        current.idempotencyKey === validation.record.idempotencyKey &&
        current.status === validation.record.status
      ) {
        idempotent = true;
        return currentValue;
      }
      if (current.revision !== expectedRevision || validation.record.revision !== expectedRevision + 1) return;
      return validation.record;
    }, { applyLocally: false });

    if (!transaction.committed) {
      return {
        ok: false,
        conflict: true,
        reason: conflictReason,
        expectedRevision,
        actor: actorRecord,
        record: transaction.snapshot?.exists()
          ? normalizePendingScoreReview(transaction.snapshot.val())
          : null
      };
    }
    return {
      ok: true,
      path,
      idempotent,
      expectedRevision,
      record: normalizePendingScoreReview(transaction.snapshot.val() || validation.record)
    };
  } catch (error) {
    return {
      ok: false,
      reason: normalizeFirebaseFailureReason(error),
      detail: normalizeErrorDetail({ error })
    };
  }
}

export async function publishFirebaseTournamentState(tournamentId, appState = {}, actor = {}) {
  if (!tournamentId || !isFirebaseLiveConfigured()) return { ok: false, reason: "missing-tournament" };

  try {
    const cleanTournamentId = normalizeLiveChannel(tournamentId);
    const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}`;
    const snapshot = await get(ref(getFirebaseDatabase(), path));
    const remoteRecord = snapshot.val() || {};
    const remote = remoteRecord.meta || {};
    const version = Number(remote.version || 0) + 1;
    const now = Date.now();
    const record = compactTournamentRecord(cleanTournamentId, appState);
    const scoreWriteGuard = buildCollectionIdGuard(
      remoteRecord.scores,
      record.scores,
      "publishFirebaseTournamentState:scores"
    );
    if (!scoreWriteGuard.ok) {
      console.warn("[firebase-sync] reemplazo destructivo de scores bloqueado", {
        tournamentId: cleanTournamentId,
        operation: scoreWriteGuard.operation,
        countRemote: scoreWriteGuard.countRemote,
        countProposed: scoreWriteGuard.countProposed,
        missingRemoteIds: scoreWriteGuard.missingRemoteIds,
        actor: compactActor(actor)
      });
      return {
        ok: false,
        reason: "remote-score-ids-missing",
        scoreWriteGuard
      };
    }
    const meta = {
      ...record.meta,
      version,
      updatedAt: new Date(now).toISOString(),
      updatedAtMs: now,
      updatedBy: compactActor(actor),
      updatedByName: actor.name || actor.email || "",
      clientId: actor.clientId || ""
    };
    const {
      scores: _proposedScores,
      pendingScoreReviews: _transactionalPendingScoreReviews,
      ...nonScoreRecord
    } = record;
    const payload = cleanUndefined({
      ...nonScoreRecord,
      meta
    });
    const payloadInfo = payload.info || {};
    const authoritativeInfo = {
      ...omitRuleProfileAssignmentFields(payloadInfo),
      ...pickRuleProfileAssignmentFields(remoteRecord.info || {})
    };
    const authoritativeRecord = cleanUndefined({
      ...payload,
      info: authoritativeInfo,
      meta: {
        ...meta,
        lastPublishedScore: remote.lastPublishedScore || null
      },
      scores: remoteRecord.scores || {},
      publishedScores: remoteRecord.publishedScores || {}
    });
    const { meta: payloadMeta, info: _payloadInfo, ...statePayload } = payload;
    for (const [key, value] of Object.entries(payloadMeta || {})) {
      statePayload[`meta/${key}`] = value;
    }
    const remoteInfo = remoteRecord.info || {};
    const clientInfo = omitRuleProfileAssignmentFields(payloadInfo);
    const clientInfoKeys = new Set([
      ...Object.keys(omitRuleProfileAssignmentFields(remoteInfo)),
      ...Object.keys(clientInfo)
    ]);
    for (const key of clientInfoKeys) {
      statePayload[`info/${key}`] = Object.hasOwn(clientInfo, key) ? clientInfo[key] : null;
    }

    await update(ref(getFirebaseDatabase(), path), statePayload);
    await update(
      ref(getFirebaseDatabase(), `${TOURNAMENT_INDEX_PATH}/${cleanTournamentId}`),
      omitRuleProfileAssignmentFields(compactTournamentIndex(authoritativeRecord))
    );
    const publicSnapshot = await publishPublicTournamentSnapshot(cleanTournamentId, authoritativeRecord, { source: "tournamentState" });
    return { ok: true, version, publicSnapshot, scoreWriteGuard };
  } catch (error) {
    console.error("[CharroPro] publishFirebaseTournamentState failed", {
      tournamentId,
      actor,
      error
    });
    return { ok: false, reason: error.message };
  }
}

function omitRuleProfileAssignmentFields(value = {}) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([key]) => !RULE_PROFILE_ASSIGNMENT_FIELDS.has(key))
  );
}

function pickRuleProfileAssignmentFields(value = {}) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([key]) => RULE_PROFILE_ASSIGNMENT_FIELDS.has(key))
  );
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
    }, (error) => callback({
      tournamentId: normalizeLiveChannel(tournamentId),
      error,
      reason: normalizeFirebaseFailureReason(error),
      updatedAtMs: Date.now()
    }));
  } catch (error) {
    callback({
      tournamentId: normalizeLiveChannel(tournamentId),
      error,
      reason: normalizeFirebaseFailureReason(error),
      updatedAtMs: Date.now()
    });
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

export function subscribeFirebasePendingScoreReviews(tournamentId, callback) {
  const cleanTournamentId = normalizeLiveChannel(tournamentId);
  if (!cleanTournamentId || !isFirebaseLiveConfigured()) return () => {};
  const path = `${TOURNAMENTS_PATH}/${cleanTournamentId}/pendingScoreReviews`;
  try {
    return onValue(ref(getFirebaseDatabase(), path), (snapshot) => {
      callback({
        tournamentId: cleanTournamentId,
        path,
        records: snapshot.val() || {},
        exists: snapshot.exists(),
        receivedAtMs: Date.now()
      });
    }, (error) => {
      callback({
        tournamentId: cleanTournamentId,
        path,
        records: {},
        exists: false,
        error,
        reason: normalizeFirebaseFailureReason(error),
        receivedAtMs: Date.now()
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
  const app = getFirebaseAppInstance();
  ensureLocalFirebaseEmulatorConnections(app);
  if (!databaseInstance) databaseInstance = getDatabase(app);
  return databaseInstance;
}

function getFirebaseAuth() {
  const app = getFirebaseAppInstance();
  ensureLocalFirebaseEmulatorConnections(app);
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
}

async function resolveAuthenticatedProjectionActor(actor = {}) {
  const auth = getFirebaseAuth();
  let uid = String(auth.currentUser?.uid || "").trim();
  if (!uid && typeof auth.authStateReady === "function") {
    await auth.authStateReady();
    uid = String(auth.currentUser?.uid || "").trim();
  }
  if (!uid) return null;
  return sanitizeProjectionActor({
    ...actor,
    uid
  });
}

async function getFirebaseBroadcastAuthenticatedUser() {
  const auth = getFirebaseAuth();
  if (typeof auth.authStateReady === "function") await auth.authStateReady();
  return auth.currentUser;
}

function getFirebaseFunctions() {
  const app = getFirebaseAppInstance();
  ensureLocalFirebaseEmulatorConnections(app);
  if (!functionsInstance) functionsInstance = getFunctions(app, FIREBASE_FUNCTIONS_REGION);
  return functionsInstance;
}

function getFirebaseAppInstance() {
  if (appInstance) return appInstance;

  if (FIREBASE_RUNTIME.environment === "local") {
    const existing = getApps().find((candidate) => candidate.name === FIREBASE_RUNTIME.appName) || null;
    if (existing && existing.options?.projectId !== FIREBASE_RUNTIME.projectId) {
      throw new Error("CharroPro Local fue bloqueado porque detecto configuracion de Produccion.");
    }
    appInstance = existing || initializeApp(FIREBASE_CONFIG, FIREBASE_RUNTIME.appName);
    return appInstance;
  }

  appInstance = getApps()[0] || initializeApp(FIREBASE_CONFIG);
  return appInstance;
}

function ensureLocalFirebaseEmulatorConnections(app) {
  if (FIREBASE_RUNTIME.environment !== "local" || localEmulatorConnections) return;

  const plan = buildFirebaseEmulatorConnectionPlan(FIREBASE_RUNTIME);
  try {
    authInstance = authInstance || getAuth(app);
    databaseInstance = databaseInstance || getDatabase(app);
    functionsInstance = functionsInstance || getFunctions(app, FIREBASE_FUNCTIONS_REGION);
    connectAuthEmulator(authInstance, plan.auth.url, { disableWarnings: true });
    connectDatabaseEmulator(databaseInstance, plan.database.host, plan.database.port);
    connectFunctionsEmulator(functionsInstance, plan.functions.host, plan.functions.port);
    localEmulatorConnections = Object.freeze({ ...plan });
    console.info("[firebase-local-runtime] emulators connected", getFirebaseRuntimeDiagnostics());
  } catch (error) {
    throw new Error(`CharroPro Local fue bloqueado porque no pudo conectar Emulator: ${error?.message || "unknown"}`);
  }
}

export function getFirebaseRuntimeDiagnostics() {
  return getFirebaseRuntimePublicDiagnostics(FIREBASE_RUNTIME, {
    connected: Boolean(localEmulatorConnections)
  });
}

async function resolveFirebaseBroadcastAccess(context, operation = "read") {
  const user = await getFirebaseBroadcastAuthenticatedUser();
  if (!user?.uid) throw firebaseBroadcastError("broadcast-auth-required");
  const profileSnapshot = await get(ref(getFirebaseDatabase(), `${USERS_PATH}/${user.uid}`));
  const profile = profileSnapshot.val() || {};
  const tournamentAssigned = await readFirebaseBroadcastTournamentAssignment(profile, user.uid, context.tournamentId);
  return validateFirebaseBroadcastProfileAccess(profile, user.uid, context, operation, { tournamentAssigned });
}

function validateFirebaseBroadcastProfileEligibility(profile = {}, operation = "read") {
  if (profile.active !== true) throw firebaseBroadcastError("broadcast-user-inactive");
  const role = normalizeRole(profile.role);
  const allowedRoles = operation === "publish"
    ? new Set(["supervisor", "graficos"])
    : new Set(["supervisor", "graficos"]);
  if (!allowedRoles.has(role)) throw firebaseBroadcastError("broadcast-permission-denied");
  return role;
}

function validateFirebaseBroadcastProfileAccess(profile, uid, context, operation = "read", options = {}) {
  const role = validateFirebaseBroadcastProfileEligibility(profile, operation);
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

async function resolveFirebaseBroadcastActiveTournamentId(profile = {}, uid = "") {
  const [indexSnapshot, userAccessSnapshot] = await Promise.all([
    get(ref(getFirebaseDatabase(), TOURNAMENT_INDEX_PATH)),
    get(ref(getFirebaseDatabase(), `charropro/userTournamentAccess/${uid}`))
  ]);
  const indexById = indexSnapshot.val() || {};
  const visibleIds = resolveVisibleTournamentIds(profile, profile, userAccessSnapshot.val() || {}, indexById);
  const orderedIds = [...visibleIds]
    .map(normalizeBroadcastContextId)
    .filter(Boolean)
    .sort((left, right) => {
      const updatedDiff = Number(indexById[right]?.updatedAtMs || 0) - Number(indexById[left]?.updatedAtMs || 0);
      return updatedDiff || left.localeCompare(right);
    });
  if (!orderedIds.length) throw firebaseBroadcastError("broadcast-context-unavailable");

  const candidates = (await Promise.all(orderedIds.map(async (tournamentId) => {
    const [tournamentSnapshot, liveSnapshot] = await Promise.all([
      get(ref(getFirebaseDatabase(), `${TOURNAMENTS_PATH}/${tournamentId}`)),
      get(ref(getFirebaseDatabase(), `${LIVE_ROOT_PATH}/${tournamentId}/current`))
    ]);
    const tournament = tournamentSnapshot.val() || {};
    const activeCharreadaId = normalizeBroadcastOptionalContextId(
      tournament.meta?.activeCharreadaId ||
        tournament.info?.activeCharreadaId ||
        tournament.tournamentState?.activeCharreadaId ||
        tournament.activeCharreadaId
    );
    const charreadas = arrayFromRecord(tournament.charreadas);
    if (!activeCharreadaId || !charreadas.some((entry) => normalizeBroadcastOptionalContextId(entry?.id) === activeCharreadaId)) {
      return null;
    }
    const live = liveSnapshot.val() || {};
    const liveTournamentId = normalizeBroadcastOptionalContextId(
      live.broadcastContract?.tournament?.id || live.tournament?.id || live.liveChannel
    );
    const liveCharreadaId = normalizeBroadcastOptionalContextId(
      live.broadcastContract?.charreada?.id || live.charreada?.id || live.activeCharreadaId
    );
    const liveMatches = liveTournamentId === tournamentId && liveCharreadaId === activeCharreadaId;
    return {
      tournamentId,
      activeCharreadaId,
      liveMatches,
      liveUpdatedAtMs: firebaseBroadcastTimestampMs(live.firebaseUpdatedAt || live.timestamp || live.generatedAt),
      indexUpdatedAtMs: Number(indexById[tournamentId]?.updatedAtMs || 0)
    };
  }))).filter(Boolean);
  if (!candidates.length) throw firebaseBroadcastError("broadcast-context-unavailable");

  const preferredIds = [
    profile.activeTournamentId,
    profile.currentTournamentId,
    profile.tournamentId
  ].map(normalizeBroadcastOptionalContextId).filter(Boolean);
  const preferred = preferredIds
    .map((id) => candidates.find((candidate) => candidate.tournamentId === id))
    .find(Boolean);
  if (preferred) return preferred.tournamentId;

  const liveCandidates = candidates
    .filter((candidate) => candidate.liveMatches)
    .sort((left, right) =>
      right.liveUpdatedAtMs - left.liveUpdatedAtMs ||
      right.indexUpdatedAtMs - left.indexUpdatedAtMs ||
      left.tournamentId.localeCompare(right.tournamentId)
    );
  if (liveCandidates.length) return liveCandidates[0].tournamentId;
  if (candidates.length === 1) return candidates[0].tournamentId;
  throw firebaseBroadcastError("broadcast-context-ambiguous");
}

function firebaseBroadcastTimestampMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firebaseBroadcastContextStatusFromError(error) {
  const code = String(error?.code || error?.message || "");
  if (["broadcast-auth-required", "broadcast-user-inactive", "broadcast-permission-denied", "broadcast-tournament-access-denied"].includes(code)) {
    return "unauthorized";
  }
  if (["broadcast-context-unavailable", "broadcast-context-ambiguous", "broadcast-context-mismatch"].includes(code)) {
    return "no_context";
  }
  if (/network|offline|disconnected|unavailable/i.test(code)) return "offline";
  return "error";
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

function normalizeFirebaseBroadcastRequestContext(value = {}, options = {}) {
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
  if (!context.tournamentId && options.allowMissingTournament !== true) throw firebaseBroadcastError("broadcast-context-missing");
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
  const charreadaIds = new Set(charreadas.map((charreada) => charreada.id).filter(Boolean));
  const scores = Object.fromEntries(
    Object.entries(appState.scores || {}).filter(([key]) => scoreKeyBelongsToTournament(key, charreadaIds))
  );
  const pendingScoreReviews = Object.fromEntries(
    Object.entries(appState.pendingScoreReviews || {})
      .map(([pendingId, record]) => [pendingId, normalizePendingScoreReview(record)])
      .filter(([, record]) => record.tournamentId === cleanTournamentId)
  );
  const history = (appState.statHistorySnapshots || []).filter((snapshot) =>
    (snapshot.tournament?.id || snapshot.tournamentId || "") === cleanTournamentId
  );

  return cleanUndefined({
    info: compactStoredTournament(tournament),
    teams: teams.map(compactStoredTeam),
    charreadas: charreadas.map(compactStoredCharreada),
    scores,
    pendingScoreReviews,
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
      liveTimer: compactTimer(appState.liveTimer)
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
    pendingScoreReviews: record.pendingScoreReviews || {},
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

function scoreKeyBelongsToTournament(key, charreadaIds) {
  const [charreadaId] = String(key || "").split("__");
  return charreadaIds.has(charreadaId);
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
    official: Boolean(timer.official),
    timerId: timer.timerId || timer.id || "",
    id: timer.id || timer.timerId || "",
    contextType: timer.contextType || "",
    label: timer.label || timer.limitLabel || "",
    status: timer.status || "",
    officialStatus: timer.officialStatus || "",
    revision: Number(timer.revision || 0),
    sourceRevision: Number(timer.sourceRevision ?? timer.revision ?? 0),
    tournamentId: timer.tournamentId || "",
    charreadaId: timer.charreadaId || "",
    teamId: timer.teamId || "",
    suerteId: timer.suerteId || "",
    attemptId: timer.attemptId || "",
    running: Boolean(timer.running),
    runningSince: timer.runningSince || null,
    startedAt: timer.startedAt || null,
    elapsedMs: Number(timer.elapsedMs || 0),
    officialElapsedMs: Number(timer.officialElapsedMs ?? timer.elapsedMs ?? 0),
    elapsedLiveMs: Number(timer.elapsedLiveMs || 0),
    displayMs: Number(timer.displayMs || 0),
    remainingMs: timer.remainingMs === null || timer.remainingMs === undefined ? null : Number(timer.remainingMs || 0),
    formatted: timer.formatted || "00:00.0",
    formattedTime: timer.formattedTime || timer.formatted || "00:00.0",
    display: timer.display || timer.formatted || "00:00.0",
    timeText: timer.timeText || timer.formattedTime || timer.formatted || "00:00.0",
    mode: timer.mode || "elapsed",
    limitMs: Number(timer.limitMs || 0),
    durationMs: Number(timer.durationMs ?? timer.limitMs ?? 0),
    limitLabel: timer.limitLabel || "",
    stateLabel: timer.stateLabel || "",
    expired: Boolean(timer.expired),
    scopeKey: timer.scopeKey || "",
    paused: Boolean(timer.paused),
    pausedAt: timer.pausedAt || null,
    stoppedAt: timer.stoppedAt || null,
    generatedAt: timer.generatedAt || null,
    contextRef: timer.contextRef || null,
    controllerType: timer.controllerType || null,
    pauseReason: timer.pauseReason || null,
    updatedAtMs: Number(timer.updatedAtMs || 0),
    clientId: timer.clientId || "",
    updatedAt: timer.updatedAt || null
  };
}

function normalizeFirebaseTimerKey(timerId) {
  return String(timerId || "")
    .trim()
    .replace(/[.#$\[\]/]/g, "_")
    .replace(/[^A-Za-z0-9_:@-]/g, "_")
    .slice(0, 240);
}

function compactTimerAuthorityActor(actor = {}) {
  return {
    id: String(actor.id || actor.uid || "").trim().slice(0, 160),
    name: String(actor.name || actor.displayName || "").trim().slice(0, 160),
    role: normalizeRole(actor.role)
  };
}

function resolveFirebaseTimerNow(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
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
    ledgerVersion: score.ledgerVersion || "",
    version: Number(score.version || 1),
    createdAt: score.createdAt || score.publishedAt || "",
    updatedAt: score.updatedAt || score.publishedAt || "",
    timestamp: score.timestamp || score.updatedAt || score.publishedAt || "",
    timestampMs: Number(score.timestampMs || 0),
    actor: score.actor || null,
    authUid: score.authUid || "",
    device: score.device || null,
    idempotencyKey: score.idempotencyKey || "",
    source: score.source || "",
    sourceFingerprint: score.sourceFingerprint || "",
    status: score.status || "",
    officialStatus: score.officialStatus || "",
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
    attemptV2: breakdown.attemptV2 || null,
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
