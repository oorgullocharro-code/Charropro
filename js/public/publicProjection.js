import {
  buildPublicContentSignature,
  PUBLIC_PROJECTION_SCHEMA_VERSION,
  PUBLIC_PROJECTION_SECTIONS,
  sanitizePublicBoolean,
  sanitizePublicId,
  sanitizePublicNumber,
  sanitizePublicProjectionValue,
  sanitizePublicString,
  validatePublicProjection
} from "./publicProjectionSchema.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import {
  buildPublicLiveFeed,
  mergePublicLiveFeeds
} from "./publicLiveFeed.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import {
  getCompetitionType,
  getCompetitionTypeFromTournamentType
} from "../data/competitionTypes.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";

export const PUBLIC_PROJECTION_VERSION = "2.0.0";
export const PUBLIC_SCORE_COLUMNS = Object.freeze({
  cala: ["CC"],
  piales: ["P"],
  colas: ["C"],
  toro: ["JT"],
  terna: ["LC", "PR"],
  lazo: ["LC"],
  pial_ruedo: ["PR"],
  yegua: ["JY"],
  manganas_pie: ["MP"],
  manganas_caballo: ["MC"],
  paso: ["PM"]
});

const SECTION_VOLATILE_FIELDS = new Set(["revision", "generatedAt", "generatedAtMs", "updatedAt"]);
const MAX_RESULT_ROWS = 1500;
const MAX_PROGRAM_ITEMS = 500;

export function buildPublicProjection(source = {}, options = {}) {
  const tournament = isRecord(source.tournament) ? source.tournament : source;
  const liveCurrent = isRecord(source.liveCurrent) ? source.liveCurrent : {};
  const nowMs = finiteTimestamp(options.nowMs) || Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const tournamentId = id(
    options.tournamentId ||
    tournament.info?.id ||
    tournament.meta?.tournamentId ||
    liveCurrent.tournament?.id
  );
  const teams = collection(tournament.teams).map((team, index) => normalizeTeam(team, index));
  const charreadas = collection(tournament.charreadas)
    .slice(0, MAX_PROGRAM_ITEMS)
    .map((charreada, index) => normalizeCharreada(charreada, tournament, teams, index));
  const active = resolveActiveContext(tournament, liveCurrent, charreadas);
  const published = normalizePublishedScores(tournament.publishedScores, {
    tournamentId,
    charreadas,
    teams
  });
  const results = buildResults(published, charreadas);
  const competitions = buildCompetitions(charreadas, results.items, tournament);
  const sourceUpdatedAt = resolveSourceUpdatedAt(tournament, liveCurrent, published, charreadas);
  const status = resolveProjectionStatus(tournament, active);
  const turn = normalizeOfficialTurn(liveCurrent.turn);
  const programItems = charreadas.map((charreada) => buildProgramItem(charreada, {
    active,
    results: results.items
  }));
  const liveStandings = buildLiveStandings(results.items, active, turn);

  const candidate = {
    schemaVersion: PUBLIC_PROJECTION_SCHEMA_VERSION,
    projectionRevision: 0,
    generatedAt: nowIso,
    generatedAtMs: nowMs,
    sourceUpdatedAt,
    status,
    metadata: {
      revision: 0,
      status: tournamentId ? "ready" : "unavailable",
      tournamentId,
      name: text(tournament.info?.nombre || tournament.info?.name || tournament.name, 180),
      slug: text(tournament.info?.slug || tournament.slug, 120) || null,
      schemaVersion: PUBLIC_PROJECTION_SCHEMA_VERSION,
      visibility: normalizeVisibility(tournament.info?.visibility || tournament.settings?.publicVisibility),
      timezone: text(tournament.info?.timezone || tournament.settings?.timezone || "America/Mexico_City", 80),
      generatedAt: nowIso,
      generatedAtMs: nowMs,
      sourceUpdatedAt
    },
    overview: {
      revision: 0,
      status,
      name: text(tournament.info?.nombre || tournament.info?.name || tournament.name, 180),
      venue: text(tournament.info?.sede || tournament.info?.venue, 180),
      startDate: dateText(tournament.info?.fechaInicio || tournament.info?.startDate),
      endDate: dateText(tournament.info?.fechaFin || tournament.info?.endDate),
      activeCompetitionId: active.competitionId,
      activeCharreadaId: active.charreadaId,
      activeCompetitionName: active.competitionName,
      activeCharreadaName: active.charreadaName,
      turn: buildTurnSummary(turn),
      contextConsistency: active.consistency,
      updatedAt: sourceUpdatedAt
    },
    program: {
      revision: 0,
      status: programItems.length ? "ready" : "empty",
      items: programItems
    },
    live: {
      revision: 0,
      status: turn.status === "available" || active.charreadaId ? "live" : "unavailable",
      competitionId: active.competitionId,
      charreadaId: active.charreadaId,
      turn,
      timer: normalizePublicTimer(liveCurrent.timer),
      currentResult: normalizeCurrentResult(liveCurrent.published, published),
      standings: liveStandings,
      updatedAt: dateText(liveCurrent.timestamp || liveCurrent.updatedAt || sourceUpdatedAt)
    },
    liveFeed: buildPublicLiveFeed(tournament, {
      active,
      turn,
      liveCurrent,
      sourceUpdatedAt,
      status
    }),
    competitions: {
      revision: 0,
      status: competitions.length ? "ready" : "empty",
      items: competitions
    },
    results,
    rankings: unavailableSection(),
    statistics: unavailableSection(),
    search: unavailableSection()
  };

  return sanitizePublicProjectionValue(candidate);
}

