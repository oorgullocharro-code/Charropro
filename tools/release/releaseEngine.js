const crypto = require("node:crypto");

const RELEASE_ENGINE_VERSION = "1.0.0";
const RELEASE_MANIFEST_SCHEMA_VERSION = "charropro-release/1";
const RELEASE_CHANGE_TYPES = Object.freeze([
  "added",
  "changed",
  "fixed",
  "security",
  "deprecated",
  "removed",
  "documentation"
]);
const RELEASE_RISK_LEVELS = Object.freeze(["low", "medium", "high", "critical"]);
const RELEASE_STEP_STATUSES = Object.freeze(["pending", "running", "passed", "failed", "rolled_back"]);
const POST_DEPLOY_STATUSES = Object.freeze(["pending", "passed", "failed", "blocked"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SECRET_KEYS = new Set([
  "accesstoken",
  "apikey",
  "authorization",
  "cookie",
  "credential",
  "credentials",
  "idtoken",
  "password",
  "privatekey",
  "refreshtoken",
  "secret",
  "signedurl",
  "token"
]);
const DEFAULT_LIMITS = Object.freeze({
  maxDepth: 16,
  maxArrayLength: 2000,
  maxObjectKeys: 500,
  maxNodes: 20000,
  maxStringLength: 50000,
  maxModules: 500,
  maxTickets: 500,
  maxAuditEvents: 5000
});
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const CHECKSUM = /^[a-f0-9]{64}$/;
const COMMIT_HASH = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

class ReleaseManagementError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "ReleaseManagementError";
    this.code = code;
    this.details = isPlainObject(details) ? { ...details } : {};
  }
}

function safeClone(value, options = {}) {
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const seen = new WeakSet();
  const state = { nodes: 0 };

  function visit(current, depth) {
    state.nodes += 1;
    if (state.nodes > limits.maxNodes) throw new ReleaseManagementError("release-size-limit");
    if (depth > limits.maxDepth) throw new ReleaseManagementError("release-depth-limit");
    if (current === null || typeof current === "boolean") return current;
    if (typeof current === "string") {
      if (current.length > limits.maxStringLength) throw new ReleaseManagementError("release-string-limit");
      return current;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) throw new ReleaseManagementError("release-number-invalid");
      return current;
    }
    if (["undefined", "function", "symbol", "bigint"].includes(typeof current)) {
      throw new ReleaseManagementError("release-value-not-serializable");
    }
    if (seen.has(current)) throw new ReleaseManagementError("release-cycle-detected");
    seen.add(current);
    try {
      if (Array.isArray(current)) {
        if (current.length > limits.maxArrayLength) throw new ReleaseManagementError("release-array-limit");
        return current.map((item) => visit(item, depth + 1));
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new ReleaseManagementError("release-object-invalid");
      }
      const keys = Reflect.ownKeys(current);
      if (keys.some((key) => typeof key === "symbol")) {
        throw new ReleaseManagementError("release-symbol-key");
      }
      if (keys.length > limits.maxObjectKeys) throw new ReleaseManagementError("release-object-key-limit");
      const output = {};
      for (const key of keys) {
        if (DANGEROUS_KEYS.has(key)) throw new ReleaseManagementError("release-dangerous-key");
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        if (!descriptor || descriptor.get || descriptor.set) {
          throw new ReleaseManagementError("release-accessor-rejected");
        }
        output[key] = visit(descriptor.value, depth + 1);
      }
      return output;
    } finally {
      seen.delete(current);
    }
  }

  return visit(value, 0);
}

function canonicalStringify(value) {
  return JSON.stringify(sortCanonical(safeClone(value)));
}

function calculateReleaseManifestChecksum(manifest) {
  const candidate = safeClone(manifest);
  delete candidate.integrity;
  return crypto.createHash("sha256").update(canonicalStringify(candidate)).digest("hex");
}

