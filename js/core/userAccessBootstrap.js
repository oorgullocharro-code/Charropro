import { ROLES, normalizeRole, normalizeTournamentAccess } from "./roles.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

export const USER_ACCESS_BOOTSTRAP_STATUS = Object.freeze({
  READY: "READY",
  NO_ASSIGNMENTS: "NO_ASSIGNMENTS",
  INACTIVE: "INACTIVE",
  ROLE_REVIEW_REQUIRED: "ROLE_REVIEW_REQUIRED",
  ACCESS_ERROR: "ACCESS_ERROR"
});

export const USER_ACCESS_BOOTSTRAP_ERROR = Object.freeze({
  AUTH_NOT_LOGGED_IN: "AUTH_NOT_LOGGED_IN",
  USER_PROFILE_MISSING: "USER_PROFILE_MISSING",
  USER_INACTIVE: "USER_INACTIVE",
  ROLE_INVALID: "ROLE_INVALID",
  NO_TOURNAMENT_ASSIGNMENTS: "NO_TOURNAMENT_ASSIGNMENTS",
  TOURNAMENT_ACCESS_DENIED: "TOURNAMENT_ACCESS_DENIED",
  BOOTSTRAP_READ_DENIED: "BOOTSTRAP_READ_DENIED",
  SYNC_FAILED: "SYNC_FAILED"
});

export function validateUserAccessBootstrapProfile(profile = {}) {
  const rawRole = String(profile.role || "").trim().toLowerCase();
  const role = normalizeRole(profile.role);
  if (profile.active !== true) {
    return {
      ok: false,
      status: USER_ACCESS_BOOTSTRAP_STATUS.INACTIVE,
      reason: USER_ACCESS_BOOTSTRAP_ERROR.USER_INACTIVE,
      role
    };
  }
  const canonicalRoles = new Set(Object.values(ROLES).filter((value) => value !== ROLES.SIN_ACCESO));
  if (role === ROLES.SIN_ACCESO || !canonicalRoles.has(rawRole)) {
    return {
      ok: false,
      status: USER_ACCESS_BOOTSTRAP_STATUS.ROLE_REVIEW_REQUIRED,
      reason: USER_ACCESS_BOOTSTRAP_ERROR.ROLE_INVALID,
      role
    };
  }
  return { ok: true, role };
}

export function resolveUserAuthorizedTournamentIds(profile = {}, userTournamentAccess = {}) {
  const profileAccess = normalizeTournamentAccess(profile);
  return [...new Set([
    ...(profileAccess.tournamentIds || []),
    ...Object.entries(userTournamentAccess || {})
      .filter(([, enabled]) => enabled === true)
      .map(([tournamentId]) => tournamentId)
  ].map(normalizeTournamentId).filter(Boolean))].sort();
}

export function buildUserAccessBootstrapPlan(profile = {}, userTournamentAccess = {}) {
  const validation = validateUserAccessBootstrapProfile(profile);
  if (!validation.ok) return validation;

  const access = normalizeTournamentAccess(profile);
  const globalIndexRead = validation.role === ROLES.SUPERVISOR || access.tournamentAccess !== "selected";
  const tournamentIds = globalIndexRead
    ? []
    : resolveUserAuthorizedTournamentIds(profile, userTournamentAccess);

  return {
    ok: true,
    status: !globalIndexRead && tournamentIds.length === 0
      ? USER_ACCESS_BOOTSTRAP_STATUS.NO_ASSIGNMENTS
      : USER_ACCESS_BOOTSTRAP_STATUS.READY,
    role: validation.role,
    tournamentAccess: access.tournamentAccess,
    tournamentIds,
    globalIndexRead,
    paths: globalIndexRead
      ? ["charropro/tournamentIndex"]
      : tournamentIds.map((tournamentId) => `charropro/tournamentIndex/${tournamentId}`)
  };
}

