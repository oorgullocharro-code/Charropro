import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildColeaderoXlsxWorkbook,
  createColeaderoXlsxBlob,
  isColeaderoXlsxExport
} from "../js/core/coleaderoXlsx.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";

const fixture = buildFixture();
const workbook = buildColeaderoXlsxWorkbook(fixture.input);
assert.equal(workbook.sheets.length, 1, "Coleadero export contains one worksheet");
assert.equal(workbook.sheets[0].name, "Colas");
assert.deepEqual(workbook.sheets[0].rows[0].map((cell) => cell.value), ["Lote", "Turno", "Participante", "Caballo", "1ª", "2ª", "3ª", "Total"]);
assert.deepEqual(workbook.sheets[0].rows.slice(1).map((row) => row.map((cell) => cell.value)), [
  ["Lote 1", 1, "Gustavo Mares", "Moro", 15, 12, 14, 41],
  ["Lote 1", 2, "Gustavo Mares", "Canela", 0, "", "", 0],
  ["Lote 2", 1, "Participante 3", "Relampago", 5, "", "", 5]
], "rows preserve lot/turn, canonical identity and zero versus absence");

const blob = createColeaderoXlsxBlob(fixture.input);
assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
const directory = mkdtempSync(join(tmpdir(), "charropro-coleadero-xlsx-"));
const xlsxPath = join(directory, "colas.xlsx");
try {
  writeFileSync(xlsxPath, Buffer.from(await blob.arrayBuffer()));
  const parsed = JSON.parse(execFileSync("python3", ["-c", openXmlReader(), xlsxPath], { encoding: "utf8" }));
  assert.equal(parsed.contentTypes, true, "OpenXML content types exist");
  assert.equal(parsed.workbook, true, "OpenXML workbook exists");
  assert.equal(parsed.worksheet, true, "OpenXML sheet exists");
  assert.equal(parsed.sheetCount, 1, "independent parser reads exactly one worksheet");
  assert.deepEqual(parsed.sheetNames, ["Colas"]);
  assert.equal(parsed.mergeCount, 0, "flat Colas sheet has no inherited Federation merges");
  assert.deepEqual(parsed.rows, [
    ["Lote", "Turno", "Participante", "Caballo", "1ª", "2ª", "3ª", "Total"],
    ["Lote 1", 1, "Gustavo Mares", "Moro", 15, 12, 14, 41],
    ["Lote 1", 2, "Gustavo Mares", "Canela", 0, null, null, 0],
    ["Lote 2", 1, "Participante 3", "Relampago", 5, null, null, 5]
  ], "independent OpenXML parser reads official values without workbook repair");
} finally {
  rmSync(directory, { recursive: true, force: true });
}

assert.equal(isColeaderoXlsxExport({ tournament: fixture.input.state.tournaments[0], charreada: fixture.input.state.charreadas[0] }), true);
assert.equal(isColeaderoXlsxExport({
  tournament: { type: "equipos_completo" },
  charreada: { competitionId: "equipos_completo", competitionScope: "team" }
}), false, "team-charreada export remains on the existing Federation path");

const incompleteFixture = buildFixture();
const incompleteCanonical = {
  sheet: {
    competitions: [{
      charreadaId: "lote-1",
      opportunitiesPerParticipant: 3,
      rows: [{
        participantId: "participant-gustavo-moro",
        participantName: "Gustavo Mares",
        horseId: "horse-moro",
        horseName: "Moro",
        total: 0,
        opportunities: [{ opportunityNumber: 1 }]
      }]
    }]
  }
};
assert.throws(
  () => buildColeaderoXlsxWorkbook({ ...incompleteFixture.input, canonicalTournamentResults: incompleteCanonical }),
  /coleadero-xlsx-opportunity-invalid/,
  "an absent official opportunity is never materialized as a sporting zero"
);

console.log("coleadero-xlsx-export.test.mjs: ok");

