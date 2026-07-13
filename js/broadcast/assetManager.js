export const ASSET_MANAGER_VERSION = "1.0.0";

export const ASSET_TYPES = Object.freeze([
  "image", "logo", "photo", "background", "video", "audio", "font", "icon", "svg",
  "animation", "lottie", "sponsor", "watermark", "thumbnail", "overlay", "lower_third",
  "bumper", "stinger", "qr", "document", "data", "custom"
]);

export const ASSET_STATUSES = Object.freeze([
  "draft", "validating", "pending_review", "approved", "published", "deprecated", "archived",
  "rejected", "unavailable", "expired", "revoked", "error"
]);

export const ASSET_VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);

export const ASSET_SCOPES = Object.freeze([
  "global", "tenant", "organization", "client", "tournament", "competition", "charreada",
  "output", "user", "session"
]);

export const ASSET_VARIANT_TYPES = Object.freeze([
  "thumbnail", "low_resolution", "medium_resolution", "high_resolution", "transparent",
  "dark_background", "light_background", "landscape", "portrait", "square", "panoramic",
  "mobile", "led", "preview", "program", "compressed", "original"
]);

const FALLBACK_STRATEGIES = Object.freeze([
  "none", "inherit", "default_by_type", "default_by_scope", "placeholder", "hide_component"
]);
const SOURCE_TYPES = Object.freeze(["none", "storage", "external", "local_development", "cdn"]);
const CHECKSUM_ALGORITHMS = Object.freeze({ sha256: 64, sha384: 96, sha512: 128 });
const INTEGRITY_STATUSES = Object.freeze(["unknown", "pending", "verified", "failed", "mismatch"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const IMMUTABLE_PATCH_FIELDS = new Set([
  "assetId", "assetFamilyId", "assetManagerVersion", "createdAt", "createdBy", "tenantId", "version", "revision",
  "checksum", "checksumAlgorithm", "parentVersion", "previousVersion", "nextVersion"
]);
const UPDATE_ALLOWLIST = new Set([
  "name", "description", "type", "mimeType", "extension", "status", "visibility", "scope",
  "storageRef", "externalUrl", "localDevelopmentRef", "cdnRef", "sourceType", "fileSize",
  "dimensions", "duration", "frameRate", "audioChannels", "codec", "bitrate", "sampleRate",
  "channels", "hasAlpha", "hasAudio", "colorProfile", "orientation", "metadata", "tags",
  "categories", "rights", "sponsor", "font", "fallbackAssetId", "fallbackVariantId",
  "fallbackStrategy", "expiresAt", "warnings", "errors", "changelog", "migrationNotes"
]);
const IMMUTABLE_VERSION_STATUSES = new Set(["published", "deprecated", "archived", "expired", "revoked"]);
const MAX_DEPTH = 12;
const MAX_ARRAY_LENGTH = 250;
const MAX_TAGS = 50;
const MAX_TAG_LENGTH = 64;
const MAX_FALLBACK_DEPTH = 6;
const DEFAULT_RIGHTS_WARNING_DAYS = 30;
const SENSITIVE_MANIFEST_KEYS = new Set([
  "password", "pass", "passwd", "secret", "apikey", "token", "accesstoken", "refreshtoken",
  "auth", "authorization", "credential", "credentials", "privatekey", "clientsecret", "signedurl",
  "sessiontoken", "cookie", "cookies"
]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const SCOPE_RANK = Object.freeze({
  global: 0,
  tenant: 10,
  organization: 20,
  client: 30,
  tournament: 40,
  competition: 50,
  charreada: 60,
  output: 70,
  user: 80,
  session: 90
});
const STATUS_RESOLUTION_RANK = Object.freeze({ published: 30, deprecated: 20, approved: 10 });
const SCOPE_ID_FIELDS = Object.freeze({
  tenant: "tenantId",
  organization: "organizationId",
  client: "clientId",
  tournament: "tournamentId",
  competition: "competitionId",
  charreada: "charreadaId",
  output: "outputId",
  user: "userId",
  session: "sessionId"
});
const STATUS_TRANSITIONS = Object.freeze({
  draft: Object.freeze(["validating", "pending_review", "approved", "rejected", "unavailable", "error"]),
  validating: Object.freeze(["pending_review", "approved", "rejected", "unavailable", "error"]),
  pending_review: Object.freeze(["approved", "rejected", "unavailable", "error"]),
  approved: Object.freeze(["draft", "published", "rejected", "unavailable", "error"]),
  published: Object.freeze(["deprecated", "revoked", "unavailable", "expired", "error"]),
  deprecated: Object.freeze(["archived", "revoked", "unavailable", "expired", "error"]),
  archived: Object.freeze(["draft", "deprecated"]),
  rejected: Object.freeze(["draft", "validating"]),
  unavailable: Object.freeze(["draft", "approved", "published", "deprecated", "error"]),
  expired: Object.freeze(["archived", "revoked"]),
  revoked: Object.freeze([]),
  error: Object.freeze(["draft", "validating", "unavailable"])
});
const IMAGE_TYPES = new Set([
  "image", "logo", "photo", "background", "icon", "sponsor", "watermark", "thumbnail",
  "overlay", "lower_third", "qr"
]);
const VIDEO_TYPES = new Set(["video", "bumper", "stinger"]);

export class BroadcastAssetError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastAssetError";
    this.code = code;
    this.details = cloneSerializable(details, [], "error.details") || {};
  }
}

export function createBroadcastAsset(input = {}, options = {}) {
  if (!isRecord(input)) throw assetError("asset-not-object");
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const raw = cloneSerializable(input, [], "asset") || {};
  const actor = normalizeActor(firstDefined(options.actor, raw.createdBy));
  const assetId = normalizeId(firstDefined(raw.assetId, options.assetId)) || buildAssetId(now, options.random);
  const requestedVersion = nullableString(raw.version) || "1.0.0";
  const suppliedFamilyId = normalizeId(firstDefined(raw.assetFamilyId, options.assetFamilyId));
  const assetFamilyId = suppliedFamilyId || (requestedVersion === "1.0.0" ? assetId : null);
  const status = nullableString(raw.status) || "draft";
  const asset = normalizeBroadcastAsset({
    ...raw,
    assetId,
    assetFamilyId,
    status,
    revision: firstDefined(raw.revision, 0),
    createdAt: firstDefined(raw.createdAt, now),
    updatedAt: firstDefined(raw.updatedAt, now),
    createdBy: firstDefined(raw.createdBy, actor),
    updatedBy: firstDefined(raw.updatedBy, actor),
    ownerId: firstDefined(raw.ownerId, actor?.userId),
    ownerName: firstDefined(raw.ownerName, actor?.name),
    publishedAt: status === "published" ? firstDefined(raw.publishedAt, now) : raw.publishedAt
  }, { ...options, now });
  assertValidAsset(asset, options);
  return asset;
}

export function normalizeBroadcastAsset(input = {}, options = {}) {
  const cloneWarnings = [];
  const raw = cloneSerializable(isRecord(input) ? input : {}, cloneWarnings, "asset") || {};
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const type = nullableString(raw.type) || "image";
  const mimeType = normalizeMimeType(raw.mimeType);
  const sourceType = normalizeSourceType(raw);
  const variants = normalizeVariants(raw.variants, now);
  const createdAt = normalizeIsoDate(raw.createdAt) || now;
  const normalized = {
    assetManagerVersion: ASSET_MANAGER_VERSION,
    assetId: normalizeId(raw.assetId),
    assetFamilyId: normalizeId(raw.assetFamilyId),
    name: nullableString(raw.name),
    description: nullableString(raw.description),
    type,
    mimeType,
    extension: normalizeExtension(raw.extension),
    status: nullableString(raw.status) || "draft",
    visibility: nullableString(raw.visibility) || "production",
    scope: nullableString(raw.scope) || "organization",
    tenantId: nullableId(raw.tenantId),
    organizationId: nullableId(raw.organizationId),
    clientId: nullableId(raw.clientId),
    tournamentId: nullableId(raw.tournamentId),
    competitionId: nullableId(raw.competitionId),
    charreadaId: nullableId(raw.charreadaId),
    outputId: nullableId(raw.outputId),
    userId: nullableId(raw.userId),
    sessionId: nullableId(raw.sessionId),
    ownerId: nullableId(raw.ownerId),
    ownerName: nullableString(raw.ownerName),
    storageRef: nullableString(raw.storageRef),
    externalUrl: nullableString(raw.externalUrl),
    localDevelopmentRef: nullableString(raw.localDevelopmentRef),
    cdnRef: nullableString(raw.cdnRef),
    signedUrl: nullableString(raw.signedUrl),
    sourceType,
    checksum: normalizeChecksum(raw.checksum),
    checksumAlgorithm: normalizeChecksumAlgorithm(raw.checksumAlgorithm, raw.checksum),
    integrityStatus: INTEGRITY_STATUSES.includes(raw.integrityStatus) ? raw.integrityStatus : "unknown",
    verifiedAt: normalizeIsoDate(raw.verifiedAt),
    verifiedBy: normalizeActor(raw.verifiedBy),
    fileSize: nonNegativeIntegerOrNull(raw.fileSize),
    dimensions: normalizeDimensions(raw.dimensions),
    duration: nonNegativeNumberOrNull(raw.duration),
    frameRate: positiveNumberOrNull(raw.frameRate),
    audioChannels: positiveIntegerOrNull(raw.audioChannels),
    codec: nullableString(raw.codec),
    bitrate: positiveNumberOrNull(raw.bitrate),
    sampleRate: positiveNumberOrNull(raw.sampleRate),
    channels: positiveIntegerOrNull(raw.channels),
    hasAlpha: nullableBoolean(raw.hasAlpha),
    hasAudio: nullableBoolean(raw.hasAudio),
    colorProfile: nullableString(raw.colorProfile),
    orientation: normalizeOrientation(raw.orientation, raw.dimensions),
    version: nullableString(raw.version) || "1.0.0",
    revision: nonNegativeInteger(raw.revision, 0),
    parentVersion: nullableString(raw.parentVersion),
    previousVersion: nullableString(raw.previousVersion),
    nextVersion: nullableString(raw.nextVersion),
    changelog: nullableString(raw.changelog),
    migrationNotes: nullableString(raw.migrationNotes),
    variants,
    tags: normalizeLabels(raw.tags),
    categories: normalizeLabels(raw.categories),
    rights: normalizeRights(raw.rights),
    sponsor: normalizeSponsor(raw.sponsor),
    font: normalizeFont(raw.font),
    metadata: normalizeMetadata(raw.metadata),
    fallbackAssetId: nullableId(raw.fallbackAssetId),
    fallbackVariantId: nullableId(raw.fallbackVariantId),
    fallbackStrategy: FALLBACK_STRATEGIES.includes(raw.fallbackStrategy) ? raw.fallbackStrategy : "none",
    createdAt,
    updatedAt: normalizeIsoDate(raw.updatedAt) || createdAt,
    createdBy: normalizeActor(raw.createdBy),
    updatedBy: normalizeActor(raw.updatedBy),
    publishedAt: normalizeIsoDate(raw.publishedAt),
    deprecatedAt: normalizeIsoDate(raw.deprecatedAt),
    archivedAt: normalizeIsoDate(raw.archivedAt),
    expiresAt: normalizeIsoDate(raw.expiresAt),
    warnings: uniqueStrings([...(Array.isArray(raw.warnings) ? raw.warnings : []), ...cloneWarnings]),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };
  normalized.warnings = uniqueStrings([...normalized.warnings, ...detectAssetWarnings(normalized, options)]);
  return normalized;
}

export function validateBroadcastAsset(asset, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isRecord(asset)) return validationResult(false, ["asset-not-object"], warnings);
  if (asset.assetManagerVersion !== ASSET_MANAGER_VERSION) errors.push("asset-manager-version-incompatible");
  if (!isSafeId(asset.assetId)) errors.push("asset-id-invalid");
  if (!isSafeId(asset.assetFamilyId)) errors.push("asset-family-id-invalid");
  if (typeof asset.name !== "string" || !asset.name.trim()) errors.push("asset-name-required");
  if (!ASSET_TYPES.includes(asset.type)) errors.push("asset-type-invalid");
  if (!isValidMimeType(asset.mimeType)) errors.push("asset-mime-type-invalid");
  if (ASSET_TYPES.includes(asset.type) && isValidMimeType(asset.mimeType) && !isMimeCompatible(asset.type, asset.mimeType)) {
    errors.push("asset-mime-type-incompatible");
  }
  if (!ASSET_STATUSES.includes(asset.status)) errors.push("asset-status-invalid");
  if (!ASSET_VISIBILITIES.includes(asset.visibility)) errors.push("asset-visibility-invalid");
  if (!ASSET_SCOPES.includes(asset.scope)) errors.push("asset-scope-invalid");
  if (!isSemanticVersion(asset.version)) errors.push("asset-version-invalid");
  if (!Number.isInteger(asset.revision) || asset.revision < 0) errors.push("asset-revision-invalid");
  validateDates(asset, errors);
  validateScopeIdentity(asset, errors);
  validateSourceReferences(asset, options, errors, warnings);
  validateChecksum(asset, errors, warnings);
  validateTechnicalMetadata(asset, errors, warnings);
  validateRights(asset.rights, errors, warnings);
  validateLabels(asset.tags, "tags", errors);
  validateLabels(asset.categories, "categories", errors);
  validateSponsor(asset.sponsor, errors);
  validateFont(asset, errors, warnings);
  if (measureDepth(asset.metadata) > 8) errors.push("asset-metadata-depth-exceeded");
  if (containsDangerousKey(asset)) errors.push("asset-dangerous-key-present");
  if (!Array.isArray(asset.variants)) {
    errors.push("asset-variants-invalid");
  } else {
    const variantIds = new Set();
    let originalVariants = 0;
    asset.variants.forEach((variant, index) => {
      const validation = validateBroadcastAssetVariant(variant, { ...options, asset });
      errors.push(...validation.errors.map((error) => `variant-${index}:${error}`));
      warnings.push(...validation.warnings.map((warning) => `variant-${index}:${warning}`));
      if (variantIds.has(variant.variantId)) errors.push(`variant-${index}:variant-id-duplicate`);
      if (variant.variantId) variantIds.add(variant.variantId);
      if (variant.type === "original") originalVariants += 1;
    });
    if (originalVariants > 1) errors.push("asset-original-variant-duplicate");
    if (options.requireOriginalVariant === true && originalVariants !== 1) errors.push("asset-original-variant-required");
  }
  if (asset.status === "published" && !asset.publishedAt) errors.push("asset-published-at-required");
  if (["published", "deprecated"].includes(asset.status) && !hasPersistentSource(asset)) errors.push("asset-published-source-required");
  if (["published", "deprecated"].includes(asset.status) && !asset.ownerId && !asset.ownerName) errors.push("asset-owner-required");
  warnings.push(...detectAssetWarnings(asset, options));
  return validationResult(errors.length === 0, errors, warnings);
}

