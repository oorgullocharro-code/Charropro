import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260912-portal-v2-home-reference-composition-live-cover-005-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260912-portal-v2-home-reference-composition-live-cover-005-v1";
import {
  createTournamentPublicSponsor,
  normalizeTournamentPublicBranding,
  normalizeTournamentPublicSponsors,
  tournamentPublicSponsorsRecord,
  validateTournamentPublicAssetFile
} from "../js/core/tournamentPublicBranding.js?v=20260912-portal-v2-home-reference-composition-live-cover-005-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260912-portal-v2-home-reference-composition-live-cover-005-v1";

const require = createRequire(import.meta.url);
const {
  TournamentPublicBrandingAssetError,
  prepareTournamentPublicBrandingAssetUpload,
  buildTournamentPublicBrandingAssetUrl
} = require("../functions/tournamentPublicBrandingAsset.js");

const coverUrl = assetUrl("brand-editorial", "branding/cover/cover-1.png");
const logoUrl = assetUrl("brand-editorial", "branding/logo/logo-1.webp");
const liveCoverUrl = assetUrl("brand-editorial", "branding/live-cover/live-cover-1.webp");
const sponsorUrl = assetUrl("brand-editorial", "sponsors/sponsor-c/sponsor-1.jpg");

assert.deepEqual(normalizeTournamentPublicBranding({ coverImageUrl: coverUrl, logoUrl, liveCoverImageUrl: liveCoverUrl, ignored: "x" }), { coverImageUrl: coverUrl, logoUrl, liveCoverImageUrl: liveCoverUrl });
assert.deepEqual(normalizeTournamentPublicBranding({ coverImageUrl: "https://example.test/not-authoritative.png" }), {});
assert.deepEqual(normalizeTournamentPublicBranding({ logoUrl, liveCoverImageUrl: "" }), { logoUrl }, "removing the live cover leaves no broken public URL");
assert.equal(validateTournamentPublicAssetFile({ type: "image/png", size: 100 }, "cover").ok, true);
assert.equal(validateTournamentPublicAssetFile({ type: "image/webp", size: 100 }, "liveCover").ok, true);
assert.equal(validateTournamentPublicAssetFile({ type: "image/svg+xml", size: 100 }, "cover").ok, false);
assert.equal(validateTournamentPublicAssetFile({ type: "image/png", size: 6 * 1024 * 1024 }, "cover").ok, false);

const sponsors = tournamentPublicSponsorsRecord([
  { sponsorId: "sponsor-b", name: "B", enabled: true, sortOrder: 20, tier: "oro", placement: "hero" },
  { sponsorId: "sponsor-a", name: "A", enabled: false, sortOrder: 10, tier: "plata", placement: "hero" },
  createTournamentPublicSponsor({ name: "C", enabled: true, sortOrder: 5, logoUrl: sponsorUrl }, { sponsorId: "sponsor-c" })
]);
assert.deepEqual(normalizeTournamentPublicSponsors(sponsors).map((item) => item.sponsorId), ["sponsor-c", "sponsor-a", "sponsor-b"]);
assert.deepEqual(Object.keys(sponsors).sort(), ["sponsor-a", "sponsor-b", "sponsor-c"]);

const source = {
  tournament: {
    info: {
      id: "brand-editorial",
      nombre: "Torneo Editorial",
      type: "equipos_completo",
      status: "en_vivo",
      publicBranding: { coverImageUrl: coverUrl, logoUrl, liveCoverImageUrl: liveCoverUrl },
      publicSponsors: sponsors
    },
    teams: [], participants: [], horses: [], charreadas: [], publishedScores: {}, officialScoreLedger: {}
  }
};
const options = { tournamentId: "brand-editorial", nowMs: Date.parse("2026-09-11T20:00:00.000Z") };
const browserProjection = buildBrowserProjection(source, options);
const functionProjection = buildFunctionProjection(source, options);
assert.deepEqual(functionProjection, browserProjection, "browser and Functions retain editorial V3 parity");
assert.equal(browserProjection.branding.coverImageUrl, coverUrl);
assert.equal(browserProjection.branding.logoUrl, logoUrl);
assert.equal(browserProjection.branding.liveCoverImageUrl, liveCoverUrl);
assert.deepEqual(browserProjection.sponsors.map((item) => item.id), ["sponsor-c", "sponsor-b"], "only active sponsors are published in canonical order");
assert.equal(browserProjection.sponsors.some((item) => item.id === "sponsor-a"), false);

