import {
  instantiateBroadcastTemplate,
  cloneTemplateResult
} from "./templateEngine.js?v=20260714-template-engine-001-template-v1";
import {
  RENDERABLE_COMPONENT_TYPES,
  cloneComponentRenderResult,
  createComponentRenderer,
  destroyComponentRenderer,
  getRenderedComponent,
  removeBroadcastComponentRender,
  renderBroadcastComponent,
  updateBroadcastComponentRender,
  validateComponentRenderTarget
} from "./componentRenderer.js?v=20260714-component-renderer-001-renderer-v1";
import {
  cloneComponentInstance,
  validateComponentInstance
} from "./componentLibrary.js?v=20260713-component-library-001-components-v1";

export const TEMPLATE_RENDERER_INTEGRATION_VERSION = "1.0.0";

export const TEMPLATE_RENDERER_INTEGRATION_STATES = Object.freeze([
  "uninitialized",
  "ready",
  "preparing",
  "prepared",
  "rendering",
  "rendered",
  "updating",
  "partially_rendered",
  "cleared",
  "destroyed",
  "error"
]);

export const TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES = Object.freeze({
  INVALID_TARGET: "template-renderer-target-invalid",
  INVALID_INTEGRATION: "template-renderer-integration-invalid",
  INTEGRATION_DESTROYED: "template-renderer-integration-destroyed",
  PREPARATION_INVALID: "template-renderer-preparation-invalid",
  PREPARATION_BLOCKED: "template-renderer-preparation-blocked",
  TEMPLATE_DUPLICATE: "template-renderer-template-duplicate",
  TEMPLATE_NOT_FOUND: "template-renderer-template-not-found",
  OUTPUT_MISMATCH: "template-renderer-output-mismatch",
  VISIBILITY_MISMATCH: "template-renderer-visibility-mismatch",
  TENANT_MISMATCH: "template-renderer-tenant-mismatch",
  COMPONENT_REQUIRED_FAILED: "template-renderer-required-component-failed",
  COMPONENT_RENDER_FAILED: "template-renderer-component-failed",
  SNAPSHOT_INVALID: "template-renderer-snapshot-invalid"
});

const INTEGRATION_CONTEXTS = new WeakMap();
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ALWAYS_PRIVATE_KEYS = new Set(["password", "token", "secret", "credentials", "signedurl", "apikey", "authorization", "cookie"]);
const PUBLIC_PRIVATE_KEYS = new Set([
  "actor", "createdby", "updatedby", "tenantid", "organizationid", "clientid", "sessionid",
  "operatorid", "userid", "judgeid"
]);
const MAX_DEPTH = 14;
const MAX_ARRAY_ITEMS = 250;
const MAX_OBJECT_KEYS = 500;
const MAX_COMPONENTS = 100;
const MAX_TEXT_LENGTH = 10000;

export class BroadcastTemplateRendererIntegrationError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastTemplateRendererIntegrationError";
    this.code = code;
    this.details = cloneSafe(details) || {};
  }
}

export function validateTemplateRendererIntegrationTarget(target, options = {}) {
  const validation = validateComponentRenderTarget(target, options);
  const errors = [...(validation.errors || [])];
  const warnings = [...(validation.warnings || [])];
  if (target?.tagName && ["IFRAME", "OBJECT", "EMBED", "SCRIPT", "SVG"].includes(String(target.tagName).toUpperCase())) {
    errors.push(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.INVALID_TARGET);
  }
  return validationResult(errors, warnings);
}

export function createTemplateRendererIntegration(target, options = {}) {
  const validation = validateTemplateRendererIntegrationTarget(target, options);
  if (!validation.valid) throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.INVALID_TARGET, { errors: validation.errors });
  const now = normalizeNow(options.now);
  const documentRef = target.ownerDocument;
  const resolution = normalizeResolution(options);
  const visibility = normalizeVisibility(options.visibility);
  const integrationId = normalizeId(options.integrationId) || buildId("tri", now, options.random);
  const root = documentRef.createElement("div");
  root.className = "cp-template-renderer-integration-root";
  safeAttribute(root, "data-template-renderer-integration-id", integrationId);
  setStyle(root, "position", "absolute");
  setStyle(root, "inset", "0");
  setStyle(root, "width", "100%");
  setStyle(root, "height", "100%");
  setStyle(root, "overflow", "hidden");

  const rendererHost = documentRef.createElement("div");
  rendererHost.className = "cp-template-renderer-integration-host";
  setStyle(rendererHost, "position", "absolute");
  setStyle(rendererHost, "inset", "0");
  setStyle(rendererHost, "width", "100%");
  setStyle(rendererHost, "height", "100%");
  setStyle(rendererHost, "pointerEvents", "none");
  root.appendChild(rendererHost);
  target.appendChild(root);

  const ownsRenderer = !options.renderer;
  const renderer = options.renderer || createComponentRenderer(rendererHost, {
    rendererId: normalizeId(options.rendererId) || `${integrationId}_renderer`,
    outputId: normalizeId(options.outputId) || "template_preview",
    width: resolution.width,
    height: resolution.height,
    orientation: normalizeOrientation(options.orientation, resolution),
    safeArea: normalizeSafeArea(options.safeArea),
    visibility,
    allowDisconnected: options.allowDisconnected === true,
    now
  });

  const integration = {
    integrationVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
    integrationId,
    rendererId: renderer.rendererId,
    outputId: renderer.outputId,
    resolution,
    orientation: normalizeOrientation(options.orientation || renderer.orientation, resolution),
    safeArea: normalizeSafeArea(options.safeArea || renderer.safeArea),
    visibility,
    tenantId: nullableId(options.tenantId),
    state: "ready",
    ownsRenderer,
    renderedTemplateIds: [],
    warnings: uniqueStrings(validation.warnings),
    errors: [],
    createdAt: now,
    updatedAt: now
  };
  INTEGRATION_CONTEXTS.set(integration, {
    target,
    document: documentRef,
    root,
    rendererHost,
    renderer,
    ownsRenderer,
    renders: new Map(),
    sequence: 0,
    state: "ready"
  });
  return integration;
}

