import {
  getActiveBroadcastThemeForContext,
  getBroadcastTheme,
  getBroadcastThemeEffectiveScopeKey,
  listBroadcastThemes,
  resolveBroadcastTheme,
  validateBroadcastTheme
} from "./themeEngine.js?v=20260714-theme-engine-001-theme-system-v1";
import {
  buildTemplateRenderSnapshot,
  clearTemplateRendererIntegration,
  getRenderedTemplate,
  prepareTemplateRender,
  removeTemplateRender,
  renderTemplateInstance,
  updateTemplateRender
} from "./templateRendererIntegration.js?v=20260714-template-renderer-integration-001-composed-preview-v1";
import {
  cloneComponentInstance,
  validateComponentInstance
} from "./componentLibrary.js?v=20260713-component-library-001-components-v1";
import {
  getBroadcastAsset,
  resolveBroadcastAsset
} from "./assetManager.js?v=20260713-asset-manager-001-assets-v1";

export const THEME_TEMPLATE_INTEGRATION_VERSION = "1.0.0";

export const THEME_TEMPLATE_INTEGRATION_STATES = Object.freeze([
  "uninitialized", "ready", "resolving_theme", "theme_resolved", "preparing", "prepared",
  "rendering", "rendered", "updating", "partially_rendered", "cleared", "destroyed", "error"
]);

export const THEME_TEMPLATE_INTEGRATION_ERROR_CODES = Object.freeze({
  CONTEXT_INVALID: "theme-template-context-invalid",
  CONTEXT_DESTROYED: "theme-template-integration-destroyed",
  THEME_NOT_FOUND: "theme-template-theme-not-found",
  THEME_STATUS_INVALID: "theme-template-theme-status-invalid",
  THEME_VISIBILITY_MISMATCH: "theme-template-theme-visibility-mismatch",
  THEME_SCOPE_MISMATCH: "theme-template-theme-scope-mismatch",
  TENANT_MISMATCH: "theme-template-tenant-mismatch",
  OUTPUT_MISMATCH: "theme-template-output-mismatch",
  PREPARATION_INVALID: "theme-template-preparation-invalid",
  THEME_NOT_RESOLVED: "theme-template-theme-not-resolved",
  TOKEN_INVALID: "theme-template-token-invalid",
  REQUIRED_TOKEN_MISSING: "theme-template-required-token-missing",
  REQUIRED_ASSET_MISSING: "theme-template-required-asset-missing",
  REQUIRED_ASSET_UNAVAILABLE: "theme-required-asset-unavailable",
  ASSET_REFERENCE_INVALID: "theme-template-asset-reference-invalid",
  ASSET_NOT_RESOLVABLE: "theme-template-asset-not-resolvable",
  COMPONENT_INVALID: "theme-template-component-invalid",
  RENDER_NOT_FOUND: "theme-template-render-not-found",
  RENDER_DUPLICATE: "theme-template-render-duplicate",
  SNAPSHOT_INVALID: "theme-template-snapshot-invalid",
  UNSAFE_INPUT: "theme-template-unsafe-input"
});

const CONTEXTS = new WeakMap();
const VISIBILITIES = Object.freeze(["public", "production", "operational", "restricted"]);
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const AUTOMATIC_THEME_STATUSES = new Set(["active", "published"]);
const EXPLICIT_THEME_STATUSES = new Set(["active", "published", "draft", "inactive", "deprecated"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const EXECUTABLE_KEYS = new Set([
  "html", "innerhtml", "outerhtml", "script", "scripts", "javascript", "css", "csstext",
  "stylesheet", "stylesheets", "plugin", "plugins", "hook", "hooks", "handler", "handlers",
  "onclick", "onerror", "onload"
]);
const SECRET_KEYS = new Set([
  "password", "token", "secret", "credentials", "apikey", "privatekey", "signedurl",
  "authorization", "cookie"
]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "actor", "createdby", "updatedby", "tenantid", "organizationid", "clientid", "sessionid",
  "userid", "operatorid", "diagnostics", "registry", "registries"
]);
const UNSAFE_TEXT = /<\s*(?:script|iframe|object|embed|style|link)\b|\bon(?:error|load|click)\s*=|(?:^|[\s"'])\s*(?:javascript|file|data|vbscript):|@import|@font-face|\burl\s*\(|\bexpression\s*\(/i;
const SAFE_COLOR = /^(?:#[0-9a-fA-F]{3}|#[0-9a-fA-F]{4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent)$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MAX_DEPTH = 14;
const MAX_ARRAY_ITEMS = 300;
const MAX_OBJECT_KEYS = 500;
const MAX_TEXT_LENGTH = 10000;

const TOKEN_PATHS = Object.freeze([
  "color.primary", "color.secondary", "color.accent", "color.success", "color.warning",
  "color.danger", "color.neutral", "color.background", "color.surface", "color.textPrimary",
  "color.textSecondary", "color.border", "color.highlight", "color.overlay", "color.transparent",
  "typography.family", "typography.weight", "typography.size", "typography.lineHeight",
  "typography.tracking", "typography.uppercase", "typography.capitalize", "typography.italic",
  "spacing.xs", "spacing.sm", "spacing.md", "spacing.lg", "spacing.xl",
  "radius.none", "radius.sm", "radius.md", "radius.lg", "radius.full",
  "border.width", "border.style", "border.color",
  "shadow.sm", "shadow.md", "shadow.lg",
  "asset.logoPrimary", "asset.logoSecondary", "asset.background", "asset.watermark", "asset.iconSet"
]);
const TOKEN_SET = new Set(TOKEN_PATHS);
const STYLE_ALLOWLIST = new Set([
  "color", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "fontFamily",
  "fontSize", "fontWeight", "italic", "lineHeight", "letterSpacing", "shadow", "padding",
  "margin", "opacity"
]);
const ASSET_COMPONENT_TYPES = new Set(["image", "logo", "icon", "qr", "sponsor"]);
const SCOPE_CONTEXT_FIELD = Object.freeze({
  tenant: "tenantId", organization: "organizationId", client: "clientId", tournament: "tournamentId",
  competition: "competitionId", event: "eventId"
});
const SELECTION_LEVELS = Object.freeze([
  ["session", "sessionThemeId"], ["output", "outputThemeId"], ["competition", "competitionThemeId"],
  ["tournament", "tournamentThemeId"], ["client", "clientThemeId"],
  ["organization", "organizationThemeId"], ["tenant", "tenantThemeId"], ["global", "globalThemeId"]
]);

export class BroadcastThemeTemplateIntegrationError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastThemeTemplateIntegrationError";
    this.code = code;
    this.details = safeClone(details).value || {};
  }
}

export function createThemeTemplateIntegration(context = {}, options = {}) {
  const validation = validateThemeTemplateIntegrationContext(context, options);
  if (!validation.valid) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.CONTEXT_INVALID, { errors: validation.errors });
  const now = normalizeNow(options.now || context.now);
  const integrationId = normalizeId(options.integrationId || context.integrationId)
    || buildId("theme_template_integration", now, options.random);
  const visibility = normalizeVisibility(options.visibility || context.visibility);
  const output = safeClone(context.output || {}).value || {};
  const integration = {
    integrationVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    integrationId,
    state: "ready",
    visibility,
    tenantId: nullableId(context.tenantId),
    organizationId: nullableId(context.organizationId),
    clientId: nullableId(context.clientId),
    tournamentId: nullableId(context.tournamentId),
    competitionId: nullableId(context.competitionId),
    eventId: nullableId(context.eventId),
    sessionId: nullableId(context.sessionId),
    outputId: nullableId(output.outputId || output.id || context.templateRendererIntegration?.outputId),
    renderedIds: [],
    warnings: uniqueStrings(validation.warnings),
    errors: [],
    createdAt: now,
    updatedAt: now
  };
  CONTEXTS.set(integration, {
    themeRegistry: context.themeRegistry,
    templateRegistry: context.templateRegistry || null,
    componentRegistry: context.componentRegistry || null,
    templateRendererIntegration: context.templateRendererIntegration,
    assetRegistry: context.assetRegistry || {},
    productionVariables: safeClone(context.productionVariables || {}).value || {},
    broadcastContract: safeClone(context.broadcastContract || {}).value || {},
    output,
    themeSelections: safeClone(context.themeSelections || {}).value || {},
    preparations: new Map(),
    renders: new Map(),
    sequence: 0,
    state: "ready"
  });
  return integration;
}

export function destroyThemeTemplateIntegration(integration, options = {}) {
  const runtime = requireIntegration(integration, { allowDestroyed: true });
  if (runtime.state === "destroyed") return integration;
  clearThemeTemplateIntegration(integration, options);
  runtime.state = "destroyed";
  runtime.themeRegistry = null;
  runtime.templateRegistry = null;
  runtime.componentRegistry = null;
  runtime.assetRegistry = null;
  runtime.productionVariables = null;
  runtime.broadcastContract = null;
  runtime.templateRendererIntegration = null;
  runtime.preparations.clear();
  setState(integration, runtime, "destroyed", options.now);
  return integration;
}

export function validateThemeTemplateIntegrationContext(context = {}, options = {}) {
  const errors = [];
  const warnings = [];
  if (!isRecord(context)) return validationResult([THEME_TEMPLATE_INTEGRATION_ERROR_CODES.CONTEXT_INVALID], []);
  if (!isRecord(context.themeRegistry)) errors.push("theme-template-theme-registry-required");
  const renderer = context.templateRendererIntegration;
  if (!isRecord(renderer) || !renderer.integrationId) errors.push("theme-template-renderer-integration-required");
  else if (renderer.state === "destroyed") errors.push("theme-template-renderer-integration-destroyed");
  const visibility = options.visibility || context.visibility || renderer?.visibility || "production";
  if (!VISIBILITIES.includes(visibility)) errors.push("theme-template-visibility-invalid");
  const tenantId = nullableId(context.tenantId);
  if (tenantId && renderer?.tenantId && renderer.tenantId !== tenantId) errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TENANT_MISMATCH);
  const outputId = nullableId(context.output?.outputId || context.output?.id);
  if (outputId && renderer?.outputId && renderer.outputId !== outputId) errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.OUTPUT_MISMATCH);
  const outputTenantId = nullableId(context.output?.tenantId);
  if (tenantId && outputTenantId && tenantId !== outputTenantId) errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TENANT_MISMATCH);
  if (!isRecord(context.assetRegistry)) warnings.push("theme-template-asset-registry-empty");
  return validationResult(errors, warnings);
}

