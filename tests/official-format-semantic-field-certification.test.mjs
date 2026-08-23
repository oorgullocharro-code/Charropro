import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot
} from "../js/core/scoringAttempt.js";
import { applyPuntaCalculation } from "../js/core/scoring.js";
import {
  createOfficialFormatSnapshot,
  validateOfficialFormatSnapshot
} from "../js/core/officialFormatSnapshot.js";
import {
  buildOfficialPackage,
  buildOfficialWorkbook,
  createOfficialFormatXlsxBlob
} from "../js/core/officialFormat.js";

const TOURNAMENT_ID = "semantic-fmch-2024-2028";
const CHARREADA_ID = "semantic-charreada-1";
const GENERATED_AT = "2026-08-22T20:00:00.000Z";
const PROFILE = {
  profileId: "FMCH_2026_LIBRE",
  profileVersion: "0.6.0",
  fingerprint: "rptp_0f90f7a3944a82d7"
};
const SUERTES = ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"];

const dictionary = JSON.parse(readFileSync("CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPECIFICATION-001/FIELD_DICTIONARY.json", "utf8"));
const mapping = JSON.parse(readFileSync("CHARROPRO-FMCH-OFFICIAL-DOCUMENT-DATA-MAPPING-001/FIELD_MAPPING.json", "utf8"));
const reconciliation = JSON.parse(readFileSync("CHARROPRO-FMCH-OFFICIAL-FORMAT-CERTIFICATION-STATE-RECONCILIATION-001/FIELD_RECONCILIATION.json", "utf8"));
assert.equal(dictionary.fields.length, 239);
assert.equal(mapping.mappings.length, 239);
assert.equal(reconciliation.fields.length, 239);
assert.deepEqual(
  dictionary.fields.map((field) => field.fieldId),
  mapping.mappings.map((field) => field.fieldId),
  "the semantic audit uses the canonical 239 FieldID order"
);

const timeFieldIds = [
  "FMCH.TEAM_SHEET.CALA.T",
  "FMCH.TEAM_SHEET.JINETEO_TORO.SCORE.T",
  "FMCH.TEAM_SHEET.TERNA.ROW_01.T",
  "FMCH.TEAM_SHEET.TERNA.ROW_02.T",
  "FMCH.TEAM_SHEET.TERNA.ROW_03.T",
  "FMCH.TEAM_SHEET.JINETEO_YEGUA.SCORE.T",
  "FMCH.TEAM_SHEET.MANGANAS_PIE.T",
  "FMCH.TEAM_SHEET.MANGANAS_CABALLO.T"
];
const accumulatedControlFieldIds = mapping.mappings
  .filter((field) => /POST_INFRACTION_CONTROL_0[123]$|TERNA\.AUXILIARY_CONTROL_0[123]$/.test(field.fieldId))
  .map((field) => field.fieldId);
assert.equal(accumulatedControlFieldIds.length, 24);
for (const fieldId of [...timeFieldIds, ...accumulatedControlFieldIds]) {
  const mapped = mapping.mappings.find((field) => field.fieldId === fieldId);
  const reconciled = reconciliation.fields.find((field) => field.fieldId === fieldId);
  assert.equal(mapped.charroProStatus, "IMPLEMENTED", `${fieldId} must remain implemented`);
  assert.equal(mapped.compatibility, "FULL", `${fieldId} must remain fully compatible`);
  assert.equal(mapped.gapType, "NONE", `${fieldId} must not retain a stale gap`);
  assert.ok(mapped.charroProPath, `${fieldId} must retain its frozen source path`);
  assert.equal(reconciled.reconciliation.sportingBlocker, false);
  assert.equal(reconciled.reconciliation.documentalBlocker, false);
}
for (const fieldId of timeFieldIds) {
  assert.equal(mapping.mappings.find((field) => field.fieldId === fieldId).officialSemanticType, "TIME_DERIVED_POINTS");
}

const tournament = {
  id: TOURNAMENT_ID,
  name: "Charreada semantica FMCH 2024-2028",
  date: "2026-08-22",
  venue: "Lienzo Fixture Local",
  category: "Libre",
  ruleProfileId: PROFILE.profileId,
  ruleProfileVersion: PROFILE.profileVersion,
  ruleProfileStatus: "active",
  ruleProfileContentFingerprint: PROFILE.fingerprint,
  ruleProfileAssignment: {
    profileId: PROFILE.profileId,
    version: PROFILE.profileVersion,
    status: "active",
    revision: 2,
    contentFingerprint: PROFILE.fingerprint
  }
};
const charreada = {
  id: CHARREADA_ID,
  tournamentId: TOURNAMENT_ID,
  competitionId: "semantic-competition",
  name: "Charreada ficticia de certificacion semantica",
  date: "2026-08-22",
  startTime: "12:00",
  status: "closed",
  teamIds: ["semantic-team-first-lap", "semantic-team-second-lap"],
  suerteIds: SUERTES
};