export function registerBroadcastAsset(registry = {}, assetInput, options = {}) {
  if (!isRecord(assetInput)) throw assetError("asset-not-object");
  const base = normalizeRegistry(registry, options);
  const asset = createBroadcastAsset(assetInput, options);
  const key = registryKey(asset.assetId, asset.version);
  const existing = base.assets[key];
  const family = Object.values(base.assets).filter((item) => item.assetFamilyId === asset.assetFamilyId);
  const concreteVersions = Object.values(base.assets).filter((item) => item.assetId === asset.assetId);
  if (concreteVersions.some((item) => item.assetFamilyId !== asset.assetFamilyId)) {
    throw assetError("asset-family-conflict", { assetId: asset.assetId, assetFamilyId: asset.assetFamilyId });
  }
  if (family.some((item) => item.tenantId !== asset.tenantId)) throw assetError("asset-tenant-conflict", { assetId: asset.assetId });
  if (existing) {
    if (options.updateExisting !== true) throw assetError("asset-version-duplicate", { assetId: asset.assetId, version: asset.version });
    if (IMMUTABLE_VERSION_STATUSES.has(existing.status)) throw assetError("asset-version-published-immutable", { assetId: asset.assetId, version: asset.version });
    const patch = Object.keys(assetInput).reduce((result, keyName) => {
      if (UPDATE_ALLOWLIST.has(keyName)) result[keyName] = assetInput[keyName];
      return result;
    }, {});
    return updateBroadcastAsset(base, asset.assetId, patch, { ...options, version: asset.version });
  }
  const validation = validateBroadcastAsset(asset, options);
  if (!validation.valid) throw assetError("asset-invalid", { errors: validation.errors });
  const next = cloneRegistry(base);
  const persisted = cloneBroadcastAsset(asset);
  const probableDuplicate = asset.checksum && Object.values(base.assets).find((item) => (
    item.assetId !== asset.assetId && item.checksum === asset.checksum
  ));
  if (probableDuplicate) {
    persisted.warnings = uniqueStrings([
      ...persisted.warnings,
      `asset-probable-duplicate-checksum:${probableDuplicate.assetId}@${probableDuplicate.version}`
    ]);
  }
  if (persisted.signedUrl) {
    persisted.signedUrl = null;
    persisted.warnings = uniqueStrings([...persisted.warnings, "signed-url-not-persisted"]);
  }
  next.assets[key] = persisted;
  const currentVersion = next.currentVersions[asset.assetId];
  if (!currentVersion || compareSemanticVersions(asset.version, currentVersion) >= 0 || options.makeCurrent === true) {
    next.currentVersions[asset.assetId] = asset.version;
  }
  touchRegistry(next, options);
  return next;
}

export function updateBroadcastAsset(registry, assetId, patch = {}, options = {}) {
  if (!isRecord(patch)) throw assetError("asset-patch-not-object");
  const base = normalizeRegistry(registry, options);
  const current = getAssetRecord(base, assetId, options.version);
  if (!current) throw assetError("asset-not-found", { assetId, version: options.version || null });
  assertExpectedRevision(current, options.expectedRevision);
  Object.keys(patch).forEach((key) => {
    if (IMMUTABLE_PATCH_FIELDS.has(key)) throw assetError(`asset-patch-field-forbidden:${key}`);
    if (!UPDATE_ALLOWLIST.has(key) || DANGEROUS_KEYS.has(key)) throw assetError(`asset-patch-field-not-allowed:${key}`);
  });
  if (IMMUTABLE_VERSION_STATUSES.has(current.status)) {
    throw assetError("asset-version-published-immutable", { assetId: current.assetId, version: current.version });
  }
  if (hasOwn(patch, "status")) assertStatusTransition(current.status, patch.status);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const safePatch = cloneSerializable(patch, [], "asset.patch") || {};
  const candidate = normalizeBroadcastAsset({
    ...current,
    ...safePatch,
    assetManagerVersion: current.assetManagerVersion,
    assetId: current.assetId,
    assetFamilyId: current.assetFamilyId,
    tenantId: current.tenantId,
    version: current.version,
    checksum: current.checksum,
    checksumAlgorithm: current.checksumAlgorithm,
    parentVersion: current.parentVersion,
    previousVersion: current.previousVersion,
    nextVersion: current.nextVersion,
    revision: current.revision + 1,
    dimensions: hasOwn(safePatch, "dimensions") ? mergeSafeRecords(current.dimensions, safePatch.dimensions) : current.dimensions,
    metadata: hasOwn(safePatch, "metadata") ? mergeSafeRecords(current.metadata, safePatch.metadata) : current.metadata,
    rights: hasOwn(safePatch, "rights") ? mergeSafeRecords(current.rights, safePatch.rights) : current.rights,
    sponsor: hasOwn(safePatch, "sponsor") ? mergeSafeRecords(current.sponsor, safePatch.sponsor) : current.sponsor,
    font: hasOwn(safePatch, "font") ? mergeSafeRecords(current.font, safePatch.font) : current.font,
    createdAt: current.createdAt,
    createdBy: current.createdBy,
    updatedAt: now,
    updatedBy: firstDefined(options.actor, current.updatedBy),
    publishedAt: transitionTimestamp(current, safePatch.status, "published", "publishedAt", now),
    deprecatedAt: transitionTimestamp(current, safePatch.status, "deprecated", "deprecatedAt", now),
    archivedAt: transitionTimestamp(current, safePatch.status, "archived", "archivedAt", now)
  }, { ...options, now });
  assertValidAsset(candidate, options);
  const next = cloneRegistry(base);
  next.assets[registryKey(current.assetId, current.version)] = candidate;
  touchRegistry(next, options);
  return next;
}

