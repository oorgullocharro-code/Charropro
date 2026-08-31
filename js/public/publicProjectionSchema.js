import { validatePublicLiveFeed } from "./publicLiveFeed.js?v=20260831-precommercial-tournament-delete-production-backup-validation-recovery-002-v1";

export const PUBLIC_PROJECTION_SCHEMA_VERSION = 2;
export const PUBLIC_PROJECTION_SECTIONS = Object.freeze([
  "metadata",
  "overview",
  "program",
  "live",
  "liveFeed",
  "competitions",
  "results",
  "rankings",
  "statistics",
  "search"
]);

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FIREBASE_RESERVED_KEYS = new Set([...DANGEROUS_KEYS, "hasOwnProperty"]);
const FIREBASE_REPAIRABLE_ISSUES = new Set([
  "null-prototype",
  "has-own-property-unavailable",
  "has-own-property-overridden",
  "has-own-property-key",
  "undefined-value"
]);
const MAX_DEPTH = 12;
const MAX_ARRAY_ITEMS = 2000;
const MAX_OBJECT_KEYS = 300;
const MAX_STRING_LENGTH = 4000;
const ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,180}$/;
const TOP_LEVEL_FIELDS = new Set([
  "schemaVersion",
  "projectionRevision",
  "generatedAt",
  "generatedAtMs",
  "sourceUpdatedAt",
  "status",
  ...PUBLIC_PROJECTION_SECTIONS
]);

const SECTION_FIELDS = Object.freeze({
  metadata: new Set([
    "revision",
    "status",
    "tournamentId",
    "name",
    "slug",
    "schemaVersion",
    "visibility",
    "timezone",
    "generatedAt",
    "generatedAtMs",
    "sourceUpdatedAt"
  ]),
  overview: new Set([
    "revision",
    "status",
    "name",
    "venue",
    "startDate",
    "endDate",
    "activeCompetitionId",
    "activeCharreadaId",
    "activeCompetitionName",
    "activeCharreadaName",
    "turn",
    "contextConsistency",
    "updatedAt"
  ]),
  program: new Set(["revision", "status", "items"]),
  live: new Set([
    "revision",
    "status",
    "competitionId",
    "charreadaId",
    "turn",
    "timer",
    "currentResult",
    "standings",
    "updatedAt"
  ]),
  liveFeed: new Set(["revision", "status", "updatedAt", "current", "items"]),
  competitions: new Set(["revision", "status", "items"]),
  results: new Set(["revision", "status", "scopes", "items"]),
  rankings: new Set(["revision", "status", "items"]),
  statistics: new Set(["revision", "status", "items"]),
  search: new Set(["revision", "status", "items"])
});
const PROGRAM_ITEM_FIELDS = new Set([
  "scheduleId",
  "sequence",
  "competitionId",
  "competitionType",
  "competitionScope",
  "competitionName",
  "categoryId",
  "categoryName",
  "phaseId",
  "phaseName",
  "charreadaId",
  "name",
  "shortTitle",
  "scheduledDate",
  "scheduledTime",
  "endTime",
  "order",
  "status",
  "venueId",
  "venueName",
  "participantType",
  "participants",
  "publicNotes",
  "liveAvailable",
  "resultsAvailable",
  "revision",
  "updatedAt",
  "association",
  "legacy"
]);
const PROGRAM_PARTICIPANT_FIELDS = new Set([
  "id",
  "type",
  "order",
  "name",
  "shortName",
  "logoUrl",
  "region",
  "status",
  "teamId",
  "teamName",
  "participantId",
  "participantName",
  "categoryId",
  "categoryName",
  "horseId",
  "horseName",
  "association"
]);
const COMPETITION_ITEM_FIELDS = new Set([
  "competitionId",
  "competitionType",
  "name",
  "categoryId",
  "phaseId",
  "order",
  "status",
  "suerteIds",
  "charreadaIds",
  "competitionScope",
  "legacy"
]);
const RESULT_ITEM_FIELDS = new Set([
  "resultId",
  "teamId",
  "teamName",
  "participantId",
  "participantName",
  "horseId",
  "horseName",
  "association",
  "categoryId",
  "categoryName",
  "competitionId",
  "competitionType",
  "phaseId",
  "phaseName",
  "charreadaId",
  "participantScope",
  "scores",
  "subtotal",
  "accumulatedTotal",
  "totalStatus",
  "teamPenaltyTotal",
  "officialTotal",
  "officialPosition",
  "provisionalPosition",
  "positionStatus",
  "resultStatus",
  "publishedAt",
  "sourceRevision",
  "displayOrder"
]);
const RESULT_SCOPE_FIELDS = new Set([
  "competitionId",
  "categoryId",
  "categoryName",
  "phaseId",
  "phaseName",
  "charreadaId",
  "participantScope",
  "resultIds"
]);
const TURN_FIELDS = new Set(["status", "team", "participant", "horse", "suerteId", "suerteName"]);
const TURN_ENTITY_FIELDS = new Set(["id", "name", "association", "category"]);
const TIMER_FIELDS = new Set(["status", "timeMs", "timeText", "running"]);
const CURRENT_RESULT_FIELDS = new Set([
  "resultId",
  "teamId",
  "teamName",
  "participantId",
  "participantName",
  "suerteId",
  "score",
  "publishedAt"
]);
const STANDING_FIELDS = new Set([
  "resultId",
  "teamId",
  "teamName",
  "participantId",
  "participantName",
  "total",
  "officialPosition",
  "provisionalPosition",
  "positionStatus",
  "totalStatus",
  "active"
]);

