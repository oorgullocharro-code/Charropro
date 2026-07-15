export const THEME_ENGINE_VERSION = "1.0.0";

export const THEME_ENGINE_STATES = Object.freeze([
  "draft", "active", "inactive", "published", "deprecated", "error"
]);

export const THEME_ENGINE_ERROR_CODES = Object.freeze({
  REGISTRY_INVALID: "theme-registry-invalid",
  THEME_INVALID: "theme-invalid",
  THEME_NOT_FOUND: "theme-not-found",
  THEME_ID_DUPLICATE: "theme-id-duplicate",
  THEME_PATCH_INVALID: "theme-patch-invalid",
  THEME_PATCH_FIELD_FORBIDDEN: "theme-patch-field-forbidden",
  THEME_REVISION_CONFLICT: "theme-revision-conflict",
  THEME_ACTIVE_DELETE_BLOCKED: "theme-active-delete-blocked",
  THEME_ACTIVATION_BLOCKED: "theme-activation-blocked",
  THEME_BASE_NOT_FOUND: "theme-base-not-found",
  THEME_INHERITANCE_CYCLE: "theme-inheritance-cycle",
  THEME_INHERITANCE_DEPTH_EXCEEDED: "theme-inheritance-depth-exceeded",
  THEME_PUBLISHED_IMMUTABLE: "theme-published-immutable",
  THEME_TENANT_CONFLICT: "theme-tenant-conflict",
  THEME_ASSET_TENANT_CONFLICT: "theme-asset-tenant-conflict",
  THEME_ASSET_NOT_FOUND: "theme-asset-not-found",
  THEME_BACKGROUND_TYPE_INVALID: "theme-background-type-invalid",
  THEME_GRADIENT_STOP_LIMIT_EXCEEDED: "theme-gradient-stop-limit-exceeded",
  THEME_NUMBER_NON_FINITE: "theme-number-non-finite",
  THEME_NUMBER_OUT_OF_RANGE: "theme-number-out-of-range"
});

const THEME_VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const THEME_SCOPES = Object.freeze(["global", "tenant", "organization", "client", "tournament", "competition", "event"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const SCOPE_RANK = Object.freeze({ global: 0, tenant: 1, organization: 2, client: 3, tournament: 4, competition: 5, event: 6 });
const BACKGROUND_TYPES = new Set(["solid", "gradient", "asset", "transparent", "placeholder"]);
const GRADIENT_TYPES = new Set(["linear", "radial"]);
const BORDER_STYLES = new Set(["none", "solid", "dashed", "dotted"]);
const POSITIONS = new Set(["center", "top", "right", "bottom", "left", "top-left", "top-right", "bottom-left", "bottom-right"]);
const COLOR_KEYS = Object.freeze([
  "primary", "secondary", "accent", "success", "warning", "danger", "neutral",
  "background", "surface", "textPrimary", "textSecondary", "border", "highlight",
  "overlay", "transparent"
]);
const CONTEXT_FIELDS = Object.freeze([
  "tenantId", "organizationId", "clientId", "tournamentId", "competitionId", "eventId"
]);
const IMMUTABLE_FIELDS = new Set([
  "themeId", "id", "themeVersion", "tenantId", "organizationId", "clientId", "tournamentId",
  "competitionId", "eventId", "scope", "createdAt", "createdBy", "revision", "publishedAt", "publishedBy"
]);
const UPDATE_FIELDS = new Set([
  "name", "description", "status", "visibility", "baseThemeId", "colors", "typography",
  "spacing", "radius", "borders", "shadows", "logos", "backgrounds", "icons", "watermarks",
  "safeArea", "defaults", "metadata"
]);
const PUBLISHED_STATUSES = new Set(["published", "active", "inactive", "deprecated"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const EXECUTABLE_KEYS = new Set([
  "html", "script", "scripts", "javascript", "css", "style", "csstext", "stylesheet", "stylesheets",
  "plugin", "plugins", "hook", "hooks", "handler", "handlers", "renderer"
]);
const FORBIDDEN_REFERENCE_KEYS = new Set([
  "url", "src", "href", "externalurl", "signedurl", "storageref", "localdevelopmentref", "cdnref"
]);
const ASSET_REFERENCE_FIELDS = new Set([
  "assetId", "version", "variantId", "tenantId", "position", "scale", "visibility"
]);
const SECRET_KEYS = new Set([
  "password", "token", "apikey", "secret", "credentials", "signedurl", "privatekey", "authorization", "cookie"
]);
const ACTOR_KEYS = new Set(["actor", "createdby", "updatedby", "publishedby", "userid", "operatorid"]);
const INTERNAL_CONTEXT_KEYS = new Set(["tenantid", "organizationid", "clientid", "tournamentid", "competitionid", "eventid"]);
const PUBLIC_OPERATIONAL_KEYS = new Set(["permissions", "diagnostics", "sessionid"]);
const MAX_INHERITANCE_DEPTH = 12;
const MAX_DEPTH = 12;
const MAX_ARRAY_ITEMS = 100;
const MAX_OBJECT_KEYS = 200;
const MAX_TEXT_LENGTH = 2000;
const MAX_TOKEN_GROUPS = 40;
const MAX_GRADIENT_STOPS = 8;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SAFE_COLOR = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent)$/;
const UNSAFE_TEXT = /<\s*(?:script|iframe|object|embed|style|link)\b|\bon(?:error|load|click)\s*=|(?:^|[\s"'])\s*(?:javascript|file|data|vbscript):|@import|@font-face|\burl\s*\(|\bexpression\s*\(/i;
const UNSAFE_FONT = /font-face|@import|\burl\s*\(|(?:javascript|file|data|https?):|[{};<>]/i;

export class BroadcastThemeError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastThemeError";
    this.code = code;
    this.details = cloneSafe(details) || {};
  }
}

export function createBroadcastTheme(registry = {}, definition = {}, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  assertSafeInput(definition, THEME_ENGINE_ERROR_CODES.THEME_INVALID);
  const now = normalizeNow(options.now);
  const themeId = normalizeId(definition?.themeId || definition?.id) || buildThemeId(definition?.name, now, options.random);
  if (base.themes[themeId]) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ID_DUPLICATE, { themeId });
  const requestedStatus = definition?.status || "draft";
  if (!["draft", "error"].includes(requestedStatus)) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, { reason: "use-publish-api", status: requestedStatus });
  }
  const actor = normalizeActorId(options.actor) || normalizeActorId(definition?.createdBy);
  const theme = normalizeTheme({
    ...cloneSafe(definition),
    themeId,
    id: themeId,
    themeVersion: definition?.themeVersion || "1.0.0",
    revision: 0,
    status: requestedStatus,
    createdBy: actor,
    updatedBy: actor,
    createdAt: definition?.createdAt ?? now,
    updatedAt: definition?.updatedAt ?? now,
    publishedAt: null,
    publishedBy: null
  }, options);
  assertValidTheme(theme, options);
  const next = cloneRegistry(base);
  next.themes[theme.themeId] = theme;
  assertResolvableTheme(next, theme.themeId, options);
  touchRegistry(next, now);
  return next;
}

export function updateBroadcastTheme(registry, themeId, patch = {}, options = {}) {
  if (!isRecord(patch)) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID);
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTheme(base, themeId);
  assertThemeRevision(current, options.expectedRevision);
  if (isPublishedTheme(current)) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PUBLISHED_IMMUTABLE, { themeId: current.themeId });
  Object.keys(patch).forEach((key) => {
    if (IMMUTABLE_FIELDS.has(key) || DANGEROUS_KEYS.has(key)) {
      throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_FIELD_FORBIDDEN, { field: key });
    }
    if (!UPDATE_FIELDS.has(key)) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, { field: key });
  });
  if (["active", "published", "inactive", "deprecated"].includes(patch.status)) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, { reason: "use-lifecycle-api", status: patch.status });
  }
  assertSafeInput(patch, THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID);
  const now = normalizeNow(options.now);
  const candidate = normalizeTheme({
    ...current,
    ...cloneSafe(patch),
    themeId: current.themeId,
    id: current.themeId,
    themeVersion: current.themeVersion,
    revision: current.revision + 1,
    createdBy: current.createdBy,
    createdAt: current.createdAt,
    updatedBy: normalizeActorId(options.actor) || current.updatedBy,
    updatedAt: now,
    publishedAt: current.publishedAt,
    publishedBy: current.publishedBy
  }, options);
  assertValidTheme(candidate, options);
  const next = cloneRegistry(base);
  next.themes[current.themeId] = candidate;
  assertResolvableTheme(next, candidate.themeId, options);
  touchRegistry(next, now);
  return next;
}

