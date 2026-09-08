import { readFileSync, realpathSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const fail = reason => { throw new Error(`firebase-plan-blocked:${reason}`); };
const equal = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// Private Firebase interfaces are version AND content pinned. A CLI upgrade requires review.
export function inspectFirebaseCli(candidate) {
  const executable = candidate || (process.env.PATH || "").split(path.delimiter)
    .map(dir => path.join(dir, "firebase")).find(file => existsSync(file));
  if (!executable) fail("cli-missing");
  const cli = realpathSync(executable);
  const root = path.resolve(path.dirname(cli), "../..");
  const lock = JSON.parse(readFileSync(path.join(directory, "productionFunctionsFirebaseCliLock.json"), "utf8"));
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  if (cli !== path.join(root, "lib/bin/firebase.js") || pkg.name !== "firebase-tools" || pkg.version !== lock.firebaseToolsVersion) fail("cli-version-drift");
  for (const [file, digest] of Object.entries(lock.files)) {
    if (createHash("sha256").update(readFileSync(path.join(root, file))).digest("hex") !== digest) fail("cli-source-drift");
  }
  return cli;
}

export function validateFirebasePlan(plan, contract, manifest) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) fail("malformed-plan");
  const created = [], updated = [], skipped = [], seen = new Set();
  const endpoint = (e, kind) => {
    if (!e || !contract.requested.includes(e.id) || seen.has(e.id) ||
        e.project !== manifest.projectId || e.region !== manifest.expectedProduction.region ||
        e.platform !== manifest.expectedProduction.generation || e.runtime !== manifest.expectedProduction.runtime ||
        (e.codebase && e.codebase !== manifest.codebase)) fail("endpoint-outside-contract");
    if (e.id === "reconcileCharroProHistoricalResults" &&
        (e.availableMemoryMb !== 1024 || e.timeoutSeconds !== 540 || !e.callableTrigger ||
         (e.secretEnvironmentVariables?.length || 0) !== 0)) fail("reconciliation-config-drift");
    seen.add(e.id);
    ({ create: created, update: updated, skip: skipped })[kind].push(e.id);
  };
  for (const changes of Object.values(plan)) {
    const keys = ["endpointsToCreate", "endpointsToUpdate", "endpointsToDelete", "endpointsToSkip"];
    if (!changes || !equal(Object.keys(changes), keys) || keys.some(key => !Array.isArray(changes[key]))) fail("unknown-plan-shape");
    if (changes.endpointsToDelete.length) fail("delete-proposed");
    for (const e of changes.endpointsToCreate) endpoint(e, "create");
    for (const update of changes.endpointsToUpdate) {
      if (!update || update.deleteAndRecreate || update.unsafe || Object.keys(update).some(key => !["endpoint", "unsafe"].includes(key))) fail("replacement-or-unsafe-update");
      endpoint(update.endpoint, "update");
    }
    for (const e of changes.endpointsToSkip) endpoint(e, "skip");
  }
  if (!equal(created, contract.expectedCreates) || !equal([...seen], contract.requested) ||
      [...updated, ...skipped].some(name => contract.expectedCreates.includes(name))) fail("operations-mismatch");
  return { created, updated, skipped, deleted: [] };
}

export function installPlanGuards({ planner, Fabricator, contract, manifest, validateInventory }) {
  if (typeof planner.createDeploymentPlan !== "function" || typeof Fabricator.prototype.applyPlan !== "function") fail("guard-interface-drift");
  const originalPlanner = planner.createDeploymentPlan;
  const originalApply = Fabricator.prototype.applyPlan;
  let planned = false;
  planner.createDeploymentPlan = function (args) {
    if (planned || args.codebase !== manifest.codebase || args.deleteAll) fail("unexpected-codebase-or-plan");
    // Recheck Firebase's fresh backend, before filtering it to requested targets.
    validateInventory(Object.values(args.haveBackend.endpoints).flatMap(region => Object.values(region)));
    const plan = originalPlanner.call(this, args);
    validateFirebasePlan(plan, contract, manifest);
    planned = true;
    return plan;
  };
  Fabricator.prototype.applyPlan = function (plan) {
    if (!planned) fail("planner-guard-not-run");
    validateFirebasePlan(plan, contract, manifest);
    console.log("FIREBASE_ACTUAL_PLAN=PASS; DELETE_PROPOSED=0");
    return originalApply.call(this, plan);
  };
  return () => { planner.createDeploymentPlan = originalPlanner; Fabricator.prototype.applyPlan = originalApply; };
}

async function main() {
  const spec = JSON.parse(process.argv[2]);
  const cli = inspectFirebaseCli(spec.cli);
  const api = await import("./productionFunctionsDeploy.mjs");
  const root = path.resolve(directory, "../..");
  api.validateFirebaseConfiguration(root);
  const manifest = api.loadProductionFunctionsAllowlist();
  const request = { ...spec.request, manifest, repositoryExports: api.discoverRepositoryFunctionExports(readFileSync(path.join(root, "functions/index.js"), "utf8")) };
  const contract = api.validateProductionFunctionsContract(request);
  const expectedArgs = api.firebaseDeployArguments({ projectId: manifest.projectId, targets: contract.requested, manifest });
  if (JSON.stringify(spec.args) !== JSON.stringify(expectedArgs)) fail("cli-arguments-drift");
  const require = createRequire(cli);
  const releaseDirectory = path.resolve(path.dirname(cli), "../deploy/functions/release");
  installPlanGuards({ planner: require(path.join(releaseDirectory, "planner.js")),
    Fabricator: require(path.join(releaseDirectory, "fabricator.js")).Fabricator, contract, manifest,
    validateInventory: inventory => api.validateProductionFunctionsContract({ ...request, productionFunctions: inventory }) });
  process.argv = [process.execPath, cli, ...expectedArgs];
  require(cli);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
