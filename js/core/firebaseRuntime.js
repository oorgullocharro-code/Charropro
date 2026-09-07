export const FIREBASE_RUNTIME_VERSION = "1.0.0";
export const LOCAL_FIREBASE_PROJECT_ID = "demo-charropro-local";
export const LOCAL_FIREBASE_APP_NAME = "charropro-local-emulator";

export const LOCAL_FIREBASE_EMULATOR_HOSTS = Object.freeze({
  auth: Object.freeze({ host: "127.0.0.1", port: 9099 }),
  database: Object.freeze({ host: "127.0.0.1", port: 9000 }),
  functions: Object.freeze({ host: "127.0.0.1", port: 5001 }),
  storage: Object.freeze({ host: "127.0.0.1", port: 9199 })
});

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const PRODUCTION_PROJECT_ID = "charropro-e8a68";
const DANGEROUS_REMOTE_MARKERS = [
  PRODUCTION_PROJECT_ID,
  ".firebaseio.com",
  ".firebasestorage.app",
  "firebaseapp.com"
];

export class FirebaseRuntimeError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "FirebaseRuntimeError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function isLocalFirebaseRuntimeLocation(locationLike = globalThis.location) {
  const hostname = String(locationLike?.hostname || "").trim().toLowerCase();
  return LOCAL_HOSTS.has(hostname);
}

export function isPrivateLanIpv4Host(value = "") {
  const octets = String(value || "").trim().split(".");
  if (octets.length !== 4 || octets.some((octet) => !/^\d{1,3}$/.test(octet))) return false;
  const [first, second] = octets.map((octet) => Number(octet));
  if (octets.some((octet) => Number(octet) > 255)) return false;
  return first === 10 || first === 192 && second === 168 || first === 172 && second >= 16 && second <= 31;
}

function getRuntimeHostname(locationLike = globalThis.location) {
  return String(locationLike?.hostname || "").trim().toLowerCase();
}

function isExplicitLocalLanRuntime(locationLike = globalThis.location, requested = "") {
  return requested === "local" && isPrivateLanIpv4Host(getRuntimeHostname(locationLike));
}

export function resolveFirebaseRuntimeEnvironment(locationLike = globalThis.location) {
  const isLocal = isLocalFirebaseRuntimeLocation(locationLike);
  const isPrivateLan = isPrivateLanIpv4Host(getRuntimeHostname(locationLike));
  const rawSearch = String(locationLike?.search || "");
  const params = new URLSearchParams(rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch);
  const requested = String(params.get("charroproEnv") || "").trim().toLowerCase();

  if (requested && requested !== "local") {
    throw new FirebaseRuntimeError("firebase-runtime-environment-selection-blocked", { requested });
  }
  if (isPrivateLan && requested !== "local") {
    throw new FirebaseRuntimeError("firebase-runtime-local-lan-explicit-required", {
      hostname: String(locationLike?.hostname || "")
    });
  }
  if (requested === "local" && !isLocal && !isExplicitLocalLanRuntime(locationLike, requested)) {
    throw new FirebaseRuntimeError("firebase-runtime-local-host-required", {
      hostname: String(locationLike?.hostname || "")
    });
  }
  return isLocal || isExplicitLocalLanRuntime(locationLike, requested) ? "local" : "production";
}

