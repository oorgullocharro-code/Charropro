import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OFFICIAL_FORMAT_DOCUMENT_PROFILE
} from "../js/core/officialFormatSnapshot.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import {
  OFFICIAL_FORMAT_PAPER
} from "../js/core/officialFormat.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

const viewSource = readFileSync(new URL("../js/views/formato-federacion.js", import.meta.url), "utf8");
const htmlRendererSource = readFileSync(new URL("../js/core/officialFormatHtml.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const formatSource = readFileSync(new URL("../js/core/officialFormat.js", import.meta.url), "utf8");

assert.deepEqual(OFFICIAL_FORMAT_PAPER, {
  name: "OFICIO_MEXICANO_FMCH_2024_2028",
  orientation: "portrait",
  widthInches: 8.5,
  heightInches: 13.403333,
  widthMillimeters: 215.9,
  heightMillimeters: 340.44,
  sourcePagePoints: { width: 612, height: 965.04 },
  marginsInches: { left: 0.18, right: 0.18, top: 0.2, bottom: 0.2, header: 0, footer: 0 }
});

assert.deepEqual(OFFICIAL_FORMAT_DOCUMENT_PROFILE.calaBadPointCodes, {
  cala_inf_abrir_hocico: "AH",
  cala_inf_estrellar_despapar_gorbetear: "D",
  cala_inf_rabear_espiguear: "R"
});
assert.equal(OFFICIAL_FORMAT_DOCUMENT_PROFILE.profileId, "FMCH_TEAM_SHEET_2024_2028");
assert.equal(OFFICIAL_FORMAT_DOCUMENT_PROFILE.version, "1.0.0");

assert.match(viewSource, /renderOfficialFormatSheetHtml/);
assert.match(htmlRendererSource, /buildWebColumnWidths/);
assert.match(htmlRendererSource, /<col class="official-column-\$\{role\}" style="width:\$\{width\}%">/);
assert.doesNotMatch(htmlRendererSource, /Number\(widths\[index\].*\*\s*7/);
assert.doesNotMatch(htmlRendererSource, /<col style="width:[^\n]*px/);
assert.doesNotMatch(htmlRendererSource, /visualRowHeights\?\.\[rowIndex\]/);

assert.match(cssSource, /\.official-document\s*\{[^}]*width:\s*1180px[^}]*min-width:\s*1180px/s);
assert.match(cssSource, /\.official-sheet\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*table-layout:\s*fixed[^}]*min-width:\s*0/s);
assert.match(cssSource, /@page\s*\{[^}]*size:\s*215\.9mm 340\.44mm/s);
assert.match(cssSource, /\.official-sheet-wrap\s*\{[^}]*overflow:\s*auto/s);
assert.match(htmlRendererSource, /visualRowRoles/);
assert.match(htmlRendererSource, /data-row-role=/);
assert.doesNotMatch(cssSource, /\.official-document\s*\{[^}]*width:\s*max-content/s);
assert.doesNotMatch(cssSource, /\.official-sheet\s*\{[^}]*min-width:\s*1500px/s);

assert.match(formatSource, /slot \? calaBadPointCode\(slot\) : "-"/);
assert.match(formatSource, /slot \? finite\(slot\.value\) : "-"/);
assert.match(formatSource, /CABECERO · 5 OPORTUNIDADES/);
assert.match(formatSource, /mergeVisual\(rows, merges, row, 18, row, 26, "PIAL"/);
assert.doesNotMatch(formatSource, /section\.teamPenaltyTotal \|\| "-"/);

console.log("official-format-pre-judge-final-corrections: ok");
