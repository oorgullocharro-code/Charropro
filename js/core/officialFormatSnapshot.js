import { validateScoringAttemptV2 } from "./scoringAttempt.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { FMCH_2026_CALA_INFR_RULES } from "../data/calaRules.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import {
  DOCUMENTED_CALA_BAD_POINT_CODES,
  buildCalaDocumentAbbreviationMatrix
} from "./officialFormatDocumentModel.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";

export const OFFICIAL_FORMAT_SNAPSHOT_VERSION = "1.2.0";

export const OFFICIAL_FORMAT_DOCUMENT_STATUSES = Object.freeze({
  READY: "READY",
  BLOCKED_SOURCE: "BLOCKED_SOURCE",
  BLOCKED_DOCUMENTAL: "BLOCKED_DOCUMENTAL"
});

export const OFFICIAL_FORMAT_DOCUMENT_PROFILE = deepFreeze({
  profileId: "FMCH_TEAM_SHEET_2024_2028",
  version: "1.0.0",
  scope: "DOCUMENT_VERSION_ONLY",
  default: false,
  futureValidityInferred: false,
  sourceDocument: {
    name: "HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028",
    url: "https://fmcharreria.org.mx/wp-content/uploads/HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028.pdf",
    sha256: "3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7",
    page: 1
  },
  sourceRaster: {
    path: "tools/fmch-judge-questionnaire/assets/official-sheet-full.png",
    sha256: "c6be367e02a182fd8d2c116cce77e627cc890cc0c98d987073eff31a3e727a5f",
    width: 1224,
    height: 1931
  },
  calaBadPointCodes: DOCUMENTED_CALA_BAD_POINT_CODES,
  fields: [
    {
      fieldId: "FMCH.TEAM_SHEET.HEADER.FEDERATION_LOGO",
      type: "IMAGE",
      value: "assets/fmch/official-format-2024-2028/fmch-emblem.png",
      sha256: "f76354074a3ec45cd731c95e52439a8f8806a7bdeb0aa92f2eff117ae7b0ab56",
      sourceCrop: { x: 45, y: 22, width: 150, height: 150 }
    },
    {
      fieldId: "FMCH.TEAM_SHEET.FOOTER.CONADE_LOGO",
      type: "IMAGE",
      value: "assets/fmch/official-format-2024-2028/conade-lockup.png",
      sha256: "56c192cad952528d60b9e312033ca68246eb9b63a9a01196ef0b4816bede42b5",
      sourceCrop: { x: 63, y: 1828, width: 170, height: 88 }
    },
    {
      fieldId: "FMCH.TEAM_SHEET.FOOTER.CONADE_NAME",
      type: "STRING",
      value: "Comisión Nacional de Cultura Física y Deporte"
    },
    {
      fieldId: "FMCH.TEAM_SHEET.FOOTER.SPORTS_SECRETARIAT_PERIOD",
      type: "STRING",
      value: "SECRETARÍA DEL DEPORTE 2024 - 2028"
    },
    {
      fieldId: "FMCH.TEAM_SHEET.FOOTER.INSTITUTIONAL_QUOTE",
      type: "STRING",
      value: "Charrería, Tradición Ecuestre en México. Patrimonio Cultural Inmaterial de la Humanidad"
    }
  ]
});

export const OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_FIELDS = Object.freeze(
  OFFICIAL_FORMAT_DOCUMENT_PROFILE.fields.map((field) => field.fieldId)
);

export const OFFICIAL_FORMAT_UNSUPPORTED_DOCUMENTAL_FIELDS = Object.freeze([]);

export const OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_REVIEWS = deepFreeze([
  {
    fieldId: "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL",
    resolution: "certified-document-control-in-pdf-order"
  },
  {
    fieldId: "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
    resolution: "blank-administrative-row-without-competitor-or-attempt"
  },
  {
    fieldId: "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04",
    resolution: "blank-document-control-without-canonical-source"
  },
  {
    fieldId: "FMCH.TEAM_SHEET.SIGNATURES",
    resolution: "four-manual-fields-in-certified-pdf-order"
  }
]);

export const OFFICIAL_FORMAT_DOCUMENTAL_REVIEW_ITEMS = Object.freeze([]);

const OFFICIAL_FORMAT_MANUAL_FIELDS = Object.freeze([
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_01",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_02",
  "FMCH.TEAM_SHEET.SIGNATURES.JUDGE_03",
  "FMCH.TEAM_SHEET.SIGNATURES.CAPTAIN"
]);

const SECTION_BY_SUERTE = Object.freeze({
  cala: "cala",
  piales: "piales",
  colas: "coleadero",
  toro: "toro",
  lazo: "terna",
  pial_ruedo: "terna",
  yegua: "yegua",
  manganas_pie: "manganasPie",
  manganas_caballo: "manganasCaballo",
  paso: "paso"
});

const SECTION_ORDER = Object.freeze([
  "cala",
  "piales",
  "coleadero",
  "toro",
  "terna",
  "yegua",
  "manganasPie",
  "manganasCaballo",
  "paso"
]);

const REQUIRED_SUERTE_COMPONENTS = Object.freeze({
  terna: Object.freeze(["lazo", "pial_ruedo"])
});

const TIME_POINT_RULE_IDS = Object.freeze({
  toro: Object.freeze(["toro_adic_tiempo_ahorrado"]),
  lazo: Object.freeze(["lazo_adic_tiempo_no_usado"]),
  pial_ruedo: Object.freeze(["pial_ruedo_adic_tiempo_no_usado"]),
  yegua: Object.freeze(["yegua_adic_tiempo_ahorrado"]),
  manganas_pie: Object.freeze(["manganas_pie_adic_tiempo_no_usado"]),
  manganas_caballo: Object.freeze(["manganas_caballo_adic_tiempo_no_usado"])
});

