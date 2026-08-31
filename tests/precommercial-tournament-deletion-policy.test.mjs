import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import configurationEngine from "../functions/configurationEngine.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import releasePolicy from "../functions/releasePolicy.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";
import {
  applyReleaseClassificationToNewTournament,
  resolveClientReleaseStatus
} from "../js/core/releasePolicy.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

const baseline = JSON.parse(await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));
const precommercialResolved = {
  values: baseline.values,
  sources: [{ scope: "system", version: 1, checksum: baseline.checksum }]
};
const precommercial = releasePolicy.resolveGlobalReleaseAuthority(precommercialResolved);
assert.equal(precommercial.status, "precommercial");
assert.equal(resolveClientReleaseStatus(baseline), "precommercial");
assert.deepEqual(releasePolicy.resolveTournamentDataClassification({}, precommercial), {
  classification: "TEST",
  source: "precommercial-default"
});
assert.equal(releasePolicy.canHardDeleteTournament(precommercial, "TEST", true), true);

const newTestTournament = applyReleaseClassificationToNewTournament({ id: "test-a" }, baseline, {
  now: "2026-08-30T12:00:00.000Z"
});
assert.equal(newTestTournament.dataClassification, "TEST");
assert.equal(newTestTournament.releaseStatusAtCreation, "precommercial");

const platformAdmin = { uid: "platform-admin", role: "supervisor", active: true, platformAdmin: true };
const commercialRecord = configurationEngine.createConfigurationVersion({
  configurationId: baseline.configurationId,
  scope: { type: "system" },
  mode: "merge",
  values: { system: { releaseStatus: "commercial_approved" } }
}, platformAdmin, { previous: baseline, now: "2026-09-01T00:00:00.000Z" });
const commercial = releasePolicy.resolveGlobalReleaseAuthority({
  values: commercialRecord.values,
  sources: [{ scope: "system", version: commercialRecord.version, checksum: commercialRecord.checksum }]
});
assert.equal(commercial.status, "commercial_approved");
assert.equal(releasePolicy.canHardDeleteTournament(commercial, "OFFICIAL", true), false);
assert.equal(releasePolicy.canHardDeleteTournament(commercial, "OFFICIAL", false), true);
assert.equal(releasePolicy.resolveTournamentDataClassification({}, commercial).classification, "TEST");
assert.equal(releasePolicy.resolveTournamentDataClassification({ info: { dataClassification: "OFFICIAL" } }, commercial).classification, "OFFICIAL");

const newOfficialTournament = applyReleaseClassificationToNewTournament({ id: "official-a" }, {
  ...baseline,
  values: { ...baseline.values, system: { ...baseline.values.system, releaseStatus: "commercial_approved" } }
}, { now: "2026-09-01T00:00:01.000Z" });
assert.equal(newOfficialTournament.dataClassification, "OFFICIAL");

const organizationOverride = {
  ...baseline,
  globalReleaseAuthority: { status: "commercial_approved" },
  values: { ...baseline.values, system: { ...baseline.values.system, releaseStatus: "precommercial" } }
};
assert.equal(resolveClientReleaseStatus(organizationOverride), "commercial_approved", "client trusts the explicit global server authority");
const transition = configurationEngine.applyConfigurationMutation({
  headVersion: 1,
  versions: { "1": baseline },
  requests: {},
  audit: {}
}, {
  configurationId: baseline.configurationId,
  scope: { type: "system" },
  expectedVersion: 1,
  idempotencyKey: "release:commercial:approved:0001",
  mode: "merge",
  values: { system: { releaseStatus: "commercial_approved" } }
}, platformAdmin, { now: "2026-09-01T00:00:00.000Z" });
assert.equal(transition.outcome.ok, true);
assert.equal(transition.outcome.audit.operation, "configuration-published");
assert.equal(transition.outcome.audit.timestamp, "2026-09-01T00:00:00.000Z");
assert.throws(() => configurationEngine.createConfigurationVersion({
  configurationId: "organization-release-shadow",
  scope: { type: "organization", id: "org-a", organizationId: "org-a" },
  values: { system: { releaseStatus: "commercial_approved" } }
}, { uid: "supervisor", role: "supervisor", active: true, organizationId: "org-a" }, {
  now: "2026-09-01T00:00:01.000Z"
}), /configuration-release-status-scope-denied/);

assert.throws(() => configurationEngine.createConfigurationVersion({
  configurationId: baseline.configurationId,
  scope: { type: "system" },
  mode: "merge",
  values: { system: { releaseStatus: "precommercial" } }
}, platformAdmin, { previous: commercialRecord, now: "2026-09-01T00:00:02.000Z" }), /configuration-release-status-regression-denied/);

console.log("precommercial tournament deletion policy tests passed");