export function deleteBroadcastTheme(registry, themeId, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTheme(base, themeId);
  assertThemeRevision(current, options.expectedRevision);
  if (current.status === "active" || isThemeActive(base, current.themeId)) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ACTIVE_DELETE_BLOCKED, { themeId: current.themeId });
  }
  if (isPublishedTheme(current)) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PUBLISHED_IMMUTABLE, { themeId: current.themeId });
  const dependents = Object.values(base.themes).filter((theme) => theme.baseThemeId === current.themeId);
  if (dependents.length && options.allowOrphanedChildren !== true) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, {
      reason: "theme-has-children",
      childIds: dependents.map((theme) => theme.themeId)
    });
  }
  const next = cloneRegistry(base);
  delete next.themes[current.themeId];
  removeThemeFromActiveScopes(next, current.themeId);
  touchRegistry(next, normalizeNow(options.now));
  return next;
}

export function duplicateBroadcastTheme(registry, themeId, overrides = {}, options = {}) {
  if (!isRecord(overrides)) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID);
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const source = requireTheme(base, themeId);
  const now = normalizeNow(options.now);
  const newThemeId = normalizeId(overrides.themeId || overrides.id) || buildThemeId(`${source.themeId}_copy`, now, options.random);
  const definition = {
    ...cloneBroadcastTheme(source),
    ...cloneSafe(overrides),
    themeId: newThemeId,
    id: newThemeId,
    name: normalizeText(overrides.name) || `${source.name} copia`,
    themeVersion: overrides.themeVersion || "1.0.0",
    status: "draft",
    revision: 0,
    publishedAt: null,
    publishedBy: null,
    createdBy: normalizeActorId(options.actor),
    updatedBy: normalizeActorId(options.actor),
    createdAt: now,
    updatedAt: now
  };
  return createBroadcastTheme(base, definition, { ...options, expectedRegistryRevision: base.revision, now });
}

export function publishBroadcastTheme(registry, themeId, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTheme(base, themeId);
  assertThemeRevision(current, options.expectedRevision);
  if (current.status !== "draft") {
    throw themeError(isPublishedTheme(current) ? THEME_ENGINE_ERROR_CODES.THEME_PUBLISHED_IMMUTABLE : THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, {
      themeId: current.themeId,
      status: current.status
    });
  }
  const actor = requireActor(options.actor);
  assertValidTheme(current, options);
  assertResolvableTheme(base, current.themeId, options);
  const now = normalizeNow(options.now);
  const next = cloneRegistry(base);
  next.themes[current.themeId] = normalizeTheme({
    ...current,
    status: "published",
    publishedAt: now,
    publishedBy: actor,
    updatedAt: now,
    updatedBy: actor,
    revision: current.revision + 1
  });
  touchRegistry(next, now);
  return next;
}

export function deprecateBroadcastTheme(registry, themeId, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTheme(base, themeId);
  assertThemeRevision(current, options.expectedRevision);
  if (!["published", "active", "inactive"].includes(current.status) || !current.publishedAt) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, { reason: "theme-not-published", themeId: current.themeId });
  }
  const actor = requireActor(options.actor);
  const now = normalizeNow(options.now);
  const next = cloneRegistry(base);
  next.themes[current.themeId] = normalizeTheme({
    ...current,
    status: "deprecated",
    updatedAt: now,
    updatedBy: actor,
    revision: current.revision + 1
  });
  removeThemeFromActiveScopes(next, current.themeId);
  syncLegacyActiveThemeId(next);
  touchRegistry(next, now);
  return next;
}

export function activateBroadcastTheme(registry, themeId, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTheme(base, themeId);
  assertThemeRevision(current, options.expectedRevision);
  if (!current.publishedAt || !["published", "inactive"].includes(current.status)) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ACTIVATION_BLOCKED, { themeId: current.themeId, status: current.status });
  }
  assertResolvableTheme(base, current.themeId, options);
  const actor = requireActor(options.actor);
  const now = normalizeNow(options.now);
  const scopeKey = getBroadcastThemeEffectiveScopeKey(current);
  const next = cloneRegistry(base);
  const previousId = next.activeThemes[scopeKey];
  if (previousId && previousId !== current.themeId && next.themes[previousId]) {
    const previous = next.themes[previousId];
    next.themes[previousId] = normalizeTheme({
      ...previous,
      status: "inactive",
      revision: previous.revision + 1,
      updatedAt: now,
      updatedBy: actor
    });
  }
  next.themes[current.themeId] = normalizeTheme({
    ...current,
    status: "active",
    revision: current.revision + 1,
    updatedAt: now,
    updatedBy: actor
  });
  next.activeThemes[scopeKey] = current.themeId;
  syncLegacyActiveThemeId(next);
  touchRegistry(next, now);
  return next;
}

export function deactivateBroadcastTheme(registry, themeId, options = {}) {
  const base = normalizeRegistry(registry, options);
  assertRegistryRevision(base, options.expectedRegistryRevision);
  const current = requireTheme(base, themeId);
  assertThemeRevision(current, options.expectedRevision);
  if (current.status !== "active" || !current.publishedAt) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ACTIVATION_BLOCKED, { reason: "theme-not-active", themeId: current.themeId });
  }
  const actor = requireActor(options.actor);
  const now = normalizeNow(options.now);
  const next = cloneRegistry(base);
  next.themes[current.themeId] = normalizeTheme({
    ...current,
    status: "inactive",
    revision: current.revision + 1,
    updatedAt: now,
    updatedBy: actor
  });
  removeThemeFromActiveScopes(next, current.themeId);
  syncLegacyActiveThemeId(next);
  touchRegistry(next, now);
  return next;
}

