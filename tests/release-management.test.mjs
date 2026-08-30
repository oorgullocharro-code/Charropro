import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import releaseEngine from "../tools/release/releaseEngine.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

const {
  RELEASE_ENGINE_VERSION,
  RELEASE_MANIFEST_SCHEMA_VERSION,
  ReleaseManagementError,
  safeClone,
  calculateReleaseManifestChecksum,
  validateReleasePolicy,
  bumpReleaseVersion,
  compareReleaseVersions,
  buildReleaseChangelog,
  createRelease,
  validateReleaseManifest,
  verifyReleaseManifestIntegrity,
  recordReleaseGate,
  transitionReleaseStatus,
  recordDeployStep,
  recordRollbackStep,
  recordPostDeployCheck,
  evaluateReleaseGates,
  buildDeployPlan,
  buildRollbackPlan,
  buildPostDeployChecklist
} = releaseEngine;

const policy = JSON.parse(await readFile(new URL("../tools/release/releasePolicy.json", import.meta.url), "utf8"));
const rulesHash = crypto.createHash("sha256")
  .update(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url)))
  .digest("hex");
const commitHash = "3e74a396f15cb32c3eff2adf178590b14948fef5";
const treeHash = "1111111111111111111111111111111111111111";
const actor = { uid: "release-manager-001", name: "Release Manager", role: "release-manager" };

assert.equal(RELEASE_ENGINE_VERSION, "1.0.0");
assert.equal(RELEASE_MANIFEST_SCHEMA_VERSION, "charropro-release/1");
assert.equal(validateReleasePolicy(policy).valid, true);
assert.equal(Object.isFrozen(validateReleasePolicy(policy).policy), true);

assert.equal(bumpReleaseVersion("1.2.3", "major"), "2.0.0");
assert.equal(bumpReleaseVersion("1.2.3", "minor"), "1.3.0");
assert.equal(bumpReleaseVersion("1.2.3", "patch"), "1.2.4");
assert.equal(bumpReleaseVersion("1.2.3", "patch", { prerelease: "rc.1", build: "build.7" }), "1.2.4-rc.1+build.7");
assert.equal(compareReleaseVersions("1.0.0", "1.0.0-rc.1"), 1);
assert.equal(compareReleaseVersions("1.0.0-rc.2", "1.0.0-rc.10"), -1);
assert.throws(() => bumpReleaseVersion("1.2", "patch"), /release-version-invalid/);
assert.throws(() => bumpReleaseVersion("1.2.3", "hotfix"), /release-version-level-invalid/);

const sourceInput = releaseInput();
const sourceCopy = structuredClone(sourceInput);
const release = createRelease(sourceInput, policy);
assert.deepEqual(sourceInput, sourceCopy, "release generation does not mutate its definition");
assert.equal(release.releaseId, "rel_1.0.0_3e74a396f15c");
assert.equal(release.buildId, "build_1.0.0_20260801T180000Z_3e74a396f15c");
assert.equal(release.status, "draft");
assert.equal(release.revision, 0);
assert.equal(release.gates.length, 12);
assert.equal(release.deployPlan.length, 8);
assert.equal(release.rollbackPlan.length, 7);
assert.equal(release.postDeploy.length, 11);
assert.equal(release.integrity.algorithm, "sha256");
assert.equal(release.integrity.checksum, calculateReleaseManifestChecksum(release));
assert.equal(validateReleaseManifest(release, policy).valid, true);
assert.equal(verifyReleaseManifestIntegrity(release, policy).valid, true);
assert.equal(Object.isFrozen(release), true);
assert.equal(Object.isFrozen(release.compatibility.firebase), true);
assert.equal(Object.isFrozen(release.changelog.changes[0]), true);
assert.doesNotThrow(() => JSON.stringify(release));
const customIdentity = releaseInput();
customIdentity.releaseId = "rel_custom";
assert.throws(() => createRelease(customIdentity, policy), /release-id-commit-mismatch/);

