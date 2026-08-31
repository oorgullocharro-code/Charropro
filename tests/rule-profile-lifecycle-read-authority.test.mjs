import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import engine from "../functions/ruleProfileLifecycleEngine.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import service from "../functions/ruleProfileLifecycleService.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

const {
  RuleProfileLifecycleError,
  buildRuleProfileProfileKey,
  buildRuleProfileVersionKey
} = engine;
const {
  createMemoryRuleProfileLifecycleAdapter,
  createRuleProfileLifecycleRuntime
} = service;

const registry = JSON.parse(await readFile(new URL(
  "../functions/ruleProfileCertificationRegistry.json",
  import.meta.url
), "utf8"));
const NOW = "2026-08-20T18:00:00.000Z";
const request = Object.freeze({
  profileId: "FMCH_2026_LIBRE",
  version: "0.6.0",
  tenantId: "",
  organizationId: ""
});
const admin = Object.freeze({
  uid: "platform-admin-read",
  name: "Platform Admin",
  role: "supervisor",
  tenantId: "",
  organizationId: "",
  platformAdmin: true,
  active: true
});

function fixture(adapter = createMemoryRuleProfileLifecycleAdapter()) {
  return {
    adapter,
    runtime: createRuleProfileLifecycleRuntime(adapter, { registry, now: () => NOW })
  };
}

const initial = fixture();
const snapshotBefore = initial.adapter.snapshot();
const initialRead = await initial.runtime.read(request, admin);
assert.equal(initialRead.ok, true);
assert.equal(initialRead.profileId, request.profileId);
assert.equal(initialRead.version, request.version);
assert.equal(initialRead.status, "draft");
assert.equal(initialRead.revision, 0);
assert.equal(initialRead.fingerprint, "rptp_0f90f7a3944a82d7");
assert.equal(initialRead.activationReady, false);
assert.deepEqual(initialRead.certification, {
  verdict: "PASS",
  remainingP0: 0,
  activationReadyEligibility: true
});
assert.equal(initialRead.effectiveFrom, null);
assert.equal(initialRead.effectiveTo, null);
assert.equal(initialRead.readAt, NOW);
assert.deepEqual(initial.adapter.snapshot(), snapshotBefore, "initial reads never materialize lifecycle state");
assert.deepEqual(Object.keys(initialRead).sort(), [
  "activationReady",
  "certification",
  "effectiveFrom",
  "effectiveTo",
  "fingerprint",
  "lifecycleServiceVersion",
  "ok",
  "profileId",
  "readAt",
  "revision",
  "status",
  "version"
].sort());
assert.equal(JSON.stringify(initialRead).includes("platform-admin-read"), false);
assert.equal(JSON.stringify(initialRead).includes("audit"), false);
assert.equal(JSON.stringify(initialRead).includes("request"), false);

initialRead.certification.verdict = "tampered";
assert.equal((await initial.runtime.read(request, admin)).certification.verdict, "PASS");
assert.deepEqual(initial.adapter.snapshot(), snapshotBefore);

for (const [actor, code] of [
  [{ ...admin, uid: "" }, "rule-profile-auth-required"],
  [{ ...admin, active: false }, "rule-profile-user-inactive"],
  [{ ...admin, platformAdmin: false }, "rule-profile-platform-admin-required"],
  [{ ...admin, role: "juez", platformAdmin: false }, "rule-profile-role-denied"]
]) {
  await assert.rejects(
    initial.runtime.read(request, actor),
    (error) => error instanceof RuleProfileLifecycleError && error.code === code
  );
}

await assert.rejects(
  initial.runtime.read({ ...request, profileId: "MISSING_PROFILE" }, admin),
  (error) => error.code === "rule-profile-version-not-found"
);
await assert.rejects(
  initial.runtime.read({ ...request, version: "" }, admin),
  (error) => error.code === "rule-profile-version-invalid"
);
await assert.rejects(
  initial.runtime.read({ ...request, expectedRevision: 0 }, admin),
  (error) => error.code === "rule-profile-read-field-unsupported"
);
await assert.rejects(
  initial.runtime.read({ ...request, tenantId: "tenant-spoofed" }, admin),
  (error) => error.code === "rule-profile-tenant-mismatch"
);

const persisted = fixture();
await persisted.runtime.transition({
  ...request,
  requestedTransition: "MARK_READY",
  expectedRevision: 0,
  idempotencyKey: "read-authority-ready-001",
  effectiveFrom: "2026-09-01T00:00:00.000Z"
}, admin);
const persistedBeforeRead = persisted.adapter.snapshot();
const persistedRead = await persisted.runtime.read(request, admin);
assert.equal(persistedRead.status, "ready");
assert.equal(persistedRead.revision, 1);
assert.equal(persistedRead.activationReady, true);
assert.equal(persistedRead.effectiveFrom, "2026-09-01T00:00:00.000Z");
assert.deepEqual(persisted.adapter.snapshot(), persistedBeforeRead, "persisted reads create no audit or request record");

const profileKey = buildRuleProfileProfileKey(request.profileId);
const versionKey = buildRuleProfileVersionKey(request.version);
const tamperedSeed = structuredClone(persistedBeforeRead);
tamperedSeed.profiles[profileKey].versions[versionKey].state.contentFingerprint = "rptp_1111111111111111";
const tampered = fixture(createMemoryRuleProfileLifecycleAdapter(tamperedSeed));
await assert.rejects(
  tampered.runtime.read(request, admin),
  (error) => error.code === "rule-profile-fingerprint-mismatch"
);

console.log("rule-profile-lifecycle-read-authority.test.mjs: ok");
