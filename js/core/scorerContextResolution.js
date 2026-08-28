import { resolveRuleProfileSelection } from "../data/ruleProfiles.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { resolveProductiveRuleProfileDefault } from "./productiveRuleProfilePolicy.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

export const SCORER_CONTEXT_RESOLUTION_VERSION = "1.0.0";

export const SCORER_CONTEXT_STATUSES = Object.freeze({
  LOADING: "LOADING_CONTEXT",
  ASSIGNMENT_REQUIRED: "PROFILE_ASSIGNMENT_REQUIRED",
  ASSIGNMENT_PENDING: "PROFILE_ASSIGNMENT_PENDING",
  ASSIGNMENT_ERROR: "PROFILE_ASSIGNMENT_ERROR",
  ASSIGNMENT_INVALID: "PROFILE_ASSIGNMENT_INVALID",
  PROFILE_ERROR: "PROFILE_RESOLUTION_ERROR",
  UNSUPPORTED_COMPETITION: "UNSUPPORTED_COMPETITION",
  NO_SUERTES: "NO_SCORING_SUERTES",
  RESOLVED: "PROFILE_RESOLVED"
});

const ASSIGNMENT_DIAGNOSTICS = new Set([
  "profile-assignment-invalid",
  "profile-assignment-fingerprint-mismatch"
]);

export function resolveScorerContextState({
  tournament = null,
  charreada = null,
  availableSuertesCount = 0,
  competitionSuerteIds = [],
  runtimeReady = true,
  runtimeError = "",
  assignmentRuntime = null,
  profileOptions = {}
} = {}) {
  const productiveDefault = resolveSafeProductiveDefault(tournament?.category);
  const assignment = tournament?.ruleProfileAssignment || null;
  const assignmentExists = Boolean(assignment);
  const assignmentState = normalizeAssignmentRuntime(assignmentRuntime);
  const base = {
    contractVersion: SCORER_CONTEXT_RESOLUTION_VERSION,
    status: SCORER_CONTEXT_STATUSES.LOADING,
    canScore: false,
    loading: true,
    tournamentId: String(tournament?.id || ""),
    charreadaId: String(charreada?.id || ""),
    competitionType: String(charreada?.competitionType || tournament?.type || ""),
    category: String(tournament?.category || ""),
    assignmentExists,
    assignmentSource: String(assignment?.source || ""),
    assignmentStatus: String(assignment?.status || ""),
    assignmentRevision: finiteInteger(assignment?.revision ?? tournament?.ruleProfileAssignmentRevision),
    assignmentProfileId: String(assignment?.profileId || tournament?.ruleProfileId || ""),
    assignmentProfileVersion: String(assignment?.version || tournament?.ruleProfileVersion || ""),
    assignmentFingerprint: String(assignment?.contentFingerprint || tournament?.ruleProfileContentFingerprint || ""),
    assignmentRuntimeStatus: assignmentState.status,
    assignmentError: assignmentState.error,
    productiveDefaultAvailable: Boolean(productiveDefault),
    productiveDefaultProfileId: String(productiveDefault?.profileId || ""),
    productiveDefaultProfileVersion: String(productiveDefault?.version || ""),
    profileResolved: false,
    profileId: "",
    profileVersion: "",
    profileStatus: "",
    profileFingerprint: "",
    availableSuertesCount: Math.max(0, finiteInteger(availableSuertesCount)),
    diagnostics: []
  };

  if (!tournament || !charreada) return base;

  if (runtimeError && !assignmentExists) {
    return finish({
      ...base,
      diagnostics: [{ code: String(runtimeError).slice(0, 240), severity: "error" }]
    }, SCORER_CONTEXT_STATUSES.PROFILE_ERROR);
  }

  if (!assignmentExists && tournament.ruleProfilePolicyRequired === true && assignmentState.status !== "idle") {
    if (assignmentState.status === "pending") {
      return finish(base, SCORER_CONTEXT_STATUSES.ASSIGNMENT_PENDING);
    }
    return finish(base, SCORER_CONTEXT_STATUSES.ASSIGNMENT_ERROR);
  }
  if (!runtimeReady && !assignmentExists) return base;

  if (!assignmentExists && tournament.ruleProfilePolicyRequired === true) {
    return finish(base, SCORER_CONTEXT_STATUSES.ASSIGNMENT_REQUIRED);
  }

  let selection;
  try {
    selection = resolveRuleProfileSelection(tournament, profileOptions);
  } catch (error) {
    return finish({
      ...base,
      diagnostics: [{ code: String(error?.message || "profile-resolution-error"), severity: "error" }]
    }, SCORER_CONTEXT_STATUSES.PROFILE_ERROR);
  }

  const diagnostics = Array.isArray(selection?.diagnostics) ? selection.diagnostics : [];
  const consistencyDiagnostics = validateAssignmentConsistency(tournament, assignment);
  const allDiagnostics = [...diagnostics, ...consistencyDiagnostics];
  const selectedProfile = selection?.profile || null;
  const resolved = {
    ...base,
    profileResolved: Boolean(selection?.valid && !selection?.blocked),
    profileId: String(selectedProfile?.profileId || tournament?.ruleProfileId || ""),
    profileVersion: String(selectedProfile?.version || tournament?.ruleProfileVersion || ""),
    profileStatus: String(selectedProfile?.status || tournament?.ruleProfileStatus || ""),
    profileFingerprint: String(assignment?.contentFingerprint || tournament?.ruleProfileContentFingerprint || ""),
    diagnostics: allDiagnostics
  };

  if (consistencyDiagnostics.length || allDiagnostics.some((item) => ASSIGNMENT_DIAGNOSTICS.has(item?.code))) {
    return finish(resolved, SCORER_CONTEXT_STATUSES.ASSIGNMENT_INVALID);
  }
  if (selection?.blocked || !selection?.valid) {
    return finish(resolved, SCORER_CONTEXT_STATUSES.PROFILE_ERROR);
  }
  if (!Array.isArray(competitionSuerteIds) || !competitionSuerteIds.length) {
    return finish(resolved, SCORER_CONTEXT_STATUSES.UNSUPPORTED_COMPETITION);
  }
  if (resolved.availableSuertesCount === 0) {
    return finish(resolved, SCORER_CONTEXT_STATUSES.NO_SUERTES);
  }
  return {
    ...finish(resolved, SCORER_CONTEXT_STATUSES.RESOLVED),
    canScore: true,
    loading: false
  };
}