export function sanitizePublicProjectionValue(value, options = {}) {
  const seen = new WeakSet();
  return sanitizeValue(value, {
    depth: 0,
    seen,
    maxDepth: finiteLimit(options.maxDepth, MAX_DEPTH),
    maxArrayItems: finiteLimit(options.maxArrayItems, MAX_ARRAY_ITEMS),
    maxObjectKeys: finiteLimit(options.maxObjectKeys, MAX_OBJECT_KEYS),
    maxStringLength: finiteLimit(options.maxStringLength, MAX_STRING_LENGTH)
  });
}

export function diagnosePublicProjectionFirebaseCompatibility(value, options = {}) {
  const issues = [];
  inspectFirebaseValue(value, {
    path: options.rootPath || "snapshot",
    depth: 0,
    seen: new WeakSet(),
    issues,
    maxDepth: finiteLimit(options.maxDepth, MAX_DEPTH),
    maxArrayItems: finiteLimit(options.maxArrayItems, MAX_ARRAY_ITEMS),
    maxObjectKeys: finiteLimit(options.maxObjectKeys, MAX_OBJECT_KEYS),
    maxIssues: finiteLimit(options.maxIssues, 100)
  });
  return { valid: issues.length === 0, issues };
}

export function normalizePublicProjectionForFirebase(value, options = {}) {
  const sourceDiagnostics = diagnosePublicProjectionFirebaseCompatibility(value, options);
  const normalized = sanitizePublicProjectionValue(value, options);
  const validation = diagnosePublicProjectionFirebaseCompatibility(normalized, options);
  const blockingIssues = sourceDiagnostics.issues.filter((issue) => !FIREBASE_REPAIRABLE_ISSUES.has(issue.reason));
  return {
    valid: validation.valid && blockingIssues.length === 0,
    value: normalized,
    issues: [...blockingIssues, ...validation.issues],
    normalizedIssues: sourceDiagnostics.issues
  };
}

export function sanitizePublicId(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = sanitizeString(value, 180);
  return ID_PATTERN.test(normalized) ? normalized : fallback;
}

export function sanitizePublicString(value, maxLength = 280, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return sanitizeString(value, maxLength);
}

