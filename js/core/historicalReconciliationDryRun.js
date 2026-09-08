export const HISTORICAL_RECONCILIATION_DRY_RUN_MODE = "DRY_RUN";

const REQUIRED_ID_FIELDS = Object.freeze([
  "tournamentId",
  "charreadaId",
  "teamId",
  "reconciliationId"
]);
const FAIL_CLOSED_CLASSIFICATIONS = Object.freeze([
  "SPORTING_MISMATCH",
  "IDENTITY_MISMATCH",
  "REVISION_MISMATCH",
  "SUPERSESSION_MISMATCH",
  "SUCCESSOR_MISSING",
  "ACTIVE_CONFLICT",
  "UNKNOWN_INCOMPATIBILITY"
]);

export function prepareHistoricalReconciliationDryRunRequest(input = {}) {
  const payload = {};
  for (const field of REQUIRED_ID_FIELDS) {
    const value = String(input[field] || "").trim();
    if (!/^[A-Za-z0-9_-]{1,180}$/.test(value)) {
      return { ok: false, reason: `${field}-invalid` };
    }
    payload[field] = value;
  }

  const sharedOpportunityId = String(input.sharedOpportunityId || "").trim();
  if (!sharedOpportunityId || sharedOpportunityId.length > 500) {
    return { ok: false, reason: "sharedOpportunityId-invalid" };
  }

  return {
    ok: true,
    payload: Object.freeze({
      ...payload,
      sharedOpportunityId,
      mode: HISTORICAL_RECONCILIATION_DRY_RUN_MODE
    })
  };
}

export function classifyHistoricalReconciliationDryRunFailure(input = {}) {
  const code = String(input.code || "").toLowerCase();
  const reason = String(input.reason || "").toLowerCase();
  const signal = `${code} ${reason}`;

  if (signal.includes("unauthenticated") || signal.includes("auth-required")) return "AUTH_REQUIRED";
  if (signal.includes("permission-denied") || signal.includes("supervisor-required") || signal.includes("access-denied")) return "FORBIDDEN";
  if (signal.includes("sporting")) return "SPORTING_MISMATCH";
  if (signal.includes("identity") || signal.includes("attempt-key") || signal.includes("opportunity")) return "IDENTITY_MISMATCH";
  if (signal.includes("revision") || signal.includes("chronology")) return "REVISION_MISMATCH";
  if (signal.includes("supersession")) return "SUPERSESSION_MISMATCH";
  if (signal.includes("successor")) return "SUCCESSOR_MISSING";
  if (signal.includes("active-conflict") || signal.includes("duplicate-heads")) return "ACTIVE_CONFLICT";
  if (signal.includes("tournament-not-found") || signal.includes("invalid") || signal.includes("not-found")) return "INVALID_TOURNAMENT";
  return "SERVER_ERROR";
}

export function classifyHistoricalReconciliationDryRunResult(result = {}) {
  if (result.ok !== true) {
    const classification = classifyHistoricalReconciliationDryRunFailure(result);
    return {
      state: classification === "AUTH_REQUIRED"
        ? "AUTH_REQUIRED"
        : classification === "FORBIDDEN"
          ? "FORBIDDEN"
          : classification === "SERVER_ERROR"
            ? "SERVER_ERROR"
            : "DRY_RUN_BLOCKED",
      classification,
      compatible: false
    };
  }

  const plan = result.plan || result.data || result;
  const compatibilityReason = String(plan.compatibilityReason || "UNKNOWN_INCOMPATIBILITY").trim();
  const compatible = compatibilityReason === "EXACT_MATCH" || compatibilityReason === "LEGACY_STATE_ASYMMETRY_COMPATIBLE";
  const classification = compatible
    ? compatibilityReason
    : FAIL_CLOSED_CLASSIFICATIONS.includes(compatibilityReason)
      ? compatibilityReason
      : "UNKNOWN_INCOMPATIBILITY";

  return {
    state: compatible ? "DRY_RUN_SUCCESS" : "DRY_RUN_BLOCKED",
    classification,
    compatible,
    legacyCompatibilityApplied: plan.legacyCompatibilityApplied === true
  };
}

export function buildHistoricalReconciliationDryRunView(plan = {}) {
  const totals = plan.totals || {};
  const publicImpact = plan.publicImpact || {};
  return {
    tournamentId: String(plan.tournamentId || ""),
    mode: String(plan.mode || HISTORICAL_RECONCILIATION_DRY_RUN_MODE),
    currentRecordId: String(plan.currentRecordId || ""),
    targetRecordIds: Array.isArray(plan.targetRecordIds) ? plan.targetRecordIds.slice() : [],
    supersededRecordIds: Array.isArray(plan.supersededRecordIds) ? plan.supersededRecordIds.slice() : [],
    legacyCompatibilityApplied: plan.legacyCompatibilityApplied === true,
    legacyCompatibleRecordIds: Array.isArray(plan.legacyCompatibleRecordIds) ? plan.legacyCompatibleRecordIds.slice() : [],
    canonicalPR: Number(totals.suerteTotals?.pial_ruedo),
    canonicalTotal: Number(totals.total),
    publicCurrent: Array.isArray(publicImpact.before) ? publicImpact.before.slice() : [],
    publicTarget: Array.isArray(publicImpact.after) ? publicImpact.after.slice() : [],
    writeScope: Array.isArray(plan.writeScope) ? plan.writeScope.slice() : [],
    idempotencyEvidencePresent: Boolean(plan.requestKey && plan.planToken)
  };
}
