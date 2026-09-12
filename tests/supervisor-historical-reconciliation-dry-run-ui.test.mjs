import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  HISTORICAL_RECONCILIATION_DRY_RUN_MODE,
  buildHistoricalReconciliationDryRunView,
  classifyHistoricalReconciliationDryRunResult,
  prepareHistoricalReconciliationDryRunRequest
} from "../js/core/historicalReconciliationDryRun.js?v=20260912-portal-v2-home-physical-review-corrections-004-v1";

const input = Object.freeze({
  tournamentId: "torneo_mtj3fikk_2llw7v",
  charreadaId: "charreada_mtj3g4z6_3ku421",
  teamId: "equipo_mtj3fvo8_7bplqp",
  sharedOpportunityId: "terna:torneo_mtj3fikk_2llw7v:equipos_completo:charreada_mtj3g4z6_3ku421:equipo_mtj3fvo8_7bplqp:op:4",
  reconciliationId: "dryrun-supervisor-001"
});

test("the client request is valid only for the authoritative DRY_RUN mode", () => {
  const prepared = prepareHistoricalReconciliationDryRunRequest({ ...input, mode: "EXECUTE" });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.payload.mode, HISTORICAL_RECONCILIATION_DRY_RUN_MODE);
  assert.deepEqual(Object.keys(prepared.payload).sort(), [
    "charreadaId",
    "mode",
    "reconciliationId",
    "sharedOpportunityId",
    "teamId",
    "tournamentId"
  ]);
  assert.equal(prepareHistoricalReconciliationDryRunRequest({ ...input, teamId: "foreign/path" }).ok, false);
  assert.equal(prepareHistoricalReconciliationDryRunRequest({ ...input, sharedOpportunityId: "" }).ok, false);
});

test("compatible and legacy-compatible plans remain successful read-only results", () => {
  for (const compatibilityReason of ["EXACT_MATCH", "LEGACY_STATE_ASYMMETRY_COMPATIBLE"]) {
    const result = classifyHistoricalReconciliationDryRunResult({ ok: true, plan: { compatibilityReason } });
    assert.equal(result.state, "DRY_RUN_SUCCESS");
    assert.equal(result.compatible, true);
  }
});

test("all known incompatibilities fail closed in the supervisor result", () => {
  for (const compatibilityReason of [
    "SPORTING_MISMATCH",
    "IDENTITY_MISMATCH",
    "REVISION_MISMATCH",
    "SUPERSESSION_MISMATCH",
    "SUCCESSOR_MISSING",
    "ACTIVE_CONFLICT",
    "UNKNOWN_INCOMPATIBILITY"
  ]) {
    const result = classifyHistoricalReconciliationDryRunResult({ ok: true, plan: { compatibilityReason } });
    assert.equal(result.state, "DRY_RUN_BLOCKED", compatibilityReason);
    assert.equal(result.compatible, false, compatibilityReason);
  }
});

test("auth, authorization, invalid context, and server failures have distinct UI states", () => {
  assert.equal(classifyHistoricalReconciliationDryRunResult({ ok: false, code: "functions/unauthenticated" }).state, "AUTH_REQUIRED");
  assert.equal(classifyHistoricalReconciliationDryRunResult({ ok: false, reason: "supervisor-required" }).state, "FORBIDDEN");
  assert.equal(classifyHistoricalReconciliationDryRunResult({ ok: false, reason: "tournament-not-found" }).classification, "INVALID_TOURNAMENT");
  assert.equal(classifyHistoricalReconciliationDryRunResult({ ok: false, reason: "unexpected-error" }).state, "SERVER_ERROR");
});

test("the plan view uses only callable response fields", () => {
  const view = buildHistoricalReconciliationDryRunView({
    tournamentId: input.tournamentId,
    compatibilityReason: "LEGACY_STATE_ASYMMETRY_COMPATIBLE",
    currentRecordId: "official_current",
    targetRecordIds: ["official_current", "official_legacy"],
    supersededRecordIds: ["official_legacy"],
    legacyCompatibilityApplied: true,
    legacyCompatibleRecordIds: ["official_c4ffdb24f29947e0f9078f179da831e4"],
    totals: { suerteTotals: { pial_ruedo: 21 }, total: 193 },
    publicImpact: { before: [{ scores: { PR: 63 }, accumulatedTotal: 235 }], after: [{ scores: { PR: 21 }, accumulatedTotal: 193 }] },
    writeScope: ["tournaments/example/publishedScores/official_legacy"],
    requestKey: "request-evidence",
    planToken: "plan-evidence"
  });
  assert.equal(view.canonicalPR, 21);
  assert.equal(view.canonicalTotal, 193);
  assert.equal(view.publicCurrent[0].scores.PR, 63);
  assert.equal(view.publicTarget[0].scores.PR, 21);
  assert.equal(view.idempotencyEvidencePresent, true);
});

test("the supervisor surface reuses the existing callable/Auth boundary and exposes no destructive UI path", async () => {
  const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
  const firebaseSyncSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
  const panelStart = appSource.indexOf("function renderHistoricalReconciliationDryRunAdmin");
  const panelEnd = appSource.indexOf("function renderSidebarTournamentContext", panelStart);
  const panelSource = appSource.slice(panelStart, panelEnd);
  const callableStart = firebaseSyncSource.indexOf("export async function runFirebaseHistoricalReconciliationDryRun");
  const callableEnd = firebaseSyncSource.indexOf("export async function transitionFirebaseRuleProfileLifecycle", callableStart);
  const callableSource = firebaseSyncSource.slice(callableStart, callableEnd);

  assert.match(appSource, /function renderSupervisorOverview[\s\S]*?renderHistoricalReconciliationDryRunAdmin\(\)/);
  assert.match(panelSource, /if \(!isSupervisorAccess\(\)\) return ""/);
  assert.match(panelSource, /DRY RUN — NO MODIFICA DATOS/);
  assert.match(panelSource, /NO SE EJECUTARÁ RECONCILIACIÓN DESDE ESTA PANTALLA/);
  assert.doesNotMatch(panelSource, /\b(EXECUTE|BACKUP|REPROJECT|REPAIR)\b/);
  assert.doesNotMatch(panelSource, /token|localStorage|sessionStorage|document\.cookie|customToken/i);
  assert.match(callableSource, /prepareHistoricalReconciliationDryRunRequest\(request\)/);
  assert.match(callableSource, /httpsCallable\(getFirebaseFunctions\(\), "reconcileCharroProHistoricalResults"\)/);
  assert.doesNotMatch(callableSource, /getIdToken|customToken|document\.cookie|localStorage|sessionStorage/i);
});

console.log("supervisor-historical-reconciliation-dry-run-ui.test.mjs: ok");
