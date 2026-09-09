import { buildCanonicalOfficialResults, getCanonicalOfficialTeamTotals, getOfficialRecordValue } from "./canonicalOfficialResults.js";
import { buildOfficialRankingItems } from "./officialRanking.js";

// Node-safe mirror of the browser builder. It composes only resolved official
// records so the administrative reconciler cannot regain a sporting authority.
export function buildCanonicalTournamentResults(source = {}, options = {}) {
  const tournament = object(source.tournament || source.info || source);
  const tournamentId = id(options.tournamentId || tournament.id || source.tournamentId);
  const canonical = source.canonicalOfficialResults?.currentRecords
    ? source.canonicalOfficialResults
    : buildCanonicalOfficialResults({ publishedScores: source.publishedScores || source.officialScores, officialScoreLedger: source.officialScoreLedger, tournamentId });
  const charreadas = collection(source.charreadas);
  const teams = collection(source.teams);
  const rows = new Map();
  for (const record of collection(canonical.currentRecords)) {
    const identity = recordIdentity(record, tournamentId);
    if (identity.tournamentId !== tournamentId || !identity.charreadaId || !identity.entityId || !identity.suerteId) continue;
    const key = [identity.competitionId || "competition", identity.phaseId || "single", identity.charreadaId, identity.participantScope, identity.entityId].join("|");
    if (!rows.has(key)) rows.set(key, { resultId: stableId("result", [identity.competitionId, identity.phaseId, identity.charreadaId, identity.participantScope, identity.entityId]), tournamentId, competitionId: identity.competitionId || "competition", competitionName: charreadaName(charreadas, identity.charreadaId), phaseId: identity.phaseId || "", phaseName: phaseName(charreadas, identity.charreadaId), charreadaId: identity.charreadaId, charreadaName: charreadaLabel(charreadas, identity.charreadaId), participantScope: identity.participantScope, teamId: identity.teamId, teamName: identity.teamName || teamName(teams, identity.teamId), participantId: identity.participantId, participantName: identity.participantName, suertes: {}, recordIds: [], sourceRevision: 0 });
    const row = rows.get(key);
    const sport = row.suertes[identity.suerteId] || { suerteId: identity.suerteId, total: 0, penalties: 0, attemptCount: 0, recordIds: [], status: "OFFICIAL" };
    sport.total += getOfficialRecordValue(record);
    sport.penalties += badPoints(record);
    sport.attemptCount += 1;
    sport.recordIds.push(id(record.id));
    row.suertes[identity.suerteId] = sport;
    row.recordIds.push(id(record.id));
    row.sourceRevision = Math.max(row.sourceRevision, integer(record.revision));
  }
  const items = [...rows.values()].map((row) => {
    row.suertes = Object.fromEntries(Object.entries(row.suertes).sort(([a], [b]) => a.localeCompare(b)));
    row.subtotal = Object.values(row.suertes).reduce((sum, item) => sum + item.total, 0);
    row.penalties = Object.values(row.suertes).reduce((sum, item) => sum + item.penalties, 0);
    const total = row.participantScope === "team"
      ? getCanonicalOfficialTeamTotals({ currentRecords: canonical.currentRecords, charreadas }, { tournamentId, charreadaId: row.charreadaId, teamId: row.teamId })
      : { total: row.subtotal };
    row.adjustment = total.total - row.subtotal;
    row.total = total.total;
    row.status = "OFFICIAL";
    return row;
  }).sort((a, b) => `${a.competitionId}|${a.phaseId}|${a.charreadaId}|${a.teamId}`.localeCompare(`${b.competitionId}|${b.phaseId}|${b.charreadaId}|${b.teamId}`));
  const standings = buildOfficialRankingItems(items.map((row) => ({ resultId: row.resultId, teamId: row.teamId, teamName: row.teamName, participantId: row.participantId, participantName: row.participantName, competitionId: row.competitionId, competitionName: row.competitionName, phaseId: row.phaseId || null, phaseName: row.phaseName, charreadaId: row.charreadaId, participantScope: row.participantScope, officialTotal: row.total, resultStatus: "published", totalStatus: "partial", sourceRevision: row.sourceRevision, publishedAt: "" })));
  const byCompetition = new Map();
  for (const row of items) {
    const key = [row.competitionId, row.phaseId, row.charreadaId].join("|");
    if (!byCompetition.has(key)) byCompetition.set(key, { competitionId: row.competitionId, name: row.competitionName, charreadaId: row.charreadaId, charreadaName: row.charreadaName || "", phaseId: row.phaseId || "", phaseName: row.phaseName || "", rows: [] });
    byCompetition.get(key).rows.push({ resultId: row.resultId, teamId: row.teamId, teamName: row.teamName, participantId: row.participantId, participantName: row.participantName, total: row.total, columns: Object.fromEntries(Object.entries(row.suertes).map(([key, value]) => [key, value.total])) });
  }
  return { schemaVersion: "1.0.0", tournamentId, sourceRevision: Math.max(1, integer(source.sourceRevision) || Math.max(0, ...items.map((item) => item.sourceRevision))), generatedAt: String(source.generatedAt || options.generatedAt || ""), status: items.length ? "IN_PROGRESS" : "NOT_STARTED", results: { status: items.length ? "READY" : "EMPTY", items }, standings: { status: standings.length ? "READY" : "EMPTY", items: standings }, sheet: { status: byCompetition.size ? "READY" : "EMPTY", competitions: [...byCompetition.values()] }, statistics: { status: items.length ? "READY" : "EMPTY", items: [{ id: "teams", label: "teams", value: new Set(items.map((item) => item.teamId)).size }, { id: "results", label: "results", value: items.length }] }, provenance: { canonicalOfficialResultsVersion: canonical.contractVersion || "1.0.0", selectedOfficialAttempts: false, readsLedgerDirectly: false, duplicateHeadsResolved: integer(canonical.duplicateHeadsResolved) } };
}

