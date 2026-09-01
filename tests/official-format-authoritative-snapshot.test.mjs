import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import {
  adaptLegacyAttemptToV2,
  buildOfficialScoringAttemptSnapshot
} from "../js/core/scoringAttempt.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import {
  OFFICIAL_FORMAT_DOCUMENT_PROFILE,
  OFFICIAL_FORMAT_DOCUMENTAL_REVIEW_ITEMS,
  OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_FIELDS,
  OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_REVIEWS,
  OFFICIAL_FORMAT_UNSUPPORTED_DOCUMENTAL_FIELDS,
  createOfficialFormatSnapshot,
  validateOfficialFormatSnapshot
} from "../js/core/officialFormatSnapshot.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import {
  buildOfficialPackage,
  buildOfficialWorkbook,
  createOfficialFormatXlsxBlob
} from "../js/core/officialFormat.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

const GENERATED_AT = "2026-08-22T18:00:00.000Z";
const PUBLISHED_AT = "2026-08-22T17:00:00.000Z";
const TOURNAMENT_ID = "tournament_official_format_1";
const CHARREADA_ID = "charreada_closed_1";
const TEAM_ID = "team_official_1";
const PROFILE_ID = "FMCH_2026_LIBRE";
const PROFILE_VERSION = "0.6.0";
const PROFILE_FINGERPRINT = "rptp_0f90f7a3944a82d7";
const SOURCE_PDF_SHA256 = "3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7";
const GOLDEN_XLSX_SHA256 = "dee1db6047a6a0948ca4fb75cfa94481e92368f390adf36e47fd3b20dbd7d695";
const RESOLVED_INSTITUTIONAL_FIELD_IDS = [
  "FMCH.TEAM_SHEET.HEADER.FEDERATION_LOGO",
  "FMCH.TEAM_SHEET.FOOTER.CONADE_LOGO",
  "FMCH.TEAM_SHEET.FOOTER.CONADE_NAME",
  "FMCH.TEAM_SHEET.FOOTER.SPORTS_SECRETARIAT_PERIOD",
  "FMCH.TEAM_SHEET.FOOTER.INSTITUTIONAL_QUOTE"
];
const RESOLVED_REVIEW_FIELD_IDS = [
  "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL",
  "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
  "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_01",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_02",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_03",
  "FMCH.TEAM_SHEET.SIGNATURES.CAPTAIN"
];
const SUERTE_IDS = [
  "cala",
  "piales",
  "colas",
  "toro",
  "lazo",
  "pial_ruedo",
  "yegua",
  "manganas_pie",
  "manganas_caballo",
  "paso"
];

const tournament = {
  id: TOURNAMENT_ID,
  name: "Torneo documental sintetico",
  date: "2026-08-22",
  venue: "Lienzo de prueba",
  category: "Libre",
  ruleProfileId: PROFILE_ID,
  ruleProfileVersion: PROFILE_VERSION,
  ruleProfileStatus: "active",
  ruleProfileContentFingerprint: PROFILE_FINGERPRINT,
  ruleProfileAssignmentRevision: 1,
  ruleProfileAssignment: {
    profileId: PROFILE_ID,
    version: PROFILE_VERSION,
    status: "active",
    revision: 1,
    contentFingerprint: PROFILE_FINGERPRINT
  }
};
const charreada = {
  id: CHARREADA_ID,
  tournamentId: TOURNAMENT_ID,
  competitionId: "competition_libre_1",
  name: "Charreada historica cerrada",
  date: "2026-08-22",
  startTime: "12:00",
  status: "cerrada",
  teamIds: [TEAM_ID],
  suerteIds: SUERTE_IDS
};
const team = {
  id: TEAM_ID,
  tournamentId: TOURNAMENT_ID,
  name: "Equipo Oficial",
  category: "Libre",
  association: "Asociacion sintetica",
  captain: "Capitan sintetico",
  roster: {
    cala: "Cala Uno",
    piales: "Piales Uno",
    colas: ["Coleador Uno", "Coleador Dos", "Coleador Tres"],
    toro: "Jinete Toro",
    terna: ["Cabecero", "Pialador", "Auxiliar"],
    yegua: "Jinete Yegua",
    manganas_pie: "Manganeador Pie",
    manganas_caballo: "Manganeador Caballo",
    paso: "Pasador"
  }
};

