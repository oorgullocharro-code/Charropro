import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import configurationEngine from "../functions/configurationEngine.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import configurationService from "../functions/configurationService.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "../js/core/configurationBootstrap.js";

const {
  CONFIGURATION_ENGINE_VERSION,
  CONFIGURATION_HIERARCHY,
  ConfigurationEngineError,
  authorizeConfigurationOperation,
  buildConfigurationScopeKey,
  createConfigurationVersion,
  fingerprintConfiguration,
  normalizeConfigurationRecord,
  resolveConfigurationHierarchy,
  safeClone,
  validateConfigurationRecord,
  validateRuntimeConfigurationBaseline
} = configurationEngine;
const {
  CONFIGURATION_SERVICE_VERSION,
  createFirebaseConfigurationAdapter,
  createConfigurationRuntime,
  createMemoryConfigurationAdapter
} = configurationService;

const defaultsRaw = await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8");
const defaults = JSON.parse(defaultsRaw);
const baseline = normalizeConfigurationRecord(defaults);

assert.equal(CONFIGURATION_ENGINE_VERSION, "1.0.0");
assert.equal(CONFIGURATION_SERVICE_VERSION, "1.0.0");
assert.deepEqual(CONFIGURATION_HIERARCHY, ["system", "organization", "tournament", "user", "session"]);
assert.equal(validateConfigurationRecord(defaults).valid, true, "the canonical baseline loads and verifies its checksum");
assert.equal(baseline.checksum, defaults.checksum);
assert.equal(fingerprintConfiguration({ b: 2, a: 1 }), fingerprintConfiguration({ a: 1, b: 2 }));

const browserBaseline = await loadConfigurationBootstrap({ source: defaults });
assert.equal(browserBaseline.checksum, defaults.checksum);
assert.equal(getBootstrapConfigurationValue(browserBaseline, "firebase.paths.tournaments"), "charropro/tournaments");
assert.equal(Object.isFrozen(browserBaseline), true);
assert.equal(Object.isFrozen(browserBaseline.values.firebase.client), true);

const corrupt = structuredClone(defaults);
corrupt.values.firebase.functionsRegion = "another-region";
assert.equal(validateConfigurationRecord(corrupt).valid, false);
assert.throws(() => normalizeConfigurationRecord(corrupt), /configuration-checksum-mismatch/);
await assert.rejects(
  loadConfigurationBootstrap({ source: corrupt }),
  /configuration-bootstrap-checksum-mismatch/
);
const semanticallyCorrupt = structuredClone(defaults);
semanticallyCorrupt.values.application.timeouts.workerSeconds = "540";
const semanticChecksum = normalizeConfigurationRecord(semanticallyCorrupt, { verifyChecksum: false }).checksum;
semanticallyCorrupt.checksum = semanticChecksum;
semanticallyCorrupt.fingerprint = semanticChecksum;
assert.equal(validateConfigurationRecord(semanticallyCorrupt).valid, true, "the generic envelope remains valid");
assert.equal(validateRuntimeConfigurationBaseline(semanticallyCorrupt).valid, false, "the runtime schema rejects wrong types");
await assert.rejects(
  loadConfigurationBootstrap({ source: semanticallyCorrupt }),
  /configuration-bootstrap-timeout-invalid/
);

const preservedDefinition = createConfigurationVersion({
  configurationId: "preserved-values",
  scope: { type: "organization", id: "org-a", organizationId: "org-a" },
  values: { zero: 0, disabled: false, empty: "", nullable: null }
}, supervisor("org-a"), { now: "2026-08-01T10:00:00.000Z" });
assert.deepEqual(preservedDefinition.values, { zero: 0, disabled: false, empty: "", nullable: null });

