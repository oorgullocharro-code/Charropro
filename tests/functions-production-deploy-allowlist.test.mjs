import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  ProductionFunctionsDeployError, discoverRepositoryFunctionExports, firebaseDeployArguments,
  loadProductionFunctionsAllowlist, parseRequestedTargets, validateProductionFunctionsContract,
  validateAllowlist, parseCliArguments
} from "../tools/release/productionFunctionsDeploy.mjs";
const manifest = loadProductionFunctionsAllowlist();
const added = "reconcileCharroProHistoricalResults";
const repositoryExports = discoverRepositoryFunctionExports(readFileSync(new URL("../functions/index.js", import.meta.url), "utf8"));
const production = manifest.authorizedFunctions.map(id => ({ id, platform: "gcfv2", region: "us-central1", runtime: "nodejs22", state: "ACTIVE" }));
const before = production.filter(item => item.id !== added);
const options = { manifest, repositoryExports, requestedTargets: [added] };
const check = extra => validateProductionFunctionsContract({ ...options, ...extra });
const block = fn => assert.throws(fn, error => error instanceof ProductionFunctionsDeployError);

test("BASELINE 11 AUTHORIZED = PASS", () => {
  const result = check({ productionFunctions: production });
  assert.equal(result.authorized.length, 11); assert.equal(result.exported.length, 18); assert.equal(result.excluded.length, 7);
});
test("TARGET SINGLE AUTHORIZED = PASS", () => assert.deepEqual(parseRequestedTargets([`functions:${added}`], manifest.authorizedFunctions), [added]));
test("TARGET MULTIPLE AUTHORIZED = PASS", () => assert.equal(check({ requestedTargets: [added, manifest.authorizedFunctions[0]] }).targets.length, 2));
for (const [name, targets] of [["UNAUTHORIZED", [manifest.excludedRepositoryExports[0]]], ["UNKNOWN", ["notAnExport"]],
  ["DUPLICATE", [added, `functions:${added}`]], ["EMPTY", []], ["GENERAL FUNCTIONS", ["functions"]]]) {
  test(`TARGET ${name} = BLOCK`, () => block(() => check({ requestedTargets: targets })));
}
test("EMPTY TARGET for productive execute = BLOCK before network", () => block(() => parseCliArguments(["deploy", "--execute"])));
test("NEW UNAUTHORIZED EXPORT = BLOCK", () => block(() => check({ repositoryExports: [...repositoryExports, "newUnauthorizedExport"] })));
test("MISSING AUTHORIZED EXPORT = BLOCK", () => block(() => check({ repositoryExports: repositoryExports.filter(name => name !== added) })));
test("INVALID ALLOWLIST = BLOCK", () => {
  for (const bad of [null, { ...manifest, authorizedFunctions: [] },
    { ...manifest, authorizedFunctions: [...manifest.authorizedFunctions, added] },
    { ...manifest, excludedRepositoryExports: [...manifest.excludedRepositoryExports, added] },
    { ...manifest, expectedProduction: { ...manifest.expectedProduction, count: 10 } },
    { ...manifest, expectedProduction: { ...manifest.expectedProduction, runtime: "nodejs20" } },
    { ...manifest, allowedInitialCreates: ["unknown"] }, { ...manifest, projectId: "other" }]) block(() => validateAllowlist(bad));
});
test("TARGETED DEPLOY DOES NOT INCLUDE OTHER 10 OR 7 EXCLUDED = PASS", () => {
  const args = firebaseDeployArguments({ projectId: manifest.projectId, targets: [added], manifest });
  assert.deepEqual(args, ["deploy", "--only", `functions:${added}`, "--project", manifest.projectId, "--non-interactive"]);
  for (const name of [...manifest.authorizedFunctions.filter(name => name !== added), ...manifest.excludedRepositoryExports]) assert.equal(args.includes(`functions:${name}`), false);
  block(() => firebaseDeployArguments({ projectId: manifest.projectId, targets: [], manifest }));
  block(() => firebaseDeployArguments({ projectId: manifest.projectId, targets: manifest.excludedRepositoryExports, manifest }));
});
test("INITIAL CREATE: exact 10 before / exact 11 after = PASS; new already exists = BLOCK", () => {
  const result = check({ productionFunctions: before, expectedCreates: [added] });
  assert.deepEqual(result.expectedCreates, [added]); assert.deepEqual(result.expectedDeletes, []);
  assert.equal(check({ productionFunctions: production, expectedCreates: [added], phase: "after" }).production.length, 11);
  block(() => check({ productionFunctions: production, expectedCreates: [added] }));
  block(() => check({ productionFunctions: before }));
  block(() => check({ productionFunctions: before, expectedCreates: [manifest.authorizedFunctions[0]] }));
  block(() => check({ expectedCreates: [added], requestedTargets: [manifest.authorizedFunctions[0]] }));
});
test("NO DELETE OF EXISTING AUTHORIZED FUNCTIONS / INVENTORY DRIFT = BLOCK", () => {
  for (const inventory of [before.slice(1), [...before, { ...production[0], id: "unexpected" }],
    [...before, before[0]], before.map((item, i) => i ? item : { ...item, runtime: "nodejs20" }),
    before.map((item, i) => i ? item : { ...item, state: "FAILED" }),
    before.map((item, i) => i ? item : { ...item, region: "europe-west1" }),
    before.map((item, i) => i ? item : { ...item, platform: "gcfv1" })]) {
    block(() => check({ productionFunctions: inventory, expectedCreates: [added] }));
  }
});
test("CLI requires explicit targets, explicit execute, rejects repeated flags and force", () => {
  const args = ["deploy", "--targets", added, "--expect-create", added, "--execute"];
  assert.deepEqual(parseCliArguments(args).requestedTargets, [added]);
  for (const bad of [["deploy", "--targets", added], [...args, "--targets", added], [...args, "--force"], ["preflight", "--targets", added, "--execute"]]) block(() => parseCliArguments(bad));
});