const POST_INFRACTION_CONTROL_FIELD_IDS = Object.freeze({
  piales: Object.freeze([
    "FMCH.TEAM_SHEET.PIALES.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.PIALES.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.PIALES.POST_INFRACTION_CONTROL_03"
  ]),
  coleadero: Object.freeze([
    "FMCH.TEAM_SHEET.COLEADERO.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.COLEADERO.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.COLEADERO.POST_INFRACTION_CONTROL_03"
  ]),
  toro: Object.freeze([
    "FMCH.TEAM_SHEET.JINETEO_TORO.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.JINETEO_TORO.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.JINETEO_TORO.POST_INFRACTION_CONTROL_03"
  ]),
  terna: Object.freeze([
    "FMCH.TEAM_SHEET.TERNA.AUXILIARY_CONTROL_01",
    "FMCH.TEAM_SHEET.TERNA.AUXILIARY_CONTROL_02",
    "FMCH.TEAM_SHEET.TERNA.AUXILIARY_CONTROL_03"
  ]),
  yegua: Object.freeze([
    "FMCH.TEAM_SHEET.JINETEO_YEGUA.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.JINETEO_YEGUA.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.JINETEO_YEGUA.POST_INFRACTION_CONTROL_03"
  ]),
  manganasPie: Object.freeze([
    "FMCH.TEAM_SHEET.MANGANAS_PIE.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.MANGANAS_PIE.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.MANGANAS_PIE.POST_INFRACTION_CONTROL_03"
  ]),
  manganasCaballo: Object.freeze([
    "FMCH.TEAM_SHEET.MANGANAS_CABALLO.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.MANGANAS_CABALLO.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.MANGANAS_CABALLO.POST_INFRACTION_CONTROL_03"
  ]),
  paso: Object.freeze([
    "FMCH.TEAM_SHEET.PASO.POST_INFRACTION_CONTROL_01",
    "FMCH.TEAM_SHEET.PASO.POST_INFRACTION_CONTROL_02",
    "FMCH.TEAM_SHEET.PASO.POST_INFRACTION_CONTROL_03"
  ])
});

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 24;
const MAX_ARRAY = 1000;
const MAX_KEYS = 2000;
const MAX_STRING = 20000;
const CALA_DOCUMENT_ABBREVIATIONS = buildCalaDocumentAbbreviationMatrix(FMCH_2026_CALA_INFR_RULES);
const CALA_DOCUMENT_ABBREVIATION_BY_RULE_ID = new Map(
  CALA_DOCUMENT_ABBREVIATIONS.map((item) => [item.ruleId, item])
);

export function createOfficialFormatSnapshot(source = {}, options = {}) {
  const generatedAt = normalizeIso(options.generatedAt) || new Date().toISOString();
  const tournament = safeClone(source.tournament || {});
  const charreada = safeClone(source.charreada || {});
  const team = safeClone(source.team || {});
  const tournamentId = cleanId(options.tournamentId || tournament.id);
  const charreadaId = cleanId(options.charreadaId || charreada.id);
  const teamId = cleanId(options.teamId || team.id);
  const errors = [];
  const warnings = [];

  if (!tournamentId) errors.push("official-format-tournament-required");
  if (!charreadaId) errors.push("official-format-charreada-required");
  if (!teamId) errors.push("official-format-team-required");
  if (tournament.id && tournament.id !== tournamentId) errors.push("official-format-tournament-mismatch");
  if (charreada.id && charreada.id !== charreadaId) errors.push("official-format-charreada-mismatch");
  if (charreada.tournamentId && charreada.tournamentId !== tournamentId) errors.push("official-format-charreada-tournament-mismatch");
  if (team.id && team.id !== teamId) errors.push("official-format-team-mismatch");
  if (team.tournamentId && team.tournamentId !== tournamentId) errors.push("official-format-team-tournament-mismatch");

  const allRecords = collectOfficialRecords(source.officialScores, source.officialScoreLedger);
  const scopedRecords = allRecords.filter((record) => recordMatches(record, { tournamentId, charreadaId, teamId }));
  const selectedRecords = selectOfficialRecords(scopedRecords, source.officialScoreLedger, options, errors, warnings);
  const attempts = selectedRecords
    .map((record) => buildSnapshotAttempt(record, { tournamentId, charreadaId, teamId }, errors, warnings))
    .filter(Boolean)
    .sort(compareAttempts);

  if (!attempts.length) errors.push("official-format-no-official-scores");
  validateRequiredSuertes(charreada, attempts, errors);
  const ruleProfile = resolveRuleProfile(tournament, attempts, errors, warnings);
  const suertes = buildSections(attempts);
  validateSemanticSources(suertes, errors, warnings);
  const sourceOfficialScoreIds = attempts.map((attempt) => attempt.officialScoreId);
  const sourceAttemptKeys = attempts.map((attempt) => attempt.attemptKey);
  const officialScoreTotal = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const teamPenaltyTotal = attempts.reduce((sum, attempt) => sum + attempt.teamBadPoints, 0);
  const individualBadPoints = attempts.reduce((sum, attempt) => sum + attempt.individualBadPoints, 0);
  const finalScore = attempts.reduce((sum, attempt) => sum + attempt.teamAdjustedTotal, 0);
  const controlValues = buildControls({ suertes, officialScoreTotal, teamPenaltyTotal, finalScore, errors });
  const documentalControls = buildDocumentalControls(suertes);
  const sourceRevision = buildSourceRevision(attempts);
  const documentStatus = errors.length
    ? OFFICIAL_FORMAT_DOCUMENT_STATUSES.BLOCKED_SOURCE
    : OFFICIAL_FORMAT_UNSUPPORTED_DOCUMENTAL_FIELDS.length || OFFICIAL_FORMAT_DOCUMENTAL_REVIEW_ITEMS.length
      ? OFFICIAL_FORMAT_DOCUMENT_STATUSES.BLOCKED_DOCUMENTAL
      : OFFICIAL_FORMAT_DOCUMENT_STATUSES.READY;

  if (OFFICIAL_FORMAT_UNSUPPORTED_DOCUMENTAL_FIELDS.length) {
    warnings.push("official-format-unsupported-documental-fields");
  }
  if (OFFICIAL_FORMAT_DOCUMENTAL_REVIEW_ITEMS.length) {
    warnings.push("official-format-documental-review-required");
  }

  const snapshotBase = {
    schemaVersion: OFFICIAL_FORMAT_SNAPSHOT_VERSION,
    tournamentId,
    charreadaId,
    teamId,
    generatedAt,
    sourceRevision,
    documentAuthority: safeClone(OFFICIAL_FORMAT_DOCUMENT_PROFILE),
    institutionalFields: safeClone(OFFICIAL_FORMAT_DOCUMENT_PROFILE.fields),
    resolvedDocumentalFields: [...OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_FIELDS],
    ruleProfile,
    eventMetadata: {
      name: text(tournament.name),
      season: text(tournament.season),
      type: text(tournament.type),
      category: text(team.category || tournament.category),
      competitionId: text(charreada.competitionId || charreada.competitionType),
      charreadaName: text(charreada.name),
      charreadaStatus: text(charreada.status)
    },
    teamMetadata: {
      name: text(team.name),
      association: text(team.association),
      participantName: text(team.participantName),
      horseName: text(team.horseName),
      roster: safeClone(team.roster || {})
    },
    captain: text(team.captain),
    location: text(tournament.venue || charreada.venue),
    date: text(charreada.date || tournament.date),
    time: text(charreada.startTime),
    suertes,
    teamInfractions: attempts.flatMap((attempt) => attempt.teamInfractions.map((item) => ({
      ...safeClone(item),
      officialScoreId: attempt.officialScoreId,
      attemptKey: attempt.attemptKey,
      suerteId: attempt.suerteId
    }))),
    badPoints: {
      individual: individualBadPoints,
      team: teamPenaltyTotal,
      total: individualBadPoints + teamPenaltyTotal
    },
    controlValues,
    documentalControls,
    officialScoreTotal,
    finalScore,
    sourceOfficialScoreIds,
    sourceAttemptKeys,
    unsupportedDocumentalFields: [...OFFICIAL_FORMAT_UNSUPPORTED_DOCUMENTAL_FIELDS],
    resolvedDocumentalReviews: safeClone(OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_REVIEWS),
    documentalReviewItems: safeClone(OFFICIAL_FORMAT_DOCUMENTAL_REVIEW_ITEMS),
    manualFields: [...OFFICIAL_FORMAT_MANUAL_FIELDS],
    warnings: unique(warnings),
    errors: unique(errors),
    documentStatus
  };
  const snapshotId = `official-format-${stableDigest(snapshotBase)}`;
  return deepFreeze({ snapshotId, ...snapshotBase });
}

