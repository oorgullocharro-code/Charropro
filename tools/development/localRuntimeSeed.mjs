#!/usr/bin/env node
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { DEFAULT_LOCAL_PROJECT_ID } from "./environmentFoundation.mjs";
import { FMCH_2026_LIBRE_PROFILE } from "../../js/data/ruleProfiles.js";

const require = createRequire(import.meta.url);
const requireFromFunctions = createRequire(new URL("../../functions/package.json", import.meta.url));

export const LOCAL_RUNTIME_SEED_VERSION = "1.0.0";
export const LOCAL_RUNTIME_TOURNAMENT_ID = "demo-local-fmch-2026";
export const LOCAL_RUNTIME_CHARREADA_ID = "demo-local-fmch-jornada-1";
export const LOCAL_FIXTURE_PASSWORD = "LocalOnly-CharroPro-2026!";

export const LOCAL_SYNTHETIC_USERS = Object.freeze([
  { uid: "local-admin", email: "admin.local@example.test", name: "Administrador Local", role: "supervisor" },
  { uid: "local-supervisor", email: "supervisor.local@example.test", name: "Supervisor Local", role: "supervisor" },
  { uid: "local-juez", email: "juez.local@example.test", name: "Juez Local", role: "juez" },
  { uid: "local-operador", email: "operador.local@example.test", name: "Operador Local", role: "operador" },
  { uid: "local-locutor", email: "locutor.local@example.test", name: "Locutor Local", role: "locutor" },
  { uid: "local-graficos", email: "graficos.local@example.test", name: "Graficos Local", role: "graficos" },
  { uid: "local-lectura", email: "lectura.local@example.test", name: "Lectura Local", role: "lectura" }
]);

const LOCAL_HOST = "127.0.0.1";
const LOCAL_PORTS = Object.freeze({ auth: 9099, database: 9000, functions: 5001, storage: 9199 });
const PRODUCTION_PROJECT_ID = "charropro-e8a68";
const SUERTE_IDS = Object.freeze(["cala", "piales", "colas", "toro", "terna", "yegua", "manganas_pie", "manganas_caballo", "paso"]);

export function assertLocalRuntimeSeedEnvironment(source = process.env) {
  const requestedProjectId = String(source.FIREBASE_PROJECT_ID || "").trim();
  if (requestedProjectId && requestedProjectId !== DEFAULT_LOCAL_PROJECT_ID) {
    throw new Error("local-runtime-seed-production-project-blocked");
  }
  for (const [name, port] of Object.entries(LOCAL_PORTS)) {
    const key = `FIREBASE_${name.toUpperCase()}_EMULATOR_HOST`;
    const configured = String(source[key] || "").trim();
    if (configured && configured !== `${LOCAL_HOST}:${port}`) {
      throw new Error(`local-runtime-seed-emulator-host-invalid:${name}`);
    }
  }
  if (JSON.stringify(source).includes(PRODUCTION_PROJECT_ID)) {
    throw new Error("local-runtime-seed-production-marker-blocked");
  }
  return Object.freeze({
    projectId: DEFAULT_LOCAL_PROJECT_ID,
    authHost: `${LOCAL_HOST}:${LOCAL_PORTS.auth}`,
    databaseHost: `${LOCAL_HOST}:${LOCAL_PORTS.database}`,
    functionsHost: `${LOCAL_HOST}:${LOCAL_PORTS.functions}`,
    storageHost: `${LOCAL_HOST}:${LOCAL_PORTS.storage}`
  });
}

