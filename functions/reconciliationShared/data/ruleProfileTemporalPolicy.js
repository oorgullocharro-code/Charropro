export const RULE_PROFILE_TEMPORAL_POLICY_VERSION = "1.0.0";

export const RULE_PROFILE_TEMPORAL_STATUSES = Object.freeze([
  "skeleton",
  "draft",
  "ready",
  "active",
  "retired",
  "deprecated",
  "archived"
]);

export const RULE_PROFILE_TEMPORAL_TRANSITIONS = Object.freeze({
  skeleton: Object.freeze(["draft", "archived"]),
  draft: Object.freeze(["ready", "archived"]),
  ready: Object.freeze(["draft", "active", "archived"]),
  active: Object.freeze(["retired", "deprecated"]),
  retired: Object.freeze(["archived"]),
  deprecated: Object.freeze(["archived"]),
  archived: Object.freeze([])
});

const MANAGED_STATUSES = new Set(["ready", "active", "retired", "deprecated", "archived"]);
const EFFECTIVE_RANGE_STATUSES = new Set(["ready", "active", "retired", "deprecated"]);
const HISTORIC_STATUSES = new Set(["active", "retired", "deprecated"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
const OFFSET_DATE_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/;
const MAX_DEPTH = 12;
const MAX_ARRAY = 1500;
const MAX_KEYS = 400;
const MAX_STRING = 20000;

export class RuleProfileTemporalPolicyError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "RuleProfileTemporalPolicyError";
    this.code = code;
    this.details = cloneSafe(details, [], "error-details") || {};
  }
}

export function normalizeRuleProfileTemporalState(profile = {}) {
  return normalizeTemporalProfile(profile, []).profile;
}

export function validateRuleProfileTemporalState(profile = {}, options = {}) {
  const diagnostics = [];
  const normalized = normalizeTemporalProfile(profile, diagnostics).profile;
  const strictManaged = options.requireManaged === true || Boolean(normalized.temporalPolicyVersion);

  if (!normalized.profileId) pushDiagnostic(diagnostics, "error", "profile-temporal-id-invalid");
  if (!normalized.version) pushDiagnostic(diagnostics, "error", "profile-temporal-version-invalid");
  if (!RULE_PROFILE_TEMPORAL_STATUSES.includes(normalized.status)) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-status-invalid", { status: normalized.status });
  }
  if (!Number.isInteger(normalized.revision) || normalized.revision < 0) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-revision-invalid", { revision: normalized.revision });
  }
  if (Object.hasOwn(profile || {}, "revision")
    && (typeof profile.revision !== "number" || !Number.isInteger(profile.revision) || profile.revision < 0)) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-revision-type-invalid", { revision: profile.revision });
  }

  validateDateField(profile, "effectiveFrom", normalized.effectiveFrom, diagnostics);
  validateDateField(profile, "effectiveTo", normalized.effectiveTo, diagnostics);
  validateDateField(profile, "createdAt", normalized.createdAt, diagnostics);
  validateDateField(profile, "updatedAt", normalized.updatedAt, diagnostics);
  validateDateField(profile, "activatedAt", normalized.activatedAt, diagnostics);
  validateDateField(profile, "retiredAt", normalized.retiredAt, diagnostics);

  if (normalized.effectiveFrom && normalized.effectiveTo
    && Date.parse(normalized.effectiveFrom) >= Date.parse(normalized.effectiveTo)) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-range-invalid", {
      effectiveFrom: normalized.effectiveFrom,
      effectiveTo: normalized.effectiveTo
    });
  }

  if (strictManaged) {
    if (normalized.temporalPolicyVersion !== RULE_PROFILE_TEMPORAL_POLICY_VERSION) {
      pushDiagnostic(diagnostics, "error", "profile-temporal-policy-version-invalid", {
        temporalPolicyVersion: normalized.temporalPolicyVersion
      });
    }
    if (!normalized.createdAt || !normalized.createdBy.uid) {
      pushDiagnostic(diagnostics, "error", "profile-temporal-creation-audit-required");
    }
    if (!normalized.updatedAt || !normalized.updatedBy.uid) {
      pushDiagnostic(diagnostics, "error", "profile-temporal-update-audit-required");
    }
  }

  const declaresActivationReadiness = Object.hasOwn(profile || {}, "activationReady")
    || Object.hasOwn(profile?.metadata || {}, "activationReady");
  if ((normalized.status === "ready" || (normalized.status === "active" && (strictManaged || declaresActivationReadiness)))
    && normalized.activationReady !== true) {
    pushDiagnostic(diagnostics, "error", "profile-activation-not-ready", { status: normalized.status });
  }
  if (EFFECTIVE_RANGE_STATUSES.has(normalized.status) && strictManaged && !normalized.effectiveFrom) {
    pushDiagnostic(diagnostics, "error", "profile-effective-from-required", { status: normalized.status });
  }
  if (normalized.status === "active" && strictManaged
    && (!normalized.activatedAt || !normalized.activatedBy.uid)) {
    pushDiagnostic(diagnostics, "error", "profile-activation-audit-required");
  }
  if (["retired", "deprecated"].includes(normalized.status) && strictManaged
    && (!normalized.retiredAt || !normalized.retiredBy.uid || !normalized.effectiveTo)) {
    pushDiagnostic(diagnostics, "error", "profile-retirement-audit-required");
  }

  if (normalized.lifecycle.contentFingerprint) {
    const currentFingerprint = buildRuleProfileContentFingerprint(normalized);
    if (currentFingerprint !== normalized.lifecycle.contentFingerprint) {
      pushDiagnostic(diagnostics, "error", "profile-active-content-mutated", {
        expectedFingerprint: normalized.lifecycle.contentFingerprint,
        actualFingerprint: currentFingerprint
      });
    }
  } else if (strictManaged && ["ready", "active", "retired", "deprecated"].includes(normalized.status)) {
    pushDiagnostic(diagnostics, "error", "profile-content-fingerprint-required", { status: normalized.status });
  }

  return {
    valid: !hasErrors(diagnostics),
    profile: normalized,
    diagnostics: dedupeDiagnostics(diagnostics),
    temporalPolicyVersion: RULE_PROFILE_TEMPORAL_POLICY_VERSION
  };
}

