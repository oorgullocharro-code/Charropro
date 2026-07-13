import assert from "node:assert/strict";
import {
  ASSET_MANAGER_VERSION,
  ASSET_SCOPES,
  ASSET_STATUSES,
  ASSET_TYPES,
  ASSET_VARIANT_TYPES,
  ASSET_VISIBILITIES,
  addBroadcastAssetVariant,
  archiveBroadcastAsset,
  buildBroadcastAssetManifest,
  cloneBroadcastAsset,
  createBroadcastAsset,
  createBroadcastAssetVersion,
  deprecateBroadcastAsset,
  getBroadcastAsset,
  getBroadcastAssetWarnings,
  listBroadcastAssets,
  normalizeBroadcastAsset,
  registerBroadcastAsset,
  removeBroadcastAsset,
  removeBroadcastAssetVariant,
  resolveBroadcastAsset,
  resolveBroadcastAssetVariant,
  restoreBroadcastAsset,
  setBroadcastAssetRights,
  setBroadcastAssetScope,
  setBroadcastAssetStatus,
  setBroadcastAssetVisibility,
  updateBroadcastAsset,
  validateBroadcastAsset,
  validateBroadcastAssetManifest,
  validateBroadcastAssetVariant
} from "../js/broadcast/assetManager.js";

const T0 = "2026-07-13T12:00:00.000Z";
const T1 = "2026-07-13T12:01:00.000Z";
const T2 = "2026-07-13T12:02:00.000Z";
const FUTURE = "2027-07-13T12:00:00.000Z";
const SOON = "2026-07-20T12:00:00.000Z";
const PAST = "2026-07-12T12:00:00.000Z";
const SHA256 = "a".repeat(64);

function expectCode(callback, code) {
  assert.throws(callback, (error) => error?.code === code, `Expected error code ${code}`);
}

function assetDefinition(overrides = {}) {
  return {
    assetId: "asset_logo_org",
    name: "Logo de organizacion",
    type: "logo",
    mimeType: "image/png",
    extension: "png",
    status: "draft",
    visibility: "production",
    scope: "organization",
    tenantId: "tenant_1",
    organizationId: "org_1",
    ownerId: "owner_1",
    storageRef: "broadcast/assets/logo-org.png",
    checksum: SHA256,
    checksumAlgorithm: "sha256",
    dimensions: { width: 1920, height: 1080, hasAlpha: true },
    rights: {
      owner: "Orgullo Charro",
      licenseType: "owned",
      validFrom: T0,
      validUntil: FUTURE,
      broadcastUse: true,
      commercialUse: true,
      publicDisplay: true,
      derivativesAllowed: true
    },
    tags: ["Branding", "branding"],
    categories: ["scoreboard"],
    ...overrides
  };
}

function createAsset(overrides = {}, options = {}) {
  return createBroadcastAsset(assetDefinition(overrides), { now: T0, ...options });
}

function publish(asset, now = T1) {
  const approved = asset.status === "approved" ? asset : setBroadcastAssetStatus(asset, "approved", { now: T0 });
  return setBroadcastAssetStatus(approved, "published", { now });
}

function registerMany(definitions, options = {}) {
  return definitions.reduce(
    (registry, definition) => registerBroadcastAsset(registry, definition, { now: T1, ...options }),
    {}
  );
}

assert.equal(ASSET_MANAGER_VERSION, "1.0.0");
assert.deepEqual(ASSET_VISIBILITIES, ["public", "production", "operational", "restricted"]);
assert.deepEqual(ASSET_SCOPES, [
  "global", "tenant", "organization", "client", "tournament", "competition", "charreada",
  "output", "user", "session"
]);
for (const type of ["image", "logo", "video", "font", "sponsor", "lower_third", "stinger", "custom"]) {
  assert.ok(ASSET_TYPES.includes(type));
}
for (const status of ["draft", "published", "deprecated", "archived", "expired", "revoked", "error"]) {
  assert.ok(ASSET_STATUSES.includes(status));
}
for (const variant of ["thumbnail", "landscape", "portrait", "led", "preview", "program", "original"]) {
  assert.ok(ASSET_VARIANT_TYPES.includes(variant));
}

