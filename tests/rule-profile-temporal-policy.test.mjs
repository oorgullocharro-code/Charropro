import assert from "node:assert/strict";
import {
  RULE_PROFILE_TEMPORAL_POLICY_VERSION,
  RULE_PROFILE_TEMPORAL_STATUSES,
  RULE_PROFILE_TEMPORAL_TRANSITIONS,
  RuleProfileTemporalPolicyError,
  buildRuleProfileContentFingerprint,
  canTransitionRuleProfile,
  evaluateRuleProfileTemporalValidity,
  normalizeRuleProfileTemporalState,
  resolveRuleProfileEvaluationTime,
  resolveRuleProfileTemporalVersion,
  transitionRuleProfileState,
  validateRuleProfileTemporalRegistry,
  validateRuleProfileTemporalState
} from "../js/data/ruleProfileTemporalPolicy.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";
import {
  FMCH_2026_LIBRE_PROFILE,
  resolveRuleProfileSelection
} from "../js/data/ruleProfiles.js?v=20260830-supervisor-tournament-deletion-nan-serialization-recovery-001-v1";

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-01-02T00:00:00.000Z";
const T2 = "2026-01-03T00:00:00.000Z";
const T3 = "2026-06-01T00:00:00.000Z";
const T4 = "2027-01-01T00:00:00.000Z";
const BEFORE_T0 = "2025-12-31T23:59:59.999Z";
const AFTER_T0 = "2026-01-01T00:00:00.001Z";
const BEFORE_T3 = "2026-05-31T23:59:59.999Z";
const AFTER_T3 = "2026-06-01T00:00:00.001Z";
const ACTOR = Object.freeze({ uid: "authority_1", role: "supervisor", source: "trusted-service" });

function draftProfile(version = "1.0.0", overrides = {}) {
  return {
    contractVersion: "1.0.0",
    profileId: "FMCH_TEST_TEMPORAL",
    version,
    name: "FMCH Temporal Test",
    scope: "competition",
    status: "draft",
    source: "fixture",
    rules: [{ suerteId: "cala", category: "base", ruleId: "BASE_A", value: 10, enabled: true }],
    suerteMetadata: {},
    metadata: {
      activationReady: true,
      zero: 0,
      flag: false,
      empty: "",
      nullable: null
    },
    revision: 0,
    ...overrides
  };
}

function transition(profile, targetStatus, options = {}) {
  return transitionRuleProfileState(profile, targetStatus, {
    authority: "trusted",
    actor: ACTOR,
    now: T0,
    expectedRevision: profile.revision || 0,
    idempotencyKey: `${profile.version}-${profile.status}-${targetStatus}-${profile.revision || 0}`,
    ...options
  });
}

function readyProfile(version = "1.0.0", effectiveFrom = T0, effectiveTo = null) {
  return transition(draftProfile(version), "ready", {
    effectiveFrom,
    effectiveTo,
    now: T0,
    idempotencyKey: `${version}-ready`
  }).profile;
}

function activeProfile(version = "1.0.0", effectiveFrom = T0, effectiveTo = null) {
  const ready = readyProfile(version, effectiveFrom, effectiveTo);
  return transition(ready, "active", {
    now: T1,
    idempotencyKey: `${version}-active`
  }).profile;
}

assert.equal(RULE_PROFILE_TEMPORAL_POLICY_VERSION, "1.0.0");
assert.deepEqual(RULE_PROFILE_TEMPORAL_STATUSES, [
  "skeleton", "draft", "ready", "active", "retired", "deprecated", "archived"
]);
assert.deepEqual(RULE_PROFILE_TEMPORAL_TRANSITIONS.active, ["retired", "deprecated"]);
assert.deepEqual(RULE_PROFILE_TEMPORAL_TRANSITIONS, {
  skeleton: ["draft", "archived"],
  draft: ["ready", "archived"],
  ready: ["draft", "active", "archived"],
  active: ["retired", "deprecated"],
  retired: ["archived"],
  deprecated: ["archived"],
  archived: []
});

