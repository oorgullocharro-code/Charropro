const crypto = require("node:crypto");
const { fingerprintConfiguration, safeClone } = require("./configurationEngine");

const RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION = "1.0.0";
const RULE_PROFILE_LIFECYCLE_STATUSES = Object.freeze([
  "skeleton", "draft", "ready", "active", "retired", "deprecated", "archived"
]);
const RULE_PROFILE_LIFECYCLE_TRANSITIONS = Object.freeze({
  skeleton: Object.freeze(["draft", "archived"]),
  draft: Object.freeze(["ready", "archived"]),
  ready: Object.freeze(["draft", "active", "archived"]),
  active: Object.freeze(["retired", "deprecated"]),
  retired: Object.freeze(["archived"]),
  deprecated: Object.freeze(["archived"]),
  archived: Object.freeze([])
});
const REQUEST_TRANSITIONS = Object.freeze({
  CREATE_DRAFT: "draft",
  MARK_READY: "ready",
  RETURN_TO_DRAFT: "draft",
  ACTIVATE: "active",
  RETIRE: "retired",
  DEPRECATE: "deprecated",
  ARCHIVE: "archived"
});
const REQUEST_FIELDS = new Set([
  "profileId", "version", "requestedTransition", "expectedRevision", "idempotencyKey",
  "effectiveFrom", "effectiveTo", "reason", "tenantId", "organizationId"
]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,179}$/;

class RuleProfileLifecycleError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "RuleProfileLifecycleError";
    this.code = code;
    this.details = safeClone(details);
  }
}

function validateRuleProfileCertificationRegistry(registryInput = {}) {
  const errors = [];
  let registry = null;
  try {
    registry = safeClone(registryInput);
  } catch (error) {
    return { valid: false, errors: [String(error?.code || "rule-profile-registry-invalid")], registry: null };
  }
  if (registry.registryVersion !== "1.0.0") errors.push("rule-profile-registry-version-invalid");
  if (!isPlainObject(registry.profiles)) errors.push("rule-profile-registry-profiles-invalid");
  const identities = new Set();
  for (const [key, certificate] of Object.entries(registry.profiles || {})) {
    const result = validateRuleProfileCertificate(certificate);
    if (!result.valid) errors.push(...result.errors.map((code) => `${key}:${code}`));
    const identity = `${certificate?.profileId || ""}@${certificate?.version || ""}`;
    if (key !== identity) errors.push(`${key}:rule-profile-certificate-key-mismatch`);
    if (identities.has(identity)) errors.push(`${key}:rule-profile-certificate-duplicate`);
    identities.add(identity);
  }
  return { valid: errors.length === 0, errors, registry: errors.length ? null : registry };
}

function validateRuleProfileCertificate(input = {}) {
  const errors = [];
  const certificate = safeClone(input);
  if (!ID_PATTERN.test(String(certificate.profileId || ""))) errors.push("rule-profile-certificate-id-invalid");
  if (!VERSION_PATTERN.test(String(certificate.version || ""))) errors.push("rule-profile-certificate-version-invalid");
  if (!["skeleton", "draft"].includes(certificate.definitionStatus)) {
    errors.push("rule-profile-certificate-definition-status-invalid");
  }
  if (!isPlainObject(certificate.scope) || !["system", "organization"].includes(certificate.scope?.type)) {
    errors.push("rule-profile-certificate-scope-invalid");
  }
  if (certificate.scope?.type === "organization" && !certificate.scope.organizationId) {
    errors.push("rule-profile-certificate-organization-required");
  }
  if (certificate.profileValid !== true) errors.push("rule-profile-certificate-profile-invalid");
  if (!/^rptp_[0-9a-f]{16}$/.test(String(certificate.contentFingerprint || ""))) {
    errors.push("rule-profile-certificate-fingerprint-invalid");
  }
  if (certificate.certification?.verdict !== "PASS") errors.push("rule-profile-certification-failed");
  if (certificate.certification?.remainingP0 !== 0) errors.push("rule-profile-certification-p0-blocked");
  if (certificate.certification?.activationReadyEligibility !== true) {
    errors.push("rule-profile-certification-not-eligible");
  }
  return { valid: errors.length === 0, errors, certificate: errors.length ? null : certificate };
}