export function validateOfficialFormatSnapshot(snapshot = {}) {
  const errors = [];
  if (snapshot.schemaVersion !== OFFICIAL_FORMAT_SNAPSHOT_VERSION) errors.push("official-format-schema-version-invalid");
  for (const field of ["snapshotId", "tournamentId", "charreadaId", "teamId", "generatedAt", "sourceRevision"]) {
    if (!snapshot[field]) errors.push(`official-format-${field}-required`);
  }
  if (!SECTION_ORDER.every((key) => snapshot.suertes?.[key])) errors.push("official-format-sections-incomplete");
  if (snapshot.documentAuthority?.profileId !== OFFICIAL_FORMAT_DOCUMENT_PROFILE.profileId) {
    errors.push("official-format-document-profile-invalid");
  }
  if (snapshot.documentAuthority?.sourceDocument?.sha256 !== OFFICIAL_FORMAT_DOCUMENT_PROFILE.sourceDocument.sha256) {
    errors.push("official-format-document-source-sha256-invalid");
  }
  const institutionalFieldIds = new Set((snapshot.institutionalFields || []).map((field) => field?.fieldId));
  for (const fieldId of OFFICIAL_FORMAT_RESOLVED_DOCUMENTAL_FIELDS) {
    if (!institutionalFieldIds.has(fieldId)) errors.push(`official-format-institutional-field-missing:${fieldId}`);
  }
  const calaControl = snapshot.documentalControls?.calaSideBadPointsSumControl;
  const expectedCalaBadPoints = (snapshot.suertes?.cala?.attempts || [])
    .reduce((sum, attempt) => sum + finite(attempt.individualBadPoints), 0)
    + finite(snapshot.suertes?.cala?.teamPenaltyTotal);
  if (calaControl?.fieldId !== "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL") {
    errors.push("official-format-cala-side-control-invalid");
  }
  if (finite(calaControl?.value) !== expectedCalaBadPoints || calaControl?.affectsScore !== false) {
    errors.push("official-format-cala-side-control-value-invalid");
  }
  const sectionBadPoints = snapshot.documentalControls?.badPointsBySection || {};
  const expectedBadPointsControlTotal = SECTION_ORDER.reduce((sum, sectionId) => {
    const sectionExpected = (snapshot.suertes?.[sectionId]?.attempts || [])
      .reduce((sectionSum, attempt) => sectionSum + finite(attempt.individualBadPoints), 0)
      + finite(snapshot.suertes?.[sectionId]?.teamPenaltyTotal);
    const control = sectionBadPoints[sectionId];
    if (finite(control?.value) !== sectionExpected || control?.affectsScore !== false) {
      errors.push(`official-format-${sectionId}-bad-points-control-invalid`);
    }
    return sum + sectionExpected;
  }, 0);
  if (finite(snapshot.documentalControls?.badPointsControlTotal?.value) !== expectedBadPointsControlTotal
    || snapshot.documentalControls?.badPointsControlTotal?.affectsScore !== false) {
    errors.push("official-format-bad-points-control-total-invalid");
  }
  let previousAccumulatedTotal = 0;
  for (const sectionId of SECTION_ORDER) {
    const control = snapshot.documentalControls?.accumulatedBySection?.[sectionId];
    const currentSuerteTotal = finite(snapshot.suertes?.[sectionId]?.teamAdjustedTotal);
    const newAccumulatedTotal = previousAccumulatedTotal + currentSuerteTotal;
    if (finite(control?.previousTotal) !== previousAccumulatedTotal
      || finite(control?.currentSuerteTotal) !== currentSuerteTotal
      || finite(control?.newAccumulatedTotal) !== newAccumulatedTotal
      || control?.affectsScore !== false) {
      errors.push(`official-format-${sectionId}-accumulated-control-invalid`);
    }
    previousAccumulatedTotal = newAccumulatedTotal;
  }
  if (previousAccumulatedTotal !== finite(snapshot.finalScore)) errors.push("official-format-final-accumulated-control-invalid");
  const coleaderoRow = snapshot.documentalControls?.coleaderoAdministrativeRow;
  if (coleaderoRow?.competitorId !== null || coleaderoRow?.attemptId !== null || coleaderoRow?.affectsScore !== false) {
    errors.push("official-format-coleadero-administrative-row-invalid");
  }
  const coleaderoControl = snapshot.documentalControls?.coleaderoBottomControl04;
  if (coleaderoControl?.value !== null || coleaderoControl?.canonicalSourceAvailable !== false) {
    errors.push("official-format-coleadero-bottom-control-invalid");
  }
  if ((snapshot.documentalControls?.signatures || []).map((item) => item.label).join("|") !== "JUEZ|JUEZ|JUEZ|CAPITÁN") {
    errors.push("official-format-signature-order-invalid");
  }
  if (Array.isArray(snapshot.errors) && snapshot.errors.length) errors.push("official-format-source-blocked");
  const attempts = SECTION_ORDER.flatMap((key) => snapshot.suertes?.[key]?.attempts || []);
  const officialTotal = attempts.reduce((sum, attempt) => sum + finite(attempt.total), 0);
  const teamPenaltyTotal = attempts.reduce((sum, attempt) => sum + finite(attempt.teamBadPoints), 0);
  if (officialTotal !== finite(snapshot.officialScoreTotal)) errors.push("official-format-official-total-mismatch");
  const frozenFinal = attempts.reduce((sum, attempt) => sum + finite(attempt.teamAdjustedTotal), 0);
  if (frozenFinal !== finite(snapshot.finalScore)) errors.push("official-format-final-score-mismatch");
  return {
    valid: errors.length === 0,
    errors: unique(errors),
    warnings: Array.isArray(snapshot.warnings) ? [...snapshot.warnings] : [],
    schemaVersion: OFFICIAL_FORMAT_SNAPSHOT_VERSION
  };
}