export function createBroadcastAssetVersion(assetInput, changes = {}, options = {}) {
  if (!isRecord(changes)) throw assetError("asset-version-changes-not-object");
  const original = normalizeBroadcastAsset(assetInput, options);
  assertValidAsset(original, options);
  const originalCopy = cloneBroadcastAsset(original);
  const requestedVersion = firstDefined(changes.version, options.version, bumpSemanticVersion(original.version, options.bump || "patch"));
  if (!isSemanticVersion(requestedVersion) || compareSemanticVersions(requestedVersion, original.version) <= 0) {
    throw assetError("asset-version-not-incremented", { current: original.version, requested: requestedVersion });
  }
  ["assetId", "assetFamilyId", "assetManagerVersion", "tenantId", "createdAt", "createdBy", "revision"].forEach((field) => {
    if (hasOwn(changes, field) && changes[field] !== original[field]) throw assetError(`asset-version-field-forbidden:${field}`);
  });
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const actor = normalizeActor(firstDefined(options.actor, changes.updatedBy, original.updatedBy));
  const physicalContentChanged = ["storageRef", "externalUrl", "localDevelopmentRef", "cdnRef", "checksum", "mimeType"].some((field) => hasOwn(changes, field));
  const next = normalizeBroadcastAsset({
    ...original,
    ...cloneSerializable(changes, [], "asset.version.changes"),
    assetManagerVersion: ASSET_MANAGER_VERSION,
    assetId: original.assetId,
    assetFamilyId: original.assetFamilyId,
    tenantId: original.tenantId,
    version: requestedVersion,
    revision: 0,
    parentVersion: original.version,
    previousVersion: original.version,
    nextVersion: null,
    status: firstDefined(changes.status, "draft"),
    variants: hasOwn(changes, "variants") ? changes.variants : physicalContentChanged ? [] : original.variants,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    updatedBy: actor,
    publishedAt: null,
    deprecatedAt: null,
    archivedAt: null,
    changelog: firstDefined(changes.changelog, options.changelog, null),
    migrationNotes: firstDefined(changes.migrationNotes, options.migrationNotes, null)
  }, { ...options, now });
  assertValidAsset(next, options);
  if (JSON.stringify(original) !== JSON.stringify(originalCopy)) throw assetError("asset-version-source-mutated");
  return next;
}

export function deprecateBroadcastAsset(asset, options = {}) {
  const current = normalizeBroadcastAsset(asset, options);
  if (current.status !== "published") throw assetError("asset-deprecate-requires-published");
  return transitionAssetStatus(current, "deprecated", options);
}

export function archiveBroadcastAsset(asset, options = {}) {
  const current = normalizeBroadcastAsset(asset, options);
  if (current.status !== "deprecated") throw assetError("asset-archive-requires-deprecated");
  return transitionAssetStatus(current, "archived", {
    ...options,
    metadataPatch: { lifecycle: { archivedFrom: current.status } }
  });
}

export function restoreBroadcastAsset(asset, options = {}) {
  const current = normalizeBroadcastAsset(asset, options);
  if (current.status !== "archived") throw assetError("asset-restore-requires-archived");
  const archivedFrom = current.metadata?.lifecycle?.archivedFrom;
  const restoreStatus = firstDefined(options.status, archivedFrom === "deprecated" ? "deprecated" : "draft");
  if (!["draft", "deprecated"].includes(restoreStatus)) throw assetError("asset-restore-status-invalid");
  return transitionAssetStatus(current, restoreStatus, options);
}

export function removeBroadcastAsset(registry, assetId, options = {}) {
  const base = normalizeRegistry(registry, options);
  const targets = Object.entries(base.assets).filter(([, asset]) => {
    if (asset.assetId !== assetId) return false;
    return options.version ? asset.version === options.version : true;
  });
  if (!targets.length) return cloneRegistry(base);
  const references = Array.isArray(options.references) ? options.references : [];
  targets.forEach(([, asset]) => {
    if (IMMUTABLE_VERSION_STATUSES.has(asset.status) || asset.status === "published") {
      throw assetError("asset-remove-historical-blocked", { assetId: asset.assetId, version: asset.version, status: asset.status });
    }
    if (references.some((reference) => referenceMatchesAsset(reference, asset))) {
      throw assetError("asset-remove-referenced", { assetId: asset.assetId, version: asset.version });
    }
  });
  const next = cloneRegistry(base);
  targets.forEach(([key]) => delete next.assets[key]);
  const remaining = Object.values(next.assets).filter((asset) => asset.assetId === assetId);
  if (!remaining.length) delete next.currentVersions[assetId];
  else next.currentVersions[assetId] = highestVersion(remaining.map((asset) => asset.version));
  touchRegistry(next, options);
  return next;
}

export function getBroadcastAsset(registry, assetId, version = null) {
  const base = normalizeRegistry(registry);
  const asset = getAssetRecord(base, assetId, version);
  return asset ? cloneBroadcastAsset(asset) : null;
}

export function listBroadcastAssets(registry, filter = {}) {
  const base = normalizeRegistry(registry);
  const allVersions = filter.allVersions === true;
  return Object.values(base.assets)
    .filter((asset) => allVersions || base.currentVersions[asset.assetId] === asset.version)
    .filter((asset) => matchesAssetFilter(asset, filter))
    .sort(compareAssetsForList)
    .map((asset) => cloneBroadcastAsset(asset));
}

export function resolveBroadcastAsset(registry, request = {}, context = {}, options = {}) {
  const base = normalizeRegistry(registry, options);
  const safeRequest = cloneSerializable(isRecord(request) ? request : {}, [], "resolve.request") || {};
  const safeContext = cloneSerializable(isRecord(context) ? context : {}, [], "resolve.context") || {};
  return resolveAssetInternal(base, safeRequest, safeContext, options, new Set(), 0);
}

export function resolveBroadcastAssetVariant(assetInput, request = {}, context = {}, options = {}) {
  const asset = normalizeBroadcastAsset(assetInput, options);
  const safeRequest = isRecord(request) ? request : {};
  const outputVisibility = normalizeVisibility(firstDefined(context.visibility, options.visibility, "production"));
  const exactId = normalizeId(firstDefined(safeRequest.variantId, options.variantId));
  const candidates = asset.variants.filter((variant) => {
    if (exactId && variant.variantId !== exactId) return false;
    if (safeRequest.type && variant.type !== safeRequest.type) return false;
    if (safeRequest.orientation && variant.orientation !== safeRequest.orientation) return false;
    if (safeRequest.outputType && variant.outputTypes.length && !variant.outputTypes.includes(safeRequest.outputType)) return false;
    if (VISIBILITY_RANK[variant.visibility] > VISIBILITY_RANK[outputVisibility]) return false;
    if (["rejected", "archived", "expired", "revoked", "unavailable", "error", "draft", "validating", "pending_review"].includes(variant.status)) return false;
    return true;
  }).sort((left, right) => compareVariants(left, right, safeRequest));
  if (candidates.length) {
    return {
      resolved: true,
      variant: cloneBroadcastAsset(candidates[0]),
      fallbackUsed: false,
      fallbackReason: null,
      warnings: getVariantWarnings(candidates[0], asset, context),
      errors: []
    };
  }
  const fallbackVariantId = normalizeId(firstDefined(safeRequest.fallbackVariantId, asset.fallbackVariantId, options.fallbackVariantId));
  const fallback = fallbackVariantId ? asset.variants.find((variant) => variant.variantId === fallbackVariantId) : null;
  if (fallback && VISIBILITY_RANK[fallback.visibility] <= VISIBILITY_RANK[outputVisibility]
    && !["revoked", "expired", "archived", "rejected", "unavailable", "error"].includes(fallback.status)) {
    return {
      resolved: true,
      variant: cloneBroadcastAsset(fallback),
      fallbackUsed: true,
      fallbackReason: "fallback-variant",
      warnings: uniqueStrings(["variant-fallback-used", ...getVariantWarnings(fallback, asset, context)]),
      errors: []
    };
  }
  return {
    resolved: false,
    variant: null,
    fallbackUsed: false,
    fallbackReason: null,
    warnings: [],
    errors: [exactId ? "variant-not-found" : "variant-not-resolved"]
  };
}

export function addBroadcastAssetVariant(assetInput, variantInput, options = {}) {
  const asset = normalizeBroadcastAsset(assetInput, options);
  assertEditableAsset(asset);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const variant = normalizeBroadcastAssetVariant({
    ...variantInput,
    createdAt: firstDefined(variantInput?.createdAt, now),
    createdBy: firstDefined(variantInput?.createdBy, options.actor)
  }, { now });
  const validation = validateBroadcastAssetVariant(variant, { ...options, asset });
  if (!validation.valid) throw assetError("asset-variant-invalid", { errors: validation.errors });
  if (variant.type === "original" && asset.variants.some((item) => item.type === "original")) {
    throw assetError("original-variant-duplicate", { assetId: asset.assetId });
  }
  if (asset.variants.some((item) => item.variantId === variant.variantId)) throw assetError("asset-variant-id-duplicate", { variantId: variant.variantId });
  const fingerprint = variantFingerprint(variant);
  if (options.allowEquivalent !== true && asset.variants.some((item) => variantFingerprint(item) === fingerprint)) {
    throw assetError("asset-variant-equivalent-duplicate", { variantId: variant.variantId });
  }
  return reviseAsset(asset, { variants: [...asset.variants, variant] }, options);
}

export function removeBroadcastAssetVariant(assetInput, variantId, options = {}) {
  const asset = normalizeBroadcastAsset(assetInput, options);
  assertEditableAsset(asset);
  const id = requiredId(variantId, "variant-id-required");
  const target = asset.variants.find((variant) => variant.variantId === id);
  if (!target) return cloneBroadcastAsset(asset);
  if (target.type === "original") throw assetError("original-variant-removal-forbidden", { assetId: asset.assetId, variantId: id });
  const references = Array.isArray(options.references) ? options.references : [];
  if (references.some((reference) => reference?.assetId === asset.assetId && reference?.variantId === id)) {
    throw assetError("asset-variant-referenced", { assetId: asset.assetId, variantId: id });
  }
  return reviseAsset(asset, { variants: asset.variants.filter((variant) => variant.variantId !== id) }, options);
}

export function validateBroadcastAssetVariant(variant, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isRecord(variant)) return validationResult(false, ["variant-not-object"], warnings);
  if (!isSafeId(variant.variantId)) errors.push("variant-id-invalid");
  if (!ASSET_VARIANT_TYPES.includes(variant.type)) errors.push("variant-type-invalid");
  if (typeof variant.name !== "string" || !variant.name.trim()) errors.push("variant-name-required");
  if (!isValidMimeType(variant.mimeType)) errors.push("variant-mime-type-invalid");
  if (!ASSET_STATUSES.includes(variant.status)) errors.push("variant-status-invalid");
  if (!ASSET_VISIBILITIES.includes(variant.visibility)) errors.push("variant-visibility-invalid");
  if (options.asset && ASSET_VISIBILITIES.includes(options.asset.visibility)
    && VISIBILITY_RANK[variant.visibility] < VISIBILITY_RANK[options.asset.visibility]) {
    errors.push("variant-visibility-escalated");
  }
  validateReferenceValue(variant.storageRef, "variant-storage-ref", options, errors, warnings);
  validateExternalUrl(variant.externalUrl, "variant-external-url", options, errors, warnings);
  if (variant.width !== null && (!Number.isInteger(variant.width) || variant.width <= 0)) errors.push("variant-width-invalid");
  if (variant.height !== null && (!Number.isInteger(variant.height) || variant.height <= 0)) errors.push("variant-height-invalid");
  if (variant.fileSize !== null && (!Number.isInteger(variant.fileSize) || variant.fileSize < 0)) errors.push("variant-file-size-invalid");
  if (variant.quality !== null && (!Number.isFinite(variant.quality) || variant.quality < 0 || variant.quality > 100)) errors.push("variant-quality-invalid");
  if (variant.checksum && !isChecksumValid(variant.checksum, variant.checksumAlgorithm)) errors.push("variant-checksum-invalid");
  if (!isIsoDate(variant.createdAt)) errors.push("variant-created-at-invalid");
  if (!Array.isArray(variant.outputTypes)) errors.push("variant-output-types-invalid");
  if (containsDangerousKey(variant)) errors.push("variant-dangerous-key-present");
  warnings.push(...getVariantWarnings(variant, options.asset, options));
  return validationResult(errors.length === 0, errors, warnings);
}

