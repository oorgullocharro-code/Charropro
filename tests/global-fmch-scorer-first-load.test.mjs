import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
const { resolveProductiveRuleProfileDefault } = await import("../js/core/productiveRuleProfilePolicy.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1");
const { getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1");

const policy = resolveProductiveRuleProfileDefault("Libre");
const tournament = {
  id: "first-load-team",
  type: "completo",
  category: "Libre",
  ruleProfilePolicyRequired: true,
  ruleProfilePolicy: policy,
  ruleProfileId: policy.profileId,
  ruleProfileVersion: policy.version
};
const charreada = { id: "first-load-charreada", tournamentId: tournament.id, competitionType: "equipos_completo" };

assert.deepEqual(getCharreadaScoringSuertes(charreada, tournament), [], "pending assignment is not a valid scoring catalog");
tournament.ruleProfileAssignment = {
  authorityVersion: "1.0.0",
  tournamentId: tournament.id,
  profileId: policy.profileId,
  version: policy.version,
  status: "active",
  contentFingerprint: "rptp_10e596046446e850",
  revision: 1
};
assert.equal(getCharreadaScoringSuertes(charreada, tournament).length, 10, "the same runtime object must recover after assignment arrives");
console.log("global-fmch-scorer-first-load.test.mjs: ok");
