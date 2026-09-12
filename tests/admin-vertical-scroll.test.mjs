import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");

const rule = (selector) => {
  const match = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
};

const sidebar = rule("\\.sidebar");
const navigation = rule("\\.side-nav");
const main = rule("\\.main");

assert.match(sidebar, /min-height:\s*0/);
assert.match(sidebar, /overflow:\s*hidden/);
assert.match(navigation, /flex:\s*1\s+1\s+auto/);
assert.match(navigation, /min-height:\s*0/);
assert.match(navigation, /overflow-x:\s*hidden/);
assert.match(navigation, /overflow-y:\s*auto/);
assert.match(main, /overflow:\s*auto/);
assert.match(app, /\["settings", "Conexion", "link"\]/);

console.log("Admin vertical scroll tests passed.");