function team(id, name) {
  return {
    id,
    tournamentId: TOURNAMENT_ID,
    name,
    category: "Libre",
    association: "Asociacion Fixture Local",
    captain: `Capitan ${name}`,
    roster: {
      cala: `${name} Cala`,
      piales: `${name} Piales`,
      colas: [`${name} Coleador 1`, `${name} Coleador 2`, `${name} Coleador 3`],
      toro: `${name} Jinete Toro`,
      terna: [`${name} Cabecero`, `${name} Pialador`, `${name} Auxiliar`],
      yegua: `${name} Jinete Yegua`,
      manganas_pie: `${name} Manganeador Pie`,
      manganas_caballo: `${name} Manganeador Caballo`,
      paso: `${name} Pasador`
    }
  };
}

const teams = [
  team("semantic-team-first-lap", "Rancho Semantico Primera"),
  team("semantic-team-second-lap", "Rancho Semantico Segunda")
];

function selection(id, label, value, quantity = 1, metadata = {}) {
  return { id, label, pts: value, quantity, metadata };
}

function participantName(teamValue, suerteId, coleadorIndex) {
  if (suerteId === "colas") return teamValue.roster.colas[coleadorIndex];
  if (suerteId === "lazo") return teamValue.roster.terna[0];
  if (suerteId === "pial_ruedo") return teamValue.roster.terna[1];
  return teamValue.roster[suerteId] || teamValue.name;
}

function officialRecord(teamValue, input) {
  const {
    suerteId,
    attemptIndex = 0,
    coleadorIndex = 0,
    base = selection(`${suerteId}_base_fixture`, "Base fixture", 0),
    additional = [],
    infractions = [],
    teamPenalties = [],
    calculationDetail = null,
    punta = null,
    officialElapsedMs = null,
    remate = null,
    vuelta = null
  } = input;
  const context = {
    tournamentId: TOURNAMENT_ID,
    competitionId: charreada.competitionId,
    competitionScope: "team",
    charreadaId: CHARREADA_ID,
    teamId: teamValue.id,
    participantId: null,
    suerteId,
    opportunityNumber: attemptIndex + 1,
    participantSlot: coleadorIndex,
    category: "Libre",
    phase: "Final",
    teamName: teamValue.name,
    participantName: participantName(teamValue, suerteId, coleadorIndex),
    catalog: { base: [base], adic: additional, infr: infractions, team_infr: teamPenalties, desc: [] },
    ruleResolution: {
      contractVersion: "1.0.0",
      profile: { profileId: PROFILE.profileId, profileVersion: PROFILE.profileVersion },
      layers: ["RULE_PROFILE"]
    },
    ruleProfileId: PROFILE.profileId,
    ruleProfileVersion: PROFILE.profileVersion,
    effectiveRulesFingerprint: PROFILE.fingerprint
  };
  const legacy = {
    base: base.pts,
    adic: additional.reduce((sum, item) => sum + (item.pts * (item.quantity || 1)), 0),
    infr: infractions.reduce((sum, item) => sum + (item.pts * (item.quantity || 1)), 0),
    applied: [base.id, ...additional.map((item) => item.id), ...infractions.map((item) => item.id)],
    ruleQuantities: Object.fromEntries(
      [...additional, ...infractions]
        .filter((item) => (item.quantity || 1) > 1)
        .map((item) => [item.id, item.quantity])
    ),
    resolvedRuleValues: Object.fromEntries(
      [base, ...additional, ...infractions].map((item) => [item.id, item.pts])
    ),
    customAdic: [],
    customInfr: [],
    teamPenalties,
    attempted: true,
    initializedBase: true,
    calculationDetail
  };
  if (suerteId === "cala" && punta) {
    legacy.puntaMetros = punta.meters;
    legacy.puntaPiquetes = punta.times;
    applyPuntaCalculation(legacy);
  }
  const draft = adaptLegacyAttemptToV2(legacy, context, { adaptedAt: GENERATED_AT });
  if (officialElapsedMs !== null) {
    draft.timing = {
      timerId: `timer_${suerteId}_${teamValue.id}`,
      sharedTimerId: ["lazo", "pial_ruedo"].includes(suerteId) ? `timer_terna_${teamValue.id}` : null,
      officialElapsedMs,
      elapsedMs: officialElapsedMs,
      status: "FINISHED"
    };
  }
  if (remate) draft.sportState.remate = remate;
  if (vuelta) draft.sportState.vuelta = vuelta;
  const attemptV2 = buildOfficialScoringAttemptSnapshot(draft, {
    publishedAt: GENERATED_AT,
    officialRevision: 1,
    source: "semantic-field-certification-fixture"
  });
  const attemptKey = [TOURNAMENT_ID, CHARREADA_ID, teamValue.id, suerteId, attemptIndex, coleadorIndex].join("__");
  return {
    id: `official_${teamValue.id}_${suerteId}_${coleadorIndex}_${attemptIndex}`,
    attemptKey,
    tournament: { id: TOURNAMENT_ID, name: tournament.name },
    charreada: { id: CHARREADA_ID, tournamentId: TOURNAMENT_ID, competitionId: charreada.competitionId },
    team: { id: teamValue.id, name: teamValue.name },
    suerte: { id: suerteId, name: suerteId, fullName: suerteId },
    attemptIndex,
    coleadorIndex,
    charro: participantName(teamValue, suerteId, coleadorIndex),
    total: attemptV2.scoring.netAttemptPoints,
    revision: 1,
    status: "active",
    officialStatus: "active",
    superseded: false,
    publishedAt: GENERATED_AT,
    breakdown: {
      total: attemptV2.scoring.netAttemptPoints,
      teamPenaltyTotal: attemptV2.scoring.teamBadPoints,
      teamAdjustedTotal: attemptV2.scoring.teamAdjustedPoints,
      rulebook: {
        ruleProfileId: PROFILE.profileId,
        ruleProfileVersion: PROFILE.profileVersion,
        ruleProfileStatus: "active"
      },
      attemptV2
    }
  };
}

