export const CANONICAL_OFFICIAL_RESULTS_VERSION = "1.0.0";

export function buildCanonicalOfficialResults(source = {}) {
  const publishedScores = source.publishedScores || source.officialScores || [];
  const ledgerRegistry = source.officialScoreLedger || {};
  const records = collectOfficialRecords(publishedScores, ledgerRegistry);
  const ledgerActiveIds = new Set(
    values(ledgerRegistry).map((ledger) => cleanId(ledger?.activeRecordId)).filter(Boolean)
  );
  const ledgerRecordIds = new Set(
    values(ledgerRegistry).flatMap((ledger) => Object.keys(record(ledger?.records)))
  );
  const candidates = records.filter((item) => item.draft !== true && item.published !== false).filter((item) => (
    ledgerRecordIds.has(item.id) ? ledgerActiveIds.has(item.id) : isActiveOfficialRecord(item)
  ));
  const grouped = new Map();

  for (const item of candidates) {
    const sportingOpportunityKey = getCanonicalSportingOpportunityKey(item, { tournamentId: source.tournamentId });
    if (!sportingOpportunityKey) continue;
    if (!grouped.has(sportingOpportunityKey)) grouped.set(sportingOpportunityKey, []);
    grouped.get(sportingOpportunityKey).push(item);
  }

  const selections = [...grouped.entries()]
    .map(([sportingOpportunityKey, sourceRecords]) => {
      const ordered = sourceRecords.slice().sort(compareOfficialChronology);
      const current = ordered[ordered.length - 1];
      return {
        sportingOpportunityKey,
        record: current,
        recordId: current.id,
        sourceRecordIds: ordered.map((item) => item.id),
        sourceAttemptKeys: unique(ordered.map((item) => text(item.attemptKey)).filter(Boolean)),
        duplicateHeadsResolved: Math.max(0, ordered.length - 1)
      };
    })
    .sort((left, right) => compareOfficialChronology(left.record, right.record));

  return {
    contractVersion: CANONICAL_OFFICIAL_RESULTS_VERSION,
    currentRecords: selections.map((selection) => selection.record),
    selections,
    sourceRecordCount: records.length,
    activeCandidateCount: candidates.length,
    duplicateHeadsResolved: selections.reduce((sum, selection) => sum + selection.duplicateHeadsResolved, 0)
  };
}

export function getCanonicalSportingOpportunityKey(item = {}, context = {}) {
  const identity = item.breakdown?.attemptV2?.identity || {};
  const opportunity = item.breakdown?.attemptV2?.sportState?.opportunity || {};
  const tournamentId = cleanId(item.tournament?.id || item.tournamentId || identity.tournamentId || context.tournamentId);
  const charreadaId = cleanId(item.charreada?.id || item.charreadaId || identity.charreadaId);
  const teamId = cleanId(item.team?.id || item.teamId || identity.teamId);
  const participantId = cleanId(item.participant?.id || item.participantId || identity.participantId);
  const suerteId = cleanId(item.suerte?.id || item.suerteId || identity.suerteId);
  if (!tournamentId || !charreadaId || (!teamId && !participantId) || !suerteId) return "";

  const competitionId = cleanId(
    item.competition?.id || item.competitionId || item.charreada?.competitionId || identity.competitionId
  ) || "competition";
  const individual = item.competition?.scope === "individual"
    || item.competition?.competitionScope === "individual"
    || item.participantScope === "individual";
  const entityId = individual ? participantId || teamId : teamId;
  const legacyCoordinates = getLegacyAttemptCoordinates(item.attemptKey);
  const sharedOpportunityId = text(
    item.sharedOpportunityId || item.attempt?.sharedOpportunityId || opportunity.sharedOpportunityId
  );
  const opportunityNumber = positiveInteger(
    opportunity.sharedSequenceNumber || opportunity.number || identity.opportunityNumber || item.sharedSequenceNumber,
    Math.max(0, integer(item.attemptIndex, legacyCoordinates.attemptIndex)) + 1
  );
  const parts = [tournamentId, competitionId, charreadaId, entityId, suerteId];

  if (sharedOpportunityId) {
    parts.push(`shared:${sharedOpportunityId}`);
  } else {
    parts.push(`op:${opportunityNumber}`);
    if (suerteId === "colas" || item.suerte?.type === "coleadero") {
      const participantSlot = firstNonNegativeInteger([
        identity.participantSlot,
        item.participantSlot,
        item.coleadorIndex,
        legacyCoordinates.coleadorIndex
      ], 0);
      parts.push(`participant:${participantId || participantSlot}`);
    }
  }
  return parts.join("__");
}

