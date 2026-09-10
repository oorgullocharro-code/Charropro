import {
  buildCanonicalOfficialResults,
  getCanonicalOfficialTeamTotals,
  getOfficialRecordValue
} from "./canonicalOfficialResults.js?v=20260909-public-timeline-canonical-event-producer-001-v1";
import { buildOfficialRankingItems } from "./officialRanking.js?v=20260909-public-timeline-canonical-event-producer-001-v1";

export const CANONICAL_TOURNAMENT_RESULTS_SCHEMA_VERSION = "1.0.0";

// This module composes resolved official records. It never selects ledger heads,
// recalculates attempts, or applies sporting rules.
export function buildCanonicalTournamentResults(source = {}, options = {}) {
  const tournament = record(source.tournament || source.info || source);
  const tournamentId = id(options.tournamentId || tournament.id || tournament.tournamentId || source.tournamentId);
  const canonical = resolveCanonicalOfficialResults(source, tournamentId);
  const charreadas = normalizeCharreadas(source.charreadas, tournamentId);
  const teams = normalizeTeams(source.teams, tournamentId);
  const participants = normalizeParticipants(source.participants, tournamentId);
  const horses = normalizeHorses(source.horses, tournamentId);
  const records = canonical.currentRecords.slice().sort(compareRecordIdentity);
  const results = buildTeamCharreadaResults({ tournamentId, records, charreadas, teams, participants, horses, source });
  const standings = buildStandings(results.items);
  const sheet = buildSheet(results.items);
  const sourceRevision = Math.max(1, integer(source.sourceRevision || options.sourceRevision || maxRevision(records)));
  const generatedAt = iso(source.generatedAt || options.generatedAt);
  const value = {
    schemaVersion: CANONICAL_TOURNAMENT_RESULTS_SCHEMA_VERSION,
    tournamentId,
    sourceRevision,
    generatedAt,
    sourceHash: "",
    status: resolveTournamentStatus(source, results.items),
    competitions: buildCompetitions(charreadas, results.items),
    charreadas,
    teams: buildTournamentTeams(results.items, teams),
    results,
    standings,
    sheet,
    statistics: buildStatistics(results.items),
    provenance: {
      canonicalOfficialResultsVersion: canonical.contractVersion,
      sourceRecordCount: canonical.sourceRecordCount,
      currentRecordCount: records.length,
      duplicateHeadsResolved: canonical.duplicateHeadsResolved,
      selectedOfficialAttempts: false,
      readsLedgerDirectly: false
    }
  };
  value.sourceHash = buildCanonicalTournamentResultsHash(value);
  assertCanonicalTournamentResults(value);
  return value;
}

export function buildCanonicalTournamentResultsHash(value = {}) {
  const significant = structuredClone(value || {});
  delete significant.generatedAt;
  delete significant.sourceHash;
  return `ctr_${stableHash(stableStringify(significant))}`;
}

