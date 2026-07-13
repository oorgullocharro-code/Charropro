export const BROADCAST_DATA_CONTRACT_VERSION = "1.0.0";

const VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const CUSTOM_FIELD_SCOPES = Object.freeze([
  "global",
  "organization",
  "tournament",
  "competition",
  "charreada",
  "participant",
  "team",
  "horse",
  "score",
  "production",
  "session"
]);
const ROOT_MODULES = Object.freeze([
  "tournament",
  "organization",
  "competition",
  "charreada",
  "participant",
  "team",
  "charro",
  "horse",
  "suerte",
  "score",
  "scoreDetail",
  "ranking",
  "timer",
  "sponsor",
  "branding",
  "production",
  "system",
  "customFields"
]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_CLONE_DEPTH = 12;
const MAX_CUSTOM_FIELD_DEPTH = 6;
const MAX_ARRAY_LENGTH = 250;
const TIMER_STALE_AFTER_MS = 120000;

const COMPETITION_DEFAULTS = Object.freeze({
  equipos_completo: Object.freeze({
    name: "Competencia por equipos",
    scope: "team",
    suerteIds: Object.freeze([
      "cala",
      "piales",
      "colas",
      "toro",
      "terna",
      "yegua",
      "manganas_pie",
      "manganas_caballo",
      "paso"
    ]),
    affectsTeamRanking: true,
    affectsGeneralStatistics: true
  }),
  charro_completo: Object.freeze({
    name: "Charro Completo",
    scope: "individual",
    suerteIds: Object.freeze([
      "cala",
      "piales",
      "colas",
      "toro",
      "manganas_pie",
      "manganas_caballo",
      "paso"
    ]),
    affectsTeamRanking: false,
    affectsGeneralStatistics: false
  }),
  caladero: Object.freeze({
    name: "Caladero",
    scope: "individual",
    suerteIds: Object.freeze(["cala"]),
    affectsTeamRanking: false,
    affectsGeneralStatistics: false
  }),
  coleadero: Object.freeze({
    name: "Coleadero",
    scope: "individual",
    suerteIds: Object.freeze(["colas"]),
    affectsTeamRanking: false,
    affectsGeneralStatistics: false
  }),
  pialadero: Object.freeze({
    name: "Pialadero",
    scope: "individual",
    suerteIds: Object.freeze(["piales"]),
    affectsTeamRanking: false,
    affectsGeneralStatistics: false
  }),
  exhibicion: Object.freeze({
    name: "Exhibición",
    scope: "exhibition",
    suerteIds: Object.freeze([]),
    affectsTeamRanking: false,
    affectsGeneralStatistics: false
  })
});

const FIELD_VISIBILITY = Object.freeze({
  contractVersion: "public",
  generatedAt: "public",
  revision: "production",
  visibility: "public",
  source: "production",
  "source.type": "production",
  "source.version": "operational",
  "source.generatedAt": "production",
  "source.freshness": "production",
  "source.available": "production",
  tournament: "public",
  "tournament.id": "public",
  "tournament.name": "public",
  "tournament.type": "public",
  "tournament.status": "public",
  "tournament.startDate": "public",
  "tournament.endDate": "public",
  "tournament.venue": "public",
  "tournament.city": "public",
  "tournament.state": "public",
  "tournament.country": "public",
  "tournament.logo": "public",
  "tournament.slug": "public",
  "tournament.organizerName": "public",
  organization: "public",
  "organization.id": "public",
  "organization.name": "public",
  "organization.shortName": "public",
  "organization.logo": "public",
  "organization.type": "public",
  "organization.tenantId": "restricted",
  "organization.clientId": "restricted",
  competition: "public",
  "competition.id": "public",
  "competition.type": "public",
  "competition.name": "public",
  "competition.scope": "public",
  "competition.category": "public",
  "competition.phase": "public",
  "competition.round": "public",
  "competition.status": "public",
  "competition.suerteIds": "public",
  "competition.participantCount": "public",
  "competition.teamCount": "public",
  "competition.affectsTeamRanking": "production",
  "competition.affectsGeneralStatistics": "production",
  charreada: "public",
  "charreada.id": "public",
  "charreada.name": "public",
  "charreada.status": "public",
  "charreada.date": "public",
  "charreada.startTime": "public",
  "charreada.endTime": "public",
  "charreada.order": "public",
  "charreada.phase": "public",
  "charreada.category": "public",
  "charreada.active": "public",
  "charreada.competitionId": "public",
  "charreada.competitionType": "public",
  "charreada.suerteIds": "public",
  participant: "public",
  "participant.id": "public",
  "participant.name": "public",
  "participant.alias": "public",
  "participant.scope": "public",
  "participant.category": "public",
  "participant.association": "public",
  "participant.number": "public",
  "participant.order": "public",
  "participant.photo": "public",
  "participant.active": "public",
  "participant.total": "public",
  "participant.position": "public",
  team: "public",
  "team.id": "public",
  "team.name": "public",
  "team.shortName": "public",
  "team.logo": "public",
  "team.category": "public",
  "team.association": "public",
  "team.order": "public",
  "team.total": "public",
  "team.position": "public",
  "team.active": "public",
  "team.members": "production",
  charro: "public",
  "charro.id": "public",
  "charro.name": "public",
  "charro.firstName": "production",
  "charro.lastName": "production",
  "charro.alias": "public",
  "charro.photo": "public",
  "charro.association": "public",
  "charro.category": "public",
  "charro.active": "public",
  horse: "public",
  "horse.id": "production",
  "horse.name": "public",
  "horse.photo": "public",
  "horse.owner": "restricted",
  "horse.breeder": "restricted",
  "horse.category": "public",
  "horse.active": "public",
  suerte: "public",
  "suerte.id": "public",
  "suerte.name": "public",
  "suerte.order": "public",
  "suerte.status": "public",
  "suerte.active": "public",
  "suerte.completed": "public",
  "suerte.attempt": "public",
  "suerte.maxAttempts": "public",
  score: "public",
  "score.id": "production",
  "score.basePoints": "public",
  "score.additionalPoints": "public",
  "score.infractions": "public",
  "score.penalties": "public",
  "score.teamPenalties": "production",
  "score.total": "public",
  "score.time": "public",
  "score.attempts": "public",
  "score.status": "public",
  "score.published": "public",
  "score.timestamp": "public",
  "score.judgeId": "operational",
  "score.judgeName": "operational",
  "score.participantId": "public",
  "score.teamId": "public",
  "score.suerteId": "public",
  "score.competitionId": "public",
  "score.competitionType": "public",
  "score.participantScope": "public",
  scoreDetail: "production",
  "scoreDetail.attempt": "production",
  "scoreDetail.breakdown": "production",
  "scoreDetail.evidence": "operational",
  "scoreDetail.timeEvidence": "operational",
  "scoreDetail.raw": "restricted",
  ranking: "public",
  "ranking.scope": "public",
  "ranking.type": "public",
  "ranking.currentPosition": "public",
  "ranking.previousPosition": "public",
  "ranking.movement": "public",
  "ranking.total": "public",
  "ranking.differenceToLeader": "public",
  "ranking.entries": "public",
  "ranking.entries[]": "public",
  "ranking.entries[].id": "public",
  "ranking.entries[].name": "public",
  "ranking.entries[].scope": "public",
  "ranking.entries[].position": "public",
  "ranking.entries[].total": "public",
  "ranking.entries[].category": "public",
  "ranking.entries[].association": "public",
  "ranking.entries[].teamId": "public",
  "ranking.entries[].participantId": "public",
  timer: "public",
  "timer.id": "production",
  "timer.value": "public",
  "timer.elapsed": "public",
  "timer.remaining": "public",
  "timer.running": "public",
  "timer.paused": "public",
  "timer.startedAt": "production",
  "timer.updatedAt": "production",
  "timer.limit": "public",
  "timer.status": "public",
  "timer.display": "public",
  "timer.revision": "production",
  "timer.source": "operational",
  sponsor: "public",
  "sponsor.active": "public",
  "sponsor.primary": "public",
  "sponsor.list": "public",
  "sponsor.list[]": "public",
  "sponsor.active.id": "public",
  "sponsor.active.name": "public",
  "sponsor.active.logo": "public",
  "sponsor.active.website": "public",
  "sponsor.active.campaign": "production",
  "sponsor.active.scope": "production",
  "sponsor.active.priority": "production",
  "sponsor.active.active": "public",
  "sponsor.active.metadata": "production",
  "sponsor.primary.id": "public",
  "sponsor.primary.name": "public",
  "sponsor.primary.logo": "public",
  "sponsor.primary.website": "public",
  "sponsor.primary.campaign": "production",
  "sponsor.primary.scope": "production",
  "sponsor.primary.priority": "production",
  "sponsor.primary.active": "public",
  "sponsor.primary.metadata": "production",
  "sponsor.list[].id": "public",
  "sponsor.list[].name": "public",
  "sponsor.list[].logo": "public",
  "sponsor.list[].website": "public",
  "sponsor.list[].campaign": "production",
  "sponsor.list[].scope": "production",
  "sponsor.list[].priority": "production",
  "sponsor.list[].active": "public",
  "sponsor.list[].metadata": "production",
  branding: "public",
  "branding.themeId": "public",
  "branding.primaryColor": "public",
  "branding.secondaryColor": "public",
  "branding.accentColor": "public",
  "branding.backgroundColor": "public",
  "branding.textColor": "public",
  "branding.logo": "public",
  "branding.watermark": "public",
  "branding.typography": "public",
  "branding.backgrounds": "public",
  "branding.iconSet": "public",
  production: "production",
  "production.sessionId": "production",
  "production.outputId": "production",
  "production.outputType": "production",
  "production.preview": "production",
  "production.program": "production",
  "production.activeGraphic": "production",
  "production.visibleGraphics": "production",
  "production.activeLayers": "production",
  "production.mode": "production",
  "production.automationEnabled": "production",
  "production.operatorId": "operational",
  "production.operatorName": "operational",
  "production.status": "production",
  "production.liveChannel": "production",
  "production.currentTurnId": "production",
  "production.currentTurnName": "production",
  "production.updatedAt": "production",
  system: "public",
  "system.online": "public",
  "system.firebaseConnected": "operational",
  "system.syncStatus": "public",
  "system.appVersion": "production",
  "system.contractVersion": "public",
  "system.sourceVersion": "operational",
  "system.lastUpdate": "public",
  "system.latency": "operational",
  "system.warnings": "operational",
  "system.errors": "restricted",
  "system.diagnostics": "restricted",
  customFields: "public",
  warnings: "production",
  errors: "operational",
  legacy: "production",
  "legacy.used": "production",
  "legacy.fallbacks": "production",
  "legacy.sourceShape": "production",
  "legacy.aliasesIncluded": "production",
  legacyAliases: "production"
});

const VISIBILITY_SUBTREE_PATHS = Object.freeze([
  "team.members",
  "score.infractions",
  "score.penalties",
  "score.teamPenalties",
  "score.time",
  "score.attempts",
  "scoreDetail",
  "timer.source",
  "sponsor.active.metadata",
  "sponsor.primary.metadata",
  "sponsor.list[].metadata",
  "branding.typography",
  "branding.backgrounds",
  "production.preview",
  "production.program",
  "production.activeGraphic",
  "production.visibleGraphics",
  "production.activeLayers",
  "system.diagnostics",
  "customFields",
  "legacyAliases"
]);

export function buildBroadcastDataContract(source = {}, options = {}) {
  const cloneWarnings = [];
  const selectedSource = selectSourceEnvelope(isRecord(source) ? source : {});
  const envelope = cloneSerializable(selectedSource, {
    warnings: cloneWarnings,
    path: "source"
  }) || {};
  const context = isRecord(envelope.broadcastContext) ? envelope.broadcastContext : envelope;
  const visibility = normalizeVisibility(options.visibility);
  const generatedAt = normalizeIsoDate(options.generatedAt || options.now) || new Date().toISOString();
  const sourceGeneratedAt = normalizeIsoDate(firstDefined(
    context.source?.generatedAt,
    context.generatedAt,
    context.production?.updatedAt,
    envelope.generatedAt,
    envelope.timestamp
  ));
  const sourceType = detectSourceType(envelope, context);
  const sourceAvailable = Object.keys(context).length > 0;
  const sourceFreshness = resolveFreshness(
    firstDefined(options.sourceFreshness, context.source?.freshness),
    sourceGeneratedAt,
    options.now || generatedAt,
    options.staleAfterMs
  );
  const legacy = {
    used: sourceType === "legacyPartial",
    fallbacks: [],
    sourceShape: sourceType,
    aliasesIncluded: Boolean(options.includeLegacyAliases)
  };

  const tournament = buildTournament(context, envelope);
  const organization = buildOrganization(context, envelope, tournament);
  const competition = buildCompetition(context, envelope, legacy);
  const charreada = buildCharreada(context, envelope, competition);
  const participant = buildParticipant(context, envelope, competition);
  const team = buildTeam(context, envelope, competition);
  const charro = buildCharro(context, envelope, competition, participant);
  const horse = buildHorse(context, envelope, participant);
  const suerte = buildSuerte(context, envelope);
  const scoreDetail = buildScoreDetail(context, envelope, cloneWarnings);
  const score = buildScore(context, envelope, competition, participant, team, suerte, scoreDetail, cloneWarnings);
  const ranking = buildRanking(context, envelope, competition, participant, team, cloneWarnings);
  const timer = buildTimer(context, envelope, cloneWarnings);
  const sponsor = buildSponsor(context, envelope, cloneWarnings);
  const branding = buildBranding(context, envelope, cloneWarnings);
  const production = buildProduction(context, envelope, options, cloneWarnings);
  const customFieldsResult = buildCustomFields(context, envelope);
  const system = buildSystem(context, envelope, options, generatedAt, cloneWarnings);

  const contract = {
    contractVersion: BROADCAST_DATA_CONTRACT_VERSION,
    generatedAt,
    revision: finiteNumberOr(firstDefined(context.revision, envelope.revision, context.timer?.revision), 0),
    visibility,
    source: {
      type: sourceType,
      version: nullableString(firstDefined(context.source?.version, context.sourceVersion, envelope.sourceVersion)),
      generatedAt: sourceGeneratedAt,
      freshness: sourceFreshness,
      available: sourceAvailable
    },
    tournament,
    organization,
    competition,
    charreada,
    participant,
    team,
    charro,
    horse,
    suerte,
    score,
    scoreDetail,
    ranking,
    timer,
    sponsor,
    branding,
    production,
    system,
    customFields: customFieldsResult.value,
    warnings: [],
    errors: [],
    legacy
  };

  if (options.includeLegacyAliases === true) {
    contract.legacyAliases = buildLegacyAliases(contract);
  }

  contract.warnings = uniqueStrings([
    ...cloneWarnings,
    ...customFieldsResult.warnings,
    ...detectBroadcastWarnings(contract)
  ]);
  const validation = validateBroadcastDataContract(contract);
  contract.errors = validation.errors;
  contract.warnings = uniqueStrings([...contract.warnings, ...validation.warnings]);

  return sanitizeBroadcastDataContract(contract, visibility);
}

export function validateBroadcastDataContract(contract) {
  const errors = [];
  const warnings = [];

  if (!isRecord(contract)) {
    return {
      valid: false,
      errors: ["contract-not-object"],
      warnings,
      contractVersion: BROADCAST_DATA_CONTRACT_VERSION
    };
  }

  if (contract.contractVersion !== BROADCAST_DATA_CONTRACT_VERSION) {
    errors.push("contract-version-incompatible");
  }
  if (!isIsoDate(contract.generatedAt)) errors.push("generated-at-invalid");
  if (hasOwn(contract, "revision") && !Number.isFinite(contract.revision)) errors.push("revision-invalid");
  if (!VISIBILITIES.includes(contract.visibility)) errors.push("visibility-invalid");
  const effectiveVisibility = normalizeVisibility(contract.visibility);
  if (isPathVisibleAt("source", effectiveVisibility) && !isRecord(contract.source)) errors.push("source-invalid");

  ROOT_MODULES.forEach((moduleName) => {
    if (isPathVisibleAt(moduleName, effectiveVisibility) && !isRecord(contract[moduleName])) {
      errors.push(`module-invalid:${moduleName}`);
    } else if (hasOwn(contract, moduleName) && !isRecord(contract[moduleName])) {
      errors.push(`module-invalid:${moduleName}`);
    }
  });

  if (isPathVisibleAt("warnings", effectiveVisibility) && !Array.isArray(contract.warnings)) errors.push("warnings-not-array");
  if (hasOwn(contract, "warnings") && !Array.isArray(contract.warnings)) errors.push("warnings-not-array");
  if (isPathVisibleAt("errors", effectiveVisibility) && !Array.isArray(contract.errors)) errors.push("errors-not-array");
  if (hasOwn(contract, "errors") && !Array.isArray(contract.errors)) errors.push("errors-not-array");
  if (!Array.isArray(contract.competition?.suerteIds)) errors.push("competition-suerte-ids-not-array");
  if (!Array.isArray(contract.charreada?.suerteIds)) errors.push("charreada-suerte-ids-not-array");
  if (hasOwn(contract.team || {}, "members") && !Array.isArray(contract.team?.members)) errors.push("team-members-not-array");
  if (!Array.isArray(contract.ranking?.entries)) errors.push("ranking-entries-not-array");
  if (!Array.isArray(contract.sponsor?.list)) errors.push("sponsor-list-not-array");

  const scope = contract.competition?.scope;
  if (scope !== null && !["team", "individual", "exhibition"].includes(scope)) {
    errors.push("competition-scope-invalid");
  }
  if (scope === "individual" && hasIdentity(contract.team)) {
    errors.push("individual-competition-has-team");
  }
  if (scope === "team" && contract.participant?.scope === "individual") {
    errors.push("team-competition-has-individual-participant");
  }

  const numericPaths = [
    "score.basePoints",
    "score.additionalPoints",
    "score.total",
    "participant.total",
    "participant.position",
    "team.total",
    "team.position",
    "ranking.currentPosition",
    "ranking.previousPosition",
    "ranking.total",
    "ranking.differenceToLeader",
    "timer.value",
    "timer.elapsed",
    "timer.remaining",
    "timer.limit"
  ];
  numericPaths.forEach((path) => {
    const value = getBroadcastField(contract, path, undefined);
    if (value !== undefined && value !== null && !Number.isFinite(value)) errors.push(`number-invalid:${path}`);
  });

  const idPaths = [
    "tournament.id",
    "organization.id",
    "organization.tenantId",
    "organization.clientId",
    "competition.id",
    "charreada.id",
    "participant.id",
    "team.id",
    "charro.id",
    "horse.id",
    "suerte.id",
    "score.id",
    "score.participantId",
    "score.teamId",
    "score.suerteId",
    "score.competitionId",
    "timer.id"
  ];
  idPaths.forEach((path) => {
    const value = getBroadcastField(contract, path, undefined);
    if (value !== undefined && value !== null && typeof value !== "string") errors.push(`id-invalid:${path}`);
  });

  const isoDatePaths = [
    "source.generatedAt",
    "score.timestamp",
    "timer.startedAt",
    "timer.updatedAt",
    "production.updatedAt",
    "system.lastUpdate"
  ];
  isoDatePaths.forEach((path) => {
    const value = getBroadcastField(contract, path, undefined);
    if (value !== undefined && value !== null && !isIsoDate(value)) errors.push(`date-invalid:${path}`);
  });

  (contract.competition?.suerteIds || []).forEach((id, index) => {
    if (typeof id !== "string" || !id) errors.push(`suerte-id-invalid:${index}`);
  });

  (contract.ranking?.entries || []).forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`ranking-entry-invalid:${index}`);
      return;
    }
    if (entry.total !== null && entry.total !== undefined && !Number.isFinite(entry.total)) {
      errors.push(`ranking-entry-total-invalid:${index}`);
    }
  });

  const suerteIds = contract.competition?.suerteIds || [];
  if (contract.competition?.type === "charro_completo" && suerteIds.some((id) => ["terna", "yegua"].includes(id))) {
    errors.push("charro-completo-invalid-suertes");
  }
  if (measureDepth(contract.customFields) > MAX_CUSTOM_FIELD_DEPTH + 2) {
    errors.push("custom-fields-depth-exceeded");
  }
  if (containsDangerousKey(contract)) errors.push("dangerous-key-present");

  warnings.push(...detectBroadcastWarnings(contract));

  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    contractVersion: BROADCAST_DATA_CONTRACT_VERSION
  };
}