// La normalizacion conserva valores falsy validos y no muta la fuente.
const source = draftProfile();
const sourceBefore = structuredClone(source);
const normalized = normalizeRuleProfileTemporalState(source);
assert.deepEqual(source, sourceBefore);
assert.equal(normalized.metadata.zero, 0);
assert.equal(normalized.metadata.flag, false);
assert.equal(normalized.metadata.empty, "");
assert.equal(normalized.metadata.nullable, null);

// Flujo canonico completo y auditoria determinista.
const readyResult = transition(source, "ready", {
  effectiveFrom: "2025-12-31T18:00:00-06:00",
  now: T0,
  idempotencyKey: "transition-ready"
});
assert.equal(readyResult.profile.status, "ready");
assert.equal(readyResult.profile.effectiveFrom, T0);
assert.equal(readyResult.profile.revision, 1);
assert.equal(readyResult.profile.createdAt, T0);
assert.equal(readyResult.profile.createdBy.uid, ACTOR.uid);
assert.equal(readyResult.auditEvent.operation, "RULE_PROFILE_TRANSITION");
assert.equal(readyResult.auditEvent.fromStatus, "draft");
assert.equal(readyResult.auditEvent.toStatus, "ready");
assert.match(readyResult.profile.lifecycle.contentFingerprint, /^rptp_[0-9a-f]{16}$/);
assert.deepEqual(source, sourceBefore, "transition never mutates its source");

const activeResult = transition(readyResult.profile, "active", {
  now: T1,
  idempotencyKey: "transition-active"
});
assert.equal(activeResult.profile.status, "active");
assert.equal(activeResult.profile.revision, 2);
assert.equal(activeResult.profile.createdAt, T0);
assert.equal(activeResult.profile.activatedAt, T1);

const activeRetry = transitionRuleProfileState(activeResult.profile, "active", {
  authority: "trusted",
  actor: ACTOR,
  now: T2,
  expectedRevision: 1,
  idempotencyKey: "transition-active"
});
assert.equal(activeRetry.idempotent, true);
assert.equal(activeRetry.profile.revision, 2);
assert.equal(activeRetry.profile.updatedAt, T1);

const retiredResult = transition(activeResult.profile, "retired", {
  now: T3,
  effectiveTo: T3,
  idempotencyKey: "transition-retired"
});
assert.equal(retiredResult.profile.status, "retired");
assert.equal(retiredResult.profile.revision, 3);
assert.equal(retiredResult.profile.effectiveTo, T3);
assert.equal(retiredResult.profile.retiredAt, T3);

const archivedResult = transition(retiredResult.profile, "archived", {
  now: T4,
  idempotencyKey: "transition-archived"
});
assert.equal(archivedResult.profile.status, "archived");
assert.equal(archivedResult.profile.revision, 4);
assert.equal(canTransitionRuleProfile(archivedResult.profile, "active", {
  authority: "trusted",
  actor: ACTOR,
  now: T4,
  expectedRevision: archivedResult.profile.revision,
  idempotencyKey: "archived-reactivation"
}).allowed, false);

const deprecatedResult = transition(activeProfile("1.1.0", T0), "deprecated", {
  now: T3,
  effectiveTo: T3,
  idempotencyKey: "1.1.0-deprecated"
});
assert.equal(deprecatedResult.profile.status, "deprecated");
assert.equal(transition(deprecatedResult.profile, "archived", {
  now: T4,
  idempotencyKey: "1.1.0-archived"
}).profile.status, "archived");

// CAS, autoridad, activationReady y saltos ilegales son errores tipados y atomicos.
const notReady = draftProfile("2.0.0", { metadata: { activationReady: false } });
assert.throws(
  () => transition(notReady, "ready", { effectiveFrom: T0, idempotencyKey: "not-ready" }),
  (error) => error instanceof RuleProfileTemporalPolicyError && error.code === "profile-activation-not-ready"
);
assert.equal(notReady.status, "draft");
assert.equal(notReady.revision, 0);

