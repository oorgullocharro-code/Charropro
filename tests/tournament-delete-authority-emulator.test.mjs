import assert from "node:assert/strict";

const authHost = process.env.CHARROPRO_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const databaseHost = process.env.CHARROPRO_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
const functionsHost = process.env.CHARROPRO_FUNCTIONS_EMULATOR_HOST || "127.0.0.1:5001";
const projectId = process.env.GCLOUD_PROJECT || "demo-charropro-local";
const namespace = projectId;
const suffix = `delete-${Date.now().toString(36)}`;
const tournamentId = `tournament-${suffix}`;
const historyTournamentId = `history-${suffix}`;
const invalidRevisionTournamentId = `invalid-revision-${suffix}`;
const untouchedTournamentId = `untouched-${suffix}`;
const supervisor = await createUser(`supervisor-${suffix}@example.test`, "supervisor");
const judge = await createUser(`judge-${suffix}@example.test`, "juez");
const operator = await createUser(`operator-${suffix}@example.test`, "operador");
const platformAdmin = await createUser(`platform-admin-${suffix}@example.test`, "supervisor");

try {
  await ownerWrite(`charropro/users/${supervisor.localId}`, profile("supervisor"));
  await ownerWrite(`charropro/users/${judge.localId}`, profile("juez"));
  await ownerWrite(`charropro/users/${operator.localId}`, profile("operador"));
  await ownerWrite(`charropro/users/${platformAdmin.localId}`, profile("supervisor", { platformAdmin: true, tenantId: "tenant-other", organizationId: "org-other" }));
  await ownerWrite(`charropro/userTournamentAccess/${judge.localId}`, { [tournamentId]: true });
  await ownerWrite(`charropro/tournaments/${tournamentId}`, tournament(tournamentId, 4));
  await ownerWrite(`charropro/tournamentIndex/${tournamentId}`, { id: tournamentId, name: "Borrado Emulator" });
  await ownerWrite(`charropro/live/${tournamentId}`, { current: { tournamentId } });
  await ownerWrite(`charropro/publicTournaments/${tournamentId}`, { metadata: { tournamentId } });
  await ownerWrite(`charropro/projectionOutbox/${tournamentId}`, { projection_a: { state: { status: "PENDING" } } });
  await ownerWrite(`charropro/judges/assignments/${tournamentId}`, { charreada_a: { [judge.localId]: true } });
  await ownerWrite("charropro/judges/events", { [`event-${suffix}`]: { tournamentId, type: "ASSIGNED" } });
  await ownerWrite(`charropro/broadcastStudio/sessions/session-${suffix}`, { context: { tournamentId } });
  await ownerWrite(`charropro/tournaments/${untouchedTournamentId}`, tournament(untouchedTournamentId, 2));
  await ownerWrite(`charropro/tournaments/${invalidRevisionTournamentId}`, tournament(invalidRevisionTournamentId, "NaN"));

  const preflight = await call(supervisor.idToken, { operation: "preflight", tournamentId });
  assert.equal(preflight.ok, true, JSON.stringify(preflight.body));
  assert.equal(preflight.body.result.preflight.revision, 4);
  assert.equal(preflight.body.result.preflight.userAccessCount, 1);
  assert.equal(preflight.body.result.preflight.broadcastRefsCount, 1);

  const denied = await call(judge.idToken, { operation: "preflight", tournamentId });
  assert.equal(denied.ok, false);
  assert.equal(denied.body.error.status, "PERMISSION_DENIED");
  const operatorDenied = await call(operator.idToken, { operation: "preflight", tournamentId });
  assert.equal(operatorDenied.ok, false);
  assert.equal(operatorDenied.body.error.status, "PERMISSION_DENIED");
  const platformPreflight = await call(platformAdmin.idToken, { operation: "preflight", tournamentId });
  assert.equal(platformPreflight.ok, true, JSON.stringify(platformPreflight.body));
  const unauthenticated = await call("", { operation: "preflight", tournamentId });
  assert.equal(unauthenticated.ok, false);
  assert.equal(unauthenticated.body.error.status, "UNAUTHENTICATED");

  const stale = await call(supervisor.idToken, request(3));
  assert.equal(stale.ok, true);
  assert.equal(stale.body.result.code, "tournament-delete-stale-revision");

  const deleted = await call(supervisor.idToken, request(4));
  assert.equal(deleted.ok, true, JSON.stringify(deleted.body));
  assert.equal(deleted.body.result.deleted, true);
  assert.ok(deleted.body.result.backupId);
  assert.equal(await ownerRead(`charropro/tournaments/${tournamentId}`), null);
  assert.equal(await ownerRead(`charropro/live/${tournamentId}`), null);
  assert.equal(await ownerRead(`charropro/judges/events/event-${suffix}`), null);
  assert.equal(await ownerRead(`charropro/broadcastStudio/sessions/session-${suffix}`), null);
  assert.equal(await ownerRead(`charropro/userTournamentAccess/${judge.localId}/${tournamentId}`), null);

  const replay = await call(supervisor.idToken, request(4));
  assert.equal(replay.ok, true, JSON.stringify(replay.body));
  assert.equal(replay.body.result.idempotentReplay, true);
  assert.deepEqual(replay.body.result.affectedPaths, deleted.body.result.affectedPaths);

  await ownerWrite(`charropro/tournaments/${historyTournamentId}`, { ...tournament(historyTournamentId, 0), publishedScores: { official_a: { id: "official_a" } } });
  const historical = await call(supervisor.idToken, { operation: "preflight", tournamentId: historyTournamentId });
  assert.equal(historical.ok, true);
  assert.deepEqual(historical.body.result.preflight.blockingReasons, ["tournament-has-official-history"]);
  const blocked = await call(supervisor.idToken, {
    operation: "delete",
    tournamentId: historyTournamentId,
    expectedRevision: 0,
    idempotencyKey: `delete:${historyTournamentId}:request-0001`
  });
  assert.equal(blocked.ok, true);
  assert.equal(blocked.body.result.code, "tournament-has-official-history");
  assert.notEqual(await ownerRead(`charropro/tournaments/${historyTournamentId}`), null);
  const invalidRevision = await call(supervisor.idToken, { operation: "preflight", tournamentId: invalidRevisionTournamentId });
  assert.equal(invalidRevision.ok, true);
  assert.equal(invalidRevision.body.result.preflight.revision, null);
  assert.deepEqual(invalidRevision.body.result.preflight.blockingReasons, ["tournament-delete-revision-invalid"]);
  assertNoNonFiniteNumber(invalidRevision.body);
  assert.notEqual(await ownerRead(`charropro/tournaments/${invalidRevisionTournamentId}`), null);
  assert.notEqual(await ownerRead(`charropro/tournaments/${untouchedTournamentId}`), null);
  console.log("tournament deletion authority emulator tests passed");
} finally {
  await ownerDelete(`charropro/tournaments/${tournamentId}`);
  await ownerDelete(`charropro/tournaments/${historyTournamentId}`);
  await ownerDelete(`charropro/tournaments/${invalidRevisionTournamentId}`);
  await ownerDelete(`charropro/tournaments/${untouchedTournamentId}`);
  await ownerDelete(`charropro/tournamentIndex/${tournamentId}`);
  await ownerDelete(`charropro/live/${tournamentId}`);
  await ownerDelete(`charropro/publicTournaments/${tournamentId}`);
  await ownerDelete(`charropro/projectionOutbox/${tournamentId}`);
  await ownerDelete(`charropro/judges/assignments/${tournamentId}`);
  await ownerDelete(`charropro/broadcastStudio/sessions/session-${suffix}`);
  await ownerDelete(`charropro/userTournamentAccess/${judge.localId}`);
  await ownerDelete(`charropro/users/${supervisor.localId}`);
  await ownerDelete(`charropro/users/${judge.localId}`);
  await ownerDelete(`charropro/users/${operator.localId}`);
  await ownerDelete(`charropro/users/${platformAdmin.localId}`);
  await ownerDelete(`charropro/judges/events/event-${suffix}`);
  try { await deleteUser(supervisor.idToken); } catch {}
  try { await deleteUser(judge.idToken); } catch {}
  try { await deleteUser(operator.idToken); } catch {}
  try { await deleteUser(platformAdmin.idToken); } catch {}
}

