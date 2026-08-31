import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { FMCH_2026_LIBRE_PROFILE_0_6_1 } from "../js/data/ruleProfiles.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

const require = createRequire(import.meta.url);
const { createMemoryRuleProfileLifecycleAdapter, createRuleProfileLifecycleRuntime } = require("../functions/ruleProfileLifecycleService.js");
const { buildRuleProfileProfileKey, buildRuleProfileVersionKey } = require("../functions/ruleProfileLifecycleEngine.js");
const registry = JSON.parse(await readFile(new URL("../functions/ruleProfileCertificationRegistry.json", import.meta.url), "utf8"));
const fingerprint = buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE_0_6_1);

assert.equal(fingerprint, "rptp_10e596046446e850");
assert.notEqual(fingerprint, "rptp_0f90f7a3944a82d7");
assert.equal(registry.profiles["FMCH_2026_LIBRE@0.6.1"].contentFingerprint, fingerprint);
assert.equal(registry.profiles["FMCH_2026_LIBRE@0.6.1"].catalogRuleCount, 734);

const adapter = createMemoryRuleProfileLifecycleAdapter();
const runtime = createRuleProfileLifecycleRuntime(adapter, {
  registry,
  now: () => "2026-08-26T12:00:00.000Z"
});
const actor = {
  uid: "local-platform-admin",
  role: "supervisor",
  platformAdmin: true,
  active: true,
  tenantId: "",
  organizationId: ""
};
const request = {
  profileId: "FMCH_2026_LIBRE",
  version: "0.6.1",
  requestedTransition: "MARK_READY",
  expectedRevision: 0,
  idempotencyKey: "fmch-061-brake-ready-local-001",
  effectiveFrom: "2026-09-01T00:00:00.000Z",
  reason: "Local certification gate",
  tenantId: "",
  organizationId: ""
};
const ready = await runtime.transition(request, actor);
const retry = await runtime.transition(request, actor);
assert.equal(ready.status, "ready");
assert.equal(ready.revision, 1);
assert.equal(ready.fingerprint, fingerprint);
assert.equal(retry.idempotent, true);
assert.equal(retry.revision, 1);
const profileKey = buildRuleProfileProfileKey("FMCH_2026_LIBRE");
const versionKey = buildRuleProfileVersionKey("0.6.1");
assert.equal(Object.keys(adapter.snapshot().profiles[profileKey].versions[versionKey].audit).length, 1);

console.log("fmch-2026-0.6.1-fingerprint.test.mjs: ok");