export function sanitizePublicNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function sanitizePublicBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function validatePublicProjection(projection) {
  projection = normalizePublicProjectionCollections(projection);
  const errors = [];
  const warnings = [];
  if (!isPlainObject(projection)) {
    return { valid: false, errors: ["projection-object-required"], warnings, schemaVersion: null };
  }

  validateAllowedKeys(projection, TOP_LEVEL_FIELDS, "projection", errors);
  if (projection.schemaVersion !== PUBLIC_PROJECTION_SCHEMA_VERSION) errors.push("schema-version-unsupported");
  validateRevision(projection.projectionRevision, "projectionRevision", errors, 1);
  validateIso(projection.generatedAt, "generatedAt", errors);
  if (!Number.isFinite(projection.generatedAtMs) || projection.generatedAtMs < 0) errors.push("generatedAtMs-invalid");
  validateIso(projection.sourceUpdatedAt, "sourceUpdatedAt", errors, true);
  if (!["ready", "live", "finished", "unavailable"].includes(projection.status)) errors.push("status-invalid");

  for (const sectionName of PUBLIC_PROJECTION_SECTIONS) {
    const section = projection[sectionName];
    if (!isPlainObject(section)) {
      errors.push(`${sectionName}-required`);
      continue;
    }
    validateAllowedKeys(section, SECTION_FIELDS[sectionName], sectionName, errors);
    const minimum = ["rankings", "statistics", "search"].includes(sectionName) ? 0 : 1;
    validateRevision(section.revision, `${sectionName}.revision`, errors, minimum);
    if (typeof section.status !== "string" || !section.status) errors.push(`${sectionName}.status-invalid`);
  }

  if (projection.metadata?.schemaVersion !== PUBLIC_PROJECTION_SCHEMA_VERSION) errors.push("metadata-schema-version-invalid");
  if (projection.metadata?.tournamentId && !sanitizePublicId(projection.metadata.tournamentId)) {
    errors.push("metadata-tournamentId-invalid");
  }
  if (!Array.isArray(projection.program?.items)) errors.push("program-items-invalid");
  if (!Array.isArray(projection.competitions?.items)) errors.push("competitions-items-invalid");
  if (!Array.isArray(projection.results?.items)) errors.push("results-items-invalid");
  if (!isPlainObject(projection.results?.scopes)) errors.push("results-scopes-invalid");
  validateItemArray(projection.program?.items, PROGRAM_ITEM_FIELDS, "program.items", errors);
  for (const [itemIndex, item] of (projection.program?.items || []).entries()) {
    validateItemArray(item?.participants, PROGRAM_PARTICIPANT_FIELDS, `program.items.${itemIndex}.participants`, errors);
  }
  validateItemArray(projection.competitions?.items, COMPETITION_ITEM_FIELDS, "competitions.items", errors);
  validateItemArray(projection.results?.items, RESULT_ITEM_FIELDS, "results.items", errors);
  for (const [scopeKey, scope] of Object.entries(projection.results?.scopes || {})) {
    if (!isPlainObject(scope)) {
      errors.push(`results.scopes.${scopeKey}-invalid`);
      continue;
    }
    validateAllowedKeys(scope, RESULT_SCOPE_FIELDS, `results.scopes.${scopeKey}`, errors);
  }
  if (isPlainObject(projection.live?.turn)) {
    validateAllowedKeys(projection.live.turn, TURN_FIELDS, "live.turn", errors);
    for (const entityName of ["team", "participant", "horse"]) {
      if (isPlainObject(projection.live.turn[entityName])) {
        validateAllowedKeys(projection.live.turn[entityName], TURN_ENTITY_FIELDS, `live.turn.${entityName}`, errors);
      }
    }
  }
  if (isPlainObject(projection.live?.timer)) {
    validateAllowedKeys(projection.live.timer, TIMER_FIELDS, "live.timer", errors);
  }
  if (projection.live?.currentResult !== null && projection.live?.currentResult !== undefined) {
    if (!isPlainObject(projection.live.currentResult)) errors.push("live.currentResult-invalid");
    else validateAllowedKeys(projection.live.currentResult, CURRENT_RESULT_FIELDS, "live.currentResult", errors);
  }
  validateItemArray(projection.live?.standings, STANDING_FIELDS, "live.standings", errors);
  const liveFeedValidation = validatePublicLiveFeed(projection.liveFeed);
  if (!liveFeedValidation.valid) errors.push(...liveFeedValidation.errors);
  for (const sectionName of ["rankings", "statistics", "search"]) {
    if (projection[sectionName]?.status !== "unavailable") errors.push(`${sectionName}-must-be-unavailable`);
    if (!Array.isArray(projection[sectionName]?.items) || projection[sectionName].items.length) {
      errors.push(`${sectionName}-items-must-be-empty`);
    }
  }

  const sanitized = sanitizePublicProjectionValue(projection);
  if (stableStringify(sanitized) !== stableStringify(projection)) {
    errors.push("projection-not-sanitized");
  }
  if (containsUnsafeKey(projection)) errors.push("projection-dangerous-key");

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    schemaVersion: projection.schemaVersion ?? null
  };
}

