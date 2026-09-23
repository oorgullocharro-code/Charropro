import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectFirebaseCli } from "./productionFunctionsFirebaseGuard.mjs";

const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MANIFEST_PATH = path.join(MODULE_DIRECTORY, "productionFunctionsAllowlist.json");
export const DEFAULT_PROJECT_ID = "charropro-e8a68";

export class ProductionFunctionsDeployError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "ProductionFunctionsDeployError";
    this.code = code;
    this.details = details;
  }
}

export function loadProductionFunctionsAllowlist(manifestPath = DEFAULT_MANIFEST_PATH) {
  let value;
  try {
    value = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new ProductionFunctionsDeployError("allowlist-read-failed", { manifestPath, cause: error.message });
  }
  return validateAllowlist(value);
}

export function validateAllowlist(value) {
  if (!isPlainObject(value) || value.schemaVersion !== "charropro-production-functions-allowlist/1") {
    throw new ProductionFunctionsDeployError("allowlist-schema-invalid");
  }
  const authorized = normalizedUniqueNames(value.authorizedFunctions, "allowlist-authorized-functions-invalid");
  const excluded = normalizedUniqueNames(value.excludedRepositoryExports, "allowlist-excluded-exports-invalid");
  const creates = normalizedUniqueNames(value.allowedInitialCreates, "allowlist-initial-creates-invalid");
  if (!authorized.length || authorized.some(name => excluded.includes(name)) || creates.some(name => !authorized.includes(name))) {
    throw new ProductionFunctionsDeployError("allowlist-membership-invalid");
  }
  const expected = value.expectedProduction;
  if (!isPlainObject(expected) || expected.count !== authorized.length ||
      expected.generation !== "gcfv2" || expected.region !== "us-central1" ||
      expected.runtime !== "nodejs22" || expected.status !== "ACTIVE" ||
      value.projectId !== DEFAULT_PROJECT_ID || value.codebase !== "default") {
    throw new ProductionFunctionsDeployError("allowlist-production-contract-invalid");
  }
  const lifecycle = validateExplicitFunctionLifecycle(value.explicitFunctionLifecycle, authorized);
  return Object.freeze({ ...value,
    authorizedFunctions: Object.freeze([...authorized].sort()),
    excludedRepositoryExports: Object.freeze([...excluded].sort()),
    allowedInitialCreates: Object.freeze([...creates].sort()),
    expectedProduction: Object.freeze({ ...expected }),
    explicitFunctionLifecycle: lifecycle
  });
}

function validateExplicitFunctionLifecycle(value, authorized) {
  if (!isPlainObject(value) || value.schemaVersion !== "charropro-production-function-lifecycle/1") {
    throw new ProductionFunctionsDeployError("function-lifecycle-schema-invalid");
  }
  const functionId = normalizedString(value.functionId, "function-lifecycle-function-invalid");
  if (!authorized.includes(functionId)) throw new ProductionFunctionsDeployError("function-lifecycle-function-not-authorized");
  const forward = normalizeLifecycleTransition(value.forward, "forward", functionId);
  const rollback = normalizeLifecycleTransition(value.rollback, "rollback", functionId);
  if (forward.preCount !== 12 || forward.postCount !== 13 || rollback.preCount !== 13 || rollback.postCount !== 12 ||
      !sameNames(forward.creates, [functionId]) || forward.deletes.length || rollback.creates.length ||
      !sameNames(rollback.deletes, [functionId]) || forward.fromCommit !== rollback.toCommit ||
      forward.toCommit !== rollback.fromCommit) {
    throw new ProductionFunctionsDeployError("function-lifecycle-transition-invalid");
  }
  return Object.freeze({ schemaVersion: value.schemaVersion, functionId,
    forward: Object.freeze(forward), rollback: Object.freeze(rollback) });
}