function buildAttemptV2({ suerteId, attemptIndex, coleadorIndex, total, revision = 1, individualBadPoints = 0 }) {
  const goodPoints = total + individualBadPoints;
  const context = {
    tournamentId: TOURNAMENT_ID,
    competitionId: charreada.competitionId,
    competitionScope: "team",
    charreadaId: CHARREADA_ID,
    teamId: TEAM_ID,
    participantId: null,
    suerteId,
    opportunityNumber: attemptIndex + 1,
    participantSlot: coleadorIndex,
    category: "Libre",
    phase: "Final",
    teamName: team.name,
    participantName: getParticipantName(suerteId, coleadorIndex),
    catalog: {
      base: [{ id: `${suerteId}_base`, label: "Base oficial", pts: goodPoints }],
      adic: [],
      infr: individualBadPoints ? [{ id: `${suerteId}_bad`, label: "Malo oficial", pts: individualBadPoints }] : [],
      team_infr: [],
      desc: []
    },
    ruleResolution: {
      contractVersion: "1.0.0",
      profile: { profileId: PROFILE_ID, profileVersion: PROFILE_VERSION },
      layers: ["RULE_PROFILE"]
    },
    ruleProfileId: PROFILE_ID,
    ruleProfileVersion: PROFILE_VERSION,
    effectiveRulesFingerprint: `rules_${suerteId}_certified`
  };
  const legacy = {
    base: goodPoints,
    adic: 0,
    infr: individualBadPoints,
    applied: [`${suerteId}_base`, ...(individualBadPoints ? [`${suerteId}_bad`] : [])],
    customAdic: [],
    customInfr: [],
    teamPenalties: [],
    attempted: true,
    notAchieved: false,
    initializedBase: true,
    note: "Evidencia sintetica"
  };
  const draft = adaptLegacyAttemptToV2(legacy, context, {
    adaptedAt: PUBLISHED_AT,
    pointSummary: {
      goodPoints,
      individualBadPoints,
      teamBadPoints: 0,
      netAttemptPoints: total,
      teamAdjustedPoints: total
    }
  });
  draft.identity.revision = revision;
  if (suerteId === "cala") {
    draft.scoring.calculationDetail = {
      type: "cala_punta",
      value: 0,
      selections: [],
      details: {
        metros: 6,
        metrosCalificados: 6,
        centimetros: 0,
        piquetes: 4,
        puntosDistancia: 0,
        puntosTiempos: 0
      }
    };
  }
  if (["toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"].includes(suerteId)) {
    draft.timing = {
      timerId: `timer_${suerteId}`,
      sharedTimerId: suerteId === "lazo" || suerteId === "pial_ruedo" ? "timer_terna_shared" : null,
      officialElapsedMs: 60000 + (attemptIndex * 1000),
      elapsedMs: 60000 + (attemptIndex * 1000),
      status: "FINISHED"
    };
  }
  if (suerteId === "lazo" || suerteId === "pial_ruedo") {
    draft.sportState.remate = {
      remateId: suerteId === "lazo" ? "lazo_base_floreado" : "pial_ruedo_base_corvero_derecho",
      remateLabel: suerteId === "lazo" ? "Floreado" : "Corvero derecho",
      remateMetadata: { source: "RULE_PROFILE" }
    };
  }
  if (suerteId === "paso") draft.sportState.vuelta = 1;
  return buildOfficialScoringAttemptSnapshot(draft, {
    publishedAt: PUBLISHED_AT,
    officialRevision: revision,
    source: "official-format-golden-test"
  });
}

