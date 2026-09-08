import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { loadProductionFunctionsAllowlist, validateProductionFunctionsContract, discoverRepositoryFunctionExports } from "../tools/release/productionFunctionsDeploy.mjs";
import { inspectFirebaseCli, validateFirebasePlan, installPlanGuards } from "../tools/release/productionFunctionsFirebaseGuard.mjs";
const manifest = loadProductionFunctionsAllowlist();
const added = "reconcileCharroProHistoricalResults";
const repositoryExports = discoverRepositoryFunctionExports(readFileSync(new URL("../functions/index.js", import.meta.url), "utf8"));
const contract = validateProductionFunctionsContract({ manifest, repositoryExports, requestedTargets: [added], expectedCreates: [added] });
const endpoint = id => ({ id, project: manifest.projectId, codebase: "default", region: "us-central1", platform: "gcfv2", runtime: "nodejs22", state: "ACTIVE", availableMemoryMb: 1024, timeoutSeconds: 540, callableTrigger: {}, targetedByOnly: true, labels: { "deployment-tool": "cli-firebase" } });
const blank = () => ({ endpointsToCreate: [], endpointsToUpdate: [], endpointsToDelete: [], endpointsToSkip: [] });
const validPlan = () => ({ "default-us-central1-1024": { ...blank(), endpointsToCreate: [endpoint(added)] } });
const block = fn => assert.throws(fn, /firebase-plan-blocked:/);