// Creation fixtures cover the initial technical types without mutating definitions.
const creationFixtures = [
  assetDefinition({ assetId: "fixture_image", type: "image", mimeType: "image/webp" }),
  assetDefinition({ assetId: "fixture_logo" }),
  assetDefinition({
    assetId: "fixture_video",
    type: "video",
    mimeType: "video/mp4",
    extension: "mp4",
    duration: 12.5,
    frameRate: 29.97,
    codec: "h264",
    hasAudio: false
  }),
  assetDefinition({
    assetId: "fixture_font",
    type: "font",
    mimeType: "font/woff2",
    extension: "woff2",
    dimensions: null,
    font: {
      family: "Charro Sans",
      style: "normal",
      weight: "700",
      format: "woff2",
      license: "commercial",
      supportedCharacters: ["latin"]
    }
  }),
  assetDefinition({
    assetId: "fixture_sponsor",
    type: "sponsor",
    sponsor: {
      sponsorId: "sponsor_1",
      sponsorName: "Patrocinador Uno",
      campaignId: "campaign_1",
      priority: 10,
      competitionIds: ["equipos_completo"],
      outputIds: ["program_1"]
    }
  })
];
for (const fixture of creationFixtures) {
  const inputCopy = structuredClone(fixture);
  const asset = createBroadcastAsset(fixture, { now: T0, actor: { userId: "operator_1", name: "Operador" } });
  assert.deepEqual(fixture, inputCopy);
  assert.equal(validateBroadcastAsset(asset).valid, true, `${fixture.assetId} should be valid`);
  assert.equal(asset.createdAt, T0);
  assert.equal(asset.createdBy.userId, "operator_1");
  assert.equal(asset.assetFamilyId, fixture.assetFamilyId || fixture.assetId);
}

const explicitFamily = createAsset({ assetId: "asset_family_version_1", assetFamilyId: "asset_family_logo" });
assert.equal(explicitFamily.assetFamilyId, "asset_family_logo");
assert.throws(
  () => createBroadcastAsset(assetDefinition({ assetId: "family_missing_later", version: "1.0.1" }), { now: T0 }),
  (error) => error?.code === "asset-invalid" && error?.details?.errors?.includes("asset-family-id-invalid")
);

const falsey = createAsset({
  assetId: "fixture_falsey",
  description: "",
  fileSize: 0,
  duration: 0,
  hasAlpha: false,
  hasAudio: false,
  metadata: { order: 0, enabled: false, label: "" }
});
assert.equal(falsey.description, "");
assert.equal(falsey.fileSize, 0);
assert.equal(falsey.duration, 0);
assert.equal(falsey.hasAlpha, false);
assert.deepEqual(falsey.metadata, { order: 0, enabled: false, label: "" });

// Validation rejects malformed identities, versions, sources, dates and incompatible formats.
const invalidCases = [
  [assetDefinition({ assetId: "" }), "asset-id-invalid"],
  [assetDefinition({ type: "unknown" }), "asset-type-invalid"],
  [assetDefinition({ type: "video", mimeType: "image/png" }), "asset-mime-type-incompatible"],
  [assetDefinition({ version: "v1" }), "asset-version-invalid"],
  [assetDefinition({ externalUrl: "javascript:alert(1)", storageRef: null }), "asset-external-url-javascript-forbidden"],
  [assetDefinition({ externalUrl: "file:///tmp/logo.png", storageRef: null }), "asset-external-url-file-forbidden"],
  [assetDefinition({ externalUrl: "data:image/png;base64,abc", storageRef: null }), "asset-external-url-data-forbidden"]
];
for (const [definition, expectedError] of invalidCases) {
  const normalized = normalizeBroadcastAsset(definition, { now: T0 });
  assert.ok(validateBroadcastAsset(normalized).errors.includes(expectedError), expectedError);
}
const invalidRevision = createAsset({ assetId: "invalid_revision" });
invalidRevision.revision = -1;
assert.ok(validateBroadcastAsset(invalidRevision).errors.includes("asset-revision-invalid"));
const invalidDate = createAsset({ assetId: "invalid_date" });
invalidDate.createdAt = "not-a-date";
assert.ok(validateBroadcastAsset(invalidDate).errors.includes("asset-createdAt-invalid"));
assert.ok(validateBroadcastAsset(normalizeBroadcastAsset(assetDefinition({
  externalUrl: "https://cdn.example.com/logo.png",
  storageRef: null
}), { now: T0 })).errors.includes("asset-external-url-policy-required"));
assert.ok(validateBroadcastAsset(normalizeBroadcastAsset(assetDefinition({
  assetId: "invalid_sponsor_url",
  type: "sponsor",
  sponsor: { sponsorId: "sponsor_1", sponsorName: "Sponsor", clickUrl: "file:///tmp/unsafe" }
}), { now: T0 })).errors.includes("asset-sponsor-click-url-forbidden"));
assert.equal(validateBroadcastAsset(createBroadcastAsset(assetDefinition({
  externalUrl: "https://cdn.example.com/logo.png",
  storageRef: null,
  metadata: { externalUrlPolicyApproved: true }
}), { now: T0 })).valid, true);

// Registration is immutable, serializable and isolated by tenant.
const draft = createAsset();
const emptyRegistry = {};
let registry = registerBroadcastAsset(emptyRegistry, draft, { now: T0 });
assert.deepEqual(emptyRegistry, {});
assert.equal(registry.revision, 1);
assert.equal(getBroadcastAsset(registry, draft.assetId).assetId, draft.assetId);
const defensive = getBroadcastAsset(registry, draft.assetId);
defensive.name = "Mutado afuera";
assert.equal(getBroadcastAsset(registry, draft.assetId).name, "Logo de organizacion");
expectCode(() => registerBroadcastAsset(registry, draft, { now: T1 }), "asset-version-duplicate");
expectCode(() => registerBroadcastAsset(registry, assetDefinition({ tenantId: "tenant_2" }), {
  now: T1,
  updateExisting: true
}), "asset-tenant-conflict");