export function destroyTemplateRendererIntegration(integration, options = {}) {
  const context = requireIntegration(integration, { allowDestroyed: true });
  if (context.state === "destroyed") return integration;
  clearIntegrationInternal(integration, context, options);
  if (context.ownsRenderer && context.renderer?.state !== "destroyed") destroyComponentRenderer(context.renderer, options);
  context.root?.remove?.();
  context.target = null;
  context.document = null;
  context.root = null;
  context.rendererHost = null;
  context.state = "destroyed";
  setIntegrationState(integration, context, "destroyed", options.now);
  return integration;
}

export function prepareTemplateRender(templateOrResult, context = {}, options = {}) {
  const now = normalizeNow(options.now);
  const safeInput = cloneSafe(templateOrResult) || {};
  const visibility = normalizeVisibility(options.visibility || safeInput.templateInstance?.visibility);
  const sources = normalizeTemplateSources(context);
  const result = isTemplateResult(safeInput)
    ? cloneTemplateResult(safeInput)
    : instantiateBroadcastTemplate(safeInput, sources, {
        visibility,
        tenantId: nullableId(options.tenantId || context.tenantId),
        organizationId: nullableId(options.organizationId || context.organizationId),
        tournamentId: nullableId(options.tournamentId || context.tournamentId),
        competitionId: nullableId(options.competitionId || context.competitionId),
        templateInstanceId: nullableId(options.templateInstanceId),
        now
      });
  const templateInstance = cloneSafe(result.templateInstance) || {};
  const output = normalizePreparedOutput(options);
  const warnings = uniqueStrings(result.warnings || []);
  const errors = uniqueStrings(result.errors || []);
  const tenantId = nullableId(options.tenantId || context.tenantId || templateInstance.tenantId);
  if (templateInstance.tenantId && tenantId && templateInstance.tenantId !== tenantId) {
    errors.push(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.TENANT_MISMATCH);
  }
  const rank = VISIBILITY_RANK[visibility];
  const fallbackComponents = isRecord(options.fallbackComponents) ? options.fallbackComponents : {};
  const preparedComponents = (Array.isArray(result.components) ? result.components : [])
    .slice(0, MAX_COMPONENTS)
    .map((instance, declaredIndex) => prepareComponent(instance, result.componentBindings?.[instance.instanceId], fallbackComponents[instance.instanceId], declaredIndex, rank))
    .filter(Boolean);

  preparedComponents.forEach((component) => {
    warnings.push(...component.warnings);
    if (component.required) errors.push(...component.errors);
    else warnings.push(...component.errors.map((error) => `optional:${error}`));
  });
  const sorted = [...preparedComponents].sort(comparePreparedComponents);
  if ((Array.isArray(result.components) ? result.components.length : 0) !== preparedComponents.length) {
    warnings.push("template-render-component-visibility-filtered");
  }
  const preparation = {
    preparationVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
    preparationId: normalizeId(options.preparationId) || buildId("trp", now, options.random),
    state: errors.length ? "error" : "prepared",
    status: errors.length ? "error" : "prepared",
    templateInstance,
    templateId: templateInstance.templateId,
    templateInstanceId: templateInstance.templateInstanceId,
    templateType: templateInstance.templateType,
    templateRenderId: normalizeId(options.templateRenderId) || normalizeId(`template_render_${templateInstance.templateInstanceId || templateInstance.templateId}`),
    visibility,
    tenantId,
    output,
    outputId: output.outputId,
    resolution: cloneSafe(output.resolution),
    orientation: output.orientation,
    safeArea: cloneSafe(output.safeArea),
    layout: normalizeTemplateLayout(templateInstance.layout),
    resolvedBindings: cloneSafe(result.resolvedBindings) || {},
    components: sorted,
    componentInstances: sorted.map((component) => cloneComponentInstance(component.instance)),
    componentOrder: sorted.map((component) => component.instance.instanceId),
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors),
    preparedAt: now
  };
  return cloneSafe(preparation);
}

export function renderTemplateInstance(integration, preparedInput, options = {}) {
  const context = requireIntegration(integration);
  const prepared = normalizePreparation(preparedInput, options);
  assertPreparationForIntegration(integration, prepared);
  if (context.renders.has(prepared.templateRenderId)) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.TEMPLATE_DUPLICATE, { templateRenderId: prepared.templateRenderId });
  }
  const now = normalizeNow(options.now);
  setIntegrationState(integration, context, "rendering", now);
  const root = createTemplateRoot(integration, context, prepared);
  const record = createTemplateRecord(prepared, root, now);
  try {
    prepared.components.forEach((component) => renderPreparedComponent(integration, context, record, component, options));
    reorderTemplateNodes(record, prepared.componentOrder);
    finalizeTemplateRecord(integration, context, record, now);
    context.renders.set(record.templateRenderId, record);
    syncIntegration(integration, context, now);
    return cloneTemplateRenderResult(record.result, { includeRoot: options.includeRoot === true });
  } catch (error) {
    rollbackRecord(context, record, options);
    root.remove?.();
    const code = error?.code || TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_RENDER_FAILED;
    integration.errors = uniqueStrings([...(integration.errors || []), code]);
    setIntegrationState(integration, context, "error", now);
    throw error;
  }
}

