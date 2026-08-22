"use strict";

const FIREBASE_REST_CAS_VERSION = "1.0.0";
const DEFAULT_MAX_ATTEMPTS = 12;

class FirebaseRestCasError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "FirebaseRestCasError";
    this.code = code;
    this.details = details;
  }
}

function createFirebaseRestCas(admin, options = {}) {
  if (!admin?.database) throw new FirebaseRestCasError("firebase-rest-cas-admin-required");
  const fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new FirebaseRestCasError("firebase-rest-cas-fetch-required");
  const maxAttempts = normalizeMaxAttempts(options.maxAttempts);

  return Object.freeze({
    async compareAndSwap(path, updater) {
      if (typeof updater !== "function") throw new FirebaseRestCasError("firebase-rest-cas-updater-required");
      const normalizedPath = normalizePath(path);
      const endpoint = buildRestEndpoint(admin, normalizedPath);
      const authorization = await buildAuthorizationHeader(admin, options);

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const currentResponse = await fetchImpl(endpoint, {
          method: "GET",
          headers: {
            accept: "application/json",
            authorization,
            "x-firebase-etag": "true"
          }
        });
        if (!currentResponse.ok) {
          throw new FirebaseRestCasError("firebase-rest-cas-read-failed", {
            status: currentResponse.status,
            attempt
          });
        }
        const etag = currentResponse.headers.get("etag");
        if (!etag) throw new FirebaseRestCasError("firebase-rest-cas-etag-missing", { attempt });
        const current = await readJsonResponse(currentResponse);
        const applied = updater(cloneJsonValue(current));
        if (!applied || typeof applied !== "object" || !("outcome" in applied)) {
          throw new FirebaseRestCasError("firebase-rest-cas-updater-invalid", { attempt });
        }
        if (!applied.outcome?.ok) return cloneJsonValue(applied.outcome);

        const writeResponse = await fetchImpl(endpoint, {
          method: "PUT",
          headers: {
            authorization,
            "content-type": "application/json",
            "if-match": etag
          },
          body: JSON.stringify(applied.state)
        });
        if (writeResponse.ok) return cloneJsonValue(applied.outcome);
        if (writeResponse.status === 412) continue;
        throw new FirebaseRestCasError("firebase-rest-cas-write-failed", {
          status: writeResponse.status,
          attempt
        });
      }

      return {
        ok: false,
        reason: "firebase-rest-cas-retry-exhausted",
        attempts: maxAttempts
      };
    }
  });
}

function buildRestEndpoint(admin, path) {
  const referenceUrl = String(admin.database().ref(path).toString() || "").replace(/\/$/, "");
  if (!/^https?:\/\//i.test(referenceUrl)) {
    throw new FirebaseRestCasError("firebase-rest-cas-database-url-invalid");
  }
  const namespace = resolveDatabaseNamespace(admin);
  const query = namespace ? `?ns=${encodeURIComponent(namespace)}` : "";
  return `${referenceUrl}.json${query}`;
}

function resolveDatabaseNamespace(admin) {
  const app = resolveAdminApp(admin);
  const databaseUrl = String(app?.options?.databaseURL || admin.database()?.app?.options?.databaseURL || "").trim();
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const explicit = parsed.searchParams.get("ns");
      if (explicit) return explicit;
      if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) return "";
    } catch {
      throw new FirebaseRestCasError("firebase-rest-cas-database-url-invalid");
    }
  }
  if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) return "";
  const projectId = app?.options?.projectId
    || process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || "";
  return projectId ? `${projectId}-default-rtdb` : "";
}

async function buildAuthorizationHeader(admin, options) {
  if (typeof options.getAccessToken === "function") {
    const token = await options.getAccessToken();
    return normalizeBearerToken(token);
  }
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) return "Bearer owner";
  const credential = resolveAdminApp(admin)?.options?.credential;
  if (!credential || typeof credential.getAccessToken !== "function") {
    throw new FirebaseRestCasError("firebase-rest-cas-credential-required");
  }
  const access = await credential.getAccessToken();
  return normalizeBearerToken(access?.access_token);
}

function resolveAdminApp(admin) {
  if (typeof admin?.app === "function") return admin.app();
  if (admin?.options && admin?.name) return admin;
  return null;
}

function normalizeBearerToken(value) {
  const token = String(value || "").trim();
  if (!token || /[\r\n]/.test(token)) throw new FirebaseRestCasError("firebase-rest-cas-token-invalid");
  return `Bearer ${token}`;
}

function normalizePath(value) {
  const path = String(value || "").replace(/^\/+|\/+$/g, "");
  if (!path || /[.#$\[\]]/.test(path) || path.split("/").some((segment) => !segment)) {
    throw new FirebaseRestCasError("firebase-rest-cas-path-invalid");
  }
  return path;
}

function normalizeMaxAttempts(value) {
  if (value == null) return DEFAULT_MAX_ATTEMPTS;
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new FirebaseRestCasError("firebase-rest-cas-max-attempts-invalid");
  }
  return value;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new FirebaseRestCasError("firebase-rest-cas-response-invalid", { status: response.status });
  }
}

function cloneJsonValue(value) {
  if (value == null) return value;
  return structuredClone(value);
}

module.exports = {
  FIREBASE_REST_CAS_VERSION,
  FirebaseRestCasError,
  createFirebaseRestCas
};