const registryBeforeUpdate = structuredClone(registry);
const updatedRegistry = updateBroadcastAsset(registry, draft.assetId, {
  description: "",
  fileSize: 0,
  metadata: { enabled: false, label: "" }
}, { now: T1, expectedRevision: 0, actor: "operator_2" });
assert.deepEqual(registry, registryBeforeUpdate);
const updatedAsset = getBroadcastAsset(updatedRegistry, draft.assetId);
assert.equal(updatedAsset.description, "");
assert.equal(updatedAsset.fileSize, 0);
assert.equal(updatedAsset.metadata.enabled, false);
assert.equal(updatedAsset.revision, 1);
assert.equal(updatedAsset.createdAt, T0);
assert.equal(updatedAsset.updatedAt, T1);
expectCode(() => updateBroadcastAsset(updatedRegistry, draft.assetId, { name: "No aplica" }, {
  expectedRevision: 0,
  now: T2
}), "asset-expected-revision-mismatch");
for (const field of ["assetId", "assetFamilyId", "tenantId", "version", "revision", "createdAt", "checksum"]) {
  const baseline = structuredClone(updatedRegistry);
  expectCode(() => updateBroadcastAsset(updatedRegistry, draft.assetId, { [field]: "forbidden", name: "No aplica" }), `asset-patch-field-forbidden:${field}`);
  assert.deepEqual(updatedRegistry, baseline);
}

const published = publish(createAsset({ assetId: "asset_published" }));
registry = registerBroadcastAsset({}, published, { now: T1 });
expectCode(() => updateBroadcastAsset(registry, published.assetId, { name: "Sobrescrito" }), "asset-version-published-immutable");
expectCode(() => registerBroadcastAsset(registry, published, { updateExisting: true }), "asset-version-published-immutable");

const duplicateChecksumRegistry = registerMany([
  createAsset({ assetId: "checksum_original" }),
  createAsset({ assetId: "checksum_duplicate" })
]);
assert.ok(getBroadcastAsset(duplicateChecksumRegistry, "checksum_duplicate").warnings.some((warning) => (
  warning.startsWith("asset-probable-duplicate-checksum:checksum_original@")
)));

// Physical changes produce a new semantic version and never mutate the published source.
const publishedCopy = structuredClone(published);
const version2 = createBroadcastAssetVersion(published, {
  version: "1.1.0",
  name: "Logo actualizado",
  storageRef: "broadcast/assets/logo-org-v2.png",
  checksum: "b".repeat(64),
  changelog: "Nueva composicion del logotipo"
}, { now: T2, actor: { userId: "designer_1", role: "production" } });
assert.deepEqual(published, publishedCopy);
assert.equal(version2.assetId, published.assetId);
assert.equal(version2.assetFamilyId, published.assetFamilyId);
assert.equal(version2.version, "1.1.0");
assert.equal(version2.parentVersion, "1.0.0");
assert.equal(version2.previousVersion, "1.0.0");
assert.equal(version2.status, "draft");
assert.equal(version2.revision, 0);
assert.equal(version2.createdBy.userId, "designer_1");
assert.deepEqual(version2.variants, []);
expectCode(() => createBroadcastAssetVersion(published, { version: "1.0.0" }), "asset-version-not-incremented");
expectCode(() => createBroadcastAssetVersion(published, { assetId: "other_asset" }), "asset-version-field-forbidden:assetId");
expectCode(() => createBroadcastAssetVersion(published, { assetFamilyId: "other_family" }), "asset-version-field-forbidden:assetFamilyId");

let familyRegistry = registerBroadcastAsset({}, createAsset({
  assetId: "asset_family_conflict",
  assetFamilyId: "family_a"
}), { now: T0 });
expectCode(() => registerBroadcastAsset(familyRegistry, createAsset({
  assetId: "asset_family_conflict",
  assetFamilyId: "family_b",
  version: "1.0.1"
}), { now: T1 }), "asset-family-conflict");