export function setBroadcastAssetStatus(asset, status, options = {}) {
  const current = normalizeBroadcastAsset(asset, options);
  if (!ASSET_STATUSES.includes(status)) throw assetError("asset-status-invalid", { status });
  assertStatusTransition(current.status, status);
  return transitionAssetStatus(current, status, options);
}

export function setBroadcastAssetRights(asset, rights, options = {}) {
  if (!isRecord(rights)) throw assetError("asset-rights-not-object");
  const current = normalizeBroadcastAsset(asset, options);
  return reviseAsset(current, { rights: mergeSafeRecords(current.rights, rights) }, options, { allowPublished: true });
}

export function setBroadcastAssetVisibility(asset, visibility, options = {}) {
  if (!ASSET_VISIBILITIES.includes(visibility)) throw assetError("asset-visibility-invalid");
  const current = normalizeBroadcastAsset(asset, options);
  assertEditableAsset(current);
  return reviseAsset(current, { visibility }, options);
}

export function setBroadcastAssetScope(asset, scope, scopeValues = {}, options = {}) {
  if (!ASSET_SCOPES.includes(scope)) throw assetError("asset-scope-invalid");
  const current = normalizeBroadcastAsset(asset, options);
  assertEditableAsset(current);
  const values = isRecord(scopeValues) ? scopeValues : {};
  if (hasOwn(values, "tenantId") && nullableId(values.tenantId) !== current.tenantId) throw assetError("asset-tenant-immutable");
  const patch = {
    scope,
    organizationId: firstDefined(values.organizationId, current.organizationId),
    clientId: firstDefined(values.clientId, current.clientId),
    tournamentId: firstDefined(values.tournamentId, current.tournamentId),
    competitionId: firstDefined(values.competitionId, current.competitionId),
    charreadaId: firstDefined(values.charreadaId, current.charreadaId),
    outputId: firstDefined(values.outputId, current.outputId),
    userId: firstDefined(values.userId, current.userId),
    sessionId: firstDefined(values.sessionId, current.sessionId)
  };
  return reviseAsset(current, patch, options);
}

export function getBroadcastAssetWarnings(asset, context = {}) {
  if (!isRecord(asset)) return ["asset-not-object"];
  const normalized = normalizeBroadcastAsset(asset, context);
  return uniqueStrings([...(normalized.warnings || []), ...detectAssetWarnings(normalized, context)]);
}

export function cloneBroadcastAsset(asset) {
  return cloneSerializable(asset, [], "asset") || null;
}

export function buildBroadcastAssetManifest(registry, options = {}) {
  const base = normalizeRegistry(registry, options);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const environment = options.environment === "development" ? "development" : "production";
  const exportable = options.exportable !== false;
  const productionReady = options.productionReady === true;
  const includeDevelopmentRefs = options.includeDevelopmentRefs === true
    && environment === "development"
    && exportable === false
    && productionReady === false;
  const sanitizationWarnings = [];
  const assets = Object.values(base.assets)
    .filter((asset) => manifestScopeMatches(asset, options))
    .sort(compareAssetsForList)
    .map((asset) => stripTransientAssetFields(asset, { includeDevelopmentRefs }, sanitizationWarnings));
  const tenants = uniqueStrings(assets.map((asset) => asset.tenantId).filter(Boolean));
  const warnings = uniqueStrings([
    ...assets.flatMap((asset) => getBroadcastAssetWarnings(asset, { ...options, now })),
    ...sanitizationWarnings
  ]);
  const errors = [];
  if (tenants.length > 1) errors.push("manifest-tenant-mixed");
  const manifest = {
    manifestVersion: ASSET_MANAGER_VERSION,
    generatedAt: now,
    environment,
    exportable,
    productionReady,
    developmentRefsIncluded: includeDevelopmentRefs,
    tenantId: nullableId(firstDefined(options.tenantId, tenants.length === 1 ? tenants[0] : null)),
    organizationId: nullableId(options.organizationId),
    tournamentId: nullableId(options.tournamentId),
    assets,
    versions: assets.map((asset) => ({
      assetId: asset.assetId,
      assetFamilyId: asset.assetFamilyId,
      version: asset.version,
      parentVersion: asset.parentVersion,
      previousVersion: asset.previousVersion,
      nextVersion: asset.nextVersion,
      status: asset.status,
      revision: asset.revision,
      publishedAt: asset.publishedAt
    })),
    variants: assets.flatMap((asset) => asset.variants.map((variant) => ({
      assetId: asset.assetId,
      assetVersion: asset.version,
      ...cloneBroadcastAsset(variant)
    }))),
    checksums: assets.filter((asset) => asset.checksum).map((asset) => ({
      assetId: asset.assetId,
      version: asset.version,
      algorithm: asset.checksumAlgorithm,
      checksum: asset.checksum,
      integrityStatus: asset.integrityStatus
    })),
    rightsSummary: buildRightsSummary(assets, now),
    warnings,
    errors
  };
  const validation = validateBroadcastAssetManifest(manifest, options);
  manifest.warnings = uniqueStrings([...manifest.warnings, ...validation.warnings]);
  manifest.errors = uniqueStrings([...manifest.errors, ...validation.errors]);
  return cloneSerializable(manifest, [], "manifest");
}

export function validateBroadcastAssetManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isRecord(manifest)) return validationResult(false, ["manifest-not-object"], warnings);
  if (manifest.manifestVersion !== ASSET_MANAGER_VERSION) errors.push("manifest-version-incompatible");
  if (!isIsoDate(manifest.generatedAt)) errors.push("manifest-generated-at-invalid");
  ["assets", "versions", "variants", "checksums", "warnings", "errors"].forEach((field) => {
    if (!Array.isArray(manifest[field])) errors.push(`manifest-${field}-invalid`);
  });
  if (!isRecord(manifest.rightsSummary)) errors.push("manifest-rights-summary-invalid");
  if (containsDangerousKey(manifest)) errors.push("manifest-dangerous-key-present");
  if (containsFieldDeep(manifest, "signedUrl")) errors.push("manifest-signed-url-forbidden");
  const developmentRefsAllowed = manifest.environment === "development"
    && manifest.developmentRefsIncluded === true
    && manifest.exportable === false
    && manifest.productionReady !== true;
  if (!developmentRefsAllowed && containsFieldDeep(manifest, "localDevelopmentRef")) errors.push("manifest-local-development-ref-forbidden");
  if (!developmentRefsAllowed && containsStringMatchingDeep(manifest, (value) => /^file:\/\//i.test(value.trim()))) {
    errors.push("manifest-local-file-reference-forbidden");
  }
  if (containsSensitiveManifestKey(manifest)) errors.push("manifest-sensitive-metadata-forbidden");
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  const tenants = uniqueStrings(assets.map((asset) => asset?.tenantId).filter(Boolean));
  if (tenants.length > 1) errors.push("manifest-tenant-mixed");
  if (manifest.tenantId && tenants.some((tenantId) => tenantId !== manifest.tenantId)) errors.push("manifest-tenant-conflict");
  assets.forEach((asset, index) => {
    const validation = validateBroadcastAsset(asset, {
      ...options,
      allowExternalUrl: true,
      environment: developmentRefsAllowed ? "development" : "production"
    });
    if (!validation.valid) errors.push(...validation.errors.map((error) => `manifest-asset-${index}:${error}`));
  });
  const familiesByAssetId = new Map();
  assets.forEach((asset) => {
    if (!asset?.assetId) return;
    const families = familiesByAssetId.get(asset.assetId) || new Set();
    families.add(asset.assetFamilyId);
    familiesByAssetId.set(asset.assetId, families);
  });
  familiesByAssetId.forEach((families, assetId) => {
    if (families.size > 1) errors.push(`manifest-asset-family-inconsistent:${assetId}`);
  });
  const versions = Array.isArray(manifest.versions) ? manifest.versions : [];
  versions.forEach((entry, index) => {
    const matching = assets.find((asset) => asset.assetId === entry?.assetId && asset.version === entry?.version);
    if (!matching || entry.assetFamilyId !== matching.assetFamilyId) errors.push(`manifest-version-${index}:asset-family-inconsistent`);
  });
  (Array.isArray(manifest.checksums) ? manifest.checksums : []).forEach((entry, index) => {
    if (!isChecksumValid(entry?.checksum, entry?.algorithm)) errors.push(`manifest-checksum-${index}:invalid`);
  });
  return validationResult(errors.length === 0, errors, warnings);
}

function normalizeBroadcastAssetVariant(input = {}, options = {}) {
  const raw = cloneSerializable(isRecord(input) ? input : {}, [], "variant") || {};
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  return {
    variantId: normalizeId(raw.variantId),
    type: nullableString(raw.type) || "original",
    name: nullableString(raw.name),
    storageRef: nullableString(raw.storageRef),
    externalUrl: nullableString(raw.externalUrl),
    mimeType: normalizeMimeType(raw.mimeType),
    extension: normalizeExtension(raw.extension),
    width: positiveIntegerOrNull(raw.width),
    height: positiveIntegerOrNull(raw.height),
    aspectRatio: nullableString(raw.aspectRatio),
    fileSize: nonNegativeIntegerOrNull(raw.fileSize),
    checksum: normalizeChecksum(raw.checksum),
    checksumAlgorithm: normalizeChecksumAlgorithm(raw.checksumAlgorithm, raw.checksum),
    integrityStatus: INTEGRITY_STATUSES.includes(raw.integrityStatus) ? raw.integrityStatus : "unknown",
    status: nullableString(raw.status) || "approved",
    visibility: nullableString(raw.visibility) || "production",
    outputTypes: uniqueStrings(raw.outputTypes),
    orientation: normalizeOrientation(raw.orientation, { width: raw.width, height: raw.height }),
    quality: raw.quality === null || raw.quality === undefined ? null : finiteNumberOrNull(raw.quality),
    createdAt: normalizeIsoDate(raw.createdAt) || now,
    createdBy: normalizeActor(raw.createdBy),
    metadata: normalizeMetadata(raw.metadata),
    warnings: uniqueStrings(Array.isArray(raw.warnings) ? raw.warnings : []),
    errors: uniqueStrings(Array.isArray(raw.errors) ? raw.errors : [])
  };
}