function collectOfficialRecords(officialScores, ledgerRegistry) {
  const records = [];
  appendRecordCollection(records, officialScores);
  for (const ledger of objectValues(ledgerRegistry)) appendRecordCollection(records, ledger?.records);
  const byId = new Map();
  for (const record of records) {
    const id = cleanId(record?.id);
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing || finite(record.revision) >= finite(existing.revision)) byId.set(id, safeClone(record));
  }
  return [...byId.values()];
}

function appendRecordCollection(target, collection) {
  if (Array.isArray(collection)) {
    for (const item of collection) if (item && typeof item === "object") target.push(item);
    return;
  }
  for (const item of objectValues(collection)) if (item && typeof item === "object") target.push(item);
}

function selectOfficialRecords(records, ledgerRegistry, options, errors, warnings) {
  const requestedIds = new Set([
    ...(Array.isArray(options.officialScoreIds) ? options.officialScoreIds : []),
    ...objectValues(options.officialScoreIdsByAttempt)
  ].map(cleanId).filter(Boolean));
  if (requestedIds.size) {
    const selected = records.filter((record) => requestedIds.has(cleanId(record.id)));
    for (const id of requestedIds) {
      if (!selected.some((record) => record.id === id)) errors.push(`official-format-record-not-found:${id}`);
    }
    const counts = new Map();
    for (const record of selected) {
      const attemptKey = text(record.attemptKey) || deriveAttemptKey(record);
      counts.set(attemptKey, (counts.get(attemptKey) || 0) + 1);
    }
    for (const [attemptKey, count] of counts) {
      if (attemptKey && count > 1) errors.push(`official-format-multiple-selected-records:${attemptKey}`);
    }
    return selected;
  }

  const ledgerActiveIds = new Set(objectValues(ledgerRegistry).map((ledger) => cleanId(ledger?.activeRecordId)).filter(Boolean));
  const grouped = new Map();
  for (const record of records) {
    const attemptKey = text(record.attemptKey) || deriveAttemptKey(record);
    if (!attemptKey) {
      warnings.push(`official-format-record-attempt-key-missing:${text(record.id)}`);
      continue;
    }
    if (!grouped.has(attemptKey)) grouped.set(attemptKey, []);
    grouped.get(attemptKey).push(record);
  }

  const selected = [];
  for (const [attemptKey, candidates] of grouped) {
    const ledgerCandidates = candidates.filter((record) => ledgerActiveIds.has(record.id));
    const activeCandidates = candidates.filter(isActiveOfficialRecord);
    const pool = ledgerCandidates.length ? ledgerCandidates : activeCandidates;
    if (pool.length !== 1) {
      errors.push(pool.length ? `official-format-multiple-active-records:${attemptKey}` : `official-format-active-record-missing:${attemptKey}`);
      continue;
    }
    selected.push(pool[0]);
  }
  return selected;
}