function normalizeLifecycleTransition(value, mode, functionId) {
  if (!isPlainObject(value) || !isCommitId(value.fromCommit) || !isCommitId(value.toCommit) ||
      !Number.isInteger(value.preCount) || !Number.isInteger(value.postCount)) {
    throw new ProductionFunctionsDeployError("function-lifecycle-transition-invalid", { mode });
  }
  const creates = normalizedUniqueNames(value.creates, "function-lifecycle-transition-invalid").sort();
  const deletes = normalizedUniqueNames(value.deletes, "function-lifecycle-transition-invalid").sort();
  if ([...creates, ...deletes].some(name => name !== functionId)) {
    throw new ProductionFunctionsDeployError("function-lifecycle-transition-invalid", { mode });
  }
  return { fromCommit: value.fromCommit, toCommit: value.toCommit, preCount: value.preCount, postCount: value.postCount, creates, deletes };
}

export function discoverRepositoryFunctionExports(source) {
  if (typeof source !== "string") throw new ProductionFunctionsDeployError("repository-source-invalid");
  const names = [...source.matchAll(/^exports\.([A-Za-z0-9_]+)\s*=/gm)].map((match) => match[1]);
  return Object.freeze(normalizedUniqueNames(names, "repository-exports-invalid").sort());
}

export function buildProductionFunctionTargets(authorizedFunctions) {
  const names = normalizedUniqueNames(authorizedFunctions, "authorized-targets-invalid");
  if (!names.length) throw new ProductionFunctionsDeployError("allowlist-empty");
  return Object.freeze([...names].sort().map((name) => `functions:${name}`));
}

export function validateProductionFunctionsContract({ repositoryExports, manifest, productionFunctions = null,
  requestedTargets, expectedCreates = [], expectedDeletes = [], phase = "before", mode = "normal",
  rollbackFrom = "", rollbackTo = "" }) {
  manifest = validateAllowlist(manifest);
  const exported = normalizedUniqueNames(repositoryExports, "repository-exports-invalid").sort();
  const authorized = manifest.authorizedFunctions;
  const excluded = manifest.excludedRepositoryExports;
  if (exported.length !== authorized.length + excluded.length ||
      exported.some(name => !authorized.includes(name) && !excluded.includes(name)) ||
      [...authorized, ...excluded].some(name => !exported.includes(name))) {
    throw new ProductionFunctionsDeployError("repository-export-contract-drift");
  }
  const requested = parseRequestedTargets(requestedTargets, authorized);
  const creates = normalizedUniqueNames(expectedCreates, "expected-creates-invalid").sort();
  const deletes = normalizedUniqueNames(expectedDeletes, "expected-deletes-invalid").sort();
  if (!["normal", "rollback"].includes(mode)) throw new ProductionFunctionsDeployError("invalid-function-lifecycle-mode");
  if (creates.some(name => !manifest.allowedInitialCreates.includes(name) || !requested.includes(name))) {
    throw new ProductionFunctionsDeployError("unexpected-create-requested");
  }
  if (mode === "normal" && deletes.length) throw new ProductionFunctionsDeployError("delete-without-rollback-mode");
  if (mode === "rollback") {
    const transition = manifest.explicitFunctionLifecycle.rollback;
    if (creates.length || !sameNames(requested, transition.deletes) || !sameNames(deletes, transition.deletes) ||
        rollbackFrom !== transition.fromCommit || rollbackTo !== transition.toCommit) {
      throw new ProductionFunctionsDeployError("rollback-lifecycle-not-authorized");
    }
  }
  if (!["before", "after"].includes(phase)) throw new ProductionFunctionsDeployError("invalid-inventory-phase");
  const result = { exported, authorized, excluded, requested, targets: buildProductionFunctionTargets(requested),
    expectedCreates: creates, expectedDeletes: deletes, production: null, phase, mode,
    rollbackFrom, rollbackTo };
  if (productionFunctions !== null) {
    const production = normalizeProductionInventory(productionFunctions);
    const expected = manifest.expectedProduction;
    const expectedNames = authorized.filter(name => {
      if (phase === "before") return !creates.includes(name);
      return !deletes.includes(name);
    });
    const names = production.map(item => item.id).sort();
    const violations = production.filter(item => item.platform !== expected.generation || item.region !== expected.region ||
      item.runtime !== expected.runtime || item.state !== expected.status);
    if (JSON.stringify(names) !== JSON.stringify(expectedNames) || violations.length) {
      throw new ProductionFunctionsDeployError("production-function-inventory-drift", {
        expectedNames, actualNames: names, contractViolations: violations
      });
    }
    result.production = Object.freeze(production);
  }
  return Object.freeze(result);
}

