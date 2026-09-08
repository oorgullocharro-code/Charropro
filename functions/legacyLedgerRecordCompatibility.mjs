export const LEGACY_LEDGER_COMPATIBILITY_RESULT = Object.freeze({
  EXACT_MATCH: 'EXACT_MATCH',
  LEGACY_STATE_ASYMMETRY_COMPATIBLE: 'LEGACY_STATE_ASYMMETRY_COMPATIBLE',
  SPORTING_MISMATCH: 'SPORTING_MISMATCH',
  IDENTITY_MISMATCH: 'IDENTITY_MISMATCH',
  REVISION_MISMATCH: 'REVISION_MISMATCH',
  SUPERSESSION_MISMATCH: 'SUPERSESSION_MISMATCH',
  SUCCESSOR_MISSING: 'SUCCESSOR_MISSING',
  ACTIVE_CONFLICT: 'ACTIVE_CONFLICT',
  UNKNOWN_INCOMPATIBILITY: 'UNKNOWN_INCOMPATIBILITY'
});

const RESULT = LEGACY_LEDGER_COMPATIBILITY_RESULT;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function equal(left, right) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function identity(record = {}) {
  return {
    id: record.id || record.recordId || '',
    tournamentId: record.tournament?.id || record.tournamentId || record.breakdown?.attemptV2?.identity?.tournamentId || '',
    charreadaId: record.charreada?.id || record.charreadaId || record.breakdown?.attemptV2?.identity?.charreadaId || '',
    teamId: record.team?.id || record.teamId || record.breakdown?.attemptV2?.identity?.teamId || '',
    suerteId: record.suerte?.id || record.suerteId || record.breakdown?.attemptV2?.identity?.suerteId || '',
    attemptKey: record.attemptKey || '',
    sportingOpportunityKey: record.sportingOpportunityKey || '',
    attemptIndex: record.attemptIndex,
    coleadorIndex: record.coleadorIndex,
    sharedOpportunityId: record.sharedOpportunityId || record.attempt?.sharedOpportunityId ||
      record.breakdown?.attemptV2?.sportState?.opportunity?.sharedOpportunityId || '',
    attemptV2Identity: record.breakdown?.attemptV2?.identity || null
  };
}

function sporting(record = {}) {
  return {
    total: record.total,
    attempt: record.attempt,
    breakdown: record.breakdown
  };
}

function supersession(record = {}) {
  return {
    superseded: record.superseded,
    supersededBy: record.supersededBy
  };
}

function stateNormalized(record = {}) {
  return { ...record, status: 'historical', officialStatus: 'historical' };
}

function legacyStatePattern(published = {}, ledger = {}) {
  return published.status === 'active' && published.officialStatus === 'historical' &&
    ledger.status === 'historical' && ledger.officialStatus === 'active';
}

function compatible(result, details = {}) {
  return { compatible: true, result, reason: result, ...details };
}

function incompatible(result, details = {}) {
  return { compatible: false, result, reason: result, ...details };
}

export function compareLegacyLedgerRecordRepresentations({
  publishedRecord = {},
  ledgerRecord = {},
  successorPublishedRecord = null,
  successorLedgerRecord = null,
  authoritativeActiveRecordIds = []
} = {}) {
  if (equal(publishedRecord, ledgerRecord)) return compatible(RESULT.EXACT_MATCH);

  if (!equal(identity(publishedRecord), identity(ledgerRecord))) {
    return incompatible(RESULT.IDENTITY_MISMATCH);
  }
  if (publishedRecord.revision !== ledgerRecord.revision) {
    return incompatible(RESULT.REVISION_MISMATCH);
  }
  if (!equal(sporting(publishedRecord), sporting(ledgerRecord))) {
    return incompatible(RESULT.SPORTING_MISMATCH);
  }
  if (!equal(supersession(publishedRecord), supersession(ledgerRecord)) ||
      publishedRecord.superseded !== true || !publishedRecord.supersededBy) {
    return incompatible(RESULT.SUPERSESSION_MISMATCH);
  }
  if (!legacyStatePattern(publishedRecord, ledgerRecord)) {
    return incompatible(RESULT.UNKNOWN_INCOMPATIBILITY);
  }
  if (!equal(stateNormalized(publishedRecord), stateNormalized(ledgerRecord))) {
    return incompatible(RESULT.UNKNOWN_INCOMPATIBILITY);
  }

  const successorId = publishedRecord.supersededBy;
  if (!successorPublishedRecord || !successorLedgerRecord ||
      (successorPublishedRecord.id || successorPublishedRecord.recordId) !== successorId ||
      (successorLedgerRecord.id || successorLedgerRecord.recordId) !== successorId) {
    return incompatible(RESULT.SUCCESSOR_MISSING);
  }
  if (!equal(successorPublishedRecord, successorLedgerRecord)) {
    return incompatible(RESULT.UNKNOWN_INCOMPATIBILITY);
  }

  const predecessorIdentity = { ...identity(publishedRecord), id: '' };
  const successorIdentity = { ...identity(successorPublishedRecord), id: '' };
  if (!equal(predecessorIdentity, successorIdentity)) {
    return incompatible(RESULT.IDENTITY_MISMATCH);
  }
  if (!Number.isSafeInteger(successorPublishedRecord.revision) ||
      successorPublishedRecord.revision <= publishedRecord.revision) {
    return incompatible(RESULT.REVISION_MISMATCH);
  }

  const activeIds = [...new Set(authoritativeActiveRecordIds.filter(Boolean))];
  if (activeIds.length !== 1 || activeIds[0] !== successorId ||
      successorPublishedRecord.superseded === true ||
      successorPublishedRecord.status !== 'active' ||
      successorPublishedRecord.officialStatus !== 'active') {
    return incompatible(RESULT.ACTIVE_CONFLICT);
  }

  return compatible(RESULT.LEGACY_STATE_ASYMMETRY_COMPATIBLE, { successorId });
}
