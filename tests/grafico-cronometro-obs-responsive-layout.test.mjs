import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildGraphicTimerPresentation,
  formatGraphicTimerMs,
  readGraphicTimerPresentationOptions
} from "../js/views/graficoTimerPresentation.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

assert.equal(formatGraphicTimerMs(12_100, { showMinutes: false }), "12.1");
assert.equal(formatGraphicTimerMs(-12_100, { showMinutes: false }), "-12.1");
assert.equal(formatGraphicTimerMs(59_900, { showMinutes: false }), "59.9");
assert.equal(formatGraphicTimerMs(-59_900, { showMinutes: false }), "-59.9");
assert.equal(formatGraphicTimerMs(60_000, { showMinutes: true }), "01:00.0");
assert.equal(formatGraphicTimerMs(-60_100, { showMinutes: true }), "-01:00.1");
assert.equal(formatGraphicTimerMs(-5_999_900, { showMinutes: true }), "-99:59.9");
assert.deepEqual(readGraphicTimerPresentationOptions("?showMinutes=0"), { showMinutes: false });
assert.deepEqual(readGraphicTimerPresentationOptions("?minutes=1"), { showMinutes: true });

const overtime = buildGraphicTimerPresentation(
  { suerteLabel: "PASO DE LA MUERTE" },
  { status: "RUNNING", displayMs: -12_100, durationMs: 180_000, overtime: true },
  {},
  { showMinutes: false }
);
assert.deepEqual(overtime, {
  stateLabel: "TIEMPO EN CURSO",
  formattedTime: "-12.1",
  suerteLabel: "PASO DE LA MUERTE",
  overtime: true,
  showMinutes: false
});

const finished = buildGraphicTimerPresentation(
  {},
  { status: "FINISHED", displayMs: -60_100, durationMs: 300_000, overtime: true },
  { turn: { suerte: { fullName: "TERNA EN EL RUEDO" } } }
);
assert.equal(finished.stateLabel, "TIEMPO FINALIZADO");
assert.equal(finished.formattedTime, "-01:00.1");
assert.equal(finished.suerteLabel, "TERNA EN EL RUEDO");

for (const [status, label] of Object.entries({
  READY: "TIEMPO LISTO",
  RUNNING: "TIEMPO EN CURSO",
  PAUSED: "TIEMPO PAUSADO",
  FINISHED: "TIEMPO FINALIZADO",
  STALE: "TIEMPO DESACTUALIZADO"
})) {
  assert.equal(buildGraphicTimerPresentation({}, { status, displayMs: 0 }, {}).stateLabel, label);
}

const css = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
assert.match(css, /#graphic-root\[data-view="timer"\]\s*\{[\s\S]*?display:\s*block/);
assert.match(css, /\.graphic-timer-stage\s*\{[\s\S]*?transform:\s*none/);
assert.match(css, /\.graphic-timer\s*\{[\s\S]*?top:\s*var\(--graphic-timer-inset\)/);
assert.match(css, /\.graphic-timer\s*\{[\s\S]*?left:\s*var\(--graphic-timer-inset\)/);
assert.match(css, /\.graphic-timer strong\s*\{[\s\S]*?font-size:\s*clamp\(24px, 14cqw, 46px\)/);
assert.match(css, /\.graphic-timer\.overtime[\s\S]*?color:\s*#ff8b8b/);
assert.doesNotMatch(css.match(/\.graphic-timer strong\s*\{[\s\S]*?\n\}/)?.[0] || "", /text-overflow:\s*ellipsis/);

console.log("grafico-cronometro-obs-responsive-layout.test.mjs: ok");