function buildRecord(suerteId, attemptIndex = 0, coleadorIndex = 0, total = 10, revision = 1, overrides = {}) {
  const { individualBadPoints = 0, ...recordOverrides } = overrides;
  const attemptV2 = buildAttemptV2({ suerteId, attemptIndex, coleadorIndex, total, revision, individualBadPoints });
  const attemptKey = [TOURNAMENT_ID, CHARREADA_ID, TEAM_ID, suerteId, attemptIndex, coleadorIndex].join("__");
  return {
    id: `official_${suerteId}_${coleadorIndex}_${attemptIndex}_r${revision}`,
    attemptKey,
    tournament: { id: TOURNAMENT_ID, name: tournament.name },
    charreada: { id: CHARREADA_ID, tournamentId: TOURNAMENT_ID, competitionId: charreada.competitionId },
    team: { id: TEAM_ID, name: team.name },
    suerte: { id: suerteId, name: suerteId.toUpperCase(), fullName: suerteId.toUpperCase() },
    attemptIndex,
    coleadorIndex,
    charro: getParticipantName(suerteId, coleadorIndex),
    total,
    revision,
    status: "active",
    officialStatus: "active",
    superseded: false,
    publishedAt: PUBLISHED_AT,
    breakdown: {
      total,
      teamPenaltyTotal: 0,
      teamAdjustedTotal: total,
      rulebook: {
        ruleProfileId: PROFILE_ID,
        ruleProfileVersion: PROFILE_VERSION,
        ruleProfileStatus: "active"
      },
      attemptV2
    },
    ...recordOverrides
  };
}

function buildGoldenRecords() {
  return [
    buildRecord("cala", 0, 0, 10, 1, { individualBadPoints: 2 }),
    ...[0, 1, 2].map((index) => buildRecord("piales", index)),
    ...[0, 1, 2].flatMap((coleadorIndex) => [0, 1, 2].map((attemptIndex) => buildRecord("colas", attemptIndex, coleadorIndex))),
    buildRecord("toro"),
    buildRecord("lazo", 0),
    buildRecord("pial_ruedo", 1, 1),
    buildRecord("yegua"),
    ...[0, 1, 2].map((index) => buildRecord("manganas_pie", index)),
    ...[0, 1, 2].map((index) => buildRecord("manganas_caballo", index)),
    buildRecord("paso")
  ];
}

function getParticipantName(suerteId, coleadorIndex) {
  if (suerteId === "colas") return team.roster.colas[coleadorIndex];
  if (suerteId === "lazo") return team.roster.terna[0];
  if (suerteId === "pial_ruedo") return team.roster.terna[1];
  return team.roster[suerteId] || team.name;
}

function getCellValue(cell) {
  return cell && typeof cell === "object" && "value" in cell ? cell.value : cell;
}

function readStoredZip(bytes) {
  const files = new Map();
  let offset = 0;
  while (offset + 30 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = bytes.subarray(nameStart, nameStart + nameLength).toString("utf8");
    files.set(name, bytes.subarray(dataStart, dataStart + size));
    offset = dataStart + size;
  }
  return files;
}

const records = buildGoldenRecords();
assert.equal(records.length, 24, "golden model contains the complete 3x3 coleadero and all official attempts");
const source = { tournament, charreada, team, officialScores: records };
const sourceBefore = structuredClone(source);
const snapshot = createOfficialFormatSnapshot(source, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: GENERATED_AT
});