export function isScorerContextReady(resolution = {}) {
  return resolution.status === SCORER_CONTEXT_STATUSES.RESOLVED && resolution.canScore === true;
}

function finish(base, status) {
  return { ...base, status, loading: status === SCORER_CONTEXT_STATUSES.LOADING };
}

function resolveSafeProductiveDefault(category) {
  try {
    return resolveProductiveRuleProfileDefault(category);
  } catch {
    return null;
  }
}

function normalizeAssignmentRuntime(value) {
  const status = ["pending", "error"].includes(value?.status) ? value.status : "idle";
  return {
    status,
    error: status === "error" ? String(value?.error || "assignment-failed").slice(0, 240) : ""
  };
}

function validateAssignmentConsistency(tournament, assignment) {
  if (!assignment) return [];
  const mismatches = [];
  const checks = [
    ["profileId", tournament?.ruleProfileId, assignment.profileId],
    ["version", tournament?.ruleProfileVersion, assignment.version],
    ["status", tournament?.ruleProfileStatus, assignment.status],
    ["contentFingerprint", tournament?.ruleProfileContentFingerprint, assignment.contentFingerprint]
  ];
  checks.forEach(([field, topLevel, nested]) => {
    if (topLevel !== undefined && topLevel !== null && String(topLevel) !== String(nested || "")) {
      mismatches.push({ code: "profile-assignment-state-mismatch", severity: "error", field });
    }
  });
  const topRevision = tournament?.ruleProfileAssignmentRevision;
  if (topRevision !== undefined && topRevision !== null && Number(topRevision) !== Number(assignment.revision)) {
    mismatches.push({ code: "profile-assignment-revision-mismatch", severity: "error", field: "revision" });
  }
  return mismatches;
}

function finiteInteger(value) {
  const number = Number(value || 0);
  return Number.isSafeInteger(number) ? number : 0;
}