const deterministic = createRelease(releaseInput(), policy);
assert.deepEqual(deterministic, release, "the same candidate produces the same manifest and checksum");

const changelog = buildReleaseChangelog({
  summary: "Release estable",
  changes: [
    change("change-b", "fixed", "portal", "PUBLIC-001", "medium", false),
    change("change-a", "security", "core", "CORE-001", "critical", true)
  ]
});
assert.deepEqual(changelog.changes.map((entry) => entry.changeId), ["change-a", "change-b"]);
assert.deepEqual(changelog.breakingChanges, ["change-a"]);
assert.equal(changelog.riskSummary.critical, 1);
assert.equal(changelog.riskSummary.medium, 1);

const tampered = structuredClone(release);
tampered.modules[0].version = "9.9.9";
assert.equal(verifyReleaseManifestIntegrity(tampered, policy).valid, false);
assert.ok(verifyReleaseManifestIntegrity(tampered, policy).errors.includes("release-integrity-checksum-mismatch"));

const badCompatibility = releaseInput();
badCompatibility.compatibility.client.minimumVersion = "2.0.0";
badCompatibility.compatibility.client.targetVersion = "1.0.0";
assert.throws(() => createRelease(badCompatibility, policy), /release-client-version-range-invalid/);

assert.equal(evaluateReleaseGates(release, policy).passed, false, "a draft fails closed while evidence is missing");
assert.throws(() => transitionReleaseStatus(release, "approved", actor, operation(0, 1, "approve-early"), policy), /release-status-transition-invalid/);

let current = transitionReleaseStatus(release, "validating", actor, operation(0, 1, "start-validation"), policy).manifest;
const beforeInvalidGate = current;
assert.throws(() => recordReleaseGate(current, {
  gateId: "emulator",
  status: "passed",
  evidence: {
    suiteId: "emulator-suite-001",
    projectId: "charropro-production",
    production: true,
    result: "passed",
    verifiedAt: "2026-08-01T18:01:30.000Z"
  }
}, actor, operation(current.revision, 2, "bad-emulator"), policy), /release-emulator-evidence-invalid/);
assert.deepEqual(current, beforeInvalidGate, "a rejected gate update is atomic");
assert.throws(() => recordReleaseGate(current, {
  gateId: "backup",
  status: "waived",
  reason: "skip"
}, actor, operation(current.revision, 2, "waive-backup"), policy), /release-critical-gate-cannot-be-waived/);
assert.throws(() => recordReleaseGate(current, {
  gateId: "source",
  status: "passed",
  evidence: { ...gateEvidence("source"), commit: "2".repeat(40) }
}, actor, operation(current.revision, 2, "wrong-source"), policy), /release-source-evidence-mismatch/);

for (const [index, gate] of policy.gates.entries()) {
  const options = operation(current.revision, index + 2, `gate-${gate.gateId}`);
  const result = recordReleaseGate(current, {
    gateId: gate.gateId,
    status: "passed",
    evidence: gateEvidence(gate.gateId)
  }, actor, options, policy);
  assert.equal(result.idempotent, false);
  assert.equal(result.revision, current.revision + 1);
  assert.notEqual(result.manifest.integrity.checksum, current.integrity.checksum);
  current = result.manifest;

  const repeated = recordReleaseGate(current, {
    gateId: gate.gateId,
    status: "passed",
    evidence: gateEvidence(gate.gateId)
  }, actor, { ...options, expectedRevision: 0 }, policy);
  assert.equal(repeated.idempotent, true, "retries return the already committed release revision");
  assert.equal(repeated.manifest.revision, current.revision);
}

assert.equal(evaluateReleaseGates(current, policy).passed, true);
assert.throws(() => recordReleaseGate(current, {
  gateId: "audit",
  status: "failed",
  reason: "different request",
  evidence: null
}, actor, operation(current.revision, 12, "gate-audit"), policy), /release-idempotency-conflict/);
assert.throws(() => transitionReleaseStatus(current, "approved", actor, operation(current.revision - 1, 20, "approve-conflict"), policy), /release-revision-conflict/);

