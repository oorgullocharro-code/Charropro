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

export async function sha256(value) {
  const cryptoApi = globalThis.crypto?.subtle
    ? globalThis.crypto
    : null;
  if (cryptoApi) {
    const digest = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    const nodeCrypto = await import("node:crypto");
    const digest = await nodeCrypto.webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return sha256Fallback(value);
}

export function sha256Fallback(value) {
  const bytes = new TextEncoder().encode(String(value));
  const words = [];
  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] = (words[index >> 2] || 0) | bytes[index] << (24 - index % 4 * 8);
  }
  words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | 0x80 << (24 - bytes.length % 4 * 8);
  const totalWords = ((bytes.length + 9 + 63) >> 6) << 4;
  words[totalWords - 1] = bytes.length * 8;

  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const schedule = new Array(64);
  for (let offset = 0; offset < totalWords; offset += 16) {
    for (let index = 0; index < 16; index += 1) schedule[index] = words[offset + index] || 0;
    for (let index = 16; index < 64; index += 1) {
      const previous = schedule[index - 15];
      const earlier = schedule[index - 2];
      const sigma0 = (previous >>> 7 | previous << 25) ^ (previous >>> 18 | previous << 14) ^ previous >>> 3;
      const sigma1 = (earlier >>> 17 | earlier << 15) ^ (earlier >>> 19 | earlier << 13) ^ earlier >>> 10;
      schedule[index] = (schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sigma1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const choose = e & f ^ ~e & g;
      const temp1 = (h + sigma1 + choose + constants[index] + schedule[index]) | 0;
      const sigma0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const majority = a & b ^ a & c ^ b & c;
      const temp2 = (sigma0 + majority) | 0;
      [h, g, f, e, d, c, b, a] = [g, f, e, (d + temp1) | 0, c, b, a, (temp1 + temp2) | 0];
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }
  return hash.map((word) => (word >>> 0).toString(16).padStart(8, "0")).join("");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