function buildSnapshotAttempt(record, scope, errors, warnings) {
  const recordId = cleanId(record.id);
  const ids = getRecordIds(record);
  if (ids.tournamentId !== scope.tournamentId || ids.charreadaId !== scope.charreadaId || ids.teamId !== scope.teamId) return null;
  const attemptV2 = record.breakdown?.attemptV2;
  if (!attemptV2) {
    errors.push(`official-format-attempt-v2-required:${recordId}`);
    return buildBlockedLegacyAttempt(record, ids);
  }
  const validation = validateScoringAttemptV2(attemptV2, { requireOfficial: true });
  if (!validation.valid) {
    for (const error of validation.errors) errors.push(`official-format-attempt-v2-invalid:${recordId}:${error}`);
  }
  const identity = attemptV2.identity || {};
  for (const [field, expected] of Object.entries({
    tournamentId: scope.tournamentId,
    charreadaId: scope.charreadaId,
    teamId: scope.teamId,
    suerteId: ids.suerteId
  })) {
    if (expected && identity[field] !== expected) errors.push(`official-format-attempt-identity-mismatch:${recordId}:${field}`);
  }
  const scoring = attemptV2.scoring || {};
  const recordTotal = finite(record.total, NaN);
  const frozenTotal = finite(scoring.netAttemptPoints, NaN);
  if (!Number.isFinite(recordTotal)) errors.push(`official-format-record-total-invalid:${recordId}`);
  if (!Number.isFinite(frozenTotal)) errors.push(`official-format-attempt-total-invalid:${recordId}`);
  if (recordTotal !== frozenTotal) errors.push(`official-format-official-attempt-total-mismatch:${recordId}`);
  if (record.breakdown?.total !== undefined && finite(record.breakdown.total, NaN) !== frozenTotal) {
    errors.push(`official-format-breakdown-total-mismatch:${recordId}`);
  }
  if (record.breakdown?.teamAdjustedTotal !== undefined
    && finite(record.breakdown.teamAdjustedTotal, NaN) !== finite(scoring.teamAdjustedPoints, NaN)) {
    errors.push(`official-format-breakdown-team-adjusted-mismatch:${recordId}`);
  }
  const recordProfile = record.breakdown?.rulebook || {};
  const attemptProfile = attemptV2.context || {};
  if (recordProfile.ruleProfileId && attemptProfile.ruleProfileId && recordProfile.ruleProfileId !== attemptProfile.ruleProfileId) {
    errors.push(`official-format-rule-profile-mismatch:${recordId}`);
  }
  if (recordProfile.ruleProfileVersion && attemptProfile.ruleProfileVersion && recordProfile.ruleProfileVersion !== attemptProfile.ruleProfileVersion) {
    errors.push(`official-format-rule-profile-version-mismatch:${recordId}`);
  }
  if (!attemptProfile.effectiveRulesFingerprint) warnings.push(`official-format-effective-fingerprint-missing:${recordId}`);

  return {
    officialScoreId: recordId,
    attemptKey: text(record.attemptKey) || deriveAttemptKey(record),
    revision: Math.max(0, finite(record.revision)),
    publishedAt: normalizeIso(record.publishedAt || record.updatedAt || record.createdAt),
    officialStatus: text(record.officialStatus || record.status || "active"),
    suerteId: ids.suerteId,
    suerteName: text(record.suerte?.fullName || record.suerte?.name),
    attemptIndex: Math.max(0, finite(record.attemptIndex)),
    coleadorIndex: Math.max(0, finite(record.coleadorIndex)),
    participantId: text(identity.participantId),
    participantSlot: Number.isInteger(identity.participantSlot) && identity.participantSlot >= 0
      ? identity.participantSlot
      : null,
    charro: text(record.charro || attemptV2.context?.participantName),
    opportunity: safeClone(attemptV2.sportState?.opportunity || {}),
    classification: safeClone(attemptV2.sportState?.classification || {}),
    sportStatus: text(attemptV2.sportState?.status),
    baseSelection: safeClone(scoring.baseSelection),
    additionalSelections: safeClone(scoring.additionalSelections || []),
    calculationDetail: safeClone(scoring.calculationDetail || []),
    infractions: safeClone(attemptV2.infractions || []),
    teamInfractions: safeClone(attemptV2.teamInfractions || []),
    timing: safeClone(attemptV2.timing || {}),
    sportState: safeClone(attemptV2.sportState || {}),
    documentalEvidence: buildDocumentalAttemptEvidence(attemptV2, scoring),
    note: text(attemptV2.note),
    goodPoints: finite(scoring.goodPoints),
    individualBadPoints: finite(scoring.individualBadPoints),
    teamBadPoints: finite(scoring.teamBadPoints),
    total: recordTotal,
    teamAdjustedTotal: finite(scoring.teamAdjustedPoints),
    ruleProfileId: text(attemptProfile.ruleProfileId || recordProfile.ruleProfileId),
    ruleProfileVersion: text(attemptProfile.ruleProfileVersion || recordProfile.ruleProfileVersion),
    effectiveRulesFingerprint: text(attemptProfile.effectiveRulesFingerprint),
    ruleSource: safeClone(recordProfile),
    frozenValues: {
      recordTotal,
      scoring: safeClone(scoring),
      breakdown: safeClone(record.breakdown || {})
    },
    sourceType: "OFFICIAL_SCORE_ATTEMPT_V2"
  };
}

function buildBlockedLegacyAttempt(record, ids) {
  return {
    officialScoreId: cleanId(record.id),
    attemptKey: text(record.attemptKey) || deriveAttemptKey(record),
    revision: Math.max(0, finite(record.revision)),
    publishedAt: normalizeIso(record.publishedAt || record.updatedAt || record.createdAt),
    officialStatus: text(record.officialStatus || record.status),
    suerteId: ids.suerteId,
    suerteName: text(record.suerte?.fullName || record.suerte?.name),
    attemptIndex: Math.max(0, finite(record.attemptIndex)),
    coleadorIndex: Math.max(0, finite(record.coleadorIndex)),
    charro: text(record.charro),
    opportunity: {},
    classification: {},
    sportStatus: "",
    baseSelection: null,
    additionalSelections: [],
    calculationDetail: [],
    infractions: [],
    teamInfractions: [],
    timing: {},
    sportState: {},
    documentalEvidence: {
      badPointSlots: [],
      cala: null,
      paso: null,
      remate: null,
      officialTime: null
    },
    note: "",
    goodPoints: 0,
    individualBadPoints: 0,
    teamBadPoints: 0,
    total: finite(record.total),
    teamAdjustedTotal: finite(record.total),
    ruleProfileId: text(record.breakdown?.rulebook?.ruleProfileId),
    ruleProfileVersion: text(record.breakdown?.rulebook?.ruleProfileVersion),
    effectiveRulesFingerprint: "",
    ruleSource: safeClone(record.breakdown?.rulebook || {}),
    frozenValues: { recordTotal: finite(record.total), scoring: null, breakdown: safeClone(record.breakdown || {}) },
    sourceType: "OFFICIAL_SCORE_LEGACY_BLOCKED"
  };
}

