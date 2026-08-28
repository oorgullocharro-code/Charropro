import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

installStorage();
const { applyProductiveRuleProfilePolicy } = await import("../js/core/productiveRuleProfilePolicy.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1");
const { SCORER_CONTEXT_STATUSES, resolveScorerContextState } = await import("../js/core/scorerContextResolution.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1");
const { getCharreadaCompetitionContext, getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1");

const tournament = applyProductiveRuleProfilePolicy({
  id: "new-libre-tournament",
  name: "Nuevo Libre",
  category: "Libre",
  type: "completo"
});
const team = { id: "team-a", tournamentId: tournament.id, name: "Equipo A" };
const charreada = {
  id: "new-libre-charreada",
  tournamentId: tournament.id,
  competitionType: "equipos_completo",
  teamIds: [team.id]
};

const before = context(tournament, { status: "pending" }, false);
assert.equal(before.status, SCORER_CONTEXT_STATUSES.ASSIGNMENT_PENDING);
assert.equal(before.canScore, false);
assert.notEqual(before.status, SCORER_CONTEXT_STATUSES.NO_SUERTES);

const failed = context(tournament, { status: "error", error: "tournament-rule-profile-platform-admin-required" }, true);
assert.equal(failed.status, SCORER_CONTEXT_STATUSES.ASSIGNMENT_ERROR);
assert.equal(failed.assignmentError, "tournament-rule-profile-platform-admin-required");

Object.assign(tournament, assignmentFields(tournament.id));
const after = context(tournament, null, true);
assert.equal(after.status, SCORER_CONTEXT_STATUSES.RESOLVED);
assert.equal(after.canScore, true);
assert.equal(after.availableSuertesCount, 10);
assert.equal(after.assignmentSource, "productive-default");

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const creationFlow = appSource.slice(appSource.indexOf("async function saveTournament"), appSource.indexOf("function applyRuleProfileAssignmentResult"));
assert.ok(creationFlow.indexOf("publishFirebaseTournamentState") < creationFlow.indexOf("assignRuleProfileToTournament"));
assert.ok(creationFlow.indexOf("assignRuleProfileToTournament") < creationFlow.lastIndexOf("closeModal()"));
assert.match(creationFlow, /tournamentCreationInProgress/);
assert.match(creationFlow, /platformAdmin !== true/);

console.log("new-tournament-fmch-scorer-readiness.test.mjs: ok");

function context(candidate, assignmentRuntime, runtimeReady) {
  const suertes = getCharreadaScoringSuertes(charreada, candidate);
  return resolveScorerContextState({
    tournament: candidate,
    charreada,
    availableSuertesCount: suertes.length,
    competitionSuerteIds: getCharreadaCompetitionContext(charreada, candidate).suerteIds,
    runtimeReady,
    assignmentRuntime
  });
}

function assignmentFields(tournamentId) {
  const assignment = {
    authorityVersion: "1.0.0",
    tournamentId,
    profileId: "FMCH_2026_LIBRE",
    version: "0.6.1",
    status: "active",
    contentFingerprint: "rptp_10e596046446e850",
    revision: 1,
    source: "productive-default",
    policyId: "fmch-2026-libre-productive-default-v2"
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
  globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
}
