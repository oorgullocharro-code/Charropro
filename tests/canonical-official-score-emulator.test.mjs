import assert from "node:assert/strict";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";

const {
  applyOfficialScoreTransaction,
  prepareOfficialScoreRequest,
  toFirebaseDatabaseValue
} = officialScoreConcurrency;

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") {
  await runCanonicalWriteEmulator();
}

console.log("canonical-official-score-emulator.test.mjs: ok");

async function runCanonicalWriteEmulator() {
  const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
  const databaseHost = String(process.env.FIREBASE_DATABASE_EMULATOR_HOST || "").trim();
  assert.equal(projectId, "demo-charropro-local");
  assert.match(databaseHost, /^127\.0\.0\.1:\d+$/);
  assert.equal(JSON.stringify(process.env).includes("charropro-e8a68"), false);

  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `canonical-cas-${suffix}`;
  const charreadaId = `charreada-${suffix}`;
  const teamId = `team-${suffix}`;
  const path = `charropro/tournaments/${tournamentId}`;
  const namespace = `${projectId}-default-rtdb`;
  const url = `http://${databaseHost}/${path}.json?ns=${namespace}`;

  try {
    await expectWrite(url, seed(tournamentId, charreadaId, teamId));
    const first = prepare({ tournamentId, charreadaId, teamId, attemptIndex: 0, total: 12, payload: [{ base: 12 }, { base: 0 }], idempotencyKey: "score:emulator-cas-first-0001" });
    const second = prepare({ tournamentId, charreadaId, teamId, attemptIndex: 1, total: 18, payload: [{ base: 0 }, { base: 18 }], idempotencyKey: "score:emulator-cas-second-0001" });

    const candidates = await Promise.all([first, second].map((request) => buildCasCandidate(url, request)));
    assert.equal(candidates[0].etag, candidates[1].etag, "both writers start from the same RTDB revision");
    const firstRound = await Promise.all(candidates.map((candidate) => conditionalWrite(url, candidate)));
    assert.deepEqual(firstRound.map((response) => response.status).sort(), [200, 412]);
    const loserIndex = firstRound.findIndex((response) => response.status === 412);
    const retried = await conditionalWrite(url, await buildCasCandidate(url, [first, second][loserIndex]));
    assert.equal(retried.status, 200, await retried.text());

    const stored = await readJson(url);
    const scoreId = `${charreadaId}__${teamId}__piales`;
    assert.deepEqual(stored.scores[scoreId].map((item) => item.base), [12, 18]);
    assert.equal(Object.keys(stored.officialScoreLedger).length, 2);
    assert.equal(Object.values(stored.publishedScores).filter((item) => !item.superseded).length, 2);
  } finally {
    await fetch(url, { method: "DELETE", headers: adminHeaders() }).catch(() => {});
  }
}

async function buildCasCandidate(url, request) {
  const response = await fetch(url, { headers: adminHeaders({ "X-Firebase-ETag": "true" }) });
  if (!response.ok) assert.fail(await response.text());
  const current = await response.json();
  const applied = applyOfficialScoreTransaction(current || {}, request);
  assert.equal(applied.outcome.ok, true, applied.outcome.reason);
  return {
    etag: response.headers.get("etag"),
    body: toFirebaseDatabaseValue(applied.tournament)
  };
}

function conditionalWrite(url, candidate) {
  return fetch(url, {
    method: "PUT",
    headers: adminHeaders({ "content-type": "application/json", "if-match": candidate.etag }),
    body: JSON.stringify(candidate.body)
  });
}

async function expectWrite(url, value) {
  const response = await fetch(url, {
    method: "PUT",
    headers: adminHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(value)
  });
  if (!response.ok) assert.fail(await response.text());
}

async function readJson(url) {
  const response = await fetch(url, { headers: adminHeaders() });
  if (!response.ok) assert.fail(await response.text());
  return response.json();
}

function adminHeaders(extra = {}) {
  return { Authorization: "Bearer owner", ...extra };
}

function prepare({ tournamentId, charreadaId, teamId, attemptIndex, total, payload, idempotencyKey }) {
  const attemptKey = `${tournamentId}__${charreadaId}__${teamId}__piales__${attemptIndex}__0`;
  const prepared = prepareOfficialScoreRequest({
    tournamentId,
    scoreId: `${charreadaId}__${teamId}__piales`,
    idempotencyKey,
    expectedRevision: 0,
    scorePayload: payload,
    publishedScore: {
      attemptKey,
      tournament: { id: tournamentId },
      charreada: { id: charreadaId, competitionId: "equipos_completo" },
      competition: { id: "equipos_completo", scope: "team" },
      team: { id: teamId },
      suerte: { id: "piales" },
      attemptIndex,
      coleadorIndex: 0,
      total
    }
  }, { uid: "emulator-judge", name: "Juez Emulator", role: "juez" }, { nowMs: Date.now() + attemptIndex });
  assert.equal(prepared.valid, true, prepared.errors?.join(", "));
  return prepared.request;
}

function seed(tournamentId, charreadaId, teamId) {
  return {
    info: { id: tournamentId, status: "en_vivo" },
    meta: { activeCharreadaId: charreadaId },
    charreadas: { [charreadaId]: { id: charreadaId, competitionId: "equipos_completo", teamIds: [teamId], suerteIds: ["piales"] } },
    teams: { [teamId]: { id: teamId } },
    scores: { [`${charreadaId}__${teamId}__piales`]: [{ base: 0 }, { base: 0 }] },
    publishedScores: {}
  };
}