current = transitionReleaseStatus(current, "approved", actor, operation(current.revision, 20, "approve"), policy).manifest;
assert.equal(current.status, "approved");
current = transitionReleaseStatus(current, "deploying", actor, operation(current.revision, 21, "deploy"), policy).manifest;
assert.equal(current.status, "deploying");
assert.throws(() => recordDeployStep(current, {
  stepId: "functions",
  status: "passed",
  evidence: { artifact: "functions-v1" }
}, actor, operation(current.revision, 22, "deploy-out-of-order"), policy), /release-deploy-step-order-invalid/);

for (const step of current.deployPlan.filter((item) => item.order <= 6)) {
  current = recordDeployStep(current, {
    stepId: step.stepId,
    status: "passed",
    evidence: { artifact: `${step.stepId}-artifact`, verified: true }
  }, actor, operation(current.revision, 30 + step.order, `deploy-${step.stepId}`), policy).manifest;
}
current = transitionReleaseStatus(current, "verifying", actor, operation(current.revision, 40, "verify"), policy).manifest;
assert.equal(current.status, "verifying");

for (const step of current.deployPlan.filter((item) => item.order > 6)) {
  current = recordDeployStep(current, {
    stepId: step.stepId,
    status: "passed",
    evidence: { report: `${step.stepId}-report`, verified: true }
  }, actor, operation(current.revision, 40 + step.order, `deploy-${step.stepId}`), policy).manifest;
}
assert.throws(() => transitionReleaseStatus(current, "completed", actor, operation(current.revision, 50, "complete-early"), policy), /release-post-deploy-incomplete/);

for (const [index, check] of current.postDeploy.entries()) {
  current = recordPostDeployCheck(current, {
    checkId: check.checkId,
    status: "passed",
    evidence: { reportId: `post-${check.checkId}`, result: "passed" }
  }, actor, operation(current.revision, 60 + index, `post-${check.checkId}`), policy).manifest;
}
current = transitionReleaseStatus(current, "completed", actor, operation(current.revision, 80, "complete"), policy).manifest;
assert.equal(current.status, "completed");
assert.equal(validateReleaseManifest(current, policy).valid, true);
assert.equal(current.createdAt, release.createdAt, "createdAt is immutable across the release lifecycle");
assert.equal(current.audit.length, current.revision + 1);

let rollbackRelease = transitionReleaseStatus(release, "validating", actor, operation(0, 100, "rollback-validation"), policy).manifest;
for (const [index, gate] of policy.gates.entries()) {
  rollbackRelease = recordReleaseGate(rollbackRelease, {
    gateId: gate.gateId,
    status: "passed",
    evidence: gateEvidence(gate.gateId)
  }, actor, operation(rollbackRelease.revision, 101 + index, `rollback-gate-${gate.gateId}`), policy).manifest;
}
rollbackRelease = transitionReleaseStatus(
  rollbackRelease,
  "approved",
  actor,
  operation(rollbackRelease.revision, 120, "rollback-approve"),
  policy
).manifest;
rollbackRelease = transitionReleaseStatus(
  rollbackRelease,
  "deploying",
  actor,
  operation(rollbackRelease.revision, 121, "rollback-deploy"),
  policy
).manifest;
assert.throws(() => transitionReleaseStatus(
  rollbackRelease,
  "rolling_back",
  actor,
  operation(rollbackRelease.revision, 122, "rollback-without-reason"),
  policy
), /release-status-reason-required/);
rollbackRelease = transitionReleaseStatus(
  rollbackRelease,
  "rolling_back",
  actor,
  { ...operation(rollbackRelease.revision, 122, "rollback-start"), reason: "Functions health check failed" },
  policy
).manifest;
assert.throws(() => transitionReleaseStatus(
  rollbackRelease,
  "rolled_back",
  actor,
  operation(rollbackRelease.revision, 123, "rollback-finish-early"),
  policy
), /release-rollback-plan-incomplete/);
assert.throws(() => recordRollbackStep(rollbackRelease, {
  stepId: "client",
  status: "passed",
  evidence: { deletesData: false }
}, actor, operation(rollbackRelease.revision, 123, "rollback-out-of-order"), policy), /release-rollback-step-order-invalid/);
for (const step of rollbackRelease.rollbackPlan) {
  rollbackRelease = recordRollbackStep(rollbackRelease, {
    stepId: step.stepId,
    status: "passed",
    evidence: { artifact: `${step.stepId}-previous`, deletesData: false, deletesHistory: false }
  }, actor, operation(rollbackRelease.revision, 130 + step.order, `rollback-${step.stepId}`), policy).manifest;
}
rollbackRelease = transitionReleaseStatus(
  rollbackRelease,
  "rolled_back",
  actor,
  operation(rollbackRelease.revision, 140, "rollback-finished"),
  policy
).manifest;
assert.equal(rollbackRelease.status, "rolled_back");
assert.equal(rollbackRelease.rollbackPlan.every((step) => step.status === "passed"), true);
assert.equal(validateReleaseManifest(rollbackRelease, policy).valid, true);

