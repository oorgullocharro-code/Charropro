export const DEVELOPMENT_INFRASTRUCTURE_VERSION = "1.0.0";

export const DEVELOPMENT_ENVIRONMENTS = Object.freeze(["local", "staging", "production"]);
export const EMULATOR_SERVICES = Object.freeze(["auth", "database", "functions", "storage"]);
export const DEFAULT_LOCAL_PROJECT_ID = "demo-charropro-local";
export const DEFAULT_EMULATOR_PORTS = Object.freeze({
  auth: 9099,
  database: 9000,
  functions: 5001,
  storage: 9199,
  ui: 4000,
  hub: 4400,
  logging: 4500
});

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ENVIRONMENT_KEY = "CHARROPRO_ENV";
const PROJECT_KEY = "FIREBASE_PROJECT_ID";

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function asNonEmptyString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function hasPlaceholder(value) {
  return /^REPLACE_WITH_/i.test(asNonEmptyString(value));
}

export function safeClone(value, options = {}) {
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 10;
  const maxArrayLength = Number.isInteger(options.maxArrayLength) ? options.maxArrayLength : 250;
  const seen = new WeakSet();

  function clone(current, depth) {
    if (current === null || typeof current === "string" || typeof current === "number" || typeof current === "boolean") {
      return current;
    }
    if (typeof current === "undefined" || typeof current === "function" || typeof current === "symbol" || typeof current === "bigint") {
      return undefined;
    }
    if (depth >= maxDepth || !isPlainObject(current) && !Array.isArray(current)) {
      return undefined;
    }
    if (seen.has(current)) return undefined;
    seen.add(current);

    if (Array.isArray(current)) {
      return current.slice(0, maxArrayLength).map((item) => clone(item, depth + 1)).filter((item) => item !== undefined);
    }

    const result = {};
    for (const key of Object.keys(current)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!descriptor || typeof descriptor.get === "function" || typeof descriptor.set === "function") continue;
      const cloned = clone(descriptor.value, depth + 1);
      if (cloned !== undefined) result[key] = cloned;
    }
    return result;
  }

  return clone(value, 0);
}

export function parseEnvironmentText(content) {
  const values = {};
  const errors = [];
  if (typeof content !== "string") {
    return { values, errors: ["environment-file-must-be-text"] };
  }

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      errors.push(`invalid-environment-line:${index + 1}`);
      return;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || DANGEROUS_KEYS.has(key)) {
      errors.push(`invalid-environment-key:${index + 1}`);
      return;
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  });

  return { values, errors };
}

export function normalizeEnvironmentName(value) {
  const normalized = asNonEmptyString(value).toLowerCase();
  return DEVELOPMENT_ENVIRONMENTS.includes(normalized) ? normalized : null;
}

export function buildEnvironmentDescriptor(source = {}) {
  const environment = normalizeEnvironmentName(source[ENVIRONMENT_KEY]) || "local";
  const configuredProjectId = asNonEmptyString(source[PROJECT_KEY]);
  const projectId = configuredProjectId || (environment === "local" ? DEFAULT_LOCAL_PROJECT_ID : "");
  const useEmulators = environment === "local";
  const descriptor = {
    infrastructureVersion: DEVELOPMENT_INFRASTRUCTURE_VERSION,
    environment,
    projectId,
    useEmulators,
    emulatorHosts: useEmulators
      ? {
          auth: asNonEmptyString(source.FIREBASE_AUTH_EMULATOR_HOST, `127.0.0.1:${DEFAULT_EMULATOR_PORTS.auth}`),
          database: asNonEmptyString(source.FIREBASE_DATABASE_EMULATOR_HOST, `127.0.0.1:${DEFAULT_EMULATOR_PORTS.database}`),
          functions: asNonEmptyString(source.FIREBASE_FUNCTIONS_EMULATOR_HOST, `127.0.0.1:${DEFAULT_EMULATOR_PORTS.functions}`),
          storage: asNonEmptyString(source.FIREBASE_STORAGE_EMULATOR_HOST, `127.0.0.1:${DEFAULT_EMULATOR_PORTS.storage}`)
        }
      : {},
    databaseUrl: asNonEmptyString(source.FIREBASE_DATABASE_URL),
    storageBucket: asNonEmptyString(source.FIREBASE_STORAGE_BUCKET)
  };
  return safeClone(descriptor);
}

