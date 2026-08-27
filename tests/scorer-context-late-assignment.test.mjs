import assert from "node:assert/strict";

installStorage();
const { applyProductiveRuleProfilePolicy } = await import("../js/core/productiveRuleProfilePolicy.js?v=20260826-fmch-2026-061-production-activation-v1");
const { SCORER_CONTEXT_STATUSES, resolveScorerContextState } = await import("../js/core/scorerContextResolution.js?v=20260826-fmch-2026-061-production-activation-v1");
const { getCharreadaCompetitionContext, getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260826-fmch-2026-061-production-activation-v1");

const delays = [0, 100, 500, 1500];
const results = await Promise.all(delays.map(runLateAssignment));
assert.equal(results.filter((result) => result.falseEmpty).length, 0);
assert.deepEqual(results.map((result) => result.status), delays.map(() => SCORER_CONTEXT_STATUSES.RESOLVED));
assert.deepEqual(results.map((result) => result.suertes), delays.map(() => 10));

console.log("scorer-context-late-assignment.test.mjs: ok");

async function runLateAssignment(delay) {
  const tournament = applyProductiveRuleProfilePolicy({ id: `late-${delay}`, category: "Libre", type: "completo" });
  const charreada = { id: `charreada-${delay}`, tournamentId: tournament.id, competitionType: "equipos_completo" };
  const before = resolve(tournament, charreada, false, { status: "pending" });
  const falseEmpty = [SCORER_CONTEXT_STATUSES.NO_SUERTES, SCORER_CONTEXT_STATUSES.UNSUPPORTED_COMPETITION].includes(before.status);
  await new Promise((accept) => setTimeout(accept, delay));
  Object.assign(tournament, assignmentFields(tournament.id));
  const after = resolve(tournament, charreada, true, null);
  return { delay, falseEmpty, status: after.status, suertes: after.availableSuertesCount };
}

function resolve(tournament, charreada, runtimeReady, assignmentRuntime) {
  const suertes = getCharreadaScoringSuertes(charreada, tournament);
  return resolveScorerContextState({ tournament, charreada, availableSuertesCount: suertes.length, competitionSuerteIds: getCharreadaCompetitionContext(charreada, tournament).suerteIds, runtimeReady, assignmentRuntime });
}

function assignmentFields(tournamentId) {
  const assignment = { authorityVersion: "1.0.0", tournamentId, profileId: "FMCH_2026_LIBRE", version: "0.6.0", status: "active", contentFingerprint: "rptp_0f90f7a3944a82d7", revision: 1, source: "productive-default" };
  return { ruleProfileId: assignment.profileId, ruleProfileVersion: assignment.version, ruleProfileStatus: assignment.status, ruleProfileContentFingerprint: assignment.contentFingerprint, ruleProfileAssignmentRevision: 1, ruleProfileAssignment: assignment };
}

function installStorage() {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
}
