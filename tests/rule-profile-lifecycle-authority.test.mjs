import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import engine from "../functions/ruleProfileLifecycleEngine.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import service from "../functions/ruleProfileLifecycleService.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import { FMCH_2026_LIBRE_PROFILE } from "../js/data/ruleProfiles.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import {
  RULE_PROFILE_TEMPORAL_STATUSES,
  RULE_PROFILE_TEMPORAL_TRANSITIONS,
  buildRuleProfileContentFingerprint
} from "../js/data/ruleProfileTemporalPolicy.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

const {
  REQUEST_TRANSITIONS,
  RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION,
  RULE_PROFILE_LIFECYCLE_STATUSES,
  RULE_PROFILE_LIFECYCLE_TRANSITIONS,
  RuleProfileLifecycleError,
  applyRuleProfileLifecycleTransaction,
  authorizeRuleProfileLifecycleActor,
  buildRuleProfileProfileKey,
  buildRuleProfileVersionKey,
  fingerprintRuleProfileCertificate,
  getRuleProfileCertificate,
  prepareRuleProfileLifecycleRequest,
  validateRuleProfileCertificate,
  validateRuleProfileCertificationRegistry
} = engine;
const { createMemoryRuleProfileLifecycleAdapter, createRuleProfileLifecycleRuntime } = service;

const registry = JSON.parse(await readFile(new URL(
  "../functions/ruleProfileCertificationRegistry.json",
  import.meta.url
), "utf8"));
const certificationRecord = JSON.parse(await readFile(new URL(
  "../CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001/CERTIFICATION_RECORD.json",
  import.meta.url
), "utf8"));
const T0 = "2026-09-01T00:00:00.000Z";
const T1 = "2026-09-02T00:00:00.000Z";
const T2 = "2026-09-03T00:00:00.000Z";
const T3 = "2027-01-01T00:00:00.000Z";
const ADMIN = Object.freeze({
  uid: "platform_admin_1",
  name: "Platform Admin",
  role: "supervisor",
  tenantId: "",
  organizationId: "",
  platformAdmin: true,
  active: true
});

const certificate = getRuleProfileCertificate(registry, "FMCH_2026_LIBRE", "0.6.0");
assert.equal(RULE_PROFILE_LIFECYCLE_AUTHORITY_VERSION, "1.0.0");
assert.deepEqual(RULE_PROFILE_LIFECYCLE_STATUSES, RULE_PROFILE_TEMPORAL_STATUSES);
assert.deepEqual(RULE_PROFILE_LIFECYCLE_TRANSITIONS, RULE_PROFILE_TEMPORAL_TRANSITIONS);
assert.equal(REQUEST_TRANSITIONS.MARK_READY, "ready");
assert.equal(validateRuleProfileCertificationRegistry(registry).valid, true);
assert.equal(validateRuleProfileCertificate(certificate).valid, true);
assert.throws(
  () => createRuleProfileLifecycleRuntime(createMemoryRuleProfileLifecycleAdapter(), { registry: {} }),
  (error) => error.code === "rule-profile-certification-registry-invalid"
);

// The deployable certificate is a minimal trusted manifest, not a duplicate sporting catalog.
assert.equal(certificate.contentFingerprint, buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE));
assert.equal(certificate.contentFingerprint, certificationRecord.profile.contentFingerprint);
assert.equal(certificate.certification.verdict, certificationRecord.certification.verdict);
assert.equal(certificate.certification.remainingP0, 0);
assert.equal(certificate.certification.activationReadyEligibility, true);
assert.equal(certificate.catalogRuleCount, FMCH_2026_LIBRE_PROFILE.rules.length);
assert.equal(certificate.suerteCount, FMCH_2026_LIBRE_PROFILE.metadata.loadedSuerteIds.length);
assert.equal(Object.hasOwn(certificate, "rules"), false);

const requestBase = Object.freeze({
  profileId: "FMCH_2026_LIBRE",
  version: "0.6.0",
  tenantId: "",
  organizationId: ""
});
const readyRequest = Object.freeze({
  ...requestBase,
  requestedTransition: "MARK_READY",
  expectedRevision: 0,
  idempotencyKey: "fmch-ready-2026-001",
  effectiveFrom: T0,
  reason: "Certification approved"
});