export function validateEnvironmentDescriptor(descriptor) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(descriptor)) {
    return { valid: false, errors: ["environment-descriptor-must-be-object"], warnings };
  }
  const environment = normalizeEnvironmentName(descriptor.environment);
  if (!environment) errors.push("invalid-environment");
  if (!asNonEmptyString(descriptor.projectId) || hasPlaceholder(descriptor.projectId)) {
    errors.push("missing-project-id");
  }
  if (environment === "local") {
    if (descriptor.projectId !== DEFAULT_LOCAL_PROJECT_ID) errors.push("local-project-id-must-be-isolated");
    if (descriptor.useEmulators !== true) errors.push("local-environment-requires-emulators");
    for (const service of EMULATOR_SERVICES) {
      if (!asNonEmptyString(descriptor.emulatorHosts?.[service])) errors.push(`missing-${service}-emulator-host`);
    }
    if (descriptor.databaseUrl || descriptor.storageBucket) warnings.push("local-profile-ignores-remote-database-or-storage-values");
  }
  if (environment === "staging") {
    if (descriptor.useEmulators) errors.push("staging-must-not-use-local-emulators");
    if (descriptor.projectId === "charropro-e8a68") errors.push("staging-must-not-use-production-project");
    if (!descriptor.databaseUrl || hasPlaceholder(descriptor.databaseUrl)) warnings.push("staging-database-url-not-provisioned");
    if (!descriptor.storageBucket || hasPlaceholder(descriptor.storageBucket)) warnings.push("staging-storage-bucket-not-provisioned");
  }
  if (environment === "production") {
    if (descriptor.useEmulators) errors.push("production-must-not-use-local-emulators");
    if (descriptor.projectId !== "charropro-e8a68" && !hasPlaceholder(descriptor.projectId)) {
      warnings.push("production-project-id-differs-from-current-known-alias");
    }
    warnings.push("production-profile-requires-separate-release-authorization");
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateFirebaseEmulatorConfiguration(firebaseConfiguration) {
  const errors = [];
  const warnings = [];
  const emulators = firebaseConfiguration?.emulators;
  if (!isPlainObject(emulators)) {
    return { valid: false, errors: ["firebase-emulators-configuration-missing"], warnings };
  }
  for (const service of EMULATOR_SERVICES) {
    const configuredPort = emulators?.[service]?.port;
    if (configuredPort !== DEFAULT_EMULATOR_PORTS[service]) errors.push(`invalid-${service}-emulator-port`);
  }
  if (emulators.ui?.enabled !== true || emulators.ui?.port !== DEFAULT_EMULATOR_PORTS.ui) errors.push("invalid-emulator-ui-configuration");
  if (emulators.singleProjectMode !== true) warnings.push("emulator-single-project-mode-not-enabled");
  return { valid: errors.length === 0, errors, warnings };
}

export function buildEmulatorStartPlan(descriptor, options = {}) {
  const validation = validateEnvironmentDescriptor(descriptor);
  if (!validation.valid || descriptor.environment !== "local") {
    throw new Error(`emulator-start-requires-valid-local-environment:${validation.errors.join(",")}`);
  }
  const importDirectory = asNonEmptyString(options.importDirectory, ".local/firebase-emulator-data");
  const args = [
    "emulators:start",
    "--only",
    EMULATOR_SERVICES.join(","),
    "--project",
    descriptor.projectId,
    "--import",
    importDirectory,
    "--export-on-exit",
    importDirectory
  ];
  return safeClone({ command: asNonEmptyString(options.firebaseCommand, "firebase"), args, projectId: descriptor.projectId });
}

export function buildEmulatorSmokePlan(descriptor, options = {}) {
  const validation = validateEnvironmentDescriptor(descriptor);
  if (!validation.valid || descriptor.environment !== "local") {
    throw new Error(`emulator-smoke-requires-valid-local-environment:${validation.errors.join(",")}`);
  }
  return safeClone({
    command: asNonEmptyString(options.firebaseCommand, "firebase"),
    projectId: descriptor.projectId,
    services: [...EMULATOR_SERVICES],
    script: asNonEmptyString(options.script, "tools/development/emulatorSmokeTest.mjs")
  });
}

export function buildToolingReport({ nodeVersion = "", npmVersion = "", firebaseVersion = "", javaVersion = "", gitVersion = "", gcloudVersion = "" } = {}) {
  const report = {
    infrastructureVersion: DEVELOPMENT_INFRASTRUCTURE_VERSION,
    nodeVersion: asNonEmptyString(nodeVersion),
    npmVersion: asNonEmptyString(npmVersion),
    firebaseVersion: asNonEmptyString(firebaseVersion),
    javaVersion: asNonEmptyString(javaVersion),
    gitVersion: asNonEmptyString(gitVersion),
    gcloudVersion: asNonEmptyString(gcloudVersion),
    warnings: []
  };
  if (!/^v20\./.test(report.nodeVersion)) report.warnings.push("node-20-lts-required-for-functions-baseline");
  if (!report.javaVersion) report.warnings.push("java-21-lts-required-by-firebase-emulators");
  if (!report.firebaseVersion) report.warnings.push("firebase-cli-required");
  if (!report.gitVersion) report.warnings.push("git-required");
  if (!report.gcloudVersion) report.warnings.push("gcloud-required-before-staging-iam-validation");
  return safeClone(report);
}