export function reconcilePublicProjection(previous, candidate, options = {}) {
  const previousIsV2 = Number(previous?.schemaVersion) === PUBLIC_PROJECTION_SCHEMA_VERSION;
  const mergedCandidate = previousIsV2
    ? {
      ...candidate,
      liveFeed: mergePublicLiveFeeds(previous.liveFeed, candidate?.liveFeed)
    }
    : candidate;
  const cleanCandidate = sanitizePublicProjectionValue(mergedCandidate);
  const nowMs = finiteTimestamp(options.nowMs) || Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (previousIsV2 && isSourceRegression(previous.sourceUpdatedAt, cleanCandidate.sourceUpdatedAt)) {
    return {
      ok: false,
      changed: false,
      reason: "source-revision-regression",
      projection: sanitizePublicProjectionValue(previous),
      changedSections: []
    };
  }
  if (
    previousIsV2 &&
    finiteTimestamp(previous.sourceUpdatedAt) === finiteTimestamp(cleanCandidate.sourceUpdatedAt) &&
    Number(previous.generatedAtMs || 0) > Number(cleanCandidate.generatedAtMs || 0) &&
    getPublicProjectionSignature(previous) !== getPublicProjectionSignature(cleanCandidate)
  ) {
    return {
      ok: false,
      changed: false,
      reason: "source-revision-inconsistent",
      projection: sanitizePublicProjectionValue(previous),
      changedSections: []
    };
  }

  const changedSections = [];
  const next = {
    ...cleanCandidate,
    schemaVersion: PUBLIC_PROJECTION_SCHEMA_VERSION,
    projectionRevision: previousIsV2 ? previous.projectionRevision : 0,
    generatedAt: previousIsV2 ? previous.generatedAt : nowIso,
    generatedAtMs: previousIsV2 ? previous.generatedAtMs : nowMs
  };

  for (const sectionName of PUBLIC_PROJECTION_SECTIONS) {
    const previousSection = previousIsV2 ? previous[sectionName] : null;
    const nextSection = cleanCandidate[sectionName];
    const same = previousSection && sectionSignature(previousSection) === sectionSignature(nextSection);
    const minimum = ["rankings", "statistics", "search"].includes(sectionName) ? 0 : 1;
    const previousRevision = Number.isSafeInteger(previousSection?.revision) ? previousSection.revision : 0;
    const revision = same ? previousRevision : Math.max(minimum, previousRevision + 1);
    next[sectionName] = { ...nextSection, revision };
    if (!same) changedSections.push(sectionName);
  }

  if (previousIsV2 && changedSections.length === 0) {
    return {
      ok: true,
      changed: false,
      reason: "unchanged",
      projection: sanitizePublicProjectionValue(previous),
      changedSections: []
    };
  }

  next.projectionRevision = previousIsV2 ? previous.projectionRevision + 1 : 1;
  next.generatedAt = nowIso;
  next.generatedAtMs = nowMs;
  next.metadata = {
    ...next.metadata,
    generatedAt: nowIso,
    generatedAtMs: nowMs
  };
  const projection = sanitizePublicProjectionValue(next);
  const validation = validatePublicProjection(projection);
  if (!validation.valid) {
    return {
      ok: false,
      changed: false,
      reason: "invalid-public-projection",
      errors: validation.errors,
      projection: previousIsV2 ? sanitizePublicProjectionValue(previous) : null,
      changedSections
    };
  }
  return { ok: true, changed: true, reason: "updated", projection, changedSections };
}

