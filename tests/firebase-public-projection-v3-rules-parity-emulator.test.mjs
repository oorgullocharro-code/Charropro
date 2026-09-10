import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createCanonicalPublicTournamentData, normalizeCanonicalPublicTournamentData, validateCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runProjectionV3RulesParityEmulator();
}

console.log("firebase-public-projection-v3-rules-parity-emulator.test.mjs: ok");

async function runProjectionV3RulesParityEmulator() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const databaseNamespace = `${projectId}-default-rtdb`;
  const authHost = String(process.env.FIREBASE_AUTH_EMULATOR_HOST || "").trim();
  const databaseHost = String(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "").trim();
  assert.equal(projectId, "demo-charropro-local");
  assert.match(authHost, /^127\.0\.0\.1:\d+$/);
  assert.match(databaseHost, /^127\.0\.0\.1:\d+$/);
  assert.equal(JSON.stringify(process.env).includes("charropro-e8a68"), false);

  const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const { getDatabase } = requireFromFunctions("firebase-admin/database");
  const suffix = `${Date.now()}-${process.pid}`;
  const uid = `projection-v3-judge-${suffix}`;
  // This is the production diagnosis identity, exercised only in a clean demo Emulator.
  const tournamentId = "torneo_mtut0u78_ojpwf6";
  const email = `${uid}@example.test`;
  const password = "LocalProjectionV3Only-2026!";
  const app = initializeApp({
    projectId,
    databaseURL: `http://${databaseHost}?ns=${databaseNamespace}`
  }, `projection-v3-rules-${suffix}`);
  const auth = getAuth(app);
  const database = getDatabase(app);

  try {
    await auth.createUser({ uid, email, password, emailVerified: true });
    await database.ref(`charropro/users/${uid}`).set({
      active: true,
      role: "juez",
      tournamentAccess: "selected"
    });
    await database.ref(`charropro/userTournamentAccess/${uid}/${tournamentId}`).set(true);
    const token = await signIn(authHost, email, password);
    const candidate = buildCandidate(tournamentId);
    assert.equal(validateCanonicalPublicTournamentData(candidate).valid, true);

    const unauthorized = await writeProjection(databaseHost, databaseNamespace, `${tournamentId}-unauthorized`, candidate, "");
    assert.equal(unauthorized.ok, false, "unauthenticated public projection write remains denied");

    const allowed = await writeProjection(databaseHost, databaseNamespace, tournamentId, candidate, token);
    assert.equal(allowed.ok, true, allowed.body);
    const stored = (await database.ref(`charropro/publicTournaments/${tournamentId}`).get()).val();
    const roundTripped = normalizeCanonicalPublicTournamentData(stored);
    assert.equal(validateCanonicalPublicTournamentData(roundTripped).valid, true);
    assert.equal(roundTripped.results.teams.length, 3);
    assert.equal(roundTripped.standings.items.length, 9);
    assert.equal(roundTripped.sheet.competitions.length, 1);
    assert.equal(roundTripped.timeline.items.length, 3);

    await assertRejected("schema-v2", candidate, token, (projection) => {
      projection.schemaVersion = 2;
      projection.projectionVersion = "2.0.0";
    });
    for (const privateField of ["uid", "email", "roles", "officialScoreLedger", "publishedScores", "attemptV2", "cas", "audit", "recovery", "token"]) {
      await assertRejected(`private-${privateField}`, candidate, token, (projection) => {
        projection.timeline.items[0][privateField] = "private";
      });
    }
    await assertRejected("program-malformed", candidate, token, (projection) => {
      projection.program.items[0].competitionName = 7;
    });
    await assertRejected("result-malformed", candidate, token, (projection) => {
      projection.results.teams[0].total = "invalid";
    });
    await assertRejected("standing-malformed", candidate, token, (projection) => {
      projection.standings.items[0].position = "invalid";
    });
    await assertRejected("sheet-malformed", candidate, token, (projection) => {
      projection.sheet.competitions[0].phase = 7;
    });
    await assertRejected("timeline-malformed", candidate, token, (projection) => {
      projection.timeline.items[0].publishedAt = 7;
    });
  } finally {
    await database.ref(`charropro/publicTournaments/${tournamentId}`).remove();
    await database.ref(`charropro/userTournamentAccess/${uid}`).remove();
    await database.ref(`charropro/users/${uid}`).remove();
    await auth.deleteUser(uid).catch(() => {});
    await deleteApp(app);
  }

  async function assertRejected(label, source, token, mutate) {
    const projection = structuredClone(source);
    projection.projectionRevision += 1;
    mutate(projection);
    const response = await writeProjection(databaseHost, databaseNamespace, `${tournamentId}-${label}`, projection, token);
    assert.equal(response.ok, false, `${label}: ${response.body}`);
  }
}

