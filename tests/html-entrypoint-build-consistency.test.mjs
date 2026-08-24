import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const htmlFiles = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => entry.name)
  .sort();
assert.equal(htmlFiles.length, 26, "all productive root HTML entrypoints are audited");
for (const file of htmlFiles) {
  const source = await readFile(new URL(file, root), "utf8");
  assert.equal((source.match(/src="\.\/js\/core\/clientBootstrap\.js"/g) || []).length, 1, `${file} has one stable bootstrap`);
  assert.equal((source.match(/data-charropro-entry="\.\/js\/[^"]+\.js"/g) || []).length, 1, `${file} declares one derived entrypoint`);
  assert.doesNotMatch(source, /\?v=/, `${file} has no hardcoded cache-buster`);
  assert.doesNotMatch(source, /<link rel="stylesheet" href="\.\/css\//, `${file} does not load local CSS outside build authority`);
  for (const match of source.matchAll(/data-charropro-build-href="([^"]+)"/g)) {
    assert.match(match[1], /^\.\/css\/[A-Za-z0-9_.\/-]+\.css$/, `${file} declares a valid derived stylesheet`);
  }
}
console.log(`HTML_ENTRYPOINT_BUILD_CONSISTENCY: ${htmlFiles.length}/${htmlFiles.length} passed.`);