function recordsForTeam(teamValue, pasoVuelta) {
  const records = [
    officialRecord(teamValue, {
      suerteId: "cala",
      base: selection("cala_base_completa", "Cala completa", 20),
      additional: [
        selection("cala_lado_derecho_velocidad", "Lado derecho velocidad", 2),
        selection("cala_lado_derecho_pivote", "Lado derecho pivote", 1),
        selection("cala_lado_izquierdo_velocidad", "Lado izquierdo velocidad", 2),
        selection("cala_medio_derecho", "Medio derecho", 1),
        selection("cala_medio_izquierdo", "Medio izquierdo", 1),
        selection("cala_cambio_rectangulo_costado", "Cambio de rectangulo", 1)
      ],
      infractions: [
        selection("cala_inf_abrir_hocico", "Abrir hocico", 1),
        selection("cala_inf_estrellar_despapar_gorbetear", "Despapar", 1),
        selection("cala_inf_rabear_espiguear", "Rabear", 1),
        selection("cala_inf_lados_caminando", "Lados caminando", 2)
      ],
      teamPenalties: [selection("cala_equipo_fixture", "Infraccion equipo Cala", 4)],
      punta: { meters: 8, times: 2 }
    }),
    officialRecord(teamValue, {
      suerteId: "toro",
      base: selection("toro_base_buena", "Buena", 16),
      additional: [
        selection("toro_adic_tentemozo", "Tentemozo", 4),
        selection("toro_adic_quitar_gaza_tentemozo", "Quitar pretal de gaza o tentemozo", 2),
        selection("toro_adic_tiempo_ahorrado", "Tiempo ahorrado", 1, 2)
      ],
      infractions: [selection("toro_bad_fixture", "Malo toro", 2)],
      teamPenalties: [selection("toro_team_fixture", "Infraccion equipo Toro", 4)],
      officialElapsedMs: 41000
    }),
    officialRecord(teamValue, {
      suerteId: "lazo",
      base: selection("lazo_base_floreado", "Floreado", 10),
      additional: [selection("lazo_adic_tiempo_no_usado", "Tiempo oficial no utilizado", 1)],
      officialElapsedMs: 71000,
      remate: { remateId: "lazo_base_floreado", remateLabel: "Floreado" }
    }),
    officialRecord(teamValue, {
      suerteId: "pial_ruedo",
      attemptIndex: 1,
      base: selection("pial_ruedo_base_corvero_derecho", "Corvero derecho", 10),
      additional: [selection("pial_ruedo_adic_tiempo_no_usado", "Tiempo oficial no utilizado", 1, 2)],
      infractions: [selection("pial_ruedo_bad_fixture", "Malo pial", 1)],
      officialElapsedMs: 72000,
      remate: { remateId: "pial_ruedo_base_corvero_derecho", remateLabel: "Corvero derecho" }
    }),
    officialRecord(teamValue, {
      suerteId: "yegua",
      base: selection("yegua_base_buena", "Buena", 16),
      additional: [
        selection("yegua_adic_tentemozo", "Tentemozo", 4),
        selection("yegua_adic_quitar_gaza_tentemozo", "Quitar pretal de gaza o tentemozo", 2),
        selection("yegua_adic_tiempo_ahorrado", "Tiempo ahorrado", 1, 3)
      ],
      infractions: [selection("yegua_bad_fixture", "Malo yegua", 2)],
      teamPenalties: [selection("yegua_team_fixture", "Infraccion equipo Yegua", 2)],
      officialElapsedMs: 123000
    }),
    officialRecord(teamValue, { suerteId: "paso", base: selection(pasoVuelta === 1 ? "paso_base_primera_vuelta" : "paso_base_segunda_vuelta", pasoVuelta === 1 ? "Primera vuelta" : "Segunda vuelta", pasoVuelta === 1 ? 20 : 15), additional: [selection("paso_adic_distancia", "Distancia", 1)], infractions: [selection("paso_bad_fixture", "Malo paso", 1)], officialElapsedMs: 36000, vuelta: pasoVuelta })
  ];
  for (let index = 0; index < 3; index += 1) {
    records.push(officialRecord(teamValue, {
      suerteId: "piales",
      attemptIndex: index,
      base: selection(`piales_base_fixture_${index}`, `Pial ${index + 1}`, index === 1 ? 0 : 14 + index),
      infractions: index === 0 ? [selection("piales_bad_fixture", "Malo piales", 2)] : []
    }));
    records.push(officialRecord(teamValue, {
      suerteId: "manganas_pie",
      attemptIndex: index,
      base: selection(`manganas_pie_base_fixture_${index}`, `Mangana pie ${index + 1}`, index === 1 ? 0 : 10),
      additional: index === 0 ? [selection("manganas_pie_adic_tiempo_no_usado", "Minuto no utilizado", 1, 2)] : [],
      infractions: index === 2 ? [selection("manganas_pie_bad_fixture", "Malo manganas pie", 1)] : [],
      officialElapsedMs: 182000 + index * 1000
    }));
    records.push(officialRecord(teamValue, {
      suerteId: "manganas_caballo",
      attemptIndex: index,
      base: selection(`manganas_caballo_base_fixture_${index}`, `Mangana caballo ${index + 1}`, index === 0 ? 14 : 0),
      additional: index === 0 ? [selection("manganas_caballo_adic_tiempo_no_usado", "Minuto no utilizado", 1)] : [],
      infractions: index === 0 ? [selection("manganas_caballo_bad_fixture", "Malo manganas caballo", 2)] : [],
      officialElapsedMs: 243000 + index * 1000
    }));
    for (let coleadorIndex = 0; coleadorIndex < 3; coleadorIndex += 1) {
      records.push(officialRecord(teamValue, {
        suerteId: "colas",
        attemptIndex: index,
        coleadorIndex,
        base: selection(`colas_base_fixture_${coleadorIndex}_${index}`, `Cola ${coleadorIndex + 1}.${index + 1}`, 6 + coleadorIndex + index),
        infractions: coleadorIndex === 0 && index === 0 ? [selection("colas_bad_fixture", "Malo colas", 1)] : []
      }));
    }
  }
  return records;
}

