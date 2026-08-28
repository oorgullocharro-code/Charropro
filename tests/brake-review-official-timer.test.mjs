import assert from "node:assert/strict";
import { FMCH_2026_LIBRE_PROFILE_0_6_1 } from "../js/data/ruleProfiles.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { buildOfficialTimerDefinitionsFromContext } from "../js/core/timerRules.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

const definitions = buildOfficialTimerDefinitionsFromContext({
  tournament: {
    id: "tournament-fixture",
    ruleProfileId: "FMCH_2026_LIBRE",
    ruleProfileVersion: "0.6.1",
    ruleProfileContentFingerprint: "rptp_10e596046446e850"
  },
  charreada: { id: "charreada-fixture", competitionId: "equipos_completo" },
  turn: {
    team: { id: "team-fixture", name: "Equipo Fixture", participantName: "Calador", horseName: "Caballo" },
    suerte: { id: "cala", name: "Cala", ruleResolution: { profile: FMCH_2026_LIBRE_PROFILE_0_6_1 } },
    attemptIndex: 0
  }
});
const brake = definitions.find((definition) => definition.phaseId === "freno_review");
const cala = definitions.find((definition) => definition.phaseId === "partidero_start");
assert.ok(brake);
assert.ok(cala);
assert.notEqual(brake.timerId, cala.timerId);
assert.equal(brake.durationMs, 180000);
assert.equal(brake.timerRuleId, "fmch_2026_cala_freno_review");
assert.equal(brake.temporalFingerprint, "fmchtp_7d1e001181026f6d");
assert.equal(brake.horseName, "Caballo");
console.log("brake-review-official-timer.test.mjs: ok");