function runtimeFixture(registryFixture = registry, start = T0, adapter = createMemoryRuleProfileLifecycleAdapter()) {
  let now = start;
  return {
    adapter,
    runtime: createRuleProfileLifecycleRuntime(adapter, { registry: registryFixture, now: () => now }),
    setNow(value) { now = value; }
  };
}

const fixture = runtimeFixture();
const requestBefore = structuredClone(readyRequest);
const actorBefore = structuredClone(ADMIN);
const ready = await fixture.runtime.transition(readyRequest, ADMIN);
assert.deepEqual(readyRequest, requestBefore);
assert.deepEqual(ADMIN, actorBefore);
assert.equal(ready.ok, true);
assert.equal(ready.previousStatus, "draft");
assert.equal(ready.status, "ready");
assert.equal(ready.previousRevision, 0);
assert.equal(ready.revision, 1);
assert.equal(ready.activationReady, true);
assert.equal(ready.fingerprint, certificate.contentFingerprint);
assert.equal(ready.updatedAt, T0);
assert.match(ready.auditEventId, /^event_[0-9a-f]{40}$/);

const profileKey = buildRuleProfileProfileKey(ready.profileId);
const versionKey = buildRuleProfileVersionKey(ready.version);
const readySnapshot = fixture.adapter.snapshot();
const readyContainer = readySnapshot.profiles[profileKey].versions[versionKey];
assert.equal(readyContainer.state.status, "ready");
assert.equal(readyContainer.state.definitionImmutable, true);
assert.equal(readyContainer.state.contentFingerprint, certificate.contentFingerprint);
assert.equal(readyContainer.state.certificateFingerprint, fingerprintRuleProfileCertificate(certificate));
assert.equal(readyContainer.audit[ready.auditEventId].newRevision, 1);
assert.equal(Object.keys(readyContainer.audit).length, 1);
assert.equal(Object.hasOwn(readyContainer.state, "rules"), false);

// Public results and snapshots are detached from persistent state.
ready.status = "tampered";
readySnapshot.profiles[profileKey].versions[versionKey].state.status = "tampered";
assert.equal(fixture.adapter.snapshot().profiles[profileKey].versions[versionKey].state.status, "ready");

// Retrying any previously accepted key returns its original logical result and no second audit.
fixture.setNow(T1);
const readyRetry = await fixture.runtime.transition(readyRequest, ADMIN);
assert.equal(readyRetry.idempotent, true);
assert.equal(readyRetry.status, "ready");
assert.equal(readyRetry.revision, 1);
assert.equal(readyRetry.updatedAt, T0);
assert.equal(Object.keys(fixture.adapter.snapshot().profiles[profileKey].versions[versionKey].audit).length, 1);
await assert.rejects(
  fixture.runtime.transition({ ...readyRequest, requestedTransition: "ARCHIVE" }, ADMIN),
  (error) => error instanceof RuleProfileLifecycleError && error.code === "rule-profile-idempotency-conflict"
);

const activeRequest = {
  ...requestBase,
  requestedTransition: "ACTIVATE",
  expectedRevision: 1,
  idempotencyKey: "fmch-active-2026-001"
};
const active = await fixture.runtime.transition(activeRequest, ADMIN);
assert.equal(active.previousStatus, "ready");
assert.equal(active.status, "active");
assert.equal(active.revision, 2);
assert.equal(fixture.adapter.snapshot().profiles[profileKey].versions[versionKey].state.activatedAt, T1);

// RTDB removes null-valued properties; a persisted READY record must still activate cleanly.
const rtdbReadyFixture = runtimeFixture();
await rtdbReadyFixture.runtime.transition(readyRequest, ADMIN);
const rtdbRoundTrip = rtdbReadyFixture.adapter.snapshot();
removeNullObjectProperties(rtdbRoundTrip);
const rtdbFixture = runtimeFixture(registry, T1, createMemoryRuleProfileLifecycleAdapter(rtdbRoundTrip));
const rtdbActive = await rtdbFixture.runtime.transition(activeRequest, ADMIN);
assert.equal(rtdbActive.status, "active");
assert.equal(rtdbActive.revision, 2);
assert.equal(rtdbActive.effectiveTo, null);

