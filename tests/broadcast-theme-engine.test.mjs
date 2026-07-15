import assert from "node:assert/strict";
import {
  BroadcastThemeError,
  THEME_ENGINE_ERROR_CODES,
  THEME_ENGINE_STATES,
  THEME_ENGINE_VERSION,
  activateBroadcastTheme,
  buildBroadcastThemeSnapshot,
  cloneBroadcastTheme,
  createBroadcastTheme,
  deactivateBroadcastTheme,
  deleteBroadcastTheme,
  deprecateBroadcastTheme,
  duplicateBroadcastTheme,
  getActiveBroadcastThemeForContext,
  getBroadcastTheme,
  getBroadcastThemeEffectiveScopeKey,
  listActiveBroadcastThemes,
  listBroadcastThemes,
  publishBroadcastTheme,
  resolveBroadcastTheme,
  updateBroadcastTheme,
  validateBroadcastTheme
} from "../js/broadcast/themeEngine.js";
import { PRODUCTION_CONSOLE_THEME_DEFINITIONS } from "../js/broadcast/productionConsole.js";

const T0 = "2026-07-14T12:00:00.000Z";
const T1 = "2026-07-14T12:01:00.000Z";
const T2 = "2026-07-14T12:02:00.000Z";
const ACTOR_A = { id: "operator_a", name: "Operator A" };
const ACTOR_B = { id: "operator_b", name: "Operator B" };

assert.equal(THEME_ENGINE_VERSION, "1.0.0");
assert.deepEqual(THEME_ENGINE_STATES, ["draft", "active", "inactive", "published", "deprecated", "error"]);
assert.equal(BroadcastThemeError.prototype instanceof Error, true);