const deployPlan = buildDeployPlan(policy);
const rollbackPlan = buildRollbackPlan(policy);
const postDeploy = buildPostDeployChecklist(policy);
assert.deepEqual(deployPlan.map((step) => step.stepId), [
  "freeze", "backup", "rules", "functions", "configuration", "client", "verify", "monitor"
]);
assert.deepEqual(rollbackPlan.map((step) => step.stepId), [
  "freeze-rollout", "client", "configuration", "functions", "rules", "documentation", "validate"
]);
assert.equal(rollbackPlan.every((step) => step.preservesHistory && !step.deletesData), true);
assert.ok(postDeploy.some((check) => check.checkId === "official-score-concurrency"));
assert.ok(postDeploy.some((check) => check.checkId === "public-projection-recovery"));

const falsy = safeClone({ zero: 0, disabled: false, empty: "", nullable: null });
assert.deepEqual(falsy, { zero: 0, disabled: false, empty: "", nullable: null });
assert.throws(() => safeClone({ fn: () => true }), ReleaseManagementError);
assert.throws(() => safeClone({ value: 1n }), /release-value-not-serializable/);
const cyclic = {};
cyclic.self = cyclic;
assert.throws(() => safeClone(cyclic), /release-cycle-detected/);
const accessor = {};
Object.defineProperty(accessor, "value", { enumerable: true, get: () => "unsafe" });
assert.throws(() => safeClone(accessor), /release-accessor-rejected/);
const dangerous = Object.create(null);
Object.defineProperty(dangerous, "__proto__", { enumerable: true, value: { polluted: true } });
assert.throws(() => safeClone(dangerous), /release-dangerous-key/);
assert.equal({}.polluted, undefined);

const secretInput = releaseInput();
secretInput.changes[0].metadata = { token: "forbidden" };
assert.doesNotThrow(() => createRelease(secretInput, policy), "undeclared fields are ignored by allowlisted normalizers");
assert.throws(() => recordReleaseGate(
  transitionReleaseStatus(release, "validating", actor, operation(0, 90, "security-start"), policy).manifest,
  {
    gateId: "audit",
    status: "passed",
    evidence: { ...gateEvidence("audit"), password: "forbidden" }
  },
  actor,
  operation(1, 91, "security-evidence"),
  policy
), /release-secret-key-forbidden/);

console.log("release-management.test.mjs: OK");

