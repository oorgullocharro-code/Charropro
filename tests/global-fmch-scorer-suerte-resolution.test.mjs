import assert from "node:assert/strict";

installStorage();
const { resolveProductiveRuleProfileDefault } = await import("../js/core/productiveRuleProfilePolicy.js?v=20260825-official-timer-live-context-001-v1");
const { getCharreadaCompetitionContext, getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260825-official-timer-live-context-001-v1");

const tournament = assignedTournament("global-team");
const charreada = { id: "charreada-team", tournamentId: tournament.id, competitionType: "Competencia por equipos", teamIds: ["team-a"] };
const context = getCharreadaCompetitionContext(charreada, tournament);
const suertes = getCharreadaScoringSuertes(charreada, tournament).map((suerte) => suerte.id);

assert.equal(context.competitionType, "equipos_completo");
assert.equal(context.isTeamCompetition, true);
assert.deepEqual(suertes, ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"]);
console.log("global-fmch-scorer-suerte-resolution.test.mjs: ok");

function assignedTournament(id) {
  const policy = resolveProductiveRuleProfileDefault("Libre");
  return {
    id,
    type: "completo",
    category: "Libre",
    ruleProfilePolicyRequired: true,
    ruleProfilePolicy: policy,
    ruleProfileId: policy.profileId,
    ruleProfileVersion: policy.version,
    ruleProfileAssignment: {
      authorityVersion: "1.0.0",
      tournamentId: id,
      profileId: policy.profileId,
      version: policy.version,
      status: "active",
      contentFingerprint: "rptp_0f90f7a3944a82d7",
      revision: 1
    }
  };
}

function installStorage() {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
}