assert.throws(
  () => transition(source, "active", { idempotencyKey: "skip-ready" }),
  (error) => error.code === "profile-transition-invalid"
);
assert.throws(
  () => transitionRuleProfileState(source, "ready", {
    authority: "client",
    actor: ACTOR,
    now: T0,
    expectedRevision: 0,
    idempotencyKey: "client-activate",
    effectiveFrom: T0
  }),
  (error) => error.code === "profile-transition-authority-required"
);
assert.throws(
  () => transitionRuleProfileState(source, "ready", {
    authority: "trusted",
    actor: ACTOR,
    now: T0,
    expectedRevision: 9,
    idempotencyKey: "revision-conflict",
    effectiveFrom: T0
  }),
  (error) => error.code === "profile-transition-revision-conflict"
);
assert.throws(
  () => transitionRuleProfileState(source, "ready", {
    authority: "trusted",
    actor: ACTOR,
    now: "2026-01-01T00:00:00",
    expectedRevision: 0,
    idempotencyKey: "local-clock-forbidden",
    effectiveFrom: T0
  }),
  (error) => error.code === "profile-transition-authoritative-time-required"
);
assert.throws(
  () => transition(source, "ready", {
    effectiveFrom: T0,
    effectiveTo: "not-a-date",
    idempotencyKey: "invalid-effective-to"
  }),
  (error) => error.code === "profile-temporal-date-invalid"
);

const transitionCheck = canTransitionRuleProfile(source, "ready", {
  authority: "trusted",
  actor: ACTOR,
  now: T0,
  expectedRevision: 0,
  idempotencyKey: "dry-run",
  effectiveFrom: T0
});
assert.equal(transitionCheck.allowed, true);
assert.equal(source.status, "draft");

// Un perfil congelado no puede alterarse entre READY, ACTIVE y RETIRED.
const tamperedReady = structuredClone(readyResult.profile);
tamperedReady.rules[0].value = 999;
assert.throws(
  () => transition(tamperedReady, "active", { now: T1, idempotencyKey: "tampered-active" }),
  (error) => error.code === "profile-active-content-mutated"
);
assert.equal(tamperedReady.status, "ready");

assert.throws(
  () => transition(retiredResult.profile, "active", { now: T4, idempotencyKey: "reactivation" }),
  (error) => error.code === "profile-transition-invalid"
);

assert.throws(
  () => transitionRuleProfileState(readyResult.profile, "active", {
    authority: "trusted",
    actor: ACTOR,
    now: T1,
    expectedRevision: 1,
    idempotencyKey: "transition-ready",
    effectiveFrom: T2
  }),
  (error) => error.code === "profile-transition-idempotency-conflict"
);
assert.throws(
  () => transitionRuleProfileState(activeResult.profile, "active", {
    authority: "trusted",
    actor: { uid: "different_authority", role: "supervisor" },
    now: T2,
    expectedRevision: 2,
    idempotencyKey: "transition-active"
  }),
  (error) => error.code === "profile-transition-idempotency-conflict"
);

// Resolucion temporal: [effectiveFrom, effectiveTo), exacta, historica y sin reloj local.
const version1 = activeProfile("1.0.0", T0, T3);
const version2 = activeProfile("2.0.0", T3, null);
const registry = [version2, version1];

const beforeBoundary = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  at: "2026-05-31T23:59:59.999Z"
});
assert.equal(beforeBoundary.valid, true);
assert.equal(beforeBoundary.reference.profileVersion, "1.0.0");

const atBoundary = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  at: T3
});
assert.equal(atBoundary.valid, true);
assert.equal(atBoundary.reference.profileVersion, "2.0.0");