function getRuleProfileCertificate(registryInput, profileId, version) {
  const validation = validateRuleProfileCertificationRegistry(registryInput);
  if (!validation.valid) throw new RuleProfileLifecycleError("rule-profile-certification-registry-invalid", {
    errors: validation.errors
  });
  const key = `${normalizeId(profileId, "rule-profile-id-invalid")}@${normalizeVersion(version)}`;
  const certificate = validation.registry.profiles[key];
  if (!certificate) throw new RuleProfileLifecycleError("rule-profile-version-not-found", { profileId, version });
  return safeClone(certificate);
}

function authorizeRuleProfileLifecycleActor(actorInput = {}, certificateInput = {}) {
  const actor = normalizeActor(actorInput);
  const certificate = validateCertificateOrThrow(certificateInput);
  if (!actor.uid) return { allowed: false, reason: "rule-profile-auth-required", actor };
  if (actor.active !== true) return { allowed: false, reason: "rule-profile-user-inactive", actor };
  if (actor.role !== "supervisor" && actor.platformAdmin !== true) {
    return { allowed: false, reason: "rule-profile-role-denied", actor };
  }
  const scope = normalizeCertificateScope(certificate.scope);
  if (scope.type === "system" && actor.platformAdmin !== true) {
    return { allowed: false, reason: "rule-profile-platform-admin-required", actor };
  }
  if (scope.tenantId && actor.tenantId !== scope.tenantId) {
    return { allowed: false, reason: "rule-profile-tenant-mismatch", actor };
  }
  if (scope.organizationId && actor.organizationId !== scope.organizationId) {
    return { allowed: false, reason: "rule-profile-organization-mismatch", actor };
  }
  return { allowed: true, reason: "rule-profile-lifecycle-authorized", actor };
}

function prepareRuleProfileLifecycleRequest(input = {}, actorInput = {}, certificateInput = {}) {
  const source = safeClone(input);
  assertAllowedKeys(source, REQUEST_FIELDS, "rule-profile-request-field-unsupported");
  const certificate = validateCertificateOrThrow(certificateInput);
  const profileId = normalizeId(source.profileId, "rule-profile-id-invalid");
  const version = normalizeVersion(source.version);
  if (profileId !== certificate.profileId || version !== certificate.version) {
    throw new RuleProfileLifecycleError("rule-profile-certificate-identity-mismatch");
  }
  const authorization = authorizeRuleProfileLifecycleActor(actorInput, certificate);
  if (!authorization.allowed) throw new RuleProfileLifecycleError(authorization.reason);
  const requestedTransition = String(source.requestedTransition || "").trim().toUpperCase();
  if (!REQUEST_TRANSITIONS[requestedTransition]) {
    throw new RuleProfileLifecycleError("rule-profile-transition-request-invalid");
  }
  const expectedRevision = Number(source.expectedRevision);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new RuleProfileLifecycleError("rule-profile-expected-revision-invalid");
  }
  const idempotencyKey = String(source.idempotencyKey || "").trim();
  if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
    throw new RuleProfileLifecycleError("rule-profile-idempotency-key-invalid");
  }
  const scope = normalizeCertificateScope(certificate.scope);
  const tenantId = normalizeOptionalId(source.tenantId);
  const organizationId = normalizeOptionalId(source.organizationId);
  if (tenantId !== scope.tenantId) throw new RuleProfileLifecycleError("rule-profile-tenant-mismatch");
  if (organizationId !== scope.organizationId) throw new RuleProfileLifecycleError("rule-profile-organization-mismatch");
  return Object.freeze({
    profileId,
    version,
    requestedTransition,
    targetStatus: REQUEST_TRANSITIONS[requestedTransition],
    expectedRevision,
    idempotencyKey,
    effectiveFrom: normalizeOptionalDate(source.effectiveFrom, "rule-profile-effective-from-invalid"),
    effectiveTo: normalizeOptionalDate(source.effectiveTo, "rule-profile-effective-to-invalid"),
    reason: normalizeText(source.reason, 500),
    tenantId,
    organizationId,
    actor: authorization.actor
  });
}

