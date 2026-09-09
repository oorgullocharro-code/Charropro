import test from 'node:test';
import assert from 'node:assert/strict';
import { withLegacyStateAsymmetry, tid, input as template, uid, cid, teamId, legacyRecordId } from './fixtures/historicalReconciliationFixture.mjs';
import { signature, databaseSignature } from '../functions/historicalReconciliation.mjs';
import { getCanonicalOfficialTeamTotals } from '../js/core/canonicalOfficialResults.js?v=20260909-live-lifecycle-canonical-source-001-v1';

test('Auth + Storage + RTDB + callable: backup/verify/execute/reload/reproject/idempotency/isolation', {skip: process.env.CHARROPRO_RUN_RECONCILIATION_EMULATOR !== '1'}, async()=>{
  assert.equal(process.env.FIREBASE_PROJECT_ID,'demo-charropro-local');
  const input = { ...template, reconciliationId: `reconciliation-emulator-${Date.now()}` };
  const db='http://127.0.0.1:9000/charropro.json?ns=demo-charropro-local';
  const headers={Authorization:'Bearer owner','content-type':'application/json'};
  const auth=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:`reconcile-${Date.now()}@example.test`,password:'emulator-only-password',returnSecureToken:true})}).then(r=>r.json());
  assert.ok(auth.idToken);
  const root=withLegacyStateAsymmetry(); root.users[auth.localId]=root.users[uid]; delete root.users[uid];
  assert.equal((await fetch(db,{method:'PUT',headers,body:JSON.stringify(root)})).status,200);
  const read=()=>fetch(db,{headers}).then(r=>r.json());
  async function call(data,token=auth.idToken){const r=await fetch('http://127.0.0.1:5001/demo-charropro-local/us-central1/reconcileCharroProHistoricalResults',{method:'POST',headers:{'content-type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({data})});const body=await r.json();return {status:r.status,...body};}
  const before=await read();
  assert.equal((await call({...input,mode:'DRY_RUN'},'')).status,401);
  for (const patch of [{role:'juez'}, {role:'operador'}, {active:false}, {tournamentIds:['control']}]) {
    const profile={...before.users[auth.localId],...patch};
    await fetch(`http://127.0.0.1:9000/charropro/users/${auth.localId}.json?ns=demo-charropro-local`,{method:'PUT',headers,body:JSON.stringify(profile)});
    assert.equal((await call({...input,mode:'DRY_RUN'})).status,403);
  }
  await fetch(`http://127.0.0.1:9000/charropro/users/${auth.localId}.json?ns=demo-charropro-local`,{method:'PUT',headers,body:JSON.stringify(before.users[auth.localId])});
  const planResponse=await call({...input,mode:'DRY_RUN'});
  assert.equal(planResponse.status,200,JSON.stringify(planResponse));const plan=planResponse.result;
  assert.equal(plan.legacyCompatibilityApplied,true);assert.deepEqual(plan.legacyCompatibleRecordIds,[legacyRecordId]);
  assert.equal(databaseSignature(await read()),databaseSignature(before),'dry run writes nothing');
  const req={...input,planToken:plan.planToken,expectedBeforeSignature:plan.beforeSignature};
  assert.notEqual((await call({...req,mode:'EXECUTE'})).status,200,'backup gate');
  const backup=await call({...req,mode:'BACKUP'});assert.equal(backup.status,200,JSON.stringify(backup));assert.equal(backup.result.verified,true);
  assert.equal(databaseSignature(await read()),databaseSignature(before),'backup is Storage-only');
  const verifiedPlan=await call({...input,mode:'DRY_RUN'});
  assert.equal(verifiedPlan.result.planToken,plan.planToken,'post-backup dry run binds the identical source');
  const changed=structuredClone(before);changed.tournaments[tid].scores.concurrentChange=9;
  await fetch(db,{method:'PUT',headers,body:JSON.stringify(changed)});
  const stale=await call({...req,mode:'EXECUTE'});assert.equal(stale.status,409,JSON.stringify(stale));
  assert.equal(databaseSignature(await read()),databaseSignature(changed),'stale execution writes nothing');
  await fetch(db,{method:'PUT',headers,body:JSON.stringify(before)});
  const executions=await Promise.all([call({...req,mode:'EXECUTE'}),call({...req,mode:'EXECUTE'})]);
  for(const r of executions) assert.equal(r.status,200,JSON.stringify(r));
  assert.deepEqual(executions.map(r=>r.result.idempotent).sort(),[false,true],'CAS winner and idempotent retry');
  const after=await read();
  assert.deepEqual(after.tournaments.control,before.tournaments.control);
  assert.deepEqual(after.publicTournaments.control,before.publicTournaments.control);
  assert.deepEqual(after.tournaments[tid].scores,before.tournaments[tid].scores);
  const pial=Object.values(after.tournaments[tid].publishedScores).filter(r=>r.suerte.id==='pial_ruedo');
  assert.equal(pial.filter(r=>!r.superseded).length,1);assert.equal(pial.filter(r=>r.superseded).length,3);
  const totals=getCanonicalOfficialTeamTotals(after.tournaments[tid],{tournamentId:tid,charreadaId:cid,teamId});assert.equal(totals.total,193);assert.equal(totals.suerteTotals.pial_ruedo,21);
  assert.equal(after.publicTournaments[tid].results.teams[0].columns.pial_ruedo,21);assert.equal(after.publicTournaments[tid].results.teams[0].total,193);
  for(const mode of ['EXECUTE','REPROJECT','REPROJECT']) { const r=await call({...req,mode});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.result.idempotent,true);assert.equal(signature(await read()),signature(after),'readback/reload/rebuild stable'); }
  console.log('EMULATOR_CERTIFICATION=PASS CURRENT_HEADS=1 DUPLICATE_HEADS_TO_HISTORICAL=2 LEGACY_HISTORICAL_PRESERVED=1 CANONICAL_PR=21 INTERNAL_PR=21 PUBLIC_PR=21 TOTAL=193');
});