export function listBroadcastThemes(registry = {}, filter = {}) {
  const base = normalizeRegistry(registry);
  const rank = VISIBILITY_RANK[normalizeVisibility(filter.visibility)] ?? VISIBILITY_RANK.restricted;
  return Object.values(base.themes)
    .filter((theme) => !filter.status || theme.status === filter.status)
    .filter((theme) => !filter.visibility || VISIBILITY_RANK[theme.visibility] <= rank)
    .filter((theme) => !filter.baseThemeId || theme.baseThemeId === filter.baseThemeId)
    .filter((theme) => !filter.tenantId || theme.tenantId === filter.tenantId)
    .filter((theme) => !filter.scope || theme.scope === filter.scope)
    .sort((left, right) => left.name.localeCompare(right.name) || left.themeId.localeCompare(right.themeId))
    .map(cloneBroadcastTheme);
}

export function getBroadcastTheme(registry = {}, themeId) {
  const base = normalizeRegistry(registry);
  const theme = base.themes[normalizeId(themeId)];
  return theme ? cloneBroadcastTheme(theme) : null;
}

export function getBroadcastThemeEffectiveScopeKey(value = {}) {
  const scope = THEME_SCOPES.includes(value.scope) ? value.scope : "global";
  return [
    normalizeId(value.tenantId) || "global",
    scope,
    normalizeId(value.organizationId) || "",
    normalizeId(value.clientId) || "",
    normalizeId(value.tournamentId) || "",
    normalizeId(value.competitionId) || "",
    normalizeId(value.eventId) || ""
  ].join("|");
}

export function listActiveBroadcastThemes(registry = {}) {
  const base = normalizeRegistry(registry);
  return [...new Set(Object.values(base.activeThemes))]
    .map((themeId) => base.themes[themeId])
    .filter((theme) => theme?.status === "active")
    .sort((left, right) => getBroadcastThemeEffectiveScopeKey(left).localeCompare(getBroadcastThemeEffectiveScopeKey(right)))
    .map(cloneBroadcastTheme);
}

export function getActiveBroadcastThemeForContext(registry = {}, context = {}) {
  const base = normalizeRegistry(registry);
  const themeId = base.activeThemes[getBroadcastThemeEffectiveScopeKey(context)];
  return themeId && base.themes[themeId] ? cloneBroadcastTheme(base.themes[themeId]) : null;
}

export function resolveBroadcastTheme(registry = {}, themeId, options = {}) {
  const base = normalizeRegistry(registry, options);
  const id = normalizeId(themeId) || base.activeThemeId;
  const leaf = requireTheme(base, id);
  const chain = resolveInheritanceChain(base, leaf.themeId, options);
  const appearance = chain.reduce((resolved, theme) => mergeThemeAppearance(resolved, theme), emptyAppearance());
  const resolved = {
    themeEngineVersion: THEME_ENGINE_VERSION,
    themeId: leaf.themeId,
    id: leaf.themeId,
    themeVersion: leaf.themeVersion,
    name: leaf.name,
    description: leaf.description,
    revision: leaf.revision,
    status: leaf.status,
    visibility: leaf.visibility,
    scope: leaf.scope,
    tenantId: leaf.tenantId,
    organizationId: leaf.organizationId,
    clientId: leaf.clientId,
    tournamentId: leaf.tournamentId,
    competitionId: leaf.competitionId,
    eventId: leaf.eventId,
    baseThemeId: leaf.baseThemeId,
    ...appearance,
    resolvedFrom: chain.map((theme) => theme.themeId),
    createdBy: leaf.createdBy,
    updatedBy: leaf.updatedBy,
    publishedBy: leaf.publishedBy,
    createdAt: leaf.createdAt,
    updatedAt: leaf.updatedAt,
    publishedAt: leaf.publishedAt
  };
  const validation = validateBroadcastTheme(resolved, { ...options, resolved: true });
  if (!validation.valid) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_INVALID, { errors: validation.errors });
  return cloneBroadcastTheme(resolved);
}

export function validateBroadcastTheme(input, options = {}) {
  if (!isRecord(input)) return validationResult(false, ["theme-not-object"], []);
  const errors = [...collectSecurityErrors(input), ...collectRawThemeErrors(input)];
  const warnings = [];
  const theme = normalizeTheme(input, options);
  if (theme.themeEngineVersion !== THEME_ENGINE_VERSION) errors.push("theme-version-invalid");
  if (!isSafeId(theme.themeId)) errors.push("theme-id-invalid");
  if (!SEMVER.test(theme.themeVersion || "")) errors.push("theme-semver-invalid");
  if (!theme.name) errors.push("theme-name-required");
  if (!THEME_ENGINE_STATES.includes(theme.status)) errors.push("theme-status-invalid");
  if (!THEME_VISIBILITIES.includes(theme.visibility)) errors.push("theme-visibility-invalid");
  if (!THEME_SCOPES.includes(theme.scope)) errors.push("theme-scope-invalid");
  validateScopeContext(theme, errors);
  if (theme.baseThemeId !== null && !isSafeId(theme.baseThemeId)) errors.push("theme-base-id-invalid");
  if (theme.baseThemeId === theme.themeId) errors.push("theme-inheritance-self-cycle");
  if (!Number.isInteger(theme.revision) || theme.revision < 0) errors.push("theme-revision-invalid");
  if (!isIso(theme.createdAt) || !isIso(theme.updatedAt)) errors.push("theme-timestamp-invalid");
  if (isPublishedTheme(theme) && (!isIso(theme.publishedAt) || !theme.publishedBy)) errors.push("theme-publication-metadata-required");
  if (!isPublishedTheme(theme) && (theme.publishedAt !== null || theme.publishedBy !== null)) errors.push("theme-publication-metadata-unexpected");
  validateColors(theme.colors, errors);
  validateTypography(theme.typography, errors);
  validateNumberTokens(theme.spacing, "spacing", 0, 500, errors);
  validateNumberTokens(theme.radius, "radius", 0, 1000, errors);
  validateBorders(theme.borders, errors);
  validateShadows(theme.shadows, errors);
  validateAssetMap(theme.logos, "logos", errors);
  validateAssetMap(theme.icons, "icons", errors);
  validateBackgrounds(theme.backgrounds, errors);
  validateWatermarks(theme.watermarks, errors);
  validateSafeArea(theme.safeArea, errors);
  validateThemeAssetOwnership(theme, options, errors);
  if (!Object.keys(theme.colors).length) warnings.push("theme-colors-empty");
  if (!Object.keys(theme.typography).length) warnings.push("theme-typography-empty");
  if (theme.status !== "active") warnings.push(`theme-status-${theme.status}`);
  return validationResult(errors.length === 0, uniqueStrings(errors), uniqueStrings(warnings));
}

