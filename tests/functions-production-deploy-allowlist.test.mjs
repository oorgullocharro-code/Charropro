import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ProductionFunctionsDeployError,
  buildProductionFunctionTargets,
  discoverRepositoryFunctionExports,
  firebaseDeployArguments,
  loadProductionFunctionsAllowlist,
  parseRequestedTargets,
  validateProductionFunctionsContract
} from "../tools/release/productionFunctionsDeploy.mjs";

const manifest = loadProductionFunctionsAllowlist();
const exports = discoverRepositoryFunctionExports(readFileSync(new URL("../functions/index.js", import.meta.url), "utf8"));
const production = manifest.authorizedFunctions.map((id) => ({
  id,
  platform: "gcfv2",
  region: "us-central1",
  runtime: "nodejs22",
  state: "ACTIVE"
}));

const baseline = validateProductionFunctionsContract({
  repositoryExports: exports,
  manifest,
  productionFunctions: production
});
assert.equal(baseline.exported.length, 17);
assert.equal(baseline.authorized.length, 10);
assert.equal(baseline.excluded.length, 7);
assert.equal(baseline.production.length, 10);
assert.deepEqual(baseline.targets, buildProductionFunctionTargets(manifest.authorizedFunctions));
assert.equal(baseline.targets.some((target) => target.includes("requestCharroProBackup")), false);
assert.equal(baseline.targets.some((target) => target.includes("scheduleCharroProBackups")), false);

assertBlocked("new-export-added", () => validateProductionFunctionsContract({
  repositoryExports: [...exports, "newUnapprovedFunction"],
  manifest
}));
assertBlocked("authorized-function-removed", () => validateProductionFunctionsContract({
  repositoryExports: exports.filter((name) => name !== "publishCharroProOfficialScore"),
  manifest
}));
assertBlocked("unknown-target-requested", () => parseRequestedTargets([
  ...manifest.authorizedFunctions,
  "functions:requestCharroProBackup"
], manifest.authorizedFunctions));
assertBlocked("incomplete-authorized-target-requested", () => parseRequestedTargets(
  manifest.authorizedFunctions.slice(0, -1),
  manifest.authorizedFunctions
));
assertBlocked("duplicate-allowlist-entry", () => validateProductionFunctionsContract({
  repositoryExports: exports,
  manifest: { ...manifest, authorizedFunctions: [...manifest.authorizedFunctions, manifest.authorizedFunctions[0]] }
}));
assertBlocked("empty-allowlist", () => validateProductionFunctionsContract({
  repositoryExports: exports,
  manifest: { ...manifest, authorizedFunctions: [] }
}));
assertBlocked("unauthorized-production-function", () => validateProductionFunctionsContract({
  repositoryExports: exports,
  manifest,
  productionFunctions: [...production, {
    id: "requestCharroProBackup",
    platform: "gcfv2",
    region: "us-central1",
    runtime: "nodejs22",
    state: "ACTIVE"
  }]
}));

const targets = parseRequestedTargets(baseline.targets, manifest.authorizedFunctions);
assert.deepEqual(targets, manifest.authorizedFunctions);
assert.deepEqual(firebaseDeployArguments({ projectId: manifest.projectId, targets }), [
  "deploy",
  "--only",
  baseline.targets.join(","),
  "--project",
  "charropro-e8a68"
]);

console.log("functions production deploy allowlist: 10 authorized / 7 excluded / fail-closed passed");

function assertBlocked(label, callback) {
  assert.throws(callback, (error) => error instanceof ProductionFunctionsDeployError, label);
}