export async function readUserAccessBootstrapTournaments(plan = {}, adapter = {}) {
  if (!plan.ok) return plan;
  if (plan.status === USER_ACCESS_BOOTSTRAP_STATUS.NO_ASSIGNMENTS) {
    return {
      ok: true,
      status: plan.status,
      tournamentIndex: [],
      tournaments: {},
      diagnostics: { readPaths: [], missingTournamentIds: [] }
    };
  }

  const readPaths = [];
  try {
    const indexRecords = plan.globalIndexRead
      ? await readGlobalTournamentIndex(adapter, readPaths)
      : await readScopedTournamentIndex(plan.tournamentIds, adapter, readPaths);
    const tournamentIndex = indexRecords
      .filter((item) => item?.id)
      .sort((left, right) => Number(right.updatedAtMs || 0) - Number(left.updatedAtMs || 0));
    const tournaments = {};

    await Promise.all(tournamentIndex.map(async (item) => {
      const tournamentId = normalizeTournamentId(item.id);
      if (!tournamentId) return;
      const path = `charropro/tournaments/${tournamentId}`;
      readPaths.push(path);
      let value;
      try {
        value = await adapter.readTournament(tournamentId);
      } catch (error) {
        error.bootstrapPath = path;
        throw error;
      }
      if (value) tournaments[tournamentId] = value;
    }));

    const loadedIds = new Set(tournamentIndex.map((item) => item.id));
    return {
      ok: true,
      status: tournamentIndex.length || plan.globalIndexRead
        ? USER_ACCESS_BOOTSTRAP_STATUS.READY
        : USER_ACCESS_BOOTSTRAP_STATUS.NO_ASSIGNMENTS,
      tournamentIndex,
      tournaments,
      diagnostics: {
        readPaths,
        missingTournamentIds: plan.globalIndexRead
          ? []
          : plan.tournamentIds.filter((tournamentId) => !loadedIds.has(tournamentId))
      }
    };
  } catch (error) {
    const deniedPath = String(error?.bootstrapPath || "");
    const permissionDenied = adapter.isPermissionDenied?.(error) === true;
    const tournamentPathDenied = deniedPath.includes("/tournamentIndex/") || deniedPath.includes("/tournaments/");
    return {
      ok: false,
      status: USER_ACCESS_BOOTSTRAP_STATUS.ACCESS_ERROR,
      reason: permissionDenied && tournamentPathDenied
        ? USER_ACCESS_BOOTSTRAP_ERROR.TOURNAMENT_ACCESS_DENIED
        : permissionDenied
          ? USER_ACCESS_BOOTSTRAP_ERROR.BOOTSTRAP_READ_DENIED
          : USER_ACCESS_BOOTSTRAP_ERROR.SYNC_FAILED,
      deniedPath,
      error
    };
  }
}

export function diagnoseUserAccessBootstrap({ uid = "", profile = {}, userTournamentAccess = {}, result = {} } = {}) {
  const plan = buildUserAccessBootstrapPlan(profile, userTournamentAccess);
  return {
    uid: String(uid || ""),
    authProfile: uid ? "PASS" : "FAIL",
    charroProProfile: Object.keys(profile || {}).length ? "PASS" : "FAIL",
    role: plan.role || normalizeRole(profile.role),
    active: profile.active === true,
    tournamentGrants: plan.tournamentIds?.length || 0,
    globalTournamentIndexRead: plan.globalIndexRead === true,
    tournamentRead: result.ok === true ? "PASS" : result.ok === false ? "FAIL" : "NOT_EXECUTED",
    scorerRead: result.ok === true && Object.keys(result.tournaments || {}).length ? "PASS" : "NOT_EXECUTED",
    deniedPath: result.deniedPath || "",
    status: result.status || plan.status || USER_ACCESS_BOOTSTRAP_STATUS.ACCESS_ERROR,
    reason: result.reason || plan.reason || ""
  };
}

async function readGlobalTournamentIndex(adapter, readPaths) {
  const path = "charropro/tournamentIndex";
  readPaths.push(path);
  try {
    const value = await adapter.readTournamentIndexRoot();
    return Object.values(value || {}).filter(Boolean);
  } catch (error) {
    error.bootstrapPath = path;
    throw error;
  }
}

async function readScopedTournamentIndex(tournamentIds, adapter, readPaths) {
  return (await Promise.all(tournamentIds.map(async (tournamentId) => {
    const path = `charropro/tournamentIndex/${tournamentId}`;
    readPaths.push(path);
    try {
      const value = await adapter.readTournamentIndexItem(tournamentId);
      return value ? { ...value, id: value.id || tournamentId } : null;
    } catch (error) {
      error.bootstrapPath = path;
      throw error;
    }
  }))).filter(Boolean);
}

function normalizeTournamentId(value) {
  const clean = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{1,240}$/.test(clean) ? clean : "";
}
