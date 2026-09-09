export const CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION = 3;
export const CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION = "3.0.0";

export const PUBLIC_TOURNAMENT_LIFECYCLE_STATUSES = Object.freeze([
  "PRE_EVENT", "LIVE", "PAUSED", "FINALIZED", "ARCHIVED"
]);

export const PUBLIC_TOURNAMENT_MODULE_TYPES = Object.freeze([
  "hero", "live", "program", "timeline", "standings", "results", "sheet", "statistics", "sponsors"
]);

const PRIVATE_FIELD_NAMES = new Set([
  "publishedscores", "officialscoreledger", "officialscoreaudit", "attemptv2", "idempotencykey",
  "uid", "email", "roles", "permissions", "requests", "cas", "recovery", "token", "tokens"
]);
const PUBLIC_TOP_LEVEL_FIELDS = new Set([
  "schemaVersion", "projectionVersion", "tournamentId", "sourceRevision", "projectionRevision",
  "generatedAt", "contentHash", "lifecycle", "tournament", "branding", "modules", "sponsors",
  "program", "live", "results", "standings", "sheet", "timeline", "statistics"
]);
const PUBLIC_SPONSOR_TIERS = new Set(["principal", "presentador", "oro", "plata", "colaborador"]);
const PUBLIC_SPONSOR_PLACEMENTS = new Set(["hero", "header", "results", "timeline", "footer"]);
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const ID_PATTERN = /^[A-Za-z0-9._:@/-]{1,180}$/;

export function createCanonicalPublicTournamentData(input = {}) {
  const value = normalizeCanonicalPublicTournamentData(input);
  const validation = validateCanonicalPublicTournamentData(value);
  if (!validation.valid) {
    throw new Error(`canonical-public-tournament-data-invalid:${validation.errors.join(",")}`);
  }
  return value;
}

export function normalizeCanonicalPublicTournamentData(input = {}) {
  const tournamentId = id(input.tournamentId || input.tournament?.id);
  const value = {
    schemaVersion: CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION,
    projectionVersion: CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION,
    tournamentId,
    sourceRevision: revision(input.sourceRevision),
    projectionRevision: revision(input.projectionRevision),
    generatedAt: iso(input.generatedAt),
    contentHash: "",
    lifecycle: { status: lifecycleStatus(input.lifecycle?.status) },
    tournament: normalizeTournament(input.tournament, tournamentId),
    branding: normalizeBranding(input.branding),
    modules: collection(input.modules).map(normalizeModule).filter(Boolean),
    sponsors: collection(input.sponsors).map(normalizeSponsor).filter(Boolean),
    program: { items: collection(input.program?.items).map(normalizeProgramItem).filter(Boolean) },
    live: normalizeLive(input.live),
    results: { teams: collection(input.results?.teams).map(normalizeResult).filter(Boolean) },
    standings: { items: collection(input.standings?.items).map(normalizeStanding).filter(Boolean) },
    sheet: { competitions: collection(input.sheet?.competitions).map(normalizeSheetCompetition).filter(Boolean) },
    timeline: { items: collection(input.timeline?.items).map(normalizeTimelineItem).filter(Boolean) },
    statistics: { status: status(input.statistics?.status), items: collection(input.statistics?.items).map(normalizeStatistic).filter(Boolean) }
  };
  value.contentHash = buildCanonicalPublicTournamentDataHash(value);
  return value;
}

