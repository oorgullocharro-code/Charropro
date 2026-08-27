import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
const { getCharreadaCompetitionContext, getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1");

const tournament = { id: "unsupported-tournament", type: "completo" };
const charreada = { id: "unsupported-charreada", tournamentId: tournament.id, competitionType: "unsupported_remote_mode" };
const context = getCharreadaCompetitionContext(charreada, tournament);

assert.equal(context.competitionType, "");
assert.equal(context.suerteIds.length, 0);
assert.deepEqual(getCharreadaScoringSuertes(charreada, tournament), []);
console.log("global-fmch-scorer-unsupported-competition.test.mjs: ok");
