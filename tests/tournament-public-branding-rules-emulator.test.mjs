import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rawRules = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const infoRules = JSON.parse(rawRules).rules.charropro.tournaments.$tournamentId.info;

assert.match(infoRules.publicBranding[".write"], /role'\)\.val\(\) === 'supervisor'/);
assert.match(infoRules.publicSponsors[".write"], /role'\)\.val\(\) === 'supervisor'/);
assert.match(infoRules.publicSponsors.$sponsorId[".validate"], /sponsorId'\)\.val\(\) === \$sponsorId/);
assert.match(infoRules.publicBranding.$field[".validate"], /charropro%2Ftournaments%2F/);

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") await runRulesMatrix();
console.log("tournament-public-branding-rules-emulator.test.mjs: ok");

async function runRulesMatrix() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const namespace = `${projectId}-default-rtdb`;
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `branding-rules-${suffix}`;
  const supervisor = await createUser(authHost, `branding-supervisor-${suffix}`);
  const operator = await createUser(authHost, `branding-operator-${suffix}`);
  try {
    await ownerPut(databaseHost, namespace, `charropro/users/${supervisor.uid}`, userProfile("supervisor"));
    await ownerPut(databaseHost, namespace, `charropro/users/${operator.uid}`, userProfile("operador"));
    await ownerPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info`, { id: tournamentId, name: "Branding rules" });
    const coverUrl = assetUrl(tournamentId, "branding/cover/asset.png");
    const brandingWrite = await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info/publicBranding`, supervisor.token, { coverImageUrl: coverUrl });
    assert.equal(brandingWrite.status, 200, `supervisor may write an allowed editorial reference: ${brandingWrite.body}`);
    assertDenied(await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info/publicBranding`, operator.token, { coverImageUrl: coverUrl }), "operator editorial write");
    assertDenied(await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info/publicBranding`, supervisor.token, { coverImageUrl: "https://example.test/cover.png" }), "foreign asset URL");
    const sponsor = { sponsorId: "sponsor-a", name: "Patrocinador A", enabled: true, sortOrder: 1, tier: "oro", placement: "hero", logoUrl: assetUrl(tournamentId, "sponsors/sponsor-a/logo.png") };
    assert.equal((await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info/publicSponsors/sponsor-a`, supervisor.token, sponsor)).status, 200, "supervisor may write a matching sponsor identity");
    assertDenied(await clientPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info/publicSponsors/other-key`, supervisor.token, sponsor), "sponsor identity mismatch");
  } finally {
    await ownerDelete(databaseHost, namespace, `charropro/tournaments/${tournamentId}`);
    await ownerDelete(databaseHost, namespace, `charropro/users/${supervisor.uid}`);
    await ownerDelete(databaseHost, namespace, `charropro/users/${operator.uid}`);
    await deleteUser(authHost, supervisor.token);
    await deleteUser(authHost, operator.token);
  }
}

function assetUrl(tournamentId, suffix) {
  return `https://firebasestorage.googleapis.com/v0/b/charropro-e8a68.firebasestorage.app/o/charropro%2Ftournaments%2F${tournamentId}%2Fpublic%2F${encodeURIComponent(suffix).replace(/%2F/g, "%2F")}?alt=media`;
}
function userProfile(role) { return { active: true, role, tournamentAccess: "all", tournamentIds: [] }; }
async function createUser(host, label) {
  const response = await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-public-branding`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `${label}@example.test`, password: "LocalRules-pass-123", returnSecureToken: true }) });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  const value = JSON.parse(body);
  return { uid: value.localId, token: value.idToken };
}
async function deleteUser(host, token) { await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:delete?key=local-public-branding`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token }) }); }
async function clientPut(host, namespace, path, token, value) { return clientWrite(host, namespace, path, token, "PUT", value); }
async function clientWrite(host, namespace, path, token, method, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}&auth=${encodeURIComponent(token)}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
  return { status: response.status, body: await response.text() };
}
async function ownerPut(host, namespace, path, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, { method: "PUT", headers: { authorization: "Bearer owner", "content-type": "application/json" }, body: JSON.stringify(value) });
  assert.equal(response.ok, true, await response.text());
}
async function ownerDelete(host, namespace, path) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, { method: "DELETE", headers: { authorization: "Bearer owner" } });
  assert.equal(response.ok, true, await response.text());
}
function assertDenied(result, label) { assert.ok([401, 403].includes(result.status), `${label} must be denied; got ${result.status}: ${result.body}`); }