export function getPublicProjectionSignature(projection) {
  const clean = sanitizePublicProjectionValue(projection);
  const stable = { ...clean };
  delete stable.projectionRevision;
  delete stable.generatedAt;
  delete stable.generatedAtMs;
  for (const sectionName of PUBLIC_PROJECTION_SECTIONS) {
    if (!isRecord(stable[sectionName])) continue;
    stable[sectionName] = stripVolatile(stable[sectionName]);
  }
  return buildPublicContentSignature(stable);
}

function normalizeTeam(team, index) {
  return {
    id: id(team?.id || team?.teamId),
    name: text(team?.name || team?.nombre || team?.teamName, 180),
    shortName: text(team?.shortName || team?.teamShortName || team?.abbreviation || team?.abreviatura, 80),
    logoUrl: publicUrl(team?.logoUrl || team?.logo),
    region: text(team?.region || team?.state || team?.estado, 120),
    status: normalizeStatus(team?.status || team?.estadoParticipacion || "ready"),
    categoryId: id(team?.categoryId),
    categoryName: text(team?.categoryName || team?.category || team?.categoria, 120),
    order: finiteInteger(team?.order ?? team?.orden, index + 1),
    sourceIndex: index
  };
}

function normalizeCharreada(charreada, tournament, teams, index) {
  const legacyType = getCompetitionTypeFromTournamentType(tournament.info?.type || tournament.type || "completo");
  const config = getCompetitionType(charreada.competitionType || charreada.competitionId || legacyType.type);
  const competitionType = id(charreada.competitionType || config.type || legacyType.type) || "equipos_completo";
  const explicitCompetitionId = id(charreada.competitionId);
  const categoryId = id(charreada.categoryId);
  const categoryName = text(
    charreada.categoryName ||
    charreada.category ||
    charreada.categoria ||
    categoryId,
    120
  );
  const publishedPhaseName = text(charreada.phaseName || charreada.phase || charreada.fase, 120);
  const phaseId = id(charreada.phaseId) || (publishedPhaseName ? buildPublicPhaseId(publishedPhaseName) : null);
  const phaseName = publishedPhaseName || text(phaseId, 120) || "Ronda única";
  const competitionName = text(charreada.competitionName || config.label || charreada.tipoCompetencia, 160);
  const derivedSeed = [
    competitionType,
    legacyIdentityPart(categoryId || categoryName || "general"),
    legacyIdentityPart(competitionName || "competencia")
  ].join("|");
  const competitionId = explicitCompetitionId || `legacy_${buildPublicContentSignature(derivedSeed).slice(4)}`;
  const participantRecords = collection(charreada.individualParticipants);
  const teamIds = collection(charreada.teamIds || charreada.equipos).map((entry) => id(entry?.id || entry?.teamId || entry)).filter(Boolean);
  const competitionScope = charreada.competitionScope || config.scope || "team";
  const participants = (competitionScope === "individual"
    ? participantRecords.map((entry, participantIndex) => ({
      id: id(entry.id || entry.participantId),
      type: "individual",
      order: finiteInteger(entry.order ?? entry.orden, participantIndex + 1),
      name: text(entry.name || entry.participantName, 180),
      shortName: text(entry.shortName || entry.abbreviation, 80),
      logoUrl: publicUrl(entry.logoUrl || entry.logo),
      region: text(entry.region || entry.state || entry.estado, 120),
      status: normalizeStatus(entry.status || entry.estadoParticipacion || "ready")
    }))
    : teamIds.map((teamId) => {
      const team = teams.find((candidate) => candidate.id === teamId);
      return {
        id: teamId,
        type: "team",
        order: team?.order ?? null,
        name: team?.name || "",
        shortName: team?.shortName || "",
        logoUrl: team?.logoUrl || "",
        region: team?.region || "",
        status: team?.status || "ready"
      };
    })).sort((left, right) => (
      (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER)
    ));
  return {
    scheduleId: id(charreada.scheduleId || charreada.id || charreada.charreadaId) || `schedule_${index + 1}`,
    charreadaId: id(charreada.id || charreada.charreadaId) || null,
    name: text(charreada.nombre || charreada.name || `Jornada ${index + 1}`, 180),
    competitionId,
    competitionType,
    competitionScope,
    competitionName,
    categoryId,
    categoryName,
    phaseId,
    phaseName,
    scheduledDate: dateText(charreada.fecha || charreada.date || charreada.scheduledDate),
    scheduledTime: text(charreada.hora || charreada.time || charreada.scheduledTime, 40),
    endTime: text(charreada.endTime || charreada.scheduledEndTime || charreada.horaTermino, 40),
    order: finiteInteger(charreada.order ?? charreada.orden, index + 1),
    status: normalizeStatus(charreada.operationalStatus || charreada.status || charreada.estado || "programada"),
    participants,
    shortTitle: text(charreada.shortTitle || charreada.shortName || charreada.nombreCorto, 100),
    venueId: id(charreada.venueId || charreada.lienzoId),
    venueName: text(charreada.venue || charreada.sede || charreada.lienzo, 180),
    publicNotes: text(charreada.publicNotes || charreada.notasPublicas, 500),
    revision: Math.max(0, finiteInteger(charreada.revision, 0)),
    suerteIds: normalizeSuerteIds(charreada.suerteIds, config.suerteIds),
    legacy: !explicitCompetitionId || !id(charreada.id || charreada.charreadaId),
    sourceIndex: index,
    updatedAt: dateText(charreada.updatedAt || charreada.updatedAtMs)
  };
}