for (const unsafeValues of [
  [],
  { password: "do-not-store" },
  { nested: { privateKey: "do-not-store" } },
  { token: () => "not-serializable" },
  { number: Number.POSITIVE_INFINITY },
  { big: 1n }
]) {
  assert.throws(() => createConfigurationVersion({
    configurationId: "unsafe",
    scope: { type: "organization", id: "org-a", organizationId: "org-a" },
    values: unsafeValues
  }, supervisor("org-a"), { now: "2026-08-01T10:00:00.000Z" }), ConfigurationEngineError);
}
const cyclic = {};
cyclic.self = cyclic;
assert.throws(() => safeClone(cyclic), /configuration-cycle-detected/);
const dangerous = Object.create(null);
Object.defineProperty(dangerous, "__proto__", { value: { polluted: true }, enumerable: true });
assert.throws(() => safeClone(dangerous), /configuration-dangerous-key/);
assert.equal({}.polluted, undefined);

const organizationA = createConfigurationVersion({
  configurationId: baseline.configurationId,
  scope: { type: "organization", id: "org-a", organizationId: "org-a" },
  values: { organization: { name: "Organizacion A" }, application: { retry: { attempts: 3 } } }
}, supervisor("org-a"), { now: "2026-08-01T10:01:00.000Z" });
const tournamentA = createConfigurationVersion({
  configurationId: baseline.configurationId,
  scope: {
    type: "tournament",
    id: "tournament-a",
    organizationId: "org-a",
    tournamentId: "tournament-a"
  },
  values: { application: { retry: { attempts: 5 }, timeoutMs: 0 } }
}, supervisor("org-a"), { now: "2026-08-01T10:02:00.000Z" });
const userA = createConfigurationVersion({
  configurationId: baseline.configurationId,
  scope: {
    type: "user",
    id: "user-a",
    organizationId: "org-a",
    tournamentId: "tournament-a",
    userId: "user-a"
  },
  values: { application: { retry: { enabled: false } } }
}, supervisor("org-a"), { now: "2026-08-01T10:03:00.000Z" });
const sessionA = createConfigurationVersion({
  configurationId: baseline.configurationId,
  scope: {
    type: "session",
    id: "session-a",
    organizationId: "org-a",
    tournamentId: "tournament-a",
    sessionId: "session-a"
  },
  values: { application: { retry: { label: "session" } } }
}, supervisor("org-a"), { now: "2026-08-01T10:04:00.000Z" });
const resolved = resolveConfigurationHierarchy(
  [baseline, organizationA, tournamentA, userA, sessionA],
  {
    organizationId: "org-a",
    tournamentId: "tournament-a",
    userId: "user-a",
    sessionId: "session-a"
  },
  { configurationId: baseline.configurationId, now: "2026-08-01T10:05:00.000Z" }
);
assert.equal(resolved.values.organization.name, "Organizacion A");
assert.equal(resolved.values.application.retry.attempts, 5);
assert.equal(resolved.values.application.retry.enabled, false);
assert.equal(resolved.values.application.retry.label, "session");
assert.equal(resolved.values.application.timeoutMs, 0);
assert.deepEqual(resolved.sources.map((source) => source.scope), CONFIGURATION_HIERARCHY);

assert.throws(
  () => resolveConfigurationHierarchy([baseline, baseline], {}, { configurationId: baseline.configurationId }),
  /configuration-duplicate-version/
);
const invalidChain = structuredClone(systemPublishedRecord(baseline));
invalidChain.previousChecksum = "a".repeat(64);
const invalidChainChecksum = normalizeConfigurationRecord(invalidChain, { verifyChecksum: false }).checksum;
invalidChain.checksum = invalidChainChecksum;
invalidChain.fingerprint = invalidChainChecksum;
assert.throws(
  () => resolveConfigurationHierarchy([baseline, invalidChain], {}, { configurationId: baseline.configurationId }),
  /configuration-history-chain-invalid/
);
const notFound = resolveConfigurationHierarchy([], {}, { configurationId: "does-not-exist" });
assert.equal(notFound.status, "not-found");
assert.throws(
  () => resolveConfigurationHierarchy([], {}, { configurationId: "does-not-exist", required: true }),
  /configuration-not-found/
);