// Los intervalos son exactamente [effectiveFrom, effectiveTo).
const bounded = activeProfile("2.1.0", T0, T3);
assert.equal(evaluateRuleProfileTemporalValidity(bounded, { at: BEFORE_T0 }).effective, false);
assert.equal(evaluateRuleProfileTemporalValidity(bounded, { at: T0 }).effective, true);
assert.equal(evaluateRuleProfileTemporalValidity(bounded, { at: AFTER_T0 }).effective, true);
assert.equal(evaluateRuleProfileTemporalValidity(bounded, { at: BEFORE_T3 }).effective, true);
assert.equal(evaluateRuleProfileTemporalValidity(bounded, { at: T3 }).effective, false);
assert.equal(evaluateRuleProfileTemporalValidity(bounded, { at: AFTER_T3 }).effective, false);

const historicTournament = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: { createdAt: "2026-02-01T00:00:00.000Z", startedAt: "2026-03-01T00:00:00.000Z" }
});
assert.equal(historicTournament.valid, true);
assert.equal(historicTournament.reference.profileVersion, "1.0.0");
assert.equal(historicTournament.evaluationSource, "tournamentStartedAt");

const createdBeforeNewVersion = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: { createdAt: "2026-02-01T00:00:00.000Z" }
});
assert.equal(createdBeforeNewVersion.valid, true);
assert.equal(createdBeforeNewVersion.reference.profileVersion, "1.0.0");
assert.equal(createdBeforeNewVersion.evaluationSource, "tournamentCreatedAt");

const explicitAnchor = resolveRuleProfileEvaluationTime({
  ruleProfileEffectiveAt: T1,
  startedAt: T2,
  createdAt: T0
}, { at: T3 });
assert.equal(explicitAnchor.evaluationAt, T3);
assert.equal(explicitAnchor.source, "explicit");
assert.deepEqual(resolveRuleProfileEvaluationTime({
  ruleProfileEffectiveAt: T1,
  startedAt: T2,
  createdAt: T0
}), { valid: true, evaluationAt: T1, source: "ruleProfileEffectiveAt", diagnostics: [] });
assert.deepEqual(resolveRuleProfileEvaluationTime({
  startedAt: T2,
  createdAt: T0
}), { valid: true, evaluationAt: T2, source: "tournamentStartedAt", diagnostics: [] });
assert.deepEqual(resolveRuleProfileEvaluationTime({
  createdAt: T0
}), { valid: true, evaluationAt: T0, source: "tournamentCreatedAt", diagnostics: [] });
assert.equal(resolveRuleProfileEvaluationTime({}, {}).valid, false);
assert.equal(resolveRuleProfileEvaluationTime({ createdAt: "2026-01-01T00:00:00" }).valid, false);

// UTC y offsets explicitos son deterministas; fechas sin zona fallan cerradas.
assert.equal(resolveRuleProfileEvaluationTime({}, { at: "2025-12-31T18:00:00-06:00" }).evaluationAt, T0);
assert.equal(resolveRuleProfileEvaluationTime({}, { at: "2026-01-01T01:00:00+01:00" }).evaluationAt, T0);
assert.equal(resolveRuleProfileEvaluationTime({}, { at: "2026-03-08T01:30:00-06:00" }).evaluationAt,
  "2026-03-08T07:30:00.000Z");
assert.equal(resolveRuleProfileEvaluationTime({}, { at: "2026-03-08T03:30:00-04:00" }).evaluationAt,
  "2026-03-08T07:30:00.000Z");
assert.equal(resolveRuleProfileEvaluationTime({}, { at: "2026-03-08T02:30:00" }).valid, false);

const futureProfile = activeProfile("3.0.0", T4, null);
const futureEvaluation = evaluateRuleProfileTemporalValidity(futureProfile, { at: T3 });
assert.equal(futureEvaluation.effective, false);
assert.ok(futureEvaluation.diagnostics.some((item) => item.code === "profile-not-yet-effective"));

