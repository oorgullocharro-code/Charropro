const CONFIGURATION_BOOTSTRAP_URL = new URL("../../functions/configuration.defaults.json", import.meta.url);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
let bootstrapPromise = null;

export async function loadConfigurationBootstrap(options = {}) {
  if (options.source) return validateAndFreezeBootstrap(options.source);
  if (!bootstrapPromise || options.reload === true) {
    bootstrapPromise = readBootstrapSource(options.url || CONFIGURATION_BOOTSTRAP_URL)
      .then(validateAndFreezeBootstrap)
      .catch((error) => {
        bootstrapPromise = null;
        throw error;
      });
  }
  return bootstrapPromise;
}

export function getBootstrapConfigurationValue(configuration, path, fallback = null) {
  const segments = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
  let cursor = configuration?.values ?? configuration;
  for (const segment of segments) {
    if (DANGEROUS_KEYS.has(segment) || cursor === null || typeof cursor !== "object" || !Object.hasOwn(cursor, segment)) {
      return fallback;
    }
    cursor = cursor[segment];
  }
  return cursor;
}

async function readBootstrapSource(urlInput) {
  const url = urlInput instanceof URL ? urlInput : new URL(String(urlInput), import.meta.url);
  if (url.protocol === "file:") {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(url, "utf8"));
  }
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error(`configuration-bootstrap-http-${response.status}`);
  return response.json();
}

async function validateAndFreezeBootstrap(source) {
  const configuration = cloneBootstrapValue(source);
  if (configuration.configurationId !== "charropro-runtime") throw new Error("configuration-bootstrap-id-invalid");
  if (configuration.status !== "published" || configuration.scope?.type !== "system") {
    throw new Error("configuration-bootstrap-status-invalid");
  }
  if (!/^[a-f0-9]{64}$/.test(configuration.checksum || "")) {
    throw new Error("configuration-bootstrap-checksum-invalid");
  }
  const checksumPayload = cloneBootstrapValue(configuration);
  delete checksumPayload.checksum;
  delete checksumPayload.fingerprint;
  const actualChecksum = await sha256(canonicalStringify(checksumPayload));
  if (actualChecksum !== configuration.checksum || configuration.fingerprint !== configuration.checksum) {
    throw new Error("configuration-bootstrap-checksum-mismatch");
  }
  for (const path of [
    "firebase.sdkVersion",
    "firebase.functionsRegion",
    "firebase.client.projectId",
    "firebase.client.databaseURL",
    "system.releaseStatus",
    "firebase.paths.tournaments",
    "firebase.paths.configurationManagement"
  ]) {
    if (!getBootstrapConfigurationValue(configuration, path, "")) {
      throw new Error(`configuration-bootstrap-required:${path}`);
    }
  }
  if (!["precommercial", "commercial_approved"].includes(getBootstrapConfigurationValue(configuration, "system.releaseStatus", ""))) {
    throw new Error("configuration-bootstrap-release-status-invalid");
  }
  if (!/^\d+\.\d+\.\d+$/.test(getBootstrapConfigurationValue(configuration, "firebase.sdkVersion", ""))) {
    throw new Error("configuration-bootstrap-sdk-version-invalid");
  }
  const databaseUrl = new URL(getBootstrapConfigurationValue(configuration, "firebase.client.databaseURL", ""));
  if (databaseUrl.protocol !== "https:") throw new Error("configuration-bootstrap-database-url-invalid");
  for (const [name, path] of Object.entries(getBootstrapConfigurationValue(configuration, "firebase.paths", {}))) {
    if (!name || typeof path !== "string" || !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path)) {
      throw new Error(`configuration-bootstrap-path-invalid:${name}`);
    }
  }
  for (const path of [
    "application.timeouts.callableSeconds",
    "application.timeouts.cancelSeconds",
    "application.timeouts.workerSeconds"
  ]) {
    const value = getBootstrapConfigurationValue(configuration, path, null);
    if (!Number.isSafeInteger(value) || value < 1 || value > 3600) {
      throw new Error(`configuration-bootstrap-timeout-invalid:${path}`);
    }
  }
  if (typeof getBootstrapConfigurationValue(configuration, "application.retry.firebaseWorkers", null) !== "boolean") {
    throw new Error("configuration-bootstrap-retry-invalid");
  }
  return deepFreeze(configuration);
}

function cloneBootstrapValue(value, depth = 0, seen = new WeakSet()) {
  if (depth > 12) throw new Error("configuration-bootstrap-depth-limit");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("configuration-bootstrap-number-invalid");
    return value;
  }
  if (typeof value !== "object" || seen.has(value)) throw new Error("configuration-bootstrap-value-invalid");
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > 500) throw new Error("configuration-bootstrap-array-limit");
      return value.map((item) => cloneBootstrapValue(item, depth + 1, seen));
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error("configuration-bootstrap-object-invalid");
    const output = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string" || DANGEROUS_KEYS.has(key)) throw new Error("configuration-bootstrap-key-invalid");
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) throw new Error("configuration-bootstrap-accessor-invalid");
      output[key] = cloneBootstrapValue(descriptor.value, depth + 1, seen);
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value) {
  const cryptoApi = globalThis.crypto?.subtle
    ? globalThis.crypto
    : (await import("node:crypto")).webcrypto;
  const digest = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