export function resolveThemeForTemplate(themeIdOrContext, context, options = {}) {
  const integration = isIntegration(context) ? context : null;
  const runtime = integration ? requireIntegration(integration) : contextRuntime(context);
  const descriptor = integration ? integration : publicContextDescriptor(context);
  const now = normalizeNow(options.now);
  if (integration) setState(integration, runtime, "resolving_theme", now);
  const merged = mergeResolutionContext(descriptor, runtime, isRecord(themeIdOrContext) ? themeIdOrContext : {}, options);
  const explicitId = typeof themeIdOrContext === "string"
    ? normalizeId(themeIdOrContext)
    : normalizeId(themeIdOrContext?.themeId || options.themeId);
  const candidates = buildThemeCandidates(runtime.themeRegistry, merged, explicitId);
  const failures = [];
  for (const candidate of candidates) {
    try {
      const result = resolveCandidateTheme(runtime, candidate, merged, options);
      if (integration) {
        runtime.lastResolution = safeClone(result).value;
        setState(integration, runtime, "theme_resolved", now);
      }
      return result;
    } catch (error) {
      failures.push(`${candidate.reason}:${error?.code || error?.message || "theme-resolution-failed"}`);
      if (candidate.reason === "explicit") {
        if (integration) failIntegration(integration, runtime, error, now);
        throw error;
      }
    }
  }
  const error = integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_FOUND, { failures });
  if (integration) failIntegration(integration, runtime, error, now);
  throw error;
}

export function buildThemedTemplatePreparation(templateOrPreparation, themeOrContext, context, options = {}) {
  const integration = isIntegration(context) ? context : null;
  const runtime = integration ? requireIntegration(integration) : contextRuntime(context);
  const descriptor = integration ? integration : publicContextDescriptor(context);
  const now = normalizeNow(options.now);
  if (integration) setState(integration, runtime, "preparing", now);
  const resolution = isThemeResolution(themeOrContext)
    ? safeClone(themeOrContext).value
    : resolveThemeForTemplate(themeOrContext, integration || context, options);
  let preparation;
  if (isTemplatePreparation(templateOrPreparation)) preparation = safeClone(templateOrPreparation).value;
  else {
    const output = runtime.output || {};
    preparation = prepareTemplateRender(templateOrPreparation, {
      productionVariables: runtime.productionVariables,
      broadcastContract: runtime.broadcastContract,
      assetRegistry: runtime.assetRegistry,
      tenantId: descriptor.tenantId,
      organizationId: descriptor.organizationId,
      tournamentId: descriptor.tournamentId,
      competitionId: descriptor.competitionId
    }, {
      templateRenderId: options.templateRenderId,
      templateInstanceId: options.templateInstanceId,
      outputId: output.outputId || output.id || descriptor.outputId,
      outputType: output.type || options.outputType || "preview",
      width: output.width || output.resolution?.width || options.width,
      height: output.height || output.resolution?.height || options.height,
      orientation: output.orientation || options.orientation,
      safeArea: output.safeArea || options.safeArea,
      visibility: normalizeVisibility(options.visibility || descriptor.visibility),
      tenantId: descriptor.tenantId,
      organizationId: descriptor.organizationId,
      tournamentId: descriptor.tournamentId,
      competitionId: descriptor.competitionId,
      now
    });
  }
  assertPreparationCompatible(preparation, descriptor);
  const themed = applyThemeToTemplatePreparation(preparation, resolution, {
    ...options,
    assetRegistry: runtime.assetRegistry,
    visibility: normalizeVisibility(options.visibility || descriptor.visibility),
    tenantId: descriptor.tenantId,
    organizationId: descriptor.organizationId,
    clientId: descriptor.clientId,
    tournamentId: descriptor.tournamentId,
    competitionId: descriptor.competitionId,
    eventId: descriptor.eventId,
    outputId: descriptor.outputId,
    output: runtime.output,
    now
  });
  if (themed.errors.length && options.allowPreparationErrors !== true) {
    const error = buildPreparationError(themed.errors);
    if (integration) failIntegration(integration, runtime, error, now);
    throw error;
  }
  if (integration) {
    runtime.preparations.set(themed.preparationId, {
      basePreparation: safeClone(preparation).value,
      themedPreparation: safeClone(themed).value
    });
    runtime.lastPreparation = safeClone(themed).value;
    runtime.lastResolution = safeClone(resolution).value;
    setState(integration, runtime, themed.errors.length ? "error" : "prepared", now);
  }
  return themed;
}

export function applyThemeToComponentInstance(componentInstance, resolvedTheme, mapping = {}, options = {}) {
  const originalValidation = validateComponentInstance(componentInstance);
  if (!originalValidation.valid) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.COMPONENT_INVALID, { errors: originalValidation.errors });
  const resolution = normalizeResolution(resolvedTheme, options);
  if (!resolution.resolvedTheme) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_RESOLVED);
  const original = cloneComponentInstance(componentInstance);
  const next = cloneComponentInstance(componentInstance);
  const tokenMap = buildComponentTokenMapping(next, mapping, options);
  const appliedTokens = [];
  const fallbackTokens = [];
  const ignoredTokens = [];
  const warnings = [];
  const errors = [];
  const appearance = buildTokenCatalog(resolution.resolvedTheme, next, options);
  if (VISIBILITY_RANK[resolution.visibility] > VISIBILITY_RANK[normalizeVisibility(options.visibility)]) {
    errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_VISIBILITY_MISMATCH);
  }
  if (resolution.resolvedTheme.tenantId && options.tenantId && resolution.resolvedTheme.tenantId !== options.tenantId) {
    errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TENANT_MISMATCH);
  }

  Object.entries(tokenMap.style).forEach(([styleField, tokenPath]) => {
    if (!STYLE_ALLOWLIST.has(styleField)) {
      ignoredTokens.push(styleField === "gap" ? "gap" : tokenPath);
      warnings.push("component-style-property-unsupported");
      return;
    }
    if (!TOKEN_SET.has(tokenPath)) {
      ignoredTokens.push(tokenPath);
      warnings.push(`${THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TOKEN_INVALID}:${tokenPath}`);
      return;
    }
    const token = appearance[tokenPath];
    if (token === undefined || token === null) {
      fallbackTokens.push(tokenPath);
      return;
    }
    const value = normalizeStyleToken(styleField, token, warnings);
    if (value === undefined) {
      ignoredTokens.push(tokenPath);
      return;
    }
    next.style[styleField] = value;
    appliedTokens.push(tokenPath);
  });

  if (next.componentType === "text") {
    if (appearance["typography.uppercase"] === true) {
      next.properties.textTransform = "uppercase";
      appliedTokens.push("typography.uppercase");
    } else if (appearance["typography.capitalize"] === true) {
      next.properties.textTransform = "capitalize";
      appliedTokens.push("typography.capitalize");
    }
  }

  const assetToken = tokenMap.asset;
  if (assetToken) {
    if (!TOKEN_SET.has(assetToken)) {
      ignoredTokens.push(assetToken);
      warnings.push(`${THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TOKEN_INVALID}:${assetToken}`);
    } else if (ASSET_COMPONENT_TYPES.has(next.componentType)) {
      const rawRef = appearance[assetToken];
      const assetResolution = resolveThemeAssetReference(rawRef, { ...options, themeScope: resolution.themeScope }, assetToken);
      warnings.push(...assetResolution.warnings);
      errors.push(...assetResolution.errors);
      if (assetResolution.assetRef) {
        next.properties.assetRef = assetResolution.assetRef;
        appliedTokens.push(assetToken);
      } else fallbackTokens.push(assetToken);
    } else {
      ignoredTokens.push(assetToken);
      warnings.push(`theme-asset-component-unsupported:${next.componentType}`);
    }
  }

  applyStyleOverrides(next, mapping.templateStyleOverride, warnings, "template");
  applyStyleOverrides(next, mapping.componentStyleOverride || next.metadata?.themeStyleOverrides, warnings, "component");
  next.metadata = {
    ...(isRecord(next.metadata) ? next.metadata : {}),
    themeApplication: {
      appliedThemeId: resolution.themeId,
      appliedThemeVersion: resolution.themeVersion,
      appliedThemeScope: resolution.themeScope,
      appliedTokens: uniqueStrings(appliedTokens),
      fallbackTokens: uniqueStrings(fallbackTokens),
      ignoredTokens: uniqueStrings(ignoredTokens),
      warnings: uniqueStrings(warnings),
      errors: uniqueStrings(errors)
    }
  };
  const validation = validateComponentInstance(next);
  if (!validation.valid) {
    errors.push(...validation.errors);
    return {
      instance: original,
      appliedThemeId: resolution.themeId,
      appliedThemeVersion: resolution.themeVersion,
      appliedThemeScope: resolution.themeScope,
      appliedTokens: [],
      fallbackTokens: uniqueStrings(fallbackTokens),
      ignoredTokens: uniqueStrings([...ignoredTokens, ...appliedTokens]),
      warnings: uniqueStrings(warnings),
      errors: uniqueStrings(errors)
    };
  }
  return {
    instance: cloneComponentInstance(next),
    appliedThemeId: resolution.themeId,
    appliedThemeVersion: resolution.themeVersion,
    appliedThemeScope: resolution.themeScope,
    appliedTokens: uniqueStrings(appliedTokens),
    fallbackTokens: uniqueStrings(fallbackTokens),
    ignoredTokens: uniqueStrings(ignoredTokens),
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors)
  };
}