export function sanitizeBroadcastDataContract(contract, visibility = "production") {
  const normalizedVisibility = normalizeVisibility(visibility);
  const warnings = [];
  const cloned = cloneSerializable(isRecord(contract) ? contract : {}, {
    warnings,
    path: "contract"
  }) || {};

  cloned.visibility = normalizedVisibility;
  cloned.customFields = filterCustomFieldsByVisibility(cloned.customFields, normalizedVisibility);
  cloned.warnings = uniqueStrings([...(Array.isArray(cloned.warnings) ? cloned.warnings : []), ...warnings]);

  return filterBroadcastContractByVisibility(cloned, normalizedVisibility, "") || {};
}

export function getBroadcastField(contract, path, fallback) {
  const resolution = resolveBroadcastPath(contract, path);
  return resolution.exists && resolution.value !== undefined ? resolution.value : fallback;
}

export function hasBroadcastField(contract, path) {
  return resolveBroadcastPath(contract, path).exists;
}

export function listAvailableBroadcastFields(contract) {
  const fields = new Set();
  collectFieldPaths(contract, "", fields, new WeakSet(), 0);
  return [...fields].sort();
}

export function getBroadcastContractWarnings(contract) {
  if (!isRecord(contract)) return ["contract-not-object"];
  return uniqueStrings([
    ...(Array.isArray(contract.warnings) ? contract.warnings : []),
    ...detectBroadcastWarnings(contract)
  ]);
}