export function updateTemplateRender(integration, templateRenderId, preparedInput, contextOrOptions = {}, maybeOptions = {}) {
  const context = requireIntegration(integration);
  const id = normalizeId(templateRenderId);
  const record = context.renders.get(id);
  if (!record) throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.TEMPLATE_NOT_FOUND, { templateRenderId: id });
  const split = splitUpdateArguments(contextOrOptions, maybeOptions);
  const options = { ...split.options, context: split.context, templateRenderId: id };
  const prepared = normalizePreparation(preparedInput, options);
  assertPreparationStructure(prepared);
  if (preparationRequiresRendererReconfiguration(integration, prepared)) {
    reconfigureOwnedIntegrationRenderer(integration, context, record, prepared, options);
  }
  assertPreparationForIntegration(integration, prepared);
  const now = normalizeNow(options.now);
  setIntegrationState(integration, context, "updating", now);

  const nextIds = new Set(prepared.components.map((component) => component.instance.instanceId));
  [...record.components.entries()].forEach(([instanceId, current]) => {
    if (nextIds.has(instanceId)) return;
    removeBroadcastComponentRender(context.renderer, current.renderId, { now });
    record.components.delete(instanceId);
  });

  prepared.components.forEach((component) => updatePreparedComponent(integration, context, record, component, options));
  record.prepared = cloneSafe(prepared);
  record.layout = cloneSafe(prepared.layout);
  record.componentOrder = [...prepared.componentOrder];
  applyTemplateRootLayout(record.root, integration, prepared.layout);
  reorderTemplateNodes(record, prepared.componentOrder);
  record.updatedAt = now;
  finalizeTemplateRecord(integration, context, record, now);
  syncIntegration(integration, context, now);
  return cloneTemplateRenderResult(record.result, { includeRoot: options.includeRoot === true });
}

export function removeTemplateRender(integration, templateRenderId, options = {}) {
  const context = requireIntegration(integration);
  const id = normalizeId(templateRenderId);
  const record = context.renders.get(id);
  if (!record) return { templateRenderId: id, removed: false, status: "not_found" };
  rollbackRecord(context, record, options);
  record.root?.remove?.();
  context.renders.delete(id);
  setIntegrationState(integration, context, context.renders.size ? aggregateIntegrationState(context) : "cleared", options.now);
  syncIntegration(integration, context, options.now);
  return { templateRenderId: id, removed: true, status: "removed" };
}

export function clearTemplateRendererIntegration(integration, options = {}) {
  const context = requireIntegration(integration);
  const removedCount = clearIntegrationInternal(integration, context, options);
  setIntegrationState(integration, context, "cleared", options.now);
  syncIntegration(integration, context, options.now);
  return { integrationId: integration.integrationId, cleared: true, removedCount, state: integration.state };
}

export function getRenderedTemplate(integration, templateRenderId, options = {}) {
  const context = requireIntegration(integration);
  const record = context.renders.get(normalizeId(templateRenderId));
  return record ? cloneTemplateRenderResult(record.result, options) : null;
}

export function listRenderedTemplates(integration, options = {}) {
  const context = requireIntegration(integration);
  return [...context.renders.values()]
    .sort((left, right) => left.sequence - right.sequence || left.templateRenderId.localeCompare(right.templateRenderId))
    .map((record) => cloneTemplateRenderResult(record.result, options));
}

export function getTemplateRenderWarnings(integrationOrResult) {
  const context = INTEGRATION_CONTEXTS.get(integrationOrResult);
  if (context) {
    return uniqueStrings([
      ...(integrationOrResult.warnings || []),
      ...[...context.renders.values()].flatMap((record) => record.result.warnings || [])
    ]);
  }
  return uniqueStrings(integrationOrResult?.warnings || []);
}

export function getTemplateRenderErrors(integrationOrResult) {
  const context = INTEGRATION_CONTEXTS.get(integrationOrResult);
  if (context) {
    return uniqueStrings([
      ...(integrationOrResult.errors || []),
      ...[...context.renders.values()].flatMap((record) => record.result.errors || [])
    ]);
  }
  return uniqueStrings(integrationOrResult?.errors || []);
}

export function buildTemplateRenderSnapshot(integration, options = {}) {
  const context = requireIntegration(integration);
  const visibility = normalizeVisibility(options.visibility || integration.visibility);
  const snapshot = {
    snapshotVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
    integrationVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
    generatedAt: normalizeNow(options.now),
    visibility,
    integrationId: integration.integrationId,
    rendererId: integration.rendererId,
    outputId: integration.outputId,
    resolution: cloneSafe(integration.resolution),
    orientation: integration.orientation,
    safeArea: cloneSafe(integration.safeArea),
    templateRenderIds: [...context.renders.keys()],
    integration: {
      integrationId: integration.integrationId,
      rendererId: integration.rendererId,
      outputId: integration.outputId,
      resolution: cloneSafe(integration.resolution),
      orientation: integration.orientation,
      safeArea: cloneSafe(integration.safeArea),
      visibility,
      tenantId: integration.tenantId,
      state: integration.state,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt
    },
    templates: [...context.renders.values()]
      .sort((left, right) => left.sequence - right.sequence || left.templateRenderId.localeCompare(right.templateRenderId))
      .map((record) => snapshotTemplateRecord(record, visibility)),
    warnings: getTemplateRenderWarnings(integration),
    errors: getTemplateRenderErrors(integration)
  };
  return sanitizeSnapshot(snapshot, visibility);
}