assert.deepEqual(source, sourceBefore, "snapshot creation never mutates its source");
assert.equal(Object.isFrozen(snapshot), true);
assert.equal(Object.isFrozen(snapshot.suertes.coleadero.attempts[0]), true);
assert.equal(snapshot.tournamentId, TOURNAMENT_ID);
assert.equal(snapshot.charreadaId, CHARREADA_ID);
assert.equal(snapshot.teamId, TEAM_ID);
assert.equal(snapshot.ruleProfile.profileId, PROFILE_ID);
assert.equal(snapshot.ruleProfile.version, PROFILE_VERSION);
assert.equal(snapshot.ruleProfile.fingerprint, PROFILE_FINGERPRINT);
assert.equal(snapshot.suertes.coleadero.attempts.length, 9);
assert.equal(snapshot.suertes.terna.attempts.length, 2);
assert.equal(snapshot.officialScoreTotal, 240);
assert.equal(snapshot.finalScore, 240);
assert.equal(snapshot.controlValues.sectionControlMatches, true);
assert.equal(snapshot.documentStatus, "READY");
assert.equal(snapshot.unsupportedDocumentalFields.length, 0);
assert.deepEqual(snapshot.unsupportedDocumentalFields, [...OFFICIAL_FORMAT_UNSUPPORTED_DOCUMENTAL_FIELDS]);
assert.deepEqual(snapshot.resolvedDocumentalFields, RESOLVED_INSTITUTIONAL_FIELD_IDS);
assert.deepEqual([...OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_FIELDS], RESOLVED_INSTITUTIONAL_FIELD_IDS);
assert.equal(snapshot.documentAuthority.profileId, "FMCH_TEAM_SHEET_2024_2028");
assert.equal(snapshot.documentAuthority.scope, "DOCUMENT_VERSION_ONLY");
assert.equal(snapshot.documentAuthority.default, false);
assert.equal(snapshot.documentAuthority.futureValidityInferred, false);
assert.equal(snapshot.documentAuthority.sourceDocument.sha256, SOURCE_PDF_SHA256);
assert.equal(snapshot.institutionalFields.length, 5);
assert.equal(snapshot.documentalReviewItems.length, 0);
assert.deepEqual(snapshot.documentalReviewItems, [...OFFICIAL_FORMAT_DOCUMENTAL_REVIEW_ITEMS]);
assert.equal(snapshot.resolvedDocumentalReviews.length, 4);
assert.deepEqual(
  snapshot.resolvedDocumentalReviews.map((item) => ({ fieldId: item.fieldId, resolution: item.resolution })),
  [...OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_REVIEWS]
);
assert.equal(snapshot.documentalControls.calaSideBadPointsSumControl.affectsScore, false);
assert.equal(snapshot.documentalControls.calaSideBadPointsSumControl.value, 2);
assert.equal(snapshot.documentalControls.badPointsBySection.cala.value, 2);
assert.equal(snapshot.documentalControls.badPointsControlTotal.value, 2);
assert.equal(snapshot.documentalControls.badPointsControlTotal.affectsScore, false);
assert.deepEqual(snapshot.documentalControls.coleaderoAdministrativeRow, {
  fieldId: "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
  classification: "ADMINISTRATIVE",
  visualOrder: 55,
  competitorId: null,
  attemptId: null,
  value: null,
  affectsScore: false
});
assert.equal(snapshot.documentalControls.coleaderoBottomControl04.value, null);
assert.equal(snapshot.documentalControls.coleaderoBottomControl04.canonicalSourceAvailable, false);
assert.deepEqual(snapshot.documentalControls.signatures.map((item) => item.label), ["JUEZ", "JUEZ", "JUEZ", "CAPITÁN"]);
assert.deepEqual(snapshot.manualFields, [
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_01",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_02",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_03",
  "FMCH.TEAM_SHEET.SIGNATURES.CAPTAIN"
]);
assert.equal(snapshot.warnings.includes("official-format-unsupported-documental-fields"), false);
assert.equal(snapshot.warnings.includes("official-format-documental-review-required"), false);
assert.equal(snapshot.errors.length, 0);
assert.equal(validateOfficialFormatSnapshot(snapshot).valid, true);
assert.throws(() => { snapshot.suertes.cala.attempts[0].total = 999; }, TypeError);

for (const section of Object.values(snapshot.suertes)) {
  assert.equal(section.total, section.officialScoreTotal, `${section.id} preserves the official score total`);
  assert.equal(section.total, section.attempts.reduce((sum, attempt) => sum + attempt.total, 0));
}