export function parseRequestedTargets(targets, authorizedFunctions) {
  const requested = normalizedUniqueNames(targets, "requested-targets-invalid", { allowTargetPrefix: true });
  const authorized = normalizedUniqueNames(authorizedFunctions, "allowlist-authorized-functions-invalid");
  const invalid = requested.filter((target) => !authorized.includes(target));
  if (invalid.length) throw new ProductionFunctionsDeployError("unauthorized-target-requested", { invalid });
  if (!requested.length) throw new ProductionFunctionsDeployError("empty-target-set");
  return Object.freeze([...requested].sort());
}

export function firebaseDeployArguments({ projectId, targets, manifest }) {
  manifest = validateAllowlist(manifest);
  targets = parseRequestedTargets(targets, manifest.authorizedFunctions);
  if (projectId !== manifest.projectId) throw new ProductionFunctionsDeployError("project-not-authorized");
  const project = normalizedProjectId(projectId);
  const normalizedTargets = buildProductionFunctionTargets(targets);
  return Object.freeze(["deploy", "--only", normalizedTargets.join(","), "--project", project, "--non-interactive"]);
}

export function firebaseRollbackArguments({ projectId, targets, manifest }) {
  manifest = validateAllowlist(manifest);
  targets = parseRequestedTargets(targets, manifest.authorizedFunctions);
  const transition = manifest.explicitFunctionLifecycle.rollback;
  if (projectId !== manifest.projectId || !sameNames(targets, transition.deletes)) {
    throw new ProductionFunctionsDeployError("rollback-lifecycle-not-authorized");
  }
  return Object.freeze(["functions:delete", manifest.explicitFunctionLifecycle.functionId, "--region", manifest.expectedProduction.region,
    "--project", projectId, "--force", "--non-interactive"]);
}

function readRepositoryExports(root) {
  return discoverRepositoryFunctionExports(readFileSync(path.join(root, "functions/index.js"), "utf8"));
}

export function readProductionInventory(projectId, cli) {
  let output = "";
  try {
    output = execFileSync(process.execPath, [cli, "functions:list", "--project", projectId, "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    // firebase-tools can return a non-zero status for its local update-check write
    // after a successful, complete read-only JSON inventory response.
    output = String(error?.stdout || "");
    if (!output) throw new ProductionFunctionsDeployError("production-inventory-read-failed", { cause: error.message });
  }
  let parsed;
  try {
    parsed = parseFirebaseInventoryOutput(output);
  } catch (error) {
    throw new ProductionFunctionsDeployError("production-inventory-read-failed", { cause: error.message });
  }
  if (parsed?.status !== "success" || !Array.isArray(parsed.result)) {
    throw new ProductionFunctionsDeployError("production-inventory-read-failed");
  }
  return parsed.result;
}

function parseFirebaseInventoryOutput(output) {
  const first = extractJsonObject(output, 0);
  const trailing = output.slice(first.end).trim();
  if (!trailing) return first.value;
  const localUpdateCheck = extractJsonObject(trailing, 0);
  if (
    trailing.slice(localUpdateCheck.end).trim() ||
    localUpdateCheck.value?.status !== "error" ||
    !/^EPERM: operation not permitted, open '.+\/firebase-tools\.json\.\d+'$/.test(String(localUpdateCheck.value?.error || ""))
  ) {
    throw new Error("firebase-inventory-output-invalid");
  }
  return first.value;
}

function extractJsonObject(value, start) {
  const source = String(value);
  let index = start;
  while (/\s/.test(source[index] || "")) index += 1;
  if (source[index] !== "{") throw new Error("firebase-inventory-json-missing");
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let cursor = index; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return { value: JSON.parse(source.slice(index, cursor + 1)), end: cursor + 1 };
    }
  }
  throw new Error("firebase-inventory-json-incomplete");
}