const portal = createPortalV2Model(browserProjection, { availability: "ready", view: "inicio" });
assert.equal(portal.branding.coverImageUrl, coverUrl, "Portal uses the canonical cover image");
assert.equal(portal.branding.liveCoverImageUrl, liveCoverUrl, "Portal keeps the dedicated published live cover");
assert.deepEqual(portal.sponsors.map((item) => item.name), ["C", "B"], "Portal banner derives from active public sponsors, not a navigation module");

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const prepared = prepareTournamentPublicBrandingAssetUpload({
  tournamentId: "brand-editorial",
  kind: "sponsor",
  sponsorId: "sponsor-c",
  mimeType: "image/png",
  contentBase64: png.toString("base64")
});
assert.match(prepared.objectPath, /^charropro\/tournaments\/brand-editorial\/public\/sponsors\/sponsor-c\/\d+-[a-f0-9]{16}\.png$/);
assert.match(buildTournamentPublicBrandingAssetUrl("charropro-e8a68.firebasestorage.app", prepared.objectPath), /charropro%2Ftournaments%2Fbrand-editorial%2Fpublic%2Fsponsors%2Fsponsor-c%2F/);
const liveCoverUpload = prepareTournamentPublicBrandingAssetUpload({
  tournamentId: "brand-editorial",
  kind: "liveCover",
  mimeType: "image/png",
  contentBase64: png.toString("base64")
});
assert.match(liveCoverUpload.objectPath, /^charropro\/tournaments\/brand-editorial\/public\/branding\/live-cover\/\d+-[a-f0-9]{16}\.png$/);
assert.throws(() => prepareTournamentPublicBrandingAssetUpload({ tournamentId: "brand-editorial", kind: "cover", mimeType: "image/svg+xml", contentBase64: png.toString("base64") }), TournamentPublicBrandingAssetError);
assert.throws(() => prepareTournamentPublicBrandingAssetUpload({ tournamentId: "brand-editorial", kind: "logo", mimeType: "image/png", contentBase64: Buffer.from("not-an-image").toString("base64") }), TournamentPublicBrandingAssetError);

const [appSource, functionsSource, rtdbRules, storageRules] = await Promise.all([
  readFile(new URL("../js/app.js", import.meta.url), "utf8"),
  readFile(new URL("../functions/index.js", import.meta.url), "utf8"),
  readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8"),
  readFile(new URL("../storage.rules", import.meta.url), "utf8")
]);
assert.match(appSource, /\["publicBranding", "Portal público", "image"\]/);
assert.match(appSource, /view === "publicBranding"\) return role === ROLES\.SUPERVISOR/);
assert.match(appSource, /renderPublicBrandingAssetCard\("Portada En Vivo", "liveCover", branding\.liveCoverImageUrl\)/);
assert.match(appSource, /publicBrandingAssetField\(kind\)/);
assert.match(appSource, /uploadFirebaseTournamentPublicAsset/);
assert.match(functionsSource, /exports\.uploadCharroProTournamentPublicAsset = onCall/);
assert.match(functionsSource, /requireTournamentPublicBrandingEditor/);
assert.match(rtdbRules, /"publicBranding"/);
assert.match(rtdbRules, /liveCoverImageUrl/);
assert.match(rtdbRules, /"publicSponsors"/);
assert.match(rtdbRules, /\$other !== 'publicBranding'/);
assert.match(storageRules, /match \/charropro\/tournaments\/\{tournamentId\}\/public\/branding/);
assert.match(storageRules, /assetKind == 'live-cover'/);
assert.match(storageRules, /allow write: if false;/);

if (process.env.CHARROPRO_RUN_FIREBASE_EMULATOR === "1") await runCallableMatrix();

console.log("tournament-public-branding-editorial-authority.test.mjs: ok");

function assetUrl(tournamentId, suffix) {
  return `https://firebasestorage.googleapis.com/v0/b/charropro-e8a68.firebasestorage.app/o/charropro%2Ftournaments%2F${tournamentId}%2Fpublic%2F${encodeURIComponent(suffix).replace(/%2F/g, "%2F")}?alt=media`;
}

