import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  formatOfficialFieldTimerMs,
  getOfficialFieldTimerFormat
} from "../js/core/officialFieldTimerDisplay.js?v=20260831-official-ranking-authority-public-parity-001-v1";

const cases = new Map([
  [14_400, "14.4"],
  [5_200, "05.2"],
  [0, "0.0"],
  [-100, "-0.1"],
  [-14_400, "-14.4"],
  [-59_900, "-59.9"],
  [60_100, "01:00.1"],
  [74_400, "01:14.4"],
  [-60_100, "-01:00.1"],
  [-74_400, "-01:14.4"],
  [-754_500, "-12:34.5"],
  [-5_999_900, "-99:59.9"]
]);

for (const [value, expected] of cases) assert.equal(formatOfficialFieldTimerMs(value), expected);
assert.equal(getOfficialFieldTimerFormat(59_999), "seconds");
assert.equal(getOfficialFieldTimerFormat(-59_999), "seconds");
assert.equal(getOfficialFieldTimerFormat(60_000), "minutes");
assert.equal(getOfficialFieldTimerFormat(-60_000), "minutes");

const [viewSource, css, sharedSource, graphicsHtml, rules, functionsIndex, scoring, temporalPolicy] = await Promise.all([
  readFile(new URL("../js/views/cronometro-pantalla.js", import.meta.url), "utf8"),
  readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
  readFile(new URL("../js/core/officialTimerLiveDisplay.js", import.meta.url), "utf8"),
  readFile(new URL("../grafico-cronometro.html", import.meta.url), "utf8"),
  readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8"),
  readFile(new URL("../functions/index.js", import.meta.url), "utf8"),
  readFile(new URL("../js/core/scoring.js", import.meta.url), "utf8"),
  readFile(new URL("../js/data/ruleProfileTemporalPolicy.js", import.meta.url), "utf8")
]);

assert.match(viewSource, /formatOfficialFieldTimerMs\(view\.displayMs\)/);
assert.match(viewSource, /display\.dataset\.timerFormat = view\.fieldFormat/);
assert.match(sharedSource, /formatOfficialTimerMs\(displayMs\)/, "shared timer projection remains unchanged");
assert.match(graphicsHtml, /data-charropro-entry="\.\/js\/views\/grafico\.js"/, "OBS timer entrypoint remains unchanged");

const panel = css.match(/\.timer-display-panel \{[\s\S]*?\n\}/)?.[0] || "";
const clock = css.match(/\.timer-display-panel strong \{[\s\S]*?\n\}/)?.[0] || "";
const secondsClock = css.match(/\.timer-display-panel strong\[data-timer-format="seconds"\] \{[\s\S]*?\n\}/)?.[0] || "";
const context = css.match(/\.timer-display-panel p \{[\s\S]*?\n\}/)?.[0] || "";
assert.match(panel, /container-type:\s*inline-size/);
assert.match(panel, /min-width:\s*0/);
assert.match(clock, /font-size:\s*clamp\(40px, 16cqw, 360px\)/);
assert.match(clock, /white-space:\s*nowrap/);
assert.match(clock, /max-width:\s*100%/);
assert.match(clock, /overflow:\s*visible/);
assert.doesNotMatch(clock, /text-overflow:\s*ellipsis/);
assert.match(secondsClock, /font-size:\s*clamp\(62px, 24cqw, 420px\)/);
assert.match(context, /width:\s*100%/);
assert.match(context, /min-width:\s*0/);

for (const source of [rules, functionsIndex, scoring, temporalPolicy]) assert.ok(source.length > 0);
console.log("official-field-timer-responsive-display.test.mjs: ok");