fixture.setNow(T2);
const retired = await fixture.runtime.transition({
  ...requestBase,
  requestedTransition: "RETIRE",
  expectedRevision: 2,
  idempotencyKey: "fmch-retire-2026-001",
  effectiveTo: "2099-01-01T00:00:00.000Z"
}, ADMIN);
assert.equal(retired.status, "retired");
assert.equal(retired.revision, 3);
assert.equal(retired.effectiveTo, T2, "retirement uses the authority clock, not the client date");
const retiredContainer = fixture.adapter.snapshot().profiles[profileKey].versions[versionKey];
assert.equal(retiredContainer.state.retiredAt, T2);
assert.equal(Object.keys(retiredContainer.audit).length, 3);
assert.equal(Object.keys(retiredContainer.requests).length, 3);
const lateReadyRetry = await fixture.runtime.transition(readyRequest, ADMIN);
assert.equal(lateReadyRetry.idempotent, true);
assert.equal(lateReadyRetry.status, "ready");
assert.equal(lateReadyRetry.revision, 1);
assert.equal(fixture.adapter.snapshot().profiles[profileKey].versions[versionKey].state.status, "retired");
assert.equal(Object.keys(fixture.adapter.snapshot().profiles[profileKey].versions[versionKey].audit).length, 3);

await assert.rejects(
  fixture.runtime.transition({
    ...requestBase,
    requestedTransition: "ACTIVATE",
    expectedRevision: 3,
    idempotencyKey: "fmch-reactivate-2026-001"
  }, ADMIN),
  (error) => error.code === "rule-profile-transition-invalid"
);

// Invalid jumps, stale CAS and arbitrary authority fields fail atomically.
const fresh = runtimeFixture();
await assert.rejects(
  fresh.runtime.transition({ ...readyRequest, requestedTransition: "ACTIVATE", idempotencyKey: "invalid-direct-active-001" }, ADMIN),
  (error) => error.code === "rule-profile-transition-invalid"
);
await assert.rejects(
  fresh.runtime.transition({ ...readyRequest, expectedRevision: 9, idempotencyKey: "invalid-revision-0001" }, ADMIN),
  (error) => error.code === "rule-profile-revision-conflict"
);
await assert.rejects(
  fresh.runtime.transition({ ...readyRequest, activatedAt: T0 }, ADMIN),
  (error) => error.code === "rule-profile-request-field-unsupported"
);
assert.deepEqual(fresh.adapter.snapshot(), { profiles: {} });

// Global certificates require an active platform authority; context cannot be spoofed.
assert.equal(authorizeRuleProfileLifecycleActor({ ...ADMIN, platformAdmin: false }, certificate).allowed, false);
assert.equal(authorizeRuleProfileLifecycleActor({ ...ADMIN, active: false }, certificate).allowed, false);
await assert.rejects(
  fresh.runtime.transition(readyRequest, { ...ADMIN, role: "juez", platformAdmin: false }),
  (error) => error.code === "rule-profile-role-denied"
);
await assert.rejects(
  fresh.runtime.transition({ ...readyRequest, tenantId: "tenant-a" }, ADMIN),
  (error) => error.code === "rule-profile-tenant-mismatch"
);
await assert.rejects(
  fresh.runtime.transition({ ...readyRequest, organizationId: "org-a" }, ADMIN),
  (error) => error.code === "rule-profile-organization-mismatch"
);

// Organization certificates enforce both tenant and organization isolation.
const orgCertificate = {
  ...structuredClone(certificate),
  profileId: "ORG_PROFILE",
  version: "1.0.0",
  scope: { type: "organization", tenantId: "tenant-a", organizationId: "org-a" }
};
const orgActor = { ...ADMIN, platformAdmin: false, tenantId: "tenant-a", organizationId: "org-a" };
assert.equal(authorizeRuleProfileLifecycleActor(orgActor, orgCertificate).allowed, true);
assert.equal(authorizeRuleProfileLifecycleActor({ ...orgActor, tenantId: "tenant-b" }, orgCertificate).allowed, false);
assert.equal(authorizeRuleProfileLifecycleActor({ ...orgActor, organizationId: "org-b" }, orgCertificate).allowed, false);