assert.equal(authorizeConfigurationOperation("write", supervisor("org-a"), { scope: organizationScope("org-a") }).allowed, true);
assert.equal(authorizeConfigurationOperation("write", supervisor("org-a"), { scope: organizationScope("org-b") }).allowed, false);
assert.equal(authorizeConfigurationOperation("write", supervisor("org-a"), {
  scope: { ...organizationScope("org-a"), tenantId: "tenant-a" }
}).allowed, false, "missing tenant identity never falls through");
assert.equal(authorizeConfigurationOperation("write", supervisor("org-a"), { scope: { type: "system" } }).allowed, false);
assert.equal(authorizeConfigurationOperation("write", platformAdmin(), { scope: { type: "system" } }).allowed, true);
assert.equal(authorizeConfigurationOperation("read", { ...supervisor("org-a"), role: "lectura" }, { scope: organizationScope("org-a") }).allowed, true);
assert.equal(authorizeConfigurationOperation("read", { ...supervisor("org-a"), role: "lectura" }, { scope: organizationScope("org-a") }, { critical: true }).allowed, false);
assert.equal(authorizeConfigurationOperation("read", {
  ...supervisor("org-a"), uid: "user-a", role: "lectura"
}, {
  scope: { type: "user", id: "user-b", userId: "user-b", organizationId: "org-a" }
}).allowed, false);
assert.throws(() => createConfigurationVersion({
  configurationId: "scope-conflict",
  scope: { type: "tournament", id: "tournament-a", tournamentId: "tournament-b", organizationId: "org-a" },
  values: {}
}, supervisor("org-a"), { now: "2026-08-01T10:06:00.000Z" }), /configuration-scope-identity-conflict/);

const adapter = createMemoryConfigurationAdapter();
const runtime = createConfigurationRuntime(adapter, { baseline });
const systemRead = await runtime.readConfiguration({}, { ...supervisor(""), role: "lectura" });
assert.equal(systemRead.values.firebase.client.projectId, "charropro-e8a68", "system fallback uses the verified baseline");
const unknown = await runtime.readConfiguration({ configurationId: "missing" }, supervisor(""));
assert.equal(unknown.status, "not-found");

const systemAdapter = createMemoryConfigurationAdapter();
const systemRuntime = createConfigurationRuntime(systemAdapter, {
  baseline,
  now: () => "2026-08-01T10:30:00.000Z"
});
const systemPublished = await systemRuntime.publishConfiguration({
  configurationId: baseline.configurationId,
  scope: { type: "system" },
  expectedVersion: 1,
  idempotencyKey: "configuration:system:0001",
  mode: "merge",
  values: { application: { retry: { systemAttempts: 4 } } },
  now: "1999-01-01T00:00:00.000Z"
}, platformAdmin());
assert.equal(systemPublished.version, 2);
assert.equal(systemPublished.record.parentVersion, 1);
assert.equal(systemPublished.record.previousChecksum, baseline.checksum);
assert.notEqual(systemPublished.record.checksum, baseline.checksum);
assert.equal(systemPublished.record.updatedAt, "2026-08-01T10:30:00.000Z", "the server clock overrides request time");
const resolvedSystemV2 = await systemRuntime.readConfiguration({}, { ...supervisor(""), role: "lectura" });
assert.equal(resolvedSystemV2.values.application.retry.systemAttempts, 4);
assert.equal(resolvedSystemV2.sources.length, 1, "persisted baseline is not duplicated during resolution");
assert.equal(resolvedSystemV2.sources[0].version, 2);

