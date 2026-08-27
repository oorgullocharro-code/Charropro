import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FMCH_2026_CALA_INFR_RULES } from "../js/data/calaRules.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";
import {
  DOCUMENTED_CALA_BAD_POINT_CODES,
  OFFICIAL_FORMAT_COLUMN_ROLES,
  OFFICIAL_FORMAT_COLUMN_WIDTHS,
  OFFICIAL_FORMAT_MAX_WEB_WIDTH_PX,
  OFFICIAL_FORMAT_PAPER,
  OFFICIAL_FORMAT_ROW_ROLE_METRICS,
  OFFICIAL_FORMAT_TEXT_POLICY,
  OFFICIAL_FORMAT_WEB_DOCUMENT_WIDTH_PX,
  buildCalaDocumentAbbreviationMatrix,
  buildOfficialFormatRowGeometry
} from "../js/core/officialFormatDocumentModel.js?v=20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1";

const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const viewSource = readFileSync(new URL("../js/views/formato-federacion.js", import.meta.url), "utf8");
const rendererSource = readFileSync(new URL("../js/core/officialFormatHtml.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../formato-federacion.html", import.meta.url), "utf8");

assert.equal(OFFICIAL_FORMAT_PAPER.name, "OFICIO_MEXICANO_FMCH_2024_2028");
assert.equal(OFFICIAL_FORMAT_PAPER.orientation, "portrait");
assert.equal(OFFICIAL_FORMAT_PAPER.widthMillimeters, 215.9);
assert.equal(OFFICIAL_FORMAT_PAPER.heightMillimeters, 340.44);
assert.equal(OFFICIAL_FORMAT_WEB_DOCUMENT_WIDTH_PX, 1180);
assert.ok(OFFICIAL_FORMAT_WEB_DOCUMENT_WIDTH_PX < OFFICIAL_FORMAT_MAX_WEB_WIDTH_PX);
assert.equal(OFFICIAL_FORMAT_COLUMN_WIDTHS.length, 32);
assert.equal(OFFICIAL_FORMAT_COLUMN_ROLES.length, 32);

const geometry = buildOfficialFormatRowGeometry(64);
assert.equal(geometry.roles.length, 64);
assert.equal(geometry.xlsxHeights.length, 64);
assert.equal(geometry.webHeights.length, 64);
for (const role of new Set(geometry.roles)) {
  const indexes = geometry.roles.map((item, index) => item === role ? index : -1).filter((index) => index >= 0);
  assert.ok(indexes.every((index) => geometry.xlsxHeights[index] === OFFICIAL_FORMAT_ROW_ROLE_METRICS[role].xlsxPoints));
  assert.ok(indexes.every((index) => geometry.webHeights[index] === OFFICIAL_FORMAT_ROW_ROLE_METRICS[role].webPixels));
}
assert.equal(OFFICIAL_FORMAT_TEXT_POLICY.maximumPreferredLines, 2);
assert.ok(OFFICIAL_FORMAT_TEXT_POLICY.minimumReadableFontPoints >= 5.5);

const abbreviations = buildCalaDocumentAbbreviationMatrix(FMCH_2026_CALA_INFR_RULES);
assert.equal(abbreviations.length, FMCH_2026_CALA_INFR_RULES.length);
const codeByRuleId = new Map(abbreviations.map((item) => [item.ruleId, item]));
for (const [ruleId, code] of Object.entries(DOCUMENTED_CALA_BAD_POINT_CODES)) {
  assert.equal(codeByRuleId.get(ruleId)?.code, code);
  assert.equal(codeByRuleId.get(ruleId)?.source, "DOCUMENTED");
}
assert.equal(codeByRuleId.get("cala_inf_lados_caminando")?.source, "GENERATED");
assert.match(codeByRuleId.get("cala_inf_lados_caminando")?.code || "", /^[A-Z0-9]{2,4}$/);
assert.deepEqual(
  abbreviations,
  buildCalaDocumentAbbreviationMatrix([...FMCH_2026_CALA_INFR_RULES].reverse()),
  "document abbreviations are deterministic regardless of input order"
);
assert.equal(new Set(abbreviations.map((item) => item.code)).size, abbreviations.length);
assert.ok(abbreviations.every((item) => item.documentProfileId === "FMCH_TEAM_SHEET_2024_2028"));
assert.ok(abbreviations.every((item) => item.documentProfileVersion === "1.0.0"));

assert.match(cssSource, /\.official-sheet-wrap\s*\{[^}]*overflow:\s*auto/s);
assert.match(cssSource, /\.official-document\s*\{[^}]*width:\s*1180px[^}]*min-width:\s*1180px/s);
assert.match(cssSource, /@page\s*\{[^}]*size:\s*215\.9mm 340\.44mm/s);
assert.match(cssSource, /@media print[\s\S]*\.official-document\s*\{[^}]*zoom:\s*\.9/s);
assert.match(cssSource, /\.official-row\s*\{[^}]*height:\s*var\(--official-row-height/s);
assert.match(viewSource, /renderOfficialFormatSheetHtml/);
assert.match(rendererSource, /visualWebRowHeights/);
assert.match(rendererSource, /data-row-role=/);
assert.match(rendererSource, /replace\(\/\[ \\t\]\+\$\/gm, ""\)/);
assert.match(viewSource, /window\.print\(\)/);
assert.doesNotMatch(`${viewSource}\n${rendererSource}`, /width:[^\n]*1333333/);
assert.doesNotMatch(cssSource, /overflow:\s*hidden[^}]*official-sheet-wrap/s);
assert.match(htmlSource, /formato-federacion\.js/);

console.log("official-format-html-print-geometry: ok");
