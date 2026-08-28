import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url);
const BUILD = "20260828-fmch-terna-participant-identity-roster-persistence-001-v1";
const configuration = JSON.parse(await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));
assert.equal(configuration.values.system.appVersion, BUILD, "configuration is the canonical build authority");

const runtimeFiles = await collectRuntimeFiles(new URL("../js/", import.meta.url));
runtimeFiles.push(...(await readdir(ROOT, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => new URL(entry.name, ROOT)));

const importViolations = [];
const historicalBuilds = [];
for (const file of runtimeFiles) {
  const source = await readFile(file, "utf8");
  if (file.pathname.endsWith(".js")) {
    for (const specifier of listRelativeModuleSpecifiers(source)) {
      const url = new URL(specifier, file);
      const isStableBootstrap = url.pathname.endsWith("/configurationBootstrap.js");
      const version = url.searchParams.get("v");
      if ((isStableBootstrap && version !== null) || (!isStableBootstrap && version !== BUILD)) {
        importViolations.push(`${file.pathname} -> ${specifier}`);
      }
    }
  } else {
    if (/\?v=/.test(source)) importViolations.push(`${file.pathname} -> hardcoded HTML query`);
    if (!source.includes('src="./js/core/clientBootstrap.js"')) {
      importViolations.push(`${file.pathname} -> missing stable bootstrap`);
    }
  }
  for (const match of source.matchAll(/["'](2026\d{4,}-[A-Za-z0-9._-]+)["']/g)) {
    if (match[1] !== BUILD) historicalBuilds.push(`${file.pathname}:${match[1]}`);
  }
}
assert.deepEqual(importViolations, [], "runtime consumers derive one canonical build and bootstrap modules remain stable");
assert.deepEqual(historicalBuilds, [], "runtime files contain no historical hardcoded build values");
console.log("Cache-buster single authority: canonical configuration and zero stale runtime builds passed.");

function listRelativeModuleSpecifiers(source) {
  const output = [];
  for (const pattern of [
    /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g
  ]) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith(".")) output.push(match[1]);
    }
  }
  return output;
}

async function collectRuntimeFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) output.push(...await collectRuntimeFiles(url));
    else if (entry.name.endsWith(".js")) output.push(url);
  }
  return output;
}