export function validateTemplateRenderSnapshot(snapshot) {
  const errors = [];
  if (!isRecord(snapshot)) return validationResult([TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.SNAPSHOT_INVALID], []);
  if (snapshot.snapshotVersion !== TEMPLATE_RENDERER_INTEGRATION_VERSION) errors.push("template-render-snapshot-version-invalid");
  if (!isIso(snapshot.generatedAt)) errors.push("template-render-snapshot-timestamp-invalid");
  if (!Object.hasOwn(VISIBILITY_RANK, snapshot.visibility)) errors.push("template-render-snapshot-visibility-invalid");
  if (!isRecord(snapshot.integration) || !isSafeId(snapshot.integration.integrationId)) errors.push("template-render-snapshot-integration-invalid");
  if (!Array.isArray(snapshot.templates)) errors.push("template-render-snapshot-templates-invalid");
  if (!Array.isArray(snapshot.warnings) || !Array.isArray(snapshot.errors)) errors.push("template-render-snapshot-diagnostics-invalid");
  if (containsRuntimeReference(snapshot)) errors.push("template-render-snapshot-runtime-reference-forbidden");
  return validationResult(errors, []);
}

export function cloneTemplateRenderResult(result, options = {}) {
  if (!isRecord(result)) return null;
  return {
    resultVersion: result.resultVersion,
    templateRenderResultVersion: result.templateRenderResultVersion || result.resultVersion,
    templateRenderId: result.templateRenderId,
    integrationId: result.integrationId,
    rendererId: result.rendererId,
    templateInstanceId: result.templateInstanceId,
    templateId: result.templateId,
    templateType: result.templateType,
    outputId: result.outputId,
    visibility: result.visibility,
    tenantId: result.tenantId,
    state: result.state,
    status: result.status || result.state,
    componentCount: result.componentCount,
    renderedCount: result.renderedCount,
    failedCount: result.failedCount,
    componentOrder: [...(result.componentOrder || [])],
    components: (result.components || []).map((component) => cloneSafe(component)),
    componentRenderIds: [...(result.componentRenderIds || [])],
    componentResults: (result.componentResults || result.components || []).map((component) => cloneSafe(component)),
    resolution: cloneSafe(result.resolution),
    orientation: result.orientation,
    safeArea: cloneSafe(result.safeArea),
    root: options.includeRoot === true ? result.root || result.rootNode || null : null,
    rootNode: options.includeRoot === true ? result.rootNode || result.root || null : null,
    warnings: uniqueStrings(result.warnings),
    errors: uniqueStrings(result.errors),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  };
}

function prepareComponent(instanceInput, bindingInput, fallbackInput, declaredIndex, visibilityRank) {
  const instance = cloneComponentInstance(instanceInput);
  const validation = validateComponentInstance(instance);
  const warnings = uniqueStrings([...(validation.warnings || []), ...(bindingInput?.warnings || [])]);
  const errors = uniqueStrings([...(validation.errors || []), ...(bindingInput?.errors || [])]);
  const required = instance.metadata?.required === true || (instance.bindings || []).some((binding) => binding.required === true);
  let fallbackInstance = null;
  if (fallbackInput) {
    const fallbackValidation = validateComponentInstance(fallbackInput);
    if (fallbackValidation.valid && RENDERABLE_COMPONENT_TYPES.includes(fallbackInput.componentType)) fallbackInstance = cloneComponentInstance(fallbackInput);
    else warnings.push("template-render-fallback-invalid");
  }
  if (VISIBILITY_RANK[normalizeVisibility(instance.visibility)] > visibilityRank) {
    warnings.push("template-render-component-visibility-filtered");
    return null;
  }
  if (!RENDERABLE_COMPONENT_TYPES.includes(instance.componentType)) {
    const code = `template-render-component-type-unsupported:${instance.componentType}`;
    if (required && !fallbackInstance) errors.push(code);
    else warnings.push(code);
  }
  return {
    instance,
    resolvedBindings: cloneSafe(bindingInput?.values) || {},
    resolvedContent: cloneSafe(bindingInput?.content) || {},
    required,
    fallbackInstance,
    declaredIndex,
    zIndex: finiteInteger(instance.layout?.zIndex, 0),
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors)
  };
}

function comparePreparedComponents(left, right) {
  return left.declaredIndex - right.declaredIndex
    || left.zIndex - right.zIndex
    || left.instance.instanceId.localeCompare(right.instance.instanceId);
}

function normalizePreparation(input, options) {
  if (input?.preparationVersion === TEMPLATE_RENDERER_INTEGRATION_VERSION) return cloneSafe(input);
  if (options.context) return prepareTemplateRender(input, options.context, options);
  throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_INVALID);
}

function splitUpdateArguments(contextOrOptions, maybeOptions) {
  if (arguments.length > 1 && isRecord(maybeOptions) && Object.keys(maybeOptions).length) {
    return { context: isRecord(contextOrOptions) ? contextOrOptions : {}, options: maybeOptions };
  }
  const candidate = isRecord(contextOrOptions) ? contextOrOptions : {};
  const isContext = ["productionVariables", "variables", "broadcastContract", "contract", "assetManager", "assets"]
    .some((key) => Object.hasOwn(candidate, key));
  return isContext ? { context: candidate, options: {} } : { context: candidate.context || {}, options: candidate };
}