export function applyThemeToTemplatePreparation(preparationInput, resolvedTheme, options = {}) {
  if (!isTemplatePreparation(preparationInput)) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.PREPARATION_INVALID);
  const sourcePreparation = safeClone(preparationInput).value;
  const resolution = normalizeResolution(resolvedTheme, options);
  const visibilityPolicy = applyPreparationVisibilityPolicy(sourcePreparation, resolution, options);
  const preparation = visibilityPolicy.preparation;
  const requirements = readThemeRequirements(preparation.templateInstance);
  const requirementResult = validateThemeRequirements(requirements, resolution, {
    ...options,
    visibility: visibilityPolicy.effectiveVisibility
  });
  const appliedTokens = [];
  const fallbackTokens = [...requirementResult.fallbackTokens];
  const ignoredTokens = [];
  const warnings = [
    ...preparation.warnings,
    ...resolution.warnings,
    ...visibilityPolicy.warnings,
    ...requirementResult.warnings
  ];
  const errors = [
    ...preparation.errors,
    ...resolution.errors,
    ...visibilityPolicy.errors,
    ...requirementResult.errors
  ];
  const components = preparation.components.map((component) => {
    const mapping = resolveComponentMapping(preparation.templateInstance, component.instance, options);
    const themed = applyThemeToComponentInstance(component.instance, resolution, mapping, {
      ...options,
      visibility: visibilityPolicy.effectiveVisibility
    });
    appliedTokens.push(...themed.appliedTokens);
    fallbackTokens.push(...themed.fallbackTokens);
    ignoredTokens.push(...themed.ignoredTokens);
    warnings.push(...themed.warnings);
    if (component.required) errors.push(...themed.errors);
    else warnings.push(...themed.errors.map((error) => `optional:${error}`));
    return {
      ...component,
      instance: themed.instance,
      themeApplication: {
        appliedTokens: themed.appliedTokens,
        fallbackTokens: themed.fallbackTokens,
        ignoredTokens: themed.ignoredTokens,
        warnings: themed.warnings,
        errors: themed.errors
      }
    };
  });
  const background = resolveBackgroundVisual(resolution.resolvedTheme, preparation.templateInstance, {
    ...options,
    visibility: visibilityPolicy.effectiveVisibility
  });
  warnings.push(...background.warnings);
  errors.push(...background.errors);
  const now = normalizeNow(options.now);
  const themedPreparation = {
    ...preparation,
    themedPreparationVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    state: errors.length ? "error" : "prepared",
    status: errors.length ? "error" : "prepared",
    themeId: resolution.themeId,
    themeVersion: resolution.themeVersion,
    themeScope: resolution.themeScope,
    brandingStatus: resolution.brandingStatus,
    resolvedFrom: [...resolution.resolvedFrom],
    selectionReason: resolution.selectionReason,
    fallbackUsed: resolution.fallbackUsed,
    effectiveVisibility: visibilityPolicy.effectiveVisibility,
    components,
    componentInstances: components.map((component) => cloneComponentInstance(component.instance)),
    appliedTokens: uniqueStrings(appliedTokens),
    fallbackTokens: uniqueStrings(fallbackTokens),
    ignoredTokens: uniqueStrings(ignoredTokens),
    themeBackground: background.visual,
    themeAssetRefs: collectThemeAssetRefs(resolution.resolvedTheme),
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors),
    preparedAt: now
  };
  return safeClone(themedPreparation).value;
}

export function renderThemedTemplate(integration, themedPreparationInput, options = {}) {
  const runtime = requireIntegration(integration);
  const themedPreparation = normalizeThemedPreparation(themedPreparationInput);
  const preparationRecord = runtime.preparations.get(themedPreparation.preparationId);
  if (!preparationRecord?.basePreparation) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.PREPARATION_INVALID, {
      reason: "theme-template-base-preparation-missing",
      preparationId: themedPreparation.preparationId
    });
  }
  if (themedPreparation.errors.length && options.allowPreparationErrors !== true) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.PREPARATION_INVALID, { errors: themedPreparation.errors });
  }
  const themedRenderId = normalizeId(options.themedRenderId)
    || normalizeId(`themed_${themedPreparation.templateRenderId}_${themedPreparation.themeId}`)
    || buildId("themed_render", options.now, options.random);
  if (runtime.renders.has(themedRenderId)) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.RENDER_DUPLICATE, { themedRenderId });
  setState(integration, runtime, "rendering", options.now);
  try {
    const renderResult = renderTemplateInstance(runtime.templateRendererIntegration, themedPreparation, {
      now: options.now,
      includeRoot: true,
      resolvedAssets: buildRendererResolvedAssets(runtime.assetRegistry, themedPreparation, options)
    });
    applyThemeRootVisual(renderResult.root, themedPreparation.themeBackground);
    const now = normalizeNow(options.now);
    const result = buildThemedRenderResult(themedRenderId, themedPreparation, renderResult, now, now);
    runtime.renders.set(themedRenderId, {
      sequence: ++runtime.sequence,
      basePreparation: safeClone(preparationRecord.basePreparation).value,
      themedPreparation: safeClone(themedPreparation).value,
      result: safeClone(result).value
    });
    setState(integration, runtime, renderResult.state === "partially_rendered" ? "partially_rendered" : "rendered", now);
    syncRenderedIds(integration, runtime);
    return options.includeRoot === true ? { ...cloneThemedTemplateResult(result), root: renderResult.root || null } : cloneThemedTemplateResult(result);
  } catch (error) {
    failIntegration(integration, runtime, error, options.now);
    throw error;
  }
}

export function updateThemedTemplateRender(integration, themedRenderId, nextThemeOrContext, options = {}) {
  const runtime = requireIntegration(integration);
  const id = normalizeId(themedRenderId);
  const record = runtime.renders.get(id);
  if (!record) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.RENDER_NOT_FOUND, { themedRenderId: id });
  const previousIntegration = safeClone(integration).value;
  const previousRuntimeState = runtime.state;
  const requestedVisibility = normalizeVisibility(options.visibility || integration.visibility);
  const resolution = isThemeResolution(nextThemeOrContext)
    ? safeClone(nextThemeOrContext).value
    : resolveThemeForTemplate(nextThemeOrContext, buildRuntimeResolutionContext(integration, runtime, requestedVisibility), {
      ...options,
      visibility: requestedVisibility
    });
  const basePreparation = safeClone(record.basePreparation).value;
  const nextPreparation = applyThemeToTemplatePreparation(basePreparation, resolution, {
    ...options,
    assetRegistry: runtime.assetRegistry,
    visibility: requestedVisibility,
    tenantId: integration.tenantId,
    organizationId: integration.organizationId,
    clientId: integration.clientId,
    tournamentId: integration.tournamentId,
    competitionId: integration.competitionId,
    eventId: integration.eventId,
    output: runtime.output
  });
  if (nextPreparation.errors.length && options.allowPreparationErrors !== true) {
    throw buildPreparationError(nextPreparation.errors);
  }
  setState(integration, runtime, "updating", options.now);
  try {
    const renderResult = updateTemplateRender(
      runtime.templateRendererIntegration,
      record.result.templateRenderId,
      nextPreparation,
      {
        now: options.now,
        includeRoot: true,
        resolvedAssets: buildRendererResolvedAssets(runtime.assetRegistry, nextPreparation, options)
      }
    );
    applyThemeRootVisual(renderResult.root, nextPreparation.themeBackground);
    const now = normalizeNow(options.now);
    const result = buildThemedRenderResult(id, nextPreparation, renderResult, record.result.createdAt, now);
    runtime.renders.set(id, {
      ...record,
      basePreparation: safeClone(basePreparation).value,
      themedPreparation: safeClone(nextPreparation).value,
      result: safeClone(result).value
    });
    runtime.lastPreparation = safeClone(nextPreparation).value;
    runtime.lastResolution = safeClone(resolution).value;
    setState(integration, runtime, renderResult.state === "partially_rendered" ? "partially_rendered" : "rendered", now);
    syncRenderedIds(integration, runtime);
    return options.includeRoot === true ? { ...cloneThemedTemplateResult(result), root: renderResult.root || null } : cloneThemedTemplateResult(result);
  } catch (error) {
    restoreTemplateRenderAfterFailedUpdate(runtime, record, options);
    restoreIntegrationState(integration, runtime, previousIntegration, previousRuntimeState);
    throw error;
  }
}