const records = [
  ...recordsForTeam(teams[0], 1),
  ...recordsForTeam(teams[1], 2)
];
const state = { tournaments: [tournament], charreadas: [charreada], teams, publishedScores: records, scores: { mutable: 999999 } };

for (const [teamIndex, teamValue] of teams.entries()) {
  const teamRecords = records.filter((record) => record.team.id === teamValue.id);
  const snapshot = createOfficialFormatSnapshot({ tournament, charreada, team: teamValue, officialScores: teamRecords }, {
    tournamentId: TOURNAMENT_ID,
    charreadaId: CHARREADA_ID,
    teamId: teamValue.id,
    generatedAt: GENERATED_AT
  });
  assert.equal(snapshot.schemaVersion, "1.2.0");
  assert.equal(snapshot.errors.length, 0, snapshot.errors.join("\n"));
  const validation = validateOfficialFormatSnapshot(snapshot);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(snapshot.suertes.cala.attempts[0].documentalEvidence.cala.puntaDistancePoints, 2);
  assert.equal(snapshot.suertes.cala.attempts[0].documentalEvidence.cala.puntaTimePoints, 2);
  assert.deepEqual(snapshot.suertes.cala.attempts[0].documentalEvidence.badPointSlots.map((item) => item.value), [1, 1, 1, 2]);
  assert.deepEqual(snapshot.suertes.cala.attempts[0].documentalEvidence.badPointSlots.map((item) => item.documentCode), ["AH", "D", "R", null]);
  assert.equal(snapshot.documentalControls.calaSideBadPointsSumControl.value, 9, "5 malos + 4 de infraccion al equipo = 9");
  assert.equal(snapshot.documentalControls.calaSideBadPointsSumControl.affectsScore, false);
  assert.equal(snapshot.suertes.toro.attempts[0].documentalEvidence.timePoints.value, 2);
  assert.equal(snapshot.suertes.terna.attempts[0].documentalEvidence.timePoints.value, 1);
  assert.equal(snapshot.suertes.terna.attempts[1].documentalEvidence.timePoints.value, 2);
  assert.equal(snapshot.suertes.yegua.attempts[0].documentalEvidence.timePoints.value, 3);
  assert.equal(snapshot.suertes.manganasPie.attempts[0].documentalEvidence.timePoints.value, 2);
  assert.equal(snapshot.suertes.manganasCaballo.attempts[0].documentalEvidence.timePoints.value, 1);
  assert.equal(snapshot.suertes.terna.attempts[0].documentalEvidence.remate.remateLabel, "Floreado");
  assert.equal(snapshot.suertes.terna.attempts[1].documentalEvidence.remate.remateLabel, "Corvero derecho");
  assert.equal(snapshot.suertes.paso.attempts[0].documentalEvidence.paso.vuelta, teamIndex + 1);
  assert.equal(snapshot.suertes.paso.attempts[0].documentalEvidence.paso.firstLapBase, teamIndex === 0 ? 20 : null);
  assert.equal(snapshot.suertes.paso.attempts[0].documentalEvidence.paso.secondLapBase, teamIndex === 1 ? 15 : null);
  assert.deepEqual(
    ["toro", "terna", "yegua", "manganasPie", "manganasCaballo", "paso"].map((sectionId) =>
      snapshot.suertes[sectionId].attempts.at(-1).documentalEvidence.officialTime.formatted
    ),
    ["0:41", "1:12", "2:03", "3:04", "4:05", "0:36"]
  );
  const expectedControlTotal = Object.values(snapshot.documentalControls.badPointsBySection)
    .reduce((sum, control) => sum + control.value, 0);
  assert.equal(snapshot.documentalControls.badPointsControlTotal.value, expectedControlTotal);
  assert.equal(snapshot.finalScore, Object.values(snapshot.suertes).reduce((sum, section) => sum + section.teamAdjustedTotal, 0));
  assert.equal(snapshot.finalScore, snapshot.officialScoreTotal - snapshot.badPoints.team, "team infractions are deducted exactly once");
  const packageValue = buildOfficialPackage({ state, tournamentId: TOURNAMENT_ID, charreadaId: CHARREADA_ID, teamId: teamValue.id, generatedAt: GENERATED_AT });
  const workbook = buildOfficialWorkbook(packageValue);
  const rows = workbook.sheets[0].rows;
  const cell = (row, col) => rows[row - 1][col - 1]?.value ?? rows[row - 1][col - 1];
  assert.equal(cell(8, 18), "AH\n1");
  assert.equal(cell(8, 19), "D\n1");
  assert.equal(cell(8, 20), "R\n1");
  assert.equal(cell(26, 17), 4, "Tentemozo maps only to TENTE MOSO");
  assert.equal(cell(26, 21), 2, "Quitar gaza/tentemozo maps only to PRETAL");
  assert.equal(cell(26, 30), 2, "Toro T comes from the frozen time-points rule");
  assert.equal(cell(38, 17), 4, "Yegua Tentemozo maps only to TENTE MOSO");
  assert.equal(cell(38, 21), 2, "Yegua quitar gaza/tentemozo maps only to PRETAL");
  assert.equal(cell(38, 30), 3, "Yegua T comes from the frozen time-points rule");
  assert.equal(cell(44, 30), 2, "Manganas a pie T is the sum of frozen time-point selections");
  assert.equal(cell(49, 30), 1, "Manganas a caballo T is the sum of frozen time-point selections");
  assert.equal(cell(32, 29), 3, "Terna row T sums the two frozen time-point selections");
  const controlRows = [15, 24, 28, 36, 40, 46, 51, 56];
  const controlSections = ["piales", "coleadero", "toro", "terna", "yegua", "manganasPie", "manganasCaballo", "paso"];
  controlRows.forEach((row, index) => {
    const control = snapshot.documentalControls.accumulatedBySection[controlSections[index]];
    assert.deepEqual([cell(row, 22), cell(row, 26), cell(row, 29)], [
      control.previousTotal,
      control.currentSuerteTotal,
      control.newAccumulatedTotal
    ]);
    assert.equal(control.previousTotal + control.currentSuerteTotal, control.newAccumulatedTotal);
  });
  assert.equal(snapshot.documentalControls.accumulatedBySection.paso.newAccumulatedTotal, snapshot.finalScore);
  const visible = workbook.sheets[0].rows.flat().map((cell) => cell?.value ?? cell).join(" | ");
  assert.match(visible, /Floreado/);
  assert.match(visible, /Corvero derecho/);
  for (const time of ["0:41", "1:12", "2:03", "3:04", "4:05", "0:36"]) assert.match(visible, new RegExp(time.replace(":", "\\:")));
  const xlsx = createOfficialFormatXlsxBlob(packageValue);
  assert.ok(xlsx.size > 1000);
  if (process.env.CHARROPRO_SEMANTIC_FIXTURE_DIR) {
    mkdirSync(process.env.CHARROPRO_SEMANTIC_FIXTURE_DIR, { recursive: true });
    const suffix = teamIndex === 0 ? "paso-primera-vuelta" : "paso-segunda-vuelta";
    writeFileSync(`${process.env.CHARROPRO_SEMANTIC_FIXTURE_DIR}/formato-fmch-semantico-${suffix}.xlsx`, Buffer.from(await xlsx.arrayBuffer()));
  }
}