function buildTournament(context, envelope) {
  const raw = firstRecord(context.tournament, envelope.tournament);
  return {
    id: nullableId(firstDefined(raw.id, raw.tournamentId, envelope.tournamentId)),
    name: nullableString(firstDefined(raw.name, raw.nombre, raw.tournamentName, envelope.tournamentName)),
    type: nullableString(firstDefined(raw.type, raw.tipo, envelope.tournamentType)),
    status: nullableString(firstDefined(raw.status, raw.estado)),
    startDate: nullableString(firstDefined(raw.startDate, raw.fechaInicio, raw.date)),
    endDate: nullableString(firstDefined(raw.endDate, raw.fechaFin)),
    venue: nullableString(firstDefined(raw.venue, raw.sede, raw.lienzo)),
    city: nullableString(firstDefined(raw.city, raw.ciudad)),
    state: nullableString(firstDefined(raw.state, raw.estadoNombre, raw.region)),
    country: nullableString(firstDefined(raw.country, raw.pais)),
    logo: nullableString(firstDefined(raw.logo, raw.logoUrl)),
    slug: nullableString(raw.slug),
    organizerName: nullableString(firstDefined(raw.organizerName, raw.organizador, raw.organizationName))
  };
}

function buildOrganization(context, envelope, tournament) {
  const raw = firstRecord(context.organization, envelope.organization, context.tournament?.organization, envelope.tournament?.organization);
  return {
    id: nullableId(firstDefined(raw.id, raw.organizationId, envelope.organizationId)),
    name: nullableString(firstDefined(raw.name, raw.nombre, tournament.organizerName)),
    shortName: nullableString(firstDefined(raw.shortName, raw.nombreCorto, raw.abbreviation)),
    logo: nullableString(firstDefined(raw.logo, raw.logoUrl)),
    type: nullableString(firstDefined(raw.type, raw.tipo)),
    tenantId: nullableId(firstDefined(raw.tenantId, envelope.tenantId)),
    clientId: nullableId(firstDefined(raw.clientId, envelope.clientId))
  };
}

