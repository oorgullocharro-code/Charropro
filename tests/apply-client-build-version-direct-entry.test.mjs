import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const temp = mkdtempSync("/tmp/charropro-apply-build-version-");
const releaseRoot = join(temp, "release");
const entrypoint = join(temp, "applyClientBuildVersion.mjs");
const sourceEntrypoint = fileURLToPath(new URL("../tools/release/applyClientBuildVersion.mjs", import.meta.url));
const build = "TEST_RELEASE_BUILD";
const staleImport = (specifier) => ["import", ` \"${specifier}?v=`, "OLD_BUILD", '\";'].join("");

try {
  mkdirSync(join(releaseRoot, "functions", "reconciliationShared"), { recursive: true });
  mkdirSync(join(releaseRoot, "js", "core"), { recursive: true });
  mkdirSync(join(releaseRoot, "js", "public"), { recursive: true });
  mkdirSync(join(releaseRoot, "js", "views"), { recursive: true });
  writeFileSync(join(releaseRoot, "functions", "configuration.defaults.json"), JSON.stringify({ values: { system: { appVersion: build } } }));
  writeFileSync(join(releaseRoot, "js", "views", "cronometro-control.js"), staleImport("../core/firebaseSync.js"));
  writeFileSync(join(releaseRoot, "js", "core", "firebaseSync.js"), staleImport("./timerRules.js"));
  writeFileSync(join(releaseRoot, "js", "core", "timerRules.js"), staleImport("./officialTimerOrchestration.js"));
  writeFileSync(join(releaseRoot, "js", "core", "officialTimerOrchestration.js"), "export const timerOrchestration = true;");
  writeFileSync(join(releaseRoot, "js", "core", "publicProjectionOutbox.js"), "export const outbox = true;");
  writeFileSync(join(releaseRoot, "js", "public", "publicProjection.js"), staleImport("../core/publicProjectionOutbox.js"));
  symlinkSync(sourceEntrypoint, entrypoint);

  const output = execFileSync("node", [entrypoint, releaseRoot], { encoding: "utf8" });
  const result = JSON.parse(output);
  assert.equal(result.build, build);
  assert.deepEqual(result.changed, [
    "js/core/firebaseSync.js",
    "js/core/timerRules.js",
    "js/public/publicProjection.js",
    "js/views/cronometro-control.js"
  ]);
  assert.deepEqual(result.sharedAuthorityFiles, [
    "core/publicProjectionOutbox.js",
    "public/publicProjection.js"
  ]);
  for (const file of [
    join(releaseRoot, "js", "views", "cronometro-control.js"),
    join(releaseRoot, "js", "core", "firebaseSync.js"),
    join(releaseRoot, "js", "core", "timerRules.js")
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /OLD_BUILD/);
    assert.match(source, new RegExp(`\\?v=${build}`));
  }
  assert.equal(
    readFileSync(join(releaseRoot, "functions", "reconciliationShared", "public", "publicProjection.js"), "utf8"),
    readFileSync(join(releaseRoot, "js", "public", "publicProjection.js"), "utf8"),
    "versioning synchronizes browser-neutral source to the Function mirror"
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log("apply-client-build-version-direct-entry.test.mjs: ok");
