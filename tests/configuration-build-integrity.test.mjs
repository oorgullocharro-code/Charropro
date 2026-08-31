import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import configurationEngine from "../functions/configurationEngine.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";
import { loadConfigurationBootstrap } from "../js/core/configurationBootstrap.js";
import { bootstrapCharroProClient, buildVersionedUrl } from "../js/core/clientBootstrap.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

const BUILD = "20260831-firebase-functions-node22-runtime-migration-001-v1";
const configuration = JSON.parse(await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));
const normalized = configurationEngine.normalizeConfigurationRecord(configuration);
assert.equal(normalized.checksum, configuration.checksum);
assert.equal(configuration.fingerprint, configuration.checksum);
assert.equal(configuration.values.system.appVersion, BUILD);
assert.equal((await loadConfigurationBootstrap({ source: configuration })).values.system.appVersion, BUILD);
assert.equal(buildVersionedUrl("./js/app.js", "https://example.test/index.html", BUILD), `https://example.test/js/app.js?v=${BUILD}`);

const imported = [];
const fakeScript = { getAttribute: (name) => name === "data-charropro-entry" ? "./js/app.js" : null };
const fakeDocument = { baseURI: "https://example.test/index.html", querySelectorAll: () => [] };
const runtime = await bootstrapCharroProClient({
  configuration: { source: configuration },
  document: fakeDocument,
  script: fakeScript,
  importModule: async (url) => imported.push(url)
});
assert.equal(runtime.appVersion, BUILD);
assert.equal(runtime.checksum, configuration.checksum);
assert.deepEqual(imported, [`https://example.test/js/app.js?v=${BUILD}`]);
console.log("CONFIGURATION_BUILD_INTEGRITY: checksum, bootstrap and runtime derivation passed.");
