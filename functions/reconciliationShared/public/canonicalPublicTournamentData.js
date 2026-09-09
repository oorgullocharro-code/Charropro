const PRIVATE = new Set(["publishedscores", "officialscoreledger", "attemptv2", "attemptkey", "uid", "email", "roles", "permissions", "audit", "idempotencykey", "recovery", "token", "tokens", "cas"]);
const LIFECYCLE = new Set(["PRE_EVENT", "LIVE", "PAUSED", "FINALIZED", "ARCHIVED"]);
const TOP_LEVEL = new Set(["schemaVersion", "projectionVersion", "tournamentId", "sourceRevision", "projectionRevision", "generatedAt", "contentHash", "lifecycle", "tournament", "branding", "modules", "sponsors", "program", "live", "results", "standings", "sheet", "timeline", "statistics"]);

export function createCanonicalPublicTournamentData(input = {}) {
  const value = structuredClone(input);
  value.schemaVersion = 3;
  value.projectionVersion = "3.0.0";
  value.contentHash = hash({ ...value, contentHash: undefined, generatedAt: undefined, projectionRevision: undefined });
  const validation = validateCanonicalPublicTournamentData(value);
  if (!validation.valid) throw new Error(`canonical-public-data-invalid:${validation.errors.join(",")}`);
  return value;
}

export function validateCanonicalPublicTournamentData(value = {}) {
  const errors = [];
  const required = ["schemaVersion", "projectionVersion", "tournamentId", "sourceRevision", "projectionRevision", "generatedAt", "contentHash", "lifecycle", "tournament", "live", "statistics"];
  if (!plain(value) || required.some((key) => !(key in value))) errors.push("required-fields-missing");
  if (value.schemaVersion !== 3 || value.projectionVersion !== "3.0.0") errors.push("schema-invalid");
  if (!id(value.tournamentId) || !positive(value.sourceRevision) || !positive(value.projectionRevision) || !iso(value.generatedAt)) errors.push("identity-invalid");
  if (!LIFECYCLE.has(String(value.lifecycle?.status || ""))) errors.push("lifecycle-invalid");
  if (hasPrivate(value)) errors.push("private-field-exposed");
  if (!plain(value) || Object.keys(value).some((key) => !TOP_LEVEL.has(key))) errors.push("public-field-not-allowlisted");
  const results = array(value.results?.teams);
  const byId = new Map(results.map((row) => [row.resultId, row]));
  for (const row of results) if (!id(row.resultId) || !(id(row.teamId) || id(row.participantId)) || !id(row.charreadaId) || !id(row.competitionId) || !finite(row.total) || !finite(row.subtotal) || !finite(row.penalties) || !plain(row.columns)) errors.push("result-invalid");
  for (const standing of array(value.standings?.items)) { const ids = array(standing.resultIds).length ? array(standing.resultIds) : [standing.resultId]; const row = ids.length === 1 ? byId.get(ids[0]) : null; if (!ids.length || ids.some(id => !byId.has(id)) || !positive(standing.position) || (row && standing.total !== row.total)) errors.push("standing-invalid"); }
  for (const competition of array(value.sheet?.competitions)) for (const row of array(competition.rows)) { const result = byId.get(row.resultId); if (!result || result.total !== row.total || stable(row.columns) !== stable(result.columns)) errors.push("sheet-invalid"); }
  if (value.contentHash !== hash({ ...value, contentHash: undefined, generatedAt: undefined, projectionRevision: undefined })) errors.push("content-hash-invalid");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

function hasPrivate(value, seen = new WeakSet()) { if (!value || typeof value !== "object" || seen.has(value)) return false; seen.add(value); return Object.entries(value).some(([key, entry]) => PRIVATE.has(key.toLowerCase()) || hasPrivate(entry, seen)); }
function hash(value) { let hash = 2166136261; for (const char of stable(normalizeRtdbEmptySections(value))) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return `cpub_${(hash >>> 0).toString(16).padStart(8, "0")}`; }
function normalizeRtdbEmptySections(value) { const normalized = structuredClone(value || {}); if (plain(normalized.branding) && Object.keys(normalized.branding).length === 0) delete normalized.branding; if (Array.isArray(normalized.modules) && normalized.modules.length === 0) delete normalized.modules; if (Array.isArray(normalized.sponsors) && normalized.sponsors.length === 0) delete normalized.sponsors; for (const [section, collectionKey] of [["program", "items"], ["results", "teams"], ["standings", "items"], ["sheet", "competitions"], ["timeline", "items"]]) if (plain(normalized[section]) && Array.isArray(normalized[section][collectionKey]) && normalized[section][collectionKey].length === 0) delete normalized[section]; return normalized; }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (plain(value)) return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function array(value) { return Array.isArray(value) ? value : []; }
function plain(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function id(value) { return /^[A-Za-z0-9._:@/-]{1,180}$/.test(String(value || "")) ? String(value) : ""; }
function positive(value) { return Number.isSafeInteger(value) && value >= 1; }
function finite(value) { return Number.isFinite(Number(value)); }
function iso(value) { return Number.isFinite(Date.parse(String(value || ""))); }
