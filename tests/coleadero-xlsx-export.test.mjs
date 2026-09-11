import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildColeaderoXlsxWorkbook,
  createColeaderoXlsxBlob,
  isColeaderoXlsxExport
} from "../js/core/coleaderoXlsx.js?v=20260911-coleadero-live-graphics-five-rider-window-001-v1";

const fixture = buildFixture();
const workbook = buildColeaderoXlsxWorkbook(fixture.input);
assert.equal(workbook.sheets.length, 1, "Coleadero export contains one worksheet");
assert.equal(workbook.sheets[0].name, "Colas");
assert.deepEqual(workbook.sheets[0].merges, ["A1:D1", "E1:G1", "H1:J1", "K1:M1", "N1:N2"], "multilevel headers use exact, non-overlapping merges");
assert.deepEqual(workbook.sheets[0].rows[0].map((cell) => cell.value), [
  "COLEADERO", "", "", "", "1er PASADA", "", "", "2do PASADA", "", "", "3er PASADA", "", "", "TOTAL"
]);
assert.deepEqual(workbook.sheets[0].rows[1].map((cell) => cell.value), [
  "Lote", "Turno", "Participante", "Caballo", "BUENOS", "MALOS", "TOTAL", "BUENOS", "MALOS", "TOTAL", "BUENOS", "MALOS", "TOTAL", ""
]);
assert.deepEqual(workbook.sheets[0].rows.slice(2).map((row) => row.map((cell) => cell.value)), [
  ["Lote 1", 1, "Gustavo Mares", "Moro", 17, 2, 15, 18, 1, 12, 16, 2, 14, 41],
  ["Lote 1", 2, "Gustavo Mares", "Canela", 0, 0, 0, "", "", "", "", "", "", 0],
  ["Lote 2", 1, "Participante 3", "Relampago", 7, 2, 5, "", "", "", "", "", "", 5]
], "rows preserve lot/turn, official good and individual bad points, frozen totals, and zero versus absence");

const blob = createColeaderoXlsxBlob(fixture.input);
assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
if (process.env.CHARROPRO_COLEADERO_XLSX_PATH) {
  writeFileSync(process.env.CHARROPRO_COLEADERO_XLSX_PATH, Buffer.from(await blob.arrayBuffer()));
}
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
  assert.equal(parsed.relationshipsValid, true, "workbook and worksheet relationships resolve to existing parts");
  assert.equal(parsed.contentTypesValid, true, "OpenXML content types cover every required part");
  assert.equal(parsed.cellTypesValid, true, "all cells use valid inline text, numeric, or empty representations");
  assert.equal(parsed.styleReferencesValid, true, "all worksheet style indices resolve in styles.xml");
  assert.equal(parsed.hasMergeCells, true, "multilevel Colas headers emit a mergeCells container");
  assert.equal(parsed.mergeCount, 5, "mergeCells count matches the five header ranges");
  assert.equal(parsed.mergeStructureValid, true, "merge ranges are valid, non-overlapping, and count-consistent");
  assert.deepEqual(parsed.rows, [
    ["COLEADERO", null, null, null, "1er PASADA", null, null, "2do PASADA", null, null, "3er PASADA", null, null, "TOTAL"],
    ["Lote", "Turno", "Participante", "Caballo", "BUENOS", "MALOS", "TOTAL", "BUENOS", "MALOS", "TOTAL", "BUENOS", "MALOS", "TOTAL", null],
    ["Lote 1", 1, "Gustavo Mares", "Moro", 17, 2, 15, 18, 1, 12, 16, 2, 14, 41],
    ["Lote 1", 2, "Gustavo Mares", "Canela", 0, 0, 0, null, null, null, null, null, null, 0],
    ["Lote 2", 1, "Participante 3", "Relampago", 7, 2, 5, null, null, null, null, null, null, 5]
  ], "independent OpenXML parser reads official values without workbook repair");
} finally {
  rmSync(directory, { recursive: true, force: true });
}

assert.equal(isColeaderoXlsxExport({ tournament: fixture.input.state.tournaments[0], charreada: fixture.input.state.charreadas[0] }), true);
assert.equal(isColeaderoXlsxExport({
  tournament: { type: "equipos_completo" },
  charreada: { competitionId: "equipos_completo", competitionScope: "team" }
}), false, "team-charreada export remains on the existing Federation path");
assert.equal(isColeaderoXlsxExport({
  tournament: { type: "caladero" },
  charreada: { competitionId: "caladero", competitionScope: "individual" }
}), false, "Caladero remains on its existing export path");

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