function buildCandidate(tournamentId) {
  const teams = [
    ["team-1", "Equipo Uno", 32],
    ["team-2", "Equipo Dos", 29],
    ["team-3", "Equipo Tres", 35]
  ];
  const results = teams.map(([teamId, teamName, total], index) => ({
    resultId: `result-${index + 1}`,
    teamId,
    teamName,
    participantScope: "team",
    charreadaId: "jornada-1",
    charreadaName: "Jornada 1",
    competitionId: "competition-team",
    competitionName: "Equipos completo",
    phase: "clasificatoria",
    phaseName: "Clasificatoria",
    columns: { cala: total },
    penalties: 0,
    subtotal: total,
    total,
    status: "official",
    position: index + 1
  }));
  const standings = results.flatMap((result, index) => ["competition", "charreada", "overall"].map((scopeType) => ({
    rankingId: `${scopeType}-${result.resultId}`,
    resultId: result.resultId,
    resultIds: [result.resultId],
    position: index + 1,
    scopeType,
    competitionId: result.competitionId,
    competitionName: result.competitionName,
    charreadaId: result.charreadaId,
    participantScope: "team",
    teamId: result.teamId,
    teamName: result.teamName,
    total: result.total,
    classification: "official",
    status: "official",
    phase: result.phase,
    phaseName: result.phaseName,
    tieBreakLabel: ""
  })));
  return createCanonicalPublicTournamentData({
    tournamentId,
    sourceRevision: 1,
    projectionRevision: 1,
    generatedAt: "2026-09-09T00:01:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: tournamentId, name: "Projection V3 Rules QA", status: "live" },
    program: {
      items: [{
        id: "jornada-1",
        charreadaId: "jornada-1",
        competitionId: "competition-team",
        competitionName: "Equipos completo",
        phase: "clasificatoria",
        phaseName: "Clasificatoria",
        name: "Jornada 1",
        scheduledDate: "2026-09-09",
        scheduledTime: "10:00",
        status: "live",
        order: 1,
        teamIds: teams.map(([teamId]) => teamId),
        teamNames: teams.map(([, teamName]) => teamName),
        participantIds: [],
        participantNames: []
      }]
    },
    live: { status: "LIVE", currentCharreada: "Jornada 1", currentSuerte: "Cala", updatedAt: "2026-09-09T00:01:00.000Z" },
    results: { teams: results },
    standings: { items: standings },
    sheet: {
      competitions: [{
        competitionId: "competition-team",
        name: "Equipos completo",
        charreadaId: "jornada-1",
        charreadaName: "Jornada 1",
        phase: "clasificatoria",
        phaseName: "Clasificatoria",
        rows: results.map((result) => ({
          resultId: result.resultId,
          teamId: result.teamId,
          teamName: result.teamName,
          total: result.total,
          columns: result.columns
        }))
      }]
    },
    timeline: {
      items: results.map((result, index) => ({
        eventId: `event-${index + 1}`,
        sequence: index + 1,
        occurredAt: `2026-09-09T00:00:0${index + 1}.000Z`,
        publishedAt: `2026-09-09T00:00:1${index + 1}.000Z`,
        type: "score_published",
        status: "official",
        competitionId: result.competitionId,
        competitionName: result.competitionName,
        phaseId: "clasificatoria",
        phaseName: result.phaseName,
        charreadaId: result.charreadaId,
        charreadaName: result.charreadaName,
        teamId: result.teamId,
        teamName: result.teamName,
        suerteId: "cala",
        suerteName: "Cala",
        label: `Cala ${result.teamName}`,
        score: result.total,
        previousScore: 0
      }))
    },
    statistics: { status: "ready", items: [] }
  });
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