function recordIdentity(record, fallbackTournamentId) { const identity = object(record.breakdown?.attemptV2?.identity); const participantId = id(record.participant?.id || record.participantId || identity.participantId); const teamId = id(record.team?.id || record.teamId || identity.teamId); const declaredScope = text(record.participantScope || record.competition?.scope || record.competition?.participantScope || identity.participantScope).toLowerCase(); const participantScope = declaredScope === "individual" || (!teamId && participantId) ? "individual" : "team"; return { tournamentId: id(record.tournament?.id || record.tournamentId || identity.tournamentId || fallbackTournamentId), competitionId: id(record.competition?.id || record.competitionId || record.charreada?.competitionId || identity.competitionId), phaseId: id(record.phase?.id || record.phaseId || identity.phaseId), charreadaId: id(record.charreada?.id || record.charreadaId || identity.charreadaId), participantScope, entityId: participantScope === "individual" ? participantId : teamId, teamId, teamName: text(record.team?.name || record.teamName), participantId, participantName: text(record.participant?.name || record.participantName), suerteId: id(record.suerte?.id || record.suerteId || identity.suerteId) }; }
function badPoints(record) { const scoring = object(record.breakdown?.attemptV2?.scoring); return number(scoring.individualBadPoints ?? record.breakdown?.individualBadPoints) + number(scoring.teamBadPoints ?? record.breakdown?.teamBadPoints ?? record.teamPenalty); }
function teamName(teams, teamId) { return text(collection(teams).find((item) => id(item.id || item.teamId) === teamId)?.name); }
function charreadaName(charreadas, charreadaId) { const item = collection(charreadas).find((entry) => id(entry.id || entry.charreadaId) === charreadaId); return text(item?.competitionName || item?.competition); }
function charreadaLabel(charreadas, charreadaId) { const item = collection(charreadas).find((entry) => id(entry.id || entry.charreadaId) === charreadaId); return text(item?.name || item?.nombre); }
function phaseName(charreadas, charreadaId) { const item = collection(charreadas).find((entry) => id(entry.id || entry.charreadaId) === charreadaId); return text(item?.phaseName || item?.phase); }
function stableId(prefix, parts) { let hash = 2166136261; for (const char of parts.join("|")) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return `${prefix}_${(hash >>> 0).toString(16).padStart(8, "0")}`; }
function collection(value) { return Array.isArray(value) ? value.filter(Boolean) : value && typeof value === "object" ? Object.values(value).filter(Boolean) : []; }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function id(value) { const clean = text(value); return /^[A-Za-z0-9._:@/-]{1,180}$/.test(clean) ? clean : ""; }
function text(value) { return value === undefined || value === null ? "" : String(value).trim(); }
function integer(value) { const number = Number(value); return Number.isSafeInteger(number) ? number : 0; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