export function createLocalFirebaseRuntime(base = {}) {
  const sdkVersion = String(base.sdkVersion || "").trim();
  const functionsRegion = String(base.functionsRegion || "us-central1").trim();
  const emulatorHost = String(base.emulatorHost || "127.0.0.1").trim().toLowerCase();
  if (!/^\d+\.\d+\.\d+$/.test(sdkVersion)) {
    throw new FirebaseRuntimeError("firebase-runtime-sdk-version-invalid");
  }
  if (!/^[a-z]+(?:-[a-z]+)*\d?$/.test(functionsRegion)) {
    throw new FirebaseRuntimeError("firebase-runtime-functions-region-invalid");
  }

  if (!LOCAL_HOSTS.has(emulatorHost) && !isPrivateLanIpv4Host(emulatorHost)) {
    throw new FirebaseRuntimeError("firebase-runtime-emulator-host-invalid", { emulatorHost });
  }
  const emulatorHosts = Object.freeze(Object.fromEntries(Object.entries(LOCAL_FIREBASE_EMULATOR_HOSTS).map(([service, endpoint]) => [
    service,
    Object.freeze({ host: emulatorHost, port: endpoint.port })
  ])));
  const runtime = {
    version: FIREBASE_RUNTIME_VERSION,
    environment: "local",
    label: "LOCAL / EMULATOR",
    appName: LOCAL_FIREBASE_APP_NAME,
    projectId: LOCAL_FIREBASE_PROJECT_ID,
    sdkVersion,
    functionsRegion,
    firebaseConfig: {
      apiKey: "local-emulator-api-key",
      authDomain: emulatorHost,
      databaseURL: `http://${emulatorHost}:${LOCAL_FIREBASE_EMULATOR_HOSTS.database.port}?ns=${LOCAL_FIREBASE_PROJECT_ID}`,
      projectId: LOCAL_FIREBASE_PROJECT_ID,
      storageBucket: `${LOCAL_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: "local-emulator",
      appId: "local:charropro:emulator"
    },
    emulatorHosts
  };
  assertLocalFirebaseRuntime(runtime);
  return deepFreeze(runtime);
}

export function resolveFirebaseRuntime({ location = globalThis.location, bootstrap = {} } = {}) {
  const environment = resolveFirebaseRuntimeEnvironment(location);
  const sdkVersion = String(bootstrap.sdkVersion || "").trim();
  const functionsRegion = String(bootstrap.functionsRegion || "").trim();

  if (environment === "local") {
    return createLocalFirebaseRuntime({
      sdkVersion,
      functionsRegion,
      emulatorHost: getRuntimeHostname(location)
    });
  }

  const firebaseConfig = clonePlainValue(bootstrap.client || {});
  if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    throw new FirebaseRuntimeError("firebase-runtime-production-bootstrap-invalid");
  }
  return deepFreeze({
    version: FIREBASE_RUNTIME_VERSION,
    environment: "production",
    label: "",
    appName: "[DEFAULT]",
    projectId: String(firebaseConfig.projectId),
    sdkVersion,
    functionsRegion,
    firebaseConfig,
    emulatorHosts: null
  });
}

export function assertLocalFirebaseRuntime(runtime = {}) {
  if (runtime.environment !== "local") {
    throw new FirebaseRuntimeError("firebase-runtime-local-required");
  }
  if (runtime.projectId !== LOCAL_FIREBASE_PROJECT_ID || runtime.firebaseConfig?.projectId !== LOCAL_FIREBASE_PROJECT_ID) {
    throw new FirebaseRuntimeError("firebase-runtime-production-blocked", { field: "projectId" });
  }

  const configurationText = JSON.stringify(runtime.firebaseConfig || {}).toLowerCase();
  if (DANGEROUS_REMOTE_MARKERS.some((marker) => configurationText.includes(marker))) {
    throw new FirebaseRuntimeError("firebase-runtime-production-blocked", { field: "firebaseConfig" });
  }

  const databaseUrl = parseUrl(runtime.firebaseConfig?.databaseURL, "databaseURL");
  const expectedNamespace = LOCAL_FIREBASE_PROJECT_ID;
  const emulatorHost = String(runtime.emulatorHosts?.database?.host || "").trim().toLowerCase();
  if (!LOCAL_HOSTS.has(emulatorHost) && !isPrivateLanIpv4Host(emulatorHost)) {
    throw new FirebaseRuntimeError("firebase-runtime-emulator-host-invalid", { service: "database" });
  }
  if (databaseUrl.protocol !== "http:" || databaseUrl.hostname !== emulatorHost || Number(databaseUrl.port) !== LOCAL_FIREBASE_EMULATOR_HOSTS.database.port || databaseUrl.searchParams.get("ns") !== expectedNamespace) {
    throw new FirebaseRuntimeError("firebase-runtime-database-emulator-invalid");
  }

  for (const [service, endpoint] of Object.entries(LOCAL_FIREBASE_EMULATOR_HOSTS)) {
    const configured = runtime.emulatorHosts?.[service];
    if (configured?.host !== emulatorHost || Number(configured?.port) !== endpoint.port || !LOCAL_HOSTS.has(configured.host) && !isPrivateLanIpv4Host(configured.host)) {
      throw new FirebaseRuntimeError("firebase-runtime-emulator-host-invalid", { service });
    }
  }
  return true;
}

export function buildFirebaseEmulatorConnectionPlan(runtime = {}) {
  assertLocalFirebaseRuntime(runtime);
  return deepFreeze({
    auth: { url: `http://${runtime.emulatorHosts.auth.host}:${runtime.emulatorHosts.auth.port}` },
    database: { host: runtime.emulatorHosts.database.host, port: runtime.emulatorHosts.database.port },
    functions: { host: runtime.emulatorHosts.functions.host, port: runtime.emulatorHosts.functions.port },
    storage: { host: runtime.emulatorHosts.storage.host, port: runtime.emulatorHosts.storage.port }
  });
}

export function getFirebaseRuntimePublicDiagnostics(runtime = {}, options = {}) {
  const local = runtime.environment === "local";
  return Object.freeze({
    version: FIREBASE_RUNTIME_VERSION,
    environment: local ? "local" : "production",
    label: local ? "LOCAL / EMULATOR" : "",
    local,
    projectId: local ? LOCAL_FIREBASE_PROJECT_ID : "",
    emulatorHosts: local
      ? Object.fromEntries(Object.entries(runtime.emulatorHosts || {}).map(([service, endpoint]) => [service, `${endpoint.host}:${endpoint.port}`]))
      : {},
    connected: Boolean(options.connected)
  });
}

function parseUrl(value, field) {
  try {
    return new URL(String(value || ""));
  } catch {
    throw new FirebaseRuntimeError("firebase-runtime-url-invalid", { field });
  }
}

function clonePlainValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (!value || typeof value !== "object" || depth > 10 || seen.has(value)) {
    throw new FirebaseRuntimeError("firebase-runtime-value-invalid");
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => clonePlainValue(item, depth + 1, seen));
    const output = {};
    for (const key of Object.keys(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new FirebaseRuntimeError("firebase-runtime-key-invalid");
      output[key] = clonePlainValue(value[key], depth + 1, seen);
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}