export function createLocalRuntimeSeedFixture(now = "2026-08-01T00:00:00.000Z") {
  const tournament = {
    id: LOCAL_RUNTIME_TOURNAMENT_ID,
    name: "DEMO LOCAL / NO OFICIAL - Auditoria FMCH",
    season: 2026,
    type: "completo",
    category: "Libre",
    status: "en_vivo",
    venue: "Lienzo Demo Local",
    createdAt: now,
    updatedAt: now,
    demo: true,
    environment: "local",
    official: false
  };
  tournament.ruleProfileId = FMCH_2026_LIBRE_PROFILE.profileId;
  tournament.ruleProfileVersion = FMCH_2026_LIBRE_PROFILE.version;
  tournament.ruleProfile = {
    ...FMCH_2026_LIBRE_PROFILE,
    status: "active",
    metadata: {
      ...FMCH_2026_LIBRE_PROFILE.metadata,
      fixtureOnly: true,
      activationReady: false,
      environment: "local-emulator"
    }
  };
  const teams = [
    { id: "demo-local-equipo-a", name: "Charros Demo del Norte", association: "Asociacion Local A", category: "Libre", roster: { piales: "Pialador Demo Norte", colas: ["Alberto Demo", "Bernardo Demo", "Carlos Demo"], integrantes: [{ name: "Charro Uno", horseName: "Relampago Local" }] } },
    { id: "demo-local-equipo-b", name: "Rancheros de Ensayo", association: "Asociacion Local B", category: "Libre", roster: { piales: "Pialador de Ensayo", colas: ["Diego Ensayo", "Esteban Ensayo", "Felipe Ensayo"], integrantes: [{ name: "Charro Dos", horseName: "Centella Local" }] } },
    { id: "demo-local-equipo-c", name: "Tradicion Ficticia", association: "Asociacion Local C", category: "Libre", roster: { piales: "Pialador Tradicion", colas: ["Gustavo Local", "Hector Local", "Ignacio Local"], integrantes: [{ name: "Charro Tres", horseName: "Lucero Local" }] } }
  ].map((team) => ({ ...team, tournamentId: tournament.id, demo: true }));
  const charreada = {
    id: LOCAL_RUNTIME_CHARREADA_ID,
    tournamentId: tournament.id,
    name: "Jornada de validacion local",
    date: "2026-08-01",
    startTime: "10:00",
    phase: "Auditoria local",
    status: "en_vivo",
    competitionType: "equipos_completo",
    competitionScope: "team",
    competitionId: "equipos_completo",
    suerteIds: [...SUERTE_IDS],
    teamIds: teams.map((team) => team.id),
    assignedJudges: ["local-juez"],
    demo: true,
    official: false
  };
  const userProfiles = Object.fromEntries(LOCAL_SYNTHETIC_USERS.map((user) => [user.uid, {
    name: user.name,
    email: user.email,
    role: user.role,
    active: true,
    // La app actual consulta el indice completo; el fixture contiene un solo torneo local.
    tournamentAccess: "all",
    tournamentIds: [],
    environment: "local",
    demo: true,
    updatedAt: now
  }]));
  return deepFreeze({
    seedVersion: LOCAL_RUNTIME_SEED_VERSION,
    marker: "DEMO / LOCAL / NO OFICIAL",
    tournamentId: tournament.id,
    charreadaId: charreada.id,
    authUsers: LOCAL_SYNTHETIC_USERS.map((user) => ({ ...user })),
    database: {
      "charropro/users": userProfiles,
      "charropro/userTournamentAccess": Object.fromEntries(LOCAL_SYNTHETIC_USERS
        .filter((user) => user.role !== "supervisor")
        .map((user) => [user.uid, { [tournament.id]: true }])),
      "charropro/tournaments": {
        [tournament.id]: {
          info: tournament,
          teams,
          charreadas: [charreada],
          scores: {},
          publishedScores: [],
          history: [],
          settings: {},
          meta: {
            schemaVersion: 1,
            version: 1,
            updatedAt: now,
            updatedAtMs: Date.parse(now),
            updatedBy: { uid: "local-admin", name: "Administrador Local", role: "supervisor", clientId: "local-runtime-seed" },
            clientId: "local-runtime-seed",
            activeTournamentId: tournament.id,
            activeCharreadaId: charreada.id,
            scoringSuerteIdx: 0,
            scoringTeamIdx: 0,
            scoringAttemptIdx: 0,
            scoringColeadorIdx: 0,
            ruleEditorSuerteId: "cala"
          }
        }
      },
      "charropro/tournamentIndex": {
        [tournament.id]: {
          ...tournament,
          teamCount: teams.length,
          charreadaCount: 1,
          scoreCount: 0,
          updatedAt: now,
          updatedAtMs: Date.parse(now)
        }
      },
      "charropro/live": {
        [tournament.id]: {
          current: {
            tournamentId: tournament.id,
            activeCharreadaId: charreada.id,
            charreadaId: charreada.id,
            status: "en_vivo",
            currentTeamId: teams[0].id,
            team: { id: teams[0].id, name: teams[0].name },
            demo: true,
            environment: "local",
            updatedAt: now
          }
        }
      }
    }
  });
}