function normalizePublishedScores(value, context) {
  const latestByAttempt = new Map();
  for (const [sourceKey, record] of keyedCollection(value)) {
    if (!isRecord(record) || record.draft === true || record.published === false) continue;
    if (record.superseded === true || record.status === "superseded" || record.resultStatus === "superseded") continue;
    const normalized = normalizePublishedScore(record, sourceKey, context);
    if (!normalized) continue;
    const key = normalized.attemptKey || normalized.resultId;
    const current = latestByAttempt.get(key);
    if (!current || comparePublishedRecord(normalized, current) > 0) latestByAttempt.set(key, normalized);
  }
  return [...latestByAttempt.values()].sort((left, right) => (
    left.publishedAt.localeCompare(right.publishedAt) ||
    left.resultId.localeCompare(right.resultId)
  ));
}

function normalizePublishedScore(record, sourceKey, context) {
  const charreadaId = id(record.charreadaId || record.charreada?.id);
  const charreada = context.charreadas.find((item) => item.charreadaId === charreadaId) || null;
  const teamId = id(record.teamId || record.team?.id);
  const team = context.teams.find((item) => item.id === teamId) || null;
  const competitionType = id(record.competitionType || record.competition?.type || charreada?.competitionType) || "equipos_completo";
  const competitionConfig = getCompetitionType(competitionType);
  const competitionId = id(record.competitionId || record.competition?.id || charreada?.competitionId) || null;
  const participantScope = record.participantScope === "individual" || competitionConfig.scope === "individual" ? "individual" : "team";
  const participantId = participantScope === "individual"
    ? id(record.participantId || record.participant?.id || record.charro?.id || record.team?.participantId || record.team?.id)
    : id(record.participantId || record.participant?.id || record.charro?.id);
  const suerteId = normalizeSuerteId(record.suerteId || record.suerte?.id || record.suerte?.key || record.suerte);
  if (!suerteId || (!teamId && !participantId)) return null;
  const officialAttemptTotal = firstFinite([
    record.attempt?.total,
    record.attempt?.breakdown?.final,
    record.breakdown?.final,
    record.breakdown?.total,
    record.total,
    record.score,
    record.points
  ]);
  if (officialAttemptTotal === null) return null;
  const revision = Math.max(0, finiteInteger(record.revision || record.correctionRevision, 0));
  const attemptIndex = Math.max(0, finiteInteger(record.attemptIndex, 0));
  const coleadorIndex = Math.max(0, finiteInteger(record.coleadorIndex, 0));
  const entityId = participantScope === "individual" ? participantId : teamId;
  const attemptKey = text(record.attemptKey, 300) || [
    context.tournamentId,
    charreadaId,
    entityId,
    suerteId,
    attemptIndex,
    coleadorIndex
  ].join(":");
  return {
    resultId: id(record.id || sourceKey) || `result_${buildPublicContentSignature(attemptKey).slice(4)}`,
    attemptKey,
    tournamentId: id(record.tournamentId || record.tournament?.id || context.tournamentId),
    teamId: participantScope === "team" ? teamId : null,
    teamName: participantScope === "team" ? text(record.teamName || record.team?.name || team?.name, 180) : "",
    participantId: participantScope === "individual" ? participantId : null,
    participantName: participantScope === "individual"
      ? text(
        record.participantName ||
        record.participant?.name ||
        record.charro?.name ||
        record.charroName ||
        record.team?.participantName ||
        record.team?.name ||
        (typeof record.charro === "string" ? record.charro : ""),
        180
      )
      : "",
    horseId: participantScope === "individual" ? id(record.horseId || record.horse?.id || record.team?.horseId) : null,
    horseName: participantScope === "individual" ? text(record.horseName || record.horse?.name || record.team?.horseName, 180) : "",
    categoryId: id(record.categoryId || record.category?.id || charreada?.categoryId),
    categoryName: text(record.categoryName || record.category || record.categoria || charreada?.categoryName, 120),
    competitionId,
    competitionType,
    competitionScope: participantScope,
    phaseId: id(record.phaseId || record.phase?.id || charreada?.phaseId),
    phaseName: text(record.phaseName || record.phase || record.fase || charreada?.phaseName, 120),
    charreadaId,
    suerteId,
    score: officialAttemptTotal,
    teamPenalty: firstFinite([record.teamPenaltyTotal, record.teamPenalty, record.penalty]),
    explicitOfficialTotal: firstFinite([record.officialTotal, record.resultTotal]),
    officialPosition: Number.isSafeInteger(record.officialPosition) && record.officialPosition > 0 ? record.officialPosition : null,
    publishedAt: dateText(record.publishedAt || record.timestamp || record.createdAt),
    sourceRevision: revision,
    sourceKey: id(sourceKey),
    attemptIndex,
    coleadorIndex
  };
}