const fixtureState = {
  activeCharreadaId: "a_different_active_charreada",
  tournaments: [tournament],
  charreadas: [charreada],
  teams: [team],
  publishedScores: records,
  scores: { [`${CHARREADA_ID}__${TEAM_ID}__cala`]: [{ base: 999999 }] }
};
const officialPackage = buildOfficialPackage({
  state: fixtureState,
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  generatedAt: GENERATED_AT
});
assert.equal(officialPackage.sheets.length, 1);
assert.equal(officialPackage.sheets[0].puntuacionFinal, 240, "mutable state.scores never becomes document authority");
assert.equal(officialPackage.sheets[0].snapshot.charreadaId, CHARREADA_ID, "historical export ignores activeCharreadaId");
assert.equal(officialPackage.sheets[0].institutional.conadeName, "Comisión Nacional de Cultura Física y Deporte");
assert.equal(officialPackage.sheets[0].institutional.sportsSecretariatPeriod, "SECRETARÍA DEL DEPORTE 2024 - 2028");
assert.equal(officialPackage.sheets[0].institutional.institutionalQuote, "Charrería, Tradición Ecuestre en México. Patrimonio Cultural Inmaterial de la Humanidad");
const workbook = buildOfficialWorkbook(officialPackage);
assert.equal(workbook.generatedAt, GENERATED_AT);
assert.equal(workbook.sheets[0].images.length, 2, "XLSX declares both certified institutional assets");
assert.equal(workbook.sheets[0].orientation, "portrait");
assert.equal(workbook.sheets[0].paperSize, undefined);
assert.equal(workbook.sheets[0].paperWidth, "8.5in");
assert.equal(workbook.sheets[0].paperHeight, "13.403333in");
assert.equal(workbook.sheets[0].fitToWidth, 1);
assert.equal(workbook.sheets[0].fitToHeight, 1, "official sheet remains one Letter portrait page");
assert.equal(workbook.sheets[0].showGridLines, false);
assert.equal(workbook.sheets[0].freezeRows, 0, "official printable form has no frozen technical header");
const officialRows = workbook.sheets[0].rows;
const finalRow = officialRows.find((row) => row.some((cell) => getCellValue(cell) === "PUNTUACIÓN FINAL"));
assert.ok(finalRow.some((cell) => getCellValue(cell) === snapshot.finalScore), "XLSX final total is a direct snapshot representation");
const visibleText = officialRows.flat().map(getCellValue).join(" | ");
assert.doesNotMatch(visibleText, /OFFICIAL SCORE ID|ATTEMPT KEY|DETALLE CONGELADO|FINGERPRINT|SCHEMAVERSION|\bPASS\b|\bVALID\b|CONTROL DOCUMENTAL/i);
assert.match(visibleText, /CALA DE CABALLO/);
assert.match(visibleText, /PIALES EN EL LIENZO/);
assert.match(visibleText, /COLEADERO/);
assert.match(visibleText, /JINETEO DE TORO/);
assert.match(visibleText, /TERNA EN EL RUEDO/);
assert.match(visibleText, /JINETEO DE YEGUA/);
assert.match(visibleText, /MANGANAS A PIE/);
assert.match(visibleText, /MANGANAS A CABALLO/);
assert.match(visibleText, /PASO DE LA MUERTE/);
assert.equal(getCellValue(officialRows[7][29]), snapshot.suertes.cala.total, "Cala official total reaches the printable cell");
assert.equal(getCellValue(officialRows[12][30]), snapshot.suertes.piales.total, "Piales official total reaches the printable cell");
assert.equal(getCellValue(officialRows[21][15]), snapshot.suertes.coleadero.total, "Coleadero 3x3 control equals the snapshot");
assert.equal(getCellValue(officialRows[25][30]), snapshot.suertes.toro.total, "Toro total reaches the printable cell");
assert.equal(
  officialRows.slice(31, 34).reduce((sum, row) => {
    const value = getCellValue(row[29]);
    return sum + (typeof value === "number" ? value : 0);
  }, 0),
  snapshot.suertes.terna.total,
  "Terna printable rows preserve the official section total"
);
assert.equal(getCellValue(officialRows[37][30]), snapshot.suertes.yegua.total, "Yegua total reaches the printable cell");
assert.equal(getCellValue(officialRows[43][30]), snapshot.suertes.manganasPie.total, "Manganas a pie total reaches the printable cell");
assert.equal(getCellValue(officialRows[48][30]), snapshot.suertes.manganasCaballo.total, "Manganas a caballo total reaches the printable cell");
assert.equal(getCellValue(officialRows[53][30]), snapshot.suertes.paso.total, "Paso total reaches the printable cell");
assert.equal(getCellValue(officialRows[7][0]), snapshot.documentalControls.calaSideBadPointsSumControl.value, "Cala side control preserves PDF order without changing score");
assert.ok(officialRows[20].every((cell) => ["", "-"].includes(getCellValue(cell))), "fourth Coleadero row is documentary and has no competitor data");
assert.equal(getCellValue(officialRows[20][1]), "-", "administrative Coleadero row is visibly unused");
assert.equal(snapshot.suertes.coleadero.attempts.length, 9, "documentary row never creates a tenth Coleadero attempt");
assert.deepEqual([1, 9, 17, 25].map((index) => getCellValue(officialRows[59][index])), ["JUEZ", "JUEZ", "JUEZ", "CAPITÁN"]);
assert.ok(officialPackage.sheets[0].auditRows.some((row) => row.some((cell) => String(getCellValue(cell) || "").startsWith("official_"))), "technical traceability remains available outside the printable sheet");
const xlsx = createOfficialFormatXlsxBlob(officialPackage);
assert.equal(xlsx.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
assert.ok(xlsx.size > 1000);
const xlsxBuffer = Buffer.from(await xlsx.arrayBuffer());
if (process.env.CHARROPRO_OFFICIAL_FORMAT_GOLDEN_PATH) {
  writeFileSync(process.env.CHARROPRO_OFFICIAL_FORMAT_GOLDEN_PATH, xlsxBuffer);
}
assert.equal(createHash("sha256").update(xlsxBuffer).digest("hex"), GOLDEN_XLSX_SHA256, "golden XLSX remains byte-for-byte deterministic");
const xlsxFiles = readStoredZip(xlsxBuffer);
const worksheetXml = xlsxFiles.get("xl/worksheets/sheet1.xml").toString("utf8");
assert.match(worksheetXml, /PUNTUACIÓN FINAL/);
assert.match(worksheetXml, /<v>240<\/v>/, "serialized XLSX contains the authoritative final total");
assert.match(worksheetXml, /SECRETARÍA DEL DEPORTE 2024 - 2028/);
assert.match(worksheetXml, /Patrimonio Cultural Inmaterial de la Humanidad/);
assert.match(worksheetXml, /<drawing r:id="rId1"\/>/);
assert.doesNotMatch(worksheetXml, /SELLO|FOLIO|AUTORIZACI[ÓO]N/i);
assert.doesNotMatch(worksheetXml, /OFFICIAL SCORE ID|ATTEMPT KEY|DETALLE CONGELADO|FINGERPRINT|SCHEMAVERSION|CONTROL DOCUMENTAL/i);
assert.match(worksheetXml, /<sheetView workbookViewId="0" showGridLines="0">/);
assert.match(worksheetXml, /<pageSetup orientation="portrait" paperWidth="8\.5in" paperHeight="13\.403333in" fitToWidth="1" fitToHeight="1"\/>/);
assert.ok(xlsxFiles.has("xl/drawings/drawing1.xml"));
const embeddedFmch = [...xlsxFiles.entries()].find(([name]) => name.includes("fmch-emblem"));
const embeddedConade = [...xlsxFiles.entries()].find(([name]) => name.includes("conade-lockup"));
assert.ok(embeddedFmch, "FMCH emblem is embedded in the XLSX package");
assert.ok(embeddedConade, "CONADE lockup is embedded in the XLSX package");
assert.equal(createHash("sha256").update(embeddedFmch[1]).digest("hex"), OFFICIAL_FORMAT_DOCUMENT_PROFILE.fields[0].sha256);
assert.equal(createHash("sha256").update(embeddedConade[1]).digest("hex"), OFFICIAL_FORMAT_DOCUMENT_PROFILE.fields[1].sha256);

const manifest = JSON.parse(readFileSync(new URL(
  "../assets/fmch/official-format-2024-2028/manifest.json",
  import.meta.url
), "utf8"));
assert.equal(manifest.sourceDocument.sha256, SOURCE_PDF_SHA256);
assert.equal(manifest.default, false);
assert.equal(manifest.futureValidityInferred, false);
assert.deepEqual(OFFICIAL_FORMAT_DOCUMENT_PROFILE.sourceDocument, manifest.sourceDocument);
for (const asset of manifest.assets) {
  const bytes = readFileSync(new URL(`../${asset.path}`, import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, `${asset.path} preserves its certified derivation checksum`);
}

const reconciliation = JSON.parse(readFileSync(new URL(
  "../CHARROPRO-FMCH-OFFICIAL-FORMAT-CERTIFICATION-STATE-RECONCILIATION-001/FIELD_RECONCILIATION.json",
  import.meta.url
), "utf8"));
assert.equal(reconciliation.reconciledFieldCount, 239);
assert.equal(reconciliation.summary.sportingBlockersOpen, 0);
assert.equal(reconciliation.summary.documentalFieldBlockers, 0);
assert.equal(reconciliation.summary.documentalReviewBlockers, 0);
assert.equal(reconciliation.summary.countsByClassification.INSTITUTIONAL_RESOLVED, 5);
assert.equal(reconciliation.summary.countsByClassification.UNSUPPORTED_REAL_BLOCKER, 0);
assert.equal(
  Object.values(reconciliation.summary.countsByClassification).reduce((sum, count) => sum + count, 0),
  239
);
const reconciledInstitutionalFields = reconciliation.fields
  .filter((field) => field.reconciliation.classification === "INSTITUTIONAL_RESOLVED")
  .map((field) => field.fieldId);
assert.deepEqual(reconciledInstitutionalFields, RESOLVED_INSTITUTIONAL_FIELD_IDS);

const fieldMapping = JSON.parse(readFileSync(new URL(
  "../CHARROPRO-FMCH-OFFICIAL-DOCUMENT-DATA-MAPPING-001/FIELD_MAPPING.json",
  import.meta.url
), "utf8"));
for (const fieldId of RESOLVED_INSTITUTIONAL_FIELD_IDS) {
  const mapping = fieldMapping.mappings.find((item) => item.fieldId === fieldId);
  assert.equal(mapping?.charroProStatus, "IMPLEMENTED", `${fieldId} has an implemented document source`);
  assert.equal(mapping?.compatibility, "FULL", `${fieldId} is resolved for the scoped document profile`);
  assert.equal(mapping?.gapType, "NONE", `${fieldId} is not an unsupported documentary gap`);
}
for (const fieldId of RESOLVED_REVIEW_FIELD_IDS) {
  const mapping = fieldMapping.mappings.find((item) => item.fieldId === fieldId);
  assert.equal(mapping?.charroProStatus, "IMPLEMENTED", `${fieldId} is implemented as a documentary field`);
  assert.equal(mapping?.compatibility, "FULL", `${fieldId} has exact scoped documentary compatibility`);
  assert.equal(mapping?.gapType, "NONE", `${fieldId} has no pending documentary review`);
}

const snapshotModuleSource = readFileSync(new URL("../js/core/officialFormatSnapshot.js", import.meta.url), "utf8");
for (const provisionalBlocker of [
  "fmch.document.judgeSignatures",
  "fmch.document.teamCaptainSignature",
  "fmch.document.institutionalAuthorization",
  "fmch.document.officialSeal",
  "fmch.document.manualCertificationFolio"
]) {
  assert.equal(snapshotModuleSource.includes(provisionalBlocker), false, `${provisionalBlocker} is not a documentary blocker`);
}

const oldCala = buildRecord("cala", 0, 0, 7, 1, {
  id: "official_cala_historical_r1",
  status: "historical",
  officialStatus: "historical",
  superseded: true,
  supersededBy: "official_cala_corrected_r2"
});
const correctedCala = buildRecord("cala", 0, 0, 12, 2, {
  id: "official_cala_corrected_r2",
  correction: true,
  correctedRecordId: oldCala.id
});
const correctedRecords = records.filter((record) => record.suerte.id !== "cala").concat(oldCala, correctedCala);
const corrected = createOfficialFormatSnapshot({ tournament, charreada, team, officialScores: correctedRecords }, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: GENERATED_AT
});
assert.equal(corrected.suertes.cala.attempts[0].officialScoreId, correctedCala.id);
assert.equal(corrected.suertes.cala.total, 12);
assert.equal(corrected.finalScore, 242);

const historicalIds = records.filter((record) => record.suerte.id !== "cala").map((record) => record.id).concat(oldCala.id);
const historical = createOfficialFormatSnapshot({ tournament, charreada, team, officialScores: correctedRecords }, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: GENERATED_AT,
  officialScoreIds: historicalIds
});
assert.equal(historical.suertes.cala.attempts[0].officialScoreId, oldCala.id, "an exact historical record set remains reproducible");
assert.equal(historical.finalScore, 237);

