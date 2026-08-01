import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEFAULT_EMULATOR_PORTS,
  DEFAULT_LOCAL_PROJECT_ID,
  DEVELOPMENT_INFRASTRUCTURE_VERSION,
  buildEmulatorSmokePlan,
  buildEmulatorStartPlan,
  buildEnvironmentDescriptor,
  buildToolingReport,
  parseEnvironmentText,
  safeClone,
  validateEnvironmentDescriptor,
  validateFirebaseEmulatorConfiguration
} from "../tools/development/environmentFoundation.mjs";

const firebaseConfiguration = JSON.parse(readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
const firebaseAliases = JSON.parse(readFileSync(new URL("../.firebaserc", import.meta.url), "utf8"));
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

assert.equal(DEVELOPMENT_INFRASTRUCTURE_VERSION, "1.0.0");
assert.deepEqual(parseEnvironmentText("CHARROPRO_ENV=local\nFIREBASE_PROJECT_ID=demo-charropro-local\n"), {
  values: { CHARROPRO_ENV: "local", FIREBASE_PROJECT_ID: DEFAULT_LOCAL_PROJECT_ID },
  errors: []
});
assert.deepEqual(parseEnvironmentText("bad key=value\n"), {
  values: {},
  errors: ["invalid-environment-key:1"]
});

const localEnvironment = buildEnvironmentDescriptor({
  CHARROPRO_ENV: "local",
  FIREBASE_PROJECT_ID: DEFAULT_LOCAL_PROJECT_ID
});
assert.equal(localEnvironment.environment, "local");
assert.equal(localEnvironment.useEmulators, true);
assert.equal(localEnvironment.emulatorHosts.database, `127.0.0.1:${DEFAULT_EMULATOR_PORTS.database}`);
assert.equal(validateEnvironmentDescriptor(localEnvironment).valid, true);

const unsafeLocalEnvironment = buildEnvironmentDescriptor({
  CHARROPRO_ENV: "local",
  FIREBASE_PROJECT_ID: "charropro-e8a68"
});
assert.equal(validateEnvironmentDescriptor(unsafeLocalEnvironment).valid, false);
assert.ok(validateEnvironmentDescriptor(unsafeLocalEnvironment).errors.includes("local-project-id-must-be-isolated"));

const stagingEnvironment = buildEnvironmentDescriptor({
  CHARROPRO_ENV: "staging",
  FIREBASE_PROJECT_ID: "charropro-stg-example",
  FIREBASE_DATABASE_URL: "https://charropro-stg-example-default-rtdb.firebaseio.com",
  FIREBASE_STORAGE_BUCKET: "charropro-stg-example.appspot.com"
});
assert.equal(validateEnvironmentDescriptor(stagingEnvironment).valid, true);
assert.equal(stagingEnvironment.useEmulators, false);

const emulatorValidation = validateFirebaseEmulatorConfiguration(firebaseConfiguration);
assert.equal(emulatorValidation.valid, true);
assert.deepEqual(Object.keys(firebaseConfiguration.emulators).filter((key) => ["auth", "database", "functions", "storage"].includes(key)).sort(), ["auth", "database", "functions", "storage"]);
assert.equal(firebaseConfiguration.storage.rules, "storage.rules");
assert.equal(firebaseAliases.projects.default, undefined);
assert.equal(firebaseAliases.projects.production, "charropro-e8a68");

const startPlan = buildEmulatorStartPlan(localEnvironment);
assert.equal(startPlan.projectId, DEFAULT_LOCAL_PROJECT_ID);
assert.deepEqual(startPlan.args.slice(0, 6), ["emulators:start", "--only", "auth,database,functions,storage", "--project", DEFAULT_LOCAL_PROJECT_ID, "--import"]);
const smokePlan = buildEmulatorSmokePlan(localEnvironment);
assert.equal(smokePlan.script, "tools/development/emulatorSmokeTest.mjs");

const source = {
  zero: 0,
  disabled: false,
  empty: "",
  nested: { retained: true },
  functionValue: () => "not serializable"
};
Object.defineProperty(source, "__proto__", { value: { polluted: true }, enumerable: true });
source.circular = source;
const cloned = safeClone(source);
assert.deepEqual(cloned, { zero: 0, disabled: false, empty: "", nested: { retained: true } });
cloned.nested.retained = false;
assert.equal(source.nested.retained, true);

const toolingReport = buildToolingReport({
  nodeVersion: "v20.20.2",
  npmVersion: "10.8.2",
  firebaseVersion: "15.20.0",
  javaVersion: "openjdk version 21.0.12",
  gitVersion: "git version 2.50.1"
});
assert.equal(toolingReport.warnings.includes("node-20-lts-required-for-functions-baseline"), false);
assert.ok(toolingReport.warnings.includes("gcloud-required-before-staging-iam-validation"));

for (const ignoredPath of [".env", ".env.*", ".firebase/", ".local/"]) {
  assert.ok(gitignore.includes(ignoredPath), `${ignoredPath} must be ignored`);
}

process.stdout.write("Development infrastructure foundation tests passed.\n");