function normalizeVariants(value, now) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ARRAY_LENGTH).map((variant) => normalizeBroadcastAssetVariant(variant, { now }));
}

function normalizeRegistry(registry = {}, options = {}) {
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const normalized = {
    assetManagerVersion: ASSET_MANAGER_VERSION,
    revision: 0,
    assets: {},
    currentVersions: {},
    createdAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  };
  let rawAssets = [];
  if (Array.isArray(registry)) rawAssets = registry;
  else if (isRecord(registry?.assets)) {
    normalized.revision = nonNegativeInteger(registry.revision, 0);
    normalized.createdAt = normalizeIsoDate(registry.createdAt) || now;
    normalized.updatedAt = normalizeIsoDate(registry.updatedAt) || normalized.createdAt;
    normalized.currentVersions = cloneSerializable(registry.currentVersions, [], "registry.currentVersions") || {};
    normalized.warnings = uniqueStrings(registry.warnings);
    normalized.errors = uniqueStrings(registry.errors);
    rawAssets = Object.values(registry.assets);
  } else if (isRecord(registry)) rawAssets = Object.values(registry).filter((value) => isRecord(value) && value.assetId);
  rawAssets.forEach((rawAsset) => {
    const asset = normalizeBroadcastAsset(rawAsset, options);
    if (!asset.assetId || !isSemanticVersion(asset.version)) return;
    if (asset.signedUrl) {
      asset.signedUrl = null;
      asset.warnings = uniqueStrings([...asset.warnings, "signed-url-not-persisted"]);
    }
    normalized.assets[registryKey(asset.assetId, asset.version)] = asset;
    const current = normalized.currentVersions[asset.assetId];
    if (!current || compareSemanticVersions(asset.version, current) > 0) normalized.currentVersions[asset.assetId] = asset.version;
  });
  return normalized;
}

function cloneRegistry(registry) {
  return cloneSerializable(registry, [], "registry") || normalizeRegistry({});
}

function touchRegistry(registry, options) {
  registry.revision = nonNegativeInteger(registry.revision, 0) + 1;
  registry.updatedAt = normalizeIsoDate(options.now) || new Date().toISOString();
}

function getAssetRecord(registry, assetId, version = null) {
  const id = normalizeId(assetId);
  if (!id) return null;
  const resolvedVersion = version || registry.currentVersions[id];
  return resolvedVersion ? registry.assets[registryKey(id, resolvedVersion)] || null : null;
}

function registryKey(assetId, version) {
  return `${assetId}@${version}`;
}

function resolveAssetInternal(registry, request, context, options, visited, depth) {
  if (depth > MAX_FALLBACK_DEPTH) return unresolvedAsset("asset-fallback-depth-exceeded");
  const outputVisibility = normalizeVisibility(firstDefined(request.visibility, context.visibility, options.visibility, "production"));
  const exactVersion = nullableString(request.version);
  const exactAssetId = normalizeId(request.assetId);
  const all = Object.values(registry.assets);
  const requestedFamily = exactAssetId ? all.filter((asset) => asset.assetId === exactAssetId) : [];
  if (context.tenantId && requestedFamily.length && requestedFamily.every((asset) => asset.scope !== "global" && asset.tenantId !== context.tenantId)) {
    return unresolvedAsset("asset-tenant-conflict");
  }
  const candidates = all.filter((asset) => {
    if (exactAssetId && asset.assetId !== exactAssetId) return false;
    if (exactVersion && asset.version !== exactVersion) return false;
    if (request.type && asset.type !== request.type) return false;
    if (request.scope && asset.scope !== request.scope) return false;
    if (request.tags && !normalizeLabels(request.tags).every((tag) => asset.tags.includes(tag))) return false;
    if (request.categories && !normalizeLabels(request.categories).every((category) => asset.categories.includes(category))) return false;
    if (!tenantMatches(asset, context)) return false;
    if (!scopeMatches(asset, context)) return false;
    if (VISIBILITY_RANK[asset.visibility] > VISIBILITY_RANK[outputVisibility]) return false;
    if (!statusResolvable(asset, exactVersion, context, options)) return false;
    if (!rightsAllowResolution(asset, context, options)) return false;
    if (isAssetExpired(asset, options.now)) return false;
    return true;
  }).sort(compareAssetsForResolution);
  if (candidates.length) {
    const asset = candidates[0];
    const variantRequest = firstRecord(request.variant, {
      variantId: request.variantId,
      type: request.variantType,
      orientation: request.orientation,
      outputType: request.outputType,
      fallbackVariantId: request.fallbackVariantId
    });
    const wantsVariant = Object.values(variantRequest).some((value) => value !== null && value !== undefined && value !== "");
    const variantResolution = wantsVariant ? resolveBroadcastAssetVariant(asset, variantRequest, { ...context, visibility: outputVisibility }, options) : null;
    if (wantsVariant && !variantResolution.resolved && request.variantRequired === true) {
      return unresolvedAsset("asset-variant-required-not-found", variantResolution.warnings);
    }
    return {
      resolved: true,
      asset: cloneBroadcastAsset(asset),
      variant: variantResolution?.resolved ? variantResolution.variant : null,
      sourceScope: asset.scope,
      fallbackUsed: variantResolution?.fallbackUsed === true,
      fallbackReason: variantResolution?.fallbackReason || null,
      warnings: uniqueStrings([
        ...getBroadcastAssetWarnings(asset, { ...context, ...options, visibility: outputVisibility }),
        ...(variantResolution?.warnings || [])
      ]),
      errors: []
    };
  }
  const fallbackSource = chooseFallbackSource(requestedFamily, exactVersion);
  if (!fallbackSource) return unresolvedAsset(exactAssetId ? "asset-not-resolvable" : "asset-not-found");
  if (visited.has(fallbackSource.assetId)) return unresolvedAsset("asset-fallback-cycle");
  visited.add(fallbackSource.assetId);
  if (fallbackSource.fallbackStrategy === "hide_component") {
    return {
      resolved: false,
      asset: null,
      variant: null,
      sourceScope: null,
      fallbackUsed: true,
      fallbackReason: "hide-component",
      warnings: ["asset-component-hidden-by-fallback"],
      errors: []
    };
  }
  if (fallbackSource.fallbackAssetId) {
    const resolved = resolveAssetInternal(registry, {
      ...request,
      assetId: fallbackSource.fallbackAssetId,
      version: null
    }, context, options, visited, depth + 1);
    if (resolved.resolved) {
      resolved.fallbackUsed = true;
      resolved.fallbackReason = "fallback-asset";
      resolved.warnings = uniqueStrings([
        "asset-fallback-used",
        ...getBroadcastAssetWarnings(fallbackSource, { ...context, ...options, visibility: outputVisibility }),
        ...resolved.warnings
      ]);
    }
    return resolved;
  }
  const strategyFallback = resolveStrategyFallback(registry, fallbackSource, request, context, options, visited, depth);
  if (strategyFallback) return strategyFallback;
  return unresolvedAsset("asset-fallback-not-found");
}

function resolveStrategyFallback(registry, source, request, context, options, visited, depth) {
  if (!["inherit", "default_by_type", "default_by_scope", "placeholder"].includes(source.fallbackStrategy)) return null;
  const all = Object.values(registry.assets).filter((asset) => asset.assetId !== source.assetId);
  const candidates = all.filter((asset) => {
    if (source.fallbackStrategy === "placeholder" && !asset.tags.includes("placeholder")) return false;
    if (["inherit", "default_by_type"].includes(source.fallbackStrategy) && asset.type !== source.type) return false;
    if (source.fallbackStrategy === "default_by_scope" && asset.scope !== source.scope) return false;
    if (!["placeholder"].includes(source.fallbackStrategy) && asset.metadata?.isDefault !== true) return false;
    return true;
  }).sort(compareAssetsForResolution);
  for (const candidate of candidates) {
    const resolved = resolveAssetInternal(registry, { ...request, assetId: candidate.assetId, version: null }, context, options, new Set(visited), depth + 1);
    if (resolved.resolved) {
      resolved.fallbackUsed = true;
      resolved.fallbackReason = source.fallbackStrategy;
      resolved.warnings = uniqueStrings([`asset-fallback-used:${source.fallbackStrategy}`, ...resolved.warnings]);
      return resolved;
    }
  }
  return null;
}

function unresolvedAsset(error, warnings = []) {
  return {
    resolved: false,
    asset: null,
    variant: null,
    sourceScope: null,
    fallbackUsed: false,
    fallbackReason: null,
    warnings: uniqueStrings(warnings),
    errors: [error]
  };
}

function statusResolvable(asset, exactVersion, context, options) {
  if (asset.status === "published") return true;
  if (asset.status === "deprecated") return Boolean(exactVersion || options.allowDeprecated || context.historical);
  if (asset.status === "approved") return Boolean(options.allowApproved || context.mode === "preview");
  return false;
}

function tenantMatches(asset, context) {
  if (asset.scope === "global") return true;
  if (!context.tenantId) return false;
  return asset.tenantId === context.tenantId;
}

function scopeMatches(asset, context) {
  if (asset.scope === "global") return true;
  const field = SCOPE_ID_FIELDS[asset.scope];
  if (!field) return false;
  return Boolean(asset[field]) && asset[field] === context[field];
}

function rightsAllowResolution(asset, context, options) {
  const now = Date.parse(normalizeIsoDate(options.now) || new Date().toISOString());
  const rights = asset.rights || {};
  if (rights.validFrom && Date.parse(rights.validFrom) > now) return false;
  if (rights.validUntil && Date.parse(rights.validUntil) <= now) return false;
  const usage = firstDefined(context.usage, context.mode, "program");
  if (["program", "broadcast", "production"].includes(usage) && rights.broadcastUse === false) return false;
  if (context.commercial === true && rights.commercialUse === false) return false;
  if (context.publicDisplay === true && rights.publicDisplay === false) return false;
  if (context.derivative === true && rights.derivativesAllowed === false) return false;
  if (context.territory && rights.territories.length && !rights.territories.includes(context.territory)) return false;
  return true;
}