const twoPassWorkbook = buildColeaderoXlsxWorkbook({
  ...fixture.input,
  canonicalTournamentResults: {
    sheet: {
      competitions: [{
        charreadaId: "lote-1",
        competitionId: "coleadero",
        opportunitiesPerParticipant: 2,
        rows: [{
          participantId: "participant-gustavo-moro",
          participantName: "Gustavo Mares",
          horseId: "horse-moro",
          horseName: "Moro",
          total: 27,
          opportunities: [
            { opportunityNumber: 1, officialPoints: 15, status: "VALID" },
            { opportunityNumber: 2, officialPoints: 12, status: "VALID" }
          ]
        }]
      }]
    }
  }
});
assert.deepEqual(twoPassWorkbook.sheets[0].merges, ["A1:D1", "E1:G1", "H1:J1", "K1:K2"], "header groups derive from the canonical slot count rather than a hardcoded three");
assert.deepEqual(twoPassWorkbook.sheets[0].rows[0].map((cell) => cell.value), ["COLEADERO", "", "", "", "1er PASADA", "", "", "2do PASADA", "", "", "TOTAL"]);

const unfrozenFixture = structuredClone(fixture.input);
for (const record of Object.values(unfrozenFixture.state.publishedScores)) delete record.breakdown.attemptV2.publication;
for (const ledger of Object.values(unfrozenFixture.state.officialScoreLedger)) {
  for (const record of Object.values(ledger.records)) delete record.breakdown.attemptV2.publication;
}
assert.throws(
  () => buildColeaderoXlsxWorkbook(unfrozenFixture),
  /coleadero-xlsx-official-attempt-not-frozen/,
  "the export refuses a current record that lacks the frozen Official Score snapshot"
);

console.log("coleadero-xlsx-export.test.mjs: ok");