function releaseInput() {
  return {
    releaseVersion: "1.0.0",
    createdAt: "2026-08-01T18:00:00.000Z",
    author: actor,
    commit: {
      hash: commitHash,
      treeHash,
      parents: ["2".repeat(40)],
      branch: "main",
      clean: true
    },
    summary: "Cierre CSP-M1",
    modules: [
      { moduleId: "core", name: "CharroPro Core", version: "1.0.0", changeType: "minor" },
      { moduleId: "portal", name: "Portal Publico", version: "2.0.0", changeType: "none" }
    ],
    tickets: [
      { ticketId: "CHARROPRO-RELEASE-MANAGEMENT-001", title: "Release Management", risk: "critical", breaking: false }
    ],
    changes: [
      change(
        "release-management-engine",
        "added",
        "core",
        "CHARROPRO-RELEASE-MANAGEMENT-001",
        "critical",
        false
      )
    ],
    risks: ["El primer release requiere evidencia externa de Emulator, IAM y Storage."],
    breakingChanges: [],
    compatibility: {
      minimumVersion: "1.0.0",
      targetVersion: "1.0.0",
      client: { minimumVersion: "1.0.0", targetVersion: "1.0.0", backwardCompatible: true },
      functions: { minimumVersion: "1.0.0", targetVersion: "1.0.0", backwardCompatible: true },
      firebase: {
        projectId: "charropro-e8a68",
        sdkMinimumVersion: "12.13.0",
        sdkTargetVersion: "12.13.0",
        rulesHash,
        functionsRuntime: "nodejs20",
        backwardCompatible: true
      },
      schemas: [
        {
          schemaId: "charropro-backup",
          minimumVersion: "charropro-backup/1",
          targetVersion: "charropro-backup/1",
          backwardCompatible: true,
          migrationRequired: false
        },
        {
          schemaId: "charropro-configuration",
          minimumVersion: "charropro-configuration/1",
          targetVersion: "charropro-configuration/1",
          backwardCompatible: true,
          migrationRequired: false
        }
      ]
    }
  };
}

function change(changeId, type, module, ticketId, risk, breaking) {
  return {
    changeId,
    type,
    module,
    description: `Cambio ${changeId}`,
    ticketId,
    risk,
    breaking,
    compatibilityNotes: "Compatible"
  };
}

function operation(expectedRevision, seconds, idempotencyKey) {
  return {
    expectedRevision,
    idempotencyKey,
    now: `2026-08-01T18:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.000Z`
  };
}

function gateEvidence(gateId) {
  const checkedAt = "2026-08-01T18:01:00.000Z";
  const evidence = {
    source: { commit: commitHash, treeHash, branch: "main", clean: true, checkedAt },
    tests: { suiteId: "suite-csp-m1", passed: 50, failed: 0, command: "for test_file in tests/*.test.mjs", checkedAt },
    backup: {
      backupId: "backup-csp-m1",
      scope: "system",
      checksum: "a".repeat(64),
      storageRef: "backups/system/backup-csp-m1.json",
      verifiedAt: checkedAt
    },
    restore: {
      restoreValidationId: "restore-validation-csp-m1",
      backupId: "backup-csp-m1",
      target: "isolated-test-project",
      result: "passed",
      verifiedAt: checkedAt
    },
    configuration: {
      configurationId: "charropro-runtime",
      version: 1,
      checksum: "b".repeat(64),
      result: "passed",
      verifiedAt: checkedAt
    },
    emulator: {
      suiteId: "emulator-csp-m1",
      projectId: "demo-charropro-release",
      production: false,
      result: "passed",
      verifiedAt: checkedAt
    },
    rules: {
      suiteId: "rules-csp-m1",
      rulesHash,
      result: "passed",
      verifiedAt: checkedAt
    },
    iam: {
      reviewId: "iam-csp-m1",
      projectId: "charropro-e8a68",
      reviewedBy: "security-reviewer",
      result: "passed",
      verifiedAt: checkedAt
    },
    storage: {
      validationId: "storage-csp-m1",
      bucket: "charropro-e8a68.firebasestorage.app",
      rulesHash: "c".repeat(64),
      result: "passed",
      verifiedAt: checkedAt
    },
    json: { files: 5, passed: 5, failed: 0, checkedAt },
    security: {
      reportId: "security-csp-m1",
      secretsFound: 0,
      criticalFindings: 0,
      result: "passed",
      checkedAt
    },
    audit: { auditId: "audit-csp-m1", auditor: "technical-auditor", result: "passed", checkedAt }
  };
  return structuredClone(evidence[gateId]);
}