function normalizeRights(value) {
  const raw = firstRecord(value);
  return {
    owner: nullableString(raw.owner),
    licenseType: nullableString(raw.licenseType),
    licenseId: nullableString(raw.licenseId),
    validFrom: normalizeIsoDate(raw.validFrom),
    validUntil: normalizeIsoDate(raw.validUntil),
    territories: uniqueStrings(raw.territories),
    allowedUses: uniqueStrings(raw.allowedUses),
    restrictedUses: uniqueStrings(raw.restrictedUses),
    creditRequired: raw.creditRequired === true,
    creditText: nullableString(raw.creditText),
    commercialUse: nullableBoolean(raw.commercialUse),
    broadcastUse: nullableBoolean(raw.broadcastUse),
    publicDisplay: nullableBoolean(raw.publicDisplay),
    downloadAllowed: nullableBoolean(raw.downloadAllowed),
    derivativesAllowed: nullableBoolean(raw.derivativesAllowed),
    notes: nullableString(raw.notes),
    metadata: normalizeMetadata(raw.metadata)
  };
}

function normalizeSponsor(value) {
  const raw = firstRecord(value);
  return {
    sponsorId: nullableId(raw.sponsorId),
    sponsorName: nullableString(raw.sponsorName),
    campaignId: nullableId(raw.campaignId),
    campaignName: nullableString(raw.campaignName),
    priority: finiteNumber(raw.priority, 0),
    validFrom: normalizeIsoDate(raw.validFrom),
    validUntil: normalizeIsoDate(raw.validUntil),
    competitionIds: uniqueStrings(raw.competitionIds),
    suerteIds: uniqueStrings(raw.suerteIds),
    outputIds: uniqueStrings(raw.outputIds),
    displayRules: normalizeMetadata(raw.displayRules),
    clickUrl: nullableString(raw.clickUrl),
    qrAssetId: nullableId(raw.qrAssetId)
  };
}

function normalizeFont(value) {
  const raw = firstRecord(value);
  return {
    family: nullableString(raw.family),
    weight: nullableString(firstDefined(raw.weight, raw.fontWeight)),
    style: nullableString(raw.style),
    format: nullableString(raw.format),
    displayName: nullableString(raw.displayName),
    supportedCharacters: uniqueStrings(raw.supportedCharacters),
    license: nullableString(raw.license),
    fallbackFamily: nullableString(raw.fallbackFamily),
    preloadAllowed: nullableBoolean(raw.preloadAllowed)
  };
}

function normalizeDimensions(value) {
  const raw = firstRecord(value);
  const width = positiveIntegerOrNull(raw.width);
  const height = positiveIntegerOrNull(raw.height);
  return {
    width,
    height,
    aspectRatio: nullableString(raw.aspectRatio) || (width && height ? calculateAspectRatio(width, height) : null),
    hasAlpha: nullableBoolean(raw.hasAlpha),
    colorProfile: nullableString(raw.colorProfile),
    orientation: normalizeOrientation(raw.orientation, { width, height })
  };
}

function normalizeMetadata(value) {
  return cloneSerializable(isRecord(value) ? value : {}, [], "metadata", new WeakSet(), 0, 8) || {};
}

function validateScopeIdentity(asset, errors) {
  if (!ASSET_SCOPES.includes(asset.scope)) return;
  if (asset.scope !== "global" && !asset.tenantId) errors.push("asset-tenant-id-required");
  const field = SCOPE_ID_FIELDS[asset.scope];
  if (field && !asset[field]) errors.push(`asset-${field}-required-for-scope`);
}

function validateSourceReferences(asset, options, errors, warnings) {
  validateReferenceValue(asset.storageRef, "asset-storage-ref", options, errors, warnings);
  validateReferenceValue(asset.cdnRef, "asset-cdn-ref", options, errors, warnings);
  validateExternalUrl(asset.externalUrl, "asset-external-url", options, errors, warnings, asset);
  if (asset.localDevelopmentRef) {
    if (options.environment !== "development") errors.push("asset-local-ref-production-forbidden");
    if (hasDangerousScheme(asset.localDevelopmentRef) && !asset.localDevelopmentRef.startsWith("file://")) errors.push("asset-local-ref-invalid");
  }
  if (asset.signedUrl) warnings.push("asset-signed-url-temporary");
}

function validateReferenceValue(value, label, options, errors) {
  if (!value) return;
  if (typeof value !== "string") errors.push(`${label}-invalid`);
  else if (/^(javascript|data|file):/i.test(value.trim())) errors.push(`${label}-scheme-forbidden`);
}

function validateExternalUrl(value, label, options, errors, warnings, asset = null) {
  if (!value) return;
  if (typeof value !== "string") {
    errors.push(`${label}-invalid`);
    return;
  }
  const trimmed = value.trim();
  if (/^javascript:/i.test(trimmed)) errors.push(`${label}-javascript-forbidden`);
  else if (/^file:/i.test(trimmed)) errors.push(`${label}-file-forbidden`);
  else if (/^data:/i.test(trimmed)) {
    if (options.allowDataUrl !== true || trimmed.length > 4096) errors.push(`${label}-data-forbidden`);
  } else {
    try {
      const parsed = new URL(trimmed);
      if (!["https:", "http:"].includes(parsed.protocol)) errors.push(`${label}-protocol-invalid`);
      if (parsed.protocol === "http:" && options.allowInsecureHttp !== true) warnings.push(`${label}-insecure-http`);
    } catch {
      errors.push(`${label}-invalid`);
    }
  }
  if (asset && options.allowExternalUrl !== true && asset.metadata?.externalUrlPolicyApproved !== true) {
    errors.push(`${label}-policy-required`);
  }
}

function validateChecksum(asset, errors, warnings) {
  if (asset.checksum && !isChecksumValid(asset.checksum, asset.checksumAlgorithm)) errors.push("asset-checksum-invalid");
  if (asset.checksum && !CHECKSUM_ALGORITHMS[asset.checksumAlgorithm]) errors.push("asset-checksum-algorithm-invalid");
  if (["published", "deprecated"].includes(asset.status) && !asset.checksum) warnings.push("asset-published-checksum-missing");
  if (asset.integrityStatus === "mismatch") errors.push("asset-integrity-mismatch");
}

function validateTechnicalMetadata(asset, errors, warnings) {
  const dimensions = asset.dimensions || {};
  if (dimensions.width !== null && (!Number.isInteger(dimensions.width) || dimensions.width <= 0)) errors.push("asset-width-invalid");
  if (dimensions.height !== null && (!Number.isInteger(dimensions.height) || dimensions.height <= 0)) errors.push("asset-height-invalid");
  if (asset.fileSize !== null && (!Number.isInteger(asset.fileSize) || asset.fileSize < 0)) errors.push("asset-file-size-invalid");
  if (asset.duration !== null && (!Number.isFinite(asset.duration) || asset.duration < 0)) errors.push("asset-duration-invalid");
  if (asset.frameRate !== null && (!Number.isFinite(asset.frameRate) || asset.frameRate <= 0)) errors.push("asset-frame-rate-invalid");
  if ((IMAGE_TYPES.has(asset.type) || VIDEO_TYPES.has(asset.type) || asset.type === "svg") && !dimensions.width && !dimensions.height) {
    warnings.push("asset-dimensions-unknown");
  }
}

function validateRights(rights, errors) {
  if (!isRecord(rights)) {
    errors.push("asset-rights-invalid");
    return;
  }
  if (rights.validFrom !== null && !isIsoDate(rights.validFrom)) errors.push("asset-rights-valid-from-invalid");
  if (rights.validUntil !== null && !isIsoDate(rights.validUntil)) errors.push("asset-rights-valid-until-invalid");
  if (rights.validFrom && rights.validUntil && Date.parse(rights.validUntil) <= Date.parse(rights.validFrom)) errors.push("asset-rights-period-invalid");
  if (rights.creditRequired && !rights.creditText) errors.push("asset-rights-credit-text-required");
  if (measureDepth(rights.metadata) > 8) errors.push("asset-rights-metadata-depth-exceeded");
}

function validateSponsor(sponsor, errors) {
  if (!isRecord(sponsor)) errors.push("asset-sponsor-invalid");
  if (sponsor?.clickUrl && !isSafeHttpUrl(sponsor.clickUrl)) errors.push("asset-sponsor-click-url-forbidden");
}

function validateFont(asset, errors, warnings) {
  if (!isRecord(asset.font)) {
    errors.push("asset-font-invalid");
    return;
  }
  if (asset.type === "font") {
    if (!asset.font.family) errors.push("asset-font-family-required");
    if (!asset.font.format) errors.push("asset-font-format-required");
    if (!asset.font.license) warnings.push("asset-font-license-missing");
  }
}

function validateLabels(labels, field, errors) {
  if (!Array.isArray(labels)) {
    errors.push(`asset-${field}-invalid`);
    return;
  }
  if (labels.length > MAX_TAGS) errors.push(`asset-${field}-limit-exceeded`);
  labels.forEach((label) => {
    if (typeof label !== "string" || !label || label.length > MAX_TAG_LENGTH || DANGEROUS_KEYS.has(label)) errors.push(`asset-${field}-entry-invalid`);
  });
}

function validateDates(asset, errors) {
  ["createdAt", "updatedAt"].forEach((field) => {
    if (!isIsoDate(asset[field])) errors.push(`asset-${field}-invalid`);
  });
  ["publishedAt", "deprecatedAt", "archivedAt", "expiresAt", "verifiedAt"].forEach((field) => {
    if (asset[field] !== null && !isIsoDate(asset[field])) errors.push(`asset-${field}-invalid`);
  });
}

