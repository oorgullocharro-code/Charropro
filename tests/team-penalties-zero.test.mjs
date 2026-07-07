import assert from "node:assert/strict";
import {
  calculateAttemptTotal,
  getAttemptTeamPenaltyTotal,
  getTeamCharreadaTotal,
  getTeamSuerteTotal,
  hasAttemptActivity
} from "../js/core/scoring.js";
import { emptyAttempt, scoreKey, state } from "../js/core/state.js?v=20260707-core-infra-001-versioning1";

const penalizedAttempt = {
  ...emptyAttempt(),
  base: 20,
  teamPenalties: [{ id: "equipo_infraccion_5", label: "Infraccion al equipo -5", pts: 5, quantity: 1, total: 5 }]
};

assert.equal(calculateAttemptTotal(penalizedAttempt), 20);
assert.equal(getAttemptTeamPenaltyTotal(penalizedAttempt), 5);

state.tournaments = [{ id: "torneo_prueba", name: "Prueba", type: "completo", ruleOverrides: {} }];
state.teams = [{ id: "equipo_prueba", tournamentId: "torneo_prueba", name: "Equipo Prueba", roster: {} }];
state.charreadas = [{ id: "charreada_prueba", tournamentId: "torneo_prueba", teamIds: ["equipo_prueba"] }];
state.scores = {
  [scoreKey("charreada_prueba", "equipo_prueba", "cala")]: [penalizedAttempt]
};

assert.equal(getTeamSuerteTotal("charreada_prueba", "equipo_prueba", "cala"), 20);
assert.equal(getTeamCharreadaTotal("charreada_prueba", "equipo_prueba"), 15);

const zeroAttempt = {
  ...emptyAttempt(),
  attempted: true,
  notAchieved: true
};

assert.equal(calculateAttemptTotal(zeroAttempt), 0);
assert.equal(hasAttemptActivity(zeroAttempt), true);

console.log("Team penalties and zero attempts tests passed");
