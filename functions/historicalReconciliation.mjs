import { createHash } from 'node:crypto';
import foundation from './backupFoundation.js';
import { buildCanonicalOfficialResults, getCanonicalSportingOpportunityKey, getCanonicalOfficialTeamTotals, getOfficialRecordValue } from './reconciliationShared/core/canonicalOfficialResults.js';
import { buildPublicProjection, reconcilePublicProjection } from './reconciliationShared/public/publicProjection.js';
import { compareLegacyLedgerRecordRepresentations, LEGACY_LEDGER_COMPATIBILITY_RESULT } from './legacyLedgerRecordCompatibility.mjs';

export const RECONCILIATION_BUILD = '20260908-legacy-ledger-record-state-compatibility-adapter-001-v1';
export const REASON = 'PRE_CANONICAL_SHARED_OPPORTUNITY_DUPLICATE';
const clone = v => structuredClone(v);
export const signature = v => createHash('sha256').update(foundation.stableStringify(v)).digest('hex');
// RTDB omits null/empty nodes and may read numeric-key maps as arrays.
function databaseValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return v;
  const entries = Object.entries(v).map(([k, x]) => [k, databaseValue(x)]).filter(([, x]) => x !== null);
  return entries.length ? Object.fromEntries(entries) : null;
}
export const databaseSignature = v => signature(databaseValue(v));
export class ReconciliationError extends Error { constructor(code) { super(code); this.code = code; } }
function requireThat(condition, reason) { if (!condition) throw new ReconciliationError(reason); }
function id(value) { requireThat(typeof value === 'string' && /^[A-Za-z0-9_-]{1,180}$/.test(value) && !['__proto__', 'constructor', 'prototype'].includes(value), 'invalid-id'); return value; }
const objects = v => Object.values(v || {});
function actorFrom(root, uid, tid) {
  requireThat(uid, 'auth-required');
  const user = root.users?.[uid];
  requireThat(user?.active === true && user.role === 'supervisor', 'supervisor-required');
  const selectedAccess = root.userTournamentAccess?.[uid]
    ? root.userTournamentAccess[uid][tid] === true
    : Array.isArray(user.tournamentIds) && user.tournamentIds.includes(tid);
  requireThat(user.tournamentAccess === 'all' || (user.tournamentAccess === 'selected' && selectedAccess), 'tournament-access-denied');
  const info = root.tournaments?.[tid]?.info;
  requireThat(info?.id === tid, 'tournament-not-found');
  for (const field of ['tenantId', 'organizationId']) {
    if (info[field]) requireThat(user[field] === info[field], 'tournament-access-denied');
  }
  return { uid, name: user.name || '', role: user.role };
}
export function captureScope(root, tid) {
  id(tid);
  return clone({ tournament: root.tournaments?.[tid] || null, publicTournament: root.publicTournaments?.[tid] || null,
    projectionOutbox: root.projectionOutbox?.[tid] || null, publishedScoreAudit: root.audit?.publishedScores?.[tid] || null,
    live: root.live?.[tid] || null, historyStatistics: root.history?.statistics?.[tid] || null,
    tournamentIndex: root.tournamentIndex?.[tid] || null });
}
function shared(record) {
  const values = [record.sharedOpportunityId, record.attempt?.sharedOpportunityId, record.breakdown?.attemptV2?.sportState?.opportunity?.sharedOpportunityId].filter(Boolean);
  requireThat(new Set(values).size <= 1, 'shared-opportunity-inconsistent');
  return values[0] || '';
}
function assertReferences(value, tid) {
  if (!value || typeof value !== 'object') return;
  if (value.tournamentId) requireThat(value.tournamentId === tid, 'cross-tournament-reference');
  if (value.tournament?.id) requireThat(value.tournament.id === tid, 'cross-tournament-reference');
  for (const [key, child] of Object.entries(value)) {
    if (key === 'targetPath' && typeof child === 'string') requireThat(child === `charropro/publicTournaments/${tid}`, 'cross-tournament-path');
    assertReferences(child, tid);
  }
}
function requestKey(input, uid) {
  return signature({ tournamentId: input.tournamentId, charreadaId: input.charreadaId, teamId: input.teamId,
    sharedOpportunityId: input.sharedOpportunityId, reconciliationId: input.reconciliationId, uid });
}
function assertInput(input) {
  for (const field of ['tournamentId', 'charreadaId', 'teamId', 'reconciliationId']) id(input[field]);
  requireThat(typeof input.sharedOpportunityId === 'string' && input.sharedOpportunityId.length > 0 && input.sharedOpportunityId.length <= 500, 'shared-opportunity-required');
}
export function dryRun(root, input, uid) {
  assertInput(input);
  const tid = input.tournamentId, actor = actorFrom(root, uid, tid), snapshot = captureScope(root, tid), t = snapshot.tournament;
  assertReferences(snapshot, tid);
  requireThat(!Array.isArray(t.publishedScores) && t.publishedScores && t.officialScoreLedger, 'ledger-incompatible');
  const target = objects(t.publishedScores).filter(r => r.charreada?.id === input.charreadaId && r.team?.id === input.teamId && shared(r) === input.sharedOpportunityId);
  requireThat(target.length > 0, 'opportunity-not-found');
  const key = getCanonicalSportingOpportunityKey(target[0]);
  requireThat(key && target.every(r => getCanonicalSportingOpportunityKey(r) === key), 'opportunity-identity-ambiguous');
  if (input.sharedOpportunityId.startsWith('terna:')) {
    const parts = input.sharedOpportunityId.split(':');
    requireThat(parts[1] === tid && parts[3] === input.charreadaId && parts[4] === input.teamId, 'cross-tournament-reference');
  }
  requireThat(!objects(t.publishedScores).some(r => r.charreada?.id === input.charreadaId && r.team?.id === input.teamId &&
    r.suerte?.id === target[0].suerte.id && target.some(x => x.attemptIndex === r.attemptIndex) && !shared(r)), 'shared-opportunity-required');
  const active = target.filter(r => r.superseded !== true && ['active', 'official', 'published'].includes(r.officialStatus || r.status || 'active'));
  requireThat(active.length >= 2, 'duplicate-heads-required');
  // Equal totals alone do not establish equal sporting decisions. Compare the frozen scoring evidence.
  const sporting = r => ({ value: getOfficialRecordValue(r), scoring: r.breakdown?.attemptV2?.scoring || null,
    ruleProfile: r.breakdown?.attemptV2?.ruleProfile || null });
  requireThat(new Set(active.map(r => signature(sporting(r)))).size === 1, 'sporting-values-ambiguous');
  const allTargetIds = new Set(target.map(r => r.id));
  const ledgerEntries = Object.entries(t.officialScoreLedger).filter(([, l]) => objects(l.records).some(r => allTargetIds.has(r.id)));
  requireThat(ledgerEntries.length > 0, 'ledger-incompatible');
  const legacyCompatibleRecordIds = [];
  for (const r of target) {
    requireThat(id(r.id) && t.publishedScores[r.id]?.id === r.id, 'record-id-incompatible');
    const identity = r.breakdown?.attemptV2?.identity;
    requireThat(identity && identity.tournamentId === tid && identity.charreadaId === input.charreadaId && identity.teamId === input.teamId && identity.suerteId === r.suerte?.id, 'attempt-identity-incompatible');
    requireThat(r.attemptKey === `${tid}__${input.charreadaId}__${input.teamId}__${r.suerte.id}__${r.attemptIndex}__${r.coleadorIndex}`, 'attempt-key-incompatible');
    requireThat(Number.isSafeInteger(r.revision) && r.revision >= 1 && Number(r.timestampMs) > 0, 'chronology-required');
    requireThat(Number.isFinite(r.total) && r.total === getOfficialRecordValue(r), 'sporting-values-incompatible');
    const copies = ledgerEntries.flatMap(([ledgerId, ledger]) => objects(ledger.records)
      .filter(x => x.id === r.id).map(record => ({ ledgerId, ledger, record })));
    requireThat(copies.length === 1, 'ledger-record-incompatible');
    const copy = copies[0];
    const successorId = r.supersededBy || copy.record.supersededBy || '';
    const compatibility = compareLegacyLedgerRecordRepresentations({
      publishedRecord: r,
      ledgerRecord: copy.record,
      successorPublishedRecord: successorId ? t.publishedScores[successorId] : null,
      successorLedgerRecord: successorId ? copy.ledger.records?.[successorId] : null,
      authoritativeActiveRecordIds: [copy.ledger.activeRecordId]
    });
    requireThat(compatibility.compatible, `ledger-record-incompatible:${compatibility.reason}`);
    if (compatibility.result === LEGACY_LEDGER_COMPATIBILITY_RESULT.LEGACY_STATE_ASYMMETRY_COMPATIBLE) {
      legacyCompatibleRecordIds.push(r.id);
    }
  }
  const requestMap = {};
  for (const [lid, ledger] of ledgerEntries) {
    id(lid);
    requireThat(ledger.tournamentId === tid && ledger.records?.[ledger.activeRecordId], 'ledger-incompatible');
    requireThat(objects(ledger.records).every(r => allTargetIds.has(r.id)), 'mixed-ledger-incompatible');
    for (const r of objects(ledger.records)) requireThat((r.id === ledger.activeRecordId) === (r.superseded !== true), 'ledger-status-incompatible');
    for (const [rid, req] of Object.entries(ledger.requests || {})) {
      id(rid);
      requireThat(allTargetIds.has(req.recordId), 'request-record-incompatible');
      requireThat(!requestMap[rid] || signature(requestMap[rid]) === signature(req), 'idempotency-evidence-conflict');
      requestMap[rid] = req;
    }
  }
  const canonical = buildCanonicalOfficialResults({ ...t, tournamentId: tid });
  const selection = canonical.selections.find(s => s.sportingOpportunityKey === key);
  requireThat(selection && selection.sourceRecordIds.length === active.length && active.every(r => selection.sourceRecordIds.includes(r.id)), 'ledger-heads-incompatible');
  const current = selection.record;
  // The normal authority hashes the raw key (not JSON); use its exact identity.
  const attemptId = `attempt_${createHash('sha256').update(key).digest('hex').slice(0, 32)}`;
  requireThat(!t.officialScoreLedger[attemptId] || ledgerEntries.some(([lid]) => lid === attemptId), 'canonical-ledger-collision');
  const beforeSignature = databaseSignature(snapshot);
  const plan = { version: 1, build: RECONCILIATION_BUILD, actor, tournamentId: tid, charreadaId: input.charreadaId, teamId: input.teamId,
    reconciliationId: input.reconciliationId, sharedOpportunityId: input.sharedOpportunityId, sportingOpportunityKey: key,
    currentRecordId: current.id, supersededRecordIds: active.filter(r => r.id !== current.id).map(r => r.id).sort(),
    targetRecordIds: [...allTargetIds].sort(), legacyLedgerIds: ledgerEntries.map(([lid]) => lid).sort(), attemptId,
    canonicalValue: getOfficialRecordValue(current), totals: getCanonicalOfficialTeamTotals(t, { tournamentId: tid, charreadaId: input.charreadaId, teamId: input.teamId }),
    legacyCompatibilityApplied: legacyCompatibleRecordIds.length > 0,
    legacyCompatibleRecordIds: legacyCompatibleRecordIds.sort(),
    compatibilityReason: legacyCompatibleRecordIds.length > 0
      ? LEGACY_LEDGER_COMPATIBILITY_RESULT.LEGACY_STATE_ASYMMETRY_COMPATIBLE
      : LEGACY_LEDGER_COMPATIBILITY_RESULT.EXACT_MATCH,
    beforeSignature, requestKey: requestKey(input, uid), sourceRevision: t.meta?.updatedAtMs || t.meta?.updatedAt || null,
    writeScope: [...active.filter(r => r.id !== current.id).map(r => `tournaments/${tid}/publishedScores/${r.id}`),
      ...[...new Set([...ledgerEntries.map(([lid]) => lid), attemptId])].map(lid => `tournaments/${tid}/officialScoreLedger/${lid}`)]
  };
  plan.writeScope.push(`publicTournaments/${tid}`, `historicalReconciliations/${tid}/${input.reconciliationId}`);
  const publicPreview = buildPublicProjection({ tournament: t, liveCurrent: snapshot.live?.current || {} }, { tournamentId: tid, nowMs: 1 });
  const rowsForTarget = projection => objects(projection?.results?.items).filter(row => row.teamId === input.teamId && row.charreadaId === input.charreadaId)
    .map(row => ({ resultId: row.resultId, scores: row.scores, accumulatedTotal: row.accumulatedTotal }));
  plan.publicImpact = { before: rowsForTarget(snapshot.publicTournament), after: rowsForTarget(publicPreview) };
  plan.planToken = signature(plan);
  return plan;
}