export function buildBroadcastThemeSnapshot(registry = {}, options = {}) {
  const base = normalizeRegistry(registry, options);
  const visibility = normalizeVisibility(options.visibility);
  if (options.tenantId !== undefined && options.tenantId !== null && !isSafeId(options.tenantId)) {
    throw themeError(THEME_ENGINE_ERROR_CODES.REGISTRY_INVALID, { reason: "snapshot-tenant-invalid" });
  }
  const tenantId = normalizeNullableId(options.tenantId);
  const themes = listBroadcastThemes(base, { visibility })
    .filter((theme) => !tenantId || theme.scope === "global" || theme.tenantId === tenantId)
    .map((theme) => {
    const value = options.resolve === true ? resolveBroadcastTheme(base, theme.themeId, options) : theme;
    return sanitizeSnapshotTheme(value, visibility);
  });
  const visibleIds = new Set(themes.map((theme) => theme.themeId));
  const activeThemeIds = [...new Set(Object.values(base.activeThemes))].filter((themeId) => visibleIds.has(themeId));
  const snapshot = {
    snapshotVersion: THEME_ENGINE_VERSION,
    themeEngineVersion: THEME_ENGINE_VERSION,
    generatedAt: normalizeNow(options.now),
    visibility,
    revision: base.revision,
    activeThemeId: visibleIds.has(base.activeThemeId) ? base.activeThemeId : null,
    activeThemeIds,
    themes,
    warnings: [],
    errors: []
  };
  if (visibility === "restricted") {
    snapshot.activeThemes = Object.fromEntries(Object.entries(base.activeThemes).filter(([, themeId]) => visibleIds.has(themeId)));
  }
  return snapshot;
}

export function cloneBroadcastTheme(theme) {
  return cloneSafe(theme) || {};
}

function normalizeRegistry(input = {}, options = {}) {
  if (isRecord(input) && hasOwn(input, "revision") && (!Number.isInteger(input.revision) || input.revision < 0)) {
    throw themeError(THEME_ENGINE_ERROR_CODES.REGISTRY_INVALID, { reason: "registry-revision-invalid" });
  }
  const raw = isRecord(input) ? cloneSafe(input) || {} : {};
  const now = normalizeNow(options.now);
  const revision = hasOwn(raw, "revision") ? raw.revision : 0;
  if (!Number.isInteger(revision) || revision < 0) throw themeError(THEME_ENGINE_ERROR_CODES.REGISTRY_INVALID, { reason: "registry-revision-invalid" });
  const themes = {};
  const source = Array.isArray(raw.themes) ? raw.themes : isRecord(raw.themes) ? Object.values(raw.themes) : [];
  source.slice(0, MAX_OBJECT_KEYS).forEach((value) => {
    const theme = normalizeTheme(value, options);
    if (isSafeId(theme.themeId)) themes[theme.themeId] = theme;
  });
  const activeThemes = {};
  if (isRecord(raw.activeThemes)) {
    Object.entries(raw.activeThemes).slice(0, MAX_OBJECT_KEYS).forEach(([key, themeId]) => {
      const theme = themes[themeId];
      if (typeof key === "string" && isSafeId(themeId) && theme?.status === "active" && key === getBroadcastThemeEffectiveScopeKey(theme)) {
        activeThemes[key] = themeId;
      }
    });
  }
  if (isSafeId(raw.activeThemeId) && themes[raw.activeThemeId]) {
    const legacyTheme = themes[raw.activeThemeId];
    if (legacyTheme.status === "active") activeThemes[getBroadcastThemeEffectiveScopeKey(legacyTheme)] = legacyTheme.themeId;
  }
  const registry = {
    themeEngineVersion: THEME_ENGINE_VERSION,
    revision,
    activeThemeId: null,
    activeThemes,
    themes,
    createdAt: normalizeTimestamp(raw.createdAt, now),
    updatedAt: normalizeTimestamp(raw.updatedAt, now)
  };
  syncLegacyActiveThemeId(registry);
  return registry;
}

function normalizeTheme(input = {}, options = {}) {
  const raw = cloneSafe(input) || {};
  const now = normalizeNow(options.now);
  const themeId = normalizeId(raw.themeId || raw.id);
  const createdAt = normalizeTimestamp(raw.createdAt, now);
  return {
    themeEngineVersion: THEME_ENGINE_VERSION,
    themeId,
    id: themeId,
    themeVersion: typeof raw.themeVersion === "string" ? raw.themeVersion : "1.0.0",
    name: normalizeText(raw.name),
    description: normalizeNullableText(raw.description),
    revision: hasOwn(raw, "revision") ? raw.revision : 0,
    status: typeof raw.status === "string" ? raw.status : "draft",
    visibility: typeof raw.visibility === "string" ? raw.visibility : "production",
    scope: typeof raw.scope === "string" ? raw.scope : null,
    tenantId: normalizeNullableId(raw.tenantId),
    organizationId: normalizeNullableId(raw.organizationId),
    clientId: normalizeNullableId(raw.clientId),
    tournamentId: normalizeNullableId(raw.tournamentId),
    competitionId: normalizeNullableId(raw.competitionId),
    eventId: normalizeNullableId(raw.eventId),
    baseThemeId: normalizeNullableId(raw.baseThemeId),
    colors: normalizeColors(raw.colors),
    typography: normalizeTypography(raw.typography),
    spacing: normalizeNumberTokens(raw.spacing),
    radius: normalizeNumberTokens(raw.radius),
    borders: normalizeBorders(raw.borders),
    shadows: normalizeShadows(raw.shadows),
    logos: normalizeAssetMap(raw.logos),
    backgrounds: normalizeBackgrounds(raw.backgrounds),
    icons: normalizeAssetMap(raw.icons),
    watermarks: normalizeWatermarks(raw.watermarks),
    safeArea: normalizeSafeArea(raw.safeArea),
    defaults: normalizeGenericObject(raw.defaults),
    metadata: normalizeGenericObject(raw.metadata),
    createdBy: normalizeActorId(raw.createdBy),
    updatedBy: normalizeActorId(raw.updatedBy),
    publishedBy: normalizeActorId(raw.publishedBy),
    createdAt,
    updatedAt: normalizeTimestamp(raw.updatedAt, createdAt),
    publishedAt: raw.publishedAt === null || raw.publishedAt === undefined ? null : normalizeTimestamp(raw.publishedAt, raw.publishedAt)
  };
}

function normalizeColors(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(COLOR_KEYS.filter((key) => hasOwn(source, key)).map((key) => [key, source[key]]));
}

function normalizeTypography(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => {
    const raw = isRecord(item) ? item : {};
    const token = {};
    ["family", "weight", "size", "lineHeight", "tracking", "uppercase", "capitalize", "italic", "fallbacks"].forEach((field) => {
      if (hasOwn(raw, field)) token[field] = cloneSafe(raw[field]);
    });
    return [key, token];
  }));
}

function normalizeNumberTokens(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => [key, item]));
}

function normalizeBorders(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => {
    const raw = isRecord(item) ? item : {};
    return [key, Object.fromEntries(["width", "radius", "style", "color"].filter((field) => hasOwn(raw, field)).map((field) => [field, raw[field]]))];
  }));
}

function normalizeShadows(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => {
    const raw = isRecord(item) ? item : {};
    return [key, Object.fromEntries(["x", "y", "blur", "opacity", "color"].filter((field) => hasOwn(raw, field)).map((field) => [field, raw[field]]))];
  }));
}

function normalizeAssetMap(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => [key, normalizeAssetReference(item)]));
}

function normalizeAssetReference(value) {
  const raw = isRecord(value) ? value : {};
  return {
    assetId: normalizeId(raw.assetId),
    version: raw.version === null || raw.version === undefined ? null : raw.version,
    variantId: normalizeNullableId(raw.variantId),
    tenantId: normalizeNullableId(raw.tenantId),
    position: hasOwn(raw, "position") ? raw.position : "center",
    scale: hasOwn(raw, "scale") ? raw.scale : 1,
    visibility: hasOwn(raw, "visibility") ? raw.visibility : "production"
  };
}