function printPreflight(result) {
  console.log(`AUTHORIZED_FUNCTIONS_COUNT=${result.authorized.length}`);
  console.log(`AUTHORIZED_FUNCTIONS=${result.authorized.join(",")}`);
  console.log(`REQUESTED_TARGETS=${result.targets.join(",")}`);
  console.log("UNAUTHORIZED_TARGETS=0");
  console.log(`OTHER_AUTHORIZED_FUNCTIONS_TARGETED=${result.authorized.filter(name => !result.requested.includes(name)).filter(name => result.targets.includes(`functions:${name}`)).length}`);
  console.log("EXCLUDED_EXPORTS_TARGETED=0");
  console.log(`CREATE_EXPECTED=${result.expectedCreates.join(",") || "NONE"}`);
  console.log(`DELETE_EXPECTED=${result.expectedDeletes.join(",") || "NONE"}`);
  console.log(`LIFECYCLE_MODE=${result.mode}`);
  if (result.production) console.log(`PRODUCTION_DEPLOYED_COUNT=${result.production.length}`);
  console.log(result.production ? "PREFLIGHT=PASS" : "LOCAL_CONTRACT=PASS; PRODUCTION_INVENTORY=NOT_CHECKED");
}

export function parseCliArguments(argv) {
  const [command = "preflight", ...rest] = argv;
  const options = { command, projectId: "", execute: false, requestedTargets: [], expectedCreates: [], expectedDeletes: [], rollbackFrom: "", rollbackTo: "" };
  const seen = new Set();
  while (rest.length) {
    const value = rest.shift();
    if (seen.has(value)) throw new ProductionFunctionsDeployError("duplicate-cli-argument", { value });
    seen.add(value);
    if (value === "--project") options.projectId = rest.shift() || "";
    else if (value === "--targets") options.requestedTargets = (rest.shift() || "").split(",");
    else if (value === "--expect-create") options.expectedCreates = (rest.shift() || "").split(",");
    else if (value === "--expect-delete") options.expectedDeletes = (rest.shift() || "").split(",");
    else if (value === "--rollback-from") options.rollbackFrom = rest.shift() || "";
    else if (value === "--rollback-to") options.rollbackTo = rest.shift() || "";
    else if (value === "--execute") options.execute = true;
    else throw new ProductionFunctionsDeployError("unknown-cli-argument", { value });
  }
  if (!["preflight", "postflight", "dry-run", "deploy", "rollback-dry-run", "rollback"].includes(command)) throw new ProductionFunctionsDeployError("unknown-command");
  if (["deploy", "rollback"].includes(command) && !options.execute) throw new ProductionFunctionsDeployError("deploy-requires-explicit-execute");
  if (!["deploy", "rollback"].includes(command) && options.execute) throw new ProductionFunctionsDeployError("unexpected-execute");
  const rollback = ["rollback-dry-run", "rollback"].includes(command);
  if (rollback && (!isCommitId(options.rollbackFrom) || !isCommitId(options.rollbackTo) || !options.expectedDeletes.length || options.expectedCreates.length)) {
    throw new ProductionFunctionsDeployError("rollback-lifecycle-arguments-invalid");
  }
  if (!rollback && (options.expectedDeletes.length || options.rollbackFrom || options.rollbackTo)) {
    throw new ProductionFunctionsDeployError("delete-without-rollback-mode");
  }
  if (!options.requestedTargets.length) throw new ProductionFunctionsDeployError("empty-target-set");
  return options;
}

export function validateFirebaseConfiguration(root) {
  const config = JSON.parse(readFileSync(path.join(root, "firebase.json"), "utf8"));
  if (!Array.isArray(config.functions) || config.functions.length !== 1 ||
      config.functions[0].codebase !== "default" || config.functions[0].source !== "functions" ||
      config.functions[0].predeploy || config.functions[0].postdeploy || config.functions[0].runtime || config.extensions) {
    throw new ProductionFunctionsDeployError("firebase-deployment-config-drift");
  }
  const pkg = JSON.parse(readFileSync(path.join(root, "functions/package.json"), "utf8"));
  if (pkg.engines?.node !== "22") throw new ProductionFunctionsDeployError("firebase-runtime-drift");
}