export function removeThemedTemplateRender(integration, themedRenderId, options = {}) {
  const runtime = requireIntegration(integration);
  const id = normalizeId(themedRenderId);
  const record = runtime.renders.get(id);
  if (!record) return { themedRenderId: id, removed: false, status: "not_found" };
  const removal = removeTemplateRender(runtime.templateRendererIntegration, record.result.templateRenderId, options);
  runtime.renders.delete(id);
  setState(integration, runtime, runtime.renders.size ? aggregateState(runtime) : "cleared", options.now);
  syncRenderedIds(integration, runtime);
  return { themedRenderId: id, templateRenderId: record.result.templateRenderId, removed: removal.removed, status: removal.status };
}

export function clearThemeTemplateIntegration(integration, options = {}) {
  const runtime = requireIntegration(integration);
  let removedCount = 0;
  [...runtime.renders.keys()].forEach((id) => {
    if (removeThemedTemplateRender(integration, id, options).removed) removedCount += 1;
  });
  if (options.clearExternalIntegration === true) clearTemplateRendererIntegration(runtime.templateRendererIntegration, options);
  runtime.lastPreparation = null;
  runtime.lastResolution = null;
  runtime.preparations.clear();
  setState(integration, runtime, "cleared", options.now);
  syncRenderedIds(integration, runtime);
  return { integrationId: integration.integrationId, cleared: true, removedCount, state: integration.state };
}

export function getThemedTemplateRender(integration, themedRenderId, options = {}) {
  const runtime = requireIntegration(integration);
  const record = runtime.renders.get(normalizeId(themedRenderId));
  if (!record) return null;
  const result = cloneThemedTemplateResult(record.result);
  if (options.includeRoot === true) {
    const rendererResult = getRenderedTemplate(runtime.templateRendererIntegration, record.result.templateRenderId, { includeRoot: true });
    result.root = rendererResult?.root || null;
  }
  return result;
}

export function listThemedTemplateRenders(integration, options = {}) {
  const runtime = requireIntegration(integration);
  return [...runtime.renders.values()]
    .sort((left, right) => left.sequence - right.sequence || left.result.themedRenderId.localeCompare(right.result.themedRenderId))
    .map((record) => getThemedTemplateRender(integration, record.result.themedRenderId, options));
}

export function buildThemeTemplateSnapshot(integration, themedRenderId = null, options = {}) {
  const runtime = requireIntegration(integration);
  const visibility = normalizeVisibility(options.visibility || integration.visibility);
  const records = themedRenderId
    ? [runtime.renders.get(normalizeId(themedRenderId))].filter(Boolean)
    : [...runtime.renders.values()].sort((left, right) => left.sequence - right.sequence);
  if (themedRenderId && !records.length) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.RENDER_NOT_FOUND, { themedRenderId });
  const generatedAt = normalizeNow(options.now);
  const renders = records.map((record) => snapshotRender(record, visibility));
  const rendererSnapshot = buildTemplateRenderSnapshot(runtime.templateRendererIntegration, { visibility, now: generatedAt });
  const snapshot = {
    snapshotVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    integrationVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    generatedAt,
    visibility,
    integrationId: integration.integrationId,
    state: integration.state,
    outputId: integration.outputId,
    tenantId: integration.tenantId,
    themedRenderIds: renders.map((render) => render.themedRenderId),
    renders,
    rendererSummary: {
      integrationVersion: rendererSnapshot.integrationVersion,
      outputId: rendererSnapshot.outputId,
      orientation: rendererSnapshot.orientation,
      resolution: rendererSnapshot.resolution,
      safeArea: rendererSnapshot.safeArea,
      templateRenderIds: rendererSnapshot.templateRenderIds
    },
    warnings: getThemeTemplateWarnings(integration),
    errors: uniqueStrings([...(integration.errors || []), ...renders.flatMap((render) => render.errors || [])])
  };
  return sanitizeSnapshot(snapshot, visibility);
}

export function validateThemeTemplateSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  if (!isRecord(snapshot)) return validationResult([THEME_TEMPLATE_INTEGRATION_ERROR_CODES.SNAPSHOT_INVALID], []);
  if (snapshot.snapshotVersion !== THEME_TEMPLATE_INTEGRATION_VERSION) errors.push("theme-template-snapshot-version-invalid");
  if (!isIso(snapshot.generatedAt)) errors.push("theme-template-snapshot-timestamp-invalid");
  if (!VISIBILITIES.includes(snapshot.visibility)) errors.push("theme-template-snapshot-visibility-invalid");
  if (!isSafeId(snapshot.integrationId)) errors.push("theme-template-snapshot-integration-id-invalid");
  if (!Array.isArray(snapshot.renders)) errors.push("theme-template-snapshot-renders-invalid");
  if (!Array.isArray(snapshot.warnings) || !Array.isArray(snapshot.errors)) errors.push("theme-template-snapshot-diagnostics-invalid");
  if (containsRuntimeReference(snapshot)) errors.push("theme-template-snapshot-runtime-reference-forbidden");
  if (containsUnsafeSnapshotValue(snapshot)) errors.push("theme-template-snapshot-unsafe-value");
  return validationResult(errors, warnings);
}

export function getThemeTemplateWarnings(integrationOrResult) {
  const runtime = CONTEXTS.get(integrationOrResult);
  if (runtime) return uniqueStrings([
    ...(integrationOrResult.warnings || []),
    ...[...runtime.renders.values()].flatMap((record) => record.result.warnings || [])
  ]);
  return uniqueStrings(integrationOrResult?.warnings || []);
}

export function cloneThemedTemplateResult(result) {
  return safeClone(result, { omitRuntime: true }).value || {};
}

function resolveCandidateTheme(runtime, candidate, context, options) {
  const theme = getBroadcastTheme(runtime.themeRegistry, candidate.themeId);
  if (!theme) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_FOUND, { themeId: candidate.themeId });
  assertThemeStatusAllowed(theme, candidate.reason);
  assertThemeScope(theme, context);
  assertTenantCompatible(theme.tenantId, context.tenantId, "theme");
  if (VISIBILITY_RANK[theme.visibility] > VISIBILITY_RANK[context.visibility]) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_VISIBILITY_MISMATCH, { themeId: theme.themeId });
  }
  const resolvedTheme = resolveBroadcastTheme(runtime.themeRegistry, theme.themeId);
  const validation = validateBroadcastTheme(resolvedTheme, { resolved: true });
  if (!validation.valid) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_RESOLVED, { errors: validation.errors });
  const assetDiagnostics = validateResolvedThemeAssets(resolvedTheme, runtime.assetRegistry, context, options);
  const brandingStatus = ["confirmed", "provisional", "neutral"].includes(resolvedTheme.metadata?.brandingStatus)
    ? resolvedTheme.metadata.brandingStatus
    : "neutral";
  return {
    resolutionVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    themeId: resolvedTheme.themeId,
    themeVersion: resolvedTheme.themeVersion,
    themeScope: resolvedTheme.scope,
    effectiveScopeKey: getBroadcastThemeEffectiveScopeKey(resolvedTheme),
    selectionReason: candidate.reason,
    fallbackUsed: candidate.fallbackUsed === true,
    resolvedFrom: [...(resolvedTheme.resolvedFrom || [resolvedTheme.themeId])],
    brandingStatus,
    visibility: resolvedTheme.visibility,
    resolvedTheme: safeClone(resolvedTheme).value,
    warnings: uniqueStrings([...(validation.warnings || []), ...assetDiagnostics.warnings]),
    errors: uniqueStrings(assetDiagnostics.errors)
  };
}

function buildThemeCandidates(registry, context, explicitId) {
  const candidates = [];
  const seen = new Set();
  const add = (themeId, reason, fallbackUsed = false) => {
    const id = normalizeId(themeId);
    if (!id || seen.has(id)) return;
    seen.add(id);
    candidates.push({ themeId: id, reason, fallbackUsed });
  };
  add(explicitId, "explicit");
  SELECTION_LEVELS.forEach(([level, field]) => {
    add(context[field] || context.themeSelections?.[field] || context.themeSelections?.[level], `${level}-active`);
    if (["competition", "tournament", "client", "organization", "tenant", "global"].includes(level)) {
      const active = getActiveBroadcastThemeForContext(registry, scopeContext(level, context));
      add(active?.themeId, `${level}-active`);
    }
  });
  add(registry?.activeThemeId, "global-active");
  add("theme_default", "default", true);
  return candidates;
}

function scopeContext(level, context) {
  if (level === "global") return { scope: "global" };
  return {
    scope: level,
    tenantId: context.tenantId,
    organizationId: ["organization", "client", "tournament", "competition"].includes(level) ? context.organizationId : null,
    clientId: ["client", "tournament", "competition"].includes(level) ? context.clientId : null,
    tournamentId: ["tournament", "competition"].includes(level) ? context.tournamentId : null,
    competitionId: level === "competition" ? context.competitionId : null
  };
}