function buildResults(published, charreadas) {
  const rows = new Map();
  for (const score of published) {
    const charreada = charreadas.find((item) => item.charreadaId === score.charreadaId) || null;
    const competitionId = score.competitionId || charreada?.competitionId || `legacy_${score.competitionType}`;
    const categoryKey = score.categoryId || score.categoryName || "uncategorized";
    const phaseKey = score.phaseId || score.phaseName || "single";
    const entityId = score.competitionScope === "individual" ? score.participantId : score.teamId;
    const entityKey = entityId || score.resultId;
    const key = [competitionId, categoryKey, phaseKey, score.charreadaId || "unassigned", entityKey].join("|");
    if (!rows.has(key)) {
      rows.set(key, {
        resultId: `public_${buildPublicContentSignature(key).slice(4)}`,
        teamId: score.competitionScope === "team" ? score.teamId : null,
        teamName: score.competitionScope === "team" ? score.teamName : "",
        participantId: score.competitionScope === "individual" ? score.participantId : null,
        participantName: score.competitionScope === "individual" ? score.participantName : "",
        horseId: score.competitionScope === "individual" ? score.horseId : null,
        horseName: score.competitionScope === "individual" ? score.horseName : "",
        categoryId: score.categoryId,
        categoryName: score.categoryName,
        competitionId,
        competitionType: score.competitionType,
        phaseId: score.phaseId,
        phaseName: score.phaseName,
        charreadaId: score.charreadaId,
        participantScope: score.competitionScope,
        scores: {},
        subtotal: 0,
        teamPenaltyTotal: score.teamPenalty,
        officialTotal: score.explicitOfficialTotal,
        officialPosition: score.officialPosition,
        positionStatus: score.officialPosition ? "official" : "unavailable",
        resultStatus: "published",
        publishedAt: score.publishedAt,
        sourceRevision: score.sourceRevision,
        displayOrder: rows.size + 1
      });
    }
    const row = rows.get(key);
    const column = publicScoreColumn(score.suerteId);
    if (column) row.scores[column] = (row.scores[column] || 0) + score.score;
    row.subtotal += score.score;
    if (score.teamPenalty !== null) row.teamPenaltyTotal = score.teamPenalty;
    if (score.explicitOfficialTotal !== null) row.officialTotal = score.explicitOfficialTotal;
    if (score.officialPosition !== null) {
      row.officialPosition = score.officialPosition;
      row.positionStatus = "official";
    }
    if (score.publishedAt > row.publishedAt) row.publishedAt = score.publishedAt;
    row.sourceRevision = Math.max(row.sourceRevision, score.sourceRevision);
  }
  const items = [...rows.values()].slice(0, MAX_RESULT_ROWS).map((row) => ({
    ...row,
    accumulatedTotal: row.subtotal,
    totalStatus: row.officialTotal === null ? "partial" : "final",
    provisionalPosition: null
  }));
  const scopes = {};
  for (const row of items) {
    const key = [
      row.competitionId || "unknown",
      row.categoryId || row.categoryName || "uncategorized",
      row.phaseId || row.phaseName || "single",
      row.charreadaId || "unassigned"
    ].join("|");
    if (!scopes[key]) {
      scopes[key] = {
        competitionId: row.competitionId,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        phaseId: row.phaseId,
        phaseName: row.phaseName,
        charreadaId: row.charreadaId,
        participantScope: row.participantScope,
        resultIds: []
      };
    }
    scopes[key].resultIds.push(row.resultId);
  }
  assignProvisionalPositions(items, scopes);
  return {
    revision: 0,
    status: items.length ? "ready" : "empty",
    scopes,
    items
  };
}

