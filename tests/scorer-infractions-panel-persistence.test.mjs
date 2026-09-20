import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const accordionStart = appSource.indexOf("function renderScoringActionAccordions(");
const accordionEnd = appSource.indexOf("function renderScoringActionGroupBody(", accordionStart);
const accordionSource = appSource.slice(accordionStart, accordionEnd);

assert.ok(accordionStart >= 0, "the scorer action accordion renderer exists");
assert.match(
  accordionSource,
  /renderScoringAccordionGroup\("infr", "Infracciones", "warning",[\s\S]*?\{ collapsible: true, defaultOpen: true \}\)/,
  "individual infractions render open by default for every scoring context"
);
assert.doesNotMatch(
  accordionSource,
  /openIndividualInfractions|context\.suerte\.id.*(?:colas|toro|lazo|pial_ruedo|yegua)/,
  "the open state does not depend on a subset of suertes"
);
assert.match(
  accordionSource,
  /renderScoringAccordionGroup\("adic", "Adicionales", "plus",[\s\S]*?\)(?:,|\n)/,
  "additional controls retain their existing non-collapsible rendering path"
);
assert.match(
  appSource,
  /function persistScoreChange\(\)[\s\S]*?render\(\{ preserveScoringScroll: true \}\);/,
  "score updates preserve scorer scroll while rebuilding the open infractions panel"
);

for (const suerteId of ["cala", "colas", "manganas_pie"]) {
  assert.match(accordionSource, /defaultOpen: true/, `${suerteId} receives the universal infractions default`);
}

console.log("Scorer infractions panel persistence tests passed.");