function buildSections(attempts) {
  const result = {};
  for (const key of SECTION_ORDER) result[key] = buildSection(key, []);
  for (const attempt of attempts) {
    const key = SECTION_BY_SUERTE[attempt.suerteId];
    if (key) result[key].attempts.push(attempt);
  }
  for (const key of SECTION_ORDER) result[key] = buildSection(key, result[key].attempts.sort(compareAttempts));
  return result;
}

function buildSection(id, attempts) {
  const total = attempts.reduce((sum, attempt) => sum + finite(attempt.total), 0);
  const teamPenaltyTotal = attempts.reduce((sum, attempt) => sum + finite(attempt.teamBadPoints), 0);
  const teamAdjustedTotal = attempts.reduce((sum, attempt) => sum + finite(attempt.teamAdjustedTotal), 0);
  return {
    id,
    attempts,
    officialScoreTotal: total,
    total,
    teamPenaltyTotal,
    teamAdjustedTotal,
    sourceOfficialScoreIds: attempts.map((attempt) => attempt.officialScoreId),
    sourceAttemptKeys: attempts.map((attempt) => attempt.attemptKey)
  };
}

function resolveRuleProfile(tournament, attempts, errors, warnings) {
  const assignment = tournament.ruleProfileAssignment || {};
  const profileId = text(assignment.profileId || tournament.ruleProfileId || tournament.info?.ruleProfileId);
  const version = text(assignment.version || tournament.ruleProfileVersion || tournament.info?.ruleProfileVersion);
  const fingerprint = text(assignment.contentFingerprint || tournament.ruleProfileContentFingerprint || tournament.info?.ruleProfileContentFingerprint);
  const attemptProfiles = unique(attempts.map((attempt) => `${attempt.ruleProfileId}@${attempt.ruleProfileVersion}`).filter((item) => item !== "@"));
  if (attemptProfiles.length > 1) errors.push("official-format-multiple-rule-profiles");
  for (const attempt of attempts) {
    if (profileId && attempt.ruleProfileId && profileId !== attempt.ruleProfileId) errors.push(`official-format-tournament-profile-mismatch:${attempt.officialScoreId}`);
    if (version && attempt.ruleProfileVersion && version !== attempt.ruleProfileVersion) errors.push(`official-format-tournament-profile-version-mismatch:${attempt.officialScoreId}`);
  }
  if (!profileId || !version) warnings.push("official-format-rule-profile-identity-incomplete");
  return {
    profileId: profileId || attempts[0]?.ruleProfileId || "",
    version: version || attempts[0]?.ruleProfileVersion || "",
    fingerprint,
    effectiveAttemptFingerprints: unique(attempts.map((attempt) => attempt.effectiveRulesFingerprint).filter(Boolean)),
    assignmentRevision: Math.max(0, finite(assignment.revision || tournament.ruleProfileAssignmentRevision)),
    status: text(assignment.status || tournament.ruleProfileStatus || tournament.info?.ruleProfileStatus)
  };
}

function buildControls({ suertes, officialScoreTotal, teamPenaltyTotal, finalScore, errors }) {
  const sectionTotal = SECTION_ORDER.reduce((sum, key) => sum + finite(suertes[key].total), 0);
  const expectedFinal = sectionTotal - teamPenaltyTotal;
  if (sectionTotal !== officialScoreTotal) errors.push("official-format-section-control-mismatch");
  if (expectedFinal !== finalScore) errors.push("official-format-final-control-mismatch");
  return {
    sectionTotal,
    officialScoreTotal,
    teamPenaltyTotal,
    finalScore,
    sectionControlMatches: sectionTotal === officialScoreTotal,
    finalControlMatches: expectedFinal === finalScore
  };
}

