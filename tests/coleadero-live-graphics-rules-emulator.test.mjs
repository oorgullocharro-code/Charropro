import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rules = JSON.parse(await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8")).rules.charropro;
assert.match(rules.live.$tournamentId.current[".write"], /supervisor/);
assert.match(rules.live.$tournamentId.coleadero[".write"], /supervisor/);
assert.equal(rules.live.$tournamentId.current[".validate"], undefined, "live/current has no schema relaxation hidden in this ticket");

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") await runEmulatorMatrix();

console.log("coleadero-live-graphics-rules-emulator.test.mjs: ok");

async function runEmulatorMatrix() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `coleadero-live-${suffix}`;
  const supervisor = await createUser(authHost, `coleadero-live-${suffix}`);

  try {
    await ownerPut(databaseHost, namespace, `charropro/users/${supervisor.uid}`, {
      active: true,
      role: "supervisor",
      tournamentAccess: "all"
    });
    const payload = {
      participantScope: "individual",
      charreada: { id: "lote-uno", name: "Lote Uno" },
      currentParticipantId: "participant-cuatro",
      currentIndex: 3,
      participantCount: 7,
      opportunitiesPerParticipant: 3,
      rows: [{
        participantId: "participant-cuatro",
        participantName: "Participante Cuatro",
        horseId: "horse-cuatro",
        horseName: "Caballo Cuatro",
        turn: 4,
        active: true,
        opportunities: [
          { opportunityNumber: 1, officialPoints: 0, status: "OFFICIAL" },
          { opportunityNumber: 3, officialPoints: 10, status: "OFFICIAL" }
        ],
        officialTotal: 10
      }]
    };
    assert.equal((await clientPut(databaseHost, namespace, `charropro/live/${tournamentId}/current/coleadero`, supervisor.token, payload)).status, 200, "authorized live/current Coleadero payload is allowed without a Rules change");
    assertDenied(await clientPut(databaseHost, namespace, `charropro/live/${tournamentId}/current/coleadero`, "", payload), "anonymous live/current Coleadero write");
  } finally {
    await ownerDelete(databaseHost, namespace, `charropro/live/${tournamentId}`);
    await ownerDelete(databaseHost, namespace, `charropro/users/${supervisor.uid}`);
    await deleteUser(authHost, supervisor.token);
  }
}

async function createUser(authHost, label) {
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-coleadero-live`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${label}@example.test`, password: "LocalColeadero-pass-123", returnSecureToken: true })
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  const value = JSON.parse(body);
  return { uid: value.localId, token: value.idToken };
}

async function deleteUser(authHost, token) {
  await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:delete?key=local-coleadero-live`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
}

async function clientPut(host, namespace, path, token, value) {
  const auth = token ? `&auth=${encodeURIComponent(token)}` : "";
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}${auth}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  return { status: response.status, body: await response.text() };
}

async function ownerPut(host, namespace, path, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT",
    headers: { authorization: "Bearer owner", "content-type": "application/json" },
    body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerDelete(host, namespace, path) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "DELETE",
    headers: { authorization: "Bearer owner" }
  });
  assert.equal(response.ok, true, await response.text());
}

function assertDenied(result, label) {
  assert.ok([401, 403].includes(result.status), `${label} must be denied; got ${result.status}: ${result.body}`);
}
