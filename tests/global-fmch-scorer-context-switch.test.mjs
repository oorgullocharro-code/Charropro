import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
const { getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1");

const assignment = (id) => ({ authorityVersion: "1.0.0", tournamentId: id, profileId: "FMCH_2026_LIBRE", version: "0.6.0", status: "active", contentFingerprint: "rptp_0f90f7a3944a82d7", revision: 1 });
const tournamentA = { id: "tournament-a", type: "completo", ruleProfileId: "FMCH_2026_LIBRE", ruleProfileVersion: "0.6.0", ruleProfileAssignment: assignment("tournament-a") };
const tournamentB = { id: "tournament-b", type: "caladero", ruleProfileId: "FMCH_2026_LIBRE", ruleProfileVersion: "0.6.0", ruleProfileAssignment: assignment("tournament-b") };
const charreadaA = { id: "charreada-a", tournamentId: tournamentA.id, competitionType: "equipos_completo" };
const charreadaB = { id: "charreada-b", tournamentId: tournamentB.id, competitionType: "caladero" };

assert.equal(getCharreadaScoringSuertes(charreadaA, tournamentA).length, 10);
assert.deepEqual(getCharreadaScoringSuertes(charreadaB, tournamentB).map((suerte) => suerte.id), ["cala"]);
assert.equal(getCharreadaScoringSuertes(charreadaA, tournamentA).length, 10);
console.log("global-fmch-scorer-context-switch.test.mjs: ok");