export function validateCanonicalPublicTournamentData(value = {}) {
  const errors = [];
  if (!plain(value)) return { valid: false, errors: ["contract-object-required"] };
  if (value.schemaVersion !== CANONICAL_PUBLIC_TOURNAMENT_DATA_SCHEMA_VERSION) errors.push("schema-version-invalid");
  if (value.projectionVersion !== CANONICAL_PUBLIC_TOURNAMENT_DATA_PROJECTION_VERSION) errors.push("projection-version-invalid");
  if (!id(value.tournamentId) || value.tournament?.id !== value.tournamentId) errors.push("tournament-identity-invalid");
  if (!positiveRevision(value.sourceRevision)) errors.push("source-revision-invalid");
  if (!positiveRevision(value.projectionRevision)) errors.push("projection-revision-invalid");
  if (!iso(value.generatedAt)) errors.push("generated-at-invalid");
  if (!PUBLIC_TOURNAMENT_LIFECYCLE_STATUSES.includes(value.lifecycle?.status)) errors.push("lifecycle-status-invalid");
  if (containsPrivateField(value)) errors.push("private-field-exposed");
  if (containsUnexpectedTopLevelField(value)) errors.push("public-field-not-allowlisted");
  if (value.contentHash !== buildCanonicalPublicTournamentDataHash(value)) errors.push("content-hash-invalid");
  validateResolvedResults(value, errors);
  validateModules(value.modules, errors);
  validateSponsors(value.sponsors, errors);
  validatePublicShape(value, errors);
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function buildCanonicalPublicTournamentDataHash(value = {}) {
  const significant = normalizeRtdbEmptySections(value);
  delete significant.contentHash;
  delete significant.generatedAt;
  delete significant.projectionRevision;
  return `cpub_${stableHash(stableStringify(significant))}`;
}

function normalizeRtdbEmptySections(value) {
  const normalized = structuredClone(value || {});
  if (plain(normalized.branding) && Object.keys(normalized.branding).length === 0) delete normalized.branding;
  if (Array.isArray(normalized.modules) && normalized.modules.length === 0) delete normalized.modules;
  if (Array.isArray(normalized.sponsors) && normalized.sponsors.length === 0) delete normalized.sponsors;
  for (const [section, collectionKey] of [
    ["program", "items"],
    ["results", "teams"],
    ["standings", "items"],
    ["sheet", "competitions"],
    ["timeline", "items"]
  ]) {
    if (plain(normalized[section]) && Array.isArray(normalized[section][collectionKey]) && normalized[section][collectionKey].length === 0) {
      delete normalized[section];
    }
  }
  return normalized;
}

function validateResolvedResults(value, errors) {
  const results = collection(value.results?.teams);
  const byId = new Map();
  for (const result of results) {
    if (!id(result.resultId) || !(id(result.teamId) || id(result.participantId)) || !id(result.charreadaId) || !id(result.competitionId)) errors.push("result-identity-invalid");
    if (!finite(result.subtotal) || !finite(result.total) || !finite(result.penalties)) errors.push("result-resolved-values-invalid");
    if (!plain(result.columns)) errors.push("result-columns-invalid");
    if (!result.status) errors.push("result-status-invalid");
    byId.set(result.resultId, result);
  }
  for (const standing of collection(value.standings?.items)) {
    const resultIds = collection(standing.resultIds);
    const references = resultIds.length ? resultIds : [standing.resultId];
    if (!references.length || references.some((resultId) => !byId.has(resultId))) errors.push("standing-result-reference-invalid");
    if (references.length === 1 && standing.total !== byId.get(references[0]).total) errors.push("standing-total-diverges-from-result");
    if (!Number.isSafeInteger(standing.position) || standing.position < 1) errors.push("standing-position-unresolved");
  }
  for (const competition of collection(value.sheet?.competitions)) {
    for (const row of collection(competition.rows)) {
      const result = byId.get(row.resultId);
      if (!result) errors.push("sheet-result-reference-invalid");
      else if (row.total !== result.total || stableStringify(row.columns) !== stableStringify(result.columns)) errors.push("sheet-diverges-from-result");
    }
  }
}

function validateModules(modules, errors) {
  const seen = new Set();
  for (const module of collection(modules)) {
    if (!PUBLIC_TOURNAMENT_MODULE_TYPES.includes(module.type) || !Number.isSafeInteger(module.order)) errors.push("module-invalid");
    if (seen.has(module.type)) errors.push("module-duplicate");
    seen.add(module.type);
  }
}

function validateSponsors(sponsors, errors) {
  for (const sponsor of collection(sponsors)) {
    if (!id(sponsor.id) || !sponsor.name || !PUBLIC_SPONSOR_TIERS.has(sponsor.tier) || !PUBLIC_SPONSOR_PLACEMENTS.has(sponsor.placement)) errors.push("sponsor-invalid");
  }
}

function validatePublicShape(value, errors) {
  const branding = plain(value.branding) ? value.branding : {};
  // RTDB omits empty maps and lists, so missing optional sections represent
  // their canonical empty value after a round trip through the public path.
  if (!plain(value.tournament) || !plain(value.live)) errors.push("public-section-invalid");
  for (const color of ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor"]) {
    if (branding[color] && !COLOR_PATTERN.test(branding[color])) errors.push(`branding-${color}-invalid`);
  }
  for (const item of collection(value.timeline?.items)) {
    if (!id(item.eventId) || !Number.isSafeInteger(item.sequence) || !iso(item.occurredAt) || !item.type) errors.push("timeline-item-invalid");
  }
}

function normalizeTournament(value = {}, tournamentId = "") {
  return pick(value, ["slug", "name", "shortName", "edition", "season", "status", "startDate", "endDate", "venue", "city", "state", "organization", "competitionType"], { id: tournamentId });
}

function normalizeBranding(value = {}) {
  const output = pick(value, ["theme", "primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor", "logoUrl", "coverImageUrl", "heroImageUrl", "organizerLogoUrl"]);
  for (const key of Object.keys(output)) if (!output[key]) delete output[key];
  return output;
}

function normalizeModule(value = {}) {
  const type = text(value.type).toLowerCase();
  if (!PUBLIC_TOURNAMENT_MODULE_TYPES.includes(type)) return null;
  return { type, enabled: value.enabled === true, order: integer(value.order) };
}

function normalizeSponsor(value = {}) {
  const sponsor = pick(value, ["id", "name", "logoUrl", "url", "tier", "placement"]);
  sponsor.order = integer(value.order);
  return sponsor.id ? sponsor : null;
}

function normalizeProgramItem(value = {}) {
  const item = pick(value, ["id", "charreadaId", "competitionId", "name", "scheduledDate", "scheduledTime", "status", "order", "teamIds", "participantIds"]);
  return item.id || item.charreadaId ? item : null;
}

function normalizeLive(value = {}) {
  return pick(value, ["status", "currentCharreada", "currentTeam", "currentParticipant", "currentSuerte", "currentScore", "updatedAt"]);
}

function normalizeResult(value = {}) {
  const result = pick(value, ["resultId", "teamId", "teamName", "participantScope", "participantId", "participantName", "charreadaId", "competitionId", "phase", "columns", "penalties", "subtotal", "total", "status", "position"]);
  result.columns = plain(value.columns) ? finiteRecord(value.columns) : {};
  return result.resultId ? result : null;
}

function normalizeStanding(value = {}) {
  const item = pick(value, ["rankingId", "resultId", "resultIds", "position", "scopeType", "competitionId", "charreadaId", "participantScope", "teamId", "teamName", "participantId", "participantName", "total", "classification", "status", "phase", "tieBreakLabel"]);
  return item.resultId || item.resultIds?.length ? item : null;
}

function normalizeSheetCompetition(value = {}) {
  const competition = pick(value, ["competitionId", "name"]);
  competition.rows = collection(value.rows).map((row) => ({
    ...pick(row, ["resultId", "teamId", "teamName", "participantId", "participantName", "total"]),
    columns: plain(row.columns) ? finiteRecord(row.columns) : {}
  })).filter((row) => row.resultId);
  return competition.competitionId ? competition : null;
}

function normalizeTimelineItem(value = {}) {
  const item = pick(value, ["eventId", "sequence", "occurredAt", "type", "charreadaId", "teamId", "participantId", "suerteId", "label", "score", "previousScore", "status"]);
  return item.eventId ? item : null;
}

function normalizeStatistic(value = {}) {
  const item = pick(value, ["id", "label", "value", "status"]);
  return item.id ? item : null;
}

function pick(value, keys, required = {}) {
  const output = { ...required };
  for (const key of keys) {
    const entry = value?.[key];
    if (Array.isArray(entry)) output[key] = entry.map(text).filter(Boolean);
    else if (typeof entry === "boolean") output[key] = entry;
    else if (typeof entry === "number") output[key] = Number.isFinite(entry) ? entry : null;
    else if (entry !== null && entry !== undefined) output[key] = text(entry);
  }
  return output;
}

function finiteRecord(value) {
  return Object.fromEntries(Object.entries(value).filter(([key, entry]) => id(key) && finite(entry)).map(([key, entry]) => [key, Number(entry)]));
}

function containsPrivateField(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.entries(value).some(([key, entry]) => PRIVATE_FIELD_NAMES.has(String(key).toLowerCase()) || containsPrivateField(entry, seen));
}

function containsUnexpectedTopLevelField(value) {
  return !plain(value) || Object.keys(value).some((key) => !PUBLIC_TOP_LEVEL_FIELDS.has(key));
}

function collection(value) { return Array.isArray(value) ? value : []; }
function plain(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function id(value) { const clean = text(value); return ID_PATTERN.test(clean) ? clean : ""; }
function text(value) { return value === null || value === undefined ? "" : String(value).trim().slice(0, 4000); }
function status(value) { return text(value).toUpperCase(); }
function lifecycleStatus(value) { return status(value); }
function revision(value) { return integer(value); }
function positiveRevision(value) { return Number.isSafeInteger(value) && value >= 1; }
function integer(value) { const number = Number(value); return Number.isSafeInteger(number) ? number : 0; }
function finite(value) { return Number.isFinite(Number(value)); }
function iso(value) { const clean = text(value); return Number.isFinite(Date.parse(clean)) ? clean : ""; }
function stableStringify(value) { if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`; if (plain(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function stableHash(value) { let hash = 2166136261; for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
