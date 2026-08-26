import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deriveOfficialTimerLiveDisplay } from "../js/core/officialTimerLiveDisplay.js?v=20260826-pre-cala-brake-review-official-phase-002-v1";

const now = Date.parse("2026-08-25T12:00:12.300Z");
const snapshot = {
  timerId: "timer_colas:c1:e1:opportunity-1:participant-2",
  status: "RUNNING",
  mode: "COUNTDOWN",
  durationMs: 20000,
  officialElapsedMs: 1000,
  runningSince: "2026-08-25T12:00:10.000Z",
  sourceRevision: 4
};
const values = ["scorer", "graphics", "timer-display", "control", "broadcast"].map(() =>
  deriveOfficialTimerLiveDisplay(snapshot, now).formatted
);
assert.deepEqual(new Set(values).size, 1);
assert.equal(values[0], "00:16.7");

const sources = {
  scorer: readFileSync(new URL("../js/app.js", import.meta.url), "utf8"),
  graphics: readFileSync(new URL("../js/views/grafico.js", import.meta.url), "utf8"),
  display: readFileSync(new URL("../js/views/cronometro-pantalla.js", import.meta.url), "utf8"),
  control: readFileSync(new URL("../js/views/cronometro-control.js", import.meta.url), "utf8"),
  utility: readFileSync(new URL("../js/core/officialTimerLiveDisplay.js", import.meta.url), "utf8")
};
for (const [consumer, source] of Object.entries(sources).filter(([name]) => name !== "utility")) {
  assert.match(source, /deriveOfficialTimerLiveDisplay/, consumer);
  assert.match(source, /officialTimerTicker/, consumer);
}
assert.doesNotMatch(
  sources.utility,
  /firebase|runTransaction|updateFirebase|setFirebase|publishFirebase/i,
  "display interpolation cannot write authority state"
);
const scorerTick = sources.scorer.match(/function updateTernaTimerDisplays[\s\S]*?\n}/)?.[0] || "";
const graphicsTick = sources.graphics.match(/function updateTimerGraphicDisplay[\s\S]*?\n}/)?.[0] || "";
assert.doesNotMatch(scorerTick, /\brender\(/, "a scorer tick only updates timer DOM");
assert.doesNotMatch(graphicsTick, /\brender\(/, "a graphics tick only updates timer DOM");

console.log("official-timer-consumer-parity.test.mjs: ok");