const retiredHistoric = transition(activeProfile("4.0.0", T0, null), "retired", {
  now: T3,
  effectiveTo: T3,
  idempotencyKey: "4.0.0-retired"
}).profile;
assert.equal(evaluateRuleProfileTemporalValidity(retiredHistoric, { at: T2 }).effective, true);
assert.equal(evaluateRuleProfileTemporalValidity(retiredHistoric, { at: T3 }).effective, false);

const gapRegistry = [
  activeProfile("5.0.0", T0, "2026-05-01T00:00:00.000Z"),
  activeProfile("6.0.0", T3, null)
];
const gap = resolveRuleProfileTemporalVersion(gapRegistry, {
  profileId: source.profileId,
  at: "2026-05-15T00:00:00.000Z"
});
assert.equal(gap.blocked, true);
assert.ok(gap.diagnostics.some((item) => item.code === "profile-no-effective-version"));

const overlapRegistry = [
  activeProfile("7.0.0", T0, "2026-07-01T00:00:00.000Z"),
  activeProfile("8.0.0", T3, null)
];
const overlap = resolveRuleProfileTemporalVersion(overlapRegistry, {
  profileId: source.profileId,
  at: "2026-06-15T00:00:00.000Z"
});
assert.equal(overlap.blocked, true);
assert.ok(overlap.diagnostics.some((item) => item.code === "profile-temporal-overlap"));
const overlapValidation = validateRuleProfileTemporalRegistry(overlapRegistry);
assert.equal(overlapValidation.valid, false);
assert.ok(overlapValidation.diagnostics.some((item) => item.code === "profile-temporal-range-overlap"));

const noProfileMatch = resolveRuleProfileTemporalVersion(registry, {
  profileId: "DOES_NOT_EXIST",
  at: T2
});
assert.equal(noProfileMatch.blocked, true);
assert.ok(noProfileMatch.diagnostics.some((item) => item.code === "profile-temporal-version-not-found"));

const duplicateValidation = validateRuleProfileTemporalRegistry([version1, structuredClone(version1)]);
assert.equal(duplicateValidation.valid, false);
assert.ok(duplicateValidation.diagnostics.some((item) => item.code === "profile-temporal-version-duplicate"));

// Compatibilidad: perfiles active/deprecated legacy siguen disponibles solo por version exacta.
const legacyActive = draftProfile("9.0.0", { status: "active" });
const legacyExact = resolveRuleProfileTemporalVersion([legacyActive], {
  profileId: source.profileId,
  version: "9.0.0",
  at: T2
});
assert.equal(legacyExact.valid, true);
const legacyAutomatic = resolveRuleProfileTemporalVersion([legacyActive], {
  profileId: source.profileId,
  at: T2
});
assert.equal(legacyAutomatic.blocked, true);

const legacyWithoutReadiness = {
  contractVersion: "1.0.0",
  profileId: "LEGACY_PROFILE",
  version: "1.0.0",
  name: "Legacy",
  status: "active",
  rules: [],
  metadata: {}
};
assert.equal(resolveRuleProfileTemporalVersion([legacyWithoutReadiness], {
  profileId: "LEGACY_PROFILE",
  version: "1.0.0",
  at: T2
}).valid, true);

const currentLegacyResolver = resolveRuleProfileSelection({
  ruleProfileId: source.profileId,
  ruleProfileVersion: "9.0.0"
}, { profile: legacyActive });
assert.equal(currentLegacyResolver.valid, true);

const managedWithoutTime = resolveRuleProfileSelection({
  ruleProfileId: source.profileId,
  ruleProfileVersion: "2.0.0"
}, { profile: version2 });
assert.equal(managedWithoutTime.blocked, true);
assert.ok(managedWithoutTime.diagnostics.some((item) => item.code === "profile-evaluation-time-required"));

const managedWithTime = resolveRuleProfileSelection({
  ruleProfileId: source.profileId,
  ruleProfileVersion: "2.0.0"
}, { profile: version2, evaluationAt: T3 });
assert.equal(managedWithTime.valid, true);