function buildFixture() {
  const tournamentId = "coleadero-export";
  const charreadaId = "lote-1";
  const records = [
    record("gustavo-1", "participant-gustavo-moro", 1, { goodPoints: 17, individualBadPoints: 2, teamBadPoints: 0, officialPoints: 15 }),
    record("gustavo-2", "participant-gustavo-moro", 2, { goodPoints: 18, individualBadPoints: 1, teamBadPoints: 5, officialPoints: 12 }),
    record("gustavo-3", "participant-gustavo-moro", 3, { goodPoints: 16, individualBadPoints: 2, teamBadPoints: 0, officialPoints: 14 }),
    record("gustavo-canela-1", "participant-gustavo-canela", 1, { goodPoints: 0, individualBadPoints: 0, teamBadPoints: 0, officialPoints: 0 }),
    record("participant-3-1", "participant-3", 1, { goodPoints: 7, individualBadPoints: 2, teamBadPoints: 0, officialPoints: 5 }, "lote-2")
  ];
  function record(id, participantId, opportunityNumber, points, recordCharreadaId = charreadaId) {
    return {
      id,
      revision: 1,
      total: points.officialPoints,
      tournament: { id: tournamentId },
      charreada: { id: recordCharreadaId, competitionId: "coleadero" },
      competition: { id: "coleadero", competitionScope: "individual", competitionType: "coleadero" },
      participant: { id: participantId },
      suerte: { id: "colas", type: "coleadero" },
      breakdown: {
        attemptV2: {
          identity: { tournamentId, charreadaId: recordCharreadaId, competitionId: "coleadero", participantId, suerteId: "colas", opportunityNumber },
          sportState: { status: "VALID", opportunity: { number: opportunityNumber } },
          scoring: {
            goodPoints: points.goodPoints,
            individualBadPoints: points.individualBadPoints,
            teamBadPoints: points.teamBadPoints,
            teamAdjustedPoints: points.officialPoints
          },
          publication: { state: "OFFICIAL", frozen: true }
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
import json, re, sys, zipfile
from xml.etree import ElementTree as ET
path = sys.argv[1]
main = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
rels = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
package_rels = '{http://schemas.openxmlformats.org/package/2006/relationships}'
content_types = '{http://schemas.openxmlformats.org/package/2006/content-types}'
with zipfile.ZipFile(path) as archive:
  names = set(archive.namelist())
  root_relationships = ET.fromstring(archive.read('_rels/.rels'))
  content_type_document = ET.fromstring(archive.read('[Content_Types].xml'))
  workbook = ET.fromstring(archive.read('xl/workbook.xml'))
  workbook_relationships = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
  styles = ET.fromstring(archive.read('xl/styles.xml'))
  sheets = workbook.findall(main + 'sheets/' + main + 'sheet')
  worksheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
  relationship_targets = {
    relationship.attrib.get('Id'): relationship.attrib.get('Target')
    for relationship in workbook_relationships.findall(package_rels + 'Relationship')
  }
  workbook_root_target = any(
    relationship.attrib.get('Type', '').endswith('/officeDocument') and relationship.attrib.get('Target') == 'xl/workbook.xml'
    for relationship in root_relationships.findall(package_rels + 'Relationship')
  )
  worksheet_targets = []
  for sheet in sheets:
    relationship_id = sheet.attrib.get(rels + 'id')
    target = relationship_targets.get(relationship_id, '')
    worksheet_targets.append(target)
  relationships_valid = workbook_root_target and worksheet_targets == ['worksheets/sheet1.xml'] and 'xl/worksheets/sheet1.xml' in names
  overrides = {
    override.attrib.get('PartName'): override.attrib.get('ContentType')
    for override in content_type_document.findall(content_types + 'Override')
  }
  content_types_valid = (
    overrides.get('/xl/workbook.xml') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml' and
    overrides.get('/xl/styles.xml') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml' and
    overrides.get('/xl/worksheets/sheet1.xml') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'
  )
  cell_xfs = styles.find(main + 'cellXfs')
  style_count = len(cell_xfs.findall(main + 'xf')) if cell_xfs is not None else 0
  style_references_valid = style_count > 0
  cell_types_valid = True
  rows = []
  for row in worksheet.findall(main + 'sheetData/' + main + 'row'):
    values = []
    for cell in row.findall(main + 'c'):
      kind = cell.attrib.get('t')
      style = cell.attrib.get('s')
      if style is not None and (not style.isdigit() or int(style) >= style_count):
        style_references_valid = False
      if kind == 'inlineStr':
        node = cell.find(main + 'is/' + main + 't')
        values.append(node.text if node is not None else '')
        cell_types_valid = cell_types_valid and node is not None
      elif kind in (None, 'n'):
        node = cell.find(main + 'v')
        if node is None:
          values.append(None)
        else:
          try:
            values.append(float(node.text) if '.' in node.text else int(node.text))
          except (TypeError, ValueError):
            cell_types_valid = False
            values.append(None)
      else:
        cell_types_valid = False
        values.append(None)
    rows.append(values)
  merge_cells = worksheet.find(main + 'mergeCells')
  merge_refs = [merge.attrib.get('ref', '') for merge in merge_cells.findall(main + 'mergeCell')] if merge_cells is not None else []
  def coordinate(value):
    match = re.fullmatch(r'([A-Z]+)([1-9][0-9]*)', value or '')
    if not match:
      return None
    letters, row = match.groups()
    column = 0
    for letter in letters:
      column = column * 26 + ord(letter) - 64
    return (column, int(row))
  merge_ranges = []
  merge_structure_valid = merge_cells is None
  if merge_cells is not None:
    count = merge_cells.attrib.get('count')
    merge_structure_valid = count is not None and count.isdigit() and int(count) == len(merge_refs)
    for ref in merge_refs:
      parts = ref.split(':')
      start = coordinate(parts[0]) if len(parts) == 2 else None
      end = coordinate(parts[1]) if len(parts) == 2 else None
      if not start or not end or start[0] > end[0] or start[1] > end[1] or start == end:
        merge_structure_valid = False
        continue
      merge_ranges.append((start, end))
    for index, (left_start, left_end) in enumerate(merge_ranges):
      for right_start, right_end in merge_ranges[index + 1:]:
        overlap = not (left_end[0] < right_start[0] or right_end[0] < left_start[0] or left_end[1] < right_start[1] or right_end[1] < left_start[1])
        if overlap:
          merge_structure_valid = False
  print(json.dumps({
    'contentTypes': '[Content_Types].xml' in names,
    'workbook': 'xl/workbook.xml' in names,
    'worksheet': 'xl/worksheets/sheet1.xml' in names,
    'sheetCount': len(sheets),
    'sheetNames': [sheet.attrib.get('name') for sheet in sheets],
    'relationshipsValid': relationships_valid,
    'contentTypesValid': content_types_valid,
    'cellTypesValid': cell_types_valid,
    'styleReferencesValid': style_references_valid,
    'hasMergeCells': merge_cells is not None,
    'mergeCount': len(merge_cells.findall(main + 'mergeCell')) if merge_cells is not None else 0,
    'mergeStructureValid': merge_structure_valid,
    'rows': rows
  }))
`;
}