function buildCompetition(context, envelope, legacy) {
  const raw = firstRecord(context.competition, envelope.competition);
  const hasMetadata = hasValue(firstDefined(raw.id, raw.competitionId, raw.type, raw.competitionType, raw.scope, raw.competitionScope));
  let type = nullableString(firstDefined(raw.type, raw.competitionType, envelope.competitionType));
  let scope = nullableString(firstDefined(raw.scope, raw.competitionScope, raw.participantScope, envelope.competitionScope, envelope.participantScope));
  let id = nullableId(firstDefined(raw.id, raw.competitionId, envelope.competitionId));

  if (!hasMetadata) {
    type = "equipos_completo";
    scope = "team";
    id = "equipos_completo";
    legacy.used = true;
    legacy.fallbacks.push("competition:legacy-equipos-completo");
  }

  const defaults = COMPETITION_DEFAULTS[type] || null;
  if (!type) {
    type = "equipos_completo";
    legacy.used = true;
    legacy.fallbacks.push("competition:type");
  }
  if (!scope) {
    scope = defaults?.scope || "team";
    legacy.used = true;
    legacy.fallbacks.push("competition:scope");
  }
  if (!id) {
    id = type;
    legacy.used = true;
    legacy.fallbacks.push("competition:id-from-type");
  }

  const rawSuerteIds = firstArray(raw.suerteIds, envelope.suerteIds, context.charreada?.suerteIds, envelope.charreada?.suerteIds);
  const suerteIds = normalizeCompetitionSuerteIds(type, rawSuerteIds.length ? rawSuerteIds : defaults?.suerteIds || []);
  const participantCount = numberOrNull(firstDefined(
    raw.participantCount,
    envelope.participantCount,
    context.charreada?.participantsCount,
    context.charreada?.individualParticipants?.length
  ));
  const teamCount = numberOrNull(firstDefined(
    raw.teamCount,
    envelope.teamCount,
    context.charreada?.teamsCount,
    context.charreada?.teamIds?.length
  ));

  return {
    id,
    type,
    name: nullableString(firstDefined(raw.name, raw.competitionName, envelope.competitionName, defaults?.name)),
    scope,
    category: nullableString(firstDefined(raw.category, envelope.category, context.charreada?.category)),
    phase: nullableString(firstDefined(raw.phase, raw.fase, envelope.phase, context.charreada?.phase, context.charreada?.fase)),
    round: nullableString(firstDefined(raw.round, raw.ronda, envelope.round)),
    status: nullableString(firstDefined(raw.status, context.charreada?.status)),
    suerteIds,
    participantCount,
    teamCount,
    affectsTeamRanking: booleanOrNull(firstDefined(raw.affectsTeamRanking, defaults?.affectsTeamRanking)),
    affectsGeneralStatistics: booleanOrNull(firstDefined(raw.affectsGeneralStatistics, defaults?.affectsGeneralStatistics))
  };
}

function buildCharreada(context, envelope, competition) {
  const raw = firstRecord(context.charreada, envelope.charreada);
  const id = nullableId(firstDefined(raw.id, raw.charreadaId, envelope.charreadaId, envelope.activeCharreadaId));
  return {
    id,
    name: nullableString(firstDefined(raw.name, raw.nombre, raw.charreadaName, envelope.charreadaName)),
    status: nullableString(firstDefined(raw.status, raw.estado)),
    date: nullableString(firstDefined(raw.date, raw.fecha)),
    startTime: nullableString(firstDefined(raw.startTime, raw.hora, raw.scheduledAt)),
    endTime: nullableString(firstDefined(raw.endTime, raw.horaFin)),
    order: numberOrNull(firstDefined(raw.order, raw.charreadaOrder, raw.orden)),
    phase: nullableString(firstDefined(raw.phase, raw.fase, competition.phase)),
    category: nullableString(firstDefined(raw.category, competition.category)),
    active: booleanOrNull(firstDefined(raw.active, raw.isActive, id ? true : null)),
    competitionId: nullableId(firstDefined(raw.competitionId, competition.id)),
    competitionType: nullableString(firstDefined(raw.competitionType, competition.type)),
    suerteIds: normalizeStringArray(firstArray(raw.suerteIds, competition.suerteIds))
  };
}

function buildParticipant(context, envelope, competition) {
  const raw = firstRecord(context.participant, envelope.participant);
  const scope = nullableString(firstDefined(raw.scope, envelope.participantScope, competition.scope));
  return {
    id: nullableId(firstDefined(raw.id, raw.participantId, envelope.participantId)),
    name: nullableString(firstDefined(raw.name, raw.participantName, envelope.participantName)),
    alias: nullableString(firstDefined(raw.alias, raw.apodo)),
    scope,
    category: nullableString(firstDefined(raw.category, envelope.category)),
    association: nullableString(firstDefined(raw.association, raw.asociacion, envelope.association)),
    number: nullableString(firstDefined(raw.number, raw.numero)),
    order: numberOrNull(firstDefined(raw.order, raw.orden)),
    photo: nullableString(firstDefined(raw.photo, raw.photoUrl, raw.foto)),
    active: booleanOrNull(firstDefined(raw.active, raw.isActive)),
    total: numberOrNull(firstDefined(raw.total, raw.totalPoints)),
    position: numberOrNull(firstDefined(raw.position, raw.posicion))
  };
}