function applyRuleProfileLifecycleTransaction(currentInput, requestInput, actorInput, certificateInput, options = {}) {
  const certificate = validateCertificateOrThrow(certificateInput);
  const request = prepareRuleProfileLifecycleRequest(requestInput, actorInput, certificate);
  const now = normalizeDate(options.now, "rule-profile-authoritative-time-required");
  const certificateFingerprint = fingerprintRuleProfileCertificate(certificate);
  const root = normalizeProfileRoot(currentInput, request.profileId);
  const versionKey = buildRuleProfileVersionKey(request.version);
  const currentContainer = normalizeVersionContainer(root.versions[versionKey], certificate, certificateFingerprint);
  const requestId = buildRuleProfileRequestId(request.idempotencyKey);
  const requestFingerprint = fingerprintConfiguration({
    profileId: request.profileId,
    version: request.version,
    requestedTransition: request.requestedTransition,
    expectedRevision: request.expectedRevision,
    effectiveFrom: request.effectiveFrom,
    effectiveTo: request.effectiveTo,
    reason: request.reason,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    actorUid: request.actor.uid
  });
  const existingRequest = currentContainer.requests[requestId];
  if (existingRequest) {
    if (existingRequest.idempotencyKey !== request.idempotencyKey
      || existingRequest.requestFingerprint !== requestFingerprint) {
      return rejected(root, "rule-profile-idempotency-conflict");
    }
    return { state: root, outcome: { ...safeClone(existingRequest.result), idempotent: true } };
  }

  const current = currentContainer.state;
  if (current.revision !== request.expectedRevision) {
    return rejected(root, "rule-profile-revision-conflict", { currentRevision: current.revision });
  }
  if (current.contentFingerprint !== certificate.contentFingerprint
    || current.certificateFingerprint !== certificateFingerprint) {
    return rejected(root, "rule-profile-fingerprint-mismatch");
  }
  const allowedTargets = RULE_PROFILE_LIFECYCLE_TRANSITIONS[current.status] || [];
  if (!allowedTargets.includes(request.targetStatus)) {
    return rejected(root, "rule-profile-transition-invalid", {
      previousStatus: current.status,
      requestedTransition: request.requestedTransition
    });
  }
  const certification = validateRuleProfileCertificate(certificate);
  if (!certification.valid) return rejected(root, certification.errors[0], { errors: certification.errors });

  const next = safeClone(current);
  next.status = request.targetStatus;
  next.revision = current.revision + 1;
  next.updatedAt = now;
  next.updatedBy = request.actor;
  next.createdAt ||= now;
  if (!next.createdBy.uid) next.createdBy = request.actor;

  if (current.status === "draft" && next.status === "ready") {
    if (!request.effectiveFrom) return rejected(root, "rule-profile-effective-from-required");
    if (request.effectiveTo && Date.parse(request.effectiveTo) <= Date.parse(request.effectiveFrom)) {
      return rejected(root, "rule-profile-temporal-range-invalid");
    }
    next.activationReady = true;
    next.effectiveFrom = request.effectiveFrom;
    next.effectiveTo = request.effectiveTo;
    next.definitionImmutable = true;
  }
  if (current.status === "ready" && next.status === "draft") {
    next.activationReady = false;
    next.effectiveFrom = null;
    next.effectiveTo = null;
    next.definitionImmutable = false;
  }
  if (current.status === "ready" && next.status === "active") {
    if (current.activationReady !== true || current.definitionImmutable !== true) {
      return rejected(root, "rule-profile-activation-not-ready");
    }
    if (hasTemporalOverlap(root, versionKey, current)) {
      return rejected(root, "rule-profile-temporal-overlap");
    }
    next.activatedAt = now;
    next.activatedBy = request.actor;
  }
  if (current.status === "active" && ["retired", "deprecated"].includes(next.status)) {
    next.effectiveTo = now;
    if (next.effectiveFrom && Date.parse(now) <= Date.parse(next.effectiveFrom)) {
      return rejected(root, "rule-profile-temporal-range-invalid");
    }
    next.retiredAt = now;
    next.retiredBy = request.actor;
  }

  const auditEventId = buildRuleProfileAuditEventId(request.idempotencyKey);
  const audit = {
    eventId: auditEventId,
    authorityVersion: RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION,
    operation: "RULE_PROFILE_LIFECYCLE_TRANSITION",
    profileId: request.profileId,
    version: request.version,
    fromStatus: current.status,
    toStatus: next.status,
    previousRevision: current.revision,
    newRevision: next.revision,
    actor: request.actor,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    timestamp: now,
    idempotencyKey: request.idempotencyKey,
    fingerprint: certificate.contentFingerprint,
    reason: request.reason
  };
  const result = {
    ok: true,
    authorityVersion: RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION,
    profileId: request.profileId,
    version: request.version,
    previousStatus: current.status,
    status: next.status,
    previousRevision: current.revision,
    revision: next.revision,
    fingerprint: certificate.contentFingerprint,
    transition: request.requestedTransition,
    auditEventId,
    activationReady: next.activationReady,
    effectiveFrom: next.effectiveFrom,
    effectiveTo: next.effectiveTo,
    updatedAt: now,
    idempotent: false
  };
  const nextRoot = safeClone(root);
  const nextContainer = safeClone(currentContainer);
  nextContainer.state = next;
  nextContainer.requests[requestId] = {
    idempotencyKey: request.idempotencyKey,
    requestFingerprint,
    acceptedAt: now,
    result
  };
  nextContainer.audit[auditEventId] = audit;
  nextRoot.versions[versionKey] = nextContainer;
  nextRoot.updatedAt = now;
  return { state: nextRoot, outcome: safeClone(result) };
}