function assertPreparationForIntegration(integration, prepared) {
  assertPreparationStructure(prepared);
  if (prepared.output?.outputId && prepared.output.outputId !== integration.outputId) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.OUTPUT_MISMATCH, { expected: integration.outputId, received: prepared.output.outputId });
  }
  if (prepared.visibility !== integration.visibility) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.VISIBILITY_MISMATCH, { expected: integration.visibility, received: prepared.visibility });
  }
  if (integration.tenantId && prepared.tenantId && integration.tenantId !== prepared.tenantId) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.TENANT_MISMATCH);
  }
}

function assertPreparationStructure(prepared) {
  if (!isRecord(prepared) || prepared.preparationVersion !== TEMPLATE_RENDERER_INTEGRATION_VERSION || !isSafeId(prepared.templateRenderId)) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_INVALID);
  }
  if (!Array.isArray(prepared.components) || prepared.components.length > MAX_COMPONENTS) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_INVALID, { reason: "components-invalid" });
  }
  const instanceIds = new Set();
  prepared.components.forEach((component) => {
    const validation = validateComponentInstance(component?.instance);
    const instanceId = component?.instance?.instanceId;
    if (!validation.valid || !isSafeId(instanceId) || instanceIds.has(instanceId)) {
      throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_INVALID, {
        reason: instanceIds.has(instanceId) ? "component-instance-duplicate" : "component-instance-invalid",
        errors: validation.errors
      });
    }
    instanceIds.add(instanceId);
    if (component.required && !RENDERABLE_COMPONENT_TYPES.includes(component.instance.componentType) && !component.fallbackInstance) {
      throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_BLOCKED, { instanceId, reason: "required-component-unsupported" });
    }
  });
  if (prepared.errors?.length) throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.PREPARATION_BLOCKED, { errors: prepared.errors });
}

function preparationRequiresRendererReconfiguration(integration, prepared) {
  return prepared.output?.outputId !== integration.outputId
    || prepared.visibility !== integration.visibility
    || prepared.output?.resolution?.width !== integration.resolution.width
    || prepared.output?.resolution?.height !== integration.resolution.height;
}

function reconfigureOwnedIntegrationRenderer(integration, context, record, prepared, options) {
  if (!context.ownsRenderer || context.renders.size !== 1 || !context.renders.has(record.templateRenderId)) {
    const code = prepared.visibility !== integration.visibility
      ? TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.VISIBILITY_MISMATCH
      : TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.OUTPUT_MISMATCH;
    throw integrationError(code, { reason: context.ownsRenderer ? "multiple-template-renders" : "external-renderer" });
  }
  rollbackRecord(context, record, options);
  if (context.renderer?.state !== "destroyed") destroyComponentRenderer(context.renderer, options);
  const resolution = normalizeResolution(prepared.output || {});
  const safeArea = normalizeSafeArea(prepared.output?.safeArea);
  const orientation = normalizeOrientation(prepared.output?.orientation, resolution);
  const visibility = normalizeVisibility(prepared.visibility);
  context.renderer = createComponentRenderer(context.rendererHost, {
    rendererId: integration.rendererId,
    outputId: prepared.output.outputId,
    width: resolution.width,
    height: resolution.height,
    orientation,
    safeArea,
    visibility,
    now: options.now
  });
  integration.outputId = context.renderer.outputId;
  integration.resolution = resolution;
  integration.orientation = orientation;
  integration.safeArea = safeArea;
  integration.visibility = visibility;
  record.components.clear();
  applyTemplateRootLayout(record.root, integration, prepared.layout);
}

function createTemplateRoot(integration, context, prepared) {
  const root = context.document.createElement("div");
  root.className = "cp-template-render-root";
  safeAttribute(root, "data-template-render-id", prepared.templateRenderId);
  safeAttribute(root, "data-template-type", prepared.templateInstance.templateType || "custom");
  context.root.appendChild(root);
  applyTemplateRootLayout(root, integration, prepared.layout);
  return root;
}

function applyTemplateRootLayout(root, integration, layout) {
  const resolution = integration.resolution;
  const targetWidth = Number(root.parentNode?.clientWidth) || resolution.width;
  const targetHeight = Number(root.parentNode?.clientHeight) || resolution.height;
  const scale = Math.min(targetWidth / resolution.width, targetHeight / resolution.height);
  const offsetX = Math.max(0, (targetWidth - (resolution.width * scale)) / 2);
  const offsetY = Math.max(0, (targetHeight - (resolution.height * scale)) / 2);
  setStyle(root, "position", "absolute");
  setStyle(root, "left", `${offsetX}px`);
  setStyle(root, "top", `${offsetY}px`);
  setStyle(root, "width", `${resolution.width}px`);
  setStyle(root, "height", `${resolution.height}px`);
  setStyle(root, "transform", `scale(${scale})`);
  setStyle(root, "transformOrigin", "top left");
  setStyle(root, "overflow", layout.clip ? "hidden" : "visible");
  setStyle(root, "zIndex", String(finiteInteger(layout.zIndex, 0)));
  setStyle(root, "display", layout.mode === "grid" ? "grid" : ["row", "column", "stack"].includes(layout.mode) ? "flex" : "block");
  if (["row", "column", "stack"].includes(layout.mode)) setStyle(root, "flexDirection", layout.mode === "row" ? "row" : "column");
  if (layout.mode === "grid") setStyle(root, "gridTemplateColumns", `repeat(${positiveInteger(layout.columns, 1)}, minmax(0, 1fr))`);
  setStyle(root, "gap", `${nonNegativeFinite(layout.gap, 0)}px`);
  setStyle(root, "alignItems", flexAlignment(layout.align));
  setStyle(root, "justifyContent", flexJustification(layout.justify));
  safeAttribute(root, "data-layout-mode", layout.mode);
}