function buildTeam(context, envelope, competition) {
  if (competition.scope === "individual") return emptyTeam();
  const raw = firstRecord(context.team, envelope.team);
  return {
    id: nullableId(firstDefined(raw.id, raw.teamId, envelope.teamId)),
    name: nullableString(firstDefined(raw.name, raw.teamName, envelope.teamName)),
    shortName: nullableString(firstDefined(raw.shortName, raw.abbreviation, raw.nombreCorto)),
    logo: nullableString(firstDefined(raw.logo, raw.logoUrl)),
    category: nullableString(firstDefined(raw.category, envelope.category)),
    association: nullableString(firstDefined(raw.association, raw.asociacion, envelope.association)),
    order: numberOrNull(firstDefined(raw.order, raw.orden)),
    total: numberOrNull(firstDefined(raw.total, raw.totalPoints)),
    position: numberOrNull(firstDefined(raw.position, raw.posicion)),
    active: booleanOrNull(firstDefined(raw.active, raw.isActive)),
    members: cloneArray(firstDefined(raw.members, raw.integrantes, raw.roster))
  };
}

function emptyTeam() {
  return {
    id: null,
    name: null,
    shortName: null,
    logo: null,
    category: null,
    association: null,
    order: null,
    total: null,
    position: null,
    active: null,
    members: []
  };
}

function buildCharro(context, envelope, competition, participant) {
  const raw = firstRecord(context.charro, envelope.charro);
  const canUseCurrentParticipant = competition.scope === "team" && hasValue(participant.name);
  return {
    id: nullableId(firstDefined(raw.id, raw.charroId)),
    name: nullableString(firstDefined(raw.name, raw.charroName, canUseCurrentParticipant ? participant.name : undefined)),
    firstName: nullableString(firstDefined(raw.firstName, raw.nombre)),
    lastName: nullableString(firstDefined(raw.lastName, raw.apellidos)),
    alias: nullableString(firstDefined(raw.alias, raw.apodo)),
    photo: nullableString(firstDefined(raw.photo, raw.photoUrl, raw.foto)),
    association: nullableString(firstDefined(raw.association, raw.asociacion, canUseCurrentParticipant ? participant.association : undefined)),
    category: nullableString(firstDefined(raw.category, canUseCurrentParticipant ? participant.category : undefined)),
    active: booleanOrNull(firstDefined(raw.active, raw.isActive))
  };
}

function buildHorse(context, envelope, participant) {
  const raw = firstRecord(context.horse, envelope.horse);
  return {
    id: nullableId(firstDefined(raw.id, raw.horseId)),
    name: nullableString(firstDefined(raw.name, raw.horseName, envelope.horseName, context.participant?.horseName, participant.horseName)),
    photo: nullableString(firstDefined(raw.photo, raw.photoUrl, raw.foto)),
    owner: nullableString(firstDefined(raw.owner, raw.ownerName, raw.propietario)),
    breeder: nullableString(firstDefined(raw.breeder, raw.criador)),
    category: nullableString(raw.category),
    active: booleanOrNull(firstDefined(raw.active, raw.isActive))
  };
}

function buildSuerte(context, envelope) {
  const raw = firstRecord(context.suerte, envelope.suerte);
  return {
    id: nullableId(firstDefined(raw.id, raw.suerteId, envelope.suerteId)),
    name: nullableString(firstDefined(raw.name, raw.fullName, raw.suerteName, envelope.suerteName)),
    order: numberOrNull(firstDefined(raw.order, raw.orden)),
    status: nullableString(firstDefined(raw.status, raw.estado)),
    active: booleanOrNull(firstDefined(raw.active, raw.isActive)),
    completed: booleanOrNull(firstDefined(raw.completed, raw.terminada)),
    attempt: numberOrNull(firstDefined(raw.attempt, raw.attemptIndex, envelope.attemptIndex)),
    maxAttempts: numberOrNull(firstDefined(raw.maxAttempts, raw.attempts))
  };
}

function buildScoreDetail(context, envelope, warnings) {
  const raw = firstRecord(context.scoreDetail, envelope.scoreDetail, context.score?.scoreDetail, envelope.score?.scoreDetail);
  const detail = cloneSerializable(raw, { warnings, path: "scoreDetail" });
  if (!isRecord(detail)) return {};
  const rawScore = firstRecord(context.score, envelope.score);
  if (!hasOwn(detail, "timeEvidence") && rawScore.timeEvidence !== undefined) {
    detail.timeEvidence = cloneSerializable(rawScore.timeEvidence, { warnings, path: "scoreDetail.timeEvidence" }) ?? null;
  }
  if (!hasOwn(detail, "evidence") && rawScore.evidence !== undefined) {
    detail.evidence = cloneSerializable(rawScore.evidence, { warnings, path: "scoreDetail.evidence" }) ?? null;
  }
  return detail;
}

function buildScore(context, envelope, competition, participant, team, suerte, scoreDetail, warnings) {
  const raw = firstRecord(context.score, envelope.score);
  const breakdown = firstRecord(scoreDetail.breakdown, raw.breakdown);
  const teamCompetition = competition.scope === "team";
  const penalties = teamCompetition
    ? firstDefined(raw.generalPenalties, breakdown.penalties)
    : firstDefined(raw.penalties, breakdown.penalties);
  const teamPenalties = teamCompetition
    ? firstDefined(raw.teamPenalties, breakdown.teamPenalties, raw.penalties)
    : firstDefined(raw.teamPenalties, breakdown.teamPenalties);

  return {
    id: nullableId(firstDefined(raw.id, raw.scoreId, envelope.scoreId)),
    basePoints: numberOrNull(firstDefined(raw.basePoints, raw.base, breakdown.base)),
    additionalPoints: numberOrNull(firstDefined(raw.additionalPoints, raw.adic, breakdown.adic)),
    infractions: cloneSerializable(firstDefined(raw.infractions, raw.infr, breakdown.infr), {
      warnings,
      path: "score.infractions"
    }) ?? null,
    penalties: cloneSerializable(penalties, { warnings, path: "score.penalties" }) ?? null,
    teamPenalties: cloneSerializable(teamPenalties, { warnings, path: "score.teamPenalties" }) ?? null,
    total: numberOrNull(firstDefined(raw.total, raw.totalPoints, envelope.totalPoints, breakdown.total)),
    time: cloneSerializable(firstDefined(raw.time, raw.tiempo, envelope.time), { warnings, path: "score.time" }) ?? null,
    attempts: cloneSerializable(firstDefined(raw.attempts, raw.intentos), { warnings, path: "score.attempts" }) ?? null,
    status: nullableString(firstDefined(raw.status, envelope.scoreStatus)),
    published: booleanOrNull(raw.published),
    timestamp: normalizeIsoDate(firstDefined(raw.timestamp, raw.publishedAt, envelope.scoreTimestamp)),
    judgeId: nullableId(firstDefined(raw.judgeId, raw.juezId)),
    judgeName: nullableString(firstDefined(raw.judgeName, raw.juezNombre)),
    participantId: competition.scope === "individual"
      ? nullableId(firstDefined(raw.participantId, participant.id))
      : null,
    teamId: teamCompetition ? nullableId(firstDefined(raw.teamId, team.id)) : null,
    suerteId: nullableId(firstDefined(raw.suerteId, suerte.id)),
    competitionId: nullableId(firstDefined(raw.competitionId, competition.id)),
    competitionType: nullableString(firstDefined(raw.competitionType, competition.type)),
    participantScope: nullableString(firstDefined(raw.participantScope, competition.scope))
  };
}

