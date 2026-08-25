import assert from "node:assert/strict";

installStorage();
const { applyProductiveRuleProfilePolicy, resolveProductiveRuleProfileDefault } = await import("../js/core/productiveRuleProfilePolicy.js?v=20260824-production-supervisor-scorer-context-001-v1");
const { SCORER_CONTEXT_STATUSES, resolveScorerContextState } = await import("../js/core/scorerContextResolution.js?v=20260824-production-supervisor-scorer-context-001-v1");
const { getCharreadaScoringSuertes, getCharreadaCompetitionContext } = await import("../js/core/state.js?v=20260824-production-supervisor-scorer-context-001-v1");

const policy = resolveProductiveRuleProfileDefault("Libre");
const tournament = applyProductiveRuleProfilePolicy({ id: "assignment-contract", category: "Libre", type: "completo" });
const charreada = { id: "assignment-charreada", tournamentId: tournament.id, competitionType: "equipos_completo" };

const pending = resolve(tournament);
assert.equal(pending.status, SCORER_CONTEXT_STATUSES.ASSIGNMENT_REQUIRED);
assert.equal(pending.productiveDefaultAvailable, true);
assert.equal(pending.productiveDefaultProfileId, policy.profileId);
assert.equal(pending.canScore, false);

const assigned = { ...tournament, ...assignmentFields(tournament.id) };
const explicit = resolve(assigned);
assert.equal(explicit.status, SCORER_CONTEXT_STATUSES.RESOLVED);
assert.equal(explicit.assignmentExists, true);
assert.equal(explicit.assignmentSource, "explicit");
assert.equal(explicit.availableSuertesCount, 10);

const invalid = structuredClone(assigned);
invalid.ruleProfileAssignment.contentFingerprint = "rptp_invalid";
assert.equal(resolve(invalid).status, SCORER_CONTEXT_STATUSES.ASSIGNMENT_INVALID);

const retired = structuredClone(assigned);
retired.ruleProfileAssignment.status = "retired";
retired.ruleProfileStatus = "retired";
assert.equal(resolve(retired).status, SCORER_CONTEXT_STATUSES.ASSIGNMENT_INVALID);

const revisionMismatch = structuredClone(assigned);
revisionMismatch.ruleProfileAssignmentRevision = 2;
assert.equal(resolve(revisionMismatch).status, SCORER_CONTEXT_STATUSES.ASSIGNMENT_INVALID);

const unsupported = resolveScorerContextState({
  tournament: assigned,
  charreada: { ...charreada, competitionType: "unknown" },
  availableSuertesCount: 0,
  competitionSuerteIds: [],
  runtimeReady: true
});
assert.equal(unsupported.status, SCORER_CONTEXT_STATUSES.UNSUPPORTED_COMPETITION);

console.log("tournament-profile-assignment-contract.test.mjs: ok");

function resolve(candidate) {
  const suertes = getCharreadaScoringSuertes(charreada, candidate);
  return resolveScorerContextState({
    tournament: candidate,
    charreada,
    availableSuertesCount: suertes.length,
    competitionSuerteIds: getCharreadaCompetitionContext(charreada, candidate).suerteIds,
    runtimeReady: true
  });
}

function assignmentFields(tournamentId, source = "explicit") {
  const assignment = {
    authorityVersion: "1.0.0",
    tournamentId,
    profileId: "FMCH_2026_LIBRE",
    version: "0.6.0",
    status: "active",
    contentFingerprint: "rptp_0f90f7a3944a82d7",
    revision: 1,
    source
  };
  return {
    ruleProfileId: assignment.profileId,
    ruleProfileVersion: assignment.version,
    ruleProfileStatus: assignment.status,
    ruleProfileContentFingerprint: assignment.contentFingerprint,
    ruleProfileAssignmentRevision: assignment.revision,
    ruleProfileAssignment: assignment
  };
}

function installStorage() {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(String(key)) ?? null,
    setItem: (key, value) => storage.set(String(key), String(value)),
    removeItem: (key) => storage.delete(String(key))
  };
}
