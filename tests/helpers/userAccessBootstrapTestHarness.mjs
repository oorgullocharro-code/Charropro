import {
  buildUserAccessBootstrapPlan,
  diagnoseUserAccessBootstrap,
  readUserAccessBootstrapTournaments
} from "../../js/core/userAccessBootstrap.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";

export const TOURNAMENT_A = "tournament-a";
export const TOURNAMENT_B = "tournament-b";
export const TOURNAMENT_C = "tournament-c";

export function profile(overrides = {}) {
  return {
    active: true,
    role: "juez",
    tournamentAccess: "selected",
    tournamentIds: [],
    ...overrides
  };
}

export function createBootstrapHarness({ indexes = {}, tournaments = {}, denied = [] } = {}) {
  const reads = [];
  const deniedPaths = new Set(denied);
  const read = (path, value) => {
    reads.push(path);
    if (deniedPaths.has(path)) {
      const error = new Error("PERMISSION_DENIED");
      error.code = "PERMISSION_DENIED";
      throw error;
    }
    return structuredClone(value ?? null);
  };

  return {
    reads,
    adapter: {
      readTournamentIndexRoot: () => read("charropro/tournamentIndex", indexes),
      readTournamentIndexItem: (id) => read(`charropro/tournamentIndex/${id}`, indexes[id]),
      readTournament: (id) => read(`charropro/tournaments/${id}`, tournaments[id]),
      isPermissionDenied: (error) => error?.code === "PERMISSION_DENIED"
    }
  };
}

export async function executeBootstrap(userProfile, grants, fixture = {}) {
  const plan = buildUserAccessBootstrapPlan(userProfile, grants);
  const harness = createBootstrapHarness(fixture);
  const result = plan.ok
    ? await readUserAccessBootstrapTournaments(plan, harness.adapter)
    : plan;
  const diagnostics = diagnoseUserAccessBootstrap({
    uid: "fixture-user",
    profile: userProfile,
    userTournamentAccess: grants,
    result
  });
  return { plan, result, diagnostics, reads: harness.reads };
}

export function tournamentIndex(id, updatedAtMs = 1) {
  return { id, name: id, status: "en_vivo", updatedAtMs };
}

export function tournamentRecord(id) {
  return { info: { id, name: id }, charreadas: {}, teams: {} };
}
