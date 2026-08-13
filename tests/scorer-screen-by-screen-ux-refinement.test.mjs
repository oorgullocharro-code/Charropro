import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const ruleProfileSource = readFileSync(new URL("../js/data/ruleProfiles.js", import.meta.url), "utf8");
const attemptSource = readFileSync(new URL("../js/core/scoringAttempt.js", import.meta.url), "utf8");
const ternaRulesSource = readFileSync(new URL("../js/data/fmch2026TernaRules.js", import.meta.url), "utf8");

function sourceBetween(start, end) {
  const from = appSource.indexOf(start);
  const to = appSource.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `source section ${start} exists`);
  return appSource.slice(from, to);
}

const renderScoring = sourceBetween("function renderScoring(", "function buildScoringAttemptUiModel");
const header = sourceBetween("function renderScoringHeader(", "function renderScoringTeamCards");
const navigation = sourceBetween("function renderScoringNavigation(", "function renderTernaOpportunityBar");
const piales = sourceBetween("function renderAttemptMainPanel(", "function renderManganasMainPanel");
const coleadero = sourceBetween("function renderColeaderoMainPanel(", "function getColeadorDisplayName");
const jineteo = sourceBetween("function renderJineteoMainPanel(", "function renderTernaMainPanel");
const terna = sourceBetween("function renderTernaMainPanel(", "function charroNameForTerna");
const paso = sourceBetween("function renderPasoMainPanel(", "function renderGenericMainPanel");
const footer = sourceBetween("function renderScoringBottomBar(", "function getActivePendingScoreReviews");

assert.match(renderScoring, /renderScoringHeader\(charreada, context, charroName, attemptView\)/);
assert.match(header, /renderScoringLiveOverview\(attemptView\)/);
assert.match(appSource, /function renderScoringTeamCards[\s\S]*?getTeamCharreadaTotal/);
assert.equal((appSource.match(/data-scorer-zone="context"/g) || []).length, 1);

assert.match(navigation, /cp-scoring-navigation/);
assert.match(navigation, /context\.suerte\.attempts <= 1 && !showColeadorSelector/);
assert.match(navigation, /isFmch2026ManganaSuerte\(context\.suerte\.id\)/);
assert.match(navigation, /cp-coleadero-attempt-select/);
assert.doesNotMatch(coleadero, /renderOfficialSportTimer|cp-attempt-card|cp-main-total-card/);

assert.match(piales, /renderPialesDistanceCalculator/);
assert.doesNotMatch(piales, /renderOfficialSportTimer|renderAttemptSummaryButton|cp-main-total-card/);
assert.match(appSource, /data-action="adjust-piales-distance" data-delta="-1"/);
assert.match(appSource, /data-action="adjust-piales-distance" data-delta="1"/);

assert.match(jineteo, /cp-operational-control-bar/);
assert.doesNotMatch(jineteo, /renderOfficialSportTimer|official-timer-display/);
assert.match(appSource, /openIndividualInfractions = \["colas", "toro", "lazo", "pial_ruedo", "yegua"\]/);

assert.match(terna, /Lazador actual/);
assert.match(terna, /Intento actual/);
assert.match(terna, /Siguiente lazador/);
assert.match(terna, /Cuenta oficial visible en cabecera/);
assert.match(terna, /cp-inline-secondary-control/);
assert.match(appSource, /resolveFmch2026TernaNextSuerteId/);
assert.match(ternaRulesSource, /CLOSED_UNUSED/);

assert.match(appSource, /function formatManganaHistoryState/);
assert.match(appSource, /cp-mangana-history[\s\S]*?data-action="select-attempt"/);
assert.match(appSource, /"ACTIVA"/);
assert.match(appSource, /"PENDIENTE"/);
assert.match(appSource, /Básicas/);
assert.match(appSource, /Rodadas \/ variantes/);
assert.match(appSource, /Desdenes \/ especiales/);

assert.match(paso, /cp-paso-operational-zone/);
assert.match(paso, /renderScoringClassificationSlot/);
assert.match(paso, /Salida/);
assert.match(paso, /Desmonte/);
assert.doesNotMatch(paso, /START[\s\S]*paso_dismount|paso_dismount[\s\S]*START/);
assert.doesNotMatch(jineteo, /manganas[\s\S]*START|START[\s\S]*manganas/);

assert.match(appSource, /cp-disabled-reason/);
assert.match(appSource, /Selecciona una clasificación/);
assert.match(footer, /getScoringSaveButtonLabel/);
assert.match(footer, /Guardar →/);
assert.match(appSource, /function getScoringSaveButtonLabel[\s\S]*?getTernaNextContextLabel/);
assert.match(appSource, /context\.suerte\?\.id === "colas"[\s\S]*?coleadorIndex < participantSlots - 1[\s\S]*?teamIndex < entries\.length - 1[\s\S]*?attemptIndex < attempts - 1/);

assert.match(cssSource, /CHARROPRO-SCORER-SCREEN-BY-SCREEN-UX-REFINEMENT-001/);
assert.match(cssSource, /\.cp-team-card[\s\S]*?min-height:\s*44px/);
assert.match(cssSource, /\.cp-piales-distance-stepper[\s\S]*?grid-template-columns:\s*44px/);
assert.match(cssSource, /\.cp-scoring-family-group/);
assert.match(cssSource, /@media \(max-width:\s*1180px\)/);
assert.match(cssSource, /@media \(max-width:\s*760px\)/);
assert.match(cssSource, /@media \(max-width:\s*520px\)/);

assert.match(ruleProfileSource, /FMCH_2026_LIBRE_PROFILE[\s\S]*?version:\s*"0\.6\.0"/);
assert.match(attemptSource, /SCORING_ATTEMPT_SCHEMA_VERSION\s*=\s*2/);
assert.doesNotMatch(appSource, /class\s+.*TimerEngine|function\s+createSecond.*Timer/i);

console.log("Scorer screen-by-screen UX refinement tests passed.");