function buildDocumentalControls(suertes) {
  const badPointsBySection = Object.fromEntries(SECTION_ORDER.map((sectionId) => [
    sectionId,
    {
      sectionId,
      individualBadPoints: (suertes[sectionId]?.attempts || [])
        .reduce((sum, attempt) => sum + finite(attempt.individualBadPoints), 0),
      teamPenaltyTotal: finite(suertes[sectionId]?.teamPenaltyTotal),
      value: (suertes[sectionId]?.attempts || [])
        .reduce((sum, attempt) => sum + finite(attempt.individualBadPoints), 0)
        + finite(suertes[sectionId]?.teamPenaltyTotal),
      source: "FROZEN_OFFICIAL_ATTEMPT_V2",
      affectsScore: false
    }
  ]));
  const badPointsControlTotal = Object.values(badPointsBySection)
    .reduce((sum, control) => sum + finite(control.value), 0);
  let accumulatedTotal = 0;
  const accumulatedBySection = {};
  for (const sectionId of SECTION_ORDER) {
    const previousTotal = accumulatedTotal;
    const currentSuerteTotal = finite(suertes[sectionId]?.teamAdjustedTotal);
    const newAccumulatedTotal = previousTotal + currentSuerteTotal;
    accumulatedBySection[sectionId] = {
      sectionId,
      previousTotal,
      currentSuerteTotal,
      newAccumulatedTotal,
      fieldIds: POST_INFRACTION_CONTROL_FIELD_IDS[sectionId] || [],
      source: "FROZEN_OFFICIAL_ATTEMPT_V2_TEAM_ADJUSTED_TOTAL",
      affectsScore: false
    };
    accumulatedTotal = newAccumulatedTotal;
  }
  return {
    calaSideBadPointsSumControl: {
      fieldId: "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL",
      classification: "DOCUMENT_CONTROL",
      visualOrder: 9,
      source: "FROZEN_OFFICIAL_ATTEMPT_V2",
      individualBadPoints: badPointsBySection.cala.individualBadPoints,
      teamPenaltyTotal: badPointsBySection.cala.teamPenaltyTotal,
      value: badPointsBySection.cala.value,
      affectsScore: false
    },
    badPointsBySection,
    accumulatedBySection,
    badPointsControlTotal: {
      classification: "DOCUMENT_CONTROL",
      source: "FROZEN_OFFICIAL_ATTEMPT_V2",
      value: badPointsControlTotal,
      affectsScore: false
    },
    coleaderoAdministrativeRow: {
      fieldId: "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
      classification: "ADMINISTRATIVE",
      visualOrder: 55,
      competitorId: null,
      attemptId: null,
      value: null,
      affectsScore: false
    },
    coleaderoBottomControl04: {
      fieldId: "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04",
      classification: "DOCUMENT_CONTROL",
      visualOrder: 97,
      canonicalSourceAvailable: false,
      value: null,
      affectsScore: false
    },
    signatures: OFFICIAL_FORMAT_MANUAL_FIELDS.map((fieldId, index) => ({
      fieldId,
      label: index < 3 ? "JUEZ" : "CAPITÁN",
      mode: "MANUAL",
      value: null
    }))
  };
}

function buildDocumentalAttemptEvidence(attemptV2, scoring) {
  const suerteId = text(attemptV2.identity?.suerteId);
  const calculationDetail = scoring.calculationDetail && typeof scoring.calculationDetail === "object"
    ? scoring.calculationDetail
    : null;
  const calaDetails = suerteId === "cala" && calculationDetail?.type === "cala_punta"
    ? calculationDetail.details || {}
    : null;
  const vuelta = nullablePositiveInteger(attemptV2.sportState?.vuelta);
  const baseTotal = nullableFinite(scoring.baseSelection?.total);
  const officialElapsedMs = nullableNonNegativeFinite(attemptV2.timing?.officialElapsedMs);
  const remate = attemptV2.sportState?.remate;
  const timePoints = resolveFrozenTimePoints(suerteId, scoring.additionalSelections || []);
  return {
    badPointSlots: (attemptV2.infractions || []).map((item) => {
      const ruleId = text(item.selectedRuleId || item.ruleId || item.id);
      const documentAbbreviation = resolveCalaDocumentAbbreviation(ruleId);
      return {
        ruleId,
        label: text(item.label),
        documentCode: documentAbbreviation?.code || null,
        documentCodeSource: documentAbbreviation?.source || null,
        documentProfileId: documentAbbreviation?.documentProfileId || null,
        documentProfileVersion: documentAbbreviation?.documentProfileVersion || null,
        quantity: Math.max(1, finite(item.quantity, 1)),
        value: finite(item.total ?? item.resolvedValue ?? item.value),
        source: "ATTEMPT_V2_INFRACTIONS"
      };
    }),
    timePoints,
    cala: calaDetails ? {
      meters: nullableFinite(calaDetails.metrosCalificados ?? calaDetails.metros),
      times: nullablePositiveInteger(calaDetails.piquetes),
      puntaDistancePoints: nullableFinite(calaDetails.distancePoints ?? calaDetails.puntosDistancia),
      puntaTimePoints: nullableFinite(calaDetails.timePoints ?? calaDetails.puntosTiempos),
      puntaTotalPoints: nullableFinite(calculationDetail.value),
      source: "ATTEMPT_V2_SCORING_CALCULATION_DETAIL"
    } : null,
    paso: suerteId === "paso" ? {
      vuelta,
      firstLapBase: vuelta === 1 ? baseTotal : null,
      secondLapBase: vuelta === 2 ? baseTotal : null,
      source: "ATTEMPT_V2_SPORT_STATE_AND_BASE_SELECTION"
    } : null,
    remate: remate ? {
      remateId: text(remate.remateId || remate.id),
      remateLabel: text(remate.remateLabel || remate.label),
      source: "ATTEMPT_V2_SPORT_STATE"
    } : null,
    officialTime: officialElapsedMs === null ? null : {
      officialElapsedMs,
      formatted: formatOfficialDuration(officialElapsedMs),
      timerId: text(attemptV2.timing?.timerId),
      sharedTimerId: text(attemptV2.timing?.sharedTimerId),
      source: "ATTEMPT_V2_TIMER_AUTHORITY_EVIDENCE"
    }
  };
}

function resolveCalaDocumentAbbreviation(ruleId) {
  return CALA_DOCUMENT_ABBREVIATION_BY_RULE_ID.get(text(ruleId)) || null;
}

function resolveFrozenTimePoints(suerteId, additionalSelections) {
  const ruleIds = TIME_POINT_RULE_IDS[suerteId];
  if (!ruleIds) return null;
  const allowed = new Set(ruleIds);
  const value = additionalSelections.reduce((sum, item) => {
    const ruleId = text(item.selectedRuleId || item.ruleId || item.id);
    return allowed.has(ruleId) ? sum + finite(item.total ?? item.resolvedValue ?? item.value) : sum;
  }, 0);
  return {
    value,
    ruleIds: [...ruleIds],
    source: "ATTEMPT_V2_SCORING_ADDITIONAL_SELECTIONS",
    affectsScore: false
  };
}

