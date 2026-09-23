import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPendingScoreReview } from "../js/core/pendingScoreReview.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";

const [appSource, rulesDocument] = await Promise.all([
  readFile(new URL("../js/app.js", import.meta.url), "utf8"),
  readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8")
]);
const rules = JSON.parse(rulesDocument).rules.charropro;
const tournamentRules = rules.tournaments.$tournamentId;
const projectionRules = rules.projectionOutbox.$tournamentId.$projectionId;

for (const [label, expression] of Object.entries({
  history: tournamentRules.history[".write"],
  projectionIntent: projectionRules.intent[".write"],
  projectionState: projectionRules.state[".write"],
  publicTournament: rules.publicTournaments.$tournamentId[".write"]
})) {
  assert.doesNotMatch(expression, /role'\)\.val\(\) === 'juez'/, `${label} denies direct judge writes`);
  assert.match(expression, /role'\)\.val\(\) === 'operador'/, `${label} preserves the operational producer`);
  assert.match(expression, /userTournamentAccess/, `${label} remains tournament scoped`);
}

assert.match(tournamentRules.scores[".write"], /role'\)\.val\(\) === 'juez'/, "judge draft capture remains allowed");
assert.match(tournamentRules.pendingScoreReviews.$pendingId[".write"], /role'\)\.val\(\) === 'juez'/, "judge pending-review flow remains allowed");
assert.match(tournamentRules.officialTimers.$timerKey[".write"], /role'\)\.val\(\) === 'juez'/, "judge timer authority remains allowed");
assert.doesNotMatch(rules.live.$tournamentId.graphicsConfig[".write"], /role'\)\.val\(\) === 'juez'/, "judge cannot write graphics configuration");
assert.match(rules.live.$tournamentId.graphicsConfig[".write"], /role'\)\.val\(\) === 'graficos'/, "graphics editor remains allowed");
assert.doesNotMatch(tournamentRules.officialTimers.$timerKey[".write"], /role'\)\.val\(\) === 'graficos'/, "graphics cannot control timers in Rules");
assert.doesNotMatch(tournamentRules.scores[".write"], /role'\)\.val\(\) === 'graficos'/, "graphics cannot write scores in Rules");

const screenGuardSource = appSource.slice(
  appSource.indexOf("function canAccessGraphicsLiveScreen"),
  appSource.indexOf("function showUserProfileModal")
);
assert.match(screenGuardSource, /screen\.fileName !== "cronometro\.html" \|\| roleCan\(role, "timer"\)/);
const canAccessGraphicsLiveScreen = new Function("roleCan", `${screenGuardSource}; return canAccessGraphicsLiveScreen;`)(
  (role, capability) => role === "juez" && capability === "timer"
);
assert.equal(canAccessGraphicsLiveScreen({ fileName: "cronometro.html" }, "graficos"), false, "graphics hides timer control");
assert.equal(canAccessGraphicsLiveScreen({ fileName: "cronometro-pantalla.html" }, "graficos"), true, "graphics retains timer display");
assert.equal(canAccessGraphicsLiveScreen({ fileName: "graficos.html" }, "graficos"), true, "graphics retains editor");
assert.equal(canAccessGraphicsLiveScreen({ fileName: "cronometro.html" }, "juez"), true, "timer-capable roles retain control");

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") await runRulesMatrix();

console.log("p0b-judge-graphics-minimum-privilege.test.mjs: ok");

async function runRulesMatrix() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentA = `p0b-a-${suffix}`;
  const tournamentB = `p0b-b-${suffix}`;
  const judge = await createUser(authHost, `p0b-judge-${suffix}`);
  const graphics = await createUser(authHost, `p0b-graphics-${suffix}`);
  const operator = await createUser(authHost, `p0b-operator-${suffix}`);

  try {
    await Promise.all([
      ownerPut(databaseHost, namespace, `charropro/users/${judge.uid}`, profile("juez", tournamentA)),
      ownerPut(databaseHost, namespace, `charropro/users/${graphics.uid}`, profile("graficos", tournamentA)),
      ownerPut(databaseHost, namespace, `charropro/users/${operator.uid}`, profile("operador", tournamentA)),
      ownerPut(databaseHost, namespace, `charropro/userTournamentAccess/${judge.uid}`, { [tournamentA]: true }),
      ownerPut(databaseHost, namespace, `charropro/userTournamentAccess/${graphics.uid}`, { [tournamentA]: true }),
      ownerPut(databaseHost, namespace, `charropro/userTournamentAccess/${operator.uid}`, { [tournamentA]: true })
    ]);

    await assertAllowed(databaseHost, namespace, `charropro/tournaments/${tournamentA}/scores/draft`, judge.token, { total: 1 }, "judge score draft");
    await assertAllowed(
      databaseHost,
      namespace,
      `charropro/tournaments/${tournamentA}/pendingScoreReviews/${pendingScoreReview(tournamentA, judge.uid).pendingId}`,
      judge.token,
      pendingScoreReview(tournamentA, judge.uid),
      "judge pending-review"
    );
    await assertDenied(databaseHost, namespace, `charropro/tournaments/${tournamentB}/scores/draft`, judge.token, { total: 1 }, "judge cross-tournament score");
    await assertDenied(databaseHost, namespace, `charropro/tournaments/${tournamentA}/history/event`, judge.token, { event: "blocked" }, "judge history");
    await assertDenied(databaseHost, namespace, `charropro/projectionOutbox/${tournamentA}/job/intent`, judge.token, projectionIntent(tournamentA, judge.uid, "juez"), "judge projection intent");
    await assertAllowed(databaseHost, namespace, `charropro/projectionOutbox/${tournamentA}/job/intent`, operator.token, projectionIntent(tournamentA, operator.uid, "operador"), "operator projection intent");
    await assertAllowed(databaseHost, namespace, `charropro/live/${tournamentA}/graphicsConfig`, graphics.token, { theme: "broadcast" }, "graphics editor");
    await assertDenied(databaseHost, namespace, `charropro/live/${tournamentB}/graphicsConfig`, graphics.token, { theme: "blocked" }, "graphics cross-tournament editor");
    await assertDenied(databaseHost, namespace, `charropro/tournaments/${tournamentA}/scores/graphic`, graphics.token, { total: 2 }, "graphics score write");
    await assertDenied(databaseHost, namespace, `charropro/tournaments/${tournamentA}/officialTimers/timer`, graphics.token, { revision: 1 }, "graphics timer control");
  } finally {
    for (const tournamentId of [tournamentA, tournamentB]) {
      await ownerDelete(databaseHost, namespace, `charropro/tournaments/${tournamentId}`);
      await ownerDelete(databaseHost, namespace, `charropro/projectionOutbox/${tournamentId}`);
      await ownerDelete(databaseHost, namespace, `charropro/live/${tournamentId}`);
    }
    for (const user of [judge, graphics, operator]) {
      await ownerDelete(databaseHost, namespace, `charropro/users/${user.uid}`);
      await ownerDelete(databaseHost, namespace, `charropro/userTournamentAccess/${user.uid}`);
      await deleteUser(authHost, user.token);
    }
  }
}

function profile(role, tournamentId) {
  return { active: true, role, tournamentAccess: "selected", tournamentIds: [tournamentId] };
}

function projectionIntent(tournamentId, uid, role) {
  const now = Date.now();
  return {
    outboxVersion: "1.0.0", payloadVersion: 1, projectionId: "job", idempotencyKey: `p0b:${uid}`,
    projectionType: "public_tournament_v3", tournamentId, charreadaId: "charreada", competitionId: "competition",
    sourceType: "published_score", sourceId: "source", scoreId: "score", attemptKey: "attempt", sourceRevision: 1,
    sourceFingerprint: "fingerprint", targetPath: `charropro/publicTournaments/${tournamentId}`,
    createdAt: new Date(now).toISOString(), createdAtMs: now, createdBy: { uid, name: role, role, clientId: "p0b" }
  };
}

function pendingScoreReview(tournamentId, uid) {
  return createPendingScoreReview({
    tournamentId,
    competitionId: "competition",
    charreadaId: "charreada",
    teamId: "team",
    participantId: "",
    participantScope: "team",
    suerteId: "cala",
    attemptIndex: 0,
    coleadorIndex: 0,
    scoreId: "score",
    reason: { code: "p0b", label: "P0-B", note: "" },
    draftSnapshot: { scorePayload: [{ base: 0 }] },
    metadata: {}
  }, {
    actor: { uid, name: "Juez", role: "juez", clientId: "p0b", tabSessionId: "p0b" },
    now: "2026-09-23T12:00:00.000Z"
  });
}

async function createUser(authHost, label) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=p0b-rules-test`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${label}@example.test`, password: "P0bRules-pass-123", returnSecureToken: true })
  });
  const value = await response.json();
  assert.equal(response.ok, true, JSON.stringify(value));
  return { uid: value.localId, token: value.idToken };
}

async function assertAllowed(host, namespace, path, token, value, label) {
  const result = await clientPut(host, namespace, path, token, value);
  assert.equal(result.status, 200, `${label}: ${result.body}`);
}

async function assertDenied(host, namespace, path, token, value, label) {
  const result = await clientPut(host, namespace, path, token, value);
  assert.ok([401, 403].includes(result.status), `${label}: expected Rules denial, got ${result.status}: ${result.body}`);
}

async function clientPut(host, namespace, path, token, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}&auth=${encodeURIComponent(token)}`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(value)
  });
  return { status: response.status, body: await response.text() };
}

async function ownerPut(host, namespace, path, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT", headers: { authorization: "Bearer owner", "content-type": "application/json" }, body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerDelete(host, namespace, path) {
  await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "DELETE", headers: { authorization: "Bearer owner" }
  });
}

async function deleteUser(authHost, token) {
  await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:delete?key=p0b-rules-test`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
}