function detectAssetWarnings(asset, context = {}) {
  if (!isRecord(asset)) return ["asset-not-object"];
  const warnings = [];
  const now = Date.parse(normalizeIsoDate(context.now) || new Date().toISOString());
  if (!asset.assetId) warnings.push("asset-id-missing");
  if (!asset.name) warnings.push("asset-name-missing");
  if (!ASSET_TYPES.includes(asset.type)) warnings.push("asset-type-invalid");
  if (isValidMimeType(asset.mimeType) && ASSET_TYPES.includes(asset.type) && !isMimeCompatible(asset.type, asset.mimeType)) warnings.push("asset-mime-type-incompatible");
  if (!hasPersistentSource(asset)) warnings.push("asset-storage-ref-missing");
  if (!asset.checksum) warnings.push("asset-checksum-missing");
  if (["published", "deprecated"].includes(asset.status) && !asset.checksum) warnings.push("asset-published-checksum-missing");
  if (asset.expiresAt && Date.parse(asset.expiresAt) <= now) warnings.push("asset-expired");
  if (asset.rights?.validUntil) {
    const remaining = Date.parse(asset.rights.validUntil) - now;
    if (remaining <= 0) warnings.push("asset-rights-expired");
    else if (remaining <= (context.rightsWarningDays || DEFAULT_RIGHTS_WARNING_DAYS) * 86400000) warnings.push("asset-rights-expiring-soon");
  }
  if (["program", "broadcast", "production"].includes(firstDefined(context.usage, context.mode)) && asset.rights?.broadcastUse === false) warnings.push("asset-broadcast-use-not-authorized");
  if (context.commercial === true && asset.rights?.commercialUse === false) warnings.push("asset-commercial-use-not-authorized");
  if (asset.rights?.creditRequired) warnings.push("asset-credit-required");
  if (asset.status === "deprecated") warnings.push("asset-deprecated");
  if (asset.status === "archived") warnings.push("asset-archived");
  if (asset.status === "unavailable") warnings.push("asset-unavailable");
  if (asset.status === "revoked") warnings.push("asset-revoked");
  if (asset.status === "expired") warnings.push("asset-expired");
  if (context.tenantId && asset.scope !== "global" && asset.tenantId !== context.tenantId) warnings.push("asset-tenant-conflict");
  if (context.visibility && ASSET_VISIBILITIES.includes(asset.visibility)
    && VISIBILITY_RANK[asset.visibility] > VISIBILITY_RANK[normalizeVisibility(context.visibility)]) warnings.push("asset-visibility-incompatible");
  if (asset.externalUrl && asset.metadata?.externalUrlPolicyApproved !== true) warnings.push("asset-external-url-untrusted");
  if (context.maxFileSize && asset.fileSize !== null && asset.fileSize > context.maxFileSize) warnings.push("asset-file-too-heavy");
  if (asset.fallbackAssetId && context.registry && !getBroadcastAsset(context.registry, asset.fallbackAssetId)) warnings.push("asset-fallback-missing");
  if (asset.fallbackAssetId && context.registry && hasFallbackCycle(context.registry, asset.assetId)) warnings.push("asset-fallback-cycle");
  if (context.variantId && !asset.variants?.some((variant) => variant.variantId === context.variantId)) warnings.push("asset-variant-missing");
  asset.variants?.forEach((variant) => warnings.push(...getVariantWarnings(variant, asset, context)));
  if ((IMAGE_TYPES.has(asset.type) || VIDEO_TYPES.has(asset.type) || asset.type === "svg") && !asset.dimensions?.width && !asset.dimensions?.height) warnings.push("asset-dimensions-unknown");
  if (asset.type === "font" && !asset.font?.license) warnings.push("asset-font-license-missing");
  return uniqueStrings(warnings);
}

function getVariantWarnings(variant, asset, context = {}) {
  const warnings = [];
  if (!variant.checksum) warnings.push(`variant-integrity-missing:${variant.variantId || "unknown"}`);
  if (variant.status === "deprecated") warnings.push(`variant-deprecated:${variant.variantId}`);
  if (context.outputType && variant.outputTypes?.length && !variant.outputTypes.includes(context.outputType)) warnings.push(`variant-output-incompatible:${variant.variantId}`);
  if (asset && ASSET_VISIBILITIES.includes(asset.visibility) && ASSET_VISIBILITIES.includes(variant.visibility)
    && VISIBILITY_RANK[variant.visibility] < VISIBILITY_RANK[asset.visibility]) warnings.push(`variant-visibility-escalated:${variant.variantId}`);
  return warnings;
}

function normalizeSourceType(raw) {
  if (SOURCE_TYPES.includes(raw.sourceType)) return raw.sourceType;
  if (raw.storageRef) return "storage";
  if (raw.cdnRef) return "cdn";
  if (raw.externalUrl) return "external";
  if (raw.localDevelopmentRef) return "local_development";
  return "none";
}

function normalizeChecksumAlgorithm(value, checksum) {
  if (typeof value === "string") return value.toLowerCase();
  return checksum ? "sha256" : null;
}

