import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(String(key)) ?? null, setItem: (key, value) => storage.set(String(key), String(value)), removeItem: (key) => storage.delete(String(key)) };
const { getCharreadaScoringSuertes } = await import("../js/core/state.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1");

const tournament = {
  id: "latency-cache",
  type: "completo",
  ruleProfileId: "FMCH_2026_LIBRE",
  ruleProfileVersion: "0.6.0",
  ruleProfileAssignment: { authorityVersion: "1.0.0", tournamentId: "latency-cache", profileId: "FMCH_2026_LIBRE", version: "0.6.0", status: "active", contentFingerprint: "rptp_0f90f7a3944a82d7", revision: 1 }
};
const charreada = { id: "latency-cache-charreada", tournamentId: tournament.id, competitionType: "equipos_completo" };
const first = getCharreadaScoringSuertes(charreada, tournament);
const warm = getCharreadaScoringSuertes(charreada, tournament);
assert.equal(warm, first, "warm resolution keeps the latency cache");
tournament.ruleProfileAssignment.revision = 2;
const invalidated = getCharreadaScoringSuertes(charreada, tournament);
assert.notEqual(invalidated, first, "assignment revision invalidates the cache");
assert.equal(invalidated.length, 10);

const audit = JSON.parse(execFileSync(process.execPath, ["tools/performance/scorerLatencyAudit.mjs"], { encoding: "utf8" }));
assert.equal(audit.metricScope, "NODE_SYNTHETIC");
assert.equal(audit.afterPaintCoalescing.pass, true);
assert.equal(audit.duplicateTap.duplicateRejected, true);
console.log("latency-cache-regression.test.mjs: ok");