export function normalizePublicProjectionCollections(projection) {
  const normalized = sanitizePublicProjectionValue(projection);
  if (!isPlainObject(normalized)) return normalized;
  if (!isPlainObject(normalized.liveFeed)) {
    normalized.liveFeed = {
      revision: 1,
      status: "empty",
      current: {},
      items: {}
    };
  }
  for (const sectionName of ["program", "competitions", "rankings", "statistics", "search"]) {
    const section = normalized[sectionName];
    if (isPlainObject(section) && (section.items === null || section.items === undefined)) {
      section.items = [];
    }
  }
  if (isPlainObject(normalized.results)) {
    if (normalized.results.items === null || normalized.results.items === undefined) normalized.results.items = [];
    if (normalized.results.scopes === null || normalized.results.scopes === undefined) normalized.results.scopes = {};
  }
  if (isPlainObject(normalized.live) && (normalized.live.standings === null || normalized.live.standings === undefined)) {
    normalized.live.standings = [];
  }
  if (normalized.liveFeed.current === null || normalized.liveFeed.current === undefined) normalized.liveFeed.current = {};
  if (normalized.liveFeed.items === null || normalized.liveFeed.items === undefined) normalized.liveFeed.items = {};
  return normalized;
}

export function stablePublicStringify(value) {
  return stableStringify(sanitizePublicProjectionValue(value));
}

