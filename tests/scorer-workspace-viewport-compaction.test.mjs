import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const attemptSource = readFileSync(new URL("../js/core/scoringAttempt.js", import.meta.url), "utf8");
const flowSource = readFileSync(new URL("../js/core/flow.js", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../js/data/ruleProfiles.js", import.meta.url), "utf8");

function sourceBetween(start, end) {
  const from = appSource.indexOf(start);
  const to = appSource.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `source section ${start} exists`);
  return appSource.slice(from, to);
}

const scorer = sourceBetween("function renderScoring(", "function buildScoringAttemptUiModel");
const mangana = sourceBetween("function renderManganasMainPanel(", "function renderOfficialSportTimer");
const manual = sourceBetween("function renderCustomScoreSection(", "function getTeamPenaltyRulesForSuerte");
const footer = sourceBetween("function renderScoringBottomBar(", "function getActivePendingScoreReviews");

assert.match(scorer, /<header class="scoring-header"|renderScoringHeader\(/, "Zone A header remains in the scorer");
assert.match(scorer, /<main class="scoring-main">[\s\S]*?<section class="score-workspace cp-scoring-main">/, "Zone B remains the internal workspace");
assert.match(scorer, /renderScoringBottomBar\(context\)/, "Zone C footer remains fixed in the shell");
assert.match(footer, /cp-save-score-button/, "critical save action remains present");

assert.match(manual, /cp-manual-score-form/, "manual capture uses the shared compact form contract");
assert.match(manual, /clear-custom-form[\s\S]*?add-custom/, "manual capture preserves cancel and add actions");
assert.match(appSource, /cp-manual-score-form[\s\S]*?add-team-penalty/, "team penalty manual capture uses the shared compact form contract");

assert.match(mangana, /cp-manganas-dashboard/);
assert.match(mangana, /cp-mangana-history" aria-label="Historial de intentos"/);
assert.match(mangana, /Historial de intentos/);
assert.match(mangana, /Attempt V2/);
assert.match(mangana, /formatManganaHistoryStatus/);
assert.match(mangana, /formatManganaHistoryDetail/);
assert.match(mangana, /hasAttemptVisibleResult\(historyAttempt\)/, "history derives from canonical attempts");
assert.doesNotMatch(mangana, /attemptHistoryV3|manganasAttemptsLocal|temporaryAttempts/);
assert.match(mangana, /button green[\s\S]*?set-mangana-result[\s\S]*?ACHIEVED/);
assert.match(mangana, /button red[\s\S]*?set-mangana-result[\s\S]*?NOT_ACHIEVED/);
assert.match(mangana, /cp-mangana-floreo-detail" \$\{selectedDetail\.size \? "open" : ""\}/, "floreo remains collapsed until existing details are selected");

assert.match(cssSource, /CHARROPRO-SCORER-WORKSPACE-VIEWPORT-COMPACTION-001/);
assert.match(cssSource, /--scorer-workspace-gap/);
assert.match(cssSource, /\.cp-manual-score-form[\s\S]*?grid-template-columns:[\s\S]*?auto/);
assert.match(cssSource, /@media \(max-width:\s*760px\)[\s\S]*?\.cp-manual-score-form[\s\S]*?grid-template-columns:\s*1fr/);
assert.match(cssSource, /\.cp-manganas-panel[\s\S]*?grid-template-areas:[\s\S]*?"dashboard history"/);
assert.match(cssSource, /\.cp-mangana-history > button\.active[\s\S]*?var\(--blue-2\)/);
assert.match(cssSource, /\.cp-mangana-history > button\.completed[\s\S]*?var\(--green\)/);
assert.match(cssSource, /\.cp-mangana-history > button\.pending[\s\S]*?var\(--amber\)/);
assert.match(cssSource, /\.cp-mangana-result \.button\.green\.active/);
assert.match(cssSource, /\.cp-mangana-result \.button\.red\.active/);

assert.match(attemptSource, /SCORING_ATTEMPT_SCHEMA_VERSION\s*=\s*2/, "Attempt V2 remains the canonical schema");
assert.match(profileSource, /FMCH_2026_LIBRE_PROFILE[\s\S]*?version:\s*"0\.6\.0"/, "sporting profile is unchanged");
assert.match(flowSource, /export function advanceScoringPointer\(/, "existing Flow Engine remains active");
assert.doesNotMatch(appSource, /class\s+.*TimerEngine|function\s+createSecond.*Timer/i, "no second timer engine is introduced");
