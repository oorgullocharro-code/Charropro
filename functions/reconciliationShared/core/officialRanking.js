const RANKING_SCOPE_TYPES = Object.freeze(["competition", "phase", "charreada"]);

export function buildOfficialRankingItems(resultRows = []) {
  const groups = new Map();

  for (const row of Array.isArray(resultRows) ? resultRows : []) {
    if (!isPublishedResult(row)) continue;
    for (const scope of buildRankingScopes(row)) {
      const entityId = row.participantScope === "individual" ? row.participantId : row.teamId;
      if (!entityId) continue;
      const groupKey = [
        scope.scopeType,
        row.competitionId || "unknown",
        row.categoryId || row.categoryName || "uncategorized",
        scope.phaseId || "all",
        scope.charreadaId || "all",
        row.participantScope || "team",
        entityId
      ].join("|");
      const current = groups.get(groupKey) || createRankingItem(row, scope, groups.size);
      appendResult(current, row);
      groups.set(groupKey, current);
    }
  }

  const byScope = new Map();
  for (const item of groups.values()) {
    finalizeRankingItem(item);
    const scopeKey = [
      item.scopeType,
      item.competitionId,
      item.categoryId || item.categoryName || "uncategorized",
      item.phaseId || "all",
      item.charreadaId || "all",
      item.participantScope
    ].join("|");
    if (!byScope.has(scopeKey)) byScope.set(scopeKey, []);
    byScope.get(scopeKey).push(item);
  }

  const output = [];
  for (const rows of byScope.values()) {
    rows.sort(compareOfficialRankingRows);
    rows.forEach((row, index) => {
      row.position = index + 1;
      row.displayOrder = index + 1;
      output.push(row);
    });
  }

  return output.sort((left, right) => (
    RANKING_SCOPE_TYPES.indexOf(left.scopeType) - RANKING_SCOPE_TYPES.indexOf(right.scopeType) ||
    left.competitionId.localeCompare(right.competitionId, "es") ||
    String(left.categoryName || left.categoryId || "").localeCompare(String(right.categoryName || right.categoryId || ""), "es") ||
    String(left.phaseName || left.phaseId || "").localeCompare(String(right.phaseName || right.phaseId || ""), "es") ||
    String(left.charreadaId || "").localeCompare(String(right.charreadaId || ""), "es") ||
    left.position - right.position
  ));
}

export function compareOfficialRankingRows(left = {}, right = {}) {
  return finite(right.average) - finite(left.average) ||
    finite(right.total) - finite(left.total) ||
    finite(left.negativePoints ?? left.infr) - finite(right.negativePoints ?? right.infr) ||
    finite(right.bestResult) - finite(left.bestResult) ||
    rankingName(left).localeCompare(rankingName(right), "es") ||
    rankingEntityId(left).localeCompare(rankingEntityId(right), "es");
}

export function selectOfficialRanking(items = [], filters = {}) {
  const requestedScope = filters.charreadaId ? "charreada" : filters.phaseId ? "phase" : "competition";
  return (Array.isArray(items) ? items : [])
    .filter((item) => item.scopeType === requestedScope)
    .filter((item) => !filters.competitionId || item.competitionId === filters.competitionId)
    .filter((item) => !filters.categoryId || item.categoryId === filters.categoryId)
    .filter((item) => !filters.phaseId || item.phaseId === filters.phaseId)
    .filter((item) => !filters.charreadaId || item.charreadaId === filters.charreadaId)
    .sort((left, right) => finite(left.position) - finite(right.position) || compareOfficialRankingRows(left, right));
}

function buildRankingScopes(row) {
  const scopes = [{ scopeType: "competition", phaseId: null, phaseName: "", charreadaId: null }];
  if (row.phaseId || row.phaseName) {
    scopes.push({
      scopeType: "phase",
      phaseId: row.phaseId || null,
      phaseName: row.phaseName || "",
      charreadaId: null
    });
  }
  if (row.charreadaId) {
    scopes.push({
      scopeType: "charreada",
      phaseId: row.phaseId || null,
      phaseName: row.phaseName || "",
      charreadaId: row.charreadaId
    });
  }
  return scopes;
}

function createRankingItem(row, scope, sourceOrder) {
  const participantScope = row.participantScope === "individual" ? "individual" : "team";
  const entityId = participantScope === "individual" ? row.participantId : row.teamId;
  return {
    rankingId: stableRankingId([
      scope.scopeType,
      row.competitionId,
      row.categoryId || row.categoryName,
      scope.phaseId,
      scope.charreadaId,
      participantScope,
      entityId
    ].join("|")),
    scopeType: scope.scopeType,
    competitionId: row.competitionId || "",
    competitionType: row.competitionType || "",
    participantScope,
    categoryId: row.categoryId || null,
    categoryName: row.categoryName || "",
    phaseId: scope.phaseId,
    phaseName: scope.phaseName,
    charreadaId: scope.charreadaId,
    teamId: participantScope === "team" ? row.teamId : null,
    teamName: participantScope === "team" ? row.teamName || "" : "",
    participantId: participantScope === "individual" ? row.participantId : null,
    participantName: participantScope === "individual" ? row.participantName || "" : "",
    horseId: participantScope === "individual" ? row.horseId || null : null,
    horseName: participantScope === "individual" ? row.horseName || "" : "",
    resultIds: [],
    charreadaIds: [],
    total: 0,
    average: 0,
    charreadasCount: 0,
    negativePoints: 0,
    bestResult: 0,
    position: 0,
    positionStatus: "provisional",
    totalStatus: "partial",
    sourceRevision: 0,
    updatedAt: "",
    displayOrder: sourceOrder + 1,
    _totals: [],
    _allFinal: true
  };
}

function appendResult(item, row) {
  const total = publishedResultTotal(row);
  item.resultIds.push(row.resultId);
  if (row.charreadaId && !item.charreadaIds.includes(row.charreadaId)) item.charreadaIds.push(row.charreadaId);
  item._totals.push(total);
  item.total += total;
  item.negativePoints += normalizeNegativePoints(row.teamPenaltyTotal);
  item.sourceRevision = Math.max(item.sourceRevision, finite(row.sourceRevision));
  if (String(row.publishedAt || "") > item.updatedAt) item.updatedAt = String(row.publishedAt || "");
  if (row.totalStatus !== "final") item._allFinal = false;
}

function finalizeRankingItem(item) {
  item.charreadasCount = item.charreadaIds.length || (item._totals.length ? 1 : 0);
  item.average = item.charreadasCount ? item.total / item.charreadasCount : 0;
  item.bestResult = item._totals.length ? Math.max(...item._totals) : 0;
  item.totalStatus = item._allFinal ? "final" : "partial";
  item.positionStatus = item._allFinal ? "official" : "provisional";
  delete item._totals;
  delete item._allFinal;
}

function isPublishedResult(row) {
  return row && typeof row === "object" && row.resultStatus !== "draft" && row.resultStatus !== "superseded";
}

function publishedResultTotal(row) {
  for (const value of [row.officialTotal, row.accumulatedTotal, row.subtotal]) {
    if (value !== null && value !== undefined && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

function normalizeNegativePoints(value) {
  const number = finite(value);
  return Math.abs(number);
}

function rankingName(row) {
  return String(row.teamName || row.participantName || row.team?.name || row.name || "");
}

function rankingEntityId(row) {
  return String(row.teamId || row.participantId || row.team?.id || row.rankingId || "");
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stableRankingId(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `ranking_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