// Certification, P0, validity and registry presence gates fail closed.
for (const [mutation, expectedCode] of [
  [(item) => { item.certification.verdict = "FAIL"; }, "rule-profile-certification-failed"],
  [(item) => { item.certification.remainingP0 = 1; }, "rule-profile-certification-p0-blocked"],
  [(item) => { item.certification.activationReadyEligibility = false; }, "rule-profile-certification-not-eligible"],
  [(item) => { item.profileValid = false; }, "rule-profile-certificate-profile-invalid"]
]) {
  const blocked = structuredClone(certificate);
  mutation(blocked);
  assert.throws(
    () => applyRuleProfileLifecycleTransaction(null, readyRequest, ADMIN, blocked, { now: T0 }),
    (error) => error.code === expectedCode
  );
}
await assert.rejects(
  fresh.runtime.transition({ ...readyRequest, profileId: "MISSING_PROFILE" }, ADMIN),
  (error) => error.code === "rule-profile-version-not-found"
);

// A certificate change after persistence is a fingerprint mismatch, not a silent update.
const tamperedRegistry = structuredClone(registry);
tamperedRegistry.profiles["FMCH_2026_LIBRE@0.6.0"].contentFingerprint = "rptp_1111111111111111";
const changedAuthority = runtimeFixture(tamperedRegistry, T1, fixture.adapter);
await assert.rejects(
  changedAuthority.runtime.transition({
    ...requestBase,
    requestedTransition: "ARCHIVE",
    expectedRevision: 3,
    idempotencyKey: "fmch-archive-tampered-001"
  }, ADMIN),
  (error) => error.code === "rule-profile-fingerprint-mismatch"
);

// Two concurrent writes from the same revision produce exactly one winner.
const concurrent = runtimeFixture();
await concurrent.runtime.transition(readyRequest, ADMIN);
concurrent.setNow(T1);
const concurrentResults = await Promise.allSettled([
  concurrent.runtime.transition({ ...activeRequest, idempotencyKey: "concurrent-active-request-a" }, ADMIN),
  concurrent.runtime.transition({ ...activeRequest, idempotencyKey: "concurrent-active-request-b" }, ADMIN)
]);
assert.equal(concurrentResults.filter((item) => item.status === "fulfilled").length, 1);
assert.equal(concurrentResults.filter((item) => item.status === "rejected").length, 1);
assert.equal(concurrentResults.find((item) => item.status === "rejected").reason.code, "rule-profile-revision-conflict");

// Active ranges for versions of the same profile cannot overlap.
const multiRegistry = structuredClone(registry);
multiRegistry.profiles["FMCH_2026_LIBRE@0.7.0"] = {
  ...structuredClone(certificate),
  version: "0.7.0",
  contentFingerprint: "rptp_2222222222222222"
};
const multi = runtimeFixture(multiRegistry);
await multi.runtime.transition(readyRequest, ADMIN);
multi.setNow(T1);
await multi.runtime.transition(activeRequest, ADMIN);
multi.setNow(T2);
await multi.runtime.transition({
  ...requestBase,
  version: "0.7.0",
  requestedTransition: "MARK_READY",
  expectedRevision: 0,
  idempotencyKey: "fmch-070-ready-request",
  effectiveFrom: T2
}, ADMIN);
multi.setNow(T3);
await assert.rejects(
  multi.runtime.transition({
    ...requestBase,
    version: "0.7.0",
    requestedTransition: "ACTIVATE",
    expectedRevision: 1,
    idempotencyKey: "fmch-070-active-request"
  }, ADMIN),
  (error) => error.code === "rule-profile-temporal-overlap"
);

// Business effective dates require an explicit zone; lifecycle timestamps always come from the runtime.
assert.throws(
  () => prepareRuleProfileLifecycleRequest({ ...readyRequest, effectiveFrom: "2026-09-01T00:00:00" }, ADMIN, certificate),
  (error) => error.code === "rule-profile-effective-from-invalid"
);
assert.throws(
  () => prepareRuleProfileLifecycleRequest({ ...readyRequest, idempotencyKey: "short" }, ADMIN, certificate),
  (error) => error.code === "rule-profile-idempotency-key-invalid"
);

console.log("rule-profile-lifecycle-authority.test.mjs: ok");

function removeNullObjectProperties(value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(removeNullObjectProperties);
    return;
  }
  for (const key of Object.keys(value)) {
    if (value[key] === null) delete value[key];
    else removeNullObjectProperties(value[key]);
  }
}