function validateSemanticSources(suertes, errors, warnings) {
  const calaAttempt = suertes.cala?.attempts?.[0];
  const cala = calaAttempt?.documentalEvidence?.cala;
  if (calaAttempt && (cala?.puntaDistancePoints === null || cala?.puntaTimePoints === null)) {
    errors.push("official-format-cala-punta-breakdown-source-missing");
  }
  if ((calaAttempt?.documentalEvidence?.badPointSlots || []).length > 8) {
    errors.push("official-format-cala-bad-point-slots-overflow");
  }

  for (const sectionId of ["toro", "terna", "yegua", "manganasPie", "manganasCaballo", "paso"]) {
    const attempts = suertes[sectionId]?.attempts || [];
    if (attempts.length && !attempts.some((attempt) => attempt.documentalEvidence?.officialTime)) {
      errors.push(`official-format-${sectionId}-official-time-source-missing`);
    }
  }

  for (const attempt of suertes.terna?.attempts || []) {
    const achieved = attempt.sportState?.result === "ACHIEVED" || attempt.goodPoints > 0;
    if (achieved && !attempt.documentalEvidence?.remate?.remateId) {
      errors.push(`official-format-terna-remate-source-missing:${attempt.attemptKey}`);
    }
  }

  for (const attempt of suertes.paso?.attempts || []) {
    const achieved = attempt.sportState?.result === "ACHIEVED" || attempt.goodPoints > 0;
    if (achieved && ![1, 2].includes(attempt.documentalEvidence?.paso?.vuelta)) {
      errors.push(`official-format-paso-vuelta-source-missing:${attempt.attemptKey}`);
    }
  }

  if (!suertes.cala?.attempts?.length) warnings.push("official-format-cala-semantic-evidence-unavailable");
}

function formatOfficialDuration(value) {
  const totalSeconds = Math.floor(Math.max(0, Number(value) || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function nullableFinite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableNonNegativeFinite(value) {
  const number = nullableFinite(value);
  return number === null || number < 0 ? null : number;
}

function nullablePositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function validateRequiredSuertes(charreada, attempts, errors) {
  const required = Array.isArray(charreada.suerteIds) ? charreada.suerteIds.map(text).filter(Boolean) : [];
  if (!required.length) return;
  const present = new Set(attempts.map((attempt) => attempt.suerteId));
  for (const suerteId of required) {
    const components = REQUIRED_SUERTE_COMPONENTS[suerteId] || [suerteId];
    for (const componentId of components) {
      if (!present.has(componentId)) errors.push(`official-format-required-suerte-missing:${componentId}`);
    }
  }
}

function buildSourceRevision(attempts) {
  const maximum = attempts.reduce((value, attempt) => Math.max(value, finite(attempt.revision)), 0);
  return `${maximum}:${stableDigest(attempts.map((attempt) => [attempt.officialScoreId, attempt.revision, attempt.total]))}`;
}

function recordMatches(record, scope) {
  const ids = getRecordIds(record);
  return ids.tournamentId === scope.tournamentId && ids.charreadaId === scope.charreadaId && ids.teamId === scope.teamId;
}

function getRecordIds(record) {
  const v2 = record.breakdown?.attemptV2?.identity || {};
  return {
    tournamentId: cleanId(record.tournament?.id || record.tournamentId || v2.tournamentId),
    charreadaId: cleanId(record.charreada?.id || record.charreadaId || v2.charreadaId),
    teamId: cleanId(record.team?.id || record.teamId || v2.teamId),
    suerteId: cleanId(record.suerte?.id || record.suerteId || v2.suerteId)
  };
}

function deriveAttemptKey(record) {
  const ids = getRecordIds(record);
  if (!ids.tournamentId || !ids.charreadaId || !ids.teamId || !ids.suerteId) return "";
  return [ids.tournamentId, ids.charreadaId, ids.teamId, ids.suerteId, Math.max(0, finite(record.attemptIndex)), Math.max(0, finite(record.coleadorIndex))].join("__");
}

function isActiveOfficialRecord(record) {
  if (record.superseded) return false;
  const status = text(record.officialStatus || record.status || "active").toLowerCase();
  return status === "active" || status === "official" || status === "published";
}

function compareAttempts(left, right) {
  const leftSection = SECTION_ORDER.indexOf(SECTION_BY_SUERTE[left.suerteId]);
  const rightSection = SECTION_ORDER.indexOf(SECTION_BY_SUERTE[right.suerteId]);
  return leftSection - rightSection
    || left.coleadorIndex - right.coleadorIndex
    || left.attemptIndex - right.attemptIndex
    || left.suerteId.localeCompare(right.suerteId)
    || left.officialScoreId.localeCompare(right.officialScoreId);
}

function safeClone(value, depth = 0, seen = new WeakMap()) {
  if (value === null || value === undefined || typeof value === "string" || typeof value === "boolean") {
    return typeof value === "string" ? value.slice(0, MAX_STRING) : value ?? null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "object" || depth > MAX_DEPTH) return null;
  if (seen.has(value)) return null;
  const target = Array.isArray(value) ? [] : Object.create(null);
  seen.set(value, target);
  if (Array.isArray(value)) {
    for (const item of value.slice(0, MAX_ARRAY)) target.push(safeClone(item, depth + 1, seen));
    return target;
  }
  let count = 0;
  for (const key of Object.keys(value).sort()) {
    if (DANGEROUS_KEYS.has(key) || count >= MAX_KEYS) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) continue;
    const item = descriptor.value;
    if (typeof item === "function" || typeof item === "symbol" || typeof item === "bigint") continue;
    target[key] = safeClone(item, depth + 1, seen);
    count += 1;
  }
  return target;
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const item of Object.values(value)) deepFreeze(item, seen);
  return Object.freeze(value);
}

function stableDigest(value) {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function objectValues(value) {
  return value && typeof value === "object" ? Object.values(value) : [];
}

function cleanId(value) {
  const clean = text(value);
  return /^[A-Za-z0-9._:-]{1,240}$/.test(clean) ? clean : "";
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).slice(0, MAX_STRING);
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeIso(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function unique(values) {
  return [...new Set(values)];
}
