import { buildPublicProjection, reconcilePublicProjection } from '../../js/public/publicProjection.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1';

export const tid = 'test-reconciliation-fixture';
export const cid = 'charreada-fixture';
export const teamId = 'casa-1';
export const uid = 'supervisor-fixture';
export const input = { tournamentId: tid, charreadaId: cid, teamId, sharedOpportunityId: `terna:${tid}:equipos_completo:${cid}:${teamId}:op:4`, reconciliationId: 'reconciliation-fixture-001' };
export const legacyRecordId = 'official_c4ffdb24f29947e0f9078f179da831e4';
export const legacySuccessorId = 'official_ce5218c3b97fe099458e821edc6b2cb4';
export function fixture(count = 3) {
  const t = { info: { id: tid, name: 'TEST fixture', type: 'completo' },
    teams: [{ id: teamId, name: 'casa 1', tournamentId: tid }],
    charreadas: [{ id: cid, name: 'Charreada', tournamentId: tid, competitionId: 'equipos_completo', competitionType: 'equipos_completo', competitionScope: 'team', phase: 'Fase 1', teamIds: [teamId], suerteIds: ['cala','piales','colas','toro','terna','lazo','pial_ruedo'] }],
    scores: { [`${cid}__${teamId}__pial_ruedo`]: [{ base: 21, adic: 0, infr: 0 }] },
    meta: { activeCharreadaId: cid, updatedAt: '2026-09-01T00:00:00.000Z' },
    publishedScores: {}, officialScoreLedger: {}, officialScoreAudit: { existing: { operation: 'PUBLISH_OFFICIAL_SCORE' } }, officialScoreFanout: {} };
  function add(recordId, suerte, total, stamp, slot = 0, sharedId = '') {
    const r = { id: recordId, tournament: { id: tid }, charreada: { id: cid, competitionId: 'equipos_completo' },
      competition: { id: 'equipos_completo', type: 'equipos_completo', scope: 'team' }, team: { id: teamId, name: 'casa 1' }, suerte: { id: suerte },
      attemptIndex: suerte === 'pial_ruedo' ? 3 : 0, coleadorIndex: slot, revision: 1, status: 'active', officialStatus: 'active', superseded: false, total,
      timestampMs: stamp, publishedAt: new Date(stamp).toISOString(), actor: { uid: 'judge-original' }, idempotencyKey: `original-${recordId}`,
      breakdown: { total, attemptV2: { identity: { tournamentId: tid, charreadaId: cid, teamId, suerteId: suerte, competitionId: 'equipos_completo', participantSlot: slot + 1 },
        sportState: { opportunity: { sharedOpportunityId: sharedId, number: suerte === 'pial_ruedo' ? 4 : 1 } }, scoring: { goodPoints: total, teamAdjustedPoints: total, individualBadPoints: 0, teamBadPoints: 0 } } } };
    r.attemptKey = `${tid}__${cid}__${teamId}__${suerte}__${r.attemptIndex}__${slot}`;
    t.publishedScores[r.id] = r;
    t.officialScoreLedger[`legacy_${r.id}`] = { ledgerVersion: '1.0.0', tournamentId: tid, charreadaId: cid, teamId, suerteId: suerte, revision: 1,
      attemptId: `legacy_${r.id}`, attemptKey: r.attemptKey, activeRecordId: r.id, records: { [r.id]: structuredClone(r) },
      requests: { [`request_${r.id}`]: { recordId: r.id, revision: 1, idempotencyKey: r.idempotencyKey, fingerprint: `fingerprint-${r.id}` } } };
    t.officialScoreFanout[r.id] = { status: 'DELIVERED', recordId: r.id, record: structuredClone(r) };
  }
  for (const [i, [s, n]] of [['cala',31],['piales',38],['colas',68],['toro',20],['lazo',15]].entries()) add(s,s,n,100+i);
  const ids = ['official_d76a00d4a9cc76ea8b8b71da62fcd8c4','official_ce5218c3b97fe099458e821edc6b2cb4','official_44670bb70ce806881757a1936e0c60c5'];
  for (let i=0;i<count;i++) add(ids[i], 'pial_ruedo',21,200+i,i,input.sharedOpportunityId);
  const publicTournament = reconcilePublicProjection(null, buildPublicProjection(t, { nowMs: 1000 }), { nowMs: 1000 }).projection;
  // Frozen legacy public projection: deliberately incorrect historical input only.
  for (const row of publicTournament.results.teams) { row.columns.pial_ruedo = count * 21; row.total = 172 + count * 21; }
  for (const row of publicTournament.standings.items) row.total = 172 + count * 21;
  return { users: { [uid]: { name: 'Supervisor fixture', role: 'supervisor', active: true, tournamentAccess: 'selected', tournamentIds: [tid] } },
    tournaments: { [tid]: t, control: { info: { id: 'control' }, revision: 9, untouched: true } },
    publicTournaments: { [tid]: publicTournament, control: { revision: 9 } },
    projectionOutbox: { [tid]: { old: { intent: { tournamentId: tid, targetPath: `charropro/publicTournaments/${tid}` }, status: 'DELIVERED' } } },
    audit: { publishedScores: { [tid]: structuredClone(t.publishedScores) } } };
}

export function withLegacyStateAsymmetry(root = fixture()) {
  const tournament = root.tournaments[tid];
  const ledger = Object.values(tournament.officialScoreLedger)
    .find(value => value.activeRecordId === legacySuccessorId);
  const successor = tournament.publishedScores[legacySuccessorId];
  successor.revision = 2;
  ledger.revision = 2;
  ledger.records[legacySuccessorId] = structuredClone(successor);

  const historical = structuredClone(successor);
  historical.id = legacyRecordId;
  historical.total = 15;
  historical.revision = 1;
  historical.timestampMs = 150;
  historical.publishedAt = new Date(150).toISOString();
  historical.breakdown.total = 15;
  historical.breakdown.attemptV2.scoring.goodPoints = 15;
  historical.breakdown.attemptV2.scoring.teamAdjustedPoints = 15;
  historical.superseded = true;
  historical.supersededBy = legacySuccessorId;
  historical.supersededAt = successor.publishedAt;
  historical.status = 'active';
  historical.officialStatus = 'historical';
  tournament.publishedScores[legacyRecordId] = historical;

  ledger.records[legacyRecordId] = {
    ...structuredClone(historical),
    status: 'historical',
    officialStatus: 'active'
  };
  const projection = reconcilePublicProjection(null, buildPublicProjection(tournament, { nowMs: 1000 }), { nowMs: 1000 }).projection;
  for (const row of projection.results.teams) { row.columns.pial_ruedo = 63; row.total = 235; }
  for (const row of projection.standings.items) row.total = 235;
  root.publicTournaments[tid] = projection;
  return root;
}
