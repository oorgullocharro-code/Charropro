import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");

function sourceBetween(start, end) {
  const from = appSource.indexOf(start);
  const to = appSource.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `source section ${start} exists`);
  return appSource.slice(from, to);
}

const mangana = sourceBetween("function renderManganasMainPanel(", "function formatManganaHistoryStatus");
const manual = sourceBetween("function renderCustomScoreSection(", "function getTeamPenaltyRulesForSuerte");

assert.match(mangana, /<div class="cp-manganas-dashboard">[\s\S]*?cp-mangana-attempt[\s\S]*?cp-mangana-result[\s\S]*?cp-mangana-floreo[\s\S]*?cp-mangana-pulls/);
assert.match(mangana, /cp-mangana-result[\s\S]*?<span>Resultado<\/span>[\s\S]*?data-result="ACHIEVED"[\s\S]*?data-result="NOT_ACHIEVED"/);
assert.match(mangana, /Intento<\/span>[\s\S]*?de \$\{context\.suerte\.attempts\}[\s\S]*?pts/);
assert.match(mangana, /cp-mangana-remates[\s\S]*?data-action="set-mangana-remate"/);
assert.match(mangana, /cp-mangana-floreo-detail[\s\S]*?selectedDetail\.size/);
assert.match(mangana, /cp-mangana-history[\s\S]*?data-action="select-attempt"/);
assert.doesNotMatch(mangana, /manganasHistory|temporaryAttempts|attemptHistoryV3/);

assert.match(cssSource, /grid-template-areas:\s*"attempt attempt attempt"\s*"result floreo pulls"/);
assert.match(cssSource, /\.cp-mangana-result \{[\s\S]*?grid-area: result/);
assert.match(cssSource, /\.cp-mangana-floreo \{[\s\S]*?grid-area: floreo/);
assert.match(cssSource, /\.cp-mangana-pulls \{[\s\S]*?grid-area: pulls/);
assert.match(cssSource, /@media \(max-width: 760px\)[\s\S]*?"attempt"\s*"result"\s*"floreo"\s*"pulls"/);

assert.match(manual, /cp-manual-score-form[\s\S]*?clear-custom-form[\s\S]*?add-custom/);
assert.match(cssSource, /\.cp-manual-score-form \{[\s\S]*?grid-template-columns: minmax\(220px, 1fr\) minmax\(92px, 120px\) auto/);