export function canTransitionRuleProfile(profile, targetStatus, options = {}) {
  try {
    const result = transitionRuleProfileState(profile, targetStatus, { ...options, dryRun: true });
    return { allowed: true, diagnostics: [], result };
  } catch (error) {
    return {
      allowed: false,
      diagnostics: [{ severity: "error", code: error?.code || "profile-transition-failed", ...(error?.details || {}) }],
      result: null
    };
  }
}

export function transitionRuleProfileState(profile, targetStatus, options = {}) {
  const sourceValidation = validateRuleProfileTemporalState(profile, {
    requireManaged: Boolean(profile?.temporalPolicyVersion)
  });
  if (!sourceValidation.valid) throw firstDiagnosticError(sourceValidation.diagnostics);
  const source = sourceValidation.profile;

  const target = normalizeStatus(targetStatus);
  const actor = normalizeActor(options.actor);
  const authority = normalizeAuthority(options.authority);
  const now = normalizeDate(options.now);
  const expectedRevision = Number(options.expectedRevision);
  const idempotencyKey = normalizeId(options.idempotencyKey);
  const requestFingerprint = fingerprintValue({
    targetStatus: target,
    actorUid: actor.uid,
    authority,
    effectiveFrom: options.effectiveFrom ?? null,
    effectiveTo: options.effectiveTo ?? null
  });

  if (!target || !RULE_PROFILE_TEMPORAL_STATUSES.includes(target)) {
    throw policyError("profile-transition-target-invalid", { targetStatus });
  }
  if (!authority || !["trusted", "local-emulator"].includes(authority)) {
    throw policyError("profile-transition-authority-required", { authority: authority || "client" });
  }
  if (!actor.uid) throw policyError("profile-transition-actor-required");
  if (!now) throw policyError("profile-transition-authoritative-time-required");
  if (!idempotencyKey) throw policyError("profile-transition-idempotency-key-required");

  const lastTransition = source.lifecycle.lastTransition;
  if (lastTransition.idempotencyKey === idempotencyKey) {
    if (lastTransition.toStatus !== target || lastTransition.requestFingerprint !== requestFingerprint) {
      throw policyError("profile-transition-idempotency-conflict", { idempotencyKey });
    }
    return {
      profile: cloneSafe(source, [], "idempotent-profile"),
      auditEvent: cloneSafe(lastTransition.auditEvent, [], "idempotent-audit"),
      idempotent: true
    };
  }

  if (!Number.isInteger(expectedRevision) || expectedRevision !== source.revision) {
    throw policyError("profile-transition-revision-conflict", {
      expectedRevision: options.expectedRevision,
      currentRevision: source.revision
    });
  }

  const allowedTargets = RULE_PROFILE_TEMPORAL_TRANSITIONS[source.status] || [];
  if (!allowedTargets.includes(target)) {
    throw policyError("profile-transition-invalid", { fromStatus: source.status, toStatus: target });
  }

  const next = cloneSafe(source, [], "transition-profile");
  next.temporalPolicyVersion = RULE_PROFILE_TEMPORAL_POLICY_VERSION;
  next.createdAt = source.createdAt || now;
  next.createdBy = source.createdBy.uid ? source.createdBy : actor;
  next.updatedAt = now;
  next.updatedBy = actor;
  next.revision = source.revision + 1;
  next.status = target;

  if (source.status === "draft" && target === "ready") {
    next.effectiveFrom = normalizeDate(options.effectiveFrom ?? source.effectiveFrom);
    next.effectiveTo = normalizeOptionalDate(options.effectiveTo ?? source.effectiveTo);
    if (!next.effectiveFrom) throw policyError("profile-effective-from-required", { targetStatus: target });
    if (options.effectiveTo !== undefined && options.effectiveTo !== null && options.effectiveTo !== "" && !next.effectiveTo) {
      throw policyError("profile-temporal-date-invalid", { field: "effectiveTo" });
    }
    if (next.activationReady !== true) throw policyError("profile-activation-not-ready", { targetStatus: target });
    next.lifecycle.contentFingerprint = buildRuleProfileContentFingerprint(next);
  }

  if (source.status === "ready" && target === "draft") {
    next.activatedAt = null;
    next.activatedBy = emptyActor();
    next.lifecycle.contentFingerprint = "";
  }

  if (source.status === "ready" && target === "active") {
    assertFrozenContent(source);
    if (source.activationReady !== true) throw policyError("profile-activation-not-ready", { targetStatus: target });
    next.activatedAt = now;
    next.activatedBy = actor;
  }

  if (source.status === "active" && ["retired", "deprecated"].includes(target)) {
    assertFrozenContent(source);
    next.effectiveTo = normalizeDate(options.effectiveTo ?? now);
    next.retiredAt = now;
    next.retiredBy = actor;
    if (!next.effectiveTo || (next.effectiveFrom && Date.parse(next.effectiveTo) <= Date.parse(next.effectiveFrom))) {
      throw policyError("profile-temporal-range-invalid", {
        effectiveFrom: next.effectiveFrom,
        effectiveTo: next.effectiveTo
      });
    }
  }

  const auditEvent = buildTransitionAuditEvent(source, next, actor, authority, now, idempotencyKey);
  next.lifecycle.lastTransition = {
    idempotencyKey,
    requestFingerprint,
    fromStatus: source.status,
    toStatus: target,
    revision: next.revision,
    at: now,
    auditEvent
  };

  const validation = validateRuleProfileTemporalState(next, {
    requireManaged: MANAGED_STATUSES.has(target) || Boolean(source.temporalPolicyVersion)
  });
  if (!validation.valid) throw firstDiagnosticError(validation.diagnostics);

  return {
    profile: validation.profile,
    auditEvent: cloneSafe(auditEvent, [], "transition-audit"),
    idempotent: false,
    dryRun: options.dryRun === true
  };
}

