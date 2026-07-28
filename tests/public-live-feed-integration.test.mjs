import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { listPublicLiveFeedEvents, validatePublicLiveFeed } from "../js/public/publicLiveFeed.js";

const TEST_STATE_KEY = "__charroProPublicFeedFirebaseTest";
const firebase = createFirebaseTestAdapter();
globalThis[TEST_STATE_KEY] = firebase;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("https://www.gstatic.com/firebasejs/12.13.0/")) {
      const moduleName = specifier.split("/").at(-1);
      return {
        shortCircuit: true,
        url: `charropro-firebase-test:${moduleName}`
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.startsWith("charropro-firebase-test:")) return nextLoad(url, context);
    const moduleName = url.slice("charropro-firebase-test:".length);
    return {
      format: "module",
      shortCircuit: true,
      source: firebaseModuleSource(moduleName)
    };
  }
});

const firebaseSync = await import(`../js/core/firebaseSync.js?public-feed-integration=${Date.now()}`);
const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const tournamentId = "tournament-feed-integration";
const charreadaId = "charreada-feed-integration";
const teamId = "team-feed-integration";

firebase.seed({
  charropro: {
    tournaments: {
      [tournamentId]: {
        info: {
          id: tournamentId,
          nombre: "Torneo Feed Integration",
          type: "completo"
        },
        meta: {
          activeCharreadaId: charreadaId,
          updatedAt: "2026-07-28T10:00:00.000Z"
        },
        teams: {
          [teamId]: { id: teamId, name: "Equipo Integration" }
        },
        charreadas: {
          [charreadaId]: {
            id: charreadaId,
            name: "Charreada Integration",
            status: "en_vivo",
            competitionId: "equipos_completo",
            competitionType: "equipos_completo",
            teamIds: [teamId],
            suerteIds: ["cala", "piales"]
          }
        },
        scores: {},
        publishedScores: {}
      }
    },
    live: {},
    publicTournaments: {},
    audit: { publishedScores: {} }
  }
});

const first = await publishOfficial({
  publishedId: "published-integration-1",
  scoreId: "score-integration-1",
  suerteId: "cala",
  total: 10,
  publishedAt: "2026-07-28T10:01:00.000Z"
});
assert.equal(first.ok, true);
assert.equal(first.complete, true);
assert.equal(first.partialFailure, false);
assert.equal(first.privateWrite.ok, true);
assert.equal(first.publicSnapshot.ok, true);
assert.equal(firebase.privateWriteCount, 1, "private score is written once");

const publicPath = `charropro/publicTournaments/${tournamentId}`;
const firstProjection = firebase.read(publicPath);
assert.equal(firstProjection.schemaVersion, 2);
assert.equal(firstProjection.projectionRevision, 1);
assert.equal(firstProjection.liveFeed.revision, 1);
assert.equal(firstProjection.liveFeed.status, "live");
assert.equal(validatePublicLiveFeed(firstProjection.liveFeed).valid, true);
const firstEvents = listPublicLiveFeedEvents(firstProjection.liveFeed);
assert.equal(firstEvents.length, 1);
assert.ok(firstEvents[0].eventId);
assert.equal(firstEvents[0].eventType, "score_published");
assert.ok(Number.isSafeInteger(firstEvents[0].sequence) && firstEvents[0].sequence > 0);
assert.equal(firstEvents[0].revision, 1);
assert.equal(firstEvents[0].occurredAt, Date.parse("2026-07-28T10:01:00.000Z"));
assert.equal(firstEvents[0].publishedAt, Date.parse("2026-07-28T10:01:00.000Z"));
assert.equal(firstEvents[0].score, 10);
assert.equal(firstEvents[0].teamId, teamId);
assert.equal(firstEvents[0].suerteId, "cala");
assert.equal(firstEvents[0].status, "official");