const publishRequest = {
  configurationId: baseline.configurationId,
  scope: organizationScope("org-a"),
  expectedVersion: 0,
  idempotencyKey: "configuration:org-a:0001",
  values: {
    organization: { name: "Org A" },
    application: { limits: { concurrentReaders: 100 }, flags: { enabled: false }, empty: "", nullable: null }
  },
  now: "2026-08-01T11:00:00.000Z"
};
const published = await runtime.publishConfiguration(publishRequest, supervisor("org-a"));
assert.equal(published.ok, true);
assert.equal(published.version, 1);
assert.equal(published.record.author.uid, "supervisor-org-a");
const retried = await runtime.publishConfiguration(publishRequest, supervisor("org-a"));
assert.equal(retried.idempotent, true);
assert.equal(retried.version, 1);
await assert.rejects(
  runtime.publishConfiguration({ ...publishRequest, values: { organization: { name: "Different" } } }, supervisor("org-a")),
  /configuration-idempotency-conflict/
);

const orgRead = await runtime.readConfiguration({ organizationId: "org-a" }, supervisor("org-a"));
assert.equal(orgRead.values.organization.name, "Org A");
assert.equal(orgRead.values.application.flags.enabled, false);
assert.equal(orgRead.values.application.empty, "");
assert.equal(orgRead.values.application.nullable, null);
const orgBRead = await runtime.readConfiguration({ organizationId: "org-b" }, supervisor("org-b"));
assert.equal(orgBRead.values.organization.name, "", "organization overrides never cross organizations");

const concurrentReads = await Promise.all(Array.from({ length: 50 }, () => (
  runtime.readConfiguration({ organizationId: "org-a" }, supervisor("org-a"))
)));
assert.equal(new Set(concurrentReads.map((item) => item.checksum)).size, 1, "concurrent reads are deterministic");

const competing = [1, 2, 3, 4, 5].map((index) => runtime.publishConfiguration({
  configurationId: baseline.configurationId,
  scope: organizationScope("org-a"),
  expectedVersion: 1,
  idempotencyKey: `configuration:org-a:race:${index}`,
  values: { organization: { name: `Org A v${index}` } },
  now: `2026-08-01T11:0${index}:00.000Z`
}, supervisor("org-a")));
const competingResults = await Promise.allSettled(competing);
assert.equal(competingResults.filter((result) => result.status === "fulfilled").length, 1, "CAS accepts one writer");
assert.equal(competingResults.filter((result) => result.status === "rejected").length, 4);
const stateAfterRace = adapter.snapshot();
const orgState = stateAfterRace.records[buildConfigurationScopeKey(organizationScope("org-a"))][baseline.configurationId];
assert.equal(orgState.headVersion, 2);
assert.equal(Object.keys(orgState.versions).length, 2);

const firebaseHarness = createFakeFirebaseAdmin();
const firebaseRuntime = createConfigurationRuntime(createFirebaseConfigurationAdapter(firebaseHarness.admin, {
  rootPath: "charropro/configurationManagement"
}), { baseline });
await firebaseRuntime.publishConfiguration({
  configurationId: baseline.configurationId,
  scope: organizationScope("org-firebase"),
  expectedVersion: 0,
  idempotencyKey: "configuration:firebase:0001",
  values: { organization: { name: "Firebase Adapter" } },
  now: "2026-08-01T12:00:00.000Z"
}, supervisor("org-firebase"));
const firebaseResolved = await firebaseRuntime.readConfiguration({ organizationId: "org-firebase" }, supervisor("org-firebase"));
assert.equal(firebaseResolved.values.organization.name, "Firebase Adapter");
assert.equal(firebaseHarness.transactionCount, 1);
assert.equal(firebaseHarness.paths.some((path) => path.startsWith("charropro/configurationManagement/records/")), true);

await runtime.readConfiguration({ organizationId: "org-a", critical: true }, supervisor("org-a"));
assert.equal(Object.values(adapter.snapshot().audit).some((event) => event.operation === "configuration-critical-read"), true);
await assert.rejects(
  runtime.readConfiguration({ organizationId: "org-a", critical: true }, { ...supervisor("org-a"), role: "operador" }),
  /configuration-critical-read-denied/
);

