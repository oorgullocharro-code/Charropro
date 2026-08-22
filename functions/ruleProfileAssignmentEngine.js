const crypto = require("node:crypto");
const { fingerprintConfiguration, safeClone } = require("./configurationEngine");

const RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION = "1.0.0";
const ASSIGNMENT_REQUEST_FIELDS = new Set([
  "tournamentId", "profileId", "version", "expectedRevision", "idempotencyKey",
  "source", "policyId", "reason", "tenantId", "organizationId"
]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,179}$/;
const ALLOWED_SOURCES = new Set(["explicit", "productive-default"]);

class RuleProfileAssignmentError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "RuleProfileAssignmentError";
    this.code = code;
    this.details = safeClone(details);
  }
}

function applyTournamentRuleProfileAssignment(currentInput, requestInput, actorInput, lifecycleInput, certificateInput, options = {}) {
  const tournament = safeClone(currentInput || {});
  const request = prepareRequest(requestInput);
  const actor = normalizeActor(actorInput);
  const lifecycle = normalizeLifecycle(lifecycleInput);
  const certificate = normalizeCertificate(certificateInput);
  const now = normalizeDate(typeof options.now === "function" ? options.now() : options.now);

  authorize(actor, request, tournament, certificate);
  validateLifecycle(request, lifecycle, certificate, now);

  const info = safeClone(tournament.info || {});
  if (String(info.id || "") !== request.tournamentId) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-tournament-not-found");
  }
  const currentAssignment = normalizeCurrentAssignment(info.ruleProfileAssignment);
  const currentRevision = Number(currentAssignment?.revision || info.ruleProfileAssignmentRevision || 0);
  const requestId = buildRequestId(request.idempotencyKey);
  const requestFingerprint = fingerprintConfiguration({
    ...request,
    actorUid: actor.uid
  });
  const priorRequest = tournament.ruleProfileAssignmentRequests?.[requestId];
  if (priorRequest) {
    if (priorRequest.idempotencyKey !== request.idempotencyKey
      || priorRequest.requestFingerprint !== requestFingerprint) {
      return rejected(tournament, "tournament-rule-profile-idempotency-conflict");
    }
    return { tournament, outcome: { ...safeClone(priorRequest.result), idempotent: true } };
  }
  if (!Number.isSafeInteger(currentRevision) || currentRevision < 0) {
    return rejected(tournament, "tournament-rule-profile-revision-invalid");
  }
  if (currentRevision !== request.expectedRevision) {
    return rejected(tournament, "tournament-rule-profile-revision-conflict", { currentRevision });
  }

  const sameIdentity = currentAssignment
    && currentAssignment.profileId === request.profileId
    && currentAssignment.version === request.version
    && currentAssignment.contentFingerprint === certificate.contentFingerprint;
  if (hasOfficialHistory(tournament) && !sameIdentity) {
    return rejected(tournament, "tournament-rule-profile-historical-scores-blocked");
  }

  const revision = currentRevision + 1;
  const assignmentId = `assignment_${crypto.createHash("sha256")
    .update(`${request.tournamentId}:${request.profileId}:${request.version}:${revision}`)
    .digest("hex").slice(0, 32)}`;
  const assignment = {
    authorityVersion: RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION,
    assignmentId,
    tournamentId: request.tournamentId,
    profileId: request.profileId,
    version: request.version,
    status: "active",
    contentFingerprint: certificate.contentFingerprint,
    revision,
    source: request.source,
    policyId: request.policyId,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    assignedAt: now,
    assignedBy: actor
  };
  const auditId = `audit_${crypto.createHash("sha256").update(request.idempotencyKey).digest("hex").slice(0, 32)}`;
  const audit = {
    auditId,
    authorityVersion: RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION,
    operation: "TOURNAMENT_RULE_PROFILE_ASSIGNMENT",
    tournamentId: request.tournamentId,
    previousAssignment: currentAssignment,
    assignment,
    actor,
    timestamp: now,
    idempotencyKey: request.idempotencyKey,
    reason: request.reason
  };
  const result = {
    ok: true,
    authorityVersion: RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION,
    tournamentId: request.tournamentId,
    assignment,
    previousRevision: currentRevision,
    revision,
    auditId,
    idempotent: false
  };

  const next = safeClone(tournament);
  next.info = {
    ...info,
    ruleProfileId: assignment.profileId,
    ruleProfileVersion: assignment.version,
    ruleProfileStatus: assignment.status,
    ruleProfileContentFingerprint: assignment.contentFingerprint,
    ruleProfileAssignmentRevision: assignment.revision,
    ruleProfileAssignment: assignment
  };
  next.ruleProfileAssignmentAudit = {
    ...(next.ruleProfileAssignmentAudit || {}),
    [auditId]: audit
  };
  next.ruleProfileAssignmentRequests = {
    ...(next.ruleProfileAssignmentRequests || {}),
    [requestId]: {
      idempotencyKey: request.idempotencyKey,
      requestFingerprint,
      acceptedAt: now,
      result
    }
  };
  return { tournament: next, outcome: safeClone(result) };
}

