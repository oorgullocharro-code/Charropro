import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const ruleProfileSource = readFileSync(new URL("../js/data/ruleProfiles.js", import.meta.url), "utf8");
const attemptSource = readFileSync(new URL("../js/core/scoringAttempt.js", import.meta.url), "utf8");

function occurrenceCount(source, pattern) {
  return source.match(pattern)?.length || 0;
}

const overviewPosition = appSource.indexOf("${renderScoringLiveOverview(attemptView)}");
const classificationPosition = appSource.indexOf("${renderScoringClassificationSlot(context, attemptView)}");
const mainPanelPosition = appSource.indexOf("${renderScoringMainPanel(charreada, context, charroName)}");
const controlsPosition = appSource.indexOf("${renderScoringActionAccordions(charreada, context, charroName, leaderboard)}");
const evidencePosition = appSource.indexOf("${renderTimeNoteSection(context)}");

assert.ok(overviewPosition > 0, "the common score overview exists");
assert.ok(overviewPosition < classificationPosition, "total and timer precede dynamic classification");
assert.ok(classificationPosition < mainPanelPosition, "classification precedes the specialized panel when it changes scoring");
assert.ok(mainPanelPosition < controlsPosition, "specialized controls precede the common rule controls");
assert.ok(controlsPosition < evidencePosition, "optional evidence follows sporting controls");

assert.equal(occurrenceCount(appSource, /renderScoringContextBar\(/g), 1, "the legacy context card is no longer rendered");
assert.equal(occurrenceCount(appSource, /renderScoringAttemptSummary\(/g), 1, "the duplicate bottom score summary is no longer rendered");
assert.equal(occurrenceCount(appSource, /data-scorer-zone="context"/g), 1, "the scorer exposes one primary context zone");
assert.match(appSource, /data-scorer-zone="score-overview"/);
assert.match(appSource, /data-scorer-zone="sport-controls"/);
assert.match(appSource, /data-scorer-zone="secondary-controls"/);
assert.match(appSource, /class="cp-live-total"[\s\S]*?summary\.totalPoints/);
assert.match(appSource, /renderScoringTimerGroup\(attemptView\)/);
assert.match(appSource, /isOfficialSportTimer[\s\S]*?data-official-timer-id/);

assert.match(appSource, /renderScoringAccordionGroup\("infr"[\s\S]*?collapsible:\s*true/);
assert.match(appSource, /renderScoringAccordionGroup\("teamPenalties"[\s\S]*?collapsible:\s*true/);
assert.match(appSource, /renderScoringAccordionGroup\("desc"[\s\S]*?collapsible:\s*true/);
assert.match(appSource, /<details class="card time-evidence-card cp-inline-secondary-control"/);
assert.match(appSource, /<details class="cp-mangana-floreo-detail"/);
assert.doesNotMatch(appSource, /showModal\([\s\S]{0,240}floreo/i, "floreo remains inline rather than modal");

const footerStart = appSource.indexOf("function renderScoringBottomBar");
const footerEnd = appSource.indexOf("function hasAttemptScoringActivity", footerStart);
const footerSource = appSource.slice(footerStart, footerEnd);
assert.ok(footerSource.indexOf("previous-score") < footerSource.indexOf("toggle-attempt-zero"));
assert.ok(footerSource.indexOf("toggle-attempt-zero") < footerSource.indexOf("next-score"));
assert.match(footerSource, /Guardar y siguiente/);
assert.match(footerSource, /Ajustar botonera/);
assert.doesNotMatch(footerSource, /data-action="toggle-desc"/, "zero and DQ stay separate");

assert.match(cssSource, /--scorer-touch-target:\s*56px/);
assert.match(cssSource, /\.scoring-shell-classic \.quick-button,[\s\S]*?min-height:\s*44px/);
assert.match(cssSource, /\.scoring-shell-classic \.cp-scoring-action-button[\s\S]*?min-height:\s*78px/);
assert.match(cssSource, /\.cp-live-score-overview\s*\{[\s\S]*?position:\s*sticky/);
assert.match(cssSource, /\.scoring-shell-classic\s*\{[\s\S]*?overflow-x:\s*hidden/);
assert.match(cssSource, /@media \(max-width:\s*980px\)/);
assert.match(cssSource, /@media \(max-width:\s*760px\)/);
assert.match(cssSource, /@media \(max-width:\s*640px\)/);

assert.match(ruleProfileSource, /FMCH_2026_LIBRE_PROFILE[\s\S]*?version:\s*"0\.6\.0"/);
assert.match(attemptSource, /SCORING_ATTEMPT_SCHEMA_VERSION\s*=\s*2/);
assert.match(appSource, /async function publishOfficialScoreForContext\(/);
assert.match(appSource, /publishOfficialScoreForContext\(publicationContext/);
assert.doesNotMatch(appSource, /Pendiente a revisi[oó]n/i);

console.log("Scorer information hierarchy compaction tests passed.");