export function evaluateRuleProfileTemporalValidity(profile = {}, options = {}) {
  const validation = validateRuleProfileTemporalState(profile, {
    requireManaged: Boolean(profile?.temporalPolicyVersion)
  });
  const diagnostics = [...validation.diagnostics];
  const normalized = validation.profile;
  const evaluationAt = normalizeDate(options.at);
  const exactVersion = options.exactVersion === true;
  const allowLegacyExact = options.allowLegacyExact !== false;

  if (!evaluationAt) pushDiagnostic(diagnostics, "error", "profile-evaluation-time-required");
  if (hasErrors(diagnostics)) return temporalEvaluation(normalized, evaluationAt, diagnostics, false);

  const legacyWithoutRange = !normalized.temporalPolicyVersion
    && !normalized.effectiveFrom
    && !normalized.effectiveTo;
  if (legacyWithoutRange) {
    const legacyAvailable = exactVersion && allowLegacyExact
      && ["active", "deprecated"].includes(normalized.status);
    if (!legacyAvailable) {
      pushDiagnostic(diagnostics, "error", "profile-temporal-range-required", { status: normalized.status });
    } else if (normalized.status === "deprecated") {
      pushDiagnostic(diagnostics, "warning", "profile-deprecated-legacy-exact");
    }
    return temporalEvaluation(normalized, evaluationAt, diagnostics, legacyAvailable);
  }

  if (!HISTORIC_STATUSES.has(normalized.status)) {
    pushDiagnostic(diagnostics, "error", "profile-status-not-effective", { status: normalized.status });
    return temporalEvaluation(normalized, evaluationAt, diagnostics, false);
  }

  const atMs = Date.parse(evaluationAt);
  const fromMs = normalized.effectiveFrom ? Date.parse(normalized.effectiveFrom) : Number.NEGATIVE_INFINITY;
  const toMs = normalized.effectiveTo ? Date.parse(normalized.effectiveTo) : Number.POSITIVE_INFINITY;
  const effective = atMs >= fromMs && atMs < toMs;
  if (!effective) {
    pushDiagnostic(diagnostics, "error", atMs < fromMs ? "profile-not-yet-effective" : "profile-no-longer-effective", {
      evaluationAt,
      effectiveFrom: normalized.effectiveFrom,
      effectiveTo: normalized.effectiveTo
    });
  }
  return temporalEvaluation(normalized, evaluationAt, diagnostics, effective);
}

