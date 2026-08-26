import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildOfficialTimerDefinitionsFromContext } from "../js/core/timerRules.js?v=20260825-official-timer-live-context-001-v1";
import { resolveFmch2026PialesPreviousOpportunityTimerResolution } from "../js/data/fmch2026PialesColeaderoRules.js?v=20260825-official-timer-live-context-001-v1";
import { getOrCreateOfficialTimer, state } from "../js/core/state.js?v=20260825-official-timer-live-context-001-v1";

function context(suerteId, extra = {}) {
  return {
    tournament: {
      id: "t1",
      ruleProfileId: "FMCH_2026_LIBRE",
      ruleProfileVersion: "0.6.0",
      effectiveRulesFingerprint: "rptp_0f90f7a3944a82d7"
    },
    charreada: { id: "c1", name: "Charreada de prueba", competitionId: "equipos_completo" },
    turn: {
      competition: { id: "equipos_completo" },
      team: { id: "e1", name: "Rancho Los Laureles" },
      suerte: { id: suerteId, name: suerteId },
      attemptIndex: extra.attemptIndex || 0,
      coleadorIndex: extra.coleadorIndex || 0,
      previousOpportunityResolution: extra.previousOpportunityResolution
    }
  };
}

const cases = [
  ["cala", [180000, 120000]],
  ["piales", [120000]],
  ["colas", [20000]],
  ["toro", [300000]],
  ["lazo", [420000]],
  ["pial_ruedo", [420000]],
  ["yegua", [300000, 60000]],
  ["manganas_pie", [420000]],
  ["manganas_caballo", [120000, 420000]],
  ["paso", [180000, 60000]]
];
for (const [suerteId, durations] of cases) {
  const definitions = buildOfficialTimerDefinitionsFromContext(context(suerteId));
  assert.deepEqual(definitions.map((item) => item.durationMs), durations, suerteId);
  for (const definition of definitions) {
    assert.equal(definition.temporalPolicyStatus, "ACTIVE", suerteId);
    assert.equal(definition.teamName, "Rancho Los Laureles", suerteId);
    assert.ok(definition.phaseId, suerteId);
    assert.ok(definition.phaseLabel, suerteId);
    assert.ok(definition.timerRuleId, suerteId);
  }
}
const head = buildOfficialTimerDefinitionsFromContext(context("lazo"))[0];
const pial = buildOfficialTimerDefinitionsFromContext(context("pial_ruedo", { attemptIndex: 1 }))[0];
assert.equal(head.timerId, pial.timerId, "Terna keeps one shared authority across Cabecero and Pial");
state.officialTimers = {};
const sharedHead = getOrCreateOfficialTimer(head.timerId, head);
sharedHead.status = "PAUSED";
sharedHead.officialElapsedMs = 120000;
sharedHead.revision = 7;
const sharedPial = getOrCreateOfficialTimer(pial.timerId, pial);
assert.equal(sharedPial.phaseLabel, "Pial en el ruedo");
assert.equal(sharedPial.status, "PAUSED");
assert.equal(sharedPial.officialElapsedMs, 120000);
assert.equal(sharedPial.revision, 7, "changing Terna component context never restarts shared authority");
assert.equal(resolveFmch2026PialesPreviousOpportunityTimerResolution({ remateId: "remate_1", desc: false }), "COUNTED_PIAL");
assert.equal(resolveFmch2026PialesPreviousOpportunityTimerResolution({ remateId: "remate_1", desc: true, applied: ["piales_desc_rotura_reata"] }), "ROPE_BREAK_WITH_PIAL");
assert.equal(resolveFmch2026PialesPreviousOpportunityTimerResolution({ notAchieved: true }), "NO_EXTENSION");
const extendedPiales = buildOfficialTimerDefinitionsFromContext(context("piales", { attemptIndex: 1, previousOpportunityResolution: "COUNTED_PIAL" }))[0];
assert.equal(extendedPiales.durationMs, 180000);

const controlSource = readFileSync(new URL("../js/views/cronometro-control.js", import.meta.url), "utf8");
for (const field of ["charreada", "suerteLabel", "phaseLabel", "teamName", "participantName", "opportunityIndex", "timerRuleId", "durationMs", "temporalPolicyStatus"]) {
  assert.match(controlSource, new RegExp(field), field);
}
assert.doesNotMatch(controlSource, /autoStart|AUTO_START/);

console.log("official-timer-operator-context.test.mjs: ok");