function assertThemeScope(theme, context) {
  const field = SCOPE_CONTEXT_FIELD[theme.scope];
  if (!field) return;
  if (!theme[field] || !context[field] || theme[field] !== context[field]) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_SCOPE_MISMATCH, { scope: theme.scope, expected: context[field], actual: theme[field] });
  }
}

function buildComponentTokenMapping(instance, mapping, options) {
  const type = instance.componentType;
  const typographyRole = ["score", "timer"].includes(type) ? "score" : ["badge", "ticker"].includes(type) ? "label" : "body";
  const defaultStyle = {
    color: type === "score" ? "color.highlight" : "color.textPrimary",
    backgroundColor: ["logo", "image", "icon", "qr", "sponsor"].includes(type) ? "color.transparent" : "color.surface",
    borderColor: "color.border",
    borderWidth: "border.width",
    borderStyle: "border.style",
    borderRadius: "radius.md",
    fontFamily: "typography.family",
    fontSize: "typography.size",
    fontWeight: "typography.weight",
    italic: "typography.italic",
    lineHeight: "typography.lineHeight",
    letterSpacing: "typography.tracking",
    shadow: type === "text" ? "shadow.sm" : "shadow.md",
    padding: "spacing.sm",
    gap: "spacing.sm",
    margin: "spacing.none",
    opacity: "opacity"
  };
  delete defaultStyle.margin;
  delete defaultStyle.opacity;
  const roleMapping = {
    typographyRole,
    borderRole: ["score", "badge"].includes(type) ? "emphasis" : "subtle",
    shadowRole: type === "text" ? "text" : "panel",
    backgroundRole: options.backgroundRole || instance.metadata?.themeBackgroundRole || "panel"
  };
  const explicitStyle = isRecord(mapping?.style) ? mapping.style : {};
  let asset = mapping?.asset || null;
  if (!asset && instance.metadata?.themeAssetRole === "watermark") asset = "asset.watermark";
  if (!asset && instance.componentType === "logo") asset = "asset.logoPrimary";
  if (!asset && instance.componentType === "sponsor") asset = "asset.logoSecondary";
  if (!asset && instance.componentType === "icon") asset = "asset.iconSet";
  return {
    style: { ...defaultStyle, ...explicitStyle },
    asset,
    ...roleMapping,
    templateStyleOverride: mapping?.templateStyleOverride,
    componentStyleOverride: mapping?.componentStyleOverride
  };
}

function buildTokenCatalog(theme, instance, options = {}) {
  const type = instance.componentType;
  const typographyRole = options.typographyRole || instance.metadata?.themeTypographyRole
    || (["score", "timer"].includes(type) ? "score" : ["badge", "ticker"].includes(type) ? "label" : "body");
  const typography = theme.typography?.[typographyRole] || theme.typography?.body || {};
  const border = theme.borders?.[options.borderRole || (["score", "badge"].includes(type) ? "emphasis" : "subtle")] || {};
  const smallShadow = theme.shadows?.text || null;
  const mediumShadow = theme.shadows?.panel || smallShadow;
  const largeShadow = theme.shadows?.panel || mediumShadow;
  return {
    ...Object.fromEntries(Object.keys(theme.colors || {}).map((key) => [`color.${key}`, theme.colors[key]])),
    "typography.family": buildSafeFontFamily(typography),
    "typography.weight": typography.weight,
    "typography.size": typography.size,
    "typography.lineHeight": typography.lineHeight,
    "typography.tracking": typography.tracking,
    "typography.uppercase": typography.uppercase === true,
    "typography.capitalize": typography.capitalize === true,
    "typography.italic": typography.italic === true,
    ...Object.fromEntries(Object.entries(theme.spacing || {}).map(([key, value]) => [`spacing.${key}`, value])),
    ...Object.fromEntries(Object.entries(theme.radius || {}).map(([key, value]) => [`radius.${key}`, value])),
    "radius.full": theme.radius?.full ?? 999,
    "border.width": border.width,
    "border.style": border.style,
    "border.color": border.color,
    "shadow.sm": smallShadow,
    "shadow.md": mediumShadow,
    "shadow.lg": largeShadow,
    "asset.logoPrimary": theme.logos?.tournament || theme.logos?.organization || null,
    "asset.logoSecondary": theme.logos?.sponsor || theme.logos?.organization || null,
    "asset.background": theme.backgrounds?.program?.asset || theme.backgrounds?.panel?.asset || null,
    "asset.watermark": theme.watermarks?.primary?.asset || theme.icons?.watermark || null,
    "asset.iconSet": theme.icons?.primary || theme.icons?.watermark || null
  };
}

function normalizeStyleToken(field, value, warnings) {
  if (["color", "backgroundColor", "borderColor"].includes(field)) {
    if (value === "transparent") return "#00000000";
    return isSafeColor(value) ? value : undefined;
  }
  if (["padding", "margin"].includes(field) && Number.isFinite(value)) {
    return { top: value, right: value, bottom: value, left: value };
  }
  if (["fontSize", "borderWidth", "borderRadius", "lineHeight", "letterSpacing", "opacity"].includes(field)) {
    return Number.isFinite(value) ? value : undefined;
  }
  if (field === "fontFamily") return isSafeFontFamily(value) ? value : undefined;
  if (field === "fontWeight") return typeof value === "string" || Number.isInteger(value) ? value : undefined;
  if (field === "italic") return value === true;
  if (field === "shadow") return normalizeShadow(value, warnings);
  return undefined;
}

function applyStyleOverrides(instance, raw, warnings, source) {
  if (!isRecord(raw)) return;
  Object.entries(raw).forEach(([field, value]) => {
    if (!STYLE_ALLOWLIST.has(field)) {
      warnings.push("component-style-property-unsupported");
      return;
    }
    const normalized = normalizeStyleToken(field, value, warnings);
    if (normalized !== undefined) instance.style[field] = normalized;
  });
}

function resolveThemeAssetReference(rawRef, options, tokenPath) {
  const warnings = [];
  const errors = [];
  const assetRef = sanitizeAssetReference(rawRef);
  if (!assetRef) {
    if (rawRef !== null && rawRef !== undefined) errors.push(`${THEME_TEMPLATE_INTEGRATION_ERROR_CODES.ASSET_REFERENCE_INVALID}:${tokenPath}`);
    return { assetRef: null, resolution: null, warnings, errors };
  }
  const assetRegistry = options.assetRegistry || {};
  const resolution = resolveBroadcastAsset(assetRegistry, {
    ...assetRef,
    variantRequired: Boolean(assetRef.variantId)
  }, {
    tenantId: options.tenantId,
    organizationId: options.organizationId,
    clientId: options.clientId,
    tournamentId: options.tournamentId,
    competitionId: options.competitionId,
    outputId: options.outputId,
    visibility: normalizeVisibility(options.visibility)
  }, { now: options.now, allowDeprecated: options.allowDeprecatedAssets === true });
  warnings.push(...(resolution.warnings || []));
  if (resolution.resolved && options.themeScope === "global" && resolution.asset?.scope !== "global") {
    errors.push(`${THEME_TEMPLATE_INTEGRATION_ERROR_CODES.ASSET_NOT_RESOLVABLE}:${assetRef.assetId}:global-theme-asset-scope`);
    return { assetRef: null, resolution, warnings, errors };
  }
  if (!resolution.resolved) errors.push(`${THEME_TEMPLATE_INTEGRATION_ERROR_CODES.ASSET_NOT_RESOLVABLE}:${assetRef.assetId}`);
  return { assetRef: resolution.resolved ? assetRef : null, resolution, warnings, errors };
}

function sanitizeAssetReference(value) {
  if (!isRecord(value)) return null;
  if (Object.keys(value).some((key) => ["url", "signedUrl", "externalUrl", "storageRef", "localDevelopmentRef", "cdnRef"].includes(key))) return null;
  const assetId = normalizeId(value.assetId);
  if (!assetId) return null;
  return {
    assetId,
    version: value.version === null || value.version === undefined ? null : String(value.version),
    variantId: nullableId(value.variantId)
  };
}

function validateResolvedThemeAssets(theme, assetRegistry, context, options) {
  const warnings = [];
  const errors = [];
  collectThemeAssetRefs(theme).forEach(({ token, ref }) => {
    const result = resolveThemeAssetReference(ref, { ...context, ...options, assetRegistry }, token);
    warnings.push(...result.warnings);
    if (!result.assetRef) warnings.push(...result.errors.map((error) => `optional:${error}`));
  });
  return { warnings: uniqueStrings(warnings), errors: uniqueStrings(errors) };
}

function collectThemeAssetRefs(theme) {
  const refs = [];
  const add = (token, ref) => { if (ref) refs.push({ token, ref: sanitizeAssetReference(ref) }); };
  add("asset.logoPrimary", theme.logos?.tournament || theme.logos?.organization);
  add("asset.logoSecondary", theme.logos?.sponsor || theme.logos?.organization);
  add("asset.background", theme.backgrounds?.program?.asset || theme.backgrounds?.panel?.asset);
  add("asset.watermark", theme.watermarks?.primary?.asset || theme.icons?.watermark);
  add("asset.iconSet", theme.icons?.primary || theme.icons?.watermark);
  return refs.filter((entry) => entry.ref);
}