export function getCanonicalOfficialTeamTotals(source = {}, scope = {}) {
  const canonical = source.currentRecords
    ? { currentRecords: source.currentRecords }
    : buildCanonicalOfficialResults(source);
  const tournamentId = cleanId(scope.tournamentId);
  const charreadaId = cleanId(scope.charreadaId);
  const teamId = cleanId(scope.teamId || scope.participantId);
  const currentRecords = canonical.currentRecords.filter((item) => {
    const identity = getOfficialRecordIdentity(item);
    return (!tournamentId || identity.tournamentId === tournamentId)
      && (!charreadaId || identity.charreadaId === charreadaId)
      && (!teamId || identity.teamId === teamId || identity.participantId === teamId);
  });
  const suerteTotals = {};
  let scoreTotal = 0;
  let badPoints = 0;

  for (const item of currentRecords) {
    const identity = getOfficialRecordIdentity(item);
    const value = getOfficialRecordValue(item);
    suerteTotals[identity.suerteId] = (suerteTotals[identity.suerteId] || 0) + value;
    scoreTotal += value;
    badPoints += getOfficialRecordBadPoints(item);
  }

  const adjustment = getCharreadaAdjustment(source.charreadas, charreadaId, teamId);
  if (adjustment < 0) badPoints += Math.abs(adjustment);
  return {
    contractVersion: CANONICAL_OFFICIAL_RESULTS_VERSION,
    hasOfficialRecords: currentRecords.length > 0,
    currentRecords,
    suerteTotals,
    scoreTotal,
    adjustment,
    total: scoreTotal + adjustment,
    badPoints
  };
}

export function getOfficialRecordValue(item = {}) {
  return firstFinite([
    item.breakdown?.attemptV2?.scoring?.teamAdjustedPoints,
    item.breakdown?.teamAdjustedTotal,
    item.attempt?.total,
    item.breakdown?.final,
    item.breakdown?.total,
    item.total,
    item.score,
    item.points
  ], 0);
}

function getOfficialRecordBadPoints(item = {}) {
  const individual = firstFinite([
    item.breakdown?.attemptV2?.scoring?.individualBadPoints,
    item.breakdown?.individualBadPoints,
    item.attempt?.infr
  ], 0);
  const team = firstFinite([
    item.breakdown?.attemptV2?.scoring?.teamBadPoints,
    item.breakdown?.teamPenaltyTotal,
    item.teamPenaltyTotal,
    item.teamPenalty
  ], 0);
  return individual + team;
}

function getOfficialRecordIdentity(item = {}) {
  const identity = item.breakdown?.attemptV2?.identity || {};
  return {
    tournamentId: cleanId(item.tournament?.id || item.tournamentId || identity.tournamentId),
    charreadaId: cleanId(item.charreada?.id || item.charreadaId || identity.charreadaId),
    teamId: cleanId(item.team?.id || item.teamId || identity.teamId),
    participantId: cleanId(item.participant?.id || item.participantId || identity.participantId),
    suerteId: cleanId(item.suerte?.id || item.suerteId || identity.suerteId)
  };
}

function collectOfficialRecords(publishedScores, ledgerRegistry) {
  const all = [];
  appendCollection(all, publishedScores);
  for (const ledger of values(ledgerRegistry)) appendCollection(all, ledger?.records);
  const byId = new Map();
  for (const item of all) {
    const id = cleanId(item?.id);
    if (!id) continue;
    const normalized = { ...item, id };
    const existing = byId.get(id);
    if (!existing || compareOfficialChronology(normalized, existing) >= 0) byId.set(id, normalized);
  }
  return [...byId.values()];
}

function appendCollection(target, collection) {
  if (Array.isArray(collection)) {
    for (const item of collection) if (item && typeof item === "object") target.push(item);
    return;
  }
  for (const item of values(collection)) if (item && typeof item === "object") target.push(item);
}

function compareOfficialChronology(left = {}, right = {}) {
  return officialTimestamp(left) - officialTimestamp(right)
    || integer(left.revision, 0) - integer(right.revision, 0)
    || text(left.id).localeCompare(text(right.id));
}

function officialTimestamp(item = {}) {
  const numeric = Number(item.timestampMs || item.updatedAtMs || item.createdAtMs || 0);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(item.publishedAt || item.updatedAt || item.timestamp || item.createdAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function isActiveOfficialRecord(item = {}) {
  if (item.superseded === true) return false;
  const status = text(item.officialStatus || item.status || "active").toLowerCase();
  return status === "active" || status === "official" || status === "published";
}

function getCharreadaAdjustment(charreadas, charreadaId, teamId) {
  const charreada = values(charreadas).find((item) => cleanId(item?.id || item?.charreadaId) === charreadaId);
  const value = Number(charreada?.restas?.[teamId] || 0);
  return Number.isFinite(value) ? value : 0;
}

function getLegacyAttemptCoordinates(attemptKey) {
  const parts = text(attemptKey).split("__");
  if (parts.length < 6) return { attemptIndex: 0, coleadorIndex: 0 };
  return {
    attemptIndex: Math.max(0, integer(parts[parts.length - 2], 0)),
    coleadorIndex: Math.max(0, integer(parts[parts.length - 1], 0))
  };
}

function firstFinite(candidates, fallback) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function values(value) {
  return value && typeof value === "object" ? Object.values(value).filter(Boolean) : [];
}

function record(value) {
  return value && !Array.isArray(value) && typeof value === "object" ? value : {};
}

function cleanId(value) {
  const clean = text(value);
  return /^[A-Za-z0-9._:@/-]{1,300}$/.test(clean) ? clean : "";
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).slice(0, 500);
}

function integer(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

function positiveInteger(value, fallback) {
  const parsed = integer(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function firstNonNegativeInteger(candidates, fallback) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;
    const parsed = integer(candidate, -1);
    if (parsed >= 0) return parsed;
  }
  return fallback;
}

function unique(items) {
  return [...new Set(items)];
}
