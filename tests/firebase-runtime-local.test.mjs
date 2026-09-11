import assert from "node:assert/strict";
import {
  FirebaseRuntimeError,
  LOCAL_FIREBASE_PROJECT_ID,
  assertLocalFirebaseRuntime,
  buildFirebaseEmulatorConnectionPlan,
  createLocalFirebaseRuntime,
  getFirebaseRuntimePublicDiagnostics,
  isPrivateLanIpv4Host,
  isLocalFirebaseRuntimeLocation,
  resolveFirebaseRuntime,
  resolveFirebaseRuntimeEnvironment
} from "../js/core/firebaseRuntime.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";

const bootstrap = {
  sdkVersion: "12.7.0",
  functionsRegion: "us-central1",
  client: {
    projectId: "charropro-e8a68",
    databaseURL: "https://charropro-e8a68-default-rtdb.firebaseio.com"
  }
};

const localLocation = { hostname: "127.0.0.1", search: "" };
assert.equal(isLocalFirebaseRuntimeLocation(localLocation), true);
assert.equal(isLocalFirebaseRuntimeLocation({ hostname: "portal.charropro.test" }), false);
const lanHost = "192.168.10.25";
assert.equal(isPrivateLanIpv4Host(lanHost), true);
assert.equal(isPrivateLanIpv4Host("172.20.8.4"), true);
assert.equal(isPrivateLanIpv4Host("8.8.8.8"), false);
assert.equal(resolveFirebaseRuntimeEnvironment(localLocation), "local");
assert.equal(resolveFirebaseRuntimeEnvironment({ hostname: lanHost, search: "?charroproEnv=local" }), "local");
assert.throws(() => resolveFirebaseRuntimeEnvironment({ hostname: lanHost, search: "" }), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-local-lan-explicit-required");
assert.throws(() => resolveFirebaseRuntimeEnvironment({ hostname: "portal.charropro.test", search: "?charroproEnv=local" }), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-local-host-required");
assert.throws(() => resolveFirebaseRuntimeEnvironment({ hostname: "127.0.0.1", search: "?charroproEnv=production" }), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-environment-selection-blocked");

const runtime = resolveFirebaseRuntime({ location: localLocation, bootstrap });
assert.equal(runtime.environment, "local");
assert.equal(runtime.projectId, LOCAL_FIREBASE_PROJECT_ID);
assert.equal(runtime.firebaseConfig.projectId, LOCAL_FIREBASE_PROJECT_ID);
assert.equal(runtime.firebaseConfig.databaseURL, "http://127.0.0.1:9000?ns=demo-charropro-local");
assert.equal(JSON.stringify(runtime.firebaseConfig).includes("charropro-e8a68"), false);
assert.equal(assertLocalFirebaseRuntime(runtime), true);
assert.deepEqual(buildFirebaseEmulatorConnectionPlan(runtime), {
  auth: { url: "http://127.0.0.1:9099" },
  database: { host: "127.0.0.1", port: 9000 },
  functions: { host: "127.0.0.1", port: 5001 },
  storage: { host: "127.0.0.1", port: 9199 }
});
assert.deepEqual(getFirebaseRuntimePublicDiagnostics(runtime, { connected: true }), {
  version: "1.0.0",
  environment: "local",
  label: "LOCAL / EMULATOR",
  local: true,
  projectId: LOCAL_FIREBASE_PROJECT_ID,
  emulatorHosts: {
    auth: "127.0.0.1:9099",
    database: "127.0.0.1:9000",
    functions: "127.0.0.1:5001",
    storage: "127.0.0.1:9199"
  },
  connected: true
});

const lanRuntime = resolveFirebaseRuntime({
  location: { hostname: lanHost, search: "?charroproEnv=local" },
  bootstrap
});
assert.equal(lanRuntime.projectId, LOCAL_FIREBASE_PROJECT_ID);
assert.equal(lanRuntime.firebaseConfig.databaseURL, `http://${lanHost}:9000?ns=demo-charropro-local`);
assert.deepEqual(buildFirebaseEmulatorConnectionPlan(lanRuntime), {
  auth: { url: `http://${lanHost}:9099` },
  database: { host: lanHost, port: 9000 },
  functions: { host: lanHost, port: 5001 },
  storage: { host: lanHost, port: 9199 }
});
assert.throws(() => resolveFirebaseRuntime({
  location: { hostname: "8.8.8.8", search: "?charroproEnv=local" },
  bootstrap
}), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-local-host-required");

assert.throws(() => assertLocalFirebaseRuntime({ ...runtime, projectId: "charropro-e8a68" }), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-production-blocked");
assert.throws(() => assertLocalFirebaseRuntime({
  ...runtime,
  firebaseConfig: { ...runtime.firebaseConfig, databaseURL: "https://charropro-e8a68-default-rtdb.firebaseio.com" }
}), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-production-blocked");
assert.throws(() => createLocalFirebaseRuntime({ sdkVersion: "bad", functionsRegion: "us-central1" }), (error) => error instanceof FirebaseRuntimeError && error.code === "firebase-runtime-sdk-version-invalid");

process.stdout.write("firebase local runtime tests passed\n");