function buildInitialLifecycleState(certificate, certificateFingerprint) {
  return {
    authorityVersion: RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION,
    profileId: certificate.profileId,
    version: certificate.version,
    status: certificate.definitionStatus,
    activationReady: false,
    revision: 0,
    contentFingerprint: certificate.contentFingerprint,
    certificateFingerprint,
    definitionImmutable: false,
    effectiveFrom: null,
    effectiveTo: null,
    createdAt: null,
    createdBy: emptyActor(),
    updatedAt: null,
    updatedBy: emptyActor(),
    activatedAt: null,
    activatedBy: emptyActor(),
    retiredAt: null,
    retiredBy: emptyActor(),
    scope: normalizeCertificateScope(certificate.scope),
    certification: {
      verdict: certificate.certification.verdict,
      remainingP0: certificate.certification.remainingP0,
      activationReadyEligibility: certificate.certification.activationReadyEligibility,
      recordId: certificate.certification.recordId,
      resolutionTicketId: certificate.certification.resolutionTicketId
    }
  };
}

function normalizeProfileRoot(input, profileId) {
  if (!input) return { authorityVersion: RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION, profileId, versions: {}, updatedAt: null };
  const root = safeClone(input);
  if (root.authorityVersion !== RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION || root.profileId !== profileId) {
    throw new RuleProfileLifecycleError("rule-profile-persisted-root-invalid");
  }
  if (!isPlainObject(root.versions)) throw new RuleProfileLifecycleError("rule-profile-persisted-versions-invalid");
  return root;
}

function normalizeVersionContainer(input, certificate, certificateFingerprint) {
  if (!input) return {
    state: buildInitialLifecycleState(certificate, certificateFingerprint),
    requests: {},
    audit: {}
  };
  const container = safeClone(input);
  if (!isPlainObject(container.state) || !isPlainObject(container.requests) || !isPlainObject(container.audit)) {
    throw new RuleProfileLifecycleError("rule-profile-persisted-version-invalid");
  }
  if (container.state.profileId !== certificate.profileId || container.state.version !== certificate.version) {
    throw new RuleProfileLifecycleError("rule-profile-persisted-identity-mismatch");
  }
  return container;
}

function hasTemporalOverlap(root, candidateVersionKey, candidate) {
  const candidateStart = Date.parse(candidate.effectiveFrom || "");
  const candidateEnd = candidate.effectiveTo ? Date.parse(candidate.effectiveTo) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(candidateStart)) throw new RuleProfileLifecycleError("rule-profile-effective-from-required");
  return Object.entries(root.versions || {}).some(([versionKey, container]) => {
    if (versionKey === candidateVersionKey || container?.state?.status !== "active") return false;
    const start = Date.parse(container.state.effectiveFrom || "");
    const end = container.state.effectiveTo ? Date.parse(container.state.effectiveTo) : Number.POSITIVE_INFINITY;
    return Number.isFinite(start) && candidateStart < end && start < candidateEnd;
  });
}