function buildFixture() {
  const tournamentId = "coleadero-export";
  const charreadaId = "lote-1";
  const records = [
    record("gustavo-1", "participant-gustavo-moro", 1, 15),
    record("gustavo-2", "participant-gustavo-moro", 2, 12),
    record("gustavo-3", "participant-gustavo-moro", 3, 14),
    record("gustavo-canela-1", "participant-gustavo-canela", 1, 0),
    record("participant-3-1", "participant-3", 1, 5, "lote-2")
  ];
  function record(id, participantId, opportunityNumber, points, recordCharreadaId = charreadaId) {
    return {
      id,
      revision: 1,
      total: points,
      tournament: { id: tournamentId },
      charreada: { id: recordCharreadaId, competitionId: "coleadero" },
      competition: { id: "coleadero", competitionScope: "individual", competitionType: "coleadero" },
      participant: { id: participantId },
      suerte: { id: "colas", type: "coleadero" },
      breakdown: {
        attemptV2: {
          identity: { tournamentId, charreadaId: recordCharreadaId, competitionId: "coleadero", participantId, suerteId: "colas", opportunityNumber },
          sportState: { status: "VALID" },
          scoring: { teamAdjustedPoints: points, individualBadPoints: 0, teamBadPoints: 0 }
        }
      }
    };
  }
  const state = {
    activeTournamentId: tournamentId,
    activeCharreadaId: charreadaId,
    tournaments: [{
      id: tournamentId,
      name: "Coleadero de prueba",
      type: "coleadero",
      ruleProfileId: "FMCH_2026_LIBRE",
      ruleProfileVersion: "0.6.1",
      ruleProfileAssignment: {
        authorityVersion: "1.0.0", tournamentId, profileId: "FMCH_2026_LIBRE", version: "0.6.1",
        status: "active", contentFingerprint: "rptp_10e596046446e850", revision: 1
      }
    }],
    charreadas: [{
      id: charreadaId,
      tournamentId,
      name: "Lote 1",
      order: 1,
      competitionId: "coleadero",
      competitionType: "coleadero",
      competitionScope: "individual",
      participantIds: ["participant-gustavo-moro", "participant-gustavo-canela"]
    }, {
      id: "lote-2",
      tournamentId,
      name: "Lote 2",
      order: 2,
      competitionId: "coleadero",
      competitionType: "coleadero",
      competitionScope: "individual",
      participantIds: ["participant-3"]
    }],
    teams: [],
    participants: [
      { id: "participant-gustavo-moro", tournamentId, participantName: "Gustavo Mares", horseId: "horse-moro" },
      { id: "participant-gustavo-canela", tournamentId, participantName: "Gustavo Mares", horseId: "horse-canela" },
      { id: "participant-3", tournamentId, participantName: "Participante 3", horseId: "horse-relampago" }
    ],
    horses: [
      { id: "horse-moro", tournamentId, displayName: "Moro" },
      { id: "horse-canela", tournamentId, displayName: "Canela" },
      { id: "horse-relampago", tournamentId, displayName: "Relampago" }
    ],
    publishedScores: Object.fromEntries(records.map((item) => [item.id, item])),
    officialScoreLedger: Object.fromEntries(records.map((item) => [item.id, { activeRecordId: item.id, records: { [item.id]: item } }]))
  };
  return { input: { state, generatedAt: "2026-09-11T00:00:00.000Z" } };
}

function openXmlReader() {
  return String.raw`
import json, sys, zipfile
from xml.etree import ElementTree as ET
path = sys.argv[1]
main = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
rels = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
with zipfile.ZipFile(path) as archive:
  names = set(archive.namelist())
  workbook = ET.fromstring(archive.read('xl/workbook.xml'))
  sheets = workbook.findall(main + 'sheets/' + main + 'sheet')
  worksheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
  rows = []
  for row in worksheet.findall(main + 'sheetData/' + main + 'row'):
    values = []
    for cell in row.findall(main + 'c'):
      kind = cell.attrib.get('t')
      if kind == 'inlineStr':
        node = cell.find(main + 'is/' + main + 't')
        values.append(node.text if node is not None else '')
      else:
        node = cell.find(main + 'v')
        values.append(float(node.text) if node is not None and '.' in node.text else int(node.text) if node is not None else None)
    rows.append(values)
  print(json.dumps({
    'contentTypes': '[Content_Types].xml' in names,
    'workbook': 'xl/workbook.xml' in names,
    'worksheet': 'xl/worksheets/sheet1.xml' in names,
    'sheetCount': len(sheets),
    'sheetNames': [sheet.attrib.get('name') for sheet in sheets],
    'mergeCount': len(worksheet.findall(main + 'mergeCells/' + main + 'mergeCell')),
    'rows': rows
  }))
`;
}