const initialDefinition = { values: { nested: { count: 1 } } };
const clonedDefinition = safeClone(initialDefinition);
clonedDefinition.values.nested.count = 99;
assert.equal(initialDefinition.values.nested.count, 1, "configuration cloning does not mutate sources");
const snapshotCopy = adapter.snapshot();
snapshotCopy.records[buildConfigurationScopeKey(organizationScope("org-a"))][baseline.configurationId].headVersion = 999;
assert.equal(adapter.snapshot().records[buildConfigurationScopeKey(organizationScope("org-a"))][baseline.configurationId].headVersion, 2);

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8"));
assert.deepEqual(rules.rules.charropro.configurationManagement, { ".read": false, ".write": false });
const firebaseSyncSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const functionsSource = await readFile(new URL("../functions/index.js", import.meta.url), "utf8");
const versionSource = await readFile(new URL("../js/core/version.js", import.meta.url), "utf8");
assert.doesNotMatch(firebaseSyncSource, /const FIREBASE_CONFIG = \{[\s\S]*?apiKey:/);
assert.doesNotMatch(firebaseSyncSource, /const (?:LIVE_ROOT_PATH|TOURNAMENTS_PATH|USERS_PATH) = "charropro\//);
assert.match(firebaseSyncSource, /loadConfigurationBootstrap/);
assert.match(firebaseSyncSource, /export async function readFirebaseConfiguration/);
assert.match(firebaseSyncSource, /export async function publishFirebaseConfiguration/);
assert.match(versionSource, /getBootstrapConfigurationValue/);
assert.doesNotMatch(versionSource, /CHARROPRO_APP_VERSION\s*=\s*"/);
assert.match(functionsSource, /createConfigurationRuntime/);
assert.match(functionsSource, /getCharroProConfiguration/);
assert.match(functionsSource, /publishCharroProConfiguration/);

console.log("configuration-management.test.mjs: ok");

function organizationScope(organizationId) {
  return { type: "organization", id: organizationId, organizationId };
}

function supervisor(organizationId) {
  return {
    uid: `supervisor-${organizationId || "system"}`,
    name: "Supervisor",
    role: "supervisor",
    organizationId,
    tenantId: "",
    active: true,
    platformAdmin: false
  };
}

function platformAdmin() {
  return {
    uid: "platform-admin",
    name: "Platform Admin",
    role: "supervisor",
    organizationId: "",
    tenantId: "",
    active: true,
    platformAdmin: true
  };
}

function systemPublishedRecord(previous) {
  return createConfigurationVersion({
    configurationId: previous.configurationId,
    scope: { type: "system" },
    mode: "merge",
    values: { application: { retry: { chainTest: true } } }
  }, platformAdmin(), {
    previous,
    now: "2026-08-01T10:07:00.000Z"
  });
}

function createFakeFirebaseAdmin() {
  let root = {};
  const paths = [];
  let transactionCount = 0;
  const admin = {
    database() {
      return {
        ref(path) {
          const normalized = String(path || "").replace(/^\/+|\/+$/g, "");
          paths.push(normalized);
          return {
            async get() {
              const value = readPath(root, normalized);
              return { val: () => structuredClone(value ?? null) };
            },
            async set(value) {
              writePath(root, normalized, structuredClone(value));
            },
            async transaction(updater) {
              transactionCount += 1;
              const current = structuredClone(readPath(root, normalized) ?? null);
              const next = updater(current);
              if (next === undefined) {
                return { committed: false, snapshot: { val: () => current } };
              }
              writePath(root, normalized, structuredClone(next));
              return { committed: true, snapshot: { val: () => structuredClone(next) } };
            }
          };
        }
      };
    }
  };
  return {
    admin,
    paths,
    get transactionCount() { return transactionCount; }
  };
}

function readPath(root, path) {
  return path.split("/").filter(Boolean).reduce((cursor, segment) => cursor?.[segment], root);
}

function writePath(root, path, value) {
  const segments = path.split("/").filter(Boolean);
  let cursor = root;
  for (const segment of segments.slice(0, -1)) cursor = cursor[segment] ||= {};
  cursor[segments.at(-1)] = value;
}