function prepareRequest(input = {}) {
  const source = safeClone(input);
  assertAllowedKeys(source, ASSIGNMENT_REQUEST_FIELDS);
  const request = {
    tournamentId: normalizeId(source.tournamentId, "tournament-rule-profile-tournament-id-invalid"),
    profileId: normalizeId(source.profileId, "tournament-rule-profile-id-invalid"),
    version: normalizeVersion(source.version),
    expectedRevision: Number(source.expectedRevision),
    idempotencyKey: String(source.idempotencyKey || "").trim(),
    source: String(source.source || "explicit").trim(),
    policyId: normalizeOptionalId(source.policyId),
    reason: String(source.reason || "").trim().slice(0, 500),
    tenantId: normalizeOptionalId(source.tenantId),
    organizationId: normalizeOptionalId(source.organizationId)
  };
  if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-expected-revision-invalid");
  }
  if (!IDEMPOTENCY_PATTERN.test(request.idempotencyKey)) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-idempotency-key-invalid");
  }
  if (!ALLOWED_SOURCES.has(request.source)) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-source-invalid");
  }
  if (request.source === "productive-default" && !request.policyId) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-policy-required");
  }
  return request;
}

function authorize(actor, request, tournament, certificate) {
  if (!actor.uid) throw new RuleProfileAssignmentError("tournament-rule-profile-auth-required");
  if (actor.active !== true) throw new RuleProfileAssignmentError("tournament-rule-profile-user-inactive");
  if (actor.role !== "supervisor" && actor.platformAdmin !== true) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-role-denied");
  }
  if (certificate.scope.type === "system" && actor.platformAdmin !== true) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-platform-admin-required");
  }
  const info = tournament.info || {};
  const tenantId = String(info.tenantId || "");
  const organizationId = String(info.organizationId || "");
  if (tenantId !== request.tenantId || tenantId !== certificate.scope.tenantId) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-tenant-mismatch");
  }
  if (organizationId !== request.organizationId || organizationId !== certificate.scope.organizationId) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-organization-mismatch");
  }
}

function validateLifecycle(request, lifecycle, certificate, now) {
  if (lifecycle.profileId !== request.profileId || lifecycle.version !== request.version) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-lifecycle-identity-mismatch");
  }
  if (lifecycle.status !== "active") {
    throw new RuleProfileAssignmentError("tournament-rule-profile-not-active");
  }
  if (lifecycle.fingerprint !== certificate.contentFingerprint) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-fingerprint-mismatch");
  }
  if (lifecycle.certification.verdict !== "PASS" || lifecycle.certification.remainingP0 !== 0) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-certification-blocked");
  }
  if (lifecycle.effectiveFrom && Date.parse(lifecycle.effectiveFrom) > Date.parse(now)) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-not-effective");
  }
  if (lifecycle.effectiveTo && Date.parse(lifecycle.effectiveTo) <= Date.parse(now)) {
    throw new RuleProfileAssignmentError("tournament-rule-profile-expired");
  }
}