function resolveBackgroundVisual(theme, templateInstance, options) {
  const warnings = [];
  const errors = [];
  const role = options.backgroundRole || templateInstance?.metadata?.themeBackgroundRole || theme.defaults?.backgroundToken || "program";
  const background = theme.backgrounds?.[role] || theme.backgrounds?.program || theme.backgrounds?.panel || { type: "transparent" };
  if (background.type === "solid") return { visual: { type: "solid", color: isSafeColor(background.color) ? background.color : "transparent" }, warnings, errors };
  if (background.type === "transparent") return { visual: { type: "transparent" }, warnings, errors };
  if (background.type === "placeholder") return { visual: { type: "placeholder" }, warnings: ["theme-background-placeholder"], errors };
  if (background.type === "asset") {
    const result = resolveThemeAssetReference(background.asset, options, "asset.background");
    return { visual: { type: "asset", assetRef: result.assetRef }, warnings: result.warnings, errors: result.errors };
  }
  if (background.type === "gradient") {
    const gradient = buildSafeGradient(background);
    if (!gradient) return { visual: null, warnings, errors: ["theme-background-gradient-invalid"] };
    warnings.push("theme-background-gradient-renderer-v1-metadata-only");
    return { visual: { type: "gradient", value: gradient }, warnings, errors };
  }
  return { visual: null, warnings, errors: ["theme-background-type-invalid"] };
}

function buildSafeGradient(background) {
  if (!isRecord(background) || background.type !== "gradient") return null;
  const type = background.gradientType === "radial" ? "radial" : "linear";
  const stops = Array.isArray(background.stops) ? background.stops.slice(0, 8) : [];
  if (stops.length < 2 || stops.some((stop) => !isRecord(stop) || !isSafeColor(stop.color) || !Number.isFinite(stop.position) || stop.position < 0 || stop.position > 1)) return null;
  const stopText = stops.map((stop) => `${stop.color} ${formatNumber(stop.position * 100)}%`).join(", ");
  if (type === "radial") return `radial-gradient(circle, ${stopText})`;
  const angle = Number.isFinite(background.angle) ? Math.max(-360, Math.min(360, background.angle)) : 0;
  return `linear-gradient(${formatNumber(angle)}deg, ${stopText})`;
}

function readThemeRequirements(templateInstance) {
  const metadata = isRecord(templateInstance?.metadata) ? templateInstance.metadata : {};
  return {
    themeVariant: nullableId(metadata.themeVariant),
    themeScope: nullableId(metadata.themeScope),
    themeRequirements: isRecord(metadata.themeRequirements) ? safeClone(metadata.themeRequirements).value : {},
    themeTokensRequired: uniqueStrings(metadata.themeTokensRequired || []),
    themeAssetsRequired: uniqueStrings(metadata.themeAssetsRequired || [])
  };
}

function validateThemeRequirements(requirements, resolution, options) {
  const catalog = buildTokenCatalog(resolution.resolvedTheme, { componentType: "text", metadata: {} }, options);
  const warnings = [];
  const errors = [];
  const fallbackTokens = [];
  const strict = requirements.themeRequirements?.strict === true || options.strictRequirements === true;
  if (requirements.themeVariant) warnings.push(`theme-variant-not-supported:${requirements.themeVariant}`);
  requirements.themeTokensRequired.forEach((token) => {
    if (!TOKEN_SET.has(token) || catalog[token] === undefined || catalog[token] === null) {
      fallbackTokens.push(token);
      (strict ? errors : warnings).push(`${THEME_TEMPLATE_INTEGRATION_ERROR_CODES.REQUIRED_TOKEN_MISSING}:${token}`);
    }
  });
  requirements.themeAssetsRequired.forEach((token) => {
    const rawRef = TOKEN_SET.has(token) && String(token).startsWith("asset.") ? catalog[token] : null;
    const assetResolution = rawRef
      ? resolveThemeAssetReference(rawRef, { ...options, themeScope: resolution.themeScope }, token)
      : null;
    if (!rawRef || !assetResolution?.assetRef) {
      fallbackTokens.push(token);
      errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.REQUIRED_ASSET_UNAVAILABLE);
    }
  });
  if (requirements.themeScope && requirements.themeScope !== resolution.themeScope) {
    (strict ? errors : warnings).push(`theme-scope-requirement-mismatch:${requirements.themeScope}`);
  }
  const allowedBranding = requirements.themeRequirements?.brandingStatusAllowed;
  if (Array.isArray(allowedBranding) && !allowedBranding.includes(resolution.brandingStatus)) {
    (strict ? errors : warnings).push(`theme-branding-status-not-allowed:${resolution.brandingStatus}`);
  }
  return { warnings: uniqueStrings(warnings), errors: uniqueStrings(errors), fallbackTokens: uniqueStrings(fallbackTokens) };
}

function applyPreparationVisibilityPolicy(sourcePreparation, resolution, options) {
  const integrationVisibility = normalizeVisibility(sourcePreparation.visibility);
  const requestedVisibility = normalizeVisibility(options.visibility || integrationVisibility);
  const effectiveVisibility = visibilityAtOrBelow(integrationVisibility, requestedVisibility);
  const effectiveRank = VISIBILITY_RANK[effectiveVisibility];
  const warnings = [];
  const errors = [];
  if (VISIBILITY_RANK[normalizeVisibility(resolution.visibility)] > effectiveRank) {
    errors.push(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_VISIBILITY_MISMATCH);
  }
  const templateVisibility = normalizeVisibility(sourcePreparation.templateInstance?.visibility);
  const templateAllowed = VISIBILITY_RANK[templateVisibility] <= effectiveRank;
  if (!templateAllowed) warnings.push("theme-template-template-visibility-filtered");
  const components = templateAllowed
    ? sourcePreparation.components.map((component) => filterPreparedComponentVisibility(component, effectiveRank)).filter(Boolean)
    : [];
  if (components.length !== sourcePreparation.components.length) warnings.push("theme-template-component-visibility-filtered");
  const preparation = safeClone(sourcePreparation).value;
  preparation.components = components;
  preparation.componentInstances = components.map((component) => cloneComponentInstance(component.instance));
  preparation.componentOrder = components.map((component) => component.instance.instanceId);
  preparation.effectiveVisibility = effectiveVisibility;
  if (effectiveRank < VISIBILITY_RANK[integrationVisibility]) preparation.resolvedBindings = {};
  return { preparation, effectiveVisibility, warnings: uniqueStrings(warnings), errors: uniqueStrings(errors) };
}

function filterPreparedComponentVisibility(componentInput, visibilityRank) {
  const component = safeClone(componentInput).value;
  if (VISIBILITY_RANK[normalizeVisibility(component.instance?.visibility)] > visibilityRank) return null;
  const bindings = Array.isArray(component.instance?.bindings) ? component.instance.bindings : [];
  const allowedBindings = bindings.filter((binding) => VISIBILITY_RANK[normalizeVisibility(binding.visibility)] <= visibilityRank);
  if (component.instance) component.instance.bindings = safeClone(allowedBindings).value || [];
  if (allowedBindings.length !== bindings.length) {
    const allowedTargets = new Set(allowedBindings.map((binding) => binding.target).filter(Boolean));
    component.resolvedBindings = Object.fromEntries(
      Object.entries(component.resolvedBindings || {}).filter(([target]) => allowedTargets.has(target))
    );
    component.resolvedContent = {};
  }
  return component;
}

function visibilityAtOrBelow(left, right) {
  const rank = Math.min(VISIBILITY_RANK[normalizeVisibility(left)], VISIBILITY_RANK[normalizeVisibility(right)]);
  return VISIBILITIES.find((visibility) => VISIBILITY_RANK[visibility] === rank) || "public";
}

function resolveComponentMapping(templateInstance, componentInstance, options) {
  const templateMappings = isRecord(templateInstance?.metadata?.themeMappings) ? templateInstance.metadata.themeMappings : {};
  const mapping = isRecord(templateMappings[componentInstance.instanceId]) ? safeClone(templateMappings[componentInstance.instanceId]).value : {};
  const optionMappings = isRecord(options.mappings?.[componentInstance.instanceId]) ? safeClone(options.mappings[componentInstance.instanceId]).value : {};
  return {
    ...mapping,
    ...optionMappings,
    style: { ...(mapping.style || {}), ...(optionMappings.style || {}) },
    templateStyleOverride: optionMappings.templateStyleOverride || mapping.templateStyleOverride,
    componentStyleOverride: optionMappings.componentStyleOverride || mapping.componentStyleOverride
  };
}

function buildRendererResolvedAssets(assetRegistry, preparation, options) {
  const provided = Array.isArray(options.resolvedAssets) ? options.resolvedAssets : Object.values(options.resolvedAssets || {});
  const refs = preparation.components.map((component) => component.instance.properties?.assetRef).filter(Boolean);
  const fromRegistry = refs.map((ref) => {
    const asset = getBroadcastAsset(assetRegistry, ref.assetId, ref.version);
    const rawUrl = asset?.externalUrl || null;
    return rawUrl ? {
      assetId: ref.assetId,
      url: rawUrl,
      authorized: true,
      allowExternal: asset.metadata?.allowExternal === true
    } : null;
  }).filter(Boolean);
  return [...provided, ...fromRegistry];
}

