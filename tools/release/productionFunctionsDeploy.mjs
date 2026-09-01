import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  if (!isPlainObject(value) || value.schemaVersion !== "charropro-production-functions-allowlist/1") {
    throw new ProductionFunctionsDeployError("allowlist-schema-invalid");
  }
  const authorizedFunctions = normalizedUniqueNames(value.authorizedFunctions, "allowlist-authorized-functions-invalid");
  const excludedRepositoryExports = normalizedUniqueNames(value.excludedRepositoryExports, "allowlist-excluded-exports-invalid");
  if (!authorizedFunctions.length) throw new ProductionFunctionsDeployError("allowlist-empty");
  const overlap = authorizedFunctions.filter((name) => excludedRepositoryExports.includes(name));
  if (overlap.length) throw new ProductionFunctionsDeployError("allowlist-overlap", { overlap });
  const expectedProduction = value.expectedProduction;
  if (!isPlainObject(expectedProduction) || expectedProduction.count !== authorizedFunctions.length) {
    throw new ProductionFunctionsDeployError("allowlist-production-count-invalid");
  }
  for (const key of ["generation", "region", "runtime", "status"]) {
    normalizedString(expectedProduction[key], "allowlist-production-contract-invalid");
  }
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    projectId: normalizedProjectId(value.projectId),
    codebase: normalizedString(value.codebase, "allowlist-codebase-invalid"),
    authorizedFunctions: Object.freeze([...authorizedFunctions].sort()),
    excludedRepositoryExports: Object.freeze([...excludedRepositoryExports].sort()),
    expectedProduction: Object.freeze({ ...expectedProduction })
  });
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

export function validateProductionFunctionsContract({ repositoryExports, manifest, productionFunctions = null }) {
  const exported = normalizedUniqueNames(repositoryExports, "repository-exports-invalid").sort();
  const allowlist = manifest?.authorizedFunctions;
  const exclusions = manifest?.excludedRepositoryExports;
  const authorized = normalizedUniqueNames(allowlist, "allowlist-authorized-functions-invalid").sort();
  const excluded = normalizedUniqueNames(exclusions, "allowlist-excluded-exports-invalid").sort();
  if (!authorized.length) throw new ProductionFunctionsDeployError("allowlist-empty");
  if (authorized.length + excluded.length !== exported.length) {
    throw new ProductionFunctionsDeployError("repository-export-contract-drift", {
      exported,
      authorized,
      excluded
    });
  }
  const unknownExports = exported.filter((name) => !authorized.includes(name) && !excluded.includes(name));
  const missingAuthorizedExports = authorized.filter((name) => !exported.includes(name));
  const missingExcludedExports = excluded.filter((name) => !exported.includes(name));
  if (unknownExports.length || missingAuthorizedExports.length || missingExcludedExports.length) {
    throw new ProductionFunctionsDeployError("repository-export-contract-drift", {
      unknownExports,
      missingAuthorizedExports,
      missingExcludedExports
    });
  }
  const targets = buildProductionFunctionTargets(authorized);
  const result = {
    exported,
    authorized,
    excluded,
    targets,
    production: null
  };
  if (productionFunctions !== null) {
    const production = normalizeProductionInventory(productionFunctions);
    const expected = manifest.expectedProduction;
    const productionNames = production.map((item) => item.id).sort();
    const unexpectedDeployed = productionNames.filter((name) => !authorized.includes(name));
    const missingAuthorizedDeployed = authorized.filter((name) => !productionNames.includes(name));
    const contractViolations = production.filter((item) => (
      item.platform !== expected.generation ||
      item.region !== expected.region ||
      item.runtime !== expected.runtime ||
      item.state !== expected.status
    ));
    if (production.length !== expected.count || unexpectedDeployed.length || missingAuthorizedDeployed.length || contractViolations.length) {
      throw new ProductionFunctionsDeployError("production-function-inventory-drift", {
        expectedCount: expected.count,
        actualCount: production.length,
        unexpectedDeployed,
        missingAuthorizedDeployed,
        contractViolations: contractViolations.map((item) => ({
          id: item.id,
          platform: item.platform,
          region: item.region,
          runtime: item.runtime,
          state: item.state
        }))
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
  if (requested.length !== authorized.length || requested.some((target) => !authorized.includes(target))) {
    throw new ProductionFunctionsDeployError("authorized-target-set-incomplete", { requested, authorized });
  }
  return Object.freeze([...requested].sort());
}

export function firebaseDeployArguments({ projectId, targets }) {
  const project = normalizedProjectId(projectId);
  const normalizedTargets = buildProductionFunctionTargets(targets);
  return Object.freeze(["deploy", "--only", normalizedTargets.join(","), "--project", project]);
}

function readRepositoryExports(root) {
  return discoverRepositoryFunctionExports(readFileSync(path.join(root, "functions/index.js"), "utf8"));
}

function readProductionInventory(projectId) {
  let output = "";
  try {
    output = execFileSync("firebase", ["functions:list", "--project", projectId, "--json"], {
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
  console.log(`EXPORTED_COUNT=${result.exported.length}`);
  console.log(`AUTHORIZED_COUNT=${result.authorized.length}`);
  console.log(`UNAUTHORIZED_EXPORTED_COUNT=${result.excluded.length}`);
  console.log(`AUTHORIZED_TARGET_COUNT=${result.targets.length}`);
  console.log("UNAUTHORIZED_TARGET_COUNT=0");
  console.log("CREATE_UNAUTHORIZED=0");
  console.log("DELETE_UNAUTHORIZED=0");
  console.log(`AUTHORIZED_TARGETS=${result.targets.join(",")}`);
  console.log(`EXCLUDED_REPOSITORY_EXPORTS=${result.excluded.join(",")}`);
  if (result.production) console.log(`PRODUCTION_DEPLOYED_COUNT=${result.production.length}`);
  console.log("PREFLIGHT=PASS");
}

function parseCliArguments(argv) {
  const [command = "preflight", ...rest] = argv;
  const options = { command, projectId: "", execute: false };
  while (rest.length) {
    const value = rest.shift();
    if (value === "--project") options.projectId = rest.shift() || "";
    else if (value === "--execute") options.execute = true;
    else throw new ProductionFunctionsDeployError("unknown-cli-argument", { value });
  }
  if (!["preflight", "dry-run", "deploy"].includes(options.command)) {
    throw new ProductionFunctionsDeployError("unknown-command", { command: options.command });
  }
  if (options.command === "deploy" && !options.execute) {
    throw new ProductionFunctionsDeployError("deploy-requires-explicit-execute");
  }
  return options;
}

function main(argv) {
  const options = parseCliArguments(argv);
  const root = path.resolve(MODULE_DIRECTORY, "../..");
  const manifest = loadProductionFunctionsAllowlist();
  const projectId = options.projectId ? normalizedProjectId(options.projectId) : manifest.projectId;
  if (projectId !== manifest.projectId) throw new ProductionFunctionsDeployError("project-not-authorized", { projectId });
  const production = options.command === "dry-run" ? null : readProductionInventory(projectId);
  const result = validateProductionFunctionsContract({
    repositoryExports: readRepositoryExports(root),
    manifest,
    productionFunctions: production
  });
  printPreflight(result);
  if (options.command === "dry-run") {
    console.log("DRY_RUN=PASS");
    return;
  }
  if (options.command === "deploy") {
    const args = firebaseDeployArguments({ projectId, targets: result.authorized });
    console.log(`FIREBASE_COMMAND=firebase ${args.join(" ")}`);
    execFileSync("firebase", args, { stdio: "inherit" });
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