// Variants remain independent, validated and selected deterministically.
let variantAsset = createAsset({ assetId: "asset_variants" });
variantAsset = addBroadcastAssetVariant(variantAsset, {
  variantId: "variant_program_landscape",
  type: "program",
  name: "Program horizontal",
  storageRef: "broadcast/assets/logo-program.webp",
  mimeType: "image/webp",
  extension: "webp",
  width: 1920,
  height: 1080,
  checksum: "c".repeat(64),
  checksumAlgorithm: "sha256",
  status: "approved",
  visibility: "production",
  outputTypes: ["program"],
  orientation: "landscape"
}, { now: T1 });
variantAsset = addBroadcastAssetVariant(variantAsset, {
  variantId: "variant_mobile_portrait",
  type: "mobile",
  name: "Movil vertical",
  storageRef: "broadcast/assets/logo-mobile.webp",
  mimeType: "image/webp",
  extension: "webp",
  width: 1080,
  height: 1920,
  checksum: "d".repeat(64),
  checksumAlgorithm: "sha256",
  status: "approved",
  visibility: "production",
  outputTypes: ["mobile"],
  orientation: "portrait"
}, { now: T2 });
assert.equal(variantAsset.variants.length, 2);
assert.equal(validateBroadcastAssetVariant(variantAsset.variants[0], { asset: variantAsset }).valid, true);
const programVariant = resolveBroadcastAssetVariant(variantAsset, {
  type: "program",
  outputType: "program",
  orientation: "landscape"
}, { visibility: "production" });
assert.equal(programVariant.variant.variantId, "variant_program_landscape");
const mobileVariant = resolveBroadcastAssetVariant(variantAsset, {
  type: "mobile",
  outputType: "mobile",
  orientation: "portrait"
}, { visibility: "production" });
assert.equal(mobileVariant.variant.variantId, "variant_mobile_portrait");
expectCode(() => addBroadcastAssetVariant(variantAsset, variantAsset.variants[0]), "asset-variant-id-duplicate");
expectCode(() => addBroadcastAssetVariant(variantAsset, {
  ...variantAsset.variants[0],
  variantId: "variant_equivalent"
}), "asset-variant-equivalent-duplicate");
const withoutMobile = removeBroadcastAssetVariant(variantAsset, "variant_mobile_portrait", { now: T2 });
assert.equal(withoutMobile.variants.length, 1);
expectCode(() => removeBroadcastAssetVariant(variantAsset, "variant_program_landscape", {
  references: [{ assetId: variantAsset.assetId, variantId: "variant_program_landscape" }]
}), "asset-variant-referenced");

let originalAsset = createAsset({ assetId: "asset_original_variant" });
originalAsset = addBroadcastAssetVariant(originalAsset, {
  variantId: "variant_original",
  type: "original",
  name: "Original",
  storageRef: "broadcast/assets/original.png",
  mimeType: "image/png",
  extension: "png",
  width: 1920,
  height: 1080,
  checksum: "9".repeat(64),
  checksumAlgorithm: "sha256",
  status: "approved",
  visibility: "production"
}, { now: T1 });
const originalAssetCopy = structuredClone(originalAsset);
expectCode(() => removeBroadcastAssetVariant(originalAsset, "variant_original", { now: T2 }), "original-variant-removal-forbidden");
assert.deepEqual(originalAsset, originalAssetCopy);
expectCode(() => addBroadcastAssetVariant(originalAsset, {
  variantId: "variant_original_second",
  type: "original",
  name: "Segundo original",
  storageRef: "broadcast/assets/original-2.png",
  mimeType: "image/png",
  width: 1280,
  height: 720,
  checksum: "8".repeat(64),
  checksumAlgorithm: "sha256",
  status: "approved",
  visibility: "production"
}), "original-variant-duplicate");
const originalVersion = createBroadcastAssetVersion(originalAsset, { version: "1.0.1" }, { now: T2 });
assert.equal(originalVersion.variants.filter((variant) => variant.type === "original").length, 1);
const originalRegistry = registerBroadcastAsset({}, originalAsset, { now: T1 });
expectCode(() => updateBroadcastAsset(originalRegistry, originalAsset.assetId, {
  variants: originalAsset.variants.map((variant) => ({ ...variant, type: "program" }))
}), "asset-patch-field-not-allowed:variants");

const fallbackVariantAsset = normalizeBroadcastAsset({
  ...variantAsset,
  fallbackVariantId: "variant_program_landscape"
}, { now: T2 });
const fallbackVariant = resolveBroadcastAssetVariant(fallbackVariantAsset, {
  variantId: "variant_missing"
}, { visibility: "production" });
assert.equal(fallbackVariant.resolved, true);
assert.equal(fallbackVariant.fallbackUsed, true);
assert.equal(fallbackVariant.variant.variantId, "variant_program_landscape");

// Resolution honors scope precedence, exact versions, visibility, rights and tenant boundaries.
function publishedAtScope(assetId, scope, scopeIds, overrides = {}) {
  return publish(createAsset({
    assetId,
    name: assetId,
    type: "background",
    status: "draft",
    scope,
    tenantId: scope === "global" ? null : "tenant_1",
    organizationId: null,
    ...scopeIds,
    ...overrides
  }));
}