export function resolveRuleProfileTemporalVersion(registry = [], request = {}) {
  const diagnostics = [];
  const profileId = normalizeId(request.profileId);
  const version = normalizeVersion(request.version);
  const time = resolveRuleProfileEvaluationTime(request.context || {}, { at: request.at });
  diagnostics.push(...time.diagnostics);
  if (!profileId) pushDiagnostic(diagnostics, "error", "profile-temporal-id-invalid");
  if (request.version !== undefined && !version) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-version-invalid");
  }
  if (hasErrors(diagnostics)) return blockedTemporalResolution(time.evaluationAt, diagnostics);

  const candidates = normalizeRegistry(registry)
    .filter((profile) => normalizeId(profile?.profileId || profile?.id) === profileId)
    .filter((profile) => !version || normalizeVersion(profile?.version) === version)
    .sort(compareProfiles);
  if (!candidates.length) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-version-not-found", { profileId, version: version || null });
    return blockedTemporalResolution(time.evaluationAt, diagnostics);
  }

  const evaluations = candidates.map((profile) => evaluateRuleProfileTemporalValidity(profile, {
    at: time.evaluationAt,
    exactVersion: Boolean(version),
    allowLegacyExact: request.allowLegacyExact !== false
  }));
  const effective = evaluations.filter((result) => result.effective);
  if (effective.length > 1) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-overlap", {
      profileId,
      versions: effective.map((item) => item.profile.version)
    });
    return blockedTemporalResolution(time.evaluationAt, diagnostics);
  }
  if (!effective.length) {
    diagnostics.push(...evaluations.flatMap((result) => result.diagnostics));
    pushDiagnostic(diagnostics, "error", "profile-no-effective-version", { profileId, version: version || null });
    return blockedTemporalResolution(time.evaluationAt, diagnostics);
  }

  return {
    valid: true,
    blocked: false,
    profile: cloneSafe(effective[0].profile, [], "resolved-profile"),
    reference: {
      profileId: effective[0].profile.profileId,
      profileVersion: effective[0].profile.version,
      status: effective[0].profile.status
    },
    evaluationAt: time.evaluationAt,
    evaluationSource: time.source,
    diagnostics: dedupeDiagnostics([...diagnostics, ...effective[0].diagnostics])
  };
}