function buildRanking(context, envelope, competition, participant, team, warnings) {
  const raw = firstDefined(context.ranking, envelope.ranking);
  const rawRanking = Array.isArray(raw) ? {} : firstRecord(raw);
  const rawEntries = Array.isArray(raw) ? raw : firstArray(rawRanking.entries, rawRanking.rows);
  const entries = rawEntries.slice(0, MAX_ARRAY_LENGTH).map((entry, index) => {
    const row = isRecord(entry) ? entry : {};
    const identity = competition.scope === "individual"
      ? firstRecord(row.participant, row)
      : firstRecord(row.team, row);
    const participantId = competition.scope === "individual"
      ? nullableId(firstDefined(row.participantId, identity.id))
      : null;
    const teamId = competition.scope === "team"
      ? nullableId(firstDefined(row.teamId, identity.id))
      : null;
    return {
      id: competition.scope === "individual" ? participantId : teamId,
      name: nullableString(firstDefined(
        competition.scope === "individual" ? row.participantName : row.teamName,
        identity.participantName,
        identity.name
      )),
      scope: competition.scope,
      position: numberOrNull(firstDefined(row.position, row.rank, index + 1)),
      total: numberOrNull(firstDefined(row.total, row.totalPoints, row.score)),
      category: nullableString(firstDefined(row.category, identity.category)),
      association: nullableString(firstDefined(row.association, identity.association)),
      teamId,
      participantId
    };
  });
  if (rawEntries.length > MAX_ARRAY_LENGTH) warnings.push("array-truncated:ranking.entries");

  const currentId = competition.scope === "individual" ? participant.id : team.id;
  const currentEntry = entries.find((entry) => hasValue(currentId) && String(entry.id) === String(currentId));
  return {
    scope: nullableString(firstDefined(rawRanking.scope, competition.scope)),
    type: nullableString(firstDefined(rawRanking.type, competition.type)),
    currentPosition: numberOrNull(firstDefined(rawRanking.currentPosition, currentEntry?.position)),
    previousPosition: numberOrNull(rawRanking.previousPosition),
    movement: nullableString(rawRanking.movement),
    total: numberOrNull(firstDefined(rawRanking.total, currentEntry?.total)),
    differenceToLeader: numberOrNull(rawRanking.differenceToLeader),
    entries
  };
}

function buildTimer(context, envelope, warnings) {
  const raw = firstRecord(context.timer, envelope.timer);
  return {
    id: nullableId(firstDefined(raw.id, raw.timerId)),
    value: numberOrNull(firstDefined(raw.value, raw.valueMs, raw.elapsedMs)),
    elapsed: numberOrNull(firstDefined(raw.elapsed, raw.elapsedMs)),
    remaining: numberOrNull(firstDefined(raw.remaining, raw.remainingMs)),
    running: booleanOrNull(raw.running),
    paused: booleanOrNull(raw.paused),
    startedAt: normalizeIsoDate(raw.startedAt),
    updatedAt: normalizeIsoDate(firstDefined(raw.updatedAt, raw.timestamp)),
    limit: numberOrNull(firstDefined(raw.limit, raw.limitMs)),
    status: nullableString(raw.status),
    display: nullableString(firstDefined(raw.display, raw.timeText, raw.valueText)),
    revision: finiteNumberOr(raw.revision, 0),
    source: cloneSerializable(raw.source, { warnings, path: "timer.source" }) ?? null
  };
}

function buildSponsor(context, envelope, warnings) {
  const rawValue = firstDefined(context.sponsor, envelope.sponsor, context.sponsors, envelope.sponsors);
  const raw = Array.isArray(rawValue) ? {} : firstRecord(rawValue);
  const list = Array.isArray(rawValue) ? rawValue : firstArray(raw.list, raw.sponsors);
  return {
    active: normalizeSponsor(firstDefined(raw.active, context.activeSponsor), warnings, "sponsor.active"),
    primary: normalizeSponsor(firstDefined(raw.primary, context.primarySponsor), warnings, "sponsor.primary"),
    list: list.slice(0, MAX_ARRAY_LENGTH).map((item, index) => normalizeSponsor(item, warnings, `sponsor.list.${index}`)).filter(Boolean)
  };
}

function normalizeSponsor(value, warnings, path) {
  if (!isRecord(value)) return null;
  return {
    id: nullableId(firstDefined(value.id, value.sponsorId)),
    name: nullableString(firstDefined(value.name, value.nombre)),
    logo: nullableString(firstDefined(value.logo, value.logoUrl)),
    website: nullableString(firstDefined(value.website, value.url)),
    campaign: nullableString(value.campaign),
    scope: nullableString(value.scope),
    priority: numberOrNull(value.priority),
    active: booleanOrNull(firstDefined(value.active, value.isActive)),
    metadata: cloneSerializable(value.metadata, { warnings, path: `${path}.metadata` }) ?? null
  };
}

function buildBranding(context, envelope, warnings) {
  const raw = firstRecord(context.branding, envelope.branding, context.graphicsConfig?.branding, envelope.graphicsConfig?.branding);
  return {
    themeId: nullableId(raw.themeId),
    primaryColor: nullableString(raw.primaryColor),
    secondaryColor: nullableString(raw.secondaryColor),
    accentColor: nullableString(raw.accentColor),
    backgroundColor: nullableString(raw.backgroundColor),
    textColor: nullableString(raw.textColor),
    logo: nullableString(firstDefined(raw.logo, raw.logoUrl)),
    watermark: nullableString(firstDefined(raw.watermark, raw.watermarkUrl)),
    typography: cloneSerializable(raw.typography, { warnings, path: "branding.typography" }) ?? null,
    backgrounds: cloneSerializable(raw.backgrounds, { warnings, path: "branding.backgrounds" }) ?? [],
    iconSet: nullableString(raw.iconSet)
  };
}

function buildProduction(context, envelope, options, warnings) {
  const raw = firstRecord(context.production, envelope.production);
  return {
    sessionId: nullableId(firstDefined(raw.sessionId, options.sessionId)),
    outputId: nullableId(firstDefined(raw.outputId, options.outputId)),
    outputType: nullableString(firstDefined(raw.outputType, options.outputType)),
    preview: cloneSerializable(raw.preview, { warnings, path: "production.preview" }) ?? null,
    program: cloneSerializable(raw.program, { warnings, path: "production.program" }) ?? null,
    activeGraphic: cloneSerializable(raw.activeGraphic, { warnings, path: "production.activeGraphic" }) ?? null,
    visibleGraphics: cloneSerializable(raw.visibleGraphics, { warnings, path: "production.visibleGraphics" }) ?? [],
    activeLayers: cloneSerializable(raw.activeLayers, { warnings, path: "production.activeLayers" }) ?? [],
    mode: nullableString(raw.mode),
    automationEnabled: booleanOrNull(raw.automationEnabled),
    operatorId: nullableId(raw.operatorId),
    operatorName: nullableString(raw.operatorName),
    status: nullableString(raw.status),
    liveChannel: nullableString(raw.liveChannel),
    currentTurnId: nullableId(raw.currentTurnId),
    currentTurnName: nullableString(raw.currentTurnName),
    updatedAt: normalizeIsoDate(raw.updatedAt)
  };
}

function buildSystem(context, envelope, options, generatedAt, warnings) {
  const raw = firstRecord(context.system, envelope.system);
  return {
    online: booleanOrNull(raw.online),
    firebaseConnected: booleanOrNull(raw.firebaseConnected),
    syncStatus: nullableString(raw.syncStatus),
    appVersion: nullableString(firstDefined(raw.appVersion, options.appVersion)),
    contractVersion: BROADCAST_DATA_CONTRACT_VERSION,
    sourceVersion: nullableString(firstDefined(raw.sourceVersion, context.sourceVersion, envelope.sourceVersion)),
    lastUpdate: normalizeIsoDate(firstDefined(raw.lastUpdate, context.production?.updatedAt, envelope.timestamp, generatedAt)),
    latency: numberOrNull(raw.latency),
    warnings: cloneStringArray(raw.warnings),
    errors: cloneStringArray(raw.errors),
    diagnostics: cloneSerializable(raw.diagnostics, { warnings, path: "system.diagnostics" }) ?? null
  };
}

