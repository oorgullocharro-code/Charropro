import assert from "node:assert/strict";
import {
  LOCAL_FIXTURE_PASSWORD,
  LOCAL_RUNTIME_CHARREADA_ID,
  LOCAL_RUNTIME_TOURNAMENT_ID,
  LOCAL_SYNTHETIC_USERS,
  assertLocalRuntimeSeedEnvironment,
  buildLocalRuntimeSeedPlan,
  buildLocalRuntimeFirebaseWriteFixture,
  createLocalRuntimeSeedFixture
} from "../tools/development/localRuntimeSeed.mjs";

const fixture = createLocalRuntimeSeedFixture();
assert.equal(fixture.marker, "DEMO / LOCAL / NO OFICIAL");
assert.equal(fixture.tournamentId, LOCAL_RUNTIME_TOURNAMENT_ID);
assert.equal(fixture.charreadaId, LOCAL_RUNTIME_CHARREADA_ID);
assert.equal(LOCAL_SYNTHETIC_USERS.length, 7);
assert.equal(new Set(LOCAL_SYNTHETIC_USERS.map((user) => user.email)).size, 7);
assert.equal(LOCAL_SYNTHETIC_USERS.every((user) => user.email.endsWith("@example.test")), true);
assert.equal(LOCAL_FIXTURE_PASSWORD.startsWith("LocalOnly-"), true);
assert.equal(JSON.stringify(fixture).includes("charropro-e8a68"), false);

const tournament = fixture.database["charropro/tournaments"][LOCAL_RUNTIME_TOURNAMENT_ID];
assert.equal(tournament.info.demo, true);
assert.equal(tournament.info.ruleProfileId, "FMCH_2026_LIBRE");
assert.equal(tournament.info.ruleProfileVersion, "0.6.1");
assert.equal(tournament.info.ruleProfileContentFingerprint, "rptp_10e596046446e850");
assert.equal(tournament.info.effectiveRulesFingerprint, "rptp_10e596046446e850");
assert.equal(tournament.info.ruleProfile.status, "active");
assert.equal(tournament.info.ruleProfile.metadata.fixtureOnly, true);
assert.equal(tournament.info.ruleProfile.metadata.activationReady, false);
assert.equal(tournament.teams.length, 3);
assert.deepEqual(tournament.charreadas[0].suerteIds, ["cala", "piales", "colas", "toro", "terna", "yegua", "manganas_pie", "manganas_caballo", "paso"]);
assert.equal(tournament.meta.activeCharreadaId, LOCAL_RUNTIME_CHARREADA_ID);
assert.equal(fixture.database["charropro/users"]["local-juez"].tournamentAccess, "all");
assert.equal(Object.isFrozen(fixture), true);
assert.throws(() => { fixture.marker = "changed"; }, TypeError);

const firebaseWriteFixture = buildLocalRuntimeFirebaseWriteFixture();
assert.equal(Object.values(firebaseWriteFixture).some(hasForbiddenFirebaseKey), false, "every RTDB key written by the seed must be Firebase-safe");
assert.equal(firebaseWriteFixture["charropro/tournaments"][LOCAL_RUNTIME_TOURNAMENT_ID].info.ruleProfile.version, "0.6.1", "the local fixture persists its isolated active profile copy");
assert.equal(firebaseWriteFixture["charropro/tournaments"][LOCAL_RUNTIME_TOURNAMENT_ID].info.ruleProfile.suerteMetadata.cala.fieldIdMappings, undefined, "the persisted tournament omits FieldID maps that belong to the catalog");
assert.equal(firebaseWriteFixture["charropro/tournamentIndex"][LOCAL_RUNTIME_TOURNAMENT_ID].ruleProfile, undefined, "the persisted tournament index uses the canonical profile reference, not an embedded catalog");
assert.equal(tournament.info.ruleProfile.suerteMetadata.cala.fieldIdMappings["FMCH.TEAM_SHEET.CALA.MD"].ruleId, "cala_medio_derecho", "the FieldID remains canonical in the source catalog");

const plan = buildLocalRuntimeSeedPlan({ reset: true });
assert.equal(plan.command, "reset");
assert.equal(plan.projectId, "demo-charropro-local");
assert.deepEqual(assertLocalRuntimeSeedEnvironment({}), {
  projectId: "demo-charropro-local",
  authHost: "127.0.0.1:9099",
  databaseHost: "127.0.0.1:9000",
  functionsHost: "127.0.0.1:5001",
  storageHost: "127.0.0.1:9199"
});
assert.throws(() => assertLocalRuntimeSeedEnvironment({ FIREBASE_PROJECT_ID: "charropro-e8a68" }), /production-project-blocked/);
assert.throws(() => assertLocalRuntimeSeedEnvironment({ FIREBASE_AUTH_EMULATOR_HOST: "production.example:9099" }), /emulator-host-invalid:auth/);

process.stdout.write("local runtime seed tests passed\n");

function hasForbiddenFirebaseKey(value) {
  if (Array.isArray(value)) return value.some(hasForbiddenFirebaseKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => /[.#$\[\]/]/.test(key) || hasForbiddenFirebaseKey(child));
}