// Product Base es explicito en el resolver legado y nunca se disfraza como FMCH.
const implicitProductBase = resolveRuleProfileSelection({});
assert.equal(implicitProductBase.valid, true);
assert.equal(implicitProductBase.profile, null);
assert.equal(implicitProductBase.reference.status, "product_base");
assert.equal(implicitProductBase.reference.profileId, null);

const explicitProductBase = resolveRuleProfileSelection({ ruleProfileFallback: "product_base" });
assert.equal(explicitProductBase.valid, true);
assert.equal(explicitProductBase.profile, null);
assert.equal(explicitProductBase.reference.status, "product_base");

const invalidTemporalWithFormalFallback = resolveRuleProfileSelection({
  ruleProfileId: source.profileId,
  ruleProfileVersion: "2.0.0",
  ruleProfileFallback: "product_base"
}, { profile: version2 });
assert.equal(invalidTemporalWithFormalFallback.valid, true);
assert.equal(invalidTemporalWithFormalFallback.fallbackUsed, true);
assert.equal(invalidTemporalWithFormalFallback.profile, null);
assert.equal(invalidTemporalWithFormalFallback.reference.status, "fallback");
assert.equal(invalidTemporalWithFormalFallback.reference.profileId, null);
assert.ok(invalidTemporalWithFormalFallback.diagnostics.some((item) => item.code === "profile-evaluation-time-required"));

const temporalDraft = draftProfile("15.0.0", {
  temporalPolicyVersion: RULE_PROFILE_TEMPORAL_POLICY_VERSION,
  effectiveFrom: T0
});
const temporalDraftSelection = resolveRuleProfileSelection({
  ruleProfileId: temporalDraft.profileId,
  ruleProfileVersion: temporalDraft.version
}, { profile: temporalDraft, evaluationAt: T2 });
assert.equal(temporalDraftSelection.blocked, true);
assert.ok(temporalDraftSelection.diagnostics.some((item) => item.code === "profile-not-available-for-scoring"));

// El perfil FMCH vigente conserva su bloqueo productivo.
const fmchSelection = resolveRuleProfileSelection({
  ruleProfileId: FMCH_2026_LIBRE_PROFILE.profileId,
  ruleProfileVersion: FMCH_2026_LIBRE_PROFILE.version
});
assert.equal(fmchSelection.blocked, true);
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);

// El inicio del torneo congela la version temporal aunque la competencia cruce una frontera.
const createdBeforeStartsAfter = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: { createdAt: BEFORE_T0, startedAt: AFTER_T3 }
});
assert.equal(createdBeforeStartsAfter.reference.profileVersion, "2.0.0");

const createdBeforeStartsBefore = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: { createdAt: BEFORE_T0, startedAt: AFTER_T0 }
});
assert.equal(createdBeforeStartsBefore.reference.profileVersion, "1.0.0");

const startsAtEffectiveFrom = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: { createdAt: BEFORE_T0, startedAt: T0 }
});
assert.equal(startsAtEffectiveFrom.reference.profileVersion, "1.0.0");

const startsAtEffectiveTo = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: { createdAt: T0, startedAt: T3 }
});
assert.equal(startsAtEffectiveTo.reference.profileVersion, "2.0.0");

const longRunningTournament = { createdAt: BEFORE_T0, startedAt: AFTER_T0 };
const pinnedBeforeTransition = resolveRuleProfileTemporalVersion(registry, {
  profileId: source.profileId,
  context: longRunningTournament
});
const registryWithLaterVersion = [activeProfile("2.5.0", T4), ...registry];
const pinnedAfterRegistryChange = resolveRuleProfileTemporalVersion(registryWithLaterVersion, {
  profileId: source.profileId,
  context: longRunningTournament
});
assert.equal(pinnedBeforeTransition.reference.profileVersion, "1.0.0");
assert.equal(pinnedAfterRegistryChange.reference.profileVersion, "1.0.0");

