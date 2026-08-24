import {
  PUBLIC_PROJECTION_SCHEMA_VERSION,
  normalizePublicProjectionCollections,
  sanitizePublicProjectionValue,
  stablePublicStringify,
  validatePublicProjection
} from "./publicProjectionSchema.js?v=20260824-scorer-interaction-latency-001-v1";
import { adaptPublicProjectionToLegacy } from "./publicProjectionLegacyAdapter.js?v=20260824-scorer-interaction-latency-001-v1";

export const PUBLIC_PORTAL_STALE_THRESHOLD_MS = 120000;
export const PUBLIC_PORTAL_CONNECTION_STATES = Object.freeze([
  "connecting",
  "online",
  "stale",
  "offline",
  "reconnecting",
  "error"
]);

export function createPublicPortalClientState(options = {}) {
  return {
    connection: "connecting",
    connected: null,
    snapshot: null,
    legacySnapshot: null,
    projectionRevision: 0,
    sectionRevisions: {},
    receivedAtMs: 0,
    sourceUpdatedAtMs: 0,
    staleThresholdMs: finitePositive(options.staleThresholdMs, PUBLIC_PORTAL_STALE_THRESHOLD_MS),
    error: null
  };
}

export function applyPublicPortalSnapshot(state, input, options = {}) {
  const nowMs = finitePositive(options.nowMs, Date.now());
  const current = cloneState(state);
  if (!input || typeof input !== "object") {
    return {
      state: {
        ...current,
        connection: current.snapshot ? current.connection : "error",
        error: "public-snapshot-missing"
      },
      accepted: false,
      duplicate: false,
      changedSections: []
    };
  }
  const isV2 = Number(input.schemaVersion) === PUBLIC_PROJECTION_SCHEMA_VERSION;
  if (!isV2) {
    const legacySnapshot = sanitizePublicProjectionValue(input);
    return {
      state: {
        ...current,
        connection: current.connected === false ? "offline" : "online",
        snapshot: legacySnapshot,
        legacySnapshot,
        receivedAtMs: nowMs,
        sourceUpdatedAtMs: timestamp(input.generatedAt || input.generatedAtMs) || nowMs,
        error: null
      },
      accepted: true,
      duplicate: false,
      legacy: true,
      changedSections: ["legacy"]
    };
  }

  const normalizedInput = normalizePublicProjectionCollections(input);
  const revision = normalizedInput.projectionRevision;
  if (revision < current.projectionRevision) {
    return {
      state: current,
      accepted: false,
      duplicate: false,
      reason: "projection-revision-regression",
      changedSections: []
    };
  }
  const validation = validatePublicProjection(normalizedInput);
  if (!validation.valid) {
    return {
      state: { ...current, connection: "error", error: "public-snapshot-invalid" },
      accepted: false,
      duplicate: false,
      errors: validation.errors,
      changedSections: []
    };
  }
  if (revision === current.projectionRevision && current.snapshot) {
    const same = stablePublicStringify(normalizedInput) === stablePublicStringify(current.snapshot);
    return {
      state: same ? current : { ...current, connection: "error", error: "projection-revision-inconsistent" },
      accepted: false,
      duplicate: same,
      reason: same ? "projection-revision-duplicate" : "projection-revision-inconsistent",
      changedSections: []
    };
  }

  const snapshot = sanitizePublicProjectionValue(normalizedInput);
  const sectionRevisions = Object.fromEntries(
    Object.entries(snapshot)
      .filter(([, value]) => value && typeof value === "object" && Number.isSafeInteger(value.revision))
      .map(([key, value]) => [key, value.revision])
  );
  const changedSections = Object.keys(sectionRevisions).filter(
    (key) => current.sectionRevisions[key] !== sectionRevisions[key]
  );
  return {
    state: {
      ...current,
      connection: current.connected === false ? "offline" : "online",
      snapshot,
      legacySnapshot: adaptPublicProjectionToLegacy(snapshot),
      projectionRevision: revision,
      sectionRevisions,
      receivedAtMs: nowMs,
      sourceUpdatedAtMs: timestamp(snapshot.sourceUpdatedAt) || timestamp(snapshot.generatedAt) || nowMs,
      error: null
    },
    accepted: true,
    duplicate: false,
    legacy: false,
    changedSections
  };
}

export function applyPublicPortalConnection(state, connected, options = {}) {
  const current = cloneState(state);
  if (connected === false) {
    return { ...current, connected: false, connection: "offline" };
  }
  if (connected === true) {
    const connection = current.connected === false && current.snapshot ? "reconnecting" : current.snapshot ? "online" : "connecting";
    return { ...current, connected: true, connection };
  }
  return { ...current, connected: null, connection: options.error ? "error" : "connecting" };
}

export function evaluatePublicPortalStale(state, options = {}) {
  const current = cloneState(state);
  if (!current.snapshot || current.connected === false) return current;
  const nowMs = finitePositive(options.nowMs, Date.now());
  const reference = current.sourceUpdatedAtMs || current.receivedAtMs;
  if (reference && nowMs - reference > current.staleThresholdMs) {
    return { ...current, connection: "stale" };
  }
  if (current.connection === "stale") return { ...current, connection: "online" };
  return current;
}

export function getPublicPortalViewSnapshot(state) {
  return state?.legacySnapshot || state?.snapshot || null;
}

function cloneState(state) {
  return {
    ...createPublicPortalClientState(),
    ...(state || {}),
    sectionRevisions: { ...(state?.sectionRevisions || {}) }
  };
}

function timestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function finitePositive(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