function main(argv) {
  const options = parseCliArguments(argv);
  const root = path.resolve(MODULE_DIRECTORY, "../..");
  const manifest = loadProductionFunctionsAllowlist();
  const projectId = options.projectId || manifest.projectId;
  if (projectId !== manifest.projectId) throw new ProductionFunctionsDeployError("project-not-authorized");
  validateFirebaseConfiguration(root);
  const request = { repositoryExports: readRepositoryExports(root), manifest,
    requestedTargets: options.requestedTargets, expectedCreates: options.expectedCreates,
    expectedDeletes: options.expectedDeletes,
    mode: ["rollback-dry-run", "rollback"].includes(options.command) ? "rollback" : "normal",
    rollbackFrom: options.rollbackFrom, rollbackTo: options.rollbackTo,
    phase: options.command === "postflight" ? "after" : "before" };
  // Reject invalid local input before any network request.
  let result = validateProductionFunctionsContract(request);
  if (["dry-run", "rollback-dry-run"].includes(options.command)) { printPreflight(result); return; }
  const cli = inspectFirebaseCli();
  result = validateProductionFunctionsContract({ ...request, productionFunctions: readProductionInventory(projectId, cli) });
  printPreflight(result);
  if (options.command === "deploy") {
    const args = firebaseDeployArguments({ projectId, targets: result.requested, manifest });
    console.log(`FIREBASE_COMMAND=firebase ${args.join(" ")}`);
    // The child checks the actual Firebase planner AND Fabricator plan before function mutations.
    execFileSync(process.execPath, [path.join(MODULE_DIRECTORY, "productionFunctionsFirebaseGuard.mjs"),
      JSON.stringify({ cli, request: { requestedTargets: result.requested, expectedCreates: result.expectedCreates, expectedDeletes: result.expectedDeletes,
        mode: result.mode, rollbackFrom: result.rollbackFrom, rollbackTo: result.rollbackTo }, args })],
      { cwd: root, stdio: "inherit" });
    validateProductionFunctionsContract({ ...request, phase: "after", productionFunctions: readProductionInventory(projectId, cli) });
    console.log("POSTFLIGHT=PASS");
  }
  if (options.command === "rollback") {
    const args = firebaseRollbackArguments({ projectId, targets: result.requested, manifest });
    console.log(`FIREBASE_COMMAND=firebase ${args.join(" ")}`);
    validateProductionFunctionsContract({ ...request, productionFunctions: readProductionInventory(projectId, cli) });
    execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
    validateProductionFunctionsContract({ ...request, phase: "after", productionFunctions: readProductionInventory(projectId, cli) });
    console.log("POSTFLIGHT=PASS");
  }
}

function normalizeProductionInventory(value) {
  if (!Array.isArray(value)) throw new ProductionFunctionsDeployError("production-inventory-invalid");
  const ids = value.map((item) => item?.id);
  normalizedUniqueNames(ids, "production-inventory-invalid");
  return value.map((item) => Object.freeze({
    id: item.id,
    platform: item.platform,
    region: item.region,
    runtime: item.runtime,
    state: item.state
  }));
}

function normalizedUniqueNames(value, code, options = {}) {
  if (!Array.isArray(value)) throw new ProductionFunctionsDeployError(code);
  const normalized = value.map((item) => {
    if (options.allowTargetPrefix && typeof item === "string" && item.trim().startsWith("functions:")) {
      return normalizedString(item.trim().slice("functions:".length), code);
    }
    return normalizedString(item, code);
  });
  if (new Set(normalized).size !== normalized.length) throw new ProductionFunctionsDeployError("allowlist-duplicate");
  return normalized;
}

function normalizedProjectId(value) {
  return normalizedString(value, "project-id-invalid");
}

function normalizedString(value, code) {
  if (!isFunctionName(value)) throw new ProductionFunctionsDeployError(code, { value });
  return value.trim();
}

function isFunctionName(value) {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value.trim());
}

function isCommitId(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
}

function sameNames(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const code = error instanceof ProductionFunctionsDeployError ? error.code : "production-functions-deploy-unexpected";
    console.error(`PREFLIGHT=BLOCKED\nREASON=${code}`);
    if (error?.details && Object.keys(error.details).length) console.error(JSON.stringify(error.details));
    process.exitCode = 1;
  }
}
