import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const OLD_BUILD = "20260908-supervisor-historical-reconciliation-dryrun-ui-001-v1";
const configuration = JSON.parse(await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));
const BUILD = configuration.values.system.appVersion;

assert.notEqual(BUILD, OLD_BUILD, "the V3 candidate has a distinct cache identity");
assert.match(BUILD, /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/);

for (const modulePath of [
  "../js/public/canonicalPublicProjectionV3.js",
  "../js/public/publicProjection.js",
  "../js/public/publicProjectionLegacyAdapter.js",
  "../js/public/canonicalPublicTournamentData.js",
  "../js/core/canonicalTournamentResults.js",
  "../js/public/publicPortalClient.js",
  "../js/core/publicProjectionOutbox.js"
]) {
  const source = await readFile(new URL(modulePath, import.meta.url), "utf8");
  assert.doesNotMatch(source, new RegExp(`\\?v=${OLD_BUILD.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`), `${modulePath} has no V3 import under the old cache key`);
  for (const specifier of source.matchAll(/(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g)) {
    if (specifier[1].startsWith(".") && specifier[1].split("?")[0].endsWith(".js") && !specifier[1].includes("configurationBootstrap.js")) {
      assert.match(specifier[1], new RegExp(`\\?v=${BUILD.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}$`), `${modulePath} imports ${specifier[1]} with the candidate cache key`);
    }
  }
}

const projectionSource = await readFile(new URL("../js/public/publicProjection.js", import.meta.url), "utf8");
assert.match(projectionSource, /buildCanonicalPublicProjectionV3/);
assert.match(projectionSource, /buildLegacyPublicProjectionV2/);
assert.match(projectionSource, /retired V2 materialization path/);
console.log("public-projection-v3-release-cache-coherence.test.mjs: ok");