export function buildPublicContentSignature(value) {
  const stable = stablePublicStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pub_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function sanitizeValue(value, context) {
  if (value === null || typeof value === "boolean" || typeof value === "string" || typeof value === "number") {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") return sanitizeString(value, context.maxStringLength);
    return value;
  }
  if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol" || value === undefined) {
    return undefined;
  }
  if (context.depth >= context.maxDepth || typeof value !== "object") return null;
  if (context.seen.has(value)) return null;
  context.seen.add(value);

  if (Array.isArray(value)) {
    const output = [];
    for (const item of value.slice(0, context.maxArrayItems)) {
      const clean = sanitizeValue(item, { ...context, depth: context.depth + 1 });
      output.push(clean === undefined ? null : clean);
    }
    context.seen.delete(value);
    return output;
  }

  const output = {};
  let count = 0;
  for (const key of Object.keys(value)) {
    if (count >= context.maxObjectKeys || FIREBASE_RESERVED_KEYS.has(key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) continue;
    const clean = sanitizeValue(descriptor.value, { ...context, depth: context.depth + 1 });
    if (clean !== undefined) {
      output[key] = clean;
      count += 1;
    }
  }
  context.seen.delete(value);
  return output;
}

function inspectFirebaseValue(value, context) {
  if (context.issues.length >= context.maxIssues) return;
  if (value === undefined) {
    addFirebaseIssue(context, "undefined-value", value);
    return;
  }
  if (value === null || typeof value === "boolean" || typeof value === "string") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) addFirebaseIssue(context, "non-finite-number", value);
    return;
  }
  if (["bigint", "function", "symbol"].includes(typeof value)) {
    addFirebaseIssue(context, "unsupported-type", value);
    return;
  }
  if (typeof value !== "object") return;
  if (context.depth >= context.maxDepth) {
    addFirebaseIssue(context, "depth-limit", value);
    return;
  }
  if (context.seen.has(value)) {
    addFirebaseIssue(context, "cyclic-reference", value);
    return;
  }
  context.seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > context.maxArrayItems) addFirebaseIssue(context, "array-limit", value);
      value.slice(0, context.maxArrayItems).forEach((item, index) => {
        inspectFirebaseValue(item, {
          ...context,
          path: `${context.path}[${index}]`,
          depth: context.depth + 1
        });
      });
      return;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype === null) addFirebaseIssue(context, "null-prototype", value);
    else if (prototype !== Object.prototype) addFirebaseIssue(context, "unsupported-prototype", value);

    const hasOwnDescriptor = Object.getOwnPropertyDescriptor(value, "hasOwnProperty");
    if (hasOwnDescriptor && typeof hasOwnDescriptor.value !== "function") {
      addFirebaseIssue(context, "has-own-property-overridden", value);
    } else if (typeof value.hasOwnProperty !== "function") {
      addFirebaseIssue(context, "has-own-property-unavailable", value);
    }

    const keys = Reflect.ownKeys(value);
    if (keys.length > context.maxObjectKeys) addFirebaseIssue(context, "object-key-limit", value);
    for (const key of keys.slice(0, context.maxObjectKeys)) {
      if (typeof key === "symbol") {
        addFirebaseIssue({ ...context, path: `${context.path}.[symbol]` }, "symbol-key", value);
        continue;
      }
      const childPath = firebaseChildPath(context.path, key);
      if (FIREBASE_RESERVED_KEYS.has(key)) {
        addFirebaseIssue(
          { ...context, path: childPath },
          key === "hasOwnProperty" ? "has-own-property-key" : "dangerous-key",
          value
        );
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        addFirebaseIssue({ ...context, path: childPath }, "accessor-property", value);
        continue;
      }
      inspectFirebaseValue(descriptor.value, {
        ...context,
        path: childPath,
        depth: context.depth + 1
      });
    }
  } finally {
    context.seen.delete(value);
  }
}

function addFirebaseIssue(context, reason, value) {
  if (context.issues.length >= context.maxIssues) return;
  const prototype = value && typeof value === "object" ? Object.getPrototypeOf(value) : null;
  context.issues.push({
    path: context.path,
    reason,
    valueType: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
    constructor: prototype?.constructor?.name || null,
    prototype: prototype === null
      ? "null"
      : prototype === Object.prototype
        ? "Object.prototype"
        : prototype === Array.prototype
          ? "Array.prototype"
          : prototype?.constructor?.name
            ? `${prototype.constructor.name}.prototype`
            : "unknown"
  });
}

function firebaseChildPath(parent, key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}

function sanitizeString(value, maxLength) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .slice(0, Math.max(0, Number(maxLength) || 0));
}

function validateAllowedKeys(value, allowed, prefix, errors) {
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) errors.push(`${prefix}.${key}-not-allowed`);
  }
}

function validateItemArray(value, allowed, prefix, errors) {
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    if (!isPlainObject(item)) {
      errors.push(`${prefix}.${index}-invalid`);
      return;
    }
    validateAllowedKeys(item, allowed, `${prefix}.${index}`, errors);
  });
}

function validateRevision(value, path, errors, minimum) {
  if (!Number.isSafeInteger(value) || value < minimum) errors.push(`${path}-invalid`);
}

function validateIso(value, path, errors, optional = false) {
  if (optional && (value === null || value === "")) return;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) errors.push(`${path}-invalid`);
}

function containsUnsafeKey(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key) || containsUnsafeKey(value[key], seen)) return true;
  }
  return false;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function finiteLimit(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