const second = await publishOfficial({
  publishedId: "published-integration-2",
  scoreId: "score-integration-2",
  suerteId: "piales",
  total: 25,
  publishedAt: "2026-07-28T10:02:00.000Z"
});
assert.equal(second.ok, true);
assert.equal(second.complete, true);
assert.equal(second.partialFailure, false);
assert.equal(second.publicSnapshot.ok, true);
assert.equal(firebase.privateWriteCount, 2);
const secondProjection = firebase.read(publicPath);
assert.equal(secondProjection.projectionRevision, 2);
assert.equal(secondProjection.liveFeed.revision, 2);
assert.equal(listPublicLiveFeedEvents(secondProjection.liveFeed).length, 2);

firebase.failPublicTransactions = true;
const beforePartialProjection = firebase.read(publicPath);
const partial = await publishOfficial({
  publishedId: "published-integration-3",
  scoreId: "score-integration-3",
  suerteId: "colas",
  total: 33,
  publishedAt: "2026-07-28T10:03:00.000Z"
});
assert.equal(partial.ok, true, "private publication remains successful");
assert.equal(partial.complete, false);
assert.equal(partial.partialFailure, true);
assert.equal(partial.privateWrite.ok, true);
assert.equal(partial.publicSnapshot.ok, false);
assert.equal(partial.publicSnapshot.reason, "permission-denied");
assert.equal(partial.publicSnapshot.errorMessage, "No se pudo actualizar la proyección pública.");
assert.equal(firebase.privateWriteCount, 3, "partial failure never repeats the private write");
assert.equal(
  Object.keys(firebase.read(`charropro/tournaments/${tournamentId}/publishedScores`)).length,
  3,
  "the third official score remains privately published once"
);
assert.deepEqual(firebase.read(publicPath), beforePartialProjection, "failed public transaction is atomic");
assert.equal(JSON.stringify(partial).includes("AIza"), false);
assert.equal(JSON.stringify(partial).includes("credentials"), false);

assert.match(appSource, /result\.publicSnapshot\?\.ok === false/);
assert.match(appSource, /result\.partialFailure === true/);
assert.match(appSource, /Guardado; portal pendiente/);
assert.match(appSource, /La calificación fue guardada, pero no pudo actualizarse el portal público\./);
assert.equal(
  appSource.slice(
    appSource.indexOf("async function publishOfficialScoreForContext"),
    appSource.indexOf("function continueOfficialScoreFlowAfterPublish")
  ).includes("publishFirebaseOfficialScoreAtomic("),
  true
);

delete globalThis[TEST_STATE_KEY];
console.log("public-live-feed-integration.test.mjs: ok");

async function publishOfficial({ publishedId, scoreId, suerteId, total, publishedAt }) {
  return firebaseSync.publishFirebaseOfficialScoreAtomic(
    tournamentId,
    scoreId,
    [{ total }],
    {
      id: publishedId,
      attemptKey: `${charreadaId}:${teamId}:${suerteId}`,
      publishedAt,
      revision: 1,
      tournament: { id: tournamentId, name: "Torneo Feed Integration" },
      charreada: {
        id: charreadaId,
        name: "Charreada Integration",
        competitionId: "equipos_completo",
        competitionType: "equipos_completo"
      },
      competition: {
        id: "equipos_completo",
        type: "equipos_completo",
        scope: "team"
      },
      team: { id: teamId, name: "Equipo Integration" },
      suerte: { id: suerteId, name: suerteId, attempts: 1 },
      attempt: { total },
      total
    },
    { uid: "test-user", role: "supervisor" },
    {
      livePayload: {
        tournament: { id: tournamentId, name: "Torneo Feed Integration" },
        charreada: { id: charreadaId, name: "Charreada Integration" },
        competitionId: "equipos_completo",
        turn: {
          team: { id: teamId, name: "Equipo Integration" },
          suerte: { id: suerteId, name: suerteId }
        }
      }
    }
  );
}

