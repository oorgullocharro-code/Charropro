import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, withLegacyStateAsymmetry, legacyRecordId, input, tid, cid, teamId, uid } from './fixtures/historicalReconciliationFixture.mjs';
import { dryRun, makeBackup, verifyBackup, applyReconciliation, createReconciliationService, signature, assertWriteScope } from '../functions/historicalReconciliation.mjs';
import { buildCanonicalOfficialResults, getCanonicalOfficialTeamTotals } from '../js/core/canonicalOfficialResults.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1';
import scoreAuthority from '../functions/officialScoreConcurrency.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1';
import { buildPublicPortalModel } from '../js/publicPortal/portalSelectors.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1';
import { createOfficialFormatSnapshot } from '../js/core/officialFormatSnapshot.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1';
import { buildPublicProjection, reconcilePublicProjection } from '../js/public/publicProjection.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1';
const scope = { tournamentId: tid, charreadaId: cid, teamId };
function prepared(count=3) {
  const root=fixture(count), plan=dryRun(root,input,uid), backup=makeBackup(root,plan,2000);
  return { root,plan,backup, request:{...input,mode:'EXECUTE',planToken:plan.planToken,expectedBeforeSignature:plan.beforeSignature} };
}
for (const count of [2,3]) test(`${count} duplicates: atomic reconciliation, history, public parity and stable repeats`,()=>{
  const {root,plan,backup,request}=prepared(count), before=structuredClone(root);
  assert.equal(verifyBackup(backup,plan),true);
  const after=applyReconciliation(root,request,uid,backup,3000);
  assert.deepEqual(root,before,'pure dry-run/execute leave source untouched');
  const t=after.root.tournaments[tid];
  const target=Object.values(t.publishedScores).filter(r=>r.suerte.id==='pial_ruedo');
  assert.equal(target.filter(r=>!r.superseded).length,1);
  assert.equal(target.filter(r=>r.superseded).length,count-1);
  assert.deepEqual(t.scores,before.tournaments[tid].scores);
  assert.deepEqual(t.officialScoreAudit,before.tournaments[tid].officialScoreAudit);
  assert.deepEqual(t.officialScoreFanout,before.tournaments[tid].officialScoreFanout);
  for(const r of target) for(const k of ['id','revision','total','timestampMs','publishedAt','actor','idempotencyKey','breakdown']) assert.deepEqual(r[k],before.tournaments[tid].publishedScores[r.id][k]);
  const totals=getCanonicalOfficialTeamTotals(t,scope);
  assert.equal(totals.suerteTotals.pial_ruedo,21); assert.equal(totals.total,193);
  assert.equal(after.root.publicTournaments[tid].results.teams[0].columns.pial_ruedo,21);
  assert.equal(after.root.publicTournaments[tid].results.teams[0].total,193);
  assert.equal(after.root.publicTournaments[tid].standings.items[0].total,193);
  const portal=buildPublicPortalModel(after.root.publicTournaments[tid],{competitionId:'equipos_completo'});
  assert.equal(portal.rankedResults[0].displayTotal,193);
  assert.equal(portal.sheet.rows[0].scores.PR,21);
  const sheet=createOfficialFormatSnapshot({tournament:t.info,charreada:t.charreadas[0],team:t.teams[0],officialScores:t.publishedScores,officialScoreLedger:t.officialScoreLedger},scope);
  assert.equal(sheet.officialScoreTotal,193);
  assert.deepEqual(after.root.tournaments.control,before.tournaments.control);
  assert.deepEqual(after.root.publicTournaments.control,before.publicTournaments.control);
  assert.equal(Object.values(t.officialScoreLedger).filter(l=>l.activeRecordId&&plan.targetRecordIds.includes(l.activeRecordId)).length,1);
  assert.equal(buildCanonicalOfficialResults(t).duplicateHeadsResolved,0);
  const again=applyReconciliation(after.root,request,uid,backup,4000);
  assert.equal(again.result.idempotent,true); assert.deepEqual(again.root,after.root);
  const reproject=applyReconciliation(JSON.parse(JSON.stringify(after.root)),{...request,mode:'REPROJECT'},uid,backup,5000);
  assert.deepEqual(reproject.root,after.root,'reload + rebuild stays byte-identical');
  assert.equal(Object.keys(after.root.historicalReconciliations[tid]).length,1);
});
test('normal judge correction and original idempotency evidence remain usable',()=>{
  const {root,plan,backup,request}=prepared();
  const after=applyReconciliation(root,request,uid,backup,3000).root;
  const t=after.tournaments[tid], current=t.publishedScores[plan.currentRecordId];
  const payload=structuredClone(current);payload.total=22;payload.breakdown.total=22;payload.breakdown.attemptV2.scoring.teamAdjustedPoints=22;payload.breakdown.attemptV2.scoring.goodPoints=22;
  const preparedScore=scoreAuthority.prepareOfficialScoreRequest({tournamentId:tid,scoreId:`${cid}__${teamId}__pial_ruedo`,idempotencyKey:'legitimate-correction-001',expectedRevision:t.officialScoreLedger[plan.attemptId].revision,scorePayload:[{base:22}],publishedScore:payload},{uid:'judge-fixture',role:'juez'},{nowMs:4000});
  assert.equal(preparedScore.valid,true,JSON.stringify(preparedScore.errors));assert.equal(preparedScore.request.attemptId,plan.attemptId);
  const corrected=scoreAuthority.applyOfficialScoreTransaction(t,preparedScore.request);
  assert.equal(corrected.outcome.ok,true,corrected.outcome.reason);
  assert.equal(getCanonicalOfficialTeamTotals(corrected.tournament,scope).suerteTotals.pial_ruedo,22);
  assert.equal(corrected.outcome.revision,t.officialScoreLedger[plan.attemptId].revision+1);
  for(const lid of plan.legacyLedgerIds) for(const [rid,req] of Object.entries(root.tournaments[tid].officialScoreLedger[lid].requests)) assert.deepEqual(t.officialScoreLedger[plan.attemptId].requests[rid],req);
});
test('already historical values and original audit stay preserved',()=>{
  const root=fixture();const ledger=Object.values(root.tournaments[tid].officialScoreLedger).find(l=>l.suerteId!=='unused'&&l.attemptKey.includes('pial_ruedo'));
  const old=structuredClone(ledger.records[ledger.activeRecordId]);old.id='old-history';old.total=15;old.breakdown.total=15;old.breakdown.attemptV2.scoring.teamAdjustedPoints=15;old.superseded=true;old.status='historical';old.officialStatus='historical';old.timestampMs=50;
  old.publishedAt=new Date(50).toISOString();
  root.tournaments[tid].publishedScores[old.id]=old;ledger.records[old.id]=structuredClone(old);
  const plan=dryRun(root,input,uid),backup=makeBackup(root,plan,2000);
  const after=applyReconciliation(root,{...input,mode:'EXECUTE',planToken:plan.planToken,expectedBeforeSignature:plan.beforeSignature},uid,backup,3000);
  assert.deepEqual(after.root.tournaments[tid].publishedScores[old.id],old);
});
test('demonstrated legacy ledger state asymmetry is exposed and preserved by the plan',()=>{
  const root=withLegacyStateAsymmetry();
  const plan=dryRun(root,input,uid);
  assert.equal(plan.legacyCompatibilityApplied,true);
  assert.deepEqual(plan.legacyCompatibleRecordIds,[legacyRecordId]);
  assert.equal(plan.compatibilityReason,'LEGACY_STATE_ASYMMETRY_COMPATIBLE');
  assert.notEqual(plan.currentRecordId,legacyRecordId);
  assert.ok(plan.targetRecordIds.includes(plan.currentRecordId));
  assert.equal(plan.canonicalValue,21);
  assert.equal(plan.totals.suerteTotals.pial_ruedo,21);
  assert.equal(plan.totals.total,193);
  const backup=makeBackup(root,plan,2000);
  const result=applyReconciliation(root,{...input,mode:'EXECUTE',planToken:plan.planToken,expectedBeforeSignature:plan.beforeSignature},uid,backup,3000);
  const historical=result.root.tournaments[tid].publishedScores[legacyRecordId];
  assert.equal(historical.superseded,true);
  assert.equal(historical.status,'active');
  assert.equal(historical.officialStatus,'historical');
  assert.equal(getCanonicalOfficialTeamTotals(result.root.tournaments[tid],scope).total,193);
});
for(const role of ['juez','operador','lectura']) test(`${role} denied`,()=>{const r=fixture();r.users[uid].role=role;assert.throws(()=>dryRun(r,input,uid),/supervisor-required/)});
test('inactive, unauthenticated and unassigned supervisor denied',()=>{
  for(const mutate of [r=>r.users[uid].active=false,r=>r.users[uid].tournamentIds=[],r=>r.tournaments[tid].info.organizationId='foreign']){const r=fixture();mutate(r);assert.throws(()=>dryRun(r,input,uid));}
  assert.throws(()=>dryRun(fixture(),input,''),/auth-required/);
});
test('ambiguity, missing shared ID, cross-tournament, ledger drift and chronology rejected',()=>{
  for(const mutate of [
    r=>{const x=Object.values(r.tournaments[tid].publishedScores).find(x=>x.suerte.id==='pial_ruedo');x.breakdown.attemptV2.scoring.teamAdjustedPoints=22},
    r=>r.tournaments[tid].info.id='foreign',
    r=>r.projectionOutbox[tid].old.intent.targetPath='charropro/publicTournaments/foreign',
    r=>Object.values(r.tournaments[tid].officialScoreLedger)[5].activeRecordId='missing',
    r=>Object.values(r.tournaments[tid].publishedScores)[5].timestampMs=0,
    r=>Object.values(r.tournaments[tid].publishedScores)[5].breakdown.attemptV2.identity.teamId='foreign'
  ]){const r=fixture();mutate(r);assert.throws(()=>dryRun(r,input,uid));}
  assert.throws(()=>dryRun(fixture(),{...input,sharedOpportunityId:''},uid),/shared-opportunity-required/);
  assert.throws(()=>dryRun(fixture(),{...input,tournamentId:'control'},uid),/access-denied/);
});
test('stale source or plan, missing/corrupt/foreign backup and tampered request fail closed',()=>{
  const {root,plan,backup,request}=prepared();
  for(const mutate of [r=>r.tournaments[tid].scores.new=22,r=>r.publicTournaments[tid].projectionRevision++]){const r=structuredClone(root);mutate(r);assert.throws(()=>applyReconciliation(r,request,uid,backup,3000),/source-conflict/);}
  assert.throws(()=>applyReconciliation(root,{...request,planToken:'forged'},uid,backup,3000),/source-conflict/);
  assert.throws(()=>applyReconciliation(root,request,uid,null,3000),/backup-missing/);
  const bad=structuredClone(backup);bad.snapshot.tournament.scores.changed=1;
  assert.throws(()=>applyReconciliation(root,request,uid,bad,3000),/backup-invalid/);
  assert.throws(()=>verifyBackup(backup,{...plan,tournamentId:'foreign'}),/backup-invalid/);
  const a=applyReconciliation(root,request,uid,backup,3000);
  assert.throws(()=>applyReconciliation(a.root,{...request,teamId:'other'},uid,backup,4000),/idempotency-conflict/);
});
test('scope guard rejects changed control tournament',()=>{const a=fixture(),b=structuredClone(a);b.tournaments.control.revision++;assert.throws(()=>assertWriteScope(a,b,[`tournaments/${tid}`]),/cross-tournament-write/)});
test('service: read-only dry run, verified backup readback, execute/reproject, backup failure',async()=>{
  let root=fixture(), writes=0;const backups=new Map();
  const adapter={readRoot:async()=>structuredClone(root),now:()=>3000,readBackup:async p=>backups.get(p),createBackup:async(p,b)=>{backups.set(p,b);writes++},atomic:async fn=>{const a=fn(root);root=a.root;writes++;return a.result}};
  const api=createReconciliationService(adapter);
  const plan=await api({...input,mode:'DRY_RUN'},uid);assert.equal(writes,0);
  const req={...input,planToken:plan.planToken,expectedBeforeSignature:plan.beforeSignature};
  await assert.rejects(api({...req,mode:'EXECUTE'},uid),/backup-missing/);
  const b=await api({...req,mode:'BACKUP'},uid);assert.equal(b.verified,true);
  await api({...req,mode:'EXECUTE'},uid);await api({...req,mode:'REPROJECT'},uid);
  const failed=createReconciliationService({...adapter,readRoot:async()=>fixture(),createBackup:async()=>{throw new Error('storage-failed')},readBackup:async()=>null});
  await assert.rejects(failed({...req,mode:'BACKUP'},uid),/storage-failed/);
});
