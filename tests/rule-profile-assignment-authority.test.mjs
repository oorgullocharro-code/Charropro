import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import assignmentEngine from "../functions/ruleProfileAssignmentEngine.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

const {
  RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION,
  RuleProfileAssignmentError,
  applyTournamentRuleProfileAssignment
} = assignmentEngine;
const registry = JSON.parse(await readFile(new URL(
  "../functions/ruleProfileCertificationRegistry.json",
  import.meta.url
), "utf8"));
const certificate = registry.profiles["FMCH_2026_LIBRE@0.6.0"];
const NOW = "2026-08-21T06:00:00.000Z";
const actor = Object.freeze({
  uid: "platform-admin-1",
  name: "Platform Admin",
  role: "supervisor",
  tenantId: "",
  organizationId: "",
  platformAdmin: true,
  active: true
});
const lifecycle = Object.freeze({
  profileId: "FMCH_2026_LIBRE",
  version: "0.6.0",
  status: "active",
  revision: 2,
  fingerprint: "rptp_0f90f7a3944a82d7",
  certification: { verdict: "PASS", remainingP0: 0, activationReadyEligibility: true },
  effectiveFrom: "2026-08-20T00:00:00.000Z",
  effectiveTo: null
});
const request = Object.freeze({
  tournamentId: "tournament-safe-1",
  profileId: "FMCH_2026_LIBRE",
  version: "0.6.0",
  expectedRevision: 0,
  idempotencyKey: "assignment-safe-tournament-001",
  source: "productive-default",
  policyId: "fmch-2026-libre-productive-default-v1",
  reason: "Production default",
  tenantId: "",
  organizationId: ""
});
const emptyTournament = Object.freeze({
  info: Object.freeze({ id: request.tournamentId, name: "Safe test", category: "Libre" }),
  teams: Object.freeze({}),
  charreadas: Object.freeze({})
});

assert.equal(RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION, "1.0.0");
const before = structuredClone(emptyTournament);
const assigned = applyTournamentRuleProfileAssignment(emptyTournament, request, actor, lifecycle, certificate, { now: NOW });
assert.deepEqual(emptyTournament, before, "assignment never mutates the tournament input");
assert.equal(assigned.outcome.ok, true);
assert.equal(assigned.outcome.revision, 1);
assert.equal(assigned.outcome.assignment.status, "active");
assert.equal(assigned.outcome.assignment.contentFingerprint, lifecycle.fingerprint);
assert.equal(assigned.tournament.info.ruleProfileId, request.profileId);
assert.equal(assigned.tournament.info.ruleProfileVersion, request.version);
assert.equal(assigned.tournament.info.ruleProfileAssignmentRevision, 1);
assert.equal(Object.keys(assigned.tournament.ruleProfileAssignmentAudit).length, 1);
assert.equal(Object.keys(assigned.tournament.ruleProfileAssignmentRequests).length, 1);

const retry = applyTournamentRuleProfileAssignment(assigned.tournament, request, actor, lifecycle, certificate, {
  now: "2026-08-21T06:05:00.000Z"
});
assert.equal(retry.outcome.ok, true);
assert.equal(retry.outcome.idempotent, true);
assert.equal(retry.outcome.revision, 1);
assert.deepEqual(retry.tournament, assigned.tournament);

const stale = applyTournamentRuleProfileAssignment(
  assigned.tournament,
  { ...request, idempotencyKey: "assignment-stale-revision-001", expectedRevision: 0 },
  actor,
  lifecycle,
  certificate,
  { now: NOW }
);
assert.equal(stale.outcome.ok, false);
assert.equal(stale.outcome.reason, "tournament-rule-profile-revision-conflict");
assert.deepEqual(stale.tournament, assigned.tournament);

const historical = {
  ...structuredClone(emptyTournament),
  publishedScores: { official_1: { id: "official_1" } },
  officialScoreLedger: { attempt_1: { activeRecordId: "official_1" } }
};
const blockedHistory = applyTournamentRuleProfileAssignment(historical, request, actor, lifecycle, certificate, { now: NOW });
assert.equal(blockedHistory.outcome.ok, false);
assert.equal(blockedHistory.outcome.reason, "tournament-rule-profile-historical-scores-blocked");
assert.deepEqual(blockedHistory.tournament, historical);

assert.throws(
  () => applyTournamentRuleProfileAssignment(emptyTournament, request, { ...actor, platformAdmin: false }, lifecycle, certificate, { now: NOW }),
  (error) => error instanceof RuleProfileAssignmentError && error.code === "tournament-rule-profile-platform-admin-required"
);
assert.throws(
  () => applyTournamentRuleProfileAssignment(emptyTournament, request, actor, { ...lifecycle, status: "ready" }, certificate, { now: NOW }),
  (error) => error.code === "tournament-rule-profile-not-active"
);
assert.throws(
  () => applyTournamentRuleProfileAssignment(emptyTournament, request, actor, { ...lifecycle, fingerprint: "rptp_bad" }, certificate, { now: NOW }),
  (error) => error.code === "tournament-rule-profile-fingerprint-mismatch"
);
assert.throws(
  () => applyTournamentRuleProfileAssignment(
    { info: { ...emptyTournament.info, tenantId: "tenant-a" } },
    { ...request, tenantId: "tenant-b" },
    actor,
    lifecycle,
    certificate,
    { now: NOW }
  ),
  (error) => error.code === "tournament-rule-profile-tenant-mismatch"
);

console.log("rule-profile-assignment-authority.test.mjs: ok");
