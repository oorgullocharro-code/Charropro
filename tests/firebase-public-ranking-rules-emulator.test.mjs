import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildPublicProjection, reconcilePublicProjection } from "../js/public/publicProjection.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runPublicRankingRulesEmulator();
}

console.log("firebase-public-ranking-rules-emulator.test.mjs: ok");

async function runPublicRankingRulesEmulator() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const databaseNamespace = `${projectId}-default-rtdb`;
  const authHost = String(process.env.FIREBASE_AUTH_EMULATOR_HOST || "").trim();
  const databaseHost = String(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "").trim();
  assert.equal(projectId, "demo-charropro-local");
  assert.match(authHost, /^127\.0\.0\.1:\d+$/);
  assert.match(databaseHost, /^127\.0\.0\.1:\d+$/);
  assert.equal(JSON.stringify(process.env).includes("charropro-e8a68"), false);

  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = databaseHost;
  const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const { getDatabase } = requireFromFunctions("firebase-admin/database");
  const suffix = `${Date.now()}-${process.pid}`;
  const uid = `ranking-operator-${suffix}`;
  const tournamentId = `ranking-rules-${suffix}`;
  const email = `${uid}@example.test`;
  const password = "LocalRankingOnly-2026!";
  const app = initializeApp({
    projectId,
    databaseURL: `http://${databaseHost}?ns=${databaseNamespace}`
  }, `public-ranking-rules-${suffix}`);
  const auth = getAuth(app);
  const database = getDatabase(app);

  try {
    await auth.createUser({ uid, email, password, emailVerified: true });
    await database.ref(`charropro/users/${uid}`).set({
      active: true,
      role: "supervisor",
      tournamentAccess: "selected"
    });
    await database.ref(`charropro/userTournamentAccess/${uid}/${tournamentId}`).set(true);
    const token = await signIn(authHost, email, password);
    const projection = buildProjection(tournamentId);
    const unauthenticated = await writeProjection(databaseHost, databaseNamespace, tournamentId, projection, "");
    assert.equal(unauthenticated.ok, false);
    const authorized = await writeProjection(databaseHost, databaseNamespace, tournamentId, projection, token);
    assert.equal(authorized.ok, true, authorized.body);
    const stored = (await database.ref(`charropro/publicTournaments/${tournamentId}`).get()).val();
    assert.equal(stored.rankings.status, "ready");
    assert.deepEqual(
      stored.rankings.items
        .filter((item) => item.scopeType === "competition")
        .map((item) => item.teamId),
      ["team-a", "team-b"]
    );

    const invalid = structuredClone(projection);
    invalid.projectionRevision += 1;
    invalid.rankings.revision += 1;
    invalid.rankings.items[0].operatorId = "private";
    const rejected = await writeProjection(databaseHost, databaseNamespace, tournamentId, invalid, token);
    assert.equal(rejected.ok, false);
    assert.equal((await database.ref(`charropro/publicTournaments/${tournamentId}/projectionRevision`).get()).val(), 1);
  } finally {
    await database.ref(`charropro/publicTournaments/${tournamentId}`).remove();
    await database.ref(`charropro/userTournamentAccess/${uid}`).remove();
    await database.ref(`charropro/users/${uid}`).remove();
    await auth.deleteUser(uid).catch(() => {});
    await deleteApp(app);
  }
}

function buildProjection(tournamentId) {
  const candidate = buildPublicProjection({
    tournament: {
      info: { id: tournamentId, name: "Ranking Rules QA", type: "completo" },
      meta: { updatedAt: "2026-08-31T18:00:00.000Z", activeCharreadaId: "j1" },
      teams: [{ id: "team-a", name: "Equipo A" }, { id: "team-b", name: "Equipo B" }],
      charreadas: [{
        id: "j1",
        name: "Jornada 1",
        competitionId: "competition-team",
        competitionType: "equipos_completo",
        competitionScope: "team",
        categoryId: "libre",
        phaseId: "clasificatoria",
        teamIds: ["team-a", "team-b"],
        suerteIds: ["cala"]
      }],
      publishedScores: {
        a: officialScore(tournamentId, "team-a", "Equipo A", 30, "01"),
        b: officialScore(tournamentId, "team-b", "Equipo B", 20, "02")
      }
    },
    liveCurrent: {
      tournament: { id: tournamentId },
      activeCharreadaId: "j1",
      competitionId: "competition-team",
      timestamp: "2026-08-31T18:00:00.000Z"
    }
  }, { tournamentId, nowMs: Date.parse("2026-08-31T18:01:00.000Z") });
  const result = reconcilePublicProjection(null, candidate, { nowMs: Date.parse("2026-08-31T18:01:00.000Z") });
  assert.equal(result.ok, true, JSON.stringify(result.errors || []));
  return result.projection;
}

function officialScore(tournamentId, teamId, teamName, total, second) {
  return {
    id: `score-${teamId}`,
    attemptKey: `${tournamentId}:j1:${teamId}:cala:0:0`,
    tournamentId,
    charreadaId: "j1",
    competitionId: "competition-team",
    competitionType: "equipos_completo",
    participantScope: "team",
    teamId,
    teamName,
    suerteId: "cala",
    attemptIndex: 0,
    attempt: { total },
    revision: 1,
    published: true,
    publishedAt: `2026-08-31T18:00:${second}.000Z`
  };
}

async function signIn(authHost, email, password) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body.idToken;
}

async function writeProjection(databaseHost, databaseNamespace, tournamentId, projection, token) {
  const query = new URLSearchParams({ ns: databaseNamespace });
  if (token) query.set("auth", token);
  const response = await fetch(`http://${databaseHost}/charropro/publicTournaments/${tournamentId}.json?${query}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(projection)
  });
  return { ok: response.ok, status: response.status, body: await response.text() };
}