// Canonical identity, input alias, controlled audit fields and atomic revisions.
const tenantDefinition = themeDefinition("theme_tenant_a", {
  idOnly: true,
  scope: "tenant",
  tenantId: "tenant_a",
  metadata: { brandingStatus: "neutral" }
});
const tenantDefinitionBefore = structuredClone(tenantDefinition);
let registry = createBroadcastTheme({}, tenantDefinition, { actor: ACTOR_A, now: T0 });
assert.deepEqual(tenantDefinition, tenantDefinitionBefore);
let tenantTheme = getBroadcastTheme(registry, "theme_tenant_a");
assert.equal(tenantTheme.themeId, "theme_tenant_a");
assert.equal(tenantTheme.id, "theme_tenant_a");
assert.equal(tenantTheme.themeVersion, "1.0.0");
assert.equal(tenantTheme.tenantId, "tenant_a");
assert.equal(tenantTheme.scope, "tenant");
assert.equal(tenantTheme.createdBy, "operator_a");
assert.equal(tenantTheme.updatedBy, "operator_a");
assert.equal(tenantTheme.createdAt, T0);
assert.equal(tenantTheme.revision, 0);
const beforeIdentityUpdate = structuredClone(registry);
registry = updateBroadcastTheme(registry, "theme_tenant_a", { description: "Updated" }, {
  actor: ACTOR_B,
  expectedRegistryRevision: registry.revision,
  expectedRevision: tenantTheme.revision,
  now: T1
});
tenantTheme = getBroadcastTheme(registry, "theme_tenant_a");
assert.equal(tenantTheme.createdBy, "operator_a");
assert.equal(tenantTheme.createdAt, T0);
assert.equal(tenantTheme.updatedBy, "operator_b");
assert.equal(tenantTheme.updatedAt, T1);
assert.equal(tenantTheme.revision, 1);
assert.equal(beforeIdentityUpdate.themes.theme_tenant_a.description, "Theme theme_tenant_a");
for (const patch of [{ themeId: "changed" }, { tenantId: "tenant_b" }, { scope: "global" }, { createdBy: "changed" }, { revision: 99 }]) {
  assert.throws(
    () => updateBroadcastTheme(registry, "theme_tenant_a", patch),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_PATCH_FIELD_FORBIDDEN
  );
}
const beforeRevisionConflict = structuredClone(registry);
assert.throws(
  () => updateBroadcastTheme(registry, "theme_tenant_a", { name: "Conflict" }, { expectedRevision: 99 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_REVISION_CONFLICT
);
assert.deepEqual(registry, beforeRevisionConflict);
assert.throws(
  () => publishBroadcastTheme(registry, "theme_tenant_a", { expectedRevision: tenantTheme.revision, now: T2 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID && error.details.reason === "actor-required"
);

// Publication is explicit, published definitions are immutable and deprecation is controlled.
registry = publishBroadcastTheme(registry, "theme_tenant_a", {
  actor: ACTOR_B,
  expectedRegistryRevision: registry.revision,
  expectedRevision: tenantTheme.revision,
  now: T2
});
tenantTheme = getBroadcastTheme(registry, "theme_tenant_a");
assert.equal(tenantTheme.status, "published");
assert.equal(tenantTheme.publishedAt, T2);
assert.equal(tenantTheme.publishedBy, "operator_b");
assert.equal(tenantTheme.revision, 2);
assert.throws(
  () => updateBroadcastTheme(registry, "theme_tenant_a", { colors: { primary: "#FFF" } }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_PUBLISHED_IMMUTABLE
);
assert.throws(
  () => deleteBroadcastTheme(registry, "theme_tenant_a"),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_PUBLISHED_IMMUTABLE
);
registry = duplicateBroadcastTheme(registry, "theme_tenant_a", {
  themeId: "theme_tenant_a_v2",
  themeVersion: "2.0.0",
  name: "Tenant A V2"
}, { actor: ACTOR_A, expectedRegistryRevision: registry.revision, now: T2 });
assert.equal(getBroadcastTheme(registry, "theme_tenant_a_v2").status, "draft");
assert.equal(getBroadcastTheme(registry, "theme_tenant_a_v2").themeVersion, "2.0.0");
registry = deprecateBroadcastTheme(registry, "theme_tenant_a", {
  actor: ACTOR_A,
  expectedRegistryRevision: registry.revision,
  expectedRevision: tenantTheme.revision,
  now: T2
});
assert.equal(getBroadcastTheme(registry, "theme_tenant_a").status, "deprecated");
assert.throws(
  () => activateBroadcastTheme(registry, "theme_tenant_a", { actor: ACTOR_A }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_ACTIVATION_BLOCKED
);

// Multi-tenant inheritance and global authorization.
let inheritanceRegistry = createBroadcastTheme({}, themeDefinition("theme_global_base", {
  metadata: { allowTenantInheritance: true, brandingStatus: "neutral" }
}), { actor: ACTOR_A, now: T0 });
inheritanceRegistry = createBroadcastTheme(inheritanceRegistry, themeDefinition("theme_a_parent", {
  scope: "tenant",
  tenantId: "tenant_a",
  baseThemeId: "theme_global_base",
  colors: { accent: "#123456" }
}), { actor: ACTOR_A, expectedRegistryRevision: inheritanceRegistry.revision, now: T0 });
inheritanceRegistry = createBroadcastTheme(inheritanceRegistry, themeDefinition("theme_a_child", {
  scope: "organization",
  tenantId: "tenant_a",
  organizationId: "organization_a",
  baseThemeId: "theme_a_parent",
  colors: { highlight: "#1234" }
}), { actor: ACTOR_A, expectedRegistryRevision: inheritanceRegistry.revision, now: T0 });
assert.deepEqual(resolveBroadcastTheme(inheritanceRegistry, "theme_a_child").resolvedFrom, ["theme_global_base", "theme_a_parent", "theme_a_child"]);
assert.throws(
  () => createBroadcastTheme(inheritanceRegistry, themeDefinition("theme_b_cross", {
    scope: "tenant",
    tenantId: "tenant_b",
    baseThemeId: "theme_a_parent"
  }), { actor: ACTOR_A, expectedRegistryRevision: inheritanceRegistry.revision, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT
);
assert.throws(
  () => createBroadcastTheme(inheritanceRegistry, themeDefinition("theme_global_private_parent", {
    scope: "global",
    baseThemeId: "theme_a_parent"
  }), { actor: ACTOR_A, expectedRegistryRevision: inheritanceRegistry.revision, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT
);
let unauthorizedGlobal = createBroadcastTheme({}, themeDefinition("theme_global_closed", {
  metadata: { allowTenantInheritance: false }
}), { actor: ACTOR_A, now: T0 });
assert.throws(
  () => createBroadcastTheme(unauthorizedGlobal, themeDefinition("theme_global_closed_child", {
    scope: "tenant",
    tenantId: "tenant_a",
    baseThemeId: "theme_global_closed"
  }), { actor: ACTOR_A, expectedRegistryRevision: unauthorizedGlobal.revision, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT
);

// Asset references are declarative and tenant ownership is validated when a registry is supplied.
const assetRegistry = {
  assets: {
    global_logo: { assetId: "global_logo", version: "1.0.0", tenantId: null },
    tenant_a_logo: { assetId: "tenant_a_logo", version: "1.0.0", tenantId: "tenant_a" },
    tenant_b_logo: { assetId: "tenant_b_logo", version: "1.0.0", tenantId: "tenant_b" }
  }
};
assert.doesNotThrow(() => createBroadcastTheme({}, themeDefinition("theme_asset_a", {
  scope: "tenant",
  tenantId: "tenant_a",
  logos: { primary: assetRef("tenant_a_logo", "tenant_a") }
}), { actor: ACTOR_A, now: T0, assetRegistry }));
assert.doesNotThrow(() => createBroadcastTheme({}, themeDefinition("theme_asset_global", {
  logos: { primary: assetRef("global_logo") }
}), { actor: ACTOR_A, now: T0, assetRegistry }));
for (const definition of [
  themeDefinition("theme_asset_cross_ref", { scope: "tenant", tenantId: "tenant_a", logos: { primary: assetRef("tenant_b_logo", "tenant_b") } }),
  themeDefinition("theme_asset_cross_registry", { scope: "tenant", tenantId: "tenant_a", logos: { primary: assetRef("tenant_b_logo") } }),
  themeDefinition("theme_asset_global_private", { logos: { primary: assetRef("tenant_b_logo") } })
]) {
  assert.throws(
    () => createBroadcastTheme({}, definition, { actor: ACTOR_A, now: T0, assetRegistry }),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT
  );
}
let inheritedPrivateAssetRegistry = createBroadcastTheme({}, themeDefinition("theme_global_asset_parent", {
  metadata: { allowTenantInheritance: true },
  logos: { primary: assetRef("tenant_b_logo") }
}), { actor: ACTOR_A, now: T0 });
assert.throws(
  () => createBroadcastTheme(inheritedPrivateAssetRegistry, themeDefinition("theme_asset_inherited_cross", {
    scope: "tenant",
    tenantId: "tenant_a",
    baseThemeId: "theme_global_asset_parent"
  }), { actor: ACTOR_A, expectedRegistryRevision: inheritedPrivateAssetRegistry.revision, now: T0, assetRegistry }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT
);
for (const unsafeReference of [
  { assetId: "global_logo", url: "https://example.test/logo.png" },
  { assetId: "global_logo", signedUrl: "https://example.test/signed" },
  { assetId: "global_logo", externalUrl: "javascript:alert(1)" },
  { assetId: "global_logo", storageRef: "tenant-b/logo.png" },
  { assetId: "global_logo", fallbackAssetId: "tenant_b_logo" },
  { assetId: "global_logo", variantId: "invalid variant" },
  { assetId: "global_logo", tenantId: "invalid tenant" }
]) {
  assert.throws(
    () => createBroadcastTheme({}, themeDefinition("theme_asset_unsafe", { logos: { primary: unsafeReference } }), { actor: ACTOR_A, now: T0 }),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID
  );
}

// Activation is isolated by effective scope and never changes another tenant or tournament.
let activationRegistry = {};
const activationDefinitions = [
  themeDefinition("active_global"),
  themeDefinition("active_tenant_a", { scope: "tenant", tenantId: "tenant_a" }),
  themeDefinition("active_tenant_b", { scope: "tenant", tenantId: "tenant_b" }),
  themeDefinition("active_organization_a", { scope: "organization", tenantId: "tenant_a", organizationId: "organization_a" }),
  themeDefinition("active_tournament_x", { scope: "tournament", tenantId: "tenant_a", tournamentId: "tournament_x" }),
  themeDefinition("active_tournament_x_alt", { scope: "tournament", tenantId: "tenant_a", tournamentId: "tournament_x" }),
  themeDefinition("active_tournament_y", { scope: "tournament", tenantId: "tenant_a", tournamentId: "tournament_y" })
];
for (const definition of activationDefinitions) activationRegistry = createPublished(activationRegistry, definition, T0);
for (const themeId of ["active_global", "active_tenant_a", "active_tenant_b", "active_organization_a", "active_tournament_x", "active_tournament_y"]) {
  const current = getBroadcastTheme(activationRegistry, themeId);
  activationRegistry = activateBroadcastTheme(activationRegistry, themeId, {
    actor: ACTOR_A,
    expectedRegistryRevision: activationRegistry.revision,
    expectedRevision: current.revision,
    now: T1
  });
}
assert.equal(listActiveBroadcastThemes(activationRegistry).length, 6);
assert.equal(activationRegistry.activeThemeId, "active_global");
assert.equal(getActiveBroadcastThemeForContext(activationRegistry, { scope: "tournament", tenantId: "tenant_a", tournamentId: "tournament_x" }).themeId, "active_tournament_x");
assert.equal(getBroadcastThemeEffectiveScopeKey(getBroadcastTheme(activationRegistry, "active_tournament_x")), "tenant_a|tournament|||tournament_x||");
const tournamentYBefore = getBroadcastTheme(activationRegistry, "active_tournament_y");
let alternative = getBroadcastTheme(activationRegistry, "active_tournament_x_alt");
activationRegistry = activateBroadcastTheme(activationRegistry, alternative.themeId, {
  actor: ACTOR_B,
  expectedRegistryRevision: activationRegistry.revision,
  expectedRevision: alternative.revision,
  now: T2
});
assert.equal(getBroadcastTheme(activationRegistry, "active_tournament_x").status, "inactive");
assert.equal(getBroadcastTheme(activationRegistry, "active_tournament_x_alt").status, "active");
assert.deepEqual(getBroadcastTheme(activationRegistry, "active_tournament_y"), tournamentYBefore);
const activeTenantBBefore = getBroadcastTheme(activationRegistry, "active_tenant_b");
const tenantAActive = getBroadcastTheme(activationRegistry, "active_tenant_a");
activationRegistry = deactivateBroadcastTheme(activationRegistry, tenantAActive.themeId, {
  actor: ACTOR_A,
  expectedRegistryRevision: activationRegistry.revision,
  expectedRevision: tenantAActive.revision,
  now: T2
});
assert.deepEqual(getBroadcastTheme(activationRegistry, "active_tenant_b"), activeTenantBBefore);
const activeTournamentAlternative = getBroadcastTheme(activationRegistry, "active_tournament_x_alt");
activationRegistry = deprecateBroadcastTheme(activationRegistry, activeTournamentAlternative.themeId, {
  actor: ACTOR_B,
  expectedRegistryRevision: activationRegistry.revision,
  expectedRevision: activeTournamentAlternative.revision,
  now: T2
});
assert.equal(getBroadcastTheme(activationRegistry, "active_tournament_x_alt").status, "deprecated");
assert.equal(getActiveBroadcastThemeForContext(activationRegistry, { scope: "tournament", tenantId: "tenant_a", tournamentId: "tournament_x" }), null);
assert.equal(getActiveBroadcastThemeForContext(activationRegistry, { scope: "tournament", tenantId: "tenant_a", tournamentId: "tournament_y" }).themeId, "active_tournament_y");
const spoofedActiveRegistry = structuredClone(activationRegistry);
spoofedActiveRegistry.activeThemes["tenant_c|tenant|||||"] = "active_tenant_b";
assert.equal(getActiveBroadcastThemeForContext(spoofedActiveRegistry, { scope: "tenant", tenantId: "tenant_c" }), null);
assert.throws(
  () => listBroadcastThemes({ ...activationRegistry, revision: Infinity }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.REGISTRY_INVALID
);

// Inheritance cycles, missing bases, depth and registry order are deterministic.
assert.throws(
  () => createBroadcastTheme({}, themeDefinition("self_cycle", { baseThemeId: "self_cycle" }), { actor: ACTOR_A, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID
);
let cycleRegistry = createBroadcastTheme({}, themeDefinition("cycle_a"), { actor: ACTOR_A, now: T0 });
cycleRegistry = createBroadcastTheme(cycleRegistry, themeDefinition("cycle_b", { baseThemeId: "cycle_a" }), { actor: ACTOR_A, expectedRegistryRevision: cycleRegistry.revision, now: T0 });
assert.throws(
  () => updateBroadcastTheme(cycleRegistry, "cycle_a", { baseThemeId: "cycle_b" }, { actor: ACTOR_A, expectedRegistryRevision: cycleRegistry.revision, expectedRevision: 0, now: T1 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INHERITANCE_CYCLE
);
cycleRegistry = createBroadcastTheme(cycleRegistry, themeDefinition("cycle_c", { baseThemeId: "cycle_b" }), { actor: ACTOR_A, expectedRegistryRevision: cycleRegistry.revision, now: T0 });
assert.throws(
  () => updateBroadcastTheme(cycleRegistry, "cycle_a", { baseThemeId: "cycle_c" }, { actor: ACTOR_A, expectedRegistryRevision: cycleRegistry.revision, expectedRevision: 0, now: T1 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INHERITANCE_CYCLE
);
assert.throws(
  () => createBroadcastTheme({}, themeDefinition("missing_base", { baseThemeId: "does_not_exist" }), { actor: ACTOR_A, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_BASE_NOT_FOUND
);
let depthRegistry = {};
for (let index = 1; index <= 12; index += 1) {
  depthRegistry = createBroadcastTheme(depthRegistry, themeDefinition(`depth_${index}`, {
    baseThemeId: index === 1 ? null : `depth_${index - 1}`,
    colors: { accent: index % 2 ? "#123" : "#1234" }
  }), { actor: ACTOR_A, expectedRegistryRevision: depthRegistry.revision, now: T0 });
}
assert.equal(resolveBroadcastTheme(depthRegistry, "depth_12").resolvedFrom.length, 12);
assert.throws(
  () => createBroadcastTheme(depthRegistry, themeDefinition("depth_13", { baseThemeId: "depth_12" }), { actor: ACTOR_A, expectedRegistryRevision: depthRegistry.revision, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INHERITANCE_DEPTH_EXCEEDED
);
const reversedDepthRegistry = { ...depthRegistry, themes: Object.fromEntries(Object.entries(depthRegistry.themes).reverse()) };
assert.deepEqual(resolveBroadcastTheme(reversedDepthRegistry, "depth_12").resolvedFrom, resolveBroadcastTheme(depthRegistry, "depth_12").resolvedFrom);

// Exact color formats.
for (const color of ["#123", "#1234", "#123456", "#12345678", "transparent"]) {
  assert.doesNotThrow(() => createBroadcastTheme({}, themeDefinition(`color_${color.replace(/[^a-z0-9]/gi, "") || "transparent"}`, { colors: { primary: color } }), { actor: ACTOR_A, now: T0 }));
}
for (const color of ["#12", "#12345", "#1234567", "#123456789", "rgb(1,2,3)", "rgba(1,2,3,1)", "hsl(0,0%,0%)", "var(--color)", "linear-gradient(#000,#fff)"]) {
  assert.throws(
    () => createBroadcastTheme({}, themeDefinition("color_invalid", { colors: { primary: color } }), { actor: ACTOR_A, now: T0 }),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID
  );
}

// Safe typography rejects CSS, protocols and HTML payloads.
assert.doesNotThrow(() => createBroadcastTheme({}, themeDefinition("font_safe", {
  typography: { body: { family: "Noto Sans, Arial", fallbacks: ["Helvetica Neue", "sans-serif"], weight: 400, size: 24, lineHeight: 1.2, tracking: 0, uppercase: false, capitalize: false, italic: false } }
}), { actor: ACTOR_A, now: T0 }));
for (const family of ["@font-face", "font-face", "@import x", "url(font.woff2)", "file://font", "http://font", "https://font", "javascript:font", "data:font/woff2", "Arial; color:red", "<b>Arial</b>", "Font_Name"]) {
  assert.throws(
    () => createBroadcastTheme({}, themeDefinition("font_invalid", { typography: { body: { family } } }), { actor: ACTOR_A, now: T0 }),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID
  );
}

// Strict backgrounds and numeric tokens reject invalid values without truncation or mutation.
for (const backgrounds of [
  { main: { type: "unknown" } },
  { main: { color: "#000" } },
  { main: { type: "gradient", gradientType: "linear", angle: Infinity, stops: [{ color: "#000", position: 0 }, { color: "#FFF", position: 1 }] } },
  { main: { type: "gradient", gradientType: "linear", angle: 45, stops: [{ color: "#000", position: NaN }, { color: "#FFF", position: 1 }] } },
  { main: { type: "gradient", gradientType: "linear", angle: 45, stops: [{ color: "#000", position: -0.1 }, { color: "#FFF", position: 1 }] } },
  { main: { type: "solid", color: "linear-gradient(#000,#FFF)" } }
]) {
  assert.throws(
    () => createBroadcastTheme({}, themeDefinition("background_invalid", { backgrounds }), { actor: ACTOR_A, now: T0 }),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID
  );
}
const nineStops = Array.from({ length: 9 }, (_, index) => ({ color: index % 2 ? "#FFF" : "#000", position: index / 8 }));
const nineStopDefinition = themeDefinition("gradient_nine", { backgrounds: { main: { type: "gradient", gradientType: "linear", angle: 90, stops: nineStops } } });
assert.throws(
  () => createBroadcastTheme({}, nineStopDefinition, { actor: ACTOR_A, now: T0 }),
  (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID && error.details.errors.some((item) => item.startsWith(THEME_ENGINE_ERROR_CODES.THEME_GRADIENT_STOP_LIMIT_EXCEEDED))
);
assert.equal(nineStopDefinition.backgrounds.main.stops.length, 9);
assert.doesNotThrow(() => createBroadcastTheme({}, themeDefinition("background_valid", { backgrounds: {
  solid: { type: "solid", color: "#12345678" },
  gradient: { type: "gradient", gradientType: "radial", stops: [{ color: "#000", position: 0 }, { color: "transparent", position: 1 }] },
  transparent: { type: "transparent" },
  placeholder: { type: "placeholder", placeholder: "Fondo no configurado" }
} }), { actor: ACTOR_A, now: T0 }));

const numericInvalidDefinitions = [
  themeDefinition("safe_area_negative", { safeArea: { top: -10 } }),
  themeDefinition("scale_nan", { logos: { primary: { ...assetRef("global_logo"), scale: NaN } } }),
  themeDefinition("spacing_infinity", { spacing: { md: Infinity } }),
  themeDefinition("opacity_high", { shadows: { panel: { x: 0, y: 0, blur: 0, opacity: 1.1, color: "#000" } } }),
  themeDefinition("blur_negative", { shadows: { panel: { x: 0, y: 0, blur: -1, opacity: 0, color: "#000" } } })
];
for (const definition of numericInvalidDefinitions) {
  assert.throws(
    () => createBroadcastTheme({}, definition, { actor: ACTOR_A, now: T0 }),
    (error) => error.code === THEME_ENGINE_ERROR_CODES.THEME_INVALID
  );
}
assert.doesNotThrow(() => createBroadcastTheme({}, themeDefinition("numeric_zero", {
  spacing: { none: 0 }, radius: { none: 0 }, safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  shadows: { none: { x: 0, y: 0, blur: 0, opacity: 0, color: "transparent" } }
}), { actor: ACTOR_A, now: T0 }));
let atomicRegistry = createBroadcastTheme({}, themeDefinition("atomic_theme"), { actor: ACTOR_A, now: T0 });
const atomicBefore = structuredClone(atomicRegistry);
assert.throws(() => updateBroadcastTheme(atomicRegistry, "atomic_theme", { safeArea: { top: -1 } }, {
  actor: ACTOR_A, expectedRegistryRevision: atomicRegistry.revision, expectedRevision: 0, now: T1
}));
assert.deepEqual(atomicRegistry, atomicBefore);

// Visibility snapshots preserve valid falsy values and always strip secrets.
let snapshotRegistry = createBroadcastTheme({}, themeDefinition("snapshot_theme", {
  scope: "tenant",
  tenantId: "tenant_snapshot",
  organizationId: "organization_snapshot",
  visibility: "public",
  defaults: { count: 0, enabled: false, label: "", optional: null, password: "hidden", internalUrl: "https://internal.example/theme" },
  metadata: { brandingStatus: "confirmed", actor: "operator", token: "hidden", diagnostics: { secret: "hidden" } }
}), { actor: ACTOR_A, now: T0 });
const publicSnapshot = buildBroadcastThemeSnapshot(snapshotRegistry, { visibility: "public", resolve: true, now: T1 });
const publicTheme = publicSnapshot.themes[0];
assert.equal(publicTheme.themeId, "snapshot_theme");
assert.equal("id" in publicTheme, false);
assert.equal("scope" in publicTheme, false);
assert.equal("tenantId" in publicTheme, false);
assert.equal("organizationId" in publicTheme, false);
assert.equal("createdBy" in publicTheme, false);
assert.deepEqual(publicTheme.defaults, { count: 0, enabled: false, label: "", optional: null });
assert.deepEqual(publicTheme.metadata, { brandingStatus: "confirmed" });
const restrictedSnapshot = buildBroadcastThemeSnapshot(snapshotRegistry, { visibility: "restricted", resolve: true, now: T1 });
const restrictedTheme = restrictedSnapshot.themes[0];
assert.equal(restrictedTheme.tenantId, "tenant_snapshot");
assert.equal(restrictedTheme.organizationId, "organization_snapshot");
assert.equal(restrictedTheme.createdBy, "operator_a");
const restrictedJson = JSON.stringify(restrictedSnapshot);
for (const secret of ["password", "token", "apiKey", "secret", "credentials", "signedUrl", "plugins", "hooks", "handlers"]) assert.equal(restrictedJson.includes(`\"${secret}\"`), false);
publicSnapshot.themes[0].colors.primary = "#FFF";
assert.notEqual(getBroadcastTheme(snapshotRegistry, "snapshot_theme").colors.primary, "#FFF");
let tenantSnapshotRegistry = createBroadcastTheme(snapshotRegistry, themeDefinition("snapshot_other_tenant", {
  scope: "tenant",
  tenantId: "tenant_other",
  visibility: "public"
}), { actor: ACTOR_B, expectedRegistryRevision: snapshotRegistry.revision, now: T1 });
const scopedRestrictedSnapshot = buildBroadcastThemeSnapshot(tenantSnapshotRegistry, {
  visibility: "restricted",
  tenantId: "tenant_snapshot",
  now: T2
});
assert.deepEqual(scopedRestrictedSnapshot.themes.map((theme) => theme.themeId), ["snapshot_theme"]);
assert.equal(JSON.stringify(scopedRestrictedSnapshot).includes("tenant_other"), false);

// Safe cloning and hostile structures.
const cloned = cloneBroadcastTheme(getBroadcastTheme(snapshotRegistry, "snapshot_theme"));
cloned.colors.primary = "#FFF";
assert.notEqual(getBroadcastTheme(snapshotRegistry, "snapshot_theme").colors.primary, "#FFF");
for (const hostile of [
  { metadata: { value: "<script>alert(1)</script>" } },
  { metadata: { value: "<img src=x onerror=alert(1)>" } },
  { metadata: { value: "javascript:alert(1)" } },
  { defaults: { fn: () => true } },
  { defaults: { symbol: Symbol("x") } },
  { defaults: { bigint: 1n } }
]) {
  assert.throws(() => createBroadcastTheme({}, themeDefinition("hostile", hostile), { actor: ACTOR_A, now: T0 }));
}
const cyclicDefinition = themeDefinition("cyclic_input");
cyclicDefinition.metadata.cycle = cyclicDefinition;
assert.throws(() => createBroadcastTheme({}, cyclicDefinition, { actor: ACTOR_A, now: T0 }));
let getterCalls = 0;
const accessorDefinition = themeDefinition("accessor_input");
Object.defineProperty(accessorDefinition.metadata, "secretValue", { enumerable: true, get() { getterCalls += 1; return "not-read"; } });
assert.throws(() => createBroadcastTheme({}, accessorDefinition, { actor: ACTOR_A, now: T0 }));
assert.equal(getterCalls, 0);
const pollutedDefinition = themeDefinition("polluted_input");
Object.defineProperty(pollutedDefinition.metadata, "__proto__", { enumerable: true, value: { polluted: true } });
assert.throws(() => createBroadcastTheme({}, pollutedDefinition, { actor: ACTOR_A, now: T0 }));
assert.equal({}.polluted, undefined);

// Initial technical themes have explicit branding status and no invented official Liga palette.
assert.deepEqual(PRODUCTION_CONSOLE_THEME_DEFINITIONS.map((theme) => theme.id), [
  "theme_default", "theme_orgullo_charro", "theme_liga_mexicana", "theme_rodeo", "theme_empresarial", "theme_dark", "theme_light"
]);
const initialById = Object.fromEntries(PRODUCTION_CONSOLE_THEME_DEFINITIONS.map((theme) => [theme.id, theme]));
assert.equal(initialById.theme_default.metadata.brandingStatus, "neutral");
assert.equal(initialById.theme_dark.metadata.brandingStatus, "neutral");
assert.equal(initialById.theme_light.metadata.brandingStatus, "neutral");
assert.equal(initialById.theme_orgullo_charro.metadata.brandingStatus, "confirmed");
const orgulloConfirmedColors = new Set(["#090A0C", "#090A0CCC", "#15171B", "#174EA6", "#7A1538", "#C0C5CC", "#9EA4AC", "transparent"]);
assert.equal(Object.values(initialById.theme_orgullo_charro.colors).every((color) => orgulloConfirmedColors.has(color)), true);
assert.equal(Object.values(initialById.theme_orgullo_charro.colors).some((color) => ["#D6AD43", "#F0CC69", "#C79A3B"].includes(color)), false);
assert.equal(initialById.theme_liga_mexicana.metadata.brandingStatus, "provisional");
assert.match(initialById.theme_liga_mexicana.name, /Provisional/);
assert.equal("colors" in initialById.theme_liga_mexicana, false);

assert.equal(validateBroadcastTheme(getBroadcastTheme(snapshotRegistry, "snapshot_theme")).valid, true);
assert.equal(listBroadcastThemes(snapshotRegistry).length, 1);

console.log("broadcast-theme-engine.test.mjs: OK");

function createPublished(currentRegistry, definition, now) {
  let next = createBroadcastTheme(currentRegistry, definition, {
    actor: ACTOR_A,
    expectedRegistryRevision: currentRegistry?.revision,
    now
  });
  const draft = getBroadcastTheme(next, definition.themeId || definition.id);
  return publishBroadcastTheme(next, draft.themeId, {
    actor: ACTOR_A,
    expectedRegistryRevision: next.revision,
    expectedRevision: draft.revision,
    now
  });
}

function assetRef(assetId, tenantId = null) {
  return { assetId, version: "1.0.0", variantId: "original", tenantId, position: "center", scale: 1, visibility: "public" };
}

function themeDefinition(themeId, overrides = {}) {
  const { idOnly = false, ...custom } = overrides;
  return {
    ...(idOnly ? { id: themeId } : { themeId }),
    themeVersion: "1.0.0",
    name: `Theme ${themeId}`,
    description: `Theme ${themeId}`,
    status: "draft",
    visibility: "public",
    scope: "global",
    tenantId: null,
    organizationId: null,
    clientId: null,
    tournamentId: null,
    competitionId: null,
    eventId: null,
    baseThemeId: null,
    colors: { primary: "#111", secondary: "#222", accent: "#333", background: "#000", surface: "#181818", textPrimary: "#FFF" },
    typography: { body: { family: "Arial", weight: 400, size: 24, lineHeight: 1.2, tracking: 0, uppercase: false, capitalize: false, italic: false, fallbacks: ["sans-serif"] } },
    spacing: { none: 0, md: 16 },
    radius: { none: 0, md: 4 },
    borders: { panel: { width: 1, radius: 4, style: "solid", color: "#333" } },
    shadows: { panel: { x: 0, y: 4, blur: 12, opacity: 0.4, color: "#000" } },
    logos: {},
    backgrounds: { main: { type: "solid", color: "#000" }, transparent: { type: "transparent" } },
    icons: {},
    watermarks: {},
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    defaults: { enabled: false, count: 0, label: "", optional: null },
    metadata: { brandingStatus: "neutral" },
    ...custom
  };
}