function assignProvisionalPositions(items, scopes) {
  for (const scope of Object.values(scopes)) {
    const scopedRows = scope.resultIds
      .map((resultId) => items.find((row) => row.resultId === resultId))
      .filter(Boolean)
      .sort((left, right) => (
        resolvePublishedTotal(right) - resolvePublishedTotal(left) ||
        left.displayOrder - right.displayOrder ||
        left.resultId.localeCompare(right.resultId)
      ));
    let previousTotal = null;
    let position = 0;
    scopedRows.forEach((row, index) => {
      const total = resolvePublishedTotal(row);
      if (previousTotal === null || total !== previousTotal) position = index + 1;
      row.provisionalPosition = position;
      if (!row.officialPosition) row.positionStatus = "provisional";
      previousTotal = total;
    });
  }
}

function resolvePublishedTotal(row) {
  return row.officialTotal ?? row.accumulatedTotal ?? row.subtotal ?? 0;
}

function buildCompetitions(charreadas, resultItems, tournament) {
  const byId = new Map();
  for (const charreada of charreadas) {
    const current = byId.get(charreada.competitionId) || {
      competitionId: charreada.competitionId,
      competitionType: charreada.competitionType,
      name: charreada.competitionName,
      categoryId: charreada.categoryId,
      phaseId: charreada.phaseId,
      order: charreada.order,
      status: charreada.status,
      suerteIds: [],
      charreadaIds: [],
      competitionScope: charreada.competitionScope,
      legacy: charreada.legacy
    };
    current.suerteIds = unique([...current.suerteIds, ...charreada.suerteIds]);
    current.charreadaIds = unique([...current.charreadaIds, charreada.charreadaId].filter(Boolean));
    current.legacy = current.legacy || charreada.legacy;
    byId.set(current.competitionId, current);
  }
  for (const row of resultItems) {
    if (byId.has(row.competitionId)) continue;
    const config = getCompetitionType(row.competitionType);
    byId.set(row.competitionId, {
      competitionId: row.competitionId,
      competitionType: row.competitionType,
      name: config.label || row.competitionType,
      categoryId: row.categoryId,
      phaseId: row.phaseId,
      order: byId.size + 1,
      status: "ready",
      suerteIds: normalizeSuerteIds(null, config.suerteIds),
      charreadaIds: row.charreadaId ? [row.charreadaId] : [],
      competitionScope: config.scope || row.participantScope,
      legacy: true
    });
  }
  if (!byId.size && tournament) {
    const config = getCompetitionTypeFromTournamentType(tournament.info?.type || tournament.type || "completo");
    byId.set(config.type, {
      competitionId: config.type,
      competitionType: config.type,
      name: config.label,
      categoryId: null,
      phaseId: null,
      order: 1,
      status: "ready",
      suerteIds: normalizeSuerteIds(null, config.suerteIds),
      charreadaIds: [],
      competitionScope: config.scope,
      legacy: true
    });
  }
  return [...byId.values()].sort((left, right) => left.order - right.order || left.competitionId.localeCompare(right.competitionId));
}

function resolveActiveContext(tournament, liveCurrent, charreadas) {
  const liveCharreadaId = id(
    liveCurrent.activeCharreadaId ||
    liveCurrent.charreadaId ||
    liveCurrent.charreada?.id
  );
  const metaCharreadaId = id(tournament.meta?.activeCharreadaId || tournament.activeCharreadaId);
  const charreadaId = liveCharreadaId || metaCharreadaId;
  const charreada = charreadas.find((item) => item.charreadaId === charreadaId) || null;
  const liveCompetitionId = id(liveCurrent.competitionId || liveCurrent.competition?.id);
  const competitionId = liveCompetitionId || charreada?.competitionId || null;
  return {
    charreadaId,
    charreadaName: charreada?.name || text(liveCurrent.charreada?.name || liveCurrent.charreada?.nombre, 180),
    competitionId,
    competitionName: charreada?.competitionName || text(liveCurrent.competition?.name, 180),
    consistency: liveCharreadaId && metaCharreadaId && liveCharreadaId !== metaCharreadaId
      ? "live-current-preferred"
      : "consistent"
  };
}