const scopeAssets = [
  publishedAtScope("background_global", "global", {}),
  publishedAtScope("background_org", "organization", { organizationId: "org_1" }),
  publishedAtScope("background_tournament", "tournament", { tournamentId: "torneo_1" }),
  publishedAtScope("background_competition", "competition", { competitionId: "competencia_1" }),
  publishedAtScope("background_session", "session", { sessionId: "session_1" })
];
const scopeRegistry = registerMany(scopeAssets);
const resolvedMostSpecific = resolveBroadcastAsset(scopeRegistry, { type: "background" }, {
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  competitionId: "competencia_1",
  sessionId: "session_1",
  visibility: "production"
}, { now: T2 });
assert.equal(resolvedMostSpecific.asset.assetId, "background_session");
assert.equal(resolvedMostSpecific.sourceScope, "session");
const resolvedTournament = resolveBroadcastAsset(scopeRegistry, { type: "background" }, {
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  visibility: "production"
}, { now: T2 });
assert.equal(resolvedTournament.asset.assetId, "background_tournament");
assert.equal(resolveBroadcastAsset(scopeRegistry, { assetId: "background_org" }, {
  tenantId: "tenant_2",
  organizationId: "org_1"
}).errors[0], "asset-tenant-conflict");

const publicContext = { tenantId: "tenant_1", organizationId: "org_1", visibility: "public" };
const productionOnly = registerMany([publishedAtScope("production_only", "organization", {
  organizationId: "org_1"
}, { type: "logo", visibility: "production" })]);
assert.equal(resolveBroadcastAsset(productionOnly, { assetId: "production_only" }, publicContext).resolved, false);

const expiredRights = publish(createAsset({
  assetId: "expired_rights",
  rights: { broadcastUse: true, commercialUse: true, validUntil: PAST }
}));
const deniedBroadcast = publish(createAsset({
  assetId: "denied_broadcast",
  rights: { broadcastUse: false, commercialUse: true, validUntil: FUTURE }
}));
const rightsRegistry = registerMany([expiredRights, deniedBroadcast]);
assert.equal(resolveBroadcastAsset(rightsRegistry, { assetId: "expired_rights" }, {
  tenantId: "tenant_1", organizationId: "org_1", usage: "program"
}, { now: T2 }).resolved, false);
assert.equal(resolveBroadcastAsset(rightsRegistry, { assetId: "denied_broadcast" }, {
  tenantId: "tenant_1", organizationId: "org_1", usage: "program"
}, { now: T2 }).resolved, false);

const soonRights = createAsset({ assetId: "soon_rights", rights: {
  broadcastUse: true,
  commercialUse: false,
  creditRequired: true,
  creditText: "Cortesia del propietario",
  validUntil: SOON
} });
assert.ok(getBroadcastAssetWarnings(soonRights, { now: T0, usage: "program", commercial: true }).includes("asset-rights-expiring-soon"));
assert.ok(getBroadcastAssetWarnings(soonRights, { now: T0, usage: "program", commercial: true }).includes("asset-commercial-use-not-authorized"));
assert.ok(getBroadcastAssetWarnings(soonRights, { now: T0 }).includes("asset-credit-required"));

// Explicit fallback is controlled, visibility-aware and cycle-safe.
const fallbackTarget = publish(createAsset({ assetId: "fallback_target", visibility: "public" }));
const fallbackSource = publish(createAsset({
  assetId: "fallback_source",
  status: "draft",
  expiresAt: PAST,
  fallbackAssetId: "fallback_target",
  fallbackStrategy: "inherit"
}));
const fallbackRegistry = registerMany([fallbackTarget, fallbackSource]);
const fallbackResolved = resolveBroadcastAsset(fallbackRegistry, { assetId: "fallback_source" }, {
  tenantId: "tenant_1", organizationId: "org_1", visibility: "public"
}, { now: T2 });
assert.equal(fallbackResolved.resolved, true);
assert.equal(fallbackResolved.asset.assetId, "fallback_target");
assert.equal(fallbackResolved.fallbackUsed, true);

const cycleA = publish(createAsset({ assetId: "cycle_a", expiresAt: PAST, fallbackAssetId: "cycle_b", fallbackStrategy: "inherit" }));
const cycleB = publish(createAsset({ assetId: "cycle_b", expiresAt: PAST, fallbackAssetId: "cycle_a", fallbackStrategy: "inherit" }));
const cycleRegistry = registerMany([cycleA, cycleB]);
assert.equal(resolveBroadcastAsset(cycleRegistry, { assetId: "cycle_a" }, {
  tenantId: "tenant_1", organizationId: "org_1"
}, { now: T2 }).errors[0], "asset-fallback-cycle");

// Lifecycle preserves published history and controls restoration/removal.
const approved = setBroadcastAssetStatus(createAsset({ assetId: "asset_lifecycle" }), "approved", { now: T0 });
const lifecyclePublished = setBroadcastAssetStatus(approved, "published", { now: T1 });
const deprecated = deprecateBroadcastAsset(lifecyclePublished, { now: T2 });
assert.equal(deprecated.status, "deprecated");
assert.equal(deprecated.deprecatedAt, T2);
const archived = archiveBroadcastAsset(deprecated, { now: FUTURE });
assert.equal(archived.status, "archived");
const restored = restoreBroadcastAsset(archived, { now: "2027-07-14T12:00:00.000Z" });
assert.equal(restored.status, "deprecated");
expectCode(() => restoreBroadcastAsset(setBroadcastAssetStatus(lifecyclePublished, "revoked", { now: T2 })), "asset-restore-requires-archived");