function buildThemedRenderResult(themedRenderId, preparation, renderResult, createdAt, updatedAt) {
  return {
    resultVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
    themedRenderId,
    templateRenderId: renderResult.templateRenderId,
    templateId: preparation.templateId,
    templateVersion: preparation.templateInstance?.templateVersion || "1.0.0",
    templateInstanceId: preparation.templateInstanceId,
    themeId: preparation.themeId,
    themeVersion: preparation.themeVersion,
    themeScope: preparation.themeScope,
    resolvedFrom: [...preparation.resolvedFrom],
    selectionReason: preparation.selectionReason,
    fallbackUsed: preparation.fallbackUsed,
    brandingStatus: preparation.brandingStatus,
    outputId: renderResult.outputId,
    visibility: preparation.effectiveVisibility || renderResult.visibility,
    state: renderResult.state,
    status: renderResult.status,
    componentCount: renderResult.componentCount,
    renderedCount: renderResult.renderedCount,
    componentOrder: [...(renderResult.componentOrder || [])],
    componentResults: safeClone(renderResult.componentResults || []).value || [],
    appliedTokens: [...preparation.appliedTokens],
    fallbackTokens: [...preparation.fallbackTokens],
    ignoredTokens: [...preparation.ignoredTokens],
    themeBackground: safeClone(preparation.themeBackground).value,
    warnings: uniqueStrings([...(preparation.warnings || []), ...(renderResult.warnings || [])]),
    errors: uniqueStrings([...(preparation.errors || []), ...(renderResult.errors || [])]),
    createdAt,
    updatedAt
  };
}

function applyThemeRootVisual(root, visual) {
  if (!root?.style) return;
  root.style.backgroundColor = "";
  root.style.backgroundImage = "";
  if (visual?.type === "solid" && isSafeColor(visual.color)) root.style.backgroundColor = visual.color;
  else if (visual?.type === "gradient" && typeof visual.value === "string" && /^(?:linear|radial)-gradient\(/.test(visual.value) && !UNSAFE_TEXT.test(visual.value)) {
    root.style.backgroundImage = visual.value;
  } else if (visual?.type === "transparent") root.style.backgroundColor = "transparent";
}

function snapshotRender(record, visibility) {
  const result = record.result;
  return sanitizeSnapshot({
    themedRenderId: result.themedRenderId,
    templateRenderId: result.templateRenderId,
    templateId: result.templateId,
    templateVersion: result.templateVersion,
    templateInstanceId: result.templateInstanceId,
    themeId: result.themeId,
    themeVersion: result.themeVersion,
    themeScope: result.themeScope,
    brandingStatus: result.brandingStatus,
    resolvedFrom: result.resolvedFrom,
    selectionReason: result.selectionReason,
    fallbackUsed: result.fallbackUsed,
    outputId: result.outputId,
    visibility: result.visibility,
    state: result.state,
    componentCount: result.componentCount,
    renderedCount: result.renderedCount,
    appliedTokens: result.appliedTokens,
    fallbackTokens: result.fallbackTokens,
    ignoredTokens: result.ignoredTokens,
    componentSummaries: (result.componentResults || []).map((component) => ({
      instanceId: component.instanceId,
      componentType: component.componentType,
      status: component.status,
      fallbackUsed: component.fallbackUsed === true
    })),
    warnings: result.warnings,
    errors: result.errors,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  }, visibility);
}

function buildRuntimeResolutionContext(integration, runtime, visibility) {
  return {
    themeRegistry: runtime.themeRegistry,
    assetRegistry: runtime.assetRegistry,
    output: runtime.output,
    themeSelections: runtime.themeSelections,
    visibility,
    tenantId: integration.tenantId,
    organizationId: integration.organizationId,
    clientId: integration.clientId,
    tournamentId: integration.tournamentId,
    competitionId: integration.competitionId,
    eventId: integration.eventId,
    sessionId: integration.sessionId
  };
}

function restoreTemplateRenderAfterFailedUpdate(runtime, record, options) {
  try {
    const restored = updateTemplateRender(
      runtime.templateRendererIntegration,
      record.result.templateRenderId,
      record.themedPreparation,
      {
        now: record.result.updatedAt,
        includeRoot: true,
        resolvedAssets: buildRendererResolvedAssets(runtime.assetRegistry, record.themedPreparation, options)
      }
    );
    applyThemeRootVisual(restored.root, record.themedPreparation.themeBackground);
  } catch {
    // The original error remains authoritative; runtime metadata is restored below.
  }
}

function restoreIntegrationState(integration, runtime, previousIntegration, previousRuntimeState) {
  Object.keys(integration).forEach((key) => {
    if (!Object.hasOwn(previousIntegration, key)) delete integration[key];
  });
  Object.assign(integration, safeClone(previousIntegration).value);
  runtime.state = previousRuntimeState;
}

function assertPreparationCompatible(preparation, context) {
  if (!isTemplatePreparation(preparation)) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.PREPARATION_INVALID);
  assertTenantCompatible(preparation.tenantId, context.tenantId, "template");
  const templateInstance = preparation.templateInstance || {};
  for (const field of ["organizationId", "tournamentId", "competitionId"]) {
    if (templateInstance[field] && context[field] && templateInstance[field] !== context[field]) {
      throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_SCOPE_MISMATCH, {
        source: "template",
        field,
        expected: context[field],
        actual: templateInstance[field]
      });
    }
  }
  if (context.outputId && preparation.outputId && context.outputId !== preparation.outputId) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.OUTPUT_MISMATCH, { expected: context.outputId, actual: preparation.outputId });
  }
  if (VISIBILITY_RANK[preparation.visibility] > VISIBILITY_RANK[context.visibility]) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_VISIBILITY_MISMATCH, { source: "template" });
  }
}

function assertTenantCompatible(left, right, source) {
  if (left && right && left !== right) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TENANT_MISMATCH, { source, expected: right, actual: left });
}

function mergeResolutionContext(descriptor, runtime, input, options) {
  const output = runtime.output || {};
  return {
    visibility: normalizeVisibility(options.visibility || input.visibility || descriptor.visibility),
    tenantId: nullableId(input.tenantId || descriptor.tenantId),
    organizationId: nullableId(input.organizationId || descriptor.organizationId),
    clientId: nullableId(input.clientId || descriptor.clientId),
    tournamentId: nullableId(input.tournamentId || descriptor.tournamentId),
    competitionId: nullableId(input.competitionId || descriptor.competitionId),
    eventId: nullableId(input.eventId || descriptor.eventId),
    sessionId: nullableId(input.sessionId || descriptor.sessionId),
    outputId: nullableId(input.outputId || descriptor.outputId || output.outputId || output.id),
    sessionThemeId: input.sessionThemeId || runtime.themeSelections.sessionThemeId,
    outputThemeId: input.outputThemeId || output.themeId || runtime.themeSelections.outputThemeId,
    competitionThemeId: input.competitionThemeId || runtime.themeSelections.competitionThemeId,
    tournamentThemeId: input.tournamentThemeId || runtime.themeSelections.tournamentThemeId,
    clientThemeId: input.clientThemeId || runtime.themeSelections.clientThemeId,
    organizationThemeId: input.organizationThemeId || runtime.themeSelections.organizationThemeId,
    tenantThemeId: input.tenantThemeId || runtime.themeSelections.tenantThemeId,
    globalThemeId: input.globalThemeId || runtime.themeSelections.globalThemeId,
    themeSelections: runtime.themeSelections
  };
}

function normalizeResolution(value, options = {}) {
  if (isThemeResolution(value)) {
    const cloned = safeClone(value).value;
    assertThemeStatusAllowed(cloned.resolvedTheme, cloned.selectionReason || options.selectionReason || "explicit");
    return cloned;
  }
  if (isRecord(value) && value.themeId && value.colors) {
    assertThemeStatusAllowed(value, options.selectionReason || "explicit");
    return {
      resolutionVersion: THEME_TEMPLATE_INTEGRATION_VERSION,
      themeId: value.themeId,
      themeVersion: value.themeVersion,
      themeScope: value.scope || "global",
      effectiveScopeKey: getBroadcastThemeEffectiveScopeKey(value),
      selectionReason: "provided-resolved-theme",
      fallbackUsed: false,
      resolvedFrom: [...(value.resolvedFrom || [value.themeId])],
      brandingStatus: value.metadata?.brandingStatus || "neutral",
      visibility: value.visibility || "production",
      resolvedTheme: safeClone(value).value,
      warnings: [],
      errors: []
    };
  }
  throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_RESOLVED);
}

function assertThemeStatusAllowed(theme, selectionReason) {
  const status = theme?.status;
  const explicit = selectionReason === "explicit" || selectionReason === "provided-resolved-theme";
  const publishedLifecycle = ["active", "published", "inactive", "deprecated"].includes(status);
  const publicationValid = !publishedLifecycle || Boolean(theme?.publishedAt);
  const allowed = (explicit ? EXPLICIT_THEME_STATUSES.has(status) : AUTOMATIC_THEME_STATUSES.has(status))
    && publicationValid;
  if (!allowed || status === "error") {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_STATUS_INVALID, {
      themeId: theme?.themeId || null,
      status,
      selectionReason
    });
  }
}