const historicAttempt = {
  context: {
    ruleProfileId: source.profileId,
    ruleProfileVersion: "1.0.0",
    effectiveRulesFingerprint: "rules_historic_001"
  },
  score: { total: 0 }
};
const historicAttemptBefore = structuredClone(historicAttempt);
resolveRuleProfileTemporalVersion(registryWithLaterVersion, {
  profileId: source.profileId,
  context: longRunningTournament
});
assert.deepEqual(historicAttempt, historicAttemptBefore);

// Entradas no declarativas o peligrosas se rechazan sin ejecutar accessors.
const functionProfile = draftProfile("10.0.0", { metadata: { activationReady: true, unsafe: () => true } });
assert.equal(validateRuleProfileTemporalState(functionProfile).valid, false);
assert.ok(validateRuleProfileTemporalState(functionProfile).diagnostics.some((item) => item.code === "profile-temporal-value-forbidden"));

const cyclicProfile = draftProfile("11.0.0");
cyclicProfile.metadata.cycle = cyclicProfile;
const cyclicValidation = validateRuleProfileTemporalState(cyclicProfile);
assert.equal(cyclicValidation.valid, false);
assert.ok(cyclicValidation.diagnostics.some((item) => item.code === "profile-temporal-cycle-invalid"));

const dangerousProfile = draftProfile("12.0.0");
Object.defineProperty(dangerousProfile.metadata, "__proto__", { value: { polluted: true }, enumerable: true });
const dangerousValidation = validateRuleProfileTemporalState(dangerousProfile);
assert.equal(dangerousValidation.valid, false);
assert.ok(dangerousValidation.diagnostics.some((item) => item.code === "profile-temporal-dangerous-key"));
assert.equal({}.polluted, undefined);

const invalidNumber = draftProfile("13.0.0", { metadata: { activationReady: true, value: Number.POSITIVE_INFINITY } });
assert.equal(validateRuleProfileTemporalState(invalidNumber).valid, false);

const stringRevision = draftProfile("14.0.0", { revision: "0" });
const stringRevisionValidation = validateRuleProfileTemporalState(stringRevision);
assert.equal(stringRevisionValidation.valid, false);
assert.ok(stringRevisionValidation.diagnostics.some((item) => item.code === "profile-temporal-revision-type-invalid"));

assert.equal(
  buildRuleProfileContentFingerprint(source),
  buildRuleProfileContentFingerprint(structuredClone(source)),
  "content fingerprint is deterministic"
);

const reorderedSource = {
  rules: source.rules.map((rule) => ({ enabled: rule.enabled, value: rule.value, ruleId: rule.ruleId,
    category: rule.category, suerteId: rule.suerteId })),
  metadata: { nullable: null, empty: "", flag: false, zero: 0, activationReady: true },
  source: source.source,
  scope: source.scope,
  name: source.name,
  version: source.version,
  profileId: source.profileId,
  contractVersion: source.contractVersion,
  suerteMetadata: {}
};
assert.equal(buildRuleProfileContentFingerprint(source), buildRuleProfileContentFingerprint(reorderedSource));

const materiallyChanged = structuredClone(source);
materiallyChanged.rules[0].value = 11;
assert.notEqual(buildRuleProfileContentFingerprint(source), buildRuleProfileContentFingerprint(materiallyChanged));

const volatileLifecycleChanged = {
  ...source,
  status: "active",
  revision: 99,
  createdAt: T0,
  updatedAt: T4,
  lifecycle: { lastTransition: { at: T4 } }
};
assert.equal(buildRuleProfileContentFingerprint(source), buildRuleProfileContentFingerprint(volatileLifecycleChanged));
assert.equal(buildRuleProfileContentFingerprint(source), buildRuleProfileContentFingerprint(source));

console.log("rule-profile-temporal-policy.test.mjs: ok");