function buildCustomFields(context, envelope) {
  const warnings = [];
  const raw = firstRecord(context.customFields, envelope.customFields);
  const value = Object.fromEntries(CUSTOM_FIELD_SCOPES.map((scope) => [scope, {}]));
  const knownScopeKeys = Object.keys(raw).filter((key) => CUSTOM_FIELD_SCOPES.includes(key));

  if (knownScopeKeys.length === 0 && Object.keys(raw).length > 0) {
    warnings.push("custom-fields-unscoped");
    value.global = normalizeCustomFieldScope(raw, "global", warnings);
    return { value, warnings };
  }

  CUSTOM_FIELD_SCOPES.forEach((scope) => {
    value[scope] = normalizeCustomFieldScope(raw[scope], scope, warnings);
  });
  return { value, warnings };
}

function normalizeCustomFieldScope(rawScope, scope, warnings) {
  if (rawScope === null || rawScope === undefined) return {};
  const entries = Array.isArray(rawScope)
    ? rawScope.map((field, index) => [field?.key || `field_${index + 1}`, field])
    : isRecord(rawScope)
      ? Object.entries(rawScope)
      : [];
  if (!entries.length && rawScope !== null && rawScope !== undefined && !isRecord(rawScope)) {
    warnings.push(`custom-fields-invalid-scope:${scope}`);
  }

  const output = {};
  entries.slice(0, MAX_ARRAY_LENGTH).forEach(([mapKey, rawField]) => {
    const key = String(firstDefined(rawField?.key, mapKey) || "").trim();
    if (!key || DANGEROUS_KEYS.has(key)) {
      warnings.push(`custom-field-key-invalid:${scope}`);
      return;
    }
    const definition = isRecord(rawField) && hasOwn(rawField, "value")
      ? rawField
      : isRecord(rawField) && hasOwn(rawField, "dataType")
        ? rawField
        : { value: rawField };
    const clonedValue = cloneSerializable(definition.value, {
      warnings,
      path: `customFields.${scope}.${key}.value`,
      maxDepth: MAX_CUSTOM_FIELD_DEPTH
    });
    const validation = cloneSerializable(definition.validation, {
      warnings,
      path: `customFields.${scope}.${key}.validation`,
      maxDepth: MAX_CUSTOM_FIELD_DEPTH
    });
    output[key] = {
      key,
      label: nullableString(definition.label),
      dataType: nullableString(definition.dataType) || inferDataType(clonedValue),
      value: clonedValue === undefined ? null : clonedValue,
      scope,
      visibility: normalizeVisibility(definition.visibility || "production"),
      description: nullableString(definition.description),
      source: nullableString(definition.source),
      required: booleanOrNull(definition.required) ?? false,
      defaultValue: cloneSerializable(definition.defaultValue, {
        warnings,
        path: `customFields.${scope}.${key}.defaultValue`,
        maxDepth: MAX_CUSTOM_FIELD_DEPTH
      }) ?? null,
      validation: isRecord(validation) ? validation : {}
    };
  });
  if (entries.length > MAX_ARRAY_LENGTH) warnings.push(`custom-fields-truncated:${scope}`);
  return output;
}

function buildLegacyAliases(contract) {
  return {
    teamName: contract.competition.scope === "team" ? contract.team.name : null,
    participantName: contract.participant.name,
    horseName: contract.horse.name,
    competitionType: contract.competition.type,
    competitionScope: contract.competition.scope,
    totalPoints: contract.score.total,
    timerValue: contract.timer.value
  };
}

function detectBroadcastWarnings(contract) {
  const warnings = [];
  if (!hasValue(contract.tournament?.id)) warnings.push("tournament-missing");
  if (!hasValue(contract.competition?.id)) warnings.push("competition-id-missing");
  if (contract.competition?.scope === "individual" && !hasIdentity(contract.participant)) {
    warnings.push("individual-participant-missing");
  }
  if (contract.competition?.scope === "team" && !hasIdentity(contract.team)) {
    warnings.push("team-missing");
  }
  if (!hasValue(contract.suerte?.id)) warnings.push("suerte-missing");
  if (hasScoreData(contract.score) && contract.score.total === null) warnings.push("score-incomplete");
  if (contract.contractVersion !== BROADCAST_DATA_CONTRACT_VERSION) warnings.push("contract-version-incompatible");
  if (contract.legacy?.used) warnings.push("legacy-context");
  if (contract.source?.freshness === "unknown") warnings.push("source-freshness-unknown");
  if (contract.source?.available === false) warnings.push("source-unavailable");

  const timerUpdatedAt = Date.parse(contract.timer?.updatedAt || "");
  const generatedAt = Date.parse(contract.generatedAt || "");
  if (Number.isFinite(timerUpdatedAt) && Number.isFinite(generatedAt) && generatedAt - timerUpdatedAt > TIMER_STALE_AFTER_MS) {
    warnings.push("timer-stale");
  }

  return uniqueStrings(warnings);
}

function filterCustomFieldsByVisibility(customFields, visibility) {
  const rank = VISIBILITY_RANK[visibility];
  const output = {};
  CUSTOM_FIELD_SCOPES.forEach((scope) => {
    const fields = isRecord(customFields?.[scope]) ? customFields[scope] : {};
    output[scope] = {};
    Object.entries(fields).forEach(([key, definition]) => {
      if (DANGEROUS_KEYS.has(key) || !isRecord(definition)) return;
      const fieldVisibility = normalizeVisibility(definition.visibility || "production");
      if (VISIBILITY_RANK[fieldVisibility] <= rank) output[scope][key] = definition;
    });
  });
  return output;
}

function resolveBroadcastPath(contract, path) {
  if (!isRecord(contract) && !Array.isArray(contract)) return { exists: false, value: undefined };
  if (typeof path !== "string" || !path.trim()) return { exists: false, value: undefined };
  const segments = path.split(".").filter(Boolean);
  let cursor = contract;
  for (const segment of segments) {
    if (DANGEROUS_KEYS.has(segment) || (typeof cursor !== "object" || cursor === null) || !hasOwn(cursor, segment)) {
      return { exists: false, value: undefined };
    }
    cursor = cursor[segment];
  }
  return { exists: true, value: cursor };
}

function collectFieldPaths(value, path, fields, seen, depth) {
  if (depth > MAX_CLONE_DEPTH || value === undefined || typeof value === "function") return;
  if (value === null || typeof value !== "object") {
    if (path) fields.add(path);
    return;
  }
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    if (path) fields.add(path);
    value.slice(0, MAX_ARRAY_LENGTH).forEach((item) => {
      collectFieldPaths(item, `${path}[]`, fields, seen, depth + 1);
    });
    return;
  }
  const keys = Object.keys(value).filter((key) => !DANGEROUS_KEYS.has(key));
  if (!keys.length && path) fields.add(path);
  keys.forEach((key) => collectFieldPaths(value[key], path ? `${path}.${key}` : key, fields, seen, depth + 1));
}