export function resolveRuleProfileEvaluationTime(context = {}, options = {}) {
  const candidates = [
    ["explicit", options.at],
    ["ruleProfileEffectiveAt", context.ruleProfileEffectiveAt],
    ["tournamentStartedAt", context.startedAt || context.startAt],
    ["tournamentCreatedAt", context.createdAt]
  ];
  for (const [source, value] of candidates) {
    if (value === undefined || value === null || value === "") continue;
    const evaluationAt = normalizeDate(value);
    if (evaluationAt) return { valid: true, evaluationAt, source, diagnostics: [] };
    return {
      valid: false,
      evaluationAt: null,
      source,
      diagnostics: [{ severity: "error", code: "profile-evaluation-time-invalid", source }]
    };
  }
  return {
    valid: false,
    evaluationAt: null,
    source: "none",
    diagnostics: [{ severity: "error", code: "profile-evaluation-time-required" }]
  };
}

export function validateRuleProfileTemporalRegistry(registry = []) {
  const diagnostics = [];
  const profiles = normalizeRegistry(registry).map((profile) => validateRuleProfileTemporalState(profile));
  const normalized = profiles.map((result) => result.profile).sort(compareProfiles);
  diagnostics.push(...profiles.flatMap((result) => result.diagnostics));

  const identities = new Set();
  for (const profile of normalized) {
    const identity = `${profile.profileId}@${profile.version}`;
    if (identities.has(identity)) pushDiagnostic(diagnostics, "error", "profile-temporal-version-duplicate", { identity });
    identities.add(identity);
  }

  for (let leftIndex = 0; leftIndex < normalized.length; leftIndex += 1) {
    const left = normalized[leftIndex];
    if (!left.effectiveFrom || !HISTORIC_STATUSES.has(left.status)) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < normalized.length; rightIndex += 1) {
      const right = normalized[rightIndex];
      if (right.profileId !== left.profileId || !right.effectiveFrom || !HISTORIC_STATUSES.has(right.status)) continue;
      if (rangesOverlap(left, right)) {
        pushDiagnostic(diagnostics, "error", "profile-temporal-range-overlap", {
          profileId: left.profileId,
          versions: [left.version, right.version]
        });
      }
    }
  }

  return {
    valid: !hasErrors(diagnostics),
    profiles: normalized,
    diagnostics: dedupeDiagnostics(diagnostics),
    temporalPolicyVersion: RULE_PROFILE_TEMPORAL_POLICY_VERSION
  };
}

export function buildRuleProfileContentFingerprint(profile = {}) {
  const safe = cloneSafe({
    contractVersion: profile.contractVersion || null,
    profileId: profile.profileId || profile.id || null,
    version: profile.version || null,
    name: profile.name || "",
    scope: profile.scope || "",
    source: profile.source || "",
    rules: profile.rules || [],
    suerteMetadata: profile.suerteMetadata || {},
    metadata: profile.metadata || {}
  }, [], "profile-content");
  return `rptp_${fingerprintValue(safe)}`;
}

function normalizeTemporalProfile(profile, diagnostics) {
  const source = cloneSafe(profile, diagnostics, "profile") || {};
  const status = normalizeStatus(source.status || "draft");
  const lifecycle = source.lifecycle && typeof source.lifecycle === "object" && !Array.isArray(source.lifecycle)
    ? source.lifecycle
    : {};
  return {
    profile: {
      ...source,
      temporalPolicyVersion: normalizeText(source.temporalPolicyVersion, 40),
      profileId: normalizeId(source.profileId || source.id),
      version: normalizeVersion(source.version),
      status,
      activationReady: source.activationReady === true || source.metadata?.activationReady === true,
      effectiveFrom: normalizeOptionalDate(source.effectiveFrom),
      effectiveTo: normalizeOptionalDate(source.effectiveTo),
      createdAt: normalizeOptionalDate(source.createdAt),
      createdBy: normalizeActor(source.createdBy),
      updatedAt: normalizeOptionalDate(source.updatedAt),
      updatedBy: normalizeActor(source.updatedBy),
      activatedAt: normalizeOptionalDate(source.activatedAt),
      activatedBy: normalizeActor(source.activatedBy),
      retiredAt: normalizeOptionalDate(source.retiredAt),
      retiredBy: normalizeActor(source.retiredBy),
      revision: normalizeRevision(source.revision),
      lifecycle: {
        ...lifecycle,
        contentFingerprint: normalizeText(lifecycle.contentFingerprint, 120),
        lastTransition: normalizeLastTransition(lifecycle.lastTransition)
      }
    },
    diagnostics
  };
}