export function validateCanonicalTournamentResults(value = {}) {
  const errors = [];
  if (!plain(value)) return { valid: false, errors: ["canonical-tournament-results-object-required"] };
  if (value.schemaVersion !== CANONICAL_TOURNAMENT_RESULTS_SCHEMA_VERSION) errors.push("schema-version-invalid");
  if (!id(value.tournamentId)) errors.push("tournament-id-invalid");
  if (!Number.isSafeInteger(value.sourceRevision) || value.sourceRevision < 1) errors.push("source-revision-invalid");
  if (value.sourceHash !== buildCanonicalTournamentResultsHash(value)) errors.push("source-hash-invalid");
  const results = collection(value.results?.items);
  const byId = new Map();
  for (const row of results) {
    if (!id(row.resultId) || !id(row.charreadaId) || !id(row.competitionId)
      || (row.participantScope === "individual" ? !id(row.participantId) : !id(row.teamId))) errors.push("result-identity-invalid");
    if (!finite(row.total) || !finite(row.subtotal) || !finite(row.penalties)) errors.push("result-total-invalid");
    if (!plain(row.suertes)) errors.push("result-suertes-invalid");
    if (!row.status) errors.push("result-status-invalid");
    const sportTotal = Object.values(record(row.suertes)).reduce((sum, sport) => sum + finiteNumber(sport.total), 0);
    if (sportTotal !== finiteNumber(row.subtotal)) errors.push("result-sport-total-diverges");
    if (finiteNumber(row.subtotal) + finiteNumber(row.adjustment) !== finiteNumber(row.total)) errors.push("result-team-total-diverges");
    byId.set(row.resultId, row);
  }
  for (const row of collection(value.sheet?.competitions).flatMap((item) => collection(item.rows))) {
    const result = byId.get(row.resultId);
    if (!result) errors.push("sheet-result-reference-invalid");
    else if (row.total !== result.total || stableStringify(row.columns) !== stableStringify(toSheetColumns(result.suertes))) errors.push("sheet-diverges-from-result");
  }
  for (const standing of collection(value.standings?.items)) {
    for (const resultId of collection(standing.resultIds)) {
      const result = byId.get(resultId);
      if (!result) errors.push("standing-result-reference-invalid");
    }
  }
  for (const team of collection(value.teams)) {
    const total = collection(team.resultIds).reduce((sum, resultId) => sum + finiteNumber(byId.get(resultId)?.total), 0);
    if (total !== finiteNumber(team.total)) errors.push("team-total-diverges-from-results");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function assertCanonicalTournamentResults(value = {}) {
  const validation = validateCanonicalTournamentResults(value);
  if (!validation.valid) throw new Error(`canonical-tournament-results-invalid:${validation.errors.join(",")}`);
  return value;
}

// Pure adapter for the V3 public contract. It emits resolved results only.
export function adaptCanonicalTournamentResultsToPublicV3(results = {}, input = {}) {
  assertCanonicalTournamentResults(results);
  const rows = collection(results.results?.items).map((row) => ({
    resultId: row.resultId,
    teamId: row.teamId,
    teamName: row.teamName,
    participantScope: row.participantScope,
    participantId: row.participantId,
    participantName: row.participantName,
    horseId: row.horseId,
    horseName: row.horseName,
    charreadaId: row.charreadaId,
    competitionId: row.competitionId,
    competitionName: row.competitionName,
    phase: row.phaseId || "",
    phaseName: row.phaseName,
    charreadaName: row.charreadaName,
    columns: toSheetColumns(row.suertes),
    penalties: row.penalties,
    subtotal: row.subtotal,
    total: row.total,
    status: row.status,
    position: null
  }));
  const standings = collection(results.standings?.items)
    .map((item) => ({
      rankingId: item.rankingId,
      resultId: collection(item.resultIds).length === 1 ? item.resultIds[0] : "",
      resultIds: collection(item.resultIds),
      position: item.position,
      scopeType: item.scopeType,
      competitionId: item.competitionId,
      competitionName: item.competitionName,
      charreadaId: item.charreadaId || "",
      participantScope: item.participantScope,
      teamId: item.teamId,
      teamName: item.teamName,
      participantId: item.participantId,
      participantName: item.participantName,
      horseId: item.horseId,
      horseName: item.horseName,
      total: item.total,
      classification: item.totalStatus,
      status: item.positionStatus,
      phase: item.phaseId || "",
      phaseName: item.phaseName,
      tieBreakLabel: ""
    }))
    .filter((item) => item.resultIds.length > 0);
  return {
    tournamentId: results.tournamentId,
    sourceRevision: results.sourceRevision,
    projectionRevision: Math.max(1, integer(input.projectionRevision || 1)),
    generatedAt: iso(input.generatedAt || results.generatedAt),
    lifecycle: { status: text(input.lifecycle?.status || "PRE_EVENT").toUpperCase() },
    tournament: { id: results.tournamentId, ...record(input.tournament) },
    branding: record(input.branding),
    modules: collection(input.modules),
    sponsors: collection(input.sponsors),
    program: { items: collection(input.program?.items) },
    live: record(input.live),
    results: { teams: rows },
    standings: { items: standings },
    sheet: { competitions: collection(results.sheet?.competitions).map((competition) => ({
      competitionId: competition.competitionId,
      name: competition.name,
      charreadaId: competition.charreadaId,
      charreadaName: competition.charreadaName,
      phase: competition.phaseId,
      phaseName: competition.phaseName,
      rows: competition.rows
    })) },
    timeline: { items: collection(input.timeline?.items) },
    statistics: { status: text(input.statistics?.status || "READY").toUpperCase(), items: collection(input.statistics?.items) }
  };
}

function resolveCanonicalOfficialResults(source, tournamentId) {
  if (source.canonicalOfficialResults?.currentRecords) return {
    contractVersion: source.canonicalOfficialResults.contractVersion || "1.0.0",
    currentRecords: collection(source.canonicalOfficialResults.currentRecords),
    sourceRecordCount: integer(source.canonicalOfficialResults.sourceRecordCount),
    duplicateHeadsResolved: integer(source.canonicalOfficialResults.duplicateHeadsResolved)
  };
  return buildCanonicalOfficialResults({
    publishedScores: source.publishedScores || source.officialScores,
    officialScoreLedger: source.officialScoreLedger,
    tournamentId
  });
}

function buildTeamCharreadaResults({ tournamentId, records, charreadas, teams, participants, horses, source }) {
  const rows = new Map();
  for (const item of records) {
    const identity = recordIdentity(item, tournamentId);
    if (!identity.tournamentId || identity.tournamentId !== tournamentId || !identity.charreadaId || !identity.entityId || !identity.suerteId) continue;
    const charreada = charreadas.find((entry) => entry.charreadaId === identity.charreadaId) || {};
    const key = [identity.competitionId || charreada.competitionId || "competition", identity.phaseId || charreada.phaseId || "single", identity.charreadaId, identity.participantScope, identity.entityId].join("|");
    if (!rows.has(key)) rows.set(key, createResultRow(identity, charreada, teams, participants, horses));
    const row = rows.get(key);
    const sport = row.suertes[identity.suerteId] || createSportResult(identity.suerteId);
    const officialValue = getOfficialRecordValue(item);
    sport.total += officialValue;
    sport.recordIds.push(id(item.id));
    sport.attemptCount += 1;
    sport.status = "OFFICIAL";
    sport.penalties += recordBadPoints(item);
    row.suertes[identity.suerteId] = sport;
    row.sourceRevision = Math.max(row.sourceRevision, integer(item.revision));
    row.recordIds.push(id(item.id));
  }
  const items = [...rows.values()].map((row) => finalizeResultRow(row, records, source)).sort(compareResultRows);
  return { status: items.length ? "READY" : "EMPTY", items };
}

function createResultRow(identity, charreada, teams, participants, horses) {
  const team = teams.find((item) => item.teamId === identity.teamId) || {};
  const participant = participants.find((item) => item.participantId === identity.participantId) || {};
  const horse = horses.find((item) => item.horseId === participant.horseId) || {};
  return {
    resultId: stableId("result", [identity.competitionId, identity.phaseId, identity.charreadaId, identity.participantScope, identity.entityId]),
    tournamentId: identity.tournamentId,
    competitionId: identity.competitionId || charreada.competitionId || "competition",
    competitionName: charreada.competitionName || "",
    phaseId: identity.phaseId || charreada.phaseId || "",
    phaseName: charreada.phaseName || "",
    charreadaId: identity.charreadaId,
    charreadaName: charreada.name || "",
    teamId: identity.participantScope === "team" ? identity.teamId : "",
    teamName: identity.participantScope === "team" ? identity.teamName || team.teamName || "" : "",
    participantScope: identity.participantScope,
    participantId: identity.participantId,
    participantName: participant.participantName || identity.participantName || "",
    horseId: identity.participantScope === "individual" ? participant.horseId || "" : "",
    horseName: identity.participantScope === "individual" ? horse.horseName || "" : "",
    suertes: {},
    subtotal: 0,
    penalties: 0,
    adjustment: 0,
    total: 0,
    status: "NOT_STARTED",
    sourceRevision: 0,
    recordIds: []
  };
}

function createSportResult(suerteId) {
  return { suerteId, total: 0, penalties: 0, attemptCount: 0, recordIds: [], status: "NOT_STARTED" };
}

function finalizeResultRow(row, currentRecords, source) {
  row.suertes = Object.fromEntries(Object.entries(row.suertes).sort(([left], [right]) => left.localeCompare(right)));
  row.subtotal = Object.values(row.suertes).reduce((sum, sport) => sum + sport.total, 0);
  row.penalties = Object.values(row.suertes).reduce((sum, sport) => sum + sport.penalties, 0);
  const totals = row.participantScope === "team"
    ? getCanonicalOfficialTeamTotals({ currentRecords, charreadas: source.charreadas }, {
      tournamentId: row.tournamentId,
      charreadaId: row.charreadaId,
      teamId: row.teamId
    })
    : { hasOfficialRecords: false, total: row.subtotal };
  const canonicalTotal = totals.hasOfficialRecords
    ? totals.total
    : row.subtotal + (row.participantScope === "team" ? resolveAdjustment(source.charreadas, row.charreadaId, row.teamId) : 0);
  row.adjustment = canonicalTotal - row.subtotal;
  row.total = canonicalTotal;
  row.status = row.recordIds.length ? "OFFICIAL" : "NOT_STARTED";
  return row;
}

function buildStandings(resultRows) {
  const rankingRows = resultRows.map((row) => ({
    resultId: row.resultId,
    teamId: row.teamId,
    teamName: row.teamName,
    participantId: row.participantId,
    participantName: row.participantName,
    horseId: row.horseId,
    horseName: row.horseName,
    competitionId: row.competitionId,
    phaseId: row.phaseId || null,
    phaseName: row.phaseName,
    charreadaId: row.charreadaId,
    participantScope: row.participantScope,
    officialTotal: row.total,
    totalStatus: row.status === "FINAL" ? "final" : "partial",
    resultStatus: row.status === "NOT_STARTED" ? "draft" : "published",
    sourceRevision: row.sourceRevision,
    publishedAt: ""
  }));
  return { status: rankingRows.length ? "READY" : "EMPTY", items: buildOfficialRankingItems(rankingRows) };
}

function buildSheet(resultRows) {
  const groups = new Map();
  for (const row of resultRows) {
    const key = [row.competitionId, row.phaseId, row.charreadaId].join("|");
    if (!groups.has(key)) groups.set(key, {
      competitionId: row.competitionId,
      name: row.competitionName,
      charreadaId: row.charreadaId,
      charreadaName: row.charreadaName || "",
      phaseId: row.phaseId || "",
      phaseName: row.phaseName || "",
      rows: []
    });
    groups.get(key).rows.push({ resultId: row.resultId, teamId: row.teamId, teamName: row.teamName, participantId: row.participantId, participantName: row.participantName, horseId: row.horseId, horseName: row.horseName, total: row.total, columns: toSheetColumns(row.suertes) });
  }
  return { status: groups.size ? "READY" : "EMPTY", competitions: [...groups.values()].map((entry) => ({ ...entry, rows: entry.rows.sort(compareResultRows) })).sort((a, b) => `${a.competitionId}|${a.phaseId}|${a.charreadaId}`.localeCompare(`${b.competitionId}|${b.phaseId}|${b.charreadaId}`)) };
}

function buildTournamentTeams(resultRows, teams) {
  const byId = new Map(teams.map((team) => [team.teamId, { ...team, resultIds: [], total: 0, status: "NOT_STARTED" }]));
  for (const row of resultRows) {
    if (row.participantScope !== "team") continue;
    if (!byId.has(row.teamId)) byId.set(row.teamId, { teamId: row.teamId, teamName: row.teamName, resultIds: [], total: 0, status: "NOT_STARTED" });
    const team = byId.get(row.teamId);
    team.resultIds.push(row.resultId);
    team.total += row.total;
    team.status = "OFFICIAL";
  }
  return [...byId.values()].sort((left, right) => left.teamId.localeCompare(right.teamId));
}

function buildCompetitions(charreadas, results) {
  const values = new Map();
  for (const charreada of charreadas) values.set(charreada.competitionId, { competitionId: charreada.competitionId, name: charreada.competitionName, charreadaIds: [], resultIds: [] });
  for (const row of results) {
    if (!values.has(row.competitionId)) values.set(row.competitionId, { competitionId: row.competitionId, name: row.competitionName, charreadaIds: [], resultIds: [] });
    const competition = values.get(row.competitionId);
    if (!competition.charreadaIds.includes(row.charreadaId)) competition.charreadaIds.push(row.charreadaId);
    competition.resultIds.push(row.resultId);
  }
  return [...values.values()].map((entry) => ({ ...entry, charreadaIds: entry.charreadaIds.sort(), resultIds: entry.resultIds.sort() })).sort((a, b) => a.competitionId.localeCompare(b.competitionId));
}

function buildStatistics(results) {
  return { status: results.length ? "READY" : "EMPTY", items: [{ id: "teams", label: "teams", value: new Set(results.map((row) => row.teamId)).size }, { id: "results", label: "results", value: results.length }] };
}

function resolveTournamentStatus(source, results) {
  if (!results.length) return "NOT_STARTED";
  const status = text(source.status || source.info?.status).toUpperCase();
  if (["FINAL", "FINALIZED", "COMPLETED"].includes(status)) return "FINAL";
  return "IN_PROGRESS";
}

function normalizeCharreadas(value, tournamentId) {
  return collection(value).map((entry) => ({
    charreadaId: id(entry.id || entry.charreadaId), tournamentId: id(entry.tournamentId || tournamentId),
    competitionId: id(entry.competitionId) || "competition", competitionName: text(entry.competitionName || entry.competition || ""),
    phaseId: id(entry.phaseId), phaseName: text(entry.phaseName || entry.phase || ""), name: text(entry.name)
  })).filter((entry) => entry.charreadaId).sort((a, b) => a.charreadaId.localeCompare(b.charreadaId));
}

function normalizeTeams(value, tournamentId) {
  return collection(value).map((entry) => ({ teamId: id(entry.id || entry.teamId), teamName: text(entry.name || entry.teamName), tournamentId: id(entry.tournamentId || tournamentId) })).filter((entry) => entry.teamId).sort((a, b) => a.teamId.localeCompare(b.teamId));
}

function normalizeParticipants(value, tournamentId) {
  return collection(value).map((entry) => ({ participantId: id(entry.id || entry.participantId), participantName: text(entry.participantName || entry.name), horseId: id(entry.horseId), tournamentId: id(entry.tournamentId || tournamentId) })).filter((entry) => entry.participantId).sort((a, b) => a.participantId.localeCompare(b.participantId));
}

function normalizeHorses(value, tournamentId) {
  return collection(value).map((entry) => ({ horseId: id(entry.id || entry.horseId), horseName: text(entry.displayName || entry.name), tournamentId: id(entry.tournamentId || tournamentId) })).filter((entry) => entry.horseId).sort((a, b) => a.horseId.localeCompare(b.horseId));
}

function recordIdentity(item, fallbackTournamentId) {
  const attempt = record(item.breakdown?.attemptV2?.identity);
  const participantId = id(item.participant?.id || item.participantId || attempt.participantId);
  const teamId = id(item.team?.id || item.teamId || attempt.teamId);
  // Keep this mirror aligned with the browser's canonical scope precedence.
  const declaredScope = text(item.participantScope || item.competition?.scope || item.competition?.participantScope || item.competition?.competitionScope || attempt.participantScope).toLowerCase();
  const participantScope = declaredScope === "individual" || (!teamId && participantId) ? "individual" : "team";
  return {
    tournamentId: id(item.tournament?.id || item.tournamentId || attempt.tournamentId || fallbackTournamentId),
    competitionId: id(item.competition?.id || item.competitionId || item.charreada?.competitionId || attempt.competitionId),
    phaseId: id(item.phase?.id || item.phaseId || attempt.phaseId),
    charreadaId: id(item.charreada?.id || item.charreadaId || attempt.charreadaId),
    participantScope,
    entityId: participantScope === "individual" ? participantId : teamId,
    teamId,
    teamName: text(item.team?.name || item.teamName),
    participantId,
    participantName: text(item.participant?.name || item.participantName),
    suerteId: id(item.suerte?.id || item.suerteId || attempt.suerteId)
  };
}

function recordBadPoints(item) {
  const scoring = record(item.breakdown?.attemptV2?.scoring);
  return finiteNumber(scoring.individualBadPoints ?? item.breakdown?.individualBadPoints ?? item.attempt?.infr)
    + finiteNumber(scoring.teamBadPoints ?? item.breakdown?.teamBadPoints ?? item.teamPenalty);
}

function resolveAdjustment(charreadas, charreadaId, teamId) {
  const charreada = collection(charreadas).find((entry) => id(entry.id || entry.charreadaId) === charreadaId);
  return finiteNumber(charreada?.restas?.[teamId]);
}

function toSheetColumns(suertes) { return Object.fromEntries(Object.entries(record(suertes)).map(([suerteId, sport]) => [suerteId, finiteNumber(sport.total)]).sort(([a], [b]) => a.localeCompare(b))); }
function maxRevision(records) { return collection(records).reduce((max, item) => Math.max(max, integer(item.revision)), 0); }
function compareRecordIdentity(left, right) { const a = recordIdentity(left); const b = recordIdentity(right); return [a.charreadaId, a.participantScope, a.entityId, a.suerteId, id(left.id)].join("|").localeCompare([b.charreadaId, b.participantScope, b.entityId, b.suerteId, id(right.id)].join("|")); }
function compareResultRows(left, right) { return `${left.competitionId}|${left.phaseId}|${left.charreadaId}|${left.participantScope}|${left.teamId || left.participantId}`.localeCompare(`${right.competitionId}|${right.phaseId}|${right.charreadaId}|${right.participantScope}|${right.teamId || right.participantId}`); }
function stableId(prefix, parts) { return `${prefix}_${stableHash(parts.join("|"))}`; }
function stableStringify(value) { if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`; if (plain(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function stableHash(value) { let hash = 2166136261; for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
function collection(value) { return Array.isArray(value) ? value.filter(Boolean) : value && typeof value === "object" ? Object.values(value).filter(Boolean) : []; }
function record(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function plain(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function id(value) { const clean = text(value); return /^[A-Za-z0-9._:@/-]{1,300}$/.test(clean) ? clean : ""; }
function text(value) { return value === null || value === undefined ? "" : String(value).trim().slice(0, 1000); }
function integer(value) { const number = Number(value); return Number.isSafeInteger(number) ? number : 0; }
function finiteNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function finite(value) { return Number.isFinite(Number(value)); }
function iso(value) { const clean = text(value); return Number.isFinite(Date.parse(clean)) ? clean : ""; }