async function runCallableMatrix() {
  const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
  const functionsHost = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1:5001";
  const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
  const namespaces = [...new Set([`${projectId}-default-rtdb`, projectId])];
  const suffix = `${Date.now()}-${process.pid}`;
  const tournamentId = `branding-callable-${suffix}`;
  const foreignTournamentId = `branding-callable-foreign-${suffix}`;
  const supervisor = await createUser(authHost, `branding-callable-supervisor-${suffix}`);
  const operator = await createUser(authHost, `branding-callable-operator-${suffix}`);
  try {
    for (const namespace of namespaces) {
      await ownerPut(databaseHost, namespace, `charropro/users/${supervisor.uid}`, { active: true, role: "supervisor", tournamentAccess: "all", tournamentIds: [] });
      await ownerPut(databaseHost, namespace, `charropro/users/${operator.uid}`, { active: true, role: "operador", tournamentAccess: "all", tournamentIds: [] });
      await ownerPut(databaseHost, namespace, `charropro/tournaments/${tournamentId}/info`, { id: tournamentId, name: "Editorial callable" });
      await ownerPut(databaseHost, namespace, `charropro/tournaments/${foreignTournamentId}/info`, { id: foreignTournamentId, name: "Editorial foreign" });
    }
    const response = await call(functionsHost, projectId, supervisor.token, {
      tournamentId,
      kind: "liveCover",
      mimeType: "image/png",
      contentBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]).toString("base64")
    });
    assert.equal(response.status, 200, response.body);
    assert.equal(response.value?.result?.ok, true);
    assert.match(response.value.result.objectPath, new RegExp(`^charropro/tournaments/${tournamentId}/public/branding/live-cover/`));
    const directStorageWrite = await writeStorageObject(storageHost, projectId, supervisor.token, `charropro/tournaments/${tournamentId}/public/branding/live-cover/direct.png`);
    assert.ok([401, 403].includes(directStorageWrite.status), `direct client Storage writes remain denied: ${directStorageWrite.body}`);
    for (const namespace of namespaces) {
      await ownerPut(databaseHost, namespace, `charropro/users/${supervisor.uid}`, { active: true, role: "supervisor", tournamentAccess: "selected", tournamentIds: [tournamentId] });
    }
    const crossTournamentDenied = await call(functionsHost, projectId, supervisor.token, {
      tournamentId: foreignTournamentId,
      kind: "liveCover",
      mimeType: "image/png",
      contentBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]).toString("base64")
    });
    assert.equal(crossTournamentDenied.status, 403, crossTournamentDenied.body);
    const denied = await call(functionsHost, projectId, operator.token, {
      tournamentId,
      kind: "logo",
      mimeType: "image/png",
      contentBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]).toString("base64")
    });
    assert.equal(denied.status, 403, denied.body);
    const unauthenticated = await call(functionsHost, projectId, "", {
      tournamentId,
      kind: "liveCover",
      mimeType: "image/png",
      contentBase64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]).toString("base64")
    });
    assert.equal(unauthenticated.status, 401, unauthenticated.body);
  } finally {
    for (const namespace of namespaces) {
      await ownerDelete(databaseHost, namespace, `charropro/tournaments/${tournamentId}`);
      await ownerDelete(databaseHost, namespace, `charropro/tournaments/${foreignTournamentId}`);
      await ownerDelete(databaseHost, namespace, `charropro/users/${supervisor.uid}`);
      await ownerDelete(databaseHost, namespace, `charropro/users/${operator.uid}`);
    }
    await deleteUser(authHost, supervisor.token);
    await deleteUser(authHost, operator.token);
  }
}

async function call(host, projectId, token, data) {
  const response = await fetch(`http://${host}/${projectId}/us-central1/uploadCharroProTournamentPublicAsset`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ data })
  });
  const body = await response.text();
  return { status: response.status, body, value: body ? JSON.parse(body) : null };
}

async function writeStorageObject(host, projectId, token, objectPath) {
  const response = await fetch(`http://${host}/v0/b/${encodeURIComponent(`${projectId}.appspot.com`)}/o?name=${encodeURIComponent(objectPath)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "image/png" },
    body: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  });
  return { status: response.status, body: await response.text() };
}

async function createUser(host, label) {
  const response = await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local-public-branding-callable`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${label}@example.test`, password: "LocalCallable-pass-123", returnSecureToken: true })
  });
  const body = await response.text();
  assert.equal(response.ok, true, body);
  const value = JSON.parse(body);
  return { uid: value.localId, token: value.idToken };
}

async function deleteUser(host, token) {
  await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:delete?key=local-public-branding-callable`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token })
  });
}

async function ownerPut(host, namespace, path, value) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, {
    method: "PUT", headers: { authorization: "Bearer owner", "content-type": "application/json" }, body: JSON.stringify(value)
  });
  assert.equal(response.ok, true, await response.text());
}

async function ownerDelete(host, namespace, path) {
  const response = await fetch(`http://${host}/${path}.json?ns=${encodeURIComponent(namespace)}`, { method: "DELETE", headers: { authorization: "Bearer owner" } });
  assert.equal(response.ok, true, await response.text());
}