function normalizeBackgrounds(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => {
    if (!isRecord(item)) return [key, { type: item, gradientType: null, color: null, angle: null, stops: [], asset: null, placeholder: null }];
    const type = hasOwn(item, "type") ? item.type : null;
    return [key, {
      type,
      gradientType: type === "gradient" ? (item.gradientType || "linear") : null,
      color: hasOwn(item, "color") ? item.color : null,
      angle: hasOwn(item, "angle") ? item.angle : null,
      stops: Array.isArray(item.stops) ? item.stops.slice(0, MAX_ARRAY_ITEMS).map((stop) => ({ color: stop?.color, position: stop?.position })) : [],
      asset: item.asset !== undefined && item.asset !== null ? normalizeAssetReference(item.asset) : null,
      placeholder: hasOwn(item, "placeholder") ? item.placeholder : null
    }];
  }));
}

function normalizeWatermarks(value) {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(source).slice(0, MAX_TOKEN_GROUPS).map(([key, item]) => {
    const raw = isRecord(item) ? item : {};
    return [key, {
      asset: normalizeAssetReference(raw.asset),
      opacity: hasOwn(raw, "opacity") ? raw.opacity : 1,
      position: hasOwn(raw, "position") ? raw.position : "bottom-right",
      scale: hasOwn(raw, "scale") ? raw.scale : 1,
      safeArea: normalizeSafeArea(raw.safeArea)
    }];
  }));
}

function normalizeSafeArea(value) {
  const raw = isRecord(value) ? value : {};
  return Object.fromEntries(["top", "right", "bottom", "left"].filter((key) => hasOwn(raw, key)).map((key) => [key, raw[key]]));
}

function normalizeGenericObject(value) {
  return isRecord(value) ? cloneSafe(value) || {} : {};
}