const draftRegistry = registerBroadcastAsset({}, createAsset({ assetId: "asset_removable" }), { now: T0 });
expectCode(() => removeBroadcastAsset(draftRegistry, "asset_removable", {
  references: [{ assetId: "asset_removable", version: "1.0.0" }]
}), "asset-remove-referenced");
assert.equal(getBroadcastAsset(removeBroadcastAsset(draftRegistry, "asset_removable"), "asset_removable"), null);
const historicalRegistry = registerBroadcastAsset({}, lifecyclePublished, { now: T1 });
expectCode(() => removeBroadcastAsset(historicalRegistry, lifecyclePublished.assetId), "asset-remove-historical-blocked");

const rightsChanged = setBroadcastAssetRights(lifecyclePublished, { broadcastUse: false }, { now: T2 });
assert.equal(rightsChanged.rights.broadcastUse, false);
assert.equal(lifecyclePublished.rights.broadcastUse, true);
expectCode(() => setBroadcastAssetVisibility(lifecyclePublished, "public"), "asset-version-published-immutable");
const moved = setBroadcastAssetScope(createAsset({ assetId: "asset_moved" }), "tournament", {
  tournamentId: "torneo_1"
}, { now: T1 });
assert.equal(moved.scope, "tournament");
assert.equal(moved.tournamentId, "torneo_1");
expectCode(() => setBroadcastAssetScope(moved, "tournament", { tenantId: "tenant_2" }), "asset-tenant-immutable");

// Manifest is serializable, tenant-scoped, checksummed and strips temporary signed URLs.
const manifestAsset = publish(createAsset({
  assetId: "manifest_asset",
  signedUrl: "https://signed.example.com/temp-token",
  metadata: {
    safeLabel: "Visible",
    zero: 0,
    enabled: false,
    empty: "",
    password: "do-not-export",
    apiKey: "do-not-export",
    nested: { clientSecret: "do-not-export", safe: "kept" },
    items: [{ credentials: "do-not-export", safe: 1 }]
  },
  rights: {
    owner: "Orgullo Charro",
    validFrom: T0,
    validUntil: FUTURE,
    broadcastUse: true,
    commercialUse: true,
    publicDisplay: true,
    metadata: { authorization: "do-not-export", safe: "rights-kept" }
  },
  variants: [{
    variantId: "manifest_led",
    type: "led",
    name: "LED",
    storageRef: "broadcast/assets/manifest-led.webp",
    mimeType: "image/webp",
    extension: "webp",
    width: 1920,
    height: 320,
    checksum: "e".repeat(64),
    checksumAlgorithm: "sha256",
    status: "approved",
    visibility: "production",
    outputTypes: ["led"],
    metadata: { refreshToken: "do-not-export", safe: "variant-kept" }
  }]
}));
const manifestAssetCopy = structuredClone(manifestAsset);
const manifestRegistry = registerBroadcastAsset({}, manifestAsset, { now: T1 });
const manifestRegistryCopy = structuredClone(manifestRegistry);
const manifest = buildBroadcastAssetManifest(manifestRegistry, {
  tenantId: "tenant_1",
  organizationId: "org_1",
  now: T2
});
assert.deepEqual(manifestRegistry, manifestRegistryCopy);
assert.equal(manifest.assets.length, 1);
assert.deepEqual(manifestAsset, manifestAssetCopy);
assert.equal(manifest.assets[0].assetFamilyId, manifestAsset.assetFamilyId);
assert.equal(manifest.versions[0].assetFamilyId, manifestAsset.assetFamilyId);
assert.equal(Object.hasOwn(manifest.assets[0], "signedUrl"), false);
assert.equal(Object.hasOwn(manifest.assets[0].metadata, "password"), false);
assert.equal(Object.hasOwn(manifest.assets[0].metadata, "apiKey"), false);
assert.equal(Object.hasOwn(manifest.assets[0].metadata.nested, "clientSecret"), false);
assert.equal(Object.hasOwn(manifest.assets[0].metadata.items[0], "credentials"), false);
assert.equal(Object.hasOwn(manifest.assets[0].variants[0].metadata, "refreshToken"), false);
assert.equal(Object.hasOwn(manifest.assets[0].rights.metadata, "authorization"), false);
assert.equal(manifest.assets[0].metadata.safeLabel, "Visible");
assert.equal(manifest.assets[0].metadata.zero, 0);
assert.equal(manifest.assets[0].metadata.enabled, false);
assert.equal(manifest.assets[0].metadata.empty, "");
assert.equal(manifest.assets[0].metadata.nested.safe, "kept");
assert.equal(manifest.assets[0].variants[0].metadata.safe, "variant-kept");
assert.equal(manifest.assets[0].rights.metadata.safe, "rights-kept");
assert.ok(manifest.warnings.includes("sensitive-metadata-redacted"));
assert.equal(manifest.versions.length, 1);
assert.equal(manifest.variants.length, 1);
assert.equal(manifest.checksums.length, 1);
assert.equal(validateBroadcastAssetManifest(manifest).valid, true);
assert.equal(getBroadcastAsset({
  assets: { imported: { ...manifestAsset, signedUrl: "https://signed.example.com/imported" } }
}, "manifest_asset").signedUrl, null);