export function makeBackup(root, plan, nowMs) {
  const snapshot = captureScope(root, plan.tournamentId);
  requireThat(databaseSignature(snapshot) === plan.beforeSignature, 'source-conflict');
  const prepared = foundation.prepareBackupRequest({ scopeType: 'tournament', tournamentId: plan.tournamentId,
    backupType: 'full', mode: 'manual', idempotencyKey: `reconciliation:${plan.planToken}` }, plan.actor, { nowMs });
  requireThat(prepared.valid, 'backup-request-invalid');
  const archive = foundation.buildBackupArchive(root, prepared.request, { appVersion: RECONCILIATION_BUILD, capturedAtMs: nowMs }).archive;
  requireThat(foundation.validateBackupArchive(archive).valid, 'backup-invalid');
  const body = { manifest: { backupId: prepared.request.backupId, timestamp: new Date(nowMs).toISOString(), tournamentId: plan.tournamentId,
    build: RECONCILIATION_BUILD, sourceRevision: plan.sourceRevision, beforeSignature: plan.beforeSignature, planToken: plan.planToken }, archive, snapshot };
  return { ...body, checksum: signature(body) };
}
export function verifyBackup(backup, plan) {
  requireThat(backup?.manifest && backup?.snapshot && backup?.archive, 'backup-missing');
  const { checksum, ...body } = backup;
  requireThat(signature(body) === checksum && databaseSignature(backup.snapshot) === plan.beforeSignature &&
    backup.manifest.planToken === plan.planToken && backup.manifest.tournamentId === plan.tournamentId &&
    foundation.validateBackupArchive(backup.archive, { expectedBackupId: backup.manifest.backupId }).valid, 'backup-invalid');
  return true;
}
function authoritySignature(root, tid) {
  const snapshot = captureScope(root, tid); delete snapshot.publicTournament;
  return databaseSignature(snapshot);
}
function project(root, tid, nowMs) {
  const candidate = buildPublicProjection({ tournament: root.tournaments[tid], liveCurrent: root.live?.[tid]?.current || {} }, { tournamentId: tid, nowMs });
  // Restore only omissions that RTDB itself makes (null/empty); never copy actual
  // candidate content into the previous projection before revision comparison.
  function hydrate(previous, shape) {
    if (previous == null) return databaseValue(shape) === null ? clone(shape) : previous;
    if (typeof previous !== 'object' || !shape || typeof shape !== 'object') return previous;
    const next = clone(previous);
    for (const [key, value] of Object.entries(shape)) {
      if (Object.hasOwn(next, key)) next[key] = hydrate(next[key], value);
      else if (databaseValue(value) === null) next[key] = clone(value);
    }
    return next;
  }
  const result = reconcilePublicProjection(hydrate(root.publicTournaments?.[tid], candidate), candidate, { nowMs });
  requireThat(result.ok && result.projection?.metadata?.tournamentId === tid, `projection-invalid:${result.reason}:${(result.errors || []).join(',')}`);
  root.publicTournaments ||= {}; root.publicTournaments[tid] = result.projection;
}
export function applyReconciliation(root, input, uid, backup, nowMs) {
  assertInput(input); const actor = actorFrom(root, uid, input.tournamentId), tid = input.tournamentId;
  const receipt = root.historicalReconciliations?.[tid]?.[input.reconciliationId];
  if (receipt) {
    requireThat(receipt.requestKey === requestKey(input, uid) && receipt.planToken === input.planToken && receipt.beforeSignature === input.expectedBeforeSignature, 'idempotency-conflict');
    requireThat(receipt.authoritySignature === authoritySignature(root, tid), 'source-conflict');
    verifyBackup(backup, { tournamentId: tid, beforeSignature: receipt.beforeSignature, planToken: receipt.planToken });
    requireThat(backup.checksum === receipt.backupChecksum, 'backup-invalid');
    if (input.mode !== 'REPROJECT') return { root, result: { ...receipt, idempotent: true }, writeScope: [] };
    const next = clone(root); project(next, tid, nowMs);
    requireThat(databaseSignature(next.publicTournaments[tid]) === receipt.publicSignature, 'projection-diverged');
    assertWriteScope(root, next, [`publicTournaments/${tid}`]);
    return { root: next, result: { ...receipt, idempotent: true }, writeScope: [`publicTournaments/${tid}`] };
  }
  requireThat(input.mode === 'EXECUTE', 'execute-required');
  const plan = dryRun(root, input, uid);
  requireThat(plan.beforeSignature === input.expectedBeforeSignature && plan.planToken === input.planToken, 'source-conflict');
  verifyBackup(backup, plan);
  const next = clone(root), t = next.tournaments[tid];
  const timestamp = new Date(nowMs).toISOString();
  const trace = { reconciliationId: input.reconciliationId, reason: REASON, timestamp, actor, sourceBuild: RECONCILIATION_BUILD };
  for (const rid of plan.supersededRecordIds) t.publishedScores[rid] = { ...t.publishedScores[rid], status: 'historical', officialStatus: 'historical', superseded: true,
    supersededBy: plan.currentRecordId, supersededAt: timestamp, reconciliation: trace };
  const requests = {};
  for (const lid of plan.legacyLedgerIds) {
    const ledger = t.officialScoreLedger[lid]; Object.assign(requests, ledger.requests || {});
    ledger.records = Object.fromEntries(Object.keys(ledger.records).map(rid => [rid, clone(t.publishedScores[rid])]));
    if (lid !== plan.attemptId) {
      ledger.activeRecordId = ''; ledger.status = 'historical'; ledger.canonicalLedgerId = plan.attemptId; ledger.reconciliation = trace;
    }
  }
  const current = t.publishedScores[plan.currentRecordId];
  const origin = plan.legacyLedgerIds.map(lid => t.officialScoreLedger[lid]).find(l => l.records[current.id]);
  t.officialScoreLedger[plan.attemptId] = { ...clone(origin), attemptId: plan.attemptId, attemptKey: current.attemptKey,
    sportingOpportunityKey: plan.sportingOpportunityKey, sharedOpportunityId: input.sharedOpportunityId,
    activeRecordId: current.id, status: 'active', revision: Math.max(...plan.legacyLedgerIds.map(lid => t.officialScoreLedger[lid].revision)),
    records: Object.fromEntries(plan.targetRecordIds.map(rid => [rid, clone(t.publishedScores[rid])])), requests, reconciliation: trace };
  delete t.officialScoreLedger[plan.attemptId].canonicalLedgerId;
  project(next, tid, nowMs);
  const audit = { operation: 'CANONICAL_HISTORICAL_RECONCILIATION', ...trace, build: RECONCILIATION_BUILD,
    tournamentId: tid, sharedOpportunityId: input.sharedOpportunityId, currentRecordId: current.id, supersededRecordIds: plan.supersededRecordIds,
    beforeSignature: plan.beforeSignature, afterSignature: databaseSignature(captureScope(next, tid)), authoritySignature: authoritySignature(next, tid),
    publicSignature: databaseSignature(next.publicTournaments[tid]), backupId: backup.manifest.backupId, backupChecksum: backup.checksum,
    requestKey: plan.requestKey, planToken: plan.planToken };
  next.historicalReconciliations ||= {}; next.historicalReconciliations[tid] ||= {}; next.historicalReconciliations[tid][input.reconciliationId] = audit;
  assertWriteScope(root, next, plan.writeScope);
  return { root: next, result: { ...audit, idempotent: false }, writeScope: plan.writeScope };
}
export function assertWriteScope(before, after, allowed) {
  function walk(a, b, path = '') {
    if (databaseSignature(a) === databaseSignature(b) || allowed.includes(path)) return;
    requireThat(allowed.some(p => p.startsWith(path ? `${path}/` : '')), 'cross-tournament-write');
    for (const key of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) walk(a?.[key], b?.[key], path ? `${path}/${key}` : key);
  }
  walk(before, after);
}