export function buildLocalRuntimeSeedPlan(options = {}) {
  const fixture = createLocalRuntimeSeedFixture(options.now);
  return deepFreeze({
    command: options.reset ? "reset" : "seed",
    projectId: DEFAULT_LOCAL_PROJECT_ID,
    emulatorHosts: { ...LOCAL_PORTS },
    fixture,
    writes: Object.keys(fixture.database),
    users: fixture.authUsers.map((user) => ({ uid: user.uid, email: user.email, role: user.role }))
  });
}

async function loadLocalAdmin() {
  const runtime = assertLocalRuntimeSeedEnvironment();
  process.env.FIREBASE_PROJECT_ID = runtime.projectId;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = runtime.authHost;
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = runtime.databaseHost;
  process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = runtime.functionsHost;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = runtime.storageHost;
  const { deleteApp, getApps, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const { getDatabase } = requireFromFunctions("firebase-admin/database");
  const app = getApps().find((candidate) => candidate.name === "charropro-local-runtime-seed")
    || initializeApp({ projectId: runtime.projectId, databaseURL: `http://${LOCAL_HOST}:${LOCAL_PORTS.database}?ns=${runtime.projectId}` }, "charropro-local-runtime-seed");
  return { runtime, app, deleteApp, auth: getAuth(app), database: getDatabase(app) };
}

async function ensureSyntheticUser(auth, user) {
  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, { email: user.email, displayName: user.name, password: LOCAL_FIXTURE_PASSWORD, disabled: false });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    await auth.createUser({ uid: user.uid, email: user.email, displayName: user.name, password: LOCAL_FIXTURE_PASSWORD, emailVerified: true, disabled: false });
  }
}

async function seedLocalRuntime(options = {}) {
  const plan = buildLocalRuntimeSeedPlan(options);
  const { runtime, app, deleteApp, auth, database } = await loadLocalAdmin();
  try {
    if (options.reset) {
      await database.ref("charropro").remove();
      await Promise.all(plan.fixture.authUsers.map(async (user) => {
        try { await auth.deleteUser(user.uid); } catch (error) { if (error?.code !== "auth/user-not-found") throw error; }
      }));
    }
    await Promise.all(plan.fixture.authUsers.map((user) => ensureSyntheticUser(auth, user)));
    await Promise.all(Object.entries(plan.fixture.database).map(([path, value]) => database.ref(path).set(value)));
    return { projectId: runtime.projectId, marker: plan.fixture.marker, tournamentId: plan.fixture.tournamentId, charreadaId: plan.fixture.charreadaId, users: plan.users, reset: Boolean(options.reset) };
  } finally {
    await deleteApp(app);
  }
}

async function main(argv) {
  const reset = argv.includes("--reset");
  const planOnly = argv.includes("--plan");
  if (argv.includes("--help")) {
    process.stdout.write("Usage: node tools/development/localRuntimeSeed.mjs [--reset] [--plan]\n");
    return;
  }
  assertLocalRuntimeSeedEnvironment();
  const result = planOnly ? buildLocalRuntimeSeedPlan({ reset }) : await seedLocalRuntime({ reset });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Local runtime seed failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}