const mismatched = structuredClone(records);
mismatched[0].total = 999;
const blockedMismatch = createOfficialFormatSnapshot({ tournament, charreada, team, officialScores: mismatched }, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: GENERATED_AT
});
assert.equal(blockedMismatch.documentStatus, "BLOCKED_SOURCE");
assert.ok(blockedMismatch.errors.some((error) => error.includes("official-format-official-attempt-total-mismatch")));

const productBaseTournament = {
  ...tournament,
  ruleProfileId: "PRODUCT_BASE",
  ruleProfileVersion: "legacy",
  ruleProfileContentFingerprint: "",
  ruleProfileAssignment: null
};
const productBaseCharreada = { ...charreada, suerteIds: ["cala"] };
const legacyRecord = {
  ...records[0],
  id: "official_product_base_legacy",
  breakdown: { rulebook: { ruleProfileId: "PRODUCT_BASE", ruleProfileVersion: "legacy" } }
};
const productBaseSnapshot = createOfficialFormatSnapshot({
  tournament: productBaseTournament,
  charreada: productBaseCharreada,
  team,
  officialScores: [legacyRecord]
}, {
  tournamentId: TOURNAMENT_ID,
  charreadaId: CHARREADA_ID,
  teamId: TEAM_ID,
  generatedAt: GENERATED_AT
});
assert.equal(productBaseSnapshot.documentStatus, "BLOCKED_SOURCE");
assert.equal(productBaseSnapshot.suertes.cala.total, legacyRecord.total, "legacy official total is preserved without reinterpretation");
assert.ok(productBaseSnapshot.errors.includes(`official-format-attempt-v2-required:${legacyRecord.id}`));

assert.equal(officialPackage.sheets[0].snapshot.sourceOfficialScoreIds.length, 24);
assert.equal(officialPackage.sheets[0].snapshot.sourceAttemptKeys.length, 24);
assert.equal(officialPackage.sheets[0].snapshot.suertes.cala.attempts[0].sourceType, "OFFICIAL_SCORE_ATTEMPT_V2");

console.log("official-format-authoritative-snapshot.test.mjs: ok");