function normalizeThemedPreparation(value) {
  const cloned = safeClone(value).value;
  if (!isTemplatePreparation(cloned) || cloned.themedPreparationVersion !== THEME_TEMPLATE_INTEGRATION_VERSION || !cloned.themeId) {
    throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.PREPARATION_INVALID);
  }
  return cloned;
}

function isThemeResolution(value) {
  return isRecord(value) && value.resolutionVersion === THEME_TEMPLATE_INTEGRATION_VERSION && isRecord(value.resolvedTheme) && Boolean(value.themeId);
}

function isTemplatePreparation(value) {
  return isRecord(value)
    && typeof value.preparationVersion === "string"
    && isRecord(value.templateInstance)
    && Array.isArray(value.components)
    && Array.isArray(value.componentOrder)
    && Boolean(value.templateRenderId);
}

function isIntegration(value) {
  return Boolean(value && CONTEXTS.has(value));
}

function contextRuntime(context) {
  if (!isRecord(context) || !isRecord(context.themeRegistry)) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.CONTEXT_INVALID);
  return {
    themeRegistry: context.themeRegistry,
    assetRegistry: context.assetRegistry || {},
    output: context.output || {},
    themeSelections: context.themeSelections || {},
    productionVariables: context.productionVariables || {},
    broadcastContract: context.broadcastContract || {}
  };
}

function publicContextDescriptor(context) {
  return {
    visibility: normalizeVisibility(context?.visibility),
    tenantId: nullableId(context?.tenantId),
    organizationId: nullableId(context?.organizationId),
    clientId: nullableId(context?.clientId),
    tournamentId: nullableId(context?.tournamentId),
    competitionId: nullableId(context?.competitionId),
    eventId: nullableId(context?.eventId),
    sessionId: nullableId(context?.sessionId),
    outputId: nullableId(context?.output?.outputId || context?.output?.id || context?.outputId)
  };
}

function requireIntegration(integration, options = {}) {
  const runtime = CONTEXTS.get(integration);
  if (!runtime) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.CONTEXT_INVALID);
  if (runtime.state === "destroyed" && options.allowDestroyed !== true) throw integrationError(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.CONTEXT_DESTROYED);
  return runtime;
}

function setState(integration, runtime, state, now) {
  if (!THEME_TEMPLATE_INTEGRATION_STATES.includes(state)) return;
  runtime.state = state;
  integration.state = state;
  integration.updatedAt = normalizeNow(now);
}

function failIntegration(integration, runtime, error, now) {
  const code = error?.code || error?.message || "theme-template-error";
  integration.errors = uniqueStrings([...(integration.errors || []), code]);
  setState(integration, runtime, "error", now);
}

function syncRenderedIds(integration, runtime) {
  integration.renderedIds = [...runtime.renders.keys()];
  integration.warnings = getThemeTemplateWarnings(integration);
}

function aggregateState(runtime) {
  return [...runtime.renders.values()].some((record) => record.result.state === "partially_rendered") ? "partially_rendered" : "rendered";
}

function sanitizeSnapshot(value, visibility) {
  const cloned = safeClone(value, {
    omitRuntime: true,
    keyFilter: (key) => {
      const normalized = key.toLowerCase();
      if (SECRET_KEYS.has(normalized) || EXECUTABLE_KEYS.has(normalized)) return false;
      if (visibility === "public" && PUBLIC_PRIVATE_KEYS.has(normalized)) return false;
      return true;
    }
  }).value || {};
  return cloned;
}

function safeClone(value, options = {}) {
  const warnings = [];
  const seen = new WeakSet();
  const clone = (input, depth, path) => {
    if (input === null || input === undefined || typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
      if (typeof input === "number" && !Number.isFinite(input)) { warnings.push(`${path}:non-finite-number-removed`); return undefined; }
      return typeof input === "string" ? input.slice(0, MAX_TEXT_LENGTH) : input;
    }
    if (["function", "symbol", "bigint"].includes(typeof input)) { warnings.push(`${path}:non-serializable-removed`); return undefined; }
    if (options.omitRuntime && isRuntimeReference(input)) { warnings.push(`${path}:runtime-reference-removed`); return undefined; }
    if (depth > MAX_DEPTH) { warnings.push(`${path}:depth-limited`); return undefined; }
    if (seen.has(input)) { warnings.push(`${path}:cycle-removed`); return undefined; }
    seen.add(input);
    if (Array.isArray(input)) {
      return input.slice(0, MAX_ARRAY_ITEMS).map((entry, index) => clone(entry, depth + 1, `${path}[${index}]`)).filter((entry) => entry !== undefined);
    }
    const output = {};
    const descriptors = Object.getOwnPropertyDescriptors(input);
    Object.keys(descriptors).slice(0, MAX_OBJECT_KEYS).forEach((key) => {
      if (DANGEROUS_KEYS.has(key) || EXECUTABLE_KEYS.has(key.toLowerCase())) { warnings.push(`${path}.${key}:key-removed`); return; }
      if (options.keyFilter && options.keyFilter(key, path) === false) return;
      const descriptor = descriptors[key];
      if (!Object.hasOwn(descriptor, "value")) { warnings.push(`${path}.${key}:accessor-removed`); return; }
      const next = clone(descriptor.value, depth + 1, `${path}.${key}`);
      if (next !== undefined) output[key] = next;
    });
    return output;
  };
  return { value: clone(value, 0, "value"), warnings };
}

function isRuntimeReference(value) {
  return Boolean(value && typeof value === "object" && (
    value.nodeType || value.window === value || value.documentElement || typeof value.addEventListener === "function"
  ));
}

function containsRuntimeReference(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (isRuntimeReference(value)) return true;
  return Object.values(value).some((entry) => containsRuntimeReference(entry, seen));
}

function containsUnsafeSnapshotValue(value, seen = new WeakSet()) {
  if (typeof value === "string") return UNSAFE_TEXT.test(value);
  if (!value || typeof value !== "object") return ["function", "symbol", "bigint"].includes(typeof value);
  if (seen.has(value)) return false;
  seen.add(value);
  return Object.entries(value).some(([key, entry]) => DANGEROUS_KEYS.has(key) || EXECUTABLE_KEYS.has(key.toLowerCase()) || containsUnsafeSnapshotValue(entry, seen));
}

function buildSafeFontFamily(typography) {
  const values = [typography.family, ...(Array.isArray(typography.fallbacks) ? typography.fallbacks : [])]
    .filter((value) => typeof value === "string" && value.trim() !== "" && isSafeFontFamily(value));
  return values.length ? values.join(", ") : undefined;
}

function isSafeFontFamily(value) {
  return typeof value === "string" && value.length <= 300 && !/[{};<>]|@import|@font-face|\burl\s*\(|(?:javascript|file|data|https?):/i.test(value);
}

function isSafeColor(value) {
  return typeof value === "string" && SAFE_COLOR.test(value);
}

function normalizeShadow(value, warnings) {
  if (!isRecord(value) || !isSafeColor(value.color)) return null;
  const numeric = ["x", "y", "blur", "spread"].every((field) => value[field] === undefined || Number.isFinite(value[field]));
  if (!numeric) { warnings.push("theme-shadow-invalid"); return null; }
  const opacity = Number.isFinite(value.opacity) ? Math.max(0, Math.min(1, value.opacity)) : 1;
  const color = applyHexOpacity(value.color, opacity);
  return { x: value.x || 0, y: value.y || 0, blur: value.blur || 0, spread: value.spread || 0, color };
}

function applyHexOpacity(color, opacity) {
  if (color === "transparent" || opacity >= 1) return color;
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}

function formatNumber(value) {
  return Number(value.toFixed(4)).toString();
}

function normalizeVisibility(value) {
  return VISIBILITIES.includes(value) ? value : "production";
}

function normalizeId(value) {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return SAFE_ID.test(text) ? text : "";
}

function nullableId(value) {
  return normalizeId(value) || null;
}

function isSafeId(value) {
  return Boolean(normalizeId(value));
}

function normalizeNow(value) {
  if (typeof value === "string" && isIso(value)) return value;
  return new Date().toISOString();
}

function isIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function buildId(prefix, now, random = Math.random) {
  const timestamp = Date.parse(normalizeNow(now));
  const entropy = Math.floor(Math.max(0, Math.min(0.999999, Number(random?.()) || 0)) * 1e8).toString(36).padStart(5, "0");
  return `${prefix}_${timestamp.toString(36)}_${entropy}`;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value.length).map((value) => value.slice(0, 500)))];
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validationResult(errors = [], warnings = []) {
  return {
    valid: errors.length === 0,
    errors: uniqueStrings(errors),
    warnings: uniqueStrings(warnings),
    integrationVersion: THEME_TEMPLATE_INTEGRATION_VERSION
  };
}

function integrationError(code, details = {}) {
  return new BroadcastThemeTemplateIntegrationError(code, details);
}

function buildPreparationError(errors) {
  const code = errors.includes(THEME_TEMPLATE_INTEGRATION_ERROR_CODES.REQUIRED_ASSET_UNAVAILABLE)
    ? THEME_TEMPLATE_INTEGRATION_ERROR_CODES.REQUIRED_ASSET_UNAVAILABLE
    : THEME_TEMPLATE_INTEGRATION_ERROR_CODES.PREPARATION_INVALID;
  return integrationError(code, { errors });
}
