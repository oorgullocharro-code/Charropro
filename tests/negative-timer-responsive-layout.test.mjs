import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { formatOfficialTimerMs } from "../js/core/officialTimerLiveDisplay.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

const values = [-100, -59_900, -60_000, -599_900, -5_999_900].map(formatOfficialTimerMs);
assert.deepEqual(values, ["-00:00.1", "-00:59.9", "-01:00.0", "-09:59.9", "-99:59.9"]);

const css = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
const card = css.match(/\.graphic-timer \{[\s\S]*?\n\}/)?.[0] || "";
const value = [...css.matchAll(/\.graphic-timer strong \{[\s\S]*?\n\}/g)]
  .map((match) => match[0])
  .find((block) => block.includes("font-size")) || "";
assert.match(card, /position:\s*absolute/);
assert.match(card, /width:\s*min\(360px, calc\(100vw - \(var\(--graphic-timer-inset\) \* 2\)\)\)/);
assert.match(card, /container-type:\s*inline-size/);
assert.match(card, /box-sizing:\s*border-box/);
assert.match(value, /font-size:\s*clamp\(24px, 14cqw, 46px\)/);
assert.match(value, /white-space:\s*nowrap/);
assert.match(value, /max-width:\s*100%/);
assert.doesNotMatch(value, /text-overflow:\s*ellipsis/);

console.log("negative-timer-responsive-layout.test.mjs: ok");