function firebaseModuleSource(moduleName) {
  const state = `globalThis.${TEST_STATE_KEY}`;
  const modules = {
    "firebase-app.js": `
      export const getApps = () => ${state}.getApps();
      export const initializeApp = (config) => ${state}.initializeApp(config);
    `,
    "firebase-auth.js": `
      export const getAuth = (app) => ${state}.getAuth(app);
      export const onAuthStateChanged = (...args) => ${state}.onAuthStateChanged(...args);
      export const signInWithEmailAndPassword = (...args) => ${state}.signInWithEmailAndPassword(...args);
      export const signOut = (...args) => ${state}.signOut(...args);
    `,
    "firebase-database.js": `
      export const getDatabase = (app) => ${state}.getDatabase(app);
      export const ref = (database, path = "") => ${state}.ref(database, path);
      export const get = (target) => ${state}.get(target);
      export const set = (target, value) => ${state}.set(target, value);
      export const update = (target, value) => ${state}.update(target, value);
      export const runTransaction = (target, handler, options) => ${state}.runTransaction(target, handler, options);
      export const onValue = (...args) => ${state}.onValue(...args);
      export const push = (target) => ${state}.push(target);
    `,
    "firebase-functions.js": `
      export const getFunctions = (app, region) => ${state}.getFunctions(app, region);
      export const httpsCallable = (...args) => ${state}.httpsCallable(...args);
    `
  };
  if (!modules[moduleName]) throw new Error(`Unsupported Firebase test module: ${moduleName}`);
  return modules[moduleName];
}

function createFirebaseTestAdapter() {
  let data = {};
  const app = { name: "test-app" };
  const database = { name: "test-database" };
  return {
    privateWriteCount: 0,
    failPublicTransactions: false,
    seed(value) {
      data = structuredClone(value);
      this.privateWriteCount = 0;
      this.failPublicTransactions = false;
    },
    read(path) {
      return structuredClone(readPath(data, path));
    },
    getApps() {
      return [app];
    },
    initializeApp() {
      return app;
    },
    getDatabase() {
      return database;
    },
    ref(_database, path = "") {
      return { path: String(path || "") };
    },
    async get(target) {
      const value = readPath(data, target.path);
      return snapshot(value);
    },
    async set(target, value) {
      writePath(data, target.path, structuredClone(value));
    },
    async update(target, value) {
      if (!target.path) this.privateWriteCount += 1;
      for (const [path, entry] of Object.entries(value || {})) {
        writePath(data, joinPath(target.path, path), structuredClone(entry));
      }
    },
    async runTransaction(target, handler) {
      if (this.failPublicTransactions && target.path.includes("/publicTournaments/")) {
        const error = new Error("permission denied");
        error.code = "PERMISSION_DENIED";
        throw error;
      }
      const current = structuredClone(readPath(data, target.path));
      const next = handler(current);
      if (next === undefined) {
        return { committed: false, snapshot: snapshot(current) };
      }
      writePath(data, target.path, structuredClone(next));
      return { committed: true, snapshot: snapshot(next) };
    },
    onValue(_target, callback) {
      callback(snapshot(null));
      return () => {};
    },
    push(target) {
      return { path: joinPath(target.path, "generated"), key: "generated" };
    },
    getAuth() {
      return {
        currentUser: null,
        authStateReady: async () => {}
      };
    },
    onAuthStateChanged(_auth, callback) {
      callback(null);
      return () => {};
    },
    async signInWithEmailAndPassword() {
      return { user: null };
    },
    async signOut() {},
    getFunctions() {
      return {};
    },
    httpsCallable() {
      return async () => ({ data: null });
    }
  };
}

function snapshot(value) {
  const copy = value === undefined ? null : structuredClone(value);
  return {
    exists: () => copy !== null && copy !== undefined,
    val: () => structuredClone(copy)
  };
}

function readPath(root, path) {
  if (!path) return root;
  return String(path).split("/").filter(Boolean).reduce((value, key) => value?.[key], root);
}

function writePath(root, path, value) {
  const parts = String(path).split("/").filter(Boolean);
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts.at(-1)] = value;
}

function joinPath(left, right) {
  return [left, right].filter(Boolean).join("/").replace(/\/+/g, "/");
}