export function createReconciliationService(adapter) {
  return async function handle(input, uid) {
    assertInput(input);
    requireThat(['DRY_RUN', 'BACKUP', 'EXECUTE', 'REPROJECT'].includes(input.mode), 'mode-invalid');
    const root = await adapter.readRoot();
    actorFrom(root, uid, input.tournamentId);
    if (input.mode === 'DRY_RUN') return dryRun(root, input, uid);
    const objectPath = `charropro/reconciliationBackups/${input.tournamentId}/${id(input.reconciliationId)}.json`;
    if (input.mode === 'BACKUP') {
      const plan = dryRun(root, input, uid);
      requireThat(plan.beforeSignature === input.expectedBeforeSignature && plan.planToken === input.planToken, 'source-conflict');
      let backup = await adapter.readBackup(objectPath);
      if (!backup) { backup = makeBackup(root, plan, adapter.now()); await adapter.createBackup(objectPath, backup); }
      const verified = await adapter.readBackup(objectPath); verifyBackup(verified, plan);
      return { ...verified.manifest, checksum: verified.checksum, verified: true, objectPath };
    }
    const backup = await adapter.readBackup(objectPath);
    return adapter.atomic(rootNow => applyReconciliation(rootNow, input, uid, backup, adapter.now()));
  };
}