const tenant2 = publish(createAsset({
  assetId: "tenant_2_asset",
  tenantId: "tenant_2",
  organizationId: "org_2"
}));
const mixedRegistry = registerMany([manifestAsset, tenant2]);
const tenantManifest = buildBroadcastAssetManifest(mixedRegistry, { tenantId: "tenant_1", now: T2 });
assert.equal(tenantManifest.assets.every((asset) => asset.scope === "global" || asset.tenantId === "tenant_1"), true);
const mixedManifest = buildBroadcastAssetManifest(mixedRegistry, { now: T2 });
assert.ok(mixedManifest.errors.includes("manifest-tenant-mixed"));

const localDevelopmentAsset = createAsset({
  assetId: "manifest_local_development",
  storageRef: null,
  localDevelopmentRef: "file:///fixtures/logo-local.png",
  checksum: "7".repeat(64)
}, { environment: "development" });
const localDevelopmentRegistry = registerBroadcastAsset({}, localDevelopmentAsset, {
  now: T0,
  environment: "development"
});
const normalLocalManifest = buildBroadcastAssetManifest(localDevelopmentRegistry, { tenantId: "tenant_1", now: T1 });
assert.equal(Object.hasOwn(normalLocalManifest.assets[0], "localDevelopmentRef"), false);
assert.equal(JSON.stringify(normalLocalManifest).includes("file://"), false);
assert.equal(validateBroadcastAssetManifest(normalLocalManifest).valid, true);
const productionLocalManifest = buildBroadcastAssetManifest(localDevelopmentRegistry, {
  tenantId: "tenant_1",
  environment: "production",
  includeDevelopmentRefs: true,
  exportable: false,
  now: T1
});
assert.equal(Object.hasOwn(productionLocalManifest.assets[0], "localDevelopmentRef"), false);
const developmentLocalManifest = buildBroadcastAssetManifest(localDevelopmentRegistry, {
  tenantId: "tenant_1",
  environment: "development",
  includeDevelopmentRefs: true,
  exportable: false,
  now: T1
});
assert.equal(developmentLocalManifest.assets[0].localDevelopmentRef, "file:///fixtures/logo-local.png");
assert.equal(developmentLocalManifest.developmentRefsIncluded, true);
assert.equal(validateBroadcastAssetManifest(developmentLocalManifest).valid, true);
const exportableDevelopmentManifest = buildBroadcastAssetManifest(localDevelopmentRegistry, {
  tenantId: "tenant_1",
  environment: "development",
  includeDevelopmentRefs: true,
  exportable: true,
  now: T1
});
assert.equal(Object.hasOwn(exportableDevelopmentManifest.assets[0], "localDevelopmentRef"), false);
const productionReadyDevelopmentManifest = buildBroadcastAssetManifest(localDevelopmentRegistry, {
  tenantId: "tenant_1",
  environment: "development",
  includeDevelopmentRefs: true,
  exportable: false,
  productionReady: true,
  now: T1
});
assert.equal(Object.hasOwn(productionReadyDevelopmentManifest.assets[0], "localDevelopmentRef"), false);