function fingerprintReleaseOperation(value) {
  return crypto.createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function validateReleasePolicy(input) {
  try {
    const policy = normalizePolicy(input);
    return { valid: true, errors: [], warnings: [], policy };
  } catch (error) {
    return {
      valid: false,
      errors: [String(error?.code || error?.message || "release-policy-invalid")],
      warnings: [],
      policy: null
    };
  }
}

function normalizePolicy(input) {
  const policy = safeClone(input);
  if (!isPlainObject(policy)) throw new ReleaseManagementError("release-policy-invalid");
  requireSemver(policy.policyVersion, "release-policy-version-invalid");
  if (policy.manifestSchemaVersion !== RELEASE_MANIFEST_SCHEMA_VERSION) {
    throw new ReleaseManagementError("release-policy-schema-unsupported");
  }
  if (policy.versioning?.strategy !== "semantic-versioning" || policy.versioning?.format !== "MAJOR.MINOR.PATCH") {
    throw new ReleaseManagementError("release-versioning-strategy-invalid");
  }
  const statuses = uniqueStringList(policy.statuses, "release-policy-statuses-invalid");
  for (const required of ["draft", "validating", "approved", "deploying", "verifying", "completed", "failed", "rolling_back", "rolled_back", "cancelled"]) {
    if (!statuses.includes(required)) throw new ReleaseManagementError("release-policy-status-required", { status: required });
  }
  if (!isPlainObject(policy.statusTransitions)) throw new ReleaseManagementError("release-policy-transitions-invalid");
  for (const status of statuses) {
    const transitions = uniqueStringList(policy.statusTransitions[status], "release-policy-transition-invalid");
    if (transitions.some((target) => !statuses.includes(target))) {
      throw new ReleaseManagementError("release-policy-transition-target-invalid", { status });
    }
  }
  const gateStatuses = uniqueStringList(policy.gateStatuses, "release-policy-gate-statuses-invalid");
  for (const required of ["pending", "passed", "failed", "blocked", "waived"]) {
    if (!gateStatuses.includes(required)) throw new ReleaseManagementError("release-policy-gate-status-required", { status: required });
  }
  if (!Array.isArray(policy.gates) || !policy.gates.length) throw new ReleaseManagementError("release-policy-gates-required");
  const gateIds = new Set();
  const gates = policy.gates.map((gate) => {
    const normalized = {
      gateId: normalizeIdentifier(gate.gateId, "release-gate-id-invalid"),
      label: normalizeString(gate.label, "release-gate-label-required", 200),
      required: normalizeBoolean(gate.required, "release-gate-required-invalid"),
      critical: normalizeBoolean(gate.critical, "release-gate-critical-invalid"),
      evidenceFields: uniqueStringList(gate.evidenceFields, "release-gate-evidence-fields-invalid")
    };
    if (gateIds.has(normalized.gateId)) throw new ReleaseManagementError("release-gate-duplicate");
    gateIds.add(normalized.gateId);
    return normalized;
  });
  for (const required of ["tests", "backup", "restore", "configuration", "emulator", "rules", "iam", "storage", "json", "security", "audit"]) {
    if (!gateIds.has(required)) throw new ReleaseManagementError("release-gate-required", { gateId: required });
  }
  const deploySequence = normalizeOrderedSteps(policy.deploySequence, "release-deploy-step").map((step) => ({
    ...step,
    requires: uniqueStringList(step.requires, "release-deploy-requires-invalid")
  }));
  for (const step of deploySequence) {
    if (step.requires.some((gateId) => !gateIds.has(gateId))) {
      throw new ReleaseManagementError("release-deploy-gate-invalid", { stepId: step.stepId });
    }
  }
  const rollbackSequence = normalizeOrderedSteps(policy.rollbackSequence, "release-rollback-step");
  const postDeployChecks = uniqueStringList(policy.postDeployChecks, "release-post-deploy-checks-invalid");
  if (!postDeployChecks.length) throw new ReleaseManagementError("release-post-deploy-checks-required");
  const limits = normalizeLimits(policy.limits);
  const normalized = {
    ...policy,
    statuses,
    statusTransitions: Object.fromEntries(statuses.map((status) => [
      status,
      [...policy.statusTransitions[status]]
    ])),
    gateStatuses,
    gates,
    deploySequence,
    rollbackSequence,
    postDeployChecks,
    limits
  };
  assertNoSecretKeys(normalized);
  return deepFreeze(normalized);
}

function bumpReleaseVersion(currentVersion, level, options = {}) {
  const parsed = parseSemver(currentVersion);
  if (!["major", "minor", "patch"].includes(level)) {
    throw new ReleaseManagementError("release-version-level-invalid");
  }
  if (level === "major") {
    parsed.major += 1;
    parsed.minor = 0;
    parsed.patch = 0;
  } else if (level === "minor") {
    parsed.minor += 1;
    parsed.patch = 0;
  } else {
    parsed.patch += 1;
  }
  let version = `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  if (options.prerelease) {
    const prerelease = normalizePrerelease(options.prerelease);
    version += `-${prerelease}`;
  }
  if (options.build) {
    const build = normalizeBuildMetadata(options.build);
    version += `+${build}`;
  }
  return version;
}

function compareReleaseVersions(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  const aParts = a.prerelease.split(".");
  const bParts = b.prerelease.split(".");
  const length = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < length; index += 1) {
    if (aParts[index] === undefined) return -1;
    if (bParts[index] === undefined) return 1;
    if (aParts[index] === bParts[index]) continue;
    const aNumber = /^\d+$/.test(aParts[index]);
    const bNumber = /^\d+$/.test(bParts[index]);
    if (aNumber && bNumber) return Number(aParts[index]) > Number(bParts[index]) ? 1 : -1;
    if (aNumber !== bNumber) return aNumber ? -1 : 1;
    return aParts[index] > bParts[index] ? 1 : -1;
  }
  return 0;
}

function buildReleaseChangelog(input = {}) {
  const changes = Array.isArray(input.changes) ? input.changes : [];
  const normalized = changes.map((change, index) => normalizeChange(change, index));
  normalized.sort((left, right) => (
    left.module.localeCompare(right.module)
    || left.type.localeCompare(right.type)
    || left.changeId.localeCompare(right.changeId)
  ));
  return deepFreeze({
    formatVersion: "1.0.0",
    summary: normalizeString(input.summary || "", null, 1000),
    changes: normalized,
    breakingChanges: normalized.filter((change) => change.breaking).map((change) => change.changeId),
    riskSummary: countBy(normalized, "risk")
  });
}

function createRelease(input, policyInput) {
  const policy = normalizePolicy(policyInput);
  const releaseVersion = requireSemver(input.releaseVersion, "release-version-invalid");
  const commit = normalizeCommit(input.commit);
  const createdAt = normalizeIsoDate(input.createdAt, "release-created-at-invalid");
  const author = normalizeActor(input.author, true);
  const releaseId = input.releaseId
    ? normalizeIdentifier(input.releaseId, "release-id-invalid")
    : buildReleaseId(releaseVersion, commit.hash);
  const buildId = input.buildId
    ? normalizeIdentifier(input.buildId, "release-build-id-invalid")
    : buildReleaseBuildId(releaseVersion, commit.hash, createdAt);
  if (releaseId !== buildReleaseId(releaseVersion, commit.hash)) {
    throw new ReleaseManagementError("release-id-commit-mismatch");
  }
  if (buildId !== buildReleaseBuildId(releaseVersion, commit.hash, createdAt)) {
    throw new ReleaseManagementError("release-build-id-mismatch");
  }
  const modules = normalizeModules(input.modules, policy.limits.maxModules);
  const tickets = normalizeTickets(input.tickets, policy.limits.maxTickets);
  const changelog = buildReleaseChangelog({ summary: input.summary, changes: input.changes });
  const compatibility = normalizeCompatibility(input.compatibility);
  const gates = policy.gates.map((gate) => ({
    gateId: gate.gateId,
    label: gate.label,
    required: gate.required,
    critical: gate.critical,
    status: "pending",
    evidence: null,
    checkedAt: null,
    checkedBy: null,
    reason: null
  }));
  const deployPlan = buildDeployPlan(policy);
  const rollbackPlan = buildRollbackPlan(policy);
  const postDeploy = buildPostDeployChecklist(policy);
  const manifest = {
    releaseEngineVersion: RELEASE_ENGINE_VERSION,
    schemaVersion: RELEASE_MANIFEST_SCHEMA_VERSION,
    policyVersion: policy.policyVersion,
    releaseId,
    releaseVersion,
    buildId,
    createdAt,
    updatedAt: createdAt,
    status: "draft",
    revision: 0,
    author,
    commit,
    compatibility,
    modules,
    tickets,
    changelog,
    risks: normalizeTextList(input.risks, 500, 2000),
    breakingChanges: normalizeTextList(input.breakingChanges, 500, 2000),
    gates,
    deployPlan,
    rollbackPlan,
    postDeploy,
    operations: [],
    audit: [{
      auditId: buildAuditId(releaseId, 0, "release-created"),
      operation: "release-created",
      result: "succeeded",
      revision: 0,
      timestamp: createdAt,
      actor: author,
      details: { buildId, commit: commit.hash }
    }]
  };
  assertNoSecretKeys(manifest);
  return sealManifest(manifest);
}

function validateReleaseManifest(manifest, policyInput) {
  const policyResult = validateReleasePolicy(policyInput);
  if (!policyResult.valid) return { valid: false, errors: policyResult.errors, warnings: [] };
  const policy = policyResult.policy;
  const errors = [];
  const warnings = [];
  let candidate;
  try {
    candidate = safeClone(manifest, { limits: policy.limits });
    assertNoSecretKeys(candidate);
    validateManifestShape(candidate, policy);
    const expectedChecksum = calculateReleaseManifestChecksum(candidate);
    if (!candidate.integrity || candidate.integrity.algorithm !== "sha256") {
      errors.push("release-integrity-algorithm-invalid");
    }
    if (!candidate.integrity || candidate.integrity.checksum !== expectedChecksum) {
      errors.push("release-integrity-checksum-mismatch");
    }
    const gateEvaluation = evaluateReleaseGates(candidate, policy);
    if (["approved", "deploying", "verifying", "completed"].includes(candidate.status) && !gateEvaluation.passed) {
      errors.push("release-required-gates-incomplete");
    }
    if (candidate.status === "completed") {
      if (candidate.deployPlan.some((step) => step.status !== "passed")) {
        errors.push("release-deploy-plan-incomplete");
      }
      if (candidate.postDeploy.some((check) => check.status !== "passed")) {
        errors.push("release-post-deploy-incomplete");
      }
    }
    if (candidate.commit.clean !== true) warnings.push("release-source-not-clean");
  } catch (error) {
    errors.push(String(error?.code || error?.message || "release-manifest-invalid"));
  }
  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    manifest: errors.length ? null : deepFreeze(candidate)
  };
}

function verifyReleaseManifestIntegrity(manifest, policyInput) {
  const validation = validateReleaseManifest(manifest, policyInput);
  let expectedChecksum = null;
  try {
    expectedChecksum = calculateReleaseManifestChecksum(manifest);
  } catch {
    expectedChecksum = null;
  }
  return {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    algorithm: "sha256",
    checksum: manifest?.integrity?.checksum || null,
    expectedChecksum
  };
}

function normalizeReleaseManifest(manifest, policyInput) {
  const validation = validateReleaseManifest(manifest, policyInput);
  if (!validation.valid) {
    throw new ReleaseManagementError(validation.errors[0] || "release-manifest-invalid", {
      errors: validation.errors
    });
  }
  return validation.manifest;
}

function recordReleaseGate(manifestInput, gateResult, actorInput, options, policyInput) {
  const policy = normalizePolicy(policyInput);
  const manifest = normalizeReleaseManifest(manifestInput, policy);
  const actor = normalizeActor(actorInput, true);
  const operationInput = {
    operation: "gate-recorded",
    gateId: gateResult.gateId,
    status: gateResult.status,
    evidence: gateResult.evidence || null,
    reason: gateResult.reason || null,
    actor
  };
  const replay = prepareOperation(manifest, operationInput, options);
  if (replay.idempotent) return replay;
  if (!["draft", "validating", "failed"].includes(manifest.status)) {
    throw new ReleaseManagementError("release-gate-status-locked");
  }
  const definition = policy.gates.find((gate) => gate.gateId === gateResult.gateId);
  if (!definition) throw new ReleaseManagementError("release-gate-unknown");
  const status = normalizeEnum(gateResult.status, policy.gateStatuses, "release-gate-status-invalid");
  if (status === "pending") throw new ReleaseManagementError("release-gate-result-required");
  if (status === "waived" && definition.critical) throw new ReleaseManagementError("release-critical-gate-cannot-be-waived");
  const evidence = gateResult.evidence == null ? null : safeClone(gateResult.evidence, { limits: policy.limits });
  if (status === "passed") validateGateEvidence(definition, evidence, manifest);
  if (["failed", "blocked"].includes(status) && !normalizeString(gateResult.reason || "", null, 1000)) {
    throw new ReleaseManagementError("release-gate-reason-required");
  }
  const now = normalizeIsoDate(options?.now, "release-operation-time-invalid");
  const next = safeClone(manifest, { limits: policy.limits });
  const gate = next.gates.find((item) => item.gateId === definition.gateId);
  gate.status = status;
  gate.evidence = evidence;
  gate.checkedAt = now;
  gate.checkedBy = actor;
  gate.reason = normalizeString(gateResult.reason || "", null, 1000) || null;
  return finalizeOperation(next, manifest, operationInput, actor, options, now, policy);
}

function transitionReleaseStatus(manifestInput, targetStatus, actorInput, options, policyInput) {
  const policy = normalizePolicy(policyInput);
  const manifest = normalizeReleaseManifest(manifestInput, policy);
  const actor = normalizeActor(actorInput, true);
  const target = normalizeEnum(targetStatus, policy.statuses, "release-status-invalid");
  const reason = normalizeString(options?.reason || "", null, 1000);
  if (["failed", "rolling_back", "cancelled"].includes(target) && !reason) {
    throw new ReleaseManagementError("release-status-reason-required");
  }
  const operationInput = { operation: "status-transition", from: manifest.status, to: target, reason, actor };
  const replay = prepareOperation(manifest, operationInput, options);
  if (replay.idempotent) return replay;
  if (!(policy.statusTransitions[manifest.status] || []).includes(target)) {
    throw new ReleaseManagementError("release-status-transition-invalid", { from: manifest.status, to: target });
  }
  if (["approved", "deploying", "verifying", "completed"].includes(target)) {
    const gates = evaluateReleaseGates(manifest, policy);
    if (!gates.passed) throw new ReleaseManagementError("release-required-gates-incomplete", { blockers: gates.blockers });
  }
  if (target === "deploying" && manifest.status !== "approved") {
    throw new ReleaseManagementError("release-not-approved");
  }
  if (target === "verifying" && !preVerificationDeployStepsPassed(manifest)) {
    throw new ReleaseManagementError("release-deploy-steps-incomplete");
  }
  if (target === "completed") {
    if (manifest.deployPlan.some((step) => step.status !== "passed")) {
      throw new ReleaseManagementError("release-deploy-plan-incomplete");
    }
    if (manifest.postDeploy.some((check) => check.status !== "passed")) {
      throw new ReleaseManagementError("release-post-deploy-incomplete");
    }
  }
  if (target === "rolled_back" && manifest.rollbackPlan.some((step) => step.status !== "passed")) {
    throw new ReleaseManagementError("release-rollback-plan-incomplete");
  }
  const now = normalizeIsoDate(options?.now, "release-operation-time-invalid");
  const next = safeClone(manifest, { limits: policy.limits });
  next.status = target;
  return finalizeOperation(next, manifest, operationInput, actor, options, now, policy);
}

function recordRollbackStep(manifestInput, stepResult, actorInput, options, policyInput) {
  const policy = normalizePolicy(policyInput);
  const manifest = normalizeReleaseManifest(manifestInput, policy);
  const actor = normalizeActor(actorInput, true);
  const operationInput = {
    operation: "rollback-step-recorded",
    stepId: stepResult.stepId,
    status: stepResult.status,
    evidence: stepResult.evidence || null,
    actor
  };
  const replay = prepareOperation(manifest, operationInput, options);
  if (replay.idempotent) return replay;
  if (manifest.status !== "rolling_back") throw new ReleaseManagementError("release-rollback-step-status-invalid");
  const status = normalizeEnum(stepResult.status, RELEASE_STEP_STATUSES, "release-step-status-invalid");
  if (!["running", "passed", "failed"].includes(status)) {
    throw new ReleaseManagementError("release-rollback-step-result-invalid");
  }
  const step = manifest.rollbackPlan.find((item) => item.stepId === stepResult.stepId);
  if (!step) throw new ReleaseManagementError("release-rollback-step-unknown");
  if (["running", "passed"].includes(status)) {
    const preceding = manifest.rollbackPlan.filter((item) => item.order < step.order);
    if (preceding.some((item) => item.status !== "passed")) {
      throw new ReleaseManagementError("release-rollback-step-order-invalid");
    }
  }
  const evidence = stepResult.evidence == null ? null : safeClone(stepResult.evidence, { limits: policy.limits });
  if (evidence?.deletesData === true || evidence?.deletesHistory === true) {
    throw new ReleaseManagementError("release-rollback-data-deletion-forbidden");
  }
  const now = normalizeIsoDate(options?.now, "release-operation-time-invalid");
  const next = safeClone(manifest, { limits: policy.limits });
  const nextStep = next.rollbackPlan.find((item) => item.stepId === step.stepId);
  nextStep.status = status;
  nextStep.evidence = evidence;
  nextStep.updatedAt = now;
  nextStep.updatedBy = actor;
  return finalizeOperation(next, manifest, operationInput, actor, options, now, policy);
}

function recordDeployStep(manifestInput, stepResult, actorInput, options, policyInput) {
  const policy = normalizePolicy(policyInput);
  const manifest = normalizeReleaseManifest(manifestInput, policy);
  const actor = normalizeActor(actorInput, true);
  const operationInput = {
    operation: "deploy-step-recorded",
    stepId: stepResult.stepId,
    status: stepResult.status,
    evidence: stepResult.evidence || null,
    actor
  };
  const replay = prepareOperation(manifest, operationInput, options);
  if (replay.idempotent) return replay;
  if (!["deploying", "verifying"].includes(manifest.status)) {
    throw new ReleaseManagementError("release-deploy-step-status-invalid");
  }
  const status = normalizeEnum(stepResult.status, RELEASE_STEP_STATUSES, "release-step-status-invalid");
  if (!["running", "passed", "failed"].includes(status)) throw new ReleaseManagementError("release-step-result-required");
  const step = manifest.deployPlan.find((item) => item.stepId === stepResult.stepId);
  if (!step) throw new ReleaseManagementError("release-deploy-step-unknown");
  if (["running", "passed"].includes(status)) {
    const preceding = manifest.deployPlan.filter((item) => item.order < step.order);
    if (preceding.some((item) => item.status !== "passed")) {
      throw new ReleaseManagementError("release-deploy-step-order-invalid");
    }
  }
  const now = normalizeIsoDate(options?.now, "release-operation-time-invalid");
  const next = safeClone(manifest, { limits: policy.limits });
  const nextStep = next.deployPlan.find((item) => item.stepId === step.stepId);
  nextStep.status = status;
  nextStep.evidence = stepResult.evidence == null ? null : safeClone(stepResult.evidence, { limits: policy.limits });
  nextStep.updatedAt = now;
  nextStep.updatedBy = actor;
  return finalizeOperation(next, manifest, operationInput, actor, options, now, policy);
}

function recordPostDeployCheck(manifestInput, checkResult, actorInput, options, policyInput) {
  const policy = normalizePolicy(policyInput);
  const manifest = normalizeReleaseManifest(manifestInput, policy);
  const actor = normalizeActor(actorInput, true);
  const operationInput = {
    operation: "post-deploy-check-recorded",
    checkId: checkResult.checkId,
    status: checkResult.status,
    evidence: checkResult.evidence || null,
    actor
  };
  const replay = prepareOperation(manifest, operationInput, options);
  if (replay.idempotent) return replay;
  if (manifest.status !== "verifying") throw new ReleaseManagementError("release-post-deploy-status-invalid");
  const status = normalizeEnum(checkResult.status, POST_DEPLOY_STATUSES, "release-post-deploy-result-invalid");
  if (status === "pending") throw new ReleaseManagementError("release-post-deploy-result-required");
  const check = manifest.postDeploy.find((item) => item.checkId === checkResult.checkId);
  if (!check) throw new ReleaseManagementError("release-post-deploy-check-unknown");
  const now = normalizeIsoDate(options?.now, "release-operation-time-invalid");
  const next = safeClone(manifest, { limits: policy.limits });
  const nextCheck = next.postDeploy.find((item) => item.checkId === check.checkId);
  nextCheck.status = status;
  nextCheck.evidence = checkResult.evidence == null ? null : safeClone(checkResult.evidence, { limits: policy.limits });
  nextCheck.checkedAt = now;
  nextCheck.checkedBy = actor;
  return finalizeOperation(next, manifest, operationInput, actor, options, now, policy);
}

function evaluateReleaseGates(manifestInput, policyInput) {
  const policy = normalizePolicy(policyInput);
  const manifest = safeClone(manifestInput, { limits: policy.limits });
  const blockers = [];
  for (const definition of policy.gates) {
    const gate = manifest.gates?.find((item) => item.gateId === definition.gateId);
    if (!gate) {
      blockers.push({ gateId: definition.gateId, reason: "missing" });
      continue;
    }
    if (definition.required && !["passed", "waived"].includes(gate.status)) {
      blockers.push({ gateId: definition.gateId, reason: gate.status });
      continue;
    }
    if (definition.critical && gate.status !== "passed") {
      blockers.push({ gateId: definition.gateId, reason: "critical-not-passed" });
      continue;
    }
    if (gate.status === "passed") {
      try {
        validateGateEvidence(definition, gate.evidence, manifest);
      } catch (error) {
        blockers.push({ gateId: definition.gateId, reason: error.code || "evidence-invalid" });
      }
    }
  }
  return deepFreeze({ passed: blockers.length === 0, blockers });
}

function buildDeployPlan(policyInput) {
  const policy = normalizePolicy(policyInput);
  return deepFreeze(policy.deploySequence.map((step) => ({
    order: step.order,
    stepId: step.stepId,
    label: step.label,
    requires: [...step.requires],
    status: "pending",
    evidence: null,
    updatedAt: null,
    updatedBy: null
  })));
}

function buildRollbackPlan(policyInput) {
  const policy = normalizePolicy(policyInput);
  return deepFreeze(policy.rollbackSequence.map((step) => ({
    order: step.order,
    stepId: step.stepId,
    label: step.label,
    status: "pending",
    evidence: null,
    updatedAt: null,
    updatedBy: null,
    preservesHistory: true,
    deletesData: false
  })));
}

function buildPostDeployChecklist(policyInput) {
  const policy = normalizePolicy(policyInput);
  return deepFreeze(policy.postDeployChecks.map((checkId, index) => ({
    order: index + 1,
    checkId,
    status: "pending",
    evidence: null,
    checkedAt: null,
    checkedBy: null
  })));
}

function validateManifestShape(manifest, policy) {
  if (!isPlainObject(manifest)) throw new ReleaseManagementError("release-manifest-invalid");
  assertAllowedKeys(manifest, [
    "releaseEngineVersion", "schemaVersion", "policyVersion", "releaseId", "releaseVersion", "buildId",
    "createdAt", "updatedAt", "status", "revision", "author", "commit", "compatibility", "modules",
    "tickets", "changelog", "risks", "breakingChanges", "gates", "deployPlan", "rollbackPlan",
    "postDeploy", "operations", "audit", "integrity"
  ], "release-manifest-field-unsupported");
  if (manifest.releaseEngineVersion !== RELEASE_ENGINE_VERSION) throw new ReleaseManagementError("release-engine-version-unsupported");
  if (manifest.schemaVersion !== RELEASE_MANIFEST_SCHEMA_VERSION) throw new ReleaseManagementError("release-schema-version-unsupported");
  if (manifest.policyVersion !== policy.policyVersion) throw new ReleaseManagementError("release-policy-version-mismatch");
  normalizeIdentifier(manifest.releaseId, "release-id-invalid");
  requireSemver(manifest.releaseVersion, "release-version-invalid");
  normalizeIdentifier(manifest.buildId, "release-build-id-invalid");
  normalizeIsoDate(manifest.createdAt, "release-created-at-invalid");
  normalizeIsoDate(manifest.updatedAt, "release-updated-at-invalid");
  if (Date.parse(manifest.updatedAt) < Date.parse(manifest.createdAt)) throw new ReleaseManagementError("release-date-order-invalid");
  normalizeEnum(manifest.status, policy.statuses, "release-status-invalid");
  normalizeNonNegativeInteger(manifest.revision, "release-revision-invalid");
  assertCanonicalMatch(manifest.author, normalizeActor(manifest.author, true), "release-author-shape-invalid");
  const commit = normalizeCommit(manifest.commit);
  if (manifest.releaseId !== buildReleaseId(manifest.releaseVersion, commit.hash)) {
    throw new ReleaseManagementError("release-id-commit-mismatch");
  }
  if (manifest.buildId !== buildReleaseBuildId(manifest.releaseVersion, commit.hash, manifest.createdAt)) {
    throw new ReleaseManagementError("release-build-id-mismatch");
  }
  assertCanonicalMatch(manifest.commit, commit, "release-commit-shape-invalid");
  assertCanonicalMatch(manifest.compatibility, normalizeCompatibility(manifest.compatibility), "release-compatibility-shape-invalid");
  assertCanonicalMatch(manifest.modules, normalizeModules(manifest.modules, policy.limits.maxModules), "release-modules-shape-invalid");
  assertCanonicalMatch(manifest.tickets, normalizeTickets(manifest.tickets, policy.limits.maxTickets), "release-tickets-shape-invalid");
  assertCanonicalMatch(manifest.changelog, buildReleaseChangelog(manifest.changelog || {}), "release-changelog-shape-invalid");
  normalizeTextList(manifest.risks, 500, 2000);
  normalizeTextList(manifest.breakingChanges, 500, 2000);
  validateManifestGates(manifest.gates, policy);
  validateDeployPlan(manifest.deployPlan, policy.deploySequence);
  validateRollbackPlan(manifest.rollbackPlan, policy.rollbackSequence);
  validatePostDeploy(manifest.postDeploy, policy);
  validateOperationChain(manifest.operations, manifest.revision);
  if (!Array.isArray(manifest.audit) || !manifest.audit.length || manifest.audit.length > policy.limits.maxAuditEvents) {
    throw new ReleaseManagementError("release-audit-invalid");
  }
  for (const event of manifest.audit) validateAuditEvent(event, manifest.releaseId);
  validateAuditChain(manifest.audit, manifest.revision);
  if (manifest.audit[0].timestamp !== manifest.createdAt || manifest.audit.at(-1).timestamp !== manifest.updatedAt) {
    throw new ReleaseManagementError("release-audit-manifest-time-mismatch");
  }
  if (!isPlainObject(manifest.integrity)) throw new ReleaseManagementError("release-integrity-invalid");
  assertAllowedKeys(manifest.integrity, ["algorithm", "checksum"], "release-integrity-field-unsupported");
}

function validateManifestGates(gates, policy) {
  if (!Array.isArray(gates) || gates.length !== policy.gates.length) throw new ReleaseManagementError("release-gates-invalid");
  const ids = new Set();
  for (const gate of gates) {
    assertAllowedKeys(gate, [
      "gateId", "label", "required", "critical", "status", "evidence", "checkedAt", "checkedBy", "reason"
    ], "release-gate-field-unsupported");
    const definition = policy.gates.find((item) => item.gateId === gate.gateId);
    if (!definition || ids.has(gate.gateId)) throw new ReleaseManagementError("release-gates-invalid");
    ids.add(gate.gateId);
    normalizeEnum(gate.status, policy.gateStatuses, "release-gate-status-invalid");
    if (gate.required !== definition.required || gate.critical !== definition.critical) {
      throw new ReleaseManagementError("release-gate-policy-mismatch");
    }
    if (gate.status === "passed") validateGateEvidence(definition, gate.evidence, null);
    if (gate.status === "waived" && definition.critical) throw new ReleaseManagementError("release-critical-gate-cannot-be-waived");
    if (gate.status === "pending") {
      if (gate.evidence !== null || gate.checkedAt !== null || gate.checkedBy !== null || gate.reason !== null) {
        throw new ReleaseManagementError("release-pending-gate-has-result");
      }
    } else {
      normalizeIsoDate(gate.checkedAt, "release-gate-checked-at-invalid");
      normalizeActor(gate.checkedBy, true);
      if (["failed", "blocked", "waived"].includes(gate.status)
        && !normalizeString(gate.reason || "", null, 1000)) {
        throw new ReleaseManagementError("release-gate-reason-required");
      }
    }
  }
}

function validateGateEvidence(definition, evidence, manifest) {
  if (!isPlainObject(evidence)) throw new ReleaseManagementError("release-gate-evidence-required");
  for (const field of definition.evidenceFields) {
    if (!Object.prototype.hasOwnProperty.call(evidence, field) || evidence[field] === null || evidence[field] === undefined) {
      throw new ReleaseManagementError("release-gate-evidence-field-required", { gateId: definition.gateId, field });
    }
  }
  for (const field of ["checkedAt", "verifiedAt"]) {
    if (Object.prototype.hasOwnProperty.call(evidence, field)) {
      normalizeIsoDate(evidence[field], "release-gate-evidence-time-invalid");
    }
  }
  if (definition.gateId === "source") {
    if (!COMMIT_HASH.test(String(evidence.commit || "").toLowerCase())) throw new ReleaseManagementError("release-source-commit-invalid");
    if (!COMMIT_HASH.test(String(evidence.treeHash || "").toLowerCase())) throw new ReleaseManagementError("release-source-tree-invalid");
    normalizeString(evidence.branch, "release-source-branch-required", 200);
    if (evidence.clean !== true) throw new ReleaseManagementError("release-source-not-clean");
    if (manifest && (evidence.commit !== manifest.commit.hash || evidence.treeHash !== manifest.commit.treeHash)) {
      throw new ReleaseManagementError("release-source-evidence-mismatch");
    }
  }
  if (definition.gateId === "tests" && (!(evidence.passed > 0) || evidence.failed !== 0)) {
    throw new ReleaseManagementError("release-tests-not-passed");
  }
  if (definition.gateId === "tests") {
    normalizePositiveInteger(evidence.passed, "release-tests-passed-invalid");
    normalizeNonNegativeInteger(evidence.failed, "release-tests-failed-invalid");
  }
  if (definition.gateId === "backup") {
    requireChecksum(evidence.checksum, "release-backup-checksum-invalid");
  }
  if (definition.gateId === "configuration") {
    requireChecksum(evidence.checksum, "release-configuration-checksum-invalid");
    normalizePositiveInteger(evidence.version, "release-configuration-version-invalid");
  }
  if (definition.gateId === "emulator" && (evidence.production !== false || evidence.result !== "passed")) {
    throw new ReleaseManagementError("release-emulator-evidence-invalid");
  }
  if (["restore", "configuration", "iam", "storage", "security", "audit"].includes(definition.gateId)
    && evidence.result !== "passed") {
    throw new ReleaseManagementError(`release-${definition.gateId}-evidence-invalid`);
  }
  if (definition.gateId === "rules") {
    requireChecksum(evidence.rulesHash, "release-rules-hash-invalid");
    if (evidence.result !== "passed") throw new ReleaseManagementError("release-rules-evidence-invalid");
  }
  if (definition.gateId === "json" && (!(evidence.files > 0) || evidence.failed !== 0)) {
    throw new ReleaseManagementError("release-json-evidence-invalid");
  }
  if (definition.gateId === "json") {
    normalizePositiveInteger(evidence.files, "release-json-files-invalid");
    normalizeNonNegativeInteger(evidence.passed, "release-json-passed-invalid");
    normalizeNonNegativeInteger(evidence.failed, "release-json-failed-invalid");
  }
  if (definition.gateId === "security" && (evidence.secretsFound !== 0 || evidence.criticalFindings !== 0)) {
    throw new ReleaseManagementError("release-security-findings-present");
  }
  if (definition.gateId === "security") {
    normalizeNonNegativeInteger(evidence.secretsFound, "release-security-secrets-invalid");
    normalizeNonNegativeInteger(evidence.criticalFindings, "release-security-findings-invalid");
  }
}

function normalizeCompatibility(input) {
  if (!isPlainObject(input)) throw new ReleaseManagementError("release-compatibility-required");
  const minimumVersion = requireSemver(input.minimumVersion, "release-minimum-version-invalid");
  const targetVersion = requireSemver(input.targetVersion, "release-target-version-invalid");
  if (compareReleaseVersions(minimumVersion, targetVersion) > 0) {
    throw new ReleaseManagementError("release-version-range-invalid");
  }
  const client = normalizeVersionCompatibility(input.client, "client");
  const functions = normalizeVersionCompatibility(input.functions, "functions");
  const firebase = normalizeFirebaseCompatibility(input.firebase);
  if (!Array.isArray(input.schemas) || !input.schemas.length) throw new ReleaseManagementError("release-schemas-required");
  const schemas = input.schemas.map((schema) => ({
    schemaId: normalizeIdentifier(schema.schemaId, "release-schema-id-invalid"),
    minimumVersion: normalizeString(schema.minimumVersion, "release-schema-minimum-required", 100),
    targetVersion: normalizeString(schema.targetVersion, "release-schema-target-required", 100),
    backwardCompatible: normalizeBoolean(schema.backwardCompatible, "release-schema-compatibility-invalid"),
    migrationRequired: normalizeBoolean(schema.migrationRequired, "release-schema-migration-invalid")
  }));
  if (new Set(schemas.map((schema) => schema.schemaId)).size !== schemas.length) {
    throw new ReleaseManagementError("release-schema-duplicate");
  }
  return deepFreeze({ minimumVersion, targetVersion, client, functions, firebase, schemas });
}

function normalizeVersionCompatibility(input, scope) {
  if (!isPlainObject(input)) throw new ReleaseManagementError(`release-${scope}-compatibility-required`);
  const minimumVersion = requireSemver(input.minimumVersion, `release-${scope}-minimum-version-invalid`);
  const targetVersion = requireSemver(input.targetVersion, `release-${scope}-target-version-invalid`);
  if (compareReleaseVersions(minimumVersion, targetVersion) > 0) {
    throw new ReleaseManagementError(`release-${scope}-version-range-invalid`);
  }
  return {
    minimumVersion,
    targetVersion,
    backwardCompatible: normalizeBoolean(input.backwardCompatible, `release-${scope}-compatibility-invalid`)
  };
}

function normalizeFirebaseCompatibility(input) {
  if (!isPlainObject(input)) throw new ReleaseManagementError("release-firebase-compatibility-required");
  const sdkMinimumVersion = requireSemver(input.sdkMinimumVersion, "release-firebase-sdk-minimum-invalid");
  const sdkTargetVersion = requireSemver(input.sdkTargetVersion, "release-firebase-sdk-target-invalid");
  if (compareReleaseVersions(sdkMinimumVersion, sdkTargetVersion) > 0) {
    throw new ReleaseManagementError("release-firebase-sdk-range-invalid");
  }
  return {
    projectId: normalizeIdentifier(input.projectId, "release-firebase-project-invalid"),
    sdkMinimumVersion,
    sdkTargetVersion,
    rulesHash: requireChecksum(input.rulesHash, "release-firebase-rules-hash-invalid"),
    functionsRuntime: normalizeString(input.functionsRuntime, "release-functions-runtime-required", 100),
    backwardCompatible: normalizeBoolean(input.backwardCompatible, "release-firebase-compatibility-invalid")
  };
}

function normalizeCommit(input) {
  if (!isPlainObject(input)) throw new ReleaseManagementError("release-commit-required");
  const hash = normalizeString(input.hash, "release-commit-hash-required", 64).toLowerCase();
  if (!COMMIT_HASH.test(hash)) throw new ReleaseManagementError("release-commit-hash-invalid");
  const treeHash = normalizeString(input.treeHash, "release-tree-hash-required", 64).toLowerCase();
  if (!COMMIT_HASH.test(treeHash)) throw new ReleaseManagementError("release-tree-hash-invalid");
  const parents = Array.isArray(input.parents) ? input.parents.map((parent) => {
    const normalized = normalizeString(parent, "release-parent-hash-invalid", 64).toLowerCase();
    if (!COMMIT_HASH.test(normalized)) throw new ReleaseManagementError("release-parent-hash-invalid");
    return normalized;
  }) : [];
  return {
    hash,
    shortHash: hash.slice(0, 12),
    treeHash,
    parents,
    branch: normalizeString(input.branch, "release-branch-required", 200),
    clean: normalizeBoolean(input.clean, "release-commit-clean-invalid")
  };
}

function normalizeModules(input, maxModules) {
  if (!Array.isArray(input) || !input.length || input.length > maxModules) {
    throw new ReleaseManagementError("release-modules-invalid");
  }
  const modules = input.map((module) => ({
    moduleId: normalizeIdentifier(module.moduleId, "release-module-id-invalid"),
    name: normalizeString(module.name, "release-module-name-required", 200),
    version: requireSemver(module.version, "release-module-version-invalid"),
    changeType: normalizeEnum(module.changeType, ["none", "patch", "minor", "major"], "release-module-change-type-invalid")
  }));
  if (new Set(modules.map((module) => module.moduleId)).size !== modules.length) {
    throw new ReleaseManagementError("release-module-duplicate");
  }
  return modules.sort((left, right) => left.moduleId.localeCompare(right.moduleId));
}

function normalizeTickets(input, maxTickets) {
  if (!Array.isArray(input) || !input.length || input.length > maxTickets) {
    throw new ReleaseManagementError("release-tickets-invalid");
  }
  const tickets = input.map((ticket) => ({
    ticketId: normalizeIdentifier(ticket.ticketId, "release-ticket-id-invalid"),
    title: normalizeString(ticket.title, "release-ticket-title-required", 500),
    risk: normalizeEnum(ticket.risk, RELEASE_RISK_LEVELS, "release-ticket-risk-invalid"),
    breaking: normalizeBoolean(ticket.breaking, "release-ticket-breaking-invalid")
  }));
  if (new Set(tickets.map((ticket) => ticket.ticketId)).size !== tickets.length) {
    throw new ReleaseManagementError("release-ticket-duplicate");
  }
  return tickets.sort((left, right) => left.ticketId.localeCompare(right.ticketId));
}

function normalizeChange(input, index) {
  if (!isPlainObject(input)) throw new ReleaseManagementError("release-change-invalid");
  return {
    changeId: input.changeId
      ? normalizeIdentifier(input.changeId, "release-change-id-invalid")
      : `change-${String(index + 1).padStart(4, "0")}`,
    type: normalizeEnum(input.type, RELEASE_CHANGE_TYPES, "release-change-type-invalid"),
    module: normalizeIdentifier(input.module, "release-change-module-invalid"),
    description: normalizeString(input.description, "release-change-description-required", 2000),
    ticketId: normalizeIdentifier(input.ticketId, "release-change-ticket-invalid"),
    risk: normalizeEnum(input.risk, RELEASE_RISK_LEVELS, "release-change-risk-invalid"),
    breaking: normalizeBoolean(input.breaking, "release-change-breaking-invalid"),
    compatibilityNotes: normalizeString(input.compatibilityNotes || "", null, 2000)
  };
}

function normalizeActor(input, required) {
  if (input == null && !required) return null;
  if (!isPlainObject(input)) throw new ReleaseManagementError("release-actor-required");
  return {
    uid: normalizeIdentifier(input.uid, "release-actor-uid-invalid"),
    name: normalizeString(input.name, "release-actor-name-required", 200),
    role: normalizeIdentifier(input.role, "release-actor-role-invalid")
  };
}

function normalizeOrderedSteps(input, code) {
  if (!Array.isArray(input) || !input.length) throw new ReleaseManagementError(`${code}s-required`);
  const steps = input.map((step) => ({
    order: normalizePositiveInteger(step.order, `${code}-order-invalid`),
    stepId: normalizeIdentifier(step.stepId, `${code}-id-invalid`),
    label: normalizeString(step.label, `${code}-label-required`, 500),
    ...(Object.prototype.hasOwnProperty.call(step, "requires") ? { requires: step.requires } : {})
  })).sort((left, right) => left.order - right.order);
  if (new Set(steps.map((step) => step.stepId)).size !== steps.length) throw new ReleaseManagementError(`${code}-duplicate`);
  if (steps.some((step, index) => step.order !== index + 1)) throw new ReleaseManagementError(`${code}-order-gap`);
  return steps;
}

function normalizeLimits(input) {
  if (!isPlainObject(input)) throw new ReleaseManagementError("release-policy-limits-invalid");
  const limits = {};
  for (const key of Object.keys(DEFAULT_LIMITS)) {
    limits[key] = normalizePositiveInteger(input[key], `release-policy-limit-invalid:${key}`);
  }
  return limits;
}

function validateDeployPlan(actual, expected) {
  validatePlanIdentity(actual, expected, "release-deploy-plan-invalid");
  for (const step of actual) {
    assertAllowedKeys(step, [
      "order", "stepId", "label", "requires", "status", "evidence", "updatedAt", "updatedBy"
    ], "release-deploy-step-field-unsupported");
    normalizeEnum(step.status, RELEASE_STEP_STATUSES, "release-deploy-plan-invalid");
    if (step.status === "pending") {
      if (step.evidence !== null || step.updatedAt !== null || step.updatedBy !== null) {
        throw new ReleaseManagementError("release-pending-deploy-step-has-result");
      }
    } else {
      normalizeIsoDate(step.updatedAt, "release-deploy-step-time-invalid");
      normalizeActor(step.updatedBy, true);
    }
  }
}

function validateRollbackPlan(actual, expected) {
  validatePlanIdentity(actual, expected, "release-rollback-plan-invalid");
  for (const step of actual) {
    assertAllowedKeys(step, [
      "order", "stepId", "label", "status", "evidence", "updatedAt", "updatedBy", "preservesHistory", "deletesData"
    ], "release-rollback-step-field-unsupported");
    normalizeEnum(step.status, RELEASE_STEP_STATUSES, "release-rollback-plan-invalid");
    if (step.preservesHistory !== true || step.deletesData !== false) {
      throw new ReleaseManagementError("release-rollback-data-deletion-forbidden");
    }
    if (step.status === "pending") {
      if (step.evidence !== null || step.updatedAt !== null || step.updatedBy !== null) {
        throw new ReleaseManagementError("release-pending-rollback-step-has-result");
      }
    } else {
      normalizeIsoDate(step.updatedAt, "release-rollback-step-time-invalid");
      normalizeActor(step.updatedBy, true);
    }
  }
}

function validatePlanIdentity(actual, expected, errorCode) {
  if (!Array.isArray(actual) || actual.length !== expected.length) throw new ReleaseManagementError(errorCode);
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index].stepId !== expected[index].stepId || actual[index].order !== expected[index].order) {
      throw new ReleaseManagementError(errorCode);
    }
  }
}

function validatePostDeploy(actual, policy) {
  if (!Array.isArray(actual) || actual.length !== policy.postDeployChecks.length) {
    throw new ReleaseManagementError("release-post-deploy-invalid");
  }
  for (let index = 0; index < policy.postDeployChecks.length; index += 1) {
    assertAllowedKeys(actual[index], [
      "order", "checkId", "status", "evidence", "checkedAt", "checkedBy"
    ], "release-post-deploy-field-unsupported");
    if (actual[index].checkId !== policy.postDeployChecks[index]) throw new ReleaseManagementError("release-post-deploy-invalid");
    normalizeEnum(actual[index].status, POST_DEPLOY_STATUSES, "release-post-deploy-result-invalid");
    if (actual[index].status === "pending") {
      if (actual[index].evidence !== null || actual[index].checkedAt !== null || actual[index].checkedBy !== null) {
        throw new ReleaseManagementError("release-pending-post-deploy-has-result");
      }
    } else {
      normalizeIsoDate(actual[index].checkedAt, "release-post-deploy-time-invalid");
      normalizeActor(actual[index].checkedBy, true);
    }
  }
}

function validateOperationChain(operations, revision) {
  if (!Array.isArray(operations) || operations.length !== revision) {
    throw new ReleaseManagementError("release-operations-invalid");
  }
  const keys = new Set();
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    assertAllowedKeys(operation, [
      "idempotencyKey", "fingerprint", "operation", "resultRevision", "timestamp"
    ], "release-operation-field-unsupported");
    normalizeIdentifier(operation.idempotencyKey, "release-operation-idempotency-key-invalid");
    if (keys.has(operation.idempotencyKey)) throw new ReleaseManagementError("release-operation-idempotency-duplicate");
    keys.add(operation.idempotencyKey);
    requireChecksum(operation.fingerprint, "release-operation-fingerprint-invalid");
    normalizeIdentifier(operation.operation, "release-operation-name-invalid");
    if (operation.resultRevision !== index + 1) throw new ReleaseManagementError("release-operation-revision-chain-invalid");
    normalizeIsoDate(operation.timestamp, "release-operation-time-invalid");
  }
}

function validateAuditChain(audit, revision) {
  if (audit.length !== revision + 1) throw new ReleaseManagementError("release-audit-revision-chain-invalid");
  let previousTime = -Infinity;
  for (let index = 0; index < audit.length; index += 1) {
    if (audit[index].revision !== index) throw new ReleaseManagementError("release-audit-revision-chain-invalid");
    const timestamp = Date.parse(audit[index].timestamp);
    if (timestamp < previousTime) throw new ReleaseManagementError("release-audit-time-regression");
    previousTime = timestamp;
  }
}

function assertCanonicalMatch(actual, normalized, code) {
  if (canonicalStringify(actual) !== canonicalStringify(normalized)) {
    throw new ReleaseManagementError(code);
  }
}

function assertAllowedKeys(value, allowed, code) {
  if (!isPlainObject(value)) throw new ReleaseManagementError(code);
  const allowlist = new Set(allowed);
  if (Object.keys(value).some((key) => !allowlist.has(key))) throw new ReleaseManagementError(code);
}

function validateAuditEvent(event, releaseId) {
  if (!isPlainObject(event)) throw new ReleaseManagementError("release-audit-event-invalid");
  assertAllowedKeys(event, [
    "auditId", "operation", "result", "revision", "timestamp", "actor", "details"
  ], "release-audit-field-unsupported");
  normalizeIdentifier(event.auditId, "release-audit-id-invalid");
  normalizeIdentifier(event.operation, "release-audit-operation-invalid");
  normalizeIdentifier(event.result, "release-audit-result-invalid");
  normalizeNonNegativeInteger(event.revision, "release-audit-revision-invalid");
  normalizeIsoDate(event.timestamp, "release-audit-time-invalid");
  assertCanonicalMatch(event.actor, normalizeActor(event.actor, true), "release-audit-actor-shape-invalid");
  if (!isPlainObject(event.details)) throw new ReleaseManagementError("release-audit-details-invalid");
  if (!event.auditId.startsWith(`aud_${releaseId}_`)) throw new ReleaseManagementError("release-audit-release-mismatch");
}

function prepareOperation(manifest, operationInput, options = {}) {
  const expectedRevision = normalizeNonNegativeInteger(options.expectedRevision, "release-expected-revision-required");
  const idempotencyKey = normalizeIdentifier(options.idempotencyKey, "release-idempotency-key-required");
  const operationFingerprint = fingerprintReleaseOperation(operationInput);
  const previous = manifest.operations.find((operation) => operation.idempotencyKey === idempotencyKey);
  if (previous) {
    if (previous.fingerprint !== operationFingerprint) throw new ReleaseManagementError("release-idempotency-conflict");
    return { manifest, idempotent: true, revision: manifest.revision };
  }
  if (expectedRevision !== manifest.revision) {
    throw new ReleaseManagementError("release-revision-conflict", { expectedRevision, actualRevision: manifest.revision });
  }
  return { idempotent: false, idempotencyKey, operationFingerprint };
}

function finalizeOperation(next, previous, operationInput, actor, options, now, policy) {
  if (Date.parse(now) < Date.parse(previous.updatedAt)) throw new ReleaseManagementError("release-operation-time-regression");
  const revision = previous.revision + 1;
  const idempotencyKey = normalizeIdentifier(options.idempotencyKey, "release-idempotency-key-required");
  const fingerprint = fingerprintReleaseOperation(operationInput);
  next.revision = revision;
  next.updatedAt = now;
  next.operations.push({
    idempotencyKey,
    fingerprint,
    operation: operationInput.operation,
    resultRevision: revision,
    timestamp: now
  });
  next.audit.push({
    auditId: buildAuditId(next.releaseId, revision, operationInput.operation),
    operation: operationInput.operation,
    result: "succeeded",
    revision,
    timestamp: now,
    actor,
    details: safeClone(Object.fromEntries(Object.entries(operationInput).filter(([key]) => key !== "actor")))
  });
  if (next.audit.length > policy.limits.maxAuditEvents) throw new ReleaseManagementError("release-audit-limit");
  assertNoSecretKeys(next);
  return { manifest: sealManifest(next), idempotent: false, revision };
}

function preVerificationDeployStepsPassed(manifest) {
  const verifyStep = manifest.deployPlan.find((step) => step.stepId === "verify");
  const boundary = verifyStep ? verifyStep.order : manifest.deployPlan.length + 1;
  return manifest.deployPlan.filter((step) => step.order < boundary).every((step) => step.status === "passed");
}

function sealManifest(manifest) {
  const candidate = safeClone(manifest);
  candidate.integrity = {
    algorithm: "sha256",
    checksum: calculateReleaseManifestChecksum(candidate)
  };
  return deepFreeze(candidate);
}

function buildReleaseId(version, commitHash) {
  return `rel_${version.replace(/[^0-9A-Za-z.-]/g, "-")}_${commitHash.slice(0, 12)}`;
}

function buildReleaseBuildId(version, commitHash, createdAt) {
  const time = createdAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `build_${version.replace(/[^0-9A-Za-z.-]/g, "-")}_${time}_${commitHash.slice(0, 12)}`;
}

function buildAuditId(releaseId, revision, operation) {
  return `aud_${releaseId}_${String(revision).padStart(6, "0")}_${operation}`;
}

function parseSemver(value) {
  const normalized = requireSemver(value, "release-version-invalid");
  const match = SEMVER.exec(normalized);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || "",
    build: match[5] || ""
  };
}

function normalizePrerelease(value) {
  const candidate = normalizeString(value, "release-prerelease-invalid", 100);
  if (!/^(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*$/.test(candidate)) {
    throw new ReleaseManagementError("release-prerelease-invalid");
  }
  return candidate;
}

function normalizeBuildMetadata(value) {
  const candidate = normalizeString(value, "release-build-metadata-invalid", 100);
  if (!/^[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*$/.test(candidate)) {
    throw new ReleaseManagementError("release-build-metadata-invalid");
  }
  return candidate;
}

function requireSemver(value, code) {
  const normalized = normalizeString(value, code, 200);
  if (!SEMVER.test(normalized)) throw new ReleaseManagementError(code);
  return normalized;
}

function requireChecksum(value, code) {
  const normalized = normalizeString(value, code, 64).toLowerCase();
  if (!CHECKSUM.test(normalized)) throw new ReleaseManagementError(code);
  return normalized;
}

function normalizeIsoDate(value, code) {
  const normalized = normalizeString(value, code, 100);
  const time = Date.parse(normalized);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== normalized) throw new ReleaseManagementError(code);
  return normalized;
}

function normalizeString(value, code, maxLength) {
  if (typeof value !== "string") {
    if (code) throw new ReleaseManagementError(code);
    return "";
  }
  if (value.length > maxLength) throw new ReleaseManagementError(code || "release-string-invalid");
  if (code && !value.trim()) throw new ReleaseManagementError(code);
  return value;
}

function normalizeIdentifier(value, code) {
  const normalized = normalizeString(value, code, 200);
  if (!IDENTIFIER.test(normalized)) throw new ReleaseManagementError(code);
  return normalized;
}

function normalizeEnum(value, allowed, code) {
  if (!allowed.includes(value)) throw new ReleaseManagementError(code);
  return value;
}

function normalizeBoolean(value, code) {
  if (typeof value !== "boolean") throw new ReleaseManagementError(code);
  return value;
}

function normalizePositiveInteger(value, code) {
  if (!Number.isSafeInteger(value) || value < 1) throw new ReleaseManagementError(code);
  return value;
}

function normalizeNonNegativeInteger(value, code) {
  if (!Number.isSafeInteger(value) || value < 0) throw new ReleaseManagementError(code);
  return value;
}

function normalizeTextList(input, maxLength, maxStringLength) {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > maxLength) throw new ReleaseManagementError("release-text-list-invalid");
  return input.map((value) => normalizeString(value, "release-text-list-item-invalid", maxStringLength));
}

function uniqueStringList(input, code) {
  if (!Array.isArray(input)) throw new ReleaseManagementError(code);
  const values = input.map((value) => normalizeIdentifier(value, code));
  if (new Set(values).size !== values.length) throw new ReleaseManagementError(code);
  return values;
}

function assertNoSecretKeys(value, path = "") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretKeys(item, `${path}[${index}]`));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
    if (SECRET_KEYS.has(normalized)) throw new ReleaseManagementError("release-secret-key-forbidden", { path: path ? `${path}.${key}` : key });
    assertNoSecretKeys(nested, path ? `${path}.${key}` : key);
  }
}

function countBy(items, field) {
  const output = {};
  for (const item of items) output[item[field]] = (output[item[field]] || 0) + 1;
  return output;
}

function sortCanonical(value) {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortCanonical(value[key])]));
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

module.exports = {
  RELEASE_ENGINE_VERSION,
  RELEASE_MANIFEST_SCHEMA_VERSION,
  RELEASE_CHANGE_TYPES,
  RELEASE_RISK_LEVELS,
  ReleaseManagementError,
  safeClone,
  canonicalStringify,
  calculateReleaseManifestChecksum,
  fingerprintReleaseOperation,
  validateReleasePolicy,
  normalizePolicy,
  bumpReleaseVersion,
  compareReleaseVersions,
  buildReleaseChangelog,
  createRelease,
  validateReleaseManifest,
  verifyReleaseManifestIntegrity,
  normalizeReleaseManifest,
  recordReleaseGate,
  transitionReleaseStatus,
  recordDeployStep,
  recordRollbackStep,
  recordPostDeployCheck,
  evaluateReleaseGates,
  buildDeployPlan,
  buildRollbackPlan,
  buildPostDeployChecklist
};