function collectRawThemeErrors(input) {
  const errors = [];
  const identityId = input.themeId || input.id;
  if (identityId !== undefined && !isSafeId(identityId)) errors.push("theme-id-invalid");
  if (input.baseThemeId !== undefined && input.baseThemeId !== null && !isSafeId(input.baseThemeId)) errors.push("theme-base-id-invalid");
  CONTEXT_FIELDS.forEach((field) => {
    if (input[field] !== undefined && input[field] !== null && !isSafeId(input[field])) errors.push(`theme-context-id-invalid:${field}`);
  });
  if (isRecord(input.colors)) {
    Object.keys(input.colors).forEach((key) => {
      if (!COLOR_KEYS.includes(key)) errors.push(`theme-color-key-invalid:${key}`);
    });
  }
  collectRawAssetMapErrors(input.logos, "logos", errors);
  collectRawAssetMapErrors(input.icons, "icons", errors);
    if (isRecord(input.backgrounds)) {
    Object.entries(input.backgrounds).forEach(([key, background]) => {
      if (!isRecord(background)) {
        errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_BACKGROUND_TYPE_INVALID}:${key}`);
        return;
      }
      if (!hasOwn(background, "type") || !BACKGROUND_TYPES.has(background.type)) {
        errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_BACKGROUND_TYPE_INVALID}:${key}`);
      }
      if (background.type === "gradient" && Array.isArray(background.stops) && background.stops.length > MAX_GRADIENT_STOPS) {
        errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_GRADIENT_STOP_LIMIT_EXCEEDED}:${key}`);
      }
      if (background.type === "asset") collectRawAssetReferenceErrors(background.asset, `backgrounds.${key}.asset`, errors);
    });
  }
  if (isRecord(input.watermarks)) {
    Object.entries(input.watermarks).forEach(([key, watermark]) => collectRawAssetReferenceErrors(watermark?.asset, `watermarks.${key}.asset`, errors));
  }
  return uniqueStrings(errors);
}

function collectRawAssetMapErrors(value, path, errors) {
  if (!isRecord(value)) return;
  Object.entries(value).forEach(([key, reference]) => collectRawAssetReferenceErrors(reference, `${path}.${key}`, errors));
}

function collectRawAssetReferenceErrors(value, path, errors) {
  if (!isRecord(value)) {
    errors.push(`theme-asset-reference-invalid:${path}`);
    return;
  }
  Object.keys(value).forEach((field) => {
    if (!ASSET_REFERENCE_FIELDS.has(field)) errors.push(`theme-asset-field-invalid:${path}.${field}`);
  });
  if (value.assetId !== undefined && !isSafeId(value.assetId)) errors.push(`theme-asset-id-invalid:${path}`);
  if (value.version !== undefined && value.version !== null && !SEMVER.test(value.version)) errors.push(`theme-asset-version-invalid:${path}`);
  if (value.variantId !== undefined && value.variantId !== null && !isSafeId(value.variantId)) errors.push(`theme-asset-variant-invalid:${path}`);
  if (value.tenantId !== undefined && value.tenantId !== null && !isSafeId(value.tenantId)) errors.push(`theme-asset-tenant-invalid:${path}`);
}

function validateScopeContext(theme, errors) {
  const required = {
    tenant: "tenantId",
    organization: "organizationId",
    client: "clientId",
    tournament: "tournamentId",
    competition: "competitionId",
    event: "eventId"
  }[theme.scope];
  if (theme.scope === "global" && CONTEXT_FIELDS.some((field) => theme[field] !== null)) errors.push("theme-global-context-invalid");
  if (theme.scope !== "global" && !theme.tenantId) errors.push("theme-tenant-required");
  if (required && !theme[required]) errors.push(`theme-scope-context-required:${required}`);
}

function validateColors(colors, errors) {
  Object.entries(colors).forEach(([key, value]) => {
    if (!COLOR_KEYS.includes(key) || !isSafeColor(value)) errors.push(`theme-color-invalid:${key}`);
  });
}

function validateTypography(typography, errors) {
  Object.entries(typography).forEach(([key, value]) => {
    if (!isTokenKey(key)) errors.push(`theme-typography-key-invalid:${key}`);
    if (hasOwn(value, "family") && !isSafeFontFamily(value.family)) errors.push(`theme-typography-family-invalid:${key}`);
    if (hasOwn(value, "weight") && !isValidFontWeight(value.weight)) errors.push(`theme-typography-weight-invalid:${key}`);
    validateFiniteRange(value, "size", 1, 500, `theme-typography-size-invalid:${key}`, errors);
    validateFiniteRange(value, "lineHeight", Number.EPSILON, 10, `theme-typography-line-height-invalid:${key}`, errors);
    validateFiniteRange(value, "tracking", 0, 100, `theme-typography-tracking-invalid:${key}`, errors);
    ["uppercase", "capitalize", "italic"].forEach((field) => {
      if (hasOwn(value, field) && typeof value[field] !== "boolean") errors.push(`theme-typography-boolean-invalid:${key}:${field}`);
    });
    if (hasOwn(value, "fallbacks")) {
      if (!Array.isArray(value.fallbacks) || value.fallbacks.length > 10 || value.fallbacks.some((font) => !isSafeFontFamily(font))) {
        errors.push(`theme-typography-fallback-invalid:${key}`);
      }
    }
  });
}

function validateNumberTokens(tokens, label, min, max, errors) {
  Object.entries(tokens).forEach(([key, value]) => {
    if (!isTokenKey(key)) errors.push(`theme-${label}-key-invalid:${key}`);
    validateNumberValue(value, min, max, `theme-${label}-invalid:${key}`, errors);
  });
}

function validateBorders(borders, errors) {
  Object.entries(borders).forEach(([key, border]) => {
    if (!isTokenKey(key)) errors.push(`theme-border-key-invalid:${key}`);
    validateFiniteRange(border, "width", 0, 100, `theme-border-width-invalid:${key}`, errors);
    validateFiniteRange(border, "radius", 0, 1000, `theme-border-radius-invalid:${key}`, errors);
    if (hasOwn(border, "style") && !BORDER_STYLES.has(border.style)) errors.push(`theme-border-style-invalid:${key}`);
    if (hasOwn(border, "color") && !isSafeColor(border.color)) errors.push(`theme-border-color-invalid:${key}`);
  });
}

function validateShadows(shadows, errors) {
  Object.entries(shadows).forEach(([key, shadow]) => {
    if (!isTokenKey(key)) errors.push(`theme-shadow-key-invalid:${key}`);
    validateFiniteRange(shadow, "x", -500, 500, `theme-shadow-range-invalid:${key}:x`, errors);
    validateFiniteRange(shadow, "y", -500, 500, `theme-shadow-range-invalid:${key}:y`, errors);
    validateFiniteRange(shadow, "blur", 0, 500, `theme-shadow-range-invalid:${key}:blur`, errors);
    validateFiniteRange(shadow, "opacity", 0, 1, `theme-shadow-opacity-invalid:${key}`, errors);
    if (hasOwn(shadow, "color") && !isSafeColor(shadow.color)) errors.push(`theme-shadow-color-invalid:${key}`);
  });
}

function validateAssetMap(map, label, errors) {
  Object.entries(map).forEach(([key, asset]) => {
    if (!isTokenKey(key) || !isSafeId(asset.assetId)) errors.push(`theme-${label}-asset-invalid:${key}`);
    if (asset.version !== null && !SEMVER.test(asset.version)) errors.push(`theme-${label}-version-invalid:${key}`);
    if (asset.variantId !== null && !isSafeId(asset.variantId)) errors.push(`theme-${label}-variant-invalid:${key}`);
    if (asset.tenantId !== null && !isSafeId(asset.tenantId)) errors.push(`theme-${label}-tenant-invalid:${key}`);
    if (!POSITIONS.has(asset.position)) errors.push(`theme-${label}-position-invalid:${key}`);
    validateNumberValue(asset.scale, Number.EPSILON, 10, `theme-${label}-scale-invalid:${key}`, errors);
    if (!THEME_VISIBILITIES.includes(asset.visibility)) errors.push(`theme-${label}-visibility-invalid:${key}`);
  });
}

function validateBackgrounds(backgrounds, errors) {
  Object.entries(backgrounds).forEach(([key, background]) => {
    if (!BACKGROUND_TYPES.has(background.type)) {
      errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_BACKGROUND_TYPE_INVALID}:${key}`);
      return;
    }
    if (background.type === "solid" && !isSafeColor(background.color)) errors.push(`theme-background-color-invalid:${key}`);
    if (background.type === "gradient") {
      if (!GRADIENT_TYPES.has(background.gradientType)) errors.push(`theme-gradient-type-invalid:${key}`);
      if (background.gradientType === "linear") validateNumberValue(background.angle, 0, 360, `theme-background-angle-invalid:${key}`, errors);
      if (background.stops.length > MAX_GRADIENT_STOPS) errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_GRADIENT_STOP_LIMIT_EXCEEDED}:${key}`);
      if (background.stops.length < 2 || background.stops.some((stop) => !isSafeColor(stop.color) || !Number.isFinite(stop.position) || stop.position < 0 || stop.position > 1)) {
        errors.push(`theme-background-stops-invalid:${key}`);
      }
    }
    if (background.type === "asset") {
      if (!background.asset) errors.push(`theme-background-asset-required:${key}`);
      else validateAssetMap({ [key]: background.asset }, "background", errors);
    }
    if (background.type === "transparent" && (background.color !== null || background.asset !== null)) errors.push(`theme-background-transparent-payload:${key}`);
    if (background.type === "placeholder" && (typeof background.placeholder !== "string" || !background.placeholder.trim())) errors.push(`theme-background-placeholder-invalid:${key}`);
  });
}

function validateWatermarks(watermarks, errors) {
  Object.entries(watermarks).forEach(([key, watermark]) => {
    validateAssetMap({ [key]: watermark.asset }, "watermark", errors);
    validateNumberValue(watermark.opacity, 0, 1, `theme-watermark-opacity-invalid:${key}`, errors);
    if (!POSITIONS.has(watermark.position)) errors.push(`theme-watermark-position-invalid:${key}`);
    validateNumberValue(watermark.scale, Number.EPSILON, 10, `theme-watermark-scale-invalid:${key}`, errors);
    validateSafeArea(watermark.safeArea, errors, `watermark:${key}`);
  });
}

function validateSafeArea(safeArea, errors, prefix = "theme") {
  Object.entries(safeArea).forEach(([key, value]) => validateNumberValue(value, 0, 2000, `${prefix}-safe-area-invalid:${key}`, errors));
}

function validateFiniteRange(record, field, min, max, code, errors) {
  if (hasOwn(record, field)) validateNumberValue(record[field], min, max, code, errors);
}

function validateNumberValue(value, min, max, code, errors) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_NUMBER_NON_FINITE}:${code}`);
    return;
  }
  if (value < min || value > max) errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_NUMBER_OUT_OF_RANGE}:${code}`);
}

function validateThemeAssetOwnership(theme, options, errors) {
  collectThemeAssetReferences(theme).forEach((reference) => {
    const asset = options.assetRegistry ? findAsset(options.assetRegistry, reference.assetId, reference.version) : null;
    if (options.assetRegistry && !asset) errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_ASSET_NOT_FOUND}:${reference.assetId}`);
    const referenceTenant = reference.tenantId || normalizeNullableId(asset?.tenantId);
    if (reference.tenantId && asset?.tenantId && reference.tenantId !== asset.tenantId) {
      errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT}:${reference.assetId}`);
    }
    if (theme.scope === "global" && referenceTenant) errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT}:${reference.assetId}`);
    if (theme.scope !== "global" && referenceTenant && referenceTenant !== theme.tenantId) {
      errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT}:${reference.assetId}`);
    }
  });
}

function collectThemeAssetReferences(theme) {
  const references = [...Object.values(theme.logos), ...Object.values(theme.icons)];
  Object.values(theme.backgrounds).forEach((background) => { if (background.type === "asset" && background.asset) references.push(background.asset); });
  Object.values(theme.watermarks).forEach((watermark) => references.push(watermark.asset));
  return references;
}

function findAsset(registry, assetId, version) {
  const source = Array.isArray(registry) ? registry : Array.isArray(registry?.assets) ? registry.assets : isRecord(registry?.assets) ? Object.values(registry.assets) : [];
  return source.find((asset) => asset?.assetId === assetId && (!version || !asset.version || asset.version === version)) || null;
}

function resolveInheritanceChain(registry, themeId, options = {}) {
  const chain = [];
  const visiting = new Set();
  let current = requireTheme(registry, themeId);
  while (current) {
    if (visiting.has(current.themeId)) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_INHERITANCE_CYCLE, { chain: [...visiting, current.themeId] });
    if (chain.length >= MAX_INHERITANCE_DEPTH) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_INHERITANCE_DEPTH_EXCEEDED, { themeId, maxDepth: MAX_INHERITANCE_DEPTH });
    visiting.add(current.themeId);
    chain.unshift(current);
    if (!current.baseThemeId) break;
    const parent = registry.themes[current.baseThemeId];
    if (!parent) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_BASE_NOT_FOUND, { baseThemeId: current.baseThemeId });
    assertInheritanceAllowed(current, parent, options);
    current = parent;
  }
  return chain;
}

function assertInheritanceAllowed(child, parent, options = {}) {
  if (child.scope === "global") {
    if (parent.scope !== "global") throw themeError(THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT, { child: child.themeId, parent: parent.themeId });
    return;
  }
  if (parent.scope === "global") {
    if (parent.metadata?.allowTenantInheritance !== true && options.allowGlobalInheritance !== true) {
      throw themeError(THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT, { reason: "global-inheritance-not-authorized", child: child.themeId, parent: parent.themeId });
    }
    return;
  }
  if (!child.tenantId || child.tenantId !== parent.tenantId) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT, { child: child.themeId, parent: parent.themeId });
  }
  if (SCOPE_RANK[parent.scope] > SCOPE_RANK[child.scope]) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT, { reason: "scope-order", child: child.themeId, parent: parent.themeId });
  }
  CONTEXT_FIELDS.slice(1).forEach((field) => {
    if (parent[field] && child[field] !== parent[field]) {
      throw themeError(THEME_ENGINE_ERROR_CODES.THEME_TENANT_CONFLICT, { reason: field, child: child.themeId, parent: parent.themeId });
    }
  });
}

function assertResolvableTheme(registry, themeId, options) {
  const theme = requireTheme(registry, themeId);
  const chain = resolveInheritanceChain(registry, themeId, options);
  const errors = [];
  chain.forEach((entry) => validateThemeAssetOwnership(entry, options, errors));
  if (errors.some((error) => error.startsWith(THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT))) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT, { themeId: theme.themeId, errors: uniqueStrings(errors) });
  }
  if (errors.some((error) => error.startsWith(THEME_ENGINE_ERROR_CODES.THEME_ASSET_NOT_FOUND))) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ASSET_NOT_FOUND, { themeId: theme.themeId, errors: uniqueStrings(errors) });
  }
  if (errors.length) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_INVALID, { errors: uniqueStrings(errors) });
}

function emptyAppearance() {
  return {
    colors: {}, typography: {}, spacing: {}, radius: {}, borders: {}, shadows: {}, logos: {},
    backgrounds: {}, icons: {}, watermarks: {}, safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    defaults: {}, metadata: {}
  };
}

function mergeThemeAppearance(base, theme) {
  return {
    colors: mergeObjects(base.colors, theme.colors),
    typography: mergeNestedObjects(base.typography, theme.typography),
    spacing: mergeObjects(base.spacing, theme.spacing),
    radius: mergeObjects(base.radius, theme.radius),
    borders: mergeNestedObjects(base.borders, theme.borders),
    shadows: mergeNestedObjects(base.shadows, theme.shadows),
    logos: mergeNestedObjects(base.logos, theme.logos),
    backgrounds: mergeNestedObjects(base.backgrounds, theme.backgrounds),
    icons: mergeNestedObjects(base.icons, theme.icons),
    watermarks: mergeNestedObjects(base.watermarks, theme.watermarks),
    safeArea: mergeObjects(base.safeArea, theme.safeArea),
    defaults: mergeNestedObjects(base.defaults, theme.defaults),
    metadata: mergeNestedObjects(base.metadata, theme.metadata)
  };
}

function mergeObjects(base, override) {
  return { ...cloneSafe(base), ...cloneSafe(override) };
}

function mergeNestedObjects(base, override) {
  const result = cloneSafe(base) || {};
  Object.entries(override || {}).forEach(([key, value]) => {
    result[key] = isRecord(value) && isRecord(result[key]) ? { ...result[key], ...cloneSafe(value) } : cloneSafe(value);
  });
  return result;
}

function sanitizeSnapshotTheme(theme, visibility) {
  const visit = (value, depth = 0, path = []) => {
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
    if (depth > MAX_DEPTH || typeof value !== "object") return undefined;
    if (Array.isArray(value)) return value.slice(0, MAX_ARRAY_ITEMS).map((item) => visit(item, depth + 1, path)).filter((item) => item !== undefined);
    const result = {};
    Object.entries(value).slice(0, MAX_OBJECT_KEYS).forEach(([key, item]) => {
      const normalized = normalizeFieldName(key);
      if (DANGEROUS_KEYS.has(key) || SECRET_KEYS.has(normalized) || EXECUTABLE_KEYS.has(normalized) || FORBIDDEN_REFERENCE_KEYS.has(normalized) || normalized.endsWith("url")) return;
      if (visibility === "public" && (key === "id" || key === "scope" || INTERNAL_CONTEXT_KEYS.has(normalized) || ACTOR_KEYS.has(normalized) || PUBLIC_OPERATIONAL_KEYS.has(normalized))) return;
      if (visibility === "production" && (INTERNAL_CONTEXT_KEYS.has(normalized) || ACTOR_KEYS.has(normalized))) return;
      if (visibility === "public" && key === "metadata") {
        const brandingStatus = isRecord(item) && ["confirmed", "provisional", "neutral"].includes(item.brandingStatus) ? item.brandingStatus : null;
        if (brandingStatus) result.metadata = { brandingStatus };
        return;
      }
      const safe = visit(item, depth + 1, [...path, key]);
      if (safe !== undefined) result[key] = safe;
    });
    return result;
  };
  return visit(theme);
}

function collectSecurityErrors(value) {
  const errors = [];
  const ancestors = new WeakSet();
  const visit = (current, path, depth) => {
    if (current === null || current === undefined) return;
    const type = typeof current;
    if (["function", "symbol", "bigint"].includes(type)) {
      errors.push(`theme-unsafe-value:${path || "root"}`);
      return;
    }
    if (type === "number" && !Number.isFinite(current)) {
      errors.push(`${THEME_ENGINE_ERROR_CODES.THEME_NUMBER_NON_FINITE}:${path || "root"}`);
      return;
    }
    if (type === "string") {
      if (current.length > MAX_TEXT_LENGTH) errors.push(`theme-text-limit:${path || "root"}`);
      if (UNSAFE_TEXT.test(current)) errors.push(`theme-unsafe-text:${path || "root"}`);
      return;
    }
    if (type !== "object") return;
    if (depth > MAX_DEPTH) {
      errors.push(`theme-depth-limit:${path || "root"}`);
      return;
    }
    if (ancestors.has(current)) {
      errors.push(`theme-cycle:${path || "root"}`);
      return;
    }
    ancestors.add(current);
    if (Array.isArray(current)) {
      if (current.length > MAX_ARRAY_ITEMS) errors.push(`theme-array-limit:${path || "root"}`);
      current.slice(0, MAX_ARRAY_ITEMS).forEach((item, index) => visit(item, `${path}[${index}]`, depth + 1));
    } else {
      const descriptors = Object.getOwnPropertyDescriptors(current);
      const entries = Object.entries(descriptors);
      if (entries.length > MAX_OBJECT_KEYS) errors.push(`theme-object-limit:${path || "root"}`);
      entries.slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
        const normalized = normalizeFieldName(key);
        const declarativeBorderStyle = normalized === "style" && /^borders\.[A-Za-z][A-Za-z0-9_-]*$/.test(path);
        if (DANGEROUS_KEYS.has(key) || (EXECUTABLE_KEYS.has(normalized) && !declarativeBorderStyle) || FORBIDDEN_REFERENCE_KEYS.has(normalized)) {
          errors.push(`theme-key-forbidden:${path ? `${path}.` : ""}${key}`);
        }
        if (descriptor.get || descriptor.set) errors.push(`theme-accessor-forbidden:${path ? `${path}.` : ""}${key}`);
        else visit(descriptor.value, path ? `${path}.${key}` : key, depth + 1);
      });
    }
    ancestors.delete(current);
  };
  visit(value, "", 0);
  return uniqueStrings(errors);
}

function assertSafeInput(value, errorCode) {
  const errors = uniqueStrings([...collectSecurityErrors(value), ...collectRawThemeErrors(value)]);
  if (errors.length) throw themeError(errorCode, { errors });
}

function cloneSafe(value, depth = 0, ancestors = new WeakSet()) {
  if (value === null) return null;
  if (["string", "boolean"].includes(typeof value)) return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
  if (depth > MAX_DEPTH || typeof value !== "object" || ancestors.has(value)) return undefined;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = value.slice(0, MAX_ARRAY_ITEMS).map((item) => cloneSafe(item, depth + 1, ancestors)).filter((item) => item !== undefined);
    ancestors.delete(value);
    return result;
  }
  const result = {};
  Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key) || descriptor.get || descriptor.set) return;
    const cloned = cloneSafe(descriptor.value, depth + 1, ancestors);
    if (cloned !== undefined) result[key] = cloned;
  });
  ancestors.delete(value);
  return result;
}

function assertValidTheme(theme, options = {}) {
  const validation = validateBroadcastTheme(theme, options);
  if (validation.valid) return;
  if (validation.errors.some((error) => error.startsWith(THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT))) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ASSET_TENANT_CONFLICT, { themeId: theme.themeId, errors: validation.errors });
  }
  if (validation.errors.some((error) => error.startsWith(THEME_ENGINE_ERROR_CODES.THEME_ASSET_NOT_FOUND))) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_ASSET_NOT_FOUND, { themeId: theme.themeId, errors: validation.errors });
  }
  throw themeError(THEME_ENGINE_ERROR_CODES.THEME_INVALID, { errors: validation.errors });
}

function assertRegistryRevision(registry, expected) {
  if (expected !== undefined && expected !== registry.revision) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_REVISION_CONFLICT, { expected, actual: registry.revision });
  }
}

function assertThemeRevision(theme, expected) {
  if (expected !== undefined && expected !== theme.revision) {
    throw themeError(THEME_ENGINE_ERROR_CODES.THEME_REVISION_CONFLICT, { expected, actual: theme.revision });
  }
}

function requireTheme(registry, themeId) {
  const id = normalizeId(themeId);
  const theme = registry.themes[id];
  if (!theme) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_NOT_FOUND, { themeId: id });
  return theme;
}

function requireActor(actor) {
  const actorId = normalizeActorId(actor);
  if (!actorId) throw themeError(THEME_ENGINE_ERROR_CODES.THEME_PATCH_INVALID, { reason: "actor-required" });
  return actorId;
}

function cloneRegistry(registry) {
  return {
    ...registry,
    activeThemes: { ...registry.activeThemes },
    themes: Object.fromEntries(Object.entries(registry.themes).map(([themeId, theme]) => [themeId, cloneBroadcastTheme(theme)]))
  };
}

function touchRegistry(registry, now) {
  registry.revision += 1;
  registry.updatedAt = now;
}

function removeThemeFromActiveScopes(registry, themeId) {
  Object.entries(registry.activeThemes).forEach(([key, activeId]) => {
    if (activeId === themeId) delete registry.activeThemes[key];
  });
}

function syncLegacyActiveThemeId(registry) {
  const globalKey = getBroadcastThemeEffectiveScopeKey({ scope: "global" });
  registry.activeThemeId = registry.activeThemes[globalKey] || null;
}

function isThemeActive(registry, themeId) {
  return Object.values(registry.activeThemes).includes(themeId);
}

function isPublishedTheme(theme) {
  return PUBLISHED_STATUSES.has(theme.status) || Boolean(theme.publishedAt);
}

function buildThemeId(name, now, random) {
  const slug = normalizeId(String(name || "theme").toLowerCase().replace(/[^a-z0-9]+/g, "_")) || "theme";
  const suffix = typeof random === "function" ? String(random()).replace(/[^a-z0-9]/gi, "").slice(0, 8) : Math.random().toString(36).slice(2, 8);
  return `${slug}_${Date.parse(now)}_${suffix}`.slice(0, 128);
}

function normalizeVisibility(value) {
  return THEME_VISIBILITIES.includes(value) ? value : "production";
}

function normalizeActorId(value) {
  if (typeof value === "string") return normalizeText(value) || null;
  if (!isRecord(value)) return null;
  return normalizeText(value.id || value.userId || value.uid || value.name) || null;
}

function normalizeNullableId(value) {
  return value === null || value === undefined || value === "" ? null : normalizeId(value);
}

function isValidFontWeight(value) {
  return ["normal", "bold", "lighter", "bolder"].includes(value) || (Number.isInteger(value) && value >= 100 && value <= 900);
}

function isSafeFontFamily(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 100 && /^[\p{L}\p{N} ,-]+$/u.test(value) && !UNSAFE_FONT.test(value);
}

function isSafeColor(value) {
  return typeof value === "string" && SAFE_COLOR.test(value);
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value);
}

function isTokenKey(value) {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value) && !DANGEROUS_KEYS.has(value);
}

function normalizeId(value) {
  return isSafeId(value) ? value : null;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT_LENGTH) : "";
}

function normalizeNullableText(value) {
  return value === null || value === undefined ? null : normalizeText(value) || null;
}

function normalizeNow(value) {
  return normalizeIso(value) || new Date().toISOString();
}

function normalizeTimestamp(value, fallback) {
  if (value === null || value === undefined) return fallback;
  return normalizeIso(value) || value;
}

function normalizeIso(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function isIso(value) {
  return normalizeIso(value) === value;
}

function normalizeFieldName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value))];
}

function validationResult(valid, errors, warnings) {
  return { valid, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), themeEngineVersion: THEME_ENGINE_VERSION };
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function themeError(code, details = {}) {
  return new BroadcastThemeError(code, details);
}