function normalizeLastTransition(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyLastTransition();
  return {
    ...value,
    idempotencyKey: normalizeId(value.idempotencyKey),
    requestFingerprint: normalizeText(value.requestFingerprint, 120),
    fromStatus: normalizeStatus(value.fromStatus),
    toStatus: normalizeStatus(value.toStatus),
    revision: normalizeRevision(value.revision),
    at: normalizeOptionalDate(value.at),
    auditEvent: value.auditEvent && typeof value.auditEvent === "object" ? value.auditEvent : null
  };
}

function buildTransitionAuditEvent(before, after, actor, authority, at, idempotencyKey) {
  return {
    eventId: idempotencyKey,
    operation: "RULE_PROFILE_TRANSITION",
    profileId: after.profileId,
    version: after.version,
    fromStatus: before.status,
    toStatus: after.status,
    revision: after.revision,
    at,
    actor,
    authority,
    before: temporalSummary(before),
    after: temporalSummary(after)
  };
}

function temporalSummary(profile) {
  return {
    status: profile.status,
    activationReady: profile.activationReady,
    effectiveFrom: profile.effectiveFrom,
    effectiveTo: profile.effectiveTo,
    revision: profile.revision,
    contentFingerprint: profile.lifecycle?.contentFingerprint || ""
  };
}

function assertFrozenContent(profile) {
  const expected = profile.lifecycle?.contentFingerprint || "";
  const actual = buildRuleProfileContentFingerprint(profile);
  if (!expected || expected !== actual) {
    throw policyError("profile-active-content-mutated", {
      expectedFingerprint: expected,
      actualFingerprint: actual
    });
  }
}

function temporalEvaluation(profile, evaluationAt, diagnostics, effective) {
  return {
    valid: effective && !hasErrors(diagnostics),
    effective: effective && !hasErrors(diagnostics),
    profile,
    evaluationAt,
    diagnostics: dedupeDiagnostics(diagnostics)
  };
}

function blockedTemporalResolution(evaluationAt, diagnostics) {
  return {
    valid: false,
    blocked: true,
    profile: null,
    reference: { profileId: null, profileVersion: null, status: "blocked" },
    evaluationAt,
    evaluationSource: "none",
    diagnostics: dedupeDiagnostics(diagnostics)
  };
}

function rangesOverlap(left, right) {
  const leftStart = Date.parse(left.effectiveFrom);
  const rightStart = Date.parse(right.effectiveFrom);
  const leftEnd = left.effectiveTo ? Date.parse(left.effectiveTo) : Number.POSITIVE_INFINITY;
  const rightEnd = right.effectiveTo ? Date.parse(right.effectiveTo) : Number.POSITIVE_INFINITY;
  return leftStart < rightEnd && rightStart < leftEnd;
}

function validateDateField(source, key, normalized, diagnostics) {
  if (!Object.hasOwn(source || {}, key) || source[key] === null || source[key] === "") return;
  if (!normalized) pushDiagnostic(diagnostics, "error", "profile-temporal-date-invalid", { field: key });
}

function compareProfiles(left, right) {
  return String(left.profileId || left.id || "").localeCompare(String(right.profileId || right.id || ""), "en")
    || compareVersions(String(left.version || ""), String(right.version || ""));
}

function compareVersions(left, right) {
  const leftParts = left.split(/[.-]/).map((part) => /^\d+$/.test(part) ? Number(part) : part);
  const rightParts = right.split(/[.-]/).map((part) => /^\d+$/.test(part) ? Number(part) : part);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart === rightPart) continue;
    if (typeof leftPart === "number" && typeof rightPart === "number") return leftPart - rightPart;
    return String(leftPart).localeCompare(String(rightPart), "en");
  }
  return 0;
}

function normalizeRegistry(registry) {
  if (Array.isArray(registry)) return registry;
  if (!registry || typeof registry !== "object") return [];
  return Object.values(registry).flatMap((value) => Array.isArray(value) ? value : [value]);
}

function normalizeAuthority(value) {
  const clean = String(value || "").trim().toLowerCase();
  return ["trusted", "local-emulator"].includes(clean) ? clean : "";
}