test("Actual-plan CREATE EXPECTED=single new Function, DELETE EXPECTED=0", () => assert.deepEqual(validateFirebasePlan(validPlan(), contract, manifest).created, [added]));
test("Firebase proposes another create / deletion / update / implicit replacement: BLOCK", () => {
  const mutations = [
    p => p.endpointsToCreate.push(endpoint(manifest.authorizedFunctions[0])),
    p => p.endpointsToCreate.push(endpoint(manifest.excludedRepositoryExports[0])),
    p => p.endpointsToDelete.push(endpoint(manifest.authorizedFunctions[0])),
    p => p.endpointsToUpdate.push({ endpoint: endpoint(manifest.authorizedFunctions[0]), unsafe: false }),
    p => { p.endpointsToCreate = []; p.endpointsToUpdate = [{ endpoint: endpoint(added), deleteAndRecreate: endpoint(added) }]; },
    p => p.endpointsToCreate.push(endpoint(added)),
    p => { p.extraOperations = []; },
    p => { p.endpointsToCreate = []; },
    p => { p.endpointsToCreate[0].region = "europe-west1"; },
    p => { p.endpointsToCreate[0].project = "other-project"; },
    p => { p.endpointsToCreate[0].secretEnvironmentVariables = [{ secret: "newSecret" }]; },
    p => { p.endpointsToCreate[0].availableMemoryMb = 512; },
    p => { p.endpointsToCreate[0].timeoutSeconds = 60; }
  ];
  for (const mutate of mutations) { const p = validPlan(); mutate(Object.values(p)[0]); block(() => validateFirebasePlan(p, contract, manifest)); }
});
test("Guard refuses mutation without planner / revalidates aggregate immediately before Fabricator", async () => {
  let writes = 0, inventoryChecks = 0;
  class FakeFabricator { applyPlan() { writes++; return 'applied'; } }
  const planner = { createDeploymentPlan: () => validPlan() };
  const restore = installPlanGuards({ planner, Fabricator: FakeFabricator, contract, manifest, validateInventory() { inventoryChecks++; } });
  try {
    const fab = new FakeFabricator(); block(() => fab.applyPlan(validPlan()));
    const p = planner.createDeploymentPlan({ codebase: "default", haveBackend: { endpoints: {} } });
    const altered = structuredClone(p); Object.values(altered)[0].endpointsToDelete.push(endpoint(manifest.authorizedFunctions[0]));
    block(() => fab.applyPlan(altered)); assert.equal(writes, 0);
    assert.equal(fab.applyPlan(p), 'applied'); assert.equal(writes, 1); assert.equal(inventoryChecks, 1);
  } finally { restore(); }
});
test("Planner inventory drift and foreign codebase abort before apply", () => {
  let planned = 0;
  class FakeFabricator { applyPlan() { assert.fail('must not apply'); } }
  const planner = { createDeploymentPlan() { planned++; return validPlan(); } };
  const restore = installPlanGuards({ planner, Fabricator: FakeFabricator, contract, manifest, validateInventory() { throw new Error('inventory-drift'); } });
  try {
    block(() => planner.createDeploymentPlan({ codebase: "other" }));
    assert.throws(() => planner.createDeploymentPlan({ codebase: "default", haveBackend: { endpoints: {} } }), /inventory-drift/);
    assert.equal(planned, 0);
  } finally { restore(); }
});
test("Pinned installed Firebase planner: all 18 exports, targets only one, creates one, deletes zero (offline)", () => {
  const cli = inspectFirebaseCli(); const require = createRequire(cli);
  const planner = require('../deploy/functions/release/planner.js');
  const backend = require('../deploy/functions/backend.js');
  const existing = manifest.authorizedFunctions.filter(name => name !== added).map(endpoint);
  const args = { codebase: "default", wantBackend: backend.of(...repositoryExports.map(endpoint)), haveBackend: backend.of(...existing), filters: [{ codebase: 'default', idChunks: [added] }] };
  let applied = 0;
  class FakeFabricator { applyPlan() { applied++; } }
  const restore = installPlanGuards({ planner, Fabricator: FakeFabricator, contract, manifest, validateInventory: productionFunctions => validateProductionFunctionsContract({ manifest, repositoryExports, requestedTargets: [added], expectedCreates: [added], productionFunctions }) });
  try {
    const plan = planner.createDeploymentPlan(args);
    const summary = validateFirebasePlan(plan, contract, manifest);
    assert.deepEqual(summary, { created: [added], updated: [], skipped: [], deleted: [] });
    new FakeFabricator().applyPlan(plan); assert.equal(applied, 1);
  } finally { restore(); }
});
test("Actual Firebase planner supports multiple explicit authorized targets", () => {
  const require = createRequire(inspectFirebaseCli());
  const planner = require('../deploy/functions/release/planner.js'), backend = require('../deploy/functions/backend.js');
  const requestedTargets = [added, manifest.authorizedFunctions[0]];
  const multi = validateProductionFunctionsContract({ manifest, repositoryExports, requestedTargets, expectedCreates: [added] });
  const plan = planner.createDeploymentPlan({ codebase: 'default', wantBackend: backend.of(...repositoryExports.map(endpoint)),
    haveBackend: backend.of(...manifest.authorizedFunctions.filter(n => n !== added).map(endpoint)),
    filters: requestedTargets.map(id => ({ codebase: 'default', idChunks: [id] })) });
  const result = validateFirebasePlan(plan, multi, manifest);
  assert.deepEqual(result.created, [added]); assert.deepEqual(result.updated, [manifest.authorizedFunctions[0]]); assert.deepEqual(result.deleted, []);
});
test("Unknown Firebase CLI version or source hash = BLOCK", () => {
  const temp = mkdtempSync(path.join(tmpdir(), 'charropro-cli-test-'));
  try {
    mkdirSync(path.join(temp, 'lib/bin'), { recursive: true });
    const cli = path.join(temp, 'lib/bin/firebase.js'); writeFileSync(cli, '');
    writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ name: 'firebase-tools', version: '0.0.0' }));
    block(() => inspectFirebaseCli(cli));
    const lock = JSON.parse(readFileSync(new URL('../tools/release/productionFunctionsFirebaseCliLock.json', import.meta.url)));
    writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ name: 'firebase-tools', version: lock.firebaseToolsVersion }));
    for (const file of Object.keys(lock.files)) { mkdirSync(path.dirname(path.join(temp, file)), { recursive: true }); writeFileSync(path.join(temp, file), 'changed'); }
    block(() => inspectFirebaseCli(cli));
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
test("Productive wrapper with no targets exits before any Firebase process; local dry-run builds single target", () => {
  const wrapper = new URL('../tools/release/productionFunctionsDeploy.mjs', import.meta.url);
  const missing = spawnSync(process.execPath, [wrapper.pathname, 'deploy', '--execute'], { encoding: 'utf8', env: { ...process.env, PATH: '/nonexistent' } });
  assert.equal(missing.status, 1); assert.match(missing.stderr, /empty-target-set/);
  const local = spawnSync(process.execPath, [wrapper.pathname, 'dry-run', '--targets', added, '--expect-create', added], { encoding: 'utf8', env: { ...process.env, PATH: '/nonexistent' } });
  assert.equal(local.status, 0, local.stderr); assert.match(local.stdout, new RegExp(`REQUESTED_TARGETS=functions:${added}\\n`)); assert.match(local.stdout, /PRODUCTION_INVENTORY=NOT_CHECKED/);
});
test("Callable config: Gen2 us-central1 node22 1GiB 540s no secrets (metadata only; never invoked)", () => {
  const require = createRequire(new URL('../functions/package.json', import.meta.url));
  const source = readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
  const registration = source.slice(source.indexOf(`exports.${added} =`), source.indexOf('const baselineValidation'));
  const scope = { exports: {}, onCall: require('firebase-functions/v2/https').onCall };
  runInNewContext(registration, scope); // Register metadata only; callback and Admin SDK are never invoked.
  const fn = scope.exports[added];
  assert.equal(fn.__endpoint.platform, 'gcfv2');
  assert.deepEqual(Array.from(fn.__endpoint.region), ['us-central1']);
  assert.equal(fn.__endpoint.availableMemoryMb, 1024); assert.equal(fn.__endpoint.timeoutSeconds, 540);
  assert.ok(fn.__endpoint.callableTrigger); assert.equal(fn.__endpoint.secretEnvironmentVariables?.length || 0, 0);
  const pkg = JSON.parse(readFileSync(new URL('../functions/package.json', import.meta.url)));
  assert.equal(pkg.engines.node, '22');
});