const secretManifest = structuredClone(manifest);
secretManifest.assets[0].metadata.password = "injected";
assert.ok(validateBroadcastAssetManifest(secretManifest).errors.includes("manifest-sensitive-metadata-forbidden"));
const localRefManifest = structuredClone(manifest);
localRefManifest.assets[0].localDevelopmentRef = "file:///tmp/injected.png";
const localRefValidation = validateBroadcastAssetManifest(localRefManifest);
assert.ok(localRefValidation.errors.includes("manifest-local-development-ref-forbidden"));
assert.ok(localRefValidation.errors.includes("manifest-local-file-reference-forbidden"));
const missingFamilyManifest = structuredClone(manifest);
delete missingFamilyManifest.assets[0].assetFamilyId;
assert.ok(validateBroadcastAssetManifest(missingFamilyManifest).errors.includes("manifest-asset-0:asset-family-id-invalid"));
const inconsistentFamilyManifest = structuredClone(manifest);
inconsistentFamilyManifest.assets.push({
  ...structuredClone(inconsistentFamilyManifest.assets[0]),
  version: "1.0.1",
  assetFamilyId: "different_family",
  status: "draft",
  publishedAt: null
});
inconsistentFamilyManifest.versions.push({
  ...structuredClone(inconsistentFamilyManifest.versions[0]),
  version: "1.0.1",
  assetFamilyId: "different_family",
  status: "draft",
  publishedAt: null
});
assert.ok(validateBroadcastAssetManifest(inconsistentFamilyManifest).errors.includes("manifest-asset-family-inconsistent:manifest_asset"));
const doubleOriginalManifest = structuredClone(manifest);
doubleOriginalManifest.assets[0].variants.push(
  { ...structuredClone(doubleOriginalManifest.assets[0].variants[0]), variantId: "original_one", type: "original" },
  { ...structuredClone(doubleOriginalManifest.assets[0].variants[0]), variantId: "original_two", type: "original", width: 1280 }
);
assert.ok(validateBroadcastAssetManifest(doubleOriginalManifest).errors.includes("manifest-asset-0:asset-original-variant-duplicate"));
assert.ok(validateBroadcastAssetManifest(manifest, { requireOriginalVariant: true }).errors.includes("manifest-asset-0:asset-original-variant-required"));

// Security sanitizer removes executable values, symbols, cycles and dangerous keys.
const cyclic = { safe: true };
cyclic.self = cyclic;
const dangerous = Object.create(null);
Object.defineProperty(dangerous, "__proto__", { value: { polluted: true }, enumerable: true });
dangerous.constructor = { polluted: true };
dangerous.prototype = { polluted: true };
dangerous.fn = () => "no";
dangerous.symbol = Symbol("no");
dangerous.zero = 0;
dangerous.disabled = false;
dangerous.empty = "";
dangerous.cyclic = cyclic;
const secured = cloneBroadcastAsset(dangerous);
assert.equal(Object.hasOwn(secured, "__proto__"), false);
assert.equal(Object.hasOwn(secured, "constructor"), false);
assert.equal(Object.hasOwn(secured, "prototype"), false);
assert.equal(Object.hasOwn(secured, "fn"), false);
assert.equal(Object.hasOwn(secured, "symbol"), false);
assert.equal(secured.zero, 0);
assert.equal(secured.disabled, false);
assert.equal(secured.empty, "");
assert.equal(secured.cyclic.self, null);
assert.equal({}.polluted, undefined);

const tooManyTags = Array.from({ length: 100 }, (_, index) => `tag-${index}`);
const normalizedTags = normalizeBroadcastAsset(assetDefinition({ assetId: "limited_tags", tags: tooManyTags }), { now: T0 });
assert.equal(normalizedTags.tags.length, 50);
const largeArray = Array.from({ length: 300 }, (_, index) => index);
const limitedMetadata = normalizeBroadcastAsset(assetDefinition({ assetId: "limited_metadata", metadata: { items: largeArray } }), { now: T0 });
assert.equal(limitedMetadata.metadata.items.length, 250);

// Full fixture matrix required by the ticket remains in-memory and has no legacy side effects.
const fixtureAssets = [
  createAsset({ assetId: "fixture_org_logo", name: "Logo organizacion" }),
  createAsset({ assetId: "fixture_tournament_logo", name: "Logo torneo", scope: "tournament", tournamentId: "torneo_1" }),
  createAsset({ assetId: "fixture_participant_photo", name: "Foto participante", type: "photo" }),
  createAsset({ assetId: "fixture_horse_photo", name: "Foto caballo", type: "photo" }),
  createAsset({ assetId: "fixture_background", name: "Fondo", type: "background" }),
  createAsset({ assetId: "fixture_video_final", name: "Video", type: "video", mimeType: "video/mp4", duration: 10 }),
  creationFixtures.map((fixture) => createBroadcastAsset(fixture, { now: T0 })).find((asset) => asset.type === "font"),
  creationFixtures.map((fixture) => createBroadcastAsset(fixture, { now: T0 })).find((asset) => asset.type === "sponsor")
].filter(Boolean);
assert.equal(fixtureAssets.length, 8);
assert.equal(fixtureAssets.every((asset) => validateBroadcastAsset(asset).valid), true);

const listed = listBroadcastAssets(scopeRegistry, { type: "background", tenantId: "tenant_1" });
assert.equal(listed.length, 4);
assert.equal(listBroadcastAssets(scopeRegistry, { tags: ["branding"] }).length >= 1, true);

// No browser or platform persistence is introduced by the pure module.
const moduleSource = await import("node:fs/promises").then((fs) => fs.readFile(
  new URL("../js/broadcast/assetManager.js", import.meta.url),
  "utf8"
));
for (const forbidden of ["localStorage", "sessionStorage", "firebase", "fetch(", "XMLHttpRequest"]) {
  assert.equal(moduleSource.includes(forbidden), false, `${forbidden} must not be used`);
}

console.log("broadcast-asset-manager tests: ok");