function normalizeActor(value) {
  if (typeof value === "string") return { uid: normalizeId(value), role: "", source: "" };
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyActor();
  return {
    uid: normalizeId(value.uid || value.actorId || value.id),
    role: normalizeText(value.role, 80),
    source: normalizeText(value.source, 120)
  };
}

function emptyActor() {
  return { uid: "", role: "", source: "" };
}

function emptyLastTransition() {
  return {
    idempotencyKey: "",
    requestFingerprint: "",
    fromStatus: "",
    toStatus: "",
    revision: 0,
    at: null,
    auditEvent: null
  };
}

function normalizeRevision(value) {
  const number = Number(value ?? 0);
  return Number.isInteger(number) && number >= 0 ? number : -1;
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  const clean = String(value || "").trim();
  return ID_PATTERN.test(clean) ? clean : "";
}

function normalizeVersion(value) {
  const clean = String(value || "").trim();
  return VERSION_PATTERN.test(clean) ? clean : "";
}

function normalizeText(value, maxLength) {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, maxLength);
}

function normalizeDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  if (typeof value !== "string") return null;
  const clean = value.trim();
  if (!clean || !OFFSET_DATE_PATTERN.test(clean)) return null;
  const parsed = Date.parse(clean);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function normalizeOptionalDate(value) {
  if (value === null || value === undefined || value === "") return null;
  return normalizeDate(value);
}

function fingerprintValue(value) {
  const text = stableStringify(value);
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193) >>> 0;
    right = Math.imul(right ^ code, 0x85ebca6b) >>> 0;
  }
  return `${left.toString(16).padStart(8, "0")}${right.toString(16).padStart(8, "0")}`;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().filter((key) => !DANGEROUS_KEYS.has(key))
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function cloneSafe(value, diagnostics, path, depth = 0, seen = new WeakSet()) {
  if (depth > MAX_DEPTH) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-depth-limit", { path });
    return undefined;
  }
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.length > MAX_STRING) pushDiagnostic(diagnostics, "error", "profile-temporal-string-limit", { path });
    return value.slice(0, MAX_STRING);
  }
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    pushDiagnostic(diagnostics, "error", "profile-temporal-number-invalid", { path });
    return undefined;
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-value-forbidden", { path });
    return undefined;
  }
  if (!value || typeof value !== "object" || seen.has(value)) {
    pushDiagnostic(diagnostics, "error", "profile-temporal-cycle-invalid", { path });
    return undefined;
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY) pushDiagnostic(diagnostics, "error", "profile-temporal-array-limit", { path });
      return value.slice(0, MAX_ARRAY).map((item, index) =>
        cloneSafe(item, diagnostics, `${path}[${index}]`, depth + 1, seen)
      ).filter((item) => item !== undefined);
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      pushDiagnostic(diagnostics, "error", "profile-temporal-prototype-forbidden", { path });
      return undefined;
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_KEYS) pushDiagnostic(diagnostics, "error", "profile-temporal-key-limit", { path });
    const output = {};
    for (const key of keys.slice(0, MAX_KEYS)) {
      if (typeof key !== "string" || DANGEROUS_KEYS.has(key)) {
        pushDiagnostic(diagnostics, "error", "profile-temporal-dangerous-key", { path, key: String(key) });
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        pushDiagnostic(diagnostics, "error", "profile-temporal-accessor-forbidden", { path, key });
        continue;
      }
      const cloned = cloneSafe(descriptor.value, diagnostics, `${path}.${key}`, depth + 1, seen);
      if (cloned !== undefined) output[key] = cloned;
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

function pushDiagnostic(diagnostics, severity, code, details = {}) {
  diagnostics.push({ severity, code, ...details });
}

function hasErrors(diagnostics) {
  return diagnostics.some((item) => item.severity === "error");
}

function dedupeDiagnostics(diagnostics) {
  const seen = new Set();
  return diagnostics.filter((item) => {
    const key = stableStringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function firstDiagnosticError(diagnostics) {
  const diagnostic = diagnostics.find((item) => item.severity === "error") || { code: "profile-temporal-invalid" };
  return policyError(diagnostic.code, diagnostic);
}

function policyError(code, details = {}) {
  return new RuleProfileTemporalPolicyError(code, details);
}