function createTemplateRecord(prepared, root, now) {
  return {
    templateRenderId: prepared.templateRenderId,
    sequence: 0,
    root,
    prepared: cloneSafe(prepared),
    layout: cloneSafe(prepared.layout),
    componentOrder: [...prepared.componentOrder],
    components: new Map(),
    warnings: [...prepared.warnings],
    errors: [],
    createdAt: now,
    updatedAt: now,
    result: null
  };
}

function renderPreparedComponent(integration, context, record, component, options) {
  const instanceId = component.instance.instanceId;
  const renderId = buildComponentRenderId(record.templateRenderId, instanceId);
  if (!RENDERABLE_COMPONENT_TYPES.includes(component.instance.componentType)) {
    handleComponentFailure(integration, context, record, component, renderId, integrationError(
      TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_RENDER_FAILED,
      { instanceId, componentType: component.instance.componentType }
    ), options);
    return;
  }
  try {
    const result = renderBroadcastComponent(context.renderer, component.instance, componentRenderOptions(component, renderId, { ...options, tenantId: integration.tenantId }));
    attachComponentResult(record, component, result, false);
  } catch (error) {
    handleComponentFailure(integration, context, record, component, renderId, error, options);
  }
}

function updatePreparedComponent(integration, context, record, component, options) {
  const instanceId = component.instance.instanceId;
  const current = record.components.get(instanceId);
  if (!current) {
    renderPreparedComponent(integration, context, record, component, options);
    return;
  }
  if (!RENDERABLE_COMPONENT_TYPES.includes(component.instance.componentType)) {
    removeBroadcastComponentRender(context.renderer, current.renderId, options);
    record.components.delete(instanceId);
    handleComponentFailure(integration, context, record, component, current.renderId, integrationError(
      TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_RENDER_FAILED,
      { instanceId, componentType: component.instance.componentType }
    ), options);
    return;
  }
  try {
    const result = updateBroadcastComponentRender(context.renderer, current.renderId, component.instance, componentRenderOptions(component, current.renderId, { ...options, tenantId: integration.tenantId }));
    attachComponentResult(record, component, result, false);
  } catch (error) {
    handleComponentFailure(integration, context, record, component, current.renderId, error, options);
  }
}

function componentRenderOptions(component, renderId, options) {
  return {
    renderId,
    resolvedBindings: component.resolvedBindings,
    resolvedContent: component.resolvedContent,
    resolvedAssets: normalizeResolvedAssets(options.resolvedAssets, options.tenantId),
    allowBlobAssets: options.allowBlobAssets === true,
    allowExternalAssets: options.allowExternalAssets === true,
    now: options.now
  };
}

function handleComponentFailure(integration, context, record, component, renderId, error, options) {
  if (component.fallbackInstance) {
    try {
      const current = getRenderedComponent(context.renderer, renderId);
      const result = current
        ? updateBroadcastComponentRender(context.renderer, renderId, component.fallbackInstance, componentRenderOptions(component, renderId, { ...options, tenantId: integration.tenantId }))
        : renderBroadcastComponent(context.renderer, component.fallbackInstance, componentRenderOptions(component, renderId, { ...options, tenantId: integration.tenantId }));
      record.warnings.push(`template-render-fallback-used:${component.instance.instanceId}`);
      attachComponentResult(record, component, result, true);
      return;
    } catch (fallbackError) {
      record.errors.push(fallbackError?.code || TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_RENDER_FAILED);
    }
  }
  const code = error?.code || TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_RENDER_FAILED;
  if (component.required) {
    throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.COMPONENT_REQUIRED_FAILED, { instanceId: component.instance.instanceId, cause: code });
  }
  record.errors.push(`${code}:${component.instance.instanceId}`);
  record.components.set(component.instance.instanceId, {
    instanceId: component.instance.instanceId,
    renderId,
    componentType: component.instance.componentType,
    required: false,
    fallbackUsed: false,
    result: null,
    node: null,
    status: "failed"
  });
}

function attachComponentResult(record, component, result, fallbackUsed) {
  const cloned = cloneComponentRenderResult(result);
  if (result.node) record.root.appendChild(result.node);
  record.components.set(component.instance.instanceId, {
    instanceId: component.instance.instanceId,
    renderId: result.renderId,
    componentType: component.instance.componentType,
    required: component.required,
    fallbackUsed,
    result: cloned,
    node: result.node || null,
    status: fallbackUsed ? "fallback" : "rendered"
  });
  record.warnings.push(...(result.warnings || []));
  record.errors.push(...(result.errors || []));
}

function reorderTemplateNodes(record, componentOrder) {
  componentOrder.forEach((instanceId) => {
    const node = record.components.get(instanceId)?.node;
    if (node) record.root.appendChild(node);
  });
}

function finalizeTemplateRecord(integration, context, record, now) {
  if (!record.sequence) record.sequence = ++context.sequence;
  const components = record.componentOrder
    .map((instanceId) => record.components.get(instanceId))
    .filter(Boolean)
    .map(componentRecordSnapshot);
  const failedCount = components.filter((component) => component.status === "failed").length;
  const fallbackCount = components.filter((component) => component.fallbackUsed).length;
  const state = failedCount || fallbackCount ? "partially_rendered" : "rendered";
  record.result = {
    resultVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
    templateRenderResultVersion: TEMPLATE_RENDERER_INTEGRATION_VERSION,
    templateRenderId: record.templateRenderId,
    integrationId: integration.integrationId,
    rendererId: integration.rendererId,
    templateInstanceId: record.prepared.templateInstance.templateInstanceId,
    templateId: record.prepared.templateInstance.templateId,
    templateType: record.prepared.templateInstance.templateType,
    outputId: integration.outputId,
    visibility: integration.visibility,
    tenantId: record.prepared.tenantId,
    state,
    status: state,
    componentCount: record.prepared.components.length,
    renderedCount: components.filter((component) => component.status !== "failed").length,
    failedCount,
    componentOrder: [...record.componentOrder],
    components,
    componentRenderIds: components.filter((component) => component.status !== "failed").map((component) => component.renderId),
    componentResults: components,
    resolution: cloneSafe(integration.resolution),
    orientation: integration.orientation,
    safeArea: cloneSafe(integration.safeArea),
    root: record.root,
    rootNode: record.root,
    warnings: uniqueStrings(record.warnings),
    errors: uniqueStrings(record.errors),
    createdAt: record.createdAt,
    updatedAt: now
  };
  record.updatedAt = now;
  setIntegrationState(integration, context, state, now);
}