function profile(role, overrides = {}) {
  return { active: true, role, name: role, tenantId: "tenant-delete", organizationId: "org-delete", tournamentAccess: "all", tournamentIds: [], ...overrides };
}

function tournament(id, version) {
  return { info: { id, name: "Borrado Emulator", tenantId: "tenant-delete", organizationId: "org-delete", status: "borrador" }, meta: { version }, charreadas: [], teams: [], scores: {}, publishedScores: {} };
}

function request(expectedRevision) {
  return { operation: "delete", tournamentId, expectedRevision, idempotencyKey: `delete:${tournamentId}:request-0001` };
}

function assertNoNonFiniteNumber(value) {
  if (typeof value === "number") {
    assert.equal(Number.isFinite(value), true);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach(assertNoNonFiniteNumber);
}

async function createUser(email, role) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-delete-test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "test-pass-123", returnSecureToken: true })
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function deleteUser(token) {
  await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:delete?key=local-delete-test`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
}

async function call(token, data) {
  const response = await fetch(`http://${functionsHost}/${projectId}/us-central1/deleteCharroProTournament`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ data })
  });
  return { ok: response.ok, body: await response.json() };
}

async function ownerWrite(path, value) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT", headers: { authorization: "Bearer owner", "content-type": "application/json" }, body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerRead(path) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, { headers: { authorization: "Bearer owner" } });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  return JSON.parse(body);
}

async function ownerDelete(path) {
  const response = await fetch(`http://${databaseHost}/${path}.json?ns=${encodeURIComponent(namespace)}`, { method: "DELETE", headers: { authorization: "Bearer owner" } });
  assert.equal(response.ok, true, await response.text());
}
