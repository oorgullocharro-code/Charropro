import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

installStorage();
const { applyProductiveRuleProfilePolicy } = await import("../js/core/productiveRuleProfilePolicy.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1");
const { SCORER_CONTEXT_STATUSES, resolveScorerContextState } = await import("../js/core/scorerContextResolution.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1");
const { getCharreadaCompetitionContext, getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1");

const tournament = applyProductiveRuleProfilePolicy({ id: "supervisor-production", category: "Libre", type: "completo" });
Object.assign(tournament, assignmentFields(tournament.id));
const charreada = { id: "supervisor-charreada", tournamentId: tournament.id, competitionType: "equipos_completo", teamIds: ["team-a"] };
const suertes = getCharreadaScoringSuertes(charreada, tournament);
const resolution = resolveScorerContextState({
  tournament,
  charreada,
  availableSuertesCount: suertes.length,
  competitionSuerteIds: getCharreadaCompetitionContext(charreada, tournament).suerteIds,
  runtimeReady: true
});

assert.equal(resolution.status, SCORER_CONTEXT_STATUSES.RESOLVED);
assert.equal(resolution.canScore, true, "the sports catalog is independent from the supervisor label after access is authorized");
assert.equal(resolution.availableSuertesCount, 10);

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /debugScorerContext/);
assert.match(appSource, /Perfil reglamentario sin asignar/);
assert.match(appSource, /Cargando configuracion reglamentaria/);
assert.match(appSource, /Asignacion reglamentaria invalida/);
assert.match(appSource, /copy-scorer-context/);
assert.equal((appSource.match(/Sin suertes calificables/g) || []).length, 1, "the generic empty label is reserved for a truly unsupported competition");
assert.doesNotMatch(appSource.slice(appSource.indexOf("function buildScorerContextDiagnostics"), appSource.indexOf("function copyScorerContextDiagnostics")), /email|token|secret|password/i);

console.log("production-supervisor-scorer-context.test.mjs: ok");

function assignmentFields(tournamentId) {
  const assignment = { authorityVersion: "1.0.0", tournamentId, profileId: "FMCH_2026_LIBRE", version: "0.6.0", status: "active", contentFingerprint: "rptp_0f90f7a3944a82d7", revision: 1, source: "explicit" };
  return { ruleProfileId: assignment.profileId, ruleProfileVersion: assignment.version, ruleProfileStatus: assignment.status, ruleProfileContentFingerprint: assignment.contentFingerprint, ruleProfileAssignmentRevision: 1, ruleProfileAssignment: assignment };
}

function installStorage() {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
}