const incompleteSource = structuredClone({ tournament, charreada, team: teams[0], officialScores: records.filter((record) => record.team.id === teams[0].id) });
const incompleteCala = incompleteSource.officialScores.find((record) => record.suerte.id === "cala");
delete incompleteCala.breakdown.attemptV2.scoring.calculationDetail.details.distancePoints;
delete incompleteCala.breakdown.attemptV2.scoring.calculationDetail.details.timePoints;
const blocked = createOfficialFormatSnapshot(incompleteSource, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: teams[0].id,
  generatedAt: GENERATED_AT
});
assert.equal(blocked.documentStatus, "BLOCKED_SOURCE");
assert.ok(blocked.errors.includes("official-format-cala-punta-breakdown-source-missing"));
assert.equal(blocked.suertes.cala.attempts[0].documentalEvidence.cala.puntaDistancePoints, null);
assert.equal(blocked.suertes.cala.attempts[0].documentalEvidence.cala.puntaTimePoints, null);

const zeroTimeSource = structuredClone({ tournament, charreada, team: teams[0], officialScores: records.filter((record) => record.team.id === teams[0].id) });
const zeroToro = zeroTimeSource.officialScores.find((record) => record.suerte.id === "toro");
zeroToro.breakdown.attemptV2.timing.officialElapsedMs = 0;
zeroToro.breakdown.attemptV2.timing.elapsedMs = 0;
const zeroTimeSnapshot = createOfficialFormatSnapshot(zeroTimeSource, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: teams[0].id,
  generatedAt: GENERATED_AT
});
assert.equal(zeroTimeSnapshot.suertes.toro.attempts[0].documentalEvidence.officialTime.formatted, "0:00");

const missingTimeSource = structuredClone(zeroTimeSource);
const missingToro = missingTimeSource.officialScores.find((record) => record.suerte.id === "toro");
missingToro.breakdown.attemptV2.timing.officialElapsedMs = null;
missingToro.breakdown.attemptV2.timing.elapsedMs = null;
const missingTimeSnapshot = createOfficialFormatSnapshot(missingTimeSource, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: teams[0].id,
  generatedAt: GENERATED_AT
});
assert.equal(missingTimeSnapshot.documentStatus, "BLOCKED_SOURCE");
assert.ok(missingTimeSnapshot.errors.includes("official-format-toro-official-time-source-missing"));

console.log("official-format semantic field certification tests: ok");