function normalizeLifecycle(input = {}) {
  const lifecycle = safeClone(input);
  return {
    profileId: normalizeId(lifecycle.profileId, "tournament-rule-profile-lifecycle-id-invalid"),
    version: normalizeVersion(lifecycle.version),
    status: String(lifecycle.status || ""),
    fingerprint: String(lifecycle.fingerprint || ""),
    certification: {
      verdict: String(lifecycle.certification?.verdict || ""),
      remainingP0: Number(lifecycle.certification?.remainingP0),
      activationReadyEligibility: lifecycle.certification?.activationReadyEligibility === true
    },
    effectiveFrom: lifecycle.effectiveFrom || null,
    effectiveTo: lifecycle.effectiveTo || null
  };
}

function normalizeCertificate(input = {}) {
  const certificate = safeClone(input);
  return {
    profileId: normalizeId(certificate.profileId, "tournament-rule-profile-certificate-id-invalid"),
    version: normalizeVersion(certificate.version),
    contentFingerprint: String(certificate.contentFingerprint || ""),
    scope: {
      type: certificate.scope?.type === "organization" ? "organization" : "system",
      tenantId: normalizeOptionalId(certificate.scope?.tenantId),
      organizationId: normalizeOptionalId(certificate.scope?.organizationId)
    }
  };
}

function normalizeActor(input = {}) {
  return {
    uid: normalizeOptionalId(input.uid),
    name: String(input.name || "").trim().slice(0, 180),
    role: String(input.role || "").trim().toLowerCase().slice(0, 64),
    tenantId: normalizeOptionalId(input.tenantId),
    organizationId: normalizeOptionalId(input.organizationId),
    platformAdmin: input.platformAdmin === true,
    active: input.active === true
  };
}

function normalizeCurrentAssignment(input) {
  if (!input || typeof input !== "object") return null;
  return safeClone(input);
}

function hasOfficialHistory(tournament = {}) {
  return ["publishedScores", "officialScoreLedger", "officialScoreAudit"]
    .some((key) => tournament[key] && Object.keys(tournament[key]).length > 0);
}

function rejected(tournament, reason, details = {}) {
  return { tournament: safeClone(tournament), outcome: { ok: false, reason, ...safeClone(details) } };
}

function buildRequestId(idempotencyKey) {
  return `request_${crypto.createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 40)}`;
}

function assertAllowedKeys(source, allowed) {
  for (const key of Object.keys(source || {})) {
    if (!allowed.has(key)) throw new RuleProfileAssignmentError("tournament-rule-profile-field-unsupported", { key });
  }
}

function normalizeId(value, code) {
  const clean = String(value || "").trim();
  if (!ID_PATTERN.test(clean)) throw new RuleProfileAssignmentError(code);
  return clean;
}

function normalizeOptionalId(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (!ID_PATTERN.test(clean)) throw new RuleProfileAssignmentError("tournament-rule-profile-context-id-invalid");
  return clean;
}

function normalizeVersion(value) {
  const clean = String(value || "").trim();
  if (!VERSION_PATTERN.test(clean)) throw new RuleProfileAssignmentError("tournament-rule-profile-version-invalid");
  return clean;
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  const timestamp = Date.parse(text);
  if (!text || !Number.isFinite(timestamp)) throw new RuleProfileAssignmentError("tournament-rule-profile-authoritative-time-required");
  return new Date(timestamp).toISOString();
}

module.exports = {
  RULE_PROFILE_ASSIGNMENT_AUTHORITY_VERSION,
  RuleProfileAssignmentError,
  applyTournamentRuleProfileAssignment,
  hasOfficialHistory
};