function normalizeOfficialTurn(turn) {
  const team = normalizePublicEntity(turn?.team, "team");
  const participant = normalizePublicEntity(turn?.participant || turn?.charro, "participant");
  const horse = normalizePublicEntity(turn?.horse || turn?.caballo, "horse");
  const suerteId = normalizeSuerteId(turn?.suerteId || turn?.suerte?.id || turn?.suerte?.key);
  const available = Boolean(team.id || participant.id || team.name || participant.name);
  return {
    status: available ? "available" : "unavailable",
    team,
    participant,
    horse,
    suerteId,
    suerteName: text(turn?.suerteName || turn?.suerte?.nombre || turn?.suerte?.name, 120)
  };
}

function normalizePublicEntity(value, type) {
  const record = isRecord(value) ? value : {};
  const result = {
    id: id(record.id || record[`${type}Id`]),
    name: text(record.name || record.nombre || record[`${type}Name`], 180)
  };
  if (type === "team") result.category = text(record.category || record.categoria || record.categoryName, 120);
  return result;
}

function normalizePublicTimer(timer) {
  if (!isRecord(timer)) return { status: "unavailable", timeMs: null, timeText: "", running: false };
  return {
    status: "available",
    timeMs: sanitizePublicNumber(timer.timeMs ?? timer.elapsedMs ?? timer.valueMs, null),
    timeText: text(timer.timeText || timer.formatted || timer.display, 40),
    running: sanitizePublicBoolean(timer.running, false)
  };
}

function normalizeCurrentResult(value, published) {
  const recordId = id(value?.id || value?.publishedScoreId);
  const record = published.find((item) => item.resultId === recordId) || published[published.length - 1] || null;
  if (!record) return null;
  return {
    resultId: record.resultId,
    teamId: record.teamId,
    teamName: record.teamName,
    participantId: record.participantId,
    participantName: record.participantName,
    suerteId: record.suerteId,
    score: record.score,
    publishedAt: record.publishedAt
  };
}

function buildLiveStandings(rows, active, turn) {
  return rows
    .filter((row) => !active.competitionId || row.competitionId === active.competitionId)
    .filter((row) => !active.charreadaId || row.charreadaId === active.charreadaId)
    .map((row) => ({
      resultId: row.resultId,
      teamId: row.teamId,
      teamName: row.teamName,
      participantId: row.participantId,
      participantName: row.participantName,
      total: row.officialTotal ?? row.subtotal,
      officialPosition: row.officialPosition,
      provisionalPosition: row.provisionalPosition,
      positionStatus: row.positionStatus,
      totalStatus: row.totalStatus,
      active: Boolean(
        (row.teamId && row.teamId === turn.team.id) ||
        (row.participantId && row.participantId === turn.participant.id)
      )
    }));
}

function buildProgramItem(charreada, context = {}) {
  const resultsAvailable = context.results?.some((row) => row.charreadaId === charreada.charreadaId) || false;
  const liveAvailable = Boolean(
    charreada.charreadaId &&
    charreada.charreadaId === context.active?.charreadaId
  );
  return {
    scheduleId: charreada.scheduleId,
    sequence: charreada.order,
    competitionId: charreada.competitionId,
    competitionType: charreada.competitionType,
    competitionScope: charreada.competitionScope,
    competitionName: charreada.competitionName,
    categoryId: charreada.categoryId,
    categoryName: charreada.categoryName,
    phaseId: charreada.phaseId,
    phaseName: charreada.phaseName,
    charreadaId: charreada.charreadaId,
    name: charreada.name,
    shortTitle: charreada.shortTitle,
    scheduledDate: charreada.scheduledDate,
    scheduledTime: charreada.scheduledTime,
    endTime: charreada.endTime,
    order: charreada.order,
    status: charreada.status,
    venueId: charreada.venueId,
    venueName: charreada.venueName,
    participantType: charreada.competitionScope,
    participants: charreada.participants,
    publicNotes: charreada.publicNotes,
    liveAvailable,
    resultsAvailable,
    revision: charreada.revision,
    updatedAt: charreada.updatedAt,
    legacy: charreada.legacy
  };
}

function buildTurnSummary(turn) {
  return {
    status: turn.status,
    teamId: turn.team.id,
    teamName: turn.team.name,
    participantId: turn.participant.id,
    participantName: turn.participant.name,
    suerteId: turn.suerteId,
    suerteName: turn.suerteName
  };
}