function filterBroadcastContractByVisibility(value, visibility, path) {
  if (path && !isPathVisibleAt(path, visibility)) return undefined;
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    const itemPath = `${path}[]`;
    return value.reduce((items, item) => {
      if (item === null || typeof item !== "object") {
        items.push(item);
        return items;
      }
      const filteredItem = filterBroadcastContractByVisibility(item, visibility, itemPath);
      if (filteredItem !== undefined) items.push(filteredItem);
      return items;
    }, []);
  }

  return Object.entries(value).reduce((output, [key, child]) => {
    if (DANGEROUS_KEYS.has(key)) return output;
    const childPath = path ? `${path}.${key}` : key;
    const filteredChild = filterBroadcastContractByVisibility(child, visibility, childPath);
    if (filteredChild !== undefined) output[key] = filteredChild;
    return output;
  }, {});
}

function isPathVisibleAt(path, visibility) {
  const fieldVisibility = resolveFieldVisibility(path);
  if (!fieldVisibility) return false;
  return VISIBILITY_RANK[fieldVisibility] <= VISIBILITY_RANK[normalizeVisibility(visibility)];
}

function resolveFieldVisibility(path) {
  if (hasOwn(FIELD_VISIBILITY, path)) return FIELD_VISIBILITY[path];
  let matchingSubtree = null;
  VISIBILITY_SUBTREE_PATHS.forEach((rootPath) => {
    const belongsToSubtree = path === rootPath
      || path.startsWith(`${rootPath}.`)
      || path.startsWith(`${rootPath}[`);
    if (belongsToSubtree && (!matchingSubtree || rootPath.length > matchingSubtree.length)) {
      matchingSubtree = rootPath;
    }
  });
  return matchingSubtree ? FIELD_VISIBILITY[matchingSubtree] : null;
}

function cloneSerializable(value, options = {}, seen = new WeakMap(), depth = 0) {
  const warnings = options.warnings || [];
  const path = options.path || "value";
  const maxDepth = Number.isFinite(options.maxDepth) ? options.maxDepth : MAX_CLONE_DEPTH;

  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return String(value);
  if (value === undefined) return undefined;
  if (typeof value === "function" || typeof value === "symbol") {
    warnings.push(`non-serializable-removed:${path}`);
    return undefined;
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (depth >= maxDepth) {
    warnings.push(`depth-limited:${path}`);
    return null;
  }
  if (typeof value !== "object") return null;
  if (seen.has(value)) {
    warnings.push(`circular-reference-removed:${path}`);
    return undefined;
  }

  if (Array.isArray(value)) {
    const output = [];
    seen.set(value, output);
    const limit = Math.min(value.length, MAX_ARRAY_LENGTH);
    for (let index = 0; index < limit; index += 1) {
      const cloned = cloneSerializable(value[index], { ...options, path: `${path}.${index}` }, seen, depth + 1);
      if (cloned !== undefined) output.push(cloned);
    }
    if (value.length > MAX_ARRAY_LENGTH) warnings.push(`array-truncated:${path}`);
    return output;
  }

  const output = {};
  seen.set(value, output);
  Object.keys(value).forEach((key) => {
    if (DANGEROUS_KEYS.has(key)) {
      warnings.push(`dangerous-key-removed:${path}.${key}`);
      return;
    }
    const cloned = cloneSerializable(value[key], { ...options, path: `${path}.${key}` }, seen, depth + 1);
    if (cloned !== undefined) output[key] = cloned;
  });
  return output;
}

function normalizeCompetitionSuerteIds(type, values) {
  const normalized = normalizeStringArray(values);
  const defaults = COMPETITION_DEFAULTS[type];
  if (!defaults) return normalized;
  const allowed = new Set(defaults.suerteIds);
  if (!normalized.length) return [...defaults.suerteIds];
  return normalized.filter((id) => allowed.has(id));
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function cloneArray(value) {
  if (Array.isArray(value)) return cloneSerializable(value, { warnings: [], path: "array" }) || [];
  if (isRecord(value)) return cloneSerializable(Object.values(value), { warnings: [], path: "array" }) || [];
  return [];
}

function cloneStringArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item)).slice(0, MAX_ARRAY_LENGTH) : [];
}

function selectSourceEnvelope(source) {
  if (!isRecord(source.broadcastContext)) return source;
  const selected = { broadcastContext: source.broadcastContext };
  const fallbackKeys = [
    "generatedAt",
    "timestamp",
    "sourceVersion",
    "revision",
    "tournament",
    "organization",
    "competition",
    "charreada",
    "participant",
    "team",
    "charro",
    "horse",
    "suerte",
    "score",
    "scoreDetail",
    "ranking",
    "timer",
    "sponsor",
    "sponsors",
    "branding",
    "production",
    "system",
    "customFields",
    "tournamentId",
    "tournamentName",
    "competitionType",
    "competitionScope",
    "competitionId",
    "participantId",
    "participantName",
    "teamId",
    "teamName",
    "horseName",
    "suerteId",
    "suerteName",
    "totalPoints"
  ];
  fallbackKeys.forEach((key) => {
    if (hasOwn(source, key)) selected[key] = source[key];
  });
  return selected;
}

function detectSourceType(envelope, context) {
  if (isRecord(envelope.broadcastContext)) return "livePayload";
  if (hasValue(context.contractVersion)) return "broadcastContract";
  const knownModules = ["tournament", "competition", "charreada", "participant", "team", "suerte", "score", "ranking", "timer"];
  return knownModules.some((key) => hasOwn(context, key)) ? "broadcastContext" : "legacyPartial";
}

function resolveFreshness(explicitValue, sourceGeneratedAt, nowValue, staleAfterMs) {
  const explicit = nullableString(explicitValue);
  if (["current", "stale", "unknown"].includes(explicit)) return explicit;
  const sourceTime = Date.parse(sourceGeneratedAt || "");
  const now = Date.parse(normalizeIsoDate(nowValue) || "");
  if (!Number.isFinite(sourceTime) || !Number.isFinite(now)) return "unknown";
  if (sourceTime - now > TIMER_STALE_AFTER_MS) return "unknown";
  const threshold = Number.isFinite(staleAfterMs) && staleAfterMs >= 0 ? staleAfterMs : TIMER_STALE_AFTER_MS;
  return now - sourceTime > threshold ? "stale" : "current";
}

function normalizeVisibility(value) {
  const normalized = String(value || "production").trim().toLowerCase();
  return VISIBILITIES.includes(normalized) ? normalized : "production";
}

function normalizeIsoDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isIsoDate(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function nullableString(value) {
  if (value === null || value === undefined) return null;
  return String(value);
}

function nullableId(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function finiteNumberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function inferDataType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value === "object" ? "object" : typeof value;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstRecord(...values) {
  return values.find((value) => isRecord(value)) || {};
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function hasIdentity(value) {
  return isRecord(value) && (hasValue(value.id) || hasValue(value.name));
}

function hasScoreData(score) {
  if (!isRecord(score)) return false;
  return [score.id, score.total, score.status, score.timestamp].some((value) => value !== null && value !== undefined);
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))];
}

function measureDepth(value, seen = new WeakSet(), depth = 0) {
  if (value === null || typeof value !== "object") return depth;
  if (seen.has(value)) return depth;
  seen.add(value);
  const children = Array.isArray(value) ? value : Object.values(value);
  return children.reduce((max, child) => Math.max(max, measureDepth(child, seen, depth + 1)), depth);
}

function containsDangerousKey(value, seen = new WeakSet(), depth = 0) {
  if (value === null || typeof value !== "object" || depth > MAX_CLONE_DEPTH || seen.has(value)) return false;
  seen.add(value);
  return Object.keys(value).some((key) => DANGEROUS_KEYS.has(key) || containsDangerousKey(value[key], seen, depth + 1));
}