function componentRecordSnapshot(component) {
  return {
    instanceId: component.instanceId,
    renderId: component.renderId,
    componentType: component.componentType,
    required: component.required,
    fallbackUsed: component.fallbackUsed,
    status: component.status,
    warnings: uniqueStrings(component.result?.warnings || []),
    errors: uniqueStrings(component.result?.errors || [])
  };
}

function snapshotTemplateRecord(record, visibility) {
  const result = record.result;
  return {
    templateRenderId: result.templateRenderId,
    templateInstanceId: result.templateInstanceId,
    templateId: result.templateId,
    templateType: result.templateType,
    outputId: result.outputId,
    visibility,
    tenantId: result.tenantId,
    state: result.state,
    layout: cloneSafe(record.layout),
    componentCount: result.componentCount,
    renderedCount: result.renderedCount,
    failedCount: result.failedCount,
    componentOrder: [...result.componentOrder],
    components: result.components.map((component) => cloneSafe(component)),
    resolvedBindings: cloneSafe(record.prepared.resolvedBindings) || {},
    componentBindings: Object.fromEntries(record.prepared.components.map((component) => [
      component.instance.instanceId,
      cloneSafe(component.resolvedBindings) || {}
    ])),
    warnings: uniqueStrings(result.warnings),
    errors: uniqueStrings(result.errors),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  };
}

function rollbackRecord(context, record, options = {}) {
  record.components.forEach((component) => removeBroadcastComponentRender(context.renderer, component.renderId, options));
  record.components.clear();
}

function clearIntegrationInternal(integration, context, options = {}) {
  const records = [...context.renders.values()];
  records.forEach((record) => {
    rollbackRecord(context, record, options);
    record.root?.remove?.();
  });
  context.renders.clear();
  syncIntegration(integration, context, options.now);
  return records.length;
}

function syncIntegration(integration, context, now) {
  integration.renderedTemplateIds = [...context.renders.keys()];
  integration.warnings = getTemplateRenderWarnings(integration);
  integration.errors = getTemplateRenderErrors(integration);
  integration.updatedAt = normalizeNow(now);
}

function setIntegrationState(integration, context, state, now) {
  context.state = state;
  integration.state = state;
  integration.updatedAt = normalizeNow(now);
}

function aggregateIntegrationState(context) {
  return [...context.renders.values()].some((record) => record.result?.state === "partially_rendered") ? "partially_rendered" : "rendered";
}

function requireIntegration(integration, options = {}) {
  const context = INTEGRATION_CONTEXTS.get(integration);
  if (!context) throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.INVALID_INTEGRATION);
  if (!options.allowDestroyed && context.state === "destroyed") throw integrationError(TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES.INTEGRATION_DESTROYED);
  return context;
}

function normalizeTemplateSources(context) {
  const safeContext = cloneSafe(context) || {};
  if (!isRecord(safeContext)) return { productionVariables: {}, broadcastContract: {}, assetManager: {} };
  return {
    productionVariables: cloneSafe(safeContext.productionVariables || safeContext.variables) || {},
    broadcastContract: cloneSafe(safeContext.broadcastContract || safeContext.contract) || {},
    assetManager: cloneSafe(safeContext.assetManager || safeContext.assets) || {}
  };
}

function normalizeResolvedAssets(input, tenantId) {
  const safeInput = cloneSafe(input) || {};
  if (!isRecord(safeInput)) return {};
  const result = {};
  Object.entries(safeInput).slice(0, MAX_ARRAY_ITEMS).forEach(([key, value]) => {
    if (!isSafeId(key) || !isRecord(value) || value.authorized !== true) return;
    if (tenantId && value.tenantId && value.tenantId !== tenantId) return;
    const url = safeAssetUrl(value.url, value.allowExternal === true, value.blobAuthorized === true);
    if (!url) return;
    result[key] = {
      assetId: normalizeId(value.assetId) || key,
      url,
      authorized: true,
      allowExternal: value.allowExternal === true,
      blobAuthorized: value.blobAuthorized === true
    };
  });
  return result;
}