function resolveProjectionStatus(tournament, active) {
  const value = String(tournament.info?.estado || tournament.info?.status || tournament.status || "").toLowerCase();
  if (value.includes("termin")) return "finished";
  if (active.charreadaId || value.includes("vivo") || value.includes("live")) return "live";
  return "ready";
}

function resolveSourceUpdatedAt(tournament, liveCurrent, published, charreadas) {
  const values = [
    tournament.meta?.updatedAt,
    tournament.meta?.updatedAtMs,
    liveCurrent.timestamp,
    liveCurrent.updatedAt,
    ...published.map((record) => record.publishedAt),
    ...charreadas.map((record) => record.updatedAt)
  ].map(finiteTimestamp).filter(Boolean);
  return values.length ? new Date(Math.max(...values)).toISOString() : "";
}

function unavailableSection() {
  return { revision: 0, status: "unavailable", items: [] };
}

function sectionSignature(section) {
  return buildPublicContentSignature(stripVolatile(section));
}

function stripVolatile(value) {
  if (Array.isArray(value)) return value.map(stripVolatile);
  if (!isRecord(value)) return value;
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SECTION_VOLATILE_FIELDS.has(key)) continue;
    output[key] = stripVolatile(entry);
  }
  return output;
}

function isSourceRegression(previousValue, nextValue) {
  const previous = finiteTimestamp(previousValue);
  const next = finiteTimestamp(nextValue);
  return Boolean(previous && next && next < previous);
}

function comparePublishedRecord(left, right) {
  return (
    left.sourceRevision - right.sourceRevision ||
    finiteTimestamp(left.publishedAt) - finiteTimestamp(right.publishedAt) ||
    left.resultId.localeCompare(right.resultId)
  );
}

function publicScoreColumn(suerteId) {
  const columns = PUBLIC_SCORE_COLUMNS[suerteId] || [];
  return columns[0] || null;
}

function normalizeSuerteId(value) {
  const clean = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const aliases = {
    cc: "cala",
    cala_de_caballo: "cala",
    p: "piales",
    pial: "piales",
    c: "colas",
    coleadero: "colas",
    jt: "toro",
    jineteo_toro: "toro",
    lc: "lazo",
    pr: "pial_ruedo",
    lazo_cabecero: "lazo",
    jy: "yegua",
    jineteo_yegua: "yegua",
    mp: "manganas_pie",
    mc: "manganas_caballo",
    pm: "paso",
    paso_muerte: "paso",
    paso_de_muerte: "paso",
    paso_de_la_muerte: "paso",
    pasodelamuerte: "paso"
  };
  return aliases[clean] || (PUBLIC_SCORE_COLUMNS[clean] ? clean : null);
}

function normalizeSuerteIds(value, fallback = []) {
  return unique(collection(value === undefined || value === null ? fallback : value)
    .map((entry) => normalizeSuerteId(entry?.id || entry))
    .filter(Boolean));
}

function normalizeVisibility(value) {
  return value === "private" ? "private" : "public";
}

function normalizeStatus(value) {
  const clean = text(value, 60).toLowerCase();
  return clean || "programada";
}

function collection(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== null && entry !== undefined);
  if (isRecord(value)) return Object.values(value).filter((entry) => entry !== null && entry !== undefined);
  return [];
}

function keyedCollection(value) {
  if (Array.isArray(value)) return value.map((entry, index) => [String(index), entry]).filter(([, entry]) => entry);
  if (isRecord(value)) return Object.entries(value).filter(([, entry]) => entry);
  return [];
}

function id(value) {
  return sanitizePublicId(value, null);
}

function text(value, maxLength) {
  return sanitizePublicString(value, maxLength, "");
}

function dateText(value) {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const timestamp = finiteTimestamp(value);
  return timestamp ? new Date(timestamp).toISOString() : text(value, 80);
}

function finiteTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function finiteInteger(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : fallback;
}

function firstFinite(values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function unique(values) {
  return [...new Set(values)];
}

function legacyIdentityPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "_");
}

function buildPublicPhaseId(value) {
  const slug = legacyIdentityPart(value).slice(0, 120);
  return slug ? `phase_${slug}` : null;
}

function publicUrl(value) {
  const clean = text(value, 500);
  if (!clean) return "";
  if (/^(?:javascript|data|file|vbscript):/i.test(clean)) return "";
  if (/^(?:https?:\/\/|\/|\.\/)/i.test(clean)) return clean;
  if (!clean.includes(":") && !clean.split("/").includes("..")) return clean;
  return "";
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