function normalizeChecksum(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

function isChecksumValid(checksum, algorithm) {
  const length = CHECKSUM_ALGORITHMS[algorithm];
  return Boolean(length && typeof checksum === "string" && new RegExp(`^[a-f0-9]{${length}}$`, "i").test(checksum));
}

function normalizeMimeType(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

function isValidMimeType(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i.test(value);
}

function isMimeCompatible(type, mimeType) {
  if (IMAGE_TYPES.has(type)) return mimeType.startsWith("image/");
  if (VIDEO_TYPES.has(type)) return mimeType.startsWith("video/");
  if (type === "audio") return mimeType.startsWith("audio/");
  if (type === "font") return mimeType.startsWith("font/") || /^application\/(font|x-font|vnd\.ms-fontobject)/.test(mimeType);
  if (type === "svg") return mimeType === "image/svg+xml";
  if (type === "lottie") return ["application/json", "application/zip", "application/octet-stream"].includes(mimeType);
  if (type === "animation") return mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType === "application/json";
  if (type === "document") return mimeType.startsWith("application/") || mimeType.startsWith("text/");
  if (type === "data") return mimeType.startsWith("application/") || mimeType.startsWith("text/");
  return true;
}

function normalizeExtension(value) {
  if (typeof value !== "string") return null;
  return value.trim().replace(/^\./, "").toLowerCase() || null;
}

function normalizeLabels(value) {
  if (!Array.isArray(value)) return [];
  const labels = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && item.length <= MAX_TAG_LENGTH && !DANGEROUS_KEYS.has(item));
  return [...new Set(labels)].slice(0, MAX_TAGS);
}

function normalizeOrientation(value, dimensions = {}) {
  if (["landscape", "portrait", "square"].includes(value)) return value;
  const width = dimensions?.width;
  const height = dimensions?.height;
  if (!width || !height) return null;
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function calculateAspectRatio(width, height) {
  const divisor = greatestCommonDivisor(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function reviseAsset(asset, patch, options = {}, policy = {}) {
  if (policy.allowPublished !== true) assertEditableAsset(asset);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const candidate = normalizeBroadcastAsset({
    ...asset,
    ...cloneSerializable(patch, [], "asset.revision.patch"),
    assetManagerVersion: asset.assetManagerVersion,
    assetId: asset.assetId,
    assetFamilyId: asset.assetFamilyId,
    tenantId: asset.tenantId,
    version: asset.version,
    checksum: asset.checksum,
    checksumAlgorithm: asset.checksumAlgorithm,
    createdAt: asset.createdAt,
    createdBy: asset.createdBy,
    revision: asset.revision + 1,
    updatedAt: now,
    updatedBy: firstDefined(options.actor, asset.updatedBy)
  }, { ...options, now });
  assertValidAsset(candidate, options);
  return candidate;
}

function transitionAssetStatus(asset, status, options = {}) {
  if (asset.status !== status) assertStatusTransition(asset.status, status);
  const now = normalizeIsoDate(options.now) || new Date().toISOString();
  const metadata = options.metadataPatch ? mergeNestedMetadata(asset.metadata, options.metadataPatch) : asset.metadata;
  const candidate = normalizeBroadcastAsset({
    ...asset,
    status,
    metadata,
    revision: asset.revision + 1,
    updatedAt: now,
    updatedBy: firstDefined(options.actor, asset.updatedBy),
    publishedAt: status === "published" ? firstDefined(asset.publishedAt, now) : asset.publishedAt,
    deprecatedAt: status === "deprecated" ? firstDefined(asset.deprecatedAt, now) : asset.deprecatedAt,
    archivedAt: status === "archived" ? now : status === "draft" ? null : asset.archivedAt
  }, { ...options, now });
  assertValidAsset(candidate, options);
  return candidate;
}

function mergeNestedMetadata(base, patch) {
  const result = mergeSafeRecords(base, patch);
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (isRecord(value) && isRecord(base?.[key])) result[key] = mergeSafeRecords(base[key], value);
  });
  return result;
}

function assertStatusTransition(from, to) {
  if (from === to) return;
  if (!ASSET_STATUSES.includes(to)) throw assetError("asset-status-invalid", { status: to });
  if (!STATUS_TRANSITIONS[from]?.includes(to)) throw assetError("asset-status-transition-invalid", { from, to });
}

function assertEditableAsset(asset) {
  if (IMMUTABLE_VERSION_STATUSES.has(asset.status)) throw assetError("asset-version-published-immutable", { assetId: asset.assetId, version: asset.version });
}

function assertValidAsset(asset, options) {
  const validation = validateBroadcastAsset(asset, options);
  if (!validation.valid) throw assetError("asset-invalid", { errors: validation.errors });
}

function assertExpectedRevision(asset, expectedRevision) {
  if (expectedRevision === undefined || expectedRevision === null) return;
  if (!Number.isInteger(expectedRevision) || expectedRevision !== asset.revision) {
    throw assetError("asset-expected-revision-mismatch", { expectedRevision, actualRevision: asset.revision });
  }
}

function transitionTimestamp(current, nextStatus, targetStatus, field, now) {
  return nextStatus === targetStatus ? firstDefined(current[field], now) : current[field];
}

function matchesAssetFilter(asset, filter) {
  const exactFields = [
    "assetId", "version", "type", "status", "visibility", "scope", "tenantId", "organizationId",
    "clientId", "tournamentId", "competitionId", "charreadaId", "outputId", "userId", "sessionId"
  ];
  if (exactFields.some((field) => hasOwn(filter, field) && asset[field] !== filter[field])) return false;
  if (filter.tags && !normalizeLabels(filter.tags).every((tag) => asset.tags.includes(tag))) return false;
  if (filter.categories && !normalizeLabels(filter.categories).every((category) => asset.categories.includes(category))) return false;
  return true;
}

function compareAssetsForList(left, right) {
  return left.assetId.localeCompare(right.assetId) || compareSemanticVersions(right.version, left.version);
}

function compareAssetsForResolution(left, right) {
  return (SCOPE_RANK[right.scope] - SCOPE_RANK[left.scope])
    || ((STATUS_RESOLUTION_RANK[right.status] || 0) - (STATUS_RESOLUTION_RANK[left.status] || 0))
    || compareSemanticVersions(right.version, left.version)
    || right.updatedAt.localeCompare(left.updatedAt)
    || left.assetId.localeCompare(right.assetId);
}

function compareVariants(left, right, request) {
  const leftOrientation = request.orientation && left.orientation === request.orientation ? 1 : 0;
  const rightOrientation = request.orientation && right.orientation === request.orientation ? 1 : 0;
  if (leftOrientation !== rightOrientation) return rightOrientation - leftOrientation;
  const leftOutput = request.outputType && left.outputTypes.includes(request.outputType) ? 1 : 0;
  const rightOutput = request.outputType && right.outputTypes.includes(request.outputType) ? 1 : 0;
  if (leftOutput !== rightOutput) return rightOutput - leftOutput;
  const requestedWidth = positiveIntegerOrNull(request.width);
  if (requestedWidth) {
    const leftDelta = left.width ? Math.abs(left.width - requestedWidth) : Number.MAX_SAFE_INTEGER;
    const rightDelta = right.width ? Math.abs(right.width - requestedWidth) : Number.MAX_SAFE_INTEGER;
    if (leftDelta !== rightDelta) return leftDelta - rightDelta;
  }
  return left.variantId.localeCompare(right.variantId);
}

function variantFingerprint(variant) {
  return [variant.type, variant.orientation || "", [...variant.outputTypes].sort().join(","), variant.width || "", variant.height || ""].join("|");
}

function referenceMatchesAsset(reference, asset) {
  if (!isRecord(reference) || reference.assetId !== asset.assetId) return false;
  return !reference.assetVersion && !reference.version || [reference.assetVersion, reference.version].includes(asset.version);
}

function chooseFallbackSource(family, version) {
  if (!family.length) return null;
  if (version) return family.find((asset) => asset.version === version) || null;
  return [...family].sort((left, right) => compareSemanticVersions(right.version, left.version))[0];
}

function hasPersistentSource(asset) {
  return Boolean(asset.storageRef || asset.cdnRef || asset.externalUrl || asset.localDevelopmentRef);
}

function isAssetExpired(asset, nowValue) {
  const now = Date.parse(normalizeIsoDate(nowValue) || new Date().toISOString());
  return asset.status === "expired" || Boolean(asset.expiresAt && Date.parse(asset.expiresAt) <= now);
}

function manifestScopeMatches(asset, options) {
  if (options.tenantId && asset.scope !== "global" && asset.tenantId !== options.tenantId) return false;
  if (options.organizationId && asset.organizationId !== options.organizationId && asset.scope !== "global") return false;
  if (options.tournamentId && asset.tournamentId !== options.tournamentId && !["global", "tenant", "organization", "client"].includes(asset.scope)) return false;
  return true;
}

function stripTransientAssetFields(asset, options = {}, warnings = []) {
  const clone = cloneBroadcastAsset(asset);
  delete clone.signedUrl;
  if (options.includeDevelopmentRefs !== true) delete clone.localDevelopmentRef;
  const redaction = redactSensitiveManifestFields(clone);
  if (redaction.redacted) warnings.push("sensitive-metadata-redacted");
  return redaction.value;
}

function buildRightsSummary(assets, now) {
  return assets.reduce((summary, asset) => {
    summary.total += 1;
    if (asset.rights?.validUntil && Date.parse(asset.rights.validUntil) <= Date.parse(now)) summary.expired += 1;
    if (asset.rights?.creditRequired) summary.creditRequired += 1;
    if (asset.rights?.broadcastUse === false) summary.broadcastRestricted += 1;
    if (asset.rights?.commercialUse === false) summary.commercialRestricted += 1;
    return summary;
  }, { total: 0, expired: 0, creditRequired: 0, broadcastRestricted: 0, commercialRestricted: 0 });
}

function validationResult(valid, errors, warnings) {
  return {
    valid,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    assetManagerVersion: ASSET_MANAGER_VERSION
  };
}

function normalizeActor(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return { userId: value, name: null, role: null };
  if (!isRecord(value)) return null;
  return {
    userId: nullableId(firstDefined(value.userId, value.uid, value.id)),
    name: nullableString(value.name),
    role: nullableString(value.role)
  };
}

function normalizeVisibility(value) {
  return ASSET_VISIBILITIES.includes(value) ? value : "production";
}

function registryAssetValues(registry) {
  return Object.values(normalizeRegistry(registry).assets);
}

function highestVersion(versions) {
  return [...versions].sort((left, right) => compareSemanticVersions(right, left))[0] || null;
}

function isSemanticVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
}

function compareSemanticVersions(left, right) {
  const leftParts = semanticParts(left);
  const rightParts = semanticParts(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  if (leftParts.pre === rightParts.pre) return 0;
  if (!leftParts.pre) return 1;
  if (!rightParts.pre) return -1;
  return leftParts.pre.localeCompare(rightParts.pre);
}

function semanticParts(version) {
  const match = typeof version === "string" ? version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/) : null;
  return match ? Object.assign([Number(match[1]), Number(match[2]), Number(match[3])], { pre: match[4] || "" }) : Object.assign([0, 0, 0], { pre: "" });
}

function bumpSemanticVersion(version, bump) {
  const parts = semanticParts(version);
  if (bump === "major") return `${parts[0] + 1}.0.0`;
  if (bump === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function buildAssetId(now, randomSource) {
  const timestamp = Date.parse(now) || Date.now();
  const randomValue = typeof randomSource === "function" ? randomSource() : Math.random();
  const suffix = Math.abs(Number(randomValue) || 0).toString(36).replace(".", "").slice(0, 8) || "0";
  return `asset_${timestamp}_${suffix}`;
}

function requiredId(value, errorCode) {
  const id = normalizeId(value);
  if (!id) throw assetError(errorCode);
  return id;
}

function normalizeId(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const id = String(value).trim();
  return isSafeId(id) ? id : null;
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) && !DANGEROUS_KEYS.has(value);
}

function nullableId(value) {
  if (value === "") return "";
  return normalizeId(value);
}

function nullableString(value) {
  return typeof value === "string" ? value : value === null || value === undefined ? null : String(value);
}

function nullableBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function normalizeIsoDate(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function isIsoDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function nonNegativeInteger(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function nonNegativeIntegerOrNull(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function positiveIntegerOrNull(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function nonNegativeNumberOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function positiveNumberOrNull(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function finiteNumberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(Math.trunc(left));
  let b = Math.abs(Math.trunc(right));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstRecord(...values) {
  return values.find((value) => isRecord(value)) || {};
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && item.length > 0))].slice(0, MAX_ARRAY_LENGTH);
}

function mergeSafeRecords(base, patch) {
  return {
    ...(cloneSerializable(isRecord(base) ? base : {}, [], "merge.base") || {}),
    ...(cloneSerializable(isRecord(patch) ? patch : {}, [], "merge.patch") || {})
  };
}

function cloneSerializable(value, warnings = [], path = "value", ancestors = new WeakSet(), depth = 0, maxDepth = MAX_DEPTH) {
  if (depth > maxDepth) {
    warnings.push(`max-depth:${path}`);
    return null;
  }
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (["function", "symbol", "bigint"].includes(typeof value)) {
    warnings.push(`unsupported-value:${path}`);
    return undefined;
  }
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  if (typeof value !== "object") return undefined;
  if (ancestors.has(value)) {
    warnings.push(`cycle:${path}`);
    return null;
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) warnings.push(`array-truncated:${path}`);
    const result = value.slice(0, MAX_ARRAY_LENGTH).map((item, index) => {
      const cloned = cloneSerializable(item, warnings, `${path}.${index}`, ancestors, depth + 1, maxDepth);
      return cloned === undefined ? null : cloned;
    });
    ancestors.delete(value);
    return result;
  }
  const result = {};
  const keys = Object.keys(value);
  if (keys.length > MAX_ARRAY_LENGTH) warnings.push(`object-truncated:${path}`);
  for (const key of keys.slice(0, MAX_ARRAY_LENGTH)) {
    if (DANGEROUS_KEYS.has(key)) {
      warnings.push(`dangerous-key:${path}.${key}`);
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !hasOwn(descriptor, "value")) {
      warnings.push(`accessor-skipped:${path}.${key}`);
      continue;
    }
    const cloned = cloneSerializable(descriptor.value, warnings, `${path}.${key}`, ancestors, depth + 1, maxDepth);
    if (cloned !== undefined) result[key] = cloned;
  }
  ancestors.delete(value);
  return result;
}

function containsDangerousKey(value, ancestors = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return false;
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && hasOwn(descriptor, "value") && containsDangerousKey(descriptor.value, ancestors, depth + 1)) return true;
  }
  ancestors.delete(value);
  return false;
}

function containsFieldDeep(value, field, ancestors = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return false;
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    if (key === field) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && hasOwn(descriptor, "value") && containsFieldDeep(descriptor.value, field, ancestors, depth + 1)) return true;
  }
  ancestors.delete(value);
  return false;
}

function containsStringMatchingDeep(value, predicate, ancestors = new WeakSet(), depth = 0) {
  if (typeof value === "string") return predicate(value);
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return false;
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && hasOwn(descriptor, "value")
      && containsStringMatchingDeep(descriptor.value, predicate, ancestors, depth + 1)) return true;
  }
  ancestors.delete(value);
  return false;
}

function containsSensitiveManifestKey(value, ancestors = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return false;
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    if (isSensitiveManifestKey(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && hasOwn(descriptor, "value")
      && containsSensitiveManifestKey(descriptor.value, ancestors, depth + 1)) return true;
  }
  ancestors.delete(value);
  return false;
}

function redactSensitiveManifestFields(value, ancestors = new WeakSet(), depth = 0) {
  if (value === null || typeof value !== "object") return { value, redacted: false };
  if (depth > MAX_DEPTH || ancestors.has(value)) return { value: null, redacted: false };
  ancestors.add(value);
  let redacted = false;
  if (Array.isArray(value)) {
    const result = value.map((item) => {
      const sanitized = redactSensitiveManifestFields(item, ancestors, depth + 1);
      redacted = redacted || sanitized.redacted;
      return sanitized.value;
    });
    ancestors.delete(value);
    return { value: result, redacted };
  }
  const result = {};
  Object.keys(value).forEach((key) => {
    if (DANGEROUS_KEYS.has(key) || isSensitiveManifestKey(key)) {
      redacted = redacted || isSensitiveManifestKey(key);
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !hasOwn(descriptor, "value")) return;
    const sanitized = redactSensitiveManifestFields(descriptor.value, ancestors, depth + 1);
    redacted = redacted || sanitized.redacted;
    result[key] = sanitized.value;
  });
  ancestors.delete(value);
  return { value: result, redacted };
}

function isSensitiveManifestKey(key) {
  if (typeof key !== "string") return false;
  return SENSITIVE_MANIFEST_KEYS.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""));
}

function measureDepth(value, ancestors = new WeakSet(), depth = 0) {
  if (!value || typeof value !== "object" || ancestors.has(value)) return depth;
  ancestors.add(value);
  const depths = Object.keys(value).map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && hasOwn(descriptor, "value") ? measureDepth(descriptor.value, ancestors, depth + 1) : depth;
  });
  ancestors.delete(value);
  return depths.length ? Math.max(depth, ...depths) : depth;
}

function hasDangerousScheme(value) {
  return typeof value === "string" && /^(javascript|data):/i.test(value.trim());
}

function isSafeHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return ["https:", "http:"].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

function hasFallbackCycle(registry, assetId) {
  const visited = new Set();
  let currentId = assetId;
  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    const current = getBroadcastAsset(registry, currentId);
    currentId = current?.fallbackAssetId || null;
    if (visited.size > MAX_FALLBACK_DEPTH + 1) return true;
  }
  return false;
}

function assetError(code, details) {
  return new BroadcastAssetError(code, details);
}
