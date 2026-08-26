import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const BUILD = "20260826-pre-cala-brake-review-official-phase-002-v1";
const files = await collect(new URL("../js/", import.meta.url));
const identities = new Map();
const violations = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  const patterns = [
    /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) {
    if (!match[1].startsWith(".")) continue;
    const url = new URL(match[1], file);
    const physical = `${url.origin}${url.pathname}`;
    const isStableBootstrap = url.pathname.endsWith("/configurationBootstrap.js");
    const version = url.searchParams.get("v");
    if (url.hash || (isStableBootstrap ? version !== null : version !== BUILD)) {
      violations.push(`${file.pathname} -> ${match[1]}`);
    }
    if (!identities.has(physical)) identities.set(physical, new Set());
    identities.get(physical).add(url.href);
  }
}
assert.deepEqual(violations, [], "internal ES module imports use the canonical build except the stable bootstrap");
assert.deepEqual([...identities].filter(([, urls]) => urls.size > 1), [], "no module has multiple effective URLs");
for (const critical of ["/js/core/state.js", "/js/core/version.js", "/js/core/firebaseSync.js", "/js/data/ruleProfiles.js"]) {
  assert.ok([...identities.keys()].some((key) => key.endsWith(critical)), `${critical} participates in the single identity graph`);
}
console.log("MODULE_IDENTITY_SINGLE_BUILD: critical modules and complete internal graph passed.");

async function collect(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) output.push(...await collect(url));
    else if (entry.name.endsWith(".js")) output.push(url);
  }
  return output;
}
