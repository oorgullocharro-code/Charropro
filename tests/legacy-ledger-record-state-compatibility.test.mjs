import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareLegacyLedgerRecordRepresentations,
  LEGACY_LEDGER_COMPATIBILITY_RESULT as RESULT
} from '../functions/legacyLedgerRecordCompatibility.mjs';

function records() {
  const sharedOpportunityId = 'terna:tournament:competition:charreada:team:op:4';
  const identity = { tournamentId: 'tournament', charreadaId: 'charreada', teamId: 'team', suerteId: 'pial_ruedo', participantSlot: 3 };
  const publishedRecord = {
    id: 'legacy-record', tournament: { id: 'tournament' }, charreada: { id: 'charreada' }, team: { id: 'team' }, suerte: { id: 'pial_ruedo' },
    attemptKey: 'tournament__charreada__team__pial_ruedo__3__0', attemptIndex: 3, coleadorIndex: 0,
    revision: 1, total: 15, attempt: { base: 15 },
    breakdown: { total: 15, attemptV2: { identity, sportState: { opportunity: { sharedOpportunityId } }, scoring: { goodPoints: 15, teamAdjustedPoints: 15 } } },
    status: 'active', officialStatus: 'historical', superseded: true, supersededBy: 'successor-record'
  };
  const ledgerRecord = { ...structuredClone(publishedRecord), status: 'historical', officialStatus: 'active' };
  const successor = {
    ...structuredClone(publishedRecord), id: 'successor-record', revision: 2, total: 21, attempt: { base: 21 },
    breakdown: { ...structuredClone(publishedRecord.breakdown), total: 21, attemptV2: { ...structuredClone(publishedRecord.breakdown.attemptV2), scoring: { goodPoints: 21, teamAdjustedPoints: 21 } } },
    status: 'active', officialStatus: 'active', superseded: false, supersededBy: ''
  };
  return { publishedRecord, ledgerRecord, successorPublishedRecord: successor, successorLedgerRecord: structuredClone(successor), authoritativeActiveRecordIds: [successor.id] };
}

function compare(mutator = () => {}) {
  const context = records();
  mutator(context);
  return compareLegacyLedgerRecordRepresentations(context);
}

test('exact records remain exact matches', () => {
  const context = records();
  context.ledgerRecord = structuredClone(context.publishedRecord);
  assert.deepEqual(compareLegacyLedgerRecordRepresentations(context), { compatible: true, result: RESULT.EXACT_MATCH, reason: RESULT.EXACT_MATCH });
});

test('only the demonstrated legacy state asymmetry is compatible', () => {
  assert.deepEqual(compare(), { compatible: true, result: RESULT.LEGACY_STATE_ASYMMETRY_COMPATIBLE, reason: RESULT.LEGACY_STATE_ASYMMETRY_COMPATIBLE, successorId: 'successor-record' });
});

for (const [name, expected, mutate] of [
  ['different record identity', RESULT.IDENTITY_MISMATCH, c => { c.ledgerRecord.id = 'other'; }],
  ['different revision', RESULT.REVISION_MISMATCH, c => { c.ledgerRecord.revision = 9; }],
  ['different total', RESULT.SPORTING_MISMATCH, c => { c.ledgerRecord.total = 14; }],
  ['different Attempt V2', RESULT.SPORTING_MISMATCH, c => { c.ledgerRecord.breakdown.attemptV2.scoring.goodPoints = 14; }],
  ['different shared opportunity', RESULT.IDENTITY_MISMATCH, c => { c.ledgerRecord.breakdown.attemptV2.sportState.opportunity.sharedOpportunityId = 'other'; }],
  ['different superseded flag', RESULT.SUPERSESSION_MISMATCH, c => { c.ledgerRecord.superseded = false; }],
  ['different successor id', RESULT.SUPERSESSION_MISMATCH, c => { c.ledgerRecord.supersededBy = 'other'; }],
  ['missing successor', RESULT.SUCCESSOR_MISSING, c => { c.successorLedgerRecord = null; }],
  ['successor from wrong opportunity', RESULT.IDENTITY_MISMATCH, c => { c.successorLedgerRecord.attemptKey = c.successorPublishedRecord.attemptKey = 'other'; }],
  ['legacy record still authoritative', RESULT.ACTIVE_CONFLICT, c => { c.authoritativeActiveRecordIds = ['legacy-record']; }],
  ['two authoritative current records', RESULT.ACTIVE_CONFLICT, c => { c.authoritativeActiveRecordIds = ['successor-record', 'other']; }],
  ['unknown status combination', RESULT.UNKNOWN_INCOMPATIBILITY, c => { c.ledgerRecord.officialStatus = 'historical'; }],
  ['unknown metadata mismatch', RESULT.UNKNOWN_INCOMPATIBILITY, c => { c.ledgerRecord.unrecognized = true; }]
]) {
  test(`${name} fails closed`, () => {
    const result = compare(mutate);
    assert.equal(result.compatible, false);
    assert.equal(result.result, expected);
  });
}