function safeAssetUrl(value, allowExternal, allowBlob) {
  if (typeof value !== "string" || value.length > 2048) return null;
  if (/^blob:/i.test(value)) return allowBlob ? value : null;
  if (/^(?:javascript|data|file|vbscript):/i.test(value) || /^\/\//.test(value)) return null;
  if (/^https?:/i.test(value) && !allowExternal) return null;
  return value;
}

function normalizePreparedOutput(options) {
  const resolution = normalizeResolution(options);
  return {
    outputId: normalizeId(options.outputId) || "template_preview",
    outputType: normalizeId(options.outputType) || "preview",
    resolution,
    orientation: normalizeOrientation(options.orientation, resolution),
    safeArea: normalizeSafeArea(options.safeArea)
  };
}

function normalizeResolution(options) {
  const source = options.resolution || {};
  return {
    width: positiveInteger(options.width ?? source.width, 1920),
    height: positiveInteger(options.height ?? source.height, 1080)
  };
}

function normalizeSafeArea(value) {
  const source = isRecord(value) ? value : {};
  return {
    top: nonNegativeFinite(source.top, 0),
    right: nonNegativeFinite(source.right, 0),
    bottom: nonNegativeFinite(source.bottom, 0),
    left: nonNegativeFinite(source.left, 0)
  };
}

function normalizeTemplateLayout(value) {
  const source = isRecord(value) ? value : {};
  return {
    mode: ["absolute", "stack", "row", "column", "grid", "overlay", "safe_area"].includes(source.mode) ? source.mode : "absolute",
    zIndex: finiteInteger(source.zIndex, 0),
    gap: nonNegativeFinite(source.gap, 0),
    columns: positiveInteger(source.columns, 1),
    rows: positiveInteger(source.rows, 1),
    clip: source.clip === true,
    safeArea: cloneSafe(source.safeArea) || {},
    padding: cloneSafe(source.padding) || {},
    margin: cloneSafe(source.margin) || {},
    align: typeof source.align === "string" ? source.align : "stretch",
    justify: typeof source.justify === "string" ? source.justify : "start",
    anchor: typeof source.anchor === "string" ? source.anchor : "center"
  };
}

function normalizeOrientation(value, resolution) {
  if (["landscape", "portrait", "panoramic"].includes(value)) return value;
  if (resolution.width > resolution.height * 2) return "panoramic";
  return resolution.width >= resolution.height ? "landscape" : "portrait";
}

function sanitizeSnapshot(value, visibility) {
  const sanitized = cloneSafe(value, { visibility, sanitizeSnapshot: true, sanitizePrivate: visibility === "public" });
  return sanitized || {};
}

function cloneSafe(value, options = {}, depth = 0, ancestors = new WeakSet()) {
  if (value === null) return null;
  if (["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "number" && !Number.isFinite(value)) return undefined;
    if (options.sanitizeSnapshot && typeof value === "string" && /^\s*(?:javascript|file|data:text\/html|vbscript):/i.test(value)) return undefined;
    return typeof value === "string" ? value.slice(0, MAX_TEXT_LENGTH) : value;
  }
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
  if (depth > MAX_DEPTH || typeof value !== "object" || containsRuntimeReference(value)) return undefined;
  if (ancestors.has(value)) return undefined;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const result = [];
    for (let index = 0; index < Math.min(value.length, MAX_ARRAY_ITEMS); index += 1) {
      const descriptor = descriptors[index];
      if (!descriptor || !Object.hasOwn(descriptor, "value")) continue;
      const cloned = cloneSafe(descriptor.value, options, depth + 1, ancestors);
      if (cloned !== undefined) result.push(cloned);
    }
    ancestors.delete(value);
    return result;
  }
  const result = {};
  Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key)) return;
    const normalizedKey = key.toLowerCase();
    if (ALWAYS_PRIVATE_KEYS.has(normalizedKey)) return;
    if (options.sanitizePrivate && PUBLIC_PRIVATE_KEYS.has(normalizedKey)) return;
    if (!Object.hasOwn(descriptor, "value")) return;
    const cloned = cloneSafe(descriptor.value, options, depth + 1, ancestors);
    if (cloned !== undefined) result[key] = cloned;
  });
  ancestors.delete(value);
  return result;
}

function containsRuntimeReference(value) {
  if (!value || typeof value !== "object") return false;
  let current = value;
  for (let depth = 0; current && depth < 6; depth += 1) {
    const descriptors = Object.getOwnPropertyDescriptors(current);
    if (descriptors.nodeType || descriptors.ownerDocument || descriptors.window || descriptors.appendChild) return true;
    current = Object.getPrototypeOf(current);
  }
  return false;
}

function isTemplateResult(value) {
  return isRecord(value?.templateInstance) && Array.isArray(value?.components);
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validationResult(errors, warnings) {
  return { valid: errors.length === 0, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), version: TEMPLATE_RENDERER_INTEGRATION_VERSION };
}

function integrationError(code, details) {
  return new BroadcastTemplateRendererIntegrationError(code, details);
}

function normalizeVisibility(value) {
  return Object.hasOwn(VISIBILITY_RANK, value) ? value : "production";
}

function normalizeId(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 160);
  return normalized || null;
}

function nullableId(value) {
  return normalizeId(value) || null;
}

function isSafeId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,159}$/.test(value);
}

function buildId(prefix, now, random = Math.random) {
  const stamp = Date.parse(now) || Date.now();
  const entropy = Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * 1e8).toString(36).padStart(5, "0");
  return `${prefix}_${stamp}_${entropy}`;
}

function buildComponentRenderId(templateRenderId, instanceId) {
  return normalizeId(`${templateRenderId}__${instanceId}`).slice(0, 160);
}

function normalizeNow(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function isIso(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function finiteInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && Number.isFinite(number) ? number : fallback;
}

function nonNegativeFinite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function flexAlignment(value) {
  return ({ start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" })[value] || "stretch";
}

function flexJustification(value) {
  return ({ start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between", "space-around": "space-around", "space-evenly": "space-evenly" })[value] || "flex-start";
}

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value))];
}

function safeAttribute(node, name, value) {
  if (typeof node?.setAttribute === "function") node.setAttribute(name, String(value));
}

function setStyle(node, property, value) {
  if (node?.style) node.style[property] = String(value);
}
