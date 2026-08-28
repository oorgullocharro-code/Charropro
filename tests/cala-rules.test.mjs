import assert from "node:assert/strict";
import {
  FMCH_2026_CALA_DESC_RULES,
  FMCH_2026_CALA_INFR_RULES,
  calculatePuntaBreakdown,
  migrateCalaAttempt,
  normalizeTeamPenalty,
  sumTeamPenalties
} from "../js/data/calaRules.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";

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

for (let centimeters = 0; centimeters <= 9000; centimeters += 1) {
  for (let times = 1; times <= 5; times += 1) {
    const breakdown = calculatePuntaBreakdown({
      puntaMetros: centimeters / 100,
      puntaPiquetes: times
    });
    assert.equal(
      breakdown.puntosDistancia + breakdown.puntosTiempos,
      breakdown.total,
      `P + T at ${centimeters / 100}m / ${times} tiempos`
    );
  }
}

assert.equal(FMCH_2026_CALA_INFR_RULES.length, 43);
assert.equal(FMCH_2026_CALA_DESC_RULES.length, 36);
assert.deepEqual(calculatePuntaBreakdown({ puntaMetros: 8.51, puntaPiquetes: 1 }), {
  metros: 8.51,
  metrosCalificados: 8,
  centimetros: 51,
  tiempos: 1,
  puntosDistancia: 2,
  puntosTiempos: 3,
  total: 5
});
assert.equal(calculatePuntaBreakdown({ puntaMetros: 8.52, puntaPiquetes: 1 }).total, 6);
assert.equal(calculatePuntaBreakdown({ puntaMetros: 90, puntaPiquetes: 1 }).total, 87);

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