function fingerprintRuleProfileCertificate(certificateInput) {
  return fingerprintConfiguration(validateCertificateOrThrow(certificateInput));
}

function buildRuleProfileProfileKey(profileId) {
  const normalized = normalizeId(profileId, "rule-profile-id-invalid");
  return `profile_${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 40)}`;
}

function buildRuleProfileVersionKey(version) {
  return `version_${Buffer.from(normalizeVersion(version), "utf8").toString("base64url")}`;
}

function buildRuleProfileRequestId(idempotencyKey) {
  return `request_${crypto.createHash("sha256").update(String(idempotencyKey)).digest("hex").slice(0, 40)}`;
}

function buildRuleProfileAuditEventId(idempotencyKey) {
  return `event_${crypto.createHash("sha256").update(String(idempotencyKey)).digest("hex").slice(0, 40)}`;
}

function validateCertificateOrThrow(input) {
  const validation = validateRuleProfileCertificate(input);
  if (!validation.valid) throw new RuleProfileLifecycleError(validation.errors[0], { errors: validation.errors });
  return validation.certificate;
}

function normalizeCertificateScope(input = {}) {
  return {
    type: input.type === "organization" ? "organization" : "system",
    tenantId: normalizeOptionalId(input.tenantId),
    organizationId: normalizeOptionalId(input.organizationId)
  };
}

function normalizeActor(input = {}) {
  return {
    uid: normalizeOptionalId(input.uid),
    name: normalizeText(input.name, 180),
    role: normalizeText(input.role, 64).toLowerCase(),
    tenantId: normalizeOptionalId(input.tenantId),
    organizationId: normalizeOptionalId(input.organizationId),
    platformAdmin: input.platformAdmin === true,
    active: input.active === true
  };
}

function emptyActor() {
  return { uid: "", name: "", role: "", tenantId: "", organizationId: "", platformAdmin: false, active: false };
}

function normalizeId(value, code) {
  const normalized = String(value || "").trim();
  if (!ID_PATTERN.test(normalized)) throw new RuleProfileLifecycleError(code);
  return normalized;
}

function normalizeOptionalId(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (!ID_PATTERN.test(normalized)) throw new RuleProfileLifecycleError("rule-profile-context-id-invalid");
  return normalized;
}

function normalizeVersion(value) {
  const normalized = String(value || "").trim();
  if (!VERSION_PATTERN.test(normalized)) throw new RuleProfileLifecycleError("rule-profile-version-invalid");
  return normalized;
}

function normalizeOptionalDate(value, code) {
  if (value == null || value === "") return null;
  return normalizeDate(value, code);
}

function normalizeDate(value, code) {
  const text = String(value || "").trim();
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(text)) throw new RuleProfileLifecycleError(code);
  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp)) throw new RuleProfileLifecycleError(code);
  return new Date(timestamp).toISOString();
}

function normalizeText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function assertAllowedKeys(value, allowed, code) {
  if (!isPlainObject(value)) throw new RuleProfileLifecycleError("rule-profile-request-invalid");
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.has(key)) throw new RuleProfileLifecycleError(code, { key: String(key) });
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function rejected(state, reason, details = {}) {
  return { state, outcome: { ok: false, idempotent: false, reason, ...safeClone(details) } };
}

module.exports = {
  REQUEST_TRANSITIONS,
  RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION,
  RULE_PROFILE_LIFECYCLE_STATUSES,
  RULE_PROFILE_LIFECYCLE_TRANSITIONS,
  RuleProfileLifecycleError,
  applyRuleProfileLifecycleTransaction,
  authorizeRuleProfileLifecycleActor,
  buildInitialLifecycleState,
  buildRuleProfileAuditEventId,
  buildRuleProfileProfileKey,
  buildRuleProfileRequestId,
  buildRuleProfileVersionKey,
  fingerprintRuleProfileCertificate,
  getRuleProfileCertificate,
  prepareRuleProfileLifecycleRequest,
  validateRuleProfileCertificate,
  validateRuleProfileCertificationRegistry
};
