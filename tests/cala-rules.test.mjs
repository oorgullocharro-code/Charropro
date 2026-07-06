import assert from "node:assert/strict";
import {
  calculatePuntaBreakdown,
  migrateCalaAttempt,
  normalizeTeamPenalty,
  sumTeamPenalties
} from "../js/data/calaRules.js";

const puntaCases = [
  [5, 1, 0],
  [6, 1, 3],
  [7, 1, 4],
  [8, 1, 5],
  [9, 1, 6],
  [9, 2, 5],
  [9, 3, 4],
  [9, 4, 3],
  [9, 5, 0]
];

puntaCases.forEach(([metros, tiempos, expected]) => {
  assert.equal(
    calculatePuntaBreakdown({ puntaMetros: metros, puntaPiquetes: tiempos }).total,
    expected,
    `${metros}m / ${tiempos} tiempos`
  );
});

const ladoCompleto = { applied: ["ca2"], customAdic: [], customInfr: [] };
migrateCalaAttempt(ladoCompleto);
assert.deepEqual(ladoCompleto.applied.sort(), [
  "cala_lado_derecho_pivote",
  "cala_lado_derecho_velocidad"
].sort());
assert.equal(ladoCompleto.adic, 3);

const medioNormalizado = { applied: ["ca6"], customAdic: [], customInfr: [] };
migrateCalaAttempt(medioNormalizado);
assert.deepEqual(medioNormalizado.applied, ["cala_medio_derecho"]);
assert.equal(medioNormalizado.adic, 1);

const cejaLegacy = { applied: ["ca10"], customAdic: [], customInfr: [] };
migrateCalaAttempt(cejaLegacy);
assert.equal(cejaLegacy.applied.length, 0);
assert.equal(cejaLegacy.customAdic[0].legacyRule, true);
assert.equal(cejaLegacy.adic, 2);

const teamPenalty = normalizeTeamPenalty({
  id: "cala_equipo_revisor_no_compite"
});
assert.equal(teamPenalty.total, 5);
assert.equal(sumTeamPenalties({ teamPenalties: [teamPenalty] }), 5);

console.log("Cala rules tests passed");
